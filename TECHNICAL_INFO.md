# Vedra BI - Technical Specification & Architectural Documentation

This file provides a detailed technical overview of the **Vedra BI** architecture, including folder structures, modules, state tracking, import/export contracts, and the resilient CDN fallback manager.

---

## 📂 1. Directory Structure & Domain Organization

The project conforms to a domain-driven, highly organized directory structure where all modules are sorted into dedicated folders according to their specific responsibility:

```text
/
├── index.html                    # Primary Dashboard entry point
├── login.html                    # Secure Sign-In Portal
├── edit_data.html                # Interactive Luckysheet data editor
├── backend/                      # High-performance server-side data & DuckDB engines
│   ├── server.ts                 # Full-stack backend Express server
│   ├── chartEngine.ts            # Server-side chart computation
│   └── duckdbEngine.ts           # DuckDB SQL analytics engine
├── vite.config.ts                # Vite build and compilation configs
├── TECHNICAL_INFO.md             # This file (Technical Blueprint)
└── src/
    ├── chart/                    # Individual chart renderer templates
    │   ├── bar.js, line.js, pie.js, gauge.js, radar.js, scatter.js, etc.
    ├── css/                      # Modular style sheets
    │   ├── ai_advice.css, all.css, core.css, custom.css, dark_theam.css, etc.
    ├── data/                     # Configuration schemas and templates
    │   ├── TEXTBOX_TEMPLATES.json
    │   └── chartContainerColors.json
    ├── store/                    # Reactive State Managers (Store Layer)
    │   ├── DataHandler.ts        # Core Data store, excel files importer & parser
    │   ├── DataTracker.js        # Performance tracker and size reporter
    │   └── UIHandler.js          # Control panel UI renderer & state tracker
    └── js/                       # Domain-Categorized Modules & Application Logic
        ├── index.ts              # Unified Root Domain Hub (exports all domains)
        ├── ai/                   # 🤖 AI, Assistant & Voice Synthesis
        │   ├── ai_advice.js      # AI Smart Advice & Chart Recommendations
        │   ├── audioNarrator.js  # Executive Audio Briefing & Speech Narrator
        │   ├── chat.js           # Interactive AI Chatbot & Dashboard Action Dispatcher
        │   └── index.ts          # AI Domain Barrel Export
        ├── auth/                 # 🔐 Authentication, Session & Security
        │   ├── login.ts          # Firebase Authentication & User State
        │   ├── securityManager.js# Session Timeout, Token Auth & Access Control
        │   ├── cryptoUtils.js    # Encryption, Hashing & Key Management
        │   └── index.ts          # Auth Domain Barrel Export
        ├── charts/               # 📊 Chart Engines, Visual Effects & KPIs
        │   ├── charts.ts         # Core Chart Lifecycle & Options Configurator
        │   ├── chartState.js     # Global Active Chart Registry
        │   ├── chartEffects.js   # Shadows, Gradients, 3D & Glow Visual Effects
        │   ├── chartContainerColors.js # Container Theme & Custom Color Palettes
        │   ├── chartTypeGallery.js# Chart Picker & Visual Gallery
        │   ├── chart_actions.js  # Chart Deletion, Resize, Duplicate & Pinning
        │   ├── chartcolomdrag.js # Column Drag & Drop Axis Mapper
        │   ├── backendChartClient.js # High-throughput WebSocket/RPC Chart Client
        │   ├── kpiSparklines.js  # KPI Summary Cards & Mini Sparklines
        │   └── index.ts          # Charts Domain Barrel Export
        ├── data/                 # 💾 Data Processing, Transformation & Engines
        │   ├── DataMapper.js     # Column Mapping & Schema Matching
        │   ├── dataTransformer.js# Data Cleaning, Filtering & Formula Math
        │   ├── dataTransformerUI.js # Interactive Data Cleaning & Profile UI
        │   ├── dataTebledisplay.js# High-Performance Data Table with Pagination
        │   ├── duckdbArrowClient.js # In-browser DuckDB & Apache Arrow Client
        │   ├── liveDataHandler.ts# Real-time WebSocket & API Polling Streamer
        │   ├── mockDataGenerator.js # Synthetic Test Dataset Generator
        │   ├── lttbDownsample.js # LTTB Downsampling for Big Data
        │   └── index.ts          # Data Domain Barrel Export
        ├── ui/                   # 🎨 UI Controls, Modals, Tour & Interactivity
        │   ├── box-events.js     # Resizing & Card Selection Handlers
        │   ├── commandPalette.js # Ctrl+K Command Palette & Quick Navigation
        │   ├── comparisonView.js # Side-by-Side Dashboard Comparison Mode
        │   ├── customPickr.js    # Advanced Color Picker Wrapper
        │   ├── customSelect.js   # Searchable Modern Custom Select Menus
        │   ├── drag_drop.js      # Grid Snapping, Locking & Rearrangement
        │   ├── editor.js         # Textbox Annotations & Canvas Text Editor
        │   ├── floatingFab.js    # Quick-action Floating Action Button (FAB)
        │   ├── guidedTour.js     # Step-by-Step Interactive Onboarding Walkthrough
        │   ├── onboardingManager.js # Checklists & Getting Started Guides
        │   ├── presentationMode.js # Fullscreen Slideshow Presentation Mode
        │   ├── savedViews.js     # Saved Layout Snapshots & Views Manager
        │   ├── texbox_utils.js   # Textbox Styling & Markdown Utilities
        │   ├── welcomeModal.js   # Welcome Screen & Sample Data Loader
        │   └── index.ts          # UI Domain Barrel Export
        ├── layout/               # 📐 Layouts, Sidebars, Dynamic Loaders & Themes
        │   ├── dynamicLoader.ts  # On-demand Skeleton Dynamic Component Loader
        │   ├── dynamicTemplates.js # Sidebar HTML Template Definitions
        │   ├── filter.js         # Multi-Column Filtering Logic
        │   ├── globalFilters.js  # Top-Bar Live Global Filter & Date Range
        │   ├── multiDashboard.js # Multi-Tab Dashboard Workspace Switcher
        │   ├── templates.js      # Pre-built Dashboard Industry Templates
        │   ├── backgroundTemplates.ts # Wallpaper, Gradients & Canvas Themes
        │   └── index.ts          # Layout Domain Barrel Export
        ├── export/               # 📤 Reporting, Audits & Multi-Format Exporters
        │   ├── reportExporter.js # High-Resolution PDF, PNG, Excel & CSV Exporter
        │   ├── advancedActions.js# Data Audit, Smart Insights & Executive Print
        │   └── index.ts          # Export Domain Barrel Export
        └── core/                 # ⚡ Core Bootstrap, Event Handlers & Resilience
            ├── main.ts           # Application Bootstrap & Lifecycle Manager
            ├── main_handlers.ts  # Global DOM Event Listeners & Router Dispatcher
            ├── cdnManager.js     # Resilient CDN Fallback & Recovery Engine
            ├── utils.ts          # Shared Helpers, Notifications & Alerts
            └── index.ts          # Core Domain Barrel Export
```

---

## 🔄 2. Module Import & Export Matrix

Below is the absolute matrix of core modules, their exports, and their corresponding importers:

| Module File | Key Exports | Primary Importers | Description |
| :--- | :--- | :--- | :--- |
| **`src/js/cdnManager.js`** | `verifyAndRecoverCDNs()`, `window.handleCdnError` | `src/js/main.js`, `index.html`, `login.html`, `edit_data.html` | Controls CDN health, dynamically downloads fallbacks if primary servers offline. |
| **`src/js/chartState.js`** | `allActiveChartInstances` | `src/js/main.js`, `src/js/charts.js`, `src/js/chartEffects.js`, `src/js/dynamicLoader.js` | Shared state variable tracking active ECharts and Plotly renderers. |
| **`src/store/DataHandler.js`**| `initData`, `headers`, `filteredData`, `saveDashboardSettings()`, `getRawData()` | `src/js/main.js`, `src/js/charts.js`, `src/js/main_handlers.js` | Core database/file parser. Extracts data from Luckysheet, CSV, and local store. |
| **`src/store/UIHandler.js`** | `displayStats`, `populateAddDataForm()`, `updateThemeIcon()` | `src/js/main.js`, `src/js/dynamicLoader.js`, `src/js/main_handlers.js` | Renders dynamic controls, KPI stats, and state metrics inside the active dashboard. |
| **`src/store/DataTracker.js`**| `generateSizeReport()` | `src/js/advancedActions.js` | Telemetry tracker monitoring memory, canvas nodes size, and performance indexes. |
| **`src/js/main_handlers.js`** | `attachGlobalEventHandlers()` | `src/js/main.js`, `src/js/dynamicLoader.js` | Binds DOM event click/change listeners to dashboard controls. |
| **`src/js/charts.js`** | `visualizations`, `initializeChartPreview()`, `discardActivePreviewChart()` | `src/js/main.js`, `src/js/main_handlers.js` | Handles dynamic creation, layout configuration, and deletion of user-configured charts. |
| **`src/js/login.js`** | `initializeLoginAndAuth()` | `src/js/main.js` | Configures Firebase sign-in / signup flows, password checks, and secure redirection. |
| **`src/js/dynamicLoader.js`** | `loadDynamicContent()` | `src/js/main.js` | Lazy-loads templates as users navigate menus, avoiding heavy initial bundle sizes. |
| **`src/js/utils.js`** | `auth`, `showMessage()`, `attachEventListener()`, `toggleTheme()` | Throughout all modules under `/src/js/` | Global helper module for messaging alerts, event binding, and system helpers. |

---

## 🌐 3. Resilient CDN Fallback Architecture

To protect Vedra BI from single points of failure caused by CDN blockades or local latency, a dual-layer recovery process is active:

1. **Inline Early Catch (`handleCdnError`)**:
   An inline block inside the `<head>` of all pages intercepts failures *immediately* during script tags loading. If a CDN returns non-200 or fails to respond, the script dynamically rewrites the tag to draw from alternative networks (`cdnjs`, `unpkg`, or `jsdelivr`).

2. **Core Verification Loop (`verifyAndRecoverCDNs`)**:
   Invoked by `main.js` *before* dismissing the Skeleton Loader. It scans the window global namespace for expected packages (e.g., `window.echarts`, `window.Plotly`, `window.bootstrap`, etc.). If a library didn't initialize, it dynamically pulls the asset from secondary CDNs.

---

## 🎨 4. Theme and UI Customization Engine

The application manages stylesheets dynamically:
- **Core Sheets**: `core.css` defines layouts, `all.css` sets basic properties, and `custom.css` houses high-end overrides.
- **Dark Mode**: Configured with CSS variable definitions toggled by adding `.dark-theme` to `document.body`, which cascades colors cleanly from deep dark slates `#0f172a` to pitch-black `#090d16`.
- **Skeleton Screen**: Styled within `custom.css` using custom `@keyframes skeleton-shimmer` that displays clean shimmering rectangles mimicking grids, charts, and menus during background load.
