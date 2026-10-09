// src/js/ui/savedViews.js
import { showMessage, safeJsonStringify, sanitizeForStorage } from '../core/utils.ts';
import { visualizations, plotChart } from '../charts/charts.ts';
import { saveDashboardSettings } from '../../store/DataHandler.ts';
import { t } from '../i18n/index.ts';

const SAVED_VIEWS_STORAGE_KEY = 'vedrabi_saved_views';

export function getSavedViews() {
    try {
        const raw = localStorage.getItem(SAVED_VIEWS_STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        console.error("Error reading saved views:", e);
        return [];
    }
}

export function saveSavedViews(views) {
    try {
        localStorage.setItem(SAVED_VIEWS_STORAGE_KEY, safeJsonStringify(views));
    } catch (e) {
        console.error("Error saving saved views:", e);
    }
}

/**
 * Captures a snapshot of a chart card and saves it to Saved Views
 * @param {string} chartId 
 */
export function captureChartSnapshot(chartId) {
    const chartConfig = visualizations.find(v => v.id === chartId);
    if (!chartConfig) {
        showMessage(t('savedViews.configNotFound', 'Chart configuration not found!'), "warning");
        return;
    }

    const container = document.getElementById(`container-${chartId}`) || document.getElementById(chartId);
    let thumbnailDataUrl = '';

    // ECharts instance data URL
    const chartDom = document.getElementById(chartId);
    if (chartDom && typeof window.echarts !== 'undefined') {
        const chartInstance = window.echarts.getInstanceByDom(chartDom);
        if (chartInstance) {
            thumbnailDataUrl = chartInstance.getDataURL({
                type: 'png',
                pixelRatio: 1.5,
                backgroundColor: '#ffffff'
            });
        }
    }

    // Fallback if no ECharts data URL (e.g., canvas or KPI card)
    if (!thumbnailDataUrl && container) {
        const canvas = container.querySelector('canvas');
        if (canvas) {
            try {
                thumbnailDataUrl = canvas.toDataURL('image/png');
            } catch (e) {
                console.warn("Canvas export failed:", e);
            }
        }
    }

    const snapshot = {
        id: 'snap_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        chartId: chartConfig.id,
        title: chartConfig.title || t('savedViews.untitledChart', 'Untitled Chart'),
        type: chartConfig.type || 'bar',
        timestamp: new Date().toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }),
        isoDate: new Date().toISOString(),
        thumbnail: thumbnailDataUrl || '',
        chartConfigCopy: sanitizeForStorage(chartConfig),
        notes: ''
    };

    const views = getSavedViews();
    views.unshift(snapshot); // add newest first
    saveSavedViews(views);

    showMessage(`📸 ${t('savedViews.snapshotSaved', 'Snapshot')} "${snapshot.title}" ${t('savedViews.savedToGallery', 'saved to Gallery!')}`, "success");
    updateSavedViewsBadgeCount();
}

/**
 * Updates the counter badge on the Saved Views button
 */
export function updateSavedViewsBadgeCount() {
    const badge = document.getElementById('savedViewsCountBadge');
    if (badge) {
        const views = getSavedViews();
        badge.innerText = views.length.toString();
        badge.style.display = views.length > 0 ? 'inline-block' : 'none';
    }
}

/**
 * Opens the Saved Views Gallery modal
 */
export function openSavedViewsGalleryModal() {
    let modalEl = document.getElementById('savedViewsGalleryModal');
    if (!modalEl) {
        injectSavedViewsModalHTML();
        modalEl = document.getElementById('savedViewsGalleryModal');
    }

    renderSavedViewsList();

    if (typeof window.bootstrap !== 'undefined' && window.bootstrap.Modal) {
        const bsModal = window.bootstrap.Modal.getOrCreateInstance(modalEl);
        bsModal.show();
    }
}

function injectSavedViewsModalHTML() {
    const modalDiv = document.createElement('div');
    modalDiv.id = 'savedViewsGalleryModal';
    modalDiv.className = 'modal fade';
    modalDiv.tabIndex = -1;
    modalDiv.innerHTML = `
        <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
            <div class="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                <div class="modal-header bg-slate-900 text-white py-3 px-4">
                    <div class="d-flex align-items-center gap-2">
                        <div class="rounded-circle bg-teal-500 bg-opacity-20 p-2 text-teal-400">
                            <i class="bi bi-images fs-5"></i>
                        </div>
                        <div>
                            <h5 class="modal-title font-sans font-bold text-white mb-0" style="font-size: 1.05rem;">
                                ${t('savedViews.galleryTitle', 'Saved Views Gallery')}
                            </h5>
                            <span class="text-slate-400 text-xs">${t('savedViews.gallerySubtitle', 'Captured chart snapshots and filtered visualization states')}</span>
                        </div>
                    </div>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>

                <div class="modal-body p-4 bg-slate-50">
                    <!-- Search & Filter bar -->
                    <div class="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
                        <div class="input-group input-group-sm" style="max-width: 320px;">
                            <span class="input-group-text bg-white border-end-0"><i class="bi bi-search text-muted"></i></span>
                            <input type="text" id="searchSavedViewsInput" class="form-control border-start-0" placeholder="${t('savedViews.searchPlaceholder', 'Search snapshots...')}">
                        </div>
                        <div class="d-flex align-items-center gap-2">
                            <button type="button" class="btn btn-sm btn-outline-danger text-xs rounded-2" id="btnClearAllSavedViews">
                                <i class="bi bi-trash3-fill me-1"></i> ${t('savedViews.clearAll', 'Clear All Snapshots')}
                            </button>
                        </div>
                    </div>

                    <!-- Gallery Grid -->
                    <div class="row g-3" id="savedViewsGridContainer">
                        <!-- Cards injected dynamically -->
                    </div>
                </div>

                <div class="modal-footer bg-white border-top py-2.5 px-4">
                    <button type="button" class="btn btn-secondary btn-sm text-xs px-3" data-bs-dismiss="modal">${t('common.close', 'Close')}</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modalDiv);

    // Event listeners
    const searchInput = document.getElementById('searchSavedViewsInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            renderSavedViewsList(e.target.value);
        });
    }

    const clearAllBtn = document.getElementById('btnClearAllSavedViews');
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', () => {
            if (confirm(t('savedViews.confirmClearAll', 'Are you sure you want to clear all saved snapshots?'))) {
                saveSavedViews([]);
                renderSavedViewsList();
                updateSavedViewsBadgeCount();
                showMessage(t('savedViews.allClearedToast', 'All snapshots cleared.'), "info");
            }
        });
    }
}

function renderSavedViewsList(filterQuery = '') {
    const container = document.getElementById('savedViewsGridContainer');
    if (!container) return;

    let views = getSavedViews();

    if (filterQuery) {
        const q = filterQuery.toLowerCase();
        views = views.filter(v => (v?.title || '').toLowerCase().includes(q) || (v?.type || '').toLowerCase().includes(q));
    }

    if (views.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="bi bi-camera-fill fs-1 text-slate-300 mb-2 d-block"></i>
                <h6 class="fw-bold text-slate-700 mb-1">${t('savedViews.noSnapshotsTitle', 'No snapshots available')}</h6>
                <p class="text-secondary small mb-0">${t('savedViews.noSnapshotsDesc', 'Click the 📸 button on any chart card to capture a snapshot.')}</p>
            </div>
        `;
        return;
    }

    container.innerHTML = views.map(snap => `
        <div class="col-12 col-md-6 col-lg-4">
            <div class="card h-100 border shadow-xs rounded-3 overflow-hidden hover-shadow-md transition-all">
                <!-- Thumbnail -->
                <div class="bg-slate-100 p-2 text-center border-bottom position-relative" style="min-height: 180px; display: flex; align-items: center; justify-content: center;">
                    ${snap.thumbnail ? `
                        <img src="${snap.thumbnail}" alt="${snap.title}" class="img-fluid rounded border" style="max-height: 170px; object-fit: contain;">
                    ` : `
                        <div class="p-4 text-center text-muted">
                            <i class="bi bi-bar-chart-fill fs-2"></i>
                            <div class="small mt-1">${t('savedViews.noThumbnail', 'Thumbnail not available')}</div>
                        </div>
                    `}
                    <span class="badge bg-slate-900 text-white position-absolute top-0 start-0 m-2 px-2 py-1" style="font-size: 0.7rem;">
                        ${(snap.type || 'Chart').toUpperCase()}
                    </span>
                </div>

                <!-- Card Body -->
                <div class="card-body p-3 d-flex flex-column justify-content-between">
                    <div>
                        <h6 class="fw-bold text-slate-900 mb-1 text-truncate" title="${snap.title}">${snap.title}</h6>
                        <div class="text-muted text-xs mb-2">
                            <i class="bi bi-clock me-1"></i> ${snap.timestamp}
                        </div>
                    </div>

                    <!-- Actions -->
                    <div class="d-flex align-items-center justify-content-between gap-1 mt-3 pt-2 border-top">
                        <button type="button" class="btn btn-sm btn-primary text-xs fw-bold rounded-2 px-2.5 py-1 restore-snap-btn" data-snap-id="${snap.id}">
                            <i class="bi bi-arrow-counterclockwise me-1"></i> ${t('savedViews.applyView', 'Apply View')}
                        </button>
                        <div class="d-flex gap-1">
                            ${snap.thumbnail ? `
                                <a href="${snap.thumbnail}" download="${snap.title.replace(/\s+/g, '_')}_snapshot.png" class="btn btn-sm btn-outline-secondary text-xs px-2 py-1" title="${t('savedViews.downloadThumbnail', 'Download Thumbnail')}">
                                    <i class="bi bi-download"></i>
                                </a>
                            ` : ''}
                            <button type="button" class="btn btn-sm btn-outline-danger text-xs px-2 py-1 delete-snap-btn" data-snap-id="${snap.id}" title="${t('common.delete', 'Delete')}">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');

    // Bind event handlers
    container.querySelectorAll('.restore-snap-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const snapId = btn.getAttribute('data-snap-id');
            restoreSavedView(snapId);
        });
    });

    container.querySelectorAll('.delete-snap-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const snapId = btn.getAttribute('data-snap-id');
            deleteSavedView(snapId);
        });
    });
}

/**
 * Restores a saved view configuration to the dashboard
 */
export function restoreSavedView(snapId) {
    const views = getSavedViews();
    const snap = views.find(v => v.id === snapId);
    if (!snap || !snap.chartConfigCopy) {
        showMessage(t('savedViews.detailsNotFound', 'Snapshot details not found!'), "warning");
        return;
    }

    const restoredConfig = JSON.parse(JSON.stringify(snap.chartConfigCopy));
    
    // Check if chart already exists
    const existingIndex = visualizations.findIndex(v => v.id === restoredConfig.id);
    if (existingIndex !== -1) {
        visualizations[existingIndex] = restoredConfig;
    } else {
        visualizations.push(restoredConfig);
    }

    plotChart(restoredConfig);
    saveDashboardSettings();

    // Close modal
    const modalEl = document.getElementById('savedViewsGalleryModal');
    if (modalEl && typeof window.bootstrap !== 'undefined' && window.bootstrap.Modal) {
        const bsModal = window.bootstrap.Modal.getInstance(modalEl);
        if (bsModal) bsModal.hide();
    }

    showMessage(`✅ ${t('savedViews.viewRestoredToast', 'Saved view applied to dashboard successfully!')}`, "success");
}

/**
 * Deletes a saved view
 */
export function deleteSavedView(snapId) {
    let views = getSavedViews();
    views = views.filter(v => v.id !== snapId);
    saveSavedViews(views);
    renderSavedViewsList();
    updateSavedViewsBadgeCount();
    showMessage(t('savedViews.snapshotDeletedToast', 'Snapshot removed.'), "info");
}
