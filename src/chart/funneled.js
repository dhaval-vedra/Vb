import { headers } from '../store/DataHandler.ts';
import { chartGlobalSettings } from '../js/charts/charts.ts';
import { commonChartOptions, getRandomColor } from './uility.js';
export function getFunnelChartOption(config, data) {
    if (!config || !config.columns || !Array.isArray(data)) {
        return commonChartOptions({}, config || {});
    }
    const cleanData = data.filter(row => row !== null && row !== undefined);
    const sampledData = cleanData.length > 500 ? cleanData.filter((_, i) => i % 10 === 0) : cleanData;
    const labelCol = config.columns[0];
    const valueCol = config.columns[1];
    const seriesData = sampledData.map(row => ({
        name: String((row && row[labelCol]) || 'Unknown'),
        value: isNaN(parseFloat(row && row[valueCol])) ? 0 : parseFloat(row[valueCol])
    }));
    const option = {
        tooltip: { trigger: 'item' },
        series: [{
            name: headers[valueCol] || valueCol,
            type: 'funnel',
            data: seriesData.sort((a, b) => b.value - a.value),
            itemStyle: { color: params => chartGlobalSettings.colorPalette[params.dataIndex % chartGlobalSettings.colorPalette.length] },
            label: { show: true, position: 'inside', formatter: '{b}:{c}' }
        }]
    };
    return commonChartOptions(option, config);
}