/**
 * Vedra BI Welcome Modal & Sample Data Quick Start Manager
 * Handles post-onboarding summary modal and 1-click sample data seeding.
 * Fully supports English, Hindi, and Gujarati.
 */

import { showMessage } from '../core/utils.ts';
import { OnboardingManager } from './onboardingManager.js';
import { 
    saveUserDataToFirebase, 
    getRawData, 
    headers, 
    rawData, 
    filteredData, 
    savedFilteredData 
} from '../../store/DataHandler.ts';
import { updateTableAndUI, updateControls } from '../../store/UIHandler.js';
import { generateSummary } from '../ai/chat.ts';
import { t, getCurrentLanguage } from '../i18n/index.ts';

export const SAMPLE_BI_DATASET = {
    headers: ["Date", "Category", "Product Name", "Sales (₹)", "Units Sold", "Region", "Customer Segment", "Satisfaction Rating"],
    data: [
        {"Date": "2026-01-05", "Category": "Electronics", "Product Name": "Smart LED Monitor 27inch", "Sales (₹)": 24500, "Units Sold": 2, "Region": "North India", "Customer Segment": "Corporate", "Satisfaction Rating": 4.8},
        {"Date": "2026-01-08", "Category": "Office Supplies", "Product Name": "Ergonomic Mesh Chair", "Sales (₹)": 12800, "Units Sold": 4, "Region": "West India", "Customer Segment": "Small Business", "Satisfaction Rating": 4.5},
        {"Date": "2026-01-12", "Category": "Software", "Product Name": "Vedra Cloud License (1 Yr)", "Sales (₹)": 45000, "Units Sold": 10, "Region": "South India", "Customer Segment": "Enterprise", "Satisfaction Rating": 4.9},
        {"Date": "2026-01-15", "Category": "Electronics", "Product Name": "Wireless Mechanical Keyboard", "Sales (₹)": 8900, "Units Sold": 5, "Region": "East India", "Customer Segment": "Retail", "Satisfaction Rating": 4.6},
        {"Date": "2026-01-18", "Category": "Services", "Product Name": "BI Analytics Consulting", "Sales (₹)": 75000, "Units Sold": 1, "Region": "North India", "Customer Segment": "Enterprise", "Satisfaction Rating": 5.0},
        {"Date": "2026-01-22", "Category": "Office Supplies", "Product Name": "Standing Desk Converter", "Sales (₹)": 18200, "Units Sold": 3, "Region": "West India", "Customer Segment": "Corporate", "Satisfaction Rating": 4.7},
        {"Date": "2026-01-25", "Category": "Software", "Product Name": "AI Reporting Plugin", "Sales (₹)": 32000, "Units Sold": 8, "Region": "South India", "Customer Segment": "Small Business", "Satisfaction Rating": 4.8},
        {"Date": "2026-02-01", "Category": "Electronics", "Product Name": "Noise Cancelling Headset", "Sales (₹)": 14500, "Units Sold": 6, "Region": "North India", "Customer Segment": "Retail", "Satisfaction Rating": 4.4},
        {"Date": "2026-02-05", "Category": "Services", "Product Name": "Dashboard Customization", "Sales (₹)": 55000, "Units Sold": 2, "Region": "West India", "Customer Segment": "Enterprise", "Satisfaction Rating": 4.9},
        {"Date": "2026-02-10", "Category": "Office Supplies", "Product Name": "High-Speed Document Scanner", "Sales (₹)": 28900, "Units Sold": 2, "Region": "South India", "Customer Segment": "Corporate", "Satisfaction Rating": 4.6},
        {"Date": "2026-02-14", "Category": "Electronics", "Product Name": "Ultra-Wide Curved Display", "Sales (₹)": 58000, "Units Sold": 3, "Region": "West India", "Customer Segment": "Enterprise", "Satisfaction Rating": 4.9},
        {"Date": "2026-02-18", "Category": "Software", "Product Name": "Vedra AI Assistant Addon", "Sales (₹)": 21000, "Units Sold": 7, "Region": "North India", "Customer Segment": "Small Business", "Satisfaction Rating": 4.7},
        {"Date": "2026-02-22", "Category": "Services", "Product Name": "Data Warehousing Setup", "Sales (₹)": 95000, "Units Sold": 1, "Region": "South India", "Customer Segment": "Enterprise", "Satisfaction Rating": 5.0},
        {"Date": "2026-02-28", "Category": "Office Supplies", "Product Name": "Smart Paper Shredder", "Sales (₹)": 9400, "Units Sold": 4, "Region": "East India", "Customer Segment": "Retail", "Satisfaction Rating": 4.3}
    ]
};

export async function loadSampleDataIntoStore(userId) {
    try {
        const raw = getRawData();
        raw.length = 0;
        raw.push(...SAMPLE_BI_DATASET.data);

        headers.length = 0;
        headers.push(...SAMPLE_BI_DATASET.headers);

        filteredData.length = 0;
        filteredData.push(...raw);

        savedFilteredData.length = 0;
        savedFilteredData.push(...raw);

        updateControls(headers);
        await updateTableAndUI();

        if (userId) {
            saveUserDataToFirebase(raw, headers, false).catch(() => {});
        }

        if (raw.length > 0) {
            try { generateSummary(raw); } catch (e) {}
        }

        document.dispatchEvent(new CustomEvent('dataLoaded', {
            detail: {
                rowCount: raw.length,
                filteredRowCount: raw.length,
                headers: headers,
                isFilterActive: false
            }
        }));

        showMessage(t('welcomeModal.sampleLoadedToast', '🚀 Sample BI Dataset loaded successfully!'), "success");
        return true;
    } catch (err) {
        console.error("Error loading sample data:", err);
        showMessage("Error loading sample data: " + (err.message || err), "danger");
        return false;
    }
}

export function showWelcomeSummaryModal(onboardingData, userEmail, forceShow = false) {
    const email = userEmail || 'user@vedrabi.com';
    const storageKey = `vedrabi_welcome_shown_${email.toLowerCase().trim()}`;

    if (!forceShow && localStorage.getItem(storageKey) === 'true') {
        return; // Already shown
    }

    let modalEl = document.getElementById('welcomeSummaryModal');
    if (!modalEl) {
        modalEl = document.createElement('div');
        modalEl.id = 'welcomeSummaryModal';
        modalEl.className = 'modal fade';
        modalEl.setAttribute('tabindex', '-1');
        modalEl.setAttribute('aria-hidden', 'true');
        document.body.appendChild(modalEl);
    }

    const orgName = (onboardingData && onboardingData.organizationName) || 'My Workspace';
    const industry = (onboardingData && onboardingData.industry) || 'General Analytics';
    const role = (onboardingData && onboardingData.primaryRole) || 'Analytics User';

    modalEl.innerHTML = `
        <div class="modal-dialog modal-dialog-centered modal-lg">
            <div class="modal-content shadow-lg border-0 rounded-4 overflow-hidden">
                <!-- Header with Gradient and Brand Icon -->
                <div class="modal-header border-0 pb-0 text-white p-4" style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);">
                    <div class="d-flex align-items-center gap-3">
                        <div class="p-2.5 rounded-3 d-flex align-items-center justify-content-center shadow" style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); width: 48px; height: 48px;">
                            <i class="bi bi-stars fs-4 text-white"></i>
                        </div>
                        <div>
                            <h4 class="modal-title fw-bold mb-0 font-sans tracking-tight text-white">
                                ${t('welcomeModal.title', 'Welcome to Vedra BI Analytics')}
                            </h4>
                            <p class="text-white-50 small mb-0 mt-0.5">
                                ${t('welcomeModal.subtitle', 'Your workspace profile is customized and ready for high-impact decision making.')}
                            </p>
                        </div>
                    </div>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>

                <div class="modal-body p-4 bg-light">
                    <!-- Profile Summary Card -->
                    <div class="card border-0 shadow-sm rounded-3 mb-3 bg-white">
                        <div class="card-body p-3">
                            <div class="row g-2 text-center text-md-start">
                                <div class="col-12 col-md-4 border-end-md">
                                    <span class="text-muted text-uppercase fw-semibold" style="font-size: 0.7rem; letter-spacing: 0.05em;">
                                        ${t('welcomeModal.workspaceName', 'Workspace / Organization')}
                                    </span>
                                    <div class="fw-bold text-slate-800 text-truncate fs-6 mt-0.5">
                                        <i class="bi bi-building text-primary me-1"></i> ${orgName}
                                    </div>
                                </div>
                                <div class="col-12 col-md-4 border-end-md">
                                    <span class="text-muted text-uppercase fw-semibold" style="font-size: 0.7rem; letter-spacing: 0.05em;">
                                        ${t('welcomeModal.domainSector', 'Domain / Sector')}
                                    </span>
                                    <div class="fw-bold text-slate-800 text-truncate fs-6 mt-0.5">
                                        <i class="bi bi-briefcase text-purple-600 me-1"></i> ${industry}
                                    </div>
                                </div>
                                <div class="col-12 col-md-4">
                                    <span class="text-muted text-uppercase fw-semibold" style="font-size: 0.7rem; letter-spacing: 0.05em;">
                                        ${t('welcomeModal.userRole', 'User Role')}
                                    </span>
                                    <div class="fw-bold text-slate-800 text-truncate fs-6 mt-0.5">
                                        <i class="bi bi-person-badge text-emerald-600 me-1"></i> ${role}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 3 Feature Highlight Tiles -->
                    <div class="mb-3">
                        <div class="row g-2">
                            <div class="col-12 col-md-4">
                                <div class="p-2.5 rounded h-100" style="background: rgba(37, 99, 235, 0.04); border: 1px solid rgba(37, 99, 235, 0.15);">
                                    <div class="d-flex align-items-center gap-2 mb-1">
                                        <span class="badge bg-primary rounded-circle p-0 d-flex align-items-center justify-content-center" style="width: 20px; height: 20px; font-size: 11px;">1</span>
                                        <span class="fw-bold text-slate-800 small">${t('welcomeModal.step1Title', 'Visual Chart Builder')}</span>
                                    </div>
                                    <div class="text-muted small" style="font-size: 0.72rem;">
                                        ${t('welcomeModal.step1Desc', 'Drag & drop attributes to build 30+ interactive charts.')}
                                    </div>
                                </div>
                            </div>
                            <div class="col-12 col-md-4">
                                <div class="p-2.5 rounded h-100" style="background: rgba(147, 51, 234, 0.04); border: 1px solid rgba(147, 51, 234, 0.15);">
                                    <div class="d-flex align-items-center gap-2 mb-1">
                                        <span class="badge bg-purple rounded-circle p-0 d-flex align-items-center justify-content-center" style="width: 20px; height: 20px; font-size: 11px;">2</span>
                                        <span class="fw-bold text-slate-800 small">${t('welcomeModal.step2Title', 'AI Business Advisor')}</span>
                                    </div>
                                    <div class="text-muted small" style="font-size: 0.72rem;">
                                        ${t('welcomeModal.step2Desc', 'Ask questions in plain language and get instant business insights.')}
                                    </div>
                                </div>
                            </div>
                            <div class="col-12 col-md-4">
                                <div class="p-2.5 rounded h-100" style="background: rgba(16, 185, 129, 0.04); border: 1px solid rgba(16, 185, 129, 0.15);">
                                    <div class="d-flex align-items-center gap-2 mb-1">
                                        <span class="badge bg-success rounded-circle p-0 d-flex align-items-center justify-content-center" style="width: 20px; height: 20px; font-size: 11px;">3</span>
                                        <span class="fw-bold text-slate-800 small">${t('welcomeModal.step3Title', '1-Click Report Export')}</span>
                                    </div>
                                    <div class="text-muted small" style="font-size: 0.72rem;">
                                        ${t('welcomeModal.step3Desc', 'Export formatted PDF & Excel reports with one click.')}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Quick Start Banner -->
                    <div class="p-3 rounded-3 text-center mb-1" style="background: linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 100%); border: 1px solid #bae6fd;">
                        <div class="fw-bold text-slate-800 mb-1" style="font-size: 0.9rem;">
                            <i class="bi bi-rocket-takeoff-fill text-success me-1"></i>
                            ${t('welcomeModal.demoDataHeader', 'Quick Start with Demo Sales Data')}
                        </div>
                        <div class="text-muted small mb-2" style="font-size: 0.78rem;">
                            ${t('welcomeModal.demoDataDesc', 'If you do not have a file ready, auto-load our sample BI dataset now:')}
                        </div>
                        <div class="d-flex justify-content-center gap-2 flex-wrap">
                            <button type="button" class="btn btn-sm btn-success fw-bold px-3 py-1.5 shadow-sm" id="btnWelcomeLoadSample">
                                <i class="bi bi-database-add me-1"></i> ${t('welcomeModal.btnLoadSample', '🚀 Auto-Load Sample Data')}
                            </button>
                            <button type="button" class="btn btn-sm btn-outline-primary fw-bold px-3 py-1.5" id="btnWelcomeUploadFile">
                                <i class="bi bi-upload me-1"></i> ${t('welcomeModal.btnUploadFile', '📁 Upload My Own File')}
                            </button>
                        </div>
                    </div>
                </div>

                <div class="modal-footer border-top-0 pt-0 pb-3 px-4 justify-content-between">
                    <button type="button" class="btn btn-link text-muted text-decoration-none small" data-bs-dismiss="modal">
                        ${t('common.close', 'Close')}
                    </button>
                    <button type="button" class="btn btn-primary fw-bold px-4 rounded-pill shadow-sm" id="btnWelcomeLaunch">
                        ${t('welcomeModal.btnLaunchDashboard', 'Launch Dashboard')} <i class="bi bi-arrow-right ms-1"></i>
                    </button>
                </div>
            </div>
        </div>
    `;

    const bsModal = new window.bootstrap.Modal(modalEl, { backdrop: 'static' });
    bsModal.show();

    localStorage.setItem(storageKey, 'true');

    // Attach Event Listeners inside modal
    const btnLoadSample = modalEl.querySelector('#btnWelcomeLoadSample');
    const btnUploadFile = modalEl.querySelector('#btnWelcomeUploadFile');
    const btnLaunch = modalEl.querySelector('#btnWelcomeLaunch');

    if (btnLoadSample) {
        btnLoadSample.addEventListener('click', async () => {
            await loadSampleDataIntoStore(email);
            bsModal.hide();
        });
    }

    if (btnUploadFile) {
        btnUploadFile.addEventListener('click', () => {
            bsModal.hide();
            const fileInput = document.getElementById('fileInput');
            if (fileInput) fileInput.click();
        });
    }

    if (btnLaunch) {
        btnLaunch.addEventListener('click', () => {
            bsModal.hide();
        });
    }
}

export function initializeWelcomeFlow(userEmail) {
    if (!userEmail) return;
    const onboarding = OnboardingManager.getOnboarding(userEmail);
    const urlParams = new URLSearchParams(window.location.search);
    const forceShow = urlParams.get('welcome') === 'true' || urlParams.get('onboarding') === 'complete';

    // Auto-load sample dataset if user chose it in onboarding
    if (onboarding && onboarding.loadSampleData) {
        const raw = getRawData();
        if (!raw || raw.length === 0) {
            loadSampleDataIntoStore(userEmail);
        }
    }

    if (onboarding || forceShow) {
        setTimeout(() => {
            showWelcomeSummaryModal(onboarding, userEmail, forceShow);
        }, 600);
    }
}

// Global exposure
if (typeof window !== 'undefined') {
    window.showWelcomeSummaryModal = showWelcomeSummaryModal;
    window.loadSampleDataIntoStore = loadSampleDataIntoStore;
}
