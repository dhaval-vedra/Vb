import { headers } from '../store/DataHandler.ts';
import { chartGlobalSettings } from '../js/charts/charts.ts';
import { commonChartOptions, getRandomColor } from './uility.js';

export function getLine3DChartOption(config, data, userSettings = {}) {
        if (!config || !config.columns || !Array.isArray(data)) {
                return commonChartOptions({}, config || {});
        }
        const cleanData = data.filter(row => row !== null && row !== undefined);
        const xAxisColumn = config.columns[0];
        const yAxisColumns = config.columns.slice(1); // multiple Y-columns
        
        if (!yAxisColumns.length) {
                return {};
        }

        const xCategories = cleanData.map(row => row && row[xAxisColumn] !== undefined ? String(row[xAxisColumn]) : '');
        const isDark = document.body.classList.contains('dark-theme');
        const themeTextColor = isDark ? '#f8f9fa' : '#333';
        const defaultPalette = ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452'];
        const palette = (chartGlobalSettings && Array.isArray(chartGlobalSettings.colorPalette)) ? chartGlobalSettings.colorPalette : defaultPalette;

        // User-configurable settings with defaults
        const settings = {
                lineWidth: userSettings.lineWidth || 4,
                lineOpacity: userSettings.lineOpacity || 0.9,
                autoRotate: userSettings.autoRotate !== undefined ? userSettings.autoRotate : true,
                rotateSpeed: userSettings.rotateSpeed || 1.5,
                zoomSensitivity: userSettings.zoomSensitivity || 1.2,
                panSensitivity: userSettings.panSensitivity || 0.8,
                labelFontSize: userSettings.labelFontSize || 12,
                showLabels: userSettings.showLabels !== undefined ? userSettings.showLabels : chartGlobalSettings.showLabels
        };
        
        // Series format: [X category index, Y column index, Z value]
        const series = yAxisColumns.map((yCol, colIndex) => {
                const seriesData = cleanData.map((row, idx) => {
                        if (!row) return [idx, colIndex, 0];
                        const zVal = parseFloat(row[yCol]);
                        return [idx, colIndex, isNaN(zVal) ? 0 : zVal];
                });
                
                return {
                        name: headers[yCol] || yCol,
                        type: 'line3D',
                        data: seriesData,
                        lineStyle: {
                                width: settings.lineWidth,
                                color: palette[colIndex % palette.length],
                                opacity: settings.lineOpacity
                        },
                        label: {
                                show: settings.showLabels,
                                formatter: params => `${params && params.value ? params.value[2] : ''}`,
                                textStyle: { fontSize: settings.labelFontSize, color: themeTextColor }
                        },
                        emphasis: {
                                label: { show: true },
                                lineStyle: { width: settings.lineWidth + 2 }
                        }
                };
        });

        const allValues = [];
        yAxisColumns.forEach(yCol => {
                cleanData.forEach(row => {
                        const v = parseFloat(row[yCol]);
                        if (!isNaN(v)) allValues.push(v);
                });
        });
        const maxVal = allValues.length ? Math.max(...allValues) : 100;
        
        const option = {
                tooltip: {
                        show: chartGlobalSettings.tooltipOnOff,
                        formatter: params => {
                                const param = Array.isArray(params) ? params[0] : params;
                                if (!param || !param.value) return '';
                                const [xIdx, yIdx, zVal] = param.value;
                                const xLabel = xCategories[xIdx] !== undefined ? xCategories[xIdx] : xIdx;
                                const yLabel = yAxisColumns[yIdx] || param.seriesName;
                                return `<b>${yLabel}</b><br>${config.xAxisLabel || xAxisColumn}: ${xLabel}<br>मान: ${zVal}`;
                        }
                },
                visualMap: {
                        max: maxVal,
                        dimension: 2,
                        inRange: { color: palette }
                },
                xAxis3D: {
                        name: config.xAxisLabel || xAxisColumn,
                        type: 'category',
                        data: xCategories,
                        axisLabel: { color: themeTextColor, rotate: 30 }
                },
                yAxis3D: {
                        name: 'श्रेणी / Y',
                        type: 'category',
                        data: yAxisColumns.map(c => headers[c] || c),
                        axisLabel: { color: themeTextColor, rotate: 30 }
                },
                zAxis3D: {
                        name: config.yAxisLabel || 'Value',
                        type: 'value',
                        axisLabel: { color: themeTextColor }
                },
                grid3D: {
                        boxWidth: 260,
                        boxDepth: 120,
                        boxHeight: 120,
                        viewControl: {
                                autoRotate: settings.autoRotate,
                                autoRotateAfterStill: 5,
                                rotateSensitivity: settings.rotateSpeed,
                                zoomSensitivity: settings.zoomSensitivity,
                                panSensitivity: settings.panSensitivity,
                                damping: 0.9,
                                minDistance: 100,
                                maxDistance: 600
                        },
                        light: { main: { shadow: true, intensity: 1.3, alpha: 30 }, ambient: { intensity: 0.5 } }
                },
                series: series
        };
        
        return commonChartOptions(option, config);
}