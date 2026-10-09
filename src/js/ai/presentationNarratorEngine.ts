// src/js/ai/presentationNarratorEngine.ts
/**
 * Vedra BI - Presentation Kiosk Narrator Mode Engine
 * Reads generated slide summaries aloud using the browser's SpeechSynthesis API
 * with synchronized real-time UI highlight, audio equalizers, voice selection,
 * and executive pacing.
 */

import { SlideAiSummary } from './presentationAiSummaryEngine.ts';
import { showMessage } from '../core/utils.ts';

export interface NarratorConfig {
    enabled: boolean;
    voiceURI: string;
    rate: number;         // 0.6 to 2.0 (default 1.0)
    pitch: number;        // 0.8 to 1.3 (default 1.0)
    volume: number;       // 0.0 to 1.0 (default 1.0)
    highlightSection: boolean;
    autoAdvanceOnEnd: boolean;
}

const STORAGE_KEY = 'vedra_pres_narrator_config_v1';

// Default configuration
let narratorConfig: NarratorConfig = {
    enabled: false,
    voiceURI: '',
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0,
    highlightSection: true,
    autoAdvanceOnEnd: true
};

// Runtime playback state
let isNarratorSpeaking = false;
let isNarratorPaused = false;
let currentUtterance: SpeechSynthesisUtterance | null = null;
let currentSlideSummary: SlideAiSummary | null = null;
let onNarrationCompleteCallback: (() => void) | null = null;
let keepAliveTimer: any = null;

// Speech queue for active slide sections
interface SpokenSection {
    id: string;
    domId: string;
    text: string;
}
let currentSections: SpokenSection[] = [];
let currentSectionIdx = -1;

// Cached browser voices
let availableVoices: SpeechSynthesisVoice[] = [];

/**
 * Load saved configuration from localStorage
 */
export function loadNarratorConfig(): void {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            narratorConfig = { ...narratorConfig, ...parsed };
        }
    } catch {
        // use defaults
    }
}

/**
 * Save configuration to localStorage
 */
export function saveNarratorConfig(): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(narratorConfig));
    } catch {
        // ignore
    }
}

/**
 * Initialize SpeechSynthesis and load system voices
 */
export function initNarratorEngine(): void {
    loadNarratorConfig();

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        return;
    }

    const loadVoices = () => {
        availableVoices = window.speechSynthesis.getVoices();
        // If no preferred voice is set yet, auto-select the best English executive voice
        if (!narratorConfig.voiceURI || !availableVoices.some(v => v.voiceURI === narratorConfig.voiceURI)) {
            const preferred = findBestExecutiveVoice(availableVoices);
            if (preferred) {
                narratorConfig.voiceURI = preferred.voiceURI;
                saveNarratorConfig();
            }
        }
    };

    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
    }
}

/**
 * Select the highest quality executive voice available
 */
function findBestExecutiveVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
    if (!voices || voices.length === 0) return null;

    // Prioritize natural / neural / premium English voices
    const keywords = ['natural', 'google', 'neural', 'premium', 'samantha', 'daniel', 'karen', 'serena', 'oliver', 'microsoft'];
    
    // 1. English voices matching top keywords
    for (const kw of keywords) {
        const found = voices.find(v => v.lang.startsWith('en') && v.name.toLowerCase().includes(kw));
        if (found) return found;
    }

    // 2. Any English voice
    const enVoice = voices.find(v => v.lang.startsWith('en'));
    if (enVoice) return enVoice;

    // 3. Default voice
    const defaultVoice = voices.find(v => v.default);
    if (defaultVoice) return defaultVoice;

    return voices[0] || null;
}

export function getAvailableVoices(): SpeechSynthesisVoice[] {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && availableVoices.length === 0) {
        availableVoices = window.speechSynthesis.getVoices();
    }
    return availableVoices;
}

export function getNarratorConfig(): NarratorConfig {
    return { ...narratorConfig };
}

export function isNarratorEnabled(): boolean {
    return narratorConfig.enabled;
}

export function isSpeaking(): boolean {
    return isNarratorSpeaking;
}

export function isPaused(): boolean {
    return isNarratorPaused;
}

export function setNarratorEnabled(enabled: boolean): void {
    narratorConfig.enabled = enabled;
    saveNarratorConfig();
    updateNarratorUIState();
}

export function toggleNarrator(forceState?: boolean): boolean {
    if (forceState !== undefined) {
        narratorConfig.enabled = forceState;
    } else {
        narratorConfig.enabled = !narratorConfig.enabled;
    }
    saveNarratorConfig();
    updateNarratorUIState();

    if (!narratorConfig.enabled) {
        stopNarrator();
        showMessage('Narrator Mode: Disabled', 'info');
    } else {
        showMessage('Narrator Mode: Active - AI reading slide summaries aloud', 'info');
    }
    return narratorConfig.enabled;
}

export function updateNarratorSettings(partial: Partial<NarratorConfig>): void {
    narratorConfig = { ...narratorConfig, ...partial };
    saveNarratorConfig();
    updateNarratorUIState();
}

/**
 * Builds clean spoken sections for the active slide
 */
function buildSpokenSections(summary: SlideAiSummary): SpokenSection[] {
    const sections: SpokenSection[] = [];

    // 1. Headline & Slide Title
    const cleanHeadline = summary.headline.replace(/\*\*/g, '').trim();
    sections.push({
        id: 'headline',
        domId: 'presNarratorHeadline',
        text: `Slide ${summary.slideIndex} of ${summary.totalSlides}. ${summary.title}. ${cleanHeadline}.`
    });

    // 2. Metric Chips (if any)
    if (summary.metricChips && summary.metricChips.length > 0) {
        const metricPhrases = summary.metricChips.map(chip => {
            const trendDesc = chip.trend === 'up' ? 'trending upward' : (chip.trend === 'down' ? 'trending downward' : '');
            return `${chip.label} is ${chip.value} ${trendDesc}`.trim();
        });
        sections.push({
            id: 'chips',
            domId: 'presNarratorChips',
            text: `Key metrics: ${metricPhrases.join('. ')}.`
        });
    }

    // 3. Key Insights (one section per insight for fine-grained highlighting)
    if (summary.keyInsights && summary.keyInsights.length > 0) {
        summary.keyInsights.forEach((insight, idx) => {
            const cleanText = insight.replace(/\*\*/g, '').trim();
            sections.push({
                id: `insight_${idx}`,
                domId: `presNarratorInsight_${idx}`,
                text: cleanText
            });
        });
    }

    // 4. Action Recommendation
    if (summary.actionItem) {
        const cleanAction = summary.actionItem.replace(/\*\*/g, '').trim();
        sections.push({
            id: 'action',
            domId: 'presNarratorAction',
            text: `Executive recommendation: ${cleanAction}`
        });
    }

    return sections;
}

/**
 * Reads the active slide aloud with sequential section highlighting
 */
export function narrateSlide(
    summary: SlideAiSummary,
    onComplete?: () => void,
    speedMultiplier: number = 1.0
): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        if (onComplete) onComplete();
        return;
    }

    // Stop any in-progress narration
    stopNarrator();

    if (!narratorConfig.enabled) {
        return;
    }

    currentSlideSummary = summary;
    onNarrationCompleteCallback = onComplete || null;
    currentSections = buildSpokenSections(summary);
    currentSectionIdx = 0;
    isNarratorSpeaking = true;
    isNarratorPaused = false;

    updateNarratorUIState();
    startKeepAlive();

    // Start speaking first section
    speakNextSection(speedMultiplier);
}

/**
 * Sequential speaker: speaks current section, highlights DOM element, then moves to next
 */
function speakNextSection(speedMultiplier: number = 1.0): void {
    if (!isNarratorSpeaking || currentSectionIdx >= currentSections.length) {
        finishNarration();
        return;
    }

    const section = currentSections[currentSectionIdx];
    if (!section || !section.text) {
        currentSectionIdx++;
        speakNextSection(speedMultiplier);
        return;
    }

    // Highlight active section in UI
    highlightSectionInUI(section.domId);

    const utterance = new SpeechSynthesisUtterance(section.text);
    currentUtterance = utterance;

    // Resolve voice
    const voices = getAvailableVoices();
    let voiceToUse: SpeechSynthesisVoice | null = null;
    if (narratorConfig.voiceURI) {
        voiceToUse = voices.find(v => v.voiceURI === narratorConfig.voiceURI) || null;
    }
    if (!voiceToUse) {
        voiceToUse = findBestExecutiveVoice(voices);
    }
    if (voiceToUse) {
        utterance.voice = voiceToUse;
        utterance.lang = voiceToUse.lang || 'en-US';
    }

    // Speed calculation: Combine user's narrator rate and presentation speed multiplier
    const effectiveRate = Math.max(0.6, Math.min(2.0, (narratorConfig.rate || 1.0) * (speedMultiplier || 1.0)));
    utterance.rate = effectiveRate;
    utterance.pitch = Math.max(0.8, Math.min(1.3, narratorConfig.pitch || 1.0));
    utterance.volume = Math.max(0.0, Math.min(1.0, narratorConfig.volume ?? 1.0));

    let isDone = false;
    const onSectionDone = () => {
        if (isDone) return;
        isDone = true;
        currentSectionIdx++;
        if (isNarratorSpeaking) {
            // Small natural breathing pause between sections
            setTimeout(() => {
                speakNextSection(speedMultiplier);
            }, 120);
        }
    };

    utterance.onend = onSectionDone;
    utterance.onerror = (e) => {
        // Ignore interrupted or canceled errors (they occur on slide transitions)
        if (e.error !== 'interrupted' && e.error !== 'canceled') {
            console.warn('[Narrator] Utterance error:', e.error);
        }
        onSectionDone();
    };

    try {
        window.speechSynthesis.speak(utterance);
    } catch {
        onSectionDone();
    }
}

function finishNarration(): void {
    clearSectionHighlights();
    stopKeepAlive();
    isNarratorSpeaking = false;
    isNarratorPaused = false;
    currentUtterance = null;
    updateNarratorUIState();

    if (onNarrationCompleteCallback) {
        const cb = onNarrationCompleteCallback;
        onNarrationCompleteCallback = null;
        cb();
    }
}

/**
 * Highlight a section in the AI Briefing panel
 */
function highlightSectionInUI(domId: string): void {
    if (!narratorConfig.highlightSection) return;

    clearSectionHighlights();

    const target = document.getElementById(domId);
    if (target) {
        target.classList.add('pres-narrator-speaking-active');
        // Auto scroll into view inside the briefing container smoothly if needed
        const scrollParent = target.closest('.pres-summary-scroll') as HTMLElement;
        if (scrollParent) {
            const targetOffsetTop = target.offsetTop;
            const parentHeight = scrollParent.clientHeight;
            if (targetOffsetTop > parentHeight - 60 || targetOffsetTop < scrollParent.scrollTop) {
                scrollParent.scrollTo({
                    top: Math.max(0, targetOffsetTop - 40),
                    behavior: 'smooth'
                });
            }
        }
    }
}

/**
 * Remove highlight classes from all briefing sections
 */
function clearSectionHighlights(): void {
    document.querySelectorAll('.pres-narrator-speaking-active').forEach(el => {
        el.classList.remove('pres-narrator-speaking-active');
    });
}

/**
 * Pause speech synthesis
 */
export function pauseNarrator(): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (isNarratorSpeaking && !isNarratorPaused) {
        isNarratorPaused = true;
        try {
            window.speechSynthesis.pause();
        } catch {
            // ignore
        }
        updateNarratorUIState();
    }
}

/**
 * Resume speech synthesis
 */
export function resumeNarrator(): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (isNarratorSpeaking && isNarratorPaused) {
        isNarratorPaused = false;
        try {
            window.speechSynthesis.resume();
        } catch {
            // ignore
        }
        updateNarratorUIState();
    }
}

/**
 * Stop narration completely and cancel browser speech queue
 */
export function stopNarrator(): void {
    stopKeepAlive();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
            window.speechSynthesis.cancel();
        } catch {
            // ignore
        }
    }
    isNarratorSpeaking = false;
    isNarratorPaused = false;
    currentUtterance = null;
    clearSectionHighlights();
    updateNarratorUIState();
}

/**
 * Replay the active slide's narration from the beginning
 */
export function replayCurrentSlide(speedMultiplier: number = 1.0): void {
    if (!currentSlideSummary) return;
    const wasEnabled = narratorConfig.enabled;
    narratorConfig.enabled = true;
    saveNarratorConfig();
    updateNarratorUIState();

    narrateSlide(currentSlideSummary, onNarrationCompleteCallback || undefined, speedMultiplier);
    if (!wasEnabled) {
        showMessage('Narrator Mode: Started reading active slide', 'info');
    }
}

/**
 * Chrome keep-alive heartbeat: Prevents Chrome from dropping SpeechSynthesisUtterance after 15 seconds
 */
function startKeepAlive(): void {
    stopKeepAlive();
    keepAliveTimer = setInterval(() => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            if (isNarratorSpeaking && !isNarratorPaused && window.speechSynthesis.speaking) {
                window.speechSynthesis.pause();
                window.speechSynthesis.resume();
            }
        }
    }, 10000);
}

function stopKeepAlive(): void {
    if (keepAliveTimer) {
        clearInterval(keepAliveTimer);
        keepAliveTimer = null;
    }
}

/**
 * Test/preview selected voice with a short executive sample phrase
 */
export function testVoice(sampleText?: string): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        showMessage('Speech Synthesis is not supported in this browser', 'warning');
        return;
    }

    window.speechSynthesis.cancel();
    const text = sampleText || 'Welcome to Vedra Executive Presentation. This voice will narrate your dashboard takeaways with precision.';
    const utterance = new SpeechSynthesisUtterance(text);

    const voices = getAvailableVoices();
    let voiceToUse: SpeechSynthesisVoice | null = null;
    if (narratorConfig.voiceURI) {
        voiceToUse = voices.find(v => v.voiceURI === narratorConfig.voiceURI) || null;
    }
    if (!voiceToUse) voiceToUse = findBestExecutiveVoice(voices);

    if (voiceToUse) {
        utterance.voice = voiceToUse;
        utterance.lang = voiceToUse.lang || 'en-US';
    }
    utterance.rate = narratorConfig.rate || 1.0;
    utterance.pitch = narratorConfig.pitch || 1.0;
    utterance.volume = narratorConfig.volume ?? 1.0;

    showMessage(`Previewing Voice: ${voiceToUse ? voiceToUse.name : 'System Default'}`, 'info');
    window.speechSynthesis.speak(utterance);
}

/**
 * Synchronize UI elements across the presentation overlay
 */
export function updateNarratorUIState(): void {
    // 1. Toolbar Button
    const btn = document.getElementById('kioskBtnVoice');
    if (btn) {
        const icon = btn.querySelector('i');
        if (narratorConfig.enabled) {
            btn.classList.add('active', 'btn-primary');
            btn.classList.remove('btn-outline-secondary');
            if (isNarratorSpeaking) {
                btn.classList.add('narrator-speaking');
                if (icon) icon.className = 'bi bi-soundwave';
            } else {
                btn.classList.remove('narrator-speaking');
                if (icon) icon.className = 'bi bi-volume-up-fill';
            }
        } else {
            btn.classList.remove('active', 'btn-primary', 'narrator-speaking');
            btn.classList.add('btn-outline-secondary');
            if (icon) icon.className = 'bi bi-volume-mute';
        }
    }

    // 2. Briefing Panel Status Badge
    const liveBadges = document.querySelectorAll('.kiosk-narrator-live-badge');
    liveBadges.forEach(badge => {
        if (narratorConfig.enabled) {
            badge.classList.remove('d-none');
            badge.classList.add('d-flex');
            const bars = badge.querySelector('.kiosk-equalizer-bars');
            if (bars) {
                (bars as HTMLElement).style.opacity = isNarratorSpeaking ? '1' : '0.4';
            }
        } else {
            badge.classList.remove('d-flex');
            badge.classList.add('d-none');
        }
    });

    // 3. Settings Modal Toggle Switch
    const toggleInput = document.getElementById('kioskNarratorToggle') as HTMLInputElement;
    if (toggleInput) {
        toggleInput.checked = narratorConfig.enabled;
    }
}

/**
 * Renders the complete Narrator Mode configuration section inside Presentation Settings
 */
export function renderNarratorSettingsSectionHtml(): string {
    const voices = getAvailableVoices();
    const sortedVoices = [...voices].sort((a, b) => {
        // Put English voices first
        const aEn = a.lang.startsWith('en');
        const bEn = b.lang.startsWith('en');
        if (aEn && !bEn) return -1;
        if (!aEn && bEn) return 1;
        return a.name.localeCompare(b.name);
    });

    const voiceOptions = sortedVoices.map(v => {
        const isSelected = v.voiceURI === narratorConfig.voiceURI;
        const langTag = v.lang ? `[${v.lang}] ` : '';
        return `<option value="${v.voiceURI}" ${isSelected ? 'selected' : ''}>${langTag}${v.name}</option>`;
    }).join('');

    return `
        <!-- Narrator Mode Suite -->
        <div class="mb-3 pb-3 border-bottom border-slate-800">
            <div class="d-flex align-items-center justify-content-between p-2 mb-2.5 rounded bg-slate-900/80 border border-slate-800">
                <div style="font-size: 11.5px;">
                    <span class="d-block fw-semibold text-white d-flex align-items-center gap-1.5">
                        <i class="bi bi-soundwave text-indigo-400"></i> Narrator Mode
                    </span>
                    <span class="text-slate-400" style="font-size: 10px;">Reads slide summaries aloud during presentation</span>
                </div>
                <div class="form-check form-switch m-0">
                    <input class="form-check-input" type="checkbox" id="kioskNarratorToggle" ${narratorConfig.enabled ? 'checked' : ''} style="cursor: pointer;">
                </div>
            </div>

            <!-- Voice Selection -->
            <div class="mb-2.5">
                <div class="d-flex align-items-center justify-content-between mb-1">
                    <label class="text-slate-400 text-uppercase" style="font-size: 10px; font-weight: 600; letter-spacing: 0.05em;">AI Voice</label>
                    <button type="button" class="btn btn-link text-indigo-400 p-0 text-decoration-none" id="kioskBtnTestVoice" style="font-size: 10.5px;">
                        <i class="bi bi-play-circle me-1"></i>Test Voice
                    </button>
                </div>
                <select id="kioskNarratorVoiceSelect" class="form-select form-select-xs bg-slate-900 text-slate-200 border-slate-700" style="font-size: 11px;">
                    ${voiceOptions.length > 0 ? voiceOptions : '<option value="">Default System Voice</option>'}
                </select>
            </div>

            <!-- Pitch & Tone -->
            <div class="mb-2">
                <div class="d-flex align-items-center justify-content-between mb-1" style="font-size: 10.5px;">
                    <span class="text-slate-400">Voice Pitch</span>
                    <span id="kioskNarratorPitchDisplay" class="badge bg-slate-800 text-slate-300 font-monospace">${narratorConfig.pitch.toFixed(1)}x</span>
                </div>
                <input type="range" id="kioskNarratorPitchSlider" min="0.8" max="1.3" step="0.1" value="${narratorConfig.pitch}" class="form-range w-100" style="accent-color: #6366f1;">
            </div>

            <!-- Options (Highlight & Auto-Advance) -->
            <div class="d-flex flex-column gap-1.5 mt-2">
                <div class="form-check form-check-xs d-flex align-items-center justify-content-between p-0 m-0">
                    <label class="form-check-label text-slate-300" for="kioskNarratorHighlight" style="font-size: 11px;">
                        Synchronized Text Highlighting
                    </label>
                    <input class="form-check-input m-0" type="checkbox" id="kioskNarratorHighlight" ${narratorConfig.highlightSection ? 'checked' : ''} style="cursor: pointer;">
                </div>
                <div class="form-check form-check-xs d-flex align-items-center justify-content-between p-0 m-0">
                    <label class="form-check-label text-slate-300" for="kioskNarratorAutoAdvance" style="font-size: 11px;">
                        Auto-Advance upon Speech Completion
                    </label>
                    <input class="form-check-input m-0" type="checkbox" id="kioskNarratorAutoAdvance" ${narratorConfig.autoAdvanceOnEnd ? 'checked' : ''} style="cursor: pointer;">
                </div>
            </div>
        </div>
    `;
}

/**
 * Attaches event listeners for the Narrator settings controls
 */
export function attachNarratorSettingsListeners(
    container: HTMLElement,
    onSettingChanged?: () => void
): void {
    // Master toggle
    const toggle = container.querySelector('#kioskNarratorToggle') as HTMLInputElement;
    toggle?.addEventListener('change', (e) => {
        const checked = (e.target as HTMLInputElement).checked;
        toggleNarrator(checked);
        if (onSettingChanged) onSettingChanged();
    });

    // Voice selector
    const voiceSelect = container.querySelector('#kioskNarratorVoiceSelect') as HTMLSelectElement;
    voiceSelect?.addEventListener('change', (e) => {
        const uri = (e.target as HTMLSelectElement).value;
        updateNarratorSettings({ voiceURI: uri });
        if (onSettingChanged) onSettingChanged();
    });

    // Test voice
    const testBtn = container.querySelector('#kioskBtnTestVoice');
    testBtn?.addEventListener('click', () => {
        testVoice();
    });

    // Pitch slider
    const pitchSlider = container.querySelector('#kioskNarratorPitchSlider') as HTMLInputElement;
    const pitchDisplay = container.querySelector('#kioskNarratorPitchDisplay');
    pitchSlider?.addEventListener('input', (e) => {
        const val = parseFloat((e.target as HTMLInputElement).value);
        if (pitchDisplay) pitchDisplay.textContent = `${val.toFixed(1)}x`;
        updateNarratorSettings({ pitch: val });
        if (onSettingChanged) onSettingChanged();
    });

    // Highlight toggle
    const highlightCheck = container.querySelector('#kioskNarratorHighlight') as HTMLInputElement;
    highlightCheck?.addEventListener('change', (e) => {
        const checked = (e.target as HTMLInputElement).checked;
        updateNarratorSettings({ highlightSection: checked });
        if (onSettingChanged) onSettingChanged();
    });

    // Auto-advance toggle
    const autoAdvanceCheck = container.querySelector('#kioskNarratorAutoAdvance') as HTMLInputElement;
    autoAdvanceCheck?.addEventListener('change', (e) => {
        const checked = (e.target as HTMLInputElement).checked;
        updateNarratorSettings({ autoAdvanceOnEnd: checked });
        if (onSettingChanged) onSettingChanged();
    });
}
