// src/js/ai/forecastEngine.ts
import { visualizations } from '../charts/charts.ts';
import { showMessage } from '../core/utils.ts';
import { getFocusedTargetChart } from './chat.ts';

declare const echarts: any;
declare const Plotly: any;

export interface ForecastPoint {
    period: string;
    forecastValue: number;
    upperBound: number;
    lowerBound: number;
}

export interface ForecastResult {
    success: boolean;
    chartId: string;
    chartTitle: string;
    historicalCount: number;
    forecastPeriods: number;
    growthRatePercent: number;
    points: ForecastPoint[];
    message: string;
    html?: string;
}

export function applyPredictiveForecast(targetChartId?: string, periods = 3): ForecastResult {
    // 1. Resolve Target Chart
    const focused = getFocusedTargetChart ? getFocusedTargetChart() : null;
    let chartConfig = visualizations.find(v => v.id === (targetChartId || focused?.id));

    if (!chartConfig && visualizations.length > 0) {
        // Fallback to first line or bar chart
        chartConfig = visualizations.find(v => ['line', 'bar', 'area', 'scatter'].includes(v.type.toLowerCase())) || visualizations[0];
    }

    if (!chartConfig) {
        return {
            success: false,
            chartId: "",
            chartTitle: "",
            historicalCount: 0,
            forecastPeriods: periods,
            growthRatePercent: 0,
            points: [],
            message: "फोरकास्ट करने के लिए डैशबोर्ड पर कोई उपयुक्त चार्ट नहीं मिला। पहले एक लाइन या बार चार्ट बनाएं।"
        };
    }

    const chartDom = document.getElementById(chartConfig.id);
    if (!chartDom) {
        return {
            success: false,
            chartId: chartConfig.id,
            chartTitle: chartConfig.title || "Chart",
            historicalCount: 0,
            forecastPeriods: periods,
            growthRatePercent: 0,
            points: [],
            message: "चार्ट का DOM एलिमेंट नहीं मिला।"
        };
    }

    const echartsInstance = typeof echarts !== 'undefined' ? echarts.getInstanceByDom(chartDom) : null;

    if (!echartsInstance) {
        // Check if Plotly chart
        const isPlotly = (chartDom as any).data && (chartDom as any).layout;
        if (isPlotly && typeof Plotly !== 'undefined') {
            return applyPlotlyForecast(chartDom, chartConfig, periods);
        }

        return {
            success: false,
            chartId: chartConfig.id,
            chartTitle: chartConfig.title || "Chart",
            historicalCount: 0,
            forecastPeriods: periods,
            growthRatePercent: 0,
            points: [],
            message: "चार्ट इंस्टैंस सक्रिय नहीं है। कृपया चार्ट दोबारा रेंडर होने दें।"
        };
    }

    const currentOption = echartsInstance.getOption();
    if (!currentOption || !currentOption.series || currentOption.series.length === 0) {
        return {
            success: false,
            chartId: chartConfig.id,
            chartTitle: chartConfig.title || "Chart",
            historicalCount: 0,
            forecastPeriods: periods,
            growthRatePercent: 0,
            points: [],
            message: "चार्ट में डेटा श्रृंखला (series) नहीं मिली।"
        };
    }

    // 2. Extract Data Points
    const primarySeries = currentOption.series[0];
    const rawData = primarySeries.data || [];
    const xAxisData: string[] = currentOption.xAxis && currentOption.xAxis[0] && currentOption.xAxis[0].data ? [...currentOption.xAxis[0].data] : [];

    const numValues: number[] = [];
    rawData.forEach((item: any) => {
        if (typeof item === 'number') {
            numValues.push(item);
        } else if (item && typeof item === 'object') {
            const v = item.value !== undefined ? item.value : (Array.isArray(item) ? item[1] : 0);
            numValues.push(Number(v) || 0);
        } else {
            numValues.push(Number(item) || 0);
        }
    });

    if (numValues.length < 2) {
        return {
            success: false,
            chartId: chartConfig.id,
            chartTitle: chartConfig.title || "Chart",
            historicalCount: numValues.length,
            forecastPeriods: periods,
            growthRatePercent: 0,
            points: [],
            message: "भविष्यवाणी के लिए कम से कम 2 ऐतिहासिक डेटा पॉइंट्स आवश्यक हैं।"
        };
    }

    // 3. Compute Linear Trend (Slope & Intercept)
    const n = numValues.length;
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumX2 = 0;

    for (let i = 0; i < n; i++) {
        sumX += i;
        sumY += numValues[i];
        sumXY += i * numValues[i];
        sumX2 += i * i;
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX || 1);
    const intercept = (sumY - slope * sumX) / n;

    // Standard error for confidence interval
    let sumResidualSq = 0;
    for (let i = 0; i < n; i++) {
        const predicted = slope * i + intercept;
        sumResidualSq += Math.pow(numValues[i] - predicted, 2);
    }
    const stdError = Math.sqrt(sumResidualSq / Math.max(1, n - 2));

    // 4. Generate Future Forecast Points
    const forecastPoints: ForecastPoint[] = [];
    const newXAxisCategories = [...xAxisData];
    const lastXLabel = xAxisData[xAxisData.length - 1] || `T${n}`;
    const lastVal = numValues[numValues.length - 1];

    // Connect historical series with forecast series at the last point
    const forecastSeriesData: (number | null)[] = new Array(n - 1).fill(null);
    forecastSeriesData.push(lastVal);

    for (let k = 1; k <= periods; k++) {
        const futureIdx = n - 1 + k;
        const projected = Math.max(0, slope * futureIdx + intercept);
        const margin = 1.96 * stdError * Math.sqrt(1 + 1 / n + Math.pow(futureIdx - (n / 2), 2) / (sumX2 || 1));
        const upper = projected + margin;
        const lower = Math.max(0, projected - margin);

        const periodName = `भविष्य +${k} (${lastXLabel.includes('20') ? 'अनुमानित' : 'P+' + k})`;
        newXAxisCategories.push(periodName);
        forecastSeriesData.push(Math.round(projected * 10) / 10);

        forecastPoints.push({
            period: periodName,
            forecastValue: Math.round(projected * 10) / 10,
            upperBound: Math.round(upper * 10) / 10,
            lowerBound: Math.round(lower * 10) / 10
        });
    }

    const finalProjected = forecastPoints[forecastPoints.length - 1]?.forecastValue || lastVal;
    const growthRate = lastVal > 0 ? ((finalProjected - lastVal) / lastVal) * 100 : 0;

    // 5. Update ECharts with Predictive Forecast Trace
    const updatedOption = {
        ...currentOption,
        xAxis: [
            {
                ...(currentOption.xAxis ? currentOption.xAxis[0] : {}),
                data: newXAxisCategories
            }
        ],
        series: [
            ...currentOption.series.filter((s: any) => !s.isForecastSeries),
            {
                name: 'भविष्यवाणी (AI Trend Forecast)',
                type: 'line',
                isForecastSeries: true,
                data: forecastSeriesData,
                smooth: true,
                lineStyle: {
                    type: 'dashed',
                    width: 3,
                    color: '#f59e0b'
                },
                itemStyle: {
                    color: '#f59e0b'
                },
                markPoint: {
                    data: [
                        {
                            type: 'max',
                            name: 'अपेक्षित पीक',
                            symbol: 'pin',
                            symbolSize: 45,
                            itemStyle: { color: '#f59e0b' },
                            label: { formatter: 'AI अनुमान', fontSize: 10 }
                        }
                    ]
                }
            }
        ]
    };

    echartsInstance.setOption(updatedOption, true);

    // 6. Append Visual Forecast Badge to Chart Container
    attachForecastBadgeToDom(chartDom, chartConfig.id, forecastPoints, growthRate);

    const cardId = `forecast_card_${Date.now()}`;
    const cardHtml = `
        <div class="forecast-result-card p-3 bg-white border border-amber-300 rounded-3 shadow-sm mb-2" id="${cardId}" style="border-left: 4px solid #f59e0b !important;">
            <div class="d-flex align-items-center justify-content-between mb-2">
                <div class="d-flex align-items-center gap-2">
                    <span class="badge bg-amber-100 text-amber-800 p-1.5 rounded-2">
                        <i class="bi bi-graph-up-arrow fs-6"></i>
                    </span>
                    <div>
                        <h6 class="mb-0 fw-bold text-slate-800" style="font-size: 0.92rem;">भविष्यवाणी एवं ट्रेंड फोरकास्ट (Predictive Forecast)</h6>
                        <span class="text-muted text-2xs">चार्ट: <strong>${chartConfig.title || 'Analytics'}</strong> | अवधि: अगले +${periods} अंतराल</span>
                    </div>
                </div>
                <span class="badge ${growthRate >= 0 ? 'bg-success' : 'bg-danger'} text-white text-2xs px-2 py-1 rounded-pill">
                    ${growthRate >= 0 ? '+' : ''}${growthRate.toFixed(1)}% अपेक्षित बदलाव
                </span>
            </div>
            <p class="text-slate-600 small mb-2">ऐतिहासिक डेटा के आधार पर आगामी ${periods} अंतरालों का AI फोरकास्ट चार्ट पर डॉटेड (dashed) लाइन द्वारा विज़ुअलाइज़ कर दिया गया है।</p>
            <div class="row g-2 mb-2">
                ${forecastPoints.map((p, idx) => `
                    <div class="col-4">
                        <div class="p-2 bg-amber-50 border border-amber-200 rounded text-center">
                            <div class="text-muted text-2xs">+${idx + 1} अंतराल</div>
                            <div class="fw-bold text-slate-800 text-xs">${p.forecastValue.toLocaleString('en-IN')}</div>
                            <div class="text-muted text-2xs" style="font-size: 0.65rem;">(${p.lowerBound.toFixed(0)} - ${p.upperBound.toFixed(0)})</div>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="d-flex align-items-center justify-content-between pt-2 border-top">
                <span class="text-muted text-2xs"><i class="bi bi-shield-check me-1 text-success"></i> 95% विश्वास अंतराल (Confidence Interval)</span>
                <button class="btn btn-xs btn-outline-secondary btn-remove-forecast" data-chart-id="${chartConfig.id}">
                    <i class="bi bi-arrow-counterclockwise me-1"></i> फोरकास्ट हटाएं
                </button>
            </div>
        </div>
    `;

    showMessage(`चार्ट पर अगले ${periods} अंतरालों का AI फोरकास्ट लागू किया गया!`, "success");

    return {
        success: true,
        chartId: chartConfig.id,
        chartTitle: chartConfig.title || "Chart",
        historicalCount: n,
        forecastPeriods: periods,
        growthRatePercent: growthRate,
        points: forecastPoints,
        message: `Predictive forecast for +${periods} periods rendered on chart.`,
        html: cardHtml
    };
}

function applyPlotlyForecast(chartDom: HTMLElement, chartConfig: any, periods: number): ForecastResult {
    const rawTraces = (chartDom as any).data || [];
    if (rawTraces.length === 0) {
        return {
            success: false,
            chartId: chartConfig.id,
            chartTitle: chartConfig.title || "Plotly Chart",
            historicalCount: 0,
            forecastPeriods: periods,
            growthRatePercent: 0,
            points: [],
            message: "Plotly डेटा श्रृंखला नहीं मिली।"
        };
    }

    const trace = rawTraces[0];
    const yVals = (trace.y || []).map((v: any) => Number(v) || 0);
    const xVals = trace.x || [];
    const n = yVals.length;

    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    for (let i = 0; i < n; i++) {
        sumX += i;
        sumY += yVals[i];
        sumXY += i * yVals[i];
        sumX2 += i * i;
    }
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX || 1);
    const intercept = (sumY - slope * sumX) / n;

    const forecastPoints: ForecastPoint[] = [];
    const futureX: string[] = [xVals[xVals.length - 1]];
    const futureY: number[] = [yVals[yVals.length - 1]];

    for (let k = 1; k <= periods; k++) {
        const futureIdx = n - 1 + k;
        const val = Math.max(0, slope * futureIdx + intercept);
        const name = `+${k} अनुमान`;
        futureX.push(name);
        futureY.push(Math.round(val * 10) / 10);
        forecastPoints.push({
            period: name,
            forecastValue: Math.round(val * 10) / 10,
            upperBound: Math.round(val * 1.15),
            lowerBound: Math.round(val * 0.85)
        });
    }

    const growthRate = yVals[n - 1] > 0 ? ((futureY[futureY.length - 1] - yVals[n - 1]) / yVals[n - 1]) * 100 : 0;

    const forecastTrace = {
        x: futureX,
        y: futureY,
        name: 'AI Forecast (भविष्यवाणी)',
        mode: 'lines+markers',
        line: { dash: 'dot', width: 3, color: '#f59e0b' }
    };

    Plotly.addTraces(chartDom, [forecastTrace]);
    attachForecastBadgeToDom(chartDom, chartConfig.id, forecastPoints, growthRate);

    return {
        success: true,
        chartId: chartConfig.id,
        chartTitle: chartConfig.title || "Plotly Chart",
        historicalCount: n,
        forecastPeriods: periods,
        growthRatePercent: growthRate,
        points: forecastPoints,
        message: "Plotly forecast rendered."
    };
}

function attachForecastBadgeToDom(chartDom: HTMLElement, chartId: string, points: ForecastPoint[], growthRate: number): void {
    const parent = chartDom.closest('.chart-box') || chartDom.parentElement;
    if (!parent) return;

    let badge = parent.querySelector('.chart-forecast-badge');
    if (!badge) {
        badge = document.createElement('div');
        badge.className = 'chart-forecast-badge d-flex align-items-center justify-content-between px-2.5 py-1 bg-amber-50 border-top border-amber-200 text-slate-700 text-2xs';
        parent.appendChild(badge);
    }

    badge.innerHTML = `
        <div class="d-flex align-items-center gap-1.5">
            <i class="bi bi-graph-up-arrow text-amber-600"></i>
            <span class="fw-bold">AI Forecast:</span>
            <span>अगला अनुमान <strong>${points[0]?.forecastValue.toLocaleString('en-IN')}</strong> (${growthRate >= 0 ? '+' : ''}${growthRate.toFixed(1)}%)</span>
        </div>
        <button class="btn btn-link btn-xs p-0 text-slate-400 hover:text-danger btn-remove-forecast" data-chart-id="${chartId}" title="फोरकास्ट हटाएं">
            <i class="bi bi-x-circle"></i>
        </button>
    `;

    badge.querySelector('.btn-remove-forecast')?.addEventListener('click', () => {
        removeForecast(chartId);
    });
}

export function removeForecast(chartId: string): void {
    const chartDom = document.getElementById(chartId);
    if (!chartDom) return;

    const echartsInstance = typeof echarts !== 'undefined' ? echarts.getInstanceByDom(chartDom) : null;
    if (echartsInstance) {
        const option = echartsInstance.getOption();
        if (option && option.series) {
            option.series = option.series.filter((s: any) => !s.isForecastSeries && s.name !== 'भविष्यवाणी (AI Trend Forecast)');
            echartsInstance.setOption(option, true);
        }
    }

    const parent = chartDom.closest('.chart-box') || chartDom.parentElement;
    const badge = parent?.querySelector('.chart-forecast-badge');
    if (badge) badge.remove();

    showMessage("चार्ट से फोरकास्ट लाइन हटा दी गई।", "info");
}

export function attachForecastCardListeners(container: HTMLElement = document.body): void {
    container.querySelectorAll('.btn-remove-forecast').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const cid = (btn as HTMLElement).dataset.chartId;
            if (cid) removeForecast(cid);
        });
    });
}
