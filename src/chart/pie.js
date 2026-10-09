import { headers } from '../store/DataHandler.ts';
import { chartGlobalSettings } from '../js/charts/charts.ts';
import { commonChartOptions, getRandomColor } from './uility.js';

export function getPieChartOption(config, data) {
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
    }

    const isDark = document.body.classList.contains('dark-theme');
    const textColor = isDark ? '#f8f9fa' : '#333';
    const borderColor = isDark ? '#1e293b' : '#ffffff';

    const defaultPalette = ['#5470C6', '#91CC75', '#EE6666', '#FC8452', '#73C0DE', '#3BA272', '#FACC14', '#9A60B4', '#EA7CCC'];
    const palette = (Array.isArray(chartGlobalSettings?.colorPalette) && chartGlobalSettings.colorPalette.length > 0)
        ? chartGlobalSettings.colorPalette
        : defaultPalette;

    const labelCol = config.columns[0];
    const valueCol = config.columns[1] !== undefined ? config.columns[1] : config.columns[0];

    const isDoughnut = config.type === 'doughnut';
    const isRoseRadius = config.type === 'rose-radius';
    const isRoseArea = config.type === 'rose-area' || (config.type && config.type.startsWith('rose') && !isRoseRadius);

    const seriesData = sampledData.map(row => ({
        name: String((row && row[labelCol] !== undefined) ? row[labelCol] : 'Unknown'),
        value: isNaN(parseFloat(row && row[valueCol])) ? 0 : parseFloat(row[valueCol])
    }));

    let radiusConfig = '65%';
    let roseTypeConfig = undefined;
    let borderRadiusVal = 4;

    if (isDoughnut) {
        radiusConfig = ['45%', '72%'];
        borderRadiusVal = 6;
    } else if (isRoseRadius) {
        radiusConfig = [25, '75%'];
        roseTypeConfig = 'radius';
        borderRadiusVal = 6;
    } else if (isRoseArea) {
        radiusConfig = [25, '75%'];
        roseTypeConfig = 'area';
        borderRadiusVal = 6;
    }

    const option = {
        title: {
            text: config.title || 'Pie Chart',
            left: 'center',
            show: false
        },
        tooltip: {
            trigger: 'item',
            formatter: '{a} <br/><b>{b}</b>: {c} ({d}%)'
        },
        legend: {
            type: 'scroll',
            orient: 'horizontal',
            bottom: 5,
            show: chartGlobalSettings.legendPosition !== 'none',
            textStyle: { color: textColor }
        },
        series: [{
            name: headers[valueCol] || valueCol || 'Value',
            type: 'pie',
            radius: radiusConfig,
            roseType: roseTypeConfig,
            center: ['50%', '48%'],
            data: seriesData,
            itemStyle: {
                borderRadius: borderRadiusVal,
                borderColor: borderColor,
                borderWidth: 2,
                color: params => palette[params.dataIndex % palette.length]
            },
            label: {
                show: chartGlobalSettings.showLabels !== false,
                formatter: '{b}: {d}%',
                color: textColor,
                fontSize: 11
            },
            labelLine: {
                smooth: true,
                length: 10,
                length2: 12
            },
            emphasis: {
                itemStyle: {
                    shadowBlur: 10,
                    shadowOffsetX: 0,
                    shadowColor: 'rgba(0, 0, 0, 0.4)'
                }
            }
        }]
    };

    return commonChartOptions(option, config);
}
