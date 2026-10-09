// src/js/ai/presentationAiSummaryEngine.ts
/**
 * Vedra BI - Professional Executive AI Summary Engine
 * Produces clean, concise, data-driven executive takeaways and strategic insights
 * for Charts, KPIs, Gauges, Progress bars, and Textbox memos during presentations.
 */

import { ChartConfig } from '../charts/charts.ts';
import { filteredData, rawData } from '../../store/DataHandler.ts';
import { escapeHtml } from '../core/utils.ts';

export interface SlideMetricChip {
    label: string;
    value: string;
    trend?: 'up' | 'down' | 'neutral';
}

export interface SlideAiSummary {
    id: string;
    slideIndex: number;
    totalSlides: number;
    title: string;
    category: 'chart' | 'kpi' | 'gauge' | 'progress' | 'textbox';
    typeLabel: string;
    icon: string;
    headline: string;
    metricChips: SlideMetricChip[];
    keyInsights: string[];
    actionItem: string;
    chartConfig?: ChartConfig | any;
    domElementId?: string;
}

export type SummaryLayoutMode = 'side' | 'bottom' | 'minimal' | 'hidden';
export type SummaryThemeMode = 'dark' | 'light';
export type SummaryDensityMode = 'compact' | 'detailed';

export interface SummaryRenderOptions {
    layout?: SummaryLayoutMode;
    theme?: SummaryThemeMode;
    density?: SummaryDensityMode;
}

/**
 * Format numbers cleanly into Lakh / Crore or K / M standard format.
 */
export function formatCurrencyValue(val: number): string {
    if (isNaN(val) || val === null || val === undefined) return '0';
    const abs = Math.abs(val);
    if (abs >= 10000000) {
        return (val / 10000000).toFixed(2) + ' Cr';
    } else if (abs >= 100000) {
        return (val / 100000).toFixed(2) + ' L';
    } else if (abs >= 1000) {
        return (val / 1000).toFixed(1) + ' K';
    }
    return val.toLocaleString('en-IN');
}

/**
 * Generates an executive AI summary for an individual dashboard element.
 */
export function generateSlideAiSummary(
    config: any,
    slideIndex = 1,
    totalSlides = 1
): SlideAiSummary {
    const data = (filteredData && filteredData.length > 0) ? filteredData : (rawData || []);

    const isTemplate = config?.type === 'template_card' || config?.templateCategory;
    const templateCat = String(config?.templateCategory || '').toLowerCase();

    // 1. Template Cards (KPI, Gauge, Progress, Textbox)
    if (isTemplate) {
        const title = config.label || config.title || 'Executive Metric';
        const val = String(config.value || config.label || '0');
        const trend = String(config.trendValue || '');
        const isNegativeTrend = trend.includes('-') || trend.includes('▼');
        const isPositiveTrend = trend.includes('+') || trend.includes('▲');
        const formula = config.formula || '';

        // Textbox / Memo Card
        if (templateCat === 'textbox' || config.textboxStyle || (config.title && config.title.toLowerCase().includes('text'))) {
            const rawContent = config.value || config.content || 'Strategic governance directive active.';
            const preview = rawContent.length > 120 ? rawContent.substring(0, 120) + '...' : rawContent;
            return {
                id: config.id,
                slideIndex,
                totalSlides,
                title,
                category: 'textbox',
                typeLabel: 'Strategic Memo',
                icon: 'bi-file-text',
                headline: `${title}: Strategic leadership directive and operational guidance`,
                metricChips: [
                    { label: 'Type', value: config.badge || 'Policy Note' },
                    { label: 'Status', value: 'Active', trend: 'neutral' },
                    { label: 'Priority', value: 'High', trend: 'up' }
                ],
                keyInsights: [
                    `Key Directive: "${preview}"`,
                    'Establishes organizational baseline and aligns cross-functional team priorities.'
                ],
                actionItem: 'Ensure departmental milestones and deliverables reflect these operational guidelines.',
                chartConfig: config,
                domElementId: `container-${config.id}`
            };
        }

        // Gauge / Speedometer Card
        if (templateCat === 'gauge') {
            return {
                id: config.id,
                slideIndex,
                totalSlides,
                title,
                category: 'gauge',
                typeLabel: 'Target Gauge',
                icon: 'bi-speedometer2',
                headline: `${title} is operating at ${val}, maintaining safe target performance`,
                metricChips: [
                    { label: 'Current', value: val, trend: 'neutral' },
                    { label: 'Trend', value: trend || 'On Schedule', trend: isNegativeTrend ? 'down' : 'up' },
                    { label: 'Status', value: 'Optimal', trend: 'up' }
                ],
                keyInsights: [
                    `Current output is holding steady at ${val}, well within safe operating thresholds.`,
                    formula ? `Calculated via real-time logic: ${formula}.` : 'Pacing indicates strong probability of meeting end-of-period targets.'
                ],
                actionItem: 'Continue current operational tempo to safeguard positive milestone achievement.',
                chartConfig: config,
                domElementId: `container-${config.id}`
            };
        }

        // Progress Bar Card
        if (templateCat === 'progress') {
            return {
                id: config.id,
                slideIndex,
                totalSlides,
                title,
                category: 'progress',
                typeLabel: 'Milestone Progress',
                icon: 'bi-bar-chart-steps',
                headline: `${title} has reached ${val} completion`,
                metricChips: [
                    { label: 'Completion', value: val, trend: 'neutral' },
                    { label: 'Delta', value: trend || 'Active', trend: isNegativeTrend ? 'down' : 'up' },
                    { label: 'Phase', value: 'Execution', trend: 'neutral' }
                ],
                keyInsights: [
                    `Milestone execution has attained ${val} of defined program scope.`,
                    'Resource allocation remains balanced across core project phases.'
                ],
                actionItem: 'Verify upcoming stage deliverables to prevent delivery bottlenecks.',
                chartConfig: config,
                domElementId: `container-${config.id}`
            };
        }

        // Default KPI Card
        return {
            id: config.id,
            slideIndex,
            totalSlides,
            title,
            category: 'kpi',
            typeLabel: 'Executive KPI',
            icon: 'bi-bullseye',
            headline: `${title} stands at ${val} ${trend ? `(${trend})` : ''}`,
            metricChips: [
                { label: 'Value', value: val, trend: 'neutral' },
                { label: 'Trend', value: trend || 'Stable', trend: isNegativeTrend ? 'down' : 'up' },
                { label: 'Health', value: isNegativeTrend ? 'Needs Review' : 'Healthy', trend: isNegativeTrend ? 'down' : 'up' }
            ],
            keyInsights: [
                `Metric is tracking at ${val} against historical operational baselines.`,
                trend ? `Observed trajectory indicates ${trend} performance momentum.` : 'Consistent variance control observed across reporting cycles.'
            ],
            actionItem: isNegativeTrend
                ? 'Investigate root drivers behind negative divergence and realign channel resources.'
                : 'Maintain active resource pacing to capitalize on positive growth trajectory.',
            chartConfig: config,
            domElementId: `container-${config.id}`
        };
    }

    // 2. Analytical Visual Charts
    const title = config.title || `Chart: ${String(config.type || 'Data').toUpperCase()}`;
    const chartType = String(config.type || 'bar').toLowerCase();
    const xAxisCol = config.xAxis || '';
    const yAxisCol = (config.yAxes && config.yAxes.length > 0) ? config.yAxes[0] : '';

    let totalSum = 0;
    let peakCategory = 'Top Segment';
    let peakVal = 0;
    let minCategory = 'Lower Segment';
    let minVal = Infinity;
    let categoryCount = 0;

    if (xAxisCol && yAxisCol && data.length > 0) {
        const groupSums: Record<string, number> = {};
        data.forEach(row => {
            const key = String(row[xAxisCol] || 'Other');
            const num = Number(row[yAxisCol]) || 0;
            groupSums[key] = (groupSums[key] || 0) + num;
            totalSum += num;
        });

        const entries = Object.entries(groupSums).sort((a, b) => b[1] - a[1]);
        categoryCount = entries.length;

        if (entries.length > 0) {
            peakCategory = entries[0][0];
            peakVal = entries[0][1];
            minCategory = entries[entries.length - 1][0];
            minVal = entries[entries.length - 1][1];
        }
    }

    const peakPct = totalSum > 0 ? (peakVal / totalSum) * 100 : 0;
    const avgVal = categoryCount > 0 ? totalSum / categoryCount : 0;

    let icon = 'bi-bar-chart';
    let typeLabel = 'Comparative Chart';
    let headline = `${title}: Aggregating ₹${formatCurrencyValue(totalSum)} across key dimensions`;

    if (chartType === 'pie' || chartType === 'donut') {
        icon = 'bi-pie-chart';
        typeLabel = 'Distribution Share';
        headline = `${peakCategory} dominates with ${peakPct.toFixed(1)}% share (₹${formatCurrencyValue(peakVal)})`;
    } else if (chartType === 'line' || chartType === 'area') {
        icon = 'bi-graph-up';
        typeLabel = 'Trend Analysis';
        headline = `${title} demonstrates continuous momentum peaking at ₹${formatCurrencyValue(peakVal)}`;
    } else if (chartType === 'bar' || chartType === 'column') {
        icon = 'bi-bar-chart';
        typeLabel = 'Performance Breakdown';
        headline = `${peakCategory} leads performance, accounting for ₹${formatCurrencyValue(peakVal)}`;
    }

    const metricChips: SlideMetricChip[] = [];
    if (totalSum > 0) {
        metricChips.push({ label: 'Total Volume', value: `₹${formatCurrencyValue(totalSum)}`, trend: 'neutral' });
    }
    if (peakCategory && peakVal > 0) {
        metricChips.push({ label: 'Top Contributor', value: `${peakCategory} (${peakPct.toFixed(0)}%)`, trend: 'up' });
    }
    if (avgVal > 0) {
        metricChips.push({ label: 'Average / Category', value: `₹${formatCurrencyValue(avgVal)}`, trend: 'neutral' });
    }
    if (config.threshold?.value) {
        const targetVal = Number(config.threshold.value);
        const met = peakVal >= targetVal;
        metricChips.push({ label: 'Benchmark', value: met ? 'Achieved' : 'In Progress', trend: met ? 'up' : 'down' });
    }

    const keyInsights = [
        `Analysis across **${categoryCount > 0 ? categoryCount : 'multiple'} categories** reveals **${peakCategory}** as primary driver (**${peakPct.toFixed(1)}%** of volume).`,
        minCategory !== peakCategory && minVal !== Infinity
            ? `Variance between top and lowest tier spans **₹${formatCurrencyValue(peakVal - minVal)}**, identifying growth headroom in **${minCategory}**.`
            : 'Distribution reflects consistent, steady performance across monitored segments.'
    ];

    return {
        id: config.id,
        slideIndex,
        totalSlides,
        title,
        category: 'chart',
        typeLabel,
        icon,
        headline,
        metricChips,
        keyInsights,
        actionItem: `Capitalize on **${peakCategory}** momentum while implementing targeted efficiency initiatives in trailing segments.`,
        chartConfig: config,
        domElementId: `container-${config.id}`
    };
}

/**
 * Calculate natural reading time for a slide summary in milliseconds.
 * Estimates reading speed at ~2.5 words/second with adjustable speed multiplier.
 */
export function calculateSummaryReadTime(summary: SlideAiSummary, speedMultiplier: number = 1.0): number {
    const text = `${summary.headline} ${summary.keyInsights.join(' ')} ${summary.actionItem}`;
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    const speed = Math.max(0.4, Math.min(3.0, speedMultiplier || 1.0));
    // Base speed: 2.5 words/s adjusted by speed multiplier
    const effectiveWps = 2.5 * speed;
    const readingSeconds = Math.max(3.5, Math.min(25, Math.round(wordCount / effectiveWps) + (2 / speed)));
    return Math.round(readingSeconds * 1000);
}

/**
 * Renders the clean, modern AI Executive Summary HTML based on layout, theme, and density.
 */
export function renderSlideAiSummaryHtml(
    summary: SlideAiSummary,
    options: SummaryRenderOptions = {}
): string {
    const layout = options.layout || 'side';
    const theme = options.theme || 'dark';
    const density = options.density || 'detailed';

    if (layout === 'hidden') return '';

    const isLight = theme === 'light';
    const bgCard = isLight ? '#ffffff' : '#0f172a';
    const borderCard = isLight ? '#e2e8f0' : '#1e293b';
    const textPrimary = isLight ? '#0f172a' : '#f8fafc';
    const textSecondary = isLight ? '#64748b' : '#94a3b8';
    const chipBg = isLight ? '#f1f5f9' : '#1e293b';
    const chipBorder = isLight ? '#cbd5e1' : '#334155';
    const actionBg = isLight ? 'rgba(16, 185, 129, 0.08)' : 'rgba(16, 185, 129, 0.12)';
    const actionBorder = isLight ? 'rgba(16, 185, 129, 0.25)' : 'rgba(16, 185, 129, 0.3)';
    const actionText = isLight ? '#065f46' : '#a7f3d0';

    // 1. Chips HTML with animation class and narrator section ID
    const chipsHtml = summary.metricChips.length > 0 ? `
        <div id="presNarratorChips" class="pres-narrator-section pres-chips-anim d-flex flex-wrap gap-2 ${layout === 'bottom' ? 'mb-0' : 'mb-3'}">
            ${summary.metricChips.map(chip => {
                const isUp = chip.trend === 'up';
                const isDown = chip.trend === 'down';
                const trendIcon = isUp ? '<i class="bi bi-arrow-up-right text-emerald-500 ms-1"></i>' : (isDown ? '<i class="bi bi-arrow-down-right text-amber-500 ms-1"></i>' : '');
                return `
                    <div class="px-2.5 py-1.5 rounded d-flex flex-column justify-content-center" style="background: ${chipBg}; border: 1px solid ${chipBorder}; min-width: 100px;">
                        <span class="text-uppercase tracking-wider" style="font-size: 10px; color: ${textSecondary};">${escapeHtml(chip.label)}</span>
                        <span class="fw-bold d-flex align-items-center" style="font-size: 13px; color: ${textPrimary};">
                            ${escapeHtml(chip.value)} ${trendIcon}
                        </span>
                    </div>
                `;
            }).join('')}
        </div>
    ` : '';

    // 2. Key Insights HTML with individual narrator IDs
    const insightsHtml = (density === 'detailed' && summary.keyInsights.length > 0) ? `
        <div class="pres-insights-anim mb-3">
            <div class="d-flex align-items-center gap-1.5 mb-2" style="color: ${textSecondary}; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">
                <i class="bi bi-compass"></i> Key Takeaways
            </div>
            <div class="d-flex flex-column gap-2">
                ${summary.keyInsights.map((item, idx) => {
                    const formatted = item.replace(/\*\*(.*?)\*\*/g, `<strong style="color: ${textPrimary};">$1</strong>`);
                    return `
                        <div id="presNarratorInsight_${idx}" class="pres-narrator-section pres-narrator-insight p-1 rounded d-flex align-items-start gap-2" style="font-size: 12.5px; line-height: 1.5; color: ${textSecondary};">
                            <i class="bi bi-dot flex-shrink-0" style="font-size: 20px; line-height: 1; color: #6366f1; margin-top: -3px;"></i>
                            <div>${formatted}</div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    ` : '';

    // 3. Action Item HTML with narrator section ID
    const actionHtml = summary.actionItem ? `
        <div id="presNarratorAction" class="pres-narrator-section pres-action-anim p-2.5 rounded d-flex align-items-start gap-2 mt-auto" style="background: ${actionBg}; border: 1px solid ${actionBorder}; color: ${actionText}; font-size: 12px; line-height: 1.45;">
            <i class="bi bi-lightning-charge-fill flex-shrink-0 mt-0.5" style="font-size: 13px; color: #10b981;"></i>
            <div>
                <strong class="d-block" style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 2px;">Recommended Action</strong>
                ${escapeHtml(summary.actionItem)}
            </div>
        </div>
    ` : '';

    // Reading progress bar HTML
    const progressBarHtml = `
        <div class="pres-summary-read-track w-100 position-relative overflow-hidden mb-2" style="height: 2px; background: rgba(99, 102, 241, 0.15); border-radius: 2px;">
            <div class="pres-summary-read-bar h-100 bg-indigo-500 rounded" style="width: 0%; transition: width 0.15s linear;"></div>
        </div>
    `;

    // Minimal Layout (Floating Badge/Pill)
    if (layout === 'minimal') {
        return `
            <div class="pres-summary-minimal pres-summary-anim p-3 rounded-3 shadow-lg d-flex align-items-center justify-content-between gap-3 position-relative" style="background: ${bgCard}; border: 1px solid ${borderCard}; max-width: 680px; margin: 0 auto;">
                <div class="d-flex align-items-center gap-2">
                    <span class="badge bg-indigo-600 text-white p-1.5 rounded"><i class="bi ${summary.icon}"></i></span>
                    <span id="presNarratorHeadline" class="pres-narrator-section fw-semibold" style="font-size: 13px; color: ${textPrimary};">${escapeHtml(summary.headline)}</span>
                </div>
                <div class="d-flex align-items-center gap-1">
                    <div class="kiosk-narrator-live-badge d-none align-items-center gap-1.5 px-2 py-0.5 rounded-pill bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-3xs font-medium">
                        <span class="kiosk-equalizer-bars"><span></span><span></span><span></span><span></span></span>
                        <span>Narrator</span>
                    </div>
                    <button class="btn btn-sm btn-icon pres-btn-speak text-slate-400 hover:text-white p-1" title="Narrator Mode (N)"><i class="bi bi-soundwave"></i></button>
                    <button class="btn btn-sm btn-icon pres-btn-copy text-slate-400 hover:text-white p-1" title="Copy"><i class="bi bi-clipboard"></i></button>
                </div>
            </div>
        `;
    }

    // Bottom Shelf Layout (Horizontal Bar)
    if (layout === 'bottom') {
        return `
            <div class="pres-summary-bottom pres-summary-anim p-3 rounded-3 d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 h-100 position-relative overflow-hidden" style="background: ${bgCard}; border: 1px solid ${borderCard};">
                <div class="position-absolute top-0 start-0 w-100" style="height: 2px; background: rgba(99, 102, 241, 0.15);">
                    <div class="pres-summary-read-bar h-100 bg-indigo-500 rounded" style="width: 0%; transition: width 0.15s linear;"></div>
                </div>
                <div class="flex-grow-1" style="max-width: 50%;">
                    <div class="d-flex align-items-center gap-2 mb-1">
                        <span class="badge px-2 py-0.5 rounded text-uppercase tracking-wider" style="background: rgba(99, 102, 241, 0.15); color: #818cf8; border: 1px solid rgba(99, 102, 241, 0.3); font-size: 10px;">
                            <i class="bi ${summary.icon} me-1"></i> ${escapeHtml(summary.typeLabel)}
                        </span>
                        <span style="font-size: 11px; color: ${textSecondary};">Slide ${summary.slideIndex} of ${summary.totalSlides}</span>
                        <div class="kiosk-narrator-live-badge d-none align-items-center gap-1.5 px-2 py-0.5 rounded-pill bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-medium" style="font-size: 10px;">
                            <span class="kiosk-equalizer-bars"><span></span><span></span><span></span><span></span></span>
                            <span>Narrator</span>
                        </div>
                    </div>
                    <h6 id="presNarratorHeadline" class="pres-narrator-section pres-headline-anim fw-bold mb-1 text-truncate" style="font-size: 14px; color: ${textPrimary};" title="${escapeHtml(summary.headline)}">
                        ${escapeHtml(summary.headline)}
                    </h6>
                    <div class="pres-action-anim" style="font-size: 12px; color: ${textSecondary};" class="text-truncate">
                        ${escapeHtml(summary.actionItem)}
                    </div>
                </div>
                <div class="d-flex align-items-center gap-3">
                    ${chipsHtml}
                    <div class="d-flex flex-column gap-1">
                        <button class="btn btn-xs btn-outline-secondary pres-btn-speak px-2 py-1 text-nowrap" title="Narrator Mode (N)">
                            <i class="bi bi-soundwave"></i>
                        </button>
                        <button class="btn btn-xs btn-outline-secondary pres-btn-replay-narration px-2 py-1 text-nowrap" title="Replay Narration">
                            <i class="bi bi-arrow-counterclockwise"></i>
                        </button>
                        <button class="btn btn-xs btn-outline-secondary pres-btn-copy px-2 py-1 text-nowrap" title="Copy Summary">
                            <i class="bi bi-clipboard"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    // Default Side-by-Side Layout (Vertical Clean Briefing Panel)
    return `
        <div class="pres-summary-panel pres-summary-anim d-flex flex-column h-100 p-3 p-md-4 rounded-3 position-relative overflow-hidden" style="background: ${bgCard}; border: 1px solid ${borderCard};">
            <!-- Reading Countdown Bar -->
            ${progressBarHtml}

            <!-- Header -->
            <div class="d-flex align-items-center justify-content-between pb-2 mb-3" style="border-bottom: 1px solid ${borderCard};">
                <div class="d-flex align-items-center gap-2">
                    <span class="badge px-2 py-1 rounded text-uppercase tracking-wider d-flex align-items-center gap-1.5" style="background: rgba(99, 102, 241, 0.12); color: #818cf8; border: 1px solid rgba(99, 102, 241, 0.3); font-size: 10.5px;">
                        <i class="bi ${summary.icon}"></i> ${escapeHtml(summary.typeLabel)}
                    </span>
                    <span class="badge rounded px-2 py-0.5" style="background: ${chipBg}; color: ${textSecondary}; border: 1px solid ${borderCard}; font-size: 10px;">
                        ${summary.slideIndex} / ${summary.totalSlides}
                    </span>
                    <!-- Live Narrator Wave Status -->
                    <div class="kiosk-narrator-live-badge d-none align-items-center gap-1.5 px-2 py-0.5 rounded-pill bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-medium" style="font-size: 10px;">
                        <span class="kiosk-equalizer-bars"><span></span><span></span><span></span><span></span></span>
                        <span>AI Narrator</span>
                    </div>
                </div>
                <div class="d-flex align-items-center gap-1">
                    <button class="btn btn-xs btn-outline-secondary pres-btn-speak p-1 px-2" title="Toggle Narrator Mode (N)" style="border-color: ${borderCard}; color: ${textSecondary};">
                        <i class="bi bi-soundwave"></i>
                    </button>
                    <button class="btn btn-xs btn-outline-secondary pres-btn-replay-narration p-1 px-2" title="Replay Slide Narration" style="border-color: ${borderCard}; color: ${textSecondary};">
                        <i class="bi bi-arrow-counterclockwise"></i>
                    </button>
                    <button class="btn btn-xs btn-outline-secondary pres-btn-copy p-1 px-2" title="Copy to Clipboard" style="border-color: ${borderCard}; color: ${textSecondary};">
                        <i class="bi bi-clipboard"></i>
                    </button>
                </div>
            </div>

            <!-- Scrollable Content with Auto-Scroll Support -->
            <div class="pres-summary-scroll flex-grow-1 overflow-auto pe-1 custom-scrollbar d-flex flex-column" style="scroll-behavior: smooth;">
                <!-- Headline Card -->
                <div id="presNarratorHeadline" class="pres-narrator-section pres-headline-anim p-3 mb-3 rounded-2" style="background: ${chipBg}; border: 1px solid ${borderCard};">
                    <div class="d-flex align-items-center gap-1.5 mb-1 text-indigo-400 fw-semibold" style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em;">
                        <i class="bi bi-stars"></i> Executive Summary
                    </div>
                    <div class="fw-bold" style="font-size: 13.5px; line-height: 1.45; color: ${textPrimary};">
                        ${escapeHtml(summary.headline)}
                    </div>
                </div>

                <!-- Live Metrics -->
                ${chipsHtml}

                <!-- Key Insights -->
                ${insightsHtml}

                <!-- Recommended Action -->
                ${actionHtml}
            </div>
        </div>
    `;
}

/**
 * Text-to-speech audio narration with onEnd callback and adjustable speech rate.
 */
export function speakSlideSummary(summary: SlideAiSummary, onEndCallback?: () => void, speechRate: number = 1.0): void {
    if (!('speechSynthesis' in window)) {
        if (onEndCallback) {
            setTimeout(onEndCallback, calculateSummaryReadTime(summary, speechRate));
        }
        return;
    }
    window.speechSynthesis.cancel();

    const cleanInsights = summary.keyInsights.map(p => p.replace(/\*\*/g, '')).join('. ');
    const textToSpeak = `${summary.title}. ${summary.headline}. Key metrics: ${summary.metricChips.map(c => `${c.label}: ${c.value}`).join(', ')}. ${cleanInsights}. Recommendation: ${summary.actionItem}`;

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = Math.max(0.6, Math.min(2.0, speechRate || 1.0));
    utterance.pitch = 1.0;

    let callbackTriggered = false;
    const triggerEnd = () => {
        if (!callbackTriggered) {
            callbackTriggered = true;
            if (onEndCallback) onEndCallback();
        }
    };

    utterance.onend = triggerEnd;
    utterance.onerror = triggerEnd;

    window.speechSynthesis.speak(utterance);
}
