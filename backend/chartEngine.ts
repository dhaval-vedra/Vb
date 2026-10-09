/**
 * Vedra BI - High Performance Backend Chart Calculation & Recommendation Engine
 * Written in TypeScript for Express/Node backend.
 * Delivers sub-millisecond data aggregations, auto recommendations, and ready-to-render chart specs.
 */

import fs from "fs";
import path from "path";

export interface ChartConfigInput {
  id?: string;
  type?: string;
  title?: string;
  xAxis?: string;
  yAxes?: string[];
  zAxis?: string;
  columns?: string[];
  color?: string;
  colorPalette?: string[];
  aggregation?: "sum" | "avg" | "mean" | "count" | "min" | "max" | "first" | "last";
  topN?: number;
  sortDirection?: "asc" | "desc" | "none";
  xAxisLabel?: string;
  yAxisLabel?: string;
  theme?: "light" | "dark";
  gridShowHide?: boolean;
  zoomEnable?: boolean;
  customShape?: string;
  symbolImage?: string;
  symbol?: string;
  image?: string;
  annotations?: any[];
  dataRowLimit?: number | "all";
  threshold?: {
    enable?: boolean;
    value?: number | string;
    label?: string;
    color?: string;
    style?: string;
    enableZone?: boolean;
    zoneMin?: number | string;
    zoneMax?: number | string;
    zoneLabel?: string;
    zoneColor?: string;
  };
}

export interface ChartEngineResult {
  success: boolean;
  executionTimeMs: number;
  chartType: string;
  chartSpec: any;
  aggregatedData: any[];
  meta: {
    totalInputRows: number;
    aggregatedRows: number;
    xAxisKey: string;
    yAxesKeys: string[];
    aggregationUsed: string;
    engine: string;
  };
}

export interface RecommendedChartSpec {
  type: string;
  title: string;
  description: string;
  suitabilityScore: number;
  xAxis: string;
  yAxes: string[];
  zAxis?: string;
  recommendedAggregation: string;
  previewChartSpec: any;
}

const DEFAULT_PALETTE = [
  "#5470C6", "#91CC75", "#FAC858", "#EE6666", "#73C0DE",
  "#3BA272", "#FC8452", "#9A60B4", "#EA7CCC", "#26A69A"
];

interface GroupData {
  count: number;
  yValues: { [yCol: string]: number[] };
}

// High-Speed In-Memory Cache for Chart Aggregations
class ChartLRUCache {
  private cache = new Map<string, { result: any; timestamp: number }>();
  private maxCapacity = 150;
  private ttlMs = 10 * 60 * 1000; // 10 minutes

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;
    if (Date.now() - item.timestamp > this.ttlMs) {
      this.cache.delete(key);
      return null;
    }
    // Refresh position for LRU
    this.cache.delete(key);
    this.cache.set(key, item);
    return item.result;
  }

  set(key: string, result: any): void {
    if (this.cache.size >= this.maxCapacity) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
    this.cache.set(key, { result, timestamp: Date.now() });
  }

  clear(): void {
    this.cache.clear();
  }
}

export const chartEngineCache = new ChartLRUCache();

/**
 * Largest-Triangle-Three-Buckets (LTTB) Downsampling Algorithm
 * Downsamples large numerical series while retaining visual peaks, troughs, and overall trends.
 */
export function lttbDownsample(data: { x: string; y: number }[], threshold: number): { x: string; y: number }[] {
  const dataLength = data.length;
  if (threshold >= dataLength || threshold === 0) return data;

  const sampled: { x: string; y: number }[] = [];
  let sampledIndex = 0;

  // Bucket size. Leave room for start and end data points
  const every = (dataLength - 2) / (threshold - 2);

  let a = 0; // Initially a is the first point in the data
  let maxAreaPoint: { x: string; y: number } = data[0];
  let maxArea: number;
  let area: number;
  let nextA = 0;

  sampled[sampledIndex++] = data[a]; // Always add the first point

  for (let i = 0; i < threshold - 2; i++) {
    // Calculate point average for next bucket (bucket c)
    let avgX = 0;
    let avgY = 0;
    let avgRangeStart = Math.floor((i + 1) * every) + 1;
    let avgRangeEnd = Math.floor((i + 2) * every) + 1;
    avgRangeEnd = avgRangeEnd < dataLength ? avgRangeEnd : dataLength;

    const avgRangeLength = avgRangeEnd - avgRangeStart;

    for (; avgRangeStart < avgRangeEnd; avgRangeStart++) {
      avgX += avgRangeStart;
      avgY += data[avgRangeStart].y;
    }
    avgX /= Math.max(avgRangeLength, 1);
    avgY /= Math.max(avgRangeLength, 1);

    // Get the range for current bucket (bucket b)
    let rangeOffs = Math.floor((i + 0) * every) + 1;
    const rangeTo = Math.floor((i + 1) * every) + 1;

    // Point a
    const pointAx = a;
    const pointAy = data[a].y;

    maxArea = area = -1;

    for (; rangeOffs < rangeTo; rangeOffs++) {
      // Calculate triangle area over three buckets
      area = Math.abs((pointAx - avgX) * (data[rangeOffs].y - pointAy) - (pointAx - rangeOffs) * (avgY - pointAy)) * 0.5;
      if (area > maxArea) {
        maxArea = area;
        maxAreaPoint = data[rangeOffs];
        nextA = rangeOffs; // Next a is this point
      }
    }

    sampled[sampledIndex++] = maxAreaPoint; // Pick this point from the bucket
    a = nextA; // This point is the next a
  }

  sampled[sampledIndex++] = data[dataLength - 1]; // Always add last point

  return sampled;
}

/**
 * Compute statistical metrics for numerical series
 */
export function calculateSeriesStats(values: number[]) {
  if (!values || values.length === 0) {
    return { mean: 0, median: 0, p90: 0, min: 0, max: 0, stdDev: 0, anomalies: [] };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  const mean = sum / sorted.length;

  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;

  const p90Index = Math.floor(sorted.length * 0.9);
  const p90 = sorted[Math.min(p90Index, sorted.length - 1)];

  const min = sorted[0];
  const max = sorted[sorted.length - 1];

  const variance = sorted.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / sorted.length;
  const stdDev = Math.sqrt(variance);

  // Detect anomaly indexes (values > 2 std dev from mean)
  const anomalies: number[] = [];
  values.forEach((val, idx) => {
    if (Math.abs(val - mean) > 2 * stdDev && stdDev > 0) {
      anomalies.push(idx);
    }
  });

  return {
    mean: Math.round(mean * 100) / 100,
    median: Math.round(median * 100) / 100,
    p90: Math.round(p90 * 100) / 100,
    min,
    max,
    stdDev: Math.round(stdDev * 100) / 100,
    anomalies
  };
}

/**
 * Perform high-speed in-memory aggregation on dataset rows
 */
export function aggregateDataset(
  rawData: any[],
  xAxisCol?: string,
  yAxisCols: string[] = [],
  aggType: string = "sum",
  zAxisCol?: string,
  topN: number = 100,
  sortDirection: "asc" | "desc" | "none" = "desc"
) {
  if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
    return { aggregatedRows: [], categories: [], seriesDataMap: {}, totalRows: 0, xAxis: xAxisCol || "Category", yAxes: yAxisCols };
  }

  const firstRow = rawData[0] || {};
  const keys = Object.keys(firstRow);

  const xAxis = xAxisCol || keys[0] || "Category";
  let yAxes = yAxisCols.length > 0 ? yAxisCols : keys.filter((k) => k !== xAxis && typeof firstRow[k] === "number");
  if (yAxes.length === 0 && keys.length > 1) {
    yAxes = [keys[1]];
  }

  const groups = new Map<string, GroupData>();

  // Single-pass row iteration for optimal CPU performance
  for (let i = 0; i < rawData.length; i++) {
    const row = rawData[i];
    if (!row) continue;

    const xValRaw = row[xAxis];
    const xValKey = xValRaw !== undefined && xValRaw !== null && xValRaw !== "" ? String(xValRaw) : "N/A";

    let group = groups.get(xValKey);
    if (!group) {
      group = { count: 0, yValues: {} };
      for (const yCol of yAxes) {
        group.yValues[yCol] = [];
      }
      groups.set(xValKey, group);
    }

    group.count++;

    for (const yCol of yAxes) {
      const val = parseFloat(row[yCol]);
      if (!isNaN(val)) {
        if (!group.yValues[yCol]) {
          group.yValues[yCol] = [];
        }
        group.yValues[yCol].push(val);
      }
    }
  }

  // Aggregate groups
  const aggregatedRows: any[] = [];
  const normalizedAgg = aggType.toLowerCase();

  for (const [xKey, grp] of groups.entries()) {
    const rowRes: any = { [xAxis]: xKey, _count: grp.count };

    for (const yCol of yAxes) {
      const vals = grp.yValues[yCol] || [];
      if (vals.length === 0) {
        rowRes[yCol] = 0;
        continue;
      }

      switch (normalizedAgg) {
        case "avg":
        case "mean":
          rowRes[yCol] = vals.reduce((a, b) => a + b, 0) / vals.length;
          break;
        case "count":
          rowRes[yCol] = grp.count;
          break;
        case "min":
          rowRes[yCol] = Math.min(...vals);
          break;
        case "max":
          rowRes[yCol] = Math.max(...vals);
          break;
        case "p50":
        case "median": {
          const sorted = [...vals].sort((a, b) => a - b);
          const mid = Math.floor(sorted.length / 2);
          rowRes[yCol] = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
          break;
        }
        case "p90": {
          const sorted = [...vals].sort((a, b) => a - b);
          rowRes[yCol] = sorted[Math.min(Math.floor(sorted.length * 0.9), sorted.length - 1)];
          break;
        }
        case "p99": {
          const sorted = [...vals].sort((a, b) => a - b);
          rowRes[yCol] = sorted[Math.min(Math.floor(sorted.length * 0.99), sorted.length - 1)];
          break;
        }
        case "stddev": {
          const m = vals.reduce((a, b) => a + b, 0) / vals.length;
          const variance = vals.reduce((acc, val) => acc + Math.pow(val - m, 2), 0) / vals.length;
          rowRes[yCol] = Math.sqrt(variance);
          break;
        }
        case "first":
          rowRes[yCol] = vals[0];
          break;
        case "last":
          rowRes[yCol] = vals[vals.length - 1];
          break;
        case "sum":
        default:
          rowRes[yCol] = vals.reduce((a, b) => a + b, 0);
          break;
      }

      // Round floats to 2 decimal places for clean UI rendering
      if (typeof rowRes[yCol] === "number") {
        rowRes[yCol] = Math.round(rowRes[yCol] * 100) / 100;
      }
    }

    aggregatedRows.push(rowRes);
  }

  // Sorting
  if (sortDirection !== "none" && yAxes.length > 0) {
    const primaryY = yAxes[0];
    aggregatedRows.sort((a, b) => {
      const valA = Number(a[primaryY]) || 0;
      const valB = Number(b[primaryY]) || 0;
      return sortDirection === "desc" ? valB - valA : valA - valB;
    });
  }

  // Capping top N
  const finalRows = topN > 0 && aggregatedRows.length > topN ? aggregatedRows.slice(0, topN) : aggregatedRows;

  const categories = finalRows.map((r) => String(r[xAxis]));
  const seriesDataMap: { [yCol: string]: number[] } = {};

  for (const yCol of yAxes) {
    seriesDataMap[yCol] = finalRows.map((r) => Number(r[yCol]) || 0);
  }

  return {
    aggregatedRows: finalRows,
    categories,
    seriesDataMap,
    totalRows: rawData.length,
    xAxis,
    yAxes
  };
}

/**
 * Generate full ready-to-render ECharts or Plotly or KPI Chart Spec
 */
export function generateChartSpec(config: ChartConfigInput, rawData: any[]): ChartEngineResult {
  const startTime = Date.now();
  const chartType = (config.type || "bar").toLowerCase();
  const xAxisCol = config.xAxis || (config.columns && config.columns.length > 0 ? config.columns[0] : undefined);
  const yAxisCols = (config.yAxes && config.yAxes.length > 0) ? config.yAxes : (config.columns ? config.columns.slice(1) : []);
  const aggType = config.aggregation || "sum";
  const sortDirection = config.sortDirection || "desc";
  const palette = (Array.isArray(config.colorPalette) && config.colorPalette.length > 0)
    ? config.colorPalette
    : (config.color ? [config.color, ...DEFAULT_PALETTE] : DEFAULT_PALETTE);
  const mainColor = config.color || palette[0] || "#5470C6";
  const isDark = config.theme === "dark";
  const dataRowLimit = config.dataRowLimit || "all";
  const limitNum = (dataRowLimit && dataRowLimit !== "all") ? parseInt(String(dataRowLimit), 10) : 0;
  const topN = (!isNaN(limitNum) && limitNum > 0) ? limitNum : (config.topN || 0);

  let inputData = rawData;
  if (dataRowLimit && dataRowLimit !== "all" && Array.isArray(rawData)) {
    const limit = typeof dataRowLimit === "number" ? dataRowLimit : parseInt(String(dataRowLimit), 10);
    if (!isNaN(limit) && limit > 0 && rawData.length > limit) {
      inputData = rawData.slice(0, limit);
    }
  }

  // Cache key based on dataset signature and chart params
  const datasetSig = inputData ? `${inputData.length}_${inputData[0] ? Object.keys(inputData[0]).length : 0}` : "empty";
  const paletteSig = palette.join("_");
  const cacheKey = `${datasetSig}_${chartType}_${xAxisCol}_${yAxisCols.join(",")}_${aggType}_${topN}_${sortDirection}_${isDark}_${paletteSig}_${mainColor}_${dataRowLimit}`;

  const cached = chartEngineCache.get(cacheKey);
  if (cached) {
    return {
      ...cached,
      executionTimeMs: Date.now() - startTime
    };
  }

  // Perform backend aggregation
  const aggResult = aggregateDataset(inputData, xAxisCol, yAxisCols, aggType, config.zAxis, topN, sortDirection);
  const categories = aggResult.categories;
  const seriesMap = aggResult.seriesDataMap;
  const actualX = aggResult.xAxis;
  const actualYs = aggResult.yAxes;

  // Compute statistical summary for primary Y axis
  const primaryYCol = actualYs[0] || "";
  const primaryYValues = seriesMap[primaryYCol] || [];
  const stats = calculateSeriesStats(primaryYValues);

  let spec: any = {};

  // Common ECharts theme tokens
  const textColor = isDark ? "#E0E6ED" : "#333333";
  const splitLineColor = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)";

  switch (chartType) {
    case "bar3d":
    case "bar3D":
    case "3d-bar":
    case "3D-bar": {
      const maxVal = Math.max(...primaryYValues, 10);
      spec = {
        title: { text: config.title || `3D BAR - ${actualX}`, left: "center", textStyle: { color: textColor, fontSize: 14 } },
        tooltip: {},
        visualMap: {
          max: maxVal,
          dimension: 2,
          inRange: { color: palette }
        },
        xAxis3D: { name: actualX || 'X', type: "category", data: categories, axisLabel: { textStyle: { color: textColor } } },
        yAxis3D: { name: 'Y Column', type: "category", data: actualYs, axisLabel: { textStyle: { color: textColor } } },
        zAxis3D: { name: 'Value', type: "value", axisLabel: { textStyle: { color: textColor } } },
        grid3D: {
          boxWidth: 200, boxDepth: 80, boxHeight: 80,
          viewControl: { projection: 'perspective', autoRotate: true, autoRotateSpeed: 2 },
          light: { main: { intensity: 1.2, shadow: true }, ambient: { intensity: 0.3 } }
        },
        series: [{
          name: '3D Bar',
          type: "bar3D",
          data: categories.flatMap((cat, catIdx) => 
            actualYs.map((yCol, colIdx) => [catIdx, colIdx, seriesMap[yCol]?.[catIdx] || 0])
          ),
          shading: "lambert",
          label: { show: false },
          emphasis: { label: { show: true } }
        }]
      };
      break;
    }

    case "line3d":
    case "line3D":
    case "3d-line":
    case "3D-line": {
      const maxVal = Math.max(...primaryYValues, 10);
      spec = {
        title: { text: config.title || `3D LINE - ${actualX}`, left: "center", textStyle: { color: textColor, fontSize: 14 } },
        tooltip: {},
        visualMap: {
          max: maxVal,
          dimension: 2,
          inRange: { color: palette }
        },
        xAxis3D: { name: actualX || 'X', type: "category", data: categories, axisLabel: { textStyle: { color: textColor } } },
        yAxis3D: { name: 'Y Column', type: "category", data: actualYs, axisLabel: { textStyle: { color: textColor } } },
        zAxis3D: { name: 'Value', type: "value", axisLabel: { textStyle: { color: textColor } } },
        grid3D: {
          boxWidth: 200, boxDepth: 80, boxHeight: 80,
          viewControl: { projection: 'perspective', autoRotate: true, autoRotateSpeed: 2 },
          light: { main: { intensity: 1.2 }, ambient: { intensity: 0.3 } }
        },
        series: actualYs.map((yCol, colIdx) => ({
          name: yCol,
          type: "line3D",
          data: categories.map((cat, catIdx) => [catIdx, colIdx, seriesMap[yCol]?.[catIdx] || 0]),
          lineStyle: { width: 4, color: palette[colIdx % palette.length] }
        }))
      };
      break;
    }

    case "bar":
    case "stacked-bar":
    case "grouped-bar":
    case "horizontal-bar": {
      const isHorizontal = chartType === "horizontal-bar";
      const isStacked = chartType === "stacked-bar";

      const seriesList = actualYs.map((yCol, idx) => ({
        name: yCol,
        type: "bar",
        stack: isStacked ? "totalStack" : undefined,
        data: seriesMap[yCol] || [],
        itemStyle: {
          color: actualYs.length === 1 ? mainColor : palette[idx % palette.length],
          borderRadius: isHorizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]
        },
        emphasis: { focus: "series" }
      }));

      const categoryAxis = {
        type: "category",
        data: categories,
        axisLabel: { color: textColor, rotate: categories.length > 10 ? 30 : 0 },
        axisLine: { lineStyle: { color: textColor } }
      };

      const valueAxis = {
        type: "value",
        axisLabel: { color: textColor },
        splitLine: { lineStyle: { color: splitLineColor } }
      };

      spec = {
        title: { text: config.title || `${chartType.toUpperCase()} - ${actualX}`, left: "center", textStyle: { color: textColor, fontSize: 14 } },
        tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
        legend: { top: 30, textStyle: { color: textColor }, show: actualYs.length > 1 },
        grid: { left: "3%", right: "4%", bottom: "10%", top: "18%", containLabel: true },
        xAxis: isHorizontal ? valueAxis : categoryAxis,
        yAxis: isHorizontal ? categoryAxis : valueAxis,
        series: seriesList
      };
      break;
    }

    case "line":
    case "stacked-line":
    case "smooth-line":
    case "step-line":
    case "step-start-line":
    case "step-end-line":
    case "area-line":
    case "area":
    case "smooth-area":
    case "stacked-area":
    case "gradient-area":
    case "dual-axis-line":
    case "confidence-band":
    case "range-area":
    case "bump-line":
    case "ranking-line":
    case "polar-line":
    case "radial-line":
    case "timeseries-line":
    case "markpoint-line":
    case "markline-line": {
      // Modern ECharts (v6) Dedicated Line Chart Subtype Routing
      if (chartType === "polar-line" || chartType === "radial-line") {
        const polarSeriesList = actualYs.map((yCol, idx) => ({
          name: yCol,
          type: "line",
          coordinateSystem: "polar",
          smooth: true,
          symbol: "circle",
          symbolSize: 6,
          data: seriesMap[yCol] || [],
          lineStyle: { width: 2.5, color: actualYs.length === 1 ? mainColor : palette[idx % palette.length] },
          itemStyle: { color: actualYs.length === 1 ? mainColor : palette[idx % palette.length] }
        }));

        spec = {
          title: { text: config.title || `POLAR RADIAL LINE - ${actualX}`, left: "center", textStyle: { color: textColor, fontSize: 14 } },
          tooltip: { trigger: "axis", axisPointer: { type: "cross" } },
          legend: { top: 30, textStyle: { color: textColor }, show: actualYs.length > 1 },
          polar: { center: ["50%", "50%"], radius: [20, "72%"] },
          angleAxis: { type: "category", data: categories, startAngle: 90, boundaryGap: false, axisLabel: { color: textColor } },
          radiusAxis: { min: 0, axisLabel: { color: textColor }, splitLine: { lineStyle: { type: "dashed" } } },
          series: polarSeriesList
        };
        break;
      }

      if (chartType === "confidence-band" || chartType === "range-area") {
        const primaryY = actualYs[0] || "Value";
        const baseValues = seriesMap[primaryY] || [];
        const marginValues = baseValues.map(v => Math.abs(v * 0.15) || 5);
        const lowerValues = baseValues.map((v, i) => parseFloat((v - marginValues[i]).toFixed(2)));
        const spanValues = marginValues.map(m => parseFloat((m * 2).toFixed(2)));

        spec = {
          title: { text: config.title || `CONFIDENCE BAND - ${actualX}`, left: "center", textStyle: { color: textColor, fontSize: 14 } },
          tooltip: { trigger: "axis" },
          legend: { top: 30, textStyle: { color: textColor } },
          grid: { left: "4%", right: "4%", bottom: "10%", top: "18%", containLabel: true },
          xAxis: { type: "category", data: categories, boundaryGap: false, axisLabel: { color: textColor } },
          yAxis: { type: "value", axisLabel: { color: textColor }, splitLine: { lineStyle: { color: splitLineColor, type: "dashed" } } },
          series: [
            {
              name: "Lower Bound",
              type: "line",
              data: lowerValues,
              lineStyle: { opacity: 0 },
              stack: "confidence-band",
              symbol: "none"
            },
            {
              name: "Confidence Range",
              type: "line",
              data: spanValues,
              lineStyle: { opacity: 0 },
              areaStyle: { color: mainColor, opacity: 0.22 },
              stack: "confidence-band",
              symbol: "none"
            },
            {
              name: primaryY,
              type: "line",
              data: baseValues,
              smooth: 0.35,
              symbol: "circle",
              symbolSize: 7,
              itemStyle: { color: mainColor },
              lineStyle: { width: 3.5, color: mainColor }
            }
          ]
        };
        break;
      }

      if (chartType === "bump-line" || chartType === "ranking-line") {
        const bumpSeries = actualYs.map((yCol, idx) => {
          const color = actualYs.length === 1 ? mainColor : palette[idx % palette.length];
          return {
            name: yCol,
            type: "line",
            data: seriesMap[yCol] || [],
            smooth: 0.5,
            symbol: "circle",
            symbolSize: 15,
            lineStyle: { width: 4.5, color },
            itemStyle: { color, borderWidth: 2, borderColor: "#ffffff" },
            label: {
              show: true,
              position: "inside",
              color: "#ffffff",
              fontSize: 9,
              fontWeight: "bold",
              formatter: (p: any) => p.value !== null && p.value !== undefined ? String(p.value) : ""
            },
            emphasis: { focus: "series", lineStyle: { width: 6.5 } }
          };
        });

        spec = {
          title: { text: config.title || `BUMP RANKING CHART - ${actualX}`, left: "center", textStyle: { color: textColor, fontSize: 14 } },
          tooltip: { trigger: "axis" },
          legend: { top: 30, textStyle: { color: textColor }, show: actualYs.length > 1 },
          grid: { left: "4%", right: "4%", bottom: "10%", top: "18%", containLabel: true },
          xAxis: { type: "category", data: categories, axisLabel: { color: textColor } },
          yAxis: {
            type: "value",
            inverse: true, // Rank #1 at top
            minInterval: 1,
            name: "Rank",
            axisLabel: { color: textColor },
            splitLine: { lineStyle: { color: splitLineColor, type: "dashed" } }
          },
          series: bumpSeries
        };
        break;
      }

      if (chartType === "dual-axis-line") {
        const leftCol = actualYs[0] || "Left";
        const rightCol = actualYs.length > 1 ? actualYs[1] : null;
        const leftColor = mainColor;
        const rightColor = actualYs.length > 1 ? palette[1 % palette.length] : "#91cc75";

        const dualSeries: any[] = [
          {
            name: leftCol,
            type: "line",
            yAxisIndex: 0,
            data: seriesMap[leftCol] || [],
            smooth: true,
            symbol: "circle",
            symbolSize: 7,
            lineStyle: { width: 3, color: leftColor },
            itemStyle: { color: leftColor }
          }
        ];

        if (rightCol) {
          dualSeries.push({
            name: rightCol,
            type: "line",
            yAxisIndex: 1,
            data: seriesMap[rightCol] || [],
            smooth: true,
            symbol: "diamond",
            symbolSize: 8,
            lineStyle: { width: 3, color: rightColor, type: "dashed" },
            itemStyle: { color: rightColor }
          });
        } else {
          const lVals = seriesMap[leftCol] || [];
          let sum = 0;
          const tot = lVals.reduce((a: number, b: number) => a + (b || 0), 0) || 1;
          const cumVals = lVals.map((v: number) => {
            sum += (v || 0);
            return parseFloat(((sum / tot) * 100).toFixed(1));
          });
          dualSeries.push({
            name: `${leftCol} (Cumulative %)`,
            type: "line",
            yAxisIndex: 1,
            data: cumVals,
            smooth: true,
            symbol: "triangle",
            symbolSize: 8,
            lineStyle: { width: 2.5, color: rightColor, type: "dashed" },
            itemStyle: { color: rightColor }
          });
        }

        spec = {
          title: { text: config.title || `DUAL AXIS LINE - ${actualX}`, left: "center", textStyle: { color: textColor, fontSize: 14 } },
          tooltip: { trigger: "axis", axisPointer: { type: "cross" } },
          legend: { top: 30, textStyle: { color: textColor }, show: true },
          grid: { left: "6%", right: "6%", bottom: "12%", top: "18%", containLabel: true },
          xAxis: { type: "category", data: categories, axisLabel: { color: textColor } },
          yAxis: [
            {
              type: "value",
              name: leftCol,
              nameTextStyle: { color: leftColor, fontWeight: "bold" },
              axisLabel: { color: textColor },
              axisLine: { show: true, lineStyle: { color: leftColor } },
              splitLine: { lineStyle: { color: splitLineColor, type: "dashed" } }
            },
            {
              type: "value",
              name: rightCol ? rightCol : "Cumulative %",
              nameTextStyle: { color: rightColor, fontWeight: "bold" },
              axisLabel: { color: textColor, formatter: rightCol ? "{value}" : "{value}%" },
              axisLine: { show: true, lineStyle: { color: rightColor } },
              splitLine: { show: false }
            }
          ],
          series: dualSeries
        };
        break;
      }

      // Remaining line subtypes: smooth-line, area-line, smooth-area, stacked-line, stacked-area,
      // gradient-area, step-line, step-start-line, step-end-line, timeseries-line, markpoint-line, markline-line, line
      const seriesList = actualYs.map((yCol, idx) => {
        const colorHex = actualYs.length === 1 ? mainColor : palette[idx % palette.length];

        let areaStyleObj: any = undefined;
        let smoothVal: boolean | number = false;
        let stepVal: string | undefined = undefined;
        let markPointObj: any = undefined;
        let markLineObj: any = undefined;
        let symbolVal = "circle";
        let symbolSizeVal = 6;
        let lineWidthVal = 2.5;

        switch (chartType) {
          case "smooth-line":
            smoothVal = 0.45;
            symbolSizeVal = 8;
            lineWidthVal = 3.2;
            break;

          case "area-line":
          case "area":
            areaStyleObj = { opacity: 0.35, color: colorHex };
            lineWidthVal = 2.5;
            break;

          case "smooth-area":
            smoothVal = 0.45;
            areaStyleObj = { opacity: 0.38, color: colorHex };
            lineWidthVal = 3;
            symbolSizeVal = 7;
            break;

          case "stacked-line":
            lineWidthVal = 2.5;
            break;

          case "stacked-area":
            smoothVal = true;
            areaStyleObj = { opacity: 0.65, color: colorHex };
            lineWidthVal = 1.8;
            break;

          case "gradient-area":
            smoothVal = 0.38;
            lineWidthVal = 3.2;
            symbolSizeVal = 7;
            areaStyleObj = {
              color: {
                type: 'linear',
                x: 0, y: 0, x2: 0, y2: 1,
                colorStops: [
                  { offset: 0, color: colorHex },
                  { offset: 1, color: isDark ? 'rgba(15, 23, 42, 0.05)' : 'rgba(255, 255, 255, 0.05)' }
                ]
              },
              opacity: 0.8
            };
            break;

          case "step-line":
            stepVal = "middle";
            symbolVal = "circle";
            symbolSizeVal = 7;
            lineWidthVal = 3;
            break;

          case "step-start-line":
            stepVal = "start";
            symbolVal = "diamond";
            symbolSizeVal = 8;
            lineWidthVal = 3;
            break;

          case "step-end-line":
            stepVal = "end";
            symbolVal = "rect";
            symbolSizeVal = 7;
            lineWidthVal = 3;
            break;

          case "timeseries-line":
            smoothVal = 0.25;
            lineWidthVal = 2.5;
            areaStyleObj = {
              color: {
                type: 'linear',
                x: 0, y: 0, x2: 0, y2: 1,
                colorStops: [
                  { offset: 0, color: colorHex },
                  { offset: 1, color: isDark ? 'rgba(15, 23, 42, 0.02)' : 'rgba(255, 255, 255, 0.02)' }
                ]
              },
              opacity: 0.45
            };
            break;

          case "markpoint-line":
            lineWidthVal = 2.8;
            markPointObj = {
              symbol: 'pin',
              symbolSize: 48,
              data: [
                { type: 'max', name: 'Peak', itemStyle: { color: '#10b981' }, label: { formatter: 'Max\n{c}', fontSize: 10, fontWeight: 'bold', color: '#fff' } },
                { type: 'min', name: 'Low', itemStyle: { color: '#ef4444' }, label: { formatter: 'Min\n{c}', fontSize: 10, fontWeight: 'bold', color: '#fff' } }
              ]
            };
            break;

          case "markline-line":
            lineWidthVal = 2.8;
            markLineObj = {
              symbol: ['none', 'none'],
              data: [
                { type: 'average', name: 'Avg', lineStyle: { type: 'dashed', color: '#f59e0b', width: 2.5 }, label: { formatter: 'Avg: {c}', position: 'end', color: '#f59e0b', fontWeight: 'bold' } },
                { type: 'median', name: 'Med', lineStyle: { type: 'dotted', color: '#8b5cf6', width: 2 }, label: { formatter: 'Med: {c}', position: 'start', color: '#8b5cf6', fontWeight: 'bold' } }
              ]
            };
            break;

          default:
            smoothVal = false;
            lineWidthVal = 2.5;
            break;
        }

        if (typeof config.symbolImage === 'string' && config.symbolImage.trim()) {
          const img = config.symbolImage.trim();
          symbolVal = (img.startsWith('data:') || img.startsWith('http') || img.startsWith('/')) ? (img.startsWith('image://') ? img : `image://${img}`) : img;
        } else if (typeof config.symbol === 'string' && config.symbol.trim()) {
          const sym = config.symbol.trim();
          symbolVal = (sym.startsWith('data:') || sym.startsWith('http') || sym.startsWith('/')) ? (sym.startsWith('image://') ? sym : `image://${sym}`) : sym;
        }

        const isStacked = chartType === "stacked-line" || chartType === "stacked-area";

        return {
          name: yCol,
          type: "line",
          smooth: smoothVal,
          step: stepVal,
          stack: isStacked ? "totalStack" : undefined,
          data: seriesMap[yCol] || [],
          itemStyle: { color: colorHex },
          areaStyle: areaStyleObj,
          symbol: symbolVal,
          symbolSize: (symbolVal && symbolVal.startsWith('image://')) ? 24 : symbolSizeVal,
          lineStyle: { width: lineWidthVal, color: colorHex },
          markPoint: markPointObj,
          markLine: markLineObj,
          emphasis: { focus: "series" }
        };
      });

      const isTimeseries = chartType === "timeseries-line";

      spec = {
        title: { text: config.title || `${chartType.toUpperCase().replace(/-/g, ' ')} - ${actualX}`, left: "center", textStyle: { color: textColor, fontSize: 14 } },
        tooltip: { trigger: "axis", axisPointer: (chartType === "stacked-line" || chartType === "stacked-area" || isTimeseries) ? { type: "cross" } : undefined },
        legend: { top: 30, textStyle: { color: textColor }, show: actualYs.length > 1 },
        grid: { left: "4%", right: "4%", bottom: isTimeseries ? "18%" : "10%", top: "18%", containLabel: true },
        dataZoom: isTimeseries ? [
          { type: 'inside', start: 0, end: 100 },
          { type: 'slider', start: 0, end: 100, bottom: '2%', height: 24, textStyle: { color: textColor } }
        ] : undefined,
        xAxis: {
          type: "category",
          data: categories,
          boundaryGap: false,
          axisLabel: { color: textColor },
          axisLine: { lineStyle: { color: textColor } }
        },
        yAxis: {
          type: "value",
          axisLabel: { color: textColor },
          splitLine: { lineStyle: { color: splitLineColor, type: "dashed" } }
        },
        series: seriesList
      };
      break;
    }

    case "pie":
    case "doughnut":
    case "rose-radius":
    case "rose-area": {
      const primaryY = actualYs[0] || "Value";
      const pieData = categories.map((cat, idx) => ({
        name: cat,
        value: (seriesMap[primaryY] || [])[idx] || 0
      }));

      const isDoughnut = chartType === "doughnut";
      const isRose = chartType.startsWith("rose");

      spec = {
        title: { text: config.title || `PIE CHART - ${actualX}`, left: "center", textStyle: { color: textColor, fontSize: 14 } },
        tooltip: { trigger: "item", formatter: "{a} <br/>{b} : {c} ({d}%)" },
        legend: { type: "scroll", orient: "horizontal", bottom: 0, textStyle: { color: textColor } },
        series: [
          {
            name: primaryY,
            type: "pie",
            radius: isDoughnut ? ["40%", "70%"] : "65%",
            center: ["50%", "45%"],
            roseType: isRose ? (chartType === "rose-radius" ? "radius" : "area") : undefined,
            data: pieData,
            itemStyle: { borderRadius: 6, borderColor: isDark ? "#1e293b" : "#fff", borderWidth: 2 },
            emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: "rgba(0, 0, 0, 0.5)" } }
          }
        ]
      };
      break;
    }

    case "scatter":
    case "bubble": {
      const primaryY = actualYs[0] || "Value";
      const secondaryY = actualYs[1];

      const scatterData = categories.map((cat, idx) => {
        const xVal = parseFloat(cat) || idx;
        const yVal = (seriesMap[primaryY] || [])[idx] || 0;
        const zVal = secondaryY ? (seriesMap[secondaryY] || [])[idx] || 10 : 10;
        return chartType === "bubble" ? [xVal, yVal, zVal, cat] : [xVal, yVal, cat];
      });

      spec = {
        title: { text: config.title || `SCATTER - ${actualX}`, left: "center", textStyle: { color: textColor, fontSize: 14 } },
        tooltip: {
          trigger: "item",
          formatter: (params: any) => {
            const d = params.value || [];
            return `<b>${d[3] || d[2] || "Point"}</b><br/>X: ${d[0]}<br/>Y: ${d[1]}${d[2] ? `<br/>Size: ${d[2]}` : ""}`;
          }
        },
        xAxis: { type: "value", axisLabel: { color: textColor }, splitLine: { lineStyle: { color: splitLineColor } } },
        yAxis: { type: "value", axisLabel: { color: textColor }, splitLine: { lineStyle: { color: splitLineColor } } },
        series: [
          {
            type: "scatter",
            symbolSize: (data: any) => (chartType === "bubble" ? Math.min(Math.max((data[2] || 10) / 2, 8), 40) : 10),
            data: scatterData,
            itemStyle: { color: mainColor, opacity: 0.8 }
          }
        ]
      };
      break;
    }

    case "funnel": {
      const primaryY = actualYs[0] || "Value";
      const funnelData = categories.map((cat, idx) => ({
        name: cat,
        value: (seriesMap[primaryY] || [])[idx] || 0
      })).sort((a, b) => b.value - a.value);

      spec = {
        title: { text: config.title || `FUNNEL - ${actualX}`, left: "center", textStyle: { color: textColor, fontSize: 14 } },
        tooltip: { trigger: "item", formatter: "{a} <br/>{b} : {c}" },
        legend: { bottom: 0, textStyle: { color: textColor } },
        series: [
          {
            name: primaryY,
            type: "funnel",
            left: "10%",
            top: 60,
            bottom: 60,
            width: "80%",
            min: 0,
            maxSize: "100%",
            sort: "descending",
            gap: 2,
            label: { show: true, position: "inside" },
            data: funnelData
          }
        ]
      };
      break;
    }

    case "gauge": {
      const primaryY = actualYs[0] || "Value";
      const rawVals = seriesMap[primaryY] || [];
      const totalVal = rawVals.length > 0 ? rawVals.reduce((a, b) => a + b, 0) : 0;
      const avgVal = rawVals.length > 0 ? totalVal / rawVals.length : 0;
      const displayVal = Math.round(avgVal * 100) / 100;

      spec = {
        title: { text: config.title || `GAUGE - ${actualX}`, left: "center", textStyle: { color: textColor, fontSize: 14 } },
        series: [
          {
            type: "gauge",
            center: ["50%", "60%"],
            startAngle: 180,
            endAngle: 0,
            min: 0,
            max: Math.max(displayVal * 1.5, 100),
            pointer: { icon: "path://M12.8,0.7l12,40.1H0.7L12.8,0.7z", length: "12%", width: 20, offsetCenter: [0, "-60%"], itemStyle: { color: "auto" } },
            axisLine: {
              lineStyle: {
                width: 18,
                color: [
                  [0.3, "#67e0e3"],
                  [0.7, "#37a2da"],
                  [1, "#fd666d"]
                ]
              }
            },
            detail: { valueAnimation: true, formatter: "{value}", color: textColor, fontSize: 20, offsetCenter: [0, "-20%"] },
            data: [{ value: displayVal, name: `${primaryY} (AVG)` }]
          }
        ]
      };
      break;
    }

    case "kpi_sparkline": {
      const primaryY = actualYs[0] || "Value";
      const values = seriesMap[primaryY] || [];
      const total = values.reduce((a, b) => a + b, 0);
      const avg = values.length > 0 ? total / values.length : 0;
      const min = values.length > 0 ? Math.min(...values) : 0;
      const max = values.length > 0 ? Math.max(...values) : 0;

      // Delta calculation vs previous period
      let deltaPercent = 0;
      if (values.length >= 2) {
        const lastVal = values[values.length - 1];
        const prevVal = values[values.length - 2];
        deltaPercent = prevVal !== 0 ? Math.round(((lastVal - prevVal) / prevVal) * 1000) / 10 : 0;
      }

      spec = {
        isKpi: true,
        title: config.title || `${primaryY} Summary`,
        primaryMetric: primaryY,
        totalValue: Math.round(total * 100) / 100,
        avgValue: Math.round(avg * 100) / 100,
        minValue: min,
        maxValue: max,
        deltaPercent: deltaPercent,
        trendDirection: deltaPercent >= 0 ? "up" : "down",
        sparklinePoints: values.slice(-20),
        categories: categories.slice(-20),
        mainColor: mainColor
      };
      break;
    }

    case "radar": {
      let indicators: any[] = [];
      let radarData: any[] = [];

      if (actualYs.length > 1) {
        indicators = actualYs.map((yCol) => {
          const vals = seriesMap[yCol] || [];
          const maxVal = vals.length > 0 ? Math.max(...vals.map((v: number) => Number(v) || 0)) : 100;
          return { name: yCol, max: maxVal > 0 ? Math.ceil(maxVal * 1.15) : 100 };
        });

        radarData = categories.slice(0, 6).map((cat, rowIdx) => {
          return {
            name: cat,
            value: actualYs.map((yCol) => (seriesMap[yCol] || [])[rowIdx] || 0),
            itemStyle: { color: palette[rowIdx % palette.length] },
            areaStyle: { opacity: 0.25, color: palette[rowIdx % palette.length] }
          };
        });
      } else {
        const primaryY = actualYs[0] || "Value";
        const vals = seriesMap[primaryY] || [];
        const maxVal = vals.length > 0 ? Math.max(...vals.map((v: number) => Number(v) || 0)) : 100;
        indicators = categories.slice(0, 12).map((cat) => ({
          name: cat,
          max: maxVal > 0 ? Math.ceil(maxVal * 1.15) : 100
        }));

        radarData = [{
          name: primaryY,
          value: vals.slice(0, 12),
          itemStyle: { color: mainColor },
          areaStyle: { opacity: 0.3, color: mainColor }
        }];
      }

      spec = {
        title: { text: config.title || `RADAR - ${actualX}`, left: "center", textStyle: { color: textColor, fontSize: 14 } },
        tooltip: { trigger: "item" },
        legend: { top: 30, textStyle: { color: textColor }, show: actualYs.length > 1 },
        radar: {
          indicator: indicators,
          shape: "polygon",
          axisName: { color: textColor }
        },
        series: [{
          name: config.title || "Radar",
          type: "radar",
          data: radarData
        }]
      };
      break;
    }

    case "treemap": {
      const primaryY = actualYs[0] || "Value";
      const treeData = categories.map((cat, idx) => ({
        name: cat,
        value: (seriesMap[primaryY] || [])[idx] || 0,
        itemStyle: { color: palette[idx % palette.length] }
      })).filter(item => item.value > 0);

      spec = {
        title: { text: config.title || `TREEMAP - ${actualX}`, left: "center", textStyle: { color: textColor, fontSize: 14 } },
        tooltip: { trigger: "item", formatter: "{b}: <b>{c}</b>" },
        series: [{
          name: primaryY,
          type: "treemap",
          data: treeData,
          leafDepth: 1,
          roam: false,
          label: { show: true, formatter: "{b}\n{c}", color: "#fff" },
          itemStyle: { borderColor: isDark ? "#1e293b" : "#fff", borderWidth: 2, gapWidth: 2 },
          breadcrumb: { show: false }
        }]
      };
      break;
    }

    case "waterfall": {
      const primaryY = actualYs[0] || "Value";
      const rawVals = (seriesMap[primaryY] || []).map((v: any) => Number(v) || 0);

      let runningTotal = 0;
      const baseData: number[] = [];
      const deltaData: number[] = [];

      rawVals.forEach((val: number) => {
        if (val >= 0) {
          baseData.push(runningTotal);
          deltaData.push(val);
          runningTotal += val;
        } else {
          runningTotal += val;
          baseData.push(runningTotal);
          deltaData.push(Math.abs(val));
        }
      });

      spec = {
        title: { text: config.title || `WATERFALL - ${actualX}`, left: "center", textStyle: { color: textColor, fontSize: 14 } },
        tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
        grid: { left: "3%", right: "4%", bottom: "10%", top: "18%", containLabel: true },
        xAxis: { type: "category", data: categories, axisLabel: { color: textColor } },
        yAxis: { type: "value", axisLabel: { color: textColor }, splitLine: { lineStyle: { color: splitLineColor } } },
        series: [
          {
            name: "Placeholder",
            type: "bar",
            stack: "Total",
            itemStyle: { borderColor: "transparent", color: "transparent" },
            emphasis: { itemStyle: { borderColor: "transparent", color: "transparent" } },
            data: baseData
          },
          {
            name: primaryY,
            type: "bar",
            stack: "Total",
            label: { show: true, position: "top", color: textColor },
            data: deltaData.map((d, i) => ({
              value: d,
              itemStyle: { color: rawVals[i] >= 0 ? "#10b981" : "#ef4444" }
            }))
          }
        ]
      };
      break;
    }

    case "heatmap": {
      const yAxisList = actualYs.length > 1 ? actualYs : ["Metric 1", "Metric 2", "Metric 3"];
      const heatData: any[] = [];
      let minVal = Infinity;
      let maxVal = -Infinity;

      categories.forEach((cat, xIdx) => {
        yAxisList.forEach((yCol, yIdx) => {
          const val = Number((seriesMap[yCol] || [])[xIdx]) || Math.round(Math.sin(xIdx + yIdx) * 50 + 50);
          if (val < minVal) minVal = val;
          if (val > maxVal) maxVal = val;
          heatData.push([xIdx, yIdx, val]);
        });
      });
      if (minVal === Infinity) minVal = 0;
      if (maxVal === -Infinity) maxVal = 100;

      spec = {
        title: { text: config.title || `HEATMAP - ${actualX}`, left: "center", textStyle: { color: textColor, fontSize: 14 } },
        tooltip: { position: "top" },
        grid: { height: "60%", top: "15%", left: "8%", right: "8%" },
        xAxis: { type: "category", data: categories, splitArea: { show: true }, axisLabel: { color: textColor } },
        yAxis: { type: "category", data: yAxisList, splitArea: { show: true }, axisLabel: { color: textColor } },
        visualMap: {
          min: minVal,
          max: maxVal,
          calculable: true,
          orient: "horizontal",
          left: "center",
          bottom: "2%",
          inRange: { color: ["#dbeafe", "#3b82f6", "#1d4ed8"] },
          textStyle: { color: textColor }
        },
        series: [{
          name: "Heatmap",
          type: "heatmap",
          data: heatData,
          label: { show: true, color: "#fff" },
          emphasis: { itemStyle: { shadowBlur: 10, shadowColor: "rgba(0, 0, 0, 0.5)" } }
        }]
      };
      break;
    }

    case "sankey": {
      const primaryY = actualYs[0] || "Value";
      const nodesSet = new Set<string>();
      categories.forEach((c) => nodesSet.add(c));
      nodesSet.add(primaryY);

      const nodes = Array.from(nodesSet).map((name) => ({ name }));
      const links = categories.map((cat, idx) => ({
        source: cat,
        target: primaryY,
        value: Math.max(1, (seriesMap[primaryY] || [])[idx] || 10)
      }));

      spec = {
        title: { text: config.title || `SANKEY - ${actualX}`, left: "center", textStyle: { color: textColor, fontSize: 14 } },
        tooltip: { trigger: "item", triggerOn: "mousemove" },
        series: [{
          type: "sankey",
          data: nodes,
          links: links,
          emphasis: { focus: "adjacency" },
          lineStyle: { color: "gradient", curveness: 0.5 },
          label: { color: textColor }
        }]
      };
      break;
    }

    case "bullet": {
      const actualY = actualYs[0] || "Actual";
      const targetY = actualYs[1] || actualY;
      const actualVals = seriesMap[actualY] || [];
      const targetVals = seriesMap[targetY] || actualVals.map((v: number) => v * 1.15);

      spec = {
        title: { text: config.title || `BULLET CHART - ${actualX}`, left: "center", textStyle: { color: textColor, fontSize: 14 } },
        tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
        legend: { top: 30, textStyle: { color: textColor } },
        grid: { left: "3%", right: "4%", bottom: "10%", top: "18%", containLabel: true },
        xAxis: { type: "value", axisLabel: { color: textColor }, splitLine: { lineStyle: { color: splitLineColor } } },
        yAxis: { type: "category", data: categories, axisLabel: { color: textColor } },
        series: [
          {
            name: `${actualY} (Actual)`,
            type: "bar",
            barWidth: 16,
            z: 2,
            data: actualVals,
            itemStyle: { color: mainColor, borderRadius: [0, 4, 4, 0] }
          },
          {
            name: `${targetY} (Target)`,
            type: "bar",
            barWidth: 26,
            barGap: "-100%",
            z: 1,
            data: targetVals,
            itemStyle: { color: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)", borderRadius: [0, 4, 4, 0] }
          }
        ]
      };
      break;
    }

    case "boxplot": {
      const primaryY = actualYs[0] || "Value";
      const rawVals = (seriesMap[primaryY] || []).map((v: any) => Number(v) || 0);

      // Compute simple 5-number summary: min, Q1, median, Q3, max
      const sorted = [...rawVals].sort((a, b) => a - b);
      const min = sorted[0] || 0;
      const max = sorted[sorted.length - 1] || 100;
      const median = sorted[Math.floor(sorted.length * 0.5)] || (min + max) / 2;
      const q1 = sorted[Math.floor(sorted.length * 0.25)] || (min + median) / 2;
      const q3 = sorted[Math.floor(sorted.length * 0.75)] || (median + max) / 2;

      const boxData = categories.map((cat, idx) => {
        const val = rawVals[idx] || median;
        const jitter = Math.sin(idx) * ((max - min) * 0.1);
        return [
          Math.max(min, q1 - Math.abs(jitter)),
          q1,
          median,
          q3,
          Math.min(max, q3 + Math.abs(jitter))
        ];
      });

      spec = {
        title: { text: config.title || `BOXPLOT - ${actualX}`, left: "center", textStyle: { color: textColor, fontSize: 14 } },
        tooltip: { trigger: "item", axisPointer: { type: "shadow" } },
        grid: { left: "3%", right: "4%", bottom: "10%", top: "18%", containLabel: true },
        xAxis: { type: "category", data: categories, axisLabel: { color: textColor } },
        yAxis: { type: "value", axisLabel: { color: textColor }, splitLine: { lineStyle: { color: splitLineColor } } },
        series: [{
          name: primaryY,
          type: "boxplot",
          data: boxData,
          itemStyle: { color: "#dbeafe", borderColor: mainColor }
        }]
      };
      break;
    }

    case "candlestick":
    case "ohlc": {
      const openVals = seriesMap[actualYs[0]] || [];
      const highVals = seriesMap[actualYs[1]] || openVals;
      const lowVals = seriesMap[actualYs[2]] || openVals;
      const closeVals = seriesMap[actualYs[3]] || openVals;

      // ECharts expects data items: [open, close, lowest, highest]
      const candlestickData = categories.map((_, idx) => {
        const o = Number(openVals[idx]) || 0;
        const h = Number(highVals[idx]) || o;
        const l = Number(lowVals[idx]) || o;
        const c = Number(closeVals[idx]) || o;
        return [o, c, l, h];
      });

      spec = {
        title: { text: config.title || `${chartType.toUpperCase()} - ${actualX}`, left: "center", textStyle: { color: textColor, fontSize: 14 } },
        tooltip: { trigger: "axis", axisPointer: { type: "cross" } },
        grid: { left: "5%", right: "5%", bottom: "18%", top: "15%", containLabel: true },
        xAxis: { type: "category", data: categories, scale: true, axisLabel: { color: textColor } },
        yAxis: { scale: true, splitArea: { show: true }, axisLabel: { color: textColor }, splitLine: { lineStyle: { color: splitLineColor } } },
        dataZoom: [
          { type: "inside", start: 0, end: 100 },
          { show: true, type: "slider", bottom: "2%", start: 0, end: 100, textStyle: { color: textColor } }
        ],
        series: [{
          name: config.title || "Candlestick",
          type: "candlestick",
          data: candlestickData,
          barWidth: chartType === "ohlc" ? 4 : undefined,
          itemStyle: {
            color: "#10b981",
            color0: "#ef4444",
            borderColor: "#10b981",
            borderColor0: "#ef4444"
          }
        }],
        // Maintain backwards-compatible Plotly payload for Plotly renderer if needed
        isPlotly: true,
        type: chartType,
        x: categories,
        open: openVals,
        high: highVals,
        low: lowVals,
        close: closeVals
      };
      break;
    }

    default: {
      // General fallback to Bar chart
      spec = {
        title: { text: config.title || `${chartType.toUpperCase()} - ${actualX}`, left: "center", textStyle: { color: textColor, fontSize: 14 } },
        tooltip: { trigger: "axis" },
        xAxis: { type: "category", data: categories },
        yAxis: { type: "value" },
        series: actualYs.map((yCol) => ({ name: yCol, type: "bar", data: seriesMap[yCol] || [] }))
      };
      break;
    }
  }

  if (spec) {
    spec.color = palette;

    if (spec.series && Array.isArray(spec.series) && spec.series.length > 0) {
      if (config.threshold && config.threshold.enable && config.threshold.value !== undefined) {
        const threshVal = Number(config.threshold.value);
        if (!isNaN(threshVal)) {
          spec.series[0].markLine = {
            symbol: ['none', 'arrow'],
            data: [
              {
                yAxis: threshVal,
                name: config.threshold.label || 'Target',
                label: {
                  show: true,
                  formatter: (config.threshold.label || 'Target') + ': {c}',
                  position: 'end',
                  color: config.threshold.color || '#ef4444'
                },
                lineStyle: {
                  color: config.threshold.color || '#ef4444',
                  type: config.threshold.style || 'dashed',
                  width: 2
                }
              }
            ]
          };
        }
      }

      if (config.threshold && config.threshold.enableZone && config.threshold.zoneMin !== undefined && config.threshold.zoneMax !== undefined) {
        const minVal = Number(config.threshold.zoneMin);
        const maxVal = Number(config.threshold.zoneMax);
        if (!isNaN(minVal) && !isNaN(maxVal)) {
          spec.series[0].markArea = {
            silent: true,
            data: [
              [
                {
                  name: config.threshold.zoneLabel || 'Target Zone',
                  yAxis: minVal,
                  itemStyle: { color: config.threshold.zoneColor || 'rgba(239, 68, 68, 0.18)' },
                  label: { show: true, color: textColor, fontSize: 10, fontWeight: 'bold' }
                },
                { yAxis: maxVal }
              ]
            ]
          };
        }
      }
    }
  }

  const executionTimeMs = Date.now() - startTime;

  const finalResult: ChartEngineResult = {
    success: true,
    executionTimeMs,
    chartType,
    chartSpec: spec,
    aggregatedData: aggResult.aggregatedRows,
    meta: {
      totalInputRows: rawData.length,
      aggregatedRows: aggResult.aggregatedRows.length,
      xAxisKey: actualX,
      yAxesKeys: actualYs,
      aggregationUsed: aggType,
      stats: stats,
      engine: "Vedra BI Enterprise Backend TypeScript Scale Engine v3.0"
    } as any
  };

  // Cache final result
  chartEngineCache.set(cacheKey, finalResult);

  return finalResult;
}

/**
 * Smart Auto-Recommendation Engine based on column data profiling
 */
export function recommendChartSpecs(rawData: any[]): RecommendedChartSpec[] {
  if (!rawData || rawData.length === 0) return [];

  const firstRow = rawData[0] || {};
  const columns = Object.keys(firstRow);
  if (columns.length === 0) return [];

  const numericCols: string[] = [];
  const stringCols: string[] = [];
  const dateCols: string[] = [];

  for (const col of columns) {
    const val = firstRow[col];
    if (typeof val === "number" || (!isNaN(Number(val)) && val !== "" && val !== null)) {
      numericCols.push(col);
    } else if (typeof val === "string" && !isNaN(Date.parse(val)) && val.length >= 8) {
      dateCols.push(col);
    } else {
      stringCols.push(col);
    }
  }

  const recommendations: RecommendedChartSpec[] = [];

  // Recommendation 1: Bar Chart
  const primaryCategory = stringCols[0] || dateCols[0] || columns[0];
  const primaryMetric = numericCols[0] || columns[1] || columns[0];

  if (primaryCategory && primaryMetric) {
    recommendations.push({
      type: "bar",
      title: `${primaryMetric} b/w ${primaryCategory}`,
      description: `Categorical aggregation of ${primaryMetric} grouped by ${primaryCategory}`,
      suitabilityScore: 98,
      xAxis: primaryCategory,
      yAxes: [primaryMetric],
      recommendedAggregation: "sum",
      previewChartSpec: generateChartSpec({ type: "bar", xAxis: primaryCategory, yAxes: [primaryMetric] }, rawData).chartSpec
    });
  }

  // Recommendation 2: Line Trend Chart
  const timeCategory = dateCols[0] || primaryCategory;
  if (timeCategory && primaryMetric) {
    recommendations.push({
      type: "line",
      title: `${primaryMetric} Trend over ${timeCategory}`,
      description: `Time-series trend analysis of ${primaryMetric}`,
      suitabilityScore: 95,
      xAxis: timeCategory,
      yAxes: [primaryMetric],
      recommendedAggregation: "sum",
      previewChartSpec: generateChartSpec({ type: "smooth-line", xAxis: timeCategory, yAxes: [primaryMetric] }, rawData).chartSpec
    });
  }

  // Recommendation 3: Pie / Doughnut Distribution
  if (primaryCategory && primaryMetric) {
    recommendations.push({
      type: "doughnut",
      title: `${primaryMetric} Proportion by ${primaryCategory}`,
      description: `Relative market share & percentage breakdown`,
      suitabilityScore: 90,
      xAxis: primaryCategory,
      yAxes: [primaryMetric],
      recommendedAggregation: "sum",
      previewChartSpec: generateChartSpec({ type: "doughnut", xAxis: primaryCategory, yAxes: [primaryMetric] }, rawData).chartSpec
    });
  }

  // Recommendation 4: KPI Sparkline Summary Card
  if (primaryMetric) {
    recommendations.push({
      type: "kpi_sparkline",
      title: `${primaryMetric} Executive KPI Card`,
      description: `High-level summary metric with sparkline trend`,
      suitabilityScore: 92,
      xAxis: primaryCategory,
      yAxes: [primaryMetric],
      recommendedAggregation: "sum",
      previewChartSpec: generateChartSpec({ type: "kpi_sparkline", xAxis: primaryCategory, yAxes: [primaryMetric] }, rawData).chartSpec
    });
  }

  return recommendations;
}

/**
 * Server-Side Pure SVG Generator for charts
 * Produces crisp, pre-rendered SVG strings without requiring client DOM or Canvas
 */
export function generateChartSVG(
  config: ChartConfigInput,
  rawData: any[],
  width = 600,
  height = 350
): string {
  const chartRes = generateChartSpec(config, rawData);
  const chartType = (config.type || "bar").toLowerCase();
  const title = config.title || "Chart";
  const rows = chartRes.aggregatedData || [];
  const meta = chartRes.meta;

  const bg = config.theme === "dark" ? "#1e293b" : "#ffffff";
  const textColor = config.theme === "dark" ? "#e2e8f0" : "#334155";
  const gridColor = config.theme === "dark" ? "rgba(255,255,255,0.1)" : "#f1f5f9";
  const mainColor = config.color || DEFAULT_PALETTE[0];

  const padding = { top: 50, right: 30, bottom: 60, left: 60 };
  const graphWidth = width - padding.left - padding.right;
  const graphHeight = height - padding.top - padding.bottom;

  let contentElements = "";

  if (rows.length === 0) {
    contentElements = `<text x="${width / 2}" y="${height / 2}" fill="${textColor}" text-anchor="middle" font-size="14">No Data Available</text>`;
  } else if (chartType.includes("bar")) {
    const primaryY = meta.yAxesKeys[0] || "value";
    const maxVal = Math.max(...rows.map((r) => Number(r[primaryY]) || 0), 1);
    const barWidth = Math.max(Math.floor(graphWidth / rows.length) - 8, 4);

    // Y Gridlines
    for (let i = 0; i <= 4; i++) {
      const yVal = Math.round((maxVal / 4) * i);
      const yPos = padding.top + graphHeight - (i / 4) * graphHeight;
      contentElements += `
        <line x1="${padding.left}" y1="${yPos}" x2="${width - padding.right}" y2="${yPos}" stroke="${gridColor}" stroke-dasharray="3 3"/>
        <text x="${padding.left - 8}" y="${yPos + 4}" fill="${textColor}" font-size="10" text-anchor="end">${yVal}</text>
      `;
    }

    // Bars
    rows.forEach((r, idx) => {
      const val = Number(r[primaryY]) || 0;
      const barHeight = (val / maxVal) * graphHeight;
      const xPos = padding.left + idx * (graphWidth / rows.length) + 4;
      const yPos = padding.top + graphHeight - barHeight;
      const color = DEFAULT_PALETTE[idx % DEFAULT_PALETTE.length];

      contentElements += `
        <rect x="${xPos}" y="${yPos}" width="${barWidth}" height="${barHeight}" fill="${color}" rx="3" ry="3">
          <title>${r[meta.xAxisKey]}: ${val}</title>
        </rect>
        ${rows.length <= 15 ? `<text x="${xPos + barWidth / 2}" y="${height - padding.bottom + 15}" fill="${textColor}" font-size="10" text-anchor="middle" transform="rotate(25 ${xPos + barWidth / 2} ${height - padding.bottom + 15})">${String(r[meta.xAxisKey] || '').substring(0, 10)}</text>` : ''}
      `;
    });
  } else if (chartType.includes("pie") || chartType.includes("doughnut")) {
    const primaryY = meta.yAxesKeys[0] || "value";
    const totalVal = rows.reduce((acc, r) => acc + (Number(r[primaryY]) || 0), 0) || 1;
    const cx = width / 2;
    const cy = height / 2 + 10;
    const radius = Math.min(graphWidth, graphHeight) / 2 - 10;
    const innerRadius = chartType.includes("doughnut") ? radius * 0.5 : 0;

    let startAngle = 0;
    rows.forEach((r, idx) => {
      const val = Number(r[primaryY]) || 0;
      const sliceAngle = (val / totalVal) * 2 * Math.PI;
      const endAngle = startAngle + sliceAngle;

      const x1 = cx + radius * Math.cos(startAngle);
      const y1 = cy + radius * Math.sin(startAngle);
      const x2 = cx + radius * Math.cos(endAngle);
      const y2 = cy + radius * Math.sin(endAngle);

      const largeArcFlag = sliceAngle > Math.PI ? 1 : 0;
      const color = DEFAULT_PALETTE[idx % DEFAULT_PALETTE.length];

      if (innerRadius > 0) {
        const ix1 = cx + innerRadius * Math.cos(endAngle);
        const iy1 = cy + innerRadius * Math.sin(endAngle);
        const ix2 = cx + innerRadius * Math.cos(startAngle);
        const iy2 = cy + innerRadius * Math.sin(startAngle);

        contentElements += `
          <path d="M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${ix2} ${iy2} Z" fill="${color}">
            <title>${r[meta.xAxisKey]}: ${val} (${Math.round((val/totalVal)*100)}%)</title>
          </path>`;
      } else {
        contentElements += `
          <path d="M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z" fill="${color}">
            <title>${r[meta.xAxisKey]}: ${val} (${Math.round((val/totalVal)*100)}%)</title>
          </path>`;
      }

      startAngle = endAngle;
    });
  } else {
    // Line chart fallback SVG
    const primaryY = meta.yAxesKeys[0] || "value";
    const maxVal = Math.max(...rows.map((r) => Number(r[primaryY]) || 0), 1);
    let points = "";

    rows.forEach((r, idx) => {
      const val = Number(r[primaryY]) || 0;
      const x = padding.left + (idx / Math.max(rows.length - 1, 1)) * graphWidth;
      const y = padding.top + graphHeight - (val / maxVal) * graphHeight;
      points += `${x},${y} `;

      contentElements += `<circle cx="${x}" cy="${y}" r="4" fill="${mainColor}"><title>${r[meta.xAxisKey]}: ${val}</title></circle>`;
    });

    contentElements = `<polyline fill="none" stroke="${mainColor}" stroke-width="3" points="${points}"/>` + contentElements;
  }

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="100%" style="background-color: ${bg}; border-radius: 8px;">
      <!-- Title -->
      <text x="${width / 2}" y="28" fill="${textColor}" font-size="16" font-weight="600" text-anchor="middle">${title}</text>
      <!-- Chart Body -->
      <g>
        ${contentElements}
      </g>
    </svg>
  `.trim();
}

/**
 * Async Background Job Store for Heavy Chart Processing
 */
export interface AsyncChartJob {
  jobId: string;
  status: "pending" | "processing" | "completed" | "failed";
  progress: number;
  result?: ChartEngineResult;
  svg?: string;
  error?: string;
  createdAt: number;
  completedAt?: number;
}

const asyncJobsStore = new Map<string, AsyncChartJob>();

/**
 * Create and execute asynchronous chart task
 */
export function createAsyncJob(config: ChartConfigInput, rawData: any[], generateSvg = false): AsyncChartJob {
  const jobId = "job_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now();
  const job: AsyncChartJob = {
    jobId,
    status: "processing",
    progress: 10,
    createdAt: Date.now()
  };

  asyncJobsStore.set(jobId, job);

  // Execute processing in immediate non-blocking macro-task
  setImmediate(() => {
    try {
      const startTime = Date.now();
      job.progress = 50;

      const result = generateChartSpec(config, rawData);
      job.result = result;
      job.progress = 80;

      if (generateSvg) {
        job.svg = generateChartSVG(config, rawData);
      }

      job.progress = 100;
      job.status = "completed";
      job.completedAt = Date.now();
    } catch (err: any) {
      job.status = "failed";
      job.error = err?.message || "Job execution error";
    }
  });

  // Cleanup old jobs after 10 minutes
  setTimeout(() => {
    asyncJobsStore.delete(jobId);
  }, 10 * 60 * 1000);

  return job;
}

/**
 * Fetch async job status by ID
 */
export function getAsyncJobStatus(jobId: string): AsyncChartJob | null {
  return asyncJobsStore.get(jobId) || null;
}

