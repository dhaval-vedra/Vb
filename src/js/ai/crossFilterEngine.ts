// src/js/ai/crossFilterEngine.ts
/**
 * Vedra BI AI Agent - Interactive Cross-Filtering Engine
 * Dynamically links all dashboard charts so clicking a bar, slice, or point
 * immediately cross-filters the entire dashboard to that categorical dimension.
 */

import { rawData, filteredData, setFilteredData } from '../../store/DataHandler.ts';
import { plotAll, visualizations } from '../charts/charts.ts';
import { showMessage, escapeHtml } from '../core/utils.ts';
import { applyFormulasToCardConfig } from '../charts/templateFormulaEngine.ts';
import { renderTemplateCard } from '../charts/templateCards.ts';
import { appendMessageElement } from './chat.ts';

export interface ActiveCrossFilter {
    dimension: string;
    value: string;
    matchingCount: number;
    totalCount: number;
    sourceChartTitle?: string;
}

let isCrossFilterEnabled = true;
let activeCrossFilter: ActiveCrossFilter | null = null;

export function isCrossFilteringActive(): boolean {
    return isCrossFilterEnabled;
}

export function getActiveCrossFilter(): ActiveCrossFilter | null {
    return activeCrossFilter;
}

export function enableCrossFiltering(): void {
    isCrossFilterEnabled = true;
    showMessage("क्रॉस-फ़िल्टरिंग (Cross-Filtering) मोड सक्रिय कर दिया गया है। किसी भी चार्ट बार पर क्लिक करके देखें!", "success");
    renderCrossFilterStatusIndicator();
}

export function disableCrossFiltering(): void {
    isCrossFilterEnabled = false;
    clearCrossFilter();
    showMessage("क्रॉस-फ़िल्टरिंग मोड निष्क्रिय किया गया।", "info");
    removeCrossFilterBanner();
}

export function toggleCrossFiltering(): boolean {
    if (isCrossFilterEnabled) {
        disableCrossFiltering();
    } else {
        enableCrossFiltering();
    }
    return isCrossFilterEnabled;
}

/**
 * Applies a cross-filter based on clicked chart element.
 */
export async function applyCrossFilter(dimension: string, value: string, sourceChartTitle?: string): Promise<void> {
    if (!isCrossFilterEnabled) return;
    if (!rawData || rawData.length === 0) return;

    // Toggle off if clicking the already active filter
    if (activeCrossFilter && activeCrossFilter.dimension === dimension && activeCrossFilter.value === value) {
        await clearCrossFilter();
        return;
    }

    const matchedRows = rawData.filter(row => {
        const val = String(row[dimension] ?? '').trim();
        return val.toLowerCase() === value.toLowerCase();
    });

    if (matchedRows.length === 0) {
        showMessage(`कोई मिलान रिकॉर्ड नहीं मिला: ${dimension} = "${value}"`, "warning");
        return;
    }

    setFilteredData(matchedRows);

    activeCrossFilter = {
        dimension,
        value,
        matchingCount: matchedRows.length,
        totalCount: rawData.length,
        sourceChartTitle
    };

    // Update Banner on top of Dashboard
    renderCrossFilterBanner();

    // Re-evaluate template cards
    visualizations.forEach(v => {
        if (v.type === 'template_card' || v.templateCategory) {
            applyFormulasToCardConfig(v);
            const el = document.getElementById(`container-${v.id}`);
            if (el) renderTemplateCard(el, v);
        }
    });

    // Re-plot charts with filtered dataset
    await plotAll();

    showMessage(`क्रॉस-फ़िल्टर लागू: ${dimension} = "${value}" (${matchedRows.length} रिकॉर्ड्स)`, "info");
}

/**
 * Clears the active cross-filter and restores full rawData.
 */
export async function clearCrossFilter(): Promise<void> {
    if (!activeCrossFilter && filteredData.length === rawData.length) return;

    activeCrossFilter = null;
    setFilteredData([...rawData]);

    removeCrossFilterBanner();

    // Re-evaluate template cards
    visualizations.forEach(v => {
        if (v.type === 'template_card' || v.templateCategory) {
            applyFormulasToCardConfig(v);
            const el = document.getElementById(`container-${v.id}`);
            if (el) renderTemplateCard(el, v);
        }
    });

    await plotAll();
    showMessage("क्रॉस-फ़िल्टर हटाया गया। पूर्ण डेटा पुनर्स्थापित।", "success");
}

/**
 * Renders the persistent Cross-Filter banner on top of dashboard canvas.
 */
export function renderCrossFilterBanner(): void {
    if (!activeCrossFilter) {
        removeCrossFilterBanner();
        return;
    }

    let banner = document.getElementById('dashboardCrossFilterBanner');
    const targetParent = document.getElementById('dashboardContent') || document.getElementById('visualizations') || document.body;

    if (!banner) {
        banner = document.createElement('div');
        banner.id = 'dashboardCrossFilterBanner';
        banner.className = 'cross-filter-banner position-sticky top-0 z-3 p-2 mb-2 rounded-3 border shadow-xs d-flex align-items-center justify-content-between';
        banner.style.background = '#eef2ff';
        banner.style.borderColor = '#c7d2fe';
        targetParent.prepend(banner);
    }

    const { dimension, value, matchingCount, totalCount, sourceChartTitle } = activeCrossFilter;

    banner.innerHTML = `
        <div class="d-flex align-items-center gap-2">
            <span class="badge bg-indigo-600 text-white p-1 rounded"><i class="bi bi-funnel-fill"></i></span>
            <div>
                <span class="fw-bold text-indigo-950 text-xs">
                    क्रॉस-फ़िल्टर सक्रिय: <strong>${escapeHtml(dimension)}</strong> = "<span class="text-indigo-600">${escapeHtml(value)}</span>"
                </span>
                ${sourceChartTitle ? `<span class="text-3xs text-secondary ms-1">(${escapeHtml(sourceChartTitle)})</span>` : ''}
            </div>
            <span class="badge bg-white text-indigo-800 border border-indigo-200 text-3xs font-monospace">
                ${matchingCount} / ${totalCount} रिकॉर्ड्स (${((matchingCount / totalCount) * 100).toFixed(1)}%)
            </span>
        </div>
        <div class="d-flex align-items-center gap-2">
            <button id="btnCrossFilterClear" class="btn btn-2xs btn-outline-danger d-flex align-items-center gap-1">
                <i class="bi bi-x-circle"></i> फ़िल्टर हटाएं (Clear)
            </button>
        </div>
    `;

    banner.querySelector('#btnCrossFilterClear')?.addEventListener('click', () => {
        clearCrossFilter();
    });
}

export function removeCrossFilterBanner(): void {
    const banner = document.getElementById('dashboardCrossFilterBanner');
    if (banner) banner.remove();
}

function renderCrossFilterStatusIndicator(): void {
    renderCrossFilterBanner();
}
