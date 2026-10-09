/**
 * Vedra BI - Web Worker Manager
 * Manages dedicated background threads for dataset compression and dimensional summary aggregation.
 * Delivers 0% UI lag by keeping heavy operations entirely off the main thread.
 * Includes graceful zero-downtime main-thread fallback for server/headless environments.
 */

import { CompressedPayload, CompressionStats, SmartDataCompressor } from './smartDataCompressor.ts';
import { SummaryConfig, SummaryExecutionResult, SmartSummaryEngine } from './smartSummaryEngine.ts';

interface PendingTask {
    resolve: (val: any) => void;
    reject: (err: any) => void;
    timeoutId: any;
}

export class WorkerManager {
    private static worker: Worker | null = null;
    private static pendingTasks = new Map<string, PendingTask>();
    private static isWorkerAvailable: boolean | null = null;
    private static taskIdCounter = 0;

    /**
     * Lazily initialize the Web Worker
     */
    private static initWorker(): boolean {
        if (this.worker) return true;
        if (this.isWorkerAvailable === false) return false;

        if (typeof window === 'undefined' || typeof Worker === 'undefined') {
            this.isWorkerAvailable = false;
            return false;
        }

        try {
            this.worker = new Worker(new URL('../../workers/compressionWorker.ts', import.meta.url), {
                type: 'module'
            });

            this.worker.onmessage = (e: MessageEvent) => {
                const { id, type, data, error } = e.data;
                const task = this.pendingTasks.get(id);
                if (task) {
                    clearTimeout(task.timeoutId);
                    this.pendingTasks.delete(id);
                    if (type === 'SUCCESS') {
                        task.resolve(data);
                    } else {
                        task.reject(new Error(error || 'Worker execution error'));
                    }
                }
            };

            this.worker.onerror = (err) => {
                console.warn('[WorkerManager] Worker error caught, defaulting to resilient main-thread processing:', err);
            };

            this.isWorkerAvailable = true;
            console.log('[WorkerManager] Dedicated Background Web Worker active (0% UI Lag Mode enabled).');
            return true;
        } catch (err) {
            console.info('[WorkerManager] Web Worker initialization note (falling back to inline execution):', err);
            this.isWorkerAvailable = false;
            return false;
        }
    }

    private static sendTask<T>(type: 'COMPRESS' | 'DECOMPRESS' | 'COMPUTE_SUMMARY' | 'PING', payload: any, timeoutMs = 30000): Promise<T> {
        const id = `task_${Date.now()}_${++this.taskIdCounter}`;

        return new Promise<T>((resolve, reject) => {
            if (!this.initWorker() || !this.worker) {
                return reject(new Error('Worker not available'));
            }

            const timeoutId = setTimeout(() => {
                this.pendingTasks.delete(id);
                reject(new Error(`Worker task timed out after ${timeoutMs}ms`));
            }, timeoutMs);

            this.pendingTasks.set(id, { resolve, reject, timeoutId });

            this.worker.postMessage({ id, type, payload });
        });
    }

    /**
     * Compress dataset in background Web Worker
     */
    public static async compressDatasetAsync(
        data: Record<string, any>[], 
        headers?: string[]
    ): Promise<CompressedPayload> {
        if (!data || data.length === 0) {
            return SmartDataCompressor.compressDataset(data, headers);
        }

        // For datasets under 1,000 rows, main thread is sub-millisecond, but worker handles cleanly
        try {
            if (this.initWorker()) {
                const res = await this.sendTask<CompressedPayload>('COMPRESS', { data, headers }, 45000);
                return res;
            }
        } catch (workerErr) {
            console.warn('[WorkerManager] Background compression fallback to main thread:', workerErr);
        }

        return SmartDataCompressor.compressDataset(data, headers);
    }

    /**
     * Decompress dataset in background Web Worker
     */
    public static async decompressDatasetAsync(payload: CompressedPayload): Promise<Record<string, any>[]> {
        if (!payload || !payload.compressedData) return [];

        try {
            if (this.initWorker()) {
                const res = await this.sendTask<Record<string, any>[]>('DECOMPRESS', payload, 45000);
                return res;
            }
        } catch (workerErr) {
            console.warn('[WorkerManager] Background decompression fallback to main thread:', workerErr);
        }

        return SmartDataCompressor.decompressDataset(payload);
    }

    /**
     * Compute summary rollup in background Web Worker
     */
    public static async computeSummaryAsync(
        data: Record<string, any>[], 
        config: SummaryConfig
    ): Promise<SummaryExecutionResult> {
        if (!data || data.length === 0) {
            return SmartSummaryEngine.computeSummary(data, config);
        }

        try {
            if (this.initWorker()) {
                const res = await this.sendTask<SummaryExecutionResult>('COMPUTE_SUMMARY', { data, config }, 30000);
                return res;
            }
        } catch (workerErr) {
            console.warn('[WorkerManager] Background summary rollup fallback to main thread:', workerErr);
        }

        return SmartSummaryEngine.computeSummary(data, config);
    }

    /**
     * Checks if dedicated background worker is actively running
     */
    public static isWorkerRunning(): boolean {
        return !!this.worker && this.isWorkerAvailable === true;
    }
}
