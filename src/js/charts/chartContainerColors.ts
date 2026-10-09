// js/chartContainerColors.ts

declare const bootstrap: any;
declare const echarts: any;

export interface ContainerColorTemplate {
    id: string;
    name: string;
    style?: Record<string, any>;
    chartBackgroundColor?: any;
}

export const staticTemplates: ContainerColorTemplate[] = [
    {
        id: "default-container-color",
        name: "डिफ़ॉल्ट",
        style: {
            backgroundColor: "#f8f9fa",
            color: "#212529",
            border: "1px solid #dee2e6"
        },
        chartBackgroundColor: "#ffffff"
    },
    {
        id: "blue-container-color",
        name: "आकाश नीला",
        style: {
            backgroundColor: "#e0f2f7",
            color: "#0c5460",
            border: "1px solid #a7d9ed"
        },
        chartBackgroundColor: "#f0faff"
    },
    {
        id: "green-container-color",
        name: "पुदीना हरा",
        style: {
            backgroundColor: "#d4edda",
            color: "#155724",
            border: "1px solid #a3e2b1"
        },
        chartBackgroundColor: "#f0fff0"
    },
    {
        id: "warm-container-color",
        name: "गर्म",
        style: {
            backgroundColor: "#fff3cd",
            color: "#664d03",
            border: "1px solid #ffeeba"
        },
        chartBackgroundColor: "#fffaf0"
    },
    {
        id: "dark-container-color",
        name: "गहरा",
        style: {
            backgroundColor: "#343a40",
            color: "#f8f9fa",
            border: "1px solid #495057"
        },
        chartBackgroundColor: "#212529"
    },
    {
        id: "sunset-orange",
        name: "सूरजमुखी नारंगी",
        style: {
            background: "linear-gradient(45deg, #ffb347, #ffcc33)",
            color: "#5a2d00",
            border: "1px solid #ffaa33"
        },
        chartBackgroundColor: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 1,
            y2: 0,
            colorStops: [
                { offset: 0, color: "#ffb347" },
                { offset: 1, color: "#ffcc33" }
            ]
        }
    },
    {
        id: "ocean-gradient",
        name: "समुद्र धारा",
        style: {
            background: "linear-gradient(45deg, #00c6ff, #0072ff)",
            color: "#ffffff",
            border: "1px solid #3399ff"
        },
        chartBackgroundColor: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
                { offset: 0, color: "#00c6ff" },
                { offset: 1, color: "#0072ff" }
            ]
        }
    },
    {
        id: "junglefire",
        name: "जंगल की आग",
        style: {
            background: "linear-gradient(45deg, #ff0000, #ff8c00, #ffd700)",
            color: "#212529",
            border: "1px solid #ccc"
        },
        chartBackgroundColor: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 1,
            y2: 1,
            colorStops: [
                { offset: 0, color: "#ff0000" },
                { offset: 0.5, color: "#ff8c00" },
                { offset: 1, color: "#ffd700" }
            ]
        }
    },
    {
        id: "rainbowcandy",
        name: "रेनबो कैंडी",
        style: {
            background: "linear-gradient(45deg, #ff4d94, #cc33ff, #3366ff)",
            color: "#212529",
            border: "1px solid #ccc"
        },
        chartBackgroundColor: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 1,
            y2: 1,
            colorStops: [
                { offset: 0, color: "#ff4d94" },
                { offset: 0.5, color: "#cc33ff" },
                { offset: 1, color: "#3366ff" }
            ]
        }
    },
    {
        id: "tropicalparadise",
        name: "ट्रॉपिकल पैराडाइज",
        style: {
            background: "linear-gradient(45deg, #00cc66, #ffcc00, #ff6600)",
            color: "#212529",
            border: "1px solid #ccc"
        },
        chartBackgroundColor: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 1,
            y2: 1,
            colorStops: [
                { offset: 0, color: "#00cc66" },
                { offset: 0.5, color: "#ffcc00" },
                { offset: 1, color: "#ff6600" }
            ]
        }
    },
    {
        id: "magicaurora",
        name: "मैजिक ऑरोरा",
        style: {
            background: "linear-gradient(45deg, #cc00ff, #ff33cc, #3300ff)",
            color: "#212529",
            border: "1px solid #ccc"
        },
        chartBackgroundColor: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 1,
            y2: 1,
            colorStops: [
                { offset: 0, color: "#cc00ff" },
                { offset: 0.5, color: "#ff33cc" },
                { offset: 1, color: "#3300ff" }
            ]
        }
    },
    {
        id: "neondreams",
        name: "नीयन ड्रीम्स",
        style: {
            background: "linear-gradient(45deg, #00ffff, #ff00ff, #9900ff)",
            color: "#ffffff",
            border: "1px solid #ffffff"
        },
        chartBackgroundColor: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 1,
            y2: 1,
            colorStops: [
                { offset: 0, color: "#00ffff" },
                { offset: 0.5, color: "#ff00ff" },
                { offset: 1, color: "#9900ff" }
            ]
        }
    },
    {
        id: "sunsetblaze",
        name: "सनसेट ब्लेज़",
        style: {
            background: "linear-gradient(45deg, #ff3300, #ff9900, #ffcc00)",
            color: "#212529",
            border: "1px solid #ccc"
        },
        chartBackgroundColor: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 1,
            y2: 1,
            colorStops: [
                { offset: 0, color: "#ff3300" },
                { offset: 0.5, color: "#ff9900" },
                { offset: 1, color: "#ffcc00" }
            ]
        }
    },
    {
        id: "electriclime",
        name: "इलेक्ट्रिक लाइम",
        style: {
            background: "linear-gradient(45deg, #00ff00, #ccff00, #00ccff)",
            color: "#212529",
            border: "1px solid #ccc"
        },
        chartBackgroundColor: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 1,
            y2: 1,
            colorStops: [
                { offset: 0, color: "#00ff00" },
                { offset: 0.5, color: "#ccff00" },
                { offset: 1, color: "#00ccff" }
            ]
        }
    },
    {
        id: "berryblast",
        name: "बेरी ब्लास्ट",
        style: {
            background: "linear-gradient(45deg, #ff3399, #9933ff, #3366ff)",
            color: "#ffffff",
            border: "1px solid #ffffff"
        },
        chartBackgroundColor: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 1,
            y2: 1,
            colorStops: [
                { offset: 0, color: "#ff3399" },
                { offset: 0.5, color: "#9933ff" },
                { offset: 1, color: "#3366ff" }
            ]
        }
    },
    {
        id: "rangberangi",
        name: "रंगबेरंगी",
        style: {
            background: "linear-gradient(45deg, #ff9999, #99ff99, #9999ff)",
            color: "#212529",
            border: "1px solid #ccc"
        },
        chartBackgroundColor: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 1,
            y2: 1,
            colorStops: [
                { offset: 0, color: "#ff9999" },
                { offset: 0.5, color: "#99ff99" },
                { offset: 1, color: "#9999ff" }
            ]
        }
    },
    {
        id: "cosmic-cyber",
        name: "कोस्मिक साइबर",
        style: {
            background: "linear-gradient(135deg, #0f0c20 0%, #15102a 50%, #241445 100%)",
            color: "#00f0ff",
            border: "1.5px solid #4a1c92",
            boxShadow: "0 8px 24px rgba(0, 240, 255, 0.15)"
        },
        chartBackgroundColor: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 1,
            y2: 1,
            colorStops: [
                { offset: 0, color: "#0f0c20" },
                { offset: 1, color: "#241445" }
            ]
        }
    },
    {
        id: "glass-frost",
        name: "ग्लास फ्रॉस्ट",
        style: {
            background: "rgba(255, 255, 255, 0.18)",
            backdropFilter: "blur(14px)",
            webkitBackdropFilter: "blur(14px)",
            color: "#1f2937",
            border: "1.5px solid rgba(255, 255, 255, 0.45)",
            boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.08)"
        },
        chartBackgroundColor: "rgba(255, 255, 255, 0.3)"
    },
    {
        id: "rose-gold-luxe",
        name: "रोज़ गोल्ड लक्स",
        style: {
            background: "linear-gradient(135deg, #f3e7e9 0%, #e3eeff 100%)",
            color: "#723d46",
            border: "1.5px solid #e1b4bc",
            boxShadow: "0 8px 20px rgba(114, 61, 70, 0.1)"
        },
        chartBackgroundColor: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 1,
            y2: 1,
            colorStops: [
                { offset: 0, color: "#f3e7e9" },
                { offset: 1, color: "#e3eeff" }
            ]
        }
    },
    {
        id: "emerald-royalty",
        name: "पन्ना राजसी (Gold)",
        style: {
            background: "linear-gradient(135deg, #0a2e24 0%, #114e3e 100%)",
            color: "#e0c068",
            border: "1.5px solid #c5a043",
            boxShadow: "0 8px 25px rgba(10, 46, 36, 0.3)"
        },
        chartBackgroundColor: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 1,
            y2: 1,
            colorStops: [
                { offset: 0, color: "#0a2e24" },
                { offset: 1, color: "#114e3e" }
            ]
        }
    },
    {
        id: "vintage-parchment",
        name: "विंटेज बहीखाता",
        style: {
            background: "#fbf6eb",
            color: "#4a3c2c",
            border: "1.5px solid #dfd3bd",
            boxShadow: "0 4px 12px rgba(74, 60, 44, 0.08)"
        },
        chartBackgroundColor: "#fdfbf7"
    }
];

let chartContainerColorTemplates: ContainerColorTemplate[] = staticTemplates;
let allActiveChartInstances: any[] = [];

// Store reference to chart instances
export function setActiveChartInstances(instances: any[]): void {
    allActiveChartInstances = instances;
}

// Load templates function (returns resolved promise for backward compatibility)
export function loadChartContainerColorTemplates(): Promise<ContainerColorTemplate[]> {
    chartContainerColorTemplates = staticTemplates;
    return Promise.resolve(staticTemplates);
}

/**
 * Renders the chart container color template options in the specified gallery element.
 */
export function renderChartContainerColorTemplates(
    galleryElement: HTMLElement | null,
    onSelectCallback?: (templateId: string) => void
): void {
    loadChartContainerColorTemplates().then(() => {
        if (!galleryElement) {
            console.error('Gallery element not found for rendering templates');
            return;
        }

        galleryElement.innerHTML = '';
        
        if (!chartContainerColorTemplates || chartContainerColorTemplates.length === 0) {
            galleryElement.innerHTML = '<p class="text-muted small">कोई टेम्पलेट उपलब्ध नहीं है</p>';
            return;
        }

        chartContainerColorTemplates.forEach(template => {
            const templateDiv = document.createElement('div');
            templateDiv.classList.add('template-card', 'rounded', 'shadow-sm', 'p-2', 'text-center', 'cursor-pointer');
            templateDiv.setAttribute('data-template-id', template.id);
            
            Object.assign(templateDiv.style, {
                width: '100px',
                height: '70px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                ...template.style
            });
            
            const innerColorPreview = document.createElement('div');
            innerColorPreview.style.cssText = `
                width: 40px; 
                height: 20px; 
                background: ${template.chartBackgroundColor?.type ? 
                    `linear-gradient(45deg, ${template.chartBackgroundColor.colorStops?.map((cs: any) => cs.color).join(', ') || '#fff'})` 
                    : template.chartBackgroundColor || '#fff'}; 
                border: 1px solid #ccc; 
                margin-bottom: 5px;
                border-radius: 3px;
            `;
            templateDiv.appendChild(innerColorPreview);
            
            const templateName = document.createElement('small');
            templateName.classList.add('fw-bold');
            templateName.textContent = template.name;
            templateName.style.color = template.style?.color || '#000';
            templateName.style.fontSize = '12px';
            
            templateDiv.appendChild(templateName);
            galleryElement.appendChild(templateDiv);
            
            templateDiv.addEventListener('click', () => {
                // Remove border and selected class from all cards
                galleryElement.querySelectorAll('.template-card').forEach(card => {
                    card.classList.remove('border', 'border-primary', 'border-3', 'selected');
                    (card as HTMLElement).style.transform = 'scale(1)';
                });
                
                // Add border and selected class to selected card
                templateDiv.classList.add('border', 'border-primary', 'border-3', 'selected');
                templateDiv.style.transform = 'scale(1.05)';
                
                console.log('Template selected:', template.id);
                
                if (onSelectCallback) {
                    onSelectCallback(template.id);
                }
            });
        });
    }).catch(error => {
        console.error('Error rendering templates:', error);
        if (galleryElement) {
            galleryElement.innerHTML = '<p class="text-danger small">टेम्पलेट लोड करने में त्रुटि</p>';
        }
    });
}

/**
 * Renders a list of existing charts in the specified element for user selection,
 * including a small preview of the chart.
 */
export function renderDashboardChartOverview(listElement: HTMLElement | null, existingCharts: any[]): void {
    if (!listElement) {
        console.error('List element not found for chart overview');
        return;
    }
    
    listElement.innerHTML = '';
    
    if (!existingCharts || existingCharts.length === 0) {
        listElement.innerHTML = '<p class="text-muted small">कोई चार्ट उपलब्ध नहीं है।</p>';
        return;
    }
    
    existingCharts.forEach((chart, index) => {
        try {
            if (!chart) return;
            const chartDom = (typeof chart.getDom === 'function') ? chart.getDom() : (chart.dom || chart);
            if (!chartDom || !chartDom.id) {
                console.warn('Chart DOM not found for chart:', chart);
                return;
            }
            
            const chartId = chartDom.id;
            const containerId = `container-${chartId}`;
            
            // Robust and safe title extraction
            let chartTitle = '';
            if (typeof chart.getOption === 'function') {
                const opt = chart.getOption();
                if (opt && opt.title) {
                    if (Array.isArray(opt.title)) {
                        chartTitle = opt.title[0]?.text || '';
                    } else if (typeof opt.title === 'object') {
                        chartTitle = opt.title.text || '';
                    }
                }
            }
            if (!chartTitle && chartDom.closest) {
                const titleEl = chartDom.closest('.chart-card, .visualization-container, [id^="container-"]')?.querySelector('.chart-title, .card-title, h5, h6');
                if (titleEl && titleEl.textContent) {
                    chartTitle = titleEl.textContent.trim();
                }
            }
            if (!chartTitle) {
                chartTitle = `चार्ट ${index + 1}`;
            }
            
            // Get chart snapshot safely
            let chartImage = '';
            try {
                if (typeof chart.getDataURL === 'function') {
                    chartImage = chart.getDataURL({
                        pixelRatio: 1,
                        backgroundColor: 'transparent'
                    });
                }
            } catch (e) {
                console.warn('Could not get chart image:', e);
            }
            if (!chartImage) {
                chartImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA2MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRkZGRkZGIiBzdHJva2U9IiNDQ0NDQ0MiLz4KPHN2Zz4=';
            }
            
            const div = document.createElement('div');
            div.classList.add('form-check', 'd-flex', 'align-items-center', 'mb-2');
            
            div.innerHTML = `
                <input class="form-check-input me-2" type="checkbox" value="${containerId}" id="checkbox-${containerId}">
                <label class="form-check-label d-flex align-items-center" for="checkbox-${containerId}" style="cursor: pointer;">
                    <img src="${chartImage}" alt="${chartTitle}" class="chart-preview-image border rounded me-2" style="width: 40px; height: 30px; object-fit: contain;">
                    <span class="small">${chartTitle}</span>
                </label>
            `;
            listElement.appendChild(div);
        } catch (error) {
            console.error('Error rendering chart overview item:', error);
        }
    });
}

function resetContainerStyle(container: HTMLElement | null, existingCharts?: any[]): void {
    if (!container) return;
    
    // 1. Reset the outer container
    container.style.backgroundColor = '';
    container.style.background = '';
    container.style.color = '';
    container.style.border = '';
    container.style.borderColor = '';
    container.style.borderWidth = '';
    container.style.borderStyle = '';
    container.style.boxShadow = '';
    container.style.backdropFilter = '';
    (container.style as any).webkitBackdropFilter = '';
    container.style.borderRadius = '';
    container.style.animation = '';
    container.style.transition = '';
    container.classList.remove('hover-effect-float', 'hover-effect-zoom', 'hover-effect-glow', 'chart-effect-applied');
    
    // 2. Reset the inner chart element
    const chartId = container.id.replace('container-', '');
    const innerChart = document.getElementById(chartId) || container.querySelector<HTMLElement>('.chart-canvas, .js-plotly-plot');
    if (innerChart) {
        innerChart.style.backgroundColor = '';
        innerChart.style.background = '';
        innerChart.style.color = '';
        innerChart.style.border = '';
        innerChart.style.borderColor = '';
        innerChart.style.borderWidth = '';
        innerChart.style.borderStyle = '';
        innerChart.style.boxShadow = '';
        innerChart.style.backdropFilter = '';
        (innerChart.style as any).webkitBackdropFilter = '';
        innerChart.style.borderRadius = '';
        innerChart.style.animation = '';
        innerChart.style.transition = '';
        innerChart.classList.remove('hover-effect-float', 'hover-effect-zoom', 'hover-effect-glow', 'chart-effect-applied');
    }
    
    // 3. Reset ECharts instance background option to transparent
    if (existingCharts && existingCharts.length > 0) {
        const chartInstance = existingCharts.find(chart => {
            const chartDom = chart.getDom ? chart.getDom() : null;
            return chartDom && (chartDom.id === chartId || chartDom === innerChart);
        });
        if (chartInstance && typeof chartInstance.setOption === 'function') {
            try {
                chartInstance.setOption({
                    backgroundColor: 'transparent'
                }, false);
            } catch (e) {
                console.warn('Error resetting ECharts background:', e);
            }
        }
    } else if (innerChart && (innerChart as any).__echarts__ && typeof (innerChart as any).__echarts__.setOption === 'function') {
        try {
            (innerChart as any).__echarts__.setOption({
                backgroundColor: 'transparent'
            }, false);
        } catch (e) {
            console.warn('Error resetting ECharts __echarts__ background:', e);
        }
    }
}

/**
 * Applies the selected chart container color template.
 */
export function applyChartContainerColor(
    templateId: string,
    existingCharts: any[],
    applyToAll: boolean,
    selectedChartIds: string[] = []
): void {
    console.log('applyChartContainerColor called with:', {
        templateId,
        existingChartsCount: existingCharts?.length,
        applyToAll,
        selectedChartIds
    });

    if (!chartContainerColorTemplates || chartContainerColorTemplates.length === 0) {
        console.error('Chart container color templates not loaded yet');
        alert('कृपया टेम्पलेट लोड होने का इंतज़ार करें');
        return;
    }

    const selectedTemplate = chartContainerColorTemplates.find(t => t.id === templateId);
    if (!selectedTemplate) {
        console.warn(`Chart container color template with ID ${templateId} not found. Available templates:`, 
            chartContainerColorTemplates.map(t => t.id));
        alert(`टेम्पलेट ID ${templateId} नहीं मिला`);
        return;
    }

    console.log('Applying template:', selectedTemplate);

    const chartContainers = document.querySelectorAll<HTMLElement>('.visualization-container');
    console.log('Found chart containers:', chartContainers.length);

    if (applyToAll) {
        // Apply to all charts
        chartContainers.forEach(container => {
            resetContainerStyle(container, existingCharts);
            if (selectedTemplate.style) {
                Object.assign(container.style, selectedTemplate.style);
                console.log('Applied styles to container:', container.id);
            }
        });

        // Update chart backgrounds
        if (existingCharts && existingCharts.length > 0) {
            existingCharts.forEach(chart => {
                if (chart && typeof chart.setOption === 'function') {
                    try {
                        chart.setOption({
                            backgroundColor: selectedTemplate.chartBackgroundColor || 'transparent'
                        }, false);
                        console.log('Updated chart background:', chart.getDom?.()?.id);
                    } catch (error) {
                        console.error('Error updating chart background:', error);
                    }
                }
            });
        }
    } else {
        if (!selectedChartIds || selectedChartIds.length === 0) {
            alert('कृपया लागू करने के लिए कम से कम एक चार्ट चुनें');
            return;
        }

        selectedChartIds.forEach(containerId => {
            const container = document.getElementById(containerId);
            if (container) {
                resetContainerStyle(container, existingCharts);
                if (selectedTemplate.style) {
                    Object.assign(container.style, selectedTemplate.style);
                    console.log('Applied styles to selected container:', containerId);
                }

                // Update chart background
                const chartId = containerId.replace('container-', '');
                const chartInstance = existingCharts?.find(chart => {
                    const chartDom = chart.getDom ? chart.getDom() : null;
                    return chartDom && chartDom.id === chartId;
                });
                
                if (chartInstance && typeof chartInstance.setOption === 'function') {
                    try {
                        chartInstance.setOption({
                            backgroundColor: selectedTemplate.chartBackgroundColor || 'transparent'
                        }, false);
                        console.log('Updated selected chart background:', chartId);
                    } catch (error) {
                        console.error('Error updating selected chart background:', error);
                    }
                }
            } else {
                console.warn(`Container with ID ${containerId} not found.`);
            }
        });
    }
    
    console.log(`Successfully applied chart container color template: ${templateId}`);
    alert(`टेम्पलेट "${selectedTemplate.name}" सफलतापूर्वक लागू किया गया!`);
}

/**
 * Applies custom chart container and chart background styles from a JSON object.
 */
export function applyCustomChartContainerColor(
    customOptions: { style?: Record<string, any>; chartBackgroundColor?: any },
    existingCharts: any[],
    applyToAll: boolean,
    selectedChartIds: string[] = []
): void {
    if (!customOptions || (!customOptions.style && !customOptions.chartBackgroundColor)) {
        console.warn('Invalid custom options provided. At least "style" or "chartBackgroundColor" must be present.');
        alert('अमान्य कस्टम विकल्प। कृपया स्टाइल या बैकग्राउंड कलर प्रदान करें।');
        return;
    }

    const chartContainers = document.querySelectorAll<HTMLElement>('.visualization-container');

    const applyStyles = (container: HTMLElement, chartInstance: any) => {
        // Clear previous template style first!
        resetContainerStyle(container, existingCharts);
        
        // Apply container styles
        if (customOptions.style) {
            Object.assign(container.style, customOptions.style);
        }

        // Apply chart background color
        if (chartInstance && customOptions.chartBackgroundColor) {
            try {
                chartInstance.setOption({
                    backgroundColor: customOptions.chartBackgroundColor
                }, false);
            } catch (error) {
                console.error('Error applying custom chart background:', error);
            }
        }
    };

    if (applyToAll) {
        chartContainers.forEach(container => {
            const chartId = container.id.replace('container-', '');
            const chartInstance = existingCharts?.find(chart => {
                const chartDom = chart.getDom ? chart.getDom() : null;
                return chartDom && chartDom.id === chartId;
            });
            applyStyles(container, chartInstance);
        });
    } else {
        if (!selectedChartIds || selectedChartIds.length === 0) {
            alert('कृपया लागू करने के लिए कम से कम एक चार्ट चुनें');
            return;
        }

        selectedChartIds.forEach(containerId => {
            const container = document.getElementById(containerId);
            if (container) {
                const chartId = containerId.replace('container-', '');
                const chartInstance = existingCharts?.find(chart => {
                    const chartDom = chart.getDom ? chart.getDom() : null;
                    return chartDom && chartDom.id === chartId;
                });
                applyStyles(container, chartInstance);
            } else {
                console.warn(`Container with ID ${containerId} not found.`);
            }
        });
    }

    console.log('Custom chart styles applied successfully.');
    alert('कस्टम स्टाइल सफलतापूर्वक लागू किए गए!');
}

// =================================================================================================
// CodeMirror Logic & Presets
// =================================================================================================
let codeMirrorEditor: any = null;
let currentTextareaId: string | null = null;

const CONTAINER_PRESETS: Record<string, any> = {
    glassmorphism: {
        style: {
            backdropFilter: "blur(12px)",
            webkitBackdropFilter: "blur(12px)",
            background: "rgba(255, 255, 255, 0.12)",
            border: "1px solid rgba(255, 255, 255, 0.25)",
            borderRadius: "16px",
            boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.3)",
            padding: "20px",
            transition: "all 0.3s ease"
        },
        chartBackgroundColor: "transparent"
    },
    neon_cyberpunk: {
        style: {
            backgroundColor: "#0d0e15",
            border: "2px solid #00ffcc",
            borderRadius: "12px",
            boxShadow: "0 0 15px rgba(0, 255, 204, 0.4), inset 0 0 10px rgba(0, 255, 204, 0.2)",
            padding: "20px",
            transition: "all 0.3s ease"
        },
        chartBackgroundColor: "transparent"
    },
    warm_minimalist: {
        style: {
            backgroundColor: "#fdfbf7",
            border: "1px solid #e6dfd3",
            borderRadius: "20px",
            boxShadow: "0 4px 20px rgba(139, 120, 90, 0.08)",
            padding: "24px",
            transition: "all 0.3s ease"
        },
        chartBackgroundColor: "transparent"
    },
    dark_slate: {
        style: {
            backgroundColor: "#1e293b",
            border: "1px solid #334155",
            borderRadius: "14px",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3)",
            padding: "20px",
            transition: "all 0.3s ease"
        },
        chartBackgroundColor: "transparent"
    }
};

const EFFECT_PRESETS: Record<string, any> = {
    glowing_aura: {
        shadowColor: "rgba(99, 102, 241, 0.5)",
        shadowBlur: 20,
        shadowOffsetX: 0,
        shadowOffsetY: 4,
        backgroundColor: "#0f172a",
        borderColor: "#6366f1",
        borderWidth: 2,
        borderStyle: "solid",
        borderRadius: 16,
        cardStyleType: "solid",
        extraOverlayEffects: "pulse",
        cardHoverAnimation: "glow"
    },
    sunset_gradient: {
        shadowColor: "rgba(253, 160, 133, 0.3)",
        shadowBlur: 15,
        shadowOffsetX: 0,
        shadowOffsetY: 6,
        backgroundColor: "#ffffff",
        borderColor: "#fda085",
        borderWidth: 1,
        borderStyle: "solid",
        borderRadius: 12,
        cardStyleType: "gradient",
        gradientPreset: "sunset",
        extraOverlayEffects: "none",
        cardHoverAnimation: "float"
    },
    deep_ocean_glass: {
        shadowColor: "rgba(0, 0, 0, 0.4)",
        shadowBlur: 25,
        shadowOffsetX: 0,
        shadowOffsetY: 10,
        backgroundColor: "rgba(18, 194, 233, 0.15)",
        borderColor: "rgba(255, 255, 255, 0.2)",
        borderWidth: 1,
        borderStyle: "solid",
        borderRadius: 18,
        cardStyleType: "glass",
        extraOverlayEffects: "inset-shadow",
        cardHoverAnimation: "zoom"
    },
    futuristic_neumorphic: {
        shadowColor: "rgba(0,0,0,0.05)",
        shadowBlur: 12,
        shadowOffsetX: 4,
        shadowOffsetY: 4,
        backgroundColor: "#e0e8f0",
        borderColor: "#ffffff",
        borderWidth: 1,
        borderStyle: "none",
        borderRadius: 24,
        cardStyleType: "neumorphic",
        extraOverlayEffects: "none",
        cardHoverAnimation: "float"
    }
};

function applyLivePreviewStyles(code: string, textareaId: string): void {
    try {
        const mockCard = document.getElementById('mockPreviewCard');
        if (!mockCard) return;

        mockCard.style.cssText = '';
        mockCard.style.width = '100%';
        mockCard.style.maxWidth = '400px';
        mockCard.style.transition = 'all 0.3s ease';
        mockCard.className = "card p-4 transition-all";

        mockCard.classList.remove('hover-effect-float', 'hover-effect-zoom', 'hover-effect-glow');

        const previewMode = (window as any).previewMode || 'combined';

        const containerTextarea = document.getElementById('customChartContainerCode') as HTMLTextAreaElement | null;
        const textareasEffects = document.getElementById('customEffectCode') as HTMLTextAreaElement | null;

        let containerCode = containerTextarea ? containerTextarea.value : '{}';
        let effectsCode = textareasEffects ? textareasEffects.value : '{}';

        if (codeMirrorEditor) {
            const currentCode = codeMirrorEditor.getValue();
            if (textareaId === 'customChartContainerCode') {
                containerCode = currentCode;
            } else if (textareaId === 'customEffectCode') {
                effectsCode = currentCode;
            }
        }

        let containerParsed: any = {};
        try {
            containerParsed = JSON.parse(containerCode || '{}');
        } catch (e) {}

        let effectsParsed: any = {};
        try {
            effectsParsed = JSON.parse(effectsCode || '{}');
        } catch (e) {}

        const workspaceBadge = document.getElementById('workspaceBadge');
        const mockTitle = document.getElementById('mockPreviewTitle');
        if (workspaceBadge) {
            if (textareaId === 'customChartContainerCode') {
                workspaceBadge.textContent = "CONTAINER DESIGN WORKSPACE";
                workspaceBadge.className = "badge bg-info bg-opacity-20 text-info border border-info border-opacity-25 py-1 px-2";
                if (mockTitle) mockTitle.textContent = "Container Layout Output";
            } else {
                workspaceBadge.textContent = "VISUAL EFFECTS WORKSPACE";
                workspaceBadge.className = "badge bg-warning bg-opacity-20 text-warning border border-warning border-opacity-25 py-1 px-2";
                if (mockTitle) mockTitle.textContent = "Effects & Animations Output";
            }
        }

        if (previewMode === 'combined' || previewMode === 'container') {
            if (containerParsed.style) {
                Object.assign(mockCard.style, containerParsed.style);
            }
            const mockChartArea = document.getElementById('mockPreviewChartArea') || mockCard.querySelector<HTMLElement>('.py-2');
            if (mockChartArea) {
                if (containerParsed.chartBackgroundColor) {
                    mockChartArea.style.backgroundColor = containerParsed.chartBackgroundColor;
                    mockChartArea.style.borderRadius = '8px';
                    mockChartArea.style.padding = '8px';
                } else {
                    mockChartArea.style.backgroundColor = 'transparent';
                    mockChartArea.style.padding = '';
                }
            }
        }

        if (previewMode === 'combined' || previewMode === 'effects') {
            const {
                shadowColor, shadowBlur, shadowOffsetX, shadowOffsetY,
                backgroundColor, borderColor, borderWidth, borderStyle, borderRadius,
                cardStyleType, gradientPreset, customGradientText, cardHoverAnimation, extraOverlayEffects
            } = effectsParsed;

            const resolvedBorderStyle = borderStyle || 'solid';
            const resolvedBorderRadius = borderRadius !== undefined ? `${borderRadius}px` : (containerParsed.style?.borderRadius || '16px');

            if (shadowColor || shadowBlur !== undefined) {
                let baseShadow = `${shadowOffsetX || 0}px ${shadowOffsetY || 0}px ${shadowBlur || 0}px ${shadowColor || 'rgba(0,0,0,0.1)'}`;
                if (extraOverlayEffects === 'inset-shadow') {
                    baseShadow += `, inset 0 0 15px rgba(0, 0, 0, 0.2)`;
                } else if (extraOverlayEffects === 'vignette') {
                    baseShadow += `, inset 0 0 40px rgba(0, 0, 0, 0.35)`;
                }
                mockCard.style.boxShadow = baseShadow;
            }

            if (extraOverlayEffects === 'pulse') {
                mockCard.style.animation = 'pulse-glow-animation 3s infinite alternate ease-in-out';
            } else {
                mockCard.style.animation = '';
            }

            if (cardStyleType === 'gradient') {
                let gradValue = 'linear-gradient(135deg, #12c2e9 0%, #c471ed 50%, #f64f59 100%)';
                if (gradientPreset === 'sunset') gradValue = 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)';
                else if (gradientPreset === 'ocean') gradValue = 'linear-gradient(135deg, #12c2e9 0%, #c471ed 50%, #f64f59 100%)';
                else if (gradientPreset === 'royal') gradValue = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                else if (gradientPreset === 'emerald') gradValue = 'linear-gradient(135deg, #0ba360 0%, #3cba92 100%)';
                else if (gradientPreset === 'darkknight') gradValue = 'linear-gradient(135deg, #232526 0%, #414345 100%)';
                else if (gradientPreset === 'custom' && customGradientText) gradValue = customGradientText;

                mockCard.style.background = gradValue;
                if (borderWidth > 0 && borderColor && resolvedBorderStyle !== 'none') {
                    mockCard.style.border = `${borderWidth}px ${resolvedBorderStyle} ${borderColor}`;
                } else {
                    mockCard.style.border = 'none';
                }
                mockCard.style.borderRadius = resolvedBorderRadius;
            } else if (cardStyleType === 'glass') {
                mockCard.style.backdropFilter = 'blur(12px)';
                (mockCard.style as any).webkitBackdropFilter = 'blur(12px)';
                mockCard.style.background = 'rgba(255, 255, 255, 0.12)';
                mockCard.style.border = `${borderWidth || 1}px ${resolvedBorderStyle} ${borderColor || 'rgba(255, 255, 255, 0.25)'}`;
                mockCard.style.borderRadius = resolvedBorderRadius;
            } else if (cardStyleType === 'neumorphic') {
                mockCard.style.background = backgroundColor || '#f8f9fa';
                mockCard.style.boxShadow = '9px 9px 16px rgba(0, 0, 0, 0.08), -9px -9px 16px rgba(255, 255, 255, 0.5)';
                mockCard.style.border = 'none';
                mockCard.style.borderRadius = resolvedBorderRadius;
            } else if (cardStyleType === 'solid') {
                if (backgroundColor) {
                    mockCard.style.backgroundColor = backgroundColor;
                }
                if (borderColor && borderWidth !== undefined && resolvedBorderStyle !== 'none') {
                    mockCard.style.border = `${borderWidth}px ${resolvedBorderStyle} ${borderColor}`;
                } else {
                    mockCard.style.border = '';
                }
                mockCard.style.borderRadius = resolvedBorderRadius;
            }

            if (cardHoverAnimation && cardHoverAnimation !== 'none') {
                mockCard.classList.add(`hover-effect-${cardHoverAnimation}`);
            }
        }

        const titleEl = document.getElementById('mockPreviewTitle');
        if (titleEl) {
            const isLightBg = mockCard.style.backgroundColor === '#ffffff' || 
                              mockCard.style.backgroundColor === '#fdfbf7' || 
                              mockCard.style.backgroundColor === '#f8f9fa' ||
                              containerParsed.style?.backgroundColor === '#ffffff' || 
                              containerParsed.style?.backgroundColor === '#fdfbf7' ||
                              effectsParsed.backgroundColor === '#ffffff' ||
                              effectsParsed.backgroundColor === '#f8f9fa';

            if (isLightBg && effectsParsed.cardStyleType !== 'glass' && effectsParsed.cardStyleType !== 'gradient') {
                titleEl.className = "mb-1 text-dark fw-bold";
            } else {
                titleEl.className = "mb-1 text-white fw-bold";
            }
        }

    } catch (e) {
        console.error('Error applying live preview styles:', e);
    }
}

function initializeCodeMirror(textareaId: string): void {
    const editorContainer = document.getElementById('editorContainer');
    if (!editorContainer) {
        console.error('Editor कंटेनर नहीं मिला');
        return;
    }

    if (codeMirrorEditor) {
        editorContainer.innerHTML = '';
        codeMirrorEditor = null;
    }

    try {
        editorContainer.innerHTML = '';
        const nativeTextarea = document.createElement('textarea');
        nativeTextarea.id = 'nativeJsonEditorAreaContainer';
        nativeTextarea.className = 'form-control font-monospace text-light bg-dark border-0 p-3 h-100';
        nativeTextarea.style.cssText = 'resize: none; font-family: Consolas, "Fira Code", Monaco, monospace; font-size: 13px; line-height: 1.5; outline: none; box-shadow: none; width: 100%; height: 100%; background: #18181b; color: #f4f4f5;';
        nativeTextarea.spellcheck = false;
        nativeTextarea.placeholder = 'Enter or paste JSON style configuration here...';
        editorContainer.appendChild(nativeTextarea);

        const changeCallbacks: Array<() => void> = [];

        nativeTextarea.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                const start = nativeTextarea.selectionStart;
                const end = nativeTextarea.selectionEnd;
                nativeTextarea.value = nativeTextarea.value.substring(0, start) + '    ' + nativeTextarea.value.substring(end);
                nativeTextarea.selectionStart = nativeTextarea.selectionEnd = start + 4;
                changeCallbacks.forEach(cb => { try { cb(); } catch (_) {} });
            }
        });

        nativeTextarea.addEventListener('input', () => {
            changeCallbacks.forEach(cb => { try { cb(); } catch (_) {} });
        });

        codeMirrorEditor = {
            getValue: () => nativeTextarea.value,
            setValue: (val: string) => {
                nativeTextarea.value = val || '';
                changeCallbacks.forEach(cb => { try { cb(); } catch (_) {} });
            },
            on: (_event: string, cb: () => void) => {
                changeCallbacks.push(cb);
            },
            lineCount: () => (nativeTextarea.value ? nativeTextarea.value.split('\n').length : 1),
            refresh: () => {},
            focus: () => {
                nativeTextarea.focus();
            }
        };

        console.log(`Native JSON workspace initialized successfully in containerColors for ${textareaId}`);

        const updateStatus = (text: string, type: string) => {
            const logEl = document.getElementById('editorStatusLog');
            const badgeEl = document.getElementById('jsonStatusBadge');
            
            if (logEl) {
                logEl.textContent = text;
                if (type === 'danger') {
                    logEl.className = "text-danger animate__animated animate__headShake";
                } else if (type === 'success') {
                    logEl.className = "text-success-emphasis fw-semibold";
                } else {
                    logEl.className = "text-muted";
                }
            }
            if (badgeEl) {
                badgeEl.textContent = type === 'success' ? 'VALID' : (type === 'danger' ? 'ERR' : 'EDIT');
                badgeEl.className = `badge bg-${type === 'success' ? 'success' : (type === 'danger' ? 'danger' : 'secondary')}`;
            }
        };

        const guideTextEl = document.getElementById('jsonFormatGuideText');
        if (guideTextEl) {
            if (textareaId === 'customChartContainerCode') {
                guideTextEl.innerHTML = `
                    <div class="row text-white-50 g-2" style="font-size: 0.72rem;">
                        <div class="col-6">
                            <span class="text-info fw-bold">style:</span> Custom CSS styles for chart container.<br>
                            <span class="text-info fw-bold">style.borderRadius:</span> Radius in px (e.g., "16px").<br>
                            <span class="text-info fw-bold">style.background:</span> Background color or gradient.
                        </div>
                        <div class="col-6">
                            <span class="text-info fw-bold">style.boxShadow:</span> Container drop shadow value.<br>
                            <span class="text-info fw-bold">style.backdropFilter:</span> Blur styling (e.g. "blur(10px)").<br>
                            <span class="text-info fw-bold">chartBackgroundColor:</span> Color of actual chart object.
                        </div>
                    </div>
                `;
            } else {
                guideTextEl.innerHTML = `
                    <div class="row text-white-50 g-2" style="font-size: 0.72rem;">
                        <div class="col-6">
                            <span class="text-info fw-bold">shadowColor:</span> Shadow hex or rgba color.<br>
                            <span class="text-info fw-bold">shadowBlur:</span> Drop shadow blur width.<br>
                            <span class="text-info fw-bold">cardStyleType:</span> "solid" | "gradient" | "glass" | "neumorphic"
                        </div>
                        <div class="col-6">
                            <span class="text-info fw-bold">extraOverlayEffects:</span> "pulse" | "inset-shadow" | "vignette" | "none"<br>
                            <span class="text-info fw-bold">cardHoverAnimation:</span> "float" | "zoom" | "glow" | "none"<br>
                            <span class="text-info fw-bold">borderRadius / borderWidth:</span> Positive number counts.
                        </div>
                    </div>
                `;
            }
        }

        const selPresets = document.getElementById('selPresetsJson') as HTMLSelectElement | null;
        if (selPresets) {
            selPresets.innerHTML = '<option value="">-- Choose a Preset Design --</option>';
            const presets = textareaId === 'customChartContainerCode' ? CONTAINER_PRESETS : EFFECT_PRESETS;
            
            Object.keys(presets).forEach(key => {
                const opt = document.createElement('option');
                opt.value = key;
                opt.textContent = key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') + ' Design Preset';
                selPresets.appendChild(opt);
            });

            selPresets.onchange = () => {
                const val = selPresets.value;
                if (val && presets[val]) {
                    codeMirrorEditor.setValue(JSON.stringify(presets[val], null, 4));
                }
            };
        }

        const btnBeautify = document.getElementById('btnBeautifyJson');
        if (btnBeautify) {
            btnBeautify.onclick = () => {
                try {
                    const code = codeMirrorEditor.getValue();
                    const parsed = JSON.parse(code);
                    codeMirrorEditor.setValue(JSON.stringify(parsed, null, 4));
                    updateStatus("✓ JSON formatted successfully", "success");
                } catch (e: any) {
                    updateStatus(`✗ Formatter error: ${e.message}`, "danger");
                }
            };
        }

        const btnMinify = document.getElementById('btnMinifyJson');
        if (btnMinify) {
            btnMinify.onclick = () => {
                try {
                    const code = codeMirrorEditor.getValue();
                    const parsed = JSON.parse(code);
                    codeMirrorEditor.setValue(JSON.stringify(parsed));
                    updateStatus("✓ JSON minified successfully", "success");
                } catch (e: any) {
                    updateStatus(`✗ Minifier error: ${e.message}`, "danger");
                }
            };
        }

        const btnValidate = document.getElementById('btnValidateJson');
        if (btnValidate) {
            btnValidate.onclick = () => {
                try {
                    const code = codeMirrorEditor.getValue();
                    const parsed = JSON.parse(code);
                    if (textareaId === 'customEffectCode') {
                        import('./chartEffects.ts').then(({ validateEffectObject }) => {
                            if (validateEffectObject) validateEffectObject(parsed);
                        });
                    }
                    updateStatus("✓ JSON structure is 100% valid!", "success");
                } catch (e: any) {
                    updateStatus(`✗ Validation failed: ${e.message}`, "danger");
                }
            };
        }

        codeMirrorEditor.on("change", () => {
            const code = codeMirrorEditor.getValue();
            
            const totalLines = codeMirrorEditor.lineCount();
            const rawSize = code.length;
            
            const totalLinesEl = document.getElementById('editorTotalLines');
            if (totalLinesEl) totalLinesEl.textContent = totalLines;
            
            const textSizeEl = document.getElementById('editorTextSize');
            if (textSizeEl) {
                textSizeEl.textContent = rawSize < 1024 ? `${rawSize} B` : `${(rawSize / 1024).toFixed(1)} KB`;
            }

            try {
                if (!code.trim()) {
                    updateStatus("Editor empty. Input JSON.", "secondary");
                    return;
                }

                const parsed = JSON.parse(code);
                if (textareaId === 'customEffectCode') {
                    import('./chartEffects.ts').then(({ validateEffectObject }) => {
                        if (validateEffectObject) validateEffectObject(parsed);
                    });
                }

                updateStatus("✓ JSON is Valid", "success");
                applyLivePreviewStyles(code, textareaId);

                const chkLiveSync = document.getElementById('chkLiveSyncDashboard') as HTMLInputElement | null;
                if (chkLiveSync && chkLiveSync.checked) {
                    if (textareaId === 'customChartContainerCode') {
                        import('./chartState.ts').then(({ allActiveChartInstances }) => {
                            const applyToAll = (document.getElementById('scopeAllCharts') as HTMLInputElement | null)?.checked || false;
                            const selectedChartIds = applyToAll ? [] : Array.from(document.querySelectorAll<HTMLInputElement>('#chartSelectionList input[type="checkbox"]:checked')).map(cb => cb.value);
                            
                            const oldAlert = window.alert;
                            window.alert = () => {};
                            try {
                                applyCustomChartContainerColor(parsed, allActiveChartInstances, applyToAll, selectedChartIds);
                            } catch (error) {}
                            window.alert = oldAlert;
                        });
                    } else {
                        import('./chartEffects.ts').then(({ applyEffect }) => {
                            import('./chartState.ts').then(({ allActiveChartInstances }) => {
                                const applyToAll = (document.getElementById('applyToAllRadio') as HTMLInputElement | null)?.checked;
                                let chartsToUpdate: any[] = [];

                                if (applyToAll) {
                                    allActiveChartInstances.forEach(chartInst => chartsToUpdate.push(chartInst));
                                    document.querySelectorAll('.chart-canvas, .js-plotly-plot').forEach(dom => {
                                        if (!(dom as any).__echarts__) chartsToUpdate.push(dom);
                                    });
                                } else {
                                    const chartList = document.getElementById('chartSelectionListEffects');
                                    if (chartList) {
                                        const checkedBoxes = chartList.querySelectorAll<HTMLInputElement>('input[type="checkbox"]:checked');
                                        checkedBoxes.forEach(checkbox => {
                                            const chartId = checkbox.value;
                                            const chartInstance = typeof echarts !== 'undefined' && echarts.getInstanceByDom ? echarts.getInstanceByDom(document.getElementById(chartId)) : null;
                                            if (chartInstance) {
                                                chartsToUpdate.push(chartInstance);
                                            } else {
                                                const chartDom = document.getElementById(chartId);
                                                if (chartDom) chartsToUpdate.push(chartDom);
                                            }
                                        });
                                    }
                                }

                                const oldAlert = window.alert;
                                window.alert = () => {};
                                try {
                                    chartsToUpdate.forEach(chart => {
                                        applyEffect(chart, parsed);
                                    });
                                } catch (error) {}
                                window.alert = oldAlert;
                            });
                        });
                    }
                }
            } catch (err: any) {
                updateStatus(`✗ JSON Error: ${err.message}`, "danger");
            }
        });

        const btnCombined = document.getElementById('btnPreviewModeCombined');
        const btnContainer = document.getElementById('btnPreviewModeContainer');
        const btnEffects = document.getElementById('btnPreviewModeEffects');

        if (btnCombined && btnContainer && btnEffects) {
            const activeMode = (window as any).previewMode || 'combined';
            btnCombined.classList.toggle('active', activeMode === 'combined');
            btnContainer.classList.toggle('active', activeMode === 'container');
            btnEffects.classList.toggle('active', activeMode === 'effects');

            const setMode = (mode: string) => {
                (window as any).previewMode = mode;
                btnCombined.classList.toggle('active', mode === 'combined');
                btnContainer.classList.toggle('active', mode === 'container');
                btnEffects.classList.toggle('active', mode === 'effects');
                
                const code = codeMirrorEditor ? codeMirrorEditor.getValue() : '';
                applyLivePreviewStyles(code, textareaId);
            };

            btnCombined.onclick = () => setMode('combined');
            btnContainer.onclick = () => setMode('container');
            btnEffects.onclick = () => setMode('effects');
        }

    } catch (e) {
        console.error("CodeMirror initialization failed:", e);
    }
}

export function initializeChartFormatting(): void {
    console.log('initializeChartFormatting executed');
    
    import('./chartState.ts').then(({ allActiveChartInstances }) => {
        const scopeAllCharts = document.getElementById('scopeAllCharts');
        const scopeSelectedCharts = document.getElementById('scopeSelectedCharts');
        const dashboardChartOverview = document.getElementById('dashboardChartOverview');
        const chartSelectionList = document.getElementById('chartSelectionList');
        
        const gallery = document.getElementById('chartContainerColorGallery');
        if (gallery) {
            renderChartContainerColorTemplates(gallery, (templateId) => {
                const items = gallery.querySelectorAll<HTMLElement>('.chart-container-color-item');
                items.forEach(item => {
                    if (item.dataset.templateId === templateId) {
                        item.classList.add('selected');
                        item.style.border = '2px solid #007bff';
                    } else {
                        item.classList.remove('selected');
                        item.style.border = '1px solid #ddd';
                    }
                });
            });
        }

        if (chartSelectionList) {
            renderDashboardChartOverview(chartSelectionList, allActiveChartInstances);
        }

        if (scopeSelectedCharts) {
            scopeSelectedCharts.onchange = () => {
                if (dashboardChartOverview) {
                    dashboardChartOverview.style.display = 'block';
                    renderDashboardChartOverview(chartSelectionList, allActiveChartInstances);
                }
            };
        }

        if (scopeAllCharts) {
            scopeAllCharts.onchange = () => {
                if (dashboardChartOverview) {
                    dashboardChartOverview.style.display = 'none';
                }
            };
        }

        const openChartFormatEditorBtn = document.getElementById('openChartFormatEditorBtn');
        if (openChartFormatEditorBtn) {
            openChartFormatEditorBtn.onclick = async () => {
                const { loadDynamicContent } = await import('../layout/dynamicLoader.ts');
                await loadDynamicContent('codeEditorModal', 'codeEditorModal');

                const modalEl = document.getElementById('codeEditorModal');
                const codeEditorModal = (typeof bootstrap !== 'undefined' && modalEl) ? bootstrap.Modal.getOrCreateInstance(modalEl) : null;

                currentTextareaId = 'customChartContainerCode';
                initializeCodeMirror(currentTextareaId);

                const textarea = document.getElementById(currentTextareaId) as HTMLTextAreaElement | null;
                if (textarea && codeMirrorEditor) {
                    const code = textarea.value || '{}';
                    codeMirrorEditor.setValue(code);
                    applyLivePreviewStyles(code, currentTextareaId);
                }

                if (codeEditorModal) {
                    codeEditorModal.show();
                }
            };
        }
        
        const saveCodeBtn = document.getElementById('saveCodeBtn');
        if (saveCodeBtn) {
            saveCodeBtn.onclick = () => {
                if (currentTextareaId && codeMirrorEditor) {
                    const code = codeMirrorEditor.getValue();
                    const textarea = document.getElementById(currentTextareaId) as HTMLTextAreaElement | null;
                    if (textarea) {
                        textarea.value = code;
                    }
                    const modalEl = document.getElementById('codeEditorModal');
                    const modal = modalEl && typeof bootstrap !== 'undefined' ? bootstrap.Modal.getInstance(modalEl) : null;
                    if (modal) {
                        modal.hide();
                    }
                }
            };
        }

        const applyCustomChartContainerCodeBtn = document.getElementById('applyCustomChartContainerCodeBtn');
        if (applyCustomChartContainerCodeBtn) {
            applyCustomChartContainerCodeBtn.onclick = () => {
                const textarea = document.getElementById('customChartContainerCode') as HTMLTextAreaElement | null;
                const jsonString = textarea ? textarea.value : '';
                try {
                    const customOptions = JSON.parse(jsonString);
                    const applyToAll = (document.getElementById('scopeAllCharts') as HTMLInputElement | null)?.checked || false;
                    const selectedChartIds = applyToAll ? [] : Array.from(document.querySelectorAll<HTMLInputElement>('#chartSelectionList input[type="checkbox"]:checked')).map(cb => cb.value);
                    
                    applyCustomChartContainerColor(customOptions, allActiveChartInstances, applyToAll, selectedChartIds);
                    
                    const offcanvasSidebar = document.getElementById('offcanvasSidebar');
                    if (offcanvasSidebar && typeof bootstrap !== 'undefined') {
                        bootstrap.Offcanvas.getInstance(offcanvasSidebar)?.hide();
                    }
                } catch (error: any) {
                    alert(`JSON पार्स करने में त्रुटि: ${error.message}`);
                    console.error("JSON parsing error:", error);
                }
            };
        }
    });
}

// Initialize when DOM is loaded
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('chartContainerColors.ts DOMContentLoaded executed');
        initializeChartFormatting();
        
        loadChartContainerColorTemplates().then(() => {
            console.log('Chart container color templates loaded on startup');
        });
    });
}

// Global functions for backward compatibility
if (typeof window !== 'undefined') {
    (window as any).applyChartContainerColor = applyChartContainerColor;
    (window as any).renderChartContainerColorTemplates = renderChartContainerColorTemplates;
}
