// src/js/layout/filter.ts

/**
 * सभी फ़िल्टर और सॉर्ट नियमों को लागू करता है और फ़िल्टर्ड डेटा वापस करता है।
 * @param rawData - मूल डेटा।
 * @param headers - डेटा के कॉलम हेडर।
 * @returns फ़िल्टर और सॉर्ट किया गया डेटा।
 */
export function applyFiltersAndSort(rawData: Record<string, any>[], headers: string[]): Record<string, any>[] {
    let data = [...rawData];
    
    // --- 0. Global Live Dashboard Filters ---
    const globalCol = (document.getElementById('globalFilterCol') as HTMLSelectElement)?.value;
    const globalVal = (document.getElementById('globalFilterVal') as HTMLSelectElement)?.value;
    const globalStart = (document.getElementById('globalStartDate') as HTMLInputElement)?.value;
    const globalEnd = (document.getElementById('globalEndDate') as HTMLInputElement)?.value;

    if (globalCol && globalVal) {
        data = data.filter(row => {
            const cell = row[globalCol] !== undefined && row[globalCol] !== null ? String(row[globalCol]) : '';
            return cell === globalVal;
        });
    }

    if (globalStart || globalEnd) {
        // Find date column dynamically or use first date column
        const dateCol = headers.find(h => h.toLowerCase().includes('date') || h.toLowerCase().includes('tarikh')) || headers[0];
        
        const start = globalStart ? new Date(globalStart) : null;
        if (start) start.setHours(0,0,0,0);
        const end = globalEnd ? new Date(globalEnd) : null;
        if (end) end.setHours(23,59,59,999);

        data = data.filter(row => {
            const dateValue = row[dateCol];
            if (!dateValue) return false;
            const rowDate = new Date(dateValue);
            if (isNaN(rowDate.getTime())) return false;
            
            const startValid = !start || rowDate >= start;
            const endValid = !end || rowDate <= end;
            return startValid && endValid;
        });
    }
    
    // --- Determine active status for each of the 4 sidebar filters ---
    // 1. Text Filter
    const filterCol = (document.getElementById('filterCol') as HTMLSelectElement)?.value || null;
    const filterValue = (document.getElementById('filterValue') as HTMLInputElement)?.value || '';
    const operator = (document.getElementById('textFilterOperator') as HTMLSelectElement)?.value || 'includes';
    const filterValueLower = filterValue.toLowerCase();
    const isTextFilterActive = !!(filterCol && filterValue);
    const testTextFilter = (row: Record<string, any>) => {
        if (!filterCol) return true;
        const cell = row[filterCol] !== undefined && row[filterCol] !== null ? String(row[filterCol]).toLowerCase() : '';
        switch (operator) {
            case 'startsWith': return cell.startsWith(filterValueLower);
            case 'endsWith': return cell.endsWith(filterValueLower);
            case 'equals': return cell === filterValueLower;
            case 'doesNotInclude': return !cell.includes(filterValueLower);
            case 'includes':
            default: return cell.includes(filterValueLower);
        }
    };

    // 2. Multi-Select Filter
    const multiCol = (document.getElementById('multiSelectFilterCol') as HTMLSelectElement)?.value;
    const selectedValues = Array.from(document.querySelectorAll<HTMLInputElement>('#multiSelectOptions input[type="checkbox"]:checked'))
        .map(el => el.value);
    const isMultiFilterActive = !!(multiCol && selectedValues.length > 0);
    const testMultiFilter = (row: Record<string, any>) => {
        if (!multiCol) return true;
        const value = row[multiCol] !== undefined && row[multiCol] !== null ? String(row[multiCol]) : '';
        return selectedValues.includes(value);
    };

    // 3. Numeric Range Filter
    const numericCol = (document.getElementById('filterNumericCol') as HTMLSelectElement)?.value;
    const minInput = (document.getElementById('minNumericValue') as HTMLInputElement)?.value;
    const maxInput = (document.getElementById('maxNumericValue') as HTMLInputElement)?.value;
    const minValue = minInput !== undefined && minInput !== '' ? parseFloat(minInput) : NaN;
    const maxValue = maxInput !== undefined && maxInput !== '' ? parseFloat(maxInput) : NaN;
    const isNumericFilterActive = !!(numericCol && (!isNaN(minValue) || !isNaN(maxValue)));
    const testNumericFilter = (row: Record<string, any>) => {
        if (!numericCol) return true;
        const value = parseFloat(row[numericCol]);
        if (isNaN(value)) return false;
        const minValid = isNaN(minValue) || value >= minValue;
        const maxValid = isNaN(maxValue) || value <= maxValue;
        return minValid && maxValid;
    };

    // 4. Date Range Filter
    const startDate = (document.getElementById('startDate') as HTMLInputElement)?.value;
    const endDate = (document.getElementById('endDate') as HTMLInputElement)?.value;
    const isDateFilterActive = !!(startDate && endDate);
    const testDateFilter = (row: Record<string, any>) => {
        const dateCol = headers.find(h => h.toLowerCase().includes('date') || h.toLowerCase().includes('tarikh')) || headers[0];
        const start = new Date(startDate); start.setHours(0,0,0,0);
        const end = new Date(endDate); end.setHours(23,59,59,999);
        const dateValue = row[dateCol]; 
        if (!dateValue) return false; 
        const rowDate = new Date(dateValue); 
        return !isNaN(rowDate.getTime()) && rowDate >= start && rowDate <= end;
    };

    // --- Apply Logical AND / OR Match Mode for Sidebar Filters ---
    const isOrMode = (document.querySelector('input[name="filterMatchMode"]:checked') as HTMLInputElement)?.value === 'OR';
    
    const activeFilters: ((row: Record<string, any>) => boolean)[] = [];
    if (isTextFilterActive) activeFilters.push(testTextFilter);
    if (isMultiFilterActive) activeFilters.push(testMultiFilter);
    if (isNumericFilterActive) activeFilters.push(testNumericFilter);
    if (isDateFilterActive) activeFilters.push(testDateFilter);

    if (activeFilters.length > 0) {
        data = data.filter(row => {
            if (isOrMode) {
                // OR Match Mode: any matching filter is sufficient
                return activeFilters.some(fn => fn(row));
            } else {
                // AND Match Mode: all active filters must match
                return activeFilters.every(fn => fn(row));
            }
        });
    }
    
    // --- 5. Group By ---
    const groupBySelect = document.getElementById('groupByCols') as HTMLSelectElement | null;
    const groupByCols = Array.from(groupBySelect?.selectedOptions || [])
        .map(option => option.value);
    
    if (groupByCols.length > 0) {
        const groupedMap = new Map<string, { count: number; sum: Record<string, number> }>();
        data.forEach(row => { 
            const key = groupByCols.map(col => row[col]).join(' - '); 
            if (!groupedMap.has(key)) { 
                const sumObj: Record<string, number> = {};
                headers.forEach(h => { 
                    if (!groupByCols.includes(h) && !isNaN(parseFloat(row[h]))) 
                        sumObj[h] = 0; 
                });
                groupedMap.set(key, { count: 0, sum: sumObj }); 
            } 
            const group = groupedMap.get(key)!; 
            group.count++; 
            headers.forEach(h => { 
                if (!groupByCols.includes(h) && !isNaN(parseFloat(row[h]))) 
                    group.sum[h] = (group.sum[h] || 0) + (parseFloat(row[h]) || 0); 
            }); 
        }); 
        data = Array.from(groupedMap.entries()).map(([key, value]) => { 
            const obj: Record<string, any> = {}; 
            groupByCols.forEach((col, i) => obj[col] = key.split(' - ')[i]); 
            obj['कुल पंक्तियाँ'] = value.count; 
            Object.assign(obj, value.sum); 
            return obj; 
        }); 
    }
    
    // --- 6. Multi-Column Sort ---
    const sortRules = Array.from(document.getElementById('sortRulesContainer')?.querySelectorAll('.sort-rule') || [])
        .map(ruleDiv => ({
            column: (ruleDiv.querySelector('.sort-col-select') as HTMLSelectElement)?.value,
            order: (ruleDiv.querySelector('input[name^="sortOrder_"]:checked') as HTMLInputElement)?.value || 'asc'
        }))
        .filter((rule): rule is { column: string; order: string } => !!rule.column);
    
    if (sortRules.length > 0) {
        data.sort((a, b) => {
            for (const {column, order} of sortRules) {
                const valA = a[column], valB = b[column];
                const isNumeric = !isNaN(parseFloat(valA)) && !isNaN(parseFloat(valB));
                let cmp = 0;
                if (isNumeric) cmp = parseFloat(valA) - parseFloat(valB);
                else cmp = String(valA || '').localeCompare(String(valB || ''));
                if (cmp !== 0) return order === 'asc' ? cmp : -cmp;
            }
            return 0;
        });
    }
    
    return data;
}

/**
 * मल्टी-सेलेक्ट फ़िल्टर विकल्पों को पॉपुलेट करता है।
 * @param column - कॉलम का नाम जिसके लिए विकल्प पॉपुलेट करने हैं।
 * @param data - डेटा जिसके आधार पर विकल्प पॉपुलेट करने हैं।
 */
export function populateMultiSelectOptions(column: string, data: Record<string, any>[]): void {
    const optionsDiv = document.getElementById('multiSelectOptions');
    const searchContainer = document.getElementById('multiSelectSearchContainer');
    const searchInput = document.getElementById('multiSelectSearch') as HTMLInputElement | null;
    
    if (searchInput) searchInput.value = '';
    if (!optionsDiv) return;
    optionsDiv.innerHTML = '';
    
    if (!column || !data || data.length === 0) {
        if (searchContainer) searchContainer.style.display = 'none';
        optionsDiv.innerHTML = '<div class="text-muted small text-center py-2">कॉलम चुनने पर विकल्प यहां लोड होंगे।</div>';
        return;
    }
    
    if (searchContainer) searchContainer.style.display = 'block';
    
    const uniqueValues = [...new Set(data.map(row => row[column] !== undefined && row[column] !== null ? String(row[column]) : ''))]
        .filter(val => val.trim() !== ''); // ignore empty
    
    if (uniqueValues.length === 0) {
        optionsDiv.innerHTML = '<div class="text-muted small text-center py-2">कोई विकल्प उपलब्ध नहीं हैं।</div>';
        return;
    }

    uniqueValues.forEach(value => {
        const safeId = `multi-select-${value.replace(/[^a-zA-Z0-9]/g,'_')}`;
        const div = document.createElement('div');
        div.classList.add('form-check');
        div.innerHTML = `
            <input class="form-check-input" type="checkbox" value="${value}" id="${safeId}">
            <label class="form-check-label text-dark small" style="font-size: 0.78rem;" for="${safeId}">${value}</label>
        `;
        optionsDiv.appendChild(div);
    });
}

/**
 * एक नया सॉर्ट नियम UI तत्व बनाता है।
 * @param headers - डेटा के कॉलम हेडर।
 * @returns नया सॉर्ट नियम Div तत्व।
 */
export function createSortRuleElement(headers: string[]): HTMLElement {
    const div = document.createElement('div');
    const id = 'sortRule_' + Date.now();
    div.id = id;
    div.classList.add('sort-rule', 'mb-2', 'd-flex', 'align-items-center', 'gap-2');
    div.innerHTML = `
        <select class="form-select sort-col-select">
            <option value="">कॉलम चुनें</option>
            ${headers.map(h => `<option value="${h}">${h}</option>`).join('')}
        </select>
        <div class="btn-group" role="group">
            <input type="radio" class="btn-check" name="sortOrder_${id}" id="asc_${id}" value="asc" checked>
            <label class="btn btn-outline-secondary" for="asc_${id}"><i class="bi bi-sort-up"></i></label>
            <input type="radio" class="btn-check" name="sortOrder_${id}" id="desc_${id}" value="desc">
            <label class="btn btn-outline-secondary" for="desc_${id}"><i class="bi bi-sort-down"></i></label>
        </div>
        <button class="btn btn-danger btn-sm remove-sort-rule"><i class="bi bi-x-lg"></i></button>
    `;
    
    div.querySelector('.remove-sort-rule')?.addEventListener('click', () => div.remove());
    return div;
}

/**
 * सभी फ़िल्टर्स को डिफ़ॉल्ट मानों पर रीसेट करता है
 * @param headers - डेटा के कॉलम हेडर (सॉर्ट रूल्स के लिए)
 */
export function resetAllFilters(headers: string[] = []): void {
    // 0. Global Dashboard Filter Reset
    const globalFilterCol = document.getElementById('globalFilterCol') as HTMLSelectElement | null;
    const globalFilterVal = document.getElementById('globalFilterVal') as HTMLSelectElement | null;
    const globalStartDate = document.getElementById('globalStartDate') as HTMLInputElement | null;
    const globalEndDate = document.getElementById('globalEndDate') as HTMLInputElement | null;
    
    if (globalFilterCol) globalFilterCol.value = '';
    if (globalFilterVal) {
        globalFilterVal.innerHTML = '<option value="">-- सभी मान (All) --</option>';
        globalFilterVal.disabled = true;
    }
    if (globalStartDate) globalStartDate.value = '';
    if (globalEndDate) globalEndDate.value = '';

    // 1. Text Filter Reset
    const filterCol = document.getElementById('filterCol') as HTMLSelectElement | null;
    const filterValue = document.getElementById('filterValue') as HTMLInputElement | null;
    const textFilterOperator = document.getElementById('textFilterOperator') as HTMLSelectElement | null;
    
    if (filterCol) filterCol.value = '';
    if (filterValue) filterValue.value = '';
    if (textFilterOperator) textFilterOperator.value = 'includes';
    
    // 2. Multi-Select Filter Reset
    const multiSelectFilterCol = document.getElementById('multiSelectFilterCol') as HTMLSelectElement | null;
    const multiSelectOptions = document.getElementById('multiSelectOptions');
    
    if (multiSelectFilterCol) multiSelectFilterCol.value = '';
    if (multiSelectOptions) {
        // सभी चेकबॉक्स को अनचेक करें
        const checkboxes = multiSelectOptions.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');
        checkboxes.forEach(checkbox => checkbox.checked = false);
    }
    
    // 3. Numeric Range Filter Reset
    const filterNumericCol = document.getElementById('filterNumericCol') as HTMLSelectElement | null;
    const minNumericValue = document.getElementById('minNumericValue') as HTMLInputElement | null;
    const maxNumericValue = document.getElementById('maxNumericValue') as HTMLInputElement | null;
    
    if (filterNumericCol) filterNumericCol.value = '';
    if (minNumericValue) minNumericValue.value = '';
    if (maxNumericValue) maxNumericValue.value = '';
    
    // 4. Date Range Filter Reset
    const startDate = document.getElementById('startDate') as HTMLInputElement | null;
    const endDate = document.getElementById('endDate') as HTMLInputElement | null;
    
    if (startDate) startDate.value = '';
    if (endDate) endDate.value = '';
    
    // 5. Group By Reset
    const groupByCols = document.getElementById('groupByCols') as HTMLSelectElement | null;
    if (groupByCols) {
        // सभी सिलेक्टेड ऑप्शन्स को अनसिलेक्ट करें
        Array.from(groupByCols.options).forEach(option => option.selected = false);
    }
    
    // 6. Sort Rules Reset
    const sortRulesContainer = document.getElementById('sortRulesContainer');
    if (sortRulesContainer) {
        sortRulesContainer.innerHTML = '';
        // एक डिफ़ॉल्ट सॉर्ट रूल जोड़ें (वैकल्पिक)
        if (headers.length > 0) {
            const defaultSortRule = createSortRuleElement(headers);
            sortRulesContainer.appendChild(defaultSortRule);
        }
    }
    
    // 7. केवल कस्टम इवेंट डिस्पैच करें
    dispatchFilterChangeEvent();
}

/**
 * फ़िल्टर परिवर्तन इवेंट डिस्पैच करता है
 */
function dispatchFilterChangeEvent(): void {
    const event = new CustomEvent('filtersReset', {
        detail: { timestamp: new Date().toISOString() }
    });
    document.dispatchEvent(event);
}

/**
 * रीसेट बटन को इनिशियलाइज़ करता है
 */
export function initializeResetButton(_headers?: string[]): void {
    // Override handler
}

/**
 * डायनामिक फ़िल्टर कॉन्फ़िगरेशन
 */
export const filterConfig = {
    // डिफ़ॉल्ट फ़िल्टर वैल्यूज़
    defaults: {
        textFilter: {
            column: '',
            value: '',
            operator: 'includes'
        },
        multiSelect: {
            column: '',
            selectedValues: [] as string[]
        },
        numericRange: {
            column: '',
            min: '',
            max: ''
        },
        dateRange: {
            start: '',
            end: ''
        },
        groupBy: {
            columns: [] as string[]
        },
        sortRules: [] as { column: string; order: string }[]
    },
    
    // फ़िल्टर एलिमेंट्स के IDs
    elements: {
        textFilter: {
            column: 'filterCol',
            value: 'filterValue',
            operator: 'textFilterOperator'
        },
        multiSelect: {
            column: 'multiSelectFilterCol',
            options: 'multiSelectOptions'
        },
        numericRange: {
            column: 'filterNumericCol',
            min: 'minNumericValue',
            max: 'maxNumericValue'
        },
        dateRange: {
            start: 'startDate',
            end: 'endDate'
        },
        groupBy: {
            container: 'groupByCols'
        },
        sortRules: {
            container: 'sortRulesContainer'
        }
    }
};

/**
 * करंट फ़िल्टर स्टेट को प्राप्त करता है
 */
export function getCurrentFilterState() {
    return {
        matchMode: (document.querySelector('input[name="filterMatchMode"]:checked') as HTMLInputElement)?.value || 'AND',
        globalFilter: {
            column: (document.getElementById('globalFilterCol') as HTMLSelectElement)?.value || '',
            value: (document.getElementById('globalFilterVal') as HTMLSelectElement)?.value || '',
            startDate: (document.getElementById('globalStartDate') as HTMLInputElement)?.value || '',
            endDate: (document.getElementById('globalEndDate') as HTMLInputElement)?.value || ''
        },
        textFilter: {
            column: (document.getElementById('filterCol') as HTMLSelectElement)?.value || '',
            value: (document.getElementById('filterValue') as HTMLInputElement)?.value || '',
            operator: (document.getElementById('textFilterOperator') as HTMLSelectElement)?.value || 'includes'
        },
        multiSelect: {
            column: (document.getElementById('multiSelectFilterCol') as HTMLSelectElement)?.value || '',
            selectedValues: Array.from(document.querySelectorAll<HTMLInputElement>('#multiSelectOptions input[type="checkbox"]:checked'))
                .map(el => el.value)
        },
        numericRange: {
            column: (document.getElementById('filterNumericCol') as HTMLSelectElement)?.value || '',
            min: (document.getElementById('minNumericValue') as HTMLInputElement)?.value || '',
            max: (document.getElementById('maxNumericValue') as HTMLInputElement)?.value || ''
        },
        dateRange: {
            start: (document.getElementById('startDate') as HTMLInputElement)?.value || '',
            end: (document.getElementById('endDate') as HTMLInputElement)?.value || ''
        },
        groupBy: {
            columns: Array.from((document.getElementById('groupByCols') as HTMLSelectElement)?.selectedOptions || [])
                .map(option => option.value)
        },
        sortRules: Array.from(document.getElementById('sortRulesContainer')?.querySelectorAll('.sort-rule') || [])
            .map(ruleDiv => ({
                column: (ruleDiv.querySelector('.sort-col-select') as HTMLSelectElement)?.value,
                order: (ruleDiv.querySelector('input[name^="sortOrder_"]:checked') as HTMLInputElement)?.value || 'asc'
            }))
            .filter((rule): rule is { column: string; order: string } => !!rule.column)
    };
}

/**
 * संख्यात्मक कॉलम सांख्यिकी की गणना और प्रदर्शन करता है।
 * @param column - चुना गया संख्यात्मक कॉलम।
 * @param data - वर्तमान डेटा सेट।
 */
export function updateNumericStats(column: string, data: Record<string, any>[]): void {
    const previewDiv = document.getElementById('numericDistributionPreview');
    const minSpan = document.getElementById('numStatMin');
    const maxSpan = document.getElementById('numStatMax');
    const avgSpan = document.getElementById('numStatAvg');

    if (!previewDiv || !minSpan || !maxSpan || !avgSpan) return;

    if (!column || !data || data.length === 0) {
        previewDiv.style.display = 'none';
        return;
    }

    const numbers = data
        .map(row => parseFloat(row[column]))
        .filter(val => !isNaN(val));

    if (numbers.length === 0) {
        previewDiv.style.display = 'none';
        return;
    }

    const min = Math.min(...numbers);
    const max = Math.max(...numbers);
    const avg = numbers.reduce((sum, val) => sum + val, 0) / numbers.length;

    minSpan.textContent = min.toLocaleString(undefined, { maximumFractionDigits: 2 });
    maxSpan.textContent = max.toLocaleString(undefined, { maximumFractionDigits: 2 });
    avgSpan.textContent = avg.toLocaleString(undefined, { maximumFractionDigits: 2 });
    
    previewDiv.style.display = 'block';
}

/**
 * सक्रिय फ़िल्टर्स के आधार पर क्लिक करने योग्य चिप्स और अकॉर्डियन स्टेटस बैज को अपडेट करता है।
 */
export async function updateActiveFilterChips(): Promise<void> {
    const container = document.getElementById('activeFiltersContainer');
    const chipsDiv = document.getElementById('activeFiltersChips');
    if (!container || !chipsDiv) return;

    chipsDiv.innerHTML = '';
    const activeChips: { type: string; label: string; clear: () => void }[] = [];
    let activeCount = 0;

    // Helper to toggle class d-none
    const toggleBadge = (id: string, active: boolean) => {
        const badge = document.getElementById(id);
        if (badge) {
            if (active) {
                badge.classList.remove('d-none');
                activeCount++;
            } else {
                badge.classList.add('d-none');
            }
        }
    };

    // 1. Text Filter Check
    const filterCol = (document.getElementById('filterCol') as HTMLSelectElement)?.value;
    const filterValue = (document.getElementById('filterValue') as HTMLInputElement)?.value;
    const isTextActive = !!(filterCol && filterValue);
    toggleBadge('textFilterActiveBadge', isTextActive);
    if (isTextActive) {
        const op = (document.getElementById('textFilterOperator') as HTMLSelectElement)?.value || 'includes';
        let opText = 'शामिल है';
        if (op === 'startsWith') opText = 'शुरू';
        if (op === 'endsWith') opText = 'अंत';
        if (op === 'equals') opText = 'बराबर';
        if (op === 'doesNotInclude') opText = 'शामिल नहीं';
        
        activeChips.push({
            type: 'text',
            label: `टेक्स्ट: ${filterCol} (${opText}: "${filterValue}")`,
            clear() {
                const fVal = document.getElementById('filterValue') as HTMLInputElement | null;
                if (fVal) fVal.value = '';
                document.getElementById('applyFilterSort')?.click();
            }
        });
    }

    // 2. Multi-Select Check
    const multiCol = (document.getElementById('multiSelectFilterCol') as HTMLSelectElement)?.value;
    const selectedOptions = Array.from(document.querySelectorAll<HTMLInputElement>('#multiSelectOptions input[type="checkbox"]:checked'))
        .map(el => el.value);
    const isMultiActive = !!(multiCol && selectedOptions.length > 0);
    toggleBadge('multiFilterActiveBadge', isMultiActive);
    if (isMultiActive) {
        activeChips.push({
            type: 'multi',
            label: `बहु-चयन: ${multiCol} (${selectedOptions.length})`,
            clear() {
                document.querySelectorAll<HTMLInputElement>('#multiSelectOptions input[type="checkbox"]').forEach(cb => cb.checked = false);
                document.getElementById('applyFilterSort')?.click();
            }
        });
    }

    // 3. Numeric Check
    const numericCol = (document.getElementById('filterNumericCol') as HTMLSelectElement)?.value;
    const minVal = (document.getElementById('minNumericValue') as HTMLInputElement)?.value;
    const maxVal = (document.getElementById('maxNumericValue') as HTMLInputElement)?.value;
    const isNumericActive = !!(numericCol && (minVal || maxVal));
    toggleBadge('numericFilterActiveBadge', isNumericActive);
    if (isNumericActive) {
        let labelText = `संख्यात्मक: ${numericCol}`;
        if (minVal && maxVal) labelText += ` (${minVal} - ${maxVal})`;
        else if (minVal) labelText += ` (>= ${minVal})`;
        else if (maxVal) labelText += ` (<= ${maxVal})`;

        activeChips.push({
            type: 'numeric',
            label: labelText,
            clear() {
                const minI = document.getElementById('minNumericValue') as HTMLInputElement | null;
                const maxI = document.getElementById('maxNumericValue') as HTMLInputElement | null;
                if (minI) minI.value = '';
                if (maxI) maxI.value = '';
                document.getElementById('applyFilterSort')?.click();
            }
        });
    }

    // 4. Date Check
    const startDate = (document.getElementById('startDate') as HTMLInputElement)?.value;
    const endDate = (document.getElementById('endDate') as HTMLInputElement)?.value;
    const isDateActive = !!(startDate && endDate);
    toggleBadge('dateFilterActiveBadge', isDateActive);
    if (isDateActive) {
        activeChips.push({
            type: 'date',
            label: `तारीख: ${startDate} से ${endDate}`,
            clear() {
                const sDate = document.getElementById('startDate') as HTMLInputElement | null;
                const eDate = document.getElementById('endDate') as HTMLInputElement | null;
                if (sDate) sDate.value = '';
                if (eDate) eDate.value = '';
                document.getElementById('applyFilterSort')?.click();
            }
        });
    }

    // 5. Group By Check
    const groupByCols = document.getElementById('groupByCols') as HTMLSelectElement | null;
    const isGroupActive = !!(groupByCols && groupByCols.selectedOptions && groupByCols.selectedOptions.length > 0);
    toggleBadge('groupByActiveBadge', isGroupActive);

    // 6. Sort rules Check
    const sortRules = document.querySelectorAll('#sortRulesContainer .sort-rule');
    const isSortActive = sortRules.length > 0 && Array.from(sortRules).some(div => (div.querySelector('.sort-col-select') as HTMLSelectElement)?.value);
    toggleBadge('sortActiveBadge', isSortActive);

    // Update overall Active Filters count badge
    const countBadge = document.getElementById('activeFilterCountBadge');
    if (countBadge) {
        countBadge.textContent = `${activeCount} सक्रिय`;
        if (activeCount > 0) {
            countBadge.className = 'badge bg-primary text-white';
        } else {
            countBadge.className = 'badge bg-secondary';
        }
    }

    // Render clickable chips
    if (activeChips.length > 0) {
        container.style.setProperty('display', 'block', 'important');
        activeChips.forEach(chip => {
            const chipEl = document.createElement('span');
            chipEl.className = 'badge bg-indigo-600 text-white d-inline-flex align-items-center gap-1.5 py-1 px-2 rounded-pill shadow-xs text-xs font-semibold';
            chipEl.style.cssText = 'font-size: 0.7rem; letter-spacing: 0.015em;';
            chipEl.innerHTML = `
                <span>${chip.label}</span>
                <i class="bi bi-x-circle-fill cursor-pointer text-white-50 hover-scale" style="font-size: 0.78rem; margin-left: 2px; transition: color 0.2s;" title="फ़िल्टर हटाएं"></i>
            `;
            chipEl.querySelector('.bi-x-circle-fill')?.addEventListener('click', (e) => {
                e.stopPropagation();
                chip.clear();
            });
            chipsDiv.appendChild(chipEl);
        });
    } else {
        container.style.setProperty('display', 'none', 'important');
    }
}

/**
 * ग्रुप बाय के लिए इंटरैक्टिव कॉलम चिप्स रेंडर करता है
 */
export function populateGroupByChips(headers: string[]): void {
    const container = document.getElementById('groupByChipsContainer');
    const select = document.getElementById('groupByCols') as HTMLSelectElement | null;
    if (!container || !select) return;

    container.innerHTML = '';
    if (!headers || headers.length === 0) {
        container.innerHTML = '<div class="text-muted small w-100 text-center py-1" style="font-size: 0.72rem;">कोई कॉलम उपलब्ध नहीं</div>';
        return;
    }

    headers.forEach(h => {
        const chip = document.createElement('button');
        chip.type = 'button';
        const isSelected = Array.from(select.options).some(opt => opt.value === h && opt.selected);
        chip.className = `btn btn-sm py-0.5 px-2 rounded-pill d-inline-flex align-items-center gap-1 transition-all ${
            isSelected 
                ? 'btn-purple text-white shadow-xs fw-semibold' 
                : 'btn-outline-secondary'
        }`;
        chip.style.fontSize = '0.68rem';
        chip.innerHTML = `
            <span>${h}</span>
            <i class="bi ${isSelected ? 'bi-check-lg' : 'bi-plus'}"></i>
        `;

        chip.addEventListener('click', () => {
            const opt = Array.from(select.options).find(o => o.value === h);
            if (opt) {
                opt.selected = !opt.selected;
                populateGroupByChips(headers);
                updateActiveFilterChips();
            }
        });

        container.appendChild(chip);
    });
}

/**
 * फ़िल्टर साइडबार के सभी सहायक इंटरैक्टिव घटकों को इनिशियलाइज़ करता है
 */
export function initializeFilterSidebarHelpers(headers: string[] = [], data: Record<string, any>[] = []): void {
    // 1. Match Mode Pill Tracker
    const matchRadios = document.querySelectorAll('input[name="filterMatchMode"]');
    const matchPill = document.getElementById('matchModePill');
    matchRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            const target = e.target as HTMLInputElement;
            if (matchPill) {
                matchPill.textContent = target.value === 'OR' ? 'OR Mode' : 'AND Mode';
            }
        });
    });

    // 2. Clear Text Filter Input Button
    const clearTextBtn = document.getElementById('clearTextFilterInputBtn');
    if (clearTextBtn) {
        clearTextBtn.onclick = () => {
            const fVal = document.getElementById('filterValue') as HTMLInputElement | null;
            if (fVal) fVal.value = '';
        };
    }

    // 3. Multi-Select Actions (Select All, Clear, Invert)
    const selectAllBtn = document.getElementById('multiSelectAllBtn');
    if (selectAllBtn) {
        selectAllBtn.onclick = () => {
            document.querySelectorAll<HTMLInputElement>('#multiSelectOptions input[type="checkbox"]').forEach(cb => cb.checked = true);
        };
    }

    const selectClearBtn = document.getElementById('multiSelectClearBtn');
    if (selectClearBtn) {
        selectClearBtn.onclick = () => {
            document.querySelectorAll<HTMLInputElement>('#multiSelectOptions input[type="checkbox"]').forEach(cb => cb.checked = false);
        };
    }

    const selectInvertBtn = document.getElementById('multiSelectInvertBtn');
    if (selectInvertBtn) {
        selectInvertBtn.onclick = () => {
            document.querySelectorAll<HTMLInputElement>('#multiSelectOptions input[type="checkbox"]').forEach(cb => {
                cb.checked = !cb.checked;
            });
        };
    }

    // 4. Numeric Quick Range Presets
    const numAllBtn = document.getElementById('numRangeAll');
    if (numAllBtn) {
        numAllBtn.onclick = () => {
            const minI = document.getElementById('minNumericValue') as HTMLInputElement | null;
            const maxI = document.getElementById('maxNumericValue') as HTMLInputElement | null;
            if (minI) minI.value = '';
            if (maxI) maxI.value = '';
        };
    }

    const numAboveAvgBtn = document.getElementById('numRangeAboveAvg');
    if (numAboveAvgBtn) {
        numAboveAvgBtn.onclick = () => {
            const col = (document.getElementById('filterNumericCol') as HTMLSelectElement)?.value;
            if (!col || !data.length) return;
            const numbers = data.map(r => parseFloat(r[col])).filter(v => !isNaN(v));
            if (!numbers.length) return;
            const avg = numbers.reduce((a, b) => a + b, 0) / numbers.length;
            const minI = document.getElementById('minNumericValue') as HTMLInputElement | null;
            const maxI = document.getElementById('maxNumericValue') as HTMLInputElement | null;
            if (minI) minI.value = avg.toFixed(2);
            if (maxI) maxI.value = '';
        };
    }

    const numBelowAvgBtn = document.getElementById('numRangeBelowAvg');
    if (numBelowAvgBtn) {
        numBelowAvgBtn.onclick = () => {
            const col = (document.getElementById('filterNumericCol') as HTMLSelectElement)?.value;
            if (!col || !data.length) return;
            const numbers = data.map(r => parseFloat(r[col])).filter(v => !isNaN(v));
            if (!numbers.length) return;
            const avg = numbers.reduce((a, b) => a + b, 0) / numbers.length;
            const minI = document.getElementById('minNumericValue') as HTMLInputElement | null;
            const maxI = document.getElementById('maxNumericValue') as HTMLInputElement | null;
            if (minI) minI.value = '';
            if (maxI) maxI.value = avg.toFixed(2);
        };
    }

    // 5. Date Range Quick Presets
    const setDateRange = (start: Date | null, end: Date | null) => {
        const startInput = document.getElementById('startDate') as HTMLInputElement | null;
        const endInput = document.getElementById('endDate') as HTMLInputElement | null;
        if (startInput) startInput.value = start ? start.toISOString().split('T')[0] : '';
        if (endInput) endInput.value = end ? end.toISOString().split('T')[0] : '';
    };

    const dateAll = document.getElementById('datePresetAll');
    if (dateAll) dateAll.onclick = () => setDateRange(null, null);

    const dateToday = document.getElementById('datePresetToday');
    if (dateToday) dateToday.onclick = () => {
        const now = new Date();
        setDateRange(now, now);
    };

    const dateLast7 = document.getElementById('datePresetLast7');
    if (dateLast7) dateLast7.onclick = () => {
        const now = new Date();
        const start = new Date();
        start.setDate(now.getDate() - 7);
        setDateRange(start, now);
    };

    const dateLast30 = document.getElementById('datePresetLast30');
    if (dateLast30) dateLast30.onclick = () => {
        const now = new Date();
        const start = new Date();
        start.setDate(now.getDate() - 30);
        setDateRange(start, now);
    };

    const dateMonth = document.getElementById('datePresetMonth');
    if (dateMonth) dateMonth.onclick = () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        setDateRange(start, end);
    };

    const dateYear = document.getElementById('datePresetYear');
    if (dateYear) dateYear.onclick = () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 1);
        const end = new Date(now.getFullYear(), 11, 31);
        setDateRange(start, end);
    };

    // 6. Group By Clear Button & Chip Setup
    const clearGroupBtn = document.getElementById('clearGroupByChipsBtn');
    if (clearGroupBtn) {
        clearGroupBtn.onclick = () => {
            const select = document.getElementById('groupByCols') as HTMLSelectElement | null;
            if (select) {
                Array.from(select.options).forEach(opt => opt.selected = false);
                populateGroupByChips(headers);
                updateActiveFilterChips();
            }
        };
    }

    if (headers.length > 0) {
        populateGroupByChips(headers);
    }

    // 7. Quick Clear All Buttons
    const quickClearBtn = document.getElementById('quickClearAllFiltersBtn');
    const clearAllChipsBtn = document.getElementById('clearAllChipsBtn');
    const triggerReset = () => {
        const resetBtn = document.getElementById('resetFiltersBtn');
        if (resetBtn) resetBtn.click();
    };

    if (quickClearBtn) quickClearBtn.onclick = triggerReset;
    if (clearAllChipsBtn) clearAllChipsBtn.onclick = triggerReset;
}

