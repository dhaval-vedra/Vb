// src/js/kpiSparklines.js
// Dynamic KPI Cards with SVG Sparkline Micro-Charts and Custom Theme Palette Generator

import { getDisplayData, getRawData, getHeaders } from '../../store/DataHandler.ts';
import { plotAll, chartGlobalSettings, visualizations } from './charts.ts';
import { showMessage } from '../core/utils.ts';
import { convertAllSelectsInContainer } from '../ui/customSelect.js';
import { t } from '../i18n/languageManager.ts';

// Global custom theme colors state
export let customPaletteColors = ['#0d6efd', '#4d96ff', '#6bcb77', '#ffd93d', '#f473b9'];

/**
 * Finds the most suitable numeric column for the core KPI Metric
 */
export function findBestNumericColumn(data, headersList) {
    if (!data || data.length === 0 || !headersList || headersList.length === 0) return null;
    
    // Priority keywords in column names
    const priorityKeywords = ['sales', 'revenue', 'amount', 'price', 'quantity', 'salary', 'value', 'cost', 'profit', 'total', 'राजस्व', 'बिक्री', 'कीमत', 'राशि'];
    let bestCol = null;
    let highestPriority = -1;
    
    for (const h of headersList) {
        const lowerH = String(h).toLowerCase();
        // Skip index/ID columns
        if (['id', 'sr', 'sr_no', 'index', 's.no', 'sno', 'क्रम'].some(k => lowerH === k)) continue;
        
        // Verify if sample values are numeric
        const sampleValues = data.slice(0, 100).map(r => Number(r[h])).filter(v => !isNaN(v));
        if (sampleValues.length > 0.7 * Math.min(100, data.length)) {
            const index = priorityKeywords.findIndex(p => lowerH.includes(p));
            if (index !== -1 && (highestPriority === -1 || index < highestPriority)) {
                highestPriority = index;
                bestCol = h;
            }
        }
    }
    
    // If no priority keyword col, pick the first numeric column
    if (!bestCol) {
        for (const h of headersList) {
            const lowerH = String(h).toLowerCase();
            if (['id', 'sr', 'sr_no', 'index', 's.no', 'sno', 'क्रम'].some(k => lowerH === k)) continue;
            const sampleValues = data.slice(0, 50).map(r => Number(r[h])).filter(v => !isNaN(v));
            if (sampleValues.length > 0.7 * Math.min(50, data.length)) {
                bestCol = h;
                break;
            }
        }
    }
    
    return bestCol;
}

/**
 * Generates smooth progression slices for weekly/monthly trends
 */
export function getDataSlices(data, colName) {
    if (!data || data.length === 0) return [10, 20, 15, 25, 18, 30, 22, 35]; // fallback premium wave
    
    const numPoints = 12; // 12 standard progression points
    const chunkSize = Math.max(1, Math.floor(data.length / numPoints));
    const result = [];
    
    for (let i = 0; i < numPoints; i++) {
        const start = i * chunkSize;
        const end = Math.min(data.length, (i + 1) * chunkSize);
        const chunk = data.slice(start, end);
        if (chunk.length === 0) continue;
        
        if (colName) {
            const values = chunk.map(r => parseFloat(r[colName])).filter(v => !isNaN(v));
            if (values.length > 0) {
                // Return average for smooth visualization
                const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
                result.push(avg);
            } else {
                result.push(0);
            }
        } else {
            // Just return count for row density
            result.push(chunk.length);
        }
    }
    
    // If we have fewer than 2 points, pad it
    while (result.length < 2) result.push(10);
    return result;
}

/**
 * Generates an SVG string representing a clean minimalist sparkline
 */
export function generateSparklineSvg(dataPoints, color = '#0d6efd', width = 110, height = 30) {
    const min = Math.min(...dataPoints);
    const max = Math.max(...dataPoints);
    const range = (max - min === 0) ? 1 : (max - min);
    
    const points = dataPoints.map((val, i) => {
        const x = (i / (dataPoints.length - 1)) * width;
        const y = height - ((val - min) / range) * (height - 6) - 3; // Pad margins
        return { x, y };
    });
    
    const lineD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
    const areaD = `${lineD} L ${width} ${height} L 0 ${height} Z`;
    
    const gradId = `sparkline-grad-${color.replace('#', '')}-${Math.floor(Math.random() * 10000)}`;
    
    return `
        <svg class="sparkline-svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="overflow: visible;">
            <defs>
                <linearGradient id="${gradId}" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="${color}" stop-opacity="0.30" />
                    <stop offset="100%" stop-color="${color}" stop-opacity="0.0" />
                </linearGradient>
            </defs>
            <path d="${areaD}" fill="url(#${gradId})" stroke="none" />
            <path d="${lineD}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            <circle cx="${points[points.length - 1].x.toFixed(1)}" cy="${points[points.length - 1].y.toFixed(1)}" r="3" fill="${color}" />
        </svg>
    `;
}

/**
 * Updates the dynamic KPI Cards on the dashboard with fresh stats and sparklines
 */
export function updateKPICards() {
    // KPI Cards section removed from dashboard per user request
    const kpiContainer = document.getElementById('kpiCardsSection');
    if (kpiContainer) {
        kpiContainer.remove();
    }
}

/**
 * Hex to RGB Helper
 */
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '13, 110, 253';
}

let currentPaletteSwatches = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export function renderPaletteSwatchesUI(colors) {
    if (colors && Array.isArray(colors) && colors.length > 0) {
        currentPaletteSwatches = [...colors];
    }

    const gridEl = document.getElementById('palette-swatches-grid');
    const countEl = document.getElementById('swatches-count');

    if (countEl) {
        countEl.textContent = currentPaletteSwatches.length;
    }

    if (!gridEl) return;

    gridEl.innerHTML = currentPaletteSwatches.map((colorHex, idx) => `
        <div class="swatch-item-card d-flex align-items-center gap-1.5 p-1 px-2 bg-white border rounded-3 shadow-xs" style="font-size: 0.72rem;">
            <input type="color" class="form-control form-control-color swatch-picker" data-index="${idx}" value="${colorHex}" style="width: 24px; height: 24px; padding: 0; border: none; border-radius: 4px; cursor: pointer;">
            <span class="fw-mono text-dark font-monospace" style="font-size: 0.7rem; min-width: 52px;">${colorHex.toUpperCase()}</span>
            <button type="button" class="btn btn-xs btn-link text-danger p-0 ms-1 btn-delete-swatch" data-index="${idx}" ${currentPaletteSwatches.length <= 2 ? 'disabled' : ''} title="रंग हटाएं" style="line-height: 1;">
                <i class="bi bi-x-circle-fill" style="font-size: 0.85rem;"></i>
            </button>
        </div>
    `).join('');

    // Attach swatch change listeners
    gridEl.querySelectorAll('.swatch-picker').forEach(input => {
        input.addEventListener('input', (e) => {
            const index = Number(e.target.dataset.index);
            const newHex = e.target.value;
            currentPaletteSwatches[index] = newHex;
            const textSpan = e.target.nextElementSibling;
            if (textSpan) textSpan.textContent = newHex.toUpperCase();
        });
    });

    // Attach delete listeners
    gridEl.querySelectorAll('.btn-delete-swatch').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const index = Number(btn.dataset.index);
            if (currentPaletteSwatches.length > 2) {
                currentPaletteSwatches.splice(index, 1);
                renderPaletteSwatchesUI(currentPaletteSwatches);
            }
        });
    });
}

/**
 * Applies custom color variables to root CSS for instant UI theme updates
 */
export function applyCustomThemeUI(primaryHex, customPaletteArray = null) {
    if (customPaletteArray && Array.isArray(customPaletteArray) && customPaletteArray.length > 0) {
        customPaletteColors = [...customPaletteArray];
    } else {
        customPaletteColors = [
            primaryHex,
            adjustColorBrightness(primaryHex, 20),
            adjustColorBrightness(primaryHex, -20),
            adjustColorBrightness(primaryHex, 40),
            adjustColorBrightness(primaryHex, -40)
        ];
    }
    currentPaletteSwatches = [...customPaletteColors];

    let styleEl = document.getElementById('theme-accent-styles');
    if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'theme-accent-styles';
        document.head.appendChild(styleEl);
    }
    
    styleEl.textContent = `
        :root {
            --bs-primary: ${primaryHex || customPaletteColors[0]} !important;
            --bs-primary-rgb: ${hexToRgb(primaryHex || customPaletteColors[0])} !important;
            --bs-link-color: ${primaryHex || customPaletteColors[0]} !important;
        }
        .text-primary { color: ${primaryHex || customPaletteColors[0]} !important; }
        .bg-primary { background-color: ${primaryHex || customPaletteColors[0]} !important; }
        .btn-primary { background-color: ${primaryHex || customPaletteColors[0]} !important; border-color: ${primaryHex || customPaletteColors[0]} !important; }
        .btn-primary:hover { background-color: ${adjustColorBrightness(primaryHex || customPaletteColors[0], -10)} !important; border-color: ${adjustColorBrightness(primaryHex || customPaletteColors[0], -10)} !important; }
        .border-primary { border-color: ${primaryHex || customPaletteColors[0]} !important; }
        .sidebar-brand .bg-primary {
            background-color: ${primaryHex || customPaletteColors[0]} !important;
            box-shadow: 0 4px 12px rgba(${hexToRgb(primaryHex || customPaletteColors[0])}, 0.4) !important;
        }
    `;

    // Apply color palette directly to active charts global settings
    chartGlobalSettings.colorPalette = customPaletteColors;
    chartGlobalSettings.colorPaletteName = 'custom';
    
    // Apply directly to all active chart configurations for single-click theme update across all charts!
    if (Array.isArray(visualizations)) {
        visualizations.forEach(v => {
            v.colorPalette = [...customPaletteColors];
            v.colorPaletteName = 'custom';
            if (v.color) v.color = customPaletteColors[0];
        });
    }
    
    // Save to local storage for persistence
    localStorage.setItem('themeAccent', 'custom');
    localStorage.setItem('customPrimaryHex', primaryHex || customPaletteColors[0]);
    localStorage.setItem('customPaletteArray', JSON.stringify(customPaletteColors));
    
    // Trigger chart plots update and kpi cards reload
    plotAll();
    updateKPICards();
    updatePalettePreview(customPaletteColors);
    renderPaletteSwatchesUI(customPaletteColors);
}

/**
 * Adjusts color brightness (lighter/darker hex generation)
 */
function adjustColorBrightness(hex, percent) {
    let R = parseInt(hex.substring(1, 3), 16);
    let G = parseInt(hex.substring(3, 5), 16);
    let B = parseInt(hex.substring(5, 7), 16);

    R = parseInt(R * (100 + percent) / 100);
    G = parseInt(G * (100 + percent) / 100);
    B = parseInt(B * (100 + percent) / 100);

    R = (R < 255) ? R : 255;
    G = (G < 255) ? G : 255;
    B = (B < 255) ? B : 255;

    R = (R > 0) ? R : 0;
    G = (G > 0) ? G : 0;
    B = (B > 0) ? B : 0;

    const rHex = R.toString(16).padStart(2, '0');
    const gHex = G.toString(16).padStart(2, '0');
    const bHex = B.toString(16).padStart(2, '0');

    return `#${rHex}${gHex}${bHex}`;
}

/**
 * Updates visual palette preview bullets in Sidebar
 */
function updatePalettePreview(colors) {
    const previewContainer = document.getElementById('palette-colors-preview');
    if (!previewContainer) return;
    
    previewContainer.innerHTML = colors.map(col => `
        <span class="rounded-circle d-inline-block shadow-sm" style="width: 18px; height: 18px; background-color: ${col}; border: 1px solid #fff;" title="${col}"></span>
    `).join(' ');
}

/**
 * Loads dynamic Google Fonts on-demand
 */
function ensureGoogleFontLoaded(fontFamily) {
    let fontId = 'font-' + fontFamily.toLowerCase().replace(/\s+/g, '-');
    if (document.getElementById(fontId)) return;
    
    let fontName = '';
    if (fontFamily === 'inter') fontName = 'Inter:wght@300;400;500;600;700';
    else if (fontFamily === 'space-grotesk') fontName = 'Space+Grotesk:wght@400;500;600;700';
    else if (fontFamily === 'jetbrains-mono') fontName = 'JetBrains+Mono:wght@400;500;600';
    else if (fontFamily === 'playfair-display') fontName = 'Playfair+Display:ital,wght@0,400;0,600;0,700;1,400';
    
    if (fontName) {
        const link = document.createElement('link');
        link.id = fontId;
        link.rel = 'stylesheet';
        link.href = `https://fonts.googleapis.com/css2?family=${fontName}&display=swap`;
        document.head.appendChild(link);
    }
}

/**
 * Applies layout style customizations (fonts, corner rounding, shadows)
 */
export function applyThemeCustomizations() {
    const font = localStorage.getItem('theme-font') || 'inter';
    const borderRadius = localStorage.getItem('theme-border-radius') || '12';
    const shadow = localStorage.getItem('theme-shadow') || 'soft';
    const isDark = document.body.classList.contains('dark-theme') || localStorage.getItem('theme') === 'dark';
    
    // Ensure font is loaded
    ensureGoogleFontLoaded(font);
    
    let cssFontFamily = '"Inter", sans-serif';
    if (font === 'space-grotesk') cssFontFamily = '"Space Grotesk", sans-serif';
    else if (font === 'jetbrains-mono') cssFontFamily = '"JetBrains Mono", monospace';
    else if (font === 'playfair-display') cssFontFamily = '"Playfair Display", serif';
    
    let cssShadow = 'none';
    if (isDark) {
        if (shadow === 'soft') {
            cssShadow = '0 4px 12px rgba(0, 0, 0, 0.4) !important';
        } else if (shadow === 'deep') {
            cssShadow = '0 10px 25px rgba(0, 0, 0, 0.6) !important';
        }
    } else {
        if (shadow === 'soft') {
            cssShadow = '0 4px 12px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02) !important';
        } else if (shadow === 'deep') {
            cssShadow = '0 12px 28px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04) !important';
        }
    }
    
    let customStyleEl = document.getElementById('theme-layout-custom-styles');
    if (!customStyleEl) {
        customStyleEl = document.createElement('style');
        customStyleEl.id = 'theme-layout-custom-styles';
        document.head.appendChild(customStyleEl);
    }
    
    customStyleEl.textContent = `
        body, .main-content-container, h1, h2, h3, h4, h5, h6, .card, .btn, .form-control, .form-select, p, span, th, td, a {
            font-family: ${cssFontFamily} !important;
        }
        .card, .chart-item, .section-card, .visualization-container {
            border-radius: ${borderRadius}px !important;
            box-shadow: ${cssShadow};
        }
        /* Ensure all card elements, chart items, section cards, and visualization containers can overflow so that dropdowns, tooltips, and popovers can render cleanly on top of the dashboard content */
        .card, .chart-item, .section-card, .visualization-container {
            overflow: visible !important;
        }
        
        /* Highlight Display Mode buttons specifically based on active light/dark state */
        #btn-theme-mode-light {
            background-color: ${!isDark ? '#e2e8f0 !important' : 'transparent !important'};
            border-color: ${!isDark ? 'var(--bs-primary) !important' : '#e2e8f0 !important'};
            color: ${!isDark ? '#212529 !important' : '#a1a1aa !important'};
            font-weight: ${!isDark ? 'bold !important' : 'normal !important'};
        }
        #btn-theme-mode-dark {
            background-color: ${isDark ? '#334155 !important' : 'transparent !important'};
            border-color: ${isDark ? 'var(--bs-primary) !important' : '#e2e8f0 !important'};
            color: ${isDark ? '#f8f9fa !important' : '#212529 !important'};
            font-weight: ${isDark ? 'bold !important' : 'normal !important'};
        }

        /* Dark mode card backgrounds adapter to ensure sidebar cards are beautifully dark slate */
        body.dark-theme .card, body.dark-theme .offcanvas, body.dark-theme .offcanvas-body {
            background-color: #1e293b !important;
            border-color: #334155 !important;
            color: #f8f9fa !important;
        }
        body.dark-theme .card p, body.dark-theme .card span, body.dark-theme .card label, body.dark-theme .card h6, body.dark-theme .card h5 {
            color: #cbd5e1 !important;
        }
        body.dark-theme .card-body {
            color: #f8f9fa !important;
        }
        body.dark-theme .btn-light {
            background-color: #334155 !important;
            border-color: #475569 !important;
            color: #f8f9fa !important;
        }
        body.dark-theme .btn-light:hover {
            background-color: #475569 !important;
            border-color: #64748b !important;
        }
        body.dark-theme .form-select {
            background-color: #1e293b !important;
            border-color: #334155 !important;
            color: #f8f9fa !important;
        }

        /* MultiDashboard inline tabs styling */
        #multiDashboardPanel {
            transition: all 0.2s ease;
        }
        #multiDashboardPanel .btn {
            transition: all 0.15s ease-in-out;
        }
        body.dark-theme #multiDashboardPanel .btn-light {
            background-color: #1e293b !important;
            border-color: #334155 !important;
            color: #cbd5e1 !important;
        }
        body.dark-theme #multiDashboardPanel .btn-light:hover {
            background-color: #334155 !important;
            color: #ffffff !important;
        }
        body.dark-theme #multiDashboardPanel .btn-outline-secondary {
            border-color: #475569 !important;
            color: #94a3b8 !important;
        }
        body.dark-theme #multiDashboardPanel .btn-outline-secondary:hover {
            background-color: #334155 !important;
            color: #ffffff !important;
        }
        body.dark-theme #quickDashboardPagesList {
            background-color: #1e293b !important;
            border-color: #334155 !important;
        }
        body.dark-theme #quickDashboardPagesList .dropdown-item {
            color: #e2e8f0 !important;
        }
        body.dark-theme #quickDashboardPagesList .dropdown-item:hover {
            background-color: #334155 !important;
        }

        /* Dashboard grid area container */
        #dashboardContent {
            transition: all 0.3s ease;
        }
        body.dark-theme #dashboardContent {
            border: none !important;
            background-color: #0f172a !important;
        }
        body:not(.dark-theme) #dashboardContent {
            border: none !important;
            background-color: #f8fafc !important;
        }

        /* DataTable section background support */
        body.dark-theme #dataTableSection {
            background-color: #1e293b !important;
            border-color: #334155 !important;
            color: #cbd5e1 !important;
        }
    `;
    
    // Also update UI display value for border radius slider and label
    const borderValSpan = document.getElementById('label-border-radius-val');
    if (borderValSpan) {
        borderValSpan.textContent = borderRadius + 'px';
    }
    const sliderInput = document.getElementById('slider-theme-border-radius');
    if (sliderInput) {
        sliderInput.value = borderRadius;
    }
    
    // Highlight Active Shadow Buttons
    document.querySelectorAll('.shadow-btn').forEach(btn => {
        const btnShadowVal = btn.getAttribute('data-shadow');
        if (btnShadowVal === shadow) {
            btn.classList.add('btn-primary');
            btn.classList.remove('btn-light');
            btn.style.color = '#ffffff';
        } else {
            btn.classList.remove('btn-primary');
            btn.classList.add('btn-light');
            btn.style.color = '';
        }
    });

    // Synchronize Font Dropdown Selector value
    const fontSelector = document.getElementById('theme-font-family-selector');
    if (fontSelector) {
        fontSelector.value = font;
    }
}

/**
 * Explicitly sets the dashboard display mode (light / dark)
 */
export function setThemeMode(mode) {
    const isDark = mode === 'dark';
    try {
        localStorage.setItem('theme', mode);
    } catch (e) {}

    const root = document.documentElement;
    const body = document.body;

    if (body) {
        body.classList.add('theme-transitioning');
    }
    
    if (isDark) {
        if (root) {
            root.classList.add('dark-theme');
            root.classList.remove('silk-light-theme');
            root.setAttribute('data-bs-theme', 'dark');
            root.style.colorScheme = 'dark';
        }
        if (body) {
            body.classList.add('dark-theme');
            body.classList.remove('silk-light-theme');
            body.setAttribute('data-bs-theme', 'dark');
        }
    } else {
        if (root) {
            root.classList.remove('dark-theme');
            root.classList.add('silk-light-theme');
            root.setAttribute('data-bs-theme', 'light');
            root.style.colorScheme = 'light';
        }
        if (body) {
            body.classList.remove('dark-theme');
            body.classList.add('silk-light-theme');
            body.setAttribute('data-bs-theme', 'light');
        }
    }
    
    const offcanvasSidebar = document.getElementById('offcanvasSidebar');
    if (offcanvasSidebar) {
        offcanvasSidebar.classList.toggle('dark-theme', isDark);
    }
    const offcanvasNav = document.getElementById('offcanvasNav');
    if (offcanvasNav) {
        offcanvasNav.classList.toggle('dark-theme', isDark);
    }
    
    const statTheme = document.getElementById('statActiveTheme');
    if (statTheme) {
        statTheme.textContent = isDark ? "डार्क थीम" : "सिल्क-लाइट";
    }

    const themeToggleIcons = document.querySelectorAll('.theme-toggle-icon, #themeToggleIcon');
    themeToggleIcons.forEach(icon => {
        if (isDark) {
            icon.className = 'bi bi-sun-fill text-warning';
        } else {
            icon.className = 'bi bi-moon-stars-fill text-secondary';
        }
    });
    
    applyThemeCustomizations();
    plotAll();

    window.dispatchEvent(new CustomEvent('themeChanged', {
        detail: { theme: mode, isDark }
    }));

    if (body) {
        setTimeout(() => {
            body.classList.remove('theme-transitioning');
        }, 300);
    }
    
    showMessage(`डिस्प्ले मोड बदला गया: ${isDark ? 'डार्क थीम' : 'सिल्क-लाइट मोड'}`, 'info');
}

/**
 * Initial setup for KPI Cards and Custom Palette Generator
 */
export function initializeKPIAndThemes() {
    // Apply dynamic layout customizations on load
    applyThemeCustomizations();

    // 1. Plot initial KPI Cards
    setTimeout(() => {
        updateKPICards();
    }, 500);

    // 2. Auto-load Custom theme on page boot if saved
    const savedAccent = localStorage.getItem('themeAccent');
    if (savedAccent === 'custom') {
        const customHex = localStorage.getItem('customPrimaryHex') || '#8b5cf6';
        applyCustomThemeUI(customHex);
    }
}

/**
 * Sets up the Custom Color Picker and Palette Generator layout in the profile sidebar
 */
/**
 * Initializes the new dedicated Dashboard Theme sidebar section
 */
export function initializeDashboardThemeSection() {
    // 1. Set initial accent theme states (circle highlights)
    const savedAccent = localStorage.getItem('themeAccent') || 'primary';
    updateAccentThemeButtonsHighlight(savedAccent);

    // 1.5 Update premium templates row highlights on load
    if (savedAccent === 'custom') {
        const savedCustomHex = localStorage.getItem('customPrimaryHex') || '#8b5cf6';
        updateTemplateRowHighlights(savedCustomHex);
    } else {
        updateTemplateRowHighlights('');
    }

    // 2. Add click handlers for theme accent selection
    document.querySelectorAll('.btn-accent-theme').forEach(btn => {
        btn.addEventListener('click', async () => {
            const accent = btn.getAttribute('data-theme-accent');
            if (accent) {
                localStorage.setItem('themeAccent', accent);
                const { applyAccentColor } = await import('../core/main.ts');
                applyAccentColor(accent);
                updateAccentThemeButtonsHighlight(accent);
                updateTemplateRowHighlights('');
                showMessage("थीम एक्सेंट सफलतापूर्वक बदला गया!", "success");
            }
        });
    });

    // 3. Set custom theme color picker and generated preview initial values
    const colorPicker = document.getElementById('custom-theme-picker');
    const savedCustomHex = localStorage.getItem('customPrimaryHex') || '#8b5cf6';
    if (colorPicker) {
        colorPicker.value = savedCustomHex;
        colorPicker.addEventListener('input', (e) => {
            const hex = e.target.value;
            const tempColors = [
                hex,
                adjustColorBrightness(hex, 20),
                adjustColorBrightness(hex, -20),
                adjustColorBrightness(hex, 40),
                adjustColorBrightness(hex, -40)
            ];
            updatePalettePreview(tempColors);
        });
    }

    // Palette Preview & Interactive Swatches
    const currentColors = JSON.parse(localStorage.getItem('customPaletteArray')) || [
        savedCustomHex,
        adjustColorBrightness(savedCustomHex, 20),
        adjustColorBrightness(savedCustomHex, -20),
        adjustColorBrightness(savedCustomHex, 40),
        adjustColorBrightness(savedCustomHex, -40)
    ];
    updatePalettePreview(currentColors);
    renderPaletteSwatchesUI(currentColors);

    // Add Swatch Button
    const btnAddSwatch = document.getElementById('btn-add-swatch');
    if (btnAddSwatch) {
        btnAddSwatch.addEventListener('click', () => {
            const lastColor = currentPaletteSwatches[currentPaletteSwatches.length - 1] || '#8b5cf6';
            const newColor = adjustColorBrightness(lastColor, currentPaletteSwatches.length % 2 === 0 ? 30 : -30);
            currentPaletteSwatches.push(newColor);
            renderPaletteSwatchesUI(currentPaletteSwatches);
        });
    }

    // Auto Harmony Button
    const btnGenerateHarmony = document.getElementById('btn-generate-harmony');
    if (btnGenerateHarmony) {
        btnGenerateHarmony.addEventListener('click', () => {
            const seedHex = document.getElementById('custom-theme-picker')?.value || '#8b5cf6';
            const harmonicArray = [
                seedHex,
                adjustColorBrightness(seedHex, 25),
                adjustColorBrightness(seedHex, -25),
                adjustColorBrightness(seedHex, 50),
                adjustColorBrightness(seedHex, -45)
            ];
            renderPaletteSwatchesUI(harmonicArray);
            showMessage("स्वचालित हारमनी पैलेट तैयार किया गया!", "info");
        });
    }

    // 4. Custom apply button click
    const btnApply = document.getElementById('btn-apply-custom-theme');
    if (btnApply) {
        btnApply.addEventListener('click', () => {
            const hex = document.getElementById('custom-theme-picker')?.value || currentPaletteSwatches[0];
            applyCustomThemeUI(hex, currentPaletteSwatches);
            updateTemplateRowHighlights(hex);
            updateAccentThemeButtonsHighlight('custom');
            showMessage("कस्टम ब्रांड पैलेट और थीम सफलतापूर्वक लागू की गई!", "success");
        });
    }

    // 5. Preset buttons clicks
    const presetBtns = document.querySelectorAll('.brand-preset-btn');
    presetBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const hex = btn.getAttribute('data-preset');
            const paletteAttr = btn.getAttribute('data-palette');
            let paletteArr = null;
            if (paletteAttr) {
                try {
                    paletteArr = JSON.parse(paletteAttr);
                } catch (e) {
                    paletteArr = null;
                }
            }
            if (!paletteArr) {
                paletteArr = [
                    hex,
                    adjustColorBrightness(hex, 20),
                    adjustColorBrightness(hex, -20),
                    adjustColorBrightness(hex, 40),
                    adjustColorBrightness(hex, -40)
                ];
            }
            if (colorPicker) colorPicker.value = hex;
            renderPaletteSwatchesUI(paletteArr);
            applyCustomThemeUI(hex, paletteArr);
            updateTemplateRowHighlights(hex);
            updateAccentThemeButtonsHighlight('custom');
            const schemeName = btn.getAttribute('data-scheme-name') || btn.textContent.trim();
            showMessage(`कलर स्कीम '${schemeName}' सभी एक्टिव चार्ट्स पर लागू की गई!`, "success");
        });
    });

    // 5.5 Premium Template rows clicks
    const templateRowBtns = document.querySelectorAll('.template-preset-row-btn');
    templateRowBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const primaryHex = btn.getAttribute('data-template-primary');
            const paletteArray = JSON.parse(btn.getAttribute('data-template-palette'));
            if (colorPicker) {
                colorPicker.value = primaryHex;
            }
            applyCustomThemeUI(primaryHex, paletteArray);
            updateTemplateRowHighlights(primaryHex);
            
            // Clear standard accent highlights
            updateAccentThemeButtonsHighlight('custom');
            
            showMessage(`प्रीमियम थीम '${btn.querySelector('span').textContent}' लागू की गई!`, "success");
        });
    });

    // 6. Reset button click: "theme को desbord की castom yani ki mull theme me reset karane ka Option ho"
    const btnReset = document.getElementById('btn-reset-custom-theme');
    if (btnReset) {
        btnReset.addEventListener('click', async () => {
            // Remove custom styling elements/classes and reset local storage
            localStorage.removeItem('themeAccent');
            localStorage.removeItem('customPrimaryHex');
            localStorage.removeItem('customPaletteArray');
            localStorage.removeItem('theme-font');
            localStorage.removeItem('theme-border-radius');
            localStorage.removeItem('theme-shadow');

            applyThemeCustomizations();

            // Reset chart colors back to classic
            chartGlobalSettings.colorPaletteName = 'classic';
            chartGlobalSettings.colorPalette = ['#5470C6', '#91CC75', '#EE6666', '#FC8452', '#73C0DE', '#3BA272', '#FACC14', '#9A60B4', '#EA7CCC'];

            // Clear the stylesheet overrides
            const styleEl = document.getElementById('theme-accent-styles');
            if (styleEl) {
                styleEl.remove();
            }

            // Restore primary accent via applyAccentColor (sets up base bootstrap color defaults)
            const { applyAccentColor } = await import('../core/main.ts');
            applyAccentColor('primary');

            // Set color picker and preview back to standard color (#0d6efd)
            if (colorPicker) {
                colorPicker.value = '#0d6efd';
            }
            updatePalettePreview(['#0d6efd', '#4d96ff', '#6bcb77', '#ffd93d', '#f473b9']);
            updateAccentThemeButtonsHighlight('primary');
            updateTemplateRowHighlights('');

            // Replot charts and update KPI cards
            plotAll();
            updateKPICards();

            showMessage("थीम को सफलतापूर्वक मूल सेटिंग पर रीसेट कर दिया गया है!", "success");
        });
    }

    // === NEW FEATURE 1: Theme Mode Switcher (Light/Dark) ===
    const btnLightTheme = document.getElementById('btn-theme-mode-light');
    const btnDarkTheme = document.getElementById('btn-theme-mode-dark');
    if (btnLightTheme && btnDarkTheme) {
        btnLightTheme.addEventListener('click', () => {
            setThemeMode('light');
        });
        btnDarkTheme.addEventListener('click', () => {
            setThemeMode('dark');
        });
    }

    // === NEW FEATURE 2: Typography (Font family Selector) ===
    const fontSelector = document.getElementById('theme-font-family-selector');
    if (fontSelector) {
        fontSelector.addEventListener('change', (e) => {
            const font = e.target.value;
            localStorage.setItem('theme-font', font);
            applyThemeCustomizations();
            
            let fontName = 'Inter';
            if (font === 'space-grotesk') fontName = 'Space Grotesk';
            else if (font === 'jetbrains-mono') fontName = 'JetBrains Mono';
            else if (font === 'playfair-display') fontName = 'Playfair Display';
            
            showMessage(`फॉन्ट स्टाइल बदला गया: ${fontName}`, "success");
        });
    }

    // === NEW FEATURE 3: Border Radius & Shadow Customizer ===
    const radiusSlider = document.getElementById('slider-theme-border-radius');
    if (radiusSlider) {
        radiusSlider.addEventListener('input', (e) => {
            const val = e.target.value;
            localStorage.setItem('theme-border-radius', val);
            applyThemeCustomizations();
        });
    }

    document.querySelectorAll('.shadow-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const val = btn.getAttribute('data-shadow');
            localStorage.setItem('theme-shadow', val);
            applyThemeCustomizations();
            showMessage(`कार्ड छाया प्रभाव बदला गया: ${val === 'none' ? 'कोई नहीं' : val === 'soft' ? 'हल्की छाया' : 'गहरी छाया'}`, "success");
        });
    });

    // Make sure initial state UI values are rendered on sidebar load
    applyThemeCustomizations();
}

export function updateTemplateRowHighlights(activePrimaryHex) {
    document.querySelectorAll('.template-preset-row-btn').forEach(btn => {
        const primary = btn.getAttribute('data-template-primary');
        if (activePrimaryHex && primary && primary.toLowerCase() === activePrimaryHex.toLowerCase()) {
            btn.style.borderColor = activePrimaryHex;
            btn.style.borderWidth = '2px';
            btn.style.backgroundColor = `rgba(${hexToRgb(activePrimaryHex)}, 0.08)`;
            btn.classList.add('shadow-sm');
        } else {
            btn.style.borderColor = '#e2e8f0';
            btn.style.borderWidth = '1px';
            btn.style.backgroundColor = '#ffffff';
            btn.classList.remove('shadow-sm');
        }
    });
}

function updateAccentThemeButtonsHighlight(accent) {
    document.querySelectorAll('.btn-accent-theme').forEach(btn => {
        if (btn.getAttribute('data-theme-accent') === accent) {
            btn.style.borderColor = '#ffffff';
            btn.style.boxShadow = '0 0 0 3px rgba(13, 110, 253, 0.5)';
        } else {
            btn.style.borderColor = 'transparent';
            btn.style.boxShadow = 'none';
        }
    });
}

/**
 * Generates and updates a real-time Live Preview card of the KPI card structure in the sidebar
 */
export function updateKpiLivePreview() {
    let metricCol = '';
    try {
        const previewBody = document.getElementById('kpiLivePreviewBody');
        if (!previewBody) return;

        const colSelect = document.getElementById('kpiMetricColumn');
        metricCol = colSelect ? colSelect.value : '';

        const titleInput = document.getElementById('kpiTitleInput');
        const aggSelect = document.getElementById('kpiAggregation');
        const sparkSelect = document.getElementById('kpiSparklineType');
        const styleSelect = document.getElementById('kpiCardStyle');
        const themeSelect = document.getElementById('kpiContainerTheme');
        const picker = document.getElementById('kpiColorPicker');

        const title = (titleInput && titleInput.value.trim()) || (metricCol ? `${metricCol}` : 'कुल रिकॉर्ड्स (Records)');
        const agg = aggSelect ? aggSelect.value : 'sum';
        const sparkType = sparkSelect ? sparkSelect.value : 'line';
        const kpiStyle = styleSelect ? styleSelect.value : 'minimal';
        const kpiTheme = themeSelect ? themeSelect.value : 'light';
        const kpiColor = picker ? picker.value : '#4f46e5';

        // Custom Sizing and Positioning inputs
        const widthVal = document.getElementById('kpiSparklineWidth') ? parseInt(document.getElementById('kpiSparklineWidth').value) : 110;
        const heightVal = document.getElementById('kpiSparklineHeight') ? parseInt(document.getElementById('kpiSparklineHeight').value) : 35;
        const positionVal = document.getElementById('kpiSparklinePosition') ? document.getElementById('kpiSparklinePosition').value : 'right';

        const rawData = getRawData() || [];
        const filteredData = getDisplayData() || [];
        const activeData = filteredData.length > 0 ? filteredData : rawData;

        let displayVal = "42,750";
        let rawValNum = 42750;
        let sparkPoints = [12, 19, 10, 26, 18, 32, 24, 35]; // fallback smooth wave

        if (activeData.length > 0) {
            if (metricCol) {
                const values = activeData.map(r => parseFloat(r[metricCol])).filter(v => !isNaN(v));
                if (values.length > 0) {
                    if (agg === 'sum') {
                        rawValNum = values.reduce((a, b) => a + b, 0);
                    } else if (agg === 'avg') {
                        rawValNum = values.reduce((a, b) => a + b, 0) / values.length;
                    } else if (agg === 'min') {
                        rawValNum = Math.min(...values);
                    } else if (agg === 'max') {
                        rawValNum = Math.max(...values);
                    } else if (agg === 'count') {
                        rawValNum = values.length;
                    }
                } else if (agg === 'count') {
                    rawValNum = activeData.length;
                }
                sparkPoints = getDataSlices(activeData, metricCol);
            } else {
                rawValNum = activeData.length;
                sparkPoints = getDataSlices(activeData, null);
            }
            
            if (rawValNum > 10000000) {
                displayVal = `${(rawValNum / 10000000).toFixed(2)}Cr`;
            } else if (rawValNum > 100000) {
                displayVal = `${(rawValNum / 100000).toFixed(2)}L`;
            } else if (rawValNum > 1000) {
                displayVal = `${(rawValNum / 1000).toFixed(1)}K`;
            } else {
                displayVal = rawValNum % 1 === 0 ? rawValNum.toString() : rawValNum.toFixed(2);
            }
        }

        const sparkSvg = generateCustomSparklineSvg(sparkPoints, sparkType, kpiColor, widthVal, heightVal);

        // Styling based on card background theme and accent style
        let cardBg = 'var(--bs-card-bg, #ffffff)';
        let cardBorder = '1px solid var(--bs-border-color, #e2e8f0)';
        let cardTextClass = 'text-dark';
        let cardSubTextClass = 'text-secondary';
        let hasCustomBlur = false;

        if (kpiTheme === 'dark-slate') {
            cardBg = '#1e293b';
            cardBorder = '1px solid #334155';
            cardTextClass = 'text-white';
            cardSubTextClass = 'text-slate-400';
        } else if (kpiTheme === 'royal-blue') {
            cardBg = 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)';
            cardBorder = '1px solid #3b82f6';
            cardTextClass = 'text-white';
            cardSubTextClass = 'text-blue-200';
        } else if (kpiTheme === 'emerald') {
            cardBg = 'linear-gradient(135deg, #064e3b 0%, #10b981 100%)';
            cardBorder = '1px solid #10b981';
            cardTextClass = 'text-white';
            cardSubTextClass = 'text-emerald-200';
        } else if (kpiTheme === 'sunset') {
            cardBg = 'linear-gradient(135deg, #7c2d12 0%, #f97316 100%)';
            cardBorder = '1px solid #f97316';
            cardTextClass = 'text-white';
            cardSubTextClass = 'text-orange-200';
        } else if (kpiTheme === 'purple-haze') {
            cardBg = 'linear-gradient(135deg, #4c1d95 0%, #8b5cf6 100%)';
            cardBorder = '1px solid #8b5cf6';
            cardTextClass = 'text-white';
            cardSubTextClass = 'text-purple-200';
        } else if (kpiTheme === 'glass-cyber') {
            cardBg = 'linear-gradient(135deg, rgba(30, 41, 59, 0.75) 0%, rgba(15, 23, 42, 0.8) 100%)';
            cardBorder = '1px solid rgba(139, 92, 246, 0.45)';
            cardTextClass = 'text-white';
            cardSubTextClass = 'text-indigo-200';
            hasCustomBlur = true;
        } else if (kpiTheme === 'custom-solid') {
            cardBg = kpiColor;
            cardBorder = '1px solid rgba(255, 255, 255, 0.2)';
            cardTextClass = 'text-white';
            cardSubTextClass = 'text-light opacity-75';
        }

        // Apply style highlight overrides
        if (kpiStyle === 'glass' && kpiTheme === 'light') {
            cardBg = 'linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.3) 100%)';
            cardBorder = '1px solid rgba(255,255,255,0.5)';
            hasCustomBlur = true;
        } else if (kpiStyle === 'accent') {
            cardBorder = `2.5px solid ${kpiColor}`;
        } else if (kpiStyle === 'dark-neon' && kpiTheme === 'light') {
            cardBg = '#1e293b';
            cardBorder = `1.5px solid ${kpiColor}`;
            cardTextClass = 'text-white';
            cardSubTextClass = 'text-slate-300';
        }

        const iconColor = (kpiTheme === 'light' && kpiStyle !== 'dark-neon') ? kpiColor : '#ffffff';
        const shadow = kpiTheme === 'glass-cyber' ? '0 0 15px rgba(139, 92, 246, 0.25)' : '0 4px 10px rgba(0,0,0,0.06)';
        const blurStyle = hasCustomBlur ? 'backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);' : '';

        const metricSubLabel = metricCol ? `${agg.toUpperCase()} • ${metricCol}` : 'कुल पंक्तियाँ (Row Count)';
        const titleSize = document.getElementById('kpiTitleSize') ? parseInt(document.getElementById('kpiTitleSize').value) : 12;
        const valueSize = document.getElementById('kpiValueSize') ? parseInt(document.getElementById('kpiValueSize').value) : 26;

        let innerCardContent = `
            <div class="d-flex flex-column h-100 justify-content-between p-1" style="box-sizing: border-box; height: 100%; width: 100%;">
                <div class="d-flex justify-content-between align-items-center mb-1" style="user-select: none;">
                    <span class="${cardSubTextClass} font-sans font-semibold text-truncate kpi-preview-title" style="max-width: 100%; font-size: ${titleSize}px;" title="${title}">
                        <i class="bi bi-tag-fill me-1.5" style="color: ${iconColor} !important;"></i>${title}
                    </span>
                </div>
                <div class="d-flex align-items-end justify-content-between mt-auto pb-0.5" style="overflow: hidden; gap: 8px;">
                    <div class="kpi-value-container text-start d-flex flex-column justify-content-end" style="overflow: hidden; flex: 1; min-width: 0;">
                        <h2 class="fw-extrabold mb-0.5 ${cardTextClass} kpi-preview-value" style="font-size: ${valueSize}px; letter-spacing: -0.5px; font-family: var(--font-sans); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.1;">${displayVal}</h2>
                        <span class="${cardSubTextClass} uppercase fw-semibold tracking-wider kpi-preview-sub" style="font-size: 0.58rem; letter-spacing: 0.5px; opacity: 0.8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                            ${metricSubLabel}
                        </span>
                    </div>
                    <div class="ms-auto d-flex align-items-end justify-content-end kpi-preview-sparkline-container" style="width: ${widthVal}px; height: ${heightVal}px; max-width: 125px; max-height: 45px; flex-shrink: 0;">
                        ${sparkSvg}
                    </div>
                </div>
            </div>
        `;

        previewBody.innerHTML = `
            <div id="kpiLivePreviewCard" class="w-100 p-2.5 position-relative overflow-hidden" style="background: ${cardBg}; border: ${cardBorder}; border-radius: 12px; box-shadow: ${shadow}; ${blurStyle} height: 110px; box-sizing: border-box; transition: all 0.3s ease;">
                ${innerCardContent}
            </div>
        `;

        // Mount a dynamic ResizeObserver for scaling typography inside the sidebar container nicely
        const previewCard = document.getElementById('kpiLivePreviewCard');
        if (previewCard) {
            previewCard._kpiObserver = new ResizeObserver((entries) => {
                for (let entry of entries) {
                    const { width, height } = entry.contentRect;
                    const titleEl = previewCard.querySelector('.kpi-preview-title');
                    const valEl = previewCard.querySelector('.kpi-preview-value');
                    const subEl = previewCard.querySelector('.kpi-preview-sub');
                    const sparkEl = previewCard.querySelector('.kpi-preview-sparkline-container');

                    if (titleEl) {
                        const titleSize = Math.max(9, Math.min(13, width * 0.052));
                        titleEl.style.fontSize = `${titleSize}px`;
                    }
                    if (valEl) {
                        const valSize = Math.max(15, Math.min(24, Math.min(width * 0.095, height * 0.28)));
                        valEl.style.fontSize = `${valSize}px`;
                    }
                    if (subEl) {
                        const subSize = Math.max(7.5, Math.min(10.5, width * 0.038));
                        subEl.style.fontSize = `${subSize}px`;
                    }
                    if (sparkEl) {
                        if (positionVal === 'background' || positionVal === 'bottom') {
                            sparkEl.style.width = '100%';
                            const maxH = Math.min(heightVal, height * 0.42);
                            sparkEl.style.height = `${maxH}px`;
                        } else {
                            const maxW = Math.min(widthVal, width * 0.45);
                            const maxH = Math.min(heightVal, height * 0.38);
                            sparkEl.style.width = `${maxW}px`;
                            sparkEl.style.height = `${maxH}px`;
                        }
                    }
                }
            });
            previewCard._kpiObserver.observe(previewCard);
        }
    } catch (e) {
        console.error("Error updating KPI preview:", e);
    }
}

/**
 * Synchronizes the visual state of custom icon-based button groups
 * with the underlying hidden form fields.
 */
export function syncKpiButtonUI() {
    const aggSelect = document.getElementById('kpiAggregation');
    const sparkSelect = document.getElementById('kpiSparklineType');
    const styleSelect = document.getElementById('kpiCardStyle');
    const posSelect = document.getElementById('kpiSparklinePosition');

    // Helper to style segmented control buttons
    const applySegmentStyle = (btn, isActive) => {
        if (isActive) {
            btn.classList.add('active');
            btn.style.backgroundColor = '#4f46e5';
            btn.style.color = '#ffffff';
            btn.style.fontWeight = '600';
            btn.style.boxShadow = '0 1px 3px rgba(79, 70, 229, 0.3)';
        } else {
            btn.classList.remove('active');
            btn.style.backgroundColor = 'transparent';
            btn.style.color = '';
            btn.style.fontWeight = 'normal';
            btn.style.boxShadow = 'none';
        }
    };

    // 1. Aggregation sync
    if (aggSelect) {
        const val = aggSelect.value || 'sum';
        const btns = document.querySelectorAll('#kpiAggregationButtons button');
        btns.forEach(btn => {
            applySegmentStyle(btn, btn.getAttribute('data-value') === val);
        });
    }

    // 2. Sparkline sync
    if (sparkSelect) {
        const val = sparkSelect.value || 'line';
        const btns = document.querySelectorAll('#kpiSparklineTypeButtons button');
        btns.forEach(btn => {
            applySegmentStyle(btn, btn.getAttribute('data-value') === val);
        });
    }

    // 3. Card Style sync
    if (styleSelect) {
        const val = styleSelect.value || 'minimal';
        const btns = document.querySelectorAll('#kpiCardStyleButtons button');
        btns.forEach(btn => {
            applySegmentStyle(btn, btn.getAttribute('data-value') === val);
        });
    }

    // 4. Container Theme sync
    const themeSelect = document.getElementById('kpiContainerTheme');
    if (themeSelect) {
        const val = themeSelect.value || 'light';
        const btns = document.querySelectorAll('#kpiContainerThemeButtons button');
        btns.forEach(btn => {
            if (btn.getAttribute('data-value') === val) {
                btn.classList.add('active');
                btn.style.outline = '2.5px solid #4f46e5';
                btn.style.outlineOffset = '2px';
                btn.style.transform = 'scale(1.15)';
                btn.style.zIndex = '5';
            } else {
                btn.classList.remove('active');
                btn.style.outline = 'none';
                btn.style.outlineOffset = '';
                btn.style.transform = 'none';
                btn.style.zIndex = '';
            }
        });
    }

    // 5. Sparkline Size sync
    const widthInput = document.getElementById('kpiSparklineWidth');
    const heightInput = document.getElementById('kpiSparklineHeight');
    if (widthInput) {
        const curW = widthInput.value || '110';
        const btns = document.querySelectorAll('#kpiSparklineSizeButtons button');
        btns.forEach(btn => {
            const btnW = btn.getAttribute('data-width');
            applySegmentStyle(btn, btnW === curW);
        });
        const dimLabel = document.getElementById('kpiSparklineDimLabel');
        if (dimLabel && heightInput) {
            dimLabel.textContent = `${curW} × ${heightInput.value || '35'} px`;
        }
    }

    // Text size label sync
    const titleSizeInput = document.getElementById('kpiTitleSize');
    const valueSizeInput = document.getElementById('kpiValueSize');
    const titleSizeValSpan = document.getElementById('kpiTitleSizeVal');
    const valueSizeValSpan = document.getElementById('kpiValueSizeVal');
    if (titleSizeInput && titleSizeValSpan) {
        titleSizeValSpan.textContent = `${titleSizeInput.value}px`;
    }
    if (valueSizeInput && valueSizeValSpan) {
        valueSizeValSpan.textContent = `${valueSizeInput.value}px`;
    }

    // Trigger dynamic live preview refresh
    updateKpiLivePreview();

    // Dispatch change events to sync custom select wrappers and color pickers with programmatic changes
    try {
        const colSelect = document.getElementById('kpiMetricColumn');
        const picker = document.getElementById('kpiColorPicker');
        if (colSelect) colSelect.dispatchEvent(new Event('change', { bubbles: true }));
        if (aggSelect) aggSelect.dispatchEvent(new Event('change', { bubbles: true }));
        if (sparkSelect) sparkSelect.dispatchEvent(new Event('change', { bubbles: true }));
        if (styleSelect) styleSelect.dispatchEvent(new Event('change', { bubbles: true }));
        if (themeSelect) themeSelect.dispatchEvent(new Event('change', { bubbles: true }));
        if (posSelect) posSelect.dispatchEvent(new Event('change', { bubbles: true }));
        if (picker) picker.dispatchEvent(new Event('change', { bubbles: true }));
    } catch (e) {
        console.warn("Error dispatching sync events inside syncKpiButtonUI:", e);
    }
}

/**
 * Initializes and manages the custom KPI column selector dropdown component
 */
export function initCustomKpiColumnDropdown() {
    try {
        const colSelect = document.getElementById('kpiMetricColumn');
        const trigger = document.getElementById('kpiCustomColTrigger');
        const dropdown = document.getElementById('kpiCustomColDropdown');
        const optionsList = document.getElementById('kpiCustomColOptionsList');
        const searchInput = document.getElementById('kpiCustomColSearch');
        const iconEl = document.getElementById('kpiCustomColIcon');
        const labelEl = document.getElementById('kpiCustomColLabel');
        const subEl = document.getElementById('kpiCustomColSub');
        const tagEl = document.getElementById('kpiCustomColTag');
        const chevronEl = document.getElementById('kpiCustomColChevron');
        const typeBadge = document.getElementById('kpiColumnTypeBadge');

        if (!colSelect || !trigger || !dropdown || !optionsList) return;

        const headersList = getHeaders() || [];
        const rawData = getRawData() || [];

        // Helper to detect if a column contains numeric values
        function getColumnMeta(colName) {
            if (!colName) return { type: 'count', icon: 'bi-hash', label: 'Count', desc: 'सभी पंक्तियों/रिकॉर्ड्स की कुल गिनती' };
            if (rawData.length === 0) return { type: 'numeric', icon: 'bi-123', label: 'Numeric', desc: 'संख्यात्मक डेटा मान' };

            let numCount = 0;
            let totalChecked = 0;
            for (let i = 0; i < Math.min(rawData.length, 60); i++) {
                const val = rawData[i][colName];
                if (val !== undefined && val !== null && val !== '') {
                    totalChecked++;
                    if (!isNaN(parseFloat(val)) && isFinite(val)) {
                        numCount++;
                    }
                }
            }

            const isNumeric = totalChecked > 0 && (numCount / totalChecked) >= 0.5;
            if (isNumeric) {
                return { type: 'numeric', icon: 'bi-123', label: 'Numeric', desc: 'संख्यात्मक मान • SUM/AVG/MIN/MAX हेतु उपयुक्त' };
            }
            return { type: 'text', icon: 'bi-fonts', label: 'Text/Category', desc: 'टेक्स्ट या श्रेणी मान • COUNT हेतु उपयुक्त' };
        }

        // Render option items in the dropdown
        function renderOptions(filterText = '') {
            optionsList.innerHTML = '';
            const currentVal = colSelect.value || '';
            const query = (filterText || '').toLowerCase().trim();

            // 1. Special "Row Count" option
            if (!query || 'पंक्ति गणना count all rows कुल रिकॉर्ड्स'.toLowerCase().includes(query)) {
                const isSelected = currentVal === '';
                const countOpt = document.createElement('div');
                countOpt.className = `custom-col-option p-2 px-2.5 d-flex align-items-center justify-content-between border-bottom border-slate-100 dark:border-slate-800/60 cursor-pointer ${isSelected ? 'bg-indigo-50/80 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-slate-700 dark:text-slate-200'}`;
                countOpt.style.cursor = 'pointer';
                countOpt.innerHTML = `
                    <div class="d-flex align-items-center gap-2 overflow-hidden">
                        <div class="rounded-2 ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'} d-flex align-items-center justify-content-center flex-shrink-0" style="width: 24px; height: 24px; font-size: 11px;">
                            <i class="bi bi-hash"></i>
                        </div>
                        <div class="text-truncate">
                            <div class="text-truncate" style="font-size: 11px; line-height: 1.2;">-- पंक्ति गणना (Count All Rows) --</div>
                            <span class="text-slate-400 dark:text-slate-500 d-block" style="font-size: 8.5px;">सभी पंक्तियों/रिकॉर्ड्स की गिनती</span>
                        </div>
                    </div>
                    <div class="d-flex align-items-center gap-1.5 flex-shrink-0">
                        <span class="badge bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-normal" style="font-size: 8px;">Count</span>
                        ${isSelected ? '<i class="bi bi-check2 text-indigo-600 dark:text-indigo-400 fw-bold fs-6"></i>' : ''}
                    </div>
                `;
                countOpt.addEventListener('click', (e) => {
                    e.stopPropagation();
                    selectColumn('');
                });
                optionsList.appendChild(countOpt);
            }

            // Categorize headers into numeric and text
            const numericCols = [];
            const otherCols = [];

            headersList.forEach(header => {
                const meta = getColumnMeta(header);
                if (meta.type === 'numeric') {
                    numericCols.push({ name: header, meta });
                } else {
                    otherCols.push({ name: header, meta });
                }
            });

            // 2. Numeric Columns Group
            const filteredNumeric = numericCols.filter(c => !query || c.name.toLowerCase().includes(query));
            if (filteredNumeric.length > 0) {
                const groupHeader = document.createElement('div');
                groupHeader.className = 'px-2.5 py-1 bg-slate-100/70 dark:bg-slate-950/80 text-slate-500 dark:text-slate-400 d-flex align-items-center justify-content-between border-bottom border-slate-200/60 dark:border-slate-800';
                groupHeader.style.fontSize = '9px';
                groupHeader.style.fontWeight = '600';
                groupHeader.innerHTML = `<span><i class="bi bi-calculator me-1 text-emerald-500"></i> संख्यात्मक कॉलम (Numeric - SUM/AVG)</span><span class="badge bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-normal" style="font-size: 8px;">${filteredNumeric.length}</span>`;
                optionsList.appendChild(groupHeader);

                filteredNumeric.forEach(({ name }) => {
                    const isSelected = currentVal === name;
                    const optDiv = document.createElement('div');
                    optDiv.className = `custom-col-option p-2 px-2.5 d-flex align-items-center justify-content-between border-bottom border-slate-100 dark:border-slate-800/60 cursor-pointer ${isSelected ? 'bg-indigo-50/80 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-slate-700 dark:text-slate-200'}`;
                    optDiv.style.cursor = 'pointer';
                    optDiv.innerHTML = `
                        <div class="d-flex align-items-center gap-2 overflow-hidden">
                            <div class="rounded-2 ${isSelected ? 'bg-indigo-600 text-white' : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'} d-flex align-items-center justify-content-center flex-shrink-0" style="width: 24px; height: 24px; font-size: 11px;">
                                <i class="bi bi-123"></i>
                            </div>
                            <div class="text-truncate">
                                <div class="text-truncate" style="font-size: 11px; line-height: 1.2;">${name}</div>
                                <span class="text-slate-400 dark:text-slate-500 d-block" style="font-size: 8.5px;">संख्यात्मक मान • गणना योग्य</span>
                            </div>
                        </div>
                        <div class="d-flex align-items-center gap-1.5 flex-shrink-0">
                            <span class="badge bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/50 font-normal" style="font-size: 8px;">Num</span>
                            ${isSelected ? '<i class="bi bi-check2 text-indigo-600 dark:text-indigo-400 fw-bold fs-6"></i>' : ''}
                        </div>
                    `;
                    optDiv.addEventListener('click', (e) => {
                        e.stopPropagation();
                        selectColumn(name);
                    });
                    optionsList.appendChild(optDiv);
                });
            }

            // 3. Text/Categorical Columns Group
            const filteredOther = otherCols.filter(c => !query || c.name.toLowerCase().includes(query));
            if (filteredOther.length > 0) {
                const groupHeader = document.createElement('div');
                groupHeader.className = 'px-2.5 py-1 bg-slate-100/70 dark:bg-slate-950/80 text-slate-500 dark:text-slate-400 d-flex align-items-center justify-content-between border-bottom border-slate-200/60 dark:border-slate-800';
                groupHeader.style.fontSize = '9px';
                groupHeader.style.fontWeight = '600';
                groupHeader.innerHTML = `<span><i class="bi bi-fonts me-1 text-slate-400"></i> अन्य कॉलम (Text / Categorical)</span><span class="badge bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 font-normal" style="font-size: 8px;">${filteredOther.length}</span>`;
                optionsList.appendChild(groupHeader);

                filteredOther.forEach(({ name }) => {
                    const isSelected = currentVal === name;
                    const optDiv = document.createElement('div');
                    optDiv.className = `custom-col-option p-2 px-2.5 d-flex align-items-center justify-content-between border-bottom border-slate-100 dark:border-slate-800/60 cursor-pointer ${isSelected ? 'bg-indigo-50/80 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-slate-700 dark:text-slate-200'}`;
                    optDiv.style.cursor = 'pointer';
                    optDiv.innerHTML = `
                        <div class="d-flex align-items-center gap-2 overflow-hidden">
                            <div class="rounded-2 ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'} d-flex align-items-center justify-content-center flex-shrink-0" style="width: 24px; height: 24px; font-size: 11px;">
                                <i class="bi bi-type"></i>
                            </div>
                            <div class="text-truncate">
                                <div class="text-truncate" style="font-size: 11px; line-height: 1.2;">${name}</div>
                                <span class="text-slate-400 dark:text-slate-500 d-block" style="font-size: 8.5px;">टेक्स्ट या श्रेणी मान</span>
                            </div>
                        </div>
                        <div class="d-flex align-items-center gap-1.5 flex-shrink-0">
                            <span class="badge bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-normal" style="font-size: 8px;">Text</span>
                            ${isSelected ? '<i class="bi bi-check2 text-indigo-600 dark:text-indigo-400 fw-bold fs-6"></i>' : ''}
                        </div>
                    `;
                    optDiv.addEventListener('click', (e) => {
                        e.stopPropagation();
                        selectColumn(name);
                    });
                    optionsList.appendChild(optDiv);
                });
            }

            if (filteredNumeric.length === 0 && filteredOther.length === 0 && query) {
                const emptyMsg = document.createElement('div');
                emptyMsg.className = 'p-3 text-center text-slate-400 text-xs';
                emptyMsg.innerHTML = '<i class="bi bi-search d-block mb-1 fs-5 opacity-50"></i>कोई कॉलम नहीं मिला';
                optionsList.appendChild(emptyMsg);
            }
        }

        // Selection handler
        function selectColumn(val) {
            colSelect.value = val;
            updateTriggerUI();
            closeDropdown();

            // Trigger standard input/change events
            colSelect.dispatchEvent(new Event('input', { bubbles: true }));
            colSelect.dispatchEvent(new Event('change', { bubbles: true }));
            updateKpiLivePreview();
        }

        // Update trigger button presentation
        function updateTriggerUI() {
            const val = colSelect.value || '';
            const meta = getColumnMeta(val);

            if (!val) {
                if (labelEl) labelEl.textContent = '-- पंक्ति गणना (Count All Rows) --';
                if (subEl) subEl.textContent = 'सभी पंक्तियों/रिकॉर्ड्स की कुल गिनती';
                if (tagEl) {
                    tagEl.textContent = 'Count';
                    tagEl.className = 'badge bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-normal px-1.5 py-0.5';
                }
                if (iconEl) {
                    iconEl.innerHTML = '<i class="bi bi-hash fs-6"></i>';
                    iconEl.className = 'rounded-2 bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 d-flex align-items-center justify-content-center flex-shrink-0';
                }
                if (typeBadge) {
                    typeBadge.innerHTML = '<i class="bi bi-hash me-0.5"></i> पंक्ति गणना';
                    typeBadge.className = 'badge bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60 px-1.5 py-0.5 rounded';
                }
            } else {
                if (labelEl) labelEl.textContent = val;
                if (subEl) subEl.textContent = meta.desc;
                if (tagEl) {
                    tagEl.textContent = meta.label;
                    if (meta.type === 'numeric') {
                        tagEl.className = 'badge bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 font-medium px-1.5 py-0.5';
                    } else {
                        tagEl.className = 'badge bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-normal px-1.5 py-0.5';
                    }
                }
                if (iconEl) {
                    if (meta.type === 'numeric') {
                        iconEl.innerHTML = '<i class="bi bi-123 fs-6"></i>';
                        iconEl.className = 'rounded-2 bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 d-flex align-items-center justify-content-center flex-shrink-0';
                    } else {
                        iconEl.innerHTML = '<i class="bi bi-fonts fs-6"></i>';
                        iconEl.className = 'rounded-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 d-flex align-items-center justify-content-center flex-shrink-0';
                    }
                }
                if (typeBadge) {
                    if (meta.type === 'numeric') {
                        typeBadge.innerHTML = '<i class="bi bi-calculator me-0.5"></i> संख्यात्मक (Numeric)';
                        typeBadge.className = 'badge bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 px-1.5 py-0.5 rounded';
                    } else {
                        typeBadge.innerHTML = '<i class="bi bi-type me-0.5"></i> टेक्स्ट (Text)';
                        typeBadge.className = 'badge bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded';
                    }
                }
            }
        }

        function toggleDropdown(e) {
            if (e) e.stopPropagation();
            const isOpen = !dropdown.classList.contains('d-none');
            if (isOpen) {
                closeDropdown();
            } else {
                renderOptions(searchInput ? searchInput.value : '');
                dropdown.classList.remove('d-none');
                trigger.classList.add('active');
                if (chevronEl) chevronEl.style.transform = 'rotate(180deg)';
                if (searchInput) {
                    setTimeout(() => searchInput.focus(), 50);
                }
            }
        }

        function closeDropdown() {
            dropdown.classList.add('d-none');
            trigger.classList.remove('active');
            if (chevronEl) chevronEl.style.transform = 'rotate(0deg)';
        }

        // Search listener
        if (searchInput) {
            searchInput.oninput = (e) => {
                renderOptions(e.target.value);
            };
            searchInput.onclick = (e) => e.stopPropagation();
        }

        // Trigger listener
        trigger.onclick = toggleDropdown;

        // Close on clicking outside
        document.addEventListener('click', (e) => {
            const container = document.getElementById('kpiColPickerContainer');
            if (container && !container.contains(e.target)) {
                closeDropdown();
            }
        });

        // Sync when native select changes
        colSelect.addEventListener('change', updateTriggerUI);

        // Initial trigger UI sync
        updateTriggerUI();
    } catch (err) {
        console.error("Error in initCustomKpiColumnDropdown:", err);
    }
}

/**
 * Initializes all events and controls for the KPI Builder Sidebar panel
 */
export function initializeKpiBuilder() {
    try {
        const headersList = getHeaders() || [];
        const colSelect = document.getElementById('kpiMetricColumn');
        if (colSelect) {
            // Keep the row count option and clear other old option fields
            colSelect.innerHTML = '<option value="">-- पंक्ति गणना (Count All Rows) --</option>';
            if (headersList.length > 0) {
                headersList.forEach(header => {
                    const opt = document.createElement('option');
                    opt.value = header;
                    opt.textContent = header;
                    colSelect.appendChild(opt);
                });
            }
        }

        // Initialize our sleek custom column picker
        initCustomKpiColumnDropdown();

        // Wire custom button groups events
        document.querySelectorAll('#kpiAggregationButtons button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const aggSelect = document.getElementById('kpiAggregation');
                if (aggSelect) {
                    aggSelect.value = e.currentTarget.getAttribute('data-value');
                    syncKpiButtonUI();
                }
            });
        });

        document.querySelectorAll('#kpiSparklineTypeButtons button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const sparkSelect = document.getElementById('kpiSparklineType');
                if (sparkSelect) {
                    sparkSelect.value = e.currentTarget.getAttribute('data-value');
                    syncKpiButtonUI();
                }
            });
        });

        document.querySelectorAll('#kpiCardStyleButtons button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const styleSelect = document.getElementById('kpiCardStyle');
                if (styleSelect) {
                    styleSelect.value = e.currentTarget.getAttribute('data-value');
                    syncKpiButtonUI();
                }
            });
        });

        document.querySelectorAll('#kpiContainerThemeButtons button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const themeSelect = document.getElementById('kpiContainerTheme');
                if (themeSelect) {
                    themeSelect.value = e.currentTarget.getAttribute('data-value');
                    syncKpiButtonUI();
                }
            });
        });

        // Wire up live preview handlers for direct text/select/color changes
        const titleInput = document.getElementById('kpiTitleInput');
        if (titleInput) {
            titleInput.addEventListener('input', updateKpiLivePreview);
        }
        if (colSelect) {
            colSelect.addEventListener('change', updateKpiLivePreview);
        }
        const picker = document.getElementById('kpiColorPicker');
        if (picker) {
            picker.addEventListener('input', updateKpiLivePreview);
            picker.addEventListener('change', updateKpiLivePreview);
        }

        // Wire sparkline size buttons
        document.querySelectorAll('#kpiSparklineSizeButtons button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const w = e.currentTarget.getAttribute('data-width');
                const h = e.currentTarget.getAttribute('data-height');
                const widthInput = document.getElementById('kpiSparklineWidth');
                const heightInput = document.getElementById('kpiSparklineHeight');
                const label = document.getElementById('kpiSparklineDimLabel');
                if (widthInput) widthInput.value = w;
                if (heightInput) heightInput.value = h;
                if (label) label.textContent = `${w} × ${h} px`;
                syncKpiButtonUI();
            });
        });

        // Wire range sliders
        const widthInput = document.getElementById('kpiSparklineWidth');
        const heightInput = document.getElementById('kpiSparklineHeight');
        const widthValSpan = document.getElementById('kpiSparklineWidthVal');
        const heightValSpan = document.getElementById('kpiSparklineHeightVal');
        const titleSizeInput = document.getElementById('kpiTitleSize');
        const valueSizeInput = document.getElementById('kpiValueSize');
        const titleSizeValSpan = document.getElementById('kpiTitleSizeVal');
        const valueSizeValSpan = document.getElementById('kpiValueSizeVal');

        if (widthInput) {
            widthInput.addEventListener('input', (e) => {
                if (widthValSpan) widthValSpan.textContent = `${e.target.value}px`;
                updateKpiLivePreview();
            });
        }
        if (heightInput) {
            heightInput.addEventListener('input', (e) => {
                if (heightValSpan) heightValSpan.textContent = `${e.target.value}px`;
                updateKpiLivePreview();
            });
        }
        if (titleSizeInput) {
            titleSizeInput.addEventListener('input', (e) => {
                if (titleSizeValSpan) titleSizeValSpan.textContent = `${e.target.value}px`;
                updateKpiLivePreview();
            });
        }
        if (valueSizeInput) {
            valueSizeInput.addEventListener('input', (e) => {
                if (valueSizeValSpan) valueSizeValSpan.textContent = `${e.target.value}px`;
                updateKpiLivePreview();
            });
        }

        // Initial sync of button UI
        syncKpiButtonUI();

        // Color dots click handler
        const palette = document.getElementById('kpiPaletteColors');
        if (palette) {
            palette.querySelectorAll('.color-dot').forEach(dot => {
                dot.addEventListener('click', (e) => {
                    const color = e.currentTarget.dataset.color;
                    const picker = document.getElementById('kpiColorPicker');
                    if (picker) {
                        picker.value = color;
                        picker.dispatchEvent(new Event('change', { bubbles: true }));
                        updateKpiLivePreview();
                    }
                });
            });
        }

        // Preset templates click handler
        const presets = document.querySelectorAll('.preset-card');
        presets.forEach(pCard => {
            pCard.addEventListener('click', (e) => {
                const type = e.currentTarget.dataset.presetType;
                
                // Switch tab to custom builder
                const customTabEl = document.getElementById('kpi-custom-tab');
                if (customTabEl) {
                    const tab = new bootstrap.Tab(customTabEl);
                    tab.show();
                }

                // Auto populate fields
                const bestCol = findBestNumericColumn(getDisplayData() || getRawData() || [], getHeaders() || []);
                const titleInput = document.getElementById('kpiTitleInput');
                const colSelect = document.getElementById('kpiMetricColumn');
                const aggSelect = document.getElementById('kpiAggregation');
                const sparkSelect = document.getElementById('kpiSparklineType');
                const styleSelect = document.getElementById('kpiCardStyle');
                const themeSelect = document.getElementById('kpiContainerTheme');
                const picker = document.getElementById('kpiColorPicker');

                // Reset sparkline position, width and height values
                const posSelect = document.getElementById('kpiSparklinePosition');
                if (posSelect) posSelect.value = 'right';
                const widthInput = document.getElementById('kpiSparklineWidth');
                if (widthInput) widthInput.value = 110;
                const widthValSpan = document.getElementById('kpiSparklineWidthVal');
                if (widthValSpan) widthValSpan.textContent = '110px';
                const heightInput = document.getElementById('kpiSparklineHeight');
                if (heightInput) heightInput.value = 35;
                const heightValSpan = document.getElementById('kpiSparklineHeightVal');
                if (heightValSpan) heightValSpan.textContent = '35px';

                if (type === 'row-count') {
                    if (titleInput) titleInput.value = 'कुल पंक्तियाँ';
                    if (colSelect) colSelect.value = '';
                    if (aggSelect) aggSelect.value = 'count';
                    if (sparkSelect) sparkSelect.value = 'area';
                    if (styleSelect) styleSelect.value = 'minimal';
                    if (themeSelect) themeSelect.value = 'royal-blue';
                    if (picker) picker.value = '#3b82f6';
                } else if (type === 'total-sum') {
                    if (titleInput) titleInput.value = bestCol ? `कुल ${bestCol}` : 'कुल योग';
                    if (colSelect) colSelect.value = bestCol || '';
                    if (aggSelect) aggSelect.value = 'sum';
                    if (sparkSelect) sparkSelect.value = 'line';
                    if (styleSelect) styleSelect.value = 'accent';
                    if (themeSelect) themeSelect.value = 'sunset';
                    if (picker) picker.value = '#f59e0b';
                } else if (type === 'avg-perf') {
                    if (titleInput) titleInput.value = bestCol ? `औसत ${bestCol}` : 'औसत प्रदर्शन';
                    if (colSelect) colSelect.value = bestCol || '';
                    if (aggSelect) aggSelect.value = 'avg';
                    if (sparkSelect) sparkSelect.value = 'area';
                    if (styleSelect) styleSelect.value = 'glass';
                    if (themeSelect) themeSelect.value = 'royal-blue';
                    if (picker) picker.value = '#8b5cf6';
                } else if (type === 'peak-val') {
                    if (titleInput) titleInput.value = bestCol ? `अधिकतम ${bestCol}` : 'शिखर मूल्य';
                    if (colSelect) colSelect.value = bestCol || '';
                    if (aggSelect) aggSelect.value = 'max';
                    if (sparkSelect) sparkSelect.value = 'bar';
                    if (styleSelect) styleSelect.value = 'dark-neon';
                    if (themeSelect) themeSelect.value = 'emerald';
                    if (picker) picker.value = '#10b981';
                } else if (type === 'growth-trend') {
                    if (titleInput) titleInput.value = bestCol ? `${bestCol} विकास दर` : 'विकास दर (Growth)';
                    if (colSelect) colSelect.value = bestCol || '';
                    if (aggSelect) aggSelect.value = 'avg';
                    if (sparkSelect) sparkSelect.value = 'line';
                    if (styleSelect) styleSelect.value = 'accent';
                    if (themeSelect) themeSelect.value = 'ocean';
                    if (picker) picker.value = '#06b6d4';
                } else if (type === 'conversion-rate') {
                    if (titleInput) titleInput.value = bestCol ? `${bestCol} दक्षता स्कोर` : 'दक्षता दर (Efficiency)';
                    if (colSelect) colSelect.value = bestCol || '';
                    if (aggSelect) aggSelect.value = 'max';
                    if (sparkSelect) sparkSelect.value = 'area';
                    if (styleSelect) styleSelect.value = 'dark-neon';
                    if (themeSelect) themeSelect.value = 'berry';
                    if (picker) picker.value = '#f43f5e';
                }

                const presetName = e.currentTarget.querySelector('.fw-bold')?.textContent || e.currentTarget.querySelector('.fw-extrabold')?.textContent || e.currentTarget.querySelector('span')?.textContent || 'Preset';
                showMessage(`टेम्पलेट '${presetName}' लोड किया गया! आप इसे अभी अनुकूलित या जोड़ सकते हैं।`, "info");
                syncKpiButtonUI();
            });
        });

        // Add / Update button handler
        const btnAdd = document.getElementById('btnAddKpiCard');
        if (btnAdd) {
            // Remove previous event listeners to avoid duplicates
            const newBtnAdd = btnAdd.cloneNode(true);
            btnAdd.parentNode.replaceChild(newBtnAdd, btnAdd);
            
            newBtnAdd.addEventListener('click', async () => {
                const titleInput = document.getElementById('kpiTitleInput');
                const colSelect = document.getElementById('kpiMetricColumn');
                const aggSelect = document.getElementById('kpiAggregation');
                const sparkSelect = document.getElementById('kpiSparklineType');
                const styleSelect = document.getElementById('kpiCardStyle');
                const themeSelect = document.getElementById('kpiContainerTheme');
                const picker = document.getElementById('kpiColorPicker');
                const posSelect = document.getElementById('kpiSparklinePosition');
                const widthInput = document.getElementById('kpiSparklineWidth');
                const heightInput = document.getElementById('kpiSparklineHeight');
                const titleSizeInput = document.getElementById('kpiTitleSize');
                const valueSizeInput = document.getElementById('kpiValueSize');

                const title = (titleInput && titleInput.value.trim()) || 'KPI Card';
                const metricCol = colSelect ? colSelect.value : '';
                const aggregation = aggSelect ? aggSelect.value : 'sum';
                const sparklineType = sparkSelect ? sparkSelect.value : 'line';
                const kpiStyle = styleSelect ? styleSelect.value : 'minimal';
                const kpiTheme = themeSelect ? themeSelect.value : 'light';
                const color = picker ? picker.value : '#8b5cf6';
                const sparklinePosition = posSelect ? posSelect.value : 'right';
                const sparklineWidth = widthInput ? parseInt(widthInput.value) : 110;
                const sparklineHeight = heightInput ? parseInt(heightInput.value) : 35;
                const kpiTitleSize = titleSizeInput ? parseInt(titleSizeInput.value) : 13;
                const kpiValueSize = valueSizeInput ? parseInt(valueSizeInput.value) : 28;

                const isEdit = !!window.editingKpiId;
                let chartConfig;

                if (isEdit) {
                    chartConfig = visualizations.find(v => v.id === window.editingKpiId);
                    if (!chartConfig) {
                        showMessage("संपादित किए जाने वाले KPI की खोज विफल रही!", "danger");
                        return;
                    }
                    chartConfig.title = title;
                    chartConfig.metricCol = metricCol;
                    chartConfig.aggregation = aggregation;
                    chartConfig.sparklineType = sparklineType;
                    chartConfig.kpiStyle = kpiStyle;
                    chartConfig.kpiTheme = kpiTheme;
                    chartConfig.color = color;
                    chartConfig.sparklinePosition = sparklinePosition;
                    chartConfig.sparklineWidth = sparklineWidth;
                    chartConfig.sparklineHeight = sparklineHeight;
                    chartConfig.kpiTitleSize = kpiTitleSize;
                    chartConfig.kpiValueSize = kpiValueSize;
                } else {
                    // Position calculations
                    let newTop = 150;
                    let newLeft = 50;
                    if (visualizations.length > 0) {
                        let maxBottom = 0;
                        visualizations.forEach(v => {
                            const top = parseFloat(v.position?.top) || 0;
                            const h = parseFloat(v.size?.height) || 160;
                            if (top + h > maxBottom) {
                                maxBottom = top + h;
                            }
                        });
                        newTop = maxBottom + 20;
                    }

                    chartConfig = {
                        id: `chart-kpi-${Date.now()}`,
                        title: title,
                        type: 'kpi_sparkline',
                        metricCol: metricCol,
                        aggregation: aggregation,
                        sparklineType: sparklineType,
                        kpiStyle: kpiStyle,
                        kpiTheme: kpiTheme,
                        color: color,
                        sparklinePosition: sparklinePosition,
                        sparklineWidth: sparklineWidth,
                        sparklineHeight: sparklineHeight,
                        kpiTitleSize: kpiTitleSize,
                        kpiValueSize: kpiValueSize,
                        size: { width: '310px', height: '145px' },
                        position: { top: `${newTop}px`, left: `${newLeft}px` },
                        columns: [metricCol || 'Row Count', 'dummy_y'] // Keep system validation safe
                    };
                    visualizations.push(chartConfig);
                }

                const { saveDashboardSettings } = await import('../../store/DataHandler.ts');
                await saveDashboardSettings();
                plotAll();

                if (isEdit) {
                    showMessage("KPI कार्ड सफलतापूर्वक अपडेट किया गया!", "success");
                    window.editingKpiId = null;
                    const cancelBtn = document.getElementById('btnCancelKpiEdit');
                    if (cancelBtn) cancelBtn.style.display = 'none';
                    newBtnAdd.innerHTML = '<i class="bi bi-plus-circle me-1.5"></i> नया KPI कार्ड जोड़ें (Add KPI Card)';
                } else {
                    showMessage("नया KPI कार्ड डैशबोर्ड पर जोड़ा गया! अब आप इसे रीसाइज और ड्रैग-ड्रॉप कर सकते हैं।", "success");
                }

                // Reset inputs
                const themeSelectReset = document.getElementById('kpiContainerTheme');
                if (titleInput) titleInput.value = '';
                if (colSelect) colSelect.value = '';
                if (aggSelect) aggSelect.value = 'sum';
                if (sparkSelect) sparkSelect.value = 'line';
                if (styleSelect) styleSelect.value = 'minimal';
                if (themeSelectReset) themeSelectReset.value = 'light';
                if (picker) picker.value = '#8b5cf6';
                if (posSelect) posSelect.value = 'right';
                if (widthInput) widthInput.value = 110;
                if (heightInput) heightInput.value = 35;
                if (titleSizeInput) titleSizeInput.value = 13;
                if (valueSizeInput) valueSizeInput.value = 28;
                const widthValSpanReset = document.getElementById('kpiSparklineWidthVal');
                const heightValSpanReset = document.getElementById('kpiSparklineHeightVal');
                const titleValSpanReset = document.getElementById('kpiTitleSizeVal');
                const valueValSpanReset = document.getElementById('kpiValueSizeVal');
                if (widthValSpanReset) widthValSpanReset.textContent = '110px';
                if (heightValSpanReset) heightValSpanReset.textContent = '35px';
                if (titleValSpanReset) titleValSpanReset.textContent = '13px';
                if (valueValSpanReset) valueValSpanReset.textContent = '28px';

                syncKpiButtonUI();
            });
        }

        // Cancel Edit handler
        const cancelBtn = document.getElementById('btnCancelKpiEdit');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                window.editingKpiId = null;
                cancelBtn.style.display = 'none';
                
                const titleInput = document.getElementById('kpiTitleInput');
                const colSelect = document.getElementById('kpiMetricColumn');
                const aggSelect = document.getElementById('kpiAggregation');
                const sparkSelect = document.getElementById('kpiSparklineType');
                const styleSelect = document.getElementById('kpiCardStyle');
                const themeSelect = document.getElementById('kpiContainerTheme');
                const picker = document.getElementById('kpiColorPicker');
                const posSelect = document.getElementById('kpiSparklinePosition');
                const widthInput = document.getElementById('kpiSparklineWidth');
                const heightInput = document.getElementById('kpiSparklineHeight');
                const titleSizeInput = document.getElementById('kpiTitleSize');
                const valueSizeInput = document.getElementById('kpiValueSize');
                const addBtn = document.getElementById('btnAddKpiCard');

                if (titleInput) titleInput.value = '';
                if (colSelect) colSelect.value = '';
                if (aggSelect) aggSelect.value = 'sum';
                if (sparkSelect) sparkSelect.value = 'line';
                if (styleSelect) styleSelect.value = 'minimal';
                if (themeSelect) themeSelect.value = 'light';
                if (picker) picker.value = '#8b5cf6';
                if (posSelect) posSelect.value = 'right';
                if (widthInput) widthInput.value = 110;
                if (heightInput) heightInput.value = 35;
                if (titleSizeInput) titleSizeInput.value = 13;
                if (valueSizeInput) valueSizeInput.value = 28;
                const widthValSpanReset = document.getElementById('kpiSparklineWidthVal');
                const heightValSpanReset = document.getElementById('kpiSparklineHeightVal');
                const titleValSpanCancel = document.getElementById('kpiTitleSizeVal');
                const valueValSpanCancel = document.getElementById('kpiValueSizeVal');
                if (widthValSpanReset) widthValSpanReset.textContent = '110px';
                if (heightValSpanReset) heightValSpanReset.textContent = '35px';
                if (titleValSpanCancel) titleValSpanCancel.textContent = '13px';
                if (valueValSpanCancel) valueValSpanCancel.textContent = '28px';

                if (addBtn) addBtn.innerHTML = '<i class="bi bi-plus-circle me-1.5"></i> नया KPI कार्ड जोड़ें (Add KPI Card)';
                
                syncKpiButtonUI();
                showMessage("KPI संपादन रद्द किया गया।", "info");
            });
        }

    } catch (error) {
        console.error("Error in initializeKpiBuilder:", error);
    }
}

/**
 * Beautiful Custom KPI Card Renderer
 */
export function renderCustomKpiCard(chartContainer, chartConfig, buttonsHTML) {
    try {
        const rawData = getRawData() || [];
        const filteredData = getDisplayData() || [];
        const activeData = filteredData.length > 0 ? filteredData : rawData;
        const metricCol = chartConfig.metricCol || '';
        const agg = chartConfig.aggregation || 'sum';
        const sparkType = chartConfig.sparklineType || 'line';
        const kpiColor = chartConfig.color || '#8b5cf6';
        const kpiStyle = chartConfig.kpiStyle || 'minimal';
        
        let displayVal = "0";
        let rawValNum = 0;
        let sparkPoints = [10, 15, 8, 25, 20, 30, 22, 28]; // fallback smooth wave

        if (activeData.length > 0) {
            if (metricCol) {
                const values = activeData.map(r => parseFloat(r[metricCol])).filter(v => !isNaN(v));
                if (values.length > 0) {
                    if (agg === 'sum') {
                        rawValNum = values.reduce((a, b) => a + b, 0);
                    } else if (agg === 'avg') {
                        rawValNum = values.reduce((a, b) => a + b, 0) / values.length;
                    } else if (agg === 'min') {
                        rawValNum = Math.min(...values);
                    } else if (agg === 'max') {
                        rawValNum = Math.max(...values);
                    } else if (agg === 'count') {
                        rawValNum = values.length;
                    }
                } else if (agg === 'count') {
                    rawValNum = activeData.length;
                }
                sparkPoints = getDataSlices(activeData, metricCol);
            } else {
                // count total rows
                rawValNum = activeData.length;
                sparkPoints = getDataSlices(activeData, null);
            }
            
            // Format display values professionally (Crores, Lakhs, Thousands, or default decimals)
            if (rawValNum > 10000000) {
                displayVal = `${(rawValNum / 10000000).toFixed(2)}Cr`;
            } else if (rawValNum > 100000) {
                displayVal = `${(rawValNum / 100000).toFixed(2)}L`;
            } else if (rawValNum > 1000) {
                displayVal = `${(rawValNum / 1000).toFixed(1)}K`;
            } else {
                displayVal = rawValNum % 1 === 0 ? rawValNum.toString() : rawValNum.toFixed(2);
            }
        }
        
        // Extract size & position configuration
        const widthVal = chartConfig.sparklineWidth !== undefined ? parseInt(chartConfig.sparklineWidth) : 110;
        const heightVal = chartConfig.sparklineHeight !== undefined ? parseInt(chartConfig.sparklineHeight) : 35;
        const positionVal = chartConfig.sparklinePosition || 'right';

        const titleSize = chartConfig.kpiTitleSize !== undefined ? parseInt(chartConfig.kpiTitleSize) : 13;
        const valueSize = chartConfig.kpiValueSize !== undefined ? parseInt(chartConfig.kpiValueSize) : 28;
        const kpiTextAlign = chartConfig.kpiTextAlign || 'left';

        const textPositionVal = chartConfig.kpiTextPosition || 'standard';
        const textPercentX = chartConfig.kpiTextPercentX !== undefined ? parseFloat(chartConfig.kpiTextPercentX) : 50;
        const textPercentY = chartConfig.kpiTextPercentY !== undefined ? parseFloat(chartConfig.kpiTextPercentY) : 45;
        const sparklinePercentX = chartConfig.sparklinePercentX !== undefined ? parseFloat(chartConfig.sparklinePercentX) : 50;
        const sparklinePercentY = chartConfig.sparklinePercentY !== undefined ? parseFloat(chartConfig.sparklinePercentY) : 55;

        // Build crisp native SVG sparkline
        const sparkSvg = generateCustomSparklineSvg(sparkPoints, sparkType, kpiColor, widthVal, heightVal);
        
        // Data verification info for Trust Tooltip
        const now = new Date();
        const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        const sourceName = metricCol ? `डेटा कॉलम: ${metricCol} (${agg.toUpperCase()})` : 'सिस्टम कुल रिकॉर्ड्स गणना';
        const trustTooltip = `डेटा स्रोत: ${sourceName} | अंतिम अपडेट: आज ${timeString} बजे | रिकॉर्ड्स: ${activeData.length}`;

        // Styling based on card background theme and accent style
        const kpiTheme = chartConfig.kpiTheme || 'light';
        let cardBg = 'var(--bs-card-bg, #ffffff)';
        let cardBorder = '1px solid rgba(226, 232, 240, 0.75)';
        const isBodyDark = document.body.classList.contains('dark-theme');
        let cardTextClass = isBodyDark ? 'text-white' : 'text-slate-900';
        let cardSubTextClass = isBodyDark ? 'text-slate-400' : 'text-slate-500';
        let hasCustomBlur = false;

        if (kpiTheme === 'dark-slate') {
            cardBg = '#1e293b';
            cardBorder = '1px solid #334155';
            cardTextClass = 'text-white';
            cardSubTextClass = 'text-slate-400';
        } else if (kpiTheme === 'royal-blue') {
            cardBg = 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)';
            cardBorder = '1px solid #3b82f6';
            cardTextClass = 'text-white';
            cardSubTextClass = 'text-blue-200';
        } else if (kpiTheme === 'emerald') {
            cardBg = 'linear-gradient(135deg, #064e3b 0%, #10b981 100%)';
            cardBorder = '1px solid #10b981';
            cardTextClass = 'text-white';
            cardSubTextClass = 'text-emerald-200';
        } else if (kpiTheme === 'sunset') {
            cardBg = 'linear-gradient(135deg, #7c2d12 0%, #f97316 100%)';
            cardBorder = '1px solid #f97316';
            cardTextClass = 'text-white';
            cardSubTextClass = 'text-orange-200';
        } else if (kpiTheme === 'purple-haze') {
            cardBg = 'linear-gradient(135deg, #4c1d95 0%, #8b5cf6 100%)';
            cardBorder = '1px solid #8b5cf6';
            cardTextClass = 'text-white';
            cardSubTextClass = 'text-purple-200';
        } else if (kpiTheme === 'glass-cyber') {
            cardBg = 'linear-gradient(135deg, rgba(30, 41, 59, 0.75) 0%, rgba(15, 23, 42, 0.8) 100%)';
            cardBorder = '1px solid rgba(139, 92, 246, 0.45)';
            cardTextClass = 'text-white';
            cardSubTextClass = 'text-indigo-200';
            hasCustomBlur = true;
        } else if (kpiTheme === 'custom-solid') {
            cardBg = kpiColor;
            cardBorder = '1px solid rgba(255, 255, 255, 0.2)';
            cardTextClass = 'text-white';
            cardSubTextClass = 'text-light opacity-75';
        }

        // Apply style highlight overrides
        if (kpiStyle === 'glass' && kpiTheme === 'light') {
            cardBg = 'linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.3) 100%)';
            cardBorder = '1px solid rgba(255,255,255,0.5)';
            hasCustomBlur = true;
        } else if (kpiStyle === 'accent') {
            cardBorder = `2px solid ${kpiColor} !important`;
        } else if (kpiStyle === 'dark-neon' && kpiTheme === 'light') {
            cardBg = '#1e293b';
            cardBorder = `1.5px solid ${kpiColor} !important`;
            cardTextClass = 'text-white';
            cardSubTextClass = 'text-slate-300';
        }

        // Apply styles safely on container without overwriting position coordinates
        chartContainer.style.background = cardBg;
        chartContainer.style.border = cardBorder;
        chartContainer.style.borderRadius = '14px';
        chartContainer.style.boxShadow = kpiTheme === 'glass-cyber' ? '0 0 15px rgba(139, 92, 246, 0.25)' : '0 1px 3px 0 rgba(15, 23, 42, 0.04)';
        
        if (hasCustomBlur) {
            chartContainer.style.backdropFilter = 'blur(12px)';
            chartContainer.style.webkitBackdropFilter = 'blur(12px)';
        } else {
            chartContainer.style.backdropFilter = '';
            chartContainer.style.webkitBackdropFilter = '';
        }

        chartContainer.classList.add('kpi-sparkline-card');
        
        // Define high-contrast icon color
        const iconColor = (kpiTheme === 'light' && kpiStyle !== 'dark-neon') ? kpiColor : '#ffffff';
        const accentBarHtml = `<div class="kpi-accent-bar" style="background: ${kpiColor};"></div>`;
        const trustBadgeHtml = `
            <span class="kpi-trust-badge ms-1" data-bs-toggle="tooltip" data-bs-placement="top" title="${trustTooltip}">
                <i class="bi bi-clock-history" style="font-size: 0.65rem;"></i>
                <span>${timeString}</span>
            </span>
        `;

        // Render unified, clean fixed right layout with reliable SVG sparkline
        const metricSubLabel = metricCol ? `${agg.toUpperCase()} • ${metricCol}` : 'कुल पंक्तियाँ (Row Count)';

        chartContainer.innerHTML = `
            ${accentBarHtml}
            <div class="d-flex flex-column h-100 justify-content-between p-3" style="box-sizing: border-box; height: 100%; width: 100%; min-height: 0;">
                <div class="d-flex justify-content-between align-items-center mb-1 flex-shrink-0" style="user-select: none;">
                    <span class="${cardSubTextClass} font-sans font-semibold text-truncate kpi-title-text d-inline-flex align-items-center" style="max-width: calc(100% - 60px); font-size: ${titleSize}px;" title="${trustTooltip}">
                        <i class="bi bi-tag-fill me-1.5" style="color: ${iconColor} !important;"></i>${chartConfig.title}
                        ${trustBadgeHtml}
                    </span>
                    <div class="chart-buttons">
                        ${buttonsHTML}
                    </div>
                </div>
                <div class="d-flex align-items-end justify-content-between gap-2 mt-auto" style="min-height: 0; width: 100%;">
                    <div class="kpi-value-container text-start d-flex flex-column justify-content-end" style="min-width: 0; flex: 1;">
                        <h2 class="fw-extrabold mb-0 ${cardTextClass} kpi-value-text" style="font-size: ${valueSize}px; letter-spacing: -0.5px; font-family: var(--font-sans); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.15;">${displayVal}</h2>
                        <span class="${cardSubTextClass} uppercase fw-semibold tracking-wider kpi-sub-text" style="font-size: 0.65rem; letter-spacing: 0.5px; opacity: 0.85; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block; margin-top: 2px;">
                            ${metricSubLabel}
                        </span>
                    </div>
                    <div class="sparkline-container d-flex align-items-center justify-content-end flex-shrink-0" style="width: ${widthVal}px; height: ${heightVal}px; min-width: 50px; min-height: 25px; overflow: visible;">
                        ${sparkSvg}
                    </div>
                </div>
            </div>
        `;

        // Setup dynamic automatic resize scaling for text and sparkline!
        if (!chartContainer._kpiObserver) {
            const baseTitle = chartConfig.kpiTitleSize !== undefined ? parseInt(chartConfig.kpiTitleSize) : 12;
            const baseVal = chartConfig.kpiValueSize !== undefined ? parseInt(chartConfig.kpiValueSize) : 26;
            const baseSparkW = chartConfig.sparklineWidth !== undefined ? parseInt(chartConfig.sparklineWidth) : 110;
            const baseSparkH = chartConfig.sparklineHeight !== undefined ? parseInt(chartConfig.sparklineHeight) : 35;

            chartContainer._kpiObserver = new ResizeObserver((entries) => {
                for (let entry of entries) {
                    const { width, height } = entry.contentRect;
                    if (width <= 0 || height <= 0) continue;

                    const titleEl = chartContainer.querySelector('.kpi-title-text');
                    const valEl = chartContainer.querySelector('.kpi-value-text');
                    const subEl = chartContainer.querySelector('.kpi-sub-text');
                    const sparkEl = chartContainer.querySelector('.sparkline-container');

                    // Calculate proportional scaling relative to default card size (280x125)
                    const scaleFactor = Math.min(width / 280, height / 125);
                    const scale = Math.max(0.65, Math.min(1.8, scaleFactor));

                    const dynTitle = Math.max(9, Math.min(22, Math.round(baseTitle * scale)));
                    const dynValue = Math.max(14, Math.min(54, Math.round(baseVal * scale)));
                    const dynSub = Math.max(8, Math.min(13, Math.round(9.5 * scale)));

                    if (titleEl) titleEl.style.fontSize = `${dynTitle}px`;
                    if (valEl) valEl.style.fontSize = `${dynValue}px`;
                    if (subEl) subEl.style.fontSize = `${dynSub}px`;

                    if (sparkEl) {
                        const maxW = Math.max(48, Math.min(width * 0.48, Math.round(baseSparkW * scale)));
                        const maxH = Math.max(22, Math.min(height * 0.52, Math.round(baseSparkH * scale)));
                        sparkEl.style.width = `${maxW}px`;
                        sparkEl.style.height = `${maxH}px`;
                        sparkEl.style.maxWidth = `${maxW}px`;
                        sparkEl.style.maxHeight = `${maxH}px`;
                    }
                }
            });
            chartContainer._kpiObserver.observe(chartContainer);
        }

        // Setup hover effect to reveal the standard delete/edit overlay buttons
        // Handled smoothly by CSS .kpi-sparkline-card:hover .chart-buttons

    } catch (error) {
        console.error("Error rendering custom KPI card:", error);
    }
}

/**
 * Creates internal drag and drop movement logic for KPI card text blocks and sparklines
 */
export function setupKpiInternalDragAndDrop(chartContainer, chartConfig) {
    const textBlock = chartContainer.querySelector('.kpi-text-block');
    const sparkContainer = chartContainer.querySelector('.sparkline-container');
    
    if (!textBlock && !sparkContainer) return;
    
    const handleDragStart = (e, element, type) => {
        // Only perform internal repositioning if the KPI layout popover is actively open for this card
        const activePopover = document.querySelector(`.kpi-layout-popover[data-chart-id="${chartConfig.id}"]`);
        if (!activePopover) {
            return;
        }

        // Prevent card dragging when specifically tuning internal layout with popover open
        e.stopPropagation();
        
        // If it's a right click, don't drag
        if (e.button && e.button !== 0) return;
        
        const isTouch = e.type.startsWith('touch');
        const startX = isTouch ? e.touches[0].clientX : e.clientX;
        const startY = isTouch ? e.touches[0].clientY : e.clientY;
        
        const rect = chartContainer.getBoundingClientRect();
        
        // Calculate current offsets in percentage
        let initPctX, initPctY;
        if (type === 'sparkline') {
            initPctX = chartConfig.sparklinePercentX !== undefined ? chartConfig.sparklinePercentX : 50;
            initPctY = chartConfig.sparklinePercentY !== undefined ? chartConfig.sparklinePercentY : 55;
        } else {
            initPctX = chartConfig.kpiTextPercentX !== undefined ? chartConfig.kpiTextPercentX : 50;
            initPctY = chartConfig.kpiTextPercentY !== undefined ? chartConfig.kpiTextPercentY : 45;
        }
        
        // Change cursor to indicate moving state
        element.style.cursor = 'grabbing';
        
        const onMouseMove = (moveEvt) => {
            const clientX = isTouch ? moveEvt.touches[0].clientX : moveEvt.clientX;
            const clientY = isTouch ? moveEvt.touches[0].clientY : moveEvt.clientY;
            
            const dx = clientX - startX;
            const dy = clientY - startY;
            
            // Convert pixel dx/dy to percentage of the container width/height
            const pctDx = (dx / rect.width) * 100;
            const pctDy = (dy / rect.height) * 100;
            
            let newPctX = Math.max(5, Math.min(95, initPctX + pctDx));
            let newPctY = Math.max(5, Math.min(95, initPctY + pctDy));
            
            // Update styles in real time
            element.style.left = `${newPctX}%`;
            element.style.top = `${newPctY}%`;
            element.style.transform = 'translate(-50%, -50%)';
            element.style.position = 'absolute';
            
            // Update matching slider inputs in popover if currently open for this KPI card
            const activePopover = document.querySelector(`.kpi-layout-popover[data-chart-id="${chartConfig.id}"]`);
            if (activePopover) {
                if (type === 'sparkline') {
                    const sliderX = activePopover.querySelector('#sparklineXSlider');
                    const sliderY = activePopover.querySelector('#sparklineYSlider');
                    const valX = activePopover.querySelector('#sparklineXVal');
                    const valY = activePopover.querySelector('#sparklineYVal');
                    if (sliderX) { sliderX.value = Math.round(newPctX); if (valX) valX.textContent = `${Math.round(newPctX)}%`; }
                    if (sliderY) { sliderY.value = Math.round(newPctY); if (valY) valY.textContent = `${Math.round(newPctY)}%`; }
                    
                    const posSelect = activePopover.querySelector('#popoverSparklinePosition');
                    if (posSelect) {
                        posSelect.value = 'custom';
                        const coords = activePopover.querySelector('#customSparklineCoordinates');
                        if (coords) coords.style.display = 'block';
                    }
                } else {
                    const sliderX = activePopover.querySelector('#textXSlider');
                    const sliderY = activePopover.querySelector('#textYSlider');
                    const valX = activePopover.querySelector('#textXVal');
                    const valY = activePopover.querySelector('#textYVal');
                    if (sliderX) { sliderX.value = Math.round(newPctX); if (valX) valX.textContent = `${Math.round(newPctX)}%`; }
                    if (sliderY) { sliderY.value = Math.round(newPctY); if (valY) valY.textContent = `${Math.round(newPctY)}%`; }
                    
                    const posSelect = activePopover.querySelector('#popoverTextPosition');
                    if (posSelect) {
                        posSelect.value = 'custom';
                        const coords = activePopover.querySelector('#customTextCoordinates');
                        if (coords) coords.style.display = 'block';
                    }
                }
            }
        };
        
        const onMouseUp = async () => {
            element.style.cursor = 'grab';
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            document.removeEventListener('touchmove', onMouseMove);
            document.removeEventListener('touchend', onMouseUp);
            
            // Get final percentages
            const finalLeftPct = parseFloat(element.style.left);
            const finalTopPct = parseFloat(element.style.top);
            
            if (!isNaN(finalLeftPct) && !isNaN(finalTopPct)) {
                if (type === 'sparkline') {
                    chartConfig.sparklinePosition = 'custom';
                    chartConfig.sparklinePercentX = Math.round(finalLeftPct);
                    chartConfig.sparklinePercentY = Math.round(finalTopPct);
                } else {
                    chartConfig.kpiTextPosition = 'custom';
                    chartConfig.kpiTextPercentX = Math.round(finalLeftPct);
                    chartConfig.kpiTextPercentY = Math.round(finalTopPct);
                }
                
                // Immediately re-render the KPI card to lock the elements in their absolute positions
                renderCustomKpiCard(chartContainer, chartConfig, generateKpiButtonsHTML(chartConfig));
                
                // Save settings
                const { saveDashboardSettings } = await import('../../store/DataHandler.ts');
                await saveDashboardSettings();
            }
        };
        
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
        document.addEventListener('touchmove', onMouseMove, { passive: true });
        document.addEventListener('touchend', onMouseUp);
    };
    
    if (sparkContainer) {
        sparkContainer.addEventListener('mousedown', (e) => handleDragStart(e, sparkContainer, 'sparkline'));
        sparkContainer.addEventListener('touchstart', (e) => handleDragStart(e, sparkContainer, 'sparkline'), { passive: true });
    }
    
    if (textBlock) {
        textBlock.addEventListener('mousedown', (e) => handleDragStart(e, textBlock, 'text'));
        textBlock.addEventListener('touchstart', (e) => handleDragStart(e, textBlock, 'text'), { passive: true });
    }
}

/**
 * Renders a highly responsive layout settings control popup next to the card
 */
export function showKpiLayoutPopover(button, chartConfig, chartContainer) {
    // Remove any existing layout popovers first to prevent duplicates
    const existing = document.querySelector('.kpi-layout-popover');
    if (existing) {
        existing.remove();
    }
    
    const popover = document.createElement('div');
    popover.className = 'kpi-layout-popover card border-slate-200 dark:border-slate-700 shadow-xl p-3 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-xl';
    popover.setAttribute('data-chart-id', chartConfig.id);
    popover.style.cssText = `
        position: absolute;
        z-index: 1050;
        width: 320px;
        font-size: 0.82rem;
        box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1);
        border: 1px solid rgba(148, 163, 184, 0.2);
    `;
    
    // Get button and viewport bounds to position popover intelligently
    const btnRect = button.getBoundingClientRect();
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    // Position popover to the right of the button/card or below if not enough space
    let leftPos = btnRect.right + scrollLeft + 10;
    let topPos = btnRect.top + scrollTop - 30;
    
    // Viewport overflow checks
    if (leftPos + 320 > window.innerWidth) {
        leftPos = btnRect.left + scrollLeft - 330; // Place on the left
    }
    if (leftPos < 0) {
        leftPos = Math.max(10, btnRect.left + scrollLeft); // Fallback align left
        topPos = btnRect.bottom + scrollTop + 10; // Underneath
    }
    
    popover.style.left = `${leftPos}px`;
    popover.style.top = `${topPos}px`;
    
    // Read current values
    const titleSize = chartConfig.kpiTitleSize !== undefined ? parseInt(chartConfig.kpiTitleSize) : 13;
    const valueSize = chartConfig.kpiValueSize !== undefined ? parseInt(chartConfig.kpiValueSize) : 28;
    const kpiTextAlign = chartConfig.kpiTextAlign || 'left';
    
    const textPositionVal = chartConfig.kpiTextPosition || 'standard';
    const textPercentX = chartConfig.kpiTextPercentX !== undefined ? parseFloat(chartConfig.kpiTextPercentX) : 50;
    const textPercentY = chartConfig.kpiTextPercentY !== undefined ? parseFloat(chartConfig.kpiTextPercentY) : 45;
    
    const positionVal = chartConfig.sparklinePosition || 'right';
    const sparkType = chartConfig.sparklineType || 'line';
    const widthVal = chartConfig.sparklineWidth !== undefined ? parseInt(chartConfig.sparklineWidth) : 110;
    const heightVal = chartConfig.sparklineHeight !== undefined ? parseInt(chartConfig.sparklineHeight) : 35;
    const sparklinePercentX = chartConfig.sparklinePercentX !== undefined ? parseFloat(chartConfig.sparklinePercentX) : 50;
    const sparklinePercentY = chartConfig.sparklinePercentY !== undefined ? parseFloat(chartConfig.sparklinePercentY) : 55;
    
    popover.innerHTML = `
        <div class="d-flex align-items-center justify-content-between mb-2 border-bottom pb-1 border-slate-100 dark:border-slate-800">
            <h6 class="mb-0 fw-bold d-flex align-items-center gap-1.5" style="font-size: 0.82rem;">
                <i class="bi bi-sliders text-primary"></i> ${t('kpi.layoutSettings', 'Layout Settings')}
            </h6>
            <button class="btn btn-xs btn-link text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 btnCloseKpiPopover p-0 d-flex align-items-center justify-content-center border-0" type="button" style="width: 20px; height: 20px; border-radius: 50%;"><i class="bi bi-x-lg" style="font-size: 11px;"></i></button>
        </div>

        <!-- Custom Compact Tab Nav for Popover -->
        <div class="d-flex bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg mb-2 border border-slate-200/50 dark:border-slate-700/60" style="gap: 2px;">
            <button type="button" class="btn btn-xs flex-grow-1 py-1 d-flex align-items-center justify-content-center gap-1 border-0" id="popoverTabTypography" style="font-size: 0.72rem; font-weight: 500; border-radius: 6px;">
                <i class="bi bi-fonts"></i> ${t('kpi.text', 'Text')}
            </button>
            <button type="button" class="btn btn-xs flex-grow-1 py-1 d-flex align-items-center justify-content-center gap-1 border-0" id="popoverTabSparkline" style="font-size: 0.72rem; font-weight: 500; border-radius: 6px;">
                <i class="bi bi-activity"></i> ${t('kpi.chart', 'Chart')}
            </button>
            <button type="button" class="btn btn-xs flex-grow-1 py-1 d-flex align-items-center justify-content-center gap-1 border-0" id="popoverTabDrag" style="font-size: 0.72rem; font-weight: 500; border-radius: 6px;">
                <i class="bi bi-arrows-move"></i> ${t('kpi.position', 'Position')}
            </button>
        </div>

        <div class="popover-tab-content">
            <!-- TAB 1: TYPOGRAPHY -->
            <div id="popoverContentTypography">
                <!-- Font Sizes -->
                <div class="mb-2">
                    <label class="d-flex justify-content-between text-muted mb-0.5" style="font-size: 0.72rem;">
                        <span><i class="bi bi-type-h1 me-1 text-primary"></i>${t('kpi.titleSize', 'Title Size')}:</span>
                        <span id="titleSizeVal" class="fw-bold text-primary">${titleSize}px</span>
                    </label>
                    <input type="range" id="titleSizeSlider" class="form-range" min="9" max="22" value="${titleSize}" style="height: 14px;">
                </div>
                
                <div class="mb-2">
                    <label class="d-flex justify-content-between text-muted mb-0.5" style="font-size: 0.72rem;">
                        <span><i class="bi bi-type-h2 me-1 text-success"></i>${t('kpi.valueSize', 'Value Size')}:</span>
                        <span id="valueSizeVal" class="fw-bold text-primary">${valueSize}px</span>
                    </label>
                    <input type="range" id="valueSizeSlider" class="form-range" min="14" max="42" value="${valueSize}" style="height: 14px;">
                </div>

                <!-- Text Alignment -->
                <div class="mb-1">
                    <label class="text-muted mb-1 d-block" style="font-size: 0.72rem;"><i class="bi bi-text-left me-1"></i>${t('kpi.textAlign', 'Text Align')}:</label>
                    <div class="btn-group w-100 btn-group-sm" role="group">
                        <button type="button" class="btn btn-outline-secondary btnTextAlign ${kpiTextAlign === 'left' ? 'active btn-primary text-white' : ''}" data-align="left" title="${t('kpi.left', 'Left')}" style="font-size: 0.85rem; padding: 4px 6px;">
                            <i class="bi bi-align-left"></i>
                        </button>
                        <button type="button" class="btn btn-outline-secondary btnTextAlign ${kpiTextAlign === 'center' ? 'active btn-primary text-white' : ''}" data-align="center" title="${t('kpi.center', 'Center')}" style="font-size: 0.85rem; padding: 4px 6px;">
                            <i class="bi bi-align-center"></i>
                        </button>
                        <button type="button" class="btn btn-outline-secondary btnTextAlign ${kpiTextAlign === 'right' ? 'active btn-primary text-white' : ''}" data-align="right" title="${t('kpi.right', 'Right')}" style="font-size: 0.85rem; padding: 4px 6px;">
                            <i class="bi bi-align-right"></i>
                        </button>
                    </div>
                </div>
            </div>

            <!-- TAB 2: SPARKLINE -->
            <div id="popoverContentSparkline" style="display: none;">
                <!-- Sparkline Chart Type Selection in Popover -->
                <div class="mb-2">
                    <label class="text-muted mb-1 d-block" style="font-size: 0.72rem;"><i class="bi bi-graph-up me-1 text-info"></i>${t('kpi.chartStyle', 'Chart Style')}:</label>
                    <select id="popoverSparklineType" class="form-select form-select-sm" style="font-size: 0.75rem; min-height: 28px; height: auto; padding: 2px 24px 2px 6px; cursor: pointer;">
                        <option value="line" ${sparkType === 'line' ? 'selected' : ''}>${t('kpi.line', 'Line')}</option>
                        <option value="area" ${sparkType === 'area' ? 'selected' : ''}>${t('kpi.area', 'Area')}</option>
                        <option value="bar" ${sparkType === 'bar' ? 'selected' : ''}>${t('kpi.bar', 'Bar')}</option>
                        <option value="pie" ${sparkType === 'pie' ? 'selected' : ''}>${t('kpi.pie', 'Pie')}</option>
                        <option value="doughnut" ${sparkType === 'doughnut' ? 'selected' : ''}>${t('kpi.doughnut', 'Doughnut')}</option>
                        <option value="polarArea" ${sparkType === 'polarArea' ? 'selected' : ''}>${t('kpi.polar', 'Polar')}</option>
                        <option value="radar" ${sparkType === 'radar' ? 'selected' : ''}>${t('kpi.radar', 'Radar')}</option>
                    </select>
                </div>

                <!-- Sparkline Sizes -->
                <div class="mb-2">
                    <label class="d-flex justify-content-between text-muted mb-0.5" style="font-size: 0.72rem;">
                        <span><i class="bi bi-arrows-angle-expand me-1"></i>${t('kpi.width', 'Width')}:</span>
                        <span id="chartWidthVal" class="fw-bold text-primary">${widthVal}px</span>
                    </label>
                    <input type="range" id="chartWidthSlider" class="form-range" min="30" max="220" value="${widthVal}" style="height: 14px;">
                </div>
                
                <div class="mb-2">
                    <label class="d-flex justify-content-between text-muted mb-0.5" style="font-size: 0.72rem;">
                        <span><i class="bi bi-arrows-angle-contract me-1"></i>${t('kpi.height', 'Height')}:</span>
                        <span id="chartHeightVal" class="fw-bold text-primary">${heightVal}px</span>
                    </label>
                    <input type="range" id="chartHeightSlider" class="form-range" min="15" max="85" value="${heightVal}" style="height: 14px;">
                </div>
            </div>

            <!-- TAB 3: POSITION & DRAG -->
            <div id="popoverContentDrag" style="display: none;">
                <!-- Position Dropdown Preset -->
                <div class="mb-2">
                    <label class="text-muted mb-1 d-block" style="font-size: 0.72rem;"><i class="bi bi-layout-sidebar-inset me-1 text-primary"></i>${t('kpi.basePosition', 'Base Position')}:</label>
                    <select id="popoverSparklinePosition" class="form-select form-select-sm" style="font-size: 0.75rem; min-height: 28px; height: auto; padding: 2px 24px 2px 6px; cursor: pointer;">
                        <option value="right" ${positionVal === 'right' ? 'selected' : ''}>${t('kpi.right', 'Right')}</option>
                        <option value="left" ${positionVal === 'left' ? 'selected' : ''}>${t('kpi.left', 'Left')}</option>
                        <option value="bottom" ${positionVal === 'bottom' ? 'selected' : ''}>${t('kpi.bottom', 'Bottom')}</option>
                        <option value="background" ${positionVal === 'background' ? 'selected' : ''}>${t('kpi.background', 'Background')}</option>
                        <option value="custom" ${positionVal === 'custom' ? 'selected' : ''}>${t('kpi.customDrag', 'Custom Drag')}</option>
                    </select>
                </div>

                <!-- Text Position Mode -->
                <div class="mb-2">
                    <label class="text-muted mb-1 d-block" style="font-size: 0.72rem;"><i class="bi bi-cursor-fill me-1 text-warning"></i>${t('kpi.textPosition', 'Text Position')}:</label>
                    <select id="popoverTextPosition" class="form-select form-select-sm" style="font-size: 0.75rem; min-height: 28px; height: auto; padding: 2px 24px 2px 6px; cursor: pointer;">
                        <option value="standard" ${textPositionVal === 'standard' ? 'selected' : ''}>${t('kpi.standard', 'Standard')}</option>
                        <option value="custom" ${textPositionVal === 'custom' ? 'selected' : ''}>${t('kpi.customDrag', 'Custom Drag')}</option>
                    </select>
                </div>
                
                <!-- Text Custom Positioning Controls -->
                <div id="customTextCoordinates" class="border p-2 rounded bg-slate-50 dark:bg-slate-800/40 mb-2" style="display: ${textPositionVal === 'custom' ? 'block' : 'none'}; border-color: rgba(148, 163, 184, 0.15);">
                    <div class="mb-1">
                        <label class="d-flex justify-content-between text-muted text-xs mb-0.5">
                            <span>${t('kpi.textX', 'Text X')}:</span>
                            <span id="textXVal" class="fw-semibold text-secondary">${textPercentX}%</span>
                        </label>
                        <input type="range" id="textXSlider" class="form-range form-range-sm" min="5" max="95" value="${textPercentX}" style="height: 14px;">
                    </div>
                    <div>
                        <label class="d-flex justify-content-between text-muted text-xs mb-0.5">
                            <span>${t('kpi.textY', 'Text Y')}:</span>
                            <span id="textYVal" class="fw-semibold text-secondary">${textPercentY}%</span>
                        </label>
                        <input type="range" id="textYSlider" class="form-range form-range-sm" min="5" max="95" value="${textPercentY}" style="height: 14px;">
                    </div>
                </div>
                
                <!-- Sparkline Custom Positioning Controls -->
                <div id="customSparklineCoordinates" class="border p-2 rounded bg-slate-50 dark:bg-slate-800/40 mb-2" style="display: ${positionVal === 'custom' ? 'block' : 'none'}; border-color: rgba(148, 163, 184, 0.15);">
                    <div class="mb-1">
                        <label class="d-flex justify-content-between text-muted text-xs mb-0.5">
                            <span>${t('kpi.chartX', 'Chart X')}:</span>
                            <span id="sparklineXVal" class="fw-semibold text-secondary">${sparklinePercentX}%</span>
                        </label>
                        <input type="range" id="sparklineXSlider" class="form-range form-range-sm" min="5" max="95" value="${sparklinePercentX}" style="height: 14px;">
                    </div>
                    <div>
                        <label class="d-flex justify-content-between text-muted text-xs mb-0.5">
                            <span>${t('kpi.chartY', 'Chart Y')}:</span>
                            <span id="sparklineYVal" class="fw-semibold text-secondary">${sparklinePercentY}%</span>
                        </label>
                        <input type="range" id="sparklineYSlider" class="form-range form-range-sm" min="5" max="95" value="${sparklinePercentY}" style="height: 14px;">
                    </div>
                </div>
                
                <!-- Helper tip -->
                <div class="text-muted d-flex align-items-start gap-1 p-1 bg-light dark:bg-slate-800 rounded" style="font-size: 0.65rem; line-height: 1.2;">
                    <i class="bi bi-info-circle text-info" style="font-size: 0.75rem; margin-top: 1px;"></i>
                    <span>${t('kpi.dragTip', 'You can also drag-and-drop directly on the card!')}</span>
                </div>
            </div>
        </div>
        
        <div class="d-flex justify-content-end gap-1.5 mt-2 border-top pt-1.5 border-slate-100 dark:border-slate-800">
            <button class="btn btn-xs btn-outline-secondary btnCloseKpiPopover" type="button" style="font-size: 0.68rem; padding: 2px 8px; border-radius: 4px;">${t('common.close', 'Close')}</button>
        </div>
    `;
    
    document.body.appendChild(popover);

    // Setup tab switching inside popover
    const tabTypography = popover.querySelector('#popoverTabTypography');
    const tabSparkline = popover.querySelector('#popoverTabSparkline');
    const tabDrag = popover.querySelector('#popoverTabDrag');
    
    const contentTypography = popover.querySelector('#popoverContentTypography');
    const contentSparkline = popover.querySelector('#popoverContentSparkline');
    const contentDrag = popover.querySelector('#popoverContentDrag');
    
    const switchTab = (activeTab, activeContent, inactiveTabs, inactiveContents) => {
        activeTab.classList.add('bg-white', 'dark:bg-slate-700', 'text-slate-900', 'dark:text-white', 'shadow-sm', 'fw-bold');
        activeTab.classList.remove('text-slate-600', 'dark:text-slate-400');
        activeContent.style.display = 'block';
        
        inactiveTabs.forEach(tab => {
            tab.classList.remove('bg-white', 'dark:bg-slate-700', 'text-slate-900', 'dark:text-white', 'shadow-sm', 'fw-bold');
            tab.classList.add('text-slate-600', 'dark:text-slate-400');
        });
        inactiveContents.forEach(content => {
            content.style.display = 'none';
        });
    };
    
    // Default to Typography active
    switchTab(tabTypography, contentTypography, [tabSparkline, tabDrag], [contentSparkline, contentDrag]);
    
    tabTypography.addEventListener('click', () => {
        switchTab(tabTypography, contentTypography, [tabSparkline, tabDrag], [contentSparkline, contentDrag]);
    });
    tabSparkline.addEventListener('click', () => {
        switchTab(tabSparkline, contentSparkline, [tabTypography, tabDrag], [contentTypography, contentDrag]);
    });
    tabDrag.addEventListener('click', () => {
        switchTab(tabDrag, contentDrag, [tabTypography, tabSparkline], [contentTypography, contentSparkline]);
    });
    
    // Convert native select elements inside the popover to premium custom absolute-positioned select elements
    convertAllSelectsInContainer(popover);
    
    // Prevent event propagation so that dragging, deselection, or outside click handlers aren't triggered
    popover.addEventListener('mousedown', (e) => e.stopPropagation());
    popover.addEventListener('pointerdown', (e) => e.stopPropagation());
    popover.addEventListener('click', (e) => e.stopPropagation());
    popover.addEventListener('touchstart', (e) => e.stopPropagation());
    
    // Wire events inside the popover
    
    const closeBtn = popover.querySelectorAll('.btnCloseKpiPopover');
    closeBtn.forEach(btn => btn.addEventListener('click', () => {
        popover.remove();
    }));
    
    // Auto save layout and re-render card
    const updateAndSave = async () => {
        // Find raw container and visual config index
        const index = visualizations.findIndex(v => v.id === chartConfig.id);
        if (index !== -1) {
            visualizations[index] = chartConfig;
        }
        
        // Re-render specifically this card
        renderCustomKpiCard(chartContainer, chartConfig, generateKpiButtonsHTML(chartConfig));
        
        // Save to DB
        const { saveDashboardSettings } = await import('../../store/DataHandler.ts');
        await saveDashboardSettings();
    };
    
    // Title Font Size
    const titleSlider = popover.querySelector('#titleSizeSlider');
    const titleValLabel = popover.querySelector('#titleSizeVal');
    titleSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        titleValLabel.textContent = `${val}px`;
        chartConfig.kpiTitleSize = val;
        updateAndSave();
    });
    
    // Value Font Size
    const valueSlider = popover.querySelector('#valueSizeSlider');
    const valueValLabel = popover.querySelector('#valueSizeVal');
    valueSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        valueValLabel.textContent = `${val}px`;
        chartConfig.kpiValueSize = val;
        updateAndSave();
    });
    
    // Text Position Select Option
    const textPosSelect = popover.querySelector('#popoverTextPosition');
    const customTextCoords = popover.querySelector('#customTextCoordinates');
    textPosSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        chartConfig.kpiTextPosition = val;
        if (val === 'custom') {
            customTextCoords.style.display = 'block';
        } else {
            customTextCoords.style.display = 'none';
            // Reset sparkline position to standard/preset if it was custom
            if (chartConfig.sparklinePosition === 'custom') {
                chartConfig.sparklinePosition = 'right';
                const sparkPosSelect = popover.querySelector('#popoverSparklinePosition');
                if (sparkPosSelect) {
                    sparkPosSelect.value = 'right';
                    sparkPosSelect.dispatchEvent(new Event('change', { bubbles: true }));
                }
                const customSparkCoords = popover.querySelector('#customSparklineCoordinates');
                if (customSparkCoords) customSparkCoords.style.display = 'none';
            }
        }
        updateAndSave();
    });
    
    // Text position Sliders
    const txtXSlider = popover.querySelector('#textXSlider');
    const txtXVal = popover.querySelector('#textXVal');
    txtXSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        txtXVal.textContent = `${val}%`;
        chartConfig.kpiTextPercentX = val;
        updateAndSave();
    });
    
    const txtYSlider = popover.querySelector('#textYSlider');
    const txtYVal = popover.querySelector('#textYVal');
    txtYSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        txtYVal.textContent = `${val}%`;
        chartConfig.kpiTextPercentY = val;
        updateAndSave();
    });
    
    // Text Alignment buttons
    const alignBtns = popover.querySelectorAll('.btnTextAlign');
    alignBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const align = e.currentTarget.getAttribute('data-align');
            chartConfig.kpiTextAlign = align;
            
            alignBtns.forEach(b => {
                b.classList.remove('active', 'btn-primary', 'text-white');
                b.classList.add('btn-outline-secondary');
            });
            e.currentTarget.classList.add('active', 'btn-primary', 'text-white');
            e.currentTarget.classList.remove('btn-outline-secondary');
            
            updateAndSave();
        });
    });
    
    // Sparkline Width Slider
    const chartWidthSlider = popover.querySelector('#chartWidthSlider');
    const chartWidthVal = popover.querySelector('#chartWidthVal');
    chartWidthSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        chartWidthVal.textContent = `${val}px`;
        chartConfig.sparklineWidth = val;
        updateAndSave();
    });
    
    // Sparkline Height Slider
    const chartHeightSlider = popover.querySelector('#chartHeightSlider');
    const chartHeightVal = popover.querySelector('#chartHeightVal');
    chartHeightSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        chartHeightVal.textContent = `${val}px`;
        chartConfig.sparklineHeight = val;
        updateAndSave();
    });

    // Sparkline Type Selector Option
    const sparkTypeSelect = popover.querySelector('#popoverSparklineType');
    if (sparkTypeSelect) {
        sparkTypeSelect.addEventListener('change', (e) => {
            chartConfig.sparklineType = e.target.value;
            updateAndSave();
        });
    }
    
    // Sparkline Position Selector Option
    const sparkPosSelect = popover.querySelector('#popoverSparklinePosition');
    const customSparkCoords = popover.querySelector('#customSparklineCoordinates');
    sparkPosSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        chartConfig.sparklinePosition = val;
        if (val === 'custom') {
            customSparkCoords.style.display = 'block';
        } else {
            customSparkCoords.style.display = 'none';
            // Reset text position to standard/preset so that standard layouts display properly
            chartConfig.kpiTextPosition = 'standard';
            const textPosSelect = popover.querySelector('#popoverTextPosition');
            if (textPosSelect) {
                textPosSelect.value = 'standard';
                textPosSelect.dispatchEvent(new Event('change', { bubbles: true }));
            }
            const customTextCoords = popover.querySelector('#customTextCoordinates');
            if (customTextCoords) customTextCoords.style.display = 'none';
        }
        updateAndSave();
    });
    
    // Sparkline Position Coordinate sliders
    const spXSlider = popover.querySelector('#sparklineXSlider');
    const spXVal = popover.querySelector('#sparklineXVal');
    spXSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        spXVal.textContent = `${val}%`;
        chartConfig.sparklinePercentX = val;
        updateAndSave();
    });
    
    const spYSlider = popover.querySelector('#sparklineYSlider');
    const spYVal = popover.querySelector('#sparklineYVal');
    spYSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        spYVal.textContent = `${val}%`;
        chartConfig.sparklinePercentY = val;
        updateAndSave();
    });
    
    // Close popover if user clicks outside of it
    const clickOutsideHandler = (e) => {
        // Ignore mousedown events originating from native select dropdowns or options
        if (e.target && (e.target.tagName === 'SELECT' || e.target.tagName === 'OPTION' || e.target.closest('select') || e.target.closest('option'))) {
            return;
        }
        if (!popover.contains(e.target) && !button.contains(e.target)) {
            popover.remove();
            document.removeEventListener('mousedown', clickOutsideHandler);
        }
    };
    document.addEventListener('mousedown', clickOutsideHandler);
}

/**
 * Creates a beautiful native container specifically for KPI sparkline cards.
 * It bypasses standard chart container styles to provide a highly optimized premium layout.
 */
export function createKpiContainerElement(chartConfig) {
    const container = document.createElement('div');
    container.id = `container-${chartConfig.id}`;
    container.className = 'visualization-container kpi-native-card';
    container.style.cssText = `
        position: absolute;
        width: ${chartConfig.size?.width || '310px'};
        height: ${chartConfig.size?.height || '145px'};
        top: ${chartConfig.position?.top || '150px'};
        left: ${chartConfig.position?.left || '50px'};
        z-index: 100;
        cursor: grab;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        padding: 0px !important;
        transition: box-shadow 0.3s ease, border-color 0.3s ease;
    `;
    return container;
}

/**
 * Generates specific, clean action buttons ONLY for KPI Sparkline cards,
 * bypassing generic chart options like fullscreen, zoom, freeze, download, or AI advice.
 */
export function generateKpiButtonsHTML(chartConfig) {
    return `
        <div class="btn-group btn-group-sm align-items-center gap-1" role="group">
            <button class="btn btn-xs btn-light border shadow-2xs edit-chart p-1" data-chart-id="${chartConfig.id}" title="${t('kpi.editKpi', 'Edit KPI')}" style="width: 24px; height: 24px; display: inline-flex; align-items: center; justify-content: center; border-radius: 6px;">
                <i class="bi bi-pencil text-primary" style="font-size: 11px;"></i>
            </button>
            <button class="btn btn-xs btn-light border shadow-2xs delete-chart p-1" data-chart-id="${chartConfig.id}" title="${t('kpi.deleteKpi', 'Delete KPI')}" style="width: 24px; height: 24px; display: inline-flex; align-items: center; justify-content: center; border-radius: 6px;">
                <i class="bi bi-trash text-danger" style="font-size: 11px;"></i>
            </button>
        </div>
    `;
}

/**
 * Enhanced custom sparkline generator (Line, Bar, Area, Doughnut, Pie)
 */
export function generateCustomSparklineSvg(dataPoints, type = 'line', color = '#8b5cf6', width = 110, height = 35) {
    if (!dataPoints || !Array.isArray(dataPoints) || dataPoints.length === 0) {
        dataPoints = [10, 18, 14, 25, 20, 32, 28, 35];
    }
    const safeData = dataPoints.map(v => {
        const n = Number(v);
        return isNaN(n) ? 0 : n;
    });
    const min = Math.min(...safeData);
    const max = Math.max(...safeData);
    const range = (max - min === 0) ? 1 : (max - min);
    const w = Math.max(40, width);
    const h = Math.max(20, height);
    
    if (type === 'bar') {
        const barCount = safeData.length;
        const gap = 2;
        const barWidth = Math.max(2, (w - (gap * (barCount - 1))) / barCount);
        let barsHtml = '';
        
        safeData.forEach((val, i) => {
            const barH = Math.max(3, ((val - min) / range) * (h - 6) + 3);
            const x = i * (barWidth + gap);
            const y = h - barH;
            barsHtml += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barWidth.toFixed(1)}" height="${barH.toFixed(1)}" fill="${color}" rx="1.5" />`;
        });
        
        return `
            <svg class="sparkline-svg" width="100%" height="100%" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" style="display: block; overflow: visible;">
                ${barsHtml}
            </svg>
        `;
    }

    if (type === 'doughnut' || type === 'pie') {
        const cx = w / 2;
        const cy = h / 2;
        const r = Math.min(w, h) * 0.44;
        const isDonut = type === 'doughnut';
        const strokeW = isDonut ? Math.max(3, r * 0.4) : r;
        const drawR = isDonut ? (r - strokeW / 2) : (r / 2);
        const circumference = 2 * Math.PI * drawR;
        const total = safeData.reduce((a, b) => a + Math.abs(b), 0) || 1;
        let accumulatedOffset = 0;
        let slicesHtml = '';

        safeData.slice(0, 5).forEach((val, i) => {
            const fraction = Math.abs(val) / total;
            const sliceLength = fraction * circumference;
            const opacity = (1 - (i * 0.18)).toFixed(2);
            slicesHtml += `<circle cx="${cx}" cy="${cy}" r="${drawR.toFixed(1)}" fill="none" stroke="${color}" stroke-opacity="${opacity}" stroke-width="${strokeW.toFixed(1)}" stroke-dasharray="${sliceLength.toFixed(1)} ${(circumference - sliceLength).toFixed(1)}" stroke-dashoffset="${(-accumulatedOffset).toFixed(1)}" />`;
            accumulatedOffset += sliceLength;
        });

        return `
            <svg class="sparkline-svg" width="100%" height="100%" viewBox="0 0 ${w} ${h}" style="display: block;">
                ${slicesHtml}
            </svg>
        `;
    }
    
    const points = safeData.map((val, i) => {
        const x = safeData.length > 1 ? (i / (safeData.length - 1)) * w : w / 2;
        const y = h - ((val - min) / range) * (h - 8) - 4;
        return { x, y };
    });
    
    const lineD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
    
    if (type === 'area') {
        const areaD = `${lineD} L ${w} ${h} L 0 ${h} Z`;
        const gradId = `sparkline-area-grad-${color.replace('#', '')}-${Math.floor(Math.random() * 10000)}`;
        return `
            <svg class="sparkline-svg" width="100%" height="100%" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" style="display: block; overflow: visible;">
                <defs>
                    <linearGradient id="${gradId}" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="${color}" stop-opacity="0.45" />
                        <stop offset="100%" stop-color="${color}" stop-opacity="0.0" />
                    </linearGradient>
                </defs>
                <path d="${areaD}" fill="url(#${gradId})" stroke="none" />
                <path d="${lineD}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
                <circle cx="${points[points.length - 1].x.toFixed(1)}" cy="${points[points.length - 1].y.toFixed(1)}" r="3" fill="${color}" />
            </svg>
        `;
    }
    
    // Default 'line'
    return `
        <svg class="sparkline-svg" width="100%" height="100%" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" style="display: block; overflow: visible;">
            <path d="${lineD}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
            <circle cx="${points[points.length - 1].x.toFixed(1)}" cy="${points[points.length - 1].y.toFixed(1)}" r="3" fill="${color}" />
        </svg>
    `;
}

/**
 * Renders a highly-polished Chart.js sparkline inside a canvas element
 */
export function createChartJSSparkline(canvas, dataPoints, type, color) {
    if (!canvas || !canvas.isConnected) {
        return;
    }

    if (!window.Chart) {
        console.warn("Chart.js is not loaded yet. Retrying in 100ms...");
        setTimeout(() => {
            if (canvas && canvas.isConnected) {
                createChartJSSparkline(canvas, dataPoints, type, color);
            }
        }, 100);
        return;
    }

    try {
        // Destroy existing chart instance on this canvas to prevent memory leaks or hover artifacts
        if (canvas._chartInstance) {
            try {
                canvas._chartInstance.destroy();
            } catch (e) {
                console.warn("Error destroying previous chart instance:", e);
            }
            canvas._chartInstance = null;
        }

        // Ensure clean, numerical array for dataPoints
        const safeData = (Array.isArray(dataPoints) && dataPoints.length > 0)
            ? dataPoints.map(v => {
                const n = Number(v);
                return isNaN(n) ? 0 : n;
            })
            : [10, 15, 8, 25, 20, 30, 22, 28];

        const labels = safeData.map((_, i) => String(i + 1));

        let chartType = 'line';
        let fill = false;
        let backgroundColor = color || '#8b5cf6';
        let borderColor = color || '#8b5cf6';
        let borderWidth = 2;
        let pointRadius = 0;

        const isRadial = (type === 'pie' || type === 'doughnut' || type === 'polarArea' || type === 'radar');

        if (type === 'area') {
            chartType = 'line';
            fill = true;
            backgroundColor = (color || '#8b5cf6') + '22'; // subtle 13% opacity
        } else if (type === 'line') {
            chartType = 'line';
            fill = false;
        } else if (type === 'bar') {
            chartType = 'bar';
            backgroundColor = color || '#8b5cf6';
        } else if (type === 'pie') {
            chartType = 'pie';
            backgroundColor = safeData.map((_, i) => {
                const alpha = Math.max(0.4, 1 - (i / safeData.length) * 0.6);
                return (color || '#8b5cf6') + Math.round(alpha * 255).toString(16).padStart(2, '0');
            });
            borderColor = '#ffffff';
            borderWidth = 1;
        } else if (type === 'doughnut') {
            chartType = 'doughnut';
            backgroundColor = safeData.map((_, i) => {
                const alpha = Math.max(0.4, 1 - (i / safeData.length) * 0.6);
                return (color || '#8b5cf6') + Math.round(alpha * 255).toString(16).padStart(2, '0');
            });
            borderColor = '#ffffff';
            borderWidth = 1;
        } else if (type === 'polarArea') {
            chartType = 'polarArea';
            backgroundColor = safeData.map((_, i) => {
                const alpha = Math.max(0.4, 1 - (i / safeData.length) * 0.6);
                return (color || '#8b5cf6') + Math.round(alpha * 255).toString(16).padStart(2, '0');
            });
            borderColor = '#ffffff';
            borderWidth = 1;
        } else if (type === 'radar') {
            chartType = 'radar';
            fill = true;
            backgroundColor = (color || '#8b5cf6') + '22';
            borderWidth = 1.5;
        }

        const scalesConfig = isRadial ? {
            r: {
                display: false,
                grid: { display: false },
                angleLines: { display: false },
                ticks: { display: false }
            }
        } : {
            x: { display: false },
            y: { display: false }
        };

        const config = {
            type: chartType,
            data: {
                labels: labels,
                datasets: [{
                    data: safeData,
                    borderColor: borderColor,
                    backgroundColor: backgroundColor,
                    borderWidth: borderWidth,
                    fill: fill,
                    pointRadius: pointRadius,
                    pointHoverRadius: 3,
                    tension: 0.35 // beautiful curved lines
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 300 // snappy, neat load animations
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        enabled: true,
                        mode: isRadial ? 'point' : 'index',
                        intersect: false,
                        displayColors: false,
                        padding: 6,
                        titleFont: { size: 10 },
                        bodyFont: { size: 11 },
                        callbacks: {
                            title: () => '',
                            label: (context) => {
                                const val = context.parsed !== undefined && context.parsed !== null
                                    ? (typeof context.parsed === 'object' && context.parsed.y !== undefined ? context.parsed.y : (context.parsed.r !== undefined ? context.parsed.r : context.parsed))
                                    : context.raw;
                                return `Value: ${val !== undefined && val !== null ? val : ''}`;
                            }
                        }
                    }
                },
                scales: scalesConfig,
                elements: {
                    bar: {
                        borderRadius: 2
                    }
                }
            }
        };

        canvas._chartInstance = new window.Chart(canvas, config);
    } catch (err) {
        console.error("Error creating Chart.js sparkline:", err);
    }
}
