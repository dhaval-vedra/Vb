// js/main_handlers.ts

import { showMessage, attachEventListener, exportCsv, exportExcel, exportPdf, toggleTheme, downloadTemplate } from './utils.ts';
import { performUserLogout } from '../auth/securityManager.ts';

import {
    setCurrentUserId,
    initData,
    handleFile,
    syncGoogleSheet,
    searchTable,
    changePage,
    applyFiltersAndSort,
    saveData,
    filteredData, // State variable
    headers,     // State variable
    saveDashboardSettings,
    loadDashboardSettings,
    updatePythonModeUI,
    syncDataToBackend
} from '../../store/DataHandler.ts'; 

import { duckdbMetrics, updateDuckDBMetricsUI } from '../data/duckdbArrowClient.ts'; 
import { SummaryConfigModal } from '../ui/summaryConfigModal.ts'; 

import {
    populateAddDataForm,
    displayStats
} from '../../store/UIHandler.js'; 

import { addVisualization, plotAll, plotChart, clearChart, applyAdvancedChartSettings, visualizations, arrangeChartsInGrid, toggleChartPin, editChart, clearDataCache } from '../charts/charts.ts';
import { showKpiLayoutPopover } from '../charts/kpiSparklines.js';
import { initializeChatUI } from '../ai/chat.ts';
import { fetchDataFromApi, startLiveUpdate, stopLiveUpdate } from '../data/liveDataHandler.ts';
import { triggerMockDataUpdate, startMockAutoUpdate, stopMockAutoUpdate } from '../data/mockDataGenerator.js';
import { populateColumnDragLists, getChartColumns, populateDropZones } from '../charts/chartcolomdrag.js';
import { renderDashboardChartOverview, applyChartContainerColor, applyCustomChartContainerColor } from '../charts/chartContainerColors.js';
import { chartEffectsTemplates, renderDashboardChartList } from '../charts/chartEffects.js';
import { auth } from './utils.ts';
import { exportDashboardToPDF, exportDashboardToPNG, exportFilteredDataToCSV } from '../export/reportExporter.js';
import { initGlobalFilters } from '../layout/globalFilters.js';
import { resetAllFilters } from '../layout/filter.js';

declare const echarts: any;
declare const Plotly: any;
declare const bootstrap: any;

/**
 * सभी वैश्विक इवेंट हैंडलर संलग्न करता है।
 * @param {Array} allActiveChartInstances - main_core.js से सक्रिय चार्ट इंस्टेंस का ऐरे
 */
export function attachGlobalEventHandlers(allActiveChartInstances: any[]): void {

    // केवल 'index.html' या रूट पर ही इवेंट हैंडलर संलग्न करें
    const currentPage = window.location.pathname.split('/').pop();
    if (currentPage === 'index.html' || currentPage === '') {
        // Initialize Global Dashboard Filters
        initGlobalFilters();

        // ====================================================================
        // 1. डेटा अपलोड और प्रबंधन हैंडलर
        // ====================================================================
        
        // फाइल अपलोड
        attachEventListener('fileInput', 'change', async (e: Event) => {
            await handleFile(e);
            if (headers.length > 0) {
                populateColumnDragLists(headers); // ड्रैग-एंड-ड्रॉप लिस्ट को पॉपुलेट करें
            }
        });
        
        // नया डेटा जोड़ें
        attachEventListener('btnSmartDataEngine', 'click', () => SummaryConfigModal.open());
        attachEventListener('addDataBtn', 'click', populateAddDataForm);
        attachEventListener('addDataBtnSidebar', 'click', populateAddDataForm);
        attachEventListener('saveData', 'click', saveData);
        attachEventListener('downloadTemplate', 'click', () => downloadTemplate());
        attachEventListener('downloadTemplateSidebar', 'click', () => downloadTemplate());
        
        // लाइव डेटा/API (एडवांस्ड फीचर्स के साथ)
        attachEventListener('fetchDataFromApiBtn', 'click', async () => {
            const apiInput = document.getElementById('apiInput') as HTMLInputElement | null;
            const updateInterval = document.getElementById('updateInterval') as HTMLInputElement | null;
            const apiDataPath = document.getElementById('apiDataPath') as HTMLInputElement | null;
            const apiMethod = document.getElementById('apiMethod') as HTMLSelectElement | null;
            const apiHeaders = document.getElementById('apiHeaders') as HTMLInputElement | null;
            const cacheBuster = document.getElementById('cacheBuster') as HTMLInputElement | null;

            const apiUrl = apiInput ? apiInput.value : '';
            const interval = updateInterval ? parseInt(updateInterval.value, 10) : 0;
            const dataPath = apiDataPath ? apiDataPath.value : '';
            const method = apiMethod ? apiMethod.value : 'GET';
            const headersRaw = apiHeaders ? apiHeaders.value : '';
            const isCacheBuster = cacheBuster ? cacheBuster.checked : false;
            
            let parsedHeaders = null;
            if (headersRaw && headersRaw.trim()) {
                try {
                    parsedHeaders = JSON.parse(headersRaw);
                } catch (e) {
                    showMessage("कस्टम हेडर JSON अमान्य है। कृपया फॉर्मेट ठीक करें।", "danger");
                    return;
                }
            }
            
            if (apiUrl) {
                startLiveUpdate(apiUrl, interval, {
                    method,
                    dataPath,
                    headers: parsedHeaders,
                    cacheBuster: isCacheBuster
                });
            } else {
                showMessage("कृपया एक API URL दर्ज करें।", "warning");
            }
        });
        
        attachEventListener('stopLiveUpdateBtn', 'click', stopLiveUpdate);

        // API रेडीमेड प्रीसेट चयन हैंडलर
        attachEventListener('presetApiSelect', 'change', (e: Event) => {
            const target = e.target as HTMLSelectElement;
            const val = target.value;
            const apiInput = document.getElementById('apiInput') as HTMLInputElement | null;
            const apiDataPath = document.getElementById('apiDataPath') as HTMLInputElement | null;
            const apiMethod = document.getElementById('apiMethod') as HTMLSelectElement | null;
            const apiHeaders = document.getElementById('apiHeaders') as HTMLInputElement | null;
            const updateInterval = document.getElementById('updateInterval') as HTMLInputElement | null;
            
            if (val === 'crypto-bitcoin') {
                if (apiInput) apiInput.value = 'https://api.binance.com/api/v3/ticker/price?symbols=%5B%22BTCUSDT%22,%22ETHUSDT%22,%22BNBUSDT%22,%22SOLUSDT%22,%22XRPUSDT%22,%22ADAUSDT%22,%22DOGEUSDT%22%5D';
                if (apiDataPath) apiDataPath.value = '';
                if (apiMethod) apiMethod.value = 'GET';
                if (apiHeaders) apiHeaders.value = '';
                if (updateInterval) updateInterval.value = '15';
            } else if (val === 'crypto-market') {
                if (apiInput) apiInput.value = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=15&page=1&sparkline=false';
                if (apiDataPath) apiDataPath.value = '';
                if (apiMethod) apiMethod.value = 'GET';
                if (apiHeaders) apiHeaders.value = '';
                if (updateInterval) updateInterval.value = '30';
            } else if (val === 'weather-feed') {
                if (apiInput) apiInput.value = 'https://api.open-meteo.com/v1/forecast?latitude=28.61&longitude=77.20&hourly=temperature_2m';
                if (apiDataPath) apiDataPath.value = 'hourly';
                if (apiMethod) apiMethod.value = 'GET';
                if (apiHeaders) apiHeaders.value = '';
                if (updateInterval) updateInterval.value = '60';
            } else if (val === 'random-user-sales') {
                if (apiInput) apiInput.value = 'https://dummyjson.com/products?limit=25';
                if (apiDataPath) apiDataPath.value = 'products';
                if (apiMethod) apiMethod.value = 'GET';
                if (apiHeaders) apiHeaders.value = '';
                if (updateInterval) updateInterval.value = '45';
            } else {
                if (apiInput) apiInput.value = '';
                if (apiDataPath) apiDataPath.value = '';
                if (apiMethod) apiMethod.value = 'GET';
                if (apiHeaders) apiHeaders.value = '';
            }
        });

        // स्मार्ट मॉक डेटा जेनरेटर
        attachEventListener('generateMockDataBtn', 'click', () => {
            const mockThemeSelect = document.getElementById('mockThemeSelect') as HTMLSelectElement | null;
            const mockRowCount = document.getElementById('mockRowCount') as HTMLInputElement | null;
            const mockAutoRefresh = document.getElementById('mockAutoRefresh') as HTMLInputElement | null;

            const theme = mockThemeSelect ? mockThemeSelect.value : 'sales';
            const rowCount = mockRowCount ? (parseInt(mockRowCount.value, 10) || 15) : 15;
            const autoRefresh = mockAutoRefresh ? mockAutoRefresh.checked : false;
            
            if (autoRefresh) {
                startMockAutoUpdate(theme, rowCount, 10000);
            } else {
                stopMockAutoUpdate();
                triggerMockDataUpdate(theme, rowCount);
            }
        });

        // एडवांस्ड ड्रैग-एंड-ड्रॉप जोन फ़ाइल अपलोड हैंडलर
        const dragZone = document.getElementById('file-drag-zone');
        if (dragZone) {
            dragZone.addEventListener('dragover', (e: DragEvent) => {
                e.preventDefault();
                dragZone.classList.add('dragover');
            });
            dragZone.addEventListener('dragleave', () => {
                dragZone.classList.remove('dragover');
            });
            dragZone.addEventListener('drop', async (e: DragEvent) => {
                e.preventDefault();
                dragZone.classList.remove('dragover');
                if (e.dataTransfer && e.dataTransfer.files.length > 0) {
                    const fileInput = document.getElementById('fileInput') as HTMLInputElement | null;
                    if (fileInput) {
                        fileInput.files = e.dataTransfer.files;
                        fileInput.dispatchEvent(new Event('change'));
                    }
                }
            });
            dragZone.addEventListener('click', () => {
                document.getElementById('fileInput')?.click();
            });
        }
        
        // Google Sheet Live Sync Click Listener
        attachEventListener('syncGoogleSheetBtn', 'click', async () => {
            const urlInput = document.getElementById('googleSheetUrlInput') as HTMLInputElement | null;
            if (urlInput) {
                const url = urlInput.value.trim();
                const success = await syncGoogleSheet(url);
                if (success) {
                    urlInput.value = '';
                }
            }
        });
        
        // डेटा एडिट करें
        const handleEditDataClick = () => {
            if (auth.currentUser) {
                window.location.href = 'edit_data.html';
            } else {
                showMessage("डेटा एडिट करने के लिए कृपया लॉगिन करें।", "warning");
                window.location.href = 'login.html';
            }
        };
        attachEventListener('editDataBtn', 'click', handleEditDataClick);
        attachEventListener('editDataBtnSidebar', 'click', handleEditDataClick);
        
        // ====================================================================
        // 2. डेटा टेबल इंटरेक्शन हैंडलर
        // ====================================================================
        attachEventListener('searchInput', 'input', searchTable);
        attachEventListener('searchBtn', 'click', searchTable);
        attachEventListener('prevPage', 'click', () => changePage(-1));
        attachEventListener('nextPage', 'click', () => changePage(1));
        attachEventListener('exportCsv', 'click', () => exportCsv(filteredData));
        attachEventListener('exportExcel', 'click', () => exportExcel(filteredData));
        attachEventListener('exportPdf', 'click', () => exportPdf(filteredData, headers));
        attachEventListener('applyFilterSort', 'click', applyFiltersAndSort);
        attachEventListener('forcePythonBackendBtn', 'change', () => {
            updatePythonModeUI();
            syncDataToBackend();
        });
        attachEventListener('useDuckDBBtn', 'change', (e: Event) => {
            const target = e.target as HTMLInputElement;
            duckdbMetrics.isDuckDbActive = !!target.checked;
            updateDuckDBMetricsUI();
            applyFiltersAndSort();
        });

        // ✅ नया reset button event listener जोड़ें
        attachEventListener('resetFiltersBtn', 'click', () => resetAllFilters(headers));

        attachEventListener('statsCol', 'change', displayStats);

        // ====================================================================
        // 3. चार्ट और विज़ुअलाइज़ेशन हैंडलर
        // ====================================================================
        
        // विज़ुअलाइज़ेशन जोड़ें
        attachEventListener('addVisualizationBtn', 'click', () => {
            const selectedColumns = getChartColumns();
            const xAxisCol = selectedColumns.xAxis;
            const yAxisCols = (selectedColumns.yAxes || []).filter((c): c is string => Boolean(c));
            const zAxisCol = selectedColumns.zAxis;
            
            if (!xAxisCol || yAxisCols.length === 0) {
                showMessage("कृपया X और Y-अक्ष के लिए कॉलम ड्रैग करके डालें।", "warning");
                return;
            }

            const chartTypeEl = document.getElementById('chartType') as HTMLSelectElement | null;
            const chartType = chartTypeEl ? chartTypeEl.value : '';
            if ((chartType === 'bar3D' || chartType === 'line3D') && !zAxisCol) {
                showMessage("3D चार्ट के लिए Z-अक्ष कॉलम आवश्यक है। कृपया एक कॉलम ड्रैग करके डालें।", "warning");
                return;
            }

            addVisualization(xAxisCol, yAxisCols, zAxisCol); 
            // डैशबोर्ड की न्यूनतम ऊंचाई बढ़ाएँ
            const visualizationsDiv = document.getElementById('dashboardContent') || document.getElementById('visualizations');
            if (visualizationsDiv) {
                const currentHeight = visualizationsDiv.offsetHeight;
                const newHeight = currentHeight + 500;
                visualizationsDiv.style.minHeight = `${newHeight}px`;
            }
        });

        // एडवांस्ड चार्ट सेटिंग्स लागू करें
        attachEventListener('animationDuration', 'input', function(this: HTMLInputElement) {
            const readout = document.getElementById('animationDurationValue');
            if (readout) readout.textContent = this.value;
        });
        attachEventListener('colorPaletteName', 'change', applyAdvancedChartSettings);
        attachEventListener('applyChartSettings', 'click', applyAdvancedChartSettings);
        
        // Global delegation for dynamically inserted applyChartSettings button
        document.addEventListener('click', function(e: Event) {
            const target = e.target as HTMLElement | null;
            const targetBtn = target ? target.closest('#applyChartSettings') : null;
            if (targetBtn) {
                e.preventDefault();
                applyAdvancedChartSettings();
            }
        });
        
        // थीम टॉगल करें (थीम बदलने पर सभी चार्ट री-प्लॉट करें)
        const handleToggleThemeClick = () => {
            toggleTheme();
            plotAll();
        };
        attachEventListener('toggleTheme', 'click', handleToggleThemeClick);
        attachEventListener('toggleThemeSidebar', 'click', handleToggleThemeClick);
        attachEventListener('menuToggleTheme', 'click', (e: Event) => {
            e.preventDefault();
            handleToggleThemeClick();
        });

        // ====================================================================
        // 4. चार्ट कंटेनर रंग/शैली हैंडलर
        // ====================================================================

        // रेडीमेड टेम्पलेट्स लागू करें
        attachEventListener('applyChartContainerColorBtn', 'click', () => {
            const scopeAllChartsRadio = document.getElementById('scopeAllCharts') as HTMLInputElement | null;
            const selectedElem = document.querySelector('#chartContainerColorGallery .selected') as HTMLElement | null;
            const selectedChartContainerColorTemplateId = selectedElem?.dataset.templateId || 'default-container-color';
            const applyToAll = scopeAllChartsRadio?.checked;
            let selectedChartIds: string[] = [];
            
            if (!applyToAll) {
                const checkboxes = document.querySelectorAll('#chartSelectionList input[type="checkbox"]:checked');
                selectedChartIds = Array.from(checkboxes).map(checkbox => (checkbox as HTMLInputElement).value);
                if (selectedChartIds.length === 0) {
                    showMessage("कृपया रंग लागू करने के लिए कम से कम एक चार्ट चुनें।", "warning");
                    return;
                }
            }
            
            applyChartContainerColor(selectedChartContainerColorTemplateId, allActiveChartInstances, !!applyToAll, selectedChartIds);
            
            const offcanvasSidebar = document.getElementById('offcanvasSidebar');
            if (offcanvasSidebar && typeof bootstrap !== 'undefined' && bootstrap.Offcanvas) {
                bootstrap.Offcanvas.getInstance(offcanvasSidebar)?.hide();
            }
            showMessage("चार्ट कंटेनर रंग सफलतापूर्वक लागू किया गया है!", "success");
        });

        // कस्टम कोड लागू करें
        attachEventListener('applyCustomChartContainerCodeBtn', 'click', () => {
            try {
                const codeElem = document.getElementById('customChartContainerCode') as HTMLInputElement | HTMLTextAreaElement | null;
                const codeString = codeElem ? codeElem.value : '';
                if (!codeString.trim()) {
                    showMessage("कृपया लागू करने के लिए कुछ कोड दर्ज करें।", "warning");
                    return;
                }

                const customOptions = JSON.parse(codeString);
                const scopeAllChartsRadio = document.getElementById('scopeAllCharts') as HTMLInputElement | null;
                const applyToAll = scopeAllChartsRadio?.checked;
                let selectedChartIds: string[] = [];

                if (!applyToAll) {
                    const checkboxes = document.querySelectorAll('#chartSelectionList input[type="checkbox"]:checked');
                    selectedChartIds = Array.from(checkboxes).map(checkbox => (checkbox as HTMLInputElement).value);
                    if (selectedChartIds.length === 0) {
                        showMessage("कृपया रंग लागू करने के लिए कम से कम एक चार्ट चुनें।", "warning");
                        return;
                    }
                }

                applyCustomChartContainerColor(customOptions, allActiveChartInstances, !!applyToAll, selectedChartIds);

                const offcanvasSidebar = document.getElementById('offcanvasSidebar');
                if (offcanvasSidebar && typeof bootstrap !== 'undefined' && bootstrap.Offcanvas) {
                    bootstrap.Offcanvas.getInstance(offcanvasSidebar)?.hide();
                }
                showMessage("कस्टम कंटेनर शैली सफलतापूर्वक लागू की गई!", "success");

            } catch (e) {
                showMessage("त्रुटि: अमान्य JSON कोड। कृपया इसे ठीक करें।", "danger");
                console.error(e);
            }
        });

        // ====================================================================
        // 5. AI Chat Assistant Handler
        // ====================================================================
        initializeChatUI();

        // ====================================================================
        // 6. Dashboard View & Grid Controls
        // ====================================================================
        
        attachEventListener('toggleVisualizations', 'change', (e: Event) => {
            const el = document.getElementById('visualizationsSection');
            const target = e.target as HTMLInputElement;
            if (el) el.style.display = target.checked ? 'block' : 'none';
        });
        attachEventListener('toggleDataTable', 'change', (e: Event) => {
            const el = document.getElementById('dataTableSection');
            const target = e.target as HTMLInputElement;
            if (el) el.style.display = target.checked ? 'block' : 'none';
        });
        attachEventListener('toggleChat', 'change', (e: Event) => {
            const el = document.getElementById('chatAssistantSection');
            const target = e.target as HTMLInputElement;
            if (el) el.style.display = target.checked ? 'block' : 'none';
        });
        attachEventListener('toggleTextboxes', 'change', (e: Event) => {
            const boxes = document.querySelectorAll('.box');
            const target = e.target as HTMLInputElement;
            boxes.forEach(box => {
                (box as HTMLElement).style.display = target.checked ? 'block' : 'none';
            });
        });
        attachEventListener('toggleMainHeader', 'change', (e: Event) => {
            const header = document.getElementById('mainVisualizationsHeader');
            const target = e.target as HTMLInputElement;
            if (header) header.style.display = target.checked ? 'block' : 'none';
        });

        // Grid arrangers
        attachEventListener('btnArrange1Col', 'click', () => {
            arrangeChartsInGrid(1);
        });
        attachEventListener('btnArrange2Col', 'click', () => {
            arrangeChartsInGrid(2);
        });
        attachEventListener('btnArrange3Col', 'click', () => {
            arrangeChartsInGrid(3);
        });

        // Presentation mode
        attachEventListener('btnPresentationMode', 'click', () => {
            const container = document.getElementById('dashboardContent') as any;
            if (!container) return;
            try {
                if (!document.fullscreenElement) {
                    if (container.requestFullscreen) {
                        container.requestFullscreen();
                    } else if (container.webkitRequestFullscreen) {
                        container.webkitRequestFullscreen();
                    } else if (container.msRequestFullscreen) {
                        container.msRequestFullscreen();
                    }
                    showMessage("प्रेजेंटेशन मोड चालू: ESC दबाकर बाहर निकलें", "success");
                } else {
                    if (document.exitFullscreen) {
                        document.exitFullscreen();
                    }
                }
            } catch (err) {
                console.error("Fullscreen error:", err);
                document.body.classList.toggle('presentation-fallback-active');
                showMessage("प्रेजेंटेशन मोड सक्रिय किया गया!", "info");
            }
        });

        // Lock Layout Synchronizer
        attachEventListener('toggleLockModeViewCheckbox', 'change', () => {
            const lockBtn = document.getElementById('toggleLockModeBtn');
            if (lockBtn) {
                lockBtn.click();
            }
        });

        // Backdrop canvas themes
        attachEventListener('canvasBackdropTheme', 'change', (e: Event) => {
            const target = e.target as HTMLSelectElement;
            const theme = target.value;
            const container = document.getElementById('dashboardContent');
            if (!container) return;

            container.style.background = '';
            container.style.color = '';
            container.style.backdropFilter = '';
            (container.style as any).webkitBackdropFilter = '';
            container.style.boxShadow = '';

            if (theme === 'dark') {
                container.style.background = '#141517';
                container.style.color = '#f8f9fa';
            } else if (theme === 'sepia') {
                container.style.background = '#f4eedb';
                container.style.color = '#433422';
            } else if (theme === 'blue-glow') {
                container.style.background = 'radial-gradient(circle, #0f172a 0%, #030712 100%)';
                container.style.color = '#38bdf8';
            } else if (theme === 'glassy') {
                container.style.background = 'rgba(255, 255, 255, 0.4)';
                container.style.backdropFilter = 'blur(16px)';
                (container.style as any).webkitBackdropFilter = 'blur(16px)';
                container.style.boxShadow = 'inset 0 0 50px rgba(255, 255, 255, 0.5)';
            }

            showMessage(`कैनवास थीम लागू की गई: ${theme}`, 'success');
        });

        attachEventListener('downloadFullDashboard', 'click', () => {
            exportDashboardToPDF();
        });

        attachEventListener('exportPDFBtn', 'click', (e: Event) => {
            e.preventDefault();
            exportDashboardToPDF();
        });

        attachEventListener('exportPNGDashboardBtn', 'click', (e: Event) => {
            e.preventDefault();
            exportDashboardToPNG();
        });

        attachEventListener('exportCSVFilteredBtn', 'click', (e: Event) => {
            e.preventDefault();
            exportFilteredDataToCSV();
        });

        // ====================================================================
        // 7. म्यूटेशन ऑब्जर्वर (चार्ट जोड़ना/हटाना/रीसाइज़ करना)
        // ====================================================================
        const visualizationsDiv = (document.getElementById('dashboardContent') || document.getElementById('visualizations')) as (HTMLElement & { __clickListenerAttached?: boolean }) | null;
        if (visualizationsDiv) {
            // स्थानीय डिबाउंस फ़ंक्शन
            const debounce = (func: Function, wait: number) => {
                let timeout: ReturnType<typeof setTimeout>;
                return function(this: any, ...args: any[]) {
                    clearTimeout(timeout);
                    timeout = setTimeout(() => func.apply(this, args), wait);
                };
            };

            const debouncedUpdate = debounce(() => {
                const chartListEl = document.getElementById('chartSelectionList');
                const effectListEl = document.getElementById('chartSelectionListEffects');
                
                // साइडबार लिस्ट अपडेट करें
                if (chartListEl) {
                    renderDashboardChartOverview(chartListEl, allActiveChartInstances);
                }
                if (effectListEl) {
                    renderDashboardChartList(effectListEl);
                }
                
                // सभी चार्ट को रीसाइज़ करें
                visualizations.forEach((config: any) => {
                    const chartDom = document.getElementById(config.id);
                    if (chartDom) {
                        // ECharts Resize
                        if (typeof echarts !== 'undefined') {
                            const chartInstance = echarts.getInstanceByDom(chartDom);
                            if (chartInstance) {
                                try {
                                    const isDisposed = typeof chartInstance.isDisposed === 'function' ? chartInstance.isDisposed() : false;
                                    if (!isDisposed && typeof chartInstance.resize === 'function') {
                                        chartInstance.resize();
                                    }
                                } catch (e) {
                                    console.warn('ECharts resize error:', e);
                                }
                            } else if (['candlestick', 'ohlc'].includes(config.type) && typeof Plotly !== 'undefined') {
                                const container = document.getElementById(`container-${config.id}`);
                                if (container) {
                                    Plotly.relayout(chartDom, {
                                        width: parseFloat(container.style.width) || 400,
                                        height: (parseFloat(container.style.height) || 300) - 70
                                    });
                                }
                            }
                        }
                    }
                });
            }, 250);

            const visualizationsObserver = new MutationObserver((mutationsList) => {
                let hasChildListMutation = false;
                for (const mutation of mutationsList) {
                    if (mutation.type === 'childList') {
                        hasChildListMutation = true;
                        break;
                    }
                }
                if (hasChildListMutation) {
                    debouncedUpdate();
                }
            });
            visualizationsObserver.observe(visualizationsDiv, { childList: true });
        }

        // ====================================================================
        // 8. चार्ट क्रियाएँ (डाउनलोड, डिलीट, फ़ुलस्क्रीन, एडिट)
        // ====================================================================

        if (visualizationsDiv && !visualizationsDiv.__clickListenerAttached) {
            visualizationsDiv.addEventListener('click', (event: Event) => {
                const clickEl = event.target as HTMLElement;
                if (!clickEl) return;
                
                const target = clickEl.closest('button, a') as HTMLElement | null;
                if (!target) return;
                
                const chartId = target.dataset.chartId || (target.closest('.chart-card')?.id?.replace('container-', ''));
                if (!chartId) return;
                
                const chartDom = document.getElementById(chartId);
                const chartConfig = visualizations.find((v: any) => v.id === chartId);
                const isPlotlyChart = chartConfig && ['candlestick', 'ohlc'].includes(chartConfig.type);

                if (target.classList.contains('download-chart') || target.closest('.download-chart')) {
                    if (!chartDom) return;

                    if (isPlotlyChart && typeof Plotly !== 'undefined') {
                        Plotly.downloadImage(chartDom, {
                            format: 'png',
                            filename: chartId,
                            width: chartDom.offsetWidth,
                            height: chartDom.offsetHeight
                        }).then(() => showMessage("Plotly चार्ट सफलतापूर्वक डाउनलोड किया गया!", "success"))
                          .catch((error: any) => showMessage("Plotly चार्ट डाउनलोड करने में त्रुटि: " + error.message, "danger"));
                    } else if (typeof echarts !== 'undefined') {
                        const chartInstance = echarts.getInstanceByDom(chartDom);
                        if (chartInstance) {
                            const link = document.createElement('a');
                            link.href = chartInstance.getDataURL({
                                type: 'png',
                                pixelRatio: 2,
                                backgroundColor: document.body.classList.contains('dark-theme') ? '#212529' : '#fff'
                            });
                            link.download = `${chartId}.png`;
                            link.click();
                            showMessage("ECharts सफलतापूर्वक डाउनलोड किया गया!", "success");
                        } else {
                            showMessage("चार्ट डाउनलोड करने में त्रुटि: ECharts इंस्टेंस नहीं मिला।", "danger");
                        }
                    }
                } else if (target.classList.contains('delete-chart') || target.closest('.delete-chart')) {
                    clearChart(chartId);
                    showMessage("चार्ट सफलतापूर्वक हटाया गया!", "info");
                } else if (target.classList.contains('fullscreen-chart') || target.closest('.fullscreen-chart')) {
                    const chartContainer = document.getElementById(`container-${chartId}`) as any;
                    if (!chartContainer) return;
                    
                    if (!document.fullscreenElement) {
                        chartContainer.requestFullscreen().then(() => {
                            if (isPlotlyChart && typeof Plotly !== 'undefined' && chartDom) {
                                try {
                                    Plotly.relayout(chartDom, {
                                        width: window.innerWidth,
                                        height: window.innerHeight - 70
                                    });
                                } catch (e) {}
                            } else if (chartDom && typeof echarts !== 'undefined') {
                                try {
                                    const inst = echarts.getInstanceByDom(chartDom);
                                    if (inst && (typeof inst.isDisposed === 'function' ? !inst.isDisposed() : true)) {
                                        inst.resize();
                                    }
                                } catch (e) {}
                            }
                        });
                    } else {
                        document.exitFullscreen().then(() => {
                            const container = document.getElementById(`container-${chartId}`);
                            if (isPlotlyChart && typeof Plotly !== 'undefined' && chartDom && container) {
                                try {
                                    Plotly.relayout(chartDom, {
                                        width: parseFloat(container.style.width),
                                        height: parseFloat(container.style.height) - 70
                                    });
                                } catch (e) {}
                            } else if (chartDom && typeof echarts !== 'undefined') {
                                try {
                                    const inst = echarts.getInstanceByDom(chartDom);
                                    if (inst && (typeof inst.isDisposed === 'function' ? !inst.isDisposed() : true)) {
                                        inst.resize();
                                    }
                                } catch (e) {}
                            }
                        });
                    }
                } else if (target.closest('.edit-chart')) {
                    if (chartConfig) {
                        editChart(chartId);
                    }
                } else if (target.closest('.edit-kpi-layout')) {
                    const editKpiBtn = target.closest('.edit-kpi-layout') as HTMLElement;
                    const chartContainer = document.getElementById(`container-${chartId}`);
                    if (chartContainer && chartConfig && editKpiBtn) {
                        showKpiLayoutPopover(editKpiBtn, chartConfig, chartContainer);
                    }
                } else if (target.closest('.pin-chart')) {
                    toggleChartPin(chartId);
                } else if (target.closest('.change-chart-row-limit')) {
                    event.preventDefault();
                    const limitBtn = target.closest('.change-chart-row-limit') as HTMLElement;
                    if (limitBtn) {
                        const limit = limitBtn.getAttribute('data-limit') || limitBtn.dataset.limit;
                        const targetChartId = limitBtn.getAttribute('data-chart-id') || limitBtn.dataset.chartId || chartId;
                        const targetConfig = visualizations.find(v => v.id === targetChartId) || chartConfig;
                        if (targetConfig) {
                            targetConfig.dataRowLimit = limit === 'all' ? 'all' : parseInt(limit || '100', 10);
                            clearDataCache();
                            saveDashboardSettings();
                            plotChart(targetConfig);
                            showMessage(`पंक्तियों की सीमा बदल कर: ${limit === 'all' ? 'सभी पंक्तियाँ (All Rows)' : limit + ' रिकॉर्ड'} कर दी गई!`, "info");
                        }
                    }
                }
            });
            visualizationsDiv.__clickListenerAttached = true;
        }
    }
    
    // ====================================================================
    // 9. पूर्ण सुरक्षा लॉगआउट हैंडलर (Profile Sidebar & Header)
    // ====================================================================
    attachEventListener('logoutBtn', 'click', async () => {
        await performUserLogout('logout');
    });

    // Modal Logout Button (Profile Modal)
    attachEventListener('modalLogoutBtn', 'click', async () => {
        await performUserLogout('logout');
    });
}
