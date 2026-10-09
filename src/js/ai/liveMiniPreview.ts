// src/js/ai/liveMiniPreview.ts
import { rawData, currentDataForChat } from '../../store/DataHandler.ts';
import { visualizations, ChartConfig } from '../charts/charts.ts';
import { escapeHtml } from '../core/utils.ts';
import type { AiAction } from './chat.ts';

declare const echarts: any;

export interface LiveMiniPreviewOptions {
  action: AiAction;
  previewId: string;
  onConfirm: () => Promise<void> | void;
  onCancel: () => void;
}

/**
 * Creates and mounts a temporary, non-interactive thumbnail inside the chat bubble
 * so users can visualize proposed chart or layout changes before confirming execution.
 */
export function renderLiveMiniPreviewInsideBubble(
  bubbleElement: HTMLElement,
  options: LiveMiniPreviewOptions
): HTMLElement {
  const { action, previewId, onConfirm, onCancel } = options;

  // Remove any existing preview with the same ID
  const existing = bubbleElement.querySelector(`#live-mini-preview-${previewId}`);
  if (existing) {
    existing.remove();
  }

  const previewBox = document.createElement('div');
  previewBox.id = `live-mini-preview-${previewId}`;
  previewBox.className = 'agent-live-mini-preview-box rounded-3 border mt-2.5 overflow-hidden shadow-xs bg-white text-start';

  let headerTitle = 'Proposed Dashboard Change';
  let headerIcon = 'bi-eye-fill';
  let badgeLabel = 'Non-Interactive Preview';

  if (action.action === 'create-chart' || action.action === 'edit-chart') {
    headerTitle = `Proposed Chart: ${escapeHtml(action.title || action.type?.toUpperCase() || 'New Visualization')}`;
    headerIcon = 'bi-bar-chart-fill';
  } else if (action.action === 'change-layout' || action.action === 'arrange-grid') {
    headerTitle = `Proposed Layout: ${action.columns || 2}-Column Responsive Grid`;
    headerIcon = 'bi-grid-3x3-gap-fill';
  } else if (action.action === 'calculate-column') {
    headerTitle = `Proposed AI Calculated Field: [${escapeHtml(action.columnName || 'NewColumn')}]`;
    headerIcon = 'bi-calculator-fill';
  } else if (action.action === 'create-tab' || action.action === 'switch-tab') {
    headerTitle = `Proposed Multi-Page Tab: "${escapeHtml(action.tabName || 'New Tab')}"`;
    headerIcon = 'bi-folder2-open';
  } else if (action.action === 'move-chart-to-tab') {
    headerTitle = `Proposed Tab Migration: → "${escapeHtml(action.destinationTab || 'New Tab')}"`;
    headerIcon = 'bi-box-arrow-up-right';
  } else if (action.action === 'join-datasets') {
    headerTitle = `Proposed AI Blend & Join: [${escapeHtml(action.leftDataset || 'Primary')}] + [${escapeHtml(action.rightDataset || 'Secondary')}]`;
    headerIcon = 'bi-intersect';
  }

  previewBox.innerHTML = `
    <div class="mini-preview-header px-2.5 py-1.5 bg-slate-50 border-bottom d-flex align-items-center justify-content-between">
      <div class="d-flex align-items-center gap-1.5">
        <span class="pulse-indicator"></span>
        <span class="fw-bold text-slate-800" style="font-size: 11.5px;">
          <i class="bi ${headerIcon} text-primary me-1"></i>${headerTitle}
        </span>
      </div>
      <span class="badge bg-indigo-50 text-indigo-700 border border-indigo-200 text-3xs fw-semibold px-2 py-0.5 rounded-pill">
        ${badgeLabel}
      </span>
    </div>

    <div class="mini-preview-body p-2 position-relative bg-slate-50/50" style="pointer-events: none; user-select: none;">
      <div id="thumb-canvas-${previewId}" class="mini-thumbnail-canvas d-flex align-items-center justify-content-center" style="min-height: 125px; width: 100%;">
        <!-- Thumbnail rendered dynamically -->
      </div>
      <div class="mini-preview-watermark position-absolute bottom-0 end-0 px-2 py-0.5 text-2xs text-muted" style="font-size: 9px; opacity: 0.75;">
        <i class="bi bi-shield-check me-0.5"></i> Execution Pending Approval
      </div>
    </div>

    <div class="mini-preview-footer px-2.5 py-1.5 bg-white border-top d-flex align-items-center justify-content-between gap-2">
      <div class="text-2xs text-muted d-flex align-items-center gap-1">
        <i class="bi bi-info-circle text-primary"></i>
        <span>Visualize change before applying to canvas</span>
      </div>
      <div class="d-flex align-items-center gap-1.5">
        <button type="button" class="btn btn-xs btn-outline-secondary rounded-pill px-2.5 py-1 fw-medium btn-mini-preview-cancel" id="btnCancel-${previewId}">
          <i class="bi bi-x me-0.5"></i> Cancel
        </button>
        <button type="button" class="btn btn-xs btn-primary rounded-pill px-3 py-1 fw-semibold text-white shadow-xs btn-mini-preview-confirm" id="btnConfirm-${previewId}">
          <i class="bi bi-check2 me-1"></i> Confirm Execution
        </button>
      </div>
    </div>
  `;

  bubbleElement.appendChild(previewBox);

  // Render the specific thumbnail inside #thumb-canvas-${previewId}
  const canvasEl = previewBox.querySelector(`#thumb-canvas-${previewId}`) as HTMLElement | null;
  if (canvasEl) {
    if (action.action === 'create-chart' || action.action === 'edit-chart') {
      renderChartThumbnail(canvasEl, action);
    } else if (action.action === 'change-layout' || action.action === 'arrange-grid') {
      renderLayoutThumbnail(canvasEl, action);
    } else if (action.action === 'calculate-column') {
      renderCalculatedFieldThumbnail(canvasEl, action);
    } else if (action.action === 'create-tab' || action.action === 'switch-tab' || action.action === 'move-chart-to-tab') {
      renderTabThumbnail(canvasEl, action);
    } else if (action.action === 'join-datasets') {
      renderJoinThumbnail(canvasEl, action);
    } else {
      renderGenericThumbnail(canvasEl, action);
    }
  }

  // Attach button event listeners
  const btnConfirm = previewBox.querySelector(`#btnConfirm-${previewId}`) as HTMLButtonElement | null;
  const btnCancel = previewBox.querySelector(`#btnCancel-${previewId}`) as HTMLButtonElement | null;

  btnConfirm?.addEventListener('click', async (e) => {
    e.stopPropagation();
    btnConfirm.disabled = true;
    if (btnCancel) btnCancel.disabled = true;

    btnConfirm.innerHTML = `<span class="spinner-border spinner-border-sm me-1" role="status"></span> Applying...`;

    try {
      await onConfirm();
      const footer = previewBox.querySelector('.mini-preview-footer');
      if (footer) {
        footer.innerHTML = `
          <div class="d-flex align-items-center justify-content-between w-100 py-0.5">
            <span class="text-2xs text-success fw-bold d-flex align-items-center gap-1">
              <i class="bi bi-check-circle-fill text-success"></i> Change Confirmed & Executed on Dashboard
            </span>
            <span class="badge bg-success-subtle text-success border border-success-subtle text-3xs">Applied</span>
          </div>
        `;
      }
    } catch (err) {
      console.error('[LiveMiniPreview] Execution error:', err);
      btnConfirm.disabled = false;
      btnConfirm.innerHTML = `<i class="bi bi-arrow-repeat me-1"></i> Retry`;
    }
  });

  btnCancel?.addEventListener('click', (e) => {
    e.stopPropagation();
    onCancel();
    const footer = previewBox.querySelector('.mini-preview-footer');
    if (footer) {
      footer.innerHTML = `
        <div class="d-flex align-items-center justify-content-between w-100 py-0.5">
          <span class="text-2xs text-secondary d-flex align-items-center gap-1">
            <i class="bi bi-x-circle text-muted"></i> Proposed change cancelled
          </span>
          <span class="badge bg-light text-muted border text-3xs">Discarded</span>
        </div>
      `;
    }
  });

  return previewBox;
}

/**
 * Renders a temporary, non-interactive chart thumbnail using ECharts or SVG fallback.
 */
function renderChartThumbnail(container: HTMLElement, action: AiAction): void {
  const chartType = (action.type || 'bar').toLowerCase();
  const xAxisKey = action.xAxis || 'Category';
  const yAxisKey = (action.yAxes && action.yAxes.length > 0) ? action.yAxes[0] : 'Value';
  const title = action.title || `${chartType.toUpperCase()} Preview`;

  // Sample data points from active dataset
  const dataSource = (currentDataForChat && currentDataForChat.length > 0)
    ? currentDataForChat
    : (rawData && rawData.length > 0 ? rawData : []);

  let sampleX: string[] = [];
  let sampleY: number[] = [];

  if (dataSource.length > 0) {
    const slice = dataSource.slice(0, 6);
    sampleX = slice.map((row: any, idx: number) => {
      const val = row[xAxisKey];
      return (val !== undefined && val !== null) ? String(val).substring(0, 10) : `Item ${idx + 1}`;
    });
    sampleY = slice.map((row: any) => {
      const rawVal = row[yAxisKey];
      const num = Number(rawVal);
      return !isNaN(num) ? Math.round(num * 100) / 100 : Math.floor(Math.random() * 50 + 20);
    });
  } else {
    sampleX = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon'];
    sampleY = [45, 78, 52, 91, 63];
  }

  // Check if ECharts is available
  if (typeof echarts !== 'undefined') {
    try {
      const chartDiv = document.createElement('div');
      chartDiv.style.width = '100%';
      chartDiv.style.height = '120px';
      chartDiv.style.pointerEvents = 'none';
      chartDiv.style.userSelect = 'none';
      container.innerHTML = '';
      container.appendChild(chartDiv);

      const chartInstance = echarts.init(chartDiv, null, { renderer: 'canvas' });

      if (chartType === 'pie' || chartType === 'donut') {
        const pieData = sampleX.map((name, i) => ({ name, value: sampleY[i] }));
        chartInstance.setOption({
          animation: false,
          silent: true,
          color: ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'],
          series: [{
            type: 'pie',
            radius: chartType === 'donut' ? ['35%', '65%'] : '65%',
            center: ['50%', '50%'],
            data: pieData,
            label: {
              show: true,
              fontSize: 9,
              formatter: '{b}: {c}',
              color: '#475569'
            },
            emphasis: { disabled: true }
          }]
        });
      } else if (chartType === 'scatter') {
        chartInstance.setOption({
          animation: false,
          silent: true,
          grid: { top: 10, right: 12, bottom: 20, left: 32 },
          xAxis: {
            type: 'category',
            data: sampleX,
            axisLabel: { fontSize: 8.5, color: '#64748b' },
            axisLine: { lineStyle: { color: '#cbd5e1' } }
          },
          yAxis: {
            type: 'value',
            axisLabel: { fontSize: 8.5, color: '#64748b' },
            splitLine: { lineStyle: { color: '#f1f5f9' } }
          },
          series: [{
            type: 'scatter',
            symbolSize: 10,
            data: sampleY,
            itemStyle: { color: '#6366f1' }
          }]
        });
      } else {
        // Bar, Line, Spline, Area
        const isLine = chartType === 'line' || chartType === 'spline' || chartType === 'area';
        const isSmooth = chartType === 'spline' || chartType === 'area';
        const isArea = chartType === 'area';

        chartInstance.setOption({
          animation: false,
          silent: true,
          grid: { top: 12, right: 12, bottom: 20, left: 32 },
          xAxis: {
            type: 'category',
            data: sampleX,
            axisLabel: { fontSize: 8.5, color: '#64748b', interval: 0 },
            axisLine: { lineStyle: { color: '#cbd5e1' } },
            axisTick: { show: false }
          },
          yAxis: {
            type: 'value',
            axisLabel: { fontSize: 8.5, color: '#64748b' },
            splitLine: { lineStyle: { color: '#f1f5f9' } }
          },
          series: [{
            type: isLine ? 'line' : 'bar',
            smooth: isSmooth,
            areaStyle: isArea ? { color: 'rgba(99, 102, 241, 0.25)' } : undefined,
            data: sampleY,
            itemStyle: {
              color: '#4f46e5',
              borderRadius: isLine ? 0 : [3, 3, 0, 0]
            }
          }]
        });
      }

      // Add thumbnail details tag below chart
      const detailsTag = document.createElement('div');
      detailsTag.className = 'w-100 d-flex align-items-center justify-content-between pt-1 border-top mt-1 px-1 text-2xs text-muted';
      detailsTag.innerHTML = `
        <span><i class="bi bi-arrow-left-right text-primary me-1"></i>X: <strong>${escapeHtml(xAxisKey)}</strong></span>
        <span><i class="bi bi-arrow-down-up text-success me-1"></i>Y: <strong>${escapeHtml(yAxisKey)}</strong></span>
        <span class="badge bg-light text-dark border text-3xs">${escapeHtml(title)}</span>
      `;
      container.appendChild(detailsTag);
      return;
    } catch (e) {
      console.warn('[LiveMiniPreview] ECharts thumbnail failed, falling back to SVG:', e);
    }
  }

  // SVG Fallback Thumbnail
  renderSvgChartThumbnail(container, chartType, xAxisKey, yAxisKey, title);
}

/**
 * Fallback SVG vector miniature chart thumbnail
 */
function renderSvgChartThumbnail(container: HTMLElement, chartType: string, xCol: string, yCol: string, title: string): void {
  let innerSvg = '';
  if (chartType === 'line' || chartType === 'area') {
    innerSvg = `
      <svg viewBox="0 0 240 70" class="w-100" style="height: 75px;">
        <defs>
          <linearGradient id="svgGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#6366f1" stop-opacity="0.3"/>
            <stop offset="100%" stop-color="#6366f1" stop-opacity="0.0"/>
          </linearGradient>
        </defs>
        <line x1="15" y1="60" x2="225" y2="60" stroke="#e2e8f0" stroke-width="1"/>
        <path d="M 20 48 Q 60 15, 100 40 T 170 20 T 225 32 L 225 60 L 20 60 Z" fill="url(#svgGrad)"/>
        <path d="M 20 48 Q 60 15, 100 40 T 170 20 T 225 32" fill="none" stroke="#4f46e5" stroke-width="2.5"/>
        <circle cx="20" cy="48" r="3" fill="#4f46e5"/>
        <circle cx="100" cy="40" r="3" fill="#4f46e5"/>
        <circle cx="170" cy="20" r="3" fill="#4f46e5"/>
        <circle cx="225" cy="32" r="3" fill="#4f46e5"/>
      </svg>
    `;
  } else if (chartType === 'pie' || chartType === 'donut') {
    innerSvg = `
      <div class="d-flex align-items-center justify-content-center py-1">
        <svg viewBox="0 0 100 100" style="width: 70px; height: 70px; transform: rotate(-90deg);">
          <circle cx="50" cy="50" r="32" fill="transparent" stroke="#6366f1" stroke-width="16" stroke-dasharray="80 120" stroke-dashoffset="0"/>
          <circle cx="50" cy="50" r="32" fill="transparent" stroke="#10b981" stroke-width="16" stroke-dasharray="60 140" stroke-dashoffset="-80"/>
          <circle cx="50" cy="50" r="32" fill="transparent" stroke="#f59e0b" stroke-width="16" stroke-dasharray="60 140" stroke-dashoffset="-140"/>
        </svg>
      </div>
    `;
  } else {
    innerSvg = `
      <svg viewBox="0 0 240 70" class="w-100" style="height: 75px;">
        <line x1="15" y1="60" x2="225" y2="60" stroke="#e2e8f0" stroke-width="1"/>
        <rect x="25" y="24" width="28" height="36" rx="3" fill="#6366f1"/>
        <rect x="68" y="12" width="28" height="48" rx="3" fill="#3b82f6"/>
        <rect x="111" y="32" width="28" height="28" rx="3" fill="#06b6d4"/>
        <rect x="154" y="18" width="28" height="42" rx="3" fill="#10b981"/>
        <rect x="197" y="36" width="28" height="24" rx="3" fill="#f59e0b"/>
      </svg>
    `;
  }

  container.innerHTML = `
    <div class="w-100">
      ${innerSvg}
      <div class="w-100 d-flex align-items-center justify-content-between pt-1 border-top mt-1 px-1 text-2xs text-muted">
        <span>X: <strong>${escapeHtml(xCol)}</strong></span>
        <span>Y: <strong>${escapeHtml(yCol)}</strong></span>
        <span class="badge bg-light text-dark border text-3xs">${escapeHtml(title)}</span>
      </div>
    </div>
  `;
}

/**
 * Renders a miniature layout grid wireframe thumbnail showing the prospective dashboard re-flow.
 */
function renderLayoutThumbnail(container: HTMLElement, action: AiAction): void {
  const cols = Math.max(1, Math.min(4, parseInt(String(action.columns || 2), 10)));
  const currentCount = visualizations.length > 0 ? visualizations.length : 3;
  const mockCardsCount = Math.max(currentCount, cols * 2);

  // Build miniature grid slots
  const slotsHtml = Array.from({ length: Math.min(mockCardsCount, 6) }).map((_, idx) => {
    const existingVis: ChartConfig | undefined = visualizations[idx];
    const cardTitle = (existingVis && existingVis.title) ? existingVis.title : `Chart ${idx + 1}`;
    const cardType = (existingVis && existingVis.type) ? existingVis.type : (idx % 2 === 0 ? 'bar' : 'line');

    let miniIcon = 'bi-bar-chart';
    if (cardType === 'line' || cardType === 'spline' || cardType === 'area') miniIcon = 'bi-graph-up';
    if (cardType === 'pie' || cardType === 'donut') miniIcon = 'bi-pie-chart';

    return `
      <div class="bg-white border rounded p-1 shadow-2xs text-start overflow-hidden" style="min-height: 48px;">
        <div class="d-flex align-items-center justify-content-between mb-1 pb-0.5 border-bottom" style="font-size: 8px;">
          <span class="text-truncate fw-bold text-slate-700" style="max-width: 70px;">
            <i class="bi ${miniIcon} text-primary me-0.5"></i>${escapeHtml(cardTitle)}
          </span>
          <span class="badge bg-light text-secondary text-3xs p-0.5">${cardType.substring(0, 3).toUpperCase()}</span>
        </div>
        <div class="d-flex align-items-end gap-0.5" style="height: 20px;">
          <div class="bg-indigo-300 rounded-top" style="width: 20%; height: ${30 + (idx * 15) % 60}%;"></div>
          <div class="bg-indigo-400 rounded-top" style="width: 20%; height: ${50 + (idx * 20) % 50}%;"></div>
          <div class="bg-indigo-500 rounded-top" style="width: 20%; height: ${40 + (idx * 10) % 55}%;"></div>
          <div class="bg-indigo-300 rounded-top" style="width: 20%; height: ${25 + (idx * 25) % 65}%;"></div>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div class="w-100 p-2 bg-slate-100 rounded border">
      <div class="d-flex align-items-center justify-content-between mb-1.5 px-0.5">
        <span class="fw-bold text-slate-700 text-3xs">
          <i class="bi bi-layout-three-columns me-1 text-primary"></i> ${cols} Column Layout Flow
        </span>
        <span class="badge bg-primary text-white text-3xs px-1.5 py-0.5 rounded-pill">${cols} Cols</span>
      </div>
      <div style="display: grid; grid-template-columns: repeat(${cols}, 1fr); gap: 6px; width: 100%;">
        ${slotsHtml}
      </div>
    </div>
  `;
}

/**
 * Renders a miniature calculated field data thumbnail showing formula calculation preview.
 */
function renderCalculatedFieldThumbnail(container: HTMLElement, action: AiAction): void {
  const colName = action.columnName || 'NewColumn';
  const formula = action.formula || '';

  const dataSource = (currentDataForChat && currentDataForChat.length > 0)
    ? currentDataForChat
    : (rawData && rawData.length > 0 ? rawData : []);

  // Compute 3 sample rows
  const previewRows = dataSource.slice(0, 3).map((row: any, i: number) => {
    let computedVal: any = 0;
    try {
      let expr = formula;
      const bracketMatches = formula.match(/\[([^\]]+)\]/g);
      if (bracketMatches) {
        bracketMatches.forEach(b => {
          const col = b.slice(1, -1).trim();
          const val = Number(row[col]) || 0;
          expr = expr.split(b).join(String(val));
        });
      } else {
        Object.keys(row).forEach(k => {
          const reg = new RegExp(`\\b${k}\\b`, 'gi');
          if (reg.test(expr)) {
            const val = Number(row[k]) || 0;
            expr = expr.replace(reg, String(val));
          }
        });
      }
      const safeExpr = expr.replace(/[^0-9\.\+\-\*\/\(\)\s]/g, '');
      // eslint-disable-next-line no-new-func
      const res = Function(`"use strict"; return (${safeExpr})`)();
      computedVal = typeof res === 'number' && !isNaN(res) ? Math.round(res * 100) / 100 : 0;
    } catch {
      computedVal = (i + 1) * 1250;
    }
    return { row, computedVal };
  });

  const rowsHtml = previewRows.map((item, idx) => `
    <tr>
      <td class="text-slate-500 py-1 px-2 font-mono text-3xs">#${idx + 1}</td>
      <td class="text-slate-700 py-1 px-2 font-mono text-3xs">${escapeHtml(String(item.row[Object.keys(item.row)[0]] || 'Item ' + (idx + 1)))}</td>
      <td class="text-emerald-700 fw-bold py-1 px-2 font-mono text-3xs bg-emerald-50">${item.computedVal.toLocaleString()}</td>
    </tr>
  `).join('');

  container.innerHTML = `
    <div class="w-100 p-1.5 bg-white rounded border">
      <div class="d-flex align-items-center justify-content-between mb-1.5 px-1">
        <span class="text-2xs fw-bold text-slate-800">
          <i class="bi bi-calculator text-emerald-600 me-1"></i> Formula: <code>${escapeHtml(formula)}</code>
        </span>
        <span class="badge bg-emerald-100 text-emerald-800 border border-emerald-200 text-3xs font-mono">+${escapeHtml(colName)}</span>
      </div>
      <table class="table table-sm table-bordered mb-0 text-center" style="font-size: 10px;">
        <thead class="table-light">
          <tr>
            <th class="py-0.5 text-3xs">Row</th>
            <th class="py-0.5 text-3xs">Primary Key</th>
            <th class="py-0.5 text-3xs bg-emerald-100 text-emerald-900 fw-bold">[${escapeHtml(colName)}]</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    </div>
  `;
}

/**
 * Thumbnail for Multi-Page Tab creation & migration
 */
function renderTabThumbnail(container: HTMLElement, action: AiAction): void {
  const tabName = action.tabName || action.destinationTab || "New Tab";
  const isMove = action.action === "move-chart-to-tab";

  container.innerHTML = `
    <div class="w-100 p-2.5 bg-white rounded border">
      <div class="d-flex align-items-center justify-content-between mb-2">
        <span class="text-2xs fw-bold text-slate-700">
          <i class="bi bi-folder2-open text-emerald-600 me-1"></i> Multi-Page Dashboard Tabs
        </span>
        <span class="badge bg-emerald-100 text-emerald-800 text-3xs font-semibold">Canvas Routing</span>
      </div>

      <!-- Simulated tabs bar -->
      <div class="d-flex align-items-center gap-1.5 p-1 bg-slate-100 rounded-3 mb-2">
        <div class="px-2 py-1 bg-white rounded-2 shadow-2xs border text-3xs fw-bold text-dark d-flex align-items-center gap-1">
          <i class="bi bi-grid-fill text-primary"></i> Main Overview
        </div>
        <div class="px-2 py-1 bg-emerald-500 text-white rounded-2 shadow-2xs text-3xs fw-bold d-flex align-items-center gap-1 border border-emerald-600 animate-pulse">
          <i class="bi ${isMove ? 'bi-box-arrow-in-right' : 'bi-folder-plus'}"></i> ${escapeHtml(tabName)}
        </div>
        <div class="px-1.5 py-1 text-slate-400 text-3xs">
          <i class="bi bi-plus"></i>
        </div>
      </div>

      <div class="p-2 rounded-2 bg-slate-50 border border-dashed text-center">
        <span class="text-2xs text-slate-600">
          ${isMove ? `<i class="bi bi-arrow-right-circle text-primary me-1"></i> Moving designated visual charts into <strong>${escapeHtml(tabName)}</strong> tab` : `<i class="bi bi-check2-circle text-success me-1"></i> New isolated dashboard canvas ready for <strong>${escapeHtml(tabName)}</strong>`}
        </span>
      </div>
    </div>
  `;
}

/**
 * Thumbnail for Multi-Dataset AI Blend & Join
 */
function renderJoinThumbnail(container: HTMLElement, action: AiAction): void {
  const left = action.leftDataset || "Orders.csv";
  const right = action.rightDataset || "Customers.csv";
  const leftKey = action.leftKey || "CustomerID";
  const rightKey = action.rightKey || "CustomerID";
  const jType = (action.joinType || "inner").toUpperCase();

  container.innerHTML = `
    <div class="w-100 p-2 bg-white rounded border">
      <div class="d-flex align-items-center justify-content-between mb-1.5">
        <span class="text-2xs fw-bold text-slate-800">
          <i class="bi bi-intersect text-fuchsia-600 me-1"></i> AI Schema Blend Preview
        </span>
        <span class="badge bg-fuchsia-100 text-fuchsia-800 border border-fuchsia-200 text-3xs font-mono">${jType} JOIN</span>
      </div>

      <!-- Join Diagram Schematic -->
      <div class="d-flex align-items-center justify-content-between gap-1 p-1.5 rounded-2 bg-slate-50 border mb-2">
        <div class="p-1.5 bg-white rounded border shadow-2xs flex-grow-1 text-center">
          <div class="text-3xs fw-bold text-primary text-truncate">${escapeHtml(left)}</div>
          <div class="badge bg-slate-100 text-slate-700 text-3xs font-mono mt-0.5">${escapeHtml(leftKey)}</div>
        </div>
        <div class="text-fuchsia-600 fs-6 px-1">
          <i class="bi bi-arrow-left-right"></i>
        </div>
        <div class="p-1.5 bg-white rounded border shadow-2xs flex-grow-1 text-center">
          <div class="text-3xs fw-bold text-indigo-600 text-truncate">${escapeHtml(right)}</div>
          <div class="badge bg-slate-100 text-slate-700 text-3xs font-mono mt-0.5">${escapeHtml(rightKey)}</div>
        </div>
      </div>

      <div class="text-center text-3xs text-secondary">
        <i class="bi bi-magic text-fuchsia-500 me-1"></i> Synthesizes consolidated rows into memory & auto-updates live chart dimensions.
      </div>
    </div>
  `;
}

/**
 * Generic thumbnail for other actions
 */
function renderGenericThumbnail(container: HTMLElement, action: AiAction): void {
  container.innerHTML = `
    <div class="p-3 text-center text-muted">
      <i class="bi bi-gear-wide-connected fs-4 text-primary d-block mb-1"></i>
      <div class="text-xs fw-semibold text-slate-700">${escapeHtml(action.action)}</div>
      <div class="text-2xs text-muted">Ready to execute prospective operation on dashboard</div>
    </div>
  `;
}
