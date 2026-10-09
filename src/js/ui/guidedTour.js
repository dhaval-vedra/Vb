// src/js/ui/guidedTour.js
import { showMessage } from '../core/utils.ts';
import { t, onLanguageChange } from '../i18n/index.ts';

export function initializeGuidedTour() {
    // 1. Inject Styles for Guided Tour Spotlight, Tooltip, and Animations
    if (!document.getElementById('guidedTourStyles')) {
        const style = document.createElement('style');
        style.id = 'guidedTourStyles';
        style.innerHTML = `
            /* Tour Overlay Dimmer with gentle radial mask */
            .tour-overlay-dimmer {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: rgba(15, 23, 42, 0.75);
                backdrop-filter: blur(4px);
                -webkit-backdrop-filter: blur(4px);
                z-index: 100000;
                display: none;
                transition: opacity 0.3s ease;
                pointer-events: none;
            }

            /* Highlight element spotlight */
            .tour-highlight-active {
                position: relative !important;
                z-index: 100005 !important;
                box-shadow: 0 0 0 9999px rgba(15, 23, 42, 0.72), 0 0 25px rgba(99, 102, 241, 0.9) !important;
                outline: 2px solid #6366f1 !important;
                border-radius: 8px !important;
                pointer-events: auto !important;
                transition: box-shadow 0.3s ease, outline 0.3s ease;
            }

            /* Modern Tooltip Floating Card */
            .tour-tooltip-card {
                position: fixed;
                z-index: 100010;
                background: #ffffff;
                color: #0f172a;
                border: 1px solid rgba(226, 232, 240, 0.9);
                border-radius: 16px;
                padding: 20px;
                width: 380px;
                max-width: 90vw;
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(99, 102, 241, 0.1);
                display: none;
                flex-direction: column;
                transform-origin: center center;
                animation: tourSpringEntry 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
            }

            .dark-theme .tour-tooltip-card {
                background: #0f172a;
                color: #f8fafc;
                border-color: rgba(51, 65, 85, 0.9);
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(99, 102, 241, 0.2);
            }

            @keyframes tourSpringEntry {
                0% { opacity: 0; transform: scale(0.85) translateY(10px); }
                100% { opacity: 1; transform: scale(1) translateY(0); }
            }

            /* Floating animation */
            @keyframes tourFloating {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-4px); }
            }

            .tour-tooltip-card.floating-anim {
                animation: tourSpringEntry 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) forwards, tourFloating 3s ease-in-out infinite 0.45s;
            }

            .tour-progress-bar-container {
                width: 100%;
                height: 4px;
                background: #e2e8f0;
                border-radius: 2px;
                overflow: hidden;
                margin-bottom: 14px;
            }

            .dark-theme .tour-progress-bar-container {
                background: #334155;
            }

            .tour-progress-bar-fill {
                height: 100%;
                background: linear-gradient(90deg, #6366f1, #a855f7, #ec4899);
                border-radius: 2px;
                transition: width 0.3s ease;
            }

            .tour-progress-dot {
                width: 7px;
                height: 7px;
                border-radius: 50%;
                background: #cbd5e1;
                transition: all 0.2s ease;
            }

            .dark-theme .tour-progress-dot {
                background: #475569;
            }

            .tour-progress-dot.active {
                background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
                width: 22px;
                border-radius: 5px;
            }

            /* Fullscreen physics confetti canvas */
            #tourConfettiCanvas {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                pointer-events: none;
                z-index: 100020;
            }
        `;
        document.head.appendChild(style);
    }

    // 2. Audio Synthesizer for pleasant UI chimes
    function playChime(type = 'step') {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;
            const ctx = new AudioContext();
            
            if (type === 'step') {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
                osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5
                gain.gain.setValueAtTime(0.08, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start();
                osc.stop(ctx.currentTime + 0.25);
            } else if (type === 'complete') {
                [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08);
                    gain.gain.setValueAtTime(0.1, ctx.currentTime + i * 0.08);
                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.4);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(ctx.currentTime + i * 0.08);
                    osc.stop(ctx.currentTime + i * 0.08 + 0.4);
                });
            }
        } catch (e) {
            // Audio context restriction silently bypassed
        }
    }

    // 3. Physics Confetti Particle Engine
    function launchConfettiBurst() {
        let canvas = document.getElementById('tourConfettiCanvas');
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.id = 'tourConfettiCanvas';
            document.body.appendChild(canvas);
        }

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const particles = [];
        const colors = ['#6366f1', '#a855f7', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#06b6d4'];

        for (let i = 0; i < 110; i++) {
            particles.push({
                x: canvas.width / 2 + (Math.random() - 0.5) * 80,
                y: canvas.height / 2 + (Math.random() - 0.5) * 80,
                vx: (Math.random() - 0.5) * 16,
                vy: (Math.random() - 0.7) * 18,
                size: Math.random() * 8 + 4,
                color: colors[Math.floor(Math.random() * colors.length)],
                rotation: Math.random() * 360,
                rotationSpeed: (Math.random() - 0.5) * 8,
                opacity: 1,
                shape: Math.random() > 0.4 ? 'rect' : (Math.random() > 0.5 ? 'circle' : 'star')
            });
        }

        let elapsed = 0;

        function renderConfetti() {
            if (!ctx || !canvas) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            elapsed++;

            let activeCount = 0;
            for (const p of particles) {
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.35; // Gravity
                p.vx *= 0.98; // Air drag
                p.rotation += p.rotationSpeed;
                p.opacity -= 0.009;

                if (p.opacity > 0) {
                    activeCount++;
                    ctx.save();
                    ctx.translate(p.x, p.y);
                    ctx.rotate((p.rotation * Math.PI) / 180);
                    ctx.globalAlpha = Math.max(0, p.opacity);
                    ctx.fillStyle = p.color;

                    if (p.shape === 'rect') {
                        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
                    } else if (p.shape === 'circle') {
                        ctx.beginPath();
                        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
                        ctx.fill();
                    } else {
                        // Diamond / Star
                        ctx.beginPath();
                        ctx.moveTo(0, -p.size);
                        ctx.lineTo(p.size * 0.6, 0);
                        ctx.lineTo(0, p.size);
                        ctx.lineTo(-p.size * 0.6, 0);
                        ctx.closePath();
                        ctx.fill();
                    }
                    ctx.restore();
                }
            }

            if (activeCount > 0 && elapsed < 200) {
                requestAnimationFrame(renderConfetti);
            } else {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                canvas.remove();
            }
        }

        renderConfetti();
    }

    // 4. Detailed 11-Step Guided Tour Array mapped to translation keys
    const tourStepConfigs = [
        {
            key: 'welcome',
            icon: 'bi-stars text-indigo-500',
            target: null,
            position: 'center'
        },
        {
            key: 'dataLoad',
            icon: 'bi-file-earmark-spreadsheet-fill text-success',
            target: '#menuData',
            position: 'right'
        },
        {
            key: 'chartStudio',
            icon: 'bi-bar-chart-fill text-primary',
            target: '#menuCharts',
            position: 'right'
        },
        {
            key: 'kpiSparkline',
            icon: 'bi-patch-check-fill text-purple-600',
            target: '#menuKpiBuilder',
            position: 'right'
        },
        {
            key: 'lttbSampling',
            icon: 'bi-sliders text-info',
            target: '#lttbDropdownBtn',
            position: 'bottom'
        },
        {
            key: 'annotations',
            icon: 'bi-pin-angle-fill text-danger',
            target: '#dashboardContent',
            position: 'top'
        },
        {
            key: 'thresholdAlerts',
            icon: 'bi-shield-exclamation text-amber-500',
            target: '#dashboardContent',
            position: 'center'
        },
        {
            key: 'themeStyles',
            icon: 'bi-palette-fill text-teal-600',
            target: '#menuChartFormatting',
            position: 'right'
        },
        {
            key: 'aiNarrator',
            icon: 'bi-volume-up-fill text-indigo-600',
            target: '#btnAudioNarrator',
            position: 'bottom'
        },
        {
            key: 'floatingFab',
            icon: 'bi-magic text-pink-500',
            target: '#fabMainBtn',
            position: 'left'
        },
        {
            key: 'exportReports',
            icon: 'bi-file-earmark-arrow-down-fill text-slate-700',
            target: '#exportReportDropdown',
            position: 'left'
        }
    ];

    let currentStep = 0;

    // 5. DOM Elements Creation
    let dimmer = document.querySelector('.tour-overlay-dimmer');
    if (!dimmer) {
        dimmer = document.createElement('div');
        dimmer.className = 'tour-overlay-dimmer';
        document.body.appendChild(dimmer);
    }

    let tooltipCard = document.querySelector('.tour-tooltip-card');
    if (!tooltipCard) {
        tooltipCard = document.createElement('div');
        tooltipCard.className = 'tour-tooltip-card floating-anim';
        document.body.appendChild(tooltipCard);
    }

    // 6. Physics Placement Engine
    function positionTooltip(stepData) {
        const targetEl = stepData.target ? document.querySelector(stepData.target) : null;
        
        if (!targetEl || stepData.position === 'center') {
            tooltipCard.style.top = '50%';
            tooltipCard.style.left = '50%';
            tooltipCard.style.transform = 'translate(-50%, -50%)';
            tooltipCard.style.position = 'fixed';
            dimmer.style.display = 'block';
            return;
        }

        dimmer.style.display = 'none';
        
        const rect = targetEl.getBoundingClientRect();
        const tooltipWidth = 380;
        const tooltipHeight = 260;
        
        let top = 0;
        let left = 0;
        
        if (stepData.position === 'right') {
            top = rect.top + (rect.height / 2) - (tooltipHeight / 2);
            left = rect.right + 18;
            if (left + tooltipWidth > window.innerWidth) {
                left = rect.left - tooltipWidth - 18;
            }
        } else if (stepData.position === 'left') {
            top = rect.top + (rect.height / 2) - (tooltipHeight / 2);
            left = rect.left - tooltipWidth - 18;
            if (left < 10) {
                left = rect.right + 18;
            }
        } else if (stepData.position === 'bottom') {
            top = rect.bottom + 18;
            left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
        } else {
            // top
            top = rect.top - tooltipHeight - 18;
            left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
        }
        
        // Window bounds clamping
        if (top < 15) top = 15;
        if (top + tooltipHeight > window.innerHeight) top = window.innerHeight - tooltipHeight - 20;
        if (left < 15) left = 15;
        if (left + tooltipWidth > window.innerWidth) left = window.innerWidth - tooltipWidth - 15;
        
        tooltipCard.style.top = `${top}px`;
        tooltipCard.style.left = `${left}px`;
        tooltipCard.style.transform = 'none';
        tooltipCard.style.position = 'fixed';
    }

    // 7. Render Step Function with Dynamic i18n
    function renderStep() {
        document.querySelectorAll('.tour-highlight-active').forEach(el => {
            el.classList.remove('tour-highlight-active');
        });

        const stepConfig = tourStepConfigs[currentStep];
        
        // Trigger subtle audio chime
        playChime('step');

        if (stepConfig.target) {
            const targetEl = document.querySelector(stepConfig.target);
            if (targetEl) {
                targetEl.classList.add('tour-highlight-active');
                targetEl.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' });
            }
        }

        const titleText = t(`guidedTour.${stepConfig.key}Title`);
        const badgeText = t(`guidedTour.${stepConfig.key}Badge`);
        const contentText = t(`guidedTour.${stepConfig.key}Content`);
        const progressPercentage = Math.round(((currentStep + 1) / tourStepConfigs.length) * 100);

        const dotsHtml = tourStepConfigs.map((_, i) => 
            `<div class="tour-progress-dot ${i === currentStep ? 'active' : ''}"></div>`
        ).join('');

        const prevLabel = t('guidedTour.prevStep', 'Previous');
        const nextLabel = currentStep === tourStepConfigs.length - 1 
            ? t('guidedTour.finishTour', 'Get Started 🎉') 
            : t('guidedTour.nextStep', 'Next');

        tooltipCard.innerHTML = `
            <div class="tour-progress-bar-container">
                <div class="tour-progress-bar-fill" style="width: ${progressPercentage}%;"></div>
            </div>

            <div class="d-flex justify-content-between align-items-center mb-2.5">
                <span class="badge rounded-pill bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 px-3 py-1 font-semibold text-xs border border-indigo-200 dark:border-indigo-800 d-inline-flex align-items-center gap-1.5 shadow-2xs">
                    <i class="bi ${stepConfig.icon}"></i>
                    <span>${badgeText} (${currentStep + 1}/${tourStepConfigs.length})</span>
                </span>
                <button type="button" class="btn-close text-xs p-1 m-0 shadow-none btn-close-tour-exit" aria-label="Close" title="${t('guidedTour.skipTour', 'Skip Tour')}"></button>
            </div>
            
            <h5 class="fw-bold mb-2 font-sans d-flex align-items-center gap-2" style="font-size: 15px; color: #4f46e5;">
                ${titleText}
            </h5>
            
            <p class="text-sm mb-3.5 lh-base text-slate-600 dark:text-slate-300" style="font-size: 0.82rem;">${contentText}</p>
            
            <div class="d-flex align-items-center justify-content-between mt-auto pt-2.5 border-top border-slate-100 dark:border-slate-800">
                <div class="d-flex gap-1 align-items-center">
                    ${dotsHtml}
                </div>
                <div class="d-flex gap-1.5 align-items-center">
                    ${currentStep > 0 ? `<button class="btn btn-sm btn-outline-secondary px-2.5 py-1 btn-tour-prev text-xs rounded-2">${prevLabel}</button>` : ''}
                    <button class="btn btn-sm btn-primary px-3 py-1 btn-tour-next fw-bold text-xs rounded-2 shadow-sm d-inline-flex align-items-center gap-1" style="background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); border: none;">
                        <span>${nextLabel}</span>
                        <i class="bi ${currentStep === tourStepConfigs.length - 1 ? 'bi-check-circle-fill' : 'bi-arrow-right-short'} fs-6"></i>
                    </button>
                </div>
            </div>
        `;

        tooltipCard.style.display = 'flex';
        
        // Re-trigger entrance animation
        tooltipCard.style.animation = 'none';
        void tooltipCard.offsetWidth; // Force reflow
        tooltipCard.style.animation = 'tourSpringEntry 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) forwards';

        setTimeout(() => {
            positionTooltip(stepConfig);
        }, 60);

        // Bind interactive event handlers
        tooltipCard.querySelector('.btn-close-tour-exit')?.addEventListener('click', () => endTour(false));
        tooltipCard.querySelector('.btn-tour-next')?.addEventListener('click', () => {
            if (currentStep < tourStepConfigs.length - 1) {
                currentStep++;
                renderStep();
            } else {
                endTour(true);
            }
        });
        
        const prevBtn = tooltipCard.querySelector('.btn-tour-prev');
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (currentStep > 0) {
                    currentStep--;
                    renderStep();
                }
            });
        }
    }

    // 8. Start Tour
    function startTour() {
        currentStep = 0;
        document.body.classList.add('guided-tour-running');
        renderStep();
        
        window.addEventListener('resize', handleResize);
        window.addEventListener('keydown', handleKeydown);
    }

    // 9. End Tour with Confetti & Celebration
    function endTour(completed = false) {
        document.body.classList.remove('guided-tour-running');
        
        document.querySelectorAll('.tour-highlight-active').forEach(el => {
            el.classList.remove('tour-highlight-active');
        });
        
        dimmer.style.display = 'none';
        tooltipCard.style.display = 'none';
        
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('keydown', handleKeydown);
        
        if (completed) {
            playChime('complete');
            launchConfettiBurst();
            showMessage(t('guidedTour.tourCompletedToast', '🎉 Guided tour completed! Welcome to Vedra BI.'), "success");
        }
    }

    function handleResize() {
        if (tooltipCard.style.display === 'flex') {
            positionTooltip(tourStepConfigs[currentStep]);
        }
    }

    function handleKeydown(e) {
        if (e.key === 'Escape') {
            endTour(false);
        } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
            if (currentStep < tourStepConfigs.length - 1) {
                currentStep++;
                renderStep();
            } else {
                endTour(true);
            }
        } else if (e.key === 'ArrowLeft') {
            if (currentStep > 0) {
                currentStep--;
                renderStep();
            }
        }
    }

    // Attach trigger to quick tour button in navbar
    document.getElementById('btnQuickTour')?.addEventListener('click', () => {
        startTour();
    });

    // React to Language Changes
    onLanguageChange(() => {
        if (tooltipCard && tooltipCard.style.display === 'flex') {
            renderStep();
        }
    });

    // Make globally accessible
    window.startDashboardGuidedTour = startTour;
}
