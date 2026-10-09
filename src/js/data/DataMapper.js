// js/DataMapper.js

/**
 * Extracts and maps data from various API formats into a standardized array of objects.
 * @param {object|array} apiData - The raw data received from the API.
 * @param {string} dataPath - Optional dot-notation path to extract nested data (e.g. 'data.results').
 * @returns {{headers: string[], data: object[]}} - An object containing mapped headers and the data array.
 */
export function mapApiData(apiData, dataPath = '') {
    let extractedData = [];
    let headers = [];
    
    let targetData = apiData;
    if (dataPath) {
        const pathData = getValueByPath(apiData, dataPath);
        if (pathData !== undefined) {
            targetData = pathData;
        } else {
            console.warn(`Data path "${dataPath}" was not found in API response.`);
        }
    }
    
    // Case 1: Direct array of objects
    if (Array.isArray(targetData) && targetData.length > 0) {
        extractedData = targetData.map(cleanKeys);
        headers = Object.keys(extractedData[0]);
    }
    // Case 2: Nested object
    else if (typeof targetData === 'object' && targetData !== null) {
        const dataKey = findDataKey(targetData);
        if (dataKey && typeof targetData[dataKey] === 'object') {
            const nestedData = targetData[dataKey];
            
            // Convert nested object into array
            extractedData = Object.entries(nestedData).map(([timestamp, values]) => {
                const entry = { timestamp, ...values };
                return cleanKeys(entry);
            });
            
            if (extractedData.length > 0) {
                headers = Object.keys(extractedData[0]);
            }
        } else {
            // Treat the object itself as a single-record array or try to map its values
            extractedData = [cleanKeys(targetData)];
            headers = Object.keys(extractedData[0]);
        }
    }
    
    if (extractedData.length === 0) {
        throw new Error("API डेटा को सही तरीके से मैप नहीं किया जा सका: कोई वैध data key या array नहीं मिला।");
    }
    
    return { headers, data: extractedData };
}

/**
 * Traverses an object using dot-notation path.
 */
function getValueByPath(obj, path) {
    if (!path) return obj;
    const parts = path.split('.');
    let current = obj;
    for (const part of parts) {
        if (current === null || current === undefined) return undefined;
        // Support array indexing, e.g. results[0] or results.0
        const indexMatch = part.match(/^([^\[]+)\[(\d+)\]$/);
        if (indexMatch) {
            const key = indexMatch[1];
            const idx = parseInt(indexMatch[2], 10);
            current = current[key];
            if (Array.isArray(current)) {
                current = current[idx];
            } else {
                return undefined;
            }
        } else {
            current = current[part];
        }
    }
    return current;
}

/**
 * Finds the most likely data key within a nested object.
 */
function findDataKey(data) {
    const commonKeys = [
        "Time Series", "Data", "Records", "results", "entries", "feed",
        "items", "rows", "values", "datasets", "series"
    ];
    for (const key of commonKeys) {
        const foundKey = Object.keys(data).find(k => k.toLowerCase().includes(key.toLowerCase()));
        if (foundKey) return foundKey;
    }
    return null;
}

/**
 * Cleans and flattens object keys for readability.
 */
function cleanKeys(entry) {
    const cleaned = {};
    for (const key in entry) {
        let newKey = key.replace(/^\d+[\.\s-]*/, '').trim(); // Remove "1. ", "2-", etc.
        newKey = newKey.replace(/\s+/g, '_').toLowerCase(); // normalize: "Close Price" → "close_price"
        if (typeof entry[key] === 'object' && entry[key] !== null && !Array.isArray(entry[key])) {
            // Flatten nested object
            const subObj = cleanKeys(entry[key]);
            for (const subKey in subObj) {
                cleaned[`${newKey}_${subKey}`] = subObj[subKey];
            }
        } else {
            cleaned[newKey] = entry[key];
        }
    }
    return cleaned;
}