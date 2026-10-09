// js/login.ts

import { auth, showMessage } from '../core/utils.ts';
import { SecurityManager } from './securityManager.ts';
import { sendProductionPasswordReset } from './firebaseAuthService.ts';
import { OnboardingManager } from '../ui/onboardingManager.js';
import { initializeWelcomeFlow } from '../ui/welcomeModal.js';
import { 
    AuthLogger, 
    generateSecureSalt, 
    hashPasswordWithSalt, 
    verifyPasswordHash,
    sha256Subtle 
} from './cryptoUtils.ts';
import {
    setCurrentUserId,
    initData,
    headers,
    loadDashboardSettings
} from '../../store/DataHandler.ts';
import { plotAll } from '../charts/charts.ts';
import { displayGoogleSheetsTable as loadAndDisplayUserData } from '../data/dataTebledisplay.js';
import { populateColumnDragLists, initializeDragAndDrop } from '../charts/chartcolomdrag.js';

declare const firebase: any;
declare const CryptoUtils: any;

declare global {
    interface Window {
        _showSecuritySetupTab?: (email: string) => void;
        _showSecurityVerifyTab?: (email: string, accountId: string) => void;
        _showOnboardingTab?: (email?: string) => void;
    }
}

// Error messages map
const errorMessagesEnglish: Record<string, string> = {
    'auth/invalid-email': 'Invalid email address',
    'auth/user-disabled': 'Account is disabled',
    'auth/user-not-found': 'Account not found',
    'auth/wrong-password': 'Incorrect password',
    'auth/email-already-in-use': 'Email is already registered',
    'auth/popup-closed-by-user': 'Authentication popup was closed',
    'auth/cancelled-popup-request': 'Popup request was cancelled'
};

// UI element helper
const getElement = (id: string): HTMLElement | null => document.getElementById(id);

// Track current active user email during login security flow
let pendingUserEmail = '';

// Loading state handler
const setLoadingState = (isLoading: boolean) => {
    ['loginBtn', 'registerBtn', 'googleLoginBtn', 'sendOtpBtn', 'verifyOtpBtn', 'sendResetBtn', 'saveSecuritySetupBtn', 'verifySecurityPinBtn'].forEach(id => {
        const btn = getElement(id) as HTMLButtonElement | null;
        if (btn) {
            btn.disabled = isLoading;
            if (isLoading) {
                btn.innerHTML = `<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span> Please wait...`;
            } else {
                btn.textContent = btn.dataset.originalText || btn.textContent;
            }
        }
    });
};

// Helper for saved user validation
const isValidUserObj = (u: any): boolean => {
    return u && typeof u === 'object' && 
           u.uid && typeof u.uid === 'string' && u.uid !== 'guest_user' && u.uid.trim() !== '' && 
           u.email && typeof u.email === 'string' && u.email !== 'guest@vedrabi.com' && u.email.trim() !== '';
};

const getSavedUser = (): any => {
    try {
        const saved = localStorage.getItem('vedrabi_current_user');
        if (!saved) return null;
        const parsed = JSON.parse(saved);
        if (isValidUserObj(parsed)) {
            return parsed;
        }
    } catch (e) {}
    return null;
};

// Initialize login page logic
function initializeLoginPageLogic() {
    const isLoginPage = window.location.pathname.toLowerCase().includes('login');
    if (!isLoginPage) return;
    
    const emailInput = getElement('emailInput') as HTMLInputElement | null;
    const passwordInput = getElement('passwordInput') as HTMLInputElement | null;
    const loginErrorDiv = getElement('loginError');
    
    // Save original button texts
    ['loginBtn', 'registerBtn', 'googleLoginBtn', 'sendOtpBtn', 'verifyOtpBtn', 'sendResetBtn', 'saveSecuritySetupBtn', 'verifySecurityPinBtn'].forEach(id => {
        const btn = getElement(id);
        if (btn) btn.dataset.originalText = btn.textContent || '';
    });

    const normalizeEmail = (email: string): string => {
        return (email || '').trim().toLowerCase();
    };
    
    const showError = (error: any, targetErrorDivId: string = 'loginError') => {
        let errorCode = error ? (error.code || '') : '';
        let errorMessage = (error && error.message) ? error.message : (typeof error === 'string' ? error : '');
        
        if (errorMessage.trim().startsWith('{')) {
            try {
                const parsed = JSON.parse(errorMessage);
                if (parsed.error && parsed.error.message) {
                    errorMessage = parsed.error.message;
                }
            } catch (e) {}
        }
        
        const upperMsg = (errorMessage || '').toUpperCase();
        if (!errorCode || errorCode === 'auth/internal-error' || errorCode === 'auth/invalid-credential' || errorCode === 'auth/unknown') {
            if (upperMsg.includes('INVALID_LOGIN_CREDENTIALS') || upperMsg.includes('INVALID-LOGIN-CREDENTIALS')) {
                errorCode = 'auth/invalid-login-credentials';
            } else if (upperMsg.includes('WRONG_PASSWORD') || upperMsg.includes('INVALID_PASSWORD') || upperMsg.includes('WRONG-PASSWORD')) {
                errorCode = 'auth/wrong-password';
            } else if (upperMsg.includes('USER_NOT_FOUND') || upperMsg.includes('EMAIL_NOT_FOUND') || upperMsg.includes('USER-NOT-FOUND')) {
                errorCode = 'auth/user-not-found';
            } else if (upperMsg.includes('EMAIL_EXISTS') || upperMsg.includes('EMAIL-ALREADY-IN-USE') || upperMsg.includes('EMAIL_ALREADY_IN_USE')) {
                errorCode = 'auth/email-already-in-use';
            } else if (upperMsg.includes('INVALID_EMAIL') || upperMsg.includes('INVALID-EMAIL')) {
                errorCode = 'auth/invalid-email';
            } else if (upperMsg.includes('WEAK_PASSWORD') || upperMsg.includes('WEAK-PASSWORD')) {
                errorCode = 'auth/weak-password';
            } else if (upperMsg.includes('TOO_MANY_ATTEMPTS') || upperMsg.includes('TOO-MANY-REQUESTS') || upperMsg.includes('TOO_MANY_REQUESTS')) {
                errorCode = 'auth/too-many-requests';
            }
        }

        const currentTypedEmail = emailInput ? normalizeEmail(emailInput.value) : '';
        let errorTitle = '';
        let errorDesc = '';
        let showResetHelper = false;
        let showSignupHelper = false;

        switch (errorCode) {
            case 'auth/wrong-password':
                errorTitle = 'Incorrect Password';
                errorDesc = 'The password you entered does not match this account. Please try again.';
                showResetHelper = true;
                break;
            case 'auth/invalid-login-credentials':
                errorTitle = 'Invalid Credentials';
                errorDesc = currentTypedEmail 
                    ? `Incorrect email or password for <strong>${currentTypedEmail}</strong>. If you do not have an account yet, click <strong>Create Account</strong> below.`
                    : 'Incorrect email or password. If you do not have an account yet, click <strong>Create Account</strong> below.';
                showResetHelper = true;
                showSignupHelper = true;
                break;
            case 'auth/user-not-found':
                errorTitle = 'Account Not Found';
                errorDesc = currentTypedEmail 
                    ? `No registered account found with email <strong>${currentTypedEmail}</strong>.` 
                    : 'No registered account found with this email address.';
                showSignupHelper = true;
                break;
            case 'auth/invalid-email':
                errorTitle = 'Invalid Email Format';
                errorDesc = 'Please enter a valid email address (e.g., name@example.com).';
                break;
            case 'auth/email-already-in-use':
                errorTitle = 'Email Already Registered';
                errorDesc = 'This email address is already in use. Please sign in or reset your password.';
                showResetHelper = true;
                break;
            case 'auth/weak-password':
                errorTitle = 'Weak Password';
                errorDesc = 'Password must be at least 6 characters long for secure access.';
                break;
            case 'auth/too-many-requests':
                errorTitle = 'Account Temporarily Locked';
                errorDesc = 'Access to this account is temporarily disabled due to multiple failed login attempts. Please wait or reset your password.';
                showResetHelper = true;
                break;
            case 'auth/user-disabled':
                errorTitle = 'Account Disabled';
                errorDesc = 'This user account has been disabled by an administrator.';
                break;
            case 'auth/network-request-failed':
                errorTitle = 'Network Error';
                errorDesc = 'Unable to connect to the authentication server. Please check your internet connection.';
                break;
            case 'auth/popup-closed-by-user':
            case 'auth/cancelled-popup-request':
                errorTitle = 'Popup Window Closed';
                errorDesc = 'The Google sign-in popup was closed before authentication could finish.';
                break;
            default:
                errorTitle = 'Authentication Error';
                errorDesc = errorMessage || 'An unexpected error occurred. Please try again.';
                if (upperMsg.includes('PASSWORD') || upperMsg.includes('CREDENTIAL')) {
                    showResetHelper = true;
                }
                break;
        }

        const errDiv = getElement(targetErrorDivId);
        if (!errDiv) return;

        let helperHtml = '';
        if (targetErrorDivId === 'loginError') {
            if (showResetHelper && showSignupHelper) {
                helperHtml = `
                    <div class="mt-2.5 pt-2 border-top border-danger border-opacity-25" style="font-size: 12px;">
                        <div class="text-secondary mb-2" style="font-size: 11.5px; line-height: 1.4;">
                            Need to create an account with this email, or forgot your password?
                        </div>
                        <div class="d-flex flex-wrap gap-2">
                            <button type="button" class="btn btn-sm btn-primary d-inline-flex align-items-center gap-1.5 px-3 py-1 fw-bold" id="quickSignUpHelperBtn" style="border-radius: 8px; font-size: 12px;">
                                <i class="bi bi-person-plus-fill"></i> Create Account
                            </button>
                            <button type="button" class="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1.5 px-3 py-1 fw-bold" id="quickResetHelperBtn" style="border-radius: 8px; font-size: 12px;">
                                <i class="bi bi-arrow-repeat"></i> Reset Password
                            </button>
                        </div>
                    </div>
                `;
            } else if (showResetHelper) {
                helperHtml = `
                    <div class="mt-2.5 pt-2 border-top border-danger border-opacity-25" style="font-size: 12px;">
                        <div class="d-flex align-items-center gap-1.5 fw-semibold text-danger mb-1">
                            <i class="bi bi-key-fill"></i>
                            <span>Forgot your password?</span>
                        </div>
                        <div class="text-secondary mb-2" style="font-size: 11.5px; line-height: 1.4;">
                            You can send a 1-click password reset link to your registered email address:
                        </div>
                        <button type="button" class="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1.5 px-3 py-1 fw-bold" id="quickResetHelperBtn" style="border-radius: 8px; font-size: 12px;">
                            <i class="bi bi-arrow-repeat"></i> Reset Password
                        </button>
                    </div>
                `;
            } else if (showSignupHelper) {
                helperHtml = `
                    <div class="mt-2.5 pt-2 border-top border-danger border-opacity-25" style="font-size: 12px;">
                        <div class="d-flex align-items-center gap-1.5 fw-semibold text-primary mb-1">
                            <i class="bi bi-person-plus-fill"></i>
                            <span>New to Vedra BI?</span>
                        </div>
                        <div class="text-secondary mb-2" style="font-size: 11.5px; line-height: 1.4;">
                            Create a new account with this email in just a few seconds:
                        </div>
                        <button type="button" class="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1.5 px-3 py-1 fw-bold" id="quickSignUpHelperBtn" style="border-radius: 8px; font-size: 12px;">
                            <i class="bi bi-person-plus"></i> Create Account
                        </button>
                    </div>
                `;
            }
        }

        errDiv.innerHTML = `
            <div class="d-flex align-items-start gap-2">
                <i class="bi bi-exclamation-octagon-fill text-danger fs-5 flex-shrink-0 mt-0.5"></i>
                <div class="flex-grow-1 text-start">
                    <div class="fw-bold text-danger mb-0.5" style="font-size: 13px;">${errorTitle}</div>
                    <div class="text-secondary" style="font-size: 12px; line-height: 1.4;">${errorDesc}</div>
                    ${helperHtml}
                </div>
            </div>
        `;
        errDiv.style.display = 'block';

        const quickResetBtn = errDiv.querySelector('#quickResetHelperBtn');
        if (quickResetBtn) {
            quickResetBtn.addEventListener('click', (e) => {
                e.preventDefault();
                showForgotTab(currentTypedEmail);
            });
        }

        const quickSignUpBtn = errDiv.querySelector('#quickSignUpHelperBtn');
        if (quickSignUpBtn) {
            quickSignUpBtn.addEventListener('click', (e) => {
                e.preventDefault();
                setAuthMode('signup');
                if (emailInput && currentTypedEmail) {
                    emailInput.value = currentTypedEmail;
                }
                const privacyCheckbox = getElement('registerPrivacyAgreeInput') as HTMLInputElement | null;
                if (privacyCheckbox) {
                    privacyCheckbox.checked = true;
                }
                if (passwordInput) {
                    passwordInput.focus();
                }
            });
        }
    };
    
    const attachEvent = (id: string, handler: (e: Event) => void) => {
        const el = getElement(id);
        if (el) el.addEventListener('click', handler);
    };

    // --- FORM SWITCHING LOGIC ---
    const emailForm = getElement('emailFormContainer');
    const forgotForm = getElement('forgotPasswordContainer');
    const securitySetupForm = getElement('securitySetupContainer');
    const securityVerifyForm = getElement('securityVerifyContainer');
    const onboardingForm = getElement('onboardingContainer');

    let currentAuthMode: 'signin' | 'signup' = 'signin';

    const setAuthMode = (mode: 'signin' | 'signup') => {
        currentAuthMode = mode;
        const tabSignIn = getElement('tabSwitchSignIn');
        const tabSignUp = getElement('tabSwitchSignUp');
        const authHeaderTitle = getElement('authHeaderTitle');
        const authHeaderSubtitle = getElement('authHeaderSubtitle');
        const rememberForgotRow = getElement('rememberForgotRow');
        const registerPrivacyCheckWrapper = getElement('registerPrivacyCheckWrapper');
        const signInActionsGrid = getElement('signInActionsGrid');
        const signUpActionsGrid = getElement('signUpActionsGrid');
        const authToggleText = getElement('authToggleText');
        const registerBtn = getElement('registerBtn');

        if (loginErrorDiv) loginErrorDiv.style.display = 'none';

        if (mode === 'signup') {
            if (tabSignIn) {
                tabSignIn.className = 'btn btn-sm flex-fill fw-bold rounded-2 btn-light text-muted';
            }
            if (tabSignUp) {
                tabSignUp.className = 'btn btn-sm flex-fill fw-bold rounded-2 btn-primary shadow-2xs';
            }
            if (authHeaderTitle) authHeaderTitle.textContent = 'नया खाता बनाएँ (Create Account)';
            if (authHeaderSubtitle) authHeaderSubtitle.textContent = 'Vedra BI में सुरक्षित रूप से रजिस्टर करें';
            if (rememberForgotRow) rememberForgotRow.style.display = 'none';
            if (registerPrivacyCheckWrapper) registerPrivacyCheckWrapper.style.display = 'block';
            if (signInActionsGrid) signInActionsGrid.style.display = 'none';
            if (signUpActionsGrid) signUpActionsGrid.style.display = 'grid';
            if (authToggleText) authToggleText.textContent = 'पहले से खाता है? (Already have an account?)';
            if (registerBtn) registerBtn.textContent = 'साइन-इन करें (Sign in)';
        } else {
            if (tabSignIn) {
                tabSignIn.className = 'btn btn-sm flex-fill fw-bold rounded-2 btn-primary shadow-2xs';
            }
            if (tabSignUp) {
                tabSignUp.className = 'btn btn-sm flex-fill fw-bold rounded-2 btn-light text-muted';
            }
            if (authHeaderTitle) authHeaderTitle.textContent = 'खाते में साइन-इन करें';
            if (authHeaderSubtitle) authHeaderSubtitle.textContent = 'Welcome back! Please enter your details';
            if (rememberForgotRow) rememberForgotRow.style.display = 'flex';
            if (registerPrivacyCheckWrapper) registerPrivacyCheckWrapper.style.display = 'none';
            if (signInActionsGrid) signInActionsGrid.style.display = 'grid';
            if (signUpActionsGrid) signUpActionsGrid.style.display = 'none';
            if (authToggleText) authToggleText.textContent = "Don't have an account?";
            if (registerBtn) registerBtn.textContent = 'Sign up';
        }
    };

    const showEmailTab = () => {
        if (emailForm) emailForm.style.display = 'block';
        if (forgotForm) forgotForm.style.display = 'none';
        if (securitySetupForm) securitySetupForm.style.display = 'none';
        if (securityVerifyForm) securityVerifyForm.style.display = 'none';
        if (onboardingForm) onboardingForm.style.display = 'none';
        if (loginErrorDiv) loginErrorDiv.style.display = 'none';
    };

    const showForgotTab = (prefillEmail?: string) => {
        if (emailForm) emailForm.style.display = 'none';
        if (forgotForm) forgotForm.style.display = 'block';
        if (securitySetupForm) securitySetupForm.style.display = 'none';
        if (securityVerifyForm) securityVerifyForm.style.display = 'none';
        if (onboardingForm) onboardingForm.style.display = 'none';

        const resetEmailInput = getElement('resetEmailInput') as HTMLInputElement | null;
        if (resetEmailInput) {
            if (prefillEmail) {
                resetEmailInput.value = normalizeEmail(prefillEmail);
            } else if (emailInput && emailInput.value) {
                resetEmailInput.value = normalizeEmail(emailInput.value);
            }
            setTimeout(() => resetEmailInput.focus(), 100);
        }
        const resetError = getElement('resetError');
        if (resetError) resetError.style.display = 'none';
        const resetSuccess = getElement('resetSuccessAlert');
        if (resetSuccess) resetSuccess.classList.add('d-none');
    };

    const showSecuritySetupTab = (email: string) => {
        const normalized = normalizeEmail(email);
        pendingUserEmail = normalized;
        if (emailForm) emailForm.style.display = 'none';
        if (forgotForm) forgotForm.style.display = 'none';
        if (securityVerifyForm) securityVerifyForm.style.display = 'none';
        if (onboardingForm) onboardingForm.style.display = 'none';
        if (securitySetupForm) securitySetupForm.style.display = 'block';

        const setupAccountIdInput = getElement('setupAccountIdInput') as HTMLInputElement | null;
        if (setupAccountIdInput) {
            const defaultId = '@' + (normalized.split('@')[0] || 'user').replace(/[^a-zA-Z0-9_]/g, '');
            setupAccountIdInput.value = defaultId;
            checkAccountIdStatus(defaultId, normalized);
        }

        const setupErr = getElement('setupSecurityError');
        if (setupErr) setupErr.style.display = 'none';
    };

    const showSecurityVerifyTab = (email: string, accountId: string) => {
        const normalized = normalizeEmail(email);
        pendingUserEmail = normalized;
        if (emailForm) emailForm.style.display = 'none';
        if (forgotForm) forgotForm.style.display = 'none';
        if (securitySetupForm) securitySetupForm.style.display = 'none';
        if (onboardingForm) onboardingForm.style.display = 'none';
        if (securityVerifyForm) securityVerifyForm.style.display = 'block';

        const emailDisplay = getElement('verifyAccountEmailDisplay');
        const idDisplay = getElement('verifyAccountIdDisplay');
        if (emailDisplay) emailDisplay.textContent = normalized;
        if (idDisplay) idDisplay.textContent = accountId || '@user_id';

        const verifyPinInput = getElement('verifySecurityPinInput') as HTMLInputElement | null;
        if (verifyPinInput) verifyPinInput.value = '';

        const verifyErr = getElement('verifySecurityError');
        if (verifyErr) verifyErr.style.display = 'none';
    };

    let currentOnboardingStep = 0;
    let selectedLanguage = 'en';

    const ONBOARDING_I18N: Record<string, any> = {
        en: {
            title: "Welcome to Vedra BI",
            subtitle: "Customize your analytics workspace in a few quick steps",
            step0_label: "Step 0 / 6: Language Selection",
            step0_question: "Choose Your Preferred Language:",
            step1_label: "Question 1 / 6: Business Role",
            step1_question: "1. What is your role or business type?",
            step2_label: "Question 2 / 6: Primary Goals",
            step2_question: "2. What are your primary goals with Vedra BI?",
            step3_label: "Question 3 / 6: Data Sources",
            step3_question: "3. Which data sources will you connect?",
            step4_label: "Question 4 / 6: Team Size",
            step4_question: "4. What is your team or organization size?",
            step5_label: "Question 5 / 6: Update Frequency",
            step5_question: "5. How frequently will your data be updated?",
            step6_label: "Question 6 / 6: Dashboard Theme",
            step6_question: "6. Select your preferred dashboard theme:",
            btn_next: "Next Question",
            btn_start: "Launch Dashboard",
            btn_back: "Back",
            btn_skip: "Skip for now",
            completed_suffix: "Completed",
            success_msg: "Onboarding Complete! Opening your customized dashboard...",
            
            roles: [
                { id: "chk_role_analyst", title: "BI & Data Analyst", sub: "Data visualization, reports & chart creation" },
                { id: "chk_role_owner", title: "Business Owner / Founder", sub: "Business growth, revenue & sales oversight" },
                { id: "chk_role_retail", title: "Retail & Sales Manager", sub: "Store inventory, sales tracking & customer trends" },
                { id: "chk_role_finance", title: "Finance & Accounting", sub: "Budgeting, profit/loss & financial reports" }
            ],
            goals: [
                { id: "chk_goal_charts", title: "Interactive Visual Dashboards", sub: "Transform raw Excel/CSV data into interactive charts" },
                { id: "chk_goal_ai", title: "AI Business Advisor & Q&A", sub: "Ask natural language questions & get instant insights" },
                { id: "chk_goal_export", title: "Automated PDF & Excel Exporting", sub: "Export formatted reports for team sharing" }
            ],
            dataSources: [
                { id: "chk_ds_excel", title: "Excel (.xlsx) & CSV Files", sub: "Spreadsheet uploads and local data files" },
                { id: "chk_ds_sql", title: "SQL Databases (MySQL, Cloud SQL)", sub: "Direct relational database connections" },
                { id: "chk_ds_sheets", title: "Google Sheets & Cloud Drives", sub: "Cloud spreadsheets and online storage sync" }
            ],
            teamSizes: [
                { id: "rad_team_solo", title: "Solo Professional (1 User)", sub: "Individual analyst or freelancer" },
                { id: "rad_team_small", title: "Small Team (2 - 10 Members)", sub: "Small business or department" },
                { id: "rad_team_mid", title: "Growing Business (11 - 50 Members)", sub: "Multi-department organization" }
            ],
            frequencies: [
                { id: "rad_freq_realtime", title: "Real-Time Continuous Stream", sub: "Instant updates whenever new data arrives" },
                { id: "rad_freq_daily", title: "Daily Automated Refresh", sub: "Once or multiple times a day" },
                { id: "rad_freq_manual", title: "Manual / On-Demand Refresh", sub: "Whenever you upload a new file" }
            ],
            themes: [
                { id: "chk_theme_light", title: "☀️ Silk Light Mode", sub: "High clarity professional layout (Recommended)" },
                { id: "chk_theme_dark", title: "🌙 Dark Luxury Mode", sub: "High contrast night vision layout" }
            ],
            sample_data_title: "🚀 Auto-Load Sample BI Sales Data",
            sample_data_sub: "Explore instant charts & AI insights right away without uploading a file"
        },
        hi: {
            title: "Vedra BI में आपका स्वागत है",
            subtitle: "कुछ आसान सवालों के जवाब दें और अपना डैशबोर्ड तैयार करें",
            step0_label: "चरण 0 / 6: भाषा चुनें",
            step0_question: "अपनी पसंदीदा भाषा चुनें (Select Language):",
            step1_label: "प्रश्न 1 / 6: व्यवसाय व भूमिका",
            step1_question: "1. आपकी भूमिका या व्यापार का प्रकार क्या है?",
            step2_label: "प्रश्न 2 / 6: मुख्य विश्लेषणात्मक लक्ष्य",
            step2_question: "2. आप Vedra BI से मुख्य रूप से क्या हासिल करना चाहते हैं?",
            step3_label: "प्रश्न 3 / 6: डेटा स्रोत",
            step3_question: "3. आप कौन सा डेटा सोर्स कनेक्ट करेंगे?",
            step4_label: "प्रश्न 4 / 6: टीम का आकार",
            step4_question: "4. आपके संस्थान या टीम का आकार कितना है?",
            step5_label: "प्रश्न 5 / 6: डेटा अपडेट आवृत्ति",
            step5_question: "5. आपका डेटा कितनी बार अपडेट किया जाएगा?",
            step6_label: "प्रश्न 6 / 6: डैशबोर्ड थीम",
            step6_question: "6. अपनी पसंदीदा डैशबोर्ड थीम व स्टाइल चुनें:",
            btn_next: "अगला प्रश्न",
            btn_start: "डैशबोर्ड शुरू करें",
            btn_back: "पीछे",
            btn_skip: "बाद में भरें (Skip)",
            completed_suffix: "पूर्ण",
            success_msg: "ऑनबोर्डिंग पूर्ण! आपका कस्टमाइज़्ड डैशबोर्ड तैयार हो रहा है...",

            roles: [
                { id: "chk_role_analyst", title: "डेटा विश्लेषक / BI Analyst", sub: "डेटा विज़ुअलाइज़ेशन, चार्ट्स और एनालिटिक्स रिपोर्ट्स" },
                { id: "chk_role_owner", title: "बिजनेस मालिक / उद्यमी", sub: "व्यापारिक ग्रोथ, सेल्स और रेवेन्यू ओवरव्यू" },
                { id: "chk_role_retail", title: "रिटेल, स्टोर व सेल्स मैनेजर", sub: "इन्वेंट्री, सेल्स डेटा ट्रैकिंग और कस्टमर ट्रेंड्स" },
                { id: "chk_role_finance", title: "वित्त, सीए व अकाउंटेंट", sub: "बजट, प्रॉफ़िट एंड लॉस और वित्तीय रिपोर्टिंग" }
            ],
            goals: [
                { id: "chk_goal_charts", title: "Excel / CSV से विज़ुअल चार्ट्स", sub: "अप्रत्यक्ष डेटा को इंटरैक्टिव ग्राफ में बदलें" },
                { id: "chk_goal_ai", title: "AI एडवाइज़र व ऑटोमैटिक सुझाव", sub: "व्यापारिक प्रश्न पूछें और तुरंत इंसाइट्स पाएँ" },
                { id: "chk_goal_export", title: "ऑटोमैटिक PDF / Excel रिपोर्ट एक्सपोर्ट", sub: "टीम व क्लाइंट्स के साथ रिपोर्ट्स शेयर करें" }
            ],
            dataSources: [
                { id: "chk_ds_excel", title: "Excel (.xlsx) एवं CSV फ़ाइलें", sub: "लोकल फ़ाइल अपलोड और स्प्रेडशीट डेटा" },
                { id: "chk_ds_sql", title: "SQL डेटाबेस (MySQL, Cloud SQL)", sub: "डायरेक्ट रिलेशनल डेटाबेस कनेक्शन" },
                { id: "chk_ds_sheets", title: "Google Sheets एवं क्लाउड ड्राइव", sub: "ऑनलाइन शीट्स और क्लाउड सिंक" }
            ],
            teamSizes: [
                { id: "rad_team_solo", title: "अकेले काम करने वाले (1 व्यक्ति)", sub: "व्यक्तिगत विश्लेषक या फ़्रीलांसर" },
                { id: "rad_team_small", title: "छोटी टीम (2 - 10 सदस्य)", sub: "छोटा व्यवसाय या विभाग" },
                { id: "rad_team_mid", title: "मध्यम संस्थान (11 - 50 सदस्य)", sub: "बहु-विभागीय कंपनी" }
            ],
            frequencies: [
                { id: "rad_freq_realtime", title: "रियल-टाइम लाइव स्ट्रीमिंग", sub: "नया डेटा आते ही तुरंत अपडेट" },
                { id: "rad_freq_daily", title: "दैनिक ऑटोमैटिक रिफ्रेश", sub: "हर दिन या दिन में कई बार" },
                { id: "rad_freq_manual", title: "मैन्युअल जब आवश्यकता हो", sub: "नई फ़ाइल अपलोड करने पर" }
            ],
            themes: [
                { id: "chk_theme_light", title: "☀️ सिल्क लाइट मोड (Silk Light)", sub: "उच्च स्पष्टता और स्वच्छ व्यावसायिक लेआउट (अनुशंसित)" },
                { id: "chk_theme_dark", title: "🌙 डार्क लक्जरी मोड (Dark Luxury)", sub: "रात में काम करने हेतु उच्च कंट्रास्ट" }
            ],
            sample_data_title: "🚀 ऑटो-लोड नमूना डेटा (Sample BI Quick Start)",
            sample_data_sub: "डेमो फ़ाइल के साथ तुरंत डैशबोर्ड और AI एडवाइज़र का आनंद लें"
        }
    };

    const updateOnboardingTexts = () => {
        const lang = selectedLanguage || 'en';
        const dict = ONBOARDING_I18N[lang] || ONBOARDING_I18N.en;

        const titleEl = getElement('onboardingHeaderTitle');
        const subEl = getElement('onboardingSubtitle');
        const skipBtn = getElement('onboardingSkipBtn');
        const backBtn = getElement('onboardingBackBtn');

        if (titleEl) titleEl.textContent = dict.title;
        if (subEl) subEl.textContent = dict.subtitle;
        if (skipBtn) skipBtn.textContent = dict.btn_skip;
        if (backBtn) backBtn.innerHTML = `<i class="bi bi-arrow-left me-1"></i> ${dict.btn_back}`;

        // Question headers
        const q0 = getElement('lbl_step0_question');
        const q1 = getElement('lbl_step1_question');
        const q2 = getElement('lbl_step2_question');
        const q3 = getElement('lbl_step3_question');
        const q4 = getElement('lbl_step4_question');
        const q5 = getElement('lbl_step5_question');
        const q6 = getElement('lbl_step6_question');

        if (q0) q0.innerHTML = `<i class="bi bi-translate text-primary me-1"></i> ${dict.step0_question}`;
        if (q1) q1.innerHTML = `<i class="bi bi-briefcase-fill text-primary me-1"></i> ${dict.step1_question}`;
        if (q2) q2.innerHTML = `<i class="bi bi-bullseye text-primary me-1"></i> ${dict.step2_question}`;
        if (q3) q3.innerHTML = `<i class="bi bi-database-fill text-primary me-1"></i> ${dict.step3_question}`;
        if (q4) q4.innerHTML = `<i class="bi bi-people-fill text-primary me-1"></i> ${dict.step4_question}`;
        if (q5) q5.innerHTML = `<i class="bi bi-arrow-repeat text-primary me-1"></i> ${dict.step5_question}`;
        if (q6) q6.innerHTML = `<i class="bi bi-palette-fill text-primary me-1"></i> ${dict.step6_question}`;

        // Helper to update options titles and subs
        const updateOptionsList = (options: any[]) => {
            options.forEach(opt => {
                const el = getElement(opt.id);
                if (el) {
                    const card = el.closest('.onboarding-option-card');
                    if (card) {
                        const titleComp = card.querySelector('.option-title');
                        const subComp = card.querySelector('.option-sub');
                        if (titleComp) titleComp.textContent = opt.title;
                        if (subComp) subComp.textContent = opt.sub;
                    }
                }
            });
        };

        updateOptionsList(dict.roles);
        updateOptionsList(dict.goals);
        updateOptionsList(dict.dataSources);
        updateOptionsList(dict.teamSizes);
        updateOptionsList(dict.frequencies);
        updateOptionsList(dict.themes);

        const sampleTitle = getElement('lbl_sample_data_title');
        const sampleSub = getElement('lbl_sample_data_sub');
        if (sampleTitle && dict.sample_data_title) sampleTitle.textContent = dict.sample_data_title;
        if (sampleSub && dict.sample_data_sub) sampleSub.textContent = dict.sample_data_sub;
    };

    const showOnboardingTab = (email?: string) => {
        if (email) pendingUserEmail = email;
        if (emailForm) emailForm.style.display = 'none';
        if (forgotForm) forgotForm.style.display = 'none';
        if (securitySetupForm) securitySetupForm.style.display = 'none';
        if (securityVerifyForm) securityVerifyForm.style.display = 'none';
        if (onboardingForm) onboardingForm.style.display = 'block';

        renderOnboardingStep(0);
    };

    const renderOnboardingStep = (step: number) => {
        currentOnboardingStep = step;

        const langRad = document.querySelector('input[name="onboarding_lang"]:checked') as HTMLInputElement | null;
        if (langRad) selectedLanguage = langRad.value;
        updateOnboardingTexts();

        const dict = ONBOARDING_I18N[selectedLanguage] || ONBOARDING_I18N.en;

        for (let i = 0; i <= 6; i++) {
            const stepPanel = getElement(`onboardingStep${i}`);
            if (stepPanel) {
                stepPanel.style.display = i === step ? 'block' : 'none';
            }
        }

        const label = getElement('onboardingStepLabel');
        const percent = getElement('onboardingProgressPercent');
        const pbar = getElement('onboardingProgressBar');
        const backBtn = getElement('onboardingBackBtn');
        const nextBtn = getElement('onboardingNextBtn');

        // Progress percentage calculations (6 questions total)
        const pctVal = Math.round((step / 6) * 100);

        if (label) {
            if (step === 0) {
                label.textContent = dict.step0_label;
            } else {
                label.textContent = dict[`step${step}_label`];
            }
        }

        if (percent) {
            percent.textContent = `${pctVal}% ${dict.completed_suffix} (${step}/6)`;
        }

        if (pbar) {
            pbar.style.width = `${Math.max(pctVal, 6)}%`;
        }

        // Update visual step dots
        const dots = document.querySelectorAll('#onboardingStepDots .step-dot');
        dots.forEach((dot, idx) => {
            const htmlDot = dot as HTMLElement;
            if (idx <= step) {
                htmlDot.style.background = '#2563eb';
                htmlDot.classList.add('active');
            } else {
                htmlDot.style.background = '#e2e8f0';
                htmlDot.classList.remove('active');
            }
        });

        if (backBtn) {
            backBtn.style.display = step === 0 ? 'none' : 'inline-block';
        }

        if (nextBtn) {
            if (step === 6) {
                nextBtn.innerHTML = `<i class="bi bi-rocket-takeoff-fill me-1"></i> ${dict.btn_start}`;
            } else {
                nextBtn.innerHTML = `${dict.btn_next} <i class="bi bi-arrow-right ms-1"></i>`;
            }
        }
    };

    // Live account ID availability check
    const checkAccountIdStatus = (accId: string, userEmail: string) => {
        const feedback = getElement('accountIdCheckFeedback');
        if (!feedback) return;
        if (!accId || accId.trim().length < 3) {
            feedback.className = 'mt-1 text-danger';
            feedback.innerHTML = '<i class="bi bi-x-circle me-1"></i> ID must be at least 3 characters.';
            return;
        }
        const available = SecurityManager.isAccountIdAvailable(accId, userEmail);
        if (available) {
            feedback.className = 'mt-1 text-success fw-bold';
            feedback.innerHTML = '<i class="bi bi-check-circle-fill me-1"></i> Account ID is available!';
        } else {
            feedback.className = 'mt-1 text-danger fw-bold';
            feedback.innerHTML = '<i class="bi bi-exclamation-triangle-fill me-1"></i> This ID is already taken.';
        }
    };

    const setupAccountIdInput = getElement('setupAccountIdInput') as HTMLInputElement | null;
    if (setupAccountIdInput) {
        setupAccountIdInput.addEventListener('input', (e: Event) => {
            const target = e.target as HTMLInputElement;
            checkAccountIdStatus(target.value, pendingUserEmail);
        });
    }

    // --- REAL-TIME PASSWORD STRENGTH METER LOGIC ---
    interface PasswordStrengthResult {
        score: number; // 0 (empty), 1 (very weak), 2 (weak), 3 (fair/good), 4 (strong)
        hasMinLength: boolean; // >= 8
        hasLowerAndUpper: boolean;
        hasNumber: boolean;
        hasSpecial: boolean;
        levelKey: 'empty' | 'vweak' | 'weak' | 'fair' | 'strong' | 'vstrong';
        labelText: string;
        hintText: string;
        color: string;
    }

    const calculatePasswordStrength = (pass: string): PasswordStrengthResult => {
        if (!pass || pass.length === 0) {
            return {
                score: 0,
                hasMinLength: false,
                hasLowerAndUpper: false,
                hasNumber: false,
                hasSpecial: false,
                levelKey: 'empty',
                labelText: 'Empty',
                hintText: 'Add at least 8 characters, numbers, and special symbols for account security.',
                color: '#e2e8f0'
            };
        }

        const hasMinLength = pass.length >= 8;
        const hasLower = /[a-z]/.test(pass);
        const hasUpper = /[A-Z]/.test(pass);
        const hasLowerAndUpper = hasLower && hasUpper;
        const hasNumber = /[0-9]/.test(pass);
        const hasSpecial = /[^A-Za-z0-9]/.test(pass);

        // Count how many criteria are met
        let criteriaMet = 0;
        if (hasMinLength) criteriaMet++;
        if (hasLowerAndUpper) criteriaMet++;
        if (hasNumber) criteriaMet++;
        if (hasSpecial) criteriaMet++;

        let score = 1;
        let levelKey: 'vweak' | 'weak' | 'fair' | 'strong' | 'vstrong' = 'vweak';
        let labelText = 'Very Weak';
        let hintText = 'Password is too short. Please enter at least 8 characters.';
        let color = '#ef4444';

        if (pass.length < 6) {
            score = 1;
            levelKey = 'vweak';
            labelText = 'Very Weak';
            hintText = 'Password is too short (at least 6-8 characters required).';
            color = '#ef4444';
        } else if (criteriaMet <= 1) {
            score = 1;
            levelKey = 'vweak';
            labelText = 'Weak';
            hintText = 'Tip: Include uppercase letters (A-Z), numbers, and symbols (@#$).';
            color = '#ef4444';
        } else if (criteriaMet === 2) {
            score = 2;
            levelKey = 'weak';
            labelText = 'Fair';
            hintText = 'Tip: Use 8+ characters with at least 1 special character (@$!%).';
            color = '#f97316';
        } else if (criteriaMet === 3) {
            score = 3;
            levelKey = 'fair';
            labelText = 'Good';
            hintText = 'Good password! Fulfill all 4 rules for maximum security.';
            color = '#3b82f6';
        } else if (criteriaMet === 4) {
            score = 4;
            if (pass.length >= 12) {
                levelKey = 'vstrong';
                labelText = 'Very Strong';
                hintText = 'Excellent! This is a highly resilient and secure password.';
                color = '#059669';
            } else {
                levelKey = 'strong';
                labelText = 'Strong';
                hintText = 'Secure password! You can proceed safely.';
                color = '#10b981';
            }
        }

        return {
            score,
            hasMinLength,
            hasLowerAndUpper,
            hasNumber,
            hasSpecial,
            levelKey,
            labelText,
            hintText,
            color
        };
    };

    const updatePasswordStrengthUI = (pass: string) => {
        const container = getElement('passwordStrengthContainer');
        if (!container) return;

        if (!pass || pass.length === 0) {
            container.style.display = 'none';
            return;
        }

        container.style.display = 'block';
        const res = calculatePasswordStrength(pass);

        // Update Badge
        const badge = getElement('strengthBadge');
        if (badge) {
            badge.className = `strength-badge strength-badge-${res.levelKey}`;
            badge.textContent = res.labelText;
        }

        // Update 4 Bar Segments
        const seg1 = getElement('strengthSeg1');
        const seg2 = getElement('strengthSeg2');
        const seg3 = getElement('strengthSeg3');
        const seg4 = getElement('strengthSeg4');
        const segs = [seg1, seg2, seg3, seg4];

        const isDark = document.body.classList.contains('dark-theme') || document.documentElement.classList.contains('dark-theme');
        const inactiveColor = isDark ? '#21262d' : '#e2e8f0';

        segs.forEach((seg, idx) => {
            if (!seg) return;
            if (idx < res.score) {
                seg.style.backgroundColor = res.color;
            } else {
                seg.style.backgroundColor = inactiveColor;
            }
        });

        // Update Shield Icon
        const shieldIcon = getElement('strengthShieldIcon');
        if (shieldIcon) {
            if (res.score <= 1) {
                shieldIcon.className = 'bi bi-shield-x text-danger';
            } else if (res.score === 2) {
                shieldIcon.className = 'bi bi-shield-slash text-warning';
            } else if (res.score === 3) {
                shieldIcon.className = 'bi bi-shield-check text-primary';
            } else {
                shieldIcon.className = 'bi bi-shield-fill-check text-success';
            }
        }

        // Update Criteria List
        const updateCriterion = (critId: string, iconId: string, isMet: boolean) => {
            const critEl = getElement(critId);
            const iconEl = getElement(iconId);
            if (critEl) {
                if (isMet) {
                    critEl.classList.add('met');
                } else {
                    critEl.classList.remove('met');
                }
            }
            if (iconEl) {
                if (isMet) {
                    iconEl.className = 'bi bi-check-circle-fill';
                } else {
                    iconEl.className = 'bi bi-circle';
                }
            }
        };

        updateCriterion('critLength', 'critLengthIcon', res.hasMinLength);
        updateCriterion('critCase', 'critCaseIcon', res.hasLowerAndUpper);
        updateCriterion('critNumber', 'critNumberIcon', res.hasNumber);
        updateCriterion('critSpecial', 'critSpecialIcon', res.hasSpecial);

        // Update Hint Text
        const hintEl = getElement('strengthHintText');
        if (hintEl) {
            const iconClass = res.score >= 3 ? 'bi bi-check-circle text-success' : (res.score === 2 ? 'bi bi-info-circle text-warning' : 'bi bi-exclamation-circle text-danger');
            hintEl.innerHTML = `<i class="${iconClass}"></i> <span>${res.hintText}</span>`;
        }
    };

    // Attach real-time password strength listener to main password input
    if (passwordInput) {
        passwordInput.addEventListener('input', (e: Event) => {
            const target = e.target as HTMLInputElement;
            updatePasswordStrengthUI(target.value);
        });
        passwordInput.addEventListener('keyup', (e: Event) => {
            const target = e.target as HTMLInputElement;
            updatePasswordStrengthUI(target.value);
        });
        passwordInput.addEventListener('focus', (e: Event) => {
            const target = e.target as HTMLInputElement;
            if (target.value) {
                updatePasswordStrengthUI(target.value);
            }
        });
    }

    // Main Password Visibility Toggle
    const mainPasswordToggleBtn = getElement('togglePasswordBtn');
    if (mainPasswordToggleBtn) {
        mainPasswordToggleBtn.addEventListener('click', () => {
            if (passwordInput) {
                const isPass = passwordInput.type === 'password';
                passwordInput.type = isPass ? 'text' : 'password';
                const icon = getElement('togglePasswordIcon');
                if (icon) {
                    icon.className = isPass ? 'bi bi-eye' : 'bi bi-eye-slash';
                }
            }
        });
    }

    // Toggle Password Visibility Helpers
    const setupPinToggleBtn = getElement('toggleSetupPinBtn');
    if (setupPinToggleBtn) {
        setupPinToggleBtn.addEventListener('click', () => {
            const input = getElement('setupSecurityPinInput') as HTMLInputElement | null;
            const icon = getElement('toggleSetupPinIcon');
            if (input) {
                const isPass = input.type === 'password';
                input.type = isPass ? 'text' : 'password';
                if (icon) {
                    icon.className = isPass ? 'bi bi-eye' : 'bi bi-eye-slash';
                }
            }
        });
    }

    const verifyPinToggleBtn = getElement('toggleVerifyPinBtn');
    if (verifyPinToggleBtn) {
        verifyPinToggleBtn.addEventListener('click', () => {
            const input = getElement('verifySecurityPinInput') as HTMLInputElement | null;
            const icon = getElement('toggleVerifyPinIcon');
            if (input) {
                const isPass = input.type === 'password';
                input.type = isPass ? 'text' : 'password';
                if (icon) {
                    icon.className = isPass ? 'bi bi-eye' : 'bi bi-eye-slash';
                }
            }
        });
    }

    // --- FORGOT PASSWORD TOGGLERS ---
    attachEvent('forgotPasswordLink', (e) => {
        e.preventDefault();
        const currentEmail = emailInput ? normalizeEmail(emailInput.value) : '';
        showForgotTab(currentEmail);
    });

    attachEvent('backToLoginBtn', (e) => {
        e.preventDefault();
        showEmailTab();
    });

    // --- PASSWORD RESET SUBMISSION (Firebase Auth) ---
    attachEvent('sendResetBtn', async () => {
        const resetEmailInput = getElement('resetEmailInput') as HTMLInputElement | null;
        const resetError = getElement('resetError');
        const resetSuccessAlert = getElement('resetSuccessAlert');
        
        if (resetError) resetError.style.display = 'none';
        if (resetSuccessAlert) resetSuccessAlert.classList.add('d-none');

        const email = resetEmailInput ? normalizeEmail(resetEmailInput.value) : '';
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showError({ code: 'auth/invalid-email', message: 'कृपया एक वैध पंजीकृत ईमेल पता दर्ज करें। (Please enter a valid registered email address.)' }, 'resetError');
            return;
        }

        setLoadingState(true);
        try {
            const res = await sendProductionPasswordReset(email);
            if (resetSuccessAlert) {
                resetSuccessAlert.innerHTML = `
                    <div class="d-flex align-items-center gap-2">
                        <i class="bi bi-envelope-check-fill fs-5 text-success"></i>
                        <div>
                            <div class="fw-bold">ईमेल सफलतापूर्वक भेजा गया! (Email Sent)</div>
                            <div class="small">${res.messageHi}</div>
                            <div class="text-muted small mt-1">Check inbox/spam from: <code>noreply@inventory-fda05.firebaseapp.com</code></div>
                        </div>
                    </div>
                `;
                resetSuccessAlert.classList.remove('d-none');
            }
            if (resetEmailInput) resetEmailInput.value = '';
            showMessage('पासवर्ड रीसेट लिंक आपके ईमेल पर भेज दिया गया है!', 'success');
        } catch (error: any) {
            showError({ message: error.message || 'पासवर्ड रीसेट ईमेल भेजने में विफल रहा।' }, 'resetError');
        } finally {
            setLoadingState(false);
        }
    });

    // --- SAVE SECURITY SETUP (First time Unique Account ID & 8-Digit Password) ---
    attachEvent('saveSecuritySetupBtn', async () => {
        const accountIdInput = getElement('setupAccountIdInput') as HTMLInputElement | null;
        const pinInput = getElement('setupSecurityPinInput') as HTMLInputElement | null;
        const confirmInput = getElement('setupSecurityPinConfirmInput') as HTMLInputElement | null;
        const errDiv = getElement('setupSecurityError');

        if (errDiv) errDiv.style.display = 'none';

        const accountId = accountIdInput ? accountIdInput.value.trim() : '';
        const pin = pinInput ? pinInput.value.trim() : '';
        const confirmPin = confirmInput ? confirmInput.value.trim() : '';

        if (!accountId) {
            showError({ message: 'Please enter your unique account ID (e.g. @username).' }, 'setupSecurityError');
            return;
        }

        if (pin.length !== 8) {
            showError({ message: 'Security password must be exactly 8 digits/characters.' }, 'setupSecurityError');
            return;
        }

        if (pin !== confirmPin) {
            showError({ message: 'Security password and confirmation password do not match. Please re-check.' }, 'setupSecurityError');
            return;
        }

        if (!pendingUserEmail) {
            const saved = localStorage.getItem('vedrabi_current_user');
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    pendingUserEmail = normalizeEmail(parsed.email || parsed.uid);
                } catch(e) {}
            }
        }

        if (!pendingUserEmail) {
            showError({ message: 'User email not found. Please sign in again.' }, 'setupSecurityError');
            return;
        }

        setLoadingState(true);
        try {
            await SecurityManager.saveSecurityProfileAsync(pendingUserEmail, accountId, pin);
            showMessage('Security account ID and 8-digit password saved successfully!', 'success');
            setTimeout(() => {
                if (!OnboardingManager.isCompleted(pendingUserEmail)) {
                    showOnboardingTab(pendingUserEmail);
                } else {
                    window.location.href = 'index.html';
                }
            }, 800);
        } catch (err) {
            showError(err, 'setupSecurityError');
        } finally {
            setLoadingState(false);
        }
    });

    // Skip Security Setup (Bypass to dashboard)
    attachEvent('skipSecuritySetupBtn', async () => {
        try {
            setLoadingState(true);
            const email = pendingUserEmail || 'analyst@vedrabi.com';
            await SecurityManager.saveSecurityProfileAsync(email, '@user_' + Math.random().toString(36).substring(2, 7), '12345678');
            SecurityManager.markSessionVerified(email);
            if (!OnboardingManager.isCompleted(email)) {
                showOnboardingTab(email);
            } else {
                showMessage('Proceeding to dashboard...', 'success');
                setTimeout(() => {
                    window.location.replace('index.html');
                }, 300);
            }
        } catch (e: any) {
            window.location.replace('index.html');
        } finally {
            setLoadingState(false);
        }
    });

    // --- VERIFY SECURITY PIN (On session login from device/browser) ---
    attachEvent('verifySecurityPinBtn', async () => {
        const pinInput = getElement('verifySecurityPinInput') as HTMLInputElement | null;
        const errDiv = getElement('verifySecurityError');
        if (errDiv) errDiv.style.display = 'none';

        const enteredPin = pinInput ? pinInput.value.trim() : '';

        if (!enteredPin) {
            showError({ message: 'Please enter your 8-digit security password.' }, 'verifySecurityError');
            return;
        }

        if (!pendingUserEmail) {
            const saved = localStorage.getItem('vedrabi_current_user');
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    pendingUserEmail = normalizeEmail(parsed.email || parsed.uid);
                } catch(e) {}
            }
        }

        setLoadingState(true);
        try {
            const isMatch = await SecurityManager.verifyPinAsync(pendingUserEmail, enteredPin);
            if (isMatch) {
                SecurityManager.markSessionVerified(pendingUserEmail);
                if (!OnboardingManager.isCompleted(pendingUserEmail)) {
                    showMessage('Verification successful! Completing onboarding...', 'success');
                    setTimeout(() => {
                        showOnboardingTab(pendingUserEmail);
                    }, 600);
                } else {
                    showMessage('Verification successful! Redirecting to dashboard...', 'success');
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 800);
                }
            } else {
                showError({ message: 'Incorrect 8-digit security password. Please enter the correct password.' }, 'verifySecurityError');
            }
        } catch (err) {
            showError(err, 'verifySecurityError');
        } finally {
            setLoadingState(false);
        }
    });

    // Skip Security Verify (Bypass directly to dashboard as demo/guest)
    attachEvent('skipSecurityVerifyBtn', async () => {
        try {
            setLoadingState(true);
            const email = pendingUserEmail || 'guest_analyst@vedrabi.com';
            SecurityManager.markSessionVerified(email);
            showMessage('Session verified! Opening dashboard...', 'success');
            setTimeout(() => {
                window.location.replace('index.html');
            }, 300);
        } catch (_) {
            window.location.replace('index.html');
        } finally {
            setLoadingState(false);
        }
    });

    // Cancel security verify & sign out
    attachEvent('cancelSecurityVerifyBtn', async () => {
        try {
            await auth.signOut();
            showEmailTab();
        } catch(e) {
            showEmailTab();
        }
    });

    // Email / Password Login
    attachEvent('loginBtn', async () => {
        if (!emailInput || !passwordInput) return;
        const email = normalizeEmail(emailInput.value);
        const password = passwordInput.value;
        
        AuthLogger.info('UI_LOGIN_CLICK', `User clicked Sign In for email: '${email}'`, {
            emailLength: email.length,
            passwordLength: password ? password.length : 0
        });

        if (!email || !password) {
            AuthLogger.warn('UI_LOGIN_VALIDATION', 'Empty email or password provided');
            showError({ code: 'auth/invalid-email', message: 'Please enter both email and password.' });
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            AuthLogger.warn('UI_LOGIN_VALIDATION', `Invalid email format: '${email}'`);
            showError({ code: 'auth/invalid-email', message: 'Please enter a valid email address (e.g., user@example.com).' });
            return;
        }

        if (loginErrorDiv) loginErrorDiv.style.display = 'none';
        setLoadingState(true);
        
        try {
            AuthLogger.info('AUTH_EXECUTION', `Invoking auth.signInWithEmailAndPassword for '${email}'`);
            await auth.signInWithEmailAndPassword(email, password);
            AuthLogger.success('AUTH_EXECUTION', `auth.signInWithEmailAndPassword resolved successfully for '${email}'`);
        } catch (error: any) {
            AuthLogger.error('AUTH_EXECUTION', 'LOGIN_FAILED', error, {
                email,
                errorCode: error?.code,
                errorMessage: error?.message
            });

            // If Firebase threw error (network or credentials mismatch), check if user exists in local storage
            let recovered = false;
            try {
                const users = JSON.parse(localStorage.getItem('vedrabi_users') || '{}');
                const matchedKey = Object.keys(users).find(k => normalizeEmail(k) === email);
                if (matchedKey) {
                    const userRecord = users[matchedKey];
                    AuthLogger.info('AUTH_FALLBACK', `Found user record '${matchedKey}' in local database, testing local credentials`);
                    let isMatch = false;
                    if (userRecord.passwordHash && userRecord.salt) {
                        isMatch = await verifyPasswordHash(password, userRecord.salt, userRecord.passwordHash);
                    } else if (userRecord.password) {
                        isMatch = (userRecord.password === password || userRecord.password === password.trim());
                    } else if (userRecord.passwordHash && !userRecord.salt) {
                        const testHash = await sha256Subtle(password.trim());
                        isMatch = (testHash === userRecord.passwordHash);
                    }

                    if (isMatch) {
                        AuthLogger.success('AUTH_FALLBACK', `Local credentials verified successfully! Falling back to local session.`);
                        const currentUser = { uid: userRecord.uid, email: email, emailVerified: true };
                        localStorage.setItem('vedrabi_current_user', JSON.stringify(currentUser));
                        localStorage.setItem('vedrabi_use_sandbox', 'true');
                        recovered = true;
                        if (typeof window._showSecurityVerifyTab === 'function') {
                            const acc = SecurityManager.getAccount(email);
                            window._showSecurityVerifyTab(email, acc ? acc.accountId : '@user_id');
                        } else {
                            window.location.href = 'index.html';
                        }
                    }
                }
            } catch (fallbackErr) {
                AuthLogger.warn('AUTH_FALLBACK', 'Local fallback check failed', fallbackErr);
            }

            if (!recovered) {
                showError(error);
            }
        } finally {
            setLoadingState(false);
        }
    });

    // 1-Click Instant Demo / Guest Access Button
    attachEvent('instantGuestLoginBtn', async () => {
        try {
            setLoadingState(true);
            const guestEmail = 'guest_analyst@vedrabi.com';
            const guestUid = 'uid_' + Date.now();
            const guestUser = {
                uid: guestUid,
                email: guestEmail,
                displayName: 'Vedra Analyst',
                emailVerified: true,
                securityPinVerified: true
            };

            // Register in local users
            const users = JSON.parse(localStorage.getItem('vedrabi_users') || '{}');
            users[guestEmail] = {
                uid: guestUid,
                email: guestEmail,
                displayName: 'Vedra Analyst',
                createdAt: new Date().toISOString()
            };
            localStorage.setItem('vedrabi_users', JSON.stringify(users));

            // Set up security PIN and account
            await SecurityManager.saveSecurityProfileAsync(guestEmail, '@vedra_pro', '12345678');
            SecurityManager.markSessionVerified(guestEmail);

            // Mark onboarding complete
            OnboardingManager.saveOnboarding(guestEmail, {
                language: 'en',
                roles: ['data_analyst'],
                goals: ['create_dashboards'],
                dataSources: ['google_sheets'],
                teamSize: 'medium',
                updateFrequency: 'daily',
                sampleDataCreated: true,
                completedAt: new Date().toISOString()
            });

            localStorage.setItem('vedrabi_current_user', JSON.stringify(guestUser));
            localStorage.setItem('vedrabi_use_sandbox', 'true');
            localStorage.setItem('vedrabi_last_activity', Date.now().toString());

            showMessage('Logged in successfully! Opening dashboard...', 'success');
            setTimeout(() => {
                window.location.replace('index.html');
            }, 300);
        } catch (e: any) {
            showError({ message: e.message || 'An error occurred' });
        } finally {
            setLoadingState(false);
        }
    });
    
    // Tab Switchers (Sign In vs Sign Up Mode)
    attachEvent('tabSwitchSignIn', () => {
        setAuthMode('signin');
    });

    attachEvent('tabSwitchSignUp', () => {
        setAuthMode('signup');
    });

    // Check URL query parameters for registration mode
    try {
        const search = window.location.search.toLowerCase();
        if (search.includes('signup') || search.includes('register') || search.includes('mode=signup')) {
            setAuthMode('signup');
        }
    } catch (_) {}

    // Core Email / Password Registration Execution
    const executeRegistration = async () => {
        if (!emailInput || !passwordInput) return;
        const email = normalizeEmail(emailInput.value);
        const password = passwordInput.value;

        AuthLogger.info('UI_SIGNUP_CLICK', `User clicked Sign Up for email: '${email}'`, {
            emailLength: email.length,
            passwordLength: password ? password.length : 0
        });

        // 1. Mandatory Privacy Policy Agreement Check
        const privacyCheckbox = getElement('registerPrivacyAgreeInput') as HTMLInputElement | null;
        if (!privacyCheckbox || !privacyCheckbox.checked) {
            AuthLogger.warn('UI_SIGNUP_VALIDATION', 'Privacy policy checkbox not accepted');
            showError({
                code: 'auth/privacy-policy-required',
                message: 'Please accept the Hash Privacy Policy and Security Terms to register. You can <a href="privacy.html" class="fw-bold text-primary text-decoration-underline" target="_blank">read the Hash Privacy Policy here</a>.'
            });
            const checkWrapper = getElement('registerPrivacyCheckWrapper');
            if (checkWrapper) {
                checkWrapper.style.border = '1.5px solid #ef4444';
                checkWrapper.style.background = 'rgba(239, 68, 68, 0.08)';
                checkWrapper.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                setTimeout(() => {
                    checkWrapper.style.border = '1px solid rgba(37, 99, 235, 0.2)';
                    checkWrapper.style.background = 'rgba(37, 99, 235, 0.05)';
                }, 4000);
            }
            if (privacyCheckbox) privacyCheckbox.focus();
            return;
        }

        if (!email || !password) {
            AuthLogger.warn('UI_SIGNUP_VALIDATION', 'Empty email or password provided');
            showError({ code: 'auth/invalid-email', message: 'Please enter both email and password.' });
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            AuthLogger.warn('UI_SIGNUP_VALIDATION', `Invalid email format: '${email}'`);
            showError({ code: 'auth/invalid-email', message: 'Please enter a valid email address (e.g., user@example.com).' });
            return;
        }

        if (password.length < 6) {
            AuthLogger.warn('UI_SIGNUP_VALIDATION', 'Password length < 6');
            showError({ code: 'auth/weak-password', message: 'Password must be at least 6 characters long.' });
            return;
        }

        if (loginErrorDiv) loginErrorDiv.style.display = 'none';
        setLoadingState(true);
        
        try {
            AuthLogger.info('AUTH_EXECUTION', `Invoking auth.createUserWithEmailAndPassword for '${email}'`);
            await auth.createUserWithEmailAndPassword(email, password);
            
            // Ensure local storage mirror has user with salted SHA-256 hash using normalized email
            try {
                const users = JSON.parse(localStorage.getItem('vedrabi_users') || '{}');
                if (!users[email]) {
                    const salt = generateSecureSalt(16);
                    const passwordHash = await hashPasswordWithSalt(password, salt);
                    users[email] = {
                        uid: 'user_' + Math.random().toString(36).substring(2, 11),
                        email: email,
                        passwordHash,
                        salt,
                        privacyAccepted: true,
                        privacyAcceptedAt: new Date().toISOString(),
                        createdAt: new Date().toISOString()
                    };
                    localStorage.setItem('vedrabi_users', JSON.stringify(users));
                    AuthLogger.info('AUTH_MIRROR', `Mirrored user '${email}' into local database`);
                }
            } catch (mirrorErr) {
                AuthLogger.warn('AUTH_MIRROR', 'Failed to mirror user into local database', mirrorErr);
            }

            // Also persist user profile in Firestore if active
            if (typeof firebase !== 'undefined' && firebase.firestore) {
                try {
                    const db = firebase.firestore();
                    db.collection('users').doc(email).set({
                        email: email,
                        privacyAccepted: true,
                        privacyAcceptedAt: new Date().toISOString(),
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    }, { merge: true }).catch(() => {});
                } catch (fsErr) {
                    AuthLogger.warn('AUTH_FIRESTORE', 'Failed to write initial firestore user profile', fsErr);
                }
            }

            AuthLogger.success('AUTH_EXECUTION', `Account created successfully for '${email}'`);
            showMessage('Account registered successfully!', 'success');
        } catch (error) {
            AuthLogger.error('AUTH_EXECUTION', 'SIGNUP_FAILED', error, {
                email,
                errorCode: (error as any)?.code,
                errorMessage: (error as any)?.message
            });
            showError(error);
        } finally {
            setLoadingState(false);
        }
    };

    // Registration button handlers
    attachEvent('submitRegisterBtn', executeRegistration);

    attachEvent('registerBtn', async () => {
        if (currentAuthMode === 'signin') {
            setAuthMode('signup');
        } else {
            // If already in sign up mode, clicking "Sign in" link in footer toggles to signin mode
            setAuthMode('signin');
        }
    });

    // Google Sign Up (in addition to Google Login)
    attachEvent('googleRegisterBtn', async () => {
        // Check privacy agreement for Google signup as well
        const privacyCheckbox = getElement('registerPrivacyAgreeInput') as HTMLInputElement | null;
        if (privacyCheckbox && !privacyCheckbox.checked) {
            showError({
                code: 'auth/privacy-policy-required',
                message: 'Please accept the Hash Privacy Policy and Security Terms to register.'
            });
            const checkWrapper = getElement('registerPrivacyCheckWrapper');
            if (checkWrapper) {
                checkWrapper.style.border = '1.5px solid #ef4444';
                checkWrapper.style.background = 'rgba(239, 68, 68, 0.08)';
                checkWrapper.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                setTimeout(() => {
                    checkWrapper.style.border = '1px solid rgba(37, 99, 235, 0.2)';
                    checkWrapper.style.background = 'rgba(37, 99, 235, 0.05)';
                }, 4000);
            }
            if (privacyCheckbox) privacyCheckbox.focus();
            return;
        }

        if (loginErrorDiv) loginErrorDiv.style.display = 'none';
        setLoadingState(true);
        
        try {
            const provider = (typeof firebase !== 'undefined' && firebase.auth) ? new firebase.auth.GoogleAuthProvider() : null;
            await auth.signInWithPopup(provider);
        } catch (error: any) {
            showError(error);
        } finally {
            setLoadingState(false);
        }
    });
    
    // Google Login
    attachEvent('googleLoginBtn', async () => {
        if (loginErrorDiv) loginErrorDiv.style.display = 'none';
        setLoadingState(true);
        
        try {
            const provider = (typeof firebase !== 'undefined' && firebase.auth) ? new firebase.auth.GoogleAuthProvider() : null;
            await auth.signInWithPopup(provider);
        } catch (error: any) {
            showError(error);
            
            if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request' || error.message?.includes('popup')) {
                if (loginErrorDiv) {
                    loginErrorDiv.innerHTML += `
                        <div class="mt-3 p-3 bg-warning bg-opacity-10 rounded-3 border border-warning border-opacity-30 text-start" style="font-size: 13px; line-height: 1.5; color: #854d0e;">
                            <div class="fw-bold mb-1"><i class="bi bi-info-circle-fill"></i> Google Popup Blocked</div>
                            Due to browser or iframe security policies, the Google popup window may have been blocked. Would you like to continue with a <strong>Secure Sandbox Account</strong>?
                            <div class="mt-2 text-center">
                                <button type="button" class="btn btn-sm btn-warning text-dark fw-bold px-3 py-1.5" id="sandboxGoogleFallbackBtn" style="border-radius:20px; font-size:12px; border: 1px solid rgba(133,77,14,0.3);">
                                    <i class="bi bi-shield-check"></i> Sign in with Sandbox Account
                                </button>
                            </div>
                        </div>
                    `;
                }
                
                const fallbackBtn = getElement('sandboxGoogleFallbackBtn');
                if (fallbackBtn) {
                    fallbackBtn.addEventListener('click', async () => {
                        if (loginErrorDiv) loginErrorDiv.style.display = 'none';
                        setLoadingState(true);
                        try {
                            localStorage.setItem('vedrabi_use_sandbox', 'true');
                            const email = 'demo_user@vedrabi.com';
                            const users = JSON.parse(localStorage.getItem('vedrabi_users') || '{}');
                            let uid = 'local_google_user';
                            const salt = (typeof CryptoUtils !== 'undefined' && CryptoUtils.generateSecureSalt) ? CryptoUtils.generateSecureSalt(16) : 'sandbox_salt_123';
                            const passwordHash = (typeof CryptoUtils !== 'undefined' && CryptoUtils.hashPasswordWithSaltSync) ? CryptoUtils.hashPasswordWithSaltSync('google_login_oauth', salt) : 'sandbox_hash_123';
                            users[email] = { uid, email, passwordHash, salt };
                            localStorage.setItem('vedrabi_users', JSON.stringify(users));
                            const currentUser = { uid, email, emailVerified: true };
                            localStorage.setItem('vedrabi_current_user', JSON.stringify(currentUser));
                            
                            showMessage('Sandbox Google sign-in successful!', 'success');
                            
                            // Route through Security Account check
                            if (!SecurityManager.isConfigured(email)) {
                                showSecuritySetupTab(email);
                            } else {
                                const acc = SecurityManager.getAccount(email);
                                showSecurityVerifyTab(email, acc ? acc.accountId : '');
                            }
                        } catch (err) {
                            showError(err);
                        } finally {
                            setLoadingState(false);
                        }
                    });
                }
            }
        } finally {
            setLoadingState(false);
        }
    });

    // Option cards selection toggle listeners
    const optionCards = document.querySelectorAll('.onboarding-option-card');
    optionCards.forEach(card => {
        const chk = card.querySelector('.form-check-input') as HTMLInputElement | null;
        if (chk) {
            chk.addEventListener('change', () => {
                if (chk.type === 'radio') {
                    const name = chk.name;
                    document.querySelectorAll(`input[name="${name}"]`).forEach(r => {
                        const parent = r.closest('.onboarding-option-card');
                        if (parent) parent.classList.remove('selected');
                    });
                    if (chk.checked) card.classList.add('selected');
                } else {
                    if (chk.checked) {
                        card.classList.add('selected');
                    } else {
                        card.classList.remove('selected');
                    }
                }
            });
        }
    });

    // Language selection listener to dynamically refresh text strings immediately
    const langRadios = document.querySelectorAll('input[name="onboarding_lang"]');
    langRadios.forEach(r => {
        r.addEventListener('change', () => {
            const htmlRadio = r as HTMLInputElement;
            if (htmlRadio.checked) {
                selectedLanguage = htmlRadio.value;
                renderOnboardingStep(currentOnboardingStep);
            }
        });
    });

    // Onboarding Navigation Action Buttons
    attachEvent('onboardingNextBtn', () => {
        if (currentOnboardingStep < 6) {
            renderOnboardingStep(currentOnboardingStep + 1);
        } else {
            const langRad = document.querySelector('input[name="onboarding_lang"]:checked') as HTMLInputElement | null;
            const lang = langRad ? langRad.value : 'en';

            const selectedRoles = Array.from(document.querySelectorAll('#onboardingStep1 .onboarding-chk:checked')).map(c => (c as HTMLInputElement).value);
            const selectedGoals = Array.from(document.querySelectorAll('#onboardingStep2 .onboarding-chk:checked')).map(c => (c as HTMLInputElement).value);
            const selectedDataSources = Array.from(document.querySelectorAll('#onboardingStep3 .onboarding-chk:checked')).map(c => (c as HTMLInputElement).value);
            
            const teamRad = document.querySelector('input[name="onboarding_teamsize"]:checked') as HTMLInputElement | null;
            const selectedTeamSize = teamRad ? teamRad.value : 'Small Team (2-10)';

            const freqRad = document.querySelector('input[name="onboarding_freq"]:checked') as HTMLInputElement | null;
            const selectedFrequency = freqRad ? freqRad.value : 'Daily Refresh';

            const themeRadio = document.querySelector('input[name="onboarding_theme_choice"]:checked') as HTMLInputElement | null;
            const preferredTheme = themeRadio ? themeRadio.value : 'silk_light';

            const sampleChk = document.getElementById('chk_auto_sample_data') as HTMLInputElement | null;
            const loadSampleData = sampleChk ? sampleChk.checked : true;

            const choices = {
                language: lang,
                roles: selectedRoles.length ? selectedRoles : ['BI Analyst'],
                goals: selectedGoals.length ? selectedGoals : ['Interactive Visual Dashboards'],
                dataSources: selectedDataSources.length ? selectedDataSources : ['Excel / CSV'],
                teamSize: selectedTeamSize,
                updateFrequency: selectedFrequency,
                preferredTheme: preferredTheme,
                loadSampleData: loadSampleData
            };

            const email = pendingUserEmail || (getSavedUser()?.email) || 'user@vedrabi.com';
            OnboardingManager.saveOnboarding(email, choices);

            if (preferredTheme === 'dark') {
                localStorage.setItem('theme', 'dark');
                document.documentElement.classList.add('dark-theme');
                document.body.classList.add('dark-theme');
            } else {
                localStorage.setItem('theme', 'light');
                document.documentElement.classList.remove('dark-theme');
                document.body.classList.remove('dark-theme');
            }

            const dict = ONBOARDING_I18N[lang] || ONBOARDING_I18N.en;
            showMessage(dict.success_msg, 'success');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 800);
        }
    });

    attachEvent('onboardingBackBtn', () => {
        if (currentOnboardingStep > 0) {
            renderOnboardingStep(currentOnboardingStep - 1);
        }
    });

    attachEvent('onboardingSkipBtn', () => {
        const email = pendingUserEmail || (getSavedUser()?.email) || 'user@vedrabi.com';
        OnboardingManager.skipOnboarding(email);
        const dict = ONBOARDING_I18N[selectedLanguage] || ONBOARDING_I18N.en;
        showMessage(dict.btn_skip + '...', 'info');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 500);
    });

    // Expose form controls on window
    window._showSecuritySetupTab = showSecuritySetupTab;
    window._showSecurityVerifyTab = showSecurityVerifyTab;
    window._showOnboardingTab = showOnboardingTab;
}

// Auth state listener
function initializeAuthStateListener() {
    const pathname = window.location.pathname.toLowerCase();
    const isLoginPage = pathname.includes('login');
    const isEditPage = pathname.includes('edit_data');
    const isDashboardPage = !isLoginPage && !isEditPage;
    
    auth.onAuthStateChanged(async (user: any) => {
        const activeUser = isValidUserObj(user) ? user : getSavedUser();
        
        if (activeUser) {
            const email = (activeUser.email || activeUser.uid || '').toLowerCase().trim();
            const userStore: any = {
                uid: activeUser.uid,
                email: activeUser.email || 'Analyst'
            };

            const isConfigured = SecurityManager.isConfigured(email);
            const isVerified = SecurityManager.isSessionVerified();

            if (isConfigured && isVerified) {
                userStore.securityPinVerified = true;
            }

            localStorage.setItem('vedrabi_current_user', JSON.stringify(userStore));

            if (isLoginPage) {
                if (!isConfigured) {
                    if (window._showSecuritySetupTab) {
                        window._showSecuritySetupTab(email);
                    }
                    return;
                }

                if (!isVerified) {
                    const acc = SecurityManager.getAccount(email);
                    if (window._showSecurityVerifyTab) {
                        window._showSecurityVerifyTab(email, acc ? acc.accountId : '@user_id');
                    }
                    return;
                }

                const isOnboarded = OnboardingManager.isCompleted(email);
                if (!isOnboarded) {
                    if (window._showOnboardingTab) {
                        window._showOnboardingTab(email);
                    }
                    return;
                }

                if (!window.location.href.includes('index.html')) {
                    window.location.replace('index.html');
                }
                return;
            }

            // On dashboard/edit pages: enforce security check
            if (!isConfigured || !isVerified) {
                if (!window.location.href.includes('login.html')) {
                    window.location.replace('login.html');
                }
                return;
            }

            // On dashboard/edit pages: enforce onboarding check
            const isOnboarded = OnboardingManager.isCompleted(email);
            if (!isOnboarded) {
                if (!window.location.href.includes('login.html')) {
                    window.location.replace('login.html?onboarding=true');
                }
                return;
            }
            
            setCurrentUserId(activeUser.uid);
            const userEmailSpan = getElement('userEmail');
            const userInfoDiv = getElement('userInfo');
            if (userEmailSpan) userEmailSpan.textContent = activeUser.email || 'Analyst';
            if (userInfoDiv) userInfoDiv.style.display = 'flex';
            
            try {
                await initData();
                await loadDashboardSettings();
                plotAll();
                loadAndDisplayUserData();
                
                if (headers.length > 0) {
                    populateColumnDragLists(headers);
                    const isLockModeEnabled = getElement('toggleLockModeBtn')?.classList.contains('locked') || document.body.classList.contains('dashboard-locked');
                    if (!isLockModeEnabled) initializeDragAndDrop();
                }

                // Trigger Post-Onboarding Welcome Modal & Sample Data Flow
                initializeWelcomeFlow(email);
            } catch (err) {
                console.error('Error loading data:', err);
            }
        } else {
            if (!isLoginPage && (isDashboardPage || isEditPage)) {
                localStorage.removeItem('vedrabi_current_user');
                setCurrentUserId(null);
                const userInfoDiv = getElement('userInfo');
                if (userInfoDiv) userInfoDiv.style.display = 'none';
                
                if (!window.location.href.includes('login.html')) {
                    window.location.replace('login.html');
                }
            }
        }
    });
}

// Export main function
export function initializeLoginAndAuth() {
    initializeLoginPageLogic();
    initializeAuthStateListener();
}
