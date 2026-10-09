/**
 * Vedra BI - Chunked Streaming CSV Ingestion
 * High-performance, low-memory streaming parser for massive CSV files (20MB - 100MB+).
 * Prevents browser memory spikes (OOM crashes) by streaming file chunks via Papa Parse
 * without allocating gigantic multi-hundred megabyte strings in the main thread.
 */

declare const Papa: any;

export interface ChunkedStreamProgress {
    rowsLoaded: number;
    bytesLoaded: number;
    totalBytes: number;
    percent: number;
    elapsedMs: number;
}

export interface ChunkedStreamResult {
    data: Record<string, any>[];
    headers: string[];
    totalRows: number;
    parseTimeMs: number;
}

export class ChunkedCsvStreamer {
    public static readonly DEFAULT_CHUNK_SIZE = 1024 * 1024 * 2; // 2MB streaming chunks

    /**
     * Stream-parse a large CSV file with incremental chunk processing and live progress
     */
    public static async streamParseFile(
        file: File,
        onProgress?: (progress: ChunkedStreamProgress) => void
    ): Promise<ChunkedStreamResult> {
        const startTime = performance.now();
        const totalBytes = file.size || 1;
        let bytesProcessed = 0;
        let rowsAccumulator: Record<string, any>[] = [];
        let extractedHeaders: string[] = [];

        return new Promise<ChunkedStreamResult>((resolve, reject) => {
            if (typeof Papa === 'undefined') {
                reject(new Error('PapaParse is not loaded in the window environment.'));
                return;
            }

            Papa.parse(file, {
                header: true,
                skipEmptyLines: 'greedy',
                chunkSize: this.DEFAULT_CHUNK_SIZE,
                transformHeader: (h: string) => (h || '').trim(),
                chunk: (results: any, parser: any) => {
                    if (results.meta && results.meta.fields && extractedHeaders.length === 0) {
                        extractedHeaders = results.meta.fields.map((f: string) => f.trim()).filter(Boolean);
                    }

                    if (results.data && results.data.length > 0) {
                        // Fast batch validation and push
                        const validBatch: Record<string, any>[] = [];
                        for (let i = 0; i < results.data.length; i++) {
                            const row = results.data[i];
                            if (row && typeof row === 'object' && Object.keys(row).length > 0) {
                                validBatch.push(row);
                            }
                        }

                        rowsAccumulator.push(...validBatch);
                    }

                    // Approximate bytes from cursor or chunk size
                    bytesProcessed = Math.min(totalBytes, bytesProcessed + ChunkedCsvStreamer.DEFAULT_CHUNK_SIZE);
                    const percent = Math.min(99, Math.round((bytesProcessed / totalBytes) * 100));

                    if (onProgress) {
                        onProgress({
                            rowsLoaded: rowsAccumulator.length,
                            bytesLoaded: bytesProcessed,
                            totalBytes,
                            percent,
                            elapsedMs: Math.round(performance.now() - startTime)
                        });
                    }
                },
                complete: () => {
                    const elapsedMs = Math.round(performance.now() - startTime);

                    if (onProgress) {
                        onProgress({
                            rowsLoaded: rowsAccumulator.length,
                            bytesLoaded: totalBytes,
                            totalBytes,
                            percent: 100,
                            elapsedMs
                        });
                    }

                    if (extractedHeaders.length === 0 && rowsAccumulator.length > 0) {
                        extractedHeaders = Object.keys(rowsAccumulator[0]);
                    }

                    resolve({
                        data: rowsAccumulator,
                        headers: extractedHeaders,
                        totalRows: rowsAccumulator.length,
                        parseTimeMs: elapsedMs
                    });
                },
                error: (err: any) => {
                    console.error('[ChunkedCsvStreamer] Streaming parse error:', err);
                    reject(err);
                }
            });
        });
    }

    /**
     * Checks if a file is eligible for chunked streaming ingestion
     */
    public static isStreamCandidate(file: File): boolean {
        // Any CSV file larger than 3MB should use chunked streaming ingestion
        return file.name.toLowerCase().endsWith('.csv') && file.size > 3 * 1024 * 1024;
    }
}
