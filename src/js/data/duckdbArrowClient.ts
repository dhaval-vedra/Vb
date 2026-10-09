import { tableFromIPC } from 'apache-arrow';

// State to store DuckDB & Apache Arrow live metrics
export const duckdbMetrics = {
    isInitialized: false,
    lastQueryTimeMs: 0,
    lastRowCount: 0,
    lastJsonBytes: 0,
    lastArrowBytes: 0,
    lastSpeedupRatio: 1.0,
    engineName: 'DuckDB OLAP (Server-Side)',
    protocolName: 'Apache Arrow IPC Binary Stream',
    isDuckDbActive: true // Enabled by default for ultra-high performance
};

export interface DuckDBQueryResult {
    filteredData: Record<string, any>[];
    stats: {
        duckdbTimeMs: number;
        totalClientTimeMs: number;
        arrowRows: number;
        jsonBytes: number;
        arrowBytes: number;
        speedupRatio: number;
    };
}

export interface RawSQLResult {
    rows: Record<string, any>[];
    rowCount: number;
    timeMs: number;
    jsonBytes: number;
    arrowBytes: number;
}

let isSyncing = false;

/**
 * Initialize / sync dataset with server-side DuckDB in-memory OLAP table
 */
export async function syncDatasetToDuckDB(userId: string, rawData: any[], retryCount = 1): Promise<any> {
    if (!userId || !rawData || rawData.length === 0) return null;
    if (isSyncing) return null;

    isSyncing = true;
    try {
        console.log(`[DuckDB Client] Syncing ${rawData.length} rows to DuckDB OLAP engine...`);
        const startTime = performance.now();
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);

        const response = await fetch('/api/duckdb/init', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, rawData }),
            signal: controller.signal
        }).catch((fetchErr) => {
            clearTimeout(timeoutId);
            throw fetchErr;
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            console.warn(`[DuckDB Client] Server status ${response.status} during table initialization. Defaulting to local mode.`);
            duckdbMetrics.isInitialized = false;
            updateDuckDBMetricsUI();
            return null;
        }

        const result = await response.json();
        const duration = performance.now() - startTime;

        if (result && result.success) {
            duckdbMetrics.isInitialized = true;
            duckdbMetrics.lastRowCount = result.rowCount || rawData.length;
            updateDuckDBMetricsUI();
            console.log(`[DuckDB Client] Table synced in ${duration.toFixed(2)}ms:`, result.message);
            return result;
        } else {
            console.warn('[DuckDB Client] Server initialization note:', result?.error || 'Unknown error');
            duckdbMetrics.isInitialized = false;
            updateDuckDBMetricsUI();
            return null;
        }
    } catch (err: any) {
        if (retryCount > 0) {
            // One gentle retry with exponential backoff in case the server was still booting
            await new Promise((res) => setTimeout(res, 800));
            isSyncing = false;
            return syncDatasetToDuckDB(userId, rawData, retryCount - 1);
        }
        console.info('[DuckDB Client] Operating in resilient local mode (Server sync deferred):', err?.message || err);
        duckdbMetrics.isInitialized = false;
        updateDuckDBMetricsUI();
        return null;
    } finally {
        isSyncing = false;
    }
}

/**
 * Convert Apache Arrow Table to a standard array of JavaScript objects safely
 */
export function arrowTableToObjects(table: any): Record<string, any>[] {
    if (!table || table.numRows === 0) return [];
    
    try {
        const rows: Record<string, any>[] = [];
        const schemaFields = table.schema.fields.map((f: any) => f.name);
        
        for (let i = 0; i < table.numRows; i++) {
            const rowObj: Record<string, any> = {};
            for (const fieldName of schemaFields) {
                const vector = table.getChild(fieldName);
                if (vector) {
                    const val = vector.get(i);
                    if (typeof val === 'bigint') {
                        rowObj[fieldName] = Number(val);
                    } else if (val instanceof Date) {
                        rowObj[fieldName] = val.toISOString();
                    } else if (val === null || val === undefined) {
                        rowObj[fieldName] = '';
                    } else {
                        rowObj[fieldName] = val;
                    }
                } else {
                    rowObj[fieldName] = '';
                }
            }
            rows.push(rowObj);
        }
        return rows;
    } catch (e) {
        console.warn('[Apache Arrow] Error converting Arrow table to objects:', e);
        return [];
    }
}

/**
 * Query DuckDB and stream back Apache Arrow Binary IPC Stream
 */
export async function queryDuckDBArrowIPC(
    userId: string, 
    filterState: any, 
    rawData: any[] | null = null, 
    customSql: string | null = null
): Promise<DuckDBQueryResult | null> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

    try {
        const startTime = performance.now();
        
        const requestBody: Record<string, any> = {
            userId: userId || 'guest_user',
            filterState: filterState || {},
            customSql: customSql || null
        };

        if (rawData && Array.isArray(rawData)) {
            requestBody.rawData = rawData;
        }

        const response = await fetch('/api/duckdb/query-arrow', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            const errText = await response.text().catch(() => '');
            console.warn(`[DuckDB Client] Query response status ${response.status}: ${errText}. Using local engine.`);
            return null;
        }

        // Read headers for performance metrics
        const duckdbTimeMs = parseFloat(response.headers.get('x-duckdb-time-ms') || '0');
        const arrowRows = parseInt(response.headers.get('x-arrow-rows') || '0', 10);
        const jsonBytes = parseInt(response.headers.get('x-json-bytes') || '0', 10);
        const arrowBytes = parseInt(response.headers.get('x-arrow-bytes') || '0', 10);
        const speedupRatio = parseFloat(response.headers.get('x-speedup-ratio') || '1.0');

        // Receive Binary Buffer
        const arrayBuffer = await response.arrayBuffer();
        const clientDecodeStart = performance.now();

        // Non-blocking async yield before memory decoding
        await new Promise((resolve) => setTimeout(resolve, 0));

        // Decode Apache Arrow Binary IPC Stream
        let decodedRows: Record<string, any>[] = [];
        try {
            const uint8Array = new Uint8Array(arrayBuffer);
            const arrowTable = tableFromIPC(uint8Array);
            decodedRows = arrowTableToObjects(arrowTable);
        } catch (workerErr) {
            console.warn('[Apache Arrow] Worker/IPC decode fallback:', workerErr);
            return null;
        }

        const totalClientTimeMs = performance.now() - startTime;

        // Update metrics
        duckdbMetrics.lastQueryTimeMs = parseFloat(duckdbTimeMs.toFixed(2));
        duckdbMetrics.lastRowCount = arrowRows;
        duckdbMetrics.lastJsonBytes = jsonBytes;
        duckdbMetrics.lastArrowBytes = arrowBytes || arrayBuffer.byteLength;
        duckdbMetrics.lastSpeedupRatio = speedupRatio;

        updateDuckDBMetricsUI();

        console.log(`[Apache Arrow] Stream decoded in ${(performance.now() - clientDecodeStart).toFixed(2)}ms! Total HTTP+Decode: ${totalClientTimeMs.toFixed(2)}ms. Arrow Size: ${(arrayBuffer.byteLength / 1024).toFixed(1)}KB vs JSON: ${(jsonBytes / 1024).toFixed(1)}KB (${speedupRatio}x speedup)`);

        return {
            filteredData: decodedRows,
            stats: {
                duckdbTimeMs,
                totalClientTimeMs,
                arrowRows,
                jsonBytes,
                arrowBytes: arrayBuffer.byteLength,
                speedupRatio
            }
        };
    } catch (err: any) {
        clearTimeout(timeoutId);
        console.info('[DuckDB Client] Query falling back to in-memory local processing:', err?.message || err);
        return null;
    }
}

/**
 * Execute raw SQL query on DuckDB and receive Apache Arrow stream
 */
export async function executeRawDuckDBSQL(userId: string, sqlQuery: string): Promise<RawSQLResult> {
    try {
        const response = await fetch('/api/duckdb/raw-sql', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: userId || 'guest_user', sql: sqlQuery })
        });

        if (!response.ok) {
            const errJson = await response.json().catch(() => ({ error: 'SQL Query execution failed' }));
            throw new Error(errJson.error || 'SQL Query execution failed');
        }

        const arrayBuffer = await response.arrayBuffer();
        await new Promise((resolve) => setTimeout(resolve, 0));
        const arrowTable = tableFromIPC(new Uint8Array(arrayBuffer));
        const rows = arrowTableToObjects(arrowTable);

        const duckdbTimeMs = parseFloat(response.headers.get('x-duckdb-time-ms') || '0');
        const jsonBytes = parseInt(response.headers.get('x-json-bytes') || '0', 10);
        const arrowBytes = parseInt(response.headers.get('x-arrow-bytes') || '0', 10);

        return {
            rows,
            rowCount: rows.length,
            timeMs: duckdbTimeMs,
            jsonBytes,
            arrowBytes
        };
    } catch (err) {
        console.warn('[DuckDB Client] Error in executeRawDuckDBSQL:', err);
        throw err;
    }
}

/**
 * Execute DuckDB OLAP In-Memory Summary Rollup with Apache Arrow IPC stream
 */
export async function queryDuckDBSummaryRollup(
    userId: string,
    summaryConfig: any,
    rawData?: any[]
): Promise<DuckDBQueryResult | null> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    try {
        const startTime = performance.now();
        const requestBody: Record<string, any> = {
            userId: userId || 'guest_user',
            summaryConfig
        };
        if (rawData && Array.isArray(rawData) && rawData.length > 0) {
            requestBody.rawData = rawData;
        }

        const response = await fetch('/api/duckdb/summary-rollup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            console.warn(`[DuckDB Client] Summary Rollup HTTP status ${response.status}. Defaulting to worker/in-memory.`);
            return null;
        }

        const duckdbTimeMs = parseFloat(response.headers.get('x-duckdb-time-ms') || '0');
        const arrowRows = parseInt(response.headers.get('x-arrow-rows') || '0', 10);
        const jsonBytes = parseInt(response.headers.get('x-json-bytes') || '0', 10);
        const arrowBytes = parseInt(response.headers.get('x-arrow-bytes') || '0', 10);
        const speedupRatio = parseFloat(response.headers.get('x-speedup-ratio') || '1.0');

        const arrayBuffer = await response.arrayBuffer();
        await new Promise((resolve) => setTimeout(resolve, 0));

        const uint8Array = new Uint8Array(arrayBuffer);
        const arrowTable = tableFromIPC(uint8Array);
        const decodedRows = arrowTableToObjects(arrowTable);
        const totalClientTimeMs = performance.now() - startTime;

        duckdbMetrics.lastQueryTimeMs = parseFloat(duckdbTimeMs.toFixed(2));
        duckdbMetrics.lastRowCount = arrowRows;
        duckdbMetrics.lastJsonBytes = jsonBytes;
        duckdbMetrics.lastArrowBytes = arrowBytes || arrayBuffer.byteLength;
        duckdbMetrics.lastSpeedupRatio = speedupRatio;
        updateDuckDBMetricsUI();

        console.log(`[DuckDB Summary] Rollup completed in ${duckdbTimeMs}ms (${decodedRows.length} rows, speedup: ${speedupRatio}x)`);

        return {
            filteredData: decodedRows,
            stats: {
                duckdbTimeMs,
                totalClientTimeMs,
                arrowRows,
                jsonBytes,
                arrowBytes: arrayBuffer.byteLength,
                speedupRatio
            }
        };
    } catch (err) {
        clearTimeout(timeoutId);
        console.info('[DuckDB Client] Summary Rollup defaulting to local worker execution:', err);
        return null;
    }
}

/**
 * Update UI Status elements for DuckDB & Apache Arrow
 */
export function updateDuckDBMetricsUI(): void {
    const badge = document.getElementById('duckdbModeStatus');
    const queryTimeLbl = document.getElementById('duckdbQueryTimeLbl');
    const arrowBytesLbl = document.getElementById('arrowBytesLbl');
    const compressionRatioLbl = document.getElementById('arrowCompressionRatioLbl');
    const rowCountLbl = document.getElementById('duckdbRowCountLbl');

    if (badge) {
        if (duckdbMetrics.isDuckDbActive && duckdbMetrics.isInitialized) {
            badge.className = 'badge bg-success text-white shadow-xs';
            badge.innerHTML = '<i class="bi bi-lightning-charge-fill me-1"></i> Active (DuckDB + Apache Arrow)';
        } else if (duckdbMetrics.isDuckDbActive) {
            badge.className = 'badge bg-primary text-white shadow-xs';
            badge.innerHTML = '<i class="bi bi-cpu-fill me-1"></i> Client-Side Turbo (In-Memory)';
        } else {
            badge.className = 'badge bg-secondary text-white';
            badge.textContent = 'Local (Standard)';
        }
    }

    if (queryTimeLbl) queryTimeLbl.textContent = `${duckdbMetrics.lastQueryTimeMs} ms`;
    if (arrowBytesLbl) {
        const kb = (duckdbMetrics.lastArrowBytes / 1024).toFixed(1);
        arrowBytesLbl.textContent = `${kb} KB (IPC)`;
    }
    if (compressionRatioLbl) compressionRatioLbl.textContent = `${duckdbMetrics.lastSpeedupRatio}x Rapid`;
    if (rowCountLbl) rowCountLbl.textContent = `${duckdbMetrics.lastRowCount.toLocaleString()}`;
}

