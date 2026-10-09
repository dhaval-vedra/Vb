/**
 * Vedra BI - Frontend Client for High-Speed Backend Chart Engine
 * Sends chart processing and recommendation requests to Express TypeScript backend via WebSocket or HTTP.
 * Features real-time bidirectional messaging, background processing, and seamless client-side fallbacks.
 */

export interface BackendStatusCache {
  isAvailable: boolean;
  lastCheckTime: number;
}

export interface WebSocketPendingCallback {
  resolve: (data: any) => void;
  reject: (err: any) => void;
  onProgress?: ((progress: number, message?: string) => void) | null;
}

export interface AsyncChartJobResult {
  chartSpec?: any;
  svg?: string;
  aggregatedData?: any;
  meta?: any;
  executionTimeMs?: number;
}

declare global {
  interface Window {
    BackendChartClient?: any;
  }
}

let backendStatusCache: BackendStatusCache = { isAvailable: true, lastCheckTime: 0 };

// =========================================================
// REAL-TIME WEBSOCKET CLIENT MANAGER
// =========================================================
let wsInstance: WebSocket | null = null;
let wsConnected: boolean = false;
let wsPendingCallbacks: Map<string, WebSocketPendingCallback> = new Map();
let wsRequestIdCounter: number = 0;

function getWebSocketUrl(): string {
  if (typeof window === 'undefined') return 'ws://localhost:3000/ws/charts';
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/ws/charts`;
}

export function initChartWebSocket(): WebSocket | null {
  if (typeof window === 'undefined' || typeof WebSocket === 'undefined') return null;
  if (wsInstance && (wsInstance.readyState === WebSocket.CONNECTING || wsInstance.readyState === WebSocket.OPEN)) {
    return wsInstance;
  }

  try {
    const wsUrl = getWebSocketUrl();
    wsInstance = new WebSocket(wsUrl);

    wsInstance.onopen = () => {
      wsConnected = true;
      console.log('[Chart WebSocket] Connected to server-side real-time Chart Engine');
    };

    wsInstance.onmessage = (event: MessageEvent) => {
      try {
        const msg = JSON.parse(event.data);
        const { requestId, event: eventType } = msg;

        if (requestId && wsPendingCallbacks.has(requestId)) {
          const callbackObj = wsPendingCallbacks.get(requestId);
          if (!callbackObj) return;
          const { resolve, reject, onProgress } = callbackObj;

          if (eventType === 'progress' && typeof onProgress === 'function') {
            onProgress(msg.progress, msg.message);
            return;
          }

          if (eventType === 'chart_result' || eventType === 'batch_result' || eventType === 'recommendations' || eventType === 'svg_result') {
            wsPendingCallbacks.delete(requestId);
            resolve(msg);
            return;
          }

          if (eventType === 'error') {
            wsPendingCallbacks.delete(requestId);
            reject(new Error(msg.error || 'WebSocket chart engine error'));
            return;
          }
        }
      } catch (e) {
        console.warn('[Chart WebSocket] Message parse error:', e);
      }
    };

    wsInstance.onerror = (err: Event) => {
      console.warn('[Chart WebSocket] Connection error:', err);
      wsConnected = false;
    };

    wsInstance.onclose = () => {
      wsConnected = false;
      // Reconnect after 3 seconds
      setTimeout(() => {
        if (!wsConnected) initChartWebSocket();
      }, 3000);
    };

    return wsInstance;
  } catch (err) {
    console.warn('[Chart WebSocket] Init error:', err);
    return null;
  }
}

// Auto-initialize WebSocket connection on module load
if (typeof window !== 'undefined') {
  initChartWebSocket();
}

/**
 * Send request over WebSocket with timeout & fallback promise support
 */
export function sendWebSocketChartRequest(
  action: string,
  payload: Record<string, any>,
  onProgress: ((progress: number, message?: string) => void) | null = null,
  timeoutMs: number = 2500
): Promise<any> {
  return new Promise((resolve, reject) => {
    if (!wsInstance || wsInstance.readyState !== WebSocket.OPEN) {
      return reject(new Error('WebSocket not connected'));
    }

    const requestId = `req_${++wsRequestIdCounter}_${Date.now()}`;
    const timeoutTimer = setTimeout(() => {
      if (wsPendingCallbacks.has(requestId)) {
        wsPendingCallbacks.delete(requestId);
        reject(new Error('WebSocket request timeout'));
      }
    }, timeoutMs);

    wsPendingCallbacks.set(requestId, {
      resolve: (data: any) => {
        clearTimeout(timeoutTimer);
        resolve(data);
      },
      reject: (err: any) => {
        clearTimeout(timeoutTimer);
        reject(err);
      },
      onProgress
    });

    const msg = {
      action,
      requestId,
      userId: localStorage.getItem('vedrabi_user_id') || 'default_user',
      ...payload
    };

    wsInstance.send(JSON.stringify(msg));
  });
}

/**
 * Fetch chart option specification from backend TypeScript Chart Engine
 * @param chartConfig - Chart configuration object
 * @param rawData - Current dataset
 * @returns Returns computed chartSpec or null if fallback is needed
 */
export async function fetchBackendChartSpec(chartConfig: any, rawData: any[] | null): Promise<any | null> {
  if (!chartConfig) return null;

  const sendData = (rawData && rawData.length <= 10000) ? rawData : null;

  // 1. Try real-time WebSocket first if connected
  if (wsConnected) {
    try {
      const wsData = await sendWebSocketChartRequest('process_chart', { chartConfig, rawData: sendData }, null, 1500);
      if (wsData && wsData.success && wsData.result) {
        return wsData.result;
      }
    } catch (wsErr: any) {
      console.warn('[Chart Engine] WebSocket request fallback to HTTP:', wsErr?.message || wsErr);
    }
  }

  // 2. HTTP Fallback
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500); // Fast 1.5s timeout for ultra-responsiveness

    const response = await fetch('/api/chart-engine/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chartConfig,
        rawData: sendData,
        userId: localStorage.getItem('vedrabi_user_id') || 'default_user'
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    if (data && data.success && data.chartSpec) {
      backendStatusCache.isAvailable = true;
      return data;
    }
    return null;
  } catch (err: any) {
    console.warn('[Backend Chart Engine] Using client fallback:', err.message || err);
    return null;
  }
}

/**
 * Request auto-recommendations from backend
 * @param rawData 
 * @returns Recommendations list
 */
export async function fetchBackendRecommendations(rawData: any[] | null): Promise<any[]> {
  try {
    const sendData = (rawData && rawData.length <= 5000) ? rawData : null;
    const response = await fetch('/api/chart-engine/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rawData: sendData,
        userId: localStorage.getItem('vedrabi_user_id') || 'default_user'
      })
    });

    if (!response.ok) return [];
    const result = await response.json();
    return result?.recommendations || [];
  } catch (err) {
    console.warn('[Backend Recommendations] Fallback to local:', err);
    return [];
  }
}

/**
 * Batch process all dashboard charts in a single backend call
 * @param visualizations 
 * @param rawData 
 * @returns Batch result object or null
 */
export async function fetchBackendBatchChartSpecs(visualizations: any[], rawData: any[] | null): Promise<any | null> {
  if (!visualizations || visualizations.length === 0) return null;

  const sendData = (rawData && rawData.length <= 10000) ? rawData : null;

  // 1. Try real-time WebSocket if connected
  if (wsConnected) {
    try {
      const wsData = await sendWebSocketChartRequest('batch_process', { visualizations, rawData: sendData }, null, 2500);
      if (wsData && wsData.success && wsData.results) {
        return wsData.results;
      }
    } catch (wsErr: any) {
      console.warn('[Backend Batch Engine] WebSocket fallback to HTTP:', wsErr?.message || wsErr);
    }
  }

  // 2. HTTP Fallback
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const response = await fetch('/api/chart-engine/batch-process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visualizations,
        rawData: sendData,
        userId: localStorage.getItem('vedrabi_user_id') || 'default_user'
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) return null;
    const data = await response.json();
    if (data && data.success && data.results) {
      return data.results;
    }
    return null;
  } catch (err) {
    console.warn('[Backend Batch Chart Engine] Using client fallback:', err);
    return null;
  }
}

/**
 * Fetch pre-rendered server SVG string for lightweight rendering
 * @param chartConfig 
 * @param rawData 
 * @param width 
 * @param height 
 * @returns Pre-rendered SVG string or null
 */
export async function fetchBackendChartSVG(
  chartConfig: any,
  rawData: any[] | null,
  width: number = 600,
  height: number = 350
): Promise<string | null> {
  if (!chartConfig) return null;

  try {
    const sendData = (rawData && rawData.length <= 10000) ? rawData : null;
    const response = await fetch('/api/chart-engine/svg-render', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chartConfig,
        rawData: sendData,
        width,
        height,
        userId: localStorage.getItem('vedrabi_user_id') || 'default_user'
      })
    });

    if (!response.ok) return null;
    return await response.text();
  } catch (err) {
    console.warn('[Backend SVG Render] Error:', err);
    return null;
  }
}

/**
 * Offload heavy chart calculation asynchronously & poll status without blocking main thread
 * @param chartConfig 
 * @param rawData 
 * @param onProgressCallback Optional progress updates callback
 * @param generateSvg Also request pre-rendered SVG
 * @returns Async result object
 */
export async function submitAndPollAsyncChartJob(
  chartConfig: any,
  rawData: any[] | null,
  onProgressCallback: ((progress: number) => void) | null = null,
  generateSvg: boolean = false
): Promise<AsyncChartJobResult> {
  if (!chartConfig) throw new Error('chartConfig is required');

  const sendData = (rawData && rawData.length <= 10000) ? rawData : null;

  // 1. Submit Job
  const submitRes = await fetch('/api/chart-engine/async-job', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chartConfig,
      rawData: sendData,
      generateSvg,
      userId: localStorage.getItem('vedrabi_user_id') || 'default_user'
    })
  });

  if (!submitRes.ok) {
    throw new Error(`Failed to submit async chart job: ${submitRes.status}`);
  }

  const submitData = await submitRes.json();
  const jobId = submitData.jobId;

  // 2. Poll non-blockingly until completed or failed
  const pollInterval = 50; // fast 50ms polling
  const maxAttempts = 100; // max 5s total
  let attempts = 0;

  while (attempts < maxAttempts) {
    attempts++;
    await new Promise((r) => setTimeout(r, pollInterval));

    try {
      const pollRes = await fetch(`/api/chart-engine/async-job/${jobId}`);
      if (!pollRes.ok) continue;

      const jobStatus = await pollRes.json();

      if (typeof onProgressCallback === 'function' && jobStatus.progress) {
        onProgressCallback(jobStatus.progress);
      }

      if (jobStatus.status === 'completed') {
        return {
          chartSpec: jobStatus.result?.chartSpec,
          svg: jobStatus.svg,
          aggregatedData: jobStatus.result?.aggregatedData,
          meta: jobStatus.result?.meta,
          executionTimeMs: jobStatus.result?.executionTimeMs
        };
      }

      if (jobStatus.status === 'failed') {
        throw new Error(jobStatus.error || 'Async chart job processing failed');
      }
    } catch (e) {
      if (attempts >= maxAttempts) throw e;
    }
  }

  throw new Error('Async chart job timed out');
}

// Attach globally for accessibility across non-module legacy components
if (typeof window !== 'undefined') {
  window.BackendChartClient = {
    fetchBackendChartSpec,
    fetchBackendRecommendations,
    fetchBackendBatchChartSpecs,
    fetchBackendChartSVG,
    submitAndPollAsyncChartJob,
    initChartWebSocket,
    sendWebSocketChartRequest
  };
}
