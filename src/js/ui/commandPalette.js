// src/js/ui/commandPalette.js
import { showMessage } from '../core/utils.ts';
import { t, getCurrentLanguage, onLanguageChange } from '../i18n/index.ts';

export function initializeCommandPalette() {
    // 1. Inject Styles for spotlight search
    if (!document.getElementById('commandPaletteStyles')) {
        const style = document.createElement('style');
        style.id = 'commandPaletteStyles';
        style.innerHTML = `
            .command-palette-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: rgba(15, 23, 42, 0.6);
                backdrop-filter: blur(8px);
                -webkit-backdrop-filter: blur(8px);
                z-index: 100100;
                display: none;
                align-items: flex-start;
                justify-content: center;
                padding-top: 12vh;
                animation: cpFadeIn 0.2s ease-out;
            }
            
            .command-palette-card {
                width: 100%;
                max-width: 620px;
                background: #ffffff;
                border-radius: 16px;
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 1px rgba(0,0,0,0.1);
                border: 1px solid #e2e8f0;
                overflow: hidden;
                display: flex;
                flex-direction: column;
                max-height: 500px;
                animation: cpScaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
            }
            
            body.dark-theme .command-palette-card {
                background: #0f172a;
                color: #f8fafc;
                border-color: #1e293b;
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 1px rgba(255,255,255,0.1);
            }
            
            .command-palette-input-wrapper {
                display: flex;
                align-items: center;
                padding: 16px 20px;
                border-bottom: 1px solid #f1f5f9;
            }
            
            body.dark-theme .command-palette-input-wrapper {
                border-color: #1e293b;
            }
            
            .command-palette-search-icon {
                font-size: 20px;
                color: #64748b;
                margin-right: 14px;
            }
            
            .command-palette-input {
                flex-grow: 1;
                border: none;
                background: transparent;
                outline: none;
                font-size: 16px;
                color: #0f172a;
                font-family: inherit;
            }
            
            body.dark-theme .command-palette-input {
                color: #f8fafc;
            }
            
            .command-palette-input::placeholder {
                color: #94a3b8;
            }
            
            .command-palette-results {
                overflow-y: auto;
                padding: 8px;
                flex-grow: 1;
            }
            
            .command-palette-item {
                display: flex;
                align-items: center;
                padding: 10px 14px;
                border-radius: 10px;
                cursor: pointer;
                transition: background-color 0.15s, transform 0.1s;
                user-select: none;
            }
            
            .command-palette-item:active {
                transform: scale(0.995);
            }
            
            .command-palette-item.selected {
                background-color: #f1f5f9;
            }
            
            body.dark-theme .command-palette-item.selected {
                background-color: #1e293b;
            }
            
            .command-palette-item-icon-box {
                width: 36px;
                height: 36px;
                border-radius: 8px;
                background-color: #f8fafc;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
                color: #475569;
                margin-right: 14px;
                border: 1px solid #e2e8f0;
            }
            
            body.dark-theme .command-palette-item-icon-box {
                background-color: #1e293b;
                color: #94a3b8;
                border-color: #334155;
            }
            
            .command-palette-item.selected .command-palette-item-icon-box {
                background-color: #8b5cf6;
                color: #ffffff;
                border-color: #8b5cf6;
            }
            
            .command-palette-item-details {
                display: flex;
                flex-direction: column;
                flex-grow: 1;
            }
            
            .command-palette-item-name {
                font-size: 14px;
                font-weight: 600;
                color: #1e293b;
                margin-bottom: 2px;
            }
            
            body.dark-theme .command-palette-item-name {
                color: #f1f5f9;
            }
            
            .command-palette-item.selected .command-palette-item-name {
                color: #6366f1;
            }
            
            body.dark-theme .command-palette-item.selected .command-palette-item-name {
                color: #a5b4fc;
            }
            
            .command-palette-item-desc {
                font-size: 12px;
                color: #64748b;
            }
            
            body.dark-theme .command-palette-item-desc {
                color: #94a3b8;
            }
            
            .command-palette-item-badge {
                font-size: 11px;
                font-weight: 500;
                background: #f1f5f9;
                color: #475569;
                padding: 3px 8px;
                border-radius: 6px;
                border: 1px solid #e2e8f0;
            }
            
            body.dark-theme .command-palette-item-badge {
                background: #334155;
                color: #cbd5e1;
                border-color: #475569;
            }
            
            .command-palette-footer {
                padding: 10px 16px;
                background-color: #f8fafc;
                border-top: 1px solid #f1f5f9;
                display: flex;
                align-items: center;
                justify-content: space-between;
                font-size: 12px;
                color: #64748b;
            }
            
            body.dark-theme .command-palette-footer {
                background-color: #0b1120;
                border-color: #1e293b;
                color: #94a3b8;
            }
            
            .command-palette-empty {
                padding: 32px 16px;
                text-align: center;
                color: #64748b;
            }
            
            @keyframes cpFadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            @keyframes cpScaleUp {
                from {
                    opacity: 0;
                    transform: scale(0.97) translateY(-8px);
                }
                to {
                    opacity: 1;
                    transform: scale(1) translateY(0);
                }
            }
        `;
        document.head.appendChild(style);
    }

    // 2. Define search actions & targets with dynamic multilingual translation
    function getCommandsList() {
        return [
            {
                id: 'tour',
                name: t('commandPalette.tourName', '💡 Start Interactive Guided Tour'),
                desc: t('commandPalette.tourDesc', 'Walk through all dashboard features step-by-step'),
                icon: 'bi-compass',
                keywords: 'tour help guide tutorial मदद जानकारी मार्गदर्शन પ્રવાસ માર્ગદર્શન મદદ',
                action: () => {
                    if (window.startDashboardGuidedTour) {
                        window.startDashboardGuidedTour();
                    } else {
                        showMessage(t('common.loading', 'Loading...'), "info");
                    }
                }
            },
            {
                id: 'theme_toggle',
                name: t('commandPalette.themeToggleName', '🌗 Toggle Theme (Dark/Light)'),
                desc: t('commandPalette.themeToggleDesc', 'Switch seamlessly between Dark and Light themes'),
                icon: 'bi-moon-stars',
                keywords: 'theme dark light color black white थीम ब्लैक वाइट डार्क लाइट થીમ ડાર્ક લાઇટ રંગ',
                action: () => {
                    document.getElementById('toggleTheme')?.click();
                }
            },
            {
                id: 'presentation',
                name: t('commandPalette.presentationName', '💻 Start Presentation Mode'),
                desc: t('commandPalette.presentationDesc', 'Launch full-screen slide deck with laser pointer'),
                icon: 'bi-projector',
                keywords: 'presentation show slides play laser fullscreen પ્રેઝન્ટેશન લેસર સ્લાઇડ્સ प्रेजेंटेशन लेज़र स्लाइड',
                action: () => {
                    if (window.openDashboardPresentationMode) {
                        window.openDashboardPresentationMode();
                    } else {
                        document.getElementById('btnStartPresentation')?.click();
                    }
                }
            },
            {
                id: 'audio_narrator',
                name: t('commandPalette.audioNarratorName', '🎙️ Play Audio Briefing Summary'),
                desc: t('commandPalette.audioNarratorDesc', 'Listen to AI-synthesized executive narration of metrics'),
                icon: 'bi-volume-up',
                keywords: 'audio voice speak summary narrator sound आवाज़ सारांश भाषण ऑडियो ઓડિયો અવાજ સારાંશ',
                action: () => {
                    if (window.toggleDashboardAudioNarrator) {
                        window.toggleDashboardAudioNarrator();
                    } else {
                        document.getElementById('btnAudioNarrator')?.click();
                    }
                }
            },
            {
                id: 'add_record',
                name: t('commandPalette.addRecordName', '➕ Add New Data Record'),
                desc: t('commandPalette.addRecordDesc', 'Insert a new row into the active business dataset'),
                icon: 'bi-plus-square',
                keywords: 'add row insert record data नया रिकॉर्ड जोड़ें डेटा जोड़ें નવો રેકોર્ડ ઉમેરો',
                action: () => {
                    document.getElementById('addDataBtn')?.click();
                }
            },
            {
                id: 'data_audit',
                name: t('commandPalette.dataAuditName', '🛡️ Run Data Quality Audit'),
                desc: t('commandPalette.dataAuditDesc', 'Check dataset for nulls, anomalies, and type integrity'),
                icon: 'bi-shield-check',
                keywords: 'audit quality test diagnostics checker डेटा ऑडिट सुरक्षा जाँच ડેટા ગુણવત્તા ઓડિટ',
                action: () => {
                    document.getElementById('btnDataAudit')?.click();
                }
            },
            {
                id: 'export_pdf',
                name: t('commandPalette.exportPdfName', '📄 Download Executive PDF Report'),
                desc: t('commandPalette.exportPdfDesc', 'Export print-ready styled PDF document of your dashboard'),
                icon: 'bi-file-pdf',
                keywords: 'pdf report download print export पीडीएफ रिपोर्ट प्रिंट ડાઉનલોડ પીડીએફ રિપોર્ટ',
                action: () => {
                    document.getElementById('exportPDFBtn')?.click();
                }
            },
            {
                id: 'export_png',
                name: t('commandPalette.exportPngName', '🖼️ Snapshot Dashboard to PNG'),
                desc: t('commandPalette.exportPngDesc', 'Capture high-resolution image of entire canvas'),
                icon: 'bi-image',
                keywords: 'png image picture screenshot camera स्नैपशॉट इमेज स्क्रीनशॉट ઇમેજ ચિત્ર',
                action: () => {
                    document.getElementById('exportPNGDashboardBtn')?.click();
                }
            },
            {
                id: 'download_template',
                name: t('commandPalette.downloadTemplateName', '📥 Download Excel Template'),
                desc: t('commandPalette.downloadTemplateDesc', 'Get formatted starter spreadsheet for easy data entry'),
                icon: 'bi-download',
                keywords: 'excel download sheet template xlsx एक्सेल टेम्पलेट એક્સેલ ટેમ્પલેટ ડાઉનલોડ',
                action: () => {
                    document.getElementById('downloadTemplateSidebar')?.click() || document.getElementById('downloadTemplate')?.click();
                }
            },
            {
                id: 'add_chart',
                name: t('commandPalette.addChartName', '📈 Open Chart Designer'),
                desc: t('commandPalette.addChartDesc', 'Create new 2D/3D visualizations and map column axes'),
                icon: 'bi-bar-chart',
                keywords: 'chart bar line pie scatter design विज़ुअलाइज़ेशन चार्ट बनाएं ચાર્ટ ડિઝાઇનર',
                action: () => {
                    document.getElementById('menuCharts')?.click();
                }
            },
            {
                id: 'add_kpi',
                name: t('commandPalette.addKpiName', '⭐ Create KPI Sparkline Card'),
                desc: t('commandPalette.addKpiDesc', 'Design metric cards with live mini-trend charts'),
                icon: 'bi-patch-check-fill',
                keywords: 'kpi sparkline card target metric केपीआई कार्ड મેટ્રિક કેપીઆઈ કાર્ડ',
                action: () => {
                    document.getElementById('menuKpiBuilder')?.click();
                }
            },
            {
                id: 'filters',
                name: t('commandPalette.filtersName', '⏳ Open Filters & Sorters'),
                desc: t('commandPalette.filtersDesc', 'Apply multi-column filters, ranges, and sort rules'),
                icon: 'bi-funnel',
                keywords: 'filter sort search query slice फ़िल्टर सॉर्ट ફિલ્ટર સૉર્ટ',
                action: () => {
                    document.getElementById('menuFilters')?.click();
                }
            },
            {
                id: 'chat_ai',
                name: t('commandPalette.chatAiName', '🤖 Open AI Business Assistant'),
                desc: t('commandPalette.chatAiDesc', 'Ask questions in natural language or request auto-insights'),
                icon: 'bi-robot',
                keywords: 'ai chat bot assistant help insights चैट एआई આર્ટિફિશિયલ ચેટ સહાયક',
                action: () => {
                    document.getElementById('openChatbotBtn')?.click();
                }
            }
        ];
    }

    // 3. Create Palette DOM Container
    let overlay = document.getElementById('commandPaletteOverlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'commandPaletteOverlay';
        overlay.className = 'command-palette-overlay';
        
        overlay.innerHTML = `
            <div class="command-palette-card" id="commandPaletteCard">
                <div class="command-palette-input-wrapper">
                    <i class="bi bi-search command-palette-search-icon"></i>
                    <input type="text" class="command-palette-input" id="commandPaletteInput" 
                           placeholder="${t('commandPalette.searchPlaceholder', 'Search commands, tools, charts or shortcuts (Ctrl+K)...')}" 
                           autocomplete="off" spellcheck="false">
                    <span class="command-palette-item-badge">ESC</span>
                </div>
                <div class="command-palette-results" id="commandPaletteResults">
                    <!-- Results will be dynamically populated -->
                </div>
                <div class="command-palette-footer">
                    <div class="d-flex align-items-center gap-3">
                        <span><kbd class="bg-dark text-white px-1.5 py-0.5 rounded text-xs">↑</kbd> <kbd class="bg-dark text-white px-1.5 py-0.5 rounded text-xs">↓</kbd> ${t('commandPalette.navigateHint', 'Navigate')}</span>
                        <span><kbd class="bg-dark text-white px-1.5 py-0.5 rounded text-xs">↵</kbd> ${t('commandPalette.selectHint', 'Select')}</span>
                    </div>
                    <div>
                        <span><kbd class="bg-dark text-white px-1.5 py-0.5 rounded text-xs">ESC</kbd> ${t('commandPalette.closeHint', 'Close')}</span>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
    }

    const input = document.getElementById('commandPaletteInput');
    const resultsContainer = document.getElementById('commandPaletteResults');
    let selectedIndex = 0;
    let filteredCommands = [];

    function renderResults(filterText = '') {
        const query = filterText.toLowerCase().trim();
        const commandsList = getCommandsList();
        
        filteredCommands = commandsList.filter(cmd => {
            if (!query) return true;
            return cmd.name.toLowerCase().includes(query) ||
                   cmd.desc.toLowerCase().includes(query) ||
                   (cmd.keywords && cmd.keywords.toLowerCase().includes(query));
        });

        if (filteredCommands.length === 0) {
            resultsContainer.innerHTML = `
                <div class="command-palette-empty">
                    <i class="bi bi-search fs-2 mb-2 d-block text-secondary opacity-50"></i>
                    <div class="fw-semibold">${t('commandPalette.noResults', 'No matching commands found.')}</div>
                    <div class="text-xs text-muted mt-1">Try another keyword in English, Hindi or Gujarati</div>
                </div>
            `;
            return;
        }

        if (selectedIndex >= filteredCommands.length) {
            selectedIndex = 0;
        }

        resultsContainer.innerHTML = '';
        filteredCommands.forEach((cmd, idx) => {
            const item = document.createElement('div');
            item.className = `command-palette-item ${idx === selectedIndex ? 'selected' : ''}`;
            item.dataset.index = idx;
            
            item.innerHTML = `
                <div class="command-palette-item-icon-box">
                    <i class="bi ${cmd.icon}"></i>
                </div>
                <div class="command-palette-item-details">
                    <div class="command-palette-item-name">${cmd.name}</div>
                    <div class="command-palette-item-desc">${cmd.desc}</div>
                </div>
                <div class="command-palette-item-badge">Enter</div>
            `;

            item.addEventListener('mouseenter', () => {
                selectedIndex = idx;
                updateSelection();
            });

            item.addEventListener('click', () => {
                executeCommand(idx);
            });

            resultsContainer.appendChild(item);
        });

        scrollSelectedIntoView();
    }

    function updateSelection() {
        const items = resultsContainer.querySelectorAll('.command-palette-item');
        items.forEach((it, idx) => {
            if (idx === selectedIndex) {
                it.classList.add('selected');
            } else {
                it.classList.remove('selected');
            }
        });
        scrollSelectedIntoView();
    }

    function scrollSelectedIntoView() {
        const selected = resultsContainer.querySelector('.command-palette-item.selected');
        if (selected) {
            selected.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
    }

    function executeCommand(index) {
        if (filteredCommands[index] && typeof filteredCommands[index].action === 'function') {
            closePalette();
            setTimeout(() => {
                filteredCommands[index].action();
            }, 100);
        }
    }

    function openPalette() {
        overlay.style.display = 'flex';
        input.value = '';
        input.placeholder = t('commandPalette.searchPlaceholder', 'Search commands, tools, charts or shortcuts (Ctrl+K)...');
        selectedIndex = 0;
        renderResults('');
        setTimeout(() => input.focus(), 50);
    }

    function closePalette() {
        overlay.style.display = 'none';
        input.blur();
    }

    // Expose open helper globally
    window.openCommandPalette = openPalette;
    window.closeCommandPalette = closePalette;

    // React to Language Changes
    onLanguageChange(() => {
        if (input) {
            input.placeholder = t('commandPalette.searchPlaceholder', 'Search commands, tools, charts or shortcuts (Ctrl+K)...');
        }
        if (overlay && overlay.style.display === 'flex') {
            renderResults(input ? input.value : '');
        }
    });

    // Keyboard navigation inside Palette
    input.addEventListener('input', (e) => {
        selectedIndex = 0;
        renderResults(e.target.value);
    });

    input.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (filteredCommands.length > 0) {
                selectedIndex = (selectedIndex + 1) % filteredCommands.length;
                updateSelection();
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (filteredCommands.length > 0) {
                selectedIndex = (selectedIndex - 1 + filteredCommands.length) % filteredCommands.length;
                updateSelection();
            }
        } else if (e.key === 'Enter') {
            e.preventDefault();
            executeCommand(selectedIndex);
        } else if (e.key === 'Escape') {
            e.preventDefault();
            closePalette();
        }
    });

    // Close when clicking outside overlay card
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closePalette();
        }
    });

    // Global Shortcut Listener: Ctrl+K or Cmd+K or / (when not in input)
    window.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
            e.preventDefault();
            if (overlay.style.display === 'flex') {
                closePalette();
            } else {
                openPalette();
            }
        } else if (e.key === 'Escape' && overlay.style.display === 'flex') {
            closePalette();
        }
    });
}
