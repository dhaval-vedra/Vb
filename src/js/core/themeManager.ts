/**
 * Central Theme Manager for Vedra BI
 * Provides Zero-FOUC initialization and seamless, jitter-free transitions
 * between 'dark' and 'light' modes across all UI components and charts.
 */

export type ThemeMode = 'dark' | 'light';

export interface ThemeChangeEventDetail {
    theme: ThemeMode;
    isDark: boolean;
}

/**
 * Gets the current active theme mode ('dark' | 'light')
 */
export function getCurrentTheme(): ThemeMode {
    if (typeof document === 'undefined') return 'light';
    if (document.documentElement.classList.contains('dark-theme') || document.body?.classList.contains('dark-theme')) {
        return 'dark';
    }
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
}

/**
 * Returns true if dark mode is currently active
 */
export function isDarkMode(): boolean {
    return getCurrentTheme() === 'dark';
}

/**
 * Applies the requested theme seamlessly across DOM, Bootstrap, and localStorage
 */
export function applyTheme(theme: ThemeMode, withTransition: boolean = true): void {
    const isDark = theme === 'dark';
    const root = document.documentElement;
    const body = document.body;

    // Save preference
    try {
        localStorage.setItem('theme', theme);
    } catch (e) {
        console.warn('[ThemeManager] Could not write theme to localStorage', e);
    }

    // Apply temporary transition class for smooth visual morphing
    if (withTransition && body) {
        body.classList.add('theme-transitioning');
    }

    // Synchronize HTML element
    if (isDark) {
        root.classList.add('dark-theme');
        root.classList.remove('silk-light-theme');
        root.setAttribute('data-bs-theme', 'dark');
        root.style.colorScheme = 'dark';
    } else {
        root.classList.remove('dark-theme');
        root.classList.add('silk-light-theme');
        root.setAttribute('data-bs-theme', 'light');
        root.style.colorScheme = 'light';
    }

    // Synchronize Body element
    if (body) {
        if (isDark) {
            body.classList.add('dark-theme');
            body.classList.remove('silk-light-theme');
            body.setAttribute('data-bs-theme', 'dark');
        } else {
            body.classList.remove('dark-theme');
            body.classList.add('silk-light-theme');
            body.setAttribute('data-bs-theme', 'light');
        }
    }

    // Synchronize Offcanvas drawers & popups
    const offcanvasSidebar = document.getElementById('offcanvasSidebar');
    if (offcanvasSidebar) {
        offcanvasSidebar.classList.toggle('dark-theme', isDark);
    }
    const offcanvasNav = document.getElementById('offcanvasNav');
    if (offcanvasNav) {
        offcanvasNav.classList.toggle('dark-theme', isDark);
    }

    // Synchronize Theme indicator widgets in UI if present
    const statTheme = document.getElementById('statActiveTheme');
    if (statTheme) {
        statTheme.textContent = isDark ? "डार्क थीम" : "सिल्क-लाइट";
    }

    const themeToggleIcons = document.querySelectorAll('.theme-toggle-icon, #themeToggleIcon, #toggleTheme i, #menuToggleTheme i');
    themeToggleIcons.forEach(icon => {
        if (isDark) {
            icon.className = 'bi bi-sun-fill text-warning theme-toggle-icon';
        } else {
            icon.className = 'bi bi-moon-stars-fill text-secondary theme-toggle-icon';
        }
    });

    const themeToggleText = document.getElementById('themeToggleText');
    if (themeToggleText) {
        themeToggleText.textContent = isDark ? 'Light Mode' : 'Dark Mode';
    }

    // Broadcast standard event for dynamic subsystems (Charts, Tables, Pivot)
    window.dispatchEvent(new CustomEvent('themeChanged', {
        detail: { theme, isDark } as ThemeChangeEventDetail
    }));

    // Remove transition lock after animation completes so hover states remain snappy
    if (withTransition && body) {
        setTimeout(() => {
            body.classList.remove('theme-transitioning');
        }, 300);
    }
}

/**
 * Toggles between dark and light modes
 */
export function toggleTheme(withTransition: boolean = true): ThemeMode {
    const current = getCurrentTheme();
    const next: ThemeMode = current === 'dark' ? 'light' : 'dark';
    applyTheme(next, withTransition);
    return next;
}

/**
 * Initializes theme on page load without transition delay (Zero-FOUC)
 */
export function initThemeBootstrap(): void {
    const current = getCurrentTheme();
    applyTheme(current, false);

    // Watch for OS system preference changes if user hasn't explicitly set a preference
    if (window.matchMedia) {
        const media = window.matchMedia('(prefers-color-scheme: dark)');
        media.addEventListener('change', (e) => {
            if (!localStorage.getItem('theme')) {
                applyTheme(e.matches ? 'dark' : 'light', true);
            }
        });
    }
}

/**
 * Subscribe to theme change events
 */
export function onThemeChange(callback: (isDark: boolean, theme: ThemeMode) => void): () => void {
    const handler = (e: Event) => {
        const detail = (e as CustomEvent<ThemeChangeEventDetail>).detail;
        callback(detail.isDark, detail.theme);
    };
    window.addEventListener('themeChanged', handler);
    return () => window.removeEventListener('themeChanged', handler);
}
