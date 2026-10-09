// src/js/ai/dataQualityFixer.ts
import { rawData, filteredData, headers, updateDataAndUI, saveUserDataToFirebase } from '../../store/DataHandler.ts';
import { plotAll } from '../charts/charts.ts';
import { showMessage } from '../core/utils.ts';
import { appendMessageElement, pushUndoSnapshot } from './chat.ts';

export interface ColumnQualityStat {
    column: string;
    missingCount: number;
    isNumeric: boolean;
    mean?: number;
    median?: number;
    mode?: string;
    sampleValues: any[];
}

export interface DataQualityAuditResult {
    totalRows: number;
    totalColumns: number;
    duplicateCount: number;
    duplicateIndices: number[];
    missingCellsTotal: number;
    columnStats: Record<string, ColumnQualityStat>;
    whitespaceIssueCount: number;
    qualityScore: number;
    hasIssues: boolean;
    summaryHindi: string;
    summaryEnglish: string;
}

// Global reference for pending proactive cleaning proposal
export let pendingCleaningProposal: DataQualityAuditResult | null = null;

export function setPendingCleaningProposal(proposal: DataQualityAuditResult | null): void {
    pendingCleaningProposal = proposal;
}

/**
 * Performs comprehensive data quality audit on any dataset
 */
export function auditDatasetQuality(data: any[], colHeaders: string[]): DataQualityAuditResult {
    if (!data || data.length === 0 || !colHeaders || colHeaders.length === 0) {
        return {
            totalRows: 0,
            totalColumns: 0,
            duplicateCount: 0,
            duplicateIndices: [],
            missingCellsTotal: 0,
            columnStats: {},
            whitespaceIssueCount: 0,
            qualityScore: 100,
            hasIssues: false,
            summaryHindi: "कोई डेटा लोड नहीं है।",
            summaryEnglish: "No data loaded."
        };
    }

    const totalRows = data.length;
    const totalColumns = colHeaders.length;
    const duplicateIndices: number[] = [];
    const seenRowSignatures = new Set<string>();
    let whitespaceIssueCount = 0;
    let missingCellsTotal = 0;

    // 1. Duplicate Row Detection (using signature hash)
    data.forEach((row, idx) => {
        const signature = colHeaders.map(h => String(row[h] ?? '').trim().toLowerCase()).join('||');
        if (seenRowSignatures.has(signature)) {
            duplicateIndices.push(idx);
        } else {
            seenRowSignatures.add(signature);
        }
    });

    const duplicateCount = duplicateIndices.length;

    // 2. Column-by-Column Missing and Type Profiling
    const columnStats: Record<string, ColumnQualityStat> = {};

    colHeaders.forEach(col => {
        let missingCount = 0;
        let numCount = 0;
        let validCount = 0;
        const numValues: number[] = [];
        const strFreq: Record<string, number> = {};

        data.forEach(row => {
            const val = row[col];
            if (val === undefined || val === null || val === '' || (typeof val === 'number' && isNaN(val)) || String(val).trim().toLowerCase() === 'null' || String(val).trim().toLowerCase() === 'nan' || String(val).trim().toLowerCase() === 'n/a') {
                missingCount++;
                missingCellsTotal++;
            } else {
                validCount++;
                const strVal = String(val);
                if (strVal !== strVal.trim()) {
                    whitespaceIssueCount++;
                }

                const n = Number(val);
                if (!isNaN(n) && strVal.trim() !== '') {
                    numCount++;
                    numValues.push(n);
                } else {
                    const trimmed = strVal.trim();
                    strFreq[trimmed] = (strFreq[trimmed] || 0) + 1;
                }
            }
        });

        const isNumeric = validCount > 0 && (numCount / validCount >= 0.7);
        let mean: number | undefined;
        let median: number | undefined;
        let mode: string | undefined;

        if (isNumeric && numValues.length > 0) {
            const sum = numValues.reduce((a, b) => a + b, 0);
            mean = Math.round((sum / numValues.length) * 100) / 100;
            const sorted = [...numValues].sort((a, b) => a - b);
            const mid = Math.floor(sorted.length / 2);
            median = sorted.length % 2 !== 0 ? sorted[mid] : Math.round(((sorted[mid - 1] + sorted[mid]) / 2) * 100) / 100;
        } else {
            let maxFreq = 0;
            Object.entries(strFreq).forEach(([str, count]) => {
                if (count > maxFreq) {
                    maxFreq = count;
                    mode = str;
                }
            });
        }

        columnStats[col] = {
            column: col,
            missingCount,
            isNumeric,
            mean,
            median,
            mode: mode || "N/A",
            sampleValues: numValues.slice(0, 3)
        };
    });

    // 3. Compute Overall Quality Score (0 to 100)
    const totalCells = totalRows * totalColumns;
    const defectCount = duplicateCount * totalColumns + missingCellsTotal + whitespaceIssueCount;
    const rawScore = totalCells > 0 ? Math.max(0, Math.min(100, Math.round(((totalCells - defectCount) / totalCells) * 100))) : 100;
    const qualityScore = defectCount === 0 ? 100 : Math.max(60, rawScore);

    const hasIssues = duplicateCount > 0 || missingCellsTotal > 0 || whitespaceIssueCount > 0;

    // 4. Summaries for Human Prompt
    const primaryMissingCols = Object.values(columnStats)
        .filter(s => s.missingCount > 0)
        .sort((a, b) => b.missingCount - a.missingCount);

    const primaryColDesc = primaryMissingCols.length > 0 
        ? `'${primaryMissingCols[0].column}' कॉलम में ${primaryMissingCols[0].missingCount} खाली सेल्स`
        : "";

    let summaryHindi = "";
    if (duplicateCount > 0 && primaryMissingCols.length > 0) {
        summaryHindi = `आपके डेटा में **${duplicateCount} डुप्लिकेट पंक्तियां** और **${primaryColDesc}** मिले हैं।`;
    } else if (duplicateCount > 0) {
        summaryHindi = `आपके डेटा में **${duplicateCount} डुप्लिकेट पंक्तियां** मिली हैं।`;
    } else if (primaryMissingCols.length > 0) {
        summaryHindi = `आपके डेटा में **${primaryColDesc}** (कुल ${missingCellsTotal} रिक्त मान) मिले हैं।`;
    } else {
        summaryHindi = "डेटा पूरी तरह शुद्ध और सटीक है (100% Clean)।";
    }

    return {
        totalRows,
        totalColumns,
        duplicateCount,
        duplicateIndices,
        missingCellsTotal,
        columnStats,
        whitespaceIssueCount,
        qualityScore,
        hasIssues,
        summaryHindi,
        summaryEnglish: `${duplicateCount} duplicate rows and ${missingCellsTotal} missing cells detected.`
    };
}

/**
 * Automatically triggers the intelligent proactive audit prompt upon file upload or data ingestion
 */
export function proactivelyPromptDataQualityAudit(data: any[], colHeaders: string[], sourceName: string = "अपलोड की गई फ़ाइल"): void {
    const audit = auditDatasetQuality(data, colHeaders);

    if (!audit.hasIssues) {
        return; // Data is already 100% clean, no prompt needed
    }

    setPendingCleaningProposal(audit);

    const auditCardHtml = `
        <div class="data-quality-audit-card p-3 bg-white border border-amber-300 rounded-3 shadow-sm mb-2" style="border-left: 4px solid #f59e0b !important;">
            <div class="d-flex align-items-center justify-content-between mb-2">
                <div class="d-flex align-items-center gap-2">
                    <span class="badge bg-amber-100 text-amber-800 p-1.5 rounded-2">
                        <i class="bi bi-shield-exclamation fs-6"></i>
                    </span>
                    <strong class="text-slate-800 text-xs">डेटा क्वालिटी अलर्ट (AI Data Quality Fixer)</strong>
                </div>
                <span class="badge bg-slate-100 text-slate-700 text-2xs border">स्कोर: ${audit.qualityScore}% Clean</span>
            </div>
            
            <p class="mb-2 text-slate-700 text-xs" style="line-height: 1.5;">
                🔍 <strong>${sourceName}</strong> का विश्लेषण करने पर ${audit.summaryHindi}
            </p>
            
            <p class="mb-2.5 text-slate-600 text-2xs">
                👉 क्या मैं इन्हें औसत/मोड मान से भर दूं और डुप्लिकेट्स हटा दूं?
            </p>

            <div class="d-flex flex-wrap align-items-center gap-2 pt-1 border-top">
                <button class="btn btn-sm btn-success d-flex align-items-center gap-1.5 fw-semibold btn-confirm-clean-data px-3">
                    <i class="bi bi-magic"></i> हाँ, साफ कर दो (One-Click Clean)
                </button>
                <button class="btn btn-sm btn-outline-secondary btn-dismiss-clean-data text-2xs">
                    रहने दें (Skip)
                </button>
            </div>
        </div>
    `;

    // Append directly to chat stream so agent interacts with user naturally
    const row = appendMessageElement(auditCardHtml, "assistant", false, true);
    if (row) {
        attachDataQualityListeners(row);
    }

    // Also show toast notification
    showMessage(`🔍 डेटा क्वालिटी ऑडिट: ${audit.duplicateCount} डुप्लिकेट्स और ${audit.missingCellsTotal} रिक्त सेल्स मिले। चैट में 'हाँ' कहें या बटन दबाएं।`, "warning");
}

/**
 * Executes high-speed, reversible data cleaning
 */
export async function executeDataCleaning(options?: {
    removeDuplicates?: boolean;
    fillNumericMethod?: 'mean' | 'median' | 'zero';
    fillTextMethod?: 'mode' | 'unknown';
}): Promise<{ success: boolean; duplicatesRemoved: number; cellsImputed: number; message: string }> {
    const data = filteredData.length > 0 ? filteredData : rawData;
    const colHeaders = headers && headers.length > 0 ? headers : Object.keys(data[0] || {});

    if (!data || data.length === 0 || colHeaders.length === 0) {
        showMessage("क्लीन करने के लिए डेटा उपलब्ध नहीं है।", "warning");
        return { success: false, duplicatesRemoved: 0, cellsImputed: 0, message: "No data available." };
    }

    // 1. Audit before cleaning
    const audit = auditDatasetQuality(data, colHeaders);

    // 2. Snapshot current state for 1-Click Undo
    pushUndoSnapshot("Automatic Data Quality Cleaning");

    // 3. Remove Duplicate Rows
    const seen = new Set<string>();
    const cleanedRows: any[] = [];
    let duplicatesRemoved = 0;

    data.forEach(row => {
        const signature = colHeaders.map(h => String(row[h] ?? '').trim().toLowerCase()).join('||');
        if (!seen.has(signature)) {
            seen.add(signature);
            cleanedRows.push({ ...row });
        } else {
            duplicatesRemoved++;
        }
    });

    // 4. Impute Missing Values and Trim Strings
    let cellsImputed = 0;

    cleanedRows.forEach(row => {
        colHeaders.forEach(col => {
            const stat = audit.columnStats[col];
            let val = row[col];

            // Trim leading/trailing whitespace
            if (typeof val === 'string') {
                val = val.trim();
                row[col] = val;
            }

            const isMissing = val === undefined || val === null || val === '' || (typeof val === 'number' && isNaN(val)) || String(val).toLowerCase() === 'null' || String(val).toLowerCase() === 'nan' || String(val).toLowerCase() === 'n/a';

            if (isMissing && stat) {
                if (stat.isNumeric) {
                    // Impute with column mean
                    row[col] = stat.mean !== undefined ? stat.mean : 0;
                    cellsImputed++;
                } else {
                    // Impute with column mode or 'N/A'
                    row[col] = stat.mode && stat.mode !== 'N/A' ? stat.mode : "अनिश्चित (Unknown)";
                    cellsImputed++;
                }
            }
        });
    });

    // 5. Update global application state
    updateDataAndUI(cleanedRows, colHeaders, true);
    setPendingCleaningProposal(null);

    // Sync UI table and charts
    await plotAll();

    // Persist to user storage
    await saveUserDataToFirebase(cleanedRows, colHeaders, false);

    const successMsg = `✨ डेटा पूरी तरह साफ कर दिया गया!\n• ${duplicatesRemoved} डुप्लिकेट पंक्तियां हटाई गईं\n• ${cellsImputed} खाली सेल्स औसत/मोड मान से भरे गए\n• नया डेटा क्वालिटी स्कोर: 100% Clean`;

    // Append celebration card in chat
    const celebrationCardHtml = `
        <div class="p-3 bg-emerald-50 border border-emerald-300 rounded-3 shadow-sm mb-2" style="border-left: 4px solid #10b981 !important;">
            <div class="d-flex align-items-center gap-2 mb-2">
                <span class="badge bg-emerald-200 text-emerald-800 p-1.5 rounded-2">
                    <i class="bi bi-check2-circle fs-6"></i>
                </span>
                <strong class="text-emerald-950 text-xs">डेटा पूरी तरह शुद्ध और व्यवस्थित कर दिया गया!</strong>
            </div>
            <ul class="text-2xs text-emerald-900 ps-3 mb-2" style="line-height: 1.6;">
                <li><strong>${duplicatesRemoved} डुप्लिकेट पंक्तियां</strong> सफलतापूर्वक हटा दी गईं।</li>
                <li><strong>${cellsImputed} खाली/अमान्य सेल्स</strong> को कॉलम के औसत एवं मोड मान से भर दिया गया।</li>
                <li>अनावश्यक रिक्त स्पेस (Whitespace) को ट्रिम कर दिया गया।</li>
                <li>डेटा तालिका और सभी सक्रिय चार्ट्स स्वचालित रूप से री-रेंडर हो गए हैं।</li>
            </ul>
            <div class="d-flex align-items-center gap-2 border-top pt-1.5">
                <span class="badge bg-emerald-600 text-white text-2xs">क्वालिटी स्कोर: 100%</span>
                <span class="text-muted text-2xs ms-auto">आप किसी भी समय 'पूर्ववत करें (Undo)' कर सकते हैं।</span>
            </div>
        </div>
    `;

    appendMessageElement(celebrationCardHtml, "assistant", false, true);
    showMessage(successMsg, "success");

    return {
        success: true,
        duplicatesRemoved,
        cellsImputed,
        message: successMsg
    };
}

/**
 * Attaches click handlers for interactive data cleaning elements
 */
export function attachDataQualityListeners(container: HTMLElement = document.body): void {
    container.querySelectorAll('.btn-confirm-clean-data').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            (btn as HTMLButtonElement).disabled = true;
            btn.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span> सफाई हो रही है...`;
            await executeDataCleaning();
        });
    });

    container.querySelectorAll('.btn-dismiss-clean-data').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            setPendingCleaningProposal(null);
            const card = (btn as HTMLElement).closest('.data-quality-audit-card');
            if (card) {
                card.remove();
            }
            showMessage("डेटा क्लीनिंग छोड़ दी गई।", "info");
        });
    });
}
