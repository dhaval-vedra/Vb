/**
 * Vedra BI Security & Unique Account ID Manager
 * Manages 8-Digit Security PIN/Password with SHA-256 Salted Hashing & Unique Account IDs per user account.
 */

import { 
    generateSecureSalt, 
    hashPasswordWithSalt, 
    sha256Fallback, 
    timingSafeEqual,
    verifyPasswordHash,
    verifyPasswordHashSync 
} from './cryptoUtils.ts';

declare const firebase: any;
declare const bootstrap: any;

export interface SecurityAccountProfile {
    accountId: string;
    pinHash?: string;
    salt?: string;
    securityPin?: string;
    updatedAt?: string;
    [key: string]: any;
}

export interface StoredCurrentUserSession {
    uid?: string;
    email?: string;
    emailVerified?: boolean;
    accountId?: string;
    securityPinVerified?: boolean;
    securityVerifiedAt?: number;
    [key: string]: any;
}

declare global {
    interface Window {
        SecurityManager?: typeof SecurityManager;
        SessionTimeoutManager?: typeof SessionTimeoutManager;
        performUserLogout?: typeof performUserLogout;
    }
}

const SECURITY_ACCOUNTS_KEY = 'vedrabi_security_accounts';

export const SecurityManager = {
    /**
     * Generate secure random salt using CSPRNG
     */
    generateSalt(): string {
        return generateSecureSalt(16);
    },

    /**
     * Synchronous SHA-256 salted password hashing fallback
     */
    hashPassword(pin: string, salt: string): string {
        const cleanPin = (pin || '').trim();
        return sha256Fallback(`vedrabi_salt_${salt}_pass_${cleanPin}`);
    },

    /**
     * Asynchronous SubtleCrypto Web API salted password hashing
     */
    async hashPasswordAsync(pin: string, salt: string): Promise<string> {
        return await hashPasswordWithSalt(pin, salt);
    },

    /**
     * Get all stored security account profiles.
     */
    getAllAccounts(): Record<string, SecurityAccountProfile> {
        try {
            return JSON.parse(localStorage.getItem(SECURITY_ACCOUNTS_KEY) || '{}');
        } catch (e) {
            return {};
        }
    },

    /**
     * Get security profile for a given email or UID.
     */
    getAccount(emailOrUid: string): SecurityAccountProfile | null {
        if (!emailOrUid) return null;
        const accounts = this.getAllAccounts();
        const key = emailOrUid.toLowerCase().trim();
        return accounts[key] || null;
    },

    /**
     * Check if an account has configured their Unique Account ID and 8-Digit Security PIN/Password.
     */
    isConfigured(emailOrUid: string): boolean {
        const acc = this.getAccount(emailOrUid);
        return !!(acc && acc.accountId && (acc.pinHash || (acc.securityPin && acc.securityPin.length === 8)));
    },

    /**
     * Check if a proposed Unique Account ID is available (unique across all users).
     */
    isAccountIdAvailable(accountId: string, currentEmail: string = ''): boolean {
        if (!accountId) return false;
        let cleanId = accountId.trim();
        if (cleanId.startsWith('@')) cleanId = cleanId.substring(1);
        cleanId = cleanId.toLowerCase();

        if (cleanId.length < 3) return false;

        const accounts = this.getAllAccounts();
        const currentKey = (currentEmail || '').toLowerCase().trim();

        for (const email in accounts) {
            if (email === currentKey) continue;
            const existingId = (accounts[email].accountId || '').replace(/^@/, '').toLowerCase();
            if (existingId === cleanId) {
                return false; // Already taken by another user
            }
        }
        return true;
    },

    /**
     * Save/Set Unique Account ID and 8-Digit Security PIN/Password securely using SHA-256 salted hashing.
     */
    saveSecurityProfile(emailOrUid: string, accountId: string, securityPin: string): SecurityAccountProfile {
        if (!emailOrUid) throw new Error('उपयोगकर्ता ईमेल आवश्यक है।');
        
        let cleanAccountId = accountId ? accountId.trim() : '';
        if (cleanAccountId && !cleanAccountId.startsWith('@')) {
            cleanAccountId = '@' + cleanAccountId;
        }

        if (!cleanAccountId || cleanAccountId.length < 4) {
            throw new Error('यूनिक अकाउंट ID कम से कम 3 अक्षरों की होनी चाहिए (उदा. @username)।');
        }

        if (!this.isAccountIdAvailable(cleanAccountId, emailOrUid)) {
            throw new Error('यह यूनिक अकाउंट ID पहले से उपयोग में है। कृपया कोई अन्य ID चुनें।');
        }

        const cleanPin = (securityPin || '').trim();
        if (cleanPin.length !== 8) {
            throw new Error('सुरक्षा पासवर्ड ठीक 8 अंकों/अक्षरों (8 digits/chars) का होना आवश्यक है।');
        }

        const accounts = this.getAllAccounts();
        const key = emailOrUid.toLowerCase().trim();

        // Generate cryptographic salt & SHA-256 hash using SubtleCrypto API
        const salt = this.generateSalt();
        const pinHash = this.hashPassword(cleanPin, salt);

        const profileData: SecurityAccountProfile = {
            accountId: cleanAccountId,
            pinHash: pinHash,
            salt: salt,
            updatedAt: new Date().toISOString()
        };

        const existingAcc = accounts[key] || {};
        delete existingAcc.securityPin; // Never store plaintext passwords in localStorage

        accounts[key] = {
            ...existingAcc,
            ...profileData
        };

        localStorage.setItem(SECURITY_ACCOUNTS_KEY, JSON.stringify(accounts));

        // Also update Firestore if available
        if (typeof firebase !== 'undefined' && firebase.firestore) {
            try {
                const db = firebase.firestore();
                db.collection('security_profiles').doc(key).set(profileData, { merge: true }).catch(() => {});
            } catch (e) {}
        }

        // Update current session user in localStorage
        this.markSessionVerified(emailOrUid, cleanAccountId);

        return profileData;
    },

    /**
     * Async save profile using SubtleCrypto Web API
     */
    async saveSecurityProfileAsync(emailOrUid: string, accountId: string, securityPin: string): Promise<SecurityAccountProfile> {
        if (!emailOrUid) throw new Error('उपयोगकर्ता ईमेल आवश्यक है।');
        
        let cleanAccountId = accountId ? accountId.trim() : '';
        if (cleanAccountId && !cleanAccountId.startsWith('@')) {
            cleanAccountId = '@' + cleanAccountId;
        }

        if (!cleanAccountId || cleanAccountId.length < 4) {
            throw new Error('यूनिक अकाउंट ID कम से कम 3 अक्षरों की होनी चाहिए (उदा. @username)।');
        }

        if (!this.isAccountIdAvailable(cleanAccountId, emailOrUid)) {
            throw new Error('यह यूनिक अकाउंट ID पहले से उपयोग में है। कृपया कोई अन्य ID चुनें।');
        }

        const cleanPin = (securityPin || '').trim();
        if (cleanPin.length !== 8) {
            throw new Error('सुरक्षा पासवर्ड ठीक 8 अंकों/अक्षरों (8 digits/chars) का होना आवश्यक है।');
        }

        const accounts = this.getAllAccounts();
        const key = emailOrUid.toLowerCase().trim();

        const salt = this.generateSalt();
        const pinHash = await this.hashPasswordAsync(cleanPin, salt);

        const profileData: SecurityAccountProfile = {
            accountId: cleanAccountId,
            pinHash: pinHash,
            salt: salt,
            updatedAt: new Date().toISOString()
        };

        const existingAcc = accounts[key] || {};
        delete existingAcc.securityPin;

        accounts[key] = {
            ...existingAcc,
            ...profileData
        };

        localStorage.setItem(SECURITY_ACCOUNTS_KEY, JSON.stringify(accounts));

        if (typeof firebase !== 'undefined' && firebase.firestore) {
            try {
                const db = firebase.firestore();
                db.collection('security_profiles').doc(key).set(profileData, { merge: true }).catch(() => {});
            } catch (e) {}
        }

        this.markSessionVerified(emailOrUid, cleanAccountId);

        return profileData;
    },

    /**
     * Verify entered 8-digit security PIN/password against stored SHA-256 hash profile.
     */
    verifyPin(emailOrUid: string, enteredPin: string): boolean {
        const acc = this.getAccount(emailOrUid);
        if (!acc) return false;
        const cleanEntered = (enteredPin || '').trim();

        // Production SHA-256 Salted Hashed verification
        if (acc.pinHash && acc.salt) {
            return verifyPasswordHashSync(cleanEntered, acc.salt, acc.pinHash);
        }

        // Legacy Plaintext Password auto-migration (on first successful login after update)
        if (acc.securityPin) {
            if (timingSafeEqual(cleanEntered, acc.securityPin)) {
                try {
                    const salt = this.generateSalt();
                    const pinHash = this.hashPassword(cleanEntered, salt);
                    acc.pinHash = pinHash;
                    acc.salt = salt;
                    delete acc.securityPin;

                    const accounts = this.getAllAccounts();
                    const key = emailOrUid.toLowerCase().trim();
                    accounts[key] = acc;
                    localStorage.setItem(SECURITY_ACCOUNTS_KEY, JSON.stringify(accounts));

                    if (typeof firebase !== 'undefined' && firebase.firestore) {
                        const db = firebase.firestore();
                        db.collection('security_profiles').doc(key).set({
                            pinHash,
                            salt
                        }, { merge: true }).catch(() => {});
                    }
                } catch (e) {}
                return true;
            }
        }

        return false;
    },

    /**
     * Async verify entered 8-digit security PIN using SubtleCrypto Web API
     */
    async verifyPinAsync(emailOrUid: string, enteredPin: string): Promise<boolean> {
        const acc = this.getAccount(emailOrUid);
        if (!acc) return false;
        const cleanEntered = (enteredPin || '').trim();

        if (acc.pinHash && acc.salt) {
            return await verifyPasswordHash(cleanEntered, acc.salt, acc.pinHash);
        }

        return this.verifyPin(emailOrUid, enteredPin);
    },

    /**
     * Mark current browser session as security PIN verified.
     */
    markSessionVerified(emailOrUid: string, accountId: string | null = null): void {
        try {
            const saved = localStorage.getItem('vedrabi_current_user');
            if (saved) {
                const parsed: StoredCurrentUserSession = JSON.parse(saved);
                parsed.securityPinVerified = true;
                parsed.securityVerifiedAt = Date.now();
                if (accountId) parsed.accountId = accountId;
                else {
                    const acc = this.getAccount(emailOrUid);
                    if (acc && acc.accountId) parsed.accountId = acc.accountId;
                }
                localStorage.setItem('vedrabi_current_user', JSON.stringify(parsed));
            }
        } catch (e) {}
    },

    /**
     * Check if current session has verified 8-digit security PIN.
     */
    isSessionVerified(): boolean {
        try {
            const saved = localStorage.getItem('vedrabi_current_user');
            if (!saved) return false;
            const parsed: StoredCurrentUserSession = JSON.parse(saved);
            const email = parsed.email || parsed.uid || '';

            // If account is not configured yet, session is not verified
            if (!this.isConfigured(email)) return false;

            return parsed.securityPinVerified === true;
        } catch (e) {
            return false;
        }
    }
};

/**
 * Automated Session Timeout Manager (30-minute idle time monitoring)
 */
export const SessionTimeoutManager = {
    TIMEOUT_MS: 30 * 60 * 1000, // 30 minutes in milliseconds
    CHECK_INTERVAL_MS: 10000,   // Check every 10 seconds
    THROTTLE_MS: 10000,         // Throttled activity update threshold (10s)
    lastActivityTime: Date.now(),
    timerId: null as any,

    init(): void {
        if (typeof window === 'undefined') return;

        // Load existing timestamp or set initial
        const stored = localStorage.getItem('vedrabi_last_activity');
        const now = Date.now();
        if (stored) {
            const parsed = parseInt(stored, 10);
            if (!isNaN(parsed)) {
                // Check if session is already expired on startup
                if (now - parsed > this.TIMEOUT_MS) {
                    this.triggerTimeout();
                    return;
                }
                this.lastActivityTime = parsed;
            }
        } else {
            this.updateActivity(now);
        }

        // Listen for user interaction events across the page
        const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart', 'pointerdown'];
        const handleUserActivity = () => {
            const current = Date.now();
            if (current - this.lastActivityTime >= this.THROTTLE_MS) {
                this.updateActivity(current);
            }
        };

        events.forEach(evt => {
            window.addEventListener(evt, handleUserActivity, { passive: true });
        });

        // Periodic background timer check for inactivity
        if (this.timerId) clearInterval(this.timerId);
        this.timerId = setInterval(() => {
            this.checkTimeout();
        }, this.CHECK_INTERVAL_MS);
    },

    updateActivity(timestamp: number = Date.now()): void {
        this.lastActivityTime = timestamp;
        try {
            localStorage.setItem('vedrabi_last_activity', timestamp.toString());
        } catch (e) {}
    },

    checkTimeout(): void {
        const stored = localStorage.getItem('vedrabi_last_activity');
        const now = Date.now();
        const lastTime = stored ? parseInt(stored, 10) : this.lastActivityTime;

        if (!isNaN(lastTime) && (now - lastTime > this.TIMEOUT_MS)) {
            this.triggerTimeout();
        }
    },

    triggerTimeout(): void {
        if (this.timerId) clearInterval(this.timerId);
        try {
            localStorage.removeItem('vedrabi_current_user');
            localStorage.removeItem('vedrabi_last_activity');
            localStorage.removeItem('vedrabi_use_sandbox');
        } catch (e) {}

        if (typeof window !== 'undefined') {
            if (!window.location.href.includes('login.html')) {
                window.location.replace('login.html?reason=timeout');
            }
        }
    }
};

/**
 * Universal Production-Grade Logout Helper
 * @param reason 'logout' | 'timeout' | 'unauthorized'
 */
export async function performUserLogout(reason: string = 'logout'): Promise<void> {
    try {
        localStorage.removeItem('vedrabi_current_user');
        localStorage.removeItem('vedrabi_last_activity');
        localStorage.removeItem('vedrabi_use_sandbox');

        // Sign out Firebase user session if initialized
        if (typeof firebase !== 'undefined' && firebase.auth) {
            try {
                await firebase.auth().signOut();
            } catch (e) {}
        }
    } catch (err) {
        console.error('Logout error:', err);
    } finally {
        // Safely close Bootstrap offcanvas/modal if open
        const offcanvasSidebar = document.getElementById('offcanvasSidebar');
        if (offcanvasSidebar && typeof bootstrap !== 'undefined') {
            try {
                const bsOffcanvas = bootstrap.Offcanvas.getInstance(offcanvasSidebar);
                if (bsOffcanvas) bsOffcanvas.hide();
            } catch (e) {}
        }
        
        window.location.replace(`login.html?reason=${reason}`);
    }
}

// Global expose for inline head scripts and HTML event handlers
if (typeof window !== 'undefined') {
    window.SecurityManager = SecurityManager;
    window.SessionTimeoutManager = SessionTimeoutManager;
    window.performUserLogout = performUserLogout;
}
