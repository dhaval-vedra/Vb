// src/js/ai/presentationKioskEngine.ts
/**
 * Vedra BI - Executive Boardroom Presentation Engine
 * Full-screen, high-definition presentation mode presenting charts, KPIs,
 * and textboxes one by one with live AI summaries, auto-scroll flow,
 * and high-end CSS transition animations.
 */

import { visualizations, ChartConfig } from '../charts/charts.ts';
import { showMessage, escapeHtml } from '../core/utils.ts';
import {
    SlideAiSummary,
    generateSlideAiSummary,
    renderSlideAiSummaryHtml,
    speakSlideSummary,
    calculateSummaryReadTime,
    SummaryLayoutMode,
    SummaryThemeMode,
    SummaryDensityMode
} from './presentationAiSummaryEngine.ts';
import {
    initNarratorEngine,
    isNarratorEnabled,
    toggleNarrator,
    setNarratorEnabled,
    narrateSlide,
    stopNarrator,
    pauseNarrator,
    resumeNarrator,
    replayCurrentSlide,
    updateNarratorUIState,
    renderNarratorSettingsSectionHtml,
    attachNarratorSettingsListeners,
    getNarratorConfig,
    updateNarratorSettings,
    isSpeaking as isNarratorSpeakingNow,
    testVoice
} from './presentationNarratorEngine.ts';

declare const echarts: any;

export interface PresentationSlide {
    id: string;
    title: string;
    type: string;
    chartConfig?: ChartConfig | any;
    aiSummary: SlideAiSummary;
    customDuration?: number; // Optional per-slide custom duration in ms
}

export interface PresentationStartOptions {
    slideIndex?: number;
    slideQuery?: string;
    layout?: SummaryLayoutMode;
    theme?: SummaryThemeMode;
    density?: SummaryDensityMode;
    duration?: number; // in seconds
    speed?: number; // multiplier 0.5 to 2.5
    autoPlay?: boolean;
    voice?: boolean;
    narrator?: boolean;
}

export interface PresentationAgentCommand {
    action: string;
    slideIndex?: number;
    slideQuery?: string;
    duration?: number;
    durationDelta?: number;
    scope?: 'all' | 'current';
    speed?: number;
    layout?: SummaryLayoutMode;
    density?: SummaryDensityMode;
    theme?: SummaryThemeMode;
    state?: 'on' | 'off' | 'toggle' | boolean;
    open?: boolean;
    autoPlay?: boolean;
    voice?: boolean;
    narrator?: boolean;
    narratorVoice?: string;
    narratorPitch?: number;
}

// Global Presentation State
let isPresentationActive = false;
let currentSlideIndex = 0;
let slides: PresentationSlide[] = [];
let isAutoPlaying = false;
let autoPlayDuration = 8000; // ms default baseline
let summarySpeedMultiplier = 1.0; // 0.5x to 2.5x summary display speed
let durationScope: 'all' | 'current' = 'all'; // Target scope for duration adjustments
let isVoiceEnabled = false;
let isAutoAdvanceEnabled = true; // Auto-scroll/advance once AI summary finishes

// Auto-Flow Timers
let slideTimer: any = null;
let slideProgressInterval: any = null;
let autoScrollInterval: any = null;
let slideStartTime = 0;
let currentSlideDuration = 8000;
let isSlidePaused = false;
let remainingTimeOnPause = 0;

// Customization Preferences (Persisted in session/localStorage)
let layoutPreference: SummaryLayoutMode = 'side';
let themePreference: SummaryThemeMode = 'dark';
let densityPreference: SummaryDensityMode = 'detailed';

// Laser & Pen state
let isLaserActive = false;
let isPenActive = false;
let isDrawing = false;
let lastX = 0;
let lastY = 0;

/**
 * Builds slides strictly from existing dashboard visualizations.
 * No unsolicited filler slides.
 */
export function generatePresentationSlides(): PresentationSlide[] {
    const list: PresentationSlide[] = [];
    const total = visualizations.length;

    visualizations.forEach((v, idx) => {
        const slideIndex = idx + 1;
        const summary = generateSlideAiSummary(v, slideIndex, total);

        list.push({
            id: `slide-${v.id}`,
            title: v.title || summary.title,
            type: v.type,
            chartConfig: v,
            aiSummary: summary
        });
    });

    return list;
}

/**
 * Injects subtle high-end CSS transition styles.
 */
function ensureTransitionStyles(): void {
    if (document.getElementById('presentationKioskStyles')) return;

    const style = document.createElement('style');
    style.id = 'presentationKioskStyles';
    style.innerHTML = `
        /* High-End Presentation Animations & Transitions */
        @keyframes presStageFadeScale {
            0% {
                opacity: 0;
                transform: translateY(14px) scale(0.985);
                filter: blur(1.5px);
            }
            100% {
                opacity: 1;
                transform: translateY(0) scale(1);
                filter: blur(0);
            }
        }

        @keyframes presSummarySlideRight {
            0% {
                opacity: 0;
                transform: translateX(20px);
            }
            100% {
                opacity: 1;
                transform: translateX(0);
            }
        }

        @keyframes presSummarySlideUp {
            0% {
                opacity: 0;
                transform: translateY(20px);
            }
            100% {
                opacity: 1;
                transform: translateY(0);
            }
        }

        @keyframes presFadeUpStagger {
            0% {
                opacity: 0;
                transform: translateY(10px);
            }
            100% {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .pres-stage-anim {
            animation: presStageFadeScale 480ms cubic-bezier(0.16, 1, 0.3, 1) forwards !important;
            will-change: transform, opacity;
        }

        .pres-summary-panel.pres-summary-anim {
            animation: presSummarySlideRight 450ms cubic-bezier(0.16, 1, 0.3, 1) forwards !important;
            will-change: transform, opacity;
        }

        .pres-summary-bottom.pres-summary-anim,
        .pres-summary-minimal.pres-summary-anim {
            animation: presSummarySlideUp 420ms cubic-bezier(0.16, 1, 0.3, 1) forwards !important;
            will-change: transform, opacity;
        }

        .pres-headline-anim {
            animation: presFadeUpStagger 380ms cubic-bezier(0.16, 1, 0.3, 1) 40ms backwards;
        }

        .pres-chips-anim {
            animation: presFadeUpStagger 380ms cubic-bezier(0.16, 1, 0.3, 1) 100ms backwards;
        }

        .pres-insights-anim {
            animation: presFadeUpStagger 380ms cubic-bezier(0.16, 1, 0.3, 1) 160ms backwards;
        }

        .pres-action-anim {
            animation: presFadeUpStagger 400ms cubic-bezier(0.16, 1, 0.3, 1) 220ms backwards;
        }

        /* Reading Progress Bar Glow */
        .pres-summary-read-bar {
            box-shadow: 0 0 8px rgba(99, 102, 241, 0.6);
        }

        /* Subtle Hover Pause indicator on summary and visual */
        .pres-paused-indicator {
            opacity: 0;
            transition: opacity 0.2s ease;
        }
        .pres-is-paused .pres-paused-indicator {
            opacity: 1;
        }

        /* Narrator Equalizer Bars */
        .kiosk-equalizer-bars {
            display: inline-flex;
            align-items: flex-end;
            gap: 2px;
            height: 12px;
        }
        .kiosk-equalizer-bars span {
            width: 2px;
            background-color: #818cf8;
            border-radius: 1px;
            animation: kioskEquaBar 0.75s ease-in-out infinite alternate;
        }
        .kiosk-equalizer-bars span:nth-child(1) { height: 35%; animation-delay: 0.1s; }
        .kiosk-equalizer-bars span:nth-child(2) { height: 95%; animation-delay: 0.3s; }
        .kiosk-equalizer-bars span:nth-child(3) { height: 60%; animation-delay: 0.2s; }
        .kiosk-equalizer-bars span:nth-child(4) { height: 85%; animation-delay: 0.4s; }

        @keyframes kioskEquaBar {
            0% { height: 20%; }
            100% { height: 100%; }
        }

        /* Highlight currently spoken section in the AI Briefing panel */
        .pres-narrator-speaking-active {
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
            outline: 2px solid rgba(99, 102, 241, 0.8) !important;
            outline-offset: 2px !important;
            background: rgba(99, 102, 241, 0.14) !important;
            border-radius: 6px !important;
            box-shadow: 0 0 16px rgba(99, 102, 241, 0.35) !important;
        }

        /* Narrator button pulse animation while speaking */
        #kioskBtnVoice.narrator-speaking {
            border-color: #6366f1 !important;
            color: #ffffff !important;
            background: rgba(99, 102, 241, 0.28) !important;
            box-shadow: 0 0 12px rgba(99, 102, 241, 0.6) !important;
            animation: narratorBtnPulse 1.6s ease-in-out infinite !important;
        }
        @keyframes narratorBtnPulse {
            0% { transform: scale(1); box-shadow: 0 0 4px rgba(99, 102, 241, 0.4); }
            50% { transform: scale(1.08); box-shadow: 0 0 14px rgba(99, 102, 241, 0.7); }
            100% { transform: scale(1); box-shadow: 0 0 4px rgba(99, 102, 241, 0.4); }
        }
    `;
    document.head.appendChild(style);
}

function getSpeedLabel(speed: number): string {
    if (speed <= 0.8) return 'Relaxed';
    if (speed < 1.2) return 'Normal';
    if (speed < 1.4) return 'Brisk';
    if (speed < 1.8) return 'Fast';
    return 'Turbo';
}

/**
 * Launches the Presentation Mode.
 */
export function startPresentationMode(options?: PresentationStartOptions): void {
    slides = generatePresentationSlides();

    if (slides.length === 0) {
        showMessage('No charts or metrics available to present.', 'warning');
        return;
    }

    ensureTransitionStyles();

    // Read stored layout and configuration preferences
    try {
        const storedLayout = localStorage.getItem('vedra_pres_layout') as SummaryLayoutMode;
        if (storedLayout) layoutPreference = storedLayout;
        const storedTheme = localStorage.getItem('vedra_pres_theme') as SummaryThemeMode;
        if (storedTheme) themePreference = storedTheme;
        const storedDensity = localStorage.getItem('vedra_pres_density') as SummaryDensityMode;
        if (storedDensity) densityPreference = storedDensity;
        const storedAdvance = localStorage.getItem('vedra_pres_autoadvance');
        if (storedAdvance !== null) isAutoAdvanceEnabled = storedAdvance === 'true';
        const storedDuration = localStorage.getItem('vedra_pres_duration');
        if (storedDuration && !isNaN(Number(storedDuration))) autoPlayDuration = Number(storedDuration);
        const storedSpeed = localStorage.getItem('vedra_pres_summary_speed');
        if (storedSpeed && !isNaN(Number(storedSpeed))) summarySpeedMultiplier = Number(storedSpeed);
    } catch (_) {}

    if (options) {
        if (options.layout) {
            layoutPreference = options.layout;
            try { localStorage.setItem('vedra_pres_layout', layoutPreference); } catch (_) {}
        }
        if (options.theme) {
            themePreference = options.theme;
            try { localStorage.setItem('vedra_pres_theme', themePreference); } catch (_) {}
        }
        if (options.density) {
            densityPreference = options.density;
            try { localStorage.setItem('vedra_pres_density', densityPreference); } catch (_) {}
        }
        if (options.duration && !isNaN(options.duration)) {
            autoPlayDuration = Math.max(3, Math.min(60, Math.round(options.duration))) * 1000;
            try { localStorage.setItem('vedra_pres_duration', String(autoPlayDuration)); } catch (_) {}
        }
        if (options.speed && !isNaN(options.speed)) {
            summarySpeedMultiplier = Math.max(0.5, Math.min(2.5, Number(options.speed.toFixed(1))));
            try { localStorage.setItem('vedra_pres_summary_speed', String(summarySpeedMultiplier)); } catch (_) {}
        }
        if (options.voice !== undefined || options.narrator !== undefined) {
            isVoiceEnabled = options.voice ?? options.narrator ?? false;
            setNarratorEnabled(isVoiceEnabled);
        }
    }

    initNarratorEngine();

    currentSlideIndex = 0;
    if (options?.slideIndex !== undefined) {
        currentSlideIndex = Math.max(0, Math.min(slides.length - 1, options.slideIndex));
    } else if (options?.slideQuery) {
        const found = slides.findIndex(s => s.title.toLowerCase().includes(options.slideQuery!.toLowerCase()));
        if (found !== -1) currentSlideIndex = found;
    }

    isPresentationActive = true;
    isAutoPlaying = !!options?.autoPlay;
    isLaserActive = false;
    isPenActive = false;
    isSlidePaused = false;

    document.body.classList.add('presentation-kiosk-active');

    renderPresentationOverlay();
    window.addEventListener('keydown', handlePresentationKeyDown);
}

/**
 * Exits Presentation Mode.
 */
export function exitPresentationMode(): void {
    isPresentationActive = false;
    document.body.classList.remove('presentation-kiosk-active');
    stopSlideAutoFlow();
    stopNarrator();
    window.removeEventListener('keydown', handlePresentationKeyDown);

    disposeKioskStageChart();

    const overlay = document.getElementById('presentationKioskOverlay');
    if (overlay) overlay.remove();

    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
    }
}

function handlePresentationKeyDown(e: KeyboardEvent): void {
    if (!isPresentationActive) return;

    const target = e.target as HTMLElement;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;

    if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault();
        nextSlide();
    } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        prevSlide();
    } else if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        toggleAutoPlay();
    } else if (e.key.toLowerCase() === 'a') {
        cycleLayout();
    } else if (e.key.toLowerCase() === 't') {
        toggleTheme();
    } else if (e.key.toLowerCase() === 'n' || e.key.toLowerCase() === 'v') {
        toggleVoice();
    } else if (e.key.toLowerCase() === 'l') {
        toggleLaser();
    } else if (e.key.toLowerCase() === 'p') {
        togglePen();
    } else if (e.key.toLowerCase() === 'c') {
        clearAnnotations();
    } else if (e.key === 'Escape') {
        exitPresentationMode();
    }
}

export function goToSlide(index: number): void {
    if (index >= 0 && index < slides.length) {
        currentSlideIndex = index;
        updateSlideContent();
    }
}

export function goToSlideByQuery(query: string | number): boolean {
    if (typeof query === 'number') {
        goToSlide(query);
        return true;
    }
    const q = String(query).trim().toLowerCase();
    const numMatch = q.match(/(?:slide\s*|स्लाइड\s*)?(\d+)/i);
    if (numMatch) {
        const idx = parseInt(numMatch[1], 10) - 1;
        if (idx >= 0 && idx < slides.length) {
            goToSlide(idx);
            return true;
        }
    }
    const foundIdx = slides.findIndex(s =>
        s.title.toLowerCase().includes(q) ||
        s.type.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q)
    );
    if (foundIdx !== -1) {
        goToSlide(foundIdx);
        return true;
    }
    return false;
}

export function nextSlide(): void {
    if (currentSlideIndex < slides.length - 1) {
        currentSlideIndex++;
        updateSlideContent();
    } else if (isAutoPlaying || isAutoAdvanceEnabled) {
        currentSlideIndex = 0;
        updateSlideContent();
    }
}

export function prevSlide(): void {
    if (currentSlideIndex > 0) {
        currentSlideIndex--;
        updateSlideContent();
    }
}

export function toggleAutoPlay(forcePlay?: boolean): void {
    if (forcePlay !== undefined) {
        if (forcePlay) startAutoPlay();
        else stopAutoPlay();
    } else {
        if (isAutoPlaying) stopAutoPlay();
        else startAutoPlay();
    }
}

export function startAutoPlay(): void {
    isAutoPlaying = true;
    isAutoAdvanceEnabled = true;
    updatePlayButtonState();
    updateAutoAdvanceButtonState();
    startSlideAutoFlow();
    showMessage('Auto-Play: Resumed', 'info');
}

export function stopAutoPlay(): void {
    isAutoPlaying = false;
    updatePlayButtonState();
    stopSlideAutoFlow();
    showMessage('Auto-Play: Paused', 'info');
}

export function toggleAutoAdvance(forceState?: boolean): void {
    if (forceState !== undefined) {
        isAutoAdvanceEnabled = forceState;
    } else {
        isAutoAdvanceEnabled = !isAutoAdvanceEnabled;
    }
    try { localStorage.setItem('vedra_pres_autoadvance', String(isAutoAdvanceEnabled)); } catch (_) {}
    updateAutoAdvanceButtonState();
    if (isAutoAdvanceEnabled) {
        startSlideAutoFlow();
        showMessage('Auto-Advance after AI summary: Enabled', 'info');
    } else {
        stopSlideAutoFlow();
        showMessage('Auto-Advance: Paused', 'info');
    }
}

function updateAutoAdvanceButtonState(): void {
    const btn = document.getElementById('kioskBtnAutoAdvance');
    if (btn) {
        if (isAutoAdvanceEnabled) {
            btn.classList.add('active', 'btn-primary');
            btn.classList.remove('btn-outline-secondary');
            btn.innerHTML = '<i class="bi bi-clock-history"></i>';
            btn.setAttribute('title', 'Auto-Advance active (Click to disable)');
        } else {
            btn.classList.remove('active', 'btn-primary');
            btn.classList.add('btn-outline-secondary');
            btn.innerHTML = '<i class="bi bi-pause-circle"></i>';
            btn.setAttribute('title', 'Auto-Advance paused (Click to enable)');
        }
    }
}

function updatePlayButtonState(): void {
    const playBtn = document.getElementById('kioskBtnPlay');
    if (playBtn) {
        playBtn.innerHTML = isAutoPlaying
            ? '<i class="bi bi-pause-fill"></i>'
            : '<i class="bi bi-play-fill"></i>';
        playBtn.setAttribute('title', isAutoPlaying ? 'Pause (Space)' : 'Auto-Play (Space)');
        if (isAutoPlaying) {
            playBtn.classList.add('btn-primary');
            playBtn.classList.remove('btn-outline-secondary');
        } else {
            playBtn.classList.remove('btn-primary');
            playBtn.classList.add('btn-outline-secondary');
        }
    }
}

function stopSlideAutoFlow(): void {
    if (slideTimer) {
        clearTimeout(slideTimer);
        slideTimer = null;
    }
    if (slideProgressInterval) {
        clearInterval(slideProgressInterval);
        slideProgressInterval = null;
    }
    if (autoScrollInterval) {
        clearInterval(autoScrollInterval);
        autoScrollInterval = null;
    }
    stopNarrator();
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
    }
}

/**
 * Starts auto-reading, auto-scroll of summary content, and auto-advance.
 */
function startSlideAutoFlow(): void {
    stopSlideAutoFlow();

    const slide = slides[currentSlideIndex];
    if (!slide) return;

    // Use per-slide custom duration if set, otherwise autoPlayDuration
    const baseDuration = slide.customDuration || autoPlayDuration;
    // Calculate natural reading duration based on summary word count and summary display speed
    const readDuration = calculateSummaryReadTime(slide.aiSummary, summarySpeedMultiplier);
    currentSlideDuration = Math.max(baseDuration, readDuration);
    slideStartTime = Date.now();
    isSlidePaused = false;

    // 1. Narrator Mode: Read the AI executive briefing aloud with sequential section highlighting
    if (isNarratorEnabled()) {
        narrateSlide(slide.aiSummary, () => {
            // Finished voice narration: auto-advance to next slide if enabled
            const cfg = getNarratorConfig();
            if (cfg.autoAdvanceOnEnd && (isAutoAdvanceEnabled || isAutoPlaying)) {
                slideTimer = setTimeout(() => {
                    if (isPresentationActive && !isSlidePaused) {
                        nextSlide();
                    }
                }, Math.round(700 / summarySpeedMultiplier));
            }
        }, summarySpeedMultiplier);
    }

    if (!isAutoAdvanceEnabled && !isAutoPlaying) return;

    // 2. Auto-scroll overflow content inside the AI summary panel scaled by summary display speed
    const briefingPanel = document.getElementById('kioskBriefingPanel');
    const bottomShelf = document.getElementById('kioskBottomShelf');
    const activeContainer = layoutPreference === 'side' ? briefingPanel : bottomShelf;
    const scrollEl = activeContainer?.querySelector('.pres-summary-scroll') as HTMLElement;

    if (scrollEl) {
        scrollEl.scrollTop = 0;
        const maxScroll = scrollEl.scrollHeight - scrollEl.clientHeight;
        if (maxScroll > 15) {
            // Gracefully auto-scroll after an initial reading pause scaled by summary speed
            const initialPause = Math.max(800, Math.round(1800 / summarySpeedMultiplier));
            setTimeout(() => {
                if (!isPresentationActive || isSlidePaused) return;
                const scrollDuration = Math.max(1200, (currentSlideDuration - initialPause - 800) / summarySpeedMultiplier);
                const scrollStartTime = Date.now();

                autoScrollInterval = setInterval(() => {
                    if (isSlidePaused) return;
                    const elapsed = Date.now() - scrollStartTime;
                    const progress = Math.min(1, elapsed / scrollDuration);
                    // Smooth easeInOutQuad scroll curve
                    const eased = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
                    scrollEl.scrollTop = eased * maxScroll;

                    if (progress >= 1) {
                        clearInterval(autoScrollInterval);
                        autoScrollInterval = null;
                    }
                }, 30);
            }, initialPause);
        }
    }

    // 3. Smooth progress bar updates
    slideProgressInterval = setInterval(() => {
        if (isSlidePaused) return;

        const elapsed = Date.now() - slideStartTime;
        const pct = Math.min(100, (elapsed / currentSlideDuration) * 100);

        const readBar = activeContainer?.querySelector('.pres-summary-read-bar') as HTMLElement;
        if (readBar) readBar.style.width = `${pct}%`;

        // Advance to next slide if narrator mode is NOT active and time has completed
        if (!isNarratorEnabled() && elapsed >= currentSlideDuration) {
            stopSlideAutoFlow();
            if (isAutoAdvanceEnabled || isAutoPlaying) {
                nextSlide();
            }
        }
    }, 40);
}

function pauseSlideAutoFlow(): void {
    if (isSlidePaused) return;
    isSlidePaused = true;
    remainingTimeOnPause = Math.max(0, currentSlideDuration - (Date.now() - slideStartTime));
    const overlay = document.getElementById('presentationKioskOverlay');
    if (overlay) overlay.classList.add('pres-is-paused');
    pauseNarrator();
}

function resumeSlideAutoFlow(): void {
    if (!isSlidePaused) return;
    isSlidePaused = false;
    slideStartTime = Date.now() - (currentSlideDuration - remainingTimeOnPause);
    const overlay = document.getElementById('presentationKioskOverlay');
    if (overlay) overlay.classList.remove('pres-is-paused');
    resumeNarrator();
}

function disposeKioskStageChart(): void {
    const stageEl = document.getElementById('kioskStageVisual') as any;
    if (stageEl && stageEl._activeKioskChart) {
        try {
            stageEl._activeKioskChart.dispose();
        } catch (e) {
            console.error('Error disposing kiosk chart:', e);
        }
        stageEl._activeKioskChart = null;
    }
}

function cleanCloneForPresentation(clone: HTMLElement): void {
    const toRemove = clone.querySelectorAll(
        '.chart-buttons, .moveable-control-box, .chart-delete-btn, .chart-settings-btn, .drag-handle, .freeze-chart, .chart-options-menu'
    );
    toRemove.forEach(el => el.remove());

    clone.style.position = 'static';
    clone.style.width = '100%';
    clone.style.height = 'auto';
    clone.style.maxWidth = '780px';
    clone.style.margin = 'auto';
    clone.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.3)';
    clone.style.borderRadius = '12px';
}

export function cycleLayout(): void {
    const sequence: SummaryLayoutMode[] = ['side', 'bottom', 'minimal', 'hidden'];
    const currentIdx = sequence.indexOf(layoutPreference);
    const nextIdx = (currentIdx + 1) % sequence.length;
    setLayoutPreference(sequence[nextIdx]);
}

export function setLayoutPreference(layout: SummaryLayoutMode): void {
    layoutPreference = layout;
    try { localStorage.setItem('vedra_pres_layout', layout); } catch (_) {}
    applyLayoutStructure();
    updateSlideContent();
    const layoutNames: Record<SummaryLayoutMode, string> = {
        side: 'Split Screen Briefing',
        bottom: 'Bottom Shelf Ticker',
        minimal: 'Floating Executive Badge',
        hidden: 'Visual Stage Only'
    };
    showMessage(`Presentation Layout: ${layoutNames[layout] || layout}`, 'info');
}

export function setDensityPreference(density: SummaryDensityMode): void {
    densityPreference = density;
    try { localStorage.setItem('vedra_pres_density', density); } catch (_) {}
    updateSettingsConfigurationUI();
    updateSlideContent();
    showMessage(`AI Summary Detail: ${density === 'detailed' ? 'Detailed Synthesis' : 'Executive Compact'}`, 'info');
}

export function toggleTheme(forceTheme?: SummaryThemeMode): void {
    if (forceTheme) {
        themePreference = forceTheme;
    } else {
        themePreference = themePreference === 'dark' ? 'light' : 'dark';
    }
    try { localStorage.setItem('vedra_pres_theme', themePreference); } catch (_) {}
    applyThemeStyles();
    updateSlideContent();
    showMessage(`Presentation Theme: ${themePreference === 'dark' ? 'Dark Boardroom' : 'Light Daylight'}`, 'info');
}

export function toggleLaser(forceState?: boolean): void {
    if (forceState !== undefined) {
        isLaserActive = forceState;
    } else {
        isLaserActive = !isLaserActive;
    }
    if (isLaserActive && isPenActive) togglePen(false);

    const laserBtn = document.getElementById('kioskBtnLaser');
    const laserDot = document.getElementById('kioskLaserDot');
    const stageCanvas = document.getElementById('kioskStageVisual');

    if (laserBtn) {
        if (isLaserActive) {
            laserBtn.classList.add('active', 'btn-danger');
            laserBtn.classList.remove('btn-outline-secondary');
        } else {
            laserBtn.classList.remove('active', 'btn-danger');
            laserBtn.classList.add('btn-outline-secondary');
        }
    }

    if (laserDot) laserDot.style.display = isLaserActive ? 'block' : 'none';
    if (stageCanvas) stageCanvas.style.cursor = isLaserActive ? 'none' : 'default';
    showMessage(`Laser Pointer: ${isLaserActive ? 'Active' : 'Deactivated'}`, 'info');
}

export function togglePen(forceState?: boolean): void {
    if (forceState !== undefined) {
        isPenActive = forceState;
    } else {
        isPenActive = !isPenActive;
    }
    if (isPenActive && isLaserActive) toggleLaser(false);

    const penBtn = document.getElementById('kioskBtnPen');
    const drawCanvas = document.getElementById('kioskDrawCanvas') as HTMLCanvasElement;

    if (penBtn) {
        if (isPenActive) {
            penBtn.classList.add('active', 'btn-warning');
            penBtn.classList.remove('btn-outline-secondary');
        } else {
            penBtn.classList.remove('active', 'btn-warning');
            penBtn.classList.add('btn-outline-secondary');
        }
    }

    if (drawCanvas) {
        drawCanvas.style.pointerEvents = isPenActive ? 'auto' : 'none';
        drawCanvas.style.cursor = isPenActive ? 'crosshair' : 'default';
    }
    showMessage(`Annotation Pen: ${isPenActive ? 'Active' : 'Deactivated'}`, 'info');
}

export function clearAnnotations(): void {
    const drawCanvas = document.getElementById('kioskDrawCanvas') as HTMLCanvasElement;
    if (drawCanvas) {
        const ctx = drawCanvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
        showMessage('Drawing Annotations Cleared', 'info');
    }
}

export function toggleVoice(forceState?: boolean): void {
    const isEnabled = toggleNarrator(forceState);
    isVoiceEnabled = isEnabled;
    updateNarratorUIState();
    if (isEnabled) {
        startSlideAutoFlow();
        showMessage('Presentation Narrator Mode: Active', 'info');
    } else {
        stopNarrator();
        showMessage('Presentation Narrator Mode: Disabled', 'info');
    }
}

export function toggleSettingsModal(open?: boolean): void {
    const settingsModal = document.getElementById('kioskSettingsModal');
    if (!settingsModal) return;
    const shouldOpen = open !== undefined ? open : (settingsModal.style.display === 'none' || !settingsModal.style.display);
    settingsModal.style.display = shouldOpen ? 'block' : 'none';
    if (shouldOpen) {
        updateSettingsConfigurationUI();
        showMessage('Presentation Configuration Panel: Opened', 'info');
    } else {
        showMessage('Presentation Configuration Panel: Closed', 'info');
    }
}

export function toggleFullscreen(forceState?: boolean): void {
    const isFs = !!document.fullscreenElement;
    if (forceState === true || (forceState === undefined && !isFs)) {
        document.documentElement.requestFullscreen().catch(() => {});
        showMessage('Fullscreen Mode: Enabled', 'info');
    } else if (forceState === false || (forceState === undefined && isFs)) {
        document.exitFullscreen().catch(() => {});
        showMessage('Fullscreen Mode: Exited', 'info');
    }
}

function setupDrawingCanvas(): void {
    const drawCanvas = document.getElementById('kioskDrawCanvas') as HTMLCanvasElement;
    if (!drawCanvas) return;

    const resize = () => {
        drawCanvas.width = drawCanvas.offsetWidth;
        drawCanvas.height = drawCanvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const ctx = drawCanvas.getContext('2d');
    if (!ctx) return;

    drawCanvas.addEventListener('mousedown', (e) => {
        if (!isPenActive) return;
        isDrawing = true;
        const rect = drawCanvas.getBoundingClientRect();
        lastX = e.clientX - rect.left;
        lastY = e.clientY - rect.top;
    });

    drawCanvas.addEventListener('mousemove', (e) => {
        if (!isPenActive || !isDrawing) return;
        const rect = drawCanvas.getBoundingClientRect();
        const currentX = e.clientX - rect.left;
        const currentY = e.clientY - rect.top;

        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(currentX, currentY);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();

        lastX = currentX;
        lastY = currentY;
    });

    const stopDrawing = () => { isDrawing = false; };
    drawCanvas.addEventListener('mouseup', stopDrawing);
    drawCanvas.addEventListener('mouseleave', stopDrawing);
}

/**
 * Applies layout class adjustments to the presentation DOM.
 */
function applyLayoutStructure(): void {
    const mainWrapper = document.getElementById('kioskMainContainer');
    const briefingPanel = document.getElementById('kioskBriefingPanel');
    const bottomShelf = document.getElementById('kioskBottomShelf');

    if (!mainWrapper || !briefingPanel || !bottomShelf) return;

    if (layoutPreference === 'side') {
        mainWrapper.className = 'flex-grow-1 d-flex flex-row p-3 gap-3 overflow-hidden position-relative';
        briefingPanel.style.display = 'flex';
        briefingPanel.style.width = '380px';
        briefingPanel.style.minWidth = '340px';
        briefingPanel.style.maxWidth = '420px';
        bottomShelf.style.display = 'none';
    } else if (layoutPreference === 'bottom') {
        mainWrapper.className = 'flex-grow-1 d-flex flex-column p-3 gap-2 overflow-hidden position-relative';
        briefingPanel.style.display = 'none';
        bottomShelf.style.display = 'block';
    } else if (layoutPreference === 'minimal') {
        mainWrapper.className = 'flex-grow-1 d-flex flex-column p-3 gap-2 overflow-hidden position-relative';
        briefingPanel.style.display = 'none';
        bottomShelf.style.display = 'block';
    } else { // hidden
        mainWrapper.className = 'flex-grow-1 d-flex flex-column p-3 overflow-hidden position-relative';
        briefingPanel.style.display = 'none';
        bottomShelf.style.display = 'none';
    }
}

/**
 * Applies theme styling classes (Dark vs Light).
 */
function applyThemeStyles(): void {
    const overlay = document.getElementById('presentationKioskOverlay');
    if (!overlay) return;

    const isLight = themePreference === 'light';
    overlay.style.backgroundColor = isLight ? '#f8fafc' : '#0b0f19';
    overlay.style.color = isLight ? '#0f172a' : '#f8fafc';

    const header = overlay.querySelector('.kiosk-header') as HTMLElement;
    if (header) {
        header.style.backgroundColor = isLight ? '#ffffff' : '#0f172a';
        header.style.borderColor = isLight ? '#e2e8f0' : '#1e293b';
    }

    const footer = overlay.querySelector('.kiosk-footer') as HTMLElement;
    if (footer) {
        footer.style.backgroundColor = isLight ? '#ffffff' : '#0f172a';
        footer.style.borderColor = isLight ? '#e2e8f0' : '#1e293b';
    }

    const stageBox = document.getElementById('kioskStageBox');
    if (stageBox) {
        stageBox.style.backgroundColor = isLight ? '#ffffff' : '#0f172a';
        stageBox.style.borderColor = isLight ? '#e2e8f0' : '#1e293b';
    }

    const themeBtn = document.getElementById('kioskBtnTheme');
    if (themeBtn) {
        themeBtn.innerHTML = isLight ? '<i class="bi bi-moon"></i>' : '<i class="bi bi-sun"></i>';
        themeBtn.setAttribute('title', isLight ? 'Dark Theme (T)' : 'Light Theme (T)');
    }
}

/**
 * Renders the top-level presentation DOM overlay.
 */
function renderPresentationOverlay(): void {
    let overlay = document.getElementById('presentationKioskOverlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'presentationKioskOverlay';
        overlay.className = 'presentation-kiosk-overlay position-fixed top-0 start-0 w-100 h-100 z-index-100000 d-flex flex-column';
        overlay.style.zIndex = '105000';
        overlay.style.fontFamily = 'var(--font-sans), system-ui, -apple-system, sans-serif';
        document.body.appendChild(overlay);
    }

    overlay.innerHTML = `
        <!-- Laser Pointer Dot -->
        <div id="kioskLaserDot" style="display: none; position: fixed; width: 12px; height: 12px; background: #ef4444; border-radius: 50%; pointer-events: none; z-index: 106000; box-shadow: 0 0 10px #ef4444, 0 0 20px #ef4444; transform: translate(-50%, -50%);"></div>

        <!-- Sleek Icon-Only Header Bar -->
        <div class="kiosk-header d-flex align-items-center justify-content-between px-3 py-2 border-bottom" style="border-color: #1e293b; background: #0f172a; transition: background 0.2s ease;">
            <!-- Left: Brand & Slide Indicator -->
            <div class="d-flex align-items-center gap-2">
                <span class="badge bg-indigo-600 text-white p-1.5 rounded"><i class="bi bi-projector"></i></span>
                <span id="kioskSlideBadge" class="badge rounded px-2 py-1 text-uppercase tracking-wider" style="background: rgba(99, 102, 241, 0.15); color: #818cf8; border: 1px solid rgba(99, 102, 241, 0.3); font-size: 11px;">
                    1 / ${slides.length}
                </span>
                <span id="kioskSlideTitle" class="fw-semibold text-truncate ms-1" style="max-width: 320px; font-size: 13.5px;">
                    Slide Title
                </span>
            </div>

            <!-- Right: Icon-Only Toolbar -->
            <div class="d-flex align-items-center gap-1.5">
                <!-- Auto-Advance Toggle -->
                <button id="kioskBtnAutoAdvance" class="btn btn-sm ${isAutoAdvanceEnabled ? 'btn-primary' : 'btn-outline-secondary'} p-1.5" title="Auto-Advance after AI summary finishes" aria-label="Auto Advance">
                    <i class="bi ${isAutoAdvanceEnabled ? 'bi-clock-history' : 'bi-pause-circle'}"></i>
                </button>

                <!-- Cycle Layout -->
                <button id="kioskBtnLayout" class="btn btn-sm btn-outline-secondary p-1.5" title="Toggle Layout (A)" aria-label="Toggle Layout">
                    <i class="bi bi-layout-split"></i>
                </button>

                <!-- Theme Toggle -->
                <button id="kioskBtnTheme" class="btn btn-sm btn-outline-secondary p-1.5" title="Toggle Theme (T)" aria-label="Toggle Theme">
                    <i class="bi bi-sun"></i>
                </button>

                <!-- Narrator Mode -->
                <button id="kioskBtnVoice" class="btn btn-sm btn-outline-secondary p-1.5" title="Narrator Mode (N)" aria-label="Narrator Mode">
                    <i class="bi bi-soundwave"></i>
                </button>

                <!-- Laser Pointer -->
                <button id="kioskBtnLaser" class="btn btn-sm btn-outline-secondary p-1.5" title="Laser Pointer (L)" aria-label="Laser Pointer">
                    <i class="bi bi-cursor-fill"></i>
                </button>

                <!-- Annotation Pen -->
                <button id="kioskBtnPen" class="btn btn-sm btn-outline-secondary p-1.5" title="Draw Pen (P)" aria-label="Draw Pen">
                    <i class="bi bi-pencil-fill"></i>
                </button>

                <!-- Clear Annotations -->
                <button id="kioskBtnClear" class="btn btn-sm btn-outline-secondary p-1.5" title="Clear Drawing (C)" aria-label="Clear Drawing">
                    <i class="bi bi-eraser"></i>
                </button>

                <!-- Customization Drawer Toggle -->
                <button id="kioskBtnSettings" class="btn btn-sm btn-outline-secondary p-1.5" title="Presentation Settings" aria-label="Presentation Settings">
                    <i class="bi bi-sliders"></i>
                </button>

                <!-- AI Copilot Assistant -->
                <button id="kioskBtnCopilot" class="btn btn-sm btn-outline-secondary p-1.5 text-indigo-400" title="AI Presentation Copilot" aria-label="AI Copilot">
                    <i class="bi bi-robot"></i>
                </button>

                <!-- Fullscreen -->
                <button id="kioskBtnFullscreen" class="btn btn-sm btn-outline-secondary p-1.5" title="Fullscreen" aria-label="Fullscreen">
                    <i class="bi bi-arrows-fullscreen"></i>
                </button>

                <!-- Exit -->
                <button id="kioskBtnExit" class="btn btn-sm btn-danger p-1.5 ms-2" title="Exit Presentation (Esc)" aria-label="Exit Presentation">
                    <i class="bi bi-x-lg"></i>
                </button>
            </div>
        </div>

        <!-- Slide Progress Line -->
        <div class="w-100" style="height: 2px; background: rgba(255, 255, 255, 0.08);">
            <div id="kioskProgressBar" class="h-100 bg-indigo-500 transition-all duration-300" style="width: 0%;"></div>
        </div>

        <!-- Main Body: Spotlight Visual Canvas + AI Briefing Panel -->
        <div id="kioskMainContainer" class="flex-grow-1 d-flex flex-row p-3 gap-3 overflow-hidden position-relative">
            <!-- Stage Box (Visual Centered) -->
            <div id="kioskStageBox" class="flex-grow-1 d-flex flex-column rounded-3 p-3 border overflow-hidden position-relative" style="background: #0f172a; border-color: #1e293b;">
                <!-- Drawing Canvas Overlay -->
                <canvas id="kioskDrawCanvas" class="position-absolute top-0 start-0 w-100 h-100" style="pointer-events: none; z-index: 20;"></canvas>

                <!-- Visual Content Area -->
                <div id="kioskStageVisual" class="w-100 flex-grow-1 d-flex align-items-center justify-content-center overflow-auto position-relative" style="z-index: 10;">
                    <!-- Cloned Visual or Re-rendered ECharts -->
                </div>
            </div>

            <!-- Side Briefing Panel -->
            <div id="kioskBriefingPanel" class="d-flex flex-column" style="width: 380px; min-width: 340px; max-width: 420px;">
                <!-- Dynamic AI Summary HTML injected here -->
            </div>
        </div>

        <!-- Bottom Shelf (Used when layout is 'bottom' or 'minimal') -->
        <div id="kioskBottomShelf" class="px-3 pb-2" style="display: none;">
            <!-- Dynamic AI Summary injected here for bottom layout -->
        </div>

        <!-- Bottom Controls Footer with Visual Slide Progress Indicator -->
        <div class="kiosk-footer d-flex align-items-center justify-content-between px-3 py-2 border-top position-relative" style="border-color: #1e293b; background: #0f172a; min-height: 56px;">
            <!-- Left Controls: Prev & Play/Pause -->
            <div class="d-flex align-items-center gap-2">
                <button id="kioskBtnPrev" class="btn btn-sm btn-outline-secondary p-1.5 rounded-circle" title="Previous Slide (←)" aria-label="Previous Slide">
                    <i class="bi bi-chevron-left"></i>
                </button>
                <button id="kioskBtnPlay" class="btn btn-sm btn-outline-secondary p-1.5 rounded-circle" title="Auto-Play / Pause (Space)" aria-label="Auto-Play">
                    <i class="bi bi-play-fill"></i>
                </button>
            </div>

            <!-- Center: Visual Slide Progress Indicator -->
            <div id="kioskVisualProgressContainer" class="d-flex flex-column align-items-center justify-content-center gap-1.5 px-3 py-1 rounded-3" style="background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(51, 65, 85, 0.4);">
                <div class="d-flex align-items-center gap-3">
                    <!-- Current Slide Index -->
                    <div class="d-flex align-items-center gap-1.5" style="font-size: 13px;" title="Current Slide Index">
                        <span class="text-slate-400 text-uppercase fw-semibold" style="font-size: 10px; letter-spacing: 0.05em;">Slide</span>
                        <span id="kioskBottomSlideIndex" class="fw-bold font-monospace text-indigo-400" style="font-size: 15px;">1</span>
                        <span class="text-slate-500 font-monospace">/</span>
                        <span id="kioskBottomSlideTotal" class="font-monospace text-slate-300" style="font-size: 13px;">${slides.length}</span>
                    </div>

                    <!-- Visual Progress Bar (Illuminated Track) -->
                    <div class="pres-visual-track position-relative" style="width: 140px; height: 7px; background: rgba(255, 255, 255, 0.12); border-radius: 999px; overflow: hidden;" title="Presentation Progress">
                        <div id="kioskBottomProgressBarFill" style="width: 20%; height: 100%; background: linear-gradient(90deg, #6366f1, #06b6d4); border-radius: 999px; transition: width 0.35s cubic-bezier(0.16, 1, 0.3, 1);"></div>
                    </div>

                    <!-- Remaining Slides Pill -->
                    <div id="kioskBottomRemainingPill" class="badge d-inline-flex align-items-center gap-1.5 px-2.5 py-1 rounded-pill" style="background: rgba(99, 102, 241, 0.14); border: 1px solid rgba(99, 102, 241, 0.32); color: #c7d2fe; font-size: 11px; font-weight: 500;" title="Slides Remaining">
                        <i class="bi bi-hourglass-split text-amber-400"></i>
                        <span id="kioskBottomRemainingLabel"><strong class="font-monospace" id="kioskBottomRemainingNum">0</strong> slides remaining</span>
                    </div>
                </div>

                <!-- Slide Navigation Dots (Jumpers) -->
                <div id="kioskDotsContainer" class="d-flex align-items-center gap-1.5">
                    <!-- Dynamic Slide Dots -->
                </div>
            </div>

            <!-- Right Controls: Active Slide Duration Badge & Next Button -->
            <div class="d-flex align-items-center gap-2">
                <span id="kioskCurrentSlideDurationBadge" class="badge bg-slate-800 text-slate-300 border border-slate-700 font-monospace d-none d-md-inline-block px-2.5 py-1.5" style="font-size: 11px; cursor: pointer;" title="Click to configure duration in settings">
                    8s / slide
                </span>
                <button id="kioskBtnNext" class="btn btn-sm btn-primary p-1.5 rounded-circle" title="Next Slide (→)" aria-label="Next Slide">
                    <i class="bi bi-chevron-right"></i>
                </button>
            </div>

            <!-- Edge progress line running across the bottom border -->
            <div class="position-absolute bottom-0 start-0 w-100" style="height: 3px; background: rgba(255, 255, 255, 0.06); z-index: 10;">
                <div id="kioskBottomEdgeProgressBar" class="h-100" style="width: 0%; background: linear-gradient(90deg, #6366f1, #a855f7, #06b6d4); transition: width 0.35s ease;"></div>
            </div>
        </div>

        <!-- Settings Popover Modal / Configuration Panel -->
        <div id="kioskSettingsModal" class="p-3.5 rounded-3 shadow-2xl position-absolute custom-scrollbar" style="display: none; top: 56px; right: 16px; width: 360px; max-width: calc(100vw - 32px); max-height: 84vh; overflow-y: auto; z-index: 107000; background: #0b1120; border: 1px solid #334155; color: #f8fafc; box-shadow: 0 20px 45px rgba(0,0,0,0.65);">
            <div class="d-flex align-items-center justify-content-between pb-2 mb-3 border-bottom border-slate-700">
                <span class="fw-bold" style="font-size: 13px;"><i class="bi bi-sliders2 me-1 text-indigo-400"></i> Presentation Configuration</span>
                <button id="kioskCloseSettingsBtn" class="btn btn-xs btn-link text-slate-400 p-0 hover:text-white"><i class="bi bi-x-lg"></i></button>
            </div>

            <!-- 1. Slide Display Duration Section -->
            <div class="mb-3.5 pb-3 border-bottom border-slate-800">
                <div class="d-flex align-items-center justify-content-between mb-1.5">
                    <label class="text-slate-300 text-uppercase fw-semibold m-0" style="font-size: 11px; letter-spacing: 0.05em;"><i class="bi bi-clock-history text-indigo-400 me-1"></i> Slide Display Duration</label>
                    <span id="kioskDurationDisplay" class="badge bg-indigo-600 font-monospace px-2 py-1" style="font-size: 11.5px;">8s</span>
                </div>

                <!-- Duration Slider -->
                <input type="range" id="kioskDurationSlider" min="3" max="60" step="1" value="8" class="form-range w-100 my-1" style="accent-color: #6366f1;">

                <!-- Stepper and Presets -->
                <div class="d-flex align-items-center justify-content-between gap-1 mb-2">
                    <button type="button" class="btn btn-xs btn-outline-secondary kiosk-duration-step-btn px-1.5" id="kioskDurationMinusBtn" title="Decrease 1s">-1s</button>
                    <div class="d-flex align-items-center gap-1 overflow-x-auto py-0.5 custom-scrollbar">
                        <button type="button" class="btn btn-xs btn-outline-secondary kiosk-duration-preset px-1.5" data-seconds="3">3s</button>
                        <button type="button" class="btn btn-xs btn-outline-secondary kiosk-duration-preset px-1.5" data-seconds="5">5s</button>
                        <button type="button" class="btn btn-xs btn-outline-secondary kiosk-duration-preset px-1.5" data-seconds="8">8s</button>
                        <button type="button" class="btn btn-xs btn-outline-secondary kiosk-duration-preset px-1.5" data-seconds="12">12s</button>
                        <button type="button" class="btn btn-xs btn-outline-secondary kiosk-duration-preset px-1.5" data-seconds="20">20s</button>
                        <button type="button" class="btn btn-xs btn-outline-secondary kiosk-duration-preset px-1.5" data-seconds="30">30s</button>
                    </div>
                    <button type="button" class="btn btn-xs btn-outline-secondary kiosk-duration-step-btn px-1.5" id="kioskDurationPlusBtn" title="Increase 1s">+1s</button>
                </div>

                <!-- Scope Option (All Slides vs Current Slide) -->
                <div class="p-2 rounded bg-slate-900/80 border border-slate-800">
                    <div class="d-flex align-items-center justify-content-between mb-1.5" style="font-size: 11px;">
                        <span class="text-slate-400">Duration Target:</span>
                        <span id="kioskCurrentSlideCustomTag" class="badge bg-slate-800 text-slate-400 border border-slate-700 font-monospace" style="font-size: 10px;">All Slides</span>
                    </div>
                    <div class="btn-group w-100" role="group">
                        <button type="button" class="btn btn-xs btn-primary kiosk-duration-scope-btn" id="kioskScopeAllBtn" data-scope="all">All Slides (Default)</button>
                        <button type="button" class="btn btn-xs btn-outline-secondary kiosk-duration-scope-btn" id="kioskScopeCurrentBtn" data-scope="current">Current Slide Only</button>
                    </div>
                    <div id="kioskResetSlideDurationContainer" class="mt-1.5 text-end" style="display: none;">
                        <button type="button" id="kioskResetSlideDurationBtn" class="btn btn-link text-indigo-400 p-0 text-decoration-none" style="font-size: 10.5px;">
                            <i class="bi bi-arrow-counterclockwise me-1"></i>Reset slide to default
                        </button>
                    </div>
                </div>
            </div>

            <!-- Narrator Mode Settings Section -->
            ${renderNarratorSettingsSectionHtml()}

            <!-- 2. Summary Display Speed Section -->
            <div class="mb-3.5 pb-3 border-bottom border-slate-800">
                <div class="d-flex align-items-center justify-content-between mb-1.5">
                    <label class="text-slate-300 text-uppercase fw-semibold m-0" style="font-size: 11px; letter-spacing: 0.05em;"><i class="bi bi-speedometer2 text-emerald-400 me-1"></i> Summary Display Speed</label>
                    <span id="kioskSpeedDisplay" class="badge bg-emerald-600 font-monospace px-2 py-1" style="font-size: 11.5px;">1.0x (Normal)</span>
                </div>

                <!-- Speed Slider -->
                <input type="range" id="kioskSpeedSlider" min="0.5" max="2.5" step="0.1" value="1.0" class="form-range w-100 my-1" style="accent-color: #10b981;">

                <!-- Speed Presets -->
                <div class="btn-group w-100 mb-1" role="group">
                    <button type="button" class="btn btn-xs btn-outline-secondary kiosk-speed-preset" data-speed="0.75" title="Relaxed pace">0.75x</button>
                    <button type="button" class="btn btn-xs btn-primary kiosk-speed-preset" data-speed="1.0" title="Standard pace">1.0x</button>
                    <button type="button" class="btn btn-xs btn-outline-secondary kiosk-speed-preset" data-speed="1.25" title="Brisk pace">1.25x</button>
                    <button type="button" class="btn btn-xs btn-outline-secondary kiosk-speed-preset" data-speed="1.5" title="Fast pace">1.5x</button>
                    <button type="button" class="btn btn-xs btn-outline-secondary kiosk-speed-preset" data-speed="2.0" title="Turbo pace">2.0x</button>
                </div>
                <div class="text-slate-400" style="font-size: 10px; line-height: 1.35;">
                    Regulates AI reading comprehension pace, auto-scroll velocity, and voice narration rate.
                </div>
            </div>

            <!-- 3. Layout & Density Modes -->
            <div class="mb-3 pb-3 border-bottom border-slate-800">
                <label class="d-block text-slate-400 mb-1.5 text-uppercase" style="font-size: 10.5px; font-weight: 600; letter-spacing: 0.05em;">AI Summary Layout</label>
                <div class="btn-group w-100 mb-2" role="group">
                    <button type="button" class="btn btn-xs btn-outline-secondary kiosk-layout-btn" data-layout="side" title="Side by Side">Split</button>
                    <button type="button" class="btn btn-xs btn-outline-secondary kiosk-layout-btn" data-layout="bottom" title="Bottom Shelf">Bottom</button>
                    <button type="button" class="btn btn-xs btn-outline-secondary kiosk-layout-btn" data-layout="minimal" title="Minimal Badge">Minimal</button>
                    <button type="button" class="btn btn-xs btn-outline-secondary kiosk-layout-btn" data-layout="hidden" title="Full Visual Only">Off</button>
                </div>

                <label class="d-block text-slate-400 mb-1.5 text-uppercase" style="font-size: 10.5px; font-weight: 600; letter-spacing: 0.05em;">Summary Detail</label>
                <div class="btn-group w-100" role="group">
                    <button type="button" class="btn btn-xs btn-outline-secondary kiosk-density-btn" data-density="compact">Executive (Brief)</button>
                    <button type="button" class="btn btn-xs btn-outline-secondary kiosk-density-btn" data-density="detailed">In-Depth</button>
                </div>
            </div>

            <!-- 4. Auto-Advance Switch -->
            <div class="mb-3 d-flex align-items-center justify-content-between p-2 rounded bg-slate-900/80 border border-slate-800">
                <div style="font-size: 11.5px;">
                    <span class="d-block fw-semibold text-white">Auto-Advance on AI Finish</span>
                    <span class="text-slate-400" style="font-size: 10px;">Seamlessly moves to next slide</span>
                </div>
                <div class="form-check form-switch m-0">
                    <input class="form-check-input" type="checkbox" id="kioskSettingsAutoAdvance" ${isAutoAdvanceEnabled ? 'checked' : ''} style="cursor: pointer;">
                </div>
            </div>

            <!-- 5. Quick Shortcuts Guide -->
            <div class="p-2 rounded bg-slate-900/60 border border-slate-800 text-slate-300" style="font-size: 11px; line-height: 1.5;">
                <div><kbd class="bg-slate-950 px-1 border border-slate-700">← / →</kbd> Next / Previous Slide</div>
                <div><kbd class="bg-slate-950 px-1 border border-slate-700">Space</kbd> Play / Pause</div>
                <div><kbd class="bg-slate-950 px-1 border border-slate-700">N / V</kbd> Narrator Mode &nbsp; <kbd class="bg-slate-950 px-1 border border-slate-700">A</kbd> Cycle Layout</div>
                <div><kbd class="bg-slate-950 px-1 border border-slate-700">T</kbd> Theme &nbsp; <kbd class="bg-slate-950 px-1 border border-slate-700">L</kbd> Laser &nbsp; <kbd class="bg-slate-950 px-1 border border-slate-700">P</kbd> Pen</div>
            </div>
        </div>
    `;

    // Track mouse for laser pointer
    document.addEventListener('mousemove', (e) => {
        if (!isLaserActive) return;
        const laserDot = document.getElementById('kioskLaserDot');
        if (laserDot) {
            laserDot.style.left = `${e.clientX}px`;
            laserDot.style.top = `${e.clientY}px`;
        }
    });

    // Hover pause / resume handling on visual stage and briefing panel
    const mainContainer = document.getElementById('kioskMainContainer');
    const bottomShelf = document.getElementById('kioskBottomShelf');

    [mainContainer, bottomShelf].forEach(el => {
        el?.addEventListener('mouseenter', () => pauseSlideAutoFlow());
        el?.addEventListener('mouseleave', () => resumeSlideAutoFlow());
    });

    // Attach Action Listeners
    document.getElementById('kioskBtnExit')?.addEventListener('click', () => exitPresentationMode());
    document.getElementById('kioskBtnPrev')?.addEventListener('click', () => prevSlide());
    document.getElementById('kioskBtnNext')?.addEventListener('click', () => nextSlide());
    document.getElementById('kioskBtnPlay')?.addEventListener('click', () => toggleAutoPlay());
    document.getElementById('kioskBtnAutoAdvance')?.addEventListener('click', () => toggleAutoAdvance());
    document.getElementById('kioskBtnLayout')?.addEventListener('click', () => cycleLayout());
    document.getElementById('kioskBtnTheme')?.addEventListener('click', () => toggleTheme());
    document.getElementById('kioskBtnLaser')?.addEventListener('click', () => toggleLaser());
    document.getElementById('kioskBtnPen')?.addEventListener('click', () => togglePen());
    document.getElementById('kioskBtnClear')?.addEventListener('click', () => clearAnnotations());

    document.getElementById('kioskBtnFullscreen')?.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
        } else {
            document.exitFullscreen().catch(() => {});
        }
    });

    document.getElementById('kioskBtnVoice')?.addEventListener('click', () => {
        toggleVoice();
    });

    // Settings Modal
    const settingsModal = document.getElementById('kioskSettingsModal');
    document.getElementById('kioskBtnSettings')?.addEventListener('click', () => {
        if (settingsModal) {
            settingsModal.style.display = settingsModal.style.display === 'none' ? 'block' : 'none';
            if (settingsModal.style.display === 'block') {
                updateSettingsConfigurationUI();
            }
        }
    });
    document.getElementById('kioskCloseSettingsBtn')?.addEventListener('click', () => {
        if (settingsModal) settingsModal.style.display = 'none';
    });

    // Copilot Assistant Toggle
    document.getElementById('kioskBtnCopilot')?.addEventListener('click', () => {
        const chatPopup = document.getElementById('chatPopup');
        if (chatPopup) {
            chatPopup.classList.toggle('show');
            if (chatPopup.classList.contains('show')) {
                const chatInput = document.getElementById('chatInput') as HTMLTextAreaElement;
                if (chatInput) chatInput.focus();
            }
        }
    });

    // Duration badge click in footer opens settings modal
    document.getElementById('kioskCurrentSlideDurationBadge')?.addEventListener('click', () => {
        if (settingsModal) {
            settingsModal.style.display = 'block';
            updateSettingsConfigurationUI();
            document.getElementById('kioskDurationSlider')?.focus();
        }
    });

    // Duration Slider input and change
    const durSlider = document.getElementById('kioskDurationSlider') as HTMLInputElement;
    const durDisplay = document.getElementById('kioskDurationDisplay');
    durSlider?.addEventListener('input', () => {
        if (durDisplay) durDisplay.textContent = `${durSlider.value}s`;
    });
    durSlider?.addEventListener('change', () => {
        const val = Number(durSlider.value);
        if (!isNaN(val)) setSlideDisplayDuration(val);
    });

    // Duration Steppers (-1s and +1s)
    document.getElementById('kioskDurationMinusBtn')?.addEventListener('click', () => {
        const currentSec = Number(durSlider?.value || 8);
        setSlideDisplayDuration(Math.max(3, currentSec - 1));
    });
    document.getElementById('kioskDurationPlusBtn')?.addEventListener('click', () => {
        const currentSec = Number(durSlider?.value || 8);
        setSlideDisplayDuration(Math.min(60, currentSec + 1));
    });

    // Duration Presets
    overlay.querySelectorAll('.kiosk-duration-preset').forEach(btn => {
        btn.addEventListener('click', () => {
            const sec = Number(btn.getAttribute('data-seconds'));
            if (!isNaN(sec)) setSlideDisplayDuration(sec);
        });
    });

    // Duration Scope Buttons (All vs Current Slide)
    document.getElementById('kioskScopeAllBtn')?.addEventListener('click', () => {
        durationScope = 'all';
        updateSettingsConfigurationUI();
    });
    document.getElementById('kioskScopeCurrentBtn')?.addEventListener('click', () => {
        durationScope = 'current';
        updateSettingsConfigurationUI();
    });

    // Reset slide duration button
    document.getElementById('kioskResetSlideDurationBtn')?.addEventListener('click', () => {
        const slide = slides[currentSlideIndex];
        if (slide && slide.customDuration) {
            delete slide.customDuration;
            showMessage(`Slide ${currentSlideIndex + 1} reset to default duration (${autoPlayDuration / 1000}s)`, 'info');
            updateSettingsConfigurationUI();
            updateSlideContent();
        }
    });

    // Summary Display Speed Slider input and change
    const speedSlider = document.getElementById('kioskSpeedSlider') as HTMLInputElement;
    const speedDisplay = document.getElementById('kioskSpeedDisplay');
    speedSlider?.addEventListener('input', () => {
        const spd = Number(speedSlider.value);
        if (speedDisplay) speedDisplay.textContent = `${spd.toFixed(1)}x (${getSpeedLabel(spd)})`;
    });
    speedSlider?.addEventListener('change', () => {
        const spd = Number(speedSlider.value);
        if (!isNaN(spd)) setSummaryDisplaySpeed(spd);
    });

    // Summary Speed Presets
    overlay.querySelectorAll('.kiosk-speed-preset').forEach(btn => {
        btn.addEventListener('click', () => {
            const spd = Number(btn.getAttribute('data-speed'));
            if (!isNaN(spd)) setSummaryDisplaySpeed(spd);
        });
    });

    // Auto Advance switch in settings
    document.getElementById('kioskSettingsAutoAdvance')?.addEventListener('change', (e) => {
        const checked = (e.target as HTMLInputElement).checked;
        isAutoAdvanceEnabled = checked;
        try { localStorage.setItem('vedra_pres_autoadvance', String(checked)); } catch (_) {}
        updateAutoAdvanceButtonState();
        if (checked) {
            startSlideAutoFlow();
        } else {
            stopSlideAutoFlow();
        }
    });

    // Layout buttons in settings
    overlay.querySelectorAll('.kiosk-layout-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const layout = btn.getAttribute('data-layout') as SummaryLayoutMode;
            if (layout) setLayoutPreference(layout);
        });
    });

    // Density buttons in settings
    overlay.querySelectorAll('.kiosk-density-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const density = btn.getAttribute('data-density') as SummaryDensityMode;
            if (density) {
                densityPreference = density;
                try { localStorage.setItem('vedra_pres_density', density); } catch (_) {}
                updateSlideContent();
            }
        });
    });

    // Attach Narrator settings listeners
    attachNarratorSettingsListeners(overlay, () => {
        updateNarratorUIState();
    });

    setupDrawingCanvas();
    applyThemeStyles();
    applyLayoutStructure();
    renderSlideDots();
    updateSlideContent();
}

/**
 * Updates the Duration & Speed controls in the Settings Modal.
 */
function updateSettingsConfigurationUI(): void {
    const slide = slides[currentSlideIndex];
    if (!slide) return;

    // 1. Duration UI
    const durSlider = document.getElementById('kioskDurationSlider') as HTMLInputElement;
    const durDisplay = document.getElementById('kioskDurationDisplay');
    const customTag = document.getElementById('kioskCurrentSlideCustomTag');
    const resetContainer = document.getElementById('kioskResetSlideDurationContainer');
    const scopeAllBtn = document.getElementById('kioskScopeAllBtn');
    const scopeCurrentBtn = document.getElementById('kioskScopeCurrentBtn');

    const effectiveDurationMs = durationScope === 'current'
        ? (slide.customDuration || autoPlayDuration)
        : autoPlayDuration;
    const effectiveSec = Math.round(effectiveDurationMs / 1000);

    if (durSlider) durSlider.value = String(effectiveSec);
    if (durDisplay) durDisplay.textContent = `${effectiveSec}s`;

    if (scopeAllBtn && scopeCurrentBtn) {
        if (durationScope === 'all') {
            scopeAllBtn.className = 'btn btn-xs btn-primary kiosk-duration-scope-btn';
            scopeCurrentBtn.className = 'btn btn-xs btn-outline-secondary kiosk-duration-scope-btn';
        } else {
            scopeAllBtn.className = 'btn btn-xs btn-outline-secondary kiosk-duration-scope-btn';
            scopeCurrentBtn.className = 'btn btn-xs btn-primary kiosk-duration-scope-btn';
        }
    }

    if (customTag) {
        if (durationScope === 'current') {
            customTag.textContent = slide.customDuration
                ? `Slide ${currentSlideIndex + 1} (Custom: ${slide.customDuration / 1000}s)`
                : `Slide ${currentSlideIndex + 1} (Default: ${autoPlayDuration / 1000}s)`;
            customTag.className = slide.customDuration
                ? 'badge bg-amber-500/20 text-amber-300 border border-amber-500/40 font-monospace'
                : 'badge bg-slate-800 text-slate-400 border border-slate-700 font-monospace';
        } else {
            customTag.textContent = 'All Slides';
            customTag.className = 'badge bg-slate-800 text-slate-400 border border-slate-700 font-monospace';
        }
    }

    if (resetContainer) {
        resetContainer.style.display = (durationScope === 'current' && slide.customDuration) ? 'block' : 'none';
    }

    // Highlight active duration preset
    document.querySelectorAll('.kiosk-duration-preset').forEach(btn => {
        const sec = Number(btn.getAttribute('data-seconds'));
        if (sec === effectiveSec) {
            btn.className = 'btn btn-xs btn-indigo text-white bg-indigo-600 kiosk-duration-preset px-1.5';
        } else {
            btn.className = 'btn btn-xs btn-outline-secondary kiosk-duration-preset px-1.5';
        }
    });

    // 2. Speed UI
    const speedSlider = document.getElementById('kioskSpeedSlider') as HTMLInputElement;
    const speedDisplay = document.getElementById('kioskSpeedDisplay');

    if (speedSlider) speedSlider.value = String(summarySpeedMultiplier);
    if (speedDisplay) {
        speedDisplay.textContent = `${summarySpeedMultiplier.toFixed(1)}x (${getSpeedLabel(summarySpeedMultiplier)})`;
    }

    // Highlight active speed preset
    document.querySelectorAll('.kiosk-speed-preset').forEach(btn => {
        const spd = Number(btn.getAttribute('data-speed'));
        if (Math.abs(spd - summarySpeedMultiplier) < 0.05) {
            btn.className = 'btn btn-xs btn-emerald text-white bg-emerald-600 kiosk-speed-preset';
        } else {
            btn.className = 'btn btn-xs btn-outline-secondary kiosk-speed-preset';
        }
    });

    // 3. Highlight layout and density buttons in settings
    document.querySelectorAll('.kiosk-layout-btn').forEach(btn => {
        if (btn.getAttribute('data-layout') === layoutPreference) {
            btn.className = 'btn btn-xs btn-primary kiosk-layout-btn';
        } else {
            btn.className = 'btn btn-xs btn-outline-secondary kiosk-layout-btn';
        }
    });

    document.querySelectorAll('.kiosk-density-btn').forEach(btn => {
        if (btn.getAttribute('data-density') === densityPreference) {
            btn.className = 'btn btn-xs btn-primary kiosk-density-btn';
        } else {
            btn.className = 'btn btn-xs btn-outline-secondary kiosk-density-btn';
        }
    });

    // 4. Narrator UI state in settings
    const nCfg = getNarratorConfig();
    const narratorToggle = document.getElementById('kioskNarratorToggle') as HTMLInputElement;
    if (narratorToggle) narratorToggle.checked = nCfg.enabled;
    const narratorVoiceSelect = document.getElementById('kioskNarratorVoiceSelect') as HTMLSelectElement;
    if (narratorVoiceSelect && nCfg.voiceURI) narratorVoiceSelect.value = nCfg.voiceURI;
    const narratorPitch = document.getElementById('kioskNarratorPitchSlider') as HTMLInputElement;
    if (narratorPitch) narratorPitch.value = String(nCfg.pitch);
    const pitchDisplay = document.getElementById('kioskNarratorPitchDisplay');
    if (pitchDisplay) pitchDisplay.textContent = `${nCfg.pitch.toFixed(1)}x`;
    const narratorHighlight = document.getElementById('kioskNarratorHighlight') as HTMLInputElement;
    if (narratorHighlight) narratorHighlight.checked = nCfg.highlightSection;
    const narratorAutoAdvance = document.getElementById('kioskNarratorAutoAdvance') as HTMLInputElement;
    if (narratorAutoAdvance) narratorAutoAdvance.checked = nCfg.autoAdvanceOnEnd;

    // 5. Footer duration badge
    const durBadge = document.getElementById('kioskCurrentSlideDurationBadge');
    if (durBadge) {
        if (slide.customDuration) {
            durBadge.innerHTML = `<i class="bi bi-pin-angle-fill text-amber-400 me-1"></i>${slide.customDuration / 1000}s (custom)`;
            durBadge.classList.add('border-amber-500/40', 'text-amber-300');
        } else {
            durBadge.innerHTML = `<i class="bi bi-clock me-1 text-slate-400"></i>${autoPlayDuration / 1000}s / slide`;
            durBadge.classList.remove('border-amber-500/40', 'text-amber-300');
        }
    }
}

/**
 * Sets slide display duration for either current slide or all slides.
 */
export function setSlideDisplayDuration(seconds: number, scope: 'all' | 'current' = durationScope): void {
    const slide = slides[currentSlideIndex];
    if (!slide) return;

    const clampedSec = Math.max(3, Math.min(60, Math.round(seconds)));
    durationScope = scope;

    if (durationScope === 'current') {
        slide.customDuration = clampedSec * 1000;
        showMessage(`Slide ${currentSlideIndex + 1} duration set to ${clampedSec}s`, 'info');
    } else {
        autoPlayDuration = clampedSec * 1000;
        try { localStorage.setItem('vedra_pres_duration', String(autoPlayDuration)); } catch (_) {}
        showMessage(`All slides base duration set to ${clampedSec}s`, 'info');
    }

    updateSettingsConfigurationUI();

    // If auto flow is active, recalculate duration seamlessly
    if (isAutoAdvanceEnabled || isAutoPlaying) {
        const baseDuration = slide.customDuration || autoPlayDuration;
        const readDuration = calculateSummaryReadTime(slide.aiSummary, summarySpeedMultiplier);
        currentSlideDuration = Math.max(baseDuration, readDuration);
        remainingTimeOnPause = Math.max(0, currentSlideDuration - (Date.now() - slideStartTime));
    }
}

/**
 * Adjusts slide duration by delta seconds.
 */
export function adjustSlideDuration(secondsDelta: number, scope: 'all' | 'current' = durationScope): void {
    const slide = slides[currentSlideIndex];
    if (!slide) return;
    const currentBase = scope === 'current'
        ? (slide.customDuration ? slide.customDuration / 1000 : autoPlayDuration / 1000)
        : (autoPlayDuration / 1000);
    const newSec = Math.max(3, Math.min(60, Math.round(currentBase + secondsDelta)));
    setSlideDisplayDuration(newSec, scope);
}

/**
 * Resets current slide custom duration back to global base duration.
 */
export function resetCurrentSlideDuration(): void {
    const slide = slides[currentSlideIndex];
    if (!slide) return;
    delete slide.customDuration;
    updateSettingsConfigurationUI();
    if (isAutoAdvanceEnabled || isAutoPlaying) {
        const readDuration = calculateSummaryReadTime(slide.aiSummary, summarySpeedMultiplier);
        currentSlideDuration = Math.max(autoPlayDuration, readDuration);
        remainingTimeOnPause = Math.max(0, currentSlideDuration - (Date.now() - slideStartTime));
    }
    showMessage(`Slide ${currentSlideIndex + 1} custom duration reset to base (${autoPlayDuration / 1000}s)`, 'info');
}

/**
 * Sets summary display speed multiplier and updates active playback.
 */
export function setSummaryDisplaySpeed(speed: number): void {
    summarySpeedMultiplier = Math.max(0.5, Math.min(2.5, Number(speed.toFixed(1))));
    try { localStorage.setItem('vedra_pres_summary_speed', String(summarySpeedMultiplier)); } catch (_) {}

    updateSettingsConfigurationUI();
    showMessage(`Summary display speed set to ${summarySpeedMultiplier.toFixed(1)}x (${getSpeedLabel(summarySpeedMultiplier)})`, 'info');

    const slide = slides[currentSlideIndex];
    if (slide && (isAutoAdvanceEnabled || isAutoPlaying)) {
        const baseDuration = slide.customDuration || autoPlayDuration;
        const readDuration = calculateSummaryReadTime(slide.aiSummary, summarySpeedMultiplier);
        currentSlideDuration = Math.max(baseDuration, readDuration);
        remainingTimeOnPause = Math.max(0, currentSlideDuration - (Date.now() - slideStartTime));
    }
}

/**
 * Renders the slide navigation dots in the footer.
 */
function renderSlideDots(): void {
    const container = document.getElementById('kioskDotsContainer');
    if (!container) return;

    container.innerHTML = slides.map((_, idx) => {
        const isActive = idx === currentSlideIndex;
        return `
            <button class="kiosk-dot-btn p-0 rounded-circle border-0 transition-all duration-200" data-index="${idx}" title="Slide ${idx + 1}" style="width: ${isActive ? '20px' : '8px'}; height: 8px; border-radius: 4px !important; background: ${isActive ? '#6366f1' : 'rgba(255, 255, 255, 0.25)'}; cursor: pointer;"></button>
        `;
    }).join('');

    container.querySelectorAll('.kiosk-dot-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const idx = Number(btn.getAttribute('data-index'));
            if (!isNaN(idx)) goToSlide(idx);
        });
    });
}

/**
 * Updates active slide visual, AI Summary, progress bar, dots, and starts auto-flow.
 */
function updateSlideContent(): void {
    const slide = slides[currentSlideIndex];
    if (!slide) return;

    // 1. Update Title & Badge
    const badgeEl = document.getElementById('kioskSlideBadge');
    if (badgeEl) badgeEl.textContent = `${currentSlideIndex + 1} / ${slides.length}`;

    const titleEl = document.getElementById('kioskSlideTitle');
    if (titleEl) titleEl.textContent = slide.title;

    // 2. Update Visual Slide Progress Indicator in Footer
    const bottomIndexEl = document.getElementById('kioskBottomSlideIndex');
    if (bottomIndexEl) bottomIndexEl.textContent = String(currentSlideIndex + 1);

    const bottomTotalEl = document.getElementById('kioskBottomSlideTotal');
    if (bottomTotalEl) bottomTotalEl.textContent = String(slides.length);

    const remainingSlides = slides.length - (currentSlideIndex + 1);
    const remainingPill = document.getElementById('kioskBottomRemainingPill');
    if (remainingPill) {
        if (remainingSlides === 0) {
            remainingPill.innerHTML = `<i class="bi bi-check-circle-fill text-emerald-400"></i> <span class="fw-semibold">Final Slide</span>`;
            remainingPill.style.background = 'rgba(16, 185, 129, 0.15)';
            remainingPill.style.borderColor = 'rgba(16, 185, 129, 0.35)';
            remainingPill.style.color = '#6ee7b7';
        } else {
            remainingPill.innerHTML = `<i class="bi bi-hourglass-split text-amber-400"></i> <span><strong class="font-monospace">${remainingSlides}</strong> ${remainingSlides === 1 ? 'slide' : 'slides'} remaining</span>`;
            remainingPill.style.background = 'rgba(99, 102, 241, 0.14)';
            remainingPill.style.borderColor = 'rgba(99, 102, 241, 0.32)';
            remainingPill.style.color = '#c7d2fe';
        }
    }

    // 3. Update Progress Bars (Overall Slide Progress)
    const pct = ((currentSlideIndex + 1) / slides.length) * 100;
    const progressBar = document.getElementById('kioskProgressBar');
    if (progressBar) progressBar.style.width = `${pct}%`;

    const bottomProgressBarFill = document.getElementById('kioskBottomProgressBarFill');
    if (bottomProgressBarFill) bottomProgressBarFill.style.width = `${pct}%`;

    const bottomEdgeProgressBar = document.getElementById('kioskBottomEdgeProgressBar');
    if (bottomEdgeProgressBar) bottomEdgeProgressBar.style.width = `${pct}%`;

    // 4. Update Dots
    const dotBtns = document.querySelectorAll('.kiosk-dot-btn') as NodeListOf<HTMLButtonElement>;
    dotBtns.forEach((btn, idx) => {
        const isActive = idx === currentSlideIndex;
        btn.style.width = isActive ? '20px' : '8px';
        btn.style.background = isActive ? '#6366f1' : 'rgba(255, 255, 255, 0.25)';
    });

    // 5. Highlight Active Layout and Density buttons in Settings & update configuration controls
    updateSettingsConfigurationUI();

    // 5. Render AI Summary with subtle transition animation
    const summaryHtml = renderSlideAiSummaryHtml(slide.aiSummary, {
        layout: layoutPreference,
        theme: themePreference,
        density: densityPreference
    });

    const briefingPanel = document.getElementById('kioskBriefingPanel');
    const bottomShelf = document.getElementById('kioskBottomShelf');

    if (layoutPreference === 'side') {
        if (briefingPanel) {
            briefingPanel.innerHTML = summaryHtml;
            // Reflow transition
            const panel = briefingPanel.querySelector('.pres-summary-panel');
            if (panel) {
                panel.classList.remove('pres-summary-anim');
                void (panel as HTMLElement).offsetWidth;
                panel.classList.add('pres-summary-anim');
            }
        }
        if (bottomShelf) bottomShelf.innerHTML = '';
    } else if (layoutPreference === 'bottom' || layoutPreference === 'minimal') {
        if (bottomShelf) {
            bottomShelf.innerHTML = summaryHtml;
            const bottomEl = bottomShelf.querySelector('.pres-summary-bottom, .pres-summary-minimal');
            if (bottomEl) {
                bottomEl.classList.remove('pres-summary-anim');
                void (bottomEl as HTMLElement).offsetWidth;
                bottomEl.classList.add('pres-summary-anim');
            }
        }
        if (briefingPanel) briefingPanel.innerHTML = '';
    } else {
        if (briefingPanel) briefingPanel.innerHTML = '';
        if (bottomShelf) bottomShelf.innerHTML = '';
    }

    // Attach speak, replay, and copy listeners in whichever container was filled
    const activeSummaryContainer = layoutPreference === 'side' ? briefingPanel : bottomShelf;
    if (activeSummaryContainer) {
        activeSummaryContainer.querySelectorAll('.pres-btn-speak').forEach(btn => {
            btn.addEventListener('click', () => {
                toggleVoice();
            });
        });
        activeSummaryContainer.querySelectorAll('.pres-btn-replay-narration').forEach(btn => {
            btn.addEventListener('click', () => {
                replayCurrentSlide();
            });
        });
        activeSummaryContainer.querySelectorAll('.pres-btn-copy').forEach(btn => {
            btn.addEventListener('click', () => {
                const copyText = `${slide.aiSummary.title}\n${slide.aiSummary.headline}\n\nTakeaways:\n${slide.aiSummary.keyInsights.join('\n')}\n\nAction:\n${slide.aiSummary.actionItem}`;
                navigator.clipboard.writeText(copyText).then(() => {
                    showMessage('Summary copied to clipboard', 'success');
                }).catch(() => {});
            });
        });
    }
    updateNarratorUIState();

    // 6. Render High-Resolution Visual on Stage with subtle entrance transition
    disposeKioskStageChart();
    const stageVisual = document.getElementById('kioskStageVisual');
    if (stageVisual && slide.chartConfig) {
        stageVisual.innerHTML = '';
        stageVisual.classList.remove('pres-stage-anim');
        void stageVisual.offsetWidth; // force reflow for smooth animation
        stageVisual.classList.add('pres-stage-anim');

        const originalContainer = document.getElementById(`container-${slide.chartConfig.id}`);
        const isTemplate = slide.chartConfig.type === 'template_card' || (slide.chartConfig as any).templateCategory;

        if (isTemplate && originalContainer) {
            const clone = originalContainer.cloneNode(true) as HTMLElement;
            cleanCloneForPresentation(clone);
            stageVisual.appendChild(clone);
        } else if (originalContainer) {
            // Re-render ECharts or clone
            const origDom = originalContainer.querySelector('.chart-canvas') ||
                            originalContainer.querySelector(`[id="${slide.chartConfig.id}"]`) ||
                            document.getElementById(slide.chartConfig.id);

            let origInst: any = null;
            if (origDom && typeof echarts !== 'undefined' && echarts.getInstanceByDom) {
                origInst = echarts.getInstanceByDom(origDom);
            }

            if (origInst) {
                try {
                    const opt = origInst.getOption();
                    const stageChartDiv = document.createElement('div');
                    stageChartDiv.className = 'w-100 h-100 kiosk-echarts-container';
                    stageChartDiv.style.minHeight = '420px';
                    stageVisual.appendChild(stageChartDiv);

                    const kioskChart = echarts.init(stageChartDiv, themePreference === 'light' ? undefined : 'dark');
                    kioskChart.setOption(opt);
                    setTimeout(() => kioskChart.resize(), 50);
                    (stageVisual as any)._activeKioskChart = kioskChart;
                } catch (e) {
                    const clone = originalContainer.cloneNode(true) as HTMLElement;
                    cleanCloneForPresentation(clone);
                    stageVisual.appendChild(clone);
                }
            } else {
                const clone = originalContainer.cloneNode(true) as HTMLElement;
                cleanCloneForPresentation(clone);
                stageVisual.appendChild(clone);
            }
        } else {
            stageVisual.innerHTML = `
                <div class="p-4 text-center">
                    <h5 class="mb-2">${escapeHtml(slide.title)}</h5>
                    <div class="badge bg-indigo-600">Active Visual</div>
                </div>
            `;
        }
    }

    // 7. Trigger the Auto-Scroll and Auto-Advance flow
    startSlideAutoFlow();
}

/**
 * Returns true if presentation mode is currently open.
 */
export function getIsPresentationActive(): boolean {
    return isPresentationActive;
}

/**
 * Returns a comprehensive live presentation telemetry snapshot for the AI agent.
 */
export function getPresentationStatus(): any {
    const slide = slides[currentSlideIndex];
    return {
        isActive: isPresentationActive,
        currentSlideIndex: currentSlideIndex + 1,
        totalSlides: slides.length,
        currentSlideTitle: slide?.title || '',
        currentSlideType: slide?.type || '',
        isAutoPlaying,
        isAutoAdvanceEnabled,
        autoPlayDurationSec: autoPlayDuration / 1000,
        currentSlideDurationSec: slide?.customDuration ? (slide.customDuration / 1000) : (autoPlayDuration / 1000),
        hasCustomSlideDuration: !!slide?.customDuration,
        summarySpeedMultiplier,
        layoutPreference,
        themePreference,
        densityPreference,
        isVoiceEnabled,
        isLaserActive,
        isPenActive,
        isSlidePaused
    };
}

/**
 * Universal Presentation Command Dispatcher.
 * Allows the AI Agent to control all presentation menus, settings, and tools.
 */
export function executePresentationCommand(cmd: PresentationAgentCommand): { success: boolean; message: string; details?: any } {
    if (!isPresentationActive && cmd.action !== 'start-presentation') {
        // Automatically start presentation if a command is issued when not currently active
        startPresentationMode({
            slideIndex: cmd.slideIndex,
            slideQuery: cmd.slideQuery,
            layout: cmd.layout,
            theme: cmd.theme,
            density: cmd.density,
            duration: cmd.duration,
            speed: cmd.speed
        });
    }

    const action = cmd.action.toLowerCase();

    switch (action) {
        case 'start-presentation': {
            if (!isPresentationActive) {
                startPresentationMode({
                    slideIndex: cmd.slideIndex,
                    slideQuery: cmd.slideQuery,
                    layout: cmd.layout,
                    theme: cmd.theme,
                    density: cmd.density,
                    duration: cmd.duration,
                    speed: cmd.speed
                });
            } else {
                if (cmd.slideIndex !== undefined) goToSlide(cmd.slideIndex - 1);
                else if (cmd.slideQuery) goToSlideByQuery(cmd.slideQuery);
                if (cmd.layout) setLayoutPreference(cmd.layout);
                if (cmd.theme) toggleTheme(cmd.theme);
                if (cmd.density) setDensityPreference(cmd.density);
                if (cmd.duration) setSlideDisplayDuration(cmd.duration, cmd.scope || 'all');
                if (cmd.speed) setSummaryDisplaySpeed(cmd.speed);
            }
            return { success: true, message: `Presentation mode active on slide ${currentSlideIndex + 1} of ${slides.length}` };
        }

        case 'exit-presentation':
        case 'presentation-exit': {
            exitPresentationMode();
            return { success: true, message: 'Exited presentation mode' };
        }

        case 'next-slide':
        case 'presentation-next':
        case 'presentation-next-slide': {
            nextSlide();
            return { success: true, message: `Advanced to slide ${currentSlideIndex + 1} of ${slides.length}: "${slides[currentSlideIndex]?.title}"` };
        }

        case 'prev-slide':
        case 'presentation-prev':
        case 'presentation-prev-slide': {
            prevSlide();
            return { success: true, message: `Returned to slide ${currentSlideIndex + 1} of ${slides.length}: "${slides[currentSlideIndex]?.title}"` };
        }

        case 'go-to-slide':
        case 'presentation-go-to-slide':
        case 'presentation-goto-slide': {
            if (cmd.slideIndex !== undefined) {
                const target = cmd.slideIndex > 0 ? cmd.slideIndex - 1 : 0;
                goToSlide(target);
                return { success: true, message: `Navigated to slide ${currentSlideIndex + 1} of ${slides.length}: "${slides[currentSlideIndex]?.title}"` };
            } else if (cmd.slideQuery) {
                const found = goToSlideByQuery(cmd.slideQuery);
                if (found) {
                    return { success: true, message: `Navigated to slide ${currentSlideIndex + 1}: "${slides[currentSlideIndex]?.title}"` };
                } else {
                    return { success: false, message: `Could not find slide matching "${cmd.slideQuery}"` };
                }
            }
            return { success: false, message: 'No slideIndex or slideQuery specified' };
        }

        case 'presentation-play':
        case 'presentation-resume': {
            startAutoPlay();
            return { success: true, message: 'Presentation auto-play resumed' };
        }

        case 'presentation-pause': {
            stopAutoPlay();
            return { success: true, message: 'Presentation auto-play paused' };
        }

        case 'presentation-toggle-play': {
            toggleAutoPlay();
            return { success: true, message: `Presentation auto-play is now ${isAutoPlaying ? 'active' : 'paused'}` };
        }

        case 'presentation-set-auto-advance':
        case 'presentation-toggle-auto-advance': {
            const desired = cmd.state === 'on' || cmd.state === true ? true : cmd.state === 'off' || cmd.state === false ? false : undefined;
            toggleAutoAdvance(desired);
            return { success: true, message: `Auto-advance after AI summary is now ${isAutoAdvanceEnabled ? 'enabled' : 'disabled'}` };
        }

        case 'presentation-set-duration': {
            if (cmd.duration !== undefined) {
                setSlideDisplayDuration(cmd.duration, cmd.scope || 'all');
                return { success: true, message: `Slide duration set to ${cmd.duration}s for ${cmd.scope === 'current' ? `slide ${currentSlideIndex + 1}` : 'all slides'}` };
            }
            return { success: false, message: 'No duration specified' };
        }

        case 'presentation-adjust-duration': {
            if (cmd.durationDelta !== undefined) {
                adjustSlideDuration(cmd.durationDelta, cmd.scope || 'current');
                return { success: true, message: `Slide duration adjusted by ${cmd.durationDelta > 0 ? '+' : ''}${cmd.durationDelta}s` };
            }
            return { success: false, message: 'No durationDelta specified' };
        }

        case 'presentation-reset-duration': {
            resetCurrentSlideDuration();
            return { success: true, message: `Slide ${currentSlideIndex + 1} duration reset to baseline (${autoPlayDuration / 1000}s)` };
        }

        case 'presentation-set-speed': {
            if (cmd.speed !== undefined) {
                setSummaryDisplaySpeed(cmd.speed);
                return { success: true, message: `AI summary reading speed set to ${cmd.speed}x` };
            }
            return { success: false, message: 'No speed specified' };
        }

        case 'presentation-set-layout': {
            if (cmd.layout) {
                setLayoutPreference(cmd.layout);
                return { success: true, message: `Presentation layout changed to "${cmd.layout}"` };
            }
            return { success: false, message: 'No layout specified' };
        }

        case 'presentation-cycle-layout': {
            cycleLayout();
            return { success: true, message: `Presentation layout cycled to "${layoutPreference}"` };
        }

        case 'presentation-set-density': {
            if (cmd.density) {
                setDensityPreference(cmd.density);
                return { success: true, message: `AI summary density set to "${cmd.density}"` };
            }
            return { success: false, message: 'No density specified' };
        }

        case 'presentation-set-theme': {
            if (cmd.theme) {
                toggleTheme(cmd.theme);
                return { success: true, message: `Presentation theme set to "${cmd.theme}"` };
            }
            return { success: false, message: 'No theme specified' };
        }

        case 'presentation-toggle-theme': {
            toggleTheme();
            return { success: true, message: `Presentation theme toggled to "${themePreference}"` };
        }

        case 'presentation-set-narrator':
        case 'presentation-set-voice': {
            const desired = cmd.state === 'on' || cmd.state === true || cmd.narrator === true ? true : cmd.state === 'off' || cmd.state === false || cmd.narrator === false ? false : undefined;
            toggleVoice(desired);
            return { success: true, message: `Narrator Mode is now ${isNarratorEnabled() ? 'enabled' : 'disabled'}` };
        }

        case 'presentation-toggle-narrator':
        case 'presentation-toggle-voice': {
            toggleVoice();
            return { success: true, message: `Narrator Mode toggled: ${isNarratorEnabled() ? 'enabled' : 'disabled'}` };
        }

        case 'presentation-replay-narration': {
            replayCurrentSlide();
            return { success: true, message: `Replaying AI summary narration for slide ${currentSlideIndex + 1}` };
        }

        case 'presentation-test-voice': {
            testVoice();
            return { success: true, message: 'Playing test voice speech sample' };
        }

        case 'presentation-configure-narrator': {
            const updates: any = {};
            if (cmd.narratorVoice) updates.voiceURI = cmd.narratorVoice;
            if (cmd.narratorPitch !== undefined) updates.pitch = cmd.narratorPitch;
            if (cmd.speed !== undefined) updates.rate = cmd.speed;
            updateNarratorSettings(updates);
            return { success: true, message: 'Narrator settings updated' };
        }

        case 'presentation-set-laser': {
            const desired = cmd.state === 'on' || cmd.state === true ? true : cmd.state === 'off' || cmd.state === false ? false : undefined;
            toggleLaser(desired);
            return { success: true, message: `Laser pointer is now ${isLaserActive ? 'active' : 'off'}` };
        }

        case 'presentation-toggle-laser': {
            toggleLaser();
            return { success: true, message: `Laser pointer toggled: ${isLaserActive ? 'active' : 'off'}` };
        }

        case 'presentation-set-pen': {
            const desired = cmd.state === 'on' || cmd.state === true ? true : cmd.state === 'off' || cmd.state === false ? false : undefined;
            togglePen(desired);
            return { success: true, message: `Drawing pen is now ${isPenActive ? 'active' : 'off'}` };
        }

        case 'presentation-toggle-pen': {
            togglePen();
            return { success: true, message: `Drawing pen toggled: ${isPenActive ? 'active' : 'off'}` };
        }

        case 'presentation-clear-annotations': {
            clearAnnotations();
            return { success: true, message: 'Annotations cleared from slide' };
        }

        case 'presentation-open-settings': {
            toggleSettingsModal(true);
            return { success: true, message: 'Opened presentation configuration settings' };
        }

        case 'presentation-close-settings': {
            toggleSettingsModal(false);
            return { success: true, message: 'Closed presentation configuration settings' };
        }

        case 'presentation-toggle-settings': {
            toggleSettingsModal();
            return { success: true, message: 'Toggled presentation settings modal' };
        }

        case 'presentation-toggle-fullscreen': {
            toggleFullscreen();
            return { success: true, message: 'Toggled fullscreen presentation mode' };
        }

        default:
            return { success: false, message: `Unknown presentation command: ${cmd.action}` };
    }
}

// Global runtime binding for window & cross-script integration
if (typeof window !== 'undefined') {
    (window as any).presentationKiosk = {
        start: startPresentationMode,
        exit: exitPresentationMode,
        goToSlide,
        goToSlideByQuery,
        next: nextSlide,
        prev: prevSlide,
        play: startAutoPlay,
        pause: stopAutoPlay,
        togglePlay: toggleAutoPlay,
        toggleAutoAdvance,
        cycleLayout,
        setLayout: setLayoutPreference,
        setDensity: setDensityPreference,
        toggleTheme,
        setTheme: (t: SummaryThemeMode) => toggleTheme(t),
        toggleVoice,
        setVoice: (v: boolean) => toggleVoice(v),
        toggleNarrator: toggleVoice,
        setNarrator: (v: boolean) => toggleVoice(v),
        isNarratorEnabled,
        replayNarration: replayCurrentSlide,
        testVoice,
        getNarratorConfig,
        updateNarratorSettings,
        toggleLaser,
        setLaser: (l: boolean) => toggleLaser(l),
        togglePen,
        setPen: (p: boolean) => togglePen(p),
        clearAnnotations,
        openSettings: () => toggleSettingsModal(true),
        closeSettings: () => toggleSettingsModal(false),
        toggleSettings: toggleSettingsModal,
        toggleFullscreen,
        setDuration: setSlideDisplayDuration,
        adjustDuration: adjustSlideDuration,
        resetDuration: resetCurrentSlideDuration,
        setSpeed: setSummaryDisplaySpeed,
        getStatus: getPresentationStatus,
        isActive: getIsPresentationActive,
        executeCommand: executePresentationCommand
    };
}
