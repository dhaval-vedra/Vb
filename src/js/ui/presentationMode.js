// src/js/ui/presentationMode.js
import { showMessage, attachEventListener } from '../core/utils.ts';
import { t } from '../i18n/index.ts';
import { visualizations } from '../charts/charts.ts';
import {
    generateSlideAiSummary,
    renderSlideAiSummaryHtml,
    speakSlideSummary
} from '../ai/presentationAiSummaryEngine.ts';
import { startPresentationMode } from '../ai/presentationKioskEngine.ts';

export function initializePresentationMode() {
    // 1. Inject Premium Styles for Presentation Dock, Laser Pointer, Spotlight, Drawing Canvas, and Timer
    if (!document.getElementById('presentationModeStyles')) {
        const style = document.createElement('style');
        style.id = 'presentationModeStyles';
        style.innerHTML = `
            /* Fullscreen styling adjustments */
            body.presentation-active {
                overflow: hidden !important;
                background-color: #0b0f19 !important;
            }
            
            body.presentation-active .sidebar,
            body.presentation-active .small-menu-bar,
            body.presentation-active .offcanvas,
            body.presentation-active #chatbot_container,
            body.presentation-active #fabMainBtn,
            body.presentation-active .ai-advice-container {
                display: none !important;
                opacity: 0 !important;
                pointer-events: none !important;
            }
            
            body.presentation-active .main-content-container {
                margin: 0 !important;
                padding: 40px !important;
                width: 100vw !important;
                height: 100vh !important;
                max-width: 100vw !important;
                background: #0b0f19 !important;
                color: #f8fafc !important;
                overflow-y: auto;
                transition: all 0.3s ease;
            }

            /* Floating Presentation Controls Dock */
            .presentation-dock {
                position: fixed;
                bottom: 24px;
                left: 50%;
                transform: translateX(-50%) translateY(100px);
                background: rgba(15, 23, 42, 0.88);
                backdrop-filter: blur(20px);
                -webkit-backdrop-filter: blur(20px);
                border: 1px solid rgba(255, 255, 255, 0.12);
                border-radius: 100px;
                padding: 10px 24px;
                display: flex;
                align-items: center;
                gap: 14px;
                box-shadow: 0 20px 45px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.15);
                z-index: 101100;
                transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s;
                opacity: 0;
            }
            
            .presentation-dock.visible {
                transform: translateX(-50%) translateY(0);
                opacity: 1;
            }
            
            .presentation-dock:hover {
                background: rgba(15, 23, 42, 0.96);
                border-color: rgba(255, 255, 255, 0.25);
            }
            
            .pres-btn {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                border: none;
                background: rgba(255, 255, 255, 0.08);
                color: #f8fafc;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
                cursor: pointer;
                position: relative;
                transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
            }
            
            .pres-btn:hover {
                background: #8b5cf6;
                color: #ffffff;
                transform: scale(1.1);
            }
            
            .pres-btn:active {
                transform: scale(0.95);
            }
            
            .pres-btn.active {
                background: #ef4444;
                color: #ffffff;
                box-shadow: 0 0 12px rgba(239, 68, 68, 0.5);
                animation: pulseLaserBtn 2s infinite;
            }
            
            @keyframes pulseLaserBtn {
                0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
                70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
                100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
            }
            
            .pres-divider {
                width: 1px;
                height: 24px;
                background: rgba(255, 255, 255, 0.15);
            }
            
            .pres-label {
                font-size: 12px;
                font-weight: 700;
                color: #94a3b8;
                font-family: var(--font-sans), system-ui;
                letter-spacing: 0.5px;
            }
            
            .pres-indicator {
                font-size: 13px;
                font-weight: 700;
                color: #f8fafc;
                background: rgba(255, 255, 255, 0.1);
                padding: 4px 12px;
                border-radius: 20px;
                font-family: var(--font-mono), monospace;
            }

            /* Smart Timer */
            .pres-timer-badge {
                display: flex;
                align-items: center;
                gap: 6px;
                background: rgba(255, 255, 255, 0.08);
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-family: var(--font-mono), monospace;
                color: #38bdf8;
                border: 1px solid rgba(56, 189, 248, 0.2);
                cursor: pointer;
                transition: background 0.2s;
            }
            .pres-timer-badge:hover {
                background: rgba(56, 189, 248, 0.2);
            }

            /* Realistic Laser Pointer Cursor & Sparkle Effects */
            .laser-pointer-cursor {
                position: fixed;
                width: 14px;
                height: 14px;
                border-radius: 50%;
                background: radial-gradient(circle, #ffffff 10%, #ff0055 60%, transparent 100%);
                box-shadow: 0 0 10px #ff0055, 0 0 20px #ff0055, 0 0 40px #ff3377, 0 0 80px rgba(255, 0, 85, 0.8);
                pointer-events: none;
                z-index: 101000;
                transform: translate(-50%, -50%);
                display: none;
                mix-blend-mode: screen;
                transition: transform 0.05s ease-out;
            }

            .laser-pointer-trail {
                position: fixed;
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #ff0055;
                box-shadow: 0 0 8px #ff0055;
                pointer-events: none;
                z-index: 100999;
                transform: translate(-50%, -50%);
                opacity: 0.6;
                transition: top 0.08s ease-out, left 0.08s ease-out, opacity 0.3s;
            }

            .laser-ring {
                position: fixed;
                border: 2px solid #ff3366;
                border-radius: 50%;
                pointer-events: none;
                z-index: 100998;
                transform: translate(-50%, -50%) scale(0);
                animation: laserRingExpand 0.5s ease-out forwards;
            }

            @keyframes laserRingExpand {
                0% { transform: translate(-50%, -50%) scale(0.2); opacity: 1; border-width: 3px; }
                100% { transform: translate(-50%, -50%) scale(3.5); opacity: 0; border-width: 1px; }
            }

            /* Spotlight & Dimmer focus on single chart */
            .slide-spotlight-active {
                position: relative;
                z-index: 100900 !important;
                box-shadow: 0 0 0 9999px rgba(11, 15, 25, 0.85), 0 25px 50px -12px rgba(0, 0, 0, 0.7) !important;
                transform: scale(1.02);
                transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
                border: 1px solid rgba(139, 92, 246, 0.5) !important;
            }

            .pres-dimmer {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: rgba(11, 15, 25, 0.85);
                z-index: 100800;
                display: none;
                opacity: 0;
                transition: opacity 0.5s ease;
                pointer-events: none;
            }
            
            .pres-dimmer.visible {
                display: block;
                opacity: 1;
            }

            /* Fullscreen Annotation Canvas overlay */
            #presentationCanvas {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                z-index: 100950;
                pointer-events: none;
                display: none;
            }
            
            #presentationCanvas.drawing-active {
                pointer-events: auto !important;
                cursor: crosshair !important;
                display: block;
            }

            /* Annotation Paint Options Panel */
            .annotation-palette {
                display: none;
                align-items: center;
                gap: 8px;
                background: rgba(15, 23, 42, 0.9);
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: 20px;
                padding: 4px 12px;
            }
            
            .annotation-palette.visible {
                display: flex;
            }

            .pen-color-dot {
                width: 14px;
                height: 14px;
                border-radius: 50%;
                cursor: pointer;
                border: 2px solid transparent;
                transition: transform 0.2s;
            }
            
            .pen-color-dot:hover {
                transform: scale(1.25);
            }
            
            .pen-color-dot.active {
                border-color: #ffffff;
                box-shadow: 0 0 6px rgba(255, 255, 255, 0.8);
                transform: scale(1.25);
            }
        `;
        document.head.appendChild(style);
    }

    // 2. Build DOM structures
    let dock = document.querySelector('.presentation-dock');
    if (!dock) {
        dock = document.createElement('div');
        dock.className = 'presentation-dock';
        dock.innerHTML = `
            <span class="pres-label">💻 ${t('presentation.liveShow', 'LIVE SHOW')}</span>
            <span class="pres-indicator" id="presSlideCounter">Overview</span>
            
            <!-- Smart presentation countdown / stopwatch -->
            <div class="pres-timer-badge" id="presTimer" title="${t('presentation.timerTooltip', 'Timer (Click to reset)')}">
                <i class="bi bi-stopwatch"></i> <span id="presTimerText">00:00</span>
            </div>

            <div class="pres-divider"></div>
            
            <button class="pres-btn" id="presPrevBtn" title="${t('presentation.prevSlide', 'Previous Slide')}"><i class="bi bi-chevron-left"></i></button>
            <button class="pres-btn" id="presPlayBtn" title="${t('presentation.autoPlay', 'Auto Play / Pause')}"><i class="bi bi-play-fill"></i></button>
            <button class="pres-btn" id="presNextBtn" title="${t('presentation.nextSlide', 'Next Slide')}"><i class="bi bi-chevron-right"></i></button>
            
            <div class="pres-divider"></div>
            
            <!-- Laser, Drawing Brush, and Speech mic controllers -->
            <button class="pres-btn" id="presLaserBtn" title="${t('presentation.laserPointer', 'Laser Pointer (L)')}"><i class="bi bi-cursor-fill" style="color: #ff3366;"></i></button>
            
            <button class="pres-btn" id="presPenBtn" title="${t('presentation.drawingPen', 'Draw / Pen Mode (P)')}"><i class="bi bi-pencil-fill" style="color: #f59e0b;"></i></button>
            
            <!-- Annotation Options Palette -->
            <div class="annotation-palette" id="anPalette">
                <div class="pen-color-dot active" style="background: #ef4444;" data-color="#ef4444" title="Red"></div>
                <div class="pen-color-dot" style="background: #eab308;" data-color="#eab308" title="Yellow"></div>
                <div class="pen-color-dot" style="background: #06b6d4;" data-color="#06b6d4" title="Cyan"></div>
                <div class="pen-color-dot" style="background: #22c55e;" data-color="#22c55e" title="Green"></div>
                <button class="btn btn-xs btn-outline-danger p-0 d-flex align-items-center justify-content-center" id="anClearBtn" style="width: 20px; height: 20px; border-radius: 50%;" title="${t('presentation.clearAnnotations', 'Clear Annotations')}"><i class="bi bi-trash-fill" style="font-size: 10px;"></i></button>
            </div>

            <button class="pres-btn" id="presVoiceBtn" title="${t('presentation.voiceControl', 'Voice Remote Control')}"><i class="bi bi-mic-fill" style="color: #22c55e;"></i></button>
            <button class="pres-btn" id="presRefreshBtn" title="${t('presentation.refreshData', 'Simulate Data Refresh')}"><i class="bi bi-arrow-repeat text-info"></i></button>
            
            <button class="pres-btn" id="presAiBtn" title="एआई सारांश दिखाएं / छुपाएं (A)"><i class="bi bi-stars" style="color: #c084fc;"></i></button>
            <button class="pres-btn" id="presKioskModeBtn" title="बोर्ड मीटिंग फुलस्क्रीन कियोस्क (K)"><i class="bi bi-easel2-fill text-indigo-400"></i></button>

            <div class="pres-divider"></div>
            
            <button class="pres-btn btn-danger" id="presExitBtn" title="${t('presentation.exitPresentation', 'Exit (ESC)')}"><i class="bi bi-x-lg"></i></button>
        `;
        document.body.appendChild(dock);
    }

    // AI Summary HUD overlay for Spotlight mode
    let presAiHud = document.getElementById('presAiSummaryHUD');
    if (!presAiHud) {
        presAiHud = document.createElement('div');
        presAiHud.id = 'presAiSummaryHUD';
        presAiHud.className = 'presentation-ai-hud';
        presAiHud.style.cssText = `
            position: fixed;
            top: 24px;
            right: 24px;
            width: 420px;
            max-width: calc(100vw - 48px);
            max-height: calc(100vh - 120px);
            background: rgba(15, 23, 42, 0.94);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(99, 102, 241, 0.4);
            border-radius: 16px;
            padding: 16px;
            color: #f8fafc;
            box-shadow: 0 25px 60px rgba(0, 0, 0, 0.7);
            z-index: 101050;
            display: none;
            flex-direction: column;
            overflow: hidden;
            transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease;
        `;
        document.body.appendChild(presAiHud);
    }

    let isAiHudEnabled = true;

    let laserDot = document.querySelector('.laser-pointer-cursor');
    if (!laserDot) {
        laserDot = document.createElement('div');
        laserDot.className = 'laser-pointer-cursor';
        document.body.appendChild(laserDot);
    }

    // Create Dimmer
    let presDimmer = document.querySelector('.pres-dimmer');
    if (!presDimmer) {
        presDimmer = document.createElement('div');
        presDimmer.className = 'pres-dimmer';
        document.body.appendChild(presDimmer);
    }

    // Annotation Canvas overlay
    let paintCanvas = document.getElementById('presentationCanvas');
    if (!paintCanvas) {
        paintCanvas = document.createElement('canvas');
        paintCanvas.id = 'presentationCanvas';
        document.body.appendChild(paintCanvas);
    }

    let isPlaying = false;
    let isLaserActive = false;
    let isPenActive = false;
    let currentSlideIndex = -1;
    let slideshowTimer = null;
    let timerSeconds = 0;
    let timerInterval = null;
    let speechRecognizer = null;
    let isListening = false;
    let trailElements = [];
    const maxTrails = 4;

    // Drawing context
    const ctx = paintCanvas.getContext('2d');
    let isDrawing = false;
    let penColor = '#ef4444'; // Red default
    let penWidth = 4;

    // Create Trails for the laser dot
    for (let i = 0; i < maxTrails; i++) {
        let trail = document.createElement('div');
        trail.className = 'laser-pointer-trail';
        trail.style.opacity = String((1 - (i / maxTrails)) * 0.7);
        trail.style.display = 'none';
        document.body.appendChild(trail);
        trailElements.push(trail);
    }

    // 3. Core Functions
    function startPresentation() {
        document.body.classList.add('presentation-active');
        dock.classList.add('visible');
        isPlaying = false;
        isLaserActive = false;
        isPenActive = false;
        currentSlideIndex = -1;
        updateSlideCounter();
        setupCanvasSize();

        // Start Stopwatch
        startPresentationTimer();
        
        showMessage(t('presentation.modeActiveToast', '💻 Presentation Mode Active! Pen (P), Laser (L), and Voice (V) enabled.'), "success");
        
        // Add window listeners
        window.addEventListener('keydown', handleKeyNavigation);
        window.addEventListener('resize', setupCanvasSize);
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mousedown', handleMouseDown);

        // Bind Drawing mouse/touch events
        paintCanvas.addEventListener('mousedown', startDrawing);
        paintCanvas.addEventListener('mousemove', draw);
        paintCanvas.addEventListener('mouseup', stopDrawing);
        paintCanvas.addEventListener('mouseout', stopDrawing);
    }

    function exitPresentation() {
        // Stop autoplay
        stopSlideshow();
        
        // Disable laser, drawing and mic
        deactivateLaser();
        deactivatePen();
        stopVoiceRecognition();
        
        // Clear spotlights
        clearSpotlight();

        // Clear dimmer overlay
        if (presDimmer) {
            presDimmer.classList.remove('visible');
            presDimmer.style.display = 'none';
        }

        // Stop timer
        stopPresentationTimer();

        document.body.classList.remove('presentation-active');
        dock.classList.remove('visible');
        
        window.removeEventListener('keydown', handleKeyNavigation);
        window.removeEventListener('resize', setupCanvasSize);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mousedown', handleMouseDown);

        paintCanvas.removeEventListener('mousedown', startDrawing);
        paintCanvas.removeEventListener('mousemove', draw);
        paintCanvas.removeEventListener('mouseup', stopDrawing);
        paintCanvas.removeEventListener('mouseout', stopDrawing);

        // Exit native fullscreen if active
        const isFullscreen = document.fullscreenElement || 
                             document.webkitFullscreenElement || 
                             document.mozFullScreenElement || 
                             document.msFullscreenElement;
        if (isFullscreen) {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
        }

        if (presAiHud) {
            presAiHud.style.display = 'none';
        }
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
        
        showMessage(t('presentation.modeExitedToast', 'Presentation Mode ended.'), "info");
    }

    // Slide / Spotlight controller
    function getSlides() {
        return Array.from(document.querySelectorAll('.visualization-container, .template-card-container'));
    }

    function updateSlideCounter() {
        const slides = getSlides();
        const total = slides.length;
        const currentText = currentSlideIndex === -1 ? "Overview" : `${currentSlideIndex + 1}/${total}`;
        const counterEl = document.getElementById('presSlideCounter');
        if (counterEl) counterEl.textContent = currentText;
    }

    function renderAiSummaryForSpotlight(targetSlide, index, totalSlides) {
        if (!presAiHud) return;

        const chartId = targetSlide.id.replace('container-', '');
        const config = visualizations.find(v => v.id === chartId) || (targetSlide)._config || {
            id: chartId,
            title: targetSlide.querySelector('.card-title, h5, h6, .template-card-label, .card-header')?.textContent?.trim() || 'Insight',
            type: targetSlide.classList.contains('template-card-container') ? 'template_card' : 'chart'
        };

        const summary = generateSlideAiSummary(config, index + 1, totalSlides);

        presAiHud.style.display = 'flex';
        presAiHud.innerHTML = `
            <div class="d-flex align-items-center justify-content-between pb-2 mb-2 border-bottom border-slate-800">
                <div class="d-flex align-items-center gap-2">
                    <span class="badge bg-indigo-600 text-white px-2 py-0.5 d-flex align-items-center gap-1" style="font-size: 10px;">
                        <i class="bi bi-stars"></i> EXECUTIVE BRIEF
                    </span>
                    <span class="badge bg-slate-800 text-slate-300 border border-slate-700 text-3xs">
                        ${index + 1} / ${totalSlides}
                    </span>
                </div>
                <div class="d-flex align-items-center gap-1">
                    <button id="presHudKioskBtn" class="btn btn-xs btn-outline-indigo text-indigo-300 px-2 py-0.5" title="Full Screen Presentation" style="font-size: 10px;">
                        <i class="bi bi-arrows-fullscreen me-1"></i> Fullscreen
                    </button>
                    <button id="presHudCloseBtn" class="btn btn-xs btn-outline-slate text-slate-400 p-1 px-1.5" title="Close">
                        <i class="bi bi-x-lg"></i>
                    </button>
                </div>
            </div>
            <div class="flex-grow-1 overflow-auto pe-1 custom-scrollbar">
                ${renderSlideAiSummaryHtml(summary, { layout: 'side', density: 'detailed', theme: 'dark' })}
            </div>
        `;

        document.getElementById('presHudCloseBtn')?.addEventListener('click', () => {
            presAiHud.style.display = 'none';
        });

        document.getElementById('presHudKioskBtn')?.addEventListener('click', () => {
            exitPresentation();
            startPresentationMode();
        });

        presAiHud.querySelector('.pres-btn-speak')?.addEventListener('click', () => {
            speakSlideSummary(summary);
        });

        presAiHud.querySelector('.pres-btn-copy')?.addEventListener('click', () => {
            const copyText = `${summary.title}\n${summary.headline}\n\nKey Takeaways:\n${summary.keyInsights.join('\n')}\n\nRecommended Action:\n${summary.actionItem}`;
            navigator.clipboard.writeText(copyText).then(() => {
                showMessage('Summary copied to clipboard', 'success');
            }).catch(() => {});
        });
    }

    function showSlide(index) {
        const slides = getSlides();
        clearSpotlight();
        
        if (index < -1) index = slides.length - 1;
        if (index >= slides.length) index = -1;
        
        currentSlideIndex = index;
        updateSlideCounter();

        if (index === -1) {
            // Overview mode
            presDimmer.classList.remove('visible');
            setTimeout(() => {
                presDimmer.style.display = 'none';
            }, 300);
            
            if (presAiHud) presAiHud.style.display = 'none';

            // Scroll to top
            const container = document.querySelector('.main-content-container');
            if (container) {
                container.scrollTo({ top: 0, behavior: 'smooth' });
            }
            return;
        }

        // Slide/Chart spotlight mode
        presDimmer.style.display = 'block';
        setTimeout(() => {
            presDimmer.classList.add('visible');
        }, 10);

        const targetSlide = slides[index];
        if (targetSlide) {
            targetSlide.classList.add('slide-spotlight-active');
            targetSlide.scrollIntoView({ behavior: 'smooth', block: 'center' });

            if (isAiHudEnabled) {
                renderAiSummaryForSpotlight(targetSlide, index, slides.length);
            }
        }
    }

    function clearSpotlight() {
        getSlides().forEach(slide => {
            slide.classList.remove('slide-spotlight-active');
        });
    }

    // Auto Play slideshow logic
    function startSlideshow() {
        isPlaying = true;
        const playBtn = document.getElementById('presPlayBtn');
        if (playBtn) {
            playBtn.innerHTML = `<i class="bi bi-pause-fill"></i>`;
            playBtn.classList.add('bg-primary');
        }

        slideshowTimer = setInterval(() => {
            const slides = getSlides();
            let nextIdx = currentSlideIndex + 1;
            if (nextIdx >= slides.length) nextIdx = -1; // back to overview
            showSlide(nextIdx);
        }, 6000); // 6 seconds per slide
        
        showMessage(t('presentation.autoPlayToast', '⏱️ Auto slideshow active: Slide changes every 6s.'), "info");
    }

    function stopSlideshow() {
        isPlaying = false;
        const playBtn = document.getElementById('presPlayBtn');
        if (playBtn) {
            playBtn.innerHTML = `<i class="bi bi-play-fill"></i>`;
            playBtn.classList.remove('bg-primary');
        }
        if (slideshowTimer) {
            clearInterval(slideshowTimer);
            slideshowTimer = null;
        }
    }

    // Laser pointer handlers
    function activateLaser() {
        deactivatePen(); // Turn off drawing to prevent confusion
        isLaserActive = true;
        document.getElementById('presLaserBtn')?.classList.add('active');
        laserDot.style.display = 'block';
        trailElements.forEach(t => t.style.display = 'block');
        document.body.style.cursor = 'none'; // hide real cursor
    }

    // Deactivate laser pointer
    function deactivateLaser() {
        isLaserActive = false;
        document.getElementById('presLaserBtn')?.classList.remove('active');
        laserDot.style.display = 'none';
        trailElements.forEach(t => t.style.display = 'none');
        document.body.style.cursor = 'default';
    }

    // Interactive Drawing Annotation Pen handlers
    function setupCanvasSize() {
        paintCanvas.width = window.innerWidth;
        paintCanvas.height = window.innerHeight;
        if (ctx) {
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.strokeStyle = penColor;
            ctx.lineWidth = penWidth;
        }
    }

    function activatePen() {
        deactivateLaser(); // Turn off laser to switch to pen
        isPenActive = true;
        document.getElementById('presPenBtn')?.classList.add('active');
        document.getElementById('anPalette')?.classList.add('visible');
        paintCanvas.classList.add('drawing-active');
        showMessage(t('presentation.penActiveToast', '✏️ Drawing Pen Active: Click & drag to draw on screen.'), "info");
    }

    function deactivatePen() {
        isPenActive = false;
        document.getElementById('presPenBtn')?.classList.remove('active');
        document.getElementById('anPalette')?.classList.remove('visible');
        paintCanvas.classList.remove('drawing-active');
    }

    function startDrawing(e) {
        if (!isPenActive || !ctx) return;
        isDrawing = true;
        ctx.beginPath();
        ctx.moveTo(e.clientX, e.clientY);
    }

    function draw(e) {
        if (!isDrawing || !isPenActive || !ctx) return;
        ctx.lineTo(e.clientX, e.clientY);
        ctx.stroke();
    }

    function stopDrawing() {
        isDrawing = false;
    }

    function clearAnnotationCanvas() {
        if (ctx) {
            ctx.clearRect(0, 0, paintCanvas.width, paintCanvas.height);
            showMessage(t('presentation.annotationsCleared', '✨ Annotations cleared.'), "success");
        }
    }

    // Stopwatch countdown timer logic
    function startPresentationTimer() {
        timerSeconds = 0;
        updateTimerDisplay();
        if (timerInterval) clearInterval(timerInterval);
        
        timerInterval = setInterval(() => {
            timerSeconds++;
            updateTimerDisplay();
        }, 1000);
    }

    function stopPresentationTimer() {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
    }

    function updateTimerDisplay() {
        const mins = Math.floor(timerSeconds / 60).toString().padStart(2, '0');
        const secs = (timerSeconds % 60).toString().padStart(2, '0');
        const timerText = document.getElementById('presTimerText');
        if (timerText) timerText.textContent = `${mins}:${secs}`;
    }

    // Hands-free Speech Commands Engine
    function startVoiceRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            showMessage(t('presentation.voiceUnavailable', '🎙️ Voice control not supported in this browser.'), "warning");
            return;
        }

        try {
            speechRecognizer = new SpeechRecognition();
            speechRecognizer.continuous = true;
            speechRecognizer.interimResults = false;
            speechRecognizer.lang = 'en-US';

            speechRecognizer.onstart = () => {
                isListening = true;
                const btn = document.getElementById('presVoiceBtn');
                if (btn) btn.classList.add('listening', 'btn-success');
                showMessage(t('presentation.voiceListening', "🎤 Voice Control ON! Say: 'Next', 'Back', 'Laser', 'Clear'"), "success");
            };

            speechRecognizer.onresult = (event) => {
                const resultIndex = event.resultIndex;
                const transcript = event.results[resultIndex][0].transcript.toLowerCase().trim();

                // Analyze spoken command
                if (transcript.includes('आगे') || transcript.includes('next') || transcript.includes('forward')) {
                    stopSlideshow();
                    showSlide(currentSlideIndex + 1);
                } else if (transcript.includes('पीछे') || transcript.includes('back') || transcript.includes('previous')) {
                    stopSlideshow();
                    showSlide(currentSlideIndex - 1);
                } else if (transcript.includes('लेज़र') || transcript.includes('laser')) {
                    if (isLaserActive) deactivateLaser();
                    else activateLaser();
                } else if (transcript.includes('साफ') || transcript.includes('clear')) {
                    clearAnnotationCanvas();
                } else if (transcript.includes('बाहर') || transcript.includes('exit') || transcript.includes('close')) {
                    exitPresentation();
                }
            };

            speechRecognizer.onerror = (e) => {
                const errType = e?.error || e;
                if (errType === 'no-speech' || errType === 'aborted') return;
                if (errType === 'not-allowed' || errType === 'service-not-allowed' || errType === 'audio-capture') {
                    isListening = false;
                    document.getElementById('presVoiceBtn')?.classList.remove('listening', 'btn-success');
                    showMessage(t('presentation.micDenied', '🎙️ Microphone permission not granted.'), "warning");
                    return;
                }
            };

            speechRecognizer.onend = () => {
                if (isListening) {
                    try { speechRecognizer.start(); } catch(_) {}
                } else {
                    document.getElementById('presVoiceBtn')?.classList.remove('listening', 'btn-success');
                }
            };

            speechRecognizer.start();

        } catch (err) {
            console.error("Speech init failure", err);
        }
    }

    function stopVoiceRecognition() {
        isListening = false;
        if (speechRecognizer) {
            speechRecognizer.stop();
            speechRecognizer = null;
        }
        document.getElementById('presVoiceBtn')?.classList.remove('listening', 'btn-success');
    }

    // 4. Mouse and Keyboard Event Handlers
    function handleMouseMove(e) {
        if (!isLaserActive) return;
        
        const x = e.clientX;
        const y = e.clientY;

        laserDot.style.top = `${y}px`;
        laserDot.style.left = `${x}px`;

        setTimeout(() => {
            trailElements.forEach((trail, index) => {
                const delay = (index + 1) * 32;
                setTimeout(() => {
                    trail.style.top = `${y}px`;
                    trail.style.left = `${x}px`;
                }, delay);
            });
        }, 5);
    }

    function handleMouseDown(e) {
        if (!isLaserActive) return;
        
        laserDot.style.width = '24px';
        laserDot.style.height = '24px';
        setTimeout(() => {
            laserDot.style.width = '14px';
            laserDot.style.height = '14px';
        }, 150);

        const ring = document.createElement('div');
        ring.className = 'laser-ring';
        ring.style.top = `${e.clientY}px`;
        ring.style.left = `${e.clientX}px`;
        const colors = ['#ff3366', '#06b6d4', '#eab308', '#22c55e', '#a855f7'];
        ring.style.borderColor = colors[Math.floor(Math.random() * colors.length)];
        document.body.appendChild(ring);
        
        setTimeout(() => {
            ring.remove();
        }, 500);
    }

    function handleKeyNavigation(e) {
        if (e.key === 'Escape') {
            exitPresentation();
        } else if (e.key === 'ArrowRight' || e.key === ' ') {
            e.preventDefault();
            stopSlideshow();
            showSlide(currentSlideIndex + 1);
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            stopSlideshow();
            showSlide(currentSlideIndex - 1);
        } else if (e.key.toLowerCase() === 'p') {
            if (isPenActive) deactivatePen();
            else activatePen();
        } else if (e.key.toLowerCase() === 'l') {
            if (isLaserActive) deactivateLaser();
            else activateLaser();
        } else if (e.key.toLowerCase() === 'c') {
            clearAnnotationCanvas();
        } else if (e.key.toLowerCase() === 'a') {
            isAiHudEnabled = !isAiHudEnabled;
            if (presAiHud) {
                if (!isAiHudEnabled) {
                    presAiHud.style.display = 'none';
                    showMessage('एआई सारांश HUD छिपा दिया गया (A दबाकर पुनः खोलें)', 'info');
                } else if (currentSlideIndex >= 0) {
                    const slides = getSlides();
                    renderAiSummaryForSpotlight(slides[currentSlideIndex], currentSlideIndex, slides.length);
                    showMessage('एआई सारांश HUD सक्रिय', 'success');
                }
            }
        } else if (e.key.toLowerCase() === 'k') {
            exitPresentation();
            startPresentationMode();
        }
    }

    // 5. Connect UI Button Clicks
    attachEventListener('presExitBtn', 'click', exitPresentation);

    attachEventListener('presAiBtn', 'click', () => {
        isAiHudEnabled = !isAiHudEnabled;
        if (presAiHud) {
            if (!isAiHudEnabled) {
                presAiHud.style.display = 'none';
                showMessage('एआई सारांश HUD छिपा दिया गया', 'info');
            } else if (currentSlideIndex >= 0) {
                const slides = getSlides();
                renderAiSummaryForSpotlight(slides[currentSlideIndex], currentSlideIndex, slides.length);
                showMessage('एआई सारांश HUD सक्रिय', 'success');
            } else {
                showMessage('चार्ट या KPI पर नेविगेट करें ताकि उसका एआई सारांश दिखे', 'info');
            }
        }
    });

    attachEventListener('presKioskModeBtn', 'click', () => {
        exitPresentation();
        startPresentationMode();
    });
    
    attachEventListener('presPlayBtn', 'click', () => {
        if (isPlaying) {
            stopSlideshow();
        } else {
            startSlideshow();
        }
    });

    attachEventListener('presPrevBtn', 'click', () => {
        stopSlideshow();
        showSlide(currentSlideIndex - 1);
    });

    attachEventListener('presNextBtn', 'click', () => {
        stopSlideshow();
        showSlide(currentSlideIndex + 1);
    });

    attachEventListener('presLaserBtn', 'click', () => {
        if (isLaserActive) {
            deactivateLaser();
        } else {
            activateLaser();
        }
    });

    attachEventListener('presPenBtn', 'click', () => {
        if (isPenActive) {
            deactivatePen();
        } else {
            activatePen();
        }
    });

    document.querySelectorAll('.pen-color-dot').forEach(dot => {
        dot.addEventListener('click', (e) => {
            document.querySelectorAll('.pen-color-dot').forEach(d => d.classList.remove('active'));
            e.target.classList.add('active');
            penColor = e.target.getAttribute('data-color');
            if (ctx) ctx.strokeStyle = penColor;
        });
    });

    attachEventListener('anClearBtn', 'click', clearAnnotationCanvas);

    attachEventListener('presVoiceBtn', 'click', () => {
        if (isListening) {
            stopVoiceRecognition();
            showMessage(t('presentation.voiceOff', "🎤 Voice mode stopped."), "info");
        } else {
            startVoiceRecognition();
        }
    });

    attachEventListener('presTimer', 'click', () => {
        timerSeconds = 0;
        updateTimerDisplay();
        showMessage(t('presentation.timerReset', "⏱️ Timer reset."), "success");
    });

    attachEventListener('presRefreshBtn', 'click', () => {
        const simBtn = document.getElementById('simulateRealTimeBtn') || document.getElementById('btnSimulateData');
        if (simBtn) {
            simBtn.click();
            showMessage(t('presentation.refreshSimulated', "🔄 Live refresh simulated!"), "success");
        } else {
            showMessage("Active data simulator not found.", "warning");
        }
    });

    // Outer launcher listener
    document.getElementById('btnStartPresentation')?.addEventListener('click', () => {
        startPresentationMode();
    });

    window.openDashboardPresentationMode = startPresentationMode;

    function handleNativeFullscreenChange() {
        const isFullscreenNow = document.fullscreenElement || 
                                document.webkitFullscreenElement || 
                                document.mozFullScreenElement || 
                                document.msFullscreenElement;
        
        if (!isFullscreenNow && document.body.classList.contains('presentation-active')) {
            exitPresentation();
        }
    }

    document.addEventListener('fullscreenchange', handleNativeFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleNativeFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleNativeFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleNativeFullscreenChange);
}
