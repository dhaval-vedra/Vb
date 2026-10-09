// src/js/ui/comparisonView.js
import { getRawData, getHeaders } from '../../store/DataHandler.ts';
import { visualizations } from '../charts/charts.ts';
import { showMessage } from '../core/utils.ts';
import { t } from '../i18n/index.ts';

let isComparisonActive = false;
let dateRangeA = { start: '', end: '' };
let dateRangeB = { start: '', end: '' };

/**
 * Toggles side-by-side comparison mode
 */
export function toggleComparisonView(forceState = null) {
    const nextState = forceState !== null ? forceState : !isComparisonActive;
    isComparisonActive = nextState;

    const btn = document.getElementById('btnToggleComparisonView');
    const compBar = document.getElementById('comparisonControlBar');

    if (isComparisonActive) {
        if (btn) {
            btn.classList.add('active', 'btn-primary');
            btn.classList.remove('btn-outline-secondary');
        }
        showComparisonControlBar();
        renderComparisonDashboard();
        showMessage(t('comparison.modeActiveToast', 'Comparison View Active: Side-by-side period analysis enabled.'), "success");
    } else {
        if (btn) {
            btn.classList.remove('active', 'btn-primary');
            btn.classList.add('btn-outline-secondary');
        }
        if (compBar) compBar.remove();
        
        // Trigger normal dashboard redraw
        const reRenderBtn = document.getElementById('btnAutoArrangeGrid');
        if (reRenderBtn) {
            reRenderBtn.click();
        } else {
            window.location.reload();
        }
        showMessage(t('comparison.modeExitedToast', 'Exited comparison view.'), "info");
    }
}

/**
 * Builds and mounts top comparison date filter bar
 */
function showComparisonControlBar() {
    let bar = document.getElementById('comparisonControlBar');
    if (bar) bar.remove();

    const dashboardContent = document.getElementById('dashboardContent');
    if (!dashboardContent) return;

    bar = document.createElement('div');
    bar.id = 'comparisonControlBar';
    bar.className = 'comparison-bar-sticky p-3 mb-3 bg-slate-900 text-white rounded-3 shadow-md border border-slate-700';

    bar.innerHTML = `
        <div class="d-flex flex-wrap align-items-center justify-content-between gap-3">
            <!-- Left title -->
            <div class="d-flex align-items-center gap-2">
                <div class="p-2 bg-primary bg-opacity-25 rounded-2 text-primary border border-primary border-opacity-25">
                    <i class="bi bi-layout-split fs-5"></i>
                </div>
                <div>
                    <h6 class="mb-0 fw-bold text-white">${t('comparison.title', 'Side-by-Side Comparison Engine')}</h6>
                    <small class="text-slate-400 text-xs">${t('comparison.subtitle', 'Compare dataset performance across two distinct time periods')}</small>
                </div>
            </div>

            <!-- Date Selectors A and B -->
            <div class="d-flex flex-wrap align-items-center gap-3">
                <!-- Period A -->
                <div class="d-flex align-items-center gap-1 bg-slate-800 p-1.5 rounded-2 border border-slate-700">
                    <span class="badge bg-primary text-white text-2xs fw-bold px-2 py-1">${t('comparison.periodA', 'Period A')}</span>
                    <input type="date" id="compStartDateA" class="form-control form-control-sm bg-dark text-white border-secondary text-xs" style="width: 125px;">
                    <span class="text-slate-400 text-xs">-</span>
                    <input type="date" id="compEndDateA" class="form-control form-control-sm bg-dark text-white border-secondary text-xs" style="width: 125px;">
                </div>

                <!-- VS Divider -->
                <span class="fw-bold text-primary text-xs px-1">VS</span>

                <!-- Period B -->
                <div class="d-flex align-items-center gap-1 bg-slate-800 p-1.5 rounded-2 border border-slate-700">
                    <span class="badge bg-warning text-dark text-2xs fw-bold px-2 py-1">${t('comparison.periodB', 'Period B')}</span>
                    <input type="date" id="compStartDateB" class="form-control form-control-sm bg-dark text-white border-secondary text-xs" style="width: 125px;">
                    <span class="text-slate-400 text-xs">-</span>
                    <input type="date" id="compEndDateB" class="form-control form-control-sm bg-dark text-white border-secondary text-xs" style="width: 125px;">
                </div>

                <!-- Apply & Reset Actions -->
                <div class="d-flex align-items-center gap-1">
                    <button id="btnApplyComparison" class="btn btn-sm btn-primary d-flex align-items-center gap-1">
                        <i class="bi bi-play-circle-fill"></i> <span>${t('comparison.apply', 'Apply')}</span>
                    </button>
                    <button id="btnCloseComparisonBar" class="btn btn-sm btn-outline-danger" title="${t('comparison.close', 'Close Comparison Mode')}">
                        <i class="bi bi-x-lg"></i>
                    </button>
                </div>
            </div>
        </div>

        <!-- Quick Presets -->
        <div class="d-flex align-items-center gap-2 mt-2 pt-2 border-top border-slate-800 text-xs text-slate-400">
            <span class="fw-semibold">${t('comparison.presets', 'Presets:')}</span>
            <button type="button" class="btn btn-xs btn-outline-light preset-btn py-0.5 px-2 rounded-pill" data-preset="last30vsPrior30">${t('comparison.last30vsPrior30', 'Last 30 Days vs Prior 30 Days')}</button>
            <button type="button" class="btn btn-xs btn-outline-light preset-btn py-0.5 px-2 rounded-pill" data-preset="thisMonthVsLast">${t('comparison.thisMonthVsLast', 'This Month vs Last Month')}</button>
            <button type="button" class="btn btn-xs btn-outline-light preset-btn py-0.5 px-2 rounded-pill" data-preset="q1vsQ2">Q1 vs Q2</button>
            <button type="button" class="btn btn-xs btn-outline-light preset-btn py-0.5 px-2 rounded-pill" data-preset="y2025vs2026">2025 vs 2026</button>
        </div>
    `;

    dashboardContent.parentNode.insertBefore(bar, dashboardContent);

    // Bind event handlers
    document.getElementById('btnCloseComparisonBar').addEventListener('click', () => {
        toggleComparisonView(false);
    });

    document.getElementById('btnApplyComparison').addEventListener('click', () => {
        const startA = document.getElementById('compStartDateA');
        const endA = document.getElementById('compEndDateA');
        const startB = document.getElementById('compStartDateB');
        const endB = document.getElementById('compEndDateB');

        dateRangeA.start = startA ? startA.value : '';
        dateRangeA.end = endA ? endA.value : '';
        dateRangeB.start = startB ? startB.value : '';
        dateRangeB.end = endB ? endB.value : '';
        renderComparisonDashboard();
    });

    // Preset buttons
    bar.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const preset = btn.getAttribute('data-preset');
            applyPresetDates(preset);
            renderComparisonDashboard();
        });
    });
}

function applyPresetDates(preset) {
    const today = new Date();
    const formatDate = (d) => d.toISOString().split('T')[0];

    let startA, endA, startB, endB;

    if (preset === 'thisMonthVsLast') {
        const firstOfThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const firstOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

        startA = formatDate(firstOfLastMonth);
        endA = formatDate(lastOfLastMonth);
        startB = formatDate(firstOfThisMonth);
        endB = formatDate(today);
    } else if (preset === 'q1vsQ2') {
        const yr = today.getFullYear();
        startA = `${yr}-01-01`;
        endA = `${yr}-03-31`;
        startB = `${yr}-04-01`;
        endB = `${yr}-06-30`;
    } else if (preset === 'y2025vs2026') {
        startA = `2025-01-01`;
        endA = `2025-12-31`;
        startB = `2026-01-01`;
        endB = `2026-12-31`;
    } else {
        // last30vsPrior30 default
        const d30 = new Date(today);
        d30.setDate(today.getDate() - 30);
        const d60 = new Date(today);
        d60.setDate(today.getDate() - 60);

        startA = formatDate(d60);
        endA = formatDate(d30);
        startB = formatDate(d30);
        endB = formatDate(today);
    }

    const inputStartA = document.getElementById('compStartDateA');
    const inputEndA = document.getElementById('compEndDateA');
    const inputStartB = document.getElementById('compStartDateB');
    const inputEndB = document.getElementById('compEndDateB');

    if (inputStartA) inputStartA.value = startA;
    if (inputEndA) inputEndA.value = endA;
    if (inputStartB) inputStartB.value = startB;
    if (inputEndB) inputEndB.value = endB;

    dateRangeA = { start: startA, end: endA };
    dateRangeB = { start: startB, end: endB };
}

/**
 * Filter dataset by date range
 */
function filterDataByRange(rawData, headers, range) {
    if (!range || (!range.start && !range.end)) return [...rawData];

    const dateCol = headers.find(h => h.toLowerCase().includes('date') || h.toLowerCase().includes('tarikh') || h.toLowerCase().includes('समय')) || headers[0];

    const start = range.start ? new Date(range.start) : null;
    if (start) start.setHours(0, 0, 0, 0);
    const end = range.end ? new Date(range.end) : null;
    if (end) end.setHours(23, 59, 59, 999);

    return rawData.filter(row => {
        const val = row[dateCol];
        if (!val) return false;
        const rDate = new Date(val);
        if (isNaN(rDate.getTime())) return false;

        const startOk = !start || rDate >= start;
        const endOk = !end || rDate <= end;
        return startOk && endOk;
    });
}

/**
 * Renders side-by-side comparison charts inside #dashboardContent
 */
export async function renderComparisonDashboard() {
    const dashboardContent = document.getElementById('dashboardContent');
    if (!dashboardContent) return;

    const rawData = getRawData() || [];
    const hdrs = getHeaders() || [];

    if (!rawData.length) {
        dashboardContent.innerHTML = `
            <div class="no-charts-message text-muted text-center p-5">
                <i class="bi bi-exclamation-triangle fs-2 text-warning mb-2 d-block"></i>
                <p class="fw-bold">${t('comparison.noDataTitle', 'No data available for comparison.')}</p>
                <p class="small text-secondary">${t('comparison.noDataDesc', 'Please upload Excel or CSV data first.')}</p>
            </div>
        `;
        return;
    }

    const dataA = filterDataByRange(rawData, hdrs, dateRangeA);
    const dataB = filterDataByRange(rawData, hdrs, dateRangeB);

    dashboardContent.innerHTML = '';
    dashboardContent.style.minHeight = 'auto';

    if (!visualizations || visualizations.length === 0) {
        dashboardContent.innerHTML = `
            <div class="no-charts-message text-muted text-center p-5">
                <i class="bi bi-info-circle fs-2 text-primary mb-2 d-block"></i>
                <p class="fw-bold">${t('comparison.noChartsTitle', 'No active charts found for comparison.')}</p>
                <p class="small text-secondary">${t('comparison.noChartsDesc', 'Please create a chart from the sidebar first.')}</p>
            </div>
        `;
        return;
    }

    // Render comparison layout for each active visualization
    for (let i = 0; i < visualizations.length; i++) {
        const chartConfig = visualizations[i];
        const compContainer = document.createElement('div');
        compContainer.className = 'comparison-chart-wrapper mb-4 p-3 bg-white border shadow-xs rounded-3';

        const valCol = chartConfig.valueCol || chartConfig.valCol || chartConfig.column || hdrs.find(h => typeof rawData[0]?.[h] === 'number') || hdrs[1];

        const sumA = dataA.reduce((acc, r) => acc + (parseFloat(r[valCol]) || 0), 0);
        const sumB = dataB.reduce((acc, r) => acc + (parseFloat(r[valCol]) || 0), 0);
        const diff = sumB - sumA;
        const pctChange = sumA !== 0 ? ((diff / Math.abs(sumA)) * 100).toFixed(1) : (sumB > 0 ? '+100' : '0');

        const isPositive = diff >= 0;
        const deltaBadgeClass = isPositive ? 'bg-success text-white' : 'bg-danger text-white';
        const deltaIcon = isPositive ? 'bi-graph-up-arrow' : 'bi-graph-down-arrow';

        compContainer.innerHTML = `
            <!-- Header & Delta Bar -->
            <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3 pb-2 border-bottom">
                <div>
                    <h6 class="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                        <i class="bi bi-bar-chart-fill text-primary"></i> ${chartConfig.title || t('comparison.metricAnalysis', 'Metric Analysis')} (${t('comparison.comparisonChart', 'Comparison Chart')})
                    </h6>
                    <span class="text-secondary text-xs">${t('comparison.metricColumn', 'Metric Column')}: <strong class="text-dark">${valCol}</strong></span>
                </div>

                <!-- Delta Impact Badge -->
                <div class="d-flex align-items-center gap-2 bg-light p-2 rounded-2 border">
                    <div class="text-xs">
                        <span class="text-secondary">${t('comparison.periodALabel', 'Period A')}:</span> <strong class="text-primary">${sumA.toLocaleString()}</strong>
                        <span class="text-muted mx-1">|</span>
                        <span class="text-secondary">${t('comparison.periodBLabel', 'Period B')}:</span> <strong class="text-warning">${sumB.toLocaleString()}</strong>
                    </div>
                    <span class="badge ${deltaBadgeClass} px-2.5 py-1.5 rounded-pill d-inline-flex align-items-center gap-1 shadow-xs" style="font-size: 0.78rem;">
                        <i class="bi ${deltaIcon}"></i> ${t('comparison.diffLabel', 'Delta')}: ${diff >= 0 ? '+' : ''}${diff.toLocaleString()} (${pctChange}%)
                    </span>
                </div>
            </div>

            <!-- Side-by-Side Chart Grid -->
            <div class="row g-3">
                <!-- Chart A Card -->
                <div class="col-12 col-lg-6">
                    <div class="card border-primary border-opacity-25 shadow-xs rounded-3 h-100">
                        <div class="card-header bg-primary bg-opacity-10 py-2 px-3 d-flex align-items-center justify-content-between">
                            <span class="fw-bold text-primary text-xs d-flex align-items-center gap-1">
                                <i class="bi bi-calendar3"></i> ${t('comparison.periodALabel', 'Period A')} (${dateRangeA.start || 'Start'} ${t('comparison.to', 'to')} ${dateRangeA.end || 'End'})
                            </span>
                            <span class="badge bg-primary text-white text-xs">${dataA.length} ${t('comparison.records', 'records')}</span>
                        </div>
                        <div class="card-body p-2">
                            <div id="chartCompA_${chartConfig.id}_${i}" style="width: 100%; height: 320px;"></div>
                        </div>
                    </div>
                </div>

                <!-- Chart B Card -->
                <div class="col-12 col-lg-6">
                    <div class="card border-warning border-opacity-50 shadow-xs rounded-3 h-100">
                        <div class="card-header bg-warning bg-opacity-10 py-2 px-3 d-flex align-items-center justify-content-between">
                            <span class="fw-bold text-dark text-xs d-flex align-items-center gap-1">
                                <i class="bi bi-calendar3-fill text-warning"></i> ${t('comparison.periodBLabel', 'Period B')} (${dateRangeB.start || 'Start'} ${t('comparison.to', 'to')} ${dateRangeB.end || 'End'})
                            </span>
                            <span class="badge bg-warning text-dark text-xs">${dataB.length} ${t('comparison.records', 'records')}</span>
                        </div>
                        <div class="card-body p-2">
                            <div id="chartCompB_${chartConfig.id}_${i}" style="width: 100%; height: 320px;"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        dashboardContent.appendChild(compContainer);

        // Plot ECharts instances for A and B
        setTimeout(() => {
            plotSideBySideChart(`chartCompA_${chartConfig.id}_${i}`, chartConfig, dataA, hdrs, 'Period A');
            plotSideBySideChart(`chartCompB_${chartConfig.id}_${i}`, chartConfig, dataB, hdrs, 'Period B');
        }, 50);
    }
}

/**
 * Plots a single side-by-side EChart instance
 */
function plotSideBySideChart(domId, chartConfig, dataset, hdrs, periodLabel) {
    const dom = document.getElementById(domId);
    if (!dom || typeof window.echarts === 'undefined') return;

    const chart = window.echarts.init(dom);

    const xCol = chartConfig.xAxisCol || chartConfig.xCol || chartConfig.categoryCol || hdrs[0];
    const yCol = chartConfig.valueCol || chartConfig.valCol || chartConfig.column || hdrs[1];

    // Aggregate dataset by xCol
    const aggMap = new Map();
    dataset.forEach(row => {
        const key = row[xCol] !== undefined && row[xCol] !== null ? String(row[xCol]) : 'Unknown';
        const val = parseFloat(row[yCol]) || 0;
        aggMap.set(key, (aggMap.get(key) || 0) + val);
    });

    const xData = Array.from(aggMap.keys());
    const yData = Array.from(aggMap.values());

    const isA = periodLabel === 'Period A';
    const primaryColor = isA ? '#2563eb' : '#f59e0b';

    const option = {
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' }
        },
        grid: {
            top: 25,
            left: '3%',
            right: '4%',
            bottom: '10%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: xData,
            axisLabel: { rotate: 25, fontSize: 10 }
        },
        yAxis: {
            type: 'value',
            splitLine: { lineStyle: { type: 'dashed' } }
        },
        series: [{
            name: `${periodLabel} (${yCol})`,
            type: chartConfig.type === 'line' ? 'line' : 'bar',
            data: yData,
            smooth: chartConfig.type === 'line',
            itemStyle: {
                color: new window.echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    { offset: 0, color: primaryColor },
                    { offset: 1, color: isA ? '#60a5fa' : '#fbbf24' }
                ]),
                borderRadius: [4, 4, 0, 0]
            }
        }]
    };

    chart.setOption(option);
    window.addEventListener('resize', () => {
        try {
            if (chart && (typeof chart.isDisposed === 'function' ? !chart.isDisposed() : true)) {
                chart.resize();
            }
        } catch (_) {}
    });
}
