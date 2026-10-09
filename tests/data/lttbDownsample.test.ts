import { describe, it, expect, beforeEach } from 'vitest';
import {
    lttbDownsample,
    getLTTBConfig,
    setLTTBResolution,
    setLTTBPreset,
    setCustomSampleConfig,
    togglePinnedSampleIndex,
    parseIndexRanges,
    applyUserCustomSampling,
    getLTTBThreshold,
    computeLTTBStats
} from '../../src/js/data/lttbDownsample.ts';

describe('LTTB & Custom User Sample Selection Engine', () => {
    // Generate synthetic time-series data
    const rawData = Array.from({ length: 1000 }, (_, i) => ({
        timestamp: `2026-01-01 ${i}:00`,
        value: i === 250 ? 999 : (i === 750 ? -999 : Math.sin(i / 10) * 100),
        id: i + 1 // 1-based IDs for easy testing
    }));

    beforeEach(() => {
        setLTTBPreset('balanced', false);
        setCustomSampleConfig({
            mode: 'auto-lttb',
            customIndicesText: '',
            sliceStart: 1,
            sliceEnd: 1000,
            stepInterval: 5,
            pinnedIndices: []
        }, false);
    });

    it('should downsample large datasets to the target threshold', () => {
        const threshold = 100;
        const sampled = lttbDownsample(rawData, threshold);

        expect(sampled.length).toBe(threshold);
        expect(sampled[0].id).toBe(rawData[0].id);
        expect(sampled[sampled.length - 1].id).toBe(rawData[rawData.length - 1].id);
    });

    it('should parse custom index ranges string correctly', () => {
        const parsed = parseIndexRanges('1-5, 10, 15-18, 25', 100);
        // Expect 0-based indices: 0,1,2,3,4, 9, 14,15,16,17, 24
        expect(parsed).toEqual([0, 1, 2, 3, 4, 9, 14, 15, 16, 17, 24]);
    });

    it('should filter data strictly by custom user row ranges', () => {
        setCustomSampleConfig({
            mode: 'custom-indices',
            customIndicesText: '1-10, 50, 100-105'
        }, false);

        const customSampled = lttbDownsample(rawData);
        // 1-10 (10 pts) + 50 (1 pt) + 100-105 (6 pts) = 17 pts
        expect(customSampled.length).toBe(17);
        expect(customSampled[0].id).toBe(1);
        expect(customSampled[9].id).toBe(10);
        expect(customSampled[10].id).toBe(50);
        expect(customSampled[11].id).toBe(100);
    });

    it('should slice data by user-specified row ranges (Min to Max)', () => {
        setCustomSampleConfig({
            mode: 'slice-range',
            sliceStart: 100,
            sliceEnd: 250
        }, false);

        const sliced = lttbDownsample(rawData);
        expect(sliced.length).toBe(151);
        expect(sliced[0].id).toBe(100);
        expect(sliced[sliced.length - 1].id).toBe(250);
    });

    it('should select every N-th sample in step-interval mode', () => {
        setCustomSampleConfig({
            mode: 'step-interval',
            stepInterval: 50
        }, false);

        const stepped = lttbDownsample(rawData);
        expect(stepped.length).toBeGreaterThanOrEqual(20);
    });

    it('should extract top spikes and outliers', () => {
        setCustomSampleConfig({
            mode: 'top-spikes',
            topNCount: 10,
            conditionType: 'top-highest'
        }, false);

        const topSpikes = lttbDownsample(rawData);
        expect(topSpikes.length).toBe(10);
        expect(topSpikes.some(p => p.id === 251)).toBe(true); // Peak at index 250 (id 251)
    });

    it('should retain user-pinned key sample indices', () => {
        setCustomSampleConfig({
            mode: 'custom-indices',
            customIndicesText: '1-5',
            pinnedIndices: [249, 749] // Indices for ID 250 and 750
        }, false);

        const sampledWithPins = lttbDownsample(rawData);
        expect(sampledWithPins.some(p => p.id === 250)).toBe(true);
        expect(sampledWithPins.some(p => p.id === 750)).toBe(true);
    });
});
