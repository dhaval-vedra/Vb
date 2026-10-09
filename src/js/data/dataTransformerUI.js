// js/dataTransformerUI.js

import { getRawData, getHeaders, exportToCSV } from '../../store/DataHandler.ts';
import { 
    generateDataProfile, 
    removeColumn, 
    renameColumn, 
    handleMissingValues, 
    applyHardFilter,
    changeColumnType,
    applyFormula
} from './dataTransformer.js';
import { showMessage } from '../core/utils.ts';

/**
 * Populate all column-based dropdowns in the Clean & Transform panel.
 */
export function populateCleanDropdowns() {
    const headers = getHeaders();
    
    // Dropdown elements
    const renameColSelect = document.getElementById('cleanRenameColSelect');
    const removeColSelect = document.getElementById('cleanRemoveColSelect');
    const missingColSelect = document.getElementById('cleanMissingColSelect');
    const filterColSelect = document.getElementById('cleanFilterColSelect');
    const typeColSelect = document.getElementById('cleanTypeColSelect');
    const formulaColA = document.getElementById('formulaColA');
    const formulaColB = document.getElementById('formulaColB');
    
    // Empty them first
    if (renameColSelect) renameColSelect.innerHTML = '';
    if (removeColSelect) removeColSelect.innerHTML = '';
    if (missingColSelect) {
        missingColSelect.innerHTML = '<option value="all">सभी कॉलम (All Columns)</option>';
    }
    if (filterColSelect) filterColSelect.innerHTML = '';
    if (typeColSelect) typeColSelect.innerHTML = '';
    if (formulaColA) formulaColA.innerHTML = '';
    if (formulaColB) formulaColB.innerHTML = '';
    
    if (!headers || headers.length === 0) {
        return;
    }
    
    // Add options
    headers.forEach(header => {
        const optHtml = `<option value="${header}">${header}</option>`;
        if (renameColSelect) renameColSelect.insertAdjacentHTML('beforeend', optHtml);
        if (removeColSelect) removeColSelect.insertAdjacentHTML('beforeend', optHtml);
        if (missingColSelect) missingColSelect.insertAdjacentHTML('beforeend', optHtml);
        if (filterColSelect) filterColSelect.insertAdjacentHTML('beforeend', optHtml);
        if (typeColSelect) typeColSelect.insertAdjacentHTML('beforeend', optHtml);
        if (formulaColA) formulaColA.insertAdjacentHTML('beforeend', optHtml);
        if (formulaColB) formulaColB.insertAdjacentHTML('beforeend', optHtml);
    });
}

/**
 * Render the Data Profile summary, column quality table, and mini table preview.
 */
export function renderDataProfile() {
    const rawData = getRawData();
    const headers = getHeaders();
    
    const totalRowsEl = document.getElementById('profileTotalRows');
    const totalColsEl = document.getElementById('profileTotalCols');
    const statsBody = document.getElementById('profileStatsBody');
    const previewHead = document.getElementById('profilePreviewHead');
    const previewBody = document.getElementById('profilePreviewBody');
    
    if (!rawData || rawData.length === 0) {
        if (totalRowsEl) totalRowsEl.textContent = '0';
        if (totalColsEl) totalColsEl.textContent = '0';
        if (statsBody) {
            statsBody.innerHTML = `<tr><td colspan="4" class="text-muted py-3">कोई डेटा उपलब्ध नहीं है।</td></tr>`;
        }
        if (previewHead) previewHead.innerHTML = '';
        if (previewBody) {
            previewBody.innerHTML = `<tr><td class="text-muted py-2">कोई डेटा उपलब्ध नहीं है।</td></tr>`;
        }
        return;
    }
    
    // Update simple statistics
    if (totalRowsEl) totalRowsEl.textContent = rawData.length;
    if (totalColsEl) totalColsEl.textContent = headers.length;
    
    // 1. Column Health Quality Stats
    const profile = generateDataProfile();
    if (profile && statsBody) {
        statsBody.innerHTML = '';
        profile.columns.forEach(col => {
            const rowHtml = `
                <tr>
                    <td class="text-start fw-bold text-truncate" style="max-width: 110px;">${col.column}</td>
                    <td>
                        <span class="badge ${col.type === 'numeric' ? 'bg-info-subtle text-info' : 'bg-secondary-subtle text-secondary'}" style="font-size:0.65rem;">
                            ${col.type === 'numeric' ? 'Numeric' : 'Text'}
                        </span>
                    </td>
                    <td>
                        <span class="fw-bold ${col.missingCount > 0 ? 'text-danger' : 'text-success'}">
                            ${col.missingPercent}%
                        </span> 
                        <span class="text-muted" style="font-size:0.6rem;">(${col.missingCount})</span>
                    </td>
                    <td><span class="badge bg-light text-dark border">${col.uniqueCount}</span></td>
                </tr>
            `;
            statsBody.insertAdjacentHTML('beforeend', rowHtml);
        });
    }
    
    // 2. Mini Preview Grid (First 3 Rows)
    if (previewHead && previewBody) {
        previewHead.innerHTML = '';
        previewBody.innerHTML = '';
        
        // Render headers
        const headerRow = document.createElement('tr');
        headers.forEach(h => {
            const th = document.createElement('th');
            th.textContent = h;
            th.className = 'text-truncate';
            th.style.maxWidth = '120px';
            headerRow.appendChild(th);
        });
        previewHead.appendChild(headerRow);
        
        // Render first 3 rows
        const first3 = rawData.slice(0, 3);
        if (first3.length === 0) {
            previewBody.innerHTML = `<tr><td colspan="${headers.length}" class="text-muted text-center py-2">डेटा खाली है</td></tr>`;
        } else {
            first3.forEach(row => {
                const tr = document.createElement('tr');
                headers.forEach(h => {
                    const td = document.createElement('td');
                    td.className = 'text-truncate';
                    td.style.maxWidth = '120px';
                    td.textContent = row[h] !== undefined && row[h] !== null ? String(row[h]).trim() : '';
                    tr.appendChild(td);
                });
                previewBody.appendChild(tr);
            });
        }
    }
}

/**
 * Hook up all events inside the Data Transformer & Profiler Sidebar.
 */
export function initializeDataTransformerUI() {
    console.log("Initializing Data Transformer UI hooks...");
    
    // Populate selectors initially
    populateCleanDropdowns();
    renderDataProfile();
    
    // 1. Rename Column Handler
    const cleanRenameBtn = document.getElementById('cleanRenameBtn');
    if (cleanRenameBtn) {
        cleanRenameBtn.addEventListener('click', () => {
            const oldName = document.getElementById('cleanRenameColSelect').value;
            const newName = document.getElementById('cleanNewColName').value.trim();
            if (renameColumn(oldName, newName)) {
                document.getElementById('cleanNewColName').value = '';
                // Dropdowns and stats will be auto-refreshed via the 'dataLoaded' event
            }
        });
    }
    
    // 2. Remove Column Handler
    const cleanRemoveBtn = document.getElementById('cleanRemoveBtn');
    if (cleanRemoveBtn) {
        cleanRemoveBtn.addEventListener('click', () => {
            const colName = document.getElementById('cleanRemoveColSelect').value;
            if (colName && confirm(`क्या आप सचमुच कॉलम "${colName}" को हटाना चाहते हैं? यह क्रिया डेटा को स्थायी रूप से बदल देगी।`)) {
                removeColumn(colName);
            }
        });
    }
    
    // 3. Missing Value Strategy Selection Wrapper toggle
    const missingStrategySelect = document.getElementById('cleanMissingStrategySelect');
    const customValWrapper = document.getElementById('cleanCustomValWrapper');
    if (missingStrategySelect && customValWrapper) {
        missingStrategySelect.addEventListener('change', (e) => {
            if (e.target.value === 'custom') {
                customValWrapper.style.display = 'block';
            } else {
                customValWrapper.style.display = 'none';
            }
        });
    }
    
    // 4. Missing Values Impute Handler
    const cleanMissingBtn = document.getElementById('cleanMissingBtn');
    if (cleanMissingBtn) {
        cleanMissingBtn.addEventListener('click', () => {
            const colName = document.getElementById('cleanMissingColSelect').value;
            const strategy = document.getElementById('cleanMissingStrategySelect').value;
            const customVal = document.getElementById('cleanMissingCustomVal').value.trim();
            
            if (strategy === 'custom' && !customVal) {
                showMessage("कृपया कस्टम वैल्यू दर्ज करें।", "warning");
                return;
            }
            
            handleMissingValues(colName, strategy, customVal);
        });
    }
    
    // 5. Row reduction filter handler
    const cleanFilterBtn = document.getElementById('cleanFilterBtn');
    if (cleanFilterBtn) {
        cleanFilterBtn.addEventListener('click', () => {
            const colName = document.getElementById('cleanFilterColSelect').value;
            const op = document.getElementById('cleanFilterOperatorSelect').value;
            const filterVal = document.getElementById('cleanFilterVal').value.trim();
            
            if (!filterVal) {
                showMessage("कृपया फ़िल्टर वैल्यू दर्ज करें।", "warning");
                return;
            }
            
            if (confirm(`इस क्रिया से वे सभी पंक्तियाँ स्थायी रूप से डिलीट हो जाएँगी जो शर्त पूरी नहीं करती हैं। क्या आप जारी रखना चाहते हैं?`)) {
                applyHardFilter(colName, op, filterVal);
                document.getElementById('cleanFilterVal').value = '';
            }
        });
    }
    
    // 6. Profile CSV export button
    const profileExportBtn = document.getElementById('profileExportBtn');
    if (profileExportBtn) {
        profileExportBtn.addEventListener('click', () => {
            exportToCSV();
        });
    }

    // 7. Toggle B Input type for Custom Formula (Column vs Constant Value)
    const formulaBTypeCol = document.getElementById('formulaBTypeCol');
    const formulaBTypeVal = document.getElementById('formulaBTypeVal');
    const formulaColBSelect = document.getElementById('formulaColB');
    const formulaValBInput = document.getElementById('formulaValB');

    if (formulaBTypeCol && formulaBTypeVal && formulaColBSelect && formulaValBInput) {
        formulaBTypeCol.addEventListener('change', () => {
            if (formulaBTypeCol.checked) {
                formulaColBSelect.classList.remove('d-none');
                formulaValBInput.classList.add('d-none');
            }
        });
        formulaBTypeVal.addEventListener('change', () => {
            if (formulaBTypeVal.checked) {
                formulaColBSelect.classList.add('d-none');
                formulaValBInput.classList.remove('d-none');
            }
        });
    }

    // 8. Change Column Data Type button click handler
    const cleanTypeBtn = document.getElementById('cleanTypeBtn');
    if (cleanTypeBtn) {
        cleanTypeBtn.addEventListener('click', () => {
            const colName = document.getElementById('cleanTypeColSelect').value;
            const targetType = document.getElementById('cleanTypeTargetSelect').value;
            if (colName && targetType) {
                changeColumnType(colName, targetType);
            }
        });
    }

    // 9. Apply Formula button click handler
    const formulaApplyBtn = document.getElementById('formulaApplyBtn');
    if (formulaApplyBtn) {
        formulaApplyBtn.addEventListener('click', () => {
            const targetCol = document.getElementById('formulaTargetCol').value.trim();
            const colA = document.getElementById('formulaColA').value;
            const op = document.getElementById('formulaOp').value;
            
            const bType = document.querySelector('input[name="formulaBType"]:checked')?.value || 'col';
            const colB = document.getElementById('formulaColB').value;
            const valB = document.getElementById('formulaValB').value.trim();

            if (!targetCol) {
                showMessage("कृपया परिणामी कॉलम का नाम दर्ज करें।", "warning");
                return;
            }

            if (applyFormula(targetCol, colA, op, bType, colB, valB)) {
                document.getElementById('formulaTargetCol').value = '';
                document.getElementById('formulaValB').value = '';
            }
        });
    }
    
    // Listen for dataLoaded/dataLoadedFromFirebase events to dynamically sync UI
    document.addEventListener('dataLoaded', () => {
        console.log("Data changed. Updating Transformer dropdowns and Profile stats.");
        populateCleanDropdowns();
        renderDataProfile();
    });
    
    document.addEventListener('dataLoadedFromFirebase', () => {
        console.log("Data loaded from Firebase. Updating Transformer dropdowns and Profile stats.");
        populateCleanDropdowns();
        renderDataProfile();
    });
}
