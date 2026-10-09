// src/js/ai/templateFormulaAgentEngine.ts
/**
 * Vedra BI AI Agent - Template Formula Mastery Engine
 * Equips the AI agent with deep technical knowledge and autonomous execution
 * of all 15 dynamic formulas from the Vedra BI Learning Center (Handbook).
 */

import { FORMULA_CATALOG, FormulaDoc } from '../learning.ts';
import { evaluateFormula, parseFormula, FormulaEvaluationResult } from '../charts/templateFormulaEngine.ts';
import { applyTemplateFormula, createCustomTemplateCard, editTemplateCard } from '../charts/templateCards.ts';
import { rawData, filteredData, headers } from '../../store/DataHandler.ts';
import { visualizations } from '../charts/charts.ts';
import { showMessage } from '../core/utils.ts';
import { pushUndoSnapshot, appendMessageElement } from './chat.ts';

export interface FormulaApplicationResult {
    success: boolean;
    formula: string;
    target: string;
    evaluatedDisplay: string;
    cardTitle: string;
    actionTaken: 'applied_to_existing' | 'created_new';
    message: string;
}

/**
 * Returns formatted prompt context about all 15 formulas for Gemini AI system prompt.
 */
export function getFormulaHandbookPromptContext(): string {
    return `
======================================================================
VEDRA BI LEARNING CENTER & FORMULA HANDBOOK (ALL 15 DYNAMIC FORMULAS)
======================================================================
You possess full technical mastery over all 15 Excel-grade dynamic formulas documented in the Learning Center (src/js/learning.ts & templateFormulaEngine.ts).
You can apply these formulas to ready-made template cards (KPIs, sparklines, gauges, progress bars, textboxes) or create new template cards with these formulas pre-applied!

ALL 15 FORMULAS REFERENCE:
1. =INSERT(Target, Direction, "Text")
   - Usage: Retrieves live value of a specific cell (e.g. A4) or column and concatenates with custom label.
   - Example: =INSERT(A2, R, "Lead Region: ")
2. =SUM(ColumnOrRange, Direction, "Text")
   - Usage: Cumulative total of numerical column (e.g. B or Sales) or range (B2:B20).
   - Example: =SUM(Sales, R, "Total Revenue: ₹") or =SUM(B, R, "Total Sales: $")
3. =AVG(ColumnOrRange, Direction, "Text")
   - Usage: Arithmetic mean across valid numbers in column or range.
   - Example: =AVG(Sales, R, "Avg Order: ₹") or =AVG(B, R, "Average: $")
4. =MAX(ColumnOrRange, Direction, "Text")
   - Usage: Highest transaction/number in column or range.
   - Example: =MAX(Sales, R, "Peak Deal: ₹") or =MAX(B, R, "Highest: $")
5. =MIN(ColumnOrRange, Direction, "Text")
   - Usage: Lowest number in column or range.
   - Example: =MIN(Expenses, R, "Min Cost: ₹") or =MIN(D, R, "Lowest: $")
6. =COUNT(ColumnOrRange, Direction, "Text")
   - Usage: Total active records/rows in column or range.
   - Example: =COUNT(A, R, "Total Records: ") or =COUNT(Region, R, "Active Territories: ")
7. =GROWTH(Current, Prev, Direction, "Text")
   - Usage: Percentage variance ((Current - Prev) / Prev) * 100 with dynamic arrows (▲ / ▼).
   - Example: =GROWTH(C2, B2, R, "MoM Growth: ") or =GROWTH(120, 100, R, "Expansion: ")
8. =DIFF(Target1, Target2, Direction, "Text")
   - Usage: Absolute difference (Target1 - Target2) with +/- signs.
   - Example: =DIFF(C2, D2, R, "Net Profit: ₹") or =DIFF(Sales, Cost, R, "Operating Margin: ₹")
9. =PERCENT(Actual, Max, Direction, "Text")
   - Usage: Quota fulfillment ratio (Actual / Max) * 100%, ideal for progress bars and gauges.
   - Example: =PERCENT(B2, 100000, R, "Quota Met: ") or =PERCENT(Sales, 5000000, R, "Attainment: ")
10. =REMAINING(Goal, Current, Direction, "Text")
    - Usage: Shortfall required to reach goal (Math.max(0, Goal - Current)).
    - Example: =REMAINING(100000, B2, R, "Shortfall: ₹") or =REMAINING(Target, Sales, R, "Deficit: ₹")
11. =STATUS(Target, Threshold, "PassText", "FailText")
    - Usage: Evaluates if Target >= Threshold, returns custom status badges/emojis.
    - Example: =STATUS(B2, 80000, "On Track ✅", "Needs Attention ⚠️") or =STATUS(Sales, 500000, "Goal Met 🏆", "In Progress ⏳")
12. =IF(Condition, "TrueText", "FalseText")
    - Usage: Excel-style boolean evaluation returning distinct branches.
    - Example: =IF(B2>80000, "Tier 1 Partner", "Tier 2 Partner")
13. =LATEST(ColumnName, Direction, "Text")
    - Usage: Retrieves most recent record (bottom-most row) from designated column.
    - Example: =LATEST(Sales, R, "Latest Inflow: ₹") or =LATEST(B, R, "Latest: $")
14. =TOP(ColumnName, N, Direction, "Text")
    - Usage: N-th highest ranked value or category label from metric column.
    - Example: =TOP(Sales, 1, R, "Top Performer: ₹") or =TOP(B, 2, R, "Runner Up: $")
15. =FORMAT(Target, "Style", Direction, "Text")
    - Usage: Formats numbers into "INR" (₹4,82,500 Lakh/Crore), "USD" ($482,500), "EUR", or "PERCENT".
    - Example: =FORMAT(B2, "INR", R, "Net Inflow: ") or =FORMAT(Sales, "USD", R, "Formatted: ")

IMPORTANT EXECUTION RULES:
- When user asks to apply or use a formula on a template card, ALWAYS use the "apply-template-formula" or "create-template-card" action:
  \`\`\`json-actions
  [
    {
      "action": "apply-template-formula",
      "target": "kpi",
      "formula": "=SUM(Sales, R, \\"Total Revenue: ₹\\")",
      "formulaField": "value"
    }
  ]
  \`\`\`
- Direction parameter: "R" puts value on Right of label ("Total: ₹50,000"); "L" puts value on Left ("₹50,000 Total").
- You can target existing cards by their title, or specify "kpi", "sparkline", "gauge", "progress", or "textbox".
`;
}

/**
 * Applies a specific formula to an existing template card, or creates a new one if none exist.
 */
export async function applyFormulaToCard(opts: {
    formula: string;
    target?: string;
    formulaField?: string;
    label?: string;
    cardCategory?: 'kpi' | 'sparkline' | 'gauge' | 'progress' | 'textbox';
}): Promise<FormulaApplicationResult> {
    const rawFormula = opts.formula.trim();
    const formulaField = opts.formulaField || 'value';
    const targetQuery = (opts.target || 'kpi').trim();

    // 1. Validate and evaluate formula first
    const evalResult = evaluateFormula(rawFormula);
    const displayValue = evalResult.display || '0';

    // 2. Push Undo Snapshot
    pushUndoSnapshot(`Apply Formula: ${rawFormula}`);

    // 3. Find matching template card
    const data = filteredData.length > 0 ? filteredData : rawData;
    const existingCards = visualizations.filter(v => v.type === 'template_card' || v.templateCategory);

    let targetCard = existingCards.find(c => {
        if (targetQuery.toLowerCase() === 'all') return true;
        if (c.id === targetQuery || c.id === `container-${targetQuery}`) return true;
        if (c.title && c.title.toLowerCase().includes(targetQuery.toLowerCase())) return true;
        if ((c as any).label && String((c as any).label).toLowerCase().includes(targetQuery.toLowerCase())) return true;
        if (c.templateCategory === targetQuery.toLowerCase()) return true;
        return false;
    });

    if (!targetCard && existingCards.length > 0) {
        // Fallback to the latest template card
        targetCard = existingCards[existingCards.length - 1];
    }

    if (targetCard) {
        // Apply formula to existing card
        const res = await applyTemplateFormula(targetCard.id, rawFormula, formulaField);
        showMessage(`Applied formula ${rawFormula} to "${targetCard.title || 'Card'}"!`, 'success');
        return {
            success: true,
            formula: rawFormula,
            target: targetCard.title || targetCard.id,
            evaluatedDisplay: displayValue,
            cardTitle: targetCard.title || 'Template Card',
            actionTaken: 'applied_to_existing',
            message: `फॉर्मूला \`${rawFormula}\` कार्ड **"${targetCard.title || 'Template Card'}"** पर लागू कर दिया गया। मान: **${displayValue}**`
        };
    } else {
        // Create a new template card with this formula pre-applied
        const category = opts.cardCategory || (rawFormula.includes('STATUS') || rawFormula.includes('IF') ? 'kpi' : (rawFormula.includes('PERCENT') || rawFormula.includes('REMAINING') ? 'gauge' : 'kpi'));
        const newCard = await createCustomTemplateCard({
            category: category,
            label: opts.label || `${evalResult.fnType || 'Formula'} Metric`,
            formula: rawFormula,
            formulaField: formulaField,
            badge: `ƒ(x) ${evalResult.fnType || 'Learning Formula'}`
        });

        showMessage(`Created ready-made template card with formula ${rawFormula}!`, 'success');
        return {
            success: true,
            formula: rawFormula,
            target: newCard.title,
            evaluatedDisplay: displayValue,
            cardTitle: newCard.title,
            actionTaken: 'created_new',
            message: `नया रेडी-मेड टेम्पलेट कार्ड **"${newCard.title}"** बनाया गया और फॉर्मूला \`${rawFormula}\` लगाया गया। मान: **${displayValue}**`
        };
    }
}

/**
 * Intelligent natural language parser to map user queries to the 15 formulas.
 */
export async function smartDetectAndExecuteFormula(userText: string): Promise<FormulaApplicationResult | null> {
    const text = userText.trim();
    const data = filteredData.length > 0 ? filteredData : rawData;
    const cols = headers && headers.length > 0 ? headers : (data && data.length > 0 ? Object.keys(data[0]) : []);

    // 1. Direct formula input (e.g. "=SUM(Sales, R, 'Total: ')")
    if (text.startsWith('=')) {
        return await applyFormulaToCard({ formula: text });
    }

    // Direct formula inside text: `=FUNCTION(...)`
    const formulaMatch = text.match(/=([A-Z]+)\s*\(([^)]+)\)/i);
    if (formulaMatch) {
        return await applyFormulaToCard({ formula: formulaMatch[0] });
    }

    // 2. Identify candidate numerical and categorical columns
    let numCol = cols.find(c => /sales|revenue|profit|cost|price|amount|total|volume|quantity|deal|inflow|budget/i.test(c)) || cols[1] || cols[0] || 'Sales';
    let catCol = cols.find(c => /city|region|state|category|department|name|product|item|type|month|quarter/i.test(c)) || cols[0] || 'Category';

    // 3. Match user intent to the 15 formulas
    // SUM
    if (/\b(sum|कुल|जोड़|total|योग)\b/i.test(text) && !/summary|summarize/i.test(text)) {
        const formula = `=SUM(${numCol}, R, "Total ${numCol}: ₹")`;
        return await applyFormulaToCard({ formula, label: `Total ${numCol}` });
    }

    // AVG
    if (/\b(avg|average|औसत|mean)\b/i.test(text)) {
        const formula = `=AVG(${numCol}, R, "Avg ${numCol}: ₹")`;
        return await applyFormulaToCard({ formula, label: `Average ${numCol}` });
    }

    // MAX
    if (/\b(max|maximum|highest|अधिकतम|सबसे\s*बड़ा|peak)\b/i.test(text)) {
        const formula = `=MAX(${numCol}, R, "Peak ${numCol}: ₹")`;
        return await applyFormulaToCard({ formula, label: `Peak ${numCol}` });
    }

    // MIN
    if (/\b(min|minimum|lowest|न्यूनतम|सबसे\s*कम)\b/i.test(text)) {
        const formula = `=MIN(${numCol}, R, "Lowest ${numCol}: ₹")`;
        return await applyFormulaToCard({ formula, label: `Lowest ${numCol}` });
    }

    // COUNT
    if (/\b(count|गिनती|संख्या|rows|records|फ्रीक्वेंसी)\b/i.test(text)) {
        const formula = `=COUNT(A, R, "Total Records: ")`;
        return await applyFormulaToCard({ formula, label: "Total Record Count" });
    }

    // GROWTH
    if (/\b(growth|वृद्धि|momentum|qoq|mom|yoy|percent\s*change)\b/i.test(text)) {
        const formula = `=GROWTH(C2, B2, R, "Growth: ")`;
        return await applyFormulaToCard({ formula, label: "Period Growth Rate" });
    }

    // DIFF
    if (/\b(diff|difference|अंतर|variance|delta|मार्जिन)\b/i.test(text)) {
        const formula = `=DIFF(C2, D2, R, "Net Margin: ₹")`;
        return await applyFormulaToCard({ formula, label: "Variance Delta" });
    }

    // PERCENT
    if (/\b(percent|percentage|प्रतिशत|quota|target\s*met|attainment)\b/i.test(text)) {
        const formula = `=PERCENT(${numCol}, 1000000, R, "Quota Met: ")`;
        return await applyFormulaToCard({ formula, label: "Quota Attainment", cardCategory: 'progress' });
    }

    // REMAINING
    if (/\b(remaining|शेष|बचा|shortfall|deficit)\b/i.test(text)) {
        const formula = `=REMAINING(1000000, ${numCol}, R, "Goal Deficit: ₹")`;
        return await applyFormulaToCard({ formula, label: "Goal Deficit" });
    }

    // STATUS
    if (/\b(status|स्थिति|ऑन\s*ट्रैक|track|alert|सत्यापन)\b/i.test(text)) {
        const formula = `=STATUS(${numCol}, 50000, "On Track ✅", "Needs Attention ⚠️")`;
        return await applyFormulaToCard({ formula, label: "Performance Status" });
    }

    // IF
    if (/\b(if|कंडीशन|शर्त|branch|conditional)\b/i.test(text)) {
        const formula = `=IF(B2>80000, "Tier 1 Elite", "Tier 2 Standard")`;
        return await applyFormulaToCard({ formula, label: "Tier Assessment" });
    }

    // LATEST
    if (/\b(latest|हालिया|नवीनतम|recent|bottom|inflow)\b/i.test(text)) {
        const formula = `=LATEST(${numCol}, R, "Latest Inflow: ₹")`;
        return await applyFormulaToCard({ formula, label: `Latest ${numCol}` });
    }

    // TOP
    if (/\b(top|रैंक|लीडर|शीर्ष|top\s*performer|नंबर\s*वन)\b/i.test(text)) {
        const formula = `=TOP(${numCol}, 1, R, "Leader: ₹")`;
        return await applyFormulaToCard({ formula, label: `Top ${numCol} Performer` });
    }

    // FORMAT
    if (/\b(format|स्वरूपण|inr|currency|मुद्रा|रुपया)\b/i.test(text)) {
        const formula = `=FORMAT(B2, "INR", R, "Total Inflow: ")`;
        return await applyFormulaToCard({ formula, label: "Formatted Metric" });
    }

    // INSERT
    if (/\b(insert|सेल\s*डालो|cell\s*value|कैटरीना|रेफरेंस)\b/i.test(text)) {
        const formula = `=INSERT(A2, R, "Lead: ")`;
        return await applyFormulaToCard({ formula, label: "Live Cell Reference" });
    }

    return null;
}

/**
 * Generates an interactive Formula Handbook Deck inside the chat.
 * Shows all 15 formulas with live calculation examples and 1-click execution chips!
 */
export function renderFormulaHandbookCard(lang: 'hi' | 'en' = 'hi'): { html: string } {
    const isHi = lang === 'hi';
    const data = filteredData.length > 0 ? filteredData : rawData;
    const cols = headers && headers.length > 0 ? headers : (data && data.length > 0 ? Object.keys(data[0]) : ['Sales', 'Region', 'Profit']);
    const numCol = cols.find(c => /sales|revenue|profit|amount|budget|cost/i.test(c)) || cols[1] || 'Sales';

    const formulaGroups = [
        {
            groupName: isHi ? '1. अंकगणितीय संकलन (Aggregates)' : '1. Mathematical Aggregates',
            items: [
                { fn: 'SUM', sig: `=SUM(${numCol}, R, "Total: ₹")`, desc: isHi ? 'कॉलम या रेंज का कुल जोड़ निकालता है।' : 'Calculates cumulative total of column or range.' },
                { fn: 'AVG', sig: `=AVG(${numCol}, R, "Avg: ₹")`, desc: isHi ? 'कॉलम के सभी मानों का अंकगणितीय औसत निकालता है।' : 'Computes arithmetic mean across all valid numbers.' },
                { fn: 'MAX', sig: `=MAX(${numCol}, R, "Peak: ₹")`, desc: isHi ? 'कॉलम का सबसे उच्चतम मान खोजता है।' : 'Finds highest peak transaction.' },
                { fn: 'MIN', sig: `=MIN(${numCol}, R, "Min: ₹")`, desc: isHi ? 'कॉलम का सबसे न्यूनतम मान खोजता है।' : 'Finds smallest numerical value.' },
                { fn: 'COUNT', sig: `=COUNT(A, R, "Records: ")`, desc: isHi ? 'सक्रिय पंक्तियों/रिकॉर्ड्स की कुल संख्या गिनता है।' : 'Counts active, non-empty records.' },
            ]
        },
        {
            groupName: isHi ? '2. वृद्धि एवं अंतर (Growth & Variance)' : '2. Growth & Variance Analysis',
            items: [
                { fn: 'GROWTH', sig: `=GROWTH(C2, B2, R, "Growth: ")`, desc: isHi ? 'प्रतिशत वृद्धि दर ((Current - Prev) / Prev * 100) और तीर (▲/▼) दिखाता है।' : 'Calculates percentage change with direction arrows.' },
                { fn: 'DIFF', sig: `=DIFF(C2, D2, R, "Margin: ₹")`, desc: isHi ? 'दो सेलों या कॉलमों के बीच का वास्तविक अंतर (+/-) निकालता है।' : 'Computes absolute difference (Target1 - Target2).' },
            ]
        },
        {
            groupName: isHi ? '3. लक्ष्य एवं प्रोग्रेस (Goals & Gauges)' : '3. Goals, Quotas & Gauges',
            items: [
                { fn: 'PERCENT', sig: `=PERCENT(${numCol}, 1000000, R, "Quota Met: ")`, desc: isHi ? 'कोटा पूर्ति अनुपात (Actual/Max * 100%) प्रोग्रेस बार हेतु।' : 'Quota fulfillment percentage ratio for progress & gauges.' },
                { fn: 'REMAINING', sig: `=REMAINING(1000000, ${numCol}, R, "Shortfall: ₹")`, desc: isHi ? 'लक्ष्य तक पहुंचने के लिए शेष आवश्यक राशि की गणना करता है।' : 'Remaining amount needed to achieve target quota.' },
            ]
        },
        {
            groupName: isHi ? '4. तार्किक शर्तें एवं बैज (Logic & Status)' : '4. Logic, Status & Alerts',
            items: [
                { fn: 'STATUS', sig: `=STATUS(${numCol}, 50000, "On Track ✅", "Needs Attention ⚠️")`, desc: isHi ? 'थ्रेशोल्ड की जांच करके कस्टम स्थिति बैज या इमोजी देता है।' : 'Evaluates threshold and returns custom status badge.' },
                { fn: 'IF', sig: `=IF(B2>80000, "Tier 1 Partner", "Tier 2 Partner")`, desc: isHi ? 'एक्सेल शैली की शर्तों के आधार पर परिणाम देता है।' : 'Excel-style boolean conditional evaluations.' },
            ]
        },
        {
            groupName: isHi ? '5. रियल-टाइम रिकॉर्ड्स एवं रैंकिंग (Capture & Rank)' : '5. Real-Time Capture & Ranking',
            items: [
                { fn: 'LATEST', sig: `=LATEST(${numCol}, R, "Latest Inflow: ₹")`, desc: isHi ? 'कॉलम की अंतिम/सबसे हालिया पंक्ति का मान निकालता है।' : 'Extracts bottom-most (most recent) record.' },
                { fn: 'TOP', sig: `=TOP(${numCol}, 1, R, "Top Performer: ₹")`, desc: isHi ? 'कॉलम में से N-वें उच्चतम रैंक वाले मान को निकालता है।' : 'Returns N-th highest ranked value or category.' },
                { fn: 'INSERT', sig: `=INSERT(A2, R, "Lead: ")`, desc: isHi ? 'किसी विशिष्ट सेल का लाइव मान लेबल के साथ दिखाता है।' : 'Pulls live cell coordinate reference with custom text.' },
            ]
        },
        {
            groupName: isHi ? '6. मुद्रा एवं स्वरूपण (Currency & Formatting)' : '6. Currency & Formatting',
            items: [
                { fn: 'FORMAT', sig: `=FORMAT(B2, "INR", R, "Total: ")`, desc: isHi ? 'भारतीय रुपया (₹ Lakh/Crore), USD ($), EUR (€) या % में स्वरूपित करता है।' : 'Formats into Indian Rupee (INR), USD, EUR, or Percent.' },
            ]
        }
    ];

    let groupsHtml = '';
    formulaGroups.forEach(group => {
        let itemsHtml = '';
        group.items.forEach(item => {
            // Live evaluation sample
            const evalResult = evaluateFormula(item.sig);
            const liveDisplay = evalResult.display || 'Live';

            itemsHtml += `
                <div class="formula-item-row p-2 bg-white rounded border mb-1.5 shadow-2xs">
                    <div class="d-flex align-items-center justify-content-between mb-1">
                        <span class="badge bg-indigo-100 text-indigo-800 fw-bold font-monospace text-3xs">ƒ(x) ${item.fn}</span>
                        <span class="badge bg-emerald-50 text-emerald-700 border border-emerald-200 text-3xs" title="Live Calculated Result">
                            लाइव मान: <strong>${escapeHtml(liveDisplay)}</strong>
                        </span>
                    </div>
                    <code class="d-block text-xs text-indigo-900 bg-slate-50 p-1 rounded border font-monospace mb-1 user-select-all" style="word-break: break-all;">
                        ${escapeHtml(item.sig)}
                    </code>
                    <p class="text-slate-600 text-3xs mb-2" style="line-height: 1.3;">${escapeHtml(item.desc)}</p>
                    <div class="d-flex align-items-center gap-1.5">
                        <button class="btn btn-2xs btn-primary d-inline-flex align-items-center gap-1 btn-apply-this-formula" data-formula="${escapeHtml(item.sig)}">
                            <i class="bi bi-play-fill"></i> ${isHi ? 'कार्ड पर लगाएं' : 'Apply to Card'}
                        </button>
                        <button class="btn btn-2xs btn-outline-secondary d-inline-flex align-items-center gap-1 btn-create-card-formula" data-formula="${escapeHtml(item.sig)}" data-fn="${item.fn}">
                            <i class="bi bi-plus-circle"></i> ${isHi ? '+ नया कार्ड बनाएं' : '+ New Card'}
                        </button>
                    </div>
                </div>
            `;
        });

        groupsHtml += `
            <div class="mb-3">
                <div class="fw-bold text-slate-800 text-2xs text-uppercase mb-1.5 pb-1 border-bottom d-flex align-items-center gap-1">
                    <i class="bi bi-folder-fill text-indigo-500"></i> ${group.groupName}
                </div>
                ${itemsHtml}
            </div>
        `;
    });

    const html = `
        <div class="learning-formula-handbook-card p-3 rounded-3 border shadow-sm" style="background: #f8fafc; border-color: #cbd5e1 !important; border-left: 4px solid #4f46e5 !important;">
            <div class="d-flex align-items-center justify-content-between mb-2">
                <div class="d-flex align-items-center gap-2">
                    <span class="badge bg-indigo-600 text-white p-1 rounded"><i class="bi bi-mortarboard-fill"></i></span>
                    <div>
                        <strong class="text-slate-900 text-xs d-block">
                            ${isHi ? 'लर्निंग मेनू: 15 डायनामिक फॉर्मूले' : 'Learning Handbook: All 15 Dynamic Formulas'}
                        </strong>
                        <span class="text-slate-500 text-3xs">
                            ${isHi ? 'रेडी-मेड टेम्पलेट कार्ड्स पर लाइव गणना व डेटा इंसर्ट करने हेतु पूर्ण क्षमता' : 'Production-ready Excel-grade formulas for Template Cards'}
                        </span>
                    </div>
                </div>
                <span class="badge bg-indigo-100 text-indigo-700 text-3xs">v1.2 Handbook</span>
            </div>

            <p class="text-slate-700 text-2xs mb-2.5" style="line-height: 1.4;">
                ${isHi 
                    ? 'आप इन सभी 15 फॉर्मूलों को सीधे चैट में लिखकर या नीचे दिए गए बटनों पर क्लिक करके किसी भी रेडी-मेड कार्ड पर लगा सकते हैं। दिशा (Direction): <code>R</code> मान दाईं ओर रखता है, <code>L</code> मान बाईं ओर रखता है।'
                    : 'All 15 formulas are fully integrated. Type any formula or click the buttons below to apply them to your template cards reactively.'}
            </p>

            <div class="formula-list-container" style="max-height: 380px; overflow-y: auto; padding-right: 4px;">
                ${groupsHtml}
            </div>

            <div class="pt-2 mt-2 border-top d-flex align-items-center justify-content-between text-3xs text-slate-500">
                <span><i class="bi bi-lightning-charge-fill text-amber-500"></i> रिएक्टिव अपडेट्स: ग्रिड एडिट होते ही कार्ड स्वतः अपडेट होते हैं</span>
                <span class="badge bg-light text-secondary border font-monospace">R=Right, L=Left</span>
            </div>
        </div>
    `;

    return { html };
}

/**
 * Attaches event listeners to the interactive handbook card inside chat rows.
 */
export function attachFormulaCardListeners(container: HTMLElement): void {
    container.querySelectorAll<HTMLButtonElement>('.btn-apply-this-formula').forEach(btn => {
        btn.addEventListener('click', async () => {
            const formula = btn.getAttribute('data-formula');
            if (!formula) return;
            btn.disabled = true;
            btn.innerHTML = `<span class="spinner-border spinner-border-sm" role="status"></span> लागू हो रहा है...`;
            const res = await applyFormulaToCard({ formula });
            btn.disabled = false;
            btn.innerHTML = `<i class="bi bi-check-lg text-success"></i> लागू हुआ`;
            appendMessageElement(res.message, 'assistant', false, true);
        });
    });

    container.querySelectorAll<HTMLButtonElement>('.btn-create-card-formula').forEach(btn => {
        btn.addEventListener('click', async () => {
            const formula = btn.getAttribute('data-formula');
            const fn = btn.getAttribute('data-fn') || 'Formula';
            if (!formula) return;
            btn.disabled = true;
            btn.innerHTML = `<span class="spinner-border spinner-border-sm" role="status"></span> कार्ड बन रहा है...`;
            const res = await applyFormulaToCard({
                formula,
                label: `${fn} Metric Card`,
                target: `new-card-${Date.now()}`
            });
            btn.disabled = false;
            btn.innerHTML = `<i class="bi bi-check-lg text-success"></i> कार्ड बन गया`;
            appendMessageElement(res.message, 'assistant', false, true);
        });
    });
}

function escapeHtml(str: string): string {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
