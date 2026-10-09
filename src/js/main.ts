// src/js/main.ts

// Vedra Bi की main.ts फ़ाइल।
// इसमें मुख्य इनिशियलाइज़ेशन, DOMContentLoaded लिसनर, और मुख्य UI/मेन्यू लॉजिक शामिल है।

// आवश्यक मॉड्यूल्स आयात करें
import { SecurityManager, SessionTimeoutManager } from './auth/securityManager.ts';
import { OnboardingManager } from './ui/onboardingManager.js';
import { renderChartContainerColorTemplates, renderDashboardChartOverview } from './charts/chartContainerColors.js';
import { renderChartEffectsTemplates, renderDashboardChartList } from './charts/chartEffects.js';
import { auth, showMessage, attachEventListener } from './core/utils.ts';
import { getRawData, initPeriodicAutosave, saveDashboardSettings } from '../store/DataHandler.ts';
import { toggleComparisonView } from './ui/comparisonView.js';
import { displayStats } from '../store/UIHandler.js';
import { chartGlobalSettings, discardActivePreviewChart, plotAll } from './charts/charts.ts';
import { backgroundTemplates, renderBackgroundTemplates } from './layout/backgroundTemplates.ts';
import { autoArrangeGridLayout, toggleLockMode } from './ui/drag_drop.ts';
import { openSavedViewsGalleryModal, updateSavedViewsBadgeCount } from './ui/savedViews.js';
import { initializeLoginAndAuth } from './auth/login.ts';
import { initializeKPIAndThemes, updateKPICards } from './charts/kpiSparklines.js';

// main_handlers.ts से इवेंट हैंडलर फ़ंक्शन आयात करें
import { attachGlobalEventHandlers } from './core/main_handlers.ts';
import { initializeDataTransformerUI } from './data/dataTransformerUI.js';
import { initializeAdvancedActions } from './export/advancedActions.js';
import { loadDynamicContent } from './layout/dynamicLoader.ts';
import { initializeMultiDashboard } from './layout/multiDashboard.js';
import { initializeFullDashboardMode } from './layout/fullDashboardMode.ts';
import { initializeFloatingFab } from './ui/floatingFab.js';
import { restoreDashboardTextboxes } from './ui/editor.js';
import { initializeGuidedTour } from './ui/guidedTour.js';
import { initializeCommandPalette } from './ui/commandPalette.js';
import { initializePresentationMode } from './ui/presentationMode.js';
import { initializeAudioNarrator } from './ai/audioNarrator.ts';
import { initializeChatUI } from './ai/chat.ts';

import { allActiveChartInstances } from './charts/chartState.js';
import { verifyAndRecoverCDNs } from './core/cdnManager.js';
import { setLanguage, getLanguage, t, onLanguageChange, Language } from './i18n/index.ts';

declare const bootstrap: any;

declare global {
    interface Window {
        selectedTemplateIndex?: number;
        setAppLanguage?: (lang: Language) => void;
        getAppLanguage?: () => Language;
        t?: (key: string, defaultText?: string) => string;
    }
}

// ====================================================================
// Offcanvas Sidebar Accordion System & Batch Controls
// ====================================================================
export function initSidebarAccordions(rootElement?: HTMLElement | Document | null): void {
    const root = rootElement || document.getElementById('offcanvasSidebar') || document;
    
    // Find all cards and sections in the sidebar
    const cardElements = root.querySelectorAll<HTMLElement>(
        '#offcanvasSidebar .card, #offcanvasSidebar .sidebar-card, #offcanvasSidebar .card-section, #offcanvasSidebar .accordion-item, .offcanvas-content .card, .offcanvas-content .sidebar-card, .offcanvas-content .card-section'
    );

    cardElements.forEach((card) => {
        // Skip nested inner mini-cards
        if (card.parentElement && card.parentElement.closest('.card') && !card.classList.contains('sidebar-card') && !card.classList.contains('card-section')) {
            return;
        }

        // Find or identify the header element
        let header = card.querySelector<HTMLElement>(':scope > .card-header, :scope > .sidebar-card-header, :scope > .accordion-header, :scope > div > .card-header');
        
        // If not found, check if the first child is a header/heading-like element
        if (!header) {
            const firstChild = card.firstElementChild as HTMLElement | null;
            if (firstChild && (firstChild.matches('h5, h6, .fw-bold, [class*="header"]') || firstChild.querySelector('h5, h6, label.fw-bold'))) {
                header = firstChild;
            }
        }

        if (header && !header.dataset.accordionBound) {
            header.dataset.accordionBound = 'true';
            header.classList.add('sidebar-accordion-header');
            header.style.cursor = 'pointer';
            header.setAttribute('role', 'button');
            header.setAttribute('tabindex', '0');

            const isCollapsed = card.classList.contains('is-collapsed');
            header.setAttribute('aria-expanded', isCollapsed ? 'false' : 'true');

            // Ensure chevron indicator is present
            let chevron = header.querySelector('.accordion-chevron, .card-collapse-icon');
            if (!chevron) {
                chevron = document.createElement('i');
                chevron.className = 'bi bi-chevron-down accordion-chevron ms-auto';
                chevron.setAttribute('aria-hidden', 'true');
                header.appendChild(chevron);
            }

            const toggleAccordion = (e: Event) => {
                // Don't toggle if clicking an interactive control inside the header
                const target = e.target as HTMLElement;
                if (target.closest('button, input, select, a, .btn, .btn-close, .form-check-input, .dropdown, .custom-select-trigger')) {
                    return;
                }
                
                const willCollapse = !card.classList.contains('is-collapsed');
                if (willCollapse) {
                    card.classList.add('is-collapsed');
                    header!.setAttribute('aria-expanded', 'false');
                } else {
                    card.classList.remove('is-collapsed');
                    header!.setAttribute('aria-expanded', 'true');
                }
                updateToggleAllAccordionsButtonState();
            };

            header.addEventListener('click', toggleAccordion);
            header.addEventListener('keydown', (e: KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleAccordion(e);
                }
            });
        }
    });
}

export function updateToggleAllAccordionsButtonState(): void {
    const activeContent = document.querySelector('.offcanvas-content[style*="display: block"]') || 
                          document.querySelector('.offcanvas-content:not([style*="display: none"])');
    if (!activeContent) return;

    const cards = activeContent.querySelectorAll<HTMLElement>('.card, .sidebar-card, .card-section, .accordion-item');
    if (cards.length === 0) return;

    const allCollapsed = Array.from(cards).every(c => c.classList.contains('is-collapsed'));
    const toggleIcon = document.getElementById('toggleAccordionsIcon');
    const toggleText = document.getElementById('toggleAccordionsText');

    if (toggleIcon) {
        toggleIcon.className = allCollapsed ? 'bi bi-arrows-expand' : 'bi bi-arrows-collapse';
    }
    if (toggleText) {
        toggleText.textContent = allCollapsed ? 'Expand' : 'Collapse';
    }
}

// ====================================================================
// एडवांस्ड चार्ट सेटिंग्स नियंत्रणों को पॉपुलेट करने का फ़ंक्शन
// ====================================================================
export function populateAdvancedChartSettingsControls(): void {
    const gridShowHide = document.getElementById('gridShowHide') as HTMLInputElement | null;
    const tooltipOnOff = document.getElementById('tooltipOnOff') as HTMLInputElement | null;
    const zoomEnable = document.getElementById('zoomEnable') as HTMLInputElement | null;
    const animationDuration = document.getElementById('animationDuration') as HTMLInputElement | null;
    const animationDurationValue = document.getElementById('animationDurationValue');
    const axisFormat = document.getElementById('axisFormat') as HTMLSelectElement | null;
    const legendPosition = document.getElementById('legendPosition') as HTMLSelectElement | null;
    const showLabels = document.getElementById('showLabels') as HTMLInputElement | null;

    const showToolbox = document.getElementById('showToolbox') as HTMLInputElement | null;
    const colorPaletteName = document.getElementById('colorPaletteName') as HTMLSelectElement | null;
    const fontSize = document.getElementById('fontSize') as HTMLInputElement | null;
    const gridStyle = document.getElementById('gridStyle') as HTMLSelectElement | null;
    const lineStyle = document.getElementById('lineStyle') as HTMLSelectElement | null;
    const areaFill = document.getElementById('areaFill') as HTMLInputElement | null;
    const barRounded = document.getElementById('barRounded') as HTMLInputElement | null;

    if (gridShowHide) gridShowHide.checked = (chartGlobalSettings as any).gridShowHide;
    if (tooltipOnOff) tooltipOnOff.checked = (chartGlobalSettings as any).tooltipOnOff;
    if (zoomEnable) zoomEnable.checked = (chartGlobalSettings as any).zoomEnable;
    if (animationDuration) {
        animationDuration.value = (chartGlobalSettings as any).animationDuration;
        if (animationDurationValue) animationDurationValue.textContent = (chartGlobalSettings as any).animationDuration;
    }
    if (axisFormat) axisFormat.value = (chartGlobalSettings as any).axisFormat;
    if (legendPosition) legendPosition.value = (chartGlobalSettings as any).legendPosition;
    if (showLabels) showLabels.checked = (chartGlobalSettings as any).showLabels;

    if (showToolbox) showToolbox.checked = (chartGlobalSettings as any).showToolbox;
    if (colorPaletteName) colorPaletteName.value = (chartGlobalSettings as any).colorPaletteName;
    if (fontSize) fontSize.value = (chartGlobalSettings as any).fontSize;
    if (gridStyle) gridStyle.value = (chartGlobalSettings as any).gridStyle;
    if (lineStyle) lineStyle.value = (chartGlobalSettings as any).lineStyle;
    if (areaFill) areaFill.checked = (chartGlobalSettings as any).areaFill;
    if (barRounded) barRounded.checked = (chartGlobalSettings as any).barRounded;

    // Populate Thresholds & Reference Lines settings UI
    const thresholdEnable = document.getElementById('thresholdEnable') as HTMLInputElement | null;
    const thresholdValue = document.getElementById('thresholdValue') as HTMLInputElement | null;
    const thresholdLabel = document.getElementById('thresholdLabel') as HTMLInputElement | null;
    const thresholdColor = document.getElementById('thresholdColor') as HTMLInputElement | null;
    const thresholdStyle = document.getElementById('thresholdStyle') as HTMLSelectElement | null;

    const thresholdEnableZone = document.getElementById('thresholdEnableZone') as HTMLInputElement | null;
    const thresholdZoneMin = document.getElementById('thresholdZoneMin') as HTMLInputElement | null;
    const thresholdZoneMax = document.getElementById('thresholdZoneMax') as HTMLInputElement | null;
    const thresholdZoneLabel = document.getElementById('thresholdZoneLabel') as HTMLInputElement | null;
    const thresholdZoneColor = document.getElementById('thresholdZoneColor') as HTMLInputElement | null;

    const threshold = (chartGlobalSettings as any).threshold;
    if (threshold) {
        if (thresholdEnable) thresholdEnable.checked = !!threshold.enable;
        if (thresholdValue && threshold.value !== undefined) thresholdValue.value = threshold.value;
        if (thresholdLabel && threshold.label) thresholdLabel.value = threshold.label;
        if (thresholdColor && threshold.color) thresholdColor.value = threshold.color;
        if (thresholdStyle && threshold.style) thresholdStyle.value = threshold.style;

        if (thresholdEnableZone) thresholdEnableZone.checked = !!threshold.enableZone;
        if (thresholdZoneMin && threshold.zoneMin !== undefined) thresholdZoneMin.value = threshold.zoneMin;
        if (thresholdZoneMax && threshold.zoneMax !== undefined) thresholdZoneMax.value = threshold.zoneMax;
        if (thresholdZoneLabel && threshold.zoneLabel) thresholdZoneLabel.value = threshold.zoneLabel;
        if (thresholdZoneColor && threshold.zoneColor) thresholdZoneColor.value = threshold.zoneColor;
    }
}

// ====================================================================
// Modal को विशिष्ट सामग्री के साथ खोलने का फ़ंक्शन
// ====================================================================
async function openModalWithContent(targetContentId: string): Promise<void> {
    await loadDynamicContent('mainMenuModal', 'mainMenuModal');

    const modalEl = document.getElementById('mainMenuModal');
    if (!modalEl) return;

    const modal = new bootstrap.Modal(modalEl, {
        backdrop: 'static'
    });
    const modalTitle = document.getElementById('mainMenuModalLabel');

    // सभी सामग्री क्षेत्रों को पहले छिपाएं
    document.querySelectorAll('.modal-content-area').forEach((el) => {
        (el as HTMLElement).style.display = 'none';
    });

    // क्लिक किए गए मेनू आइटम के लिए विशिष्ट सामग्री दिखाएं
    const contentToShow = document.getElementById(targetContentId);
    if (contentToShow) {
        contentToShow.style.display = 'block';
    }

    // Modal का शीर्षक सेट करें
    if (modalTitle) {
        switch(targetContentId) {
            case 'advancedSettingsContent':
                modalTitle.textContent = 'एडवांस्ड चार्ट सेटिंग्स';
                populateAdvancedChartSettingsControls(); // Controls को पॉपुलेट करें
                break;
            case 'dashboardViewContent':
                modalTitle.textContent = 'डैशबोर्ड दृश्य';
                break;
            default:
                modalTitle.textContent = 'सेटिंग्स';
                break;
        }
    }

    // Modal दिखाएं
    modal.show();

    // मॉडल बंद होने पर बैकड्रॉप को हटाने के लिए इवेंट लिसनर
    modalEl.addEventListener('hidden.bs.modal', function () {
        const body = document.body;
        const backdrops = document.querySelectorAll('.modal-backdrop');
        backdrops.forEach(backdrop => {
            backdrop.remove();
        });
        body.classList.remove('modal-open');
        body.style.overflow = '';
        body.style.paddingRight = '';
    });
}

// ====================================================================
// DOMContentLoaded Listener और मुख्य UI लॉजिक
// ====================================================================
document.addEventListener('DOMContentLoaded', () => {
    // थीम लोड करें और लागू करें
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        document.body.classList.remove('silk-light-theme');
        const offcanvasNav = document.getElementById('offcanvasNav');
        if (offcanvasNav) offcanvasNav.classList.add('dark-theme');
        const offcanvasSidebar = document.getElementById('offcanvasSidebar');
        if (offcanvasSidebar) offcanvasSidebar.classList.add('dark-theme');
    } else {
        document.body.classList.remove('dark-theme');
        document.body.classList.add('silk-light-theme');
    }

    // लॉगिन और ऑथेंटिकेशन लॉजिक व 30-मिनट सत्र समयावधि मॉनिटर को इनिशइलाइज़ करें
    initializeLoginAndAuth();
    SessionTimeoutManager.init();

    // Multi-Language Support Engine (English, Hindi, Gujarati)
    window.setAppLanguage = (lang: Language) => {
        setLanguage(lang);
    };
    window.getAppLanguage = () => {
        return getLanguage();
    };
    window.t = (key: string, defaultText?: string) => {
        return t(key, defaultText);
    };

    const updateLanguageBadgeUI = (lang: Language) => {
        const badge = document.getElementById('currentLanguageBadge');
        if (badge) {
            if (lang === 'hi') badge.textContent = 'हिन्दी';
            else if (lang === 'gu') badge.textContent = 'ગુજરાતી';
            else badge.textContent = 'English';
        }
    };

    updateLanguageBadgeUI(getLanguage());
    onLanguageChange((lang) => {
        updateLanguageBadgeUI(lang);
        try {
            updateKPICards();
            plotAll();
        } catch (e) {
            console.error('[i18n] Error updating charts/KPIs on language change:', e);
        }
    });

    // मल्टी-डैशबोर्ड और ड्रैग-एंड-ड्रॉप फ़्लोटिंग क्विक मेनू (FAB) इनिशियलाइज़ करें
    initializeMultiDashboard();
    initializeFullDashboardMode();
    initializeFloatingFab();

    // डैशबोर्ड पर पहले से बने टेक्स्टबॉक्स को लोड और रीस्टोर करें (Auto-restore textboxes on load/refresh)
    try {
        restoreDashboardTextboxes();
    } catch (textboxErr) {
        console.warn('[Main] Error restoring dashboard textboxes:', textboxErr);
    }

    initializeGuidedTour();
    initializeCommandPalette();
    initializePresentationMode();
    initializeAudioNarrator();
    initializeChatUI();

    // Offcanvas Sidebar Instance
    const offcanvasSidebar = document.getElementById('offcanvasSidebar');
    const bsOffcanvas = (offcanvasSidebar && typeof bootstrap !== 'undefined') ? bootstrap.Offcanvas.getOrCreateInstance(offcanvasSidebar) : null;
    const mainMenuLinks = document.querySelectorAll('.main-menu-bar .nav-link');
    const dashboardContent = document.querySelector('.main-content-container') as HTMLElement | null;
    const dashboardSection = document.getElementById('dashboardSection');

    // Toggle main sidebar event handler
    const toggleMainSidebarBtn = document.getElementById('toggleMainSidebarBtn');
    if (toggleMainSidebarBtn && bsOffcanvas && offcanvasSidebar) {
        toggleMainSidebarBtn.addEventListener('click', async (event) => {
            if (event) {
                event.preventDefault();
                event.stopPropagation();
            }
            const isOpen = offcanvasSidebar.classList.contains('show');
            if (isOpen) {
                bsOffcanvas.hide();
            } else {
                const currentActive = document.querySelector('.main-menu-bar .nav-link.active') as HTMLElement | null;
                const targetContentId = currentActive?.dataset.menuTarget || 'chartSettingsContent';

                document.querySelectorAll('.offcanvas-content').forEach((content) => {
                    (content as HTMLElement).style.display = 'none';
                });

                bsOffcanvas.show();
                await loadDynamicContent('offcanvasSidebar', targetContentId);
            }
        });
    }

    // ----------------------------------------------------
    // Chart Container Color / Custom Style Logic (साइडबार के अंदर)
    // ----------------------------------------------------
    const chartContainerColorGallery = document.getElementById('chartContainerColorGallery');

    // चार्ट कंटेनर कलर टेम्पलेट्स को रेंडर करें
    if (chartContainerColorGallery) {
        renderChartContainerColorTemplates(chartContainerColorGallery, () => {
            // Callback placeholder
        });
    }

    // 'सभी चार्ट' और 'चयनित चार्ट' रेडियो बटन पर इवेंट हैंडलर
    document.getElementById('scopeAllCharts')?.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        const overview = document.getElementById('dashboardChartOverview');
        if (overview) overview.style.display = target.checked ? 'none' : 'block';
    });

    document.getElementById('scopeSelectedCharts')?.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        if (target.checked) {
            const overview = document.getElementById('dashboardChartOverview');
            if (overview) overview.style.display = 'block';
            renderDashboardChartOverview(document.getElementById('chartSelectionList'), allActiveChartInstances);
        }
    });

    // ----------------------------------------------------
    // Background Template Logic
    // ----------------------------------------------------
    renderBackgroundTemplates('backgroundTemplateGallery');

    window.selectedTemplateIndex = -1;
    const backgroundTemplateGallery = document.getElementById('backgroundTemplateGallery');
    if (backgroundTemplateGallery) {
        backgroundTemplateGallery.addEventListener('click', (event) => {
            const target = event.target as HTMLElement;
            const clickedItem = target.closest('.background-template-item') as HTMLElement | null;
            if (clickedItem) {
                document.querySelectorAll('.background-template-item').forEach((item) => {
                    (item as HTMLElement).style.border = '1px solid #ddd';
                    item.classList.remove('selected');
                });
                clickedItem.style.border = '2px solid #007bff';
                clickedItem.classList.add('selected');
                if (clickedItem.dataset.index !== undefined) {
                    window.selectedTemplateIndex = parseInt(clickedItem.dataset.index, 10);
                }
            }
        });
    }

    // ----------------------------------------------------
    // Chart Effects Radio Button Logic
    // ----------------------------------------------------
    const setupEffectRadios = (radioId: string, sectionId: string) => {
        document.getElementById(radioId)?.addEventListener('change', () => {
            const customSec = document.getElementById('customEffectsSection');
            const tempSec = document.getElementById('templateEffectsSection');
            const codeSec = document.getElementById('customCodeEffectsSection');
            if (customSec) customSec.style.display = 'none';
            if (tempSec) tempSec.style.display = 'none';
            if (codeSec) codeSec.style.display = 'none';

            const targetSec = document.getElementById(sectionId);
            if (targetSec) targetSec.style.display = 'block';

            if (radioId === 'templateEffectsRadio') {
                const gallery = document.getElementById('effectsTemplatesGallery') || document.getElementById('chartEffectsTemplateGallery');
                if (gallery) {
                    renderChartEffectsTemplates(gallery, () => {});
                }
            }
        });
    };

    setupEffectRadios('customEffectsRadio', 'customEffectsSection');
    setupEffectRadios('templateEffectsRadio', 'templateEffectsSection');
    setupEffectRadios('customCodeRadio', 'customCodeEffectsSection');

    // Effects Scope Radio Logic
    document.getElementById('applyToAllRadio')?.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        const overview = document.getElementById('dashboardChartOverviewEffects');
        if (overview) overview.style.display = target.checked ? 'none' : 'block';
    });
    document.getElementById('applyToSelectedRadio')?.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        if (target.checked) {
            const overview = document.getElementById('dashboardChartOverviewEffects');
            if (overview) overview.style.display = 'block';
            renderDashboardChartList(document.getElementById('chartSelectionListEffects'));
        }
    });

    // ----------------------------------------------------
    // Load Saved Dashboard Colors
    // ----------------------------------------------------
    const savedBackgroundColor = localStorage.getItem('dashboardBackgroundColor');
    const savedTextColor = localStorage.getItem('dashboardTextColor');
    if (dashboardContent) {
        if (savedBackgroundColor) dashboardContent.style.backgroundColor = savedBackgroundColor;
        if (savedTextColor) dashboardContent.style.color = savedTextColor;
    }

    // ----------------------------------------------------
    // Main Menu Links Logic (Modal/Offcanvas Control)
    // ----------------------------------------------------
    mainMenuLinks.forEach(link => {
        link.addEventListener('click', async (event) => {
            const el = link as HTMLElement;
            if (el.id === 'toggleDashboardSectionBtn') {
                return; // custom listener handles it
            }

            // Direct page navigation links (like profile.html) should navigate directly!
            const href = el.getAttribute('href');
            if (el.id === 'menuUserInfo' || (href && href !== '#' && !href.startsWith('javascript:'))) {
                window.location.href = href || 'profile.html';
                return;
            }

            event.preventDefault();
            event.stopPropagation(); // Stop Bootstrap from auto-toggling and causing instant hides

            const targetContentId = el.dataset.menuTarget;
            const isModal = el.dataset.bsToggle === 'modal';

            if (isModal) {
                // Modal trigger
                mainMenuLinks.forEach(l => l.classList.remove('active'));
                el.classList.add('active');
                if (targetContentId) {
                    await openModalWithContent(targetContentId);
                }
            } else {
                // Offcanvas trigger
                const isOpen = offcanvasSidebar ? offcanvasSidebar.classList.contains('show') : false;
                const isCurrentlyActive = el.classList.contains('active');

                if (isOpen && isCurrentlyActive) {
                    // Clicked the same active item while open -> Toggle close
                    if (bsOffcanvas) bsOffcanvas.hide();
                    el.classList.remove('active');
                } else {
                    // Switch active classes
                    mainMenuLinks.forEach(l => l.classList.remove('active'));
                    el.classList.add('active');

                    // Hide old contents
                    document.querySelectorAll('.offcanvas-content').forEach((content) => {
                        (content as HTMLElement).style.display = 'none';
                    });

                    // Open offcanvas
                    if (bsOffcanvas) bsOffcanvas.show();

                    // Load dynamic content
                    if (targetContentId) {
                        await loadDynamicContent('offcanvasSidebar', targetContentId);

                        // Sync offcanvas top tab pill
                        const sidebarTabBtns = document.querySelectorAll('.sidebar-tab-btn');
                        sidebarTabBtns.forEach(btn => {
                            const btnEl = btn as HTMLElement;
                            if (btnEl.dataset.targetContent === targetContentId) {
                                btnEl.classList.add('active', 'btn-outline-primary');
                                btnEl.classList.remove('btn-outline-secondary');
                            } else {
                                btnEl.classList.remove('active', 'btn-outline-primary');
                                btnEl.classList.add('btn-outline-secondary');
                            }
                        });

                        const subLabelEl = document.getElementById('offcanvasSidebarSubLabel');
                        if (subLabelEl) {
                            const titleMap: Record<string, string> = {
                                'chartSettingsContent': 'Chart Designer',
                                'chartFormattingContent': 'Style & Formatting',
                                'chartEffectsContent': 'Visual Effects',
                                'dataContent': 'Data Source',
                                'kpiBuilderContent': 'KPI Cards',
                                'templateGalleryContent': 'Templates Gallery',
                                'dashboardViewContent': 'Dashboard View',
                                'textboxContent': 'Notes & Annotations',
                                'dashboardThemeContent': 'Color Themes',
                                'userInfoContent': 'User Profile',
                                'additionalActionsContent': 'Quick Actions',
                                'advancedSettingsContent': 'Settings & Thresholds',
                                'filterSortContent': 'Filters & Sorting'
                            };
                            subLabelEl.textContent = titleMap[targetContentId] || 'Studio Controls';
                        }

                        // Hide generic accordion search & collapse bar when viewing Template Gallery
                        const sidebarSearchBar = document.querySelector('.sidebar-search-bar') as HTMLElement;
                        if (sidebarSearchBar) {
                            sidebarSearchBar.style.display = targetContentId === 'templateGalleryContent' ? 'none' : '';
                        }

                        if (el.id === 'menuThresholds') {
                            setTimeout(() => {
                                const targetEl = document.getElementById('threshold-line-controls');
                                if (targetEl) targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }, 150);
                        } else if (el.id === 'menuCustomPalette') {
                            setTimeout(() => {
                                const targetEl = document.getElementById('custom-theme-creator-box');
                                if (targetEl) targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }, 150);
                        }
                    }
                }
            }
        });
    });

    // Dashboard Section Visibility Toggle (Show/Hide)
    function toggleDashboardSection(): void {
        if (!dashboardSection) return;
        const isHidden = dashboardSection.classList.contains('d-none');
        if (isHidden) {
            dashboardSection.classList.remove('d-none');
            
            // Update sidebar button
            const textEl = document.getElementById('toggleDashboardSectionText');
            if (textEl) textEl.textContent = 'डैशबोर्ड छुपाएं';
            const iconEl = document.getElementById('toggleDashboardSectionIcon');
            if (iconEl) {
                iconEl.className = 'bi bi-eye-slash';
            }
            // Update small screen button
            const smallBtnIcon = document.querySelector('#toggleDashboardSectionSmallBtn i');
            if (smallBtnIcon) {
                smallBtnIcon.className = 'bi bi-eye-slash';
            }
            showMessage('डैशबोर्ड दिखाई दे रहा है (Dashboard Visible)', 'success');
        } else {
            dashboardSection.classList.add('d-none');
            
            // Update sidebar button
            const textEl = document.getElementById('toggleDashboardSectionText');
            if (textEl) textEl.textContent = 'डैशबोर्ड दिखाएं';
            const iconEl = document.getElementById('toggleDashboardSectionIcon');
            if (iconEl) {
                iconEl.className = 'bi bi-eye';
            }
            // Update small screen button
            const smallBtnIcon = document.querySelector('#toggleDashboardSectionSmallBtn i');
            if (smallBtnIcon) {
                smallBtnIcon.className = 'bi bi-eye';
            }
            showMessage('डैशबोर्ड छुपा दिया गया है (Dashboard Hidden)', 'info');
        }
    }

    const toggleBtn = document.getElementById('toggleDashboardSectionBtn');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleDashboardSection();
        });
    }

    const toggleSmallBtn = document.getElementById('toggleDashboardSectionSmallBtn');
    if (toggleSmallBtn) {
        toggleSmallBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleDashboardSection();
        });
    }

    // Offcanvas बंद होने पर सामग्री छिपाएं
    if (offcanvasSidebar) {
        offcanvasSidebar.addEventListener('hidden.bs.offcanvas', () => {
            document.querySelectorAll('.offcanvas-content').forEach((content) => {
                (content as HTMLElement).style.display = 'none';
            });
            discardActivePreviewChart();
            const searchInput = document.getElementById('sidebarQuickSearchInput') as HTMLInputElement | null;
            if (searchInput) searchInput.value = '';
        });
    }

    // Offcanvas Quick Tab Buttons Navigation
    const sidebarTabBtns = Array.from(document.querySelectorAll('.sidebar-tab-btn')) as HTMLElement[];
    let currentTabIndex = 0;

    sidebarTabBtns.forEach((btn, index) => {
        if (btn.classList.contains('active')) {
            currentTabIndex = index;
        }

        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            const btnEl = btn as HTMLElement;
            const targetContentId = btnEl.dataset.targetContent;
            if (!targetContentId) return;

            const newIndex = index;
            const isSlideLeft = newIndex < currentTabIndex;
            currentTabIndex = newIndex;

            sidebarTabBtns.forEach(b => {
                b.classList.remove('active');
            });
            btnEl.classList.add('active');

            // Hide old contents
            document.querySelectorAll('.offcanvas-content').forEach((content) => {
                (content as HTMLElement).style.display = 'none';
            });

            // Load dynamic content
            await loadDynamicContent('offcanvasSidebar', targetContentId);

            // Display target content instantly and natively
            const targetEl = document.getElementById(targetContentId);
            if (targetEl) {
                targetEl.style.display = 'block';
                // Initialize accordion controls on loaded content
                initSidebarAccordions(targetEl);
                updateToggleAllAccordionsButtonState();
            }

            // Update sublabel
            const subLabelEl = document.getElementById('offcanvasSidebarSubLabel');
            if (subLabelEl) {
                const titleMap: Record<string, string> = {
                    'chartSettingsContent': 'Chart Designer',
                    'chartFormattingContent': 'Style & Formatting',
                    'chartEffectsContent': 'Visual Effects',
                    'dataContent': 'Data Source',
                    'kpiBuilderContent': 'KPI Cards',
                    'templateGalleryContent': 'Templates Gallery'
                };
                subLabelEl.textContent = titleMap[targetContentId] || 'Controls';
            }

            // Hide generic accordion search & collapse bar when viewing Template Gallery
            const sidebarSearchBar = document.querySelector('.sidebar-search-bar') as HTMLElement;
            if (sidebarSearchBar) {
                sidebarSearchBar.style.display = targetContentId === 'templateGalleryContent' ? 'none' : '';
            }

            // Sync main menu link highlight
            const correspondingLink = document.querySelector(`.main-menu-bar [data-menu-target="${targetContentId}"]`);
            if (correspondingLink) {
                document.querySelectorAll('.main-menu-bar .nav-link').forEach(l => l.classList.remove('active'));
                correspondingLink.classList.add('active');
            }
        });
    });

    // Sidebar Expand / Fullscreen Toggle
    const btnToggleSidebarFullscreen = document.getElementById('btnToggleSidebarFullscreen');
    const sidebarExpandIcon = document.getElementById('sidebarExpandIcon');
    if (btnToggleSidebarFullscreen && offcanvasSidebar) {
        btnToggleSidebarFullscreen.addEventListener('click', () => {
            if (offcanvasSidebar.classList.contains('sidebar-expanded')) {
                offcanvasSidebar.classList.remove('sidebar-expanded');
                if (sidebarExpandIcon) {
                    sidebarExpandIcon.className = 'bi bi-arrows-angle-expand';
                }
                btnToggleSidebarFullscreen.setAttribute('title', 'Expand Sidebar Width');
            } else {
                offcanvasSidebar.classList.add('sidebar-expanded');
                if (sidebarExpandIcon) {
                    sidebarExpandIcon.className = 'bi bi-arrows-angle-contract';
                }
                btnToggleSidebarFullscreen.setAttribute('title', 'Collapse Sidebar Width');
            }
        });
    }

    // Initialize Batch Accordion Toggle (Expand All / Collapse All)
    const btnToggleAllAccordions = document.getElementById('btnToggleAllAccordions');
    if (btnToggleAllAccordions) {
        btnToggleAllAccordions.addEventListener('click', () => {
            const activeContent = document.querySelector('.offcanvas-content[style*="display: block"]') || 
                                  document.querySelector('.offcanvas-content:not([style*="display: none"])');
            if (!activeContent) return;

            const cards = activeContent.querySelectorAll<HTMLElement>('.card, .sidebar-card, .card-section, .accordion-item');
            if (cards.length === 0) return;

            const anyExpanded = Array.from(cards).some(c => !c.classList.contains('is-collapsed'));

            cards.forEach(card => {
                const header = card.querySelector<HTMLElement>('.sidebar-accordion-header, .card-header, .sidebar-card-header, .accordion-header');
                if (anyExpanded) {
                    card.classList.add('is-collapsed');
                    if (header) header.setAttribute('aria-expanded', 'false');
                } else {
                    card.classList.remove('is-collapsed');
                    if (header) header.setAttribute('aria-expanded', 'true');
                }
            });

            updateToggleAllAccordionsButtonState();
        });
    }

    // Offcanvas Instant Quick Search Filter with High-Contrast Feedback & Auto-Expansion
    const sidebarQuickSearchInput = document.getElementById('sidebarQuickSearchInput') as HTMLInputElement | null;
    const clearSidebarSearchBtn = document.getElementById('clearSidebarSearchBtn');

    if (sidebarQuickSearchInput) {
        const performSearch = () => {
            const query = sidebarQuickSearchInput.value.toLowerCase().trim();
            if (clearSidebarSearchBtn) {
                clearSidebarSearchBtn.style.display = query ? 'block' : 'none';
            }

            const activeContent = document.querySelector('.offcanvas-content[style*="display: block"]') || 
                                  document.querySelector('.offcanvas-content:not([style*="display: none"])');
            if (!activeContent) return;

            const cards = activeContent.querySelectorAll<HTMLElement>('.card, .sidebar-card, .card-section, .accordion-item');

            if (!query) {
                activeContent.querySelectorAll<HTMLElement>('.row > div, .mb-3, .form-group, label, button, .p-2.5, .p-2').forEach(item => {
                    item.style.display = '';
                });
                cards.forEach(c => {
                    c.style.display = '';
                });
                updateToggleAllAccordionsButtonState();
                return;
            }

            cards.forEach(card => {
                let hasMatch = false;
                const searchableItems = card.querySelectorAll<HTMLElement>('.row > div, .mb-3, .form-group, label, button, .p-2.5, .p-2, span, p');
                searchableItems.forEach(item => {
                    const text = item.textContent ? item.textContent.toLowerCase() : '';
                    if (text.includes(query)) {
                        item.style.display = '';
                        hasMatch = true;
                    } else if (!item.querySelector('.form-control, .form-select, button, input')) {
                        item.style.display = 'none';
                    }
                });

                const cardText = card.textContent ? card.textContent.toLowerCase() : '';
                if (cardText.includes(query) || hasMatch) {
                    card.style.display = '';
                    // Auto-expand matching accordion category for instant access
                    card.classList.remove('is-collapsed');
                    const header = card.querySelector<HTMLElement>('.sidebar-accordion-header, .card-header, .sidebar-card-header, .accordion-header');
                    if (header) header.setAttribute('aria-expanded', 'true');
                } else {
                    card.style.display = 'none';
                }
            });

            // If there are standalone items outside cards
            activeContent.querySelectorAll<HTMLElement>(':scope > .mb-3, :scope > div:not(.card):not(.sidebar-card)').forEach(item => {
                const text = item.textContent ? item.textContent.toLowerCase() : '';
                item.style.display = text.includes(query) ? '' : 'none';
            });
        };

        sidebarQuickSearchInput.addEventListener('input', performSearch);

        if (clearSidebarSearchBtn) {
            clearSidebarSearchBtn.addEventListener('click', () => {
                sidebarQuickSearchInput.value = '';
                performSearch();
                sidebarQuickSearchInput.focus();
            });
        }
    }

    // Initial pass for sidebar accordions
    initSidebarAccordions(document.getElementById('offcanvasSidebar'));

    // ----------------------------------------------------
    // Arrow-Key Navigation Support for Main Menu Bar
    // ----------------------------------------------------
    const mainMenuNavLinks = Array.from(document.querySelectorAll('.main-menu-bar .nav-link')) as HTMLElement[];
    mainMenuNavLinks.forEach((link) => {
        link.setAttribute('tabindex', '0');
        
        link.addEventListener('keydown', (e: KeyboardEvent) => {
            if (['ArrowDown', 'ArrowUp', 'ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(e.key)) {
                e.preventDefault();
                e.stopPropagation();
                
                const visibleLinks = mainMenuNavLinks.filter(l => l.offsetParent !== null);
                const currIdx = visibleLinks.indexOf(link);
                if (currIdx === -1) return;

                let nextIdx = currIdx;
                if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
                    nextIdx = (currIdx + 1) % visibleLinks.length;
                } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
                    nextIdx = (currIdx - 1 + visibleLinks.length) % visibleLinks.length;
                } else if (e.key === 'Home') {
                    nextIdx = 0;
                } else if (e.key === 'End') {
                    nextIdx = visibleLinks.length - 1;
                }

                if (visibleLinks[nextIdx]) {
                    visibleLinks[nextIdx].focus();
                    visibleLinks[nextIdx].click();
                }
            } else if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                link.click();
            }
        });
    });

    // Global shortcut for arrow navigation when active on sidebar menu
    document.addEventListener('keydown', (e: KeyboardEvent) => {
        const activeEl = document.activeElement as HTMLElement | null;
        const isInputFocused = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable);
        if (isInputFocused) return;

        if (e.altKey && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
            e.preventDefault();
            const visibleLinks = mainMenuNavLinks.filter(l => l.offsetParent !== null);
            const currentActive = document.querySelector('.main-menu-bar .nav-link.active') as HTMLElement | null;
            let currIdx = currentActive ? visibleLinks.indexOf(currentActive) : -1;
            if (currIdx === -1) currIdx = 0;

            let nextIdx = e.key === 'ArrowDown' ? (currIdx + 1) % visibleLinks.length : (currIdx - 1 + visibleLinks.length) % visibleLinks.length;
            if (visibleLinks[nextIdx]) {
                visibleLinks[nextIdx].focus();
                visibleLinks[nextIdx].click();
            }
        }
    });

    // ----------------------------------------------------
    // Subtle Delayed Tooltip Implementation for Desktop
    // ----------------------------------------------------
    if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
        mainMenuNavLinks.forEach(link => {
            const rawTitle = link.getAttribute('title');
            if (rawTitle) {
                link.setAttribute('data-bs-title', rawTitle);
                link.setAttribute('data-bs-toggle', 'tooltip');
                link.setAttribute('data-bs-placement', window.innerWidth >= 992 ? 'right' : 'top');
                link.removeAttribute('title');

                new bootstrap.Tooltip(link, {
                    delay: { show: 350, hide: 100 },
                    trigger: 'hover',
                    boundary: 'viewport'
                });
            }
        });
    }

    // Lock Mode Button
    attachEventListener('toggleLockModeBtn', 'click', toggleLockMode);

    // Apply Background Template Button
    attachEventListener('applyTemplateBtn', 'click', () => {
        if (window.selectedTemplateIndex !== undefined && window.selectedTemplateIndex !== -1 && dashboardContent) {
            const selectedTemplate = backgroundTemplates[window.selectedTemplateIndex];
            if (selectedTemplate) {
                dashboardContent.style.backgroundColor = selectedTemplate.backgroundColor;
                dashboardContent.style.color = selectedTemplate.textColor;
                localStorage.setItem('dashboardBackgroundColor', selectedTemplate.backgroundColor);
                localStorage.setItem('dashboardTextColor', selectedTemplate.textColor);
                localStorage.setItem('selectedBackgroundTemplateIndex', window.selectedTemplateIndex.toString());
                showMessage(`टेम्पलेट '${selectedTemplate.name}' सफलतापूर्वक लागू किया गया है!`, 'success');
                saveDashboardSettings();
            }
        } else {
            showMessage('कृपया लागू करने के लिए एक टेम्पलेट चुनें।', 'warning');
        }
    });

    // main_handlers.js से सभी इवेंट हैंडलर संलग्न करें
    attachGlobalEventHandlers(allActiveChartInstances);

    // एडवांस्ड अतिरिक्त कार्य (Advanced Actions) इनिशियलाइज़ करें
    initializeAdvancedActions();

    // डिफ़ॉल्ट रूप से: डैशबोर्ड सेक्शन को सक्रिय रखें
    if (dashboardSection) dashboardSection.classList.add('active');

    // एडवांस प्रोफाइल सिस्टम इनिशियलाइज़ेशन
    initializeAdvancedProfileSection();
    initializeKPIAndThemes();

    // डेटा ट्रांसफ़ॉर्मर और प्रोफाइलिंग इनिशियलाइज़ेशन
    initializeDataTransformerUI();

    // 60-सेकंड ऑटो-सेव इंजन प्रारंभ करें
    initPeriodicAutosave(60000);

    // तुलना मोड टॉगल बटन
    const btnToggleComp = document.getElementById('btnToggleComparisonView');
    if (btnToggleComp) {
        btnToggleComp.addEventListener('click', () => {
            toggleComparisonView();
        });
    }

    // Saved Views Gallery Modal Button
    const btnSavedViews = document.getElementById('btnOpenSavedViewsModal');
    if (btnSavedViews) {
        btnSavedViews.addEventListener('click', () => {
            openSavedViewsGalleryModal();
        });
        updateSavedViewsBadgeCount();
    }

    // Auto Arrange Grid Layout Button
    const btnAutoGrid = document.getElementById('btnAutoArrangeGrid');
    if (btnAutoGrid) {
        btnAutoGrid.addEventListener('click', () => {
            autoArrangeGridLayout(2);
        });
    }

    const autosaveBadge = document.getElementById('autosaveStatusBadge');
    if (autosaveBadge) {
        autosaveBadge.addEventListener('click', () => {
            saveDashboardSettings();
        });
    }

    // Verify all CDN libraries and recover if any are broken/missing
    verifyAndRecoverCDNs().then(() => {
        console.log('[CDN Fallback Engine] CDN Verification completed successfully.');
        setTimeout(function() {
            const loadingOverlay = document.getElementById('loadingOverlay');
            if (loadingOverlay) {
                loadingOverlay.classList.add('fade-out');
                setTimeout(function() {
                    loadingOverlay.style.setProperty('display', 'none', 'important');
                }, 500); // matching CSS 0.5s transition
            }
        }, 800);
    }).catch(err => {
        console.error('[CDN Fallback Engine] Critical failure during CDN recovery:', err);
        // Hide loader anyway as fallback so the app is not stuck forever
        setTimeout(function() {
            const loadingOverlay = document.getElementById('loadingOverlay');
            if (loadingOverlay) {
                loadingOverlay.classList.add('fade-out');
                setTimeout(function() {
                    loadingOverlay.style.setProperty('display', 'none', 'important');
                }, 500);
            }
        }, 1000);
    });
});

// ====================================================================
// एडवांस प्रोफाइल सेक्शन हेल्पर फंक्शन्स
// ====================================================================

export function updateUserProfileUI(): void {
    // 1. User Info
    const displayNameInput = document.getElementById('profileDisplayName') as HTMLInputElement | null;
    const emailSpan = document.getElementById('profileUserEmail');
    const avatarDiv = document.getElementById('userAvatar');
    const bioInput = document.getElementById('profileBioInput') as HTMLInputElement | null;

    let email = "user@vedrabi.com";
    let name = "Pro Analyst";

    if ((auth as any).currentUser) {
        email = (auth as any).currentUser.email || email;
        name = (auth as any).currentUser.displayName || email.split('@')[0];
    } else {
        const savedEmail = localStorage.getItem('profileEmail');
        if (savedEmail) email = savedEmail;
        const savedName = localStorage.getItem('profileDisplayName');
        if (savedName) name = savedName;
    }

    if (displayNameInput) displayNameInput.value = name;
    if (emailSpan) emailSpan.textContent = email;
    if (avatarDiv) {
        avatarDiv.textContent = name.charAt(0).toUpperCase();
    }

    // Display Unique Account ID
    const acc = SecurityManager.getAccount(email);
    const accountIdVal = acc ? acc.accountId : ('@' + email.split('@')[0]);
    const profileAccDisplay = document.getElementById('profileAccountIdDisplay');
    const modalAccDisplay = document.getElementById('modalProfileAccountId');
    if (profileAccDisplay) profileAccDisplay.textContent = accountIdVal;
    if (modalAccDisplay) modalAccDisplay.textContent = accountIdVal;

    // Populate Onboarding preferences
    const onboarding: any = OnboardingManager.getOnboarding(email);
    const obBadge = document.getElementById('onboardingStatusBadge');
    const obRoles = document.getElementById('profileOnboardingRoles');
    const obGoals = document.getElementById('profileOnboardingGoals');
    const obLang = document.getElementById('profileOnboardingLang');
    const obTeam = document.getElementById('profileOnboardingTeam');
    const obFreq = document.getElementById('profileOnboardingFreq');

    if (onboarding) {
        if (obBadge) {
            obBadge.className = 'badge bg-success bg-opacity-10 text-success fw-bold';
            obBadge.innerHTML = '<i class="bi bi-check-circle-fill me-1"></i> पूर्ण ऑनबोर्डिंग';
        }
        if (obLang) {
            obLang.textContent = onboarding.language === 'hi' ? 'हिंदी (Hindi)' : 'English';
        }
        if (obRoles) {
            obRoles.textContent = (onboarding.roles && onboarding.roles.length) ? onboarding.roles.join(', ') : 'BI Analyst';
        }
        if (obGoals) {
            obGoals.textContent = (onboarding.goals && onboarding.goals.length) ? onboarding.goals.join(', ') : 'Excel Charts & AI Analytics';
        }
        if (obTeam) {
            obTeam.textContent = onboarding.teamSize || 'Small Team (2-10)';
        }
        if (obFreq) {
            obFreq.textContent = onboarding.updateFrequency || 'Daily Refresh';
        }
    } else {
        if (obBadge) {
            obBadge.className = 'badge bg-warning bg-opacity-10 text-warning fw-bold';
            obBadge.innerHTML = '<i class="bi bi-clock-history me-1"></i> अधूरा';
        }
        if (obLang) obLang.textContent = 'English';
        if (obRoles) obRoles.textContent = 'सेट नहीं किया गया';
        if (obGoals) obGoals.textContent = 'सेट नहीं किया गया';
        if (obTeam) obTeam.textContent = 'N/A';
        if (obFreq) obFreq.textContent = 'N/A';
    }

    // Load bio
    if (bioInput) {
        bioInput.value = localStorage.getItem('profileBio') || "Vedra BI डेशबोर्ड विश्लेषक।";
    }

    // Load subscription plan badge
    const profileUserBadge = document.getElementById('profileUserBadge');
    if (profileUserBadge) {
        const planValue = localStorage.getItem('userSubscriptionPlan') || 'Pro';
        if (planValue === 'Basic') {
            profileUserBadge.className = "badge bg-white text-secondary fw-bold px-3 py-1.5 shadow-sm";
            profileUserBadge.innerHTML = '<i class="bi bi-person text-secondary me-1"></i> बेसिक यूजर (Basic User)';
        } else if (planValue === 'Pro') {
            profileUserBadge.className = "badge bg-white text-primary fw-bold px-3 py-1.5 shadow-sm";
            profileUserBadge.innerHTML = '<i class="bi bi-star-fill text-warning me-1"></i> प्रो विश्लेषक (Pro Analyst)';
        } else if (planValue === 'Enterprise') {
            profileUserBadge.className = "badge bg-white text-danger fw-bold px-3 py-1.5 shadow-sm";
            profileUserBadge.innerHTML = '<i class="bi bi-shield-fill-check text-danger me-1"></i> एंटरप्राइज प्रो (Enterprise)';
        }
    }

    // 2. Stats
    const statCharts = document.getElementById('statTotalCharts');
    const statRows = document.getElementById('statTotalRows');
    const statAI = document.getElementById('statTotalAIQueries');
    const statTheme = document.getElementById('statActiveTheme');

    if (statCharts) {
        const count = document.querySelectorAll('.chart-canvas, .js-plotly-plot, .chart-container').length;
        statCharts.textContent = count ? count.toString() : (allActiveChartInstances.length ? allActiveChartInstances.length.toString() : "0");
    }
    if (statRows) {
        try {
            const rawData = getRawData();
            statRows.textContent = (rawData && rawData.length) ? rawData.length.toString() : "0";
        } catch (e) {
            statRows.textContent = "0";
        }
    }
    if (statAI) {
        let queryCount = parseInt(localStorage.getItem('vedrabi_ai_query_count') || '0', 10);
        if (queryCount === 0) {
            queryCount = 12;
            localStorage.setItem('vedrabi_ai_query_count', queryCount.toString());
        }
        statAI.textContent = queryCount.toString();
    }
    if (statTheme) {
        const isDark = document.body.classList.contains('dark-theme') || localStorage.getItem('theme') === 'dark';
        statTheme.textContent = isDark ? "डार्क थीम" : "लाइट थीम";
    }
}

function hexToRgb(hex: string): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '13, 110, 253';
}

export function applyAccentColor(accent: string): void {
    let primaryColorHex = '#0d6efd';
    if (accent === 'success') primaryColorHex = '#198754';
    else if (accent === 'danger') primaryColorHex = '#dc3545';
    else if (accent === 'warning') primaryColorHex = '#ffc107';
    else if (accent === 'dark') primaryColorHex = '#212529';

    let styleEl = document.getElementById('theme-accent-styles');
    if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'theme-accent-styles';
        document.head.appendChild(styleEl);
    }
    styleEl.textContent = `
        :root {
            --bs-primary: ${primaryColorHex} !important;
            --bs-primary-rgb: ${hexToRgb(primaryColorHex)} !important;
        }
        .text-primary { color: ${primaryColorHex} !important; }
        .bg-primary { background-color: ${primaryColorHex} !important; }
        .btn-primary { background-color: ${primaryColorHex} !important; border-color: ${primaryColorHex} !important; }
        .border-primary { border-color: ${primaryColorHex} !important; }
    `;

    document.querySelectorAll('.btn-accent-theme').forEach(btn => {
        const btnEl = btn as HTMLElement;
        if (btnEl.getAttribute('data-theme-accent') === accent) {
            btnEl.style.borderColor = '#ffffff';
            btnEl.style.boxShadow = '0 0 0 3px rgba(13, 110, 253, 0.5)';
        } else {
            btnEl.style.borderColor = 'transparent';
            btnEl.style.boxShadow = 'none';
        }
    });
}

export function initializeAdvancedProfileSection(): void {
    // 1. Load active accent on start
    const savedAccent = localStorage.getItem('themeAccent') || 'primary';
    applyAccentColor(savedAccent);

    // 2. Add click handlers for theme accent selection
    document.querySelectorAll('.btn-accent-theme').forEach(btn => {
        btn.addEventListener('click', () => {
            const accent = btn.getAttribute('data-theme-accent');
            if (accent) {
                localStorage.setItem('themeAccent', accent);
                applyAccentColor(accent);
                showMessage("थीम एक्सेंट सफलतापूर्वक बदला गया!", "success");
            }
        });
    });

    // 3. User display name changing
    const displayNameInput = document.getElementById('profileDisplayName') as HTMLInputElement | null;
    const avatarDiv = document.getElementById('userAvatar');
    if (displayNameInput) {
        displayNameInput.addEventListener('change', () => {
            const newName = displayNameInput.value.trim();
            if (newName) {
                localStorage.setItem('profileDisplayName', newName);
                if (avatarDiv) {
                    avatarDiv.textContent = newName.charAt(0).toUpperCase();
                }
                showMessage("डिस्प्ले नाम सफलतापूर्वक अपडेट किया गया!", "success");
            }
        });
    }

    // 4. Bio Saving
    const saveBioBtn = document.getElementById('saveBioBtn');
    const bioInput = document.getElementById('profileBioInput') as HTMLInputElement | null;
    if (saveBioBtn && bioInput) {
        saveBioBtn.addEventListener('click', () => {
            const bioVal = bioInput.value.trim();
            localStorage.setItem('profileBio', bioVal);
            showMessage("बायो सफलतापूर्वक सेव किया गया!", "success");
        });
    }

    // 4b. Subscription Plan Custom Selector Logic
    const planLabels = document.querySelectorAll('.custom-plan-radio');
    
    function updatePlanUI(selectedPlan: string): void {
        planLabels.forEach(label => {
            const radio = label.querySelector('input[type="radio"]') as HTMLInputElement | null;
            const checkmark = label.querySelector('.plan-checkmark') as HTMLElement | null;
            if (!radio || !checkmark) return;
            const labelEl = label as HTMLElement;
            
            if (radio.value === selectedPlan) {
                radio.checked = true;
                labelEl.style.borderColor = '#2563eb';
                labelEl.style.backgroundColor = '#eff6ff';
                checkmark.style.borderColor = '#2563eb';
                checkmark.style.backgroundColor = '#2563eb';
                checkmark.innerHTML = '<i class="bi bi-check-lg text-white" style="font-size: 11px; line-height: 1;"></i>';
            } else {
                radio.checked = false;
                labelEl.style.borderColor = '#cbd5e1';
                labelEl.style.backgroundColor = '#fafafc';
                checkmark.style.borderColor = '#cbd5e1';
                checkmark.style.backgroundColor = 'transparent';
                checkmark.innerHTML = '';
            }
        });
    }

    const savedPlan = localStorage.getItem('userSubscriptionPlan') || 'Pro';
    updatePlanUI(savedPlan);

    planLabels.forEach(label => {
        label.addEventListener('click', () => {
            const radio = label.querySelector('input[type="radio"]') as HTMLInputElement | null;
            if (radio) {
                updatePlanUI(radio.value);
            }
        });
    });

    const btnSavePlan = document.getElementById('btnSavePlan');
    if (btnSavePlan) {
        btnSavePlan.addEventListener('click', () => {
            const selectedRadio = document.querySelector('input[name="user_subscription_plan"]:checked') as HTMLInputElement | null;
            if (selectedRadio) {
                const planValue = selectedRadio.value;
                localStorage.setItem('userSubscriptionPlan', planValue);
                
                const profileUserBadge = document.getElementById('profileUserBadge');
                if (profileUserBadge) {
                    if (planValue === 'Basic') {
                        profileUserBadge.className = "badge bg-white text-secondary fw-bold px-3 py-1.5 shadow-sm";
                        profileUserBadge.innerHTML = '<i class="bi bi-person text-secondary me-1"></i> बेसिक यूजर (Basic User)';
                    } else if (planValue === 'Pro') {
                        profileUserBadge.className = "badge bg-white text-primary fw-bold px-3 py-1.5 shadow-sm";
                        profileUserBadge.innerHTML = '<i class="bi bi-star-fill text-warning me-1"></i> प्रो विश्लेषक (Pro Analyst)';
                    } else if (planValue === 'Enterprise') {
                        profileUserBadge.className = "badge bg-white text-danger fw-bold px-3 py-1.5 shadow-sm";
                        profileUserBadge.innerHTML = '<i class="bi bi-shield-fill-check text-danger me-1"></i> एंटरप्राइज प्रो (Enterprise)';
                    }
                }
                
                showMessage(`प्लान सफलतापूर्वक बदल दिया गया: ${planValue}!`, "success");
            }
        });
    }

    // 5. Dashboard Backup
    const btnBackup = document.getElementById('btnBackupDashboard');
    if (btnBackup) {
        btnBackup.addEventListener('click', () => {
            try {
                const backupData: Record<string, string | null> = {};
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key) {
                        backupData[key] = localStorage.getItem(key);
                    }
                }
                const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `vedrabi_dashboard_backup_${new Date().toISOString().slice(0, 10)}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                showMessage("डैशबोर्ड बैकअप फ़ाइल सफलतापूर्वक डाउनलोड की गई!", "success");
            } catch (err: any) {
                showMessage("बैकअप फ़ाइल तैयार करने में त्रुटि: " + err.message, "danger");
            }
        });
    }

    // 6. Dashboard Restore
    const restoreInput = document.getElementById('restoreFileInput') as HTMLInputElement | null;
    if (restoreInput) {
        restoreInput.addEventListener('change', (e) => {
            const target = e.target as HTMLInputElement;
            const file = target.files ? target.files[0] : null;
            if (!file) return;
            const reader = new FileReader();
            reader.onload = function(evt) {
                try {
                    const resultStr = evt.target?.result as string;
                    const backupData = JSON.parse(resultStr);
                    if (typeof backupData !== 'object' || backupData === null) {
                        throw new Error("अमान्य बैकअप फ़ाइल प्रारूप");
                    }
                    // Current localStorage clear and restore
                    localStorage.clear();
                    for (const [key, val] of Object.entries(backupData)) {
                        if (typeof val === 'string') {
                            localStorage.setItem(key, val);
                        }
                    }
                    showMessage("डैशबोर्ड सफलतापूर्वक रीस्टोर किया गया! पेज पुनः लोड हो रहा है...", "success");
                    setTimeout(() => {
                        window.location.reload();
                    }, 1500);
                } catch (err: any) {
                    showMessage("रीस्टोर करने में त्रुटि: " + err.message, "danger");
                }
            };
            reader.readAsText(file);
        });
    }

    // 7. Reset Dashboard All
    const btnReset = document.getElementById('btnResetDashboardAll');
    if (btnReset) {
        btnReset.addEventListener('click', () => {
            if (confirm("क्या आप वाकई सभी डैशबोर्ड सेटिंग्स, कस्टम इफ़ेक्ट्स और डेटा को रीसेट करना चाहते हैं? यह प्रक्रिया अपरिवर्तनीय है।")) {
                localStorage.clear();
                showMessage("डैशबोर्ड रीसेट हो गया है! पेज पुनः लोड हो रहा है...", "info");
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            }
        });
    }

    // 8. Security Account Management & 8-Digit PIN Update
    const copyAccountId = (btnId: string, displayId: string) => {
        const btn = document.getElementById(btnId);
        const disp = document.getElementById(displayId);
        if (btn && disp) {
            btn.addEventListener('click', () => {
                const text = disp.textContent ? disp.textContent.trim() : '';
                navigator.clipboard.writeText(text).then(() => {
                    showMessage("यूनिक अकाउंट ID क्लिपबोर्ड पर कॉपी की गई: " + text, "success");
                }).catch(() => {
                    showMessage("ID: " + text, "info");
                });
            });
        }
    };
    copyAccountId('copyAccountIdBtn', 'profileAccountIdDisplay');
    copyAccountId('modalCopyAccountIdBtn', 'modalProfileAccountId');

    // Toggle inline PIN change box
    const setupPinBoxToggler = (openBtnId: string, boxId: string, cancelBtnId: string) => {
        const openBtn = document.getElementById(openBtnId);
        const box = document.getElementById(boxId);
        const cancelBtn = document.getElementById(cancelBtnId);
        if (openBtn && box) {
            openBtn.addEventListener('click', () => {
                box.classList.toggle('d-none');
            });
        }
        if (cancelBtn && box) {
            cancelBtn.addEventListener('click', () => {
                box.classList.add('d-none');
            });
        }
    };
    setupPinBoxToggler('openChangePinBtn', 'inlineChangePinBox', 'cancelChangePinBtn');
    setupPinBoxToggler('modalOpenChangePinBtn', 'modalInlineChangePinBox', 'modalCancelChangePinBtn');

    // Change 8-Digit PIN handler
    const setupSavePinHandler = (saveBtnId: string, currInputId: string, newInputId: string, confirmInputId: string, feedbackId: string, boxId: string) => {
        const saveBtn = document.getElementById(saveBtnId);
        if (!saveBtn) return;
        saveBtn.addEventListener('click', async () => {
            const currInput = document.getElementById(currInputId) as HTMLInputElement | null;
            const newInput = document.getElementById(newInputId) as HTMLInputElement | null;
            const confirmInput = document.getElementById(confirmInputId) as HTMLInputElement | null;
            const feedback = document.getElementById(feedbackId);
            const box = document.getElementById(boxId);

            if (feedback) {
                feedback.classList.add('d-none');
                feedback.className = 'small mb-2 d-none';
            }

            const curr = currInput ? currInput.value.trim() : '';
            const newP = newInput ? newInput.value.trim() : '';
            const confP = confirmInput ? confirmInput.value.trim() : '';

            let email = (auth as any).currentUser ? (auth as any).currentUser.email : '';
            if (!email) {
                const saved = localStorage.getItem('vedrabi_current_user');
                if (saved) {
                    try { email = JSON.parse(saved).email; } catch(e){}
                }
            }
            if (!email) email = 'user@vedrabi.com';

            if (!curr) {
                if (feedback) {
                    feedback.textContent = 'वर्तमान 8-डिजिट सुरक्षा पासवर्ड दर्ज करें।';
                    feedback.className = 'small mb-2 text-danger fw-bold';
                }
                return;
            }

            const isCurrentCorrect = await SecurityManager.verifyPinAsync(email, curr);
            if (!isCurrentCorrect) {
                if (feedback) {
                    feedback.textContent = 'वर्तमान 8-डिजिट सुरक्षा पासवर्ड गलत है!';
                    feedback.className = 'small mb-2 text-danger fw-bold';
                }
                return;
            }

            if (newP.length !== 8) {
                if (feedback) {
                    feedback.textContent = 'नया सुरक्षा पासवर्ड ठीक 8 अंकों/अक्षरों का होना अनिवार्य है।';
                    feedback.className = 'small mb-2 text-danger fw-bold';
                }
                return;
            }

            if (newP !== confP) {
                if (feedback) {
                    feedback.textContent = 'नया पासवर्ड और पुष्टि पासवर्ड मेल नहीं खा रहे हैं।';
                    feedback.className = 'small mb-2 text-danger fw-bold';
                }
                return;
            }

            const acc = SecurityManager.getAccount(email);
            const accountId = acc ? acc.accountId : ('@' + email.split('@')[0]);

            await SecurityManager.saveSecurityProfileAsync(email, accountId, newP);
            SecurityManager.markSessionVerified(email);

            if (currInput) currInput.value = '';
            if (newInput) newInput.value = '';
            if (confirmInput) confirmInput.value = '';
            if (box) box.classList.add('d-none');

            showMessage("8-डिजिट सुरक्षा पासवर्ड सफलतापूर्वक बदल दिया गया है!", "success");
        });
    };

    setupSavePinHandler('saveNewPinBtn', 'currPinInput', 'newPinInput', 'confirmNewPinInput', 'changePinFeedback', 'inlineChangePinBox');
    setupSavePinHandler('modalSaveNewPinBtn', 'modalCurrPinInput', 'modalNewPinInput', 'modalConfirmNewPinInput', 'modalChangePinFeedback', 'modalInlineChangePinBox');
}
