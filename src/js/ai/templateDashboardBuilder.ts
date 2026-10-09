// src/js/ai/templateDashboardBuilder.ts
import { rawData, filteredData, headers, saveDashboardSettings } from '../../store/DataHandler.ts';
import { visualizations, addVisualization, plotAll } from '../charts/charts.ts';
import { createBox } from '../ui/editor.js';
import { showMessage } from '../core/utils.ts';
import { pushUndoSnapshot } from './chat.ts';

export interface DashboardTemplateResult {
    success: boolean;
    domain: 'sales' | 'finance' | 'hr' | 'operations' | 'general';
    title: string;
    kpisCreated: number;
    chartsCreated: number;
    message: string;
}

export async function buildIndustryDashboard(requestedDomain?: string): Promise<DashboardTemplateResult> {
    const data = filteredData.length > 0 ? filteredData : rawData;

    if (!data || data.length === 0 || !headers || headers.length === 0) {
        showMessage("डैशबोर्ड बनाने के लिए डेटा उपलब्ध नहीं है। कृपया पहले डेटा लोड करें।", "warning");
        return {
            success: false,
            domain: 'general',
            title: "No Data",
            kpisCreated: 0,
            chartsCreated: 0,
            message: "No data available to build dashboard."
        };
    }

    // 1. Identify Domain from headers and request
    let domain: 'sales' | 'finance' | 'hr' | 'operations' | 'general' = 'general';
    const headerStr = headers.join(' ').toLowerCase();
    const reqLower = (requestedDomain || '').toLowerCase();

    if (reqLower.includes('sales') || reqLower.includes('बिक्री') || /sales|revenue|order|product|customer|price|qty|बिक्री|ग्राहक/i.test(headerStr)) {
        domain = 'sales';
    } else if (reqLower.includes('finance') || reqLower.includes('वित्तीय') || /profit|expense|budget|cost|income|tax|मुनाफा|लागत|खर्च/i.test(headerStr)) {
        domain = 'finance';
    } else if (reqLower.includes('hr') || reqLower.includes('workforce') || /employee|department|salary|designation|staff|कर्मचारी|विभाग|वेतन/i.test(headerStr)) {
        domain = 'hr';
    } else if (/status|priority|issue|ticket|lead|state|स्थिति/i.test(headerStr)) {
        domain = 'operations';
    }

    // 2. Identify Numeric and Categorical Columns
    const numCols: string[] = [];
    const catCols: string[] = [];

    headers.forEach(h => {
        let numCount = 0;
        let totalCount = 0;
        for (let i = 0; i < Math.min(data.length, 50); i++) {
            const val = data[i][h];
            if (val !== undefined && val !== null && val !== '') {
                totalCount++;
                if (!isNaN(Number(val))) numCount++;
            }
        }
        if (totalCount > 0 && numCount / totalCount >= 0.7) {
            numCols.push(h);
        } else {
            catCols.push(h);
        }
    });

    const primaryNum = numCols[0] || headers[1] || headers[0];
    const secondaryNum = numCols[1] || primaryNum;
    const primaryCat = catCols[0] || headers[0];
    const secondaryCat = catCols[1] || primaryCat;

    // 3. Save current state to Undo Snapshot
    pushUndoSnapshot(`Industry Dashboard: ${domain.toUpperCase()}`);

    // 4. Clear existing charts
    visualizations.length = 0;

    // 5. Compute Stats for 3 KPI Metric Cards
    let totalVal = 0;
    let maxVal = -Infinity;
    let count = 0;

    data.forEach(row => {
        const n = Number(row[primaryNum]);
        if (!isNaN(n)) {
            totalVal += n;
            count++;
            if (n > maxVal) maxVal = n;
        }
    });

    const avgVal = count > 0 ? totalVal / count : 0;
    if (maxVal === -Infinity) maxVal = 0;
    const formatNum = (v: number) => v.toLocaleString('en-IN', { maximumFractionDigits: 1 });

    // 6. Create 3 Top KPI Summary Cards on Dashboard Canvas
    const domainTitles: Record<string, string> = {
        sales: "सेल्स एवं रेवेन्यू एक्जीक्यूटिव डैशबोर्ड",
        finance: "वित्तीय स्वास्थ्य एवं लाभप्रदता डैशबोर्ड",
        hr: "मानव संसाधन एवं वर्कफोर्स एनालिटिक्स",
        operations: "ऑपरेशंस एवं परफॉरमेंस डैशबोर्ड",
        general: "स्मार्ट 360° बिजनेस इंटेलिजेंस डैशबोर्ड"
    };

    const kpi1Html = `
        <div class="p-2.5 text-center">
            <div class="text-2xs fw-bold text-muted text-uppercase mb-1">कुल ${primaryNum}</div>
            <div class="fs-4 fw-bolder text-indigo-700 text-truncate">₹${formatNum(totalVal)}</div>
            <div class="text-2xs text-emerald-600 mt-1"><i class="bi bi-arrow-up-right"></i> ${data.length} कुल रिकॉर्ड्स</div>
        </div>
    `;
    const kpi2Html = `
        <div class="p-2.5 text-center">
            <div class="text-2xs fw-bold text-muted text-uppercase mb-1">औसत प्रति रिकॉर्ड</div>
            <div class="fs-4 fw-bolder text-emerald-700 text-truncate">₹${formatNum(avgVal)}</div>
            <div class="text-2xs text-slate-500 mt-1"><i class="bi bi-calculator"></i> बेंचमार्क स्तर</div>
        </div>
    `;
    const kpi3Html = `
        <div class="p-2.5 text-center">
            <div class="text-2xs fw-bold text-muted text-uppercase mb-1">सर्वोच्च शिखर (Peak)</div>
            <div class="fs-4 fw-bolder text-rose-700 text-truncate">₹${formatNum(maxVal)}</div>
            <div class="text-2xs text-indigo-600 mt-1"><i class="bi bi-trophy-fill"></i> उच्चतम मान</div>
        </div>
    `;

    createBox(20, 20, 0, kpi1Html, "#eef2ff", "slide-in-up");
    createBox(260, 20, 0, kpi2Html, "#ecfdf5", "slide-in-up");
    createBox(500, 20, 0, kpi3Html, "#fff1f2", "slide-in-up");

    // 7. Add Coordinated Charts
    // Chart 1: Bar Chart (Primary Metric by Primary Dimension)
    await addVisualization(
        primaryCat,
        [primaryNum],
        null,
        "bar",
        `${primaryCat} अनुसार ${primaryNum} तुलना`
    );

    // Chart 2: Line / Trend Chart (Sequential or Date Dimension)
    const dateCat = catCols.find(c => /date|month|year|day|समय|तारीख|महीना/i.test(c)) || secondaryCat;
    await addVisualization(
        dateCat,
        [primaryNum],
        null,
        "line",
        `${dateCat} अनुसार ट्रेंड विश्लेषण`
    );

    // Chart 3: Proportional Composition (Donut / Pie / Treemap)
    await addVisualization(
        secondaryCat,
        [secondaryNum],
        null,
        "pie",
        `${secondaryCat} वितरण प्रतिशत`
    );

    // Save and Re-plot all
    await saveDashboardSettings();
    await plotAll();

    showMessage(`सफलतापूर्वक 1-क्लिक '${domainTitles[domain]}' तैयार किया गया! (3 KPIs + 3 चार्ट्स)`, "success");

    return {
        success: true,
        domain,
        title: domainTitles[domain],
        kpisCreated: 3,
        chartsCreated: 3,
        message: `Built ${domainTitles[domain]} with 3 KPI metric cards and 3 charts.`
    };
}
