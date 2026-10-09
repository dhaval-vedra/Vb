/**
 * Full Dashboard Mode (Zen / Canvas Focus View)
 * In one click, hides the sidebar menu (.main-menu-bar), quick small menu bar (.small-menu-bar),
 * and data table (#dataTableSection), expanding the entire dashboard to 100% full screen area.
 */

import { showMessage } from '../core/utils.ts';
import { plotAll } from '../charts/charts.ts';

let isFullDashboardActive = false;

/**
 * Returns whether full dashboard mode is currently active
 */
export function isFullDashboardModeActive(): boolean {
    return isFullDashboardActive || document.body.classList.contains('full-dashboard-active');
}

/**
 * Updates icons and titles across all toggle buttons
 */
function updateToggleButtonsUI(active: boolean): void {
    const iconClass = active ? 'bi bi-arrows-angle-contract' : 'bi bi-arrows-fullscreen';
    const buttonTitle = active 
        ? 'Exit Full Dashboard View (Show Menus & Table) [Esc]' 
        : 'Full Dashboard View (Hide Menus & Table)';

    const btnSelectors = [
        '#btnToggleFullDashboard',
        '#menuToggleFullDashboard',
        '#btnToggleFullDashboardPanel',
        '#floatingExitFullDashboardBtn'
    ];

    btnSelectors.forEach(sel => {
        const btn = document.querySelector(sel) as HTMLElement | null;
        if (btn) {
            btn.title = buttonTitle;
            btn.setAttribute('aria-label', buttonTitle);
            const icon = btn.querySelector('i');
            if (icon && btn.id !== 'floatingExitFullDashboardBtn') {
                icon.className = iconClass;
            }
            if (active) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        }
    });
}

/**
 * Toggles Full Dashboard Mode
 */
export function toggleFullDashboardMode(forcedState?: boolean): boolean {
    const nextState = typeof forcedState === 'boolean' 
        ? forcedState 
        : !document.body.classList.contains('full-dashboard-active');

    isFullDashboardActive = nextState;

    if (nextState) {
        document.body.classList.add('full-dashboard-active');
        showMessage('फुल डैशबोर्ड मोड सक्रिय (मेनू और डेटा टेबल छिपे हुए हैं)', 'info');
    } else {
        document.body.classList.remove('full-dashboard-active');
        showMessage('सामान्य दृश्य बहाल (मेनू और डेटा टेबल वापस आ गए)', 'info');
    }

    updateToggleButtonsUI(nextState);

    // Trigger instant responsive reflow and Plotly redraw
    window.dispatchEvent(new Event('resize'));
    setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
        if (typeof plotAll === 'function') {
            plotAll();
        }
    }, 150);

    return nextState;
}

/**
 * Initializes listeners for Full Dashboard Mode
 */
export function initializeFullDashboardMode(): void {
    // 1. Wire up buttons
    const triggerButtons = [
        'btnToggleFullDashboard',
        'menuToggleFullDashboard',
        'btnToggleFullDashboardPanel',
        'floatingExitFullDashboardBtn'
    ];

    triggerButtons.forEach(btnId => {
        const el = document.getElementById(btnId);
        if (el) {
            el.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleFullDashboardMode();
            });
        }
    });

    // 2. Event delegation in case buttons are dynamically re-rendered
    document.addEventListener('click', (e: Event) => {
        const target = e.target as HTMLElement | null;
        if (!target) return;
        const btn = target.closest('#btnToggleFullDashboard, #menuToggleFullDashboard, #btnToggleFullDashboardPanel, #floatingExitFullDashboardBtn, [data-action="toggle-full-dashboard"]');
        if (btn) {
            e.preventDefault();
            e.stopPropagation();
            toggleFullDashboardMode();
        }
    });

    // 3. Escape key to exit full dashboard mode smoothly
    document.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Escape' && isFullDashboardModeActive()) {
            toggleFullDashboardMode(false);
        }
    });

    // Sync initial state
    updateToggleButtonsUI(isFullDashboardModeActive());
}

// Global hook
if (typeof window !== 'undefined') {
    (window as any).toggleFullDashboardMode = toggleFullDashboardMode;
    (window as any).isFullDashboardModeActive = isFullDashboardModeActive;
}
