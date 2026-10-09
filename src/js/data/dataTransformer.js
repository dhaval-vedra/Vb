// js/dataTransformer.js

import { getRawData, getHeaders, updateDataAndUI, markDataAsModified, saveUserDataToFirebase } from '../../store/DataHandler.ts';
import { showMessage } from '../core/utils.ts';

/**
 * Infer the data type of a column based on its non-empty values.
 */
export function inferColumnType(data, colName) {
    let numericCount = 0;
    let totalCount = 0;
    
    for (const row of data) {
        const val = row[colName];
        if (val !== undefined && val !== null && String(val).trim() !== '') {
            totalCount++;
            if (!isNaN(Number(val))) {
                numericCount++;
            }
        }
    }
    
    if (totalCount === 0) return 'empty';
    // If more than 80% are numbers, treat as numeric
    return (numericCount / totalCount) > 0.8 ? 'numeric' : 'text';
}

/**
 * Generate a statistical profile of the dataset.
 */
export function generateDataProfile() {
    const rawData = getRawData();
    const headers = getHeaders();
    
    if (!rawData || rawData.length === 0) {
        return null;
    }
    
    const profile = [];
    
    for (const col of headers) {
        let missingCount = 0;
        const uniqueValues = new Set();
        let numericSum = 0;
        let numericCount = 0;
        let min = null;
        let max = null;
        
        const type = inferColumnType(rawData, col);
        
        for (const row of rawData) {
            const val = row[col];
            if (val === undefined || val === null || String(val).trim() === '') {
                missingCount++;
            } else {
                const strVal = String(val).trim();
                uniqueValues.add(strVal);
                
                if (type === 'numeric') {
                    const num = Number(strVal);
                    if (!isNaN(num)) {
                        numericSum += num;
                        numericCount++;
                        if (min === null || num < min) min = num;
                        if (max === null || num > max) max = num;
                    }
                }
            }
        }
        
        profile.push({
            column: col,
            type: type,
            missingCount: missingCount,
            missingPercent: ((missingCount / rawData.length) * 100).toFixed(1),
            uniqueCount: uniqueValues.size,
            mean: numericCount > 0 ? (numericSum / numericCount).toFixed(2) : 'N/A',
            min: min !== null ? min : 'N/A',
            max: max !== null ? max : 'N/A'
        });
    }
    
    return {
        totalRows: rawData.length,
        totalColumns: headers.length,
        columns: profile
    };
}

/**
 * Remove a column from the dataset permanently.
 */
export function removeColumn(colName) {
    const rawData = getRawData();
    const headers = getHeaders();
    
    if (!headers.includes(colName)) {
        showMessage(`कॉलम "${colName}" नहीं मिला।`, "warning");
        return false;
    }
    
    const newHeaders = headers.filter(h => h !== colName);
    const newData = rawData.map(row => {
        const newRow = { ...row };
        delete newRow[colName];
        return newRow;
    });
    
    updateDataAndUI(newData, newHeaders);
    markDataAsModified();
    showMessage(`कॉलम "${colName}" सफलतापूर्वक हटा दिया गया है।`, "success");
    return true;
}

/**
 * Rename a column permanently.
 */
export function renameColumn(oldName, newName) {
    const rawData = getRawData();
    const headers = getHeaders();
    
    if (!oldName || !newName) {
        showMessage("पुराना और नया कॉलम नाम अनिवार्य है।", "warning");
        return false;
    }
    if (!headers.includes(oldName)) {
        showMessage(`कॉलम "${oldName}" नहीं मिला।`, "warning");
        return false;
    }
    if (headers.includes(newName)) {
        showMessage(`नया नाम "${newName}" पहले से ही एक कॉलम का नाम है।`, "warning");
        return false;
    }
    
    const newHeaders = headers.map(h => h === oldName ? newName : h);
    const newData = rawData.map(row => {
        const newRow = {};
        for (const [key, val] of Object.entries(row)) {
            if (key === oldName) {
                newRow[newName] = val;
            } else {
                newRow[key] = val;
            }
        }
        return newRow;
    });
    
    updateDataAndUI(newData, newHeaders);
    markDataAsModified();
    showMessage(`कॉलम "${oldName}" का नाम बदलकर "${newName}" कर दिया गया।`, "success");
    return true;
}

/**
 * Handle missing/blank values in a specific column.
 */
export function handleMissingValues(colName, strategy, customValue = '') {
    const rawData = getRawData();
    const headers = getHeaders();
    
    if (colName !== 'all' && !headers.includes(colName)) {
        showMessage(`कॉलम "${colName}" नहीं मिला।`, "warning");
        return false;
    }
    
    let newData = [];
    let affectedRowsCount = 0;
    
    if (strategy === 'drop') {
        newData = rawData.filter(row => {
            if (colName === 'all') {
                const hasEmpty = headers.some(h => row[h] === undefined || row[h] === null || String(row[h]).trim() === '');
                if (hasEmpty) affectedRowsCount++;
                return !hasEmpty;
            } else {
                const isEmpty = row[colName] === undefined || row[colName] === null || String(row[colName]).trim() === '';
                if (isEmpty) affectedRowsCount++;
                return !isEmpty;
            }
        });
    } else {
        // Imputation / Fill with Value
        let fillValue = customValue;
        
        if (strategy === 'zero') {
            fillValue = '0';
        } else if (strategy === 'mean' || strategy === 'median') {
            const type = inferColumnType(rawData, colName);
            if (type !== 'numeric') {
                showMessage(`रणनीति "${strategy}" केवल संख्यात्मक कॉलम पर लागू की जा सकती है।`, "warning");
                return false;
            }
            
            const numbers = rawData
                .map(row => Number(row[colName]))
                .filter(num => !isNaN(num) && num !== null && num !== undefined);
                
            if (numbers.length === 0) {
                fillValue = '0';
            } else if (strategy === 'mean') {
                const sum = numbers.reduce((a, b) => a + b, 0);
                fillValue = (sum / numbers.length).toFixed(2);
            } else if (strategy === 'median') {
                numbers.sort((a, b) => a - b);
                const mid = Math.floor(numbers.length / 2);
                fillValue = numbers.length % 2 !== 0 ? numbers[mid].toString() : ((numbers[mid - 1] + numbers[mid]) / 2).toString();
            }
        }
        
        newData = rawData.map(row => {
            const newRow = { ...row };
            if (colName === 'all') {
                headers.forEach(h => {
                    if (newRow[h] === undefined || newRow[h] === null || String(newRow[h]).trim() === '') {
                        newRow[h] = fillValue;
                        affectedRowsCount++;
                    }
                });
            } else {
                if (newRow[colName] === undefined || newRow[colName] === null || String(newRow[colName]).trim() === '') {
                    newRow[colName] = fillValue;
                    affectedRowsCount++;
                }
            }
            return newRow;
        });
    }
    
    updateDataAndUI(newData, headers);
    markDataAsModified();
    showMessage(`मिसिंग वैल्यूज को सुधारा गया! ${affectedRowsCount} जगह बदलाव किए गए।`, "success");
    return true;
}

/**
 * Apply permanent hard row filter.
 */
export function applyHardFilter(colName, operator, filterVal) {
    const rawData = getRawData();
    const headers = getHeaders();
    
    if (!headers.includes(colName)) {
        showMessage(`कॉलम "${colName}" नहीं मिला।`, "warning");
        return false;
    }
    
    const type = inferColumnType(rawData, colName);
    let originalCount = rawData.length;
    
    const newData = rawData.filter(row => {
        const rawVal = row[colName];
        if (rawVal === undefined || rawVal === null) return false;
        
        const cellValStr = String(rawVal).trim();
        const filterValStr = String(filterVal).trim();
        
        if (type === 'numeric') {
            const cellNum = Number(cellValStr);
            const filterNum = Number(filterValStr);
            if (isNaN(cellNum) || isNaN(filterNum)) {
                // fallback to string comparison
                return compareStrings(cellValStr, operator, filterValStr);
            }
            return compareNumbers(cellNum, operator, filterNum);
        } else {
            return compareStrings(cellValStr, operator, filterValStr);
        }
    });
    
    const deletedCount = originalCount - newData.length;
    
    updateDataAndUI(newData, headers);
    markDataAsModified();
    showMessage(`कठोर फ़िल्टर लागू: ${deletedCount} पंक्तियाँ हटा दी गई हैं।`, "success");
    return true;
}

function compareNumbers(a, op, b) {
    switch (op) {
        case 'eq': return a === b;
        case 'ne': return a !== b;
        case 'gt': return a > b;
        case 'ge': return a >= b;
        case 'lt': return a < b;
        case 'le': return a <= b;
        default: return false;
    }
}

function compareStrings(a, op, b) {
    const lowerA = a.toLowerCase();
    const lowerB = b.toLowerCase();
    switch (op) {
        case 'eq': return lowerA === lowerB;
        case 'ne': return lowerA !== lowerB;
        case 'contains': return lowerA.includes(lowerB);
        case 'not_contains': return !lowerA.includes(lowerB);
        case 'starts': return lowerA.startsWith(lowerB);
        case 'ends': return lowerA.endsWith(lowerB);
        default: return false;
    }
}

/**
 * Change data type of a column permanently.
 */
export function changeColumnType(colName, targetType) {
    const rawData = getRawData();
    const headers = getHeaders();

    if (!headers.includes(colName)) {
        showMessage(`कॉलम "${colName}" नहीं मिला।`, "warning");
        return false;
    }

    let convertedCount = 0;
    const newData = rawData.map(row => {
        const newRow = { ...row };
        const val = row[colName];
        if (val === undefined || val === null || String(val).trim() === '') {
            newRow[colName] = '';
        } else {
            const trimmed = String(val).trim();
            if (targetType === 'number') {
                const num = Number(trimmed);
                newRow[colName] = isNaN(num) ? 0 : num;
            } else if (targetType === 'text') {
                newRow[colName] = trimmed;
            } else if (targetType === 'date') {
                const d = new Date(trimmed);
                newRow[colName] = isNaN(d.getTime()) ? trimmed : d.toLocaleDateString();
            }
            convertedCount++;
        }
        return newRow;
    });

    updateDataAndUI(newData, headers);
    markDataAsModified();
    showMessage(`कॉलम "${colName}" का टाइप बदलकर "${targetType}" कर दिया गया है (${convertedCount} सेल्स प्रभावित)।`, "success");
    return true;
}

/**
 * Apply a visual formula to compute a column's values.
 */
export function applyFormula(targetCol, colA, operator, bType, colB, valB) {
    const rawData = getRawData();
    const headers = getHeaders();

    if (!targetCol || !targetCol.trim()) {
        showMessage("कृपया एक वैध परिणामी कॉलम (Target Column) का नाम दर्ज करें।", "warning");
        return false;
    }

    if (!headers.includes(colA)) {
        showMessage(`कॉलम "${colA}" नहीं मिला।`, "warning");
        return false;
    }

    const finalTargetCol = targetCol.trim();

    const newData = rawData.map(row => {
        const newRow = { ...row };
        const valA = row[colA];

        // Retrieve valB
        let rawValB;
        if (bType === 'col') {
            rawValB = row[colB];
        } else {
            rawValB = valB;
        }

        let result = '';

        if (operator === 'concat') {
            const strA = valA !== undefined && valA !== null ? String(valA) : '';
            const strB = rawValB !== undefined && rawValB !== null ? String(rawValB) : '';
            result = strA + strB;
        } else {
            // Numeric operations
            const numA = Number(valA);
            const numB = Number(rawValB);

            if (isNaN(numA) || isNaN(numB)) {
                result = 0;
            } else {
                switch (operator) {
                    case '+': result = numA + numB; break;
                    case '-': result = numA - numB; break;
                    case '*': result = numA * numB; break;
                    case '/': result = numB !== 0 ? numA / numB : 0; break;
                    default: result = 0;
                }
            }
        }

        newRow[finalTargetCol] = result;
        return newRow;
    });

    let newHeaders = [...headers];
    if (!newHeaders.includes(finalTargetCol)) {
        newHeaders.push(finalTargetCol);
    }

    updateDataAndUI(newData, newHeaders);
    markDataAsModified();
    showMessage(`कॉलम "${finalTargetCol}" पर फ़ॉर्मूला सफलतापूर्वक लागू किया गया!`, "success");
    return true;
}
