/**
 * Vedra BI - Interactive Drill-Down Engine & Modal
 * Allows deep-dive navigation from aggregated summary records directly into the granular underlying raw data.
 * When clicking on any summary table row or chart data point, displays the matching subset of raw records
 * with instant search, pagination, summary statistics, and CSV export.
 */

import { rawData, currentUserId } from '../../store/DataHandler.ts';
import { SmartSummaryEngine } from '../core/smartSummaryEngine.ts';
import { showMessage } from '../core/utils.ts';

declare const bootstrap: any;
declare const Papa: any;

export interface DrillDownFilter {
    column: string;
    value: any;
    isDateTruncated?: boolean;
    dateTruncation?: string;
}

export class DrillDownEngine {
    private static currentFilteredRawRows: Record<string, any>[] = [];
    private static currentFilters: DrillDownFilter[] = [];
    private static currentPage: number = 1;
    private static pageSize: number = 15;
    private static searchTerm: string = '';
    private static modalInstance: any = null;

    /**
     * Filter raw data records based on dimensional values of a summary row
     */
    public static filterGranularRecords(
        sourceRawData: Record<string, any>[],
        groupFilters: Record<string, any>,
        dateGrouping?: string,
        dateColumn?: string
    ): { records: Record<string, any>[]; filters: DrillDownFilter[]; matchCount: number } {
        if (!sourceRawData || sourceRawData.length === 0) {
            return { records: [], filters: [], matchCount: 0 };
        }

        const filters: DrillDownFilter[] = [];
        for (const [col, val] of Object.entries(groupFilters)) {
            // Skip non-dimensional or internal fields
            if (col === '_record_count' || col.endsWith('_avg') || col.endsWith('_count') || col.endsWith('_min') || col.endsWith('_max') || col.endsWith('_median') || col.endsWith('_stddev') || col.endsWith('_distinct')) {
                continue;
            }

            const isDateCol = Boolean(dateGrouping && dateGrouping !== 'none' && col === dateColumn);
            filters.push({
                column: col,
                value: val,
                isDateTruncated: isDateCol,
                dateTruncation: isDateCol ? dateGrouping : undefined
            });
        }

        const matchedRecords = sourceRawData.filter((row) => {
            for (const f of filters) {
                const rowVal = row[f.column];
                if (f.isDateTruncated && f.dateTruncation) {
                    let strVal = rowVal !== undefined && rowVal !== null ? String(rowVal).trim() : 'Unknown';
                    if (f.dateTruncation === 'year' && strVal.length >= 4) strVal = strVal.substring(0, 4);
                    else if (f.dateTruncation === 'month' && strVal.length >= 7) strVal = strVal.substring(0, 7);
                    else if (f.dateTruncation === 'day' && strVal.length >= 10) strVal = strVal.substring(0, 10);

                    if (String(strVal) !== String(f.value)) return false;
                } else {
                    const rowValStr = rowVal !== undefined && rowVal !== null ? String(rowVal).trim() : 'Unknown';
                    const targetValStr = f.value !== undefined && f.value !== null ? String(f.value).trim() : 'Unknown';
                    if (rowValStr !== targetValStr) return false;
                }
            }
            return true;
        });

        return {
            records: matchedRecords,
            filters,
            matchCount: matchedRecords.length
        };
    }

    /**
     * Open interactive Drill-Down modal for a specific summary row or chart point
     */
    public static openDrillDown(groupFilters: Record<string, any>, contextTitle?: string): void {
        const activeConfig = SmartSummaryEngine.getActiveConfig();
        const dateGrouping = activeConfig?.dateGrouping;
        const dateColumn = activeConfig?.dateColumn;

        const { records, filters } = this.filterGranularRecords(
            rawData,
            groupFilters,
            dateGrouping,
            dateColumn
        );

        this.currentFilteredRawRows = records;
        this.currentFilters = filters;
        this.currentPage = 1;
        this.searchTerm = '';

        this.ensureModalDOM();
        this.renderModalContent(contextTitle);

        const modalEl = document.getElementById('drillDownModal');
        if (modalEl && typeof bootstrap !== 'undefined' && bootstrap.Modal) {
            this.modalInstance = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
            this.modalInstance.show();
        }
    }

    /**
     * Injects modal HTML skeleton into DOM once
     */
    private static ensureModalDOM(): void {
        if (document.getElementById('drillDownModal')) return;

        const modalDiv = document.createElement('div');
        modalDiv.id = 'drillDownModal';
        modalDiv.className = 'modal fade';
        modalDiv.setAttribute('tabindex', '-1');
        modalDiv.setAttribute('aria-hidden', 'true');
        modalDiv.innerHTML = `
            <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
                <div class="modal-content shadow-lg border-0" style="border-radius: 12px; overflow: hidden;">
                    <div class="modal-header py-3 px-4 bg-light border-bottom d-flex align-items-center justify-content-between">
                        <div class="d-flex align-items-center gap-2">
                            <div class="p-2 rounded-2 bg-primary-subtle text-primary">
                                <i class="bi bi-diagram-3-fill fs-5"></i>
                            </div>
                            <div>
                                <h5 class="modal-title fw-bold mb-0" id="drillDownTitle">Drill-Down: Underlying Granular Records</h5>
                                <div class="text-muted small" id="drillDownSubtitle">Detailed raw records backing this summary aggregation</div>
                            </div>
                        </div>
                        <div class="d-flex align-items-center gap-2">
                            <button type="button" class="btn btn-sm btn-outline-success" id="drillDownExportCsvBtn" title="Export this subset to CSV">
                                <i class="bi bi-file-earmark-spreadsheet me-1"></i> Export CSV
                            </button>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                    </div>
                    
                    <div class="modal-body p-4" style="min-height: 480px; max-height: calc(85vh - 120px);">
                        <!-- Filter Chips & Metrics Bar -->
                        <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 p-3 mb-3 rounded-3 bg-light border">
                            <div class="d-flex flex-wrap align-items-center gap-2" id="drillDownFilterChips">
                                <!-- Chips dynamically injected here -->
                            </div>
                            <div class="d-flex align-items-center gap-3">
                                <div class="text-secondary small fw-medium" id="drillDownStatsBadge">
                                    Records: <span class="fw-bold text-dark">0</span>
                                </div>
                                <div class="input-group input-group-sm" style="width: 240px;">
                                    <span class="input-group-text bg-white border-end-0"><i class="bi bi-search text-muted"></i></span>
                                    <input type="text" class="form-control border-start-0" id="drillDownSearchInput" placeholder="Search in records...">
                                </div>
                            </div>
                        </div>

                        <!-- Numeric Stats Summary Bar -->
                        <div class="row g-2 mb-3" id="drillDownNumericKpis">
                            <!-- Injected dynamically -->
                        </div>

                        <!-- Granular Records Table -->
                        <div class="table-responsive border rounded-3 bg-white" style="max-height: 380px; overflow-y: auto;">
                            <table class="table table-hover table-striped table-sm mb-0 align-middle" style="font-size: 0.82rem;">
                                <thead class="table-light sticky-top" id="drillDownTableHead">
                                    <!-- Injected -->
                                </thead>
                                <tbody id="drillDownTableBody">
                                    <!-- Injected -->
                                </tbody>
                            </table>
                        </div>

                        <!-- Pagination Footer -->
                        <div class="d-flex align-items-center justify-content-between mt-3 pt-2 border-top">
                            <div class="text-muted small" id="drillDownPaginationInfo">
                                Showing 1-15 of 0 records
                            </div>
                            <div class="d-flex align-items-center gap-2">
                                <select class="form-select form-select-sm" id="drillDownPageSizeSelect" style="width: 100px;">
                                    <option value="15" selected>15 / page</option>
                                    <option value="25">25 / page</option>
                                    <option value="50">50 / page</option>
                                    <option value="100">100 / page</option>
                                </select>
                                <div class="btn-group btn-group-sm">
                                    <button class="btn btn-outline-secondary" id="drillDownPrevPageBtn" disabled>
                                        <i class="bi bi-chevron-left"></i>
                                    </button>
                                    <button class="btn btn-outline-secondary" id="drillDownNextPageBtn" disabled>
                                        <i class="bi bi-chevron-right"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="modal-footer py-2 px-4 bg-light border-top d-flex justify-content-between">
                        <div class="text-muted small">
                            <i class="bi bi-shield-check text-success me-1"></i> Synchronized with in-memory raw dataset
                        </div>
                        <button type="button" class="btn btn-secondary btn-sm px-3" data-bs-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modalDiv);

        // Bind interactive events
        const searchInput = document.getElementById('drillDownSearchInput') as HTMLInputElement;
        if (searchInput) {
            searchInput.addEventListener('input', (e: any) => {
                this.searchTerm = (e.target.value || '').trim().toLowerCase();
                this.currentPage = 1;
                this.renderTableRows();
            });
        }

        const pageSizeSelect = document.getElementById('drillDownPageSizeSelect') as HTMLSelectElement;
        if (pageSizeSelect) {
            pageSizeSelect.addEventListener('change', (e: any) => {
                this.pageSize = parseInt(e.target.value, 10) || 15;
                this.currentPage = 1;
                this.renderTableRows();
            });
        }

        const prevBtn = document.getElementById('drillDownPrevPageBtn');
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (this.currentPage > 1) {
                    this.currentPage--;
                    this.renderTableRows();
                }
            });
        }

        const nextBtn = document.getElementById('drillDownNextPageBtn');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                const totalFiltered = this.getSearchFilteredRows().length;
                const totalPages = Math.ceil(totalFiltered / this.pageSize);
                if (this.currentPage < totalPages) {
                    this.currentPage++;
                    this.renderTableRows();
                }
            });
        }

        const exportBtn = document.getElementById('drillDownExportCsvBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportCurrentSubsetCsv();
            });
        }
    }

    /**
     * Render modal content including chips, table, and statistics
     */
    private static renderModalContent(contextTitle?: string): void {
        const titleEl = document.getElementById('drillDownTitle');
        if (titleEl) {
            titleEl.textContent = contextTitle || 'Interactive Drill-Down: Underlying Granular Records';
        }

        // 1. Render Filter Chips
        const chipsContainer = document.getElementById('drillDownFilterChips');
        if (chipsContainer) {
            if (this.currentFilters.length === 0) {
                chipsContainer.innerHTML = `<span class="badge bg-secondary">All Group Records</span>`;
            } else {
                chipsContainer.innerHTML = this.currentFilters.map(f => `
                    <span class="badge bg-primary-subtle text-primary border border-primary-subtle d-inline-flex align-items-center gap-1 py-1 px-2">
                        <span class="text-secondary fw-normal">${f.column}:</span>
                        <span class="fw-bold">${f.value}</span>
                        ${f.isDateTruncated ? `<span class="badge bg-light text-dark ms-1" style="font-size: 0.65rem;">${f.dateTruncation}</span>` : ''}
                    </span>
                `).join('');
            }
        }

        // 2. Render Numeric Quick Stats
        this.renderNumericStatsBar();

        // 3. Render Table
        this.renderTableHeaders();
        this.renderTableRows();
    }

    /**
     * Compute and render high-level KPI cards for the granular subset
     */
    private static renderNumericStatsBar(): void {
        const kpiContainer = document.getElementById('drillDownNumericKpis');
        if (!kpiContainer) return;

        const rows = this.currentFilteredRawRows;
        if (!rows || rows.length === 0) {
            kpiContainer.innerHTML = '';
            return;
        }

        // Detect top 3 numeric columns
        const sample = rows[0];
        const numericCols: string[] = [];
        for (const col of Object.keys(sample)) {
            if (typeof sample[col] === 'number' || (!isNaN(Number(sample[col])) && sample[col] !== '')) {
                numericCols.push(col);
                if (numericCols.length >= 3) break;
            }
        }

        if (numericCols.length === 0) {
            kpiContainer.innerHTML = `
                <div class="col-12">
                    <div class="py-2 px-3 bg-light rounded-2 border small text-muted">
                        <i class="bi bi-info-circle me-1"></i> Showing ${rows.length.toLocaleString()} granular raw records for this group
                    </div>
                </div>
            `;
            return;
        }

        const cards = numericCols.map(col => {
            const numbers = rows.map(r => Number(r[col])).filter(n => !isNaN(n));
            const sum = numbers.reduce((a, b) => a + b, 0);
            const avg = numbers.length > 0 ? (sum / numbers.length).toFixed(2) : 0;
            const min = numbers.length > 0 ? Math.min(...numbers) : 0;
            const max = numbers.length > 0 ? Math.max(...numbers) : 0;

            return `
                <div class="col-md-4">
                    <div class="p-2 px-3 rounded-2 bg-light border">
                        <div class="d-flex justify-content-between align-items-center">
                            <span class="text-muted small fw-medium text-truncate">${col}</span>
                            <span class="badge bg-secondary-subtle text-secondary" style="font-size: 0.68rem;">Granular Stat</span>
                        </div>
                        <div class="d-flex align-items-baseline gap-2 mt-1">
                            <span class="fs-6 fw-bold text-dark">${sum.toLocaleString()}</span>
                            <span class="text-muted small">(Avg: ${avg})</span>
                        </div>
                        <div class="text-secondary small mt-1" style="font-size: 0.72rem;">
                            Min: ${min.toLocaleString()} | Max: ${max.toLocaleString()}
                        </div>
                    </div>
                </div>
            `;
        });

        kpiContainer.innerHTML = cards.join('');
    }

    private static getSearchFilteredRows(): Record<string, any>[] {
        if (!this.searchTerm) return this.currentFilteredRawRows;

        return this.currentFilteredRawRows.filter(row => {
            for (const val of Object.values(row)) {
                if (val !== undefined && val !== null && String(val).toLowerCase().includes(this.searchTerm)) {
                    return true;
                }
            }
            return false;
        });
    }

    private static renderTableHeaders(): void {
        const thead = document.getElementById('drillDownTableHead');
        if (!thead) return;

        if (this.currentFilteredRawRows.length === 0) {
            thead.innerHTML = '<tr><th>No Data</th></tr>';
            return;
        }

        const cols = Object.keys(this.currentFilteredRawRows[0]);
        thead.innerHTML = `
            <tr>
                <th style="width: 50px;" class="text-center">#</th>
                ${cols.map(c => `<th>${c}</th>`).join('')}
            </tr>
        `;
    }

    private static renderTableRows(): void {
        const tbody = document.getElementById('drillDownTableBody');
        const statsBadge = document.getElementById('drillDownStatsBadge');
        const paginationInfo = document.getElementById('drillDownPaginationInfo');
        const prevBtn = document.getElementById('drillDownPrevPageBtn') as HTMLButtonElement;
        const nextBtn = document.getElementById('drillDownNextPageBtn') as HTMLButtonElement;

        const filtered = this.getSearchFilteredRows();
        const total = filtered.length;
        const totalPages = Math.ceil(total / this.pageSize) || 1;

        if (this.currentPage > totalPages) this.currentPage = totalPages;
        if (this.currentPage < 1) this.currentPage = 1;

        const startIdx = (this.currentPage - 1) * this.pageSize;
        const endIdx = Math.min(startIdx + this.pageSize, total);
        const pageRows = filtered.slice(startIdx, endIdx);

        if (statsBadge) {
            statsBadge.innerHTML = `Records: <span class="fw-bold text-dark">${total.toLocaleString()}</span> / ${this.currentFilteredRawRows.length.toLocaleString()}`;
        }

        if (paginationInfo) {
            paginationInfo.textContent = `Showing ${total === 0 ? 0 : startIdx + 1}-${endIdx} of ${total.toLocaleString()} records (Page ${this.currentPage}/${totalPages})`;
        }

        if (prevBtn) prevBtn.disabled = this.currentPage <= 1;
        if (nextBtn) nextBtn.disabled = this.currentPage >= totalPages;

        if (!tbody) return;

        if (pageRows.length === 0) {
            tbody.innerHTML = `<tr><td colspan="100" class="text-center py-4 text-muted">No records match the current filter or search criteria.</td></tr>`;
            return;
        }

        const cols = Object.keys(pageRows[0]);
        tbody.innerHTML = pageRows.map((row, idx) => `
            <tr>
                <td class="text-center text-muted small">${startIdx + idx + 1}</td>
                ${cols.map(c => {
                    const val = row[c];
                    const isNum = typeof val === 'number';
                    return `<td class="${isNum ? 'text-end font-monospace' : ''}">${val !== undefined && val !== null ? String(val) : ''}</td>`;
                }).join('')}
            </tr>
        `).join('');
    }

    /**
     * Export the drilled-down granular subset to a clean CSV file
     */
    public static exportCurrentSubsetCsv(): void {
        if (!this.currentFilteredRawRows || this.currentFilteredRawRows.length === 0) {
            showMessage("No granular records to export.", "warning");
            return;
        }

        try {
            const csv = typeof Papa !== 'undefined'
                ? Papa.unparse(this.currentFilteredRawRows)
                : JSON.stringify(this.currentFilteredRawRows);

            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const filterTag = this.currentFilters.map(f => `${f.column}_${f.value}`).join('_').substring(0, 30);
            a.download = `drilldown_${filterTag || 'granular_records'}_${new Date().toISOString().substring(0, 10)}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            showMessage(`Exported ${this.currentFilteredRawRows.length} granular records to CSV!`, "success");
        } catch (err: any) {
            console.error("Export error:", err);
            showMessage("Failed to export drill-down data: " + err.message, "danger");
        }
    }
}
