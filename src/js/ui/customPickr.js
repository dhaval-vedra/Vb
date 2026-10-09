// src/js/customPickr.js
import { t } from '../i18n/index.ts';

/**
 * Converts a browser native <input type="color"> into a modern, gorgeous custom color selector
 * powered by the Simonwep Pickr library already loaded in the application.
 * It keeps values and state 100% in sync with the hidden input to avoid breaking existing handlers.
 * 
 * @param {HTMLInputElement|string} inputIdOrEl - The input element or its ID.
 * @param {string} defaultColor - Fallback hex color if input is empty.
 */
export function convertInputToPickr(inputIdOrEl, defaultColor = '#5470C6') {
    const input = typeof inputIdOrEl === 'string' 
        ? document.getElementById(inputIdOrEl) 
        : inputIdOrEl;
        
    if (!input) return null;
    
    // Skip if already converted
    if (input.dataset.pickrConverted === 'true') {
        return null;
    }

    // Hide original element
    input.style.setProperty('display', 'none', 'important');
    input.dataset.pickrConverted = 'true';

    // Verify Pickr is available globally
    if (typeof window.Pickr === 'undefined') {
        console.warn(`[CustomPickr] Pickr is not globally available. Skipping ${input.id}`);
        // Restore visibility as fallback
        input.style.removeProperty('display');
        return null;
    }

    // Create wrapper container next to input
    const container = document.createElement('div');
    container.className = 'custom-pickr-wrapper d-inline-block align-middle';
    container.style.margin = '4px 0';
    
    // Create inner element for Pickr binding
    const pickrEl = document.createElement('div');
    container.appendChild(pickrEl);
    
    input.parentNode.insertBefore(container, input.nextSibling);

    // Initialize Pickr
    const pickrInstance = window.Pickr.create({
        el: pickrEl,
        theme: 'classic',
        default: input.value || defaultColor,
        swatches: [
            '#5470C6', '#91CC75', '#FAC858', '#EE6666', '#73C0DE', 
            '#3BA272', '#FC8452', '#9A60B4', '#EA7CCC', '#0d6efd',
            '#198754', '#dc3545', '#212529', '#ffffff'
        ],
        components: {
            preview: true,
            opacity: true,
            hue: true,
            interaction: {
                hex: true,
                rgba: true,
                input: true,
                save: true,
                clear: false
            }
        },
        i18n: {
            'btn:save': t('customControls.saveColor'),
            'btn:cancel': t('customControls.cancelColor')
        }
    });

    // Handle updates
    let isUpdating = false;
    const updateInput = (color) => {
        if (isUpdating) return;
        isUpdating = true;
        const hex = color.toHEXA().toString();
        input.value = hex;
        // Dispatch event for any active onchange or oninput listeners
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        isUpdating = false;
    };

    pickrInstance.on('change', updateInput);
    pickrInstance.on('save', (color) => {
        updateInput(color);
        pickrInstance.hide();
    });

    // Listen to changes on the native input (e.g. programmatically changed) to update Pickr color
    input.addEventListener('change', () => {
        if (isUpdating) return;
        isUpdating = true;
        if (input.value) {
            pickrInstance.setColor(input.value);
        }
        isUpdating = false;
    });

    // Set styling of Pickr button to match premium theme
    setTimeout(() => {
        const btn = container.querySelector('.pcr-button');
        if (btn) {
            btn.style.width = '100%';
            btn.style.height = '36px';
            btn.style.borderRadius = '8px';
            btn.style.border = '1px solid #cbd5e1';
            btn.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
        }
    }, 100);

    return pickrInstance;
}

/**
 * Scans a container and converts all native color picker inputs to custom Pickrs.
 * 
 * @param {HTMLElement} container - Container parent DOM element.
 */
export function convertAllColorPickersInContainer(container) {
    if (!container) return;
    const inputs = container.querySelectorAll('input[type="color"]');
    inputs.forEach(inp => {
        convertInputToPickr(inp, inp.value);
    });
}
