// src/js/charts/chartcolomdrag.ts

// @ts-ignore
import Sortable from 'https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/modular/sortable.esm.js';
import { getRawData } from '../../store/DataHandler.ts';
import { visualizations, plotChart } from './charts.ts';

declare global {
    interface Window {
        editingChartId?: string | null;
        activePreviewChartId?: string | null;
    }
}

export interface ChartColumnsResult {
    xAxis: string | null;
    yAxes: string[];
    zAxis: string | null;
}

// -------------------------
// ड्रॉप ज़ोन प्लेसहोल्डर्स को प्रबंधित करना
// -------------------------
export function updateDropZonePlaceholders(): void {
    const zones = [
        { id: 'xAxisDropZone', text: 'X-अक्ष कॉलम डालें' },
        { id: 'yAxisDropZone', text: 'Y-अक्ष (मल्टीपल) डालें' },
        { id: 'zAxisDropZone', text: 'Z-अक्ष कॉलम डालें' }
    ];

    zones.forEach(z => {
        const zone = document.getElementById(z.id);
        if (!zone) return;

        // पहले से मौजूद प्लेसहोल्डर को हटाएं
        const existingPlaceholder = zone.querySelector('.dropzone-placeholder');
        if (existingPlaceholder) {
            existingPlaceholder.remove();
        }

        // यदि कोई आइटम नहीं है, तो प्लेसहोल्डर दिखाएं
        const items = Array.from(zone.children).filter(el => el.classList.contains('draggable-item'));
        if (items.length === 0) {
            const placeholder = document.createElement('div');
            placeholder.className = 'dropzone-placeholder text-muted text-center w-100 py-2 d-flex align-items-center justify-content-center gap-1.5';
            placeholder.style.fontSize = '10.5px';
            placeholder.style.pointerEvents = 'none';
            placeholder.style.opacity = '0.7';
            placeholder.style.minHeight = '30px';
            placeholder.innerHTML = `<i class="bi bi-plus-circle-dotted text-primary"></i> <span>${z.text}</span>`;
            zone.appendChild(placeholder);
        }
    });
}

// -------------------------
// कॉलम लिस्ट पॉपुलेट करना (स्लीक कॉम्पैक्ट पिल्स)
// -------------------------
export function populateColumnDragLists(columns: string[]): void {
    const columnList = document.getElementById('columnList');
    if (!columnList) return;
    
    const xAxisDropZone = document.getElementById('xAxisDropZone');
    const yAxisDropZone = document.getElementById('yAxisDropZone');
    const zAxisDropZone = document.getElementById('zAxisDropZone');
    
    // पहले सभी आइटम्स क्लियर करें
    [columnList, xAxisDropZone, yAxisDropZone, zAxisDropZone].forEach(el => {
        if (el) el.innerHTML = '';
    });
    
    // कॉलम लिस्ट को ग्रिड/फ्लेक्स लेआउट में कस्टमाइज़ करें
    if (columnList) {
        columnList.className = 'd-flex flex-wrap gap-1.5 mb-2 overflow-y-auto w-100 drag-container';
        columnList.style.maxHeight = '125px';
        columnList.style.padding = '6px';
        columnList.style.border = '1.5px dashed #cbd5e1';
        columnList.style.borderRadius = '6px';
        columnList.style.backgroundColor = '#f8fafc';
    }
    
    columns.forEach(col => {
        const item = document.createElement('div');
        item.className = 'draggable-item border bg-white text-dark d-inline-flex align-items-center gap-1.5 px-2 py-1 rounded shadow-xs transition-all';
        item.setAttribute('data-col', col);
        item.style.cursor = 'grab';
        item.style.fontSize = '11px';
        item.style.fontWeight = '500';
        item.style.userSelect = 'none';
        item.style.borderColor = '#cbd5e1';
        
        item.innerHTML = `
            <i class="bi bi-tag-fill text-primary" style="font-size: 10px;"></i>
            <span class="text-truncate" style="max-width: 95px;" title="${col}">${col}</span>
            <button type="button" class="btn-close remove-pill-btn p-0 ms-1.5 align-self-center" style="display: none; width: 6px; height: 6px; font-size: 8px;" title="निकालें"></button>
        `;
        columnList.appendChild(item);
    });

    // Excel Field Search Listener Setup
    const searchInput = document.getElementById('pivotFieldSearch') as HTMLInputElement | null;
    if (searchInput && columnList) {
        searchInput.oninput = (e: Event) => {
            const target = e.target as HTMLInputElement;
            const query = target.value.toLowerCase().trim();
            const items = columnList.querySelectorAll('.draggable-item');
            items.forEach(it => {
                const el = it as HTMLElement;
                const colName = el.getAttribute('data-col') || el.textContent || '';
                if (colName.toLowerCase().includes(query)) {
                    el.style.setProperty('display', 'inline-flex', 'important');
                } else {
                    el.style.setProperty('display', 'none', 'important');
                }
            });
        };
    }

    updateDropZonePlaceholders();
}

// -------------------------
// ड्रॉप ज़ोन में कॉलम पॉपुलेट करना
// -------------------------
export function populateDropZones(
    allColumns: string[],
    xAxis?: string | null,
    yAxes?: string[] | null,
    zAxis?: string | null
): void {
    populateColumnDragLists(allColumns);
    
    const columnList = document.getElementById('columnList');
    const xAxisDropZone = document.getElementById('xAxisDropZone');
    const yAxisDropZone = document.getElementById('yAxisDropZone');
    const zAxisDropZone = document.getElementById('zAxisDropZone');
    
    if (columnList) {
        const columnItems = Array.from(columnList.children);
        
        if (xAxis && xAxisDropZone) {
            const xAxisItem = columnItems.find(child => child.getAttribute('data-col') === xAxis);
            if (xAxisItem) {
                const clone = xAxisItem.cloneNode(true) as HTMLElement;
                const removeBtn = clone.querySelector('.remove-pill-btn') as HTMLElement | null;
                if (removeBtn) removeBtn.style.display = 'inline-block';
                xAxisDropZone.appendChild(clone);
            }
        }
        
        if (yAxes && Array.isArray(yAxes) && yAxisDropZone) {
            yAxes.forEach(col => {
                const yAxisItem = columnItems.find(child => child.getAttribute('data-col') === col);
                if (yAxisItem) {
                    const clone = yAxisItem.cloneNode(true) as HTMLElement;
                    const removeBtn = clone.querySelector('.remove-pill-btn') as HTMLElement | null;
                    if (removeBtn) removeBtn.style.display = 'inline-block';
                    yAxisDropZone.appendChild(clone);
                }
            });
        }
        
        if (zAxis && zAxisDropZone) {
            const zAxisItem = columnItems.find(child => child.getAttribute('data-col') === zAxis);
            if (zAxisItem) {
                const clone = zAxisItem.cloneNode(true) as HTMLElement;
                const removeBtn = clone.querySelector('.remove-pill-btn') as HTMLElement | null;
                if (removeBtn) removeBtn.style.display = 'inline-block';
                zAxisDropZone.appendChild(clone);
            }
        }
    }

    updateDropZonePlaceholders();
}

// -------------------------
// ड्रैग-एंड-ड्रॉप इनिशियलाइजेशन
// -------------------------
export function initializeDragAndDrop(): void {
    const columnList = document.getElementById('columnList');
    const xAxisDropZone = document.getElementById('xAxisDropZone');
    const yAxisDropZone = document.getElementById('yAxisDropZone');
    const zAxisDropZone = document.getElementById('zAxisDropZone');
    const chartTypeSelect = document.getElementById('chartType') as HTMLSelectElement | null;
    
    const sharedOptions = {
        group: {
            name: 'shared',
            pull: 'clone',
            put: false
        },
        animation: 150,
        emptyInsertThreshold: 5,
        sort: false
    };
    
    // मुख्य कॉलम लिस्ट (सिर्फ ड्रैग आउट हो सकता है, इसके अंदर ड्रॉप नहीं हो सकता)
    if (columnList && typeof Sortable !== 'undefined') {
        new Sortable(columnList, {
            ...sharedOptions,
            onEnd() {
                // Ensure no original list elements are lost or broken
                updateDropZonePlaceholders();
            }
        });
    }
    
    const dropZoneOptions = (_zoneId: string, singleItem = true) => ({
        group: {
            name: 'shared',
            put: true
        },
        animation: 150,
        onAdd(evt: any) {
            // Remove placeholder
            const placeholder = evt.to.querySelector('.dropzone-placeholder');
            if (placeholder) placeholder.remove();

            // Handle single item restriction
            if (singleItem) {
                const items = Array.from(evt.to.children).filter((el: any) => el.classList.contains('draggable-item'));
                if (items.length > 1) {
                    // Remove newly added item if zone already has one
                    evt.item.remove();
                    updateDropZonePlaceholders();
                    return;
                }
            }

            // Show remove button on dropped item
            const removeBtn = evt.item.querySelector('.remove-pill-btn');
            if (removeBtn) removeBtn.style.display = 'inline-block';

            updateDropZonePlaceholders();
            updateChartConfig();
        },
        onRemove() {
            updateDropZonePlaceholders();
            updateChartConfig();
        }
    });
    
    // X और Z ड्रॉप ज़ोन
    if (xAxisDropZone && typeof Sortable !== 'undefined') {
        new Sortable(xAxisDropZone, dropZoneOptions('xAxisDropZone', true));
    }
    if (zAxisDropZone && typeof Sortable !== 'undefined') {
        new Sortable(zAxisDropZone, dropZoneOptions('zAxisDropZone', true));
    }
    
    // Y ड्रॉप ज़ोन (multiple items)
    if (yAxisDropZone && typeof Sortable !== 'undefined') {
        new Sortable(yAxisDropZone, dropZoneOptions('yAxisDropZone', false));
    }

    // डबल-क्लिक करके सीधे असाइन करने का शॉर्टकट
    if (columnList) {
        columnList.addEventListener('dblclick', (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const item = target.closest('.draggable-item');
            if (!item) return;

            const colName = item.getAttribute('data-col');
            if (!colName) return;
            
            // देखें कि क्या यह पहले से ही जोड़ा हुआ है
            const existsInX = xAxisDropZone?.querySelector(`[data-col="${colName}"]`);
            const existsInY = yAxisDropZone?.querySelector(`[data-col="${colName}"]`);
            const existsInZ = zAxisDropZone?.querySelector(`[data-col="${colName}"]`);

            if (existsInX || existsInY || existsInZ) {
                return; // पहले से मौजूद है
            }

            const clone = item.cloneNode(true) as HTMLElement;
            const removeBtn = clone.querySelector('.remove-pill-btn') as HTMLElement | null;
            if (removeBtn) removeBtn.style.display = 'inline-block';
            
            const zContainer = document.getElementById('zAxisDropZoneContainer');

            if (xAxisDropZone && xAxisDropZone.querySelectorAll('.draggable-item').length === 0) {
                xAxisDropZone.appendChild(clone);
            } else if (zContainer && zContainer.style.display !== 'none' && zAxisDropZone && zAxisDropZone.querySelectorAll('.draggable-item').length === 0) {
                zAxisDropZone.appendChild(clone);
            } else if (yAxisDropZone) {
                yAxisDropZone.appendChild(clone);
            }

            updateDropZonePlaceholders();
            updateChartConfig();
        });
        
        // कॉलम पर होवर करने पर डेटा प्रीव्यू दिखाना
        columnList.addEventListener('mouseover', (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const item = target.closest('.draggable-item');
            if (!item) return;
            const colName = item.getAttribute('data-col');
            if (colName) showColumnPreview(colName);
        });
    }

    // ड्रॉप ज़ोन में से आइटम हटाने के लिए क्लिक डेलीगेशन
    [xAxisDropZone, yAxisDropZone, zAxisDropZone].forEach(zone => {
        if (!zone) return;
        zone.addEventListener('click', (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const removeBtn = target.closest('.remove-pill-btn');
            if (removeBtn) {
                const item = removeBtn.closest('.draggable-item');
                if (item) {
                    item.remove();
                    updateDropZonePlaceholders();
                    updateChartConfig();
                }
            }
        });
    });

    // ड्रॉप ज़ोन साफ़ करने वाले बटन्स का सेटअप
    document.querySelectorAll('.clear-dropzone-btn').forEach(btn => {
        btn.addEventListener('click', (e: Event) => {
            e.preventDefault();
            const zoneId = btn.getAttribute('data-zone');
            if (!zoneId) return;
            const zone = document.getElementById(zoneId);
            if (zone) {
                const items = zone.querySelectorAll('.draggable-item');
                items.forEach(el => el.remove());
                updateDropZonePlaceholders();
                updateChartConfig();
            }
        });
    });

    // चार्ट टाइप बदलने पर प्रिव्यू को रीयल-टाइम अपडेट करें
    if (chartTypeSelect) {
        chartTypeSelect.addEventListener('change', () => {
            updateChartConfig();
        });
    }
}

// -------------------------
// कॉलम प्रीव्यू प्रदर्शित करना
// -------------------------
function showColumnPreview(colName: string): void {
    const previewPanel = document.getElementById('columnPreviewPanel');
    if (!previewPanel) return;

    let data: any[] = [];
    try {
        data = getRawData() || [];
    } catch (err) {
        console.error("Error fetching raw data for preview:", err);
    }
    
    if (data.length === 0) {
        previewPanel.style.display = 'none';
        return;
    }

    const values = data.map(row => row[colName]).filter(val => val !== undefined && val !== null && val !== '');
    if (values.length === 0) {
        previewPanel.innerHTML = `<strong>कॉलम:</strong> ${colName}<br><span class="text-danger">कोई डेटा उपलब्ध नहीं है</span>`;
        previewPanel.style.display = 'block';
        return;
    }

    // डेटा टाइप जांचें
    const isNumeric = values.every(val => !isNaN(Number(val)));
    const uniqueValues = Array.from(new Set(values));
    
    const typeText = isNumeric ? '<span class="badge bg-success">संख्यात्मक (Numeric)</span>' : '<span class="badge bg-secondary">श्रेणीबद्ध (Categorical)</span>';
    
    let statsHtml = '';
    if (isNumeric) {
        const numValues = values.map(Number);
        const min = Math.min(...numValues);
        const max = Math.max(...numValues);
        const sum = numValues.reduce((a, b) => a + b, 0);
        const avg = sum / numValues.length;
        statsHtml = `
            <div class="row g-0 mt-1" style="font-size: 10px;">
                <div class="col-4"><strong>न्यूनतम:</strong> ${min}</div>
                <div class="col-4"><strong>अधिकतम:</strong> ${max}</div>
                <div class="col-4"><strong>औसत:</strong> ${avg.toFixed(1)}</div>
            </div>
        `;
    }

    const sampleText = uniqueValues.slice(0, 4).join(', ');

    previewPanel.innerHTML = `
        <div class="fw-bold text-dark d-flex justify-content-between align-items-center mb-1" style="font-size: 11px;">
            <span><i class="bi bi-info-circle-fill text-primary me-1"></i> ${colName}</span>
            ${typeText}
        </div>
        <div class="text-secondary" style="font-size: 10px;">
            <strong>कुल रिकॉर्ड्स:</strong> ${values.length} | <strong>अद्वितीय:</strong> ${uniqueValues.length}
            ${statsHtml}
            <div class="text-truncate mt-1"><strong>नमूने:</strong> ${sampleText}</div>
        </div>
    `;
    previewPanel.style.display = 'block';
}

// -------------------------
// चार्ट कॉलम प्राप्त करना
// -------------------------
export function getChartColumns(): ChartColumnsResult {
    const xAxisDropZone = document.getElementById('xAxisDropZone');
    const yAxisDropZone = document.getElementById('yAxisDropZone');
    const zAxisDropZone = document.getElementById('zAxisDropZone');

    const xAxis = xAxisDropZone ? xAxisDropZone.querySelector('.draggable-item') : null;
    const yAxes = yAxisDropZone ? Array.from(yAxisDropZone.querySelectorAll('.draggable-item')).map(el => el.getAttribute('data-col')).filter((c): c is string => !!c) : [];
    const zAxis = zAxisDropZone ? zAxisDropZone.querySelector('.draggable-item') : null;
    
    return {
        xAxis: xAxis ? xAxis.getAttribute('data-col') : null,
        yAxes,
        zAxis: zAxis ? zAxis.getAttribute('data-col') : null
    };
}

// -------------------------
// चार्ट कॉन्फ़िग अपडेट करना (स्मार्ट ऑटो-टाइटिलिंग और रीयल-टाइम अपडेट)
// -------------------------
export function updateChartConfig(): void {
    const { xAxis, yAxes, zAxis } = getChartColumns();
    const chartTypeSelect = document.getElementById('chartType') as HTMLSelectElement | null;
    const chartType = chartTypeSelect ? chartTypeSelect.value : 'bar';
    
    // ऑटो-टाइटल अपडेट करना
    const titleInput = document.getElementById('chartTitle') as HTMLInputElement | null;
    let generatedTitle = '';
    if (xAxis && yAxes.length > 0) {
        generatedTitle = `${yAxes.join(' & ')} बनाम ${xAxis}`;
    } else {
        generatedTitle = `${chartType.toUpperCase()} चार्ट`;
    }
    
    if (titleInput && (!titleInput.value || titleInput.value.trim() === '' || titleInput.value.includes('बनाम') || titleInput.value.includes('चार्ट प्रिव्यू') || titleInput.value.endsWith('चार्ट'))) {
        titleInput.value = generatedTitle;
    }

    const currentTitle = titleInput ? titleInput.value : generatedTitle;
    const colorPicker = document.getElementById('colorPicker') as HTMLInputElement | null;
    const color = colorPicker ? colorPicker.value : '#5470C6';

    const rowLimitSelect = document.getElementById('chartDataRowLimit') as HTMLSelectElement | null;
    const rowLimitVal = rowLimitSelect ? rowLimitSelect.value : 'all';
    const parsedRowLimit = rowLimitVal === 'all' ? 'all' : parseInt(rowLimitVal, 10);
    const dataRowLimit = (typeof parsedRowLimit === 'number' && !isNaN(parsedRowLimit)) ? parsedRowLimit : 'all';

    // रीयल-टाइम चार्ट रीप्लॉटिंग
    if (window.editingChartId) {
        // संपादन मोड: रीयल-टाइम में मौजूद चार्ट को अपडेट करें
        const index = visualizations.findIndex(v => v.id === window.editingChartId);
        if (index !== -1) {
            const oldConfig = visualizations[index];
            oldConfig.type = chartType;
            oldConfig.color = color;
            oldConfig.title = currentTitle;
            oldConfig.dataRowLimit = dataRowLimit;
            
            const columnsForChart: (string | null | undefined)[] = [xAxis, ...yAxes];
            if (zAxis) columnsForChart.push(zAxis);
            oldConfig.columns = columnsForChart.filter((c): c is string => typeof c === 'string' && c.length > 0);
            
            plotChart(oldConfig);
        }
    } else if (window.activePreviewChartId) {
        // ड्राफ्ट मोड: रीयल-टाइम में ड्राफ्ट प्रिव्यू चार्ट को अपडेट करें
        const index = visualizations.findIndex(v => v.id === window.activePreviewChartId);
        if (index !== -1) {
            const previewConfig = visualizations[index];
            previewConfig.type = chartType;
            previewConfig.color = color;
            previewConfig.title = currentTitle;
            previewConfig.dataRowLimit = dataRowLimit;
            
            const columnsForChart: (string | null | undefined)[] = [xAxis, ...yAxes];
            if (zAxis) columnsForChart.push(zAxis);
            previewConfig.columns = columnsForChart.filter((c): c is string => typeof c === 'string' && c.length > 0);
            
            plotChart(previewConfig);
        }
    }
}
