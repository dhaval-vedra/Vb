// src/js/layout/globalFilters.ts
import { getRawData, getHeaders, applyFiltersAndSort } from '../../store/DataHandler.ts';
import { showMessage } from '../core/utils.ts';

export function initGlobalFilters(): void {
    const globalColSelect = document.getElementById('globalFilterCol') as HTMLSelectElement | null;
    const globalValSelect = document.getElementById('globalFilterVal') as HTMLSelectElement | null;
    const applyBtn = document.getElementById('globalApplyFilterBtn') as HTMLButtonElement | null;
    const resetBtn = document.getElementById('globalResetFilterBtn') as HTMLButtonElement | null;

    if (!globalColSelect || !globalValSelect || !applyBtn || !resetBtn) {
        console.warn('Global filter elements not found in DOM.');
        return;
    }

    // Populate Column selector when data is updated
    document.addEventListener('dataLoaded', populateColumnDropdown);
    document.addEventListener('dataLoadedFromFirebase', populateColumnDropdown);

    // Initial population if data already loaded
    populateColumnDropdown();

    // Event listener for column selection change
    globalColSelect.addEventListener('change', () => {
        const col = globalColSelect.value;
        if (!col) {
            globalValSelect.innerHTML = '<option value="">-- सभी मान (All) --</option>';
            globalValSelect.disabled = true;
            return;
        }

        const rawData = getRawData() || [];
        const uniqueValues = [...new Set(rawData.map(row => row[col] !== undefined && row[col] !== null ? String(row[col]).trim() : '').filter(val => val !== ''))].sort();

        globalValSelect.innerHTML = '<option value="">-- सभी मान (All) --</option>' + 
            uniqueValues.map(val => `<option value="${val}">${val}</option>`).join('');
        globalValSelect.disabled = false;
    });

    // Event listener for Apply Filter button
    applyBtn.addEventListener('click', () => {
        showMessage("ग्लोबल फ़िल्टर लागू किया जा रहा है...", "info");
        // Trigger the core DataHandler filter flow
        applyFiltersAndSort();
    });

    // Event listener for Reset Filter button
    resetBtn.addEventListener('click', () => {
        globalColSelect.value = '';
        globalValSelect.innerHTML = '<option value="">-- सभी मान (All) --</option>';
        globalValSelect.disabled = true;
        
        const startDate = document.getElementById('globalStartDate') as HTMLInputElement | null;
        const endDate = document.getElementById('globalEndDate') as HTMLInputElement | null;
        if (startDate) startDate.value = '';
        if (endDate) endDate.value = '';

        showMessage("ग्लोबल फ़िल्टर रीसेट कर दिया गया।", "success");
        applyFiltersAndSort();
    });
}

function populateColumnDropdown(): void {
    const globalColSelect = document.getElementById('globalFilterCol') as HTMLSelectElement | null;
    if (!globalColSelect) return;

    const headers = getHeaders() || [];
    const currentValue = globalColSelect.value;

    globalColSelect.innerHTML = '<option value="">-- कॉलम चुनें (None) --</option>' +
        headers.map(h => `<option value="${h}">${h}</option>`).join('');

    if (headers.includes(currentValue)) {
        globalColSelect.value = currentValue;
    } else {
        const globalValSelect = document.getElementById('globalFilterVal') as HTMLSelectElement | null;
        if (globalValSelect) {
            globalValSelect.innerHTML = '<option value="">-- सभी मान (All) --</option>';
            globalValSelect.disabled = true;
        }
    }
}
