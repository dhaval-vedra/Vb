import { setBoxEventDependencies, attachBoxEvents } from './box-events.js';
import { 
    parseTransform, rgbToHex, MIN_WIDTH, MIN_HEIGHT, clearGuides,
    // NEW UTILITIES
    saveState, undo, redo, canUndo, canRedo,
    handleKeyResize, snapRotation, getSelectedBoxes, alignSelected,
    distributeSelected, toggleGrid, setGridSize, snapToGrid,
    copyStyles, pasteStyles, bringToFront, sendToBack,
    getContainerSnapPositions, debounce, showDistanceIndicator,
    autoSave, loadAutoSave, templates, applyTemplate
} from './texbox_utils.js';
import { t, onLanguageChange } from '../i18n/index.ts';
import { showMessage } from '../core/utils.ts';
import { 
    showFloatingFab, 
    hideFloatingFab, 
    isFabElement, 
    positionFabBesideBox 
} from './quillFloatingFab.ts';

// 1. DataHandler.js से आवश्यक डेटा और फ़ंक्शंस को इम्पोर्ट करें
import {
    filteredData, // यह वह डेटा है जिसे हम टेक्स्टबॉक्स में डालना चाहते हैं
    headers,      // डेटा के कॉलम हेडर
    // अन्य DataHandler फ़ंक्शंस
    // ...
} from '../../store/DataHandler.ts';

// Global variables for the module
let fullScreenContainer; 
let mainActionButton;
let bgColorPicker;
let dataInsertButton; 
let quill;
let textboxPreview;
let selectedBox = null;
let isEditMode = false;
let isInPlaceEditMode = false; // Flag for in-place editing
let GRID_SIZE = 10; // Updated for grid snapping
let TEXTBOX_TEMPLATES = []; // Now will be loaded from JSON
let templatesShowAll = false;

// **नया Global variable for data insertion sidebar**
let dataInsertSidebar;
let dataListContainer; 

// **NEW GLOBAL VARIABLES FOR ENHANCED FEATURES**
let undoButton = null;
let redoButton = null;
let alignButtons = {};
let distributeButtons = {};
let gridToggleButton = null;
let copyStyleButton = null;
let pasteStyleButton = null;
let bringFrontButton = null;
let sendBackButton = null;
let multiSelectMode = false;
// ---------------------------------------------------

// Google Fonts configuration
const CUSTOM_FONTS = ['Montserrat', 'Roboto', 'Lato', 'Open Sans', 'Poppins', 'Oswald'];

// --- Default Box Dimensions for Centering ---
const DEFAULT_BOX_WIDTH = 300;
const DEFAULT_BOX_HEIGHT = 100;
// --------------------------------------------

// Function to load templates from JSON file
async function loadTemplatesFromJSON() {
    try {
        const response = await fetch('src/data/TEXTBOX_TEMPLATES.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        TEXTBOX_TEMPLATES = data.templates;
        console.log('Templates loaded successfully:', TEXTBOX_TEMPLATES.length);
        return TEXTBOX_TEMPLATES;
    } catch (error) {
        console.error('Error loading templates from JSON:', error);
        // Fallback to default templates if JSON fails to load
        TEXTBOX_TEMPLATES = getDefaultTemplates();
        return TEXTBOX_TEMPLATES;
    }
}

// Fallback default templates in case JSON fails to load
function getDefaultTemplates() {
    return [
        {
            name: "मुख्य शीर्षक",
            content: "<h6>मुख्य डैशबोर्ड शीर्षक</h6><p>आपके डेटा का सारांश</p>",
            bgColor: "#e0f7fa",
            animationClass: "bg-animated-pulse"
        },
        {
            name: "नोट्स",
            content: "<strong>महत्वपूर्ण नोट्स:</strong><br>डेटा में महत्वपूर्ण वृद्धि दिखी।",
            bgColor: "#fffde7",
            animationClass: ""
        }
    ];
}

// Helper to guarantee Quill is available safely
async function ensureQuillLoaded() {
    if (typeof window !== 'undefined' && window['Quill']) {
        return window['Quill'];
    }
    try {
        if (typeof Quill !== 'undefined') {
            return Quill;
        }
    } catch (_) {
        // Quill not in global scope
    }

    return new Promise((resolve) => {
        const cdnUrls = [
            'https://cdn.jsdelivr.net/npm/quill@1.3.7/dist/quill.min.js',
            'https://cdnjs.cloudflare.com/ajax/libs/quill/1.3.7/quill.min.js',
            'https://unpkg.com/quill@1.3.7/dist/quill.min.js'
        ];
        let idx = 0;

        function loadScript() {
            if (idx >= cdnUrls.length) {
                console.warn('[Quill Loader] Could not load Quill from CDNs.');
                resolve(null);
                return;
            }
            const script = document.createElement('script');
            script.src = cdnUrls[idx++];
            script.crossOrigin = 'anonymous';
            script.onload = () => {
                const q = (typeof window !== 'undefined' && window['Quill']) || null;
                resolve(q);
            };
            script.onerror = () => {
                script.remove();
                loadScript();
            };
            document.head.appendChild(script);
        }

        loadScript();
    });
}

// Function to dynamically load Google Fonts
function addGoogleFontsToQuill(QuillClass = null) {
    let globalQuill = null;
    try {
        if (typeof Quill !== 'undefined') {
            globalQuill = Quill;
        }
    } catch (_) {}
    const QuillObj = QuillClass || (typeof window !== 'undefined' && window['Quill']) || globalQuill;

    if (!document.getElementById('google-fonts-quill-link')) {
        const link = document.createElement('link');
        link.id = 'google-fonts-quill-link';
        link.href = `https://fonts.googleapis.com/css2?family=${CUSTOM_FONTS.join('&family=')}&display=swap`;
        link.rel = 'stylesheet';
        document.head.appendChild(link);
    }

    if (!document.getElementById('google-fonts-quill-style')) {
        const style = document.createElement('style');
        style.id = 'google-fonts-quill-style';
        let fontStyles = '';
        CUSTOM_FONTS.forEach(font => {
            const fontName = font.toLowerCase().replace(/\s/g, '-');
            fontStyles += `.ql-font-${fontName} { font-family: '${font}', sans-serif; }`;
        });
        style.innerHTML = fontStyles;
        document.head.appendChild(style);
    }

    if (!QuillObj) {
        console.warn("[Editor] Quill is not defined yet, skipping Font format registration.");
        return;
    }

    try {
        const Font = QuillObj.import('formats/font');
        if (Font) {
            Font.whitelist = ['sans-serif', 'serif', 'monospace', ...CUSTOM_FONTS.map(f => f.toLowerCase().replace(/\s/g, '-'))];
            QuillObj.register(Font, true);
        }
    } catch (err) {
        console.warn("[Editor] Font format registration in Quill encountered:", err);
    }
}

// --- NEW ENHANCED FEATURE FUNCTIONS ---

/**
 * इन्हेंशिएटेड फीचर्स के लिए इवेंट हैंडलर्स सेटअप करता है
 */
function setupEnhancedFeatures() {
    // Undo/Redo buttons
    undoButton = document.getElementById('undoButton');
    redoButton = document.getElementById('redoButton');
    
    if (undoButton) undoButton.onclick = handleUndo;
    if (redoButton) redoButton.onclick = handleRedo;
    
    // Alignment buttons
    alignButtons = {
        left: document.getElementById('alignLeft'),
        right: document.getElementById('alignRight'),
        top: document.getElementById('alignTop'),
        bottom: document.getElementById('alignBottom'),
        centerV: document.getElementById('alignCenterVertical'),
        centerH: document.getElementById('alignCenterHorizontal')
    };
    
    Object.keys(alignButtons).forEach(key => {
        if (alignButtons[key]) {
            alignButtons[key].onclick = () => handleAlignment(key);
        }
    });
    
    // Distribution buttons
    distributeButtons = {
        horizontal: document.getElementById('distributeHorizontal'),
        vertical: document.getElementById('distributeVertical')
    };
    
    Object.keys(distributeButtons).forEach(key => {
        if (distributeButtons[key]) {
            distributeButtons[key].onclick = () => handleDistribution(key);
        }
    });
    
    // Grid toggle
    gridToggleButton = document.getElementById('gridToggle');
    if (gridToggleButton) {
        gridToggleButton.onclick = handleGridToggle;
    }
    
    // Style copy/paste
    copyStyleButton = document.getElementById('copyStyle');
    pasteStyleButton = document.getElementById('pasteStyle');
    
    if (copyStyleButton) copyStyleButton.onclick = handleCopyStyle;
    if (pasteStyleButton) pasteStyleButton.onclick = handlePasteStyle;
    
    // Z-index management
    bringFrontButton = document.getElementById('bringToFront');
    sendBackButton = document.getElementById('sendToBack');
    
    if (bringFrontButton) bringFrontButton.onclick = handleBringToFront;
    if (sendBackButton) sendBackButton.onclick = handleSendToBack;
    
    // Multi-select toggle
    const multiSelectToggle = document.getElementById('multiSelectToggle');
    if (multiSelectToggle) {
        multiSelectToggle.onclick = handleMultiSelectToggle;
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
    
    // Auto-save setup
    setupAutoSave();
}

/**
 * Undo operation handler
 */
function handleUndo() {
    const state = undo();
    if (state) {
        applyStateToBoxes(state);
        updateUIState();
    }
}

/**
 * Redo operation handler
 */
function handleRedo() {
    const state = redo();
    if (state) {
        applyStateToBoxes(state);
        updateUIState();
    }
}

/**
 * Alignment operation handler
 */
function handleAlignment(alignment) {
    const selectedBoxes = getSelectedBoxes();
    if (selectedBoxes.length < 2) {
        showMessage(t('editor.alignMinBoxes'), 'warning');
        return;
    }
    
    alignSelected(alignment, fullScreenContainer);
    saveCurrentState();
    updateUIState();
}

/**
 * Distribution operation handler
 */
function handleDistribution(direction) {
    const selectedBoxes = getSelectedBoxes();
    if (selectedBoxes.length < 3) {
        showMessage(t('editor.distributeMinBoxes'), 'warning');
        return;
    }
    
    distributeSelected(direction, fullScreenContainer);
    saveCurrentState();
    updateUIState();
}

/**
 * Grid toggle handler
 */
function handleGridToggle() {
    const isEnabled = toggleGrid();
    gridToggleButton.classList.toggle('active', isEnabled);
    
    // Show/hide grid overlay
    let gridOverlay = document.getElementById('gridOverlay');
    if (!gridOverlay) {
        gridOverlay = document.createElement('div');
        gridOverlay.id = 'gridOverlay';
        gridOverlay.className = 'grid-overlay';
        fullScreenContainer.appendChild(gridOverlay);
    }
    gridOverlay.classList.toggle('active', isEnabled);
}

/**
 * Copy style handler
 */
function handleCopyStyle() {
    const selectedBoxes = getSelectedBoxes();
    if (selectedBoxes.length === 1) {
        copyStyles(selectedBoxes[0]);
        pasteStyleButton.disabled = false;
    } else {
        showMessage(t('editor.selectOneBoxCopy'), 'warning');
    }
}

/**
 * Paste style handler
 */
function handlePasteStyle() {
    const selectedBoxes = getSelectedBoxes();
    if (selectedBoxes.length > 0) {
        selectedBoxes.forEach(box => pasteStyles(box));
        saveCurrentState();
        updateUIState();
    }
}

/**
 * Bring to front handler
 */
function handleBringToFront() {
    const selectedBoxes = getSelectedBoxes();
    selectedBoxes.forEach(box => bringToFront(box));
    saveCurrentState();
}

/**
 * Send to back handler
 */
function handleSendToBack() {
    const selectedBoxes = getSelectedBoxes();
    selectedBoxes.forEach(box => sendToBack(box));
    saveCurrentState();
}

/**
 * Multi-select toggle handler
 */
function handleMultiSelectToggle(e) {
    multiSelectMode = !multiSelectMode;
    const btn = document.getElementById('multiSelectToggle');
    if (btn) btn.classList.toggle('active', multiSelectMode);
    
    if (multiSelectMode) {
        document.body.style.cursor = 'crosshair';
    } else {
        document.body.style.cursor = 'default';
        // Clear selection if only one box is selected
        const selected = getSelectedBoxes();
        if (selected.length === 1) {
            selected[0].classList.remove('selected');
        }
    }
}

/**
 * Keyboard shortcuts handler
 */
function handleKeyboardShortcuts(e) {
    if (e.ctrlKey || e.metaKey) {
        switch(e.key) {
            case 'z':
                if (e.shiftKey) handleRedo();
                else handleUndo();
                e.preventDefault();
                break;
            case 'y':
                handleRedo();
                e.preventDefault();
                break;
            case 'c':
                if (getSelectedBoxes().length === 1) handleCopyStyle();
                break;
            case 'v':
                handlePasteStyle();
                break;
            case 'g':
                handleGridToggle();
                e.preventDefault();
                break;
        }
    }
    
    // Arrow key resizing for selected box
    if (selectedBox && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        handleKeyResize(selectedBox, e.key);
        saveCurrentState();
        updateUIState();
        e.preventDefault();
    }
}

/**
 * Save current state of all boxes
 */
export function saveCurrentState() {
    const boxes = Array.from(document.querySelectorAll('.box'));
    saveState(boxes);
    try {
        autoSave(boxes);
    } catch (e) {
        console.warn('[Editor] autoSave error:', e);
    }
    updateUIState();
}

/**
 * Get CSS Box Shadow string from preset name
 */
function getShadowCSS(type) {
    switch(type) {
        case 'soft':
            return '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)';
        case 'medium':
            return '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04)';
        case 'hard':
            return '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
        case 'neon':
            return '0 0 15px rgba(99, 102, 241, 0.6)';
        default:
            return 'none';
    }
}

/**
 * Recreate a box from saved serialized state
 */
function recreateBoxFromData(data) {
    const dashContainer = document.getElementById('dashboardContent') || document.getElementById('visualizations');
    if (dashContainer) {
        fullScreenContainer = dashContainer;
    } else if (!fullScreenContainer) {
        fullScreenContainer = document.body;
    }
    
    // Check if box already exists to avoid duplication
    if (document.getElementById(data.id)) {
        return document.getElementById(data.id);
    }

    const box = document.createElement('div');
    box.className = 'box';
    box.id = data.id || ("textbox-" + Date.now() + Math.random().toString(36).substr(2, 5));
    
    // Position, size, rotation, background
    box.style.transform = data.transform || `translate(100px, 100px) rotate(0deg)`;
    box.style.width = data.width || '300px';
    box.style.height = data.height || '100px';
    box.style.backgroundColor = data.bgColor || '#ffffff';
    box.style.zIndex = data.zIndex || '1000';
    
    // Advanced Styles
    box.style.padding = data.padding || '8px';
    box.style.borderStyle = data.borderStyle || 'solid';
    box.style.borderColor = data.borderColor || '#cfcfcf';
    box.style.borderWidth = data.borderWidth || '1px';
    box.style.borderRadius = data.borderRadius || '8px';
    box.style.color = data.textColor || '#374151';
    
    if (data.boxShadow && data.boxShadow !== 'none') {
        box.style.boxShadow = getShadowCSS(data.boxShadow);
        box.setAttribute('data-box-shadow', data.boxShadow);
    }
    
    if (data.animationClass) {
        box.classList.add(data.animationClass);
        box.setAttribute('data-animation-class', data.animationClass);
    }

    // Handles & Toolbar
    const rotateHandle = document.createElement('div');
    rotateHandle.className = 'rotate-handle';
    rotateHandle.title = t('editor.rotate');
    
    const toolbar = document.createElement('div');
    toolbar.className = 'toolbar';
    const btnFront = document.createElement('button'); btnFront.className="front"; btnFront.innerHTML=`<i class="bi bi-bring-to-front"></i> ${t('editor.front')}`;
    const btnBack = document.createElement('button'); btnBack.className="back"; btnBack.innerHTML=`<i class="bi bi-send-to-back"></i> ${t('editor.back')}`;
    const btnDup = document.createElement('button'); btnDup.className="duplicate"; btnDup.innerHTML=`<i class="bi bi-copy"></i> ${t('editor.copy')}`;
    const btnDel = document.createElement('button'); btnDel.className="delete"; btnDel.innerHTML=`<i class="bi bi-trash"></i> ${t('editor.delete')}`;
    const btnLock = document.createElement('button'); btnLock.className="lock"; btnLock.innerHTML=`<i class="bi bi-lock"></i> ${t('editor.lock')}`;
    toolbar.appendChild(btnFront);
    toolbar.appendChild(btnBack);
    toolbar.appendChild(btnDup);
    toolbar.appendChild(btnDel);
    toolbar.appendChild(btnLock);

    const textDiv = document.createElement('div');
    textDiv.className = "txt"; 
    textDiv.innerHTML = data.content === '<p><br></p>' || data.content === '<p></p>' ? '' : data.content;

    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'resize-handle';
    resizeHandle.title = t('editor.resize');

    box.appendChild(rotateHandle);
    box.appendChild(toolbar);
    box.appendChild(textDiv);
    box.appendChild(resizeHandle);

    fullScreenContainer.appendChild(box);
    attachBoxEvents(box);
    
    return box;
}

/**
 * Apply saved state to boxes
 */
function applyStateToBoxes(state) {
    if (!state || !Array.isArray(state)) return;
    state.forEach(item => {
        let box = document.getElementById(item.id);
        if (!box) {
            box = recreateBoxFromData(item);
        } else {
            box.style.transform = item.transform;
            box.style.width = item.width;
            box.style.height = item.height;
            box.style.backgroundColor = item.bgColor || '#ffffff';
            box.style.color = item.textColor || '#374151';
            box.style.zIndex = item.zIndex;
            
            // Advanced styles
            box.style.padding = item.padding || '8px';
            box.style.borderStyle = item.borderStyle || 'solid';
            box.style.borderColor = item.borderColor || '#cfcfcf';
            box.style.borderWidth = item.borderWidth || '1px';
            box.style.borderRadius = item.borderRadius || '8px';
            if (item.boxShadow && item.boxShadow !== 'none') {
                box.style.boxShadow = getShadowCSS(item.boxShadow);
                box.setAttribute('data-box-shadow', item.boxShadow);
            } else {
                box.style.boxShadow = 'none';
                box.removeAttribute('data-box-shadow');
            }
            
            if (item.animationClass) {
                // Ensure base class is maintained
                box.className = "box " + item.animationClass;
                box.setAttribute('data-animation-class', item.animationClass);
            } else {
                box.className = "box";
                box.removeAttribute('data-animation-class');
            }
            
            const textDiv = box.querySelector('.txt');
            if (textDiv) {
                textDiv.innerHTML = item.content || '';
            }
        }
    });
    updateTextboxList();
}

/**
 * Update UI state (undo/redo buttons, etc.)
 */
function updateUIState() {
    try {
        if (undoButton) undoButton.disabled = !canUndo();
        if (redoButton) redoButton.disabled = !canRedo();
        
        const selectedBoxes = (typeof getSelectedBoxes === 'function') ? getSelectedBoxes() : [];
        const selectedCount = selectedBoxes.length;
        const hasSelection = selectedCount > 0;
        const hasMultipleSelection = selectedCount > 1;
        
        // Enable/disable buttons based on selection
        if (copyStyleButton) copyStyleButton.disabled = selectedCount !== 1;
        if (pasteStyleButton) pasteStyleButton.disabled = !hasSelection;
        if (bringFrontButton) bringFrontButton.disabled = !hasSelection;
        if (sendBackButton) sendBackButton.disabled = !hasSelection;
        
        // Alignment buttons require multiple selection
        if (alignButtons && typeof alignButtons === 'object') {
            Object.values(alignButtons).forEach(btn => {
                if (btn) btn.disabled = !hasMultipleSelection;
            });
        }
        
        // Distribution buttons require at least 3 selections
        if (distributeButtons && typeof distributeButtons === 'object') {
            Object.values(distributeButtons).forEach(btn => {
                if (btn) btn.disabled = selectedCount < 3;
            });
        }
    } catch (err) {
        console.warn('[Editor] updateUIState caught error:', err);
    }
}

/**
 * Setup auto-save functionality
 */
function setupAutoSave() {
    const existingBoxes = document.querySelectorAll('.box');
    if (existingBoxes.length === 0) {
        // Load auto-saved state silently if exists
        const savedState = loadAutoSave();
        if (savedState && Array.isArray(savedState) && savedState.length > 0) {
            applyStateToBoxes(savedState);
        }
    } else {
        existingBoxes.forEach(b => attachBoxEvents(b));
    }
    
    // Show auto-saved badge briefly if present
    const badge = document.getElementById('textboxAutoSaveBadge');
    if (badge) {
        badge.style.display = 'inline-block';
        setTimeout(() => {
            badge.style.opacity = '0.7';
        }, 2000);
    }
    
    // Auto-save timer (only start once across the whole app lifecycle)
    if (!window.__textboxAutoSaveInterval) {
        window.__textboxAutoSaveInterval = setInterval(() => {
            const boxes = Array.from(document.querySelectorAll('.box'));
            if (boxes.length > 0) {
                autoSave(boxes);
                const b = document.getElementById('textboxAutoSaveBadge');
                if (b) {
                    b.style.display = 'inline-block';
                    b.style.opacity = '1';
                    setTimeout(() => {
                        b.style.opacity = '0.7';
                    }, 1500);
                }
            }
        }, 3000);
    }
}

/**
 * Automatically restores all saved textboxes onto the dashboard on initial page load / refresh.
 * Ensures boxes are immediately visible, interactive, and draggable without needing to open the sidebar.
 */
export function restoreDashboardTextboxes() {
    if (typeof document === 'undefined') return;
    
    fullScreenContainer = document.body;
    
    // Wire up box-events dependencies early
    setBoxEventDependencies(
        quill, 
        deselectAllBoxes, 
        enterEditMode, 
        enterInPlaceEditMode, 
        createBox, 
        updateTextboxList, 
        fullScreenContainer, 
        GRID_SIZE,
        saveCurrentState,
        getSelectedBoxes
    );

    // Setup enhanced features if elements are in DOM
    try {
        setupEnhancedFeatures();
    } catch (_) {}

    // Setup global listeners (outside clicks, delete shortcut, undo/redo keys)
    setupGlobalEvents();

    const existingBoxes = document.querySelectorAll('.box');
    if (existingBoxes.length === 0) {
        const savedState = loadAutoSave();
        if (savedState && Array.isArray(savedState) && savedState.length > 0) {
            applyStateToBoxes(savedState);
        }
    } else {
        existingBoxes.forEach(b => attachBoxEvents(b));
    }

    // Ensure periodic auto-save is active
    if (!window.__textboxAutoSaveInterval) {
        window.__textboxAutoSaveInterval = setInterval(() => {
            const boxes = Array.from(document.querySelectorAll('.box'));
            if (boxes.length > 0) {
                autoSave(boxes);
            }
        }, 3000);
    }
}

// --- 2. नया डेटा इन्सर्ट करने वाला लॉजिक (साइडबार आधारित) ---

let targetBoxForDataInsert = null;

/**
 * सुनिश्चित करता है कि dataInsertSidebar और dataListContainer DOM में ठीक से लोड और बाध्य हैं।
 */
export async function ensureDataInsertSidebar() {
    if (!dataInsertSidebar) {
        dataInsertSidebar = document.getElementById('dataInsertSidebar');
    }
    if (!dataListContainer && dataInsertSidebar) {
        dataListContainer = dataInsertSidebar.querySelector('#dataListContainer') || document.getElementById('dataListContainer');
    }

    // यदि अभी भी कंटेनर नहीं मिला, तो dynamicTemplates से लोड करने का प्रयास करें
    if (!dataListContainer && dataInsertSidebar) {
        try {
            const { dynamicTemplates } = await import('../layout/dynamicTemplates.ts');
            if (dynamicTemplates && dynamicTemplates['dataInsertSidebar']) {
                dataInsertSidebar.innerHTML = dynamicTemplates['dataInsertSidebar'];
                dataListContainer = document.getElementById('dataListContainer');
            }
        } catch (err) {
            console.warn('[Editor] Failed to inject dynamic template fallback for dataInsertSidebar:', err);
        }
    }

    // बटन्स पर इवेंट लिसनर पुनः बाँधें
    const insertDataBtn = document.getElementById('insertSelectedDataBtn');
    if (insertDataBtn) {
        insertDataBtn.onclick = insertSelectedData;
    }
    const closeSidebarBtn = document.getElementById('closeDataSidebarBtn');
    if (closeSidebarBtn) {
        closeSidebarBtn.onclick = closeDataInsertSidebar;
    }

    return !!(dataInsertSidebar && dataListContainer);
}

/**
 * डेटा इन्सर्ट साइडबार को खोलता है और डेटा सूची प्रस्तुत करता है।
 */
export async function openDataInsertSidebar(targetBox = null) {
    if (targetBox) {
        targetBoxForDataInsert = targetBox;
    } else if (selectedBox) {
        targetBoxForDataInsert = selectedBox;
    }

    await ensureDataInsertSidebar();

    if (!dataInsertSidebar || !dataListContainer) {
        console.warn("Data Insert Sidebar elements could not be initialized.");
        return;
    }
    
    // डेटा सूची प्रस्तुत करें
    renderDataList();

    // साइडबार दिखाएं (Bootstrap offcanvas या क्लास आधारित)
    try {
        if (typeof bootstrap !== 'undefined' && bootstrap.Offcanvas) {
            const bsOffcanvas = bootstrap.Offcanvas.getOrCreateInstance(dataInsertSidebar);
            bsOffcanvas.show();
        } else {
            dataInsertSidebar.classList.add('show'); 
            dataInsertSidebar.style.display = 'block';
            dataInsertSidebar.style.visibility = 'visible';
        }
    } catch (_) {
        dataInsertSidebar.classList.add('show'); 
        dataInsertSidebar.style.display = 'block';
        dataInsertSidebar.style.visibility = 'visible';
    }
}

/**
 * डेटा इन्सर्ट साइडबार को बंद करता है।
 */
export function closeDataInsertSidebar() {
    if (!dataInsertSidebar) {
        dataInsertSidebar = document.getElementById('dataInsertSidebar');
    }
    if (dataInsertSidebar) {
        try {
            if (typeof bootstrap !== 'undefined' && bootstrap.Offcanvas) {
                const bsOffcanvas = bootstrap.Offcanvas.getInstance(dataInsertSidebar);
                if (bsOffcanvas) {
                    bsOffcanvas.hide();
                    return;
                }
            }
        } catch (_) {}
        dataInsertSidebar.classList.remove('show');
        dataInsertSidebar.style.display = 'none';
        dataInsertSidebar.style.visibility = 'hidden';
    }
}

/**
 * filteredData के आधार पर साइडबार में चयन योग्य सूची प्रस्तुत करता है।
 */
function renderDataList() {
    if (!dataListContainer) return;
    
    if (!filteredData || filteredData.length === 0) {
        dataListContainer.innerHTML = `<p class="text-muted p-3 text-center">${t('editor.noFilteredData') || 'कोई डेटा उपलब्ध नहीं है'}</p>`;
        return;
    }

    let html = '<ul class="list-group list-group-flush">';
    
    // डेटा की पहली 50 पंक्तियों को दिखाएं (प्रदर्शन के लिए सीमा)
    const displayData = filteredData.slice(0, 50); 

    displayData.forEach((row, index) => {
        // प्रदर्शन के लिए मुख्य मान (उदाहरण के लिए, पहली 3 हेडर के मान)
        const headerList = headers && headers.length > 0 ? headers : Object.keys(row);
        const displayValues = headerList.slice(0, 3).map(header => row[header] !== undefined ? `${header}: ${row[header]}` : '').filter(Boolean);
        const displayLabel = displayValues.join(' | ') || `Row ${index + 1}`;

        // प्रत्येक पंक्ति को एक चेकबॉक्स के साथ प्रस्तुत करें
        html += `
            <li class="list-group-item d-flex align-items-center py-2 px-3" style="cursor: pointer;">
                <input type="checkbox" class="form-check-input me-3 data-checkbox" id="data-row-${index}" data-row-index="${index}">
                <label class="form-check-label flex-grow-1 user-select-none" for="data-row-${index}" style="font-size: 0.88em;">
                    <strong>Row ${index + 1}:</strong> ${displayLabel.substring(0, 75)}${displayLabel.length > 75 ? '...' : ''}
                </label>
                <button type="button" class="btn btn-sm btn-outline-primary view-details-btn py-0 px-2 ms-2" data-row-index="${index}" title="View Details">
                    <i class="bi bi-info-circle"></i>
                </button>
            </li>
        `;
    });

    html += '</ul>';
    dataListContainer.innerHTML = html;
    
    // विवरण बटन पर क्लिक हैंडलर जोड़ें
    dataListContainer.querySelectorAll('.view-details-btn').forEach(button => {
        button.onclick = (e) => {
            e.stopPropagation();
            const btn = e.currentTarget;
            const index = btn.getAttribute('data-row-index');
            const fullRow = filteredData[index];
            if (fullRow) {
                const previewStr = Object.entries(fullRow).map(([k, v]) => `• ${k}: ${v}`).join('\n');
                showMessage(previewStr, 'info', 5000);
            }
        };
    });
}

/**
 * चयनित डेटा पंक्तियों को पकड़ता है और उन्हें Quill एडिटर और सक्रिय टेक्स्टबॉक्स में इन्सर्ट करता है।
 */
function insertSelectedData() {
    if (!dataListContainer) return;

    const selectedCheckboxes = dataListContainer.querySelectorAll('.data-checkbox:checked');
    if (selectedCheckboxes.length === 0) {
        showMessage(t('editor.selectOneRow'), 'warning');
        return;
    }

    let insertHtml = '<ul style="margin: 4px 0; padding-left: 18px;">';
    
    selectedCheckboxes.forEach(checkbox => {
        const index = checkbox.getAttribute('data-row-index');
        const row = filteredData[index];
        if (!row) return;
        const rowString = JSON.stringify(row).replace(/"/g, '&quot;');
        
        const headerList = headers && headers.length > 0 ? headers : Object.keys(row);
        const displayValues = headerList.slice(0, 3).map(header => row[header] !== undefined ? `${header}: ${row[header]}` : '').filter(Boolean);
        const displayText = displayValues.join(' | ') || `Row ${parseInt(index) + 1}`;

        insertHtml += `<li data-live-data="${rowString}" style="color: #0284c7; font-weight: 600; margin-bottom: 3px;">
            <span contenteditable="false" style="font-size: 0.85em; opacity: 0.75;">(Row ${parseInt(index) + 1})</span> ${displayText}
        </li>`;
    });

    insertHtml += '</ul>';

    // 1. यदि Quill एडिटर सक्रिय है
    if (quill) {
        try {
            const range = quill.getSelection(true);
            if (range) {
                quill.clipboard.dangerouslyPasteHTML(range.index, insertHtml);
                quill.setSelection(range.index + insertHtml.length, 0); 
            } else {
                quill.root.innerHTML += insertHtml;
            }
            updatePreviewFromQuill();
        } catch (_) {}
    }

    // 2. यदि डैशबोर्ड पर सीधे किसी बॉक्स में डेटा डालना है
    const activeBox = targetBoxForDataInsert || selectedBox;
    if (activeBox) {
        const txt = activeBox.querySelector('.txt');
        if (txt) {
            txt.innerHTML += insertHtml;
            updateTextboxList();
            saveCurrentState();
        }
    }

    showMessage(`${selectedCheckboxes.length} डेटा पंक्ति(याँ) सफलतापूर्वक इन्सर्ट की गईं!`, 'success');
    closeDataInsertSidebar();
}

/**
 * क्विल एडिटर सामग्री के आधार पर टेक्स्टबॉक्स प्रीव्यू को अपडेट करता है।
 */
function updatePreviewFromQuill() {
    if (!quill || !textboxPreview) return;
    const quillContent = quill.root.innerHTML;
    const previewEditor = textboxPreview.querySelector('.ql-editor');
    
    let previewContent = quillContent;
    
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = quillContent;
    
    tempDiv.querySelectorAll('li[data-live-data]').forEach(li => {
        try {
            const rowData = JSON.parse(li.getAttribute('data-live-data'));
            const liveText = headers.slice(0, 3).map(header => rowData[header] || 'N/A').join(' | ');
            
            li.innerHTML = `<span style="font-size: 0.8em; color: green;">(LIVE DATA ROW)</span>: <span style="font-weight: bold;">${liveText}</span>`;
            li.style.backgroundColor = '#e6ffed';
            li.style.borderLeft = '4px solid green';
            li.removeAttribute('contenteditable');
        } catch (e) {
            console.error("Error parsing live data JSON:", e);
            li.innerHTML = '<span style="color: red;">[Invalid Live Data]</span>';
        }
    });

    previewContent = tempDiv.innerHTML;

    if (previewEditor) {
        previewEditor.innerHTML = previewContent;
    }
}

export function deselectAllBoxes() {
    hideFloatingFab();
    if (isInPlaceEditMode && selectedBox) {
        const textDiv = selectedBox.querySelector('.txt');
        if (textDiv) {
            textDiv.removeAttribute('contentEditable');
            textDiv.classList.remove('in-place-edit-active');
        }
        isInPlaceEditMode = false;
    }
    
    document.querySelectorAll(".box.selected").forEach(b => b.classList.remove('selected'));
    document.querySelectorAll(".box.edit-mode").forEach(b => b.classList.remove('edit-mode'));
    clearGuides();
    selectedBox = null;
    isEditMode = false;
    if(mainActionButton) mainActionButton.textContent = t('editor.createNew');
    if(quill) quill.setContents([]);
    if(bgColorPicker) bgColorPicker.value = '#ffffff';
    
    // Reset Styling Controls
    if(document.getElementById('textColorPicker')) document.getElementById('textColorPicker').value = '#374151';
    if(document.getElementById('paddingSlider')) document.getElementById('paddingSlider').value = 8;
    if(document.getElementById('paddingVal')) document.getElementById('paddingVal').textContent = '8px';
    if(document.getElementById('borderStyleSelect')) document.getElementById('borderStyleSelect').value = 'solid';
    if(document.getElementById('borderColorPicker')) document.getElementById('borderColorPicker').value = '#cfcfcf';
    if(document.getElementById('borderWidthSlider')) document.getElementById('borderWidthSlider').value = 1;
    if(document.getElementById('borderWidthVal')) document.getElementById('borderWidthVal').textContent = '1px';
    if(document.getElementById('borderRadiusSlider')) document.getElementById('borderRadiusSlider').value = 8;
    if(document.getElementById('borderRadiusVal')) document.getElementById('borderRadiusVal').textContent = '8px';
    if(document.getElementById('boxShadowSelect')) document.getElementById('boxShadowSelect').value = 'none';
    if(document.getElementById('animationSelect')) document.getElementById('animationSelect').value = '';

    document.body.style.cursor = 'default';
    if(textboxPreview) {
        if (textboxPreview.querySelector('.ql-editor')) {
            textboxPreview.querySelector('.ql-editor').innerHTML = '';
        }
        textboxPreview.style.backgroundColor = '#ffffff';
        textboxPreview.style.color = '#374151';
        textboxPreview.style.padding = '8px';
        textboxPreview.style.borderStyle = 'solid';
        textboxPreview.style.borderColor = '#cfcfcf';
        textboxPreview.style.borderWidth = '1px';
        textboxPreview.style.borderRadius = '8px';
        textboxPreview.style.boxShadow = 'none';
        textboxPreview.className = "box-preview";
    }
    closeDataInsertSidebar(); // Ensure sidebar closes on deselection
    
    // Update UI state
    updateUIState();
}

export function enterEditMode(box) {
    deselectAllBoxes(); 
    selectedBox = box;
    isEditMode = true;
    box.classList.add('selected', 'edit-mode');
    
    if(quill) quill.root.innerHTML = box.querySelector('.txt').innerHTML;
    
    const boxBgColor = window.getComputedStyle(box).backgroundColor;
    if(bgColorPicker) bgColorPicker.value = rgbToHex(boxBgColor) || '#ffffff';
    
    // Extract other custom styles
    const style = box.style;
    const textColor = rgbToHex(window.getComputedStyle(box).color) || '#374151';
    const paddingValNum = parseInt(style.padding) || parseInt(window.getComputedStyle(box).padding) || 8;
    const borderStyleVal = style.borderStyle || window.getComputedStyle(box).borderStyle || 'solid';
    const borderColorVal = rgbToHex(style.borderColor || window.getComputedStyle(box).borderColor) || '#cfcfcf';
    const borderWidthValNum = parseInt(style.borderWidth) || parseInt(window.getComputedStyle(box).borderWidth) || 1;
    const borderRadiusValNum = parseInt(style.borderRadius) || parseInt(window.getComputedStyle(box).borderRadius) || 8;
    const shadowVal = box.getAttribute('data-box-shadow') || 'none';
    const animClass = box.getAttribute('data-animation-class') || '';

    // Update UI controls
    if(document.getElementById('textColorPicker')) document.getElementById('textColorPicker').value = textColor;
    if(document.getElementById('paddingSlider')) {
        document.getElementById('paddingSlider').value = paddingValNum;
        document.getElementById('paddingVal').textContent = paddingValNum + 'px';
    }
    if(document.getElementById('borderStyleSelect')) document.getElementById('borderStyleSelect').value = borderStyleVal;
    if(document.getElementById('borderColorPicker')) document.getElementById('borderColorPicker').value = borderColorVal;
    if(document.getElementById('borderWidthSlider')) {
        document.getElementById('borderWidthSlider').value = borderWidthValNum;
        document.getElementById('borderWidthVal').textContent = borderWidthValNum + 'px';
    }
    if(document.getElementById('borderRadiusSlider')) {
        document.getElementById('borderRadiusSlider').value = borderRadiusValNum;
        document.getElementById('borderRadiusVal').textContent = borderRadiusValNum + 'px';
    }
    if(document.getElementById('boxShadowSelect')) document.getElementById('boxShadowSelect').value = shadowVal;
    if(document.getElementById('animationSelect')) document.getElementById('animationSelect').value = animClass;

    if(mainActionButton) mainActionButton.textContent = t('editor.updateTextbox');
    updatePreviewFromQuill(); 
    
    if (textboxPreview) {
        textboxPreview.style.backgroundColor = boxBgColor;
        textboxPreview.style.color = textColor;
        textboxPreview.style.padding = paddingValNum + 'px';
        textboxPreview.style.borderStyle = borderStyleVal;
        textboxPreview.style.borderColor = borderColorVal;
        textboxPreview.style.borderWidth = borderWidthValNum + 'px';
        textboxPreview.style.borderRadius = borderRadiusValNum + 'px';
        textboxPreview.style.boxShadow = getShadowCSS(shadowVal);
        textboxPreview.className = "box-preview " + animClass;
    }
    
    // Update UI state
    updateUIState();
}

/**
 * Enables in-place editing of the textbox content on the dashboard.
 * @param {HTMLElement} box The textbox element to edit.
 */
export function enterInPlaceEditMode(box) {
    deselectAllBoxes();
    
    selectedBox = box;
    isInPlaceEditMode = true; 
    isEditMode = true;
    box.classList.add('selected', 'edit-mode'); 

    const textDiv = box.querySelector('.txt');
    if (textDiv) {
        textDiv.setAttribute('contentEditable', 'true');
        textDiv.classList.add('in-place-edit-active'); 
        textDiv.focus(); 

        textDiv.onblur = (e) => {
            const related = e.relatedTarget;
            if (related && (isFabElement(related) || related.closest('#textbox-floating-fab-toolbar') || related.closest('#dataInsertSidebar'))) {
                return;
            }
        };

        textDiv.onkeydown = (e) => {
            if (e.key === 'Escape') {
                updateTextboxList();
                deselectAllBoxes();
            }
        };
    }

    // Launch Floating Transparent FAB Quill Formatting Menu right beside the textbox
    showFloatingFab(box, {
        onDone: () => {
            updateTextboxList();
            deselectAllBoxes();
        },
        onDataInsert: () => {
            openDataInsertSidebar();
        },
        onContentChange: (b) => {
            const txt = b.querySelector('.txt');
            if (txt && quill) {
                quill.root.innerHTML = txt.innerHTML;
                updatePreviewFromQuill();
            }
            updateTextboxList();
        }
    });
    
    if(mainActionButton) mainActionButton.textContent = t('editor.editingInPlace');
}

// Create a new box
export function createBox(x, y, rotation, content, bgColor, animationClass = "") {
    const dashContainer = document.getElementById('dashboardContent') || document.getElementById('visualizations');
    if (dashContainer) {
        fullScreenContainer = dashContainer;
    } else if (!fullScreenContainer) {
        fullScreenContainer = document.body;
    }

    const box = document.createElement('div');
    box.className = 'box';
    
    // Apply grid snapping if enabled
    const snappedX = snapToGrid(x);
    const snappedY = snapToGrid(y);
    
    box.style.transform = `translate(${snappedX}px, ${snappedY}px) rotate(${rotation}deg)`;
    box.style.backgroundColor = bgColor;
    box.style.zIndex = 1000;
    box.style.width = DEFAULT_BOX_WIDTH + 'px'; 
    box.style.height = DEFAULT_BOX_HEIGHT + 'px';
    box.id = "textbox-" + Date.now();

    if (animationClass) {
        box.classList.add(animationClass);
        box.setAttribute('data-animation-class', animationClass);
    }

    // Grab and apply current active style UI states
    const textColorPicker = document.getElementById('textColorPicker');
    const paddingSlider = document.getElementById('paddingSlider');
    const borderStyleSelect = document.getElementById('borderStyleSelect');
    const borderColorPicker = document.getElementById('borderColorPicker');
    const borderWidthSlider = document.getElementById('borderWidthSlider');
    const borderRadiusSlider = document.getElementById('borderRadiusSlider');
    const boxShadowSelect = document.getElementById('boxShadowSelect');

    const textColor = textColorPicker ? textColorPicker.value : '#374151';
    const padding = paddingSlider ? paddingSlider.value + 'px' : '8px';
    const borderStyle = borderStyleSelect ? borderStyleSelect.value : 'solid';
    const borderColor = borderColorPicker ? borderColorPicker.value : '#cfcfcf';
    const borderWidth = borderWidthSlider ? borderWidthSlider.value + 'px' : '1px';
    const borderRadius = borderRadiusSlider ? borderRadiusSlider.value + 'px' : '8px';
    const shadowType = boxShadowSelect ? boxShadowSelect.value : 'none';

    box.style.color = textColor;
    box.style.padding = padding;
    box.style.borderStyle = borderStyle;
    box.style.borderColor = borderColor;
    box.style.borderWidth = borderWidth;
    box.style.borderRadius = borderRadius;
    if (shadowType && shadowType !== 'none') {
        box.style.boxShadow = getShadowCSS(shadowType);
        box.setAttribute('data-box-shadow', shadowType);
    } else {
        box.style.boxShadow = 'none';
        box.removeAttribute('data-box-shadow');
    }

    const rotateHandle = document.createElement('div');
    rotateHandle.className = 'rotate-handle';
    rotateHandle.title = t('editor.rotate');
    const toolbar = document.createElement('div');
    toolbar.className = 'toolbar';
    const btnFront = document.createElement('button'); btnFront.className="front"; btnFront.innerHTML=`<i class="bi bi-bring-to-front"></i> ${t('editor.front')}`;
    const btnBack = document.createElement('button'); btnBack.className="back"; btnBack.innerHTML=`<i class="bi bi-send-to-back"></i> ${t('editor.back')}`;
    const btnDup = document.createElement('button'); btnDup.className="duplicate"; btnDup.innerHTML=`<i class="bi bi-copy"></i> ${t('editor.copy')}`;
    const btnDel = document.createElement('button'); btnDel.className="delete"; btnDel.innerHTML=`<i class="bi bi-trash"></i> ${t('editor.delete')}`;
    const btnLock = document.createElement('button'); btnLock.className="lock"; btnLock.innerHTML=`<i class="bi bi-lock"></i> ${t('editor.lock')}`;
    toolbar.appendChild(btnFront);
    toolbar.appendChild(btnBack);
    toolbar.appendChild(btnDup);
    toolbar.appendChild(btnDel);
    toolbar.appendChild(btnLock);

    const textDiv = document.createElement('div');
    textDiv.className = "txt"; 
    textDiv.innerHTML = content === '<p><br></p>' || content === '<p></p>' ? '' : content;

    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'resize-handle';
    resizeHandle.title = t('editor.resize');

    box.appendChild(rotateHandle);
    box.appendChild(toolbar);
    box.appendChild(textDiv);
    box.appendChild(resizeHandle);

    fullScreenContainer.appendChild(box);
    attachBoxEvents(box); 
    updateTextboxList();
    
    // Save state after creation
    saveCurrentState();
    
    return box;
}

// Deselect on outside click
function setupGlobalEvents() {
    document.addEventListener('pointerdown', (e) => {
        let targetElement = e.target;
        let isClickOnCanvasElement = false;
        while (targetElement) {
            // Check if the click is inside the active in-place editor or floating FAB
            if (targetElement.classList && targetElement.classList.contains('in-place-edit-active')) {
                 isClickOnCanvasElement = true;
                 break;
            }
            if (isFabElement(targetElement) || targetElement.id === 'textbox-floating-fab-toolbar' || (targetElement.classList && targetElement.classList.contains('quill-floating-fab'))) {
                 isClickOnCanvasElement = true;
                 break;
            }
            // Check for the new data sidebar
             if (targetElement === dataInsertSidebar || targetElement.closest('#dataInsertSidebar')) {
                 isClickOnCanvasElement = true;
                 break;
            }
            if (targetElement.id === 'dataInsertButton' || targetElement.closest('.ql-toolbar') || targetElement.closest('.ql-container')) {
                 isClickOnCanvasElement = true;
                 break;
            }
            if (targetElement.classList.contains('box') || targetElement.closest('.control-panel') || targetElement.closest('.offcanvas')) {
                isClickOnCanvasElement = true;
                break;
            }
            targetElement = targetElement.parentElement;
        }
        // If the click is outside all controls and boxes and not in the data sidebar
        if (!isClickOnCanvasElement) {
            deselectAllBoxes();
        }
    });
}

// Function to load template content into the editor
function loadTemplateIntoEditor(template) {
    deselectAllBoxes();
    if(quill) quill.root.innerHTML = template.content;
    if(bgColorPicker) bgColorPicker.value = template.bgColor;

    updatePreviewFromQuill();

    if (textboxPreview) {
        textboxPreview.style.backgroundColor = template.bgColor;
        if (template.animationClass) {
            textboxPreview.className = "box-preview " + template.animationClass;
        } else {
            textboxPreview.className = "box-preview";
        }
    }

    if(mainActionButton) mainActionButton.textContent = t('editor.createNew');
    isEditMode = false;
}

// Function to render templates
function renderTemplates() {
    const templateGallery = document.getElementById('templateGallery');
    if (!templateGallery) return;

    templateGallery.innerHTML = '';
    
    // Display only first 4 templates unless show all is toggled
    const templatesToRender = templatesShowAll ? TEXTBOX_TEMPLATES : TEXTBOX_TEMPLATES.slice(0, 4);

    templatesToRender.forEach(template => {
        const templateItem = document.createElement('div');
        templateItem.className = 'template-item';
        
        if (template.animationClass) {
            templateItem.classList.add(template.animationClass);
            templateItem.style.backgroundColor = 'transparent';
        } else {
            templateItem.style.backgroundColor = template.bgColor;
        }
        
        templateItem.innerHTML = `<span class="fw-bold">${template.name}</span>`;
        templateItem.onclick = () => {
            loadTemplateIntoEditor(template);
        };
        templateGallery.appendChild(templateItem);
    });

    const toggleBtn = document.getElementById('toggleTemplatesBtn');
    if (toggleBtn) {
        if (templatesShowAll) {
            toggleBtn.innerHTML = `<i class="bi bi-chevron-up me-1"></i> ${t('editor.showLess')}`;
        } else {
            toggleBtn.innerHTML = `<i class="bi bi-chevron-down me-1"></i> ${t('editor.showMore')}`;
        }
    }
}

// Function to update the list of textboxes in the sidebar
function updateTextboxList() {
    const textboxListContainer = document.getElementById('textboxList');
    if (!textboxListContainer) {
        return;
    }

    textboxListContainer.innerHTML = '';
    const allTextboxes = document.querySelectorAll('.box');

    if (allTextboxes.length === 0) {
        textboxListContainer.innerHTML = `<p class="text-muted small">${t('editor.noTextboxes')}</p>`;
        return;
    }

    allTextboxes.forEach((box, index) => {
        const listItem = document.createElement('div');
        listItem.className = 'list-group-item list-group-item-action';
        listItem.style.cursor = 'pointer';
        
        const innerText = box.querySelector('.txt')?.innerHTML || ''; 
        
        const textWithoutHtml = new DOMParser().parseFromString(innerText, 'text/html').body.textContent || '';
        const displayText = textWithoutHtml.trim() === '' ? `(${t('editor.emptyTextbox')})` : textWithoutHtml.substring(0, 30);
        
        listItem.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="bi bi-card-text me-2"></i>
                <div class="flex-grow-1 overflow-hidden text-truncate">
                    <strong>${t('editor.textboxLabel')} ${index + 1}</strong>
                    <div class="text-muted small">${displayText}...</div>
                </div>
            </div>
        `;
        
        listItem.addEventListener('click', () => {
            enterEditMode(box);
            box.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });

        textboxListContainer.appendChild(listItem);
    });
}

// Main function to initialize the editor
export async function initializeTextboxEditor() {
    const dashContainer = document.getElementById('dashboardContent') || document.getElementById('visualizations');
    fullScreenContainer = dashContainer || document.body;
    mainActionButton = document.getElementById('mainActionButton');
    bgColorPicker = document.getElementById('bgColorPicker');
    dataInsertButton = document.getElementById('dataInsertButton'); 
    textboxPreview = document.getElementById('textboxPreview');
    // **नये तत्व प्राप्त करें**
    dataInsertSidebar = document.getElementById('dataInsertSidebar');
    dataListContainer = document.getElementById('dataListContainer'); 

    if (!fullScreenContainer || !mainActionButton || !textboxPreview || !dataInsertButton) {
        console.warn("Required core elements for Textbox Editor not present on page.");
        return;
    }

    // Load templates from JSON first
    await loadTemplatesFromJSON();

    // Ensure Quill is loaded safely before usage
    const QuillClass = await ensureQuillLoaded();

    // Load Google Fonts before initializing Quill
    addGoogleFontsToQuill(QuillClass);
    
    // Initialize enhanced features
    setupEnhancedFeatures();

    const quillContainer = document.getElementById('quill-container');

    if (quillContainer && !quill && QuillClass) {
        try {
            quill = new QuillClass(quillContainer, {
                theme: 'snow',
                modules: {
                    toolbar: [
                        ['bold', 'italic', 'underline', 'strike'],
                        ['blockquote', 'code-block'],
                        [{ 'header': 1 }, { 'header': 2 }],
                        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                        [{ 'script': 'sub'}, { 'script': 'super' }],
                        [{ 'indent': '-1'}, { 'indent': '+1' }],
                        [{ 'direction': 'rtl' }],
                        [{ 'size': ['small', false, 'large', 'huge'] }],
                        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                        [{ 'color': [] }, { 'background': [] }],
                        [{ 'font': ['sans-serif', 'serif', 'monospace', ...CUSTOM_FONTS.map(f => f.toLowerCase().replace(/\s/g, '-'))] }],
                        [{ 'align': [] }],
                        ['link', 'image', 'video'],
                        ['clean']
                    ]
                }
            });
            
            quill.on('text-change', () => {
                updatePreviewFromQuill(); 

                if (isEditMode && selectedBox) {
                    const textDiv = selectedBox.querySelector('.txt');
                    if (textDiv) {
                        textDiv.innerHTML = quill ? quill.root.innerHTML : ''; 
                        updateTextboxList();
                    }
                }
            });
        } catch (initErr) {
            console.error('[Editor] Error initializing Quill editor:', initErr);
        }
    }

    // Now that quill is initialized, re-set dependencies with the new function
    setBoxEventDependencies(quill, deselectAllBoxes, enterEditMode, enterInPlaceEditMode, createBox, updateTextboxList, fullScreenContainer, GRID_SIZE, saveCurrentState, getSelectedBoxes);

    document.querySelectorAll('.box').forEach(b => attachBoxEvents(b));
    
    // --- Data Insert Button Event Listener ---
    dataInsertButton.onclick = openDataInsertSidebar;
    
    // Sidebar के "Insert Selected" बटन पर इवेंट लिसनर
    const insertDataBtn = document.getElementById('insertSelectedDataBtn');
    if (insertDataBtn) {
        insertDataBtn.onclick = insertSelectedData;
    }
    // Sidebar के "Close" बटन पर इवेंट लिसनर
    const closeSidebarBtn = document.getElementById('closeDataSidebarBtn');
     if (closeSidebarBtn) {
        closeSidebarBtn.onclick = closeDataInsertSidebar;
    }
    // ------------------------------------------

    // --- Advanced Style Controls Binding ---
    const textColorPicker = document.getElementById('textColorPicker');
    const paddingSlider = document.getElementById('paddingSlider');
    const paddingVal = document.getElementById('paddingVal');
    const borderStyleSelect = document.getElementById('borderStyleSelect');
    const borderColorPicker = document.getElementById('borderColorPicker');
    const borderWidthSlider = document.getElementById('borderWidthSlider');
    const borderWidthVal = document.getElementById('borderWidthVal');
    const borderRadiusSlider = document.getElementById('borderRadiusSlider');
    const borderRadiusVal = document.getElementById('borderRadiusVal');
    const boxShadowSelect = document.getElementById('boxShadowSelect');
    const animationSelect = document.getElementById('animationSelect');

    const updateSelectedOrPreview = () => {
        const bgColor = bgColorPicker.value;
        const textColor = textColorPicker ? textColorPicker.value : '#374151';
        const padding = paddingSlider ? paddingSlider.value + 'px' : '8px';
        const borderStyle = borderStyleSelect ? borderStyleSelect.value : 'solid';
        const borderColor = borderColorPicker ? borderColorPicker.value : '#cfcfcf';
        const borderWidth = borderWidthSlider ? borderWidthSlider.value + 'px' : '1px';
        const borderRadius = borderRadiusSlider ? borderRadiusSlider.value + 'px' : '8px';
        const shadowType = boxShadowSelect ? boxShadowSelect.value : 'none';
        const animClass = animationSelect ? animationSelect.value : '';

        // Apply to preview
        if (textboxPreview) {
            textboxPreview.style.backgroundColor = bgColor;
            textboxPreview.style.color = textColor;
            textboxPreview.style.padding = padding;
            textboxPreview.style.borderStyle = borderStyle;
            textboxPreview.style.borderColor = borderColor;
            textboxPreview.style.borderWidth = borderWidth;
            textboxPreview.style.borderRadius = borderRadius;
            textboxPreview.style.boxShadow = getShadowCSS(shadowType);
            textboxPreview.className = "box-preview " + animClass;
        }

        // Apply to selected box if in edit mode
        if (isEditMode && selectedBox) {
            selectedBox.style.backgroundColor = bgColor;
            selectedBox.style.color = textColor;
            selectedBox.style.padding = padding;
            selectedBox.style.borderStyle = borderStyle;
            selectedBox.style.borderColor = borderColor;
            selectedBox.style.borderWidth = borderWidth;
            selectedBox.style.borderRadius = borderRadius;
            selectedBox.style.boxShadow = getShadowCSS(shadowType);
            selectedBox.setAttribute('data-box-shadow', shadowType);
            
            if (animClass) {
                selectedBox.className = "box selected edit-mode " + animClass;
                selectedBox.setAttribute('data-animation-class', animClass);
            } else {
                selectedBox.className = "box selected edit-mode";
                selectedBox.removeAttribute('data-animation-class');
            }
            saveCurrentState();
        }
    };

    if (textColorPicker) textColorPicker.oninput = updateSelectedOrPreview;
    if (paddingSlider) {
        paddingSlider.oninput = (e) => {
            if (paddingVal) paddingVal.textContent = e.target.value + 'px';
            updateSelectedOrPreview();
        };
    }
    if (borderStyleSelect) borderStyleSelect.onchange = updateSelectedOrPreview;
    if (borderColorPicker) borderColorPicker.oninput = updateSelectedOrPreview;
    if (borderWidthSlider) {
        borderWidthSlider.oninput = (e) => {
            if (borderWidthVal) borderWidthVal.textContent = e.target.value + 'px';
            updateSelectedOrPreview();
        };
    }
    if (borderRadiusSlider) {
        borderRadiusSlider.oninput = (e) => {
            if (borderRadiusVal) borderRadiusVal.textContent = e.target.value + 'px';
            updateSelectedOrPreview();
        };
    }
    if (boxShadowSelect) boxShadowSelect.onchange = updateSelectedOrPreview;
    if (animationSelect) animationSelect.onchange = updateSelectedOrPreview;

    mainActionButton.onclick = () => {
        const content = quill ? quill.root.innerHTML : (textboxPreview ? textboxPreview.innerHTML : '');
        const bgColor = bgColorPicker ? bgColorPicker.value : '#ffffff';

        if (isEditMode && selectedBox) {
            // Logic for updating box from sidebar editor
            const textDiv = selectedBox.querySelector('.txt');
            if (textDiv) {
                textDiv.innerHTML = content;
            }
            selectedBox.style.backgroundColor = bgColor;
            
            // Apply other style selections
            const textColor = textColorPicker ? textColorPicker.value : '#374151';
            const padding = paddingSlider ? paddingSlider.value + 'px' : '8px';
            const borderStyle = borderStyleSelect ? borderStyleSelect.value : 'solid';
            const borderColor = borderColorPicker ? borderColorPicker.value : '#cfcfcf';
            const borderWidth = borderWidthSlider ? borderWidthSlider.value + 'px' : '1px';
            const borderRadius = borderRadiusSlider ? borderRadiusSlider.value + 'px' : '8px';
            const shadowType = boxShadowSelect ? boxShadowSelect.value : 'none';
            const animationClass = animationSelect ? animationSelect.value : '';

            selectedBox.style.color = textColor;
            selectedBox.style.padding = padding;
            selectedBox.style.borderStyle = borderStyle;
            selectedBox.style.borderColor = borderColor;
            selectedBox.style.borderWidth = borderWidth;
            selectedBox.style.borderRadius = borderRadius;
            if (shadowType && shadowType !== 'none') {
                selectedBox.style.boxShadow = getShadowCSS(shadowType);
                selectedBox.setAttribute('data-box-shadow', shadowType);
            } else {
                selectedBox.style.boxShadow = 'none';
                selectedBox.removeAttribute('data-box-shadow');
            }

            if (animationClass) {
                selectedBox.className = "box selected edit-mode " + animationClass;
                selectedBox.setAttribute('data-animation-class', animationClass);
            } else {
                selectedBox.className = "box selected edit-mode";
                selectedBox.removeAttribute('data-animation-class');
            }
            deselectAllBoxes();
            updateTextboxList();
            saveCurrentState();
        } else {
            // Logic for creating a new box
            const x = (window.innerWidth / 2) - (DEFAULT_BOX_WIDTH / 2); 
            const y = (window.innerHeight / 2) - (DEFAULT_BOX_HEIGHT / 2); 

            const animationClass = animationSelect ? animationSelect.value : '';
            
            createBox(x, y, 0, content, bgColor, animationClass);
            
            if (quill) {
                quill.setContents([]);
            }
            const previewEditor = textboxPreview.querySelector('.ql-editor');
            if (previewEditor) {
                previewEditor.innerHTML = '';
            }
            
            // Clear inputs
            deselectAllBoxes();
        }
    };

    if (bgColorPicker) {
        bgColorPicker.oninput = (e) => {
            const newColor = e.target ? e.target.value : '#ffffff';
            if (isEditMode && selectedBox) {
                selectedBox.style.backgroundColor = newColor;
            }
            if (textboxPreview) {
                textboxPreview.style.backgroundColor = newColor;
            }
        };
    }

    // Toggle templates show all / show less
    const toggleTemplatesBtn = document.getElementById('toggleTemplatesBtn');
    if (toggleTemplatesBtn) {
        toggleTemplatesBtn.onclick = () => {
            templatesShowAll = !templatesShowAll;
            renderTemplates();
        };
    }

    // Toggle sidebar fullscreen mode
    const toggleSidebarFullscreenBtn = document.getElementById('toggleSidebarFullscreenBtn');
    if (toggleSidebarFullscreenBtn) {
        toggleSidebarFullscreenBtn.onclick = () => {
            const sidebar = document.getElementById('offcanvasSidebar');
            if (sidebar) {
                sidebar.classList.toggle('sidebar-fullscreen');
                
                // Update button icon & title
                const isFullscreen = sidebar.classList.contains('sidebar-fullscreen');
                toggleSidebarFullscreenBtn.setAttribute('title', isFullscreen ? t('editor.exitFullscreen') : t('editor.fullscreen'));
                const icon = toggleSidebarFullscreenBtn.querySelector('i');
                if (icon) {
                    if (isFullscreen) {
                        icon.className = 'bi bi-fullscreen-exit';
                    } else {
                        icon.className = 'bi bi-arrows-fullscreen';
                    }
                }
            }
        };
    }

    setupGlobalEvents(); 
    renderTemplates();
    updateTextboxList();
    updateUIState(); // Initial UI state update

    // Register language change listener
    onLanguageChange(() => {
        renderTemplates();
        updateTextboxList();
        if (mainActionButton) {
            mainActionButton.textContent = isEditMode ? t('editor.updateTextbox') : t('editor.createNew');
        }
        // Update all existing box toolbars dynamically
        document.querySelectorAll('.box').forEach(box => {
            const rot = box.querySelector('.rotate-handle');
            if (rot) rot.title = t('editor.rotate');
            const res = box.querySelector('.resize-handle');
            if (res) res.title = t('editor.resize');
            const btnF = box.querySelector('.toolbar .front');
            if (btnF) btnF.innerHTML = `<i class="bi bi-bring-to-front"></i> ${t('editor.front')}`;
            const btnB = box.querySelector('.toolbar .back');
            if (btnB) btnB.innerHTML = `<i class="bi bi-send-to-back"></i> ${t('editor.back')}`;
            const btnD = box.querySelector('.toolbar .duplicate');
            if (btnD) btnD.innerHTML = `<i class="bi bi-copy"></i> ${t('editor.copy')}`;
            const btnDel = box.querySelector('.toolbar .delete');
            if (btnDel) btnDel.innerHTML = `<i class="bi bi-trash"></i> ${t('editor.delete')}`;
            const btnL = box.querySelector('.toolbar .lock');
            if (btnL) {
                const isLocked = box.classList.contains('locked');
                btnL.innerHTML = isLocked ? `<i class="bi bi-unlock"></i> ${t('editor.unlock')}` : `<i class="bi bi-lock"></i> ${t('editor.lock')}`;
            }
        });
    });
}