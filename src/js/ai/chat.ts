// src/js/ai/chat.ts
// Production-grade AI Assistant with Multi-Session Management, Fullscreen Mode, and Pure English UI

export interface ChatHistoryEntry {
  type: string;
  message: string;
}

export interface ChatMessageItem {
  id: string;
  type: "user" | "assistant";
  message: string;
  timestamp: number;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessageItem[];
}

export interface AiAction {
  action: string;
  xAxis?: string;
  yAxes?: string[];
  zAxis?: string | null;
  type?: string;
  title?: string;
  effectId?: string;
  target?: string;
  themeId?: string;
  columns?: string | number;
  category?: string;
  rowCount?: number;
  url?: string;
  interval?: string | number;
  state?: 'on' | 'off' | 'toggle' | boolean | string;
  content?: string;
  bgColor?: string;
  format?: string;
  // Advanced features
  column?: string;
  columnName?: string;
  formula?: string;
  operator?: '>' | '<' | '>=' | '<=' | '==' | '!=' | 'contains' | 'top';
  value?: any;
  displayQuery?: string;
  periods?: number;
  domain?: 'sales' | 'finance' | 'hr' | 'operations' | 'general';
  tabName?: string;
  destinationTab?: string;
  leftDataset?: string;
  rightDataset?: string;
  leftKey?: string;
  rightKey?: string;
  joinType?: 'inner' | 'left' | 'right' | 'full';
  chartType?: string;
  newTitle?: string;
  // Ready-Made Templates & Custom Cards (KPI, Textbox, Sparkline, Gauge, Progress)
  templateId?: string;
  templateCategory?: 'sparkline' | 'kpi' | 'gauge' | 'progress' | 'textbox';
  textboxStyle?: 'gradient' | 'callout' | 'executive' | 'cyber' | 'minimal' | 'quote' | 'alert' | 'sunset' | 'ocean' | 'dark_luxury' | 'notes';
  label?: string;
  subLabel?: string;
  badge?: string;
  currency?: string;
  change?: string;
  changeType?: 'up' | 'down' | 'neutral';
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  kpiCategory?: string;
  color?: string;
  sparklineType?: 'line' | 'bar' | 'winloss';
  dataPoints?: number[];
  subMetrics?: Array<{ label: string; value: string }>;
  aggregation?: 'sum' | 'avg' | 'max' | 'min' | 'count';
  formulaField?: string;
  // Spatial Positioning & Professional Layout Architecture
  top?: number | string;
  left?: number | string;
  width?: number | string;
  height?: number | string;
  zone?: 'header' | 'top' | 'kpi-row' | 'kpi' | 'main-left' | 'main-right' | 'bottom-left' | 'bottom-right' | 'full-width' | 'center';
  // Enterprise BI Capabilities (What-If, Root-Cause, Benchmark, Cross-Filter)
  targetValue?: number;
  priceDeltaPct?: number;
  volumeDeltaPct?: number;
  costDeltaPct?: number;
  discountDeltaPct?: number;
  metricQuery?: string;
  chartId?: string;
  query?: string;
  // Presentation & Kiosk Control Suite
  slideIndex?: number;
  slideQuery?: string;
  duration?: number;
  durationDelta?: number;
  scope?: 'all' | 'current';
  speed?: number;
  layout?: 'side' | 'bottom' | 'minimal' | 'hidden';
  density?: 'detailed' | 'compact';
  theme?: 'dark' | 'light';
  autoPlay?: boolean;
  voice?: boolean;
  narrator?: boolean;
  narratorVoice?: string;
  voiceName?: string;
  narratorPitch?: number;
  pitch?: number;
}

// Global Showdown Converter
declare const showdown: any;
const converter = typeof showdown !== "undefined" ? new showdown.Converter() : null;

// Imports from application stores and chart modules
import { 
  headers, 
  currentDataForChat, 
  saveDashboardSettings, 
  rawData, 
  filteredData,
  createNewDashboard,
  switchDashboard,
  moveChartToDashboard,
  getDashboardsList,
  getActiveDashboardId,
  getCurrentDashboardName
} from "../../store/DataHandler.ts";
import { DatasetStore } from "../data/datasetStore.ts";
import { showMessage, exportExcel, exportCsv, exportPdf } from "../core/utils.ts";
import { addVisualization, clearChart, visualizations, arrangeChartsInGrid, plotAll } from "../charts/charts.ts";
import { createCustomTemplateCard, addTemplateToDashboard, editTemplateCard, applyTemplateFormula, TEMPLATE_REGISTRY } from "../charts/templateCards.ts";
import { setElementPosition, arrangeDashboardProfessionally, designProfessionalDashboard } from "../charts/layoutEngine.ts";
import { applyEffect, chartEffectsTemplates } from "../charts/chartEffects.js";
import { applyChartContainerColor } from "../charts/chartContainerColors.js";
import { triggerMockDataUpdate } from "../data/mockDataGenerator.js";
import { exportDashboardToPDF, exportDashboardToPNG } from "../export/reportExporter.js";
import { startLiveUpdate, stopLiveUpdate, toggleLiveUpdatePause } from "../data/liveDataHandler.ts";
import { createBox } from "../ui/editor.js";
import { generateExecutiveDataStory, attachStoryCardListeners } from "./dataStoryEngine.ts";
import { detectAnomalies, attachAnomalyCardListeners } from "./anomalyDetectionEngine.ts";
import { applyConversationalFilter, parseNaturalLanguageFilter } from "./conversationalFilterEngine.ts";
import { createCalculatedField, parseCalculatedFieldRequest, attachCalculatedFieldListeners } from "./calculatedFieldsEngine.ts";
import { renderLiveMiniPreviewInsideBubble } from "./liveMiniPreview.ts";
import { applyPredictiveForecast, attachForecastCardListeners } from "./forecastEngine.ts";
import { buildIndustryDashboard } from "./templateDashboardBuilder.ts";
import { 
  exportExecutiveReportToPDF, 
  exportExecutiveReportToPPT, 
  renderExecutiveReportCard, 
  attachExecutiveReportListeners 
} from "./executiveReportEngine.ts";
import { buildAutoPilotDashboard } from "./autoPilotDashboardEngine.ts";
import { 
  executeDataCleaning, 
  pendingCleaningProposal, 
  attachDataQualityListeners 
} from "./dataQualityFixer.ts";
import {
  renderFormulaHandbookCard,
  attachFormulaCardListeners,
  smartDetectAndExecuteFormula,
  applyFormulaToCard
} from "./templateFormulaAgentEngine.ts";
import {
  AGENT_FORMULA_CATALOG,
  AGENT_BUSINESS_RULES,
  AGENT_PLATFORM_SPECS,
  renderKnowledgeBaseExplorerCard,
  attachKnowledgeBaseListeners,
  executeDynamicKnowledgeFormula,
  applyKnowledgeCalculationToDashboard,
  searchAgentKnowledgeBase,
  getAgentKnowledgeBasePromptContext
} from "./agentKnowledgeBase.ts";
import {
  renderWhatIfCard,
  attachWhatIfListeners,
  calculateWhatIfScenario
} from "./whatIfSimulatorEngine.ts";
import {
  diagnoseRootCause,
  renderRootCauseCard,
  attachRootCauseListeners
} from "./rootCauseAnalysisEngine.ts";
import {
  enableCrossFiltering,
  disableCrossFiltering,
  toggleCrossFiltering,
  clearCrossFilter,
  isCrossFilteringActive
} from "./crossFilterEngine.ts";
import {
  applyBenchmarkTarget,
  renderBenchmarkCard,
  attachBenchmarkListeners,
  removeBenchmarkTarget
} from "./benchmarkTargetEngine.ts";
import {
  startPresentationMode,
  exitPresentationMode,
  executePresentationCommand,
  getPresentationStatus,
  getIsPresentationActive
} from "./presentationKioskEngine.ts";
import {
  agentMultiTaskManager,
  decomposeUserPrompt
} from "./agentTaskManager.ts";

export interface FocusedChartInfo {
  id: string;
  title: string;
  type?: string;
  xAxis?: string;
  yAxes?: string[];
}

export interface DashboardElementInfo {
  id: string;
  containerId: string;
  category: 'chart' | 'kpi_card' | 'textbox' | 'sparkline' | 'gauge' | 'progress';
  title: string;
  type: string;
  xAxis?: string;
  yAxes?: string[];
  zAxis?: string | null;
  datasetName?: string;
  kpiValue?: string;
  kpiDelta?: string;
}

export interface DashboardInventory {
  totalCount: number;
  chartCount: number;
  kpiCount: number;
  textboxCount?: number;
  templateCount?: number;
  activeTabName: string;
  activeTabId: string;
  elements: DashboardElementInfo[];
}

export interface ActionSnapshot {
  id: string;
  summary: string;
  timestamp: number;
  visualizations: any[];
  actions: AiAction[];
}

// Session Persistence State
const STORAGE_KEY_SESSIONS = "vedra_chat_sessions_v2";
const STORAGE_KEY_ACTIVE_SESSION = "vedra_active_chat_session_id";
const MAX_CONTEXT_TURNS = 10;

let chatSessions: ChatSession[] = [];
let activeSessionId: string = "";
let chatPermissionMode = typeof localStorage !== 'undefined' ? (localStorage.getItem("chatPermissionMode") || "prompt") : "prompt";
let isSpeechRecognitionActive = false;
let speechRecognizer: any = null;
let isSpeechSynthesisActive = false;
let currentUtterance: SpeechSynthesisUtterance | null = null;
let isVoiceResponseEnabled = typeof localStorage !== 'undefined' ? (localStorage.getItem("vedra_voice_response_enabled") === "true") : false;

export function speakMessageText(text: string): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();

  let cleanText = text
    .replace(/```[\s\S]*?```/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/[*_~`#>-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleanText) return;

  const utterance = new SpeechSynthesisUtterance(cleanText);
  const hasHindi = /[\u0900-\u097F]/.test(cleanText);
  utterance.lang = hasHindi ? "hi-IN" : "en-US";
  utterance.rate = 1.0;
  utterance.pitch = 1.0;

  currentUtterance = utterance;
  isSpeechSynthesisActive = true;

  utterance.onend = () => {
    isSpeechSynthesisActive = false;
    currentUtterance = null;
    document.querySelectorAll(".action-icon-btn.speaking").forEach(btn => {
      btn.classList.remove("speaking", "text-danger");
      btn.innerHTML = `<i class="bi bi-volume-up"></i>`;
    });
  };

  utterance.onerror = () => {
    isSpeechSynthesisActive = false;
    currentUtterance = null;
    document.querySelectorAll(".action-icon-btn.speaking").forEach(btn => {
      btn.classList.remove("speaking", "text-danger");
      btn.innerHTML = `<i class="bi bi-volume-up"></i>`;
    });
  };

  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking(): void {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    isSpeechSynthesisActive = false;
    currentUtterance = null;
    document.querySelectorAll(".action-icon-btn.speaking").forEach(btn => {
      btn.classList.remove("speaking", "text-danger");
      btn.innerHTML = `<i class="bi bi-volume-up"></i>`;
    });
  }
}

// Agent Mode State: Context Focus & Undo/Redo Stacks
let activeFocusedChart: FocusedChartInfo | null = null;
export const aiActionUndoStack: ActionSnapshot[] = [];
export const aiActionRedoStack: ActionSnapshot[] = [];

export function getFocusedChart(): FocusedChartInfo | null {
  return activeFocusedChart;
}

export const getFocusedTargetChart = getFocusedChart;

export function setFocusedChart(chart: FocusedChartInfo | null): void {
  activeFocusedChart = chart;

  // Clear previous badges and highlights from containers
  document.querySelectorAll('.visualization-container').forEach((el: Element) => {
    el.classList.remove('ai-focused-chart-card');
    el.querySelector('.ai-focused-chart-badge')?.remove();
  });

  const chip = document.getElementById("chatFocusedChartChip");
  const chipTitle = document.getElementById("chatFocusedChartTitle");
  const chipType = document.getElementById("chatFocusedChartType");

  if (chart && chart.id) {
    const container = document.getElementById(`container-${chart.id}`);
    if (container) {
      container.classList.add('ai-focused-chart-card');
      if (!container.querySelector('.ai-focused-chart-badge')) {
        const badge = document.createElement('div');
        badge.className = 'ai-focused-chart-badge';
        badge.innerHTML = `<i class="bi bi-robot"></i> AI Target`;
        container.appendChild(badge);
      }
    }

    if (chip && chipTitle && chipType) {
      chipTitle.textContent = chart.title || 'Selected Chart';
      chipType.textContent = (chart.type || 'chart').toUpperCase();
      chip.classList.remove('d-none');
    }
  } else {
    if (chip) {
      chip.classList.add('d-none');
    }
  }
}

/**
 * Real-time Dashboard Inventory Aggregator
 * Scans standard charts (visualizations array), KPI cards, and custom canvas containers.
 */
export function getDashboardInventory(): DashboardInventory {
  const elements: DashboardElementInfo[] = [];
  const activeTabId = typeof getActiveDashboardId === "function" ? getActiveDashboardId() : "default";
  const activeTabName = typeof getCurrentDashboardName === "function" ? getCurrentDashboardName() : "Main Dashboard";

  // 1. Add all standard charts and template cards from the visualizations array
  if (Array.isArray(visualizations)) {
    visualizations.forEach((viz) => {
      if (!viz || !viz.id) return;
      const isTemplate = viz.type === "template_card";
      const templateCat = (viz as any).templateCategory;
      const isKpi = viz.type === "kpi_sparkline" || viz.type === "kpi_card" || (isTemplate && templateCat === "kpi");
      const isTextbox = isTemplate && templateCat === "textbox";
      const isSparkline = isTemplate && templateCat === "sparkline";
      const isGauge = isTemplate && templateCat === "gauge";
      const isProgress = isTemplate && templateCat === "progress";

      const category: 'chart' | 'kpi_card' | 'textbox' | 'sparkline' | 'gauge' | 'progress' = 
        isKpi ? 'kpi_card' :
        isTextbox ? 'textbox' :
        isSparkline ? 'sparkline' :
        isGauge ? 'gauge' :
        isProgress ? 'progress' : 'chart';

      const title = viz.title || (viz as any).label || (isKpi ? 'KPI Metric' : isTextbox ? 'Notes Card' : isSparkline ? 'Sparkline Trend' : isGauge ? 'Gauge Meter' : isProgress ? 'Progress Bar' : 'Chart Visualization');
      const val = (viz as any).value !== undefined ? String((viz as any).value) : undefined;
      const delta = (viz as any).change || (viz as any).trendValue || undefined;

      elements.push({
        id: viz.id,
        containerId: `container-${viz.id}`,
        category,
        title,
        type: isTemplate ? `template_${templateCat || 'card'}` : (viz.type || 'chart'),
        xAxis: viz.xAxis,
        yAxes: viz.yAxes,
        zAxis: viz.zAxis,
        kpiValue: val,
        kpiDelta: delta,
        datasetName: (viz as any).datasetSource || undefined
      });
    });
  }

  // 2. Scan DOM for custom KPI cards, sparklines, or templates
  if (typeof document !== "undefined") {
    const kpiElements = document.querySelectorAll('.kpi-card, [id^="kpi-sparkline-"], [class*="kpi-custom-card"], .kpi-sparkline-container, .template-card-container');
    kpiElements.forEach((el, idx) => {
      const container = (el.closest('.visualization-container') || el.closest('[id^="container-"]') || el) as HTMLElement;
      const rawId = el.id || container.id || `kpi-element-${idx}`;
      const cleanId = rawId.replace(/^container-/, '');

      // Avoid duplicate entries if already tracked from visualizations array
      if (elements.some(item => item.id === cleanId || item.containerId === container.id)) {
        return;
      }

      const titleEl = container.querySelector('.kpi-title, .chart-title, h4, h5, h6, .fw-bold, [data-kpi-title]');
      const title = (titleEl?.textContent || '').trim() || `KPI Card ${idx + 1}`;

      const valueEl = container.querySelector('.kpi-value, .display-4, .display-5, .fs-2, [data-kpi-value]');
      const kpiValue = (valueEl?.textContent || '').trim() || undefined;

      const deltaEl = container.querySelector('.kpi-delta, .badge, [data-kpi-delta]');
      const kpiDelta = (deltaEl?.textContent || '').trim() || undefined;

      elements.push({
        id: cleanId,
        containerId: container.id || `container-${cleanId}`,
        category: 'kpi_card',
        title: title,
        type: 'kpi_sparkline',
        kpiValue: kpiValue,
        kpiDelta: kpiDelta
      });
    });

    // 3. Scan DOM for standalone textboxes / note cards
    const textboxes = document.querySelectorAll('.box, .textbox-card');
    textboxes.forEach((el, idx) => {
      const container = (el.closest('.visualization-container') || el.closest('[id^="container-"]') || el) as HTMLElement;
      const rawId = el.id || container.id || `textbox-element-${idx}`;
      const cleanId = rawId.replace(/^container-/, '');
      if (elements.some(item => item.id === cleanId || item.containerId === container.id)) {
        return;
      }
      const textVal = (el.textContent || '').trim().replace(/\s+/g, ' ').substring(0, 45);
      elements.push({
        id: cleanId,
        containerId: container.id || `container-${cleanId}`,
        category: 'textbox',
        title: `Text Note: "${textVal || 'Untitled'}"`,
        type: 'textbox',
        kpiValue: textVal
      });
    });
  }

  const chartCount = elements.filter(e => e.category === 'chart').length;
  const kpiCount = elements.filter(e => e.category === 'kpi_card').length;
  const textboxCount = elements.filter(e => e.category === 'textbox').length;
  const templateCount = elements.filter(e => ['kpi_card', 'textbox', 'sparkline', 'gauge', 'progress'].includes(e.category) || (e.type && e.type.startsWith('template_'))).length;

  return {
    totalCount: elements.length,
    chartCount,
    kpiCount,
    textboxCount,
    templateCount,
    activeTabName,
    activeTabId,
    elements
  };
}

// ============================================================================
// 1. Session Management
// ============================================================================

export function loadSessions(): ChatSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SESSIONS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        chatSessions = parsed;
        const savedActiveId = localStorage.getItem(STORAGE_KEY_ACTIVE_SESSION);
        if (savedActiveId && chatSessions.some(s => s.id === savedActiveId)) {
          activeSessionId = savedActiveId;
        } else {
          activeSessionId = chatSessions[0].id;
        }
        return chatSessions;
      }
    }
  } catch (err) {
    console.warn("[Chat] Failed to parse saved chat sessions:", err);
  }

  // Create initial default session
  const defaultSession: ChatSession = {
    id: `session_${Date.now()}`,
    title: "New Analysis Session",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    messages: []
  };
  chatSessions = [defaultSession];
  activeSessionId = defaultSession.id;
  saveSessions();
  return chatSessions;
}

export function saveSessions(): void {
  try {
    localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(chatSessions));
    localStorage.setItem(STORAGE_KEY_ACTIVE_SESSION, activeSessionId);
  } catch (err) {
    console.warn("[Chat] Error saving sessions to localStorage:", err);
  }
}

export function getActiveSession(): ChatSession {
  if (!activeSessionId || !chatSessions.some(s => s.id === activeSessionId)) {
    if (chatSessions.length === 0) {
      loadSessions();
    } else {
      activeSessionId = chatSessions[0].id;
    }
  }
  return chatSessions.find(s => s.id === activeSessionId) || chatSessions[0];
}

export function createNewSession(initialTitle: string = "New Analysis Session"): ChatSession {
  const newSession: ChatSession = {
    id: `session_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    title: initialTitle,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    messages: []
  };
  chatSessions.unshift(newSession);
  activeSessionId = newSession.id;
  saveSessions();
  renderSessionsList();
  renderActiveSessionHistory();
  updateChatHeaderTitle();

  const chatInput = document.getElementById("chatInput") as HTMLTextAreaElement | null;
  if (chatInput) {
    chatInput.value = "";
    chatInput.focus();
    updateCharCounter();
  }
  return newSession;
}

export function switchSession(sessionId: string): void {
  if (!chatSessions.some(s => s.id === sessionId)) return;
  activeSessionId = sessionId;
  saveSessions();
  renderSessionsList();
  renderActiveSessionHistory();
  updateChatHeaderTitle();
}

export function deleteSession(sessionId: string, e?: Event): void {
  if (e) e.stopPropagation();
  if (chatSessions.length <= 1) {
    // Reset the only session rather than leaving an empty list
    chatSessions[0].messages = [];
    chatSessions[0].title = "New Analysis Session";
    chatSessions[0].updatedAt = Date.now();
    saveSessions();
    renderSessionsList();
    renderActiveSessionHistory();
    updateChatHeaderTitle();
    showMessage("Conversation cleared.", "info");
    return;
  }

  const idx = chatSessions.findIndex(s => s.id === sessionId);
  if (idx !== -1) {
    chatSessions.splice(idx, 1);
    if (activeSessionId === sessionId) {
      activeSessionId = chatSessions[0].id;
    }
    saveSessions();
    renderSessionsList();
    renderActiveSessionHistory();
    updateChatHeaderTitle();
    showMessage("Session deleted.", "info");
  }
}

export function updateChatHeaderTitle(): void {
  const titleEl = document.getElementById("currentChatSessionTitle");
  if (titleEl) {
    const session = getActiveSession();
    titleEl.textContent = session ? session.title : "Data Analysis Assistant";
  }
}

export function updateDatasetContextBadge(): void {
  const badgeEl = document.getElementById("chatDatasetContextText");
  if (!badgeEl) return;
  
  const rowCount = (currentDataForChat && currentDataForChat.length) || 0;
  const colCount = (headers && headers.length) || 0;

  if (rowCount > 0 && colCount > 0) {
    badgeEl.textContent = `${rowCount.toLocaleString()} rows • ${colCount} columns`;
    badgeEl.title = `Dataset active with ${colCount} headers: ${headers.join(", ")}`;
  } else {
    badgeEl.textContent = "No dataset loaded";
    badgeEl.title = "Import CSV/Excel or load sample data to analyze";
  }
}

export function renderSessionsList(filterQuery: string = ""): void {
  const listContainer = document.getElementById("chatSessionsList");
  if (!listContainer) return;

  const query = filterQuery.trim().toLowerCase();
  const filtered = chatSessions.filter(s => {
    if (!query) return true;
    return s.title.toLowerCase().includes(query) ||
           s.messages.some(m => m.message.toLowerCase().includes(query));
  });

  if (filtered.length === 0) {
    listContainer.innerHTML = `
      <div class="chat-sessions-empty text-center py-4 px-2 text-muted small">
        <i class="bi bi-search fs-5 d-block mb-1 opacity-50"></i>
        <span>No matching chats found</span>
      </div>
    `;
    return;
  }

  listContainer.innerHTML = "";
  filtered.forEach(session => {
    const item = document.createElement("div");
    const isActive = session.id === activeSessionId;
    item.className = `chat-session-item ${isActive ? 'active' : ''}`;
    item.setAttribute("role", "button");
    item.setAttribute("tabindex", "0");
    item.dataset.sessionId = session.id;

    // Relative formatted date
    const dateStr = formatRelativeTime(session.updatedAt);
    const msgCount = session.messages.length;

    item.innerHTML = `
      <div class="chat-session-item-icon">
        <i class="bi ${isActive ? 'bi-chat-left-dots-fill text-primary' : 'bi-chat-left-text text-muted'}"></i>
      </div>
      <div class="chat-session-item-body">
        <div class="chat-session-item-title" title="${escapeHtml(session.title)}">${escapeHtml(session.title)}</div>
        <div class="chat-session-item-sub">
          <span>${msgCount} messages</span>
          <span class="dot-separator">•</span>
          <span>${dateStr}</span>
        </div>
      </div>
      <button class="chat-session-item-delete" title="Delete conversation" aria-label="Delete conversation">
        <i class="bi bi-trash3"></i>
      </button>
    `;

    item.addEventListener("click", () => switchSession(session.id));
    const delBtn = item.querySelector(".chat-session-item-delete");
    if (delBtn) {
      delBtn.addEventListener("click", (e) => deleteSession(session.id, e));
    }

    listContainer.appendChild(item);
  });
}

function formatRelativeTime(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// ============================================================================
// 2. Chat Rendering & History
// ============================================================================

export function scrollChatToBottom(forceImmediate = false): void {
  const body = document.querySelector(".chat-popup-body") as HTMLElement | null;
  const history = document.getElementById("chatHistory") as HTMLElement | null;
  
  const doScroll = () => {
    if (body) {
      body.scrollTop = body.scrollHeight;
    }
    if (history) {
      history.scrollTop = history.scrollHeight;
    }
  };

  doScroll();
  if (!forceImmediate) {
    requestAnimationFrame(() => {
      doScroll();
      setTimeout(doScroll, 40);
      setTimeout(doScroll, 120);
    });
  }
}

export function renderActiveSessionHistory(): void {
  const chatHistoryDiv = document.getElementById("chatHistory");
  if (!chatHistoryDiv) return;

  const session = getActiveSession();
  chatHistoryDiv.innerHTML = "";

  if (!session || session.messages.length === 0) {
    // Render clean welcome screen with quick prompt cards
    const welcome = document.createElement("div");
    welcome.className = "chat-empty-welcome";
    welcome.id = "chatWelcomeScreen";
    welcome.innerHTML = `
      <div class="chat-welcome-avatar">
        <i class="bi bi-robot"></i>
      </div>
      <h3 class="chat-welcome-title">How can I assist your analysis today?</h3>
      <p class="chat-welcome-subtitle">Ask questions about your uploaded dataset, generate instant charts, or explore deeper data patterns.</p>
      
      <div class="chat-welcome-prompts-grid">
        <button type="button" class="chat-quick-prompt-btn" data-prompt="Generate an interactive chart visualizing the highest values and distribution in my dataset">
          <div class="quick-prompt-icon"><i class="bi bi-bar-chart-line-fill text-blue-500"></i></div>
          <div class="quick-prompt-text">
            <span class="quick-prompt-label">Create Visual Chart</span>
            <span class="quick-prompt-desc">Plot key categories and comparisons</span>
          </div>
        </button>
        <button type="button" class="chat-quick-prompt-btn" data-prompt="Provide a comprehensive statistical summary with key metrics, averages, and totals">
          <div class="quick-prompt-icon"><i class="bi bi-calculator-fill text-emerald-500"></i></div>
          <div class="quick-prompt-text">
            <span class="quick-prompt-label">Executive Summary</span>
            <span class="quick-prompt-desc">Totals, averages, and distributions</span>
          </div>
        </button>
        <button type="button" class="chat-quick-prompt-btn" data-prompt="Analyze this dataset for any anomalies, missing values, or unusual outliers">
          <div class="quick-prompt-icon"><i class="bi bi-search-heart-fill text-rose-500"></i></div>
          <div class="quick-prompt-text">
            <span class="quick-prompt-label">Find Anomalies</span>
            <span class="quick-prompt-desc">Detect data quality outliers & spikes</span>
          </div>
        </button>
        <button type="button" class="chat-quick-prompt-btn" data-prompt="Give me 3 actionable strategic recommendations derived from this data">
          <div class="quick-prompt-icon"><i class="bi bi-lightbulb-fill text-amber-500"></i></div>
          <div class="quick-prompt-text">
            <span class="quick-prompt-label">Strategic Insights</span>
            <span class="quick-prompt-desc">Actionable business takeaways</span>
          </div>
        </button>
      </div>
    `;
    chatHistoryDiv.appendChild(welcome);
    bindQuickPromptButtons();
    return;
  }

  // Render all messages from history
  session.messages.forEach(msg => {
    appendMessageElement(msg.message, msg.type, false, false);
  });

  scrollChatToBottom();
}

export function bindQuickPromptButtons(): void {
  const quickBtns = document.querySelectorAll(".chat-quick-prompt-btn");
  quickBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const prompt = btn.getAttribute("data-prompt");
      if (prompt) {
        const chatInput = document.getElementById("chatInput") as HTMLTextAreaElement | null;
        if (chatInput) {
          chatInput.value = prompt;
          updateCharCounter();
        }
        sendChatMessage(prompt);
      }
    });
  });
}

export function appendMessageElement(message: string, type: "user" | "assistant", animateTypewriter = false, saveToSession = true): HTMLElement | null {
  const chatHistoryDiv = document.getElementById("chatHistory");
  if (!chatHistoryDiv) return null;

  // Remove welcome screen if present
  const welcomeScreen = document.getElementById("chatWelcomeScreen");
  if (welcomeScreen) {
    welcomeScreen.remove();
  }

  const row = document.createElement("div");
  row.className = `chat-row ${type}-row`;

  const avatar = document.createElement("div");
  if (type === "user") {
    avatar.className = "chat-avatar user-avatar";
    avatar.innerHTML = `<i class="bi bi-person-fill"></i>`;
  } else {
    avatar.className = "chat-avatar bot-avatar";
    avatar.innerHTML = `<i class="bi bi-robot"></i>`;
  }

  const container = document.createElement("div");
  container.className = "chat-message-container";

  const messageElement = document.createElement("div");
  messageElement.className = `chat-message-bubble ${type}`;

  const finalHtml = converter ? converter.makeHtml(message) : message;

  if (animateTypewriter && type === "assistant") {
    typeHTML(messageElement, finalHtml, 4, () => {
      addMessageControls(container, messageElement, message, type);
    });
  } else {
    messageElement.innerHTML = finalHtml;
    addMessageControls(container, messageElement, message, type);
  }

  container.appendChild(messageElement);
  row.appendChild(avatar);
  row.appendChild(container);

  chatHistoryDiv.appendChild(row);
  scrollChatToBottom();

  if (type === "assistant" && isVoiceResponseEnabled) {
    speakMessageText(message);
  }

  if (saveToSession) {
    const session = getActiveSession();
    session.messages.push({
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type,
      message,
      timestamp: Date.now()
    });
    session.updatedAt = Date.now();

    // Auto-update session title from first user message
    if (session.messages.length === 1 && type === "user") {
      const shortTitle = message.length > 32 ? message.substring(0, 32).trim() + "..." : message;
      session.title = shortTitle;
      updateChatHeaderTitle();
    }

    saveSessions();
    renderSessionsList();
  }

  return row;
}

function addMessageControls(container: HTMLElement, _messageElement: HTMLElement, messageText: string, type: string): void {
  // Check if controls already exist
  if (container.querySelector(".message-actions-bar")) return;

  const controlsDiv = document.createElement("div");
  controlsDiv.className = `message-actions-bar ${type}-actions`;

  if (type === "user") {
    // Edit Button
    const btnEdit = document.createElement("button");
    btnEdit.className = "action-icon-btn";
    btnEdit.innerHTML = `<i class="bi bi-pencil-square"></i>`;
    btnEdit.title = "Edit message";
    btnEdit.addEventListener("click", () => {
      const chatInput = document.getElementById("chatInput") as HTMLTextAreaElement | null;
      if (chatInput) {
        chatInput.value = messageText;
        chatInput.focus();
        updateCharCounter();
      }
    });

    // Copy Button
    const btnCopy = document.createElement("button");
    btnCopy.className = "action-icon-btn";
    btnCopy.innerHTML = `<i class="bi bi-clipboard"></i>`;
    btnCopy.title = "Copy message";
    btnCopy.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(messageText);
        showMessage("Message copied to clipboard.", "success");
      } catch (err) {
        console.error(err);
      }
    });

    // Pin to Dashboard Notes Card Button
    const btnPost = document.createElement("button");
    btnPost.className = "action-icon-btn";
    btnPost.innerHTML = `<i class="bi bi-pin-angle-fill"></i>`;
    btnPost.title = "Add as Notes Card on Dashboard";
    btnPost.addEventListener("click", () => {
      const x = 160 + Math.random() * 80;
      const y = 160 + Math.random() * 80;
      createBox(x, y, 0, `<p>${escapeHtml(messageText)}</p>`, "#fff3cd", "slide-in-up");
      showMessage("Notes card created on dashboard.", "success");
    });

    controlsDiv.appendChild(btnEdit);
    controlsDiv.appendChild(btnCopy);
    controlsDiv.appendChild(btnPost);

  } else if (type === "assistant") {
    // Regenerate Response Button
    const btnRefresh = document.createElement("button");
    btnRefresh.className = "action-icon-btn";
    btnRefresh.innerHTML = `<i class="bi bi-arrow-clockwise"></i>`;
    btnRefresh.title = "Regenerate response";
    btnRefresh.addEventListener("click", () => {
      const session = getActiveSession();
      let prevUserMessage = "";
      for (let i = session.messages.length - 1; i >= 0; i--) {
        if (session.messages[i].type === "user") {
          prevUserMessage = session.messages[i].message;
          break;
        }
      }
      if (prevUserMessage) {
        sendChatMessage(prevUserMessage);
      } else {
        showMessage("No previous user prompt found.", "warning");
      }
    });

    // Copy Response Button
    const btnCopy = document.createElement("button");
    btnCopy.className = "action-icon-btn";
    btnCopy.innerHTML = `<i class="bi bi-clipboard"></i>`;
    btnCopy.title = "Copy response";
    btnCopy.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(messageText);
        showMessage("Response copied to clipboard.", "success");
      } catch (err) {
        console.error(err);
      }
    });

    // Pin to Dashboard Notes Card Button
    const btnPost = document.createElement("button");
    btnPost.className = "action-icon-btn";
    btnPost.innerHTML = `<i class="bi bi-pin-angle-fill"></i>`;
    btnPost.title = "Pin response to Dashboard";
    btnPost.addEventListener("click", () => {
      const x = 160 + Math.random() * 80;
      const y = 160 + Math.random() * 80;
      const safeContent = converter ? converter.makeHtml(messageText) : `<p>${escapeHtml(messageText)}</p>`;
      createBox(x, y, 0, safeContent, "#cfe2ff", "slide-in-up");
      showMessage("Response pinned to dashboard.", "success");
    });

    // Speak message aloud button
    const btnSpeak = document.createElement("button");
    btnSpeak.className = "action-icon-btn";
    btnSpeak.innerHTML = `<i class="bi bi-volume-up"></i>`;
    btnSpeak.title = "Read aloud / आवाज़ में सुनें";
    btnSpeak.addEventListener("click", () => {
      if (btnSpeak.classList.contains("speaking")) {
        stopSpeaking();
      } else {
        stopSpeaking();
        btnSpeak.classList.add("speaking", "text-danger");
        btnSpeak.innerHTML = `<i class="bi bi-stop-circle-fill"></i>`;
        speakMessageText(messageText);
      }
    });

    controlsDiv.appendChild(btnRefresh);
    controlsDiv.appendChild(btnCopy);
    controlsDiv.appendChild(btnPost);
    controlsDiv.appendChild(btnSpeak);
  }

  container.appendChild(controlsDiv);
}

function typeHTML(element: HTMLElement, html: string, speed = 4, onComplete?: () => void): void {
  const tokenRegex = /(<[^>]+>|[^<]+)/g;
  const tokens = html.match(tokenRegex) || [];
  let currentTokenIndex = 0;
  let currentHTML = "";

  element.innerHTML = "";

  function typeNextToken() {
    if (currentTokenIndex >= tokens.length) {
      if (onComplete) {
        onComplete();
        scrollChatToBottom();
      }
      return;
    }

    const token = tokens[currentTokenIndex];
    if (token.startsWith("<")) {
      currentHTML += token;
      element.innerHTML = currentHTML;
      currentTokenIndex++;
      typeNextToken();
    } else {
      let charIndex = 0;
      function typeChar() {
        if (charIndex >= token.length) {
          currentTokenIndex++;
          setTimeout(typeNextToken, speed);
          return;
        }
        const chunkLength = token.length - charIndex > 3 ? 3 : token.length - charIndex;
        currentHTML += token.substr(charIndex, chunkLength);
        element.innerHTML = currentHTML;
        charIndex += chunkLength;
        
        scrollChatToBottom(true);
        
        setTimeout(typeChar, speed);
      }
      typeChar();
    }
  }

  typeNextToken();
}

function showLoadingIndicator(): HTMLElement | null {
  const chatHistoryDiv = document.getElementById("chatHistory");
  if (!chatHistoryDiv) return null;

  const row = document.createElement("div");
  row.className = "chat-row assistant-row";
  row.id = "chatLoadingIndicatorRow";

  row.innerHTML = `
    <div class="chat-avatar bot-avatar">
      <i class="bi bi-robot"></i>
    </div>
    <div class="chat-message-container">
      <div class="chat-message-bubble assistant" id="loadingMessage">
        <div class="d-flex align-items-center gap-2">
          <div class="typing-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <span class="text-muted small">Analyzing data...</span>
        </div>
      </div>
    </div>
  `;

  chatHistoryDiv.appendChild(row);
  scrollChatToBottom();
  return row;
}

function removeLoadingIndicator(): void {
  const row = document.getElementById("chatLoadingIndicatorRow");
  if (row) row.remove();
}

export function formatStreamingMarkdown(rawText: string): string {
  // Strip out raw json-actions or json-chart blocks so user sees clean conversational guidance
  let cleaned = rawText
    .replace(/```json-actions[\s\S]*?```/g, "")
    .replace(/```json-chart[\s\S]*?```/g, "")
    .trim();

  if (!cleaned && (rawText.includes("```json-actions") || rawText.includes("```json-chart"))) {
    cleaned = "_डैशबोर्ड क्रियाएँ तैयार की जा रही हैं... (Preparing requested dashboard actions...)_";
  }

  return converter ? converter.makeHtml(cleaned) : escapeHtml(cleaned);
}

export function createAssistantStreamingRow(): { row: HTMLElement; bubble: HTMLElement; container: HTMLElement } {
  const chatHistoryDiv = document.getElementById("chatHistory");
  const welcomeScreen = document.getElementById("chatWelcomeScreen");
  if (welcomeScreen) {
    welcomeScreen.remove();
  }

  const row = document.createElement("div");
  row.className = "chat-row assistant-row";

  const avatar = document.createElement("div");
  avatar.className = "chat-avatar bot-avatar";
  avatar.innerHTML = `<i class="bi bi-robot"></i>`;

  const container = document.createElement("div");
  container.className = "chat-message-container";

  const bubble = document.createElement("div");
  bubble.className = "chat-message-bubble assistant";
  bubble.innerHTML = `<span class="streaming-cursor"></span>`;

  container.appendChild(bubble);
  row.appendChild(avatar);
  row.appendChild(container);

  if (chatHistoryDiv) {
    chatHistoryDiv.appendChild(row);
    scrollChatToBottom();
  }

  return { row, bubble, container };
}

// ============================================================================
// 3. AI Messaging & Actions
// ============================================================================

export async function sendChatMessage(overrideText?: string): Promise<void> {
  const chatInput = document.getElementById("chatInput") as HTMLTextAreaElement | null;
  const userMessage = overrideText !== undefined ? overrideText.trim() : (chatInput ? chatInput.value.trim() : "");

  if (!userMessage) return;

  // Clear input and reset height
  if (chatInput && overrideText === undefined) {
    chatInput.value = "";
    chatInput.style.height = "auto";
    updateCharCounter();
  }

  // Append user message
  appendMessageElement(userMessage, "user", false, true);

  // Fast-track AI Calculated Field requests (e.g. "Sales - Cost = Profit", "Profit = Sales - Cost")
  const directCalcRequest = parseCalculatedFieldRequest(userMessage);
  if (directCalcRequest) {
    const assistantMsg = `I have parsed your request to create the AI Calculated Field **[${directCalcRequest.columnName}]** with formula \`${directCalcRequest.formula}\`. Please review the temporary live thumbnail below before confirming execution:`;
    const row = appendMessageElement(assistantMsg, "assistant", false, true);
    const bubble = row?.querySelector(".chat-message-bubble") as HTMLElement | null;
    if (bubble) {
      const calcAction: AiAction = {
        action: "calculate-column",
        columnName: directCalcRequest.columnName,
        formula: directCalcRequest.formula
      };
      renderLiveMiniPreviewInsideBubble(bubble, {
        action: calcAction,
        previewId: `calc_${Date.now()}`,
        onConfirm: async () => {
          await executeAiActions([calcAction], row);
        },
        onCancel: () => {
          appendMessageElement("AI Calculated Field creation was cancelled.", "assistant", false, true);
        }
      });
      scrollChatToBottom();
    }
    return;
  }

  // Fast-track Smart Dashboard Auto-Pilot
  if (/सेल्स\s*डेटा.*डैशबोर्ड|प्रोफेशनल.*डैशबोर्ड|एक्जीक्यूटिव.*डैशबोर्ड|ऑटो\s*डैशबोर्ड|auto[-\s]?pilot|executive\s+dashboard|smart\s+dashboard|build.*executive.*dashboard/i.test(userMessage)) {
    const loadingRow = appendMessageElement("⚡ **स्मार्ट डैशबोर्ड ऑटो-पायलट सक्रिय...** डेटा का विश्लेषण करके सर्वोत्तम चार्ट्स, 4 KPI कार्ड्स और लेआउट तैयार किया जा रहा है...", "assistant", false, true);
    scrollChatToBottom();
    try {
      const res = await buildAutoPilotDashboard({ userPrompt: userMessage });
      const successHtml = `
        <div class="p-3 bg-indigo-50 border border-indigo-200 rounded-3 mb-2" style="border-left: 4px solid #4f46e5 !important;">
          <div class="d-flex align-items-center gap-2 mb-2">
            <span class="badge bg-indigo-600 text-white p-1 rounded"><i class="bi bi-speedometer2"></i></span>
            <strong class="text-indigo-950 text-xs">प्रोफेशनल एक्जीक्यूटिव डैशबोर्ड तैयार! (${res.executionTimeMs}ms)</strong>
          </div>
          <p class="text-slate-700 text-2xs mb-2">
            डेटा का गहराई से विश्लेषण करके <strong>${res.kpisCreated} मुख्य KPI कार्ड्स</strong> और <strong>${res.chartsCreated} समन्वित चार्ट्स (Bar, Line, Pie, Comparison)</strong> गोल्डन-रेशियो लेआउट में लगा दिए गए हैं।
          </p>
          <div class="d-flex flex-wrap gap-2 pt-1 border-top">
            <button class="btn btn-xs btn-primary d-flex align-items-center gap-1 btn-fast-export-pdf">
              <i class="bi bi-file-earmark-pdf"></i> 1-Click PDF रिपोर्ट
            </button>
            <button class="btn btn-xs btn-outline-danger d-flex align-items-center gap-1 btn-fast-export-ppt">
              <i class="bi bi-file-earmark-ppt"></i> 1-Click PPTX रिपोर्ट
            </button>
            <button class="btn btn-xs btn-outline-secondary d-flex align-items-center gap-1 btn-fast-undo ms-auto">
              <i class="bi bi-arrow-counterclockwise"></i> पूर्ववत करें (Undo)
            </button>
          </div>
        </div>
      `;
      if (loadingRow) {
        const bubble = loadingRow.querySelector('.chat-message-bubble');
        if (bubble) bubble.innerHTML = successHtml;
        loadingRow.querySelector('.btn-fast-export-pdf')?.addEventListener('click', () => exportExecutiveReportToPDF());
        loadingRow.querySelector('.btn-fast-export-ppt')?.addEventListener('click', () => exportExecutiveReportToPPT());
        loadingRow.querySelector('.btn-fast-undo')?.addEventListener('click', async () => {
          await undoAiAction();
          showMessage("डैशबोर्ड पूर्ववत कर दिया गया।", "info");
        });
      }
    } catch (e: any) {
      appendMessageElement(`डैशबोर्ड निर्माण में त्रुटि: ${e?.message || e}`, "assistant", false, true);
    }
    return;
  }

  // Fast-track One-Click Executive Report Export (PDF/PPT)
  if (/एक्जीक्यूटिव\s*रिपोर्ट|executive\s+report|report\s+to\s+pdf|report\s+to\s+ppt|pdf\s*रिपोर्ट|ppt\s*रिपोर्ट|मीटिंग\s*रिपोर्ट|meeting\s+report|बोर्ड\s*रिपोर्ट|board\s+report|डाउनलोड.*रिपोर्ट/i.test(userMessage)) {
    const isPpt = /ppt|powerpoint|स्लाइड/i.test(userMessage);
    const isPdf = /pdf|पीडीएफ/i.test(userMessage);

    if (isPpt && !isPdf) {
      appendMessageElement("📊 **PowerPoint (.pptx) रिपोर्ट एक्सपोर्ट हो रही है...** 4-स्लाइड एक्जीक्यूटिव डेक तैयार किया जा रहा है...", "assistant", false, true);
      await exportExecutiveReportToPPT();
      return;
    } else if (isPdf && !isPpt) {
      appendMessageElement("📄 **1-पेज एक्जीक्यूटिव PDF रिपोर्ट तैयार हो रही है...** मुख्य निष्कर्ष, KPI ग्रिड एवं रणनीतिक सुझाव संकलित किए जा रहे हैं...", "assistant", false, true);
      await exportExecutiveReportToPDF();
      return;
    } else {
      const card = renderExecutiveReportCard();
      const row = appendMessageElement(card.html, "assistant", false, true);
      if (row) {
        attachExecutiveReportListeners(row);
      }
      return;
    }
  }

  // Fast-track Data Quality Cleaning & Confirmation
  const isConfirmingClean = pendingCleaningProposal && /^(हाँ|haan|yes|yep|sure|clean|clean\s*it|saaf\s*karo|कर\s*दो|साफ\s*करो|हटा\s*दो|करो|ok|okay)/i.test(userMessage.trim());
  const isDirectCleanCmd = /डेटा\s*साफ|clean\s*data|data\s*cleaning|remove\s*duplicates|डुप्लिकेट|खाली\s*सेल्स|fix\s*null|fix\s*data\s*quality/i.test(userMessage);

  if (isConfirmingClean || isDirectCleanCmd) {
    appendMessageElement("🧹 **डेटा क्लीनिंग प्रक्रिया आरंभ की जा रही है...** डुप्लिकेट्स हटाए जा रहे हैं और रिक्त सेल्स को औसत/मोड मान से भरा जा रहा है...", "assistant", false, true);
    await executeDataCleaning();
    return;
  }

  // Fast-track Learning Menu / Formal Agent Knowledge Base
  if (/नॉलेज\s*बेस|knowledge[-\s]?base|लर्निंग.*फॉर्मूल|लर्निंग.*मेनू|learning.*formula|formule.*sikhayo|formula.*handbook|रेडी.*मेड.*फॉर्मूला|ready.*made.*formula|show.*formula|फॉर्मूला.*मेनू|फॉर्मूला.*हैंडबुक|formula.*list|फार्मूला.*लिस्ट|बिजनेस.*लॉजिक|business.*logic|15.*(फॉर्मूल|formula)/i.test(userMessage) && !/sum|avg|max|min|growth|diff|percent|status|if|latest|top|format|insert/i.test(userMessage)) {
    const card = renderKnowledgeBaseExplorerCard('', 'hi');
    const row = appendMessageElement(card.html, "assistant", false, true);
    if (row) {
      attachKnowledgeBaseListeners(row);
    }
    scrollChatToBottom();
    return;
  }

  // Fast-track Autonomous Multi-Tasking & Prompt Decomposition
  const isMultiTaskCommand = /multi[-\s]?task|मल्टीटास्क|मल्टी\s*टास्किंग|task\s*by\s*task|टास्क\s*बाय\s*टास्क|task\s*me\s*divide|टास्क\s*में\s*डिवाइड|divide.*task|step\s*by\s*step.*(task|pura)|decompose/i.test(userMessage);
  const isExplicitMultiStepNumbered = /(?:^|\s|\n)(?:1[\.\)]|step\s*1).*?(?:2[\.\)]|step\s*2)/is.test(userMessage);

  if (isMultiTaskCommand || isExplicitMultiStepNumbered) {
    const plan = decomposeUserPrompt(userMessage);
    if (plan.tasks.length > 0) {
      agentMultiTaskManager.registerPlan(plan);
      const introHtml = `
        <div class="p-2.5 bg-indigo-50 border border-indigo-200 rounded-3 mb-2" style="border-left: 4px solid #6366f1 !important;">
          <div class="d-flex align-items-center gap-2 mb-1.5">
            <span class="badge bg-indigo-600 text-white p-1 rounded"><i class="bi bi-cpu-fill"></i></span>
            <strong class="text-indigo-950 text-xs">ऑटोनॉमस मल्टीटास्किंग व प्रॉम्प्ट डीकंपोजिशन इंजन सक्रिय!</strong>
            <span class="badge bg-indigo-100 text-indigo-800 text-3xs font-semibold ms-auto">${plan.tasks.length} Sub-Tasks Plan</span>
          </div>
          <p class="text-slate-700 text-2xs mb-1">
            प्रॉम्प्ट को <strong>${plan.tasks.length} सुसंगत कार्यों</strong> में विभाजित कर लिया गया है। यह एजेंट स्वतंत्र कार्यों को मल्टीटास्किंग मोड (समानांतर / Parallel) में और निर्भर कार्यों को अनुक्रमिक रूप से लाइव स्टीपर द्वारा पूरा करेगा।
          </p>
        </div>
      `;
      const row = appendMessageElement(introHtml, "assistant", false, true);
      scrollChatToBottom();
      await agentMultiTaskManager.executePlan(plan, { targetRow: row });
      return;
    }
  }

  // Fast-track Smart Template Formula Execution
  const isDirectFormula = userMessage.trim().startsWith('=') || /=([A-Z]+)\s*\([^)]+\)/i.test(userMessage);
  const isFormulaCommand = /(फॉर्मूला.*लगाओ|formula.*apply|apply.*formula|टेम्पलेट.*फॉर्मूला|कार्ड.*फॉर्मूला|सम.*फॉर्मूला|ग्रोथ.*फॉर्मूला|फॉर्मूला\s*डालो)/i.test(userMessage);
  if (isDirectFormula || isFormulaCommand) {
    const formulaRes = await smartDetectAndExecuteFormula(userMessage);
    if (formulaRes && formulaRes.success) {
      const respHtml = `
        <div class="p-2.5 bg-emerald-50 border border-emerald-200 rounded-3 mb-2" style="border-left: 4px solid #10b981 !important;">
          <div class="d-flex align-items-center gap-2 mb-1.5">
            <span class="badge bg-emerald-600 text-white p-1 rounded"><i class="bi bi-check-circle-fill"></i></span>
            <strong class="text-emerald-950 text-xs">${formulaRes.actionTaken === 'created_new' ? 'नया रेडी-मेड टेम्पलेट कार्ड तैयार!' : 'टेम्पलेट कार्ड अपडेट हुआ!'}</strong>
            <span class="badge bg-emerald-100 text-emerald-800 text-3xs font-monospace ms-auto">${escapeHtml(formulaRes.formula)}</span>
          </div>
          <p class="text-slate-700 text-2xs mb-2">
            ${formulaRes.message}
          </p>
          <div class="d-flex align-items-center justify-content-between pt-1 border-top">
            <span class="text-3xs text-secondary"><i class="bi bi-clock-history"></i> लाइव गणना सक्रिय (Direction: R)</span>
            <button class="btn btn-2xs btn-outline-secondary d-flex align-items-center gap-1 btn-fast-formula-undo">
              <i class="bi bi-arrow-counterclockwise"></i> पूर्ववत करें (Undo)
            </button>
          </div>
        </div>
      `;
      const row = appendMessageElement(respHtml, "assistant", false, true);
      if (row) {
        row.querySelector('.btn-fast-formula-undo')?.addEventListener('click', async () => {
          await undoAiAction();
          showMessage("फॉर्मूला परिवर्तन पूर्ववत कर दिया गया।", "info");
        });
      }
      scrollChatToBottom();
      return;
    }
  }

  // 1. Fast-track What-If Simulation
  if (/what[-\s]?if|सिमुलेटर|परिदृश्य|अगर.*(बढ़|घट|लागत|कीमत|प्रॉफिट|सेल्स)|अगर\s*कॉस्ट|simulate/i.test(userMessage)) {
    let priceDelta = 0;
    let volumeDelta = 0;
    let costDelta = 0;
    let discountDelta = 0;

    const costMatch = userMessage.match(/कॉस्ट\s*(\d+)%?\s*(बढ़|घट)|cost\s*(\+|\-)?(\d+)%/i);
    if (costMatch) {
      const val = parseInt(costMatch[1] || costMatch[4] || '0', 10);
      const isDec = /घट|minus|-/i.test(costMatch[0]);
      costDelta = isDec ? -val : val;
    }

    const priceMatch = userMessage.match(/(कीमत|मूल्य|प्राइस|price)\s*(\d+)%?\s*(बढ़|घट)|price\s*(\+|\-)?(\d+)%/i);
    if (priceMatch) {
      const val = parseInt(priceMatch[2] || priceMatch[5] || '0', 10);
      const isDec = /घट|minus|-/i.test(priceMatch[0]);
      priceDelta = isDec ? -val : val;
    }

    const volMatch = userMessage.match(/(सेल्स|बिक्री|वॉल्यूम|volume|demand)\s*(\d+)%?\s*(बढ़|घट)|volume\s*(\+|\-)?(\d+)%/i);
    if (volMatch) {
      const val = parseInt(volMatch[2] || volMatch[5] || '0', 10);
      const isDec = /घट|minus|-/i.test(volMatch[0]);
      volumeDelta = isDec ? -val : val;
    }

    const card = renderWhatIfCard({ priceDeltaPct: priceDelta, volumeDeltaPct: volumeDelta, costDeltaPct: costDelta, discountDeltaPct: discountDelta });
    const row = appendMessageElement(card.html, "assistant", false, true);
    if (row) attachWhatIfListeners(row);
    scrollChatToBottom();
    return;
  }

  // 2. Fast-track Root-Cause Diagnostics ('Why' Analysis)
  if (/root[-\s]?cause|रूट[-\s]?कॉज़|गिरावट.*(कारण|क्यों)|बिक्री.*क्यों|why\s*did|कारण.*(खोजो|बताओ)|डायग्नोस्टिक|decline\s*reason/i.test(userMessage)) {
    const diagnosis = diagnoseRootCause(userMessage);
    const card = renderRootCauseCard(diagnosis);
    const row = appendMessageElement(card.html, "assistant", false, true);
    if (row) attachRootCauseListeners(row);
    scrollChatToBottom();
    return;
  }

  // 3. Fast-track Cross-Filtering
  if (/cross[-\s]?filter|क्रॉस[-\s]?फ़िल्टर|चार्ट्स.*(आपस\s*में\s*लिंक|जोड़ो)|लिंक.*चार्ट|enable\s*cross/i.test(userMessage)) {
    enableCrossFiltering();
    const row = appendMessageElement(`
      <div class="p-2.5 bg-indigo-50 border border-indigo-200 rounded-3 mb-2" style="border-left: 4px solid #6366f1 !important;">
        <div class="d-flex align-items-center gap-2 mb-1">
          <span class="badge bg-indigo-600 text-white p-1 rounded"><i class="bi bi-funnel-fill"></i></span>
          <strong class="text-indigo-950 text-xs">इंटरएक्टिव क्रॉस-फ़िल्टरिंग सक्रिय (Cross-Filtering Enabled)</strong>
        </div>
        <p class="text-slate-700 text-2xs mb-1.5">
          डैशबोर्ड के सभी चार्ट्स अब आपस में डायनामिकली लिंक हो चुके हैं! किसी भी बार, पाई स्लाइस या डेटा पॉइंट पर क्लिक करें — पूरा डैशबोर्ड उसी सेगमेंट पर स्वतः फ़िल्टर हो जाएगा।
        </p>
        <div class="d-flex gap-2 pt-1 border-top">
          <button class="btn btn-2xs btn-outline-danger btn-cross-filter-disable">निष्क्रिय करें (Disable)</button>
          <button class="btn btn-2xs btn-outline-secondary btn-cross-filter-clear">फ़िल्टर साफ़ करें</button>
        </div>
      </div>
    `, "assistant", false, true);
    if (row) {
      row.querySelector('.btn-cross-filter-disable')?.addEventListener('click', () => disableCrossFiltering());
      row.querySelector('.btn-cross-filter-clear')?.addEventListener('click', () => clearCrossFilter());
    }
    scrollChatToBottom();
    return;
  }

  // 4. Fast-track Target Benchmark Line
  if (/target.*(line|लाइन|लक्ष्य)|benchmark|बेंचमार्क|टार्गेट.*लाइन|गोल.*लाइन/i.test(userMessage)) {
    const numMatch = userMessage.match(/(\d[\d,]*(\.\d+)?)\s*(लाख|करोड़|k|m|lakh|cr)?/i);
    let targetVal = 500000;
    if (numMatch) {
      let rawNum = parseFloat(numMatch[1].replace(/,/g, ''));
      const unit = (numMatch[3] || '').toLowerCase();
      if (unit === 'लाख' || unit === 'lakh') rawNum *= 100000;
      else if (unit === 'करोड़' || unit === 'cr') rawNum *= 10000000;
      else if (unit === 'k') rawNum *= 1000;
      else if (unit === 'm') rawNum *= 1000000;
      targetVal = rawNum;
    }

    const res = await applyBenchmarkTarget({ targetValue: targetVal });
    const card = renderBenchmarkCard(res);
    const row = appendMessageElement(card.html, "assistant", false, true);
    if (row) attachBenchmarkListeners(row);
    scrollChatToBottom();
    return;
  }

  // 5. Fast-track Board Meeting Presentation Mode with Smart AI Summary
  if (/board\s*meeting|presentation|प्रेजेंटेशन|बोर्ड\s*मीटिंग|कियोस्क|kiosk\s*mode|start\s*presentation|presentation\s*summary/i.test(userMessage)) {
    startPresentationMode();
    appendMessageElement("🚀 **प्रोडक्शन-लेवल बोर्ड मीटिंग प्रेजेंटेशन मोड आरंभ!**\nप्रत्येक चार्ट, KPI कार्ड और टेक्स्ट बॉक्स के लिए **स्मार्ट AI सारांश (Executive Synthesis, Key Signals, Talking Points & Recommendations)** के साथ प्रेजेंटेशन लोड हो गई है।\n• नेविगेट करने के लिए **Arrow Keys (← / →)** दबाएं\n• ऑटो-प्ले के लिए **Spacebar** दबाएं\n• वॉइस कमेंट्री हेतु **'वॉइस' बटन** पर क्लिक करें।", "assistant", false, true);
    scrollChatToBottom();
    return;
  }

  // Show loading indicator
  showLoadingIndicator();

  // Prepare context history
  const session = getActiveSession();
  const contextMessages = session.messages.slice(-MAX_CONTEXT_TURNS * 2).map(m => ({
    role: m.type === "user" ? "user" : "model",
    content: m.message
  }));

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: userMessage,
        history: contextMessages,
        headers: headers || [],
        dataSample: currentDataForChat ? currentDataForChat.slice(0, 50) : [],
        focusedChart: activeFocusedChart,
        dashboardInventory: getDashboardInventory(),
        presentationStatus: typeof getPresentationStatus === 'function' ? getPresentationStatus() : null,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Server returned HTTP ${response.status}: ${errorBody}`);
    }

    const contentType = response.headers.get("content-type") || "";

    // 1. Real-time Token Streaming Handler
    if (contentType.includes("text/event-stream") && response.body) {
      removeLoadingIndicator();
      const streamCtx = createAssistantStreamingRow();
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullAssistantText = "";
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;

            try {
              const data = JSON.parse(trimmed.replace(/^data:\s*/, ""));
              if (data.chunk) {
                fullAssistantText += data.chunk;
                const formattedHtml = formatStreamingMarkdown(fullAssistantText);
                streamCtx.bubble.innerHTML = formattedHtml + `<span class="streaming-cursor"></span>`;
                scrollChatToBottom(true);
              }
              if (data.done && data.fullText && !fullAssistantText) {
                fullAssistantText = data.fullText;
              }
            } catch (jsonErr) {
              // Ignore non-json or incomplete chunk lines
            }
          }
        }
      } catch (streamReadErr) {
        console.warn("[Chat] Streaming read warning:", streamReadErr);
      }

      // Finalize streaming bubble
      if (!fullAssistantText.trim()) {
        fullAssistantText = "I have processed your request. How else can I assist you with your dashboard?";
      }
      const finalHtml = formatStreamingMarkdown(fullAssistantText);
      streamCtx.bubble.innerHTML = finalHtml;
      addMessageControls(streamCtx.container, streamCtx.bubble, fullAssistantText, "assistant");

      // Save to active session
      session.messages.push({
        id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        type: "assistant",
        message: fullAssistantText,
        timestamp: Date.now()
      });
      session.updatedAt = Date.now();
      saveSessions();
      renderSessionsList();

      // Trigger action validation, live preview prompt, or autonomous execution
      await checkForAndRenderAiChart(fullAssistantText, streamCtx.row);
      return;
    }

    // 2. Standard JSON Fallback
    const result = await response.json();
    const aiReply = result.reply || "I couldn't generate a response. Please check your data or try again.";

    removeLoadingIndicator();
    const row = appendMessageElement(aiReply, "assistant", true, true);

    // Parse and trigger automatic actions or charts if included in reply
    if (row) {
      await checkForAndRenderAiChart(aiReply, row);
    }

  } catch (error: any) {
    removeLoadingIndicator();
    console.log("[Chat] Client fallback engine active:", error?.message || error);

    // Provide graceful autonomous local client fallback
    const fallback = generateClientFallbackReply(
      userMessage,
      headers || [],
      activeFocusedChart,
      getDashboardInventory()
    );

    const row = appendMessageElement(fallback.reply, "assistant", true, true);
    session.messages.push({
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type: "assistant",
      message: fallback.reply,
      timestamp: Date.now()
    });
    session.updatedAt = Date.now();
    saveSessions();
    renderSessionsList();

    if (row) {
      await checkForAndRenderAiChart(fallback.reply, row);
    }
  }
}

/**
 * Autonomous Client-Side Fallback Engine when server or network is momentarily unavailable.
 */
function generateClientFallbackReply(
  message: string,
  headers: string[],
  focusedChart?: any,
  dashboardInventory?: any
): { reply: string } {
  const msgLower = (message || "").toLowerCase();
  let reply = "";
  let actions: any[] = [];

  // 0. Presentation & Board Meeting Kiosk Suite Control
  const isPresKeyword = msgLower.includes("presentation") || 
    msgLower.includes("slideshow") || 
    msgLower.includes("slide") || 
    msgLower.includes("स्लाइड") || 
    msgLower.includes("प्रेजेंटेशन") || 
    msgLower.includes("kiosk") ||
    msgLower.includes("board meeting");

  if (isPresKeyword || (getIsPresentationActive && getIsPresentationActive())) {
    // Navigation: Next
    if (msgLower.includes("next") || msgLower.includes("forward") || msgLower.includes("अगली") || msgLower.includes("आगे")) {
      reply = "Advancing to the next presentation slide.";
      actions.push({ action: "presentation-next" });
      return { reply: `${reply}\n\n\`\`\`json-actions\n${JSON.stringify(actions, null, 2)}\n\`\`\`` };
    }
    // Navigation: Prev
    if (msgLower.includes("prev") || msgLower.includes("previous") || msgLower.includes("back") || msgLower.includes("पिछली") || msgLower.includes("पीछे")) {
      reply = "Returning to the previous presentation slide.";
      actions.push({ action: "presentation-prev" });
      return { reply: `${reply}\n\n\`\`\`json-actions\n${JSON.stringify(actions, null, 2)}\n\`\`\`` };
    }
    // Navigation: Go to slide number or query
    const slideMatch = msgLower.match(/slide\s*(?:number|no|#)?\s*(\d+)/i) || msgLower.match(/स्लाइड\s*(\d+)/);
    if (slideMatch && slideMatch[1]) {
      const idx = parseInt(slideMatch[1], 10);
      reply = `Navigating directly to slide ${idx}.`;
      actions.push({ action: "presentation-goto-slide", slideIndex: idx });
      return { reply: `${reply}\n\n\`\`\`json-actions\n${JSON.stringify(actions, null, 2)}\n\`\`\`` };
    }
    // Layout change
    if (msgLower.includes("layout") || msgLower.includes("लेआउट")) {
      if (msgLower.includes("side") || msgLower.includes("split")) {
        reply = "Setting presentation layout to Split-Screen (Visual on left, Briefing on right).";
        actions.push({ action: "presentation-set-layout", layout: "side" });
      } else if (msgLower.includes("bottom") || msgLower.includes("shelf") || msgLower.includes("नीचे")) {
        reply = "Setting presentation layout to Bottom Shelf.";
        actions.push({ action: "presentation-set-layout", layout: "bottom" });
      } else if (msgLower.includes("minimal") || msgLower.includes("hud")) {
        reply = "Setting presentation layout to Minimal HUD mode.";
        actions.push({ action: "presentation-set-layout", layout: "minimal" });
      } else if (msgLower.includes("hidden") || msgLower.includes("hide") || msgLower.includes("छिपाओ")) {
        reply = "Setting presentation layout to Stage Only (Hidden Briefing).";
        actions.push({ action: "presentation-set-layout", layout: "hidden" });
      } else {
        reply = "Cycling presentation layout.";
        actions.push({ action: "presentation-cycle-layout" });
      }
      return { reply: `${reply}\n\n\`\`\`json-actions\n${JSON.stringify(actions, null, 2)}\n\`\`\`` };
    }
    // Speed multiplier
    if (msgLower.includes("speed") || msgLower.includes("स्पीड") || msgLower.includes("रफ़्तार")) {
      const speedMatch = msgLower.match(/(0\.\d+|1\.\d+|2(?:\.0)?|\d+)x?/i);
      const spd = speedMatch ? parseFloat(speedMatch[1]) : 1.5;
      reply = `Setting AI summary reading speed multiplier to ${spd}x.`;
      actions.push({ action: "presentation-set-speed", speed: spd });
      return { reply: `${reply}\n\n\`\`\`json-actions\n${JSON.stringify(actions, null, 2)}\n\`\`\`` };
    }
    // Duration
    if (msgLower.includes("duration") || msgLower.includes("समय") || msgLower.includes("second") || msgLower.includes("sec") || msgLower.includes("सेकंड")) {
      const durMatch = msgLower.match(/(\d+)\s*(?:s|sec|second|सेकंड)/i);
      const dur = durMatch ? parseInt(durMatch[1], 10) : 15;
      const scope = msgLower.includes("this") || msgLower.includes("current") || msgLower.includes("इस") ? "current" : "all";
      reply = `Setting slide duration to ${dur} seconds (${scope === 'current' ? 'active slide' : 'all slides'}).`;
      actions.push({ action: "presentation-set-duration", duration: dur, scope });
      return { reply: `${reply}\n\n\`\`\`json-actions\n${JSON.stringify(actions, null, 2)}\n\`\`\`` };
    }
    // Theme
    if (msgLower.includes("theme") || msgLower.includes("थीम") || msgLower.includes("dark") || msgLower.includes("light")) {
      const theme = msgLower.includes("light") ? "light" : "dark";
      reply = `Switching presentation theme to ${theme}.`;
      actions.push({ action: "presentation-set-theme", theme });
      return { reply: `${reply}\n\n\`\`\`json-actions\n${JSON.stringify(actions, null, 2)}\n\`\`\`` };
    }
    // Density
    if (msgLower.includes("density") || msgLower.includes("compact") || msgLower.includes("detailed") || msgLower.includes("छोटा") || msgLower.includes("बड़ा")) {
      const density = msgLower.includes("compact") ? "compact" : "detailed";
      reply = `Setting AI summary density to ${density}.`;
      actions.push({ action: "presentation-set-density", density });
      return { reply: `${reply}\n\n\`\`\`json-actions\n${JSON.stringify(actions, null, 2)}\n\`\`\`` };
    }
    // Voice
    if (msgLower.includes("voice") || msgLower.includes("बोल") || msgLower.includes("आवाज़") || msgLower.includes("narration") || msgLower.includes("audio")) {
      const state = (msgLower.includes("off") || msgLower.includes("mute") || msgLower.includes("disable") || msgLower.includes("बंद")) ? "off" : "on";
      reply = `${state === "on" ? "Enabling" : "Disabling"} voice speech narration for presentation slides.`;
      actions.push({ action: "presentation-set-voice", state });
      return { reply: `${reply}\n\n\`\`\`json-actions\n${JSON.stringify(actions, null, 2)}\n\`\`\`` };
    }
    // Laser
    if (msgLower.includes("laser") || msgLower.includes("लेज़र") || msgLower.includes("pointer")) {
      const state = (msgLower.includes("off") || msgLower.includes("disable") || msgLower.includes("बंद")) ? "off" : "on";
      reply = `${state === "on" ? "Activating" : "Deactivating"} laser pointer on presentation canvas.`;
      actions.push({ action: "presentation-set-laser", state });
      return { reply: `${reply}\n\n\`\`\`json-actions\n${JSON.stringify(actions, null, 2)}\n\`\`\`` };
    }
    // Pen & Drawing
    if (msgLower.includes("pen") || msgLower.includes("पेन") || msgLower.includes("draw") || msgLower.includes("erase") || msgLower.includes("clear annotation")) {
      if (msgLower.includes("clear") || msgLower.includes("erase") || msgLower.includes("हटाओ") || msgLower.includes("साफ")) {
        reply = "Clearing all drawings and annotations from the active slide.";
        actions.push({ action: "presentation-clear-annotations" });
      } else {
        const state = (msgLower.includes("off") || msgLower.includes("बंद")) ? "off" : "on";
        reply = `${state === "on" ? "Enabling" : "Disabling"} presentation pen drawing tool.`;
        actions.push({ action: "presentation-set-pen", state });
      }
      return { reply: `${reply}\n\n\`\`\`json-actions\n${JSON.stringify(actions, null, 2)}\n\`\`\`` };
    }
    // Auto-advance
    if (msgLower.includes("auto-advance") || msgLower.includes("advance") || msgLower.includes("auto advance")) {
      const state = (msgLower.includes("off") || msgLower.includes("disable") || msgLower.includes("बंद")) ? "off" : "on";
      reply = `${state === "on" ? "Enabling" : "Disabling"} automatic slide advance after AI summary reading.`;
      actions.push({ action: "presentation-set-auto-advance", state });
      return { reply: `${reply}\n\n\`\`\`json-actions\n${JSON.stringify(actions, null, 2)}\n\`\`\`` };
    }
    // Play / Pause
    if (msgLower.includes("play") || msgLower.includes("pause") || msgLower.includes("resume") || msgLower.includes("रोक") || msgLower.includes("चलाओ")) {
      if (msgLower.includes("pause") || msgLower.includes("रोक")) {
        reply = "Pausing presentation auto-play.";
        actions.push({ action: "presentation-pause" });
      } else {
        reply = "Resuming presentation auto-play.";
        actions.push({ action: "presentation-play" });
      }
      return { reply: `${reply}\n\n\`\`\`json-actions\n${JSON.stringify(actions, null, 2)}\n\`\`\`` };
    }
    // Settings modal
    if (msgLower.includes("setting") || msgLower.includes("सेटिंग") || msgLower.includes("config")) {
      reply = "Opening presentation configuration panel.";
      actions.push({ action: "presentation-open-settings" });
      return { reply: `${reply}\n\n\`\`\`json-actions\n${JSON.stringify(actions, null, 2)}\n\`\`\`` };
    }
    // Exit presentation
    if (msgLower.includes("exit") || msgLower.includes("close") || msgLower.includes("stop") || msgLower.includes("बंद")) {
      reply = "Exiting presentation mode.";
      actions.push({ action: "exit-presentation" });
      return { reply: `${reply}\n\n\`\`\`json-actions\n${JSON.stringify(actions, null, 2)}\n\`\`\`` };
    }
    // Start presentation
    if (msgLower.includes("start") || msgLower.includes("launch") || msgLower.includes("open") || msgLower.includes("शुरू")) {
      reply = "Launching Fullscreen Presentation Mode for your executive board meeting.";
      actions.push({ action: "start-presentation" });
      return { reply: `${reply}\n\n\`\`\`json-actions\n${JSON.stringify(actions, null, 2)}\n\`\`\`` };
    }
  }

  // 1. Textbox position or creation
  const isTextboxQuery = (msgLower.includes("textbox") || msgLower.includes("text box") || msgLower.includes("text bo") || msgLower.includes("नोट्स") || msgLower.includes("text")) &&
    (msgLower.includes("position") || msgLower.includes("posisiton") || msgLower.includes("स्थिति") || msgLower.includes("जगह") || msgLower.includes("set") || msgLower.includes("top") || msgLower.includes("header") || msgLower.includes("रखो") || msgLower.includes("khid") || msgLower.includes("khud"));

  if (isTextboxQuery) {
    reply = `✨ **Autonomous Textbox Positioning Engine (Direct Mode):**\n\nI have configured the precise spatial coordinates for the **Executive Textbox** card:\n\n• 📍 **Target Zone**: \`Header Horizon\` (Top Tier of Executive Dashboard)\n• 📏 **Coordinates**: Top: 15px, Left: 15px, Width: calc(100% - 30px), Height: 110px\n• 🔒 **Position Locking**: Coordinates are locked into dashboard configuration so the card stays in its designated header position across all screen sizes.\n\nPosition has been applied and saved!`;
    actions.push({
      action: "create-textbox",
      textboxStyle: "gradient",
      label: "Executive Strategic Overview",
      badge: "Strategy Memo",
      content: "Real-time enterprise dashboard observations and key operational performance summary.",
      subLabel: "Live Workspace Sync",
      top: 15,
      left: 15,
      width: "calc(100% - 30px)",
      height: 110,
      zone: "header"
    });
    actions.push({
      action: "set-element-position",
      target: "textbox",
      zone: "header",
      top: 15,
      left: 15,
      width: "calc(100% - 30px)",
      height: 110
    });
    return { reply: `${reply}\n\n\`\`\`json-actions\n${JSON.stringify(actions, null, 2)}\n\`\`\`` };
  }

  // 2. Arrange dashboard or layout
  const isLayoutQuery = ["layout", "grid", "ग्रिड", "कॉलम", "लेआउट", "arrange", "professional", "गोल्डन", "golden", "बनाओ", "design"].some(kw => msgLower.includes(kw));
  if (isLayoutQuery) {
    reply = `✨ **Executive Professional Layout Engine (Direct Mode):**\n\nI have organized the dashboard elements according to Executive BI Visual Hierarchy:\n\n• 🔝 **Top Zone (y: 15px)**: Executive Strategic Header Textbox (Width: 100%)\n• 💎 **Top Tier (y: 140px)**: KPI Metric Cards & Velocity Sparklines placed side-by-side\n• 📈 **Middle Tier (y: 355px)**: Core Analytical Visuals in a balanced 2-column grid\n• 🎯 **Bottom Tier (y: 775px)**: Distribution Visuals (Donut Share, Radar & Scatter)\n\nAll elements have been snapped to their zones and saved!`;
    actions.push({ action: "arrange-dashboard-professionally" });
    return { reply: `${reply}\n\n\`\`\`json-actions\n${JSON.stringify(actions, null, 2)}\n\`\`\`` };
  }

  // 3. Template card creation / formulas
  const isTemplateQuery = ["template", "टेम्पलेट", "kpi", "gauge", "sparkline", "progress", "formula", "फार्मूला"].some(kw => msgLower.includes(kw));
  if (isTemplateQuery) {
    const numCol = (headers || []).find(h => !h.toLowerCase().includes("id") && !h.toLowerCase().includes("date") && !h.toLowerCase().includes("name")) || (headers && headers[0]) || "Value";
    const cat = msgLower.includes("gauge") ? "gauge" : msgLower.includes("sparkline") ? "sparkline" : msgLower.includes("progress") ? "progress" : "kpi";
    reply = `✨ **Autonomous Ready-Made Template Engine (Direct Mode):**\n\nI have generated and linked an executive ${cat.toUpperCase()} template card with dynamic formula calculation for column **${numCol}**:\n\n• 📊 **Aggregation Formula**: \`SUM(${numCol})\`\n• 🎯 **Format**: Executive Metric with Live Delta Tracker\n• 📌 **Positioning**: Executive Horizon`;
    actions.push({
      action: "create-custom-template-card",
      category: cat,
      column: numCol,
      aggregation: "sum",
      label: `${numCol} Overview`,
      targetMetric: 100000
    });
    return { reply: `${reply}\n\n\`\`\`json-actions\n${JSON.stringify(actions, null, 2)}\n\`\`\`` };
  }

  // 4. Chart creation
  const isChartQuery = ["chart", "graph", "ग्राफ", "चार्ट", "plot"].some(kw => msgLower.includes(kw));
  if (isChartQuery && headers && headers.length >= 2) {
    const xCol = headers[0];
    const yCol = headers[1];
    const chartType = msgLower.includes("line") ? "line" : msgLower.includes("pie") ? "pie" : msgLower.includes("scatter") ? "scatter" : "bar";
    reply = `✨ **Autonomous Chart Synthesis (Direct Mode):**\n\nI have generated a **${chartType.toUpperCase()} Chart** analyzing **${yCol}** by **${xCol}** with optimized high-contrast styling and executive tooltips.`;
    actions.push({
      action: "create-chart",
      type: chartType,
      title: `${yCol} by ${xCol}`,
      xAxis: xCol,
      yAxes: [yCol]
    });
    return { reply: `${reply}\n\n\`\`\`json-actions\n${JSON.stringify(actions, null, 2)}\n\`\`\`` };
  }

  // 5. Default conversational reply
  reply = `✨ **Autonomous BI Assistant Active:**\n\nI am ready to assist you with complete dashboard automation:\n• **Layout & Textbox**: Ask me to "Arrange dashboard professionally" or "Set textbox position".\n• **Ready-Made Templates**: Create KPI cards, momentum sparklines, gauge meters, and formula integrations.\n• **High-Performance Visualizations**: Build high-speed analytical charts from your dataset.\n\nHow would you like to proceed?`;
  return { reply };
}

export function clearChatHistory(): void {
  const session = getActiveSession();
  session.messages = [];
  session.updatedAt = Date.now();
  saveSessions();
  renderActiveSessionHistory();
  renderSessionsList();
  showMessage("Active chat history cleared.", "info");
}

export function exportCurrentSession(): void {
  const session = getActiveSession();
  if (!session || session.messages.length === 0) {
    showMessage("No messages in the active session to export.", "warning");
    return;
  }

  let md = `# ${session.title}\n`;
  md += `*Generated by Vedra BI Assistant on ${new Date().toLocaleString()}*\n\n`;
  md += `---\n\n`;

  session.messages.forEach(msg => {
    const role = msg.type === "user" ? "User" : "Assistant";
    const time = new Date(msg.timestamp).toLocaleTimeString();
    md += `### ${role} (${time})\n\n${msg.message}\n\n---\n\n`;
  });

  const blob = new Blob([md], { type: "text/markdown;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${session.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_report.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showMessage("Conversation exported as Markdown report.", "success");
}

// ============================================================================
// 4. Dynamic Actions Execution Engine & Preview/Undo System
// ============================================================================

export function generateActionPreviewCardHtml(act: AiAction): string {
  if (act.action === "create-chart") {
    const chartType = (act.type || "bar").toLowerCase();
    const chartTitle = escapeHtml(act.title || "AI Chart Preview");
    const xAxis = escapeHtml(act.xAxis || "X");
    const yAxes = (act.yAxes || []).map(y => escapeHtml(y)).join(", ");

    let svgPreview = "";
    if (chartType === "line" || chartType === "spline" || chartType === "area") {
      svgPreview = `
        <svg viewBox="0 0 240 70" class="w-100" style="height: 64px; overflow: visible;">
          <defs>
            <linearGradient id="prevGradLine" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#6366f1" stop-opacity="0.35"/>
              <stop offset="100%" stop-color="#6366f1" stop-opacity="0.0"/>
            </linearGradient>
          </defs>
          <line x1="15" y1="60" x2="225" y2="60" stroke="#e2e8f0" stroke-width="1"/>
          <line x1="15" y1="35" x2="225" y2="35" stroke="#f1f5f9" stroke-width="1" stroke-dasharray="3,3"/>
          <path d="M 20 50 Q 55 12, 90 38 T 160 18 T 220 30 L 220 60 L 20 60 Z" fill="url(#prevGradLine)"/>
          <path d="M 20 50 Q 55 12, 90 38 T 160 18 T 220 30" fill="none" stroke="#4f46e5" stroke-width="2.5" stroke-linecap="round"/>
          <circle cx="20" cy="50" r="3.5" fill="#4f46e5" stroke="#fff" stroke-width="1.5"/>
          <circle cx="90" cy="38" r="3.5" fill="#4f46e5" stroke="#fff" stroke-width="1.5"/>
          <circle cx="160" cy="18" r="3.5" fill="#4f46e5" stroke="#fff" stroke-width="1.5"/>
          <circle cx="220" cy="30" r="3.5" fill="#4f46e5" stroke="#fff" stroke-width="1.5"/>
        </svg>
      `;
    } else if (chartType === "pie" || chartType === "donut") {
      svgPreview = `
        <div class="d-flex align-items-center justify-content-center py-1">
          <svg viewBox="0 0 100 100" style="width: 60px; height: 60px; transform: rotate(-90deg);">
            <circle cx="50" cy="50" r="35" fill="transparent" stroke="#6366f1" stroke-width="18" stroke-dasharray="85 135" stroke-dashoffset="0"/>
            <circle cx="50" cy="50" r="35" fill="transparent" stroke="#10b981" stroke-width="18" stroke-dasharray="60 160" stroke-dashoffset="-85"/>
            <circle cx="50" cy="50" r="35" fill="transparent" stroke="#f59e0b" stroke-width="18" stroke-dasharray="75 145" stroke-dashoffset="-145"/>
          </svg>
        </div>
      `;
    } else if (chartType === "scatter") {
      svgPreview = `
        <svg viewBox="0 0 240 70" class="w-100" style="height: 64px;">
          <line x1="15" y1="60" x2="225" y2="60" stroke="#e2e8f0" stroke-width="1"/>
          <circle cx="45" cy="40" r="5.5" fill="#6366f1" opacity="0.85"/>
          <circle cx="85" cy="22" r="7" fill="#3b82f6" opacity="0.85"/>
          <circle cx="125" cy="50" r="6" fill="#10b981" opacity="0.85"/>
          <circle cx="165" cy="28" r="8" fill="#f59e0b" opacity="0.85"/>
          <circle cx="205" cy="18" r="5" fill="#ec4899" opacity="0.85"/>
        </svg>
      `;
    } else {
      // Default: Bar / Column
      svgPreview = `
        <svg viewBox="0 0 240 70" class="w-100" style="height: 64px;">
          <line x1="15" y1="60" x2="225" y2="60" stroke="#e2e8f0" stroke-width="1"/>
          <rect x="30" y="24" width="26" height="36" rx="3" fill="#6366f1"/>
          <rect x="70" y="12" width="26" height="48" rx="3" fill="#3b82f6"/>
          <rect x="110" y="32" width="26" height="28" rx="3" fill="#06b6d4"/>
          <rect x="150" y="16" width="26" height="44" rx="3" fill="#10b981"/>
          <rect x="190" y="38" width="26" height="22" rx="3" fill="#f59e0b"/>
        </svg>
      `;
    }

    return `
      <div class="ai-live-preview-card p-2.5 rounded-3 bg-white border shadow-xs mb-2">
        <div class="d-flex align-items-center justify-content-between mb-1.5 pb-1 border-bottom">
          <span class="fw-bold text-slate-800 text-xs text-truncate" style="max-width: 180px;">
            <i class="bi bi-graph-up text-primary me-1"></i>${chartTitle}
          </span>
          <span class="badge bg-indigo-50 text-indigo-700 border border-indigo-200 text-3xs fw-bold px-1.5 py-0.5 rounded-pill">
            ${chartType.toUpperCase()}
          </span>
        </div>
        ${svgPreview}
        <div class="d-flex flex-wrap gap-1 mt-1.5 pt-1 border-top" style="font-size: 10px;">
          <span class="badge bg-light text-secondary border px-1.5 py-0.5">
            <i class="bi bi-arrow-left-right text-primary me-1"></i>X: <strong>${xAxis}</strong>
          </span>
          <span class="badge bg-light text-secondary border px-1.5 py-0.5">
            <i class="bi bi-arrow-down-up text-success me-1"></i>Y: <strong>${yAxes}</strong>
          </span>
        </div>
      </div>
    `;
  }

  if (act.action === "change-layout") {
    const cols = parseInt(String(act.columns || 2), 10);
    const colBoxes = Array.from({ length: cols }).map(() => `
      <div class="flex-grow-1 bg-white border border-dashed rounded p-1 text-center" style="height: 38px;">
        <div class="bg-indigo-100 rounded mb-1 mx-auto" style="height: 5px; width: 60%;"></div>
        <div class="bg-slate-200 rounded mx-auto" style="height: 14px; width: 80%;"></div>
      </div>
    `).join("");

    return `
      <div class="ai-live-preview-card p-2.5 rounded-3 bg-slate-50 border shadow-xs mb-2">
        <div class="d-flex align-items-center justify-content-between mb-2">
          <span class="fw-bold text-slate-800 text-xs">
            <i class="bi bi-grid-3x3-gap-fill text-warning me-1"></i> Grid Re-arrangement
          </span>
          <span class="badge bg-warning text-dark text-3xs fw-bold px-1.5 py-0.5 rounded-pill">
            ${cols} Columns
          </span>
        </div>
        <div class="d-flex gap-1.5 w-100 p-1 bg-slate-200 rounded">
          ${colBoxes}
        </div>
      </div>
    `;
  }

  if (act.action === "change-theme") {
    const themeId = act.themeId || "ocean-gradient";
    const target = act.target || "all";
    return `
      <div class="ai-live-preview-card p-2.5 rounded-3 bg-slate-50 border shadow-xs mb-2">
        <div class="d-flex align-items-center justify-content-between mb-2">
          <span class="fw-bold text-slate-800 text-xs">
            <i class="bi bi-paint-bucket text-info me-1"></i> Theme: <strong>${escapeHtml(themeId)}</strong>
          </span>
          <span class="badge bg-info text-white text-3xs px-1.5 py-0.5 rounded-pill">Target: ${target}</span>
        </div>
        <div class="p-2 rounded border shadow-xs d-flex align-items-center justify-content-between" style="background: linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%);">
          <div class="d-flex align-items-center gap-2">
            <div class="rounded-circle bg-indigo-500" style="width: 12px; height: 12px;"></div>
            <span class="text-xs fw-bold text-slate-800">Theme Card Mockup</span>
          </div>
          <span class="badge bg-white text-dark border text-3xs">Preview</span>
        </div>
      </div>
    `;
  }

  if (act.action === "clear-dashboard") {
    const count = visualizations.length;
    return `
      <div class="ai-live-preview-card p-2.5 rounded-3 bg-red-50 border border-red-200 shadow-xs mb-2">
        <div class="d-flex align-items-center gap-2 text-danger">
          <i class="bi bi-exclamation-triangle-fill fs-5"></i>
          <div>
            <div class="fw-bold text-xs">Reset Dashboard Warning</div>
            <div class="text-2xs text-muted">All ${count} active visualization card(s) will be cleared.</div>
          </div>
        </div>
      </div>
    `;
  }

  if (act.action === "create-textbox") {
    const isStyled = !!(act.textboxStyle || (act as any).style || act.label);
    const styleName = act.textboxStyle || (act as any).style || 'Executive Note';
    const titleText = escapeHtml(act.label || act.title || (isStyled ? 'Ready-Made Textbox' : 'Notes Card'));
    return `
      <div class="ai-live-preview-card p-2.5 rounded-3 border shadow-xs mb-2" style="background-color: ${act.bgColor || (isStyled ? '#f8fafc' : '#fff3cd')};">
        <div class="d-flex align-items-center justify-content-between mb-1">
          <span class="fw-bold text-dark text-xs"><i class="bi ${isStyled ? 'bi-card-heading text-primary' : 'bi-sticky-fill text-warning'} me-1"></i> ${titleText}</span>
          ${isStyled ? `<span class="badge bg-indigo-100 text-indigo-700 text-3xs text-uppercase">${escapeHtml(styleName)}</span>` : ''}
        </div>
        <div class="text-dark small text-truncate" style="max-height: 40px; font-size: 11px;">
          ${escapeHtml(act.content || act.value || 'Notes content')}
        </div>
      </div>
    `;
  }

  if (act.action === "create-template-card" || act.action === "add-template-card" || act.action === "create-kpi-card" || act.action === "create-sparkline" || act.action === "create-gauge" || act.action === "create-progress") {
    const cat = act.category || act.templateCategory || (act.action === "create-kpi-card" ? 'kpi' : act.action === "create-sparkline" ? 'sparkline' : act.action === "create-gauge" ? 'gauge' : act.action === "create-progress" ? 'progress' : 'kpi');
    const title = escapeHtml(act.label || act.title || (act.column ? `${act.column} Metric` : 'Ready-Made Card'));
    const val = escapeHtml(String(act.value !== undefined ? act.value : (act.column ? `Calc: ${act.column} (${act.aggregation || 'sum'})` : '₹48,52,430')));
    const badge = escapeHtml(act.badge || act.kpiCategory || act.textboxStyle || 'Template Gallery');
    const icon = cat === 'textbox' ? 'bi-card-heading text-indigo-600' :
                 cat === 'sparkline' ? 'bi-activity text-emerald-600' :
                 cat === 'gauge' ? 'bi-speedometer2 text-blue-600' :
                 cat === 'progress' ? 'bi-bar-chart-steps text-teal-600' :
                 'bi-graph-up-arrow text-primary';
    const bg = cat === 'textbox' ? '#eef2ff' :
               cat === 'sparkline' ? '#ecfdf5' :
               cat === 'gauge' ? '#eff6ff' :
               cat === 'progress' ? '#f0fdfa' : '#faf5ff';
    const border = cat === 'textbox' ? '#c7d2fe' :
                   cat === 'sparkline' ? '#a7f3d0' :
                   cat === 'gauge' ? '#bfdbfe' :
                   cat === 'progress' ? '#99f6e4' : '#e9d5ff';

    return `
      <div class="ai-live-preview-card p-2.5 rounded-3 border shadow-xs mb-2" style="background: ${bg}; border-color: ${border} !important;">
        <div class="d-flex align-items-center justify-content-between mb-1">
          <span class="fw-bold text-slate-800 text-xs"><i class="bi ${icon} me-1"></i> ${title}</span>
          <span class="badge bg-white text-slate-700 border text-3xs text-uppercase">${badge} • ${cat.toUpperCase()}</span>
        </div>
        <div class="d-flex align-items-center justify-content-between mt-1">
          <span class="fw-bold fs-6 text-slate-900">${val}</span>
          ${act.trendValue ? `<span class="badge bg-emerald-100 text-emerald-800 text-3xs font-monospace">${escapeHtml(act.trendValue)}</span>` : ''}
        </div>
        ${act.subLabel ? `<div class="text-muted small mt-0.5" style="font-size: 10px;">${escapeHtml(act.subLabel)}</div>` : ''}
        ${act.formula ? `<div class="mt-1 d-flex align-items-center gap-1"><span class="badge bg-indigo-600 text-white font-monospace text-3xs">ƒ(x) Formula</span><code class="text-xs text-indigo-700 bg-white px-1.5 py-0.5 rounded border border-indigo-200 font-monospace">${escapeHtml(act.formula)}</code></div>` : ''}
      </div>
    `;
  }

  if (act.action === "edit-template-card" || act.action === "update-template-card" || act.action === "edit-template" || act.action === "apply-template-formula" || act.action === "apply-formula") {
    const target = escapeHtml(act.target || act.label || act.title || 'Template Card');
    const formulaStr = act.formula ? escapeHtml(act.formula) : '';
    const colStr = act.column ? escapeHtml(act.column) : '';
    const aggStr = act.aggregation ? escapeHtml(act.aggregation) : 'sum';

    return `
      <div class="ai-live-preview-card p-2.5 rounded-3 border shadow-xs mb-2" style="background: #f0fdf4; border-color: #bbf7d0 !important;">
        <div class="d-flex align-items-center justify-content-between mb-1">
          <span class="fw-bold text-emerald-900 text-xs"><i class="bi bi-pencil-square text-emerald-600 me-1"></i> Edit Template & Apply Formula</span>
          <span class="badge bg-emerald-100 text-emerald-800 text-3xs text-uppercase">Target: ${target}</span>
        </div>
        ${formulaStr ? `
          <div class="mt-1.5 d-flex align-items-center gap-1">
            <span class="badge bg-slate-800 text-white font-monospace text-3xs">ƒ(x) Formula</span>
            <code class="text-xs text-indigo-700 bg-white px-1.5 py-0.5 rounded border border-indigo-200 font-monospace">${formulaStr}</code>
          </div>
        ` : ''}
        ${colStr ? `
          <div class="text-secondary small mt-1" style="font-size: 11px;">
            • Metric Column: <strong>${colStr}</strong> (${aggStr.toUpperCase()})
            ${act.currency ? ` • Currency: <strong>${escapeHtml(act.currency)}</strong>` : ''}
          </div>
        ` : ''}
        ${act.value !== undefined ? `<div class="fw-bold text-slate-800 text-sm mt-1">Value: ${escapeHtml(String(act.value))}</div>` : ''}
      </div>
    `;
  }

  if (act.action === "generate-data-story") {
    return `
      <div class="ai-live-preview-card p-2.5 rounded-3 border shadow-xs mb-2" style="background: #faf5ff; border-color: #d8b4fe !important;">
        <div class="d-flex align-items-center justify-content-between mb-1">
          <span class="fw-bold text-purple-900 text-xs"><i class="bi bi-journal-text text-purple-600 me-1"></i> Executive Data Story</span>
          <span class="badge bg-purple-100 text-purple-700 text-3xs">3 Paragraphs</span>
        </div>
        <div class="text-secondary small" style="font-size: 11px; line-height: 1.35;">
          • Paragraph 1: High-level volume, time horizons & primary trends<br/>
          • Paragraph 2: High & low performance benchmarks & outlier nodes<br/>
          • Paragraph 3: 3 strategic, actionable business recommendations
        </div>
      </div>
    `;
  }

  if (act.action === "detect-anomalies") {
    return `
      <div class="ai-live-preview-card p-2.5 rounded-3 border shadow-xs mb-2" style="background: #fffbeb; border-color: #fde68a !important;">
        <div class="d-flex align-items-center justify-content-between mb-1">
          <span class="fw-bold text-amber-900 text-xs"><i class="bi bi-shield-exclamation text-amber-600 me-1"></i> Statistical Anomaly Detection</span>
          <span class="badge bg-amber-100 text-amber-700 text-3xs">Z-Score & IQR</span>
        </div>
        <div class="text-secondary small" style="font-size: 11px; line-height: 1.35;">
          Automated multi-column scan to highlight sharp spikes, sudden revenue drops, or abnormal data distributions with severity scoring and instant filtering.
        </div>
      </div>
    `;
  }

  if (act.action === "filter-data") {
    const query = escapeHtml(act.displayQuery || `${act.column || 'Column'} ${act.operator || '='} ${act.value || ''}`);
    return `
      <div class="ai-live-preview-card p-2.5 rounded-3 border shadow-xs mb-2" style="background: #f0fdfa; border-color: #99f6e4 !important;">
        <div class="d-flex align-items-center justify-content-between mb-1">
          <span class="fw-bold text-teal-900 text-xs"><i class="bi bi-funnel-fill text-teal-600 me-1"></i> Conversational Data Filter</span>
          <span class="badge bg-teal-100 text-teal-700 text-3xs">Active Slice</span>
        </div>
        <div class="text-secondary small" style="font-size: 11px;">
          Applying query: <strong class="text-teal-800">${query}</strong> across the active dataset with real-time UI synchronization.
        </div>
      </div>
    `;
  }

  if (act.action === "calculate-column") {
    const colName = escapeHtml(act.columnName || 'NewColumn');
    const formula = escapeHtml(act.formula || '[FieldA] - [FieldB]');
    return `
      <div class="ai-live-preview-card p-2.5 rounded-3 border shadow-xs mb-2" style="background: #ecfdf5; border-color: #a7f3d0 !important;">
        <div class="d-flex align-items-center justify-content-between mb-1">
          <span class="fw-bold text-emerald-900 text-xs"><i class="bi bi-calculator-fill text-emerald-600 me-1"></i> AI Calculated Field</span>
          <span class="badge bg-emerald-100 text-emerald-700 text-3xs">Live Formula</span>
        </div>
        <div class="text-secondary small" style="font-size: 11px;">
          New column: <strong class="text-emerald-800">${colName}</strong> = <code class="text-emerald-900">${formula}</code>
        </div>
      </div>
    `;
  }

  if (act.action === "forecast-chart") {
    const periods = act.periods || 3;
    return `
      <div class="ai-live-preview-card p-2.5 rounded-3 border shadow-xs mb-2" style="background: #eef2ff; border-color: #c7d2fe !important;">
        <div class="d-flex align-items-center justify-content-between mb-1">
          <span class="fw-bold text-indigo-900 text-xs"><i class="bi bi-graph-up-arrow text-indigo-600 me-1"></i> Predictive Trend Forecast</span>
          <span class="badge bg-indigo-100 text-indigo-700 text-3xs">+${periods} Intervals</span>
        </div>
        <div class="text-secondary small" style="font-size: 11px;">
          Calculates linear regression trajectory and renders dashed forecast projection on the active chart.
        </div>
      </div>
    `;
  }

  if (act.action === "build-template-dashboard") {
    const domain = (act.domain || 'sales').toUpperCase();
    return `
      <div class="ai-live-preview-card p-2.5 rounded-3 border shadow-xs mb-2" style="background: #eff6ff; border-color: #bfdbfe !important;">
        <div class="d-flex align-items-center justify-content-between mb-1">
          <span class="fw-bold text-blue-900 text-xs"><i class="bi bi-speedometer2 text-blue-600 me-1"></i> 1-Click Industry Dashboard</span>
          <span class="badge bg-blue-100 text-blue-700 text-3xs">${domain} Template</span>
        </div>
        <div class="text-secondary small" style="font-size: 11px;">
          Builds 3 Executive KPI cards (Total Volume, Mean Average, Benchmark) + 3 coordinated analytical charts.
        </div>
      </div>
    `;
  }

  if (act.action === "create-tab" || act.action === "switch-tab") {
    const tabName = act.tabName || "New Tab";
    return `
      <div class="ai-live-preview-card p-2.5 rounded-3 border shadow-xs mb-2" style="background: #f0fdf4; border-color: #bbf7d0 !important;">
        <div class="d-flex align-items-center justify-content-between mb-1">
          <span class="fw-bold text-emerald-900 text-xs"><i class="bi bi-folder2-open text-emerald-600 me-1"></i> Multi-Page Tab Canvas</span>
          <span class="badge bg-emerald-100 text-emerald-700 text-3xs">${escapeHtml(tabName)}</span>
        </div>
        <div class="text-secondary small" style="font-size: 11px;">
          Creates and switches to a dedicated dashboard canvas tab for modular analytics.
        </div>
      </div>
    `;
  }

  if (act.action === "move-chart-to-tab") {
    const dest = act.destinationTab || "New Tab";
    return `
      <div class="ai-live-preview-card p-2.5 rounded-3 border shadow-xs mb-2" style="background: #faf5ff; border-color: #e9d5ff !important;">
        <div class="d-flex align-items-center justify-content-between mb-1">
          <span class="fw-bold text-purple-900 text-xs"><i class="bi bi-arrow-right-circle-fill text-purple-600 me-1"></i> Migrate Chart to Tab</span>
          <span class="badge bg-purple-100 text-purple-700 text-3xs">→ ${escapeHtml(dest)}</span>
        </div>
        <div class="text-secondary small" style="font-size: 11px;">
          Moves visual charts seamlessly to the <strong>${escapeHtml(dest)}</strong> canvas tab.
        </div>
      </div>
    `;
  }

  if (act.action === "join-datasets") {
    const lKey = act.leftKey || "ID";
    const rKey = act.rightKey || "ID";
    const jType = (act.joinType || "inner").toUpperCase();
    return `
      <div class="ai-live-preview-card p-2.5 rounded-3 border shadow-xs mb-2" style="background: #fdf4ff; border-color: #f5d0fe !important;">
        <div class="d-flex align-items-center justify-content-between mb-1">
          <span class="fw-bold text-fuchsia-900 text-xs"><i class="bi bi-intersect text-fuchsia-600 me-1"></i> Multi-Dataset AI Blend & Join</span>
          <span class="badge bg-fuchsia-100 text-fuchsia-700 text-3xs">${jType} JOIN</span>
        </div>
        <div class="text-secondary small" style="font-size: 11px;">
          Blends datasets on common key <code>${escapeHtml(lKey)} = ${escapeHtml(rKey)}</code> and loads unified table into active workspace.
        </div>
      </div>
    `;
  }

  if (act.action === "set-element-position" || act.action === "set-position" || act.action === "reposition-element") {
    const target = act.target || "element";
    const zone = act.zone || "custom";
    return `
      <div class="ai-live-preview-card p-2.5 rounded-3 border shadow-xs mb-2" style="background: #eef2ff; border-color: #c7d2fe !important;">
        <div class="d-flex align-items-center justify-content-between mb-1">
          <span class="fw-bold text-indigo-900 text-xs"><i class="bi bi-arrows-move text-indigo-600 me-1"></i> Precise Element Positioning</span>
          <span class="badge bg-indigo-100 text-indigo-700 text-3xs">${escapeHtml(zone.toUpperCase())}</span>
        </div>
        <div class="text-secondary small" style="font-size: 11px;">
          Repositioning <strong>${escapeHtml(target)}</strong> to Top: ${act.top ?? 'auto'}, Left: ${act.left ?? 'auto'}${act.width ? `, Width: ${act.width}` : ''}.
        </div>
      </div>
    `;
  }

  if (act.action === "arrange-dashboard-professionally" || act.action === "auto-layout-dashboard" || act.action === "arrange-professional") {
    return `
      <div class="ai-live-preview-card p-2.5 rounded-3 border shadow-xs mb-2" style="background: #f0fdf4; border-color: #86efac !important;">
        <div class="d-flex align-items-center justify-content-between mb-1">
          <span class="fw-bold text-emerald-900 text-xs"><i class="bi bi-layout-wtf text-emerald-600 me-1"></i> Executive Layout Architecture</span>
          <span class="badge bg-emerald-100 text-emerald-800 text-3xs">GOLDEN RATIO</span>
        </div>
        <div class="text-secondary small" style="font-size: 11px; line-height: 1.35;">
          • Top: Strategic Banner & Executive Textbox<br/>
          • Horizon: KPI Big Numbers & Sparklines side-by-side<br/>
          • Center: 2-Column High-Impact Trends & Analytical charts<br/>
          • Bottom: Proportions, Donut & Distribution Benchmarks
        </div>
      </div>
    `;
  }

  if (act.action === "design-professional-dashboard" || act.action === "build-professional-dashboard") {
    return `
      <div class="ai-live-preview-card p-2.5 rounded-3 border shadow-xs mb-2" style="background: #fffbeb; border-color: #fde68a !important;">
        <div class="d-flex align-items-center justify-content-between mb-1">
          <span class="fw-bold text-amber-900 text-xs"><i class="bi bi-award-fill text-amber-600 me-1"></i> Autonomous Professional Dashboard Design</span>
          <span class="badge bg-amber-100 text-amber-800 text-3xs">ENTERPRISE BI</span>
        </div>
        <div class="text-secondary small" style="font-size: 11px; line-height: 1.35;">
          Synthesizes full executive layout tailored to your dataset: 4 KPIs on top, time-series line & regional bar in center, and breakdown share on bottom.
        </div>
      </div>
    `;
  }

  if (act.action === "convert-chart") {
    const targetName = act.target || "Active Chart";
    const newType = (act.chartType || "bar").toUpperCase();
    return `
      <div class="ai-live-preview-card p-2.5 rounded-3 border shadow-xs mb-2" style="background: #f0f9ff; border-color: #bae6fd !important;">
        <div class="d-flex align-items-center justify-content-between mb-1">
          <span class="fw-bold text-sky-900 text-xs"><i class="bi bi-arrow-repeat text-sky-600 me-1"></i> Transform Chart Type</span>
          <span class="badge bg-sky-100 text-sky-700 text-3xs">→ ${escapeHtml(newType)}</span>
        </div>
        <div class="text-secondary small" style="font-size: 11px;">
          Converts <strong>${escapeHtml(targetName)}</strong> into a <strong>${escapeHtml(newType)}</strong> chart.
        </div>
      </div>
    `;
  }

  if (act.action === "rename-chart") {
    const targetName = act.target || "Active Element";
    const newTitle = act.newTitle || "New Title";
    return `
      <div class="ai-live-preview-card p-2.5 rounded-3 border shadow-xs mb-2" style="background: #fefce8; border-color: #fef08a !important;">
        <div class="d-flex align-items-center justify-content-between mb-1">
          <span class="fw-bold text-yellow-900 text-xs"><i class="bi bi-pencil-square text-yellow-600 me-1"></i> Update Element Title</span>
          <span class="badge bg-yellow-100 text-yellow-800 text-3xs">Rename</span>
        </div>
        <div class="text-secondary small" style="font-size: 11px;">
          Renames <strong>${escapeHtml(targetName)}</strong> to <strong>"${escapeHtml(newTitle)}"</strong>.
        </div>
      </div>
    `;
  }

  if (act.action.startsWith("presentation-") || act.action === "start-presentation" || act.action === "exit-presentation") {
    let title = "Presentation Command";
    let icon = "bi-projector";
    let detail = `Execute presentation control: ${act.action}`;
    if (act.action === "start-presentation") {
      title = "Launch Presentation Mode";
      icon = "bi-play-circle-fill";
      detail = `Start kiosk slideshow${act.layout ? ` in ${act.layout} layout` : ''}${act.duration ? ` (${act.duration}s per slide)` : ''}`;
    } else if (act.action === "presentation-next") {
      title = "Next Slide";
      icon = "bi-arrow-right-circle";
      detail = "Advance to next presentation visual slide";
    } else if (act.action === "presentation-prev") {
      title = "Previous Slide";
      icon = "bi-arrow-left-circle";
      detail = "Go back to previous visual slide";
    } else if (act.action === "presentation-goto-slide") {
      title = "Jump to Slide";
      icon = "bi-cursor-fill";
      detail = act.slideIndex ? `Navigate directly to slide #${act.slideIndex}` : `Search and navigate to slide "${act.slideQuery}"`;
    } else if (act.action === "presentation-set-layout") {
      title = "Change Viewport Layout";
      icon = "bi-layout-split";
      detail = `Set presentation layout to "${act.layout}"`;
    } else if (act.action === "presentation-set-duration" || act.action === "presentation-adjust-duration") {
      title = "Slide Display Timing";
      icon = "bi-clock-history";
      detail = act.duration ? `Set slide duration to ${act.duration}s (${act.scope || 'all slides'})` : `Adjust duration by ${act.durationDelta}s`;
    } else if (act.action === "presentation-set-speed") {
      title = "AI Briefing Reading Speed";
      icon = "bi-speedometer2";
      detail = `Set summary display & narration speed to ${act.speed}x`;
    } else if (act.action === "presentation-set-theme") {
      title = "Presentation Theme";
      icon = "bi-palette2";
      detail = `Switch presentation theme to "${act.theme}"`;
    } else if (act.action === "presentation-set-laser" || act.action === "presentation-toggle-laser") {
      title = "Laser Pointer";
      icon = "bi-bullseye";
      detail = "Toggle visual stage laser pointer spotlight";
    } else if (act.action === "presentation-set-pen" || act.action === "presentation-toggle-pen") {
      title = "Drawing Pen";
      icon = "bi-pen";
      detail = "Toggle interactive stage pen markup";
    } else if (act.action === "presentation-set-voice" || act.action === "presentation-toggle-voice") {
      title = "Voice Speech Narration";
      icon = "bi-volume-up";
      detail = "Toggle automated voice speech reading for AI summaries";
    }
    return `
      <div class="ai-live-preview-card p-2.5 rounded-3 border shadow-xs mb-2" style="background: #eef2ff; border-color: #c7d2fe !important;">
        <div class="d-flex align-items-center justify-content-between mb-1">
          <span class="fw-bold text-indigo-900 text-xs"><i class="bi ${icon} text-indigo-600 me-1"></i> ${title}</span>
          <span class="badge bg-indigo-100 text-indigo-800 text-3xs">Presentation</span>
        </div>
        <div class="text-secondary small" style="font-size: 11px;">
          ${escapeHtml(detail)}
        </div>
      </div>
    `;
  }

  return "";
}

export function attachUndoButtonToMessageRow(row: HTMLElement | null, snapshotId: string, actionsCount: number): void {
  if (!row) {
    const chatHistoryDiv = document.getElementById("chatHistory");
    if (!chatHistoryDiv) return;
    const assistantRows = chatHistoryDiv.querySelectorAll(".assistant-row");
    if (assistantRows.length > 0) {
      row = assistantRows[assistantRows.length - 1] as HTMLElement;
    }
  }

  if (!row) return;
  const bubble = row.querySelector(".chat-message-bubble") || row;

  if (bubble.querySelector(`#aiUndoBar-${snapshotId}`)) return;

  const undoBar = document.createElement("div");
  undoBar.id = `aiUndoBar-${snapshotId}`;
  undoBar.className = "ai-undo-feedback-bar mt-2 pt-2 border-top d-flex align-items-center justify-content-between gap-2";
  undoBar.innerHTML = `
    <span class="text-2xs text-muted d-inline-flex align-items-center gap-1">
      <i class="bi bi-clock-history text-indigo-500"></i> ${actionsCount} action${actionsCount > 1 ? 's' : ''} executed
    </span>
    <button class="btn btn-xs btn-outline-danger rounded-pill px-2.5 py-1 d-inline-flex align-items-center gap-1 shadow-xs fw-semibold ai-undo-btn" id="btnUndo-${snapshotId}" title="Revert AI updates to previous state (बदलाव वापस लें)">
      <i class="bi bi-arrow-counterclockwise"></i> Undo (बदलाव वापस लें)
    </button>
  `;

  bubble.appendChild(undoBar);
  scrollChatToBottom(true);

  const btnUndo = document.getElementById(`btnUndo-${snapshotId}`);
  btnUndo?.addEventListener("click", async () => {
    btnUndo.setAttribute("disabled", "true");
    const success = await undoAiAction(snapshotId);
    if (success) {
      undoBar.innerHTML = `
        <span class="text-2xs text-success fw-bold d-inline-flex align-items-center gap-1">
          <i class="bi bi-check-circle-fill text-success"></i> Changes Reverted (वापस ले लिया गया)
        </span>
        <button class="btn btn-xs btn-outline-primary rounded-pill px-2.5 py-1 d-inline-flex align-items-center gap-1 shadow-xs fw-semibold" id="btnRedo-${snapshotId}" title="Redo AI updates (दोबारा लागू करें)">
          <i class="bi bi-arrow-clockwise"></i> Redo (पुनः लागू करें)
        </button>
      `;

      document.getElementById(`btnRedo-${snapshotId}`)?.addEventListener("click", async () => {
        await redoAiAction();
        attachUndoButtonToMessageRow(row, snapshotId, actionsCount);
      });
    }
  });
}

export async function undoAiAction(snapshotId?: string): Promise<boolean> {
  if (aiActionUndoStack.length === 0) {
    showMessage("No previous action to undo.", "warning");
    return false;
  }

  const snapshotIndex = snapshotId
    ? aiActionUndoStack.findIndex(s => s.id === snapshotId)
    : aiActionUndoStack.length - 1;

  if (snapshotIndex === -1) {
    showMessage("Snapshot not found.", "warning");
    return false;
  }

  const snapshot = aiActionUndoStack[snapshotIndex];

  // Save current state for Redo
  aiActionRedoStack.push({
    id: `redo_${Date.now()}`,
    summary: snapshot.summary,
    timestamp: Date.now(),
    visualizations: JSON.parse(JSON.stringify(visualizations)),
    actions: [...snapshot.actions],
  });

  // Restore visualizations array
  visualizations.length = 0;
  snapshot.visualizations.forEach((v: any) => {
    visualizations.push(JSON.parse(JSON.stringify(v)));
  });

  // Re-plot dashboard
  const container = document.getElementById('dashboardContent') || document.getElementById('visualizations');
  if (container) {
    container.querySelectorAll('.visualization-container').forEach((el: any) => {
      (el as any).moveable?.destroy();
      el.remove();
    });
  }

  await plotAll();
  await saveDashboardSettings();

  showMessage("AI action reverted successfully. / बदलाव सफलतापूर्वक वापस ले लिया गया।", "info");
  return true;
}

export async function redoAiAction(): Promise<boolean> {
  if (aiActionRedoStack.length === 0) {
    showMessage("No actions to redo.", "warning");
    return false;
  }

  const snapshot = aiActionRedoStack.pop()!;
  aiActionUndoStack.push({
    id: `snap_${Date.now()}`,
    summary: snapshot.summary,
    timestamp: Date.now(),
    visualizations: JSON.parse(JSON.stringify(visualizations)),
    actions: snapshot.actions,
  });

  visualizations.length = 0;
  snapshot.visualizations.forEach((v: any) => {
    visualizations.push(JSON.parse(JSON.stringify(v)));
  });

  const container = document.getElementById('dashboardContent') || document.getElementById('visualizations');
  if (container) {
    container.querySelectorAll('.visualization-container').forEach((el: any) => {
      (el as any).moveable?.destroy();
      el.remove();
    });
  }

  await plotAll();
  await saveDashboardSettings();

  showMessage("AI action reapplied. / बदलाव पुनः लागू किया गया।", "success");
  return true;
}

export function pushUndoSnapshot(summary: string, actions: AiAction[] = []): string {
  const snapshotId = `ai_snap_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const snapshot: ActionSnapshot = {
    id: snapshotId,
    summary,
    timestamp: Date.now(),
    visualizations: JSON.parse(JSON.stringify(visualizations)),
    actions: [...actions],
  };
  aiActionUndoStack.push(snapshot);
  aiActionRedoStack.length = 0;
  return snapshotId;
}

export async function executeSingleAction(act: AiAction): Promise<{ success: boolean; message: string; details?: any }> {
  try {
      if (act.action === "clear-dashboard") {
        const activeVizs = [...visualizations];
        for (const viz of activeVizs) {
          await clearChart(viz.id);
        }
      } else if (act.action === "convert-chart") {
        const targetQuery = (act.target || '').toLowerCase().trim();
        const newType = act.chartType || act.type || 'bar';
        const viz = visualizations.find(v => 
          v && (
            v.id === act.target ||
            v.title?.toLowerCase() === targetQuery ||
            (targetQuery && v.title?.toLowerCase().includes(targetQuery)) ||
            (targetQuery && v.type?.toLowerCase().includes(targetQuery))
          )
        ) || (activeFocusedChart ? visualizations.find(v => v.id === activeFocusedChart?.id) : null);

        if (viz) {
          viz.type = newType;
          await plotAll();
          showMessage(`Transformed "${viz.title || 'Chart'}" to ${newType.toUpperCase()}.`, "success");
        } else {
          showMessage(`Chart target "${act.target || 'selected'}" not found for conversion.`, "warning");
        }
      } else if (act.action === "rename-chart") {
        const targetQuery = (act.target || '').toLowerCase().trim();
        const newTitle = act.newTitle || act.title || 'Updated Title';
        const viz = visualizations.find(v => 
          v && (
            v.id === act.target ||
            v.title?.toLowerCase() === targetQuery ||
            (targetQuery && v.title?.toLowerCase().includes(targetQuery))
          )
        ) || (activeFocusedChart ? visualizations.find(v => v.id === activeFocusedChart?.id) : null);

        if (viz) {
          viz.title = newTitle;
          const container = document.getElementById(`container-${viz.id}`);
          const titleEl = container?.querySelector('.chart-title, h4, h5, h6, .fw-bold');
          if (titleEl) titleEl.textContent = newTitle;
          await plotAll();
          showMessage(`Renamed chart to "${newTitle}".`, "success");
        } else {
          // Check if it's a DOM KPI card
          let renamed = false;
          document.querySelectorAll('.kpi-card, [id^="kpi-sparkline-"]').forEach(kpiEl => {
            const container = (kpiEl.closest('.visualization-container') || kpiEl.closest('[id^="container-"]') || kpiEl) as HTMLElement;
            const currentTitleEl = container.querySelector('.kpi-title, .chart-title, h4, h5, h6, .fw-bold');
            if (currentTitleEl && targetQuery && currentTitleEl.textContent?.toLowerCase().includes(targetQuery)) {
              currentTitleEl.textContent = newTitle;
              renamed = true;
            }
          });
          if (renamed) {
            showMessage(`Renamed KPI card to "${newTitle}".`, "success");
          } else {
            showMessage(`Target "${act.target || 'element'}" not found to rename.`, "warning");
          }
        }
      } else if (act.action === "create-chart") {
        if (act.xAxis && act.yAxes && act.yAxes.length > 0) {
          await addVisualization(
            act.xAxis,
            act.yAxes,
            act.zAxis || null,
            act.type || "bar",
            act.title || "AI Chart"
          );
        }
      } else if (act.action === "apply-effect") {
        await new Promise(resolve => setTimeout(resolve, 600));
        const effectObj = chartEffectsTemplates.find(
          (e: any) => e.id === act.effectId || 
               e.id === `effect-${act.effectId}` ||
               (act.effectId && e.name.toLowerCase().includes(act.effectId.toLowerCase()))
        );
        if (effectObj) {
          if (act.target === "all") {
            visualizations.forEach(viz => applyEffect(viz.id, effectObj));
            showMessage(`Applied "${effectObj.name}" style effect across charts.`, "success");
          } else {
            const viz = visualizations.find(
              v => v && (v.id === act.target || 
                   v.title === act.target || 
                   (act.target && (v.title || '').toLowerCase().includes(act.target.toLowerCase())))
            ) || visualizations[visualizations.length - 1];
            if (viz) {
              applyEffect(viz.id, effectObj);
              showMessage(`Applied "${effectObj.name}" effect to "${viz.title || 'Chart'}".`, "success");
            }
          }
        }
      } else if (act.action === "change-theme") {
        const themeId = act.themeId;
        if (themeId) {
          if (act.target === "all") {
            applyChartContainerColor(themeId, visualizations, true);
            showMessage(`Container theme updated to "${themeId}".`, "success");
          } else {
            const targetViz = visualizations.find(
              v => v && (v.id === act.target || (act.target && (v.title || '').toLowerCase().includes(act.target.toLowerCase())))
            ) || visualizations[visualizations.length - 1];
            if (targetViz) {
              applyChartContainerColor(themeId, [targetViz], false, [targetViz.id]);
              showMessage(`Theme updated for "${targetViz.title || 'Chart'}".`, "success");
            }
          }
        }
      } else if (act.action === "change-layout") {
        if (act.columns) {
          await arrangeChartsInGrid(parseInt(String(act.columns), 10));
          showMessage(`Rearranged grid layout to ${act.columns} columns.`, "success");
        }
      } else if (act.action === "generate-mock-data") {
        if (act.category) {
          triggerMockDataUpdate(act.category, act.rowCount || 30);
          showMessage(`Loaded mock dataset: ${act.category} (${act.rowCount || 30} records).`, "success");
          updateDatasetContextBadge();
        }
      } else if (act.action === "set-live-polling") {
        if (act.url && act.interval) {
          startLiveUpdate(act.url, parseInt(String(act.interval), 10));
          showMessage(`Live update polling started (interval: ${act.interval}s).`, "success");
        } else if (act.state === "stop") {
          stopLiveUpdate();
          showMessage("Live polling stopped.", "info");
        }
      } else if (act.action === "create-template-card" || act.action === "add-template-card") {
        try {
          const card = await createCustomTemplateCard({
            templateId: act.templateId,
            category: act.templateCategory || (act.category as any) || 'kpi',
            textboxStyle: act.textboxStyle,
            label: act.label || act.title,
            title: act.title || act.label,
            subLabel: act.subLabel,
            badge: act.badge,
            value: act.value,
            currency: act.currency,
            change: act.change,
            changeType: act.changeType,
            trend: act.trend,
            trendValue: act.trendValue,
            kpiCategory: act.kpiCategory,
            color: act.color,
            sparklineType: act.sparklineType,
            dataPoints: act.dataPoints,
            subMetrics: act.subMetrics,
            column: act.column || act.columnName,
            aggregation: act.aggregation || 'sum',
            formula: act.formula,
            formulaField: act.formulaField,
            top: act.top,
            left: act.left,
            width: act.width,
            height: act.height,
            zone: act.zone
          });
          showMessage(`Ready-made template card "${card.title || 'Template'}" created on dashboard.`, "success");
        } catch (e: any) {
          console.error("Failed to create template card:", e);
          showMessage(`Failed to create template card: ${e?.message || 'Error'}`, "danger");
        }
      } else if (act.action === "create-kpi-card") {
        try {
          const card = await createCustomTemplateCard({
            category: 'kpi',
            templateId: act.templateId,
            label: act.label || act.title || (act.column ? `Total ${act.column}` : 'Key Metric'),
            title: act.title || act.label,
            subLabel: act.subLabel,
            badge: act.badge || 'KPI',
            value: act.value,
            currency: act.currency || '₹',
            trend: act.trend || 'up',
            trendValue: act.trendValue || '+12.4%',
            kpiCategory: act.kpiCategory || 'revenue',
            color: act.color || '#4f46e5',
            column: act.column || act.columnName,
            aggregation: act.aggregation || 'sum',
            subMetrics: act.subMetrics,
            formula: act.formula,
            formulaField: act.formulaField,
            top: act.top,
            left: act.left,
            width: act.width,
            height: act.height,
            zone: act.zone
          });
          showMessage(`KPI Metric card "${card.title || 'KPI'}" created on dashboard.`, "success");
        } catch (e: any) {
          console.error("Failed to create KPI card:", e);
          showMessage(`Failed to create KPI card: ${e?.message || 'Error'}`, "danger");
        }
      } else if (act.action === "create-sparkline") {
        try {
          const card = await createCustomTemplateCard({
            category: 'sparkline',
            templateId: act.templateId,
            sparklineType: act.sparklineType || 'line',
            label: act.label || act.title || (act.column ? `${act.column} Velocity` : 'Trend Sparkline'),
            title: act.title || act.label,
            badge: act.badge || '30-Day',
            value: act.value,
            currency: act.currency,
            trendValue: act.trendValue || '↑ 14.8%',
            color: act.color || '#10b981',
            column: act.column || act.columnName,
            dataPoints: act.dataPoints,
            formula: act.formula,
            formulaField: act.formulaField,
            top: act.top,
            left: act.left,
            width: act.width,
            height: act.height,
            zone: act.zone
          });
          showMessage(`Sparkline trend card "${card.title || 'Sparkline'}" created on dashboard.`, "success");
        } catch (e: any) {
          console.error("Failed to create sparkline card:", e);
          showMessage(`Failed to create sparkline card: ${e?.message || 'Error'}`, "danger");
        }
      } else if (act.action === "create-gauge") {
        try {
          const card = await createCustomTemplateCard({
            category: 'gauge',
            templateId: act.templateId,
            label: act.label || act.title || 'System Metric',
            subLabel: act.subLabel || 'Production Sensor',
            value: act.value !== undefined ? act.value : 75,
            color: act.color || '#3b82f6',
            column: act.column || act.columnName,
            aggregation: act.aggregation || 'avg',
            formula: act.formula,
            formulaField: act.formulaField,
            top: act.top,
            left: act.left,
            width: act.width,
            height: act.height,
            zone: act.zone
          });
          showMessage(`Gauge meter card "${card.title || 'Gauge'}" created on dashboard.`, "success");
        } catch (e: any) {
          console.error("Failed to create gauge card:", e);
          showMessage(`Failed to create gauge card: ${e?.message || 'Error'}`, "danger");
        }
      } else if (act.action === "create-progress") {
        try {
          const card = await createCustomTemplateCard({
            category: 'progress',
            templateId: act.templateId,
            label: act.label || act.title || 'Target Completion',
            subLabel: act.subLabel || 'Quarterly Progress',
            value: act.value !== undefined ? act.value : 80,
            color: act.color || '#10b981',
            column: act.column || act.columnName,
            aggregation: act.aggregation || 'avg',
            formula: act.formula,
            formulaField: act.formulaField,
            top: act.top,
            left: act.left,
            width: act.width,
            height: act.height,
            zone: act.zone
          });
          showMessage(`Progress card "${card.title || 'Progress'}" created on dashboard.`, "success");
        } catch (e: any) {
          console.error("Failed to create progress card:", e);
          showMessage(`Failed to create progress card: ${e?.message || 'Error'}`, "danger");
        }
      } else if (act.action === "create-textbox") {
        try {
          const card = await createCustomTemplateCard({
            category: 'textbox',
            textboxStyle: act.textboxStyle || (act as any).style || 'gradient',
            label: act.label || act.title || 'Strategic Overview',
            subLabel: act.subLabel || 'Workspace Intelligence',
            badge: act.badge || 'Executive Note',
            value: act.content || act.value || 'Real-time performance indicators and operational benchmarks across active dimensions.',
            trendValue: act.trendValue || '',
            color: act.color || act.bgColor || '#4f46e5',
            formula: act.formula,
            formulaField: act.formulaField,
            top: act.top !== undefined ? act.top : (act.zone ? undefined : 15),
            left: act.left !== undefined ? act.left : (act.zone ? undefined : 15),
            width: act.width || (act.zone ? undefined : 'calc(100% - 30px)'),
            height: act.height || (act.zone ? undefined : 110),
            zone: act.zone || (!act.top && !act.left ? 'header' : undefined)
          });
          showMessage(`Ready-made styled textbox "${card.title || 'Notes'}" created on dashboard.`, "success");
        } catch (e: any) {
          console.error("Failed to create styled textbox:", e);
          showMessage(`Failed to create styled textbox: ${e?.message || 'Error'}`, "danger");
        }
      } else if (act.action === "edit-template-card" || act.action === "update-template-card" || act.action === "edit-template") {
        try {
          const res = await editTemplateCard({
            target: act.target || act.title || act.label || 'kpi',
            formula: act.formula,
            formulaField: act.formulaField || 'value',
            column: act.column || act.columnName,
            aggregation: act.aggregation || 'sum',
            label: act.label,
            title: act.title,
            subLabel: act.subLabel,
            badge: act.badge,
            value: act.value,
            currency: act.currency,
            change: act.change,
            changeType: act.changeType,
            trend: act.trend,
            trendValue: act.trendValue,
            color: act.color,
            sparklineType: act.sparklineType,
            textboxStyle: act.textboxStyle,
            subMetrics: act.subMetrics,
            dataPoints: act.dataPoints
          });
          if (res.success) {
            showMessage(res.message, "success");
          }
        } catch (e: any) {
          console.error("Failed to edit template card:", e);
          showMessage(`Failed to edit template card: ${e?.message || 'Error'}`, "danger");
        }
      } else if (act.action === "apply-template-formula" || act.action === "apply-formula" || act.action === "set-template-formula") {
        try {
          const res = await applyTemplateFormula(
            act.target || 'kpi',
            act.formula || '=SUM(A1, R, "₹")',
            act.formulaField || 'value'
          );
          if (res.success) {
            showMessage(res.message, "success");
          }
        } catch (e: any) {
          console.error("Failed to apply template formula:", e);
          showMessage(`Failed to apply formula: ${e?.message || 'Error'}`, "danger");
        }
      } else if (act.action === "apply-knowledge-calculation") {
        try {
          const res = await applyKnowledgeCalculationToDashboard({
            formula: act.formula || '=SUM(Sales, R, "Total: ₹")',
            target: act.target,
            cardTitle: act.label || act.title,
            category: act.category as any,
            replaceExisting: false
          });
          showMessage(res.message, "success");
        } catch (e: any) {
          console.error("Failed to apply knowledge calculation:", e);
          showMessage(`Failed to apply calculation: ${e?.message || 'Error'}`, "danger");
        }
      } else if (act.action === "show-knowledge-base" || act.action === "open-knowledge-base") {
        const card = renderKnowledgeBaseExplorerCard(act.query || '', 'hi');
        const row = appendMessageElement(card.html, "assistant", false, true);
        if (row) {
          attachKnowledgeBaseListeners(row);
        }
      } else if (act.action === "set-element-position" || act.action === "set-position" || act.action === "reposition-element") {
        await setElementPosition({
          target: act.target || "all",
          top: act.top,
          left: act.left,
          width: act.width,
          height: act.height,
          zone: act.zone
        });
      } else if (act.action === "arrange-dashboard-professionally" || act.action === "auto-layout-dashboard" || act.action === "arrange-professional") {
        await arrangeDashboardProfessionally();
      } else if (act.action === "design-professional-dashboard" || act.action === "build-professional-dashboard") {
        await designProfessionalDashboard();
      } else if (act.action === "auto-pilot-dashboard" || act.action === "build-auto-pilot" || act.action === "smart-dashboard") {
        await buildAutoPilotDashboard({ domain: act.domain });
      } else if (act.action === "export-executive-report" || act.action === "executive-report") {
        const format = (act.format || "pdf").toLowerCase();
        if (format === "ppt" || format === "pptx" || format === "powerpoint") {
          await exportExecutiveReportToPPT();
        } else if (format === "pdf") {
          await exportExecutiveReportToPDF();
        } else {
          const reportCard = renderExecutiveReportCard();
          const chatHistoryDiv = document.getElementById("chatHistory");
          if (chatHistoryDiv) {
            const row = document.createElement("div");
            row.className = "chat-row assistant-row";
            row.innerHTML = `
              <div class="chat-avatar bot-avatar"><i class="bi bi-file-earmark-bar-graph text-indigo-600"></i></div>
              <div class="chat-message-container" style="max-width: 95%;">
                <div class="chat-message-bubble assistant p-0 border-0 bg-transparent">${reportCard.html}</div>
              </div>
            `;
            chatHistoryDiv.appendChild(row);
            attachExecutiveReportListeners(row);
            scrollChatToBottom();
          }
        }
      } else if (act.action === "clean-dataset" || act.action === "clean-data" || act.action === "fix-data-quality") {
        await executeDataCleaning();
      } else if (act.action === "simulate-what-if" || act.action === "what-if") {
        const card = renderWhatIfCard({
          priceDeltaPct: act.priceDeltaPct,
          volumeDeltaPct: act.volumeDeltaPct,
          costDeltaPct: act.costDeltaPct,
          discountDeltaPct: act.discountDeltaPct
        });
        const row = appendMessageElement(card.html, "assistant", false, true);
        if (row) attachWhatIfListeners(row);
      } else if (act.action === "diagnose-root-cause" || act.action === "root-cause-analysis" || act.action === "why-analysis") {
        const diag = diagnoseRootCause(act.metricQuery || act.column);
        const card = renderRootCauseCard(diag);
        const row = appendMessageElement(card.html, "assistant", false, true);
        if (row) attachRootCauseListeners(row);
      } else if (act.action === "toggle-cross-filter" || act.action === "enable-cross-filter" || act.action === "disable-cross-filter") {
        if (act.action === "disable-cross-filter" || act.state === "off") {
          disableCrossFiltering();
        } else {
          enableCrossFiltering();
        }
      } else if (act.action === "set-chart-benchmark" || act.action === "add-target-line" || act.action === "set-target-benchmark") {
        const res = await applyBenchmarkTarget({
          chartId: act.chartId || act.target,
          targetValue: act.targetValue || (act.value !== undefined ? Number(act.value) : 500000),
          label: act.label || act.title,
          lineColor: act.color,
          lineStyle: 'dashed'
        });
        const card = renderBenchmarkCard(res);
        const row = appendMessageElement(card.html, "assistant", false, true);
        if (row) attachBenchmarkListeners(row);
      } else if (
        act.action.startsWith("presentation-") ||
        act.action === "start-presentation" ||
        act.action === "exit-presentation" ||
        act.action === "kiosk-mode" ||
        act.action === "board-meeting-mode" ||
        act.action === "next-slide" ||
        act.action === "prev-slide" ||
        act.action === "go-to-slide"
      ) {
        const presRes = executePresentationCommand({
          action: act.action,
          slideIndex: act.slideIndex,
          slideQuery: act.slideQuery || act.query,
          duration: act.duration,
          durationDelta: act.durationDelta,
          scope: act.scope,
          speed: act.speed,
          layout: act.layout,
          density: act.density,
          theme: act.theme,
          state: act.state as any,
          autoPlay: act.autoPlay,
          voice: act.voice,
          narrator: act.narrator !== undefined ? act.narrator : act.voice,
          narratorVoice: act.voiceName || act.narratorVoice,
          narratorPitch: act.pitch || act.narratorPitch
        });
        if (presRes && presRes.message) {
          showMessage(presRes.message, presRes.success ? "info" : "warning");
        }
      } else if (act.action === "export-dashboard") {
        const format = act.format || "pdf_dash";
        if (format === "csv") {
          exportCsv(currentDataForChat, "vedra_bi_data.csv");
        } else if (format === "excel") {
          exportExcel(currentDataForChat, "vedra_bi_data.xlsx");
        } else if (format === "pdf_table") {
          exportPdf(currentDataForChat, headers || [], "vedra_bi_data.pdf");
        } else if (format === "png_dash") {
          exportDashboardToPNG();
        } else if (format === "pdf_dash") {
          exportDashboardToPDF();
        }
        showMessage(`Exported dashboard in ${format.toUpperCase()} format.`, "success");
      } else if (act.action === "generate-data-story") {
        const storyResult = generateExecutiveDataStory();
        const storyCard = storyResult.html;
        const chatHistoryDiv = document.getElementById("chatHistory");
        if (chatHistoryDiv) {
          const row = document.createElement("div");
          row.className = "chat-row assistant-row";
          row.innerHTML = `
            <div class="chat-avatar bot-avatar"><i class="bi bi-journal-text text-purple-500"></i></div>
            <div class="chat-message-container" style="max-width: 95%;">
              <div class="chat-message-bubble assistant p-0 border-0 bg-transparent">${storyCard}</div>
            </div>
          `;
          chatHistoryDiv.appendChild(row);
          attachStoryCardListeners();
          scrollChatToBottom();
        }
        showMessage("Executive data story generated.", "success");
      } else if (act.action === "detect-anomalies") {
        const anomalyResult = detectAnomalies(undefined, act.column);
        const anomalyCard = anomalyResult.html;
        const chatHistoryDiv = document.getElementById("chatHistory");
        if (chatHistoryDiv) {
          const row = document.createElement("div");
          row.className = "chat-row assistant-row";
          row.innerHTML = `
            <div class="chat-avatar bot-avatar"><i class="bi bi-shield-exclamation text-amber-500"></i></div>
            <div class="chat-message-container" style="max-width: 95%;">
              <div class="chat-message-bubble assistant p-0 border-0 bg-transparent">${anomalyCard}</div>
            </div>
          `;
          chatHistoryDiv.appendChild(row);
          attachAnomalyCardListeners();
          scrollChatToBottom();
        }
        showMessage("Anomaly scan completed.", "success");
      } else if (act.action === "filter-data") {
        if (act.column && act.operator && act.value !== undefined) {
          const success = await applyConversationalFilter({
            column: act.column,
            operator: act.operator,
            value: act.value,
            displayQuery: act.displayQuery || `${act.column} ${act.operator} ${act.value}`
          });
          if (success) {
            showMessage(`Conversational filter applied: ${act.displayQuery || act.column}.`, "success");
          }
        }
      } else if (act.action === "calculate-column") {
        if (act.columnName && act.formula) {
          const res = await createCalculatedField(act.columnName, act.formula);
          if (res.success) {
            showMessage(`Calculated field [${act.columnName}] created. ${res.affectedChartsCount} affected chart(s) refreshed.`, "success");
            const chatHistoryDiv = document.getElementById("chatHistory");
            if (chatHistoryDiv && res.html) {
              const row = document.createElement("div");
              row.className = "chat-row assistant-row";
              row.innerHTML = `
                <div class="chat-avatar bot-avatar"><i class="bi bi-calculator-fill text-emerald-600"></i></div>
                <div class="chat-message-container" style="max-width: 95%;">
                  <div class="chat-message-bubble assistant p-0 border-0 bg-transparent">${res.html}</div>
                </div>
              `;
              chatHistoryDiv.appendChild(row);
              attachCalculatedFieldListeners(row);
              scrollChatToBottom();
            }
          } else {
            showMessage(`Error: ${res.message}`, "warning");
          }
        }
      } else if (act.action === "forecast-chart") {
        const forecastResult = applyPredictiveForecast(act.target, act.periods || 3);
        const forecastCard = forecastResult.html || "";
        const chatHistoryDiv = document.getElementById("chatHistory");
        if (chatHistoryDiv && forecastCard) {
          const row = document.createElement("div");
          row.className = "chat-row assistant-row";
          row.innerHTML = `
            <div class="chat-avatar bot-avatar"><i class="bi bi-graph-up-arrow text-indigo-500"></i></div>
            <div class="chat-message-container" style="max-width: 95%;">
              <div class="chat-message-bubble assistant p-0 border-0 bg-transparent">${forecastCard}</div>
            </div>
          `;
          chatHistoryDiv.appendChild(row);
          attachForecastCardListeners();
          scrollChatToBottom();
        }
        showMessage(forecastResult.message, forecastResult.success ? "success" : "warning");
      } else if (act.action === "build-template-dashboard") {
        await buildIndustryDashboard(act.domain || "sales");
        showMessage(`1-Click ${act.domain || "Sales"} Dashboard generated.`, "success");
      } else if (act.action === "create-tab") {
        const tabName = act.tabName || "New Tab";
        const newDashId = await createNewDashboard(tabName);
        showMessage(`New multi-page dashboard tab '${tabName}' created.`, "success");
      } else if (act.action === "switch-tab") {
        const tabName = act.tabName || "";
        const allDash = getDashboardsList();
        const found = allDash.find(d => d.name.toLowerCase() === tabName.toLowerCase() || d.id === tabName);
        if (found) {
          await switchDashboard(found.id);
          showMessage(`Switched to dashboard tab '${found.name}'.`, "success");
        } else if (tabName) {
          await createNewDashboard(tabName);
          showMessage(`Created and switched to dashboard tab '${tabName}'.`, "success");
        }
      } else if (act.action === "move-chart-to-tab") {
        const dest = act.destinationTab || "New Tab";
        const targetChartId = act.target;

        if (targetChartId === "all" || !targetChartId) {
          // Move all charts currently in visualizations to dest
          const chartIds = visualizations.map(v => v.id);
          for (const cId of chartIds) {
            await moveChartToDashboard(cId, dest);
          }
          showMessage(`Moved ${chartIds.length} charts to tab '${dest}'.`, "success");
        } else {
          const success = await moveChartToDashboard(targetChartId, dest);
          if (success) {
            showMessage(`Chart moved to tab '${dest}'.`, "success");
          } else {
            showMessage(`Could not move chart to tab '${dest}'.`, "warning");
          }
        }
      } else if (act.action === "join-datasets") {
        const allDs = DatasetStore.getAllDatasets();
        if (allDs.length < 2) {
          showMessage("Multi-Dataset Join requires at least 2 loaded datasets. Please upload a secondary file.", "warning");
        } else {
          const leftDs = allDs.find(d => d.name.toLowerCase().includes((act.leftDataset || "").toLowerCase())) || allDs[0];
          const rightDs = allDs.find(d => d.id !== leftDs.id && d.name.toLowerCase().includes((act.rightDataset || "").toLowerCase())) || allDs.find(d => d.id !== leftDs.id) || allDs[1];
          
          const leftKey = act.leftKey || leftDs.headers[0];
          const rightKey = act.rightKey || rightDs.headers[0];

          const joinRes = DatasetStore.joinDatasets({
            leftDatasetId: leftDs.id,
            rightDatasetId: rightDs.id,
            leftKey: leftKey,
            rightKey: rightKey,
            joinType: act.joinType || "inner",
            outputDatasetName: `${leftDs.name}_${rightDs.name}_Merged`
          });

          if (joinRes.success) {
            showMessage(joinRes.message, "success");
          } else {
            showMessage(joinRes.message, "warning");
          }
        }
      }
    return { success: true, message: `Completed ${act.action}` };
  } catch (err: any) {
    console.error(`[Chat] Error executing single action ${act.action}:`, err);
    return { success: false, message: err?.message || `Failed to execute ${act.action}` };
  }
}

export async function executeAiActions(actions: AiAction[], targetMessageRow?: HTMLElement | null): Promise<void> {
  if (!actions || actions.length === 0) return;

  try {
    const plan = decomposeUserPrompt("Executing Autonomous Task Plan", actions);
    agentMultiTaskManager.registerPlan(plan);
    await agentMultiTaskManager.executePlan(plan, { targetRow: targetMessageRow });
  } catch (err) {
    console.error("[Chat] Error executing actions plan:", err);
  }
}

export function renderPermissionPrompt(actions: AiAction[], targetMessageRow?: HTMLElement | null): void {
  const chatHistoryDiv = document.getElementById("chatHistory");
  if (!chatHistoryDiv) return;

  const cardId = `perm-prompt-${Date.now()}`;
  const messageElement = document.createElement("div");
  messageElement.className = "card border-primary mb-3 shadow-sm slide-in-up";
  messageElement.id = cardId;
  messageElement.style.borderRadius = "12px";
  messageElement.style.overflow = "hidden";

  let listHTML = "";
  let previewsHTML = "";

  actions.forEach(act => {
    let desc = "";
    if (act.action === "clear-dashboard") {
      desc = `<i class="bi bi-trash3 text-danger me-2"></i> <strong>Clear Dashboard</strong> - Reset current visualizations`;
    } else if (act.action === "create-chart") {
      desc = `<i class="bi bi-graph-up-arrow text-primary me-2"></i> <strong>Create Chart</strong> - "${act.title || 'AI Chart'}" (${act.type || 'bar'} chart)`;
    } else if (act.action === "apply-effect") {
      desc = `<i class="bi bi-magic text-success me-2"></i> <strong>Apply Effect</strong> - "${act.effectId}" (Target: ${act.target || 'all'})`;
    } else if (act.action === "change-theme") {
      desc = `<i class="bi bi-paint-bucket text-info me-2"></i> <strong>Change Card Theme</strong> - "${act.themeId}" (Target: ${act.target || 'all'})`;
    } else if (act.action === "change-layout") {
      desc = `<i class="bi bi-grid-3x3-gap-fill text-warning me-2"></i> <strong>Change Layout</strong> - ${act.columns} Columns Grid`;
    } else if (act.action === "generate-mock-data") {
      desc = `<i class="bi bi-database-fill text-danger me-2"></i> <strong>Load Mock Data</strong> - "${act.category}" (${act.rowCount || 30} rows)`;
    } else if (act.action === "set-live-polling") {
      desc = `<i class="bi bi-clock-history text-dark me-2"></i> <strong>Live Polling</strong> - Interval: ${act.interval}s`;
    } else if (act.action === "create-template-card" || act.action === "add-template-card") {
      desc = `<i class="bi bi-grid-1x2-fill text-primary me-2"></i> <strong>Ready-Made Template Card</strong> - "${act.label || act.title || act.templateId || 'Gallery Card'}" (${act.category || act.templateCategory || 'KPI'})`;
    } else if (act.action === "create-kpi-card") {
      desc = `<i class="bi bi-graph-up-arrow text-success me-2"></i> <strong>Create KPI Card</strong> - "${act.label || act.title || (act.column ? `Total ${act.column}` : 'KPI Card')}" (Metric: ${act.column || 'Custom'})`;
    } else if (act.action === "create-sparkline") {
      desc = `<i class="bi bi-activity text-emerald-600 me-2"></i> <strong>Create Sparkline</strong> - "${act.label || act.title || (act.column ? `${act.column} Trend` : 'Sparkline')}" (${act.sparklineType || 'line'})`;
    } else if (act.action === "create-gauge") {
      desc = `<i class="bi bi-speedometer2 text-blue-600 me-2"></i> <strong>Create Gauge Meter</strong> - "${act.label || act.title || 'Gauge'}" (Value: ${act.value || 75}%)`;
    } else if (act.action === "create-progress") {
      desc = `<i class="bi bi-bar-chart-steps text-teal-600 me-2"></i> <strong>Create Progress Bar</strong> - "${act.label || act.title || 'Progress'}" (Value: ${act.value || 80}%)`;
    } else if (act.action === "create-textbox") {
      const isStyled = !!(act.textboxStyle || (act as any).style || act.label);
      desc = `<i class="bi ${isStyled ? 'bi-card-heading text-indigo-600' : 'bi-file-text text-primary'} me-2"></i> <strong>${isStyled ? 'Ready-Made Styled Textbox' : 'Add Notes Card'}</strong> - "${act.label || (act.content ? act.content.substring(0, 30) + '...' : 'Executive Text')}"`;
    } else if (act.action === "edit-template-card" || act.action === "update-template-card" || act.action === "edit-template") {
      desc = `<i class="bi bi-pencil-square text-emerald-600 me-2"></i> <strong>Edit Template Card</strong> - Target: "${act.target || 'Template'}" ${act.formula ? `(Formula: <code>${escapeHtml(act.formula)}</code>)` : ''} ${act.column ? `(Data Column: <strong>${escapeHtml(act.column)}</strong>)` : ''}`;
    } else if (act.action === "apply-template-formula" || act.action === "apply-formula") {
      desc = `<i class="bi bi-calculator-fill text-indigo-600 me-2"></i> <strong>Apply Template Formula</strong> - Target: "${act.target || 'Template'}", Formula: <code>${escapeHtml(act.formula || 'ƒ(x)')}</code>`;
    } else if (act.action === "export-dashboard") {
      desc = `<i class="bi bi-download text-secondary me-2"></i> <strong>Export Dashboard</strong> - Format: ${act.format}`;
    } else if (act.action === "generate-data-story") {
      desc = `<i class="bi bi-journal-text text-purple-600 me-2"></i> <strong>Executive Data Story</strong> - 3-paragraph strategic narrative`;
    } else if (act.action === "detect-anomalies") {
      desc = `<i class="bi bi-shield-exclamation text-amber-600 me-2"></i> <strong>Anomaly Detection</strong> - Statistical outlier scan (${act.column || 'All columns'})`;
    } else if (act.action === "filter-data") {
      desc = `<i class="bi bi-funnel-fill text-teal-600 me-2"></i> <strong>Natural Language Filter</strong> - ${act.displayQuery || `${act.column} ${act.operator} ${act.value}`}`;
    } else if (act.action === "calculate-column") {
      desc = `<i class="bi bi-calculator-fill text-emerald-600 me-2"></i> <strong>Calculated Field</strong> - Column [${act.columnName}] = ${act.formula}`;
    } else if (act.action === "forecast-chart") {
      desc = `<i class="bi bi-graph-up-arrow text-indigo-600 me-2"></i> <strong>Predictive Forecast</strong> - +${act.periods || 3} intervals projection`;
    } else if (act.action === "build-template-dashboard") {
      desc = `<i class="bi bi-speedometer2 text-blue-600 me-2"></i> <strong>Industry Dashboard</strong> - ${act.domain || 'Sales'} template layout`;
    } else if (act.action === "set-element-position" || act.action === "set-position" || act.action === "reposition-element") {
      desc = `<i class="bi bi-arrows-move text-indigo-600 me-2"></i> <strong>Set Element Position</strong> - Target: "${act.target || 'Element'}" (Zone: ${act.zone || 'custom'}, Pos: ${act.left ?? 0}x, ${act.top ?? 0}y)`;
    } else if (act.action === "arrange-dashboard-professionally" || act.action === "auto-layout-dashboard" || act.action === "arrange-professional") {
      desc = `<i class="bi bi-layout-wtf text-emerald-600 me-2"></i> <strong>Executive Professional Layout</strong> - Auto-arrange (Header Top, KPIs Horizon, Analytics 2-Col, Breakdowns Bottom)`;
    } else if (act.action === "design-professional-dashboard" || act.action === "build-professional-dashboard") {
      desc = `<i class="bi bi-award-fill text-amber-600 me-2"></i> <strong>Design Professional Dashboard</strong> - Complete executive layout synthesis tailored to data`;
    } else if (act.action.startsWith("presentation-") || act.action === "start-presentation" || act.action === "exit-presentation") {
      desc = `<i class="bi bi-projector-fill text-indigo-600 me-2"></i> <strong>Presentation Control</strong> - ${act.action.replace("presentation-", "").replace("-", " ")}`;
    } else {
      desc = `<i class="bi bi-gear-fill text-secondary me-2"></i> <strong>Action</strong>: ${act.action}`;
    }
    listHTML += `<li class="mb-2 text-dark small" style="line-height: 1.4;">${desc}</li>`;

    // Generate live mini preview
    const preview = generateActionPreviewCardHtml(act);
    if (preview) {
      previewsHTML += preview;
    }
  });

  messageElement.innerHTML = `
    <div class="card-header bg-slate-900 text-white py-2 px-3 d-flex align-items-center justify-content-between">
      <div class="d-flex align-items-center gap-2">
        <i class="bi bi-shield-lock-fill text-indigo-400"></i>
        <span class="fw-bold small">AI Dashboard Action Consent</span>
      </div>
      <span class="badge bg-primary text-white px-2 py-0.5 text-2xs">Approval Required</span>
    </div>
    <div class="card-body p-3 bg-white">
      <p class="text-secondary small mb-2.5">The assistant requests permission to perform the following updates:</p>
      <ul class="list-unstyled mb-2 border-bottom pb-2">
        ${listHTML}
      </ul>

      ${previewsHTML ? `
        <div class="mb-3">
          <div class="d-flex align-items-center justify-content-between mb-1">
            <span class="fw-bold text-slate-700 small" style="font-size: 11px;">
              <i class="bi bi-eye-fill text-indigo-500 me-1"></i> Live Action Preview (लाइव प्रिव्यू)
            </span>
            <span class="text-2xs text-muted">Previewing prospective results</span>
          </div>
          <div class="action-previews-container">
            ${previewsHTML}
          </div>
        </div>
      ` : ''}
      
      <div class="d-flex flex-wrap gap-2 justify-content-end">
        <button class="btn btn-xs btn-outline-secondary rounded-pill px-3 py-1 fw-bold" id="btnPermDeny-${cardId}">
          <i class="bi bi-x-circle me-1"></i> Deny
        </button>
        <button class="btn btn-xs btn-outline-primary rounded-pill px-3 py-1 fw-bold" id="btnPermAllowChat-${cardId}">
          <i class="bi bi-chat-text me-1"></i> Allow This Session
        </button>
        <button class="btn btn-xs btn-primary rounded-pill px-3 py-1 fw-bold text-white shadow-xs" id="btnPermAllowOnce-${cardId}">
          <i class="bi bi-check-circle-fill me-1"></i> Allow Once
        </button>
      </div>
    </div>
  `;

  chatHistoryDiv.appendChild(messageElement);
  scrollChatToBottom();

  document.getElementById(`btnPermAllowOnce-${cardId}`)?.addEventListener("click", () => {
    executeAiActions(actions, targetMessageRow);
    messageElement.remove();
    appendMessageElement("Actions approved and executed successfully.", "assistant", false, true);
  });

  document.getElementById(`btnPermAllowChat-${cardId}`)?.addEventListener("click", () => {
    chatPermissionMode = "this-chat";
    executeAiActions(actions, targetMessageRow);
    messageElement.remove();
    appendMessageElement("Actions approved for this session.", "assistant", false, true);
  });

  document.getElementById(`btnPermDeny-${cardId}`)?.addEventListener("click", () => {
    messageElement.remove();
    appendMessageElement("Action execution was cancelled.", "assistant", false, true);
  });
}

export async function validateAndExecuteActions(actions: AiAction[], targetMessageRow?: HTMLElement | null): Promise<void> {
  if (!actions || actions.length === 0) return;

  // Presentation & Board Meeting Kiosk actions execute immediately for fluid live interaction
  const isPresentationOnly = actions.every(a =>
    a.action.startsWith("presentation-") ||
    a.action === "start-presentation" ||
    a.action === "exit-presentation" ||
    a.action === "kiosk-mode" ||
    a.action === "board-meeting-mode" ||
    a.action === "next-slide" ||
    a.action === "prev-slide" ||
    a.action === "go-to-slide"
  );
  if (isPresentationOnly) {
    await executeAiActions(actions, targetMessageRow);
    return;
  }

  // Detect proposed chart, layout, tab, formula or dataset join change for the Live Mini Preview system
  const proposedPreviewAction = actions.find(a =>
    a.action === "create-chart" ||
    a.action === "edit-chart" ||
    a.action === "change-layout" ||
    a.action === "arrange-grid" ||
    a.action === "calculate-column" ||
    a.action === "create-tab" ||
    a.action === "switch-tab" ||
    a.action === "move-chart-to-tab" ||
    a.action === "join-datasets"
  );

  let targetBubble: HTMLElement | null = targetMessageRow?.querySelector(".chat-message-bubble") as HTMLElement | null;
  if (!targetBubble) {
    targetBubble = document.querySelector("#chatHistory .assistant-row:last-child .chat-message-bubble") as HTMLElement | null;
  }

  // Live Mini Preview inside chat bubble for chart or layout changes
  if (proposedPreviewAction && targetBubble && chatPermissionMode !== "always") {
    renderLiveMiniPreviewInsideBubble(targetBubble, {
      action: proposedPreviewAction,
      previewId: `prev_${Date.now()}`,
      onConfirm: async () => {
        await executeAiActions(actions, targetMessageRow);
      },
      onCancel: () => {
        appendMessageElement("Proposed action was cancelled by user.", "assistant", false, true);
      }
    });
    scrollChatToBottom();
    return;
  }

  if (chatPermissionMode === "always" || chatPermissionMode === "this-chat") {
    await executeAiActions(actions, targetMessageRow);
  } else {
    renderPermissionPrompt(actions, targetMessageRow);
  }
}

export async function checkForAndRenderAiChart(text: string, targetRow?: HTMLElement | null): Promise<void> {
  try {
    const actionsRegex = /```json-actions\s*([\s\S]*?)\s*```/;
    const actionsMatch = text.match(actionsRegex);
    if (actionsMatch && actionsMatch[1]) {
      const actions = JSON.parse(actionsMatch[1]);
      if (Array.isArray(actions)) {
        await validateAndExecuteActions(actions, targetRow);
        return;
      }
    }

    const chartRegex = /```json-chart\s*([\s\S]*?)\s*```/;
    const chartMatch = text.match(chartRegex);
    if (chartMatch && chartMatch[1]) {
      const chartDef = JSON.parse(chartMatch[1]);
      if (chartDef && chartDef.xAxis && chartDef.yAxes && chartDef.yAxes.length > 0) {
        const syntheticActions: AiAction[] = [{
          action: "create-chart",
          type: chartDef.type || "bar",
          title: chartDef.title || "AI Generated Chart",
          xAxis: chartDef.xAxis,
          yAxes: chartDef.yAxes
        }];
        await validateAndExecuteActions(syntheticActions, targetRow);
      }
    }
  } catch (e) {
    console.error("[Chat] Error parsing AI actions or charts:", e);
  }
}

// Function to generate a summary of current filtered data
export async function generateSummary(data?: any[]): Promise<void> {
  const summaryOutputDiv = document.getElementById("summaryOutput");
  const summaryTextDiv = document.getElementById("summaryText");
  if (!summaryOutputDiv || !summaryTextDiv) return;

  summaryOutputDiv.style.display = "block";
  summaryTextDiv.innerHTML =
    '<div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div> Generating executive summary...';

  const prompt = "Please provide an executive 3-point data summary. Detail key trends, highest performers, and notable anomalies or patterns.";

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        message: prompt,
        headers: headers || [],
        dataSample: data ? data.slice(0, 50) : [],
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    const result = await response.json();
    const summary = result.reply || "Summary not available.";
    summaryTextDiv.innerHTML = converter ? converter.makeHtml(summary) : summary;
  } catch (error: any) {
    console.error("[Chat] Error generating summary:", error);
    summaryTextDiv.innerHTML = `Could not generate summary. Error: ${error.message || error}`;
  }
}

// ============================================================================
// 5. Guided Interactive Form Wizards (Pure English)
// ============================================================================

export function renderInteractiveChartForm(): void {
  const chatHistoryDiv = document.getElementById("chatHistory");
  if (!chatHistoryDiv) return;

  const cardId = `chart-form-${Date.now()}`;
  const messageElement = document.createElement("div");
  messageElement.className = `card border-primary mb-3 shadow-sm`;
  messageElement.id = cardId;

  const headerOptions = (headers || [])
    .map(h => `<option value="${escapeHtml(h)}">${escapeHtml(h)}</option>`)
    .join("");

  messageElement.innerHTML = `
    <div class="card-header bg-primary text-white d-flex align-items-center py-2">
      <i class="bi bi-graph-up-arrow me-2"></i>
      <span class="fw-bold small">Guided Chart Builder</span>
    </div>
    <div class="card-body p-3">
      <p class="text-muted small mb-2">Select dimensions and metrics to plot a new visualization:</p>
      
      <div class="mb-3">
        <label class="form-label small fw-bold text-dark mb-1">1. Chart Type</label>
        <div class="d-flex flex-wrap gap-2">
          <div class="form-check form-check-inline m-0">
            <input class="form-check-input" type="radio" name="guidedChartType-${cardId}" id="typeBar-${cardId}" value="bar" checked>
            <label class="form-check-label small" for="typeBar-${cardId}"><i class="bi bi-bar-chart"></i> Bar</label>
          </div>
          <div class="form-check form-check-inline m-0">
            <input class="form-check-input" type="radio" name="guidedChartType-${cardId}" id="typeLine-${cardId}" value="line">
            <label class="form-check-label small" for="typeLine-${cardId}"><i class="bi bi-graph-up"></i> Line</label>
          </div>
          <div class="form-check form-check-inline m-0">
            <input class="form-check-input" type="radio" name="guidedChartType-${cardId}" id="typePie-${cardId}" value="pie">
            <label class="form-check-label small" for="typePie-${cardId}"><i class="bi bi-pie-chart"></i> Pie</label>
          </div>
          <div class="form-check form-check-inline m-0">
            <input class="form-check-input" type="radio" name="guidedChartType-${cardId}" id="typeScatter-${cardId}" value="scatter">
            <label class="form-check-label small" for="typeScatter-${cardId}"><i class="bi bi-dot"></i> Scatter</label>
          </div>
          <div class="form-check form-check-inline m-0">
            <input class="form-check-input" type="radio" name="guidedChartType-${cardId}" id="typeRadar-${cardId}" value="radar">
            <label class="form-check-label small" for="typeRadar-${cardId}"><i class="bi bi-hexagon"></i> Radar</label>
          </div>
          <div class="form-check form-check-inline m-0">
            <input class="form-check-input" type="radio" name="guidedChartType-${cardId}" id="typeTreemap-${cardId}" value="treemap">
            <label class="form-check-label small" for="typeTreemap-${cardId}"><i class="bi bi-grid-3x3-gap"></i> Treemap</label>
          </div>
        </div>
      </div>

      <div class="row g-2 mb-3">
        <div class="col-6">
          <label class="form-label small fw-bold text-dark mb-1">2. Category / Dimension (X-Axis)</label>
          <select class="form-select form-select-sm" id="guidedChartX-${cardId}">
            ${headerOptions || '<option value="">No headers loaded</option>'}
          </select>
        </div>
        <div class="col-6">
          <label class="form-label small fw-bold text-dark mb-1">3. Numeric Metric (Y-Axis)</label>
          <select class="form-select form-select-sm" id="guidedChartY-${cardId}">
            ${headerOptions || '<option value="">No headers loaded</option>'}
          </select>
        </div>
      </div>

      <div class="mb-3">
        <label class="form-label small fw-bold text-dark mb-1">4. Chart Title</label>
        <input type="text" class="form-control form-control-sm" id="guidedChartTitle-${cardId}" placeholder="e.g., Total Revenue by Region">
      </div>

      <div class="d-flex gap-2">
        <button class="btn btn-sm btn-primary flex-grow-1" id="btnSubmitChart-${cardId}">
          <i class="bi bi-plus-circle me-1"></i> Create Chart
        </button>
        <button class="btn btn-sm btn-outline-secondary" id="btnCancelChart-${cardId}">
          Cancel
        </button>
      </div>
    </div>
  `;

  chatHistoryDiv.appendChild(messageElement);
  scrollChatToBottom();

  const btnSubmit = document.getElementById(`btnSubmitChart-${cardId}`);
  const btnCancel = document.getElementById(`btnCancelChart-${cardId}`);

  btnCancel?.addEventListener("click", () => {
    messageElement.remove();
  });

  btnSubmit?.addEventListener("click", () => {
    const selectedTypeEl = messageElement.querySelector(`input[name="guidedChartType-${cardId}"]:checked`) as HTMLInputElement | null;
    const chartType = selectedTypeEl ? selectedTypeEl.value : 'bar';
    const xAxisVal = (document.getElementById(`guidedChartX-${cardId}`) as HTMLSelectElement)?.value;
    const yAxisVal = (document.getElementById(`guidedChartY-${cardId}`) as HTMLSelectElement)?.value;
    const chartTitle = (document.getElementById(`guidedChartTitle-${cardId}`) as HTMLInputElement)?.value.trim() || `${xAxisVal} vs ${yAxisVal}`;

    if (!xAxisVal || !yAxisVal) {
      alert("Please select columns for both X and Y axis.");
      return;
    }

    addVisualization(xAxisVal, [yAxisVal], null, chartType, chartTitle);

    messageElement.querySelectorAll("input, select, button").forEach(el => ((el as HTMLInputElement).disabled = true));
    if (btnSubmit) {
      btnSubmit.innerHTML = `<i class="bi bi-check-circle-fill"></i> Chart Created!`;
      btnSubmit.className = "btn btn-sm btn-success flex-grow-1 text-white";
    }
    if (btnCancel) btnCancel.style.display = "none";

    appendMessageElement(`Created a **${chartType}** chart ("${chartTitle}") with X-axis: **${xAxisVal}** and Y-axis: **${yAxisVal}**. 📊`, "assistant", false, true);
  });
}

export function renderInteractiveEffectForm(): void {
  const chatHistoryDiv = document.getElementById("chatHistory");
  if (!chatHistoryDiv) return;

  const cardId = `effect-form-${Date.now()}`;
  const messageElement = document.createElement("div");
  messageElement.className = `card border-success mb-3 shadow-sm`;
  messageElement.id = cardId;

  let chartOptionsHTML = `<option value="all">All Visualizations</option>`;
  if (visualizations && visualizations.length > 0) {
    visualizations.forEach(viz => {
      chartOptionsHTML += `<option value="${viz.id}">${escapeHtml(viz.title || 'Untitled')} (ID: ${viz.id.slice(0, 6)})</option>`;
    });
  } else {
    chartOptionsHTML += `<option value="" disabled>No charts on dashboard</option>`;
  }

  let effectOptionsHTML = "";
  chartEffectsTemplates.forEach((eff: any) => {
    effectOptionsHTML += `
      <div class="form-check mb-1">
        <input class="form-check-input" type="radio" name="guidedEffectStyle-${cardId}" id="eff-${eff.id}-${cardId}" value="${eff.id}" checked>
        <label class="form-check-label small" for="eff-${eff.id}-${cardId}">
          <strong>${eff.name}</strong> <span class="text-muted">(${eff.id.replace('effect-', '')})</span>
        </label>
      </div>
    `;
  });

  messageElement.innerHTML = `
    <div class="card-header bg-success text-white d-flex align-items-center py-2">
      <i class="bi bi-palette2 me-2"></i>
      <span class="fw-bold small">Visual Effects Assistant</span>
    </div>
    <div class="card-body p-3">
      <p class="text-muted small mb-2">Apply shaders, glows, and elevation styles to charts:</p>
      
      <div class="mb-3">
        <label class="form-label small fw-bold text-dark mb-1">1. Target Chart</label>
        <select class="form-select form-select-sm" id="guidedEffectTarget-${cardId}">
          ${chartOptionsHTML}
        </select>
      </div>

      <div class="mb-3">
        <label class="form-label small fw-bold text-dark mb-1">2. Choose Effect</label>
        <div style="max-height: 150px; overflow-y: auto;" class="border rounded p-2 bg-light">
          ${effectOptionsHTML}
        </div>
      </div>

      <div class="d-flex gap-2">
        <button class="btn btn-sm btn-success flex-grow-1 text-white" id="btnSubmitEffect-${cardId}">
          <i class="bi bi-magic me-1"></i> Apply Effect
        </button>
        <button class="btn btn-sm btn-outline-secondary" id="btnCancelEffect-${cardId}">
          Cancel
        </button>
      </div>
    </div>
  `;

  chatHistoryDiv.appendChild(messageElement);
  scrollChatToBottom();

  const btnSubmit = document.getElementById(`btnSubmitEffect-${cardId}`);
  const btnCancel = document.getElementById(`btnCancelEffect-${cardId}`);

  btnCancel?.addEventListener("click", () => {
    messageElement.remove();
  });

  btnSubmit?.addEventListener("click", () => {
    const targetChartId = (document.getElementById(`guidedEffectTarget-${cardId}`) as HTMLSelectElement)?.value;
    const selectedEffectRadio = messageElement.querySelector(`input[name="guidedEffectStyle-${cardId}"]:checked`) as HTMLInputElement | null;
    
    if (!targetChartId) {
      alert("Please select a target chart.");
      return;
    }
    if (!selectedEffectRadio) {
      alert("Please choose an effect.");
      return;
    }

    const effectId = selectedEffectRadio.value;
    const effectObj = chartEffectsTemplates.find((e: any) => e.id === effectId);

    if (!effectObj) {
      alert("Selected effect is unavailable.");
      return;
    }

    if (targetChartId === "all") {
      visualizations.forEach(viz => applyEffect(viz.id, effectObj));
      showMessage(`Applied "${effectObj.name}" effect to all charts. ✨`, "success");
      appendMessageElement(`Applied **"${effectObj.name}"** visual style across all dashboard charts. ✨`, "assistant", false, true);
    } else {
      const targetViz = visualizations.find(v => v.id === targetChartId);
      if (targetViz) {
        applyEffect(targetChartId, effectObj);
        showMessage(`Applied "${effectObj.name}" to "${targetViz.title}". ✨`, "success");
        appendMessageElement(`Applied **"${effectObj.name}"** visual style to **"${targetViz.title}"**. ✨`, "assistant", false, true);
      }
    }

    messageElement.querySelectorAll("input, select, button").forEach(el => ((el as HTMLInputElement).disabled = true));
    if (btnSubmit) {
      btnSubmit.innerHTML = `<i class="bi bi-check-circle-fill"></i> Effect Applied!`;
      btnSubmit.className = "btn btn-sm btn-secondary flex-grow-1 text-white";
    }
    if (btnCancel) btnCancel.style.display = "none";
  });
}

export function renderInteractiveThemeForm(): void {
  const chatHistoryDiv = document.getElementById("chatHistory");
  if (!chatHistoryDiv) return;

  const cardId = `theme-form-${Date.now()}`;
  const messageElement = document.createElement("div");
  messageElement.className = `card border-info mb-3 shadow-sm`;
  messageElement.id = cardId;

  let chartOptionsHTML = `<option value="all">All Charts</option>`;
  if (visualizations && visualizations.length > 0) {
    visualizations.forEach(viz => {
      chartOptionsHTML += `<option value="${viz.id}">${escapeHtml(viz.title || 'Untitled')} (ID: ${viz.id.slice(0, 6)})</option>`;
    });
  } else {
    chartOptionsHTML += `<option value="" disabled>No charts on dashboard</option>`;
  }

  const containerThemes = [
    { id: "default-container-color", name: "Classic Soft White" },
    { id: "blue-container-color", name: "Executive Slate Blue" },
    { id: "green-container-color", name: "Emerald Mint" },
    { id: "warm-container-color", name: "Warm Amber Sand" },
    { id: "dark-container-color", name: "Deep Charcoal" },
    { id: "sunset-orange", name: "Sunset Orange" },
    { id: "ocean-gradient", name: "Ocean Wave Gradient" },
    { id: "tropicalparadise", name: "Tropical Forest" },
    { id: "neondreams", name: "Cyber Neon Glow" }
  ];

  let themeOptionsHTML = "";
  containerThemes.forEach(t => {
    themeOptionsHTML += `
      <div class="form-check mb-1">
        <input class="form-check-input" type="radio" name="guidedThemeStyle-${cardId}" id="theme-${t.id}-${cardId}" value="${t.id}" checked>
        <label class="form-check-label small" for="theme-${t.id}-${cardId}">
          <strong>${t.name}</strong>
        </label>
      </div>
    `;
  });

  messageElement.innerHTML = `
    <div class="card-header bg-info text-dark d-flex align-items-center py-2">
      <i class="bi bi-paint-bucket me-2"></i>
      <span class="fw-bold small text-dark">Card Theme Customizer</span>
    </div>
    <div class="card-body p-3">
      <p class="text-muted small mb-2">Select a palette theme for the chart card containers:</p>
      
      <div class="mb-3">
        <label class="form-label small fw-bold text-dark mb-1">1. Target Chart</label>
        <select class="form-select form-select-sm" id="guidedThemeTarget-${cardId}">
          ${chartOptionsHTML}
        </select>
      </div>

      <div class="mb-3">
        <label class="form-label small fw-bold text-dark mb-1">2. Color Theme</label>
        <div style="max-height: 140px; overflow-y: auto;" class="border rounded p-2 bg-light">
          ${themeOptionsHTML}
        </div>
      </div>

      <div class="d-flex gap-2">
        <button class="btn btn-sm btn-info text-dark flex-grow-1 fw-bold" id="btnSubmitTheme-${cardId}">
          <i class="bi bi-check2-circle me-1"></i> Apply Theme
        </button>
        <button class="btn btn-sm btn-outline-secondary" id="btnCancelTheme-${cardId}">
          Cancel
        </button>
      </div>
    </div>
  `;

  chatHistoryDiv.appendChild(messageElement);
  scrollChatToBottom();

  const btnSubmit = document.getElementById(`btnSubmitTheme-${cardId}`);
  const btnCancel = document.getElementById(`btnCancelTheme-${cardId}`);

  btnCancel?.addEventListener("click", () => {
    messageElement.remove();
  });

  btnSubmit?.addEventListener("click", () => {
    const targetChartId = (document.getElementById(`guidedThemeTarget-${cardId}`) as HTMLSelectElement)?.value;
    const selectedThemeRadio = messageElement.querySelector(`input[name="guidedThemeStyle-${cardId}"]:checked`) as HTMLInputElement | null;
    
    if (!targetChartId || !selectedThemeRadio) {
      alert("Please select both target chart and theme.");
      return;
    }

    const themeId = selectedThemeRadio.value;
    const themeName = containerThemes.find(t => t.id === themeId)?.name || themeId;

    if (targetChartId === "all") {
      applyChartContainerColor(themeId, visualizations, true);
      showMessage(`Applied "${themeName}" to all cards. 🎨`, "success");
      appendMessageElement(`Applied **"${themeName}"** theme to all visualization cards. 🎨`, "assistant", false, true);
    } else {
      const targetViz = visualizations.find(v => v.id === targetChartId);
      if (targetViz) {
        applyChartContainerColor(themeId, [targetViz], false, [targetChartId]);
        showMessage(`Applied "${themeName}" to "${targetViz.title}". 🎨`, "success");
        appendMessageElement(`Applied **"${themeName}"** theme to **"${targetViz.title}"**. 🎨`, "assistant", false, true);
      }
    }

    messageElement.querySelectorAll("input, select, button").forEach(el => ((el as HTMLInputElement).disabled = true));
    if (btnSubmit) {
      btnSubmit.innerHTML = `<i class="bi bi-check-circle-fill"></i> Theme Applied!`;
      btnSubmit.className = "btn btn-sm btn-secondary flex-grow-1 text-white";
    }
    if (btnCancel) btnCancel.style.display = "none";
  });
}

export function renderInteractiveLayoutForm(): void {
  const chatHistoryDiv = document.getElementById("chatHistory");
  if (!chatHistoryDiv) return;

  const cardId = `layout-form-${Date.now()}`;
  const messageElement = document.createElement("div");
  messageElement.className = `card border-warning mb-3 shadow-sm`;
  messageElement.id = cardId;

  messageElement.innerHTML = `
    <div class="card-header bg-warning text-dark d-flex align-items-center py-2">
      <i class="bi bi-grid-3x3-gap-fill me-2"></i>
      <span class="fw-bold small text-dark">Grid Layout Controller</span>
    </div>
    <div class="card-body p-3">
      <p class="text-muted small mb-3">Rearrange all active charts into a symmetrical responsive grid:</p>
      
      <div class="d-grid gap-2 mb-3">
        <button class="btn btn-sm btn-outline-dark text-start" id="btnLayoutCol1-${cardId}">
          <i class="bi bi-distribute-vertical me-2"></i> <strong>Single Column (1 Col)</strong> - Full-width presentation
        </button>
        <button class="btn btn-sm btn-outline-dark text-start" id="btnLayoutCol2-${cardId}">
          <i class="bi bi-columns-gap me-2"></i> <strong>Dual Columns (2 Col)</strong> - Balanced dashboard view
        </button>
        <button class="btn btn-sm btn-outline-dark text-start" id="btnLayoutCol3-${cardId}">
          <i class="bi bi-grid-3x3-gap me-2"></i> <strong>Triple Columns (3 Col)</strong> - Dense overview
        </button>
      </div>

      <div class="border-top pt-2 d-flex gap-2">
        <button class="btn btn-sm btn-danger flex-grow-1 text-white" id="btnClearDashboard-${cardId}">
          <i class="bi bi-trash-fill me-1"></i> Clear Dashboard
        </button>
        <button class="btn btn-sm btn-outline-secondary" id="btnCancelLayout-${cardId}">
          Cancel
        </button>
      </div>
    </div>
  `;

  chatHistoryDiv.appendChild(messageElement);
  scrollChatToBottom();

  const btnCol1 = document.getElementById(`btnLayoutCol1-${cardId}`);
  const btnCol2 = document.getElementById(`btnLayoutCol2-${cardId}`);
  const btnCol3 = document.getElementById(`btnLayoutCol3-${cardId}`);
  const btnClear = document.getElementById(`btnClearDashboard-${cardId}`);
  const btnCancel = document.getElementById(`btnCancelLayout-${cardId}`);

  btnCancel?.addEventListener("click", () => {
    messageElement.remove();
  });

  const applyLayout = async (cols: number) => {
    await arrangeChartsInGrid(cols);
    showMessage(`Arranged dashboard into ${cols}-column grid. 📐`, "success");
    appendMessageElement(`Arranged all charts into a responsive **${cols}-column grid layout**. 📐`, "assistant", false, true);
    messageElement.remove();
  };

  btnCol1?.addEventListener("click", () => applyLayout(1));
  btnCol2?.addEventListener("click", () => applyLayout(2));
  btnCol3?.addEventListener("click", () => applyLayout(3));

  btnClear?.addEventListener("click", async () => {
    if (confirm("Are you sure you want to clear all active visualizations from the dashboard?")) {
      const activeVizs = [...visualizations];
      for (const viz of activeVizs) {
        await clearChart(viz.id);
      }
      showMessage("Dashboard cleared.", "info");
      appendMessageElement("Cleared all visualizations from the dashboard.", "assistant", false, true);
      messageElement.remove();
    }
  });
}

export function renderInteractiveDataForm(): void {
  const chatHistoryDiv = document.getElementById("chatHistory");
  if (!chatHistoryDiv) return;

  const cardId = `data-form-${Date.now()}`;
  const messageElement = document.createElement("div");
  messageElement.className = `card border-danger mb-3 shadow-sm`;
  messageElement.id = cardId;

  messageElement.innerHTML = `
    <div class="card-header bg-danger text-white d-flex align-items-center py-2">
      <i class="bi bi-database-fill-gear me-2"></i>
      <span class="fw-bold small">Mock Dataset Generator</span>
    </div>
    <div class="card-body p-3">
      <p class="text-muted small mb-2">Inject synthetic business datasets for rapid prototyping and testing:</p>
      
      <div class="mb-3">
        <label class="form-label small fw-bold text-dark mb-1">1. Industry Category</label>
        <select class="form-select form-select-sm" id="guidedDataTheme-${cardId}">
          <option value="sales">E-Commerce Retail Sales</option>
          <option value="finance">Corporate Budget & Financials</option>
          <option value="hr">HR Employee Performance & Salaries</option>
          <option value="iot">Smart IoT Sensor Telemetry</option>
          <option value="stock">Cryptocurrency & Stock Quotes</option>
        </select>
      </div>

      <div class="mb-3">
        <label class="form-label small fw-bold text-dark mb-1">2. Record Count</label>
        <select class="form-select form-select-sm" id="guidedDataRows-${cardId}">
          <option value="15">15 Records</option>
          <option value="30" selected>30 Records</option>
          <option value="50">50 Records</option>
          <option value="100">100 Records</option>
        </select>
      </div>

      <div class="d-flex gap-2">
        <button class="btn btn-sm btn-danger flex-grow-1 text-white" id="btnSubmitData-${cardId}">
          <i class="bi bi-lightning-fill me-1"></i> Load Dataset
        </button>
        <button class="btn btn-sm btn-outline-secondary" id="btnCancelData-${cardId}">
          Cancel
        </button>
      </div>
    </div>
  `;

  chatHistoryDiv.appendChild(messageElement);
  scrollChatToBottom();

  const btnSubmit = document.getElementById(`btnSubmitData-${cardId}`);
  const btnCancel = document.getElementById(`btnCancelData-${cardId}`);

  btnCancel?.addEventListener("click", () => {
    messageElement.remove();
  });

  btnSubmit?.addEventListener("click", () => {
    const selectedTheme = (document.getElementById(`guidedDataTheme-${cardId}`) as HTMLSelectElement)?.value;
    const rowCount = parseInt((document.getElementById(`guidedDataRows-${cardId}`) as HTMLSelectElement)?.value, 10);

    triggerMockDataUpdate(selectedTheme, rowCount);
    updateDatasetContextBadge();
    showMessage(`Loaded ${rowCount} synthetic records (${selectedTheme}). 🔄`, "success");
    appendMessageElement(`Generated and loaded **${rowCount} sample records** under category **"${selectedTheme}"**. You can now request visualizations or statistical insights!`, "assistant", false, true);

    messageElement.querySelectorAll("select, button").forEach(el => ((el as HTMLInputElement).disabled = true));
    if (btnSubmit) {
      btnSubmit.innerHTML = `<i class="bi bi-check-circle-fill"></i> Data Loaded!`;
      btnSubmit.className = "btn btn-sm btn-secondary flex-grow-1 text-white";
    }
    if (btnCancel) btnCancel.style.display = "none";
  });
}

export function renderInteractiveExportForm(): void {
  const chatHistoryDiv = document.getElementById("chatHistory");
  if (!chatHistoryDiv) return;

  const cardId = `export-form-${Date.now()}`;
  const messageElement = document.createElement("div");
  messageElement.className = `card border-secondary mb-3 shadow-sm`;
  messageElement.id = cardId;

  messageElement.innerHTML = `
    <div class="card-header bg-slate-800 text-white d-flex align-items-center py-2">
      <i class="bi bi-file-earmark-arrow-up-fill me-2"></i>
      <span class="fw-bold small">Export & Reports Center</span>
    </div>
    <div class="card-body p-3">
      <p class="text-muted small mb-3">Download raw datasets, formatted tabular reports, or dashboard visuals:</p>
      
      <div class="row g-2 mb-2">
        <div class="col-6">
          <button class="btn btn-sm btn-outline-primary w-100 text-start py-2" id="btnExportCSV-${cardId}">
            <i class="bi bi-filetype-csv me-1 text-success fs-6"></i> Export CSV
          </button>
        </div>
        <div class="col-6">
          <button class="btn btn-sm btn-outline-primary w-100 text-start py-2" id="btnExportExcel-${cardId}">
            <i class="bi bi-file-earmark-spreadsheet me-1 text-success fs-6"></i> Export Excel
          </button>
        </div>
      </div>

      <div class="row g-2 mb-3">
        <div class="col-6">
          <button class="btn btn-sm btn-outline-danger w-100 text-start py-2" id="btnExportPDFTable-${cardId}">
            <i class="bi bi-file-earmark-pdf me-1 text-danger fs-6"></i> PDF Data Table
          </button>
        </div>
        <div class="col-6">
          <button class="btn btn-sm btn-outline-dark w-100 text-start py-2" id="btnExportPNGDash-${cardId}">
            <i class="bi bi-image me-1 text-primary fs-6"></i> PNG Screenshot
          </button>
        </div>
      </div>

      <div class="d-grid mb-1">
        <button class="btn btn-sm btn-outline-danger py-2" id="btnExportPDFDash-${cardId}">
          <i class="bi bi-file-pdf-fill me-1 text-danger fs-6"></i> Full Dashboard PDF Document
        </button>
      </div>

      <div class="text-end mt-2">
        <button class="btn btn-sm btn-outline-secondary px-3" id="btnCancelExport-${cardId}">
          Close
        </button>
      </div>
    </div>
  `;

  chatHistoryDiv.appendChild(messageElement);
  scrollChatToBottom();

  const btnCSV = document.getElementById(`btnExportCSV-${cardId}`);
  const btnExcel = document.getElementById(`btnExportExcel-${cardId}`);
  const btnPDFTable = document.getElementById(`btnExportPDFTable-${cardId}`);
  const btnPNGDash = document.getElementById(`btnExportPNGDash-${cardId}`);
  const btnPDFDash = document.getElementById(`btnExportPDFDash-${cardId}`);
  const btnCancel = document.getElementById(`btnCancelExport-${cardId}`);

  btnCancel?.addEventListener("click", () => {
    messageElement.remove();
  });

  const handleExport = (action: string, filename?: string) => {
    try {
      if (!currentDataForChat || currentDataForChat.length === 0) {
        alert("No dataset available to export.");
        return;
      }
      
      if (action === "csv") {
        exportCsv(currentDataForChat, filename || "vedra_bi_data.csv");
      } else if (action === "excel") {
        exportExcel(currentDataForChat, filename || "vedra_bi_data.xlsx");
      } else if (action === "pdf_table") {
        exportPdf(currentDataForChat, headers || [], filename || "vedra_bi_data.pdf");
      } else if (action === "png_dash") {
        exportDashboardToPNG();
      } else if (action === "pdf_dash") {
        exportDashboardToPDF();
      }
      showMessage("Export completed successfully. 📥", "success");
    } catch (err: any) {
      console.error(err);
      alert(`Export error: ${err.message}`);
    }
  };

  btnCSV?.addEventListener("click", () => handleExport("csv", "vedra_bi_data.csv"));
  btnExcel?.addEventListener("click", () => handleExport("excel", "vedra_bi_data.xlsx"));
  btnPDFTable?.addEventListener("click", () => handleExport("pdf_table", "vedra_bi_data.pdf"));
  btnPNGDash?.addEventListener("click", () => handleExport("png_dash"));
  btnPDFDash?.addEventListener("click", () => handleExport("pdf_dash"));
}

export function renderInteractiveLivePollingForm(): void {
  const chatHistoryDiv = document.getElementById("chatHistory");
  if (!chatHistoryDiv) return;

  const cardId = `live-polling-form-${Date.now()}`;
  const messageElement = document.createElement("div");
  messageElement.className = `card border-dark mb-3 shadow-sm`;
  messageElement.id = cardId;

  messageElement.innerHTML = `
    <div class="card-header bg-dark text-white d-flex align-items-center py-2">
      <i class="bi bi-clock-history me-2 text-warning"></i>
      <span class="fw-bold small text-white">Live Data Polling Controller</span>
    </div>
    <div class="card-body p-3">
      <p class="text-muted small mb-2">Configure real-time periodic updates from an external API:</p>
      
      <div class="mb-2">
        <label class="form-label small fw-bold text-dark mb-1">1. API Endpoint URL</label>
        <input type="text" class="form-control form-control-sm" id="livePollingUrl-${cardId}" placeholder="https://api.example.com/telemetry" value="https://jsonplaceholder.typicode.com/todos">
      </div>

      <div class="mb-3">
        <label class="form-label small fw-bold text-dark mb-1">2. Polling Interval</label>
        <div class="d-flex gap-2 mb-2">
          <button type="button" class="btn btn-xs btn-outline-secondary btn-interval-${cardId}" data-sec="5">5s</button>
          <button type="button" class="btn btn-xs btn-outline-secondary btn-interval-${cardId} active" data-sec="10">10s</button>
          <button type="button" class="btn btn-xs btn-outline-secondary btn-interval-${cardId}" data-sec="30">30s</button>
          <button type="button" class="btn btn-xs btn-outline-secondary btn-interval-${cardId}" data-sec="60">60s</button>
        </div>
        <input type="number" class="form-control form-control-sm" id="livePollingCustomSec-${cardId}" placeholder="Seconds" value="10" min="2">
      </div>

      <div class="d-flex gap-2 mb-2">
        <button class="btn btn-sm btn-success flex-grow-1" id="btnStartPolling-${cardId}">
          <i class="bi bi-play-fill me-1"></i> Start Polling
        </button>
        <button class="btn btn-sm btn-warning text-dark" id="btnPausePolling-${cardId}">
          <i class="bi bi-pause-fill"></i> Pause
        </button>
        <button class="btn btn-sm btn-danger text-white" id="btnStopPolling-${cardId}">
          <i class="bi bi-stop-fill"></i> Stop
        </button>
      </div>

      <div class="text-end">
        <button class="btn btn-sm btn-outline-secondary" id="btnCancelPolling-${cardId}">
          Close
        </button>
      </div>
    </div>
  `;

  chatHistoryDiv.appendChild(messageElement);
  scrollChatToBottom();

  const btnCancel = document.getElementById(`btnCancelPolling-${cardId}`);
  const btnStart = document.getElementById(`btnStartPolling-${cardId}`) as HTMLButtonElement | null;
  const btnPause = document.getElementById(`btnPausePolling-${cardId}`);
  const btnStop = document.getElementById(`btnStopPolling-${cardId}`);
  const inputUrl = document.getElementById(`livePollingUrl-${cardId}`) as HTMLInputElement | null;
  const inputCustomSec = document.getElementById(`livePollingCustomSec-${cardId}`) as HTMLInputElement | null;
  const intervalBtns = messageElement.querySelectorAll(`.btn-interval-${cardId}`);

  intervalBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      intervalBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      if (inputCustomSec) {
        inputCustomSec.value = btn.getAttribute("data-sec") || "10";
      }
    });
  });

  btnCancel?.addEventListener("click", () => {
    messageElement.remove();
  });

  btnStart?.addEventListener("click", () => {
    const url = inputUrl ? inputUrl.value.trim() : "";
    const intervalSec = inputCustomSec ? parseInt(inputCustomSec.value, 10) : 10;

    if (!url) {
      alert("Please specify a valid API endpoint URL.");
      return;
    }
    if (isNaN(intervalSec) || intervalSec <= 0) {
      alert("Please enter a valid interval in seconds.");
      return;
    }

    startLiveUpdate(url, intervalSec);
    appendMessageElement(`Started live telemetry polling for **${url}** every **${intervalSec} seconds**. ⏰`, "assistant", false, true);
    
    if (btnStart) {
      btnStart.innerHTML = `<i class="bi bi-play-circle-fill"></i> Running...`;
      btnStart.disabled = true;
    }
  });

  btnPause?.addEventListener("click", () => {
    toggleLiveUpdatePause();
    appendMessageElement("Toggled live update pause/resume state. ⏸️", "assistant", false, true);
  });

  btnStop?.addEventListener("click", () => {
    stopLiveUpdate();
    appendMessageElement("Stopped live telemetry polling. 🛑", "assistant", false, true);
    if (btnStart) {
      btnStart.disabled = false;
      btnStart.innerHTML = `<i class="bi bi-play-fill"></i> Start Polling`;
    }
  });
}

export function renderInteractiveTextboxForm(): void {
  const chatHistoryDiv = document.getElementById("chatHistory");
  if (!chatHistoryDiv) return;

  const cardId = `textbox-form-${Date.now()}`;
  const messageElement = document.createElement("div");
  messageElement.className = `card border-primary mb-3 shadow-sm`;
  messageElement.id = cardId;

  messageElement.innerHTML = `
    <div class="card-header bg-primary text-white d-flex align-items-center py-2">
      <i class="bi bi-fonts me-2 text-warning"></i>
      <span class="fw-bold small text-white">Dashboard Annotation Note Maker</span>
    </div>
    <div class="card-body p-3">
      <p class="text-muted small mb-2">Create an annotation note card to highlight observations or KPI highlights:</p>
      
      <div class="mb-2">
        <label class="form-label small fw-bold text-dark mb-1">1. Note Content (Markdown or HTML)</label>
        <textarea class="form-control form-control-sm" id="textboxContent-${cardId}" rows="3" placeholder="Enter key observations, conclusions, or instructions...">Key Takeaways: Q3 Revenue grew 18% YoY driven by enterprise expansion.</textarea>
      </div>

      <div class="mb-3">
        <label class="form-label small fw-bold text-dark mb-1">2. Card Color</label>
        <div class="d-flex flex-wrap gap-1 align-items-center mb-1">
          <input type="color" class="form-control form-control-color form-control-sm p-0 border-0" id="textboxBgColor-${cardId}" value="#fff3cd" style="width: 35px; height: 35px; cursor: pointer;">
          <button class="btn btn-xs btn-outline-secondary py-1 px-2 btn-color-preset-${cardId}" data-color="#ffffff">White</button>
          <button class="btn btn-xs btn-outline-secondary py-1 px-2 btn-color-preset-${cardId}" data-color="#fff3cd">Amber</button>
          <button class="btn btn-xs btn-outline-secondary py-1 px-2 btn-color-preset-${cardId}" data-color="#cfe2ff">Blue</button>
          <button class="btn btn-xs btn-outline-secondary py-1 px-2 btn-color-preset-${cardId}" data-color="#d1e7dd">Mint</button>
          <button class="btn btn-xs btn-outline-secondary py-1 px-2 btn-color-preset-${cardId}" data-color="#f8d7da">Rose</button>
        </div>
      </div>

      <div class="d-flex gap-2">
        <button class="btn btn-sm btn-primary flex-grow-1 fw-bold text-white" id="btnCreateTextbox-${cardId}">
          <i class="bi bi-plus-circle-fill me-1"></i> Add Notes Card
        </button>
        <button class="btn btn-sm btn-outline-secondary" id="btnCancelTextbox-${cardId}">
          Cancel
        </button>
      </div>
    </div>
  `;

  chatHistoryDiv.appendChild(messageElement);
  scrollChatToBottom();

  const btnCancel = document.getElementById(`btnCancelTextbox-${cardId}`);
  const btnCreate = document.getElementById(`btnCreateTextbox-${cardId}`);
  const inputContent = document.getElementById(`textboxContent-${cardId}`) as HTMLTextAreaElement | null;
  const inputBgColor = document.getElementById(`textboxBgColor-${cardId}`) as HTMLInputElement | null;
  const colorPresets = messageElement.querySelectorAll(`.btn-color-preset-${cardId}`);

  colorPresets.forEach(btn => {
    btn.addEventListener("click", () => {
      if (inputBgColor) {
        inputBgColor.value = btn.getAttribute("data-color") || "#fff3cd";
      }
    });
  });

  btnCancel?.addEventListener("click", () => {
    messageElement.remove();
  });

  btnCreate?.addEventListener("click", () => {
    const content = inputContent ? inputContent.value.trim() : "";
    const bgColor = inputBgColor ? inputBgColor.value : "#fff3cd";

    if (!content) {
      alert("Please provide content for the notes card.");
      return;
    }

    const x = 160 + Math.random() * 80;
    const y = 160 + Math.random() * 80;

    createBox(x, y, 0, `<p>${escapeHtml(content)}</p>`, bgColor, "slide-in-up");
    appendMessageElement(`Added an annotation **notes card** to the dashboard canvas. 📝 You can drag and position it anywhere.`, "assistant", false, true);

    messageElement.querySelectorAll("input, textarea, button").forEach(el => ((el as HTMLInputElement).disabled = true));
    if (btnCreate) {
      btnCreate.innerHTML = `<i class="bi bi-check-circle-fill"></i> Card Created!`;
      btnCreate.className = "btn btn-sm btn-secondary flex-grow-1 text-white";
    }
    if (btnCancel) btnCancel.style.display = "none";
  });
}

export function renderInteractiveFilterForm(): void {
  const chatHistoryDiv = document.getElementById("chatHistory");
  if (!chatHistoryDiv) return;

  const cardId = `filter-form-${Date.now()}`;
  const messageElement = document.createElement("div");
  messageElement.className = "card border-teal mb-3 shadow-sm";
  messageElement.id = cardId;
  messageElement.style.borderColor = "#14b8a6";

  let headerOptions = "";
  (headers || []).forEach(h => {
    headerOptions += `<option value="${escapeHtml(h)}">${escapeHtml(h)}</option>`;
  });

  messageElement.innerHTML = `
    <div class="card-header bg-teal text-white d-flex align-items-center py-2" style="background-color: #0d9488;">
      <i class="bi bi-funnel me-2"></i>
      <span class="fw-bold small">Natural Language Data Filter</span>
    </div>
    <div class="card-body p-3">
      <p class="text-muted small mb-2">Filter the active dataset instantly across all visualizations:</p>

      <div class="row g-2 mb-2">
        <div class="col-5">
          <label class="form-label small fw-bold text-dark mb-1">Column</label>
          <select class="form-select form-select-sm" id="filterCol-${cardId}">
            ${headerOptions || '<option value="">No headers loaded</option>'}
          </select>
        </div>
        <div class="col-3">
          <label class="form-label small fw-bold text-dark mb-1">Operator</label>
          <select class="form-select form-select-sm" id="filterOp-${cardId}">
            <option value=">">&gt; (Greater)</option>
            <option value="<">&lt; (Less)</option>
            <option value=">=">&gt;= (At least)</option>
            <option value="<=">&lt;= (At most)</option>
            <option value="==" selected>== (Equals)</option>
            <option value="!=">!= (Not)</option>
            <option value="contains">Contains</option>
            <option value="top">Top N</option>
          </select>
        </div>
        <div class="col-4">
          <label class="form-label small fw-bold text-dark mb-1">Value</label>
          <input type="text" class="form-control form-control-sm" id="filterVal-${cardId}" placeholder="e.g. 50000 or North">
        </div>
      </div>

      <div class="d-flex gap-2">
        <button class="btn btn-sm btn-teal flex-grow-1 text-white fw-medium" id="btnSubmitFilter-${cardId}" style="background-color: #0d9488;">
          <i class="bi bi-funnel-fill me-1"></i> Apply Filter
        </button>
        <button class="btn btn-sm btn-outline-secondary" id="btnCancelFilter-${cardId}">
          Cancel
        </button>
      </div>
    </div>
  `;

  chatHistoryDiv.appendChild(messageElement);
  scrollChatToBottom();

  const btnCancel = document.getElementById(`btnCancelFilter-${cardId}`);
  const btnSubmit = document.getElementById(`btnSubmitFilter-${cardId}`);

  btnCancel?.addEventListener("click", () => messageElement.remove());

  btnSubmit?.addEventListener("click", () => {
    const col = (document.getElementById(`filterCol-${cardId}`) as HTMLSelectElement)?.value;
    const op = (document.getElementById(`filterOp-${cardId}`) as HTMLSelectElement)?.value as any;
    const val = (document.getElementById(`filterVal-${cardId}`) as HTMLInputElement)?.value.trim();

    if (!col || val === undefined || val === "") {
      alert("Please provide both column and filter value.");
      return;
    }

    validateAndExecuteActions([{
      action: "filter-data",
      column: col,
      operator: op,
      value: isNaN(Number(val)) ? val : Number(val),
      displayQuery: `${col} ${op} ${val}`
    }]);

    messageElement.remove();
  });
}

export function renderInteractiveCalculateForm(): void {
  const chatHistoryDiv = document.getElementById("chatHistory");
  if (!chatHistoryDiv) return;

  const cardId = `calc-form-${Date.now()}`;
  const messageElement = document.createElement("div");
  messageElement.className = "card border-emerald mb-3 shadow-sm";
  messageElement.id = cardId;
  messageElement.style.borderColor = "#10b981";

  let colBadges = "";
  (headers || []).forEach(h => {
    colBadges += `<button type="button" class="btn btn-xs btn-outline-success py-0 px-1.5 calc-col-btn" data-col="${escapeHtml(h)}">[${escapeHtml(h)}]</button>`;
  });

  messageElement.innerHTML = `
    <div class="card-header text-white d-flex align-items-center py-2" style="background-color: #059669;">
      <i class="bi bi-calculator me-2"></i>
      <span class="fw-bold small">AI Calculated Field Creator</span>
    </div>
    <div class="card-body p-3">
      <p class="text-muted small mb-2">Create custom calculated columns with mathematical formulas:</p>

      <div class="mb-2">
        <label class="form-label small fw-bold text-dark mb-1">New Column Name</label>
        <input type="text" class="form-control form-control-sm" id="calcColName-${cardId}" placeholder="e.g. ProfitMargin or NetRevenue">
      </div>

      <div class="mb-2">
        <label class="form-label small fw-bold text-dark mb-1">Formula</label>
        <input type="text" class="form-control form-control-sm font-monospace" id="calcFormula-${cardId}" placeholder="e.g. [Sales] - [Cost] or [Revenue] * 0.18">
      </div>

      <div class="mb-3">
        <label class="form-label small text-muted mb-1 d-block">Quick Column & Operator Inserts:</label>
        <div class="d-flex flex-wrap gap-1 mb-1">
          ${colBadges || '<span class="text-muted small">No headers</span>'}
        </div>
        <div class="d-flex gap-1">
          <button type="button" class="btn btn-xs btn-outline-secondary calc-op-btn" data-op="+">+</button>
          <button type="button" class="btn btn-xs btn-outline-secondary calc-op-btn" data-op="-">-</button>
          <button type="button" class="btn btn-xs btn-outline-secondary calc-op-btn" data-op="*">*</button>
          <button type="button" class="btn btn-xs btn-outline-secondary calc-op-btn" data-op="/">/</button>
          <button type="button" class="btn btn-xs btn-outline-secondary calc-op-btn" data-op="(">(</button>
          <button type="button" class="btn btn-xs btn-outline-secondary calc-op-btn" data-op=")">)</button>
        </div>
      </div>

      <div class="d-flex gap-2">
        <button class="btn btn-sm text-white flex-grow-1 fw-medium" id="btnSubmitCalc-${cardId}" style="background-color: #059669;">
          <i class="bi bi-check2-circle me-1"></i> Add Calculated Field
        </button>
        <button class="btn btn-sm btn-outline-secondary" id="btnCancelCalc-${cardId}">
          Cancel
        </button>
      </div>
    </div>
  `;

  chatHistoryDiv.appendChild(messageElement);
  scrollChatToBottom();

  const formulaInput = document.getElementById(`calcFormula-${cardId}`) as HTMLInputElement | null;
  messageElement.querySelectorAll(".calc-col-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      if (formulaInput) {
        formulaInput.value += ` [${btn.getAttribute("data-col")}] `;
        formulaInput.focus();
      }
    });
  });

  messageElement.querySelectorAll(".calc-op-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      if (formulaInput) {
        formulaInput.value += ` ${btn.getAttribute("data-op")} `;
        formulaInput.focus();
      }
    });
  });

  const btnCancel = document.getElementById(`btnCancelCalc-${cardId}`);
  const btnSubmit = document.getElementById(`btnSubmitCalc-${cardId}`);

  btnCancel?.addEventListener("click", () => messageElement.remove());

  btnSubmit?.addEventListener("click", () => {
    const colName = (document.getElementById(`calcColName-${cardId}`) as HTMLInputElement)?.value.trim();
    const formula = formulaInput?.value.trim();

    if (!colName || !formula) {
      alert("Please provide both column name and formula.");
      return;
    }

    validateAndExecuteActions([{
      action: "calculate-column",
      columnName: colName,
      formula: formula
    }]);

    messageElement.remove();
  });
}

export function renderInteractiveTemplateForm(): void {
  const chatHistoryDiv = document.getElementById("chatHistory");
  if (!chatHistoryDiv) return;

  const cardId = `template-form-${Date.now()}`;
  const messageElement = document.createElement("div");
  messageElement.className = "card border-primary mb-3 shadow-sm";
  messageElement.id = cardId;

  messageElement.innerHTML = `
    <div class="card-header bg-primary text-white d-flex align-items-center py-2">
      <i class="bi bi-speedometer2 me-2"></i>
      <span class="fw-bold small">1-Click Industry Dashboard Builder</span>
    </div>
    <div class="card-body p-3">
      <p class="text-muted small mb-2">Instantly generate a complete suite of executive KPIs, bar, line, and radar visualizations:</p>

      <div class="mb-3">
        <label class="form-label small fw-bold text-dark mb-1">Select Domain Archetype</label>
        <div class="d-flex flex-column gap-2">
          <label class="border rounded p-2 d-flex align-items-center gap-2 cursor-pointer bg-light">
            <input type="radio" name="templateDomain-${cardId}" value="sales" checked>
            <div>
              <div class="fw-bold small text-dark"><i class="bi bi-cart4 text-primary me-1"></i> Sales & Revenue Intelligence</div>
              <div class="text-muted" style="font-size: 11px;">Regional breakdown, product distribution, executive summary KPIs</div>
            </div>
          </label>
          <label class="border rounded p-2 d-flex align-items-center gap-2 cursor-pointer bg-light">
            <input type="radio" name="templateDomain-${cardId}" value="finance">
            <div>
              <div class="fw-bold small text-dark"><i class="bi bi-cash-stack text-success me-1"></i> Financial Performance & Margins</div>
              <div class="text-muted" style="font-size: 11px;">Profitability trends, expense trajectory, margin analysis</div>
            </div>
          </label>
          <label class="border rounded p-2 d-flex align-items-center gap-2 cursor-pointer bg-light">
            <input type="radio" name="templateDomain-${cardId}" value="hr">
            <div>
              <div class="fw-bold small text-dark"><i class="bi bi-people text-info me-1"></i> Human Resources & Talent</div>
              <div class="text-muted" style="font-size: 11px;">Headcount, department compensation, employee tenure</div>
            </div>
          </label>
          <label class="border rounded p-2 d-flex align-items-center gap-2 cursor-pointer bg-light">
            <input type="radio" name="templateDomain-${cardId}" value="operations">
            <div>
              <div class="fw-bold small text-dark"><i class="bi bi-gear-wide-connected text-warning me-1"></i> Operations & Logistics</div>
              <div class="text-muted" style="font-size: 11px;">Fulfillment throughput, inventory levels, lead-time variance</div>
            </div>
          </label>
        </div>
      </div>

      <div class="d-flex gap-2">
        <button class="btn btn-sm btn-primary flex-grow-1 fw-medium text-white" id="btnSubmitTemplate-${cardId}">
          <i class="bi bi-lightning-charge-fill me-1"></i> Build Dashboard
        </button>
        <button class="btn btn-sm btn-outline-secondary" id="btnCancelTemplate-${cardId}">
          Cancel
        </button>
      </div>
    </div>
  `;

  chatHistoryDiv.appendChild(messageElement);
  scrollChatToBottom();

  const btnCancel = document.getElementById(`btnCancelTemplate-${cardId}`);
  const btnSubmit = document.getElementById(`btnSubmitTemplate-${cardId}`);

  btnCancel?.addEventListener("click", () => messageElement.remove());

  btnSubmit?.addEventListener("click", () => {
    const selectedRadio = messageElement.querySelector(`input[name="templateDomain-${cardId}"]:checked`) as HTMLInputElement | null;
    const domain = (selectedRadio ? selectedRadio.value : "sales") as any;

    validateAndExecuteActions([{
      action: "build-template-dashboard",
      domain: domain
    }]);

    messageElement.remove();
  });
}

// ============================================================================
// 6. UI Initialization & Event Attachment
// ============================================================================

export function updateCharCounter(): void {
  const chatInput = document.getElementById("chatInput") as HTMLTextAreaElement | null;
  const charCountEl = document.getElementById("charCount");
  const sendBtn = document.getElementById("sendChatBtn") as HTMLButtonElement | null;

  if (chatInput && charCountEl) {
    const len = chatInput.value.length;
    charCountEl.textContent = String(len);
    if (sendBtn) {
      sendBtn.disabled = len === 0;
    }
  }
}

let isChatUIInitialized = false;

export function initializeChatUI(): void {
  // 1. Load Sessions and Render
  loadSessions();
  renderSessionsList();
  renderActiveSessionHistory();
  updateChatHeaderTitle();
  updateDatasetContextBadge();

  if (isChatUIInitialized) return;
  isChatUIInitialized = true;

  // 2. Chat Input and Send Button
  const chatInput = document.getElementById("chatInput") as HTMLTextAreaElement | null;
  const sendChatBtn = document.getElementById("sendChatBtn");

  if (chatInput) {
    chatInput.addEventListener("input", () => {
      // Auto expand height up to 160px
      chatInput.style.height = "auto";
      chatInput.style.height = `${Math.min(chatInput.scrollHeight, 160)}px`;
      updateCharCounter();
    });

    chatInput.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendChatMessage();
      }
    });
  }

  if (sendChatBtn) {
    sendChatBtn.addEventListener("click", () => sendChatMessage());
  }

  // 3. Quick Prompt Buttons
  bindQuickPromptButtons();

  // 4. Voice Input (Speech-to-Text)
  const voiceBtn = document.getElementById("chatVoiceInputBtn");
  if (voiceBtn) {
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognitionAPI) {
      speechRecognizer = new SpeechRecognitionAPI();
      speechRecognizer.continuous = false;
      speechRecognizer.interimResults = false;
      speechRecognizer.lang = "en-US";

      speechRecognizer.onstart = () => {
        isSpeechRecognitionActive = true;
        voiceBtn.classList.add("listening", "text-danger");
        voiceBtn.title = "Listening... Speak clearly";
      };

      speechRecognizer.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (chatInput && transcript) {
          chatInput.value = (chatInput.value ? chatInput.value + " " : "") + transcript;
          updateCharCounter();
          chatInput.focus();
        }
      };

      speechRecognizer.onerror = (event: any) => {
        console.warn("[Chat] Voice speech error:", event.error);
        voiceBtn.classList.remove("listening", "text-danger");
        isSpeechRecognitionActive = false;
        voiceBtn.title = "Voice Input (Speech-to-Text)";
      };

      speechRecognizer.onend = () => {
        voiceBtn.classList.remove("listening", "text-danger");
        isSpeechRecognitionActive = false;
        voiceBtn.title = "Voice Input (Speech-to-Text)";
      };

      voiceBtn.addEventListener("click", () => {
        if (!speechRecognizer) return;
        if (isSpeechRecognitionActive) {
          speechRecognizer.stop();
        } else {
          try {
            speechRecognizer.start();
          } catch (err) {
            console.warn("Speech recognition already started:", err);
          }
        }
      });
    } else {
      voiceBtn.title = "Voice recognition is not supported in this browser";
      voiceBtn.classList.add("opacity-50");
    }
  }

  // 5. Popup Show / Hide
  const chatBtn = document.getElementById("openChatBtn");
  const chatPopup = document.getElementById("chatPopup");
  const closeChatBtn = document.getElementById("closeChatBtn");

  if (chatBtn && chatPopup) {
    chatBtn.addEventListener("click", () => {
      chatPopup.classList.toggle("show");
      updateDatasetContextBadge();
      if (chatPopup.classList.contains("show")) {
        scrollChatToBottom();
        setTimeout(() => {
          chatInput?.focus();
          scrollChatToBottom();
        }, 150);
      }
    });
  }

  if (closeChatBtn && chatPopup) {
    closeChatBtn.addEventListener("click", () => {
      chatPopup.classList.remove("show");
    });
  }

  // 6. Fullscreen Toggle
  const toggleChatFullscreenBtn = document.getElementById("toggleChatFullscreenBtn");
  const chatFullscreenIcon = document.getElementById("chatFullscreenIcon");
  const toggleChatSidebarBtn = document.getElementById("toggleChatSidebarBtn");
  const exportChatHistoryBtn = document.getElementById("exportChatHistoryBtn");

  if (toggleChatFullscreenBtn && chatPopup && chatFullscreenIcon) {
    toggleChatFullscreenBtn.addEventListener("click", () => {
      const isFullscreen = chatPopup.classList.toggle("fullscreen");
      if (isFullscreen) {
        chatFullscreenIcon.className = "bi bi-fullscreen-exit";
        toggleChatFullscreenBtn.title = "Exit Fullscreen";
      } else {
        chatFullscreenIcon.className = "bi bi-fullscreen";
        toggleChatFullscreenBtn.title = "Fullscreen";
      }
      setTimeout(scrollChatToBottom, 120);
    });
  }

  // 7. Sidebar Toggles (Side-by-side management)
  const chatSidebar = document.getElementById("chatSidebar");
  const chatSidebarCloseBtn = document.getElementById("chatSidebarCloseBtn");

  if (toggleChatSidebarBtn && chatSidebar) {
    toggleChatSidebarBtn.addEventListener("click", () => {
      chatSidebar.classList.toggle("sidebar-collapsed");
      const isCollapsed = chatSidebar.classList.contains("sidebar-collapsed");
      toggleChatSidebarBtn.classList.toggle("active", !isCollapsed);
      setTimeout(scrollChatToBottom, 150);
    });
  }

  if (chatSidebarCloseBtn && chatSidebar) {
    chatSidebarCloseBtn.addEventListener("click", () => {
      chatSidebar.classList.add("sidebar-collapsed");
      toggleChatSidebarBtn?.classList.remove("active");
      setTimeout(scrollChatToBottom, 150);
    });
  }

  // 8. New Session & Search
  const newSessionBtn = document.getElementById("chatNewSessionBtn");
  if (newSessionBtn) {
    newSessionBtn.addEventListener("click", () => createNewSession());
  }

  const sessionSearchInput = document.getElementById("chatSessionSearchInput") as HTMLInputElement | null;
  if (sessionSearchInput) {
    sessionSearchInput.addEventListener("input", () => {
      renderSessionsList(sessionSearchInput.value);
    });
  }

  // 9. Export & Clear
  if (exportChatHistoryBtn) {
    exportChatHistoryBtn.addEventListener("click", () => exportCurrentSession());
  }

  const clearChatBtn = document.getElementById("clearChatBtn");
  if (clearChatBtn) {
    clearChatBtn.addEventListener("click", () => clearChatHistory());
  }

  // 10. Agent Mode Switch
  const toggleAgentMode = document.getElementById("toggleAgentMode") as HTMLInputElement | null;
  const agentModeBadge = document.getElementById("agentModeBadge");
  const agentControlDeck = document.getElementById("agentControlDeck");

  if (toggleAgentMode && agentModeBadge) {
    toggleAgentMode.addEventListener("change", (e) => {
      const target = e.target as HTMLInputElement;
      if (target && target.checked) {
        agentModeBadge.textContent = "Agent Mode: Active";
        agentModeBadge.className = "badge bg-success text-white small pulse-badge";
        if (agentControlDeck) agentControlDeck.classList.remove("d-none");
        appendMessageElement("**Agent Mode Active.** Autonomous execution enabled. You can now prompt natural language actions or use the quick chips above.", "assistant", false, false);
      } else {
        agentModeBadge.textContent = "Agent Mode: Standard";
        agentModeBadge.className = "badge bg-secondary text-white small";
        if (agentControlDeck) agentControlDeck.classList.add("d-none");
      }
    });
  }

  // 11. Agent Control Deck Buttons
  document.getElementById("agentCmdMultiTaskPlan")?.addEventListener("click", () => {
    sendChatMessage("1. Clean data and eliminate duplicates 2. Create comparative bar chart 3. Create Total Sales KPI card 4. Run anomaly detection scan");
  });

  const toggleTaskTrayBtn = document.getElementById("toggleTaskTrayBtn");
  const taskTrayDrawer = document.getElementById("agentTaskTrayDrawer");
  const closeTaskTrayDrawerBtn = document.getElementById("closeTaskTrayDrawerBtn");

  toggleTaskTrayBtn?.addEventListener("click", () => {
    if (taskTrayDrawer) {
      taskTrayDrawer.classList.toggle("d-none");
      if (!taskTrayDrawer.classList.contains("d-none")) {
        updateTaskTrayUI();
      }
    }
  });

  closeTaskTrayDrawerBtn?.addEventListener("click", () => {
    taskTrayDrawer?.classList.add("d-none");
  });

  document.getElementById("trayQuickAuditBtn")?.addEventListener("click", async () => {
    taskTrayDrawer?.classList.add("d-none");
    sendChatMessage("1. Clean dataset 2. Create bar chart for distribution 3. Create KPI card for revenue 4. Run anomaly scan");
  });

  document.getElementById("trayQuickReportBtn")?.addEventListener("click", async () => {
    taskTrayDrawer?.classList.add("d-none");
    sendChatMessage("1. Create Gross Margin KPI card 2. Run predictive trend forecast 3. Run root cause analysis 4. Generate executive data story");
  });

  document.getElementById("agentCmdAutoPilot")?.addEventListener("click", () => {
    sendChatMessage("मेरे इस सेल्स डेटा का एक प्रोफेशनल एक्जीक्यूटिव डैशबोर्ड बना दो");
  });
  document.getElementById("agentCmdExecReport")?.addEventListener("click", () => {
    sendChatMessage("एक्जीक्यूटिव रिपोर्ट एक्सपोर्ट करो (AI Report to PDF/PPT)");
  });
  document.getElementById("agentCmdCleanData")?.addEventListener("click", () => {
    sendChatMessage("डेटा साफ करो और डुप्लिकेट्स हटाओ");
  });
  document.getElementById("agentCmdKnowledgeBase")?.addEventListener("click", () => {
    sendChatMessage("एजेंट नॉलेज बेस: 15+ फॉर्मूले और बिजनेस लॉजिक खोलो");
  });
  document.getElementById("agentCmdFormulaHandbook")?.addEventListener("click", () => {
    sendChatMessage("लर्निंग मेनू के 15 फॉर्मूले दिखाओ और टेम्पलेट पर कैसे लगाएं?");
  });
  document.getElementById("agentCmdWhatIf")?.addEventListener("click", () => {
    sendChatMessage("What-If संवेदनशीलता एवं परिदृश्य सिमुलेटर खोलो");
  });
  document.getElementById("agentCmdRootCause")?.addEventListener("click", () => {
    sendChatMessage("रूट-कॉज़ डायग्नोस्टिक्स ('Why' Analysis) करो");
  });
  document.getElementById("agentCmdCrossFilter")?.addEventListener("click", () => {
    sendChatMessage("क्रॉस-फ़िल्टरिंग ऑन करो");
  });
  document.getElementById("agentCmdBenchmark")?.addEventListener("click", () => {
    sendChatMessage("चार्ट पर 5 लाख का टार्गेट बेंचमार्क लाइन लगाओ");
  });
  document.getElementById("agentCmdBoardMeeting")?.addEventListener("click", () => {
    sendChatMessage("बोर्ड मीटिंग प्रेजेंटेशन मोड शुरू करो");
  });

  document.getElementById("agentCmdChart")?.addEventListener("click", renderInteractiveChartForm);
  document.getElementById("agentCmdEffect")?.addEventListener("click", renderInteractiveEffectForm);
  document.getElementById("agentCmdTheme")?.addEventListener("click", renderInteractiveThemeForm);
  document.getElementById("agentCmdLayout")?.addEventListener("click", renderInteractiveLayoutForm);
  document.getElementById("agentCmdData")?.addEventListener("click", renderInteractiveDataForm);
  document.getElementById("agentCmdLive")?.addEventListener("click", renderInteractiveLivePollingForm);
  document.getElementById("agentCmdTextbox")?.addEventListener("click", renderInteractiveTextboxForm);
  document.getElementById("agentCmdExport")?.addEventListener("click", renderInteractiveExportForm);

  // Advanced Agent Features Deck Buttons
  document.getElementById("agentCmdInventory")?.addEventListener("click", () => {
    sendChatMessage("What charts and KPI cards are currently present on my dashboard canvas? Give me a full inventory with types and containers.");
  });
  document.getElementById("agentCmdStory")?.addEventListener("click", () => {
    validateAndExecuteActions([{ action: "generate-data-story" }]);
  });
  document.getElementById("agentCmdAnomaly")?.addEventListener("click", () => {
    validateAndExecuteActions([{ action: "detect-anomalies" }]);
  });
  document.getElementById("agentCmdFilter")?.addEventListener("click", renderInteractiveFilterForm);
  document.getElementById("agentCmdCalculate")?.addEventListener("click", renderInteractiveCalculateForm);
  document.getElementById("agentCmdForecast")?.addEventListener("click", () => {
    validateAndExecuteActions([{ action: "forecast-chart", periods: 3 }]);
  });
  document.getElementById("agentCmdTemplate")?.addEventListener("click", renderInteractiveTemplateForm);

  // 12. Voice Assistant Speech Output Toggle
  const toggleChatSpeechBtn = document.getElementById("toggleChatSpeechBtn");
  const chatSpeechIcon = document.getElementById("chatSpeechIcon");
  if (toggleChatSpeechBtn && chatSpeechIcon) {
    if (isVoiceResponseEnabled) {
      chatSpeechIcon.className = "bi bi-volume-up-fill text-primary";
      toggleChatSpeechBtn.classList.add("active");
    }
    toggleChatSpeechBtn.addEventListener("click", () => {
      isVoiceResponseEnabled = !isVoiceResponseEnabled;
      localStorage.setItem("vedra_voice_response_enabled", String(isVoiceResponseEnabled));
      if (isVoiceResponseEnabled) {
        chatSpeechIcon.className = "bi bi-volume-up-fill text-primary";
        toggleChatSpeechBtn.classList.add("active");
        showMessage("Voice narration enabled. / आवाज़ में उत्तर चालू कर दिया गया।", "info");
      } else {
        stopSpeaking();
        chatSpeechIcon.className = "bi bi-volume-mute text-secondary";
        toggleChatSpeechBtn.classList.remove("active");
        showMessage("Voice narration muted. / आवाज़ में उत्तर म्यूट किया गया।", "info");
      }
    });
  }

  // 13. Smart Context Memory: Clear Focused Target Chip
  document.getElementById("btnClearFocusedTarget")?.addEventListener("click", () => {
    setFocusedChart(null);
  });

  // Global window bindings for charts.ts & developer console access
  (window as any).setChatFocusedChart = setFocusedChart;
  (window as any).getChatFocusedChart = getFocusedChart;
  (window as any).getDashboardInventory = getDashboardInventory;
  (window as any).undoAiAction = undoAiAction;
  (window as any).redoAiAction = redoAiAction;
  (window as any).speakMessageText = speakMessageText;
  (window as any).stopSpeaking = stopSpeaking;
  (window as any).updateTaskTrayUI = updateTaskTrayUI;
}

export function updateTaskTrayUI(): void {
  const metrics = agentMultiTaskManager.getMetrics();
  const countEl = document.getElementById("trayMetricTasksCount");
  const successEl = document.getElementById("trayMetricSuccessRate");
  const speedEl = document.getElementById("trayMetricAvgSpeed");
  const container = document.getElementById("trayActivePlansContainer");

  if (countEl) countEl.textContent = String(metrics.totalTasksExecuted);
  if (successEl) {
    const rate = metrics.totalTasksExecuted > 0 
      ? Math.round((metrics.totalTasksSucceeded / metrics.totalTasksExecuted) * 100) 
      : 100;
    successEl.textContent = `${rate}%`;
  }
  if (speedEl) speedEl.textContent = `${metrics.avgTaskDurationMs}ms`;

  if (container) {
    const plans = agentMultiTaskManager.getAllPlans().slice(0, 5);
    if (plans.length === 0) {
      container.innerHTML = `
        <div class="text-xs text-muted text-center py-2" id="trayEmptyState">
          <i class="bi bi-check2-circle text-emerald-500 me-1"></i>Multitasking worker pool ready. Break down prompts and execute task-by-task.
        </div>
      `;
    } else {
      container.innerHTML = plans.map(p => `
        <div class="p-2 rounded bg-white border border-slate-200 shadow-2xs d-flex align-items-center justify-content-between">
          <div class="text-truncate me-2" style="max-width: 70%;">
            <div class="text-xs fw-semibold text-truncate text-dark">${p.originalPrompt.substring(0, 32) || 'Autonomous Task Plan'}</div>
            <div class="text-3xs text-muted">${p.completedTasks}/${p.totalTasks} tasks • ${p.mode.toUpperCase()}</div>
          </div>
          <span class="badge rounded-pill text-3xs ${p.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : p.status === 'running' ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-800'}">
            ${p.status.toUpperCase()}
          </span>
        </div>
      `).join('');
    }
  }
}

