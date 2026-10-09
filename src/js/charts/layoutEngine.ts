// src/js/charts/layoutEngine.ts
// Professional Dashboard Layout & Spatial Architecture Engine
// Implements Executive BI F/Z-Pattern Hierarchy:
// Tier 1: Executive Strategic Memo / Banner Textbox (Top Horizon)
// Tier 2: Executive KPI Big Numbers & Trend Sparklines (Balanced Horizontal Tier)
// Tier 3: Primary Analytical Visualizations (Time-series / Core Comparative 2-Col Grid)
// Tier 4: Secondary Breakdown Visuals (Proportions, Treemap, Radar, Donut)
// Tier 5: Operational Footnotes & Notes

import { visualizations, addVisualization } from './charts.ts';
import { showMessage } from '../core/utils.ts';
import { createCustomTemplateCard } from './templateCards.ts';
import { createBox } from '../ui/editor.js';
import { filteredData, rawData, headers, saveDashboardSettings } from '../../store/DataHandler.ts';

declare const echarts: any;
declare const Plotly: any;

export interface ElementPositionOptions {
    target: string; // ID, title, label, or category ("kpi", "charts", "textbox", "all")
    top?: number | string;
    left?: number | string;
    width?: number | string;
    height?: number | string;
    zone?: 'header' | 'top' | 'kpi-row' | 'kpi' | 'main-left' | 'main-right' | 'bottom-left' | 'bottom-right' | 'full-width' | 'center';
}

export interface DashboardZoneCoordinates {
    top: number;
    left: number;
    width: number;
    height: number;
}

/**
 * Calculates responsive coordinates for semantic layout zones
 */
export function getZoneCoordinates(zone: string, containerWidth: number): DashboardZoneCoordinates {
    const margin = 15;
    const gap = 15;
    const halfWidth = Math.floor((containerWidth - (margin * 2) - gap) / 2);

    switch (zone) {
        case 'header':
        case 'top':
            return { top: margin, left: margin, width: containerWidth - (margin * 2), height: 110 };
        case 'kpi-row':
        case 'kpi':
            return { top: 140, left: margin, width: Math.floor((containerWidth - (margin * 2) - (gap * 3)) / 4), height: 195 };
        case 'main-left':
            return { top: 355, left: margin, width: halfWidth, height: 400 };
        case 'main-right':
            return { top: 355, left: margin + halfWidth + gap, width: halfWidth, height: 400 };
        case 'bottom-left':
            return { top: 775, left: margin, width: halfWidth, height: 360 };
        case 'bottom-right':
            return { top: 775, left: margin + halfWidth + gap, width: halfWidth, height: 360 };
        case 'full-width':
            return { top: 355, left: margin, width: containerWidth - (margin * 2), height: 420 };
        default:
            return { top: 140, left: margin, width: 350, height: 210 };
    }
}

/**
 * Sets the exact position and size of a specific element (chart, KPI card, or textbox)
 */
export async function setElementPosition(opts: ElementPositionOptions): Promise<boolean> {
    try {
        const container = document.getElementById('dashboardContent') || document.getElementById('visualizations') || document.body;
        const containerWidth = container.clientWidth || 1200;

        let targetTop = typeof opts.top === 'number' ? `${opts.top}px` : (opts.top || '');
        let targetLeft = typeof opts.left === 'number' ? `${opts.left}px` : (opts.left || '');
        let targetWidth = typeof opts.width === 'number' ? `${opts.width}px` : (opts.width || '');
        let targetHeight = typeof opts.height === 'number' ? `${opts.height}px` : (opts.height || '');

        if (opts.zone) {
            const zCoords = getZoneCoordinates(opts.zone, containerWidth);
            if (!targetTop) targetTop = `${zCoords.top}px`;
            if (!targetLeft) targetLeft = `${zCoords.left}px`;
            if (!targetWidth) targetWidth = `${zCoords.width}px`;
            if (!targetHeight) targetHeight = `${zCoords.height}px`;
        }

        const query = (opts.target || '').toLowerCase().trim();
        const isTextboxTarget = query === 'textbox' || query === 'text box' || query === 'text-box' || 
                               query === 'text bo' || query === 'text' || query === 'notes' || query === 'note' || 
                               query === 'header' || query === 'banner' || query === 'memo' || query === 'overview' ||
                               query === 'टेक्स्टबॉक्स' || query === 'टेक्स्ट बॉक्स' || query === 'टेक्स्ट' || query === 'कंटेंट' ||
                               query.includes('textbox') || query.includes('text box') || query.includes('text bo');
        const isKpiTarget = query === 'kpi' || query === 'kpis' || query === 'kpi card' || query === 'केपीआई' || 
                            query === 'sparkline' || query === 'gauge' || query === 'progress' || query === 'metric';
        const isChartTarget = query === 'chart' || query === 'charts' || query === 'चार्ट' || query === 'ग्राफ' || query === 'analytics';

        // Default textbox positioning to Header Zone if coordinates/zone were omitted
        if (isTextboxTarget && !opts.zone && !targetTop && !targetLeft) {
            const zCoords = getZoneCoordinates('header', containerWidth);
            targetTop = `${zCoords.top}px`;
            targetLeft = `${zCoords.left}px`;
            targetWidth = targetWidth || `${zCoords.width}px`;
            targetHeight = targetHeight || `${zCoords.height}px`;
        }

        let matchedCount = 0;

        // 1. Search in visualizations (charts + template cards)
        const matchedConfigs = visualizations.filter(v => {
            if (query === 'all') return true;
            if (isKpiTarget && (v.templateCategory === 'kpi' || v.templateCategory === 'sparkline' || v.templateCategory === 'gauge' || v.templateCategory === 'progress')) return true;
            if (isChartTarget && v.type !== 'template_card') return true;
            if (isTextboxTarget && (v.templateCategory === 'textbox' || (v as any).textboxStyle || (v.title && v.title.toLowerCase().includes('text')))) return true;
            if (v.id === opts.target || v.id === `container-${opts.target}` || `container-${v.id}` === opts.target) return true;
            if (v.title && v.title.toLowerCase().includes(query)) return true;
            if ((v as any).label && (v as any).label.toLowerCase().includes(query)) return true;
            return false;
        });

        matchedConfigs.forEach((config, idx) => {
            const el = document.getElementById(`container-${config.id}`);
            if (el) {
                let thisLeft = targetLeft;
                let thisTop = targetTop;
                let thisWidth = targetWidth;
                let thisHeight = targetHeight;

                // If multiple KPIs are being placed in the KPI row, distribute them across columns
                if (isKpiTarget && matchedConfigs.length > 1 && opts.zone === 'kpi-row') {
                    const margin = 15;
                    const gap = 15;
                    const colCount = Math.min(matchedConfigs.length, 4);
                    const kpiW = Math.floor((containerWidth - (margin * 2) - (gap * (colCount - 1))) / colCount);
                    const colIdx = idx % colCount;
                    const rowIdx = Math.floor(idx / colCount);
                    thisLeft = `${margin + (colIdx * (kpiW + gap))}px`;
                    thisTop = `${140 + (rowIdx * 215)}px`;
                    thisWidth = `${kpiW}px`;
                    thisHeight = `195px`;
                }

                if (thisTop) el.style.top = thisTop;
                if (thisLeft) el.style.left = thisLeft;
                if (thisWidth) el.style.width = thisWidth;
                if (thisHeight) el.style.height = thisHeight;
                el.style.transform = 'none';

                config.position = {
                    top: thisTop || config.position?.top || '100px',
                    left: thisLeft || config.position?.left || '100px'
                };
                if (thisWidth && thisHeight) {
                    config.size = { width: thisWidth, height: thisHeight };
                }

                // Trigger chart internal canvas resize
                triggerChartResize(config.id, parseInt(thisWidth || '350', 10), parseInt(thisHeight || '210', 10));
                matchedCount++;
            }
        });

        // 2. Search in standalone textboxes (.box)
        const boxes = Array.from(document.querySelectorAll('.box')) as HTMLElement[];
        boxes.forEach((box, idx) => {
            const boxText = box.textContent || '';
            const boxId = box.id || '';
            const isMatch = query === 'all' || isTextboxTarget || 
                            boxId === opts.target || 
                            boxText.toLowerCase().includes(query);

            if (isMatch) {
                // Ensure box is mounted in the dashboard container so its coordinates match charts/KPIs
                const dashContainer = document.getElementById('dashboardContent') || document.getElementById('visualizations');
                if (dashContainer && box.parentElement !== dashContainer) {
                    dashContainer.appendChild(box);
                }

                if (targetLeft || targetTop) {
                    let l = targetLeft ? parseInt(targetLeft, 10) : 15;
                    let t = targetTop ? parseInt(targetTop, 10) : 15;
                    if (boxes.length > 1 && !targetLeft) {
                        t += idx * 60;
                    }
                    box.style.transform = `translate(${l}px, ${t}px) rotate(0deg)`;
                    box.style.left = '0px';
                    box.style.top = '0px';
                }
                if (targetWidth) box.style.width = targetWidth;
                if (targetHeight) box.style.height = targetHeight;
                matchedCount++;
            }
        });

        // 3. Autonomous fallback: If user or agent asks to position a textbox and none exists yet, create it!
        if (matchedCount === 0 && isTextboxTarget) {
            console.log('[LayoutEngine] No existing textbox found, autonomously creating one at target position...');
            const zCoords = getZoneCoordinates(opts.zone || 'header', containerWidth);
            await createCustomTemplateCard({
                category: 'textbox',
                textboxStyle: 'gradient',
                label: 'Strategic Executive Overview',
                subLabel: 'Autonomous Intelligence Workspace',
                badge: 'Executive Note',
                value: 'Real-time performance indicators and operational benchmarks across active dimensions.',
                top: opts.top !== undefined ? opts.top : zCoords.top,
                left: opts.left !== undefined ? opts.left : zCoords.left,
                width: opts.width || `${zCoords.width}px`,
                height: opts.height || `${zCoords.height}px`,
                zone: opts.zone || 'header'
            });
            matchedCount++;
            await saveDashboardSettings();
            showMessage(`Created and positioned Executive Textbox at designated layout zone.`, 'success');
            return true;
        }

        if (typeof (window as any).saveCurrentState === 'function') {
            try { (window as any).saveCurrentState(); } catch (_) {}
        }

        if (matchedCount > 0) {
            await saveDashboardSettings();
            showMessage(`Repositioned ${matchedCount} element(s) to designated layout position.`, 'success');
            return true;
        } else {
            showMessage(`Target element "${opts.target}" not found on dashboard to reposition.`, 'warning');
            return false;
        }
    } catch (e: any) {
        console.error("Failed to set element position:", e);
        showMessage("Error repositioning dashboard element.", "danger");
        return false;
    }
}

/**
 * Triggers ECharts and Plotly canvas reflow
 */
function triggerChartResize(chartId: string, width?: number, height?: number) {
    const chartDom = document.getElementById(chartId);
    if (!chartDom) return;

    if (typeof echarts !== 'undefined') {
        const chartInstance = echarts.getInstanceByDom(chartDom);
        if (chartInstance && typeof chartInstance.resize === 'function') {
            try {
                if (!chartInstance.isDisposed()) {
                    chartInstance.resize();
                }
            } catch (e) {}
        }
    }

    if (typeof Plotly !== 'undefined' && width && height) {
        try {
            Plotly.relayout(chartDom, { width, height: Math.max(150, height - 60) });
        } catch (e) {}
    }
}

/**
 * Auto-arranges all elements on the dashboard following Executive BI Layout Principles
 * - Top Zone: Strategic Header / Executive Textbox Banner
 * - Top Tier: Executive KPI Big Numbers & Sparklines (Balanced Horizontal Grid)
 * - Middle Tier: Core Analytical Comparisons & Time-series (2-Column Wide Grid)
 * - Bottom Tier: Proportional, Distribution & Relationship Charts (Donut, Pie, Treemap, Radar)
 * - Footnotes: Additional textboxes / supplementary cards
 */
export async function arrangeDashboardProfessionally(): Promise<void> {
    try {
        const container = document.getElementById('dashboardContent') || document.getElementById('visualizations');
        if (!container) return;

        const containerWidth = container.clientWidth || 1200;
        const margin = 15;
        const gap = 15;

        // Collect all active elements
        const activeContainers = Array.from(document.querySelectorAll('.visualization-container')) as HTMLElement[];
        const standaloneBoxes = Array.from(document.querySelectorAll('.box')) as HTMLElement[];

        if (activeContainers.length === 0 && standaloneBoxes.length === 0) {
            showMessage("व्यवस्थित करने के लिए डैशबोर्ड पर कोई कार्ड नहीं मिला।", "warning");
            return;
        }

        // Categorize elements
        const headerTextboxes: Array<{ el: HTMLElement; config?: any }> = [];
        const kpiCards: Array<{ el: HTMLElement; config?: any }> = [];
        const primaryCharts: Array<{ el: HTMLElement; config: any }> = [];
        const secondaryCharts: Array<{ el: HTMLElement; config: any }> = [];
        const otherBoxes: HTMLElement[] = [];

        activeContainers.forEach(el => {
            const chartId = el.id.replace('container-', '');
            const config = visualizations.find(v => v.id === chartId);
            if (!config) return;

            if (config.templateCategory === 'textbox' || (config as any).textboxStyle) {
                headerTextboxes.push({ el, config });
            } else if (config.templateCategory === 'kpi' || config.templateCategory === 'sparkline' || config.templateCategory === 'gauge' || config.templateCategory === 'progress') {
                kpiCards.push({ el, config });
            } else {
                const type = (config.type || 'bar').toLowerCase();
                if (['line', 'area', 'bar', 'column', 'scatter', 'candlestick', 'waterfall'].includes(type)) {
                    primaryCharts.push({ el, config });
                } else {
                    secondaryCharts.push({ el, config });
                }
            }
        });

        // Add standalone boxes to headers or notes
        standaloneBoxes.forEach((b, idx) => {
            if (headerTextboxes.length === 0 && idx === 0) {
                headerTextboxes.push({ el: b });
            } else {
                otherBoxes.push(b);
            }
        });

        let currentY = margin;

        // =========================================================
        // 1. TIER 1: STRATEGIC HEADER / BANNER TEXTBOX
        // =========================================================
        if (headerTextboxes.length > 0) {
            const bannerWidth = containerWidth - (margin * 2);
            const bannerHeight = 110;

            headerTextboxes.forEach(item => {
                applyGeometry(item.el, item.config, margin, currentY, bannerWidth, bannerHeight);
                currentY += bannerHeight + gap;
            });
        }

        // =========================================================
        // 2. TIER 2: EXECUTIVE KPI HORIZON (SIDE-BY-SIDE HORIZONTAL ROW)
        // =========================================================
        if (kpiCards.length > 0) {
            const kpiCount = kpiCards.length;
            // Best practice: 3 to 4 KPIs per row for optimal executive scanning
            const cols = kpiCount <= 2 ? kpiCount : (kpiCount === 3 ? 3 : 4);
            const kpiWidth = Math.floor((containerWidth - (margin * 2) - (gap * (cols - 1))) / cols);
            const kpiHeight = 195;

            kpiCards.forEach((item, idx) => {
                const col = idx % cols;
                const row = Math.floor(idx / cols);
                const left = margin + col * (kpiWidth + gap);
                const top = currentY + row * (kpiHeight + gap);

                applyGeometry(item.el, item.config, left, top, kpiWidth, kpiHeight);
            });

            const kpiRows = Math.ceil(kpiCount / cols);
            currentY += kpiRows * (kpiHeight + gap) + 5;
        }

        // =========================================================
        // 3. TIER 3: PRIMARY ANALYTICS (2-COLUMN BALANCED GRID)
        // =========================================================
        if (primaryCharts.length > 0) {
            const cols = primaryCharts.length === 1 ? 1 : 2;
            const chartWidth = cols === 1 
                ? containerWidth - (margin * 2) 
                : Math.floor((containerWidth - (margin * 2) - gap) / 2);
            const chartHeight = 400;

            primaryCharts.forEach((item, idx) => {
                const col = idx % cols;
                const row = Math.floor(idx / cols);
                const left = margin + col * (chartWidth + gap);
                const top = currentY + row * (chartHeight + gap);

                applyGeometry(item.el, item.config, left, top, chartWidth, chartHeight);
            });

            const primaryRows = Math.ceil(primaryCharts.length / cols);
            currentY += primaryRows * (chartHeight + gap) + 5;
        }

        // =========================================================
        // 4. TIER 4: SECONDARY BREAKDOWN & RELATIONSHIP VISUALS
        // =========================================================
        if (secondaryCharts.length > 0) {
            const cols = secondaryCharts.length >= 3 ? 3 : (secondaryCharts.length === 2 ? 2 : 1);
            const chartWidth = Math.floor((containerWidth - (margin * 2) - (gap * (cols - 1))) / cols);
            const chartHeight = 360;

            secondaryCharts.forEach((item, idx) => {
                const col = idx % cols;
                const row = Math.floor(idx / cols);
                const left = margin + col * (chartWidth + gap);
                const top = currentY + row * (chartHeight + gap);

                applyGeometry(item.el, item.config, left, top, chartWidth, chartHeight);
            });

            const secondaryRows = Math.ceil(secondaryCharts.length / cols);
            currentY += secondaryRows * (chartHeight + gap) + 5;
        }

        // =========================================================
        // 5. TIER 5: NOTES & FOOTNOTES
        // =========================================================
        if (otherBoxes.length > 0) {
            otherBoxes.forEach(b => {
                const boxWidth = Math.min(420, containerWidth - (margin * 2));
                const boxHeight = 120;
                applyGeometry(b, undefined, margin, currentY, boxWidth, boxHeight);
                currentY += boxHeight + gap;
            });
        }

        // Update dashboard container minimum height
        container.style.minHeight = `${currentY + 60}px`;

        await saveDashboardSettings();
        showMessage("डैशबोर्ड को प्रोफेशनल एक्जीक्यूटिव लेआउट (KPI ऊपर, मुख्य चार्ट्स मध्य, ब्रेकडाउन नीचे) में व्यवस्थित किया गया!", "success");
    } catch (err) {
        console.error("Error in professional dashboard arrangement:", err);
        showMessage("प्रोफेशनल लेआउट व्यवस्थित करने में त्रुटि आई।", "danger");
    }
}

/**
 * Applies geometric bounds and triggers chart internal canvas reflow
 */
function applyGeometry(el: HTMLElement, config: any | undefined, left: number, top: number, width: number, height: number) {
    if (el.classList.contains('box')) {
        el.style.transform = `translate(${left}px, ${top}px) rotate(0deg)`;
        el.style.width = `${width}px`;
        el.style.height = `${height}px`;
        return;
    }

    el.style.left = `${left}px`;
    el.style.top = `${top}px`;
    el.style.width = `${width}px`;
    el.style.height = `${height}px`;

    if (config) {
        config.position = { top: `${top}px`, left: `${left}px` };
        config.size = { width: `${width}px`, height: `${height}px` };
        triggerChartResize(config.id, width, height);
    }
}

/**
 * Autonomous Professional Dashboard Designer:
 * Synthesizes a full enterprise-grade dashboard tailored to loaded dataset
 * Placing:
 * 1. Strategic Header Banner on Top
 * 2. 3-4 Key Metric KPI Cards & Sparklines on Horizon
 * 3. 2 High-impact Analytical Charts in Center 2-Column Grid
 * 4. 2 Secondary Breakdown & Share Charts on Bottom Horizon
 */
export async function designProfessionalDashboard(): Promise<void> {
    const container = document.getElementById('dashboardContent') || document.getElementById('visualizations');
    const containerWidth = container ? (container.clientWidth || 1200) : 1200;
    const margin = 15;
    const gap = 15;

    const data = filteredData.length > 0 ? filteredData : rawData;
    const sample = data && data[0] ? data[0] : {};
    const cols = headers && headers.length > 0 ? headers : Object.keys(sample);

    // Identify numerical, date/temporal, and categorical columns
    const numericCols: string[] = [];
    const dateCols: string[] = [];
    const categoryCols: string[] = [];

    cols.forEach(c => {
        const cLower = c.toLowerCase();
        const val = sample[c];
        const isNum = typeof val === 'number' || (!isNaN(Number(val)) && val !== '' && val !== null);
        
        if (cLower.includes('date') || cLower.includes('time') || cLower.includes('month') || cLower.includes('year') || cLower.includes('quarter') || cLower.includes('period')) {
            dateCols.push(c);
        } else if (isNum) {
            numericCols.push(c);
        } else {
            categoryCols.push(c);
        }
    });

    const primaryNum = numericCols[0] || 'Sales';
    const secondaryNum = numericCols[1] || numericCols[0] || 'Profit';
    const tertiaryNum = numericCols[2] || numericCols[0] || 'Volume';
    const primaryCat = categoryCols[0] || 'Region';
    const dateCol = dateCols[0] || primaryCat;

    // Calculate layout geometry
    const bannerWidth = containerWidth - (margin * 2);
    const kpiWidth = Math.floor((containerWidth - (margin * 2) - (gap * 3)) / 4);
    const halfWidth = Math.floor((containerWidth - (margin * 2) - gap) / 2);

    let currentY = margin;

    // 1. Executive Strategic Header Banner (Top Horizon)
    await createCustomTemplateCard({
        category: 'textbox',
        textboxStyle: 'gradient',
        label: '🚀 Executive Intelligence & Strategic Overview',
        subLabel: 'Enterprise Performance, Dynamic Growth Trajectory & Operational Insights',
        badge: 'LIVE DASHBOARD',
        value: `Unified analytical perspective across ${data.length || 100} active enterprise records.`,
        top: currentY,
        left: margin,
        width: `${bannerWidth}px`,
        height: '110px'
    });

    currentY += 110 + gap;

    // 2. Executive KPI Horizon (4 Balanced Cards Side-by-Side)
    // KPI 1: Primary Metric
    await createCustomTemplateCard({
        category: 'kpi',
        label: `Total ${primaryNum}`,
        column: primaryNum,
        aggregation: 'sum',
        currency: '₹',
        trend: 'up',
        trendValue: '+18.4% YoY',
        badge: 'Revenue Leader',
        color: '#4f46e5',
        subMetrics: [{ label: 'Target', value: '₹50L' }],
        top: currentY,
        left: margin,
        width: `${kpiWidth}px`,
        height: '195px'
    });

    // KPI 2: Secondary Metric
    await createCustomTemplateCard({
        category: 'kpi',
        label: `Net ${secondaryNum}`,
        column: secondaryNum,
        aggregation: 'sum',
        currency: '₹',
        trend: 'up',
        trendValue: '+14.2% MoM',
        badge: 'Profitability',
        color: '#059669',
        subMetrics: [{ label: 'Margin', value: '26.8%' }],
        top: currentY,
        left: margin + (kpiWidth + gap),
        width: `${kpiWidth}px`,
        height: '195px'
    });

    // KPI 3: Third Metric / Volume
    await createCustomTemplateCard({
        category: 'kpi',
        label: `Aggregate ${tertiaryNum}`,
        column: tertiaryNum,
        aggregation: 'sum',
        currency: '',
        trend: 'up',
        trendValue: '+8.9%',
        badge: 'Operational Scale',
        color: '#2563eb',
        subMetrics: [{ label: 'Pacing', value: 'Optimal' }],
        top: currentY,
        left: margin + (kpiWidth + gap) * 2,
        width: `${kpiWidth}px`,
        height: '195px'
    });

    // KPI 4: Velocity Trend Sparkline
    await createCustomTemplateCard({
        category: 'sparkline',
        sparklineType: 'line',
        label: `${primaryNum} Velocity Trend`,
        column: primaryNum,
        badge: '30-Day Momentum',
        color: '#10b981',
        trendValue: '↑ 14.8%',
        top: currentY,
        left: margin + (kpiWidth + gap) * 3,
        width: `${kpiWidth}px`,
        height: '195px'
    });

    currentY += 195 + gap;

    // 3. Middle Tier: 2 High-Impact Analytical Charts (Time-Series Trend + Primary Comparative)
    // Left: Time trend or main categorical bar
    await addVisualization(
        dateCol,
        [primaryNum],
        null,
        dateCols.length > 0 ? 'line' : 'bar',
        dateCols.length > 0 ? `${primaryNum} Trajectory over ${dateCol}` : `${primaryNum} by ${primaryCat}`
    );

    // Right: Secondary Comparative Bar / Column
    await addVisualization(
        primaryCat,
        [secondaryNum],
        null,
        'bar',
        `${secondaryNum} Performance across ${primaryCat}`
    );

    // 4. Bottom Tier: 2 Secondary Breakdown Visuals (Proportions + Distribution)
    // Left: Proportional Pie / Donut
    await addVisualization(
        primaryCat,
        [primaryNum],
        null,
        'pie',
        `${primaryNum} Distribution Share by ${primaryCat}`
    );

    // Right: Radar or Scatter or Treemap
    await addVisualization(
        primaryCat,
        [primaryNum, secondaryNum].filter((v, i, a) => a.indexOf(v) === i),
        null,
        'radar',
        `Operational Multi-Metric Benchmark`
    );

    // Re-align all new charts to their designated pixel boundaries
    setTimeout(() => {
        arrangeDashboardProfessionally();
    }, 400);

    showMessage("प्रोफेशनल एक्जीक्यूटिव डैशबोर्ड आर्किटेक्चर सफलतापूर्वक तैयार किया गया!", "success");
}

// Global exposure for interactive commands
if (typeof window !== 'undefined') {
    (window as any).arrangeDashboardProfessionally = arrangeDashboardProfessionally;
    (window as any).setElementPosition = setElementPosition;
    (window as any).designProfessionalDashboard = designProfessionalDashboard;
}
