import { chartGlobalSettings } from '../js/charts/charts.ts';

export function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

export function commonChartOptions(option, config, passedSettings) {
    if (!option) option = {};
    if (!config) config = {};
    
    const settings = passedSettings || chartGlobalSettings;

    option.title = { 
        show: false, 
        text: config.title || 'Chart', 
        left: 'center' 
    };
    option.animationDuration = settings?.animationDuration || 1000;
    option.animation = (settings?.animationDuration || 1000) > 0;

    option.tooltip = {
        show: settings?.tooltipOnOff !== false,
        trigger: 'axis',
        ...option.tooltip
    };
    if (option.tooltip) {
        option.tooltip.show = settings?.tooltipOnOff !== false;
    }
    
    option.legend = {
        show: settings?.legendPosition !== 'none',
        bottom: settings?.legendPosition === 'bottom' ? 0 : 'auto',
        top: settings?.legendPosition === 'top' ? 20 : 'auto',
        left: settings?.legendPosition === 'left' ? '5%' : (settings?.legendPosition === 'right' ? 'auto' : 'center'),
        right: settings?.legendPosition === 'right' ? '5%' : 'auto',
        orient: (settings?.legendPosition === 'left' || settings?.legendPosition === 'right') ? 'vertical' : 'horizontal',
        ...option.legend
    };
    option.legend.show = settings?.legendPosition !== 'none';

    // 1. Color Palette Selection
    const defaultPalette = ['#5470C6', '#91CC75', '#EE6666', '#FC8452', '#73C0DE', '#3BA272', '#FACC14', '#9A60B4', '#EA7CCC'];
    const activePalette = (Array.isArray(config?.colorPalette) && config.colorPalette.length > 0)
        ? config.colorPalette
        : ((Array.isArray(settings?.colorPalette) && settings.colorPalette.length > 0)
            ? settings.colorPalette
            : (Array.isArray(chartGlobalSettings?.colorPalette) && chartGlobalSettings.colorPalette.length > 0)
                ? chartGlobalSettings.colorPalette
                : (config?.color ? [config.color, ...defaultPalette] : defaultPalette));

    option.color = activePalette;

    if (option.visualMap) {
        if (Array.isArray(option.visualMap)) {
            option.visualMap.forEach(vm => {
                if (vm && vm.inRange) vm.inRange.color = activePalette;
            });
        } else if (typeof option.visualMap === 'object') {
            if (option.visualMap.inRange) option.visualMap.inRange.color = activePalette;
        }
    }

    // 2. Font Size Level Styling
    const fontSizeMap = {
        small: { title: 11, label: 9, legend: 9, axis: 9 },
        medium: { title: 14, label: 11, legend: 11, axis: 11 },
        large: { title: 18, label: 14, legend: 14, axis: 13 }
    };
    const size = fontSizeMap[settings?.fontSize || 'medium'] || fontSizeMap.medium;

    if (option.title) {
        option.title.textStyle = {
            fontSize: size.title,
            ...option.title.textStyle
        };
    }
    if (option.legend) {
        option.legend.textStyle = {
            fontSize: size.legend,
            ...option.legend.textStyle
        };
    }

    const applyAxisLabelFontSizeAndGrid = (axis) => {
        if (!axis) return;
        const axes = Array.isArray(axis) ? axis : [axis];
        axes.forEach(a => {
            if (!a.axisLabel) a.axisLabel = {};
            a.axisLabel.fontSize = size.axis;

            // Apply grid line style (splitLine)
            a.splitLine = {
                show: settings?.gridShowHide !== false && settings?.gridStyle !== 'none',
                lineStyle: {
                    type: settings?.gridStyle || 'solid'
                }
            };
        });
    };
    applyAxisLabelFontSizeAndGrid(option.xAxis);
    applyAxisLabelFontSizeAndGrid(option.yAxis);

    // 3. Axis Formatter (compact, currency, percent)
    const getFormatter = (formatType) => {
        if (formatType === 'compact') {
            return (value) => {
                if (Math.abs(value) >= 10000000) {
                    return (value / 10000000).toFixed(1) + 'Cr';
                }
                if (Math.abs(value) >= 100000) {
                    return (value / 100000).toFixed(1) + 'L';
                }
                if (Math.abs(value) >= 1000) {
                    return (value / 1000).toFixed(1) + 'K';
                }
                return value;
            };
        } else if (formatType === 'currency') {
            return (value) => {
                return '₹' + Number(value).toLocaleString('en-IN');
            };
        } else if (formatType === 'percent') {
            return (value) => {
                return Number(value).toFixed(1) + '%';
            };
        }
        return null;
    };

    const applyFormatter = (axis) => {
        if (!axis) return;
        const axes = Array.isArray(axis) ? axis : [axis];
        axes.forEach(a => {
            if (a.type === 'value') {
                const formatter = getFormatter(settings?.axisFormat);
                if (formatter) {
                    if (!a.axisLabel) a.axisLabel = {};
                    a.axisLabel.formatter = formatter;
                } else {
                    if (a.axisLabel) {
                        delete a.axisLabel.formatter;
                    }
                }
            }
        });
    };
    applyFormatter(option.xAxis);
    applyFormatter(option.yAxis);

    // 4. Series specifics (Labels, Line style, Area fill, Bar corners, Colors)
    if (option.series) {
        const seriesArray = Array.isArray(option.series) ? option.series : [option.series];
        seriesArray.forEach((s, idx) => {
            // General Labels show/hide and font size
            if (!s.label) s.label = {};
            s.label.show = settings?.showLabels !== false;
            s.label.fontSize = size.label;

            // Dynamic color handling for different chart types
            if (s.type === 'pie' || s.type === 'funnel' || s.type === 'gauge' || s.type === 'treemap') {
                if (!s.itemStyle) s.itemStyle = {};
                s.itemStyle.color = (params) => {
                    const idxToUse = params && typeof params.dataIndex === 'number' ? params.dataIndex : 0;
                    return activePalette[idxToUse % activePalette.length];
                };
            } else if (s.type === 'bar' && seriesArray.length === 1 && s.name !== 'Placeholder') {
                // Single-series Bar chart gets dynamic multi-color bars using active palette
                if (!s.itemStyle) s.itemStyle = {};
                s.itemStyle.color = (params) => {
                    const idxToUse = params && typeof params.dataIndex === 'number' ? params.dataIndex : 0;
                    return activePalette[idxToUse % activePalette.length];
                };
            } else if (s.name !== 'Placeholder') {
                // Multi-series charts (bars, lines, scatter, etc.)
                const seriesColor = activePalette[idx % activePalette.length];
                if (!s.itemStyle) s.itemStyle = {};
                s.itemStyle.color = seriesColor;
                if (s.lineStyle) {
                    s.lineStyle.color = seriesColor;
                }
                if (s.areaStyle && typeof s.areaStyle === 'object') {
                    if (s.areaStyle.color && typeof s.areaStyle.color === 'string') {
                        s.areaStyle.color = seriesColor;
                    }
                }
            }

            // Line style and area fill: ONLY apply global override to generic 'line' charts
            // NEVER strip inherent features (smooth, step, areaStyle) from specific line chart subtypes
            const specificLineTypes = [
                'smooth-line', 'smooth-area',
                'step-line', 'step-start-line', 'step-end-line',
                'area-line', 'area', 'stacked-area', 'gradient-area',
                'stacked-line', 'confidence-band', 'range-area',
                'bump-line', 'ranking-line', 'polar-line', 'radial-line',
                'timeseries-line', 'markpoint-line', 'markline-line',
                'dual-axis-line'
            ];
            const isSpecificLineType = specificLineTypes.includes(config?.type || '');

            if (s.type === 'line' && !isSpecificLineType) {
                if (settings?.lineStyle === 'smooth') {
                    s.smooth = true;
                    s.step = false;
                } else if (settings?.lineStyle === 'step') {
                    s.step = 'middle';
                    s.smooth = false;
                } else if (settings?.lineStyle === 'normal' && s.smooth === undefined && s.step === undefined) {
                    s.smooth = false;
                    s.step = false;
                }

                if (settings?.areaFill === true) {
                    s.areaStyle = s.areaStyle || { opacity: 0.3 };
                }
            }

            // Rounded bar corners
            if (s.type === 'bar') {
                if (settings?.barRounded) {
                    s.itemStyle = {
                        ...(s.itemStyle || {}),
                        borderRadius: [5, 5, 0, 0]
                    };
                } else {
                    if (s.itemStyle && s.itemStyle.borderRadius) {
                        delete s.itemStyle.borderRadius;
                    }
                }
            }
        });
    }

    // 5. Smart Thresholds & Reference Lines / Target Highlight Zones
    const threshConfig = (config && config.threshold && config.threshold.enable) ? config.threshold : (settings && settings.threshold && settings.threshold.enable ? settings.threshold : null);
    
    if (threshConfig && threshConfig.enable && threshConfig.value !== undefined && threshConfig.value !== null && threshConfig.value !== '') {
        const threshVal = Number(threshConfig.value);
        if (!isNaN(threshVal)) {
            const markLineObj = {
                symbol: ['none', 'arrow'],
                silent: false,
                data: [
                    {
                        yAxis: threshVal,
                        name: threshConfig.label || 'Target',
                        label: {
                            show: true,
                            formatter: (threshConfig.label || 'Target') + ': {c}',
                            position: 'end',
                            color: threshConfig.color || '#ef4444',
                            fontSize: 11,
                            fontWeight: 'bold'
                        },
                        lineStyle: {
                            color: threshConfig.color || '#ef4444',
                            type: threshConfig.style || 'dashed',
                            width: 2
                        }
                    }
                ]
            };

            if (option.series) {
                const seriesList = Array.isArray(option.series) ? option.series : [option.series];
                if (seriesList.length > 0) {
                    seriesList[0].markLine = markLineObj;
                }
            }
        }
    }

    const zoneConfig = (config && config.threshold && config.threshold.enableZone) ? config.threshold : (settings && settings.threshold && settings.threshold.enableZone ? settings.threshold : null);

    if (zoneConfig && zoneConfig.enableZone && zoneConfig.zoneMin !== undefined && zoneConfig.zoneMax !== undefined && zoneConfig.zoneMin !== '' && zoneConfig.zoneMax !== '') {
        const minVal = Number(zoneConfig.zoneMin);
        const maxVal = Number(zoneConfig.zoneMax);
        if (!isNaN(minVal) && !isNaN(maxVal)) {
            const markAreaObj = {
                silent: true,
                data: [
                    [
                        {
                            name: zoneConfig.zoneLabel || 'Target Zone',
                            yAxis: minVal,
                            itemStyle: {
                                color: zoneConfig.zoneColor || 'rgba(239, 68, 68, 0.18)'
                            },
                            label: {
                                show: true,
                                position: 'insideTopLeft',
                                color: '#475569',
                                fontSize: 10,
                                fontWeight: 'bold'
                            }
                        },
                        {
                            yAxis: maxVal
                        }
                    ]
                ]
            };

            if (option.series) {
                const seriesList = Array.isArray(option.series) ? option.series : [option.series];
                if (seriesList.length > 0) {
                    seriesList[0].markArea = markAreaObj;
                }
            }
        }
    }

    // 6. Smart ECharts Toolbox
    if (settings?.showToolbox) {
        option.toolbox = {
            show: true,
            feature: {
                dataView: { readOnly: false, title: 'डेटा देखें', lang: ['डेटा देखें', 'बंद करें', 'अपडेट करें'] },
                magicType: { type: ['line', 'bar', 'stack'], title: { line: 'लाइन', bar: 'बार', stack: 'स्टैक' } },
                restore: { title: 'रीसेट करें' },
                saveAsImage: { title: 'इमेज सेव करें' }
            },
            right: '5%',
            top: '0%'
        };
    } else {
        delete option.toolbox;
    }

    // 6. DataZoom support
    if (settings?.zoomEnable) {
        option.dataZoom = [
            {
                type: 'inside',
                start: 0,
                end: 100
            },
            {
                show: true,
                type: 'slider',
                bottom: 10,
                start: 0,
                end: 100
            }
        ];
        if (!option.grid) option.grid = {};
        option.grid.bottom = settings?.legendPosition === 'bottom' ? 70 : 50;
    } else {
        delete option.dataZoom;
    }

    return option;
}


// uility.js mein ye functions add karo
export const getThemeColor = () => {
    return document.body.classList.contains('dark-theme') ? '#f8f9fa' : '#333';
};

export const getSampledData = (data, maxPoints = 100) => {
    if (data.length <= maxPoints) return data;
    const step = Math.ceil(data.length / maxPoints);
    return data.filter((_, i) => i % step === 0);
};

export const getAxisConfig = (isCategory, show, label, data, themeColor) => {
    return {
        show,
        type: isCategory ? 'category' : 'value',
        name: label,
        data: isCategory ? data : null,
        axisLabel: { color: themeColor }
    };
};