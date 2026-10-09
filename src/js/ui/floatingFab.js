// src/js/ui/floatingFab.js
import { t, onLanguageChange } from '../i18n/index.ts';

export function initializeFloatingFab() {
    // 1. Inject Styles
    if (!document.getElementById('floatingFabStyles')) {
        const style = document.createElement('style');
        style.id = 'floatingFabStyles';
        style.innerHTML = `
            #floatingQuickMenu {
                position: fixed;
                bottom: 80px;
                right: 24px;
                z-index: 1060; /* Higher than bootstrap modals and overlays */
                user-select: none;
                display: flex;
                flex-direction: column;
                align-items: flex-end;
                font-family: inherit;
            }
            
            .fab-main-btn {
                width: 58px;
                height: 58px;
                border-radius: 50%;
                background: rgba(15, 23, 42, 0.82) !important;
                backdrop-filter: blur(16px);
                -webkit-backdrop-filter: blur(16px);
                border: 1px solid rgba(255, 255, 255, 0.22) !important;
                color: #ffffff !important;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 24px;
                cursor: grab;
                box-shadow: 0 12px 32px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255,255,255,0.08) inset;
                transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.2s, border-color 0.2s, color 0.2s;
            }
            
            .fab-main-btn:active {
                cursor: grabbing;
                transform: scale(0.92);
            }
            
            .fab-main-btn:hover {
                background-color: rgba(15, 23, 42, 0.95) !important;
                border-color: rgba(96, 165, 250, 0.7) !important;
                color: #60a5fa !important;
                transform: scale(1.06);
            }

            .fab-main-btn.active {
                background: rgba(30, 41, 59, 0.95) !important;
                border-color: rgba(239, 68, 68, 0.6) !important;
                color: #f87171 !important;
            }
            
            /* Transparent Glassmorphism Palette Card (Icon-Only Minimalist Grid) */
            .fab-palette-card {
                display: none;
                width: 256px;
                max-width: calc(100vw - 32px);
                background: rgba(15, 23, 42, 0.88);
                backdrop-filter: blur(20px);
                -webkit-backdrop-filter: blur(20px);
                border: 1px solid rgba(255, 255, 255, 0.16);
                border-radius: 18px;
                padding: 12px;
                margin-bottom: 12px;
                box-shadow: 0 24px 48px -12px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.1) inset;
                color: #f8fafc;
            }
            
            .fab-palette-card.show {
                display: block;
                animation: fabPaletteIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }

            .fab-palette-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding-bottom: 8px;
                margin-bottom: 10px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            }

            .fab-palette-title {
                font-size: 0.78rem;
                font-weight: 700;
                letter-spacing: 0.02em;
                color: #e2e8f0;
                display: flex;
                align-items: center;
                gap: 6px;
            }

            .fab-palette-badge {
                font-size: 0.65rem;
                padding: 2px 7px;
                border-radius: 9999px;
                background: rgba(59, 130, 246, 0.2);
                border: 1px solid rgba(96, 165, 250, 0.3);
                color: #93c5fd;
                font-weight: 600;
            }
            
            .fab-palette-grid {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 8px;
            }
            
            .fab-palette-item {
                background: rgba(255, 255, 255, 0.06);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 12px;
                width: 100%;
                aspect-ratio: 1 / 1;
                height: 48px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
                outline: none;
                position: relative;
            }
            
            .fab-palette-item:hover {
                background: rgba(59, 130, 246, 0.28);
                border-color: rgba(96, 165, 250, 0.6);
                transform: translateY(-2px) scale(1.05);
                box-shadow: 0 8px 18px rgba(0, 0, 0, 0.35);
            }

            .fab-palette-item:active {
                transform: scale(0.94);
            }
            
            .fab-palette-icon {
                font-size: 21px;
                line-height: 1;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: transform 0.18s ease;
            }

            .fab-palette-item:hover .fab-palette-icon {
                transform: scale(1.12);
            }
            
            .fab-palette-label {
                display: none !important;
            }

            .fab-palette-footer {
                margin-top: 10px;
                padding-top: 8px;
                border-top: 1px solid rgba(255, 255, 255, 0.08);
                display: flex;
                align-items: center;
                justify-content: space-between;
                font-size: 0.65rem;
                color: #94a3b8;
            }
            
            @keyframes fabPaletteIn {
                from {
                    opacity: 0;
                    transform: translateY(16px) scale(0.94);
                }
                to {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
            }
        `;
        document.head.appendChild(style);
    }

    // 2. Create and Append Container
    let menuContainer = document.getElementById('floatingQuickMenu');
    if (!menuContainer) {
        menuContainer = document.createElement('div');
        menuContainer.id = 'floatingQuickMenu';
        document.body.appendChild(menuContainer);
    }

    function renderFabContent() {
        if (!menuContainer) return;
        
        const isOptionsOpen = document.getElementById('fabOptions')?.classList.contains('show');
        
        menuContainer.innerHTML = `
            <!-- Transparent Quick Menu Palette -->
            <div class="fab-palette-card ${isOptionsOpen ? 'show' : ''}" id="fabOptions">
                <div class="fab-palette-header">
                    <span class="fab-palette-title">
                        <i class="bi bi-grid-3x3-gap-fill text-primary"></i> ${t('floatingFab.paletteTitle', 'Quick Palette')}
                    </span>
                    <span class="fab-palette-badge">${t('floatingFab.toolsBadge', '12 Tools')}</span>
                </div>

                <div class="fab-palette-grid">
                    <!-- 1. Data Upload -->
                    <div class="fab-palette-item" id="fabActionUpload" role="button" tabindex="0" title="${t('floatingFab.uploadData', 'Upload Data')}" aria-label="${t('floatingFab.uploadData', 'Upload Data')}">
                        <span class="fab-palette-icon text-blue-400"><i class="bi bi-cloud-arrow-up-fill"></i></span>
                    </div>

                    <!-- 2. Add Chart -->
                    <div class="fab-palette-item" id="fabActionAddChart" role="button" tabindex="0" title="${t('floatingFab.newChart', 'New Chart')}" aria-label="${t('floatingFab.newChart', 'New Chart')}">
                        <span class="fab-palette-icon text-emerald-400"><i class="bi bi-bar-chart-line-fill"></i></span>
                    </div>

                    <!-- 3. LTTB Sampling & Samples -->
                    <div class="fab-palette-item" id="fabActionLTTB" role="button" tabindex="0" title="${t('floatingFab.lttbSamples', 'LTTB Samples')}" aria-label="${t('floatingFab.lttbSamples', 'LTTB Samples')}">
                        <span class="fab-palette-icon text-cyan-400"><i class="bi bi-speedometer2"></i></span>
                    </div>

                    <!-- 4. Filter & Slicers -->
                    <div class="fab-palette-item" id="fabActionFilter" role="button" tabindex="0" title="${t('floatingFab.filterSort', 'Filter / Sort')}" aria-label="${t('floatingFab.filterSort', 'Filter / Sort')}">
                        <span class="fab-palette-icon text-violet-400"><i class="bi bi-funnel-fill"></i></span>
                    </div>

                    <!-- 5. AI Chat Assistant -->
                    <div class="fab-palette-item" id="fabActionChat" role="button" tabindex="0" title="${t('floatingFab.aiAssistant', 'AI Assistant')}" aria-label="${t('floatingFab.aiAssistant', 'AI Assistant')}">
                        <span class="fab-palette-icon text-pink-400"><i class="bi bi-robot"></i></span>
                    </div>

                    <!-- 7. Audio Narrator -->
                    <div class="fab-palette-item" id="fabActionAudio" role="button" tabindex="0" title="${t('floatingFab.audioBrief', 'Audio Brief')}" aria-label="${t('floatingFab.audioBrief', 'Audio Brief')}">
                        <span class="fab-palette-icon text-rose-400"><i class="bi bi-mic-fill"></i></span>
                    </div>

                    <!-- 8. Presentation Mode -->
                    <div class="fab-palette-item" id="fabActionPresent" role="button" tabindex="0" title="${t('floatingFab.presentation', 'Presentation')}" aria-label="${t('floatingFab.presentation', 'Presentation')}">
                        <span class="fab-palette-icon text-indigo-400"><i class="bi bi-play-btn-fill"></i></span>
                    </div>

                    <!-- 9. Auto Grid Layout -->
                    <div class="fab-palette-item" id="fabActionAutoGrid" role="button" tabindex="0" title="${t('floatingFab.autoGrid', 'Auto Grid')}" aria-label="${t('floatingFab.autoGrid', 'Auto Grid')}">
                        <span class="fab-palette-icon text-teal-400"><i class="bi bi-grid-fill"></i></span>
                    </div>

                    <!-- 10. Dashboard Lock Toggle -->
                    <div class="fab-palette-item" id="fabActionLock" role="button" tabindex="0" title="${t('floatingFab.lockDashboard', 'Lock Dashboard')}" aria-label="${t('floatingFab.lockDashboard', 'Lock Dashboard')}">
                        <span class="fab-palette-icon text-yellow-400"><i class="bi bi-lock-fill"></i></span>
                    </div>

                    <!-- 11. Export Report -->
                    <div class="fab-palette-item" id="fabActionExport" role="button" tabindex="0" title="${t('floatingFab.exportReport', 'Export Report')}" aria-label="${t('floatingFab.exportReport', 'Export Report')}">
                        <span class="fab-palette-icon text-orange-400"><i class="bi bi-file-earmark-arrow-down-fill"></i></span>
                    </div>

                    <!-- 12. Theme Toggle -->
                    <div class="fab-palette-item" id="fabActionTheme" role="button" tabindex="0" title="${t('floatingFab.changeTheme', 'Change Theme')}" aria-label="${t('floatingFab.changeTheme', 'Change Theme')}">
                        <span class="fab-palette-icon text-sky-400"><i class="bi bi-moon-stars-fill"></i></span>
                    </div>
                </div>

                <div class="fab-palette-footer">
                    <span><i class="bi bi-arrows-move me-1"></i>${t('floatingFab.dragHint', 'Drag bubble to reposition')}</span>
                    <span class="text-xs opacity-75">${t('floatingFab.escHint', 'ESC to close')}</span>
                </div>
            </div>
            
            <!-- Draggable Main Bubble -->
            <button class="fab-main-btn ${isOptionsOpen ? 'active' : ''}" id="fabMainBtn" title="${t('floatingFab.mainButtonTitle', 'Quick Menu Palette (Drag & Drop)')}">
                <i class="bi ${isOptionsOpen ? 'bi-x-lg' : 'bi-grid-fill'}"></i>
            </button>
        `;

        attachFabListeners();
    }

    function attachFabListeners() {
        const fabMainBtn = document.getElementById('fabMainBtn');
        const fabOptions = document.getElementById('fabOptions');
        if (!fabMainBtn || !fabOptions) return;

        // Shortcuts Actions
        document.getElementById('fabActionUpload')?.addEventListener('click', () => {
            document.getElementById('menuData')?.click();
            const fileInput = document.getElementById('fileInput');
            if (fileInput) fileInput.click();
            toggleMenu(false);
        });

        document.getElementById('fabActionAddChart')?.addEventListener('click', () => {
            document.getElementById('menuCharts')?.click();
            toggleMenu(false);
        });

        document.getElementById('fabActionLTTB')?.addEventListener('click', () => {
            const advBtn = document.getElementById('menuAdvancedSettings');
            if (advBtn) {
                advBtn.click();
            } else if (window.openOffcanvas) {
                window.openOffcanvas('advancedSettingsContent');
            }
            toggleMenu(false);
        });

        document.getElementById('fabActionFilter')?.addEventListener('click', () => {
            document.getElementById('menuFilterSort')?.click();
            toggleMenu(false);
        });

        document.getElementById('fabActionChat')?.addEventListener('click', () => {
            document.getElementById('openChatBtn')?.click() || document.getElementById('openChatbotBtn')?.click();
            toggleMenu(false);
        });

        document.getElementById('fabActionAudio')?.addEventListener('click', () => {
            const audioBtn = document.getElementById('audioNarratorToggleBtn') || document.getElementById('btnAudioNarrator');
            if (audioBtn) {
                audioBtn.click();
            } else if (window.toggleDashboardAudioNarrator) {
                window.toggleDashboardAudioNarrator();
            }
            toggleMenu(false);
        });

        document.getElementById('fabActionPresent')?.addEventListener('click', () => {
            const presentBtn = document.getElementById('btnPresentationMode') || document.getElementById('btnStartPresentation');
            if (presentBtn) {
                presentBtn.click();
            } else if (window.openDashboardPresentationMode) {
                window.openDashboardPresentationMode();
            }
            toggleMenu(false);
        });

        document.getElementById('fabActionAutoGrid')?.addEventListener('click', () => {
            const gridBtn = document.getElementById('btnAutoArrangeGrid');
            if (gridBtn) gridBtn.click();
            toggleMenu(false);
        });

        document.getElementById('fabActionLock')?.addEventListener('click', () => {
            const lockBtn = document.getElementById('toggleLockModeBtn');
            if (lockBtn) lockBtn.click();
            toggleMenu(false);
        });

        document.getElementById('fabActionExport')?.addEventListener('click', () => {
            const pdfBtn = document.getElementById('exportPDFBtn');
            if (pdfBtn) {
                pdfBtn.click();
            } else {
                const dropdown = document.getElementById('exportReportDropdown');
                if (dropdown) dropdown.click();
            }
            toggleMenu(false);
        });

        document.getElementById('fabActionTheme')?.addEventListener('click', () => {
            document.getElementById('toggleTheme')?.click();
            toggleMenu(false);
        });

        // Toggle options display
        function toggleMenu(forceState) {
            const opt = document.getElementById('fabOptions');
            const btn = document.getElementById('fabMainBtn');
            if (!opt || !btn) return;
            const isShow = forceState !== undefined ? forceState : !opt.classList.contains('show');
            if (isShow) {
                opt.classList.add('show');
                btn.classList.add('active');
                btn.innerHTML = '<i class="bi bi-x-lg"></i>';
            } else {
                opt.classList.remove('show');
                btn.classList.remove('active');
                btn.innerHTML = '<i class="bi bi-grid-fill"></i>';
            }
        }

        // Drag & Drop
        let isDragging = false;
        let startX = 0;
        let startY = 0;
        let initialLeft = 0;
        let initialTop = 0;
        let hasMoved = false;
        let lastTouchTime = 0;

        function onDragStart(clientX, clientY) {
            isDragging = true;
            hasMoved = false;
            
            const rect = menuContainer.getBoundingClientRect();
            startX = clientX;
            startY = clientY;
            initialLeft = rect.left;
            initialTop = rect.top;

            menuContainer.style.right = 'auto';
            menuContainer.style.bottom = 'auto';
            menuContainer.style.left = `${initialLeft}px`;
            menuContainer.style.top = `${initialTop}px`;
        }

        function onDragMove(clientX, clientY) {
            if (!isDragging) return;

            const deltaX = clientX - startX;
            const deltaY = clientY - startY;

            if (Math.abs(deltaX) > 8 || Math.abs(deltaY) > 8) {
                hasMoved = true;
            }

            let newLeft = initialLeft + deltaX;
            let newTop = initialTop + deltaY;

            const rect = menuContainer.getBoundingClientRect();
            const maxX = window.innerWidth - rect.width - 10;
            const maxY = window.innerHeight - rect.height - 10;

            newLeft = Math.max(10, Math.min(newLeft, maxX));
            newTop = Math.max(10, Math.min(newTop, maxY));

            menuContainer.style.left = `${newLeft}px`;
            menuContainer.style.top = `${newTop}px`;
        }

        function onDragEnd() {
            if (!isDragging) return;
            isDragging = false;

            if (hasMoved) {
                localStorage.setItem('fabPositionLeft', menuContainer.style.left);
                localStorage.setItem('fabPositionTop', menuContainer.style.top);
            }
        }

        fabMainBtn.addEventListener('mousedown', (e) => {
            if (Date.now() - lastTouchTime < 500) return;
            if (e.button !== 0) return;
            
            onDragStart(e.clientX, e.clientY);
            
            const onMouseMove = (moveEvent) => onDragMove(moveEvent.clientX, moveEvent.clientY);
            const onMouseUp = () => {
                onDragEnd();
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            };
            
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });

        fabMainBtn.addEventListener('touchstart', (e) => {
            lastTouchTime = Date.now();
            if (e.touches.length !== 1) return;
            const touch = e.touches[0];
            onDragStart(touch.clientX, touch.clientY);

            const onTouchMove = (moveEvent) => {
                if (moveEvent.touches.length !== 1) return;
                const t = moveEvent.touches[0];
                onDragMove(t.clientX, t.clientY);
            };

            const onTouchEnd = () => {
                onDragEnd();
                document.removeEventListener('touchmove', onTouchMove);
                document.removeEventListener('touchend', onTouchEnd);
            };

            document.addEventListener('touchmove', onTouchMove, { passive: true });
            document.addEventListener('touchend', onTouchEnd);
        });

        fabMainBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            if (hasMoved) {
                hasMoved = false;
                return;
            }
            
            toggleMenu();
        });
    }

    // Initial position restore
    const savedLeft = localStorage.getItem('fabPositionLeft');
    const savedTop = localStorage.getItem('fabPositionTop');
    if (savedLeft && savedTop) {
        menuContainer.style.right = 'auto';
        menuContainer.style.bottom = 'auto';
        menuContainer.style.left = savedLeft;
        menuContainer.style.top = savedTop;
    }

    renderFabContent();

    // Close FAB menu when clicking outside of it
    document.addEventListener('click', (e) => {
        const fabOptions = document.getElementById('fabOptions');
        const fabMainBtn = document.getElementById('fabMainBtn');
        if (fabOptions && fabOptions.classList.contains('show') && !menuContainer.contains(e.target)) {
            fabOptions.classList.remove('show');
            if (fabMainBtn) {
                fabMainBtn.classList.remove('active');
                fabMainBtn.innerHTML = '<i class="bi bi-grid-fill"></i>';
            }
        }
    });

    // Close FAB menu on Escape key
    document.addEventListener('keydown', (e) => {
        const fabOptions = document.getElementById('fabOptions');
        const fabMainBtn = document.getElementById('fabMainBtn');
        if (e.key === 'Escape' && fabOptions && fabOptions.classList.contains('show')) {
            fabOptions.classList.remove('show');
            if (fabMainBtn) {
                fabMainBtn.classList.remove('active');
                fabMainBtn.innerHTML = '<i class="bi bi-grid-fill"></i>';
            }
        }
    });

    // Language change reactivity
    onLanguageChange(() => {
        renderFabContent();
    });
}
