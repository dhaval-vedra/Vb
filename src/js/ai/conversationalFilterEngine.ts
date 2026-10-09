// src/js/ai/conversationalFilterEngine.ts
import { rawData, filteredData, headers, currentDataForChat } from '../../store/DataHandler.ts';
import { updateTableAndUI } from '../../store/UIHandler.js';
import { plotAll } from '../charts/charts.ts';
import { showMessage } from '../core/utils.ts';

export interface FilterCondition {
    column: string;
    operator: '>' | '<' | '>=' | '<=' | '==' | '!=' | 'contains' | 'top';
    value: any;
    displayQuery: string;
}

let activeConversationalFilter: FilterCondition | null = null;

export function getActiveConversationalFilter(): FilterCondition | null {
    return activeConversationalFilter;
}

export function parseNaturalLanguageFilter(query: string): FilterCondition | null {
    const q = query.trim().toLowerCase();
    
    // 1. Reset check
    if (/reset|clear|remove filter|हटाओ|हटाएं|रीसेट|सभी दिखाओ|पुरा डेटा/i.test(q) && /filter|फिल्टर|डेटा/i.test(q)) {
        return null;
    }

    if (!headers || headers.length === 0 || !rawData || rawData.length === 0) {
        return null;
    }

    // 2. Find target column
    let matchedCol: string | null = null;
    for (const h of headers) {
        const hLow = h.toLowerCase();
        if (q.includes(hLow)) {
            matchedCol = h;
            break;
        }
    }

    // If no direct column match, fuzzy detect standard metrics
    if (!matchedCol) {
        if (/sales|बिक्री|सेल/i.test(q)) {
            matchedCol = headers.find(h => /sales|revenue|amount|बिक्री/i.test(h)) || null;
        } else if (/profit|लाभ|मुनाफा/i.test(q)) {
            matchedCol = headers.find(h => /profit|margin|लाभ/i.test(h)) || null;
        } else if (/year|साल|वर्ष/i.test(q)) {
            matchedCol = headers.find(h => /year|साल|वर्ष|date/i.test(h)) || null;
        } else if (/city|शहर/i.test(q)) {
            matchedCol = headers.find(h => /city|शहर|location/i.test(h)) || null;
        } else if (/category|श्रेणी/i.test(q)) {
            matchedCol = headers.find(h => /category|श्रेणी|type/i.test(h)) || null;
        }
    }

    // 3. Top N check (e.g. "top 5 by sales")
    const topMatch = q.match(/top\s*(\d+)|शीर्ष\s*(\d+)/i);
    if (topMatch) {
        const n = parseInt(topMatch[1] || topMatch[2], 10);
        const col = matchedCol || headers.find(h => !isNaN(Number(rawData[0]?.[h]))) || headers[1] || headers[0];
        return {
            column: col,
            operator: 'top',
            value: n,
            displayQuery: `Top ${n} रिकॉर्ड्स (${col} के अनुसार)`
        };
    }

    // 4. Numeric Comparison check (>, <, >=, <=)
    // E.g., "> 50000", ">= 100", "50000 से ज्यादा", "greater than 50000"
    const numComparisonRegex = /(>|>=|<|<=|greater than|more than|above|less than|below|से ज्यादा|से अधिक|से कम)\s*₹?\s*([\d,]+(\.\d+)?)/i;
    const numMatch = q.match(numComparisonRegex);

    if (numMatch) {
        const opStr = numMatch[1].toLowerCase();
        const rawNum = parseFloat(numMatch[2].replace(/,/g, ''));
        let op: '>' | '<' | '>=' | '<=' = '>';

        if (opStr.includes('>') || opStr.includes('greater') || opStr.includes('more') || opStr.includes('above') || opStr.includes('से ज्यादा') || opStr.includes('से अधिक')) {
            op = opStr.includes('=') ? '>=' : '>';
        } else if (opStr.includes('<') || opStr.includes('less') || opStr.includes('below') || opStr.includes('से कम')) {
            op = opStr.includes('=') ? '<=' : '<';
        }

        const col = matchedCol || headers.find(h => {
            const v = Number(rawData[0]?.[h]);
            return !isNaN(v) && v > 0;
        }) || headers[1] || headers[0];

        return {
            column: col,
            operator: op,
            value: rawNum,
            displayQuery: `${col} ${op} ₹${rawNum.toLocaleString('en-IN')}`
        };
    }

    // 5. Categorical or Year/Value Equality (e.g. "2024 का डेटा", "Electronics केवल", "Mumbai")
    // Check if any distinct cell value appears in query
    for (const h of headers) {
        for (let i = 0; i < Math.min(rawData.length, 100); i++) {
            const cellVal = String(rawData[i][h] || '').trim();
            if (cellVal && cellVal.length >= 3 && q.includes(cellVal.toLowerCase())) {
                return {
                    column: h,
                    operator: '==',
                    value: cellVal,
                    displayQuery: `${h} = "${cellVal}"`
                };
            }
        }
    }

    // 6. Year specific fallback check (e.g. 2020 - 2030)
    const yearMatch = q.match(/\b(20\d\d)\b/);
    if (yearMatch) {
        const year = yearMatch[1];
        const yearCol = matchedCol || headers.find(h => /year|date|साल|वर्ष/i.test(h)) || headers[0];
        return {
            column: yearCol,
            operator: 'contains',
            value: year,
            displayQuery: `${yearCol} में "${year}"`
        };
    }

    return null;
}

export async function applyConversationalFilter(condition: FilterCondition | null): Promise<boolean> {
    if (!rawData || rawData.length === 0) {
        showMessage("फिल्टर करने के लिए कोई डेटा लोड नहीं है।", "warning");
        return false;
    }

    if (!condition) {
        // Reset filter
        filteredData.length = 0;
        rawData.forEach(r => filteredData.push(r));
        currentDataForChat.length = 0;
        filteredData.forEach(r => currentDataForChat.push(r));
        activeConversationalFilter = null;
        updateActiveFilterBadgeUI();
        await updateTableAndUI();
        await plotAll();
        showMessage("सभी फिल्टर हटा दिए गए हैं। पूरा डेटा बहाल किया गया।", "info");
        return true;
    }

    const { column, operator, value } = condition;
    let newFiltered: any[] = [];

    if (operator === 'top') {
        const count = typeof value === 'number' ? value : 10;
        newFiltered = [...rawData].sort((a, b) => {
            const numA = Number(a[column]) || 0;
            const numB = Number(b[column]) || 0;
            return numB - numA;
        }).slice(0, count);
    } else if (operator === '>') {
        newFiltered = rawData.filter(r => (Number(r[column]) || 0) > Number(value));
    } else if (operator === '>=') {
        newFiltered = rawData.filter(r => (Number(r[column]) || 0) >= Number(value));
    } else if (operator === '<') {
        newFiltered = rawData.filter(r => (Number(r[column]) || 0) < Number(value));
    } else if (operator === '<=') {
        newFiltered = rawData.filter(r => (Number(r[column]) || 0) <= Number(value));
    } else if (operator === '==') {
        newFiltered = rawData.filter(r => String(r[column]).trim().toLowerCase() === String(value).trim().toLowerCase());
    } else if (operator === '!=') {
        newFiltered = rawData.filter(r => String(r[column]).trim().toLowerCase() !== String(value).trim().toLowerCase());
    } else if (operator === 'contains') {
        newFiltered = rawData.filter(r => String(r[column]).toLowerCase().includes(String(value).toLowerCase()));
    }

    if (newFiltered.length === 0) {
        showMessage(`शर्त (${condition.displayQuery}) के लिए कोई रिकॉर्ड नहीं मिला। डेटा फ़िल्टर नहीं बदला गया।`, "warning");
        return false;
    }

    filteredData.length = 0;
    newFiltered.forEach(r => filteredData.push(r));
    currentDataForChat.length = 0;
    filteredData.forEach(r => currentDataForChat.push(r));
    activeConversationalFilter = condition;

    updateActiveFilterBadgeUI();
    await updateTableAndUI();
    await plotAll();

    showMessage(`सफलतापूर्वक फ़िल्टर लागू किया गया: ${condition.displayQuery} (${newFiltered.length}/${rawData.length} रिकॉर्ड्स)`, "success");
    return true;
}

export function updateActiveFilterBadgeUI(): void {
    let badgeContainer = document.getElementById('activeConversationalFilterBadge');
    
    if (!activeConversationalFilter) {
        if (badgeContainer) badgeContainer.remove();
        return;
    }

    if (!badgeContainer) {
        const dashboardContent = document.getElementById('dashboardContent') || document.querySelector('main');
        if (dashboardContent) {
            badgeContainer = document.createElement('div');
            badgeContainer.id = 'activeConversationalFilterBadge';
            badgeContainer.className = 'd-flex align-items-center justify-content-between p-2 mb-3 bg-indigo-50 border border-indigo-200 rounded-3 shadow-2xs';
            dashboardContent.insertBefore(badgeContainer, dashboardContent.firstChild);
        }
    }

    if (badgeContainer && activeConversationalFilter) {
        badgeContainer.innerHTML = `
            <div class="d-flex align-items-center gap-2">
                <span class="badge bg-indigo-600 text-white rounded-pill px-2 py-1 text-2xs">
                    <i class="bi bi-funnel-fill me-1"></i> AI Active Filter
                </span>
                <span class="fw-bold text-slate-800 text-xs">
                    ${activeConversationalFilter.displayQuery}
                </span>
                <span class="text-muted text-2xs">
                    (${filteredData.length} रिकॉर्ड्स)
                </span>
            </div>
            <button type="button" class="btn btn-xs btn-outline-danger d-flex align-items-center gap-1 rounded-pill" id="btnResetConversationalFilter">
                <i class="bi bi-x-circle"></i> फ़िल्टर हटाएं
            </button>
        `;

        const resetBtn = document.getElementById('btnResetConversationalFilter');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                applyConversationalFilter(null);
            });
        }
    }
}
