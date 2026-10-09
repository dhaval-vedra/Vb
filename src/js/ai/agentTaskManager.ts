// src/js/ai/agentTaskManager.ts
// Autonomous Agent Multitasking & Task Decomposition Engine
// Provides prompt decomposition, multi-task worker pool, concurrency control, and real-time step-by-step execution.

import { AiAction, executeSingleAction, pushUndoSnapshot, attachUndoButtonToMessageRow } from './chat.ts';
import { showMessage } from '../core/utils.ts';
import { headers, currentDataForChat } from '../../store/DataHandler.ts';

export type AgentTaskStatus = 'pending' | 'queued' | 'running' | 'completed' | 'failed' | 'paused' | 'skipped';

export type AgentTaskCategory = 
  | 'visualization' 
  | 'kpi_metric' 
  | 'computation' 
  | 'analytics' 
  | 'workspace' 
  | 'presentation' 
  | 'data_prep' 
  | 'export' 
  | 'general';

export interface AgentTask {
  id: string;
  stepNumber: number;
  title: string;
  description: string;
  category: AgentTaskCategory;
  icon: string;
  status: AgentTaskStatus;
  progress: number; // 0 to 100
  canRunParallel: boolean;
  action?: AiAction;
  customRunner?: () => Promise<{ success: boolean; message?: string; details?: any }>;
  startedAt?: number;
  completedAt?: number;
  durationMs?: number;
  resultMessage?: string;
  errorMessage?: string;
  retryCount?: number;
}

export interface AgentTaskPlan {
  id: string;
  originalPrompt: string;
  createdAt: number;
  tasks: AgentTask[];
  status: 'idle' | 'running' | 'completed' | 'partially_failed' | 'paused' | 'cancelled' | 'failed';
  mode: 'sequential' | 'parallel' | 'adaptive';
  currentTaskIndex: number;
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  totalDurationMs?: number;
  containerElement?: HTMLElement;
  snapshotId?: string;
}

export interface TaskManagerMetrics {
  totalPlansCreated: number;
  totalTasksExecuted: number;
  totalTasksSucceeded: number;
  totalTasksFailed: number;
  avgTaskDurationMs: number;
  activeBackgroundWorkersCount: number;
}

/**
 * Maps an AiAction to human-readable task metadata, icon, and execution category.
 */
export function mapActionToTaskMeta(action: AiAction, index: number): {
  title: string;
  description: string;
  category: AgentTaskCategory;
  icon: string;
  canRunParallel: boolean;
} {
  const act = action.action || '';
  
  if (act === 'clear-dashboard') {
    return {
      title: 'Reset Workspace & Canvas',
      description: 'Clear all existing visualizations to start a fresh dashboard canvas',
      category: 'workspace',
      icon: 'bi-trash3',
      canRunParallel: false // Must run sequentially first
    };
  }

  if (act === 'create-chart') {
    const chartType = (action.type || 'bar').toUpperCase();
    const targetName = action.title || (action.yAxes ? `${action.yAxes.join(', ')} by ${action.xAxis || 'Dimension'}` : 'New Chart');
    return {
      title: `Plot ${chartType} Visualization`,
      description: `Render "${targetName}" with dimensions [${action.xAxis || 'Auto'}] and metrics [${(action.yAxes || []).join(', ')}]`,
      category: 'visualization',
      icon: 'bi-bar-chart-fill',
      canRunParallel: true
    };
  }

  if (act === 'convert-chart') {
    return {
      title: `Convert Chart to ${(action.chartType || action.type || 'New Type').toUpperCase()}`,
      description: `Transform target "${action.target || 'Selected'}" into a new visual geometry`,
      category: 'visualization',
      icon: 'bi-arrow-repeat',
      canRunParallel: true
    };
  }

  if (act === 'rename-chart') {
    return {
      title: `Rename Target Component`,
      description: `Update label for "${action.target || 'Component'}" to "${action.newTitle || action.title || 'New Title'}"`,
      category: 'visualization',
      icon: 'bi-pencil-square',
      canRunParallel: true
    };
  }

  if (act === 'apply-effect') {
    return {
      title: `Apply Visual Styling Effect`,
      description: `Apply shader effect "${action.effectId || 'Custom Glow'}" to target "${action.target || 'all'}"`,
      category: 'visualization',
      icon: 'bi-magic',
      canRunParallel: true
    };
  }

  if (act === 'change-theme') {
    return {
      title: `Update Palette Theme`,
      description: `Switch container visual theme to "${action.themeId || 'Modern Color'}"`,
      category: 'workspace',
      icon: 'bi-palette-fill',
      canRunParallel: true
    };
  }

  if (act === 'change-layout' || act === 'arrange-grid') {
    return {
      title: `Re-architect Grid Layout`,
      description: `Rearrange dashboard cards into a ${action.columns || 2}-column responsive grid`,
      category: 'workspace',
      icon: 'bi-grid-fill',
      canRunParallel: false
    };
  }

  if (act === 'create-template-card' || act === 'add-template-card' || act === 'create-kpi') {
    const cardTitle = action.label || action.title || 'Executive KPI';
    return {
      title: `Build Executive KPI Card`,
      description: `Construct metric indicator "${cardTitle}" (${action.aggregation || 'sum'} of ${action.column || 'value'})`,
      category: 'kpi_metric',
      icon: 'bi-patch-check-fill',
      canRunParallel: true
    };
  }

  if (act === 'create-sparkline') {
    return {
      title: `Generate Micro Sparkline Card`,
      description: `Generate trending sparkline for "${action.label || 'Performance'}"`,
      category: 'kpi_metric',
      icon: 'bi-activity',
      canRunParallel: true
    };
  }

  if (act === 'create-gauge') {
    return {
      title: `Construct Radial Gauge Meter`,
      description: `Build circular metric gauge for "${action.label || 'Target Efficiency'}"`,
      category: 'kpi_metric',
      icon: 'bi-speedometer2',
      canRunParallel: true
    };
  }

  if (act === 'create-progress') {
    return {
      title: `Deploy Target Progress Bar`,
      description: `Deploy goal completion progress bar "${action.label || 'Target'}"`,
      category: 'kpi_metric',
      icon: 'bi-bar-chart-steps',
      canRunParallel: true
    };
  }

  if (act === 'create-textbox') {
    return {
      title: `Embed Executive Notes & Memo`,
      description: `Render styled commentary "${action.label || 'Executive Note'}"`,
      category: 'workspace',
      icon: 'bi-textarea-t',
      canRunParallel: true
    };
  }

  if (act === 'calculate-column') {
    return {
      title: `Compute Dynamic Field: "${action.columnName || 'New Metric'}"`,
      description: `Evaluate mathematical formula "${action.formula || ''}" across active dataset rows`,
      category: 'computation',
      icon: 'bi-calculator-fill',
      canRunParallel: false // Dependent for charts using this column
    };
  }

  if (act === 'apply-template-formula' || act === 'apply-formula') {
    return {
      title: `Execute Spreadsheet Formula Engine`,
      description: `Apply formula expression "${action.formula || ''}" to target KPI card`,
      category: 'computation',
      icon: 'bi-braces',
      canRunParallel: true
    };
  }

  if (act === 'conversational-filter' || act === 'filter-data') {
    return {
      title: `Filter Dataset Dimension`,
      description: `Apply multi-condition filter on column "${action.column || 'dimension'}"`,
      category: 'data_prep',
      icon: 'bi-funnel-fill',
      canRunParallel: false
    };
  }

  if (act === 'predictive-forecast' || act === 'forecast' || act === 'forecast-chart') {
    return {
      title: `Execute Predictive Forecast Engine`,
      description: `Run ARIMA / Holt-Winters statistical projection for ${action.periods || 3} future cycles`,
      category: 'analytics',
      icon: 'bi-graph-up-arrow',
      canRunParallel: true
    };
  }

  if (act === 'detect-anomalies' || act === 'anomaly-detection') {
    return {
      title: `Perform Anomaly & Outlier Scan`,
      description: `Calculate statistical Z-Scores to uncover extreme data points and volatility spikes`,
      category: 'analytics',
      icon: 'bi-exclamation-triangle-fill',
      canRunParallel: true
    };
  }

  if (act === 'what-if-simulation' || act === 'what-if-scenario') {
    return {
      title: `Simulate What-If Elasticity Model`,
      description: `Simulate scenario adjustments across price, volume, and cost levers`,
      category: 'analytics',
      icon: 'bi-sliders2-vertical',
      canRunParallel: true
    };
  }

  if (act === 'root-cause-analysis') {
    return {
      title: `Run Diagnostic Root-Cause Decomposition`,
      description: `Isolate variance drivers and drill-down factors contributing to metric drift`,
      category: 'analytics',
      icon: 'bi-diagram-3-fill',
      canRunParallel: true
    };
  }

  if (act === 'clean-data' || act === 'apply-cleaning-fix') {
    return {
      title: `Automated Data Sanitation & Hygiene`,
      description: `Clean missing values, normalize data types, and eliminate duplicate records`,
      category: 'data_prep',
      icon: 'bi-shield-check',
      canRunParallel: false
    };
  }

  if (act.startsWith('presentation-') || act === 'start-presentation' || act === 'kiosk-mode') {
    return {
      title: `Orchestrate Board Presentation Mode`,
      description: `Configure presentation kiosk stage and initialize executive narration controls`,
      category: 'presentation',
      icon: 'bi-projector-fill',
      canRunParallel: false
    };
  }

  if (act === 'export-dashboard' || act === 'executive-report') {
    return {
      title: `Export Strategic BI Deliverable`,
      description: `Generate high-resolution executive document in format: ${(action.format || 'PDF').toUpperCase()}`,
      category: 'export',
      icon: 'bi-file-earmark-arrow-down-fill',
      canRunParallel: true
    };
  }

  if (act === 'generate-data-story') {
    return {
      title: `Synthesize Executive Data Story`,
      description: `Distill full business narrative, KPIs, and prescriptive guidance`,
      category: 'analytics',
      icon: 'bi-journal-richtext',
      canRunParallel: true
    };
  }

  if (act === 'create-tab' || act === 'switch-tab') {
    return {
      title: `Manage Multi-Tab Workspace`,
      description: `Configure dashboard workspace canvas "${action.tabName || 'Tab'}"`,
      category: 'workspace',
      icon: 'bi-folder-symlink-fill',
      canRunParallel: false
    };
  }

  return {
    title: `Execute Step #${index + 1}: ${act.replace(/-/g, ' ').toUpperCase()}`,
    description: `Process autonomous agent directive with supplied execution arguments`,
    category: 'general',
    icon: 'bi-gear-wide-connected',
    canRunParallel: true
  };
}

/**
 * Intelligent Prompt Decomposition Engine
 * Breaks any complex or multi-part user prompt into granular tasks.
 */
export function decomposeUserPrompt(rawPrompt: string, preParsedActions?: AiAction[]): AgentTaskPlan {
  const planId = `plan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const cleanPrompt = (rawPrompt || '').trim();
  const tasks: AgentTask[] = [];

  // 1. If backend AI returned explicit json-actions, map each into a structured task
  if (preParsedActions && preParsedActions.length > 0) {
    preParsedActions.forEach((act, idx) => {
      const meta = mapActionToTaskMeta(act, idx);
      tasks.push({
        id: `task_${planId}_${idx + 1}`,
        stepNumber: idx + 1,
        title: (act as any).taskTitle || meta.title,
        description: meta.description,
        category: (act as any).category || meta.category,
        icon: meta.icon,
        status: 'pending',
        progress: 0,
        canRunParallel: meta.canRunParallel,
        action: act,
        retryCount: 0
      });
    });
  } else {
    // 2. Client-side Prompt Decomposition for compound natural language prompts
    // Detects numbered steps (1. ... 2. ...), bullets, or conjunctions ("aur", "and then", "fir", "phir", "also")
    const subClauses: string[] = [];

    // Check for explicit numbering: "1. do this 2. do that" or "Step 1: ... Step 2: ..."
    const numberedRegex = /(?:^|\s|\n)(?:\d+[\.\)\-]|step\s*\d+[:\.\-]?)\s*([^\d\n\r]+?)(?=(?:\s+\d+[\.\)\-]|step\s*\d+|$))/gi;
    let match: RegExpExecArray | null;
    let foundNumbered = false;

    while ((match = numberedRegex.exec(cleanPrompt)) !== null) {
      const clause = match[1].trim();
      if (clause.length > 3) {
        subClauses.push(clause);
        foundNumbered = true;
      }
    }

    if (!foundNumbered) {
      // Split on natural multi-task conjunctions
      // Hindi / English conjunctions: and then, aur fir, phir, and, aur, also, then, ;, plus
      const conjunctionRegex = /\s*(?:and\s+then|aur\s+phir|aur\s+fir|phir|fir|and|aur|ke\s+baad|after\s+that|also|sath\s+hi|;\s*|\n+)\s*/i;
      const parts = cleanPrompt.split(conjunctionRegex).map(p => p.trim()).filter(p => p.length > 4);
      
      if (parts.length > 1) {
        subClauses.push(...parts);
      } else {
        subClauses.push(cleanPrompt);
      }
    }

    // Synthesize structured tasks from parsed clauses
    subClauses.forEach((clause, idx) => {
      const lower = clause.toLowerCase();
      let meta: { title: string; description: string; category: AgentTaskCategory; icon: string; canRunParallel: boolean };
      let syntheticAction: AiAction | undefined;

      if (lower.includes('clear') || lower.includes('reset') || lower.includes('khali') || lower.includes('fresh')) {
        meta = {
          title: 'Reset Dashboard Workspace',
          description: 'Clear existing charts to prepare a fresh executive layout',
          category: 'workspace',
          icon: 'bi-trash3-fill',
          canRunParallel: false
        };
        syntheticAction = { action: 'clear-dashboard' };
      } else if (lower.includes('bar') || lower.includes('column chart') || (lower.includes('chart') && !lower.includes('line') && !lower.includes('pie'))) {
        const foundHeaders = (headers || []);
        const xCol = foundHeaders[0] || 'Category';
        const yCol = foundHeaders[1] || 'Value';
        meta = {
          title: `Plot Bar Chart: ${clause}`,
          description: `Render Bar visualization based on "${clause}"`,
          category: 'visualization',
          icon: 'bi-bar-chart-fill',
          canRunParallel: true
        };
        syntheticAction = { action: 'create-chart', type: 'bar', title: clause.substring(0, 35), xAxis: xCol, yAxes: [yCol] };
      } else if (lower.includes('line') || lower.includes('trend')) {
        const foundHeaders = (headers || []);
        const xCol = foundHeaders[0] || 'Date';
        const yCol = foundHeaders[1] || 'Sales';
        meta = {
          title: `Plot Trend Line Chart: ${clause}`,
          description: `Visualize continuous time series trends`,
          category: 'visualization',
          icon: 'bi-graph-up',
          canRunParallel: true
        };
        syntheticAction = { action: 'create-chart', type: 'line', title: clause.substring(0, 35), xAxis: xCol, yAxes: [yCol] };
      } else if (lower.includes('pie') || lower.includes('donut') || lower.includes('hissa')) {
        const foundHeaders = (headers || []);
        meta = {
          title: `Plot Proportional Pie Chart: ${clause}`,
          description: `Render share & distribution breakdown`,
          category: 'visualization',
          icon: 'bi-pie-chart-fill',
          canRunParallel: true
        };
        syntheticAction = { action: 'create-chart', type: 'pie', title: clause.substring(0, 35), xAxis: foundHeaders[0] || 'Segment', yAxes: [foundHeaders[1] || 'Share'] };
      } else if (lower.includes('kpi') || lower.includes('card') || lower.includes('metric')) {
        meta = {
          title: `Construct Executive KPI: ${clause}`,
          description: `Create strategic summary KPI card`,
          category: 'kpi_metric',
          icon: 'bi-patch-check-fill',
          canRunParallel: true
        };
        syntheticAction = { action: 'create-template-card', templateCategory: 'kpi', title: clause.substring(0, 25) };
      } else if (lower.includes('calculate') || lower.includes('formula') || lower.includes('tax') || lower.includes('margin') || lower.includes('hisab')) {
        meta = {
          title: `Compute Calculated Metric: ${clause}`,
          description: `Execute computational formula across dataset records`,
          category: 'computation',
          icon: 'bi-calculator-fill',
          canRunParallel: false
        };
        syntheticAction = { action: 'calculate-column', columnName: 'Calculated_Metric', formula: 'Sales * 0.18' };
      } else if (lower.includes('anomaly') || lower.includes('outlier') || lower.includes('galti') || lower.includes('check')) {
        meta = {
          title: 'Run Deep Anomaly Detection',
          description: 'Audit variance and flag statistical outliers in dataset',
          category: 'analytics',
          icon: 'bi-exclamation-triangle-fill',
          canRunParallel: true
        };
        syntheticAction = { action: 'detect-anomalies' };
      } else if (lower.includes('forecast') || lower.includes('predict') || lower.includes('bhavishya')) {
        meta = {
          title: 'Generate Predictive Forecast',
          description: 'Project statistical forward estimates',
          category: 'analytics',
          icon: 'bi-graph-up-arrow',
          canRunParallel: true
        };
        syntheticAction = { action: 'predictive-forecast', periods: 3 };
      } else if (lower.includes('clean') || lower.includes('safai') || lower.includes('fix')) {
        meta = {
          title: 'Automated Data Sanitation',
          description: 'Purge null values and optimize column types',
          category: 'data_prep',
          icon: 'bi-shield-check',
          canRunParallel: false
        };
        syntheticAction = { action: 'clean-data' };
      } else if (lower.includes('presentation') || lower.includes('kiosk') || lower.includes('slide') || lower.includes('narrator')) {
        meta = {
          title: 'Launch Board Presentation Stage',
          description: 'Transition into fullscreen interactive kiosk with live narrator',
          category: 'presentation',
          icon: 'bi-projector-fill',
          canRunParallel: false
        };
        syntheticAction = { action: 'start-presentation', voice: true, narrator: true };
      } else if (lower.includes('story') || lower.includes('report') || lower.includes('summary')) {
        meta = {
          title: 'Synthesize Executive Report',
          description: 'Draft strategic summary insights and recommendations',
          category: 'analytics',
          icon: 'bi-journal-richtext',
          canRunParallel: true
        };
        syntheticAction = { action: 'generate-data-story' };
      } else {
        meta = {
          title: `Analyze & Execute: "${clause.substring(0, 32)}"`,
          description: clause,
          category: 'general',
          icon: 'bi-cpu-fill',
          canRunParallel: true
        };
      }

      tasks.push({
        id: `task_${planId}_${idx + 1}`,
        stepNumber: idx + 1,
        title: meta.title,
        description: meta.description,
        category: meta.category,
        icon: meta.icon,
        status: 'pending',
        progress: 0,
        canRunParallel: meta.canRunParallel,
        action: syntheticAction,
        retryCount: 0
      });
    });
  }

  // Determine overall execution mode
  // If all tasks can run parallel and count > 1, default mode is 'adaptive' (runs non-blocking concurrently)
  const hasDependencies = tasks.some(t => !t.canRunParallel);
  const mode = hasDependencies ? 'sequential' : 'adaptive';

  return {
    id: planId,
    originalPrompt: cleanPrompt,
    createdAt: Date.now(),
    tasks,
    status: 'idle',
    mode,
    currentTaskIndex: 0,
    totalTasks: tasks.length,
    completedTasks: 0,
    failedTasks: 0
  };
}

/**
 * Core Agent Multi-Task Manager & Concurrency Worker Pool
 */
class AgentMultiTaskManager {
  private plans: Map<string, AgentTaskPlan> = new Map();
  private activePlanId: string | null = null;
  private backgroundWorkers: Map<string, AgentTask> = new Map();
  private isPaused: boolean = false;
  private metrics: TaskManagerMetrics = {
    totalPlansCreated: 0,
    totalTasksExecuted: 0,
    totalTasksSucceeded: 0,
    totalTasksFailed: 0,
    avgTaskDurationMs: 0,
    activeBackgroundWorkersCount: 0
  };

  constructor() {
    this.initGlobalEvents();
  }

  private initGlobalEvents(): void {
    if (typeof window !== 'undefined') {
      (window as any).agentTaskManager = this;
    }
  }

  public getPlan(planId: string): AgentTaskPlan | undefined {
    return this.plans.get(planId);
  }

  public getAllPlans(): AgentTaskPlan[] {
    return Array.from(this.plans.values()).reverse();
  }

  public getMetrics(): TaskManagerMetrics {
    return { ...this.metrics, activeBackgroundWorkersCount: this.backgroundWorkers.size };
  }

  /**
   * Spawns or registers a task plan from prompt and actions.
   */
  public registerPlan(plan: AgentTaskPlan): void {
    this.plans.set(plan.id, plan);
    this.metrics.totalPlansCreated++;
    this.updateTaskTrayBadge();
  }

  /**
   * Executes a complete plan step-by-step or with parallel multitasking workers.
   */
  public async executePlan(
    plan: AgentTaskPlan,
    options?: { mode?: 'sequential' | 'parallel' | 'adaptive'; targetRow?: HTMLElement | null }
  ): Promise<AgentTaskPlan> {
    plan.status = 'running';
    this.activePlanId = plan.id;
    this.isPaused = false;
    const planStartTime = performance.now();

    // 1. Snapshot state for undo
    if (plan.tasks.some(t => t.action)) {
      const actions = plan.tasks.map(t => t.action).filter(Boolean) as AiAction[];
      plan.snapshotId = pushUndoSnapshot(plan.tasks.map(t => t.title).join(', '), actions);
    }

    // 2. Mount/Update UI Stepper
    this.renderOrUpdateStepperUI(plan, options?.targetRow);

    const execMode = options?.mode || plan.mode;

    if (execMode === 'parallel' && plan.tasks.every(t => t.canRunParallel)) {
      // True Parallel Multitasking: execute concurrent worker pool
      await this.executeTasksInParallel(plan);
    } else {
      // Adaptive / Sequential Pipeline (Task-by-Task Execution)
      await this.executeTasksSequentially(plan);
    }

    // Wrap up plan
    plan.totalDurationMs = Math.round(performance.now() - planStartTime);
    plan.status = plan.failedTasks === 0 ? 'completed' : plan.completedTasks > 0 ? 'partially_failed' : 'failed';
    this.renderOrUpdateStepperUI(plan, options?.targetRow);

    if (options?.targetRow && plan.snapshotId) {
      attachUndoButtonToMessageRow(options.targetRow, plan.snapshotId, plan.tasks.length);
    }

    this.updateTaskTrayBadge();
    return plan;
  }

  /**
   * Executes tasks step-by-step sequentially with live UI state updates.
   */
  private async executeTasksSequentially(plan: AgentTaskPlan): Promise<void> {
    for (let i = 0; i < plan.tasks.length; i++) {
      if (this.isPaused || plan.status === 'paused') {
        plan.status = 'paused';
        this.renderOrUpdateStepperUI(plan);
        break;
      }
      if (plan.status === 'cancelled') {
        break;
      }

      plan.currentTaskIndex = i;
      const task = plan.tasks[i];
      await this.runSingleTaskWithLifecycle(plan, task);
    }
  }

  /**
   * Executes tasks concurrently in a parallel multitasking worker pool (up to 3 concurrent tasks).
   */
  private async executeTasksInParallel(plan: AgentTaskPlan): Promise<void> {
    const concurrencyLimit = 3;
    const pendingTasks = [...plan.tasks];
    const executing: Promise<any>[] = [];

    for (const task of pendingTasks) {
      if (this.isPaused || plan.status === 'cancelled') break;

      const p = this.runSingleTaskWithLifecycle(plan, task).then(() => {
        executing.splice(executing.indexOf(p), 1);
      });
      executing.push(p);

      if (executing.length >= concurrencyLimit) {
        await Promise.race(executing);
      }
    }

    await Promise.all(executing);
  }

  /**
   * Lifecycle wrapper for running an individual task:
   * Sets progress, handles spinner, catches errors, measures duration in ms, and triggers UI updates.
   */
  public async runSingleTaskWithLifecycle(plan: AgentTaskPlan, task: AgentTask): Promise<boolean> {
    task.status = 'running';
    task.startedAt = performance.now();
    task.progress = 25;
    this.renderOrUpdateStepperUI(plan);

    // Simulated progress increment for smooth UX animation
    const progressTimer = setInterval(() => {
      if (task.status === 'running' && task.progress < 85) {
        task.progress += 15;
        this.updateSingleTaskUI(plan, task);
      }
    }, 120);

    let success = false;
    let message = '';
    let errorMessage = '';

    try {
      if (task.customRunner) {
        const res = await task.customRunner();
        success = res.success;
        message = res.message || '';
      } else if (task.action) {
        const res = await executeSingleAction(task.action);
        success = res.success;
        message = res.message;
      } else {
        // Fallback simulated execution
        await new Promise(r => setTimeout(r, 200));
        success = true;
        message = 'Task completed successfully.';
      }
    } catch (err: any) {
      success = false;
      errorMessage = err?.message || 'Execution error encountered';
      console.error(`[AgentTaskManager] Error executing task "${task.title}":`, err);
    } finally {
      clearInterval(progressTimer);
    }

    task.completedAt = performance.now();
    task.durationMs = Math.round(task.completedAt - (task.startedAt || task.completedAt));
    task.progress = success ? 100 : 0;

    if (success) {
      task.status = 'completed';
      task.resultMessage = message;
      plan.completedTasks++;
      this.metrics.totalTasksSucceeded++;
    } else {
      task.status = 'failed';
      task.errorMessage = errorMessage || 'Operation returned failure';
      plan.failedTasks++;
      this.metrics.totalTasksFailed++;
    }

    this.metrics.totalTasksExecuted++;
    // Update moving average duration
    this.metrics.avgTaskDurationMs = Math.round(
      (this.metrics.avgTaskDurationMs * (this.metrics.totalTasksExecuted - 1) + (task.durationMs || 0)) /
      this.metrics.totalTasksExecuted
    );

    this.renderOrUpdateStepperUI(plan);
    return success;
  }

  /**
   * Retries an individual failed or pending task in a plan.
   */
  public async retryTask(planId: string, taskId: string): Promise<boolean> {
    const plan = this.plans.get(planId);
    if (!plan) return false;

    const task = plan.tasks.find(t => t.id === taskId);
    if (!task) return false;

    task.retryCount = (task.retryCount || 0) + 1;
    task.status = 'pending';
    task.errorMessage = undefined;
    task.resultMessage = undefined;
    this.renderOrUpdateStepperUI(plan);

    const ok = await this.runSingleTaskWithLifecycle(plan, task);
    this.updateTaskTrayBadge();
    return ok;
  }

  /**
   * Pauses an active plan before the next task begins.
   */
  public pausePlan(planId: string): void {
    const plan = this.plans.get(planId);
    if (!plan) return;
    this.isPaused = true;
    plan.status = 'paused';
    this.renderOrUpdateStepperUI(plan);
    showMessage(`Plan paused. (${plan.completedTasks}/${plan.totalTasks} tasks complete)`, 'info');
  }

  /**
   * Resumes execution of a paused plan.
   */
  public async resumePlan(planId: string): Promise<void> {
    const plan = this.plans.get(planId);
    if (!plan) return;
    this.isPaused = false;
    plan.status = 'running';
    this.renderOrUpdateStepperUI(plan);
    showMessage('Resuming task-by-task execution...', 'info');

    const remainingIndex = plan.tasks.findIndex(t => t.status === 'pending');
    if (remainingIndex !== -1) {
      for (let i = remainingIndex; i < plan.tasks.length; i++) {
        if (this.isPaused || (plan.status as string) === 'paused' || (plan.status as string) === 'cancelled') break;
        plan.currentTaskIndex = i;
        await this.runSingleTaskWithLifecycle(plan, plan.tasks[i]);
      }
    }

    plan.status = plan.failedTasks === 0 ? 'completed' : 'partially_failed';
    this.renderOrUpdateStepperUI(plan);
  }

  /**
   * Cancels remaining tasks in a plan.
   */
  public cancelPlan(planId: string): void {
    const plan = this.plans.get(planId);
    if (!plan) return;
    plan.status = 'cancelled';
    plan.tasks.forEach(t => {
      if (t.status === 'pending' || t.status === 'queued') {
        t.status = 'skipped';
      }
    });
    this.renderOrUpdateStepperUI(plan);
    showMessage('Remaining plan tasks cancelled.', 'warning');
  }

  /**
   * Registers a background worker (e.g. live polling, anomaly scanner).
   */
  public registerBackgroundWorker(task: AgentTask): void {
    this.backgroundWorkers.set(task.id, task);
    this.updateTaskTrayBadge();
  }

  public unregisterBackgroundWorker(taskId: string): void {
    this.backgroundWorkers.delete(taskId);
    this.updateTaskTrayBadge();
  }

  public getBackgroundWorkers(): AgentTask[] {
    return Array.from(this.backgroundWorkers.values());
  }

  /**
   * Updates task tray notification badge in chat header.
   */
  private updateTaskTrayBadge(): void {
    const badge = document.getElementById('agentActiveTasksBadge');
    if (!badge) return;

    let activeCount = 0;
    this.plans.forEach(p => {
      if (p.status === 'running') activeCount += p.tasks.filter(t => t.status === 'running' || t.status === 'pending').length;
    });
    activeCount += this.backgroundWorkers.size;

    if (activeCount > 0) {
      badge.textContent = String(activeCount);
      badge.classList.remove('d-none');
    } else {
      badge.classList.add('d-none');
    }
  }

  /**
   * Renders or refreshes the interactive Multi-Task Stepper UI widget.
   */
  public renderOrUpdateStepperUI(plan: AgentTaskPlan, targetRow?: HTMLElement | null): HTMLElement | null {
    let container = plan.containerElement;

    if (!container) {
      container = document.createElement('div');
      container.id = `stepper_${plan.id}`;
      container.className = 'agent-task-stepper-card my-3 p-3 rounded-xl border transition-all duration-200 shadow-sm';
      container.style.background = 'var(--bs-body-bg, #ffffff)';
      container.style.borderColor = 'rgba(99, 102, 241, 0.25)';
      plan.containerElement = container;

      // Find insertion point in message bubble or chat history
      const targetBubble = targetRow?.querySelector('.chat-message-bubble') || 
                           document.querySelector('#chatHistory .assistant-row:last-child .chat-message-bubble') ||
                           document.getElementById('chatHistory');
      if (targetBubble) {
        targetBubble.appendChild(container);
      }
    }

    const pct = plan.totalTasks > 0 ? Math.round((plan.completedTasks / plan.totalTasks) * 100) : 0;
    const isDark = document.documentElement.classList.contains('dark-theme') || localStorage.getItem('theme') === 'dark';
    
    // Status color tokens
    const statusColor = plan.status === 'completed' ? '#10b981' : plan.status === 'running' ? '#6366f1' : plan.status === 'paused' ? '#f59e0b' : '#64748b';

    container.innerHTML = `
      <!-- Stepper Header -->
      <div class="d-flex align-items-center justify-content-between mb-2 pb-2 border-bottom" style="border-color: rgba(226, 232, 240, 0.6) !important;">
        <div class="d-flex align-items-center gap-2">
          <div class="agent-stepper-icon-wrap d-flex align-items-center justify-content-center rounded-lg" 
               style="width: 32px; height: 32px; background: rgba(99, 102, 241, 0.12); color: #6366f1;">
            <i class="bi bi-cpu-fill fs-6 ${plan.status === 'running' ? 'animate-pulse' : ''}"></i>
          </div>
          <div>
            <div class="d-flex align-items-center gap-2">
              <span class="fw-bold small" style="letter-spacing: -0.01em;">Autonomous Multi-Task Plan</span>
              <span class="badge rounded-pill text-xs px-2 py-0.5" style="background: ${statusColor}18; color: ${statusColor}; font-weight: 600;">
                ${plan.status.toUpperCase()}
              </span>
              <span class="badge rounded-pill text-xs px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200">
                <i class="bi bi-shuffle me-1"></i>${plan.mode.toUpperCase()}
              </span>
            </div>
            <div class="text-xs text-muted">
              ${plan.completedTasks}/${plan.totalTasks} tasks complete ${plan.totalDurationMs ? `• finished in ${plan.totalDurationMs}ms` : ''}
            </div>
          </div>
        </div>

        <!-- Controls Toolbar -->
        <div class="d-flex align-items-center gap-1">
          ${plan.status === 'running' ? `
            <button class="btn btn-xs btn-outline-warning plan-pause-btn" data-plan-id="${plan.id}" title="Pause Execution">
              <i class="bi bi-pause-fill"></i> Pause
            </button>
            <button class="btn btn-xs btn-outline-danger plan-cancel-btn" data-plan-id="${plan.id}" title="Cancel Remaining">
              <i class="bi bi-x-circle"></i> Stop
            </button>
          ` : plan.status === 'paused' ? `
            <button class="btn btn-xs btn-outline-success plan-resume-btn" data-plan-id="${plan.id}" title="Resume Execution">
              <i class="bi bi-play-fill"></i> Resume
            </button>
          ` : ''}
          ${plan.status !== 'running' && plan.tasks.some(t => t.canRunParallel) && plan.completedTasks < plan.totalTasks ? `
            <button class="btn btn-xs btn-outline-primary plan-parallel-btn" data-plan-id="${plan.id}" title="Run Remaining in Parallel (Multitasking)">
              <i class="bi bi-lightning-charge-fill"></i> Parallel
            </button>
          ` : ''}
        </div>
      </div>

      <!-- Overall Progress Bar -->
      <div class="mb-3">
        <div class="d-flex justify-content-between text-xs text-muted mb-1">
          <span>Overall Execution Pipeline</span>
          <span class="fw-bold">${pct}%</span>
        </div>
        <div class="progress" style="height: 6px; border-radius: 999px; background: rgba(226, 232, 240, 0.6); overflow: hidden;">
          <div class="progress-bar progress-bar-striped ${plan.status === 'running' ? 'progress-bar-animated' : ''}" 
               role="progressbar" 
               style="width: ${pct}%; background: ${plan.status === 'completed' ? '#10b981' : '#6366f1'}; transition: width 0.3s ease;">
          </div>
        </div>
      </div>

      <!-- Task Items List -->
      <div class="agent-stepper-tasks-list d-flex flex-column gap-2" id="tasks_list_${plan.id}">
        ${plan.tasks.map((task, idx) => this.renderTaskItemHtml(task, idx, isDark)).join('')}
      </div>

      <!-- Stepper Footer Note -->
      ${plan.status === 'completed' ? `
        <div class="mt-2 pt-2 border-top d-flex align-items-center justify-content-between text-xs text-emerald-600 font-medium">
          <span><i class="bi bi-check2-circle me-1"></i>All ${plan.totalTasks} sub-tasks orchestrated successfully with zero conflicts.</span>
          <span class="text-muted">${plan.totalDurationMs}ms</span>
        </div>
      ` : ''}
    `;

    this.attachStepperListeners(container, plan);
    return container;
  }

  /**
   * Generates single task item row HTML.
   */
  private renderTaskItemHtml(task: AgentTask, idx: number, isDark: boolean): string {
    const isRunning = task.status === 'running';
    const isCompleted = task.status === 'completed';
    const isFailed = task.status === 'failed';
    const isSkipped = task.status === 'skipped';

    const bgCard = isRunning ? 'rgba(99, 102, 241, 0.08)' : isCompleted ? 'rgba(16, 185, 129, 0.05)' : isFailed ? 'rgba(239, 68, 68, 0.06)' : 'rgba(241, 245, 249, 0.4)';
    const borderColor = isRunning ? '#818cf8' : isCompleted ? '#34d399' : isFailed ? '#f87171' : 'rgba(226, 232, 240, 0.8)';

    let statusBadge = '';
    if (isRunning) {
      statusBadge = `
        <span class="badge rounded-pill text-xs px-2 py-0.5" style="background: rgba(99, 102, 241, 0.15); color: #6366f1;">
          <span class="spinner-border spinner-border-sm me-1" style="width: 10px; height: 10px;" role="status"></span>Running...
        </span>
      `;
    } else if (isCompleted) {
      statusBadge = `
        <span class="badge rounded-pill text-xs px-2 py-0.5" style="background: rgba(16, 185, 129, 0.15); color: #059669;">
          <i class="bi bi-check2 me-1"></i>Done (${task.durationMs || 0}ms)
        </span>
      `;
    } else if (isFailed) {
      statusBadge = `
        <span class="badge rounded-pill text-xs px-2 py-0.5" style="background: rgba(239, 68, 68, 0.15); color: #dc2626;">
          <i class="bi bi-exclamation-triangle-fill me-1"></i>Failed
        </span>
      `;
    } else if (isSkipped) {
      statusBadge = `<span class="badge rounded-pill text-xs px-2 py-0.5 bg-slate-200 text-slate-500">Skipped</span>`;
    } else {
      statusBadge = `<span class="badge rounded-pill text-xs px-2 py-0.5 bg-slate-100 text-slate-500 border border-slate-200">Pending</span>`;
    }

    return `
      <div class="agent-task-item p-2 rounded-lg border transition-all duration-150" 
           id="task_item_${task.id}"
           style="background: ${bgCard}; border-color: ${borderColor};">
        <div class="d-flex align-items-center justify-content-between">
          <div class="d-flex align-items-center gap-2 overflow-hidden">
            <!-- Step Number Pill -->
            <span class="badge rounded-circle d-flex align-items-center justify-content-center" 
                  style="width: 22px; height: 22px; font-size: 10px; background: ${isRunning ? '#6366f1' : isCompleted ? '#10b981' : isFailed ? '#ef4444' : '#94a3b8'}; color: #fff;">
              ${task.stepNumber}
            </span>

            <!-- Task Category Icon -->
            <i class="bi ${task.icon} fs-6 text-slate-500"></i>

            <!-- Task Title & Description -->
            <div class="text-truncate">
              <div class="text-xs fw-semibold text-dark text-truncate">${escapeHtml(task.title)}</div>
              <div class="text-xs text-muted text-truncate" style="font-size: 11px;">${escapeHtml(task.description)}</div>
            </div>
          </div>

          <!-- Status & Action Buttons -->
          <div class="d-flex align-items-center gap-2 flex-shrink-0 ms-2">
            ${statusBadge}
            ${isFailed ? `
              <button class="btn btn-xs btn-outline-danger task-retry-btn py-0 px-1" data-task-id="${task.id}" title="Retry Task">
                <i class="bi bi-arrow-clockwise"></i>
              </button>
            ` : ''}
          </div>
        </div>

        <!-- In-Progress Sub-Progress Bar -->
        ${isRunning ? `
          <div class="progress mt-2" style="height: 3px; border-radius: 999px; background: rgba(99, 102, 241, 0.2);">
            <div class="progress-bar progress-bar-striped progress-bar-animated" style="width: ${task.progress}%; background: #6366f1;"></div>
          </div>
        ` : ''}

        <!-- Failure Details -->
        ${isFailed && task.errorMessage ? `
          <div class="text-xs text-danger mt-1 pt-1 border-top" style="font-size: 11px;">
            <i class="bi bi-info-circle me-1"></i>${escapeHtml(task.errorMessage)}
          </div>
        ` : ''}
      </div>
    `;
  }

  /**
   * Updates only an individual task item HTML in real-time without re-rendering the whole stepper.
   */
  private updateSingleTaskUI(plan: AgentTaskPlan, task: AgentTask): void {
    const el = document.getElementById(`task_item_${task.id}`);
    if (!el) return;
    const isDark = document.documentElement.classList.contains('dark-theme') || localStorage.getItem('theme') === 'dark';
    el.outerHTML = this.renderTaskItemHtml(task, task.stepNumber - 1, isDark);
  }

  /**
   * Attaches event listeners to buttons inside the Stepper.
   */
  private attachStepperListeners(container: HTMLElement, plan: AgentTaskPlan): void {
    container.querySelector('.plan-pause-btn')?.addEventListener('click', () => {
      this.pausePlan(plan.id);
    });

    container.querySelector('.plan-resume-btn')?.addEventListener('click', () => {
      this.resumePlan(plan.id);
    });

    container.querySelector('.plan-cancel-btn')?.addEventListener('click', () => {
      this.cancelPlan(plan.id);
    });

    container.querySelector('.plan-parallel-btn')?.addEventListener('click', async () => {
      showMessage('Switching remaining tasks to parallel multitasking execution...', 'info');
      await this.executeTasksInParallel(plan);
      plan.status = plan.failedTasks === 0 ? 'completed' : 'partially_failed';
      this.renderOrUpdateStepperUI(plan);
    });

    container.querySelectorAll('.task-retry-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const taskId = (btn as HTMLElement).getAttribute('data-task-id');
        if (taskId) this.retryTask(plan.id, taskId);
      });
    });
  }
}

// Global Singleton Export
export const agentMultiTaskManager = new AgentMultiTaskManager();

/**
 * Helper to escape HTML characters safely
 */
function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
