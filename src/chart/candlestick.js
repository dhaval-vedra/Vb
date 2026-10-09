import { headers } from '../store/DataHandler.ts';
import { chartGlobalSettings } from '../js/charts/charts.ts';
import { commonChartOptions } from './uility.js';
import { lttbDownsample } from '../js/data/lttbDownsample.ts';

/**
 * Apache ECharts Candlestick & OHLC Chart Option Generator
 * Formats data in ECharts format: [open, close, lowest, highest]
 */
export function getCandlestickChartOption(config, data) {
    if (!config || !config.columns || config.columns.length < 2 || !Array.isArray(data)) {
        return commonChartOptions({}, config || {});
    }

    const cleanData = data.filter(row => row !== null && row !== undefined);
    if (!cleanData.length) {
        return commonChartOptions({}, config || {});
    }

    let sampledData = cleanData;
    if (config && config.dataRowLimit && config.dataRowLimit !== 'all') {
        const limit = typeof config.dataRowLimit === 'number' ? config.dataRowLimit : parseInt(config.dataRowLimit, 10);
        if (!isNaN(limit) && limit > 0) {
            sampledData = cleanData.slice(0, limit);
        }
    }

    const isDark = document.body.classList.contains('dark-theme');
    const textColor = isDark ? '#f8f9fa' : '#333';
    const gridLineColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)';

    const dateCol = config.columns[0];
    const openCol = config.columns[1];
    const highCol = config.columns[2] || config.columns[1];
    const lowCol = config.columns[3] || config.columns[1];
    const closeCol = config.columns[4] || config.columns[1];

    const dates = sampledData.map((row, idx) => (row && row[dateCol] !== undefined ? String(row[dateCol]) : `Period ${idx + 1}`));

    // ECharts candlestick expects [open, close, lowest, highest]
    const values = sampledData.map(row => {
        if (!row) return [0, 0, 0, 0];
        const open = parseFloat(row[openCol]) || 0;
        const high = parseFloat(row[highCol]) || open;
        const low = parseFloat(row[lowCol]) || open;
        const close = parseFloat(row[closeCol]) || open;
        return [open, close, low, high];
    });

    const isOhlc = config.type === 'ohlc';

    const option = {
        title: {
            text: config.title || (isOhlc ? 'OHLC Chart' : 'Candlestick Chart'),
            left: 'center',
            show: false
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'cross',
                lineStyle: {
                    color: isDark ? '#94a3b8' : '#64748b',
                    type: 'dashed'
                }
            },
            formatter: function (params) {
                if (!params || !params.length) return '';
                const param = params[0];
                const d = param.data;
                if (!d || !Array.isArray(d)) return '';
                // In ECharts candlestick, d is [open, close, low, high] (or [idx, open, close, low, high] in some callbacks)
                const vals = d.length === 5 ? [d[1], d[2], d[3], d[4]] : [d[0], d[1], d[2], d[3]];
                const open = Number(vals[0]);
                const close = Number(vals[1]);
                const low = Number(vals[2]);
                const high = Number(vals[3]);
                const change = close - open;
                const changePercent = open !== 0 ? ((change / open) * 100).toFixed(2) : '0.00';
                const changeColor = change >= 0 ? '#10b981' : '#ef4444';
                const sign = change >= 0 ? '+' : '';

                return `
                    <div style="font-family: inherit; font-size: 12px; line-height: 1.6;">
                        <div style="font-weight: 600; margin-bottom: 4px; border-bottom: 1px solid rgba(150,150,150,0.2); padding-bottom: 2px;">
                            ${param.name || ''}
                        </div>
                        <div style="display: flex; justify-content: space-between; gap: 16px;">
                            <span>Open:</span><b>${open.toFixed(2)}</b>
                        </div>
                        <div style="display: flex; justify-content: space-between; gap: 16px;">
                            <span>High:</span><b>${high.toFixed(2)}</b>
                        </div>
                        <div style="display: flex; justify-content: space-between; gap: 16px;">
                            <span>Low:</span><b>${low.toFixed(2)}</b>
                        </div>
                        <div style="display: flex; justify-content: space-between; gap: 16px;">
                            <span>Close:</span><b>${close.toFixed(2)}</b>
                        </div>
                        <div style="margin-top: 4px; border-top: 1px solid rgba(150,150,150,0.2); padding-top: 2px; color: ${changeColor}; font-weight: bold;">
                            Change: ${sign}${change.toFixed(2)} (${sign}${changePercent}%)
                        </div>
                    </div>
                `;
            }
        },
        legend: {
            show: true,
            top: 'top',
            textStyle: { color: textColor }
        },
        grid: {
            left: '5%',
            right: '5%',
            bottom: '18%',
            top: '12%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: dates,
            scale: true,
            boundaryGap: true,
            axisLine: { onZero: false, lineStyle: { color: textColor } },
            splitLine: { show: false },
            min: 'dataMin',
            max: 'dataMax',
            axisLabel: {
                color: textColor,
                rotate: dates.length > 15 ? 30 : 0
            }
        },
        yAxis: {
            scale: true,
            splitArea: { show: true },
            axisLabel: { color: textColor },
            splitLine: {
                show: chartGlobalSettings.gridShowHide !== false,
                lineStyle: { color: gridLineColor }
            }
        },
        dataZoom: [
            {
                type: 'inside',
                start: 0,
                end: 100
            },
            {
                show: true,
                type: 'slider',
                bottom: '2%',
                start: 0,
                end: 100,
                textStyle: { color: textColor }
            }
        ],
        series: [
            {
                name: config.title || (isOhlc ? 'OHLC' : 'Candlestick'),
                type: 'candlestick',
                data: values,
                barWidth: isOhlc ? 4 : undefined,
                itemStyle: {
                    color: '#10b981', // bullish up candle body
                    color0: '#ef4444', // bearish down candle body
                    borderColor: '#10b981', // bullish up candle border/wick
                    borderColor0: '#ef4444' // bearish down candle border/wick
                },
                emphasis: {
                    itemStyle: {
                        borderWidth: 2
                    }
                }
            }
        ]
    };

    return commonChartOptions(option, config, chartGlobalSettings);
}
