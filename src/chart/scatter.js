import { headers } from '../store/DataHandler.ts';
import { chartGlobalSettings } from '../js/charts/charts.ts';
import { commonChartOptions, getRandomColor } from './uility.js';
import { lttbDownsample } from '../js/data/lttbDownsample.ts';

export function getScatterChartOption(config, data) {
    if (!config || !config.columns || !Array.isArray(data)) {
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
    } else if (cleanData.length > 1000) {
        sampledData = lttbDownsample(cleanData);
    }

    const isDark = document.body.classList.contains('dark-theme');
    const textColor = isDark ? '#f8f9fa' : '#333';
    const gridLineColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)';

    const xAxisColumn = config.columns[0];
    const yAxisColumn = config.columns[1] !== undefined ? config.columns[1] : config.columns[0];
    const sizeColumn = config.columns[2];

    const isBubble = config.type === 'bubble';

    // Determine if X is numeric or category
    const isXNumeric = sampledData.length > 0 && sampledData.slice(0, 20).every(row => {
        if (!row || row[xAxisColumn] === null || row[xAxisColumn] === undefined || row[xAxisColumn] === '') return true;
        return !isNaN(Number(row[xAxisColumn]));
    });

    const categories = isXNumeric ? [] : sampledData.map(r => String(r[xAxisColumn] || ''));

    // Gather raw size values for min-max scaling if bubble chart
    let minSize = Infinity;
    let maxSize = -Infinity;
    if (isBubble && sizeColumn) {
        sampledData.forEach(row => {
            if (row && row[sizeColumn] !== undefined) {
                const s = parseFloat(row[sizeColumn]);
                if (!isNaN(s)) {
                    if (s < minSize) minSize = s;
                    if (s > maxSize) maxSize = s;
                }
            }
        });
    }
    if (minSize === Infinity) minSize = 0;
    if (maxSize === -Infinity || maxSize === minSize) maxSize = minSize + 10;

    const seriesData = sampledData.map((row, idx) => {
        if (!row) return null;
        const xVal = isXNumeric ? (parseFloat(row[xAxisColumn]) || 0) : idx;
        const yVal = parseFloat(row[yAxisColumn]);
        if (isNaN(yVal)) return null;

        let rawSize = 10;
        let scaledSize = 12;

        if (isBubble && sizeColumn) {
            rawSize = parseFloat(row[sizeColumn]);
            if (isNaN(rawSize)) rawSize = minSize;
            // Normalize between 8px and 44px
            scaledSize = 8 + ((rawSize - minSize) / (maxSize - minSize)) * 36;
        } else if (isBubble) {
            scaledSize = 16;
        }

        const label = String(row[xAxisColumn] || `Point ${idx + 1}`);
        // Point format: [x, y, scaledSize, label, rawSize]
        return [xVal, yVal, scaledSize, label, rawSize];
    }).filter(d => d !== null);

    const xName = config.xAxisLabel || headers[xAxisColumn] || xAxisColumn;
    const yName = config.yAxisLabel || headers[yAxisColumn] || yAxisColumn;

    const defaultPalette = ['#5470C6', '#91CC75', '#EE6666', '#FC8452', '#73C0DE', '#3BA272', '#FACC14', '#9A60B4', '#EA7CCC'];
    const activeColor = config.color || (chartGlobalSettings?.colorPalette?.[0]) || defaultPalette[0];

    const option = {
        title: {
            text: config.title || (isBubble ? 'Bubble Chart' : 'Scatter Plot'),
            left: 'center',
            show: false
        },
        tooltip: {
            trigger: 'item',
            formatter: function (params) {
                if (!params || !params.value) return '';
                const val = params.value;
                const ptLabel = val[3] || '';
                const xDisplay = isXNumeric ? val[0] : (categories[val[0]] || val[0]);
                const yDisplay = val[1];
                let html = `<b>${ptLabel}</b><br/>${xName}: ${xDisplay}<br/>${yName}: ${yDisplay}`;
                if (isBubble && sizeColumn) {
                    html += `<br/>${headers[sizeColumn] || sizeColumn}: ${val[4]}`;
                }
                return html;
            }
        },
        grid: {
            left: '5%',
            right: '5%',
            bottom: '12%',
            top: '12%',
            containLabel: true
        },
        xAxis: {
            show: chartGlobalSettings.gridShowHide !== false,
            type: isXNumeric ? 'value' : 'category',
            data: isXNumeric ? undefined : categories,
            name: xName,
            axisLabel: {
                color: textColor,
                rotate: (!isXNumeric && categories.length > 12) ? 30 : 0
            },
            splitLine: {
                show: chartGlobalSettings.gridShowHide !== false,
                lineStyle: { color: gridLineColor, type: 'dashed' }
            }
        },
        yAxis: {
            show: chartGlobalSettings.gridShowHide !== false,
            type: 'value',
            name: yName,
            axisLabel: { color: textColor },
            splitLine: {
                show: chartGlobalSettings.gridShowHide !== false,
                lineStyle: { color: gridLineColor, type: 'dashed' }
            }
        },
        series: [{
            name: headers[yAxisColumn] || yAxisColumn || (isBubble ? 'Bubble' : 'Scatter'),
            type: 'scatter',
            data: seriesData,
            symbolSize: function (dataItem) {
                return dataItem && dataItem[2] ? dataItem[2] : (isBubble ? 14 : 9);
            },
            itemStyle: {
                color: activeColor,
                opacity: isBubble ? 0.7 : 0.85,
                borderColor: activeColor,
                borderWidth: isBubble ? 1 : 0
            },
            emphasis: {
                focus: 'self',
                itemStyle: {
                    opacity: 1,
                    shadowBlur: 10,
                    shadowColor: 'rgba(0,0,0,0.3)'
                }
            }
        }]
    };

    return commonChartOptions(option, config);
}
