// src/js/customSelect.js
import { showMessage } from '../core/utils.ts';
import { t, onLanguageChange } from '../i18n/index.ts';

/**
 * Converts a standard native HTML <select> element into a highly customized,
 * premium interactive dropdown menu that avoids opening the browser's built-in select popup.
 * It remains synchronized with the original element, triggering 'change' and 'input' events automatically.
 * 
 * @param {HTMLSelectElement|string} selectElementOrId - The native select element or its ID.
 */
export function convertToCustomSelect(selectElementOrId) {
    const select = typeof selectElementOrId === 'string' 
        ? document.getElementById(selectElementOrId) 
        : selectElementOrId;
        
    if (!select) return null;
    
    // If already custom-converted, skip to avoid duplicates
    if (select.dataset.customConverted === 'true') {
        return document.getElementById(`${select.id}-custom-wrapper`);
    }

    // Hide original select element securely
    select.style.setProperty('display', 'none', 'important');
    select.dataset.customConverted = 'true';

    // Create wrapper container
    const wrapper = document.createElement('div');
    wrapper.id = `${select.id}-custom-wrapper`;
    wrapper.className = 'custom-select-wrapper position-relative';
    wrapper.style.minWidth = '180px';
    wrapper.style.width = '100%';

    // Inject custom select styles if not already present
    injectCustomSelectStyles();

    // Create selection trigger button
    const trigger = document.createElement('div');
    trigger.className = 'custom-select-trigger d-flex align-items-center justify-content-between p-2 rounded-3 border bg-white text-dark fw-bold shadow-sm';
    trigger.style.cursor = 'pointer';
    trigger.style.height = '38px';
    trigger.style.fontSize = '0.9rem';
    trigger.style.transition = 'all 0.25s ease';
    
    const triggerText = document.createElement('span');
    triggerText.className = 'custom-select-trigger-text text-truncate d-flex align-items-center gap-2';
    
    const arrowIcon = document.createElement('i');
    arrowIcon.className = 'bi bi-chevron-down text-secondary fs-6 transition-transform';
    arrowIcon.style.transition = 'transform 0.2s ease';

    trigger.appendChild(triggerText);
    trigger.appendChild(arrowIcon);

    // Create floating custom options menu
    const dropdown = document.createElement('div');
    dropdown.className = 'custom-select-dropdown position-absolute w-100 mt-1.5 bg-white border rounded-3 shadow-lg d-none';
    dropdown.style.zIndex = '2000';
    dropdown.style.maxHeight = '220px';
    dropdown.style.overflowY = 'auto';
    dropdown.style.transition = 'all 0.2s ease';

    wrapper.appendChild(trigger);
    wrapper.appendChild(dropdown);

    // Insert wrapper where the original select was
    select.parentNode.insertBefore(wrapper, select.nextSibling);

    // Populate custom dropdown options
    function populateDropdown() {
        dropdown.innerHTML = '';
        
        // Add custom search input if options list is long (> 6 items)
        if (select.options.length > 6) {
            const searchContainer = document.createElement('div');
            searchContainer.className = 'p-2 border-bottom sticky-top bg-white';
            searchContainer.innerHTML = `
                <div class="input-group input-group-sm">
                    <span class="input-group-text bg-light border-end-0"><i class="bi bi-search text-muted"></i></span>
                    <input type="text" class="form-control form-control-sm border-start-0" placeholder="${t('customControls.searchOption')}" style="font-size: 0.8rem;">
                </div>
            `;
            const searchInput = searchContainer.querySelector('input');
            
            // Search filter event
            searchInput.addEventListener('input', (e) => {
                const query = e.target.value.toLowerCase().trim();
                const optionElements = dropdown.querySelectorAll('.custom-select-option');
                optionElements.forEach(opt => {
                    const text = opt.textContent.toLowerCase();
                    if (text.includes(query)) {
                        opt.style.setProperty('display', 'flex', 'important');
                    } else {
                        opt.style.setProperty('display', 'none', 'important');
                    }
                });
            });

            // Prevent closing dropdown when clicking search
            searchContainer.addEventListener('click', (e) => e.stopPropagation());
            dropdown.appendChild(searchContainer);
        }

        const optionsGroup = document.createElement('div');
        optionsGroup.className = 'custom-options-list';
        
        Array.from(select.options).forEach((opt, idx) => {
            const optionDiv = document.createElement('div');
            optionDiv.className = `custom-select-option d-flex align-items-center justify-content-between px-3 py-2.5 cursor-pointer text-dark`;
            optionDiv.style.cursor = 'pointer';
            optionDiv.style.fontSize = '0.85rem';
            optionDiv.style.transition = 'background-color 0.15s ease';
            optionDiv.dataset.value = opt.value;
            optionDiv.dataset.index = idx;

            // Highlight selected item
            const isSelected = opt.selected;
            if (isSelected) {
                optionDiv.classList.add('selected-option', 'bg-primary-subtle', 'text-primary', 'fw-bold');
            }

            optionDiv.innerHTML = `
                <span class="option-label text-truncate">${opt.textContent}</span>
                ${isSelected ? '<i class="bi bi-check-lg text-primary fw-bold"></i>' : ''}
            `;

            optionDiv.addEventListener('click', (e) => {
                e.stopPropagation();
                
                // Update native select
                select.selectedIndex = idx;
                
                // Trigger events
                select.dispatchEvent(new Event('input', { bubbles: true }));
                select.dispatchEvent(new Event('change', { bubbles: true }));
                
                // Update UI state
                updateTriggerText();
                closeDropdown();
            });

            optionsGroup.appendChild(optionDiv);
        });

        dropdown.appendChild(optionsGroup);
    }

    // Update trigger button display based on selected index
    function updateTriggerText() {
        const activeOption = select.options[select.selectedIndex];
        if (activeOption) {
            triggerText.innerHTML = `<i class="bi bi-circle-fill text-primary" style="font-size: 6px;"></i> ${activeOption.textContent}`;
        } else {
            triggerText.textContent = t('customControls.selectPlaceholder');
        }
    }

    // Toggle dropdown open/closed
    function toggleDropdown(e) {
        if (e) e.stopPropagation();
        const isOpen = !dropdown.classList.contains('d-none');
        if (isOpen) {
            closeDropdown();
        } else {
            // Close all other open custom selects first
            document.querySelectorAll('.custom-select-dropdown').forEach(el => el.classList.add('d-none'));
            document.querySelectorAll('.custom-select-trigger').forEach(el => el.classList.remove('active'));
            document.querySelectorAll('.custom-select-trigger i').forEach(el => el.style.transform = 'rotate(0deg)');
            
            // Populate dynamic choices
            populateDropdown();
            
            dropdown.classList.remove('d-none');
            trigger.classList.add('active');
            arrowIcon.style.transform = 'rotate(180deg)';
        }
    }

    function closeDropdown() {
        dropdown.classList.add('d-none');
        trigger.classList.remove('active');
        arrowIcon.style.transform = 'rotate(0deg)';
    }

    // Listeners
    trigger.addEventListener('click', toggleDropdown);
    
    // Close dropdown on clicking outside
    document.addEventListener('click', (e) => {
        if (!wrapper.contains(e.target)) {
            closeDropdown();
        }
    });

    // Handle external mutations or dynamic changes in native select options
    const observer = new MutationObserver(() => {
        populateDropdown();
        updateTriggerText();
    });
    observer.observe(select, { childList: true, subtree: true, characterData: true, attributes: true });

    // Sync custom UI when native select changes (either via user event or programmatically)
    select.addEventListener('change', () => {
        updateTriggerText();
    });
    select.addEventListener('input', () => {
        updateTriggerText();
    });

    // Initial setups
    updateTriggerText();

    return wrapper;
}

/**
 * Injects CSS stylesheets required for custom-select components
 */
function injectCustomSelectStyles() {
    if (document.getElementById('customSelectGlobalStyles')) return;

    const style = document.createElement('style');
    style.id = 'customSelectGlobalStyles';
    style.innerHTML = `
        .custom-select-trigger:hover, .custom-select-trigger.active {
            border-color: var(--bs-primary, #0d6efd) !important;
            box-shadow: 0 0 0 3px rgba(13, 110, 253, 0.15) !important;
            background-color: #f8fafc !important;
        }
        
        .custom-select-option:hover {
            background-color: #f1f5f9 !important;
            color: var(--bs-primary, #0d6efd) !important;
        }
        
        .custom-select-option.selected-option {
            background-color: rgba(13, 110, 253, 0.08) !important;
            color: var(--bs-primary, #0d6efd) !important;
        }
        
        .custom-select-dropdown {
            animation: customSelectFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1) !important;
            border-color: #e2e8f0 !important;
        }

        /* Dark Theme Support Styles */
        body.dark-theme .custom-select-trigger {
            background-color: #1e293b !important;
            color: #f8f9fa !important;
            border-color: #334155 !important;
        }
        body.dark-theme .custom-select-trigger:hover, body.dark-theme .custom-select-trigger.active {
            border-color: var(--bs-primary, #0d6efd) !important;
            box-shadow: 0 0 0 3px rgba(13, 110, 253, 0.25) !important;
            background-color: #334155 !important;
        }
        body.dark-theme .custom-select-dropdown {
            background-color: #1e293b !important;
            border-color: #334155 !important;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5) !important;
        }
        body.dark-theme .custom-select-dropdown .sticky-top {
            background-color: #1e293b !important;
            border-bottom-color: #334155 !important;
        }
        body.dark-theme .custom-select-dropdown .input-group-text, 
        body.dark-theme .custom-select-dropdown .form-control {
            background-color: #0f172a !important;
            border-color: #334155 !important;
            color: #cbd5e1 !important;
        }
        body.dark-theme .custom-select-option {
            color: #f8f9fa !important;
        }
        body.dark-theme .custom-select-option:hover {
            background-color: #334155 !important;
            color: #60a5fa !important;
        }
        body.dark-theme .custom-select-option.selected-option {
            background-color: rgba(59, 130, 246, 0.2) !important;
            color: #60a5fa !important;
        }

        @keyframes customSelectFadeIn {
            from {
                opacity: 0;
                transform: translateY(5px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    `;
    document.head.appendChild(style);
}

/**
 * Automatically detects and converts select elements inside a container.
 * 
 * @param {HTMLElement} container - The container parent element.
 */
export function convertAllSelectsInContainer(container) {
    if (!container) return;
    const selects = container.querySelectorAll('select.form-select');
    selects.forEach(select => {
        // Exclude multiple selections or very specific selects if needed
        if (select.multiple || select.classList.contains('d-none')) return;
        convertToCustomSelect(select);
    });
}
