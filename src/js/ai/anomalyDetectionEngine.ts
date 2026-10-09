// src/js/ai/anomalyDetectionEngine.ts
import { rawData, filteredData, headers } from '../../store/DataHandler.ts';
import { showMessage } from '../core/utils.ts';
import { addVisualization } from '../charts/charts.ts';

export interface AnomalyItem {
    id: string;
    rowIndex: number;
    column: string;
    labelColumn?: string;
    labelValue?: string;
    value: number;
    mean: number;
    stdDev: number;
    zScore: number;
    type: 'surge' | 'plunge' | 'outlier';
    severity: 'critical' | 'warning';
    description: string;
}

export interface AnomalyDetectionResult {
    totalAnomalies: number;
    anomalies: AnomalyItem[];
    scannedColumns: string[];
    html: string;
}

export function detectAnomalies(customData?: any[], targetColumn?: string): AnomalyDetectionResult {
    const data = customData && customData.length > 0 ? customData : (filteredData.length > 0 ? filteredData : rawData);
    
    if (!data || data.length < 3 || !headers || headers.length === 0) {
        return {
            totalAnomalies: 0,
            anomalies: [],
            scannedColumns: [],
            html: `
                <div class="p-3 bg-light rounded-3 border text-center text-muted small">
                    <i class="bi bi-info-circle me-1"></i> असंगति पहचान (Anomaly Detection) के लिए कम से कम 3 पंक्तियों का डेटा आवश्यक है।
                </div>
            `
        };
    }

    // 1. Identify Numeric Columns & Categorical Label Columns
    const numericCols: string[] = [];
    const labelCols: string[] = [];

    headers.forEach(h => {
        let numCount = 0;
        let totalCount = 0;
        for (let i = 0; i < Math.min(data.length, 60); i++) {
            const v = data[i][h];
            if (v !== undefined && v !== null && v !== '') {
                totalCount++;
                if (!isNaN(Number(v))) numCount++;
            }
        }
        if (totalCount > 0 && numCount / totalCount >= 0.7) {
            numericCols.push(h);
        } else {
            labelCols.push(h);
        }
    });

    const columnsToScan = targetColumn ? [targetColumn] : numericCols;
    const labelCol = labelCols.find(c => /name|category|product|item|date|month|year|city|उत्पाद|श्रेणी|महीना/i.test(c)) || labelCols[0] || headers[0];

    const detectedAnomalies: AnomalyItem[] = [];

    columnsToScan.forEach(col => {
        const values: { val: number; index: number; row: any }[] = [];
        data.forEach((r, idx) => {
            const num = Number(r[col]);
            if (!isNaN(num)) {
                values.push({ val: num, index: idx, row: r });
            }
        });

        if (values.length < 3) return;

        // Mean & StdDev
        const sum = values.reduce((acc, v) => acc + v.val, 0);
        const mean = sum / values.length;
        const variance = values.reduce((acc, v) => acc + Math.pow(v.val - mean, 2), 0) / (values.length - 1);
        const stdDev = Math.sqrt(variance);

        // Sorting for IQR
        const sorted = [...values].sort((a, b) => a.val - b.val);
        const q1 = sorted[Math.floor(sorted.length * 0.25)].val;
        const q3 = sorted[Math.floor(sorted.length * 0.75)].val;
        const iqr = q3 - q1;
        const lowerBound = q1 - 1.5 * iqr;
        const upperBound = q3 + 1.5 * iqr;

        values.forEach((item, seqIndex) => {
            const z = stdDev > 0 ? (item.val - mean) / stdDev : 0;
            const isZOutlier = Math.abs(z) >= 2.3;
            const isIqrOutlier = (item.val < lowerBound && lowerBound < q1) || (item.val > upperBound && upperBound > q3);

            let isSequentialSurgeOrPlunge = false;
            let seqType: 'surge' | 'plunge' = 'surge';
            let seqDropPercent = 0;

            if (seqIndex > 0) {
                const prev = values[seqIndex - 1].val;
                if (prev > 0) {
                    const delta = ((item.val - prev) / prev) * 100;
                    if (delta <= -38) {
                        isSequentialSurgeOrPlunge = true;
                        seqType = 'plunge';
                        seqDropPercent = Math.abs(delta);
                    } else if (delta >= 80 && Math.abs(z) >= 1.8) {
                        isSequentialSurgeOrPlunge = true;
                        seqType = 'surge';
                    }
                }
            }

            if (isZOutlier || isIqrOutlier || isSequentialSurgeOrPlunge) {
                const labelVal = item.row[labelCol] ? String(item.row[labelCol]) : `पंक्ति #${item.index + 1}`;
                let desc = "";
                let type: 'surge' | 'plunge' | 'outlier' = 'outlier';
                let severity: 'critical' | 'warning' = 'warning';

                if (seqType === 'plunge' || z < -2.0) {
                    type = 'plunge';
                    severity = 'critical';
                    desc = `अचानक तीव्र गिरावट: **${labelVal}** में **${col}** का मान सामान्य औसत (${mean.toFixed(1)}) से काफी नीचे गिरकर **${item.val}** दर्ज हुआ${seqDropPercent > 0 ? ` (पिछले अंतराल से -${seqDropPercent.toFixed(1)}% की गिरावट)` : ''}।`;
                } else if (seqType === 'surge' || z > 2.5) {
                    type = 'surge';
                    severity = 'critical';
                    desc = `असामान्य रूप से तीव्र उछाल: **${labelVal}** में **${col}** का मान औसत (${mean.toFixed(1)}) से **${(item.val / (mean || 1)).toFixed(1)}x गुना अधिक (${item.val})** पाया गया।`;
                } else {
                    desc = `सांख्यिकीय आउटलायर: **${labelVal}** का **${col}** मान (${item.val}) सामान्य अपेक्षित सीमा (${Math.max(0, lowerBound).toFixed(1)} - ${upperBound.toFixed(1)}) से बाहर है।`;
                }

                detectedAnomalies.push({
                    id: `anomaly_${col}_${item.index}_${Date.now()}`,
                    rowIndex: item.index,
                    column: col,
                    labelColumn: labelCol,
                    labelValue: labelVal,
                    value: item.val,
                    mean,
                    stdDev,
                    zScore: z,
                    type,
                    severity,
                    description: desc
                });
            }
        });
    });

    // Deduplicate or cap to top 5 most impactful anomalies
    const topAnomalies = detectedAnomalies.sort((a, b) => Math.abs(b.zScore) - Math.abs(a.zScore)).slice(0, 5);

    const cardId = `anomaly_card_${Date.now()}`;
    let cardHtml = "";

    if (topAnomalies.length === 0) {
        cardHtml = `
            <div class="anomaly-report-card p-3.5 bg-white border border-slate-200 rounded-3 shadow-sm" id="${cardId}" style="border-left: 4px solid #10b981 !important;">
                <div class="d-flex align-items-center gap-2 mb-2">
                    <span class="badge bg-emerald-100 text-emerald-700 p-1.5 rounded-2">
                        <i class="bi bi-shield-check fs-6"></i>
                    </span>
                    <div>
                        <h6 class="mb-0 fw-bold text-slate-800" style="font-size: 0.95rem;">असंगति जांच: कोई आउटलायर नहीं मिला</h6>
                        <span class="text-muted text-2xs">स्कैन किए गए कॉलम: ${columnsToScan.join(', ')}</span>
                    </div>
                </div>
                <p class="text-slate-600 small mb-0">आपके वर्तमान डेटासेट में सभी मान अपेक्षित सांख्यिकीय सीमा (Z-Score & IQR) के भीतर पूरी तरह सामान्य और सुसंगत हैं।</p>
            </div>
        `;
    } else {
        cardHtml = `
            <div class="anomaly-report-card p-3.5 bg-white border border-slate-200 rounded-3 shadow-sm" id="${cardId}" style="border-left: 4px solid #ef4444 !important;">
                <div class="d-flex align-items-center justify-content-between mb-2.5 border-bottom pb-2">
                    <div class="d-flex align-items-center gap-2">
                        <span class="badge bg-rose-100 text-rose-700 p-1.5 rounded-2">
                            <i class="bi bi-shield-exclamation fs-6"></i>
                        </span>
                        <div>
                            <h6 class="mb-0 fw-bold text-slate-800" style="font-size: 0.95rem;">असंगति पहचान अलर्ट (${topAnomalies.length} आउटलायर्स मिले)</h6>
                            <span class="text-muted text-2xs">स्कैन किए गए कॉलम: ${columnsToScan.join(', ')}</span>
                        </div>
                    </div>
                    <span class="badge bg-danger text-white text-2xs px-2 py-1 rounded-pill">
                        <i class="bi bi-bell-fill me-1"></i> ध्यान दें
                    </span>
                </div>

                <div class="anomaly-list mb-3 d-flex flex-column gap-2">
                    ${topAnomalies.map(a => `
                        <div class="p-2.5 rounded-2 border ${a.severity === 'critical' ? 'bg-rose-50 border-rose-200' : 'bg-amber-50 border-amber-200'}" style="font-size: 0.8rem;">
                            <div class="d-flex align-items-center justify-content-between mb-1">
                                <span class="fw-bold text-slate-800">
                                    <i class="bi ${a.type === 'plunge' ? 'bi-graph-down-arrow text-danger' : a.type === 'surge' ? 'bi-graph-up-arrow text-success' : 'bi-exclamation-circle text-warning'} me-1"></i>
                                    ${a.labelValue} (${a.column})
                                </span>
                                <span class="badge ${a.severity === 'critical' ? 'bg-danger' : 'bg-warning text-dark'} text-2xs">
                                    ${a.type === 'plunge' ? 'तीव्र गिरावट' : a.type === 'surge' ? 'तीव्र उछाल' : 'आउटलायर'} (Z: ${a.zScore.toFixed(1)})
                                </span>
                            </div>
                            <div class="text-slate-700" style="line-height: 1.45;">${a.description}</div>
                        </div>
                    `).join('')}
                </div>

                <div class="d-flex align-items-center justify-content-between pt-2 border-top">
                    <span class="text-muted text-2xs"><i class="bi bi-cpu me-1 text-primary"></i> Vedra AI Outlier Detector</span>
                    <button class="btn btn-xs btn-outline-danger d-flex align-items-center gap-1 btn-plot-anomaly-chart" data-col="${topAnomalies[0].column}" data-label="${topAnomalies[0].labelColumn || headers[0]}">
                        <i class="bi bi-bar-chart-fill"></i> असंगति ब्रेकडाउन चार्ट बनाएं
                    </button>
                </div>
            </div>
        `;
    }

    return {
        totalAnomalies: topAnomalies.length,
        anomalies: topAnomalies,
        scannedColumns: columnsToScan,
        html: cardHtml
    };
}

export function attachAnomalyCardListeners(container: HTMLElement = document.body): void {
    container.querySelectorAll('.btn-plot-anomaly-chart').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const col = (btn as HTMLElement).dataset.col || headers[1] || headers[0];
            const labelCol = (btn as HTMLElement).dataset.label || headers[0];
            await addVisualization(labelCol, [col], null, "bar", `आउटलायर ब्रेकडाउन: ${col} बनाम ${labelCol}`);
            showMessage(`असंगति विश्लेषण चार्ट डैशबोर्ड पर जोड़ा गया!`, "success");
        });
    });
}
