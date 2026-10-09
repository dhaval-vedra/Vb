import { headers } from '../store/DataHandler.ts';
import { chartGlobalSettings } from '../js/charts/charts.ts';
import { commonChartOptions, getRandomColor } from './uility.js';

export function getGaugeChartOption(config, data) {
    if (!config || !config.columns || !Array.isArray(data)) {
        return commonChartOptions({}, config || {});
    }
    const cleanData = data.filter(row => row !== null && row !== undefined);
    if (!cleanData.length) {
        return commonChartOptions({}, config || {});
    }

    const isDark = document.body.classList.contains('dark-theme');
    const textColor = isDark ? '#f8f9fa' : '#333';

    const nameCol = config.columns[0];
    const valueCol = config.columns[1] !== undefined ? config.columns[1] : config.columns[0];

    // Compute metric value
    let value = 0;
    let name = 'Gauge';

    if (cleanData.length === 1) {
        const firstRow = cleanData[0] || {};
        value = parseFloat(firstRow[valueCol]) || 0;
        name = String(firstRow[nameCol] || headers[valueCol] || config.title || 'Gauge');
    } else {
        // Multiple rows: compute average or sum
        const numericVals = cleanData.map(r => parseFloat(r[valueCol])).filter(v => !isNaN(v));
        if (numericVals.length > 0) {
            const sum = numericVals.reduce((a, b) => a + b, 0);
            value = Math.round((sum / numericVals.length) * 100) / 100;
        }
        name = config.title || `${headers[valueCol] || valueCol} (Avg)`;
    }

    const maxVal = Math.max(100, Math.ceil(value * 1.3));

    const option = {
        title: {
            text: config.title || 'Gauge Chart',
            left: 'center',
            show: false
        },
        tooltip: {
            trigger: 'item',
            formatter: '{a} <br/>{b} : {c}'
        },
        series: [{
            name: name,
            type: 'gauge',
            center: ['50%', '55%'],
            radius: '85%',
            startAngle: 200,
            endAngle: -20,
            min: 0,
            max: maxVal,
            splitNumber: 5,
            itemStyle: {
                color: '#3b82f6'
            },
            progress: {
                show: true,
                width: 18,
                roundCap: true
            },
            pointer: {
                show: true,
                length: '60%',
                width: 6,
                itemStyle: {
                    color: 'auto'
                }
            },
            axisLine: {
                roundCap: true,
                lineStyle: {
                    width: 18,
                    color: [
                        [0.3, '#10b981'],
                        [0.7, '#f59e0b'],
                        [1, '#ef4444']
                    ]
                }
            },
            axisTick: {
                distance: -26,
                splitNumber: 5,
                lineStyle: {
                    width: 1,
                    color: isDark ? 'rgba(255,255,255,0.4)' : '#999'
                }
            },
            splitLine: {
                distance: -30,
                length: 12,
                lineStyle: {
                    width: 2,
                    color: isDark ? 'rgba(255,255,255,0.6)' : '#666'
                }
            },
            axisLabel: {
                distance: -18,
                color: textColor,
                fontSize: 10
            },
            anchor: {
                show: true,
                showAbove: true,
                size: 16,
                itemStyle: {
                    borderWidth: 6,
                    borderColor: '#3b82f6'
                }
            },
            title: {
                show: true,
                offsetCenter: [0, '75%'],
                fontSize: 13,
                color: textColor
            },
            detail: {
                valueAnimation: true,
                fontSize: 26,
                fontWeight: 'bold',
                offsetCenter: [0, '40%'],
                formatter: '{value}',
                color: 'inherit'
            },
            data: [{
                value: value,
                name: name
            }]
        }]
    };

    return commonChartOptions(option, config);
}
