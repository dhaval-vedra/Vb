// src/js/layout/multiDashboard.ts
import { 
    getDashboardsList, 
    getActiveDashboardId, 
    createNewDashboard, 
    renameDashboard, 
    deleteDashboard, 
    switchDashboard,
    moveChartToDashboard
} from '../../store/DataHandler.ts';
import { visualizations } from '../charts/charts.ts';
import { showMessage, showCustomPrompt, showCustomConfirm } from '../core/utils.ts';

export function initializeMultiDashboard(): void {
    let dashboardPanel = document.getElementById('multiDashboardPanel');
    if (!dashboardPanel) {
        const dashboardContent = document.getElementById('dashboardContent');
        if (dashboardContent && dashboardContent.parentNode) {
            dashboardPanel = document.createElement('div');
            dashboardPanel.id = 'multiDashboardPanel';
            dashboardPanel.className = 'd-flex align-items-center justify-content-between flex-wrap gap-2 pt-2 pb-1 px-2 border-top bg-light-subtle rounded-bottom mt-2';
            dashboardPanel.innerHTML = `
                <div class="dashboard-tabs-scroll-wrapper d-flex align-items-center gap-1.5 overflow-x-auto" id="dashboardTabsList" style="scrollbar-width: thin;"></div>
                <div class="d-flex align-items-center gap-1 ms-auto">
                    <button id="btnCreateDashboard" class="btn btn-xs btn-outline-primary rounded-circle p-1 d-flex align-items-center justify-content-center" style="width: 26px; height: 26px;" title="New Page (+)" aria-label="New Page">
                        <i class="bi bi-plus-lg"></i>
                    </button>
                    <button id="btnRenameDashboard" class="btn btn-xs btn-outline-secondary rounded-circle p-1 d-flex align-items-center justify-content-center" style="width: 26px; height: 26px;" title="Rename Active Tab" aria-label="Rename Tab">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button id="btnDeleteDashboard" class="btn btn-xs btn-outline-danger rounded-circle p-1 d-flex align-items-center justify-content-center" style="width: 26px; height: 26px;" title="Delete Active Tab" aria-label="Delete Tab">
                        <i class="bi bi-trash3"></i>
                    </button>
                </div>
            `;
            dashboardContent.parentNode.insertBefore(dashboardPanel, dashboardContent.nextSibling);
        }
    }

    // Function to render active multi-tabs across inline header and top quick dropdown
    function renderDashboardTabs(): void {
        const tabsContainer = document.getElementById('dashboardTabsList');
        const quickListContainer = document.getElementById('quickDashboardPagesList');
        const list = getDashboardsList();
        const activeId = getActiveDashboardId();

        // 1. Render inline header pills
        if (tabsContainer) {
            tabsContainer.innerHTML = '';

            list.forEach((dash: any, index: number) => {
                const isActive = dash.id === activeId;
                const chartCount = Array.isArray(dash.visualizations) ? dash.visualizations.length : 0;
                const tabBtn = document.createElement('button');
                tabBtn.type = 'button';
                tabBtn.className = `btn btn-sm d-flex align-items-center gap-1.5 px-2.5 py-1 rounded-pill transition-all text-nowrap ${
                    isActive 
                        ? 'btn-primary shadow-xs fw-semibold' 
                        : 'btn-light border text-secondary hover-bg-slate-100'
                }`;
                tabBtn.style.fontSize = '0.78rem';
                tabBtn.dataset.dashId = dash.id;

                const icon = index === 0 ? 'bi-grid-1x2-fill' : 'bi-columns-gap';

                tabBtn.innerHTML = `
                    <i class="bi ${icon} ${isActive ? 'text-white' : 'text-primary'}" style="font-size: 0.75rem;"></i>
                    <span class="tab-title text-truncate" style="max-width: 120px;">${escapeHtml(dash.name || `Tab ${index + 1}`)}</span>
                    <span class="badge ${isActive ? 'bg-white text-primary' : 'bg-secondary-subtle text-secondary'} rounded-pill" style="font-size: 0.65rem; padding: 2px 5px;">
                        ${chartCount}
                    </span>
                `;

                tabBtn.addEventListener('click', async () => {
                    if (dash.id !== getActiveDashboardId()) {
                        await switchDashboard(dash.id);
                    }
                });

                tabsContainer.appendChild(tabBtn);
            });
        }

        // 2. Render quick menu dropdown items
        if (quickListContainer) {
            quickListContainer.innerHTML = '';
            list.forEach((dash: any, index: number) => {
                const isActive = dash.id === activeId;
                const chartCount = Array.isArray(dash.visualizations) ? dash.visualizations.length : 0;
                const item = document.createElement('button');
                item.type = 'button';
                item.className = `dropdown-item d-flex align-items-center justify-content-between px-2 py-1.5 rounded-2 text-xs ${
                    isActive ? 'bg-primary text-white fw-bold' : 'text-dark'
                }`;
                item.innerHTML = `
                    <span class="d-flex align-items-center gap-2 text-truncate">
                        <i class="bi ${isActive ? 'bi-check2-circle' : 'bi-folder2'}"></i>
                        <span class="text-truncate">${escapeHtml(dash.name || `Tab ${index + 1}`)}</span>
                    </span>
                    <span class="badge ${isActive ? 'bg-white text-primary' : 'bg-light text-secondary'} rounded-pill ms-2 text-2xs">
                        ${chartCount} charts
                    </span>
                `;
                item.addEventListener('click', async () => {
                    if (dash.id !== getActiveDashboardId()) {
                        await switchDashboard(dash.id);
                    }
                });
                quickListContainer.appendChild(item);
            });
        }
    }

    // Escape helper
    function escapeHtml(str: string): string {
        return str.replace(/[&<>'"]/g, 
            tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
        );
    }

    // Bind event listeners
    const btnCreate = document.getElementById('btnCreateDashboard') as HTMLButtonElement | null;
    const btnRename = document.getElementById('btnRenameDashboard') as HTMLButtonElement | null;
    const btnDelete = document.getElementById('btnDeleteDashboard') as HTMLButtonElement | null;

    if (btnCreate) {
        btnCreate.addEventListener('click', async () => {
            const defaultName = `Tab ${getDashboardsList().length + 1}`;
            const name = await showCustomPrompt(
                "नया डैशबोर्ड टैब बनाएं (Create New Tab / Page)",
                "नए टैब का नाम दर्ज करें (उदा: Sales Performance, Customer Analytics, Forecast):",
                defaultName
            );
            if (name === null) return;
            const cleanName = name.trim();
            if (!cleanName) {
                showMessage("डैशबोर्ड का नाम खाली नहीं हो सकता!", "warning");
                return;
            }
            await createNewDashboard(cleanName);
        });
    }

    if (btnRename) {
        btnRename.addEventListener('click', async () => {
            const activeId = getActiveDashboardId();
            const currentDash = getDashboardsList().find(d => d.id === activeId);
            const currentName = currentDash?.name || 'Current Tab';

            const newName = await showCustomPrompt(
                "डैशबोर्ड टैब का नाम बदलें (Rename Tab)",
                "नया नाम दर्ज करें:",
                currentName
            );
            if (newName === null) return;
            const cleanName = newName.trim();
            if (!cleanName) {
                showMessage("डैशबोर्ड का नाम खाली नहीं हो सकता!", "warning");
                return;
            }
            await renameDashboard(activeId, cleanName);
            showMessage("डैशबोर्ड का नाम सफलतापूर्वक बदला गया!", "success");
        });
    }

    if (btnDelete) {
        btnDelete.addEventListener('click', async () => {
            const activeId = getActiveDashboardId();
            const currentDash = getDashboardsList().find(d => d.id === activeId);
            const currentName = currentDash?.name || 'Current Tab';
            
            if (getDashboardsList().length <= 1) {
                showMessage("कम से कम एक मुख्य डैशबोर्ड टैब होना अनिवार्य है!", "warning");
                return;
            }

            const confirmed = await showCustomConfirm(
                "डैशबोर्ड टैब हटाएं (Delete Tab)?",
                `क्या आप वाकई '${currentName}' टैब को हटाना चाहते हैं? इसके सभी चार्ट्स हटा दिए जाएंगे। (Are you sure you want to delete tab '${currentName}'?)`
            );
            if (confirmed) {
                await deleteDashboard(activeId);
                showMessage("डैशबोर्ड टैब सफलतापूर्वक हटा दिया गया!", "info");
            }
        });
    }

    const btnQuickAdd = document.getElementById('btnQuickAddDashboard');
    if (btnQuickAdd) {
        btnQuickAdd.addEventListener('click', () => {
            const btnCreate = document.getElementById('btnCreateDashboard') as HTMLButtonElement | null;
            if (btnCreate) btnCreate.click();
        });
    }

    // Listen to dashboardsUpdated event
    document.addEventListener('dashboardsUpdated', renderDashboardTabs);
    document.addEventListener('dashboardSwitched', renderDashboardTabs);

    // Initial render
    renderDashboardTabs();
}

/**
 * Helper to show modal/prompt for moving a specific chart to another dashboard tab
 */
export async function promptMoveChartToTab(chartId: string): Promise<void> {
    const list = getDashboardsList();
    const activeId = getActiveDashboardId();
    const otherTabs = list.filter(d => d.id !== activeId);

    if (otherTabs.length === 0) {
        const createNew = await showCustomConfirm(
            "नया टैब बनाएं (Create New Tab)?",
            "अभी केवल एक ही डैशबोर्ड टैब मौजूद है। क्या आप एक नया टैब बनाकर इस चार्ट को उसमें भेजना चाहते हैं?"
        );
        if (createNew) {
            const newName = await showCustomPrompt("नए टैब का नाम", "टैब का नाम दर्ज करें:", "New Analytics Tab");
            if (newName && newName.trim()) {
                await moveChartToDashboard(chartId, newName.trim());
            }
        }
        return;
    }

    // Modal select for target tab
    let modalEl = document.getElementById('moveChartModal');
    if (!modalEl) {
        modalEl = document.createElement('div');
        modalEl.id = 'moveChartModal';
        modalEl.className = 'modal fade';
        modalEl.innerHTML = `
            <div class="modal-dialog modal-dialog-centered modal-sm">
                <div class="modal-content rounded-4 border-0 shadow-lg">
                    <div class="modal-header border-bottom py-2.5 px-3">
                        <h6 class="modal-title fw-bold text-dark mb-0">
                            <i class="bi bi-box-arrow-up-right text-primary me-1.5"></i> Move Chart to Tab
                        </h6>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body p-3">
                        <label class="form-label text-muted small fw-semibold">Select Destination Tab:</label>
                        <select id="moveChartTargetSelect" class="form-select form-select-sm mb-3">
                        </select>
                        <button id="btnConfirmMoveChart" class="btn btn-primary btn-sm w-100 py-1.5 fw-semibold">
                            <i class="bi bi-check-circle me-1"></i> Move to Tab
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modalEl);
    }

    const select = document.getElementById('moveChartTargetSelect') as HTMLSelectElement;
    select.innerHTML = '';
    otherTabs.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t.id;
        opt.textContent = `${t.name} (${t.visualizations?.length || 0} charts)`;
        select.appendChild(opt);
    });

    const optNew = document.createElement('option');
    optNew.value = '__new__';
    optNew.textContent = '+ Create New Tab...';
    select.appendChild(optNew);

    const bsModal = new (window as any).bootstrap.Modal(modalEl);
    bsModal.show();

    const btnConfirm = document.getElementById('btnConfirmMoveChart') as HTMLButtonElement;
    // Replace event listener cleanly
    const newBtnConfirm = btnConfirm.cloneNode(true) as HTMLButtonElement;
    btnConfirm.parentNode?.replaceChild(newBtnConfirm, btnConfirm);

    newBtnConfirm.addEventListener('click', async () => {
        const targetVal = select.value;
        bsModal.hide();
        if (targetVal === '__new__') {
            const newName = await showCustomPrompt("नए टैब का नाम", "नया टैब नाम दर्ज करें:", "Secondary View");
            if (newName && newName.trim()) {
                await moveChartToDashboard(chartId, newName.trim());
            }
        } else {
            await moveChartToDashboard(chartId, targetVal);
        }
    });
}
