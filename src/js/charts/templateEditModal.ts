// src/js/charts/templateEditModal.ts
// Interactive Edit Modal for Template Cards with Excel-style =INSERT(target, direction, text) formula builder & live data table picker

import { filteredData, rawData, headers, saveDashboardSettings } from '../../store/DataHandler.ts';
import {
    parseFormula,
    buildFormulaString,
    evaluateFormula,
    applyFormulasToCardConfig,
    indexToColumnLabel,
    columnLabelToIndex,
    FormulaFunctionType
} from './templateFormulaEngine.ts';
import { renderTemplateCard } from './templateCards.ts';
import { showMessage } from '../core/utils.ts';

let currentChartConfig: any = null;
let currentActiveField: string = 'value';
let selectedCellAddress: string = 'A1';
let modalPage: number = 1;
const MODAL_ROWS_PER_PAGE = 8;
let modalSearchTerm = '';
let isShiftSelecting = false;
let selectionStartCell: string | null = null;
let lastFocusedTargetId: string = 'tplFormulaTarget';
let isCheatsheetOpen: boolean = false;

/**
 * Injects modal styles once into the document.
 */
function injectModalStyles(): void {
    if (document.getElementById('template-edit-modal-styles')) return;

    const style = document.createElement('style');
    style.id = 'template-edit-modal-styles';
    style.textContent = `
        .tpl-modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(15, 23, 42, 0.65);
            backdrop-filter: blur(4px);
            z-index: 99999;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 16px;
            box-sizing: border-box;
            animation: tplModalFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes tplModalFadeIn {
            from { opacity: 0; transform: scale(0.97); }
            to { opacity: 1; transform: scale(1); }
        }

        .tpl-modal-container {
            background: #ffffff;
            width: 100%;
            max-width: 980px;
            max-height: 92vh;
            border-radius: 16px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            border: 1px solid #e2e8f0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            color: #1e293b;
        }

        body.dark-theme .tpl-modal-container {
            background: #0f172a;
            color: #f8fafc;
            border-color: #334155;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
        }

        .tpl-modal-header {
            padding: 16px 20px;
            border-bottom: 1px solid #e2e8f0;
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: #f8fafc;
        }

        body.dark-theme .tpl-modal-header {
            background: #1e293b;
            border-color: #334155;
        }

        .tpl-modal-title-group {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .tpl-modal-title {
            font-size: 17px;
            font-weight: 700;
            margin: 0;
            color: #0f172a;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        body.dark-theme .tpl-modal-title {
            color: #f8fafc;
        }

        .tpl-badge {
            font-size: 11px;
            font-weight: 600;
            padding: 3px 8px;
            border-radius: 6px;
            background: #e2e8f0;
            color: #475569;
            text-transform: uppercase;
        }

        body.dark-theme .tpl-badge {
            background: #334155;
            color: #cbd5e1;
        }

        .tpl-modal-close-btn {
            background: transparent;
            border: none;
            color: #64748b;
            font-size: 20px;
            cursor: pointer;
            width: 32px;
            height: 32px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.15s;
        }

        .tpl-modal-close-btn:hover {
            background: #e2e8f0;
            color: #0f172a;
        }

        body.dark-theme .tpl-modal-close-btn:hover {
            background: #334155;
            color: #ffffff;
        }

        .tpl-modal-body {
            display: grid;
            grid-template-columns: 380px 1fr;
            flex: 1;
            overflow: hidden;
            min-height: 480px;
        }

        @media (max-width: 860px) {
            .tpl-modal-body {
                grid-template-columns: 1fr;
                overflow-y: auto;
            }
        }

        /* Left Panel: Form & Formula Builder */
        .tpl-form-panel {
            padding: 20px;
            border-right: 1px solid #e2e8f0;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 16px;
            background: #ffffff;
        }

        body.dark-theme .tpl-form-panel {
            background: #0f172a;
            border-color: #334155;
        }

        .tpl-field-group {
            display: flex;
            flex-direction: column;
            gap: 6px;
        }

        .tpl-label {
            font-size: 12px;
            font-weight: 600;
            color: #475569;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        body.dark-theme .tpl-label {
            color: #94a3b8;
        }

        .tpl-input {
            width: 100%;
            padding: 8px 12px;
            font-size: 13px;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            background: #ffffff;
            color: #0f172a;
            outline: none;
            box-sizing: border-box;
            transition: border-color 0.15s;
        }

        .tpl-input:focus {
            border-color: #2563eb;
            box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
        }

        body.dark-theme .tpl-input {
            background: #1e293b;
            border-color: #334155;
            color: #f8fafc;
        }

        body.dark-theme .tpl-input:focus {
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25);
        }

        .tpl-formula-builder-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 14px;
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        body.dark-theme .tpl-formula-builder-card {
            background: #1e293b;
            border-color: #334155;
        }

        .tpl-builder-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-size: 13px;
            font-weight: 700;
            color: #2563eb;
        }

        body.dark-theme .tpl-builder-header {
            color: #60a5fa;
        }

        .tpl-dir-toggle-group {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
        }

        .tpl-dir-btn {
            padding: 8px 10px;
            border: 1px solid #cbd5e1;
            background: #ffffff;
            color: #475569;
            font-size: 12px;
            font-weight: 600;
            border-radius: 8px;
            cursor: pointer;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 2px;
            transition: all 0.15s;
        }

        .tpl-dir-btn small {
            font-size: 10px;
            font-weight: normal;
            opacity: 0.8;
        }

        .tpl-dir-btn.active {
            background: #2563eb;
            color: #ffffff;
            border-color: #2563eb;
        }

        body.dark-theme .tpl-dir-btn {
            background: #0f172a;
            border-color: #334155;
            color: #94a3b8;
        }

        body.dark-theme .tpl-dir-btn.active {
            background: #3b82f6;
            color: #ffffff;
            border-color: #3b82f6;
        }

        /* Dictionary & Guide Box */
        .tpl-guide-box {
            background: #eff6ff;
            border: 1px solid #bfdbfe;
            border-radius: 8px;
            padding: 10px 12px;
            font-size: 11px;
            line-height: 1.45;
            color: #1e40af;
        }

        body.dark-theme .tpl-guide-box {
            background: #172554;
            border-color: #1e3a8a;
            color: #93c5fd;
        }

        .tpl-guide-box code {
            font-family: monospace;
            background: rgba(255, 255, 255, 0.6);
            padding: 1px 4px;
            border-radius: 4px;
            font-weight: bold;
        }

        body.dark-theme .tpl-guide-box code {
            background: rgba(0, 0, 0, 0.3);
        }

        /* Live Preview Badge */
        .tpl-preview-box {
            background: #ecfdf5;
            border: 1px solid #a7f3d0;
            border-radius: 8px;
            padding: 10px 12px;
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        body.dark-theme .tpl-preview-box {
            background: #064e3b;
            border-color: #047857;
        }

        .tpl-preview-label {
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #059669;
        }

        body.dark-theme .tpl-preview-label {
            color: #6ee7b7;
        }

        .tpl-preview-value {
            font-size: 14px;
            font-weight: 700;
            color: #065f46;
            word-break: break-all;
        }

        body.dark-theme .tpl-preview-value {
            color: #a7f3d0;
        }

        /* Target input highlight when active for table clicks */
        .tpl-input.tpl-target-active {
            border-color: #2563eb !important;
            box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.25) !important;
            background: #f0f7ff !important;
        }

        body.dark-theme .tpl-input.tpl-target-active {
            background: #1e3a8a !important;
            border-color: #60a5fa !important;
            box-shadow: 0 0 0 2px rgba(96, 165, 250, 0.25) !important;
        }

        /* Cheatsheet Card */
        .tpl-cheatsheet-card {
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            background: #ffffff;
            overflow: hidden;
            margin-top: 4px;
        }

        body.dark-theme .tpl-cheatsheet-card {
            border-color: #334155;
            background: #1e293b;
        }

        .tpl-cheatsheet-toggle-btn {
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 8px 12px;
            background: #f8fafc;
            border: none;
            cursor: pointer;
            font-size: 11px;
            font-weight: 700;
            color: #334155;
            transition: background 0.15s;
        }

        .tpl-cheatsheet-toggle-btn:hover {
            background: #f1f5f9;
        }

        body.dark-theme .tpl-cheatsheet-toggle-btn {
            background: #0f172a;
            color: #cbd5e1;
        }

        body.dark-theme .tpl-cheatsheet-toggle-btn:hover {
            background: #1e293b;
        }

        .tpl-cheatsheet-content {
            max-height: 240px;
            overflow-y: auto;
            padding: 8px;
            display: flex;
            flex-direction: column;
            gap: 6px;
        }

        .tpl-cheat-item {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 8px;
            padding: 6px 8px;
            border-radius: 6px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            font-size: 11px;
        }

        body.dark-theme .tpl-cheat-item {
            background: #0f172a;
            border-color: #334155;
        }

        .tpl-cheat-load-btn {
            padding: 3px 8px;
            font-size: 10px;
            font-weight: 600;
            border-radius: 4px;
            background: #2563eb;
            color: #ffffff;
            border: none;
            cursor: pointer;
            white-space: nowrap;
            transition: opacity 0.15s;
        }

        .tpl-cheat-load-btn:hover {
            opacity: 0.9;
        }

        /* Right Panel: Excel Style Data Table */
        .tpl-table-panel {
            display: flex;
            flex-direction: column;
            background: #ffffff;
            overflow: hidden;
        }

        body.dark-theme .tpl-table-panel {
            background: #0f172a;
        }

        .tpl-table-toolbar {
            padding: 12px 16px;
            border-bottom: 1px solid #e2e8f0;
            background: #f8fafc;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            flex-wrap: wrap;
        }

        body.dark-theme .tpl-table-toolbar {
            background: #1e293b;
            border-color: #334155;
        }

        .tpl-table-hint {
            font-size: 12px;
            color: #64748b;
            display: flex;
            align-items: center;
            gap: 6px;
        }

        body.dark-theme .tpl-table-hint {
            color: #94a3b8;
        }

        .tpl-cell-badge {
            background: #2563eb;
            color: #ffffff;
            font-weight: 700;
            font-family: monospace;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 11px;
        }

        .tpl-sheet-wrapper {
            flex: 1;
            overflow: auto;
            position: relative;
        }

        .tpl-excel-table {
            border-collapse: collapse;
            font-size: 12px;
            width: 100%;
            min-width: 600px;
        }

        .tpl-excel-table th, .tpl-excel-table td {
            border: 1px solid #e2e8f0;
            padding: 6px 10px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 180px;
            user-select: none;
        }

        body.dark-theme .tpl-excel-table th, body.dark-theme .tpl-excel-table td {
            border-color: #334155;
        }

        .tpl-col-letter-th {
            background: #f1f5f9;
            color: #475569;
            font-weight: 700;
            text-align: center;
            position: sticky;
            top: 0;
            z-index: 10;
            font-family: monospace;
        }

        body.dark-theme .tpl-col-letter-th {
            background: #1e293b;
            color: #cbd5e1;
        }

        .tpl-col-name-th {
            background: #e2e8f0;
            color: #1e293b;
            font-weight: 600;
            cursor: pointer;
            position: sticky;
            top: 28px;
            z-index: 9;
            transition: background 0.15s;
        }

        .tpl-col-name-th:hover {
            background: #cbd5e1;
            color: #2563eb;
        }

        body.dark-theme .tpl-col-name-th {
            background: #334155;
            color: #f1f5f9;
        }

        body.dark-theme .tpl-col-name-th:hover {
            background: #475569;
            color: #60a5fa;
        }

        .tpl-row-num-td {
            background: #f1f5f9;
            color: #64748b;
            font-weight: 600;
            text-align: center;
            font-family: monospace;
            width: 44px;
            min-width: 44px;
            position: sticky;
            left: 0;
            z-index: 5;
        }

        body.dark-theme .tpl-row-num-td {
            background: #1e293b;
            color: #94a3b8;
        }

        .tpl-data-td {
            background: #ffffff;
            color: #0f172a;
            cursor: cell;
            transition: all 0.1s;
        }

        body.dark-theme .tpl-data-td {
            background: #0f172a;
            color: #e2e8f0;
        }

        .tpl-data-td:hover {
            background: #f8fafc;
        }

        body.dark-theme .tpl-data-td:hover {
            background: #1e293b;
        }

        .tpl-data-td.selected {
            background: #eff6ff !important;
            outline: 2px solid #2563eb !important;
            outline-offset: -2px;
            color: #1d4ed8 !important;
            font-weight: 600;
        }

        body.dark-theme .tpl-data-td.selected {
            background: #1e3a8a !important;
            outline-color: #60a5fa !important;
            color: #93c5fd !important;
        }

        .tpl-pagination-bar {
            padding: 10px 16px;
            border-top: 1px solid #e2e8f0;
            background: #f8fafc;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        body.dark-theme .tpl-pagination-bar {
            background: #1e293b;
            border-color: #334155;
        }

        .tpl-page-info {
            font-size: 12px;
            color: #64748b;
        }

        body.dark-theme .tpl-page-info {
            color: #94a3b8;
        }

        .tpl-btn-group {
            display: flex;
            gap: 6px;
        }

        .tpl-btn {
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            border: 1px solid #cbd5e1;
            background: #ffffff;
            color: #334155;
            transition: all 0.15s;
        }

        .tpl-btn:hover:not(:disabled) {
            background: #f1f5f9;
        }

        .tpl-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        body.dark-theme .tpl-btn {
            background: #0f172a;
            border-color: #334155;
            color: #cbd5e1;
        }

        body.dark-theme .tpl-btn:hover:not(:disabled) {
            background: #1e293b;
        }

        .tpl-btn-primary {
            background: #2563eb;
            color: #ffffff;
            border-color: #2563eb;
        }

        .tpl-btn-primary:hover:not(:disabled) {
            background: #1d4ed8;
            border-color: #1d4ed8;
        }

        body.dark-theme .tpl-btn-primary {
            background: #3b82f6;
            border-color: #3b82f6;
            color: #ffffff;
        }

        .tpl-modal-footer {
            padding: 14px 20px;
            border-top: 1px solid #e2e8f0;
            background: #f8fafc;
            display: flex;
            align-items: center;
            justify-content: flex-end;
            gap: 10px;
        }

        body.dark-theme .tpl-modal-footer {
            background: #1e293b;
            border-color: #334155;
        }
    `;
    document.head.appendChild(style);
}

// Metadata dictionary for all 15 supported formulas
interface FormulaMeta {
    label: string;
    category: string;
    syntax: string;
    example: string;
    description: string;
    t1Label: string;
    t1Placeholder: string;
    hasT2: boolean;
    t2Label?: string;
    t2Placeholder?: string;
    hasFormat?: boolean;
    hasDirection: boolean;
    textLabel: string;
    textPlaceholder: string;
    hasExtra: boolean;
    extraLabel?: string;
    extraPlaceholder?: string;
}

const FORMULA_METAS: Record<FormulaFunctionType, FormulaMeta> = {
    INSERT: {
        label: 'INSERT - Single Cell / Column Reference',
        category: 'Basic',
        syntax: '=INSERT(Target, Direction, "Text")',
        example: '=INSERT(A4, R, "sales")',
        description: 'Binds a specific table cell (e.g. A4) or entire column to custom text with live updating.',
        t1Label: '1. Target Cell or Column',
        t1Placeholder: 'e.g. A4, B2, or Sales',
        hasT2: false,
        hasDirection: true,
        textLabel: '2. Custom Label / Text',
        textPlaceholder: 'e.g. sales, Total: , ₹',
        hasExtra: false
    },
    SUM: {
        label: 'SUM - Total Sum of Column / Range',
        category: 'Math',
        syntax: '=SUM(ColumnOrRange, Direction, "Text")',
        example: '=SUM(Sales, R, "Total Revenue:")',
        description: 'Calculates the mathematical sum of an entire column or cell range.',
        t1Label: '1. Column or Range Target',
        t1Placeholder: 'e.g. Sales, A2:A20, or B',
        hasT2: false,
        hasDirection: true,
        textLabel: '2. Prefix / Suffix Label',
        textPlaceholder: 'e.g. Total Revenue: , Net: ',
        hasExtra: false
    },
    AVG: {
        label: 'AVG - Average / Mean Value',
        category: 'Math',
        syntax: '=AVG(ColumnOrRange, Direction, "Text")',
        example: '=AVG(Profit, L, "Avg Margin")',
        description: 'Calculates the average (mean) value for a column or cell range.',
        t1Label: '1. Column or Range Target',
        t1Placeholder: 'e.g. Profit, B2:B20',
        hasT2: false,
        hasDirection: true,
        textLabel: '2. Prefix / Suffix Label',
        textPlaceholder: 'e.g. Avg Margin, Average: ',
        hasExtra: false
    },
    MAX: {
        label: 'MAX - Peak / Maximum Value',
        category: 'Math',
        syntax: '=MAX(ColumnOrRange, Direction, "Text")',
        example: '=MAX(DailySales, R, "Peak:")',
        description: 'Finds the highest numerical value in a column or cell range.',
        t1Label: '1. Column or Range Target',
        t1Placeholder: 'e.g. DailySales, C1:C50',
        hasT2: false,
        hasDirection: true,
        textLabel: '2. Prefix / Suffix Label',
        textPlaceholder: 'e.g. Peak: , High Record: ',
        hasExtra: false
    },
    MIN: {
        label: 'MIN - Lowest / Minimum Value',
        category: 'Math',
        syntax: '=MIN(ColumnOrRange, Direction, "Text")',
        example: '=MIN(DailySales, R, "Lowest:")',
        description: 'Finds the lowest numerical value in a column or cell range.',
        t1Label: '1. Column or Range Target',
        t1Placeholder: 'e.g. DailySales, C1:C50',
        hasT2: false,
        hasDirection: true,
        textLabel: '2. Prefix / Suffix Label',
        textPlaceholder: 'e.g. Lowest: , Min: ',
        hasExtra: false
    },
    COUNT: {
        label: 'COUNT - Active Rows / Record Count',
        category: 'Math',
        syntax: '=COUNT(ColumnOrRange, Direction, "Text")',
        example: '=COUNT(OrderID, R, "Total Orders:")',
        description: 'Counts the number of active rows or non-empty entries in a column.',
        t1Label: '1. Column or Range Target',
        t1Placeholder: 'e.g. OrderID, A2:A100',
        hasT2: false,
        hasDirection: true,
        textLabel: '2. Prefix / Suffix Label',
        textPlaceholder: 'e.g. Total Orders: , Active Records: ',
        hasExtra: false
    },
    GROWTH: {
        label: 'GROWTH - Growth % (Current vs Previous)',
        category: 'Growth',
        syntax: '=GROWTH(TargetCurrent, TargetPrev, Direction, "Text")',
        example: '=GROWTH(B10, B9, R, "MoM Growth:")',
        description: 'Calculates Month-over-Month (MoM) or YoY growth %: ((Current - Prev) / Prev * 100) with auto arrows.',
        t1Label: '1. Current Period Value (Target 1)',
        t1Placeholder: 'e.g. B10, ThisMonth',
        hasT2: true,
        t2Label: '2. Previous Period Value (Target 2)',
        t2Placeholder: 'e.g. B9, LastMonth',
        hasDirection: true,
        textLabel: '3. Prefix / Suffix Label',
        textPlaceholder: 'e.g. MoM Growth: , Growth: ',
        hasExtra: false
    },
    DIFF: {
        label: 'DIFF - Variance / Difference (Actual - Plan)',
        category: 'Growth',
        syntax: '=DIFF(Target1, Target2, Direction, "Text")',
        example: '=DIFF(Actual, Target, R, "Variance:")',
        description: 'Calculates the mathematical difference (Target1 - Target2) showing variance or budget gap.',
        t1Label: '1. Actual Value (Target 1)',
        t1Placeholder: 'e.g. Actual, B2, Sales',
        hasT2: true,
        t2Label: '2. Plan / Target Value (Target 2)',
        t2Placeholder: 'e.g. Target, B3, 50000',
        hasDirection: true,
        textLabel: '3. Prefix / Suffix Label',
        textPlaceholder: 'e.g. Variance: , Gap: ',
        hasExtra: false
    },
    PERCENT: {
        label: 'PERCENT - Percentage % for Gauge & Progress',
        category: 'Progress',
        syntax: '=PERCENT(ActualTarget, MaxTarget, Direction, "Text")',
        example: '=PERCENT(Achieved, Quota, R, "Target Met:")',
        description: 'Calculates percentage (Actual / Max * 100)%, ideal for auto-updating Gauge meters & Progress bars.',
        t1Label: '1. Achieved / Current Target',
        t1Placeholder: 'e.g. Achieved, B2, 750',
        hasT2: true,
        t2Label: '2. Max / Quota Goal Target',
        t2Placeholder: 'e.g. Quota, B3, 1000',
        hasDirection: true,
        textLabel: '3. Prefix / Suffix Label',
        textPlaceholder: 'e.g. Target Met: , Progress: ',
        hasExtra: false
    },
    REMAINING: {
        label: 'REMAINING - Pending to Goal (Goal - Current)',
        category: 'Progress',
        syntax: '=REMAINING(GoalTarget, CurrentTarget, Direction, "Text")',
        example: '=REMAINING(500000, B2, R, "Pending:")',
        description: 'Calculates deficit or remaining balance to achieve target goal (Goal - Current).',
        t1Label: '1. Goal Target Value',
        t1Placeholder: 'e.g. 500000, GoalRevenue',
        hasT2: true,
        t2Label: '2. Current Achieved Value',
        t2Placeholder: 'e.g. B2, Sales',
        hasDirection: true,
        textLabel: '3. Prefix / Suffix Label',
        textPlaceholder: 'e.g. Pending: , Remaining: ',
        hasExtra: false
    },
    STATUS: {
        label: 'STATUS - Alert / Status Badge',
        category: 'Logic',
        syntax: '=STATUS(Target, Threshold, "PassText", "FailText")',
        example: '=STATUS(CPU_Usage, 85, "Critical 🔥", "Normal ✅")',
        description: 'Checks if target value meets threshold and returns Pass or Fail status badge dynamically.',
        t1Label: '1. Metric Target (Cell or Column)',
        t1Placeholder: 'e.g. CPU_Usage, A4, Score',
        hasT2: true,
        t2Label: '2. Threshold Value or Condition',
        t2Placeholder: 'e.g. 85, 80, >=50',
        hasDirection: false,
        textLabel: '3. Pass Text (When Condition Met)',
        textPlaceholder: 'e.g. Critical 🔥, Pass ✅',
        hasExtra: true,
        extraLabel: '4. Fail Text (When Condition Not Met)',
        extraPlaceholder: 'e.g. Normal ✅, Fail ❌'
    },
    IF: {
        label: 'IF - Conditional Logic Expression',
        category: 'Logic',
        syntax: '=IF(Target > 10000, "High Performer", "Standard")',
        example: '=IF(Sales > 10000, "High Performer", "Standard")',
        description: 'Evaluates logical expression (>, <, ==) and displays custom True/False result text.',
        t1Label: '1. Condition (e.g. Target > 10000)',
        t1Placeholder: 'e.g. Sales > 10000, A4 == "Active"',
        hasT2: false,
        hasDirection: false,
        textLabel: '2. Value If True',
        textPlaceholder: 'e.g. High Performer, Approved',
        hasExtra: true,
        extraLabel: '3. Value If False',
        extraPlaceholder: 'e.g. Standard, Pending'
    },
    LATEST: {
        label: 'LATEST - Most Recent / Last Row Record',
        category: 'Stream',
        syntax: '=LATEST(ColumnName, Direction, "Text")',
        example: '=LATEST(Status, R, "Current Status:")',
        description: 'Always retrieves the last/newest row entry in a column as table updates.',
        t1Label: '1. Column Name Target',
        t1Placeholder: 'e.g. Status, UpdatedAt, Sales',
        hasT2: false,
        hasDirection: true,
        textLabel: '2. Prefix / Suffix Label',
        textPlaceholder: 'e.g. Current Status: , Latest: ',
        hasExtra: false
    },
    TOP: {
        label: 'TOP - Top Performer Category / Rank N',
        category: 'Stream',
        syntax: '=TOP(ColumnName, N, Direction, "Text")',
        example: '=TOP(Category, 1, R, "Top Performer:")',
        description: 'Extracts the top-performing category or N-th highest performer from a column.',
        t1Label: '1. Category / Dimension Column',
        t1Placeholder: 'e.g. Category, Region, Product',
        hasT2: true,
        t2Label: '2. Rank Position N (1 for #1)',
        t2Placeholder: 'e.g. 1, 2, 3',
        hasDirection: true,
        textLabel: '3. Prefix / Suffix Label',
        textPlaceholder: 'e.g. Top Performer: , #1: ',
        hasExtra: false
    },
    FORMAT: {
        label: 'FORMAT - Currency (₹ INR / $ USD) & Numbers',
        category: 'Formatting',
        syntax: '=FORMAT(Target, "INR", Direction, "Text")',
        example: '=FORMAT(A4, "INR", R, "Net:")',
        description: 'Formats numeric data into Indian Rupees (₹), USD ($), EUR (€), %, or Compact (K/L/Cr).',
        t1Label: '1. Target Cell / Column / Number',
        t1Placeholder: 'e.g. A4, Sales, 482500',
        hasT2: true,
        t2Label: '2. Format Style',
        t2Placeholder: 'e.g. INR, USD, EUR, PERCENT, COMPACT',
        hasFormat: true,
        hasDirection: true,
        textLabel: '3. Prefix / Suffix Label',
        textPlaceholder: 'e.g. Net: , Total: ',
        hasExtra: false
    }
};

/**
 * Opens the interactive Template Card Data & Formula Editor Modal.
 */
export function openTemplateEditModal(chartConfig: any, initialField = 'value'): void {
    if (!chartConfig) return;
    currentChartConfig = chartConfig;
    currentActiveField = initialField;
    selectedCellAddress = 'A1';
    modalPage = 1;
    modalSearchTerm = '';
    lastFocusedTargetId = 'tplFormulaTarget';
    isCheatsheetOpen = false;

    // Initialize formulas object if missing
    if (!currentChartConfig.formulas) {
        currentChartConfig.formulas = {};
    }

    injectModalStyles();

    // Remove existing modal if any
    const existing = document.getElementById('templateEditModalOverlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'templateEditModalOverlay';
    overlay.className = 'tpl-modal-overlay';

    const category = currentChartConfig.templateCategory || 'kpi';
    const categoryTitle = category === 'textbox' ? 'READY-MADE TEXTBOX' : category.toUpperCase();

    // Initial formula or text for active field
    const currentFieldValue = currentChartConfig.formulas[currentActiveField] || currentChartConfig[currentActiveField] || '';
    const parsed = parseFormula(currentFieldValue);

    let initialFn: FormulaFunctionType = parsed.isFormula ? parsed.fnType : 'INSERT';
    let initialTarget = parsed.isFormula ? parsed.target : 'A4';
    let initialTarget2 = (parsed.isFormula && parsed.args.length >= 2) ? parsed.args[1] : '';
    let initialDir: 'R' | 'L' = parsed.isFormula ? parsed.direction : 'R';
    let initialText = parsed.isFormula ? parsed.text : 'sales';
    let initialExtra = (parsed.isFormula && parsed.args.length >= 4) ? parsed.args[3] : '';

    overlay.innerHTML = `
        <div class="tpl-modal-container" role="dialog" aria-modal="true">
            <!-- Modal Header -->
            <div class="tpl-modal-header">
                <div class="tpl-modal-title-group">
                    <h3 class="tpl-modal-title">
                        <span>✏️</span>
                        <span>Edit Template Card & Formulas</span>
                    </h3>
                    <span class="tpl-badge">${categoryTitle}</span>
                    <span style="font-size: 12px; color: #64748b;">${currentChartConfig.title || currentChartConfig.label || 'Card'}</span>
                </div>
                <button type="button" class="tpl-modal-close-btn" id="tplModalCloseX" title="Close">✕</button>
            </div>

            <!-- Modal Body Split: Form & Formula Builder on Left, Excel Data Table on Right -->
            <div class="tpl-modal-body">
                <!-- Left Panel -->
                <div class="tpl-form-panel">
                    <!-- Field Selector Tabs -->
                    <div class="tpl-field-group">
                        <label class="tpl-label">
                            <span>Field to Bind / Edit</span>
                            <span style="font-size: 11px; color: #2563eb;">15 Formulas Supported</span>
                        </label>
                        <select id="tplFieldSelect" class="tpl-input">
                            <option value="value" ${currentActiveField === 'value' ? 'selected' : ''}>Value (Main Metric)</option>
                            <option value="label" ${currentActiveField === 'label' ? 'selected' : ''}>Label / Title</option>
                            <option value="subLabel" ${currentActiveField === 'subLabel' ? 'selected' : ''}>Sub-label / Subtitle</option>
                            <option value="badge" ${currentActiveField === 'badge' ? 'selected' : ''}>Badge / Category</option>
                            <option value="trendValue" ${currentActiveField === 'trendValue' ? 'selected' : ''}>Trend / Change</option>
                            ${category === 'sparkline' ? `<option value="dataPointsFormula" ${currentActiveField === 'dataPointsFormula' ? 'selected' : ''}>Sparkline Data Series (Range/Column)</option>` : ''}
                        </select>
                    </div>

                    <!-- Direct Raw Value / Formula Input -->
                    <div class="tpl-field-group">
                        <label class="tpl-label">
                            <span>Formula / Field Text</span>
                            <span id="tplFormulaIndicator" style="font-size: 11px; font-weight: 700; color: #059669; display: ${parsed.isFormula ? 'inline' : 'none'};">● LIVE FORMULA</span>
                        </label>
                        <input type="text" id="tplDirectInput" class="tpl-input" value="${escapeHtml(currentFieldValue)}" placeholder="e.g. =SUM(Sales, R, 'Total: ') or text" />
                    </div>

                    <!-- Formula Builder Tool -->
                    <div class="tpl-formula-builder-card">
                        <div class="tpl-builder-header">
                            <span>⚡ Formula Builder (15 Formulas)</span>
                            <button type="button" class="tpl-btn tpl-btn-primary" id="tplApplyFormulaBtn" style="padding: 4px 8px; font-size: 11px;">Insert into Field</button>
                        </div>

                        <!-- Function Selector -->
                        <div class="tpl-field-group">
                            <label class="tpl-label">
                                <span>Formula Function</span>
                                <span style="font-size: 10px; color: #64748b;">Choose calculation type</span>
                            </label>
                            <select id="tplFormulaFn" class="tpl-input" style="font-weight: 600; color: #1e40af;">
                                <optgroup label="1. Basic & Single-Cell">
                                    <option value="INSERT" ${initialFn === 'INSERT' ? 'selected' : ''}>=INSERT (Cell or Column)</option>
                                </optgroup>
                                <optgroup label="2. Aggregations & Math">
                                    <option value="SUM" ${initialFn === 'SUM' ? 'selected' : ''}>=SUM (Total Column / Range)</option>
                                    <option value="AVG" ${initialFn === 'AVG' ? 'selected' : ''}>=AVG (Average / Mean)</option>
                                    <option value="MAX" ${initialFn === 'MAX' ? 'selected' : ''}>=MAX (Peak Value)</option>
                                    <option value="MIN" ${initialFn === 'MIN' ? 'selected' : ''}>=MIN (Lowest Value)</option>
                                    <option value="COUNT" ${initialFn === 'COUNT' ? 'selected' : ''}>=COUNT (Row / Record Count)</option>
                                </optgroup>
                                <optgroup label="3. Growth & Comparison">
                                    <option value="GROWTH" ${initialFn === 'GROWTH' ? 'selected' : ''}>=GROWTH (MoM / YoY Growth %)</option>
                                    <option value="DIFF" ${initialFn === 'DIFF' ? 'selected' : ''}>=DIFF (Actual - Plan Variance)</option>
                                </optgroup>
                                <optgroup label="4. Target & Progress">
                                    <option value="PERCENT" ${initialFn === 'PERCENT' ? 'selected' : ''}>=PERCENT (0-100% Gauge / Progress)</option>
                                    <option value="REMAINING" ${initialFn === 'REMAINING' ? 'selected' : ''}>=REMAINING (Pending to Goal)</option>
                                </optgroup>
                                <optgroup label="5. Conditional & Status">
                                    <option value="STATUS" ${initialFn === 'STATUS' ? 'selected' : ''}>=STATUS (Alert / Threshold Badge)</option>
                                    <option value="IF" ${initialFn === 'IF' ? 'selected' : ''}>=IF (Conditional Logic)</option>
                                </optgroup>
                                <optgroup label="6. Time & Stream">
                                    <option value="LATEST" ${initialFn === 'LATEST' ? 'selected' : ''}>=LATEST (Most Recent Row)</option>
                                    <option value="TOP" ${initialFn === 'TOP' ? 'selected' : ''}>=TOP (Rank N Performer)</option>
                                </optgroup>
                                <optgroup label="7. Formatting & Currency">
                                    <option value="FORMAT" ${initialFn === 'FORMAT' ? 'selected' : ''}>=FORMAT (₹ INR / $ USD / % / Compact)</option>
                                </optgroup>
                            </select>
                        </div>

                        <!-- Target 1 Input -->
                        <div class="tpl-field-group">
                            <label class="tpl-label">
                                <span id="tplTarget1Label">1. Target Cell / Column</span>
                                <span style="font-size: 10px; color: #2563eb;">Click table cell ➔</span>
                            </label>
                            <input type="text" id="tplFormulaTarget" class="tpl-input tpl-target-active" value="${escapeHtml(initialTarget)}" placeholder="e.g. A4, B2:B10, or Sales" />
                        </div>

                        <!-- Target 2 Input (For GROWTH, DIFF, PERCENT, REMAINING, STATUS, TOP, FORMAT) -->
                        <div class="tpl-field-group" id="tplTarget2Group" style="display: none;">
                            <label class="tpl-label">
                                <span id="tplTarget2Label">2. Secondary Target</span>
                                <span style="font-size: 10px; color: #2563eb;">Click table cell ➔</span>
                            </label>
                            <input type="text" id="tplFormulaTarget2" class="tpl-input" value="${escapeHtml(initialTarget2)}" placeholder="e.g. B9 or 50000" />
                        </div>

                        <!-- Format Style Selector (For FORMAT) -->
                        <div class="tpl-field-group" id="tplFormatSelectGroup" style="display: none;">
                            <label class="tpl-label">
                                <span>Format Style</span>
                                <span style="font-size: 10px; color: #64748b;">Currency & Number Format</span>
                            </label>
                            <select id="tplFormatStyleSelect" class="tpl-input">
                                <option value="INR">INR (₹ Indian Rupees e.g. ₹4,82,500)</option>
                                <option value="USD">USD ($ US Dollars e.g. $48,250)</option>
                                <option value="EUR">EUR (€ Euros)</option>
                                <option value="GBP">GBP (£ British Pounds)</option>
                                <option value="PERCENT">PERCENT (% e.g. 78.5%)</option>
                                <option value="COMPACT">COMPACT (K / M / L / Cr)</option>
                                <option value="NUMBER">NUMBER (Comma Separated)</option>
                            </select>
                        </div>

                        <!-- Direction Toggle (R or L) -->
                        <div class="tpl-field-group" id="tplDirToggleContainer">
                            <label class="tpl-label">
                                <span>Direction (R or L)</span>
                                <span style="font-size: 10px; color: #64748b;">Where live data appears</span>
                            </label>
                            <div class="tpl-dir-toggle-group">
                                <button type="button" class="tpl-dir-btn ${initialDir === 'R' ? 'active' : ''}" id="tplDirBtnR" data-dir="R">
                                    <span>[ R ] Data on Right</span>
                                    <small>Text ➔ Live Data</small>
                                </button>
                                <button type="button" class="tpl-dir-btn ${initialDir === 'L' ? 'active' : ''}" id="tplDirBtnL" data-dir="L">
                                    <span>[ L ] Data on Left</span>
                                    <small>Live Data ➔ Text</small>
                                </button>
                            </div>
                        </div>

                        <!-- Custom User Text -->
                        <div class="tpl-field-group">
                            <label class="tpl-label">
                                <span id="tplFormulaTextLabel">Custom Text / Label</span>
                                <span style="font-size: 10px; color: #64748b;">Prefix / Suffix</span>
                            </label>
                            <input type="text" id="tplFormulaText" class="tpl-input" value="${escapeHtml(initialText)}" placeholder="e.g. sales, Total: , ₹" />
                        </div>

                        <!-- Extra Text Input (For STATUS FailText or IF FalseText) -->
                        <div class="tpl-field-group" id="tplExtraGroup" style="display: none;">
                            <label class="tpl-label">
                                <span id="tplExtraLabel">Fail / False Text</span>
                                <span style="font-size: 10px; color: #64748b;">When condition not met</span>
                            </label>
                            <input type="text" id="tplFormulaExtraInput" class="tpl-input" value="${escapeHtml(initialExtra)}" placeholder="e.g. Normal ✅, Fail ❌" />
                        </div>

                        <!-- Formula Dictionary & Guide -->
                        <div class="tpl-guide-box" id="tplGuideBox">
                            Loading formula documentation...
                        </div>

                        <!-- Live Evaluated Preview -->
                        <div class="tpl-preview-box">
                            <div class="tpl-preview-label">Live Evaluated Output</div>
                            <div class="tpl-preview-value" id="tplLivePreviewVal">Calculating...</div>
                            <div style="font-size: 11px; color: #64748b;" id="tplLivePreviewSource">Source: --</div>
                        </div>

                        <!-- Cheatsheet Accordion -->
                        <div class="tpl-cheatsheet-card">
                            <button type="button" class="tpl-cheatsheet-toggle-btn" id="tplToggleCheatsheetBtn">
                                <span>📖 All 15 Formulas Cheatsheet</span>
                                <span id="tplCheatArrow">▼</span>
                            </button>
                            <div class="tpl-cheatsheet-content" id="tplCheatContent" style="display: none;">
                                ${renderCheatsheetHtml()}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Right Panel: Interactive Excel-Style Data Table -->
                <div class="tpl-table-panel">
                    <!-- Table Toolbar -->
                    <div class="tpl-table-toolbar">
                        <div class="tpl-table-hint">
                            <span>🎯 Click cell/column to fill active target (indicated in blue)</span>
                            <span class="tpl-cell-badge" id="tplActiveCellBadge">A4</span>
                        </div>
                        <input type="text" id="tplTableSearch" class="tpl-input" style="width: 180px; padding: 4px 8px; font-size: 11px;" placeholder="Search table..." />
                    </div>

                    <!-- Scrollable Sheet Table -->
                    <div class="tpl-sheet-wrapper" id="tplSheetWrapper">
                        <table class="tpl-excel-table" id="tplExcelTable">
                            <!-- Table dynamically rendered -->
                        </table>
                    </div>

                    <!-- Pagination -->
                    <div class="tpl-pagination-bar">
                        <div class="tpl-page-info" id="tplPageInfo">Loading rows...</div>
                        <div class="tpl-btn-group">
                            <button type="button" class="tpl-btn" id="tplPrevPageBtn">◀ Previous</button>
                            <button type="button" class="tpl-btn" id="tplNextPageBtn">Next ▶</button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Modal Footer -->
            <div class="tpl-modal-footer">
                <button type="button" class="tpl-btn" id="tplCancelBtn">Cancel</button>
                <button type="button" class="tpl-btn tpl-btn-primary" id="tplSaveApplyBtn">💾 Save & Apply to Card</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    // Wire up events
    setupModalListeners(overlay);
    updateBuilderFormFields(initialFn);
    renderModalDataTable();
    updateLivePreview();
}

/**
 * Generates HTML list for the 15 formulas cheatsheet.
 */
function renderCheatsheetHtml(): string {
    const list: string[] = [];
    const keys = Object.keys(FORMULA_METAS) as FormulaFunctionType[];
    keys.forEach(k => {
        const m = FORMULA_METAS[k];
        list.push(`
            <div class="tpl-cheat-item">
                <div style="flex: 1; min-width: 0;">
                    <div style="font-weight: 700; color: #1e40af;">${m.label}</div>
                    <code style="font-size: 10px; color: #2563eb;">${escapeHtml(m.syntax)}</code>
                    <div style="font-size: 10px; color: #64748b; margin-top: 2px;">${escapeHtml(m.description)}</div>
                </div>
                <button type="button" class="tpl-cheat-load-btn" data-cheat-fn="${k}">Load ➔</button>
            </div>
        `);
    });
    return list.join('');
}

/**
 * Escapes HTML characters for safe input values.
 */
function escapeHtml(str: string): string {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

/**
 * Updates form labels, placeholders, and visibility according to selected function.
 */
function updateBuilderFormFields(fnType: FormulaFunctionType): void {
    const meta = FORMULA_METAS[fnType] || FORMULA_METAS.INSERT;

    const t1Label = document.getElementById('tplTarget1Label');
    const t1Input = document.getElementById('tplFormulaTarget') as HTMLInputElement;
    const t2Group = document.getElementById('tplTarget2Group');
    const t2Label = document.getElementById('tplTarget2Label');
    const t2Input = document.getElementById('tplFormulaTarget2') as HTMLInputElement;
    const formatGroup = document.getElementById('tplFormatSelectGroup');
    const dirContainer = document.getElementById('tplDirToggleContainer');
    const textLabel = document.getElementById('tplFormulaTextLabel');
    const textInput = document.getElementById('tplFormulaText') as HTMLInputElement;
    const extraGroup = document.getElementById('tplExtraGroup');
    const extraLabel = document.getElementById('tplExtraLabel');
    const extraInput = document.getElementById('tplFormulaExtraInput') as HTMLInputElement;
    const guideBox = document.getElementById('tplGuideBox');

    if (t1Label) t1Label.textContent = meta.t1Label;
    if (t1Input) t1Input.placeholder = meta.t1Placeholder;

    if (t2Group) {
        t2Group.style.display = meta.hasT2 ? 'block' : 'none';
        if (t2Label && meta.t2Label) t2Label.textContent = meta.t2Label;
        if (t2Input && meta.t2Placeholder) t2Input.placeholder = meta.t2Placeholder;
    }

    if (formatGroup) {
        formatGroup.style.display = meta.hasFormat ? 'block' : 'none';
    }

    if (dirContainer) {
        dirContainer.style.display = meta.hasDirection ? 'block' : 'none';
    }

    if (textLabel) textLabel.textContent = meta.textLabel;
    if (textInput) textInput.placeholder = meta.textPlaceholder;

    if (extraGroup) {
        extraGroup.style.display = meta.hasExtra ? 'block' : 'none';
        if (extraLabel && meta.extraLabel) extraLabel.textContent = meta.extraLabel;
        if (extraInput && meta.extraPlaceholder) extraInput.placeholder = meta.extraPlaceholder;
    }

    if (guideBox) {
        guideBox.innerHTML = `
            <strong>📖 ${escapeHtml(meta.label)}</strong><br />
            <code>${escapeHtml(meta.syntax)}</code><br />
            • <strong>Description:</strong> ${escapeHtml(meta.description)}<br />
            • <strong>Example:</strong> <code>${escapeHtml(meta.example)}</code>
        `;
    }
}

/**
 * Updates the live evaluated preview inside the modal based on direct input.
 */
function updateLivePreview(): void {
    const directInput = document.getElementById('tplDirectInput') as HTMLInputElement;
    const previewValEl = document.getElementById('tplLivePreviewVal');
    const previewSourceEl = document.getElementById('tplLivePreviewSource');

    if (!directInput || !previewValEl || !previewSourceEl) return;

    const formula = directInput.value.trim();
    if (!formula.startsWith('=')) {
        previewValEl.textContent = formula || '(Empty)';
        previewSourceEl.textContent = 'Direct Text Value';
        previewValEl.style.color = '';
        return;
    }

    const evalRes = evaluateFormula(formula);
    previewValEl.textContent = evalRes.display || '(Empty)';
    previewSourceEl.textContent = `Formula: ${formula} | ${evalRes.description || ''}`;

    if (evalRes.error) {
        previewValEl.style.color = '#dc2626';
    } else {
        previewValEl.style.color = '';
    }
}

/**
 * Synchronizes the builder values into the direct formula input.
 */
function syncBuilderToDirectInput(): void {
    const fnSelect = document.getElementById('tplFormulaFn') as HTMLSelectElement;
    const targetInput = document.getElementById('tplFormulaTarget') as HTMLInputElement;
    const target2Input = document.getElementById('tplFormulaTarget2') as HTMLInputElement;
    const formatSelect = document.getElementById('tplFormatStyleSelect') as HTMLSelectElement;
    const textInput = document.getElementById('tplFormulaText') as HTMLInputElement;
    const extraInput = document.getElementById('tplFormulaExtraInput') as HTMLInputElement;
    const activeDirBtn = document.querySelector('.tpl-dir-btn.active') as HTMLElement;
    const directInput = document.getElementById('tplDirectInput') as HTMLInputElement;
    const formulaIndicator = document.getElementById('tplFormulaIndicator');

    if (!fnSelect || !targetInput || !directInput) return;

    const fnType = (fnSelect.value || 'INSERT') as FormulaFunctionType;
    const target1 = targetInput.value.trim() || 'A1';
    const direction: 'R' | 'L' = (activeDirBtn?.dataset.dir === 'L') ? 'L' : 'R';
    const text = textInput ? textInput.value : '';

    let param2 = '';
    let param3 = '';
    let param4 = '';

    switch (fnType) {
        case 'INSERT':
        case 'SUM':
        case 'AVG':
        case 'MAX':
        case 'MIN':
        case 'COUNT':
        case 'LATEST':
            param2 = direction;
            param3 = text;
            break;
        case 'GROWTH':
        case 'DIFF':
        case 'PERCENT':
        case 'REMAINING':
            param2 = target2Input ? target2Input.value.trim() || 'A1' : 'A1';
            param3 = direction;
            param4 = text;
            break;
        case 'STATUS':
            param2 = target2Input ? target2Input.value.trim() || '80' : '80';
            param3 = text || 'Pass';
            param4 = extraInput ? extraInput.value || 'Fail' : 'Fail';
            break;
        case 'IF':
            param2 = text || 'True';
            param3 = extraInput ? extraInput.value || 'False' : 'False';
            break;
        case 'TOP':
            param2 = target2Input ? target2Input.value.trim() || '1' : '1';
            param3 = direction;
            param4 = text;
            break;
        case 'FORMAT':
            param2 = formatSelect ? formatSelect.value : (target2Input?.value.trim() || 'INR');
            param3 = direction;
            param4 = text;
            break;
    }

    const formula = buildFormulaString(fnType, target1, param2, param3, param4);
    directInput.value = formula;
    if (formulaIndicator) formulaIndicator.style.display = 'inline';
    updateLivePreview();
}

/**
 * Sets up interactive event listeners for the modal.
 */
function setupModalListeners(overlay: HTMLElement): void {
    const close = () => overlay.remove();

    // Close buttons
    document.getElementById('tplModalCloseX')?.addEventListener('click', close);
    document.getElementById('tplCancelBtn')?.addEventListener('click', close);

    // Backdrop click close
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) close();
    });

    const fieldSelect = document.getElementById('tplFieldSelect') as HTMLSelectElement;
    const directInput = document.getElementById('tplDirectInput') as HTMLInputElement;
    const formulaIndicator = document.getElementById('tplFormulaIndicator');
    const fnSelect = document.getElementById('tplFormulaFn') as HTMLSelectElement;
    const t1Input = document.getElementById('tplFormulaTarget') as HTMLInputElement;
    const t2Input = document.getElementById('tplFormulaTarget2') as HTMLInputElement;
    const formatSelect = document.getElementById('tplFormatStyleSelect') as HTMLSelectElement;
    const textInput = document.getElementById('tplFormulaText') as HTMLInputElement;
    const extraInput = document.getElementById('tplFormulaExtraInput') as HTMLInputElement;

    const updateTargetFocusStyles = () => {
        t1Input?.classList.toggle('tpl-target-active', lastFocusedTargetId === 'tplFormulaTarget');
        t2Input?.classList.toggle('tpl-target-active', lastFocusedTargetId === 'tplFormulaTarget2');
    };

    t1Input?.addEventListener('focus', () => {
        lastFocusedTargetId = 'tplFormulaTarget';
        updateTargetFocusStyles();
    });
    t1Input?.addEventListener('click', () => {
        lastFocusedTargetId = 'tplFormulaTarget';
        updateTargetFocusStyles();
    });

    t2Input?.addEventListener('focus', () => {
        lastFocusedTargetId = 'tplFormulaTarget2';
        updateTargetFocusStyles();
    });
    t2Input?.addEventListener('click', () => {
        lastFocusedTargetId = 'tplFormulaTarget2';
        updateTargetFocusStyles();
    });

    // Function dropdown change
    fnSelect?.addEventListener('change', () => {
        const chosenFn = (fnSelect.value || 'INSERT') as FormulaFunctionType;
        updateBuilderFormFields(chosenFn);
        syncBuilderToDirectInput();
    });

    // Field Selector change
    fieldSelect?.addEventListener('change', () => {
        currentActiveField = fieldSelect.value;
        const currentVal = currentChartConfig.formulas[currentActiveField] || currentChartConfig[currentActiveField] || '';
        directInput.value = currentVal;

        const parsed = parseFormula(currentVal);
        if (formulaIndicator) {
            formulaIndicator.style.display = parsed.isFormula ? 'inline' : 'none';
        }

        if (parsed.isFormula) {
            if (fnSelect) fnSelect.value = parsed.fnType;
            updateBuilderFormFields(parsed.fnType);
            if (t1Input) t1Input.value = parsed.target;
            if (t2Input && parsed.args.length >= 2) t2Input.value = parsed.args[1];
            if (textInput) textInput.value = parsed.text;
            if (extraInput && parsed.args.length >= 4) extraInput.value = parsed.args[3];

            document.querySelectorAll('.tpl-dir-btn').forEach(btn => {
                btn.classList.toggle('active', btn.getAttribute('data-dir') === parsed.direction);
            });
        }
        updateLivePreview();
    });

    // Direct input change
    directInput?.addEventListener('input', () => {
        const val = directInput.value;
        const parsed = parseFormula(val);
        if (formulaIndicator) {
            formulaIndicator.style.display = parsed.isFormula ? 'inline' : 'none';
        }
        if (parsed.isFormula) {
            if (fnSelect && fnSelect.value !== parsed.fnType) {
                fnSelect.value = parsed.fnType;
                updateBuilderFormFields(parsed.fnType);
            }
            if (t1Input) t1Input.value = parsed.target;
            if (t2Input && parsed.args.length >= 2) t2Input.value = parsed.args[1];
            if (textInput) textInput.value = parsed.text;
            if (extraInput && parsed.args.length >= 4) extraInput.value = parsed.args[3];

            document.querySelectorAll('.tpl-dir-btn').forEach(btn => {
                btn.classList.toggle('active', btn.getAttribute('data-dir') === parsed.direction);
            });
        }
        updateLivePreview();
    });

    // Direction buttons
    document.querySelectorAll('.tpl-dir-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tpl-dir-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            syncBuilderToDirectInput();
        });
    });

    // Inputs change -> sync
    t1Input?.addEventListener('input', syncBuilderToDirectInput);
    t2Input?.addEventListener('input', syncBuilderToDirectInput);
    formatSelect?.addEventListener('change', syncBuilderToDirectInput);
    textInput?.addEventListener('input', syncBuilderToDirectInput);
    extraInput?.addEventListener('input', syncBuilderToDirectInput);

    // Apply Formula into Field button
    document.getElementById('tplApplyFormulaBtn')?.addEventListener('click', () => {
        syncBuilderToDirectInput();
        showMessage(`Formula ${directInput.value} placed into ${currentActiveField}!`, 'info');
    });

    // Cheatsheet toggle button
    const cheatToggleBtn = document.getElementById('tplToggleCheatsheetBtn');
    const cheatContent = document.getElementById('tplCheatContent');
    const cheatArrow = document.getElementById('tplCheatArrow');

    cheatToggleBtn?.addEventListener('click', () => {
        isCheatsheetOpen = !isCheatsheetOpen;
        if (cheatContent) cheatContent.style.display = isCheatsheetOpen ? 'flex' : 'none';
        if (cheatArrow) cheatArrow.textContent = isCheatsheetOpen ? '▲' : '▼';
    });

    // Cheatsheet load button clicks
    overlay.querySelectorAll<HTMLButtonElement>('.tpl-cheat-load-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const fn = btn.dataset.cheatFn as FormulaFunctionType;
            if (fn && FORMULA_METAS[fn]) {
                if (fnSelect) fnSelect.value = fn;
                updateBuilderFormFields(fn);
                const meta = FORMULA_METAS[fn];
                if (t1Input) t1Input.value = meta.t1Placeholder.replace(/^e\.g\.\s*/, '').split(',')[0].trim();
                if (t2Input && meta.t2Placeholder) t2Input.value = meta.t2Placeholder.replace(/^e\.g\.\s*/, '').split(',')[0].trim();
                if (textInput) textInput.value = meta.textPlaceholder.replace(/^e\.g\.\s*/, '').split(',')[0].trim();
                if (extraInput && meta.extraPlaceholder) extraInput.value = meta.extraPlaceholder.replace(/^e\.g\.\s*/, '').split(',')[0].trim();
                syncBuilderToDirectInput();
                showMessage(`Loaded ${fn} template into builder!`, 'info');
            }
        });
    });

    // Search input
    const searchInput = document.getElementById('tplTableSearch') as HTMLInputElement;
    searchInput?.addEventListener('input', () => {
        modalSearchTerm = searchInput.value.trim().toLowerCase();
        modalPage = 1;
        renderModalDataTable();
    });

    // Pagination
    document.getElementById('tplPrevPageBtn')?.addEventListener('click', () => {
        if (modalPage > 1) {
            modalPage--;
            renderModalDataTable();
        }
    });

    document.getElementById('tplNextPageBtn')?.addEventListener('click', () => {
        modalPage++;
        renderModalDataTable();
    });

    // Save & Apply button
    document.getElementById('tplSaveApplyBtn')?.addEventListener('click', async () => {
        const directVal = directInput.value.trim();
        const parsed = parseFormula(directVal);

        if (parsed.isFormula) {
            currentChartConfig.formulas[currentActiveField] = directVal;
        } else {
            delete currentChartConfig.formulas[currentActiveField];
            currentChartConfig[currentActiveField] = directVal;
        }

        // Apply all formulas to chartConfig
        applyFormulasToCardConfig(currentChartConfig);

        // Re-render the template card container
        const container = document.getElementById(`container-${currentChartConfig.id}`);
        if (container) {
            renderTemplateCard(container, currentChartConfig);
        }

        await saveDashboardSettings();
        showMessage(`Card updated successfully!`, 'success');
        close();
    });
}

/**
 * Renders the Google Sheets / Excel style interactive table inside the modal.
 */
function renderModalDataTable(): void {
    const tableEl = document.getElementById('tplExcelTable');
    const pageInfoEl = document.getElementById('tplPageInfo');
    const prevBtn = document.getElementById('tplPrevPageBtn') as HTMLButtonElement;
    const nextBtn = document.getElementById('tplNextPageBtn') as HTMLButtonElement;
    const activeBadge = document.getElementById('tplActiveCellBadge');

    if (!tableEl) return;

    const data = (filteredData && filteredData.length > 0) ? filteredData : (rawData || []);
    const cols = (headers && headers.length > 0) ? headers : (data.length > 0 ? Object.keys(data[0]) : []);

    if (cols.length === 0 || data.length === 0) {
        tableEl.innerHTML = `<tr><td style="padding: 24px; text-align: center; color: #64748b;">No data rows available in active table.</td></tr>`;
        if (pageInfoEl) pageInfoEl.textContent = '0 rows';
        return;
    }

    // Filter data by search term if active
    let displayRows = data;
    if (modalSearchTerm) {
        displayRows = data.filter(row => {
            return cols.some(c => String(row[c] ?? '').toLowerCase().includes(modalSearchTerm));
        });
    }

    const totalRows = displayRows.length;
    const totalPages = Math.max(1, Math.ceil(totalRows / MODAL_ROWS_PER_PAGE));
    modalPage = Math.max(1, Math.min(modalPage, totalPages));

    const startIdx = (modalPage - 1) * MODAL_ROWS_PER_PAGE;
    const endIdx = Math.min(totalRows, startIdx + MODAL_ROWS_PER_PAGE);
    const pageRows = displayRows.slice(startIdx, endIdx);

    if (pageInfoEl) {
        pageInfoEl.textContent = `Showing rows ${totalRows === 0 ? 0 : startIdx + 1}–${endIdx} of ${totalRows} (Page ${modalPage}/${totalPages})`;
    }
    if (prevBtn) prevBtn.disabled = modalPage <= 1;
    if (nextBtn) nextBtn.disabled = modalPage >= totalPages;

    // 1. Column letters row (A, B, C, D...)
    let lettersHeaderHtml = `<tr class="tpl-col-letters-row"><th class="tpl-col-letter-th" style="width: 44px;">#</th>`;
    cols.forEach((_, idx) => {
        lettersHeaderHtml += `<th class="tpl-col-letter-th">${indexToColumnLabel(idx)}</th>`;
    });
    lettersHeaderHtml += `</tr>`;

    // 2. Column names row (Sales, Region, etc.)
    let namesHeaderHtml = `<tr class="tpl-col-names-row"><th class="tpl-col-name-th" style="width: 44px;"></th>`;
    cols.forEach((colName, idx) => {
        namesHeaderHtml += `<th class="tpl-col-name-th" data-col-idx="${idx}" data-col-name="${escapeHtml(colName)}" title="Click to select column ${colName}">${escapeHtml(colName)}</th>`;
    });
    namesHeaderHtml += `</tr>`;

    // 3. Data rows
    let bodyRowsHtml = '';
    pageRows.forEach((row, rIdx) => {
        const absoluteRowNum = startIdx + rIdx + 1; // 1-indexed for Excel
        bodyRowsHtml += `<tr><td class="tpl-row-num-td">${absoluteRowNum}</td>`;

        cols.forEach((colName, cIdx) => {
            const cellVal = row[colName];
            const displayVal = cellVal !== undefined && cellVal !== null ? String(cellVal) : '';
            const colLetter = indexToColumnLabel(cIdx);
            const address = `${colLetter}${absoluteRowNum}`;
            const isSelected = address === selectedCellAddress;

            bodyRowsHtml += `
                <td class="tpl-data-td ${isSelected ? 'selected' : ''}" 
                    data-address="${address}" 
                    data-col-letter="${colLetter}" 
                    data-col-name="${escapeHtml(colName)}"
                    data-row-num="${absoluteRowNum}"
                    title="Cell ${address} (${colName}): ${escapeHtml(displayVal)}">
                    ${escapeHtml(displayVal)}
                </td>
            `;
        });
        bodyRowsHtml += `</tr>`;
    });

    tableEl.innerHTML = `<thead>${lettersHeaderHtml}${namesHeaderHtml}</thead><tbody>${bodyRowsHtml}</tbody>`;

    // Wire up cell click & column click
    tableEl.querySelectorAll<HTMLElement>('.tpl-data-td').forEach(td => {
        td.addEventListener('click', (e) => {
            const address = td.dataset.address;
            if (!address) return;

            const target2El = document.getElementById('tplFormulaTarget2') as HTMLInputElement;
            const isT2Active = lastFocusedTargetId === 'tplFormulaTarget2' && target2El && target2El.offsetParent !== null;
            const targetInput = isT2Active ? target2El : (document.getElementById('tplFormulaTarget') as HTMLInputElement);

            // Handle Shift+Click range selection
            if (e.shiftKey && selectionStartCell) {
                const rangeStr = `${selectionStartCell}:${address}`;
                selectedCellAddress = rangeStr;
                if (targetInput) targetInput.value = rangeStr;
                if (activeBadge) activeBadge.textContent = rangeStr;
                syncBuilderToDirectInput();
                return;
            }

            selectionStartCell = address;
            selectedCellAddress = address;
            tableEl.querySelectorAll('.tpl-data-td').forEach(c => c.classList.remove('selected'));
            td.classList.add('selected');

            if (activeBadge) activeBadge.textContent = address;

            if (targetInput) {
                targetInput.value = address;
                syncBuilderToDirectInput();
            }
        });
    });

    // Column header click to select column by name or letter
    tableEl.querySelectorAll<HTMLElement>('.tpl-col-name-th').forEach(th => {
        th.addEventListener('click', () => {
            const colName = th.dataset.colName;
            if (!colName) return;

            const target2El = document.getElementById('tplFormulaTarget2') as HTMLInputElement;
            const isT2Active = lastFocusedTargetId === 'tplFormulaTarget2' && target2El && target2El.offsetParent !== null;
            const targetInput = isT2Active ? target2El : (document.getElementById('tplFormulaTarget') as HTMLInputElement);

            if (targetInput) {
                targetInput.value = colName;
                if (activeBadge) activeBadge.textContent = `Col: ${colName}`;
                syncBuilderToDirectInput();
            }
        });
    });
}
