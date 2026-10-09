/**
 * Vedra BI - Data Editor Engine (TypeScript)
 * High-performance spreadsheet data manager with Luckysheet, Firestore sync,
 * IndexedDB high-capacity storage, debounced autosave, and memory-safe lifecycle cleanup.
 */

import { auth, db, showMessage } from './core/utils.ts';
import { vedraStorage, STORES } from './core/indexedDbStorage.ts';
import { SmartDataCompressor } from './core/smartDataCompressor.ts';
import { applyTheme as centralApplyTheme, toggleTheme as centralToggleTheme, initThemeBootstrap, isDarkMode, ThemeMode } from './core/themeManager.ts';

declare const luckysheet: any;
declare const firebase: any;

interface SheetExtractionResult {
    data: Record<string, any>[];
    headers: string[];
}

interface DraftPayload {
    sheetData: SheetExtractionResult;
    timestamp: number;
}

interface SecurityAccount {
    accountId?: string;
    securityPin?: string;
    pinHash?: string;
    salt?: string;
    updatedAt?: string;
}

// --- Lifecycle & Memory Leak Management (AbortController) ---
const pageLifecycleController = new AbortController();
let autoSaveTimer: ReturnType<typeof setTimeout> | null = null;
let isSheetDirty = false;

// Safe alert fallback to avoid sandbox iframe SecurityError crashes
function safeAlert(msg: string, type: 'info' | 'success' | 'warning' | 'danger' | 'error' = 'info'): void {
    try {
        if (typeof showMessage === 'function') {
            showMessage(msg, type);
        } else {
            console.log(`[Alert - ${type}] ${msg}`);
        }
    } catch (e) {
        console.warn("showMessage failed, falling back to console log: ", e);
    }
}

// --- Save Status UI Helper ---
function updateSaveStatus(status: 'saving' | 'saved' | 'unsaved' | 'draft'): void {
    const badge = document.getElementById('sheetSaveStatusBadge');
    const icon = document.getElementById('sheetSaveStatusIcon');
    const text = document.getElementById('sheetSaveStatusText');
    if (!badge || !icon || !text) return;

    if (status === 'saving') {
        icon.className = 'spinner-border spinner-border-sm text-warning';
        text.textContent = 'सेव हो रहा है...';
    } else if (status === 'saved') {
        icon.className = 'bi bi-check2-circle text-success';
        text.textContent = 'सहेजा गया (Saved)';
    } else if (status === 'unsaved') {
        icon.className = 'bi bi-pencil-fill text-warning';
        text.textContent = 'अनसाव्ड बदलाव';
    } else if (status === 'draft') {
        icon.className = 'bi bi-cloud-check-fill text-info';
        text.textContent = 'ड्राफ्ट सुरक्षित';
    }
}

// --- Theme Engine ---
export function initTheme(): void {
    initThemeBootstrap();
    const isDark = isDarkMode();
    const toggleIcon = document.querySelector('#themeToggleBtn i');
    if (toggleIcon) {
        toggleIcon.className = isDark ? 'bi bi-sun-fill' : 'bi bi-moon-fill';
    }
}

export function applyTheme(theme: string): void {
    centralApplyTheme(theme === 'dark' ? 'dark' : 'light', true);
    const isDark = theme === 'dark';
    const toggleIcon = document.querySelector('#themeToggleBtn i');
    if (toggleIcon) {
        toggleIcon.className = isDark ? 'bi bi-sun-fill' : 'bi bi-moon-fill';
    }
}

export function toggleTheme(): void {
    const next = centralToggleTheme(true);
    const isDark = next === 'dark';
    const toggleIcon = document.querySelector('#themeToggleBtn i');
    if (toggleIcon) {
        toggleIcon.className = isDark ? 'bi bi-sun-fill' : 'bi bi-moon-fill';
    }
}

// --- CSV Export Helper ---
export function exportSheetToCsv(): void {
    const sheetData = extractSheetData();
    if (!sheetData || !sheetData.headers || sheetData.headers.length === 0) {
        safeAlert("एक्सपोर्ट करने के लिए कोई वैध डेटा उपलब्ध नहीं है।", "warning");
        return;
    }

    const headers = sheetData.headers;
    const rows = sheetData.data || [];

    const escapeCsvCell = (val: any): string => {
        if (val === null || val === undefined) return '""';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
    };

    let csvContent = '\uFEFF'; // UTF-8 BOM for Excel Hindi/Unicode support
    csvContent += headers.map(escapeCsvCell).join(',') + '\r\n';

    rows.forEach(row => {
        const rowLine = headers.map(h => escapeCsvCell(row[h] !== undefined ? row[h] : '')).join(',');
        csvContent += rowLine + '\r\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vedrabi_sheet_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    safeAlert("CSV फ़ाइल सफलतापूर्वक डाउनलोड की गई!", "success");
}

function cleanupPageResources(): void {
    if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
        autoSaveTimer = null;
    }
    if (pageLifecycleController) {
        pageLifecycleController.abort();
    }
}

// --- Extraction Utility ---
export function extractSheetData(): SheetExtractionResult | null {
    if (typeof luckysheet === 'undefined') return null;
    const sheets = luckysheet.getAllSheets();
    if (!sheets || sheets.length === 0 || !sheets[0].data) return null;
    const luckySheetData = sheets[0].data;

    if (!luckySheetData || luckySheetData.length === 0) {
        return null;
    }

    // Map headers with their actual column indexes to prevent any alignment shifting
    const headerColMap: { name: string; colIndex: number }[] = [];
    const headers: string[] = [];
    const headerRow = luckySheetData[0];
    
    if (headerRow) {
        headerRow.forEach((cell: any, cIndex: number) => {
            if (cell) {
                const val = (cell.v !== undefined && cell.v !== null) ? cell.v : cell.m;
                if (val !== undefined && val !== null && String(val).trim() !== '') {
                    const headerName = String(val).trim();
                    headers.push(headerName);
                    headerColMap.push({ name: headerName, colIndex: cIndex });
                }
            }
        });
    }

    if (headers.length === 0) {
        return null;
    }
    
    const dataToSave: Record<string, any>[] = [];
    for (let r = 1; r < luckySheetData.length; r++) {
        const row = luckySheetData[r];
        if (row) {
            const rowObject: Record<string, any> = {};
            let hasAnyValue = false;
            
            headerColMap.forEach(hMap => {
                const cell = row[hMap.colIndex];
                if (cell) {
                    const val = cell.v !== undefined ? cell.v : cell.m;
                    if (val !== undefined && val !== null && String(val).trim() !== '') {
                        rowObject[hMap.name] = val;
                        hasAnyValue = true;
                    }
                }
            });
            
            if (hasAnyValue) {
                dataToSave.push(rowObject);
            }
        }
    }
    return { data: dataToSave, headers: headers };
}

// --- High-Performance Debounced Draft & Auto-save Engine (IndexedDB + Dirty Checking) ---
export async function saveDraftToIndexedDB(force = false): Promise<void> {
    if (!isSheetDirty && !force) return;

    const sheetData = extractSheetData();
    if (sheetData && sheetData.data.length > 0) {
        const payload: DraftPayload = {
            sheetData: sheetData,
            timestamp: Date.now()
        };

        // Asynchronously save to IndexedDB (No 5MB limit)
        await vedraStorage.setItem(STORES.DRAFTS, 'vedra_sheet_draft', payload);
        
        // Fallback / sync small draft marker to localStorage for instant check
        try {
            localStorage.setItem('vedra_sheet_draft_meta', JSON.stringify({
                timestamp: payload.timestamp,
                rowCount: sheetData.data.length
            }));
        } catch (_) {}

        isSheetDirty = false;
        updateSaveStatus('draft');
        console.log("[AutoSave] Draft saved to IndexedDB.");
    }
}

export function triggerDebouncedAutosave(): void {
    isSheetDirty = true;
    updateSaveStatus('unsaved');

    if (autoSaveTimer) clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(() => {
        saveDraftToIndexedDB(false);
    }, 1200); // 1.2s Debounce to keep UI 60fps
}

export async function checkAndShowDraftRecovery(): Promise<void> {
    try {
        let draft = await vedraStorage.getItem<DraftPayload>(STORES.DRAFTS, 'vedra_sheet_draft');
        if (!draft) {
            const legacy = localStorage.getItem('vedra_sheet_draft');
            if (legacy) draft = JSON.parse(legacy);
        }

        if (draft && draft.timestamp) {
            // Check if the draft is less than 24 hours old
            if (Date.now() - draft.timestamp < 24 * 60 * 60 * 1000) {
                const banner = document.getElementById('draft-recovery-banner');
                if (banner) banner.style.display = 'flex';
            }
        }
    } catch (e) {
        console.error("Failed to parse draft details:", e);
    }
}

export async function restoreDraft(): Promise<void> {
    try {
        let draft = await vedraStorage.getItem<DraftPayload>(STORES.DRAFTS, 'vedra_sheet_draft');
        if (!draft) {
            const legacy = localStorage.getItem('vedra_sheet_draft');
            if (legacy) draft = JSON.parse(legacy);
        }

        if (!draft || !draft.sheetData) {
            safeAlert('कोई पुनर्प्राप्त करने योग्य ड्राफ्ट नहीं मिला।', 'warning');
            return;
        }

        const sheetData = draft.sheetData;
        renderSheetWithData(sheetData.headers, sheetData.data);
        
        const banner = document.getElementById('draft-recovery-banner');
        if (banner) banner.style.display = 'none';
        updateSaveStatus('unsaved');
        safeAlert('अनसाव्ड ड्राफ्ट को सफलतापूर्वक पुनर्स्थापित किया गया!', 'success');
    } catch (e) {
        console.error("Failed to restore draft:", e);
        safeAlert('ड्राफ्ट पुनर्स्थापित करने में त्रुटि हुई।', 'danger');
    }
}

// --- Render Luckysheet Engine ---
export function renderSheetWithData(headers: string[], rawDataObjects: Record<string, any>[]): void {
    let luckyData: any[] = [{ celldata: [], name: 'Sheet1', row: 100, column: 20 }];
    
    if (headers && headers.length > 0) {
        const celldata: any[] = [];
        // Headers को celldata में बदलें (With proper Cell Object wrapper)
        headers.forEach((header, cIndex) => {
            celldata.push({ r: 0, c: cIndex, v: { v: header, m: String(header), ct: { fa: "General", t: "g" } } });
        });
        
        // Data rows को celldata में बदलें (With subtle editable background highlight & styling)
        if (rawDataObjects && rawDataObjects.length > 0) {
            rawDataObjects.forEach((rowObject, rIndex) => {
                headers.forEach((header, cIndex) => {
                    const value = rowObject[header];
                    if (value !== null && value !== undefined) {
                        celldata.push({ 
                            r: rIndex + 1, 
                            c: cIndex, 
                            v: { 
                                v: value, 
                                m: String(value), 
                                bg: "#f8faff", // Subtle editable highlight to clearly distinguish data cells
                                fc: "#1e293b",
                                ct: typeof value === 'number' ? { fa: "General", t: "n" } : { fa: "General", t: "g" } 
                            } 
                        });
                    }
                });
            });
        }
        
        luckyData = [{
            celldata: celldata,
            name: 'Sheet1',
            row: Math.max((rawDataObjects ? rawDataObjects.length : 0) + 500, 100),
            column: Math.max(headers.length + 100, 26),
        }];
    }

    luckysheet.create({
        container: 'luckysheet-container',
        data: luckyData,
        lang: 'en',
        
        // === UI Settings ===
        showtoolbar: true,
        showinfobar: true,
        showsheetbar: true,
        showstatisticBar: true,
        title: 'Vedra bi',
        
        // === Sheet Settings ===
        allowEdit: true,
        allowUpdate: true,
        showRowHeader: true,
        showColumnHeader: true,
        sheetFormulaBar: true,
        sheetFilter: true,
        sheetChart: true,
        
        // === Extra Features Enable ===
        enableAddRow: true, 
        enableAddCol: true, 
        allowCopy: true, 
        pivotTable: true, 
        imageInsert: true, 
        allowComments: true, 
        hyperlink: true, 
        dataValidation: true, 
        allowMultipleSheets: true, 
        cellAutoFill: true, 
        allowContextMenu: true, 
        allowSheetRename: true, 
        allowSheetDelete: true, 
        
        // Chart & Filter Options
        sheetFilterOptions: { showFilter: true },
        sheetChartOptions: { showChart: true },

        // Hook to track user modifications with debounced autosave
        hook: {
            cellUpdated: function() {
                triggerDebouncedAutosave();
            }
        }
    });
}

export async function loadDataForLuckysheet(): Promise<void> {
    const loadingOverlay = document.getElementById('loading-overlay');
    const user = auth.currentUser;

    const savedUserStr = localStorage.getItem('vedrabi_current_user');
    const localUser = savedUserStr ? JSON.parse(savedUserStr) : null;
    const activeUid = user ? user.uid : (localUser ? localUser.uid : null);

    if (!activeUid) {
        safeAlert("डेटा एडिट करने के लिए कृपया लॉगिन करें।", "warning");
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
        return;
    }

    if (loadingOverlay) loadingOverlay.style.display = 'flex';
    try {
        if (typeof luckysheet === 'undefined') {
            throw new Error("Luckysheet library failed to load from CDN. Please check your network connection or try refreshing.");
        }

        let headers: string[] = [];
        let rawDataObjects: Record<string, any>[] = [];

        try {
            const doc = await db.collection('users').doc(activeUid).get();
            if (doc.exists) {
                const userData = doc.data();
                rawDataObjects = userData.data || [];
                headers = userData.headers || [];
            }
        } catch (dbErr) {
            console.warn("Firestore fetch offline fallback:", dbErr);
        }

        // Fallback to IndexedDB / localStorage if Firestore has no data or offline
        if ((!headers || headers.length === 0) && (!rawDataObjects || rawDataObjects.length === 0)) {
            // Try IndexedDB first (High Capacity)
            const idbDataset = await vedraStorage.getItem<Record<string, any>[]>(STORES.DATASETS, `user_dataset_${activeUid}`);
            if (idbDataset && Array.isArray(idbDataset) && idbDataset.length > 0) {
                rawDataObjects = idbDataset;
                headers = Object.keys(idbDataset[0]);
            } else {
                const uploadedDataStr = localStorage.getItem('uploadedData');
                if (uploadedDataStr) {
                    try {
                        const parsed = JSON.parse(uploadedDataStr);
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            rawDataObjects = parsed;
                            headers = Object.keys(parsed[0]);
                        }
                    } catch (_) {}
                }
            }
        }

        renderSheetWithData(headers, rawDataObjects);
        console.log("Luckysheet created successfully.");
        updateSaveStatus('saved');
        
        // Check if a backup draft is available
        await checkAndShowDraftRecovery();

    } catch (error: any) {
        console.error("Error loading data for Luckysheet:", error);
        if (loadingOverlay) {
            loadingOverlay.style.backgroundColor = '#2d1a1c';
            loadingOverlay.style.color = '#f8d7da';
            loadingOverlay.innerHTML = `
                <div style="padding: 24px; text-align: center; max-width: 500px; border: 1px solid #dc3545; background: #1d1213; border-radius: 8px;">
                    <h4 style="color: #ea868f;">⚠️ डेटा लोड करने में त्रुटि (Error Loading Data)</h4>
                    <p style="font-family: monospace; font-size: 13px; margin-top: 12px; background: rgba(0,0,0,0.3); padding: 8px; border-radius: 4px; text-align: left; word-break: break-all;">${error.message || error}</p>
                    <button class="btn btn-secondary mt-3" id="errorBackBtn" style="padding: 5px 15px !important; font-size:12px !important; height:auto !important;"><i class="bi bi-arrow-left"></i> वापस जाएं (Go Back)</button>
                </div>
            `;
            document.getElementById('errorBackBtn')?.addEventListener('click', () => {
                window.location.href = 'index.html';
            }, { signal: pageLifecycleController.signal });
        }
    } finally {
        // If no error message is shown, hide loading screen
        if (loadingOverlay && !loadingOverlay.innerHTML.includes('⚠️')) {
            loadingOverlay.style.display = 'none';
        }
    }
}

export async function saveDataFromLuckysheet(): Promise<void> {
    const user = auth.currentUser;
    const savedUserStr = localStorage.getItem('vedrabi_current_user');
    const localUser = savedUserStr ? JSON.parse(savedUserStr) : null;
    const activeUid = user ? user.uid : (localUser ? localUser.uid : null);

    if (!activeUid) {
        safeAlert("डेटा सेव करने के लिए कृपया लॉगिन करें।", "warning");
        return;
    }

    const sheetData = extractSheetData();
    if (!sheetData) {
        safeAlert("सेव करने के लिए कोई वैध डेटा या हेडर नहीं है।", "warning");
        return;
    }

    const saveBtn = document.getElementById('saveDataBtn') as HTMLButtonElement | null;
    const originalHTML = saveBtn ? saveBtn.innerHTML : '';
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';
    }
    updateSaveStatus('saving');

    try {
        // 1. High Capacity IndexedDB Persistence (100MB+ Capable)
        await vedraStorage.setItem(STORES.DATASETS, `user_dataset_${activeUid}`, sheetData.data);

        // 2. LocalStorage Sync for lightweight caching
        try {
            localStorage.setItem('uploadedData', JSON.stringify(sheetData.data));
        } catch (quotaErr) {
            console.warn("LocalStorage full, persistent in IndexedDB:", quotaErr);
        }

        // 3. Save to Firestore Cloud Database
        try {
            await db.collection('users').doc(activeUid).set({
                data: sheetData.data,
                headers: sheetData.headers,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        } catch (cloudErr) {
            console.warn("Firestore sync warning (saved locally in IndexedDB):", cloudErr);
        }

        // 4. Background Smart Compression
        SmartDataCompressor.compressDataset(sheetData.data, sheetData.headers).then(comp => {
            SmartDataCompressor.saveCompressedDataset(activeUid, comp);
        }).catch(err => console.warn("[SmartDataCompressor] Luckysheet compression warning:", err));
        
        // Clear draft on successful database save
        await vedraStorage.removeItem(STORES.DRAFTS, 'vedra_sheet_draft');
        localStorage.removeItem('vedra_sheet_draft');
        localStorage.removeItem('vedra_sheet_draft_meta');
        
        isSheetDirty = false;
        updateSaveStatus('saved');
        safeAlert('डेटा सफलतापूर्वक सेव किया गया!', 'success');
        console.log("Luckysheet data saved successfully to IndexedDB and Firestore!");
    } catch (error) {
        console.error("Error saving data:", error);
        safeAlert('डेटा सेव करने में त्रुटि हुई।', 'danger');
        updateSaveStatus('unsaved');
    } finally {
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = originalHTML;
        }
    }
}

// --- Profile Modal Sync & Security PIN Management Engine ---
export function initProfileModal(): void {
    const profileModalEl = document.getElementById('profileModal');
    if (!profileModalEl) return;

    const signal = pageLifecycleController.signal;

    // When modal is about to be shown, populate user info & account credentials
    profileModalEl.addEventListener('show.bs.modal', () => {
        const user = auth.currentUser;
        const savedUserStr = localStorage.getItem('vedrabi_current_user');
        const localUser = savedUserStr ? JSON.parse(savedUserStr) : null;

        let email = "guest@vedrabi.com";
        let name = "Pro Analyst";
        let bio = "डेटा ही सुंदर भविष्य की कुंजी है! 📊";
        let plan = "Pro";

        if (user) {
            email = user.email || email;
            name = user.displayName || localStorage.getItem('profileDisplayName') || email.split('@')[0];
        } else if (localUser) {
            email = localUser.email || email;
            name = localUser.displayName || localStorage.getItem('profileDisplayName') || email.split('@')[0];
        } else {
            const savedEmail = localStorage.getItem('profileEmail');
            if (savedEmail) email = savedEmail;
            const savedName = localStorage.getItem('profileDisplayName');
            if (savedName) name = savedName;
        }

        bio = localStorage.getItem('profileBio') || "Vedra BI डेशबोर्ड विश्लेषक।";
        plan = localStorage.getItem('userSubscriptionPlan') || "Pro";

        // Update Header Card elements
        const nameEl = document.getElementById('modalProfileDisplayName');
        const emailEl = document.getElementById('modalProfileUserEmail');
        const avatarEl = document.getElementById('modalUserAvatar');
        
        if (nameEl) nameEl.textContent = name;
        if (emailEl) emailEl.textContent = email;
        if (avatarEl) avatarEl.textContent = name.charAt(0).toUpperCase();

        // Retrieve Unique Account ID from Security Accounts
        const secAccounts: Record<string, SecurityAccount> = JSON.parse(localStorage.getItem('vedrabi_security_accounts') || '{}');
        const emailKey = email.toLowerCase().trim();
        const userSec = secAccounts[emailKey] || (localUser && localUser.uid ? secAccounts[localUser.uid.toLowerCase().trim()] : null);
        
        const accountIdEl = document.getElementById('modalProfileAccountId');
        if (accountIdEl) {
            if (userSec && userSec.accountId) {
                accountIdEl.textContent = userSec.accountId.startsWith('@') ? userSec.accountId : '@' + userSec.accountId;
            } else {
                accountIdEl.textContent = '@' + email.split('@')[0];
            }
        }

        // Reset inline PIN change container
        const pinBox = document.getElementById('modalInlineChangePinBox');
        if (pinBox) pinBox.classList.add('d-none');
        const fb = document.getElementById('modalChangePinFeedback');
        if (fb) fb.classList.add('d-none');

        const badge = document.getElementById('modalProfileUserBadge');
        if (badge) {
            if (plan === 'Basic') {
                badge.className = "badge bg-white text-secondary fw-bold px-3 py-1.5 shadow-sm";
                badge.innerHTML = '<i class="bi bi-person text-secondary me-1"></i> बेसिक यूजर (Basic User)';
            } else if (plan === 'Pro') {
                badge.className = "badge bg-white text-primary fw-bold px-3 py-1.5 shadow-sm";
                badge.innerHTML = '<i class="bi bi-star-fill text-warning me-1"></i> प्रो विश्लेषक (Pro Analyst)';
            } else if (plan === 'Enterprise') {
                badge.className = "badge bg-white text-danger fw-bold px-3 py-1.5 shadow-sm";
                badge.innerHTML = '<i class="bi bi-shield-fill-check text-danger me-1"></i> एंटरप्राइज प्रो (Enterprise)';
            }
        }

        // Update Inputs
        const nameInput = document.getElementById('modalDisplayNameInput') as HTMLInputElement | null;
        const bioInput = document.getElementById('modalBioInput') as HTMLInputElement | null;
        const planSelect = document.getElementById('modalPlanSelect') as HTMLSelectElement | null;
        
        if (nameInput) nameInput.value = name;
        if (bioInput) bioInput.value = bio;
        if (planSelect) planSelect.value = plan;

        // Update Stats
        let totalRows = 0;
        let totalCols = 0;
        
        if (typeof luckysheet !== 'undefined') {
            try {
                const sheets = luckysheet.getAllSheets();
                const sheet = sheets && sheets.length > 0 ? sheets[0] : null;
                if (sheet && sheet.data) {
                    totalCols = sheet.data[0] ? sheet.data[0].length : 0;
                    // Count rows with any actual values
                    sheet.data.forEach((row: any[], idx: number) => {
                        if (idx > 0 && row && row.some(cell => cell && (cell.v !== undefined || cell.m !== undefined))) {
                            totalRows++;
                        }
                    });
                }
            } catch (e) {
                console.warn("Could not calculate sheet statistics:", e);
            }
        }
        
        const statRowsEl = document.getElementById('modalStatTotalRows');
        const statColsEl = document.getElementById('modalStatTotalCols');
        const statThemeEl = document.getElementById('modalStatTheme');
        
        if (statRowsEl) statRowsEl.textContent = String(totalRows);
        if (statColsEl) statColsEl.textContent = String(totalCols);
        if (statThemeEl) statThemeEl.textContent = (localStorage.getItem('theme') || 'light') === 'dark' ? 'डार्क (Dark)' : 'लाइट (Light)';
    }, { signal });

    // Action Listeners for Profile updates
    document.getElementById('modalSaveNameBtn')?.addEventListener('click', async () => {
        const nameInput = document.getElementById('modalDisplayNameInput') as HTMLInputElement | null;
        const newName = nameInput ? nameInput.value.trim() : '';
        if (!newName) {
            safeAlert("नाम खाली नहीं हो सकता!", "warning");
            return;
        }

        localStorage.setItem('profileDisplayName', newName);
        const nameEl = document.getElementById('modalProfileDisplayName');
        const avatarEl = document.getElementById('modalUserAvatar');
        if (nameEl) nameEl.textContent = newName;
        if (avatarEl) avatarEl.textContent = newName.charAt(0).toUpperCase();

        const user = auth.currentUser;
        if (user) {
            try {
                await user.updateProfile({ displayName: newName });
                console.log("Firebase Auth display name updated successfully.");
            } catch (err) {
                console.warn("Failed to update Firebase Auth profile:", err);
            }
        }

        safeAlert("नाम सफलतापूर्वक अपडेट किया गया!", "success");
    }, { signal });

    document.getElementById('modalSaveBioBtn')?.addEventListener('click', () => {
        const bioInput = document.getElementById('modalBioInput') as HTMLInputElement | null;
        const bioVal = bioInput ? bioInput.value.trim() : '';
        localStorage.setItem('profileBio', bioVal);
        safeAlert("बायो सफलतापूर्वक सहेजा गया!", "success");
    }, { signal });

    document.getElementById('modalPlanSelect')?.addEventListener('change', (e: Event) => {
        const selectedPlan = (e.target as HTMLSelectElement).value;
        localStorage.setItem('userSubscriptionPlan', selectedPlan);
        
        const badge = document.getElementById('modalProfileUserBadge');
        if (badge) {
            if (selectedPlan === 'Basic') {
                badge.className = "badge bg-white text-secondary fw-bold px-3 py-1.5 shadow-sm";
                badge.innerHTML = '<i class="bi bi-person text-secondary me-1"></i> बेसिक यूजर (Basic User)';
            } else if (selectedPlan === 'Pro') {
                badge.className = "badge bg-white text-primary fw-bold px-3 py-1.5 shadow-sm";
                badge.innerHTML = '<i class="bi bi-star-fill text-warning me-1"></i> प्रो विश्लेषक (Pro Analyst)';
            } else if (selectedPlan === 'Enterprise') {
                badge.className = "badge bg-white text-danger fw-bold px-3 py-1.5 shadow-sm";
                badge.innerHTML = '<i class="bi bi-shield-fill-check text-danger me-1"></i> एंटरप्राइज प्रो (Enterprise)';
            }
        }

        safeAlert(`सफलतापूर्वक ${selectedPlan} सदस्यता में बदला गया!`, "success");
    }, { signal });

    // Account ID Copy Button
    document.getElementById('modalCopyAccountIdBtn')?.addEventListener('click', async () => {
        const accId = document.getElementById('modalProfileAccountId')?.textContent || '';
        if (accId) {
            try {
                await navigator.clipboard.writeText(accId);
                const btn = document.getElementById('modalCopyAccountIdBtn');
                if (btn) {
                    const orig = btn.innerHTML;
                    btn.innerHTML = '<i class="bi bi-check2 text-success me-1"></i> कॉपी हुआ!';
                    setTimeout(() => { btn.innerHTML = orig; }, 2000);
                }
                safeAlert("अकाउंट ID क्लिपबोर्ड पर कॉपी किया गया!", "success");
            } catch (e) {
                safeAlert(`अकाउंट ID: ${accId}`, "info");
            }
        }
    }, { signal });

    // Toggle Inline Security PIN Change Box
    document.getElementById('modalOpenChangePinBtn')?.addEventListener('click', () => {
        const box = document.getElementById('modalInlineChangePinBox');
        if (box) {
            box.classList.remove('d-none');
            (document.getElementById('modalCurrPinInput') as HTMLInputElement).value = '';
            (document.getElementById('modalNewPinInput') as HTMLInputElement).value = '';
            (document.getElementById('modalConfirmNewPinInput') as HTMLInputElement).value = '';
            const fb = document.getElementById('modalChangePinFeedback');
            if (fb) fb.classList.add('d-none');
        }
    }, { signal });

    document.getElementById('modalCancelChangePinBtn')?.addEventListener('click', () => {
        document.getElementById('modalInlineChangePinBox')?.classList.add('d-none');
    }, { signal });

    // Save New 8-Digit Security PIN with SHA-256 Hashing
    document.getElementById('modalSaveNewPinBtn')?.addEventListener('click', async () => {
        const currPin = (document.getElementById('modalCurrPinInput') as HTMLInputElement)?.value.trim() || '';
        const newPin = (document.getElementById('modalNewPinInput') as HTMLInputElement)?.value.trim() || '';
        const confirmPin = (document.getElementById('modalConfirmNewPinInput') as HTMLInputElement)?.value.trim() || '';
        const fb = document.getElementById('modalChangePinFeedback');

        const showFeedback = (msg: string, isErr = true) => {
            if (fb) {
                fb.className = isErr ? 'small mb-2 text-danger fw-bold' : 'small mb-2 text-success fw-bold';
                fb.textContent = msg;
                fb.classList.remove('d-none');
            }
        };

        if (!currPin) {
            showFeedback("कृपया वर्तमान 8-डिजिट पासवर्ड दर्ज करें।");
            return;
        }

        if (!newPin || newPin.length !== 8) {
            showFeedback("नया पासवर्ड ठीक 8 अंकों/वर्णों का होना चाहिए।");
            return;
        }

        if (newPin !== confirmPin) {
            showFeedback("नया पासवर्ड और पुष्टि पासवर्ड मेल नहीं खाते।");
            return;
        }

        // Verify Current PIN
        const user = auth.currentUser;
        const savedUserStr = localStorage.getItem('vedrabi_current_user');
        const localUser = savedUserStr ? JSON.parse(savedUserStr) : null;
        const email = (user?.email || localUser?.email || '').toLowerCase().trim();

        const secAccounts: Record<string, SecurityAccount> = JSON.parse(localStorage.getItem('vedrabi_security_accounts') || '{}');
        const userSec = secAccounts[email] || (localUser?.uid ? secAccounts[localUser.uid.toLowerCase().trim()] : null);

        if (userSec) {
            const isDirectMatch = userSec.securityPin && userSec.securityPin === currPin;
            let isHashMatch = false;

            if (userSec.pinHash && userSec.salt && window.crypto?.subtle) {
                try {
                    const enc = new TextEncoder();
                    const data = enc.encode(`vedrabi_salt_${userSec.salt}_pass_${currPin}`);
                    const hashBuf = await window.crypto.subtle.digest('SHA-256', data);
                    const hashArr = Array.from(new Uint8Array(hashBuf));
                    const computedHash = hashArr.map(b => b.toString(16).padStart(2, '0')).join('');
                    isHashMatch = (computedHash === userSec.pinHash);
                } catch (_) {}
            }

            if (!isDirectMatch && !isHashMatch) {
                showFeedback("वर्तमान 8-डिजिट पासवर्ड गलत है!");
                return;
            }
        }

        // Generate new salt and hash
        const newSalt = Math.random().toString(36).substring(2, 18);
        let newHash = '';
        if (window.crypto?.subtle) {
            try {
                const enc = new TextEncoder();
                const data = enc.encode(`vedrabi_salt_${newSalt}_pass_${newPin}`);
                const hashBuf = await window.crypto.subtle.digest('SHA-256', data);
                newHash = Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, '0')).join('');
            } catch (_) {}
        }

        // Update Security Profile
        secAccounts[email] = {
            ...(userSec || {}),
            accountId: userSec?.accountId || ('@' + email.split('@')[0]),
            securityPin: newPin,
            pinHash: newHash,
            salt: newSalt,
            updatedAt: new Date().toISOString()
        };
        localStorage.setItem('vedrabi_security_accounts', JSON.stringify(secAccounts));

        showFeedback("8-डिजिट सुरक्षा पासवर्ड सफलतापूर्वक बदला गया!", false);
        setTimeout(() => {
            document.getElementById('modalInlineChangePinBox')?.classList.add('d-none');
            safeAlert("8-डिजिट सुरक्षा पासवर्ड सफलतापूर्वक बदला गया!", "success");
        }, 1200);
    }, { signal });
}

// --- Main Initialization ---
export function initEditDataPage(): void {
    const signal = pageLifecycleController.signal;

    // Initialize Theme Sync
    initTheme();
    document.getElementById('themeToggleBtn')?.addEventListener('click', toggleTheme, { signal });

    // Export CSV Button
    document.getElementById('exportCsvBtn')?.addEventListener('click', exportSheetToCsv, { signal });

    // Initialize Profile Modal engine
    initProfileModal();

    // Check Auth State
    auth.onAuthStateChanged((user: any) => {
        if (user) {
            loadDataForLuckysheet();
        } else {
            const saved = localStorage.getItem('vedrabi_current_user');
            if (saved) {
                loadDataForLuckysheet();
            } else {
                safeAlert("डेटा एडिट करने के लिए कृपया लॉगिन करें।", "warning");
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 1500);
            }
        }
    });

    // Action Listeners
    document.getElementById('saveDataBtn')?.addEventListener('click', saveDataFromLuckysheet, { signal });
    document.getElementById('backBtn')?.addEventListener('click', () => {
        window.location.href = 'index.html';
    }, { signal });
    document.getElementById('modalLogoutBtn')?.addEventListener('click', () => {
        if ((window as any).performUserLogout) {
            (window as any).performUserLogout('logout');
        } else {
            localStorage.removeItem('vedrabi_current_user');
            localStorage.removeItem('vedrabi_last_activity');
            window.location.replace('login.html?reason=logout');
        }
    }, { signal });

    // Global Keyboard Shortcuts (Ctrl+S / Cmd+S for instant save)
    window.addEventListener('keydown', (e: KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
            e.preventDefault();
            saveDataFromLuckysheet();
        }
    }, { signal });

    // Recovery button clicks
    document.getElementById('restoreDraftBtn')?.addEventListener('click', restoreDraft, { signal });
    document.getElementById('discardDraftBtn')?.addEventListener('click', async () => {
        if (confirm('क्या आप निश्चित रूप से ड्राफ्ट हटाना चाहते हैं? यह क्रिया पूर्ववत नहीं की जा सकती।')) {
            await vedraStorage.removeItem(STORES.DRAFTS, 'vedra_sheet_draft');
            localStorage.removeItem('vedra_sheet_draft');
            localStorage.removeItem('vedra_sheet_draft_meta');
            const banner = document.getElementById('draft-recovery-banner');
            if (banner) banner.style.display = 'none';
            safeAlert('सहेजा न गया ड्राफ्ट सफलतापूर्वक हटा दिया गया।', 'info');
        }
    }, { signal });

    // Save immediately when navigating away or unmounting
    window.addEventListener('beforeunload', () => {
        if (isSheetDirty) {
            saveDraftToIndexedDB(true);
        }
        cleanupPageResources();
    }, { signal });

    window.addEventListener('pagehide', () => {
        cleanupPageResources();
    }, { signal });
}

// Auto-run on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEditDataPage);
} else {
    initEditDataPage();
}
