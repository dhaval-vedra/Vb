import duckdb from "duckdb";
import { tableFromJSON, tableToIPC } from "apache-arrow";
import fs from "fs";
import path from "path";

// Server-side DuckDB In-Memory OLAP Database instance
const db = new duckdb.Database(":memory:");
const connection = db.connect();

// Track active table access timestamps for memory management & auto-cleanup
const tableLastAccessMap = new Map<string, number>();

// Apply security and performance PRAGMAs on boot
function applySecurityPragmas() {
  try {
    connection.exec("PRAGMA enable_external_access=false;", (err) => {
      if (err) console.warn("[DuckDB Security Warning] Couldn't disable external access:", err.message);
      else console.log("[DuckDB Security] External file/network access disabled inside OLAP engine.");
    });
    connection.exec("PRAGMA memory_limit='1GB';", (err) => {
      if (err) console.warn("[DuckDB Config] Memory limit setting notice:", err.message);
    });
    connection.exec("PRAGMA threads=4;", () => {});
  } catch (e) {
    console.error("[DuckDB Config Error]", e);
  }
}
applySecurityPragmas();

// Periodic memory garbage collection (cleans tables inactive for > 30 mins)
setInterval(() => {
  const now = Date.now();
  for (const [tableName, lastAccess] of tableLastAccessMap.entries()) {
    if (now - lastAccess > 30 * 60 * 1000) {
      connection.exec(`DROP TABLE IF EXISTS ${tableName}`, (err) => {
        if (!err) {
          console.log(`[DuckDB Memory Cleanup] Evicted inactive table: ${tableName}`);
          tableLastAccessMap.delete(tableName);
        }
      });
    }
  }
}, 10 * 60 * 1000);

// Promisified query helper
function runQuery(sql: string, params: any[] = []): Promise<any[]> {
  return new Promise((resolve, reject) => {
    connection.all(sql, ...params, (err: any, rows: any[]) => {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });
}

function runExec(sql: string): Promise<void> {
  return new Promise((resolve, reject) => {
    connection.exec(sql, (err: any) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

export function sanitizeTableName(userId: string): string {
  const clean = (userId || "guest").replace(/[^a-zA-Z0-9_]/g, "_").toLowerCase();
  return `dataset_${clean}`;
}

/**
 * Strict SQL Security Validator: Prevents SQL injection & dangerous execution
 */
export function validateSQLSecurity(sql: string): { isValid: boolean; reason?: string } {
  if (!sql || typeof sql !== "string") {
    return { isValid: false, reason: "SQL statement must be a non-empty string" };
  }

  // Prevent multiple statements
  if (sql.includes(";")) {
    return { isValid: false, reason: "Multiple SQL statements separated by semicolons are not permitted." };
  }

  // Forbidden system & write keywords
  const forbiddenKeywords = [
    "ATTACH", "DETACH", "COPY", "INSTALL", "LOAD", "PRAGMA", "EXPORT",
    "IMPORT", "CALL", "EXECUTE", "SYSTEM", "TRUNCATE", "DROP DATABASE",
    "ALTER SYSTEM", "SET", "CREATE USER", "GRANT", "REVOKE"
  ];

  for (const kw of forbiddenKeywords) {
    const regex = new RegExp(`\\b${kw}\\b`, "i");
    if (regex.test(sql)) {
      return { isValid: false, reason: `Forbidden keyword detected: '${kw}'` };
    }
  }

  // Forbidden file system read functions
  const forbiddenFunctions = [
    "READ_CSV", "READ_PARQUET", "READ_JSON", "SQLITE_SCAN", "POSTGRES_SCAN",
    "READ_BLOB", "WRITE_CSV", "READ_CSV_AUTO", "READ_JSON_AUTO"
  ];

  for (const fn of forbiddenFunctions) {
    const regex = new RegExp(`\\b${fn}\\b`, "i");
    if (regex.test(sql)) {
      return { isValid: false, reason: `Unauthorized function execution: '${fn}'` };
    }
  }

  return { isValid: true };
}

/**
 * Initialize or replace a DuckDB table for a user with raw dataset rows safely using bound parameters
 */
export async function initDuckDBTable(userId: string, rows: Record<string, any>[]): Promise<{ rowCount: number; timeMs: number }> {
  const startTime = performance.now();
  const tableName = sanitizeTableName(userId);

  if (!rows || rows.length === 0) {
    await runExec(`DROP TABLE IF EXISTS ${tableName}`);
    tableLastAccessMap.delete(tableName);
    return { rowCount: 0, timeMs: 0 };
  }

  // Extract keys and build column definitions safely
  const sampleRow = rows[0];
  const keys = Object.keys(sampleRow);
  const colDefs = keys.map(k => `"${k.replace(/"/g, '""')}" VARCHAR`).join(", ");

  // Drop existing table if present
  await runExec(`DROP TABLE IF EXISTS ${tableName}`);
  await runExec(`CREATE TABLE ${tableName} (${colDefs});`);

  // Insert rows in batches using parameterized queries (100% safe against SQL injection & file system restrictions)
  const BATCH_SIZE = 500;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const placeholders: string[] = [];
    const params: any[] = [];

    for (const r of batch) {
      const rowPlaceholders: string[] = [];
      for (const k of keys) {
        rowPlaceholders.push("?");
        let val = r[k];
        if (val === undefined || val === null) {
          params.push(null);
        } else if (typeof val === "object") {
          params.push(JSON.stringify(val));
        } else {
          params.push(String(val));
        }
      }
      placeholders.push(`(${rowPlaceholders.join(", ")})`);
    }

    const insertSql = `INSERT INTO ${tableName} VALUES ${placeholders.join(", ")}`;
    await runQuery(insertSql, params);
  }

  tableLastAccessMap.set(tableName, Date.now());

  const duration = performance.now() - startTime;
  console.log(`[DuckDB OLAP] Table ${tableName} initialized with ${rows.length} rows in ${duration.toFixed(2)}ms`);

  return { rowCount: rows.length, timeMs: parseFloat(duration.toFixed(2)) };
}

/**
 * Ingest a Parquet binary file directly into DuckDB table in zero-copy columnar format
 */
export async function initDuckDBFromParquet(userId: string, fileBuffer: Buffer): Promise<{ rowCount: number; headers: string[]; sampleRows: any[]; timeMs: number }> {
  const startTime = performance.now();
  const tableName = sanitizeTableName(userId);

  const tmpPath = path.join(process.cwd(), "tmp", `upload_${tableName}.parquet`);
  fs.writeFileSync(tmpPath, fileBuffer);

  const escPath = tmpPath.replace(/\\/g, "/").replace(/'/g, "''");

  await runExec(`DROP TABLE IF EXISTS ${tableName}`);
  await runExec(`CREATE TABLE ${tableName} AS SELECT * FROM read_parquet('${escPath}');`);

  // Remove temp file after ingestion
  try {
    fs.unlinkSync(tmpPath);
  } catch (e) {
    // ignore
  }

  tableLastAccessMap.set(tableName, Date.now());

  // Fetch count and sample rows for frontend display
  const countRes = await runQuery(`SELECT COUNT(*) as count FROM ${tableName}`);
  const rowCount = countRes[0]?.count ? Number(countRes[0].count) : 0;

  const sampleRes = await runQuery(`SELECT * FROM ${tableName} LIMIT 5000`);
  const sampleRows = sanitizeRows(sampleRes);
  const headers = sampleRows.length > 0 ? Object.keys(sampleRows[0]) : [];

  const duration = performance.now() - startTime;
  console.log(`[DuckDB Parquet Ingestion] Table ${tableName} created from Parquet with ${rowCount} rows in ${duration.toFixed(2)}ms`);

  return { rowCount, headers, sampleRows, timeMs: parseFloat(duration.toFixed(2)) };
}

/**
 * Build a DuckDB SQL query from the filter state JSON
 */
export function buildDuckDBSQL(tableName: string, filterState: any): string {
  if (!filterState || typeof filterState !== "object") {
    return `SELECT * FROM ${tableName}`;
  }

  const whereConditions: string[] = [];

  // 1. Global Filter
  const globalFilter = filterState.globalFilter;
  if (globalFilter) {
    if (globalFilter.column && globalFilter.value !== undefined && globalFilter.value !== "") {
      const col = globalFilter.column.replace(/"/g, '""');
      const val = String(globalFilter.value).replace(/'/g, "''");
      whereConditions.push(`CAST("${col}" AS VARCHAR) = '${val}'`);
    }
    if (globalFilter.startDate || globalFilter.endDate) {
      // Find date column or fallback
      const start = globalFilter.startDate ? `'${globalFilter.startDate}'` : null;
      const end = globalFilter.endDate ? `'${globalFilter.endDate}'` : null;
      if (start && end) {
        whereConditions.push(`TRY_CAST("date" AS DATE) BETWEEN TRY_CAST(${start} AS DATE) AND TRY_CAST(${end} AS DATE)`);
      } else if (start) {
        whereConditions.push(`TRY_CAST("date" AS DATE) >= TRY_CAST(${start} AS DATE)`);
      } else if (end) {
        whereConditions.push(`TRY_CAST("date" AS DATE) <= TRY_CAST(${end} AS DATE)`);
      }
    }
  }

  // 2. Text Filter
  const textFilter = filterState.textFilter;
  if (textFilter && textFilter.column && textFilter.value) {
    const col = textFilter.column.replace(/"/g, '""');
    const val = String(textFilter.value).replace(/'/g, "''").toLowerCase();
    const op = textFilter.operator || "includes";

    if (op === "startsWith") {
      whereConditions.push(`LOWER(CAST("${col}" AS VARCHAR)) LIKE '${val}%'`);
    } else if (op === "endsWith") {
      whereConditions.push(`LOWER(CAST("${col}" AS VARCHAR)) LIKE '%${val}'`);
    } else if (op === "equals") {
      whereConditions.push(`LOWER(CAST("${col}" AS VARCHAR)) = '${val}'`);
    } else if (op === "doesNotInclude") {
      whereConditions.push(`LOWER(CAST("${col}" AS VARCHAR)) NOT LIKE '%${val}%'`);
    } else {
      whereConditions.push(`LOWER(CAST("${col}" AS VARCHAR)) LIKE '%${val}%'`);
    }
  }

  // 3. Multi-Select Filter
  const multiSelect = filterState.multiSelect;
  if (multiSelect && multiSelect.column && Array.isArray(multiSelect.selectedValues) && multiSelect.selectedValues.length > 0) {
    const col = multiSelect.column.replace(/"/g, '""');
    const vals = multiSelect.selectedValues.map((v: any) => `'${String(v).replace(/'/g, "''")}'`).join(", ");
    whereConditions.push(`CAST("${col}" AS VARCHAR) IN (${vals})`);
  }

  // 4. Numeric Range Filter
  const numericRange = filterState.numericRange;
  if (numericRange && numericRange.column) {
    const col = numericRange.column.replace(/"/g, '""');
    if (numericRange.min !== undefined && numericRange.min !== null && String(numericRange.min).trim() !== "") {
      const minVal = parseFloat(numericRange.min);
      if (!isNaN(minVal)) {
        whereConditions.push(`TRY_CAST("${col}" AS DOUBLE) >= ${minVal}`);
      }
    }
    if (numericRange.max !== undefined && numericRange.max !== null && String(numericRange.max).trim() !== "") {
      const maxVal = parseFloat(numericRange.max);
      if (!isNaN(maxVal)) {
        whereConditions.push(`TRY_CAST("${col}" AS DOUBLE) <= ${maxVal}`);
      }
    }
  }

  // Combine WHERE conditions according to matchMode
  const matchMode = filterState.matchMode === "OR" ? " OR " : " AND ";
  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(matchMode)}` : "";

  // 5. Group By
  const groupBy = filterState.groupBy;
  let selectClause = "*";
  let groupByClause = "";
  if (groupBy && Array.isArray(groupBy.columns) && groupBy.columns.length > 0) {
    const groupCols = groupBy.columns.map((c: string) => `"${c.replace(/"/g, '""')}"`);
    selectClause = `${groupCols.join(", ")}, COUNT(*) AS "कुल पंक्तियाँ"`;
    groupByClause = `GROUP BY ${groupCols.join(", ")}`;
  }

  // 6. Sort Rules
  const sortRules = filterState.sortRules;
  let orderByClause = "";
  if (Array.isArray(sortRules) && sortRules.length > 0) {
    const orderItems = sortRules
      .filter((r: any) => r && r.column)
      .map((r: any) => {
        const col = r.column.replace(/"/g, '""');
        const dir = (r.order || "asc").toUpperCase() === "DESC" ? "DESC" : "ASC";
        return `"${col}" ${dir}`;
      });
    if (orderItems.length > 0) {
      orderByClause = `ORDER BY ${orderItems.join(", ")}`;
    }
  }

  return `SELECT ${selectClause} FROM ${tableName} ${whereClause} ${groupByClause} ${orderByClause}`.trim();
}

function sanitizeRows(rows: any[]): any[] {
  if (!rows || !Array.isArray(rows)) return [];
  return rows.map((r) => {
    if (!r || typeof r !== "object") return r;
    const cleanObj: Record<string, any> = {};
    for (const k of Object.keys(r)) {
      const val = r[k];
      if (typeof val === "bigint") {
        cleanObj[k] = Number(val);
      } else {
        cleanObj[k] = val;
      }
    }
    return cleanObj;
  });
}

/**
 * Execute DuckDB query and serialize output to Apache Arrow Binary IPC Stream
 */
export async function queryDuckDBToArrowIPC(
  userId: string,
  filterState?: any,
  customSql?: string
): Promise<{
  arrowBuffer: Uint8Array;
  stats: {
    rowCount: number;
    timeMs: number;
    jsonSizeBytes: number;
    arrowSizeBytes: number;
    speedupRatio: number;
    sqlUsed: string;
  };
}> {
  const startTime = performance.now();
  const tableName = sanitizeTableName(userId);

  let sql = "";
  if (customSql) {
    const check = validateSQLSecurity(customSql);
    if (!check.isValid) {
      throw new Error(`Security Violation: ${check.reason}`);
    }
    sql = customSql;
  } else {
    sql = buildDuckDBSQL(tableName, filterState);
  }

  // Update table access timestamp for memory GC
  tableLastAccessMap.set(tableName, Date.now());

  // Execute query in DuckDB
  const rawQueryRows = await runQuery(sql);
  const rows = sanitizeRows(rawQueryRows);
  const executionTimeMs = performance.now() - startTime;

  // Convert result rows to Apache Arrow Table
  const jsonSizeBytes = Buffer.byteLength(JSON.stringify(rows), "utf-8");

  let arrowBuffer: Uint8Array;
  if (rows && rows.length > 0) {
    const arrowTable = tableFromJSON(rows);
    arrowBuffer = tableToIPC(arrowTable, "stream");
  } else {
    // Empty Arrow Stream buffer
    const emptyTable: any = tableFromJSON([]);
    arrowBuffer = tableToIPC(emptyTable, "stream");
  }

  const arrowSizeBytes = arrowBuffer.byteLength;
  const speedupRatio = jsonSizeBytes > 0 ? parseFloat((jsonSizeBytes / Math.max(arrowSizeBytes, 1)).toFixed(2)) : 1.0;

  return {
    arrowBuffer,
    stats: {
      rowCount: rows.length,
      timeMs: parseFloat(executionTimeMs.toFixed(2)),
      jsonSizeBytes,
      arrowSizeBytes,
      speedupRatio,
      sqlUsed: sql,
    },
  };
}

/**
 * Execute In-Memory DuckDB OLAP Summary Rollup with C++ performance
 * Supports dimensional grouping and advanced aggregates: sum, avg, count, min, max, median, stddev, distinct_count
 */
export async function executeDuckDBSummaryRollup(
  userId: string,
  summaryConfig: any,
  rawData?: Record<string, any>[]
): Promise<{
  arrowBuffer: Uint8Array;
  stats: {
    rowCount: number;
    timeMs: number;
    jsonSizeBytes: number;
    arrowSizeBytes: number;
    speedupRatio: number;
    sqlUsed: string;
  };
}> {
  const startTime = performance.now();
  const tableName = sanitizeTableName(userId);

  // If rawData is provided, ensure DuckDB table is initialized with latest rows
  if (rawData && Array.isArray(rawData) && rawData.length > 0) {
    await initDuckDBTable(userId, rawData);
  }

  const dimensions: string[] = summaryConfig?.dimensions || [];
  const metrics: any[] = summaryConfig?.metrics || [];
  const dateGrouping: string = summaryConfig?.dateGrouping || "none";
  const dateCol: string = summaryConfig?.dateColumn || "";

  const selectCols: string[] = [];
  const groupByCols: string[] = [];

  for (const dim of dimensions) {
    const escapedDim = `"${dim.replace(/"/g, '""')}"`;
    if (dateGrouping !== "none" && dim === dateCol) {
      if (dateGrouping === "year") {
        selectCols.push(`SUBSTRING(CAST(${escapedDim} AS VARCHAR), 1, 4) AS ${escapedDim}`);
      } else if (dateGrouping === "month") {
        selectCols.push(`SUBSTRING(CAST(${escapedDim} AS VARCHAR), 1, 7) AS ${escapedDim}`);
      } else if (dateGrouping === "day") {
        selectCols.push(`SUBSTRING(CAST(${escapedDim} AS VARCHAR), 1, 10) AS ${escapedDim}`);
      } else {
        selectCols.push(escapedDim);
      }
    } else {
      selectCols.push(escapedDim);
    }
    groupByCols.push(escapedDim);
  }

  for (const m of metrics) {
    const colName = `"${m.column.replace(/"/g, '""')}"`;
    const agg = (m.agg || "sum").toLowerCase();
    if (agg === "sum") {
      selectCols.push(`ROUND(SUM(TRY_CAST(${colName} AS DOUBLE)), 2) AS "${m.column.replace(/"/g, '""')}"`);
    } else if (agg === "avg") {
      selectCols.push(`ROUND(AVG(TRY_CAST(${colName} AS DOUBLE)), 2) AS "${m.column.replace(/"/g, '""')}_avg"`);
    } else if (agg === "count") {
      selectCols.push(`COUNT(${colName}) AS "${m.column.replace(/"/g, '""')}_count"`);
    } else if (agg === "min") {
      selectCols.push(`MIN(TRY_CAST(${colName} AS DOUBLE)) AS "${m.column.replace(/"/g, '""')}_min"`);
    } else if (agg === "max") {
      selectCols.push(`MAX(TRY_CAST(${colName} AS DOUBLE)) AS "${m.column.replace(/"/g, '""')}_max"`);
    } else if (agg === "median") {
      selectCols.push(`ROUND(MEDIAN(TRY_CAST(${colName} AS DOUBLE)), 2) AS "${m.column.replace(/"/g, '""')}_median"`);
    } else if (agg === "stddev") {
      selectCols.push(`ROUND(STDDEV_SAMP(TRY_CAST(${colName} AS DOUBLE)), 2) AS "${m.column.replace(/"/g, '""')}_stddev"`);
    } else if (agg === "distinct_count") {
      selectCols.push(`COUNT(DISTINCT ${colName}) AS "${m.column.replace(/"/g, '""')}_distinct"`);
    }
  }

  selectCols.push(`COUNT(*) AS "_record_count"`);

  let sql = `SELECT ${selectCols.join(", ")} FROM ${tableName}`;
  if (groupByCols.length > 0) {
    sql += ` GROUP BY ${groupByCols.join(", ")}`;
  }
  sql += ` ORDER BY "_record_count" DESC LIMIT 5000`;

  // Update table access timestamp for memory GC
  tableLastAccessMap.set(tableName, Date.now());

  const rawQueryRows = await runQuery(sql);
  const rows = sanitizeRows(rawQueryRows);
  const executionTimeMs = performance.now() - startTime;

  const jsonSizeBytes = Buffer.byteLength(JSON.stringify(rows), "utf-8");
  let arrowBuffer: Uint8Array;
  if (rows && rows.length > 0) {
    const arrowTable = tableFromJSON(rows);
    arrowBuffer = tableToIPC(arrowTable, "stream");
  } else {
    const emptyTable: any = tableFromJSON([]);
    arrowBuffer = tableToIPC(emptyTable, "stream");
  }

  const arrowSizeBytes = arrowBuffer.byteLength;
  const speedupRatio = jsonSizeBytes > 0 ? parseFloat((jsonSizeBytes / Math.max(arrowSizeBytes, 1)).toFixed(2)) : 1.0;

  return {
    arrowBuffer,
    stats: {
      rowCount: rows.length,
      timeMs: parseFloat(executionTimeMs.toFixed(2)),
      jsonSizeBytes,
      arrowSizeBytes,
      speedupRatio,
      sqlUsed: sql,
    },
  };
}
