import { headers } from '../store/DataHandler.ts';
import { chartGlobalSettings } from '../js/charts/charts.ts';
import { commonChartOptions, getRandomColor } from './uility.js';

export function getRadarChartOption(config, data) {
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
    } else if (cleanData.length > 500) {
        sampledData = cleanData.filter((_, i) => i % 10 === 0);
    }

    const isDark = document.body.classList.contains('dark-theme');
    const textColor = isDark ? '#f8f9fa' : '#333';
    const defaultPalette = ['#5470C6', '#91CC75', '#EE6666', '#FC8452', '#73C0DE', '#3BA272', '#FACC14', '#9A60B4', '#EA7CCC'];
    const palette = (Array.isArray(chartGlobalSettings?.colorPalette) && chartGlobalSettings.colorPalette.length > 0)
        ? chartGlobalSettings.colorPalette
        : defaultPalette;

    const xAxisColumn = config.columns[0];
    const yAxisColumns = config.columns.slice(1);

    let indicators = [];
    let radarSeriesData = [];
    let legendNames = [];

    // Case 1: Multiple Y-columns (e.g., Indicators = Columns, Rows = Items/Series)
    if (yAxisColumns.length > 1) {
        indicators = yAxisColumns.map(col => {
            const maxVal = Math.max(0, ...sampledData.map(row => (row ? parseFloat(row[col]) : 0) || 0));
            return {
                name: headers[col] || col,
                max: maxVal > 0 ? Math.ceil(maxVal * 1.15) : 100
            };
        });

        // Up to top 6 rows as distinct radar polygons
        const rowsToDisplay = sampledData.slice(0, 6);
        radarSeriesData = rowsToDisplay.map((row, idx) => {
            const rowName = String((row && row[xAxisColumn] !== undefined) ? row[xAxisColumn] : `Series ${idx + 1}`);
            legendNames.push(rowName);
            const color = palette[idx % palette.length];
            return {
                name: rowName,
                value: yAxisColumns.map(col => (row && row[col] !== undefined ? parseFloat(row[col]) : 0) || 0),
                itemStyle: { color },
                areaStyle: { opacity: 0.25, color }
            };
        });
    } else if (yAxisColumns.length === 1 && sampledData.length >= 3) {
        // Case 2: 1 Y-column, multiple rows -> Categories form the radar dimensions
        const valCol = yAxisColumns[0];
        const maxVal = Math.max(0, ...sampledData.map(row => (row ? parseFloat(row[valCol]) : 0) || 0));
        indicators = sampledData.slice(0, 12).map(row => ({
            name: String((row && row[xAxisColumn] !== undefined) ? row[xAxisColumn] : ''),
            max: maxVal > 0 ? Math.ceil(maxVal * 1.15) : 100
        }));

        const primaryName = headers[valCol] || valCol;
        legendNames.push(primaryName);
        const color = palette[0];
        radarSeriesData = [{
            name: primaryName,
            value: sampledData.slice(0, 12).map(row => (row ? parseFloat(row[valCol]) : 0) || 0),
            itemStyle: { color },
            areaStyle: { opacity: 0.3, color }
        }];
    } else {
        // Fallback
        const valCol = yAxisColumns[0] || xAxisColumn;
        indicators = [{ name: headers[valCol] || valCol, max: 100 }];
        radarSeriesData = [{
            name: 'Value',
            value: [100],
            itemStyle: { color: palette[0] },
            areaStyle: { opacity: 0.3 }
        }];
    }

    const option = {
        title: {
            text: config.title || 'Radar Chart',
            left: 'center',
            show: false
        },
        tooltip: {
            trigger: 'item'
        },
        legend: {
            show: chartGlobalSettings.legendPosition !== 'none',
            data: legendNames,
            textStyle: { color: textColor }
        },
        radar: {
            indicator: indicators,
            shape: 'polygon',
            splitNumber: 4,
            axisName: {
                color: textColor,
                fontSize: 11
            },
            splitLine: {
                lineStyle: {
                    color: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)'
                }
            },
            splitArea: {
                show: true,
                areaStyle: {
                    color: isDark 
                        ? ['rgba(255, 255, 255, 0.02)', 'rgba(255, 255, 255, 0.05)']
                        : ['rgba(0, 0, 0, 0.02)', 'rgba(0, 0, 0, 0.04)']
                }
            },
            axisLine: {
                lineStyle: {
                    color: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)'
                }
            }
        },
        series: [{
            name: config.title || 'Radar',
            type: 'radar',
            data: radarSeriesData
        }]
    };

    return commonChartOptions(option, config);
}
