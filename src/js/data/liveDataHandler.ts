// js/liveDataHandler.ts

import { showMessage } from '../core/utils.ts';
import { 
    updateDataAndUI, 
    rawData, 
    dashboards, 
    createNewDashboard, 
    getDashboardsList, 
    getActiveDashboardId,
    saveDashboardSettings 
} from '../../store/DataHandler.ts';
import { plotAll } from '../charts/charts.ts';
import { mapApiData } from './DataMapper.js';

declare const Papa: any;

let apiIntervalId: ReturnType<typeof setInterval> | null = null;
let abortController: AbortController | null = null;
let isPaused = false;

// -----------------------------
// API डेटा fetch करना
// -----------------------------
export async function fetchDataFromApi(apiUrl: string, options: any = {}, retryCount = 0, maxRetries = 3): Promise<boolean> {
    if (!apiUrl) {
        showMessage("API URL खाली है। कृपया एक वैध URL दर्ज करें।", "warning");
        return false;
    }
    
    if (abortController) abortController.abort(); // previous request cancel करें
    abortController = new AbortController();
    const { signal } = abortController;
    
    // Construct final URL with cache buster if enabled
    let finalUrl = apiUrl;
    if (options.cacheBuster) {
        const timestamp = Date.now();
        finalUrl += (finalUrl.includes("?") ? "&" : "?") + `_=${timestamp}`;
    }

    // Set up request options
    const fetchOptions: RequestInit = {
        method: options.method || 'GET',
        signal
    };

    // Custom headers handling
    if (options.headers) {
        try {
            fetchOptions.headers = typeof options.headers === 'string' 
                ? JSON.parse(options.headers) 
                : options.headers;
        } catch (e) {
            console.error("Custom headers JSON parsing failed:", e);
        }
    }

    let response: Response;
    try {
        // Try direct browser fetch first
        response = await fetch(finalUrl, fetchOptions);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
    } catch (directErr: any) {
        if (directErr.name === 'AbortError') {
            throw directErr;
        }
        console.warn(`[LiveData] Direct fetch failed for ${finalUrl} (${directErr?.message || directErr}), trying via server proxy...`);

        // Attempt proxy fetch through backend to bypass CORS and network restrictions
        try {
            const proxyUrl = `/api/proxy?url=${encodeURIComponent(finalUrl)}`;
            response = await fetch(proxyUrl, {
                method: 'GET',
                signal
            });
            if (!response.ok) {
                let errMessage = `HTTP status: ${response.status}`;
                try {
                    const errBody = await response.json();
                    if (errBody.error) errMessage = errBody.error;
                } catch {
                    try { errMessage = await response.text(); } catch {}
                }
                throw new Error(errMessage);
            }
        } catch (proxyErr: any) {
            if (proxyErr.name === 'AbortError') throw proxyErr;
            throw new Error(`डेटा प्राप्त करने में त्रुटि: ${proxyErr.message || directErr.message}`);
        }
    }

    try {
        const contentType = response.headers.get("content-type");
        const dataText = await response.text();
        let apiData: any[] = [];
        
        if (contentType?.includes("application/json") || dataText.trim().startsWith("{") || dataText.trim().startsWith("[")) {
            const jsonData = JSON.parse(dataText);
            apiData = mapApiData(jsonData, options.dataPath || '').data;
            
        } else if (contentType?.includes("text/csv")) {
            if (typeof Papa === 'undefined') {
                throw new Error("PapaParse loaded नहीं है। HTML में <script src='papaparse.min.js'> डालें।");
            }
            const parsed = Papa.parse(dataText, {
                header: true,
                dynamicTyping: true,
                skipEmptyLines: true
            });
            apiData = parsed.data;
            
        } else if (contentType?.includes("text/plain")) {
            try {
                const jsonData = JSON.parse(dataText);
                apiData = mapApiData(jsonData, options.dataPath || '').data;
            } catch {
                throw new Error("API ने सादा टेक्स्ट लौटाया जो कि JSON फॉर्मेट में नहीं है।");
            }
        } else {
            // Fallback: try to parse as JSON first, then CSV
            try {
                const jsonData = JSON.parse(dataText);
                apiData = mapApiData(jsonData, options.dataPath || '').data;
            } catch {
                if (typeof Papa !== 'undefined') {
                    const parsed = Papa.parse(dataText, {
                        header: true,
                        dynamicTyping: true,
                        skipEmptyLines: true
                    });
                    apiData = parsed.data;
                } else {
                    throw new Error(`असमर्थित डेटा फॉर्मेट: ${contentType || 'नहीं मिला'}`);
                }
            }
        }
        
        if (apiData && apiData.length > 0) {
            // User requirement: If data is already present, keep it safe and open live data in a new tab sheet!
            const hasExistingData = rawData && rawData.length > 0;
            if (hasExistingData && !options.targetDashboardId) {
                let newTabTitle = options.tabName;
                if (!newTabTitle) {
                    try {
                        const parsedUrl = new URL(apiUrl);
                        const pathSegments = parsedUrl.pathname.split('/').filter(Boolean);
                        const endName = pathSegments.pop() || parsedUrl.hostname;
                        newTabTitle = `Live: ${endName.replace(/[^a-zA-Z0-9_-]/g, ' ').substring(0, 16).trim()} (Tab ${getDashboardsList().length + 1})`;
                    } catch (e) {
                        newTabTitle = `Live Data (Tab ${getDashboardsList().length + 1})`;
                    }
                }
                const newId = await createNewDashboard(newTabTitle);
                options.targetDashboardId = newId;
                showMessage(`पुराना डेटा सुरक्षित रखा गया! लाइव डेटा नए टैब '${newTabTitle}' में खोला गया है।`, "info");
            }

            const currentActiveId = getActiveDashboardId();
            if (!options.targetDashboardId || options.targetDashboardId === currentActiveId) {
                updateDataAndUI(apiData, null, true);
            } else {
                // Background update for target tab while user is looking at another tab
                const targetDash = dashboards.find(d => d.id === options.targetDashboardId);
                if (targetDash) {
                    targetDash.rawData = [...apiData];
                    targetDash.filteredData = [...apiData];
                    targetDash.savedFilteredData = [...apiData];
                    targetDash.headers = Object.keys(apiData[0] || {});
                    targetDash.isLiveConnected = true;
                    targetDash.liveApiUrl = apiUrl;
                    saveDashboardSettings();
                    document.dispatchEvent(new CustomEvent('dashboardsUpdated'));
                }
            }

            showMessage("API से लाइव डेटा सफलतापूर्वक लोड हो गया है!", "success");
            
            const statusContainer = document.getElementById('liveStatusContainer');
            const statusRecords = document.getElementById('liveStatusRecords');
            const statusLastSync = document.getElementById('liveStatusLastSync');
            
            if (statusContainer) statusContainer.style.display = 'block';
            if (statusRecords) statusRecords.textContent = `${apiData.length} पंक्तियाँ (rows)`;
            if (statusLastSync) statusLastSync.textContent = new Date().toLocaleTimeString();
            
            return true;
        } else {
            throw new Error("API से कोई डेटा नहीं मिला या गलत डेटा पाथ दिया गया।");
        }
        
    } catch (error: any) {
        if (error.name === 'AbortError') {
            console.warn('पिछली API कॉल रद्द कर दी गई।');
            return false;
        }
        
        if (retryCount < maxRetries) {
            console.warn(`[LiveData] Retrying API fetch (${retryCount + 1}/${maxRetries}):`, error?.message || error);
            await new Promise(r => setTimeout(r, 1500)); // 1.5 सेकंड delay
            return fetchDataFromApi(apiUrl, options, retryCount + 1, maxRetries);
        } else {
            console.warn("API से डेटा प्राप्त करने में सूचना:", error?.message || error);
            showMessage(`API डेटा फेच नहीं हो सका: ${error?.message || 'नेटवर्क त्रुटि'}`, "danger");
            stopLiveUpdate();
            return false;
        }
    }
}

// -----------------------------
// Live update शुरू करना
// -----------------------------
export async function startLiveUpdate(apiUrl: string, intervalInSeconds: number, options: any = {}) {
    stopLiveUpdate(); // previous interval clean करें
    
    isPaused = false;

    // Check if data already exists and create tab upfront
    const hasExistingData = rawData && rawData.length > 0;
    if (hasExistingData && !options.targetDashboardId) {
        let newTabTitle = options.tabName;
        if (!newTabTitle) {
            try {
                const parsedUrl = new URL(apiUrl);
                const pathSegments = parsedUrl.pathname.split('/').filter(Boolean);
                const endName = pathSegments.pop() || parsedUrl.hostname;
                newTabTitle = `Live: ${endName.replace(/[^a-zA-Z0-9_-]/g, ' ').substring(0, 16).trim()} (Tab ${getDashboardsList().length + 1})`;
            } catch (e) {
                newTabTitle = `Live Data (Tab ${getDashboardsList().length + 1})`;
            }
        }
        const newDashId = await createNewDashboard(newTabTitle);
        options.targetDashboardId = newDashId;
        showMessage(`पुराना डेटा सुरक्षित रखा गया! लाइव डेटा नए टैब '${newTabTitle}' में खोला गया है।`, "info");
    }
    
    const statusContainer = document.getElementById('liveStatusContainer');
    const badge = document.getElementById('liveStatusBadge');
    if (statusContainer) statusContainer.style.display = 'block';
    if (badge) {
        badge.className = 'badge bg-success';
        badge.innerHTML = '<span class="spinner-grow spinner-grow-sm me-1" style="width: 8px; height: 8px;" role="status"></span>सक्रिय (Active)';
    }
    
    const success = await fetchDataFromApi(apiUrl, options);
    if (success && intervalInSeconds > 0) {
        apiIntervalId = setInterval(async () => {
            if (!isPaused) await fetchDataFromApi(apiUrl, { ...options, isPeriodicSync: true });
        }, intervalInSeconds * 1000);
        
        showMessage(`लाइव डेटा अपडेट शुरू किया गया: हर ${intervalInSeconds} सेकंड में।`, "success");
    } else if (success) {
        showMessage("पहला डेटा लोड हो गया है, लेकिन इंटरवल 0 होने के कारण लाइव अपडेट शुरू नहीं हुआ है।", "info");
    }
}

// -----------------------------
// Live update बंद करना
// -----------------------------
export function stopLiveUpdate() {
    if (apiIntervalId) {
        clearInterval(apiIntervalId);
        apiIntervalId = null;
        showMessage("लाइव डेटा अपडेट बंद कर दिया गया है।", "info");
    }
    const badge = document.getElementById('liveStatusBadge');
    if (badge) {
        badge.className = 'badge bg-secondary';
        badge.innerHTML = 'निष्क्रिय (Stopped)';
    }
}

// -----------------------------
// Live update pause/resume
// -----------------------------
export function toggleLiveUpdatePause() {
    isPaused = !isPaused;
    showMessage(isPaused ? "लाइव अपडेट pause कर दिया गया।" : "लाइव अपडेट resume किया गया।", "info");
}
