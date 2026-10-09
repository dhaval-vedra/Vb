// js/charts.ts
import { showMessage, escapeHtml } from '../core/utils.ts';
import { filteredData, rawData, headers, saveDashboardSettings, ensureDataHydrated, isDataFullyHydrated } from '../../store/DataHandler.ts';
import { initializeDragAndResize } from '../ui/drag_drop.ts';
import { updateEditModeSummaryOverlay } from '../ui/editModeSummaryOverlay.ts';
import { captureChartSnapshot } from '../ui/savedViews.js';
import { getAiChartAdvice, attachToggleAiAdviceListeners } from '../ai/ai_advice.ts';
import { allActiveChartInstances } from './chartState.js';
import { populateDropZones } from './chartcolomdrag.js';
import { fetchBackendChartSpec, fetchBackendBatchChartSpecs, submitAndPollAsyncChartJob, fetchBackendChartSVG } from './backendChartClient.js';
import { t } from '../i18n/languageManager.ts';
import { DrillDownEngine } from '../ui/drillDownModal.ts';
import { SmartSummaryEngine } from '../core/smartSummaryEngine.ts';
import { DatasetStore } from '../data/datasetStore.ts';
import { isCrossFilteringActive, applyCrossFilter } from '../ai/crossFilterEngine.ts';

// Global ambient declarations for libraries loaded via script tags
declare const echarts: any;
declare const Plotly: any;
declare const bootstrap: any;

declare global {
    interface Window {
        editingChartId?: string | null;
        activePreviewChartId?: string | null;
        editingKpiId?: string | null;
    }
}

// Chart folder imports
import { commonChartOptions, getRandomColor } from '../../chart/uility.js';
import { getBarChartOption } from '../../chart/bar.js';
import { getLineChartOption } from '../../chart/line.js';
import { getPieChartOption } from '../../chart/pie.js';
import { getScatterChartOption } from '../../chart/scatter.js';
import { getFunnelChartOption } from '../../chart/funneled.js';
import { getGaugeChartOption } from '../../chart/gauge.js';
import { getRadarChartOption } from '../../chart/radar.js';
import { getTreemapChartOption } from '../../chart/tree_map.js';
import { getCandlestickChartOption } from '../../chart/candlestick.js';
import { getBar3DChartOption } from '../../chart/bar3d.js';
import { getLine3DChartOption } from '../../chart/line3d.js';
import {
    getWaterfallChartOption,
    getHeatmapChartOption,
    getSankeyChartOption,
    getBulletChartOption,
    getBoxplotChartOption
} from '../../chart/professional.js';

// Type Interfaces
export interface ChartAnnotation {
    dataName?: string;
    value?: any;
    seriesIndex?: number;
    seriesName?: string;
    dataIndex?: number;
    tag?: string;
    icon?: string;
    note?: string;
    color?: string;
    createdAt?: string;
}

export interface ChartFilter {
    columnName: string;
    selectedValues: string[];
}

export interface ChartConfig {
    id: string;
    type: string;
    color?: string;
    title?: string;
    xAxisLabel?: string;
    yAxisLabel?: string;
    zAxisLabel?: string;
    customShape?: string;
    columns?: string[];
    xAxis?: string;
    yAxes?: string[];
    zAxis?: string | null;
    position?: { top: string; left: string };
    size?: { width: string; height: string };
    filters?: ChartFilter[];
    pinned?: boolean;
    isPreview?: boolean;
    annotations?: ChartAnnotation[];
    threshold?: any;
    colorPalette?: string[];
    colorPaletteName?: string;
    metricCol?: string;
    aggregation?: string;
    sparklineType?: string;
    kpiStyle?: string;
    kpiTheme?: string;
    sparklineWidth?: number;
    sparklineHeight?: number;
    kpiTitleSize?: number;
    kpiValueSize?: number;
    sparklinePosition?: string;
    dataRowLimit?: number | 'all';
    datasetId?: string;
    datasetName?: string;
    templateCategory?: string;
    textboxStyle?: string;
}

export interface ChartGlobalSettings {
    gridShowHide: boolean;
    tooltipOnOff: boolean;
    zoomEnable: boolean;
    animationDuration: number;
    axisFormat: string;
    legendPosition: string;
    showLabels: boolean;
    colorPalette: string[];
    showToolbox: boolean;
    colorPaletteName: string;
    fontSize: string;
    gridStyle: string;
    lineStyle: string;
    areaFill: boolean;
    barRounded: boolean;
    threshold?: any;
}

export interface CityFilterState {
    enabled: boolean;
    selectedCities: string[];
}

// Constants
const CHART_CONSTANTS = {
    DEFAULT_SIZE: { width: '600px', height: '400px' },
    DEFAULT_POSITION: { top: '20px', left: '20px' },
    ANIMATION_DURATION: 1000,
    DEBOUNCE_DELAY: 100,
    RESIZE_DEBOUNCE: 250,
    CACHE_LIMIT: 50
};

const ERROR_MESSAGES = {
    INVALID_CONFIG: 'अमान्य चार्ट कॉन्फ़िगरेशन',
    CONTAINER_NOT_FOUND: 'कंटेनर नहीं मिला',
    DATA_UNAVAILABLE: 'डेटा उपलब्ध नहीं',
    DASHBOARD_NOT_FOUND: 'डैशबोर्ड कंटेनर नहीं मिला'
};

// Global variables
export let visualizations: ChartConfig[] = [];
let plotAllTimeout: any;
let resizeTimeout: any;
const dataCache = new Map<string, any>();

export function clearDataCache(): void {
    dataCache.clear();
}

/**
 * सुरक्षित रूप से डैशबोर्ड कंटेनर एलिमेंट प्राप्त करता है
 */
export function getDashboardContainer(): HTMLElement | null {
    if (typeof document === 'undefined') return null;
    return document.getElementById('dashboardContent') || 
           document.getElementById('visualizationsSection') || 
           document.getElementById('dashboardSection') || 
           document.querySelector('.main-content-container') as HTMLElement | null;
}

/**
 * Visualization Processing Lifecycle:
 * Displays a smooth 'Data Processing' overlay in the visualization container
 * while data is being mapped or processed for ECharts/Plotly, replacing jarring visual flicker.
 */
export function showProcessingState(chartId: string, message = "डेटा प्रोसेस हो रहा है..."): void {
    const container = document.getElementById(`container-${chartId}`);
    if (!container) return;

    let overlay = container.querySelector('.chart-processing-overlay') as HTMLElement;
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = `processing-overlay-${chartId}`;
        overlay.className = 'chart-processing-overlay d-flex flex-column align-items-center justify-content-center position-absolute top-0 start-0 w-100 h-100 rounded-3';
        overlay.style.zIndex = '25';
        overlay.style.backgroundColor = 'rgba(255, 255, 255, 0.75)';
        overlay.style.backdropFilter = 'blur(4px)';
        (overlay.style as any).webkitBackdropFilter = 'blur(4px)';
        overlay.style.transition = 'opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1), visibility 0.25s cubic-bezier(0.4, 0, 0.2, 1)';
        overlay.style.pointerEvents = 'none';
        overlay.style.opacity = '1';

        const isDark = document.body.classList.contains('dark-theme');
        if (isDark) {
            overlay.style.backgroundColor = 'rgba(15, 23, 42, 0.75)';
        }

        overlay.innerHTML = `
            <div class="d-flex align-items-center gap-2 px-3 py-2 rounded-pill shadow-sm border bg-body">
                <div class="spinner-border spinner-border-sm text-primary" role="status" style="width: 1rem; height: 1rem; border-width: 0.18em;"></div>
                <span class="fw-medium text-body font-sans" style="font-size: 12px; letter-spacing: 0.01em;">${message}</span>
            </div>
        `;
        container.appendChild(overlay);
    } else {
        overlay.style.opacity = '1';
        overlay.style.visibility = 'visible';
    }
}

export function hideProcessingState(chartId: string): void {
    const container = document.getElementById(`container-${chartId}`);
    if (!container) return;

    const overlay = container.querySelector('.chart-processing-overlay') as HTMLElement;
    if (overlay) {
        overlay.style.opacity = '0';
        setTimeout(() => {
            if (overlay && overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
        }, 260);
    }
}

// Global chart settings object
export let chartGlobalSettings: ChartGlobalSettings = {
    gridShowHide: true,
    tooltipOnOff: true,
    zoomEnable: true,
    animationDuration: 1000,
    axisFormat: 'none',
    legendPosition: 'bottom',
    showLabels: true,
    colorPalette: ['#5470C6', '#91CC75', '#EE6666', '#FC8452', '#73C0DE', '#3BA272', '#FACC14', '#9A60B4', '#EA7CCC'],
    showToolbox: false,
    colorPaletteName: 'classic',
    fontSize: 'medium',
    gridStyle: 'solid',
    lineStyle: 'normal',
    areaFill: false,
    barRounded: true
};

// City filter state
export let cityFilterState: CityFilterState = {
    enabled: false,
    selectedCities: []
};

// Chart freeze state
export let chartFreezeState = new Map<string, any>();

// Chart button permissions state
export let chartButtonPermissions = new Map<string, any>();

// Utility Functions
const ChartUtils = {
    createContainerElement(chartConfig: ChartConfig): HTMLElement {
        const container = document.createElement('div');
        container.id = `container-${chartConfig.id}`;
        container.className = 'visualization-container chart-item chart-fade-in';
        container.style.cssText = `
            position: absolute;
            width: ${chartConfig.size?.width || CHART_CONSTANTS.DEFAULT_SIZE.width};
            height: ${chartConfig.size?.height || CHART_CONSTANTS.DEFAULT_SIZE.height};
            top: ${chartConfig.position?.top || CHART_CONSTANTS.DEFAULT_POSITION.top};
            left: ${chartConfig.position?.left || CHART_CONSTANTS.DEFAULT_POSITION.left};
            z-index: 100;
            cursor: grab;
        `;
        return container;
    },

    getFilteredData(data: any[], chartConfig: ChartConfig): any[] {
        // If chart is frozen, return the frozen data
        if (chartFreezeState.has(chartConfig.id) && chartFreezeState.get(chartConfig.id).isFrozen) {
            return chartFreezeState.get(chartConfig.id).frozenData;
        }

        const dataFingerprint = Array.isArray(data) 
            ? `${data.length}-${data[0] ? JSON.stringify(data[0]) : ''}-${data[data.length - 1] ? JSON.stringify(data[data.length - 1]) : ''}`
            : '0';

        const cacheKey = JSON.stringify({
            dataFingerprint,
            chartId: chartConfig.id,
            columns: chartConfig.columns,
            filters: chartConfig.filters,
            cityFilter: cityFilterState,
            dataRowLimit: chartConfig.dataRowLimit || 'all'
        });

        if (dataCache.has(cacheKey)) {
            return dataCache.get(cacheKey);
        }

        const filtered = getFilteredDataByChart(data, chartConfig);
        dataCache.set(cacheKey, filtered);
        
        // Cache cleanup
        if (dataCache.size > CHART_CONSTANTS.CACHE_LIMIT) {
            const firstKey = dataCache.keys().next().value;
            if (firstKey !== undefined) {
                dataCache.delete(firstKey);
            }
        }
        
        return filtered;
    },

    validateChartConfig(chartConfig: ChartConfig): boolean {
        if (!chartConfig || typeof chartConfig !== 'object') return false;
        if (!chartConfig.id || !chartConfig.type) return false;
        if (!Array.isArray(chartConfig.columns)) {
            chartConfig.columns = [];
        }
        return true;
    },

    validateInput(xAxisCol: string, yAxisCols: string[]): boolean {
        if (!xAxisCol || !yAxisCols || yAxisCols.length === 0) {
            showMessage("कृपया X-अक्ष कॉलम और Y-अक्ष कॉलम चुनें।", "warning");
            return false;
        }
        return true;
    }
};

/**
 * चार्ट बटन अनुमतियों को प्रबंधित करने के लिए पॉपअप दिखाता है
 */
function showChartButtonPermissionsPopup(chartId: string): void {
    try {
        const chartConfig = visualizations.find(v => v.id === chartId);
        if (!chartConfig) return;

        // Get current permissions or initialize default ones
        const currentPermissions = chartButtonPermissions.get(chartId) || {
            fullscreen: true,
            delete: true,
            download: true,
            aiAdvice: true,
            edit: true,
            filter: true,
            freeze: true
        };

        // Create popup HTML
        const popupHTML = `
            <div class="modal fade" id="chartPermissionsModal" tabindex="-1" aria-labelledby="chartPermissionsModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="chartPermissionsModalLabel">चार्ट बटन अनुमतियाँ</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <p class="text-muted mb-3">उन बटनों को चुनें जो चार्ट कंटेनर पर दिखाई देंगे:</p>
                            
                            <div class="permissions-list">
                                <div class="form-check mb-2">
                                    <input class="form-check-input permission-checkbox" type="checkbox" value="fullscreen" id="perm-fullscreen" ${currentPermissions.fullscreen ? 'checked' : ''}>
                                    <label class="form-check-label" for="perm-fullscreen">
                                        <i class="bi bi-arrows-fullscreen me-2"></i>फुलस्क्रीन बटन
                                    </label>
                                </div>
                                
                                <div class="form-check mb-2">
                                    <input class="form-check-input permission-checkbox" type="checkbox" value="delete" id="perm-delete" ${currentPermissions.delete ? 'checked' : ''}>
                                    <label class="form-check-label" for="perm-delete">
                                        <i class="bi bi-trash me-2"></i>डिलीट बटन
                                    </label>
                                </div>
                                
                                <div class="form-check mb-2">
                                    <input class="form-check-input permission-checkbox" type="checkbox" value="download" id="perm-download" ${currentPermissions.download ? 'checked' : ''}>
                                    <label class="form-check-label" for="perm-download">
                                        <i class="bi bi-download me-2"></i>डाउनलोड बटन
                                    </label>
                                </div>
                                
                                <div class="form-check mb-2">
                                    <input class="form-check-input permission-checkbox" type="checkbox" value="aiAdvice" id="perm-aiAdvice" ${currentPermissions.aiAdvice ? 'checked' : ''}>
                                    <label class="form-check-label" for="perm-aiAdvice">
                                        <i class="bi bi-robot me-2"></i>AI सलाह बटन
                                    </label>
                                </div>
                                
                                <div class="form-check mb-2">
                                    <input class="form-check-input permission-checkbox" type="checkbox" value="edit" id="perm-edit" ${currentPermissions.edit ? 'checked' : ''}>
                                    <label class="form-check-label" for="perm-edit">
                                        <i class="bi bi-pencil-square me-2"></i>एडिट बटन
                                    </label>
                                </div>
                                
                                <div class="form-check mb-2">
                                    <input class="form-check-input permission-checkbox" type="checkbox" value="filter" id="perm-filter" ${currentPermissions.filter ? 'checked' : ''}>
                                    <label class="form-check-label" for="perm-filter">
                                        <i class="bi bi-funnel me-2"></i>फिल्टर बटन
                                    </label>
                                </div>
                                
                                <div class="form-check mb-2">
                                    <input class="form-check-input permission-checkbox" type="checkbox" value="freeze" id="perm-freeze" ${currentPermissions.freeze ? 'checked' : ''}>
                                    <label class="form-check-label" for="perm-freeze">
                                        <i class="bi bi-pause-circle me-2"></i>फ्रीज बटन
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">रद्द करें</button>
                            <button type="button" class="btn btn-primary" id="saveChartPermissions">परिवर्तन सहेजें</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal if any
        const existingModal = document.getElementById('chartPermissionsModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', popupHTML);

        // Get modal instance
        const modalEl = document.getElementById('chartPermissionsModal');
        if (!modalEl) return;
        const permissionsModal = new bootstrap.Modal(modalEl);
        
        // Save button event listener
        const saveBtn = document.getElementById('saveChartPermissions');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                saveChartButtonPermissions(chartId);
                permissionsModal.hide();
            });
        }

        // Show modal
        permissionsModal.show();

        // Remove modal from DOM when hidden
        modalEl.addEventListener('hidden.bs.modal', () => {
            modalEl.remove();
        });

    } catch (error) {
        console.error("Error showing chart permissions popup:", error);
        showMessage("अनुमति पॉपअप दिखाने में त्रुटि", "danger");
    }
}

/**
 * चार्ट बटन अनुमतियों को सहेजता है
 */
function saveChartButtonPermissions(chartId: string): void {
    try {
        const checkboxes = document.querySelectorAll('.permission-checkbox');
        const permissions: Record<string, boolean> = {};

        checkboxes.forEach((cb: any) => {
            permissions[cb.value] = cb.checked;
        });

        // Save permissions
        chartButtonPermissions.set(chartId, permissions);
        
        // Re-plot chart to reflect changes
        const chartConfig = visualizations.find(v => v.id === chartId);
        if (chartConfig) {
            plotChart(chartConfig);
        }

        showMessage("चार्ट बटन अनुमतियाँ सफलतापूर्वक सहेजी गईं!", "success");
    } catch (error) {
        console.error("Error saving chart permissions:", error);
        showMessage("अनुमतियाँ सहेजने में त्रुटि", "danger");
    }
}

/**
 * चार्ट के लिए बटन HTML जेनरेट करता है (अनुमतियों के आधार पर)
 */
function generateChartButtonsHTML(chartConfig: ChartConfig): string {
    const permissions = chartButtonPermissions.get(chartConfig.id) || {
        fullscreen: true,
        delete: true,
        download: true,
        aiAdvice: true,
        edit: true,
        filter: true,
        freeze: true
    };

    const isFrozen = chartFreezeState.get(chartConfig.id)?.isFrozen || false;
    const isPlotlyChart = ['candlestick', 'ohlc'].includes(chartConfig.type);

    // Plotly-specific buttons
    const plotlyButtons = (isPlotlyChart && permissions.download) ? `
        <button class="btn btn-sm btn-outline-secondary plotly-zoom me-1" data-chart-id="${chartConfig.id}" title="${t('charts.zoom', 'Zoom')}">
            <i class="bi bi-zoom-in"></i>
        </button>
        <button class="btn btn-sm btn-outline-secondary plotly-pan me-1" data-chart-id="${chartConfig.id}" title="${t('charts.pan', 'Pan')}">
            <i class="bi bi-arrows-move"></i>
        </button>
        <button class="btn btn-sm btn-outline-secondary plotly-reset me-1" data-chart-id="${chartConfig.id}" title="${t('charts.resetAxes', 'Reset Axes')}">
            <i class="bi bi-arrow-counterclockwise"></i>
        </button>
    ` : '';

    // Main buttons based on permissions
    const buttons: string[] = [];

    // Delete button (always in dropdown)
    if (permissions.delete) {
        buttons.push(`
            <li>
                <a class="dropdown-item delete-chart" href="#" data-chart-id="${chartConfig.id}">
                    <i class="bi bi-trash"></i> ${t('charts.delete', 'Delete Chart')}
                </a>
            </li>
        `);
    }

    // Consolidate secondary actions cleanly into the More Options dropdown
    if (permissions.edit) {
        buttons.push(`
            <li>
                <a class="dropdown-item edit-chart" href="#" data-chart-id="${chartConfig.id}">
                    <i class="bi bi-pencil-square me-2 text-info"></i> ${t('charts.edit', 'Edit Chart')}
                </a>
            </li>
        `);
    }

    if (permissions.download) {
        buttons.push(`
            <li>
                <a class="dropdown-item download-chart" href="#" data-chart-id="${chartConfig.id}">
                    <i class="bi bi-download me-2 text-primary"></i> ${t('charts.download', 'Download Chart')}
                </a>
            </li>
        `);
    }

    if (permissions.freeze) {
        buttons.push(`
            <li>
                <a class="dropdown-item freeze-chart" href="#" data-chart-id="${chartConfig.id}">
                    <i class="bi ${isFrozen ? 'bi-play-circle-fill text-success' : 'bi-pause-circle text-warning'} me-2"></i> ${isFrozen ? t('charts.unfreeze', 'Unfreeze Chart') : t('charts.freeze', 'Freeze Chart')}
                </a>
            </li>
        `);
    }

    const isPinned = chartConfig.pinned || false;
    buttons.push(`
        <li>
            <a class="dropdown-item pin-chart" href="#" data-chart-id="${chartConfig.id}">
                <i class="bi ${isPinned ? 'bi-pin-angle-fill text-success' : 'bi-pin-angle text-secondary'} me-2"></i> ${isPinned ? t('charts.unpin', 'Unpin Chart') : t('charts.pin', 'Pin Chart')}
            </a>
        </li>
    `);

    // Row limit control in dropdown
    const currentLimitBadge = (!chartConfig.dataRowLimit || chartConfig.dataRowLimit === 'all') 
        ? 'All' 
        : `${chartConfig.dataRowLimit}`;
    buttons.push(`
        <li class="dropstart">
            <a class="dropdown-item dropdown-toggle d-flex align-items-center justify-content-between" href="#" data-bs-toggle="dropdown" aria-expanded="false">
                <span><i class="bi bi-list-ol me-2 text-success"></i> ${t('charts.rowLimit', 'Data Rows Limit')}</span>
                <span class="badge bg-light text-dark border ms-2">${currentLimitBadge}</span>
            </a>
            <ul class="dropdown-menu shadow-lg border-0 text-xs py-1" style="min-width: 170px;">
                <li><h6 class="dropdown-header font-bold text-dark py-1 my-0">${t('charts.rowLimit', 'Data Rows Limit')}</h6></li>
                <li><hr class="dropdown-divider my-1"></li>
                <li><a class="dropdown-item change-chart-row-limit ${(!chartConfig.dataRowLimit || chartConfig.dataRowLimit === 'all') ? 'active fw-bold' : ''}" href="#" data-chart-id="${chartConfig.id}" data-limit="all"><i class="bi bi-infinity me-2 text-primary"></i> ${t('charts.allRows', 'All Rows')}</a></li>
                <li><a class="dropdown-item change-chart-row-limit ${chartConfig.dataRowLimit === 10 ? 'active fw-bold' : ''}" href="#" data-chart-id="${chartConfig.id}" data-limit="10"><i class="bi bi-hash me-2 text-info"></i> 10</a></li>
                <li><a class="dropdown-item change-chart-row-limit ${chartConfig.dataRowLimit === 25 ? 'active fw-bold' : ''}" href="#" data-chart-id="${chartConfig.id}" data-limit="25"><i class="bi bi-hash me-2 text-info"></i> 25</a></li>
                <li><a class="dropdown-item change-chart-row-limit ${chartConfig.dataRowLimit === 50 ? 'active fw-bold' : ''}" href="#" data-chart-id="${chartConfig.id}" data-limit="50"><i class="bi bi-hash me-2 text-info"></i> 50</a></li>
                <li><a class="dropdown-item change-chart-row-limit ${chartConfig.dataRowLimit === 100 ? 'active fw-bold' : ''}" href="#" data-chart-id="${chartConfig.id}" data-limit="100"><i class="bi bi-hash me-2 text-info"></i> 100</a></li>
                <li><a class="dropdown-item change-chart-row-limit ${chartConfig.dataRowLimit === 500 ? 'active fw-bold' : ''}" href="#" data-chart-id="${chartConfig.id}" data-limit="500"><i class="bi bi-hash me-2 text-info"></i> 500</a></li>
            </ul>
        </li>
    `);

    if (permissions.aiAdvice) {
        buttons.push(`
            <li>
                <a class="dropdown-item get-ai-advice" href="#" data-chart-id="${chartConfig.id}">
                    <i class="bi bi-robot me-2 text-primary"></i> ${t('charts.aiAdvice', 'AI Advice')}
                </a>
            </li>
        `);
    }

    buttons.push(`
        <li>
            <a class="dropdown-item duplicate-chart" href="#" data-chart-id="${chartConfig.id}">
                <i class="bi bi-copy me-2 text-indigo-600"></i> ${t('charts.duplicate', 'Duplicate')}
            </a>
        </li>
    `);

    buttons.push(`
        <li>
            <a class="dropdown-item move-to-tab-chart" href="#" data-chart-id="${chartConfig.id}">
                <i class="bi bi-box-arrow-up-right me-2 text-primary"></i> ${t('charts.moveToTab', 'Move to Tab...')}
            </a>
        </li>
    `);

    // Multi-Dataset source selection if multiple datasets are registered
    const allDatasets = DatasetStore.getAllDatasets();
    if (allDatasets.length > 1) {
        const currentDatasetName = chartConfig.datasetName || (chartConfig.datasetId ? (allDatasets.find(d => d.id === chartConfig.datasetId)?.name || 'Default') : 'Active Dataset');
        const dsItems = allDatasets.map(ds => `
            <li>
                <a class="dropdown-item switch-chart-dataset ${chartConfig.datasetId === ds.id ? 'active fw-bold' : ''}" href="#" data-chart-id="${chartConfig.id}" data-dataset-id="${ds.id}" data-dataset-name="${escapeHtml(ds.name)}">
                    <i class="bi bi-database me-2 ${chartConfig.datasetId === ds.id ? 'text-primary' : 'text-muted'}"></i> ${escapeHtml(ds.name)}
                </a>
            </li>
        `).join('');

        buttons.push(`
            <li class="dropstart">
                <a class="dropdown-item dropdown-toggle d-flex align-items-center justify-content-between" href="#" data-bs-toggle="dropdown" aria-expanded="false">
                    <span><i class="bi bi-database me-2 text-fuchsia-600"></i> ${t('charts.sourceDataset', 'Dataset Source')}</span>
                    <span class="badge bg-light text-dark border ms-2 text-truncate" style="max-width: 70px;">${escapeHtml(currentDatasetName)}</span>
                </a>
                <ul class="dropdown-menu shadow-lg border-0 text-xs py-1" style="min-width: 180px;">
                    <li><h6 class="dropdown-header font-bold text-dark py-1 my-0">${t('charts.selectDataset', 'Select Dataset')}</h6></li>
                    <li><hr class="dropdown-divider my-1"></li>
                    ${dsItems}
                </ul>
            </li>
        `);
    }

    buttons.push(`
        <li>
            <a class="dropdown-item snapshot-chart" href="#" data-chart-id="${chartConfig.id}">
                <i class="bi bi-camera-fill me-2 text-teal-600"></i> ${t('charts.saveSnapshot', 'Save View Snapshot')}
            </a>
        </li>
    `);

    if (permissions.fullscreen) {
        buttons.push(`
            <li>
                <a class="dropdown-item fullscreen-chart" href="#" data-chart-id="${chartConfig.id}">
                    <i class="bi bi-arrows-fullscreen me-2 text-secondary"></i> ${t('charts.fullscreen', 'Fullscreen')}
                </a>
            </li>
        `);
    }

    // Quick primary buttons shown directly on the compact toolbar
    const individualButtons: string[] = [];

    if (permissions.filter) {
        individualButtons.push(`
            <div class="dropdown d-inline-block">
                <button class="btn btn-sm btn-light border shadow-2xs chart-filter-btn" type="button" data-bs-toggle="dropdown" aria-expanded="false" data-chart-id="${chartConfig.id}" title="${t('charts.filterChartData', 'Filter Chart Data')}">
                    <i class="bi bi-funnel text-primary" style="font-size: 0.72rem;"></i>
                </button>
                <div class="dropdown-menu p-3 chart-filter-dropdown shadow-lg border-0" style="max-height: 300px; overflow-y: auto; width: 280px; z-index: 1050;" data-chart-id="${chartConfig.id}">
                    <h6 class="dropdown-header font-bold text-dark border-bottom pb-2 mb-2">${t('charts.filterByColumn', 'Filter by Column')}</h6>
                    <div class="filter-options-container"></div>
                </div>
            </div>
        `);
    }

    return `
        <div class="btn-group btn-group-sm align-items-center gap-0.5" role="group">
            ${plotlyButtons}
            ${individualButtons.join('')}
            <div class="dropdown d-inline-block">
                <button class="btn btn-sm btn-light border shadow-2xs dropdown-toggle no-caret" type="button" data-bs-toggle="dropdown" aria-expanded="false" title="${t('charts.moreOptions', 'More Options')}">
                    <i class="bi bi-three-dots-vertical text-secondary" style="font-size: 0.72rem;"></i>
                </button>
                <ul class="dropdown-menu dropdown-menu-end shadow-lg border-0 rounded-3 py-1" style="z-index: 1050;">
                    ${buttons.join('')}
                    <li><hr class="dropdown-divider my-1"></li>
                    <li>
                        <a class="dropdown-item chart-permissions-btn text-xs" href="#" data-chart-id="${chartConfig.id}">
                            <i class="bi bi-gear me-2 text-muted"></i> ${t('charts.editPermissions', 'Edit Button Permissions')}
                        </a>
                    </li>
                </ul>
            </div>
        </div>
    `;
}

/**
 * चार्ट को फ्रीज/अनफ्रीज करता है
 */
export function toggleChartFreeze(chartId: string): void {
    try {
        const chartConfig = visualizations.find(v => v.id === chartId);
        if (!chartConfig) return;

        const currentState = chartFreezeState.get(chartId);
        const isCurrentlyFrozen = currentState?.isFrozen || false;

        if (isCurrentlyFrozen) {
            // Unfreeze the chart
            chartFreezeState.delete(chartId);
            showMessage(`चार्ट "${chartConfig.title}" अनफ्रीज किया गया`, "success");
        } else {
            // Freeze the chart with current data
            const currentData = ChartUtils.getFilteredData(filteredData, chartConfig);
            chartFreezeState.set(chartId, {
                isFrozen: true,
                frozenData: [...currentData], // Create a copy of the data
                frozenAt: new Date().toLocaleString()
            });
            showMessage(`चार्ट "${chartConfig.title}" फ्रीज किया गया`, "success");
        }

        // Update the freeze button appearance
        updateFreezeButtonAppearance(chartId);
        
        // Re-plot the chart to reflect freeze state
        plotChart(chartConfig);
        
    } catch (error) {
        console.error("Error toggling chart freeze:", error);
        showMessage("चार्ट फ्रीज करने में त्रुटि", "danger");
    }
}

/**
 * फ्रीज बटन की appearance अपडेट करता है
 */
function updateFreezeButtonAppearance(chartId: string): void {
    const container = document.getElementById(`container-${chartId}`);
    if (!container) return;

    const freezeButton = container.querySelector('.freeze-chart') as HTMLElement;
    const freezeIcon = freezeButton?.querySelector('i');
    
    if (freezeButton && freezeIcon) {
        const isFrozen = chartFreezeState.get(chartId)?.isFrozen || false;
        
        if (isFrozen) {
            freezeIcon.className = 'bi bi-pause-circle-fill';
            freezeButton.title = 'चार्ट अनफ्रीज करें';
            freezeButton.classList.remove('btn-outline-warning');
            freezeButton.classList.add('btn-warning');
        } else {
            freezeIcon.className = 'bi bi-pause-circle';
            freezeButton.title = 'चार्ट फ्रीज करें';
            freezeButton.classList.remove('btn-warning');
            freezeButton.classList.add('btn-outline-warning');
        }
    }
}

/**
 * शहर फिल्टर सेटिंग्स को अपडेट करता है
 */
export function updateCityFilterSettings(): void {
    try {
        const cityFilterEnabled = (document.getElementById('cityFilterEnabled') as HTMLInputElement)?.checked || false;
        const cityFilterSelect = document.getElementById('cityFilterSelect') as HTMLSelectElement;
        
        if (!cityFilterSelect) return;
        
        const selectedCities = Array.from(cityFilterSelect.selectedOptions).map(option => option.value);
        
        cityFilterState = {
            enabled: cityFilterEnabled,
            selectedCities: selectedCities
        };
        
        console.log("City filter updated:", cityFilterState);
        dataCache.clear(); // Clear cache when filters change
        plotAll();
    } catch (error) {
        console.error("Error updating city filter:", error);
        showMessage("शहर फिल्टर अपडेट करने में त्रुटि", "danger");
    }
}

/**
 * शहर फिल्टर ड्रॉपडाउन को भरता है
 */
export function populateCityFilter(): void {
    try {
        const cityFilterSelect = document.getElementById('cityFilterSelect') as HTMLSelectElement;
        if (!cityFilterSelect || !filteredData || filteredData.length === 0) return;
        
        const allCities = new Set<string>();
        filteredData.forEach((row: any) => {
            Object.values(row).forEach(value => {
                if (typeof value === 'string' && value.trim() !== '') {
                    allCities.add(value.trim());
                }
            });
        });
        
        cityFilterSelect.innerHTML = '';
        Array.from(allCities).sort().forEach(city => {
            const option = document.createElement('option');
            option.value = city;
            option.textContent = city;
            option.selected = cityFilterState.selectedCities.includes(city);
            cityFilterSelect.appendChild(option);
        });
        
        console.log(`Populated city filter with ${allCities.size} cities`);
    } catch (error) {
        console.error("Error populating city filter:", error);
    }
}

/**
 * डेटा को शहर फिल्टर के आधार पर फिल्टर करता है
 */
function getFilteredDataByCities(data: any[]): any[] {
    if (!cityFilterState.enabled || cityFilterState.selectedCities.length === 0) {
        return data;
    }
    
    const filtered = data.filter(row => {
        return Object.values(row).some(value => 
            cityFilterState.selectedCities.includes(String(value).trim())
        );
    });
    
    console.log(`City filter applied: ${filtered.length} records out of ${data.length}`);
    return filtered;
}

/**
 * डेटा को विशिष्ट चार्ट फिल्टर के आधार पर फिल्टर करता है
 */
function getFilteredDataByChart(data: any[], chartConfig: ChartConfig): any[] {
    try {
        let currentData = data;

        // 1. City Filter (Global)
        currentData = getFilteredDataByCities(currentData);
        
        // 2. Chart Specific Filters (Internal)
        if (chartConfig.filters && chartConfig.filters.length > 0) {
            chartConfig.filters.forEach(filter => {
                if (filter.selectedValues && filter.selectedValues.length > 0) {
                    const columnName = filter.columnName;
                    currentData = currentData.filter(row => 
                        filter.selectedValues.includes(String(row[columnName]).trim())
                    );
                }
            });
        }

        // 3. Row Limit Filter (User selected rows count)
        if (chartConfig.dataRowLimit && chartConfig.dataRowLimit !== 'all') {
            const limit = typeof chartConfig.dataRowLimit === 'number'
                ? chartConfig.dataRowLimit
                : parseInt(String(chartConfig.dataRowLimit), 10);
            if (!isNaN(limit) && limit > 0 && currentData.length > limit) {
                currentData = currentData.slice(0, limit);
            }
        }

        return currentData;
        
    } catch (error) {
        console.error("Error filtering chart data:", error);
        return data;
    }
}

/**
 * एक विशिष्ट चार्ट को हटाता है और प्रदर्शन को अपडेट करता है
 */
export async function clearChart(chartId: string): Promise<void> {
    try {
        console.log("Clearing chart with ID:", chartId);
        
        const chartContainer = document.getElementById(`container-${chartId}`) as any;
        if (!chartContainer) {
            console.warn(`Container not found: container-${chartId}`);
            return;
        }

        // Event listeners remove करें
        if (chartContainer._listeners) {
            Object.keys(chartContainer._listeners).forEach(event => {
                chartContainer.removeEventListener(event, chartContainer._listeners[event]);
            });
        }

        // ECharts instance dispose
        const chartDom = document.getElementById(chartId);
        if (chartDom) {
            const chartInstance = echarts.getInstanceByDom(chartDom);
            if (chartInstance && !chartInstance.isDisposed) {
                chartInstance.dispose();
            } else {
                try {
                    Plotly.purge(chartDom);
                } catch (e) {
                    // Not a Plotly chart
                }
            }
        }

        // Moveable destroy
        if (chartContainer.moveable) {
            chartContainer.moveable.destroy();
            chartContainer.moveable = null;
        }

        // Freeze state clean up
        chartFreezeState.delete(chartId);

        // Button permissions clean up
        chartButtonPermissions.delete(chartId);

        // Arrays से remove
        visualizations = visualizations.filter(v => v.id !== chartId);
        const instanceIndex = allActiveChartInstances.findIndex((instance: any) => 
            instance._dom?.id === chartId
        );
        if (instanceIndex > -1) {
            allActiveChartInstances.splice(instanceIndex, 1);
        }

        // DOM से remove
        chartContainer.remove();

        await saveDashboardSettings();
        console.log("Chart successfully cleared:", chartId);
        
    } catch (error) {
        console.error("Error clearing chart:", error);
        showMessage("चार्ट हटाने में त्रुटि", "danger");
    }
}

/**
 * Duplicates an existing chart or template card
 */
export async function duplicateChart(chartId: string): Promise<void> {
    try {
        const original = visualizations.find(v => v.id === chartId);
        if (!original) {
            showMessage("डुप्लिकेट करने के लिए विज़ुअलाइज़ेशन नहीं मिला", "warning");
            return;
        }

        const newId = `chart-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
        const cloned: ChartConfig = JSON.parse(JSON.stringify(original));
        cloned.id = newId;

        const topNum = parseFloat(original.position?.top || '80') + 30;
        const leftNum = parseFloat(original.position?.left || '80') + 30;
        cloned.position = { top: `${topNum}px`, left: `${leftNum}px` };

        visualizations.push(cloned);
        await plotChart(cloned);
        await saveDashboardSettings();
        showMessage("कार्ड सफलतापूर्वक डुप्लिकेट किया गया!", "success");
    } catch (err) {
        console.error("Error duplicating chart:", err);
        showMessage("कार्ड डुप्लिकेट करने में त्रुटि", "danger");
    }
}

/**
 * चार्ट कॉन्फ़िगरेशन बनाता है
 */
async function createChartConfig(xAxisCol: string, yAxisCols: string[], zAxisCol?: string | null, fallbackType = 'bar', fallbackTitle = 'चार्ट', fallbackColor = '#5470C6'): Promise<ChartConfig> {
    const chartType = (document.getElementById('chartType') as HTMLSelectElement)?.value || fallbackType;
    const color = (document.getElementById('colorPicker') as HTMLInputElement)?.value || fallbackColor;
    const chartTitle = (document.getElementById('chartTitle') as HTMLInputElement)?.value || fallbackTitle;
    const xAxisLabel = (document.getElementById('xAxisLabel') as HTMLInputElement)?.value || xAxisCol;
    const yAxisLabel = (document.getElementById('yAxisLabel') as HTMLInputElement)?.value || yAxisCols.join(', ');
    const customShapeUrl = (document.getElementById('customShapeUrl') as HTMLInputElement)?.value || '';

    if (!chartType) {
        throw new Error("चार्ट प्रकार आवश्यक है");
    }

    // Position calculation
    const dashboardContent = document.getElementById('dashboardContent');
    let newTop = 20;
    let newLeft = 20;
    
    if (visualizations.length > 0) {
        let maxRight = 0;
        let lowestTop = 0;
        visualizations.forEach(viz => {
            const vizLeft = parseFloat(viz.position?.left || '0') || 0;
            const vizWidth = parseFloat(viz.size?.width || '600') || 600;
            const vizTop = parseFloat(viz.position?.top || '0') || 0;
            if (vizLeft + vizWidth > maxRight) {
                maxRight = vizLeft + vizWidth;
                lowestTop = vizTop;
            }
        });
        
        const dashboardRect = dashboardContent ? dashboardContent.getBoundingClientRect() : { width: 1000 };
        newLeft = maxRight + 50;
        newTop = lowestTop;
        
        if (newLeft + 650 > dashboardRect.width) {
            let maxBottom = 0;
            visualizations.forEach(viz => {
                const vizTop = parseFloat(viz.position?.top || '0') || 0;
                const vizHeight = parseFloat(viz.size?.height || '400') || 400;
                if (vizTop + vizHeight > maxBottom) {
                    maxBottom = vizTop + vizHeight;
                }
            });
            newLeft = 20;
            newTop = maxBottom + 20;
        }
    }
    
    const columnsForChart = [xAxisCol, ...yAxisCols];
    if (zAxisCol) {
        columnsForChart.push(zAxisCol);
    }
    
    const rowLimitStr = (document.getElementById('chartDataRowLimit') as HTMLSelectElement)?.value || 'all';
    const parsedRowLimit = rowLimitStr === 'all' ? 'all' : parseInt(rowLimitStr, 10);
    const dataRowLimit = (typeof parsedRowLimit === 'number' && !isNaN(parsedRowLimit)) ? parsedRowLimit : 'all';

    return {
        id: `chart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: chartType,
        color: color,
        title: chartTitle,
        xAxisLabel: xAxisLabel,
        yAxisLabel: yAxisLabel,
        zAxisLabel: zAxisCol || '',
        customShape: customShapeUrl,
        columns: columnsForChart.filter(c => c),
        position: { top: `${newTop}px`, left: `${newLeft}px` },
        size: { width: `600px`, height: `400px` },
        filters: [],
        dataRowLimit: dataRowLimit
    };
}

/**
 * चार्ट प्रकार के लिए वैलिडेशन
 */
function validateChartType(chartType: string, xAxisCol: string, yAxisCols: string[], zAxisCol?: string | null): void {
    switch (chartType) {
        case 'pie':
        case 'doughnut':
        case 'rose-radius':
        case 'rose-area':
        case 'funnel':
        case 'gauge':
        case 'waterfall':
        case 'heatmap':
        case 'sankey':
        case 'bullet':
        case 'boxplot':
            if (!xAxisCol || !yAxisCols || yAxisCols.length === 0) {
                throw new Error("इस चार्ट प्रकार के लिए एक लेबल कॉलम और कम से कम एक मान कॉलम चुनें।");
            }
            break;
            
        case 'scatter':
        case 'bubble':
            if (!xAxisCol || yAxisCols.length === 0) {
                throw new Error("स्कैटर/बबल चार्ट के लिए X-अक्ष और Y-अक्ष कॉलम चुनें।");
            }
            if (chartType === 'bubble' && yAxisCols.length < 2) {
                throw new Error("बबल चार्ट के लिए कम से कम दो मान कॉलम (Y-अक्ष और आकार के लिए) चुनें।");
            }
            break;
            
        case 'treemap':
            if (yAxisCols.length < 1) {
                throw new Error("ट्रीमैप के लिए एक लेबल कॉलम और एक मान कॉलम चुनें।");
            }
            break;
            
        case 'radar':
            if (yAxisCols.length === 0) {
                throw new Error("राडार चार्ट के लिए कम से कम एक मान कॉलम चुनें।");
            }
            break;
            
        case 'candlestick':
        case 'ohlc':
            if (yAxisCols.length < 4) {
                throw new Error("इस चार्ट के लिए 4 मान कॉलम (open, close, low, high) चुनें।");
            }
            break;
            
        case 'bar3D':
        case 'bar3d':
        case '3d-bar':
        case '3D-bar':
        case 'line3D':
        case 'line3d':
        case '3d-line':
        case '3D-line':
            if (!xAxisCol || !yAxisCols || yAxisCols.length === 0) {
                throw new Error("3D बार/लाइन चार्ट के लिए X-अक्ष और Y-अक्ष कॉलम चुनें।");
            }
            break;
            
        default:
            if (!xAxisCol) {
                throw new Error("कृपया X-अक्ष कॉलम चुनें।");
            }
    }
}

/**
 * नया विज़ुअलाइज़ेशन कॉन्फ़िगरेशन जोड़ता है और उसे तुरंत प्लॉट करता है
 */
export async function addVisualization(xAxisCol: string, yAxisCols: string[], zAxisCol?: string | null, overrideType: string | null = null, overrideTitle: string | null = null): Promise<void> {
    try {
        // Input validation
        if (!ChartUtils.validateInput(xAxisCol, yAxisCols)) {
            return;
        }

        const chartType = overrideType || (document.getElementById('chartType') as HTMLSelectElement)?.value;
        if (!chartType) {
            showMessage("कृपया चार्ट प्रकार चुनें।", "warning");
            return;
        }

        // Chart type validation
        validateChartType(chartType, xAxisCol, yAxisCols, zAxisCol);

        if (window.editingChartId) {
            // Edit mode: find existing config
            const index = visualizations.findIndex(v => v.id === window.editingChartId);
            if (index !== -1) {
                const oldConfig = visualizations[index];
                
                // Update properties
                oldConfig.type = chartType;
                oldConfig.xAxis = xAxisCol;
                oldConfig.yAxes = yAxisCols;
                oldConfig.zAxis = zAxisCol;
                oldConfig.color = (document.getElementById('colorPicker') as HTMLInputElement)?.value || '#5470C6';
                oldConfig.title = overrideTitle || (document.getElementById('chartTitle') as HTMLInputElement)?.value || `${chartType.toUpperCase()} - ${xAxisCol}`;
                oldConfig.xAxisLabel = (document.getElementById('xAxisLabel') as HTMLInputElement)?.value || xAxisCol;
                oldConfig.yAxisLabel = (document.getElementById('yAxisLabel') as HTMLInputElement)?.value || yAxisCols.join(', ');

                const rowLimitStr = (document.getElementById('chartDataRowLimit') as HTMLSelectElement)?.value || 'all';
                const parsedRowLimit = rowLimitStr === 'all' ? 'all' : parseInt(rowLimitStr, 10);
                oldConfig.dataRowLimit = (typeof parsedRowLimit === 'number' && !isNaN(parsedRowLimit)) ? parsedRowLimit : 'all';

                const columnsForChart = [xAxisCol, ...yAxisCols];
                if (zAxisCol) {
                    columnsForChart.push(zAxisCol);
                }
                oldConfig.columns = columnsForChart.filter(c => c);

                // Save to local storage
                await saveDashboardSettings();
                
                // Replot using the updated configuration
                await plotChart(oldConfig);

                showMessage("विज़ुअलाइज़ेशन सफलतापूर्वक अपडेट किया गया!", "success");
                exitEditMode();
                return;
            }
        }

        if (window.activePreviewChartId) {
            const index = visualizations.findIndex(v => v.id === window.activePreviewChartId);
            if (index !== -1) {
                const previewConfig = visualizations[index];
                
                // Finalize it by removing preview flag
                previewConfig.isPreview = false;
                
                // Update final inputs
                previewConfig.type = chartType;
                previewConfig.color = (document.getElementById('colorPicker') as HTMLInputElement)?.value || previewConfig.color;
                previewConfig.title = overrideTitle || (document.getElementById('chartTitle') as HTMLInputElement)?.value || previewConfig.title;
                previewConfig.xAxisLabel = (document.getElementById('xAxisLabel') as HTMLInputElement)?.value || xAxisCol;
                previewConfig.yAxisLabel = (document.getElementById('yAxisLabel') as HTMLInputElement)?.value || yAxisCols.join(', ');
                
                const previewRowLimitStr = (document.getElementById('chartDataRowLimit') as HTMLSelectElement)?.value || 'all';
                const parsedPreviewRowLimit = previewRowLimitStr === 'all' ? 'all' : parseInt(previewRowLimitStr, 10);
                previewConfig.dataRowLimit = (typeof parsedPreviewRowLimit === 'number' && !isNaN(parsedPreviewRowLimit)) ? parsedPreviewRowLimit : 'all';
                
                const columnsForChart = [xAxisCol, ...yAxisCols];
                if (zAxisCol) {
                    columnsForChart.push(zAxisCol);
                }
                previewConfig.columns = columnsForChart.filter(c => c);
                
                // Disconnect preview ID so it is now permanent
                window.activePreviewChartId = null;
                
                await saveDashboardSettings();
                await plotChart(previewConfig);
                
                showMessage("नया विज़ुअलाइज़ेशन सफलतापूर्वक जोड़ा गया!", "success");
                exitEditMode();
                
                // Close offcanvas
                const offcanvasSidebar = document.getElementById('offcanvasSidebar');
                if (offcanvasSidebar && typeof bootstrap !== 'undefined') {
                    const bsOffcanvas = bootstrap.Offcanvas.getInstance(offcanvasSidebar);
                    if (bsOffcanvas) bsOffcanvas.hide();
                }
                return;
            }
        }

        const chartConfig = await createChartConfig(xAxisCol, yAxisCols, zAxisCol, overrideType || 'bar', overrideTitle || 'चार्ट');
        if (overrideType) {
            chartConfig.type = overrideType;
        }
        if (overrideTitle) {
            chartConfig.title = overrideTitle;
        }
        visualizations.push(chartConfig);
        
        await saveDashboardSettings();
        await plotChart(chartConfig);
        
        showMessage("नया विज़ुअलाइज़ेशन सफलतापूर्वक जोड़ा गया!", "success");
        
    } catch (error: any) {
        console.error("Error adding/updating visualization:", error);
        showMessage(error.message || "विज़ुअलाइज़ेशन प्रोसेस करने में त्रुटि", "danger");
    }
}

/**
 * चार्ट पिन/अनपिन स्थिति को टॉगल करता है
 */
export async function toggleChartPin(chartId: string): Promise<void> {
    try {
        const chartConfig = visualizations.find(v => v.id === chartId);
        if (!chartConfig) return;

        chartConfig.pinned = !chartConfig.pinned;
        showMessage(chartConfig.pinned ? `चार्ट "${chartConfig.title}" पिन (लॉक्ड) किया गया!` : `चार्ट "${chartConfig.title}" अनपिन किया गया!`, "success");

        await saveDashboardSettings();
        await plotChart(chartConfig);
    } catch (error) {
        console.error("Error in toggleChartPin:", error);
    }
}

/**
 * चार्ट के लिए बटन लिसनर्स जोड़ता है
 */
export function addChartButtonListeners(container: HTMLElement | any, chartConfig: ChartConfig): void {
    const listeners = {
        // Delete chart button
        deleteChart: (e: Event) => {
            e.preventDefault();
            e.stopPropagation();
            clearChart((e.currentTarget as HTMLElement).dataset.chartId || '');
        },
        
        // AI advice button
        aiAdvice: (e: Event) => {
            e.preventDefault();
            e.stopPropagation();
            const id = (e.currentTarget as HTMLElement).dataset.chartId || '';
            const chartDivToAdvise = document.getElementById(id);
            const title = container.querySelector('.chart-title')?.textContent || '';
            if (chartDivToAdvise) {
                getAiChartAdvice(chartDivToAdvise, title);
            }
        },
        
        // Fullscreen button
        fullscreen: (e: Event) => {
            e.preventDefault();
            e.stopPropagation();
            const id = (e.currentTarget as HTMLElement).dataset.chartId || '';
            const chartDom = document.getElementById(id);
            toggleFullscreen(chartDom);
        },
        
        // Edit button
        editChart: (e: Event) => {
            e.preventDefault();
            e.stopPropagation();
            const id = (e.currentTarget as HTMLElement).dataset.chartId || '';
            editChart(id);
        },
        
        // Filter button
        filterChart: (e: Event) => {
            e.preventDefault();
            e.stopPropagation();
            const id = (e.currentTarget as HTMLElement).dataset.chartId || '';
            handleChartFilterClick(id);
        },
        
        // Freeze button
        freezeChart: (e: Event) => {
            e.preventDefault();
            e.stopPropagation();
            const id = (e.currentTarget as HTMLElement).dataset.chartId || '';
            toggleChartFreeze(id);
        },
        
        // Permissions button
        permissions: (e: Event) => {
            e.preventDefault();
            e.stopPropagation();
            const id = (e.currentTarget as HTMLElement).dataset.chartId || '';
            showChartButtonPermissionsPopup(id);
        },
        
        // Pin button
        pinChart: (e: Event) => {
            e.preventDefault();
            e.stopPropagation();
            const id = (e.currentTarget as HTMLElement).dataset.chartId || '';
            toggleChartPin(id);
        },

        // Snapshot button
        snapshotChart: (e: Event) => {
            e.preventDefault();
            e.stopPropagation();
            const id = (e.currentTarget as HTMLElement).dataset.chartId || '';
            captureChartSnapshot(id);
        },

        // Duplicate button
        duplicateChart: (e: Event) => {
            e.preventDefault();
            e.stopPropagation();
            const id = (e.currentTarget as HTMLElement).dataset.chartId || '';
            duplicateChart(id);
        },

        // Move to tab button
        moveToTab: async (e: Event) => {
            e.preventDefault();
            e.stopPropagation();
            const id = (e.currentTarget as HTMLElement).dataset.chartId || '';
            try {
                const { promptMoveChartToTab } = await import('../layout/multiDashboard.ts');
                promptMoveChartToTab(id);
            } catch (err) {
                console.error("Could not open move chart to tab dialog:", err);
            }
        }
    };

    // Add event listeners
    const deleteBtn = container.querySelector('.delete-chart');
    const aiAdviceBtn = container.querySelector('.get-ai-advice');
    const fullscreenBtn = container.querySelector('.fullscreen-chart');
    const editBtn = container.querySelector('.edit-chart');
    const filterBtn = container.querySelector('.chart-filter-btn');
    const freezeBtn = container.querySelector('.freeze-chart');
    const permissionsBtn = container.querySelector('.chart-permissions-btn');
    const pinBtn = container.querySelector('.pin-chart');
    const snapshotBtn = container.querySelector('.snapshot-chart');
    const duplicateBtn = container.querySelector('.duplicate-chart');
    const moveToTabBtn = container.querySelector('.move-to-tab-chart');

    if (deleteBtn) deleteBtn.addEventListener('click', listeners.deleteChart);
    if (aiAdviceBtn) aiAdviceBtn.addEventListener('click', listeners.aiAdvice);
    if (fullscreenBtn) fullscreenBtn.addEventListener('click', listeners.fullscreen);
    if (editBtn) editBtn.addEventListener('click', listeners.editChart);
    if (filterBtn) filterBtn.addEventListener('click', listeners.filterChart);
    if (freezeBtn) freezeBtn.addEventListener('click', listeners.freezeChart);
    if (permissionsBtn) permissionsBtn.addEventListener('click', listeners.permissions);
    if (pinBtn) pinBtn.addEventListener('click', listeners.pinChart);
    if (snapshotBtn) snapshotBtn.addEventListener('click', listeners.snapshotChart);
    if (duplicateBtn) duplicateBtn.addEventListener('click', listeners.duplicateChart);
    if (moveToTabBtn) moveToTabBtn.addEventListener('click', listeners.moveToTab);

    // Switch dataset buttons
    container.querySelectorAll('.switch-chart-dataset').forEach((btn: HTMLElement) => {
        btn.addEventListener('click', async (e: Event) => {
            e.preventDefault();
            e.stopPropagation();
            const cId = btn.dataset.chartId;
            const dsId = btn.dataset.datasetId;
            const dsName = btn.dataset.datasetName;
            const config = visualizations.find(v => v.id === cId);
            if (config && dsId) {
                config.datasetId = dsId;
                config.datasetName = dsName;
                clearDataCache();
                plotChart(config);
                await saveDashboardSettings();
                showMessage(`चार्ट डेटासेट को '${dsName}' पर स्विच कर दिया गया है।`, "success");
            }
        });
    });

    // Store listeners for cleanup
    container._listeners = listeners;

    // Set up auto-hide for menu after 30 seconds of inactivity
    setupChartMenuTimeout(container);
}

/**
 * 30 सेकंड के बाद चार्ट कंटेनर के मेनू (buttons) को ऑटो-हाइड करने के लिए।
 */
export function setupChartMenuTimeout(container: HTMLElement | any): void {
    if (!container) return;

    // पुराने टाइमर को साफ़ करें
    if (container._menuTimeoutId) {
        clearTimeout(container._menuTimeoutId);
    }

    const chartButtons = container.querySelector('.chart-buttons');
    if (!chartButtons) return;

    // ECharts इंस्टेंस प्राप्त करने के लिए हेल्पर फ़ंक्शन
    const getEChartsInstance = () => {
        const chartId = container.id.replace('container-', '');
        const innerChart: any = document.getElementById(chartId) || container.querySelector('.chart-canvas');
        if (innerChart) {
            if (innerChart.__echarts__) {
                return innerChart.__echarts__;
            } else if (typeof echarts !== 'undefined' && echarts.getInstanceByDom) {
                return echarts.getInstanceByDom(innerChart);
            }
        }
        return null;
    };

    const showMenu = () => {
        // 1. मुख्य बटन दिखाएं
        chartButtons.classList.remove('menu-hidden');

        // 2. Plotly मोडबार (यदि मौजूद हो) दिखाएं
        container.querySelectorAll('.modebar').forEach((el: HTMLElement) => {
            el.style.opacity = '1';
            el.style.pointerEvents = 'auto';
            el.style.visibility = 'visible';
        });

        // 3. ECharts टूलबॉक्स (यदि मौजूद हो) दिखाएं
        const activeECharts = getEChartsInstance();
        if (activeECharts && chartGlobalSettings?.showToolbox) {
            try {
                activeECharts.setOption({
                    toolbox: {
                        show: true
                    }
                }, false);
            } catch (e) {
                console.warn('ECharts toolbox show error:', e);
            }
        }

        // पुराने टाइमर को फिर से साफ़ करें
        if (container._menuTimeoutId) {
            clearTimeout(container._menuTimeoutId);
        }

        // 30 सेकंड (30000ms) की पूर्ण निष्क्रियता के बाद हाइड करें
        container._menuTimeoutId = setTimeout(() => {
            // केवल तभी हाइड करें जब कोई ड्रॉपडाउन मेनू खुला न हो
            const hasOpenDropdown = container.querySelector('.dropdown-menu.show') || 
                                    container.querySelector('.show');
            if (!hasOpenDropdown) {
                // 1. मुख्य बटन छुपाएं
                chartButtons.classList.add('menu-hidden');

                // 2. Plotly मोडबार छुपाएं
                container.querySelectorAll('.modebar').forEach((el: HTMLElement) => {
                    el.style.opacity = '0';
                    el.style.pointerEvents = 'none';
                    el.style.visibility = 'hidden';
                    el.style.transition = 'opacity 0.3s ease, visibility 0.3s ease';
                });

                // 3. ECharts टूलबॉक्स छुपाएं
                const activeECharts = getEChartsInstance();
                if (activeECharts && chartGlobalSettings?.showToolbox) {
                    try {
                        activeECharts.setOption({
                            toolbox: {
                                show: false
                            }
                        }, false);
                    } catch (e) {
                        console.warn('ECharts toolbox hide error:', e);
                    }
                }
            } else {
                // यदि ड्रॉपडाउन खुला है, तो थोड़ी देर बाद फिर से प्रयास करें
                container._menuTimeoutId = setTimeout(showMenu, 10000);
            }
        }, 30000);
    };

    // शुरू में मेनू दिखाएं और टाइमर शुरू करें
    showMenu();

    // जब भी यूजर चार्ट पर क्लिक, टच, मूस-डाउन या होवर करे
    const interactionEvents = ['mousedown', 'touchstart', 'click', 'pointerdown', 'mouseenter', 'mousemove'];
    
    const resetHandler = (e: Event) => {
        showMenu();
    };

    interactionEvents.forEach(event => {
        container.addEventListener(event, resetHandler, { passive: true });
    });

    // रीसेट हैंडलर को कंटेनर पर स्टोर करें ताकि ड्रैग-ड्रॉप मॉड्यूल भी इसका उपयोग कर सके
    container.resetMenuTimeout = resetHandler;

    // पुराना _listeners ऑब्जेक्ट सुरक्षित रखें और उसमें हमारे हैंडलर्स जोड़ें
    if (!container._listeners) {
        container._listeners = {};
    }
    container._listeners['menu-reset'] = resetHandler;
}

/**
 * Plotly चार्ट के लिए बटन लिसनर्स जोड़ता है
 */
function addPlotlyButtonListeners(container: HTMLElement, chartConfig: ChartConfig): void {
    const chartDom = document.getElementById(chartConfig.id);
    if (!chartDom) return;

    setTimeout(() => {
        // Zoom button
        container.querySelector('.plotly-zoom')?.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            Plotly.relayout(chartDom, {'dragmode': 'zoom'});
        });
        
        // Pan button
        container.querySelector('.plotly-pan')?.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            Plotly.relayout(chartDom, {'dragmode': 'pan'});
        });
        
        // Reset button
        container.querySelector('.plotly-reset')?.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            Plotly.relayout(chartDom, {
                'xaxis.autorange': true,
                'yaxis.autorange': true
            });
        });
        
        // Download button for Plotly
        container.querySelector('.download-chart')?.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            Plotly.downloadImage(chartDom, {
                format: 'png',
                filename: chartConfig.title,
                height: 600,
                width: 800
            });
        });
    }, 500);
}

const alertedThresholdBreachesSet = new Set<string>();

/**
 * Monitors threshold & danger zone breaches for charts & KPI metrics.
 */
export function evaluateChartThresholdBreaches(chartConfig: ChartConfig, chartData: any[]): void {
    if (!chartConfig || !chartData || !Array.isArray(chartData) || chartData.length === 0) return;

    const threshold = chartConfig.threshold || chartGlobalSettings.threshold;
    if (!threshold || (!threshold.enable && !threshold.enableZone)) return;

    const containerEl = document.getElementById(`container-${chartConfig.id}`);
    if (!containerEl) return;

    let isBreached = false;
    let maxBreachVal: number | null = null;
    let limitDesc = '';

    const yKey = chartConfig.xAxis; // or yAxes

    // 1. Check Target Threshold Line
    if (threshold.enable && threshold.value !== undefined && threshold.value !== '' && !isNaN(Number(threshold.value))) {
        const targetVal = Number(threshold.value);
        for (const row of chartData) {
            let val: number | undefined = undefined;
            if (yKey && row[yKey] !== undefined) {
                val = Number(row[yKey]);
            } else if (row.value !== undefined) {
                val = Number(row.value);
            } else if (row.y !== undefined) {
                val = Number(row.y);
            } else {
                const keys = Object.keys(row);
                for (const k of keys) {
                    const num = Number(row[k]);
                    if (!isNaN(num) && num > 0) { val = num; break; }
                }
            }

            if (val !== undefined && !isNaN(val) && val >= targetVal) {
                isBreached = true;
                if (maxBreachVal === null || val > maxBreachVal) maxBreachVal = val;
                limitDesc = `थ्रेशोल्ड टारगेट ≥ ${targetVal}`;
            }
        }
    }

    // 2. Check Danger Zone Range
    if (!isBreached && threshold.enableZone && threshold.zoneMin !== undefined && threshold.zoneMax !== undefined && threshold.zoneMin !== '' && threshold.zoneMax !== '') {
        const minVal = Number(threshold.zoneMin);
        const maxVal = Number(threshold.zoneMax);
        if (!isNaN(minVal) && !isNaN(maxVal)) {
            for (const row of chartData) {
                let val: number | undefined = undefined;
                if (yKey && row[yKey] !== undefined) {
                    val = Number(row[yKey]);
                } else if (row.value !== undefined) {
                    val = Number(row.value);
                } else if (row.y !== undefined) {
                    val = Number(row.y);
                }

                if (val !== undefined && !isNaN(val) && val >= minVal && val <= maxVal) {
                    isBreached = true;
                    if (maxBreachVal === null || val > maxBreachVal) maxBreachVal = val;
                    limitDesc = `डेंजर ज़ोन (${minVal} - ${maxVal})`;
                }
            }
        }
    }

    // Apply or remove threshold breach highlight & notification
    let breachBadge = containerEl.querySelector('.threshold-breach-badge');

    if (isBreached) {
        containerEl.style.setProperty('border', '2px dashed #ef4444', 'important');
        containerEl.style.setProperty('box-shadow', '0 0 16px rgba(239, 68, 68, 0.45)', 'important');
        containerEl.style.setProperty('background-color', 'rgba(254, 242, 242, 0.4)', 'important');
        containerEl.classList.add('threshold-breached-card');

        if (!breachBadge) {
            const badgeDiv = document.createElement('div');
            badgeDiv.className = 'threshold-breach-badge position-absolute top-0 start-0 m-2 z-index-10';
            badgeDiv.innerHTML = `<span class="badge bg-danger text-white border border-light shadow-sm py-1 px-2" style="font-size: 0.7rem;"><i class="bi bi-exclamation-triangle-fill me-1"></i> थ्रेशोल्ड ब्रीच (${maxBreachVal})</span>`;
            containerEl.appendChild(badgeDiv);
        } else {
            breachBadge.innerHTML = `<span class="badge bg-danger text-white border border-light shadow-sm py-1 px-2" style="font-size: 0.7rem;"><i class="bi bi-exclamation-triangle-fill me-1"></i> थ्रेशोल्ड ब्रीच (${maxBreachVal})</span>`;
        }

        const alertKey = `${chartConfig.id}_${maxBreachVal}_${limitDesc}`;
        if (!alertedThresholdBreachesSet.has(alertKey)) {
            alertedThresholdBreachesSet.add(alertKey);
            showMessage(`⚠️ थ्रेशोल्ड ब्रीच: '${chartConfig.title || 'चार्ट'}' का मान (${maxBreachVal}) ने डेंजर ज़ोन (${limitDesc}) पार कर लिया है!`, "danger");
        }
    } else {
        containerEl.style.removeProperty('border');
        containerEl.style.removeProperty('box-shadow');
        containerEl.style.removeProperty('background-color');
        containerEl.classList.remove('threshold-breached-card');
        if (breachBadge) breachBadge.remove();
    }
}

/**
 * दिए गए चार्ट कॉन्फ़िग और डेटा के आधार पर चार्ट प्लॉट करता है
 */
export async function plotChart(chartConfig: ChartConfig): Promise<void> {
    try {
        console.log("Plotting chart:", chartConfig.id);
        const containerToAppendTo = getDashboardContainer();
        if (!containerToAppendTo) {
            console.warn("plotChart: Dashboard container not present on the current page. Skipping.");
            return;
        }
        
        if (chartConfig.type === 'kpi_sparkline') {
            // Remove existing container
            let existingContainer = document.getElementById(`container-${chartConfig.id}`) as any;
            if (existingContainer) {
                if (existingContainer.moveable) {
                    existingContainer.moveable.destroy();
                }
                existingContainer.remove();
            }
            
            // Create custom container and render natively
            const mod = await import('./kpiSparklines.js');
            const chartContainer = mod.createKpiContainerElement(chartConfig);
            mod.renderCustomKpiCard(chartContainer, chartConfig, mod.generateKpiButtonsHTML(chartConfig));
            
            containerToAppendTo.appendChild(chartContainer);
            
            // Initialize drag and resize natively
            initializeDragAndResize(chartContainer);
            
            // Bind buttons listeners
            addChartButtonListeners(chartContainer, chartConfig);
            return;
        }

        if (chartConfig.type === 'template_card') {
            const mod = await import('./templateCards.ts');
            // Check if container already exists
            let existingContainer = document.getElementById(`container-${chartConfig.id}`) as any;
            if (existingContainer) {
                // Smooth in-place dynamic formula evaluation & re-render without tearing down handles
                mod.renderTemplateCard(existingContainer, chartConfig);
                return;
            }

            // Create template container and render synchronously into the DOM
            const chartContainer = mod.createTemplateContainerElement(chartConfig);
            containerToAppendTo.appendChild(chartContainer);
            mod.renderTemplateCard(chartContainer, chartConfig);

            // Initialize drag and resize natively with chart container logic
            (chartContainer as any).moveable = initializeDragAndResize(chartContainer);
            return;
        }
        
        // Validation
        if (!ChartUtils.validateChartConfig(chartConfig)) {
            throw new Error(ERROR_MESSAGES.INVALID_CONFIG);
        }

        // Remove existing container
        let existingContainer = document.getElementById(`container-${chartConfig.id}`) as any;
        if (existingContainer) {
            if (existingContainer.moveable) {
                existingContainer.moveable.destroy();
            }
            if (existingContainer._listeners) {
                Object.keys(existingContainer._listeners).forEach(event => {
                    existingContainer.removeEventListener(event, existingContainer._listeners[event]);
                });
            }
            existingContainer.remove();
        }
        
        // Create new container
        const chartContainer: any = ChartUtils.createContainerElement(chartConfig);
        const isPlotlyChart = ['candlestick', 'ohlc'].includes(chartConfig.type);
        
        // City filter status
        const cityFilterStatus = cityFilterState.enabled && cityFilterState.selectedCities.length > 0 
            ? `<div class="city-filter-status position-absolute top-0 start-0 p-2">
                 <span class="badge bg-info" title="Selected cities: ${cityFilterState.selectedCities.join(', ')}">
                     <i class="bi bi-filter"></i> ${cityFilterState.selectedCities.length} Global
                 </span>
               </div>`
            : '';

        // Freeze status
        const isFrozen = chartFreezeState.get(chartConfig.id)?.isFrozen || false;
        const freezeStatus = isFrozen 
            ? `<div class="freeze-status position-absolute top-0 start-50 translate-middle-x p-2">
                 <span class="badge bg-warning text-dark" title="चार्ट फ्रीज किया गया - डेटा अपडेट नहीं होगा">
                     <i class="bi bi-pause-circle-fill"></i>
                 </span>
               </div>`
            : '';
        
        // Generate buttons based on permissions
        const chartButtonsHTML = generateChartButtonsHTML(chartConfig);

        const customShapeHtml = chartConfig.customShape
            ? `<div class="chart-custom-shape position-absolute" style="z-index: 101; pointer-events: none; top: 10px; left: 10px;">
                    <img src="${chartConfig.customShape}" alt="कस्टम शेप" style="width: 50px; height: 50px;">
               </div>`
            : '';
        
        const annotationsHTML = renderChartAnnotations(chartConfig);
        const canvasHeight = annotationsHTML ? 'calc(100% - 85px)' : 'calc(100% - 42px)';

        chartContainer.innerHTML = `
            ${customShapeHtml}
            <div class="chart-card-header d-flex align-items-center justify-content-between">
                <div class="d-flex align-items-center gap-1.5 me-2 overflow-hidden flex-grow-1">
                    <span class="drag-grip text-muted" style="cursor: grab;" title="ड्रैग करने के लिए यहाँ पकड़े">
                        <i class="bi bi-grip-vertical"></i>
                    </span>
                    <h5 class="chart-title mb-0 text-truncate font-semibold text-slate-800" title="${chartConfig.title}">
                        ${chartConfig.title}
                    </h5>
                    ${cityFilterStatus}
                    ${freezeStatus}
                </div>
                <div class="chart-buttons flex-shrink-0">
                    ${chartButtonsHTML}
                </div>
            </div>
            <div id="${chartConfig.id}" class="chart-canvas" style="width: 100%; height: ${canvasHeight};"></div>
            ${annotationsHTML}
        `;
        
        // Append to dashboard
        const offcanvasSidebar = document.getElementById('offcanvasSidebar');
        if (offcanvasSidebar && containerToAppendTo.contains(offcanvasSidebar)) {
            containerToAppendTo.insertBefore(chartContainer, offcanvasSidebar);
        } else {
            containerToAppendTo.appendChild(chartContainer);
        }

        // AI Smart Context Memory: Target Chart Selection for Agent Actions
        chartContainer.addEventListener('click', (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (target && (target.closest('button') || target.closest('.btn') || target.closest('a') || target.closest('.delete-annotation-btn') || target.closest('.drag-grip') || target.closest('.form-check-input'))) {
                return;
            }
            if ((window as any).setChatFocusedChart) {
                (window as any).setChatFocusedChart({
                    id: chartConfig.id,
                    title: chartConfig.title || 'Chart',
                    type: chartConfig.type || 'bar',
                    xAxis: chartConfig.xAxis,
                    yAxes: chartConfig.yAxes
                });
            }
        });

        // Check and restore active AI focus badge if currently selected
        if ((window as any).getChatFocusedChart && (window as any).getChatFocusedChart()?.id === chartConfig.id) {
            chartContainer.classList.add('ai-focused-chart-card');
            if (!chartContainer.querySelector('.ai-focused-chart-badge')) {
                const badge = document.createElement('div');
                badge.className = 'ai-focused-chart-badge';
                badge.innerHTML = `<i class="bi bi-robot"></i> AI Target`;
                chartContainer.appendChild(badge);
            }
        }

        // Attach listeners for deleting annotations
        chartContainer.querySelectorAll('.delete-annotation-btn').forEach((btn: any) => {
            btn.addEventListener('click', async (e: Event) => {
                e.preventDefault();
                e.stopPropagation();
                const chartId = btn.dataset.chartId;
                const index = parseInt(btn.dataset.index, 10);
                
                const config = visualizations.find(v => v.id === chartId);
                if (config && config.annotations) {
                    config.annotations.splice(index, 1);
                    plotChart(config);
                    await saveDashboardSettings();
                    showMessage("एनोटेशन हटा दिया गया।", "info");
                }
            });
        });

        // Check if the chart is complete (has X and Y axis columns)
        if (!isChartConfigComplete(chartConfig)) {
            const chartDom = document.getElementById(chartConfig.id);
            if (chartDom) {
                chartDom.className = "chart-canvas d-flex flex-column align-items-center justify-content-center text-center p-3 border rounded-3 bg-light-subtle";
                chartDom.style.borderStyle = "dashed";
                chartDom.style.borderColor = "var(--bs-border-color)";
                chartDom.style.borderWidth = "2px";
                chartDom.innerHTML = `
                    <div class="rounded-circle p-2 bg-primary bg-opacity-10 text-primary mb-2">
                        <i class="bi bi-layout-three-columns" style="font-size: 20px;"></i>
                    </div>
                    <h6 class="font-sans font-semibold text-dark mb-1" style="font-size: 13px;">${chartConfig.title || 'नया चार्ट प्रिव्यू'}</h6>
                    <p class="text-muted text-center mb-0 px-2" style="font-size: 10.5px; max-width: 280px; line-height: 1.4;">
                        चार्ट प्रकार: <strong class="text-primary">${chartConfig.type.toUpperCase()}</strong><br>
                        कृपया बाईं ओर से कॉलम ड्रैग करके <strong>X-अक्ष</strong> और <strong>Y-अक्ष</strong> ड्रॉप ज़ोन में डालें।
                    </p>
                `;
            }

            // Initialize drag and resize so user can place the preview card
            if (!chartConfig.pinned) {
                chartContainer.moveable = initializeDragAndResize(chartContainer, null, false);
            }
            
            // Add button listeners
            addChartButtonListeners(chartContainer, chartConfig);
            return;
        }

        // Show data processing state while mapping data and generating options
        showProcessingState(chartConfig.id, "डेटा प्रोसेस हो रहा है...");

        // Get filtered data (supporting multi-dataset binding if chartConfig.datasetId is specified)
        let sourceData = filteredData;
        if (chartConfig.datasetId) {
            const boundDataset = DatasetStore.getDataset(chartConfig.datasetId);
            if (boundDataset && boundDataset.data && boundDataset.data.length > 0) {
                sourceData = boundDataset.data;
            }
        }
        const chartData = ChartUtils.getFilteredData(sourceData, chartConfig);
        const chartDom = document.getElementById(chartConfig.id);
        
        if (!chartDom) {
            throw new Error("चार्ट DOM एलिमेंट नहीं मिला");
        }

        // Initialize chart
        if (isPlotlyChart) {
            plotPlotlyChart(chartConfig, chartData);
            addPlotlyButtonListeners(chartContainer, chartConfig);
            
            // Double click on Plotly chart container for annotation
            chartDom.addEventListener('dblclick', () => {
                openAnnotationModal(chartConfig.id, {
                    dataName: 'General Note',
                    value: 'Plotly',
                    seriesIndex: 0,
                    seriesName: 'Main Series',
                    dataIndex: 0
                });
            });
        } else {
            const existingInstance = echarts.getInstanceByDom(chartDom);
            if (existingInstance) {
                try { existingInstance.dispose(); } catch (e) {}
            }

            const chart = echarts.init(chartDom, document.body.classList.contains('dark-theme') ? 'dark' : 'light', {
                renderer: 'canvas',
                useDirtyRect: false
            });
            allActiveChartInstances.push(chart);

            // Helper to validate backend chart spec compatibility
            const isValidBackendSpec = (spec: any, reqType?: string) => {
                if (!spec || spec.isKpi || spec.isPlotly) return false;
                const reqLower = (reqType || '').toLowerCase();
                const isReq3D = reqLower.includes('3d');
                const has3DAxes = !!(spec.xAxis3D || spec.yAxis3D || spec.grid3D);
                const seriesType = spec.series?.[0]?.type || '';
                const isSpec3D = has3DAxes || seriesType.toLowerCase().includes('3d');

                if (isReq3D && !isSpec3D) return false;
                if (!isReq3D && isSpec3D) return false;
                return true;
            };

            // High-speed Asynchronous Backend TypeScript Chart Engine
            let option: any = null;
            const configToSend = {
                ...chartConfig,
                colorPalette: chartConfig.colorPalette || chartGlobalSettings.colorPalette,
                colorPaletteName: chartConfig.colorPaletteName || chartGlobalSettings.colorPaletteName,
                color: chartConfig.color || (chartGlobalSettings.colorPalette ? chartGlobalSettings.colorPalette[0] : undefined)
            };

            try {
                // Submit heavy processing job asynchronously to backend without blocking UI thread
                const asyncResult: any = await submitAndPollAsyncChartJob(configToSend, chartData);
                if (asyncResult && isValidBackendSpec(asyncResult.chartSpec, chartConfig.type)) {
                    option = asyncResult.chartSpec;
                }
            } catch (e) {
                console.warn('[Chart Engine] Async backend processing fallback, trying direct endpoint:', e);
                try {
                    const backendResult: any = await fetchBackendChartSpec(configToSend, chartData);
                    if (backendResult && isValidBackendSpec(backendResult.chartSpec, chartConfig.type)) {
                        option = backendResult.chartSpec;
                    }
                } catch (err) {
                    console.warn('[Chart Engine] Direct backend fallback error:', err);
                }
            }

            if (!option) {
                option = getChartOption(chartConfig, chartData);
            }

            if (option) {
                option = commonChartOptions(option, chartConfig, chartGlobalSettings);
            }

            const annotatedOption = applyAnnotationsToOption(option, chartConfig);

            // 🎯 Inject Target Benchmark markLine into chart series if configured
            if (annotatedOption && chartConfig.threshold && (chartConfig.threshold.enable !== false && chartConfig.threshold.value !== undefined)) {
                const targetVal = Number(chartConfig.threshold.value);
                if (!isNaN(targetVal)) {
                    const seriesList = Array.isArray(annotatedOption.series) ? annotatedOption.series : (annotatedOption.series ? [annotatedOption.series] : []);
                    if (seriesList.length > 0) {
                        const firstSeries = seriesList[0];
                        if (!firstSeries.markLine) firstSeries.markLine = { data: [] };
                        if (!Array.isArray(firstSeries.markLine.data)) firstSeries.markLine.data = [];
                        firstSeries.markLine.data.push({
                            yAxis: targetVal,
                            name: chartConfig.threshold.label || 'Target',
                            label: {
                                show: true,
                                formatter: `🎯 ${chartConfig.threshold.label || 'Target'}: ${targetVal.toLocaleString('en-IN')}`,
                                position: 'insideEndTop',
                                color: chartConfig.threshold.color || '#e11d48',
                                fontWeight: 'bold',
                                fontSize: 11
                            },
                            lineStyle: {
                                type: chartConfig.threshold.style || 'dashed',
                                color: chartConfig.threshold.color || '#f43f5e',
                                width: 2
                            }
                        });
                    }
                }
            }

            chart.setOption(annotatedOption || option, true);
            hideProcessingState(chartConfig.id);
            
            // Single click & dblclick on data points to Drill-Down or Pin / Callout
            const handleChartPointClick = (params: any, ev?: any) => {
                if (params && (params.componentType === 'series' || params.componentType === 'markPoint')) {
                    const dataName = params.name || params.dataName || String(params.value && typeof params.value === 'object' ? params.value[0] : (params.value || ''));
                    const value = params.value && typeof params.value === 'object' ? params.value[1] : params.value;
                    const seriesIndex = params.seriesIndex !== undefined ? params.seriesIndex : 0;
                    const seriesName = params.seriesName || 'Series 1';

                    // ⚡ Interactive Drill-Down in Smart Summary Engine mode
                    if (SmartSummaryEngine.isSummaryModeActive() && dataName) {
                        const activeCfg = SmartSummaryEngine.getActiveConfig();
                        const filterObj: Record<string, any> = {};
                        const primaryDim = (activeCfg && activeCfg.dimensions && activeCfg.dimensions.length > 0)
                            ? activeCfg.dimensions[0]
                            : chartConfig.xAxis;

                        if (primaryDim) {
                            filterObj[primaryDim] = dataName;
                        }

                        DrillDownEngine.openDrillDown(
                            filterObj,
                            `Interactive Drill-Down: ${primaryDim} = "${dataName}"`
                        );
                        return;
                    }
                    
                    // ⚡ Interactive Cross-Filtering across all charts
                    if (isCrossFilteringActive() && chartConfig.xAxis && dataName) {
                        applyCrossFilter(chartConfig.xAxis, String(dataName), chartConfig.title);
                        return;
                    }

                    openAnnotationModal(chartConfig.id, {
                        dataName: String(dataName),
                        value: value,
                        seriesIndex: seriesIndex,
                        seriesName: seriesName,
                        dataIndex: params.dataIndex !== undefined ? params.dataIndex : 0
                    });
                }
            };

            chart.on('click', (p: any) => handleChartPointClick(p));
            chart.on('dblclick', (p: any) => {
                // Force annotation modal on double click even in summary mode
                if (p && (p.componentType === 'series' || p.componentType === 'markPoint')) {
                    const dataName = p.name || p.dataName || String(p.value && typeof p.value === 'object' ? p.value[0] : (p.value || ''));
                    openAnnotationModal(chartConfig.id, {
                        dataName: String(dataName),
                        value: p.value && typeof p.value === 'object' ? p.value[1] : p.value,
                        seriesIndex: p.seriesIndex !== undefined ? p.seriesIndex : 0,
                        seriesName: p.seriesName || 'Series 1',
                        dataIndex: p.dataIndex !== undefined ? p.dataIndex : 0
                    });
                }
            });
            
            // Download button for ECharts
            chartContainer.querySelector('.download-chart')?.addEventListener('click', (e: Event) => {
                e.preventDefault();
                e.stopPropagation();
                const dataURL = chart.getDataURL({
                    type: 'png',
                    pixelRatio: 2,
                    backgroundColor: '#fff'
                });
                const downloadLink = document.createElement('a');
                downloadLink.href = dataURL;
                downloadLink.download = `${chartConfig.title}.png`;
                document.body.appendChild(downloadLink);
                downloadLink.click();
                document.body.removeChild(downloadLink);
            });
        }
        
        // Add button listeners
        addChartButtonListeners(chartContainer, chartConfig);
        
        // Initialize drag and resize
        const chartInstance = isPlotlyChart ? null : echarts.getInstanceByDom(chartDom);
        if (!chartConfig.pinned) {
            chartContainer.moveable = initializeDragAndResize(chartContainer, chartInstance, isPlotlyChart);
        } else {
            if (chartContainer.cleanupMoveable) {
                chartContainer.cleanupMoveable();
            }
            chartContainer.moveable = null;
        }

        attachToggleAiAdviceListeners();
        
        // Evaluate threshold and danger zone breaches
        evaluateChartThresholdBreaches(chartConfig, chartData);

    } catch (error: any) {
        console.error("Error plotting chart:", error);
        showMessage(`चार्ट बनाने में त्रुटि: ${error.message}`, "danger");
    }
}

// ==========================================================      
// CHART FILTER LOGIC      
// ==========================================================      

/**
 * चार्ट विशिष्ट फ़िल्टर ड्रॉपडाउन को भरता है और इवेंट हैंडलर जोड़ता है
 */
function handleChartFilterClick(chartId: string): void {
    try {
        const chartConfig = visualizations.find(v => v.id === chartId);
        if (!chartConfig || !filteredData || filteredData.length === 0) return;

        if (!chartConfig.filters) {
            chartConfig.filters = [];
        }

        const filterContainer = document.querySelector(`#container-${chartId} .filter-options-container`);
        if (!filterContainer) return;

        filterContainer.innerHTML = '';
        
        const uniqueColumns = [...new Set((chartConfig.columns || []).filter(col => col))];

        uniqueColumns.forEach(columnName => {
            const uniqueValues = new Set<string>();
            filteredData.forEach((row: any) => {
                const value = String(row[columnName]).trim();
                if (value !== '') {
                    uniqueValues.add(value);
                }
            });
            const sortedValues = Array.from(uniqueValues).sort();

            if (sortedValues.length === 0) return;

            const currentFilter = chartConfig.filters?.find(f => f.columnName === columnName);
            const selectedValues = currentFilter ? currentFilter.selectedValues : sortedValues;

            const columnDiv = document.createElement('div');
            columnDiv.classList.add('mb-3', 'border-bottom', 'pb-2');
            columnDiv.innerHTML = `<h6 class="text-primary">${columnName}</h6>`;

            // Select All/Deselect All button
            const selectAllBtn = document.createElement('button');
            selectAllBtn.classList.add('btn', 'btn-sm', 'btn-outline-secondary', 'mb-2', 'w-100', 'toggle-select-btn');
            selectAllBtn.textContent = 'सभी चुनें / अचयनित करें';
            columnDiv.appendChild(selectAllBtn);

            const optionsDiv = document.createElement('div');
            optionsDiv.classList.add('filter-options');

            sortedValues.forEach(value => {
                const isChecked = selectedValues.includes(value);
                const checkboxId = `${chartId}-${columnName}-${value.replace(/[^a-zA-Z0-9]/g, '_')}`;
                
                const formCheck = document.createElement('div');
                formCheck.classList.add('form-check', 'small');
                
                formCheck.innerHTML = `
                    <input class="form-check-input chart-filter-checkbox" type="checkbox" value="${value}" id="${checkboxId}" ${isChecked ? 'checked' : ''} data-column-name="${columnName}">
                    <label class="form-check-label" for="${checkboxId}" title="${value}">
                        ${value.length > 25 ? value.substring(0, 25) + '...' : value}
                    </label>
                `;
                optionsDiv.appendChild(formCheck);
            });

            columnDiv.appendChild(optionsDiv);
            filterContainer.appendChild(columnDiv);
            
            // Add listener for Select All/Deselect All
            selectAllBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const checkboxes = optionsDiv.querySelectorAll<HTMLInputElement>('.chart-filter-checkbox');
                const allChecked = Array.from(checkboxes).every(cb => cb.checked);
                checkboxes.forEach(cb => cb.checked = !allChecked);
                
                const newSelectedValues = Array.from(checkboxes)
                    .filter(cb => cb.checked)
                    .map(cb => cb.value);
                applyChartFilters(chartId, columnName, newSelectedValues);
            });

            // Add change listener to each checkbox
            optionsDiv.querySelectorAll<HTMLInputElement>('.chart-filter-checkbox').forEach(checkbox => {
                checkbox.addEventListener('change', (e: any) => {
                    const colName = e.target.dataset.columnName;
                    const checkboxes = optionsDiv.querySelectorAll<HTMLInputElement>(`.chart-filter-checkbox[data-column-name="${colName}"]`);
                    
                    const newSelectedValues = Array.from(checkboxes)
                        .filter(cb => cb.checked)
                        .map(cb => cb.value);
                    
                    applyChartFilters(chartId, colName, newSelectedValues);
                });
            });
        });
    } catch (error) {
        console.error("Error handling chart filter click:", error);
    }
}

/**
 * चार्ट विशिष्ट फ़िल्टर लागू करता है और चार्ट को री-प्लॉट करता है
 */
async function applyChartFilters(chartId: string, columnName: string, selectedValues: string[]): Promise<void> {
    try {
        const chartConfig = visualizations.find(v => v.id === chartId);
        if (!chartConfig) return;

        if (!chartConfig.filters) {
            chartConfig.filters = [];
        }

        const existingFilterIndex = chartConfig.filters.findIndex(f => f.columnName === columnName);

        // Get all unique values for comparison
        const allUniqueValues = new Set<string>();
        filteredData.forEach((row: any) => {
            const value = String(row[columnName]).trim();
            if (value !== '') {
                allUniqueValues.add(value);
            }
        });
        const totalUnique = Array.from(allUniqueValues).length;

        if (selectedValues.length === totalUnique) {
            // All values selected, remove filter
            if (existingFilterIndex !== -1) {
                chartConfig.filters.splice(existingFilterIndex, 1);
            }
        } else {
            const newFilter = { columnName, selectedValues };
            if (existingFilterIndex !== -1) {
                chartConfig.filters[existingFilterIndex] = newFilter;
            } else {
                chartConfig.filters.push(newFilter);
            }
        }
        
        console.log(`Chart ${chartId} filters updated:`, chartConfig.filters);
        dataCache.clear(); // Clear cache when filters change

        await saveDashboardSettings();
        plotChart(chartConfig);
        showMessage(`चार्ट ${chartConfig.title} के लिए फ़िल्टर लागू किया गया।`, "success");
    } catch (error) {
        console.error("Error applying chart filters:", error);
        showMessage("फ़िल्टर लागू करने में त्रुटि", "danger");
    }
}

// ==========================================================      
// PLOT ALL FUNCTION      
// ==========================================================      

/**
 * सभी मौजूदा विज़ुअलाइज़ेशन को साफ़ करता है और पुनः प्लॉट करता है
 */
export async function plotAll(): Promise<void> {
    // Debounce implementation
    if (plotAllTimeout) {
        clearTimeout(plotAllTimeout);
    }
    
    plotAllTimeout = setTimeout(async () => {
        try {
            // If DOM is still loading, defer until ready
            if (typeof document !== 'undefined' && document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => plotAll(), { once: true });
                return;
            }

            // Data Hydration check before triggering initial or full re-render
            await ensureDataHydrated();

            const dashboardContent = getDashboardContainer();
            if (!dashboardContent) {
                console.warn("[Dashboard] Container not found on current page. Skipping render.");
                return;
            }
            
            console.log("Plotting all visualizations:", visualizations);
            
            // Clear existing chart containers:
            // 1. Purge containers that don't belong to the active tab's visualizations
            // 2. Refresh active containers (unless actively frozen)
            const currentVisualizationIds = new Set((visualizations || []).map((v: any) => v.id));
            const existingChartContainers = document.querySelectorAll('.visualization-container, .template-card-container');
            existingChartContainers.forEach((container: any) => {
                const chartId = container.id.replace('container-', '');
                
                // If container belongs to another tab, purge it completely!
                if (!currentVisualizationIds.has(chartId)) {
                    const chartDom = document.getElementById(chartId);
                    if (chartDom) {
                        try {
                            const chartInstance = echarts.getInstanceByDom(chartDom);
                            if (chartInstance) {
                                chartInstance.dispose();
                                const index = allActiveChartInstances.indexOf(chartInstance);
                                if (index > -1) allActiveChartInstances.splice(index, 1);
                            }
                        } catch (e) {}
                        try { Plotly.purge(chartDom); } catch (e) {}
                    }
                    try { container.moveable?.destroy(); } catch (e) {}
                    container.remove();
                    return;
                }

                // If chart belongs to this tab and is frozen, keep it
                if (chartFreezeState.get(chartId)?.isFrozen) {
                    return;
                }

                const chartDom = document.getElementById(chartId);
                if (chartDom) {
                    const chartInstance = echarts.getInstanceByDom(chartDom);
                    if (chartInstance) {
                        chartInstance.dispose();
                        // Remove from allActiveChartInstances
                        const index = allActiveChartInstances.indexOf(chartInstance);
                        if (index > -1) {
                            allActiveChartInstances.splice(index, 1);
                        }
                    } else {
                        try {
                            Plotly.purge(chartDom);
                        } catch (e) {
                            // Not a Plotly chart
                        }
                    }
                }
                container.moveable?.destroy();
                container.remove();
            });
            
            // Clear previous empty chart message
            const existingMessage = dashboardContent.querySelector('.no-charts-message');
            if (existingMessage) {
                existingMessage.remove();
            }
            
            dataCache.clear();
            
            // Empty dashboard message
            if (visualizations.length === 0) {
                const messageHtml = filteredData && filteredData.length > 0 ?
                    `<div class="no-charts-message text-muted text-center p-4" style="position: absolute; top: 150px; left: 50%; transform: translateX(-50%);"><p><i class="bi bi-info-circle"></i> <span data-i18n="dashboard.noCharts">${t('dashboard.noCharts', 'No charts available.')}</span></p><p data-i18n="dashboard.addChartsHint">${t('dashboard.addChartsHint', 'Add charts from Chart Settings in the sidebar.')}</p></div>` :
                    `<div class="no-charts-message text-muted text-center p-4" style="position: absolute; top: 150px; left: 50%; transform: translateX(-50%);"><p><i class="bi bi-info-circle"></i> <span data-i18n="dashboard.noDataFound">${t('dashboard.noDataFound', 'No data found. Please upload data.')}</span></p></div>`;
                
                const messageDiv = document.createElement('div');
                messageDiv.innerHTML = messageHtml;
                const messageElement = messageDiv.firstChild;
                
                if (messageElement) {
                    const offcanvasSidebar = document.getElementById('offcanvasSidebar');
                    if (offcanvasSidebar && dashboardContent.contains(offcanvasSidebar)) {
                        dashboardContent.insertBefore(messageElement, offcanvasSidebar);
                    } else {
                        dashboardContent.appendChild(messageElement);
                    }
                }
                
                dashboardContent.style.minHeight = '500px';
                return;
            }
            
            // Re-plot non-frozen charts
            for (const chartConfig of visualizations) {
                if (!chartFreezeState.get(chartConfig.id)?.isFrozen) {
                    try {
                        await plotChart(chartConfig);
                    } catch (chartErr) {
                        console.error(`[Dashboard] Failed to plot chart ${chartConfig.id}:`, chartErr);
                    }
                }
            }
            
            // Calculate minHeight
            setTimeout(() => {
                let maxBottom = 0;
                const chartElements = document.querySelectorAll('.visualization-container');
                chartElements.forEach((el: any) => {
                    const top = parseFloat(el.style.top);
                    const height = parseFloat(el.style.height);
                    if (!isNaN(top) && !isNaN(height)) {
                        const bottomPosition = top + height;
                        if (bottomPosition > maxBottom) {
                            maxBottom = bottomPosition;
                        }
                    }
                });
                
                if (maxBottom > 0) {
                    const requiredHeight = maxBottom + 40;
                    dashboardContent.style.minHeight = `${requiredHeight}px`;
                } else {
                    dashboardContent.style.minHeight = '500px';
                }
            }, 100);
            
            await saveDashboardSettings();
            updateEditModeSummaryOverlay();
        } catch (error) {
            console.error("Error in plotAll:", error);
            showMessage("सभी चार्ट्स प्लॉट करने में त्रुटि", "danger");
        }
    }, CHART_CONSTANTS.DEBOUNCE_DELAY);
}

// ==========================================================      
// REMAINING FUNCTIONS      
// ==========================================================      

/**
 * रियल-टाइम अपडेट के लिए किसी विशिष्ट चार्ट के डेटा को अपडेट करता है
 */
export function updateChartData(chartId: string, data: any[]): void {
    try {
        // Skip update if chart is frozen
        if (chartFreezeState.get(chartId)?.isFrozen) {
            return;
        }

        const chartDom = document.getElementById(chartId);
        if (!chartDom) return;
        
        const chartConfig = visualizations.find(v => v.id === chartId);
        if (!chartConfig) return;
        
        const isPlotlyChart = ['candlestick', 'ohlc'].includes(chartConfig.type);
        showProcessingState(chartId, "डेटा अपडेट हो रहा है...");
        const filteredChartData = ChartUtils.getFilteredData(data, chartConfig);
        
        if (isPlotlyChart) {
            plotPlotlyChart(chartConfig, filteredChartData);
        } else {
            const chartInstance = echarts.getInstanceByDom(chartDom);
            if (!chartInstance) {
                hideProcessingState(chartId);
                return;
            }
            let option = getChartOption(chartConfig, filteredChartData);
            if (option) {
                option = commonChartOptions(option, chartConfig, chartGlobalSettings);
            }
            chartInstance.setOption(option);
            hideProcessingState(chartId);
        }
    } catch (error) {
        console.error("Error updating chart data:", error);
    }
}

/**
 * Plotly चार्ट जनरेशन
 */
function plotPlotlyChart(config: ChartConfig, data: any[]): void {
    try {
        const chartDom = document.getElementById(config.id);
        if (!chartDom) return;
        
        if (!data || data.length === 0 || !config.columns || config.columns.length < 5) {
            Plotly.purge(chartDom);
            chartDom.innerHTML = '<div class="text-center text-muted mt-5">फ़िल्टर किए गए डेटा में अपर्याप्त मान।</div>';
            return;
        }
        
        const dates = data.map(row => row ? row[config.columns![0]] : '');
        const open = data.map(row => row ? parseFloat(row[config.columns![1]]) || 0 : 0);
        const high = data.map(row => row ? parseFloat(row[config.columns![2]]) || 0 : 0);
        const low = data.map(row => row ? parseFloat(row[config.columns![3]]) || 0 : 0);
        const close = data.map(row => row ? parseFloat(row[config.columns![4]]) || 0 : 0);
        
        const trace = {
            x: dates,
            open: open,
            high: high,
            low: low,
            close: close,
            type: config.type === 'ohlc' ? 'ohlc' : 'candlestick',
            name: config.title,
            increasing: { line: { color: '#00da3c' } },
            decreasing: { line: { color: '#ec0000' } },
            xaxis: 'x',
            yaxis: 'y'
        };
        
        const layout = {
            dragmode: chartGlobalSettings.zoomEnable ? 'zoom' : false,
            xaxis: {
                title: config.xAxisLabel,
                rangeslider: { visible: false },
                showgrid: chartGlobalSettings.gridShowHide,
                tickfont: {
                    color: document.body.classList.contains('dark-theme') ? '#f8f9fa' : '#333'
                },
                gridcolor: document.body.classList.contains('dark-theme') ? '#444' : '#ddd'
            },
            yaxis: {
                title: config.yAxisLabel,
                showgrid: chartGlobalSettings.gridShowHide,
                tickfont: {
                    color: document.body.classList.contains('dark-theme') ? '#f8f9fa' : '#333'
                },
                gridcolor: document.body.classList.contains('dark-theme') ? '#444' : '#ddd'
            },
            paper_bgcolor: 'transparent',
            plot_bgcolor: 'transparent',
            font: {
                color: document.body.classList.contains('dark-theme') ? '#f8f9fa' : '#333'
            },
            showlegend: true,
            legend: {
                x: 1,
                y: 1,
                bgcolor: 'rgba(0,0,0,0)',
                font: { color: document.body.classList.contains('dark-theme') ? '#f8f9fa' : '#333' }
            }
        };
        
        const configPlotly = {
            displayModeBar: false,
            responsive: true
        };
        
        showProcessingState(config.id, "Plotly डेटा मैप हो रहा है...");
        Plotly.newPlot(chartDom, [trace], layout, configPlotly).then(() => {
            hideProcessingState(config.id);
        }).catch(() => {
            hideProcessingState(config.id);
        });
    } catch (error) {
        console.error("Error plotting Plotly chart:", error);
        hideProcessingState(config.id);
    }
}

/**
 * मेन `getChartOption` फ़ंक्शन
 */
export function getChartOption(chartConfig: ChartConfig, data: any[]): any {
    if (data.length === 0) {
        return commonChartOptions({
            title: {
                text: t('dashboard.noDataFound', 'No records found in filtered data'),
                left: 'center',
                top: 'middle'
            }
        }, chartConfig);
    }
    
    try {
        switch (chartConfig.type) {
            case 'candlestick':
            case 'ohlc':
                return getCandlestickChartOption(chartConfig, data);
            case 'bar':
            case 'stacked-bar':
            case 'grouped-bar':
            case 'horizontal-bar':
                return getBarChartOption(chartConfig, data);
            case 'line':
            case 'stacked-line':
            case 'smooth-line':
            case 'step-line':
            case 'step-start-line':
            case 'step-end-line':
            case 'area-line':
            case 'area':
            case 'smooth-area':
            case 'stacked-area':
            case 'gradient-area':
            case 'dual-axis-line':
            case 'confidence-band':
            case 'range-area':
            case 'bump-line':
            case 'ranking-line':
            case 'polar-line':
            case 'radial-line':
            case 'timeseries-line':
            case 'markpoint-line':
            case 'markline-line':
                return getLineChartOption(chartConfig, data);
            case 'pie':
            case 'doughnut':
            case 'rose-radius':
            case 'rose-area':
                return getPieChartOption(chartConfig, data);
            case 'scatter':
            case 'bubble':
                return getScatterChartOption(chartConfig, data);
            case 'funnel':
                return getFunnelChartOption(chartConfig, data);
            case 'gauge':
                return getGaugeChartOption(chartConfig, data);
            case 'radar':
                return getRadarChartOption(chartConfig, data);
            case 'treemap':
                return getTreemapChartOption(chartConfig, data);
            case 'bar3D':
            case 'bar3d':
            case '3d-bar':
            case '3D-bar':
                return getBar3DChartOption(chartConfig, data);
            case 'line3D':
            case 'line3d':
            case '3d-line':
            case '3D-line':
                return getLine3DChartOption(chartConfig, data);
            case 'waterfall':
                return getWaterfallChartOption(chartConfig, data);
            case 'heatmap':
                return getHeatmapChartOption(chartConfig, data);
            case 'sankey':
                return getSankeyChartOption(chartConfig, data);
            case 'bullet':
                return getBulletChartOption(chartConfig, data);
            case 'boxplot':
                return getBoxplotChartOption(chartConfig, data);
            default:
                return commonChartOptions({}, chartConfig);
        }
    } catch (error) {
        console.error("Error getting chart option:", error);
        return commonChartOptions({
            title: {
                text: 'चार्ट बनाने में त्रुटि',
                left: 'center',
                top: 'middle'
            }
        }, chartConfig);
    }
}

/**
 * एडवांस्ड चार्ट सेटिंग्स को अपडेट करता है
 */
export async function applyAdvancedChartSettings(): Promise<void> {
    try {
        const gridShowHideEl = document.getElementById('gridShowHide') as HTMLInputElement;
        const tooltipOnOffEl = document.getElementById('tooltipOnOff') as HTMLInputElement;
        const zoomEnableEl = document.getElementById('zoomEnable') as HTMLInputElement;
        const animationDurationEl = document.getElementById('animationDuration') as HTMLInputElement;
        const axisFormatEl = document.getElementById('axisFormat') as HTMLSelectElement;
        const legendPositionEl = document.getElementById('legendPosition') as HTMLSelectElement;
        const showLabelsEl = document.getElementById('showLabels') as HTMLInputElement;
        const showToolboxEl = document.getElementById('showToolbox') as HTMLInputElement;
        const colorPaletteNameEl = document.getElementById('colorPaletteName') as HTMLSelectElement;
        const fontSizeEl = document.getElementById('fontSize') as HTMLSelectElement;
        const gridStyleEl = document.getElementById('gridStyle') as HTMLSelectElement;
        const lineStyleEl = document.getElementById('lineStyle') as HTMLSelectElement;
        const areaFillEl = document.getElementById('areaFill') as HTMLInputElement;
        const barRoundedEl = document.getElementById('barRounded') as HTMLInputElement;

        if (gridShowHideEl) chartGlobalSettings.gridShowHide = gridShowHideEl.checked;
        if (tooltipOnOffEl) chartGlobalSettings.tooltipOnOff = tooltipOnOffEl.checked;
        if (zoomEnableEl) chartGlobalSettings.zoomEnable = zoomEnableEl.checked;
        if (animationDurationEl) chartGlobalSettings.animationDuration = parseInt(animationDurationEl.value, 10) || 1000;
        if (axisFormatEl) chartGlobalSettings.axisFormat = axisFormatEl.value;
        if (legendPositionEl) chartGlobalSettings.legendPosition = legendPositionEl.value;
        if (showLabelsEl) chartGlobalSettings.showLabels = showLabelsEl.checked;
        if (showToolboxEl) chartGlobalSettings.showToolbox = showToolboxEl.checked;
        if (colorPaletteNameEl) chartGlobalSettings.colorPaletteName = colorPaletteNameEl.value;
        if (fontSizeEl) chartGlobalSettings.fontSize = fontSizeEl.value;
        if (gridStyleEl) chartGlobalSettings.gridStyle = gridStyleEl.value;
        if (lineStyleEl) chartGlobalSettings.lineStyle = lineStyleEl.value;
        if (areaFillEl) chartGlobalSettings.areaFill = areaFillEl.checked;
        if (barRoundedEl) chartGlobalSettings.barRounded = barRoundedEl.checked;

        // Read Threshold & Reference Line controls
        const thresholdEnableEl = document.getElementById('thresholdEnable') as HTMLInputElement;
        const thresholdValueEl = document.getElementById('thresholdValue') as HTMLInputElement;
        const thresholdLabelEl = document.getElementById('thresholdLabel') as HTMLInputElement;
        const thresholdColorEl = document.getElementById('thresholdColor') as HTMLInputElement;
        const thresholdStyleEl = document.getElementById('thresholdStyle') as HTMLSelectElement;

        const thresholdEnableZoneEl = document.getElementById('thresholdEnableZone') as HTMLInputElement;
        const thresholdZoneMinEl = document.getElementById('thresholdZoneMin') as HTMLInputElement;
        const thresholdZoneMaxEl = document.getElementById('thresholdZoneMax') as HTMLInputElement;
        const thresholdZoneLabelEl = document.getElementById('thresholdZoneLabel') as HTMLInputElement;
        const thresholdZoneColorEl = document.getElementById('thresholdZoneColor') as HTMLInputElement;

        if (!chartGlobalSettings.threshold) {
            chartGlobalSettings.threshold = {};
        }

        if (thresholdEnableEl) chartGlobalSettings.threshold.enable = thresholdEnableEl.checked;
        if (thresholdValueEl) chartGlobalSettings.threshold.value = thresholdValueEl.value !== '' ? Number(thresholdValueEl.value) : undefined;
        if (thresholdLabelEl) chartGlobalSettings.threshold.label = thresholdLabelEl.value;
        if (thresholdColorEl) chartGlobalSettings.threshold.color = thresholdColorEl.value;
        if (thresholdStyleEl) chartGlobalSettings.threshold.style = thresholdStyleEl.value;

        if (thresholdEnableZoneEl) chartGlobalSettings.threshold.enableZone = thresholdEnableZoneEl.checked;
        if (thresholdZoneMinEl) chartGlobalSettings.threshold.zoneMin = thresholdZoneMinEl.value !== '' ? Number(thresholdZoneMinEl.value) : undefined;
        if (thresholdZoneMaxEl) chartGlobalSettings.threshold.zoneMax = thresholdZoneMaxEl.value !== '' ? Number(thresholdZoneMaxEl.value) : undefined;
        if (thresholdZoneLabelEl) chartGlobalSettings.threshold.zoneLabel = thresholdZoneLabelEl.value;
        if (thresholdZoneColorEl) chartGlobalSettings.threshold.zoneColor = thresholdZoneColorEl.value;

        const palettes: Record<string, string[]> = {
            classic: ['#5470C6', '#91CC75', '#EE6666', '#FC8452', '#73C0DE', '#3BA272', '#FACC14', '#9A60B4', '#EA7CCC'],
            vibrant: ['#FF6B6B', '#4D96FF', '#6BCB77', '#FFD93D', '#F473B9', '#1C3879', '#607EAA', '#E15FED'],
            pastel: ['#FFB7B2', '#FFDAC1', '#E2F0CB', '#B5EAD7', '#C7CEEA', '#FF9AA2', '#E8AEB2', '#D3C4BE'],
            neon: ['#FF007F', '#00F0FF', '#7F00FF', '#39FF14', '#FF9900', '#FF00AA', '#00FFCC', '#FF00FF'],
            sunset: ['#FD3A69', '#FED049', '#007580', '#222831', '#FF8E00', '#851DE0', '#565656', '#DF362D'],
            forest: ['#1E5128', '#4E9F3D', '#D8B21F', '#F39C12', '#2C3E50', '#8E44AD', '#34495E', '#16A085']
        };

        if (chartGlobalSettings.colorPaletteName === 'custom') {
            const rawCustom = localStorage.getItem('customPaletteArray');
            if (rawCustom) {
                const savedCustomArr = JSON.parse(rawCustom);
                if (savedCustomArr && Array.isArray(savedCustomArr) && savedCustomArr.length > 0) {
                    chartGlobalSettings.colorPalette = savedCustomArr;
                }
            }
        } else {
            chartGlobalSettings.colorPalette = palettes[chartGlobalSettings.colorPaletteName] || palettes.classic;
        }

        console.log("Applied Advanced Chart Settings:", chartGlobalSettings);
        dataCache.clear();
        
        await saveDashboardSettings();
        
        // Refresh active chart instances directly
        visualizations.forEach(chartConfig => {
            const chartDom = document.getElementById(chartConfig.id);
            if (chartDom) {
                const chartInstance = echarts.getInstanceByDom(chartDom);
                if (chartInstance) {
                    const chartData = ChartUtils.getFilteredData(filteredData, chartConfig);
                    let option = getChartOption(chartConfig, chartData);
                    if (option) {
                        option = commonChartOptions(option, chartConfig, chartGlobalSettings);
                        const annotatedOption = applyAnnotationsToOption(option, chartConfig);
                        chartInstance.setOption(annotatedOption || option, true);
                    }
                }
            }
        });

        await plotAll();
        showMessage("चार्ट सेटिंग्स सफलतापूर्वक लागू की गईं!", "success");
    } catch (error) {
        console.error("Error applying advanced chart settings:", error);
        showMessage("चार्ट सेटिंग्स लागू करने में त्रुटि", "danger");
    }
}

// Helper functions
function toggleFullscreen(chartDom: HTMLElement | any): void {
    try {
        if (!chartDom) return;
        const container: any = chartDom.parentElement;
        if (!document.fullscreenElement) {
            if (container.requestFullscreen) {
                container.requestFullscreen();
            } else if (container.webkitRequestFullscreen) {
                container.webkitRequestFullscreen();
            } else if (container.msRequestFullscreen) {
                container.msRequestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if ((document as any).webkitExitFullscreen) {
                (document as any).webkitExitFullscreen();
            } else if ((document as any).msExitFullscreen) {
                (document as any).msExitFullscreen();
            }
        }
    } catch (error) {
        console.error("Error toggling fullscreen:", error);
    }
}

export function editChart(chartId: string): void {
    try {
        const chartConfig = visualizations.find(v => v.id === chartId);
        if (!chartConfig) return;
        
        if (chartConfig.type === 'kpi_sparkline') {
            window.editingKpiId = chartId;
            
            // Open sidebar offcanvas
            const sidebarEl = document.getElementById('offcanvasSidebar');
            if (sidebarEl) {
                const bsOffcanvas = bootstrap.Offcanvas.getInstance(sidebarEl) || new bootstrap.Offcanvas(sidebarEl);
                bsOffcanvas.show();
            }
            
            // Show proper offcanvas content
            document.querySelectorAll<HTMLElement>('.offcanvas-content').forEach(c => c.style.display = 'none');
            const content = document.getElementById('kpiBuilderContent');
            if (content) {
                content.style.display = 'block';
                // Trigger template loading dynamically
                import('../layout/dynamicLoader.ts').then(async (mod) => {
                    await mod.loadDynamicContent('offcanvasSidebar', 'kpiBuilderContent');
                    
                    // Pre-populate fields after dynamic render has completed
                    const titleInput = document.getElementById('kpiTitleInput') as HTMLInputElement;
                    const colSelect = document.getElementById('kpiMetricColumn') as HTMLSelectElement;
                    const aggSelect = document.getElementById('kpiAggregation') as HTMLSelectElement;
                    const sparkSelect = document.getElementById('kpiSparklineType') as HTMLSelectElement;
                    const styleSelect = document.getElementById('kpiCardStyle') as HTMLSelectElement;
                    const themeSelect = document.getElementById('kpiContainerTheme') as HTMLSelectElement;
                    const picker = document.getElementById('kpiColorPicker') as HTMLInputElement;
                    const cancelBtn = document.getElementById('btnCancelKpiEdit') as HTMLElement;
                    const addBtn = document.getElementById('btnAddKpiCard') as HTMLElement;

                    if (titleInput) titleInput.value = chartConfig.title || '';
                    if (colSelect) colSelect.value = chartConfig.metricCol || '';
                    if (aggSelect) aggSelect.value = chartConfig.aggregation || 'sum';
                    if (sparkSelect) sparkSelect.value = chartConfig.sparklineType || 'line';
                    if (styleSelect) styleSelect.value = chartConfig.kpiStyle || 'minimal';
                    if (themeSelect) themeSelect.value = chartConfig.kpiTheme || 'light';
                    if (picker) picker.value = chartConfig.color || '#8b5cf6';

                    const widthVal = chartConfig.sparklineWidth !== undefined ? chartConfig.sparklineWidth : 110;
                    const heightVal = chartConfig.sparklineHeight !== undefined ? chartConfig.sparklineHeight : 35;
                    const titleSizeVal = chartConfig.kpiTitleSize !== undefined ? chartConfig.kpiTitleSize : 13;
                    const valueSizeVal = chartConfig.kpiValueSize !== undefined ? chartConfig.kpiValueSize : 28;
                    const posVal = chartConfig.sparklinePosition || 'right';

                    const posSelect = document.getElementById('kpiSparklinePosition') as HTMLSelectElement;
                    if (posSelect) posSelect.value = posVal;

                    const widthInput = document.getElementById('kpiSparklineWidth') as HTMLInputElement;
                    if (widthInput) widthInput.value = String(widthVal);
                    const widthValSpan = document.getElementById('kpiSparklineWidthVal');
                    if (widthValSpan) widthValSpan.textContent = `${widthVal}px`;

                    const heightInput = document.getElementById('kpiSparklineHeight') as HTMLInputElement;
                    if (heightInput) heightInput.value = String(heightVal);
                    const heightValSpan = document.getElementById('kpiSparklineHeightVal');
                    if (heightValSpan) heightValSpan.textContent = `${heightVal}px`;

                    const titleSizeInput = document.getElementById('kpiTitleSize') as HTMLInputElement;
                    if (titleSizeInput) titleSizeInput.value = String(titleSizeVal);
                    const titleSizeValSpan = document.getElementById('kpiTitleSizeVal');
                    if (titleSizeValSpan) titleSizeValSpan.textContent = `${titleSizeVal}px`;

                    const valueSizeInput = document.getElementById('kpiValueSize') as HTMLInputElement;
                    if (valueSizeInput) valueSizeInput.value = String(valueSizeVal);
                    const valueSizeValSpan = document.getElementById('kpiValueSizeVal');
                    if (valueSizeValSpan) valueSizeValSpan.textContent = `${valueSizeVal}px`;

                    const dimLabel = document.getElementById('kpiSparklineDimLabel');
                    if (dimLabel) dimLabel.textContent = `${widthVal} × ${heightVal} px`;

                    if (cancelBtn) cancelBtn.style.display = 'block';
                    if (addBtn) addBtn.innerHTML = '<i class="bi bi-check-circle-fill me-1.5"></i> KPI कार्ड अपडेट करें (Update KPI)';
                    
                    import('./kpiSparklines.js').then(kpiMod => {
                        if (typeof kpiMod.syncKpiButtonUI === 'function') {
                            kpiMod.syncKpiButtonUI();
                        }
                    });
                });
            }
            
            // Mark menu active
            const kpiMenuLink = document.getElementById('menuKpiBuilder');
            if (kpiMenuLink) {
                document.querySelectorAll('.main-menu-bar .nav-link').forEach(l => l.classList.remove('active'));
                kpiMenuLink.classList.add('active');
            }
            return;
        }
        
        const chartTypeEl = document.getElementById('chartType') as HTMLSelectElement;
        if (chartTypeEl) {
            if (!Array.from(chartTypeEl.options).some(opt => opt.value === chartConfig.type)) {
                const newOpt = document.createElement('option');
                newOpt.value = chartConfig.type;
                newOpt.textContent = chartConfig.type;
                chartTypeEl.appendChild(newOpt);
            }
            chartTypeEl.value = chartConfig.type;
        }
        const colorPicker = document.getElementById('colorPicker') as HTMLInputElement;
        if (colorPicker) colorPicker.value = chartConfig.color || '#5470C6';

        const chartTitleInput = document.getElementById('chartTitle') as HTMLInputElement;
        if (chartTitleInput) chartTitleInput.value = chartConfig.title || '';

        const xAxisLabelInput = document.getElementById('xAxisLabel') as HTMLInputElement;
        if (xAxisLabelInput) xAxisLabelInput.value = chartConfig.xAxisLabel || '';

        const yAxisLabelInput = document.getElementById('yAxisLabel') as HTMLInputElement;
        if (yAxisLabelInput) yAxisLabelInput.value = chartConfig.yAxisLabel || '';

        const rowLimitSelect = document.getElementById('chartDataRowLimit') as HTMLSelectElement;
        if (rowLimitSelect) {
            rowLimitSelect.value = chartConfig.dataRowLimit ? String(chartConfig.dataRowLimit) : 'all';
        }
        
        // Open sidebar offcanvas
        const sidebarEl = document.getElementById('offcanvasSidebar');
        if (sidebarEl) {
            const bsOffcanvas = bootstrap.Offcanvas.getInstance(sidebarEl) || new bootstrap.Offcanvas(sidebarEl);
            bsOffcanvas.show();
        }
        
        // Show proper offcanvas content
        document.querySelectorAll<HTMLElement>('.offcanvas-content').forEach(c => c.style.display = 'none');
        const content = document.getElementById('chartSettingsContent');
        if (content) content.style.display = 'block';
        
        // Mark menu active
        const dataChartMenuLink = document.querySelector('[data-menu-target="chartSettingsContent"]');
        if (dataChartMenuLink) {
            document.querySelectorAll('.main-menu-bar .nav-link').forEach(l => l.classList.remove('active'));
            dataChartMenuLink.classList.add('active');
        }

        // Populate drop zones
        populateDropZones(headers, chartConfig.xAxis, chartConfig.yAxes, chartConfig.zAxis);
        
        // Adjust Z drop zone visibility
        const zAxisDropZoneContainer = document.getElementById('zAxisDropZoneContainer');
        if (zAxisDropZoneContainer) {
            zAxisDropZoneContainer.style.display = (chartConfig.type === 'bar3D' || chartConfig.type === 'line3D') ? 'block' : 'none';
        }
        
        enterEditMode(chartId);
    } catch (error) {
        console.error("Error editing chart:", error);
        showMessage("चार्ट संपादित करने में त्रुटि", "danger");
    }
}

export function enterEditMode(chartId: string): void {
    window.editingChartId = chartId;
    
    const btn = document.getElementById('addVisualizationBtn');
    if (btn) {
        btn.innerHTML = '<i class="bi bi-check-circle"></i> विज़ुअलाइज़ेशन अपडेट करें';
        btn.className = 'btn btn-success w-100';
    }
    const cancelBtn = document.getElementById('cancelEditBtn');
    if (cancelBtn) {
        cancelBtn.style.display = 'block';
    }
}

export function exitEditMode(): void {
    window.editingChartId = null;
    
    const btn = document.getElementById('addVisualizationBtn');
    if (btn) {
        btn.innerHTML = '<i class="bi bi-plus-circle"></i> विज़ुअलाइज़ेशन जोड़ें';
        btn.className = 'btn btn-primary w-100';
    }
    const cancelBtn = document.getElementById('cancelEditBtn');
    if (cancelBtn) {
        cancelBtn.style.display = 'none';
    }
    
    // Reset fields
    const titleInput = document.getElementById('chartTitle') as HTMLInputElement;
    if (titleInput) titleInput.value = '';
    
    const xLabel = document.getElementById('xAxisLabel') as HTMLInputElement;
    if (xLabel) xLabel.value = '';
    
    const yLabel = document.getElementById('yAxisLabel') as HTMLInputElement;
    if (yLabel) yLabel.value = '';
    
    // Clear dropzones
    const xAxisDropZone = document.getElementById('xAxisDropZone');
    const yAxisDropZone = document.getElementById('yAxisDropZone');
    const zAxisDropZone = document.getElementById('zAxisDropZone');
    if (xAxisDropZone) xAxisDropZone.innerHTML = '';
    if (yAxisDropZone) yAxisDropZone.innerHTML = '';
    if (zAxisDropZone) zAxisDropZone.innerHTML = '';

    // Discard any active draft previews
    discardActivePreviewChart();
}

function setupCancelBtnListener(): void {
    const cancelBtn = document.getElementById('cancelEditBtn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', (e) => {
            e.preventDefault();
            exitEditMode();
        });
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupCancelBtnListener);
} else {
    setupCancelBtnListener();
}

// Optimized resize listener with requestAnimationFrame batching
let resizeRafId: number | null = null;
window.addEventListener('resize', () => {
    if (resizeTimeout) {
        clearTimeout(resizeTimeout);
    }
    resizeTimeout = setTimeout(() => {
        if (resizeRafId) {
            cancelAnimationFrame(resizeRafId);
        }
        resizeRafId = requestAnimationFrame(() => {
            allActiveChartInstances.forEach((chart: any) => {
                if (chart) {
                    const isDisposed = typeof chart.isDisposed === 'function' ? chart.isDisposed() : !!chart.isDisposed;
                    if (!isDisposed && typeof chart.resize === 'function') {
                        try {
                            chart.resize();
                        } catch (err) {
                            console.warn('Error during chart resize:', err);
                        }
                    }
                }
            });
        });
    }, CHART_CONSTANTS.RESIZE_DEBOUNCE || 100);
});

/**
 * Auto-arranges all active charts on the dashboard into a grid with the specified number of columns.
 */
export async function arrangeChartsInGrid(colsCount: number = 2): Promise<void> {
    try {
        const container = document.getElementById('dashboardContent') || document.getElementById('visualizations');
        if (!container) return;
        const containerWidth = container.clientWidth || 1100;
        const margin = 15;
        const padding = 20;
        
        // Count non-frozen and frozen charts to arrange
        const activeContainers = Array.from(document.querySelectorAll('.visualization-container')) as HTMLElement[];
        if (activeContainers.length === 0) {
            showMessage("व्यवस्थित करने के लिए कोई चार्ट नहीं मिला।", "warning");
            return;
        }

        const colWidth = Math.floor((containerWidth - (margin * 2) - (padding * (colsCount - 1))) / colsCount);
        const colHeight = 350; // Standard layout height

        activeContainers.forEach((el, idx) => {
            const chartId = el.id.replace('container-', '');
            const chartConfig = visualizations.find(v => v.id === chartId);
            
            const col = idx % colsCount;
            const row = Math.floor(idx / colsCount);
            
            const left = margin + col * (colWidth + padding);
            const top = margin + row * (colHeight + padding);

            // Update DOM styles
            el.style.width = `${colWidth}px`;
            el.style.height = `${colHeight}px`;
            el.style.top = `${top}px`;
            el.style.left = `${left}px`;

            // Update config if exists
            if (chartConfig) {
                chartConfig.position = { top: `${top}px`, left: `${left}px` };
                chartConfig.size = { width: `${colWidth}px`, height: `${colHeight}px` };
            }

            // Trigger internal chart resize
            const chartDom = document.getElementById(chartId);
            if (chartDom) {
                const chartInstance = echarts.getInstanceByDom(chartDom);
                if (chartInstance) {
                    try {
                        const isDisposed = typeof chartInstance.isDisposed === 'function' ? chartInstance.isDisposed() : false;
                        if (!isDisposed && typeof chartInstance.resize === 'function') {
                            chartInstance.resize();
                        }
                    } catch (e) {
                        console.warn('Chart resize failed in grid arrange:', e);
                    }
                } else {
                    try {
                        Plotly.relayout(chartDom, {
                            width: colWidth,
                            height: colHeight - 70
                        });
                    } catch (e) {
                        // Ignore if not plotly
                    }
                }
            }
        });

        // Set min-height on dashboard container to hold arranged elements
        const rowsCount = Math.ceil(activeContainers.length / colsCount);
        const requiredHeight = rowsCount * (colHeight + padding) + margin + 40;
        const dashboardContent = document.getElementById('dashboardContent');
        if (dashboardContent) {
            dashboardContent.style.minHeight = `${requiredHeight}px`;
        }

        showMessage(`चार्ट्स सफलतापूर्वक ${colsCount} कॉलम ग्रिड में व्यवस्थित किए गए!`, "success");
        await saveDashboardSettings();
    } catch (err) {
        console.error("Error arranging charts:", err);
        showMessage("चार्ट्स व्यवस्थित करने में त्रुटि", "danger");
    }
}

export function isChartConfigComplete(chartConfig: ChartConfig): boolean {
    if (chartConfig && chartConfig.type === 'kpi_sparkline') {
        return true;
    }
    if (!chartConfig || !chartConfig.columns || chartConfig.columns.length < 2) {
        return false;
    }
    
    const cols = chartConfig.columns || [];
    const xAxis = cols[0];
    const yAxes = cols.slice(1);
    
    if (!xAxis || yAxes.length === 0) return false;
    
    return true;
}

export function initializeChartPreview(): void {
    if (window.editingChartId) {
        // If already in edit mode, don't create a new preview
        return;
    }

    const chartTypeSelect = document.getElementById('chartType') as HTMLSelectElement;
    const chartType = chartTypeSelect ? chartTypeSelect.value : 'bar';
    if (!chartType) return;

    const colorPicker = document.getElementById('colorPicker') as HTMLInputElement;
    const chartTitleInput = document.getElementById('chartTitle') as HTMLInputElement;
    
    if (!window.activePreviewChartId) {
        // Create new preview chart config
        const id = `chart-preview-${Date.now()}`;
        window.activePreviewChartId = id;
        
        const defaultTitle = chartTitleInput?.value || `${chartType.toUpperCase()} चार्ट प्रिव्यू`;
        if (chartTitleInput && (!chartTitleInput.value || chartTitleInput.value.trim() === '')) {
            chartTitleInput.value = defaultTitle;
        }

        const draftConfig: ChartConfig = {
            id: id,
            type: chartType,
            color: colorPicker?.value || '#5470C6',
            title: defaultTitle,
            xAxisLabel: 'X-Axis',
            yAxisLabel: 'Y-Axis',
            zAxisLabel: '',
            columns: [],
            position: calculateNewChartPosition(),
            size: { width: '600px', height: '400px' },
            filters: [],
            isPreview: true
        };
        
        visualizations.push(draftConfig);
        plotChart(draftConfig);
    } else {
        // Update existing preview config
        const draftConfig = visualizations.find(v => v.id === window.activePreviewChartId);
        if (draftConfig) {
            draftConfig.type = chartType;
            if (chartTitleInput && (!chartTitleInput.value || chartTitleInput.value.trim() === '' || chartTitleInput.value.includes('चार्ट प्रिव्यू'))) {
                const title = `${chartType.toUpperCase()} चार्ट प्रिव्यू`;
                chartTitleInput.value = title;
                draftConfig.title = title;
            }
            plotChart(draftConfig);
        }
    }
}

export function discardActivePreviewChart(): void {
    if (window.activePreviewChartId) {
        const id = window.activePreviewChartId;
        window.activePreviewChartId = null;

        // Remove container from DOM
        const container = document.getElementById(`container-${id}`) as any;
        if (container) {
            if (container.moveable) {
                container.moveable.destroy();
            }
            container.remove();
        }
        
        // Remove from visualizations array
        const idx = visualizations.findIndex(v => v.id === id);
        if (idx !== -1) {
            visualizations.splice(idx, 1);
        }
    }
}

function calculateNewChartPosition(): { top: string; left: string } {
    const dashboardContent = document.getElementById('dashboardContent');
    let newTop = 20;
    let newLeft = 20;
    
    const activeVizs = visualizations.filter(v => v.id !== window.activePreviewChartId);
    
    if (activeVizs.length > 0) {
        let maxRight = 0;
        let lowestTop = 0;
        activeVizs.forEach(viz => {
            const vizLeft = parseFloat(viz.position?.left || '0') || 0;
            const vizWidth = parseFloat(viz.size?.width || '600') || 600;
            const vizTop = parseFloat(viz.position?.top || '0') || 0;
            if (vizLeft + vizWidth > maxRight) {
                maxRight = vizLeft + vizWidth;
                lowestTop = vizTop;
            }
        });
        
        const dashboardRect = dashboardContent ? dashboardContent.getBoundingClientRect() : { width: 1000 };
        newLeft = maxRight + 50;
        newTop = lowestTop;
        
        if (newLeft + 650 > (dashboardRect.width || 1000)) {
            let maxBottom = 0;
            activeVizs.forEach(viz => {
                const vizTop = parseFloat(viz.position?.top || '0') || 0;
                const vizHeight = parseFloat(viz.size?.height || '400') || 400;
                if (vizTop + vizHeight > maxBottom) {
                    maxBottom = vizTop + vizHeight;
                }
            });
            newLeft = 20;
            newTop = maxBottom + 20;
        }
    }
    return { top: `${newTop}px`, left: `${newLeft}px` };
}

// ==========================================
// INTERACTIVE CHART ANNOTATIONS ENGINE
// ==========================================

let currentAnnotationTarget: any = null;

export function applyAnnotationsToOption(option: any, chartConfig: ChartConfig): any {
    if (!option || !chartConfig.annotations || chartConfig.annotations.length === 0) {
        return option;
    }
    
    chartConfig.annotations.forEach(ann => {
        const seriesIndex = ann.seriesIndex !== undefined ? ann.seriesIndex : 0;
        
        if (option.series) {
            let seriesItem: any = null;
            if (Array.isArray(option.series)) {
                seriesItem = option.series[seriesIndex] || option.series[0];
            } else if (typeof option.series === 'object') {
                seriesItem = option.series;
            }
            
            if (seriesItem) {
                if (!seriesItem.markPoint) {
                    seriesItem.markPoint = {
                        symbol: 'pin',
                        symbolSize: 45,
                        itemStyle: {
                            color: ann.color || '#ef4444'
                        },
                        label: {
                            show: true,
                            formatter: (p: any) => p.data.shortTag || '!',
                            fontWeight: 'bold',
                            fontSize: 9,
                            color: '#ffffff'
                        },
                        tooltip: {
                            show: true,
                            formatter: () => `<div class="p-1"><i class="bi bi-pin-angle-fill text-danger me-1"></i><b>पिन्ड कॉलआउट:</b><br/><b>बिंदु:</b> ${ann.dataName}<br/><b>मान:</b> ${ann.value}<br/><b>टैग:</b> ${ann.tag || 'सामान्य'}<br/><b>विवरण:</b> ${ann.note}</div>`
                        },
                        data: []
                    };
                }
                
                if (seriesItem.markPoint && Array.isArray(seriesItem.markPoint.data)) {
                    seriesItem.markPoint.data.push({
                        name: ann.note || ann.dataName,
                        value: ann.tag || 'Callout',
                        shortTag: ann.tag ? ann.tag.substring(0, 3) : '!',
                        xAxis: ann.dataName,
                        yAxis: ann.value,
                        itemStyle: {
                            color: ann.color || '#ef4444'
                        }
                    });
                }
            }
        }
    });
    return option;
}

export function renderChartAnnotations(chartConfig: ChartConfig): string {
    if (!chartConfig.annotations || chartConfig.annotations.length === 0) {
        return '';
    }
    let html = `
    <div class="chart-annotations-container mt-1 border-top pt-2 px-1 text-start" style="font-size: 10px; max-height: 60px; overflow-y: auto; z-index: 102; position: relative;">
        <div class="d-flex align-items-center gap-1 text-danger fw-bold mb-1" style="font-size: 9px;">
            <i class="bi bi-pin-angle-fill"></i> पिन्ड कॉलआउट व एनोटेशन्स (${chartConfig.annotations.length}):
        </div>
        <div class="d-flex flex-wrap gap-1">
    `;
    chartConfig.annotations.forEach((ann, index) => {
        const badgeColor = ann.color || '#ef4444';
        const iconClass = ann.icon || (ann.tag?.includes('स्पाइक') ? 'bi-graph-up-arrow' : ann.tag?.includes('गिरावट') ? 'bi-exclamation-triangle-fill' : ann.tag?.includes('लॉन्च') ? 'bi-rocket-takeoff-fill' : 'bi-flag-fill');
        html += `
            <span class="badge bg-white text-dark border shadow-xs text-start p-1.5 px-2 d-inline-flex align-items-center gap-1.5 rounded-2" style="font-size: 9px; max-width: 100%; border-left: 3px solid ${badgeColor} !important;">
                <i class="bi ${iconClass}" style="color: ${badgeColor}; font-size: 10px;"></i>
                <span>
                    <strong class="text-slate-800">${ann.dataName || ann.dataIndex}:</strong> 
                    <span class="text-secondary text-truncate ms-0.5" style="max-width: 160px;" title="${ann.note}">${ann.note}</span>
                </span>
                <button type="button" class="btn-close p-0 ms-1 delete-annotation-btn" data-chart-id="${chartConfig.id}" data-index="${index}" style="font-size: 7px; width: 8px; height: 8px;" title="Unpin / हटाएं"></button>
            </span>
        `;
    });
    html += `
        </div>
    </div>
    `;
    return html;
}

export async function openAnnotationModal(chartId: string, targetInfo: any): Promise<void> {
    const { loadDynamicContent } = await import('../layout/dynamicLoader.ts');
    await loadDynamicContent('chartAnnotationModal', 'chartAnnotationModal');
    
    currentAnnotationTarget = { chartId, ...targetInfo };
    
    const detailsEl = document.getElementById('annotationPointDetails');
    if (detailsEl) {
        detailsEl.innerHTML = `
            <div class="d-flex align-items-center justify-content-between text-xs">
                <div><i class="bi bi-geo-alt-fill text-danger me-1"></i> बिंदु: <b class="text-slate-900">${targetInfo.dataName || 'N/A'}</b> <span class="text-muted">(${targetInfo.seriesName || 'Series'})</span></div>
                <div><i class="bi bi-bar-chart-line-fill text-primary me-1"></i> मान: <b class="text-primary fw-bold">${targetInfo.value !== undefined ? targetInfo.value : 'N/A'}</b></div>
            </div>
        `;
    }
    
    const inputEl = document.getElementById('annotationNoteInput') as HTMLInputElement;
    if (inputEl) {
        inputEl.value = '';
    }
    
    let activeTag = 'ऐतिहासिक घटना';
    let activeIcon = 'bi-flag-fill';
    let activeColor = '#ef4444';

    // Tag pills click handler
    const tagPills = document.querySelectorAll('#quickAnnotationTagPills .tag-pill-btn');
    tagPills.forEach((pill: any) => {
        pill.onclick = () => {
            tagPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            activeTag = pill.getAttribute('data-tag') || 'ऐतिहासिक घटना';
            activeIcon = pill.getAttribute('data-icon') || 'bi-flag-fill';
            activeColor = pill.getAttribute('data-color') || '#ef4444';
            const colorInput = document.getElementById('annotationColorInput') as HTMLInputElement;
            if (colorInput) colorInput.value = activeColor;
        };
    });

    // Swatches handler
    const swatches = document.querySelectorAll('#quickPinColorSwatches .swatch-btn');
    swatches.forEach((swatch: any) => {
        swatch.onclick = () => {
            const hex = swatch.getAttribute('data-swatch');
            if (hex) {
                activeColor = hex;
                const colorInput = document.getElementById('annotationColorInput') as HTMLInputElement;
                if (colorInput) colorInput.value = hex;
            }
        };
    });

    const colorInput = document.getElementById('annotationColorInput') as HTMLInputElement;
    if (colorInput) {
        colorInput.onchange = (e: any) => {
            activeColor = e.target.value;
        };
    }

    // Bind event handler if not already done
    const saveBtn: any = document.getElementById('saveAnnotationBtn');
    if (saveBtn && !saveBtn.__annotationListenerBound) {
        saveBtn.addEventListener('click', async () => {
            const inputEl = document.getElementById('annotationNoteInput') as HTMLInputElement;
            if (!inputEl || !currentAnnotationTarget) return;
            
            const note = inputEl.value.trim();
            if (!note) {
                showMessage("कृपया कोई विवरण या टिप्पणी दर्ज करें।", "warning");
                return;
            }
            
            const { chartId, dataName, value, seriesIndex, seriesName, dataIndex } = currentAnnotationTarget;
            
            const chartConfig = visualizations.find(v => v.id === chartId);
            if (chartConfig) {
                chartConfig.annotations = chartConfig.annotations || [];
                chartConfig.annotations.push({
                    dataName,
                    value,
                    seriesIndex,
                    seriesName,
                    dataIndex,
                    tag: activeTag,
                    icon: activeIcon,
                    note,
                    color: activeColor,
                    createdAt: new Date().toISOString()
                });
                
                const modalEl = document.getElementById('chartAnnotationModal');
                if (modalEl && typeof bootstrap !== 'undefined') {
                    const bsModal = bootstrap.Modal.getInstance(modalEl);
                    bsModal?.hide();
                }
                
                // Re-plot this chart to show the annotation!
                plotChart(chartConfig);
                await saveDashboardSettings();
                showMessage("कॉलआउट लेबल सफलतापूर्वक पिन किया गया!", "success");
            }
        });
        saveBtn.__annotationListenerBound = true;
    }
    
    const modalEl = document.getElementById('chartAnnotationModal');
    if (modalEl && typeof bootstrap !== 'undefined') {
        const bsModal = bootstrap.Modal.getOrCreateInstance(modalEl);
        bsModal.show();
    }
}

// Re-render active charts smoothly on theme change
if (typeof window !== 'undefined') {
    let themeDebounceTimer: any = null;
    window.addEventListener('themeChanged', () => {
        clearTimeout(themeDebounceTimer);
        themeDebounceTimer = setTimeout(() => {
            try {
                if (typeof plotAll === 'function') {
                    plotAll();
                }
            } catch (e) {
                console.warn('[Charts] Theme refresh notice:', e);
            }
        }, 120);
    });
}

// Export ChartUtils for testing
export { ChartUtils };
