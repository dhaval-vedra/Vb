// src/js/data/dataTebledisplay.js
// Modern, Clean, High-Performance Data Table Component (Pure JS)

import { 
    filteredData, 
    rawData, 
    headers, 
    rowsPerPage, 
    currentPage, 
    changePage, 
    setRowsPerPage, 
    goToPage
} from '../../store/DataHandler.ts'; 
import { DrillDownEngine } from '../ui/drillDownModal.ts';
import { SmartSummaryEngine } from '../core/smartSummaryEngine.ts'; 

// Selection and sort state
let activeSelection = {
    row: 0,
    col: 0,
    allSelected: false
};

let tableSortColumn = null;
let tableSortDirection = 'asc';
let tableSearchFilter = '';

/**
 * Injects clean, modern CSS for the data table with comprehensive Dark & Light mode support
 */
function ensureModernTableStyles() {
    let styleEl = document.getElementById('modern-table-styles');
    if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'modern-table-styles';
        document.head.appendChild(styleEl);
    }

    styleEl.textContent = `
        /* ==========================================================================
           Modern Data Table - Clean Architecture (Light & Dark Theme Native)
           ========================================================================== */

        /* --- LIGHT THEME (Default) --- */
        .modern-table-card {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
            transition: background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .modern-table-toolbar {
            background: #f8fafc;
            border-bottom: 1px solid #e2e8f0;
            padding: 10px 16px;
            transition: background-color 0.2s ease, border-color 0.2s ease;
        }

        .modern-table-search-addon {
            background: #ffffff;
            border-color: #cbd5e1;
            color: #64748b;
            transition: all 0.2s ease;
        }

        .modern-table-search-input {
            background: #ffffff;
            border-color: #cbd5e1;
            color: #0f172a;
            transition: all 0.2s ease;
        }

        .modern-table-search-input:focus {
            border-color: #3b82f6;
            box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
        }

        .modern-table-btn {
            background: #ffffff;
            border: 1px solid #cbd5e1;
            color: #475569;
            transition: all 0.15s ease;
        }

        .modern-table-btn:hover:not(:disabled) {
            background: #f1f5f9;
            border-color: #94a3b8;
            color: #0f172a;
        }

        .modern-table-btn:disabled {
            opacity: 0.45;
            cursor: not-allowed;
        }

        .modern-table-page-badge {
            background: #f1f5f9;
            color: #475569;
            border: 1px solid #cbd5e1;
        }

        .modern-table-pagesize {
            background: #ffffff;
            border: 1px solid #cbd5e1;
            color: #334155;
            transition: all 0.2s ease;
        }

        .modern-table-record-text {
            color: #64748b;
        }

        .modern-table-rows-label {
            color: #64748b;
        }

        .modern-table-wrapper {
            overflow-x: auto;
            overflow-y: auto;
            max-height: 520px;
            scrollbar-width: thin;
        }

        .modern-table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            font-size: 0.8rem;
            color: #334155;
            margin: 0;
            transition: color 0.2s ease;
        }

        .modern-table th {
            position: sticky;
            top: 0;
            background: #f8fafc;
            color: #475569;
            font-weight: 600;
            font-size: 0.74rem;
            text-transform: uppercase;
            letter-spacing: 0.03em;
            padding: 9px 12px;
            border-bottom: 1px solid #cbd5e1;
            border-right: 1px solid #e2e8f0;
            white-space: nowrap;
            user-select: none;
            cursor: pointer;
            z-index: 10;
            transition: background-color 0.15s ease, color 0.15s ease;
        }

        .modern-table th:hover {
            background-color: #f1f5f9;
            color: #0f172a;
        }

        .modern-table th.th-index {
            width: 50px;
            min-width: 50px;
            max-width: 50px;
            text-align: center;
            cursor: default;
            left: 0;
            z-index: 15;
            background: #f1f5f9;
        }

        .modern-table td {
            padding: 8px 12px;
            background-color: #ffffff;
            color: #1e293b;
            border-bottom: 1px solid #f1f5f9;
            border-right: 1px solid #f1f5f9;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 240px;
            transition: background-color 0.1s ease, color 0.1s ease;
        }

        .modern-table td.td-index {
            width: 50px;
            min-width: 50px;
            max-width: 50px;
            text-align: center;
            background: #f8fafc;
            color: #94a3b8;
            font-weight: 500;
            font-size: 0.72rem;
            position: sticky;
            left: 0;
            z-index: 5;
            border-right: 1px solid #e2e8f0;
        }

        .modern-table tbody tr:hover td {
            background-color: #f8fafc;
        }

        .modern-table td.cell-active {
            outline: 2px solid #3b82f6 !important;
            outline-offset: -2px;
            background-color: #eff6ff !important;
        }

        .modern-table td.cell-selected {
            background-color: #f1f5f9 !important;
        }

        .modern-table-input {
            width: 100%;
            height: 100%;
            border: 1px solid #3b82f6;
            border-radius: 4px;
            padding: 2px 6px;
            font-size: 0.8rem;
            outline: none;
            background: #ffffff;
            color: #0f172a;
            box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
        }

        .modern-table-pagination {
            background: #f8fafc;
            border-top: 1px solid #e2e8f0;
            padding: 8px 16px;
            transition: background-color 0.2s ease, border-color 0.2s ease;
        }

        /* --- TRUE DARK THEME SUPPORT: Deep Black Background & Crisp White Text --- */
        body.dark-theme .modern-table-card,
        [data-bs-theme="dark"] .modern-table-card {
            background: #000000 !important;
            background-color: #000000 !important;
            border-color: #27272a !important;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.7) !important;
        }

        body.dark-theme .modern-table-toolbar,
        [data-bs-theme="dark"] .modern-table-toolbar {
            background: #09090b !important;
            background-color: #09090b !important;
            border-bottom-color: #27272a !important;
            color: #ffffff !important;
        }

        body.dark-theme .modern-table-toolbar .badge.bg-primary-subtle,
        [data-bs-theme="dark"] .modern-table-toolbar .badge.bg-primary-subtle {
            background: #27272a !important;
            background-color: #27272a !important;
            color: #ffffff !important;
            border: 1px solid #3f3f46 !important;
        }

        body.dark-theme .modern-table-toolbar .badge.bg-secondary-subtle,
        [data-bs-theme="dark"] .modern-table-toolbar .badge.bg-secondary-subtle {
            background: #18181b !important;
            background-color: #18181b !important;
            color: #e4e4e7 !important;
            border: 1px solid #27272a !important;
        }

        body.dark-theme #modernTableSelectionBadge,
        [data-bs-theme="dark"] #modernTableSelectionBadge {
            color: #a1a1aa !important;
        }

        body.dark-theme #selectionInfo,
        [data-bs-theme="dark"] #selectionInfo {
            color: #ffffff !important;
        }

        body.dark-theme .modern-table-search-addon,
        [data-bs-theme="dark"] .modern-table-search-addon {
            background: #121214 !important;
            background-color: #121214 !important;
            border-color: #27272a !important;
            color: #ffffff !important;
        }

        body.dark-theme .modern-table-search-input,
        [data-bs-theme="dark"] .modern-table-search-input {
            background: #121214 !important;
            background-color: #121214 !important;
            border-color: #27272a !important;
            color: #ffffff !important;
        }

        body.dark-theme .modern-table-search-input::placeholder,
        [data-bs-theme="dark"] .modern-table-search-input::placeholder {
            color: #71717a !important;
        }

        body.dark-theme .modern-table-search-input:focus,
        [data-bs-theme="dark"] .modern-table-search-input:focus {
            border-color: #52525b !important;
            box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.15) !important;
        }

        body.dark-theme #clearSelectionBtn,
        [data-bs-theme="dark"] #clearSelectionBtn {
            background: #18181b !important;
            background-color: #18181b !important;
            border-color: #3f3f46 !important;
            color: #ffffff !important;
        }

        body.dark-theme #clearSelectionBtn:hover,
        [data-bs-theme="dark"] #clearSelectionBtn:hover {
            background: #27272a !important;
            background-color: #27272a !important;
            border-color: #52525b !important;
            color: #ffffff !important;
        }

        body.dark-theme #selectAllBtn,
        [data-bs-theme="dark"] #selectAllBtn {
            background: #27272a !important;
            background-color: #27272a !important;
            border-color: #3f3f46 !important;
            color: #ffffff !important;
        }

        body.dark-theme #selectAllBtn:hover,
        [data-bs-theme="dark"] #selectAllBtn:hover {
            background: #3f3f46 !important;
            background-color: #3f3f46 !important;
            border-color: #71717a !important;
            color: #ffffff !important;
        }

        body.dark-theme .modern-table,
        [data-bs-theme="dark"] .modern-table {
            background: #000000 !important;
            background-color: #000000 !important;
            color: #ffffff !important;
        }

        body.dark-theme .modern-table th,
        [data-bs-theme="dark"] .modern-table th {
            background: #09090b !important;
            background-color: #09090b !important;
            color: #ffffff !important;
            border-bottom: 1px solid #27272a !important;
            border-right: 1px solid #27272a !important;
        }

        body.dark-theme .modern-table th:hover,
        [data-bs-theme="dark"] .modern-table th:hover {
            background: #18181b !important;
            background-color: #18181b !important;
            color: #ffffff !important;
        }

        body.dark-theme .modern-table th.th-index,
        [data-bs-theme="dark"] .modern-table th.th-index {
            background: #09090b !important;
            background-color: #09090b !important;
            color: #a1a1aa !important;
            border-right: 1px solid #27272a !important;
        }

        body.dark-theme .modern-table td,
        [data-bs-theme="dark"] .modern-table td {
            background: #000000 !important;
            background-color: #000000 !important;
            border-bottom: 1px solid #222222 !important;
            border-right: 1px solid #222222 !important;
            color: #ffffff !important;
        }

        body.dark-theme .modern-table td.td-index,
        [data-bs-theme="dark"] .modern-table td.td-index {
            background: #09090b !important;
            background-color: #09090b !important;
            color: #a1a1aa !important;
            border-right: 1px solid #222222 !important;
        }

        body.dark-theme .modern-table tbody tr:hover td,
        [data-bs-theme="dark"] .modern-table tbody tr:hover td {
            background: #18181b !important;
            background-color: #18181b !important;
            color: #ffffff !important;
        }

        body.dark-theme .modern-table td.cell-active,
        [data-bs-theme="dark"] .modern-table td.cell-active {
            outline: 2px solid #ffffff !important;
            outline-offset: -2px;
            background: #27272a !important;
            background-color: #27272a !important;
            color: #ffffff !important;
        }

        body.dark-theme .modern-table td.cell-selected,
        [data-bs-theme="dark"] .modern-table td.cell-selected {
            background: #1f1f23 !important;
            background-color: #1f1f23 !important;
            color: #ffffff !important;
        }

        body.dark-theme .modern-table-input,
        [data-bs-theme="dark"] .modern-table-input {
            background: #000000 !important;
            background-color: #000000 !important;
            color: #ffffff !important;
            border-color: #ffffff !important;
            box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.3) !important;
        }

        body.dark-theme .modern-table-pagination,
        [data-bs-theme="dark"] .modern-table-pagination {
            background: #09090b !important;
            background-color: #09090b !important;
            border-top: 1px solid #27272a !important;
            color: #ffffff !important;
        }

        body.dark-theme .modern-table-record-text,
        [data-bs-theme="dark"] .modern-table-record-text {
            color: #ffffff !important;
        }

        body.dark-theme .modern-table-record-text strong,
        [data-bs-theme="dark"] .modern-table-record-text strong {
            color: #ffffff !important;
        }

        body.dark-theme .modern-table-rows-label,
        [data-bs-theme="dark"] .modern-table-rows-label {
            color: #ffffff !important;
        }

        body.dark-theme .modern-table-pagesize,
        [data-bs-theme="dark"] .modern-table-pagesize {
            background: #121214 !important;
            background-color: #121214 !important;
            border-color: #27272a !important;
            color: #ffffff !important;
        }

        body.dark-theme .modern-table-btn,
        [data-bs-theme="dark"] .modern-table-btn {
            background: #18181b !important;
            background-color: #18181b !important;
            border-color: #3f3f46 !important;
            color: #ffffff !important;
        }

        body.dark-theme .modern-table-btn:hover:not(:disabled),
        [data-bs-theme="dark"] .modern-table-btn:hover:not(:disabled) {
            background: #27272a !important;
            background-color: #27272a !important;
            border-color: #52525b !important;
            color: #ffffff !important;
        }

        body.dark-theme .modern-table-btn:disabled,
        [data-bs-theme="dark"] .modern-table-btn:disabled {
            opacity: 0.3 !important;
            color: #71717a !important;
            cursor: not-allowed !important;
        }

        body.dark-theme .modern-table-page-badge,
        [data-bs-theme="dark"] .modern-table-page-badge {
            background: #121214 !important;
            background-color: #121214 !important;
            color: #ffffff !important;
            border-color: #27272a !important;
        }
    `;
    if (!styleEl.parentNode) {
        document.head.appendChild(styleEl);
    }
}

/**
 * Main function to render modern, clean data table
 */
export function displayGoogleSheetsTable() {
    ensureModernTableStyles();

    const container = document.getElementById('dataTableContainer');
    if (!container) return;

    container.innerHTML = '';

    const currentHeaders = headers || [];
    let currentData = filteredData || [];

    // Apply quick search filter if active
    if (tableSearchFilter && tableSearchFilter.trim()) {
        const query = tableSearchFilter.trim().toLowerCase();
        currentData = currentData.filter(row => 
            currentHeaders.some(h => String(row[h] || '').toLowerCase().includes(query))
        );
    }

    // Apply column sorting if active
    if (tableSortColumn && currentHeaders.includes(tableSortColumn)) {
        currentData = [...currentData].sort((a, b) => {
            const valA = a[tableSortColumn];
            const valB = b[tableSortColumn];
            if (valA === valB) return 0;
            if (valA === undefined || valA === null) return 1;
            if (valB === undefined || valB === null) return -1;
            const numA = Number(valA);
            const numB = Number(valB);
            if (!isNaN(numA) && !isNaN(numB)) {
                return tableSortDirection === 'asc' ? numA - numB : numB - numA;
            }
            const cmp = String(valA).localeCompare(String(valB));
            return tableSortDirection === 'asc' ? cmp : -cmp;
        });
    }

    if (currentHeaders.length === 0 || currentData.length === 0) {
        container.innerHTML = `
            <div class="modern-table-card p-5 text-center text-muted">
                <i class="bi bi-inbox fs-2 text-secondary opacity-50 mb-2 d-block"></i>
                <div class="fw-semibold">No data available</div>
                <small class="text-secondary opacity-75">Upload a CSV/Excel file or reset filters to display records.</small>
            </div>
        `;
        return;
    }

    const totalRows = currentData.length;
    const totalPages = Math.ceil(totalRows / rowsPerPage) || 1;
    const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);
    const startIndex = (safeCurrentPage - 1) * rowsPerPage;
    const endIndex = Math.min(startIndex + rowsPerPage, totalRows);
    const pageData = currentData.slice(startIndex, endIndex);

    const isSummaryActive = SmartSummaryEngine.isSummaryModeActive();

    // 1. Build main table card container
    const tableCard = document.createElement('div');
    tableCard.className = 'modern-table-card';

    // 2. Build modern toolbar
    const toolbar = document.createElement('div');
    toolbar.className = 'modern-table-toolbar d-flex align-items-center justify-content-between flex-wrap gap-2';

    toolbar.innerHTML = `
        <div class="d-flex align-items-center flex-wrap gap-2">
            <span class="badge bg-primary-subtle text-primary border border-primary-subtle px-2.5 py-1 rounded-pill fw-semibold d-flex align-items-center gap-1.5" style="font-size: 0.75rem;">
                <i class="bi bi-table"></i> Data Table
            </span>
            <span class="badge bg-secondary-subtle text-secondary rounded-pill fw-medium" style="font-size: 0.72rem;">
                ${totalRows.toLocaleString()} rows
            </span>
            ${isSummaryActive ? `
                <span class="badge bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-pill" style="font-size: 0.72rem;">
                    ⚡ Summary Mode
                </span>
            ` : ''}
            <span id="modernTableSelectionBadge" class="text-secondary small d-none d-md-inline" style="font-size: 0.72rem;">
                Selected: <span class="fw-semibold text-primary" id="selectionInfo">A1</span>
            </span>
        </div>

        <div class="d-flex align-items-center gap-2 ms-auto">
            <!-- Quick search input -->
            <div class="input-group input-group-sm" style="max-width: 200px;">
                <span class="input-group-text modern-table-search-addon border-end-0 py-0">
                    <i class="bi bi-search" style="font-size: 0.75rem;"></i>
                </span>
                <input type="text" id="tableQuickSearchInput" class="form-control form-control-sm modern-table-search-input border-start-0 py-1" placeholder="Filter rows..." value="${escapeHtml(tableSearchFilter)}" style="font-size: 0.75rem;">
            </div>

            <!-- Action buttons -->
            <div class="btn-group btn-group-sm" role="group">
                <button type="button" class="btn btn-xs modern-table-btn rounded-pill px-2.5 py-1" id="clearSelectionBtn" style="font-size: 0.72rem;" title="Clear Selection">
                    Clear
                </button>
                <button type="button" class="btn btn-xs modern-table-btn rounded-pill px-2.5 py-1 ms-1" id="selectAllBtn" style="font-size: 0.72rem;" title="Select All Rows">
                    Select All
                </button>
            </div>
        </div>
    `;
    tableCard.appendChild(toolbar);

    // 3. Build scrollable table wrapper
    const tableWrapper = document.createElement('div');
    tableWrapper.className = 'modern-table-wrapper';

    const tableEl = document.createElement('table');
    tableEl.className = 'modern-table';

    // Thead
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');

    // Index header
    const thIndex = document.createElement('th');
    thIndex.className = 'th-index';
    thIndex.textContent = '#';
    headerRow.appendChild(thIndex);

    // Column headers
    currentHeaders.forEach((colName, colIdx) => {
        const th = document.createElement('th');
        th.dataset.colIndex = String(colIdx);
        th.dataset.colName = colName;

        const isSorted = tableSortColumn === colName;
        const sortIcon = isSorted 
            ? (tableSortDirection === 'asc' ? ' <i class="bi bi-arrow-up text-primary"></i>' : ' <i class="bi bi-arrow-down text-primary"></i>') 
            : '';

        th.innerHTML = `<span class="text-truncate d-inline-block" style="max-width: 200px;">${escapeHtml(colName)}</span>${sortIcon}`;
        th.title = `Click to sort by ${colName}`;

        th.addEventListener('click', () => {
            if (tableSortColumn === colName) {
                tableSortDirection = tableSortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                tableSortColumn = colName;
                tableSortDirection = 'asc';
            }
            displayGoogleSheetsTable();
        });

        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    tableEl.appendChild(thead);

    // Tbody
    const tbody = document.createElement('tbody');

    pageData.forEach((row, rowIdx) => {
        const tr = document.createElement('tr');
        const absoluteRowIdx = startIndex + rowIdx;

        // Index cell
        const tdIndex = document.createElement('td');
        tdIndex.className = 'td-index';
        
        if (isSummaryActive) {
            tdIndex.innerHTML = `<i class="bi bi-search text-primary" style="cursor: pointer;" title="Drill-down into granular records"></i> ${absoluteRowIdx + 1}`;
            tdIndex.addEventListener('click', (e) => {
                e.stopPropagation();
                DrillDownEngine.openDrillDown(row, `Row #${absoluteRowIdx + 1} Drill-Down`);
            });
        } else {
            tdIndex.textContent = String(absoluteRowIdx + 1);
        }
        tr.appendChild(tdIndex);

        // Data cells
        currentHeaders.forEach((headerKey, colIdx) => {
            const td = document.createElement('td');
            td.dataset.row = String(rowIdx);
            td.dataset.col = String(colIdx);
            td.dataset.absRow = String(absoluteRowIdx);

            const val = row[headerKey];
            const displayVal = val !== undefined && val !== null ? String(val) : '';
            td.textContent = displayVal;
            td.title = `${headerKey}: ${displayVal} (Double-click to edit)`;

            // Cell click selection
            td.addEventListener('click', (e) => {
                e.stopPropagation();
                setActiveCell(rowIdx, colIdx);
            });

            // Double-click inline editing
            td.addEventListener('dblclick', (e) => {
                e.stopPropagation();
                if (td.querySelector('input')) return;

                const originalVal = row[headerKey] !== undefined && row[headerKey] !== null ? String(row[headerKey]) : '';
                const input = document.createElement('input');
                input.type = 'text';
                input.className = 'modern-table-input';
                input.value = originalVal;

                td.innerHTML = '';
                td.appendChild(input);
                input.focus();
                input.select();

                let isCommitted = false;
                const commitEdit = () => {
                    if (isCommitted) return;
                    isCommitted = true;

                    const rawInput = input.value.trim();
                    let finalVal = rawInput;
                    if (rawInput !== '' && !isNaN(Number(rawInput)) && !isNaN(parseFloat(rawInput))) {
                        finalVal = Number(rawInput);
                    }

                    row[headerKey] = finalVal;
                    if (rawData && rawData[absoluteRowIdx]) {
                        rawData[absoluteRowIdx][headerKey] = finalVal;
                    }

                    td.textContent = String(finalVal);
                    td.title = `${headerKey}: ${td.textContent} (Double-click to edit)`;

                    if (typeof window.refreshAllTemplateCards === 'function') {
                        window.refreshAllTemplateCards();
                    }

                    window.dispatchEvent(new CustomEvent('vedra:tableDataChanged', {
                        detail: {
                            row: absoluteRowIdx,
                            colIndex: colIdx,
                            header: headerKey,
                            value: finalVal
                        }
                    }));
                };

                input.addEventListener('blur', commitEdit);
                input.addEventListener('keydown', (evt) => {
                    if (evt.key === 'Enter') {
                        evt.preventDefault();
                        commitEdit();
                    } else if (evt.key === 'Escape') {
                        evt.preventDefault();
                        isCommitted = true;
                        td.textContent = originalVal;
                    }
                });
            });

            tr.appendChild(td);
        });

        tbody.appendChild(tr);
    });

    tableEl.appendChild(tbody);
    tableWrapper.appendChild(tableEl);
    tableCard.appendChild(tableWrapper);

    // 4. Build modern pagination footer
    const paginationFooter = document.createElement('div');
    paginationFooter.className = 'modern-table-pagination d-flex align-items-center justify-content-between flex-wrap gap-2';

    paginationFooter.innerHTML = `
        <div class="d-flex align-items-center gap-3">
            <span class="modern-table-record-text small fw-medium" style="font-size: 0.75rem;">
                Showing <strong>${startIndex + 1}–${endIndex}</strong> of <strong>${totalRows.toLocaleString()}</strong> records (Page ${safeCurrentPage} of ${totalPages})
            </span>
            <div class="d-flex align-items-center gap-1.5" style="font-size: 0.75rem;">
                <label for="modernPageSizeSelect" class="modern-table-rows-label mb-0">Rows:</label>
                <select id="modernPageSizeSelect" class="form-select form-select-sm modern-table-pagesize py-0 px-2" style="width: auto; height: 26px; font-size: 0.72rem; cursor: pointer;">
                    <option value="10" ${rowsPerPage === 10 ? 'selected' : ''}>10</option>
                    <option value="25" ${rowsPerPage === 25 ? 'selected' : ''}>25</option>
                    <option value="50" ${rowsPerPage === 50 ? 'selected' : ''}>50</option>
                    <option value="100" ${rowsPerPage === 100 ? 'selected' : ''}>100</option>
                    <option value="250" ${rowsPerPage === 250 ? 'selected' : ''}>250</option>
                    <option value="500" ${rowsPerPage === 500 ? 'selected' : ''}>500</option>
                </select>
            </div>
        </div>

        <div class="d-flex align-items-center gap-1">
            <button type="button" class="btn btn-xs modern-table-btn rounded-pill px-2.5 py-1" id="tblFirstPageBtn" ${safeCurrentPage === 1 ? 'disabled' : ''} title="First Page">
                <i class="bi bi-chevron-double-left"></i>
            </button>
            <button type="button" class="btn btn-xs modern-table-btn rounded-pill px-2.5 py-1" id="tblPrevPageBtn" ${safeCurrentPage === 1 ? 'disabled' : ''} title="Previous Page">
                <i class="bi bi-chevron-left me-0.5"></i> Prev
            </button>
            <span class="badge modern-table-page-badge px-2 py-1 mx-1" style="font-size: 0.72rem;">${safeCurrentPage} / ${totalPages}</span>
            <button type="button" class="btn btn-xs modern-table-btn rounded-pill px-2.5 py-1" id="tblNextPageBtn" ${safeCurrentPage === totalPages ? 'disabled' : ''} title="Next Page">
                Next <i class="bi bi-chevron-right ms-0.5"></i>
            </button>
            <button type="button" class="btn btn-xs modern-table-btn rounded-pill px-2.5 py-1" id="tblLastPageBtn" ${safeCurrentPage === totalPages ? 'disabled' : ''} title="Last Page">
                <i class="bi bi-chevron-double-right"></i>
            </button>
        </div>
    `;
    tableCard.appendChild(paginationFooter);

    container.appendChild(tableCard);

    // 5. Attach event listeners
    document.getElementById('clearSelectionBtn')?.addEventListener('click', clearSelection);
    document.getElementById('selectAllBtn')?.addEventListener('click', selectAll);

    document.getElementById('tblFirstPageBtn')?.addEventListener('click', () => goToPage(1));
    document.getElementById('tblPrevPageBtn')?.addEventListener('click', () => changePage(-1));
    document.getElementById('tblNextPageBtn')?.addEventListener('click', () => changePage(1));
    document.getElementById('tblLastPageBtn')?.addEventListener('click', () => goToPage(totalPages));

    document.getElementById('modernPageSizeSelect')?.addEventListener('change', (e) => {
        const val = parseInt(e.target.value, 10);
        if (!isNaN(val)) {
            setRowsPerPage(val);
            goToPage(1);
        }
    });

    const searchInput = document.getElementById('tableQuickSearchInput');
    if (searchInput) {
        let debounceTimer = null;
        searchInput.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                tableSearchFilter = searchInput.value;
                displayGoogleSheetsTable();
                const newInput = document.getElementById('tableQuickSearchInput');
                if (newInput) {
                    newInput.focus();
                    newInput.setSelectionRange(newInput.value.length, newInput.value.length);
                }
            }, 250);
        });
    }

    // Default active cell on initial render
    if (pageData.length > 0) {
        setActiveCell(0, 0);
    }
}

/**
 * Sets the active highlighted cell in the table
 */
export function setActiveCell(row, col) {
    activeSelection = { row, col, allSelected: false };

    document.querySelectorAll('.modern-table td').forEach(td => {
        td.classList.remove('cell-active');
        if (!activeSelection.allSelected) {
            td.classList.remove('cell-selected');
        }
    });

    const targetCell = document.querySelector(`.modern-table td[data-row="${row}"][data-col="${col}"]`);
    if (targetCell) {
        targetCell.classList.add('cell-active');
    }

    const selectionInfo = document.getElementById('selectionInfo');
    if (selectionInfo && headers && headers[col]) {
        const colLetter = String.fromCharCode(65 + (col % 26));
        selectionInfo.textContent = `${headers[col]} (${colLetter}${row + 1})`;
    }
}

/**
 * Clears current selection
 */
export function clearSelection() {
    activeSelection = { row: -1, col: -1, allSelected: false };
    document.querySelectorAll('.modern-table td').forEach(td => {
        td.classList.remove('cell-active', 'cell-selected');
    });

    const selectionInfo = document.getElementById('selectionInfo');
    if (selectionInfo) selectionInfo.textContent = 'None';
}

/**
 * Selects all cells in current view
 */
export function selectAll() {
    activeSelection.allSelected = true;
    document.querySelectorAll('.modern-table td').forEach(td => {
        td.classList.add('cell-selected');
    });

    const selectionInfo = document.getElementById('selectionInfo');
    if (selectionInfo) selectionInfo.textContent = 'All records selected';
}

/**
 * Escape helper for HTML
 */
function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str).replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}

// Global functions attached to window for compatibility
window.clearSelection = clearSelection;
window.selectAll = selectAll;
window.changePage = changePage;

if (typeof window !== 'undefined') {
    window.addEventListener('themeChanged', () => {
        ensureModernTableStyles();
    });
}
