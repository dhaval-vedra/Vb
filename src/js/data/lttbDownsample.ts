/**
 * Largest-Triangle-Three-Buckets (LTTB) High-Performance Data Downsampling Engine
 * & User-Defined Custom Sample Selection Engine.
 * 
 * Downsamples large datasets (e.g., 10k - 1M points) while preserving visual peaks,
 * and allows users to define EXACTLY which samples to display:
 * - By Custom Indices/Ranges (e.g. "1-50, 100, 250-300, 500")
 * - By Row Slice / Range (e.g. from row 100 to 500)
 * - By Step Interval (e.g. every 2nd, 5th, 10th row)
 * - By Top Spikes / Outliers / Threshold
 * - By Pinned Key Points
 */

export interface CustomSampleConfig {
    mode: 'auto-lttb' | 'custom-indices' | 'slice-range' | 'step-interval' | 'value-condition' | 'top-spikes';
    customIndicesText: string;
    sliceStart: number;
    sliceEnd: number;
    stepInterval: number;
    conditionType: 'gt' | 'lt' | 'outliers' | 'top-highest' | 'top-lowest';
    conditionThreshold: number;
    topNCount: number;
    pinnedIndices: number[];
}

export interface LTTBConfig {
    enabled: boolean;
    targetResolution: number;
    preset: 'turbo' | 'balanced' | 'high' | 'raw' | 'custom';
    strategy: 'lttb' | 'every-nth' | 'raw';
    custom: CustomSampleConfig;
}

export interface LTTBStats {
    originalCount: number;
    sampledCount: number;
    compressionRatio: number;
    savedPercentage: number;
    isDownsampled: boolean;
    activeMode: string;
}

const STORAGE_KEY = 'vedrabi_lttb_config';

const DEFAULT_CONFIG: LTTBConfig = {
    enabled: true,
    targetResolution: 1500,
    preset: 'balanced',
    strategy: 'lttb',
    custom: {
        mode: 'auto-lttb',
        customIndicesText: '1-100, 250, 500-600',
        sliceStart: 1,
        sliceEnd: 1000,
        stepInterval: 5,
        conditionType: 'outliers',
        conditionThreshold: 0,
        topNCount: 50,
        pinnedIndices: []
    }
};

let currentConfig: LTTBConfig = loadConfig();

function loadConfig(): LTTBConfig {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            return {
                ...DEFAULT_CONFIG,
                ...parsed,
                custom: { ...DEFAULT_CONFIG.custom, ...(parsed.custom || {}) }
            };
        }
    } catch {
        // Fallback to default
    }
    return { ...DEFAULT_CONFIG, custom: { ...DEFAULT_CONFIG.custom } };
}

function saveConfig(): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(currentConfig));
    } catch {
        // Ignore quota errors
    }
}

/**
 * Gets current active LTTB & Custom Sampling configuration
 */
export function getLTTBConfig(): LTTBConfig {
    return { ...currentConfig, custom: { ...currentConfig.custom } };
}

/**
 * Gets the active sampling threshold
 */
export function getLTTBThreshold(): number {
    if (!currentConfig.enabled || currentConfig.preset === 'raw' || currentConfig.strategy === 'raw') {
        return Infinity;
    }
    return Math.max(50, currentConfig.targetResolution);
}

/**
 * Updates LTTB configuration and notifies UI / charts
 */
export function setLTTBConfig(configUpdate: Partial<LTTBConfig>, triggerReplot: boolean = true): void {
    currentConfig = {
        ...currentConfig,
        ...configUpdate,
        custom: configUpdate.custom ? { ...currentConfig.custom, ...configUpdate.custom } : currentConfig.custom
    };
    saveConfig();
    updateLTTBUIElements();

    if (triggerReplot) {
        notifyChartsToUpdate();
    }
}

/**
 * Sets target resolution directly from slider
 */
export function setLTTBResolution(resolution: number, triggerReplot: boolean = true): void {
    const clamped = Math.max(50, Math.min(20000, resolution));
    let preset: LTTBConfig['preset'] = 'custom';
    if (clamped <= 500) preset = 'turbo';
    else if (clamped === 1500) preset = 'balanced';
    else if (clamped === 5000) preset = 'high';

    setLTTBConfig({
        targetResolution: clamped,
        preset,
        strategy: 'lttb',
        enabled: true,
        custom: { ...currentConfig.custom, mode: 'auto-lttb' }
    }, triggerReplot);
}

/**
 * Sets one of the quick preset modes
 */
export function setLTTBPreset(preset: 'turbo' | 'balanced' | 'high' | 'raw', triggerReplot: boolean = true): void {
    let resolution = 1500;
    let enabled = true;
    let strategy: LTTBConfig['strategy'] = 'lttb';

    switch (preset) {
        case 'turbo':
            resolution = 500;
            break;
        case 'balanced':
            resolution = 1500;
            break;
        case 'high':
            resolution = 5000;
            break;
        case 'raw':
            resolution = 50000;
            strategy = 'raw';
            break;
    }

    setLTTBConfig({
        preset,
        targetResolution: resolution,
        enabled,
        strategy,
        custom: { ...currentConfig.custom, mode: 'auto-lttb' }
    }, triggerReplot);
}

/**
 * Sets user-defined custom sample selection mode
 */
export function setCustomSampleConfig(customUpdate: Partial<CustomSampleConfig>, triggerReplot: boolean = true): void {
    const updatedCustom = { ...currentConfig.custom, ...customUpdate };
    setLTTBConfig({
        custom: updatedCustom,
        preset: 'custom'
    }, triggerReplot);
}

/**
 * Adds or toggles a pinned index that user wants to permanently keep
 */
export function togglePinnedSampleIndex(index: number, triggerReplot: boolean = true): void {
    const pinned = new Set(currentConfig.custom.pinnedIndices);
    if (pinned.has(index)) {
        pinned.delete(index);
    } else {
        pinned.add(index);
    }
    setCustomSampleConfig({ pinnedIndices: Array.from(pinned).sort((a, b) => a - b) }, triggerReplot);
}

/**
 * Parses user input like "1-50, 100, 250-300, 500" into sorted 0-based unique index array
 */
export function parseIndexRanges(inputStr: string, totalRows: number): number[] {
    if (!inputStr || !inputStr.trim()) return [];
    const indices = new Set<number>();
    const tokens = inputStr.split(/[,;\s]+/).map(t => t.trim()).filter(Boolean);

    for (const token of tokens) {
        if (token.includes('-')) {
            const [startStr, endStr] = token.split('-').map(s => s.trim());
            const start = parseInt(startStr, 10);
            const end = parseInt(endStr, 10);
            if (!isNaN(start) && !isNaN(end)) {
                const min = Math.max(1, Math.min(start, end));
                const max = Math.min(totalRows, Math.max(start, end));
                for (let i = min; i <= max; i++) {
                    indices.add(i - 1); // convert 1-based to 0-based
                }
            }
        } else {
            const num = parseInt(token, 10);
            if (!isNaN(num) && num >= 1 && num <= totalRows) {
                indices.add(num - 1); // convert 1-based to 0-based
            }
        }
    }

    return Array.from(indices).sort((a, b) => a - b);
}

/**
 * Filters data based on user-defined sample selection rules
 */
export function applyUserCustomSampling<T = any>(data: T[]): T[] {
    if (!data || !Array.isArray(data) || data.length === 0) return data || [];

    const { custom } = currentConfig;
    const mode = custom.mode || 'auto-lttb';

    let result: T[] = data;

    switch (mode) {
        case 'custom-indices': {
            const indices = parseIndexRanges(custom.customIndicesText, data.length);
            if (indices.length > 0) {
                result = indices.map(idx => data[idx]).filter(Boolean);
            }
            break;
        }

        case 'slice-range': {
            const start = Math.max(0, (custom.sliceStart || 1) - 1);
            const end = Math.min(data.length, custom.sliceEnd || data.length);
            result = data.slice(start, end);
            break;
        }

        case 'step-interval': {
            const step = Math.max(1, custom.stepInterval || 1);
            result = data.filter((_, idx) => idx % step === 0);
            // Always keep first and last
            if (result.length > 0 && result[result.length - 1] !== data[data.length - 1]) {
                result.push(data[data.length - 1]);
            }
            break;
        }

        case 'value-condition': {
            const numericValues = data.map((item, idx) => ({ ...getPointVal(item, idx), original: item }));
            if (custom.conditionType === 'outliers') {
                // Statistical outlier calculation (Mean +/- 1.8 * Standard Deviation)
                const vals = numericValues.map(p => p.y);
                const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
                const std = Math.sqrt(vals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / vals.length) || 1;
                const lowerBound = mean - 1.8 * std;
                const upperBound = mean + 1.8 * std;

                result = numericValues.filter(p => p.y < lowerBound || p.y > upperBound).map(p => p.original);
                if (result.length === 0) {
                    // Fallback to top 20 extreme points if no strict outlier
                    result = data.slice(0, 50);
                }
            } else if (custom.conditionType === 'gt') {
                result = numericValues.filter(p => p.y >= custom.conditionThreshold).map(p => p.original);
            } else if (custom.conditionType === 'lt') {
                result = numericValues.filter(p => p.y <= custom.conditionThreshold).map(p => p.original);
            }
            break;
        }

        case 'top-spikes': {
            const count = Math.max(5, custom.topNCount || 50);
            const numericValues = data.map((item, idx) => ({ ...getPointVal(item, idx), index: idx, original: item }));
            if (custom.conditionType === 'top-lowest') {
                numericValues.sort((a, b) => a.y - b.y);
            } else {
                numericValues.sort((a, b) => b.y - a.y);
            }
            const topIndices = new Set(numericValues.slice(0, count).map(p => p.index));
            // Keep points in original chronological order
            result = data.filter((_, idx) => topIndices.has(idx));
            break;
        }

        case 'auto-lttb':
        default:
            result = data;
            break;
    }

    // Retain any user-pinned indices
    if (custom.pinnedIndices && custom.pinnedIndices.length > 0) {
        const resultSet = new Set(result);
        for (const pinIdx of custom.pinnedIndices) {
            if (pinIdx >= 0 && pinIdx < data.length && !resultSet.has(data[pinIdx])) {
                result.push(data[pinIdx]);
            }
        }
    }

    return result;
}

/**
 * Main downsampling entrypoint: applies user-defined custom sample rules first,
 * then optionally applies LTTB if the dataset is still larger than the target resolution.
 */
export function lttbDownsample<T = any>(data: T[], customThreshold?: number): T[] {
    if (!data || !Array.isArray(data) || data.length === 0) {
        return data || [];
    }

    // Step 1: Apply user custom sample filter
    const userFilteredData = applyUserCustomSampling(data);

    // If user explicitly picked custom indices, condition, or slice, render that exact subset
    if (currentConfig.custom.mode !== 'auto-lttb' && currentConfig.custom.mode !== undefined) {
        return userFilteredData;
    }

    // Step 2: Auto LTTB Downsampling algorithm
    const threshold = customThreshold !== undefined ? customThreshold : getLTTBThreshold();

    if (!isFinite(threshold) || userFilteredData.length <= threshold || threshold <= 2) {
        return userFilteredData;
    }

    const sampled: T[] = [];
    const dataLength = userFilteredData.length;

    // Bucket size. Leave room for start and end points
    const bucketSize = (dataLength - 2) / (threshold - 2);

    let a = 0; // Initially the first point
    sampled.push(userFilteredData[a]);

    for (let i = 0; i < threshold - 2; i++) {
        // Calculate point average for next bucket (bucket C)
        let avgX = 0;
        let avgY = 0;
        const avgRangeStart = Math.floor((i + 1) * bucketSize) + 1;
        const avgRangeEnd = Math.min(Math.floor((i + 2) * bucketSize) + 1, dataLength);
        const avgRangeLength = avgRangeEnd - avgRangeStart;

        for (let j = avgRangeStart; j < avgRangeEnd; j++) {
            const pt = getPointVal(userFilteredData[j], j);
            avgX += pt.x;
            avgY += pt.y;
        }

        if (avgRangeLength > 0) {
            avgX /= avgRangeLength;
            avgY /= avgRangeLength;
        }

        // Get the range for current bucket (bucket B)
        const rangeOffs = Math.floor((i + 0) * bucketSize) + 1;
        const rangeTo = Math.floor((i + 1) * bucketSize) + 1;

        // Point a
        const pointA = getPointVal(userFilteredData[a], a);

        let maxArea = -1;
        let maxAreaPoint = Math.min(rangeOffs, dataLength - 1);

        const safeRangeTo = Math.min(rangeTo, dataLength);
        for (let j = rangeOffs; j < safeRangeTo; j++) {
            const pointB = getPointVal(userFilteredData[j], j);
            // Calculate triangle area over three buckets
            const area = Math.abs(
                (pointA.x - avgX) * (pointB.y - pointA.y) -
                (pointA.x - pointB.x) * (avgY - pointA.y)
            ) * 0.5;

            if (area > maxArea) {
                maxArea = area;
                maxAreaPoint = j;
            }
        }

        if (userFilteredData[maxAreaPoint]) {
            sampled.push(userFilteredData[maxAreaPoint]);
            a = maxAreaPoint;
        }
    }

    // Always include the last point
    sampled.push(userFilteredData[dataLength - 1]);

    return sampled;
}

function getPointVal(item: any, index: number): { x: number; y: number } {
    if (item === null || item === undefined) return { x: index, y: 0 };
    if (typeof item === 'number') {
        return { x: index, y: item };
    }
    if (Array.isArray(item)) {
        return { x: typeof item[0] === 'number' ? item[0] : index, y: Number(item[1]) || 0 };
    }
    if (typeof item === 'object') {
        // Find first numeric property or fallback
        const numericKey = Object.keys(item).find(k => item[k] !== null && item[k] !== undefined && (typeof item[k] === 'number' || (!isNaN(Number(item[k])) && item[k] !== '')));
        const val = numericKey ? Number(item[numericKey]) : 0;
        return { x: index, y: isNaN(val) ? 0 : val };
    }
    return { x: index, y: Number(item) || 0 };
}

/**
 * Calculates compression stats for UI badges and diagnostics
 */
export function computeLTTBStats(originalCount: number, sampledCount: number): LTTBStats {
    const isDownsampled = originalCount > sampledCount;
    const compressionRatio = originalCount > 0 ? parseFloat((originalCount / Math.max(sampledCount, 1)).toFixed(1)) : 1;
    const savedPercentage = originalCount > 0 ? Math.round(((originalCount - sampledCount) / originalCount) * 100) : 0;

    return {
        originalCount,
        sampledCount,
        compressionRatio,
        savedPercentage: Math.max(0, savedPercentage),
        isDownsampled,
        activeMode: currentConfig.custom.mode
    };
}

/**
 * Triggers a chart refresh across the application
 */
function notifyChartsToUpdate(): void {
    if (typeof (window as any).plotAll === 'function') {
        try {
            (window as any).plotAll();
        } catch (e) {
            console.warn('LTTB replot notice:', e);
        }
    }
    
    // Dispatch custom DOM event
    window.dispatchEvent(new CustomEvent('lttb-config-changed', {
        detail: currentConfig
    }));
}

/**
 * Updates all registered UI elements across navbar, offcanvas, and modals
 */
export function updateLTTBUIElements(): void {
    // 1. Navbar badge
    const navbarBadge = document.getElementById('lttbNavbarBadge');
    if (navbarBadge) {
        if (currentConfig.custom.mode !== 'auto-lttb') {
            navbarBadge.textContent = `Custom (${currentConfig.custom.mode})`;
            navbarBadge.className = 'text-xs font-semibold text-purple-600';
        } else if (!currentConfig.enabled || currentConfig.preset === 'raw') {
            navbarBadge.textContent = '100% Raw';
            navbarBadge.className = 'text-xs font-semibold text-emerald-600';
        } else {
            const formatted = currentConfig.targetResolution >= 1000 
                ? `${(currentConfig.targetResolution / 1000).toFixed(1)}k pts` 
                : `${currentConfig.targetResolution} pts`;
            navbarBadge.textContent = formatted;
            navbarBadge.className = 'text-xs font-semibold text-primary';
        }
    }

    // 2. Slider in Settings
    const slider = document.getElementById('lttbResolutionSlider') as HTMLInputElement | null;
    if (slider) {
        slider.value = String(currentConfig.targetResolution);
        slider.disabled = !currentConfig.enabled || currentConfig.preset === 'raw' || currentConfig.custom.mode !== 'auto-lttb';
    }

    // 3. Slider text display
    const labelVal = document.getElementById('lttbResolutionDisplay');
    if (labelVal) {
        if (currentConfig.custom.mode !== 'auto-lttb') {
            labelVal.textContent = `Custom Mode: ${currentConfig.custom.mode}`;
        } else if (!currentConfig.enabled || currentConfig.preset === 'raw') {
            labelVal.textContent = 'Raw Data (No Sampling)';
        } else {
            labelVal.textContent = `${currentConfig.targetResolution.toLocaleString()} points / series`;
        }
    }

    // 4. Toggle Switch
    const toggle = document.getElementById('lttbEnabledToggle') as HTMLInputElement | null;
    if (toggle) {
        toggle.checked = currentConfig.enabled && currentConfig.preset !== 'raw';
    }

    // 5. Preset buttons
    ['turbo', 'balanced', 'high', 'raw'].forEach(preset => {
        const btn = document.getElementById(`lttbPresetBtn_${preset}`);
        if (btn) {
            if (currentConfig.custom.mode === 'auto-lttb' && currentConfig.preset === preset) {
                btn.classList.add('btn-primary', 'active', 'shadow-xs');
                btn.classList.remove('btn-outline-secondary');
            } else {
                btn.classList.remove('btn-primary', 'active', 'shadow-xs');
                btn.classList.add('btn-outline-secondary');
            }
        }
    });

    // 6. Custom Mode Selectors
    const customModeSelect = document.getElementById('lttbCustomModeSelect') as HTMLSelectElement | null;
    if (customModeSelect) {
        customModeSelect.value = currentConfig.custom.mode || 'auto-lttb';
    }

    const customIndicesInput = document.getElementById('lttbCustomIndicesInput') as HTMLInputElement | null;
    if (customIndicesInput) {
        customIndicesInput.value = currentConfig.custom.customIndicesText || '';
    }

    const sliceStartInput = document.getElementById('lttbSliceStartInput') as HTMLInputElement | null;
    if (sliceStartInput) {
        sliceStartInput.value = String(currentConfig.custom.sliceStart || 1);
    }

    const sliceEndInput = document.getElementById('lttbSliceEndInput') as HTMLInputElement | null;
    if (sliceEndInput) {
        sliceEndInput.value = String(currentConfig.custom.sliceEnd || 1000);
    }

    const stepInput = document.getElementById('lttbStepIntervalInput') as HTMLInputElement | null;
    if (stepInput) {
        stepInput.value = String(currentConfig.custom.stepInterval || 5);
    }

    // Show/hide relevant custom control panels based on active mode
    updateCustomModeSubsections(currentConfig.custom.mode);
}

function updateCustomModeSubsections(mode: string): void {
    const panels = {
        'custom-indices': document.getElementById('lttbPanel_indices'),
        'slice-range': document.getElementById('lttbPanel_slice'),
        'step-interval': document.getElementById('lttbPanel_step'),
        'value-condition': document.getElementById('lttbPanel_condition'),
        'top-spikes': document.getElementById('lttbPanel_spikes')
    };

    Object.entries(panels).forEach(([m, el]) => {
        if (el) {
            el.style.display = m === mode ? 'block' : 'none';
        }
    });
}

/**
 * Initializes interactive listeners for LTTB & Custom Sampling controls
 */
export function initLTTBControls(): void {
    updateLTTBUIElements();

    // Slider listener with input debouncing
    const slider = document.getElementById('lttbResolutionSlider') as HTMLInputElement | null;
    if (slider) {
        let debounceTimer: any = null;
        slider.addEventListener('input', (e) => {
            const val = parseInt((e.target as HTMLInputElement).value, 10);
            const labelVal = document.getElementById('lttbResolutionDisplay');
            if (labelVal) {
                labelVal.textContent = `${val.toLocaleString()} points / series`;
            }
            if (debounceTimer) clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                setLTTBResolution(val, true);
            }, 150);
        });
    }

    // Toggle switch listener
    const toggle = document.getElementById('lttbEnabledToggle') as HTMLInputElement | null;
    if (toggle) {
        toggle.addEventListener('change', (e) => {
            const isChecked = (e.target as HTMLInputElement).checked;
            setLTTBConfig({
                enabled: isChecked,
                preset: isChecked ? 'balanced' : 'raw',
                strategy: isChecked ? 'lttb' : 'raw',
                custom: { ...currentConfig.custom, mode: 'auto-lttb' }
            }, true);
        });
    }

    // Preset button listeners
    ['turbo', 'balanced', 'high', 'raw'].forEach(p => {
        const btn = document.getElementById(`lttbPresetBtn_${p}`);
        if (btn) {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                setLTTBPreset(p as any, true);
            });
        }
    });

    // Custom Mode dropdown listener
    const customModeSelect = document.getElementById('lttbCustomModeSelect') as HTMLSelectElement | null;
    if (customModeSelect) {
        customModeSelect.addEventListener('change', (e) => {
            const mode = (e.target as HTMLSelectElement).value as CustomSampleConfig['mode'];
            setCustomSampleConfig({ mode }, true);
            updateCustomModeSubsections(mode);
        });
    }

    // Apply Custom Indices button
    const btnApplyIndices = document.getElementById('btnApplyCustomIndices');
    if (btnApplyIndices) {
        btnApplyIndices.addEventListener('click', (e) => {
            e.preventDefault();
            const textInput = document.getElementById('lttbCustomIndicesInput') as HTMLInputElement | null;
            const customIndicesText = textInput ? textInput.value : '';
            setCustomSampleConfig({
                mode: 'custom-indices',
                customIndicesText
            }, true);
        });
    }

    // Apply Slice Range button
    const btnApplySlice = document.getElementById('btnApplySliceRange');
    if (btnApplySlice) {
        btnApplySlice.addEventListener('click', (e) => {
            e.preventDefault();
            const startInput = document.getElementById('lttbSliceStartInput') as HTMLInputElement | null;
            const endInput = document.getElementById('lttbSliceEndInput') as HTMLInputElement | null;
            setCustomSampleConfig({
                mode: 'slice-range',
                sliceStart: startInput ? parseInt(startInput.value, 10) || 1 : 1,
                sliceEnd: endInput ? parseInt(endInput.value, 10) || 1000 : 1000
            }, true);
        });
    }

    // Apply Step Interval button
    const btnApplyStep = document.getElementById('btnApplyStepInterval');
    if (btnApplyStep) {
        btnApplyStep.addEventListener('click', (e) => {
            e.preventDefault();
            const stepInput = document.getElementById('lttbStepIntervalInput') as HTMLInputElement | null;
            setCustomSampleConfig({
                mode: 'step-interval',
                stepInterval: stepInput ? parseInt(stepInput.value, 10) || 5 : 5
            }, true);
        });
    }

    // Apply Condition button
    const btnApplyCondition = document.getElementById('btnApplyCondition');
    if (btnApplyCondition) {
        btnApplyCondition.addEventListener('click', (e) => {
            e.preventDefault();
            const condTypeSelect = document.getElementById('lttbConditionTypeSelect') as HTMLSelectElement | null;
            const condThreshInput = document.getElementById('lttbConditionThresholdInput') as HTMLInputElement | null;
            setCustomSampleConfig({
                mode: 'value-condition',
                conditionType: (condTypeSelect ? condTypeSelect.value : 'outliers') as any,
                conditionThreshold: condThreshInput ? parseFloat(condThreshInput.value) || 0 : 0
            }, true);
        });
    }

    // Apply Top Spikes button
    const btnApplySpikes = document.getElementById('btnApplyTopSpikes');
    if (btnApplySpikes) {
        btnApplySpikes.addEventListener('click', (e) => {
            e.preventDefault();
            const spikesCountInput = document.getElementById('lttbTopSpikesCount') as HTMLInputElement | null;
            const spikesSortSelect = document.getElementById('lttbTopSpikesSort') as HTMLSelectElement | null;
            setCustomSampleConfig({
                mode: 'top-spikes',
                topNCount: spikesCountInput ? parseInt(spikesCountInput.value, 10) || 50 : 50,
                conditionType: (spikesSortSelect ? spikesSortSelect.value : 'top-highest') as any
            }, true);
        });
    }

    // Reset to Auto LTTB
    const btnResetAuto = document.getElementById('btnResetToAutoLTTB');
    if (btnResetAuto) {
        btnResetAuto.addEventListener('click', (e) => {
            e.preventDefault();
            setCustomSampleConfig({ mode: 'auto-lttb' }, true);
        });
    }
}

// Expose globally on window for easy interoperability
if (typeof window !== 'undefined') {
    (window as any).lttbDownsample = lttbDownsample;
    (window as any).getLTTBConfig = getLTTBConfig;
    (window as any).getLTTBThreshold = getLTTBThreshold;
    (window as any).setLTTBConfig = setLTTBConfig;
    (window as any).setLTTBResolution = setLTTBResolution;
    (window as any).setLTTBPreset = setLTTBPreset;
    (window as any).setCustomSampleConfig = setCustomSampleConfig;
    (window as any).togglePinnedSampleIndex = togglePinnedSampleIndex;
    (window as any).parseIndexRanges = parseIndexRanges;
    (window as any).initLTTBControls = initLTTBControls;
    (window as any).updateLTTBUIElements = updateLTTBUIElements;
}
