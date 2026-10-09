// src/js/data/datasetStore.ts
import { showMessage, safeJsonStringify } from '../core/utils.ts';
import { updateDataAndUI, rawData, headers, currentUserId, saveUserDataToFirebase } from '../../store/DataHandler.ts';

export interface DatasetItem {
    id: string;
    name: string;
    fileName?: string;
    rowCount: number;
    headers: string[];
    data: Record<string, any>[];
    createdAt: string;
    isPrimary?: boolean;
}

export type JoinType = 'inner' | 'left' | 'right' | 'full';

export interface JoinConfig {
    leftDatasetId: string;
    rightDatasetId: string;
    leftKey: string;
    rightKey: string;
    joinType: JoinType;
    outputDatasetName?: string;
}

class DatasetStoreEngine {
    private datasets: Map<string, DatasetItem> = new Map();
    private activeDatasetId: string | null = null;
    private initialized = false;

    constructor() {
        this.loadFromStorage();
    }

    private loadFromStorage(): void {
        try {
            const raw = localStorage.getItem('vedrabi_multi_datasets');
            if (raw) {
                const list: DatasetItem[] = JSON.parse(raw);
                if (Array.isArray(list)) {
                    this.datasets.clear();
                    list.forEach(d => this.datasets.set(d.id, d));
                }
            }
        } catch (e) {
            console.warn('[DatasetStore] Could not load datasets from localStorage:', e);
        }
    }

    private saveToStorage(): void {
        try {
            const list = Array.from(this.datasets.values()).map(d => ({
                id: d.id,
                name: d.name,
                fileName: d.fileName,
                rowCount: d.rowCount,
                headers: d.headers,
                // Keep lightweight or up to 5,000 rows in localStorage cache to prevent quota exceed
                data: d.data.length > 5000 ? d.data.slice(0, 5000) : d.data,
                createdAt: d.createdAt,
                isPrimary: d.isPrimary
            }));
            localStorage.setItem('vedrabi_multi_datasets', safeJsonStringify(list));
        } catch (e) {
            console.warn('[DatasetStore] Could not save datasets to localStorage:', e);
        }
    }

    public registerCurrentDataset(name = 'Primary Dataset', fileName?: string): DatasetItem {
        if (!rawData || rawData.length === 0) {
            return {
                id: 'primary',
                name,
                rowCount: 0,
                headers: [...headers],
                data: [],
                createdAt: new Date().toISOString(),
                isPrimary: true
            };
        }

        const id = 'primary';
        const item: DatasetItem = {
            id,
            name,
            fileName: fileName || `${name}.csv`,
            rowCount: rawData.length,
            headers: [...headers],
            data: rawData,
            createdAt: new Date().toISOString(),
            isPrimary: true
        };
        this.datasets.set(id, item);
        this.activeDatasetId = id;
        this.saveToStorage();
        this.dispatchUpdateEvent();
        return item;
    }

    public addDataset(name: string, data: Record<string, any>[], fileName?: string, makeActive = false): DatasetItem {
        const id = `ds_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        const detectedHeaders = data && data.length > 0 ? Object.keys(data[0]) : [];
        const item: DatasetItem = {
            id,
            name: name.trim() || `Dataset ${this.datasets.size + 1}`,
            fileName: fileName || `${name}.csv`,
            rowCount: data.length,
            headers: detectedHeaders,
            data,
            createdAt: new Date().toISOString(),
            isPrimary: this.datasets.size === 0
        };

        this.datasets.set(id, item);
        if (makeActive) {
            this.activeDatasetId = id;
            updateDataAndUI(data, detectedHeaders);
            if (currentUserId) {
                saveUserDataToFirebase(data, detectedHeaders, false);
            }
        }
        this.saveToStorage();
        this.dispatchUpdateEvent();
        return item;
    }

    public getDataset(id: string): DatasetItem | undefined {
        // If primary requested and mapped directly to live rawData
        if (id === 'primary' && rawData.length > 0) {
            return {
                id: 'primary',
                name: this.datasets.get('primary')?.name || 'Primary Dataset',
                fileName: this.datasets.get('primary')?.fileName || 'primary.csv',
                rowCount: rawData.length,
                headers: [...headers],
                data: rawData,
                createdAt: this.datasets.get('primary')?.createdAt || new Date().toISOString(),
                isPrimary: true
            };
        }
        return this.datasets.get(id);
    }

    public getAllDatasets(): DatasetItem[] {
        // Ensure primary is synchronized with current live state
        if (rawData && rawData.length > 0 && !this.datasets.has('primary')) {
            this.registerCurrentDataset();
        } else if (rawData && rawData.length > 0 && this.datasets.has('primary')) {
            const p = this.datasets.get('primary')!;
            p.data = rawData;
            p.rowCount = rawData.length;
            p.headers = [...headers];
        }
        return Array.from(this.datasets.values());
    }

    public removeDataset(id: string): boolean {
        if (id === 'primary') {
            showMessage("Cannot delete the primary active dataset directly. Clear data instead.", "warning");
            return false;
        }
        const deleted = this.datasets.delete(id);
        if (deleted) {
            this.saveToStorage();
            this.dispatchUpdateEvent();
        }
        return deleted;
    }

    public setActiveDataset(id: string): boolean {
        const item = this.getDataset(id);
        if (!item || !item.data) {
            showMessage(`Dataset not found: ${id}`, "danger");
            return false;
        }
        this.activeDatasetId = id;
        updateDataAndUI(item.data, item.headers);
        if (currentUserId) {
            saveUserDataToFirebase(item.data, item.headers, false);
        }
        showMessage(`Switched active dataset to '${item.name}' (${item.rowCount} rows)`, "success");
        this.dispatchUpdateEvent();
        return true;
    }

    /**
     * Join / Blend two datasets on keys
     */
    public joinDatasets(config: JoinConfig): { success: boolean; message: string; outputItem?: DatasetItem } {
        const leftDs = this.getDataset(config.leftDatasetId);
        const rightDs = this.getDataset(config.rightDatasetId);

        if (!leftDs || !leftDs.data || leftDs.data.length === 0) {
            return { success: false, message: `Left dataset not found or empty: ${config.leftDatasetId}` };
        }
        if (!rightDs || !rightDs.data || rightDs.data.length === 0) {
            return { success: false, message: `Right dataset not found or empty: ${config.rightDatasetId}` };
        }

        const leftKey = config.leftKey.trim();
        const rightKey = config.rightKey.trim();

        if (!leftDs.headers.includes(leftKey)) {
            return { success: false, message: `Left key '${leftKey}' is not present in dataset '${leftDs.name}'` };
        }
        if (!rightDs.headers.includes(rightKey)) {
            return { success: false, message: `Right key '${rightKey}' is not present in dataset '${rightDs.name}'` };
        }

        const joinType = config.joinType || 'inner';
        const rightMap = new Map<string, Record<string, any>[]>();

        // Build index on right dataset key (case-insensitive & trimmed string normalization)
        for (const row of rightDs.data) {
            const rawVal = row[rightKey];
            const normKey = rawVal !== undefined && rawVal !== null ? String(rawVal).trim().toLowerCase() : '';
            if (!normKey) continue;
            const existing = rightMap.get(normKey);
            if (existing) {
                existing.push(row);
            } else {
                rightMap.set(normKey, [row]);
            }
        }

        const mergedRows: Record<string, any>[] = [];
        const matchedRightRows = new Set<Record<string, any>>();

        // Determine right column naming to avoid conflicts
        const rightColsToAppend = rightDs.headers.filter(h => h !== rightKey);

        // Process Left Rows
        for (const leftRow of leftDs.data) {
            const leftRawVal = leftRow[leftKey];
            const normKey = leftRawVal !== undefined && leftRawVal !== null ? String(leftRawVal).trim().toLowerCase() : '';
            const matchingRights = normKey ? rightMap.get(normKey) : undefined;

            if (matchingRights && matchingRights.length > 0) {
                matchingRights.forEach(rightRow => {
                    matchedRightRows.add(rightRow);
                    const combined: Record<string, any> = { ...leftRow };
                    for (const col of rightColsToAppend) {
                        const targetColName = leftRow[col] !== undefined ? `${rightDs.name}_${col}` : col;
                        combined[targetColName] = rightRow[col] ?? '';
                    }
                    mergedRows.push(combined);
                });
            } else {
                // No match
                if (joinType === 'left' || joinType === 'full') {
                    const combined: Record<string, any> = { ...leftRow };
                    for (const col of rightColsToAppend) {
                        const targetColName = leftRow[col] !== undefined ? `${rightDs.name}_${col}` : col;
                        combined[targetColName] = '';
                    }
                    mergedRows.push(combined);
                }
            }
        }

        // Process Right Rows for Right / Full Join
        if (joinType === 'right' || joinType === 'full') {
            for (const rightRow of rightDs.data) {
                if (!matchedRightRows.has(rightRow)) {
                    const combined: Record<string, any> = {};
                    // Fill left fields with empty string
                    for (const leftCol of leftDs.headers) {
                        combined[leftCol] = leftCol === leftKey ? (rightRow[rightKey] ?? '') : '';
                    }
                    for (const col of rightColsToAppend) {
                        const targetColName = leftDs.headers.includes(col) ? `${rightDs.name}_${col}` : col;
                        combined[targetColName] = rightRow[col] ?? '';
                    }
                    mergedRows.push(combined);
                }
            }
        }

        if (mergedRows.length === 0) {
            return {
                success: false,
                message: `Join produced 0 rows! Please check if keys '${leftKey}' and '${rightKey}' have matching values.`
            };
        }

        const outName = config.outputDatasetName?.trim() || `${leftDs.name} + ${rightDs.name} (${joinType.toUpperCase()} Join)`;
        const newDs = this.addDataset(outName, mergedRows, `${outName}.csv`, true);

        return {
            success: true,
            message: `Successfully merged '${leftDs.name}' and '${rightDs.name}' via ${joinType.toUpperCase()} join. Generated ${mergedRows.length.toLocaleString()} blended rows with ${newDs.headers.length} columns!`,
            outputItem: newDs
        };
    }

    private dispatchUpdateEvent(): void {
        document.dispatchEvent(new CustomEvent('datasetsUpdated', {
            detail: {
                datasets: this.getAllDatasets(),
                activeDatasetId: this.activeDatasetId
            }
        }));
    }
}

export const DatasetStore = new DatasetStoreEngine();
