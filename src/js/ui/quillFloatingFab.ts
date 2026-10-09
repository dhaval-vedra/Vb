/**
 * quillFloatingFab.ts
 * Vedra BI - Floating Transparent FAB Quill Formatting Menu for Textboxes
 * Displays a sleek glassmorphic floating action toolbar right beside any textbox
 * when opened in editor mode (via double-click or mobile double-tap).
 */

import { t } from '../i18n/index.ts';

export interface FloatingFabOptions {
    onDone?: (box: HTMLElement) => void;
    onDataInsert?: () => void;
    onContentChange?: (box: HTMLElement) => void;
}

let activeBox: HTMLElement | null = null;
let fabContainer: HTMLElement | null = null;
let isCollapsed = false;
let currentOptions: FloatingFabOptions = {};
let isDraggingFab = false;
let fabOffsetX = 0;
let fabOffsetY = 0;
let savedRange: Range | null = null;

// Palette colors for quick swatch selection
const TEXT_COLORS = [
    { name: 'Default Dark', value: '#1e293b' },
    { name: 'Primary Blue', value: '#2563eb' },
    { name: 'Emerald Green', value: '#16a34a' },
    { name: 'Crimson Red', value: '#dc2626' },
    { name: 'Amber Gold', value: '#d97706' },
    { name: 'Purple', value: '#9333ea' },
    { name: 'White', value: '#ffffff' }
];

const HIGHLIGHT_COLORS = [
    { name: 'None', value: 'transparent' },
    { name: 'Yellow', value: '#fef08a' },
    { name: 'Green', value: '#bbf7d0' },
    { name: 'Blue', value: '#bfdbfe' },
    { name: 'Pink', value: '#fbcfe8' },
    { name: 'Orange', value: '#fed7aa' }
];

const FONT_FAMILIES = [
    { name: 'Inter / Sans-serif', value: "'Inter', sans-serif" },
    { name: 'Roboto', value: "'Roboto', sans-serif" },
    { name: 'Poppins', value: "'Poppins', sans-serif" },
    { name: 'Playfair / Serif', value: "'Playfair Display', serif" },
    { name: 'Monospace', value: "'JetBrains Mono', monospace" },
    { name: 'हिंदी / Devanagari', value: "'Hind', 'Noto Sans Devanagari', sans-serif" }
];

const FONT_SIZES = [
    { label: '12px', value: '1' },
    { label: '14px', value: '2' },
    { label: '16px', value: '3' },
    { label: '20px', value: '4' },
    { label: '24px', value: '5' },
    { label: '32px', value: '6' },
    { label: '48px', value: '7' }
];

/**
 * Saves the current user selection in the active editable area.
 */
export function saveTextSelection(): void {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
        savedRange = sel.getRangeAt(0).cloneRange();
    }
}

/**
 * Restores the user selection to keep formatting uninterrupted.
 */
export function restoreTextSelection(): void {
    if (!savedRange) return;
    const sel = window.getSelection();
    if (sel) {
        sel.removeAllRanges();
        sel.addRange(savedRange);
    }
}

/**
 * Executes a formatting command and maintains focus on textDiv.
 */
function applyFormat(command: string, value: string | null = null): void {
    if (!activeBox) return;
    const textDiv = activeBox.querySelector('.txt') as HTMLElement | null;
    if (!textDiv) return;

    restoreTextSelection();
    textDiv.focus();

    try {
        document.execCommand(command, false, value || undefined);
    } catch (err) {
        console.warn('[Quill FAB] ExecCommand failed:', command, err);
    }

    saveTextSelection();
    updateActiveFormatButtons();

    if (currentOptions.onContentChange) {
        currentOptions.onContentChange(activeBox);
    }
}

/**
 * Checks document command states to highlight active buttons in the FAB.
 */
function updateActiveFormatButtons(): void {
    if (!fabContainer) return;

    const boldBtn = fabContainer.querySelector('[data-cmd="bold"]');
    const italicBtn = fabContainer.querySelector('[data-cmd="italic"]');
    const underlineBtn = fabContainer.querySelector('[data-cmd="underline"]');
    const strikeBtn = fabContainer.querySelector('[data-cmd="strikeThrough"]');
    const ulBtn = fabContainer.querySelector('[data-cmd="insertUnorderedList"]');
    const olBtn = fabContainer.querySelector('[data-cmd="insertOrderedList"]');

    try {
        if (boldBtn) boldBtn.classList.toggle('active', document.queryCommandState('bold'));
        if (italicBtn) italicBtn.classList.toggle('active', document.queryCommandState('italic'));
        if (underlineBtn) underlineBtn.classList.toggle('active', document.queryCommandState('underline'));
        if (strikeBtn) strikeBtn.classList.toggle('active', document.queryCommandState('strikeThrough'));
        if (ulBtn) ulBtn.classList.toggle('active', document.queryCommandState('insertUnorderedList'));
        if (olBtn) olBtn.classList.toggle('active', document.queryCommandState('insertOrderedList'));
    } catch (_) {}
}

/**
 * Creates the DOM elements for the Transparent FAB Quill Formatting Menu.
 * Now organized as a square palette ("choras pellet") with a black transparent background.
 */
function createFabElement(): HTMLElement {
    const el = document.createElement('div');
    el.id = 'textbox-floating-fab-toolbar';
    el.className = 'quill-floating-fab quill-square-palette';
    el.setAttribute('role', 'toolbar');
    el.setAttribute('aria-label', 'Quill Textbox Formatting Palette');

    el.innerHTML = `
        <!-- Top Palette Header & Drag Bar -->
        <div class="fab-palette-header">
            <div class="fab-drag-handle" title="ड्रैग करें / मूव करें" aria-label="Drag Handle">
                <i class="bi bi-grip-vertical me-1"></i>
                <span class="fab-palette-title"><i class="bi bi-pencil-square text-primary me-1"></i>Quill Format</span>
            </div>
            <div class="fab-header-actions">
                <button type="button" class="fab-btn-done" id="fabDoneBtn" title="संपादन पूरा करें (Done)">
                    <i class="bi bi-check2"></i>
                    <span>पूर्ण</span>
                </button>
            </div>
        </div>

        <!-- Row 1: Typography (Font Family + Font Size) -->
        <div class="fab-palette-row fab-typography-row">
            <div class="fab-control-group flex-grow-1">
                <select class="fab-select fab-font-family w-100" title="फॉन्ट चुनें" aria-label="Font Family">
                    ${FONT_FAMILIES.map(f => `<option value="${f.value}">${f.name}</option>`).join('')}
                </select>
            </div>
            <div class="fab-control-group fab-size-group">
                <select class="fab-select fab-font-size w-100" title="फॉन्ट साइज़" aria-label="Font Size">
                    ${FONT_SIZES.map(s => `<option value="${s.value}">${s.label}</option>`).join('')}
                </select>
            </div>
        </div>

        <!-- Row 2: Block/Heading + Core Formatting Styles -->
        <div class="fab-palette-row fab-style-row">
            <div class="fab-control-group flex-grow-1">
                <select class="fab-select fab-block-format w-100" title="हेडिंग या पैराग्राफ" aria-label="Block Format">
                    <option value="p">साधारण (P)</option>
                    <option value="h1">हेडिंग 1 (H1)</option>
                    <option value="h2">हेडिंग 2 (H2)</option>
                    <option value="h3">हेडिंग 3 (H3)</option>
                    <option value="blockquote">कोट (Quote)</option>
                </select>
            </div>
            <div class="fab-btn-group">
                <button type="button" class="fab-btn" data-cmd="bold" title="बोल्ड (Ctrl+B)" aria-label="Bold">
                    <i class="bi bi-type-bold"></i>
                </button>
                <button type="button" class="fab-btn" data-cmd="italic" title="इटैलिक (Ctrl+I)" aria-label="Italic">
                    <i class="bi bi-type-italic"></i>
                </button>
                <button type="button" class="fab-btn" data-cmd="underline" title="अंडरलाइन (Ctrl+U)" aria-label="Underline">
                    <i class="bi bi-type-underline"></i>
                </button>
                <button type="button" class="fab-btn" data-cmd="strikeThrough" title="स्ट्राइकथ्रू" aria-label="Strike">
                    <i class="bi bi-type-strikethrough"></i>
                </button>
            </div>
        </div>

        <!-- Row 3: Alignment, Lists & Eraser -->
        <div class="fab-palette-row fab-align-list-row">
            <div class="fab-btn-group">
                <button type="button" class="fab-btn" data-cmd="justifyLeft" title="बाएं अलाइन (Left)">
                    <i class="bi bi-text-left"></i>
                </button>
                <button type="button" class="fab-btn" data-cmd="justifyCenter" title="केंद्र अलाइन (Center)">
                    <i class="bi bi-text-center"></i>
                </button>
                <button type="button" class="fab-btn" data-cmd="justifyRight" title="दाएं अलाइन (Right)">
                    <i class="bi bi-text-right"></i>
                </button>
            </div>
            <div class="fab-divider-v"></div>
            <div class="fab-btn-group">
                <button type="button" class="fab-btn" data-cmd="insertUnorderedList" title="बुलेट लिस्ट">
                    <i class="bi bi-list-ul"></i>
                </button>
                <button type="button" class="fab-btn" data-cmd="insertOrderedList" title="क्रमांकित लिस्ट">
                    <i class="bi bi-list-ol"></i>
                </button>
                <button type="button" class="fab-btn" data-cmd="removeFormat" title="फॉर्मेटिंग साफ़ करें">
                    <i class="bi bi-eraser"></i>
                </button>
            </div>
        </div>

        <!-- Row 4: Colors & Live Data -->
        <div class="fab-palette-row fab-colors-data-row">
            <div class="fab-btn-group">
                <!-- Text Color -->
                <div class="fab-dropdown-wrap">
                    <button type="button" class="fab-btn fab-color-btn" id="fabTextColorBtn" title="टेक्स्ट का रंग">
                        <span class="fab-color-indicator text-indicator" style="border-bottom: 3px solid #3b82f6;">A</span>
                    </button>
                    <div class="fab-dropdown-panel color-panel" id="fabTextColorPanel">
                        <div class="fab-palette-grid">
                            ${TEXT_COLORS.map(c => `
                                <button type="button" class="fab-palette-dot" data-color="${c.value}" title="${c.name}" style="background-color: ${c.value}; ${c.value === '#ffffff' ? 'border: 1px solid #475569;' : ''}"></button>
                            `).join('')}
                        </div>
                        <div class="fab-color-native-row">
                            <label>कस्टम:</label>
                            <input type="color" class="fab-color-input" id="fabCustomTextColor" value="#3b82f6">
                        </div>
                    </div>
                </div>

                <!-- Background Highlight Color -->
                <div class="fab-dropdown-wrap">
                    <button type="button" class="fab-btn fab-color-btn" id="fabBgColorBtn" title="हाइलाइट रंग">
                        <i class="bi bi-highlighter"></i>
                    </button>
                    <div class="fab-dropdown-panel color-panel" id="fabBgColorPanel">
                        <div class="fab-palette-grid">
                            ${HIGHLIGHT_COLORS.map(c => `
                                <button type="button" class="fab-palette-dot" data-bg-color="${c.value}" title="${c.name}" style="background-color: ${c.value === 'transparent' ? '#1e293b' : c.value}; ${c.value === 'transparent' ? 'border: 1px dashed #64748b;' : ''}"></button>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Live Data Button -->
            <button type="button" class="fab-btn fab-data-insert-btn ms-auto" id="fabInsertLiveBtn" title="लाइव डेटा इन्सर्ट करें">
                <i class="bi bi-database text-info me-1"></i>
                <span>+ डेटा</span>
            </button>
        </div>
    `;

    // Attach event handlers
    attachFabHandlers(el);

    return el;
}

/**
 * Attaches event handlers to the FAB toolbar controls.
 */
function attachFabHandlers(el: HTMLElement): void {
    // Prevent buttons from taking focus away from editable textDiv
    el.querySelectorAll('.fab-btn, .fab-btn-done, .fab-palette-dot, .fab-drag-handle').forEach(btn => {
        btn.addEventListener('pointerdown', (e) => {
            e.preventDefault();
        });
        btn.addEventListener('mousedown', (e) => {
            e.preventDefault();
        });
    });

    // Formatting command buttons
    el.querySelectorAll('[data-cmd]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const cmd = (btn as HTMLElement).getAttribute('data-cmd');
            if (cmd) {
                applyFormat(cmd);
            }
        });
    });

    // Font family change
    const fontSelect = el.querySelector('.fab-font-family') as HTMLSelectElement | null;
    if (fontSelect) {
        fontSelect.addEventListener('change', () => {
            applyFormat('fontName', fontSelect.value);
        });
    }

    // Font size change
    const sizeSelect = el.querySelector('.fab-font-size') as HTMLSelectElement | null;
    if (sizeSelect) {
        sizeSelect.addEventListener('change', () => {
            applyFormat('fontSize', sizeSelect.value);
        });
    }

    // Block format change (H1, H2, H3, P)
    const blockSelect = el.querySelector('.fab-block-format') as HTMLSelectElement | null;
    if (blockSelect) {
        blockSelect.addEventListener('change', () => {
            const val = blockSelect.value;
            applyFormat('formatBlock', val);
        });
    }

    // Text color button & panel
    const textColorBtn = el.querySelector('#fabTextColorBtn') as HTMLElement | null;
    const textColorPanel = el.querySelector('#fabTextColorPanel') as HTMLElement | null;
    const customTextColor = el.querySelector('#fabCustomTextColor') as HTMLInputElement | null;

    if (textColorBtn && textColorPanel) {
        textColorBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            textColorPanel.classList.toggle('show');
            // Hide other panel
            el.querySelector('#fabBgColorPanel')?.classList.remove('show');
        });
    }

    // Swatches for text color
    el.querySelectorAll('[data-color]').forEach(dot => {
        dot.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const color = (dot as HTMLElement).getAttribute('data-color') || '#1e293b';
            applyFormat('foreColor', color);
            const indicator = el.querySelector('.text-indicator') as HTMLElement | null;
            if (indicator) indicator.style.borderBottomColor = color;
            textColorPanel?.classList.remove('show');
        });
    });

    if (customTextColor) {
        customTextColor.addEventListener('input', () => {
            applyFormat('foreColor', customTextColor.value);
            const indicator = el.querySelector('.text-indicator') as HTMLElement | null;
            if (indicator) indicator.style.borderBottomColor = customTextColor.value;
        });
    }

    // Background color button & panel
    const bgColorBtn = el.querySelector('#fabBgColorBtn') as HTMLElement | null;
    const bgColorPanel = el.querySelector('#fabBgColorPanel') as HTMLElement | null;

    if (bgColorBtn && bgColorPanel) {
        bgColorBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            bgColorPanel.classList.toggle('show');
            textColorPanel?.classList.remove('show');
        });
    }

    // Swatches for background color
    el.querySelectorAll('[data-bg-color]').forEach(dot => {
        dot.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const bgColor = (dot as HTMLElement).getAttribute('data-bg-color') || 'transparent';
            applyFormat('hiliteColor', bgColor);
            bgColorPanel?.classList.remove('show');
        });
    });

    // Close color panels on outside click
    document.addEventListener('pointerdown', (e) => {
        const target = e.target as HTMLElement | null;
        if (!target?.closest('.fab-dropdown-wrap')) {
            textColorPanel?.classList.remove('show');
            bgColorPanel?.classList.remove('show');
        }
    });

    // Live Data Button
    const liveDataBtn = el.querySelector('#fabInsertLiveBtn') as HTMLElement | null;
    if (liveDataBtn) {
        liveDataBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (currentOptions.onDataInsert) {
                currentOptions.onDataInsert();
            } else {
                const btn = document.getElementById('dataInsertButton');
                if (btn) btn.click();
            }
        });
    }

    // Done Button
    const doneBtn = el.querySelector('#fabDoneBtn') as HTMLElement | null;
    if (doneBtn) {
        doneBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            finishEditing();
        });
    }

    // Drag handle logic
    const handle = el.querySelector('.fab-drag-handle') as HTMLElement | null;
    if (handle) {
        handle.addEventListener('pointerdown', (e: PointerEvent) => {
            isDraggingFab = true;
            fabOffsetX = e.clientX - el.offsetLeft;
            fabOffsetY = e.clientY - el.offsetTop;
            try { handle.setPointerCapture(e.pointerId); } catch (_) {}
            e.preventDefault();
            e.stopPropagation();

            const onMove = (moveEv: PointerEvent) => {
                if (!isDraggingFab) return;
                const newX = Math.max(10, Math.min(window.innerWidth - el.offsetWidth - 10, moveEv.clientX - fabOffsetX));
                const newY = Math.max(10, Math.min(window.innerHeight - el.offsetHeight - 10, moveEv.clientY - fabOffsetY));
                el.style.left = `${newX}px`;
                el.style.top = `${newY}px`;
            };

            const onUp = () => {
                isDraggingFab = false;
                window.removeEventListener('pointermove', onMove);
                window.removeEventListener('pointerup', onUp);
            };

            window.addEventListener('pointermove', onMove);
            window.addEventListener('pointerup', onUp);
        });
    }
}

/**
 * Calculates optimal position right beside the target textbox ("uske bagal me").
 */
export function positionFabBesideBox(box: HTMLElement): void {
    if (!fabContainer || isDraggingFab) return;

    const boxRect = box.getBoundingClientRect();
    const fabWidth = fabContainer.offsetWidth || 300;
    const fabHeight = fabContainer.offsetHeight || 255;
    const margin = 14;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let targetLeft: number;
    let targetTop: number;

    // 1. Preferred position: Right beside the textbox
    if (boxRect.right + margin + fabWidth <= viewportWidth - 10) {
        targetLeft = boxRect.right + margin;
        targetTop = Math.max(10, Math.min(viewportHeight - fabHeight - 10, boxRect.top));
    }
    // 2. Above the textbox if right has no space
    else if (boxRect.top - margin - fabHeight >= 10) {
        targetLeft = Math.max(10, Math.min(viewportWidth - fabWidth - 10, boxRect.left));
        targetTop = boxRect.top - margin - fabHeight;
    }
    // 3. To the left side of the textbox
    else if (boxRect.left - margin - fabWidth >= 10) {
        targetLeft = boxRect.left - margin - fabWidth;
        targetTop = Math.max(10, Math.min(viewportHeight - fabHeight - 10, boxRect.top));
    }
    // 4. Below the textbox as fallback
    else {
        targetLeft = Math.max(10, Math.min(viewportWidth - fabWidth - 10, boxRect.left));
        targetTop = Math.min(viewportHeight - fabHeight - 10, boxRect.bottom + margin);
    }

    fabContainer.style.left = `${Math.round(targetLeft)}px`;
    fabContainer.style.top = `${Math.round(targetTop)}px`;
}

/**
 * Shows the Floating Transparent FAB Quill Formatting Menu beside the given textbox.
 */
export function showFloatingFab(box: HTMLElement, options: FloatingFabOptions = {}): void {
    activeBox = box;
    currentOptions = options;

    if (!fabContainer) {
        fabContainer = createFabElement();
        document.body.appendChild(fabContainer);
    }

    fabContainer.classList.add('visible');
    fabContainer.classList.remove('hiding');

    // Make sure editable text is focused
    const textDiv = box.querySelector('.txt') as HTMLElement | null;
    if (textDiv) {
        textDiv.setAttribute('contenteditable', 'true');
        textDiv.classList.add('in-place-edit-active');
        textDiv.focus();

        // Listen for selection changes to update button states
        textDiv.onmouseup = () => {
            saveTextSelection();
            updateActiveFormatButtons();
        };
        textDiv.onkeyup = () => {
            saveTextSelection();
            updateActiveFormatButtons();
            if (options.onContentChange) options.onContentChange(box);
        };
        textDiv.oninput = () => {
            if (options.onContentChange) options.onContentChange(box);
        };
    }

    // Position FAB beside the textbox
    positionFabBesideBox(box);

    // Reposition on scroll or resize
    window.addEventListener('scroll', handleViewportChange, { passive: true });
    window.addEventListener('resize', handleViewportChange, { passive: true });
}

function handleViewportChange(): void {
    if (activeBox && fabContainer && fabContainer.classList.contains('visible')) {
        positionFabBesideBox(activeBox);
    }
}

/**
 * Hides the Floating FAB menu smoothly.
 */
export function hideFloatingFab(): void {
    if (!fabContainer) return;

    fabContainer.classList.add('hiding');
    fabContainer.classList.remove('visible');

    // Close any open color popups
    fabContainer.querySelectorAll('.fab-dropdown-panel').forEach(p => p.classList.remove('show'));

    window.removeEventListener('scroll', handleViewportChange);
    window.removeEventListener('resize', handleViewportChange);

    activeBox = null;
}

/**
 * Finishes editing and triggers the onDone callback.
 */
function finishEditing(): void {
    if (!activeBox) {
        hideFloatingFab();
        return;
    }

    const boxToFinish = activeBox;
    hideFloatingFab();

    if (currentOptions.onDone) {
        currentOptions.onDone(boxToFinish);
    }
}

/**
 * Returns whether an element belongs to the FAB toolbar.
 */
export function isFabElement(target: EventTarget | null): boolean {
    if (!target || !fabContainer) return false;
    return fabContainer.contains(target as Node);
}

/**
 * Returns whether the floating FAB is currently visible.
 */
export function isFloatingFabVisible(): boolean {
    return !!fabContainer && fabContainer.classList.contains('visible');
}
