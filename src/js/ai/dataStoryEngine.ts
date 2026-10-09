// src/js/ai/dataStoryEngine.ts
import { rawData, filteredData, headers } from '../../store/DataHandler.ts';
import { showMessage } from '../core/utils.ts';
import { createBox } from '../ui/editor.js';
import { addVisualization } from '../charts/charts.ts';

export interface DataStoryResult {
    title: string;
    summaryMetrics: {
        totalRows: number;
        primaryMetric: string;
        totalValue: number;
        averageValue: number;
        maxValue: number;
        minValue: number;
        topCategory?: string;
        topCategoryValue?: number;
    };
    paragraphs: {
        trend: string;
        performance: string;
        recommendations: string[];
    };
    html: string;
}

export function generateExecutiveDataStory(customData?: any[]): DataStoryResult {
    const data = customData && customData.length > 0 ? customData : (filteredData.length > 0 ? filteredData : rawData);
    
    if (!data || data.length === 0 || !headers || headers.length === 0) {
        const fallbackHtml = `
            <div class="data-story-card p-3 bg-light rounded-3 border border-slate-200">
                <div class="d-flex align-items-center gap-2 mb-2 text-warning">
                    <i class="bi bi-exclamation-triangle-fill fs-5"></i>
                    <h6 class="mb-0 fw-bold">डेटा स्टोरी के लिए पर्याप्त डेटा उपलब्ध नहीं है</h6>
                </div>
                <p class="text-muted small mb-0">कृपया पहले CSV, Excel या मॉक डेटा लोड करें ताकि AI एग्जीक्यूटिव समरी तैयार कर सके।</p>
            </div>
        `;
        return {
            title: "No Data Available",
            summaryMetrics: { totalRows: 0, primaryMetric: "N/A", totalValue: 0, averageValue: 0, maxValue: 0, minValue: 0 },
            paragraphs: { trend: "No data loaded.", performance: "No data loaded.", recommendations: [] },
            html: fallbackHtml
        };
    }

    // 1. Identify Numeric Columns & Categorical Columns
    const numericCols: string[] = [];
    const categoricalCols: string[] = [];

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
            numericCols.push(h);
        } else {
            categoricalCols.push(h);
        }
    });

    // Primary Metric Selection
    let primaryMetric = numericCols.find(c => /sales|revenue|amount|profit|total|price|cost|मूल्य|बिक्री|राशि|लाभ/i.test(c)) || numericCols[0] || headers[0];
    let primaryDimension = categoricalCols.find(c => /category|product|item|region|city|department|name|उत्पाद|श्रेणी|शहर|विभाग/i.test(c)) || categoricalCols[0] || headers[0];

    // Compute metrics
    let totalVal = 0;
    let maxVal = -Infinity;
    let minVal = Infinity;
    let count = 0;
    const categoryTotals: Record<string, number> = {};

    data.forEach(row => {
        const val = Number(row[primaryMetric]);
        if (!isNaN(val)) {
            totalVal += val;
            count++;
            if (val > maxVal) maxVal = val;
            if (val < minVal) minVal = val;
        }

        if (primaryDimension && row[primaryDimension] !== undefined) {
            const cat = String(row[primaryDimension]);
            categoryTotals[cat] = (categoryTotals[cat] || 0) + (isNaN(val) ? 1 : val);
        }
    });

    const avgVal = count > 0 ? totalVal / count : 0;
    if (maxVal === -Infinity) maxVal = 0;
    if (minVal === Infinity) minVal = 0;

    // Top Category
    let topCat = "N/A";
    let topCatVal = 0;
    let lowestCat = "N/A";
    let lowestCatVal = Infinity;

    Object.entries(categoryTotals).forEach(([cat, val]) => {
        if (val > topCatVal) {
            topCatVal = val;
            topCat = cat;
        }
        if (val < lowestCatVal) {
            lowestCatVal = val;
            lowestCat = cat;
        }
    });

    if (lowestCatVal === Infinity) lowestCatVal = 0;

    // Sequential Trend Assessment
    let trendDirection = "संतुलित और स्थिर";
    if (data.length >= 4 && count >= 4) {
        const firstHalf = data.slice(0, Math.floor(data.length / 2));
        const secondHalf = data.slice(Math.floor(data.length / 2));
        const firstSum = firstHalf.reduce((acc, r) => acc + (Number(r[primaryMetric]) || 0), 0) / (firstHalf.length || 1);
        const secondSum = secondHalf.reduce((acc, r) => acc + (Number(r[primaryMetric]) || 0), 0) / (secondHalf.length || 1);
        const diffPercent = firstSum > 0 ? ((secondSum - firstSum) / firstSum) * 100 : 0;

        if (diffPercent > 10) {
            trendDirection = `सकारात्मक वृद्धि (+${diffPercent.toFixed(1)}% की तेजी)`;
        } else if (diffPercent < -10) {
            trendDirection = `गिरावट का दबाव (${diffPercent.toFixed(1)}% की कमी)`;
        }
    }

    // Paragraph 1: Trend & Momentum
    const formatNum = (n: number) => n.toLocaleString('en-IN', { maximumFractionDigits: 1 });
    const p1 = `डेटासेट में कुल **${data.length} रिकॉर्ड्स** का गहन विश्लेषण किया गया है। मुख्य मीट्रिक **"${primaryMetric}"** का कुल संचयी मूल्य **₹${formatNum(totalVal)}** है, जिसमें औसत प्रति रिकॉर्ड **₹${formatNum(avgVal)}** दर्ज हुआ है। समय और क्रमवार डेटा को देखने पर परफॉरमेंस की दिशा **${trendDirection}** की ओर अग्रसर है, जो व्यावसायिक संचालन के लिए एक महत्वपूर्ण संकेतक है।`;

    // Paragraph 2: Highs vs Lows
    const p2 = `परफॉरमेंस विस्तार में, उच्चतम एकल रिकॉर्ड **₹${formatNum(maxVal)}** तक पहुंचा, जबकि न्यूनतम स्तर **₹${formatNum(minVal)}** रहा। श्रेणी विश्लेषण के आधार पर **"${topCat}"** सबसे बड़ा योगदानकर्ता बनकर उभरा है, जिसका कुल मूल्य **₹${formatNum(topCatVal)}** है। दूसरी ओर, **"${lowestCat}"** खंड (मूल्य: **₹${formatNum(lowestCatVal)}**) में गतिविधि सबसे धीमी रही है, जो तत्काल रणनीतिक सुदृढ़ीकरण की मांग करती है।`;

    // Paragraph 3: Recommendations
    const recs = [
        `शीर्ष प्रदर्शनकर्ता खंड **"${topCat}"** के सफल पैटर्न को अन्य श्रेणियों में दोहराएं और इन्वेंट्री/मार्केटिंग का 40% हिस्सा इस पर केंद्रित करें।`,
        `कमजोर खंड **"${lowestCat}"** की लागत और रूपांतरण दर का ऑडिट करें, ताकि मार्जिन के नुकसान को समय रहते रोका जा सके।`,
        `**"${primaryMetric}"** के उतार-चढ़ाव (अधिकतम ₹${formatNum(maxVal)} vs न्यूनतम ₹${formatNum(minVal)}) को स्थिर करने के लिए डायनामिक मूल्य निर्धारण या लक्षित प्रोत्साहन नीति लागू करें।`
    ];

    const cardId = `story_card_${Date.now()}`;
    const cardHtml = `
        <div class="data-story-card p-3.5 bg-white border border-slate-200 rounded-3 shadow-sm" id="${cardId}" style="border-left: 4px solid #6366f1 !important;">
            <div class="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
                <div class="d-flex align-items-center gap-2">
                    <span class="badge bg-indigo-100 text-indigo-700 p-1.5 rounded-2">
                        <i class="bi bi-journal-text fs-6"></i>
                    </span>
                    <div>
                        <h6 class="mb-0 fw-bold text-slate-800" style="font-size: 0.95rem;">ऑटोमैटिक एग्जीक्यूटिव डेटा स्टोरी (AI Story)</h6>
                        <span class="text-muted text-2xs">${data.length} रिकॉर्ड्स | मीट्रिक: ${primaryMetric}</span>
                    </div>
                </div>
                <div class="d-flex gap-1">
                    <button class="btn btn-xs btn-outline-secondary btn-copy-story" title="कॉपी करें" data-story-id="${cardId}">
                        <i class="bi bi-clipboard"></i>
                    </button>
                    <button class="btn btn-xs btn-outline-primary btn-pin-story" title="डैशबोर्ड नोट्स में पिन करें" data-story-id="${cardId}">
                        <i class="bi bi-pin-angle-fill"></i>
                    </button>
                </div>
            </div>

            <!-- Quick Stat Badges -->
            <div class="row g-2 mb-3">
                <div class="col-6 col-sm-3">
                    <div class="p-2 bg-slate-50 border rounded-2 text-center">
                        <div class="text-muted text-2xs">कुल मूल्य</div>
                        <div class="fw-bold text-indigo-700 text-xs text-truncate">₹${formatNum(totalVal)}</div>
                    </div>
                </div>
                <div class="col-6 col-sm-3">
                    <div class="p-2 bg-slate-50 border rounded-2 text-center">
                        <div class="text-muted text-2xs">औसत</div>
                        <div class="fw-bold text-emerald-700 text-xs text-truncate">₹${formatNum(avgVal)}</div>
                    </div>
                </div>
                <div class="col-6 col-sm-3">
                    <div class="p-2 bg-slate-50 border rounded-2 text-center">
                        <div class="text-muted text-2xs">शीर्ष श्रेणी</div>
                        <div class="fw-bold text-slate-800 text-xs text-truncate">${topCat}</div>
                    </div>
                </div>
                <div class="col-6 col-sm-3">
                    <div class="p-2 bg-slate-50 border rounded-2 text-center">
                        <div class="text-muted text-2xs">अधिकतम रिकॉर्ड</div>
                        <div class="fw-bold text-rose-700 text-xs text-truncate">₹${formatNum(maxVal)}</div>
                    </div>
                </div>
            </div>

            <!-- 3 Story Paragraphs -->
            <div class="story-content mb-3" style="font-size: 0.82rem; line-height: 1.55; color: #334155;">
                <p class="mb-2"><strong>1. मुख्य ट्रेंड एवं सारांश:</strong> ${p1}</p>
                <p class="mb-2"><strong>2. उच्चतम एवं न्यूनतम क्षेत्र:</strong> ${p2}</p>
                <div class="mb-1">
                    <strong>3. व्यवसाय के लिए 3 रणनीतिक कदम:</strong>
                    <ul class="mb-0 ps-3 mt-1 text-slate-700">
                        ${recs.map(r => `<li class="mb-1">${r}</li>`).join('')}
                    </ul>
                </div>
            </div>

            <!-- Interactive Action Footer -->
            <div class="d-flex align-items-center justify-content-between pt-2 border-top">
                <span class="text-muted text-2xs"><i class="bi bi-robot me-1 text-primary"></i> Vedra AI Storytelling Engine</span>
                <button class="btn btn-xs btn-primary d-flex align-items-center gap-1 btn-plot-story-chart" data-dim="${primaryDimension}" data-metric="${primaryMetric}">
                    <i class="bi bi-bar-chart-line-fill"></i> इस स्टोरी का चार्ट बनाएं
                </button>
            </div>
        </div>
    `;

    return {
        title: `Executive Story for ${primaryMetric}`,
        summaryMetrics: {
            totalRows: data.length,
            primaryMetric,
            totalValue: totalVal,
            averageValue: avgVal,
            maxValue: maxVal,
            minValue: minVal,
            topCategory: topCat,
            topCategoryValue: topCatVal
        },
        paragraphs: {
            trend: p1,
            performance: p2,
            recommendations: recs
        },
        html: cardHtml
    };
}

export function attachStoryCardListeners(container: HTMLElement = document.body): void {
    container.querySelectorAll('.btn-copy-story').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const cardId = (btn as HTMLElement).dataset.storyId;
            const card = cardId ? document.getElementById(cardId) : null;
            if (card) {
                const text = card.innerText;
                await navigator.clipboard.writeText(text);
                showMessage("एग्जीक्यूटिव समरी स्टोरी क्लिपबोर्ड पर कॉपी हो गई!", "success");
            }
        });
    });

    container.querySelectorAll('.btn-pin-story').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const cardId = (btn as HTMLElement).dataset.storyId;
            const card = cardId ? document.getElementById(cardId) : null;
            if (card) {
                const content = card.querySelector('.story-content')?.innerHTML || card.innerHTML;
                const x = 160 + Math.random() * 60;
                const y = 160 + Math.random() * 60;
                createBox(x, y, 0, `<div class="p-2"><h6>📊 एग्जीक्यूटिव डेटा स्टोरी</h6>${content}</div>`, "#e0e7ff", "slide-in-up");
                showMessage("डेटा स्टोरी डैशबोर्ड पर नोट्स कार्ड के रूप में पिन कर दी गई!", "success");
            }
        });
    });

    container.querySelectorAll('.btn-plot-story-chart').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const dim = (btn as HTMLElement).dataset.dim || headers[0];
            const metric = (btn as HTMLElement).dataset.metric || headers[1] || headers[0];
            await addVisualization(dim, [metric], null, "bar", `एग्जीक्यूटिव स्टोरी: ${metric} बनाम ${dim}`);
            showMessage(`चार्ट सफलतापूर्वक डैशबोर्ड पर जोड़ दिया गया!`, "success");
        });
    });
}
