// Generated automatically by extract_modals.py

export const dynamicTemplates: Record<string, string> = {
  "dashboardViewContent": `
    <div class="p-1">
        <div class="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
            <div class="bg-info text-white p-2 rounded-2 d-flex align-items-center justify-content-center" style="width: 32px; height: 32px;">
                <i class="bi bi-eye"></i>
            </div>
            <div>
                <h6 class="mb-0 fw-bold text-slate-800" style="font-size: 13.5px;">डैशबोर्ड दृश्य (Dashboard View Control)</h6>
                <small class="text-muted" style="font-size: 10.5px;">Visibility toggles & backdrop themes</small>
            </div>
        </div>
        <div id="dashboardViewSection">
            <div class="card p-3 mb-3 border bg-light-subtle rounded-3 shadow-2xs">
                <h6 class="fw-bold mb-2 text-secondary text-xs"><i class="bi bi-eye-slash-fill me-1"></i>कैनवास तत्वों को दिखाएं / छिपाएं</h6>
                <div class="d-flex flex-column gap-2.5 mt-2">
                    <div class="form-check form-switch">
                        <input class="form-check-input" type="checkbox" id="toggleVisualizations" checked>
                        <label class="form-check-label small text-slate-700" for="toggleVisualizations">चार्ट विज़ुअल्स (Charts)</label>
                    </div>
                    <div class="form-check form-switch">
                        <input class="form-check-input" type="checkbox" id="toggleDataTable" checked>
                        <label class="form-check-label small text-slate-700" for="toggleDataTable">डेटा टेबल (Data Table)</label>
                    </div>
                    <div class="form-check form-switch">
                        <input class="form-check-input" type="checkbox" id="toggleChat" checked>
                        <label class="form-check-label small text-slate-700" for="toggleChat">AI चैट (AI Chat)</label>
                    </div>
                    <div class="form-check form-switch">
                        <input class="form-check-input" type="checkbox" id="toggleTextboxes" checked>
                        <label class="form-check-label small text-slate-700" for="toggleTextboxes">टेक्स्टबॉक्स (Textboxes)</label>
                    </div>
                    <div class="form-check form-switch">
                        <input class="form-check-input" type="checkbox" id="toggleMainHeader" checked>
                        <label class="form-check-label small text-slate-700" for="toggleMainHeader">मुख्य हेडर (Main Header)</label>
                    </div>
                </div>
            </div>

            <div class="card p-3 mb-3 border bg-light-subtle rounded-3 shadow-2xs">
                <h6 class="fw-bold mb-2 text-secondary text-xs"><i class="bi bi-palette-fill me-1"></i>कैनवास बैकड्रॉप थीम</h6>
                <select id="canvasBackdropTheme" class="form-select form-select-sm shadow-2xs">
                    <option value="default" selected>डिफ़ॉल्ट लाइट (Default Light)</option>
                    <option value="dark">चारकोल डार्क (Slate Dark)</option>
                    <option value="sepia">सॉफ्ट विंटेज क्रीम (Vintage Sepia)</option>
                    <option value="blue-glow">शाही नीला चमक (Midnight Sapphire)</option>
                    <option value="glassy">ग्लास विज़ुअल्स (Frosted Glass)</option>
                </select>
            </div>
        </div>
    </div>
  `,
  "chartSettingsContent": `
                    <!-- NATIVE DASHBOARD HEADER -->
                    <div class="d-flex justify-content-between align-items-center mb-2.5 pb-2 border-bottom">
                        <div class="d-flex align-items-center gap-2">
                            <div class="rounded d-flex align-items-center justify-content-center" style="background-color: #eff6ff; color: #2563eb; width: 32px; height: 32px; border: 1px solid #dbeafe;">
                                <i class="bi bi-bar-chart-fill" style="font-size: 14px;"></i>
                            </div>
                            <div>
                                <h6 class="m-0 fw-semibold text-dark" style="font-size: 13.5px; line-height: 1.2;">चार्ट कॉन्फ़िगरेशन (Chart Studio)</h6>
                                <span class="text-muted" style="font-size: 10.5px;">डैशबोर्ड मेट्रिक्स एवं चार्ट विज़ुअलाइज़ेशन</span>
                            </div>
                        </div>
                        <span class="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1" style="font-size: 10px; font-weight: 500;">
                            <i class="bi bi-broadcast text-primary me-1"></i> लाइव प्रिव्यू
                        </span>
                    </div>
                    
                    <div id="chartSettingsSection">
                        <div class="row g-2.5 sidebar-desktop-split">
                            <!-- Left Column: Chart Type & Available Fields -->
                            <div class="col-12 col-lg-6 d-flex flex-column gap-2">
                                <!-- Chart Type Selector -->
                                <div class="p-2 rounded-2 border shadow-2xs bg-white" style="border-color: #e2e8f0 !important;">
                                    <div class="d-flex justify-content-between align-items-center mb-1">
                                        <label class="form-label text-xs fw-semibold text-dark mb-0 d-flex align-items-center gap-1">
                                            <i class="bi bi-grid-3x3-gap-fill text-primary"></i> प्रकार:
                                        </label>
                                        <img id="selectedChartDisplayImage" src="" alt="चार्ट" class="img-fluid rounded border" style="max-height: 22px; width: 22px; display: none; object-fit: contain; padding: 1px;">
                                    </div>
                                    <div class="d-flex align-items-center gap-2">
                                        <div id="chartTypeGallery" class="d-none"></div>
                                        <button type="button" class="btn btn-sm btn-primary py-1 px-2.5 fw-medium text-xs d-flex align-items-center justify-content-center gap-1.5 shadow-2xs w-100" id="openChartGalleryBtn">
                                            <i class="bi bi-grid-3x3-gap"></i> गैलरी देखें (चार्ट प्रकार)
                                        </button>
                                    </div>
                                </div>
                                
                                <select id="chartType" class="form-select d-none">
                                    <option value="bar">बार चार्ट</option>
                                    <option value="stacked-bar">स्टैक्ड बार</option>
                                    <option value="horizontal-bar">हॉरिजॉन्टल बार</option>
                                    <option value="grouped-bar">ग्रुप्ड बार</option>
                                    <option value="bar3D">3D बार चार्ट</option>
                                    <option value="line3D">3D line chart</option>
                                    <option value="line">साधारण लाइन</option>
                                    <option value="smooth-line">स्मूद कर्व लाइन</option>
                                    <option value="area-line">एरिया लाइन</option>
                                    <option value="smooth-area">स्मूद एरिया</option>
                                    <option value="stacked-line">स्टैक्ड लाइन</option>
                                    <option value="stacked-area">स्टैक्ड एरिया</option>
                                    <option value="gradient-area">ग्रेडिएंट एरिया</option>
                                    <option value="step-line">स्टेप लाइन - मिडिल</option>
                                    <option value="step-start-line">स्टेप लाइन - स्टार्ट</option>
                                    <option value="step-end-line">स्टेप लाइन - एंड</option>
                                    <option value="dual-axis-line">डुअल Y-अक्ष लाइन</option>
                                    <option value="confidence-band">कॉन्फिडेंस बैंड</option>
                                    <option value="bump-line">बम्प / रैंकिंग लाइन</option>
                                    <option value="polar-line">पोलर लाइन</option>
                                    <option value="timeseries-line">टाइम सीरीज़</option>
                                    <option value="markpoint-line">मार्कपॉइंट - Min/Max</option>
                                    <option value="markline-line">मार्कलाइन - ट्रेंड</option>
                                    <option value="pie">पाई चार्ट</option>
                                    <option value="doughnut">डोनट चार्ट</option>
                                    <option value="rose-radius">रोज़ चार्ट (Radius)</option>
                                    <option value="rose-area">रोज़ चार्ट (Area)</option>
                                    <option value="scatter">स्कैटर चार्ट</option>
                                    <option value="bubble">बबल चार्ट</option>
                                    <option value="funnel">फ़नेल चार्ट</option>
                                    <option value="gauge">गेज चार्ट</option>
                                    <option value="radar">राडार चार्ट</option>
                                    <option value="treemap">ट्रीमैप चार्ट</option>
                                    <option value="candlestick">कैंडलस्टिक चार्ट (Plotly)</option>
                                    <option value="ohlc">OHLC चार्ट (Plotly)</option>
                                    <option value="waterfall">वॉटफॉल चार्ट (Waterfall)</option>
                                    <option value="heatmap">हीटमैप चार्ट (Heatmap)</option>
                                    <option value="sankey">सेंकी चार्ट (Sankey)</option>
                                    <option value="bullet">बुलेट चार्ट (Bullet)</option>
                                    <option value="boxplot">बॉक्सप्लॉट (Boxplot)</option>
                                </select>
                                
                                <!-- Available Fields List -->
                                <div class="p-2 rounded-2 border shadow-2xs bg-white flex-grow-1" style="border-color: #e2e8f0 !important;">
                                    <div class="d-flex justify-content-between align-items-center mb-1">
                                        <label class="form-label text-xs fw-semibold text-dark mb-0 d-flex align-items-center gap-1">
                                            <i class="bi bi-database text-primary"></i> उपलब्ध फ़ील्ड्स:
                                        </label>
                                        <span class="text-muted" style="font-size: 9.5px;">(ड्रैग / डबल-क्लिक)</span>
                                    </div>
                                    
                                    <!-- Field Search Box -->
                                    <div class="position-relative mb-1.5">
                                        <i class="bi bi-search position-absolute text-muted" style="left: 8px; top: 7px; font-size: 10px;"></i>
                                        <input type="text" id="pivotFieldSearch" class="form-control form-control-sm text-xs ps-4 py-0.5" placeholder="फ़ील्ड्स फ़िल्टर करें..." style="border-color: #cbd5e1; font-size: 10.5px; height: 26px;">
                                    </div>

                                    <div id="columnList" class="drag-container list-group mb-1 overflow-y-auto" style="max-height: 140px; min-height: 55px; border: 1.5px dashed #cbd5e1 !important; border-radius: 6px; padding: 4px; background: #f8fafc;">
                                    </div>
                                    <div id="columnPreviewPanel" class="p-1 border rounded bg-white shadow-2xs text-muted" style="display: none; font-size: 10px; border-color: #cbd5e1 !important;">
                                        <!-- Dynamic info shown here on hover -->
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Right Column: Axes, Properties & Actions -->
                            <div class="col-12 col-lg-6 d-flex flex-column gap-2">
                                <!-- Native Dashboard Axes & Metrics Drop Zones -->
                                <div class="p-2 rounded-2 border bg-white shadow-2xs" style="border-color: #e2e8f0 !important;">
                                    <div class="d-flex align-items-center justify-content-between mb-1 pb-0.5 border-bottom">
                                        <span class="text-xs fw-semibold text-dark d-flex align-items-center gap-1" style="font-size: 11px;">
                                            <i class="bi bi-diagram-3 text-primary"></i> अक्ष और मेट्रिक्स (Axes):
                                        </span>
                                    </div>

                                    <div class="row g-1.5">
                                        <!-- Area 1: ROWS (X-Axis) -->
                                        <div class="col-6">
                                            <div class="p-1.5 rounded border h-100 bg-white" style="border-color: #e2e8f0 !important; box-shadow: 0 1px 2px rgba(0,0,0,0.02);">
                                                <div class="d-flex justify-content-between align-items-center mb-1">
                                                    <label class="form-label text-xs fw-semibold mb-0 text-dark" style="font-size: 10.5px;">
                                                        <i class="bi bi-arrows-expand text-primary me-0.5"></i>X-अक्ष
                                                    </label>
                                                    <button type="button" class="btn btn-link btn-sm p-0 text-danger clear-dropzone-btn" data-zone="xAxisDropZone" title="साफ़ करें" style="font-size: 9px;">
                                                        <i class="bi bi-trash"></i>
                                                    </button>
                                                </div>
                                                <div id="xAxisDropZone" class="drop-zone drag-container list-group p-1" style="min-height: 44px; border-radius: 4px; border: 1.5px dashed #cbd5e1; background: #f8fafc;"></div>
                                            </div>
                                        </div>

                                        <!-- Area 2: VALUES (Y-Axis Σ) -->
                                        <div class="col-6">
                                            <div class="p-1.5 rounded border h-100 bg-white" style="border-color: #e2e8f0 !important; box-shadow: 0 1px 2px rgba(0,0,0,0.02);">
                                                <div class="d-flex justify-content-between align-items-center mb-1">
                                                    <label class="form-label text-xs fw-semibold mb-0 text-dark" style="font-size: 10.5px;">
                                                        <i class="bi bi-calculator text-primary me-0.5"></i>Y-अक्ष (Σ)
                                                    </label>
                                                    <button type="button" class="btn btn-link btn-sm p-0 text-danger clear-dropzone-btn" data-zone="yAxisDropZone" title="साफ़ करें" style="font-size: 9px;">
                                                        <i class="bi bi-trash"></i>
                                                    </button>
                                                </div>
                                                <div id="yAxisDropZone" class="drop-zone drag-container list-group p-1" style="min-height: 44px; border-radius: 4px; border: 1.5px dashed #cbd5e1; background: #f8fafc;"></div>
                                            </div>
                                        </div>

                                        <!-- Area 3: Z-AXIS (3D) -->
                                        <div class="col-12 mt-1" id="zAxisDropZoneContainer" style="display: none;">
                                            <div class="p-1.5 rounded border bg-white" style="border-color: #e2e8f0 !important;">
                                                <div class="d-flex justify-content-between align-items-center mb-1">
                                                    <label class="form-label text-xs fw-semibold mb-0 text-dark" style="font-size: 10.5px;">
                                                        <i class="bi bi-layers text-primary me-0.5"></i>Z-अक्ष (3D)
                                                    </label>
                                                    <button type="button" class="btn btn-link btn-sm p-0 text-danger clear-dropzone-btn" data-zone="zAxisDropZone" title="साफ़ करें" style="font-size: 9px;">
                                                        <i class="bi bi-trash"></i>
                                                    </button>
                                                </div>
                                                <div id="zAxisDropZone" class="drop-zone drag-container list-group p-1" style="min-height: 36px; border-radius: 4px; border: 1.5px dashed #cbd5e1; background: #f8fafc;"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Native Dashboard Property Inspector -->
                                <div class="p-2 rounded-2 border bg-white shadow-2xs" style="border-color: #e2e8f0 !important;">
                                    <div class="row g-1.5">
                                        <div class="col-8">
                                            <label for="chartTitle" class="form-label text-xs fw-semibold text-dark mb-0.5 d-flex align-items-center gap-1" style="font-size: 10.5px;">
                                                <i class="bi bi-type-h1 text-primary"></i> शीर्षक:
                                            </label>
                                            <input type="text" id="chartTitle" class="form-control form-control-sm text-xs py-0.5 px-2" placeholder="चार्ट शीर्षक" style="border-color: #cbd5e1; font-weight: 500; height: 26px;">
                                        </div>
                                        <div class="col-4">
                                            <label for="colorPicker" class="form-label text-xs fw-semibold text-dark mb-0.5 d-flex align-items-center gap-1" style="font-size: 10.5px;">
                                                <i class="bi bi-palette text-primary"></i> थीम:
                                            </label>
                                            <input type="color" id="colorPicker" class="form-control form-control-color form-control-sm w-100 p-0.5" style="height: 26px; border-color: #cbd5e1;" value="#2563eb">
                                        </div>

                                        <div class="col-12">
                                            <label for="chartDataRowLimit" class="form-label text-xs fw-semibold text-dark mb-0.5 d-flex align-items-center gap-1" style="font-size: 10.5px;">
                                                <i class="bi bi-list-ol text-primary"></i> डेटा पंक्तियों की सीमा (Row Limit):
                                            </label>
                                            <select id="chartDataRowLimit" class="form-select form-select-sm text-xs py-0.5 px-2" style="border-color: #cbd5e1; font-weight: 500; height: 26px;">
                                                <option value="all" selected>सभी पंक्तियाँ (All Rows)</option>
                                                <option value="10">पहले 10 रिकॉर्ड (Top 10)</option>
                                                <option value="25">पहले 25 रिकॉर्ड (Top 25)</option>
                                                <option value="50">पहले 50 रिकॉर्ड (Top 50)</option>
                                                <option value="100">पहले 100 रिकॉर्ड (Top 100)</option>
                                                <option value="250">पहले 250 रिकॉर्ड (Top 250)</option>
                                                <option value="500">पहले 500 रिकॉर्ड (Top 500)</option>
                                                <option value="1000">पहले 1000 रिकॉर्ड (Top 1000)</option>
                                            </select>
                                        </div>

                                        <div class="col-6">
                                            <label for="xAxisLabel" class="form-label text-xs fw-medium text-dark mb-0.5" style="font-size: 9.5px;">X-अक्ष लेबल:</label>
                                            <input type="text" id="xAxisLabel" class="form-control form-control-sm text-xs py-0.5 px-1.5" placeholder="उदा. महीना" style="border-color: #cbd5e1; height: 25px;">
                                        </div>
                                        <div class="col-6">
                                            <label for="yAxisLabel" class="form-label text-xs fw-medium text-dark mb-0.5" style="font-size: 9.5px;">Y-अक्ष लेबल:</label>
                                            <input type="text" id="yAxisLabel" class="form-control form-control-sm text-xs py-0.5 px-1.5" placeholder="उदा. बिक्री (₹)" style="border-color: #cbd5e1; height: 25px;">
                                        </div>
                                    </div>
                                </div>

                                <!-- Action Buttons -->
                                <div class="pt-1 mt-auto">
                                    <div class="d-flex gap-1.5">
                                        <button id="addVisualizationBtn" class="btn btn-primary btn-sm w-100 py-1.5 fw-medium text-xs shadow-2xs d-flex align-items-center justify-content-center gap-1.5">
                                            <i class="bi bi-plus-circle-fill"></i> विज़ुअलाइज़ेशन जोड़ें
                                        </button>
                                        <button id="cancelEditBtn" type="button" class="btn btn-outline-secondary btn-sm w-50 py-1.5 fw-medium text-xs" style="display: none;">
                                            <i class="bi bi-x-circle me-1"></i> रद्द करें
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `,
  "additionalActionsContent": `
                    <h5 class="mb-3 text-primary"><i class="bi bi-cpu-fill"></i> एडवांस्ड अतिरिक्त कार्य</h5>
                    
                    <div class="accordion accordion-flush" id="advActionsAccordion">
                        
                        <!-- Section 1: कोर ऑपरेशन्स (Core Operations) -->
                        <div class="accordion-item bg-transparent">
                            <h2 class="accordion-header" id="headingCore">
                                <button class="accordion-button px-0 py-2 bg-transparent fw-bold text-dark" type="button" data-bs-toggle="collapse" data-bs-target="#collapseCore" aria-expanded="true" aria-controls="collapseCore">
                                    <i class="bi bi-grid-fill me-2 text-primary"></i> मुख्य कार्य (Main Actions)
                                </button>
                            </h2>
                            <div id="collapseCore" class="accordion-collapse collapse show" aria-labelledby="headingCore" data-bs-parent="#advActionsAccordion">
                                <div class="accordion-body px-0 pt-1 pb-3">
                                    <div class="d-grid gap-2">
                                        <button id="toggleThemeSidebar" class="btn btn-sm btn-outline-secondary text-start"><i class="bi bi-moon-stars me-2"></i> थीम बदलें (Dark/Light)</button>
                                        <button id="downloadTemplateSidebar" class="btn btn-sm btn-outline-info text-start"><i class="bi bi-download me-2"></i> एक्सेल टेम्पलेट डाउनलोड करें</button>
                                        <button id="editDataBtnSidebar" class="btn btn-sm btn-outline-warning text-start" onclick="window.location.href='edit_data.html';">
                                            <i class="bi bi-pencil-square me-2"></i> डेटा एडिट करें (Excel Grid)
                                        </button>
                                        <button id="addDataBtnSidebar" class="btn btn-sm btn-outline-primary text-start" data-bs-toggle="modal" data-bs-target="#addDataModal"><i class="bi bi-plus-square me-2"></i> नया रिकॉर्ड जोड़ें</button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Section 2: कैनवास बैकग्राउंड (Canvas Backgrounds) -->
                        <div class="accordion-item bg-transparent">
                            <h2 class="accordion-header" id="headingBackground">
                                <button class="accordion-button collapsed px-0 py-2 bg-transparent fw-bold text-dark" type="button" data-bs-toggle="collapse" data-bs-target="#collapseBackground" aria-expanded="false" aria-controls="collapseBackground">
                                    <i class="bi bi-palette-fill me-2 text-success"></i> कैनवास थीम (Backdrop Theme)
                                </button>
                            </h2>
                            <div id="collapseBackground" class="accordion-collapse collapse" aria-labelledby="headingBackground" data-bs-parent="#advActionsAccordion">
                                <div class="accordion-body px-0 pt-1 pb-3">
                                    <label class="form-label small text-muted">समग्र कैनवास के लिए रेडीमेड थीम चुनें:</label>
                                    <div class="mb-3">
                                        <select id="canvasBackdropThemeSidebar" class="form-select form-select-sm">
                                            <option value="default">डिफ़ॉल्ट लाइट (Default Light)</option>
                                            <option value="dark">रॉयल डार्क (Royal Dark)</option>
                                            <option value="sepia">क्लासिक सेपिया (Warm Sepia)</option>
                                            <option value="blue-glow">साइबर ब्लू ग्लो (Cyber Blue)</option>
                                            <option value="glassy">फ्रॉस्टेड ग्लास (Frosted Glass)</option>
                                        </select>
                                    </div>
                                    <label class="form-label small text-muted">पेज बैकग्राउंड टेम्पलेट्स:</label>
                                    <div id="backgroundTemplateGallery" class="d-flex flex-wrap justify-content-center gap-2 mt-1"></div>
                                    <button id="applyTemplateBtn" class="btn btn-sm btn-success w-100 mt-2"><i class="bi bi-check-circle me-1"></i> पेज बैकग्राउंड लागू करें</button>
                                </div>
                            </div>
                        </div>

                        <!-- Section 3: स्मार्ट डेटा विश्लेषण (Smart Data Analysis) -->
                        <div class="accordion-item bg-transparent">
                            <h2 class="accordion-header" id="headingSmart">
                                <button class="accordion-button collapsed px-0 py-2 bg-transparent fw-bold text-dark" type="button" data-bs-toggle="collapse" data-bs-target="#collapseSmart" aria-expanded="false" aria-controls="collapseSmart">
                                    <i class="bi bi-lightning-charge-fill me-2 text-warning"></i> स्मार्ट डेटा विश्लेषण (Smart Insights)
                                </button>
                            </h2>
                            <div id="collapseSmart" class="accordion-collapse collapse" aria-labelledby="headingSmart" data-bs-parent="#advActionsAccordion">
                                <div class="accordion-body px-0 pt-1 pb-3">
                                    <div class="mb-2">
                                        <label class="form-label small fw-bold">कॉलम A (श्रेणी / स्वतंत्र):</label>
                                        <select id="smartColA" class="form-select form-select-sm">
                                            <option value="">कॉलम चुनें...</option>
                                        </select>
                                    </div>
                                    <div class="mb-3">
                                        <label class="form-label small fw-bold">कॉलम B (संख्या / निर्भर):</label>
                                        <select id="smartColB" class="form-select form-select-sm">
                                            <option value="">कॉलम चुनें...</option>
                                        </select>
                                    </div>
                                    <button id="btnSmartInsight" class="btn btn-sm btn-warning w-100"><i class="bi bi-graph-up-arrow me-1"></i> सहसंबंध और रुझान विश्लेषण</button>
                                </div>
                            </div>
                        </div>

                        <!-- Section 4: डेटा ऑडिट और सुरक्षा (Data Audit & Diagnostics) -->
                        <div class="accordion-item bg-transparent">
                            <h2 class="accordion-header" id="headingAudit">
                                <button class="accordion-button collapsed px-0 py-2 bg-transparent fw-bold text-dark" type="button" data-bs-toggle="collapse" data-bs-target="#collapseAudit" aria-expanded="false" aria-controls="collapseAudit">
                                    <i class="bi bi-shield-check me-2 text-info"></i> डेटा ऑडिट एवं निदान (Data Auditor)
                                </button>
                            </h2>
                            <div id="collapseAudit" class="accordion-collapse collapse" aria-labelledby="headingAudit" data-bs-parent="#advActionsAccordion">
                                <div class="accordion-body px-0 pt-1 pb-3 text-center">
                                    <p class="text-muted small text-start">यह टूल आपके पूरे डेटाबेस की गुणवत्ता, विसंगतियों, शून्य मानों (null) और आउटलेर्स की जांच करता है।</p>
                                    <button id="btnDataAudit" class="btn btn-sm btn-info w-100 text-white"><i class="bi bi-shield-shaded me-1"></i> डेटा क्वालिटी ऑडिट रिपोर्ट</button>
                                </div>
                            </div>
                        </div>

                        <!-- Section 5: रिपोर्ट एक्सपोर्ट और प्रिंट (Executive Print) -->
                        <div class="accordion-item bg-transparent">
                            <h2 class="accordion-header" id="headingPrint">
                                <button class="accordion-button collapsed px-0 py-2 bg-transparent fw-bold text-dark" type="button" data-bs-toggle="collapse" data-bs-target="#collapsePrint" aria-expanded="false" aria-controls="collapsePrint">
                                    <i class="bi bi-file-earmark-pdf-fill me-2 text-danger"></i> PDF कवर पेज एवं रिपोर्ट एक्सपोर्ट
                                </button>
                            </h2>
                            <div id="collapsePrint" class="accordion-collapse collapse" aria-labelledby="headingPrint" data-bs-parent="#advActionsAccordion">
                                <div class="accordion-body px-0 pt-1 pb-3">
                                    <p class="text-muted small mb-2" style="font-size: 11px;">कार्यकारी PDF रिपोर्ट के लिए कवर पेज शीर्षक, सारांश और मेटाडेटा कस्टमाइज़ करें:</p>
                                    
                                    <div class="mb-2">
                                        <label for="pdfReportTitle" class="form-label text-xs fw-semibold text-slate-700 mb-0.5">रिपोर्ट शीर्षक (Report Title):</label>
                                        <input type="text" id="pdfReportTitle" class="form-control form-control-sm text-xs shadow-2xs" value="VEDRA BI EXECUTIVE STRATEGIC REPORT" placeholder="उदा. Q3 बिजनेस परफॉरमेंस रिपोर्ट">
                                    </div>

                                    <div class="row g-2 mb-2">
                                        <div class="col-6">
                                            <label for="pdfPreparedBy" class="form-label text-xs fw-semibold text-slate-700 mb-0.5">तैयारकर्ता (Author):</label>
                                            <input type="text" id="pdfPreparedBy" class="form-control form-control-sm text-xs shadow-2xs" value="Vedra BI Analytics Team" placeholder="उदा. डेटा टीम">
                                        </div>
                                        <div class="col-6">
                                            <label for="pdfTargetDept" class="form-label text-xs fw-semibold text-slate-700 mb-0.5">विभाग (Scope/Dept):</label>
                                            <input type="text" id="pdfTargetDept" class="form-control form-control-sm text-xs shadow-2xs" value="Executive Leadership" placeholder="उदा. बोर्ड व नेतृत्व">
                                        </div>
                                    </div>

                                    <div class="mb-2">
                                        <label for="pdfConfidentiality" class="form-label text-xs fw-semibold text-slate-700 mb-0.5">सुरक्षा वर्गीकरण (Classification):</label>
                                        <select id="pdfConfidentiality" class="form-select form-select-sm text-xs shadow-2xs">
                                            <option value="CONFIDENTIAL" selected>CONFIDENTIAL (गोपनीय)</option>
                                            <option value="INTERNAL ONLY">INTERNAL ONLY (आंतरिक उपयोग)</option>
                                            <option value="PUBLIC RELEASE">PUBLIC RELEASE (सार्वजनिक)</option>
                                            <option value="STRICTLY RESTRICTED">STRICTLY RESTRICTED (प्रतिबंधित)</option>
                                        </select>
                                    </div>

                                    <div class="mb-2.5">
                                        <div class="d-flex justify-content-between align-items-center mb-1">
                                            <label for="pdfExecutiveSummary" class="form-label text-xs fw-semibold text-slate-700 mb-0">कवर पेज सारांश (Executive Summary):</label>
                                            <button type="button" id="btnAutoGenerateSummary" class="btn btn-link btn-sm p-0 text-primary text-decoration-none fw-semibold" style="font-size: 10.5px;">
                                                <i class="bi bi-magic me-0.5"></i> स्मार्ट ऑटो-फ़िल
                                            </button>
                                        </div>
                                        <textarea id="pdfExecutiveSummary" class="form-control form-control-sm text-xs shadow-2xs" rows="3" placeholder="डैशबोर्ड का मुख्य निष्कर्ष, रणनीतिक रुझान और सिफ़ारिशें यहाँ लिखें (या 'स्मार्ट ऑटो-फ़िल' पर क्लिक करें)..."></textarea>
                                        <div class="text-muted mt-1" style="font-size: 9.5px;">यह सारांश सीधे PDF कवर पेज (Cover Page) पर प्रदर्शित होगा।</div>
                                    </div>

                                    <div class="d-flex flex-column gap-1.5 pt-1 border-top">
                                        <button id="btnExportPDFWithCover" class="btn btn-sm btn-danger w-100 fw-semibold text-xs shadow-2xs">
                                            <i class="bi bi-file-earmark-pdf-fill me-1"></i> कवर पेज सहित Executive PDF डाउनलोड करें
                                        </button>
                                        <button id="btnPrintReport" class="btn btn-sm btn-outline-secondary w-100 fw-semibold text-xs shadow-2xs">
                                            <i class="bi bi-printer me-1"></i> प्रिंट / ब्राउज़र लेआउट (Print)
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Section 6: लाइव डेटा सिमुलेशन कंट्रोलर (Simulation Controller) -->
                        <div class="accordion-item bg-transparent">
                            <h2 class="accordion-header" id="headingSim">
                                <button class="accordion-button collapsed px-0 py-2 bg-transparent fw-bold text-dark" type="button" data-bs-toggle="collapse" data-bs-target="#collapseSim" aria-expanded="false" aria-controls="collapseSim">
                                    <i class="bi bi-play-circle-fill me-2 text-secondary"></i> लाइव रिफ्रेश और सिमुलेटर
                                </button>
                            </h2>
                            <div id="collapseSim" class="accordion-collapse collapse" aria-labelledby="headingSim" data-bs-parent="#advActionsAccordion">
                                <div class="accordion-body px-0 pt-1 pb-3">
                                    <div class="mb-3">
                                        <label class="form-label small fw-bold">ऑटो रिफ्रेश अंतराल (Refresh Interval):</label>
                                        <select id="autoRefreshSelector" class="form-select form-select-sm">
                                            <option value="off">बंद (Manual)</option>
                                            <option value="5000">5 सेकंड (5s)</option>
                                            <option value="10000">10 सेकंड (10s)</option>
                                            <option value="30000">30 सेकंड (30s)</option>
                                        </select>
                                    </div>
                                    <div class="mb-2">
                                        <label class="form-label small fw-bold">लाइव डेटा स्ट्रीम सिमुलेशन:</label>
                                        <button id="btnToggleSimStream" class="btn btn-sm btn-outline-success w-100 mb-2"><i class="bi bi-broadcast me-1"></i> स्ट्रीम शुरू करें</button>
                                        <div id="simStreamStatus" class="small text-muted text-center"><i class="bi bi-record-fill text-danger"></i> सिमुलेशन निष्क्रिय</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                `,
  "filterSortContent": `
                    <div class="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
                        <div>
                            <h5 class="m-0 fw-bold d-flex align-items-center gap-2" style="font-size: 0.95rem;">
                                <i class="bi bi-funnel-fill text-indigo-600 dark:text-indigo-400"></i> एडवांस्ड फ़िल्टर व स्लाइसर
                            </h5>
                            <div class="text-muted" style="font-size: 0.7rem;">डेटा को स्लाइस, फ़िल्टर और सॉर्ट करें</div>
                        </div>
                        <div class="d-flex align-items-center gap-1.5">
                            <span class="badge bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 font-semibold" id="activeFilterCountBadge">0 सक्रिय</span>
                            <button type="button" class="btn btn-sm btn-link text-muted hover-danger p-0 text-decoration-none" id="quickClearAllFiltersBtn" title="सभी फ़िल्टर्स साफ़ करें" style="font-size: 0.85rem;">
                                <i class="bi bi-arrow-counterclockwise"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div id="filterSortSection" class="pb-4">
                        <!-- Active Filter Chips Bar (Dynamic when active) -->
                        <div id="activeFiltersContainer" class="mb-3 p-2 bg-indigo-50/70 dark:bg-indigo-950/50 rounded-2 border border-indigo-100 dark:border-indigo-900/50" style="display: none !important;">
                            <div class="d-flex align-items-center justify-content-between mb-1.5">
                                <span class="text-xs fw-bold text-indigo-900 dark:text-indigo-300 d-flex align-items-center gap-1" style="font-size: 0.72rem;">
                                    <i class="bi bi-check2-circle text-indigo-500"></i> सक्रिय फ़िल्टर्स:
                                </span>
                                <button type="button" class="btn btn-link btn-sm text-danger p-0 text-decoration-none fw-semibold" id="clearAllChipsBtn" style="font-size: 0.68rem;">सभी हटाएं</button>
                            </div>
                            <div id="activeFiltersChips" class="d-flex flex-wrap gap-1"></div>
                        </div>

                        <!-- 0. Logical Match Mode Toggle (Segmented Pill Switcher) -->
                        <div class="card mb-3 shadow-xs border-0 bg-slate-100/80 dark:bg-slate-900/80 rounded-3 p-2">
                            <div class="d-flex align-items-center justify-content-between mb-1.5">
                                <label class="form-label mb-0 small fw-bold text-slate-700 dark:text-slate-200 d-flex align-items-center gap-1.5" style="font-size: 0.72rem;">
                                    <i class="bi bi-sliders2 text-indigo-500"></i> <span>फ़िल्टर संयोजन (Match Mode):</span>
                                </label>
                                <span class="badge bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300" style="font-size: 0.62rem;" id="matchModePill">AND Mode</span>
                            </div>
                            <div class="btn-group btn-group-sm w-100 p-0.5 bg-slate-200/80 dark:bg-slate-950 rounded-2" role="group">
                                <input type="radio" class="btn-check" name="filterMatchMode" id="matchModeAnd" value="AND" checked>
                                <label class="btn btn-sm py-1.5 px-2 border-0 rounded-2 fw-semibold d-flex align-items-center justify-content-center gap-1 filter-segment-btn" for="matchModeAnd" style="font-size: 0.72rem;">
                                    <i class="bi bi-intersect"></i> सभी मानदंड (AND)
                                </label>
                                <input type="radio" class="btn-check" name="filterMatchMode" id="matchModeOr" value="OR">
                                <label class="btn btn-sm py-1.5 px-2 border-0 rounded-2 fw-semibold d-flex align-items-center justify-content-center gap-1 filter-segment-btn" for="matchModeOr" style="font-size: 0.72rem;">
                                    <i class="bi bi-union"></i> कोई भी मानदंड (OR)
                                </label>
                            </div>
                            <div class="text-muted mt-1 px-1" style="font-size: 0.64rem; line-height: 1.2;">
                                <span class="text-indigo-600 dark:text-indigo-400 fw-semibold">AND:</span> सभी सक्रिय नियम पूरे होने चाहिए | <span class="text-indigo-600 dark:text-indigo-400 fw-semibold">OR:</span> कोई भी एक नियम पूरा होने पर
                            </div>
                        </div>

                        <!-- Heavy-Duty Backend: DuckDB OLAP & Apache Arrow Binary Protocol Section -->
                        <div class="card mb-3 shadow-xs border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 rounded-3 overflow-hidden">
                            <div class="card-body p-2.5">
                                <div class="d-flex align-items-center justify-content-between mb-1.5">
                                    <div class="d-flex align-items-center gap-1.5">
                                        <div class="rounded-circle bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 d-flex align-items-center justify-content-center" style="width: 20px; height: 20px; font-size: 10px;">
                                            <i class="bi bi-lightning-charge-fill"></i>
                                        </div>
                                        <span class="fw-bold text-slate-800 dark:text-slate-200" style="font-size: 0.75rem;">DuckDB OLAP Engine</span>
                                    </div>
                                    <div class="d-flex align-items-center gap-2">
                                        <span class="badge bg-success-subtle text-success border border-success-subtle" id="duckdbModeStatus" style="font-size: 0.62rem; padding: 2px 6px;">
                                            सक्रिय (Server)
                                        </span>
                                        <div class="form-check form-switch m-0">
                                            <input class="form-check-input cursor-pointer" type="checkbox" role="switch" id="useDuckDBBtn" checked style="width: 1.8rem; height: 0.95rem;">
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Live Metrics Compact Box -->
                                <div class="bg-white dark:bg-slate-900 p-1.5 rounded-2 border border-emerald-100 dark:border-emerald-900/40 mb-1">
                                    <div class="row g-1 text-center" style="font-size: 0.68rem;">
                                        <div class="col-3">
                                            <div class="text-muted" style="font-size: 0.58rem;">DuckDB SQL</div>
                                            <div class="fw-bold text-emerald-600 dark:text-emerald-400" id="duckdbQueryTimeLbl">0.0 ms</div>
                                        </div>
                                        <div class="col-3">
                                            <div class="text-muted" style="font-size: 0.58rem;">Arrow Stream</div>
                                            <div class="fw-bold text-success" id="arrowBytesLbl">Binary</div>
                                        </div>
                                        <div class="col-3">
                                            <div class="text-muted" style="font-size: 0.58rem;">Speedup</div>
                                            <div class="fw-bold text-indigo-600 dark:text-indigo-400" id="arrowCompressionRatioLbl">1.0x</div>
                                        </div>
                                        <div class="col-3">
                                            <div class="text-muted" style="font-size: 0.58rem;">Total Rows</div>
                                            <div class="fw-bold text-slate-800 dark:text-slate-200" id="duckdbRowCountLbl">0</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Modern BI Slicer Accordion (Individual Clean Cards) -->
                        <div class="accordion modern-bi-accordion d-flex flex-column gap-2 mb-3" id="filterSortAccordion">
                            
                            <!-- Section 1: Text Search Slicer -->
                            <div class="accordion-item border rounded-3 overflow-hidden shadow-2xs">
                                <h2 class="accordion-header" id="headingTextFilter">
                                    <button class="accordion-button py-2.5 px-3 fw-bold small text-slate-700 dark:text-slate-200 d-flex align-items-center gap-2" type="button" data-bs-toggle="collapse" data-bs-target="#collapseTextFilter" aria-expanded="true" aria-controls="collapseTextFilter">
                                        <span class="bi-filter-icon-badge bg-sky-500/15 text-sky-600 dark:text-sky-400"><i class="bi bi-search"></i></span>
                                        <div class="flex-fill text-start">
                                            <div style="font-size: 0.78rem;">टेक्स्ट खोज स्लाइसर</div>
                                            <div class="text-muted font-normal" style="font-size: 0.65rem;">टेक्स्ट कॉलम पर सर्च या मैच करें</div>
                                        </div>
                                        <span class="badge bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 rounded-pill d-none me-2" id="textFilterActiveBadge" style="font-size: 0.6rem; padding: 2px 6px;">सक्रिय</span>
                                    </button>
                                </h2>
                                <div id="collapseTextFilter" class="accordion-collapse collapse show" aria-labelledby="headingTextFilter" data-bs-parent="#filterSortAccordion">
                                    <div class="accordion-body p-3 pt-2 bg-slate-50/50 dark:bg-slate-900/40">
                                        <div class="mb-2">
                                            <label for="filterCol" class="form-label text-muted small mb-1 fw-semibold" style="font-size: 0.72rem;">कॉलम चुनें:</label>
                                            <select id="filterCol" class="form-select form-select-sm"></select>
                                        </div>
                                        
                                        <div class="mb-2">
                                            <label for="textFilterOperator" class="form-label text-muted small mb-1 fw-semibold" style="font-size: 0.72rem;">मैच का प्रकार (Operator):</label>
                                            <select id="textFilterOperator" class="form-select form-select-sm">
                                                <option value="includes">🔍 शामिल है (Contains)</option>
                                                <option value="startsWith">▶ से शुरू होता है (Starts With)</option>
                                                <option value="endsWith">◀ से समाप्त होता है (Ends With)</option>
                                                <option value="equals">🎯 बिल्कुल बराबर (Exact Match)</option>
                                                <option value="doesNotInclude">🚫 शामिल नहीं है (Does Not Contain)</option>
                                            </select>
                                        </div>
                                        
                                        <div>
                                            <label for="filterValue" class="form-label text-muted small mb-1 fw-semibold" style="font-size: 0.72rem;">खोज मूल्य (Search Value):</label>
                                            <div class="input-group input-group-sm">
                                                <span class="input-group-text bg-white dark:bg-slate-800 text-muted"><i class="bi bi-fonts"></i></span>
                                                <input type="text" id="filterValue" class="form-control form-control-sm" placeholder="खोज मान दर्ज करें...">
                                                <button type="button" class="btn btn-outline-secondary btn-sm" id="clearTextFilterInputBtn" title="साफ़ करें"><i class="bi bi-x"></i></button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Section 2: Multi-Select Categorical Slicer -->
                            <div class="accordion-item border rounded-3 overflow-hidden shadow-2xs">
                                <h2 class="accordion-header" id="headingMultiFilter">
                                    <button class="accordion-button collapsed py-2.5 px-3 fw-bold small text-slate-700 dark:text-slate-200 d-flex align-items-center gap-2" type="button" data-bs-toggle="collapse" data-bs-target="#collapseMultiFilter" aria-expanded="false" aria-controls="collapseMultiFilter">
                                        <span class="bi-filter-icon-badge bg-amber-500/15 text-amber-600 dark:text-amber-400"><i class="bi bi-ui-checks-grid"></i></span>
                                        <div class="flex-fill text-start">
                                            <div style="font-size: 0.78rem;">बहु-चयन (Multi-Select) स्लाइसर</div>
                                            <div class="text-muted font-normal" style="font-size: 0.65rem;">श्रेणियों या मानों की सूची चुनें</div>
                                        </div>
                                        <span class="badge bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-pill d-none me-2" id="multiFilterActiveBadge" style="font-size: 0.6rem; padding: 2px 6px;">सक्रिय</span>
                                    </button>
                                </h2>
                                <div id="collapseMultiFilter" class="accordion-collapse collapse" aria-labelledby="headingMultiFilter" data-bs-parent="#filterSortAccordion">
                                    <div class="accordion-body p-3 pt-2 bg-slate-50/50 dark:bg-slate-900/40">
                                        <div class="mb-2">
                                            <label for="multiSelectFilterCol" class="form-label text-muted small mb-1 fw-semibold" style="font-size: 0.72rem;">कैटेगरी कॉलम चुनें:</label>
                                            <select id="multiSelectFilterCol" class="form-select form-select-sm"></select>
                                        </div>
                                        
                                        <!-- Quick Selection Toolstrip -->
                                        <div class="d-flex align-items-center justify-content-between gap-1 mb-2">
                                            <div class="btn-group btn-group-sm flex-fill" role="group">
                                                <button type="button" id="multiSelectAllBtn" class="btn btn-outline-secondary py-0.5 px-1.5" style="font-size: 0.68rem;" title="सभी विकल्प चुनें"><i class="bi bi-check-all"></i> सब चुनें</button>
                                                <button type="button" id="multiSelectClearBtn" class="btn btn-outline-secondary py-0.5 px-1.5" style="font-size: 0.68rem;" title="सभी हटाएं"><i class="bi bi-dash-circle"></i> साफ़ करें</button>
                                                <button type="button" id="multiSelectInvertBtn" class="btn btn-outline-secondary py-0.5 px-1.5" style="font-size: 0.68rem;" title="चयन उलटें"><i class="bi bi-arrow-left-right"></i> उलटें</button>
                                            </div>
                                        </div>

                                        <!-- Quick search within multiselect options -->
                                        <div id="multiSelectSearchContainer" style="display: none;" class="mb-2">
                                            <div class="input-group input-group-sm">
                                                <span class="input-group-text bg-white dark:bg-slate-800 text-muted" style="font-size: 0.72rem;"><i class="bi bi-search"></i></span>
                                                <input type="text" id="multiSelectSearch" class="form-control form-control-sm" placeholder="विकल्प खोजें...">
                                            </div>
                                        </div>
                                        
                                        <div id="multiSelectOptions" class="p-2 border rounded-2 bg-white dark:bg-slate-800/80 custom-scroll-area" style="max-height: 160px; overflow-y: auto;">
                                            <div class="text-muted small text-center py-2" style="font-size: 0.72rem;">कॉलम चुनने पर विकल्प यहां लोड होंगे।</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Section 3: Numeric Range Slicer -->
                            <div class="accordion-item border rounded-3 overflow-hidden shadow-2xs">
                                <h2 class="accordion-header" id="headingNumericFilter">
                                    <button class="accordion-button collapsed py-2.5 px-3 fw-bold small text-slate-700 dark:text-slate-200 d-flex align-items-center gap-2" type="button" data-bs-toggle="collapse" data-bs-target="#collapseNumericFilter" aria-expanded="false" aria-controls="collapseNumericFilter">
                                        <span class="bi-filter-icon-badge bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"><i class="bi bi-calculator"></i></span>
                                        <div class="flex-fill text-start">
                                            <div style="font-size: 0.78rem;">संख्यात्मक दायरा (Numeric Range)</div>
                                            <div class="text-muted font-normal" style="font-size: 0.65rem;">न्यूनतम व अधिकतम सीमा फ़िल्टर</div>
                                        </div>
                                        <span class="badge bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-pill d-none me-2" id="numericFilterActiveBadge" style="font-size: 0.6rem; padding: 2px 6px;">सक्रिय</span>
                                    </button>
                                </h2>
                                <div id="collapseNumericFilter" class="accordion-collapse collapse" aria-labelledby="headingNumericFilter" data-bs-parent="#filterSortAccordion">
                                    <div class="accordion-body p-3 pt-2 bg-slate-50/50 dark:bg-slate-900/40">
                                        <div class="mb-2">
                                            <label for="filterNumericCol" class="form-label text-muted small mb-1 fw-semibold" style="font-size: 0.72rem;">संख्या कॉलम चुनें:</label>
                                            <select id="filterNumericCol" class="form-select form-select-sm"></select>
                                        </div>
                                        
                                        <!-- Numeric Range Distribution Preview -->
                                        <div id="numericDistributionPreview" class="mb-2.5 p-2 rounded-2 bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40" style="display: none;">
                                            <div class="d-flex align-items-center justify-content-between mb-1 text-emerald-800 dark:text-emerald-300 fw-bold" style="font-size: 0.7rem;">
                                                <span><i class="bi bi-bar-chart-fill me-1"></i>कॉलम सांख्यिकी (Stats):</span>
                                            </div>
                                            <div class="row g-1 text-center" style="font-size: 0.68rem;">
                                                <div class="col-4">
                                                    <div class="text-muted" style="font-size: 0.58rem;">न्यूनतम (Min)</div>
                                                    <div class="fw-bold text-slate-800 dark:text-slate-200" id="numStatMin">-</div>
                                                </div>
                                                <div class="col-4">
                                                    <div class="text-muted" style="font-size: 0.58rem;">औसत (Avg)</div>
                                                    <div class="fw-bold text-emerald-600 dark:text-emerald-400" id="numStatAvg">-</div>
                                                </div>
                                                <div class="col-4">
                                                    <div class="text-muted" style="font-size: 0.58rem;">अधिकतम (Max)</div>
                                                    <div class="fw-bold text-slate-800 dark:text-slate-200" id="numStatMax">-</div>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- Quick Presets -->
                                        <div class="d-flex flex-wrap gap-1 mb-2">
                                            <button type="button" class="btn btn-outline-secondary btn-sm py-0.5 px-2 rounded-pill" id="numRangeAll" style="font-size: 0.65rem;">सभी</button>
                                            <button type="button" class="btn btn-outline-secondary btn-sm py-0.5 px-2 rounded-pill" id="numRangeAboveAvg" style="font-size: 0.65rem;">> औसत (Avg)</button>
                                            <button type="button" class="btn btn-outline-secondary btn-sm py-0.5 px-2 rounded-pill" id="numRangeBelowAvg" style="font-size: 0.65rem;">< औसत (Avg)</button>
                                        </div>

                                        <div class="row g-2">
                                            <div class="col-6">
                                                <label for="minNumericValue" class="form-label text-muted small mb-1 fw-semibold" style="font-size: 0.7rem;">न्यूनतम (Min):</label>
                                                <input type="number" id="minNumericValue" class="form-control form-control-sm" placeholder="कम से कम">
                                            </div>
                                            <div class="col-6">
                                                <label for="maxNumericValue" class="form-label text-muted small mb-1 fw-semibold" style="font-size: 0.7rem;">अधिकतम (Max):</label>
                                                <input type="number" id="maxNumericValue" class="form-control form-control-sm" placeholder="अधिक से अधिक">
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Section 4: Date Range Slicer -->
                            <div class="accordion-item border rounded-3 overflow-hidden shadow-2xs">
                                <h2 class="accordion-header" id="headingDateFilter">
                                    <button class="accordion-button collapsed py-2.5 px-3 fw-bold small text-slate-700 dark:text-slate-200 d-flex align-items-center gap-2" type="button" data-bs-toggle="collapse" data-bs-target="#collapseDateFilter" aria-expanded="false" aria-controls="collapseDateFilter">
                                        <span class="bi-filter-icon-badge bg-rose-500/15 text-rose-600 dark:text-rose-400"><i class="bi bi-calendar3-range"></i></span>
                                        <div class="flex-fill text-start">
                                            <div style="font-size: 0.78rem;">तारीख सीमा (Date Range)</div>
                                            <div class="text-muted font-normal" style="font-size: 0.65rem;">टाइमलाइन या समयावधि चुनें</div>
                                        </div>
                                        <span class="badge bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-pill d-none me-2" id="dateFilterActiveBadge" style="font-size: 0.6rem; padding: 2px 6px;">सक्रिय</span>
                                    </button>
                                </h2>
                                <div id="collapseDateFilter" class="accordion-collapse collapse" aria-labelledby="headingDateFilter" data-bs-parent="#filterSortAccordion">
                                    <div class="accordion-body p-3 pt-2 bg-slate-50/50 dark:bg-slate-900/40">
                                        <!-- Quick Date Chips -->
                                        <div class="d-flex flex-wrap gap-1 mb-2.5">
                                            <button type="button" class="btn btn-outline-secondary btn-sm py-0.5 px-2 rounded-pill date-preset-btn" id="datePresetAll" style="font-size: 0.65rem;">सभी</button>
                                            <button type="button" class="btn btn-outline-secondary btn-sm py-0.5 px-2 rounded-pill date-preset-btn" id="datePresetToday" style="font-size: 0.65rem;">आज</button>
                                            <button type="button" class="btn btn-outline-secondary btn-sm py-0.5 px-2 rounded-pill date-preset-btn" id="datePresetLast7" style="font-size: 0.65rem;">पिछले 7 दिन</button>
                                            <button type="button" class="btn btn-outline-secondary btn-sm py-0.5 px-2 rounded-pill date-preset-btn" id="datePresetLast30" style="font-size: 0.65rem;">पिछले 30 दिन</button>
                                            <button type="button" class="btn btn-outline-secondary btn-sm py-0.5 px-2 rounded-pill date-preset-btn" id="datePresetMonth" style="font-size: 0.65rem;">यह महीना</button>
                                            <button type="button" class="btn btn-outline-secondary btn-sm py-0.5 px-2 rounded-pill date-preset-btn" id="datePresetYear" style="font-size: 0.65rem;">इस वर्ष</button>
                                        </div>

                                        <div class="row g-2">
                                            <div class="col-6">
                                                <label for="startDate" class="form-label text-muted small mb-1 fw-semibold" style="font-size: 0.7rem;">शुरुआती तारीख (Start):</label>
                                                <input type="date" id="startDate" class="form-control form-control-sm">
                                            </div>
                                            <div class="col-6">
                                                <label for="endDate" class="form-label text-muted small mb-1 fw-semibold" style="font-size: 0.7rem;">अंतिम तारीख (End):</label>
                                                <input type="date" id="endDate" class="form-control form-control-sm">
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Section 5: Group By & Aggregate Dimensions -->
                            <div class="accordion-item border rounded-3 overflow-hidden shadow-2xs">
                                <h2 class="accordion-header" id="headingGroupBy">
                                    <button class="accordion-button collapsed py-2.5 px-3 fw-bold small text-slate-700 dark:text-slate-200 d-flex align-items-center gap-2" type="button" data-bs-toggle="collapse" data-bs-target="#collapseGroupBy" aria-expanded="false" aria-controls="collapseGroupBy">
                                        <span class="bi-filter-icon-badge bg-purple-500/15 text-purple-600 dark:text-purple-400"><i class="bi bi-diagram-3-fill"></i></span>
                                        <div class="flex-fill text-start">
                                            <div style="font-size: 0.78rem;">ग्रुप बाय (Group By) डायमेंशन्स</div>
                                            <div class="text-muted font-normal" style="font-size: 0.65rem;">कॉलम के अनुसार समूहीकृत करें</div>
                                        </div>
                                        <span class="badge bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded-pill d-none me-2" id="groupByActiveBadge" style="font-size: 0.6rem; padding: 2px 6px;">सक्रिय</span>
                                    </button>
                                </h2>
                                <div id="collapseGroupBy" class="accordion-collapse collapse" aria-labelledby="headingGroupBy" data-bs-parent="#filterSortAccordion">
                                    <div class="accordion-body p-3 pt-2 bg-slate-50/50 dark:bg-slate-900/40">
                                        <div class="d-flex align-items-center justify-content-between mb-1.5">
                                            <label class="form-label text-muted small mb-0 fw-semibold" style="font-size: 0.72rem;">ग्रुप करने के लिए कॉलम चुनें:</label>
                                            <button type="button" class="btn btn-link btn-sm text-danger p-0 text-decoration-none" id="clearGroupByChipsBtn" style="font-size: 0.68rem;">सब हटाएं</button>
                                        </div>
                                        
                                        <!-- Hidden select kept for backwards compatibility -->
                                        <select id="groupByCols" multiple class="d-none"></select>
                                        
                                        <!-- Visual Interactive Column Chip Picker -->
                                        <div id="groupByChipsContainer" class="d-flex flex-wrap gap-1.5 p-2 border rounded-2 bg-white dark:bg-slate-800/80 mb-2" style="min-height: 50px;">
                                            <div class="text-muted small w-100 text-center py-2" style="font-size: 0.72rem;">कॉलम लोड हो रहे हैं...</div>
                                        </div>

                                        <div class="text-muted" style="font-size: 0.65rem; line-height: 1.2;">
                                            💡 कॉलम पर क्लिक करके उसे ग्रुपिंग में जोड़ें या हटाएं। डेटा स्वचालित रूप से ग्रुप होकर कुल पंक्तियाँ व योग प्रस्तुत करेगा।
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Section 6: Multi-Column Sort Priority -->
                            <div class="accordion-item border rounded-3 overflow-hidden shadow-2xs">
                                <h2 class="accordion-header" id="headingSortRules">
                                    <button class="accordion-button collapsed py-2.5 px-3 fw-bold small text-slate-700 dark:text-slate-200 d-flex align-items-center gap-2" type="button" data-bs-toggle="collapse" data-bs-target="#collapseSortRules" aria-expanded="false" aria-controls="collapseSortRules">
                                        <span class="bi-filter-icon-badge bg-indigo-500/15 text-indigo-600 dark:text-indigo-400"><i class="bi bi-sort-alpha-down"></i></span>
                                        <div class="flex-fill text-start">
                                            <div style="font-size: 0.78rem;">बहु-कॉलम सॉर्ट (Multi-Sort)</div>
                                            <div class="text-muted font-normal" style="font-size: 0.65rem;">प्राथमिकता के अनुसार क्रमबद्ध करें</div>
                                        </div>
                                        <span class="badge bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-pill d-none me-2" id="sortActiveBadge" style="font-size: 0.6rem; padding: 2px 6px;">सक्रिय</span>
                                    </button>
                                </h2>
                                <div id="collapseSortRules" class="accordion-collapse collapse" aria-labelledby="headingSortRules" data-bs-parent="#filterSortAccordion">
                                    <div class="accordion-body p-3 pt-2 bg-slate-50/50 dark:bg-slate-900/40">
                                        <label class="form-label text-muted small mb-1.5 fw-semibold" style="font-size: 0.72rem;">सॉर्ट प्राथमिकता नियम (Sort Rules):</label>
                                        <div id="sortRulesContainer" class="d-flex flex-column gap-1.5 mb-2"></div>
                                        <button type="button" id="addSortRuleBtn" class="btn btn-outline-primary btn-sm w-100 py-1.5 rounded-2 d-flex align-items-center justify-content-center gap-1 fw-semibold" style="font-size: 0.75rem;">
                                            <i class="bi bi-plus-lg"></i> नया सॉर्ट नियम जोड़ें
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <!-- Section 7: Presets & Bookmarks -->
                            <div class="accordion-item border rounded-3 overflow-hidden shadow-2xs">
                                <h2 class="accordion-header" id="headingPresets">
                                    <button class="accordion-button collapsed py-2.5 px-3 fw-bold small text-slate-700 dark:text-slate-200 d-flex align-items-center gap-2" type="button" data-bs-toggle="collapse" data-bs-target="#collapsePresets" aria-expanded="false" aria-controls="collapsePresets">
                                        <span class="bi-filter-icon-badge bg-pink-500/15 text-pink-600 dark:text-pink-400"><i class="bi bi-bookmark-star-fill"></i></span>
                                        <div class="flex-fill text-start">
                                            <div style="font-size: 0.78rem;">फ़िल्टर प्रीसेट्स (Presets)</div>
                                            <div class="text-muted font-normal" style="font-size: 0.65rem;">सेव किए गए फ़िल्टर लोड करें</div>
                                        </div>
                                    </button>
                                </h2>
                                <div id="collapsePresets" class="accordion-collapse collapse" aria-labelledby="headingPresets" data-bs-parent="#filterSortAccordion">
                                    <div class="accordion-body p-3 pt-2 bg-slate-50/50 dark:bg-slate-900/40">
                                        <label for="presetName" class="form-label text-muted small mb-1 fw-semibold" style="font-size: 0.72rem;">वर्तमान सेटिंग्स को सेव करें:</label>
                                        <div class="input-group input-group-sm mb-3">
                                            <input type="text" id="presetName" class="form-control" placeholder="प्रीसेट का नाम दर्ज करें...">
                                            <button id="savePresetBtn" class="btn btn-success fw-semibold" title="प्रीसेट सेव करें"><i class="bi bi-bookmark-plus-fill me-1"></i>सेव</button>
                                        </div>
                                        
                                        <label for="loadPreset" class="form-label text-muted small mb-1 fw-semibold" style="font-size: 0.72rem;">सेव्ड प्रीसेट लोड करें:</label>
                                        <select id="loadPreset" class="form-select form-select-sm mb-2">
                                            <option value="">प्रीसेट चुनें...</option>
                                        </select>
                                        <button id="applyPresetBtn" class="btn btn-outline-primary btn-sm w-100 rounded-2 fw-semibold"><i class="bi bi-cloud-arrow-up-fill me-1"></i> प्रीसेट लोड करें</button>
                                    </div>
                                </div>
                            </div>

                        </div>

                        <!-- Reset & Apply Sticky Action Buttons -->
                        <div class="row g-2 pt-2 border-top">
                            <div class="col-5">
                                <button type="button" id="resetFiltersBtn" class="btn btn-outline-secondary w-100 py-2 btn-sm fw-semibold rounded-2 d-flex align-items-center justify-content-center gap-1" style="font-size: 0.78rem;">
                                    <i class="bi bi-arrow-counterclockwise"></i> सभी रीसेट
                                </button>
                            </div>
                            <div class="col-7">
                                <button id="applyFilterSort" class="btn btn-primary w-100 py-2 btn-sm fw-bold rounded-2 d-flex align-items-center justify-content-center gap-1.5 text-white shadow-sm" style="font-size: 0.8rem; background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%); border: none;">
                                    <i class="bi bi-funnel-fill"></i> फ़िल्टर लागू करें
                                </button>
                            </div>
                        </div>
                    </div>
                `,
  "chartFormattingContent": `
                    <div class="d-flex justify-content-between align-items-center mb-2.5 pb-2 border-bottom">
                        <div class="d-flex align-items-center gap-2">
                            <div class="rounded d-flex align-items-center justify-content-center" style="background-color: #f0fdf4; color: #16a34a; width: 30px; height: 30px; border: 1px solid #bbf7d0;">
                                <i class="bi bi-brush" style="font-size: 14px;"></i>
                            </div>
                            <div>
                                <h6 class="m-0 fw-semibold text-dark" style="font-size: 13px;">चार्ट फॉर्मेटिंग (Formatting Studio)</h6>
                                <span class="text-muted" style="font-size: 10px;">कंटेनर रंग और शैलियाँ</span>
                            </div>
                        </div>
                    </div>
                    <div id="chartFormattingSection">
                        <div class="row g-2.5 sidebar-desktop-split">
                            <!-- Left Column: Palettes & Scope -->
                            <div class="col-12 col-lg-6 d-flex flex-column gap-2">
                                <div class="p-2 rounded-2 border bg-white shadow-2xs" style="border-color: #e2e8f0 !important;">
                                    <label class="form-label text-xs fw-semibold mb-1 d-flex align-items-center gap-1"><i class="bi bi-palette text-primary"></i> टेम्पलेट्स चुनें:</label>
                                    <div id="chartContainerColorGallery" class="d-flex flex-wrap justify-content-center gap-2 mt-1">
                                    </div>
                                </div>
                                <div class="p-2 rounded-2 border bg-white shadow-2xs" style="border-color: #e2e8f0 !important;">
                                    <label class="form-label text-xs fw-semibold mb-1 d-flex align-items-center gap-1"><i class="bi bi-paint-bucket text-primary"></i> कलर स्कोप:</label>
                                    <div class="btn-group w-100 mb-1" role="group">
                                        <input type="radio" class="btn-check" name="chartContainerScope" id="scopeAllCharts" autocomplete="off" checked>
                                        <label class="btn btn-outline-primary btn-sm text-xs py-1" for="scopeAllCharts">सभी चार्ट्स</label>
                                        <input type="radio" class="btn-check" name="chartContainerScope" id="scopeSelectedCharts" autocomplete="off">
                                        <label class="btn btn-outline-primary btn-sm text-xs py-1" for="scopeSelectedCharts">चयनित चार्ट्स</label>
                                    </div>
                                    <div id="dashboardChartOverview" style="display: none;" class="mt-1">
                                        <label class="form-label text-xs mb-0.5"><i class="bi bi-list-check"></i> चार्ट चुनें:</label>
                                        <div id="chartSelectionList" class="form-control form-control-sm text-xs" style="max-height: 110px; overflow-y: auto;">
                                        </div>
                                    </div>
                                    <button id="applyChartContainerColorBtn" class="btn btn-success btn-sm w-100 mt-2 py-1 text-xs fw-medium"><i class="bi bi-check-circle me-1"></i> कंटेनर रंग लागू करें</button>
                                </div>
                            </div>
                            
                            <!-- Right Column: Custom Code -->
                            <div class="col-12 col-lg-6 d-flex flex-column gap-2">
                                <div class="p-2 rounded-2 border bg-white shadow-2xs h-100 d-flex flex-column" style="border-color: #e2e8f0 !important;">
                                    <h6 class="text-xs fw-semibold mb-0.5"><i class="bi bi-code-slash text-primary me-1"></i> कस्टम रंग और शैली</h6>
                                    <p class="text-muted text-2xs mb-1">यहाँ JSON फॉर्मेट में कोड डालें।</p>
                                    <div class="input-group flex-grow-1 mb-1.5">
                                        <textarea id="customChartContainerCode" class="form-control text-xs" rows="6" placeholder="उदाहरण: { 'style': { 'background': '#ff5733', 'color': '#ffffff' } }"></textarea>
                                        <button class="btn btn-outline-secondary" type="button" id="openChartFormatEditorBtn" data-bs-toggle="modal" data-bs-target="#codeEditorModal"><i class="bi bi-arrows-fullscreen"></i></button>
                                    </div>
                                    <button id="applyCustomChartContainerCodeBtn" class="btn btn-primary btn-sm w-100 py-1 text-xs fw-medium mt-auto"><i class="bi bi-code me-1"></i> कस्टम शैली लागू करें</button>
                                </div>
                            </div>
                        </div>
                    </div>
                `,
  "chartEffectsContent": `    
                    <h5 class="mb-3"><i class="bi bi-magic text-primary"></i> चार्ट इफेक्ट्स (Advanced Chart Effects)</h5>    
                    <div id="chartEffectsSection">    
                        <div class="mb-3">    
                            <label class="form-label fw-bold">प्रभाव का प्रकार (Effect Type)</label>    
                            <div class="btn-group w-100" role="group" aria-label="इफ़ेक्ट्स विकल्प">    
                                <input type="radio" class="btn-check" name="effectsOption" id="customEffectsRadio" autocomplete="off" checked>    
                                <label class="btn btn-outline-primary" for="customEffectsRadio">कस्टम इफ़ेक्ट्स</label>    
                                <input type="radio" class="btn-check" name="effectsOption" id="templateEffectsRadio" autocomplete="off">    
                                <label class="btn btn-outline-primary" for="templateEffectsRadio">रेडीमेड टेम्पलेट्स</label>    
                                <input type="radio" class="btn-check" name="effectsOption" id="customCodeRadio" autocomplete="off">    
                                <label class="btn btn-outline-primary" for="customCodeRadio">कस्टम कोड</label>    
                            </div>    
                        </div>    

                        <!-- 1. CUSTOM EFFECTS SECTION -->
                        <div id="customEffectsSection">    
                            <div class="row">    
                                <!-- Card Style Type -->
                                <div class="col-md-12 mb-3">
                                    <label for="cardStyleType" class="form-label fw-bold small text-muted"><i class="bi bi-palette"></i> कार्ड डिज़ाइन थीम (Card Design Style)</label>
                                    <select id="cardStyleType" class="form-select">
                                        <option value="solid" selected>साधारण / सॉलिड रंग (Solid Background)</option>
                                        <option value="gradient">लिनियर ग्रेडिएंट (Linear Gradient)</option>
                                        <option value="glass">ग्लासमॉर्फिज्म - फ्रॉस्टेड लुक (Glassmorphism)</option>
                                        <option value="neumorphic">न्यूमॉर्फिज्म - सॉफ्ट 3D (Neumorphism)</option>
                                    </select>
                                </div>

                                <!-- Gradient Preset Section -->
                                <div class="col-md-12 mb-3" id="gradientPresetSection" style="display: none;">
                                    <label for="gradientPreset" class="form-label fw-bold small text-muted">ग्रेडिएंट प्रीसेट (Gradient Preset)</label>
                                    <select id="gradientPreset" class="form-select mb-2">
                                        <option value="sunset">Sunset Gold (सूर्यास्त स्वर्ण)</option>
                                        <option value="ocean" selected>Cool Ocean (शांत महासागर)</option>
                                        <option value="royal">Royal Purple (शाही बैंगनी)</option>
                                        <option value="emerald">Emerald Glow (पन्ना चमक)</option>
                                        <option value="darkknight">Dark Knight (डार्क नाइट)</option>
                                        <option value="custom">कस्टम ग्रेडिएंट (Custom CSS Gradient)</option>
                                    </select>
                                    <input type="text" id="customGradientText" class="form-control" value="linear-gradient(135deg, #12c2e9 0%, #c471ed 50%, #f64f59 100%)" placeholder="CSS linear-gradient syntax..." style="display: none;">
                                </div>

                                <!-- Hover Animation Section -->
                                <div class="col-md-12 mb-3">
                                    <label for="cardHoverAnimation" class="form-label fw-bold small text-muted"><i class="bi bi-cursor-fill"></i> कार्ड हॉवर एनिमेशन (Hover Effect)</label>
                                    <select id="cardHoverAnimation" class="form-select">
                                        <option value="none" selected>कोई नहीं (None)</option>
                                        <option value="float">ऊपर की ओर तैरें (Float Up)</option>
                                        <option value="zoom">ज़ूम इन करें (Zoom In)</option>
                                        <option value="glow">नियॉन बॉर्डर ग्लो (Border Glow)</option>
                                    </select>
                                </div>

                                <div class="col-md-6 mb-3">    
                                    <label for="shadowColor" class="form-label small text-muted">शैडो रंग</label>    
                                    <div id="shadowColorPicker"></div>
                                </div>    
                                <div class="col-md-6 mb-3">    
                                    <label for="shadowBlur" class="form-label small text-muted">शैडो ब्लर</label>    
                                    <input type="number" class="form-control" id="shadowBlur" value="10" min="0" max="50">    
                                </div>    
                                <div class="col-md-6 mb-3">    
                                    <label for="shadowOffsetX" class="form-label small text-muted">शैडो ऑफसेट X</label>    
                                    <input type="number" class="form-control" id="shadowOffsetX" value="0" min="-50" max="50">    
                                </div>    
                                <div class="col-md-6 mb-3">    
                                    <label for="shadowOffsetY" class="form-label small text-muted">शैडो ऑफसेट Y</label>    
                                    <input type="number" class="form-control" id="shadowOffsetY" value="5" min="-50" max="50">    
                                </div>

                                <!-- Background and Border pickers for Custom Effects -->
                                <div class="col-md-6 mb-3">    
                                    <label class="form-label small text-muted">बैकग्राउंड रंग</label>    
                                    <div id="backgroundColorPicker"></div>
                                </div>    
                                <div class="col-md-6 mb-3">    
                                    <label class="form-label small text-muted">बॉर्डर रंग</label>    
                                    <div id="chartBorderColorPicker"></div>
                                </div>

                                <!-- Border widths, styles, radii and overlay effects -->
                                <div class="col-md-6 mb-3">    
                                    <label for="borderWidth" class="form-label small text-muted">बॉर्डर चौड़ाई (px)</label>    
                                    <input type="number" class="form-control" id="borderWidth" value="1" min="0" max="20">    
                                </div>
                                <div class="col-md-6 mb-3">    
                                    <label for="borderStyle" class="form-label small text-muted">बॉर्डर स्टाइल</label>    
                                    <select id="borderStyle" class="form-select">
                                        <option value="solid" selected>सॉलिड (Solid)</option>
                                        <option value="dashed">डैश्ड (Dashed)</option>
                                        <option value="dotted">डॉटेड (Dotted)</option>
                                        <option value="double">डबल (Double)</option>
                                        <option value="none">कोई नहीं (None)</option>
                                    </select>
                                </div>
                                <div class="col-md-6 mb-3">    
                                    <label for="borderRadius" class="form-label small text-muted">बॉर्डर गोलाई (Radius)</label>    
                                    <input type="number" class="form-control" id="borderRadius" value="12" min="0" max="50">    
                                </div>
                                <div class="col-md-6 mb-3">    
                                    <label for="extraOverlayEffects" class="form-label small text-muted">अतिरिक्त ओवरले (Overlay)</label>    
                                    <select id="extraOverlayEffects" class="form-select">
                                        <option value="none" selected>कोई नहीं (None)</option>
                                        <option value="pulse-glow">धीमी धड़कन पल्स (Pulse)</option>
                                        <option value="shimmer">चमकता नियॉन (Shimmer)</option>
                                    </select>
                                </div>
                            </div>    
                        </div>    

                        <!-- 2. TEMPLATE EFFECTS SECTION -->
                        <div id="templateEffectsSection" style="display: none;">
                            <label class="form-label fw-bold small text-muted mb-2">रेडीमेड इफ़ेक्ट गैलरी (Template Gallery)</label>
                            <div id="effectsTemplatesGallery" class="d-flex flex-column gap-2" style="max-height: 250px; overflow-y: auto;">
                                <!-- Templates dynamically loaded -->
                            </div>
                        </div>

                        <!-- 3. CUSTOM CODE EFFECTS SECTION -->
                        <div id="customCodeEffectsSection" style="display: none;">
                            <div class="mb-3">
                                <label for="customEffectCode" class="form-label small text-muted fw-bold">कस्टम इफ़ेक्ट कोड (JSON Format)</label>
                                <textarea id="customEffectCode" class="form-control text-monospace" rows="8" placeholder='{
  "shadowColor": "rgba(0, 240, 255, 0.5)",
  "shadowBlur": 20,
  "shadowOffsetX": 0,
  "shadowOffsetY": 0,
  "backgroundColor": "#0a0e17",
  "borderColor": "#ff007f",
  "borderWidth": 2,
  "borderStyle": "solid",
  "borderRadius": 14,
  "cardStyleType": "solid",
  "cardHoverAnimation": "glow"
}'></textarea>
                            </div>
                            <button id="openChartEffectEditorBtn" class="btn btn-sm btn-outline-secondary mb-2"><i class="bi bi-arrows-fullscreen"></i> कोड एडिटर में खोलें</button>
                        </div>

                        <hr class="my-3">

                        <!-- EFFECT SCOPE & ACTION BUTTONS -->
                        <div class="mb-3">
                            <label class="form-label fw-bold small text-muted">प्रभाव का क्षेत्र (Effect Scope)</label>
                            <div class="btn-group w-100" role="group">
                                <input type="radio" class="btn-check" name="effectsScope" id="applyToAllRadio" autocomplete="off" checked>
                                <label class="btn btn-outline-primary btn-sm" for="applyToAllRadio">सभी चार्ट्स पर</label>
                                <input type="radio" class="btn-check" name="effectsScope" id="applyToSelectedRadio" autocomplete="off">
                                <label class="btn btn-outline-primary btn-sm" for="applyToSelectedRadio">चयनित चार्ट्स पर</label>
                            </div>
                        </div>

                        <div id="dashboardChartOverviewEffects" style="display: none;" class="mb-3">
                            <label class="form-label fw-bold small text-muted d-flex justify-content-between">
                                <span>चार्ट चुनें (Select Charts):</span>
                                <button id="refreshChartsListBtn" class="btn btn-link btn-xs p-0 text-decoration-none" style="font-size:0.75rem;"><i class="bi bi-arrow-clockwise"></i> रीफ्रेश</button>
                            </label>
                            <div id="chartSelectionListEffects" class="form-control" style="max-height: 150px; overflow-y: auto;">
                                <!-- populated dynamically -->
                            </div>
                        </div>

                        <div id="effectAlertsContainer"></div>

                        <div class="row g-2">
                            <div class="col-6">
                                <button type="button" id="resetAllEffects" class="btn btn-outline-danger w-100 py-2 btn-sm fw-semibold">
                                    <i class="bi bi-trash"></i> इफ़ेक्ट हटाएँ
                                </button>
                            </div>
                            <div class="col-6">
                                <button type="button" id="applyChartEffects" class="btn btn-primary w-100 py-2 btn-sm fw-bold">
                                    <i class="bi bi-check-circle"></i> इफ़ेक्ट लागू करें
                                </button>
                            </div>
                        </div>
                        
                        <button id="saveCustomEffectBtn" class="btn btn-outline-success btn-sm w-100 mt-2"><i class="bi bi-save"></i> इस इफ़ेक्ट को गैलरी में सेव करें</button>
                    </div>    
                `,
  "textboxContent": `
                    <!-- CLEAN NATIVE HEADER -->
                    <div class="d-flex justify-content-between align-items-center mb-2.5 pb-2 border-bottom">
                        <div class="d-flex align-items-center gap-2">
                            <i class="bi bi-textarea-t text-primary"></i> 
                            <span class="fw-semibold text-dark" style="font-size: 0.875rem;">टेक्स्टबॉक्स संपादक (Textbox Editor)</span>
                        </div>
                        <span class="badge bg-light text-secondary border px-2 py-1" style="font-size: 0.72rem;">
                            <span id="activeTextboxCount">0</span> एक्टिव
                        </span>
                    </div>

                    <!-- PRIMARY ACTION -->
                    <button id="mainActionButton" class="btn btn-primary w-100 py-2 mb-2.5 shadow-2xs d-flex align-items-center justify-content-center gap-1.5" style="font-weight: 500; font-size: 0.8125rem; border-radius: 6px;">
                        <i class="bi bi-plus-lg"></i> नया टेक्स्टबॉक्स बनाएँ
                    </button>

                    <!-- WYSIWYG EDITOR -->
                    <div class="card bg-white mb-2" style="border: 1px solid #e2e8f0; border-radius: 6px;">
                        <div class="card-body p-2.5">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <span class="fw-semibold text-dark" style="font-size: 0.8125rem;">
                                    <i class="bi bi-pencil text-primary me-1"></i> टेक्स्ट सामग्री
                                </span>
                                <button id="dataInsertButton" type="button" class="btn btn-xs btn-outline-primary py-0.5 px-2 d-flex align-items-center" title="Insert Live Data" style="font-size: 0.72rem; border-radius: 4px;">
                                    <i class="bi bi-database me-1"></i> लाइव डेटा
                                </button>
                            </div>
                            <div id="quill-container" style="height: 220px; border-radius: 4px; overflow: hidden; border: 1px solid #cbd5e1; background: #ffffff;"></div>
                        </div>
                    </div>

                    <!-- Hidden helpers for script compatibility -->
                    <div id="textboxPreview" style="display: none;"><div class="ql-editor"></div></div>
                    <input type="color" id="bgColorPicker" value="#ffffff" style="display: none;">
                `,
  "userInfoContent": `
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <h5 class="mb-0 text-primary fw-bold" style="font-family: var(--font-display);"><i class="bi bi-person-badge-fill"></i> यूजर प्रोफाइल</h5>
                        <a href="profile.html" class="btn btn-sm btn-primary fw-bold px-2.5 py-1 d-inline-flex align-items-center gap-1 shadow-sm" style="border-radius: 8px; font-size: 0.75rem;">
                            <i class="bi bi-box-arrow-up-right"></i> 3D प्रोफाइल पेज खोलें
                        </a>
                    </div>
                    
                    <!-- Advanced colorful avatar header card matching Login theme exactly -->
                    <div class="card border-0 mb-3 overflow-hidden shadow" style="border-radius: 16px; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);">
                        <div class="card-body text-white text-center py-4 position-relative">
                            <!-- Circular background glow design -->
                            <div class="position-absolute" style="top: -50px; right: -50px; width: 120px; height: 120px; border-radius: 50%; background: rgba(255,255,255,0.08); pointer-events: none;"></div>
                            
                            <div class="position-relative d-inline-block mb-3">
                                <div id="userAvatar" class="bg-white text-primary rounded-circle d-flex align-items-center justify-content-center fw-bold shadow-lg" style="width: 76px; height: 76px; font-size: 32px; margin: 0 auto; border: 3px solid rgba(255, 255, 255, 0.45); font-family: var(--font-display);">
                                    U
                                </div>
                                <span class="position-absolute bottom-0 end-0 bg-success border border-white rounded-circle p-2 shadow" style="border-width: 2.5px !important;" title="Active Session"></span>
                            </div>
                            <h5 id="profileDisplayName" class="mb-1 fw-bold" style="font-family: var(--font-display); font-size: 1.25rem;">Demo User</h5>
                            <p id="profileUserEmail" class="text-white-50 small mb-3" style="font-size: 0.82rem; word-break: break-all; opacity: 0.85;"></p>
                            <span id="profileUserBadge" class="badge bg-white text-primary fw-bold px-3 py-1.5 shadow-sm" style="border-radius: 20px; font-size: 0.72rem; letter-spacing: 0.3px;"><i class="bi bi-star-fill text-warning me-1"></i> प्रो विश्लेषक (Pro Analyst)</span>
                        </div>
                    </div>

                    <!-- Mini Mock Dashboard embedded in user profile to sync layout visually -->
                    <div class="card border-0 shadow-sm mb-3 text-start" style="border-radius: 14px; background: #ffffff; border: 1px solid #e2e8f0;">
                        <div class="card-body p-3">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <h6 class="m-0 text-slate-800 fw-bold" style="font-size: 0.75rem; font-family: var(--font-display);">My Performance Visual</h6>
                                <span class="badge bg-primary bg-opacity-10 text-primary" style="font-size: 0.58rem; font-weight: 700;">Live Engine</span>
                            </div>
                            
                            <!-- Mini interactive looking graph columns -->
                            <div class="d-flex justify-content-between align-items-end position-relative" style="height: 52px; padding-top: 5px;">
                                <!-- Tiny Tooltip mimicking Login -->
                                <div class="position-absolute bg-dark text-white rounded px-1.5 py-0.5" style="bottom: 34px; right: 2px; font-size: 0.55rem; z-index: 5; box-shadow: 0 4px 6px rgba(0,0,0,0.15);">
                                    Active: <strong style="color: #60a5fa;">$49K</strong>
                                </div>

                                <div class="flex-fill px-0.5"><div style="height: 38px; background: #f1f5f9; border-radius: 2px;" class="position-relative"><div class="bg-primary w-100 position-absolute bottom-0" style="height: 45%; border-radius: 2px;"></div></div></div>
                                <div class="flex-fill px-0.5"><div style="height: 38px; background: #f1f5f9; border-radius: 2px;" class="position-relative"><div class="bg-primary w-100 position-absolute bottom-0" style="height: 60%; border-radius: 2px;"></div></div></div>
                                <div class="flex-fill px-0.5"><div style="height: 38px; background: #f1f5f9; border-radius: 2px;" class="position-relative"><div class="bg-primary w-100 position-absolute bottom-0" style="height: 35%; border-radius: 2px;"></div></div></div>
                                <div class="flex-fill px-0.5"><div style="height: 38px; background: #f1f5f9; border-radius: 2px;" class="position-relative"><div class="bg-primary w-100 position-absolute bottom-0" style="height: 75%; border-radius: 2px;"></div></div></div>
                                <div class="flex-fill px-0.5"><div style="height: 38px; background: #f1f5f9; border-radius: 2px;" class="position-relative"><div class="bg-primary w-100 position-absolute bottom-0" style="height: 50%; border-radius: 2px;"></div></div></div>
                                <div class="flex-fill px-0.5"><div style="height: 38px; background: #cbd5e1; border-radius: 2px;" class="position-relative"><div class="bg-primary w-100 position-absolute bottom-0" style="height: 85%; border-radius: 2px;"></div></div></div>
                            </div>
                        </div>
                    </div>

                    <!-- Unique Account ID & 8-Digit Password Card -->
                    <div class="card border-0 mb-3 shadow-sm" style="border-radius: 12px; border: 1px solid #e2e8f0; background: #ffffff;">
                        <div class="card-body p-3">
                            <h6 class="card-title text-slate-800 fw-bold mb-3 small d-flex align-items-center justify-content-between">
                                <span><i class="bi bi-shield-lock-fill text-primary me-1"></i> सुरक्षा एवं अकाउंट पहचान</span>
                                <span class="badge bg-success bg-opacity-10 text-success fw-bold" style="font-size: 0.65rem;"><i class="bi bi-check-circle-fill me-1"></i> 8-Digit PIN Active</span>
                            </h6>

                            <!-- Unique Account ID display -->
                            <div class="mb-2.5 p-2.5 rounded d-flex align-items-center justify-content-between" style="background: #f8fafc; border: 1px solid #e2e8f0;">
                                <div>
                                    <div class="text-muted" style="font-size: 0.72rem; font-weight: 600;">यूनिक अकाउंट ID:</div>
                                    <div class="fw-bold text-primary font-monospace" id="profileAccountIdDisplay" style="font-size: 0.92rem;">@user_id</div>
                                </div>
                                <button class="btn btn-sm btn-outline-primary py-1 px-2.5" id="copyAccountIdBtn" style="border-radius: 6px; font-size: 0.72rem;" type="button">
                                    <i class="bi bi-clipboard me-1"></i> कॉपी
                                </button>
                            </div>

                            <!-- 8-Digit PIN display & Change Password button -->
                            <div class="p-2.5 rounded d-flex align-items-center justify-content-between" style="background: #f8fafc; border: 1px solid #e2e8f0;">
                                <div>
                                    <div class="text-muted" style="font-size: 0.72rem; font-weight: 600;">8-डिजिट सुरक्षा पासवर्ड:</div>
                                    <div class="fw-bold text-dark font-monospace" style="font-size: 0.9rem; letter-spacing: 2px;">••••••••</div>
                                </div>
                                <button class="btn btn-sm btn-outline-primary py-1 px-2.5 fw-bold" id="openChangePinBtn" style="border-radius: 6px; font-size: 0.72rem;" type="button">
                                    <i class="bi bi-key-fill me-1"></i> बदलें
                                </button>
                            </div>

                            <!-- Inline PIN change form container (hidden by default) -->
                            <div id="inlineChangePinBox" class="mt-3 p-2.5 rounded d-none" style="background: #f1f5f9; border: 1px solid #cbd5e1;">
                                <div class="fw-bold text-slate-700 small mb-2"><i class="bi bi-pencil-square text-primary me-1"></i> 8-डिजिट सुरक्षा पासवर्ड अपडेट करें</div>
                                <div class="mb-2">
                                    <input type="password" id="currPinInput" maxlength="8" class="form-control form-control-sm" placeholder="वर्तमान 8-डिजिट पासवर्ड">
                                </div>
                                <div class="mb-2">
                                    <input type="password" id="newPinInput" maxlength="8" class="form-control form-control-sm" placeholder="नया 8-डिजिट पासवर्ड (8 अंक)">
                                </div>
                                <div class="mb-2">
                                    <input type="password" id="confirmNewPinInput" maxlength="8" class="form-control form-control-sm" placeholder="नया पासवर्ड पुष्टि करें">
                                </div>
                                <div id="changePinFeedback" class="small mb-2 d-none"></div>
                                <div class="d-flex gap-2">
                                    <button id="cancelChangePinBtn" class="btn btn-sm btn-light border flex-fill py-1" style="font-size:0.75rem;" type="button">रद्द करें</button>
                                    <button id="saveNewPinBtn" class="btn btn-sm btn-primary flex-fill py-1 fw-bold" style="font-size:0.75rem;" type="button">सहेजें</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Interactive User Status / Bio with royal blue highlights -->
                    <div class="card border-0 mb-3 p-3 shadow-sm" style="border-radius: 12px; border: 1px solid #e2e8f0; background: #ffffff;">
                        <label class="form-label text-slate-600 small fw-bold mb-1.5"><i class="bi bi-chat-quote-fill text-primary"></i> आपका बायो (Your Bio)</label>
                        <div class="d-flex align-items-center gap-2">
                            <input type="text" id="profileBioInput" class="form-control form-control-sm" style="height: 36px; border-radius: 8px; border-color: #cbd5e1; font-size: 0.85rem;" value="डेटा ही सुंदर भविष्य की कुंजी है! 📊" placeholder="अपना बायो दर्ज करें...">
                            <button id="saveBioBtn" class="btn btn-primary btn-sm d-flex align-items-center justify-content-center" style="height: 36px; width: 36px; border-radius: 8px;"><i class="bi bi-check-lg fs-5"></i></button>
                        </div>
                    </div>

                    <!-- Onboarding Preferences Profile Card -->
                    <div class="card border-0 mb-3 shadow-sm" style="border-radius: 12px; border: 1px solid #e2e8f0; background: #ffffff;">
                        <div class="card-body p-3">
                            <h6 class="card-title text-slate-800 fw-bold mb-2.5 small d-flex align-items-center justify-content-between">
                                <span><i class="bi bi-rocket-takeoff-fill text-primary me-1"></i> ऑनबोर्डिंग प्राथमिकताएँ (Onboarding)</span>
                                <span class="badge bg-primary bg-opacity-10 text-primary fw-bold" style="font-size: 0.65rem;" id="onboardingStatusBadge">Configured</span>
                            </h6>

                            <div class="p-2.5 rounded mb-2" style="background: #f8fafc; border: 1px solid #e2e8f0; font-size: 0.8rem;">
                                <div class="text-muted small fw-semibold" style="font-size: 0.7rem;">भाषा (Language) & भूमिका (Role):</div>
                                <div class="fw-bold text-slate-800 mt-0.5"><span id="profileOnboardingLang">Hindi</span> | <span id="profileOnboardingRoles">BI Analyst</span></div>
                            </div>

                            <div class="p-2.5 rounded mb-2" style="background: #f8fafc; border: 1px solid #e2e8f0; font-size: 0.8rem;">
                                <div class="text-muted small fw-semibold" style="font-size: 0.7rem;">मुख्य लक्ष्य (Primary Goals):</div>
                                <div class="fw-bold text-slate-800 mt-0.5" id="profileOnboardingGoals">Excel Charts & AI Analytics</div>
                            </div>

                            <div class="p-2.5 rounded mb-2" style="background: #f8fafc; border: 1px solid #e2e8f0; font-size: 0.8rem;">
                                <div class="text-muted small fw-semibold" style="font-size: 0.7rem;">टीम आकार (Team) & अपडेट (Frequency):</div>
                                <div class="fw-bold text-slate-800 mt-0.5"><span id="profileOnboardingTeam">Small Team (2-10)</span> • <span id="profileOnboardingFreq">Daily Refresh</span></div>
                            </div>

                            <div class="d-flex justify-content-end mt-2">
                                <a href="login.html?onboarding=true" class="btn btn-sm btn-outline-primary py-1 px-2.5 text-decoration-none fw-bold" style="border-radius: 6px; font-size: 0.72rem;">
                                    <i class="bi bi-pencil-square me-1"></i> प्राथमिकताएँ बदलें
                                </a>
                            </div>
                        </div>
                    </div>

                    <!-- Usage Statistics Dashboard Card -->
                    <div class="card border-0 mb-3 shadow-sm" style="border-radius: 12px; border: 1px solid #e2e8f0; background: #ffffff;">
                        <div class="card-body p-3">
                            <h6 class="card-title text-slate-700 fw-bold mb-3 small" style="font-family: var(--font-display);"><i class="bi bi-activity text-primary"></i> वास्तविक समय के आँकड़े (Real-time Stats)</h6>
                            <div class="row g-2">
                                <div class="col-6">
                                    <div class="p-2 bg-light rounded text-center" style="border: 1px solid #f1f5f9;">
                                        <div id="statTotalCharts" class="fs-5 fw-bold text-primary">0</div>
                                        <div class="text-muted small" style="font-size: 0.72rem;">कुल चार्ट्स</div>
                                    </div>
                                </div>
                                <div class="col-6">
                                    <div class="p-2 bg-light rounded text-center" style="border: 1px solid #f1f5f9;">
                                        <div id="statTotalRows" class="fs-5 fw-bold text-success">0</div>
                                        <div class="text-muted small" style="font-size: 0.72rem;">डेटा पंक्तियाँ</div>
                                    </div>
                                </div>
                                <div class="col-6">
                                    <div class="p-2 bg-light rounded text-center" style="border: 1px solid #f1f5f9;">
                                        <div id="statTotalAIQueries" class="fs-5 fw-bold text-warning">0</div>
                                        <div class="text-muted small" style="font-size: 0.72rem;">AI प्रश्न</div>
                                    </div>
                                </div>
                                <div class="col-6">
                                    <div class="p-2 bg-light rounded text-center" style="border: 1px solid #f1f5f9;">
                                        <div id="statActiveTheme" class="fs-5 fw-bold text-info">लाइट</div>
                                        <div class="text-muted small" style="font-size: 0.72rem;">सक्रिय थीम</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Backup and Restore Feature Cards -->
                    <div class="card border-0 bg-light mb-3" style="border-radius: 10px;">
                        <div class="card-body p-3">
                            <h6 class="card-title text-muted fw-bold mb-2 small"><i class="bi bi-cloud-arrow-down text-info"></i> डैशबोर्ड बैकअप और रीस्टोर</h6>
                            <p class="text-muted small" style="font-size: 0.75rem;">अपना संपूर्ण डैशबोर्ड डेटा निर्यात/आयात करें:</p>
                            <div class="d-flex gap-2">
                                <button id="btnBackupDashboard" class="btn btn-outline-secondary btn-sm flex-fill py-1.5"><i class="bi bi-download"></i> बैकअप लें</button>
                                <button id="btnRestoreDashboard" class="btn btn-outline-secondary btn-sm flex-fill py-1.5" onclick="document.getElementById('restoreFileInput').click();"><i class="bi bi-upload"></i> रीस्टोर करें</button>
                                <input type="file" id="restoreFileInput" class="d-none" accept=".json">
                            </div>
                        </div>
                    </div>

                    <!-- System Action Menu -->
                    <div class="list-group mb-3" style="border-radius: 8px;">
                        <button id="btnResetDashboardAll" class="list-group-item list-group-item-action text-danger fw-bold d-flex align-items-center justify-content-between py-2">
                            <span><i class="bi bi-trash3 me-2"></i> सभी स्थानीय डेटा रीसेट करें</span>
                            <i class="bi bi-chevron-right"></i>
                        </button>
                    </div>

                    <!-- Logout Button Container -->
                    <div class="mt-3 mb-4">
                        <button id="logoutBtn" class="btn btn-danger w-100 py-2.5 fw-bold" style="border-radius: 8px;"><i class="bi bi-box-arrow-right me-2"></i> लॉग आउट (Log Out)</button>
                    </div>
                `,
  "advancedSettingsContent": `
                    <h5 class="mb-3"><i class="bi bi-sliders text-primary"></i> एडवांस्ड चार्ट सेटिंग्स</h5>
                    <div id="advancedChartSettings" class="p-1">
                        <!-- LTTB Smart Downsampling & Custom User Sample Selection -->
                        <div class="card border-0 bg-white p-3 mb-3 shadow-sm" style="border-radius: 12px; border-left: 4px solid #3b82f6;">
                            <div class="d-flex align-items-center justify-content-between mb-2">
                                <h6 class="text-primary mb-0 d-flex align-items-center gap-1.5 font-semibold">
                                    <i class="bi bi-speedometer2 text-blue-600"></i> LTTB डेटा सैंपलिंग व कस्टम सैंपल्स
                                </h6>
                                <div class="form-check form-switch mb-0">
                                    <input class="form-check-input" type="checkbox" id="lttbEnabledToggle" checked title="LTTB चालू/बंद करें">
                                </div>
                            </div>
                            <p class="text-muted small mb-2.5" style="font-size: 0.78rem; line-height: 1.35;">
                                स्मार्ट LTTB अल्गोरिदम से या अपने मनपसंद कस्टम सैंपल्स / रो-इंडेक्स चुनकर चार्ट्स में दिखाएं:
                            </p>

                            <!-- Quick Presets -->
                            <div class="d-flex gap-1 mb-2.5 flex-wrap">
                                <button id="lttbPresetBtn_turbo" class="btn btn-sm btn-outline-secondary flex-fill py-1 px-1.5" style="font-size: 0.72rem;">
                                    ⚡ Turbo (500)
                                </button>
                                <button id="lttbPresetBtn_balanced" class="btn btn-sm btn-primary active flex-fill py-1 px-1.5" style="font-size: 0.72rem;">
                                    ⚖️ Balanced (1.5k)
                                </button>
                                <button id="lttbPresetBtn_high" class="btn btn-sm btn-outline-secondary flex-fill py-1 px-1.5" style="font-size: 0.72rem;">
                                    🎯 High (5k)
                                </button>
                                <button id="lttbPresetBtn_raw" class="btn btn-sm btn-outline-secondary flex-fill py-1 px-1.5" style="font-size: 0.72rem;">
                                    📦 100% Raw
                                </button>
                            </div>

                            <!-- Live Slider -->
                            <div class="mb-3">
                                <div class="d-flex justify-content-between align-items-center mb-1">
                                    <label for="lttbResolutionSlider" class="form-label small fw-bold text-slate-700 mb-0" style="font-size: 0.75rem;">
                                        सैंपल संख्या (Resolution):
                                    </label>
                                    <span id="lttbResolutionDisplay" class="badge bg-primary text-white fw-bold" style="font-size: 0.75rem;">
                                        1,500 points / series
                                    </span>
                                </div>
                                <input type="range" class="form-range" id="lttbResolutionSlider" min="100" max="10000" step="100" value="1500">
                                <div class="d-flex justify-content-between text-muted" style="font-size: 0.68rem;">
                                    <span>100 pts (Super Fast)</span>
                                    <span>2,500 pts</span>
                                    <span>10,000 pts (High Detail)</span>
                                </div>
                            </div>

                            <!-- Custom User Sample Selection Options -->
                            <div class="border-top pt-2.5">
                                <label for="lttbCustomModeSelect" class="form-label small fw-bold text-slate-700 mb-1 d-flex align-items-center gap-1" style="font-size: 0.75rem;">
                                    <i class="bi bi-filter-circle text-primary"></i> कस्टम सैंपल चयन मोड (Custom Sampling Mode):
                                </label>
                                <select class="form-select form-select-sm mb-2" id="lttbCustomModeSelect" style="font-size: 0.78rem;">
                                    <option value="auto-lttb" selected>⚡ स्वचालित LTTB (Auto Smart Resolution)</option>
                                    <option value="custom-indices">🎯 कस्टम रो इंडेक्स / रेंज (उदा: 1-50, 100, 250-300)</option>
                                    <option value="slice-range">📏 रो स्लाइस रेंज (Min Row to Max Row)</option>
                                    <option value="step-interval">⏩ स्टेप इंटरवल (हर Nवां बिंदु - Every Nth)</option>
                                    <option value="value-condition">🔍 सांख्यिकीय आउटलायर्स व थ्रेशोल्ड (Spikes & Outliers)</option>
                                    <option value="top-spikes">🏆 टॉप N उच्चतम / न्यूनतम स्पाइक्स (Top Peaks)</option>
                                </select>

                                <!-- Panel 1: Custom Indices -->
                                <div id="lttbPanel_indices" class="p-2 bg-light rounded-3 border mb-2" style="display: none;">
                                    <label class="form-label small fw-semibold text-slate-600 mb-1" style="font-size: 0.72rem;">मनपसंद रो नंबर्स या रेंज डालें (1-based):</label>
                                    <div class="input-group input-group-sm mb-1.5">
                                        <input type="text" class="form-control" id="lttbCustomIndicesInput" placeholder="उदा: 1-50, 100, 250-300, 500" value="1-100, 250, 500-600">
                                        <button class="btn btn-primary" id="btnApplyCustomIndices" type="button"><i class="bi bi-check-lg"></i> लागू करें</button>
                                    </div>
                                    <div class="text-muted" style="font-size: 0.68rem;">अल्पविराम (comma) या हाइफ़न (-) से अलग करें। केवल वही सैंपल्स दिखेंगे।</div>
                                </div>

                                <!-- Panel 2: Slice Range -->
                                <div id="lttbPanel_slice" class="p-2 bg-light rounded-3 border mb-2" style="display: none;">
                                    <div class="row g-1 mb-1.5">
                                        <div class="col-6">
                                            <label class="form-label small fw-semibold text-slate-600 mb-0" style="font-size: 0.7rem;">प्रारंभ रो (Start):</label>
                                            <input type="number" class="form-control form-control-sm" id="lttbSliceStartInput" value="1" min="1">
                                        </div>
                                        <div class="col-6">
                                            <label class="form-label small fw-semibold text-slate-600 mb-0" style="font-size: 0.7rem;">अंतिम रो (End):</label>
                                            <input type="number" class="form-control form-control-sm" id="lttbSliceEndInput" value="1000" min="1">
                                        </div>
                                    </div>
                                    <button class="btn btn-sm btn-primary w-100 py-1" id="btnApplySliceRange" type="button" style="font-size: 0.75rem;"><i class="bi bi-crop"></i> स्लाइस लागू करें</button>
                                </div>

                                <!-- Panel 3: Step Interval -->
                                <div id="lttbPanel_step" class="p-2 bg-light rounded-3 border mb-2" style="display: none;">
                                    <label class="form-label small fw-semibold text-slate-600 mb-1" style="font-size: 0.72rem;">हर N-वां बिंदु चुनें (Step):</label>
                                    <div class="input-group input-group-sm mb-1">
                                        <span class="input-group-text" style="font-size: 0.72rem;">प्रत्येक</span>
                                        <input type="number" class="form-control" id="lttbStepIntervalInput" value="5" min="2" max="100">
                                        <span class="input-group-text" style="font-size: 0.72rem;">वां सैंपल</span>
                                        <button class="btn btn-primary" id="btnApplyStepInterval" type="button">लागू</button>
                                    </div>
                                </div>

                                <!-- Panel 4: Condition -->
                                <div id="lttbPanel_condition" class="p-2 bg-light rounded-3 border mb-2" style="display: none;">
                                    <div class="row g-1 mb-1.5">
                                        <div class="col-6">
                                            <label class="form-label small fw-semibold text-slate-600 mb-0" style="font-size: 0.7rem;">फ़िल्टर प्रकार:</label>
                                            <select class="form-select form-select-sm" id="lttbConditionTypeSelect" style="font-size: 0.72rem;">
                                                <option value="outliers" selected>🚨 केवल आउटलायर्स (Spikes)</option>
                                                <option value="gt">📈 मान &ge; थ्रेशोल्ड</option>
                                                <option value="lt">📉 मान &le; थ्रेशोल्ड</option>
                                            </select>
                                        </div>
                                        <div class="col-6">
                                            <label class="form-label small fw-semibold text-slate-600 mb-0" style="font-size: 0.7rem;">थ्रेशोल्ड मान:</label>
                                            <input type="number" class="form-control form-control-sm" id="lttbConditionThresholdInput" placeholder="0">
                                        </div>
                                    </div>
                                    <button class="btn btn-sm btn-primary w-100 py-1" id="btnApplyCondition" type="button" style="font-size: 0.75rem;">कंडीशन लागू करें</button>
                                </div>

                                <!-- Panel 5: Top Spikes -->
                                <div id="lttbPanel_spikes" class="p-2 bg-light rounded-3 border mb-2" style="display: none;">
                                    <div class="row g-1 mb-1.5">
                                        <div class="col-6">
                                            <label class="form-label small fw-semibold text-slate-600 mb-0" style="font-size: 0.7rem;">स्पाइक्स की संख्या:</label>
                                            <input type="number" class="form-control form-control-sm" id="lttbTopSpikesCount" value="50" min="5" max="500">
                                        </div>
                                        <div class="col-6">
                                            <label class="form-label small fw-semibold text-slate-600 mb-0" style="font-size: 0.7rem;">क्रम:</label>
                                            <select class="form-select form-select-sm" id="lttbTopSpikesSort" style="font-size: 0.72rem;">
                                                <option value="top-highest" selected>उच्चतम पीक्स (Highest)</option>
                                                <option value="top-lowest">न्यूनतम ड्रॉप्स (Lowest)</option>
                                            </select>
                                        </div>
                                    </div>
                                    <button class="btn btn-sm btn-primary w-100 py-1" id="btnApplyTopSpikes" type="button" style="font-size: 0.75rem;">टॉप स्पाइक्स दिखाएं</button>
                                </div>

                                <!-- Reset Button -->
                                <div class="d-flex justify-content-end mt-1">
                                    <button class="btn btn-xs btn-link text-decoration-none text-muted p-0" id="btnResetToAutoLTTB" type="button" style="font-size: 0.72rem;">
                                        <i class="bi bi-arrow-counterclockwise"></i> डिफ़ॉल्ट LTTB पर रीसेट करें
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- Existing Switches with nice design -->
                        <div class="card border-0 bg-white p-3 mb-3 shadow-sm" style="border-radius: 12px;">
                            <h6 class="text-primary mb-3"><i class="bi bi-display"></i> सामान्य सेटिंग्स (General)</h6>
                            <div class="mb-2.5 form-check form-switch">
                                <input class="form-check-input" type="checkbox" id="gridShowHide" checked>
                                <label class="form-check-label fw-semibold text-secondary" for="gridShowHide" style="font-size: 0.9rem;">ग्रिड दिखाएँ/छिपाएँ</label>
                            </div>
                            <div class="mb-2.5 form-check form-switch">
                                <input class="form-check-input" type="checkbox" id="tooltipOnOff" checked>
                                <label class="form-check-label fw-semibold text-secondary" for="tooltipOnOff" style="font-size: 0.9rem;">टूलटिप चालू/बंद</label>
                            </div>
                            <div class="mb-2.5 form-check form-switch">
                                <input class="form-check-input" type="checkbox" id="zoomEnable">
                                <label class="form-check-label fw-semibold text-secondary" for="zoomEnable" style="font-size: 0.9rem;">ज़ूम सक्षम करें (DataZoom)</label>
                            </div>
                            <div class="mb-2.5 form-check form-switch">
                                <input class="form-check-input" type="checkbox" id="showLabels" checked>
                                <label class="form-check-label fw-semibold text-secondary" for="showLabels" style="font-size: 0.9rem;">डेटा लेबल दिखाएँ</label>
                            </div>
                            <div class="mb-0 form-check form-switch">
                                <input class="form-check-input" type="checkbox" id="showToolbox">
                                <label class="form-check-label fw-semibold text-secondary" for="showToolbox" style="font-size: 0.9rem;">स्मार्ट टूलबॉक्स दिखाएं (Save/View Data)</label>
                            </div>
                        </div>

                        <div class="card border-0 bg-white p-3 mb-3 shadow-sm" style="border-radius: 12px;">
                            <h6 class="text-primary mb-3"><i class="bi bi-palette"></i> शैली और रंग (Style & Color)</h6>
                            
                            <div class="mb-3">
                                <label for="colorPaletteName" class="form-label small fw-bold text-muted">कलर थीम चुनें (Color Palette):</label>
                                <select class="form-select form-select-sm" id="colorPaletteName">
                                    <option value="classic">क्लासिक (Default)</option>
                                    <option value="vibrant">ऊर्जावान (Vibrant)</option>
                                    <option value="pastel">पेस्टल (Soft Pastel)</option>
                                    <option value="neon">चमकदार नियॉन (Glowing Neon)</option>
                                    <option value="sunset">सूर्यास्त (Warm Sunset)</option>
                                    <option value="forest">प्रकृति / वन (Forest Earth)</option>
                                </select>
                            </div>

                            <div class="mb-3">
                                <label for="fontSize" class="form-label small fw-bold text-muted">टेक्स्ट फ़ॉन्ट साइज (Font Size):</label>
                                <select class="form-select form-select-sm" id="fontSize">
                                    <option value="small">छोटा (Small)</option>
                                    <option value="medium" selected>सामान्य (Medium)</option>
                                    <option value="large">बड़ा (Large)</option>
                                </select>
                            </div>

                            <div class="mb-0">
                                <label for="gridStyle" class="form-label small fw-bold text-muted">ग्रिड लाइन स्टाइल (Grid Line Style):</label>
                                <select class="form-select form-select-sm" id="gridStyle">
                                    <option value="solid" selected>सॉलिड रेखा (Solid)</option>
                                    <option value="dashed">टूटी रेखा (Dashed)</option>
                                    <option value="dotted">बिंदु वाली रेखा (Dotted)</option>
                                </select>
                            </div>
                        </div>

                        <div class="card border-0 bg-white p-3 mb-3 shadow-sm" style="border-radius: 12px;">
                            <h6 class="text-primary mb-3"><i class="bi bi-activity"></i> चार्ट विशिष्ट सेटिंग्स (Specifics)</h6>
                            
                            <div class="mb-3">
                                <label for="lineStyle" class="form-label small fw-bold text-muted">लाइन चार्ट वक्र (Line Style):</label>
                                <select class="form-select form-select-sm" id="lineStyle">
                                    <option value="normal" selected>सीधी रेखा (Normal)</option>
                                    <option value="smooth">स्मूद कर्व (Smooth)</option>
                                    <option value="step">स्टेप लाइन (Step)</option>
                                </select>
                            </div>

                            <div class="mb-2.5 form-check form-switch">
                                <input class="form-check-input" type="checkbox" id="areaFill">
                                <label class="form-check-label fw-semibold text-secondary" for="areaFill" style="font-size: 0.9rem;">लाइन चार्ट में रंग भरें (Area Fill)</label>
                            </div>

                            <div class="mb-0 form-check form-switch">
                                <input class="form-check-input" type="checkbox" id="barRounded" checked>
                                <label class="form-check-label fw-semibold text-secondary" for="barRounded" style="font-size: 0.9rem;">बार चार्ट को घुमावदार (Rounded) बनाएं</label>
                            </div>
                        </div>

                        <div class="card border-0 bg-white p-3 mb-3 shadow-sm" style="border-radius: 12px;">
                            <h6 class="text-primary mb-3"><i class="bi bi-graph-up-arrow text-danger me-1"></i> स्मार्ट थ्रेशोल्ड व रेफरेंस लाइन्स (Threshold & Targets)</h6>
                            
                            <!-- Target Line Toggle -->
                            <div class="mb-3 form-check form-switch">
                                <input class="form-check-input" type="checkbox" id="thresholdEnable">
                                <label class="form-check-label fw-semibold text-secondary" for="thresholdEnable" style="font-size: 0.85rem;">टारगेट/लिमिट लाइन दिखाएं (Reference Line)</label>
                            </div>

                            <!-- Target Settings Container -->
                            <div id="threshold-line-controls" class="p-2.5 mb-3 rounded-3 bg-light border">
                                <div class="row g-2 mb-2">
                                    <div class="col-6">
                                        <label for="thresholdValue" class="form-label small fw-bold text-muted" style="font-size: 0.75rem;">टारगेट वैल्यू (Value):</label>
                                        <input type="number" class="form-control form-control-sm" id="thresholdValue" placeholder="उदा: 5000">
                                    </div>
                                    <div class="col-6">
                                        <label for="thresholdLabel" class="form-label small fw-bold text-muted" style="font-size: 0.75rem;">लाइन लेबल (Label):</label>
                                        <input type="text" class="form-control form-control-sm" id="thresholdLabel" value="Target Sales" placeholder="उदा: Target">
                                    </div>
                                </div>

                                <div class="row g-2">
                                    <div class="col-6">
                                        <label for="thresholdColor" class="form-label small fw-bold text-muted" style="font-size: 0.75rem;">लाइन का रंग (Color):</label>
                                        <input type="color" class="form-control form-control-color w-100" id="thresholdColor" value="#ef4444" style="height: 31px; border-radius: 6px; padding: 2px;">
                                    </div>
                                    <div class="col-6">
                                        <label for="thresholdStyle" class="form-label small fw-bold text-muted" style="font-size: 0.75rem;">स्टाइल (Style):</label>
                                        <select class="form-select form-select-sm" id="thresholdStyle">
                                            <option value="dashed" selected>टूटी रेखा (Dashed)</option>
                                            <option value="solid">सॉलिड (Solid)</option>
                                            <option value="dotted">बिंदुदार (Dotted)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <!-- Target Zone Toggle -->
                            <div class="mb-3 form-check form-switch">
                                <input class="form-check-input" type="checkbox" id="thresholdEnableZone">
                                <label class="form-check-label fw-semibold text-secondary" for="thresholdEnableZone" style="font-size: 0.85rem;">टारगेट/डेंजर ज़ोन हाईलाइट (Target Zone Area)</label>
                            </div>

                            <!-- Zone Settings Container -->
                            <div id="threshold-zone-controls" class="p-2.5 rounded-3 bg-light border">
                                <div class="row g-2 mb-2">
                                    <div class="col-6">
                                        <label for="thresholdZoneMin" class="form-label small fw-bold text-muted" style="font-size: 0.75rem;">मिनिमम वैल्यू (Min):</label>
                                        <input type="number" class="form-control form-control-sm" id="thresholdZoneMin" placeholder="उदा: 0">
                                    </div>
                                    <div class="col-6">
                                        <label for="thresholdZoneMax" class="form-label small fw-bold text-muted" style="font-size: 0.75rem;">मैक्सिमम वैल्यू (Max):</label>
                                        <input type="number" class="form-control form-control-sm" id="thresholdZoneMax" placeholder="उदा: 2000">
                                    </div>
                                </div>

                                <div class="row g-2">
                                    <div class="col-6">
                                        <label for="thresholdZoneLabel" class="form-label small fw-bold text-muted" style="font-size: 0.75rem;">ज़ोन नाम (Label):</label>
                                        <input type="text" class="form-control form-control-sm" id="thresholdZoneLabel" value="Danger Zone" placeholder="उदा: Danger Zone">
                                    </div>
                                    <div class="col-6">
                                        <label for="thresholdZoneColor" class="form-label small fw-bold text-muted" style="font-size: 0.75rem;">ज़ोन टाइप (Type):</label>
                                        <select class="form-select form-select-sm" id="thresholdZoneColor">
                                            <option value="rgba(239, 68, 68, 0.18)" selected>लाल डेंजर (Danger)</option>
                                            <option value="rgba(34, 197, 94, 0.18)">हरा सेफ (Success Goal)</option>
                                            <option value="rgba(245, 158, 11, 0.18)">पीला वॉर्निंग (Warning)</option>
                                            <option value="rgba(59, 130, 246, 0.18)">नीला टार्गेट (Info Range)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="card border-0 bg-white p-3 mb-3 shadow-sm" style="border-radius: 12px;">
                            <h6 class="text-primary mb-3"><i class="bi bi-clock-history"></i> उन्नत विन्यास (Advanced)</h6>
                            
                            <div class="mb-3">
                                <label for="animationDuration" class="form-label small fw-bold text-muted">एनीमेशन अवधि (मिलीसेकंड): <span id="animationDurationValue" class="badge bg-secondary">1000</span></label>
                                <input type="range" class="form-range" id="animationDuration" min="0" max="3000" value="1000" step="100">
                            </div>
                            
                            <div class="mb-3">
                                <label for="axisFormat" class="form-label small fw-bold text-muted">एक्सिस फॉर्मेट:</label>
                                <select class="form-select form-select-sm" id="axisFormat">
                                    <option value="none">कोई नहीं</option>
                                    <option value="compact">कॉम्पैक्ट (जैसे 1K, 1M)</option>
                                    <option value="currency">करेंसी (जैसे ₹1,000)</option>
                                    <option value="percent">प्रतिशत (जैसे 10%)</option>
                                </select>
                            </div>
                            
                            <div class="mb-0">
                                <label for="legendPosition" class="form-label small fw-bold text-muted">लेजेंड पोजीशन:</label>
                                <select class="form-select form-select-sm" id="legendPosition">
                                    <option value="bottom">नीचे (Bottom)</option>
                                    <option value="top">ऊपर (Top)</option>
                                    <option value="left">बाएं (Left)</option>
                                    <option value="right">दाएं (Right)</option>
                                    <option value="none">कोई नहीं (None)</option>
                                </select>
                            </div>
                        </div>

                        <div class="mb-3">
                            <button id="applyChartSettings" class="btn btn-primary w-100 py-2.5 fw-bold shadow-sm" style="border-radius: 8px;"><i class="bi bi-check-circle-fill me-1"></i> सेटिंग्स लागू करें</button>
                        </div>
                    </div>
                `,
  "dataContent": `
                    <h5 class="mb-3"><i class="bi bi-database-fill-gear text-primary"></i> डेटा अपलोड और लाइव सोर्सेज</h5>
                    
                    <!-- Inner navigation pills -->
                    <ul class="nav nav-pills nav-fill mb-3" id="dataTab" role="tablist" style="font-size: 0.8rem;">
                        <li class="nav-item" role="presentation">
                            <button class="nav-link active py-1.5" id="file-tab" data-bs-toggle="pill" data-bs-target="#file-upload-panel" type="button" role="tab" aria-controls="file-upload-panel" aria-selected="true">
                                <i class="bi bi-file-earmark-arrow-up"></i> फ़ाइल
                            </button>
                        </li>
                        <li class="nav-item" role="presentation">
                            <button class="nav-link py-1.5" id="api-tab" data-bs-toggle="pill" data-bs-target="#api-source-panel" type="button" role="tab" aria-controls="api-source-panel" aria-selected="false">
                                <i class="bi bi-hdd-network"></i> API
                            </button>
                        </li>
                        <li class="nav-item" role="presentation">
                            <button class="nav-link py-1.5" id="mock-tab" data-bs-toggle="pill" data-bs-target="#mock-generator-panel" type="button" role="tab" aria-controls="mock-generator-panel" aria-selected="false">
                                <i class="bi bi-magic"></i> मॉक
                            </button>
                        </li>
                        <li class="nav-item" role="presentation">
                            <button class="nav-link py-1.5" id="clean-tab" data-bs-toggle="pill" data-bs-target="#clean-transform-panel" type="button" role="tab" aria-controls="clean-transform-panel" aria-selected="false">
                                <i class="bi bi-scissors"></i> क्लीन
                            </button>
                        </li>
                        <li class="nav-item" role="presentation">
                            <button class="nav-link py-1.5" id="profile-tab" data-bs-toggle="pill" data-bs-target="#data-profile-panel" type="button" role="tab" aria-controls="data-profile-panel" aria-selected="false">
                                <i class="bi bi-bar-chart-steps"></i> प्रोफाइल
                            </button>
                        </li>
                    </ul>

                    <div class="tab-content" id="dataTabContent">
                        <!-- Panel A: File Upload -->
                        <div class="tab-pane fade show active" id="file-upload-panel" role="tabpanel" aria-labelledby="file-tab">
                            <div id="file-drag-zone" class="border border-2 border-dashed rounded-3 p-4 text-center mb-3 bg-white hover-shadow" style="cursor: pointer; transition: all 0.2s ease;">
                                <i class="bi bi-cloud-arrow-up text-primary fs-1 mb-2 d-block"></i>
                                <p class="mb-1 fw-bold">फ़ाइल ड्रैग करें या क्लिक करें</p>
                                <p class="text-muted small mb-0" style="font-size: 0.75rem;">CSV, XLS, XLSX, JSON फ़ाइलों का समर्थन है</p>
                                <input type="file" id="fileInput" class="d-none" accept=".csv, .xlsx, .xls, .json">
                            </div>

                            <div class="card border-0 bg-white p-3 mb-3 shadow-sm" style="border-radius: 12px; border: 1px solid #e2e8f0;">
                                <h6 class="text-primary mb-2 small fw-bold"><i class="bi bi-google"></i> Google Sheets लाइव सिंक</h6>
                                <p class="text-muted small mb-2" style="font-size: 0.75rem;">सार्वजनिक (Anyone with link can view) Google Sheet का लिंक दर्ज करें:</p>
                                <div class="input-group input-group-sm mb-2">
                                    <input type="url" id="googleSheetUrlInput" class="form-control" placeholder="https://docs.google.com/spreadsheets/d/.../edit">
                                    <button id="syncGoogleSheetBtn" class="btn btn-primary" type="button"><i class="bi bi-arrow-repeat"></i> सिंक करें</button>
                                </div>
                                <div class="text-muted small" style="font-size: 0.7rem;"><i class="bi bi-info-circle"></i> नोट: सुनिश्चित करें कि शीट "Anyone with link can view" पर सेट हो।</div>
                            </div>
                        </div>

                        <!-- Panel B: Live API Source -->
                        <div class="tab-pane fade" id="api-source-panel" role="tabpanel" aria-labelledby="api-tab">
                            <div class="mb-3">
                                <label class="form-label text-muted small"><i class="bi bi-box-arrow-in-right"></i> रेडीमेड लाइव डेटा सोर्स:</label>
                                <select id="presetApiSelect" class="form-select">
                                    <option value="">-- अपनी पसंद का सोर्स चुनें (वैकल्पिक) --</option>
                                    <option value="crypto-bitcoin">₿ Major Cryptos Live Prices (Binance Feed)</option>
                                    <option value="crypto-market">📊 Top 15 Cryptocurrencies Market Rate (CoinGecko Feed)</option>
                                    <option value="weather-feed">☀️ Live Weather Tracker (Open-Meteo Hourly Forecast)</option>
                                    <option value="random-user-sales">💼 Sales & Products Inventory (DummyJSON Feed)</option>
                                </select>
                            </div>
                            
                            <div class="mb-3">
                                <label for="apiInput" class="form-label"><i class="bi bi-link-45deg"></i> API URL:</label>
                                <input type="url" class="form-control" id="apiInput" placeholder="https://api.example.com/data">
                            </div>

                            <div class="mb-3">
                                <label class="form-label"><i class="bi bi-arrow-right-circle"></i> HTTP Method & Cache:</label>
                                <div class="row g-2">
                                    <div class="col-6">
                                        <select id="apiMethod" class="form-select">
                                            <option value="GET">GET</option>
                                            <option value="POST">POST</option>
                                        </select>
                                    </div>
                                    <div class="col-6 d-flex align-items-center justify-content-center">
                                        <div class="form-check form-switch mb-0">
                                            <input class="form-check-input" type="checkbox" id="cacheBuster" checked>
                                            <label class="form-check-label small" for="cacheBuster" style="font-size:0.75rem;">नो-कैश</label>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="mb-3">
                                <label class="form-label"><i class="bi bi-code-square"></i> कस्टम हेडर (Headers JSON):</label>
                                <textarea id="apiHeaders" class="form-control font-mono" style="height: 60px; font-size: 0.75rem;" placeholder='{"Content-Type": "application/json"}'></textarea>
                            </div>

                            <div class="mb-3">
                                <label class="form-label"><i class="bi bi-signpost-split"></i> JSON डेटा पाथ (Parsing Path):</label>
                                <input type="text" id="apiDataPath" class="form-control" placeholder="उदा: data.results, list, results (ऑटो-डिटेक्ट के लिए खाली छोड़ें)">
                            </div>

                            <div class="mb-3">
                                <label for="updateInterval" class="form-label"><i class="bi bi-stopwatch"></i> ऑटो-अपडेट अंतराल (सेकंड):</label>
                                <input type="number" class="form-control" id="updateInterval" value="60">
                            </div>

                            <div class="mb-3">
                                <div class="form-check form-switch">
                                    <input class="form-check-input" type="checkbox" id="apiPerformanceMode" checked>
                                    <label class="form-check-label small fw-bold text-success" for="apiPerformanceMode"><i class="bi bi-cpu"></i> हाई-परफॉर्मेंस मोड (बिना लैग)</label>
                                </div>
                                <div class="text-muted" style="font-size: 0.65rem; margin-top: 2px;">सक्रिय रहने पर लाइव अपडेट के दौरान भारी टेबल रेंडरिंग को रोका जाता है ताकि ब्राउज़र लैग न करे।</div>
                            </div>

                            <!-- Live Connection Status Display -->
                            <div class="mb-3 p-2 border rounded bg-light" id="liveStatusContainer" style="display: none;">
                                <div class="d-flex align-items-center justify-content-between mb-1">
                                    <span class="small fw-bold text-secondary"><i class="bi bi-broadcast text-danger"></i> लाइव फीड:</span>
                                    <span class="badge bg-success" id="liveStatusBadge"><span class="spinner-grow spinner-grow-sm me-1" style="width: 8px; height: 8px;" role="status"></span>सक्रिय (Active)</span>
                                </div>
                                <div class="small" style="font-size: 0.7rem;">
                                    <strong>अंतिम सिंक:</strong> <span id="liveStatusLastSync">-</span><br>
                                    <strong>अपडेटेड रिकॉर्ड्स:</strong> <span id="liveStatusRecords">-</span>
                                </div>
                            </div>

                            <div class="d-flex justify-content-between gap-2">
                                <button id="fetchDataFromApiBtn" class="btn btn-primary flex-fill py-2"><i class="bi bi-play-circle"></i> लाइव शुरू करें</button>
                                <button id="stopLiveUpdateBtn" class="btn btn-danger flex-fill py-2"><i class="bi bi-stop-circle"></i> रोकें</button>
                            </div>
                        </div>

                        <!-- Panel C: Mock Generator -->
                        <div class="tab-pane fade" id="mock-generator-panel" role="tabpanel" aria-labelledby="mock-tab">
                            <div class="mb-3">
                                <label class="form-label"><i class="bi bi-card-list"></i> मॉक डेटा थीम चुनें:</label>
                                <select id="mockThemeSelect" class="form-select">
                                    <option value="sales">E-Commerce Sales (शहर, बिक्री, दिनांक)</option>
                                    <option value="finance">Finance Expenses (विभाग, बजट, खर्च)</option>
                                    <option value="hr">HR Performance (कर्मचारी, रेटिंग, विभाग)</option>
                                    <option value="iot">IoT Sensors (सेंसर, तापमान, समय)</option>
                                    <option value="stock">Cryptocurrency Daily Rates (कॉइन, मूल्य, वॉल्यूम)</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label class="form-label"><i class="bi bi-hash"></i> पंक्तियों की संख्या (Row Count):</label>
                                <input type="number" id="mockRowCount" class="form-control text-center" value="15" min="5" max="200">
                            </div>
                            <div class="mb-3">
                                <div class="form-check form-switch">
                                    <input class="form-check-input" type="checkbox" id="mockAutoRefresh">
                                    <label class="form-check-label small" for="mockAutoRefresh">हर 10 सेकंड में ऑटो-अपडेट करें (लाइव सिमुलेशन)</label>
                                </div>
                            </div>
                            <button id="generateMockDataBtn" class="btn btn-success w-100 py-2">
                                <i class="bi bi-gear-wide-connected"></i> मॉक डेटा जनरेट करें
                            </button>
                        </div>

                        <!-- Panel D: Power Query / Clean & Transform -->
                        <div class="tab-pane fade" id="clean-transform-panel" role="tabpanel" aria-labelledby="clean-tab">
                            <div class="accordion accordion-flush" id="cleanAccordion">
                                
                                <!-- Rename Column Section -->
                                <div class="accordion-item bg-transparent">
                                    <h2 class="accordion-header">
                                        <button class="accordion-button collapsed px-1 py-2.5 bg-transparent" type="button" data-bs-toggle="collapse" data-bs-target="#collapseRename">
                                            <span class="small fw-bold"><i class="bi bi-pencil-square text-primary me-1"></i> कॉलम का नाम बदलें (Rename Column)</span>
                                        </button>
                                    </h2>
                                    <div id="collapseRename" class="accordion-collapse collapse show" data-bs-parent="#cleanAccordion">
                                        <div class="accordion-body px-1 py-2">
                                            <div class="mb-2">
                                                <label class="form-label small text-muted">कॉलम चुनें:</label>
                                                <select id="cleanRenameColSelect" class="form-select form-select-sm"></select>
                                            </div>
                                            <div class="mb-2">
                                                <label class="form-label small text-muted">नया नाम दर्ज करें:</label>
                                                <input type="text" id="cleanNewColName" class="form-control form-control-sm" placeholder="उदा: City_Name">
                                            </div>
                                            <button id="cleanRenameBtn" class="btn btn-sm btn-primary w-100"><i class="bi bi-check-circle"></i> नाम बदलें</button>
                                        </div>
                                    </div>
                                </div>

                                <!-- Remove Column Section -->
                                <div class="accordion-item bg-transparent">
                                    <h2 class="accordion-header">
                                        <button class="accordion-button collapsed px-1 py-2.5 bg-transparent" type="button" data-bs-toggle="collapse" data-bs-target="#collapseRemove">
                                            <span class="small fw-bold"><i class="bi bi-trash-fill text-danger me-1"></i> कॉलम हटाएं (Remove Column)</span>
                                        </button>
                                    </h2>
                                    <div id="collapseRemove" class="accordion-collapse collapse" data-bs-parent="#cleanAccordion">
                                        <div class="accordion-body px-1 py-2">
                                            <div class="mb-2">
                                                <label class="form-label small text-muted">हटाने के लिए कॉलम चुनें:</label>
                                                <select id="cleanRemoveColSelect" class="form-select form-select-sm"></select>
                                            </div>
                                            <button id="cleanRemoveBtn" class="btn btn-sm btn-danger w-100"><i class="bi bi-trash"></i> कॉलम हटाएं</button>
                                        </div>
                                    </div>
                                </div>

                                <!-- Missing Values Section -->
                                <div class="accordion-item bg-transparent">
                                    <h2 class="accordion-header">
                                        <button class="accordion-button collapsed px-1 py-2.5 bg-transparent" type="button" data-bs-toggle="collapse" data-bs-target="#collapseMissing">
                                            <span class="small fw-bold"><i class="bi bi-magic text-warning me-1"></i> मिसिंग वैल्यूज सुधारें (Impute/Clean)</span>
                                        </button>
                                    </h2>
                                    <div id="collapseMissing" class="accordion-collapse collapse" data-bs-parent="#cleanAccordion">
                                        <div class="accordion-body px-1 py-2">
                                            <div class="mb-2">
                                                <label class="form-label small text-muted">कॉलम चुनें:</label>
                                                <select id="cleanMissingColSelect" class="form-select form-select-sm">
                                                    <option value="all">सभी कॉलम (All Columns)</option>
                                                </select>
                                            </div>
                                            <div class="mb-2">
                                                <label class="form-label small text-muted">क्या करना चाहते हैं?</label>
                                                <select id="cleanMissingStrategySelect" class="form-select form-select-sm">
                                                    <option value="drop">रिक्त रो/पंक्ति हटा दें (Drop Rows)</option>
                                                    <option value="zero">0 से भरें (Fill with 0)</option>
                                                    <option value="custom">कस्टम मान भरें (Fill with Custom Value)</option>
                                                    <option value="mean">औसत से भरें (Mean - Numeric Only)</option>
                                                    <option value="median">मध्यिका से भरें (Median - Numeric Only)</option>
                                                </select>
                                            </div>
                                            <div class="mb-2" id="cleanCustomValWrapper" style="display:none;">
                                                <label class="form-label small text-muted">कस्टम वैल्यू दर्ज करें:</label>
                                                <input type="text" id="cleanMissingCustomVal" class="form-control form-control-sm" placeholder="उदा: N/A या Unknown">
                                            </div>
                                            <button id="cleanMissingBtn" class="btn btn-sm btn-warning w-100"><i class="bi bi-stars"></i> मिसिंग डेटा ठीक करें</button>
                                        </div>
                                    </div>
                                </div>

                                <!-- Permanent Filter Section -->
                                <div class="accordion-item bg-transparent">
                                    <h2 class="accordion-header">
                                        <button class="accordion-button collapsed px-1 py-2.5 bg-transparent" type="button" data-bs-toggle="collapse" data-bs-target="#collapseFilter">
                                            <span class="small fw-bold"><i class="bi bi-funnel-fill text-success me-1"></i> कठोर रो फ़िल्टर (Row Reducer)</span>
                                        </button>
                                    </h2>
                                    <div id="collapseFilter" class="accordion-collapse collapse" data-bs-parent="#cleanAccordion">
                                        <div class="accordion-body px-1 py-2">
                                            <div class="mb-2">
                                                <label class="form-label small text-muted">फ़िल्टर कॉलम:</label>
                                                <select id="cleanFilterColSelect" class="form-select form-select-sm"></select>
                                            </div>
                                            <div class="mb-2">
                                                <label class="form-label small text-muted">शर्त (Condition):</label>
                                                <select id="cleanFilterOperatorSelect" class="form-select form-select-sm">
                                                    <option value="eq">बराबर (Equals)</option>
                                                    <option value="ne">बराबर नहीं (Not Equal)</option>
                                                    <option value="gt">से अधिक (Greater Than &gt;)</option>
                                                    <option value="lt">से कम (Less Than &lt;)</option>
                                                    <option value="contains">शामिल है (Contains)</option>
                                                    <option value="not_contains">शामिल नहीं है (Doesn't Contain)</option>
                                                </select>
                                            </div>
                                            <div class="mb-2">
                                                <label class="form-label small text-muted">तुलना मूल्य (Value):</label>
                                                <input type="text" id="cleanFilterVal" class="form-control form-control-sm" placeholder="उदा: Mumbai या 5000">
                                            </div>
                                            <button id="cleanFilterBtn" class="btn btn-sm btn-success w-100"><i class="bi bi-filter-square"></i> स्थायी रूप से हटाएँ/रखें</button>
                                        </div>
                                    </div>
                                </div>

                                <!-- Change Data Type Section -->
                                <div class="accordion-item bg-transparent">
                                    <h2 class="accordion-header">
                                        <button class="accordion-button collapsed px-1 py-2.5 bg-transparent" type="button" data-bs-toggle="collapse" data-bs-target="#collapseDataType">
                                            <span class="small fw-bold"><i class="bi bi-hash text-info me-1"></i> डेटा टाइप बदलें (Change Data Type)</span>
                                        </button>
                                    </h2>
                                    <div id="collapseDataType" class="accordion-collapse collapse" data-bs-parent="#cleanAccordion">
                                        <div class="accordion-body px-1 py-2">
                                            <div class="mb-2">
                                                <label class="form-label small text-muted">कॉलम चुनें:</label>
                                                <select id="cleanTypeColSelect" class="form-select form-select-sm"></select>
                                            </div>
                                            <div class="mb-2">
                                                <label class="form-label small text-muted">लक्ष्य टाइप (Target Type):</label>
                                                <select id="cleanTypeTargetSelect" class="form-select form-select-sm">
                                                    <option value="number">संख्या (Number)</option>
                                                    <option value="text">टेक्स्ट (Text)</option>
                                                    <option value="date">दिनांक (Date)</option>
                                                </select>
                                            </div>
                                            <button id="cleanTypeBtn" class="btn btn-sm btn-info text-white w-100"><i class="bi bi-arrow-left-right"></i> टाइप बदलें</button>
                                        </div>
                                    </div>
                                </div>

                                <!-- Custom Formula Section -->
                                <div class="accordion-item bg-transparent">
                                    <h2 class="accordion-header">
                                        <button class="accordion-button collapsed px-1 py-2.5 bg-transparent" type="button" data-bs-toggle="collapse" data-bs-target="#collapseFormula">
                                            <span class="small fw-bold"><i class="bi bi-calculator-fill text-dark me-1"></i> विज़ुअल फ़ॉर्मूला (Apply Formula)</span>
                                        </button>
                                    </h2>
                                    <div id="collapseFormula" class="accordion-collapse collapse" data-bs-parent="#cleanAccordion">
                                        <div class="accordion-body px-1 py-2 text-start">
                                            <div class="mb-2">
                                                <label class="form-label small text-muted">परिणामी कॉलम (Target Column):</label>
                                                <input type="text" id="formulaTargetCol" class="form-control form-control-sm" placeholder="उदा: Total_Amount">
                                                <div class="form-text text-muted" style="font-size: 10px;">नया कॉलम बनाने के लिए नया नाम लिखें या पुराने को बदलने के लिए उसका नाम लिखें।</div>
                                            </div>
                                            <div class="mb-2">
                                                <label class="form-label small text-muted">कॉलम ए (Column A):</label>
                                                <select id="formulaColA" class="form-select form-select-sm"></select>
                                            </div>
                                            <div class="mb-2">
                                                <label class="form-label small text-muted">ऑपरेटर (Operator):</label>
                                                <select id="formulaOp" class="form-select form-select-sm">
                                                    <option value="+">जोड़ें (Add +)</option>
                                                    <option value="-">घटाएं (Subtract -)</option>
                                                    <option value="*">गुणा करें (Multiply *)</option>
                                                    <option value="/">भाग दें (Divide /)</option>
                                                    <option value="concat">टेक्स्ट जोड़ें (Concat Text)</option>
                                                </select>
                                            </div>
                                            <div class="mb-3">
                                                <label class="form-label small text-muted">दूसरा इनपुट (Input B):</label>
                                                <div class="mb-1">
                                                    <div class="form-check form-check-inline">
                                                        <input class="form-check-input" type="radio" name="formulaBType" id="formulaBTypeCol" value="col" checked>
                                                        <label class="form-check-label small" for="formulaBTypeCol">कॉलम</label>
                                                    </div>
                                                    <div class="form-check form-check-inline">
                                                        <input class="form-check-input" type="radio" name="formulaBType" id="formulaBTypeVal" value="val">
                                                        <label class="form-check-label small" for="formulaBTypeVal">स्थिर मान</label>
                                                    </div>
                                                </div>
                                                <select id="formulaColB" class="form-select form-select-sm mb-1"></select>
                                                <input type="text" id="formulaValB" class="form-control form-control-sm d-none" placeholder="उदा: 10 या USD">
                                            </div>
                                            <button id="formulaApplyBtn" class="btn btn-sm btn-dark w-100"><i class="bi bi-play-fill"></i> फ़ॉर्मूला लागू करें</button>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>

                        <!-- Panel E: Data Profile / Quality Check -->
                        <div class="tab-pane fade" id="data-profile-panel" role="tabpanel" aria-labelledby="profile-tab">
                            <h6 class="small text-muted mb-2"><i class="bi bi-info-circle-fill text-info"></i> डेटा सांख्यिकी और स्वास्थ्य प्रोफाइल</h6>
                            
                            <div class="row g-2 mb-3">
                                <div class="col-6">
                                    <div class="p-2 border rounded text-center bg-light">
                                        <span class="d-block text-muted small" style="font-size:0.7rem;">कुल रो (Rows)</span>
                                        <strong id="profileTotalRows" class="fs-5">-</strong>
                                    </div>
                                </div>
                                <div class="col-6">
                                    <div class="p-2 border rounded text-center bg-light">
                                        <span class="d-block text-muted small" style="font-size:0.7rem;">कॉलम (Cols)</span>
                                        <strong id="profileTotalCols" class="fs-5">-</strong>
                                    </div>
                                </div>
                            </div>

                            <div class="mb-3">
                                <label class="form-label small text-muted fw-bold"><i class="bi bi-heart-pulse-fill text-danger"></i> कॉलम स्वास्थ्य (Quality):</label>
                                <div class="table-responsive border rounded" style="max-height: 250px; overflow-y: auto;">
                                    <table class="table table-sm table-striped mb-0 text-center" style="font-size: 0.72rem;">
                                        <thead class="table-dark sticky-top">
                                            <tr>
                                                <th class="text-start">कॉलम</th>
                                                <th>प्रकार</th>
                                                <th>रिक्त (%)</th>
                                                <th>यूनिक</th>
                                            </tr>
                                        </thead>
                                        <tbody id="profileStatsBody">
                                            <tr>
                                                <td colspan="4" class="text-muted text-center py-3">कोई डेटा लोड नहीं है</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div class="mb-3">
                                <label class="form-label small text-muted fw-bold"><i class="bi bi-table text-primary"></i> छोटा डेटा प्रिव्यू (First 3 Rows):</label>
                                <div class="table-responsive border rounded" style="max-height: 180px; overflow-y: auto;">
                                    <table class="table table-sm table-bordered mb-0" style="font-size: 0.68rem; min-width: 300px;">
                                        <thead class="table-light sticky-top" id="profilePreviewHead">
                                        </thead>
                                        <tbody id="profilePreviewBody">
                                            <tr>
                                                <td class="text-muted text-center py-2">कोई डेटा लोड नहीं है</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <button id="profileExportBtn" class="btn btn-sm btn-outline-primary w-100 mb-2">
                                <i class="bi bi-download"></i> क्लीन डेटा डाउनलोड करें (CSV)
                            </button>
                        </div>
                    </div>
                `,
  "dataInsertSidebar": `
        <div class="offcanvas-header bg-primary text-white">
            <h5 class="offcanvas-title" id="dataInsertSidebarLabel"><i class="bi bi-database-fill me-2"></i> Live Data Insertion</h5>
            <button type="button" class="btn-close btn-close-white" id="closeDataSidebarBtn" aria-label="Close"></button>
        </div>
        <div class="offcanvas-body d-flex flex-column">
            <p class="text-muted small">टेक्स्टबॉक्स में डालने के लिए विशिष्ट **डेटा पंक्तियों (Data Rows)** का चयन करें। (फ़िल्टर्ड डेटा की पहली 50 पंक्तियाँ दिखा रहा है)</p>
            
            <div id="dataListContainer" class="flex-grow-1 overflow-auto p-2 border rounded mb-3 bg-light" style="max-height: 80%;">
                <p class="text-center text-muted p-5">डेटा लोड हो रहा है...</p>
            </div>

            <button id="insertSelectedDataBtn" class="btn btn-success w-100 mt-auto">
                <i class="bi bi-box-arrow-in-down me-2"></i> चयनित डेटा पंक्तियाँ इन्सर्ट करें
            </button>
        </div>
    `,
  "advancedAnalyticsModal": `
        <div class="modal-dialog modal-lg modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header bg-primary text-white">
                    <h5 class="modal-title" id="advancedAnalyticsModalLabel"><i class="bi bi-cpu-fill me-2"></i> एडवांस्ड एनालिटिक्स रिपोर्ट</h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body" id="advancedAnalyticsModalBody">
                    <!-- Dynamic content will go here -->
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">बंद करें</button>
                    <button type="button" class="btn btn-primary" onclick="window.print();"><i class="bi bi-printer me-1"></i> प्रिंट करें</button>
                </div>
            </div>
        </div>
    `,
  "codeEditorModal": `
        <div class="modal-dialog modal-fullscreen">
            <div class="modal-content bg-dark border-0">
                <!-- Header -->
                <div class="modal-header bg-black text-white border-bottom border-secondary py-3">
                    <div class="d-flex align-items-center">
                        <div class="bg-primary bg-opacity-25 text-primary border border-primary rounded p-2 me-3 d-flex align-items-center justify-content-center" style="width: 36px; height: 36px;">
                            <i class="bi bi-braces-asterisk fs-5"></i>
                        </div>
                        <div>
                            <h5 class="modal-title fw-bold mb-0" id="codeEditorModalLabel">Professional JSON Workspace</h5>
                            <span class="text-muted small" style="font-size: 0.7rem;">Advanced live-updating JSON style compiler & preview deck</span>
                        </div>
                    </div>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>

                <!-- Main Grid Layout -->
                <div class="modal-body bg-dark text-white p-0">
                    <div class="container-fluid h-100 p-0">
                        <div class="row g-0 h-100">
                            <!-- Left: Code Editor Pane -->
                            <div class="col-12 col-lg-7 d-flex flex-column h-100 border-end border-secondary" style="background: #1e1e1e;">
                                <!-- Top Toolbar -->
                                <div class="p-3 bg-black border-bottom border-secondary d-flex flex-wrap align-items-center justify-content-between gap-2">
                                    <div class="d-flex align-items-center gap-2 flex-grow-1 flex-md-grow-0">
                                        <span class="text-muted small fw-bold me-1"><i class="bi bi-magic"></i> Presets:</span>
                                        <select id="selPresetsJson" class="form-select form-select-sm bg-dark text-light border-secondary" style="min-width: 180px; font-size: 0.75rem;">
                                            <option value="">-- Choose a Preset Design --</option>
                                        </select>
                                    </div>
                                    <div class="d-flex align-items-center gap-2">
                                        <button class="btn btn-sm btn-outline-info" id="btnBeautifyJson" title="Format / Beautify code">
                                            <i class="bi bi-file-earmark-code me-1"></i> Format
                                        </button>
                                        <button class="btn btn-sm btn-outline-secondary" id="btnMinifyJson" title="Minify / Compress JSON">
                                            <i class="bi bi-node-minus me-1"></i> Minify
                                        </button>
                                        <button class="btn btn-sm btn-outline-success" id="btnValidateJson" title="Validate JSON syntax">
                                            <i class="bi bi-check2-circle me-1"></i> Validate
                                        </button>
                                    </div>
                                </div>

                                <!-- Actual Editor Container -->
                                <div class="flex-grow-1 position-relative" style="overflow: hidden;">
                                    <div id="editorContainer" style="height: 100%; width: 100%;"></div>
                                </div>

                                <!-- Diagnostic Bottom Status Bar -->
                                <div class="p-2 border-top border-secondary bg-black d-flex align-items-center justify-content-between text-muted" style="font-size: 0.75rem;">
                                    <div class="d-flex align-items-center gap-2">
                                        <span class="badge" id="jsonStatusBadge">Status</span>
                                        <span id="editorStatusLog">Ready. Edit your JSON configuration.</span>
                                    </div>
                                    <div class="d-flex align-items-center gap-3">
                                        <span>Lines: <strong id="editorTotalLines">0</strong></span>
                                        <span>Size: <strong id="editorTextSize">0 B</strong></span>
                                    </div>
                                </div>
                            </div>

                            <!-- Right: Live Preview Panel -->
                            <div class="col-12 col-lg-5 d-flex flex-column h-100 bg-black" style="background: radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px); background-size: 24px 24px;">
                                <!-- Live Toggle Header -->
                                <div class="p-3 bg-black bg-opacity-50 border-bottom border-secondary d-flex align-items-center justify-content-between">
                                    <div class="d-flex align-items-center">
                                        <span class="spinner-grow spinner-grow-sm text-success me-2" role="status"></span>
                                        <h6 class="mb-0 fw-bold"><i class="bi bi-eye"></i> Active Live Preview</h6>
                                    </div>
                                    <div class="form-check form-switch mb-0">
                                        <input class="form-check-input" type="checkbox" id="chkLiveSyncDashboard" checked>
                                        <label class="form-check-label small text-muted fw-semibold" for="chkLiveSyncDashboard">Live Sync with Dashboard</label>
                                    </div>
                                </div>

                                <!-- Workspace Context Header & Mode Switcher -->
                                <div class="px-3 py-2 bg-dark bg-opacity-25 border-bottom border-secondary d-flex flex-wrap align-items-center justify-content-between gap-2" style="font-size: 0.75rem;">
                                    <div class="d-flex align-items-center gap-1">
                                        <span class="badge" id="workspaceBadge">Loading Workspace...</span>
                                    </div>
                                    <div class="btn-group" role="group" aria-label="Preview Mode Selector" style="box-shadow: 0 0 10px rgba(0,0,0,0.5);">
                                        <button type="button" class="btn btn-sm btn-outline-light active" id="btnPreviewModeCombined" style="font-size: 0.65rem; padding: 2px 8px; border-color: rgba(255,255,255,0.15);">Combined View</button>
                                        <button type="button" class="btn btn-sm btn-outline-light" id="btnPreviewModeContainer" style="font-size: 0.65rem; padding: 2px 8px; border-color: rgba(255,255,255,0.15);">Layout Style</button>
                                        <button type="button" class="btn btn-sm btn-outline-light" id="btnPreviewModeEffects" style="font-size: 0.65rem; padding: 2px 8px; border-color: rgba(255,255,255,0.15);">Effects</button>
                                    </div>
                                </div>

                                <!-- Dynamic Preview Canvas -->
                                <div class="flex-grow-1 d-flex align-items-center justify-content-center p-4 position-relative overflow-auto" style="min-height: 350px;">
                                    <div id="mockPreviewCard" class="card p-4 transition-all" style="width: 100%; max-width: 400px; border: 1px solid rgba(255,255,255,0.1); background-color: rgba(30, 41, 59, 0.7); border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
                                        <!-- Header mock -->
                                        <div class="d-flex justify-content-between align-items-center mb-3">
                                            <div class="d-flex align-items-center gap-1">
                                                <span class="rounded-circle bg-danger bg-opacity-75 d-inline-block" style="width: 8px; height: 8px;"></span>
                                                <span class="rounded-circle bg-warning bg-opacity-75 d-inline-block" style="width: 8px; height: 8px;"></span>
                                                <span class="rounded-circle bg-success bg-opacity-75 d-inline-block" style="width: 8px; height: 8px;"></span>
                                                <span class="text-muted ms-2" style="font-size: 0.65rem; font-family: monospace; letter-spacing: 0.05em;">COMP-08_MOCKUP</span>
                                            </div>
                                            <i class="bi bi-layers text-muted small"></i>
                                        </div>

                                        <!-- Title -->
                                        <h6 class="mb-1 text-white fw-bold" id="mockPreviewTitle">Visual Design Output</h6>
                                        <p class="text-muted mb-4" style="font-size: 0.65rem; font-family: sans-serif;">Live viewport for styling variables and container layout options.</p>

                                        <!-- Graph -->
                                        <div id="mockPreviewChartArea" class="py-2 transition-all" style="height: 130px; transition: background-color 0.3s ease;">
                                            <svg viewBox="0 0 400 200" class="w-100 h-100" style="overflow: visible;">
                                                <defs>
                                                    <linearGradient id="mockBlueGrad" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="0%" stop-color="#3b82f6" />
                                                        <stop offset="100%" stop-color="#1d4ed8" />
                                                    </linearGradient>
                                                    <linearGradient id="mockCyanGrad" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="0%" stop-color="#06b6d4" />
                                                        <stop offset="100%" stop-color="#0891b2" />
                                                    </linearGradient>
                                                </defs>
                                                <!-- Grid Lines -->
                                                <g stroke="rgba(255,255,255,0.06)" stroke-width="1">
                                                    <line x1="10" y1="20" x2="390" y2="20" />
                                                    <line x1="10" y1="70" x2="390" y2="70" />
                                                    <line x1="10" y1="120" x2="390" y2="120" />
                                                    <line x1="10" y1="170" x2="390" y2="170" />
                                                </g>
                                                <!-- Bars with Hoverable style -->
                                                <g class="mock-bars">
                                                    <rect x="50" y="80" width="35" height="100" rx="6" fill="url(#mockBlueGrad)" />
                                                    <rect x="120" y="40" width="35" height="140" rx="6" fill="url(#mockCyanGrad)" />
                                                    <rect x="190" y="110" width="35" height="70" rx="6" fill="url(#mockBlueGrad)" opacity="0.85" />
                                                    <rect x="260" y="60" width="35" height="120" rx="6" fill="url(#mockCyanGrad)" opacity="0.85" />
                                                    <rect x="330" y="95" width="35" height="85" rx="6" fill="url(#mockBlueGrad)" />
                                                </g>
                                                <!-- Dynamic Sparkline on top -->
                                                <path d="M 68,100 L 138,60 L 208,120 L 278,80 L 348,110" fill="none" stroke="#f43f5e" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
                                                <circle cx="138" cy="60" r="4.5" fill="#f43f5e" stroke="#ffffff" stroke-width="1.5" />
                                                <circle cx="278" cy="80" r="4.5" fill="#f43f5e" stroke="#ffffff" stroke-width="1.5" />
                                            </svg>
                                        </div>

                                        <!-- Footer details -->
                                        <div class="d-flex justify-content-between align-items-center mt-4 pt-3 border-top border-secondary border-opacity-25" style="font-size: 0.65rem;">
                                            <span class="text-muted"><i class="bi bi-clock me-1"></i> Updated in Realtime</span>
                                            <span class="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 py-1 px-2 rounded-pill">Adaptive Mode</span>
                                        </div>
                                    </div>
                                </div>

                                <!-- Bottom Cheat Sheet Guide -->
                                <div class="p-3 bg-black border-top border-secondary" style="font-size: 0.75rem; font-family: sans-serif; background: #0c0c0c !important;">
                                    <div class="d-flex align-items-center justify-content-between mb-2">
                                        <span class="fw-bold text-light"><i class="bi bi-info-circle text-info"></i> JSON Formatting Help:</span>
                                        <span class="text-muted" style="font-size: 0.7rem;">Validate before saving</span>
                                    </div>
                                    <div id="jsonFormatGuideText" class="text-muted small">
                                        <!-- Will load helper text based on active editor -->
                                        Loading schema helper...
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Footer -->
                <div class="modal-footer bg-black border-top border-secondary py-3">
                    <button type="button" class="btn btn-outline-secondary px-4" data-bs-dismiss="modal">Cancel</button>
                    <button type="button" class="btn btn-success px-4 fw-bold" id="saveCodeBtn"><i class="bi bi-save me-1"></i> Apply & Save Code</button>
                </div>
            </div>
        </div>
    `,
  "addDataModal": `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="addDataModalLabel"><i class="bi bi-plus-square"></i> नया डेटा जोड़ें</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body" id="addDataForm">
                    </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-primary" id="saveData"><i class="bi bi-save"></i> सहेजें</button>
                </div>
            </div>
        </div>
    `,
  "mainMenuModal": `
        <div class="modal-dialog modal-dialog-centered modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="mainMenuModalLabel"></h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <div id="dashboardViewContent" class="modal-content-area" style="display: none;">
                        <h5 class="mb-3"><i class="bi bi-eye"></i> डैशबोर्ड दृश्य नियंत्रण (Dashboard View Control)</h5>
                        <div id="dashboardViewSection">
                            <!-- element toggles -->
                            <div class="card p-3 mb-3 border bg-light-subtle">
                                <h6 class="fw-bold mb-2 text-secondary"><i class="bi bi-eye-slash-fill"></i> कैनवास तत्वों को दिखाएं / छिपाएं</h6>
                                <div class="row g-2">
                                    <div class="col-md-6">
                                        <div class="form-check form-switch">
                                            <input class="form-check-input" type="checkbox" id="toggleVisualizations" checked>
                                            <label class="form-check-label small" for="toggleVisualizations">चार्ट विज़ुअल्स (Charts)</label>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="form-check form-switch">
                                            <input class="form-check-input" type="checkbox" id="toggleDataTable" checked>
                                            <label class="form-check-label small" for="toggleDataTable">डेटा टेबल (Data Table)</label>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="form-check form-switch">
                                            <input class="form-check-input" type="checkbox" id="toggleChat" checked>
                                            <label class="form-check-label small" for="toggleChat">AI चैट (AI Chat)</label>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="form-check form-switch">
                                            <input class="form-check-input" type="checkbox" id="toggleTextboxes" checked>
                                            <label class="form-check-label small" for="toggleTextboxes">टेक्स्टबॉक्स (Textboxes)</label>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="form-check form-switch">
                                            <input class="form-check-input" type="checkbox" id="toggleMainHeader" checked>
                                            <label class="form-check-label small" for="toggleMainHeader">मुख्य हेडर (Main Header)</label>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- canvas themes -->
                            <div class="card p-3 mb-3 border bg-light-subtle">
                                <h6 class="fw-bold mb-2 text-secondary"><i class="bi bi-palette-fill"></i> कैनवास बैकड्रॉप थीम (Canvas Themes)</h6>
                                <div class="mb-3">
                                    <select id="canvasBackdropTheme" class="form-select form-select-sm">
                                        <option value="default" selected>डिफ़ॉल्ट लाइट (Default Light)</option>
                                        <option value="dark">चारकोल डार्क (Slate Dark)</option>
                                        <option value="sepia">सॉफ्ट विंटेज क्रीम (Vintage Sepia)</option>
                                        <option value="blue-glow">शाही नीला चमक (Midnight Sapphire Glow)</option>
                                        <option value="glassy">ग्लास विज़ुअल्स (Frosted Glass Canvas)</option>
                                    </select>
                                </div>
                            </div>

                            <!-- auto-grid arrangers -->
                            <div class="card p-3 mb-3 border bg-light-subtle">
                                <h6 class="fw-bold mb-2 text-secondary"><i class="bi bi-grid-3x3-gap-fill"></i> पावर बीआई-ग्रिड संरेखण (Power BI Auto-Grid Arrange)</h6>
                                <p class="text-muted small" style="font-size: 0.72rem;">चार्ट को स्वचालित रूप से सुव्यवस्थित ग्रिड में संरेखित करें:</p>
                                <div class="d-flex flex-wrap gap-2">
                                    <button id="btnArrange1Col" class="btn btn-sm btn-outline-primary flex-fill"><i class="bi bi-layout-sidebar"></i> 1 कॉलम</button>
                                    <button id="btnArrange2Col" class="btn btn-sm btn-outline-primary flex-fill"><i class="bi bi-layout-split"></i> 2 कॉलम</button>
                                    <button id="btnArrange3Col" class="btn btn-sm btn-outline-primary flex-fill"><i class="bi bi-grid-3x3-gap"></i> 3 कॉलम</button>
                                </div>
                            </div>

                            <!-- presentation and lock options -->
                            <div class="card p-3 mb-3 border bg-light-subtle">
                                <h6 class="fw-bold mb-2 text-secondary"><i class="bi bi-shield-lock-fill"></i> संपादन और प्रस्तुति मोड (Safety & Mode)</h6>
                                <div class="form-check mb-2">
                                    <input class="form-check-input" type="checkbox" id="toggleLockModeViewCheckbox">
                                    <label class="form-check-label small fw-bold text-danger" for="toggleLockModeViewCheckbox">
                                        <i class="bi bi-lock-fill"></i> संपादन लॉक करें (Lock Layout Editing)
                                    </label>
                                </div>
                                <button id="btnPresentationMode" class="btn btn-sm btn-success w-100 py-2"><i class="bi bi-play-circle-fill"></i> फुलस्क्रीन / प्रेजेंटेशन मोड चालू करें</button>
                            </div>

                            <div class="col-md-12 mt-4">
                                <button id="downloadFullDashboard" class="btn btn-dark w-100"><i class="bi bi-file-earmark-arrow-down"></i> पूरा डैशबोर्ड डाउनलोड करें</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
  "kpiBuilderContent": `
                    <!-- Clean Professional Header -->
                    <div class="d-flex align-items-center justify-content-between pb-2 mb-3 border-bottom border-slate-200 dark:border-slate-800">
                        <div class="d-flex align-items-center gap-2">
                            <div class="rounded-2 d-flex align-items-center justify-content-center bg-primary text-white" style="width: 28px; height: 28px;">
                                <i class="bi bi-speedometer2" style="font-size: 14px;"></i>
                            </div>
                            <div>
                                <h6 class="m-0 font-sans fw-bold text-slate-800 dark:text-slate-100" style="font-size: 13px;">KPI कार्ड बिल्डर</h6>
                                <span class="text-slate-500 dark:text-slate-400 d-block" style="font-size: 10px;">डेटा मेट्रिक व मिनी-चार्ट</span>
                            </div>
                        </div>
                        <span class="badge bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 fw-medium px-2 py-1" style="font-size: 10px;">
                            <i class="bi bi-eye me-1"></i>लाइव प्रीव्यू
                        </span>
                    </div>

                    <!-- Clean Live Card Preview Box -->
                    <div class="mb-3 p-2.5 rounded-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs" id="kpiLivePreviewContainer">
                        <div class="d-flex justify-content-between align-items-center mb-2 px-1">
                            <span class="text-slate-500 dark:text-slate-400 fw-medium" style="font-size: 10.5px;">कार्ड प्रीव्यू (Card Preview)</span>
                            <span class="badge bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded" style="font-size: 9px;">Dashboard Preview</span>
                        </div>
                        <div class="d-flex align-items-center justify-content-center p-2" style="min-height: 100px;" id="kpiLivePreviewBody">
                            <div class="text-slate-400 text-center py-2" style="font-size: 11px;">
                                <i class="bi bi-arrow-repeat spin d-inline-block mb-1"></i><br>लोड हो रहा है...
                            </div>
                        </div>
                    </div>

                    <!-- Direct Clean Form Sections -->
                    <div class="d-flex flex-column gap-3 text-start">
                        
                        <!-- Section 1: डेटा व गणना (Data & Metric) -->
                        <div class="p-2.5 rounded-3 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
                            <div class="d-flex align-items-center gap-1.5 mb-2 pb-1 border-bottom border-slate-100 dark:border-slate-800">
                                <i class="bi bi-database text-primary" style="font-size: 12px;"></i>
                                <span class="fw-semibold text-slate-800 dark:text-slate-200" style="font-size: 11px;">1. डेटा व गणना (Data & Metric)</span>
                            </div>

                            <!-- Title Input -->
                            <div class="mb-2">
                                <label for="kpiTitleInput" class="form-label text-slate-600 dark:text-slate-400 mb-1 fw-medium" style="font-size: 10.5px;">कार्ड का शीर्षक (Title)</label>
                                <div class="input-group input-group-sm">
                                    <span class="input-group-text bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-400"><i class="bi bi-type" style="font-size: 12px;"></i></span>
                                    <input type="text" id="kpiTitleInput" class="form-control form-control-sm border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100" placeholder="उदा: कुल बिक्री, नए ग्राहक" style="font-size: 11px;">
                                </div>
                            </div>

                            <!-- Metric Column Selection -->
                            <div class="mb-2.5 position-relative" id="kpiColPickerContainer">
                                <div class="d-flex justify-content-between align-items-center mb-1">
                                    <label class="form-label text-slate-600 dark:text-slate-400 mb-0 fw-medium" style="font-size: 10.5px;">डेटा कॉलम (Target Column)</label>
                                    <span class="badge bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60 px-1.5 py-0.5 rounded" id="kpiColumnTypeBadge" style="font-size: 8.5px; font-weight: 500;">
                                        <i class="bi bi-hash me-0.5"></i> पंक्ति गणना
                                    </span>
                                </div>
                                
                                <select id="kpiMetricColumn" class="d-none">
                                    <option value="">-- पंक्ति गणना (Count All Rows) --</option>
                                </select>

                                <!-- Custom Selection Trigger -->
                                <div id="kpiCustomColTrigger" class="custom-col-trigger d-flex align-items-center justify-content-between p-2 rounded-2 border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 shadow-2xs text-start" style="cursor: pointer; min-height: 38px;">
                                    <div class="d-flex align-items-center gap-2 overflow-hidden flex-grow-1 me-2">
                                        <div id="kpiCustomColIcon" class="rounded-2 bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 d-flex align-items-center justify-content-center flex-shrink-0" style="width: 26px; height: 26px;">
                                            <i class="bi bi-hash fs-6"></i>
                                        </div>
                                        <div class="text-truncate">
                                            <div id="kpiCustomColLabel" class="fw-semibold text-slate-800 dark:text-slate-100 text-truncate" style="font-size: 11px; line-height: 1.2;">-- पंक्ति गणना (Count All Rows) --</div>
                                            <div id="kpiCustomColSub" class="text-slate-400 dark:text-slate-500 text-truncate" style="font-size: 8.5px;">सभी पंक्तियों/रिकॉर्ड्स की कुल गिनती</div>
                                        </div>
                                    </div>
                                    <div class="d-flex align-items-center gap-1.5 flex-shrink-0">
                                        <span id="kpiCustomColTag" class="badge bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-normal px-1.5 py-0.5" style="font-size: 8.5px;">Count</span>
                                        <i id="kpiCustomColChevron" class="bi bi-chevron-down text-slate-400" style="font-size: 11px; transition: transform 0.2s ease;"></i>
                                    </div>
                                </div>

                                <!-- Custom Dropdown Menu -->
                                <div id="kpiCustomColDropdown" class="custom-col-dropdown position-absolute start-0 end-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3 shadow-xl d-none z-3 overflow-hidden" style="top: 100%; max-height: 260px; z-index: 1050;">
                                    <div class="p-1.5 border-bottom border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 sticky-top">
                                        <div class="input-group input-group-sm">
                                            <span class="input-group-text bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 py-0.5 px-2" style="font-size: 10px;"><i class="bi bi-search"></i></span>
                                            <input type="text" id="kpiCustomColSearch" class="form-control form-control-sm border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 py-0.5" placeholder="कॉलम खोजें (Search column)..." style="font-size: 10.5px;">
                                        </div>
                                    </div>
                                    <div id="kpiCustomColOptionsList" class="custom-col-options-list overflow-y-auto" style="max-height: 205px;"></div>
                                </div>
                            </div>

                            <!-- Aggregation Buttons -->
                            <div>
                                <label class="form-label text-slate-600 dark:text-slate-400 mb-1 fw-medium" style="font-size: 10.5px;">गणना विधि (Aggregation)</label>
                                <select id="kpiAggregation" class="d-none">
                                    <option value="sum">SUM</option>
                                    <option value="avg">AVG</option>
                                    <option value="min">MIN</option>
                                    <option value="max">MAX</option>
                                    <option value="count">COUNT</option>
                                </select>
                                <div class="d-flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2 border border-slate-200 dark:border-slate-700" id="kpiAggregationButtons">
                                    <button type="button" class="btn btn-xs flex-grow-1 py-1 px-1 d-flex flex-column align-items-center border-0 rounded-2" data-value="sum" title="योग (SUM)">
                                        <i class="bi bi-plus-circle mb-0.5" style="font-size: 11px;"></i>
                                        <span style="font-size: 9px;">SUM</span>
                                    </button>
                                    <button type="button" class="btn btn-xs flex-grow-1 py-1 px-1 d-flex flex-column align-items-center border-0 rounded-2" data-value="avg" title="औसत (AVG)">
                                        <i class="bi bi-calculator mb-0.5" style="font-size: 11px;"></i>
                                        <span style="font-size: 9px;">AVG</span>
                                    </button>
                                    <button type="button" class="btn btn-xs flex-grow-1 py-1 px-1 d-flex flex-column align-items-center border-0 rounded-2" data-value="min" title="न्यूनतम (MIN)">
                                        <i class="bi bi-dash-circle mb-0.5" style="font-size: 11px;"></i>
                                        <span style="font-size: 9px;">MIN</span>
                                    </button>
                                    <button type="button" class="btn btn-xs flex-grow-1 py-1 px-1 d-flex flex-column align-items-center border-0 rounded-2" data-value="max" title="अधिकतम (MAX)">
                                        <i class="bi bi-graph-up-arrow mb-0.5" style="font-size: 11px;"></i>
                                        <span style="font-size: 9px;">MAX</span>
                                    </button>
                                    <button type="button" class="btn btn-xs flex-grow-1 py-1 px-1 d-flex flex-column align-items-center border-0 rounded-2" data-value="count" title="गिनती (COUNT)">
                                        <i class="bi bi-hash mb-0.5" style="font-size: 11px;"></i>
                                        <span style="font-size: 9px;">COUNT</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- Section 2: ट्रेंड व लेआउट (Trend & Layout) -->
                        <div class="p-2.5 rounded-3 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
                            <div class="d-flex align-items-center gap-1.5 mb-2 pb-1 border-bottom border-slate-100 dark:border-slate-800">
                                <i class="bi bi-graph-up text-success" style="font-size: 12px;"></i>
                                <span class="fw-semibold text-slate-800 dark:text-slate-200" style="font-size: 11px;">2. ट्रेंड चार्ट व लेआउट (Trend & Layout)</span>
                            </div>

                            <!-- Trend Types (Useful Clean Sparklines: Line, Area, Bar) -->
                            <div class="mb-2.5">
                                <label class="form-label text-slate-600 dark:text-slate-400 mb-1 fw-medium" style="font-size: 10.5px;">ट्रेंड प्रकार (Trend Type)</label>
                                <select id="kpiSparklineType" class="d-none">
                                    <option value="line">Line</option>
                                    <option value="area">Area</option>
                                    <option value="bar">Bar</option>
                                    <option value="pie">Pie</option>
                                    <option value="doughnut">Doughnut</option>
                                    <option value="polarArea">Polar</option>
                                    <option value="radar">Radar</option>
                                </select>
                                <div class="d-flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2 border border-slate-200 dark:border-slate-700" id="kpiSparklineTypeButtons">
                                    <button type="button" class="btn btn-xs flex-grow-1 py-1.5 px-2 d-flex align-items-center justify-content-center gap-1.5 border-0 rounded-2" data-value="line" title="Smooth Line">
                                        <i class="bi bi-graph-up" style="font-size: 12px;"></i> <span style="font-size: 10.5px;">Line</span>
                                    </button>
                                    <button type="button" class="btn btn-xs flex-grow-1 py-1.5 px-2 d-flex align-items-center justify-content-center gap-1.5 border-0 rounded-2" data-value="area" title="Area Wave">
                                        <i class="bi bi-activity" style="font-size: 12px;"></i> <span style="font-size: 10.5px;">Area</span>
                                    </button>
                                    <button type="button" class="btn btn-xs flex-grow-1 py-1.5 px-2 d-flex align-items-center justify-content-center gap-1.5 border-0 rounded-2" data-value="bar" title="Micro Bar">
                                        <i class="bi bi-bar-chart-steps" style="font-size: 12px;"></i> <span style="font-size: 10.5px;">Bar</span>
                                    </button>
                                </div>
                            </div>

                            <!-- Text Font Sizes (Title & Value Size User-Adjustable) -->
                            <div class="mb-2.5 p-2 rounded-2 bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800">
                                <div class="d-flex justify-content-between align-items-center mb-1.5">
                                    <span class="text-slate-700 dark:text-slate-300 fw-semibold" style="font-size: 10.5px;">
                                        <i class="bi bi-fonts me-1 text-primary"></i>टेक्स्ट आकार (Text Size)
                                    </span>
                                    <span class="text-slate-400" style="font-size: 8.5px;">कार्ड अनुसार स्वतः एडजस्ट</span>
                                </div>
                                
                                <!-- Title Font Size Slider -->
                                <div class="mb-2">
                                    <div class="d-flex justify-content-between align-items-center mb-0.5">
                                        <label for="kpiTitleSize" class="text-slate-500 dark:text-slate-400 mb-0" style="font-size: 9.5px;">शीर्षक फॉन्ट (Title Font)</label>
                                        <span id="kpiTitleSizeVal" class="badge bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700" style="font-size: 9px;">12px</span>
                                    </div>
                                    <input type="range" id="kpiTitleSize" class="form-range form-range-sm w-100 cursor-pointer" min="9" max="18" step="1" value="12">
                                </div>

                                <!-- Value Font Size Slider -->
                                <div>
                                    <div class="d-flex justify-content-between align-items-center mb-0.5">
                                        <label for="kpiValueSize" class="text-slate-500 dark:text-slate-400 mb-0" style="font-size: 9.5px;">मेट्रिक मान (Value Font)</label>
                                        <span id="kpiValueSizeVal" class="badge bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700" style="font-size: 9px;">26px</span>
                                    </div>
                                    <input type="range" id="kpiValueSize" class="form-range form-range-sm w-100 cursor-pointer" min="18" max="42" step="1" value="26">
                                </div>
                            </div>

                            <!-- Sparkline Size Options -->
                            <div class="mb-1">
                                <div class="d-flex justify-content-between align-items-center mb-1">
                                    <label class="form-label text-slate-600 dark:text-slate-400 mb-0 fw-medium" style="font-size: 10.5px;">स्पार्कलाइन आकार (Sparkline Size)</label>
                                    <span class="text-slate-400" style="font-size: 8.5px;" id="kpiSparklineDimLabel">110 × 35 px</span>
                                </div>
                                <div class="d-flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2 border border-slate-200 dark:border-slate-700" id="kpiSparklineSizeButtons">
                                    <button type="button" class="btn btn-xs flex-grow-1 py-1 px-1 border-0 rounded-2" data-width="85" data-height="28" title="Compact size">
                                        <span style="font-size: 10px;">छोटा (Small)</span>
                                    </button>
                                    <button type="button" class="btn btn-xs flex-grow-1 py-1 px-1 border-0 rounded-2 active" data-width="110" data-height="35" title="Standard size">
                                        <span style="font-size: 10px;">मध्यम (Medium)</span>
                                    </button>
                                    <button type="button" class="btn btn-xs flex-grow-1 py-1 px-1 border-0 rounded-2" data-width="140" data-height="42" title="Large size">
                                        <span style="font-size: 10px;">बड़ा (Large)</span>
                                    </button>
                                </div>
                            </div>

                            <!-- Fixed Position and Hidden sizing values -->
                            <input type="hidden" id="kpiSparklinePosition" value="right">
                            <input type="hidden" id="kpiSparklineWidth" value="110">
                            <input type="hidden" id="kpiSparklineHeight" value="35">
                            <span id="kpiSparklineWidthVal" class="d-none">110px</span>
                            <span id="kpiSparklineHeightVal" class="d-none">35px</span>
                        </div>

                        <!-- Section 3: स्टाइल, थीम व रंग (Style & Color) -->
                        <div class="p-2.5 rounded-3 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
                            <div class="d-flex align-items-center gap-1.5 mb-2 pb-1 border-bottom border-slate-100 dark:border-slate-800">
                                <i class="bi bi-palette text-amber-500" style="font-size: 12px;"></i>
                                <span class="fw-semibold text-slate-800 dark:text-slate-200" style="font-size: 11px;">3. स्टाइल, थीम व रंग (Appearance)</span>
                            </div>

                            <!-- Card Border Style -->
                            <div class="mb-2.5">
                                <label class="form-label text-slate-600 dark:text-slate-400 mb-1 fw-medium" style="font-size: 10.5px;">कार्ड स्टाइल (Card Frame)</label>
                                <select id="kpiCardStyle" class="d-none">
                                    <option value="minimal">Minimal</option>
                                    <option value="accent">Accent</option>
                                    <option value="glass">Glass</option>
                                    <option value="dark-neon">Neon</option>
                                </select>
                                <div class="d-flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2 border border-slate-200 dark:border-slate-700" id="kpiCardStyleButtons">
                                    <button type="button" class="btn btn-xs flex-grow-1 py-1.5 px-2 d-flex align-items-center justify-content-center gap-1.5 border-0 rounded-2" data-value="minimal" title="Clean minimal border">
                                        <i class="bi bi-border-outer" style="font-size: 11px;"></i>
                                        <span style="font-size: 10px;">Minimal</span>
                                    </button>
                                    <button type="button" class="btn btn-xs flex-grow-1 py-1.5 px-2 d-flex align-items-center justify-content-center gap-1.5 border-0 rounded-2" data-value="accent" title="Colored accent border">
                                        <i class="bi bi-brush" style="font-size: 11px;"></i>
                                        <span style="font-size: 10px;">Accent</span>
                                    </button>
                                </div>
                            </div>

                            <!-- Theme Swatches -->
                            <div class="mb-2.5">
                                <label class="form-label text-slate-600 dark:text-slate-400 mb-1 fw-medium" style="font-size: 10.5px;">कार्ड थीम (Theme)</label>
                                <select id="kpiContainerTheme" class="d-none">
                                    <option value="light">Light</option>
                                    <option value="dark-slate">Dark Slate</option>
                                    <option value="royal-blue">Royal Blue</option>
                                    <option value="emerald">Emerald</option>
                                    <option value="sunset">Sunset</option>
                                    <option value="purple-haze">Purple Haze</option>
                                    <option value="glass-cyber">Cyber Glass</option>
                                    <option value="custom-solid">Custom Solid</option>
                                </select>
                                <div class="d-flex flex-wrap gap-2 p-1.5 bg-slate-50 dark:bg-slate-900 rounded-2 border border-slate-200 dark:border-slate-800" id="kpiContainerThemeButtons">
                                    <button type="button" class="btn btn-xs d-flex align-items-center justify-content-center" data-value="light" title="Classic Light" style="width: 24px; height: 24px; border-radius: 6px; background-color: #ffffff; color: #0f172a; border: 1.5px solid #cbd5e1;">
                                        <i class="bi bi-brightness-high" style="font-size: 11px;"></i>
                                    </button>
                                    <button type="button" class="btn btn-xs d-flex align-items-center justify-content-center" data-value="dark-slate" title="Dark Slate" style="width: 24px; height: 24px; border-radius: 6px; background-color: #1e293b; color: #ffffff; border: 1.5px solid #475569;">
                                        <i class="bi bi-moon-stars" style="font-size: 11px;"></i>
                                    </button>
                                    <button type="button" class="btn btn-xs d-flex align-items-center justify-content-center" data-value="royal-blue" title="Royal Blue" style="width: 24px; height: 24px; border-radius: 6px; background-color: #1e40af; color: #ffffff; border: 1.5px solid #3b82f6;">
                                        <i class="bi bi-water" style="font-size: 11px;"></i>
                                    </button>
                                    <button type="button" class="btn btn-xs d-flex align-items-center justify-content-center" data-value="emerald" title="Emerald Green" style="width: 24px; height: 24px; border-radius: 6px; background-color: #065f46; color: #ffffff; border: 1.5px solid #10b981;">
                                        <i class="bi bi-gem" style="font-size: 11px;"></i>
                                    </button>
                                    <button type="button" class="btn btn-xs d-flex align-items-center justify-content-center" data-value="sunset" title="Sunset Amber" style="width: 24px; height: 24px; border-radius: 6px; background-color: #9a3412; color: #ffffff; border: 1.5px solid #f97316;">
                                        <i class="bi bi-sun" style="font-size: 11px;"></i>
                                    </button>
                                    <button type="button" class="btn btn-xs d-flex align-items-center justify-content-center" data-value="purple-haze" title="Violet / Purple" style="width: 24px; height: 24px; border-radius: 6px; background-color: #5b21b6; color: #ffffff; border: 1.5px solid #8b5cf6;">
                                        <i class="bi bi-palette" style="font-size: 11px;"></i>
                                    </button>
                                </div>
                            </div>

                            <!-- Accent Color Picker & Dots -->
                            <div>
                                <label class="form-label text-slate-600 dark:text-slate-400 mb-1 fw-medium" style="font-size: 10.5px;">एक्सेंट रंग (Accent Color)</label>
                                <div class="d-flex align-items-center gap-2">
                                    <input type="color" id="kpiColorPicker" class="form-control form-control-color border-0 p-0 rounded-2 cursor-pointer" style="width: 28px; height: 26px;" value="#4f46e5" title="Choose color">
                                    <div class="d-flex flex-wrap gap-1.5" id="kpiPaletteColors">
                                        <span class="color-dot cursor-pointer border border-white dark:border-slate-800 shadow-2xs" style="background-color: #4f46e5; width: 20px; height: 20px; display: inline-block; border-radius: 50%;" data-color="#4f46e5" title="Indigo"></span>
                                        <span class="color-dot cursor-pointer border border-white dark:border-slate-800 shadow-2xs" style="background-color: #2563eb; width: 20px; height: 20px; display: inline-block; border-radius: 50%;" data-color="#2563eb" title="Blue"></span>
                                        <span class="color-dot cursor-pointer border border-white dark:border-slate-800 shadow-2xs" style="background-color: #059669; width: 20px; height: 20px; display: inline-block; border-radius: 50%;" data-color="#059669" title="Emerald"></span>
                                        <span class="color-dot cursor-pointer border border-white dark:border-slate-800 shadow-2xs" style="background-color: #d97706; width: 20px; height: 20px; display: inline-block; border-radius: 50%;" data-color="#d97706" title="Amber"></span>
                                        <span class="color-dot cursor-pointer border border-white dark:border-slate-800 shadow-2xs" style="background-color: #e11d48; width: 20px; height: 20px; display: inline-block; border-radius: 50%;" data-color="#e11d48" title="Rose"></span>
                                        <span class="color-dot cursor-pointer border border-white dark:border-slate-800 shadow-2xs" style="background-color: #7c3aed; width: 20px; height: 20px; display: inline-block; border-radius: 50%;" data-color="#7c3aed" title="Purple"></span>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>

                    <!-- Clean Action Dock -->
                    <div class="border-top border-slate-200 dark:border-slate-800 pt-3 mt-3">
                        <button id="btnAddKpiCard" type="button" class="btn btn-primary w-100 py-2 fw-semibold d-flex align-items-center justify-content-center gap-2 rounded-2 shadow-2xs" style="font-size: 12px;">
                            <i class="bi bi-plus-circle-fill"></i> <span>KPI कार्ड जोड़ें (Add KPI Card)</span>
                        </button>
                        <button id="btnCancelKpiEdit" type="button" class="btn btn-sm btn-outline-secondary w-100 mt-2 py-1.5 rounded-2" style="display: none; font-size: 11px;">
                            <i class="bi bi-x-circle me-1"></i> संपादन रद्द करें (Cancel Edit)
                        </button>
                    </div>
    `,
  "chartAnnotationModal": `
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content shadow-lg border-0 rounded-4 overflow-hidden">
                <div class="modal-header bg-slate-900 text-white py-2.5 px-3">
                    <h6 class="modal-title font-sans font-bold text-white d-flex align-items-center gap-2 mb-0" style="font-size: 0.88rem;">
                        <i class="bi bi-pin-angle-fill text-danger fs-6"></i> डेटा पॉइंट पिन करें / कॉलआउट लेबल
                    </h6>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close" style="font-size: 9px;"></button>
                </div>
                <div class="modal-body p-3 bg-slate-50">
                    <!-- Point info card -->
                    <div id="annotationPointDetails" class="p-2.5 mb-3 bg-white rounded-3 shadow-xs border text-xs text-slate-700"></div>
                    
                    <!-- Quick tag selection -->
                    <div class="mb-3">
                        <label class="form-label text-xs font-semibold mb-1.5 d-block text-slate-800">
                            <i class="bi bi-tags-fill me-1 text-primary"></i> कॉलआउट टैग चुनें (Callout Tag):
                        </label>
                        <div class="d-flex flex-wrap gap-1.5" id="quickAnnotationTagPills">
                            <button type="button" class="btn btn-xs btn-outline-danger tag-pill-btn active d-inline-flex align-items-center gap-1 rounded-2 py-1 px-2.5" data-tag="ऐतिहासिक घटना" data-icon="bi-flag-fill" data-color="#ef4444">
                                <i class="bi bi-flag-fill"></i> ऐतिहासिक घटना
                            </button>
                            <button type="button" class="btn btn-xs btn-outline-warning tag-pill-btn d-inline-flex align-items-center gap-1 rounded-2 py-1 px-2.5" data-tag="पिक / स्पाइक" data-icon="bi-graph-up-arrow" data-color="#f59e0b">
                                <i class="bi bi-graph-up-arrow"></i> पिक / स्पाइक
                            </button>
                            <button type="button" class="btn btn-xs btn-outline-info tag-pill-btn d-inline-flex align-items-center gap-1 rounded-2 py-1 px-2.5" data-tag="गिरावट / एनोमली" data-icon="bi-exclamation-triangle-fill" data-color="#0284c7">
                                <i class="bi bi-exclamation-triangle-fill"></i> गिरावट / एनोमली
                            </button>
                            <button type="button" class="btn btn-xs btn-outline-success tag-pill-btn d-inline-flex align-items-center gap-1 rounded-2 py-1 px-2.5" data-tag="इवेंट / लॉन्च" data-icon="bi-rocket-takeoff-fill" data-color="#10b981">
                                <i class="bi bi-rocket-takeoff-fill"></i> इवेंट / लॉन्च
                            </button>
                        </div>
                    </div>

                    <!-- Note input -->
                    <div class="mb-3">
                        <label for="annotationNoteInput" class="form-label text-xs font-semibold mb-1 text-slate-800">
                            <i class="bi bi-chat-left-text-fill me-1 text-secondary"></i> विवरण या टिप्पणी दर्ज करें:
                        </label>
                        <textarea class="form-control text-xs shadow-xs rounded-2" id="annotationNoteInput" rows="3" placeholder="उदा: यहाँ बिक्री में वृद्धि दिवाली ऑफर विज्ञापन के कारण हुई।"></textarea>
                    </div>

                    <!-- Color & Pin styling -->
                    <div class="p-2 bg-white rounded-3 border shadow-xs d-flex align-items-center justify-content-between">
                        <label for="annotationColorInput" class="form-label text-xs font-semibold mb-0 text-slate-800 d-flex align-items-center gap-1">
                            <i class="bi bi-palette-fill text-danger"></i> पिन का रंग (Color):
                        </label>
                        <div class="d-flex align-items-center gap-2">
                            <div class="d-flex gap-1" id="quickPinColorSwatches">
                                <button type="button" class="btn p-0 rounded-circle swatch-btn" data-swatch="#ef4444" style="width: 18px; height: 18px; background: #ef4444; border: 1px solid rgba(0,0,0,0.15);"></button>
                                <button type="button" class="btn p-0 rounded-circle swatch-btn" data-swatch="#f59e0b" style="width: 18px; height: 18px; background: #f59e0b; border: 1px solid rgba(0,0,0,0.15);"></button>
                                <button type="button" class="btn p-0 rounded-circle swatch-btn" data-swatch="#0284c7" style="width: 18px; height: 18px; background: #0284c7; border: 1px solid rgba(0,0,0,0.15);"></button>
                                <button type="button" class="btn p-0 rounded-circle swatch-btn" data-swatch="#10b981" style="width: 18px; height: 18px; background: #10b981; border: 1px solid rgba(0,0,0,0.15);"></button>
                                <button type="button" class="btn p-0 rounded-circle swatch-btn" data-swatch="#8b5cf6" style="width: 18px; height: 18px; background: #8b5cf6; border: 1px solid rgba(0,0,0,0.15);"></button>
                            </div>
                            <input type="color" class="form-control form-control-color border-0 p-0" id="annotationColorInput" value="#ef4444" title="रंग चुनें" style="width: 28px; height: 28px; cursor: pointer;">
                        </div>
                    </div>
                </div>
                <div class="modal-footer bg-white border-top-0 pt-2 pb-3 px-3">
                    <button type="button" class="btn btn-light btn-sm text-xs px-3" data-bs-dismiss="modal">रद्द करें</button>
                    <button type="button" class="btn btn-danger btn-sm text-xs px-3 fw-bold rounded-2 shadow-xs d-inline-flex align-items-center gap-1.5" id="saveAnnotationBtn">
                        <i class="bi bi-pin-angle-fill"></i> कॉलआउट पिन करें
                    </button>
                </div>
            </div>
        </div>
    `,
  "dashboardThemeContent": `
                    <h5 class="mb-3 text-primary fw-bold" style="font-family: var(--font-display);"><i class="bi bi-palette2"></i> डैशबोर्ड थीम (Dashboard Theme)</h5>
                    
                    <!-- Explanation card -->
                    <div class="card border-0 mb-3 shadow-sm text-start" style="border-radius: 12px; background: #ffffff; border: 1px solid #e2e8f0;">
                        <div class="card-body p-3">
                            <p class="text-muted small mb-0" style="font-size: 0.75rem;">यहाँ से आप अपने डैशबोर्ड के मुख्य रंगों, चार्ट्स कलर पैलेट और ब्रांड पहचान को कस्टमाइज़ कर सकते हैं।</p>
                        </div>
                    </div>

                    <!-- 1. Brand Accent Color Selection -->
                    <div class="card border-0 mb-3 shadow-sm text-start" style="border-radius: 12px; border: 1px solid #e2e8f0; background: #ffffff;">
                        <div class="card-body p-3">
                            <h6 class="card-title text-slate-800 fw-bold mb-2 small" style="font-family: var(--font-display);"><i class="bi bi-palette-fill text-warning"></i> ब्रांड कलर थीम (Accent Theme)</h6>
                            <p class="text-muted small" style="font-size: 0.72rem; margin-bottom: 0.75rem;">सक्रिय थीम के मुख्य रंगों को नियंत्रित करें:</p>
                            <div class="d-flex gap-2 justify-content-between mt-2 mb-1">
                                <button class="btn btn-accent-theme p-0 rounded-circle bg-primary" data-theme-accent="primary" style="width: 32px; height: 32px; border: 2px solid transparent;" title="Ocean Blue"></button>
                                <button class="btn btn-accent-theme p-0 rounded-circle bg-success" data-theme-accent="success" style="width: 32px; height: 32px; border: 2px solid transparent;" title="Emerald Green"></button>
                                <button class="btn btn-accent-theme p-0 rounded-circle bg-danger" data-theme-accent="danger" style="width: 32px; height: 32px; border: 2px solid transparent;" title="Sunset Red"></button>
                                <button class="btn btn-accent-theme p-0 rounded-circle bg-warning" data-theme-accent="warning" style="width: 32px; height: 32px; border: 2px solid transparent;" title="Golden Amber"></button>
                                <button class="btn btn-accent-theme p-0 rounded-circle bg-dark" data-theme-accent="dark" style="width: 32px; height: 32px; border: 2px solid transparent;" title="Mystic Slate"></button>
                            </div>
                        </div>
                    </div>

                    <!-- 2. Custom Brand Theme & Color Palette Builder -->
                    <div class="card border-0 mb-3 p-3 shadow-sm text-start" id="custom-theme-creator-box" style="border-radius: 12px; border: 1px solid #e2e8f0; background: #ffffff;">
                        <h6 class="fw-bold mb-2 text-slate-800 d-flex justify-content-between align-items-center" style="font-size: 0.82rem; font-family: var(--font-display);">
                            <span><i class="bi bi-palette2 text-primary me-1.5"></i> कस्टम कलर पैलेट बिल्डर</span>
                            <span class="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill px-2 py-0.5" style="font-size: 0.65rem;">विज़ुअल पिकर</span>
                        </h6>
                        <p class="text-muted small mb-2.5" style="font-size: 0.72rem;">प्रत्येक रंग को अलग-अलग पिक करें, नया रंग जोड़ें या अपनी पसंद का कस्टम ब्रांड पैलेट बनाकर पूरे डैशबोर्ड पर अप्लाई करें।</p>

                        <!-- Seed Color & Quick Auto Harmony -->
                        <div class="p-2 mb-3 rounded-3 bg-light border">
                            <div class="d-flex align-items-center justify-content-between gap-2">
                                <div class="d-flex align-items-center gap-2">
                                    <input type="color" id="custom-theme-picker" class="form-control form-control-color" style="width: 36px; height: 32px; border-radius: 8px; padding: 2px;" value="#8b5cf6">
                                    <div>
                                        <div class="fw-bold text-dark" style="font-size: 0.75rem;">प्राइमरी सीड कलर</div>
                                        <div class="text-muted" style="font-size: 0.68rem;">स्वचालित हारमनी बनाएं</div>
                                    </div>
                                </div>
                                <button id="btn-generate-harmony" class="btn btn-sm btn-outline-primary fw-semibold py-1 px-2" style="font-size: 0.7rem; border-radius: 6px;">
                                    <i class="bi bi-magic me-1"></i> ऑटो हारमनी
                                </button>
                            </div>
                        </div>

                        <!-- Interactive Visual Color Swatches -->
                        <div class="mb-3">
                            <div class="d-flex justify-content-between align-items-center mb-1.5">
                                <label class="small text-slate-700 fw-bold" style="font-size: 0.75rem;">पैलेट कलर्स (<span id="swatches-count">5</span>):</label>
                                <button id="btn-add-swatch" class="btn btn-xs btn-primary fw-bold py-1 px-2" style="font-size: 11px; border-radius: 6px;">
                                    <i class="bi bi-plus-circle me-1"></i> + रंग जोड़ें
                                </button>
                            </div>

                            <!-- Swatches List Grid -->
                            <div id="palette-swatches-grid" class="d-flex flex-wrap gap-2 py-1">
                                <!-- Dynamic swatches rendered by JS -->
                            </div>
                        </div>
                        
                        <!-- 5 Industry Standard Professional Color Schemes -->
                        <div class="p-2.5 mb-3 rounded-3 bg-white border shadow-xs text-start">
                            <label class="small text-slate-800 fw-bold d-block mb-2" style="font-size: 0.75rem;">
                                <i class="bi bi-award-fill text-primary me-1"></i> इंडस्ट्री स्टैंडर्ड स्कीम्स (Industry Standard Schemes):
                            </label>
                            <div class="d-flex flex-column gap-1.5">
                                <button type="button" class="btn btn-sm btn-outline-dark brand-preset-btn text-start d-flex justify-content-between align-items-center py-1.5 px-2.5 rounded-3 shadow-xs" data-preset="#2563eb" data-palette='["#1e3a8a","#2563eb","#3b82f6","#60a5fa","#93c5fd"]' data-scheme-name="Corporate Blue">
                                    <span class="fw-semibold" style="font-size: 0.72rem;"><i class="bi bi-building me-1 text-primary"></i> Corporate Blue</span>
                                    <div class="d-flex gap-1">
                                        <span style="width: 10px; height: 10px; background: #1e3a8a; border-radius: 50%; border: 1px solid rgba(0,0,0,0.1);"></span>
                                        <span style="width: 10px; height: 10px; background: #2563eb; border-radius: 50%; border: 1px solid rgba(0,0,0,0.1);"></span>
                                        <span style="width: 10px; height: 10px; background: #3b82f6; border-radius: 50%; border: 1px solid rgba(0,0,0,0.1);"></span>
                                        <span style="width: 10px; height: 10px; background: #60a5fa; border-radius: 50%; border: 1px solid rgba(0,0,0,0.1);"></span>
                                        <span style="width: 10px; height: 10px; background: #93c5fd; border-radius: 50%; border: 1px solid rgba(0,0,0,0.1);"></span>
                                    </div>
                                </button>
                                <button type="button" class="btn btn-sm btn-outline-dark brand-preset-btn text-start d-flex justify-content-between align-items-center py-1.5 px-2.5 rounded-3 shadow-xs" data-preset="#06b6d4" data-palette='["#06b6d4","#8b5cf6","#ec4899","#f59e0b","#10b981"]' data-scheme-name="Vibrant Tech">
                                    <span class="fw-semibold" style="font-size: 0.72rem;"><i class="bi bi-cpu me-1 text-info"></i> Vibrant Tech</span>
                                    <div class="d-flex gap-1">
                                        <span style="width: 10px; height: 10px; background: #06b6d4; border-radius: 50%; border: 1px solid rgba(0,0,0,0.1);"></span>
                                        <span style="width: 10px; height: 10px; background: #8b5cf6; border-radius: 50%; border: 1px solid rgba(0,0,0,0.1);"></span>
                                        <span style="width: 10px; height: 10px; background: #ec4899; border-radius: 50%; border: 1px solid rgba(0,0,0,0.1);"></span>
                                        <span style="width: 10px; height: 10px; background: #f59e0b; border-radius: 50%; border: 1px solid rgba(0,0,0,0.1);"></span>
                                        <span style="width: 10px; height: 10px; background: #10b981; border-radius: 50%; border: 1px solid rgba(0,0,0,0.1);"></span>
                                    </div>
                                </button>
                                <button type="button" class="btn btn-sm btn-outline-dark brand-preset-btn text-start d-flex justify-content-between align-items-center py-1.5 px-2.5 rounded-3 shadow-xs" data-preset="#0284c7" data-palette='["#0f172a","#334155","#475569","#0284c7","#38bdf8"]' data-scheme-name="Dark Mode Professional">
                                    <span class="fw-semibold" style="font-size: 0.72rem;"><i class="bi bi-moon-stars me-1 text-secondary"></i> Dark Mode Professional</span>
                                    <div class="d-flex gap-1">
                                        <span style="width: 10px; height: 10px; background: #0f172a; border-radius: 50%; border: 1px solid rgba(0,0,0,0.1);"></span>
                                        <span style="width: 10px; height: 10px; background: #334155; border-radius: 50%; border: 1px solid rgba(0,0,0,0.1);"></span>
                                        <span style="width: 10px; height: 10px; background: #475569; border-radius: 50%; border: 1px solid rgba(0,0,0,0.1);"></span>
                                        <span style="width: 10px; height: 10px; background: #0284c7; border-radius: 50%; border: 1px solid rgba(0,0,0,0.1);"></span>
                                        <span style="width: 10px; height: 10px; background: #38bdf8; border-radius: 50%; border: 1px solid rgba(0,0,0,0.1);"></span>
                                    </div>
                                </button>
                                <button type="button" class="btn btn-sm btn-outline-dark brand-preset-btn text-start d-flex justify-content-between align-items-center py-1.5 px-2.5 rounded-3 shadow-xs" data-preset="#047857" data-palette='["#047857","#10b981","#34d399","#059669","#065f46"]' data-scheme-name="Emerald Finance">
                                    <span class="fw-semibold" style="font-size: 0.72rem;"><i class="bi bi-currency-dollar me-1 text-success"></i> Emerald Finance</span>
                                    <div class="d-flex gap-1">
                                        <span style="width: 10px; height: 10px; background: #047857; border-radius: 50%; border: 1px solid rgba(0,0,0,0.1);"></span>
                                        <span style="width: 10px; height: 10px; background: #10b981; border-radius: 50%; border: 1px solid rgba(0,0,0,0.1);"></span>
                                        <span style="width: 10px; height: 10px; background: #34d399; border-radius: 50%; border: 1px solid rgba(0,0,0,0.1);"></span>
                                        <span style="width: 10px; height: 10px; background: #059669; border-radius: 50%; border: 1px solid rgba(0,0,0,0.1);"></span>
                                        <span style="width: 10px; height: 10px; background: #065f46; border-radius: 50%; border: 1px solid rgba(0,0,0,0.1);"></span>
                                    </div>
                                </button>
                                <button type="button" class="btn btn-sm btn-outline-dark brand-preset-btn text-start d-flex justify-content-between align-items-center py-1.5 px-2.5 rounded-3 shadow-xs" data-preset="#ea580c" data-palette='["#c2410c","#ea580c","#f97316","#fb923c","#f59e0b"]' data-scheme-name="Warm Sunset Exec">
                                    <span class="fw-semibold" style="font-size: 0.72rem;"><i class="bi bi-brightness-high me-1 text-warning"></i> Warm Sunset Exec</span>
                                    <div class="d-flex gap-1">
                                        <span style="width: 10px; height: 10px; background: #c2410c; border-radius: 50%; border: 1px solid rgba(0,0,0,0.1);"></span>
                                        <span style="width: 10px; height: 10px; background: #ea580c; border-radius: 50%; border: 1px solid rgba(0,0,0,0.1);"></span>
                                        <span style="width: 10px; height: 10px; background: #f97316; border-radius: 50%; border: 1px solid rgba(0,0,0,0.1);"></span>
                                        <span style="width: 10px; height: 10px; background: #fb923c; border-radius: 50%; border: 1px solid rgba(0,0,0,0.1);"></span>
                                        <span style="width: 10px; height: 10px; background: #f59e0b; border-radius: 50%; border: 1px solid rgba(0,0,0,0.1);"></span>
                                    </div>
                                </button>
                            </div>
                        </div>

                        <!-- Presets -->
                        <div class="mb-3">
                            <label class="small text-slate-600 fw-medium d-block mb-1.5" style="font-size: 0.72rem;">अन्य रेडीमेड पैलेट्स (Other Quick Presets):</label>
                            <div class="d-flex flex-wrap gap-1.5">
                                <button class="btn btn-xs btn-outline-secondary brand-preset-btn" data-preset="#f59e0b" data-palette='["#f59e0b","#10b981","#3b82f6","#ec4899","#8b5cf6"]' style="font-size: 10px; padding: 3px 8px; border-radius: 6px;">Amber Gold</button>
                                <button class="btn btn-xs btn-outline-secondary brand-preset-btn" data-preset="#0ea5e9" data-palette='["#0ea5e9","#3b82f6","#6366f1","#8b5cf6","#06b6d4"]' style="font-size: 10px; padding: 3px 8px; border-radius: 6px;">Ocean Blue</button>
                                <button class="btn btn-xs btn-outline-secondary brand-preset-btn" data-preset="#10b981" data-palette='["#10b981","#059669","#34d399","#14b8a6","#84cc16"]' style="font-size: 10px; padding: 3px 8px; border-radius: 6px;">Emerald Forest</button>
                                <button class="btn btn-xs btn-outline-secondary brand-preset-btn" data-preset="#8b5cf6" data-palette='["#8b5cf6","#ec4899","#a855f7","#6366f1","#3b82f6"]' style="font-size: 10px; padding: 3px 8px; border-radius: 6px;">Cosmic Violet</button>
                                <button class="btn btn-xs btn-outline-secondary brand-preset-btn" data-preset="#ec4899" data-palette='["#ec4899","#f43f5e","#fb7185","#e11d48","#be123c"]' style="font-size: 10px; padding: 3px 8px; border-radius: 6px;">Rose Garden</button>
                                <button class="btn btn-xs btn-outline-secondary brand-preset-btn" data-preset="#ff007f" data-palette='["#ff007f","#00f0ff","#7f00ff","#39ff14","#ff9900"]' style="font-size: 10px; padding: 3px 8px; border-radius: 6px;">Neon Glow</button>
                            </div>
                        </div>

                        <div class="d-flex gap-2">
                            <button id="btn-apply-custom-theme" class="btn btn-primary btn-sm flex-fill py-2 fw-bold shadow-sm" style="border-radius: 8px; font-size: 0.8rem;">
                                <i class="bi bi-check-circle me-1.5"></i> पैलेट लागू करें
                            </button>
                            <button id="btn-reset-custom-theme" class="btn btn-outline-danger btn-sm py-2 px-2.5 fw-bold" style="border-radius: 8px; font-size: 0.8rem;" title="मूल थीम पर रीसेट करें">
                                <i class="bi bi-arrow-counterclockwise me-1"></i> रीसेट
                            </button>
                        </div>
                    </div>

                    <!-- 2.1 display Mode (Dark/Light Switcher) -->
                    <div class="card border-0 mb-3 shadow-sm text-start" style="border-radius: 12px; border: 1px solid #e2e8f0; background: #ffffff;">
                        <div class="card-body p-3">
                            <h6 class="card-title text-slate-800 fw-bold mb-2 small" style="font-family: var(--font-display);"><i class="bi bi-brightness-high-fill text-warning"></i> डिस्प्ले मोड (Display Mode)</h6>
                            <p class="text-muted small" style="font-size: 0.72rem; margin-bottom: 0.75rem;">डैशबोर्ड थीम स्विच करें:</p>
                            <div class="btn-group w-100" role="group">
                                <button class="btn btn-light border py-1.5 px-3" id="btn-theme-mode-light" title="लाइट मोड (Light Mode)">
                                    <i class="bi bi-sun-fill text-warning" style="font-size: 1.1rem;"></i> <span class="ms-1" style="font-size: 0.75rem;">लाइट</span>
                                </button>
                                <button class="btn btn-light border py-1.5 px-3" id="btn-theme-mode-dark" title="डार्क मोड (Dark Mode)">
                                    <i class="bi bi-moon-stars-fill text-primary" style="font-size: 1.1rem;"></i> <span class="ms-1" style="font-size: 0.75rem;">डार्क</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- 2.2 Typography Selector -->
                    <div class="card border-0 mb-3 shadow-sm text-start" style="border-radius: 12px; border: 1px solid #e2e8f0; background: #ffffff; position: relative; z-index: 1000;">
                        <div class="card-body p-3">
                            <h6 class="card-title text-slate-800 fw-bold mb-2 small" style="font-family: var(--font-display);"><i class="bi bi-fonts text-info"></i> फॉन्ट स्टाइल (Typography)</h6>
                            <p class="text-muted small" style="font-size: 0.72rem; margin-bottom: 0.75rem;">डैशबोर्ड फॉन्ट चुनें:</p>
                            <select class="form-select text-xs py-2 fw-medium" id="theme-font-family-selector" style="border-radius: 8px; font-size: 0.78rem; position: relative; z-index: 10000; cursor: pointer;">
                                <option value="inter">Inter (Balanced & Clean)</option>
                                <option value="space-grotesk">Space Grotesk (Tech Style)</option>
                                <option value="jetbrains-mono">JetBrains Mono (Developer Coding)</option>
                                <option value="playfair-display">Playfair Display (Elegant Serif)</option>
                            </select>
                        </div>
                    </div>

                    <!-- 2.3 Border Radius & Shadows -->
                    <div class="card border-0 mb-3 shadow-sm text-start" style="border-radius: 12px; border: 1px solid #e2e8f0; background: #ffffff;">
                        <div class="card-body p-3">
                            <h6 class="card-title text-slate-800 fw-bold mb-2 small" style="font-family: var(--font-display);"><i class="bi bi-bounding-box-circles text-success"></i> लेआउट और छाया (Layout Style)</h6>
                            
                            <div class="mb-3">
                                <div class="d-flex justify-content-between mb-1">
                                    <label class="small text-slate-600 fw-medium" style="font-size: 0.72rem;">बॉर्डर रेडियस: <span id="label-border-radius-val" class="fw-bold text-primary">12px</span></label>
                                </div>
                                <input type="range" class="form-range" id="slider-theme-border-radius" min="0" max="30" step="2" value="12" style="height: 6px;">
                            </div>
                            
                            <div>
                                <label class="small text-slate-600 fw-medium d-block mb-1.5" style="font-size: 0.72rem;">छाया प्रभाव (Shadow):</label>
                                <div class="btn-group w-100" role="group">
                                    <button class="btn btn-light border btn-sm shadow-btn d-flex align-items-center justify-content-center gap-1 py-2" data-shadow="none" title="कोई छाया नहीं">
                                        <i class="bi bi-square" style="font-size: 0.9rem;"></i> <span style="font-size: 0.72rem;">None</span>
                                    </button>
                                    <button class="btn btn-light border btn-sm shadow-btn d-flex align-items-center justify-content-center gap-1 py-2" data-shadow="soft" title="हल्की छाया">
                                        <i class="bi bi-square-half" style="font-size: 0.9rem;"></i> <span style="font-size: 0.72rem;">Soft</span>
                                    </button>
                                    <button class="btn btn-light border btn-sm shadow-btn d-flex align-items-center justify-content-center gap-1 py-2" data-shadow="deep" title="गहरी छाया">
                                        <i class="bi bi-square-fill" style="font-size: 0.9rem;"></i> <span style="font-size: 0.72rem;">Deep</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 3. Premium Ready-made Templates -->
                    <div class="card border-0 mb-3 shadow-sm text-start" style="border-radius: 12px; border: 1px solid #e2e8f0; background: #ffffff;">
                        <div class="card-body p-3">
                            <h6 class="card-title text-slate-800 fw-bold mb-2 small" style="font-family: var(--font-display);"><i class="bi bi-stars text-primary"></i> रेडीमेड थीम टेम्पलेट्स (Ready-made Templates)</h6>
                            <p class="text-muted small" style="font-size: 0.72rem; margin-bottom: 0.75rem;">एक क्लिक में पूरा डैशबोर्ड और यूआई लुक बदलें:</p>
                            
                            <div class="d-flex flex-column gap-2" id="ready-made-templates-container">
                                <!-- 1. Royal Sapphire -->
                                <button class="btn btn-light border p-2 text-start d-flex justify-content-between align-items-center w-100 template-preset-row-btn" data-template-primary="#2563eb" data-template-palette='["#2563eb", "#3b82f6", "#60a5fa", "#93c5fd", "#1e40af"]' style="border-radius: 10px; transition: all 0.2s;">
                                    <div class="d-flex align-items-center gap-2">
                                        <div class="rounded-circle" style="width: 14px; height: 14px; background-color: #2563eb;"></div>
                                        <span class="fw-semibold text-slate-700" style="font-size: 0.75rem;">शाही नीलम (Royal Sapphire)</span>
                                    </div>
                                    <div class="d-flex gap-0.5">
                                        <span class="rounded-circle" style="width: 8px; height: 8px; background-color: #2563eb;"></span>
                                        <span class="rounded-circle" style="width: 8px; height: 8px; background-color: #3b82f6;"></span>
                                        <span class="rounded-circle" style="width: 8px; height: 8px; background-color: #60a5fa;"></span>
                                        <span class="rounded-circle" style="width: 8px; height: 8px; background-color: #93c5fd;"></span>
                                        <span class="rounded-circle" style="width: 8px; height: 8px; background-color: #1e40af;"></span>
                                    </div>
                                </button>
                                
                                <!-- 2. Emerald Forest -->
                                <button class="btn btn-light border p-2 text-start d-flex justify-content-between align-items-center w-100 template-preset-row-btn" data-template-primary="#059669" data-template-palette='["#059669", "#10b981", "#34d399", "#6ee7b7", "#065f46"]' style="border-radius: 10px; transition: all 0.2s;">
                                    <div class="d-flex align-items-center gap-2">
                                        <div class="rounded-circle" style="width: 14px; height: 14px; background-color: #059669;"></div>
                                        <span class="fw-semibold text-slate-700" style="font-size: 0.75rem;">वन्य पन्ना (Emerald Forest)</span>
                                    </div>
                                    <div class="d-flex gap-0.5">
                                        <span class="rounded-circle" style="width: 8px; height: 8px; background-color: #059669;"></span>
                                        <span class="rounded-circle" style="width: 8px; height: 8px; background-color: #10b981;"></span>
                                        <span class="rounded-circle" style="width: 8px; height: 8px; background-color: #34d399;"></span>
                                        <span class="rounded-circle" style="width: 8px; height: 8px; background-color: #6ee7b7;"></span>
                                        <span class="rounded-circle" style="width: 8px; height: 8px; background-color: #065f46;"></span>
                                    </div>
                                </button>

                                <!-- 3. Crimson Rose -->
                                <button class="btn btn-light border p-2 text-start d-flex justify-content-between align-items-center w-100 template-preset-row-btn" data-template-primary="#e11d48" data-template-palette='["#e11d48", "#f43f5e", "#fb7185", "#fda4af", "#9f1239"]' style="border-radius: 10px; transition: all 0.2s;">
                                    <div class="d-flex align-items-center gap-2">
                                        <div class="rounded-circle" style="width: 14px; height: 14px; background-color: #e11d48;"></div>
                                        <span class="fw-semibold text-slate-700" style="font-size: 0.75rem;">सिंदूरी गुलाब (Crimson Rose)</span>
                                    </div>
                                    <div class="d-flex gap-0.5">
                                        <span class="rounded-circle" style="width: 8px; height: 8px; background-color: #e11d48;"></span>
                                        <span class="rounded-circle" style="width: 8px; height: 8px; background-color: #f43f5e;"></span>
                                        <span class="rounded-circle" style="width: 8px; height: 8px; background-color: #fb7185;"></span>
                                        <span class="rounded-circle" style="width: 8px; height: 8px; background-color: #fda4af;"></span>
                                        <span class="rounded-circle" style="width: 8px; height: 8px; background-color: #9f1239;"></span>
                                    </div>
                                </button>

                                <!-- 4. Sunset Amber -->
                                <button class="btn btn-light border p-2 text-start d-flex justify-content-between align-items-center w-100 template-preset-row-btn" data-template-primary="#d97706" data-template-palette='["#d97706", "#f59e0b", "#fbbf24", "#fcd34d", "#78350f"]' style="border-radius: 10px; transition: all 0.2s;">
                                    <div class="d-flex align-items-center gap-2">
                                        <div class="rounded-circle" style="width: 14px; height: 14px; background-color: #d97706;"></div>
                                        <span class="fw-semibold text-slate-700" style="font-size: 0.75rem;">सूर्यास्त एम्बर (Sunset Amber)</span>
                                    </div>
                                    <div class="d-flex gap-0.5">
                                        <span class="rounded-circle" style="width: 8px; height: 8px; background-color: #d97706;"></span>
                                        <span class="rounded-circle" style="width: 8px; height: 8px; background-color: #f59e0b;"></span>
                                        <span class="rounded-circle" style="width: 8px; height: 8px; background-color: #fbbf24;"></span>
                                        <span class="rounded-circle" style="width: 8px; height: 8px; background-color: #fcd34d;"></span>
                                        <span class="rounded-circle" style="width: 8px; height: 8px; background-color: #78350f;"></span>
                                    </div>
                                </button>

                                <!-- 5. Cosmic Violet -->
                                <button class="btn btn-light border p-2 text-start d-flex justify-content-between align-items-center w-100 template-preset-row-btn" data-template-primary="#7c3aed" data-template-palette='["#7c3aed", "#8b5cf6", "#a78bfa", "#c4b5fd", "#4c1d95"]' style="border-radius: 10px; transition: all 0.2s;">
                                    <div class="d-flex align-items-center gap-2">
                                        <div class="rounded-circle" style="width: 14px; height: 14px; background-color: #7c3aed;"></div>
                                        <span class="fw-semibold text-slate-700" style="font-size: 0.75rem;">ब्रह्मांडीय बैंगनी (Cosmic Violet)</span>
                                    </div>
                                    <div class="d-flex gap-0.5">
                                        <span class="rounded-circle" style="width: 8px; height: 8px; background-color: #7c3aed;"></span>
                                        <span class="rounded-circle" style="width: 8px; height: 8px; background-color: #8b5cf6;"></span>
                                        <span class="rounded-circle" style="width: 8px; height: 8px; background-color: #a78bfa;"></span>
                                        <span class="rounded-circle" style="width: 8px; height: 8px; background-color: #c4b5fd;"></span>
                                        <span class="rounded-circle" style="width: 8px; height: 8px; background-color: #4c1d95;"></span>
                                    </div>
                                </button>

                                <!-- 6. Carbon Midnight -->
                                <button class="btn btn-light border p-2 text-start d-flex justify-content-between align-items-center w-100 template-preset-row-btn" data-template-primary="#4b5563" data-template-palette='["#4b5563", "#6b7280", "#9ca3af", "#d1d5db", "#1f2937"]' style="border-radius: 10px; transition: all 0.2s;">
                                    <div class="d-flex align-items-center gap-2">
                                        <div class="rounded-circle" style="width: 14px; height: 14px; background-color: #4b5563;"></div>
                                        <span class="fw-semibold text-slate-700" style="font-size: 0.75rem;">आधी रात का कोयला (Carbon Midnight)</span>
                                    </div>
                                    <div class="d-flex gap-0.5">
                                        <span class="rounded-circle" style="width: 8px; height: 8px; background-color: #4b5563;"></span>
                                        <span class="rounded-circle" style="width: 8px; height: 8px; background-color: #6b7280;"></span>
                                        <span class="rounded-circle" style="width: 8px; height: 8px; background-color: #9ca3af;"></span>
                                        <span class="rounded-circle" style="width: 8px; height: 8px; background-color: #d1d5db;"></span>
                                        <span class="rounded-circle" style="width: 8px; height: 8px; background-color: #1f2937;"></span>
                                    </div>
                                </button>

                                 <!-- 7. Ocean Teal -->
                                <button class="btn btn-light border p-2 text-start d-flex justify-content-between align-items-center w-100 template-preset-row-btn" data-template-primary="#0d9488" data-template-palette='["#0d9488", "#14b8a6", "#2dd4bf", "#5eead4", "#115e59"]' style="border-radius: 10px; transition: all 0.2s;">
                                    <div class="d-flex align-items-center gap-2">
                                        <div class="rounded-circle" style="width: 14px; height: 14px; background-color: #0d9488;"></div>
                                        <span class="fw-semibold text-slate-700" style="font-size: 0.75rem;">समुद्री चैती (Ocean Teal)</span>
                                    </div>
                                    <div class="d-flex gap-0.5">
                                        <span class="rounded-circle" style="width: 8px; height: 8px; background-color: #0d9488;"></span>
                                        <span class="rounded-circle" style="width: 8px; height: 8px; background-color: #14b8a6;"></span>
                                        <span class="rounded-circle" style="width: 8px; height: 8px; background-color: #2dd4bf;"></span>
                                        <span class="rounded-circle" style="width: 8px; height: 8px; background-color: #5eead4;"></span>
                                        <span class="rounded-circle" style="width: 8px; height: 8px; background-color: #115e59;"></span>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
  `,
  "templateGalleryContent": `
    <div id="templateGalleryContainer">
        <!-- Rendered dynamically by templateCards.ts -->
    </div>
  `,
  "templateCustomizerContent": `
    <div id="templateCustomizerContainer">
        <!-- Rendered dynamically by templateCards.ts -->
    </div>
  `
};
