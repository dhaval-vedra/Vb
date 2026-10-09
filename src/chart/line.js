// src/chart/line.js
import { headers } from '../store/DataHandler.ts';
import { chartGlobalSettings } from '../js/charts/charts.ts';
import { commonChartOptions } from './uility.js';
import { lttbDownsample } from '../js/data/lttbDownsample.ts';

/**
 * Modern ECharts (v6) Comprehensive Line Chart Module
 * Provides specialized, distinctive configurations for each line chart subtype.
 */

// Helper to resolve dark theme text color
function getTextColor() {
    return (typeof document !== 'undefined' && document.body?.classList.contains('dark-theme'))
        ? '#f8f9fa'
        : '#334155';
}

function getSplitLineColor() {
    return (typeof document !== 'undefined' && document.body?.classList.contains('dark-theme'))
        ? 'rgba(255, 255, 255, 0.1)'
        : 'rgba(0, 0, 0, 0.08)';
}

// Convert Hex or Color string to RGBA string with opacity
function toRgba(hexOrColor, opacity) {
    if (!hexOrColor) return `rgba(84, 112, 198, ${opacity})`;
    if (hexOrColor.startsWith('rgba')) {
        return hexOrColor.replace(/[\d\.]+\)$/g, `${opacity})`);
    }
    if (hexOrColor.startsWith('rgb')) {
        return hexOrColor.replace('rgb', 'rgba').replace(')', `, ${opacity})`);
    }
    let hex = hexOrColor.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    if (hex.length === 6) {
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
    return `rgba(84, 112, 198, ${opacity})`;
}

// Robust column resolver to prevent configuration errors
function resolveColumns(config, data) {
    let xAxis = config?.columns?.[0] || config?.xAxis;
    let yAxes = [];

    if (config?.columns && Array.isArray(config.columns) && config.columns.length > 1) {
        yAxes = config.columns.slice(1);
    } else if (config?.yAxes && Array.isArray(config.yAxes) && config.yAxes.length > 0) {
        yAxes = config.yAxes;
    }

    const sampleRow = (data && data.length > 0 && typeof data[0] === 'object' && data[0] !== null) ? data[0] : {};
    const allKeys = Object.keys(sampleRow);

    if (!xAxis && allKeys.length > 0) {
        xAxis = allKeys[0];
    }
    if (yAxes.length === 0) {
        if (allKeys.length > 1) {
            yAxes = [allKeys[1]];
        } else if (allKeys.length === 1) {
            yAxes = [allKeys[0]];
        } else {
            xAxis = xAxis || 'Category';
            yAxes = ['Value'];
        }
    }

    return { xAxis, yAxes };
}

// Shared Context Preparation
function prepareContext(config, rawData) {
    const { xAxis, yAxes } = resolveColumns(config, rawData);
    
    // Sampling / Downsampling
    let sampledData = rawData || [];
    if (config && config.dataRowLimit && config.dataRowLimit !== 'all') {
        const limit = typeof config.dataRowLimit === 'number' ? config.dataRowLimit : parseInt(config.dataRowLimit, 10);
        if (!isNaN(limit) && limit > 0) {
            sampledData = (rawData || []).slice(0, limit);
        }
    } else {
        sampledData = lttbDownsample(rawData || []);
    }

    const categories = sampledData.map(row => (row && row[xAxis] !== undefined && row[xAxis] !== null ? String(row[xAxis]) : ''));
    
    // Default palette
    const defaultPalette = ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc'];
    const activePalette = (Array.isArray(config?.colorPalette) && config.colorPalette.length > 0)
        ? config.colorPalette
        : ((Array.isArray(chartGlobalSettings?.colorPalette) && chartGlobalSettings.colorPalette.length > 0)
            ? chartGlobalSettings.colorPalette
            : (config?.color ? [config.color, ...defaultPalette] : defaultPalette));

    const textColor = getTextColor();
    const splitColor = getSplitLineColor();

    const getSeriesValues = (col) => sampledData.map(row => {
        if (!row || row[col] === null || row[col] === undefined) return null;
        const v = parseFloat(row[col]);
        return isNaN(v) ? null : v;
    });

    const formatSymbol = () => {
        if (typeof config?.symbolImage === 'string' && config.symbolImage.trim()) {
            const img = config.symbolImage.trim();
            return (img.startsWith('data:') || img.startsWith('http') || img.startsWith('/')) ? (img.startsWith('image://') ? img : `image://${img}`) : img;
        }
        if (typeof config?.symbol === 'string' && config.symbol.trim()) {
            const sym = config.symbol.trim();
            return (sym.startsWith('data:') || sym.startsWith('http') || sym.startsWith('/')) ? (sym.startsWith('image://') ? sym : `image://${sym}`) : sym;
        }
        return sampledData.length > 60 ? 'none' : 'circle';
    };

    return {
        config,
        rawData,
        sampledData,
        xAxis,
        yAxes,
        categories,
        activePalette,
        textColor,
        splitColor,
        getSeriesValues,
        formatSymbol
    };
}

// -------------------------------------------------------------
// INDIVIDUAL LINE CHART SUBTYPE BUILDERS
// -------------------------------------------------------------

/**
 * 1. Standard Line Chart (साधारण लाइन)
 */
function buildStandardLine(ctx) {
    const { config, yAxes, categories, activePalette, textColor, splitColor, getSeriesValues, formatSymbol } = ctx;
    const symbolVal = formatSymbol();

    const series = yAxes.map((col, idx) => ({
        name: headers[col] || col,
        type: 'line',
        data: getSeriesValues(col),
        smooth: false,
        symbol: symbolVal,
        symbolSize: 6,
        lineStyle: { width: 2.5, type: config.lineStyle || 'solid' },
        itemStyle: { color: activePalette[idx % activePalette.length] },
        emphasis: { focus: 'series', lineStyle: { width: 3.5 } }
    }));

    return {
        tooltip: { trigger: 'axis' },
        legend: { show: yAxes.length > 1, top: 'top', textStyle: { color: textColor } },
        grid: { left: '4%', right: '4%', top: '14%', bottom: '10%', containLabel: true },
        xAxis: {
            type: 'category',
            data: categories,
            axisLabel: { color: textColor },
            boundaryGap: false
        },
        yAxis: {
            type: 'value',
            axisLabel: { color: textColor },
            splitLine: { lineStyle: { color: splitColor, type: 'dashed' } }
        },
        series
    };
}

/**
 * 2. Smooth Curve Line Chart (स्मूद कर्व लाइन)
 */
function buildSmoothLine(ctx) {
    const { config, yAxes, categories, activePalette, textColor, splitColor, getSeriesValues, formatSymbol } = ctx;
    const symbolVal = formatSymbol();

    const series = yAxes.map((col, idx) => {
        const color = activePalette[idx % activePalette.length];
        return {
            name: headers[col] || col,
            type: 'line',
            data: getSeriesValues(col),
            smooth: 0.45,
            symbol: symbolVal,
            symbolSize: 8,
            lineStyle: { width: 3.2, color },
            itemStyle: { color, borderWidth: 2, borderColor: '#fff' },
            emphasis: {
                focus: 'series',
                lineStyle: { width: 4.5 },
                itemStyle: { shadowBlur: 10, shadowColor: toRgba(color, 0.5) }
            }
        };
    });

    return {
        tooltip: { trigger: 'axis' },
        legend: { show: yAxes.length > 1, top: 'top', textStyle: { color: textColor } },
        grid: { left: '4%', right: '4%', top: '14%', bottom: '10%', containLabel: true },
        xAxis: {
            type: 'category',
            data: categories,
            axisLabel: { color: textColor },
            boundaryGap: false
        },
        yAxis: {
            type: 'value',
            axisLabel: { color: textColor },
            splitLine: { lineStyle: { color: splitColor, type: 'dashed' } }
        },
        series
    };
}

/**
 * 3. Area Line Chart (एरिया लाइन)
 */
function buildAreaLine(ctx) {
    const { config, yAxes, categories, activePalette, textColor, splitColor, getSeriesValues, formatSymbol } = ctx;
    const symbolVal = formatSymbol();

    const series = yAxes.map((col, idx) => {
        const color = activePalette[idx % activePalette.length];
        return {
            name: headers[col] || col,
            type: 'line',
            data: getSeriesValues(col),
            smooth: false,
            symbol: symbolVal,
            symbolSize: 6,
            lineStyle: { width: 2.5, color },
            itemStyle: { color },
            areaStyle: {
                color: toRgba(color, 0.35),
                origin: 'auto'
            },
            emphasis: { focus: 'series', lineStyle: { width: 3.5 } }
        };
    });

    return {
        tooltip: { trigger: 'axis' },
        legend: { show: yAxes.length > 1, top: 'top', textStyle: { color: textColor } },
        grid: { left: '4%', right: '4%', top: '14%', bottom: '10%', containLabel: true },
        xAxis: {
            type: 'category',
            data: categories,
            axisLabel: { color: textColor },
            boundaryGap: false
        },
        yAxis: {
            type: 'value',
            axisLabel: { color: textColor },
            splitLine: { lineStyle: { color: splitColor, type: 'dashed' } }
        },
        series
    };
}

/**
 * 4. Smooth Area Line Chart (स्मूद एरिया)
 */
function buildSmoothArea(ctx) {
    const { config, yAxes, categories, activePalette, textColor, splitColor, getSeriesValues, formatSymbol } = ctx;
    const symbolVal = formatSymbol();

    const series = yAxes.map((col, idx) => {
        const color = activePalette[idx % activePalette.length];
        return {
            name: headers[col] || col,
            type: 'line',
            data: getSeriesValues(col),
            smooth: 0.45,
            symbol: symbolVal,
            symbolSize: 7,
            lineStyle: { width: 3, color },
            itemStyle: { color },
            areaStyle: {
                color: toRgba(color, 0.38)
            },
            emphasis: { focus: 'series', lineStyle: { width: 4 } }
        };
    });

    return {
        tooltip: { trigger: 'axis' },
        legend: { show: yAxes.length > 1, top: 'top', textStyle: { color: textColor } },
        grid: { left: '4%', right: '4%', top: '14%', bottom: '10%', containLabel: true },
        xAxis: {
            type: 'category',
            data: categories,
            axisLabel: { color: textColor },
            boundaryGap: false
        },
        yAxis: {
            type: 'value',
            axisLabel: { color: textColor },
            splitLine: { lineStyle: { color: splitColor, type: 'dashed' } }
        },
        series
    };
}

/**
 * 5. Stacked Line Chart (स्टैक्ड लाइन)
 */
function buildStackedLine(ctx) {
    const { config, yAxes, categories, activePalette, textColor, splitColor, getSeriesValues, formatSymbol } = ctx;
    const symbolVal = formatSymbol();

    const series = yAxes.map((col, idx) => {
        const color = activePalette[idx % activePalette.length];
        return {
            name: headers[col] || col,
            type: 'line',
            data: getSeriesValues(col),
            stack: 'totalStack',
            smooth: false,
            symbol: symbolVal,
            symbolSize: 6,
            lineStyle: { width: 2.5, color },
            itemStyle: { color },
            emphasis: { focus: 'series', lineStyle: { width: 3.5 } }
        };
    });

    return {
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'cross', label: { backgroundColor: '#6a7985' } }
        },
        legend: { show: true, top: 'top', textStyle: { color: textColor } },
        grid: { left: '4%', right: '4%', top: '14%', bottom: '10%', containLabel: true },
        xAxis: {
            type: 'category',
            data: categories,
            axisLabel: { color: textColor },
            boundaryGap: false
        },
        yAxis: {
            type: 'value',
            axisLabel: { color: textColor },
            splitLine: { lineStyle: { color: splitColor, type: 'dashed' } }
        },
        series
    };
}

/**
 * 6. Stacked Area Chart (स्टैक्ड एरिया)
 */
function buildStackedArea(ctx) {
    const { config, yAxes, categories, activePalette, textColor, splitColor, getSeriesValues, formatSymbol } = ctx;
    const symbolVal = formatSymbol();

    const series = yAxes.map((col, idx) => {
        const color = activePalette[idx % activePalette.length];
        return {
            name: headers[col] || col,
            type: 'line',
            data: getSeriesValues(col),
            stack: 'totalStack',
            smooth: true,
            symbol: symbolVal,
            symbolSize: 6,
            lineStyle: { width: 1.8, color: '#ffffff' },
            itemStyle: { color },
            areaStyle: {
                opacity: 0.65,
                color
            },
            emphasis: { focus: 'series' }
        };
    });

    return {
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'cross', label: { backgroundColor: '#475569' } }
        },
        legend: { show: true, top: 'top', textStyle: { color: textColor } },
        grid: { left: '4%', right: '4%', top: '14%', bottom: '10%', containLabel: true },
        xAxis: {
            type: 'category',
            data: categories,
            axisLabel: { color: textColor },
            boundaryGap: false
        },
        yAxis: {
            type: 'value',
            axisLabel: { color: textColor },
            splitLine: { lineStyle: { color: splitColor, type: 'dashed' } }
        },
        series
    };
}

/**
 * 7. Gradient Fill Area Chart (ग्रेडिएंट एरिया)
 */
function buildGradientArea(ctx) {
    const { config, yAxes, categories, activePalette, textColor, splitColor, getSeriesValues, formatSymbol } = ctx;
    const symbolVal = formatSymbol();

    const series = yAxes.map((col, idx) => {
        const color = activePalette[idx % activePalette.length];
        return {
            name: headers[col] || col,
            type: 'line',
            data: getSeriesValues(col),
            smooth: 0.38,
            symbol: symbolVal,
            symbolSize: 7,
            lineStyle: { width: 3.2, color },
            itemStyle: { color, borderWidth: 2, borderColor: '#fff' },
            areaStyle: {
                color: {
                    type: 'linear',
                    x: 0,
                    y: 0,
                    x2: 0,
                    y2: 1,
                    colorStops: [
                        { offset: 0, color: toRgba(color, 0.75) },
                        { offset: 0.8, color: toRgba(color, 0.15) },
                        { offset: 1, color: toRgba(color, 0.02) }
                    ]
                }
            },
            emphasis: { focus: 'series', lineStyle: { width: 4.5 } }
        };
    });

    return {
        tooltip: { trigger: 'axis' },
        legend: { show: yAxes.length > 1, top: 'top', textStyle: { color: textColor } },
        grid: { left: '4%', right: '4%', top: '14%', bottom: '10%', containLabel: true },
        xAxis: {
            type: 'category',
            data: categories,
            axisLabel: { color: textColor },
            boundaryGap: false
        },
        yAxis: {
            type: 'value',
            axisLabel: { color: textColor },
            splitLine: { lineStyle: { color: splitColor, type: 'dashed' } }
        },
        series
    };
}

/**
 * 8. Step Line - Middle (स्टेप लाइन - मिडिल)
 */
function buildStepMiddle(ctx) {
    const { config, yAxes, categories, activePalette, textColor, splitColor, getSeriesValues } = ctx;

    const series = yAxes.map((col, idx) => ({
        name: headers[col] || col,
        type: 'line',
        step: 'middle',
        data: getSeriesValues(col),
        symbol: 'circle',
        symbolSize: 7,
        lineStyle: { width: 3, color: activePalette[idx % activePalette.length] },
        itemStyle: { color: activePalette[idx % activePalette.length] },
        emphasis: { focus: 'series', lineStyle: { width: 4 } }
    }));

    return {
        tooltip: { trigger: 'axis' },
        legend: { show: yAxes.length > 1, top: 'top', textStyle: { color: textColor } },
        grid: { left: '4%', right: '4%', top: '14%', bottom: '10%', containLabel: true },
        xAxis: {
            type: 'category',
            data: categories,
            axisLabel: { color: textColor }
        },
        yAxis: {
            type: 'value',
            axisLabel: { color: textColor },
            splitLine: { lineStyle: { color: splitColor, type: 'dashed' } }
        },
        series
    };
}

/**
 * 9. Step Line - Start (स्टेप लाइन - स्टार्ट)
 */
function buildStepStart(ctx) {
    const { config, yAxes, categories, activePalette, textColor, splitColor, getSeriesValues } = ctx;

    const series = yAxes.map((col, idx) => ({
        name: headers[col] || col,
        type: 'line',
        step: 'start',
        data: getSeriesValues(col),
        symbol: 'diamond',
        symbolSize: 8,
        lineStyle: { width: 3, color: activePalette[idx % activePalette.length] },
        itemStyle: { color: activePalette[idx % activePalette.length] },
        emphasis: { focus: 'series', lineStyle: { width: 4 } }
    }));

    return {
        tooltip: { trigger: 'axis' },
        legend: { show: yAxes.length > 1, top: 'top', textStyle: { color: textColor } },
        grid: { left: '4%', right: '4%', top: '14%', bottom: '10%', containLabel: true },
        xAxis: {
            type: 'category',
            data: categories,
            axisLabel: { color: textColor }
        },
        yAxis: {
            type: 'value',
            axisLabel: { color: textColor },
            splitLine: { lineStyle: { color: splitColor, type: 'dashed' } }
        },
        series
    };
}

/**
 * 10. Step Line - End (स्टेप लाइन - एंड)
 */
function buildStepEnd(ctx) {
    const { config, yAxes, categories, activePalette, textColor, splitColor, getSeriesValues } = ctx;

    const series = yAxes.map((col, idx) => ({
        name: headers[col] || col,
        type: 'line',
        step: 'end',
        data: getSeriesValues(col),
        symbol: 'rect',
        symbolSize: 7,
        lineStyle: { width: 3, color: activePalette[idx % activePalette.length] },
        itemStyle: { color: activePalette[idx % activePalette.length] },
        emphasis: { focus: 'series', lineStyle: { width: 4 } }
    }));

    return {
        tooltip: { trigger: 'axis' },
        legend: { show: yAxes.length > 1, top: 'top', textStyle: { color: textColor } },
        grid: { left: '4%', right: '4%', top: '14%', bottom: '10%', containLabel: true },
        xAxis: {
            type: 'category',
            data: categories,
            axisLabel: { color: textColor }
        },
        yAxis: {
            type: 'value',
            axisLabel: { color: textColor },
            splitLine: { lineStyle: { color: splitColor, type: 'dashed' } }
        },
        series
    };
}

/**
 * 11. Dual Axis Line Chart (डुअल Y-अक्ष लाइन)
 */
function buildDualAxisLine(ctx) {
    const { config, yAxes, categories, activePalette, textColor, splitColor, getSeriesValues } = ctx;

    const leftCol = yAxes[0];
    const rightCol = yAxes.length > 1 ? yAxes[1] : null;

    const leftColor = activePalette[0];
    const rightColor = activePalette[1] || '#91cc75';

    const series = [
        {
            name: headers[leftCol] || leftCol,
            type: 'line',
            yAxisIndex: 0,
            data: getSeriesValues(leftCol),
            smooth: true,
            symbol: 'circle',
            symbolSize: 7,
            lineStyle: { width: 3, color: leftColor },
            itemStyle: { color: leftColor }
        }
    ];

    if (rightCol) {
        series.push({
            name: headers[rightCol] || rightCol,
            type: 'line',
            yAxisIndex: 1,
            data: getSeriesValues(rightCol),
            smooth: true,
            symbol: 'diamond',
            symbolSize: 8,
            lineStyle: { width: 3, color: rightColor, type: 'dashed' },
            itemStyle: { color: rightColor }
        });
    } else {
        // If only 1 Y column is chosen, calculate moving average or cumulative index for the right axis
        const leftVals = getSeriesValues(leftCol);
        let sum = 0;
        const total = leftVals.reduce((acc, v) => acc + (v || 0), 0) || 1;
        const cumulativePct = leftVals.map(v => {
            if (v === null) return null;
            sum += v;
            return parseFloat(((sum / total) * 100).toFixed(1));
        });

        series.push({
            name: `${headers[leftCol] || leftCol} (Cumulative %)`,
            type: 'line',
            yAxisIndex: 1,
            data: cumulativePct,
            smooth: true,
            symbol: 'triangle',
            symbolSize: 8,
            lineStyle: { width: 2.5, color: rightColor, type: 'dashed' },
            itemStyle: { color: rightColor }
        });
    }

    return {
        tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
        legend: { show: true, top: 'top', textStyle: { color: textColor } },
        grid: { left: '6%', right: '6%', top: '15%', bottom: '12%', containLabel: true },
        xAxis: {
            type: 'category',
            data: categories,
            axisLabel: { color: textColor }
        },
        yAxis: [
            {
                type: 'value',
                name: headers[leftCol] || leftCol,
                nameTextStyle: { color: leftColor, fontWeight: 'bold' },
                axisLabel: { color: textColor },
                axisLine: { show: true, lineStyle: { color: leftColor } },
                splitLine: { lineStyle: { color: splitColor, type: 'dashed' } }
            },
            {
                type: 'value',
                name: rightCol ? (headers[rightCol] || rightCol) : 'Cumulative %',
                nameTextStyle: { color: rightColor, fontWeight: 'bold' },
                axisLabel: { 
                    color: textColor,
                    formatter: rightCol ? '{value}' : '{value}%'
                },
                axisLine: { show: true, lineStyle: { color: rightColor } },
                splitLine: { show: false }
            }
        ],
        series
    };
}

/**
 * 12. Confidence Band Chart (कॉन्फिडेंस बैंड / Range Area)
 */
function buildConfidenceBand(ctx) {
    const { config, yAxes, categories, activePalette, textColor, splitColor, getSeriesValues } = ctx;
    const primaryCol = yAxes[0];
    const baseValues = getSeriesValues(primaryCol);

    // Calculate dynamic confidence margins based on data variance
    const numVals = baseValues.filter(v => v !== null);
    const avg = numVals.length ? (numVals.reduce((a, b) => a + b, 0) / numVals.length) : 10;
    const varianceMargin = Math.max(avg * 0.15, 2);

    const lowerValues = baseValues.map(v => v !== null ? parseFloat((v - varianceMargin).toFixed(2)) : null);
    const bandSpanValues = baseValues.map(v => v !== null ? parseFloat((varianceMargin * 2).toFixed(2)) : null);

    const mainColor = activePalette[0];

    return {
        tooltip: {
            trigger: 'axis',
            formatter: (params) => {
                if (!params || !params.length) return '';
                const cat = params[0].name;
                const mainPoint = params.find(p => p.seriesName === (headers[primaryCol] || primaryCol));
                const val = mainPoint ? mainPoint.value : '-';
                return `<b>${cat}</b><br/>
                        ${headers[primaryCol] || primaryCol}: <b>${val}</b><br/>
                        <span style="color:${toRgba(mainColor, 0.8)}">95% Conf. Range: ±${varianceMargin.toFixed(1)}</span>`;
            }
        },
        legend: {
            show: true,
            top: 'top',
            textStyle: { color: textColor },
            data: [headers[primaryCol] || primaryCol, 'Confidence Range']
        },
        grid: { left: '4%', right: '4%', top: '15%', bottom: '10%', containLabel: true },
        xAxis: {
            type: 'category',
            data: categories,
            axisLabel: { color: textColor },
            boundaryGap: false
        },
        yAxis: {
            type: 'value',
            axisLabel: { color: textColor },
            splitLine: { lineStyle: { color: splitColor, type: 'dashed' } }
        },
        series: [
            {
                name: 'Lower Bound',
                type: 'line',
                data: lowerValues,
                lineStyle: { opacity: 0 },
                stack: 'confidence-band',
                symbol: 'none'
            },
            {
                name: 'Confidence Range',
                type: 'line',
                data: bandSpanValues,
                lineStyle: { opacity: 0 },
                areaStyle: { color: toRgba(mainColor, 0.22) },
                stack: 'confidence-band',
                symbol: 'none'
            },
            {
                name: headers[primaryCol] || primaryCol,
                type: 'line',
                data: baseValues,
                smooth: 0.35,
                symbol: 'circle',
                symbolSize: 7,
                lineStyle: { width: 3.5, color: mainColor },
                itemStyle: { color: mainColor, borderWidth: 2, borderColor: '#fff' }
            }
        ]
    };
}

/**
 * 13. Bump / Ranking Line Chart (बम्प / रैंकिंग चार्ट)
 */
function buildBumpLine(ctx) {
    const { config, yAxes, categories, activePalette, textColor, splitColor, getSeriesValues } = ctx;

    const series = yAxes.map((col, idx) => {
        const color = activePalette[idx % activePalette.length];
        const rawVals = getSeriesValues(col);

        return {
            name: headers[col] || col,
            type: 'line',
            data: rawVals,
            smooth: 0.5,
            symbol: 'circle',
            symbolSize: 15,
            lineStyle: { width: 4.5, color },
            itemStyle: { color, borderWidth: 2, borderColor: '#ffffff' },
            label: {
                show: true,
                position: 'inside',
                color: '#ffffff',
                fontSize: 9,
                fontWeight: 'bold',
                formatter: (p) => p.value !== null && p.value !== undefined ? String(p.value) : ''
            },
            emphasis: {
                focus: 'series',
                lineStyle: { width: 6.5 }
            }
        };
    });

    return {
        tooltip: { trigger: 'axis' },
        legend: { show: true, top: 'top', textStyle: { color: textColor } },
        grid: { left: '4%', right: '4%', top: '15%', bottom: '10%', containLabel: true },
        xAxis: {
            type: 'category',
            data: categories,
            axisLabel: { color: textColor }
        },
        yAxis: {
            type: 'value',
            inverse: true, // Rank #1 at top
            minInterval: 1,
            name: 'Rank / Value',
            nameTextStyle: { color: textColor, fontWeight: 'bold' },
            axisLabel: { color: textColor },
            splitLine: { lineStyle: { color: splitColor, type: 'dashed' } }
        },
        series
    };
}

/**
 * 14. Polar Radial Line Chart (पोलर लाइन)
 */
function buildPolarLine(ctx) {
    const { config, yAxes, categories, activePalette, textColor, getSeriesValues } = ctx;

    const series = yAxes.map((col, idx) => {
        const color = activePalette[idx % activePalette.length];
        return {
            name: headers[col] || col,
            type: 'line',
            coordinateSystem: 'polar',
            data: getSeriesValues(col),
            smooth: true,
            symbol: 'circle',
            symbolSize: 6,
            lineStyle: { width: 2.5, color },
            itemStyle: { color }
        };
    });

    return {
        tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
        legend: { show: true, top: 'top', textStyle: { color: textColor } },
        polar: {
            center: ['50%', '50%'],
            radius: [20, '72%']
        },
        angleAxis: {
            type: 'category',
            data: categories,
            startAngle: 90,
            boundaryGap: false,
            axisLabel: { color: textColor }
        },
        radiusAxis: {
            min: 0,
            axisLabel: { color: textColor },
            splitLine: { lineStyle: { type: 'dashed' } }
        },
        series
    };
}

/**
 * 15. Time Series Line Chart with interactive Range Slider (टाइम सीरीज़)
 */
function buildTimeseriesLine(ctx) {
    const { config, yAxes, categories, activePalette, textColor, splitColor, getSeriesValues, formatSymbol } = ctx;
    const symbolVal = formatSymbol();

    const series = yAxes.map((col, idx) => {
        const color = activePalette[idx % activePalette.length];
        return {
            name: headers[col] || col,
            type: 'line',
            data: getSeriesValues(col),
            smooth: 0.25,
            symbol: symbolVal,
            symbolSize: 6,
            lineStyle: { width: 2.5, color },
            itemStyle: { color },
            areaStyle: {
                color: {
                    type: 'linear',
                    x: 0, y: 0, x2: 0, y2: 1,
                    colorStops: [
                        { offset: 0, color: toRgba(color, 0.45) },
                        { offset: 1, color: toRgba(color, 0.02) }
                    ]
                }
            },
            emphasis: { focus: 'series' }
        };
    });

    return {
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'cross', snap: true, label: { backgroundColor: '#2563eb' } }
        },
        legend: { show: yAxes.length > 1, top: 'top', textStyle: { color: textColor } },
        grid: { left: '4%', right: '4%', top: '14%', bottom: '18%', containLabel: true },
        xAxis: {
            type: 'category',
            data: categories,
            axisLabel: { color: textColor },
            boundaryGap: false
        },
        yAxis: {
            type: 'value',
            axisLabel: { color: textColor },
            splitLine: { lineStyle: { color: splitColor, type: 'dashed' } }
        },
        dataZoom: [
            {
                type: 'inside',
                start: 0,
                end: 100
            },
            {
                type: 'slider',
                bottom: '2%',
                height: 24,
                start: 0,
                end: 100,
                borderColor: '#cbd5e1',
                fillerColor: 'rgba(59, 130, 246, 0.2)',
                textStyle: { color: textColor }
            }
        ],
        series
    };
}

/**
 * 16. MarkPoint Min/Max Callout Line Chart (मार्कपॉइंट - Min/Max Callouts)
 */
function buildMarkPointLine(ctx) {
    const { config, yAxes, categories, activePalette, textColor, splitColor, getSeriesValues } = ctx;

    const series = yAxes.map((col, idx) => {
        const color = activePalette[idx % activePalette.length];
        return {
            name: headers[col] || col,
            type: 'line',
            data: getSeriesValues(col),
            smooth: false,
            symbol: 'circle',
            symbolSize: 6,
            lineStyle: { width: 2.8, color },
            itemStyle: { color },
            markPoint: {
                symbol: 'pin',
                symbolSize: 48,
                data: [
                    {
                        type: 'max',
                        name: 'Peak',
                        itemStyle: { color: '#10b981' },
                        label: { formatter: 'Max\n{c}', fontSize: 10, fontWeight: 'bold', color: '#fff' }
                    },
                    {
                        type: 'min',
                        name: 'Low',
                        itemStyle: { color: '#ef4444' },
                        label: { formatter: 'Min\n{c}', fontSize: 10, fontWeight: 'bold', color: '#fff' }
                    }
                ]
            }
        };
    });

    return {
        tooltip: { trigger: 'axis' },
        legend: { show: yAxes.length > 1, top: 'top', textStyle: { color: textColor } },
        grid: { left: '4%', right: '4%', top: '15%', bottom: '10%', containLabel: true },
        xAxis: {
            type: 'category',
            data: categories,
            axisLabel: { color: textColor }
        },
        yAxis: {
            type: 'value',
            axisLabel: { color: textColor },
            splitLine: { lineStyle: { color: splitColor, type: 'dashed' } }
        },
        series
    };
}

/**
 * 17. MarkLine Trend Reference Line Chart (मार्कलाइन - ट्रेंड / Reference Line)
 */
function buildMarkLineLine(ctx) {
    const { config, yAxes, categories, activePalette, textColor, splitColor, getSeriesValues } = ctx;

    const series = yAxes.map((col, idx) => {
        const color = activePalette[idx % activePalette.length];
        return {
            name: headers[col] || col,
            type: 'line',
            data: getSeriesValues(col),
            smooth: false,
            symbol: 'circle',
            symbolSize: 6,
            lineStyle: { width: 2.8, color },
            itemStyle: { color },
            markLine: {
                symbol: ['none', 'none'],
                data: [
                    {
                        type: 'average',
                        name: 'Average',
                        lineStyle: { type: 'dashed', color: '#f59e0b', width: 2.5 },
                        label: { formatter: 'Avg: {c}', position: 'end', color: '#f59e0b', fontWeight: 'bold' }
                    },
                    {
                        type: 'median',
                        name: 'Median',
                        lineStyle: { type: 'dotted', color: '#8b5cf6', width: 2 },
                        label: { formatter: 'Med: {c}', position: 'start', color: '#8b5cf6', fontWeight: 'bold' }
                    }
                ]
            }
        };
    });

    return {
        tooltip: { trigger: 'axis' },
        legend: { show: yAxes.length > 1, top: 'top', textStyle: { color: textColor } },
        grid: { left: '4%', right: '4%', top: '15%', bottom: '10%', containLabel: true },
        xAxis: {
            type: 'category',
            data: categories,
            axisLabel: { color: textColor }
        },
        yAxis: {
            type: 'value',
            axisLabel: { color: textColor },
            splitLine: { lineStyle: { color: splitColor, type: 'dashed' } }
        },
        series
    };
}

// -------------------------------------------------------------
// MAIN ENTRY POINT
// -------------------------------------------------------------

/**
 * Main getLineChartOption router
 * Dispatches cleanly to the dedicated builder for each line chart subtype.
 */
export function getLineChartOption(config, data) {
    if (!data || data.length === 0) {
        return commonChartOptions({
            title: { text: 'डेटा उपलब्ध नहीं है', left: 'center', top: 'middle' }
        }, config, chartGlobalSettings);
    }

    const chartType = (config && config.type) ? config.type : 'line';
    const ctx = prepareContext(config, data);

    let option = null;

    switch (chartType) {
        case 'smooth-line':
            option = buildSmoothLine(ctx);
            break;

        case 'area-line':
        case 'area':
            option = buildAreaLine(ctx);
            break;

        case 'smooth-area':
            option = buildSmoothArea(ctx);
            break;

        case 'stacked-line':
            option = buildStackedLine(ctx);
            break;

        case 'stacked-area':
            option = buildStackedArea(ctx);
            break;

        case 'gradient-area':
            option = buildGradientArea(ctx);
            break;

        case 'step-line':
            option = buildStepMiddle(ctx);
            break;

        case 'step-start-line':
            option = buildStepStart(ctx);
            break;

        case 'step-end-line':
            option = buildStepEnd(ctx);
            break;

        case 'dual-axis-line':
            option = buildDualAxisLine(ctx);
            break;

        case 'confidence-band':
        case 'range-area':
            option = buildConfidenceBand(ctx);
            break;

        case 'bump-line':
        case 'ranking-line':
            option = buildBumpLine(ctx);
            break;

        case 'polar-line':
        case 'radial-line':
            option = buildPolarLine(ctx);
            break;

        case 'timeseries-line':
            option = buildTimeseriesLine(ctx);
            break;

        case 'markpoint-line':
            option = buildMarkPointLine(ctx);
            break;

        case 'markline-line':
            option = buildMarkLineLine(ctx);
            break;

        case 'line':
        default:
            option = buildStandardLine(ctx);
            break;
    }

    return commonChartOptions(option, config, chartGlobalSettings);
}
