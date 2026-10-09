// src/js/i18n/translations.ts
/**
 * Comprehensive Language Dictionary for Vedra BI (UI Modules & Core Keywords)
 * Supports English (en), Hindi (hi), and Gujarati (gu).
 */

export type LanguageCode = 'en' | 'hi' | 'gu';

export interface LanguageInfo {
    code: LanguageCode;
    name: string;
    nativeName: string;
    icon: string;
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
    { code: 'en', name: 'English', nativeName: 'English', icon: '🇺🇸' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', icon: '🇮🇳' },
    { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', icon: '🇮🇳' }
];

export interface TranslationDictionary {
    // 1. Common & Generic UI
    common: {
        save: string;
        cancel: string;
        close: string;
        apply: string;
        delete: string;
        edit: string;
        reset: string;
        back: string;
        next: string;
        prev: string;
        finish: string;
        search: string;
        searchPlaceholder: string;
        loading: string;
        success: string;
        error: string;
        warning: string;
        info: string;
        confirm: string;
        clear: string;
        download: string;
        upload: string;
        export: string;
        import: string;
        preview: string;
        refresh: string;
        settings: string;
        language: string;
        theme: string;
        darkMode: string;
        lightMode: string;
        fullscreen: string;
        exitFullscreen: string;
        overview: string;
        actions: string;
        help: string;
        undo: string;
        redo: string;
    };

    // 2. Command Palette (Spotlight Search)
    commandPalette: {
        title: string;
        searchPlaceholder: string;
        noResults: string;
        navigateHint: string;
        selectHint: string;
        closeHint: string;
        tourName: string;
        tourDesc: string;
        themeToggleName: string;
        themeToggleDesc: string;
        presentationName: string;
        presentationDesc: string;
        audioNarratorName: string;
        audioNarratorDesc: string;
        statsName: string;
        statsDesc: string;
        addRecordName: string;
        addRecordDesc: string;
        dataAuditName: string;
        dataAuditDesc: string;
        exportPdfName: string;
        exportPdfDesc: string;
        exportPngName: string;
        exportPngDesc: string;
        downloadTemplateName: string;
        downloadTemplateDesc: string;
        addChartName: string;
        addChartDesc: string;
        addKpiName: string;
        addKpiDesc: string;
        filtersName: string;
        filtersDesc: string;
        chatAiName: string;
        chatAiDesc: string;
    };

    // 3. Presentation & Live Show Mode
    presentation: {
        liveShowTitle: string;
        overview: string;
        timerTitle: string;
        timerResetToast: string;
        prevChart: string;
        nextChart: string;
        autoPlayPause: string;
        autoPlayStarted: string;
        laserPointer: string;
        penAnnotation: string;
        penModeActive: string;
        clearAnnotation: string;
        clearAnnotationToast: string;
        speechControl: string;
        speechNotSupported: string;
        speechPermDenied: string;
        speechActiveToast: string;
        speechDeactivated: string;
        speechCmdNext: string;
        speechCmdPrev: string;
        speechCmdLaser: string;
        simulateRefresh: string;
        refreshSimulatedToast: string;
        exitPresentation: string;
        presentationEndedToast: string;
        presentationActiveToast: string;
        colorRed: string;
        colorYellow: string;
        colorCyan: string;
        colorGreen: string;
    };

    // 4. Guided Tour (Interactive Walkthrough)
    guidedTour: {
        welcomeTitle: string;
        welcomeBadge: string;
        welcomeContent: string;
        dataLoadTitle: string;
        dataLoadBadge: string;
        dataLoadContent: string;
        chartStudioTitle: string;
        chartStudioBadge: string;
        chartStudioContent: string;
        kpiSparklineTitle: string;
        kpiSparklineBadge: string;
        kpiSparklineContent: string;
        lttbSamplingTitle: string;
        lttbSamplingBadge: string;
        lttbBadge?: string;
        lttbContent?: string;
        lttbSamplingContent: string;
        annotationsTitle: string;
        annotationsBadge: string;
        annotationsContent: string;
        thresholdAlertsTitle: string;
        thresholdAlertsBadge: string;
        thresholdAlertsContent: string;
        themeStylesTitle: string;
        themeStylesBadge: string;
        themeStylesContent: string;
        aiNarratorTitle: string;
        aiNarratorBadge: string;
        aiNarratorContent: string;
        floatingFabTitle: string;
        floatingFabBadge: string;
        floatingFabContent: string;
        exportReportsTitle: string;
        exportReportsBadge: string;
        exportReportsContent: string;
        stepCounter: string;
        skipTour: string;
        prevStep: string;
        nextStep: string;
        finishTour: string;
        tourCompletedToast: string;
    };

    // 5. Saved Views & Snapshot Gallery
    savedViews: {
        galleryTitle: string;
        gallerySubtitle: string;
        noSnapshotsTitle: string;
        noSnapshotsDesc: string;
        searchPlaceholder: string;
        applyViewBtn: string;
        deleteAllBtn: string;
        deleteSingleBtn: string;
        confirmDeleteAll: string;
        snapshotSavedToast: string;
        snapshotAppliedToast: string;
        snapshotDeletedToast: string;
        allSnapshotsDeletedToast: string;
        configNotFound: string;
        unnamedChart: string;
        noThumbnail: string;
    };

    // 6. Floating Action Button (FAB Quick Palette)
    floatingFab: {
        paletteTitle: string;
        toolsBadge: string;
        dragHint: string;
        escHint: string;
        mainBtnTitle: string;
        toolUpload: string;
        toolUploadDesc: string;
        toolAddChart: string;
        toolAddChartDesc: string;
        toolLttb: string;
        toolLttbDesc: string;
        toolFilter: string;
        toolFilterDesc: string;
        toolStats: string;
        toolStatsDesc: string;
        toolAiChat: string;
        toolAiChatDesc: string;
        toolAudio: string;
        toolAudioDesc: string;
        toolPresent: string;
        toolPresentDesc: string;
        toolAutoGrid: string;
        toolAutoGridDesc: string;
        toolLock: string;
        toolLockDesc: string;
        toolExport: string;
        toolExportDesc: string;
        toolTheme: string;
        toolThemeDesc: string;
    };

    // 7. Comparison View (Side-by-Side Analysis)
    comparisonView: {
        btnOn: string;
        btnOff: string;
        barTitle: string;
        barSubtitle: string;
        closeBarTitle: string;
        periodALabel: string;
        periodBLabel: string;
        fromLabel: string;
        toLabel: string;
        vsLabel: string;
        presetLast7Days: string;
        presetLast30Days: string;
        presetThisMonthVsLast: string;
        activeToast: string;
        restoredToast: string;
    };

    // 8. Welcome Summary Modal & Onboarding
    welcomeModal: {
        onboardingCompleteBadge: string;
        welcomeHeader: string;
        welcomeSubtitle: string;
        preferencesTitle: string;
        editPreferences: string;
        langLabel: string;
        roleLabel: string;
        goalsLabel: string;
        dataSourceLabel: string;
        teamSizeLabel: string;
        themeLabel: string;
        highlightsTitle: string;
        feature1Title: string;
        feature1Desc: string;
        feature2Title: string;
        feature2Desc: string;
        feature3Title: string;
        feature3Desc: string;
        quickStartTitle: string;
        quickStartSubtitle: string;
        loadSampleBtn: string;
        uploadFileBtn: string;
        startDashboardBtn: string;
        sampleDataSuccessToast: string;
        sampleDataErrorToast: string;
    };

    // 9. Textbox & Visual Editor Tools
    editor: {
        mainTitle: string;
        addTextbox: string;
        editTextbox: string;
        deleteTextbox: string;
        fontFamily: string;
        fontSize: string;
        textColor: string;
        bgColor: string;
        textAlign: string;
        alignLeft: string;
        alignCenter: string;
        alignRight: string;
        alignJustify: string;
        bold: string;
        italic: string;
        underline: string;
        bringFront: string;
        sendBack: string;
        duplicate: string;
        delete: string;
        lock: string;
        unlock: string;
        rotate: string;
        resize: string;
        createBtn: string;
        updateBtn: string;
        editingBtn: string;
        alignSelectMin2: string;
        distributeSelectMin3: string;
        copyStyleSelect1: string;
        noFilteredData: string;
        selectDataRowWarning: string;
        emptyTextbox: string;
        noTextboxes: string;
        textboxItem: string;
        showMore: string;
        showLess: string;
        snapToGrid: string;
        copyStyles: string;
        pasteStyles: string;
        templates: string;
        sampleTitleTemplate: string;
        sampleNotesTemplate: string;
    };

    // 10. Custom Dropdowns & Pickers
    customControls: {
        selectPlaceholder: string;
        noOptionsFound: string;
        searchOption: string;
        pickColorTitle: string;
        customColor: string;
        palettePresets: string;
        saveColor: string;
        cancelColor: string;
    };

    // 11. Drag, Drop & Grid Layout
    dragDrop: {
        snapOn: string;
        snapOff: string;
        cardsSwapped: string;
        layoutSaved: string;
        autoArranged: string;
        noCardsFound: string;
        initError: string;
    };

    // 12. Main Navigation & Menu Bar
    navbar: {
        data: string;
        charts: string;
        kpis: string;
        settings: string;
        stats: string;
        actions: string;
        layouts: string;
        filters: string;
        dashboard: string;
        formatting: string;
        effects: string;
        textbox: string;
        theme: string;
        profile: string;
        toggleDashboard: string;
        snapGrid: string;
        compare: string;
        savedViews: string;
        autoGrid: string;
        sampling: string;
        slideshow: string;
        audioBrief: string;
        searchCtrlK: string;
        shortcuts: string;
        quickTour: string;
        changeLanguage: string;
        editData: string;
        addData: string;
        downloadTemplate: string;
        export: string;
        exportPdf: string;
        exportPng: string;
        exportCsv: string;
        autosaved: string;
        toggleTheme: string;
        langHindi: string;
        langEnglish: string;
        langGujarati: string;
        langSwitchedToast: string;
    };

    // 13. Sidebars & Offcanvas Sections
    sidebar: {
        chartDesigner: string;
        styleFormatting: string;
        visualEffects: string;
        dataSource: string;
        kpiCards: string;
        dataStatistics: string;
        dashboardView: string;
        notesAnnotations: string;
        colorThemes: string;
        userProfile: string;
        quickActions: string;
        settingsThresholds: string;
        filtersSorting: string;
        layoutTemplates: string;
        quickSearchPlaceholder: string;
        collapseAll: string;
        expandAll: string;
    };

    // 14. Dashboard Core (Excluding Sidebar)
    dashboard: {
        visualizations: string;
        filterColumn: string;
        filterValue: string;
        dates: string;
        start: string;
        end: string;
        to: string;
        apply: string;
        resetFilters: string;
        none: string;
        all: string;
        noCharts: string;
        addChartsHint: string;
        noDataFound: string;
        activeFilters: string;
        clearAll: string;
        dataRecords: string;
        loadingData: string;
    };

    // 15. Charts & Visualization Cards
    charts: {
        delete: string;
        aiAdvice: string;
        download: string;
        edit: string;
        freeze: string;
        unfreeze: string;
        pin: string;
        unpin: string;
        filterByColumn: string;
        filterChartData: string;
        rowLimit: string;
        allRows: string;
        first10: string;
        first25: string;
        first50: string;
        first100: string;
        first250: string;
        first500: string;
        first1000: string;
        saveSnapshot: string;
        fullscreen: string;
        moreOptions: string;
        editPermissions: string;
        zoom: string;
        pan: string;
        resetAxes: string;
        filterApplied: string;
        filterError: string;
        allPlotsError: string;
        updatingData: string;
        confirmDelete: string;
    };

    // 16. KPI Sparklines & Cards
    kpi: {
        layoutSettings: string;
        editKpi: string;
        deleteKpi: string;
        typography: string;
        chart: string;
        position: string;
        titleSize: string;
        valueSize: string;
        textAlign: string;
        left: string;
        center: string;
        right: string;
        chartStyle: string;
        line: string;
        area: string;
        bar: string;
        pie: string;
        doughnut: string;
        polar: string;
        radar: string;
        width: string;
        height: string;
        basePosition: string;
        bottom: string;
        background: string;
        custom: string;
        textPosition: string;
        standard: string;
        textX: string;
        textY: string;
        chartX: string;
        chartY: string;
        dragTip: string;
        close: string;
        confirmDelete: string;
        totalRows: string;
        filteredActive: string;
        fullDataLoaded: string;
        progressStats: string;
        activeCharts: string;
        totalVisualizations: string;
        aiQueries: string;
        aiQueriesSubtitle: string;
        keyMetric: string;
        totalOf: string;
        uniqueOf: string;
    };
}

export const TRANSLATIONS: Record<LanguageCode, TranslationDictionary> = {
    // ==========================================
    // 🇺🇸 ENGLISH (en)
    // ==========================================
    en: {
        common: {
            save: 'Save',
            cancel: 'Cancel',
            close: 'Close',
            apply: 'Apply',
            delete: 'Delete',
            edit: 'Edit',
            reset: 'Reset',
            back: 'Back',
            next: 'Next',
            prev: 'Previous',
            finish: 'Finish',
            search: 'Search',
            searchPlaceholder: 'Type to search...',
            loading: 'Loading...',
            success: 'Success',
            error: 'Error',
            warning: 'Warning',
            info: 'Information',
            confirm: 'Confirm',
            clear: 'Clear',
            download: 'Download',
            upload: 'Upload',
            export: 'Export',
            import: 'Import',
            preview: 'Preview',
            refresh: 'Refresh',
            settings: 'Settings',
            language: 'Language',
            theme: 'Theme',
            darkMode: 'Dark Mode',
            lightMode: 'Light Mode',
            fullscreen: 'Fullscreen',
            exitFullscreen: 'Exit Fullscreen',
            overview: 'Overview',
            actions: 'Actions',
            help: 'Help',
            undo: 'Undo',
            redo: 'Redo'
        },
        commandPalette: {
            title: 'Spotlight Command Search',
            searchPlaceholder: 'Search commands, tools, charts or shortcuts (Ctrl+K)...',
            noResults: 'No matching commands found.',
            navigateHint: 'Navigate',
            selectHint: 'Select',
            closeHint: 'Close',
            tourName: '💡 Start Interactive Guided Tour',
            tourDesc: 'Walk through all dashboard features step-by-step',
            themeToggleName: '🌗 Toggle Theme (Dark/Light)',
            themeToggleDesc: 'Switch seamlessly between Dark Luxury and Light themes',
            presentationName: '💻 Start Presentation Mode',
            presentationDesc: 'Launch full-screen slide deck with laser pointer and speaker controls',
            audioNarratorName: '🎙️ Play Audio Briefing Summary',
            audioNarratorDesc: 'Listen to AI-synthesized executive narration of metrics',
            statsName: '📊 View Data Statistics',
            statsDesc: 'Inspect column aggregations, means, sums, and distributions',
            addRecordName: '➕ Add New Data Record',
            addRecordDesc: 'Insert a new row into the active business dataset',
            dataAuditName: '🛡️ Run Data Quality Audit',
            dataAuditDesc: 'Check dataset for nulls, anomalies, and type integrity',
            exportPdfName: '📄 Download Executive PDF Report',
            exportPdfDesc: 'Export print-ready styled PDF document of your dashboard',
            exportPngName: '🖼️ Snapshot Dashboard to PNG',
            exportPngDesc: 'Capture high-resolution image of entire canvas',
            downloadTemplateName: '📥 Download Excel Template',
            downloadTemplateDesc: 'Get formatted starter spreadsheet for easy data entry',
            addChartName: '📈 Open Chart Designer',
            addChartDesc: 'Create new 2D/3D visualizations and map column axes',
            addKpiName: '⭐ Create KPI Sparkline Card',
            addKpiDesc: 'Design metric cards with live mini-trend charts',
            filtersName: '⏳ Open Filters & Sorters',
            filtersDesc: 'Apply multi-column filters, ranges, and sort rules',
            chatAiName: '🤖 Open AI Business Assistant',
            chatAiDesc: 'Ask questions in natural language or request auto-insights'
        },
        presentation: {
            liveShowTitle: '💻 LIVE SHOW',
            overview: 'Overview',
            timerTitle: 'Stopwatch / Click to reset',
            timerResetToast: '⏱️ Presentation timer reset.',
            prevChart: 'Previous Chart (Left Arrow)',
            nextChart: 'Next Chart (Right Arrow)',
            autoPlayPause: 'Auto Play / Pause Slideshow',
            autoPlayStarted: '⏱️ Auto slideshow active: changing slide every 6 seconds.',
            laserPointer: 'Toggle Digital Laser Pointer (L)',
            penAnnotation: 'Live Draw / Annotation Pen (P)',
            penModeActive: '✏️ Pen mode active: click and drag across canvas to draw.',
            clearAnnotation: 'Clear All Drawings & Markers',
            clearAnnotationToast: '✨ All drawings and annotations cleared.',
            speechControl: 'Smart Voice Remote - Say "Next" or "Back" (V)',
            speechNotSupported: '🎙️ Voice control is unavailable (Speech Recognition not supported in this browser).',
            speechPermDenied: '🎙️ Microphone permission not granted or service unavailable.',
            speechActiveToast: '🎤 Voice remote enabled! Commands: "Next", "Back", "Laser", "Clear".',
            speechDeactivated: '🎤 Voice mode turned off.',
            speechCmdNext: '🎙️ Voice command: Next Slide',
            speechCmdPrev: '🎙️ Voice command: Previous Slide',
            speechCmdLaser: '🎙️ Voice command: Laser Toggle',
            simulateRefresh: 'Simulate Live Data Refresh',
            refreshSimulatedToast: '🔄 Simulated live data refresh executed!',
            exitPresentation: 'Exit Presentation Mode (ESC)',
            presentationEndedToast: 'Presentation mode finished.',
            presentationActiveToast: '💻 Presentation mode active! Press P for pen, L for laser, V for voice remote.',
            colorRed: 'Red',
            colorYellow: 'Yellow',
            colorCyan: 'Cyan',
            colorGreen: 'Green'
        },
        guidedTour: {
            welcomeTitle: '🌟 Welcome to Vedra BI!',
            welcomeBadge: 'Overview',
            welcomeContent: 'Vedra BI is a next-generation <b>Business Intelligence & Visualization Studio</b>. Transform raw data into interactive 3D charts, KPI sparklines, and AI executive summaries in seconds.',
            dataLoadTitle: '📁 Data Loading & Live Excel Grid',
            dataLoadBadge: 'Data Management',
            dataLoadContent: 'Import <b>Excel (.xlsx), CSV, or JSON</b> files. Click "Edit Data" to modify cells, add rows, or apply formulas inside an ultra-fast spreadsheet interface.',
            chartStudioTitle: '📊 3D & Multi-Axis Chart Studio',
            chartStudioBadge: 'Visualizations',
            chartStudioContent: 'Drag and drop columns to plot instantly. Enjoy 30+ chart archetypes including Bar, Area, <b>3D Bars, Sankey, Heatmap, Waterfall, Candlestick, and Boxplots</b>.',
            kpiSparklineTitle: '🎯 KPI Metric Cards & Sparklines',
            kpiSparklineBadge: 'KPIs',
            kpiSparklineContent: 'Build executive KPI metric cards featuring live micro-sparkline graphs. Customize typography, color gradients, and target benchmarks with drag-and-drop.',
            lttbSamplingTitle: '⚡ LTTB High-Speed Data Sampling',
            lttbBadge: 'Performance',
            lttbSamplingBadge: 'Performance',
            lttbSamplingContent: 'Render massive datasets smoothly using the <b>LTTB Downsampling Engine</b>. Maintain visual fidelity while keeping performance at 60 FPS.',
            annotationsTitle: '📌 Data Point Pin Annotations',
            annotationsBadge: 'Annotations',
            annotationsContent: 'Click any data point inside a chart to pin instant callout notes, spike causes, or business markers directly on the visualization canvas.',
            thresholdAlertsTitle: '🚨 Threshold & Danger Zone Alerts',
            thresholdAlertsBadge: 'Live Alerts',
            thresholdAlertsContent: 'Set target min/max boundaries. When metrics cross safety limits, charts dynamically illuminate with pulsing danger indicators.',
            themeStylesTitle: '🎨 Themes & Dark Mode Palettes',
            themeStylesBadge: 'Themes',
            themeStylesContent: 'Switch between Dark Luxury and Light Silk modes in one click. Apply curated palettes (Emerald, Sunset, Cyberpunk) globally across all visuals.',
            aiNarratorTitle: '🎙️ AI Voice Briefing & Slideshow',
            aiNarratorBadge: 'AI & Showcase',
            aiNarratorContent: 'Click <b>"Audio Brief"</b> to listen to AI-powered vocal summaries of metrics, or enter full-screen <b>"Slideshow"</b> mode for board meetings.',
            floatingFabTitle: '🕹️ Draggable Quick Action Palette (FAB)',
            floatingFabBadge: 'Quick Tools',
            floatingFabContent: 'This floating quick palette lets you upload data, tile auto-grids, toggle snap-to-grid, and trigger command search with a single click.',
            exportReportsTitle: '📥 Executive PDF & PNG Export',
            exportReportsBadge: 'Export',
            exportReportsContent: 'Download production-ready <b>Executive PDF Reports</b>, high-resolution PNG images, or filtered CSV records instantly.',
            stepCounter: 'Step',
            skipTour: 'Skip Tour',
            prevStep: 'Previous',
            nextStep: 'Next',
            finishTour: 'Get Started 🎉',
            tourCompletedToast: '🎉 Guided tour completed! Welcome to Vedra BI.'
        },
        savedViews: {
            galleryTitle: 'Saved Views & Snapshots Gallery',
            gallerySubtitle: 'Captured chart snapshots and filtered visualization states',
            noSnapshotsTitle: 'No saved snapshots available',
            noSnapshotsDesc: 'Click the 📸 snapshot icon on any chart card to capture and save its view.',
            searchPlaceholder: 'Search snapshots by title...',
            applyViewBtn: 'Apply View',
            deleteAllBtn: 'Delete All Snapshots',
            deleteSingleBtn: 'Delete',
            confirmDeleteAll: 'Are you sure you want to remove all saved snapshots?',
            snapshotSavedToast: '📸 Snapshot saved to Saved Views gallery!',
            snapshotAppliedToast: '✅ Saved view restored and applied to dashboard!',
            snapshotDeletedToast: 'Snapshot removed.',
            allSnapshotsDeletedToast: 'All snapshots have been cleared.',
            configNotFound: 'Chart configuration not found!',
            unnamedChart: 'Unnamed Chart',
            noThumbnail: 'Thumbnail preview unavailable'
        },
        floatingFab: {
            paletteTitle: 'Quick Tools Palette',
            toolsBadge: '12 Tools',
            dragHint: 'Drag button to reposition',
            escHint: 'Press ESC to close',
            mainBtnTitle: 'Quick Menu Palette (Drag & Drop)',
            toolUpload: 'Upload Data',
            toolUploadDesc: 'Upload Excel or CSV file',
            toolAddChart: 'New Chart',
            toolAddChartDesc: 'Open chart builder',
            toolLttb: 'LTTB Samples',
            toolLttbDesc: 'Configure downsampling slider',
            toolFilter: 'Filter / Sort',
            toolFilterDesc: 'Open filtering & sort panel',
            toolStats: 'Data Stats',
            toolStatsDesc: 'View summary & statistics',
            toolAiChat: 'AI Assistant',
            toolAiChatDesc: 'Ask AI business advisor',
            toolAudio: 'Audio Brief',
            toolAudioDesc: 'Play vocal dashboard summary',
            toolPresent: 'Presentation',
            toolPresentDesc: 'Full-screen slide deck',
            toolAutoGrid: 'Auto Grid',
            toolAutoGridDesc: 'Auto-tile charts uniformly',
            toolLock: 'Lock Board',
            toolLockDesc: 'Lock/unlock drag & resize',
            toolExport: 'Export Report',
            toolExportDesc: 'Download PDF or PNG report',
            toolTheme: 'Switch Theme',
            toolThemeDesc: 'Toggle light and dark mode'
        },
        comparisonView: {
            btnOn: 'Comparison ON',
            btnOff: 'Comparison Mode',
            barTitle: 'Comparative Analysis (Side-by-Side)',
            barSubtitle: 'Compare identical metrics across two distinct time periods side-by-side',
            closeBarTitle: 'Exit Comparison Mode',
            periodALabel: 'Period A (First Baseline):',
            periodBLabel: 'Period B (Comparison Target):',
            fromLabel: 'From',
            toLabel: 'To',
            vsLabel: 'VS',
            presetLast7Days: 'Last 7 Days vs Prior 7 Days',
            presetLast30Days: 'Last 30 Days vs Prior 30 Days',
            presetThisMonthVsLast: 'This Month vs Last Month',
            activeToast: '🆚 Comparison mode enabled: compare side-by-side date periods',
            restoredToast: 'Standard visualization view restored'
        },
        welcomeModal: {
            onboardingCompleteBadge: 'ONBOARDING COMPLETE',
            welcomeHeader: 'Welcome to Vedra BI!',
            welcomeSubtitle: 'Your customized business analytics workspace is ready to go.',
            preferencesTitle: 'Your Configured Preferences',
            editPreferences: 'Edit',
            langLabel: 'Language',
            roleLabel: 'Role',
            goalsLabel: 'Goals',
            dataSourceLabel: 'Data Source',
            teamSizeLabel: 'Team Size',
            themeLabel: 'Theme',
            highlightsTitle: 'Key Dashboard Features (3 Quick Steps):',
            feature1Title: 'Visual Chart Studio',
            feature1Desc: 'Drag columns to create 30+ interactive 2D and 3D visual charts.',
            feature2Title: 'AI Business Advisor',
            feature2Desc: 'Ask questions in plain language and receive real-time business insights.',
            feature3Title: '1-Click Report Export',
            feature3Desc: 'Download formatted PDF reports and Excel spreadsheets instantly.',
            quickStartTitle: 'Quick Start with Demo Sales Data',
            quickStartSubtitle: "If you don't have an Excel or CSV file ready, load our sample dataset now:",
            loadSampleBtn: '🚀 Auto-Load Sample Data',
            uploadFileBtn: '📁 Upload Custom File',
            startDashboardBtn: 'Start Dashboard',
            sampleDataSuccessToast: '🚀 Sample BI Dataset loaded successfully into your dashboard!',
            sampleDataErrorToast: 'Error loading sample data: '
        },
        editor: {
            mainTitle: 'Visual Annotation & Textbox Editor',
            addTextbox: 'Add Textbox',
            editTextbox: 'Edit Text',
            deleteTextbox: 'Delete Box',
            fontFamily: 'Font Family',
            fontSize: 'Font Size',
            textColor: 'Text Color',
            bgColor: 'Background Color',
            textAlign: 'Text Alignment',
            alignLeft: 'Align Left',
            alignCenter: 'Align Center',
            alignRight: 'Align Right',
            alignJustify: 'Justify',
            bold: 'Bold',
            italic: 'Italic',
            underline: 'Underline',
            bringFront: 'Front',
            sendBack: 'Back',
            duplicate: 'Copy',
            delete: 'Delete',
            lock: 'Lock',
            unlock: 'Unlock',
            rotate: 'Rotate',
            resize: 'Resize',
            createBtn: 'Create New Textbox',
            updateBtn: 'Update Textbox',
            editingBtn: 'Editing Textbox... (Double-click to stop)',
            alignSelectMin2: 'Please select at least 2 boxes for alignment.',
            distributeSelectMin3: 'Please select at least 3 boxes for distribution.',
            copyStyleSelect1: 'Please select only one box to copy style.',
            noFilteredData: 'No filtered data available.',
            selectDataRowWarning: 'Please select at least one data row to insert.',
            emptyTextbox: '(Empty Textbox)',
            noTextboxes: 'No textboxes present.',
            textboxItem: 'Textbox',
            showMore: 'Show More',
            showLess: 'Show Less',
            snapToGrid: 'Snap to Grid',
            copyStyles: 'Copy Style',
            pasteStyles: 'Paste Style',
            templates: 'Templates',
            sampleTitleTemplate: 'Executive Dashboard Title',
            sampleNotesTemplate: 'Strategic Key Takeaways'
        },
        customControls: {
            selectPlaceholder: 'Select an option...',
            noOptionsFound: 'No matching options found',
            searchOption: 'Search options...',
            pickColorTitle: 'Color Palette Picker',
            customColor: 'Custom Hex Color',
            palettePresets: 'Curated Presets',
            saveColor: 'Select',
            cancelColor: 'Cancel'
        },
        dragDrop: {
            snapOn: '📐 Snap-to-Grid alignment enabled (20px)',
            snapOff: '🔓 Snap-to-Grid disabled (Freeform Mode)',
            cardsSwapped: '🔄 Cards rearranged: Both chart positions swapped!',
            layoutSaved: '💾 Dashboard layout & settings saved!',
            autoArranged: '📐 {count} chart cards arranged in a clean {cols}-column grid!',
            noCardsFound: 'No chart cards found to auto-arrange!',
            initError: 'Error initializing drag/resize functionality'
        },
        navbar: {
            data: 'Data',
            charts: 'Charts',
            kpis: 'KPIs',
            settings: 'Settings',
            stats: 'Stats',
            actions: 'Actions',
            layouts: 'Layouts',
            filters: 'Filters',
            dashboard: 'Dashboard',
            formatting: 'Formatting',
            effects: 'Effects',
            textbox: 'Textbox',
            theme: 'Theme',
            profile: 'Profile',
            toggleDashboard: 'Show/Hide Dashboard Canvas',
            snapGrid: 'Snap Grid (20px)',
            compare: 'Compare',
            savedViews: 'Saved Views',
            autoGrid: 'Auto Grid',
            sampling: 'LTTB Sampling',
            slideshow: 'Slideshow',
            audioBrief: 'Audio Brief',
            searchCtrlK: 'Quick Search',
            shortcuts: 'Shortcuts (?)',
            quickTour: 'Quick Tour',
            changeLanguage: 'Change Language',
            editData: 'Edit Data',
            addData: 'Add Data',
            downloadTemplate: 'Download Template',
            export: 'Export Report',
            exportPdf: 'Executive PDF Report',
            exportPng: 'Capture PNG',
            exportCsv: 'Filtered CSV',
            autosaved: 'Autosaved',
            toggleTheme: 'Toggle Theme',
            langHindi: 'हिन्दी',
            langEnglish: 'English',
            langGujarati: 'ગુજરાતી',
            langSwitchedToast: 'Language switched to English'
        },
        sidebar: {
            chartDesigner: 'Chart Designer',
            styleFormatting: 'Style & Formatting',
            visualEffects: 'Visual Effects',
            dataSource: 'Data Source',
            kpiCards: 'KPI Metric Cards',
            dataStatistics: 'Data Statistics',
            dashboardView: 'Dashboard View',
            notesAnnotations: 'Notes & Annotations',
            colorThemes: 'Color Themes',
            userProfile: 'User Profile & Settings',
            quickActions: 'Quick Actions',
            settingsThresholds: 'Settings & Thresholds',
            filtersSorting: 'Filters & Sorting',
            layoutTemplates: 'Layout Templates',
            quickSearchPlaceholder: 'Quick search controls...',
            collapseAll: 'Collapse All',
            expandAll: 'Expand All'
        },
        dashboard: {
            visualizations: 'Visualizations',
            filterColumn: 'Filter Column:',
            filterValue: 'Filter Value:',
            dates: 'Dates:',
            start: 'Start',
            end: 'End',
            to: 'to',
            apply: 'Apply',
            resetFilters: 'Reset Filters',
            none: '-- None --',
            all: '-- All --',
            noCharts: 'No charts available.',
            addChartsHint: 'Add charts from Chart Settings in the sidebar.',
            noDataFound: 'No data found. Please upload data.',
            activeFilters: 'Active Filters:',
            clearAll: 'Clear All',
            dataRecords: 'Data Records',
            loadingData: 'Loading Data...'
        },
        charts: {
            delete: 'Delete Chart',
            aiAdvice: 'Get AI Advice',
            download: 'Download Chart',
            edit: 'Edit Chart',
            freeze: 'Freeze Chart',
            unfreeze: 'Unfreeze Chart',
            pin: 'Pin Chart',
            unpin: 'Unpin Chart',
            filterByColumn: 'Filter by Column',
            filterChartData: 'Filter Chart Data',
            rowLimit: 'Data Rows Limit',
            allRows: 'All (All Rows)',
            first10: 'First 10 Records',
            first25: 'First 25 Records',
            first50: 'First 50 Records',
            first100: 'First 100 Records',
            first250: 'First 250 Records',
            first500: 'First 500 Records',
            first1000: 'First 1000 Records',
            saveSnapshot: 'Save View Snapshot',
            fullscreen: 'Fullscreen',
            moreOptions: 'More Options',
            editPermissions: 'Edit Button Permissions',
            zoom: 'Zoom',
            pan: 'Pan',
            resetAxes: 'Reset Axes',
            filterApplied: 'Filter applied for chart',
            filterError: 'Error applying filter',
            allPlotsError: 'Error plotting all charts',
            updatingData: 'Updating data...',
            confirmDelete: 'Are you sure you want to delete this chart?'
        },
        kpi: {
            layoutSettings: 'Layout Settings',
            editKpi: 'Edit KPI',
            deleteKpi: 'Delete KPI',
            typography: 'Text',
            chart: 'Chart',
            position: 'Position',
            titleSize: 'Title size',
            valueSize: 'Value size',
            textAlign: 'Text Align',
            left: 'Left',
            center: 'Center',
            right: 'Right',
            chartStyle: 'Chart Style',
            line: 'Line',
            area: 'Area',
            bar: 'Bar',
            pie: 'Pie',
            doughnut: 'Doughnut',
            polar: 'Polar',
            radar: 'Radar',
            width: 'Width',
            height: 'Height',
            basePosition: 'Base Position',
            bottom: 'Bottom',
            background: 'Background',
            custom: 'Custom Drag',
            textPosition: 'Text Position',
            standard: 'Standard',
            textX: 'Text X',
            textY: 'Text Y',
            chartX: 'Chart X',
            chartY: 'Chart Y',
            dragTip: 'You can also drag-and-drop directly on the card!',
            close: 'Close',
            confirmDelete: 'Are you sure you want to delete this KPI card?',
            totalRows: 'Total Rows',
            filteredActive: 'Filtered Data Active',
            fullDataLoaded: 'Full Data Loaded',
            progressStats: 'Weekly/Monthly Progression',
            activeCharts: 'Active Charts',
            totalVisualizations: 'Total Visualizations',
            aiQueries: 'AI Queries',
            aiQueriesSubtitle: 'Interactive AI Chat Assistant Queries',
            keyMetric: 'Key Metric',
            totalOf: 'Total',
            uniqueOf: 'Unique'
        }
    },

    // ==========================================
    // 🇮🇳 HINDI (hi)
    // ==========================================
    hi: {
        common: {
            save: 'सहेजें (Save)',
            cancel: 'रद्द करें (Cancel)',
            close: 'बंद करें (Close)',
            apply: 'लागू करें (Apply)',
            delete: 'हटाएं (Delete)',
            edit: 'संपादित करें (Edit)',
            reset: 'रीसेट (Reset)',
            back: 'पीछे (Back)',
            next: 'आगे (Next)',
            prev: 'पिछला (Previous)',
            finish: 'समाप्त (Finish)',
            search: 'खोजें (Search)',
            searchPlaceholder: 'खोजने के लिए टाइप करें...',
            loading: 'लोड हो रहा है...',
            success: 'सफलता',
            error: 'त्रुटि',
            warning: 'चेतावनी',
            info: 'जानकारी',
            confirm: 'पुष्टि करें',
            clear: 'साफ़ करें',
            download: 'डाउनलोड करें',
            upload: 'अपलोड करें',
            export: 'एक्सपोर्ट करें',
            import: 'इम्पोर्ट करें',
            preview: 'पूर्वावलोकन',
            refresh: 'रिफ्रेश करें',
            settings: 'सेटिंग्स',
            language: 'भाषा',
            theme: 'थीम',
            darkMode: 'डार्क मोड',
            lightMode: 'लाइट मोड',
            fullscreen: 'फुलस्क्रीन',
            exitFullscreen: 'फुलस्क्रीन बंद करें',
            overview: 'अवलोकन',
            actions: 'क्रियाएँ',
            help: 'मदद',
            undo: 'पूर्ववत (Undo)',
            redo: 'फिर से करें (Redo)'
        },
        commandPalette: {
            title: 'कमांड पैलेट (Spotlight Search)',
            searchPlaceholder: 'कमांड, टूल्स, चार्ट्स या शॉर्टकट्स खोजें (Ctrl+K)...',
            noResults: 'कोई मिलता-जुलता कमांड नहीं मिला।',
            navigateHint: 'नेविगेट करें',
            selectHint: 'चुनें',
            closeHint: 'बंद करें',
            tourName: '💡 ट्यूटोरियल दौरा शुरू करें (Start Guided Tour)',
            tourDesc: 'डैशबोर्ड के सभी फीचर्स का इंटरैक्टिव टूर देखें',
            themeToggleName: '🌗 थीम बदलें (Toggle Theme Mode)',
            themeToggleDesc: 'डार्क और लाइट थीम के बीच स्विच करें',
            presentationName: '💻 प्रेजेंटेशन मोड शुरू करें (Start Presentation Mode)',
            presentationDesc: 'पूरी स्क्रीन पर लेज़र पॉइंटर के साथ स्लाइड शो शुरू करें',
            audioNarratorName: '🎙️ ऑडियो सारांश सुनें (Play Audio Summary Briefing)',
            audioNarratorDesc: 'डैशबोर्ड और केपीआई मेट्रिक्स का बोलता हुआ व्याख्यात्मक सारांश सुनें',
            statsName: '📊 डेटा सांख्यिकी देखें (View Data Statistics)',
            statsDesc: 'अपलोड किए गए डेटा के मुख्य सांख्यिकी और आंकड़े देखें',
            addRecordName: '➕ नया रिकॉर्ड जोड़ें (Add New Data Record)',
            addRecordDesc: 'डेटासेट में एक नया कस्टम पंक्ति जोड़ें',
            dataAuditName: '🛡️ डेटा क्वालिटी ऑडिट करें (Run Data Quality Audit)',
            dataAuditDesc: 'डेटा में विसंगतियों, शून्य मानों और अशुद्धियों की जांच करें',
            exportPdfName: '📄 एक्जीक्यूटिव PDF रिपोर्ट डाउनलोड करें (Export PDF)',
            exportPdfDesc: 'डैशबोर्ड को कार्यपालक पीडीएफ प्रारूप में प्रिंट / डाउनलोड करें',
            exportPngName: '🖼️ पूरे डैशबोर्ड की PNG इमेज लें (Snapshot)',
            exportPngDesc: 'डैशबोर्ड का हाई-क्वालिटी स्क्रीनशॉट इमेज डाउनलोड करें',
            downloadTemplateName: '📥 एक्सेल टेम्पलेट डाउनलोड करें (Download Excel Template)',
            downloadTemplateDesc: 'डिफ़ॉल्ट डेटा प्रारूप के साथ एक्सेल स्प्रेडशीट डाउनलोड करें',
            addChartName: '📈 नया चार्ट जोड़ें (Open Chart Designer)',
            addChartDesc: 'एक्सिस चुनकर कस्टम नया चार्ट डैशबोर्ड में जोड़ें',
            addKpiName: '⭐ KPI कार्ड बनाएं (Open KPI Builder)',
            addKpiDesc: 'मुख्य प्रदर्शन संकेतक (KPI) कार्ड स्पार्कलाइन के साथ डिजाइन करें',
            filtersName: '⏳ फ़िल्टर एवं सॉर्ट पैनल खोलें (Open Filters Panel)',
            filtersDesc: 'डेटा सॉर्टिंग और विशिष्ट फ़िल्टर लागू करने का पैनल खोलें',
            chatAiName: '🤖 AI चैट असिस्टेंट खोलें (Open AI Chat)',
            chatAiDesc: 'अपने डेटा के बारे में सवाल पूछें या ऑटो-चार्ट बनाने को कहें'
        },
        presentation: {
            liveShowTitle: '💻 लाइव शो (LIVE SHOW)',
            overview: 'अवलोकन (Overview)',
            timerTitle: 'क्लिक करें: रीसेट | टाइमर (Stopwatch / Click to reset)',
            timerResetToast: '⏱️ टाइमर पुनः आरंभ किया गया।',
            prevChart: 'पिछली स्लाइड (Prev Chart)',
            nextChart: 'अगली स्लाइड (Next Chart)',
            autoPlayPause: 'स्वचालित चलाएं (Auto Play / Pause)',
            autoPlayStarted: '⏱️ स्वचालित स्लाइड शो सक्रिय: हर 6 सेकंड में स्लाइड बदलेगी।',
            laserPointer: 'डिजिटल लेज़र पॉइंटर (Toggle Laser Pointer)',
            penAnnotation: 'लाइव आरेखण पेन (Draw / Annotation Mode)',
            penModeActive: '✏️ आरेखण पेन मोड सक्रिय: स्क्रीन पर चित्र बनाने के लिए क्लिक करें और खींचें।',
            clearAnnotation: 'साफ़ करें (Clear Annotation)',
            clearAnnotationToast: '✨ सभी आरेखण और निशान साफ़ किए गए।',
            speechControl: 'स्मार्ट वॉयस रिमोट - "आगे/Next" बोलें (Hands-free Speech Control)',
            speechNotSupported: '🎙️ वॉयस मोड उपलब्ध नहीं है (यह ब्राउज़र Speech Recognition का समर्थन नहीं करता है)।',
            speechPermDenied: '🎙️ माइक्रोफोन अनुमति प्राप्त नहीं हुई या वॉयस सेवा अनुपलब्ध है।',
            speechActiveToast: '🎤 वॉयस रिमोट चालू! आदेश दें: "आगे", "पीछे", "लेज़र", "साफ"।',
            speechDeactivated: '🎤 वॉयस मोड बंद।',
            speechCmdNext: '🎙️ वॉयस कमांड: अगली स्लाइड',
            speechCmdPrev: '🎙️ वॉयस कमांड: पिछली स्लाइड',
            speechCmdLaser: '🎙️ वॉयस कमांड: लेज़र टॉगल',
            simulateRefresh: 'डेटा रीफ्रेश सिमुलेशन (Simulate Live Data Refresh)',
            refreshSimulatedToast: '🔄 लाइव रिफ्रेश सिमुलेशन किया गया!',
            exitPresentation: 'प्रेजेंटेशन समाप्त करें (Exit - ESC)',
            presentationEndedToast: 'प्रेजेंटेशन मोड समाप्त।',
            presentationActiveToast: '💻 भव्य प्रेजेंटेशन मोड सक्रिय! पेन (P), लेज़र (L), और वॉयस मोड (V) सक्षम हैं।',
            colorRed: 'लाल (Red)',
            colorYellow: 'पीला (Yellow)',
            colorCyan: 'नीला (Cyan)',
            colorGreen: 'हरा (Green)'
        },
        guidedTour: {
            welcomeTitle: '🌟 वेड्रा BI में आपका स्वागत है!',
            welcomeBadge: 'परिचय (Overview)',
            welcomeContent: 'यह एक आधुनिक <b>Next-Gen बिजनेस इंटेलिजेंस और डेटा विज़ुअलाइज़ेशन प्लेटफॉर्म</b> है। यहाँ आप अपने डेटा को मिनटों में 3D चार्ट्स, KPI कार्ड्स, और AI-संचालित इनसाइट्स में बदल सकते हैं।',
            dataLoadTitle: '📁 डेटा अपलोड व लाइव एक्सेल ग्रिड',
            dataLoadBadge: 'डेटा प्रबंधन (Data)',
            dataLoadContent: 'यहाँ से <b>Excel (.xlsx), CSV या JSON</b> डेटा अपलोड करें। "Edit Data" बटन दबाकर आप एक्सेल की तरह इन-लाइन सेल्स, नए रो और फॉर्मूला सीधे एडिट कर सकते हैं।',
            chartStudioTitle: '📊 3D व मल्टी-अक्ष चार्ट स्टूडियो',
            chartStudioBadge: 'चार्ट डिज़ाइनर (Charts)',
            chartStudioContent: 'ड्रैग-एंड-ड्रॉप से कॉलम जोड़ें। बार, एरिया, <b>3D Bar/Line, Sankey, Heatmap, Waterfall, Candlestick, Radar, Funnel व Boxplot</b> सहित 30+ चार्ट प्रकारों का आनंद लें।',
            kpiSparklineTitle: '🎯 इंटरैक्टिव KPI व स्पार्कलाइन्स',
            kpiSparklineBadge: 'मुख्य मेट्रिक्स (KPI)',
            kpiSparklineContent: 'अपने मुख्य मेट्रिक्स के लिए लाइव स्पार्कलाइन ग्राफ के साथ <b>KPI कार्ड्स</b> बनाएं। इनका फॉन्ट, संरेखण (alignment), और ग्रेडिएंट स्टाइल सीधे ड्रैग-एंड-सेट करें।',
            lttbSamplingTitle: '⚡ ग्लोबल फिल्टर्स व LTTB हाई-स्पीड सैंपलिंग',
            lttbBadge: 'परफॉरमेंस (Performance)',
            lttbSamplingBadge: 'परफॉरमेंस व फिल्टर्स (Performance)',
            lttbSamplingContent: 'लाखों रिकॉर्ड्स को बिना हैंग हुए सेकंड्स में रेंडर करने के लिए <b>LTTB Downsampling Slider</b> का उपयोग करें। आप विशिष्ट कस्टम रो या स्पाइक्स को भी चुन सकते हैं!',
            annotationsTitle: '📌 डेटा पॉइंट पिन व कॉलआउट एनोटेशन्स',
            annotationsBadge: 'कॉलआउट्स (Annotations)',
            annotationsContent: 'किसी भी चार्ट के बार या लाइन पॉइंट पर <b>क्लिक या डबल-क्लिक</b> करके आप उस बिंदु पर अपना कस्टम नोट, स्पाइक रीज़न या बिजनेस अलर्ट पिन कर सकते हैं।',
            thresholdAlertsTitle: '🚨 थ्रेशोल्ड व डेंजर ज़ोन अलर्ट्स',
            thresholdAlertsBadge: 'लाइव अलर्ट (Alerts)',
            thresholdAlertsContent: 'चार्ट सेटिंग्स में न्यूनतम या अधिकतम सीमा (Threshold) सेट करें। यदि डेटा डेंजर ज़ोन को पार करता है तो डैशबोर्ड स्वतः लाल हाइलाइट और चेतावनी प्रदर्शित करता है।',
            themeStylesTitle: '🎨 थीम्स, डार्क मोड व विज़ुअल स्टाइल्स',
            themeStylesBadge: 'स्टाइलिंग (Theme)',
            themeStylesContent: 'एक क्लिक में <b>डार्क मोड</b> या लाइट मोड स्विच करें, फॉन्ट फैमिली, कलर पैलेट (Emerald, Sunset, Neon) और बॉर्डर रेडियस को पूरे डैशबोर्ड पर लागू करें।',
            aiNarratorTitle: '🎙️ AI ऑडियो नैरेटर व स्लाइडशो मोड',
            aiNarratorBadge: 'AI व शोकेस (AI Showcase)',
            aiNarratorContent: '<b>"Audio Brief"</b> बटन दबाकर अपने डैशबोर्ड का AI वॉइस सारांश सुनें, या <b>"Slideshow"</b> मोड चालू करके मीटिंग्स में फुल-स्क्रीन प्रेजेंटेशन दें।',
            floatingFabTitle: '🕹️ ट्रांसपेरेंट फ्लोटिंग क्विक पैलेट (FAB)',
            floatingFabBadge: 'क्विक टूल्स (FAB)',
            floatingFabContent: 'स्क्रीन पर तैरने वाला यह <b>क्विक पैलेट</b> आपको तुरंत डेटा जोड़ने, ऑटो-ग्रिड टाइल करने, स्नैप-टू-ग्रिड टॉगल करने और कमांड पैलेट (Ctrl+K) खोलने की सुविधा देता है।',
            exportReportsTitle: '📥 एक्जीक्यूटिव PDF / PNG व रिपोर्ट एक्सपोर्ट',
            exportReportsBadge: 'एक्सपोर्ट (Export)',
            exportReportsContent: 'अपने तैयार डैशबोर्ड को सीधे <b>हाई-रेज़ोल्यूशन PDF रिपोर्ट</b>, पूरे डैशबोर्ड की <b>PNG इमेज</b>, या फ़िल्टर्ड CSV फ़ाइल के रूप में आसानी से डाउनलोड करें।',
            stepCounter: 'चरण',
            skipTour: 'टूर छोड़ें (Skip)',
            prevStep: 'पिछला (Back)',
            nextStep: 'आगे (Next)',
            finishTour: 'शुरू करें 🎉',
            tourCompletedToast: '🎉 ट्यूटोरियल टूर समाप्त! Vedra BI में आपका स्वागत है।'
        },
        savedViews: {
            galleryTitle: 'सहेजे गए दृश्य गैलरी (Saved Views Gallery)',
            gallerySubtitle: 'कैप्चर किए गए चार्ट स्नैपशॉट एवं फ़िल्टर्ड विज़ुअलाइज़ेशन स्टेट्स',
            noSnapshotsTitle: 'कोई स्नैपशॉट उपलब्ध नहीं है',
            noSnapshotsDesc: 'किसी भी चार्ट कार्ड पर 📸 बटन पर क्लिक करके स्नैपशॉट सहेजें।',
            searchPlaceholder: 'स्नैपशॉट खोजें...',
            applyViewBtn: 'दृश्य लागू करें',
            deleteAllBtn: 'सभी स्नैपशॉट हटाएं',
            deleteSingleBtn: 'हटाएं',
            confirmDeleteAll: 'क्या आप निश्चित रूप से सभी सहेजे गए स्नैपशॉट हटाना चाहते हैं?',
            snapshotSavedToast: '📸 स्नैपशॉट गैलरी में सहेजा गया!',
            snapshotAppliedToast: '✅ सहेजा गया दृश्य डैशबोर्ड पर लागू कर दिया गया!',
            snapshotDeletedToast: 'स्नैपशॉट हटा दिया गया।',
            allSnapshotsDeletedToast: 'सभी स्नैपशॉट हटा दिए गए।',
            configNotFound: 'चार्ट कॉन्फ़िगरेशन नहीं मिला!',
            unnamedChart: 'अनाम चार्ट',
            noThumbnail: 'थंबनेल इमेज उपलब्ध नहीं'
        },
        floatingFab: {
            paletteTitle: 'त्वरित टूल पैलेट (Quick Palette)',
            toolsBadge: '12 टूल्स',
            dragHint: 'बटन को ड्रैग करके मूव करें',
            escHint: 'Esc से बंद करें',
            mainBtnTitle: 'त्वरित मेनू पैलेट (खींचें और छोड़ें)',
            toolUpload: 'डेटा अपलोड',
            toolUploadDesc: 'Excel या CSV डेटा फ़ाइल अपलोड करें',
            toolAddChart: 'नया चार्ट',
            toolAddChartDesc: 'नया चार्ट जोड़ें',
            toolLttb: 'LTTB सैंपल्स',
            toolLttbDesc: 'LTTB सैंपलिंग व कस्टम डेटा पॉइंट्स चुनें',
            toolFilter: 'फ़िल्टर / सॉर्ट',
            toolFilterDesc: 'डेटा फ़िल्टर एवं सॉर्ट पैनल खोलें',
            toolStats: 'डेटा आँकड़े',
            toolStatsDesc: 'डेटा सारांश व सांख्यिकी',
            toolAiChat: 'AI असिस्टेंट',
            toolAiChatDesc: 'AI चैट असिस्टेंट से पूछें',
            toolAudio: 'ऑडियो ब्रीफ़',
            toolAudioDesc: 'डैशबोर्ड ऑडियो सारांश सुनें',
            toolPresent: 'प्रेजेंटेशन',
            toolPresentDesc: 'फुलस्क्रीन प्रेजेंटेशन मोड चलाएं',
            toolAutoGrid: 'ऑटो ग्रिड',
            toolAutoGridDesc: 'चार्ट्स को ग्रिड में स्वतः व्यवस्थित करें',
            toolLock: 'लॉक डैशबोर्ड',
            toolLockDesc: 'ड्रैग व रीसाइज़ लॉक/अनलॉक करें',
            toolExport: 'रिपोर्ट एक्सपोर्ट',
            toolExportDesc: 'PDF / PNG रिपोर्ट डाउनलोड करें',
            toolTheme: 'थीम बदलें',
            toolThemeDesc: 'लाइट / डार्क थीम बदलें'
        },
        comparisonView: {
            btnOn: 'तुलना मोड ON',
            btnOff: 'तुलना मोड',
            barTitle: 'तुलनात्मक विश्लेषण (Comparison Mode)',
            barSubtitle: 'समान मीट्रिक के लिए दो अलग-अलग समयावधियों की साथ-साथ (Side-by-Side) तुलना करें',
            closeBarTitle: 'तुलना मोड बंद करें',
            periodALabel: 'समयावधि A (Period A - पहला भाग):',
            periodBLabel: 'समयावधि B (Period B - तुलनात्मक भाग):',
            fromLabel: 'से',
            toLabel: 'तक',
            vsLabel: 'VS',
            presetLast7Days: 'पिछले 7 दिन बनाम पूर्व 7 दिन',
            presetLast30Days: 'पिछले 30 दिन बनाम पूर्व 30 दिन',
            presetThisMonthVsLast: 'यह महीना बनाम पिछला महीना',
            activeToast: '🆚 तुलना मोड सक्रिय: दो समयावधियों (Side-by-Side Date Ranges) की तुलना करें',
            restoredToast: 'मानक विज़ुअलाइज़ेशन व्यू पर वापस लौटे'
        },
        welcomeModal: {
            onboardingCompleteBadge: 'ऑनबोर्डिंग पूर्ण',
            welcomeHeader: 'Vedra BI में आपका स्वागत है!',
            welcomeSubtitle: 'आपका कस्टमाइज़्ड बिजनेस एनालिटिक्स डैशबोर्ड तैयार है।',
            preferencesTitle: 'आपकी चुनी हुई प्राथमिकताएँ (Configured Preferences)',
            editPreferences: 'बदलें',
            langLabel: 'भाषा',
            roleLabel: 'व्यापारिक भूमिका',
            goalsLabel: 'मुख्य लक्ष्य',
            dataSourceLabel: 'डेटा स्रोत',
            teamSizeLabel: 'टीम आकार',
            themeLabel: 'थीम',
            highlightsTitle: 'डैशबोर्ड की मुख्य विशेषताएँ (3 Quick Steps):',
            feature1Title: 'विज़ुअल चार्ट बिल्डर',
            feature1Desc: 'कॉलम ड्रैग करें और 30+ इंटरैक्टिव चार्ट्स में डेटा देखें।',
            feature2Title: 'AI बिजनेस एडवाइज़र',
            feature2Desc: 'हिंदी व अंग्रेजी में सवाल पूछें और तुरंत बिजनेस इनसाइट्स पाएँ।',
            feature3Title: '1-क्लिक रिपोर्ट एक्सपोर्ट',
            feature3Desc: 'सुंदर PDF और formatted Excel रिपोर्ट्स तुरंत डाउनलोड करें।',
            quickStartTitle: 'डेमो डेटा से तुरंत डैशबोर्ड का अनुभव लें',
            quickStartSubtitle: 'यदि आपके पास अभी अपनी Excel/CSV फ़ाइल उपलब्ध नहीं है, तो नमूना सेल्स डेटा लोड करें:',
            loadSampleBtn: '🚀 नमूना डेटा ऑटो-लोड करें',
            uploadFileBtn: '📁 खुद की फ़ाइल अपलोड करें',
            startDashboardBtn: 'डैशबोर्ड शुरू करें',
            sampleDataSuccessToast: '🚀 नमूना सेल्स डेटा (Sample BI Dataset) सफलता से लोड किया गया!',
            sampleDataErrorToast: 'नमूना डेटा लोड करने में त्रुटि: '
        },
        editor: {
            mainTitle: 'विज़ुअल एनोटेशन व टेक्स्टबॉक्स संपादक',
            addTextbox: 'टेक्स्टबॉक्स जोड़ें',
            editTextbox: 'टेक्स्ट संपादित करें',
            deleteTextbox: 'बॉक्स हटाएं',
            fontFamily: 'फ़ॉन्ट परिवार',
            fontSize: 'फ़ॉन्ट आकार',
            textColor: 'टेक्स्ट का रंग',
            bgColor: 'पृष्ठभूमि का रंग',
            textAlign: 'संरेखण (Align)',
            alignLeft: 'बाएँ संरेखित करें',
            alignCenter: 'मध्य में रखें',
            alignRight: 'दाएँ संरेखित करें',
            alignJustify: 'दोनों ओर संरेखित करें',
            bold: 'बोल्ड (Bold)',
            italic: 'इटैलिक (Italic)',
            underline: 'अंडरलाइन (Underline)',
            bringFront: 'आगे',
            sendBack: 'पीछे',
            duplicate: 'कॉपी',
            delete: 'हटाएं',
            lock: 'लॉक',
            unlock: 'अनलॉक',
            rotate: 'घुमाएँ',
            resize: 'रीसाइज़',
            createBtn: 'नया टेक्स्टबॉक्स बनाएं',
            updateBtn: 'टेक्स्टबॉक्स अपडेट करें',
            editingBtn: 'संपादन जारी है... (रोकने के लिए डबल-क्लिक करें)',
            alignSelectMin2: 'संरेखण (Align) के लिए कृपया कम से कम 2 बॉक्स चुनें।',
            distributeSelectMin3: 'समान रूप से बांटने (Distribute) के लिए कृपया कम से कम 3 बॉक्स चुनें।',
            copyStyleSelect1: 'स्टाइल कॉपी करने के लिए केवल एक बॉक्स का चयन करें।',
            noFilteredData: 'कोई फ़िल्टर किया गया डेटा उपलब्ध नहीं है।',
            selectDataRowWarning: 'कृपया डालने के लिए कम से कम एक डेटा पंक्ति चुनें।',
            emptyTextbox: '(खाली टेक्स्टबॉक्स)',
            noTextboxes: 'कोई टेक्स्टबॉक्स मौजूद नहीं है।',
            textboxItem: 'टेक्स्टबॉक्स',
            showMore: 'और देखें',
            showLess: 'कम देखें',
            snapToGrid: 'ग्रिड से चिपकाएँ (Snap to Grid)',
            copyStyles: 'स्टाइल कॉपी करें',
            pasteStyles: 'स्टाइल पेस्ट करें',
            templates: 'टेम्पलेट्स',
            sampleTitleTemplate: 'मुख्य डैशबोर्ड शीर्षक',
            sampleNotesTemplate: 'महत्वपूर्ण निष्कर्ष व नोट्स'
        },
        customControls: {
            selectPlaceholder: 'विकल्प चुनें...',
            noOptionsFound: 'कोई विकल्प नहीं मिला',
            searchOption: 'विकल्प खोजें...',
            pickColorTitle: 'कलर पैलेट पिकर',
            customColor: 'कस्टम हेक्स रंग',
            palettePresets: 'तैयार रंग पैलेट',
            saveColor: 'चुनें (Select)',
            cancelColor: 'रद्द करें'
        },
        dragDrop: {
            snapOn: '📐 स्नैप-टू-ग्रिड (Snap-to-Grid) चालू (20px)',
            snapOff: '🔓 स्नैप-टू-ग्रिड बंद (फ्री-फॉर्म मोड)',
            cardsSwapped: '🔄 ग्रिड कार्ड पुनर्व्यवस्थित: दोनों चार्ट की स्थितियां बदली गईं!',
            layoutSaved: '💾 डैशबोर्ड लेआउट एवं सेटिंग्स सहेजी गईं!',
            autoArranged: '📐 {count} चार्ट कार्ड {cols}-कॉलम व्यवस्थित ग्रिड लेआउट में सेट किए गए!',
            noCardsFound: 'ग्रिड रीऑर्डर के लिए कोई चार्ट कार्ड नहीं मिला!',
            initError: 'चार्ट ड्रैग/रीसाइज initialization में त्रुटि'
        },
        navbar: {
            data: 'डेटा',
            charts: 'चार्ट्स',
            kpis: 'KPIs',
            settings: 'सेटिंग्स',
            stats: 'आंकड़े',
            actions: 'क्रियाएं',
            layouts: 'लेआउट',
            filters: 'फिल्टर्स',
            dashboard: 'डैशबोर्ड',
            formatting: 'फॉर्मेटिंग',
            effects: 'इफेक्ट्स',
            textbox: 'टेक्स्टबॉक्स',
            theme: 'थीम',
            profile: 'प्रोफाइल',
            toggleDashboard: 'डैशबोर्ड दिखाएं/छिपाएं',
            snapGrid: 'स्नैप ग्रिड (20px)',
            compare: 'तुलना (Compare)',
            savedViews: 'सेव्ड व्यूज',
            autoGrid: 'ऑटो ग्रिड',
            sampling: 'डेटा सैंपलिंग (LTTB)',
            slideshow: 'स्लाइड शो',
            audioBrief: 'ऑडियो ब्रीफ',
            searchCtrlK: 'त्वरित खोज (Ctrl+K)',
            shortcuts: 'शॉर्टकट्स (?)',
            quickTour: 'क्विक टूर',
            changeLanguage: 'भाषा बदलें',
            editData: 'डेटा एडिट करें',
            addData: 'डेटा जोड़ें',
            downloadTemplate: 'टेम्पलेट डाउनलोड',
            export: 'रिपोर्ट एक्सपोर्ट',
            exportPdf: 'PDF रिपोर्ट',
            exportPng: 'PNG कैप्चर',
            exportCsv: 'CSV डेटा',
            autosaved: 'स्वतः सहेजा गया',
            toggleTheme: 'थीम बदलें',
            langHindi: 'हिन्दी',
            langEnglish: 'English',
            langGujarati: 'ગુજરાતી',
            langSwitchedToast: 'भाषा बदलकर हिन्दी कर दी गई है'
        },
        sidebar: {
            chartDesigner: 'चार्ट डिज़ाइनर',
            styleFormatting: 'स्टाइल व फॉर्मेटिंग',
            visualEffects: 'विजुअल इफेक्ट्स',
            dataSource: 'डेटा स्रोत',
            kpiCards: 'KPI मीट्रिक कार्ड्स',
            dataStatistics: 'डेटा सांख्यिकी',
            dashboardView: 'डैशबोर्ड व्यू',
            notesAnnotations: 'नोट्स व एनोटेशन',
            colorThemes: 'कलर थीम्स',
            userProfile: 'यूज़र प्रोफाइल व सेटिंग्स',
            quickActions: 'त्वरित क्रियाएं',
            settingsThresholds: 'सेटिंग्स व थ्रेशोल्ड्स',
            filtersSorting: 'फिल्टर व सॉर्टिंग',
            layoutTemplates: 'लेआउट टेम्पलेट्स',
            quickSearchPlaceholder: 'कंट्रोल्स खोजें...',
            collapseAll: 'सभी समेटें',
            expandAll: 'सभी फैलाएं'
        },
        dashboard: {
            visualizations: 'विज़ुअलाइज़ेशन (Visualizations)',
            filterColumn: 'फ़िल्टर कॉलम:',
            filterValue: 'फ़िल्टर मान:',
            dates: 'दिनांक:',
            start: 'शुरू',
            end: 'समाप्त',
            to: 'से',
            apply: 'लागू करें',
            resetFilters: 'फ़िल्टर रीसेट करें',
            none: '-- कोई नहीं --',
            all: '-- सभी --',
            noCharts: 'कोई चार्ट उपलब्ध नहीं है।',
            addChartsHint: 'साइडबार से \'चार्ट सेटिंग्स\' में जाकर चार्ट जोड़ें।',
            noDataFound: 'डेटा नहीं मिला। कृपया डेटा अपलोड करें।',
            activeFilters: 'सक्रिय फ़िल्टर:',
            clearAll: 'सभी साफ़ करें',
            dataRecords: 'डेटा रिकॉर्ड्स',
            loadingData: 'डेटा लोड हो रहा है...'
        },
        charts: {
            delete: 'चार्ट हटाएं',
            aiAdvice: 'AI सलाह लें',
            download: 'चार्ट डाउनलोड करें',
            edit: 'चार्ट संपादित करें',
            freeze: 'चार्ट फ्रीज करें',
            unfreeze: 'चार्ट अनफ्रीज करें',
            pin: 'चार्ट पिन करें',
            unpin: 'चार्ट अनपिन करें',
            filterByColumn: 'कॉलम के अनुसार फ़िल्टर करें',
            filterChartData: 'चार्ट डेटा फ़िल्टर',
            rowLimit: 'पंक्तियों की सीमा',
            allRows: 'सभी (All Rows)',
            first10: 'पहले 10 रिकॉर्ड',
            first25: 'पहले 25 रिकॉर्ड',
            first50: 'पहले 50 रिकॉर्ड',
            first100: 'पहले 100 रिकॉर्ड',
            first250: 'पहले 250 रिकॉर्ड',
            first500: 'पहले 500 रिकॉर्ड',
            first1000: 'पहले 1000 रिकॉर्ड',
            saveSnapshot: 'स्नैपशॉट सहेजें',
            fullscreen: 'फुलस्क्रीन',
            moreOptions: 'अधिक विकल्प',
            editPermissions: 'बटन अनुमतियाँ संपादित करें',
            zoom: 'ज़ूम करें',
            pan: 'पैन करें',
            resetAxes: 'अक्ष रीसेट करें',
            filterApplied: 'चार्ट के लिए फ़िल्टर लागू किया गया',
            filterError: 'फ़िल्टर लागू करने में त्रुटि',
            allPlotsError: 'सभी चार्ट्स प्लॉट करने में त्रुटि',
            updatingData: 'डेटा अपडेट हो रहा है...',
            confirmDelete: 'क्या आप वाकई इस चार्ट को हटाना चाहते हैं?'
        },
        kpi: {
            layoutSettings: 'KPI लेआउट सेटिंग्स',
            editKpi: 'KPI संपादित करें',
            deleteKpi: 'KPI हटाएं',
            typography: 'टेक्स्ट',
            chart: 'चार्ट',
            position: 'स्थिति',
            titleSize: 'शीर्षक आकार',
            valueSize: 'मान आकार',
            textAlign: 'टेक्स्ट संरेखण',
            left: 'बाएं',
            center: 'मध्य',
            right: 'दाएं',
            chartStyle: 'चार्ट शैली',
            line: 'रेखा',
            area: 'एरिया',
            bar: 'बार',
            pie: 'पाई',
            doughnut: 'डोनट',
            polar: 'ध्रुवीय',
            radar: 'रडार',
            width: 'चौड़ाई',
            height: 'ऊंचाई',
            basePosition: 'मूल स्थिति',
            bottom: 'नीचे',
            background: 'बैकग्राउंड',
            custom: 'फ्री ड्रैग',
            textPosition: 'टेक्स्ट स्थिति',
            standard: 'मानक',
            textX: 'टेक्स्ट X',
            textY: 'टेक्स्ट Y',
            chartX: 'चार्ट X',
            chartY: 'चार्ट Y',
            dragTip: 'कार्ड पर सीधे ड्रैग-एंड-ड्रॉप भी कर सकते हैं!',
            close: 'बंद करें',
            confirmDelete: 'क्या आप वाकई इस KPI कार्ड को हटाना चाहते हैं?',
            totalRows: 'कुल पंक्तियाँ',
            filteredActive: 'फ़िल्टर्ड डेटा सक्रिय',
            fullDataLoaded: 'पूरा डेटा लोड है',
            progressStats: 'साप्ताहिक/मासिक प्रगति सांख्यिकी',
            activeCharts: 'सक्रिय चार्ट्स',
            totalVisualizations: 'कुल दृश्य विज़ुअलाइज़ेशन',
            aiQueries: 'AI प्रश्न उपयोग',
            aiQueriesSubtitle: 'इंटरेक्टिव AI चैट असिस्टेंट क्वेरी',
            keyMetric: 'मुख्य मीट्रिक',
            totalOf: 'कुल',
            uniqueOf: 'अद्वितीय'
        }
    },

    // ==========================================
    // 🇮🇳 GUJARATI (gu)
    // ==========================================
    gu: {
        common: {
            save: 'સાચવો (Save)',
            cancel: 'રદ કરો (Cancel)',
            close: 'બંધ કરો (Close)',
            apply: 'લાગુ કરો (Apply)',
            delete: 'કાઢી નાખો (Delete)',
            edit: 'સંપાદિત કરો (Edit)',
            reset: 'રીસેટ (Reset)',
            back: 'પાછળ (Back)',
            next: 'આગળ (Next)',
            prev: 'અગાઉનું (Previous)',
            finish: 'સમાપ્ત (Finish)',
            search: 'શોધો (Search)',
            searchPlaceholder: 'શોધવા માટે લખો...',
            loading: 'લોડ થઈ રહ્યું છે...',
            success: 'સફળતા',
            error: 'ભૂલ',
            warning: 'ચેતવણી',
            info: 'માહિતી',
            confirm: 'પુષ્ટિ કરો',
            clear: 'સાફ કરો',
            download: 'ડાઉનલોડ કરો',
            upload: 'અપલોડ કરો',
            export: 'એક્સપોર્ટ કરો',
            import: 'ઈમ્પોર્ટ કરો',
            preview: 'પૂર્વાવલોકન',
            refresh: 'રીફ્રેશ કરો',
            settings: 'સેટિંગ્સ',
            language: 'ભાષા',
            theme: 'થીમ',
            darkMode: 'ડાર્ક મોડ',
            lightMode: 'લાઇટ મોડ',
            fullscreen: 'પૂર્ણ સ્ક્રીન',
            exitFullscreen: 'પૂર્ણ સ્ક્રીન બંધ કરો',
            overview: 'ઝાંખી (Overview)',
            actions: 'ક્રિયાઓ',
            help: 'મદદ',
            undo: 'પાછું વાળો (Undo)',
            redo: 'ફરીથી કરો (Redo)'
        },
        commandPalette: {
            title: 'કમાન્ડ પેલેટ (Spotlight Search)',
            searchPlaceholder: 'કમાન્ડ, સાધનો, ચાર્ટ અથવા શોર્ટકટ શોધો (Ctrl+K)...',
            noResults: 'કોઈ મેળ ખાતો કમાન્ડ મળ્યો નથી.',
            navigateHint: 'નેવિગેટ કરો',
            selectHint: 'પસંદ કરો',
            closeHint: 'બંધ કરો',
            tourName: '💡 ટ્યુટોરીયલ પ્રવાસ શરૂ કરો (Start Guided Tour)',
            tourDesc: 'ડેશબોર્ડના તમામ ફિચર્સનું સ્ટેપ-બાય-સ્ટેપ માર્ગદર્શન જુઓ',
            themeToggleName: '🌗 થીમ બદલો (Toggle Theme Mode)',
            themeToggleDesc: 'ડાર્ક અને લાઇટ થીમ વચ્ચે સ્વિચ કરો',
            presentationName: '💻 પ્રેઝન્ટેશન મોડ શરૂ કરો (Start Presentation Mode)',
            presentationDesc: 'લેસર પોઇન્ટર સાથે પૂર્ણ સ્ક્રીન પર સ્લાઇડ શો શરૂ કરો',
            audioNarratorName: '🎙️ ઓડિયો સારાંશ સાંભળો (Play Audio Briefing)',
            audioNarratorDesc: 'ડેશબોર્ડ અને KPI મેટ્રિક્સનો બોલતો સારાંશ સાંભળો',
            statsName: '📊 ડેટા આંકડાશાસ્ત્ર જુઓ (View Data Statistics)',
            statsDesc: 'અપલોડ કરેલા ડેટાના મુખ્ય આંકડા અને સારાંશ તપાસો',
            addRecordName: '➕ નવો રેકોર્ડ ઉમેરો (Add New Data Record)',
            addRecordDesc: 'ડેટાસેટમાં નવી કસ્ટમ લાઇન ઉમેરો',
            dataAuditName: '🛡️ ડેટા ગુણવત્તા ઓડિટ કરો (Run Data Quality Audit)',
            dataAuditDesc: 'ડેટામાં રહેલી ભૂલો, શૂન્ય મૂલ્યો અને ક્ષતિઓની તપાસ કરો',
            exportPdfName: '📄 એક્ઝિક્યુટિવ PDF રિપોર્ટ ડાઉનલોડ કરો (Export PDF)',
            exportPdfDesc: 'ડેશબોર્ડને પ્રિન્ટ કરવા યોગ્ય PDF સ્વરૂપમાં ડાઉનલોડ કરો',
            exportPngName: '🖼️ સમગ્ર ડેશબોર્ડની PNG ઇમેજ લો (Snapshot)',
            exportPngDesc: 'ડેશબોર્ડનો હાઇ-રિઝોલ્યુશન સ્ક્રીનશોટ ડાઉનલોડ કરો',
            downloadTemplateName: '📥 એક્સેલ ટેમ્પલેટ ડાઉનલોડ કરો (Download Excel Template)',
            downloadTemplateDesc: 'ડિફોલ્ટ ડેટા ફોર્મેટ સાથે એક્સેલ સ્પ્રેડશીટ મેળવો',
            addChartName: '📈 નવો ચાર્ટ ઉમેરો (Open Chart Designer)',
            addChartDesc: 'ધરી (Axes) પસંદ કરીને ડેશબોર્ડમાં નવો ચાર્ટ બનાવો',
            addKpiName: '⭐ KPI કાર્ડ બનાવો (Open KPI Builder)',
            addKpiDesc: 'લાઇવ સ્પાર્કલાઇન સાથે મુખ્ય પ્રદર્શન કાર્ડ્સ ડિઝાઇન કરો',
            filtersName: '⏳ ફિલ્ટર અને સૉર્ટ પેનલ ખોલો (Open Filters Panel)',
            filtersDesc: 'ડેટા સૉર્ટિંગ અને કસ્ટમ ફિલ્ટરિંગ માટે પેનલ ખોલો',
            chatAiName: '🤖 AI ચેટ સહાયક ખોલો (Open AI Chat)',
            chatAiDesc: 'તમારા ડેટા વિશે પ્રશ્નો પૂછો અથવા આપમેળે ચાર્ટ બનાવડાવો'
        },
        presentation: {
            liveShowTitle: '💻 લાઇવ શો (LIVE SHOW)',
            overview: 'ઝાંખી (Overview)',
            timerTitle: 'ક્લિક કરો: રીસેટ | ટાઈમર (Stopwatch / Click to reset)',
            timerResetToast: '⏱️ પ્રેઝન્ટેશન ટાઈમર ફરી શરૂ થયું.',
            prevChart: 'અગાઉની સ્લાઇડ (Prev Chart)',
            nextChart: 'આગલી સ્લાઇડ (Next Chart)',
            autoPlayPause: 'આપોઆપ ચલાવો (Auto Play / Pause)',
            autoPlayStarted: '⏱️ આપમેળે સ્લાઇડ શો સક્રિય: દર 6 સેકન્ડે સ્લાઇડ બદલાશે.',
            laserPointer: 'ડિજિટલ લેસર પોઇન્ટર (Toggle Laser Pointer)',
            penAnnotation: 'લાઇવ ડ્રોઇંગ પેન (Draw / Annotation Mode)',
            penModeActive: '✏️ પેન મોડ સક્રિય: સ્ક્રીન પર ડ્રો કરવા માટે ક્લિક કરી ખેંચો.',
            clearAnnotation: 'બધા નિશાન સાફ કરો (Clear Annotation)',
            clearAnnotationToast: '✨ તમામ ડ્રોઇંગ અને નિશાનો સાફ કરવામાં આવ્યા.',
            speechControl: 'સ્માર્ટ વોઇસ રીમોટ - "આગળ/Next" બોલો (Hands-free Voice Control)',
            speechNotSupported: '🎙️ વોઇસ મોડ ઉપલબ્ધ નથી (આ બ્રાઉઝર Speech Recognition ને સપોર્ટ કરતું નથી).',
            speechPermDenied: '🎙️ માઇક્રોફોન પરવાનગી મળી નથી અથવા સેવા અનુપલબ્ધ છે.',
            speechActiveToast: '🎤 વોઇસ રીમોટ ચાલુ! આદેશ આપો: "આગળ", "પાછળ", "લેસર", "સાફ".',
            speechDeactivated: '🎤 વોઇસ મોડ બંધ થયો.',
            speechCmdNext: '🎙️ વોઇસ આદેશ: આગલી સ્લાઇડ',
            speechCmdPrev: '🎙️ વોઇસ આદેશ: અગાઉની સ્લાઇડ',
            speechCmdLaser: '🎙️ વોઇસ આદેશ: લેસર ટૉગલ',
            simulateRefresh: 'ડેટા રીફ્રેશ સિમ્યુલેશન (Simulate Live Data Refresh)',
            refreshSimulatedToast: '🔄 લાઇવ રીફ્રેશ સિમ્યુલેશન પૂર્ણ થયું!',
            exitPresentation: 'પ્રેઝન્ટેશન સમાપ્ત કરો (Exit - ESC)',
            presentationEndedToast: 'પ્રેઝન્ટેશન મોડ સમાપ્ત થયો.',
            presentationActiveToast: '💻 પ્રેઝન્ટેશન મોડ સક્રિય! પેન માટે (P), લેસર માટે (L), વોઇસ માટે (V) દબાવો.',
            colorRed: 'લાલ (Red)',
            colorYellow: 'પીળો (Yellow)',
            colorCyan: 'વાદળી (Cyan)',
            colorGreen: 'લીલો (Green)'
        },
        guidedTour: {
            welcomeTitle: '🌟 વેદ્રા BI માં આપનું સ્વાગત છે!',
            welcomeBadge: 'પરિચય (Overview)',
            welcomeContent: 'આ એક આધુનિક <b>નેક્સ્ટ-જનન બિઝનેસ ઇન્ટેલિજન્સ અને ડેટા વિઝ્યુલાઇઝેશન પ્લેટફોર્મ</b> છે. અહીં તમે તમારા ડેટાને મિનિટોમાં 3D ચાર્ટ્સ, KPI કાર્ડ્સ અને AI ઇનસાઇટ્સમાં ફેરવી શકો છો.',
            dataLoadTitle: '📁 ડેટા અપલોડ અને લાઇવ એક્સેલ ગ્રીડ',
            dataLoadBadge: 'ડેટા વ્યવસ્થાપન (Data)',
            dataLoadContent: 'અહીંથી <b>Excel (.xlsx), CSV અથવા JSON</b> ફાઇલો અપલોડ કરો. "Edit Data" બટન દબાવીને એક્સેલની જેમ સેલ્સ, નવી રો અને ફોર્મ્યુલા સીધા જ એડિટ કરો.',
            chartStudioTitle: '📊 3D અને મલ્ટી-અક્ષ ચાર્ટ સ્ટુડિયો',
            chartStudioBadge: 'ચાર્ટ ડિઝાઇનર (Charts)',
            chartStudioContent: 'કૉલમ ડ્રેગ અને ડ્રોપ કરીને તરત જ ચાર્ટ બનાવો. <b>3D Bar/Line, Sankey, Heatmap, Waterfall, Candlestick, Radar, Funnel અને Boxplot</b> સહિત 30+ ચાર્ટ પ્રકારોનો આનંદ લો.',
            kpiSparklineTitle: '🎯 ઇન્ટરેક્ટિવ KPI અને સ્પાર્કલાઇન્સ',
            kpiSparklineBadge: 'મુખ્ય મેટ્રિક્સ (KPI)',
            kpiSparklineContent: 'તમારા મહત્વપૂર્ણ મેટ્રિક્સ માટે લાઇવ સ્પાર્કલાઇન ગ્રાફ સાથે <b>KPI કાર્ડ્સ</b> બનાવો. તેમના ફોન્ટ, ગોઠવણી અને ગ્રેડિયન્ટ સ્ટાઇલ જાતે સેટ કરો.',
            lttbSamplingTitle: '⚡ ગ્લોબલ ફિલ્ટર્સ અને LTTB હાઇ-સ્પીડ સેમ્પલિંગ',
            lttbBadge: 'કાર્યક્ષમતા (Performance)',
            lttbSamplingBadge: 'કાર્યક્ષમતા અને ફિલ્ટર્સ (Performance)',
            lttbSamplingContent: 'લાખો રેકોર્ડ્સને અટક્યા વિના સેકન્ડોમાં પ્રદર્શિત કરવા માટે <b>LTTB Downsampling Slider</b> નો ઉપયોગ કરો. તમે ચોક્કસ સ્પાઇક્સ પણ પસંદ કરી શકો છો!',
            annotationsTitle: '📌 ડેટા પોઇન્ટ પિન અને કૉલઆઉટ એનોટેશન્સ',
            annotationsBadge: 'કૉલઆઉટ્સ (Annotations)',
            annotationsContent: 'ચાર્ટના કોઈપણ બાર અથવા લાઇન પોઇન્ટ પર <b>ક્લિક</b> કરીને તમે તે બિંદુ પર તમારી કસ્ટમ નોંધ અથવા બિઝનેસ એલર્ટ પિન કરી શકો છો.',
            thresholdAlertsTitle: '🚨 થ્રેશોલ્ડ અને ડેન્જર ઝોન એલર્ટ્સ',
            thresholdAlertsBadge: 'લાઇવ એલર્ટ (Alerts)',
            thresholdAlertsContent: 'ચાર્ટ સેટિંગ્સમાં ન્યૂનતમ અથવા મહત્તમ મર્યાદા સેટ કરો. જો ડેટા જોખમ ક્ષેત્રને પાર કરે છે તો ડેશબોર્ડ લાલ ચેતવણી પ્રકાશિત કરે છે.',
            themeStylesTitle: '🎨 થીમ્સ, ડાર્ક મોડ અને કલર પેલેટ્સ',
            themeStylesBadge: 'સ્ટાઇલિંગ (Theme)',
            themeStylesContent: 'એક ક્લિકમાં <b>ડાર્ક મોડ</b> અથવા લાઇટ મોડ સ્વિચ કરો, ફોન્ટ ફેમિલી અને આકર્ષક કલર પેલેટ સમગ્ર ડેશબોર્ડ પર લાગુ કરો.',
            aiNarratorTitle: '🎙️ AI ઓડિયો નેરેટર અને સ્લાઇડશો મોડ',
            aiNarratorBadge: 'AI અને શોકેસ (AI Showcase)',
            aiNarratorContent: '<b>"Audio Brief"</b> બટન દબાવીને તમારા ડેશબોર્ડનો AI અવાજમાં સારાંશ સાંભળો, અથવા મીટિંગ્સમાં <b>"Slideshow"</b> મોડ ચાલુ કરો.',
            floatingFabTitle: '🕹️ ફ્લોટિંગ ક્વિક પેલેટ (FAB)',
            floatingFabBadge: 'ક્વિક ટૂલ્સ (FAB)',
            floatingFabContent: 'આ <b>ક્વિક પેલેટ</b> તમને તરત ડેટા ઉમેરવા, ઓટો-ગ્રીડ ગોઠવવા અને કમાન્ડ પેલેટ (Ctrl+K) ખોલવાની સુવિધા આપે છે.',
            exportReportsTitle: '📥 એક્ઝિક્યુટિવ PDF / PNG રિપોર્ટ એક્સપોર્ટ',
            exportReportsBadge: 'એક્સપોર્ટ (Export)',
            exportReportsContent: 'તૈયાર ડેશબોર્ડને પ્રિન્ટ-રેડી <b>PDF રિપોર્ટ</b>, હાઇ-રિઝોલ્યુશન <b>PNG ઇમેજ</b>, અથવા ફિલ્ટર કરેલી CSV ફાઇલ તરીકે ડાઉનલોડ કરો.',
            stepCounter: 'પગલું',
            skipTour: 'પ્રવાસ છોડો (Skip)',
            prevStep: 'પાછળ (Back)',
            nextStep: 'આગળ (Next)',
            finishTour: 'શરૂ કરો 🎉',
            tourCompletedToast: '🎉 ટ્યુટોરીયલ પ્રવાસ પૂર્ણ થયો! વેદ્રા BI માં આપનું સ્વાગત છે.'
        },
        savedViews: {
            galleryTitle: 'સાચવેલા દ્રશ્યોની ગેલેરી (Saved Views Gallery)',
            gallerySubtitle: 'કેપ્ચર કરેલા ચાર્ટ સ્નેપશોટ અને ફિલ્ટર કરેલી વિઝ્યુલાઇઝેશન સ્થિતિઓ',
            noSnapshotsTitle: 'કોઈ સ્નેપશોટ ઉપલબ્ધ નથી',
            noSnapshotsDesc: 'કોઈપણ ચાર્ટ કાર્ડ પર 📸 બટન પર ક્લિક કરીને સ્નેપશોટ સાચવો.',
            searchPlaceholder: 'સ્નેપશોટ શોધો...',
            applyViewBtn: 'દ્રશ્ય લાગુ કરો',
            deleteAllBtn: 'બધા સ્નેપશોટ કાઢી નાખો',
            deleteSingleBtn: 'કાઢી નાખો',
            confirmDeleteAll: 'શું તમે ખરેખર બધા સાચવેલા સ્નેપશોટ કાઢી નાખવા માંગો છો?',
            snapshotSavedToast: '📸 સ્નેપશોટ સફળતાપૂર્વક ગેલેરીમાં સાચવવામાં આવ્યો!',
            snapshotAppliedToast: '✅ સાચવેલ દ્રશ્ય ડેશબોર્ડ પર લાગુ કરવામાં આવ્યું!',
            snapshotDeletedToast: 'સ્નેપશોટ કાઢી નાખવામાં આવ્યો.',
            allSnapshotsDeletedToast: 'તમામ સ્નેપશોટ કાઢી નાખવામાં આવ્યા.',
            configNotFound: 'ચાર્ટ રૂપરેખાંકન મળ્યું નથી!',
            unnamedChart: 'અનામી ચાર્ટ',
            noThumbnail: 'થંબનેલ ઇમેજ ઉપલબ્ધ નથી'
        },
        floatingFab: {
            paletteTitle: 'ઝડપી સાધનો પેલેટ (Quick Palette)',
            toolsBadge: '12 સાધનો',
            dragHint: 'બટનને ડ્રેગ કરીને ખસેડો',
            escHint: 'Esc થી બંધ કરો',
            mainBtnTitle: 'ઝડપી મેનુ પેલેટ (ખેંચો અને છોડો)',
            toolUpload: 'ડેટા અપલોડ',
            toolUploadDesc: 'Excel અથવા CSV ડેટા ફાઇલ અપલોડ કરો',
            toolAddChart: 'નવો ચાર્ટ',
            toolAddChartDesc: 'નવો ચાર્ટ ઉમેરો',
            toolLttb: 'LTTB સેમ્પલ્સ',
            toolLttbDesc: 'LTTB સેમ્પલિંગ અને કસ્ટમ પોઇન્ટ્સ પસંદ કરો',
            toolFilter: 'ફિલ્ટર / સૉર્ટ',
            toolFilterDesc: 'ડેટા ફિલ્ટર અને સૉર્ટ પેનલ ખોલો',
            toolStats: 'ડેટા આંકડા',
            toolStatsDesc: 'ડેટા સારાંશ અને આંકડાશાસ્ત્ર',
            toolAiChat: 'AI સહાયક',
            toolAiChatDesc: 'AI ચેટ સહાયકને પૂછો',
            toolAudio: 'ઓડિયો બ્રીફ',
            toolAudioDesc: 'ડેશબોર્ડનો ઓડિયો સારાંશ સાંભળો',
            toolPresent: 'પ્રેઝન્ટેશન',
            toolPresentDesc: 'પૂર્ણસ્ક્રીન પ્રેઝન્ટેશન મોડ ચલાવો',
            toolAutoGrid: 'ઓટો ગ્રીડ',
            toolAutoGridDesc: 'ચાર્ટ્સને ગ્રીડમાં આપમેળે ગોઠવો',
            toolLock: 'લૉક ડેશબોર્ડ',
            toolLockDesc: 'ડ્રેગ અને રિસાઇઝ લૉક/અનલૉક કરો',
            toolExport: 'રિપોર્ટ એક્સપોર્ટ',
            toolExportDesc: 'PDF / PNG રિપોર્ટ ડાઉનલોડ કરો',
            toolTheme: 'થીમ બદલો',
            toolThemeDesc: 'લાઇટ / ડાર્ક થીમ બદલો'
        },
        comparisonView: {
            btnOn: 'તુલના મોડ ON',
            btnOff: 'તુલના મોડ',
            barTitle: 'તુલનાત્મક વિશ્લેષણ (Comparison Mode)',
            barSubtitle: 'એક જ મેટ્રિક માટે બે અલગ-અલગ સમયગાળાની સામસામે સરખામણી કરો',
            closeBarTitle: 'તુલના મોડ બંધ કરો',
            periodALabel: 'સમયગાળો A (Period A - પ્રથમ ભાગ):',
            periodBLabel: 'સમયગાળો B (Period B - સરખામણી ભાગ):',
            fromLabel: 'થી',
            toLabel: 'સુધી',
            vsLabel: 'VS',
            presetLast7Days: 'છેલ્લા 7 દિવસ વિરુદ્ધ અગાઉના 7 દિવસ',
            presetLast30Days: 'છેલ્લા 30 દિવસ વિરુદ્ધ અગાઉના 30 દિવસ',
            presetThisMonthVsLast: 'આ મહિનો વિરુદ્ધ ગયેલ મહિનો',
            activeToast: '🆚 તુલના મોડ સક્રિય: બે સમયગાળાની સામસામે સરખામણી કરો',
            restoredToast: 'સામાન્ય વિઝ્યુલાઇઝેશન વ્યૂ પર પાછા ફર્યા'
        },
        welcomeModal: {
            onboardingCompleteBadge: 'ઑનબોર્ડિંગ પૂર્ણ',
            welcomeHeader: 'વેદ્રા BI માં આપનું સ્વાગત છે!',
            welcomeSubtitle: 'તમારું કસ્ટમાઇઝ્ડ બિઝનેસ એનાલિટિક્સ ડેશબોર્ડ તૈયાર છે.',
            preferencesTitle: 'તમારી પસંદ કરેલી પ્રાથમિકતાઓ (Configured Preferences)',
            editPreferences: 'બદલો',
            langLabel: 'ભાષા',
            roleLabel: 'વ્યાપારિક ભૂમિકા',
            goalsLabel: 'મુખ્ય લક્ષ્યો',
            dataSourceLabel: 'ડેટા સ્ત્રોત',
            teamSizeLabel: 'ટીમનું કદ',
            themeLabel: 'થીમ',
            highlightsTitle: 'ડેશબોર્ડની મુખ્ય વિશેષતાઓ (3 ઝડપી પગલાં):',
            feature1Title: 'વિઝ્યુઅલ ચાર્ટ બિલ્ડર',
            feature1Desc: 'કૉલમ ડ્રેગ કરો અને 30+ ઇન્ટરેક્ટિવ ચાર્ટ્સમાં ડેટા જુઓ.',
            feature2Title: 'AI બિઝનેસ એડવાઇઝર',
            feature2Desc: 'સરળ ભાષામાં પ્રશ્નો પૂછો અને તરત જ બિઝનેસ ઇનસાઇટ્સ મેળવો.',
            feature3Title: '1-ક્લિક રિપોર્ટ એક્સપોર્ટ',
            feature3Desc: 'સુંદર PDF અને ફોર્મેટ કરેલા એક્સેલ રિપોર્ટ્સ તરત ડાઉનલોડ કરો.',
            quickStartTitle: 'ડેમો ડેટા સાથે ઝડપી શરૂઆત',
            quickStartSubtitle: 'જો તમારી પાસે હમણાં પોતાની Excel/CSV ફાઇલ ન હોય, તો નમૂનાનો ડેટા લોડ કરો:',
            loadSampleBtn: '🚀 નમૂના ડેટા ઑટો-લોડ કરો',
            uploadFileBtn: '📁 પોતાની ફાઇલ અપલોડ કરો',
            startDashboardBtn: 'ડેશબોર્ડ શરૂ કરો',
            sampleDataSuccessToast: '🚀 નમૂનાનો વેચાણ ડેટા (Sample BI Dataset) સફળતાપૂર્વક લોડ થયો!',
            sampleDataErrorToast: 'નમૂના ડેટા લોડ કરવામાં ભૂલ: '
        },
        editor: {
            mainTitle: 'વિઝ્યુઅલ એનોટેશન અને ટેક્સ્ટબોક્સ એડિટર',
            addTextbox: 'ટેક્સ્ટબોક્સ ઉમેરો',
            editTextbox: 'લખાણ સંપાદિત કરો',
            deleteTextbox: 'બોક્સ કાઢી નાખો',
            fontFamily: 'ફોન્ટ ફેમિલી',
            fontSize: 'ફોન્ટનું કદ',
            textColor: 'લખાણનો રંગ',
            bgColor: 'બેકગ્રાઉન્ડ રંગ',
            textAlign: 'ગોઠવણી (Align)',
            alignLeft: 'ડાબે ગોઠવો',
            alignCenter: 'મધ્યમાં રાખો',
            alignRight: 'જમણે ગોઠવો',
            alignJustify: 'બંને બાજુ ગોઠવો',
            bold: 'ઘાટા (Bold)',
            italic: 'ત્રાંસા (Italic)',
            underline: 'નીચે લીટી (Underline)',
            bringFront: 'આગળ',
            sendBack: 'પાછળ',
            duplicate: 'કૉપી',
            delete: 'કાઢી નાખો',
            lock: 'લૉક',
            unlock: 'અનલૉક',
            rotate: 'ફેરવો',
            resize: 'માપ બદલો',
            createBtn: 'નવું ટેક્સ્ટબોક્સ બનાવો',
            updateBtn: 'ટેક્સ્ટબોક્સ અપડેટ કરો',
            editingBtn: 'સંપાદન ચાલુ છે... (રોકવા માટે ડબલ-ક્લિક કરો)',
            alignSelectMin2: 'ગોઠવણી (Align) માટે કૃપા કરીને ઓછામાં ઓછા 2 બોક્સ પસંદ કરો.',
            distributeSelectMin3: 'સરખી રીતે વહેંચવા (Distribute) માટે ઓછામાં ઓછા 3 બોક્સ પસંદ કરો.',
            copyStyleSelect1: 'સ્ટાઇલ કૉપી કરવા માટે માત્ર એક બોક્સ પસંદ કરો.',
            noFilteredData: 'કોઈ ફિલ્ટર કરેલ ડેટા ઉપલબ્ધ નથી.',
            selectDataRowWarning: 'ઉમેરવા માટે કૃપા કરીને ઓછામાં ઓછી એક ડેટા રો પસંદ કરો.',
            emptyTextbox: '(ખાલી ટેક્સ્ટબોક્સ)',
            noTextboxes: 'કોઈ ટેક્સ્ટબોક્સ હાજર નથી.',
            textboxItem: 'ટેક્સ્ટબોક્સ',
            showMore: 'વધુ જુઓ',
            showLess: 'ઓછું જુઓ',
            snapToGrid: 'ગ્રીડ સાથે જોડો (Snap to Grid)',
            copyStyles: 'સ્ટાઇલ કૉપી કરો',
            pasteStyles: 'સ્ટાઇલ પેસ્ટ કરો',
            templates: 'ટેમ્પલેટ્સ',
            sampleTitleTemplate: 'મુખ્ય ડેશબોર્ડ શીર્ષક',
            sampleNotesTemplate: 'મહત્વપૂર્ણ તારણો અને નોંધો'
        },
        customControls: {
            selectPlaceholder: 'વિકલ્પ પસંદ કરો...',
            noOptionsFound: 'કોઈ વિકલ્પ મળ્યો નથી',
            searchOption: 'વિકલ્પ શોધો...',
            pickColorTitle: 'કલર પેલેટ પીકર',
            customColor: 'કસ્ટમ હેક્સ રંગ',
            palettePresets: 'તૈયાર રંગ પેલેટ્સ',
            saveColor: 'પસંદ કરો (Select)',
            cancelColor: 'રદ કરો'
        },
        dragDrop: {
            snapOn: '📐 સ્નેપ-ટુ-ગ્રીડ (Snap-to-Grid) ચાલુ (20px)',
            snapOff: '🔓 સ્નેપ-ટુ-ગ્રીડ બંધ (ફ્રી-ફોર્મ મોડ)',
            cardsSwapped: '🔄 કાર્ડ્સ પુનઃવ્યવસ્થિત: બંને ચાર્ટના સ્થાનો બદલાયા!',
            layoutSaved: '💾 ડેશબોર્ડ લેઆઉટ અને સેટિંગ્સ સાચવ્યા!',
            autoArranged: '📐 {count} ચાર્ટ કાર્ડ્સ સ્વચ્છ {cols}-કૉલમ ગ્રીડ લેઆઉટમાં ગોઠવાયા!',
            noCardsFound: 'ગ્રીડ વ્યવસ્થા માટે કોઈ ચાર્ટ કાર્ડ્સ મળ્યા નથી!',
            initError: 'ચાર્ટ ડ્રેગ/રીસાઇઝ શરૂ કરવામાં ભૂલ'
        },
        navbar: {
            data: 'ડેટા',
            charts: 'ચાર્ટ્સ',
            kpis: 'KPIs',
            settings: 'સેટિંગ્સ',
            stats: 'આંકડા',
            actions: 'ક્રિયાઓ',
            layouts: 'લેઆઉટ',
            filters: 'ફિલ્ટર્સ',
            dashboard: 'ડેશબોર્ડ',
            formatting: 'ફોર્મેટિંગ',
            effects: 'ઇફેક્ટ્સ',
            textbox: 'ટેક્સ્ટબોક્સ',
            theme: 'થીમ',
            profile: 'પ્રોફાઇલ',
            toggleDashboard: 'ડેશબોર્ડ બતાવો/છુપાવો',
            snapGrid: 'સ્નેપ ગ્રીડ (20px)',
            compare: 'સરખામણી (Compare)',
            savedViews: 'સાચવેલા વ્યૂઝ',
            autoGrid: 'ઓટો ગ્રીડ',
            sampling: 'ડેટા સેમ્પલિંગ (LTTB)',
            slideshow: 'સ્લાઇડશો',
            audioBrief: 'ઓડિયો બ્રીફ',
            searchCtrlK: 'ઝડપી શોધ (Ctrl+K)',
            shortcuts: 'શોર્ટકટ્સ (?)',
            quickTour: 'ઝડપી પ્રવાસ',
            changeLanguage: 'ભાષા બદલો',
            editData: 'ડેટા સંપાદિત કરો',
            addData: 'ડેટા ઉમેરો',
            downloadTemplate: 'ટેમ્પલેટ ડાઉનલોડ',
            export: 'રિપોર્ટ એક્સપોર્ટ',
            exportPdf: 'PDF રિપોર્ટ',
            exportPng: 'PNG કેપ્ચર',
            exportCsv: 'CSV ડેટા',
            autosaved: 'ઓટો-સેવ કરેલ',
            toggleTheme: 'થીમ બદલો',
            langHindi: 'हिन्दी',
            langEnglish: 'English',
            langGujarati: 'ગુજરાતી',
            langSwitchedToast: 'ભાષા સફળતાપૂર્વક ગુજરાતી કરવામાં આવી'
        },
        sidebar: {
            chartDesigner: 'ચાર્ટ ડિઝાઇનર',
            styleFormatting: 'સ્ટાઇલ અને ફોર્મેટિંગ',
            visualEffects: 'વિઝ્યુઅલ ઇફેક્ટ્સ',
            dataSource: 'ડેટા સ્ત્રોત',
            kpiCards: 'KPI મેટ્રિક કાર્ડ્સ',
            dataStatistics: 'ડેટા આંકડાશાસ્ત્ર',
            dashboardView: 'ડેશબોર્ડ વ્યૂ',
            notesAnnotations: 'નોંધો અને વિગત',
            colorThemes: 'કલર થીમ્સ',
            userProfile: 'વપરાશકર્તા પ્રોફાઇલ',
            quickActions: 'ઝડપી ક્રિયાઓ',
            settingsThresholds: 'સેટિંગ્સ અને મર્યાદા',
            filtersSorting: 'ફિલ્ટર્સ અને સૉર્ટિંગ',
            layoutTemplates: 'લેઆઉટ ટેમ્પલેટ્સ',
            quickSearchPlaceholder: 'કંટ્રોલ શોધો...',
            collapseAll: 'બધું સંકેલો',
            expandAll: 'બધું વિસ્તૃત કરો'
        },
        dashboard: {
            visualizations: 'વિઝ્યુલાઇઝેશન (Visualizations)',
            filterColumn: 'ફિલ્ટર કૉલમ:',
            filterValue: 'ફિલ્ટર મૂલ્ય:',
            dates: 'તારીખો:',
            start: 'શરૂ',
            end: 'સમાપ્ત',
            to: 'સુધી',
            apply: 'લાગુ કરો',
            resetFilters: 'ફિલ્ટર રીસેટ કરો',
            none: '-- કોઈ નહીં --',
            all: '-- બધા --',
            noCharts: 'કોઈ ચાર્ટ ઉપલબ્ધ નથી.',
            addChartsHint: 'સાઇડબારમાંથી \'ચાર્ટ સેટિંગ્સ\'માં જઈને ચાર્ટ ઉમેરો.',
            noDataFound: 'ડેટા મળ્યો નથી. કૃપા કરીને ડેટા અપલોડ કરો.',
            activeFilters: 'સક્રિય ફિલ્ટર્સ:',
            clearAll: 'બધું સાફ કરો',
            dataRecords: 'ડેટા રેકોર્ડ્સ',
            loadingData: 'ડેટા લોડ થઈ રહ્યો છે...'
        },
        charts: {
            delete: 'ચાર્ટ કાઢી નાખો',
            aiAdvice: 'AI સલાહ લો',
            download: 'ચાર્ટ ડાઉનલોડ કરો',
            edit: 'ચાર્ટ સંપાદિત કરો',
            freeze: 'ચાર્ટ ફ્રીઝ કરો',
            unfreeze: 'ચાર્ટ અનફ્રીઝ કરો',
            pin: 'ચાર્ટ પિન કરો',
            unpin: 'ચાર્ટ અનપિન કરો',
            filterByColumn: 'કૉલમ અનુસાર ફિલ્ટર કરો',
            filterChartData: 'ચાર્ટ ડેટા ફિલ્ટર',
            rowLimit: 'પંક્તિઓની મર્યાદા',
            allRows: 'બધા (All Rows)',
            first10: 'પહેલા 10 રેકોર્ડ',
            first25: 'પહેલા 25 રેકોર્ડ',
            first50: 'પહેલા 50 રેકોર્ડ',
            first100: 'પહેલા 100 રેકોર્ડ',
            first250: 'પહેલા 250 રેકોર્ડ',
            first500: 'પહેલા 500 રેકોર્ડ',
            first1000: 'પહેલા 1000 રેકોર્ડ',
            saveSnapshot: 'સ્નેપશોટ સાચવો',
            fullscreen: 'પૂર્ણસ્ક્રીન',
            moreOptions: 'વધુ વિકલ્પો',
            editPermissions: 'બટન પરવાનગીઓ સંપાદિત કરો',
            zoom: 'ઝૂમ કરો',
            pan: 'પેન કરો',
            resetAxes: 'અક્ષ રીસેટ કરો',
            filterApplied: 'ચાર્ટ માટે ફિલ્ટર લાગુ કરવામાં આવ્યું',
            filterError: 'ફિલ્ટર લાગુ કરવામાં ભૂલ',
            allPlotsError: 'તમામ ચાર્ટ્સ પ્લોટ કરવામાં ભૂલ',
            updatingData: 'ડેટા અપડેટ થઈ રહ્યો છે...',
            confirmDelete: 'શું તમે ખરેખર આ ચાર્ટ કાઢી નાખવા માંગો છો?'
        },
        kpi: {
            layoutSettings: 'KPI લેઆઉટ સેટિંગ્સ',
            editKpi: 'KPI સંપાદિત કરો',
            deleteKpi: 'KPI કાઢી નાખો',
            typography: 'ટેક્સ્ટ',
            chart: 'ચાર્ટ',
            position: 'સ્થિતિ',
            titleSize: 'શીર્ષક માપ',
            valueSize: 'મૂલ્ય માપ',
            textAlign: 'ટેક્સ્ટ સંરેખણ',
            left: 'ડાબે',
            center: 'મધ્ય',
            right: 'જમણે',
            chartStyle: 'ચાર્ટ શૈલી',
            line: 'રેખા',
            area: 'વિસ્તાર',
            bar: 'બાર',
            pie: 'પાઇ',
            doughnut: 'ડોનટ',
            polar: 'ધ્રુવીય',
            radar: 'રડાર',
            width: 'પહોળાઈ',
            height: 'ઊંચાઈ',
            basePosition: 'મૂળ સ્થિતિ',
            bottom: 'નીચે',
            background: 'બેકગ્રાઉન્ડ',
            custom: 'કસ્ટમ ડ્રેગ',
            textPosition: 'ટેક્સ્ટ સ્થિતિ',
            standard: 'પ્રમાણભૂત',
            textX: 'ટેક્સ્ટ X',
            textY: 'ટેક્સ્ટ Y',
            chartX: 'ચાર્ટ X',
            chartY: 'ચાર્ટ Y',
            dragTip: 'તમે કાર્ડ પર સીધા જ ખેંચી અને મૂકી શકો છો!',
            close: 'બંધ કરો',
            confirmDelete: 'શું તમે ખરેખર આ KPI કાર્ડ કાઢી નાખવા માંગો છો?',
            totalRows: 'કુલ પંક્તિઓ',
            filteredActive: 'ફિલ્ટર કરેલ ડેટા સક્રિય',
            fullDataLoaded: 'સંપૂર્ણ ડેટા લોડ થયો છે',
            progressStats: 'સાપ્તાહિક/માસિક પ્રગતિ આંકડા',
            activeCharts: 'સક્રિય ચાર્ટ્સ',
            totalVisualizations: 'કુલ વિઝ્યુઅલાઈઝેશન',
            aiQueries: 'AI પ્રશ્નો વપરાશ',
            aiQueriesSubtitle: 'ઇન્ટરેક્ટિવ AI ચેટ આસિસ્ટન્ટ પ્રશ્નો',
            keyMetric: 'મુખ્ય મેટ્રિક',
            totalOf: 'કુલ',
            uniqueOf: 'અનન્ય'
        }
    }
};
