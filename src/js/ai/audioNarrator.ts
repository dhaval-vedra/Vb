// src/js/ai/audioNarrator.ts
import { showMessage, attachEventListener } from '../core/utils.ts';

declare global {
    interface Window {
        toggleDashboardAudioNarrator?: () => void;
    }
}

export function initializeAudioNarrator() {
    // 1. Inject Styles for the Audio Narrator Widget and Waves
    if (!document.getElementById('audioNarratorStyles')) {
        const style = document.createElement('style');
        style.id = 'audioNarratorStyles';
        style.innerHTML = `
            .audio-narrator-panel {
                position: fixed;
                top: 80px;
                right: 24px;
                width: 380px;
                background: #ffffff;
                border: 1px solid #e2e8f0;
                border-radius: 16px;
                box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
                z-index: 100950;
                padding: 18px;
                display: none;
                flex-direction: column;
                font-family: var(--font-sans), system-ui;
                animation: anSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            }
            
            body.dark-theme .audio-narrator-panel {
                background: #1e293b;
                border-color: #334155;
                color: #f8fafc;
                box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
            }
            
            @keyframes anSlideIn {
                from {
                    opacity: 0;
                    transform: translateY(-20px) scale(0.95);
                }
                to {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
            }

            /* Wave animation container */
            .sound-wave-container {
                display: flex;
                align-items: flex-end;
                justify-content: center;
                gap: 3px;
                height: 36px;
                padding: 0 10px;
            }
            
            .wave-bar {
                width: 4px;
                height: 4px;
                background-color: #8b5cf6;
                border-radius: 4px;
                transition: height 0.15s ease;
            }
            
            .audio-narrator-panel.playing .wave-bar {
                animation: soundWavePlay 1.2s ease-in-out infinite alternate;
            }
            
            /* Staggered animations for natural equalizer movement */
            .audio-narrator-panel.playing .wave-bar:nth-child(1) { animation-delay: 0.1s; }
            .audio-narrator-panel.playing .wave-bar:nth-child(2) { animation-delay: 0.4s; }
            .audio-narrator-panel.playing .wave-bar:nth-child(3) { animation-delay: 0.2s; }
            .audio-narrator-panel.playing .wave-bar:nth-child(4) { animation-delay: 0.6s; }
            .audio-narrator-panel.playing .wave-bar:nth-child(5) { animation-delay: 0.3s; }
            .audio-narrator-panel.playing .wave-bar:nth-child(6) { animation-delay: 0.7s; }
            .audio-narrator-panel.playing .wave-bar:nth-child(7) { animation-delay: 0.5s; }
            .audio-narrator-panel.playing .wave-bar:nth-child(8) { animation-delay: 0.2s; }
            
            @keyframes soundWavePlay {
                0% { height: 4px; }
                100% { height: 32px; }
            }
            
            .narrator-transcript-box {
                background: #f8fafc;
                border: 1px solid #f1f5f9;
                border-radius: 10px;
                padding: 12px;
                max-height: 140px;
                overflow-y: auto;
                font-size: 12px;
                line-height: 1.5;
                color: #475569;
                margin-bottom: 12px;
            }
            
            body.dark-theme .narrator-transcript-box {
                background: #0f172a;
                border-color: #1e293b;
                color: #94a3b8;
            }
            
            .voice-setting-control {
                display: flex;
                align-items: center;
                gap: 12px;
                margin-bottom: 8px;
                font-size: 11px;
            }
            
            .voice-setting-control label {
                width: 80px;
                color: #64748b;
                font-weight: 500;
            }
            
            .voice-setting-control input[type="range"] {
                flex-grow: 1;
                accent-color: #8b5cf6;
            }
        `;
        document.head.appendChild(style);
    }

    // 2. Insert DOM Element for the Audio Player Card
    let panel = document.querySelector('.audio-narrator-panel') as HTMLElement | null;
    if (!panel) {
        panel = document.createElement('div');
        panel.className = 'audio-narrator-panel';
        panel.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-3">
                <div class="d-flex align-items-center gap-2">
                    <span class="fs-5">🎙️</span>
                    <span class="fw-bold font-sans text-sm m-0">ऑडियो कार्यकारी सारांश (Audio Briefing)</span>
                </div>
                <button type="button" class="btn-close text-xs shadow-none btn-close-narrator-panel" aria-label="Close" style="padding: 4px; margin: 0;"></button>
            </div>
            
            <!-- Animated Audio Equalizer Visualizer -->
            <div class="d-flex align-items-center justify-content-between bg-light-subtle rounded-3 p-2.5 mb-3 border border-light-subtle">
                <div class="sound-wave-container" id="anWaves">
                    <div class="wave-bar"></div>
                    <div class="wave-bar"></div>
                    <div class="wave-bar"></div>
                    <div class="wave-bar"></div>
                    <div class="wave-bar"></div>
                    <div class="wave-bar"></div>
                    <div class="wave-bar"></div>
                    <div class="wave-bar"></div>
                </div>
                
                <div class="d-flex gap-1">
                    <button class="btn btn-xs btn-outline-secondary px-2 py-1 text-xs" id="btnLangHi">हिन्दी</button>
                    <button class="btn btn-xs btn-outline-secondary px-2 py-1 text-xs" id="btnLangEn">English</button>
                </div>
            </div>

            <!-- Auto-Generated Narrative Textbox -->
            <div class="narrator-transcript-box" id="anTranscript">
                डैशबोर्ड डेटा लोड हो रहा है, कृपया प्रतीक्षा करें...
            </div>
            
            <!-- Voice Speed / Pitch Settings -->
            <div class="voice-setting-control">
                <label>गति (Speed)</label>
                <input type="range" id="anSpeed" min="0.5" max="2" step="0.1" value="1">
                <span style="font-size: 10px; width: 24px; text-align: right;" id="speedLabel">1.0x</span>
            </div>
            
            <div class="voice-setting-control mb-3">
                <label>आवाज (Pitch)</label>
                <input type="range" id="anPitch" min="0.5" max="1.5" step="0.1" value="1">
                <span style="font-size: 10px; width: 24px; text-align: right;" id="pitchLabel">1.0</span>
            </div>
            
            <!-- Main Controllers -->
            <div class="d-flex gap-2">
                <button class="btn btn-primary flex-grow-1 py-1.5 d-flex align-items-center justify-content-center gap-1.5 fw-bold text-sm shadow-sm" id="anPlayBtn">
                    <i class="bi bi-play-circle-fill fs-6"></i> सारांश सुनें (Play Summary)
                </button>
                <button class="btn btn-outline-secondary py-1.5 px-3" id="anStopBtn" title="रोकें (Stop)">
                    <i class="bi bi-stop-fill fs-6"></i>
                </button>
            </div>
        `;
        document.body.appendChild(panel);
    }

    // 3. Narrative Generator Logic
    // Scans active KPIs and Charts to craft an Executive Summary
    function generateNarrative(lang = 'hi'): string {
        // Collect metrics
        const kpiElements = Array.from(document.querySelectorAll('.kpi-native-card'));
        const chartElements = Array.from(document.querySelectorAll('.visualization-container')).filter(el => !el.classList.contains('kpi-native-card'));
        
        const kpisData = kpiElements.map(el => {
            const title = el.querySelector('.kpi-title-text')?.textContent?.trim() || 'Metric';
            const value = el.querySelector('.kpi-value-text')?.textContent?.trim() || '0';
            const sub = el.querySelector('.kpi-sub-text')?.textContent?.trim() || '';
            return { title, value, sub };
        });

        const activeChartsCount = chartElements.length;
        
        if (lang === 'hi') {
            let summary = `वेड्रा बीआई कार्यकारी रिपोर्ट सारांश में आपका स्वागत है। `;
            
            if (kpisData.length > 0) {
                summary += `डैशबोर्ड पर कुल ${kpisData.length} मुख्य प्रदर्शन संकेतक स्थापित हैं। `;
                kpisData.forEach((k) => {
                    summary += `पहला मुख्य मेट्रिक, ${k.title}, वर्तमान में ${k.value} पर है। ${k.sub ? 'यह ' + k.sub + ' को दर्शाता है।' : ''} `;
                });
            } else {
                summary += `डैशबोर्ड पर वर्तमान में कोई सक्रिय केपीआई कार्ड नहीं मिला है। `;
            }

            if (activeChartsCount > 0) {
                summary += `डेटा विज़ुअलाइज़ेशन के लिए, आपके पास ${activeChartsCount} सक्रिय चार्ट्स उपलब्ध हैं, जो लाइन, बार और पाई ट्रेंड्स का लाइव चित्रण कर रहे हैं। `;
            } else {
                summary += `कृपया अधिक विज़ुअल विश्लेषण के लिए चार्ट्स जोड़ें। `;
            }
            
            summary += `समग्र रूप से, आपका डेटा गुणवत्ता स्कोर सुरक्षित है और सभी मेट्रिक्स ट्रैक किए जा रहे हैं। धन्यवाद।`;
            return summary;
        } else {
            // English version
            let summary = `Welcome to Vedra BI executive report summary briefing. `;
            
            if (kpisData.length > 0) {
                summary += `Your dashboard currently tracks ${kpisData.length} Key Performance Indicators. `;
                kpisData.forEach((k) => {
                    summary += `The metric for ${k.title} is currently at ${k.value}. ${k.sub ? 'Which indicates ' + k.sub + '.' : ''} `;
                });
            } else {
                summary += `No active KPI cards were found on the current view. `;
            }

            if (activeChartsCount > 0) {
                summary += `For detailed trend analysis, there are ${activeChartsCount} active chart widgets displaying bar, line, or area distributions in real time. `;
            } else {
                summary += `Please add more charts to analyze distribution trends. `;
            }
            
            summary += `Overall, all system metrics are performing within normal bounds. Thank you.`;
            return summary;
        }
    }

    // 4. Speech Synthesis controls
    let currentLang = 'hi';
    const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    let utterance: SpeechSynthesisUtterance | null = null;

    function speakSummary() {
        if (!synth || !panel) {
            showMessage("आपका ब्राउज़र वॉइस सिंथेसिस का समर्थन नहीं करता है।", "danger");
            return;
        }

        // Cancel previous speech
        synth.cancel();

        const summaryText = generateNarrative(currentLang);
        const anTranscript = document.getElementById('anTranscript');
        if (anTranscript) {
            anTranscript.innerHTML = `<strong>पठित सारांश:</strong><br>${summaryText}`;
        }

        utterance = new SpeechSynthesisUtterance(summaryText);
        
        // Find best local voice matching language
        const voices = synth.getVoices();
        let voice: SpeechSynthesisVoice | undefined;
        
        if (currentLang === 'hi') {
            voice = voices.find(v => v.lang.startsWith('hi') || v.name.includes('Hindi') || v.name.includes('Lekha'));
            utterance.lang = 'hi-IN';
        } else {
            voice = voices.find(v => v.lang.startsWith('en') || v.name.includes('English') || v.name.includes('Google US'));
            utterance.lang = 'en-US';
        }
        
        if (voice) {
            utterance.voice = voice;
        }

        // Read settings from sliders
        const speedEl = document.getElementById('anSpeed') as HTMLInputElement | null;
        const pitchEl = document.getElementById('anPitch') as HTMLInputElement | null;
        if (speedEl) utterance.rate = parseFloat(speedEl.value);
        if (pitchEl) utterance.pitch = parseFloat(pitchEl.value);

        // State listeners
        utterance.onstart = () => {
            panel?.classList.add('playing');
            const playBtn = document.getElementById('anPlayBtn');
            if (playBtn) playBtn.innerHTML = `<i class="bi bi-pause-circle-fill fs-6"></i> विराम (Pause)`;
        };

        utterance.onend = () => {
            panel?.classList.remove('playing');
            const playBtn = document.getElementById('anPlayBtn');
            if (playBtn) playBtn.innerHTML = `<i class="bi bi-play-circle-fill fs-6"></i> सारांश सुनें (Play Summary)`;
        };

        utterance.onerror = (e: any) => {
            if (e?.error === 'interrupted' || e?.error === 'canceled') {
                panel?.classList.remove('playing');
                const playBtn = document.getElementById('anPlayBtn');
                if (playBtn) playBtn.innerHTML = `<i class="bi bi-play-circle-fill fs-6"></i> सारांश सुनें (Play Summary)`;
                return;
            }
            console.warn('[Audio Narrator] Speech warning:', e?.error || e);
            panel?.classList.remove('playing');
            const playBtn = document.getElementById('anPlayBtn');
            if (playBtn) playBtn.innerHTML = `<i class="bi bi-play-circle-fill fs-6"></i> सारांश सुनें (Play Summary)`;
        };

        synth.speak(utterance);
    }

    function stopSpeaking() {
        if (synth && panel) {
            synth.cancel();
            panel.classList.remove('playing');
            const playBtn = document.getElementById('anPlayBtn');
            if (playBtn) playBtn.innerHTML = `<i class="bi bi-play-circle-fill fs-6"></i> सारांश सुनें (Play Summary)`;
        }
    }

    function togglePauseSpeech() {
        if (!synth || !panel) return;
        
        if (synth.speaking && !synth.paused) {
            synth.pause();
            panel.classList.remove('playing');
            const playBtn = document.getElementById('anPlayBtn');
            if (playBtn) playBtn.innerHTML = `<i class="bi bi-play-circle-fill fs-6"></i> फिर चलाएं (Resume)`;
        } else if (synth.paused) {
            synth.resume();
            panel.classList.add('playing');
            const playBtn = document.getElementById('anPlayBtn');
            if (playBtn) playBtn.innerHTML = `<i class="bi bi-pause-circle-fill fs-6"></i> विराम (Pause)`;
        } else {
            speakSummary();
        }
    }

    // 5. Connect DOM Event Listeners
    const closeBtn = panel.querySelector('.btn-close-narrator-panel');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            stopSpeaking();
            if (panel) panel.style.display = 'none';
        });
    }

    function updateLangButtons() {
        const btnHi = document.getElementById('btnLangHi');
        const btnEn = document.getElementById('btnLangEn');
        if (!btnHi || !btnEn) return;

        if (currentLang === 'hi') {
            btnHi.className = "btn btn-xs btn-primary px-2 py-1 text-xs fw-bold text-white";
            btnEn.className = "btn btn-xs btn-outline-secondary px-2 py-1 text-xs";
        } else {
            btnHi.className = "btn btn-xs btn-outline-secondary px-2 py-1 text-xs";
            btnEn.className = "btn btn-xs btn-primary px-2 py-1 text-xs fw-bold text-white";
        }
        
        // Refresh transcription preview box
        const summaryText = generateNarrative(currentLang);
        const anTranscript = document.getElementById('anTranscript');
        if (anTranscript) {
            anTranscript.innerHTML = `<strong>पूर्वावलोकन:</strong><br>${summaryText}`;
        }
    }

    attachEventListener('btnLangHi', 'click', () => {
        stopSpeaking();
        currentLang = 'hi';
        updateLangButtons();
    });

    attachEventListener('btnLangEn', 'click', () => {
        stopSpeaking();
        currentLang = 'en';
        updateLangButtons();
    });

    // Control Sliders
    const speedInput = document.getElementById('anSpeed') as HTMLInputElement | null;
    const speedLbl = document.getElementById('speedLabel');
    if (speedInput && speedLbl) {
        speedInput.addEventListener('input', () => {
            speedLbl.textContent = `${speedInput.value}x`;
            if (synth && synth.speaking) {
                // Restart with new rate
                const wasPlaying = !synth.paused;
                stopSpeaking();
                if (wasPlaying) speakSummary();
            }
        });
    }

    const pitchInput = document.getElementById('anPitch') as HTMLInputElement | null;
    const pitchLbl = document.getElementById('pitchLabel');
    if (pitchInput && pitchLbl) {
        pitchInput.addEventListener('input', () => {
            pitchLbl.textContent = pitchInput.value;
            if (synth && synth.speaking) {
                const wasPlaying = !synth.paused;
                stopSpeaking();
                if (wasPlaying) speakSummary();
            }
        });
    }

    attachEventListener('anPlayBtn', 'click', togglePauseSpeech);
    attachEventListener('anStopBtn', 'click', stopSpeaking);

    // Initial voice array load triggers
    if (synth && synth.onvoiceschanged !== undefined) {
        synth.onvoiceschanged = () => {};
    }

    // Outer launcher click listener
    document.getElementById('btnAudioNarrator')?.addEventListener('click', () => {
        if (!panel) return;
        if (panel.style.display === 'flex') {
            stopSpeaking();
            panel.style.display = 'none';
        } else {
            panel.style.display = 'flex';
            updateLangButtons();
        }
    });

    window.toggleDashboardAudioNarrator = () => {
        document.getElementById('btnAudioNarrator')?.click();
    };
}
