// src/js/charts/chartEffects.ts
import { allActiveChartInstances } from './chartState.ts';
import { showMessage } from '../core/utils.ts';

declare const bootstrap: any;
declare const echarts: any;

// Alert helpers
function showSuccessAlert(message: string): void {
    showMessage(message, 'success');
}

function showErrorAlert(message: string): void {
    showMessage(message, 'danger');
}

export interface ChartEffectTemplate {
    id: string;
    name: string;
    shadowColor?: string;
    shadowBlur?: number;
    shadowOffsetX?: number;
    shadowOffsetY?: number;
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
    borderStyle?: string;
    borderRadius?: number;
    cardStyleType?: string;
    gradientPreset?: string;
    customGradientText?: string;
    cardHoverAnimation?: string;
    extraOverlayEffects?: string;
    createdAt?: string;
    [key: string]: any;
}

// Ready-made effects templates
export const chartEffectsTemplates: ChartEffectTemplate[] = [
    {
        id: 'effect-shadow-light',
        name: 'हल्की परछाई',
        shadowColor: 'rgba(0, 0, 0, 0.1)',
        shadowBlur: 10,
        shadowOffsetX: 0,
        shadowOffsetY: 5,
        backgroundColor: '#f8f9fa',
        borderColor: '#e9ecef',
        borderWidth: 1,
        borderStyle: 'solid',
        borderRadius: 12,
        cardStyleType: 'solid',
        cardHoverAnimation: 'float'
    },
    {
        id: 'effect-shadow-dark',
        name: 'गहरी परछाई',
        shadowColor: 'rgba(0, 0, 0, 0.4)',
        shadowBlur: 15,
        shadowOffsetX: 5,
        shadowOffsetY: 5,
        backgroundColor: '#1e1e1e',
        borderColor: '#333333',
        borderWidth: 1,
        borderStyle: 'solid',
        borderRadius: 12,
        cardStyleType: 'solid',
        cardHoverAnimation: 'zoom'
    },
    {
        id: 'effect-cyberpunk',
        name: 'साइबरपंक नियॉन (Cyberpunk Neon)',
        shadowColor: 'rgba(0, 240, 255, 0.5)',
        shadowBlur: 20,
        shadowOffsetX: 0,
        shadowOffsetY: 0,
        backgroundColor: '#0a0e17',
        borderColor: '#ff007f',
        borderWidth: 2,
        borderStyle: 'solid',
        borderRadius: 14,
        cardStyleType: 'solid',
        cardHoverAnimation: 'glow'
    },
    {
        id: 'effect-sunset-fire',
        name: 'सूर्यास्त अग्नि (Sunset Fire)',
        shadowColor: 'rgba(246, 79, 89, 0.4)',
        shadowBlur: 18,
        shadowOffsetX: 0,
        shadowOffsetY: 6,
        backgroundColor: 'transparent',
        borderColor: 'transparent',
        borderWidth: 0,
        borderStyle: 'none',
        borderRadius: 16,
        cardStyleType: 'gradient',
        gradientPreset: 'sunset',
        cardHoverAnimation: 'float'
    },
    {
        id: 'effect-emerald',
        name: 'पन्ना वन (Emerald Glow)',
        shadowColor: 'rgba(11, 163, 96, 0.35)',
        shadowBlur: 15,
        shadowOffsetX: 0,
        shadowOffsetY: 5,
        backgroundColor: 'transparent',
        borderColor: 'transparent',
        borderWidth: 0,
        borderStyle: 'none',
        borderRadius: 16,
        cardStyleType: 'gradient',
        gradientPreset: 'emerald',
        cardHoverAnimation: 'zoom'
    },
    {
        id: 'effect-retro-gold',
        name: 'विंटेज गोल्ड (Retro Gold)',
        shadowColor: 'rgba(212, 175, 55, 0.25)',
        shadowBlur: 12,
        shadowOffsetX: 4,
        shadowOffsetY: 4,
        backgroundColor: '#fffdf0',
        borderColor: '#d4af37',
        borderWidth: 3,
        borderStyle: 'double',
        borderRadius: 8,
        cardStyleType: 'solid',
        cardHoverAnimation: 'float'
    },
    {
        id: 'effect-minimalist',
        name: 'आधुनिक न्यूनतम (Minimalist)',
        shadowColor: 'rgba(0, 0, 0, 0.03)',
        shadowBlur: 8,
        shadowOffsetX: 0,
        shadowOffsetY: 3,
        backgroundColor: '#ffffff',
        borderColor: '#f1f5f9',
        borderWidth: 1,
        borderStyle: 'solid',
        borderRadius: 12,
        cardStyleType: 'solid',
        cardHoverAnimation: 'none'
    },
    {
        id: 'effect-glass-frosted',
        name: 'फ्रॉस्टेड ग्लास (Frosted Glass)',
        shadowColor: 'rgba(0, 0, 0, 0.08)',
        shadowBlur: 15,
        shadowOffsetX: 0,
        shadowOffsetY: 5,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderColor: 'rgba(255, 255, 255, 0.25)',
        borderWidth: 1,
        borderStyle: 'solid',
        borderRadius: 16,
        cardStyleType: 'glass',
        cardHoverAnimation: 'float'
    }
];

// ===============================
// Utility Functions
// ===============================

function getChartDom(chartInstanceOrId: any): HTMLElement | null {
    if (chartInstanceOrId && typeof chartInstanceOrId.getDom === 'function') {
        return chartInstanceOrId.getDom();
    }
    if (typeof chartInstanceOrId === 'string') {
        return document.getElementById(chartInstanceOrId);
    }
    if (chartInstanceOrId instanceof HTMLElement) {
        return chartInstanceOrId;
    }
    return null;
}

export function validateEffectObject(effectObj: any): boolean {
    if (!effectObj || typeof effectObj !== 'object') {
        throw new Error('इफ़ेक्ट ऑब्जेक्ट वैध नहीं है');
    }

    const requiredProps = ['shadowColor', 'shadowBlur', 'backgroundColor', 'borderColor', 'borderWidth'];
    const missingProps = requiredProps.filter(prop => !effectObj.hasOwnProperty(prop));
    
    if (missingProps.length > 0) {
        throw new Error(`आवश्यक प्रॉपर्टीज गुम हैं: ${missingProps.join(', ')}`);
    }

    if (typeof effectObj.shadowBlur !== 'number' || effectObj.shadowBlur < 0) {
        throw new Error('shadowBlur एक सकारात्मक संख्या होनी चाहिए');
    }

    if (typeof effectObj.borderWidth !== 'number' || effectObj.borderWidth < 0) {
        throw new Error('borderWidth एक सकारात्मक संख्या होनी चाहिए');
    }

    return true;
}

function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
    let timeout: any;
    return function executedFunction(...args: Parameters<T>) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ===============================
// Unified Effect Function
// ===============================

export function applyEffect(chartInstanceOrId: any, effectObj: any): boolean {
    try {
        const chartDom = getChartDom(chartInstanceOrId);
        if (!chartDom) {
            console.warn('चार्ट DOM नहीं मिला:', chartInstanceOrId);
            return false;
        }

        if (!effectObj) {
            throw new Error('इफ़ेक्ट ऑब्जेक्ट आवश्यक है');
        }

        validateEffectObject(effectObj);

        const {
            shadowColor, shadowBlur, shadowOffsetX, shadowOffsetY,
            backgroundColor, borderColor, borderWidth, borderStyle, borderRadius,
            cardStyleType, gradientPreset, customGradientText, cardHoverAnimation, extraOverlayEffects
        } = effectObj;

        const container = (chartDom.closest('.visualization-container') as HTMLElement) || chartDom;
        const innerChart = (chartDom.classList.contains('chart-canvas') || chartDom.classList.contains('js-plotly-plot'))
            ? chartDom
            : ((container.querySelector('.chart-canvas, .js-plotly-plot') as HTMLElement) || chartDom);

        [container, innerChart].forEach(el => {
            if (!el) return;
            el.style.backgroundColor = '';
            el.style.background = '';
            el.style.color = '';
            el.style.border = '';
            el.style.borderColor = '';
            el.style.borderWidth = '';
            el.style.borderStyle = '';
            el.style.boxShadow = '';
            el.style.backdropFilter = '';
            (el.style as any).webkitBackdropFilter = '';
            el.style.borderRadius = '';
            el.style.animation = '';
            el.style.transition = '';
            el.classList.remove('hover-effect-float', 'hover-effect-zoom', 'hover-effect-glow', 'chart-effect-applied');
        });

        let activeECharts: any = null;
        if (chartInstanceOrId && typeof chartInstanceOrId.setOption === 'function') {
            activeECharts = chartInstanceOrId;
        } else if (innerChart && (innerChart as any).__echarts__) {
            activeECharts = (innerChart as any).__echarts__;
        } else if (innerChart && typeof echarts !== 'undefined' && echarts.getInstanceByDom) {
            activeECharts = echarts.getInstanceByDom(innerChart);
        }

        if (activeECharts && typeof activeECharts.setOption === 'function') {
            try {
                activeECharts.setOption({ backgroundColor: 'transparent' }, false);
            } catch (e) {
                console.warn('Error setting ECharts background to transparent:', e);
            }
        }

        const resolvedBorderStyle = borderStyle || 'solid';
        const resolvedBorderRadius = borderRadius !== undefined ? `${borderRadius}px` : '12px';

        let baseShadow = `${shadowOffsetX || 0}px ${shadowOffsetY || 0}px ${shadowBlur || 0}px ${shadowColor || 'rgba(0,0,0,0.1)'}`;
        if (extraOverlayEffects === 'inset-shadow') {
            baseShadow += `, inset 0 0 15px rgba(0, 0, 0, 0.2)`;
        } else if (extraOverlayEffects === 'vignette') {
            baseShadow += `, inset 0 0 40px rgba(0, 0, 0, 0.35)`;
        }
        container.style.boxShadow = baseShadow;

        if (extraOverlayEffects === 'pulse') {
            container.style.animation = 'pulse-glow-animation 3s infinite alternate ease-in-out';
            if (!document.getElementById('pulse-glow-style')) {
                const styleEl = document.createElement('style');
                styleEl.id = 'pulse-glow-style';
                styleEl.textContent = `
                    @keyframes pulse-glow-animation {
                        0% { transform: scale(1); box-shadow: 0 0 5px rgba(0,0,0,0.1); }
                        50% { transform: scale(1.01); box-shadow: 0 0 15px rgba(0,200,255,0.25); }
                        100% { transform: scale(1); box-shadow: 0 0 5px rgba(0,0,0,0.1); }
                    }
                `;
                document.head.appendChild(styleEl);
            }
        }

        if (cardStyleType === 'gradient') {
            let gradValue = 'linear-gradient(135deg, #12c2e9 0%, #c471ed 50%, #f64f59 100%)';
            if (gradientPreset === 'sunset') gradValue = 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)';
            else if (gradientPreset === 'ocean') gradValue = 'linear-gradient(135deg, #12c2e9 0%, #c471ed 50%, #f64f59 100%)';
            else if (gradientPreset === 'royal') gradValue = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
            else if (gradientPreset === 'emerald') gradValue = 'linear-gradient(135deg, #0ba360 0%, #3cba92 100%)';
            else if (gradientPreset === 'darkknight') gradValue = 'linear-gradient(135deg, #232526 0%, #414345 100%)';
            else if (gradientPreset === 'custom' && customGradientText) gradValue = customGradientText;

            container.style.background = gradValue;
            if (borderWidth > 0 && borderColor && resolvedBorderStyle !== 'none') {
                container.style.border = `${borderWidth}px ${resolvedBorderStyle} ${borderColor}`;
            } else {
                container.style.border = 'none';
            }
            container.style.borderRadius = resolvedBorderRadius;
        } else if (cardStyleType === 'glass') {
            container.style.backdropFilter = 'blur(12px)';
            (container.style as any).webkitBackdropFilter = 'blur(12px)';
            container.style.background = 'rgba(255, 255, 255, 0.12)';
            container.style.border = `${borderWidth || 1}px ${resolvedBorderStyle} ${borderColor || 'rgba(255, 255, 255, 0.25)'}`;
            container.style.borderRadius = resolvedBorderRadius;
        } else if (cardStyleType === 'neumorphic') {
            container.style.background = backgroundColor || '#f8f9fa';
            container.style.boxShadow = '9px 9px 16px rgba(0, 0, 0, 0.08), -9px -9px 16px rgba(255, 255, 255, 0.5)';
            container.style.border = 'none';
            container.style.borderRadius = resolvedBorderRadius;
        } else {
            if (backgroundColor) {
                container.style.backgroundColor = backgroundColor;
            } else {
                container.style.backgroundColor = '';
            }

            if (borderColor && borderWidth !== undefined && resolvedBorderStyle !== 'none') {
                container.style.border = `${borderWidth}px ${resolvedBorderStyle} ${borderColor}`;
            } else {
                container.style.border = '';
            }
            container.style.borderRadius = resolvedBorderRadius;
        }

        if (cardHoverAnimation && cardHoverAnimation !== 'none') {
            container.classList.add(`hover-effect-${cardHoverAnimation}`);
        }

        container.style.transition = "all 0.4s ease";
        container.classList.add("chart-effect-applied");
        
        setTimeout(() => {
            container.classList.remove("chart-effect-applied");
        }, 800);

        return true;
    } catch (error: any) {
        console.error('इफ़ेक्ट लागू करने में त्रुटि:', error);
        showErrorAlert(`इफ़ेक्ट लागू करने में त्रुटि: ${error.message}`);
        return false;
    }
}

export function resetEffects(chartInstanceOrId: any): boolean {
    const chartDom = getChartDom(chartInstanceOrId);
    if (!chartDom) return false;

    try {
        const container = (chartDom.closest('.visualization-container') as HTMLElement) || chartDom;
        const innerChart = (chartDom.classList.contains('chart-canvas') || chartDom.classList.contains('js-plotly-plot'))
            ? chartDom
            : ((container.querySelector('.chart-canvas, .js-plotly-plot') as HTMLElement) || chartDom);

        [container, innerChart].forEach(el => {
            if (!el) return;
            el.style.boxShadow = '';
            el.style.backgroundColor = '';
            el.style.background = '';
            el.style.color = '';
            el.style.border = '';
            el.style.borderRadius = '';
            el.style.backdropFilter = '';
            (el.style as any).webkitBackdropFilter = '';
            el.style.animation = '';
            el.style.transition = '';
            el.classList.remove(
                'hover-effect-float', 'hover-effect-zoom', 'hover-effect-glow',
                'chart-effect-applied'
            );
        });
        
        let activeECharts: any = null;
        if (chartInstanceOrId && typeof chartInstanceOrId.setOption === 'function') {
            activeECharts = chartInstanceOrId;
        } else if (innerChart && (innerChart as any).__echarts__) {
            activeECharts = (innerChart as any).__echarts__;
        } else if (innerChart && typeof echarts !== 'undefined' && echarts.getInstanceByDom) {
            activeECharts = echarts.getInstanceByDom(innerChart);
        }

        if (activeECharts && typeof activeECharts.setOption === 'function') {
            activeECharts.setOption({ backgroundColor: 'transparent' }, false);
        }

        return true;
    } catch (error) {
        console.error('इफ़ेक्ट रीसेट करने में त्रुटि:', error);
        return false;
    }
}

export function saveCustomEffect(effectObj: any, name: string): string | null {
    try {
        const customEffects = JSON.parse(localStorage.getItem('customChartEffects') || '[]');
        const newEffect = {
            ...effectObj,
            id: `custom-effect-${Date.now()}`,
            name: name || `कस्टम इफ़ेक्ट ${customEffects.length + 1}`,
            createdAt: new Date().toISOString()
        };
        
        customEffects.push(newEffect);
        localStorage.setItem('customChartEffects', JSON.stringify(customEffects));
        
        showSuccessAlert('कस्टम इफ़ेक्ट सफलतापूर्वक सेव हुआ!');
        return newEffect.id;
    } catch (error) {
        console.error('कस्टम इफ़ेक्ट सेव करने में त्रुटि:', error);
        showErrorAlert('कस्टम इफ़ेक्ट सेव करने में त्रुटि');
        return null;
    }
}

export function loadCustomEffects(): any[] {
    try {
        return JSON.parse(localStorage.getItem('customChartEffects') || '[]');
    } catch (error) {
        console.error('कस्टम इफ़ेक्ट्स लोड करने में त्रुटि:', error);
        return [];
    }
}

export function renderChartEffectsTemplates(
    galleryElement: HTMLElement | null,
    onSelectCallback?: (templateId: string) => void
): void {
    if (!galleryElement) return;

    try {
        galleryElement.innerHTML = '';
        
        chartEffectsTemplates.forEach(template => {
            const templateDiv = createEffectTemplateCard(template);
            galleryElement.appendChild(templateDiv);

            templateDiv.addEventListener('click', () => {
                galleryElement.querySelectorAll('.chart-effect-template-item').forEach(card => {
                    card.classList.remove('selected', 'border-primary');
                });
                
                templateDiv.classList.add('selected', 'border-primary');
                if (onSelectCallback) onSelectCallback(template.id);
            });
        });

        const customEffects = loadCustomEffects();
        if (customEffects.length > 0) {
            const separator = document.createElement('div');
            separator.className = 'w-100 border-top my-3';
            galleryElement.appendChild(separator);

            const customHeader = document.createElement('h6');
            customHeader.className = 'text-muted mb-2';
            customHeader.textContent = 'कस्टम इफ़ेक्ट्स';
            galleryElement.appendChild(customHeader);

            customEffects.forEach(template => {
                const templateDiv = createEffectTemplateCard(template);
                galleryElement.appendChild(templateDiv);

                templateDiv.addEventListener('click', () => {
                    galleryElement.querySelectorAll('.chart-effect-template-item').forEach(card => {
                        card.classList.remove('selected', 'border-primary');
                    });
                    templateDiv.classList.add('selected', 'border-primary');
                    if (onSelectCallback) onSelectCallback(template.id);
                });
            });
        }

    } catch (error) {
        console.error('इफ़ेक्ट गैलरी रेंडर करने में त्रुटि:', error);
        galleryElement.innerHTML = '<p class="text-danger">गैलरी लोड करने में त्रुटि</p>';
    }
}

function createEffectTemplateCard(template: ChartEffectTemplate): HTMLElement {
    const templateDiv = document.createElement('div');
    templateDiv.classList.add('chart-effect-template-item', 'border', 'bg-light', 'p-3', 'mb-2');
    templateDiv.dataset.id = template.id;

    const previewBox = document.createElement('div');
    previewBox.className = 'effect-preview-box';
    previewBox.style.cssText = `
        width: 80px;
        height: 50px;
        margin: 0 auto 8px;
        background-color: ${template.backgroundColor};
        border: ${template.borderWidth}px solid ${template.borderColor};
        box-shadow: ${template.shadowOffsetX}px ${template.shadowOffsetY}px ${template.shadowBlur}px ${template.shadowColor};
        border-radius: 6px;
        transition: transform 0.2s ease;
    `;
    templateDiv.appendChild(previewBox);

    const templateName = document.createElement('div');
    templateName.className = 'template-name text-center';
    templateName.textContent = template.name;
    templateDiv.appendChild(templateName);

    templateDiv.addEventListener('mouseenter', () => {
        previewBox.style.transform = 'scale(1.05)';
    });
    
    templateDiv.addEventListener('mouseleave', () => {
        previewBox.style.transform = 'scale(1)';
    });

    return templateDiv;
}

export function renderDashboardChartList(listElement: HTMLElement | null): void {
    if (!listElement) return;

    try {
        listElement.innerHTML = '';
        let chartCount = 0;
        const addedIds = new Set<string>();

        allActiveChartInstances.forEach((chart, index) => {
            if (!chart) return;
            const chartDom = getChartDom(chart);
            if (!chartDom) return;

            const chartId = chartDom.id || `chart-${Date.now()}-${index}`;
            if (addedIds.has(chartId)) return;
            addedIds.add(chartId);

            const option = (typeof chart.getOption === 'function') ? (chart.getOption() || {}) : {};
            const titleObj = Array.isArray(option.title) ? option.title[0] : option.title;
            const domTitle = chartDom.closest('.visualization-container')?.querySelector('.chart-title')?.textContent?.trim();
            const chartTitle = (titleObj && typeof titleObj === 'object' && titleObj.text) ? titleObj.text : (domTitle || `चार्ट ${index + 1}`);
            const chartImage = (typeof chart.getDataURL === 'function') ? chart.getDataURL({ pixelRatio: 1, backgroundColor: 'transparent' }) : '';

            const listItem = createChartListItem(chartId, chartTitle, chartImage, 'ECharts');
            listElement.appendChild(listItem);
            chartCount++;
        });

        document.querySelectorAll('.chart-canvas, .js-plotly-plot').forEach((dom: any, idx: number) => {
            if (dom.id) {
                const chartId = dom.id;
                if (addedIds.has(chartId)) return;

                let isEChartsInstance = false;
                if (typeof echarts !== 'undefined' && echarts.getInstanceByDom) {
                    if (echarts.getInstanceByDom(dom)) {
                        isEChartsInstance = true;
                    }
                }
                if (isEChartsInstance) return;

                addedIds.add(chartId);

                const chartTitle = dom.closest('.visualization-container')?.querySelector('.chart-title')?.textContent ||
                    `Plotly Chart ${idx + 1}`;

                let previewImage = '';
                try {
                    const canvas = dom.querySelector('canvas');
                    const svg = dom.querySelector('svg');
                    if (canvas) {
                        previewImage = canvas.toDataURL('image/png');
                    } else if (svg) {
                        previewImage = 'svg';
                    }
                } catch (e) {
                    console.warn('Plotly प्रिव्यू इमेज बनाने में त्रुटि:', e);
                }

                const listItem = createChartListItem(chartId, chartTitle, previewImage, 'Plotly');
                listElement.appendChild(listItem);
                chartCount++;
            }
        });

        if (chartCount === 0) {
            listElement.innerHTML = '<p class="text-muted small text-center">कोई चार्ट उपलब्ध नहीं है।</p>';
        } else {
            const counter = document.createElement('div');
            counter.className = 'text-muted small mt-2';
            counter.textContent = `कुल ${chartCount} चार्ट मिले`;
            listElement.appendChild(counter);
        }

    } catch (error) {
        console.error('चार्ट लिस्ट रेंडर करने में त्रुटि:', error);
        listElement.innerHTML = '<p class="text-danger">चार्ट लिस्ट लोड करने में त्रुटि</p>';
    }
}

export const debouncedRenderChartList = debounce(renderDashboardChartList, 250);

function createChartListItem(chartId: string, chartTitle: string, previewImage: string, chartType: string): HTMLElement {
    const div = document.createElement('div');
    div.classList.add('form-check', 'd-flex', 'align-items-center', 'mb-2', 'p-2', 'border', 'rounded');
    
    let previewHtml = '';
    if (previewImage === 'svg') {
        previewHtml = `<div class="bg-light border rounded me-2 d-flex align-items-center justify-content-center" style="width:40px; height:30px;">
            <small class="text-muted">SVG</small>
        </div>`;
    } else if (previewImage) {
        previewHtml = `<img src="${previewImage}" alt="${chartTitle}" width="40" height="30" class="chart-preview-image border rounded me-2">`;
    } else {
        previewHtml = `<div class="bg-light border rounded me-2 d-flex align-items-center justify-content-center" style="width:40px; height:30px;">
            <i class="bi bi-bar-chart text-muted"></i>
        </div>`;
    }

    div.innerHTML = `
        <input class="form-check-input me-2" type="checkbox" value="${chartId}" id="effects-checkbox-${chartId}">
        <label class="form-check-label d-flex align-items-center w-100" for="effects-checkbox-${chartId}">
            ${previewHtml}
            <div class="flex-grow-1">
                <div class="small fw-bold">${chartTitle}</div>
                <div class="text-muted" style="font-size: 0.7rem;">${chartType}</div>
            </div>
        </label>
    `;

    return div;
}

function parseCustomEffectCode(jsonString: string): any {
    const errorAlert = document.getElementById('codeErrorAlert');
    if (errorAlert) {
        errorAlert.style.display = 'none';
    }

    try {
        if (!jsonString.trim()) {
            throw new Error('JSON कोड खाली है');
        }

        const parsed = JSON.parse(jsonString);
        validateEffectObject(parsed);
        return parsed;
    } catch (error: any) {
        const errorMessage = `JSON पार्स करने में त्रुटि: ${error.message}`;
        console.error(errorMessage);
        
        if (errorAlert) {
            errorAlert.textContent = errorMessage;
            errorAlert.style.display = 'block';
        } else {
            showErrorAlert(errorMessage);
        }
        return null;
    }
}

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
        const effectsTextarea = document.getElementById('customEffectCode') as HTMLTextAreaElement | null;

        let containerCode = containerTextarea ? containerTextarea.value : '{}';
        let effectsCode = effectsTextarea ? effectsTextarea.value : '{}';

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
        nativeTextarea.id = 'nativeJsonEditorArea';
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

        console.log(`Native JSON workspace initialized successfully for ${textareaId}`);

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
                        validateEffectObject(parsed);
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
                    validateEffectObject(parsed);
                }

                updateStatus("✓ JSON is Valid", "success");
                applyLivePreviewStyles(code, textareaId);

                const chkLiveSync = document.getElementById('chkLiveSyncDashboard') as HTMLInputElement | null;
                if (chkLiveSync && chkLiveSync.checked) {
                    if (textareaId === 'customChartContainerCode') {
                        import('./chartContainerColors.ts').then(({ applyCustomChartContainerColor }) => {
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
                        });
                    } else {
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

// ===============================
// INJECT INITIALIZATION & LISTENERS
// ===============================

export function initializeChartEffects(): void {
    try {
        const applyChartEffects = document.getElementById('applyChartEffects');
        const resetAllEffects = document.getElementById('resetAllEffects');
        const saveCustomEffectBtn = document.getElementById('saveCustomEffectBtn');
        const refreshChartsListBtn = document.getElementById('refreshChartsListBtn');

        const customEffectsRadio = document.getElementById('customEffectsRadio') as HTMLInputElement | null;
        const templateEffectsRadio = document.getElementById('templateEffectsRadio') as HTMLInputElement | null;
        const customCodeRadio = document.getElementById('customCodeRadio') as HTMLInputElement | null;

        const customEffectsSection = document.getElementById('customEffectsSection');
        const templateEffectsSection = document.getElementById('templateEffectsSection');
        const customCodeEffectsSection = document.getElementById('customCodeEffectsSection');

        if (!applyChartEffects) {
            console.log('applyChartEffects element not found, skipping chart effects initialization.');
            return;
        }

        function setupTabSwitching() {
            const radios = [customEffectsRadio, templateEffectsRadio, customCodeRadio];
            const sections = [customEffectsSection, templateEffectsSection, customCodeEffectsSection];

            radios.forEach((radio, index) => {
                if (radio) {
                    radio.onchange = () => {
                        sections.forEach((section, sectionIndex) => {
                            if (section) {
                                section.style.display = sectionIndex === index ? 'block' : 'none';
                            }
                        });
                    };
                }
            });
        }

        async function setupCodeEditor() {
            const openChartFormatEditorBtn = document.getElementById('openChartFormatEditorBtn');
            const openChartEffectEditorBtn = document.getElementById('openChartEffectEditorBtn');

            const initModalAndShow = async (textareaId: string) => {
                const { loadDynamicContent } = await import('../layout/dynamicLoader.ts');
                await loadDynamicContent('codeEditorModal', 'codeEditorModal');

                const modalEl = document.getElementById('codeEditorModal');
                const codeEditorModal = (typeof bootstrap !== 'undefined' && modalEl) ? bootstrap.Modal.getOrCreateInstance(modalEl) : null;

                currentTextareaId = textareaId;
                initializeCodeMirror(currentTextareaId);

                const textarea = document.getElementById(currentTextareaId) as HTMLTextAreaElement | null;
                if (textarea && codeMirrorEditor) {
                    codeMirrorEditor.setValue(textarea.value);
                    applyLivePreviewStyles(textarea.value, currentTextareaId);
                    if (codeEditorModal) codeEditorModal.show();
                }

                const saveCodeBtn = document.getElementById('saveCodeBtn');
                if (saveCodeBtn) {
                    saveCodeBtn.onclick = () => {
                        if (currentTextareaId && codeMirrorEditor) {
                            const textarea = document.getElementById(currentTextareaId) as HTMLTextAreaElement | null;
                            if (textarea) {
                                textarea.value = codeMirrorEditor.getValue();
                            }
                        }
                        if (codeEditorModal) codeEditorModal.hide();
                    };
                }

                if (modalEl) {
                    (modalEl as any).onshown = () => {
                        if (codeMirrorEditor) {
                            setTimeout(() => {
                                codeMirrorEditor.refresh();
                                codeMirrorEditor.focus();
                            }, 100);
                        }
                    };
                }
            };

            if (openChartFormatEditorBtn) {
                openChartFormatEditorBtn.onclick = async () => {
                    await initModalAndShow('customChartContainerCode');
                };
            }

            if (openChartEffectEditorBtn) {
                openChartEffectEditorBtn.onclick = async () => {
                    await initModalAndShow('customEffectCode');
                };
            }
        }

        function setupApplyButton() {
            if (!applyChartEffects) return;
            applyChartEffects.onclick = () => {
                let selectedEffect: any = null;

                try {
                    if (customEffectsRadio?.checked) {
                        selectedEffect = {
                            shadowColor: (document.getElementById('shadowColor') as HTMLInputElement | null)?.value || 'rgba(0, 0, 0, 0.2)',
                            shadowBlur: parseInt((document.getElementById('shadowBlur') as HTMLInputElement | null)?.value || '10') || 10,
                            shadowOffsetX: parseInt((document.getElementById('shadowOffsetX') as HTMLInputElement | null)?.value || '0') || 0,
                            shadowOffsetY: parseInt((document.getElementById('shadowOffsetY') as HTMLInputElement | null)?.value || '5') || 5,
                            backgroundColor: (document.getElementById('backgroundColor') as HTMLInputElement | null)?.value || '#ffffff',
                            borderColor: (document.getElementById('borderColor') as HTMLInputElement | null)?.value || '#000000',
                            borderWidth: parseInt((document.getElementById('borderWidth') as HTMLInputElement | null)?.value || '1') || 1,
                            borderStyle: (document.getElementById('borderStyle') as HTMLInputElement | null)?.value || 'solid',
                            borderRadius: parseInt((document.getElementById('borderRadius') as HTMLInputElement | null)?.value || '12') || 12,
                            extraOverlayEffects: (document.getElementById('extraOverlayEffects') as HTMLInputElement | null)?.value || 'none',
                            cardStyleType: (document.getElementById('cardStyleType') as HTMLInputElement | null)?.value || 'solid',
                            gradientPreset: (document.getElementById('gradientPreset') as HTMLInputElement | null)?.value || 'ocean',
                            customGradientText: (document.getElementById('customGradientText') as HTMLInputElement | null)?.value || '',
                            cardHoverAnimation: (document.getElementById('cardHoverAnimation') as HTMLInputElement | null)?.value || 'none'
                        };
                    } else if (templateEffectsRadio?.checked) {
                        const selectedTemplateId = (document.querySelector('.chart-effect-template-item.selected') as HTMLElement | null)?.dataset.id;
                        if (selectedTemplateId) {
                            selectedEffect = chartEffectsTemplates.find(t => t.id === selectedTemplateId) ||
                                           loadCustomEffects().find(t => t.id === selectedTemplateId);
                        }
                    } else if (customCodeRadio?.checked) {
                        const customCode = (document.getElementById('customEffectCode') as HTMLTextAreaElement | null)?.value;
                        if (customCode) {
                            selectedEffect = parseCustomEffectCode(customCode);
                        }
                    }

                    if (!selectedEffect) {
                        throw new Error('कृपया एक इफ़ेक्ट चुनें, टेम्पलेट चुनें या कोड दर्ज करें।');
                    }

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
                            if (checkedBoxes.length === 0) {
                                throw new Error('कृपया कम से कम एक चार्ट सिलेक्ट करें');
                            }

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

                    if (chartsToUpdate.length === 0) {
                        throw new Error('कोई चार्ट उपलब्ध नहीं है');
                    }

                    let successCount = 0;
                    chartsToUpdate.forEach(chart => {
                        if (applyEffect(chart, selectedEffect)) {
                            successCount++;
                        }
                    });

                    showSuccessAlert(`${successCount} चार्ट्स पर इफ़ेक्ट सफलतापूर्वक लागू हुआ`);

                } catch (error: any) {
                    showErrorAlert(error.message);
                }
            };
        }

        function setupResetButton() {
            if (resetAllEffects) {
                resetAllEffects.onclick = () => {
                    try {
                        let chartsToReset: any[] = [];
                        
                        allActiveChartInstances.forEach(chartInst => chartsToReset.push(chartInst));
                        document.querySelectorAll('.chart-canvas, .js-plotly-plot').forEach(dom => {
                            chartsToReset.push(dom);
                        });

                        let resetCount = 0;
                        chartsToReset.forEach(chart => {
                            if (resetEffects(chart)) {
                                resetCount++;
                            }
                        });

                        showSuccessAlert(`${resetCount} चार्ट्स रीसेट हो गए`);
                    } catch (error: any) {
                        showErrorAlert(`रीसेट करने में त्रुटि: ${error.message}`);
                    }
                };
            }
        }

        function setupSaveCustomEffectButton() {
            if (saveCustomEffectBtn) {
                saveCustomEffectBtn.onclick = () => {
                    try {
                        const effectName = prompt('इफ़ेक्ट का नाम दर्ज करें:');
                        if (!effectName) return;

                        const effectObj = {
                            shadowColor: (document.getElementById('shadowColor') as HTMLInputElement | null)?.value || 'rgba(0, 0, 0, 0.2)',
                            shadowBlur: parseInt((document.getElementById('shadowBlur') as HTMLInputElement | null)?.value || '10') || 10,
                            shadowOffsetX: parseInt((document.getElementById('shadowOffsetX') as HTMLInputElement | null)?.value || '0') || 0,
                            shadowOffsetY: parseInt((document.getElementById('shadowOffsetY') as HTMLInputElement | null)?.value || '5') || 5,
                            backgroundColor: (document.getElementById('backgroundColor') as HTMLInputElement | null)?.value || '#ffffff',
                            borderColor: (document.getElementById('borderColor') as HTMLInputElement | null)?.value || '#000000',
                            borderWidth: parseInt((document.getElementById('borderWidth') as HTMLInputElement | null)?.value || '1') || 1,
                            borderStyle: (document.getElementById('borderStyle') as HTMLInputElement | null)?.value || 'solid',
                            borderRadius: parseInt((document.getElementById('borderRadius') as HTMLInputElement | null)?.value || '12') || 12,
                            extraOverlayEffects: (document.getElementById('extraOverlayEffects') as HTMLInputElement | null)?.value || 'none',
                            cardStyleType: (document.getElementById('cardStyleType') as HTMLInputElement | null)?.value || 'solid',
                            gradientPreset: (document.getElementById('gradientPreset') as HTMLInputElement | null)?.value || 'ocean',
                            customGradientText: (document.getElementById('customGradientText') as HTMLInputElement | null)?.value || '',
                            cardHoverAnimation: (document.getElementById('cardHoverAnimation') as HTMLInputElement | null)?.value || 'none'
                        };

                        if (saveCustomEffect(effectObj, effectName)) {
                            const galleryElement = document.getElementById('effectsTemplatesGallery');
                            if (galleryElement) {
                                renderChartEffectsTemplates(galleryElement);
                            }
                        }
                    } catch (error: any) {
                        showErrorAlert(`कस्टम इफ़ेक्ट सेव करने में त्रुटि: ${error.message}`);
                    }
                };
            }
        }

        function setupRefreshChartsList() {
            if (refreshChartsListBtn) {
                refreshChartsListBtn.onclick = () => {
                    const listElement = document.getElementById('chartSelectionListEffects');
                    if (listElement) {
                        debouncedRenderChartList(listElement);
                        showSuccessAlert('चार्ट लिस्ट रिफ्रेश हो गई');
                    }
                };
            }
        }

        setupTabSwitching();
        setupCodeEditor();
        setupApplyButton();
        setupResetButton();
        setupSaveCustomEffectButton();
        setupRefreshChartsList();

        const cardStyleTypeSelect = document.getElementById('cardStyleType') as HTMLSelectElement | null;
        const gradientPresetSection = document.getElementById('gradientPresetSection');
        const gradientPresetSelect = document.getElementById('gradientPreset') as HTMLSelectElement | null;
        const customGradientText = document.getElementById('customGradientText');

        if (cardStyleTypeSelect && gradientPresetSection) {
            const checkVisibility = () => {
                if (cardStyleTypeSelect.value === 'gradient') {
                    gradientPresetSection.style.display = 'block';
                } else {
                    gradientPresetSection.style.display = 'none';
                }
            };
            cardStyleTypeSelect.onchange = checkVisibility;
            checkVisibility();
        }

        if (gradientPresetSelect && customGradientText) {
            const checkPresetVisibility = () => {
                if (gradientPresetSelect.value === 'custom') {
                    customGradientText.style.display = 'block';
                } else {
                    customGradientText.style.display = 'none';
                }
            };
            gradientPresetSelect.onchange = checkPresetVisibility;
            checkPresetVisibility();
        }

        const galleryElement = document.getElementById('effectsTemplatesGallery');
        if (galleryElement) {
            renderChartEffectsTemplates(galleryElement);
        }

        const listElement = document.getElementById('chartSelectionListEffects');
        if (listElement) {
            debouncedRenderChartList(listElement);
        }

        console.log('चार्ट इफ़ेक्ट्स सिस्टम सफलतापूर्वक लोड हुआ');

    } catch (error: any) {
        console.error('initializeChartEffects में त्रुटि:', error);
        showErrorAlert(`सिस्टम लोड करने में त्रुटि: ${error.message}`);
    }
}

if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function() {
        initializeChartEffects();
    });
}

const effectStyles = `
.chart-effect-template-item {
    cursor: pointer;
    transition: all 0.3s ease;
    border-radius: 8px;
    border: 2px solid transparent !important;
}

.chart-effect-template-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.chart-effect-template-item.selected {
    border: 2px solid #007bff !important;
    background-color: #e7f3ff !important;
}

.effect-preview-box {
    transition: transform 0.2s ease;
}

.chart-effect-applied {
    animation: pulse-effect 0.8s ease;
}

@keyframes pulse-effect {
    0% { transform: scale(1); }
    50% { transform: scale(1.02); }
    100% { transform: scale(1); }
}

.chart-preview-image {
    object-fit: contain;
}

.template-name {
    font-size: 0.8rem;
    font-weight: 500;
}

/* 100% Working Advanced CSS Hover Effects */
.hover-effect-float {
    transition: transform 0.4s cubic-bezier(0.165, 0.84, 0.44, 1), box-shadow 0.4s ease !important;
}
.hover-effect-float:hover {
    transform: translateY(-10px) !important;
    box-shadow: 0 15px 30px rgba(0,0,0,0.15) !important;
}

.hover-effect-zoom {
    transition: transform 0.4s cubic-bezier(0.165, 0.84, 0.44, 1), box-shadow 0.4s ease !important;
}
.hover-effect-zoom:hover {
    transform: scale(1.03) !important;
    box-shadow: 0 12px 24px rgba(0,0,0,0.12) !important;
}

.hover-effect-glow {
    transition: border-color 0.4s ease, box-shadow 0.4s ease !important;
}
.hover-effect-glow:hover {
    box-shadow: 0 0 20px rgba(59, 130, 246, 0.6) !important;
    border-color: #3b82f6 !important;
}
`;

if (typeof document !== 'undefined' && document.head && !document.getElementById('chart-effects-global-styles')) {
    const styleElement = document.createElement('style');
    styleElement.id = 'chart-effects-global-styles';
    styleElement.textContent = effectStyles;
    document.head.appendChild(styleElement);
}
