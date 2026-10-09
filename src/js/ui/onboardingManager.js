/**
 * Vedra BI Onboarding Manager
 * Stores and manages new user onboarding preferences, business roles, primary goals,
 * preferred data sources, and dashboard theme settings.
 */

const ONBOARDING_KEY = 'vedrabi_user_onboardings';

export const OnboardingManager = {
    /**
     * Check if user has completed onboarding
     * @param {string} email 
     * @returns {boolean}
     */
    isCompleted(email) {
        if (!email) return false;
        const key = email.toLowerCase().trim();
        const data = this.getAllOnboardings();
        return Boolean(data[key] && data[key].completedAt);
    },

    /**
     * Get all onboarding data map from storage
     */
    getAllOnboardings() {
        try {
            const raw = localStorage.getItem(ONBOARDING_KEY);
            return raw ? JSON.parse(raw) : {};
        } catch (e) {
            console.warn('Error reading onboarding data from storage:', e);
            return {};
        }
    },

    /**
     * Get onboarding record for a specific user
     * @param {string} email 
     * @returns {Object|null}
     */
    getOnboarding(email) {
        if (!email) return null;
        const key = email.toLowerCase().trim();
        const data = this.getAllOnboardings();
        return data[key] || null;
    },

    /**
     * Save onboarding choices for user
     * @param {string} email 
     * @param {Object} onboardingChoices 
     */
    saveOnboarding(email, onboardingChoices = {}) {
        if (!email) return;
        const key = email.toLowerCase().trim();
        const allData = this.getAllOnboardings();

        const record = {
            language: onboardingChoices.language || 'hi',
            roles: onboardingChoices.roles || [],
            goals: onboardingChoices.goals || [],
            dataSources: onboardingChoices.dataSources || [],
            teamSize: onboardingChoices.teamSize || '1-10',
            updateFrequency: onboardingChoices.updateFrequency || 'daily',
            preferredTheme: onboardingChoices.preferredTheme || 'silk_light',
            loadSampleData: onboardingChoices.loadSampleData !== undefined ? onboardingChoices.loadSampleData : true,
            completedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        allData[key] = record;
        localStorage.setItem(ONBOARDING_KEY, JSON.stringify(allData));

        // Sync with Firestore if available
        if (typeof firebase !== 'undefined' && firebase.firestore) {
            try {
                const db = firebase.firestore();
                db.collection('user_onboardings').doc(key).set(record, { merge: true }).catch(() => {});
            } catch (e) {
                console.warn('Firestore onboarding sync non-fatal warning:', e);
            }
        }

        return record;
    },

    /**
     * Skip onboarding for user with defaults
     * @param {string} email 
     */
    skipOnboarding(email) {
        return this.saveOnboarding(email, {
            language: 'hi',
            roles: ['General Business User'],
            goals: ['Automated BI Analytics & Visual Dashboards'],
            dataSources: ['Excel / CSV'],
            teamSize: '1-10',
            updateFrequency: 'daily',
            preferredTheme: 'silk_light'
        });
    }
};

// Global window object exposure
if (typeof window !== 'undefined') {
    window.OnboardingManager = OnboardingManager;
}
