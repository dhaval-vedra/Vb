/**
 * Vedra BI - High Performance Asynchronous IndexedDB Storage Engine
 * Provides resilient, quota-free (>100MB) storage for sheets, datasets, and drafts
 * with transparent fallback to localStorage when running in restricted sandboxes.
 */

const DB_NAME = 'VedraBI_Storage_v1';
const DB_VERSION = 1;

export const STORES = {
    DATASETS: 'datasets',
    DRAFTS: 'drafts',
    METADATA: 'metadata',
    VIEWS: 'views'
} as const;

type StoreName = typeof STORES[keyof typeof STORES] | string;

class IndexedDbStorage {
    private dbPromise: Promise<IDBDatabase> | null = null;
    private isAvailable: boolean = true;

    constructor() {
        this.checkAvailability();
    }

    private checkAvailability(): boolean {
        try {
            if (typeof window === 'undefined' || !window.indexedDB) {
                this.isAvailable = false;
                return false;
            }
            return true;
        } catch (e) {
            this.isAvailable = false;
            return false;
        }
    }

    private getDB(): Promise<IDBDatabase> {
        if (!this.isAvailable) {
            return Promise.reject(new Error('IndexedDB is not available in this environment.'));
        }

        if (this.dbPromise) {
            return this.dbPromise;
        }

        this.dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
            try {
                const request = window.indexedDB.open(DB_NAME, DB_VERSION);

                request.onupgradeneeded = (event) => {
                    const db = (event.target as IDBOpenDBRequest).result;
                    Object.values(STORES).forEach((storeName) => {
                        if (!db.objectStoreNames.contains(storeName)) {
                            db.createObjectStore(storeName);
                        }
                    });
                };

                request.onsuccess = (event) => {
                    const db = (event.target as IDBOpenDBRequest).result;
                    db.onversionchange = () => {
                        db.close();
                        this.dbPromise = null;
                    };
                    resolve(db);
                };

                request.onerror = (event) => {
                    this.isAvailable = false;
                    this.dbPromise = null;
                    console.warn('[IndexedDbStorage] Open error, falling back to localStorage:', (event.target as IDBOpenDBRequest).error);
                    reject((event.target as IDBOpenDBRequest).error);
                };

                request.onblocked = () => {
                    console.warn('[IndexedDbStorage] Database open blocked. Waiting for other tabs/connections to close.');
                };
            } catch (err) {
                this.isAvailable = false;
                this.dbPromise = null;
                reject(err);
            }
        });

        return this.dbPromise;
    }

    /**
     * Store key-value data in the specified object store.
     */
    async setItem<T = any>(storeName: StoreName, key: string, value: T): Promise<void> {
        try {
            if (this.isAvailable) {
                const db = await this.getDB();
                return new Promise<void>((resolve, reject) => {
                    const tx = db.transaction(storeName, 'readwrite');
                    const store = tx.objectStore(storeName);
                    const req = store.put(value, key);

                    req.onsuccess = () => resolve();
                    req.onerror = () => reject(req.error);
                });
            }
        } catch (e) {
            console.warn(`[IndexedDbStorage] setItem failed on ${storeName}:${key}, using localStorage fallback.`, e);
        }

        // Fallback to localStorage
        try {
            const fallbackKey = `vedra_idb_${storeName}_${key}`;
            localStorage.setItem(fallbackKey, JSON.stringify(value));
        } catch (storageErr) {
            console.error(`[IndexedDbStorage] localStorage fallback also failed:`, storageErr);
            throw storageErr;
        }
    }

    /**
     * Retrieve key-value data from the specified object store.
     */
    async getItem<T = any>(storeName: StoreName, key: string): Promise<T | null> {
        try {
            if (this.isAvailable) {
                const db = await this.getDB();
                return new Promise<T | null>((resolve, reject) => {
                    const tx = db.transaction(storeName, 'readonly');
                    const store = tx.objectStore(storeName);
                    const req = store.get(key);

                    req.onsuccess = () => {
                        resolve(req.result !== undefined ? (req.result as T) : null);
                    };
                    req.onerror = () => reject(req.error);
                });
            }
        } catch (e) {
            console.warn(`[IndexedDbStorage] getItem failed on ${storeName}:${key}, checking localStorage fallback.`, e);
        }

        // Fallback from localStorage
        try {
            const fallbackKey = `vedra_idb_${storeName}_${key}`;
            const raw = localStorage.getItem(fallbackKey);
            return raw ? JSON.parse(raw) : null;
        } catch (_) {
            return null;
        }
    }

    /**
     * Delete key from store
     */
    async removeItem(storeName: StoreName, key: string): Promise<void> {
        try {
            if (this.isAvailable) {
                const db = await this.getDB();
                return new Promise<void>((resolve, reject) => {
                    const tx = db.transaction(storeName, 'readwrite');
                    const store = tx.objectStore(storeName);
                    const req = store.delete(key);

                    req.onsuccess = () => resolve();
                    req.onerror = () => reject(req.error);
                });
            }
        } catch (e) {
            console.warn(`[IndexedDbStorage] removeItem failed on ${storeName}:${key}`, e);
        }

        try {
            localStorage.removeItem(`vedra_idb_${storeName}_${key}`);
        } catch (_) {}
    }

    /**
     * Clear all records in a store
     */
    async clearStore(storeName: StoreName): Promise<void> {
        try {
            if (this.isAvailable) {
                const db = await this.getDB();
                return new Promise<void>((resolve, reject) => {
                    const tx = db.transaction(storeName, 'readwrite');
                    const store = tx.objectStore(storeName);
                    const req = store.clear();

                    req.onsuccess = () => resolve();
                    req.onerror = () => reject(req.error);
                });
            }
        } catch (e) {
            console.warn(`[IndexedDbStorage] clearStore failed on ${storeName}`, e);
        }

        try {
            const prefix = `vedra_idb_${storeName}_`;
            Object.keys(localStorage).forEach((k) => {
                if (k.startsWith(prefix)) {
                    localStorage.removeItem(k);
                }
            });
        } catch (_) {}
    }
}

export const vedraStorage = new IndexedDbStorage();

// Attach globally for inline HTML scripts & cross-module consumption
if (typeof window !== 'undefined') {
    (window as any).vedraStorage = vedraStorage;
    (window as any).VedraDBStores = STORES;
}
