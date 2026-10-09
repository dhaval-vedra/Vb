// src/js/charts/chartTypeGallery.ts

declare const bootstrap: any;

declare global {
    interface Window {
        chartGalleryInstance?: ChartTypeGallery;
    }
}

export interface ChartTypeConfig {
    value: string;
    name: string;
    category: string;
    image?: string;
    englishName?: string;
}

export interface CategoryConfig {
    id: string;
    name: string;
    icon: string;
}

export interface ChartInfoDetail {
    description: string;
    xAxisReq: string;
    yAxisReq: string;
    zAxisReq: string;
    bestUses: string;
}

export interface GalleryConfig {
    galleryId?: string;
    selectId?: string;
    displayImageId?: string;
    zAxisContainerId?: string;
    modalId?: string;
    triggerButtonId?: string;
    modalGalleryId?: string;
    [key: string]: any;
}

export class ChartTypeGallery {
    config: Required<GalleryConfig>;
    isIndexPage: boolean;
    chartTypes: ChartTypeConfig[];
    categories: CategoryConfig[];
    currentFilter: string;
    searchTerm: string;
    selectedCategory: string;
    isOpen: boolean = false;
    backdropEl: HTMLElement | null = null;
    panelEl: HTMLElement | null = null;
    currentSelectedValue: string = 'bar';

    constructor(config: GalleryConfig = {}) {
        this.config = {
            galleryId: 'chartTypeGallery',
            selectId: 'chartType',
            displayImageId: 'selectedChartDisplayImage',
            zAxisContainerId: 'zAxisDropZoneContainer',
            modalId: 'chartGalleryModal',
            triggerButtonId: 'openChartGalleryBtn',
            modalGalleryId: 'chartGalleryModalContent',
            ...config
        };

        this.isIndexPage = this.checkIfIndexPage();

        if (!this.isIndexPage) {
            this.chartTypes = [];
            this.categories = [];
            this.currentFilter = 'all';
            this.searchTerm = '';
            this.selectedCategory = 'all';
            return;
        }

        this.chartTypes = [
            // Bar Charts
            { value: 'bar', name: 'साधारण बार', englishName: 'Column Bar', category: 'bar' },
            { value: 'stacked-bar', name: 'स्टैक्ड बार', englishName: 'Stacked Bar', category: 'bar' },
            { value: 'horizontal-bar', name: 'हॉरिजॉन्टल बार', englishName: 'Horizontal Bar', category: 'bar' },
            { value: 'grouped-bar', name: 'ग्रुप्ड बार', englishName: 'Grouped Bar', category: 'bar' },
            { value: 'bar3D', name: '3D बार चार्ट', englishName: '3D Bar Chart', category: 'bar' },

            // Line Charts
            { value: 'line', name: 'साधारण लाइन', englishName: 'Basic Line', category: 'line' },
            { value: 'smooth-line', name: 'स्मूद कर्व लाइन', englishName: 'Smooth Spline', category: 'line' },
            { value: 'area-line', name: 'एरिया लाइन', englishName: 'Area Chart', category: 'line' },
            { value: 'smooth-area', name: 'स्मूद एरिया', englishName: 'Smooth Area', category: 'line' },
            { value: 'stacked-line', name: 'स्टैक्ड लाइन', englishName: 'Stacked Line', category: 'line' },
            { value: 'stacked-area', name: 'स्टैक्ड एरिया', englishName: 'Stacked Area', category: 'line' },
            { value: 'gradient-area', name: 'ग्रेडिएंट एरिया', englishName: 'Gradient Area', category: 'line' },
            { value: 'step-line', name: 'स्टेप लाइन - मिडिल', englishName: 'Step Line', category: 'line' },
            { value: 'step-start-line', name: 'स्टेप लाइन - स्टार्ट', englishName: 'Step Start', category: 'line' },
            { value: 'step-end-line', name: 'स्टेप लाइन - एंड', englishName: 'Step End', category: 'line' },
            { value: 'dual-axis-line', name: 'डुअल Y-अक्ष लाइन', englishName: 'Dual Axis Line', category: 'line' },
            { value: 'confidence-band', name: 'कॉन्फिडेंस बैंड', englishName: 'Confidence Band', category: 'line' },
            { value: 'bump-line', name: 'बम्प / रैंकिंग लाइन', englishName: 'Bump / Ranking', category: 'line' },
            { value: 'polar-line', name: 'पोलर लाइन', englishName: 'Polar Line', category: 'line' },
            { value: 'timeseries-line', name: 'टाइम सीरीज़', englishName: 'Time Series + Zoom', category: 'line' },
            { value: 'markpoint-line', name: 'मार्कपॉइंट - Min/Max', englishName: 'Peak Callouts', category: 'line' },
            { value: 'markline-line', name: 'मार्कलाइन - ट्रेंड', englishName: 'Average Trend', category: 'line' },
            { value: 'line3D', name: '3D लाइन चार्ट', englishName: '3D Line Ribbon', category: 'line' },

            // Pie & Donut Charts
            { value: 'pie', name: 'साधारण पाई', englishName: 'Pie Chart', category: 'pie' },
            { value: 'doughnut', name: 'डोनट चार्ट', englishName: 'Donut Chart', category: 'pie' },
            { value: 'rose-radius', name: 'रोज़ (Radius)', englishName: 'Nightingale Radius', category: 'pie' },
            { value: 'rose-area', name: 'रोज़ (Area)', englishName: 'Nightingale Area', category: 'pie' },

            // Business & Pro Analytics
            { value: 'waterfall', name: 'वॉटफॉल (Waterfall)', englishName: 'Waterfall Variance', category: 'business' },
            { value: 'heatmap', name: 'हीटमैप (Heatmap)', englishName: 'Heatmap Matrix', category: 'business' },
            { value: 'sankey', name: 'सेंकी (Sankey)', englishName: 'Sankey Flow', category: 'business' },
            { value: 'bullet', name: 'बुलेट चार्ट (Bullet)', englishName: 'Target Bullet', category: 'business' },
            { value: 'boxplot', name: 'बॉक्सप्लॉट (Boxplot)', englishName: 'Box & Whisker', category: 'business' },

            // Other Specialized Charts
            { value: 'scatter', name: 'स्कैटर प्लॉट', englishName: 'Scatter Plot', category: 'other' },
            { value: 'bubble', name: 'बबल चार्ट', englishName: 'Bubble Chart', category: 'other' },
            { value: 'funnel', name: 'फ़नेल चार्ट', englishName: 'Funnel Stages', category: 'other' },
            { value: 'gauge', name: 'गेज मीटर', englishName: 'Speedometer Gauge', category: 'other' },
            { value: 'radar', name: 'राडार चार्ट', englishName: 'Radar Spider', category: 'other' },
            { value: 'treemap', name: 'ट्रीमैप', englishName: 'Hierarchical Treemap', category: 'other' },
            { value: 'candlestick', name: 'कैंडलस्टिक (Plotly)', englishName: 'Financial Candlestick', category: 'other' },
            { value: 'ohlc', name: 'OHLC (Plotly)', englishName: 'Open High Low Close', category: 'other' }
        ];

        this.categories = [
            { id: 'all', name: 'सभी', icon: '<i class="bi bi-grid-fill"></i>' },
            { id: 'bar', name: 'बार', icon: '<i class="bi bi-bar-chart-fill"></i>' },
            { id: 'line', name: 'लाइन', icon: '<i class="bi bi-graph-up"></i>' },
            { id: 'pie', name: 'पाई/डोनट', icon: '<i class="bi bi-pie-chart-fill"></i>' },
            { id: 'business', name: 'बिज़नेस', icon: '<i class="bi bi-briefcase-fill"></i>' },
            { id: 'other', name: 'अन्य', icon: '<i class="bi bi-collection-fill"></i>' }
        ];

        this.currentFilter = 'all';
        this.searchTerm = '';
        this.selectedCategory = 'all';

        this.init();
    }

    checkIfIndexPage(): boolean {
        const currentPath = window.location.pathname;
        const currentPage = currentPath.split('/').pop();

        return currentPage === 'index.html' ||
               currentPage === '' ||
               currentPage === 'index.htm' ||
               currentPath.endsWith('/') ||
               document.querySelector('body[data-page="index"]') !== null ||
               document.getElementById('indexPageIndicator') !== null;
    }

    init(): void {
        if (!this.isIndexPage) return;

        this.injectStyles();
        this.createSidebarGalleryPanel();
        this.bindTriggerButtons();
        this.bindEvents();
        this.initializeWithSavedSelection();
    }

    injectStyles(): void {
        if (document.getElementById('chart-gallery-styles')) return;

        const style = document.createElement('style');
        style.id = 'chart-gallery-styles';
        style.textContent = `
            /* Clean Sidebar-Sized Gallery Drawer */
            .chart-gallery-sidebar-panel {
                position: fixed;
                top: 0;
                right: 0;
                width: 350px;
                max-width: 92vw;
                height: 100vh;
                background-color: #ffffff;
                border-left: 1px solid #e2e8f0;
                box-shadow: -8px 0 25px rgba(15, 23, 42, 0.08);
                z-index: 1055;
                display: flex;
                flex-direction: column;
                transform: translateX(100%);
                transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease, right 0.25s ease;
                opacity: 0;
                pointer-events: none;
            }

            .chart-gallery-sidebar-panel.show {
                transform: translateX(0);
                opacity: 1;
                pointer-events: auto;
            }

            /* When offcanvas sidebar is active on desktop, dock seamlessly to its left! */
            @media (min-width: 992px) {
                #offcanvasSidebar.show ~ .chart-gallery-sidebar-panel.show,
                .chart-gallery-sidebar-panel.docked-to-sidebar.show {
                    right: 320px;
                    border-right: 1px solid #e2e8f0;
                }
            }

            /* Subtle Backdrop Overlay */
            .chart-gallery-backdrop {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: rgba(15, 23, 42, 0.3);
                backdrop-filter: blur(2px);
                z-index: 1054;
                opacity: 0;
                visibility: hidden;
                transition: opacity 0.2s ease, visibility 0.2s ease;
            }

            .chart-gallery-backdrop.show {
                opacity: 1;
                visibility: visible;
            }

            /* Header */
            .chart-gallery-header {
                padding: 12px 14px 8px 14px;
                background: #ffffff;
                border-bottom: 1px solid #e2e8f0;
                flex-shrink: 0;
            }

            .chart-gallery-title-bar {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 8px;
            }

            .chart-gallery-title {
                font-size: 13.5px;
                font-weight: 700;
                color: #0f172a;
                display: flex;
                align-items: center;
                gap: 6px;
                margin: 0;
            }

            .chart-gallery-badge {
                font-size: 10px;
                padding: 2px 7px;
                border-radius: 9999px;
                background: #f1f5f9;
                color: #475569;
                font-weight: 600;
                border: 1px solid #e2e8f0;
            }

            .chart-gallery-close-btn {
                background: transparent;
                border: none;
                width: 28px;
                height: 28px;
                border-radius: 6px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #64748b;
                font-size: 14px;
                cursor: pointer;
                transition: all 0.15s ease;
            }

            .chart-gallery-close-btn:hover {
                background: #f1f5f9;
                color: #0f172a;
            }

            /* Search Box */
            .chart-gallery-search-wrap {
                position: relative;
                margin-bottom: 8px;
            }

            .chart-gallery-search-input {
                width: 100%;
                font-size: 12px;
                padding: 6px 28px 6px 30px;
                border: 1px solid #cbd5e1;
                border-radius: 6px;
                background: #f8fafc;
                color: #0f172a;
                outline: none;
                transition: all 0.15s ease;
            }

            .chart-gallery-search-input:focus {
                background: #ffffff;
                border-color: #2563eb;
                box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15);
            }

            .chart-gallery-search-icon {
                position: absolute;
                left: 9px;
                top: 50%;
                transform: translateY(-50%);
                color: #94a3b8;
                font-size: 12px;
                pointer-events: none;
            }

            .chart-gallery-search-clear {
                position: absolute;
                right: 7px;
                top: 50%;
                transform: translateY(-50%);
                background: transparent;
                border: none;
                color: #94a3b8;
                font-size: 12px;
                cursor: pointer;
                padding: 0;
                display: none;
            }

            .chart-gallery-search-clear:hover {
                color: #475569;
            }

            /* Horizontal Segmented Category Navigation */
            .chart-gallery-category-nav {
                display: flex;
                gap: 5px;
                overflow-x: auto;
                padding-bottom: 3px;
                scrollbar-width: none;
                -ms-overflow-style: none;
            }

            .chart-gallery-category-nav::-webkit-scrollbar {
                display: none;
            }

            .chart-cat-pill {
                display: inline-flex;
                align-items: center;
                gap: 4px;
                padding: 4px 9px;
                font-size: 11px;
                font-weight: 600;
                color: #475569;
                background: #f1f5f9;
                border: 1px solid #e2e8f0;
                border-radius: 9999px;
                cursor: pointer;
                white-space: nowrap;
                transition: all 0.15s ease;
                flex-shrink: 0;
            }

            .chart-cat-pill:hover {
                background: #e2e8f0;
                color: #0f172a;
            }

            .chart-cat-pill.active {
                background: #2563eb;
                color: #ffffff;
                border-color: #2563eb;
            }

            /* Scrollable Cards Grid */
            .chart-gallery-body {
                flex: 1;
                overflow-y: auto;
                padding: 10px 12px;
                background: #f8fafc;
            }

            .chart-gallery-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 8px;
            }

            /* Individual Chart Card */
            .chart-type-item {
                background: #ffffff;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                padding: 8px 6px;
                cursor: pointer;
                display: flex;
                flex-direction: column;
                align-items: center;
                text-align: center;
                position: relative;
                transition: border-color 0.15s ease, background-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease;
                user-select: none;
            }

            .chart-type-item:hover {
                border-color: #3b82f6;
                background: #ffffff;
                box-shadow: 0 4px 12px rgba(37, 99, 235, 0.08);
                transform: translateY(-1px);
            }

            .chart-type-item.selected {
                border: 2px solid #2563eb;
                background: #eff6ff;
                box-shadow: 0 2px 8px rgba(37, 99, 235, 0.15);
            }

            .chart-type-item.selected::after {
                content: '✓';
                position: absolute;
                top: 4px;
                left: 5px;
                width: 15px;
                height: 15px;
                background: #2563eb;
                color: #ffffff;
                font-size: 9px;
                font-weight: 700;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                line-height: 1;
            }

            .chart-thumb-wrap {
                width: 100%;
                height: 52px;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-bottom: 6px;
                border-radius: 5px;
                background: #f8fafc;
                border: 1px solid #f1f5f9;
                overflow: hidden;
            }

            .chart-thumb-wrap img {
                max-width: 100%;
                max-height: 100%;
                object-fit: contain;
                display: block;
            }

            .chart-item-name {
                font-size: 11px;
                font-weight: 600;
                color: #1e293b;
                line-height: 1.25;
                margin-bottom: 2px;
                width: 100%;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .chart-item-sub {
                font-size: 9.5px;
                color: #64748b;
                line-height: 1.2;
                width: 100%;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .btn-chart-info-trigger {
                position: absolute;
                top: 4px;
                right: 4px;
                width: 18px;
                height: 18px;
                border-radius: 50%;
                background: #ffffff;
                border: 1px solid #cbd5e1;
                color: #64748b;
                font-size: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all 0.15s ease;
                padding: 0;
                z-index: 2;
            }

            .btn-chart-info-trigger:hover {
                background: #2563eb;
                border-color: #2563eb;
                color: #ffffff;
            }

            /* Footer Bar */
            .chart-gallery-footer {
                padding: 8px 14px;
                background: #ffffff;
                border-top: 1px solid #e2e8f0;
                display: flex;
                align-items: center;
                justify-content: space-between;
                flex-shrink: 0;
            }

            .chart-gallery-footer-info {
                font-size: 11px;
                color: #64748b;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                max-width: 190px;
            }

            .chart-gallery-footer-info strong {
                color: #2563eb;
            }

            /* Info Slide-Up Drawer / Bottom Sheet */
            .chart-info-sheet {
                position: absolute;
                bottom: 0;
                left: 0;
                width: 100%;
                background: #ffffff;
                border-top: 1px solid #e2e8f0;
                box-shadow: 0 -6px 20px rgba(0, 0, 0, 0.1);
                border-radius: 12px 12px 0 0;
                padding: 14px 14px 12px 14px;
                transform: translateY(105%);
                transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1);
                z-index: 10;
                display: flex;
                flex-direction: column;
                max-height: 85%;
                overflow-y: auto;
            }

            .chart-info-sheet.open {
                transform: translateY(0);
            }

            .chart-info-sheet-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 8px;
            }

            /* Dark Theme Adaptations */
            body.dark-theme .chart-gallery-sidebar-panel {
                background-color: #0f172a;
                border-left-color: #1e293b;
                border-right-color: #1e293b;
                box-shadow: -8px 0 25px rgba(0, 0, 0, 0.35);
            }

            body.dark-theme .chart-gallery-header,
            body.dark-theme .chart-gallery-footer,
            body.dark-theme .chart-info-sheet {
                background-color: #0f172a;
                border-color: #1e293b;
            }

            body.dark-theme .chart-gallery-body {
                background-color: #090d16;
            }

            body.dark-theme .chart-gallery-title,
            body.dark-theme .chart-item-name {
                color: #f1f5f9;
            }

            body.dark-theme .chart-gallery-badge,
            body.dark-theme .chart-cat-pill {
                background: #1e293b;
                border-color: #334155;
                color: #cbd5e1;
            }

            body.dark-theme .chart-cat-pill.active {
                background: #2563eb;
                color: #ffffff;
                border-color: #2563eb;
            }

            body.dark-theme .chart-gallery-search-input {
                background: #1e293b;
                border-color: #334155;
                color: #f1f5f9;
            }

            body.dark-theme .chart-type-item {
                background: #1e293b;
                border-color: #334155;
            }

            body.dark-theme .chart-thumb-wrap {
                background: #0f172a;
                border-color: #1e293b;
            }

            body.dark-theme .chart-type-item:hover {
                border-color: #3b82f6;
                background: #1e293b;
            }

            body.dark-theme .chart-type-item.selected {
                background: rgba(37, 99, 235, 0.15);
                border-color: #3b82f6;
            }

            body.dark-theme .btn-chart-info-trigger {
                background: #1e293b;
                border-color: #475569;
                color: #94a3b8;
            }
        `;

        document.head.appendChild(style);
    }

    createSidebarGalleryPanel(): void {
        const existingPanel = document.getElementById(this.config.modalId);
        if (existingPanel) {
            existingPanel.remove();
        }

        const existingBackdrop = document.getElementById('chartGalleryBackdrop');
        if (existingBackdrop) {
            existingBackdrop.remove();
        }

        // 1. Create Backdrop
        const backdrop = document.createElement('div');
        backdrop.id = 'chartGalleryBackdrop';
        backdrop.className = 'chart-gallery-backdrop';
        document.body.appendChild(backdrop);
        this.backdropEl = backdrop;

        // 2. Create Sidebar-Sized Gallery Panel
        const panel = document.createElement('div');
        panel.id = this.config.modalId;
        panel.className = 'chart-gallery-sidebar-panel';
        panel.setAttribute('role', 'dialog');
        panel.setAttribute('aria-modal', 'true');
        panel.setAttribute('aria-label', 'चार्ट प्रकार चुनें');

        panel.innerHTML = `
            <!-- Header -->
            <div class="chart-gallery-header">
                <div class="chart-gallery-title-bar">
                    <div class="chart-gallery-title">
                        <i class="bi bi-grid-3x3-gap-fill text-primary"></i>
                        <span>चार्ट गैलरी</span>
                        <span class="chart-gallery-badge" id="chartGalleryCountBadge">${this.chartTypes.length}</span>
                    </div>
                    <button type="button" class="chart-gallery-close-btn" id="chartGalleryCloseBtn" title="बंद करें (Esc)" aria-label="Close">
                        <i class="bi bi-x-lg"></i>
                    </button>
                </div>

                <!-- Search Input -->
                <div class="chart-gallery-search-wrap">
                    <i class="bi bi-search chart-gallery-search-icon"></i>
                    <input type="text" id="chartSearch" class="chart-gallery-search-input" placeholder="चार्ट खोजें (उदा. Bar, Line, Pie)..." autocomplete="off">
                    <button type="button" class="chart-gallery-search-clear" id="chartSearchClearBtn" title="साफ़ करें">✕</button>
                </div>

                <!-- Category Navigation Pills -->
                <div class="chart-gallery-category-nav" id="categoryNavigation"></div>
            </div>

            <!-- Body Grid -->
            <div class="chart-gallery-body">
                <div id="${this.config.modalGalleryId}" class="chart-gallery-grid"></div>
            </div>

            <!-- Footer -->
            <div class="chart-gallery-footer">
                <div class="chart-gallery-footer-info" id="chartGallerySelectedStatus">
                    चयनित: <strong id="gallerySelectedChartName">साधारण बार</strong>
                </div>
                <button type="button" class="btn btn-xs btn-outline-secondary px-2.5 py-1 fw-semibold text-2xs rounded-2" id="chartGalleryDoneBtn">
                    बंद करें
                </button>
            </div>

            <!-- Info Slide-up Sheet -->
            <div class="chart-info-sheet" id="chartInfoSheet">
                <div class="chart-info-sheet-header">
                    <div class="d-flex align-items-center gap-2">
                        <i class="bi bi-info-circle-fill text-primary"></i>
                        <span class="fw-bold text-xs text-dark" id="infoSheetTitle">चार्ट जानकारी</span>
                    </div>
                    <button type="button" class="btn-close text-2xs" id="closeInfoSheetBtn" aria-label="Close"></button>
                </div>
                <div class="text-xs text-muted mb-2" id="infoSheetDesc" style="line-height: 1.45;"></div>
                
                <div class="p-2 rounded bg-light border text-2xs mb-2">
                    <div class="mb-1"><strong>X-अक्ष:</strong> <span id="infoSheetX" class="text-secondary"></span></div>
                    <div class="mb-1"><strong>Y-अक्ष:</strong> <span id="infoSheetY" class="text-secondary"></span></div>
                    <div id="infoSheetZWrap"><strong>Z-अक्ष:</strong> <span id="infoSheetZ" class="text-secondary"></span></div>
                </div>

                <div class="text-2xs mb-3 text-secondary">
                    <strong class="text-success"><i class="bi bi-check-circle me-1"></i>उपयोग:</strong>
                    <span id="infoSheetUses"></span>
                </div>

                <button type="button" class="btn btn-sm btn-primary w-100 fw-semibold text-xs py-1" id="selectFromInfoSheetBtn">
                    <i class="bi bi-check2 me-1"></i> यह चार्ट लागू करें
                </button>
            </div>
        `;

        document.body.appendChild(panel);
        this.panelEl = panel;

        this.createCategoryNavigation();
        this.createGallery();
    }

    createCategoryNavigation(): void {
        const categoryNav = document.getElementById('categoryNavigation');
        if (!categoryNav) return;

        categoryNav.innerHTML = '';

        this.categories.forEach(category => {
            const pill = document.createElement('button');
            pill.type = 'button';
            pill.className = `chart-cat-pill ${category.id === this.selectedCategory ? 'active' : ''}`;
            pill.dataset.category = category.id;
            pill.innerHTML = `${category.icon} <span>${category.name}</span>`;
            categoryNav.appendChild(pill);
        });
    }

    bindTriggerButtons(): void {
        // Bind to existing or newly created openChartGalleryBtn
        const triggerButton = document.getElementById(this.config.triggerButtonId);
        if (triggerButton) {
            triggerButton.onclick = (e) => {
                e.preventDefault();
                this.openGallery();
            };
        }
    }

    createGallery(): void {
        const modalGallery = document.getElementById(this.config.modalGalleryId);
        if (!modalGallery) return;

        modalGallery.innerHTML = '';

        const filteredCharts = this.getFilteredCharts();

        const countBadge = document.getElementById('chartGalleryCountBadge');
        if (countBadge) {
            countBadge.textContent = `${filteredCharts.length}`;
        }

        if (filteredCharts.length === 0) {
            modalGallery.innerHTML = `
                <div style="grid-column: 1 / -1; padding: 30px 10px; text-align: center; color: #94a3b8;">
                    <i class="bi bi-search fs-4 d-block mb-1"></i>
                    <span class="text-xs fw-medium">कोई चार्ट नहीं मिला</span>
                </div>
            `;
            return;
        }

        filteredCharts.forEach(chart => {
            const item = this.createChartItem(chart);
            modalGallery.appendChild(item);
        });
    }

    createChartItem(chart: ChartTypeConfig): HTMLElement {
        const item = document.createElement('div');
        item.className = `chart-type-item ${chart.value === this.currentSelectedValue ? 'selected' : ''}`;
        item.dataset.value = chart.value;
        item.dataset.category = chart.category;

        const thumbWrap = document.createElement('div');
        thumbWrap.className = 'chart-thumb-wrap';

        const img = document.createElement('img');
        img.src = this.getChartImage(chart.value);
        img.alt = chart.name;
        img.loading = 'lazy';
        thumbWrap.appendChild(img);

        const nameSpan = document.createElement('span');
        nameSpan.className = 'chart-item-name';
        nameSpan.textContent = chart.name;

        const subSpan = document.createElement('span');
        subSpan.className = 'chart-item-sub';
        subSpan.textContent = chart.englishName || chart.category;

        const infoBtn = document.createElement('button');
        infoBtn.type = 'button';
        infoBtn.className = 'btn-chart-info-trigger';
        infoBtn.title = `${chart.name} विवरण`;
        infoBtn.innerHTML = '<i class="bi bi-info"></i>';
        infoBtn.dataset.chartValue = chart.value;

        item.appendChild(thumbWrap);
        item.appendChild(nameSpan);
        item.appendChild(subSpan);
        item.appendChild(infoBtn);

        return item;
    }

    bindEvents(): void {
        // Backdrop Click Closes Gallery
        if (this.backdropEl) {
            this.backdropEl.onclick = () => this.closeGallery();
        }

        // Close Button
        const closeBtn = document.getElementById('chartGalleryCloseBtn');
        if (closeBtn) {
            closeBtn.onclick = () => this.closeGallery();
        }

        const doneBtn = document.getElementById('chartGalleryDoneBtn');
        if (doneBtn) {
            doneBtn.onclick = () => this.closeGallery();
        }

        // Escape Key Closes Gallery
        document.addEventListener('keydown', (e: KeyboardEvent) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.closeGallery();
            }
        });

        // Search Input
        const searchInput = document.getElementById('chartSearch') as HTMLInputElement | null;
        const searchClearBtn = document.getElementById('chartSearchClearBtn');

        if (searchInput) {
            searchInput.addEventListener('input', (e: Event) => {
                const target = e.target as HTMLInputElement;
                this.searchTerm = target.value.trim().toLowerCase();
                if (searchClearBtn) {
                    searchClearBtn.style.display = this.searchTerm ? 'block' : 'none';
                }
                this.createGallery();
            });
        }

        if (searchClearBtn && searchInput) {
            searchClearBtn.onclick = () => {
                searchInput.value = '';
                this.searchTerm = '';
                searchClearBtn.style.display = 'none';
                this.createGallery();
                searchInput.focus();
            };
        }

        // Category Navigation
        const categoryNav = document.getElementById('categoryNavigation');
        if (categoryNav) {
            categoryNav.addEventListener('click', (e: MouseEvent) => {
                const target = e.target as HTMLElement;
                const pill = target.closest('.chart-cat-pill') as HTMLElement | null;
                if (!pill || !pill.dataset.category) return;

                this.selectedCategory = pill.dataset.category;
                document.querySelectorAll('.chart-cat-pill').forEach(btn => {
                    btn.classList.toggle('active', (btn as HTMLElement).dataset.category === this.selectedCategory);
                });
                this.createGallery();
            });
        }

        // Gallery Items Click & Info Click
        const modalGallery = document.getElementById(this.config.modalGalleryId);
        if (modalGallery) {
            modalGallery.addEventListener('click', (e: MouseEvent) => {
                const target = e.target as HTMLElement;

                // Check info button click
                const infoBtn = target.closest('.btn-chart-info-trigger') as HTMLElement | null;
                if (infoBtn && infoBtn.dataset.chartValue) {
                    e.stopPropagation();
                    this.showInfoSheet(infoBtn.dataset.chartValue);
                    return;
                }

                // Check chart item card click
                const card = target.closest('.chart-type-item') as HTMLElement | null;
                if (!card || !card.dataset.value) return;

                this.selectChart(card.dataset.value);
            });
        }

        // Info Sheet Close & Select
        const closeInfoSheetBtn = document.getElementById('closeInfoSheetBtn');
        if (closeInfoSheetBtn) {
            closeInfoSheetBtn.onclick = () => this.hideInfoSheet();
        }

        const selectFromInfoSheetBtn = document.getElementById('selectFromInfoSheetBtn');
        if (selectFromInfoSheetBtn) {
            selectFromInfoSheetBtn.onclick = () => {
                const val = (selectFromInfoSheetBtn as any)._chartValue;
                if (val) {
                    this.selectChart(val);
                }
                this.hideInfoSheet();
            };
        }

        // Sync with any direct change on select element
        const selectEl = document.getElementById(this.config.selectId) as HTMLSelectElement | null;
        if (selectEl) {
            selectEl.addEventListener('change', () => {
                this.currentSelectedValue = selectEl.value;
                this.updateSelectedCardStyles();
                this.updateSelectedDisplayImage(selectEl.value);
            });
        }
    }

    openGallery(): void {
        if (!this.panelEl || !this.backdropEl) {
            this.createSidebarGalleryPanel();
        }

        // Check if offcanvas sidebar is currently open to dock smoothly beside it
        const offcanvas = document.getElementById('offcanvasSidebar');
        const isSidebarOpen = offcanvas && offcanvas.classList.contains('show');

        if (this.panelEl) {
            if (isSidebarOpen && window.innerWidth >= 992) {
                this.panelEl.classList.add('docked-to-sidebar');
            } else {
                this.panelEl.classList.remove('docked-to-sidebar');
            }
            this.panelEl.classList.add('show');
        }

        if (this.backdropEl) {
            this.backdropEl.classList.add('show');
        }

        this.isOpen = true;
        this.updateSelectedCardStyles();
    }

    closeGallery(): void {
        if (this.panelEl) {
            this.panelEl.classList.remove('show');
        }
        if (this.backdropEl) {
            this.backdropEl.classList.remove('show');
        }
        this.hideInfoSheet();
        this.isOpen = false;
    }

    // Modal compatibility for legacy bootstrap modal callers
    openModal(): void {
        this.openGallery();
    }

    selectChart(chartValue: string): void {
        this.currentSelectedValue = chartValue;
        const chart = this.chartTypes.find(c => c.value === chartValue);
        if (!chart) return;

        // 1. Update <select id="chartType">
        const chartTypeSelect = document.getElementById(this.config.selectId) as HTMLSelectElement | null;
        if (chartTypeSelect) {
            if (!Array.from(chartTypeSelect.options).some(opt => opt.value === chartValue)) {
                const newOpt = document.createElement('option');
                newOpt.value = chartValue;
                newOpt.textContent = chart.name;
                chartTypeSelect.appendChild(newOpt);
            }
            chartTypeSelect.value = chartValue;
            chartTypeSelect.dispatchEvent(new Event('change', { bubbles: true }));
        }

        // 2. Update Preview Image in Sidebar
        this.updateSelectedDisplayImage(chartValue);

        // 3. Handle 3D Dropzone Toggle
        this.handle3DCharts(chartValue);

        // 4. Update Selected Card in Gallery Grid
        this.updateSelectedCardStyles();

        // 5. Update Status in Footer
        const statusEl = document.getElementById('gallerySelectedChartName');
        if (statusEl) {
            statusEl.textContent = chart.name;
        }

        // 6. Save in localStorage
        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem('selectedChartType', chartValue);
            }
        } catch (_) {}

        // 7. Auto close gallery with smooth feedback
        setTimeout(() => {
            this.closeGallery();
        }, 180);
    }

    updateSelectedCardStyles(): void {
        document.querySelectorAll('.chart-type-item').forEach(card => {
            const htmlCard = card as HTMLElement;
            const isSelected = htmlCard.dataset.value === this.currentSelectedValue;
            htmlCard.classList.toggle('selected', isSelected);
        });

        const statusEl = document.getElementById('gallerySelectedChartName');
        if (statusEl) {
            const currentChart = this.chartTypes.find(c => c.value === this.currentSelectedValue);
            if (currentChart) {
                statusEl.textContent = currentChart.name;
            }
        }
    }

    updateSelectedDisplayImage(chartValue: string): void {
        const displayImg = document.getElementById(this.config.displayImageId) as HTMLImageElement | null;
        if (displayImg) {
            displayImg.src = this.getChartImage(chartValue);
            displayImg.style.display = 'block';
            displayImg.alt = chartValue;
        }
    }

    handle3DCharts(chartValue: string): void {
        const zAxisContainer = document.getElementById(this.config.zAxisContainerId);
        if (zAxisContainer) {
            zAxisContainer.style.display = (chartValue === 'bar3D' || chartValue === 'line3D') ? 'block' : 'none';
        }
    }

    showInfoSheet(chartValue: string): void {
        const chart = this.chartTypes.find(c => c.value === chartValue);
        if (!chart) return;

        const info = this.getChartInfo(chartValue);
        const sheet = document.getElementById('chartInfoSheet');
        if (!sheet) return;

        const titleEl = document.getElementById('infoSheetTitle');
        if (titleEl) titleEl.textContent = `${chart.name} (${chart.englishName || ''})`;

        const descEl = document.getElementById('infoSheetDesc');
        if (descEl) descEl.textContent = info.description;

        const xEl = document.getElementById('infoSheetX');
        if (xEl) xEl.textContent = info.xAxisReq;

        const yEl = document.getElementById('infoSheetY');
        if (yEl) yEl.textContent = info.yAxisReq;

        const zEl = document.getElementById('infoSheetZ');
        const zWrap = document.getElementById('infoSheetZWrap');
        if (zEl && zWrap) {
            zEl.textContent = info.zAxisReq;
            zWrap.style.display = info.zAxisReq !== 'आवश्यक नहीं' ? 'block' : 'none';
        }

        const usesEl = document.getElementById('infoSheetUses');
        if (usesEl) usesEl.textContent = info.bestUses;

        const selectBtn = document.getElementById('selectFromInfoSheetBtn');
        if (selectBtn) {
            (selectBtn as any)._chartValue = chartValue;
        }

        sheet.classList.add('open');
    }

    hideInfoSheet(): void {
        const sheet = document.getElementById('chartInfoSheet');
        if (sheet) {
            sheet.classList.remove('open');
        }
    }

    initializeWithSavedSelection(): void {
        try {
            const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('selectedChartType') : null;
            const selectEl = document.getElementById(this.config.selectId) as HTMLSelectElement | null;
            const initialVal = (saved && this.chartTypes.some(c => c.value === saved)) ? saved : (selectEl?.value || 'bar');
            this.currentSelectedValue = initialVal;
            this.updateSelectedDisplayImage(initialVal);
            this.updateSelectedCardStyles();
        } catch (_) {}
    }

    getFilteredCharts(): ChartTypeConfig[] {
        return this.chartTypes.filter(chart => {
            const matchesCategory = this.selectedCategory === 'all' || chart.category === this.selectedCategory;
            const matchesSearch = !this.searchTerm ||
                chart.name.toLowerCase().includes(this.searchTerm) ||
                (chart.englishName && chart.englishName.toLowerCase().includes(this.searchTerm)) ||
                chart.value.toLowerCase().includes(this.searchTerm);
            return matchesCategory && matchesSearch;
        });
    }

    getCategoryName(catId: string): string {
        const c = this.categories.find(cat => cat.id === catId);
        return c ? c.name : catId;
    }

    getChartInfo(type: string): ChartInfoDetail {
        const defaultInfo: ChartInfoDetail = {
            description: 'डेटा विश्लेषण और प्रस्तुति के लिए एक मानक चार्ट प्रकार।',
            xAxisReq: 'श्रेणी / नाम (Category/Dimension)',
            yAxisReq: 'संख्यात्मक मान (Metric/Measure)',
            zAxisReq: 'आवश्यक नहीं',
            bestUses: 'डेटा तुलना, रुझान और वितरण'
        };

        const infoMap: Record<string, ChartInfoDetail> = {
            'bar': {
                description: 'विभिन्न श्रेणियों के बीच मानों की सीधी तुलना के लिए सबसे लोकप्रिय चार्ट।',
                xAxisReq: 'श्रेणी (जैसे: उत्पाद, माह, क्षेत्र)',
                yAxisReq: 'संख्यात्मक मान (जैसे: बिक्री, राजस्व)',
                zAxisReq: 'आवश्यक नहीं',
                bestUses: 'बिक्री तुलना, रैंकिंग, श्रेणीवार प्रदर्शन'
            },
            'stacked-bar': {
                description: 'कुल मान के साथ-साथ उप-श्रेणियों का योगदान एक ही बार में दिखाता है।',
                xAxisReq: 'मुख्य श्रेणी',
                yAxisReq: '2 या अधिक संख्यात्मक कॉलम',
                zAxisReq: 'आवश्यक नहीं',
                bestUses: 'हिस्सेदारी विश्लेषण, कुल योग व घटक'
            },
            'horizontal-bar': {
                description: 'क्षैतिज बार जो लंबी श्रेणी के नामों को आसानी से पढ़ने में मदद करते हैं।',
                xAxisReq: 'संख्यात्मक मान (पैमाना)',
                yAxisReq: 'श्रेणी का नाम (लंबे लेबल)',
                zAxisReq: 'आवश्यक नहीं',
                bestUses: 'लीडरबोर्ड, सर्वे परिणाम, रैंकिंग'
            },
            'grouped-bar': {
                description: 'समानांतर बार द्वारा कई डेटा सीरीज़ की आमने-सामने तुलना।',
                xAxisReq: 'मुख्य श्रेणी',
                yAxisReq: '2+ संख्यात्मक मान',
                zAxisReq: 'आवश्यक नहीं',
                bestUses: 'वर्ष-दर-वर्ष तुलना, समूह विश्लेषण'
            },
            'bar3D': {
                description: 'X, Y और Z तीनों अक्षों पर त्रिविमीय (3D) बार बनाकर जटिल डेटा प्रदर्शित करता है।',
                xAxisReq: 'X-अक्ष श्रेणी',
                yAxisReq: 'Y-अक्ष श्रेणी',
                zAxisReq: 'Z-अक्ष संख्यात्मक ऊंचाई',
                bestUses: '3D मैट्रिक्स तुलना, बहुआयामी विश्लेषण'
            },
            'line': {
                description: 'समय या क्रमबद्ध डेटा के साथ मानों में बदलाव और रुझान (Trends) प्रदर्शित करता है।',
                xAxisReq: 'समय / तारीख / क्रम',
                yAxisReq: 'संख्यात्मक मान',
                zAxisReq: 'आवश्यक नहीं',
                bestUses: 'टाइम सीरीज़, प्रगति, रुझान'
            },
            'smooth-line': {
                description: 'बिंदुओं को स्मूद वक्र से जोड़कर डेटा का सुंदर प्रवाह दिखाता है।',
                xAxisReq: 'समय / श्रेणी',
                yAxisReq: 'संख्यात्मक मान',
                zAxisReq: 'आवश्यक नहीं',
                bestUses: 'सतत रुझान, एग्जीक्यूटिव डैशबोर्ड'
            },
            'area-line': {
                description: 'लाइन के नीचे का क्षेत्र शेड करके वॉल्यूम और संचयी मात्रा दर्शाता है।',
                xAxisReq: 'समय / श्रेणी',
                yAxisReq: 'संख्यात्मक मान',
                zAxisReq: 'आवश्यक नहीं',
                bestUses: 'वॉल्यूम ट्रैकिंग, संचयी रुझान'
            },
            'smooth-area': {
                description: 'स्मूद वक्र और ग्रेडिएंट क्षेत्र का संयोजन जो आधुनिक लुक देता है।',
                xAxisReq: 'समय / श्रेणी',
                yAxisReq: 'संख्यात्मक मान',
                zAxisReq: 'आवश्यक नहीं',
                bestUses: 'ट्रेंड विश्लेषण, मुख्य समरी'
            },
            'stacked-line': {
                description: 'कई रेखाओं को जोड़कर कुल योग और अलग-अलग रेखाओं का रुझान दिखाता है।',
                xAxisReq: 'समय / श्रेणी',
                yAxisReq: 'कई संख्यात्मक कॉलम',
                zAxisReq: 'आवश्यक नहीं',
                bestUses: 'कुल में घटकों का ट्रेंड'
            },
            'stacked-area': {
                description: 'परतदार एरिया चार्ट्स जो समय के साथ कुल योग और उसके भागों को दिखाते हैं।',
                xAxisReq: 'समय / श्रेणी',
                yAxisReq: 'कई संख्यात्मक कॉलम',
                zAxisReq: 'आवश्यक नहीं',
                bestUses: 'मार्केट शेयर, आय के स्रोत'
            },
            'gradient-area': {
                description: 'सुंदर रंगीन ग्रेडिएंट के साथ एरिया चार्ट जो प्रीमियम लुक देता है।',
                xAxisReq: 'समय / श्रेणी',
                yAxisReq: 'संख्यात्मक मान',
                zAxisReq: 'आवश्यक नहीं',
                bestUses: 'प्रीमियम डैशबोर्ड, रिपोर्टिंग'
            },
            'step-line': {
                description: 'डेटा में तात्कालिक परिवर्तनों को सीढ़ीनुमा रेखा से दिखाता है।',
                xAxisReq: 'समय / चरण',
                yAxisReq: 'संख्यात्मक मान',
                zAxisReq: 'आवश्यक नहीं',
                bestUses: 'मूल्य परिवर्तन, इन्वेंटरी स्तर'
            },
            'dual-axis-line': {
                description: 'दो अलग-अलग पैमानों (Y1 और Y2) पर दो स्वतंत्र डेटा सीरीज़ की तुलना।',
                xAxisReq: 'साझा श्रेणी',
                yAxisReq: '2 संख्यात्मक मान (अलग स्केल्स)',
                zAxisReq: 'आवश्यक नहीं',
                bestUses: 'बिक्री बनाम लाभ मार्जिन, तापमान बनाम वर्षा'
            },
            'confidence-band': {
                description: 'मुख्य लाइन के साथ संभावित उतार-चढ़ाव या अनिश्चितता की सीमा दिखाता है।',
                xAxisReq: 'समय / श्रेणी',
                yAxisReq: 'औसत व सीमा मान',
                zAxisReq: 'आवश्यक नहीं',
                bestUses: 'पूर्वानुमान (Forecast), सांख्यिकी'
            },
            'bump-line': {
                description: 'विभिन्न संस्थाओं या श्रेणियों की रैंकिंग में बदलाव को दिखाता है।',
                xAxisReq: 'समय / चरण',
                yAxisReq: 'रैंकिंग स्थिति (1, 2, 3...)',
                zAxisReq: 'आवश्यक नहीं',
                bestUses: 'प्रतियोगिता रैंकिंग, स्पोर्ट्स स्टैंडिंग'
            },
            'polar-line': {
                description: 'ध्रुवीय (Polar) निर्देशांक ग्रिड पर चक्रीय डेटा का दृश्य।',
                xAxisReq: 'कोण / दिशा / श्रेणी',
                yAxisReq: 'दूरी / मान',
                zAxisReq: 'आवश्यक नहीं',
                bestUses: 'हवा की दिशा, 24-घंटे का चक्र'
            },
            'timeseries-line': {
                description: 'ज़ूम और पैन स्लाइडर के साथ विस्तृत समय-श्रृंखला डेटा चार्ट।',
                xAxisReq: 'तारीख / समय',
                yAxisReq: 'संख्यात्मक मान',
                zAxisReq: 'आवश्यक नहीं',
                bestUses: 'स्टॉक डेटा, सेंसर लॉग्स, वार्षिक रुझान'
            },
            'markpoint-line': {
                description: 'न्यूनतम और अधिकतम शीर्ष बिंदुओं पर विशेष हाइलाइट कॉलआउट्स।',
                xAxisReq: 'समय / श्रेणी',
                yAxisReq: 'संख्यात्मक मान',
                zAxisReq: 'आवश्यक नहीं',
                bestUses: 'ऑल-टाइम हाई, लो पॉइंट्स की पहचान'
            },
            'markline-line': {
                description: 'औसत (Average) या लक्ष्य संदर्भ रेखा के साथ तुलनात्मक लाइन।',
                xAxisReq: 'समय / श्रेणी',
                yAxisReq: 'संख्यात्मक मान',
                zAxisReq: 'आवश्यक नहीं',
                bestUses: 'KPI लक्ष्य तुलना, बेंचमार्क'
            },
            'pie': {
                description: 'कुल 100% हिस्सेदारी में प्रत्येक श्रेणी का आनुपातिक हिस्सा।',
                xAxisReq: 'श्रेणी (Label)',
                yAxisReq: 'संख्यात्मक मान (Value)',
                zAxisReq: 'आवश्यक नहीं',
                bestUses: 'बजट वितरण, जनसांख्यिकी'
            },
            'doughnut': {
                description: 'केंद्र में रिक्त स्थान वाला आधुनिक पाई चार्ट जो पढ़ने में सुगम है।',
                xAxisReq: 'श्रेणी (Label)',
                yAxisReq: 'संख्यात्मक मान',
                zAxisReq: 'आवश्यक नहीं',
                bestUses: 'पोर्टफोलियो, स्थिति वितरण'
            },
            'rose-radius': {
                description: 'फ्लोरेंस नाइटिंगेल रोज़ चार्ट जो त्रिज्या की भिन्नता से मान दिखाता है।',
                xAxisReq: 'श्रेणी / माह',
                yAxisReq: 'संख्यात्मक मान',
                zAxisReq: 'आवश्यक नहीं',
                bestUses: 'मौसमी डेटा, बहु-आयामी वितरण'
            },
            'scatter': {
                description: 'दो संख्यात्मक चरों के बीच सहसंबंध (Correlation) जांचने के लिए।',
                xAxisReq: 'संख्यात्मक चर 1 (X)',
                yAxisReq: 'संख्यात्मक चर 2 (Y)',
                zAxisReq: 'आवश्यक नहीं',
                bestUses: 'वैज्ञानिक डेटा, सांख्यिकीय संबंध'
            },
            'bubble': {
                description: 'तीन आयामों (X, Y, और बबल का आकार) को एक साथ प्रदर्शित करता है।',
                xAxisReq: 'X मान',
                yAxisReq: 'Y मान',
                zAxisReq: 'बबल आकार (Size)',
                bestUses: 'बाजार विभाजन, जोखिम विश्लेषण'
            },
            'funnel': {
                description: 'चरण-दर-चरण प्रक्रिया में रूपांतरण और ड्रॉप-ऑफ दर दर्शाता है।',
                xAxisReq: 'प्रक्रिया चरण',
                yAxisReq: 'काउंट / मात्रा',
                zAxisReq: 'आवश्यक नहीं',
                bestUses: 'सेल्स फ़नेल, वेबसाइट कन्वर्जन'
            },
            'gauge': {
                description: 'स्पीडोमीटर मीटर डायल जो एकल KPI या लक्ष्य की स्थिति दर्शाता है।',
                xAxisReq: 'लेबल / मीट्रिक नाम',
                yAxisReq: 'वर्तमान स्कोर / मान',
                zAxisReq: 'अधिकतम लक्ष्य (वैकल्पिक)',
                bestUses: 'संतुष्टि स्कोर, लक्ष्य प्रगति'
            },
            'radar': {
                description: 'कई विशेषताओं या मानदंडों पर संस्थाओं की बहुआयामी तुलना।',
                xAxisReq: 'मानदंड / विशेषताएँ',
                yAxisReq: 'स्कोर (0-100)',
                zAxisReq: 'आवश्यक नहीं',
                bestUses: 'कर्मचारी मूल्यांकन, उत्पाद तुलना'
            },
            'treemap': {
                description: 'नेस्टेड आयताकार ब्लॉक जो पदानुक्रम और आकार का अनुपात दिखाते हैं।',
                xAxisReq: 'श्रेणी / नाम',
                yAxisReq: 'संख्यात्मक आकार',
                zAxisReq: 'आवश्यक नहीं',
                bestUses: 'पोर्टफोलियो होल्डिंग्स, डिस्क स्पेस'
            },
            'candlestick': {
                description: 'ओपन, हाई, लो और क्लोज के साथ वित्तीय मूल्य गतिशीलता।',
                xAxisReq: 'तारीख / समय',
                yAxisReq: 'Open, Close मान',
                zAxisReq: 'High, Low मान',
                bestUses: 'स्टॉक मार्केट, क्रिप्टो विश्लेषण'
            },
            'ohlc': {
                description: 'वित्तीय टिक बार जो ओपन-हाई-लो-क्लोज की गति दर्शाते हैं।',
                xAxisReq: 'तारीख / समय',
                yAxisReq: 'Open, Close',
                zAxisReq: 'High, Low',
                bestUses: 'वित्तीय ट्रेडिंग विश्लेषण'
            },
            'waterfall': {
                description: 'सकारात्मक और नकारात्मक योगदानों के संचयी प्रभाव को दिखाता है।',
                xAxisReq: 'मद / घटक',
                yAxisReq: 'बदलाव मान (+/-)',
                zAxisReq: 'आवश्यक नहीं',
                bestUses: 'आय विवरण, लागत विश्लेषण'
            },
            'heatmap': {
                description: 'रंग की तीव्रता से दो चरों के बीच उच्च और निम्न सांद्रता दिखाता है।',
                xAxisReq: 'X श्रेणी (जैसे: वार)',
                yAxisReq: 'Y श्रेणी (जैसे: समय)',
                zAxisReq: 'तीव्रता मान (Density)',
                bestUses: 'वेबसाइट एक्टिविटी, कोरिलेशन मैट्रिक्स'
            },
            'sankey': {
                description: 'प्रणालियों या चरणों के बीच सामग्री या मूल्य के प्रवाह को दर्शाता है।',
                xAxisReq: 'स्रोत (Source)',
                yAxisReq: 'गंतव्य (Target)',
                zAxisReq: 'प्रवाह मात्रा (Volume)',
                bestUses: 'ऊर्जा प्रवाह, उपयोगकर्ता पथ'
            },
            'bullet': {
                description: 'लक्ष्य और गुणात्मक श्रेणियों (खराब, संतोषजनक, उत्कृष्ट) की तुलना।',
                xAxisReq: 'मीट्रिक नाम',
                yAxisReq: 'वास्तविक मान',
                zAxisReq: 'लक्ष्य मान',
                bestUses: 'कार्यकारी डैशबोर्ड, KPI स्थिति'
            },
            'boxplot': {
                description: 'मध्यिका, चतुर्थक और आउटलायर्स के साथ सांख्यिकीय वितरण।',
                xAxisReq: 'समूह / श्रेणी',
                yAxisReq: 'संख्यात्मक डेटा वितरण',
                zAxisReq: 'आवश्यक नहीं',
                bestUses: 'सांख्यिकी, गुणवत्ता नियंत्रण'
            }
        };

        return infoMap[type] || defaultInfo;
    }

    /**
     * Generates high-definition, realistic miniature preview illustrations
     * that look like real dashboard charts rather than generic bootstrap icons.
     */
    getChartImage(type: string): string {
        const t = (type || '').toLowerCase().trim();

        // Standard clean background with subtle grid
        const bgAndGrid = `
            <rect width="100" height="64" rx="6" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1"/>
            <line x1="12" y1="18" x2="88" y2="18" stroke="#f1f5f9" stroke-width="1"/>
            <line x1="12" y1="34" x2="88" y2="34" stroke="#f1f5f9" stroke-width="1"/>
            <line x1="12" y1="52" x2="88" y2="52" stroke="#cbd5e1" stroke-width="1.2"/>
        `;

        let chartSvg = '';

        if (t === 'bar') {
            chartSvg = `
                ${bgAndGrid}
                <rect x="18" y="30" width="12" height="22" rx="2" fill="#3b82f6"/>
                <rect x="36" y="16" width="12" height="36" rx="2" fill="#2563eb"/>
                <rect x="54" y="24" width="12" height="28" rx="2" fill="#10b981"/>
                <rect x="72" y="36" width="12" height="16" rx="2" fill="#f59e0b"/>
            `;
        } else if (t === 'stacked-bar') {
            chartSvg = `
                ${bgAndGrid}
                <rect x="24" y="38" width="16" height="14" rx="1" fill="#3b82f6"/>
                <rect x="24" y="24" width="16" height="13" fill="#10b981"/>
                <rect x="24" y="16" width="16" height="7" rx="2" fill="#f59e0b"/>
                <rect x="60" y="34" width="16" height="18" rx="1" fill="#3b82f6"/>
                <rect x="60" y="22" width="16" height="11" fill="#10b981"/>
                <rect x="60" y="14" width="16" height="7" rx="2" fill="#f59e0b"/>
            `;
        } else if (t === 'horizontal-bar') {
            chartSvg = `
                <rect width="100" height="64" rx="6" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1"/>
                <line x1="18" y1="12" x2="18" y2="54" stroke="#cbd5e1" stroke-width="1.2"/>
                <rect x="18" y="16" width="62" height="8" rx="2" fill="#3b82f6"/>
                <rect x="18" y="28" width="44" height="8" rx="2" fill="#10b981"/>
                <rect x="18" y="40" width="54" height="8" rx="2" fill="#8b5cf6"/>
            `;
        } else if (t === 'grouped-bar') {
            chartSvg = `
                ${bgAndGrid}
                <rect x="18" y="26" width="9" height="26" rx="1.5" fill="#3b82f6"/>
                <rect x="29" y="34" width="9" height="18" rx="1.5" fill="#10b981"/>
                <rect x="52" y="18" width="9" height="34" rx="1.5" fill="#3b82f6"/>
                <rect x="63" y="24" width="9" height="28" rx="1.5" fill="#10b981"/>
            `;
        } else if (t === 'bar3d' || t === 'bar3D') {
            chartSvg = `
                <rect width="100" height="64" rx="6" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1"/>
                <!-- Bar 1 -->
                <path d="M22 46 L34 50 L34 32 L22 28 Z" fill="#1d4ed8"/>
                <path d="M34 50 L52 42 L52 24 L34 32 Z" fill="#3b82f6"/>
                <path d="M22 28 L34 32 L52 24 L40 20 Z" fill="#93c5fd"/>
                <!-- Bar 2 -->
                <path d="M52 42 L64 46 L64 22 L52 18 Z" fill="#047857"/>
                <path d="M64 46 L82 38 L82 14 L64 22 Z" fill="#10b981"/>
                <path d="M52 18 L64 22 L82 14 L70 10 Z" fill="#6ee7b7"/>
            `;
        } else if (t === 'line') {
            chartSvg = `
                ${bgAndGrid}
                <path d="M18 44 L38 26 L58 38 L82 16" fill="none" stroke="#2563eb" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                <circle cx="18" cy="44" r="3" fill="#ffffff" stroke="#2563eb" stroke-width="2"/>
                <circle cx="38" cy="26" r="3" fill="#ffffff" stroke="#2563eb" stroke-width="2"/>
                <circle cx="58" cy="38" r="3" fill="#ffffff" stroke="#2563eb" stroke-width="2"/>
                <circle cx="82" cy="16" r="3" fill="#ffffff" stroke="#2563eb" stroke-width="2"/>
            `;
        } else if (t === 'smooth-line') {
            chartSvg = `
                ${bgAndGrid}
                <path d="M16 46 C 32 20, 52 50, 84 18" fill="none" stroke="#6366f1" stroke-width="3" stroke-linecap="round"/>
                <circle cx="16" cy="46" r="3" fill="#ffffff" stroke="#6366f1" stroke-width="2"/>
                <circle cx="84" cy="18" r="3" fill="#ffffff" stroke="#6366f1" stroke-width="2"/>
            `;
        } else if (t === 'area-line') {
            chartSvg = `
                ${bgAndGrid}
                <defs>
                    <linearGradient id="gArea_${t}" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.45"/>
                        <stop offset="100%" stop-color="#3b82f6" stop-opacity="0.05"/>
                    </linearGradient>
                </defs>
                <path d="M16 44 L36 24 L58 36 L84 18 L84 52 L16 52 Z" fill="url(#gArea_${t})"/>
                <path d="M16 44 L36 24 L58 36 L84 18" fill="none" stroke="#2563eb" stroke-width="2.5" stroke-linecap="round"/>
            `;
        } else if (t === 'smooth-area') {
            chartSvg = `
                ${bgAndGrid}
                <defs>
                    <linearGradient id="gSmArea_${t}" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="#8b5cf6" stop-opacity="0.5"/>
                        <stop offset="100%" stop-color="#8b5cf6" stop-opacity="0.05"/>
                    </linearGradient>
                </defs>
                <path d="M16 46 C 34 22, 54 48, 84 18 L84 52 L16 52 Z" fill="url(#gSmArea_${t})"/>
                <path d="M16 46 C 34 22, 54 48, 84 18" fill="none" stroke="#7c3aed" stroke-width="2.5"/>
            `;
        } else if (t === 'stacked-line') {
            chartSvg = `
                ${bgAndGrid}
                <path d="M16 46 L38 34 L60 40 L84 26" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round"/>
                <path d="M16 32 L38 18 L60 22 L84 12" fill="none" stroke="#2563eb" stroke-width="2.5" stroke-linecap="round"/>
            `;
        } else if (t === 'stacked-area') {
            chartSvg = `
                ${bgAndGrid}
                <path d="M16 48 L38 38 L60 44 L84 32 L84 52 L16 52 Z" fill="#10b981" opacity="0.35"/>
                <path d="M16 32 L38 18 L60 24 L84 12 L84 32 L60 44 L38 38 L16 48 Z" fill="#3b82f6" opacity="0.5"/>
                <path d="M16 32 L38 18 L60 24 L84 12" fill="none" stroke="#2563eb" stroke-width="2"/>
            `;
        } else if (t === 'gradient-area') {
            chartSvg = `
                ${bgAndGrid}
                <defs>
                    <linearGradient id="gMulti_${t}" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stop-color="#3b82f6"/>
                        <stop offset="50%" stop-color="#8b5cf6"/>
                        <stop offset="100%" stop-color="#ec4899"/>
                    </linearGradient>
                </defs>
                <path d="M16 46 C 32 18, 54 48, 84 18 L84 52 L16 52 Z" fill="url(#gMulti_${t})" opacity="0.4"/>
                <path d="M16 46 C 32 18, 54 48, 84 18" fill="none" stroke="url(#gMulti_${t})" stroke-width="3"/>
            `;
        } else if (t.includes('step')) {
            chartSvg = `
                ${bgAndGrid}
                <path d="M16 46 L34 46 L34 32 L58 32 L58 18 L84 18" fill="none" stroke="#f59e0b" stroke-width="2.5" stroke-linecap="square"/>
                <circle cx="34" cy="32" r="2.5" fill="#f59e0b"/>
                <circle cx="58" cy="18" r="2.5" fill="#f59e0b"/>
            `;
        } else if (t === 'dual-axis-line') {
            chartSvg = `
                <rect width="100" height="64" rx="6" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1"/>
                <line x1="14" y1="12" x2="14" y2="52" stroke="#94a3b8" stroke-width="1.2"/>
                <line x1="86" y1="12" x2="86" y2="52" stroke="#94a3b8" stroke-width="1.2"/>
                <path d="M14 44 L38 24 L60 36 L86 16" fill="none" stroke="#2563eb" stroke-width="2.5"/>
                <path d="M14 20 L38 38 L60 18 L86 42" fill="none" stroke="#ef4444" stroke-width="2" stroke-dasharray="3,3"/>
            `;
        } else if (t === 'confidence-band') {
            chartSvg = `
                ${bgAndGrid}
                <path d="M16 32 C 34 18, 56 36, 84 14 L84 28 C 56 50, 34 36, 16 48 Z" fill="#3b82f6" opacity="0.25"/>
                <path d="M16 40 C 34 27, 56 43, 84 21" fill="none" stroke="#1d4ed8" stroke-width="2.5"/>
            `;
        } else if (t === 'bump-line') {
            chartSvg = `
                ${bgAndGrid}
                <path d="M16 20 L44 44 L84 20" fill="none" stroke="#ef4444" stroke-width="2.5"/>
                <path d="M16 44 L44 20 L84 44" fill="none" stroke="#3b82f6" stroke-width="2.5"/>
                <circle cx="44" cy="20" r="3.5" fill="#3b82f6"/>
                <circle cx="44" cy="44" r="3.5" fill="#ef4444"/>
            `;
        } else if (t === 'polar-line') {
            chartSvg = `
                <rect width="100" height="64" rx="6" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1"/>
                <circle cx="50" cy="32" r="22" fill="none" stroke="#e2e8f0" stroke-width="1"/>
                <circle cx="50" cy="32" r="14" fill="none" stroke="#e2e8f0" stroke-width="1"/>
                <polygon points="50,14 66,28 58,46 36,42 34,24" fill="#8b5cf6" opacity="0.3" stroke="#8b5cf6" stroke-width="2"/>
            `;
        } else if (t === 'timeseries-line') {
            chartSvg = `
                <rect width="100" height="64" rx="6" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1"/>
                <path d="M14 34 L30 20 L48 28 L64 14 L86 22" fill="none" stroke="#2563eb" stroke-width="2"/>
                <!-- Mini zoom slider bar -->
                <rect x="14" y="44" width="72" height="10" rx="2" fill="#e2e8f0"/>
                <rect x="28" y="44" width="34" height="10" rx="2" fill="#3b82f6" opacity="0.6"/>
            `;
        } else if (t === 'markpoint-line') {
            chartSvg = `
                ${bgAndGrid}
                <path d="M16 44 L42 20 L62 34 L84 24" fill="none" stroke="#2563eb" stroke-width="2"/>
                <!-- Callout pin -->
                <circle cx="42" cy="20" r="3" fill="#ef4444"/>
                <path d="M42 9 L46 16 L38 16 Z" fill="#ef4444"/>
                <circle cx="42" cy="8" r="4" fill="#ef4444"/>
            `;
        } else if (t === 'markline-line') {
            chartSvg = `
                ${bgAndGrid}
                <path d="M16 44 L36 24 L58 38 L84 18" fill="none" stroke="#2563eb" stroke-width="2"/>
                <line x1="12" y1="31" x2="88" y2="31" stroke="#ef4444" stroke-width="1.8" stroke-dasharray="4,3"/>
                <rect x="74" y="26" width="14" height="8" rx="2" fill="#ef4444"/>
                <text x="81" y="32" fill="#ffffff" font-size="6" font-weight="bold" text-anchor="middle">AVG</text>
            `;
        } else if (t === 'line3d' || t === 'line3D') {
            chartSvg = `
                <rect width="100" height="64" rx="6" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1"/>
                <path d="M18 44 L50 56 L82 44 L50 32 Z" fill="#e2e8f0" opacity="0.6"/>
                <path d="M24 38 C 40 16, 60 48, 76 22" fill="none" stroke="#3b82f6" stroke-width="3"/>
                <path d="M24 42 C 40 20, 60 52, 76 26" fill="none" stroke="#93c5fd" stroke-width="1.5"/>
            `;
        } else if (t === 'pie') {
            chartSvg = `
                <rect width="100" height="64" rx="6" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1"/>
                <!-- Pie Slices -->
                <path d="M50 32 L50 10 A22 22 0 0 1 72 32 Z" fill="#3b82f6"/>
                <path d="M50 32 L72 32 A22 22 0 1 1 36 14 Z" fill="#10b981"/>
                <path d="M50 32 L36 14 A22 22 0 0 1 50 10 Z" fill="#f59e0b"/>
            `;
        } else if (t === 'doughnut') {
            chartSvg = `
                <rect width="100" height="64" rx="6" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1"/>
                <path d="M50 10 A22 22 0 1 1 28 32 L37 32 A13 13 0 1 0 50 19 Z" fill="#3b82f6"/>
                <path d="M50 10 A22 22 0 0 1 72 32 L61 32 A13 13 0 0 0 50 19 Z" fill="#10b981"/>
                <circle cx="50" cy="32" r="10" fill="#ffffff"/>
            `;
        } else if (t.includes('rose')) {
            chartSvg = `
                <rect width="100" height="64" rx="6" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1"/>
                <path d="M50 32 L50 10 A22 22 0 0 1 70 32 Z" fill="#3b82f6"/>
                <path d="M50 32 L70 32 A20 20 0 0 1 50 48 Z" fill="#10b981" opacity="0.85"/>
                <path d="M50 32 L50 48 A16 16 0 0 1 34 32 Z" fill="#8b5cf6"/>
                <path d="M50 32 L34 32 A12 12 0 0 1 50 20 Z" fill="#f59e0b"/>
            `;
        } else if (t === 'scatter') {
            chartSvg = `
                ${bgAndGrid}
                <circle cx="22" cy="44" r="3" fill="#3b82f6"/>
                <circle cx="32" cy="34" r="3" fill="#10b981"/>
                <circle cx="42" cy="38" r="3.5" fill="#f59e0b"/>
                <circle cx="52" cy="24" r="3" fill="#3b82f6"/>
                <circle cx="64" cy="28" r="3" fill="#8b5cf6"/>
                <circle cx="74" cy="16" r="3.5" fill="#ef4444"/>
                <circle cx="82" cy="20" r="3" fill="#10b981"/>
            `;
        } else if (t === 'bubble') {
            chartSvg = `
                ${bgAndGrid}
                <circle cx="28" cy="38" r="9" fill="#3b82f6" opacity="0.6"/>
                <circle cx="52" cy="26" r="14" fill="#10b981" opacity="0.5"/>
                <circle cx="76" cy="34" r="11" fill="#f59e0b" opacity="0.55"/>
            `;
        } else if (t === 'funnel') {
            chartSvg = `
                <rect width="100" height="64" rx="6" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1"/>
                <polygon points="18,12 82,12 72,22 28,22" fill="#3b82f6"/>
                <polygon points="29,24 71,24 62,34 38,34" fill="#10b981"/>
                <polygon points="39,36 61,36 54,46 46,46" fill="#f59e0b"/>
                <polygon points="46,48 54,48 52,54 48,54" fill="#ef4444"/>
            `;
        } else if (t === 'gauge') {
            chartSvg = `
                <rect width="100" height="64" rx="6" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1"/>
                <!-- Gauge track -->
                <path d="M26 44 A24 24 0 1 1 74 44" fill="none" stroke="#e2e8f0" stroke-width="7" stroke-linecap="round"/>
                <path d="M26 44 A24 24 0 0 1 58 14" fill="none" stroke="#10b981" stroke-width="7" stroke-linecap="round"/>
                <circle cx="50" cy="38" r="4" fill="#1e293b"/>
                <line x1="50" y1="38" x2="62" y2="22" stroke="#1e293b" stroke-width="2.5" stroke-linecap="round"/>
            `;
        } else if (t === 'radar') {
            chartSvg = `
                <rect width="100" height="64" rx="6" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1"/>
                <polygon points="50,14 74,25 65,48 35,48 26,25" fill="none" stroke="#cbd5e1" stroke-width="1"/>
                <polygon points="50,22 64,29 59,42 41,42 36,29" fill="none" stroke="#e2e8f0" stroke-width="1"/>
                <polygon points="50,16 68,27 55,44 38,38 30,26" fill="#3b82f6" opacity="0.35" stroke="#2563eb" stroke-width="1.8"/>
            `;
        } else if (t === 'treemap') {
            chartSvg = `
                <rect width="100" height="64" rx="6" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1"/>
                <rect x="14" y="14" width="42" height="36" rx="2" fill="#3b82f6"/>
                <rect x="58" y="14" width="28" height="20" rx="2" fill="#10b981"/>
                <rect x="58" y="36" width="13" height="14" rx="1.5" fill="#f59e0b"/>
                <rect x="73" y="36" width="13" height="14" rx="1.5" fill="#8b5cf6"/>
            `;
        } else if (t === 'candlestick') {
            chartSvg = `
                ${bgAndGrid}
                <!-- Bullish Green Candle -->
                <line x1="32" y1="16" x2="32" y2="48" stroke="#10b981" stroke-width="1.5"/>
                <rect x="27" y="24" width="10" height="18" fill="#10b981" rx="1"/>
                <!-- Bearish Red Candle -->
                <line x1="52" y1="20" x2="52" y2="50" stroke="#ef4444" stroke-width="1.5"/>
                <rect x="47" y="28" width="10" height="16" fill="#ef4444" rx="1"/>
                <!-- Bullish Green Candle 2 -->
                <line x1="72" y1="14" x2="72" y2="44" stroke="#10b981" stroke-width="1.5"/>
                <rect x="67" y="18" width="10" height="20" fill="#10b981" rx="1"/>
            `;
        } else if (t === 'ohlc') {
            chartSvg = `
                ${bgAndGrid}
                <line x1="32" y1="16" x2="32" y2="48" stroke="#10b981" stroke-width="2"/>
                <line x1="26" y1="36" x2="32" y2="36" stroke="#10b981" stroke-width="2"/>
                <line x1="32" y1="22" x2="38" y2="22" stroke="#10b981" stroke-width="2"/>
                <line x1="64" y1="18" x2="64" y2="50" stroke="#ef4444" stroke-width="2"/>
                <line x1="58" y1="26" x2="64" y2="26" stroke="#ef4444" stroke-width="2"/>
                <line x1="64" y1="42" x2="70" y2="42" stroke="#ef4444" stroke-width="2"/>
            `;
        } else if (t === 'waterfall') {
            chartSvg = `
                ${bgAndGrid}
                <rect x="18" y="28" width="11" height="24" fill="#3b82f6" rx="1"/>
                <rect x="33" y="18" width="11" height="10" fill="#10b981" rx="1"/>
                <rect x="48" y="24" width="11" height="8" fill="#ef4444" rx="1"/>
                <rect x="63" y="14" width="11" height="12" fill="#10b981" rx="1"/>
                <rect x="76" y="14" width="11" height="38" fill="#3b82f6" rx="1"/>
            `;
        } else if (t === 'heatmap') {
            chartSvg = `
                <rect width="100" height="64" rx="6" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1"/>
                <rect x="16" y="14" width="16" height="16" rx="2" fill="#dbeafe"/>
                <rect x="34" y="14" width="16" height="16" rx="2" fill="#93c5fd"/>
                <rect x="52" y="14" width="16" height="16" rx="2" fill="#3b82f6"/>
                <rect x="70" y="14" width="16" height="16" rx="2" fill="#1d4ed8"/>
                <rect x="16" y="32" width="16" height="16" rx="2" fill="#93c5fd"/>
                <rect x="34" y="32" width="16" height="16" rx="2" fill="#2563eb"/>
                <rect x="52" y="32" width="16" height="16" rx="2" fill="#1e40af"/>
                <rect x="70" y="32" width="16" height="16" rx="2" fill="#60a5fa"/>
            `;
        } else if (t === 'sankey') {
            chartSvg = `
                <rect width="100" height="64" rx="6" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1"/>
                <rect x="16" y="16" width="6" height="14" rx="1" fill="#3b82f6"/>
                <rect x="16" y="34" width="6" height="18" rx="1" fill="#10b981"/>
                <rect x="78" y="14" width="6" height="10" rx="1" fill="#f59e0b"/>
                <rect x="78" y="28" width="6" height="12" rx="1" fill="#8b5cf6"/>
                <rect x="78" y="44" width="6" height="8" rx="1" fill="#ec4899"/>
                <path d="M22 22 C 46 22, 54 18, 78 18" fill="none" stroke="#3b82f6" stroke-width="5" opacity="0.4"/>
                <path d="M22 40 C 46 40, 54 34, 78 34" fill="none" stroke="#10b981" stroke-width="6" opacity="0.4"/>
            `;
        } else if (t === 'bullet') {
            chartSvg = `
                <rect width="100" height="64" rx="6" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1"/>
                <!-- Background Qualitative Ranges -->
                <rect x="14" y="24" width="72" height="16" fill="#e2e8f0" rx="2"/>
                <rect x="14" y="24" width="50" height="16" fill="#cbd5e1"/>
                <rect x="14" y="24" width="28" height="16" fill="#94a3b8"/>
                <!-- Actual Value Bar -->
                <rect x="14" y="28" width="56" height="8" fill="#1e293b"/>
                <!-- Target Marker -->
                <line x1="64" y1="20" x2="64" y2="44" stroke="#ef4444" stroke-width="2.5"/>
            `;
        } else if (t === 'boxplot') {
            chartSvg = `
                ${bgAndGrid}
                <!-- Box 1 -->
                <line x1="34" y1="14" x2="34" y2="50" stroke="#64748b" stroke-width="1.5"/>
                <rect x="26" y="22" width="16" height="20" fill="#3b82f6" opacity="0.7" stroke="#2563eb" stroke-width="1.5"/>
                <line x1="26" y1="32" x2="42" y2="32" stroke="#1e293b" stroke-width="2"/>
                <!-- Box 2 -->
                <line x1="66" y1="18" x2="66" y2="48" stroke="#64748b" stroke-width="1.5"/>
                <rect x="58" y="26" width="16" height="16" fill="#10b981" opacity="0.7" stroke="#059669" stroke-width="1.5"/>
                <line x1="58" y1="35" x2="74" y2="35" stroke="#1e293b" stroke-width="2"/>
            `;
        } else {
            chartSvg = `
                ${bgAndGrid}
                <rect x="22" y="28" width="14" height="24" rx="2" fill="#3b82f6"/>
                <rect x="42" y="16" width="14" height="36" rx="2" fill="#10b981"/>
                <rect x="62" y="22" width="14" height="30" rx="2" fill="#8b5cf6"/>
            `;
        }

        const fullSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 64" width="100" height="64">${chartSvg}</svg>`;
        return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(fullSvg);
    }

    refresh(): void {
        this.createCategoryNavigation();
        this.createGallery();
        this.updateSelectedCardStyles();
    }

    getSelectedChart(): string | null {
        return this.currentSelectedValue || null;
    }
}

// Global Factory Export
export function createChartTypeGallery(): ChartTypeGallery {
    if (!window.chartGalleryInstance) {
        window.chartGalleryInstance = new ChartTypeGallery();
    }
    return window.chartGalleryInstance;
}

// Auto-initialize on DOM ready
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            if (!window.chartGalleryInstance) {
                window.chartGalleryInstance = new ChartTypeGallery();
            }
        });
    } else {
        if (!window.chartGalleryInstance) {
            window.chartGalleryInstance = new ChartTypeGallery();
        }
    }
}
