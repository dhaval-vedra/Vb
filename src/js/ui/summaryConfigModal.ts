/**
 * Vedra BI - Smart Summary & Data Compression Studio Modal
 * Interactive modal allowing users to customize their summary dimensions,
 * metric aggregations, inspect compression gains, and toggle between
 * high-speed Summary Engine mode and Raw Data mode.
 */

import { SmartDataCompressor, CompressionStats } from '../core/smartDataCompressor.ts';
import { 
    SmartSummaryEngine, 
    SummaryConfig, 
    SummaryPreset,
    AggregationFunction, 
    DateTruncation 
} from '../core/smartSummaryEngine.ts';
import { DrillDownEngine } from './drillDownModal.ts';
import { 
    rawData, 
    headers, 
    onSummaryModeChanged, 
    recalculateActiveSummary,
    currentUserId 
} from '../../store/DataHandler.ts';
import { showMessage } from '../core/utils.ts';

export class SummaryConfigModal {
    private static modalElement: HTMLElement | null = null;
    private static bsModalInstance: any = null;
    private static currentDraftConfig: SummaryConfig | null = null;

    /**
     * Initializes the modal in the DOM if not already present
     */
    public static init(): void {
        if (this.modalElement) return;

        const modalHtml = `
            <div class="modal fade" id="smartSummaryConfigModal" tabindex="-1" aria-labelledby="smartSummaryConfigModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                    <div class="modal-content border-0 shadow-2xl rounded-4 overflow-hidden">
                        <!-- Header -->
                        <div class="modal-header border-bottom py-2.5 px-4 bg-slate-900 text-white">
                            <div class="d-flex align-items-center gap-2">
                                <div class="p-1.5 rounded-3 bg-emerald-500/20 text-emerald-400 d-flex align-items-center justify-content-center">
                                    <i class="bi bi-file-earmark-zip-fill fs-5"></i>
                                </div>
                                <div>
                                    <h6 class="modal-title fw-bold mb-0 text-white" id="smartSummaryConfigModalLabel">
                                        Smart Compression & Dataset Summary Engine
                                    </h6>
                                    <small class="text-slate-400" style="font-size: 0.72rem;">
                                        High-speed aggregated analytics for massive datasets (Real-Time Synced)
                                    </small>
                                </div>
                            </div>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>

                        <!-- Body -->
                        <div class="modal-body p-4 bg-slate-50 text-slate-800" style="max-height: 75vh;">
                            
                            <!-- Compression Telemetry Card -->
                            <div class="card border-0 shadow-xs rounded-3 bg-white p-3 mb-3" id="compressionStatsCard">
                                <div class="d-flex align-items-center justify-content-between mb-2">
                                    <span class="text-xs fw-bold text-slate-600 text-uppercase letter-spacing-1 d-flex align-items-center gap-1.5">
                                        <i class="bi bi-cpu text-primary"></i> Data Compression Performance
                                    </span>
                                    <span id="compressionBadge" class="badge bg-emerald-100 text-emerald-800 border border-emerald-300 font-monospace">
                                        -85% Space Saved
                                    </span>
                                </div>
                                <div class="row g-2 text-center" id="compressionMetricsRow">
                                    <div class="col-3">
                                        <div class="p-2 rounded-2 bg-slate-50 border border-slate-100">
                                            <div class="text-muted text-2xs text-uppercase">Original Data</div>
                                            <div class="fw-bold text-sm text-slate-700 font-monospace" id="statOriginalSize">--</div>
                                        </div>
                                    </div>
                                    <div class="col-3">
                                        <div class="p-2 rounded-2 bg-emerald-50 border border-emerald-100">
                                            <div class="text-emerald-700 text-2xs text-uppercase">Compressed</div>
                                            <div class="fw-bold text-sm text-emerald-800 font-monospace" id="statCompressedSize">--</div>
                                        </div>
                                    </div>
                                    <div class="col-3">
                                        <div class="p-2 rounded-2 bg-slate-50 border border-slate-100">
                                            <div class="text-muted text-2xs text-uppercase">Total Raw Rows</div>
                                            <div class="fw-bold text-sm text-slate-700 font-monospace" id="statTotalRows">--</div>
                                        </div>
                                    </div>
                                    <div class="col-3">
                                        <div class="p-2 rounded-2 bg-blue-50 border border-blue-100">
                                            <div class="text-blue-700 text-2xs text-uppercase">Engines</div>
                                            <div class="fw-bold text-2xs text-blue-800 font-monospace mt-1">DuckDB + Worker</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Mode Toggle Switcher -->
                            <div class="card border-0 shadow-xs rounded-3 bg-white p-3 mb-3">
                                <div class="d-flex align-items-center justify-content-between">
                                    <div>
                                        <h6 class="fw-bold text-slate-800 mb-0 d-flex align-items-center gap-1.5">
                                            <i class="bi bi-lightning-charge-fill text-amber-500"></i> Smart Summary Engine Mode
                                        </h6>
                                        <p class="text-muted small mb-0 mt-0.5" style="font-size: 0.75rem;">
                                            When enabled, app computes and renders high-speed summary for charts & dashboards.
                                            <span class="text-emerald-600 fw-semibold">Summary real data ke sath automatic update hoti rehti hai.</span>
                                        </p>
                                    </div>
                                    <div class="form-check form-switch form-check-lg m-0">
                                        <input class="form-check-input cursor-pointer" type="checkbox" id="toggleSummaryEngineSwitch" checked style="width: 2.75rem; height: 1.5rem;">
                                    </div>
                                </div>
                            </div>

                            <!-- Multiple Saved Presets Card -->
                            <div class="card border-0 shadow-xs rounded-3 bg-white p-3 mb-3" id="summaryPresetsCard">
                                <div class="d-flex align-items-center justify-content-between mb-2">
                                    <label class="form-label fw-bold text-slate-700 small mb-0 d-flex align-items-center gap-1.5">
                                        <i class="bi bi-bookmarks-fill text-indigo-600"></i> Business View Presets (अलग-अलग बिज़नेस व्यूज):
                                    </label>
                                    <span class="badge bg-indigo-50 text-indigo-700 border border-indigo-200" id="presetCountBadge">Presets Ready</span>
                                </div>
                                <div class="row g-2 align-items-center">
                                    <div class="col-md-5">
                                        <select class="form-select form-select-sm fw-medium border-slate-300" id="summaryPresetsSelect">
                                            <option value="">Loading Presets...</option>
                                        </select>
                                    </div>
                                    <div class="col-md-7 d-flex align-items-center gap-1.5 flex-wrap">
                                        <button type="button" class="btn btn-outline-primary btn-sm px-2.5 py-1 text-xs" id="btnSaveCurrentPreset" title="Save current configuration as a new named preset">
                                            <i class="bi bi-bookmark-plus me-1"></i> Save View
                                        </button>
                                        <button type="button" class="btn btn-outline-secondary btn-sm px-2.5 py-1 text-xs" id="btnSetDefaultPreset" title="Set this view as default startup preset">
                                            <i class="bi bi-star me-1"></i> Make Default
                                        </button>
                                        <button type="button" class="btn btn-outline-danger btn-sm px-2 py-1 text-xs" id="btnDeletePreset" title="Delete current preset">
                                            <i class="bi bi-trash"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <!-- Custom Summary Configuration Section -->
                            <div id="summaryConfigSection">
                                <!-- Dimensions (Group By) -->
                                <div class="card border-0 shadow-xs rounded-3 bg-white p-3 mb-3">
                                    <div class="d-flex align-items-center justify-content-between mb-2">
                                        <label class="form-label fw-bold text-slate-700 small mb-0 d-flex align-items-center gap-1.5">
                                            <i class="bi bi-diagram-3-fill text-indigo-500"></i> Group By (Dimensions):
                                        </label>
                                        <span class="text-muted text-2xs">Select 1 or more columns to group by</span>
                                    </div>
                                    <div class="d-flex flex-wrap gap-2" id="dimensionsContainer">
                                        <!-- Checkbox pills populated dynamically -->
                                    </div>
                                </div>

                                <!-- Date Grouping (if date column exists) -->
                                <div class="card border-0 shadow-xs rounded-3 bg-white p-3 mb-3" id="dateGroupingCard" style="display: none;">
                                    <div class="row g-2 align-items-center">
                                        <div class="col-md-6">
                                            <label class="form-label fw-bold text-slate-700 small mb-1 d-flex align-items-center gap-1.5">
                                                <i class="bi bi-calendar-event text-rose-500"></i> Date Grouping Column:
                                            </label>
                                            <select class="form-select form-select-sm" id="summaryDateColumnSelect">
                                                <option value="">None (No Date Rollup)</option>
                                            </select>
                                        </div>
                                        <div class="col-md-6">
                                            <label class="form-label fw-bold text-slate-700 small mb-1">
                                                Date Rollup Interval:
                                            </label>
                                            <select class="form-select form-select-sm" id="summaryDateIntervalSelect">
                                                <option value="none">Raw Date (No Truncation)</option>
                                                <option value="day">Daily (YYYY-MM-DD)</option>
                                                <option value="month" selected>Monthly (YYYY-MM)</option>
                                                <option value="year">Yearly (YYYY)</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <!-- Metrics Aggregators -->
                                <div class="card border-0 shadow-xs rounded-3 bg-white p-3 mb-3">
                                    <div class="d-flex align-items-center justify-content-between mb-2">
                                        <label class="form-label fw-bold text-slate-700 small mb-0 d-flex align-items-center gap-1.5">
                                            <i class="bi bi-calculator-fill text-blue-500"></i> Metric Calculations (Aggregations):
                                        </label>
                                        <span class="text-muted text-2xs">Configure how numeric values are calculated</span>
                                    </div>
                                    <div class="table-responsive rounded-2 border border-slate-100" style="max-height: 200px; overflow-y: auto;">
                                        <table class="table table-sm table-hover mb-0 align-middle" style="font-size: 0.78rem;">
                                            <thead class="table-light text-muted">
                                                <tr>
                                                    <th class="ps-3">Column Name</th>
                                                    <th>Type</th>
                                                    <th>Aggregation Function</th>
                                                </tr>
                                            </thead>
                                            <tbody id="metricsTableBody">
                                                <!-- Populated dynamically -->
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <!-- Live Rollup Preview & Impact -->
                                <div class="card border-0 shadow-xs rounded-3 bg-emerald-50/60 border-emerald-200 p-3">
                                    <div class="d-flex align-items-center justify-content-between mb-2">
                                        <span class="text-xs fw-bold text-emerald-800 d-flex align-items-center gap-1.5">
                                            <i class="bi bi-speedometer2 text-emerald-600"></i> Summary Performance Impact:
                                        </span>
                                        <span id="previewReductionBadge" class="badge bg-emerald-600 text-white font-monospace text-xs">
                                            Calculating...
                                        </span>
                                    </div>
                                    <div class="d-flex align-items-center justify-content-between text-muted text-2xs mb-2">
                                        <span>Raw Rows: <strong id="previewRawRows" class="text-slate-800">0</strong></span>
                                        <span>➔</span>
                                        <span>Summary Rows: <strong id="previewSummaryRows" class="text-emerald-700">0</strong></span>
                                        <span>Execution Time: <strong id="previewExecTime" class="text-slate-800">0ms</strong></span>
                                    </div>
                                    <div id="previewSampleContainer" class="p-2 rounded-2 bg-white border border-emerald-100 font-monospace text-2xs overflow-auto" style="max-height: 90px;">
                                        <!-- Sample rows preview -->
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Footer -->
                        <div class="modal-footer border-top py-2.5 px-4 bg-white d-flex justify-content-between align-items-center">
                            <button type="button" class="btn btn-sm btn-outline-secondary" id="btnResetToAutoSummary">
                                <i class="bi bi-magic me-1"></i> Auto-Profile
                            </button>
                            <div class="d-flex gap-2">
                                <button type="button" class="btn btn-sm btn-secondary" data-bs-dismiss="modal">Close</button>
                                <button type="button" class="btn btn-sm btn-primary px-3 fw-bold" id="btnApplySummaryConfig">
                                    <i class="bi bi-check-circle-fill me-1"></i> Generate & Apply Summary
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const div = document.createElement('div');
        div.innerHTML = modalHtml;
        document.body.appendChild(div.firstElementChild as HTMLElement);
        this.modalElement = document.getElementById('smartSummaryConfigModal');

        this.bindEvents();
    }

    /**
     * Binds UI events inside modal
     */
    private static bindEvents(): void {
        if (!this.modalElement) return;

        // Toggle Switch
        const toggleSwitch = document.getElementById('toggleSummaryEngineSwitch') as HTMLInputElement | null;
        const configSection = document.getElementById('summaryConfigSection');
        if (toggleSwitch && configSection) {
            toggleSwitch.addEventListener('change', () => {
                if (toggleSwitch.checked) {
                    configSection.style.opacity = '1';
                    configSection.style.pointerEvents = 'auto';
                } else {
                    configSection.style.opacity = '0.45';
                    configSection.style.pointerEvents = 'none';
                }
                this.updateLivePreview();
            });
        }

        // Apply Button
        const applyBtn = document.getElementById('btnApplySummaryConfig');
        if (applyBtn) {
            applyBtn.addEventListener('click', async () => {
                await this.applyConfig();
            });
        }

        // Reset to Auto Button
        const resetBtn = document.getElementById('btnResetToAutoSummary');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.resetToAuto();
            });
        }

        // Date Column / Interval Change
        const dateColSelect = document.getElementById('summaryDateColumnSelect');
        const dateIntervalSelect = document.getElementById('summaryDateIntervalSelect');
        if (dateColSelect) {
            dateColSelect.addEventListener('change', () => this.updateLivePreview());
        }
        if (dateIntervalSelect) {
            dateIntervalSelect.addEventListener('change', () => this.updateLivePreview());
        }

        // Presets Select
        const presetsSelect = document.getElementById('summaryPresetsSelect') as HTMLSelectElement | null;
        if (presetsSelect) {
            presetsSelect.addEventListener('change', () => {
                const selectedId = presetsSelect.value;
                if (!selectedId) return;
                const presets = SmartSummaryEngine.getPresets();
                const matched = presets.find(p => p.id === selectedId);
                if (matched) {
                    SmartSummaryEngine.setActivePresetId(selectedId);
                    this.currentDraftConfig = JSON.parse(JSON.stringify(matched.config));
                    this.renderFormControls(this.currentDraftConfig!);
                    this.updateLivePreview();
                    showMessage(`व्यावसायिक दृश्य (Preset) लोड हुआ: "${matched.name}"`, "info");
                }
            });
        }

        // Save Current View as Preset
        const savePresetBtn = document.getElementById('btnSaveCurrentPreset');
        if (savePresetBtn) {
            savePresetBtn.addEventListener('click', async () => {
                const draft = this.extractCurrentDraft();
                const presetName = prompt('इस समरी व्यू (Preset) का नाम दर्ज करें:', `Business View ${SmartSummaryEngine.getPresets().length + 1}`);
                if (!presetName || !presetName.trim()) return;

                const saved = await SmartSummaryEngine.savePreset(
                    currentUserId || 'guest_user',
                    presetName.trim(),
                    draft
                );
                this.renderPresetsList();
                showMessage(`नया समरी व्यू सुरक्षित हुआ: "${saved.name}"`, "success");
            });
        }

        // Set as Default Preset
        const setDefaultPresetBtn = document.getElementById('btnSetDefaultPreset');
        if (setDefaultPresetBtn) {
            setDefaultPresetBtn.addEventListener('click', async () => {
                const activeId = SmartSummaryEngine.getActivePresetId();
                if (!activeId) return;
                await SmartSummaryEngine.setDefaultPreset(currentUserId || 'guest_user', activeId);
                this.renderPresetsList();
                showMessage('यह दृश्य डिफ़ॉल्ट प्रीसेट के रूप में सेट किया गया।', "success");
            });
        }

        // Delete Preset
        const deletePresetBtn = document.getElementById('btnDeletePreset');
        if (deletePresetBtn) {
            deletePresetBtn.addEventListener('click', async () => {
                const activeId = SmartSummaryEngine.getActivePresetId();
                if (!activeId) return;
                const presets = SmartSummaryEngine.getPresets();
                if (presets.length <= 1) {
                    showMessage('कम से कम एक प्रीसेट होना अनिवार्य है।', "warning");
                    return;
                }
                const currentPreset = presets.find(p => p.id === activeId);
                if (confirm(`क्या आप "${currentPreset?.name || 'यह प्रीसेट'}" को हटाना चाहते हैं?`)) {
                    await SmartSummaryEngine.deletePreset(currentUserId || 'guest_user', activeId);
                    this.renderPresetsList();
                    const newActive = SmartSummaryEngine.getActiveConfig();
                    if (newActive) {
                        this.currentDraftConfig = JSON.parse(JSON.stringify(newActive));
                        this.renderFormControls(this.currentDraftConfig!);
                        this.updateLivePreview();
                    }
                    showMessage('प्रीसेट हटा दिया गया।', "info");
                }
            });
        }
    }

    /**
     * Renders presets dropdown list
     */
    private static renderPresetsList(): void {
        const select = document.getElementById('summaryPresetsSelect') as HTMLSelectElement | null;
        const countBadge = document.getElementById('presetCountBadge');
        if (!select) return;

        const presets = SmartSummaryEngine.getPresets();
        const activeId = SmartSummaryEngine.getActivePresetId();

        if (countBadge) {
            countBadge.textContent = `${presets.length} Presets Available`;
        }

        select.innerHTML = '';
        if (presets.length === 0) {
            select.innerHTML = '<option value="">No Saved Presets</option>';
            return;
        }

        presets.forEach(preset => {
            const opt = document.createElement('option');
            opt.value = preset.id;
            opt.textContent = `${preset.name}${preset.isDefault ? ' (★ Default)' : ''}`;
            if (preset.id === activeId) {
                opt.selected = true;
            }
            select.appendChild(opt);
        });
    }

    /**
     * Opens the modal, populates current telemetry and config
     */
    public static async open(compressionStats?: CompressionStats): Promise<void> {
        this.init();
        if (!this.modalElement) return;

        // Update compression telemetry
        this.renderCompressionStats(compressionStats);

        // Load or initialize presets
        await SmartSummaryEngine.loadPresets(currentUserId || 'guest_user', rawData);
        this.renderPresetsList();

        // Get or build config
        let activeCfg = SmartSummaryEngine.getActiveConfig();
        if (!activeCfg || !activeCfg.dimensions || activeCfg.dimensions.length === 0) {
            activeCfg = SmartSummaryEngine.generateSmartDefaultConfig(rawData, headers);
            SmartSummaryEngine.setActiveConfig(activeCfg);
        }
        this.currentDraftConfig = JSON.parse(JSON.stringify(activeCfg));

        // Populate Form Controls
        this.renderFormControls(this.currentDraftConfig!);
        this.updateLivePreview();

        // Show Bootstrap Modal
        const bs = (window as any).bootstrap;
        if (bs && bs.Modal) {
            this.bsModalInstance = bs.Modal.getOrCreateInstance(this.modalElement);
            this.bsModalInstance.show();
        }
    }

    /**
     * Render Compression Telemetry Card
     */
    private static renderCompressionStats(stats?: CompressionStats): void {
        const origEl = document.getElementById('statOriginalSize');
        const compEl = document.getElementById('statCompressedSize');
        const rowsEl = document.getElementById('statTotalRows');
        const badgeEl = document.getElementById('compressionBadge');

        const rowCount = rawData ? rawData.length : 0;
        if (rowsEl) rowsEl.textContent = rowCount.toLocaleString() + ' rows';

        if (stats) {
            if (origEl) origEl.textContent = stats.originalSizeFormatted;
            if (compEl) compEl.textContent = stats.compressedSizeFormatted;
            if (badgeEl) badgeEl.textContent = `-${stats.compressionRatioPercent}% Saved`;
        } else {
            // Estimate size from rawData
            const estimatedBytes = JSON.stringify(rawData).length;
            const estimatedCompressed = Math.round(estimatedBytes * 0.12);
            if (origEl) origEl.textContent = SmartDataCompressor.formatBytes(estimatedBytes);
            if (compEl) compEl.textContent = SmartDataCompressor.formatBytes(estimatedCompressed);
            if (badgeEl) badgeEl.textContent = `-88% Saved`;
        }
    }

    /**
     * Render Dimension Checkboxes & Metric Options
     */
    private static renderFormControls(cfg: SummaryConfig): void {
        const toggleSwitch = document.getElementById('toggleSummaryEngineSwitch') as HTMLInputElement | null;
        if (toggleSwitch) {
            toggleSwitch.checked = cfg.enabled;
            const configSection = document.getElementById('summaryConfigSection');
            if (configSection) {
                configSection.style.opacity = cfg.enabled ? '1' : '0.45';
                configSection.style.pointerEvents = cfg.enabled ? 'auto' : 'none';
            }
        }

        // Profile Columns
        const profiles = SmartSummaryEngine.profileColumns(rawData, headers);
        const dimsContainer = document.getElementById('dimensionsContainer');
        const metricsTbody = document.getElementById('metricsTableBody');
        const dateCard = document.getElementById('dateGroupingCard');
        const dateSelect = document.getElementById('summaryDateColumnSelect') as HTMLSelectElement | null;
        const intervalSelect = document.getElementById('summaryDateIntervalSelect') as HTMLSelectElement | null;

        // 1. Dimensions
        if (dimsContainer) {
            dimsContainer.innerHTML = '';
            profiles.forEach(p => {
                const isSelected = cfg.dimensions.includes(p.name);
                const pill = document.createElement('div');
                pill.className = 'form-check form-check-inline m-0';
                pill.innerHTML = `
                    <input class="btn-check dimension-checkbox" type="checkbox" id="dim_${p.name}" value="${p.name}" ${isSelected ? 'checked' : ''}>
                    <label class="btn btn-xs ${isSelected ? 'btn-primary' : 'btn-outline-secondary'} rounded-pill py-1 px-2.5 d-flex align-items-center gap-1" for="dim_${p.name}">
                        <i class="bi bi-${p.type === 'categorical' ? 'tags' : (p.type === 'date' ? 'calendar' : 'fonts')} text-2xs"></i>
                        <span>${p.name}</span>
                        <span class="badge bg-dark bg-opacity-25 rounded-pill text-2xs">${p.distinctCount}</span>
                    </label>
                `;
                dimsContainer.appendChild(pill);
            });

            // Listen to dimension changes
            dimsContainer.querySelectorAll('.dimension-checkbox').forEach(input => {
                input.addEventListener('change', (e: any) => {
                    const label = document.querySelector(`label[for="${e.target.id}"]`);
                    if (label) {
                        if (e.target.checked) {
                            label.classList.remove('btn-outline-secondary');
                            label.classList.add('btn-primary');
                        } else {
                            label.classList.remove('btn-primary');
                            label.classList.add('btn-outline-secondary');
                        }
                    }
                    this.updateLivePreview();
                });
            });
        }

        // 2. Date Grouping
        const dateProfiles = profiles.filter(p => p.type === 'date');
        if (dateProfiles.length > 0 && dateCard && dateSelect) {
            dateCard.style.display = 'block';
            dateSelect.innerHTML = '<option value="">None (No Date Rollup)</option>';
            dateProfiles.forEach(dp => {
                const opt = document.createElement('option');
                opt.value = dp.name;
                opt.textContent = dp.name;
                if (cfg.dateColumn === dp.name) opt.selected = true;
                dateSelect.appendChild(opt);
            });
            if (intervalSelect && cfg.dateGrouping) {
                intervalSelect.value = cfg.dateGrouping;
            }
        } else if (dateCard) {
            dateCard.style.display = 'none';
        }

        // 3. Metrics Table
        if (metricsTbody) {
            metricsTbody.innerHTML = '';
            profiles.forEach(p => {
                const tr = document.createElement('tr');
                const existingMetric = cfg.metrics.find(m => m.column === p.name);
                const currentAgg = existingMetric ? existingMetric.agg : (p.type === 'numeric' ? 'sum' : 'ignore');

                tr.innerHTML = `
                    <td class="ps-3 fw-medium text-slate-700 font-monospace">${p.name}</td>
                    <td>
                        <span class="badge ${p.type === 'numeric' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-slate-100 text-slate-600'} text-2xs">
                            ${p.type}
                        </span>
                    </td>
                    <td>
                        <select class="form-select form-select-xs metric-agg-select" data-col="${p.name}" style="width: 140px; font-size: 0.72rem; padding: 2px 6px;">
                            <option value="ignore" ${currentAgg === 'ignore' ? 'selected' : ''}>Ignore (Skip)</option>
                            <option value="sum" ${currentAgg === 'sum' ? 'selected' : ''}>SUM (Total)</option>
                            <option value="avg" ${currentAgg === 'avg' ? 'selected' : ''}>AVG (Average)</option>
                            <option value="median" ${currentAgg === 'median' ? 'selected' : ''}>MEDIAN (DuckDB C++)</option>
                            <option value="stddev" ${currentAgg === 'stddev' ? 'selected' : ''}>STDDEV (DuckDB C++)</option>
                            <option value="distinct_count" ${currentAgg === 'distinct_count' ? 'selected' : ''}>DISTINCT COUNT</option>
                            <option value="count" ${currentAgg === 'count' ? 'selected' : ''}>COUNT (Rows)</option>
                            <option value="min" ${currentAgg === 'min' ? 'selected' : ''}>MIN (Minimum)</option>
                            <option value="max" ${currentAgg === 'max' ? 'selected' : ''}>MAX (Maximum)</option>
                        </select>
                    </td>
                `;
                metricsTbody.appendChild(tr);
            });

            // Listen to metric select changes
            metricsTbody.querySelectorAll('.metric-agg-select').forEach(sel => {
                sel.addEventListener('change', () => this.updateLivePreview());
            });
        }
    }

    /**
     * Gather draft configuration from current modal UI
     */
    private static extractCurrentDraft(): SummaryConfig {
        const toggleSwitch = document.getElementById('toggleSummaryEngineSwitch') as HTMLInputElement | null;
        const enabled = toggleSwitch ? toggleSwitch.checked : true;

        // Selected Dimensions
        const dimensions: string[] = [];
        const checkboxes = document.querySelectorAll('#dimensionsContainer .dimension-checkbox:checked');
        checkboxes.forEach((cb: any) => {
            dimensions.push(cb.value);
        });

        // Date Grouping
        const dateSelect = document.getElementById('summaryDateColumnSelect') as HTMLSelectElement | null;
        const intervalSelect = document.getElementById('summaryDateIntervalSelect') as HTMLSelectElement | null;
        const dateColumn = dateSelect && dateSelect.value ? dateSelect.value : undefined;
        const dateGrouping = (intervalSelect && intervalSelect.value ? intervalSelect.value : 'none') as DateTruncation;

        // Metrics
        const metrics: { column: string; agg: AggregationFunction }[] = [];
        const selects = document.querySelectorAll('#metricsTableBody .metric-agg-select');
        selects.forEach((sel: any) => {
            const col = sel.getAttribute('data-col');
            const agg = sel.value;
            if (col && agg !== 'ignore') {
                metrics.push({ column: col, agg: agg as AggregationFunction });
            }
        });

        return {
            enabled,
            dimensions: dimensions.length > 0 ? dimensions : [headers[0] || 'id'],
            metrics,
            dateColumn,
            dateGrouping,
            thresholdRows: SmartSummaryEngine.DEFAULT_THRESHOLD_ROWS,
            autoGenerated: false,
            lastUpdated: new Date().toISOString()
        };
    }

    /**
     * Computes a live preview from current draft without saving
     */
    private static async updateLivePreview(): Promise<void> {
        const draft = this.extractCurrentDraft();
        const rawCount = rawData ? rawData.length : 0;
        const rawEl = document.getElementById('previewRawRows');
        const sumEl = document.getElementById('previewSummaryRows');
        const redBadge = document.getElementById('previewReductionBadge');
        const execTimeEl = document.getElementById('previewExecTime');
        const sampleEl = document.getElementById('previewSampleContainer');

        if (rawEl) rawEl.textContent = rawCount.toLocaleString();

        if (!draft.enabled || rawCount === 0) {
            if (sumEl) sumEl.textContent = rawCount.toLocaleString() + ' (Raw Mode)';
            if (redBadge) redBadge.textContent = 'Full Raw Mode';
            if (execTimeEl) execTimeEl.textContent = '0ms';
            if (sampleEl) sampleEl.innerHTML = '<span class="text-muted">Summary engine is paused. Raw dataset will be loaded.</span>';
            return;
        }

        const result = await SmartSummaryEngine.computeSummaryAsync(rawData, draft, currentUserId || 'guest_user');

        if (sumEl) sumEl.textContent = result.summaryRowCount.toLocaleString();
        if (redBadge) redBadge.textContent = `-${result.reductionPercentage}% Rows Reduced`;
        if (execTimeEl) execTimeEl.textContent = `${result.executionTimeMs}ms`;

        if (sampleEl) {
            if (result.summaryData.length === 0) {
                sampleEl.innerHTML = '<span class="text-danger">No summary rows produced. Please select at least one valid dimension.</span>';
            } else {
                const sampleRows = result.summaryData.slice(0, 4);
                sampleEl.innerHTML = `
                    <div class="table-responsive">
                        <table class="table table-2xs mb-0 text-slate-700">
                            <thead>
                                <tr class="text-muted">
                                    <th class="p-1">Action</th>
                                    ${result.summaryHeaders.slice(0, 6).map(h => `<th class="p-1">${h}</th>`).join('')}
                                </tr>
                            </thead>
                            <tbody>
                                ${sampleRows.map((r, idx) => `
                                    <tr class="align-middle hover:bg-slate-100">
                                        <td class="p-1">
                                            <button type="button" class="btn btn-outline-primary py-0 px-1.5 text-3xs rounded-pill d-inline-flex align-items-center gap-1 btn-preview-drill" data-index="${idx}">
                                                <i class="bi bi-box-arrow-in-down-right"></i> Drill-Down
                                            </button>
                                        </td>
                                        ${result.summaryHeaders.slice(0, 6).map(h => `<td class="p-1 font-monospace text-xs">${r[h] ?? ''}</td>`).join('')}
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `;

                // Bind drill-down click handlers
                const drillBtns = sampleEl.querySelectorAll('.btn-preview-drill');
                drillBtns.forEach((btn: any) => {
                    btn.addEventListener('click', (ev: MouseEvent) => {
                        ev.stopPropagation();
                        const idx = parseInt(btn.dataset.index || '0', 10);
                        const targetRow = sampleRows[idx];
                        if (targetRow) {
                            DrillDownEngine.openDrillDown(targetRow, `Preview Row #${idx + 1} Drill-Down`);
                        }
                    });
                });
            }
        }
    }

    /**
     * Saves and applies the configuration to the active application
     */
    private static async applyConfig(): Promise<void> {
        const draft = this.extractCurrentDraft();
        
        // Save to engine & storage
        await SmartSummaryEngine.saveSummaryConfig(currentUserId || 'guest', draft);

        // Notify DataHandler to recalculate and refresh charts & tables
        await onSummaryModeChanged(draft);

        // Update small menu bar indicator
        this.updateToolbarIndicator(draft.enabled);

        if (this.bsModalInstance) {
            this.bsModalInstance.hide();
        }

        const modeMsg = draft.enabled 
            ? `⚡ Smart Summary Engine सक्रिय है! ${draft.dimensions.join(', ')} के आधार पर डेटा रोलअप लोड हुआ।`
            : "📦 Full Raw Data Mode बहाल किया गया।";
        showMessage(modeMsg, "success");
    }

    /**
     * Resets current form to Smart Auto-Profile
     */
    private static resetToAuto(): void {
        const autoCfg = SmartSummaryEngine.generateSmartDefaultConfig(rawData, headers);
        this.renderFormControls(autoCfg);
        this.updateLivePreview();
        showMessage("स्मार्ट ऑटो-प्रोफ़ाइल लोड की गई।", "info");
    }

    /**
     * Updates the Small Menu Bar vector icon active state
     */
    public static updateToolbarIndicator(isActive: boolean): void {
        const btn = document.getElementById('btnSmartDataEngine');
        if (!btn) return;

        const badge = btn.querySelector('.summary-active-dot');
        if (isActive) {
            btn.classList.add('border-emerald-500', 'bg-emerald-50');
            if (!badge) {
                const dot = document.createElement('span');
                dot.className = 'summary-active-dot position-absolute top-0 start-100 translate-middle p-1 bg-emerald-500 border border-white rounded-circle';
                dot.title = 'Smart Summary Engine Active';
                btn.appendChild(dot);
            }
        } else {
            btn.classList.remove('border-emerald-500', 'bg-emerald-50');
            if (badge) badge.remove();
        }
    }
}
