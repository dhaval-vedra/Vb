// src/js/ui/drag_drop.ts
// Vedra BI - Unified Native Drag, Drop & Resize Engine
// Adheres strictly to textbox pointer-event, grid-snapping & alignment guide architecture (from box-events.js & texbox_utils.js)

import { showMessage } from '../core/utils.ts';
import { t } from '../i18n/index.ts';
import { saveDashboardSettings } from '../../store/DataHandler.ts';
import { visualizations, ChartConfig } from '../charts/charts.ts';
import { initEditModeSummaryOverlay, updateEditModeSummaryOverlay } from './editModeSummaryOverlay.ts';
import { 
    showGuide, 
    clearGuides, 
    getAllBoxPositions, 
    snapToGrid, 
    SNAP_THRESHOLD 
} from './texbox_utils.js';

declare const echarts: any;
declare const Plotly: any;
declare const bootstrap: any;

export interface MoveableInstance {
    target: HTMLElement | null;
    draggable: boolean;
    resizable: boolean;
    snappable: boolean;
    destroy: () => void;
    updateRect: () => void;
    getControlBoxElement?: () => HTMLElement;
    on: (eventName: string, handler: (e: any) => void) => MoveableInstance;
    off: (eventName: string, handler?: (e: any) => void) => MoveableInstance;
}

export interface ChartContainerElement extends HTMLElement {
    moveable?: MoveableInstance | null;
    cleanupMoveable?: () => void;
    _kpiObserver?: ResizeObserver;
    _resizeObserver?: ResizeObserver;
    resetMenuTimeout?: () => void;
}

export let isLockModeEnabled: boolean = false;
export let isSnapToGridEnabled: boolean = true;
export const SNAP_GRID_SIZE: number = 10;

/**
 * Toggle or set Snap to Grid alignment mode (10px grid)
 */
export function toggleSnapToGrid(forceState?: boolean): boolean {
    if (typeof forceState === 'boolean') {
        isSnapToGridEnabled = forceState;
    } else {
        isSnapToGridEnabled = !isSnapToGridEnabled;
    }

    const btn = document.getElementById('btnToggleSnapGrid');
    if (btn) {
        btn.classList.toggle('active', isSnapToGridEnabled);
        btn.classList.toggle('btn-primary', isSnapToGridEnabled);
        btn.classList.toggle('btn-outline-secondary', !isSnapToGridEnabled);
    }

    const gridOverlay = document.getElementById('dashboardGridOverlay');
    if (gridOverlay) {
        gridOverlay.classList.toggle('active', isSnapToGridEnabled);
    }

    if (typeof showMessage === 'function') {
        showMessage(
            isSnapToGridEnabled
                ? (t('dragDrop.snapOn') || 'Snap to Grid: ON')
                : (t('dragDrop.snapOff') || 'Snap to Grid: OFF'),
            "info"
        );
    }
    return isSnapToGridEnabled;
}

/**
 * Helper to ensure dashboard grid overlay element exists in DOM
 */
export function ensureGridOverlay(): HTMLElement | null {
    let gridOverlay = document.getElementById('dashboardGridOverlay');
    if (!gridOverlay) {
        const dashboardContent = document.getElementById('dashboardContent');
        if (dashboardContent) {
            gridOverlay = document.createElement('div');
            gridOverlay.id = 'dashboardGridOverlay';
            gridOverlay.className = 'grid-overlay';
            dashboardContent.insertBefore(gridOverlay, dashboardContent.firstChild);
        }
    }
    return gridOverlay;
}

/**
 * Standard debounce utility
 */
function debounce<T extends (...args: any[]) => void>(func: T, wait: number): (...args: Parameters<T>) => void {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    return function executedFunction(...args: Parameters<T>) {
        const later = () => {
            if (timeout) clearTimeout(timeout);
            func(...args);
        };
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Helper to detect if a click/touch originated on an interactive child control
 */
function isInteractiveElement(target: HTMLElement | null): boolean {
    if (!target) return false;
    if (target.getAttribute('contenteditable') === 'true' || target.closest('[contenteditable="true"]')) {
        return true;
    }
    return !!(
        target.closest('.chart-buttons') ||
        target.closest('.dropdown-menu') ||
        target.closest('.chart-filter-dropdown') ||
        target.closest('.chart-filter-btn') ||
        target.closest('.edit-kpi-layout') ||
        target.closest('.edit-chart') ||
        target.closest('.delete-chart') ||
        target.closest('.btn-sm') ||
        target.closest('.type-badge') ||
        target.closest('.category-badge') ||
        target.closest('button') ||
        target.closest('a') ||
        target.closest('.btn') ||
        target.closest('input') ||
        target.closest('select') ||
        target.closest('textarea') ||
        target.closest('.dropdown-item') ||
        target.closest('.kpi-layout-popover') ||
        target.closest('.pcr-app') ||
        target.closest('.modal') ||
        target.closest('.offcanvas') ||
        target.closest('.resize-handle') ||
        target.closest('.card-resize-handle')
    );
}

/**
 * Calculates smart snap position against other dashboard cards (Chart, KPI & Textbox)
 * Uses the exact logic from box-events.js
 */
function calculateSnapPosition(box: HTMLElement, targetX: number, targetY: number): { x: number; y: number } {
    const dashboardContent = document.getElementById('dashboardContent') || document.body;
    const thisRect = box.getBoundingClientRect();
    const width = thisRect.width;
    const height = thisRect.height;

    let nx = targetX;
    let ny = targetY;

    const others = getAllBoxPositions(box);
    
    // Calculate current candidate positions for snapping
    const left = Math.round(nx);
    const right = Math.round(nx + width);
    const centerXpos = Math.round(nx + width / 2);
    const top = Math.round(ny);
    const bottom = Math.round(ny + height);
    const centerYpos = Math.round(ny + height / 2);

    const vCandidates = [
        { name: 'left', pos: left },
        { name: 'centerX', pos: centerXpos },
        { name: 'right', pos: right }
    ];
    const hCandidates = [
        { name: 'top', pos: top },
        { name: 'centerY', pos: centerYpos },
        { name: 'bottom', pos: bottom }
    ];

    // Vertical snapping
    let snappedX = false;
    for (const other of others) {
        const otherVP = [
            { name: 'left', pos: other.left },
            { name: 'centerX', pos: other.centerX },
            { name: 'right', pos: other.right }
        ];
        for (const mine of vCandidates) {
            for (const theirs of otherVP) {
                const diff = Math.abs(mine.pos - theirs.pos);
                if (diff <= SNAP_THRESHOLD) {
                    const delta = theirs.pos - mine.pos;
                    nx += delta;
                    showGuide('vertical', { 
                        x: theirs.pos, 
                        y: 0, 
                        h: window.innerHeight 
                    }, dashboardContent);
                    vCandidates.forEach(c => c.pos += delta);
                    snappedX = true;
                    break;
                }
            }
            if (snappedX) break;
        }
        if (snappedX) break;
    }

    // Horizontal snapping
    let snappedY = false;
    for (const other of others) {
        const otherHP = [
            { name: 'top', pos: other.top },
            { name: 'centerY', pos: other.centerY },
            { name: 'bottom', pos: other.bottom }
        ];
        for (const mine of hCandidates) {
            for (const theirs of otherHP) {
                const diff = Math.abs(mine.pos - theirs.pos);
                if (diff <= SNAP_THRESHOLD) {
                    const delta = theirs.pos - mine.pos;
                    ny += delta;
                    showGuide('horizontal', { 
                        x: 0, 
                        y: theirs.pos, 
                        w: window.innerWidth 
                    }, dashboardContent);
                    hCandidates.forEach(c => c.pos += delta);
                    snappedY = true;
                    break;
                }
            }
            if (snappedY) break;
        }
        if (snappedY) break;
    }

    return { x: nx, y: ny };
}

/**
 * Reinitializes drag and resize controllers for all chart and KPI containers
 */
export function reinitializeAllCharts(): void {
    document.querySelectorAll<ChartContainerElement>('.visualization-container').forEach((container) => {
        const chartId = container.id.replace('container-', '');
        const chartDom = document.getElementById(chartId);
        const chartConfig = visualizations.find(v => v.id === chartId);
        
        if (chartConfig && !chartConfig.pinned) {
            if (chartConfig.type === 'kpi_sparkline' || chartConfig.type === 'template_card') {
                setTimeout(() => {
                    initializeDragAndResize(container);
                }, 50);
            } else if (chartDom) {
                setTimeout(() => {
                    const isPlotlyChart = ['candlestick', 'ohlc'].includes(chartConfig.type);
                    if (isPlotlyChart) {
                        initializeDragAndResize(container, null, true);
                    } else if (typeof echarts !== 'undefined') {
                        const chartInstance = echarts.getInstanceByDom(chartDom);
                        if (chartInstance) {
                            initializeDragAndResize(container, chartInstance);
                        } else {
                            initializeDragAndResize(container);
                        }
                    } else {
                        initializeDragAndResize(container);
                    }
                }, 50);
            }
        }
    });
}

/**
 * Toggle Lock Mode for drag & drop and resizing
 */
export function toggleLockMode(): void {
    try {
        isLockModeEnabled = !isLockModeEnabled;
        const toggleButton = document.getElementById('toggleLockModeBtn');
        
        if (toggleButton) {
            toggleButton.classList.remove('btn-success', 'btn-danger', 'btn-outline-secondary', 'btn-outline-danger', 'btn-warning', 'locked');
            
            if (isLockModeEnabled) {
                showMessage("Dashboard Locked: Chart drag and resize disabled.", 'info');
                toggleButton.innerHTML = '<i class="bi bi-lock-fill text-danger"></i>';
                toggleButton.classList.add('btn-outline-danger', 'locked');
                toggleButton.title = "Dashboard Locked (Click to Unlock)";
                toggleButton.setAttribute('aria-label', "Unlock Dashboard");
                document.body.classList.add('dashboard-locked');
                
                // Cleanup all active instances
                document.querySelectorAll<ChartContainerElement>('.visualization-container').forEach((container) => {
                    if (container.cleanupMoveable) {
                        container.cleanupMoveable();
                    }
                });
            } else {
                showMessage("Dashboard Unlocked: Drag and resize enabled.", 'info');
                toggleButton.innerHTML = '<i class="bi bi-unlock"></i>';
                toggleButton.classList.add('btn-outline-secondary');
                toggleButton.title = "Dashboard Unlocked (Click to Lock)";
                toggleButton.setAttribute('aria-label', "Lock Dashboard");
                document.body.classList.remove('dashboard-locked');
                
                // Reinitialize all charts
                reinitializeAllCharts();
            }
        }
        
        saveDashboardSettings();
        updateEditModeSummaryOverlay();
    } catch (error) {
        console.error('Error in toggleLockMode:', error);
        showMessage('Error toggling lock mode', 'danger');
    }
}

/**
 * Native Drag and Resize Controller for Chart and KPI containers
 * Built using the same native Pointer Events & Snapping logic as Textbox (box-events.js)
 * @param chartElement - Chart or KPI container HTMLElement
 * @param echartsInstance - ECharts instance (optional)
 * @param isPlotlyChart - Whether container holds a Plotly chart
 */
export function initializeDragAndResize(
    chartElement: ChartContainerElement,
    echartsInstance: any = null,
    isPlotlyChart: boolean = false
): MoveableInstance | null {
    if (!chartElement) return null;

    try {
        // Destroy existing instance if already attached
        if (chartElement.cleanupMoveable) {
            chartElement.cleanupMoveable();
        }

        const chartId = chartElement.id.replace('container-', '');
        const chartConfig = visualizations.find(v => v.id === chartId);

        // Check if locked or pinned
        if (chartConfig && chartConfig.pinned) {
            chartElement.classList.add('pinned-chart');
            return null;
        }

        const isKpiCard = chartConfig?.type === 'kpi_sparkline' || 
                          chartConfig?.type === 'template_card' ||
                          chartElement.classList.contains('kpi-sparkline-card') ||
                          chartElement.classList.contains('template-card-container');
        const minWidth = isKpiCard ? 160 : 260;
        const minHeight = isKpiCard ? 70 : 140;

        // Ensure container has absolute positioning and proper base touch styling
        chartElement.style.position = 'absolute';
        chartElement.style.touchAction = 'none';

        // Read or establish initial position
        let currentX = chartElement.offsetLeft;
        let currentY = chartElement.offsetTop;

        // Ensure single corner .resize-handle exists (matching textbox style)
        let resizeHandle = chartElement.querySelector(':scope > .resize-handle') as HTMLElement;
        if (!resizeHandle) {
            resizeHandle = document.createElement('div');
            resizeHandle.className = 'resize-handle';
            resizeHandle.title = t('editor.resize') || 'Resize';
            chartElement.appendChild(resizeHandle);
        }

        // Also ensure corner handles exist for multi-directional resizing if needed
        const cornerTypes = ['se', 'sw', 'ne', 'nw', 'e', 'w', 's', 'n'];
        const createdHandles: HTMLElement[] = [resizeHandle];
        
        cornerTypes.forEach(pos => {
            let handle = chartElement.querySelector(`:scope > .card-resize-handle.resize-handle-${pos}`) as HTMLElement;
            if (!handle) {
                handle = document.createElement('div');
                handle.className = `card-resize-handle resize-handle-${pos}`;
                handle.setAttribute('data-handle', pos);
                chartElement.appendChild(handle);
            }
            createdHandles.push(handle);
        });

        // Focus / Z-Index management: bring selected card to top cleanly
        const bringToFront = () => {
            document.querySelectorAll<ChartContainerElement>('.visualization-container').forEach(c => {
                if (c !== chartElement && !c.classList.contains('is-dragging') && !c.classList.contains('is-resizing')) {
                    c.style.zIndex = '10';
                    c.classList.remove('is-active');
                }
            });
            chartElement.style.zIndex = '30';
            chartElement.classList.add('is-active');
        };

        // Resize Canvas Trigger
        const triggerCanvasResize = () => {
            const chartDom = document.getElementById(chartId);
            if (chartDom) {
                if (echartsInstance && typeof echartsInstance.resize === 'function') {
                    try {
                        const isDisposed = typeof echartsInstance.isDisposed === 'function' ? echartsInstance.isDisposed() : false;
                        if (!isDisposed) echartsInstance.resize();
                    } catch (e) {}
                } else if (typeof echarts !== 'undefined') {
                    try {
                        const inst = echarts.getInstanceByDom(chartDom);
                        if (inst && (typeof inst.isDisposed === 'function' ? !inst.isDisposed() : true)) {
                            inst.resize();
                        }
                    } catch (e) {}
                }

                if (isPlotlyChart && typeof Plotly !== 'undefined') {
                    try {
                        Plotly.Plots.resize(chartDom);
                    } catch (_) {}
                }
            }

            const kpiCanvas = chartElement.querySelector('.sparkline-canvas') as HTMLCanvasElement;
            if (kpiCanvas && (window as any).Chart) {
                try {
                    const chartJsInst = (window as any).Chart.getChart(kpiCanvas);
                    if (chartJsInst) chartJsInst.resize();
                } catch (_) {}
            }

            // Trigger template card resize if present
            if (typeof (chartElement as any)._onTemplateResize === 'function') {
                try {
                    (chartElement as any)._onTemplateResize();
                } catch (_) {}
            }
        };

        const debouncedResize = debounce(triggerCanvasResize, 40);

        // State variables for Drag and Resize operations (matching box-events.js)
        let isDragging = false;
        let isResizing = false;
        let startX = 0;
        let startY = 0;
        let startWidth = 0;
        let startHeight = 0;
        let activeHandleType = 'se';
        let dragRafId: number | null = null;
        let resizeRafId: number | null = null;

        // --- 1. CARD POINTER DOWN (DRAG START) ---
        const onCardPointerDown = (e: PointerEvent) => {
            if (isLockModeEnabled || isResizing) return;
            if (e.pointerType === 'mouse' && e.button !== 0) return;
            const target = e.target as HTMLElement | null;

            if (isInteractiveElement(target)) {
                return;
            }

            const isKpiCard = chartConfig?.type === 'kpi_sparkline' || 
                              chartConfig?.type === 'template_card' ||
                              chartElement.classList.contains('kpi-sparkline-card') ||
                              chartElement.classList.contains('template-card-container') ||
                              chartElement.classList.contains('kpi-native-card');

            // Only allow dragging from headers, grips, titles, card background, or anywhere on KPI / template card
            const isHeaderOrGrip = target?.closest('.chart-card-header') || 
                                   target?.closest('.drag-grip') || 
                                   target?.closest('.chart-title') ||
                                   target === chartElement ||
                                   target?.closest('.card-body') ||
                                   target?.closest('.kpi-content-wrapper') ||
                                   target?.closest('.template-card-inner') ||
                                   target?.closest('.card-template') ||
                                   target?.closest('.kpi-card') ||
                                   target?.closest('.gauge-card') ||
                                   target?.closest('.progress-card') ||
                                   target?.closest('.kpi-sparkline-card') ||
                                   target?.closest('.template-card-container') ||
                                   target?.closest('.kpi-native-card') ||
                                   isKpiCard;

            if (!isHeaderOrGrip && target?.closest('.chart-canvas')) {
                return;
            }

            if (e.cancelable) {
                e.preventDefault();
            }

            bringToFront();
            isDragging = true;
            chartElement.classList.add('is-dragging');
            chartElement.style.zIndex = '1050';

            currentX = chartElement.offsetLeft;
            currentY = chartElement.offsetTop;
            startX = e.clientX - currentX;
            startY = e.clientY - currentY;

            try {
                chartElement.setPointerCapture(e.pointerId);
            } catch (_) {}

            window.addEventListener('pointermove', onCardPointerMove, { passive: false });
            window.addEventListener('pointerup', onCardPointerUp);
            window.addEventListener('pointercancel', onCardPointerUp);

            if (typeof chartElement.resetMenuTimeout === 'function') {
                chartElement.resetMenuTimeout();
            }
        };

        // --- 2. CARD POINTER MOVE (DRAG MOVE WITH SNAPPING & RAF) ---
        const onCardPointerMove = (e: PointerEvent) => {
            if (isLockModeEnabled || !isDragging) return;

            let nx = e.clientX - startX;
            let ny = e.clientY - startY;

            // Apply grid snapping (10px grid matching textbox)
            if (isSnapToGridEnabled && SNAP_GRID_SIZE > 0) {
                nx = snapToGrid(nx, SNAP_GRID_SIZE);
                ny = snapToGrid(ny, SNAP_GRID_SIZE);
            }

            clearGuides();

            // Calculate alignment snap position against other cards & textboxes
            const snappedPosition = calculateSnapPosition(chartElement, nx, ny);
            currentX = Math.max(0, snappedPosition.x);
            currentY = Math.max(0, snappedPosition.y);

            if (dragRafId) cancelAnimationFrame(dragRafId);
            dragRafId = requestAnimationFrame(() => {
                chartElement.style.left = currentX + 'px';
                chartElement.style.top = currentY + 'px';
            });
        };

        // --- 3. CARD POINTER UP (DRAG END & PERSISTENCE) ---
        const onCardPointerUp = (e: PointerEvent) => {
            if (!isDragging) return;
            isDragging = false;

            window.removeEventListener('pointermove', onCardPointerMove);
            window.removeEventListener('pointerup', onCardPointerUp);
            window.removeEventListener('pointercancel', onCardPointerUp);

            if (dragRafId) {
                cancelAnimationFrame(dragRafId);
                dragRafId = null;
            }
            
            try {
                if (chartElement.hasPointerCapture(e.pointerId)) {
                    chartElement.releasePointerCapture(e.pointerId);
                }
            } catch (_) {}

            chartElement.classList.remove('is-dragging');
            chartElement.style.zIndex = '30';
            setTimeout(() => { clearGuides(); }, 200);

            // Persist new position
            if (chartConfig) {
                chartConfig.position = { 
                    left: `${Math.max(0, chartElement.offsetLeft)}px`, 
                    top: `${Math.max(0, chartElement.offsetTop)}px` 
                };
                saveDashboardSettings();
                updateEditModeSummaryOverlay();
            }
        };

        // --- 4. RESIZE HANDLE POINTER DOWN ---
        const onResizePointerDown = (e: PointerEvent) => {
            if (isLockModeEnabled) return;
            if (e.pointerType === 'mouse' && e.button !== 0) return;
            e.stopPropagation();
            if (e.cancelable) e.preventDefault();

            const handleEl = e.currentTarget as HTMLElement;
            activeHandleType = handleEl.getAttribute('data-handle') || 'se';

            bringToFront();
            isResizing = true;
            startX = e.clientX;
            startY = e.clientY;
            startWidth = chartElement.offsetWidth;
            startHeight = chartElement.offsetHeight;
            currentX = chartElement.offsetLeft;
            currentY = chartElement.offsetTop;

            try {
                handleEl.setPointerCapture(e.pointerId);
            } catch (_) {}

            chartElement.classList.add('is-resizing');
            chartElement.style.zIndex = '1050';

            window.addEventListener('pointermove', onResizePointerMove, { passive: false });
            window.addEventListener('pointerup', onResizePointerUp);
            window.addEventListener('pointercancel', onResizePointerUp);
        };

        // --- 5. RESIZE HANDLE POINTER MOVE (RAF SMOOTHING) ---
        const onResizePointerMove = (e: PointerEvent) => {
            if (!isResizing || isLockModeEnabled) return;

            const dx = e.clientX - startX;
            const dy = e.clientY - startY;

            let newW = startWidth;
            let newH = startHeight;
            let newX = currentX;
            let newY = currentY;

            if (activeHandleType.includes('e')) {
                newW = Math.max(minWidth, Math.round(startWidth + dx));
            } else if (activeHandleType.includes('w')) {
                const calcW = Math.max(minWidth, Math.round(startWidth - dx));
                newX = Math.max(0, currentX + (startWidth - calcW));
                newW = calcW;
            }

            if (activeHandleType.includes('s')) {
                newH = Math.max(minHeight, Math.round(startHeight + dy));
            } else if (activeHandleType.includes('n')) {
                const calcH = Math.max(minHeight, Math.round(startHeight - dy));
                newY = Math.max(0, currentY + (startHeight - calcH));
                newH = calcH;
            }

            // Maintain aspect ratio when Shift is held (matching textbox)
            if (e.shiftKey) {
                const aspectRatio = (startWidth > 0 && startHeight > 0) ? (startWidth / startHeight) : 1;
                if (Math.abs(dx) > Math.abs(dy)) {
                    newH = Math.round(newW / aspectRatio);
                } else {
                    newW = Math.round(newH * aspectRatio);
                }
                newW = Math.max(minWidth, newW);
                newH = Math.max(minHeight, newH);
            }

            if (resizeRafId) cancelAnimationFrame(resizeRafId);
            resizeRafId = requestAnimationFrame(() => {
                chartElement.style.width = newW + 'px';
                chartElement.style.height = newH + 'px';
                if (newX !== currentX) chartElement.style.left = newX + 'px';
                if (newY !== currentY) chartElement.style.top = newY + 'px';
            });

            debouncedResize();
        };

        // --- 6. RESIZE HANDLE POINTER UP ---
        const onResizePointerUp = (e: PointerEvent) => {
            if (!isResizing) return;
            isResizing = false;

            window.removeEventListener('pointermove', onResizePointerMove);
            window.removeEventListener('pointerup', onResizePointerUp);
            window.removeEventListener('pointercancel', onResizePointerUp);

            if (resizeRafId) {
                cancelAnimationFrame(resizeRafId);
                resizeRafId = null;
            }

            const handleEl = e.currentTarget as HTMLElement;
            try {
                if (handleEl && handleEl.hasPointerCapture && handleEl.hasPointerCapture(e.pointerId)) {
                    handleEl.releasePointerCapture(e.pointerId);
                }
            } catch (_) {}

            chartElement.classList.remove('is-resizing');
            chartElement.style.zIndex = '30';
            triggerCanvasResize();

            // Persist new size & position
            if (chartConfig) {
                chartConfig.size = { 
                    width: `${chartElement.offsetWidth}px`, 
                    height: `${chartElement.offsetHeight}px` 
                };
                chartConfig.position = { 
                    left: `${Math.max(0, chartElement.offsetLeft)}px`, 
                    top: `${Math.max(0, chartElement.offsetTop)}px` 
                };
                saveDashboardSettings();
                updateEditModeSummaryOverlay();
            }
        };

        // Attach listeners to Card container
        chartElement.addEventListener('pointerdown', onCardPointerDown);
        chartElement.addEventListener('pointermove', onCardPointerMove);
        chartElement.addEventListener('pointerup', onCardPointerUp);
        chartElement.addEventListener('pointercancel', onCardPointerUp);

        // Attach listeners to all Resize Handles
        createdHandles.forEach(handle => {
            handle.addEventListener('pointerdown', onResizePointerDown);
            handle.addEventListener('pointermove', onResizePointerMove);
            handle.addEventListener('pointerup', onResizePointerUp);
            handle.addEventListener('pointercancel', onResizePointerUp);
        });

        // Setup ResizeObserver for external or container resizing
        let resizeObserver: ResizeObserver | null = null;
        if (typeof ResizeObserver !== 'undefined') {
            resizeObserver = new ResizeObserver(() => {
                debouncedResize();
            });
            resizeObserver.observe(chartElement);
        }

        // Return Moveable-compatible controller
        const controller: MoveableInstance = {
            target: chartElement,
            draggable: true,
            resizable: true,
            snappable: true,
            destroy: () => {
                if (chartElement.cleanupMoveable) {
                    chartElement.cleanupMoveable();
                }
            },
            updateRect: () => {
                triggerCanvasResize();
            },
            on: (_name: string, _fn: any) => controller,
            off: (_name: string, _fn?: any) => controller
        };

        chartElement.moveable = controller;
        chartElement.cleanupMoveable = () => {
            window.removeEventListener('pointermove', onCardPointerMove);
            window.removeEventListener('pointerup', onCardPointerUp);
            window.removeEventListener('pointercancel', onCardPointerUp);
            window.removeEventListener('pointermove', onResizePointerMove);
            window.removeEventListener('pointerup', onResizePointerUp);
            window.removeEventListener('pointercancel', onResizePointerUp);

            chartElement.removeEventListener('pointerdown', onCardPointerDown);
            chartElement.removeEventListener('pointermove', onCardPointerMove);
            chartElement.removeEventListener('pointerup', onCardPointerUp);
            chartElement.removeEventListener('pointercancel', onCardPointerUp);

            createdHandles.forEach(handle => {
                handle.removeEventListener('pointerdown', onResizePointerDown);
                handle.removeEventListener('pointermove', onResizePointerMove);
                handle.removeEventListener('pointerup', onResizePointerUp);
                handle.removeEventListener('pointercancel', onResizePointerUp);
                if (handle !== resizeHandle) {
                    handle.remove();
                }
            });

            if (resizeObserver) {
                resizeObserver.disconnect();
                resizeObserver = null;
            }

            delete chartElement.moveable;
            delete chartElement.cleanupMoveable;
        };

        return controller;

    } catch (error) {
        console.error('Error initializing drag-resize:', error);
        showMessage(t('dragDrop.initError') || 'Error initializing card drag-resize', 'danger');
        return null;
    }
}

/**
 * Destroys moveable / drag-resize instance attached to a chart or KPI container
 */
export function destroyChartMoveable(chartElement: ChartContainerElement | null): void {
    try {
        if (chartElement && typeof chartElement.cleanupMoveable === 'function') {
            chartElement.cleanupMoveable();
        }
    } catch (error) {
        console.error('Error destroying chart moveable:', error);
    }
}

/**
 * Cleans up all active drag-resize instances across the dashboard
 */
export function cleanupAllMoveables(): void {
    document.querySelectorAll<ChartContainerElement>('.visualization-container').forEach(container => {
        destroyChartMoveable(container);
    });
}

/**
 * Keyboard shortcuts listener (Ctrl+L, Ctrl+G, Ctrl+S, ?)
 */
export function initializeKeyboardShortcuts(): void {
    document.addEventListener('keydown', (e: KeyboardEvent) => {
        const activeEl = document.activeElement as HTMLElement | null;
        const isInput = !!(
            activeEl &&
            (['INPUT', 'TEXTAREA', 'SELECT'].includes(activeEl.tagName) || activeEl.isContentEditable)
        );

        // Lock mode (Ctrl+L)
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'l') {
            e.preventDefault();
            toggleLockMode();
            return;
        }

        // Toggle Snap-to-grid (Ctrl+G)
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'g') {
            e.preventDefault();
            toggleSnapToGrid();
            return;
        }

        // Save Dashboard (Ctrl+S)
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
            e.preventDefault();
            if (typeof saveDashboardSettings === 'function') {
                saveDashboardSettings();
                showMessage(t('dragDrop.layoutSaved') || 'Layout saved', "success");
            }
            return;
        }

        // Hotkeys Cheat Sheet Modal (? or Shift+/)
        if ((e.key === '?' || (e.shiftKey && e.key === '/')) && !isInput) {
            e.preventDefault();
            const hotkeysModalEl = document.getElementById('hotkeysModal');
            if (hotkeysModalEl && typeof bootstrap !== 'undefined') {
                const modalInst = bootstrap.Modal.getOrCreateInstance(hotkeysModalEl);
                modalInst.toggle();
            }
            return;
        }
    });
}

/**
 * Page unload cleanup listener
 */
export function initializePageCleanup(): void {
    window.addEventListener('beforeunload', () => {
        cleanupAllMoveables();
    });
}

export interface AutoFitOptions {
    cols?: number;
    silent?: boolean;
    animate?: boolean;
}

/**
 * Grid-Auto-Fit Layout Engine:
 * Intelligently computes gapless Bento-Grid coordinates based on viewport width
 * and card types (KPI metric cards vs full analytical charts), eliminating awkward whitespace
 * and automatically recalibrating dynamically on window and sidebar resize.
 *
 * @param options - Configuration options (cols, silent, animate)
 */
export function autoFitGridLayout(options: AutoFitOptions = {}): void {
    const containers = Array.from(document.querySelectorAll<ChartContainerElement>('.visualization-container'));
    if (!containers.length) {
        if (!options.silent && typeof showMessage === 'function') {
            showMessage(t('dragDrop.noCardsFound') || 'No cards found', "info");
        }
        return;
    }

    const dashboard = document.getElementById('dashboardContent');
    const containerWidth = dashboard ? dashboard.clientWidth : (window.innerWidth - 80);
    
    // Determine dynamic optimal column count if not explicitly provided
    let cols = options.cols;
    if (!cols || cols < 1) {
        if (containerWidth < 640) {
            cols = 1;
        } else if (containerWidth < 1120) {
            cols = 2;
        } else if (containerWidth < 1680) {
            cols = 3;
        } else {
            cols = 4;
        }
    }

    const padding = 16;
    const gap = 16;
    const availableWidth = Math.max(300, containerWidth - (padding * 2));
    const unitColWidth = Math.floor((availableWidth - (gap * (cols - 1))) / cols);

    // Track cumulative column heights for a gapless, compact bento-grid packing algorithm
    const colHeights = new Array(cols).fill(0);

    const animate = options.animate !== false;

    containers.forEach((container) => {
        const chartId = container.id.replace('container-', '');
        const chartConfig = visualizations.find(v => v.id === chartId);
        const isKpiCard = chartConfig?.type === 'kpi_sparkline' || container.classList.contains('kpi-sparkline-card');

        // Dynamic Bento sizing:
        // KPI Cards: compact metric tile height (165px)
        // Standard Charts: analytical height (370px)
        const cardHeight = isKpiCard ? 165 : 370;
        
        // Find column with the minimum cumulative height (tight bento packing)
        let targetCol = 0;
        let minHeight = colHeights[0];
        for (let c = 1; c < cols; c++) {
            if (colHeights[c] < minHeight) {
                minHeight = colHeights[c];
                targetCol = c;
            }
        }

        const left = padding + targetCol * (unitColWidth + gap);
        const top = padding + colHeights[targetCol];
        const width = unitColWidth;

        // Update column height tracker
        colHeights[targetCol] += cardHeight + gap;

        if (animate) {
            container.style.transition = 'left 0.3s cubic-bezier(0.16, 1, 0.3, 1), top 0.3s cubic-bezier(0.16, 1, 0.3, 1), width 0.3s cubic-bezier(0.16, 1, 0.3, 1), height 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
        } else {
            container.style.transition = 'none';
        }

        container.style.left = `${left}px`;
        container.style.top = `${top}px`;
        container.style.width = `${width}px`;
        container.style.height = `${cardHeight}px`;

        if (chartConfig) {
            chartConfig.position = { top: `${top}px`, left: `${left}px` };
            chartConfig.size = { width: `${width}px`, height: `${cardHeight}px` };
        }

        // Trigger chart rendering engine resizes
        const triggerChartResize = () => {
            const chartDom = document.getElementById(chartId);
            if (chartDom) {
                if (typeof echarts !== 'undefined') {
                    try {
                        const inst = echarts.getInstanceByDom(chartDom);
                        if (inst && (typeof inst.isDisposed === 'function' ? !inst.isDisposed() : true)) {
                            inst.resize();
                        }
                    } catch (e) {}
                }
                if (typeof Plotly !== 'undefined') {
                    try { Plotly.Plots.resize(chartDom); } catch (_) {}
                }
            }
            const kpiCanvas = container.querySelector('.sparkline-canvas') as HTMLCanvasElement;
            if (kpiCanvas && (window as any).Chart) {
                try {
                    const chartJsInst = (window as any).Chart.getChart(kpiCanvas);
                    if (chartJsInst) chartJsInst.resize();
                } catch (_) {}
            }
        };

        if (animate) {
            setTimeout(() => {
                container.style.transition = '';
                triggerChartResize();
            }, 320);
        } else {
            triggerChartResize();
        }
    });

    // Update parent container minimum height so scroll and padding remain perfect
    if (dashboard) {
        const totalHeight = Math.max(...colHeights) + padding + 40;
        dashboard.style.minHeight = `${totalHeight}px`;
    }

    if (!options.silent) {
        saveDashboardSettings();
        updateEditModeSummaryOverlay();
        if (typeof showMessage === 'function') {
            showMessage(
                (t('dragDrop.autoArranged') || 'Grid-Auto-Fit: {count} cards calibrated in {cols} columns')
                    .replace('{count}', String(containers.length))
                    .replace('{cols}', String(cols)),
                "success"
            );
        }
    }
}

/**
 * Backwards-compatible alias for autoFitGridLayout
 * @param cols - Optional explicit number of columns
 */
export function autoArrangeGridLayout(cols?: number): void {
    autoFitGridLayout({ cols, silent: false, animate: true });
}

// Window and Container Resize Engine for Automatic Responsive Preservation
let lastRecalibratedWidth = 0;

/**
 * Preserves element places and spatial hierarchy across different screen sizes.
 * Instead of destructively shuffling cards into arbitrary columns on window/screen resize, it:
 * 1. Keeps each card at its intentional saved/designed coordinates.
 * 2. Horizontally clamps elements so they never overflow the container boundary on narrower screens.
 * 3. Safely triggers chart canvas reflow (ECharts, Plotly, Sparklines) to remain crisp without shifting position.
 * 4. Adjusts the dashboard container's minimum height to prevent any clipping.
 */
export function recalibrateResponsiveBounds(): void {
    const dashboard = document.getElementById('dashboardContent');
    if (!dashboard) return;
    const containerWidth = dashboard.clientWidth || window.innerWidth;
    const containers = Array.from(document.querySelectorAll<ChartContainerElement>('.visualization-container'));
    if (!containers.length) return;

    let maxBottom = 500;

    containers.forEach(container => {
        const chartId = container.id.replace('container-', '');
        const chartConfig = visualizations.find(v => v.id === chartId);

        // Base coordinates from config or current styling
        const baseLeftStr = chartConfig?.position?.left || container.style.left || '15px';
        const baseTopStr = chartConfig?.position?.top || container.style.top || '15px';
        const baseWidthStr = chartConfig?.size?.width || container.style.width || '350px';
        const baseHeightStr = chartConfig?.size?.height || container.style.height || '220px';

        const rawLeft = parseInt(baseLeftStr, 10);
        const rawTop = parseInt(baseTopStr, 10);
        const baseLeft = isNaN(rawLeft) ? 15 : rawLeft;
        const baseTop = isNaN(rawTop) ? 15 : rawTop;
        const baseHeight = parseInt(baseHeightStr, 10) || 220;

        let activeWidth = 350;
        if (typeof baseWidthStr === 'string' && (baseWidthStr.includes('calc') || baseWidthStr.includes('%'))) {
            container.style.width = baseWidthStr;
            activeWidth = container.offsetWidth || Math.max(280, containerWidth - 30);
        } else {
            const parsedW = parseInt(baseWidthStr, 10) || 350;
            const availableWidth = Math.max(280, containerWidth - 30);
            if (parsedW > availableWidth) {
                activeWidth = availableWidth;
                container.style.width = `${activeWidth}px`;
            } else {
                activeWidth = parsedW;
                container.style.width = `${parsedW}px`;
            }
        }

        // Clamp left coordinate so card never overflows off-screen on narrower devices
        const maxLeft = Math.max(15, containerWidth - activeWidth - 15);
        const clampedLeft = Math.min(baseLeft, maxLeft);
        container.style.left = `${clampedLeft}px`;
        container.style.top = `${baseTop}px`;

        const cardBottom = baseTop + baseHeight;
        if (cardBottom > maxBottom) {
            maxBottom = cardBottom;
        }

        // Trigger chart rendering engine canvas resize to keep visualization crisp
        const chartDom = document.getElementById(chartId);
        if (chartDom && typeof echarts !== 'undefined') {
            try {
                const inst = echarts.getInstanceByDom(chartDom);
                if (inst && (typeof inst.isDisposed === 'function' ? !inst.isDisposed() : true)) {
                    inst.resize();
                }
            } catch (_) {}
        }
        if (chartDom && typeof Plotly !== 'undefined') {
            try { Plotly.Plots.resize(chartDom); } catch (_) {}
        }
        const kpiCanvas = container.querySelector('.sparkline-canvas') as HTMLCanvasElement;
        if (kpiCanvas && (window as any).Chart) {
            try {
                const chartJsInst = (window as any).Chart.getChart(kpiCanvas);
                if (chartJsInst) chartJsInst.resize();
            } catch (_) {}
        }
    });

    // Also handle standalone .box textboxes
    const standaloneBoxes = Array.from(document.querySelectorAll<HTMLElement>('.box'));
    standaloneBoxes.forEach(box => {
        const transform = box.style.transform || '';
        const match = transform.match(/translate\(([-\d.]+)px,\s*([-\d.]+)px\)/);
        if (match) {
            const curX = parseFloat(match[1]);
            const curY = parseFloat(match[2]);
            const boxWidth = box.offsetWidth || 300;
            const maxAllowedX = Math.max(15, containerWidth - boxWidth - 15);
            if (curX > maxAllowedX) {
                box.style.transform = `translate(${maxAllowedX}px, ${curY}px) rotate(0deg)`;
            }
        }
    });

    dashboard.style.minHeight = `${maxBottom + 50}px`;
}

const debouncedWindowResizeRecalibrate = debounce(() => {
    const dashboard = document.getElementById('dashboardContent');
    const currentWidth = dashboard ? dashboard.clientWidth : window.innerWidth;
    if (Math.abs(currentWidth - lastRecalibratedWidth) >= 15) {
        lastRecalibratedWidth = currentWidth;
        recalibrateResponsiveBounds();
    }
}, 140);

/**
 * Initializes automatic responsive recalibration listeners on window & dashboard
 */
export function initializeGridAutoFitEngine(): void {
    window.addEventListener('resize', debouncedWindowResizeRecalibrate);
    
    // Also observe dashboard container size changes (e.g. sidebar expand/collapse/fullscreen)
    const dashboard = document.getElementById('dashboardContent');
    if (dashboard && typeof ResizeObserver !== 'undefined') {
        const ro = new ResizeObserver(() => {
            debouncedWindowResizeRecalibrate();
        });
        ro.observe(dashboard);
    }
}

// Page load initialization for shortcuts, UI bindings & Auto-Fit Engine
if (typeof window !== 'undefined') {
    (window as any).autoFitGridLayout = autoFitGridLayout;
    (window as any).autoArrangeGridLayout = autoArrangeGridLayout;
    (window as any).recalibrateResponsiveBounds = recalibrateResponsiveBounds;
    (window as any).initializeGridAutoFitEngine = initializeGridAutoFitEngine;
}

if (typeof document !== 'undefined') {
    const initEngine = () => {
        initializeKeyboardShortcuts();
        initializePageCleanup();
        initEditModeSummaryOverlay();
        initializeGridAutoFitEngine();

        const snapGridBtn = document.getElementById('btnToggleSnapGrid');
        if (snapGridBtn) {
            snapGridBtn.addEventListener('click', (e) => {
                e.preventDefault();
                toggleSnapToGrid();
            });
        }

        const autoGridBtn = document.getElementById('btnAutoArrangeGrid');
        if (autoGridBtn) {
            autoGridBtn.addEventListener('click', (e) => {
                e.preventDefault();
                autoFitGridLayout({ silent: false, animate: true });
            });
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initEngine);
    } else {
        initEngine();
    }
}
