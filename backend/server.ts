import express from "express";
import path from "path";
import dotenv from "dotenv";
import fs from "fs";
import http from "http";
import { WebSocketServer, WebSocket } from "ws";
import multer from "multer";
import { spawn } from "child_process";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import { initDuckDBTable, queryDuckDBToArrowIPC, initDuckDBFromParquet, executeDuckDBSummaryRollup } from "./duckdbEngine.js";
import { generateChartSpec, recommendChartSpecs, generateChartSVG, createAsyncJob, getAsyncJobStatus, ChartConfigInput } from "./chartEngine.js";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "200mb" }));
app.use(express.urlencoded({ limit: "200mb", extended: true }));

const upload = multer({ limits: { fileSize: 500 * 1024 * 1024 } }); // 500MB limit

// Ensure tmp directory exists
const tmpDir = path.join(process.cwd(), "tmp");
if (!fs.existsSync(tmpDir)) {
  fs.mkdirSync(tmpDir, { recursive: true });
}

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// 1. Endpoint to upload large dataset
app.post("/api/upload-large-data", (req, res) => {
  try {
    const { userId, rawData } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }
    if (!rawData || !Array.isArray(rawData)) {
      return res.status(400).json({ error: "Missing rawData array" });
    }

    const dataPath = path.join(tmpDir, `rawData_${userId}.json`);
    fs.writeFileSync(dataPath, JSON.stringify(rawData, null, 2), "utf-8");

    res.json({ success: true, message: `Dataset of ${rawData.length} rows cached on server.`, path: dataPath });
  } catch (error: any) {
    console.error("Error in upload-large-data:", error);
    res.status(500).json({ error: error.message });
  }
});

// --- HEAVY-DUTY DUCKDB OLAP & APACHE ARROW BINARY ENDPOINTS ---

// 1. Initialize or Reload DuckDB In-Memory OLAP Table
app.post("/api/duckdb/init", async (req, res) => {
  try {
    const { userId, rawData } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }
    if (!rawData || !Array.isArray(rawData)) {
      return res.status(400).json({ error: "Missing rawData array" });
    }

    const result = await initDuckDBTable(userId, rawData);
    res.json({
      success: true,
      engine: "DuckDB In-Memory OLAP Engine",
      rowCount: result.rowCount,
      executionTimeMs: result.timeMs,
      message: `DuckDB OLAP Table initialized with ${result.rowCount} rows in ${result.timeMs}ms.`,
    });
  } catch (error: any) {
    console.error("Error in /api/duckdb/init:", error);
    res.status(500).json({ error: error.message });
  }
});

// 1b. Direct High-Speed Parquet Columnar File Upload Endpoint
app.post("/api/upload-parquet", upload.single("file"), async (req, res) => {
  try {
    const userId = req.body.userId || "default_user";
    const multerFile = (req as any).file;
    if (!multerFile || !multerFile.buffer) {
      return res.status(400).json({ error: "No Parquet file uploaded" });
    }

    const result = await initDuckDBFromParquet(userId, multerFile.buffer);
    res.json({
      success: true,
      engine: "DuckDB Direct Parquet Engine",
      rowCount: result.rowCount,
      headers: result.headers,
      sampleRows: result.sampleRows,
      executionTimeMs: result.timeMs,
      message: `Successfully loaded Parquet file with ${result.rowCount} rows in ${result.timeMs}ms.`
    });
  } catch (error: any) {
    console.error("Error in /api/upload-parquet:", error);
    res.status(500).json({ error: error.message });
  }
});

// 2. High-Speed OLAP Filter and Apache Arrow Binary Stream Export
app.post("/api/duckdb/query-arrow", async (req, res) => {
  try {
    const { userId, filterState, rawData, customSql } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }

    // If rawData is passed inline and needs initializing
    if (rawData && Array.isArray(rawData)) {
      await initDuckDBTable(userId, rawData);
    }

    const { arrowBuffer, stats } = await queryDuckDBToArrowIPC(userId, filterState, customSql);

    // Set performance headers
    res.setHeader("Content-Type", "application/vnd.apache.arrow.stream");
    res.setHeader("x-duckdb-time-ms", stats.timeMs.toString());
    res.setHeader("x-arrow-rows", stats.rowCount.toString());
    res.setHeader("x-json-bytes", stats.jsonSizeBytes.toString());
    res.setHeader("x-arrow-bytes", stats.arrowSizeBytes.toString());
    res.setHeader("x-speedup-ratio", stats.speedupRatio.toString());

    res.send(Buffer.from(arrowBuffer));
  } catch (error: any) {
    const isSecurityOrValidation = error.message && (
      error.message.includes("Security Violation:") ||
      error.message.includes("Missing")
    );

    if (isSecurityOrValidation) {
      console.warn(`[Security/Validation Warning] /api/duckdb/query-arrow: ${error.message}`);
      return res.status(400).json({ error: error.message });
    }

    console.error("Error in /api/duckdb/query-arrow:", error);
    res.status(500).json({ error: error.message });
  }
});

// 3. Raw SQL Execution with Apache Arrow Binary Stream output
app.post("/api/duckdb/raw-sql", async (req, res) => {
  try {
    const { userId, sql } = req.body;
    if (!userId || !sql) {
      return res.status(400).json({ error: "Missing userId or sql query" });
    }

    const { arrowBuffer, stats } = await queryDuckDBToArrowIPC(userId, null, sql);

    res.setHeader("Content-Type", "application/vnd.apache.arrow.stream");
    res.setHeader("x-duckdb-time-ms", stats.timeMs.toString());
    res.setHeader("x-arrow-rows", stats.rowCount.toString());
    res.setHeader("x-json-bytes", stats.jsonSizeBytes.toString());
    res.setHeader("x-arrow-bytes", stats.arrowSizeBytes.toString());
    res.setHeader("x-speedup-ratio", stats.speedupRatio.toString());

    res.send(Buffer.from(arrowBuffer));
  } catch (error: any) {
    const isSecurityOrValidation = error.message && (
      error.message.includes("Security Violation:") ||
      error.message.includes("Missing")
    );

    if (isSecurityOrValidation) {
      console.warn(`[Security/Validation Warning] /api/duckdb/raw-sql: ${error.message}`);
      return res.status(400).json({ error: error.message });
    }

    console.error("Error in /api/duckdb/raw-sql:", error);
    res.status(500).json({ error: error.message });
  }
});

// 4. DuckDB In-Memory OLAP Summary Rollup with Apache Arrow Binary Stream
app.post("/api/duckdb/summary-rollup", async (req, res) => {
  try {
    const { userId, summaryConfig, rawData } = req.body;
    if (!userId || !summaryConfig) {
      return res.status(400).json({ error: "Missing userId or summaryConfig" });
    }

    const { arrowBuffer, stats } = await executeDuckDBSummaryRollup(userId, summaryConfig, rawData);

    res.setHeader("Content-Type", "application/vnd.apache.arrow.stream");
    res.setHeader("x-duckdb-time-ms", stats.timeMs.toString());
    res.setHeader("x-arrow-rows", stats.rowCount.toString());
    res.setHeader("x-json-bytes", stats.jsonSizeBytes.toString());
    res.setHeader("x-arrow-bytes", stats.arrowSizeBytes.toString());
    res.setHeader("x-speedup-ratio", stats.speedupRatio.toString());

    res.send(Buffer.from(arrowBuffer));
  } catch (error: any) {
    console.error("Error in /api/duckdb/summary-rollup:", error);
    res.status(500).json({ error: error.message });
  }
});

// 2. Endpoint to filter data using Python filter_engine.py
app.post("/api/filter-large-data", (req, res) => {
  try {
    const { userId, filterState, rawData } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }

    const rawDataPath = path.join(tmpDir, `rawData_${userId}.json`);
    
    // If the frontend also sent rawData inline (optional), write/overwrite it
    if (rawData && Array.isArray(rawData)) {
      fs.writeFileSync(rawDataPath, JSON.stringify(rawData, null, 2), "utf-8");
    } else if (!fs.existsSync(rawDataPath)) {
      return res.status(404).json({ error: "No cached data found for this user. Please upload the data first." });
    }

    // Save the filter state JSON to disk
    const filterStatePath = path.join(tmpDir, `filterState_${userId}.json`);
    fs.writeFileSync(filterStatePath, JSON.stringify(filterState || {}, null, 2), "utf-8");

    // Output path where python will write the result
    const outputPath = path.join(tmpDir, `output_${userId}.json`);

    // Run Python script
    const pythonProcess = spawn("python3", [
      path.join(process.cwd(), "backend", "filter_engine.py"),
      rawDataPath,
      filterStatePath,
      outputPath
    ]);

    let stderrData = "";
    pythonProcess.stderr.on("data", (data) => {
      stderrData += data.toString();
    });

    pythonProcess.on("close", (code) => {
      if (code !== 0) {
        console.error("Python engine error:", stderrData);
        return res.status(500).json({ error: "Python filter execution failed", details: stderrData });
      }

      try {
        if (!fs.existsSync(outputPath)) {
          return res.status(500).json({ error: "Python did not generate any output file" });
        }

        const filteredResultRaw = fs.readFileSync(outputPath, "utf-8");
        const filteredResult = JSON.parse(filteredResultRaw);

        // Clean up intermediate filter state and output
        try {
          fs.unlinkSync(filterStatePath);
          fs.unlinkSync(outputPath);
        } catch (cleanupErr) {
          console.warn("Cleanup warning:", cleanupErr);
        }

        res.json({ success: true, filteredData: filteredResult });
      } catch (parseErr: any) {
        console.error("Error reading python output:", parseErr);
        res.status(500).json({ error: "Error reading python output", details: parseErr.message });
      }
    });
  } catch (error: any) {
    console.error("Error in filter-large-data:", error);
    res.status(500).json({ error: error.message });
  }
});

// Universal Server-side Proxy for Live External APIs & Google Sheets (Bypasses Browser CORS)
app.all("/api/proxy", async (req, res) => {
  const targetUrl = (req.query.url as string) || req.body?.url;
  if (!targetUrl || typeof targetUrl !== "string") {
    return res.status(400).json({ error: "Missing 'url' parameter" });
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(targetUrl);
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return res.status(400).json({ error: "Only HTTP and HTTPS protocols are supported" });
    }
  } catch (err: any) {
    return res.status(400).json({ error: "Invalid URL: " + err.message });
  }

  try {
    const fetchHeaders: Record<string, string> = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Accept": "application/json, text/csv, text/plain, */*",
    };

    if (req.body?.headers && typeof req.body.headers === "object") {
      Object.assign(fetchHeaders, req.body.headers);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000); // 25s timeout

    const fetchMethod = req.body?.method || (req.method === "POST" && !req.query.url ? "POST" : "GET");

    let bodyData: any = undefined;
    if (fetchMethod !== "GET" && fetchMethod !== "HEAD" && req.body?.body) {
      bodyData = typeof req.body.body === "string" ? req.body.body : JSON.stringify(req.body.body);
    }

    const upstreamResponse = await fetch(targetUrl, {
      method: fetchMethod,
      headers: fetchHeaders,
      body: bodyData,
      signal: controller.signal,
      redirect: "follow",
    });

    clearTimeout(timeout);

    const contentType = upstreamResponse.headers.get("content-type") || "text/plain; charset=utf-8";
    res.status(upstreamResponse.status);
    res.setHeader("Content-Type", contentType);

    const arrayBuffer = await upstreamResponse.arrayBuffer();
    return res.send(Buffer.from(arrayBuffer));
  } catch (proxyError: any) {
    console.error(`[Proxy Error] Failed to fetch upstream ${targetUrl}:`, proxyError?.message || proxyError);
    return res.status(502).json({
      error: `Failed to fetch from ${targetUrl}: ${proxyError?.message || proxyError}`,
      code: "PROXY_FETCH_ERROR",
    });
  }
});

// Track temporary high demand on specific models to avoid repeated 503 stalls
const modelCooldownUntil = new Map<string, number>();

// Initialize Gemini Client Lazily
let aiClient: GoogleGenAI | null = null;

function getAiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is missing. Please configure your GEMINI_API_KEY inside the Settings menu.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
        timeout: 90000,
      },
    });
  }
  return aiClient;
}

// Fallback response generator when Gemini API is rate-limited or fails
function generateFallbackReply(message: string, headers: string[], focusedChart?: any, dashboardInventory?: any): { reply: string } {
  const msgLower = (message || "").toLowerCase();
  let reply = "";
  let actions: any[] = [];
  const targetId = focusedChart && focusedChart.id ? focusedChart.id : "all";

  // Check if user is asking about dashboard inventory / element awareness
  const isInventoryQuery = ["kya kya mojud", "kya mojud", "konsa chart", "konsa kapi", "kpi chart", "kya kya he", "list charts", "show inventory", "dashboard par kya", "desbord par kya", "desbord me mojud", "dashboard me mojud", "all charts", "kitne chart", "how many charts", "available charts"].some(kw => msgLower.includes(kw));

  if (isInventoryQuery && dashboardInventory && Array.isArray(dashboardInventory.elements)) {
    const total = dashboardInventory.totalCount || dashboardInventory.elements.length;
    const charts = dashboardInventory.chartCount || 0;
    const kpis = dashboardInventory.kpiCount || 0;
    const tabName = dashboardInventory.activeTabName || "Main";

    reply = `📊 **Current Dashboard Inventory Report ("${tabName}" Tab):**\n\nYour dashboard currently hosts **${total} elements** in total (**${charts} analytical charts** and **${kpis} KPI metric cards**).\n\n### 📋 Detailed Inventory:\n`;

    if (dashboardInventory.elements.length === 0) {
      reply += `*No charts or KPI cards are currently placed on this tab canvas. You can create charts or build a 1-click industry template!*`;
    } else {
      dashboardInventory.elements.forEach((el: any, i: number) => {
        if (el.category === 'kpi_card') {
          reply += `${i + 1}. 📌 **KPI Card:** "${el.title}"\n   - **Type:** \`${el.type}\`\n${el.kpiValue ? `   - **Value:** ${el.kpiValue}\n` : ''}${el.kpiDelta ? `   - **Indicator:** ${el.kpiDelta}\n` : ''}   - **Container ID:** \`${el.containerId}\`\n`;
        } else {
          reply += `${i + 1}. 📈 **Analytical Chart:** "${el.title}"\n   - **Type:** \`${el.type.toUpperCase()}\`\n${el.xAxis ? `   - **Dimension (X):** ${el.xAxis}\n` : ''}${el.yAxes && el.yAxes.length ? `   - **Metrics (Y):** ${el.yAxes.join(', ')}\n` : ''}   - **Container ID:** \`${el.containerId}\`\n`;
        }
      });
    }

    reply += `\n💡 *Tip: You can ask me to modify any specific chart, change types (e.g. "convert Sales chart to line"), or apply style effects by name.*`;
    return { reply };
  }

  // Determine if it looks like a request for dashboard, chart, styling, layout, export, etc.
  const isChartQuery = ["chart", "graph", "ग्राफ", "नया चार्ट", "add chart", "visualization", "plot"].some(kw => msgLower.includes(kw)) || 
                       (["बनाओ", "बनाये", "बनाएं", "create"].some(kw => msgLower.includes(kw)) && ["चार्ट", "ग्राफ", "chart", "graph", "विजुअल"].some(kw => msgLower.includes(kw)));
  
  const isEffectQuery = ["effect", "इफ़ेक्ट", "इफेक्ट", "glam", "neon", "cyberpunk"].some(kw => msgLower.includes(kw)) ||
                        (["स्टाइल", "डिजाइन", "सजाओ", "style"].some(kw => msgLower.includes(kw)) && ["चार्ट", "कार्ड", "कलर", "theme", "color", "background", "बैकग्राउंड"].some(kw => msgLower.includes(kw)));
  
  const isDashboardQuery = ["dashboard", "डैशबोर्ड", "डेसबोर्ड", "custom dashboard"].some(kw => msgLower.includes(kw));

  const isThemeQuery = ["theme", "color", "कलर", "रंग", "थीम", "बैकग्राउंड"].some(kw => msgLower.includes(kw));

  const isLayoutQuery = ["layout", "grid", "ग्रिड", "कॉलम", "लेआउट"].some(kw => msgLower.includes(kw)) ||
                        (["साफ़", "क्लियर", "reset", "clear", "खालि"].some(kw => msgLower.includes(kw)) && ["डैशबोर्ड", "चार्ट", "dashboard", "charts"].some(kw => msgLower.includes(kw)));

  const isDataQuery = ["mock", "मॉक", "मॉक डेटा", "mock data"].some(kw => msgLower.includes(kw)) ||
                      (["डेटा", "data"].some(kw => msgLower.includes(kw)) && ["जनरेट", "लोड़", "load", "generate", "नया", "बदलो", "अपडेट", "update", "change"].some(kw => msgLower.includes(kw)));

  const isExportQuery = ["export", "डाउनलोड", "एक्सपोर्ट", "csv", "excel", "pdf table", "pdf dashboard"].some(kw => msgLower.includes(kw)) ||
                        (["रिपोर्ट", "report", "pdf", "png", "इमेज", "image"].some(kw => msgLower.includes(kw)) && ["डाउनलोड", "एक्सपोर्ट", "बनाओ", "बनाएं", "निकालो", "save", "download", "export"].some(kw => msgLower.includes(kw)));

  const isLivePollingQuery = ["live", "polling", "refresh", "interval", "रिफ्रेश", "ऑटो-अपडेट", "अपडेट करो", "सेकंड", "seconds"].some(kw => msgLower.includes(kw));

  const isTextboxQuery = ["textbox", "text box", "लिखो", "टेक्स्टबॉक्स", "कंटेंट", "content"].some(kw => msgLower.includes(kw));

  const isStoryQuery = ["story", "स्टोरी", "executive summary", "summary", "समरी", "डेटा स्टोरी"].some(kw => msgLower.includes(kw));

  const isAnomalyQuery = ["anomaly", "anomalies", "outlier", "outliers", "असंगति", "गड़बड़ी", "आउटलायर", "drop", "spike", "plunge", "surge"].some(kw => msgLower.includes(kw));

  const isFilterQuery = ["filter", "फ़िल्टर", "फिल्टर", "only", "सिर्फ", "greater than", "less than", "से ज्यादा", "से कम", "top 5", "top 10", "शीर्ष"].some(kw => msgLower.includes(kw));

  const isCalcQuery = ["calculate", "formula", "फॉर्मूला", "नया कॉलम", "new column", "calculated field", "घटाकर", "जोड़कर", "minus", "plus"].some(kw => msgLower.includes(kw)) || msgLower.includes("=");

  const isForecastQuery = ["forecast", "भविष्यवाणी", "फोरकास्ट", "predict", "trend forecast", "अगले 3 महीने", "अगले 6 महीने"].some(kw => msgLower.includes(kw));

  const isTemplateQuery = ["template", "टेम्प्लेट", "sales dashboard", "finance dashboard", "hr dashboard", "1-click", "उद्योग डैशबोर्ड"].some(kw => msgLower.includes(kw));

  const isLayoutOrPositionQuery = [
    "position", "posisiton", "पोजीशन", "स्थिति", "set karana", "set karna", "set karo", "kaha hona", "kahan hona",
    "profational", "professional", "प्रोफेशनल", "व्यवस्थित", "arrange", "layout", "सटीक जगह", "sahi jagah",
    "kpi upar", "chart neeche", "top pe", "konsa chart", "kon konse chart", "kpi chard", "kpi chart kaha",
    "design professional", "executive layout", "golden ratio"
  ].some(kw => msgLower.includes(kw));

  const isGalleryTemplateQuery = [
    "gallery", "गैलरी", "templet", "template", "टेम्प्लेट", "रेडिमेड", "रेडीमेड", "ready made", "redy made",
    "kpi chart", "kpi card", "केपीआई", "text box", "textbox", "टेक्स्टबॉक्स", "apne hisab se", "apane hisab se",
    "khub creat", "khub create", "custom template", "ready-made", "metric card", "sparkline", "gauge", "progress"
  ].some(kw => msgLower.includes(kw));

  const isEditTemplateQuery = [
    "folmuala", "formula", "फॉर्मूला", "सूत्र", "formula lagane", "formula lagao", "apply formula",
    "data ke hisab se", "data ke anusaar", "hisab se edit", "edit karane", "edit karna", "edit karo",
    "templates use karake", "template use karke", "update template", "edit template", "template formula"
  ].some(kw => msgLower.includes(kw)) && [
    "template", "templet", "टेम्प्लेट", "kpi", "card", "textbox", "folmuala", "formula", "redy made", "ready made"
  ].some(kw => msgLower.includes(kw));

  const isTabQuery = ["tab", "टैब", "page", "पेज", "नया पेज", "new page", "move", "भेजो", "स्थानांतरित"].some(kw => msgLower.includes(kw)) &&
                     ["tab", "टैब", "page", "पेज", "view", "डैशबोर्ड"].some(kw => msgLower.includes(kw));

  const isJoinQuery = ["join", "जॉइन", "blend", "ब्लेंड", "merge", "मर्ज", "मिलाओ", "जोड़ो", "common key", "customerid"].some(kw => msgLower.includes(kw));

  const isTextboxPositionQuery = (msgLower.includes("textbox") || msgLower.includes("text box") || msgLower.includes("टेक्स्टबॉक्स") || msgLower.includes("नोट्स") || msgLower.includes("text") || msgLower.includes("text bo")) &&
    (msgLower.includes("position") || msgLower.includes("posisiton") || msgLower.includes("स्थिति") || msgLower.includes("जगह") || msgLower.includes("set") || msgLower.includes("ser nahi") || msgLower.includes("set nahi") || msgLower.includes("ऊपर") || msgLower.includes("top") || msgLower.includes("header") || msgLower.includes("रखो") || msgLower.includes("हटाओ") || msgLower.includes("kaha") || msgLower.includes("kahan") || msgLower.includes("khid") || msgLower.includes("khud"));

  const isScreenResponsivePositionQuery = (msgLower.includes("screen") || msgLower.includes("स्क्रीन") || msgLower.includes("resize") || msgLower.includes("अलग अलग") || msgLower.includes("aalag") || msgLower.includes("alag alag") || msgLower.includes("badale")) &&
    (msgLower.includes("jagaha") || msgLower.includes("जगह") || msgLower.includes("shift") || msgLower.includes("position") || msgLower.includes("badal") || msgLower.includes("cantenar") || msgLower.includes("container") || msgLower.includes("fix"));

  if (isTextboxPositionQuery) {
    reply = `✨ **Autonomous Textbox Position Engine Active:**\n\nI have configured the precise spatial coordinates for the **Executive Textbox** card:\n\n• 📍 **Target Zone**: \`Header Horizon\` (Top Tier of Executive Dashboard)\n• 📏 **Coordinates**: Top: 15px, Left: 15px, Width: 100%, Height: 110px\n• 🔒 **Position Locking**: Coordinates are locked directly into dashboard configuration so the card stays in its designated header position across all screen sizes.\n\nPosition has been applied and saved!`;
    actions.push({
      "action": "create-textbox",
      "textboxStyle": "gradient",
      "label": "Executive Strategic Overview",
      "badge": "Strategy Memo",
      "content": "Real-time enterprise dashboard observations and key operational performance summary.",
      "subLabel": "Live Workspace Sync",
      "top": 15,
      "left": 15,
      "width": "calc(100% - 30px)",
      "height": 110,
      "zone": "header"
    });
    actions.push({
      "action": "set-element-position",
      "target": "textbox",
      "zone": "header",
      "top": 15,
      "left": 15,
      "width": "calc(100% - 30px)",
      "height": 110
    });
  } else if (isScreenResponsivePositionQuery) {
    reply = `✨ **Screen Responsive Position Stabilization Active:**\n\nI have resolved the container shifting issue across different screen sizes:\n\n1. 🔒 **Responsive Position Anchor**: Replaced the automatic column reshuffling on window resize with a non-destructive boundary recalibration engine (\`recalibrateResponsiveBounds\`).\n2. 📐 **Coordinate Preservation**: Every chart, KPI card, and textbox permanently preserves its designed Top & Left coordinates when viewed on different screens (Desktop, Laptop, Tablet).\n3. 🛡️ **Horizontal Viewport Clamping**: On narrower displays, cards are smoothly clamped within the container boundary without moving across columns or breaking the layout hierarchy.\n4. 📊 **Crisp Canvas Reflow**: ECharts, Plotly, and Sparklines dynamically redraw within their fixed containers.`;
    actions.push({
      "action": "arrange-dashboard-professionally"
    });
  } else if (isLayoutOrPositionQuery) {
    const isBuildNew = ["banao", "create", "build", "design", "नया", "fresh", "शुरू से"].some(kw => msgLower.includes(kw));
    
    if (isBuildNew) {
      reply = `✨ **Autonomous Professional Dashboard Synthesis Active:**\n\nI have evaluated the best practices of Executive BI Architecture (The Golden Ratio Layout) and synthesized a complete professional dashboard:\n\n1. 📌 **Top Horizon (y: 15px)**: **Executive Strategic Overview Textbox** (Full-width banner providing context & live metric pacing).\n2. 💎 **Top Tier (y: 140px)**: **Executive KPI Horizon** (4 Balanced KPI Cards & Momentum Sparklines side-by-side: Total Revenue, Gross Profit, Total Volume, 30-Day Trend). *Placed at the top because executives need key numbers within the first 3 seconds.*\n3. 📊 **Middle Tier (y: 355px)**: **Primary Analytics (2-Column Grid)** with Time-Series Line Trend on the left and Primary Category Bar Comparison on the right.\n4. 🥧 **Bottom Tier (y: 775px)**: **Secondary Breakdown Visuals** with Proportional Donut Share and Multi-Metric Radar Benchmark.\n\nEvery element has been created and snapped to its exact mathematical coordinates!`;
      actions.push({ "action": "design-professional-dashboard" });
    } else {
      reply = `✨ **Executive Professional Layout & Positioning Engine Active:**\n\nI have organized the dashboard elements according to Executive BI Visual Hierarchy:\n\n• 🔝 **Top Zone (y: 15px)**: Executive Strategic Header Textbox (Width: 100%)\n• 💎 **Top Tier (y: 140px)**: KPI Metric Cards & Velocity Sparklines placed side-by-side in a horizontal row for instant executive scanning.\n• 📈 **Middle Tier (y: 355px)**: Core Analytical Visuals (Line Trends & Comparative Bars) formatted in a balanced 2-column grid.\n• 🎯 **Bottom Tier (y: 775px)**: Distribution Visuals (Donut Share, Radar & Scatter).\n\nAll chart canvases have been resized, elements snapped to their zones, and coordinates saved!`;
      actions.push({ "action": "arrange-dashboard-professionally" });
    }
  } else if (isEditTemplateQuery) {
    const numCol = headers && headers.length > 1 ? headers[1] : (headers && headers[0] ? headers[0] : 'Revenue');
    reply = `✨ **Autonomous Template Dynamic Data & Formula Engine Active:**\n\nI have configured the ready-made templates to dynamically evaluate against your active dataset and applied calculation formulas:\n\n1. 📊 **Dynamic Data Calculation**: Bound KPI card to dataset column **"${numCol}"** using dynamic \`SUM\` aggregation.\n2. 🧮 **Formula Integration**: Applied the formula \`=SUM(A1, R, "₹")\` to calculate and format metric values with regional currency.\n3. ⚡ **Dynamic Pacing & Benchmarks**: Real-time evaluation against targets (+16.8%) with live status indicators.`;
    actions.push({
      "action": "edit-template-card",
      "target": "kpi",
      "column": numCol,
      "aggregation": "sum",
      "formula": `=SUM(A1, R, "₹")`,
      "formulaField": "value",
      "label": `Total ${numCol}`,
      "badge": "Data Dynamic",
      "trend": "up",
      "trendValue": "+16.8% vs Target"
    });
  } else if (isGalleryTemplateQuery) {
    const numCol = headers && headers.length > 1 ? headers[1] : (headers && headers[0] ? headers[0] : 'Metric');
    const wantsTextboxOnly = (msgLower.includes("textbox") || msgLower.includes("text box") || msgLower.includes("टेक्स्टबॉक्स")) && !msgLower.includes("kpi") && !msgLower.includes("chart");
    const wantsKpiOnly = (msgLower.includes("kpi") || msgLower.includes("केपीआई")) && !msgLower.includes("textbox") && !msgLower.includes("text box");

    if (wantsTextboxOnly) {
      reply = `✨ **Autonomous Ready-Made Textbox Template Created:**\n\nI have created a high-impact, styled Executive Textbox card from the gallery palette. It is fully draggable, editable, and formatted for high-contrast executive summaries.`;
      actions.push({
        "action": "create-textbox",
        "textboxStyle": "gradient",
        "label": "Executive Insights",
        "badge": "Strategy Memo",
        "content": "Real-time enterprise dashboard observations and key operational performance summary.",
        "subLabel": "Live Workspace Sync"
      });
    } else if (wantsKpiOnly) {
      reply = `✨ **Autonomous Ready-Made KPI Metric Template Created:**\n\nI have generated an executive KPI card for **${numCol}** with real-time mathematical aggregation from your active dataset, dynamic trend indicator, and target benchmarks.`;
      actions.push({
        "action": "create-kpi-card",
        "label": `Total ${numCol}`,
        "column": numCol,
        "aggregation": "sum",
        "currency": "₹",
        "trend": "up",
        "trendValue": "+18.4% vs Plan",
        "badge": "KPI Metric",
        "subMetrics": [
          { "label": "Target", "value": "₹50L" },
          { "label": "Growth", "value": "+14.2%" }
        ]
      });
    } else {
      reply = `✨ **Autonomous Gallery Template Creation Engine Active:**\n\nI have created professional, ready-made gallery elements matching your dataset:\n1. 📌 **Executive Overview Textbox** (Modern Gradient Theme)\n2. 📈 **Key Performance Indicator (KPI)** for **${numCol}** with dynamic aggregation\n3. ⚡ **30-Day Trend Sparkline** with growth momentum\n\nThese ready-made elements automatically recalculate when your dataset changes and support complete customization!`;
      actions.push({
        "action": "create-textbox",
        "textboxStyle": "gradient",
        "label": "Executive Intelligence",
        "badge": "Enterprise Note",
        "content": "Real-time performance indicators and operational benchmarks across active dimensions.",
        "subLabel": "Live Dashboard Sync"
      });
      actions.push({
        "action": "create-kpi-card",
        "label": `Total ${numCol}`,
        "column": numCol,
        "aggregation": "sum",
        "currency": "₹",
        "trend": "up",
        "trendValue": "+18.4% vs Plan",
        "badge": "KPI Metric",
        "subMetrics": [
          { "label": "Target", "value": "₹50L" },
          { "label": "Growth", "value": "+14.2%" }
        ]
      });
      actions.push({
        "action": "create-sparkline",
        "label": `${numCol} Velocity`,
        "column": numCol,
        "sparklineType": "line",
        "badge": "30-Day Trend",
        "color": "#10b981",
        "trendValue": "↑ 14.8%"
      });
    }
  } else if (isTabQuery) {
    let tabName = "Analytics View";
    if (msgLower.includes("geographic") || msgLower.includes("क्षेत्रीय")) tabName = "Geographic View";
    else if (msgLower.includes("sales") || msgLower.includes("सेल्स")) tabName = "Sales Performance";
    else if (msgLower.includes("customer") || msgLower.includes("ग्राहक")) tabName = "Customer Analytics";
    else if (msgLower.includes("forecast") || msgLower.includes("फोरकास्ट")) tabName = "Forecast & Trends";

    reply = `⚠️ **Gemini API Notice:** Processing multi-tab dashboard canvas command.\n\nI have created a new page tab called **'${tabName}'** and routed requested visual charts to this workspace canvas.`;
    actions.push({ "action": "create-tab", "tabName": tabName });
    if (msgLower.includes("move") || msgLower.includes("भेजो")) {
      actions.push({ "action": "move-chart-to-tab", "target": targetId || "all", "destinationTab": tabName });
    }
  } else if (isJoinQuery) {
    reply = `⚠️ **Gemini API Notice:** Multi-Dataset AI Blend & Join Engine initiated.\n\nI have configured an AI join operation between your loaded datasets on the common key with intelligent case-normalized matching.`;
    actions.push({
      "action": "join-datasets",
      "leftDataset": "primary",
      "rightDataset": "secondary",
      "leftKey": headers && headers[0] ? headers[0] : "id",
      "rightKey": headers && headers[0] ? headers[0] : "id",
      "joinType": "inner"
    });
  } else if (isStoryQuery) {
    reply = `⚠️ **Gemini API Notice:** Generating real-time local intelligence.\n\nI have triggered the **Vedra Executive Data Storytelling Engine** to formulate a 3-paragraph executive narrative, highlighting overall data trends, high/low performance clusters, and 3 strategic recommendations.`;
    actions.push({ "action": "generate-data-story" });
  } else if (isAnomalyQuery) {
    reply = `⚠️ **Gemini API Notice:** Scanning dataset for outliers.\n\nI have initiated the **Vedra Statistical Anomaly Detector** across all numeric columns to identify sudden plunges, anomalous surges, and Z-Score / IQR outliers.`;
    actions.push({ "action": "detect-anomalies" });
  } else if (isForecastQuery) {
    reply = `⚠️ **Gemini API Notice:** Computing predictive trend.\n\nI have activated the **Vedra Predictive Trend Forecasting Engine** to project historical performance +3 intervals into the future with confidence intervals on the active chart.`;
    actions.push({ "action": "forecast-chart", "periods": 3 });
  } else if (isTemplateQuery) {
    reply = `⚠️ **Gemini API Notice:** Building industry template.\n\nI have initiated the **1-Click Smart Industry Dashboard Builder** to automatically construct 3 executive KPI summary cards and 3 coordinated analytical charts tailored to your dataset.`;
    actions.push({ "action": "build-template-dashboard", "domain": "sales" });
  } else if (isDashboardQuery) {
    reply = `⚠️ **Gemini API Temporary Fallback:** The AI model is currently busy or rate-limited.\n\nHowever, **Vedra Smart Fallback Engine** recognized your request and generated an action to prepare a new multi-chart dashboard for you.`;
    actions.push({ "action": "clear-dashboard" });
    if (headers && headers.length >= 2) {
      actions.push({
        "action": "create-chart",
        "type": "bar",
        "title": `${headers[1] || 'Value'} by ${headers[0]}`,
        "xAxis": headers[0],
        "yAxes": [headers[1] || headers[0]]
      });
      if (headers[2]) {
        actions.push({
          "action": "create-chart",
          "type": "line",
          "title": `${headers[2]} vs ${headers[0]}`,
          "xAxis": headers[0],
          "yAxes": [headers[2]]
        });
      }
    }
  } else if (isChartQuery) {
    reply = `⚠️ **Gemini API Temporary Fallback:** The AI model is currently busy or rate-limited.\n\n**Vedra Fallback Engine** has generated a chart creation action for you:`;
    if (headers && headers.length >= 2) {
      actions.push({
        "action": "create-chart",
        "type": "bar",
        "title": `Chart: ${headers[0]} vs ${headers[1]}`,
        "xAxis": headers[0],
        "yAxes": [headers[1]]
      });
    }
  } else if (isEffectQuery) {
    reply = `⚠️ **Gemini API Temporary Fallback:** The AI model is currently busy or rate-limited.\n\n**Vedra Fallback Engine** has applied a Cyberpunk effect across your visual charts:`;
    actions.push({
      "action": "apply-effect",
      "effectId": "effect-cyberpunk",
      "target": targetId
    });
  } else if (isThemeQuery) {
    reply = `⚠️ **Gemini API Temporary Fallback:** The AI model is currently busy or rate-limited.\n\n**Vedra Fallback Engine** has generated an action to apply the executive Blue theme across all chart containers:`;
    actions.push({
      "action": "change-theme",
      "themeId": "blue-container-color",
      "target": targetId
    });
  } else if (isLayoutQuery) {
    reply = `⚠️ **Gemini API Temporary Fallback:** The AI model is currently busy or rate-limited.\n\n**Vedra Fallback Engine** has adjusted the grid layout to a 2-column configuration:`;
    actions.push({
      "action": "change-layout",
      "columns": 2
    });
  } else if (isDataQuery) {
    reply = `⚠️ **Gemini API Temporary Fallback:** The AI model is currently busy or rate-limited.\n\n**Vedra Fallback Engine** has loaded a sample sales mock dataset for you:`;
    actions.push({
      "action": "generate-mock-data",
      "category": "sales",
      "rowCount": 30
    });
  } else if (isExportQuery) {
    reply = `⚠️ **Gemini API Temporary Fallback:** The AI model is currently busy or rate-limited.\n\n**Vedra Fallback Engine** has triggered the PDF dashboard export:`;
    actions.push({
      "action": "export-dashboard",
      "format": "pdf_dash"
    });
  } else if (isLivePollingQuery) {
    reply = `⚠️ **Gemini API Temporary Fallback:** The AI model is currently busy or rate-limited.\n\n**Vedra Fallback Engine** has configured live data refresh polling every 10 seconds:`;
    actions.push({
      "action": "set-live-polling",
      "url": "https://jsonplaceholder.typicode.com/todos",
      "interval": 10
    });
  } else if (isTextboxQuery) {
    reply = `⚠️ **Gemini API Temporary Fallback:** The AI model is currently busy or rate-limited.\n\n**Vedra Fallback Engine** has added a custom note card to your workspace:`;
    actions.push({
      "action": "create-textbox",
      "content": "Vedra BI Workspace Notes Card",
      "bgColor": "#fff3cd"
    });
  } else {
    // General fallback
    reply = `⚠️ **Gemini API Notice:** The AI model is currently busy or free tier quota is temporarily reached.\n\n### You can still use all Vedra BI features directly!\nYou can use the **Quick Action Buttons** or direct dashboard controls below:\n1. 📊 **Create Chart:** Directly choose your preferred columns and visualization type.\n2. ✨ **Effects:** Apply visual styling and glow effects.\n3. 🎨 **Card Theme:** Change card background and palette.\n4. 📐 **Grid Layout:** Switch between 1-column, 2-column, or 3-column views.\n5. 🔄 **Mock Data:** Load synthetic datasets instantly.\n6. ⏰ **Live Update:** Start automated live data polling.\n7. 📝 **Textbox:** Add rich text annotations.\n8. 📤 **Export:** Download high-resolution PDF or Excel sheets.`;
  }

  if (actions.length > 0) {
    reply += `\n\n\`\`\`json-actions\n${JSON.stringify(actions, null, 2)}\n\`\`\``;
  }

  return { reply };
}

// API routes FIRST
app.post("/api/chat", async (req, res) => {
  const isStream = req.body.stream === true || req.headers.accept?.includes("text/event-stream");

  try {
    const { message, history, headers, dataSample, image_base64, focusedChart, dashboardInventory, presentationStatus } = req.body;

    let dashboardInventoryContext = "";
    if (dashboardInventory && Array.isArray(dashboardInventory.elements)) {
      dashboardInventoryContext = `\n- CURRENT DASHBOARD INVENTORY (${dashboardInventory.elements.length} elements total across active tab "${dashboardInventory.activeTabName || 'Main'}"):
  * Total Charts: ${dashboardInventory.chartCount || 0}
  * Total KPI Cards: ${dashboardInventory.kpiCount || 0}
  * Elements Detail:
${dashboardInventory.elements.map((el: any, idx: number) => `    ${idx + 1}. [${el.category === 'kpi_card' ? 'KPI CARD' : 'CHART'}] ID: "${el.id}" | Title: "${el.title}" | Type: "${el.type}"${el.xAxis ? ` | X: ${el.xAxis}` : ''}${el.yAxes ? ` | Y: ${JSON.stringify(el.yAxes)}` : ''}${el.kpiValue ? ` | Value: "${el.kpiValue}"` : ''}${el.kpiDelta ? ` | Delta: "${el.kpiDelta}"` : ''}`).join('\n')}
  * INVENTORY AWARENESS RULE: You are fully aware of EVERY chart and KPI card currently on the user's dashboard canvas.
    - If the user asks "dashboard par kya kya mojud he", "list my charts", "what KPI cards do I have", or "show inventory", accurately and comprehensively list all the charts, KPI cards, and their types from this inventory!
    - If the user asks to modify, convert, rename, or target a specific chart or KPI (e.g. "sales chart ko line chart banao", "rename customer KPI to Total Users"), use the exact title or ID from this inventory.`;
    }

    let focusedChartContext = "";
    if (focusedChart && (focusedChart.title || focusedChart.id)) {
      focusedChartContext = `\n- CURRENTLY ACTIVE/FOCUSED CHART TARGET:
  * Chart ID: "${focusedChart.id}"
  * Title: "${focusedChart.title || 'Untitled'}"
  * Type: "${focusedChart.type || 'bar'}"
  * X-Axis: "${focusedChart.xAxis || 'N/A'}"
  * Y-Axes: ${JSON.stringify(focusedChart.yAxes || [])}
  * TARGET RULE: If the user says "इस चार्ट", "this chart", "is chart ko", "make it red", "change type", "filter top 5", or asks for modifications without naming another chart, apply your action specifically to this chart (set target: "${focusedChart.id}").`;
    }

    let presentationContext = "";
    if (presentationStatus && presentationStatus.isActive) {
      presentationContext = `\n- LIVE PRESENTATION / BOARD MEETING KIOSK STATE:
  * Status: PRESENTATION MODE IS ACTIVE
  * Current Slide: Slide ${presentationStatus.currentSlideIndex} of ${presentationStatus.totalSlides} ("${presentationStatus.currentSlideTitle || 'Slide'}")
  * Slide Type: ${presentationStatus.currentSlideType || 'visual'}
  * Auto-Playing: ${presentationStatus.isAutoPlaying ? 'YES (Playing)' : 'NO (Paused)'}
  * Auto-Advance After AI Summary: ${presentationStatus.isAutoAdvanceEnabled ? 'ENABLED' : 'DISABLED'}
  * Active Slide Display Duration: ${presentationStatus.currentSlideDurationSec}s ${presentationStatus.hasCustomSlideDuration ? '(Custom for this slide)' : '(Global)'}
  * AI Briefing Speed: ${presentationStatus.summarySpeedMultiplier}x
  * Presentation Layout: "${presentationStatus.layoutPreference}" (options: "side", "bottom", "minimal", "hidden")
  * Presentation Theme: "${presentationStatus.themePreference}" (options: "dark", "light")
  * Voice Speech Narration: ${presentationStatus.isVoiceEnabled ? 'ON' : 'OFF'}
  * Laser Pointer Tool: ${presentationStatus.isLaserActive ? 'ACTIVE' : 'OFF'}
  * Pen Drawing Tool: ${presentationStatus.isPenActive ? 'ACTIVE' : 'OFF'}
  * PRESENTATION AWARENESS: The user is currently inside full-screen presentation mode! You can advance/rewind slides, jump to specific slides, adjust display duration or reading speed, switch layouts/themes, toggle voice narration, trigger laser/pen, and control every menu.`;
    }

    const systemInstruction = `You are Vedra BI Assistant, a highly professional, polite, and intelligent business intelligence assistant.
Your goal is to analyze data, create visuals, apply beautiful effects, manage live updates, change grid layouts, generate high-quality mock data, add annotations or text notes, export files, and build custom dashboards.
IMPORTANT LANGUAGE INSTRUCTION:
- Respond in pure, professional English.
- Do NOT mix Hindi and English (no Hinglish).
- If the user asks in Hindi, you may respond in clean, formal Hindi; otherwise ALWAYS default to clear, elegant, professional English.

Here is the context of the user's dataset:
- Columns (Headers): ${JSON.stringify(headers)}
- Sample Rows of the Dataset: ${JSON.stringify(dataSample)}${dashboardInventoryContext}${focusedChartContext}${presentationContext}

Important Rules:
1. Use the provided dataset sample to answer the user's specific questions (e.g., "इस महीने सबसे ज़्यादा बिक्री किस प्रोडक्ट की हुई?" or "which product has highest sales").
2. Answer politely and clearly. Be helpful and direct. Ask logical questions if you need more details from the user.
3. If the user wants to perform ANY action on the dashboard (e.g., create a chart, clear the dashboard, apply layout grids, change visual styles, load mock data, set up live refresh, add text notes, or export documents), do NOT ask them to use a form or guided wizard. Instead, execute the action directly by adding a JSON array block at the end of your text response using the language identifier \`json-actions\`.
The format of the \`json-actions\` block MUST be exactly as follows:
\`\`\`json-actions
[
  {
    "action": "clear-dashboard" // Use this when user wants a fresh/new custom dashboard or explicitly asks to clear/reset/recreate the dashboard
  },
  {
    "action": "create-chart",
    "type": "bar", // can be "bar", "line", "pie", "scatter", "radar", "treemap"
    "title": "A short descriptive chart title",
    "xAxis": "The exact column name from the headers above to use as X axis label",
    "yAxes": ["The exact column name from the headers above to use as Y axis value"]
  },
  {
    "action": "apply-effect",
    "effectId": "effect-cyberpunk", // Choose from available effect IDs: "effect-shadow-light", "effect-shadow-dark", "effect-cyberpunk", "effect-sunset-fire", "effect-emerald", "effect-retro-gold", "effect-minimalist", "effect-glass-frosted"
    "target": "all" // can be "all", or a specific chart title/id
  },
  {
    "action": "change-theme",
    "themeId": "blue-container-color", // Choose from: "default-container-color" (Classic Soft), "blue-container-color", "green-container-color", "warm-container-color", "dark-container-color", "sunset-orange", "ocean-gradient", "rainbowcandy", "tropicalparadise", "neondreams"
    "target": "all" // can be "all", or a specific chart title/id
  },
  {
    "action": "change-layout",
    "columns": 2 // can be 1, 2, or 3 columns
  },
  {
    "action": "generate-mock-data",
    "category": "sales", // can be "sales", "finance", "hr", "iot", "stock"
    "rowCount": 30 // can be 15, 30, 50, or 100
  },
  {
    "action": "set-live-polling",
    "url": "https://jsonplaceholder.typicode.com/todos", // API URL
    "interval": 10 // refresh interval in seconds
  },
  {
    "action": "create-textbox",
    "label": "Executive Summary Note", // optional title
    "textboxStyle": "gradient", // can be "gradient", "callout", "executive", "cyber", "minimal", "quote", "alert", "sunset", "ocean", "dark_luxury", "notes"
    "content": "Beautiful customized notes card or strategic observation on the dashboard...", // Plain text or HTML notes content
    "badge": "Strategy Memo",
    "bgColor": "#fff3cd", // Hex color code for the textbox card background
    "top": 15, // pixel coordinate number or CSS string
    "left": 15, // pixel coordinate number or CSS string
    "width": "calc(100% - 30px)", // CSS width
    "height": 110, // pixel coordinate number or CSS string
    "zone": "header" // "header", "kpi-row", "main-left", "main-right", "bottom-left", "bottom-right", "full-width", "center"
  },
  {
    "action": "create-template-card", // Autonomous Creation of Ready-Made Template Cards from Gallery
    "category": "kpi", // can be "kpi", "textbox", "sparkline", "gauge", "progress"
    "templateId": "template_revenue_glow", // optional template id or omit to generate custom
    "label": "Total Revenue", // Title/Label of the card
    "column": "Sales", // column from dataset headers to dynamically aggregate
    "aggregation": "sum", // "sum", "avg", "max", "min", "count"
    "currency": "₹", // Currency prefix like "₹" or "$"
    "trend": "up", // "up", "down", "neutral"
    "trendValue": "+18.2% vs Plan",
    "badge": "Enterprise Metric",
    "textboxStyle": "gradient", // Used when category is "textbox"
    "sparklineType": "line", // Used when category is "sparkline" ("line", "bar", "winloss")
    "subMetrics": [
      { "label": "Target", "value": "₹50,00,000" },
      { "label": "Margin", "value": "24.5%" }
    ]
  },
  {
    "action": "create-kpi-card", // Direct Ready-Made KPI Card from Gallery
    "label": "Gross Margin",
    "column": "Profit",
    "aggregation": "sum",
    "currency": "₹",
    "trend": "up",
    "trendValue": "+14.8%",
    "badge": "Financial Health"
  },
  {
    "action": "create-sparkline", // Direct 30-Day Trend Sparkline from Gallery
    "label": "Order Velocity",
    "column": "Quantity",
    "sparklineType": "line",
    "badge": "30-Day Trend"
  },
  {
    "action": "create-gauge", // Direct Gauge Meter from Gallery
    "label": "System Efficiency",
    "value": 85
  },
  {
    "action": "create-progress", // Direct Target Progress Bar from Gallery
    "label": "Annual Quota Completion",
    "value": 78
  },
  {
    "action": "edit-template-card", // Programmatically edit a ready-made template card using dataset columns, aggregation or formula
    "target": "kpi", // target template card title or category: "kpi", "sparkline", "gauge", "textbox", "all"
    "column": "Sales", // Bind to dataset column
    "aggregation": "sum", // "sum", "avg", "max", "min", "count"
    "formula": "=SUM(Sales, R, \"Total Revenue: ₹\")", // Excel-style formula from Learning Handbook (15 functions available)
    "formulaField": "value", // target field for formula ("value", "trendValue", "subLabel")
    "label": "Quarterly Revenue",
    "badge": "Verified Formula",
    "trend": "up",
    "trendValue": "+16.8% vs Target"
  },
  {
    "action": "apply-template-formula", // Apply an Excel-style formula from Learning Handbook directly to any ready-made template card
    "target": "kpi", // card title or category: "kpi", "sparkline", "gauge", "progress", "textbox"
    "formula": "=GROWTH(C2, B2, R, \"MoM Growth: \")", // All 15 Learning Handbook functions: =SUM(col, R, "Total: ₹"), =AVG(col, R, "Avg: ₹"), =MAX(col, R, "Max: ₹"), =MIN(col, R, "Min: ₹"), =COUNT(A, R, "Count: "), =GROWTH(C2, B2, R, "Growth: "), =DIFF(C2, D2, R, "Margin: ₹"), =PERCENT(col, 1000000, R, "Met: "), =REMAINING(1000000, col, R, "Deficit: ₹"), =STATUS(col, 50000, "On Track ✅", "Needs Attention ⚠️"), =IF(B2>80000, "Tier 1", "Tier 2"), =LATEST(col, R, "Latest: ₹"), =TOP(col, 1, R, "Leader: ₹"), =FORMAT(B2, "INR", R, "Total: "), =INSERT(A2, R, "Region: ")
    "formulaField": "value" // "value" or "trendValue" or "subLabel"
  },
  {
    "action": "apply-knowledge-calculation", // Dynamically applies a calculation from the formal Agent Knowledge Base directly onto a dashboard card
    "formula": "=DIFF(Sales, Cost, R, \"Net Margin: ₹\")",
    "target": "kpi", // "kpi", "sparkline", "gauge", "progress", "textbox", or specific card title
    "label": "Net Profit Margin"
  },
  {
    "action": "show-knowledge-base", // Opens the interactive Agent Knowledge Base explorer deck in chat
    "query": "margin" // optional search filter: "aggregates", "growth", "goals", "rules", or keyword
  },
  {
    "action": "export-dashboard",
    "format": "pdf_dash" // Choose from: "csv", "excel", "pdf_table", "png_dash", "pdf_dash"
  },
  {
    "action": "generate-data-story" // Generates a structured 3-paragraph executive summary (Trends, High/Low performance clusters, 3 Strategic Recommendations)
  },
  {
    "action": "detect-anomalies", // Scans dataset for statistical outliers, Z-score anomalies, and sudden plunges or surges
    "column": "Sales" // optional column name to target
  },
  {
    "action": "filter-data", // Filter and slice data via natural language
    "column": "Sales",
    "operator": ">", // can be ">", "<", ">=", "<=", "==", "!=", "contains", "top"
    "value": 50000,
    "displayQuery": "Sales > 50,000"
  },
  {
    "action": "calculate-column", // Creates a new calculated field column when user asks to calculate or provides a formula like 'Sales - Cost = Profit', 'Profit = Sales - Cost', 'Price * Quantity = Revenue'
    "columnName": "Profit",
    "formula": "[Sales] - [Cost]"
  },
  {
    "action": "forecast-chart", // Generates predictive trend forecasting on charts
    "periods": 3 // number of future intervals to forecast (e.g. 3 or 6)
  },
  {
    "action": "build-template-dashboard", // 1-click industry dashboard builder
    "domain": "sales" // can be "sales", "finance", "hr", "operations", "general"
  },
  {
    "action": "create-tab", // Creates a new dashboard page/tab (e.g. Overview, Sales Performance, Customer Analytics, Forecast)
    "tabName": "Sales Performance"
  },
  {
    "action": "switch-tab", // Switches active dashboard tab to an existing or newly created tab
    "tabName": "Sales Performance"
  },
  {
    "action": "move-chart-to-tab", // Moves a chart (e.g., all regional charts or specific chart) to a named tab
    "target": "chart_12345", // target chart id or "all"
    "destinationTab": "Geographic View"
  },
  {
    "action": "join-datasets", // Multi-Dataset AI Blend & Join: merges 2 datasets on a matching key column
    "leftDataset": "Orders",
    "rightDataset": "Customers",
    "leftKey": "CustomerID",
    "rightKey": "CustomerID",
    "joinType": "inner" // can be "inner", "left", "right", "full"
  },
  {
    "action": "convert-chart", // Converts an existing chart to another type (bar, line, pie, scatter, radar, treemap)
    "target": "chart_12345", // target chart title or ID from dashboard inventory, or "all"
    "chartType": "line"
  },
  {
    "action": "rename-chart", // Renames any chart or KPI card
    "target": "chart_12345", // target chart title, KPI title, or ID
    "newTitle": "Monthly Revenue Trend"
  },
  {
    "action": "set-element-position", // Sets the exact position, size, and layout zone of any chart, KPI card, or textbox
    "target": "chart_12345", // target chart ID, title, or category ("all", "kpi", "charts", "textbox")
    "top": 140, // pixel coordinate or CSS string (e.g. 140 or "140px")
    "left": 15, // pixel coordinate or CSS string (e.g. 15 or "15px")
    "width": 380, // pixel width (optional)
    "height": 200, // pixel height (optional)
    "zone": "kpi-row" // can be "header", "kpi-row", "main-left", "main-right", "bottom-left", "bottom-right", "full-width"
  },
  {
    "action": "arrange-dashboard-professionally" // Automatically organizes all dashboard elements into the Golden Ratio Executive BI layout: Header on top, 4 KPIs horizontally on top tier, 2 analytical charts in middle 2-column grid, breakdown charts on bottom tier
  },
  {
    "action": "design-professional-dashboard" // Autonomously determines the optimal charts, KPIs, and textboxes for the dataset, creates them, and places each one in its ideal professional position
  },
  {
    "action": "auto-pilot-dashboard", // 1-Click Smart Dashboard Auto-Pilot: Analyzes data, auto-builds 4-5 best charts (Bar, Line, Pie, Comparison), 4 top-tier KPI cards, and arranges them in 2 seconds
    "domain": "sales" // "sales", "finance", "hr", "operations", "general"
  },
  {
    "action": "export-executive-report", // 1-Click Executive Strategic Report Export to PDF or PowerPoint
    "format": "both" // "pdf", "pptx", or "both"
  },
  {
    "action": "clean-dataset" // Automatic Data Quality Cleaner: removes duplicates, fills missing/null cells with mean/mode, trims whitespace
  },
  {
    "action": "simulate-what-if", // Non-destructive What-If sensitivity analysis for revenue, volume, cost, and profit
    "priceDeltaPct": 10,
    "volumeDeltaPct": -5,
    "costDeltaPct": 5,
    "discountDeltaPct": 0
  },
  {
    "action": "diagnose-root-cause", // Automated 'Why' root-cause diagnosis across dimensions
    "metricQuery": "Sales"
  },
  {
    "action": "toggle-cross-filter", // Enables/disables dashboard-wide interactive cross-filtering
    "state": "on"
  },
  {
    "action": "set-chart-benchmark", // Adds dynamic target/goal line to chart with achievement tracking
    "targetValue": 500000,
    "label": "Sales Goal",
    "color": "#e11d48"
  },
  // --- COMPLETE PRESENTATION & KIOSK CONTROL SUITE ---
  {
    "action": "start-presentation", // Launches Fullscreen Board Meeting & Kiosk Mode presentation
    "slideIndex": 1, // Optional: 1-based slide index to jump straight into
    "slideQuery": "Revenue", // Optional: search slide by title or metric name
    "layout": "side", // Optional: "side", "bottom", "minimal", "hidden"
    "theme": "dark", // Optional: "dark", "light"
    "density": "detailed", // Optional: "detailed", "compact"
    "duration": 12, // Optional: duration in seconds (baseline is 10s)
    "speed": 1.25 // Optional: AI summary reading speed multiplier (1.0, 1.25, 1.5, 2.0)
  },
  {
    "action": "exit-presentation" // Closes presentation mode and returns to main canvas
  },
  {
    "action": "presentation-next" // Advances to next presentation slide
  },
  {
    "action": "presentation-prev" // Goes back to previous presentation slide
  },
  {
    "action": "presentation-goto-slide", // Jumps directly to a specific slide by index or title
    "slideIndex": 3, // 1-based slide index (e.g. 3 for slide 3)
    "slideQuery": "Regional Breakdown" // Alternative: search slide by title/metric
  },
  {
    "action": "presentation-play" // Resumes presentation auto-play
  },
  {
    "action": "presentation-pause" // Pauses presentation auto-play
  },
  {
    "action": "presentation-toggle-play" // Toggles presentation auto-play on/off
  },
  {
    "action": "presentation-set-auto-advance", // Controls whether presentation automatically advances after AI summary reading completes
    "state": "on" // "on" or "off"
  },
  {
    "action": "presentation-set-duration", // Sets slide display duration in seconds
    "duration": 15, // number in seconds (e.g. 15 for 15 seconds)
    "scope": "all" // "all" for all slides or "current" for active slide only
  },
  {
    "action": "presentation-adjust-duration", // Increments or decrements slide duration dynamically
    "durationDelta": 5, // e.g. +5 to add 5 seconds, -3 to reduce 3 seconds
    "scope": "current" // "current" or "all"
  },
  {
    "action": "presentation-reset-duration" // Resets active slide duration back to baseline
  },
  {
    "action": "presentation-set-speed", // Adjusts AI summary narration & reading display speed multiplier
    "speed": 1.5 // 0.75, 1.0, 1.25, 1.5, 2.0
  },
  {
    "action": "presentation-set-layout", // Changes presentation viewport structure
    "layout": "side" // "side" (Split-Screen: Visual left, Briefing right), "bottom" (Shelf below), "minimal" (Floating HUD), "hidden" (Visual Stage Only)
  },
  {
    "action": "presentation-cycle-layout" // Cycles through side -> bottom -> minimal -> hidden
  },
  {
    "action": "presentation-set-density", // Adjusts AI briefing summary density
    "density": "detailed" // "detailed" (Full metrics + takeaways) or "compact" (Executive bullet points)
  },
  {
    "action": "presentation-set-theme", // Switches presentation theme
    "theme": "dark" // "dark" (Deep executive slate) or "light" (High-contrast clean presentation)
  },
  {
    "action": "presentation-toggle-theme" // Toggles theme between dark and light
  },
  {
    "action": "presentation-set-narrator", // Enables or disables live voice speech narration (reads AI summary aloud)
    "state": "on" // "on" or "off"
  },
  {
    "action": "presentation-toggle-narrator" // Toggles speech Narrator Mode on/off
  },
  {
    "action": "presentation-replay-narration" // Replays the AI executive speech summary for the current slide
  },
  {
    "action": "presentation-test-voice" // Plays a brief sample of the selected AI executive voice
  },
  {
    "action": "presentation-set-voice", // Alias for presentation-set-narrator
    "state": "on" // "on" or "off"
  },
  {
    "action": "presentation-toggle-voice" // Alias for presentation-toggle-narrator
  },
  {
    "action": "presentation-set-laser", // Enables or disables red glowing laser pointer for stage visual
    "state": "on" // "on" or "off"
  },
  {
    "action": "presentation-toggle-laser" // Toggles laser pointer
  },
  {
    "action": "presentation-set-pen", // Enables or disables live drawing/annotation pen on stage
    "state": "on" // "on" or "off"
  },
  {
    "action": "presentation-toggle-pen" // Toggles drawing pen
  },
  {
    "action": "presentation-clear-annotations" // Erases all current live annotations and drawings from slide
  },
  {
    "action": "presentation-open-settings" // Opens the presentation configuration modal drawer
  },
  {
    "action": "presentation-close-settings" // Closes presentation configuration settings
  },
  {
    "action": "presentation-toggle-fullscreen" // Toggles fullscreen mode
  }
]
\`\`\`

PRESENTATION & KIOSK MODE CONTROL AUTHORITY:
You possess complete autonomous command over all presentation features and menus.
- If the user asks to start/launch presentation or board meeting, emit "start-presentation".
- If the user asks to navigate (e.g. "next slide", "previous", "go to slide 3", "show sales slide", "अगली स्लाइड दिखाओ"), emit "presentation-next", "presentation-prev", or "presentation-goto-slide".
- If the user asks to adjust timings (e.g. "set duration to 15 seconds", "give me more time on this slide", "make summary speed 1.5x", "auto-advance on/off"), emit "presentation-set-duration", "presentation-adjust-duration", "presentation-set-speed", or "presentation-set-auto-advance".
- If the user asks to change layout or look (e.g. "change layout to side/bottom/minimal", "dark theme", "light theme", "compact summary"), emit "presentation-set-layout", "presentation-set-theme", or "presentation-set-density".
- If the user asks to use tools (e.g. "laser pointer", "drawing pen", "clear drawing", "voice narration", "open presentation settings", "fullscreen"), emit the corresponding presentation action.
- Always provide a polite, professional English confirmation message describing the exact change applied.

VEDRA BI FORMAL AGENT KNOWLEDGE BASE (15+ FORMULAS & 10 BUSINESS LOGIC FRAMEWORKS):
You have complete architectural mastery over all 15 dynamic Excel-grade formulas and 10 executive business logic rules imported directly from learning.html:

1. =INSERT(Target, Direction, "Text") -> e.g. =INSERT(A2, R, "Lead Region: ") [Reactive cell coordinate binding]
2. =SUM(ColumnOrRange, Direction, "Text") -> e.g. =SUM(Sales, R, "Total Revenue: ₹") [Cumulative financial aggregate]
3. =AVG(ColumnOrRange, Direction, "Text") -> e.g. =AVG(Sales, R, "Avg Order: ₹") [Statistical mean / deal size]
4. =MAX(ColumnOrRange, Direction, "Text") -> e.g. =MAX(Sales, R, "Peak Deal: ₹") [Peak transaction / outlier discovery]
5. =MIN(ColumnOrRange, Direction, "Text") -> e.g. =MIN(Expenses, R, "Min Cost: ₹") [Cost floor / lowest outflow]
6. =COUNT(ColumnOrRange, Direction, "Text") -> e.g. =COUNT(A, R, "Total Records: ") [Population cardinality & frequency]
7. =GROWTH(Current, Prev, Direction, "Text") -> e.g. =GROWTH(C2, B2, R, "MoM Growth: ") [Period momentum with dynamic ▲ / ▼]
8. =DIFF(Target1, Target2, Direction, "Text") -> e.g. =DIFF(Sales, Cost, R, "Net Margin: ₹") [Net profit delta & margin spread]
9. =PERCENT(Actual, Max, Direction, "Text") -> e.g. =PERCENT(Sales, 5000000, R, "Quota Met: ") [Attainment ratio for Speedometer Gauges]
10. =REMAINING(Goal, Current, Direction, "Text") -> e.g. =REMAINING(5000000, Sales, R, "Shortfall: ₹") [Deficit gap-to-goal clamped to 0]
11. =STATUS(Target, Threshold, "PassText", "FailText") -> e.g. =STATUS(Sales, 500000, "Qualified ✅", "Disqualified ❌") [SLA hurdle badges]
12. =IF(Condition, "TrueText", "FalseText") -> e.g. =IF(B2>80000, "Tier 1 Elite", "Tier 2 Standard") [Excel-grade boolean branching]
13. =LATEST(ColumnName, Direction, "Text") -> e.g. =LATEST(Sales, R, "Latest Inflow: ₹") [Streaming bottom-most row capture]
14. =TOP(ColumnName, N, Direction, "Text") -> e.g. =TOP(Sales, 1, R, "Leader Sales: ₹") [Rank-N leaderboard extraction]
15. =FORMAT(Target, "Style", Direction, "Text") -> e.g. =FORMAT(B2, "INR", R, "Total Inflow: ") [INR ₹ Lakh/Crore localization]

CORE BUSINESS LOGIC DIRECTIVES:
- Direction Parameter: "R" places computed value on Right ("Total: ₹50,000"); "L" places value on Left ("₹50,000 Total").
- Gross Margin Rule: Use DIFF(Revenue, Cost) or DIFF(Sales, Expenses) for net profit calculations.
- Growth Momentum Rule: Use GROWTH(CurrentPeriod, PriorPeriod) to track expansion and attach vector indicators.
- Quota Attainment Rule: Use PERCENT for Speedometer Gauges, and REMAINING for pipeline deficit.
- SLA Compliance Rule: Use STATUS with emoji checkmarks for automated hurdle alerts.
- Partner Tiering Rule: Use IF for classification into Enterprise / Elite vs Commercial tiers.
- Whenever the user asks to calculate or apply formulas to template cards, return "apply-template-formula", "create-template-card", or "apply-knowledge-calculation" with the exact formula!
- If the user asks about the knowledge base or learning menu, return "show-knowledge-base" or explain the formula mechanisms!

PROFESSIONAL BI DASHBOARD LAYOUT & SPATIAL ARCHITECTURE RULES:
When the user asks where charts/KPIs/textboxes should be positioned, or requests a professional layout:
1. Top Horizon (y: 15px): Strategic Executive Header / Textbox (Width: 100%, Height: 110px). Provides strategic memo, operational scope, and context.
2. Top Tier (y: 140px): Executive KPI Horizon. 3 to 4 high-level summary metrics (Revenue, Profit, Volume, Sparkline) arranged horizontally side-by-side with uniform heights (~195px) and equal widths. Why? The "3-Second Rule" in Executive BI mandates key business metrics are immediately visible at the top without scrolling.
3. Middle Tier (y: 355px): Primary Analytics (2-Column Grid, Width: ~49% each, Height: 400px). Contains Time-Series Trend Line chart on the left (trajectory over time) and Primary Comparative Bar chart on the right (category breakdown).
4. Bottom Tier (y: 775px): Secondary Distribution & Benchmarks (Width: ~49% each, Height: 360px). Contains Proportional Donut/Pie charts (market share) and Multi-Metric Radar or Treemap benchmarks.
Use 'arrange-dashboard-professionally' to automatically enforce this architecture on existing elements, 'design-professional-dashboard' to build a complete coordinated layout from scratch, or 'set-element-position' to position specific cards into their ideal zones!

Available Visual Style Effects:
- "effect-shadow-light" (हल्की परछाई / Soft light shadow)
- "effect-shadow-dark" (गहरी परछाई / Deep dark shadow)
- "effect-cyberpunk" (साइबरपंक नियॉन / Cyberpunk Pink & Blue Neon glow)
- "effect-sunset-fire" (सूर्यास्त अग्नि / Sunset Orange-Red Gradient)
- "effect-emerald" (पन्ना वन / Emerald Forest Green Gradient Glow)
- "effect-retro-gold" (विंटेज गोल्ड / Classic Retro Vintage Gold border)
- "effect-minimalist" (आधुनिक न्यूनतम / Clean Modern Minimalist white)
- "effect-glass-frosted" (फ्रॉस्टेड ग्लास / Frosted Glass card overlay)

Ensure column names in xAxis and yAxes match the case and text of the provided headers EXACTLY.
If the user asks for a dashboard build, clear the dashboard first and generate 2-3 highly relevant charts representing the dataset beautifully, with style effects applied!

AUTONOMOUS MULTITASKING & PROMPT DECOMPOSITION (टास्क-बाय-टास्क निष्पादन):
You possess full autonomous multitasking and task decomposition capabilities:
1. When the user gives a compound, complex, or multi-step prompt (e.g. "sales chart banao, kpi add karo aur anomaly scan karo", "1. clear 2. bar chart 3. presentation", or asks in Hindi/Hinglish "multi tasking karo aur prompt ko task me divide karke task by task pura karo"):
   - ALWAYS break down the intent in your conversational reply under an explicit header:
     "### 🚀 Autonomous Multi-Task Execution Plan"
   - List each subtask with step numbers (e.g. "Step 1: ...", "Step 2: ..."), their operational objective, and execution mode (Parallel vs Sequential).
2. Inside the \`\`\`json-actions\`\`\` block, emit an ordered array where EACH subtask corresponds to a discrete action item.
3. Include "taskTitle" and "category" on each action object (e.g. "taskTitle": "Plot Sales by Product", "category": "visualization").
4. For independent actions (such as rendering two different charts, creating KPI cards, or running predictive anomaly scans), set "canRunParallel": true so the client-side worker pool executes them concurrently in true parallel multitasking without delay!`;

    const contents = [];
    if (history && Array.isArray(history)) {
      history.forEach((h: any) => {
        contents.push({
          role: h.role === "user" ? "user" : "model",
          parts: [{ text: h.content }],
        });
      });
    }

    const userParts: any[] = [{ text: message }];
    if (image_base64) {
      const match = image_base64.match(/^data:(image\/[a-zA-Z]+);base64,(.+)$/);
      if (match) {
        userParts.push({
          inlineData: {
            mimeType: match[1],
            data: match[2],
          },
        });
      }
    }

    contents.push({
      role: "user",
      parts: userParts,
    });

    let client: any = null;
    try {
      client = getAiClient();
    } catch (clientErr: any) {
      console.warn("Gemini client initialization skipped or failed:", clientErr?.message || clientErr);
    }

    const allCandidateModels = [
      "gemini-3.1-flash-lite",
      "gemini-flash-lite-latest",
      "gemini-3.5-flash-lite",
      "gemini-3.6-flash",
      "gemini-flash-latest",
      "gemini-3.8-flash",
    ];
    const now = Date.now();
    const activeModels = allCandidateModels.filter(m => (modelCooldownUntil.get(m) || 0) <= now);
    const candidateModels = activeModels.length > 0 ? activeModels : allCandidateModels;

    let isClientDisconnected = false;
    res.on("close", () => {
      if (!res.writableEnded) {
        isClientDisconnected = true;
      }
    });

    const safeWrite = (data: string): boolean => {
      if (isClientDisconnected || res.writableEnded || res.destroyed) return false;
      try {
        const ok = res.write(data);
        if (typeof (res as any).flush === "function") {
          (res as any).flush();
        }
        return ok;
      } catch {
        return false;
      }
    };

    if (isStream) {
      res.writeHead(200, {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
      });
      if (typeof (res as any).flushHeaders === "function") {
        (res as any).flushHeaders();
      }

      let streamed = false;
      let fullText = "";

      if (client) {
        for (const modelName of candidateModels) {
          if (isClientDisconnected) break;
          try {
            const responseStream = await client.models.generateContentStream({
              model: modelName,
              contents: contents,
              config: {
                systemInstruction: systemInstruction,
                temperature: 0.2,
              },
            });

            for await (const chunk of responseStream) {
              if (isClientDisconnected || res.writableEnded || res.destroyed) break;
              if (chunk.text) {
                fullText += chunk.text;
                safeWrite(`data: ${JSON.stringify({ chunk: chunk.text })}\n\n`);
              }
            }
            if (fullText.trim()) {
              streamed = true;
              break;
            }
          } catch (err: any) {
            const isBusy = err?.status === 503 || err?.code === 503 || String(err?.message || "").includes("503") || String(err?.message || "").includes("high demand") || String(err?.message || "").includes("RESOURCE_EXHAUSTED");
            if (isBusy) {
              modelCooldownUntil.set(modelName, Date.now() + 60000);
              console.log(`[AI Routing] Model ${modelName} experiencing temporary peak load (503/429), switching to next model.`);
            } else {
              console.log(`[AI Routing] Model ${modelName} fallback triggered, switching to next candidate.`);
            }
            if (fullText.trim()) {
              streamed = true;
              break;
            }
            // Proceed immediately to the next candidate model
          }
        }
      }

      if (!streamed || !fullText.trim()) {
        const fallback = generateFallbackReply(req.body.message, req.body.headers || [], req.body.focusedChart, req.body.dashboardInventory);
        const replyText = fallback.reply;
        // Natural chunking to give realistic real-time token streaming feel even in fallback
        const words = replyText.split(" ");
        for (let i = 0; i < words.length; i++) {
          if (isClientDisconnected || res.writableEnded || res.destroyed) break;
          const chunk = (i === 0 ? "" : " ") + words[i];
          safeWrite(`data: ${JSON.stringify({ chunk })}\n\n`);
          if (i % 4 === 0) {
            await new Promise((r) => setTimeout(r, 15));
          }
        }
        safeWrite(`data: ${JSON.stringify({ done: true, fullText: replyText, isFallback: true })}\n\n`);
        if (!res.writableEnded && !res.destroyed) {
          res.end();
        }
        return;
      }

      safeWrite(`data: ${JSON.stringify({ done: true, fullText })}\n\n`);
      if (!res.writableEnded && !res.destroyed) {
        res.end();
      }
      return;
    }

    let responseText = "";

    if (client) {
      for (const modelName of candidateModels) {
        try {
          const response = await client.models.generateContent({
            model: modelName,
            contents: contents,
            config: {
              systemInstruction: systemInstruction,
              temperature: 0.2,
            },
          });
          if (response && response.text) {
            responseText = response.text;
            break;
          }
        } catch (err: any) {
          const isBusy = err?.status === 503 || err?.code === 503 || String(err?.message || "").includes("503") || String(err?.message || "").includes("high demand") || String(err?.message || "").includes("RESOURCE_EXHAUSTED");
          if (isBusy) {
            modelCooldownUntil.set(modelName, Date.now() + 60000);
            console.log(`[AI Routing] Model ${modelName} experiencing temporary peak load (503/429), switching to next model.`);
          } else {
            console.log(`[AI Routing] Model ${modelName} fallback triggered, switching to next candidate.`);
          }
        }
      }
    }

    if (!responseText) {
      const fallback = generateFallbackReply(req.body.message, req.body.headers || [], req.body.focusedChart, req.body.dashboardInventory);
      res.json({ reply: fallback.reply, isFallback: true });
      return;
    }

    const reply = responseText || "I'm sorry, I was unable to generate a response at this moment.";
    res.json({ reply });
  } catch (error: any) {
    console.error("Gemini API Error in server (using fallback):", error?.message || error);
    try {
      const fallback = generateFallbackReply(req.body.message, req.body.headers || [], req.body.focusedChart, req.body.dashboardInventory);
      if (isStream) {
        if (!res.headersSent) {
          res.writeHead(200, {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
          });
        }
        res.write(`data: ${JSON.stringify({ chunk: fallback.reply, done: true, fullText: fallback.reply, isFallback: true })}\n\n`);
        res.end();
      } else {
        res.json({ reply: fallback.reply, isFallback: true });
      }
    } catch (fallbackError) {
      res.status(500).json({ error: error?.message || "Internal server error" });
    }
  }
});

// =========================================================
// HIGH-SPEED BACKEND CHART CALCULATION & SPEC ENGINE ENDPOINTS
// =========================================================

// Helper to get dataset from body or cached disk file
function resolveDataset(req: express.Request): any[] {
  const { rawData, userId } = req.body;
  if (Array.isArray(rawData) && rawData.length > 0) {
    return rawData;
  }
  if (userId) {
    const cachedPath = path.join(tmpDir, `rawData_${userId}.json`);
    if (fs.existsSync(cachedPath)) {
      try {
        const fileContent = fs.readFileSync(cachedPath, "utf-8");
        return JSON.parse(fileContent);
      } catch (e) {
        console.warn(`Failed to parse cached dataset for user ${userId}`);
      }
    }
  }
  return [];
}

// 1. Single Chart Processing Endpoint
app.post("/api/chart-engine/process", (req, res) => {
  try {
    const { chartConfig } = req.body;
    if (!chartConfig) {
      return res.status(400).json({ error: "Missing chartConfig in body" });
    }

    const data = resolveDataset(req);
    const result = generateChartSpec(chartConfig as ChartConfigInput, data);

    res.json(result);
  } catch (error: any) {
    console.error("Error in /api/chart-engine/process:", error);
    res.status(500).json({ error: error?.message || "Chart processing failed" });
  }
});

// 2. Smart Chart Auto-Recommendation Engine Endpoint
app.post("/api/chart-engine/recommend", (req, res) => {
  try {
    const data = resolveDataset(req);
    const startTime = Date.now();
    const recommendations = recommendChartSpecs(data);
    const executionTimeMs = Date.now() - startTime;

    res.json({
      success: true,
      executionTimeMs,
      recommendationsCount: recommendations.length,
      recommendations
    });
  } catch (error: any) {
    console.error("Error in /api/chart-engine/recommend:", error);
    res.status(500).json({ error: error?.message || "Recommendation engine failed" });
  }
});

// 3. Parallel Batch Chart Processing for Full Dashboard
app.post("/api/chart-engine/batch-process", (req, res) => {
  try {
    const { visualizations } = req.body;
    if (!Array.isArray(visualizations)) {
      return res.status(400).json({ error: "visualizations array is required" });
    }

    const data = resolveDataset(req);
    const startTime = Date.now();
    const results: { [chartId: string]: any } = {};

    for (const config of visualizations) {
      if (config && config.id) {
        results[config.id] = generateChartSpec(config as ChartConfigInput, data);
      }
    }

    const executionTimeMs = Date.now() - startTime;

    res.json({
      success: true,
      executionTimeMs,
      chartCount: Object.keys(results).length,
      results
    });
  } catch (error: any) {
    console.error("Error in /api/chart-engine/batch-process:", error);
    res.status(500).json({ error: error?.message || "Batch chart processing failed" });
  }
});

// 4. Pre-Rendered Vector SVG Endpoint
app.post("/api/chart-engine/svg-render", (req, res) => {
  try {
    const { chartConfig, width, height } = req.body;
    if (!chartConfig) {
      return res.status(400).json({ error: "Missing chartConfig in body" });
    }

    const data = resolveDataset(req);
    const svgString = generateChartSVG(chartConfig as ChartConfigInput, data, width || 600, height || 350);

    res.type("image/svg+xml").send(svgString);
  } catch (error: any) {
    console.error("Error in /api/chart-engine/svg-render:", error);
    res.status(500).json({ error: error?.message || "SVG rendering failed" });
  }
});

// 5. Asynchronous Offloaded Background Job Queue Endpoint (Submit Task)
app.post("/api/chart-engine/async-job", (req, res) => {
  try {
    const { chartConfig, generateSvg } = req.body;
    if (!chartConfig) {
      return res.status(400).json({ error: "Missing chartConfig in body" });
    }

    const data = resolveDataset(req);
    const job = createAsyncJob(chartConfig as ChartConfigInput, data, Boolean(generateSvg));

    res.status(202).json({
      success: true,
      jobId: job.jobId,
      status: job.status,
      message: "Chart processing task offloaded asynchronously to server"
    });
  } catch (error: any) {
    console.error("Error creating async chart job:", error);
    res.status(500).json({ error: error?.message || "Async job creation failed" });
  }
});

// 6. Asynchronous Background Job Status/Polling Endpoint
app.get("/api/chart-engine/async-job/:jobId", (req, res) => {
  try {
    const { jobId } = req.params;
    const job = getAsyncJobStatus(jobId);

    if (!job) {
      return res.status(404).json({ success: false, error: "Job not found or expired" });
    }

    res.json({
      success: true,
      jobId: job.jobId,
      status: job.status,
      progress: job.progress,
      result: job.result,
      svg: job.svg,
      error: job.error,
      createdAt: job.createdAt,
      completedAt: job.completedAt
    });
  } catch (error: any) {
    console.error("Error querying async job status:", error);
    res.status(500).json({ error: error?.message || "Job status check failed" });
  }
});

// =========================================================
// WEBSOCKET REAL-TIME SERVER-SIDE CHART ENGINE
// =========================================================
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("/learning", (req, res) => {
      res.sendFile(path.join(distPath, "learning.html"));
    });
    app.get("/edit_data", (req, res) => {
      res.sendFile(path.join(distPath, "edit_data.html"));
    });
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const httpServer = http.createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: "/ws/charts" });

  wss.on("connection", (ws: WebSocket) => {
    console.log("[WebSocket] Client connected to real-time Chart Engine");

    ws.send(JSON.stringify({
      event: "connected",
      message: "Connected to Vedra BI High-Performance WebSocket Chart Engine v2.0",
      serverTime: new Date().toISOString()
    }));

    ws.on("message", (rawMsg: string) => {
      try {
        const msg = JSON.parse(rawMsg.toString());
        const { action, requestId, chartConfig, rawData, userId, visualizations, width, height } = msg;

        // Resolve data from message payload or cached disk file
        let dataset = Array.isArray(rawData) && rawData.length > 0 ? rawData : [];
        if (dataset.length === 0 && userId) {
          const cachedPath = path.join(tmpDir, `rawData_${userId}.json`);
          if (fs.existsSync(cachedPath)) {
            try {
              dataset = JSON.parse(fs.readFileSync(cachedPath, "utf-8"));
            } catch (e) {
              console.warn(`[WS] Failed to parse disk cache for ${userId}`);
            }
          }
        }

        switch (action) {
          case "ping": {
            ws.send(JSON.stringify({ event: "pong", requestId, timestamp: Date.now() }));
            break;
          }

          case "process_chart": {
            if (!chartConfig) {
              ws.send(JSON.stringify({ event: "error", requestId, error: "Missing chartConfig" }));
              return;
            }

            // Emit initial progress event
            ws.send(JSON.stringify({ event: "progress", requestId, progress: 20, message: "Reading dataset..." }));

            setImmediate(() => {
              try {
                ws.send(JSON.stringify({ event: "progress", requestId, progress: 60, message: "Calculating aggregations..." }));
                const result = generateChartSpec(chartConfig as ChartConfigInput, dataset);
                ws.send(JSON.stringify({
                  event: "chart_result",
                  requestId,
                  success: true,
                  result
                }));
              } catch (err: any) {
                ws.send(JSON.stringify({ event: "error", requestId, error: err?.message || "Chart processing failed" }));
              }
            });
            break;
          }

          case "batch_process": {
            if (!Array.isArray(visualizations)) {
              ws.send(JSON.stringify({ event: "error", requestId, error: "visualizations array required" }));
              return;
            }

            setImmediate(() => {
              try {
                const startTime = Date.now();
                const results: { [chartId: string]: any } = {};
                const total = visualizations.length;

                visualizations.forEach((config: any, index: number) => {
                  if (config && config.id) {
                    results[config.id] = generateChartSpec(config as ChartConfigInput, dataset);
                    const progress = Math.round(((index + 1) / total) * 100);
                    ws.send(JSON.stringify({ event: "progress", requestId, progress, chartId: config.id }));
                  }
                });

                ws.send(JSON.stringify({
                  event: "batch_result",
                  requestId,
                  success: true,
                  executionTimeMs: Date.now() - startTime,
                  chartCount: Object.keys(results).length,
                  results
                }));
              } catch (err: any) {
                ws.send(JSON.stringify({ event: "error", requestId, error: err?.message || "Batch process failed" }));
              }
            });
            break;
          }

          case "recommend_charts": {
            setImmediate(() => {
              try {
                const startTime = Date.now();
                const recommendations = recommendChartSpecs(dataset);
                ws.send(JSON.stringify({
                  event: "recommendations",
                  requestId,
                  success: true,
                  executionTimeMs: Date.now() - startTime,
                  recommendations
                }));
              } catch (err: any) {
                ws.send(JSON.stringify({ event: "error", requestId, error: err?.message || "Recommendations failed" }));
              }
            });
            break;
          }

          case "render_svg": {
            if (!chartConfig) {
              ws.send(JSON.stringify({ event: "error", requestId, error: "Missing chartConfig" }));
              return;
            }

            setImmediate(() => {
              try {
                const svg = generateChartSVG(chartConfig as ChartConfigInput, dataset, width || 600, height || 350);
                ws.send(JSON.stringify({
                  event: "svg_result",
                  requestId,
                  success: true,
                  svg
                }));
              } catch (err: any) {
                ws.send(JSON.stringify({ event: "error", requestId, error: err?.message || "SVG render failed" }));
              }
            });
            break;
          }

          default: {
            ws.send(JSON.stringify({ event: "error", requestId, error: `Unknown action '${action}'` }));
            break;
          }
        }
      } catch (e: any) {
        ws.send(JSON.stringify({ event: "error", error: e?.message || "Invalid JSON message" }));
      }
    });

    ws.on("close", () => {
      console.log("[WebSocket] Client disconnected");
    });
  });

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server & WebSocket running on http://0.0.0.0:${PORT} (WS: /ws/charts)`);
  });
}

setupVite();
