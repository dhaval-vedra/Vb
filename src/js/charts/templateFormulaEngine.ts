// src/js/charts/templateFormulaEngine.ts
// Complete Production-Ready Formula Engine for Template Cards, KPIs, Gauges, and Progress Bars
// Supports: INSERT, SUM, AVG, MAX, MIN, COUNT, GROWTH, DIFF, PERCENT, REMAINING, STATUS, IF, LATEST, TOP, FORMAT

import { filteredData, rawData, headers, getDisplayData, getRawData, getHeaders } from '../../store/DataHandler.ts';

export type FormulaFunctionType =
    | 'INSERT'
    | 'SUM'
    | 'AVG'
    | 'MAX'
    | 'MIN'
    | 'COUNT'
    | 'GROWTH'
    | 'DIFF'
    | 'PERCENT'
    | 'REMAINING'
    | 'STATUS'
    | 'IF'
    | 'LATEST'
    | 'TOP'
    | 'FORMAT';

export interface ParsedFormula {
    isFormula: boolean;
    fnType: FormulaFunctionType;
    args: string[];
    target: string;
    direction: 'R' | 'L';
    text: string;
    rawFormula: string;
    error?: string;
}

export interface FormulaEvaluationResult {
    display: string;
    numericValue?: number;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
    dataPoints?: number[];
    isFormula: boolean;
    fnType?: FormulaFunctionType;
    target?: string;
    direction?: 'R' | 'L';
    text?: string;
    description?: string;
    error?: string;
}

/**
 * Converts column letters (e.g. A, B, Z, AA, AB) into a 0-based column index.
 */
export function columnLabelToIndex(label: string): number {
    const clean = label.toUpperCase().trim();
    let index = 0;
    for (let i = 0; i < clean.length; i++) {
        const charCode = clean.charCodeAt(i) - 64; // A=1, B=2, etc.
        if (charCode < 1 || charCode > 26) return -1;
        index = index * 26 + charCode;
    }
    return index - 1; // 0-based
}

/**
 * Converts a 0-based column index to column letters (e.g. 0 -> A, 1 -> B, 26 -> AA).
 */
export function indexToColumnLabel(colIndex: number): string {
    if (colIndex < 0) return 'A';
    let label = '';
    let temp = colIndex + 1;
    while (temp > 0) {
        const rem = (temp - 1) % 26;
        label = String.fromCharCode(65 + rem) + label;
        temp = Math.floor((temp - 1) / 26);
    }
    return label;
}

/**
 * Parses a cell coordinate like "A4" or "B2" into column and row indices.
 */
export function parseCellAddress(address: string): { colLabel: string; colIndex: number; rowNumber: number; rowIndex: number } | null {
    const match = address.trim().match(/^([A-Za-z]+)(\d+)$/);
    if (!match) return null;
    const colLabel = match[1].toUpperCase();
    const colIndex = columnLabelToIndex(colLabel);
    const rowNumber = parseInt(match[2], 10);
    const rowIndex = rowNumber - 1; // 1-indexed to 0-indexed
    if (colIndex < 0 || isNaN(rowNumber) || rowNumber < 1) return null;
    return { colLabel, colIndex, rowNumber, rowIndex };
}

/**
 * Safely splits arguments in a function call respecting single/double quotes.
 */
export function splitFormulaArguments(argString: string): string[] {
    const args: string[] = [];
    let current = '';
    let inDoubleQuotes = false;
    let inSingleQuotes = false;

    for (let i = 0; i < argString.length; i++) {
        const char = argString[i];
        if (char === '"' && !inSingleQuotes) {
            inDoubleQuotes = !inDoubleQuotes;
            current += char;
        } else if (char === "'" && !inDoubleQuotes) {
            inSingleQuotes = !inSingleQuotes;
            current += char;
        } else if (char === ',' && !inDoubleQuotes && !inSingleQuotes) {
            args.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    if (current.length > 0 || args.length > 0) {
        args.push(current.trim());
    }
    return args;
}

/**
 * Strips outer quotes from a string.
 */
export function unquote(str: string): string {
    if (!str) return '';
    const trimmed = str.trim();
    if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
        return trimmed.slice(1, -1);
    }
    return trimmed;
}

/**
 * Formats live data with custom text according to the direction dictionary:
 * - R: Live data is placed on the RIGHT of text (e.g. "sales 45,000")
 * - L: Live data is placed on the LEFT of text (e.g. "45,000 sales" or "45,000 units")
 */
export function formatWithDirection(liveValue: string | number, direction: 'R' | 'L', text: string): string {
    const valueStr = String(liveValue ?? '').trim();
    if (!text || text.trim() === '') {
        return valueStr;
    }

    if (direction === 'R') {
        const endsWithSep = /[\s:;\-_₹$€£%]$/.test(text);
        return endsWithSep ? `${text}${valueStr}` : `${text} ${valueStr}`;
    } else {
        const startsWithSep = /^[\s:;\-_/%\)]/.test(text);
        return startsWithSep ? `${valueStr}${text}` : `${valueStr} ${text}`;
    }
}

/**
 * Formats a number with Indian currency / numbering rules (₹4,82,500).
 */
export function formatIndianCurrency(num: number): string {
    const isNegative = num < 0;
    const absNum = Math.abs(num);
    const parts = absNum.toFixed(2).split('.');
    const intPart = parts[0];
    const decPart = parts[1] === '00' ? '' : '.' + parts[1];

    if (intPart.length > 3) {
        const last3 = intPart.slice(-3);
        const rest = intPart.slice(0, -3);
        const withCommas = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last3;
        return (isNegative ? '-₹' : '₹') + withCommas + decPart;
    } else {
        return (isNegative ? '-₹' : '₹') + intPart + decPart;
    }
}

/**
 * Formats a number to standard comma-separated with optional decimals.
 */
export function formatNumberStandard(num: number, maxDecimals = 2): string {
    if (isNaN(num)) return '0';
    if (Number.isInteger(num)) {
        return num.toLocaleString();
    }
    return num.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: maxDecimals
    });
}

/**
 * Retrieves the active data rows from filteredData or rawData dynamically.
 * Always resolves to the freshest dataset in real-time.
 */
export function getActiveDataset(): { data: any[]; cols: string[] } {
    let data: any[] = [];
    if (typeof getDisplayData === 'function') {
        const d = getDisplayData();
        if (d && d.length > 0) data = d;
    }
    if (!data || data.length === 0) {
        if (filteredData && filteredData.length > 0) data = filteredData;
        else if (typeof getRawData === 'function') {
            const r = getRawData();
            if (r && r.length > 0) data = r;
        } else if (rawData && rawData.length > 0) data = rawData;
        else if (typeof window !== 'undefined') {
            if ((window as any).filteredData && (window as any).filteredData.length > 0) data = (window as any).filteredData;
            else if ((window as any).rawData && (window as any).rawData.length > 0) data = (window as any).rawData;
        }
    }

    let cols: string[] = [];
    if (typeof getHeaders === 'function') {
        const h = getHeaders();
        if (h && h.length > 0) cols = h;
    }
    if (!cols || cols.length === 0) {
        if (headers && headers.length > 0) cols = headers;
        else if (data && data.length > 0) cols = Object.keys(data[0] || {});
        else if (typeof window !== 'undefined' && (window as any).headers && (window as any).headers.length > 0) {
            cols = (window as any).headers;
        }
    }

    return { data: data || [], cols: cols || [] };
}

/**
 * Extracts an array of numbers and string values from a target reference:
 * - Single cell (A4, B2)
 * - Cell range (A2:A15)
 * - Column name ("Sales", Sales) or Column letter range (B:B, B)
 */
export function evaluateTarget(target: string): {
    scalarValue: string;
    numericValue: number;
    numbersList: number[];
    dataPoints: number[];
    valuesList: string[];
    description: string;
    found: boolean;
} {
    const { data, cols } = getActiveDataset();
    const cleanTarget = unquote(target).trim();

    if (!data || data.length === 0 || !cols || cols.length === 0) {
        return {
            scalarValue: '0',
            numericValue: 0,
            numbersList: [0],
            dataPoints: [0],
            valuesList: ['0'],
            description: 'No data loaded in table',
            found: false
        };
    }

    // 1. Single cell reference (e.g. A4, B2, C10)
    const singleCell = parseCellAddress(cleanTarget);
    if (singleCell) {
        const { colIndex, rowIndex, colLabel, rowNumber } = singleCell;
        const colHeader = cols[colIndex];
        if (!colHeader) {
            return {
                scalarValue: '#REF!',
                numericValue: 0,
                numbersList: [],
                dataPoints: [],
                valuesList: [],
                description: `Column ${colLabel} not found in table`,
                found: false
            };
        }

        const row = data[rowIndex];
        if (!row) {
            return {
                scalarValue: '#N/A',
                numericValue: 0,
                numbersList: [],
                dataPoints: [],
                valuesList: [],
                description: `Row ${rowNumber} out of range (max ${data.length})`,
                found: false
            };
        }

        const rawVal = row[colHeader];
        const strVal = rawVal !== undefined && rawVal !== null ? String(rawVal) : '';
        const numVal = parseFloat(strVal.replace(/[^0-9.-]/g, '')) || 0;

        return {
            scalarValue: strVal,
            numericValue: numVal,
            numbersList: [numVal],
            dataPoints: [numVal],
            valuesList: [strVal],
            description: `Cell ${colLabel}${rowNumber} (${colHeader})`,
            found: true
        };
    }

    // 2. Cell Range reference (e.g. A2:A15, B1:B10)
    const rangeMatch = cleanTarget.match(/^([A-Za-z]+)(\d+)\s*:\s*([A-Za-z]+)(\d+)$/);
    if (rangeMatch) {
        const startCol = columnLabelToIndex(rangeMatch[1]);
        const startRow = parseInt(rangeMatch[2], 10) - 1;
        const endCol = columnLabelToIndex(rangeMatch[3]);
        const endRow = parseInt(rangeMatch[4], 10) - 1;

        if (startCol >= 0 && endCol >= 0) {
            const minRow = Math.max(0, Math.min(startRow, endRow));
            const maxRow = Math.min(data.length - 1, Math.max(startRow, endRow));
            const minCol = Math.max(0, Math.min(startCol, endCol));
            const maxCol = Math.min(cols.length - 1, Math.max(startCol, endCol));

            const numbers: number[] = [];
            const values: string[] = [];
            let sum = 0;

            for (let r = minRow; r <= maxRow; r++) {
                const row = data[r];
                if (!row) continue;
                for (let c = minCol; c <= maxCol; c++) {
                    const header = cols[c];
                    if (!header) continue;
                    const val = row[header];
                    const strVal = val !== undefined && val !== null ? String(val) : '';
                    values.push(strVal);
                    const num = parseFloat(strVal.replace(/[^0-9.-]/g, ''));
                    if (!isNaN(num)) {
                        numbers.push(num);
                        sum += num;
                    }
                }
            }

            const formattedSum = numbers.length > 0 ? formatNumberStandard(sum) : (values[0] || '0');
            return {
                scalarValue: formattedSum,
                numericValue: sum,
                numbersList: numbers,
                dataPoints: numbers.length > 0 ? numbers : [0],
                valuesList: values,
                description: `Range ${cleanTarget} (${values.length} cells)`,
                found: values.length > 0
            };
        }
    }

    // 3. Column name match (e.g. "Sales", Sales, "Total Revenue") or column letter (e.g. A:A, A)
    let matchedHeader = cols.find(h => h.trim().toLowerCase() === cleanTarget.toLowerCase());
    if (!matchedHeader) {
        const singleColLetter = cleanTarget.match(/^([A-Za-z]+)(?::\1)?$/);
        if (singleColLetter) {
            const idx = columnLabelToIndex(singleColLetter[1]);
            if (idx >= 0 && idx < cols.length) {
                matchedHeader = cols[idx];
            }
        }
    }

    if (matchedHeader) {
        const numbers: number[] = [];
        const values: string[] = [];
        let sum = 0;

        for (let r = 0; r < data.length; r++) {
            const row = data[r];
            if (!row) continue;
            const val = row[matchedHeader];
            if (val !== undefined && val !== null) {
                const strVal = String(val);
                values.push(strVal);
                const num = parseFloat(strVal.replace(/[^0-9.-]/g, ''));
                if (!isNaN(num)) {
                    numbers.push(num);
                    sum += num;
                }
            }
        }

        const displayVal = numbers.length > 0 ? formatNumberStandard(sum) : (values[values.length - 1] || '0');
        return {
            scalarValue: displayVal,
            numericValue: sum,
            numbersList: numbers,
            dataPoints: numbers.length > 0 ? numbers : [0],
            valuesList: values,
            description: `Column "${matchedHeader}" (${data.length} rows)`,
            found: true
        };
    }

    return {
        scalarValue: '#NAME?',
        numericValue: 0,
        numbersList: [],
        dataPoints: [0],
        valuesList: [],
        description: `Reference "${cleanTarget}" not found in table`,
        found: false
    };
}

/**
 * Evaluates a target or parses a literal numeric value.
 */
export function evaluateTargetOrNumber(target: string): {
    scalarValue: string;
    numericValue: number;
    numbersList: number[];
    valuesList: string[];
    description: string;
    found: boolean;
} {
    const clean = unquote(target).trim();
    const literalNum = parseFloat(clean.replace(/,/g, ''));
    // If it's a pure number without column letters
    if (!isNaN(literalNum) && /^-?\d+(\.\d+)?$/.test(clean.replace(/,/g, ''))) {
        return {
            scalarValue: formatNumberStandard(literalNum),
            numericValue: literalNum,
            numbersList: [literalNum],
            valuesList: [clean],
            description: `Literal number ${literalNum}`,
            found: true
        };
    }

    return evaluateTarget(target);
}

/**
 * Parses any supported formula into a structured object.
 */
export function parseFormula(input: string): ParsedFormula {
    if (!input) {
        return {
            isFormula: false,
            fnType: 'INSERT',
            args: [],
            target: '',
            direction: 'R',
            text: '',
            rawFormula: ''
        };
    }

    const trimmed = input.trim();
    // Matches =FN(...) or FN(...) case-insensitively
    const match = trimmed.match(/^=?\s*([A-Za-z_]+)\s*\(([\s\S]*)\)\s*$/);
    if (!match) {
        return {
            isFormula: false,
            fnType: 'INSERT',
            args: [],
            target: '',
            direction: 'R',
            text: trimmed,
            rawFormula: trimmed
        };
    }

    const fnName = match[1].toUpperCase() as FormulaFunctionType;
    const knownFunctions: FormulaFunctionType[] = [
        'INSERT', 'SUM', 'AVG', 'MAX', 'MIN', 'COUNT',
        'GROWTH', 'DIFF', 'PERCENT', 'REMAINING', 'STATUS',
        'IF', 'LATEST', 'TOP', 'FORMAT'
    ];

    // Alias mapping (AVERAGE -> AVG, PERCENTAGE -> PERCENT, DIFFERENCE -> DIFF)
    let resolvedFn: FormulaFunctionType = fnName;
    if ((fnName as string) === 'AVERAGE') resolvedFn = 'AVG';
    else if ((fnName as string) === 'PERCENTAGE') resolvedFn = 'PERCENT';
    else if ((fnName as string) === 'DIFFERENCE') resolvedFn = 'DIFF';

    if (!knownFunctions.includes(resolvedFn)) {
        return {
            isFormula: false,
            fnType: 'INSERT',
            args: [],
            target: '',
            direction: 'R',
            text: trimmed,
            rawFormula: trimmed,
            error: `Unknown formula function: ${fnName}`
        };
    }

    const innerArgs = match[2];
    const rawArgs = splitFormulaArguments(innerArgs);

    // Provide default target, direction, text fields for backward compatibility
    const target = rawArgs.length > 0 ? unquote(rawArgs[0]) : 'A1';
    let direction: 'R' | 'L' = 'R';
    let text = '';

    if (resolvedFn === 'INSERT' || resolvedFn === 'SUM' || resolvedFn === 'AVG' || resolvedFn === 'MAX' || resolvedFn === 'MIN' || resolvedFn === 'COUNT' || resolvedFn === 'LATEST') {
        if (rawArgs.length === 2) {
            const arg1 = unquote(rawArgs[1]);
            if (arg1.toUpperCase() === 'L' || arg1.toUpperCase() === 'R') {
                direction = arg1.toUpperCase() as 'R' | 'L';
            } else {
                text = arg1;
            }
        } else if (rawArgs.length >= 3) {
            direction = unquote(rawArgs[1]).toUpperCase() === 'L' ? 'L' : 'R';
            text = unquote(rawArgs[2]);
        }
    } else if (resolvedFn === 'GROWTH' || resolvedFn === 'DIFF' || resolvedFn === 'PERCENT' || resolvedFn === 'REMAINING') {
        if (rawArgs.length === 3) {
            const arg2 = unquote(rawArgs[2]);
            if (arg2.toUpperCase() === 'L' || arg2.toUpperCase() === 'R') {
                direction = arg2.toUpperCase() as 'R' | 'L';
            } else {
                text = arg2;
            }
        } else if (rawArgs.length >= 4) {
            direction = unquote(rawArgs[2]).toUpperCase() === 'L' ? 'L' : 'R';
            text = unquote(rawArgs[3]);
        }
    } else if (resolvedFn === 'FORMAT') {
        if (rawArgs.length === 3) {
            text = unquote(rawArgs[2]);
        } else if (rawArgs.length >= 4) {
            direction = unquote(rawArgs[2]).toUpperCase() === 'L' ? 'L' : 'R';
            text = unquote(rawArgs[3]);
        }
    }

    return {
        isFormula: true,
        fnType: resolvedFn,
        args: rawArgs,
        target,
        direction,
        text,
        rawFormula: trimmed
    };
}

/**
 * Builds a clean formula string for the specified function.
 */
export function buildFormulaString(
    fnTypeOrTarget: FormulaFunctionType | string,
    target1OrParam2?: string,
    param2OrParam3?: string,
    param3OrParam4?: string,
    param4?: string
): string {
    const knownFunctions: FormulaFunctionType[] = [
        'INSERT', 'SUM', 'AVG', 'MAX', 'MIN', 'COUNT', 'GROWTH', 'DIFF', 'PERCENT', 'REMAINING', 'STATUS', 'IF', 'LATEST', 'TOP', 'FORMAT'
    ];
    let fnType: FormulaFunctionType = 'INSERT';
    let t1 = 'A1';
    let p2 = target1OrParam2;
    let p3 = param2OrParam3;
    let p4 = param3OrParam4;

    const upperCandidate = (fnTypeOrTarget || '').toUpperCase().trim();
    if (knownFunctions.includes(upperCandidate as FormulaFunctionType)) {
        fnType = upperCandidate as FormulaFunctionType;
        t1 = (target1OrParam2 || 'A1').trim();
        p2 = param2OrParam3;
        p3 = param3OrParam4;
        p4 = param4;
    } else {
        // Fallback / legacy call: buildFormulaString(target, direction, text)
        fnType = 'INSERT';
        t1 = (fnTypeOrTarget || 'A1').trim();
        p2 = target1OrParam2;
        p3 = param2OrParam3;
    }

    switch (fnType) {
        case 'INSERT':
        case 'SUM':
        case 'AVG':
        case 'MAX':
        case 'MIN':
        case 'COUNT':
        case 'LATEST': {
            const dir = (p2 === 'L') ? 'L' : 'R';
            const txt = p3 ? `"${p3}"` : '""';
            return `=${fnType}(${t1}, ${dir}, ${txt})`;
        }
        case 'GROWTH':
        case 'DIFF':
        case 'PERCENT':
        case 'REMAINING': {
            const t2 = (p2 || 'A1').trim();
            const dir = (p3 === 'L') ? 'L' : 'R';
            const txt = p4 ? `"${p4}"` : '""';
            return `=${fnType}(${t1}, ${t2}, ${dir}, ${txt})`;
        }
        case 'STATUS': {
            const thresh = p2 ? p2.trim() : '80';
            const pass = p3 ? `"${p3}"` : '"Pass"';
            const fail = p4 ? `"${p4}"` : '"Fail"';
            return `=STATUS(${t1}, ${thresh}, ${pass}, ${fail})`;
        }
        case 'IF': {
            if (t1.includes('>') || t1.includes('<') || t1.includes('=') || t1.includes('!')) {
                const trueVal = p2 ? `"${p2}"` : '"High"';
                const falseVal = p3 ? `"${p3}"` : '"Standard"';
                return `=IF(${t1}, ${trueVal}, ${falseVal})`;
            }
            const cond = p2 ? p2.trim() : '> 10000';
            const trueVal = p3 ? `"${p3}"` : '"High"';
            const falseVal = p4 ? `"${p4}"` : '"Standard"';
            return `=IF(${t1} ${cond}, ${trueVal}, ${falseVal})`;
        }
        case 'TOP': {
            const n = p2 ? p2.trim() : '1';
            const dir = (p3 === 'L') ? 'L' : 'R';
            const txt = p4 ? `"${p4}"` : '""';
            return `=TOP(${t1}, ${n}, ${dir}, ${txt})`;
        }
        case 'FORMAT': {
            const fmt = p2 ? `"${p2.toUpperCase()}"` : '"INR"';
            const dir = (p3 === 'L') ? 'L' : 'R';
            const txt = p4 ? `"${p4}"` : '""';
            return `=FORMAT(${t1}, ${fmt}, ${dir}, ${txt})`;
        }
        default:
            return `=INSERT(${t1}, R, "")`;
    }
}

/**
 * Main evaluation engine for all 15 template formulas.
 */
export function evaluateFormula(formulaOrText: string): FormulaEvaluationResult {
    if (!formulaOrText) {
        return { display: '', isFormula: false };
    }

    const parsed = parseFormula(formulaOrText);
    if (!parsed.isFormula) {
        return {
            display: parsed.text,
            isFormula: false
        };
    }

    const { fnType, args, direction, text } = parsed;

    try {
        switch (fnType) {
            // 1. =INSERT(Target, Direction, "Text")
            case 'INSERT': {
                const target = unquote(args[0] || 'A1');
                const targetEval = evaluateTarget(target);
                const display = formatWithDirection(targetEval.scalarValue, direction, text);
                return {
                    display,
                    numericValue: targetEval.numericValue,
                    dataPoints: targetEval.dataPoints,
                    isFormula: true,
                    fnType,
                    target,
                    direction,
                    text,
                    description: targetEval.description,
                    error: !targetEval.found ? targetEval.description : undefined
                };
            }

            // 2. =SUM(Target, Direction, "Text")
            case 'SUM': {
                const target = unquote(args[0] || 'A1');
                const targetEval = evaluateTarget(target);
                const numbers = targetEval.numbersList;
                const sum = numbers.reduce((acc, val) => acc + val, 0);
                const formattedSum = formatNumberStandard(sum);
                const display = formatWithDirection(formattedSum, direction, text);
                return {
                    display,
                    numericValue: sum,
                    dataPoints: numbers.length > 0 ? numbers : [sum],
                    isFormula: true,
                    fnType,
                    target,
                    direction,
                    text,
                    description: `SUM of ${target}: ${formattedSum} (${numbers.length} values)`
                };
            }

            // 3. =AVG(Target, Direction, "Text")
            case 'AVG': {
                const target = unquote(args[0] || 'A1');
                const targetEval = evaluateTarget(target);
                const numbers = targetEval.numbersList;
                const count = numbers.length;
                const sum = numbers.reduce((acc, val) => acc + val, 0);
                const avg = count > 0 ? sum / count : 0;
                const formattedAvg = formatNumberStandard(avg, 2);
                const display = formatWithDirection(formattedAvg, direction, text);
                return {
                    display,
                    numericValue: avg,
                    dataPoints: numbers.length > 0 ? numbers : [avg],
                    isFormula: true,
                    fnType,
                    target,
                    direction,
                    text,
                    description: `AVG of ${target}: ${formattedAvg} (${count} values)`
                };
            }

            // 4. =MAX(Target, Direction, "Text")
            case 'MAX': {
                const target = unquote(args[0] || 'A1');
                const targetEval = evaluateTarget(target);
                const numbers = targetEval.numbersList;
                const max = numbers.length > 0 ? Math.max(...numbers) : 0;
                const formattedMax = formatNumberStandard(max);
                const display = formatWithDirection(formattedMax, direction, text);
                return {
                    display,
                    numericValue: max,
                    dataPoints: numbers.length > 0 ? numbers : [max],
                    isFormula: true,
                    fnType,
                    target,
                    direction,
                    text,
                    description: `MAX peak of ${target}: ${formattedMax}`
                };
            }

            // 5. =MIN(Target, Direction, "Text")
            case 'MIN': {
                const target = unquote(args[0] || 'A1');
                const targetEval = evaluateTarget(target);
                const numbers = targetEval.numbersList;
                const min = numbers.length > 0 ? Math.min(...numbers) : 0;
                const formattedMin = formatNumberStandard(min);
                const display = formatWithDirection(formattedMin, direction, text);
                return {
                    display,
                    numericValue: min,
                    dataPoints: numbers.length > 0 ? numbers : [min],
                    isFormula: true,
                    fnType,
                    target,
                    direction,
                    text,
                    description: `MIN lowest of ${target}: ${formattedMin}`
                };
            }

            // 6. =COUNT(Target, Direction, "Text")
            case 'COUNT': {
                const target = unquote(args[0] || 'A1');
                const targetEval = evaluateTarget(target);
                const count = targetEval.valuesList.filter(v => v !== '' && v !== null && v !== undefined).length;
                const display = formatWithDirection(count.toLocaleString(), direction, text);
                return {
                    display,
                    numericValue: count,
                    dataPoints: [count],
                    isFormula: true,
                    fnType,
                    target,
                    direction,
                    text,
                    description: `COUNT of ${target}: ${count} rows/cells`
                };
            }

            // 7. =GROWTH(TargetCurrent, TargetPrev, Direction, "Text")
            case 'GROWTH': {
                const targetCurrent = unquote(args[0] || 'B2');
                const targetPrev = unquote(args[1] || 'B1');
                const evalCurr = evaluateTargetOrNumber(targetCurrent);
                const evalPrev = evaluateTargetOrNumber(targetPrev);

                const curr = evalCurr.numericValue;
                const prev = evalPrev.numericValue;

                let growthPct = 0;
                if (prev !== 0) {
                    growthPct = ((curr - prev) / Math.abs(prev)) * 100;
                } else {
                    growthPct = curr > 0 ? 100 : (curr < 0 ? -100 : 0);
                }

                const sign = growthPct > 0 ? '+' : '';
                const pctFormatted = `${sign}${growthPct.toFixed(1)}%`;
                const display = formatWithDirection(pctFormatted, direction, text);
                const trend: 'up' | 'down' | 'neutral' = growthPct > 0 ? 'up' : (growthPct < 0 ? 'down' : 'neutral');

                return {
                    display,
                    numericValue: growthPct,
                    trend,
                    trendValue: pctFormatted,
                    dataPoints: [prev, curr],
                    isFormula: true,
                    fnType,
                    target: `${targetCurrent} vs ${targetPrev}`,
                    direction,
                    text,
                    description: `GROWTH (${targetCurrent}: ${curr} vs ${targetPrev}: ${prev}) = ${pctFormatted}`
                };
            }

            // 8. =DIFF(Target1, Target2, Direction, "Text")
            case 'DIFF': {
                const target1 = unquote(args[0] || 'A1');
                const target2 = unquote(args[1] || 'A2');
                const eval1 = evaluateTargetOrNumber(target1);
                const eval2 = evaluateTargetOrNumber(target2);

                const diff = eval1.numericValue - eval2.numericValue;
                const sign = diff > 0 ? '+' : '';
                const formattedDiff = `${sign}${formatNumberStandard(diff)}`;
                const display = formatWithDirection(formattedDiff, direction, text);

                return {
                    display,
                    numericValue: diff,
                    dataPoints: [eval1.numericValue, eval2.numericValue],
                    isFormula: true,
                    fnType,
                    target: `${target1} - ${target2}`,
                    direction,
                    text,
                    description: `DIFF (${target1} - ${target2}) = ${formattedDiff}`
                };
            }

            // 9. =PERCENT(ActualTarget, MaxTarget, Direction, "Text")
            case 'PERCENT': {
                const targetActual = unquote(args[0] || 'A1');
                const targetMax = unquote(args[1] || '100');
                const evalActual = evaluateTargetOrNumber(targetActual);
                const evalMax = evaluateTargetOrNumber(targetMax);

                const actual = evalActual.numericValue;
                const max = evalMax.numericValue;
                const pct = max !== 0 ? (actual / max) * 100 : 0;
                const formattedPct = `${pct % 1 === 0 ? pct.toFixed(0) : pct.toFixed(1)}%`;
                const display = formatWithDirection(formattedPct, direction, text);

                return {
                    display,
                    numericValue: Math.round(pct * 10) / 10,
                    dataPoints: [actual, max],
                    isFormula: true,
                    fnType,
                    target: `${targetActual} / ${targetMax}`,
                    direction,
                    text,
                    description: `PERCENT (${actual} of ${max}) = ${formattedPct}`
                };
            }

            // 10. =REMAINING(Goal, Current, Direction, "Text")
            case 'REMAINING': {
                const goalTarget = unquote(args[0] || '100');
                const currTarget = unquote(args[1] || 'A1');
                const evalGoal = evaluateTargetOrNumber(goalTarget);
                const evalCurr = evaluateTargetOrNumber(currTarget);

                const goal = evalGoal.numericValue;
                const curr = evalCurr.numericValue;
                const remaining = goal - curr;
                const formattedRem = formatNumberStandard(remaining);
                const display = formatWithDirection(formattedRem, direction, text);

                return {
                    display,
                    numericValue: remaining,
                    dataPoints: [curr, goal],
                    isFormula: true,
                    fnType,
                    target: `Goal ${goalTarget} - ${currTarget}`,
                    direction,
                    text,
                    description: `REMAINING to Goal (${goal} - ${curr}) = ${formattedRem}`
                };
            }

            // 11. =STATUS(Target, Threshold, "PassText", "FailText")
            case 'STATUS': {
                const target = unquote(args[0] || 'A1');
                const rawThreshold = unquote(args[1] || '80');
                const passText = unquote(args[2] || 'Pass');
                const failText = unquote(args[3] || 'Fail');

                const evalTarget = evaluateTargetOrNumber(target);
                const targetVal = evalTarget.numericValue;

                // Threshold parsing: supports ">80", ">=80", "<80", "<=80", "=80" or just "80"
                let passed = false;
                const threshMatch = rawThreshold.match(/^([><=!]+)?\s*(-?\d+(\.\d+)?)/);
                if (threshMatch) {
                    const op = threshMatch[1] || '>=';
                    const threshNum = parseFloat(threshMatch[2]);
                    switch (op) {
                        case '>': passed = targetVal > threshNum; break;
                        case '>=': passed = targetVal >= threshNum; break;
                        case '<': passed = targetVal < threshNum; break;
                        case '<=': passed = targetVal <= threshNum; break;
                        case '=':
                        case '==': passed = targetVal === threshNum; break;
                        case '!=': passed = targetVal !== threshNum; break;
                        default: passed = targetVal >= threshNum;
                    }
                } else {
                    // String comparison fallback
                    passed = evalTarget.scalarValue.toLowerCase() === rawThreshold.toLowerCase();
                }

                const display = passed ? passText : failText;
                return {
                    display,
                    numericValue: targetVal,
                    isFormula: true,
                    fnType,
                    target,
                    description: `STATUS of ${target} (${targetVal} ${rawThreshold}) ➔ ${display}`
                };
            }

            // 12. =IF(Condition, "TrueText", "FalseText")
            // e.g. =IF(Sales > 10000, "High Performer", "Standard")
            case 'IF': {
                // If arguments were split by comma:
                // arg0 is condition, arg1 is trueText, arg2 is falseText
                const conditionStr = unquote(args[0] || '');
                const trueText = unquote(args[1] || 'True');
                const falseText = unquote(args[2] || 'False');

                let conditionMet = false;
                const condMatch = conditionStr.match(/^([\s\S]+?)\s*(>=|<=|!=|==|=|>|<)\s*([\s\S]+)$/);
                if (condMatch) {
                    const leftPart = condMatch[1].trim();
                    const op = condMatch[2];
                    const rightPart = condMatch[3].trim();

                    const evalLeft = evaluateTargetOrNumber(leftPart);
                    const evalRight = evaluateTargetOrNumber(rightPart);

                    const leftNum = evalLeft.numericValue;
                    const rightNum = evalRight.numericValue;

                    // If both can be compared numerically
                    if (!isNaN(leftNum) && !isNaN(rightNum) && evalLeft.found && evalRight.found) {
                        switch (op) {
                            case '>': conditionMet = leftNum > rightNum; break;
                            case '>=': conditionMet = leftNum >= rightNum; break;
                            case '<': conditionMet = leftNum < rightNum; break;
                            case '<=': conditionMet = leftNum <= rightNum; break;
                            case '=':
                            case '==': conditionMet = leftNum === rightNum; break;
                            case '!=': conditionMet = leftNum !== rightNum; break;
                        }
                    } else {
                        // String comparison
                        const leftStr = evalLeft.scalarValue.trim().toLowerCase();
                        const rightStr = unquote(rightPart).trim().toLowerCase();
                        if (op === '=' || op === '==') conditionMet = leftStr === rightStr;
                        else if (op === '!=') conditionMet = leftStr !== rightStr;
                    }
                }

                const display = conditionMet ? trueText : falseText;
                return {
                    display,
                    isFormula: true,
                    fnType,
                    target: conditionStr,
                    description: `IF (${conditionStr}) ➔ ${display}`
                };
            }

            // 13. =LATEST(ColumnName, Direction, "Text")
            case 'LATEST': {
                const target = unquote(args[0] || 'A');
                const { data, cols } = getActiveDataset();
                if (!data || data.length === 0) {
                    return { display: '0', isFormula: true, description: 'No data loaded' };
                }

                // Find matching column header
                let matchedCol = cols.find(c => c.toLowerCase() === target.toLowerCase());
                if (!matchedCol) {
                    const colIdx = columnLabelToIndex(target);
                    if (colIdx >= 0 && colIdx < cols.length) {
                        matchedCol = cols[colIdx];
                    }
                }

                const headerToUse = matchedCol || cols[0];
                const lastRow = data[data.length - 1];
                const lastVal = lastRow && lastRow[headerToUse] !== undefined ? String(lastRow[headerToUse]) : '0';
                const numVal = parseFloat(lastVal.replace(/[^0-9.-]/g, '')) || 0;
                const display = formatWithDirection(lastVal, direction, text);

                return {
                    display,
                    numericValue: numVal,
                    dataPoints: [numVal],
                    isFormula: true,
                    fnType,
                    target,
                    direction,
                    text,
                    description: `LATEST of "${headerToUse}": ${lastVal} (Row ${data.length})`
                };
            }

            // 14. =TOP(ColumnName, N, Direction, "Text")
            case 'TOP': {
                const target = unquote(args[0] || 'A');
                let n = 1;
                let topDir: 'R' | 'L' = 'R';
                let topText = '';

                if (args.length >= 2) {
                    const parsedN = parseInt(unquote(args[1]), 10);
                    if (!isNaN(parsedN)) {
                        n = parsedN;
                        if (args.length >= 3) topDir = unquote(args[2]).toUpperCase() === 'L' ? 'L' : 'R';
                        if (args.length >= 4) topText = unquote(args[3]);
                    } else {
                        topDir = unquote(args[1]).toUpperCase() === 'L' ? 'L' : 'R';
                        if (args.length >= 3) topText = unquote(args[2]);
                    }
                }

                const targetEval = evaluateTarget(target);
                const values = targetEval.valuesList;
                const numbers = targetEval.numbersList;

                let topVal = '';
                let topNum = 0;

                if (numbers.length > 0 && numbers.length === values.length) {
                    // Numerical column: sort descending and pick top N
                    const sorted = [...numbers].sort((a, b) => b - a);
                    const pickIdx = Math.max(0, Math.min(n - 1, sorted.length - 1));
                    topNum = sorted[pickIdx];
                    topVal = formatNumberStandard(topNum);
                } else if (values.length > 0) {
                    // Categorical column: find most frequent value (mode)
                    const counts = new Map<string, number>();
                    values.forEach(v => {
                        if (v.trim()) counts.set(v, (counts.get(v) || 0) + 1);
                    });
                    const sortedEntries = [...counts.entries()].sort((a, b) => b[1] - a[1]);
                    const pickIdx = Math.max(0, Math.min(n - 1, sortedEntries.length - 1));
                    topVal = sortedEntries[pickIdx] ? sortedEntries[pickIdx][0] : values[0];
                    topNum = sortedEntries[pickIdx] ? sortedEntries[pickIdx][1] : 0;
                }

                const display = formatWithDirection(topVal, topDir, topText);
                return {
                    display,
                    numericValue: topNum,
                    dataPoints: numbers.length > 0 ? numbers : [topNum],
                    isFormula: true,
                    fnType,
                    target,
                    direction: topDir,
                    text: topText,
                    description: `TOP (${n}) in "${target}": ${topVal}`
                };
            }

            // 15. =FORMAT(Target, "FormatType", Direction, "Text")
            // Formats: INR, USD, EUR, GBP, PERCENT, COMPACT, NUMBER
            case 'FORMAT': {
                const target = unquote(args[0] || 'A1');
                const fmtType = unquote(args[1] || 'INR').toUpperCase();
                const evalTarget = evaluateTargetOrNumber(target);
                const num = evalTarget.numericValue;

                let formattedVal = '';
                switch (fmtType) {
                    case 'INR':
                    case 'RUPEE':
                    case 'RS':
                        formattedVal = formatIndianCurrency(num);
                        break;
                    case 'USD':
                    case 'DOLLAR':
                        formattedVal = '$' + formatNumberStandard(num, 2);
                        break;
                    case 'EUR':
                    case 'EURO':
                        formattedVal = '€' + formatNumberStandard(num, 2);
                        break;
                    case 'GBP':
                    case 'POUND':
                        formattedVal = '£' + formatNumberStandard(num, 2);
                        break;
                    case 'PERCENT':
                    case 'PCT':
                        formattedVal = `${num % 1 === 0 ? num.toFixed(0) : num.toFixed(1)}%`;
                        break;
                    case 'COMPACT':
                    case 'K':
                        if (Math.abs(num) >= 10000000) formattedVal = (num / 10000000).toFixed(1) + 'Cr';
                        else if (Math.abs(num) >= 100000) formattedVal = (num / 100000).toFixed(1) + 'L';
                        else if (Math.abs(num) >= 1000) formattedVal = (num / 1000).toFixed(1) + 'K';
                        else formattedVal = String(num);
                        break;
                    case 'NUMBER':
                    default:
                        formattedVal = formatNumberStandard(num, 2);
                        break;
                }

                const display = formatWithDirection(formattedVal, direction, text);
                return {
                    display,
                    numericValue: num,
                    dataPoints: evalTarget.numbersList,
                    isFormula: true,
                    fnType,
                    target,
                    direction,
                    text,
                    description: `FORMAT ${target} as ${fmtType}: ${display}`
                };
            }

            default: {
                return {
                    display: formulaOrText,
                    isFormula: false
                };
            }
        }
    } catch (err: any) {
        console.error(`Error evaluating formula "${formulaOrText}":`, err);
        return {
            display: '#ERROR!',
            isFormula: true,
            fnType,
            error: err.message || 'Formula evaluation failed'
        };
    }
}

/**
 * Applies all stored formulas in chartConfig.formulas to the chartConfig object.
 */
export function applyFormulasToCardConfig(chartConfig: any): boolean {
    if (!chartConfig) return false;

    let modified = false;

    if (!chartConfig.formulas) {
        chartConfig.formulas = {};
    }

    // Also check if any direct property currently holds an = formula
    const checkFields = ['value', 'label', 'subLabel', 'badge', 'trendValue', 'change', 'currency', 'dataPointsFormula'];
    for (const f of checkFields) {
        const val = chartConfig[f];
        if (typeof val === 'string' && val.trim().startsWith('=')) {
            chartConfig.formulas[f] = val.trim();
        }
    }

    // Evaluate each formula
    for (const [field, formulaStr] of Object.entries(chartConfig.formulas)) {
        if (typeof formulaStr === 'string' && formulaStr.trim()) {
            const evalResult = evaluateFormula(formulaStr);
            if (evalResult.isFormula) {
                modified = true;
                if (field === 'value') {
                    chartConfig.value = evalResult.display;

                    // Update gaugeValue for Gauge / Progress cards
                    if (evalResult.numericValue !== undefined && !isNaN(evalResult.numericValue)) {
                        chartConfig.gaugeValue = evalResult.numericValue;
                    }

                    // Update sparkline dataPoints if formula returns range or list
                    if (evalResult.dataPoints && evalResult.dataPoints.length > 1) {
                        chartConfig.dataPoints = evalResult.dataPoints;
                    }

                    // Update trend if formula computed growth
                    if (evalResult.trend) {
                        chartConfig.trend = evalResult.trend;
                        chartConfig.trendDirection = evalResult.trend;
                    }
                } else if (field === 'trendValue' || field === 'change') {
                    chartConfig[field] = evalResult.display;
                    if (evalResult.trend) {
                        chartConfig.trend = evalResult.trend;
                        chartConfig.trendDirection = evalResult.trend;
                    }
                } else if (field === 'dataPointsFormula') {
                    if (evalResult.dataPoints && evalResult.dataPoints.length > 0) {
                        chartConfig.dataPoints = evalResult.dataPoints;
                    }
                } else if (field.startsWith('subMetric_')) {
                    // Support subMetric_0_value, subMetric_0_label, etc.
                    const subParts = field.split('_');
                    const idx = parseInt(subParts[1], 10);
                    const prop = subParts[2]; // 'value' or 'label'
                    if (!isNaN(idx) && chartConfig.subMetrics && chartConfig.subMetrics[idx]) {
                        chartConfig.subMetrics[idx][prop] = evalResult.display;
                    }
                } else {
                    chartConfig[field] = evalResult.display;
                }
            }
        }
    }

    return modified;
}
