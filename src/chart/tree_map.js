import { headers } from '../store/DataHandler.ts';
import { chartGlobalSettings } from '../js/charts/charts.ts';
import { commonChartOptions, getRandomColor } from './uility.js';

export function getTreemapChartOption(config, data) {
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

    const xAxisColumn = config.columns[0];
    const valueCol = config.columns[1] !== undefined ? config.columns[1] : config.columns[0];

    const defaultPalette = ['#5470C6', '#91CC75', '#EE6666', '#FC8452', '#73C0DE', '#3BA272', '#FACC14', '#9A60B4', '#EA7CCC'];
    const palette = (Array.isArray(chartGlobalSettings?.colorPalette) && chartGlobalSettings.colorPalette.length > 0)
        ? chartGlobalSettings.colorPalette
        : defaultPalette;

    const treeData = sampledData.map((row, idx) => {
        const val = parseFloat(row && row[valueCol]);
        return {
            name: String((row && row[xAxisColumn] !== undefined) ? row[xAxisColumn] : `Item ${idx + 1}`),
            value: isNaN(val) ? 0 : val,
            itemStyle: {
                color: palette[idx % palette.length]
            }
        };
    }).filter(item => item.value > 0);

    const option = {
        title: {
            text: config.title || 'Treemap',
            left: 'center',
            show: false
        },
        tooltip: {
            trigger: 'item',
            formatter: '{b}: <b>{c}</b>'
        },
        series: [{
            name: headers[valueCol] || valueCol || 'Treemap',
            type: 'treemap',
            data: treeData,
            leafDepth: 1,
            roam: false,
            nodeClick: false,
            label: {
                show: true,
                formatter: '{b}\n{c}',
                color: '#fff',
                fontSize: 11
            },
            upperLabel: {
                show: false
            },
            itemStyle: {
                borderColor: isDark ? '#1e293b' : '#fff',
                borderWidth: 2,
                gapWidth: 2
            },
            breadcrumb: {
                show: false
            }
        }]
    };

    return commonChartOptions(option, config);
}
