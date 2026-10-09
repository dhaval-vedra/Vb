// src/js/charts/templateCards.ts
// Comprehensive 24 Template Cards Engine: Sparklines, KPI Big Numbers, Gauges & Progress Cards.
// Fully customizable inline & via sidebar, draggable & resizable with native chart container physics.

import { visualizations, plotChart, clearChart, duplicateChart } from './charts.ts';
import { initializeDragAndResize } from '../ui/drag_drop.ts';
import { showMessage } from '../core/utils.ts';
import { filteredData, rawData, headers, saveDashboardSettings } from '../../store/DataHandler.ts';
import { applyFormulasToCardConfig } from './templateFormulaEngine.ts';
import { openTemplateEditModal } from './templateEditModal.ts';

export interface TemplateDefinition {
    id: string;
    category: 'sparkline' | 'kpi' | 'gauge' | 'progress' | 'textbox';
    name: string;
    description: string;
    label: string;
    subLabel?: string;
    badge?: string;
    value: string | number;
    currency?: string;
    change?: string;
    changeType?: 'up' | 'down' | 'neutral';
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
    kpiCategory?: string;
    color: string;
    sparklineType?: 'line' | 'bar' | 'winloss';
    dataPoints?: number[];
    subMetrics?: Array<{ label: string; value: string }>;
    defaultSize: { width: string; height: string };
    textboxStyle?: 'gradient' | 'callout' | 'executive' | 'cyber' | 'minimal' | 'quote' | 'alert' | 'sunset' | 'ocean' | 'dark_luxury' | 'notes';
}

// =================================================================
// 34 AUTHENTIC READY-MADE TEMPLATES & STYLED TEXTBOXES
// =================================================================

export const TEMPLATE_REGISTRY: TemplateDefinition[] = [
    // -------------------------------------------------------------
    // CATEGORY 0: READY-MADE STYLED TEXTBOXES (10 Templates)
    // -------------------------------------------------------------
    {
        id: 'template_textbox_executive_header',
        category: 'textbox',
        name: 'Executive Header',
        description: 'Indigo-violet gradient hero title with live metric & subtitle',
        label: '🚀 Executive Dashboard 2024',
        subLabel: 'Enterprise intelligence & performance report',
        badge: 'LIVE • Q3',
        value: 'Total Revenue: ₹48,52,430',
        trendValue: '+14.2% vs Plan',
        textboxStyle: 'gradient',
        color: '#4f46e5',
        defaultSize: { width: '380px', height: '185px' }
    },
    {
        id: 'template_textbox_callout_notes',
        category: 'textbox',
        name: 'Strategic Callout',
        description: 'Warm amber observation card with highlight border & priority badge',
        label: '📌 Strategic Observation',
        subLabel: 'Weekly Performance Audit',
        badge: 'High Priority',
        value: 'Regional sales velocity grew by 18.4% across northern territories this sprint.',
        trendValue: 'Verified',
        textboxStyle: 'callout',
        color: '#f59e0b',
        defaultSize: { width: '360px', height: '185px' }
    },
    {
        id: 'template_textbox_ocean_wave',
        category: 'textbox',
        name: 'Ocean Wave Gradient',
        description: 'Azure-to-teal fluid gradient card with luminous high-contrast text',
        label: '🌊 Operational Velocity',
        subLabel: 'Customer Delivery Speed Index',
        badge: 'Fast Track',
        value: 'Average Order Fulfillment Time: 1.4 Days (Target: < 2.0)',
        trendValue: 'Optimal Speed',
        textboxStyle: 'ocean',
        color: '#0284c7',
        defaultSize: { width: '360px', height: '180px' }
    },
    {
        id: 'template_textbox_cyber_neon',
        category: 'textbox',
        name: 'Cyber Neon Glow',
        description: 'Dark futuristic glowing neon border with electric cyan accents',
        label: '⚡ Live Telemetry Stream',
        subLabel: 'Cluster Node A-12 Cluster Metrics',
        badge: 'ONLINE',
        value: 'Throughput: 98.6% Operational Capacity (Zero Anomalies)',
        trendValue: 'Real-time',
        textboxStyle: 'cyber',
        color: '#06b6d4',
        defaultSize: { width: '360px', height: '185px' }
    },
    {
        id: 'template_textbox_sunset_glow',
        category: 'textbox',
        name: 'Sunset Glow Insight',
        description: 'Warm coral-rose gradient container with modern glass feel',
        label: '🌅 Market Momentum',
        subLabel: 'Retail Expansion Track',
        badge: 'Trending',
        value: '42 New Outlets Onboarded • Footfall Index up 22%',
        trendValue: 'Expansion Phase',
        textboxStyle: 'sunset',
        color: '#f43f5e',
        defaultSize: { width: '360px', height: '180px' }
    },
    {
        id: 'template_textbox_minimal_clean',
        category: 'textbox',
        name: 'Minimalist Frame',
        description: 'Crisp architectural line border with high contrast typography',
        label: '📊 Performance Summary',
        subLabel: 'Internal Financial Audit Review',
        badge: 'Audited',
        value: 'All 18 compliance parameters validated with clean variance logs.',
        trendValue: 'Compliant',
        textboxStyle: 'minimal',
        color: '#0f172a',
        defaultSize: { width: '360px', height: '180px' }
    },
    {
        id: 'template_textbox_alert_status',
        category: 'textbox',
        name: 'Alert & Status Banner',
        description: 'Emerald success or critical notice card with alert chip',
        label: '✅ Milestone Achieved',
        subLabel: 'Q3 Annual Quota Tracker',
        badge: 'Success',
        value: 'Sales quota 100% fulfilled 8 days ahead of official deadline.',
        trendValue: 'Milestone Met',
        textboxStyle: 'alert',
        color: '#10b981',
        defaultSize: { width: '360px', height: '180px' }
    },
    {
        id: 'template_textbox_quote_card',
        category: 'textbox',
        name: 'Executive Quote',
        description: 'Editorial quotation card with quote body & attribution',
        label: '💬 Leadership Memo',
        subLabel: 'Chief Operating Officer',
        badge: 'Strategy',
        value: '“Speed and accuracy in reporting create unmatched market agility.”',
        trendValue: 'Q3 Directive',
        textboxStyle: 'quote',
        color: '#6366f1',
        defaultSize: { width: '360px', height: '185px' }
    },
    {
        id: 'template_textbox_dark_luxury',
        category: 'textbox',
        name: 'Dark Luxury Slate',
        description: 'Obsidian dark card with golden amber accent & crisp typography',
        label: '💎 Premium Portfolio',
        subLabel: 'High Net Worth Segment Ledger',
        badge: 'Tier 1',
        value: 'Assets Under Management: ₹142.8 Crore (+9.2% QoQ)',
        trendValue: 'Prime Tier',
        textboxStyle: 'dark_luxury',
        color: '#eab308',
        defaultSize: { width: '360px', height: '185px' }
    },
    {
        id: 'template_textbox_data_source',
        category: 'textbox',
        name: 'Data Source & Meta',
        description: 'Metadata tag box with sync status & active sheet link',
        label: '📁 Data Source Reference',
        subLabel: 'Active Sheet: Master_Sales_2024',
        badge: 'Live Sync',
        value: 'Synchronized live with active spreadsheet dataset & filters.',
        trendValue: 'Auto-Updated',
        textboxStyle: 'notes',
        color: '#8b5cf6',
        defaultSize: { width: '360px', height: '175px' }
    },

    // -------------------------------------------------------------
    // CATEGORY 1: SPARKLINES (HTML 1 - 6 Templates)
    // -------------------------------------------------------------
    {
        id: 'template_sparkline_daily_sales',
        category: 'sparkline',
        name: 'Daily Sales',
        description: 'Revenue sparkline with smooth vector curve & highlight dot',
        label: '💰 Daily Sales',
        badge: 'Last 30d',
        value: '₹4,82,500',
        change: '↑ 12.4%',
        changeType: 'up',
        color: '#2ecc71',
        sparklineType: 'line',
        dataPoints: [220, 280, 350, 420, 390, 410, 480, 500, 520, 490, 530, 560, 580, 540, 600, 650, 620, 670, 700, 690, 720, 750, 780, 810, 790, 830, 860, 890, 920, 940],
        defaultSize: { width: '350px', height: '210px' }
    },
    {
        id: 'template_sparkline_monthly_revenue',
        category: 'sparkline',
        name: 'Monthly Revenue',
        description: 'Monthly bar distribution with dynamic bar heights',
        label: '📊 Monthly Revenue',
        badge: 'Last 12m',
        value: '$12,430',
        change: '↑ 8.7%',
        changeType: 'up',
        color: '#e74c3c',
        sparklineType: 'bar',
        dataPoints: [8500, 9200, 8800, 9500, 10200, 9800, 10500, 11200, 10800, 11500, 12000, 12430],
        defaultSize: { width: '350px', height: '210px' }
    },
    {
        id: 'template_sparkline_team_performance',
        category: 'sparkline',
        name: 'Team Performance',
        description: 'Binary win-loss indicator bars around zero baseline',
        label: '🎯 Team Performance',
        badge: 'Last 14d',
        value: '9 Wins',
        change: '⚡ 64%',
        changeType: 'neutral',
        color: '#f39c12',
        sparklineType: 'winloss',
        dataPoints: [1, -1, 1, 1, 1, -1, 1, -1, 1, 1, 1, 1, -1, 1],
        defaultSize: { width: '350px', height: '210px' }
    },
    {
        id: 'template_sparkline_stock_price',
        category: 'sparkline',
        name: 'Stock Price',
        description: 'Financial ticker curve with 20-day high-precision movement',
        label: '📈 Stock Price',
        badge: 'Last 20d',
        value: '₹2,845',
        change: '↑ 3.2%',
        changeType: 'up',
        color: '#3498db',
        sparklineType: 'line',
        dataPoints: [2700, 2720, 2750, 2780, 2760, 2800, 2820, 2790, 2810, 2830, 2800, 2820, 2840, 2860, 2830, 2850, 2870, 2840, 2820, 2845],
        defaultSize: { width: '350px', height: '210px' }
    },
    {
        id: 'template_sparkline_product_sales',
        category: 'sparkline',
        name: 'Product Sales',
        description: 'Product unit sales velocity bar chart',
        label: '📊 Product Sales',
        badge: 'Last 10d',
        value: '2,340 Units',
        change: '↓ 2.1%',
        changeType: 'down',
        color: '#9b59b6',
        sparklineType: 'bar',
        dataPoints: [210, 230, 200, 250, 240, 260, 220, 280, 250, 234],
        defaultSize: { width: '350px', height: '210px' }
    },
    {
        id: 'template_sparkline_milestones',
        category: 'sparkline',
        name: 'Project Milestones',
        description: 'Milestone completion sequence with high completion rate',
        label: '🏆 Project Milestones',
        badge: 'Last 15d',
        value: '12/15 Done',
        change: '⚡ 80%',
        changeType: 'neutral',
        color: '#1abc9c',
        sparklineType: 'winloss',
        dataPoints: [1, 1, -1, 1, 1, 1, -1, 1, 1, -1, 1, 1, 1, 1, 1],
        defaultSize: { width: '350px', height: '210px' }
    },

    // -------------------------------------------------------------
    // CATEGORY 2: KPI BIG NUMBERS (HTML 2 - 6 Templates)
    // -------------------------------------------------------------
    {
        id: 'template_kpi_total_revenue',
        category: 'kpi',
        name: 'Total Revenue',
        description: 'Financial KPI with currency prefix, target comparison & quarterly completion',
        label: 'Total Revenue',
        value: '48,52,430',
        currency: '₹',
        trend: 'up',
        trendValue: '+12.4%',
        kpiCategory: 'revenue',
        color: '#00b894',
        subMetrics: [
            { label: 'Q4 Target', value: '52L' },
            { label: 'Completion', value: '93%' }
        ],
        defaultSize: { width: '350px', height: '215px' }
    },
    {
        id: 'template_kpi_active_users',
        category: 'kpi',
        name: 'Active Users',
        description: 'User engagement metric with monthly influx & retention tracking',
        label: 'Active Users',
        value: '1,24,890',
        currency: '',
        trend: 'up',
        trendValue: '+8.7%',
        kpiCategory: 'users',
        color: '#6c5ce7',
        subMetrics: [
            { label: 'New this month', value: '12,430' },
            { label: 'Retention', value: '78%' }
        ],
        defaultSize: { width: '350px', height: '215px' }
    },
    {
        id: 'template_kpi_total_sales',
        category: 'kpi',
        name: 'Total Sales',
        description: 'Orders volume with average order value and items sold stats',
        label: 'Total Sales',
        value: '32,450',
        currency: '',
        trend: 'up',
        trendValue: '+15.2%',
        kpiCategory: 'sales',
        color: '#fdcb6e',
        subMetrics: [
            { label: 'Avg Order', value: '2,340' },
            { label: 'Items Sold', value: '89K' }
        ],
        defaultSize: { width: '350px', height: '215px' }
    },
    {
        id: 'template_kpi_revenue_growth',
        category: 'kpi',
        name: 'Revenue Growth',
        description: 'Growth velocity percentage comparing YoY and QoQ gains',
        label: 'Revenue Growth',
        value: '24.6%',
        currency: '',
        trend: 'up',
        trendValue: '+3.2%',
        kpiCategory: 'growth',
        color: '#e17055',
        subMetrics: [
            { label: 'YoY Growth', value: '18.4%' },
            { label: 'QoQ Growth', value: '6.2%' }
        ],
        defaultSize: { width: '350px', height: '215px' }
    },
    {
        id: 'template_kpi_social_engagement',
        category: 'kpi',
        name: 'Social Engagement',
        description: 'Social metrics tracking interaction, shares, and comments',
        label: 'Social Engagement',
        value: '2,84,200',
        currency: '',
        trend: 'down',
        trendValue: '-2.1%',
        kpiCategory: 'engagement',
        color: '#00cec9',
        subMetrics: [
            { label: 'Shares', value: '42K' },
            { label: 'Comments', value: '18K' }
        ],
        defaultSize: { width: '350px', height: '215px' }
    },
    {
        id: 'template_kpi_conversion_rate',
        category: 'kpi',
        name: 'Conversion Rate',
        description: 'Conversion funnel efficiency comparing leads against customers',
        label: 'Conversion Rate',
        value: '8.4%',
        currency: '',
        trend: 'neutral',
        trendValue: '0.0%',
        kpiCategory: 'conversion',
        color: '#fd79a8',
        subMetrics: [
            { label: 'Leads', value: '3,240' },
            { label: 'Customers', value: '272' }
        ],
        defaultSize: { width: '350px', height: '215px' }
    },

    // -------------------------------------------------------------
    // CATEGORY 3: GAUGES (HTML 3 - 6 Templates)
    // -------------------------------------------------------------
    {
        id: 'template_gauge_cpu',
        category: 'gauge',
        name: 'CPU Usage',
        description: 'Speedometer gauge for server 1 processing workload',
        label: 'CPU Usage',
        subLabel: 'Server 1',
        value: 67,
        color: '#3498db',
        defaultSize: { width: '280px', height: '220px' }
    },
    {
        id: 'template_gauge_memory',
        category: 'gauge',
        name: 'Memory',
        description: 'Speedometer gauge for system RAM allocation',
        label: 'Memory',
        subLabel: 'RAM Usage',
        value: 42,
        color: '#2ecc71',
        defaultSize: { width: '280px', height: '220px' }
    },
    {
        id: 'template_gauge_storage',
        category: 'gauge',
        name: 'Storage',
        description: 'Speedometer gauge tracking hard disk space occupancy',
        label: 'Storage',
        subLabel: 'Disk Space',
        value: 88,
        color: '#e74c3c',
        defaultSize: { width: '280px', height: '220px' }
    },
    {
        id: 'template_gauge_network',
        category: 'gauge',
        name: 'Network',
        description: 'Speedometer gauge monitoring network bandwidth saturation',
        label: 'Network',
        subLabel: 'Bandwidth',
        value: 23,
        color: '#9b59b6',
        defaultSize: { width: '280px', height: '220px' }
    },
    {
        id: 'template_gauge_battery',
        category: 'gauge',
        name: 'Battery',
        description: 'Speedometer gauge indicating battery charge level',
        label: 'Battery',
        subLabel: 'Laptop',
        value: 55,
        color: '#f39c12',
        defaultSize: { width: '280px', height: '220px' }
    },
    {
        id: 'template_gauge_performance',
        category: 'gauge',
        name: 'Performance',
        description: 'Speedometer gauge reflecting total system health index',
        label: 'Performance',
        subLabel: 'System',
        value: 94,
        color: '#1abc9c',
        defaultSize: { width: '280px', height: '220px' }
    },

    // -------------------------------------------------------------
    // CATEGORY 4: PROGRESS BARS (HTML 3 - 6 Templates)
    // -------------------------------------------------------------
    {
        id: 'template_progress_alpha',
        category: 'progress',
        name: 'Project Alpha',
        description: 'Smooth animated progress track for phase 1 deliverables',
        label: 'Project Alpha',
        subLabel: 'Phase 1',
        value: 78,
        color: '#2ecc71',
        defaultSize: { width: '300px', height: '170px' }
    },
    {
        id: 'template_progress_design',
        category: 'progress',
        name: 'Design Completion',
        description: 'UI/UX design milestone delivery progress bar',
        label: 'Design Completion',
        subLabel: 'UI/UX',
        value: 45,
        color: '#3498db',
        defaultSize: { width: '300px', height: '170px' }
    },
    {
        id: 'template_progress_code',
        category: 'progress',
        name: 'Code Review',
        description: 'Backend code review pass rate progress bar',
        label: 'Code Review',
        subLabel: 'Backend',
        value: 92,
        color: '#9b59b6',
        defaultSize: { width: '300px', height: '170px' }
    },
    {
        id: 'template_progress_testing',
        category: 'progress',
        name: 'Testing',
        description: 'Quality assurance test suite execution progress bar',
        label: 'Testing',
        subLabel: 'Quality Assurance',
        value: 33,
        color: '#e74c3c',
        defaultSize: { width: '300px', height: '170px' }
    },
    {
        id: 'template_progress_docs',
        category: 'progress',
        name: 'Documentation',
        description: 'API documentation readiness progress bar',
        label: 'Documentation',
        subLabel: 'API Docs',
        value: 61,
        color: '#f39c12',
        defaultSize: { width: '300px', height: '170px' }
    },
    {
        id: 'template_progress_deploy',
        category: 'progress',
        name: 'Deployment',
        description: 'Production cluster rollout progress bar',
        label: 'Deployment',
        subLabel: 'Production',
        value: 15,
        color: '#e67e22',
        defaultSize: { width: '300px', height: '170px' }
    }
];

// =================================================================
// AUTHENTIC DRAWING ENGINES FROM USER HTML
// =================================================================

export class SparklineEngine {
    static draw(canvas: HTMLCanvasElement, data: number[], type: 'line' | 'bar' | 'winloss', color: string = '#2ecc71'): void {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        const displayW = Math.max(120, Math.round(rect.width || canvas.parentElement?.clientWidth || 300));
        const displayH = Math.max(36, Math.round(rect.height || 54));

        if (canvas.width !== displayW || canvas.height !== displayH) {
            canvas.width = displayW;
            canvas.height = displayH;
        }

        const width = canvas.width;
        const height = canvas.height;
        ctx.clearRect(0, 0, width, height);

        if (!data || data.length === 0) return;

        if (type === 'line') {
            const min = Math.min(...data);
            const max = Math.max(...data);
            const range = max - min || 1;
            const padding = 6;
            const h = height - padding * 2;
            const step = (width - padding * 2) / Math.max(1, data.length - 1);

            const points = data.map((val, idx) => ({
                x: padding + idx * step,
                y: padding + h - ((val - min) / range) * h
            }));

            // Area Gradient
            ctx.beginPath();
            ctx.moveTo(points[0].x, height);
            points.forEach(p => ctx.lineTo(p.x, p.y));
            ctx.lineTo(points[points.length - 1].x, height);
            ctx.closePath();
            const grad = ctx.createLinearGradient(0, 0, 0, height);
            grad.addColorStop(0, color + '55');
            grad.addColorStop(1, color + '05');
            ctx.fillStyle = grad;
            ctx.fill();

            // Line
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            points.forEach(p => ctx.lineTo(p.x, p.y));
            ctx.strokeStyle = color;
            ctx.lineWidth = 2.5;
            ctx.stroke();

            // End point dot
            const last = points[points.length - 1];
            ctx.beginPath();
            ctx.arc(last.x, last.y, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.stroke();
        } else if (type === 'bar') {
            const min = Math.min(...data);
            const max = Math.max(...data);
            const range = max - min || 1;
            const barWidth = Math.max(3, (width / data.length) - 3);
            const step = width / data.length;

            data.forEach((val, idx) => {
                const norm = (val - min) / range;
                const barHeight = Math.max(4, norm * (height - 8));
                const x = idx * step + 1.5;
                const y = height - barHeight - 2;

                ctx.fillStyle = idx === data.length - 1 ? color : color + 'aa';
                ctx.beginPath();
                if (typeof (ctx as any).roundRect === 'function') {
                    (ctx as any).roundRect(x, y, barWidth, barHeight, [3, 3, 0, 0]);
                } else {
                    ctx.rect(x, y, barWidth, barHeight);
                }
                ctx.fill();
            });
        } else if (type === 'winloss') {
            const barWidth = Math.max(4, (width / data.length) - 4);
            const step = width / data.length;
            const mid = height / 2;

            data.forEach((val, idx) => {
                const isWin = val > 0;
                const x = idx * step + 2;
                const barHeight = height * 0.38;
                const y = isWin ? mid - barHeight : mid;

                ctx.fillStyle = isWin ? '#2ecc71' : '#e74c3c';
                ctx.beginPath();
                if (typeof (ctx as any).roundRect === 'function') {
                    (ctx as any).roundRect(x, y, barWidth, barHeight, 2);
                } else {
                    ctx.rect(x, y, barWidth, barHeight);
                }
                ctx.fill();
            });

            // Zero baseline
            ctx.beginPath();
            ctx.moveTo(0, mid);
            ctx.lineTo(width, mid);
            ctx.strokeStyle = '#cbd5e1';
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    }
}

export class GaugeEngine {
    static draw(canvas: HTMLCanvasElement, value: number, color: string = '#3498db'): void {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        const displayW = Math.max(100, Math.round(rect.width || canvas.parentElement?.clientWidth || 200));
        const displayH = Math.max(70, Math.round(rect.height || 100));

        if (canvas.width !== displayW || canvas.height !== displayH) {
            canvas.width = displayW;
            canvas.height = displayH;
        }

        const width = canvas.width;
        const height = canvas.height;
        ctx.clearRect(0, 0, width, height);

        const cx = width / 2;
        const cy = height - 12;
        const radius = Math.min(cx - 16, cy - 10);

        // Background track arc
        ctx.beginPath();
        ctx.arc(cx, cy, radius, Math.PI, 2 * Math.PI);
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 12;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Active value arc
        const pct = Math.max(0, Math.min(100, value)) / 100;
        const endAngle = Math.PI + pct * Math.PI;

        if (pct > 0.01) {
            ctx.beginPath();
            ctx.arc(cx, cy, radius, Math.PI, endAngle);
            ctx.strokeStyle = color;
            ctx.lineWidth = 12;
            ctx.lineCap = 'round';
            ctx.stroke();
        }

        // Needle pin
        const needleLen = radius - 8;
        const needleAngle = Math.PI + pct * Math.PI;
        const nx = cx + needleLen * Math.cos(needleAngle);
        const ny = cy + needleLen * Math.sin(needleAngle);

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(nx, ny);
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Center hub circle
        ctx.beginPath();
        ctx.arc(cx, cy, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#1e293b';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx, cy, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
    }
}

// =================================================================
// DASHBOARD CONTAINER ELEMENT CREATION
// =================================================================

/**
 * Creates the outer container element with chart container classes and styling.
 * Preserves overflow: visible so corner handles can be grabbed smoothly from all angles.
 */
export function createTemplateContainerElement(chartConfig: any): HTMLElement {
    const container = document.createElement('div');
    container.id = `container-${chartConfig.id}`;
    container.className = 'visualization-container chart-item chart-fade-in template-card-container';

    const cat = chartConfig.templateCategory || (
        chartConfig.id.includes('sparkline') ? 'sparkline' :
        chartConfig.id.includes('kpi') ? 'kpi' :
        chartConfig.id.includes('gauge') ? 'gauge' :
        chartConfig.id.includes('textbox') ? 'textbox' : 'progress'
    );
    const defaultW = cat === 'gauge' ? '280px' : cat === 'progress' ? '300px' : cat === 'textbox' ? '360px' : '350px';
    const defaultH = cat === 'gauge' ? '220px' : cat === 'progress' ? '170px' : cat === 'textbox' ? '185px' : '210px';

    const w = chartConfig.size?.width || defaultW;
    const h = chartConfig.size?.height || defaultH;
    const tPos = chartConfig.position?.top || '100px';
    const lPos = chartConfig.position?.left || '100px';

    container.style.cssText = `
        position: absolute;
        width: ${w};
        height: ${h};
        top: ${tPos};
        left: ${lPos};
        z-index: 100;
        cursor: grab;
        box-sizing: border-box;
        overflow: visible !important;
    `;
    return container;
}

// =================================================================
// TEMPLATE CARD RENDERING & REAL-TIME REDRAW
// =================================================================

/**
 * Renders the full interactive template card into its container.
 */
export function renderTemplateCard(container: HTMLElement, chartConfig: any): void {
    // Automatically evaluate formulas (e.g. =INSERT(A4, R, "sales")) before rendering
    applyFormulasToCardConfig(chartConfig);

    const cat: 'sparkline' | 'kpi' | 'gauge' | 'progress' | 'textbox' = chartConfig.templateCategory || (
        chartConfig.id.includes('sparkline') ? 'sparkline' :
        chartConfig.id.includes('kpi') ? 'kpi' :
        chartConfig.id.includes('gauge') ? 'gauge' :
        chartConfig.id.includes('textbox') ? 'textbox' : 'progress'
    );

    let inner = container.querySelector(':scope > .template-card-inner') as HTMLElement;
    if (!inner) {
        inner = document.createElement('div');
        inner.className = 'template-card-inner';
        container.appendChild(inner);
    }

    const color = chartConfig.color || '#2ecc71';
    let bodyHtml = '';

    // -------------------------------------------------------------
    // 1. SPARKLINE CARD (HTML 1 SPECIFICATION)
    // -------------------------------------------------------------
    if (cat === 'sparkline') {
        const sparkType: 'line' | 'bar' | 'winloss' = chartConfig.sparklineType || 'line';
        const label = chartConfig.label || chartConfig.title || '💰 Daily Sales';
        const badge = chartConfig.badge || 'Last 30d';
        const value = chartConfig.value || '₹4,82,500';
        const change = chartConfig.change || chartConfig.trend || '↑ 12.4%';
        const changeType = chartConfig.changeType || chartConfig.trendDirection || 'up';
        const typeLabels: Record<string, string> = { line: '📈 Line', bar: '📊 Bar', winloss: '🎯 Win/Loss' };

        bodyHtml = `
            <div class="card-template" data-type="${sparkType}">
                <div class="card-label">
                    <span class="label-text template-editable" contenteditable="true" spellcheck="false" data-field="label" title="Click to edit or double-click for formula">${label}</span>
                    <span class="badge-group">
                        <span class="badge template-editable" contenteditable="true" spellcheck="false" data-field="badge" title="Click to edit or double-click for formula">${badge}</span>
                        <span class="type-badge ${sparkType} switch-type-cycle" title="Click to cycle chart type">${typeLabels[sparkType] || 'Line'}</span>
                    </span>
                </div>
                <div class="card-value">
                    <span class="value-text template-editable" contenteditable="true" spellcheck="false" data-field="value" title="Click to edit or double-click for formula">${value}</span>
                    <small class="${changeType} template-editable" contenteditable="true" spellcheck="false" data-field="change" title="Click to edit or double-click for formula">${change}</small>
                </div>
                <div class="sparkline-wrapper">
                    <canvas class="sparkline-canvas"></canvas>
                </div>
                <div class="card-footer template-card-actions">
                    <div class="action-btn-group type-switch-group">
                        <button type="button" class="btn-sm btn-icon switch-type-btn ${sparkType === 'line' ? 'active' : ''}" data-type="line" title="Line Sparkline" aria-label="Line"><i class="bi bi-graph-up"></i></button>
                        <button type="button" class="btn-sm btn-icon switch-type-btn ${sparkType === 'bar' ? 'active' : ''}" data-type="bar" title="Bar Sparkline" aria-label="Bar"><i class="bi bi-bar-chart"></i></button>
                        <button type="button" class="btn-sm btn-icon switch-type-btn ${sparkType === 'winloss' ? 'active' : ''}" data-type="winloss" title="Win/Loss Sparkline" aria-label="Win/Loss"><i class="bi bi-activity"></i></button>
                    </div>
                    <div class="action-btn-group main-action-group">
                        <button type="button" class="btn-sm btn-icon edit-card-btn" title="Edit Data & Formulas (=INSERT, SUM, AVG)" aria-label="Formula"><i class="bi bi-calculator"></i></button>
                        <button type="button" class="btn-sm btn-icon copy-card-btn" title="Duplicate Card" aria-label="Duplicate"><i class="bi bi-copy"></i></button>
                        <button type="button" class="btn-sm btn-icon danger delete-card-btn" title="Delete Card" aria-label="Delete"><i class="bi bi-trash3"></i></button>
                    </div>
                </div>
            </div>
        `;
    }

    // -------------------------------------------------------------
    // 2. KPI CARD (HTML 2 SPECIFICATION)
    // -------------------------------------------------------------
    else if (cat === 'kpi') {
        const kpiCategory = chartConfig.kpiCategory || chartConfig.badge || 'revenue';
        const label = chartConfig.label || chartConfig.title || 'Total Revenue';
        const value = chartConfig.value || '48,52,430';
        const currency = chartConfig.currency !== undefined ? chartConfig.currency : '₹';
        const trend = chartConfig.trend || 'up';
        const trendValue = chartConfig.trendValue || chartConfig.change || '+12.4%';
        const trendIcons: Record<string, string> = { up: '↑', down: '↓', neutral: '→' };

        const subMetrics: Array<{ label: string; value: string }> = chartConfig.subMetrics || [
            { label: 'Q4 Target', value: '52L' },
            { label: 'Completion', value: '93%' }
        ];

        const subMetricsHTML = subMetrics.map((sm, idx) => `
            <div class="sub-item">
                <span class="template-editable" contenteditable="true" spellcheck="false" data-sub-idx="${idx}" data-sub-field="label" title="Click to edit or double-click for formula">${sm.label}:</span>
                <strong class="template-editable" contenteditable="true" spellcheck="false" data-sub-idx="${idx}" data-sub-field="value" title="Click to edit or double-click for formula">${sm.value}</strong>
            </div>
        `).join('');

        bodyHtml = `
            <div class="kpi-card" data-category="${kpiCategory}">
                <div class="kpi-label">
                    <span class="label-text template-editable" contenteditable="true" spellcheck="false" data-field="label" title="Click to edit or double-click for formula">${label}</span>
                    <span class="badge-group">
                        <span class="category-badge ${kpiCategory} switch-cat-cycle" title="Click to cycle category">${kpiCategory}</span>
                    </span>
                </div>
                <div class="kpi-value">
                    ${currency ? `<span class="currency-symbol template-editable" contenteditable="true" spellcheck="false" data-field="currency" title="Click to edit">${currency}</span>` : ''}
                    <span class="value-text template-editable" contenteditable="true" spellcheck="false" data-field="value" title="Click to edit or double-click for formula">${value}</span>
                </div>
                <div class="trend-container">
                    <span class="trend-indicator ${trend}">
                        <span class="trend-icon">${trendIcons[trend] || '→'}</span>
                        <span class="trend-text template-editable" contenteditable="true" spellcheck="false" data-field="trendValue" title="Click to edit or double-click for formula">${trendValue}</span>
                    </span>
                    <span style="font-size: 11px; color: #94a3b8;">vs previous period</span>
                </div>
                <div class="sub-metrics">
                    ${subMetricsHTML}
                </div>
                <div class="card-footer template-card-actions">
                    <div class="action-btn-group cat-switch-group">
                        <button type="button" class="btn-sm btn-icon switch-cat-btn ${kpiCategory === 'revenue' ? 'active' : ''}" data-category="revenue" title="Revenue Metric" aria-label="Revenue"><i class="bi bi-currency-rupee"></i></button>
                        <button type="button" class="btn-sm btn-icon switch-cat-btn ${kpiCategory === 'users' ? 'active' : ''}" data-category="users" title="Users Metric" aria-label="Users"><i class="bi bi-people"></i></button>
                        <button type="button" class="btn-sm btn-icon switch-cat-btn ${kpiCategory === 'sales' ? 'active' : ''}" data-category="sales" title="Sales Metric" aria-label="Sales"><i class="bi bi-cart3"></i></button>
                        <button type="button" class="btn-sm btn-icon switch-cat-btn ${kpiCategory === 'growth' ? 'active' : ''}" data-category="growth" title="Growth Metric" aria-label="Growth"><i class="bi bi-graph-up-arrow"></i></button>
                    </div>
                    <div class="action-btn-group main-action-group">
                        <button type="button" class="btn-sm btn-icon edit-card-btn" title="Edit Data & Formulas (=INSERT, SUM, AVG)" aria-label="Formula"><i class="bi bi-calculator"></i></button>
                        <button type="button" class="btn-sm btn-icon copy-card-btn" title="Duplicate Card" aria-label="Duplicate"><i class="bi bi-copy"></i></button>
                        <button type="button" class="btn-sm btn-icon danger delete-card-btn" title="Delete Card" aria-label="Delete"><i class="bi bi-trash3"></i></button>
                    </div>
                </div>
            </div>
        `;
    }

    // -------------------------------------------------------------
    // 3. GAUGE CARD (HTML 3 SPECIFICATION)
    // -------------------------------------------------------------
    else if (cat === 'gauge') {
        const label = chartConfig.label || chartConfig.title || 'CPU Usage';
        const subLabel = chartConfig.subLabel || chartConfig.subtitle || 'Server 1';
        const numVal = Math.max(0, Math.min(100, parseFloat(String(chartConfig.value).replace(/[^0-9.]/g, '')) || 67));

        bodyHtml = `
            <div class="gauge-card">
                <div class="label template-editable" contenteditable="true" spellcheck="false" data-field="label" title="Click to edit or double-click for formula">${label}</div>
                <div class="sub-label template-editable" contenteditable="true" spellcheck="false" data-field="subLabel" title="Click to edit or double-click for formula">${subLabel}</div>
                <canvas class="gauge-canvas"></canvas>
                <div class="value template-editable" contenteditable="true" spellcheck="false" data-field="value" title="Click to edit or double-click for formula">${numVal}<small>%</small></div>
                <div class="gauge-footer template-card-actions">
                    <div class="action-btn-group step-btn-group">
                        <button type="button" class="btn-sm btn-icon step-gauge-btn" data-delta="-10" title="Decrease Value (-10)" aria-label="Decrease"><i class="bi bi-dash-lg"></i></button>
                        <button type="button" class="btn-sm btn-icon step-gauge-btn" data-delta="10" title="Increase Value (+10)" aria-label="Increase"><i class="bi bi-plus-lg"></i></button>
                    </div>
                    <div class="action-btn-group main-action-group">
                        <button type="button" class="btn-sm btn-icon edit-card-btn" title="Edit Data & Formulas (=INSERT, SUM, AVG)" aria-label="Formula"><i class="bi bi-calculator"></i></button>
                        <button type="button" class="btn-sm btn-icon copy-card-btn" title="Duplicate Card" aria-label="Duplicate"><i class="bi bi-copy"></i></button>
                        <button type="button" class="btn-sm btn-icon danger delete-card-btn" title="Delete Card" aria-label="Delete"><i class="bi bi-trash3"></i></button>
                    </div>
                </div>
            </div>
        `;
    }

    // -------------------------------------------------------------
    // 4. READY-MADE STYLED TEXTBOX CARD
    // -------------------------------------------------------------
    else if (cat === 'textbox') {
        const style = chartConfig.textboxStyle || 'gradient';
        const label = chartConfig.label || chartConfig.title || 'Executive Header';
        const subLabel = chartConfig.subLabel || chartConfig.subtitle || '';
        const badge = chartConfig.badge || 'Ready-Made';
        const value = chartConfig.value || 'Sample styled textbox';
        const trendValue = chartConfig.trendValue || '';

        const styleNames: Record<string, string> = {
            gradient: 'Gradient',
            callout: 'Callout',
            ocean: 'Ocean Wave',
            cyber: 'Cyber Neon',
            sunset: 'Sunset Glow',
            minimal: 'Minimal',
            alert: 'Alert Banner',
            quote: 'Quote',
            dark_luxury: 'Dark Luxury',
            notes: 'Notes'
        };

        bodyHtml = `
            <div class="textbox-card" data-style="${style}">
                <div class="textbox-header">
                    <div class="textbox-title-group">
                        <span class="textbox-label template-editable" contenteditable="true" spellcheck="false" data-field="label" title="Click to edit or double-click for formula">${label}</span>
                    </div>
                    <div class="textbox-badge-group">
                        <span class="textbox-badge template-editable" contenteditable="true" spellcheck="false" data-field="badge" title="Click to edit or double-click for formula">${badge}</span>
                        <span class="textbox-style-badge switch-style-cycle" title="Click to cycle textbox style">${styleNames[style] || 'Style'}</span>
                    </div>
                </div>
                ${subLabel ? `
                    <div class="textbox-sub-label template-editable" contenteditable="true" spellcheck="false" data-field="subLabel" title="Click to edit or double-click for formula">${subLabel}</div>
                ` : `
                    <div class="textbox-sub-label template-editable" contenteditable="true" spellcheck="false" data-field="subLabel" title="Click to edit or double-click for formula" style="min-height: 12px;"></div>
                `}
                <div class="textbox-body">
                    <div class="textbox-value template-editable" contenteditable="true" spellcheck="false" data-field="value" title="Click to edit or double-click for formula">${value}</div>
                    ${trendValue ? `
                        <div class="textbox-status-row">
                            <span class="badge bg-light text-dark border rounded-pill px-2 py-0.5 template-editable" contenteditable="true" spellcheck="false" data-field="trendValue" title="Click to edit or double-click for formula">${trendValue}</span>
                        </div>
                    ` : ''}
                </div>
                <div class="card-footer template-card-actions">
                    <div class="action-btn-group style-btn-group">
                        <button type="button" class="btn-sm btn-icon switch-style-btn" title="Cycle Ready-Made Textbox Style" aria-label="Style"><i class="bi bi-palette"></i></button>
                    </div>
                    <div class="action-btn-group main-action-group">
                        <button type="button" class="btn-sm btn-icon edit-card-btn" title="Edit Data & Formulas (=INSERT, SUM, AVG)" aria-label="Formula"><i class="bi bi-calculator"></i></button>
                        <button type="button" class="btn-sm btn-icon copy-card-btn" title="Duplicate Card" aria-label="Duplicate"><i class="bi bi-copy"></i></button>
                        <button type="button" class="btn-sm btn-icon danger delete-card-btn" title="Delete Card" aria-label="Delete"><i class="bi bi-trash3"></i></button>
                    </div>
                </div>
            </div>
        `;
    }

    // -------------------------------------------------------------
    // 5. PROGRESS CARD (HTML 3 SPECIFICATION)
    // -------------------------------------------------------------
    else {
        const label = chartConfig.label || chartConfig.title || 'Project Alpha';
        const subLabel = chartConfig.subLabel || chartConfig.subtitle || 'Phase 1';
        const numVal = Math.max(0, Math.min(100, parseFloat(String(chartConfig.value).replace(/[^0-9.]/g, '')) || 78));

        bodyHtml = `
            <div class="progress-card">
                <div class="progress-header">
                    <span class="label template-editable" contenteditable="true" spellcheck="false" data-field="label" title="Click to edit or double-click for formula">${label}</span>
                    <span class="percentage template-editable" contenteditable="true" spellcheck="false" data-field="value" title="Click to edit or double-click for formula">${numVal}%</span>
                </div>
                <div class="sub-label template-editable" contenteditable="true" spellcheck="false" data-field="subLabel" title="Click to edit or double-click for formula">${subLabel}</div>
                <div class="progress-track">
                    <div class="progress-fill" style="width: ${numVal}%; background-color: ${color};"></div>
                </div>
                <div class="progress-footer template-card-actions">
                    <div class="action-btn-group step-btn-group">
                        <button type="button" class="btn-sm btn-icon step-progress-btn" data-delta="-10" title="Decrease Progress (-10%)" aria-label="Decrease"><i class="bi bi-dash-lg"></i></button>
                        <button type="button" class="btn-sm btn-icon step-progress-btn" data-delta="10" title="Increase Progress (+10%)" aria-label="Increase"><i class="bi bi-plus-lg"></i></button>
                    </div>
                    <div class="action-btn-group main-action-group">
                        <button type="button" class="btn-sm btn-icon edit-card-btn" title="Edit Data & Formulas (=INSERT, SUM, AVG)" aria-label="Formula"><i class="bi bi-calculator"></i></button>
                        <button type="button" class="btn-sm btn-icon copy-card-btn" title="Duplicate Card" aria-label="Duplicate"><i class="bi bi-copy"></i></button>
                        <button type="button" class="btn-sm btn-icon danger delete-card-btn" title="Delete Card" aria-label="Delete"><i class="bi bi-trash3"></i></button>
                    </div>
                </div>
            </div>
        `;
    }

    inner.innerHTML = bodyHtml;

    // Draw active visual
    redrawVisual(inner, chartConfig);

    // Attach resize hook for real-time redrawing on card resize
    (container as any)._onTemplateResize = () => {
        redrawVisual(inner, chartConfig);
    };

    // Attach event listeners for inline editing & footer buttons
    attachCardListeners(container, inner, chartConfig);

    // Initialize or re-attach drag and resize handles
    initializeDragAndResize(container);
}

/**
 * Redraws the sparkline or gauge canvas based on the current element size.
 */
function redrawVisual(inner: HTMLElement, chartConfig: any): void {
    const sparkCanvas = inner.querySelector('.sparkline-canvas') as HTMLCanvasElement;
    if (sparkCanvas) {
        const sparkType: 'line' | 'bar' | 'winloss' = chartConfig.sparklineType || 'line';
        const color = chartConfig.color || '#2ecc71';
        const data = chartConfig.dataPoints || [220, 280, 350, 420, 390, 410, 480, 500, 520, 490, 530, 560, 580];
        SparklineEngine.draw(sparkCanvas, data, sparkType, color);
    }

    const gaugeCanvas = inner.querySelector('.gauge-canvas') as HTMLCanvasElement;
    if (gaugeCanvas) {
        const color = chartConfig.color || '#3498db';
        const numVal = Math.max(0, Math.min(100, parseFloat(String(chartConfig.value).replace(/[^0-9.]/g, '')) || 67));
        GaugeEngine.draw(gaugeCanvas, numVal, color);
    }
}

/**
 * Attaches interactive listeners for inline editing, button switching, and actions.
 */
function attachCardListeners(container: HTMLElement, inner: HTMLElement, chartConfig: any): void {
    // 1. Inline editable text fields
    inner.querySelectorAll<HTMLElement>('.template-editable').forEach(el => {
        el.addEventListener('blur', async () => {
            const field = el.dataset.field;
            const subIdx = el.dataset.subIdx;
            const subField = el.dataset.subField;
            const newText = el.textContent?.trim() || '';

            if (subIdx !== undefined && subField && chartConfig.subMetrics) {
                const idx = parseInt(subIdx, 10);
                if (!chartConfig.formulas) chartConfig.formulas = {};
                const formulaKey = `subMetric_${idx}_${subField}`;
                if (newText.startsWith('=')) {
                    chartConfig.formulas[formulaKey] = newText;
                    applyFormulasToCardConfig(chartConfig);
                    renderTemplateCard(container, chartConfig);
                    await saveDashboardSettings();
                    showMessage(`Formula applied to submetric: ${newText}`, 'success');
                    return;
                } else {
                    delete chartConfig.formulas[formulaKey];
                }
                if (chartConfig.subMetrics[idx]) {
                    chartConfig.subMetrics[idx][subField] = newText.replace(':', '').trim();
                }
            } else if (field) {
                if (!chartConfig.formulas) chartConfig.formulas = {};

                // If user entered a formula like =INSERT(A4, R, "sales")
                if (newText.startsWith('=')) {
                    chartConfig.formulas[field] = newText;
                    applyFormulasToCardConfig(chartConfig);
                    renderTemplateCard(container, chartConfig);
                    await saveDashboardSettings();
                    showMessage(`Formula applied: ${newText}`, 'success');
                    return;
                } else {
                    // Normal text: remove any previous formula for this field
                    delete chartConfig.formulas[field];
                }

                if (field === 'value') {
                    chartConfig.value = newText;
                    const numMatch = parseFloat(newText.replace(/[^0-9.]/g, ''));
                    if (!isNaN(numMatch)) {
                        chartConfig.gaugeValue = numMatch;
                        const pFill = inner.querySelector('.progress-fill') as HTMLElement;
                        if (pFill) pFill.style.width = `${Math.max(0, Math.min(100, numMatch))}%`;
                        const gCanvas = inner.querySelector('.gauge-canvas') as HTMLCanvasElement;
                        if (gCanvas) GaugeEngine.draw(gCanvas, numMatch, chartConfig.color);
                    }
                } else {
                    chartConfig[field] = newText;
                }
            }

            await saveDashboardSettings();
        });

        // Press Enter to blur/commit (Shift+Enter for newline in textbox body)
        el.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                if (e.shiftKey && el.classList.contains('textbox-value')) {
                    // Allow newline inside long textbox description
                    return;
                }
                e.preventDefault();
                el.blur();
            }
        });

        // Double click to open interactive Formula & Data picker modal
        el.addEventListener('dblclick', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const field = el.dataset.field || 'value';
            openTemplateEditModal(chartConfig, field);
        });
    });

    // 1b. Edit Card & Formula Button
    inner.querySelectorAll<HTMLElement>('.edit-card-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            openTemplateEditModal(chartConfig, 'value');
        });
    });

    // 2. Sparkline Type Switcher buttons
    inner.querySelectorAll<HTMLButtonElement>('.switch-type-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            const newType = btn.dataset.type as 'line' | 'bar' | 'winloss';
            if (newType) {
                chartConfig.sparklineType = newType;
                renderTemplateCard(container, chartConfig);
                await saveDashboardSettings();
            }
        });
    });

    // 3. Sparkline Type Badge Cycle click
    const cycleBadge = inner.querySelector('.switch-type-cycle');
    if (cycleBadge) {
        cycleBadge.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            const types: Array<'line' | 'bar' | 'winloss'> = ['line', 'bar', 'winloss'];
            const current = chartConfig.sparklineType || 'line';
            const nextType = types[(types.indexOf(current) + 1) % types.length];
            chartConfig.sparklineType = nextType;
            renderTemplateCard(container, chartConfig);
            await saveDashboardSettings();
        });
    }

    // 4. KPI Category Switcher buttons
    inner.querySelectorAll<HTMLButtonElement>('.switch-cat-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            const cat = btn.dataset.category;
            if (cat) {
                chartConfig.kpiCategory = cat;
                if (cat === 'revenue') {
                    chartConfig.label = 'Total Revenue';
                    chartConfig.value = '48,52,430';
                    chartConfig.currency = '₹';
                    chartConfig.color = '#00b894';
                    chartConfig.trend = 'up';
                    chartConfig.trendValue = '+12.4%';
                } else if (cat === 'users') {
                    chartConfig.label = 'Active Users';
                    chartConfig.value = '1,24,890';
                    chartConfig.currency = '';
                    chartConfig.color = '#6c5ce7';
                    chartConfig.trend = 'up';
                    chartConfig.trendValue = '+8.7%';
                } else if (cat === 'sales') {
                    chartConfig.label = 'Total Sales';
                    chartConfig.value = '32,450';
                    chartConfig.currency = '';
                    chartConfig.color = '#fdcb6e';
                    chartConfig.trend = 'up';
                    chartConfig.trendValue = '+15.2%';
                } else if (cat === 'growth') {
                    chartConfig.label = 'Revenue Growth';
                    chartConfig.value = '24.6%';
                    chartConfig.currency = '';
                    chartConfig.color = '#e17055';
                    chartConfig.trend = 'up';
                    chartConfig.trendValue = '+3.2%';
                }
                renderTemplateCard(container, chartConfig);
                await saveDashboardSettings();
            }
        });
    });

    // 4b. Ready-Made Textbox Style Switcher & Cycle Badge
    const availableTextboxStyles = ['gradient', 'callout', 'ocean', 'cyber', 'sunset', 'minimal', 'alert', 'quote', 'dark_luxury', 'notes'];
    inner.querySelectorAll<HTMLButtonElement>('.switch-style-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            const currentStyle = chartConfig.textboxStyle || 'gradient';
            const nextStyle = availableTextboxStyles[(availableTextboxStyles.indexOf(currentStyle) + 1) % availableTextboxStyles.length];
            chartConfig.textboxStyle = nextStyle;
            renderTemplateCard(container, chartConfig);
            await saveDashboardSettings();
            showMessage(`Style switched to ${nextStyle.toUpperCase()}`, 'info');
        });
    });

    const styleCycle = inner.querySelector('.switch-style-cycle');
    if (styleCycle) {
        styleCycle.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            const currentStyle = chartConfig.textboxStyle || 'gradient';
            const nextStyle = availableTextboxStyles[(availableTextboxStyles.indexOf(currentStyle) + 1) % availableTextboxStyles.length];
            chartConfig.textboxStyle = nextStyle;
            renderTemplateCard(container, chartConfig);
            await saveDashboardSettings();
            showMessage(`Style switched to ${nextStyle.toUpperCase()}`, 'info');
        });
    }

    // 5. Gauge Live Adjustment (-10 / +10)
    inner.querySelectorAll<HTMLButtonElement>('.step-gauge-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            const delta = parseInt(btn.dataset.delta || '0', 10);
            let current = parseFloat(String(chartConfig.value).replace(/[^0-9.]/g, '')) || 67;
            current = Math.max(0, Math.min(100, current + delta));
            chartConfig.value = current;
            renderTemplateCard(container, chartConfig);
            await saveDashboardSettings();
        });
    });

    // 6. Progress Live Adjustment (-10 / +10)
    inner.querySelectorAll<HTMLButtonElement>('.step-progress-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            const delta = parseInt(btn.dataset.delta || '0', 10);
            let current = parseFloat(String(chartConfig.value).replace(/[^0-9.]/g, '')) || 78;
            current = Math.max(0, Math.min(100, current + delta));
            chartConfig.value = current;
            renderTemplateCard(container, chartConfig);
            await saveDashboardSettings();
        });
    });

    // 7. Duplicate Card Action
    inner.querySelectorAll<HTMLElement>('.copy-card-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            duplicateChart(chartConfig.id);
        });
    });

    // 8. Delete Card Action
    inner.querySelectorAll<HTMLElement>('.delete-card-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            clearChart(chartConfig.id);
        });
    });

    // 9. Auto-Hide Action Buttons after Inactivity / Idle Timer
    setupContainerAutoHide(container);
}

/**
 * Sets up an auto-hide timer for template card action buttons.
 * When the user interacts or clicks the card, the buttons are visible.
 * If the container receives no clicks or interactions for 3.5 seconds, the buttons auto-hide smoothly.
 * Clicking outside the container immediately hides the buttons.
 */
function setupContainerAutoHide(container: HTMLElement): void {
    if ((container as any)._cleanupAutoHide) {
        (container as any)._cleanupAutoHide();
    }

    const IDLE_TIMEOUT_MS = 3500;
    let idleTimer: any = null;

    const showActions = () => {
        container.classList.remove('is-idle');
        container.classList.add('is-active');
        resetTimer();
    };

    const hideActions = () => {
        container.classList.remove('is-active');
        container.classList.add('is-idle');
        if (idleTimer) {
            clearTimeout(idleTimer);
            idleTimer = null;
        }
    };

    const resetTimer = () => {
        if (idleTimer) clearTimeout(idleTimer);
        idleTimer = setTimeout(() => {
            hideActions();
        }, IDLE_TIMEOUT_MS);
    };

    const onContainerClick = () => {
        showActions();
    };

    const onContainerInteraction = () => {
        container.classList.remove('is-idle');
        resetTimer();
    };

    const onMouseLeave = () => {
        if (idleTimer) clearTimeout(idleTimer);
        idleTimer = setTimeout(() => {
            hideActions();
        }, 1200);
    };

    const onDocClick = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target && !container.contains(target) && !target.closest('.modal') && !target.closest('.swal2-container')) {
            hideActions();
        }
    };

    container.addEventListener('click', onContainerClick);
    container.addEventListener('mousedown', onContainerInteraction);
    container.addEventListener('mousemove', onContainerInteraction);
    container.addEventListener('keydown', onContainerInteraction);
    container.addEventListener('touchstart', onContainerInteraction, { passive: true });
    container.addEventListener('mouseleave', onMouseLeave);
    document.addEventListener('click', onDocClick);

    (container as any)._cleanupAutoHide = () => {
        if (idleTimer) clearTimeout(idleTimer);
        container.removeEventListener('click', onContainerClick);
        container.removeEventListener('mousedown', onContainerInteraction);
        container.removeEventListener('mousemove', onContainerInteraction);
        container.removeEventListener('keydown', onContainerInteraction);
        container.removeEventListener('touchstart', onContainerInteraction);
        container.removeEventListener('mouseleave', onMouseLeave);
        document.removeEventListener('click', onDocClick);
    };
}

// =================================================================
// TEMPLATES GALLERY SIDEBAR
// =================================================================

/**
 * Initializes the Template Gallery in the sidebar panel.
 */
/**
 * Generates an authentic SVG preview graphic for sparkline cards in the gallery.
 */
function generateSparklineSvg(tpl: TemplateDefinition): string {
    const data = tpl.dataPoints || [20, 35, 28, 48, 62, 58, 80, 95];
    const width = 230;
    const height = 44;
    const color = tpl.color || '#2ecc71';
    const type = tpl.sparklineType || 'line';

    if (type === 'line') {
        const min = Math.min(...data);
        const max = Math.max(...data);
        const range = max - min || 1;
        const pad = 4;
        const h = height - pad * 2;
        const step = (width - pad * 2) / Math.max(1, data.length - 1);
        const points = data.map((v, i) => ({
            x: pad + i * step,
            y: pad + h - ((v - min) / range) * h
        }));
        const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
        const lastP = points[points.length - 1];
        const areaD = `${pathD} L ${lastP.x.toFixed(1)} ${height} L ${points[0].x.toFixed(1)} ${height} Z`;
        const gradId = `spark-grad-${tpl.id}`;

        return `
            <svg viewBox="0 0 ${width} ${height}" class="w-100" style="height: 44px; display: block; overflow: visible;">
                <defs>
                    <linearGradient id="${gradId}" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="${color}" stop-opacity="0.32"/>
                        <stop offset="100%" stop-color="${color}" stop-opacity="0.02"/>
                    </linearGradient>
                </defs>
                <path d="${areaD}" fill="url(#${gradId})" />
                <path d="${pathD}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
                <circle cx="${lastP.x.toFixed(1)}" cy="${lastP.y.toFixed(1)}" r="3.5" fill="#ffffff" stroke="${color}" stroke-width="2" />
            </svg>
        `;
    } else if (type === 'bar') {
        const min = Math.min(...data);
        const max = Math.max(...data);
        const range = max - min || 1;
        const count = data.length;
        const barW = Math.max(5, Math.floor(width / count) - 4);
        const step = width / count;

        const bars = data.map((v, i) => {
            const norm = (v - min) / range;
            const barH = Math.max(5, Math.round(norm * (height - 8)));
            const x = Math.round(i * step + 2);
            const y = height - barH - 2;
            const isLast = i === count - 1;
            const fill = isLast ? color : `${color}aa`;
            return `<rect x="${x}" y="${y}" width="${barW}" height="${barH}" rx="2" ry="2" fill="${fill}" />`;
        }).join('');

        return `
            <svg viewBox="0 0 ${width} ${height}" class="w-100" style="height: 44px; display: block;">
                ${bars}
            </svg>
        `;
    } else {
        // winloss
        const count = data.length;
        const barW = Math.max(5, Math.floor(width / count) - 4);
        const step = width / count;
        const mid = Math.round(height / 2);

        const bars = data.map((v, i) => {
            const isWin = v > 0;
            const x = Math.round(i * step + 2);
            const barH = Math.round(height * 0.38);
            const y = isWin ? mid - barH : mid;
            const fill = isWin ? '#2ecc71' : '#e74c3c';
            return `<rect x="${x}" y="${y}" width="${barW}" height="${barH}" rx="2" ry="2" fill="${fill}" />`;
        }).join('');

        return `
            <svg viewBox="0 0 ${width} ${height}" class="w-100" style="height: 44px; display: block;">
                <line x1="0" y1="${mid}" x2="${width}" y2="${mid}" stroke="#cbd5e1" stroke-width="1" stroke-dasharray="2 2" />
                ${bars}
            </svg>
        `;
    }
}

/**
 * Generates an authentic SVG speedometer gauge graphic for the gallery preview.
 */
function generateGaugeSvg(tpl: TemplateDefinition): string {
    const val = Math.max(0, Math.min(100, parseFloat(String(tpl.value).replace(/[^0-9.]/g, '')) || 50));
    const color = tpl.color || '#3498db';
    const cx = 90;
    const cy = 60;
    const r = 44;

    const pct = val / 100;
    const angle = Math.PI + pct * Math.PI;
    const nx = cx + (r - 8) * Math.cos(angle);
    const ny = cy + (r - 8) * Math.sin(angle);

    const arcEndX = cx + r * Math.cos(angle);
    const arcEndY = cy + r * Math.sin(angle);
    const largeArc = pct > 0.5 ? 1 : 0;
    const activeArcD = pct > 0.01 ? `M ${cx - r},${cy} A ${r},${r} 0 ${largeArc},1 ${arcEndX.toFixed(1)},${arcEndY.toFixed(1)}` : '';

    return `
        <svg viewBox="0 0 180 75" class="w-100" style="height: 56px; display: block; margin: 0 auto; overflow: visible;">
            <!-- Background Arc -->
            <path d="M ${cx - r},${cy} A ${r},${r} 0 0,1 ${cx + r},${cy}" fill="none" stroke="#e2e8f0" stroke-width="8" stroke-linecap="round" />
            <!-- Active Color Arc -->
            ${activeArcD ? `<path d="${activeArcD}" fill="none" stroke="${color}" stroke-width="8" stroke-linecap="round" />` : ''}
            <!-- Needle -->
            <line x1="${cx}" y1="${cy}" x2="${nx.toFixed(1)}" y2="${ny.toFixed(1)}" stroke="#0f172a" stroke-width="2.5" stroke-linecap="round" />
            <!-- Center Hub -->
            <circle cx="${cx}" cy="${cy}" r="4.5" fill="#0f172a" />
            <circle cx="${cx}" cy="${cy}" r="1.8" fill="#ffffff" />
        </svg>
    `;
}

/**
 * Initializes the Template Gallery in the sidebar panel.
 */
export function initializeTemplateGallery(): void {
    const container = document.getElementById('templateGalleryContainer') || document.getElementById('templateGalleryContent');
    if (!container) return;

    container.innerHTML = renderTemplateGalleryHTML();

    const searchInput = container.querySelector<HTMLInputElement>('#templateGallerySearch');
    const filterPills = container.querySelectorAll<HTMLButtonElement>('.template-filter-pill');
    let activeFilter = 'all';

    const filterGallery = () => {
        const query = searchInput?.value.toLowerCase().trim() || '';
        const cards = container.querySelectorAll<HTMLElement>('.template-gallery-card-item');

        cards.forEach(card => {
            const cat = card.dataset.category || '';
            const name = card.dataset.name?.toLowerCase() || '';
            const desc = card.dataset.desc?.toLowerCase() || '';

            const matchesCategory = activeFilter === 'all' || cat === activeFilter;
            const matchesQuery = !query || name.includes(query) || desc.includes(query);

            card.style.display = matchesCategory && matchesQuery ? 'block' : 'none';
        });
    };

    if (searchInput) {
        searchInput.addEventListener('input', filterGallery);
    }

    filterPills.forEach(pill => {
        pill.addEventListener('click', (e) => {
            e.preventDefault();
            filterPills.forEach(p => {
                p.classList.remove('active', 'btn-primary', 'text-white');
                p.classList.add('btn-light', 'text-slate-600');
            });
            pill.classList.remove('btn-light', 'text-slate-600');
            pill.classList.add('active', 'btn-primary', 'text-white');
            activeFilter = pill.dataset.filter || 'all';
            filterGallery();
        });
    });

    // Direct touch / click on any template card instantly inserts it into the dashboard
    container.querySelectorAll<HTMLElement>('.template-gallery-card-item').forEach(card => {
        card.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            const templateId = card.dataset.templateId;
            if (templateId) {
                card.classList.add('template-card-clicked');
                setTimeout(() => card.classList.remove('template-card-clicked'), 320);
                await addTemplateToDashboard(templateId);
            }
        });
    });
}

/**
 * Generates the clean HTML layout for the Template Gallery sidebar.
 */
export function renderTemplateGalleryHTML(): string {
    return `
        <div class="template-gallery-wrapper p-3">
            <!-- Sleek Header -->
            <div class="template-gallery-header d-flex align-items-center justify-content-between mb-3">
                <div class="d-flex align-items-center gap-2">
                    <div class="rounded-3 bg-primary text-white d-flex align-items-center justify-content-center" style="width: 30px; height: 30px; font-size: 13px;">
                        <i class="bi bi-grid-fill"></i>
                    </div>
                    <div>
                        <h6 class="fw-bold mb-0 text-slate-800" style="font-size: 13px; letter-spacing: -0.01em;">Templates Gallery</h6>
                        <span class="text-muted" style="font-size: 11px;">Tap any card to add directly</span>
                    </div>
                </div>
                <span class="badge bg-primary text-white rounded-pill px-2.5 py-1" style="font-size: 11px; font-weight: 600;">
                    34 Designs
                </span>
            </div>

            <!-- Instant Search Input -->
            <div class="mb-3 position-relative">
                <i class="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" style="font-size: 12px;"></i>
                <input type="text" id="templateGallerySearch" class="form-control form-control-sm ps-5 bg-white border rounded-3" placeholder="Search templates..." style="font-size: 12px; height: 34px;">
            </div>

            <!-- Category Filter Pills -->
            <div class="d-flex gap-1.5 mb-3 overflow-x-auto pb-1 scrollbar-none" style="white-space: nowrap;">
                <button type="button" class="btn btn-xs btn-primary text-white rounded-pill px-2.5 py-1 template-filter-pill active" data-filter="all">
                    ✨ All (34)
                </button>
                <button type="button" class="btn btn-xs btn-light border text-slate-600 rounded-pill px-2.5 py-1 template-filter-pill" data-filter="textbox">
                    📝 Textboxes (10)
                </button>
                <button type="button" class="btn btn-xs btn-light border text-slate-600 rounded-pill px-2.5 py-1 template-filter-pill" data-filter="sparkline">
                    📈 Sparklines (6)
                </button>
                <button type="button" class="btn btn-xs btn-light border text-slate-600 rounded-pill px-2.5 py-1 template-filter-pill" data-filter="kpi">
                    🏷️ KPI Cards (6)
                </button>
                <button type="button" class="btn btn-xs btn-light border text-slate-600 rounded-pill px-2.5 py-1 template-filter-pill" data-filter="gauge">
                    ⏱️ Gauges (6)
                </button>
                <button type="button" class="btn btn-xs btn-light border text-slate-600 rounded-pill px-2.5 py-1 template-filter-pill" data-filter="progress">
                    📊 Progress (6)
                </button>
            </div>

            <!-- Templates List -->
            <div class="template-cards-grid d-flex flex-column gap-3" id="templateCardsGrid">
                ${TEMPLATE_REGISTRY.map(tpl => renderGalleryCardItem(tpl)).join('')}
            </div>
        </div>
    `;
}

/**
 * Generates an individual preview card for the template gallery sidebar.
 */
function renderGalleryCardItem(tpl: TemplateDefinition): string {
    let previewContent = '';
    let categoryBadgeName = '';

    if (tpl.category === 'textbox') {
        categoryBadgeName = `TEXTBOX • ${tpl.textboxStyle?.toUpperCase() || 'STYLE'}`;
        const style = tpl.textboxStyle || 'gradient';

        previewContent = `
            <div class="template-preview-frame p-0" style="--template-accent-color: ${tpl.color}; overflow: hidden; border-radius: 8px;">
                <div class="textbox-card" data-style="${style}" style="padding: 10px 12px 8px; pointer-events: none; border-radius: 8px;">
                    <div class="textbox-header" style="margin-bottom: 2px;">
                        <span class="textbox-label" style="font-size: 11.5px; font-weight: 700;">${tpl.label}</span>
                        <span class="textbox-badge" style="font-size: 8.5px;">${tpl.badge || 'Ready'}</span>
                    </div>
                    ${tpl.subLabel ? `<div class="textbox-sub-label" style="font-size: 9.5px; margin-bottom: 3px;">${tpl.subLabel}</div>` : ''}
                    <div class="textbox-value" style="font-size: 11.5px; line-height: 1.35; font-weight: 600;">${tpl.value}</div>
                    ${tpl.trendValue ? `
                        <div class="mt-1">
                            <span class="badge bg-white bg-opacity-75 text-dark border rounded-pill px-1.5 py-0.5" style="font-size: 8.5px;">${tpl.trendValue}</span>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    } else if (tpl.category === 'sparkline') {
        categoryBadgeName = `SPARKLINE • ${tpl.sparklineType?.toUpperCase()}`;
        const sparklineSvg = generateSparklineSvg(tpl);
        const changeBadgeBg = tpl.changeType === 'up' ? 'bg-success text-success' : tpl.changeType === 'down' ? 'bg-danger text-danger' : 'bg-warning text-warning';

        previewContent = `
            <div class="template-preview-frame" style="--template-accent-color: ${tpl.color};">
                <div class="d-flex justify-content-between align-items-center mb-1">
                    <span class="text-slate-600 fw-medium" style="font-size: 11px;">${tpl.label}</span>
                    <span class="badge bg-slate-100 text-slate-500 border rounded-pill" style="font-size: 9.5px;">${tpl.badge || 'Recent'}</span>
                </div>
                <div class="d-flex align-items-baseline justify-content-between mb-1.5">
                    <div class="fw-bold text-slate-900" style="font-size: 18px; line-height: 1.1; letter-spacing: -0.02em;">${tpl.value}</div>
                    <span class="badge ${changeBadgeBg} bg-opacity-10 rounded-pill px-2 py-0.5 fw-semibold" style="font-size: 10px;">${tpl.change}</span>
                </div>
                <!-- Visual Curve / Bar Image -->
                <div class="pt-1">
                    ${sparklineSvg}
                </div>
            </div>
        `;
    } else if (tpl.category === 'kpi') {
        categoryBadgeName = `KPI • ${tpl.kpiCategory?.toUpperCase()}`;
        const subItems = tpl.subMetrics ? tpl.subMetrics.slice(0, 2) : [];

        previewContent = `
            <div class="template-preview-frame" style="--template-accent-color: ${tpl.color};">
                <div class="d-flex justify-content-between align-items-center mb-1">
                    <span class="badge rounded-pill fw-semibold" style="font-size: 9.5px; background: ${tpl.color}18; color: ${tpl.color};">${tpl.kpiCategory}</span>
                    <span class="badge bg-success bg-opacity-10 text-success rounded-pill px-2 py-0.5 fw-semibold" style="font-size: 10px;">${tpl.trendValue}</span>
                </div>
                <div class="fw-bold text-slate-900 my-1" style="font-size: 19px; line-height: 1.1; letter-spacing: -0.02em;">
                    ${tpl.currency ? tpl.currency + ' ' : ''}${tpl.value}
                </div>
                ${subItems.length > 0 ? `
                    <div class="d-flex align-items-center gap-2 pt-1 border-top border-slate-100 text-slate-500" style="font-size: 10px;">
                        ${subItems.map(s => `<span>${s.label}: <strong class="text-slate-700">${s.value}</strong></span>`).join('<span class="text-slate-300">•</span>')}
                    </div>
                ` : ''}
                <div class="mt-1.5" style="height: 3px; background: #e2e8f0; border-radius: 2px; overflow: hidden;">
                    <div style="height: 100%; width: 75%; background: ${tpl.color}; border-radius: 2px;"></div>
                </div>
            </div>
        `;
    } else if (tpl.category === 'gauge') {
        categoryBadgeName = 'SPEEDOMETER GAUGE';
        const gaugeSvg = generateGaugeSvg(tpl);

        previewContent = `
            <div class="template-preview-frame" style="--template-accent-color: ${tpl.color};">
                <div class="d-flex justify-content-between align-items-center mb-1">
                    <span class="text-slate-700 fw-semibold" style="font-size: 11.5px;">${tpl.label}</span>
                    <span class="text-muted" style="font-size: 10px;">${tpl.subLabel || ''}</span>
                </div>
                <!-- Speedometer Dial Visual Graphic -->
                <div class="my-1">
                    ${gaugeSvg}
                </div>
                <div class="text-center fw-bold" style="font-size: 18px; color: ${tpl.color}; line-height: 1; margin-top: -10px;">
                    ${tpl.value}%
                </div>
            </div>
        `;
    } else {
        // progress
        categoryBadgeName = 'PROGRESS TRACKER';
        previewContent = `
            <div class="template-preview-frame" style="--template-accent-color: ${tpl.color};">
                <div class="d-flex justify-content-between align-items-center mb-1.5">
                    <span class="text-slate-800 fw-semibold" style="font-size: 12px;">${tpl.label}</span>
                    <span class="badge bg-primary bg-opacity-10 text-primary rounded-pill px-2 py-0.5" style="font-size: 10px;">${tpl.badge || 'Phase 1'}</span>
                </div>
                <div class="d-flex justify-content-between align-items-baseline mb-1.5">
                    <span class="text-slate-400" style="font-size: 10.5px;">Completion</span>
                    <span class="fw-bold text-slate-900" style="font-size: 16px;">${tpl.value}%</span>
                </div>
                <div class="progress" style="height: 7px; border-radius: 6px; background: #e2e8f0; overflow: hidden;">
                    <div class="progress-bar" style="width: ${tpl.value}%; background: ${tpl.color}; border-radius: 6px;"></div>
                </div>
            </div>
        `;
    }

    return `
        <div class="template-gallery-card-item" data-template-id="${tpl.id}" data-category="${tpl.category}" data-name="${tpl.name}" data-desc="${tpl.description}">
            <!-- Top Row: Name, Category Pill, and Tap Hint -->
            <div class="d-flex align-items-center justify-content-between mb-1">
                <div class="d-flex align-items-center gap-1.5 overflow-hidden">
                    <span class="rounded-circle flex-shrink-0" style="width: 8px; height: 8px; background-color: ${tpl.color};"></span>
                    <span class="fw-bold text-slate-800 text-truncate" style="font-size: 12.5px;">${tpl.name}</span>
                </div>
                <span class="template-tap-badge flex-shrink-0">
                    <i class="bi bi-plus"></i> Tap to add
                </span>
            </div>

            <!-- Authentic Image / Snapshot Preview -->
            ${previewContent}
        </div>
    `;
}

/**
 * Adds a chosen template to the active dashboard.
 */
export async function addTemplateToDashboard(templateId: string): Promise<void> {
    const tpl = TEMPLATE_REGISTRY.find(t => t.id === templateId);
    if (!tpl) {
        showMessage('Template not found', 'warning');
        return;
    }

    const uniqueId = `tpl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const topPos = 80 + (visualizations.length % 5) * 35;
    const leftPos = 80 + (visualizations.length % 4) * 45;

    const newConfig: any = {
        id: uniqueId,
        type: 'template_card',
        title: tpl.label || tpl.name,
        templateCategory: tpl.category,
        textboxStyle: tpl.textboxStyle,
        label: tpl.label,
        subLabel: tpl.subLabel,
        badge: tpl.badge,
        value: tpl.value,
        currency: tpl.currency,
        change: tpl.change,
        changeType: tpl.changeType,
        trend: tpl.trend,
        trendValue: tpl.trendValue,
        kpiCategory: tpl.kpiCategory,
        color: tpl.color,
        sparklineType: tpl.sparklineType,
        dataPoints: tpl.dataPoints ? [...tpl.dataPoints] : undefined,
        subMetrics: tpl.subMetrics ? JSON.parse(JSON.stringify(tpl.subMetrics)) : undefined,
        position: { top: `${topPos}px`, left: `${leftPos}px` },
        size: { width: tpl.defaultSize.width, height: tpl.defaultSize.height }
    };

    visualizations.push(newConfig);
    await plotChart(newConfig);
    await saveDashboardSettings();

    showMessage(`Template "${tpl.name}" added to dashboard!`, 'success');

    // Smooth scroll to container
    setTimeout(() => {
        const el = document.getElementById(`container-${uniqueId}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            el.classList.add('is-active');
        }
    }, 120);
}

/**
 * Refreshes all active template cards on the dashboard dynamically.
 * Evaluates all formulas against the latest table data in real-time.
 */
export function refreshAllTemplateCards(): void {
    try {
        const templateCards = (visualizations || []).filter((v: any) => v.type === 'template_card');
        templateCards.forEach((chartConfig: any) => {
            applyFormulasToCardConfig(chartConfig);
            const container = document.getElementById(`container-${chartConfig.id}`);
            if (container) {
                renderTemplateCard(container, chartConfig);
            }
        });

        // Also check any standalone template card containers present in the DOM
        document.querySelectorAll<HTMLElement>('.template-card-container').forEach(container => {
            const chartId = container.id.replace('container-', '');
            const config = (visualizations || []).find((v: any) => v.id === chartId);
            if (config) {
                applyFormulasToCardConfig(config);
                renderTemplateCard(container, config);
            }
        });
    } catch (err) {
        console.error("Error refreshing template cards dynamically:", err);
    }
}

/**
 * Options for creating custom template cards via AI Agent or User Actions.
 */
export interface CreateTemplateCardOptions {
    templateId?: string;
    category?: 'sparkline' | 'kpi' | 'gauge' | 'progress' | 'textbox';
    textboxStyle?: 'gradient' | 'callout' | 'executive' | 'cyber' | 'minimal' | 'quote' | 'alert' | 'sunset' | 'ocean' | 'dark_luxury' | 'notes';
    label?: string;
    title?: string;
    subLabel?: string;
    badge?: string;
    value?: string | number;
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
    column?: string;
    aggregation?: 'sum' | 'avg' | 'max' | 'min' | 'count';
    formula?: string;
    formulaField?: string;
    width?: string | number;
    height?: string | number;
    top?: number | string;
    left?: number | string;
    zone?: 'header' | 'top' | 'kpi-row' | 'kpi' | 'main-left' | 'main-right' | 'bottom-left' | 'bottom-right' | 'full-width' | 'center';
}

function computeZoneCoordinates(zone: string, containerWidth: number) {
    const margin = 15;
    const gap = 15;
    const halfWidth = Math.floor((containerWidth - (margin * 2) - gap) / 2);

    switch (zone) {
        case 'header':
        case 'top':
            return { top: margin, left: margin, width: containerWidth - (margin * 2), height: 110 };
        case 'kpi-row':
        case 'kpi':
            return { top: 140, left: margin, width: Math.floor((containerWidth - (margin * 2) - (gap * 3)) / 4), height: 195 };
        case 'main-left':
            return { top: 355, left: margin, width: halfWidth, height: 400 };
        case 'main-right':
            return { top: 355, left: margin + halfWidth + gap, width: halfWidth, height: 400 };
        case 'bottom-left':
            return { top: 775, left: margin, width: halfWidth, height: 360 };
        case 'bottom-right':
            return { top: 775, left: margin + halfWidth + gap, width: halfWidth, height: 360 };
        case 'full-width':
            return { top: 355, left: margin, width: containerWidth - (margin * 2), height: 420 };
        case 'center':
            return { top: 250, left: Math.floor((containerWidth - 600) / 2), width: 600, height: 350 };
        default:
            return { top: 140, left: margin, width: 350, height: 210 };
    }
}

/**
 * Creates and renders a custom or ready-made gallery template card with optional dynamic dataset calculation.
 */
export async function createCustomTemplateCard(opts: CreateTemplateCardOptions): Promise<{ id: string; title: string; card: any }> {
    let base: Partial<TemplateDefinition> = {};
    if (opts.templateId) {
        const found = TEMPLATE_REGISTRY.find(t => 
            t.id === opts.templateId || 
            t.id.toLowerCase().includes(opts.templateId!.toLowerCase()) ||
            t.name.toLowerCase().includes(opts.templateId!.toLowerCase())
        );
        if (found) {
            base = JSON.parse(JSON.stringify(found));
        }
    }

    const data = filteredData.length > 0 ? filteredData : rawData;
    let computedValue = opts.value ?? base.value;
    let computedDataPoints = opts.dataPoints ?? base.dataPoints;

    // Dynamically calculate metrics from the dataset if a column is provided
    if (opts.column && data && data.length > 0) {
        const colName = opts.column;
        const nums: number[] = [];
        data.forEach((row: any) => {
            const v = Number(row[colName]);
            if (!isNaN(v)) nums.push(v);
        });

        if (nums.length > 0) {
            const agg = (opts.aggregation || 'sum').toLowerCase();
            let res = 0;
            if (agg === 'sum') {
                res = nums.reduce((a, b) => a + b, 0);
            } else if (agg === 'avg') {
                res = nums.reduce((a, b) => a + b, 0) / nums.length;
            } else if (agg === 'max') {
                res = Math.max(...nums);
            } else if (agg === 'min') {
                res = Math.min(...nums);
            } else if (agg === 'count') {
                res = nums.length;
            }
            const formatted = res.toLocaleString('en-IN', { maximumFractionDigits: 1 });
            computedValue = opts.currency ? `${opts.currency}${formatted}` : formatted;

            if (!computedDataPoints || computedDataPoints.length === 0) {
                computedDataPoints = nums.slice(0, 25);
            }
        }
    }

    const category = opts.category || base.category || (opts.textboxStyle ? 'textbox' : (opts.sparklineType ? 'sparkline' : 'kpi'));
    const defaultSizes: Record<string, { width: string; height: string }> = {
        textbox: { width: '360px', height: '185px' },
        kpi: { width: '350px', height: '210px' },
        sparkline: { width: '350px', height: '210px' },
        gauge: { width: '300px', height: '260px' },
        progress: { width: '350px', height: '190px' },
    };

    const dashboard = document.getElementById('dashboardContent') || document.getElementById('visualizations') || document.body;
    const containerWidth = dashboard?.clientWidth || 1200;

    let targetTop: number | string | undefined = opts.top;
    let targetLeft: number | string | undefined = opts.left;
    let targetWidth: number | string | undefined = opts.width;
    let targetHeight: number | string | undefined = opts.height;

    if (category === 'textbox' && !opts.zone && opts.top === undefined && opts.left === undefined) {
        opts.zone = 'header';
    }

    if (opts.zone) {
        const z = computeZoneCoordinates(opts.zone, containerWidth);
        if (targetTop === undefined) targetTop = z.top;
        if (targetLeft === undefined) targetLeft = z.left;
        if (targetWidth === undefined) targetWidth = `${z.width}px`;
        if (targetHeight === undefined) targetHeight = `${z.height}px`;
    }

    const defaultTop = 80 + (visualizations.length % 5) * 35;
    const defaultLeft = 80 + (visualizations.length % 4) * 45;

    const parseDim = (val: number | string | undefined, defaultVal: string): string => {
        if (val === undefined || val === null) return defaultVal;
        if (typeof val === 'number') return `${val}px`;
        const s = String(val).trim();
        return (s.endsWith('px') || s.endsWith('%') || s.startsWith('calc')) ? s : `${s}px`;
    };

    const finalTop = parseDim(targetTop, `${defaultTop}px`);
    const finalLeft = parseDim(targetLeft, `${defaultLeft}px`);
    const defaultW = base.defaultSize?.width || defaultSizes[category]?.width || '360px';
    const defaultH = base.defaultSize?.height || defaultSizes[category]?.height || '185px';
    const finalWidth = parseDim(targetWidth, defaultW);
    const finalHeight = parseDim(targetHeight, defaultH);

    const sz = {
        width: finalWidth,
        height: finalHeight
    };

    const uniqueId = `tpl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    const newConfig: any = {
        id: uniqueId,
        type: 'template_card',
        title: opts.title || opts.label || base.label || base.name || (opts.column ? `${opts.column} KPI` : (category === 'textbox' ? 'Executive Overview Textbox' : 'Gallery Template Card')),
        templateCategory: category,
        textboxStyle: opts.textboxStyle || base.textboxStyle || 'gradient',
        label: opts.label || base.label || (opts.column ? `Total ${opts.column}` : (category === 'textbox' ? 'Executive Intelligence' : 'Key Performance Metric')),
        subLabel: opts.subLabel ?? base.subLabel ?? (opts.column ? `Calculated from ${opts.column} (${opts.aggregation || 'Sum'})` : ''),
        badge: opts.badge ?? base.badge ?? (category === 'textbox' ? 'Strategy Memo' : 'Ready-Made'),
        value: computedValue ?? (category === 'textbox' ? 'Enterprise strategic summary and dynamic workspace indicators.' : '₹48,52,430'),
        currency: opts.currency ?? base.currency ?? '₹',
        change: opts.change ?? base.change ?? '+12.4%',
        changeType: opts.changeType ?? base.changeType ?? 'up',
        trend: opts.trend ?? base.trend ?? 'up',
        trendValue: opts.trendValue ?? base.trendValue ?? '+12.4%',
        kpiCategory: opts.kpiCategory ?? base.kpiCategory ?? 'revenue',
        color: opts.color ?? base.color ?? (category === 'textbox' ? '#4f46e5' : '#2ecc71'),
        sparklineType: opts.sparklineType ?? base.sparklineType ?? 'line',
        dataPoints: computedDataPoints ? [...computedDataPoints] : [10, 20, 15, 30, 25, 40, 35, 50],
        subMetrics: opts.subMetrics ? JSON.parse(JSON.stringify(opts.subMetrics)) : (base.subMetrics ? JSON.parse(JSON.stringify(base.subMetrics)) : undefined),
        position: { top: finalTop, left: finalLeft },
        size: sz
    };

    if (opts.formula) {
        newConfig.formulas = { [opts.formulaField || 'value']: opts.formula };
        applyFormulasToCardConfig(newConfig);
    }

    visualizations.push(newConfig);
    await plotChart(newConfig);
    await saveDashboardSettings();

    showMessage(`Ready-made card "${newConfig.title}" added to dashboard!`, 'success');

    setTimeout(() => {
        const el = document.getElementById(`container-${uniqueId}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            el.classList.add('is-active');
        }
    }, 120);

    return { id: uniqueId, title: newConfig.title, card: newConfig };
}

/**
 * Options for editing existing ready-made template cards based on active dataset and Excel-style formulas.
 */
export interface EditTemplateCardOptions {
    target: string; // Card ID, title, label, category ("kpi", "sparkline", "gauge", "progress", "textbox"), or "all"
    formula?: string; // Excel-style formula, e.g. "=SUM(Sales, R, '₹')", "=AVG(B2:B10, R, 'Avg')", "=GROWTH(B10, B2, R, 'Growth')", "=DIFF(A2, B2)"
    formulaField?: string; // Target field for formula (default: 'value', or 'label', 'subLabel', 'badge', 'change', 'trendValue')
    column?: string; // Data column to re-calculate values & sparklines from
    aggregation?: 'sum' | 'avg' | 'max' | 'min' | 'count';
    label?: string;
    title?: string;
    subLabel?: string;
    badge?: string;
    value?: string | number;
    currency?: string;
    change?: string;
    changeType?: 'up' | 'down' | 'neutral';
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
    color?: string;
    sparklineType?: 'line' | 'bar' | 'winloss';
    textboxStyle?: 'gradient' | 'callout' | 'executive' | 'cyber' | 'minimal' | 'quote' | 'alert' | 'sunset' | 'ocean' | 'dark_luxury' | 'notes';
    subMetrics?: Array<{ label: string; value: string }>;
    dataPoints?: number[];
}

/**
 * Autonomously edits existing template cards based on dataset metrics, columns, and formulas.
 */
export async function editTemplateCard(opts: EditTemplateCardOptions): Promise<{ success: boolean; message: string; updatedCount: number; cards: any[] }> {
    const rawTarget = (opts.target || '').trim();
    const query = rawTarget.toLowerCase();
    const data = filteredData.length > 0 ? filteredData : rawData;

    // Filter matching cards in visualizations
    let matched = visualizations.filter(v => {
        if (v.type !== 'template_card' && !v.templateCategory) return false;
        if (!query || query === 'all') return true;
        if (query === 'kpi' && v.templateCategory === 'kpi') return true;
        if (query === 'sparkline' && v.templateCategory === 'sparkline') return true;
        if (query === 'gauge' && v.templateCategory === 'gauge') return true;
        if (query === 'progress' && v.templateCategory === 'progress') return true;
        if (query === 'textbox' && v.templateCategory === 'textbox') return true;
        if (v.id === rawTarget || v.id === `container-${rawTarget}`) return true;
        if (v.title && v.title.toLowerCase().includes(query)) return true;
        if ((v as any).label && String((v as any).label).toLowerCase().includes(query)) return true;
        return false;
    });

    // If no direct query match, fallback to the most recent template card
    if (matched.length === 0) {
        const allTpl = visualizations.filter(v => v.type === 'template_card' || v.templateCategory);
        if (allTpl.length > 0) {
            matched = [allTpl[allTpl.length - 1]];
        }
    }

    if (matched.length === 0) {
        // If formula or column is provided, automatically create a new ready-made template card
        if (opts.formula || opts.column) {
            const newCreated = await createCustomTemplateCard({
                category: 'kpi',
                label: opts.label || opts.title || (opts.column ? `${opts.column} KPI` : 'Formula Metric Card'),
                column: opts.column,
                aggregation: opts.aggregation,
                formula: opts.formula,
                formulaField: opts.formulaField || 'value',
                currency: opts.currency,
                badge: opts.badge || 'ƒ(x) Dynamic Formula'
            });
            return {
                success: true,
                message: `Created new ready-made template card "${newCreated.title}" with formula!`,
                updatedCount: 1,
                cards: [newCreated.card]
            };
        }
        const msg = `No matching template card found for "${opts.target}".`;
        showMessage(msg, 'warning');
        return { success: false, message: msg, updatedCount: 0, cards: [] };
    }

    for (const card of matched) {
        const c = card as any;
        // 1. Column dynamic calculation from dataset if column is provided
        if (opts.column && data && data.length > 0) {
            const colName = opts.column;
            const nums: number[] = [];
            data.forEach((row: any) => {
                const v = Number(row[colName]);
                if (!isNaN(v)) nums.push(v);
            });

            if (nums.length > 0) {
                const agg = (opts.aggregation || 'sum').toLowerCase();
                let res = 0;
                if (agg === 'sum') {
                    res = nums.reduce((a, b) => a + b, 0);
                } else if (agg === 'avg') {
                    res = nums.reduce((a, b) => a + b, 0) / nums.length;
                } else if (agg === 'max') {
                    res = Math.max(...nums);
                } else if (agg === 'min') {
                    res = Math.min(...nums);
                } else if (agg === 'count') {
                    res = nums.length;
                }
                const formatted = res.toLocaleString('en-IN', { maximumFractionDigits: 1 });
                const curr = opts.currency !== undefined ? opts.currency : (c.currency || '₹');
                c.value = curr ? `${curr}${formatted}` : formatted;
                c.column = colName;
                c.aggregation = agg;
                if (!opts.subLabel) {
                    c.subLabel = `Calculated from ${colName} (${agg.toUpperCase()})`;
                }
                c.dataPoints = nums.slice(0, 25);
            }
        }

        // 2. Direct Value/Label/Badge/Colors overrides
        if (opts.value !== undefined) c.value = opts.value;
        if (opts.label) c.label = opts.label;
        if (opts.title) c.title = opts.title;
        if (opts.subLabel !== undefined) c.subLabel = opts.subLabel;
        if (opts.badge !== undefined) c.badge = opts.badge;
        if (opts.currency !== undefined) c.currency = opts.currency;
        if (opts.change !== undefined) c.change = opts.change;
        if (opts.changeType) c.changeType = opts.changeType;
        if (opts.trend) c.trend = opts.trend;
        if (opts.trendValue !== undefined) c.trendValue = opts.trendValue;
        if (opts.color) c.color = opts.color;
        if (opts.sparklineType) c.sparklineType = opts.sparklineType;
        if (opts.textboxStyle) c.textboxStyle = opts.textboxStyle;
        if (opts.subMetrics) c.subMetrics = opts.subMetrics;
        if (opts.dataPoints) c.dataPoints = opts.dataPoints;

        // 3. Formula Application
        if (opts.formula) {
            if (!c.formulas) c.formulas = {};
            const field = opts.formulaField || 'value';
            c.formulas[field] = opts.formula;
            applyFormulasToCardConfig(card);
        }

        // 4. Re-render container
        const container = document.getElementById(`container-${card.id}`);
        if (container) {
            renderTemplateCard(container, card);
            container.classList.add('is-active');
            setTimeout(() => container.classList.remove('is-active'), 1200);
        }
    }

    await saveDashboardSettings();
    const successMsg = `Updated ${matched.length} template card(s) with data & formulas successfully!`;
    showMessage(successMsg, 'success');
    return { success: true, message: successMsg, updatedCount: matched.length, cards: matched };
}

/**
 * Direct shortcut to apply an Excel-style formula to any template card.
 */
export async function applyTemplateFormula(target: string, formula: string, formulaField = 'value'): Promise<{ success: boolean; message: string }> {
    return await editTemplateCard({
        target,
        formula,
        formulaField
    });
}

// Attach global listeners for real-time reactivity
if (typeof window !== 'undefined') {
    (window as any).refreshAllTemplateCards = refreshAllTemplateCards;
    (window as any).createCustomTemplateCard = createCustomTemplateCard;
    (window as any).editTemplateCard = editTemplateCard;
    (window as any).applyTemplateFormula = applyTemplateFormula;
    (window as any).addTemplateToDashboard = addTemplateToDashboard;

    window.addEventListener('vedra:tableDataChanged', () => {
        refreshAllTemplateCards();
    });
    window.addEventListener('tableDataUpdated', () => {
        refreshAllTemplateCards();
    });
    window.addEventListener('filtersApplied', () => {
        refreshAllTemplateCards();
    });
    window.addEventListener('dataLoaded', () => {
        refreshAllTemplateCards();
    });
    document.addEventListener('dataUpdated', () => {
        refreshAllTemplateCards();
    });
}

