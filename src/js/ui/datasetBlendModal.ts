// src/js/ui/datasetBlendModal.ts
import { DatasetStore, DatasetItem, JoinConfig, JoinType } from '../data/datasetStore.ts';
import { showMessage } from '../core/utils.ts';
import { validateData } from '../../store/DataHandler.ts';

declare const Papa: any;
declare const XLSX: any;
declare const bootstrap: any;

export function initializeDatasetBlendUI(): void {
    const fileDragZone = document.getElementById('file-drag-zone');
    if (!fileDragZone) return;

    // Check if multi-dataset card is already present
    if (document.getElementById('multiDatasetManagerSection')) return;

    const managerSection = document.createElement('div');
    managerSection.id = 'multiDatasetManagerSection';
    managerSection.className = 'card border-0 bg-white p-3 mb-3 shadow-xs rounded-4';
    managerSection.style.border = '1px solid #e2e8f0';

    managerSection.innerHTML = `
        <div class="d-flex align-items-center justify-content-between mb-2">
            <div class="d-flex align-items-center gap-2">
                <div class="p-1.5 rounded-2 bg-indigo-50 text-indigo-600">
                    <i class="bi bi-intersect fs-6"></i>
                </div>
                <div>
                    <h6 class="mb-0 fw-bold text-dark text-xs">Multi-Dataset AI Blend & Join</h6>
                    <p class="text-secondary mb-0" style="font-size: 10px;">2 या अधिक CSV/Excel फ़ाइलों को जोड़ें व स्विच करें</p>
                </div>
            </div>
            <button id="btnOpenBlendModal" class="btn btn-xs btn-primary d-flex align-items-center gap-1 rounded-pill px-2.5 py-1" style="font-size: 11px;">
                <i class="bi bi-link-45deg"></i> <span>Blend / Join</span>
            </button>
        </div>

        <!-- Loaded Datasets List -->
        <div class="mb-2 p-2 rounded-3 bg-slate-50 border" style="border-color: #f1f5f9 !important;">
            <div class="d-flex align-items-center justify-content-between mb-1.5">
                <span class="text-muted fw-semibold" style="font-size: 10px;"><i class="bi bi-collection text-primary me-1"></i> Active Datasets:</span>
                <span id="datasetCountBadge" class="badge bg-indigo-100 text-indigo-700 rounded-pill" style="font-size: 9px;">0 loaded</span>
            </div>
            <div id="loadedDatasetsContainer" class="d-flex flex-column gap-1.5" style="max-height: 120px; overflow-y: auto;">
                <!-- Dynamically populated -->
            </div>
        </div>

        <div class="d-flex align-items-center gap-2">
            <input type="file" id="secondaryFileInput" class="d-none" accept=".csv, .xlsx, .xls, .json">
            <button id="btnAddAdditionalDatasetBtn" class="btn btn-xs btn-outline-secondary w-100 d-flex align-items-center justify-content-center gap-1.5 py-1.5 rounded-3" style="font-size: 11px;">
                <i class="bi bi-file-earmark-plus text-primary"></i> <span>+ अतिरिक्त फ़ाइल जोड़ें (Secondary File)</span>
            </button>
        </div>
    `;

    // Insert right after fileDragZone
    fileDragZone.parentNode?.insertBefore(managerSection, fileDragZone.nextSibling);

    // Setup Secondary File Upload Handler
    const secInput = document.getElementById('secondaryFileInput') as HTMLInputElement;
    const btnAddSec = document.getElementById('btnAddAdditionalDatasetBtn') as HTMLButtonElement;

    btnAddSec?.addEventListener('click', () => {
        secInput?.click();
    });

    secInput?.addEventListener('change', async (e: any) => {
        const file = e?.target?.files?.[0];
        if (!file) return;

        showMessage(`अतिरिक्त फ़ाइल '${file.name}' पार्स हो रही है...`, 'info');

        try {
            let data: any[] = [];
            const fileName = file.name;
            const ext = fileName.split('.').pop()?.toLowerCase();

            if (ext === 'csv') {
                const text = await file.text();
                const parsed = Papa.parse(text, {
                    header: true,
                    skipEmptyLines: true,
                    transform: (v: string) => v.trim(),
                    transformHeader: (h: string) => h.trim()
                });
                data = parsed.data as any[];
            } else if (ext === 'json') {
                const text = await file.text();
                const parsed = JSON.parse(text);
                data = Array.isArray(parsed) ? parsed : (parsed && typeof parsed === 'object' ? Object.values(parsed).find(v => Array.isArray(v)) as any[] || [parsed] : []);
            } else {
                // Excel
                const buffer = await file.arrayBuffer();
                const wb = XLSX.read(buffer, { type: 'array' });
                const firstSheet = wb.Sheets[wb.SheetNames[0]];
                data = XLSX.utils.sheet_to_json(firstSheet, { defval: '' });
            }

            data = validateData(data);

            if (!data || data.length === 0) {
                showMessage("फ़ाइल में कोई डेटा नहीं मिला या पार्स नहीं हो सका।", "warning");
                return;
            }

            const cleanName = fileName.replace(/\.[^/.]+$/, "");
            const added = DatasetStore.addDataset(cleanName, data, fileName, false);
            showMessage(`नया डेटासेट '${added.name}' (${data.length} पंक्तियाँ, ${added.headers.length} कॉलम्स) सफलतापूर्वक जोड़ा गया!`, "success");
            secInput.value = '';
        } catch (err: any) {
            console.error("Secondary file read error:", err);
            showMessage("फ़ाइल लोड करने में त्रुटि: " + err.message, "danger");
            secInput.value = '';
        }
    });

    // Blend modal trigger
    document.getElementById('btnOpenBlendModal')?.addEventListener('click', () => {
        openDatasetBlendModal();
    });

    // Listen for updates
    document.addEventListener('datasetsUpdated', updateLoadedDatasetsUI);

    // Initial render
    updateLoadedDatasetsUI();
}

function updateLoadedDatasetsUI(): void {
    const container = document.getElementById('loadedDatasetsContainer');
    const badge = document.getElementById('datasetCountBadge');
    if (!container) return;

    const datasets = DatasetStore.getAllDatasets();
    if (badge) {
        badge.textContent = `${datasets.length} loaded`;
    }

    if (datasets.length === 0) {
        container.innerHTML = `<div class="text-muted text-center py-2" style="font-size: 10px;">कोई अतिरिक्त डेटासेट नहीं है। ऊपर मुख्य फ़ाइल लोड करें।</div>`;
        return;
    }

    container.innerHTML = '';
    datasets.forEach(ds => {
        const row = document.createElement('div');
        row.className = 'd-flex align-items-center justify-content-between p-1.5 rounded bg-white border shadow-2xs';
        row.style.borderColor = '#e2e8f0';

        row.innerHTML = `
            <div class="d-flex align-items-center gap-1.5 overflow-hidden me-1">
                <i class="bi bi-file-earmark-spreadsheet ${ds.isPrimary ? 'text-primary' : 'text-indigo-600'}" style="font-size: 11px;"></i>
                <div class="text-truncate">
                    <span class="fw-semibold text-dark text-truncate d-block" style="font-size: 10.5px;" title="${ds.name}">
                        ${escapeHtml(ds.name)}
                    </span>
                    <span class="text-secondary" style="font-size: 9px;">
                        ${ds.rowCount.toLocaleString()} rows • ${ds.headers.length} cols
                    </span>
                </div>
            </div>
            <div class="d-flex align-items-center gap-1">
                <button class="btn btn-2xs btn-outline-primary py-0.5 px-1.5 rounded activate-ds-btn" data-ds-id="${ds.id}" title="Make Active Dataset" style="font-size: 9.5px;">
                    <i class="bi bi-play-circle"></i> Load
                </button>
                ${!ds.isPrimary ? `
                <button class="btn btn-2xs btn-outline-danger py-0.5 px-1 rounded delete-ds-btn" data-ds-id="${ds.id}" title="Delete Dataset" style="font-size: 9.5px;">
                    <i class="bi bi-trash"></i>
                </button>` : ''}
            </div>
        `;

        row.querySelector('.activate-ds-btn')?.addEventListener('click', () => {
            DatasetStore.setActiveDataset(ds.id);
        });

        row.querySelector('.delete-ds-btn')?.addEventListener('click', () => {
            DatasetStore.removeDataset(ds.id);
        });

        container.appendChild(row);
    });
}

export function openDatasetBlendModal(): void {
    const datasets = DatasetStore.getAllDatasets();

    if (datasets.length < 2) {
        showMessage("डेटा ब्लेंड करने के लिए कम से कम 2 डेटासेट आवश्यक हैं। कृपया '+ अतिरिक्त फ़ाइल जोड़ें' से दूसरी फ़ाइल अपलोड करें।", "warning");
        return;
    }

    let modalEl = document.getElementById('datasetBlendModal');
    if (!modalEl) {
        modalEl = document.createElement('div');
        modalEl.id = 'datasetBlendModal';
        modalEl.className = 'modal fade';
        modalEl.innerHTML = `
            <div class="modal-dialog modal-dialog-centered modal-lg">
                <div class="modal-content rounded-4 border-0 shadow-lg">
                    <div class="modal-header border-bottom py-2.5 px-3 bg-light">
                        <div class="d-flex align-items-center gap-2">
                            <span class="p-1.5 rounded-2 bg-primary-subtle text-primary">
                                <i class="bi bi-intersect fs-6"></i>
                            </span>
                            <div>
                                <h6 class="modal-title fw-bold text-dark mb-0">Multi-Dataset AI Blend & Join Canvas</h6>
                                <p class="text-secondary small mb-0" style="font-size: 11px;">दो डेटासेट्स को किसी कॉमन की (जैसे: CustomerID, OrderID) पर मर्ज करें</p>
                            </div>
                        </div>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body p-3">
                        <div class="row g-3 mb-3">
                            <!-- Left Dataset -->
                            <div class="col-md-6">
                                <div class="p-3 rounded-3 border bg-slate-50 h-100">
                                    <label class="form-label fw-bold text-xs text-primary mb-1">
                                        <i class="bi bi-table"></i> Left Dataset (मुख्य फ़ाइल):
                                    </label>
                                    <select id="blendLeftDataset" class="form-select form-select-sm mb-2"></select>
                                    <label class="form-label text-xs text-secondary mb-1">Common Join Key (Left Column):</label>
                                    <select id="blendLeftKey" class="form-select form-select-sm"></select>
                                </div>
                            </div>
                            <!-- Right Dataset -->
                            <div class="col-md-6">
                                <div class="p-3 rounded-3 border bg-slate-50 h-100">
                                    <label class="form-label fw-bold text-xs text-indigo-600 mb-1">
                                        <i class="bi bi-table"></i> Right Dataset (जोड़ने वाली फ़ाइल):
                                    </label>
                                    <select id="blendRightDataset" class="form-select form-select-sm mb-2"></select>
                                    <label class="form-label text-xs text-secondary mb-1">Common Join Key (Right Column):</label>
                                    <select id="blendRightKey" class="form-select form-select-sm"></select>
                                </div>
                            </div>
                        </div>

                        <!-- Join Type Selection -->
                        <div class="p-2.5 rounded-3 border mb-3 bg-white">
                            <label class="form-label fw-bold text-xs text-dark mb-1.5">Join Type (जॉइन का प्रकार):</label>
                            <div class="d-flex flex-wrap gap-2" id="blendJoinTypeGroup">
                                <div class="form-check form-check-inline">
                                    <input class="form-check-input" type="radio" name="blendJoinType" id="joinInner" value="inner" checked>
                                    <label class="form-check-label text-xs fw-semibold" for="joinInner">Inner Join (केवल मैचिंग पंक्तियाँ)</label>
                                </div>
                                <div class="form-check form-check-inline">
                                    <input class="form-check-input" type="radio" name="blendJoinType" id="joinLeft" value="left">
                                    <label class="form-check-label text-xs fw-semibold" for="joinLeft">Left Join (Left की सभी पंक्तियाँ)</label>
                                </div>
                                <div class="form-check form-check-inline">
                                    <input class="form-check-input" type="radio" name="blendJoinType" id="joinRight" value="right">
                                    <label class="form-check-label text-xs fw-semibold" for="joinRight">Right Join (Right की सभी पंक्तियाँ)</label>
                                </div>
                                <div class="form-check form-check-inline">
                                    <input class="form-check-input" type="radio" name="blendJoinType" id="joinFull" value="full">
                                    <label class="form-check-label text-xs fw-semibold" for="joinFull">Full Outer Join (सभी पंक्तियाँ)</label>
                                </div>
                            </div>
                        </div>

                        <!-- Output Name -->
                        <div class="mb-3">
                            <label class="form-label text-xs fw-semibold text-secondary mb-1">Merged Dataset Name (आउटपुट फ़ाइल का नाम):</label>
                            <input type="text" id="blendOutputName" class="form-control form-control-sm" placeholder="उदा: Sales_Customers_Blended">
                        </div>

                        <!-- Action Button -->
                        <button id="btnExecuteBlend" class="btn btn-primary w-100 py-2 fw-semibold d-flex align-items-center justify-content-center gap-2 rounded-3">
                            <i class="bi bi-intersect"></i> Execute AI Blend & Ingest into Dashboard
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modalEl);
    }

    const selectLeftDs = document.getElementById('blendLeftDataset') as HTMLSelectElement;
    const selectRightDs = document.getElementById('blendRightDataset') as HTMLSelectElement;
    const selectLeftKey = document.getElementById('blendLeftKey') as HTMLSelectElement;
    const selectRightKey = document.getElementById('blendRightKey') as HTMLSelectElement;
    const inputOutName = document.getElementById('blendOutputName') as HTMLInputElement;

    // Populate dataset dropdowns
    selectLeftDs.innerHTML = '';
    selectRightDs.innerHTML = '';

    datasets.forEach((ds, idx) => {
        const opt1 = document.createElement('option');
        opt1.value = ds.id;
        opt1.textContent = `${ds.name} (${ds.rowCount} rows)`;
        selectLeftDs.appendChild(opt1);

        const opt2 = document.createElement('option');
        opt2.value = ds.id;
        opt2.textContent = `${ds.name} (${ds.rowCount} rows)`;
        if (idx === 1) opt2.selected = true;
        selectRightDs.appendChild(opt2);
    });

    function populateKeys(dsSelect: HTMLSelectElement, keySelect: HTMLSelectElement, otherKeySelect?: HTMLSelectElement): void {
        const ds = DatasetStore.getDataset(dsSelect.value);
        keySelect.innerHTML = '';
        if (!ds || !ds.headers) return;

        ds.headers.forEach(h => {
            const opt = document.createElement('option');
            opt.value = h;
            opt.textContent = h;
            keySelect.appendChild(opt);
        });

        // Auto-match smart keys (e.g. customer_id, id, order_id, user_id)
        if (otherKeySelect && otherKeySelect.options.length > 0) {
            const currentOtherKey = otherKeySelect.value.toLowerCase();
            for (let i = 0; i < keySelect.options.length; i++) {
                if (keySelect.options[i].value.toLowerCase() === currentOtherKey) {
                    keySelect.selectedIndex = i;
                    break;
                }
            }
        }
    }

    populateKeys(selectLeftDs, selectLeftKey);
    populateKeys(selectRightDs, selectRightKey, selectLeftKey);

    selectLeftDs.onchange = () => {
        populateKeys(selectLeftDs, selectLeftKey);
        updateOutputNamePreview();
    };

    selectRightDs.onchange = () => {
        populateKeys(selectRightDs, selectRightKey, selectLeftKey);
        updateOutputNamePreview();
    };

    function updateOutputNamePreview(): void {
        const l = DatasetStore.getDataset(selectLeftDs.value);
        const r = DatasetStore.getDataset(selectRightDs.value);
        if (l && r && inputOutName) {
            inputOutName.value = `${l.name}_${r.name}_Joined`;
        }
    }
    updateOutputNamePreview();

    const bsModal = new (window as any).bootstrap.Modal(modalEl);
    bsModal.show();

    const btnExec = document.getElementById('btnExecuteBlend') as HTMLButtonElement;
    const newBtnExec = btnExec.cloneNode(true) as HTMLButtonElement;
    btnExec.parentNode?.replaceChild(newBtnExec, btnExec);

    newBtnExec.addEventListener('click', () => {
        const leftId = selectLeftDs.value;
        const rightId = selectRightDs.value;
        if (leftId === rightId) {
            showMessage("कृपया दो अलग-अलग डेटासेट चुनें!", "warning");
            return;
        }

        const leftKey = selectLeftKey.value;
        const rightKey = selectRightKey.value;
        if (!leftKey || !rightKey) {
            showMessage("कृपया दोनों डेटासेट्स की मैचिंग की चुनें!", "warning");
            return;
        }

        const joinTypeEl = document.querySelector('input[name="blendJoinType"]:checked') as HTMLInputElement;
        const joinType = (joinTypeEl?.value || 'inner') as JoinType;

        const config: JoinConfig = {
            leftDatasetId: leftId,
            rightDatasetId: rightId,
            leftKey,
            rightKey,
            joinType,
            outputDatasetName: inputOutName.value.trim() || undefined
        };

        const result = DatasetStore.joinDatasets(config);
        if (result.success) {
            bsModal.hide();
            showMessage(result.message, "success");
        } else {
            showMessage(result.message, "danger");
        }
    });
}

function escapeHtml(str: string): string {
    return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}
