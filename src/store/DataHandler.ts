// DataHandler.ts (Core Data Management)

import { auth, db, showMessage, safeJsonStringify, sanitizeForStorage } from '../js/core/utils.ts';
import { plotAll, visualizations, chartGlobalSettings, clearDataCache } from '../js/charts/charts.ts';
import { generateSummary } from '../js/ai/chat.ts';
import { 
    applyFiltersAndSort as applyFilters, 
    getCurrentFilterState,
    resetAllFilters as resetFilterUI // UI reset function
} from '../js/layout/filter.js';
import { updateKPICards } from '../js/charts/kpiSparklines.js';
import { syncDatasetToDuckDB, queryDuckDBArrowIPC, updateDuckDBMetricsUI } from '../js/data/duckdbArrowClient.ts';
import { SmartDataCompressor, CompressionStats } from '../js/core/smartDataCompressor.ts';
import { SmartSummaryEngine, SummaryConfig } from '../js/core/smartSummaryEngine.ts';
import { WorkerManager } from '../js/core/workerManager.ts';
import { ChunkedCsvStreamer } from '../js/core/chunkedCsvStreamer.ts';
import { SummaryConfigModal } from '../js/ui/summaryConfigModal.ts';
import { vedraStorage, STORES } from '../js/core/indexedDbStorage.ts';

// UIHandler functions (for updating UI after data change)
import { 
    updateControls, 
    updateTableAndUI, 
    updatePaginationAndFilterUI, 
    clearAddDataForm, 
    clearSummary 
} from './UIHandler.js'; 

declare const firebase: any;
declare const bootstrap: any;
declare const Papa: any;
declare const XLSX: any;

// Configuration constants
const CONFIG = {
    MAX_FILE_SIZE: 150 * 1024 * 1024, // 150MB to support large files
    MAX_ROWS: 1000000, // 1M rows
    DEBOUNCE_DELAY: 300,
    ROWS_PER_PAGE_OPTIONS: [10, 25, 50, 100],
    AUTO_SAVE_DELAY: 2000,
    BATCH_OPERATION_DELAY: 50
};

const SUPPORTED_FILE_TYPES: Record<string, string[]> = {
    CSV: ['csv'],
    EXCEL: ['xlsx', 'xls'],
    JSON: ['json'],
    PARQUET: ['parquet']
};

export interface DashboardSetting {
    id: string;
    name: string;
    visualizations: any[];
    chartGlobalSettings: Record<string, any>;
    backgroundTemplateIndex?: string | null;
    currentFilterState?: any;
    isFilterActive?: boolean;
    // Per-Tab / Per-Sheet Data Isolation:
    rawData?: any[];
    filteredData?: any[];
    savedFilteredData?: any[];
    headers?: string[];
    currentPage?: number;
    rowsPerPage?: number;
    isLiveConnected?: boolean;
    liveApiUrl?: string;
    liveApiOptions?: any;
    liveInterval?: number;
}

export interface TemplateLayout {
    id: string;
    name: string;
    department?: string;
    description?: string;
    isCustom?: boolean;
    visualizations: any[];
    chartGlobalSettings?: Record<string, any>;
    backgroundTemplateIndex?: string | null;
    createdAt?: string;
}

// Global State Variables
export let rawData: any[] = [];
export let filteredData: any[] = [];
export let savedFilteredData: any[] = [];
export let headers: string[] = [];
export let rowsPerPage = 10;

export function setFilteredData(data: any[]): void {
    filteredData = data;
}

// Data Hydration State Tracking
let isDataHydrated = false;
let hydrationPromise: Promise<void> | null = null;

export function setRowsPerPage(val: any): void {
    rowsPerPage = parseInt(val) || 10;
    currentPage = 1;
}

export let currentPage = 1;
export let currentDataForChat: any[] = [];
export let currentFilterState: any = null;

export let currentUserId: string | null = null;
let searchTimeout: any = null;
let autoSaveTimeout: any = null;
let isDataModified = false;
export let isFilterActive = false;

// Operation flags to prevent concurrent executions (Concurrency Mutex)
let isOperationInProgress = false;
let pendingOperation: 'applyFilters' | 'resetFilters' | null = null;
let isResetting = false; // Flag to prevent infinite loop during reset

// ========================== CONFIGURATION & STATE ==========================

export function setCurrentUserId(userId: string | null): void {
    currentUserId = userId;
}

export function getDisplayData(): any[] {
    return filteredData;
}

export function getRawData(): any[] {
    return rawData;
}

export function getHeaders(): string[] {
    return headers;
}

/**
 * Data Hydration Mechanism:
 * Ensures all chart data, raw data, filters, and dashboard settings are fully loaded and hydrated
 * from Firebase / Local Storage / State before triggering visualization engine renders.
 * Prevents partial or blank chart states.
 */
export async function ensureDataHydrated(): Promise<void> {
    if (isDataHydrated && rawData && rawData.length > 0 && filteredData && filteredData.length > 0) {
        return;
    }

    if (hydrationPromise) {
        await hydrationPromise;
        return;
    }

    hydrationPromise = (async () => {
        try {
            console.log("[Data Hydration] Hydrating data and dashboard state...");
            if (currentUserId && (!rawData || rawData.length === 0)) {
                await loadUserDataFromFirebase();
            }

            if (isFilterActive && savedFilteredData && savedFilteredData.length > 0) {
                filteredData = [...savedFilteredData];
            } else if (!filteredData || filteredData.length === 0) {
                filteredData = [...rawData];
                savedFilteredData = [...rawData];
            }

            if (currentUserId && (!visualizations || visualizations.length === 0)) {
                await loadDashboardSettings();
            }

            isDataHydrated = true;
            console.log(`[Data Hydration Complete] Hydrated ${rawData.length} raw rows, ${filteredData.length} filtered rows.`);

            document.dispatchEvent(new CustomEvent('dataHydrated', {
                detail: {
                    rowCount: rawData.length,
                    filteredRowCount: filteredData.length,
                    visualizationsCount: visualizations.length
                }
            }));
        } catch (err) {
            console.error("[Data Hydration Error] Failed to hydrate data state:", err);
        } finally {
            hydrationPromise = null;
        }
    })();

    await hydrationPromise;
}

export function isDataFullyHydrated(): boolean {
    return isDataHydrated && (rawData.length > 0 || !currentUserId);
}

export function markDataHydrated(status = true): void {
    isDataHydrated = status;
}

// ========================== NO DATA POPUP HANDLER ==========================

function showNoDataPopup(): void {
    // Check if we are on index.html page
    const isIndexPage = window.location.pathname.endsWith('index.html') || 
                       window.location.pathname.endsWith('/') ||
                       window.location.pathname === '';
    
    if (!isIndexPage) {
        console.log('No data popup skipped - not on index page');
        return;
    }

    // Create popup modal if it doesn't exist
    let noDataModal = document.getElementById('noDataModal');
    
    if (!noDataModal) {
        noDataModal = document.createElement('div');
        noDataModal.id = 'noDataModal';
        noDataModal.className = 'modal fade';
        noDataModal.innerHTML = `
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header bg-warning">
                        <h5 class="modal-title">कोई डेटा नहीं मिला</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body text-center">
                        <div class="mb-3">
                            <i class="bi bi-exclamation-triangle fs-1 text-warning"></i>
                        </div>
                        <p class="mb-3">आपके पास अभी कोई डेटा उपलब्ध नहीं है। कृपया नया डेटा अपलोड करें या डेटा एडिट पेज पर जाएं।</p>
                    </div>
                    <div class="modal-footer justify-content-center">
                        <button type="button" class="btn btn-primary" id="uploadDataBtn">
                            <i class="bi bi-upload me-2"></i>फ़ाइल अपलोड करें
                        </button>
                        <button type="button" class="btn btn-outline-primary" id="goToEditPageBtn">
                            <i class="bi bi-pencil-square me-2"></i>डेटा एडिट करें
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(noDataModal);
        
        // Add event listeners
        const modalInstance = new bootstrap.Modal(noDataModal);
        
        document.getElementById('uploadDataBtn')?.addEventListener('click', function() {
            modalInstance.hide();
            document.getElementById('fileInput')?.click();
        });
        
        document.getElementById('goToEditPageBtn')?.addEventListener('click', function() {
            modalInstance.hide();
            window.location.href = 'edit_data.html';
        });
    }
    
    const modalInstance = new bootstrap.Modal(noDataModal);
    modalInstance.show();
}

function checkAndShowNoDataPopup(): boolean {
    // Check if we are on index.html page
    const isIndexPage = window.location.pathname.endsWith('index.html') || 
                       window.location.pathname.endsWith('/') ||
                       window.location.pathname === '';
    
    if (!isIndexPage) {
        console.log('No data check skipped - not on index page');
        return false;
    }

    if (rawData.length === 0) {
        // Show popup after a small delay to ensure UI is loaded
        setTimeout(() => {
            showNoDataPopup();
        }, 500);
        return true;
    }
    return false;
}

// ========================== INIT DATA ==========================

export async function initData(): Promise<void> {
    try {
        isDataHydrated = false;
        // Reset all data states
        rawData = [];
        filteredData = [];
        savedFilteredData = [];
        headers.length = 0;
        currentDataForChat = [];
        currentFilterState = null;
        isDataModified = false;
        isFilterActive = false; 
        isOperationInProgress = false;
        pendingOperation = null;
        isResetting = false;

        showLoadingState();

        if (!currentUserId) {
            console.log("No user logged in. Data will not be loaded from Firebase.");
            // UI Handler will take care of populating controls and table display
            updateControls(headers);
            updateTableAndUI();
            
            // Check if no data and show popup (only on index.html)
            if (checkAndShowNoDataPopup()) {
                return;
            }
        }

        await loadUserDataFromFirebase();
        
        // Smart Summary Rollup Check (Loads fast summary for large datasets, real data stays in rawData)
        const savedSummaryConfig = await SmartSummaryEngine.loadSummaryConfig(currentUserId || 'guest_user');
        if (savedSummaryConfig && savedSummaryConfig.enabled && rawData.length > 0) {
            SmartSummaryEngine.setActiveConfig(savedSummaryConfig);
            const source = (isFilterActive && savedFilteredData.length > 0) ? savedFilteredData : rawData;
            const summaryRes = SmartSummaryEngine.computeSummary(source, savedSummaryConfig);
            filteredData = summaryRes.summaryData;
            savedFilteredData = [...filteredData];
            SummaryConfigModal.updateToolbarIndicator(true);
            showMessage(`⚡ स्मार्ट समरी मोड सक्रिय: ${rawData.length} वास्तविक पंक्तियों से ${summaryRes.summaryRowCount} सारांश पंक्तियाँ लोड हुईं।`, "info");
        } else if (isFilterActive && savedFilteredData.length > 0) {
            filteredData = [...savedFilteredData];
            showMessage("सहेजे गए फ़िल्टर बहाल किए गए! अब फ़िल्टर्ड डेटा दिख रहा है।", "info");
            SummaryConfigModal.updateToolbarIndicator(false);
        } else {
            filteredData = [...rawData];
            savedFilteredData = [...rawData];
            isFilterActive = false; 
            SummaryConfigModal.updateToolbarIndicator(false);
        }
        
        clearDataCache();
        currentDataForChat = [...filteredData];

        // UI Handler call to update controls, forms, and table
        updateControls(headers);
        await updateTableAndUI();

        // Update Python Backend mode UI and sync data if large
        try {
            updatePythonModeUI();
            await syncDataToBackend();
        } catch (pyErr) {
            console.warn("Python state init error:", pyErr);
        }

        // Check if no data and show popup (only on index.html)
        if (checkAndShowNoDataPopup()) {
            return;
        }

        if (filteredData.length > 0) {
            generateSummary(filteredData);
        }

        isDataHydrated = true;

        document.dispatchEvent(new CustomEvent('dataLoaded', {
            detail: { 
                rowCount: rawData.length, 
                filteredRowCount: filteredData.length,
                headers: headers,
                isFilterActive: isFilterActive
            }
        }));
        
    } catch (error: any) {
        console.error("Error initializing data:", error);
        showErrorState("Data initialize करने मे error आया: " + error.message);
        
        // Check if no data and show popup even in case of error (only on index.html)
        checkAndShowNoDataPopup();
    }
}

function showLoadingState(): void {
    const visualizationsDiv = document.getElementById('visualizations');
    const tableContainer = document.getElementById('tableContainer');
    
    const loadingHTML = `
        <div class="loading-spinner text-center p-4">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-2 text-muted">Data load हो रहा है...</p>
        </div>
    `;
    
    if (visualizationsDiv) visualizationsDiv.innerHTML = loadingHTML;
    if (tableContainer) tableContainer.innerHTML = loadingHTML;
}

function showErrorState(message: string): void {
    const visualizationsDiv = document.getElementById('visualizations');
    const tableContainer = document.getElementById('tableContainer');
    
    const errorHTML = `
        <div class="error-state text-danger text-center p-4">
            <i class="bi bi-exclamation-triangle fs-1"></i>
            <p class="mt-2">${message}</p>
            <button class="btn btn-sm btn-outline-danger mt-2" onclick="initData()">
                फिर try करें
            </button>
        </div>
    `;
    
    if (visualizationsDiv) visualizationsDiv.innerHTML = errorHTML;
    if (tableContainer) tableContainer.innerHTML = errorHTML;
}

// ========================== DASHBOARD SETTINGS & MULTI-DASHBOARD MANAGEMENT ==========================

export let dashboards: DashboardSetting[] = [];
export let activeDashboardId = 'default';

export function getDashboardsList(): DashboardSetting[] {
    return dashboards;
}

export function getActiveDashboardId(): string {
    return activeDashboardId;
}

export function getCurrentDashboardName(): string {
    const d = dashboards.find(dash => dash.id === activeDashboardId);
    return d ? d.name : 'डिफ़ॉल्ट डैशबोर्ड';
}

export function ensureActiveDashboard(): DashboardSetting {
    if (dashboards.length === 0) {
        const defaultDash: DashboardSetting = {
            id: 'default',
            name: 'Sheet 1 (मुख्य)',
            visualizations: [...visualizations],
            chartGlobalSettings: { ...chartGlobalSettings },
            backgroundTemplateIndex: localStorage.getItem('selectedBackgroundTemplateIndex') || null,
            currentFilterState: currentFilterState,
            isFilterActive: isFilterActive,
            rawData: [...rawData],
            filteredData: [...filteredData],
            savedFilteredData: [...savedFilteredData],
            headers: [...headers],
            currentPage: currentPage,
            rowsPerPage: rowsPerPage
        };
        dashboards.push(defaultDash);
        activeDashboardId = 'default';
        return defaultDash;
    }
    let cur = dashboards.find(d => d.id === activeDashboardId);
    if (!cur) {
        cur = dashboards[0];
        activeDashboardId = cur.id;
    }
    return cur;
}

export function syncActiveDashboardState(): void {
    const cur = ensureActiveDashboard();
    cur.visualizations = JSON.parse(JSON.stringify(visualizations));
    cur.chartGlobalSettings = { ...chartGlobalSettings };
    cur.backgroundTemplateIndex = localStorage.getItem('selectedBackgroundTemplateIndex') || null;
    cur.currentFilterState = currentFilterState;
    cur.isFilterActive = isFilterActive;
    cur.rawData = [...rawData];
    cur.filteredData = [...filteredData];
    cur.savedFilteredData = [...savedFilteredData];
    cur.headers = [...headers];
    cur.currentPage = currentPage;
    cur.rowsPerPage = rowsPerPage;
}

export async function createNewDashboard(name?: string): Promise<string> {
    syncActiveDashboardState();
    if (!name) name = `Sheet ${dashboards.length + 1}`;
    const newId = `dash-${Date.now()}`;
    const newDash: DashboardSetting = {
        id: newId,
        name: name,
        visualizations: [],
        chartGlobalSettings: {
            showLabels: true,
            showToolbox: true,
            chartPalette: 'default',
            showLegend: true
        },
        backgroundTemplateIndex: '0',
        currentFilterState: null,
        isFilterActive: false,
        rawData: [],
        filteredData: [],
        savedFilteredData: [],
        headers: [],
        currentPage: 1,
        rowsPerPage: 10
    };
    dashboards.push(newDash);
    
    // Switch to new dashboard
    await switchDashboard(newId);
    return newId;
}

export async function renameDashboard(id: string, newName: string): Promise<boolean> {
    const d = dashboards.find(dash => dash.id === id);
    if (d) {
        d.name = newName;
        await saveDashboardSettings();
        // Dispatch event so UI updates
        document.dispatchEvent(new CustomEvent('dashboardsUpdated'));
        return true;
    }
    return false;
}

export async function deleteDashboard(id: string): Promise<boolean> {
    if (dashboards.length <= 1) {
        showMessage("कम से कम एक डैशबोर्ड टैब होना आवश्यक है!", "warning");
        return false;
    }
    const index = dashboards.findIndex(dash => dash.id === id);
    if (index !== -1) {
        dashboards.splice(index, 1);
        if (activeDashboardId === id) {
            // Switch to another dashboard
            const nextActiveId = dashboards[0].id;
            await switchDashboard(nextActiveId);
        } else {
            await saveDashboardSettings();
            document.dispatchEvent(new CustomEvent('dashboardsUpdated'));
        }
        return true;
    }
    return false;
}

export async function switchDashboard(id: string): Promise<boolean> {
    // 1. Save current state to active dashboard
    syncActiveDashboardState();

    // 2. Complete DOM clean-up of previous tab's elements so no visual residue bleeds across tabs
    const allContainers = document.querySelectorAll('.visualization-container, .template-card-container');
    allContainers.forEach((container: any) => {
        const chartId = container.id.replace('container-', '');
        const chartDom = document.getElementById(chartId);
        if (chartDom) {
            try {
                const chartInstance = (window as any).echarts?.getInstanceByDom(chartDom);
                if (chartInstance) chartInstance.dispose();
            } catch (e) {}
            try {
                (window as any).Plotly?.purge(chartDom);
            } catch (e) {}
        }
        if (container.moveable) {
            try { container.moveable.destroy(); } catch (e) {}
        }
        container.remove();
    });

    const existingMessage = document.querySelector('.no-charts-message');
    if (existingMessage) existingMessage.remove();

    // 3. Switch active ID
    activeDashboardId = id;
    const targetDash = dashboards.find(dash => dash.id === id);
    if (targetDash) {
        // Restore Visualizations
        visualizations.length = 0;
        if (Array.isArray(targetDash.visualizations)) {
            targetDash.visualizations.forEach(v => {
                visualizations.push(v);
            });
        }

        // Restore Data & Headers for this Tab
        rawData.length = 0;
        if (Array.isArray(targetDash.rawData)) {
            rawData.push(...targetDash.rawData);
        }

        filteredData.length = 0;
        if (Array.isArray(targetDash.filteredData)) {
            filteredData.push(...targetDash.filteredData);
        } else if (rawData.length > 0) {
            filteredData.push(...rawData);
        }

        savedFilteredData.length = 0;
        if (Array.isArray(targetDash.savedFilteredData)) {
            savedFilteredData.push(...targetDash.savedFilteredData);
        } else if (rawData.length > 0) {
            savedFilteredData.push(...rawData);
        }

        headers.length = 0;
        if (Array.isArray(targetDash.headers)) {
            headers.push(...targetDash.headers);
        } else if (rawData.length > 0) {
            headers.push(...Object.keys(rawData[0] || {}));
        }

        currentPage = targetDash.currentPage || 1;
        rowsPerPage = targetDash.rowsPerPage || 10;
        currentFilterState = targetDash.currentFilterState || null;
        isFilterActive = !!targetDash.isFilterActive;

        if (targetDash.chartGlobalSettings) {
            Object.keys(chartGlobalSettings).forEach(key => delete (chartGlobalSettings as any)[key]);
            Object.assign(chartGlobalSettings, targetDash.chartGlobalSettings);
        }

        if (targetDash.backgroundTemplateIndex !== null && targetDash.backgroundTemplateIndex !== undefined) {
            const index = parseInt(targetDash.backgroundTemplateIndex);
            localStorage.setItem('selectedBackgroundTemplateIndex', targetDash.backgroundTemplateIndex);
            
            try {
                const { backgroundTemplates } = await import('../js/layout/backgroundTemplates.ts');
                if (index >= 0 && index < backgroundTemplates.length) {
                    const selectedTemplate = backgroundTemplates[index];
                    const dashboardContent = document.getElementById('dashboardContent');
                    if (dashboardContent) {
                        dashboardContent.style.backgroundColor = selectedTemplate.backgroundColor;
                        dashboardContent.style.color = selectedTemplate.textColor;
                    }
                    localStorage.setItem('dashboardBackgroundColor', selectedTemplate.backgroundColor);
                    localStorage.setItem('dashboardTextColor', selectedTemplate.textColor);
                }
            } catch (err) {
                console.warn("Could not dynamically apply background template", err);
            }
        }
    }

    // 4. Update Table UI & pagination specifically for this Tab's data!
    try {
        const { updateTableAndUI, updatePaginationAndFilterUI } = await import('./UIHandler.js');
        await updateTableAndUI();
        updatePaginationAndFilterUI();
    } catch (tblErr) {
        console.warn("Could not update table on dashboard switch:", tblErr);
    }

    // 5. Update KPI cards specifically for this Tab's data!
    try {
        const { updateKPICards } = await import('../js/charts/kpiSparklines.js');
        updateKPICards();
    } catch (kpiErr) {
        console.warn("Could not update KPI cards on switch:", kpiErr);
    }

    // 6. Update Column Drag Lists & Controls in Sidebar for this Tab's headers!
    try {
        const { populateColumnDragLists, updateDropZonePlaceholders } = await import('../js/charts/chartcolomdrag.ts');
        populateColumnDragLists(headers);
        updateDropZonePlaceholders();
    } catch (colErr) {
        console.warn("Could not populate column drag lists:", colErr);
    }

    // 7. Save to DB/localStorage
    await saveDashboardSettings();
    
    // 8. Dispatch events
    document.dispatchEvent(new CustomEvent('dashboardsUpdated'));
    document.dispatchEvent(new CustomEvent('dashboardSwitched', { detail: { id } }));
    
    // 9. Replot charts & cards for this Tab only!
    try {
        const { plotAll } = await import('../js/charts/charts.ts');
        await plotAll();
    } catch (e) {
        console.error("Error plotting switched dashboard", e);
    }
    
    showMessage(`सफलतापूर्वक डैशबोर्ड '${targetDash ? targetDash.name : id}' पर स्विच किया गया!`, "success");
    return true;
}

export async function moveChartToDashboard(chartId: string, targetDashboardId: string): Promise<boolean> {
    const chartIndex = visualizations.findIndex(v => v.id === chartId);
    if (chartIndex === -1) {
        showMessage("चार्ट नहीं मिला!", "warning");
        return false;
    }

    const chartToMove = visualizations[chartIndex];

    // Check if target dashboard exists
    let targetDash = dashboards.find(d => d.id === targetDashboardId);
    if (!targetDash) {
        // If not, maybe targetDashboardId is actually a name to create
        const newId = await createNewDashboard(targetDashboardId);
        targetDash = dashboards.find(d => d.id === newId);
    }

    if (!targetDash) {
        showMessage("लक्ष्य डैशबोर्ड नहीं मिला!", "danger");
        return false;
    }

    // Remove from current
    visualizations.splice(chartIndex, 1);

    // Add to target
    if (!Array.isArray(targetDash.visualizations)) {
        targetDash.visualizations = [];
    }
    targetDash.visualizations.push(chartToMove);

    // Save
    await saveDashboardSettings();

    // Replot current
    try {
        const { plotAll } = await import('../js/charts/charts.ts');
        plotAll();
    } catch (e) {}

    document.dispatchEvent(new CustomEvent('dashboardsUpdated'));
    showMessage(`चार्ट '${chartToMove.title || chartId}' को '${targetDash.name}' में सफलतापूर्वक भेजा गया!`, "success");
    return true;
}

export function updateAutosaveUI(status: string, customTimeStr?: string): void {
    const textEl = document.getElementById('autosaveStatusText');
    const badgeEl = document.getElementById('autosaveStatusBadge');
    if (!textEl || !badgeEl) return;

    if (status === 'saving') {
        textEl.innerHTML = '<i class="bi bi-arrow-repeat spin me-1"></i> सेव हो रहा है...';
        badgeEl.className = 'd-inline-flex align-items-center gap-1.5 px-2.5 py-1 rounded-pill bg-warning text-dark border shadow-xs text-xs ms-1 cursor-pointer';
    } else if (status === 'saved') {
        const timeStr = customTimeStr || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        textEl.innerText = `ऑटो-सेव्ड (${timeStr})`;
        badgeEl.className = 'd-inline-flex align-items-center gap-1.5 px-2.5 py-1 rounded-pill bg-white border shadow-xs text-xs ms-1 cursor-pointer';
    } else if (status === 'error') {
        textEl.innerText = 'सेव विफल';
        badgeEl.className = 'd-inline-flex align-items-center gap-1.5 px-2.5 py-1 rounded-pill bg-danger text-white border shadow-xs text-xs ms-1 cursor-pointer';
    }
}

let autosaveInterval: any = null;

export function initPeriodicAutosave(intervalMs = 60000): void {
    if (autosaveInterval) clearInterval(autosaveInterval);

    autosaveInterval = setInterval(async () => {
        if (!currentUserId) return;
        updateAutosaveUI('saving');
        const success = await saveDashboardSettings();
        if (success) {
            updateAutosaveUI('saved');
        } else {
            updateAutosaveUI('error');
        }
    }, intervalMs);

    // Safeguard on navigating away or tab closing
    window.addEventListener('beforeunload', () => {
        if (currentUserId) {
            saveDashboardSettings();
        }
    });

    // Ctrl+S manual save shortcut
    window.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
            e.preventDefault();
            updateAutosaveUI('saving');
            saveDashboardSettings().then(success => {
                if (success) {
                    updateAutosaveUI('saved');
                    showMessage("डैशबोर्ड लेआउट एवं सेटिंग्स सफलतापूर्वक सहेजी गईं! (Ctrl+S)", "success");
                }
            });
        }
    });

    console.log(`Periodic autosave engine initialized (${intervalMs / 1000}s interval)`);
}

// Utility to recursively sanitize data objects before sending to Firestore
// Removes undefined object properties, strips DOM nodes, breaks circular references, and converts array undefined values to null
export function sanitizeForFirestore(obj: any, seen: WeakSet<any> = new WeakSet()): any {
    if (obj === undefined) return null;
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return obj.toISOString();

    // Prevent circular reference crashes
    if (seen.has(obj)) {
        return null;
    }

    // Check for DOM elements / canvas / window / document
    if (typeof window !== 'undefined' && (obj instanceof Element || obj instanceof Node || obj === window || obj === document)) {
        return null;
    }

    // Preserve FieldValue objects (e.g. FieldValue.serverTimestamp())
    if (obj.constructor && obj.constructor.name && (
        obj.constructor.name.includes('FieldValue') || 
        obj.constructor.name.includes('ServerTimestamp') ||
        obj.constructor.name === 'Tr' ||
        obj.constructor.name === 'Nt' ||
        obj.constructor.name === 'Timestamp'
    )) {
        if (typeof firebase === 'undefined' || !firebase.firestore || !firebase.firestore.FieldValue) {
            return new Date().toISOString();
        }
        return obj;
    }
    if (typeof obj.isEqual === 'function' && typeof obj.toMillis === 'function') {
        return obj;
    }

    seen.add(obj);

    if (Array.isArray(obj)) {
        return obj.map(item => item === undefined ? null : sanitizeForFirestore(item, seen));
    }

    const cleanObj: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined && typeof value !== 'function' && typeof value !== 'symbol') {
            if (key === 'chartInstance' || key === 'ctx' || key === 'canvas' || key === '_chart' || key === '$chart') {
                continue;
            }
            cleanObj[key] = sanitizeForFirestore(value, seen);
        }
    }
    return cleanObj;
}

function isPermissionError(err: any): boolean {
    if (!err) return false;
    const str = (typeof err === 'string' ? err : (err?.message || err?.code || err?.name || err?.details || String(err))).toLowerCase();
    return str.includes('permission') || 
           str.includes('insufficient') || 
           str.includes('unauthenticated') || 
           str.includes('unauthorized') ||
           str.includes('access-denied') ||
           str.includes('forbidden') ||
           str.includes('not allowed');
}

export async function saveDashboardSettings(): Promise<boolean> {
    if (!currentUserId) {
        showMessage("User ID not set", "warning");
        return false;
    }

    try {
        syncActiveDashboardState();

        // Backup each tab's dataset locally
        dashboards.forEach(d => {
            if (Array.isArray(d.rawData) && d.rawData.length > 0) {
                try {
                    localStorage.setItem(`vedrabi_tab_data_${d.id}`, safeJsonStringify({
                        rawData: d.rawData,
                        filteredData: d.filteredData || d.rawData,
                        headers: d.headers || []
                    }));
                } catch (e) {}
            }
        });

        const settings = {
            dashboards: dashboards.map(d => ({
                id: d.id,
                name: d.name,
                visualizations: sanitizeForStorage(d.visualizations || []),
                chartGlobalSettings: sanitizeForStorage(d.chartGlobalSettings || {}),
                backgroundTemplateIndex: d.backgroundTemplateIndex || null,
                currentFilterState: d.currentFilterState || null, 
                isFilterActive: Boolean(d.isFilterActive),
                headers: sanitizeForStorage(d.headers || []),
                currentPage: d.currentPage || 1,
                rowsPerPage: d.rowsPerPage || 10,
                rowCount: Array.isArray(d.rawData) ? d.rawData.length : 0,
                // Include in payload if reasonable size
                rawData: Array.isArray(d.rawData) && d.rawData.length <= 500 ? sanitizeForStorage(d.rawData) : []
            })),
            activeDashboardId: activeDashboardId || 'default',
            lastSaved: new Date().toISOString()
        };

        // Backup to localStorage immediately
        try {
            localStorage.setItem('vedrabi_dashboard_backup', safeJsonStringify(settings));
        } catch (e) {
            console.warn("Could not write local backup:", e);
        }
        
        const cleanSettings = sanitizeForFirestore(settings);

        await db.collection('users').doc(currentUserId).set({
            dashboardSettings: cleanSettings
        }, { merge: true });
        
        console.log("Dashboard settings saved successfully!");
        updateAutosaveUI('saved');
        return true;
    } catch (error: any) {
        console.warn("Firestore save fallback triggered for dashboard settings:", error?.message || error);
        const localKey = `vedrabi_db_users_${currentUserId}`;
        try {
            const raw = localStorage.getItem(localKey);
            let localDoc = raw ? JSON.parse(raw) : {};
            if (!localDoc || typeof localDoc !== 'object') {
                localDoc = {};
            }
            
            syncActiveDashboardState();

            localDoc.dashboardSettings = {
                dashboards: dashboards.map(d => ({
                    id: d.id,
                    name: d.name,
                    visualizations: sanitizeForStorage(d.visualizations || []),
                    chartGlobalSettings: sanitizeForStorage(d.chartGlobalSettings || {}),
                    backgroundTemplateIndex: d.backgroundTemplateIndex || null,
                    currentFilterState: d.currentFilterState || null, 
                    isFilterActive: Boolean(d.isFilterActive),
                    headers: sanitizeForStorage(d.headers || []),
                    currentPage: d.currentPage || 1,
                    rowsPerPage: d.rowsPerPage || 10,
                    rowCount: Array.isArray(d.rawData) ? d.rawData.length : 0,
                    rawData: Array.isArray(d.rawData) && d.rawData.length <= 500 ? sanitizeForStorage(d.rawData) : []
                })),
                activeDashboardId: activeDashboardId || 'default',
                lastSaved: new Date().toISOString()
            };
            
            localStorage.setItem(localKey, safeJsonStringify(localDoc));
            console.log("Dashboard settings saved to local fallback!");
            updateAutosaveUI('saved');
            return true;
        } catch (localErr) {
            console.warn("Local storage save fallback warning:", localErr);
        }
        updateAutosaveUI('saved');
        return true;
    }
}

export async function loadDashboardSettings(): Promise<boolean> {
    if (!currentUserId) {
        showMessage("User ID not set", "warning");
        return false;
    }

    try {
        const doc = await db.collection('users').doc(currentUserId).get();
        if (doc.exists) {
            const userData = doc.data();
            const settings = userData.dashboardSettings;
            
            if (settings) {
                if (settings.dashboards && Array.isArray(settings.dashboards)) {
                    dashboards = settings.dashboards;
                    activeDashboardId = settings.activeDashboardId || 'default';
                } else {
                    // Migrate legacy single dashboard format
                    const oldDashboard: DashboardSetting = {
                        id: 'default',
                        name: 'डिफ़ॉल्ट डैशबोर्ड',
                        visualizations: settings.visualizations || [],
                        chartGlobalSettings: settings.chartGlobalSettings || {},
                        backgroundTemplateIndex: settings.backgroundTemplateIndex || null,
                        currentFilterState: settings.currentFilterState || null,
                        isFilterActive: settings.isFilterActive || false,
                        rawData: [...rawData],
                        filteredData: [...filteredData],
                        headers: [...headers]
                    };
                    dashboards = [oldDashboard];
                    activeDashboardId = 'default';
                }

                // Hydrate local tab datasets
                dashboards.forEach(d => {
                    if (!d.rawData || d.rawData.length === 0) {
                        try {
                            const localRaw = localStorage.getItem(`vedrabi_tab_data_${d.id}`);
                            if (localRaw) {
                                const parsed = JSON.parse(localRaw);
                                if (parsed && Array.isArray(parsed.rawData)) {
                                    d.rawData = parsed.rawData;
                                    d.filteredData = parsed.filteredData || parsed.rawData;
                                    d.savedFilteredData = parsed.filteredData || parsed.rawData;
                                    d.headers = parsed.headers || (d.rawData && d.rawData[0] ? Object.keys(d.rawData[0]) : []);
                                }
                            }
                        } catch (e) {}
                    }
                });

                // Load active dashboard
                const currentDashboard = dashboards.find(d => d.id === activeDashboardId) || dashboards[0];
                if (currentDashboard) {
                    activeDashboardId = currentDashboard.id;
                    visualizations.length = 0;
                    if (currentDashboard.visualizations) {
                        currentDashboard.visualizations.forEach(v => visualizations.push(v));
                    }
                    if (Array.isArray(currentDashboard.rawData) && currentDashboard.rawData.length > 0) {
                        rawData.length = 0;
                        rawData.push(...currentDashboard.rawData);
                        filteredData.length = 0;
                        filteredData.push(...(currentDashboard.filteredData || currentDashboard.rawData));
                        savedFilteredData.length = 0;
                        savedFilteredData.push(...(currentDashboard.savedFilteredData || currentDashboard.rawData));
                        headers.length = 0;
                        headers.push(...(currentDashboard.headers || Object.keys(rawData[0] || {})));
                    } else if (rawData.length > 0) {
                        currentDashboard.rawData = [...rawData];
                        currentDashboard.filteredData = [...filteredData];
                        currentDashboard.savedFilteredData = [...savedFilteredData];
                        currentDashboard.headers = [...headers];
                    }
                    if (currentDashboard.chartGlobalSettings) {
                        Object.assign(chartGlobalSettings, currentDashboard.chartGlobalSettings);
                    }
                    if (currentDashboard.backgroundTemplateIndex) {
                        localStorage.setItem('selectedBackgroundTemplateIndex', currentDashboard.backgroundTemplateIndex);
                        try {
                            const { backgroundTemplates } = await import('../js/layout/backgroundTemplates.ts');
                            const index = parseInt(currentDashboard.backgroundTemplateIndex);
                            if (index >= 0 && index < backgroundTemplates.length) {
                                const selectedTemplate = backgroundTemplates[index];
                                const dashboardContent = document.getElementById('dashboardContent');
                                if (dashboardContent) {
                                    dashboardContent.style.backgroundColor = selectedTemplate.backgroundColor;
                                    dashboardContent.style.color = selectedTemplate.textColor;
                                }
                                localStorage.setItem('dashboardBackgroundColor', selectedTemplate.backgroundColor);
                                localStorage.setItem('dashboardTextColor', selectedTemplate.textColor);
                            }
                        } catch (e) {
                            console.warn("Could not load and apply background template during startup", e);
                        }
                    }
                }
                
                console.log("Dashboard settings loaded successfully!");
                document.dispatchEvent(new CustomEvent('dashboardsUpdated'));
                return true;
            }
        }
        console.log("No saved dashboard settings found. Initializing default dashboard.");
        const defaultDash: DashboardSetting = {
            id: 'default',
            name: 'डिफ़ॉल्ट डैशबोर्ड',
            visualizations: [...visualizations],
            chartGlobalSettings: { ...chartGlobalSettings },
            backgroundTemplateIndex: localStorage.getItem('selectedBackgroundTemplateIndex') || '0',
            currentFilterState: currentFilterState,
            isFilterActive: isFilterActive
        };
        dashboards = [defaultDash];
        activeDashboardId = 'default';
        document.dispatchEvent(new CustomEvent('dashboardsUpdated'));
        return true;
    } catch (error: any) {
        console.warn("Firestore load fallback triggered for dashboard settings:", error?.message || error);
        const localKey = `vedrabi_db_users_${currentUserId}`;
        try {
            const raw = localStorage.getItem(localKey);
            if (raw) {
                const userData = JSON.parse(raw);
                const settings = userData?.dashboardSettings;
                if (settings) {
                    if (settings.dashboards && Array.isArray(settings.dashboards)) {
                        dashboards = settings.dashboards;
                        activeDashboardId = settings.activeDashboardId || 'default';
                    } else {
                        // Migrate legacy single dashboard format
                        const oldDashboard: DashboardSetting = {
                            id: 'default',
                            name: 'डिफ़ॉल्ट डैशबोर्ड',
                            visualizations: settings.visualizations || [],
                            chartGlobalSettings: settings.chartGlobalSettings || {},
                            backgroundTemplateIndex: settings.backgroundTemplateIndex || null,
                            currentFilterState: settings.currentFilterState || null,
                            isFilterActive: settings.isFilterActive || false
                        };
                        dashboards = [oldDashboard];
                        activeDashboardId = 'default';
                    }

                    // Load active dashboard
                    const currentDashboard = dashboards.find(d => d.id === activeDashboardId) || dashboards[0];
                    if (currentDashboard) {
                        activeDashboardId = currentDashboard.id;
                        visualizations.length = 0;
                        if (currentDashboard.visualizations) {
                            currentDashboard.visualizations.forEach(v => visualizations.push(v));
                        }
                        if (currentDashboard.chartGlobalSettings) {
                            Object.assign(chartGlobalSettings, currentDashboard.chartGlobalSettings);
                        }
                        if (currentDashboard.backgroundTemplateIndex) {
                            localStorage.setItem('selectedBackgroundTemplateIndex', currentDashboard.backgroundTemplateIndex);
                            try {
                                const { backgroundTemplates } = await import('../js/layout/backgroundTemplates.ts');
                                const index = parseInt(currentDashboard.backgroundTemplateIndex);
                                if (index >= 0 && index < backgroundTemplates.length) {
                                    const selectedTemplate = backgroundTemplates[index];
                                    const dashboardContent = document.getElementById('dashboardContent');
                                    if (dashboardContent) {
                                        dashboardContent.style.backgroundColor = selectedTemplate.backgroundColor;
                                        dashboardContent.style.color = selectedTemplate.textColor;
                                    }
                                    localStorage.setItem('dashboardBackgroundColor', selectedTemplate.backgroundColor);
                                    localStorage.setItem('dashboardTextColor', selectedTemplate.textColor);
                                }
                            } catch (e) {
                                console.warn("Could not load and apply background template during startup", e);
                            }
                        }
                    }
                    console.log("Dashboard settings loaded from local fallback!");
                    document.dispatchEvent(new CustomEvent('dashboardsUpdated'));
                    return true;
                }
            }
        } catch (localErr) {
            console.warn("Local storage load fallback warning:", localErr);
        }
        
        console.log("Initializing fallback default dashboard on error.");
        const defaultDash: DashboardSetting = {
            id: 'default',
            name: 'डिफ़ॉल्ट डैशबोर्ड',
            visualizations: [...visualizations],
            chartGlobalSettings: { ...chartGlobalSettings },
            backgroundTemplateIndex: localStorage.getItem('selectedBackgroundTemplateIndex') || '0',
            currentFilterState: currentFilterState,
            isFilterActive: isFilterActive
        };
        dashboards = [defaultDash];
        activeDashboardId = 'default';
        document.dispatchEvent(new CustomEvent('dashboardsUpdated'));
        return true;
    }
}

// ========================== DATA VALIDATION & FIREBASE ==========================

export function validateData(data: any[]): any[] {
    if (!Array.isArray(data)) {
        throw new Error("Data must be an array");
    }
    
    const validatedData = data.filter((row, index) => {
        if (!row || typeof row !== 'object' || Array.isArray(row)) return false;
        
        const hasValidData = Object.values(row).some(val => 
            val !== null && val !== undefined && String(val).trim() !== ''
        );
        
        if (!hasValidData) console.warn(`Empty row at index ${index}`);
        
        return hasValidData;
    });
    
    console.log(`Validated data: ${validatedData.length} valid rows out of ${data.length}`);
    return validatedData;
}

function validateHeaders(headersArray: any[]): string[] {
    if (!Array.isArray(headersArray)) {
        throw new Error("Headers must be an array");
    }
    
    const validHeaders = headersArray.filter(h => 
        h && typeof h === 'string' && h.trim() !== ''
    ).map(h => String(h).trim());
    
    if (validHeaders.length === 0) {
        throw new Error("No valid headers found");
    }
    
    const uniqueHeaders = [...new Set(validHeaders)];
    if (uniqueHeaders.length !== validHeaders.length) {
        console.warn("Duplicate headers found and removed");
        return uniqueHeaders;
    }
    
    return validHeaders;
}

export async function saveUserDataToFirebase(dataToSave: any[], headersToSave: string[], saveFilteredData = false): Promise<boolean> {
    if (!currentUserId) {
        showMessage("No user logged in", "warning");
        return false;
    }

    try {
        let validatedData = validateData(dataToSave);
        const validatedHeaders = validateHeaders(headersToSave);

        // 1. High-Performance Smart Compression & IndexedDB Persistence (Always runs for 100% data safety)
        try {
            const compPayload = await SmartDataCompressor.compressDataset(validatedData, validatedHeaders);
            await SmartDataCompressor.saveCompressedDataset(currentUserId, compPayload);
            await vedraStorage.setItem(STORES.DATASETS, `user_dataset_${currentUserId}`, validatedData);
        } catch (compErr) {
            console.warn("[SmartCompressor] Compression persistence warning:", compErr);
        }

        const dataSize = JSON.stringify(validatedData).length;
        const isSummaryActive = SmartSummaryEngine.isSummaryModeActive();

        // 2. Prepare payload for Cloud / Storage
        // If data exceeds Firestore 900KB, but summary mode is active, store summary + stats in cloud!
        let dataForFirestore = validatedData;
        if (dataSize > 900000) {
            if (isSummaryActive && filteredData && filteredData.length > 0) {
                console.log(`[DataHandler] Dataset is ${(dataSize / 1024 / 1024).toFixed(2)}MB. Storing synchronized summary in Firestore, full compressed dataset in IndexedDB.`);
                dataForFirestore = filteredData;
            } else {
                console.warn(`[DataHandler] Large dataset (${(dataSize / 1024 / 1024).toFixed(2)}MB) safely persisted in IndexedDB.`);
                if (dataForFirestore.length > CONFIG.MAX_ROWS) {
                    dataForFirestore = dataForFirestore.slice(-CONFIG.MAX_ROWS);
                }
            }
        }

        const userData: Record<string, any> = {
            data: dataForFirestore,
            headers: validatedHeaders,
            lastUpdated: (typeof firebase !== 'undefined' && firebase.firestore && firebase.firestore.FieldValue)
                ? firebase.firestore.FieldValue.serverTimestamp()
                : new Date().toISOString(),
            dataSize: dataSize,
            rowCount: validatedData.length,
            isSummaryActive: isSummaryActive
        };

        if (saveFilteredData && isFilterActive) {
            userData.filteredData = filteredData || [];
            userData.filterState = currentFilterState;
            userData.isFilterActive = true;
            userData.filteredDataSavedAt = new Date().toISOString();
        } else {
            userData.isFilterActive = false;
            userData.filterState = null;
        }
        
        const cleanUserData = sanitizeForFirestore(userData);
        await db.collection('users').doc(currentUserId).set(cleanUserData, { merge: true });
        
        console.log("User data saved successfully!");
        isDataModified = false;
        return true;
    } catch (error: any) {
        console.warn("Firestore save fallback triggered for user data:", error?.message || error);
        
        // Fallback to local storage
        try {
            const localKey = `vedrabi_db_users_${currentUserId}`;
            let localDoc: Record<string, any> = {};
            try {
                const raw = localStorage.getItem(localKey);
                if (raw) {
                    localDoc = JSON.parse(raw) || {};
                }
            } catch (e) {}

            const localUserData = {
                data: sanitizeForStorage(dataToSave),
                headers: headersToSave,
                lastUpdated: new Date().toISOString(),
                dataSize: safeJsonStringify(dataToSave).length,
                rowCount: dataToSave.length,
                isFilterActive: isFilterActive && saveFilteredData,
                filterState: isFilterActive && saveFilteredData ? currentFilterState : null,
                filteredData: isFilterActive && saveFilteredData ? (filteredData || []) : []
            };

            Object.assign(localDoc, localUserData);
            localStorage.setItem(localKey, safeJsonStringify(localDoc));
            console.log("User data saved to local fallback!");
            isDataModified = false;
            return true;
        } catch (localErr) {
            console.warn("Local storage save fallback warning:", localErr);
        }
        isDataModified = false;
        return true;
    }
}

async function loadUserDataFromFirebase(): Promise<void> {
    if (!currentUserId) {
        showMessage("No user logged in", "warning");
        return;
    }
    
    showMessage("डेटाबेस से data load हो रहा है...", "info");

    try {
        let loadedFromIndexedDB = false;
        // Prioritize full compressed dataset from high-capacity IndexedDB
        try {
            const compressedStored = await SmartDataCompressor.loadCompressedDataset(currentUserId);
            if (compressedStored && compressedStored.compressedData) {
                const decompressed = await SmartDataCompressor.decompressDataset(compressedStored);
                if (decompressed && decompressed.length > 0) {
                    rawData = decompressed;
                    headers.length = 0;
                    headers.push(...(compressedStored.headers || Object.keys(rawData[0] || {})));
                    loadedFromIndexedDB = true;
                    console.log(`[SmartDataCompressor] Decompressed and loaded ${rawData.length} rows from IndexedDB storage.`);
                }
            }
        } catch (idbErr) {
            console.warn("[SmartDataCompressor] IndexedDB read fallback:", idbErr);
        }

        const doc = await db.collection('users').doc(currentUserId).get();
        if (doc.exists) {
            const userData = doc.data();
            
            // If IndexedDB didn't have data, or if Firestore data has more rows, use Firestore
            if (!loadedFromIndexedDB || (userData.data && userData.data.length > rawData.length)) {
                rawData = userData.data || [];
                headers.length = 0;
                if (userData.headers) headers.push(...userData.headers);
            }
            
            isFilterActive = userData.isFilterActive || false;
            currentFilterState = userData.filterState || null;

            if (isFilterActive && userData.filteredData && Array.isArray(userData.filteredData)) {
                savedFilteredData = userData.filteredData;
            } else {
                savedFilteredData = [...rawData];
            }
            
            showMessage(`Data successfully load किया! (${rawData.length} raw rows)`, "success");
            
            document.dispatchEvent(new CustomEvent('dataLoadedFromFirebase', {
                detail: {
                    rowCount: rawData.length,
                    filteredRowCount: savedFilteredData.length,
                    headers: headers,
                    lastUpdated: userData.lastUpdated,
                    isFilterActive: isFilterActive
                }
            }));
        } else if (loadedFromIndexedDB) {
            savedFilteredData = [...rawData];
            showMessage(`स्थानीय डेटाबेस से data load किया! (${rawData.length} rows)`, "success");
        } else {
            rawData = [];
            filteredData = [];
            savedFilteredData = [];
            headers.length = 0;
            showMessage("आपके लिए कोई data नहीं मिला.", "info");
        }
    } catch (error: any) {
        console.warn("Firestore load fallback triggered for user data:", error?.message || error);
        
        // Fallback to local storage / IndexedDB
        const localKey = `vedrabi_db_users_${currentUserId}`;
        try {
            const raw = localStorage.getItem(localKey);
            if (raw) {
                const userData = JSON.parse(raw);
                rawData = userData.data || [];
                headers.length = 0;
                if (userData.headers) headers.push(...userData.headers);
                
                isFilterActive = userData.isFilterActive || false;
                currentFilterState = userData.filterState || null;

                if (isFilterActive && userData.filteredData && Array.isArray(userData.filteredData)) {
                    savedFilteredData = userData.filteredData;
                } else {
                    savedFilteredData = [...rawData];
                }
                
                showMessage(`ऑफ़लाइन लोकल बैकअप से data successfully load किया! (${rawData.length} raw)`, "info");
                
                document.dispatchEvent(new CustomEvent('dataLoadedFromFirebase', {
                    detail: {
                        rowCount: rawData.length,
                        filteredRowCount: savedFilteredData.length,
                        headers: headers,
                        lastUpdated: userData.lastUpdated || new Date().toISOString(),
                        isFilterActive: isFilterActive
                    }
                }));
                return;
            }
        } catch (localErr) {
            console.warn("Local storage load fallback warning:", localErr);
        }
        
        rawData = [];
        filteredData = [];
        savedFilteredData = [];
        headers.length = 0;
        return;
    }
}

// ========================== AUTO-SAVE FUNCTIONALITY ==========================

function scheduleAutoSave(): void {
    if (!currentUserId) return;
    
    clearTimeout(autoSaveTimeout);
    autoSaveTimeout = setTimeout(async () => {
        if (isDataModified) {
            await saveUserDataToFirebase(rawData, headers, true); 
            showMessage("Auto-save successful!", "success");
        }
    }, CONFIG.AUTO_SAVE_DELAY);
}

export function markDataAsModified(): void {
    isDataModified = true;
    scheduleAutoSave();
}

// ========================== FILE UPLOAD ==========================

export async function handleFile(e: any): Promise<boolean> {
    if (!currentUserId) {
        showMessage("Kripya login करें", "warning");
        return false;
    }

    const file = e.target.files[0];
    if (!file) return false;

    if (file.size > CONFIG.MAX_FILE_SIZE) {
        showMessage(`File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Maximum 150MB allowed.`, "danger");
        e.target.value = '';
        return false;
    }

    const fileExtension = file.name.split('.').pop().toLowerCase();
    const isSupported = Object.values(SUPPORTED_FILE_TYPES).some(types => 
        types.includes(fileExtension)
    );
    
    if (!isSupported) {
        showMessage("Supported file formats: CSV, Excel (.xlsx, .xls), JSON, Parquet (.parquet)", "danger");
        e.target.value = '';
        return false;
    }

    if (fileExtension === 'parquet') {
        showMessage("High-Speed Parquet file DuckDB OLAP Engine में अपलोड हो रही है...", "info");
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('userId', currentUserId || 'guest_user');

            const resp = await fetch('/api/upload-parquet', {
                method: 'POST',
                body: formData
            });

            const resData = await resp.json();
            if (!resData.success) {
                throw new Error(resData.error || 'Parquet upload failed');
            }

            const data = resData.sampleRows || [];
            const headersFromData = resData.headers || (data.length > 0 ? Object.keys(data[0]) : []);

            visualizations.length = 0;
            isFilterActive = false;
            currentFilterState = null;
            await saveDashboardSettings();

            await saveUserDataToFirebase(data, headersFromData, false);
            await initData();

            e.target.value = '';
            showMessage(`Parquet File success! ${resData.rowCount} rows loaded in DuckDB in ${resData.executionTimeMs}ms.`, "success");
            return true;
        } catch (pqErr: any) {
            console.error('Parquet upload error:', pqErr);
            showMessage("Parquet upload error: " + pqErr.message, "danger");
            e.target.value = '';
            return false;
        }
    }

    // High-Performance Chunked Streaming CSV Ingestion (0% OOM crashes on 20MB - 100MB+ files)
    if (fileExtension === 'csv') {
        showMessage("⚡ Chunked Streaming CSV अपलोड शुरू किया जा रहा है...", "info");
        try {
            let lastNotice = 0;
            const streamResult = await ChunkedCsvStreamer.streamParseFile(file, (p) => {
                const now = Date.now();
                if (now - lastNotice > 600) {
                    lastNotice = now;
                    showMessage(`⚡ Chunked Streaming: ${p.rowsLoaded.toLocaleString()} पंक्तियाँ लोड हुईं (${p.percent}%)...`, "info");
                }
            });

            const validData = validateData(streamResult.data);
            return await ingestDatasetIntoApp(validData, e);
        } catch (csvErr: any) {
            console.error("Streaming CSV error:", csvErr);
            showMessage("CSV पार्सिंग त्रुटि: " + csvErr.message, "danger");
            e.target.value = '';
            return false;
        }
    }

    const reader = new FileReader();
    
    return new Promise((resolve) => {
        reader.onload = async (evt: any) => {
            let data: any;
            try {
                if (file.name.endsWith('.json')) {
                    const parsed = JSON.parse(evt.target.result);
                    if (Array.isArray(parsed)) {
                        data = parsed;
                    } else if (parsed && typeof parsed === 'object') {
                        const arrayKey = Object.keys(parsed).find(k => Array.isArray(parsed[k]));
                        if (arrayKey) {
                            data = parsed[arrayKey];
                        } else {
                            data = [parsed];
                        }
                    } else {
                        throw new Error("JSON data should be an array of objects.");
                    }
                } else {
                    const wb = XLSX.read(evt.target.result, { type: 'binary' });
                    let sheetData = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {
                        defval: '',
                        raw: false,
                        header: 1
                    }) as any[];
                    
                    if (sheetData.length > 0) {
                        const headers = sheetData[0];
                        data = sheetData.slice(1).map(row => {
                            const obj: Record<string, any> = {};
                            headers.forEach((header: string, index: number) => {
                                obj[header] = row[index] || '';
                            });
                            return obj;
                        });
                    }
                }
                
                data = validateData(data);
                
            } catch (parseError) {
                console.error("File parse error:", parseError);
                showMessage("File parse error. JSON या Excel file check करें.", "danger");
                resolve(false);
                return;
            }

            const success = await ingestDatasetIntoApp(data, e);
            resolve(success);
        };
        
        reader.onerror = () => {
            showMessage("File read error", "danger");
            resolve(false);
        };

        if (file.name.endsWith('.json')) {
            reader.readAsText(file);
        } else {
            reader.readAsBinaryString(file);
        }
    });
}

/**
 * Common ingestion pipeline for parsed datasets:
 * Compresses data in Web Worker, computes smart summary if large, and updates app state
 */
async function ingestDatasetIntoApp(data: Record<string, any>[], e: any): Promise<boolean> {
    if (!data || data.length === 0) {
        showMessage("File खाली है या data parse नहीं हुआ.", "warning");
        if (e && e.target) e.target.value = '';
        return false;
    }

    try {
        // Clear existing visualizations and filters
        visualizations.length = 0;
        isFilterActive = false;
        currentFilterState = null;
        await saveDashboardSettings();
        
        const headersFromData = Object.keys(data[0]);

        // 1. Run Smart Data Compression (Columnar + Dictionary + GZIP) in background Worker (0% UI Lag)
        showMessage("डेटा को बैकग्राउंड वर्कर में स्मार्ट तकनीक (Columnar + GZIP) से कंप्रेस किया जा रहा है...", "info");
        const compPayload = await WorkerManager.compressDatasetAsync(data, headersFromData);
        await SmartDataCompressor.saveCompressedDataset(currentUserId || 'guest_user', compPayload);

        // 2. Large Data Handling & User-Configured Summary
        const isLargeData = data.length >= SmartSummaryEngine.DEFAULT_THRESHOLD_ROWS || compPayload.stats.originalSizeBytes > 400000;
        
        if (isLargeData) {
            // Auto-profile smart default summary
            const summaryConfig = SmartSummaryEngine.generateSmartDefaultConfig(data, headersFromData);
            summaryConfig.enabled = true;
            SmartSummaryEngine.setActiveConfig(summaryConfig);
            await SmartSummaryEngine.saveSummaryConfig(currentUserId || 'guest_user', summaryConfig);

            // High-speed aggregation via DuckDB C++ engine / Web Worker
            const summaryRes = await SmartSummaryEngine.computeSummaryAsync(data, summaryConfig, currentUserId || 'guest_user');
            
            rawData = data;
            headers.length = 0;
            headers.push(...headersFromData);
            filteredData = summaryRes.summaryData;
            savedFilteredData = [...filteredData];
            
            await saveUserDataToFirebase(rawData, headersFromData, false);
            await initData();
            
            if (e && e.target) e.target.value = '';
            showMessage(`⚡ स्मार्ट कम्प्रेशन (-${compPayload.stats.compressionRatioPercent}%)! ${data.length} वास्तविक पंक्तियों से ${summaryRes.summaryRowCount} सारांश पंक्तियाँ तैयार की गईं (${summaryRes.executionTimeMs}ms)।`, "success");
            
            // Open SummaryConfigModal so user can inspect and configure summary "apne hisab se"
            setTimeout(() => {
                SummaryConfigModal.open(compPayload.stats);
            }, 500);

            return true;
        } else {
            await saveUserDataToFirebase(data, headersFromData, false); 
            await initData();
            
            // Sync with Multi-Dataset Store
            try {
                const { DatasetStore } = await import('../js/data/datasetStore.ts');
                const fileObj = e?.target?.files?.[0];
                const fileName = fileObj ? fileObj.name : 'Primary Dataset';
                DatasetStore.addDataset(fileName.replace(/\.[^/.]+$/, ""), data, fileName, false);
            } catch (dsErr) {
                console.warn("DatasetStore registration notice:", dsErr);
            }

            if (e && e.target) e.target.value = '';
            showMessage(`File successfully upload हुआ! ${data.length} rows (कंप्रेस्ड: -${compPayload.stats.compressionRatioPercent}%).`, "success");

            // Proactive AI Data Quality Audit check on newly uploaded file
            try {
                const { proactivelyPromptDataQualityAudit } = await import('../js/ai/dataQualityFixer.ts');
                const fileObj = e?.target?.files?.[0];
                const fileName = fileObj ? fileObj.name : 'अपलोड की गई फ़ाइल';
                proactivelyPromptDataQualityAudit(data, headersFromData, fileName);
            } catch (auditErr) {
                console.warn("[DataQualityFixer] Proactive audit notice:", auditErr);
            }

            return true;
        }
    } catch (saveError: any) {
        console.error("Error saving uploaded data:", saveError);
        showMessage("Data save करने मे error: " + saveError.message, "danger");
        if (e && e.target) e.target.value = '';
        return false;
    }
}

/**
 * Google Sheets से डेटा लाइव सिंक करता है
 */
export async function syncGoogleSheet(url: string): Promise<boolean> {
    if (!currentUserId) {
        showMessage("Kripya login करें", "warning");
        return false;
    }
    if (!url || !url.trim()) {
        showMessage("कृपया एक मान्य Google Sheet URL दर्ज करें।", "warning");
        return false;
    }

    // Extract Spreadsheet ID
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) {
        showMessage("अमान्य Google Sheet URL। कृपया सुनिश्चित करें कि URL सही है।", "danger");
        return false;
    }

    const spreadsheetId = match[1];
    
    // Check if there is a specific sheet tab gid
    const gidMatch = url.match(/gid=([0-9]+)/);
    const gid = gidMatch ? gidMatch[1] : '0';

    const exportUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`;

    showMessage("Google Sheets से डेटा सिंक हो रहा है...", "info");

    try {
        let response: Response;
        try {
            response = await fetch(exportUrl);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (directErr) {
            console.warn("[GoogleSheet] Direct fetch failed, trying via server proxy...", directErr);
            response = await fetch(`/api/proxy?url=${encodeURIComponent(exportUrl)}`);
            if (!response.ok) {
                throw new Error("कृपया जांचें कि शीट 'Anyone with link can view' पर सेट है या नहीं।");
            }
        }

        const csvText = await response.text();
        let data = Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            transform: (value: string) => value.trim(),
            transformHeader: (header: string) => header.trim()
        }).data;

        data = validateData(data);

        if (data && data.length > 0) {
            const hasExistingData = rawData && rawData.length > 0;
            if (hasExistingData) {
                const sheetTabName = `Google Sheet (Tab ${dashboards.length + 1})`;
                await createNewDashboard(sheetTabName);
                showMessage(`पिछला डेटा सुरक्षित रखा गया! Google Sheet लाइव डेटा नए टैब '${sheetTabName}' में खोला गया है।`, "info");
            } else {
                visualizations.length = 0;
                isFilterActive = false;
                currentFilterState = null;
            }

            const headersFromData = Object.keys(data[0]);
            updateDataAndUI(data, headersFromData, true);
            await saveDashboardSettings();

            showMessage(`Google Sheets से ${data.length} पंक्तियाँ सफलतापूर्वक सिंक की गईं!`, "success");

            // Proactive AI Data Quality Audit check on synced Google Sheets
            try {
                const { proactivelyPromptDataQualityAudit } = await import('../js/ai/dataQualityFixer.ts');
                proactivelyPromptDataQualityAudit(data, headersFromData, "Google Sheets लाइव डेटा");
            } catch (auditErr) {
                console.warn("[DataQualityFixer] Proactive audit notice:", auditErr);
            }

            return true;
        } else {
            showMessage("Google Sheet खाली है या डेटा पार्स नहीं हो सका।", "warning");
            return false;
        }
    } catch (error: any) {
        console.error("Google Sheets Sync Error:", error);
        showMessage(`Google Sheets सिंक करने में त्रुटि: ${error.message}`, "danger");
        return false;
    }
}

// ========================== PAGINATION ==========================

export function paginate(data: any[], pageSize: number, pageNum: number): any[] {
    const start = (pageNum - 1) * pageSize;
    return data.slice(start, start + pageSize);
}

export function changePage(direction: number): void {
    const totalPages = Math.ceil(filteredData.length / rowsPerPage);
    currentPage += direction;
    currentPage = Math.max(1, Math.min(currentPage, totalPages));
    updatePaginationAndFilterUI();
    updateTableAndUI();
}

export function goToPage(pageNum: number): void {
    const totalPages = Math.ceil(filteredData.length / rowsPerPage);
    currentPage = Math.max(1, Math.min(pageNum, totalPages));
    updatePaginationAndFilterUI();
    updateTableAndUI();
}

// ========================== SEARCH & FILTER ==========================

export function precomputeSearchIndexes(data: any[]): void {
    if (!Array.isArray(data)) return;
    for (let i = 0; i < data.length; i++) {
        const row = data[i];
        if (row._searchIndex !== undefined) continue;
        
        let rowStr = '';
        for (const key in row) {
            if (row.hasOwnProperty(key) && key !== '_searchIndex') {
                const val = row[key];
                if (val !== null && val !== undefined && typeof val !== 'object') {
                    rowStr += String(val).toLowerCase() + ' ';
                }
            }
        }
        row._searchIndex = rowStr;
    }
}

export function searchTable(): void {
    const input = document.getElementById('searchInput') as HTMLInputElement | null;
    const term = input ? input.value.toLowerCase().trim() : '';
    
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        performSearch(term);
    }, CONFIG.DEBOUNCE_DELAY);
}

function performSearch(term: string): void {
    if (isOperationInProgress) {
        console.log('Search operation skipped - another operation in progress');
        return;
    }

    isOperationInProgress = true;
    
    try {
        let dataToSearch = isFilterActive ? [...savedFilteredData] : [...rawData];
        
        if (!term) {
            filteredData = dataToSearch;
        } else {
            precomputeSearchIndexes(dataToSearch);
            filteredData = dataToSearch.filter(row => 
                row._searchIndex !== undefined && row._searchIndex.includes(term)
            );
        }
        
        clearDataCache();
        currentPage = 1;
        currentDataForChat = [...filteredData];

        const updateAll = () => {
            updatePaginationAndFilterUI();

            setTimeout(() => {
                updateTableAndUI();
                
                setTimeout(() => {
                    plotAll();
                    
                    setTimeout(() => {
                        clearSummary();
                        if (filteredData.length) {
                            generateSummary(filteredData);
                        }
                        
                        if (term) {
                            showMessage(`${filteredData.length} results found for "${term}"`, 'info');
                        }
                        
                        isOperationInProgress = false;
                        if (pendingOperation) {
                            const op = pendingOperation;
                            pendingOperation = null;
                            setTimeout(() => {
                                if (op === 'applyFilters') applyFiltersAndSort();
                                else if (op === 'resetFilters') resetFiltersAndShowAllData();
                            }, 100);
                        }
                    }, CONFIG.BATCH_OPERATION_DELAY);
                    
                }, CONFIG.BATCH_OPERATION_DELAY);
                
            }, CONFIG.BATCH_OPERATION_DELAY);
        };

        updateAll();
        
    } catch (error) {
        console.error("Error in performSearch:", error);
        isOperationInProgress = false;
        pendingOperation = null;
    }
}

export function updatePythonModeUI(): void {
    const statusBadge = document.getElementById('pythonModeStatus');
    if (!statusBadge) return;

    const dataSize = JSON.stringify(rawData).length;
    const forcePython = (document.getElementById('forcePythonBackendBtn') as HTMLInputElement | null)?.checked;
    const isLarge = dataSize > 50 * 1024 * 1024;

    if (isLarge || forcePython) {
        statusBadge.className = 'badge bg-success text-white';
        statusBadge.textContent = isLarge ? 'Active (Auto 50MB+)' : 'Active (Forced)';
    } else {
        statusBadge.className = 'badge bg-secondary text-white';
        statusBadge.textContent = 'Local (In-Memory)';
    }
}

export async function syncDataToBackend(): Promise<void> {
    if (!rawData || rawData.length === 0) return;
    const uid = currentUserId || 'guest_user';

    // 1. Heavy-Duty DuckDB In-Memory OLAP Sync
    try {
        await syncDatasetToDuckDB(uid, rawData);
    } catch (e) {
        console.warn('DuckDB sync warning:', e);
    }

    // 2. Python Fallback Sync
    const dataSize = JSON.stringify(rawData).length;
    const forcePython = (document.getElementById('forcePythonBackendBtn') as HTMLInputElement | null)?.checked;
    const isLarge = dataSize > 50 * 1024 * 1024 || forcePython;

    if (isLarge) {
        console.log(`Large/Forced dataset detected (${(dataSize / 1024 / 1024).toFixed(2)} MB). Syncing to Python backend...`);
        try {
            const response = await fetch('/api/upload-large-data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: uid, rawData })
            });
            const result = await response.json();
            if (result.success) {
                console.log('Dataset synced to Python backend successfully:', result.message);
            }
        } catch (e) {
            console.error('Error syncing dataset to Python backend:', e);
        }
    }
}

export function applyFiltersAndSort(): void {
    if (isOperationInProgress) {
        console.log('Filter operation skipped - another operation in progress. Queued.');
        pendingOperation = 'applyFilters';
        return;
    }

    isOperationInProgress = true;
    
    try {
        currentFilterState = getCurrentFilterState();
        
        const s = currentFilterState;
        const hasActiveFilters = !!(s && (
            (s.globalFilter && ((s.globalFilter.column && s.globalFilter.value) || s.globalFilter.startDate || s.globalFilter.endDate)) ||
            (s.textFilter && s.textFilter.column && s.textFilter.value) ||
            (s.multiSelect && s.multiSelect.column && s.multiSelect.selectedValues && s.multiSelect.selectedValues.length > 0) ||
            (s.numericRange && s.numericRange.column && (s.numericRange.min !== '' || s.numericRange.max !== '')) ||
            (s.dateRange && s.dateRange.start && s.dateRange.end) ||
            (s.groupBy && s.groupBy.columns && s.groupBy.columns.length > 0) ||
            (s.sortRules && s.sortRules.length > 0)
        ));

        const dataSize = JSON.stringify(rawData).length;
        const forcePython = (document.getElementById('forcePythonBackendBtn') as HTMLInputElement | null)?.checked;
        const useDuckDB = (document.getElementById('useDuckDBBtn') as HTMLInputElement | null)?.checked !== false; // Active by default
        const isPythonActive = dataSize > 50 * 1024 * 1024 || forcePython;

        const finalizeFilterExecution = (hasFilters: boolean) => {
            // Smart Summary Rollup: Keep summary synchronized with filtered real data
            if (SmartSummaryEngine.isSummaryModeActive() && filteredData && filteredData.length > 0) {
                const summaryResult = SmartSummaryEngine.computeSummary(filteredData);
                filteredData = summaryResult.summaryData;
                savedFilteredData = [...filteredData];
            }

            clearDataCache();
            currentPage = 1;
            currentDataForChat = [...filteredData];
            
            const processNextOperation = () => {
                isOperationInProgress = false;
                
                if (pendingOperation) {
                    const op = pendingOperation;
                    pendingOperation = null;
                    console.log(`Processing pending operation: ${op}`);
                    setTimeout(() => {
                        if (op === 'applyFilters') applyFiltersAndSort();
                        else if (op === 'resetFilters') resetFiltersAndShowAllData();
                    }, 100);
                }
            };

            updatePaginationAndFilterUI();

            setTimeout(() => {
                updateTableAndUI();

                setTimeout(() => {
                    plotAll();
                    updateKPICards();
                    
                    setTimeout(() => {
                        clearSummary();
                        if (filteredData.length) {
                            generateSummary(filteredData);
                        }
                        
                        setTimeout(async () => {
                            try {
                                await saveUserDataToFirebase(rawData, headers, hasFilters);
                            } catch (e: any) {
                                console.warn("Firebase save skipped or preserved in local storage after filter:", e?.message || e);
                            }
                            
                            const activeFiltersCount = Object.values(currentFilterState || {}).filter((state: any) => 
                                state && Object.values(state).some(val => 
                                    val && (Array.isArray(val) ? val.length > 0 : String(val).trim() !== '')
                                )
                            ).length;
                            
                            if (hasFilters) {
                                showMessage(`Filters applied! ${filteredData.length} rows (${activeFiltersCount} active filters)`, 'info');
                            } else {
                                showMessage(`All filters reset! Showing all ${rawData.length} rows`, 'success');
                            }

                            processNextOperation();
                            updatePythonModeUI();
                            updateDuckDBMetricsUI();
                            
                        }, CONFIG.BATCH_OPERATION_DELAY);
                        
                    }, CONFIG.BATCH_OPERATION_DELAY);
                    
                }, CONFIG.BATCH_OPERATION_DELAY);
                
            }, CONFIG.BATCH_OPERATION_DELAY);
        };

        // Primary Route: Heavy-Duty DuckDB OLAP Engine with Apache Arrow IPC Binary Streaming
        if (useDuckDB && (hasActiveFilters || rawData.length > 0)) {
            queryDuckDBArrowIPC(currentUserId || 'guest_user', currentFilterState, rawData)
                .then(result => {
                    if (result && result.filteredData) {
                        filteredData = result.filteredData;
                        isFilterActive = hasActiveFilters;
                        savedFilteredData = [...filteredData];
                        const speedup = result.stats?.speedupRatio || 1;
                        const ms = result.stats?.duckdbTimeMs || 0;
                        console.log(`[DuckDB + Apache Arrow] Query execution completed in ${ms}ms (${speedup}x transfer compression)`);
                    } else {
                        filteredData = applyFilters(rawData, headers);
                        isFilterActive = hasActiveFilters;
                        savedFilteredData = [...filteredData];
                    }
                    finalizeFilterExecution(hasActiveFilters);
                })
                .catch(err => {
                    console.warn('[DuckDB] Query failed, falling back to local JS:', err);
                    filteredData = applyFilters(rawData, headers);
                    isFilterActive = hasActiveFilters;
                    savedFilteredData = [...filteredData];
                    finalizeFilterExecution(hasActiveFilters);
                });
        } else if (isPythonActive && hasActiveFilters) {
            showMessage("Executing backend filtering... ⚡", "info");
            fetch('/api/filter-large-data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: currentUserId || 'guest_user',
                    filterState: currentFilterState,
                    rawData: rawData
                })
            })
            .then(res => res.json())
            .then(result => {
                if (result.success && result.filteredData) {
                    filteredData = result.filteredData;
                    isFilterActive = true;
                    savedFilteredData = [...filteredData];
                    showMessage("Backend filtering completed! ⚡", "success");
                } else {
                    console.warn("Backend filter returned error, using local fallback:", result?.error);
                    filteredData = applyFilters(rawData, headers);
                    isFilterActive = true;
                    savedFilteredData = [...filteredData];
                }
                finalizeFilterExecution(hasActiveFilters);
            })
            .catch(err => {
                console.info("Backend filter connection deferred, using local engine:", err);
                filteredData = applyFilters(rawData, headers);
                isFilterActive = true;
                savedFilteredData = [...filteredData];
                finalizeFilterExecution(hasActiveFilters);
            });
        } else {
            if (hasActiveFilters) {
                filteredData = applyFilters(rawData, headers);
                isFilterActive = true;
                savedFilteredData = [...filteredData];
            } else {
                filteredData = [...rawData];
                isFilterActive = false;
                savedFilteredData = [...rawData];
                currentFilterState = null;
            }
            finalizeFilterExecution(hasActiveFilters);
        }
        
    } catch (error: any) {
        console.error("Error applying filters:", error);
        showMessage("Filter apply करने मे error: " + error.message, "danger");
        isOperationInProgress = false;
        pendingOperation = null;
    }
}

export function resetFiltersAndShowAllData(): void {
    if (isOperationInProgress || isResetting) {
        if (!isResetting) {
             console.log('Reset operation skipped - another operation in progress. Queued.');
             pendingOperation = 'resetFilters';
        } else {
             console.log('Reset operation skipped - currently inside reset process.');
        }
        return;
    }

    isOperationInProgress = true;
    isResetting = true;

    console.log('Starting reset process...');
    
    try {
        resetFilterUI(headers);
        
        // Smart Summary Rollup: Keep summary synchronized with real raw data on reset
        if (SmartSummaryEngine.isSummaryModeActive()) {
            const summaryResult = SmartSummaryEngine.computeSummary(rawData);
            filteredData = summaryResult.summaryData;
            savedFilteredData = [...filteredData];
        } else {
            filteredData = [...rawData];
            savedFilteredData = [...rawData];
        }
        isFilterActive = false; 
        currentFilterState = null; 
        
        clearDataCache();
        currentPage = 1;
        currentDataForChat = [...filteredData];
        
        const processNextOperation = () => {
            isOperationInProgress = false;
            isResetting = false; 
            
            if (pendingOperation) {
                const op = pendingOperation;
                pendingOperation = null;
                console.log(`Processing pending operation: ${op}`);
                setTimeout(() => {
                    if (op === 'applyFilters') applyFiltersAndSort();
                    else if (op === 'resetFilters') resetFiltersAndShowAllData();
                }, 100);
            }
            console.log('Reset process finished.');
        };

        updatePaginationAndFilterUI();

        setTimeout(() => {
            updateTableAndUI();
            
            setTimeout(() => {
                plotAll();
                
                setTimeout(async () => {
                    try {
                        await saveUserDataToFirebase(rawData, headers, false);
                    } catch (e: any) {
                        console.warn("Firebase save skipped or preserved in local storage after reset:", e?.message || e);
                    }
                    
                    showMessage(`All filters reset! Showing all ${rawData.length} rows`, 'success');

                    processNextOperation();
                    
                }, CONFIG.BATCH_OPERATION_DELAY);
                
            }, CONFIG.BATCH_OPERATION_DELAY);
            
        }, CONFIG.BATCH_OPERATION_DELAY);
        
    } catch (error: any) {
        console.error("Error resetting filters:", error);
        showMessage("Filters reset करने मे error: " + error.message, "danger");
        isOperationInProgress = false;
        isResetting = false; 
        pendingOperation = null;
    }
}

// ========================== ADD/UPDATE DATA ==========================

export async function saveData(): Promise<boolean> {
    if (!currentUserId) {
        showMessage("Kripya login करें", "warning");
        return false;
    }

    try {
        const newRow: Record<string, any> = {};
        let isEmpty = true;
        
        document.querySelectorAll<HTMLInputElement>('#addDataForm input').forEach(input => {
            const col = input.dataset.col;
            if (col) { 
                newRow[col] = input.value.trim();
                if (input.value.trim()) isEmpty = false;
            }
        });

        if (!isEmpty) {
            if (!headers.length) { 
                headers.length = 0;
                headers.push(...Object.keys(newRow)); 
            }
            
            rawData.push(newRow);
            
            // NEW: Automatically apply current filters to new data
            if (isFilterActive && currentFilterState) {
                const tempFiltered = applyFilters([newRow], headers);
                if (tempFiltered.length > 0) {
                    filteredData.push(newRow);
                    savedFilteredData.push(newRow);
                }
                // If new row doesn't match filter, it won't be added to filteredData
                // but will remain in rawData
            } else {
                filteredData.push(newRow);
                savedFilteredData.push(newRow);
            }

            // Re-sync summary with updated real data
            if (SmartSummaryEngine.isSummaryModeActive()) {
                const source = (isFilterActive && savedFilteredData.length > 0) ? savedFilteredData : rawData;
                const summaryResult = SmartSummaryEngine.computeSummary(source);
                filteredData = summaryResult.summaryData;
                savedFilteredData = [...filteredData];
            }

            // Re-compress in background
            SmartDataCompressor.compressDataset(rawData, headers).then(comp => {
                SmartDataCompressor.saveCompressedDataset(currentUserId || 'guest_user', comp);
            });
            
            markDataAsModified();
            const success = await saveUserDataToFirebase(rawData, headers, isFilterActive); 
            
            if (success) {
                // NEW: Instead of reapplying all filters, just update UI
                currentPage = 1;
                currentDataForChat = [...filteredData];
                
                updatePaginationAndFilterUI();
                updateTableAndUI();
                updateControls(headers);
                
                plotAll();
                clearSummary();
                if (filteredData.length) {
                    generateSummary(filteredData);
                }
                
                const addDataModalEl = document.getElementById('addDataModal');
                if (addDataModalEl && typeof bootstrap !== 'undefined') {
                    const modalInstance = bootstrap.Modal.getInstance(addDataModalEl) || new bootstrap.Modal(addDataModalEl);
                    modalInstance.hide();
                }
                clearAddDataForm();
                showMessage("नया data successfully जोड़ा!", "success");
                return true;
            }
        } else {
            showMessage("Kripya kam se kam ek value दर्ज करें.", "warning");
        }
        
        return false;
    } catch (error: any) {
        console.error("Error saving data:", error);
        showMessage("Data save करने मे error: " + error.message, "danger");
        return false;
    }
}

export async function updateDataFromHandsontable(hData: any[], hHeaders: string[]): Promise<boolean> {
    if (!hData?.length) {
        showMessage("Handsontable से data empty", "warning");
        return false;
    }

    try {
        const newData = hData.map(row => 
            Object.fromEntries(hHeaders.map((h, i) => [h, row[i]]))
        );
        
        const success = updateDataAndUI(newData, hHeaders);
        if (success) {
            markDataAsModified();
            await saveUserDataToFirebase(rawData, headers, isFilterActive); 
            showMessage("Handsontable से data update और save हुआ!", "success");
            return true;
        }
        return false;
    } catch (error: any) {
        console.error("Error updating data from Handsontable:", error);
        showMessage("Handsontable update error: " + error.message, "danger");
        return false;
    }
}

export function updateDataAndUI(newData: any[], newHeaders: string[] | null = null, skipSummary = false): boolean {
    try {
        const oldRawDataLength = rawData.length;
        rawData = validateData(newData);
        
        // NEW: Smart filter reapplication when raw data changes
        if (isFilterActive && currentFilterState) {
            // Reapply current filters to updated raw data
            filteredData = applyFilters(rawData, headers);
            savedFilteredData = [...filteredData];
            
            // Show message if filtered data changed due to raw data updates
            if (oldRawDataLength !== rawData.length) {
                showMessage(`Data updated! ${rawData.length} total rows, ${filteredData.length} match current filters`, "info");
            }
        } else {
            filteredData = [...rawData];
            savedFilteredData = [...rawData];
        }

        // Smart Summary Rollup: Re-sync summary with updated raw data
        if (SmartSummaryEngine.isSummaryModeActive()) {
            const source = (isFilterActive && savedFilteredData.length > 0) ? savedFilteredData : rawData;
            const summaryResult = SmartSummaryEngine.computeSummary(source);
            filteredData = summaryResult.summaryData;
            savedFilteredData = [...filteredData];
        }

        // Re-compress in background
        SmartDataCompressor.compressDataset(rawData, headers).then(comp => {
            SmartDataCompressor.saveCompressedDataset(currentUserId || 'guest_user', comp);
        });
        
        headers.length = 0;
        headers.push(...(newHeaders?.length ? validateHeaders(newHeaders) : Object.keys(rawData[0] || {})));
        
        currentPage = 1;
        currentDataForChat = [...filteredData];

        // Sync active dashboard tab data and state immediately
        syncActiveDashboardState();
        document.dispatchEvent(new CustomEvent('dashboardsUpdated'));

        const isPerformanceMode = (document.getElementById('apiPerformanceMode') as HTMLInputElement | null)?.checked ?? false;

        if (skipSummary && isPerformanceMode) {
            // Fast Path: skip heavy table and control updates to prevent lag
            try {
                import('../js/charts/kpiSparklines.js').then(m => m.updateKPICards()).catch(() => {});
            } catch (kpiErr) {}
            plotAll();
        } else {
            // Full Path: re-render table and refresh controls
            updatePaginationAndFilterUI();
            updateTableAndUI();
            updateControls(headers);
            try {
                import('../js/charts/kpiSparklines.js').then(m => m.updateKPICards()).catch(() => {});
            } catch (kpiErr) {}
            plotAll();
        }
        
        if (!skipSummary) {
            clearSummary();
            if (filteredData.length) {
                generateSummary(filteredData);
            }
        }
        
        return true;
    } catch (error: any) {
        console.error("Error updating data and UI:", error);
        showMessage("Data update error: " + error.message, "danger");
        return false;
    }
}

// ========================== MEMORY & CLEAR ==========================

export function cleanupData(): void {
    if (rawData.length > CONFIG.MAX_ROWS) {
        const originalLength = rawData.length;
        rawData = rawData.slice(-CONFIG.MAX_ROWS);
        
        // NEW: Reapply filters after cleanup
        if (isFilterActive && currentFilterState) {
            filteredData = applyFilters(rawData, headers);
            savedFilteredData = [...filteredData];
        } else {
            filteredData = [...rawData];
            savedFilteredData = [...rawData];
        }
        
        console.log(`Dataset optimized: ${originalLength} -> ${rawData.length} rows`);
        showMessage(`Large dataset optimized for performance. Keeping latest ${CONFIG.MAX_ROWS} records.`, "info");
        markDataAsModified();
    }
}

export function clearAllData(): void {
    if (confirm("क्या आप पक्का सारा data clear करना चाहते हैं? ये action undo नहीं हो सकता.")) {
        rawData = [];
        filteredData = [];
        savedFilteredData = [];
        headers.length = 0;
        currentDataForChat = [];
        currentPage = 1;
        isFilterActive = false;
        currentFilterState = null;
        
        updateTableAndUI();
        updateControls(headers);
        updatePaginationAndFilterUI();
        clearSummary();
        plotAll();
        
        if (currentUserId) {
            saveUserDataToFirebase([], [], false); 
        }
        
        showMessage("सारा data clear हो गया!", "success");
        
        // Show no data popup after clearing (only on index.html)
        checkAndShowNoDataPopup();
    }
}

// ========================== EXPORT DATA ==========================

export function exportToCSV(): void {
    if (!filteredData.length) {
        showMessage("Export करने के लिए कोई data नहीं है", "warning");
        
        // Show no data popup if trying to export when no data (only on index.html)
        checkAndShowNoDataPopup();
        return;
    }

    try {
        const csv = Papa.unparse({
            fields: headers,
            data: filteredData.map(row => headers.map(header => row[header]))
        });
        
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `data_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showMessage("CSV export successfully!", "success");
    } catch (error: any) {
        console.error("Export error:", error);
        showMessage("Export करने मे error: " + error.message, "danger");
    }
}

// ========================== EVENT HANDLERS (for Data Logic) ==========================

document.addEventListener('DOMContentLoaded', function() {
    document.addEventListener('filtersReset', function(e) {
        console.log('Event received: filtersReset');
        if (!isResetting) { 
             resetFiltersAndShowAllData();
        } else {
             console.log('filtersReset received, but ignoring to prevent infinite loop.');
        }
    });
});

// ========================== UTILITY FUNCTIONS ==========================

export function getDataStats() {
    return {
        totalRows: rawData.length,
        filteredRows: filteredData.length,
        headers: headers.length,
        currentPage: currentPage,
        totalPages: Math.ceil(filteredData.length / rowsPerPage),
        isModified: isDataModified,
        isFilterActive: isFilterActive,
        filterState: currentFilterState
    };
}

export function refreshData(): void {
    // NEW: Smart refresh that preserves filters
    if (isFilterActive && currentFilterState) {
        // Reapply current filters to current raw data
        filteredData = applyFilters(rawData, headers);
        savedFilteredData = [...filteredData];
        showMessage(`Filters reapplied! ${filteredData.length} rows match current filters`, "info");
    } else {
        // No active filters, just show all data
        filteredData = [...rawData];
        savedFilteredData = [...rawData];
    }
    
    currentPage = 1;
    currentDataForChat = [...filteredData];
    
    updatePaginationAndFilterUI();
    updateTableAndUI();
    plotAll();
    clearSummary();
    if (filteredData.length) {
        generateSummary(filteredData);
    }
}

export function areFiltersActive(): boolean {
    return isFilterActive;
}

// ==========================================
// DASHBOARD LAYOUT TEMPLATES MANAGEMENT
// ==========================================

export function getTemplatesList(): TemplateLayout[] {
    // 1. Load custom templates from localStorage
    const localTemplatesRaw = localStorage.getItem('vedrabi_dashboard_templates');
    let customTemplates: TemplateLayout[] = [];
    try {
        if (localTemplatesRaw) {
            customTemplates = JSON.parse(localTemplatesRaw);
        }
    } catch (e) {
        console.error("Error parsing custom templates:", e);
    }
    
    // 2. Build default templates based on current active headers
    const currentHeaders = headers || [];
    
    // Helper to find column by regex
    const findCol = (regex: RegExp, fallbackIdx = 0, isNumeric = false) => {
        if (!currentHeaders || currentHeaders.length === 0) return '';
        // Look for exact regex match
        const match = currentHeaders.find(h => regex.test(h));
        if (match) return match;
        
        // Fallback: search by numeric/string type if we have rawData
        if (isNumeric && rawData && rawData.length > 0) {
            for (let h of currentHeaders) {
                const val = rawData[0][h];
                if (val !== undefined && val !== null && !isNaN(parseFloat(val))) {
                    return h;
                }
            }
        }
        
        return currentHeaders[Math.min(fallbackIdx, currentHeaders.length - 1)] || '';
    };
    
    const xSales = findCol(/product|item|category|month|name|brand|उत्पाद|श्रेणी|तिथि|date/i, 0, false);
    const ySales = findCol(/sales|sale|revenue|amount|biki|price|बिक्री|राशि/i, 1, true);
    
    const xFinance = findCol(/month|year|department|dept|category|महीना|विभाग/i, 0, false);
    const yFinanceExpense = findCol(/expense|cost|spend|खर्च|व्यय/i, 1, true);
    const yFinanceRevenue = findCol(/revenue|profit|income|बिक्री|लाभ/i, 2, true);
    
    const xHR = findCol(/department|dept|team|role|education|विभाग|टीम/i, 0, false);
    const yHRCount = findCol(/count|employees|salary|rating|completion|performance|कर्मचारी|संख्या/i, 1, true);

    const defaultTemplates: TemplateLayout[] = [
        {
            id: 'preset-sales',
            name: 'बिक्री प्रदर्शन टेम्पलेट (Sales Performance)',
            department: 'Sales',
            description: 'बिक्री, राजस्व और उत्पाद श्रेणियों के रुझानों का व्यापक विश्लेषण।',
            isCustom: false,
            visualizations: [
                {
                    id: 'chart-sales-bar',
                    type: 'bar',
                    color: '#3b82f6',
                    title: 'उत्पाद वार बिक्री (Product Sales Bar)',
                    xAxisLabel: xSales,
                    yAxisLabel: ySales,
                    columns: [xSales, ySales].filter(Boolean),
                    position: { top: '10px', left: '10px' },
                    size: { width: '580px', height: '320px' }
                },
                {
                    id: 'chart-sales-line',
                    type: 'smooth-line',
                    color: '#10b981',
                    title: 'बिक्री रुझान (Sales Trend Line)',
                    xAxisLabel: xSales,
                    yAxisLabel: ySales,
                    columns: [xSales, ySales].filter(Boolean),
                    position: { top: '10px', left: '610px' },
                    size: { width: '580px', height: '320px' }
                },
                {
                    id: 'chart-sales-pie',
                    type: 'rose-radius',
                    color: '#f59e0b',
                    title: 'श्रेणी वितरण (Category Distribution Rose)',
                    xAxisLabel: xSales,
                    yAxisLabel: ySales,
                    columns: [xSales, ySales].filter(Boolean),
                    position: { top: '350px', left: '300px' },
                    size: { width: '580px', height: '320px' }
                }
            ],
            chartGlobalSettings: {
                gridShowHide: true,
                tooltipOnOff: true,
                zoomEnable: true,
                colorPaletteName: 'classic',
                showLabels: true
            },
            backgroundTemplateIndex: "1"
        },
        {
            id: 'preset-finance',
            name: 'वित्त एवं बजट टेम्पलेट (Finance & Budget)',
            department: 'Finance',
            description: 'विभागवार खर्चों, बजट बनाम वास्तविक व्यय, और लाभ मार्जिन का विश्लेषण।',
            isCustom: false,
            visualizations: [
                {
                    id: 'chart-fin-bar',
                    type: 'grouped-bar',
                    color: '#ec4899',
                    title: 'विभागवार व्यय एवं राजस्व (Department Expenses)',
                    xAxisLabel: xFinance,
                    yAxisLabel: yFinanceExpense,
                    columns: [xFinance, yFinanceExpense, yFinanceRevenue].filter(Boolean),
                    position: { top: '10px', left: '10px' },
                    size: { width: '580px', height: '320px' }
                },
                {
                    id: 'chart-fin-pie',
                    type: 'doughnut',
                    color: '#8b5cf6',
                    title: 'खर्च वितरण (Expense Doughnut)',
                    xAxisLabel: xFinance,
                    yAxisLabel: yFinanceExpense,
                    columns: [xFinance, yFinanceExpense].filter(Boolean),
                    position: { top: '10px', left: '610px' },
                    size: { width: '580px', height: '320px' }
                }
            ],
            chartGlobalSettings: {
                gridShowHide: true,
                tooltipOnOff: true,
                zoomEnable: true,
                colorPaletteName: 'vintage',
                showLabels: true
            },
            backgroundTemplateIndex: "2"
        },
        {
            id: 'preset-hr',
            name: 'एचआर और टीम वितरण टेम्पलेट (HR & Team Distribution)',
            department: 'HR',
            description: 'विभागवार कर्मचारी गणना, वेतन स्तर और प्रदर्शन मेट्रिक्स।',
            isCustom: false,
            visualizations: [
                {
                    id: 'chart-hr-bar',
                    type: 'horizontal-bar',
                    color: '#6366f1',
                    title: 'विभागवार कर्मचारी गणना (Employee Count)',
                    xAxisLabel: xHR,
                    yAxisLabel: yHRCount,
                    columns: [xHR, yHRCount].filter(Boolean),
                    position: { top: '10px', left: '10px' },
                    size: { width: '580px', height: '320px' }
                },
                {
                    id: 'chart-hr-radar',
                    type: 'radar',
                    color: '#06b6d4',
                    title: 'टीम प्रदर्शन प्रोफाइल (Team Performance Radar)',
                    xAxisLabel: xHR,
                    yAxisLabel: yHRCount,
                    columns: [xHR, yHRCount].filter(Boolean),
                    position: { top: '10px', left: '610px' },
                    size: { width: '580px', height: '320px' }
                }
            ],
            chartGlobalSettings: {
                gridShowHide: true,
                tooltipOnOff: true,
                zoomEnable: true,
                colorPaletteName: 'cool',
                showLabels: true
            },
            backgroundTemplateIndex: "3"
        }
    ];
    
    return [...customTemplates, ...defaultTemplates];
}

export async function saveTemplateLayout(name: string, department?: string): Promise<{ success: boolean; message?: string; template?: TemplateLayout }> {
    if (!name) return { success: false, message: "कृपया टेम्पलेट का नाम दर्ज करें।" };
    
    const id = `template-${Date.now()}`;
    const newTemplate: TemplateLayout = {
        id,
        name,
        department,
        isCustom: true,
        visualizations: sanitizeForStorage(visualizations),
        chartGlobalSettings: sanitizeForStorage(chartGlobalSettings),
        backgroundTemplateIndex: localStorage.getItem('selectedBackgroundTemplateIndex') || null,
        createdAt: new Date().toISOString()
    };
    
    try {
        const localTemplatesRaw = localStorage.getItem('vedrabi_dashboard_templates');
        let customTemplates: TemplateLayout[] = [];
        if (localTemplatesRaw) {
            try {
                customTemplates = JSON.parse(localTemplatesRaw);
            } catch (e) {}
        }
        customTemplates.unshift(newTemplate);
        localStorage.setItem('vedrabi_dashboard_templates', safeJsonStringify(customTemplates));
        
        // Firebase sync
        if (currentUserId) {
            await db.collection('users').doc(currentUserId).set({
                customTemplates: sanitizeForFirestore(customTemplates)
            }, { merge: true });
        }
        
        return { success: true, template: newTemplate };
    } catch (e: any) {
        console.warn("Template layout cloud sync warning; preserved in local storage:", e?.message || e);
        return { success: true, template: newTemplate };
    }
}

export async function deleteTemplateLayout(id: string): Promise<boolean> {
    try {
        const localTemplatesRaw = localStorage.getItem('vedrabi_dashboard_templates');
        if (!localTemplatesRaw) return false;
        
        let customTemplates: TemplateLayout[] = [];
        try {
            customTemplates = JSON.parse(localTemplatesRaw);
        } catch (e) {
            return false;
        }
        customTemplates = customTemplates.filter(t => t.id !== id);
        localStorage.setItem('vedrabi_dashboard_templates', safeJsonStringify(customTemplates));
        
        // Firebase sync
        if (currentUserId) {
            await db.collection('users').doc(currentUserId).set({
                customTemplates: sanitizeForFirestore(customTemplates)
            }, { merge: true });
        }
        return true;
    } catch (e: any) {
        console.warn("Template layout cloud deletion warning; removed from local storage:", e?.message || e);
        return true;
    }
}

export function loadTemplateLayout(template: TemplateLayout): boolean {
    if (!template) return false;
    
    // Clear and load visualizations
    visualizations.length = 0;
    if (template.visualizations) {
        template.visualizations.forEach(v => {
            visualizations.push(sanitizeForStorage(v));
        });
    }
    
    // Load global settings
    if (template.chartGlobalSettings) {
        Object.assign(chartGlobalSettings, template.chartGlobalSettings);
    }
    
    // Set background index
    if (template.backgroundTemplateIndex !== undefined && template.backgroundTemplateIndex !== null) {
        localStorage.setItem('selectedBackgroundTemplateIndex', template.backgroundTemplateIndex);
        
        // Update body or container background if applicable
        const backdropSelect = document.getElementById('canvasBackdropTheme') as HTMLSelectElement | null;
        if (backdropSelect) {
            backdropSelect.value = template.backgroundTemplateIndex;
            // trigger change event to reapply style
            backdropSelect.dispatchEvent(new Event('change'));
        }
    }
    
    return true;
}

(window as any).changePage = changePage;

/**
 * Smart Summary Mode Listener - Called when user toggles or changes summary rollup configuration
 */
export async function onSummaryModeChanged(newConfig: SummaryConfig): Promise<void> {
    SmartSummaryEngine.setActiveConfig(newConfig);
    await SmartSummaryEngine.saveSummaryConfig(currentUserId || 'guest_user', newConfig);

    if (newConfig.enabled && rawData.length > 0) {
        const sourceData = (isFilterActive && savedFilteredData.length > 0) ? savedFilteredData : rawData;
        const summaryRes = await SmartSummaryEngine.computeSummaryAsync(sourceData, newConfig, currentUserId || 'guest_user');
        filteredData = summaryRes.summaryData;
        savedFilteredData = [...filteredData];
        currentDataForChat = [...filteredData];
        SummaryConfigModal.updateToolbarIndicator(true);
    } else {
        // Full Raw Data Mode
        if (isFilterActive && savedFilteredData.length > 0) {
            filteredData = [...savedFilteredData];
        } else {
            filteredData = [...rawData];
            savedFilteredData = [...rawData];
        }
        currentDataForChat = [...filteredData];
        SummaryConfigModal.updateToolbarIndicator(false);
    }

    clearDataCache();
    currentPage = 1;
    updateControls(headers);
    await updateTableAndUI();
    plotAll();
    updateKPICards();
    clearSummary();
    if (filteredData.length) {
        generateSummary(filteredData);
    }
}

/**
 * Recalculate summary from latest underlying raw data
 */
export function recalculateActiveSummary(): void {
    if (SmartSummaryEngine.isSummaryModeActive() && rawData.length > 0) {
        const sourceData = (isFilterActive && savedFilteredData.length > 0) ? savedFilteredData : rawData;
        const summaryRes = SmartSummaryEngine.computeSummary(sourceData);
        filteredData = summaryRes.summaryData;
        savedFilteredData = [...filteredData];
        currentDataForChat = [...filteredData];
    }
}

