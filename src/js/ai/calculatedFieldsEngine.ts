// src/js/ai/calculatedFieldsEngine.ts
import { rawData, filteredData, headers, currentDataForChat, saveDashboardSettings } from '../../store/DataHandler.ts';
import { updateTableAndUI, updateControls } from '../../store/UIHandler.js';
import { addVisualization, clearDataCache, plotChart, plotAll, visualizations } from '../charts/charts.ts';
import { showMessage, escapeHtml } from '../core/utils.ts';

export interface CalculatedFieldResult {
    success: boolean;
    columnName: string;
    formula: string;
    sampleValues: number[];
    message: string;
    affectedChartsCount: number;
    html?: string;
}

/**
 * Parses conversational calculated field requests such as:
 * - "Sales - Cost = Profit"
 * - "Profit = Sales - Cost"
 * - "Price * Quantity = TotalRevenue"
 * - "Sales - Cost as Profit"
 * - "Calculate Sales - Cost = Profit"
 * - "Create AI calculated field: Sales - Cost = Profit"
 */
export function parseCalculatedFieldRequest(input: string): { columnName: string; formula: string } | null {
    if (!input) return null;
    let text = input.trim();

    // Remove common prompt prefixes
    text = text.replace(/^(please\s+|can\s+you\s+|agent\s+|ai\s+|vedra\s+)?(calculate\s+field|create\s+ai\s+calculated\s+field|create\s+calculated\s+field|ai\s+calculated\s+field|calculated\s+field|calculate|create\s+field|create\s+column|add\s+calculated\s+field|add\s+column|new\s+column|compute|make\s+column|कॉलम\s+बनाओ|नया\s+कॉलम|गणना\s+करो)[\s:]*/i, '').trim();

    // 1. Equal Sign Pattern: "Sales - Cost = Profit" OR "Profit = Sales - Cost"
    const eqIdx = text.indexOf('=');
    if (eqIdx !== -1) {
        let left = text.substring(0, eqIdx).trim();
        let right = text.substring(eqIdx + 1).trim();

        // Strip conversational suffixes like "please", "create this", "do this"
        left = left.replace(/\s+(please|create\s+this|calculate\s+this|do\s+this|now).*$/i, '').trim();
        right = right.replace(/\s+(please|create\s+this|calculate\s+this|do\s+this|now|नया\s+कॉलम|बनाओ).*$/i, '').trim();

        const hasOperators = (str: string) => /[\+\-\*\/\(\)]/.test(str);

        let colName = '';
        let formula = '';

        if (hasOperators(left) && !hasOperators(right)) {
            // Expression on Left, Column Name on Right: "Sales - Cost = Profit"
            colName = right;
            formula = left;
        } else if (!hasOperators(left) && hasOperators(right)) {
            // Column Name on Left, Expression on Right: "Profit = Sales - Cost"
            colName = left;
            formula = right;
        } else {
            // Disambiguate by word count: single identifier is column name
            const leftWords = left.split(/\s+/).length;
            const rightWords = right.split(/\s+/).length;
            if (leftWords > rightWords) {
                colName = right;
                formula = left;
            } else {
                colName = left;
                formula = right;
            }
        }

        colName = colName.replace(/^[\[\(\s]+|[\]\)\s]+$/g, '').trim();
        if (colName && formula) {
            return { columnName: colName, formula };
        }
    }

    // 2. "AS" or "->" Pattern: "Sales - Cost as Profit" or "Sales - Cost -> Profit"
    const asMatch = text.match(/^(.+?)\s+(?:as|->|to|into)\s+([a-zA-Z0-9_\u0900-\u097F]+)$/i);
    if (asMatch) {
        const formula = asMatch[1].trim();
        const colName = asMatch[2].replace(/^[\[\(\s]+|[\]\)\s]+$/g, '').trim();
        if (colName && formula) {
            return { columnName: colName, formula };
        }
    }

    // 3. Natural Language Subtraction: "Sales और Cost को घटाकर Profit का नया कॉलम बनाओ"
    const subMatch = text.match(/([a-zA-Z0-9_\u0900-\u097F]+)\s*(?:और|and|-|\s+)\s*([a-zA-Z0-9_\u0900-\u097F]+)\s*(?:को घटाकर|घटाकर|माइनस|subtract|minus)\s*([a-zA-Z0-9_\u0900-\u097F]+)/i);
    if (subMatch) {
        const colA = subMatch[1].trim();
        const colB = subMatch[2].trim();
        const newCol = subMatch[3].replace(/का नया कॉलम|कॉलम|बनाओ|नया/gi, '').trim() || "Difference";
        return {
            columnName: newCol,
            formula: `[${colA}] - [${colB}]`
        };
    }

    // 4. Natural Language Addition: "Sales और Profit को जोड़कर ... बनाओ"
    const addMatch = text.match(/([a-zA-Z0-9_\u0900-\u097F]+)\s*(?:और|and|\+)\s*([a-zA-Z0-9_\u0900-\u097F]+)\s*(?:को जोड़कर|जोड़कर|प्लस|add|plus)\s*([a-zA-Z0-9_\u0900-\u097F]+)/i);
    if (addMatch) {
        const colA = addMatch[1].trim();
        const colB = addMatch[2].trim();
        const newCol = addMatch[3].replace(/का नया कॉलम|कॉलम|बनाओ|नया/gi, '').trim() || "Total_Sum";
        return {
            columnName: newCol,
            formula: `[${colA}] + [${colB}]`
        };
    }

    return null;
}

/**
 * Programmatically appends a new calculated column to the dataset and automatically
 * refreshes any affected charts on the dashboard.
 */
export async function createCalculatedField(columnName: string, formulaStr: string, createChartAfter = false): Promise<CalculatedFieldResult> {
    if (!rawData || rawData.length === 0) {
        return {
            success: false,
            columnName,
            formula: formulaStr,
            sampleValues: [],
            affectedChartsCount: 0,
            message: "No data loaded in the dataset to calculate."
        };
    }

    const cleanColName = columnName.trim();
    if (!cleanColName) {
        return {
            success: false,
            columnName: "",
            formula: formulaStr,
            sampleValues: [],
            affectedChartsCount: 0,
            message: "Invalid or empty column name specified."
        };
    }

    // Identify referenced columns in formula (either bracketed [Col] or bare tokens)
    let processedFormula = formulaStr;
    const referencedCols: string[] = [];

    // 1. Bracketed tokens: [Sales]
    const bracketMatches = formulaStr.match(/\[([^\]]+)\]/g);
    if (bracketMatches) {
        bracketMatches.forEach(b => {
            const rawCol = b.slice(1, -1).trim();
            const realCol = headers.find(h => h.toLowerCase() === rawCol.toLowerCase()) || rawCol;
            if (!referencedCols.includes(realCol)) referencedCols.push(realCol);
            processedFormula = processedFormula.split(b).join(`row['${realCol}']`);
        });
    } else {
        // 2. Bare column names in formula, case-insensitive match against headers
        // Sort headers by length descending so longer column names match before substrings
        const sortedHeaders = [...headers].sort((a, b) => b.length - a.length);
        sortedHeaders.forEach(h => {
            const regex = new RegExp(`\\b${h}\\b`, 'gi');
            if (regex.test(processedFormula)) {
                if (!referencedCols.includes(h)) referencedCols.push(h);
                processedFormula = processedFormula.replace(regex, `row['${h}']`);
            }
        });
    }

    // Safe mathematical evaluator for each row
    const sampleValues: number[] = [];
    let successCount = 0;

    const computeRow = (row: any) => {
        try {
            let expr = processedFormula;
            referencedCols.forEach(col => {
                const rawVal = row[col];
                const numVal = (rawVal !== undefined && rawVal !== null && !isNaN(Number(rawVal))) ? Number(rawVal) : 0;
                const token = `row['${col}']`;
                expr = expr.split(token).join(String(numVal));
            });

            // Clean unsafe characters: allow only numbers, decimal points, parentheses, and math operators
            const safeExpr = expr.replace(/[^0-9\.\+\-\*\/\(\)\s]/g, '');
            if (!safeExpr.trim()) return 0;

            // eslint-disable-next-line no-new-func
            const result = Function(`"use strict"; return (${safeExpr})`)();
            const finalNum = typeof result === 'number' && !isNaN(result) && isFinite(result) ? Math.round(result * 100) / 100 : 0;
            return finalNum;
        } catch (e) {
            return 0;
        }
    };

    // 1. Programmatically append new column to each row across all datasets
    rawData.forEach((row, i) => {
        const val = computeRow(row);
        row[cleanColName] = val;
        if (i < 5) sampleValues.push(val);
        successCount++;
    });

    filteredData.forEach(row => {
        row[cleanColName] = computeRow(row);
    });

    currentDataForChat.forEach(row => {
        row[cleanColName] = computeRow(row);
    });

    // 2. Append new column name to headers
    if (!headers.includes(cleanColName)) {
        headers.push(cleanColName);
    }

    // 3. Refresh UI Tables and Drag/Drop Controls
    updateControls(headers);
    await updateTableAndUI();

    // 4. Automatically refresh affected charts
    clearDataCache();

    // Identify affected visualizations:
    // Any chart using either the newly calculated column, or any component column from the formula
    const affectedCharts = visualizations.filter(vis => {
        const usesFormulaCol = referencedCols.some(col =>
            (vis.xAxis && vis.xAxis.toLowerCase() === col.toLowerCase()) ||
            (vis.yAxes && Array.isArray(vis.yAxes) && vis.yAxes.some((y: string) => y.toLowerCase() === col.toLowerCase()))
        );
        const usesNewCol = (vis.xAxis && vis.xAxis.toLowerCase() === cleanColName.toLowerCase()) ||
            (vis.yAxes && Array.isArray(vis.yAxes) && vis.yAxes.some((y: string) => y.toLowerCase() === cleanColName.toLowerCase()));
        return usesFormulaCol || usesNewCol;
    });

    console.log(`[CalculatedFields] Refreshing ${affectedCharts.length} affected charts for [${cleanColName}]`);
    if (affectedCharts.length > 0) {
        for (const vis of affectedCharts) {
            try {
                await plotChart(vis);
            } catch (err) {
                console.warn(`[CalculatedFields] Error replotting chart ${vis.id}:`, err);
            }
        }
    } else if (visualizations.length > 0) {
        // If none directly match the exact columns, refresh all to ensure cache sync
        await plotAll();
    }

    await saveDashboardSettings();

    const cardId = `calc_field_${Date.now()}`;
    const cardHtml = `
        <div class="calculated-field-card p-3 bg-white border border-emerald-200 rounded-3 shadow-sm mb-2" id="${cardId}" style="border-left: 4px solid #10b981 !important;">
            <div class="d-flex align-items-center justify-content-between mb-2">
                <div class="d-flex align-items-center gap-2">
                    <span class="badge bg-emerald-100 text-emerald-800 p-1.5 rounded-2">
                        <i class="bi bi-calculator-fill fs-6"></i>
                    </span>
                    <div>
                        <h6 class="mb-0 fw-bold text-slate-800" style="font-size: 0.92rem;">AI Calculated Field Created</h6>
                        <span class="text-muted text-2xs">Column: <strong>[${escapeHtml(cleanColName)}]</strong> | Formula: <code>${escapeHtml(formulaStr)}</code></span>
                    </div>
                </div>
                <span class="badge bg-success text-white text-2xs px-2 py-1 rounded-pill">
                    <i class="bi bi-check-circle-fill me-1"></i> Active
                </span>
            </div>
            <p class="text-slate-600 small mb-2">
                Programmatically calculated across all <strong>${rawData.length}</strong> rows.
                Sample values: <strong>[${sampleValues.slice(0, 4).join(', ')}]</strong>.
                ${affectedCharts.length > 0 ? `<span class="text-emerald-700 fw-semibold"><i class="bi bi-arrow-repeat me-1"></i>${affectedCharts.length} affected chart(s) automatically refreshed.</span>` : ''}
            </p>
            <div class="d-flex align-items-center justify-content-between pt-2 border-top">
                <span class="text-muted text-2xs">New column is now accessible in tables, filters, and drag zones</span>
                <button class="btn btn-xs btn-primary d-flex align-items-center gap-1 btn-plot-calculated-col" data-col="${escapeHtml(cleanColName)}">
                    <i class="bi bi-bar-chart-fill"></i> Plot "${escapeHtml(cleanColName)}" on Dashboard
                </button>
            </div>
        </div>
    `;

    if (createChartAfter) {
        const labelCol = headers.find(h => h !== cleanColName && isNaN(Number(rawData[0]?.[h]))) || headers[0];
        await addVisualization(labelCol, [cleanColName], null, "bar", `${cleanColName} Analysis`);
    }

    showMessage(`Calculated field [${cleanColName}] created & ${affectedCharts.length} affected chart(s) refreshed!`, "success");

    return {
        success: true,
        columnName: cleanColName,
        formula: formulaStr,
        sampleValues,
        affectedChartsCount: affectedCharts.length,
        message: `Calculated field "${cleanColName}" created successfully.`,
        html: cardHtml
    };
}

export function attachCalculatedFieldListeners(container: HTMLElement = document.body): void {
    container.querySelectorAll('.btn-plot-calculated-col').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const col = (btn as HTMLElement).dataset.col;
            if (col) {
                const labelCol = headers.find(h => h !== col && isNaN(Number(rawData[0]?.[h]))) || headers[0];
                await addVisualization(labelCol, [col], null, "bar", `${col} Analysis`);
                showMessage(`New chart for [${col}] added to dashboard!`, "success");
            }
        });
    });
}

