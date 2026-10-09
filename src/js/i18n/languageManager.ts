// src/js/i18n/languageManager.ts
/**
 * Vedra BI Language Manager (i18n Engine)
 * Handles fast client-side translation, language switching, DOM reactivity,
 * persistent localStorage synchronization, and automatic whole-DOM translation.
 */

import { 
    TRANSLATIONS, 
    SUPPORTED_LANGUAGES, 
    LanguageCode, 
    LanguageInfo, 
    TranslationDictionary 
} from './translations.ts';

export const LANGUAGE_STORAGE_KEY = 'vedrabi_app_language';
export const ALT_LANGUAGE_STORAGE_KEY = 'language';
export const DEFAULT_LANGUAGE: LanguageCode = 'hi'; // Default language

export type Language = LanguageCode;
export type LanguageChangeListener = (newLang: LanguageCode) => void;

const listeners: Set<LanguageChangeListener> = new Set();
let currentLanguage: LanguageCode = DEFAULT_LANGUAGE;
let isInitialized = false;

declare global {
    interface Window {
        setAppLanguage?: (lang: LanguageCode) => void;
        getAppLanguage?: () => LanguageCode;
        t?: (key: string, fallback?: string) => string;
        translateDOM?: (root?: HTMLElement | Document) => void;
    }
}

/**
 * Universal phrase translation map for automated whole-DOM text node translation
 * Maps English, Hindi, and Gujarati terms interchangeably to ensure complete UI reactivity.
 */
interface PhraseEntry {
    en: string;
    hi: string;
    gu: string;
}

const UI_PHRASES: PhraseEntry[] = [
    // Navigation & Primary Headers
    { en: 'Data', hi: 'डेटा', gu: 'ડેટા' },
    { en: 'Charts', hi: 'चार्ट्स', gu: 'ચાર્ટ્સ' },
    { en: 'KPIs', hi: 'KPIs', gu: 'KPIs' },
    { en: 'Settings', hi: 'सेटिंग्स', gu: 'સેટિંગ્સ' },
    { en: 'Stats', hi: 'आंकड़े', gu: 'આંકડા' },
    { en: 'Actions', hi: 'क्रियाएं', gu: 'ક્રિયાઓ' },
    { en: 'Layouts', hi: 'लेआउट', gu: 'લેઆઉટ' },
    { en: 'Filters', hi: 'फिल्टर्स', gu: 'ફિલ્ટર્સ' },
    { en: 'Dashboard', hi: 'डैशबोर्ड', gu: 'ડેશબોર્ડ' },
    { en: 'Formatting', hi: 'फॉर्मेटिंग', gu: 'ફોર્મેટિંગ' },
    { en: 'Effects', hi: 'इफेक्ट्स', gu: 'ઇફેક્ટ્સ' },
    { en: 'Textbox', hi: 'टेक्स्टबॉक्स', gu: 'ટેક્સ્ટબોક્સ' },
    { en: 'Theme', hi: 'थीम', gu: 'થીમ' },
    { en: 'Profile', hi: 'प्रोफाइल', gu: 'પ્રોફાઇલ' },
    { en: 'Toggle', hi: 'टॉगल', gu: 'ટૉગલ' },

    // Small Menu Bar & Quick Actions
    { en: 'Snap Grid', hi: 'स्नैप ग्रिड', gu: 'સ્નેપ ગ્રીડ' },
    { en: 'Compare', hi: 'तुलना (Compare)', gu: 'સરખામણી (Compare)' },
    { en: 'Saved Views', hi: 'सेव्ड व्यूज', gu: 'સાચવેલા વ્યૂઝ' },
    { en: 'Auto Grid', hi: 'ऑटो ग्रिड', gu: 'ઓટો ગ્રીડ' },
    { en: 'Sampling', hi: 'डेटा सैंपलिंग (LTTB)', gu: 'ડેટા સેમ્પલિંગ (LTTB)' },
    { en: 'Slideshow', hi: 'स्लाइड शो', gu: 'સ્લાઇડશો' },
    { en: 'Audio Brief', hi: 'ऑडियो ब्रीफ', gu: 'ઓડિયો બ્રીફ' },
    { en: 'Quick Tour', hi: 'क्विक टूर', gu: 'ઝડપી પ્રવાસ' },
    { en: 'Edit Data', hi: 'डेटा एडिट करें', gu: 'ડેટા સંપાદિત કરો' },
    { en: 'Add Data', hi: 'डेटा जोड़ें', gu: 'ડેટા ઉમેરો' },
    { en: 'Download Template', hi: 'टेम्पलेट डाउनलोड', gu: 'ટેમ્પલેટ ડાઉનલોડ' },
    { en: 'Export Report', hi: 'रिपोर्ट एक्सपोर्ट', gu: 'રિપોર્ટ એક્સપોર્ટ' },
    { en: 'Autosaved', hi: 'स्वतः सहेजा गया', gu: 'ઓટો-સેવ કરેલ' },
    { en: 'Dark Mode', hi: 'डार्क मोड', gu: 'ડાર્ક મોડ' },
    { en: 'Light Mode', hi: 'लाइट मोड', gu: 'લાઇટ મોડ' },

    // Common Buttons & Tooltips
    { en: 'Save', hi: 'सहेजें', gu: 'સાચવો' },
    { en: 'Cancel', hi: 'रद्द करें', gu: 'રદ કરો' },
    { en: 'Close', hi: 'बंद करें', gu: 'બંધ કરો' },
    { en: 'Apply', hi: 'लागू करें', gu: 'લાગુ કરો' },
    { en: 'Delete', hi: 'हटाएं', gu: 'કાઢી નાખો' },
    { en: 'Edit', hi: 'संपादित करें', gu: 'સંપાદિત કરો' },
    { en: 'Reset', hi: 'रीसेट करें', gu: 'રીસેટ કરો' },
    { en: 'Search', hi: 'खोजें', gu: 'શોધો' },
    { en: 'Download', hi: 'डाउनलोड करें', gu: 'ડાઉનલોડ કરો' },
    { en: 'Upload', hi: 'अपलोड करें', gu: 'અપલોડ કરો' },
    { en: 'Executive PDF Report', hi: 'PDF रिपोर्ट डाउनलोड करें', gu: 'PDF રિપોર્ટ ડાઉનલોડ કરો' },
    { en: 'Capture PNG', hi: 'PNG स्क्रीनशॉट लें', gu: 'PNG સ્ક્રીનશોટ લો' },
    { en: 'Filtered CSV', hi: 'फिल्टर किया गया CSV डेटा', gu: 'ફિલ્ટર કરેલ CSV ડેટા' },
    { en: 'Change Language', hi: 'भाषा बदलें', gu: 'ભાષા બદલો' }
];

/**
 * Retrieves the currently active language code
 */
export function getCurrentLanguage(): LanguageCode {
    return currentLanguage;
}

export const getLanguage = getCurrentLanguage;

/**
 * Returns metadata about all supported languages
 */
export function getSupportedLanguages(): LanguageInfo[] {
    return SUPPORTED_LANGUAGES;
}

/**
 * Returns information about a specific language
 */
export function getLanguageInfo(langCode: LanguageCode = currentLanguage): LanguageInfo {
    return SUPPORTED_LANGUAGES.find(l => l.code === langCode) || SUPPORTED_LANGUAGES[0];
}

/**
 * Translates a key path into the active language string.
 * Supports dot notation like 'commandPalette.title' or 'navbar.data'.
 * If not found, falls back to English, then the provided fallback, then the key itself.
 */
export function t(keyPath: string, fallback?: string): string {
    if (!keyPath) return fallback || '';

    const lang = currentLanguage;
    const parts = keyPath.split('.');

    // 1. Try current language
    let value: any = TRANSLATIONS[lang];
    for (const part of parts) {
        if (value && typeof value === 'object' && part in value) {
            value = value[part];
        } else {
            value = null;
            break;
        }
    }

    if (typeof value === 'string') {
        return value;
    }

    // 2. Try English fallback
    if (lang !== 'en') {
        let enValue: any = TRANSLATIONS.en;
        for (const part of parts) {
            if (enValue && typeof enValue === 'object' && part in enValue) {
                enValue = enValue[part];
            } else {
                enValue = null;
                break;
            }
        }
        if (typeof enValue === 'string') {
            return enValue;
        }
    }

    // 3. Try provided fallback or return keyPath
    return fallback !== undefined ? fallback : keyPath;
}

/**
 * Sets the active language, updates storage, updates the DOM, and notifies listeners
 */
export function setLanguage(newLang: LanguageCode, notify = true, showToast = true): void {
    if (!['en', 'hi', 'gu'].includes(newLang)) {
        console.warn(`[i18n] Unsupported language code: ${newLang}. Defaulting to ${DEFAULT_LANGUAGE}`);
        newLang = DEFAULT_LANGUAGE;
    }

    const previousLang = currentLanguage;
    currentLanguage = newLang;

    // 1. Persist in localStorage across all standard keys
    try {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, newLang);
        localStorage.setItem(ALT_LANGUAGE_STORAGE_KEY, newLang);
        localStorage.setItem('app_language', newLang);
        localStorage.setItem('vedrabi_current_language', newLang);

        // Update onboarding preference if user profile is stored
        const rawOnboarding = localStorage.getItem('vedrabi_user_onboardings');
        if (rawOnboarding) {
            try {
                const parsed = JSON.parse(rawOnboarding);
                Object.keys(parsed).forEach(userKey => {
                    if (parsed[userKey]) {
                        parsed[userKey].language = newLang;
                        parsed[userKey].updatedAt = new Date().toISOString();
                    }
                });
                localStorage.setItem('vedrabi_user_onboardings', JSON.stringify(parsed));
            } catch (err) {
                // ignore parsing error
            }
        }
    } catch (e) {
        console.warn('[i18n] Storage write error:', e);
    }

    // 2. Set HTML document attributes for CSS and accessibility
    document.documentElement.lang = newLang;
    document.documentElement.setAttribute('data-app-lang', newLang);

    // 3. Update Visual Language UI (Dropdown badge & active menu items)
    updateLanguageSelectorUI();

    // 4. Translate the ENTIRE DOM reactively
    translateDOM();

    // 5. Notify all listeners
    if (notify) {
        listeners.forEach(fn => {
            try { 
                fn(newLang); 
            } catch (err) { 
                console.error('[i18n] Listener error:', err); 
            }
        });

        // Dispatch window custom events for decoupled or third-party listeners
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('languageChanged', {
                detail: {
                    language: newLang,
                    info: getLanguageInfo(newLang)
                }
            }));
            window.dispatchEvent(new CustomEvent('vedrabi:languageChanged', {
                detail: {
                    language: newLang
                }
            }));
        }
    }

    // 6. Show informative toast feedback
    if (showToast && previousLang !== newLang) {
        const toastMsg = t('navbar.langSwitchedToast', 
            newLang === 'hi' ? 'भाषा बदलकर हिन्दी कर दी गई है!' :
            newLang === 'gu' ? 'ભાષા સફળતાપૂર્વક ગુજરાતી કરવામાં આવી!' :
            'Language switched to English!'
        );
        
        if (typeof window !== 'undefined' && typeof window.showMessage === 'function') {
            window.showMessage(toastMsg, 'info');
        }
    }
}

/**
 * Synchronizes and updates any visual language selector widgets on screen
 * Specifically handles #btnAppLanguageDropdown and #currentLanguageBadge
 */
export function updateLanguageSelectorUI(): void {
    const langInfo = getLanguageInfo(currentLanguage);

    // 1. Update the main Navbar Language Badge (#currentLanguageBadge)
    const currentBadge = document.getElementById('currentLanguageBadge');
    if (currentBadge) {
        currentBadge.textContent = langInfo.nativeName;
    }

    // 2. Update all dropdown items active state (.lang-option-item & .lang-select-item)
    const allOptionItems = document.querySelectorAll<HTMLElement>('.lang-option-item, .lang-select-item, #appLanguageDropdownContainer .dropdown-item');
    allOptionItems.forEach(item => {
        const langCode = item.getAttribute('data-lang');
        if (langCode === currentLanguage) {
            item.classList.add('active', 'fw-bold', 'bg-primary-subtle');
            // Ensure checked styling or active indicator
            if (!item.querySelector('.lang-check-icon')) {
                const check = document.createElement('i');
                check.className = 'bi bi-check2 ms-auto text-primary fw-bold lang-check-icon';
                item.appendChild(check);
            }
        } else {
            item.classList.remove('active', 'fw-bold', 'bg-primary-subtle');
            const check = item.querySelector('.lang-check-icon');
            if (check) check.remove();
        }
    });

    // 3. Update any other current language label triggers
    const triggers = document.querySelectorAll<HTMLElement>('.lang-selector-current');
    triggers.forEach(el => {
        el.innerText = langInfo.nativeName;
    });
}

/**
 * Binds click events to the primary '#btnAppLanguageDropdown' and its menu options.
 */
export function bindLanguageDropdown(): void {
    const container = document.getElementById('appLanguageDropdownContainer');
    if (!container) return;

    const items = container.querySelectorAll<HTMLElement>('.dropdown-item');
    items.forEach(item => {
        // Prevent duplicate listener attachments
        if ((item as any).__langBound) return;
        (item as any).__langBound = true;

        item.addEventListener('click', (e) => {
            e.preventDefault();
            let targetLang = item.getAttribute('data-lang') as LanguageCode;

            // Infer language if data-lang is not directly set
            if (!targetLang) {
                const text = item.textContent || '';
                if (text.includes('हिन्दी') || text.includes('Hindi')) targetLang = 'hi';
                else if (text.includes('English') || text.includes('🇬🇧')) targetLang = 'en';
                else if (text.includes('ગુજરાતી') || text.includes('Gujarati')) targetLang = 'gu';
            }

            if (targetLang) {
                item.setAttribute('data-lang', targetLang);
                setLanguage(targetLang);
            }
        });
    });

    // Mark active item immediately
    updateLanguageSelectorUI();
}

/**
 * Maps known UI element IDs directly to translation dictionary keys for rapid full-DOM translation.
 */
const ELEMENT_KEY_MAP: Record<string, string> = {
    // Navigation bar links
    'menuData': 'navbar.data',
    'menuCharts': 'navbar.charts',
    'menuKpiBuilder': 'navbar.kpis',
    'menuAdvancedSettings': 'navbar.settings',
    'menuAdditionalActions': 'navbar.actions',
    'menuFilterSort': 'navbar.filters',
    'menuDashboardView': 'navbar.dashboard',
    'menuChartFormatting': 'navbar.formatting',
    'menuChartEffects': 'navbar.effects',
    'menuTextbox': 'navbar.textbox',
    'menuDashboardTheme': 'navbar.theme',
    'menuUserInfo': 'navbar.profile',

    // Small menu bar buttons
    'btnToggleSnapGrid': 'navbar.snapGrid',
    'btnToggleComparisonView': 'navbar.compare',
    'btnOpenSavedViewsModal': 'navbar.savedViews',
    'btnAutoArrangeGrid': 'navbar.autoGrid',
    'btnLttbSamplingDropdown': 'navbar.sampling',
    'btnStartPresentation': 'navbar.slideshow',
    'btnAudioNarrator': 'navbar.audioBrief',
    'btnCommandPalette': 'navbar.searchCtrlK',
    'btnHotkeysModal': 'navbar.shortcuts',
    'btnQuickTour': 'navbar.quickTour',
    'btnAppLanguageDropdown': 'navbar.changeLanguage',
    'editDataBtn': 'navbar.editData',
    'addDataBtn': 'navbar.addData',
    'downloadTemplate': 'navbar.downloadTemplate',
    'exportReportDropdown': 'navbar.export',
    'exportPDFBtn': 'navbar.exportPdf',
    'exportPNGDashboardBtn': 'navbar.exportPng',
    'exportCSVFilteredBtn': 'navbar.exportCsv',
    'autosaveStatusText': 'navbar.autosaved',
    'toggleTheme': 'navbar.toggleTheme',
    'toggleDashboardSectionBtn': 'navbar.toggleDashboard',
    'toggleDashboardSectionSmallBtn': 'navbar.toggleDashboard'
};

/**
 * Scans the provided root element (or entire document) and translates:
 * 1. Elements with data-i18n, data-i18n-title, data-i18n-placeholder, data-i18n-html, data-i18n-aria-label.
 * 2. Mapped element IDs and classes.
 * 3. Text nodes matching known UI phrases across English, Hindi, and Gujarati.
 * 4. Bootstrap tooltips and titles.
 */
export function translateDOM(root: HTMLElement | Document = document): void {
    if (!root || typeof document === 'undefined') return;

    const target = root instanceof Document ? root.body : root;
    if (!target) return;

    // 1. Translate elements with explicit [data-i18n] attributes
    const textElements = target.querySelectorAll<HTMLElement>('[data-i18n]');
    textElements.forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (key) {
            const translated = t(key);
            if (translated && translated !== key) {
                // If element has child icon, only update the text node or inner span
                const span = el.querySelector('span:not(.badge)');
                if (span) {
                    span.textContent = translated;
                } else if (el.children.length === 0) {
                    el.textContent = translated;
                } else {
                    // Replace text nodes while preserving vector icons
                    Array.from(el.childNodes).forEach(node => {
                        if (node.nodeType === Node.TEXT_NODE && node.nodeValue && node.nodeValue.trim().length > 0) {
                            node.nodeValue = ` ${translated.trim()} `;
                        }
                    });
                }
            }
        }
    });

    // 2. Translate Placeholders [data-i18n-placeholder]
    const placeholderElements = target.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('[data-i18n-placeholder]');
    placeholderElements.forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (key) {
            const translated = t(key);
            if (translated && translated !== key) {
                el.placeholder = translated;
            }
        }
    });

    // 3. Translate Titles / Tooltips [data-i18n-title]
    const titleElements = target.querySelectorAll<HTMLElement>('[data-i18n-title]');
    titleElements.forEach(el => {
        const key = el.getAttribute('data-i18n-title');
        if (key) {
            const translated = t(key);
            if (translated && translated !== key) {
                el.title = translated;
                el.setAttribute('data-bs-title', translated);
                el.setAttribute('data-bs-original-title', translated);
            }
        }
    });

    // 4. Translate HTML Content [data-i18n-html]
    const htmlElements = target.querySelectorAll<HTMLElement>('[data-i18n-html]');
    htmlElements.forEach(el => {
        const key = el.getAttribute('data-i18n-html');
        if (key) {
            const translated = t(key);
            if (translated && translated !== key) {
                el.innerHTML = translated;
            }
        }
    });

    // 5. Translate via Pre-Mapped Element IDs
    Object.entries(ELEMENT_KEY_MAP).forEach(([elemId, keyPath]) => {
        const elem = document.getElementById(elemId);
        if (!elem) return;

        const translated = t(keyPath);
        if (!translated || translated === keyPath) return;

        // If element has a title, update it
        if (elem.hasAttribute('title') || elem.hasAttribute('data-bs-title')) {
            elem.setAttribute('title', translated);
            elem.setAttribute('data-bs-title', translated);
            elem.setAttribute('data-bs-original-title', translated);
        }

        // Update inner text span if present
        const innerSpan = elem.querySelector('span:not(.badge)');
        if (innerSpan) {
            innerSpan.textContent = translated;
        } else if (elem.children.length === 0) {
            elem.textContent = translated;
        }
    });

    // 6. Intelligent Phrase Replacement for dynamic / un-annotated text nodes
    translateTextNodesWithPhrases(target, currentLanguage);
}

/**
 * Traverses text nodes in the target element and translates matching UI phrases
 * across English, Hindi, and Gujarati.
 */
function translateTextNodesWithPhrases(root: HTMLElement, targetLang: LanguageCode): void {
    const walker = document.createTreeWalker(
        root,
        NodeFilter.SHOW_TEXT,
        {
            acceptNode(node) {
                // Ignore script, style, code, and svg tags
                const parent = node.parentElement;
                if (!parent) return NodeFilter.FILTER_REJECT;
                const tag = parent.tagName.toLowerCase();
                if (['script', 'style', 'code', 'pre', 'svg', 'textarea'].includes(tag)) {
                    return NodeFilter.FILTER_REJECT;
                }
                if (parent.hasAttribute('data-no-translate')) {
                    return NodeFilter.FILTER_REJECT;
                }
                const text = node.nodeValue?.trim() || '';
                return text.length > 0 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
            }
        }
    );

    const nodesToReplace: { node: Node; newText: string }[] = [];

    while (walker.nextNode()) {
        const node = walker.currentNode;
        const text = (node.nodeValue || '').trim();

        // Check if text strictly matches any phrase in any language
        for (const phrase of UI_PHRASES) {
            if (text === phrase.en || text === phrase.hi || text === phrase.gu) {
                const targetText = phrase[targetLang];
                if (targetText && targetText !== text) {
                    nodesToReplace.push({
                        node,
                        newText: (node.nodeValue || '').replace(text, targetText)
                    });
                }
                break;
            }
        }
    }

    nodesToReplace.forEach(({ node, newText }) => {
        node.nodeValue = newText;
    });
}

/**
 * Subscribes a callback to language change events.
 * Returns an unsubscribe cleanup function.
 */
export function onLanguageChange(callback: LanguageChangeListener): () => void {
    listeners.add(callback);
    return () => listeners.delete(callback);
}

/**
 * Automatically attaches to newly loaded dynamic content
 */
export function autoTranslate(container?: HTMLElement): void {
    if (container) {
        translateDOM(container);
    } else {
        translateDOM(document);
    }
}

/**
 * Initializes the Language Manager subsystem on app startup
 */
export function initLanguageManager(): void {
    if (isInitialized) return;
    isInitialized = true;

    // 1. Detect saved language preference from localStorage
    let savedLang: LanguageCode | null = null;
    try {
        savedLang = (
            localStorage.getItem(LANGUAGE_STORAGE_KEY) || 
            localStorage.getItem(ALT_LANGUAGE_STORAGE_KEY) ||
            localStorage.getItem('app_language') ||
            localStorage.getItem('vedrabi_current_language')
        ) as LanguageCode;

        // Also check if user has saved onboarding data
        if (!savedLang) {
            const rawOnboarding = localStorage.getItem('vedrabi_user_onboardings');
            if (rawOnboarding) {
                const parsed = JSON.parse(rawOnboarding);
                const firstUser = Object.values(parsed)[0] as any;
                if (firstUser?.language) {
                    savedLang = firstUser.language as LanguageCode;
                }
            }
        }
    } catch (e) {
        console.warn('[i18n] Failed to read initial language:', e);
    }

    const initialLang = (savedLang && ['en', 'hi', 'gu'].includes(savedLang)) 
        ? savedLang 
        : DEFAULT_LANGUAGE;

    currentLanguage = initialLang;

    // 2. Set document language attributes immediately
    if (typeof document !== 'undefined') {
        document.documentElement.lang = initialLang;
        document.documentElement.setAttribute('data-app-lang', initialLang);

        // Bind and translate when DOM is ready
        const onReady = () => {
            bindLanguageDropdown();
            translateDOM();
            updateLanguageSelectorUI();
        };

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', onReady);
        } else {
            onReady();
        }
    }

    // 3. Expose global window API
    if (typeof window !== 'undefined') {
        window.setAppLanguage = (lang: LanguageCode) => setLanguage(lang, true, true);
        window.getAppLanguage = () => getCurrentLanguage();
        window.t = (key: string, fallback?: string) => t(key, fallback);
        window.translateDOM = (root?: HTMLElement | Document) => translateDOM(root);
    }
}

// Auto-initialize when loaded
initLanguageManager();
