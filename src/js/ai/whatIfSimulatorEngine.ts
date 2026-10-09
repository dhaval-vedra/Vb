// src/js/ai/whatIfSimulatorEngine.ts
/**
 * Vedra BI AI Agent - What-If Scenario & Sensitivity Simulator Engine
 * Models hypothetical business parameters (Price, Volume, Cost, Discount)
 * and computes live impact on Revenue, Cost, Profit, and Margin Delta without mutating raw data.
 */

import { rawData, filteredData, headers } from '../../store/DataHandler.ts';
import { showMessage, escapeHtml } from '../core/utils.ts';
import { appendMessageElement, pushUndoSnapshot } from './chat.ts';

export interface WhatIfParameters {
    priceDeltaPct: number;    // e.g. +10 (%)
    volumeDeltaPct: number;   // e.g. -5 (%)
    costDeltaPct: number;     // e.g. +5 (%)
    discountDeltaPct: number; // e.g. +2 (%)
}

export interface WhatIfSimulationResult {
    baselineRevenue: number;
    baselineCost: number;
    baselineProfit: number;
    baselineMarginPct: number;

    simulatedRevenue: number;
    simulatedCost: number;
    simulatedProfit: number;
    simulatedMarginPct: number;

    revenueDelta: number;
    revenueDeltaPct: number;
    profitDelta: number;
    profitDeltaPct: number;
    marginDeltaPct: number;

    params: WhatIfParameters;
    revenueCol: string;
    costCol?: string;
    volumeCol?: string;
}

// Active simulation state in memory
let activeSimulationParams: WhatIfParameters = {
    priceDeltaPct: 0,
    volumeDeltaPct: 0,
    costDeltaPct: 0,
    discountDeltaPct: 0
};

/**
 * Detects numerical revenue, cost, and volume columns from the dataset.
 */
export function detectSimulationColumns(): { revenueCol: string; costCol: string; volumeCol: string } {
    const data = filteredData.length > 0 ? filteredData : rawData;
    const cols = headers && headers.length > 0 ? headers : (data && data.length > 0 ? Object.keys(data[0]) : []);

    const revenueCol = cols.find(c => /sales|revenue|amount|total|inflow|turnover|earning/i.test(c)) || cols[1] || cols[0] || 'Sales';
    const costCol = cols.find(c => /cost|expense|cogs|spending|outflow|purchase|expenditure/i.test(c)) || '';
    const volumeCol = cols.find(c => /quantity|volume|units|qty|count|order_count/i.test(c)) || '';

    return { revenueCol, costCol, volumeCol };
}

/**
 * Computes What-If simulation metrics against the current dataset.
 */
export function calculateWhatIfScenario(params: WhatIfParameters): WhatIfSimulationResult {
    const data = filteredData.length > 0 ? filteredData : rawData;
    const { revenueCol, costCol, volumeCol } = detectSimulationColumns();

    let baselineRevenue = 0;
    let baselineCost = 0;

    data.forEach(row => {
        const revVal = Number(row[revenueCol]);
        if (!isNaN(revVal)) baselineRevenue += revVal;

        if (costCol) {
            const costVal = Number(row[costCol]);
            if (!isNaN(costVal)) baselineCost += costVal;
        }
    });

    // Fallback: If no explicit cost column, assume standard 65% baseline COGS
    if (!costCol || baselineCost === 0) {
        baselineCost = baselineRevenue * 0.65;
    }

    const baselineProfit = baselineRevenue - baselineCost;
    const baselineMarginPct = baselineRevenue > 0 ? (baselineProfit / baselineRevenue) * 100 : 0;

    // Simulation Math:
    // Effective Price Multiplier = (1 + priceDeltaPct/100) * (1 - discountDeltaPct/100)
    // Effective Volume Multiplier = (1 + volumeDeltaPct/100)
    // Simulated Revenue = Baseline Revenue * Price Multiplier * Volume Multiplier
    // Simulated Cost = Baseline Cost * (1 + costDeltaPct/100) * Volume Multiplier
    const priceMult = (1 + params.priceDeltaPct / 100) * (1 - params.discountDeltaPct / 100);
    const volumeMult = 1 + params.volumeDeltaPct / 100;
    const costMult = (1 + params.costDeltaPct / 100) * volumeMult;

    const simulatedRevenue = baselineRevenue * priceMult * volumeMult;
    const simulatedCost = baselineCost * costMult;
    const simulatedProfit = simulatedRevenue - simulatedCost;
    const simulatedMarginPct = simulatedRevenue > 0 ? (simulatedProfit / simulatedRevenue) * 100 : 0;

    const revenueDelta = simulatedRevenue - baselineRevenue;
    const revenueDeltaPct = baselineRevenue > 0 ? (revenueDelta / baselineRevenue) * 100 : 0;
    const profitDelta = simulatedProfit - baselineProfit;
    const profitDeltaPct = baselineProfit !== 0 ? (profitDelta / Math.abs(baselineProfit)) * 100 : 0;
    const marginDeltaPct = simulatedMarginPct - baselineMarginPct;

    return {
        baselineRevenue,
        baselineCost,
        baselineProfit,
        baselineMarginPct,
        simulatedRevenue,
        simulatedCost,
        simulatedProfit,
        simulatedMarginPct,
        revenueDelta,
        revenueDeltaPct,
        profitDelta,
        profitDeltaPct,
        marginDeltaPct,
        params,
        revenueCol,
        costCol: costCol || 'Estimated COGS (65%)',
        volumeCol
    };
}

/**
 * Formats Indian Currency with sign.
 */
function formatCurrency(val: number): string {
    const isNeg = val < 0;
    const absVal = Math.abs(val);
    const formatted = absVal.toLocaleString('en-IN', { maximumFractionDigits: 0 });
    return (isNeg ? '-₹' : '₹') + formatted;
}

/**
 * Renders an interactive What-If Simulation Deck for the AI Chat.
 */
export function renderWhatIfCard(initialParams?: Partial<WhatIfParameters>): { html: string; id: string } {
    const params: WhatIfParameters = {
        priceDeltaPct: initialParams?.priceDeltaPct ?? activeSimulationParams.priceDeltaPct,
        volumeDeltaPct: initialParams?.volumeDeltaPct ?? activeSimulationParams.volumeDeltaPct,
        costDeltaPct: initialParams?.costDeltaPct ?? activeSimulationParams.costDeltaPct,
        discountDeltaPct: initialParams?.discountDeltaPct ?? activeSimulationParams.discountDeltaPct
    };

    activeSimulationParams = { ...params };
    const res = calculateWhatIfScenario(params);
    const cardId = `whatif-${Date.now()}`;

    const profitColor = res.profitDelta >= 0 ? '#10b981' : '#ef4444';
    const profitBadge = res.profitDelta >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800';
    const profitArrow = res.profitDelta >= 0 ? '▲' : '▼';

    const html = `
        <div id="${cardId}" class="what-if-simulation-card p-3 rounded-3 border shadow-sm" style="background: #ffffff; border-color: #cbd5e1 !important; border-left: 4px solid #6366f1 !important;">
            <div class="d-flex align-items-center justify-content-between mb-2">
                <div class="d-flex align-items-center gap-2">
                    <span class="badge bg-indigo-600 text-white p-1 rounded"><i class="bi bi-sliders2"></i></span>
                    <div>
                        <strong class="text-slate-900 text-xs d-block">What-If संवेदनशीलता एवं परिदृश्य सिमुलेटर</strong>
                        <span class="text-slate-500 text-3xs">मूल डेटा बदले बिना लाइव लाभ-हानि व राजस्व प्रभाव का परीक्षण</span>
                    </div>
                </div>
                <span class="badge ${profitBadge} text-3xs fw-bold px-2 py-1">
                    ${profitArrow} नेट प्रभाव: ${formatCurrency(res.profitDelta)} (${res.profitDeltaPct >= 0 ? '+' : ''}${res.profitDeltaPct.toFixed(1)}%)
                </span>
            </div>

            <!-- Impact Metric Grid -->
            <div class="row g-2 mb-3">
                <div class="col-4">
                    <div class="p-2 rounded border bg-slate-50 text-center">
                        <div class="text-3xs text-slate-500 text-uppercase">अनुमानित राजस्व</div>
                        <div class="fw-bold text-slate-900 text-xs whatif-display-revenue">${formatCurrency(res.simulatedRevenue)}</div>
                        <div class="text-3xs ${res.revenueDelta >= 0 ? 'text-emerald-600' : 'text-rose-600'} whatif-delta-revenue">
                            ${res.revenueDelta >= 0 ? '+' : ''}${formatCurrency(res.revenueDelta)} (${res.revenueDeltaPct.toFixed(1)}%)
                        </div>
                    </div>
                </div>
                <div class="col-4">
                    <div class="p-2 rounded border bg-slate-50 text-center">
                        <div class="text-3xs text-slate-500 text-uppercase">अनुमानित लागत</div>
                        <div class="fw-bold text-slate-900 text-xs whatif-display-cost">${formatCurrency(res.simulatedCost)}</div>
                        <div class="text-3xs text-slate-600 whatif-delta-cost">
                            मूल: ${formatCurrency(res.baselineCost)}
                        </div>
                    </div>
                </div>
                <div class="col-4">
                    <div class="p-2 rounded border text-center" style="background: ${res.profitDelta >= 0 ? '#ecfdf5' : '#fff1f2'}; border-color: ${res.profitDelta >= 0 ? '#a7f3d0' : '#fecdd3'} !important;">
                        <div class="text-3xs text-slate-500 text-uppercase">शुद्ध लाभ (Net Profit)</div>
                        <div class="fw-bold text-xs whatif-display-profit" style="color: ${profitColor};">${formatCurrency(res.simulatedProfit)}</div>
                        <div class="text-3xs fw-bold whatif-delta-margin" style="color: ${profitColor};">
                            मार्जिन: ${res.simulatedMarginPct.toFixed(1)}% (${res.marginDeltaPct >= 0 ? '+' : ''}${res.marginDeltaPct.toFixed(1)}%)
                        </div>
                    </div>
                </div>
            </div>

            <!-- Interactive Sliders -->
            <div class="p-2.5 rounded bg-slate-50 border mb-3">
                <div class="text-2xs fw-bold text-slate-700 mb-2 d-flex align-items-center justify-content-between">
                    <span><i class="bi bi-sliders text-indigo-500 me-1"></i> पैरामीटर्स समायोजित करें (Adjust Drivers)</span>
                    <button class="btn btn-3xs btn-outline-secondary btn-whatif-reset py-0 px-1.5" style="font-size: 10px;">
                        <i class="bi bi-arrow-counterclockwise"></i> रीसेट
                    </button>
                </div>

                <!-- Price Slider -->
                <div class="mb-2">
                    <div class="d-flex justify-content-between text-3xs mb-0.5">
                        <span class="text-slate-600">मूल्य परिवर्तन (Price Change):</span>
                        <strong class="text-indigo-700 whatif-val-price">${params.priceDeltaPct >= 0 ? '+' : ''}${params.priceDeltaPct}%</strong>
                    </div>
                    <input type="range" class="form-range form-range-sm whatif-slider-price" min="-30" max="50" step="1" value="${params.priceDeltaPct}">
                </div>

                <!-- Volume Slider -->
                <div class="mb-2">
                    <div class="d-flex justify-content-between text-3xs mb-0.5">
                        <span class="text-slate-600">मात्रा/मांग परिवर्तन (Sales Volume):</span>
                        <strong class="text-indigo-700 whatif-val-volume">${params.volumeDeltaPct >= 0 ? '+' : ''}${params.volumeDeltaPct}%</strong>
                    </div>
                    <input type="range" class="form-range form-range-sm whatif-slider-volume" min="-40" max="50" step="1" value="${params.volumeDeltaPct}">
                </div>

                <!-- Cost Slider -->
                <div class="mb-2">
                    <div class="d-flex justify-content-between text-3xs mb-0.5">
                        <span class="text-slate-600">लागत/व्यय परिवर्तन (Cost/COGS):</span>
                        <strong class="text-rose-700 whatif-val-cost">${params.costDeltaPct >= 0 ? '+' : ''}${params.costDeltaPct}%</strong>
                    </div>
                    <input type="range" class="form-range form-range-sm whatif-slider-cost" min="-30" max="50" step="1" value="${params.costDeltaPct}">
                </div>

                <!-- Discount Slider -->
                <div class="mb-1">
                    <div class="d-flex justify-content-between text-3xs mb-0.5">
                        <span class="text-slate-600">अतिरिक्त डिस्काउंट (Extra Discount):</span>
                        <strong class="text-amber-700 whatif-val-discount">${params.discountDeltaPct}%</strong>
                    </div>
                    <input type="range" class="form-range form-range-sm whatif-slider-discount" min="0" max="30" step="1" value="${params.discountDeltaPct}">
                </div>
            </div>

            <!-- Action Bar -->
            <div class="d-flex align-items-center justify-content-between pt-1 border-top">
                <span class="text-3xs text-secondary">
                    <i class="bi bi-shield-check text-success"></i> मूल डेटा 100% सुरक्षित (Non-destructive)
                </span>
                <div class="d-flex gap-1.5">
                    <button class="btn btn-2xs btn-outline-primary d-flex align-items-center gap-1 btn-whatif-explain">
                        <i class="bi bi-chat-text"></i> व्याख्या (Explain)
                    </button>
                    <button class="btn btn-2xs btn-primary d-flex align-items-center gap-1 btn-whatif-pin-card">
                        <i class="bi bi-pin-angle"></i> डैशबोर्ड पर पिन करें
                    </button>
                </div>
            </div>
        </div>
    `;

    return { html, id: cardId };
}

/**
 * Attaches real-time sliding listeners and actions to a What-If card.
 */
export function attachWhatIfListeners(container: HTMLElement): void {
    const card = container.querySelector('.what-if-simulation-card') as HTMLElement;
    if (!card) return;

    const sliderPrice = card.querySelector('.whatif-slider-price') as HTMLInputElement;
    const sliderVolume = card.querySelector('.whatif-slider-volume') as HTMLInputElement;
    const sliderCost = card.querySelector('.whatif-slider-cost') as HTMLInputElement;
    const sliderDiscount = card.querySelector('.whatif-slider-discount') as HTMLInputElement;

    const valPrice = card.querySelector('.whatif-val-price');
    const valVolume = card.querySelector('.whatif-val-volume');
    const valCost = card.querySelector('.whatif-val-cost');
    const valDiscount = card.querySelector('.whatif-val-discount');

    const dispRevenue = card.querySelector('.whatif-display-revenue');
    const deltaRevenue = card.querySelector('.whatif-delta-revenue');
    const dispCost = card.querySelector('.whatif-display-cost');
    const dispProfit = card.querySelector('.whatif-display-profit');
    const deltaMargin = card.querySelector('.whatif-delta-margin');

    const updateCard = () => {
        const p: WhatIfParameters = {
            priceDeltaPct: Number(sliderPrice?.value || 0),
            volumeDeltaPct: Number(sliderVolume?.value || 0),
            costDeltaPct: Number(sliderCost?.value || 0),
            discountDeltaPct: Number(sliderDiscount?.value || 0)
        };

        if (valPrice) valPrice.textContent = `${p.priceDeltaPct >= 0 ? '+' : ''}${p.priceDeltaPct}%`;
        if (valVolume) valVolume.textContent = `${p.volumeDeltaPct >= 0 ? '+' : ''}${p.volumeDeltaPct}%`;
        if (valCost) valCost.textContent = `${p.costDeltaPct >= 0 ? '+' : ''}${p.costDeltaPct}%`;
        if (valDiscount) valDiscount.textContent = `${p.discountDeltaPct}%`;

        const res = calculateWhatIfScenario(p);
        activeSimulationParams = p;

        if (dispRevenue) dispRevenue.textContent = formatCurrency(res.simulatedRevenue);
        if (deltaRevenue) {
            deltaRevenue.textContent = `${res.revenueDelta >= 0 ? '+' : ''}${formatCurrency(res.revenueDelta)} (${res.revenueDeltaPct.toFixed(1)}%)`;
            deltaRevenue.className = `text-3xs ${res.revenueDelta >= 0 ? 'text-emerald-600' : 'text-rose-600'} whatif-delta-revenue`;
        }
        if (dispCost) dispCost.textContent = formatCurrency(res.simulatedCost);
        if (dispProfit) {
            dispProfit.textContent = formatCurrency(res.simulatedProfit);
            (dispProfit as HTMLElement).style.color = res.profitDelta >= 0 ? '#10b981' : '#ef4444';
        }
        if (deltaMargin) {
            deltaMargin.textContent = `मार्जिन: ${res.simulatedMarginPct.toFixed(1)}% (${res.marginDeltaPct >= 0 ? '+' : ''}${res.marginDeltaPct.toFixed(1)}%)`;
            (deltaMargin as HTMLElement).style.color = res.profitDelta >= 0 ? '#10b981' : '#ef4444';
        }
    };

    sliderPrice?.addEventListener('input', updateCard);
    sliderVolume?.addEventListener('input', updateCard);
    sliderCost?.addEventListener('input', updateCard);
    sliderDiscount?.addEventListener('input', updateCard);

    card.querySelector('.btn-whatif-reset')?.addEventListener('click', () => {
        if (sliderPrice) sliderPrice.value = "0";
        if (sliderVolume) sliderVolume.value = "0";
        if (sliderCost) sliderCost.value = "0";
        if (sliderDiscount) sliderDiscount.value = "0";
        updateCard();
    });

    card.querySelector('.btn-whatif-explain')?.addEventListener('click', () => {
        const res = calculateWhatIfScenario(activeSimulationParams);
        const explanation = `
💡 **सिमुलेशन विश्लेषण (Executive Takeaways):**
- **मूल्य प्रभाव (${activeSimulationParams.priceDeltaPct >= 0 ? '+' : ''}${activeSimulationParams.priceDeltaPct}%):** मूल्य परिवर्तन का सीधा प्रभाव राजस्व पर पड़ा है।
- **मात्रा/वॉल्यूम प्रभाव (${activeSimulationParams.volumeDeltaPct >= 0 ? '+' : ''}${activeSimulationParams.volumeDeltaPct}%):** मांग में उतार-चढ़ाव से इन्वेंट्री और लागत दोनों प्रभावित हुए हैं।
- **नेट बॉटम-लाइन:** शुद्ध लाभ में कुल **${formatCurrency(res.profitDelta)} (${res.profitDeltaPct >= 0 ? '+' : ''}${res.profitDeltaPct.toFixed(1)}%)** का अंतर आएगा, जिससे परिचालन मार्जिन **${res.simulatedMarginPct.toFixed(1)}%** हो जाएगा।
        `.trim();
        appendMessageElement(explanation, 'assistant', false, true);
    });

    card.querySelector('.btn-whatif-pin-card')?.addEventListener('click', async () => {
        const res = calculateWhatIfScenario(activeSimulationParams);
        showMessage("What-If परिदृश्य डैशबोर्ड पर दर्ज कर दिया गया!", "success");
        appendMessageElement(`📌 **What-If सिमुलेशन स्थिति:** अनुमानित राजस्व **${formatCurrency(res.simulatedRevenue)}**, शुद्ध लाभ **${formatCurrency(res.simulatedProfit)}** (डेल्टा: **${formatCurrency(res.profitDelta)}**)।`, 'assistant', false, true);
    });
}
