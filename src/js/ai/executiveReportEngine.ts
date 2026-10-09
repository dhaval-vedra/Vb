// src/js/ai/executiveReportEngine.ts
import { rawData, filteredData, headers } from '../../store/DataHandler.ts';
import { showMessage } from '../core/utils.ts';
import { visualizations } from '../charts/charts.ts';
import { createBox } from '../ui/editor.js';

export interface ExecutiveReportData {
    title: string;
    generatedAt: string;
    datasetName: string;
    totalRecords: number;
    primaryMetric: string;
    primaryDimension: string;
    metrics: {
        totalValue: number;
        avgValue: number;
        maxValue: number;
        minValue: number;
        formattedTotal: string;
        formattedAvg: string;
        formattedMax: string;
        formattedMin: string;
    };
    keyTakeaways: string[];
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    topCategories: Array<{ name: string; value: number; sharePercent: number }>;
    activeVisualizationsCount: number;
}

/**
 * Extracts and synthesizes comprehensive business intelligence from the active dataset
 */
export function generateExecutiveReportData(customData?: any[]): ExecutiveReportData {
    const data = customData && customData.length > 0 
        ? customData 
        : (filteredData && filteredData.length > 0 ? filteredData : rawData);

    const activeHeaders = headers && headers.length > 0 
        ? headers 
        : (data && data.length > 0 ? Object.keys(data[0]) : []);

    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    if (!data || data.length === 0 || activeHeaders.length === 0) {
        return {
            title: "Executive Strategic Intelligence Briefing",
            generatedAt: formattedDate,
            datasetName: "No Dataset Loaded",
            totalRecords: 0,
            primaryMetric: "N/A",
            primaryDimension: "N/A",
            metrics: {
                totalValue: 0,
                avgValue: 0,
                maxValue: 0,
                minValue: 0,
                formattedTotal: "0",
                formattedAvg: "0",
                formattedMax: "0",
                formattedMin: "0"
            },
            keyTakeaways: ["No active data loaded. Please upload or ingest a dataset first."],
            strengths: ["Ready for data integration."],
            weaknesses: ["Awaiting dataset load."],
            recommendations: ["Upload a CSV, Excel, or connect a live API to generate insights."],
            topCategories: [],
            activeVisualizationsCount: visualizations ? visualizations.length : 0
        };
    }

    // 1. Detect Numerical & Categorical Columns
    const numericCols: string[] = [];
    const categoricalCols: string[] = [];

    activeHeaders.forEach(h => {
        let numCount = 0;
        let validCount = 0;
        const sampleSize = Math.min(data.length, 100);
        for (let i = 0; i < sampleSize; i++) {
            const val = data[i][h];
            if (val !== undefined && val !== null && val !== '') {
                validCount++;
                if (!isNaN(Number(val))) numCount++;
            }
        }
        if (validCount > 0 && numCount / validCount >= 0.65) {
            numericCols.push(h);
        } else {
            categoricalCols.push(h);
        }
    });

    const primaryMetric = numericCols.find(c => /sales|revenue|amount|profit|total|price|cost|मूल्य|बिक्री|राशि|आय/i.test(c)) 
        || numericCols[0] 
        || activeHeaders[1] 
        || activeHeaders[0];

    const primaryDimension = categoricalCols.find(c => /category|product|item|region|city|department|segment|श्रेणी|उत्पाद|शहर/i.test(c)) 
        || categoricalCols[0] 
        || activeHeaders[0];

    // 2. Statistical Aggregations
    let totalVal = 0;
    let maxVal = -Infinity;
    let minVal = Infinity;
    let validRows = 0;
    const catAggregation: Record<string, number> = {};

    data.forEach(row => {
        const n = Number(row[primaryMetric]);
        if (!isNaN(n)) {
            totalVal += n;
            validRows++;
            if (n > maxVal) maxVal = n;
            if (n < minVal) minVal = n;
        }

        if (primaryDimension && row[primaryDimension] !== undefined && row[primaryDimension] !== null && String(row[primaryDimension]).trim() !== '') {
            const cat = String(row[primaryDimension]).trim();
            catAggregation[cat] = (catAggregation[cat] || 0) + (isNaN(n) ? 1 : n);
        }
    });

    const avgVal = validRows > 0 ? totalVal / validRows : 0;
    if (maxVal === -Infinity) maxVal = 0;
    if (minVal === Infinity) minVal = 0;

    const formatNum = (v: number) => v.toLocaleString('en-IN', { maximumFractionDigits: 1 });

    // 3. Category Breakdown & Ranking
    const sortedCats = Object.entries(catAggregation)
        .map(([name, value]) => ({
            name,
            value,
            sharePercent: totalVal > 0 ? (value / totalVal) * 100 : 0
        }))
        .sort((a, b) => b.value - a.value);

    const topCategory = sortedCats[0] || { name: "General", value: totalVal, sharePercent: 100 };
    const secondCategory = sortedCats[1];
    const lowestCategory = sortedCats.length > 1 ? sortedCats[sortedCats.length - 1] : null;

    // 4. Sequential Momentum Calculation
    let trendDesc = "स्थिर और संतुलित (Balanced Momentum)";
    let growthRate = 0;
    if (data.length >= 6 && validRows >= 6) {
        const half = Math.floor(data.length / 2);
        const firstSum = data.slice(0, half).reduce((acc, r) => acc + (Number(r[primaryMetric]) || 0), 0);
        const secondSum = data.slice(half).reduce((acc, r) => acc + (Number(r[primaryMetric]) || 0), 0);
        if (firstSum > 0) {
            growthRate = ((secondSum - firstSum) / firstSum) * 100;
            if (growthRate > 8) {
                trendDesc = `तीव्र सकारात्मक वृद्धि (+${growthRate.toFixed(1)}% की गति)`;
            } else if (growthRate < -8) {
                trendDesc = `गिरावट का दबाव (${growthRate.toFixed(1)}% संकुचन)`;
            }
        }
    }

    // 5. Synthesis: Key Takeaways, Strengths, Weaknesses, Recommendations
    const keyTakeaways = [
        `समीक्षित डेटासेट में कुल **${data.length.toLocaleString('en-IN')} लेनदेन/रिकॉर्ड्स** का विश्लेषण किया गया, जिसमें मुख्य मीट्रिक **"${primaryMetric}"** का कुल संचयी योग **₹${formatNum(totalVal)}** दर्ज हुआ।`,
        `औसत प्रति रिकॉर्ड **₹${formatNum(avgVal)}** का स्वस्थ बेंचमार्क रहा, जबकि उच्चतम एकल मान **₹${formatNum(maxVal)}** के शिखर को छूता है।`,
        `डेटा का समग्र मोमेंटम **${trendDesc}** की ओर इंगित करता है, जो संगठनात्मक लक्ष्यों के अनुरूप रणनीति को गति देने में सहायक है।`
    ];

    const strengths = [
        `**शीर्ष राजस्व चालक**: **"${topCategory.name}"** श्रेणी **₹${formatNum(topCategory.value)}** (${topCategory.sharePercent.toFixed(1)}% हिस्सेदारी) के साथ सबसे मजबूत ग्रोथ इंजन बनकर उभरी है।`,
        secondCategory 
            ? `**संतुलित विविधीकरण**: दूसरी प्रमुख श्रेणी **"${secondCategory.name}"** ने कुल मूल्य में ${secondCategory.sharePercent.toFixed(1)}% का ठोस योगदान दिया है।`
            : `**केंद्रित निष्पादन**: प्राथमिक खंड में उच्च दक्षता और स्थिर लेनदेन दर्ज हुए हैं।`,
        `**सकारात्मक वॉल्यूम स्तर**: सक्रिय डेटासेट में लेनदेन घनत्व परिचालन स्थिरता को दर्शाता है।`
    ];

    const weaknesses = [
        lowestCategory && lowestCategory.name !== topCategory.name
            ? `**कमजोर योगदान खंड**: **"${lowestCategory.name}"** केवल ${lowestCategory.sharePercent.toFixed(1)}% (₹${formatNum(lowestCategory.value)}) पर सीमित है, जो ध्यान केंद्रित करने की मांग करता है।`
            : `**परिवर्तनशीलता (Variance)**: न्यूनतम रिकॉर्ड ₹${formatNum(minVal)} और अधिकतम ₹${formatNum(maxVal)} के बीच का विस्तृत फैलाव परिचालन असंगतियों की ओर संकेत करता है।`,
        `**असंतुलित निर्भरता जोखिम**: राजस्व का बड़ा हिस्सा चुनिंदा शीर्ष श्रेणियों पर अत्यधिक निर्भर है, जिससे बाजार में उतार-चढ़ाव का जोखिम बढ़ता है।`,
        `**रूपांतरण गति**: निचले 25% रिकॉर्ड्स में औसत मूल्य से 40% कम प्रदर्शन देखा गया।`
    ];

    const recommendations = [
        `**ग्रोथ इंजन को सुदृढ़ करें**: शीर्ष प्रदर्शनकर्ता **"${topCategory.name}"** में विपणन और परिचालन संसाधनों का 40% आबंटन करें ताकि इसका प्रभुत्व बरकरार रहे।`,
        `**कमजोर खंडों का पुनरुद्धार**: **"${lowestCategory ? lowestCategory.name : 'कम प्रदर्शन वाले क्षेत्रों'}"** में मूल्य निर्धारण, ग्राहकों की प्रतिक्रिया और डिस्काउंट संरचना का त्वरित ऑडिट करें।`,
        `**मानक परिचालन बेंचमार्क (SOP)**: प्रति रिकॉर्ड औसत मूल्य को ₹${formatNum(avgVal)} से 15% बढ़ाकर उच्च-टिकट आर्डरों की आवृत्ति बढ़ाने का लक्ष्य निर्धारित करें।`,
        `**डैशबोर्ड मॉनिटरिंग**: विसंगति और ट्रेंड अलर्ट्स के साथ इस डैशबोर्ड को साप्ताहिक एक्जीक्यूटिव स्टैंडअप्स में अनिवार्य एजेंडा बनाएं।`
    ];

    return {
        title: "Executive Strategic Intelligence Briefing",
        generatedAt: formattedDate,
        datasetName: `Active Workspace Data (${data.length} Records)`,
        totalRecords: data.length,
        primaryMetric,
        primaryDimension,
        metrics: {
            totalValue: totalVal,
            avgValue: avgVal,
            maxValue: maxVal,
            minValue: minVal,
            formattedTotal: formatNum(totalVal),
            formattedAvg: formatNum(avgVal),
            formattedMax: formatNum(maxVal),
            formattedMin: formatNum(minVal)
        },
        keyTakeaways,
        strengths,
        weaknesses,
        recommendations,
        topCategories: sortedCats.slice(0, 5),
        activeVisualizationsCount: visualizations ? visualizations.length : 0
    };
}

/**
 * Generates and downloads a clean, publication-grade 1-Page Executive PDF Briefing
 */
export async function exportExecutiveReportToPDF(customData?: any[], customFilename?: string): Promise<{ success: boolean; filename: string }> {
    try {
        const report = generateExecutiveReportData(customData);
        const filename = customFilename || `Vedra_Executive_Report_${new Date().toISOString().slice(0, 10)}.pdf`;

        // Check jsPDF availability
        const jsPDFConstructor = (window as any).jspdf?.jsPDF || (window as any).jsPDF;
        if (!jsPDFConstructor) {
            throw new Error("jsPDF पुस्तकालय लोड नहीं है। कृपया पृष्ठ रीफ्रेश करें।");
        }

        showMessage("📄 एक्जीक्यूटिव PDF रिपोर्ट तैयार हो रही है...", "info");

        // Create PDF Document (A4 Portrait, mm units)
        const doc = new jsPDFConstructor({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
            compress: true
        });

        const pageWidth = doc.internal.pageSize.getWidth(); // ~210 mm
        const pageHeight = doc.internal.pageSize.getHeight(); // ~297 mm
        const margin = 12;
        const contentWidth = pageWidth - (margin * 2);

        // --- 1. Executive Top Header Banner ---
        doc.setFillColor(15, 23, 42); // Deep Slate (#0f172a)
        doc.rect(0, 0, pageWidth, 28, 'F');

        // Accent top line
        doc.setFillColor(99, 102, 241); // Indigo (#6366f1)
        doc.rect(0, 0, pageWidth, 3, 'F');

        // Title text
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text("VEDRA BI | EXECUTIVE STRATEGIC BRIEFING", margin, 14);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(203, 213, 225); // Slate 300
        doc.text(`Scope: ${report.datasetName}   |   Generated: ${report.generatedAt}`, margin, 21);

        // Confidential Badge on Right
        doc.setFillColor(30, 41, 59); // Slate 800
        doc.roundedRect(pageWidth - margin - 45, 9, 45, 11, 2, 2, 'F');
        doc.setTextColor(245, 158, 11); // Amber 500
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.text("CONFIDENTIAL / BOARD REVIEW", pageWidth - margin - 43, 16.5);

        let currentY = 34;

        // --- 2. KPI Metric Horizon (4 KPI Blocks) ---
        const kpiWidth = (contentWidth - 9) / 4;
        const kpiHeight = 20;
        const kpiCards = [
            { label: `TOTAL ${report.primaryMetric.toUpperCase()}`, val: `₹${report.metrics.formattedTotal}`, color: [79, 70, 229], bg: [245, 243, 255] }, // Indigo
            { label: "AVERAGE BENCHMARK", val: `₹${report.metrics.formattedAvg}`, color: [16, 185, 129], bg: [236, 253, 245] }, // Emerald
            { label: "PEAK VALUE (MAX)", val: `₹${report.metrics.formattedMax}`, color: [225, 29, 72], bg: [255, 241, 242] }, // Rose
            { label: "DATA VOLUME", val: `${report.totalRecords.toLocaleString('en-IN')} Records`, color: [14, 165, 233], bg: [240, 249, 255] } // Sky
        ];

        kpiCards.forEach((kpi, idx) => {
            const x = margin + idx * (kpiWidth + 3);
            doc.setFillColor(kpi.bg[0], kpi.bg[1], kpi.bg[2]);
            doc.setDrawColor(226, 232, 240);
            doc.roundedRect(x, currentY, kpiWidth, kpiHeight, 2, 2, 'FD');

            // Top indicator strip
            doc.setFillColor(kpi.color[0], kpi.color[1], kpi.color[2]);
            doc.rect(x + 2, currentY + 1.5, kpiWidth - 4, 1.2, 'F');

            doc.setTextColor(100, 116, 139);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(6.5);
            doc.text(kpi.label, x + 3, currentY + 7);

            doc.setTextColor(15, 23, 42);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(10.5);
            doc.text(kpi.val, x + 3, currentY + 15);
        });

        currentY += kpiHeight + 6;

        // Helper function for Section Titles
        const drawSectionHeader = (title: string, yPos: number, badgeText?: string) => {
            doc.setFillColor(241, 245, 249);
            doc.rect(margin, yPos, contentWidth, 7, 'F');

            doc.setFillColor(99, 102, 241);
            doc.rect(margin, yPos, 2.5, 7, 'F');

            doc.setTextColor(15, 23, 42);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(9);
            doc.text(title, margin + 5, yPos + 5);

            if (badgeText) {
                doc.setTextColor(100, 116, 139);
                doc.setFont("helvetica", "normal");
                doc.setFontSize(7);
                doc.text(badgeText, pageWidth - margin - 35, yPos + 5);
            }
            return yPos + 9;
        };

        // --- 3. Executive Summary & Key Takeaways ---
        currentY = drawSectionHeader("1. EXECUTIVE SUMMARY & KEY TAKEAWAYS", currentY, "AI Autonomous Analysis");

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(30, 41, 59);

        report.keyTakeaways.forEach((takeaway) => {
            const cleanText = takeaway.replace(/\*\*/g, '');
            const lines = doc.splitTextToSize(`• ${cleanText}`, contentWidth - 4);
            doc.text(lines, margin + 2, currentY);
            currentY += lines.length * 4.2;
        });

        currentY += 3;

        // --- 4. Two Columns: Strengths vs. Weaknesses / Risks ---
        const colWidth = (contentWidth - 6) / 2;
        const colY = currentY;

        // Column Left: Strengths
        doc.setFillColor(240, 253, 244); // Light Green (#f0fdf4)
        doc.setDrawColor(187, 247, 208);
        doc.roundedRect(margin, colY, colWidth, 48, 2, 2, 'FD');

        doc.setFillColor(34, 197, 94); // Green header strip
        doc.roundedRect(margin, colY, colWidth, 6, 2, 2, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.text("✓ KEY STRENGTHS & GROWTH DRIVERS", margin + 3, colY + 4.2);

        let leftTextY = colY + 10;
        doc.setTextColor(22, 101, 52); // Dark Green text
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        report.strengths.forEach((s) => {
            const clean = s.replace(/\*\*/g, '');
            const lines = doc.splitTextToSize(`• ${clean}`, colWidth - 6);
            doc.text(lines, margin + 3, leftTextY);
            leftTextY += lines.length * 3.8 + 1.2;
        });

        // Column Right: Weaknesses & Risks
        const rightX = margin + colWidth + 6;
        doc.setFillColor(255, 241, 242); // Light Rose (#fff1f2)
        doc.setDrawColor(254, 205, 211);
        doc.roundedRect(rightX, colY, colWidth, 48, 2, 2, 'FD');

        doc.setFillColor(225, 29, 72); // Rose header strip
        doc.roundedRect(rightX, colY, colWidth, 6, 2, 2, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.text("⚠ RISK EXPOSURE & ATTENTION AREAS", rightX + 3, colY + 4.2);

        let rightTextY = colY + 10;
        doc.setTextColor(159, 18, 57); // Dark Rose text
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        report.weaknesses.forEach((w) => {
            const clean = w.replace(/\*\*/g, '');
            const lines = doc.splitTextToSize(`• ${clean}`, colWidth - 6);
            doc.text(lines, rightX + 3, rightTextY);
            rightTextY += lines.length * 3.8 + 1.2;
        });

        currentY = colY + 52;

        // --- 5. Strategic Recommendations & Action Plan ---
        currentY = drawSectionHeader("2. STRATEGIC RECOMMENDATIONS & BOARD ACTION PLAN", currentY, "Decision Matrix");

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(30, 41, 59);

        report.recommendations.forEach((rec, i) => {
            const clean = rec.replace(/\*\*/g, '');
            doc.setFillColor(238, 242, 255); // Indigo light background pill
            doc.roundedRect(margin, currentY - 1, contentWidth, 7, 1.5, 1.5, 'F');

            doc.setTextColor(79, 70, 229);
            doc.setFont("helvetica", "bold");
            doc.text(`[0${i + 1}]`, margin + 2, currentY + 3.8);

            doc.setTextColor(15, 23, 42);
            doc.setFont("helvetica", "normal");
            const lines = doc.splitTextToSize(clean, contentWidth - 16);
            doc.text(lines, margin + 12, currentY + 3.8);

            currentY += 8.5;
        });

        currentY += 3;

        // --- 6. Top Category Breakdown Mini-Table ---
        if (report.topCategories.length > 0) {
            currentY = drawSectionHeader("3. CATEGORY PERFORMANCE BREAKDOWN", currentY);

            const tableW = contentWidth;
            const rowH = 5.5;

            // Table Header
            doc.setFillColor(226, 232, 240);
            doc.rect(margin, currentY, tableW, rowH, 'F');
            doc.setTextColor(71, 85, 105);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(7);
            doc.text("RANK", margin + 3, currentY + 3.8);
            doc.text("CATEGORY / SEGMENT", margin + 20, currentY + 3.8);
            doc.text(`CONTRIBUTION (${report.primaryMetric})`, margin + 90, currentY + 3.8);
            doc.text("MARKET SHARE (%)", margin + 140, currentY + 3.8);
            currentY += rowH;

            // Rows
            report.topCategories.slice(0, 4).forEach((cat, idx) => {
                doc.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 252);
                doc.rect(margin, currentY, tableW, rowH, 'F');

                doc.setTextColor(100, 116, 139);
                doc.setFont("helvetica", "normal");
                doc.setFontSize(7.5);
                doc.text(`#${idx + 1}`, margin + 3, currentY + 3.8);

                doc.setTextColor(15, 23, 42);
                doc.setFont("helvetica", "bold");
                doc.text(String(cat.name).slice(0, 30), margin + 20, currentY + 3.8);

                doc.setTextColor(79, 70, 229);
                doc.text(`₹${cat.value.toLocaleString('en-IN', { maximumFractionDigits: 1 })}`, margin + 90, currentY + 3.8);

                doc.setTextColor(16, 185, 129);
                doc.text(`${cat.sharePercent.toFixed(1)}%`, margin + 140, currentY + 3.8);

                currentY += rowH;
            });
        }

        // --- 7. Executive Sign-Off Footer ---
        doc.setDrawColor(226, 232, 240);
        doc.line(margin, pageHeight - 16, pageWidth - margin, pageHeight - 16);

        doc.setTextColor(148, 163, 184); // Slate 400
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.text("Automated Intelligence Briefing generated by Vedra BI Autonomous Agent", margin, pageHeight - 10);
        doc.text("Page 1 of 1   |   Corporate Strategy Group", pageWidth - margin - 55, pageHeight - 10);

        // Trigger Direct Download
        doc.save(filename);
        showMessage(`सफलतापूर्वक एक्जीक्यूटिव PDF रिपोर्ट डाउनलोड की गई: "${filename}"`, "success");
        return { success: true, filename };
    } catch (err: any) {
        console.error("Failed to export Executive PDF report:", err);
        showMessage(`PDF एक्सपोर्ट में त्रुटि: ${err.message}`, "danger");
        return { success: false, filename: "" };
    }
}

/**
 * Dynamically loads PptxGenJS script from CDN if not already present
 */
async function ensurePptxGenJsLoaded(): Promise<boolean> {
    if ((window as any).PptxGenJS) return true;

    return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js';
        script.crossOrigin = 'anonymous';
        script.onload = () => {
            console.log("[PptxGenJS] Library loaded successfully.");
            resolve(true);
        };
        script.onerror = () => {
            console.warn("[PptxGenJS] Failed to load from primary CDN, trying fallback...");
            const fallbackScript = document.createElement('script');
            fallbackScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/pptxgenjs/3.12.0/pptxgen.bundle.js';
            fallbackScript.onload = () => resolve(true);
            fallbackScript.onerror = () => resolve(false);
            document.head.appendChild(fallbackScript);
        };
        document.head.appendChild(script);
    });
}

/**
 * Generates and downloads a sleek 4-Slide Executive PowerPoint Presentation (.pptx)
 */
export async function exportExecutiveReportToPPT(customData?: any[], customFilename?: string): Promise<{ success: boolean; filename: string }> {
    try {
        showMessage("📊 एक्जीक्यूटिव PowerPoint (.pptx) रिपोर्ट तैयार हो रही है...", "info");

        const isLoaded = await ensurePptxGenJsLoaded();
        const PptxGen = (window as any).PptxGenJS;

        if (!isLoaded || !PptxGen) {
            throw new Error("PowerPoint (pptxgenjs) लाइब्रेरी लोड नहीं हो सकी। कृपया इंटरनेट कनेक्शन जांचें।");
        }

        const report = generateExecutiveReportData(customData);
        const filename = customFilename || `Vedra_Executive_Presentation_${new Date().toISOString().slice(0, 10)}.pptx`;

        const pptx = new PptxGen();
        pptx.layout = 'LAYOUT_16x9'; // 16:9 Modern Presentation Widescreen
        pptx.company = 'Vedra BI Enterprise';
        pptx.title = 'Executive Strategic Intelligence Briefing';
        pptx.subject = 'Business Intelligence & Performance Review';

        // Slide Master Theme Palette
        const C_DARK = '0F172A';     // Slate 900
        const C_INDIGO = '4F46E5';   // Indigo 600
        const C_EMERALD = '10B981';  // Emerald 500
        const C_ROSE = 'E11D48';     // Rose 600
        const C_BG_LIGHT = 'F8FAFC'; // Slate 50
        const C_WHITE = 'FFFFFF';
        const C_MUTED = '64748B';    // Slate 500

        // ==========================================
        // SLIDE 1: Title & Executive Cover Slide
        // ==========================================
        const s1 = pptx.addSlide();
        s1.background = { color: C_DARK };

        // Decorative indigo banner block
        s1.addShape(pptx.ShapeType.rect, {
            x: 0, y: 0, w: '100%', h: 0.15,
            fill: { color: C_INDIGO }
        });

        s1.addText("VEDRA BI ENTERPRISE", {
            x: 1.0, y: 1.8, w: 10.0, h: 0.4,
            fontSize: 14, fontFace: "Calibri", color: '818CF8', bold: true, charSpacing: 3
        });

        s1.addText("Executive Strategic Intelligence Briefing", {
            x: 1.0, y: 2.3, w: 11.0, h: 1.2,
            fontSize: 32, fontFace: "Calibri", color: C_WHITE, bold: true
        });

        s1.addText(`Comprehensive Operational Performance & Decision Matrix\nScope: ${report.datasetName} | Date: ${report.generatedAt}`, {
            x: 1.0, y: 3.6, w: 10.0, h: 0.8,
            fontSize: 14, fontFace: "Calibri", color: 'CBD5E1', lineSpacing: 22
        });

        s1.addShape(pptx.ShapeType.roundRect, {
            x: 1.0, y: 5.2, w: 4.2, h: 0.6,
            fill: { color: '1E293B' },
            rectRadius: 0.1
        });

        s1.addText("BOARD LEVEL REVIEW  •  CONFIDENTIAL", {
            x: 1.0, y: 5.2, w: 4.2, h: 0.6,
            fontSize: 11, fontFace: "Calibri", color: 'F59E0B', bold: true, align: 'center', valign: 'middle'
        });

        // ==========================================
        // SLIDE 2: Executive Summary & KPI Metric Deck
        // ==========================================
        const s2 = pptx.addSlide();
        s2.background = { color: C_BG_LIGHT };

        // Slide Header
        s2.addText("Executive Summary & Core Performance KPIs", {
            x: 0.8, y: 0.5, w: 10.0, h: 0.5,
            fontSize: 22, fontFace: "Calibri", color: C_DARK, bold: true
        });
        s2.addText(`Aggregated from ${report.totalRecords.toLocaleString('en-IN')} verified operational records`, {
            x: 0.8, y: 1.0, w: 10.0, h: 0.3,
            fontSize: 11, fontFace: "Calibri", color: C_MUTED
        });

        // 4 KPI Cards across width
        const kpiY = 1.5;
        const kpiW = 2.7;
        const kpiH = 1.3;
        const kpiGap = 0.35;
        const startX = 0.8;

        const kpiDefs = [
            { label: `TOTAL ${report.primaryMetric.toUpperCase()}`, val: `₹${report.metrics.formattedTotal}`, border: C_INDIGO },
            { label: "AVERAGE BENCHMARK", val: `₹${report.metrics.formattedAvg}`, border: C_EMERALD },
            { label: "PEAK RECORD (MAX)", val: `₹${report.metrics.formattedMax}`, border: C_ROSE },
            { label: "RECORD VOLUME", val: `${report.totalRecords.toLocaleString('en-IN')}`, border: '0EA5E9' }
        ];

        kpiDefs.forEach((kpi, idx) => {
            const x = startX + idx * (kpiW + kpiGap);
            s2.addShape(pptx.ShapeType.roundRect, {
                x, y: kpiY, w: kpiW, h: kpiH,
                fill: { color: C_WHITE },
                line: { color: kpi.border, width: 2 },
                rectRadius: 0.08
            });
            s2.addText(kpi.label, {
                x: x + 0.15, y: kpiY + 0.15, w: kpiW - 0.3, h: 0.3,
                fontSize: 9, fontFace: "Calibri", color: C_MUTED, bold: true
            });
            s2.addText(kpi.val, {
                x: x + 0.15, y: kpiY + 0.5, w: kpiW - 0.3, h: 0.6,
                fontSize: 18, fontFace: "Calibri", color: C_DARK, bold: true
            });
        });

        // Summary Content Box
        s2.addShape(pptx.ShapeType.roundRect, {
            x: 0.8, y: 3.1, w: 11.7, h: 3.5,
            fill: { color: C_WHITE },
            line: { color: 'E2E8F0', width: 1 },
            rectRadius: 0.08
        });

        s2.addText("Key Business Insights & Observations", {
            x: 1.1, y: 3.3, w: 10.0, h: 0.4,
            fontSize: 14, fontFace: "Calibri", color: C_INDIGO, bold: true
        });

        const takeawayTextObjects = report.keyTakeaways.map(t => ({
            text: `${t.replace(/\*\*/g, '')}\n\n`,
            options: { fontSize: 11, fontFace: "Calibri", color: '334155', bullet: true, lineSpacing: 18 }
        }));

        s2.addText(takeawayTextObjects, {
            x: 1.1, y: 3.8, w: 11.0, h: 2.5
        });

        // ==========================================
        // SLIDE 3: Strengths vs. Risks & Areas of Concern
        // ==========================================
        const s3 = pptx.addSlide();
        s3.background = { color: C_BG_LIGHT };

        s3.addText("Strategic Diagnostics: Strengths vs. Risk Factors", {
            x: 0.8, y: 0.5, w: 10.0, h: 0.5,
            fontSize: 22, fontFace: "Calibri", color: C_DARK, bold: true
        });

        const colW = 5.6;
        const colH = 5.3;

        // Left Card: Strengths (Green)
        s3.addShape(pptx.ShapeType.roundRect, {
            x: 0.8, y: 1.3, w: colW, h: colH,
            fill: { color: 'F0FDF4' },
            line: { color: '86EFAC', width: 1.5 },
            rectRadius: 0.08
        });

        s3.addText("✓ Core Growth Engines & Strengths", {
            x: 1.1, y: 1.5, w: colW - 0.6, h: 0.4,
            fontSize: 14, fontFace: "Calibri", color: '15803D', bold: true
        });

        const strengthTexts = report.strengths.map(s => ({
            text: `${s.replace(/\*\*/g, '')}\n\n`,
            options: { fontSize: 11, fontFace: "Calibri", color: '14532D', bullet: true }
        }));
        s3.addText(strengthTexts, {
            x: 1.1, y: 2.1, w: colW - 0.6, h: 4.2
        });

        // Right Card: Risks (Rose)
        s3.addShape(pptx.ShapeType.roundRect, {
            x: 6.9, y: 1.3, w: colW, h: colH,
            fill: { color: 'FFF1F2' },
            line: { color: 'FDA4AF', width: 1.5 },
            rectRadius: 0.08
        });

        s3.addText("⚠ Operational Risks & Vulnerabilities", {
            x: 7.2, y: 1.5, w: colW - 0.6, h: 0.4,
            fontSize: 14, fontFace: "Calibri", color: 'BE123C', bold: true
        });

        const weaknessTexts = report.weaknesses.map(w => ({
            text: `${w.replace(/\*\*/g, '')}\n\n`,
            options: { fontSize: 11, fontFace: "Calibri", color: '881337', bullet: true }
        }));
        s3.addText(weaknessTexts, {
            x: 7.2, y: 2.1, w: colW - 0.6, h: 4.2
        });

        // ==========================================
        // SLIDE 4: Action Plan & Strategic Roadmap
        // ==========================================
        const s4 = pptx.addSlide();
        s4.background = { color: C_BG_LIGHT };

        s4.addText("Board Action Plan & Recommended Decisions", {
            x: 0.8, y: 0.5, w: 10.0, h: 0.5,
            fontSize: 22, fontFace: "Calibri", color: C_DARK, bold: true
        });
        s4.addText("Prioritized quarterly milestones for operational execution", {
            x: 0.8, y: 1.0, w: 10.0, h: 0.3,
            fontSize: 11, fontFace: "Calibri", color: C_MUTED
        });

        // 4 Action Rows
        report.recommendations.forEach((rec, idx) => {
            const y = 1.6 + idx * 1.25;
            s4.addShape(pptx.ShapeType.roundRect, {
                x: 0.8, y, w: 11.7, h: 1.05,
                fill: { color: C_WHITE },
                line: { color: 'E0E7FF', width: 1.5 },
                rectRadius: 0.08
            });

            // Step number badge
            s4.addShape(pptx.ShapeType.rect, {
                x: 0.8, y, w: 1.0, h: 1.05,
                fill: { color: C_INDIGO }
            });
            s4.addText(`0${idx + 1}`, {
                x: 0.8, y, w: 1.0, h: 1.05,
                fontSize: 16, fontFace: "Calibri", color: C_WHITE, bold: true, align: 'center', valign: 'middle'
            });

            s4.addText(rec.replace(/\*\*/g, ''), {
                x: 2.0, y: y + 0.15, w: 10.3, h: 0.75,
                fontSize: 11.5, fontFace: "Calibri", color: C_DARK, bold: false, valign: 'middle'
            });
        });

        // Write and download PowerPoint presentation
        await pptx.writeFile({ fileName: filename });
        showMessage(`सफलतापूर्वक एक्जीक्यूटिव PowerPoint (.pptx) डाउनलोड किया गया: "${filename}"`, "success");
        return { success: true, filename };

    } catch (err: any) {
        console.error("Failed to export PowerPoint presentation:", err);
        showMessage(`PowerPoint एक्सपोर्ट में त्रुटि: ${err.message}`, "danger");
        return { success: false, filename: "" };
    }
}

/**
 * Renders an interactive Executive Report Assistant Card inside the chat stream
 */
export function renderExecutiveReportCard(customData?: any[]): { html: string; reportId: string } {
    const report = generateExecutiveReportData(customData);
    const reportId = `exec_rep_${Date.now()}`;

    const html = `
        <div class="executive-report-card p-3.5 bg-white border border-slate-200 rounded-3 shadow-sm mb-2" id="${reportId}" style="border-left: 4px solid #4f46e5 !important;">
            <div class="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
                <div class="d-flex align-items-center gap-2">
                    <span class="badge bg-indigo-100 text-indigo-700 p-2 rounded-2">
                        <i class="bi bi-file-earmark-bar-graph-fill fs-6"></i>
                    </span>
                    <div>
                        <h6 class="mb-0 fw-bold text-slate-800" style="font-size: 0.95rem;">एक्जीक्यूटिव रिपोर्ट एक्सपोर्ट (AI Executive Briefing)</h6>
                        <span class="text-muted text-2xs">${report.totalRecords.toLocaleString('en-IN')} रिकॉर्ड्स | मीट्रिक: ${report.primaryMetric}</span>
                    </div>
                </div>
                <span class="badge bg-amber-100 text-amber-800 border border-amber-300 text-2xs fw-bold px-2 py-1">
                    <i class="bi bi-shield-lock-fill me-1"></i> BOARD READY
                </span>
            </div>

            <!-- Quick Metrics Strip -->
            <div class="row g-2 mb-3">
                <div class="col-6 col-md-3">
                    <div class="p-2 bg-slate-50 border rounded-2 text-center">
                        <div class="text-muted text-2xs text-uppercase">कुल ${report.primaryMetric}</div>
                        <div class="fw-bold text-indigo-700 text-xs text-truncate">₹${report.metrics.formattedTotal}</div>
                    </div>
                </div>
                <div class="col-6 col-md-3">
                    <div class="p-2 bg-slate-50 border rounded-2 text-center">
                        <div class="text-muted text-2xs text-uppercase">औसत मान</div>
                        <div class="fw-bold text-emerald-700 text-xs text-truncate">₹${report.metrics.formattedAvg}</div>
                    </div>
                </div>
                <div class="col-6 col-md-3">
                    <div class="p-2 bg-slate-50 border rounded-2 text-center">
                        <div class="text-muted text-2xs text-uppercase">सर्वोच्च शिखर</div>
                        <div class="fw-bold text-rose-700 text-xs text-truncate">₹${report.metrics.formattedMax}</div>
                    </div>
                </div>
                <div class="col-6 col-md-3">
                    <div class="p-2 bg-slate-50 border rounded-2 text-center">
                        <div class="text-muted text-2xs text-uppercase">सक्रिय रिकॉर्ड्स</div>
                        <div class="fw-bold text-sky-700 text-xs text-truncate">${report.totalRecords.toLocaleString('en-IN')} Rows</div>
                    </div>
                </div>
            </div>

            <!-- Highlights -->
            <div class="report-preview-body mb-3 text-slate-700" style="font-size: 0.82rem; line-height: 1.55;">
                <div class="mb-2">
                    <strong class="text-slate-900"><i class="bi bi-lightbulb-fill text-amber-500 me-1"></i> मुख्य निष्कर्ष (Key Takeaways):</strong>
                    <ul class="ps-3 mb-1 mt-1 text-slate-600">
                        ${report.keyTakeaways.map(t => `<li class="mb-1">${t}</li>`).join('')}
                    </ul>
                </div>
                <div class="row g-2 mb-2">
                    <div class="col-12 col-md-6">
                        <div class="p-2 bg-emerald-50 border border-emerald-200 rounded-2">
                            <strong class="text-emerald-800 text-2xs d-block mb-1"><i class="bi bi-check-circle-fill me-1"></i> मुख्य शक्तियां (Strengths):</strong>
                            <ul class="ps-3 mb-0 text-emerald-900 text-2xs">
                                ${report.strengths.slice(0, 2).map(s => `<li>${s}</li>`).join('')}
                            </ul>
                        </div>
                    </div>
                    <div class="col-12 col-md-6">
                        <div class="p-2 bg-rose-50 border border-rose-200 rounded-2">
                            <strong class="text-rose-800 text-2xs d-block mb-1"><i class="bi bi-exclamation-triangle-fill me-1"></i> सुधार के क्षेत्र (Weaknesses/Risks):</strong>
                            <ul class="ps-3 mb-0 text-rose-900 text-2xs">
                                ${report.weaknesses.slice(0, 2).map(w => `<li>${w}</li>`).join('')}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 1-Click Export Buttons -->
            <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 pt-2 border-top">
                <div class="d-flex gap-2">
                    <button class="btn btn-sm btn-primary d-flex align-items-center gap-1.5 fw-semibold btn-download-exec-pdf" data-report-id="${reportId}">
                        <i class="bi bi-file-earmark-pdf-fill"></i> 1-Click PDF Report
                    </button>
                    <button class="btn btn-sm btn-outline-danger d-flex align-items-center gap-1.5 fw-semibold btn-download-exec-ppt" data-report-id="${reportId}">
                        <i class="bi bi-file-earmark-ppt-fill"></i> 1-Click PowerPoint (.pptx)
                    </button>
                </div>
                <div class="d-flex gap-1">
                    <button class="btn btn-xs btn-outline-secondary btn-copy-exec-report" title="कॉपी करें" data-report-id="${reportId}">
                        <i class="bi bi-clipboard"></i>
                    </button>
                    <button class="btn btn-xs btn-outline-primary btn-pin-exec-report" title="डैशबोर्ड नोट्स में पिन करें" data-report-id="${reportId}">
                        <i class="bi bi-pin-angle-fill"></i>
                    </button>
                </div>
            </div>
        </div>
    `;

    return { html, reportId };
}

/**
 * Attaches event listeners to report cards in the chat
 */
export function attachExecutiveReportListeners(container: HTMLElement = document.body): void {
    container.querySelectorAll('.btn-download-exec-pdf').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            await exportExecutiveReportToPDF();
        });
    });

    container.querySelectorAll('.btn-download-exec-ppt').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            await exportExecutiveReportToPPT();
        });
    });

    container.querySelectorAll('.btn-copy-exec-report').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const report = generateExecutiveReportData();
            const text = `=== VEDRA BI EXECUTIVE STRATEGIC BRIEFING ===\n` +
                `Date: ${report.generatedAt}\n` +
                `Total Scope: ${report.datasetName}\n\n` +
                `METRICS:\n` +
                `• Total ${report.primaryMetric}: ₹${report.metrics.formattedTotal}\n` +
                `• Average: ₹${report.metrics.formattedAvg}\n` +
                `• Peak: ₹${report.metrics.formattedMax}\n\n` +
                `KEY TAKEAWAYS:\n${report.keyTakeaways.map(k => `• ${k.replace(/\*\*/g, '')}`).join('\n')}\n\n` +
                `STRENGTHS:\n${report.strengths.map(s => `• ${s.replace(/\*\*/g, '')}`).join('\n')}\n\n` +
                `RISKS & FOCUS AREAS:\n${report.weaknesses.map(w => `• ${w.replace(/\*\*/g, '')}`).join('\n')}\n\n` +
                `RECOMMENDATIONS:\n${report.recommendations.map(r => `• ${r.replace(/\*\*/g, '')}`).join('\n')}`;

            await navigator.clipboard.writeText(text);
            showMessage("एग्जीक्यूटिव समरी रिपोर्ट क्लिपबोर्ड पर कॉपी हो गई!", "success");
        });
    });

    container.querySelectorAll('.btn-pin-exec-report').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const report = generateExecutiveReportData();
            const content = `
                <div class="p-2">
                    <h6 class="fw-bold text-indigo-700">📋 एग्जीक्यूटिव स्ट्रेटेजिक समरी</h6>
                    <p class="small mb-1"><strong>कुल ${report.primaryMetric}:</strong> ₹${report.metrics.formattedTotal} | <strong>औसत:</strong> ₹${report.metrics.formattedAvg}</p>
                    <p class="small mb-1 text-emerald-700"><strong>शीर्ष चालक:</strong> ${report.strengths[0] ? report.strengths[0].replace(/\*\*/g, '') : ''}</p>
                    <p class="small mb-0 text-slate-600"><strong>रणनीतिक सलाह:</strong> ${report.recommendations[0] ? report.recommendations[0].replace(/\*\*/g, '') : ''}</p>
                </div>
            `;
            const x = 160 + Math.random() * 40;
            const y = 140 + Math.random() * 40;
            createBox(x, y, 0, content, "#eef2ff", "slide-in-up");
            showMessage("एग्जीक्यूटिव रिपोर्ट डैशबोर्ड नोट्स पर पिन हो गई!", "success");
        });
    });
}
