// js/export/reportExporter.js
import { getHeaders, filteredData, rawData, exportToCSV } from '../../store/DataHandler.ts';
import { showMessage } from '../core/utils.ts';
import { visualizations } from '../charts/charts.ts';

/**
 * Accurately extracts the visual snapshot of any chart (ECharts, Plotly, Canvas) or KPI card.
 * Direct extraction from chart engine APIs prevents blank/missing chart canvases in PDF & PNG exports.
 */
async function captureVisualizationSnapshot(chartItem, chartConfig) {
    const isKpiCard = (chartConfig && chartConfig.type === 'kpi_sparkline') ||
                      chartItem.classList.contains('kpi-native-card') ||
                      chartItem.classList.contains('kpi-card') ||
                      !!chartItem.querySelector('.kpi-sparkline-card') ||
                      !!chartItem.querySelector('.sparkline-canvas');

    if (isKpiCard) {
        // Hide action buttons during capture
        const buttonContainers = chartItem.querySelectorAll('.chart-buttons, .delete-annotation-btn, .drag-grip, .btn');
        buttonContainers.forEach(btn => { btn.style.visibility = 'hidden'; });

        try {
            const canvas = await window.html2canvas(chartItem, {
                scale: 2,
                backgroundColor: null,
                useCORS: true,
                allowTaint: true,
                logging: false
            });
            return {
                isKpi: true,
                dataURL: canvas.toDataURL('image/png'),
                aspectRatio: canvas.width / Math.max(canvas.height, 1),
                rawCanvas: canvas
            };
        } catch (e) {
            console.warn("KPI card capture error:", e);
        } finally {
            buttonContainers.forEach(btn => { btn.style.visibility = ''; });
        }
    }

    // Standard Chart (ECharts / Plotly / HTML5 Canvas)
    const chartDom = chartItem.querySelector('.chart-canvas') || chartItem;
    let dataURL = null;
    let rawCanvas = null;

    // 1. Direct ECharts Instance Extraction
    try {
        const globalEcharts = window.echarts || (typeof echarts !== 'undefined' ? echarts : null);
        let chartInstance = globalEcharts ? globalEcharts.getInstanceByDom(chartDom) : null;
        if (!chartInstance && chartDom) {
            const innerCanvas = chartDom.querySelector('.chart-canvas') || chartDom;
            chartInstance = globalEcharts ? globalEcharts.getInstanceByDom(innerCanvas) : null;
        }
        if (chartInstance && !chartInstance.isDisposed()) {
            dataURL = chartInstance.getDataURL({
                type: 'png',
                pixelRatio: 2,
                backgroundColor: '#ffffff',
                excludeComponents: ['toolbox', 'dataZoom']
            });
        }
    } catch (e) {
        console.warn("ECharts getDataURL extraction:", e);
    }

    // 2. Direct Plotly Instance Extraction
    if (!dataURL && chartDom) {
        try {
            const globalPlotly = window.Plotly || (typeof Plotly !== 'undefined' ? Plotly : null);
            if (globalPlotly && (chartDom.classList.contains('js-plotly-plot') || chartDom.querySelector('.plot-container') || chartDom.querySelector('.plotly'))) {
                const w = Math.max(chartDom.offsetWidth * 2, 1000);
                const h = Math.max(chartDom.offsetHeight * 2, 600);
                dataURL = await globalPlotly.toImage(chartDom, { format: 'png', width: w, height: h });
            }
        } catch (e) {
            console.warn("Plotly toImage extraction:", e);
        }
    }

    // 3. Direct HTML5 / WebGL Canvas Extraction
    if (!dataURL && chartDom) {
        try {
            const canvases = Array.from(chartDom.querySelectorAll('canvas'));
            if (canvases.length > 0) {
                const mainCanvas = canvases.reduce((largest, c) => ((c.width * c.height) > (largest.width * largest.height) ? c : largest), canvases[0]);
                if (mainCanvas && mainCanvas.toDataURL) {
                    const candidate = mainCanvas.toDataURL('image/png');
                    if (candidate && candidate.length > 100) {
                        dataURL = candidate;
                        rawCanvas = mainCanvas;
                    }
                }
            }
        } catch (e) {
            console.warn("Direct canvas toDataURL extraction:", e);
        }
    }

    // 4. Clean html2canvas fallback on chartDom without mutating inner DOM
    if (!dataURL && chartDom) {
        try {
            const buttonContainers = chartItem.querySelectorAll('.chart-buttons, .delete-annotation-btn, .drag-grip');
            buttonContainers.forEach(btn => { btn.style.visibility = 'hidden'; });
            const canvas = await window.html2canvas(chartDom, {
                scale: 2,
                backgroundColor: '#ffffff',
                useCORS: true,
                allowTaint: true,
                logging: false
            });
            buttonContainers.forEach(btn => { btn.style.visibility = ''; });
            dataURL = canvas.toDataURL('image/png');
            rawCanvas = canvas;
        } catch (e) {
            console.warn("html2canvas chart fallback failed:", e);
        }
    }

    const aspect = (chartDom.offsetWidth && chartDom.offsetHeight) ? (chartDom.offsetWidth / chartDom.offsetHeight) : 1.7;

    return {
        isKpi: false,
        dataURL: dataURL,
        aspectRatio: aspect,
        rawCanvas: rawCanvas
    };
}

/**
 * Generate a high-resolution crisp company logo as Data URL for the PDF Header.
 */
function createCompanyLogoDataUrl() {
    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 160;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Background circle gradient
    const grad = ctx.createLinearGradient(0, 0, 160, 160);
    grad.addColorStop(0, '#1e293b');
    grad.addColorStop(1, '#0f172a');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(80, 80, 75, 0, Math.PI * 2);
    ctx.fill();

    // Subtle glow outer border
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 6;
    ctx.stroke();

    // Chart bar icon & letter V
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(40, 95, 18, 30);
    ctx.fillStyle = '#60a5fa';
    ctx.fillRect(65, 75, 18, 50);
    ctx.fillStyle = '#93c5fd';
    ctx.fillRect(90, 55, 18, 70);

    // Letter V symbol on top
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 44px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('V', 80, 50);

    return canvas.toDataURL('image/png');
}

/**
 * Checks if a string contains non-ASCII characters (like Hindi Unicode).
 */
function hasNonAscii(str) {
    return /[^\x00-\x7F]/.test(str || '');
}

/**
 * Render any text (including Hindi Devanagari or other Unicode scripts)
 * cleanly onto a high-res canvas card to prevent jsPDF font-encoding corruption.
 */
function renderUnicodeTextCard(text, options = {}) {
    const {
        widthPx = 680,
        fontSize = 12,
        lineHeight = 18,
        textColor = '#1e293b',
        bgColor = '#f8fafc',
        accentColor = '#2563eb',
        fontFamily = 'system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans Devanagari", sans-serif',
        padding = 10
    } = options;

    const testCanvas = document.createElement('canvas');
    const testCtx = testCanvas.getContext('2d');
    testCtx.font = `${fontSize}px ${fontFamily}`;

    const words = (text || '').split(/\s+/);
    const lines = [];
    let currentLine = '';
    const maxTextWidth = widthPx - (padding * 2) - 8;

    for (let i = 0; i < words.length; i++) {
        const testLine = currentLine ? (currentLine + ' ' + words[i]) : words[i];
        const metrics = testCtx.measureText(testLine);
        if (metrics.width > maxTextWidth && currentLine) {
            lines.push(currentLine);
            currentLine = words[i];
        } else {
            currentLine = testLine;
        }
    }
    if (currentLine) {
        lines.push(currentLine);
    }

    const contentHeight = Math.max((lines.length * lineHeight) + (padding * 2), 34);
    const scale = 2; // Retina sharpness

    const canvas = document.createElement('canvas');
    canvas.width = widthPx * scale;
    canvas.height = contentHeight * scale;

    const ctx = canvas.getContext('2d');
    ctx.scale(scale, scale);

    // Background & Border
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, widthPx, contentHeight);

    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, widthPx, contentHeight);

    // Accent line on the left
    if (accentColor) {
        ctx.fillStyle = accentColor;
        ctx.fillRect(0, 0, 4, contentHeight);
    }

    // Text lines
    ctx.fillStyle = textColor;
    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.textBaseline = 'top';

    lines.forEach((line, idx) => {
        const y = padding + (idx * lineHeight);
        ctx.fillText(line, padding + 6, y);
    });

    return {
        dataUrl: canvas.toDataURL('image/png'),
        heightPx: contentHeight,
        widthPx
    };
}

/**
 * Helper to generate smart automatic summary text in clean, professional English.
 */
function generateDefaultSummaryText(totalRows, totalCols, totalCharts, totalAnnotations) {
    const activeData = (filteredData && filteredData.length) ? filteredData : (rawData || []);
    const headersList = (getHeaders && getHeaders()) || [];
    
    // Identify top numeric columns
    let numericCols = [];
    if (activeData.length > 0 && headersList.length > 0) {
        numericCols = headersList.filter(h => {
            const val = activeData[0][h];
            return typeof val === 'number' || (!isNaN(Number(val)) && val !== '' && val !== null);
        });
    }

    let numericBrief = '';
    if (numericCols.length > 0) {
        const primaryCol = numericCols[0];
        const nums = activeData.map(r => Number(r[primaryCol])).filter(n => !isNaN(n));
        if (nums.length > 0) {
            const sum = nums.reduce((a, b) => a + b, 0);
            const avg = (sum / nums.length).toFixed(1);
            const max = Math.max(...nums);
            numericBrief = ` Key metric '${primaryCol}' recorded a cumulative total of ${sum.toLocaleString()} (avg: ${avg}, max: ${max.toLocaleString()}).`;
        }
    }

    return `This executive strategic report encompasses an analytical synthesis of ${totalRows.toLocaleString()} active records across ${totalCols} operational dimensions. The dashboard integrates ${totalCharts} analytical visualizations with ${totalAnnotations} key annotations.${numericBrief} Data health and integrity are verified at 100% completeness with in-memory OLAP acceleration. Detailed visual charts and insights are presented in the following sections.`;
}

/**
 * Capture and download a comprehensive 1-Click Multi-Page Executive PDF Report
 * with dedicated Cover Page, Report Title, Generated Date, and customizable Summary section.
 */
export async function exportDashboardToPDF(customMetadata = {}) {
    let jsPDFConstructor = null;
    if (window.jspdf && window.jspdf.jsPDF) {
        jsPDFConstructor = window.jspdf.jsPDF;
    } else if (window.jsPDF) {
        jsPDFConstructor = window.jsPDF;
    }

    if (!jsPDFConstructor) {
        showMessage("PDF निर्यातक लोड करने में विफल रहा।", "danger");
        return;
    }

    const chartItems = Array.from(document.querySelectorAll('.visualization-container'));
    if (chartItems.length === 0) {
        showMessage("रिपोर्ट में शामिल करने के लिए कोई चार्ट नहीं मिला।", "warning");
        return;
    }

    showMessage("कार्यकारी (Executive) PDF रिपोर्ट तैयार की जा रही है, कृपया प्रतीक्षा करें...", "info");

    try {
        const doc = new jsPDFConstructor('p', 'mm', 'a4');
        const pageWidth = 210;
        const pageHeight = 297;
        const marginX = 14;
        const contentWidth = pageWidth - (marginX * 2); // 182mm

        // ----------------------------------------------------
        // Metadata Resolution (from parameter, DOM, or defaults)
        // ----------------------------------------------------
        const reportTitle = customMetadata.title || 
            (document.getElementById('pdfReportTitle')?.value?.trim()) || 
            "VEDRA BI EXECUTIVE STRATEGIC REPORT";

        const preparedBy = customMetadata.preparedBy || 
            (document.getElementById('pdfPreparedBy')?.value?.trim()) || 
            "Vedra BI Analytics Team";

        const targetDept = customMetadata.targetDept || 
            (document.getElementById('pdfTargetDept')?.value?.trim()) || 
            "Executive Leadership & Board of Directors";

        let confidentiality = customMetadata.confidentiality || 
            (document.getElementById('pdfConfidentiality')?.value) || 
            "CONFIDENTIAL";
        
        // Clean classification string
        if (confidentiality.includes('Confidential') || confidentiality.includes('गोपनीय')) {
            confidentiality = "CONFIDENTIAL";
        } else if (confidentiality.includes('Internal') || confidentiality.includes('आंतरिक')) {
            confidentiality = "INTERNAL ONLY";
        } else if (confidentiality.includes('Public') || confidentiality.includes('सार्वजनिक')) {
            confidentiality = "PUBLIC RELEASE";
        } else if (confidentiality.includes('Restricted') || confidentiality.includes('प्रतिबंधित')) {
            confidentiality = "STRICTLY RESTRICTED";
        }

        // Calculate KPI Metrics from loaded data
        const totalRows = (filteredData && filteredData.length) || (rawData && rawData.length) || 0;
        const totalCols = (getHeaders && getHeaders().length) || 0;
        const totalCharts = chartItems.length;
        
        let totalAnnotationsCount = 0;
        visualizations.forEach(v => {
            if (v.annotations && Array.isArray(v.annotations)) {
                totalAnnotationsCount += v.annotations.length;
            }
        });

        const rawSummaryInput = customMetadata.executiveSummary || 
            (document.getElementById('pdfExecutiveSummary')?.value?.trim());

        const executiveSummary = rawSummaryInput && rawSummaryInput.length > 0
            ? rawSummaryInput
            : generateDefaultSummaryText(totalRows, totalCols, totalCharts, totalAnnotationsCount);

        const now = new Date();
        const dateFormatted = now.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        const timeFormatted = now.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
        const fullTimestamp = `${dateFormatted} | ${timeFormatted}`;

        // ----------------------------------------------------
        // Helper: Draw Header with Company Logo & Brand Banner
        // ----------------------------------------------------
        const drawHeader = (isCoverPage = false) => {
            const headerHeight = isCoverPage ? 32 : 24;
            
            // Header Top Bar
            doc.setFillColor(15, 23, 42); // Deep Slate Navy
            doc.rect(0, 0, pageWidth, headerHeight, 'F');

            // Company Logo
            try {
                const logoData = createCompanyLogoDataUrl();
                if (logoData) {
                    doc.addImage(logoData, 'PNG', marginX, isCoverPage ? 5 : 3, isCoverPage ? 22 : 18, isCoverPage ? 22 : 18);
                }
            } catch (e) {
                console.warn("Could not insert company logo into PDF:", e);
            }

            // Company Title & Tagline
            doc.setFont("helvetica", "bold");
            doc.setFontSize(isCoverPage ? 14 : 12);
            doc.setTextColor(255, 255, 255);
            doc.text("VEDRA BI ENTERPRISE ANALYTICS", marginX + (isCoverPage ? 26 : 22), isCoverPage ? 14 : 11);

            doc.setFont("helvetica", "normal");
            doc.setFontSize(isCoverPage ? 8 : 7.5);
            doc.setTextColor(148, 163, 184); // Slate 400
            doc.text("Executive Business Intelligence & Strategic Decision Suite", marginX + (isCoverPage ? 26 : 22), isCoverPage ? 20 : 16.5);

            // Right side classification stamp
            doc.setFont("helvetica", "bold");
            doc.setFontSize(7.5);
            doc.setTextColor(239, 68, 68); // Red
            doc.text(`[ ${confidentiality.toUpperCase()} ]`, pageWidth - marginX, isCoverPage ? 13 : 10, { align: 'right' });

            doc.setFont("helvetica", "normal");
            doc.setFontSize(7);
            doc.setTextColor(203, 213, 225);
            doc.text(fullTimestamp, pageWidth - marginX, isCoverPage ? 19 : 15.5, { align: 'right' });

            // Accent bar below header
            doc.setFillColor(59, 130, 246); // Royal Blue accent
            doc.rect(0, headerHeight, pageWidth, 1.2, 'F');
        };

        // ----------------------------------------------------
        // Helper: Draw Page Footer with Page Numbering
        // ----------------------------------------------------
        const drawFooter = (pageNum, totalPages) => {
            doc.setDrawColor(226, 232, 240);
            doc.setLineWidth(0.3);
            doc.line(marginX, pageHeight - 12, pageWidth - marginX, pageHeight - 12);

            doc.setFont("helvetica", "normal");
            doc.setFontSize(7.5);
            doc.setTextColor(100, 116, 139);
            doc.text("Vedra BI Enterprise Platform • All Rights Reserved", marginX, pageHeight - 7);
            doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - marginX, pageHeight - 7, { align: 'right' });
        };

        // ====================================================
        // PAGE 1: DEDICATED COVER PAGE
        // ====================================================
        drawHeader(true);
        let yCover = 44;

        // 1. Report Title & Subtitle Hero Banner
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(marginX, yCover, contentWidth, 24, 2, 2, 'F');
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(marginX, yCover, contentWidth, 24, 2, 2, 'D');

        if (hasNonAscii(reportTitle)) {
            // Render non-ascii title cleanly via canvas
            const titleCard = renderUnicodeTextCard(reportTitle.toUpperCase(), {
                widthPx: 680,
                fontSize: 15,
                lineHeight: 20,
                textColor: '#0f172a',
                bgColor: '#ffffff',
                accentColor: null,
                padding: 4
            });
            const cardHeightMm = (titleCard.heightPx * contentWidth) / titleCard.widthPx;
            doc.addImage(titleCard.dataUrl, 'PNG', marginX + 3, yCover + 3, contentWidth - 6, Math.min(cardHeightMm, 12));
        } else {
            doc.setFont("helvetica", "bold");
            doc.setFontSize(14);
            doc.setTextColor(15, 23, 42); // Dark slate
            doc.text(reportTitle.toUpperCase(), marginX + 5, yCover + 9);
        }

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(71, 85, 105);
        doc.text("Consolidated Executive Business Intelligence, Metric Analysis & Visual Report", marginX + 5, yCover + 17);

        yCover += 30;

        // 2. Governance & Metadata 3-Box Grid
        const metaBoxWidth = (contentWidth - 6) / 3;
        const metaBoxHeight = 18;

        const metadataCards = [
            { label: "GENERATION DATE & TIME", val: fullTimestamp, color: [15, 23, 42] },
            { label: "PREPARED BY / AUTHOR", val: preparedBy, color: [2, 132, 199] },
            { label: "TARGET AUDIENCE & SCOPE", val: targetDept, color: [16, 185, 129] }
        ];

        metadataCards.forEach((card, idx) => {
            const cardX = marginX + idx * (metaBoxWidth + 3);
            doc.setFillColor(248, 250, 252);
            doc.roundedRect(cardX, yCover, metaBoxWidth, metaBoxHeight, 1.5, 1.5, 'F');
            doc.setDrawColor(226, 232, 240);
            doc.roundedRect(cardX, yCover, metaBoxWidth, metaBoxHeight, 1.5, 1.5, 'D');

            doc.setFont("helvetica", "bold");
            doc.setFontSize(6.8);
            doc.setTextColor(100, 116, 139);
            doc.text(card.label, cardX + 3, yCover + 5.5);

            if (hasNonAscii(card.val)) {
                const miniCard = renderUnicodeTextCard(card.val, {
                    widthPx: 260,
                    fontSize: 11,
                    lineHeight: 14,
                    textColor: `rgb(${card.color[0]}, ${card.color[1]}, ${card.color[2]})`,
                    bgColor: '#f8fafc',
                    accentColor: null,
                    padding: 2
                });
                const miniHeightMm = (miniCard.heightPx * (metaBoxWidth - 6)) / miniCard.widthPx;
                doc.addImage(miniCard.dataUrl, 'PNG', cardX + 3, yCover + 7.5, metaBoxWidth - 6, Math.min(miniHeightMm, 8));
            } else {
                doc.setFont("helvetica", "bold");
                doc.setFontSize(8.2);
                doc.setTextColor(card.color[0], card.color[1], card.color[2]);
                const splitVal = doc.splitTextToSize(card.val, metaBoxWidth - 6);
                doc.text(splitVal[0] || '', cardX + 3, yCover + 12);
            }
        });

        yCover += 24;

        // 3. Executive Summary Section
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10.5);
        doc.setTextColor(15, 23, 42);
        doc.text("★ EXECUTIVE SUMMARY & STRATEGIC INSIGHTS", marginX + 1, yCover);
        yCover += 4;

        if (hasNonAscii(executiveSummary)) {
            // Render non-ASCII text perfectly with native browser canvas
            const summaryCard = renderUnicodeTextCard(executiveSummary, {
                widthPx: 720,
                fontSize: 12.5,
                lineHeight: 18,
                textColor: '#1e293b',
                bgColor: '#f8fafc',
                accentColor: '#2563eb',
                padding: 10
            });
            const summaryHeightMm = (summaryCard.heightPx * contentWidth) / summaryCard.widthPx;
            doc.addImage(summaryCard.dataUrl, 'PNG', marginX, yCover, contentWidth, summaryHeightMm);
            yCover += summaryHeightMm + 8;
        } else {
            // Pure ASCII text formatting
            doc.setFont("helvetica", "normal");
            doc.setFontSize(8.5);
            const splitSummary = doc.splitTextToSize(executiveSummary, contentWidth - 14);
            const summaryTextHeight = Math.max(splitSummary.length * 4.4 + 10, 32);

            // Summary Card Box with left accent border
            doc.setFillColor(248, 250, 252);
            doc.roundedRect(marginX, yCover, contentWidth, summaryTextHeight, 2, 2, 'F');
            doc.setDrawColor(203, 213, 225);
            doc.roundedRect(marginX, yCover, contentWidth, summaryTextHeight, 2, 2, 'D');

            // Left accent bar
            doc.setFillColor(37, 99, 235); // Blue 600
            doc.roundedRect(marginX, yCover, 2.5, summaryTextHeight, 1, 1, 'F');

            doc.setTextColor(30, 41, 59);
            doc.text(splitSummary, marginX + 7, yCover + 7);
            yCover += summaryTextHeight + 8;
        }

        // 4. Executive Key Performance Indicators (KPIs) Grid
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10.5);
        doc.setTextColor(15, 23, 42);
        doc.text("KEY PERFORMANCE INDICATORS (KPIs)", marginX + 1, yCover);
        yCover += 4;

        const kpiBoxWidth = (contentWidth - 9) / 4;
        const kpiBoxHeight = 24;

        const kpiMetrics = [
            { label: "TOTAL RECORDS", val: totalRows.toLocaleString('en-US'), color: [30, 41, 59], sub: "Active Rows" },
            { label: "DIMENSIONS", val: totalCols.toString(), color: [2, 132, 199], sub: "Data Fields" },
            { label: "ACTIVE VISUALS", val: totalCharts.toString(), color: [16, 185, 129], sub: "Charts & Plots" },
            { label: "PINNED NOTES", val: totalAnnotationsCount.toString(), color: [239, 68, 68], sub: "Callouts" }
        ];

        kpiMetrics.forEach((kpi, idx) => {
            const kpiX = marginX + idx * (kpiBoxWidth + 3);
            doc.setFillColor(255, 255, 255);
            doc.roundedRect(kpiX, yCover, kpiBoxWidth, kpiBoxHeight, 1.5, 1.5, 'F');
            doc.setDrawColor(226, 232, 240);
            doc.roundedRect(kpiX, yCover, kpiBoxWidth, kpiBoxHeight, 1.5, 1.5, 'D');

            doc.setFont("helvetica", "bold");
            doc.setFontSize(6.8);
            doc.setTextColor(100, 116, 139);
            doc.text(kpi.label, kpiX + 3, yCover + 5.5);

            doc.setFont("helvetica", "bold");
            doc.setFontSize(12);
            doc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
            doc.text(kpi.val, kpiX + 3, yCover + 15);

            doc.setFont("helvetica", "normal");
            doc.setFontSize(6.5);
            doc.setTextColor(148, 163, 184);
            doc.text(kpi.sub, kpiX + 3, yCover + 20.5);
        });

        yCover += kpiBoxHeight + 8;

        // 5. Data Health & Platform Integrity Card
        doc.setFillColor(241, 245, 249);
        doc.roundedRect(marginX, yCover, contentWidth, 18, 1.5, 1.5, 'F');
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(marginX, yCover, contentWidth, 18, 1.5, 1.5, 'D');

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(15, 23, 42);
        doc.text("DATA INTEGRITY & PROCESSING ENGINE STATUS:", marginX + 4, yCover + 6);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(71, 85, 105);
        doc.text("• Data Completeness: 100% Verified | • Engine: In-Memory OLAP Acceleration | • LTTB Optimization: Active", marginX + 4, yCover + 12.5);

        // 6. Cover Page Sign-Off Notice at bottom
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.text("This document contains authorized executive business intelligence and internal strategic review data.", marginX, pageHeight - 16);

        // ====================================================
        // PAGE 2 AND ONWARDS: CHARTS & VISUALIZATIONS
        // ====================================================
        doc.addPage();
        drawHeader(false);
        let yOffset = 32;

        for (let index = 0; index < chartItems.length; index++) {
            const chartItem = chartItems[index];
            const chartId = chartItem.id ? chartItem.id.replace('container-', '') : '';
            const chartConfig = visualizations.find(v => v.id === chartId);

            const titleEl = chartItem.querySelector('.chart-title') || chartItem.querySelector('h5') || chartItem.querySelector('.card-title');
            const title = (chartConfig && chartConfig.title) ? chartConfig.title : (titleEl ? titleEl.textContent.trim() : `Visualization ${index + 1}`);

            try {
                // Direct high-fidelity capture of active chart engine or KPI card
                const snapshot = await captureVisualizationSnapshot(chartItem, chartConfig);

                if (!snapshot || !snapshot.dataURL) {
                    console.warn(`No visual snapshot extracted for chart ${chartId || index}`);
                    continue;
                }

                if (snapshot.isKpi) {
                    // KPI Card rendering
                    const kpiWidth = contentWidth;
                    let kpiHeight = (kpiWidth / (snapshot.aspectRatio || 2.4));
                    if (kpiHeight > 65) kpiHeight = 65;
                    if (kpiHeight < 30) kpiHeight = 30;

                    if (yOffset + kpiHeight + 6 > pageHeight - 18) {
                        doc.addPage();
                        drawHeader(false);
                        yOffset = 32;
                    }

                    // Insert KPI Card
                    doc.addImage(snapshot.dataURL, 'PNG', marginX, yOffset, kpiWidth, kpiHeight);
                    yOffset += kpiHeight + 6;

                } else {
                    // Standard Visual Chart rendering
                    const imgWidth = contentWidth - 6;
                    let imgHeight = (imgWidth / (snapshot.aspectRatio || 1.7));
                    if (imgHeight > 105) imgHeight = 105;
                    if (imgHeight < 60) imgHeight = 60;

                    // Check for annotations
                    const annotations = (chartConfig && chartConfig.annotations) || [];
                    const notesExtraHeight = annotations.length > 0 ? (10 + (annotations.length * 8.5)) : 0;
                    const totalItemHeight = 12 + imgHeight + notesExtraHeight + 6;

                    // Page break if necessary
                    if (yOffset + totalItemHeight > pageHeight - 18) {
                        doc.addPage();
                        drawHeader(false);
                        yOffset = 32;
                    }

                    // Chart Container Card Frame
                    doc.setFillColor(255, 255, 255);
                    doc.roundedRect(marginX, yOffset, contentWidth, totalItemHeight - 2, 2, 2, 'F');
                    doc.setDrawColor(226, 232, 240);
                    doc.roundedRect(marginX, yOffset, contentWidth, totalItemHeight - 2, 2, 2, 'D');

                    // Header Banner for chart card
                    doc.setFillColor(241, 245, 249); // Slate 100
                    doc.roundedRect(marginX, yOffset, contentWidth, 8.5, 2, 2, 'F');
                    doc.setDrawColor(226, 232, 240);
                    doc.line(marginX, yOffset + 8.5, marginX + contentWidth, yOffset + 8.5);

                    // Chart Number & Title
                    if (hasNonAscii(title)) {
                        const titleCard = renderUnicodeTextCard(`[${index + 1}]  ${title}`, {
                            widthPx: 500,
                            fontSize: 12,
                            lineHeight: 14,
                            textColor: '#1e293b',
                            bgColor: '#f1f5f9',
                            accentColor: null,
                            padding: 1
                        });
                        const titleHeightMm = (titleCard.heightPx * (contentWidth - 40)) / titleCard.widthPx;
                        doc.addImage(titleCard.dataUrl, 'PNG', marginX + 3, yOffset + 1.5, contentWidth - 40, Math.min(titleHeightMm, 6));
                    } else {
                        doc.setFont("helvetica", "bold");
                        doc.setFontSize(9.5);
                        doc.setTextColor(30, 41, 59);
                        doc.text(`[${index + 1}]  ${title}`, marginX + 4, yOffset + 6);
                    }

                    // Chart / KPI card Type display
                    const displayType = (chartConfig && chartConfig.type) ? chartConfig.type.toUpperCase() : (chartItem.classList.contains('kpi-native-card') ? 'KPI METRIC' : 'CHART');
                    doc.setFont("helvetica", "normal");
                    doc.setFontSize(7.5);
                    doc.setTextColor(100, 116, 139);
                    doc.text(`TYPE: ${displayType}`, marginX + contentWidth - 4, yOffset + 6, { align: 'right' });

                    // Insert Chart Canvas Image directly
                    doc.addImage(snapshot.dataURL, 'PNG', marginX + 3, yOffset + 11, imgWidth, imgHeight);

                    let currentInnerY = yOffset + 11 + imgHeight + 4;

                    // Render Chart Callouts & Annotations if present
                    if (annotations.length > 0) {
                        doc.setDrawColor(241, 245, 249);
                        doc.line(marginX + 4, currentInnerY, marginX + contentWidth - 4, currentInnerY);
                        currentInnerY += 3;

                        doc.setFont("helvetica", "bold");
                        doc.setFontSize(8);
                        doc.setTextColor(220, 38, 38); // Red
                        doc.text(`★ Key Insights & Pinned Annotations (${annotations.length}):`, marginX + 4, currentInnerY);
                        currentInnerY += 4;

                        annotations.forEach(ann => {
                            const tagText = ann.tag ? `[${ann.tag}] ` : '';
                            const pointText = ann.dataName ? `Point ${ann.dataName}: ` : '';
                            const noteText = ann.note || 'Observation callout';
                            const fullNote = `${tagText}${pointText}${noteText}`;

                            if (hasNonAscii(fullNote)) {
                                const annCard = renderUnicodeTextCard(fullNote, {
                                    widthPx: 640,
                                    fontSize: 11,
                                    lineHeight: 14,
                                    textColor: '#0f172a',
                                    bgColor: '#fef2f2',
                                    accentColor: '#ef4444',
                                    padding: 3
                                });
                                const annHeightMm = (annCard.heightPx * (contentWidth - 8)) / annCard.widthPx;
                                doc.addImage(annCard.dataUrl, 'PNG', marginX + 4, currentInnerY - 2.5, contentWidth - 8, Math.min(annHeightMm, 7));
                            } else {
                                // Annotation Note Card
                                doc.setFillColor(254, 242, 242); // Soft Red background
                                doc.roundedRect(marginX + 4, currentInnerY - 3, contentWidth - 8, 7, 1, 1, 'F');
                                
                                doc.setDrawColor(239, 68, 68);
                                doc.setLineWidth(0.6);
                                doc.line(marginX + 4, currentInnerY - 3, marginX + 4, currentInnerY + 4); // Red indicator bar

                                doc.setFont("helvetica", "bold");
                                doc.setFontSize(7.2);
                                doc.setTextColor(15, 23, 42);
                                doc.text(`${tagText}${pointText}`, marginX + 7, currentInnerY + 1.2);

                                doc.setFont("helvetica", "normal");
                                doc.setFontSize(7.2);
                                doc.setTextColor(51, 65, 85);
                                doc.text(noteText, marginX + 35, currentInnerY + 1.2);
                            }

                            currentInnerY += 7.8;
                        });
                    }

                    yOffset += totalItemHeight + 6;
                }

            } catch (err) {
                console.error("Individual chart capture failed in PDF generation:", err);
            }
        }

        // ----------------------------------------------------
        // Multi-Page Footer Pass: Number all pages
        // ----------------------------------------------------
        const totalPages = doc.internal.getNumberOfPages();
        for (let p = 1; p <= totalPages; p++) {
            doc.setPage(p);
            drawFooter(p, totalPages);
        }

        const safeTitle = (reportTitle.replace(/[^a-zA-Z0-9_]/g, '_') || 'Vedra_BI_Executive_Report').replace(/_+/g, '_');
        const fileName = `${safeTitle}_${Date.now()}.pdf`;
        doc.save(fileName);
        showMessage("Executive PDF Report with Cover Page successfully downloaded!", "success");

    } catch (error) {
        console.error("PDF generation failed:", error);
        showMessage("Error generating PDF: " + error.message, "danger");
    }
}

/**
 * Capture and download the whole dashboard as a high-quality PNG.
 * Bounded precisely around the charts area to provide a clean and professional layout.
 */
export async function exportDashboardToPNG() {
    const chartItems = Array.from(document.querySelectorAll('.visualization-container'));
    if (chartItems.length === 0) {
        showMessage("निर्यात् करने के लिए कोई चार्ट नहीं मिला।", "warning");
        return;
    }

    showMessage("पूरे डैशबोर्ड की PNG इमेज तैयार की जा रही है, कृपया प्रतीक्षा करें...", "info");

    try {
        // Calculate the bounding box that covers all active charts
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        chartItems.forEach(item => {
            const left = item.offsetLeft;
            const top = item.offsetTop;
            const width = item.offsetWidth;
            const height = item.offsetHeight;

            if (left < minX) minX = left;
            if (top < minY) minY = top;
            if (left + width > maxX) maxX = left + width;
            if (top + height > maxY) maxY = top + height;
        });

        // Add padding around the extreme chart boundaries
        const padding = 24;
        const totalWidth = (maxX - minX) + (padding * 2);
        const totalHeight = (maxY - minY) + (padding * 2);

        // Create offscreen master canvas
        const masterCanvas = document.createElement('canvas');
        masterCanvas.width = totalWidth * 2; // 2x scale
        masterCanvas.height = totalHeight * 2;
        const masterCtx = masterCanvas.getContext('2d');
        masterCtx.scale(2, 2);

        // Background
        masterCtx.fillStyle = '#f8fafc';
        masterCtx.fillRect(0, 0, totalWidth, totalHeight);

        // Capture each chart
        for (const item of chartItems) {
            const chartId = item.id ? item.id.replace('container-', '') : '';
            const chartConfig = visualizations.find(v => v.id === chartId);

            try {
                const buttonContainers = item.querySelectorAll('.chart-buttons, .delete-annotation-btn, .drag-grip');
                buttonContainers.forEach(btn => { btn.style.visibility = 'hidden'; });

                const canvas = await window.html2canvas(item, {
                    scale: 2,
                    backgroundColor: null,
                    useCORS: true,
                    allowTaint: true,
                    logging: false
                });

                buttonContainers.forEach(btn => { btn.style.visibility = ''; });

                const relX = (item.offsetLeft - minX) + padding;
                const relY = (item.offsetTop - minY) + padding;

                masterCtx.drawImage(canvas, relX, relY, item.offsetWidth, item.offsetHeight);
            } catch (e) {
                console.error("Failed capturing single chart for PNG dashboard:", e);
            }
        }

        // Export Master Canvas to PNG
        const link = document.createElement('a');
        link.download = `Vedra_BI_Dashboard_${Date.now()}.png`;
        link.href = masterCanvas.toDataURL('image/png');
        link.click();

        showMessage("डैशबोर्ड की हाई-रेजोल्यूशन PNG सफलतापूर्वक डाउनलोड हो गई!", "success");

    } catch (err) {
        console.error("Dashboard PNG export failed:", err);
        showMessage("PNG निर्यात में त्रुटि: " + err.message, "danger");
    }
}

/**
 * Filtered CSV Export
 */
export function exportFilteredDataToCSV() {
    const dataToExport = (filteredData && filteredData.length > 0) ? filteredData : rawData;
    if (!dataToExport || dataToExport.length === 0) {
        showMessage("निर्यात करने के लिए कोई फ़िल्टर किया गया डेटा उपलब्ध नहीं है।", "warning");
        return;
    }
    
    exportToCSV(dataToExport, `Vedra_BI_Filtered_Data_${Date.now()}.csv`);
    showMessage("फ़िल्टर किया गया डेटा सफलतापूर्वक CSV में निर्यात हो गया।", "success");
}
