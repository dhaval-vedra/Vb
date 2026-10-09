// src/js/ui/editModeSummaryOverlay.ts
// Summary overlay module - Removed from UI as requested by user

/**
 * Ensures the summary overlay is completely removed from the DOM and stays hidden
 */
export function initEditModeSummaryOverlay(): void {
    const overlay = document.getElementById('dashboardEditModeSummaryOverlay');
    if (overlay) {
        overlay.remove();
    }
}

/**
 * No-op to preserve backwards compatibility with any callers
 */
export function updateEditModeSummaryOverlay(): void {
    const overlay = document.getElementById('dashboardEditModeSummaryOverlay');
    if (overlay) {
        overlay.remove();
    }
}

// Automatically remove if present on DOMContentLoaded
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            const overlay = document.getElementById('dashboardEditModeSummaryOverlay');
            if (overlay) overlay.remove();
        });
    } else {
        const overlay = document.getElementById('dashboardEditModeSummaryOverlay');
        if (overlay) overlay.remove();
    }
}
