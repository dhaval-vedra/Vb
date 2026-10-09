/**
 * CDN Manager and Fallback Loader Engine
 * Provides dual-layered fallback mechanisms, automated CDN health checks,
 * and background asset loading to make the dashboard resilient against network latency or CDN outages.
 */

const CDN_REGISTRY = {
    bootstrapCss: {
        type: 'style',
        primary: 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
        fallback: 'https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/css/bootstrap.min.css',
        globalVar: null
    },
    bootstrapIcons: {
        type: 'style',
        primary: 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css',
        fallback: 'https://cdnjs.cloudflare.com/ajax/libs/bootstrap-icons/1.11.3/font/bootstrap-icons.min.css',
        globalVar: null
    },
    bootstrapJs: {
        type: 'script',
        primary: 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js',
        fallback: 'https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/js/bootstrap.bundle.min.js',
        globalVar: 'bootstrap'
    },
    echarts: {
        type: 'script',
        primary: 'https://cdn.jsdelivr.net/npm/echarts/dist/echarts.min.js',
        fallback: 'https://cdnjs.cloudflare.com/ajax/libs/echarts/5.5.0/echarts.min.js',
        globalVar: 'echarts'
    },
    plotly: {
        type: 'script',
        primary: 'https://cdn.plot.ly/plotly-2.32.0.min.js',
        fallback: 'https://cdn.jsdelivr.net/npm/plotly.js-dist@2.32.0/plotly.min.js',
        globalVar: 'Plotly'
    },
    xlsx: {
        type: 'script',
        primary: 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js',
        fallback: 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
        globalVar: 'XLSX'
    },
    papaparse: {
        type: 'script',
        primary: 'https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.4.1/papaparse.min.js',
        fallback: 'https://cdn.jsdelivr.net/npm/papaparse@5.4.1/papaparse.min.js',
        globalVar: 'Papa'
    },
    html2canvas: {
        type: 'script',
        primary: 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
        fallback: 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js',
        globalVar: 'html2canvas'
    },
    jspdf: {
        type: 'script',
        primary: 'https://cdnjs.cloudflare.com/ajax/libs/jsPDF/2.5.1/jspdf.umd.min.js',
        fallback: 'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js',
        globalVar: 'jspdf'
    },
    showdown: {
        type: 'script',
        primary: 'https://cdn.jsdelivr.net/npm/showdown/dist/showdown.min.js',
        fallback: 'https://cdnjs.cloudflare.com/ajax/libs/showdown/2.1.0/showdown.min.js',
        globalVar: 'showdown'
    },
    pickr: {
        type: 'script',
        primary: 'https://cdn.jsdelivr.net/npm/@simonwep/pickr/dist/pickr.min.js',
        fallback: 'https://unpkg.com/@simonwep/pickr/dist/pickr.min.js',
        globalVar: 'Pickr'
    }
};

/**
 * Global Callback for script/link errors in HTML.
 * Handles instant recovery on load failures.
 */
window.handleCdnError = function(element, fallbackUrl) {
    console.error(`[CDN Fallback Engine] Failed to load resource from: ${element.src || element.href}`);
    
    // Check if we already tried the fallback to avoid infinite loops
    if (element.dataset.fallbackTried === 'true') {
        console.error(`[CDN Fallback Engine] Critical Failure: Fallback also failed for ${fallbackUrl}`);
        return;
    }

    if (element.tagName === 'SCRIPT') {
        const script = document.createElement('script');
        script.src = fallbackUrl;
        script.dataset.fallbackTried = 'true';
        script.onload = () => console.log(`[CDN Fallback Engine] Successfully loaded fallback script: ${fallbackUrl}`);
        script.onerror = () => console.error(`[CDN Fallback Engine] Failed to load fallback script: ${fallbackUrl}`);
        document.head.appendChild(script);
    } else if (element.tagName === 'LINK') {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = fallbackUrl;
        link.dataset.fallbackTried = 'true';
        link.onload = () => console.log(`[CDN Fallback Engine] Successfully loaded fallback stylesheet: ${fallbackUrl}`);
        link.onerror = () => console.error(`[CDN Fallback Engine] Failed to load fallback stylesheet: ${fallbackUrl}`);
        document.head.appendChild(link);
    }
};

/**
 * Validates that all critical third-party dependencies are successfully loaded.
 * If any global variables are missing, it dynamically loads their fallback resources.
 */
export async function verifyAndRecoverCDNs() {
    console.log('[CDN Fallback Engine] Checking integrity of CDN dependencies...');
    const missingLibs = [];

    for (const [key, lib] of Object.entries(CDN_REGISTRY)) {
        if (lib.type === 'script' && lib.globalVar) {
            // Check if global variable is defined
            const isLoaded = !!(
                window[lib.globalVar] || 
                (typeof lib.globalVar === 'string' && lib.globalVar.includes('.') && getNestedKey(window, lib.globalVar))
            );
            if (!isLoaded) {
                console.warn(`[CDN Fallback Engine] Missing global library: ${lib.globalVar}. Triggering recovery...`);
                missingLibs.push({ key, ...lib });
            }
        }
    }

    if (missingLibs.length === 0) {
        console.log('[CDN Fallback Engine] All CDN libraries are intact and fully loaded!');
        return true;
    }

    // Recover missing libraries sequentially
    for (const lib of missingLibs) {
        try {
            await dynamicLoadScript(lib.fallback);
            console.log(`[CDN Fallback Engine] Successfully recovered library '${lib.globalVar}' from backup CDN.`);
        } catch (err) {
            console.error(`[CDN Fallback Engine] Failed to recover '${lib.globalVar}' from backup CDN: ${err.message}`);
        }
    }

    return false;
}

/**
 * Dynamically loads a script file in the background.
 */
function dynamicLoadScript(url) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = url;
        script.async = true;
        script.onload = resolve;
        script.onerror = () => reject(new Error(`Failed to load script: ${url}`));
        document.head.appendChild(script);
    });
}

/**
 * Helper to fetch nested global keys (like jspdf.jsPDF)
 */
function getNestedKey(obj, path) {
    return path.split('.').reduce((prev, curr) => prev ? prev[curr] : null, obj);
}
