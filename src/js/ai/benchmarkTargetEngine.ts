// src/js/ai/benchmarkTargetEngine.ts
/**
 * Vedra BI AI Agent - Target Benchmarks & Goal Threshold Lines Engine
 * Adds dynamic goal/benchmark lines with achievement tracking to canvas charts.
 */

import { visualizations, plotChart, ChartConfig } from '../charts/charts.ts';
import { filteredData, rawData } from '../../store/DataHandler.ts';
import { showMessage, escapeHtml } from '../core/utils.ts';
import { appendMessageElement, pushUndoSnapshot } from './chat.ts';

export interface BenchmarkConfig {
    chartId?: string;
    targetValue: number;
    label?: string;
    lineColor?: string;
    lineStyle?: 'dashed' | 'solid' | 'dotted';
}

export interface BenchmarkResult {
    chartId: string;
    chartTitle: string;
    targetValue: number;
    label: string;
    totalCategories: number;
    metTargetCount: number;
    achievementRatePct: number;
    success: boolean;
    message: string;
}

/**
 * Finds target chart for benchmark line (either specified or primary bar/line chart).
 */
export function findTargetChartForBenchmark(chartQuery?: string): ChartConfig | null {
    if (!visualizations || visualizations.length === 0) return null;

    if (chartQuery) {
        const q = chartQuery.toLowerCase();
        const found = visualizations.find(v => 
            v.id.toLowerCase() === q || 
            (v.title && v.title.toLowerCase().includes(q)) ||
            (v.type && v.type.toLowerCase().includes(q))
        );
        if (found) return found;
    }

    // Default to first bar or line chart
    const barLine = visualizations.find(v => v.type === 'bar' || v.type === 'line' || v.type === 'scatter');
    if (barLine) return barLine;

    // Fallback to any non-template chart
    return visualizations.find(v => v.type !== 'template_card' && !v.templateCategory) || visualizations[0];
}

/**
 * Applies a benchmark threshold line to a chart and tracks achievements.
 */
export async function applyBenchmarkTarget(config: BenchmarkConfig): Promise<BenchmarkResult> {
    const chart = findTargetChartForBenchmark(config.chartId);
    if (!chart) {
        return {
            chartId: '',
            chartTitle: '',
            targetValue: config.targetValue,
            label: config.label || 'Target',
            totalCategories: 0,
            metTargetCount: 0,
            achievementRatePct: 0,
            success: false,
            message: 'कैनवास पर कोई उपयुक्त बार या लाइन चार्ट नहीं मिला जिस पर टार्गेट लाइन लगाई जा सके।'
        };
    }

    pushUndoSnapshot("Apply Chart Target Benchmark");

    const label = config.label || `टार्गेट लक्ष्य: ₹${config.targetValue.toLocaleString('en-IN')}`;
    const lineColor = config.lineColor || '#f43f5e';
    const lineStyle = config.lineStyle || 'dashed';

    chart.threshold = {
        value: config.targetValue,
        label,
        color: lineColor,
        style: lineStyle
    };

    // Calculate achievement stats
    const data = filteredData.length > 0 ? filteredData : rawData;
    const yCol = (chart.yAxes && chart.yAxes[0]) || chart.metricCol || 'Sales';
    const xCol = chart.xAxis || 'Category';

    const categorySums: Record<string, number> = {};
    data.forEach(r => {
        const cat = String(r[xCol] ?? 'General');
        const val = Number(r[yCol]);
        if (!categorySums[cat]) categorySums[cat] = 0;
        if (!isNaN(val)) categorySums[cat] += val;
    });

    const categories = Object.keys(categorySums);
    let metCount = 0;
    categories.forEach(cat => {
        if (categorySums[cat] >= config.targetValue) {
            metCount++;
        }
    });

    const achievementRatePct = categories.length > 0 ? (metCount / categories.length) * 100 : 0;

    // Re-plot this chart to render the markLine
    await plotChart(chart);

    const message = `🎯 चार्ट "${chart.title || chart.id}" पर ₹${config.targetValue.toLocaleString('en-IN')} का बेंचमार्क टार्गेट लागू किया गया। ${categories.length} में से ${metCount} श्रेणियां लक्ष्य को पार कर चुकी हैं (${achievementRatePct.toFixed(1)}%)।`;
    showMessage(message, 'success');

    return {
        chartId: chart.id,
        chartTitle: chart.title || 'Chart',
        targetValue: config.targetValue,
        label,
        totalCategories: categories.length,
        metTargetCount: metCount,
        achievementRatePct,
        success: true,
        message
    };
}

/**
 * Removes benchmark target line from a chart.
 */
export async function removeBenchmarkTarget(chartId?: string): Promise<void> {
    const chart = findTargetChartForBenchmark(chartId);
    if (!chart) return;

    chart.threshold = null;
    await plotChart(chart);
    showMessage(`चार्ट "${chart.title || chart.id}" से टार्गेट लाइन हटा दी गई।`, 'info');
}

/**
 * Renders the Target Benchmark Card into the AI Chat.
 */
export function renderBenchmarkCard(res: BenchmarkResult): { html: string } {
    const isHighRate = res.achievementRatePct >= 50;
    const badgeColor = isHighRate ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800';

    const html = `
        <div class="benchmark-target-card p-3 rounded-3 border shadow-sm" style="background: #fff; border-color: #cbd5e1 !important; border-left: 4px solid #f43f5e !important;">
            <div class="d-flex align-items-center justify-content-between mb-2">
                <div class="d-flex align-items-center gap-2">
                    <span class="badge bg-rose-600 text-white p-1 rounded"><i class="bi bi-bullseye"></i></span>
                    <div>
                        <strong class="text-slate-900 text-xs d-block">चार्ट बेंचमार्क एवं टार्गेट थ्रेशोल्ड लाइन</strong>
                        <span class="text-slate-500 text-3xs">चार्ट: <strong>${escapeHtml(res.chartTitle)}</strong></span>
                    </div>
                </div>
                <span class="badge ${badgeColor} text-3xs fw-bold">
                    ${res.metTargetCount}/${res.totalCategories} श्रेणियां सफल (${res.achievementRatePct.toFixed(1)}%)
                </span>
            </div>

            <div class="p-2.5 rounded bg-rose-50 border border-rose-200 mb-2.5">
                <div class="d-flex align-items-center justify-content-between text-2xs mb-1">
                    <span class="text-rose-900 fw-bold">🎯 निर्धारित लक्ष्य (Goal Benchmark):</span>
                    <strong class="text-rose-700 font-monospace">₹${res.targetValue.toLocaleString('en-IN')}</strong>
                </div>
                <div class="progress" style="height: 8px;">
                    <div class="progress-bar ${isHighRate ? 'bg-emerald-600' : 'bg-amber-500'}" style="width: ${res.achievementRatePct}%;"></div>
                </div>
                <div class="d-flex justify-content-between text-3xs text-rose-800 mt-1">
                    <span>सफलता दर: <strong>${res.achievementRatePct.toFixed(1)}%</strong></span>
                    <span>शेष गैप: <strong>${(100 - res.achievementRatePct).toFixed(1)}%</strong></span>
                </div>
            </div>

            <div class="d-flex align-items-center justify-content-between pt-1 border-top">
                <span class="text-3xs text-secondary"><i class="bi bi-check2-circle text-success"></i> लाइव markLine चार्ट पर सक्रिय</span>
                <button class="btn btn-2xs btn-outline-danger d-flex align-items-center gap-1 btn-remove-benchmark" data-id="${escapeHtml(res.chartId)}">
                    <i class="bi bi-trash"></i> टार्गेट लाइन हटाएं
                </button>
            </div>
        </div>
    `;

    return { html };
}

/**
 * Attaches remove listener for benchmark cards.
 */
export function attachBenchmarkListeners(container: HTMLElement): void {
    container.querySelectorAll<HTMLButtonElement>('.btn-remove-benchmark').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.getAttribute('data-id') || undefined;
            await removeBenchmarkTarget(id);
            btn.parentElement?.parentElement?.remove();
        });
    });
}
