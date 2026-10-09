/**
 * Vedra BI Learning Center & Formula Handbook Engine
 * Manages language switching (100% Pure English <-> 100% Pure Hindi),
 * interactive sandbox formula evaluation, search filtering, and theme sync.
 */

export type HandbookLang = 'en' | 'hi';

// Complete translation dictionary ensuring NO English-Hindi mixing
export const HANDBOOK_I18N: Record<HandbookLang, Record<string, string>> = {
    en: {
        // Navigation & Header
        academyTitle: 'Vedra BI Academy',
        academySubtitle: 'Complete Learning Center & Formula Handbook',
        versionBadge: 'v1.2.0 Official Handbook',
        searchPlaceholder: 'Search formulas, charts, features, or shortcuts (Ctrl+K)...',
        clearBtn: 'Clear',
        liveSandboxBtn: 'Live Sandbox',
        editSheetBtn: 'Edit Sheet',
        dashboardBtn: 'Dashboard',

        // Sidebar Navigation
        navGettingStarted: 'Getting Started',
        navOverview: '1. Overview & Architecture',
        navWorkflow: '2. End-to-End Workflow',
        navCoreFormulas: 'Core Formulas (All 15)',
        navFormulasOverview: 'Formulas Master Guide',
        navInteractiveTool: 'Interactive Tool',
        navSandbox: 'Live Formula Sandbox',
        navStepByStep: 'Step-by-Step Learning',
        navDataUpload: '1. Data Ingestion & Upload',
        navSpreadsheet: '2. Spreadsheet Explorer',
        navCharts: '3. Chart Creation (15+ types)',
        navTextboxes: '4. Textboxes & Notes',
        navDashboard: '5. Dashboard Grid Canvas',
        navMenuGuide: '6. Menu & Icon Guide',
        navSecurity: '7. Security & Exports',

        // Hero Banner
        heroBadge: 'Official Learning Portal & Technical Reference',
        heroTitle: 'Vedra BI Learning Center & Complete Formula Handbook',
        heroDesc: 'Master every dimension of Vedra BI: multi-format data ingestion (CSV/Excel/JSON), in-memory spreadsheet editing, 15+ visual chart types, rich text commentary, drag-and-drop dashboard layouts, icon-only navigation, and all 15 dynamic card formulas.',
        heroBtnFormulas: 'Explore 15 Formulas',
        heroBtnSandbox: 'Launch Live Sandbox',
        heroBtnWorkflow: 'View Complete Workflow',
        quickFactsTitle: 'Quick System Facts',
        factFormulasLabel: 'Formulas:',
        factFormulasVal: '15 Dynamic Functions',
        factChartsLabel: 'Chart Types:',
        factChartsVal: '15+ Visual Types',
        factSpeedLabel: 'Data Engine:',
        factSpeedVal: 'DuckDB 60 FPS OLAP',
        factSecurityLabel: 'Security:',
        factSecurityVal: '8-Digit PIN Guard',

        // Section 1: Overview
        sec1Title: '1. Platform Overview & Architectural Pillars',
        sec1Intro: 'Vedra BI is an enterprise-grade analytics and visualization platform built with a local-first philosophy. Powered by an embedded in-memory DuckDB OLAP engine and Apache Arrow columnar binary IPC, it processes hundreds of thousands of records at 60 FPS directly in the browser with zero server roundtrips.',
        pillar1Title: 'Reactive Grid Engine',
        pillar1Desc: 'Editing any cell inside the spreadsheet immediately pushes reactive updates to all bound KPI cards, charts, and computed formulas with zero page reloads.',
        pillar2Title: 'Excel-Grade Formulas',
        pillar2Desc: 'Leverage 15 dynamic formulas like SUM, GROWTH, STATUS, and FORMAT to create responsive, calculated executive KPI cards identical to modern financial models.',
        pillar3Title: 'Enterprise Security',
        pillar3Desc: 'Hardened with an 8-digit security PIN, automatic 30-minute inactivity lockout, and local encrypted session persistence for complete data privacy.',

        // Section 2: Workflow
        sec2Title: '2. End-to-End Workflow: From Raw Data to Executive Report',
        sec2Intro: 'Follow these six production-grade steps to transform raw files into interactive executive intelligence:',
        step1Title: 'Data Ingestion & Schema Detection',
        step1Desc: 'Drag and drop CSV, multi-sheet Excel (.xlsx/.xls), JSON payloads, or paste a live Google Sheets web CSV URL. The system automatically detects delimiters, headers, and column types.',
        step2Title: 'Spreadsheet Exploration & In-Place Editing',
        step2Desc: 'Open the spreadsheet grid (edit_data.html) to inspect rows, double-click any cell to modify values inline, add rows, sort columns, and review cell addresses (A1, B4).',
        step3Title: 'Visual Analytics & Chart Creation',
        step3Desc: 'Choose from 15+ visualization types (Bar, Line, Area, Pie, Donut, Scatter, Radar, Heatmap, Funnel, Gauge). Configure categorical dimensions, numerical metrics, and aggregations.',
        step4Title: 'KPI Cards & Formula Binding',
        step4Desc: 'Select modern KPI cards from the template gallery and bind formulas like =SUM(Sales, R, "Total: ") or =GROWTH(B4, B3, R, "MoM: ") to create live metrics.',
        step5Title: 'Narrative Textboxes & Rich Commentary',
        step5Desc: 'Use the embedded Quill WYSIWYG editor to document business context, executive takeaways, bullet points, and dynamic formula references within floating textboxes.',
        step6Title: 'Layout Optimization, Filtering & Export',
        step6Desc: 'Align cards with snap-to-grid (Ctrl+G), activate split comparison mode, apply global slicers, and download high-resolution PNG captures or branded PDF executive reports.',

        // Section 3: 15 Formulas
        sec3Title: '3. Master Technical Guide: All 15 Dynamic Formulas',
        sec3Subtitle: 'Exhaustive reference for every formula: exact syntax, parameter breakdown, business usage, and 1-click copy capability.',
        dirNoticeTitle: 'Direction Parameter Explanation (R vs. L):',
        dirNoticeR: 'R (Right): Displays the computed numerical value to the RIGHT of your label (e.g., "Revenue: $45,000").',
        dirNoticeL: 'L (Left): Displays the computed numerical value to the LEFT of your label (e.g., "$45,000 Revenue").',

        // Sandbox Section
        sandboxTitle: '4. Live Interactive Formula Sandbox',
        sandboxSubtitle: 'Select a preset or type a custom formula below. You can also modify numbers in the sample data table to test instant recalculation.',
        tableRegion: 'Region',
        tableQ1: 'Q1 Sales',
        tableQ2: 'Q2 Sales',
        tableExp: 'Expenses',
        tableTarget: 'Target',
        tableStatus: 'Status',
        presetLabel: 'Choose Formula Preset:',
        inputPlaceholder: 'Enter formula, e.g., =SUM(B, R, "Q1 Total: $")',
        runBtn: 'Evaluate / Run',
        resultHeader: 'Calculated Live Output',
        descHeader: 'Evaluation Mechanics & Logic',

        // Section 5: Data Upload Guide
        secDataTitle: '5. Detailed Guide: Data Ingestion & DuckDB OLAP Engine',
        secDataIntro: 'Vedra BI provides resilient ingestion pipelines for structured and semi-structured business datasets:',
        csvUploadTitle: '1. CSV Ingestion (Drag & Drop)',
        csvUploadDesc: 'Drop any comma, semicolon, or tab-delimited file directly into the application. Automatic delimiter detection handles varied regional formatting seamlessly.',
        excelUploadTitle: '2. Excel Workbooks (.xlsx / .xls)',
        excelUploadDesc: 'Upload multi-sheet spreadsheets with full sheet selection support. Headers and typed values are parsed without requiring cloud processing.',
        jsonUploadTitle: '3. JSON & REST API Payloads',
        jsonUploadDesc: 'Paste or upload nested JSON arrays. The built-in flattening engine converts structured hierarchies into flat, analytical columnar tables.',
        gSheetsUploadTitle: '4. Google Sheets & Live Web URLs',
        gSheetsUploadDesc: 'Connect published Google Sheets CSV links or live HTTP data feeds for continuous dashboard synchronization.',
        duckdbCalloutTitle: 'DuckDB In-Memory OLAP Performance:',
        duckdbCalloutDesc: 'By utilizing WebAssembly and Apache Arrow columnar vectors, Vedra BI executes multi-dimensional analytical queries on 500,000+ rows in milliseconds, ensuring a fluid 60 FPS user experience.',

        // Section 6: Spreadsheet Guide
        secSheetTitle: '6. Detailed Guide: Spreadsheet Grid & Reactive Editing',
        secSheetIntro: 'The dedicated spreadsheet module (edit_data.html) provides an Excel-grade tabular interface for full data governance:',
        sheetFeature1Title: 'Double-Click Inline Editing',
        sheetFeature1Desc: 'Double-click any cell to enter edit mode, type updated numbers or text, and press Enter. All downstream visualizations update instantaneously.',
        sheetFeature2Title: 'Row & Column Operations',
        sheetFeature2Desc: 'Add new rows (+Add Row), rename column headers, adjust data types (Number, Date, Text), and safely remove obsolete entries.',
        sheetFeature3Title: 'Multi-Column Sorting & Search',
        sheetFeature3Desc: 'Click column headers to sort ascending (A-Z) or descending (Z-A), or use the instant regex search box to pinpoint records.',

        // Section 7: Chart Types
        secChartTitle: '7. Detailed Guide: Chart Creation & Visual Taxonomy',
        secChartIntro: 'Click the Charts icon in the main vertical sidebar to configure any of the 15+ analytical chart engines:',
        chartBarTitle: 'Bar & Column Charts',
        chartBarDesc: 'Compare categorical dimensions such as sales by department, regional volume, or product line revenues.',
        chartLineTitle: 'Line & Area Charts',
        chartLineDesc: 'Analyze chronological trends over time, tracking continuous metrics like monthly revenue and rolling averages.',
        chartPieTitle: 'Pie & Donut Charts',
        chartPieDesc: 'Display proportional distribution, market share percentages, and categorical part-to-whole splits.',
        chartScatterTitle: 'Scatter & Bubble Charts',
        chartScatterDesc: 'Plot two or three independent continuous variables to discover correlations, clusters, and statistical outliers.',
        chartRadarTitle: 'Radar Charts',
        chartRadarDesc: 'Evaluate multi-dimensional performance attributes across departments, products, or employee competency profiles.',
        chartHeatmapTitle: 'Heatmap Matrix',
        chartHeatmapDesc: 'Visualize density, activity intensity, and transaction volumes across day-of-week and hour-of-day matrices.',
        chartGaugeTitle: 'Gauge & Meter Charts',
        chartGaugeDesc: 'Display progress toward KPI targets on a 0–100% scale resembling an automotive speedometer dial.',
        chartFunnelTitle: 'Funnel & Treemap Charts',
        chartFunnelDesc: 'Examine conversion drop-offs along sales pipelines, or visualize hierarchical asset breakdowns with nested rectangular tiles.',
        chartStepsTitle: 'Three Steps to Build Any Chart:',
        chartStep1: '1. Select Dimension (X-Axis): Choose the categorical column to group records by (e.g., Region, Month).',
        chartStep2: '2. Select Metric (Y-Axis): Choose the numerical column to compute (e.g., Sales, Margin, Volume).',
        chartStep3: '3. Set Aggregation Method: Choose SUM (total), AVG (mean), or COUNT (frequency).',

        // Section 8: Textboxes
        secTextTitle: '8. Detailed Guide: Textbox Annotations & Executive Storytelling',
        secTextIntro: 'Dashboards achieve maximum business impact when accompanied by clear executive narrative and context:',
        textFeature1Title: 'Quill WYSIWYG Rich Text Engine',
        textFeature1Desc: 'Format headings, bold emphasis, italics, ordered lists, callout quotes, and brand color highlights effortlessly.',
        textFeature2Title: 'Dynamic Formula Integration',
        textFeature2Desc: 'Embed dynamic formula tags directly into text notes so that summaries and executive takeaways remain perpetually up to date.',

        // Section 9: Dashboard Layout
        secLayoutTitle: '9. Detailed Guide: Dashboard Canvas, Grid Layouts & Views',
        secLayoutIntro: 'Vedra BI provides a versatile, responsive workspace with precision grid alignment:',
        layoutPoint1: 'Freeform Placement & Resizing: Drag and drop cards anywhere on the canvas, resizing from edges and corners.',
        layoutPoint2: 'Snap-to-Grid (Ctrl+G): Toggle a magnetic alignment grid to maintain clean margins and uniform spacing.',
        layoutPoint3: 'One-Click Auto Arrange: Instantly organize cards into optimal 1-column, 2-column, or 3-column masonry arrangements.',
        layoutPoint4: 'Comparison Split View: Split the canvas into side-by-side comparative quadrants to evaluate multiple time horizons.',
        layoutPoint5: 'Global Interactive Slicers: Filter by date ranges, quarters, or regions with instantaneous synchronization across all visuals.',

        // Section 10: Menu Guide
        secMenuTitle: '10. Detailed Guide: Icon-Only Navigation & Menu Architecture',
        secMenuIntro: 'In accordance with UI design standards, Vedra BI utilizes an icon-only navigation structure without text labels. Below is the full directory of interface controls:',
        menuVTitle: 'Main Vertical Sidebar Icons:',
        menuDataDesc: 'Upload CSV/Excel, manage columns, and review raw schemas.',
        menuChartsDesc: 'Create new charts, configure visual types, and bind axes.',
        menuKpisDesc: 'Build executive KPI metric cards, target gauges, and progress bars.',
        menuTemplatesDesc: 'Access pre-designed card layouts and the dynamic formula editor.',
        menuSettingsDesc: 'Configure LTTB downsampling thresholds and rendering options.',
        menuOperationsDesc: 'Save, load, or reset dashboard configurations and layout states.',
        menuFiltersDesc: 'Manage global slicers, date bounds, and cross-filtering rules.',
        menuViewsDesc: 'Reorder canvas visual layers and restore saved view presets.',
        menuFormattingDesc: 'Apply color palettes, typography rules, borders, and margins.',
        menuEffectsDesc: 'Toggle soft shadows, glassmorphism, and entry animations.',
        menuTextboxDesc: 'Create floating rich text boxes, annotations, and summaries.',
        menuLearningDesc: 'Access this comprehensive Academy and formula reference guide.',
        menuProfileDesc: 'Manage user identity, security PIN, and workspace backups.',
        menuToggleDesc: 'Instantly show or hide dashboard canvas visuals.',

        menuHTitle: 'Top Quick Action Toolbar Icons:',
        tbTheme: 'Theme Toggle: Switch between Dark Mode and Silk Light Mode.',
        tbSnap: 'Snap to Grid (Ctrl+G): Toggle magnetic card positioning.',
        tbComparison: 'Split Comparison: Side-by-side dual dashboard view.',
        tbLttb: 'LTTB Slider: Adjust sampling resolution between 100 and 10,000 points.',
        tbPresentation: 'Presentation Mode: Enter full-screen distraction-free slideshow.',
        tbAudio: 'Audio Narrator: Listen to a voice summary of primary KPI trends.',
        tbPalette: 'Command Palette (Ctrl+K): Fast keyboard navigation search.',
        tbExport: 'Export Reports: Generate branded PDF documents or PNG captures.',

        // Section 11: Enterprise Security
        secSecurityTitle: '11. Detailed Guide: Enterprise Security & Report Exports',
        secPinTitle: '8-Digit Security PIN',
        secPinDesc: 'Every workspace account is protected by an 8-digit cryptographic security PIN, preventing unauthorized access across shared hardware.',
        secTimeoutTitle: '30-Minute Inactivity Lockout',
        secTimeoutDesc: 'Sessions automatically terminate after 30 minutes of user inactivity, requiring PIN re-authentication to resume access.',
        secExportTitle: 'Production Report Exports',
        secExportDesc: 'Produce executive-ready vector PDF reports, high-resolution PNG canvas captures, and encrypted JSON project archives in one click.',

        // Footer
        footerBeta: 'Vedra BI Enterprise Edition v1.2.0 • High-Performance Local-First Analytics',
        footerBackDashboard: 'Return to Dashboard',
        footerOpenSheet: 'Open Spreadsheet Grid',
        footerProfile: 'Security & Profile Settings'
    },

    hi: {
        // Navigation & Header
        academyTitle: 'वेदरा बीआई अकादमी',
        academySubtitle: 'संपूर्ण शिक्षण केंद्र एवं फॉर्मूला मार्गदर्शिका',
        versionBadge: 'v1.2.0 आधिकारिक मार्गदर्शिका',
        searchPlaceholder: 'फॉर्मूले, चार्ट्स, फीचर्स या शॉर्टकट खोजें (Ctrl+K)...',
        clearBtn: 'हटाएं',
        liveSandboxBtn: 'लाइव सैंडबॉक्स',
        editSheetBtn: 'शीट एडिटर',
        dashboardBtn: 'डैशबोर्ड',

        // Sidebar Navigation
        navGettingStarted: 'आरंभिक जानकारी',
        navOverview: '1. वास्तुकला एवं परिचय',
        navWorkflow: '2. संपूर्ण कार्यप्रणाली',
        navCoreFormulas: 'मूल फॉर्मूले (सभी 15)',
        navFormulasOverview: 'फॉर्मूला मास्टर गाइड',
        navInteractiveTool: 'इंटरएक्टिव उपकरण',
        navSandbox: 'लाइव फॉर्मूला सैंडबॉक्स',
        navStepByStep: 'क्रमबद्ध अध्ययन',
        navDataUpload: '1. डेटा अंतर्ग्रहण एवं अपलोड',
        navSpreadsheet: '2. स्प्रेडशीट एक्सप्लोरर',
        navCharts: '3. चार्ट निर्माण (15+ प्रकार)',
        navTextboxes: '4. टेक्स्टबॉक्स एवं नोट्स',
        navDashboard: '5. डैशबोर्ड कैनवास लेआउट',
        navMenuGuide: '6. मेनू एवं आइकन मार्गदर्शिका',
        navSecurity: '7. सुरक्षा एवं निर्यात',

        // Hero Banner
        heroBadge: 'आधिकारिक शिक्षण पोर्टल एवं तकनीकी संदर्भ',
        heroTitle: 'वेदरा बीआई शिक्षण केंद्र एवं संपूर्ण फॉर्मूला मार्गदर्शिका',
        heroDesc: 'वेदरा बीआई के प्रत्येक पहलू में पूर्ण दक्षता प्राप्त करें: विभिन्न प्रारूपों में डेटा आयात (CSV/Excel/JSON), इन-मेमोरी स्प्रेडशीट संपादन, 15+ चार्ट विजुअलाइजेशन, रिच टेक्स्ट एनोटेशन, ड्रैग-एंड-ड्रॉप डैशबोर्ड लेआउट, आइकन-आधारित नेविगेशन और सभी 15 गतिशील कार्ड फॉर्मूले।',
        heroBtnFormulas: '15 फॉर्मूले सीखें',
        heroBtnSandbox: 'लाइव सैंडबॉक्स चलाएं',
        heroBtnWorkflow: 'संपूर्ण कार्यप्रणाली देखें',
        quickFactsTitle: 'मुख्य तकनीकी तथ्य',
        factFormulasLabel: 'फॉर्मूले:',
        factFormulasVal: '15 गतिशील कार्य',
        factChartsLabel: 'चार्ट प्रकार:',
        factChartsVal: '15+ विजुअल प्रकार',
        factSpeedLabel: 'डेटा इंजन:',
        factSpeedVal: 'डकडेबी 60 एफपीएस ओलाप',
        factSecurityLabel: 'सुरक्षा:',
        factSecurityVal: '8-अंकों का पिन रक्षक',

        // Section 1: Overview
        sec1Title: '1. प्लेटफॉर्म अवलोकन एवं वास्तुकला के मूल स्तंभ',
        sec1Intro: 'वेदरा बीआई एक स्थानीय-प्रथम (लोकल-फर्स्ट) व्यापार विश्लेषण एवं विजुअलाइजेशन प्लेटफॉर्म है। बैकएंड में समाहित इन-मेमोरी डकडेबी ओलाप इंजन और अपाचे एरो बाइनरी आईपीसी के माध्यम से यह लाखों डेटा पंक्तियों को बिना किसी रुकावट के सीधे ब्राउज़र में 60 एफपीएस की गति से संसाधित करता है।',
        pillar1Title: 'प्रतिक्रियाशील ग्रिड इंजन',
        pillar1Desc: 'स्प्रेडशीट के किसी भी सेल में संशोधन करते ही उससे जुड़े सभी केपीआई कार्ड्स, चार्ट्स और परिकलित फॉर्मूले बिना पृष्ठ पुनः लोड किए तुरंत अद्यतन हो जाते हैं।',
        pillar2Title: 'एक्सेल स्तर की फॉर्मूला प्रणाली',
        pillar2Desc: 'SUM, GROWTH, STATUS और FORMAT जैसे 15 गतिशील फॉर्मूलों के माध्यम से आधुनिक वित्तीय मॉडलों के अनुरूप लाइव परिकलित केपीआई कार्ड बनाएं।',
        pillar3Title: 'एंटरप्राइज स्तरीय सुरक्षा',
        pillar3Desc: '8-अंकों का सुरक्षा पिन, 30-मिनट की निष्क्रियता पर स्वतः लॉकआउट और डेटा की पूर्ण गोपनीयता हेतु स्थानीय एन्क्रिप्टेड सत्र प्रबंधन।',

        // Section 2: Workflow
        sec2Title: '2. संपूर्ण कार्यप्रणाली: प्रारंभिक डेटा से कार्यकारी रिपोर्ट तक',
        sec2Intro: 'प्रारंभिक फाइलों को इंटरएक्टिव बिजनेस रिपोर्ट में परिवर्तित करने के 6 व्यावसायिक चरण:',
        step1Title: 'डेटा अंतर्ग्रहण एवं स्कीमा पहचान',
        step1Desc: 'CSV, एक्सेल वर्कबुक (.xlsx/.xls), JSON पेलोड को ड्रैग करें अथवा गूगल शीट्स वेब CSV लिंक दर्ज करें। प्रणाली सीमांकक, हेडर और डेटा प्रकारों की स्वतः पहचान करती है।',
        step2Title: 'स्प्रेडशीट अवलोकन एवं इन-प्लेस संपादन',
        step2Desc: 'स्प्रेडशीट ग्रिड (edit_data.html) खोलकर किसी भी सेल पर डबल-क्लिक करके मान तुरंत बदलें, पंक्तियां जोड़ें और सेल संदर्भ (A1, B4) का निरीक्षण करें।',
        step3Title: 'विजुअल एनालिटिक्स एवं चार्ट निर्माण',
        step3Desc: '15+ विजुअलाइजेशन प्रकारों में से चयन करें (बार, लाइन, एरिया, पाई, डोनट, स्कैटर, रडार, हीटमैप, फनल, गेज)। आयाम, मेट्रिक्स और एकत्रीकरण विधियां निर्धारित करें।',
        step4Title: 'केपीआई कार्ड्स एवं फॉर्मूला बाइंडिंग',
        step4Desc: 'टेम्पलेट गैलरी से आधुनिक कार्ड शैली चुनें और =SUM(Sales, R, "कुल: ") अथवा =GROWTH(B4, B3, R, "वृद्धि: ") जैसे फॉर्मूलों को सीधे बाइंड करें।',
        step5Title: 'वर्णनात्मक टेक्स्टबॉक्स एवं रिच नोट्स',
        step5Desc: 'व्यावसायिक संदर्भ, महत्वपूर्ण निष्कर्ष, बुलेट बिंदु और गतिशील फॉर्मूला संदर्भ लिखने के लिए समाहित क्विल संपादक का उपयोग करें।',
        step6Title: 'लेआउट अनुकूलन, फ़िल्टरिंग एवं निर्यात',
        step6Desc: 'स्नैप-टू-ग्रिड (Ctrl+G) से कार्ड्स को सुव्यवस्थित करें, तुलनात्मक स्प्लिट व्यू चालू करें, ग्लोबल स्लाइसर्स लागू करें और उच्च-रिज़ॉल्यूशन PNG या PDF रिपोर्ट डाउनलोड करें।',

        // Section 3: 15 Formulas
        sec3Title: '3. मास्टर तकनीकी मार्गदर्शिका: सभी 15 गतिशील फॉर्मूले',
        sec3Subtitle: 'प्रत्येक फॉर्मूले का विस्तृत विवरण: सटीक सिंटैक्स, पैरामीटर व्याख्या, व्यावसायिक उपयोग और एक-क्लिक कॉपी सुविधा।',
        dirNoticeTitle: 'दिशा पैरामीटर की व्याख्या (R बनाम L):',
        dirNoticeR: 'R (Right / दायां): परिकलित संख्यात्मक मान को आपके लेबल के दाईं ओर प्रदर्शित करता है (जैसे: "राजस्व: ₹45,000")।',
        dirNoticeL: 'L (Left / बायां): परिकलित संख्यात्मक मान को आपके लेबल के बाईं ओर प्रदर्शित करता है (जैसे: "₹45,000 राजस्व")।',

        // Sandbox Section
        sandboxTitle: '4. लाइव इंटरएक्टिव फॉर्मूला सैंडबॉक्स',
        sandboxSubtitle: 'नीचे दिए गए प्रीसेट में से चुनें अथवा नया फॉर्मूला लिखें। डेटा तालिका की संख्याओं को बदलकर आप लाइव पुनर्गणना का परीक्षण कर सकते हैं।',
        tableRegion: 'क्षेत्र',
        tableQ1: 'प्रथम तिमाही बिक्री',
        tableQ2: 'द्वितीय तिमाही बिक्री',
        tableExp: 'खर्च',
        tableTarget: 'लक्ष्य',
        tableStatus: 'स्थिति',
        presetLabel: 'फॉर्मूला प्रीसेट चुनें:',
        inputPlaceholder: 'फॉर्मूला दर्ज करें, उदा: =SUM(B, R, "Q1 कुल: ₹")',
        runBtn: 'मूल्यांकन करें / चलाएं',
        resultHeader: 'परिकलित लाइव परिणाम',
        descHeader: 'मूल्यांकन तर्क एवं गणना विधि',

        // Section 5: Data Upload Guide
        secDataTitle: '5. विस्तृत मार्गदर्शिका: डेटा अंतर्ग्रहण एवं डकडेबी ओलाप इंजन',
        secDataIntro: 'वेदरा बीआई संरचित व्यावसायिक डेटासेट के लिए शक्तिशाली अंतर्ग्रहण पाइपलाइन प्रदान करता है:',
        csvUploadTitle: '1. CSV अंतर्ग्रहण (ड्रैग एवं ड्रॉप)',
        csvUploadDesc: 'कॉमा, सेमीकोलन या टैब से अलग की गई किसी भी फाइल को सीधे ब्राउज़र में ड्रैग करें। स्वचालित पहचान विभिन्न क्षेत्रीय प्रारूपों को संभालती है।',
        excelUploadTitle: '2. एक्सेल वर्कबुक (.xlsx / .xls)',
        excelUploadDesc: 'मल्टी-शीट एक्सेल वर्कबुक का पूर्ण समर्थन। बिना किसी क्लाउड निर्भरता के स्थानीय रूप से हेडर और डेटा प्रकारों का विश्लेषण होता है।',
        jsonUploadTitle: '3. JSON एवं रेस्ट एपीआई पेलोड',
        jsonUploadDesc: 'नेस्टेड JSON ऐरे दर्ज करें। अंतर्निहित फ्लैटनिंग इंजन पदानुक्रमित संरचनाओं को विश्लेषणात्मक सारणीबद्ध तालिकाओं में बदल देता है।',
        gSheetsUploadTitle: '4. गूगल शीट्स एवं लाइव वेब यूआरएल',
        gSheetsUploadDesc: 'निरंतर डैशबोर्ड अद्यतन हेतु प्रकाशित गूगल शीट्स CSV लिंक अथवा लाइव वेब डेटा स्रोतों को सीधे कनेक्ट करें।',
        duckdbCalloutTitle: 'डकडेबी इन-मेमोरी ओलाप प्रदर्शन:',
        duckdbCalloutDesc: 'वेबअसेंबली और अपाचे एरो वेक्टर्स के उपयोग से वेदरा बीआई 500,000 से अधिक पंक्तियों पर मिलीसेकंड्स में जटिल क्वेरी चलाकर 60 एफपीएस का निर्बाध अनुभव सुनिश्चित करता है।',

        // Section 6: Spreadsheet Guide
        secSheetTitle: '6. विस्तृत मार्गदर्शिका: स्प्रेडशीट ग्रिड एवं संपादन',
        secSheetIntro: 'समर्पित स्प्रेडशीट मॉड्यूल (edit_data.html) डेटा प्रशासन हेतु एक्सेल-स्तरीय सारणीबद्ध इंटरफ़ेस प्रदान करता है:',
        sheetFeature1Title: 'डबल-क्लिक इनलाइन संपादन',
        sheetFeature1Desc: 'किसी भी सेल पर डबल-क्लिक करके मान संशोधित करें और Enter दबाएं। सभी संबंधित विजुअलाइजेशन तुरंत अद्यतित हो जाते हैं।',
        sheetFeature2Title: 'पंक्ति एवं स्तंभ संचालन',
        sheetFeature2Desc: 'नई पंक्तियां जोड़ें (+पंक्ति जोड़ें), स्तंभ शीर्षकों के नाम बदलें, डेटा प्रकार समायोजित करें और अनावश्यक रिकॉर्ड हटाएं।',
        sheetFeature3Title: 'बहु-स्तंभ सॉर्टिंग एवं खोज',
        sheetFeature3Desc: 'स्तंभ शीर्षकों पर क्लिक करके आरोही (A-Z) या अवरोही (Z-A) क्रम में व्यवस्थित करें अथवा तुरंत खोज बॉक्स का उपयोग करें।',

        // Section 7: Chart Types
        secChartTitle: '7. विस्तृत मार्गदर्शिका: चार्ट निर्माण एवं विजुअल वर्गीकरण',
        secChartIntro: 'मुख्य वर्टिकल साइडबार में चार्ट्स आइकन पर क्लिक करके 15+ विश्लेषणात्मक इंजनों में से चयन करें:',
        chartBarTitle: 'बार एवं कॉलम चार्ट',
        chartBarDesc: 'विभिन्न श्रेणियों जैसे विभागवार बिक्री, क्षेत्रीय मात्रा या उत्पाद राजस्व की तुलना के लिए।',
        chartLineTitle: 'लाइन एवं एरिया चार्ट',
        chartLineDesc: 'समय के साथ मासिक राजस्व और औसत रुझानों के निरंतर विश्लेषण के लिए।',
        chartPieTitle: 'पाई एवं डोनट चार्ट',
        chartPieDesc: 'बाजार हिस्सेदारी और श्रेणीबद्ध अनुपातों के आनुपातिक वितरण को दर्शाने के लिए।',
        chartScatterTitle: 'स्कैटर एवं बबल चार्ट',
        chartScatterDesc: 'पारस्परिक संबंध, सांख्यिकीय समूह और आउटलायर्स खोजने हेतु बहुआयामी विश्लेषण।',
        chartRadarTitle: 'रडार चार्ट',
        chartRadarDesc: 'कर्मचारी क्षमता या उत्पाद विशेषताओं के बहुआयामी प्रदर्शन मूल्यांकन के लिए।',
        chartHeatmapTitle: 'हीटमैप मैट्रिक्स',
        chartHeatmapDesc: 'सप्ताह के दिनों और घंटों के आधार पर गतिविधि घनत्व और लेनदेन की तीव्रता का विजुअलाइजेशन।',
        chartGaugeTitle: 'गेज एवं मीटर चार्ट',
        chartGaugeDesc: 'स्पीडोमीटर डायल के सदृश 0-100% पैमाने पर केपीआई लक्ष्य प्राप्ति का प्रदर्शन।',
        chartFunnelTitle: 'फनल एवं ट्रीमैप चार्ट',
        chartFunnelDesc: 'बिक्री रूपांतरण चरणों और पदानुक्रमित परिसंपत्ति वर्गीकरण के विश्लेषण के लिए।',
        chartStepsTitle: 'चार्ट बनाने के 3 सरल चरण:',
        chartStep1: '1. आयाम चुनें (X-Axis): डेटा को समूहीकृत करने वाला श्रेणीबद्ध स्तंभ चुनें (जैसे: क्षेत्र, माह)।',
        chartStep2: '2. मेट्रिक चुनें (Y-Axis): मापा जाने वाला संख्यात्मक स्तंभ चुनें (जैसे: बिक्री, लाभ, मात्रा)।',
        chartStep3: '3. एकत्रीकरण विधि चुनें: SUM (कुल योग), AVG (औसत), या COUNT (गिनती) निर्धारित करें।',

        // Section 8: Textboxes
        secTextTitle: '8. विस्तृत मार्गदर्शिका: टेक्स्टबॉक्स एनोटेशन एवं व्यावसायिक आख्यान',
        secTextIntro: 'डैशबोर्ड का वास्तविक प्रभाव तब प्रकट होता है जब डेटा के साथ स्पष्ट कार्यकारी व्याख्या सम्मिलित हो:',
        textFeature1Title: 'क्विल रिच टेक्स्ट इंजन',
        textFeature1Desc: 'शीर्षक, बोल्ड, इटैलिक, क्रमांकित सूचियां, उद्धरण और ब्रांड रंगों का सरलता से उपयोग करें।',
        textFeature2Title: 'गतिशील फॉर्मूला एकीकरण',
        textFeature2Desc: 'टेक्स्ट नोट्स में सीधे फॉर्मूला टैग जोड़ें जिससे डेटा बदलने पर कार्यकारी सारांश स्वतः अद्यतन रहें।',

        // Section 9: Dashboard Layout
        secLayoutTitle: '9. विस्तृत मार्गदर्शिका: डैशबोर्ड कैनवास, ग्रिड लेआउट एवं दृश्य',
        secLayoutIntro: 'वेदरा बीआई सटीक ग्रिड संरेखण के साथ बहुमुखी कार्यक्षेत्र प्रदान करता है:',
        layoutPoint1: 'स्वतंत्र प्लेसमेंट एवं रीसाइज़िंग: कैनवास पर कार्ड्स को कहीं भी ले जाएं और किनारों से छोटा-बड़ा करें।',
        layoutPoint2: 'स्नैप-टू-ग्रिड (Ctrl+G): उचित मार्जिन और एकसमान दूरी बनाए रखने के लिए ग्रिड संरेखण चालू करें।',
        layoutPoint3: 'एक-क्लिक स्वतः व्यवस्था: कार्ड्स को 1-कॉलम, 2-कॉलम या 3-कॉलम मेसनरी लेआउट में तुरंत सुसज्जित करें।',
        layoutPoint4: 'तुलनात्मक स्प्लिट व्यू: विभिन्न अवधियों या श्रेणियों के अगल-बगल मूल्यांकन हेतु कैनवास को विभाजित करें।',
        layoutPoint5: 'ग्लोबल इंटरएक्टिव स्लाइसर्स: दिनांक सीमा अथवा क्षेत्रीय फ़िल्टर के साथ सभी चार्ट्स को एक साथ नियंत्रित करें।',

        // Section 10: Menu Guide
        secMenuTitle: '10. विस्तृत मार्गदर्शिका: आइकन-आधारित नेविगेशन एवं मेनू संरचना',
        secMenuIntro: 'आधुनिक यूआई मानकों के अनुसार वेदरा बीआई बिना किसी टेक्स्ट लेबल के केवल शुद्ध वेक्टर आइकॉन्स का उपयोग करता है। नीचे सभी आइकॉन्स की विस्तृत मार्गदर्शिका दी गई है:',
        menuVTitle: 'मुख्य वर्टिकल साइडबार आइकॉन्स:',
        menuDataDesc: 'CSV/Excel अपलोड करें, स्तंभ प्रबंधित करें और प्रारंभिक स्कीमा देखें।',
        menuChartsDesc: 'नए चार्ट बनाएं, विजुअल प्रकार चुनें और अक्ष निर्धारित करें।',
        menuKpisDesc: 'कार्यकारी केपीआई कार्ड्स, लक्ष्य गेज और प्रोग्रेस बार बनाएं।',
        menuTemplatesDesc: 'पूर्व-निर्मित कार्ड लेआउट और फॉर्मूला संपादक का उपयोग करें।',
        menuSettingsDesc: 'LTTB सैंपलिंग रिज़ॉल्यूशन और प्रदर्शन विकल्प समायोजित करें।',
        menuOperationsDesc: 'डैशबोर्ड लेआउट को सहेजें, लोड करें या प्रारंभिक स्थिति में लाएं।',
        menuFiltersDesc: 'ग्लोबल स्लाइसर्स, दिनांक सीमा और क्रॉस-फ़िल्टरिंग नियम प्रबंधित करें।',
        menuViewsDesc: 'कैनवास लेयर्स का क्रम व्यवस्थित करें और सहेजे गए दृश्य पुनः प्राप्त करें।',
        menuFormattingDesc: 'रंग पट्टिका, टाइपोग्राफी नियम, बॉर्डर्स और मार्जिन लागू करें।',
        menuEffectsDesc: 'सॉफ्ट शैडो, ग्लासमोर्फिज्म और प्रवेश एनिमेशन नियंत्रित करें।',
        menuTextboxDesc: 'कैनवास पर फ्लोटिंग रिच टेक्स्ट बॉक्स और सारांश नोट्स जोड़ें।',
        menuLearningDesc: 'यह व्यापक अकादमी और फॉर्मूला संदर्भ मार्गदर्शिका खोलें।',
        menuProfileDesc: 'उपयोगकर्ता पहचान, सुरक्षा पिन और वर्कस्पेस बैकअप प्रबंधित करें।',
        menuToggleDesc: 'डैशबोर्ड कैनवास विजुअल्स को तुरंत छुपाएं अथवा पुनः दिखाएं।',

        menuHTitle: 'शीर्ष त्वरित टूलबार आइकॉन्स:',
        tbTheme: 'थीम टॉगल: डार्क मोड और सिल्क लाइट मोड के बीच स्विच करें।',
        tbSnap: 'स्नैप-टू-ग्रिड (Ctrl+G): चुम्बकीय कार्ड संरेखण चालू/बंद करें।',
        tbComparison: 'स्प्लिट तुलना: अगल-बगल दोहरे डैशबोर्ड का दृश्य।',
        tbLttb: 'LTTB स्लाइडर: 100 से 10,000 बिंदुओं के बीच सैंपलिंग समायोजित करें।',
        tbPresentation: 'प्रस्तुति मोड: पूर्ण-स्क्रीन स्लाइड शो मोड में प्रवेश करें।',
        tbAudio: 'ऑडियो वाचक: प्रमुख केपीआई रुझानों का संक्षिप्त ध्वनि सारांश सुनें।',
        tbPalette: 'कमांड पैलेट (Ctrl+K): त्वरित कीबोर्ड नेविगेशन खोज।',
        tbExport: 'रिपोर्ट निर्यात: ब्रांडेड PDF रिपोर्ट या PNG स्नैपशॉट बनाएं।',

        // Section 11: Enterprise Security
        secSecurityTitle: '11. विस्तृत मार्गदर्शिका: एंटरप्राइज सुरक्षा एवं रिपोर्ट निर्यात',
        secPinTitle: '8-अंकों का सुरक्षा पिन',
        secPinDesc: 'प्रत्येक खाता 8-अंकों के क्रिप्टोग्राफिक सुरक्षा पिन द्वारा सुरक्षित है, जो अनधिकृत पहुंच को रोकता है।',
        secTimeoutTitle: '30-मिनट निष्क्रियता लॉकआउट',
        secTimeoutDesc: '30 मिनट की निष्क्रियता के पश्चात सुरक्षा हेतु सत्र स्वतः समाप्त हो जाता है और पुनः पिन दर्ज करना आवश्यक होता है।',
        secExportTitle: 'व्यावसायिक रिपोर्ट निर्यात',
        secExportDesc: 'कार्यकारी स्तर की वेक्टर PDF रिपोर्ट, उच्च-रिज़ॉल्यूशन PNG कैनवास कैप्चर और एन्क्रिप्टेड JSON बैकअप एक क्लिक में प्राप्त करें।',

        // Footer
        footerBeta: 'वेदरा बीआई एंटरप्राइज संस्करण v1.2.0 • उच्च-प्रदर्शन लोकल-फर्स्ट एनालिटिक्स',
        footerBackDashboard: 'डैशबोर्ड पर लौटें',
        footerOpenSheet: 'स्प्रेडशीट ग्रिड खोलें',
        footerProfile: 'सुरक्षा एवं प्रोफाइल सेटिंग्स'
    }
};

/**
 * Formula definitions with bilingual explanations ensuring 100% clean isolation
 */
export interface FormulaDoc {
    id: string;
    fn: string;
    signature: string;
    category: { en: string; hi: string };
    shortDesc: { en: string; hi: string };
    syntax: string;
    params: {
        en: { name: string; desc: string }[];
        hi: { name: string; desc: string }[];
    };
    example: {
        code: string;
        desc: { en: string; hi: string };
        output: { en: string; hi: string };
    };
}

export const FORMULA_CATALOG: FormulaDoc[] = [
    {
        id: 'formula-insert',
        fn: 'INSERT',
        signature: '=INSERT(Target, Direction, "Text")',
        category: { en: 'Basic Cell Reference', hi: 'मूल सेल संदर्भ' },
        shortDesc: {
            en: 'Retrieves the live value of a specific cell (e.g. A4) or column and concatenates it with your custom label. Updates reactively when the cell is edited in the grid.',
            hi: 'किसी विशिष्ट सेल (उदा. A4) अथवा स्तंभ के मान को प्राप्त कर कस्टम टेक्स्ट के साथ जोड़ता है। सेल में परिवर्तन होते ही तुरंत अद्यतन होता है।'
        },
        syntax: '=INSERT(Target, Direction, "Text")',
        params: {
            en: [
                { name: 'Target', desc: 'Cell address (e.g. A4, B2) or column name.' },
                { name: 'Direction', desc: '"R" places value on the right; "L" places value on the left.' },
                { name: 'Text', desc: 'Custom label or prefix/suffix string.' }
            ],
            hi: [
                { name: 'Target', desc: 'सेल का पता (उदा. A4, B2) अथवा स्तंभ का नाम।' },
                { name: 'Direction', desc: '"R" संख्या को दाईं ओर रखता है; "L" संख्या को बाईं ओर रखता है।' },
                { name: 'Text', desc: 'आपका कस्टम लेबल अथवा टेक्स्ट स्ट्रिंग।' }
            ]
        },
        example: {
            code: '=INSERT(A4, R, "Region: ")',
            desc: {
                en: 'Pulls the regional name stored in cell A4 with the prefix "Region: ".',
                hi: 'सेल A4 में दर्ज क्षेत्रीय नाम को "Region: " उपसर्ग के साथ दिखाता है।'
            },
            output: {
                en: 'Region: North America',
                hi: 'Region: North America'
            }
        }
    },
    {
        id: 'formula-sum',
        fn: 'SUM',
        signature: '=SUM(ColumnOrRange, Direction, "Text")',
        category: { en: 'Mathematical Aggregate', hi: 'अंकगणितीय संकलन' },
        shortDesc: {
            en: 'Calculates the cumulative total of an entire numerical column or specified cell range (e.g. B2:B20). Automatically ignores text and blank cells.',
            hi: 'संपूर्ण संख्यात्मक स्तंभ अथवा निर्दिष्ट सेल रेंज (उदा. B2:B20) का कुल जोड़ निकालता है। रिक्त और गैर-संख्यात्मक सेल स्वतः छूट जाते हैं।'
        },
        syntax: '=SUM(B, R, "Total Revenue: $")',
        params: {
            en: [
                { name: 'ColumnOrRange', desc: 'Column letter (e.g. B) or bounded range (e.g. B2:B100).' },
                { name: 'Direction', desc: '"R" for label left, sum right; "L" for sum left, label right.' },
                { name: 'Text', desc: 'Text label (e.g. "Total Revenue: $").' }
            ],
            hi: [
                { name: 'ColumnOrRange', desc: 'स्तंभ अक्षर (उदा. B) अथवा परिबद्ध रेंज (उदा. B2:B100)।' },
                { name: 'Direction', desc: '"R" कुल योग को दाईं ओर रखता है; "L" कुल योग को बाईं ओर रखता है।' },
                { name: 'Text', desc: 'कस्टम लेबल (उदा. "Total Revenue: $")।' }
            ]
        },
        example: {
            code: '=SUM(B, R, "Total Sales: $")',
            desc: {
                en: 'Computes total quarterly revenue across all records in Column B.',
                hi: 'कॉलम B के सभी रिकॉर्ड्स की कुल त्रैमासिक बिक्री का योग करता है।'
            },
            output: {
                en: 'Total Sales: $338,000',
                hi: 'Total Sales: $338,000'
            }
        }
    },
    {
        id: 'formula-avg',
        fn: 'AVG',
        signature: '=AVG(ColumnOrRange, Direction, "Text")',
        category: { en: 'Statistical Mean', hi: 'सांख्यिकीय औसत' },
        shortDesc: {
            en: 'Computes the arithmetic mean across all valid numerical values in the selected column or range.',
            hi: 'चयनित स्तंभ अथवा रेंज के सभी मान्य संख्यात्मक मानों का अंकगणितीय औसत (Mean) निकालता है।'
        },
        syntax: '=AVG(B, R, "Average Order: $")',
        params: {
            en: [
                { name: 'ColumnOrRange', desc: 'Column letter (e.g. C) or range (e.g. C1:C50).' },
                { name: 'Direction', desc: '"R" (value on right) or "L" (value on left).' },
                { name: 'Text', desc: 'Label string.' }
            ],
            hi: [
                { name: 'ColumnOrRange', desc: 'स्तंभ अक्षर (उदा. C) अथवा रेंज (उदा. C1:C50)।' },
                { name: 'Direction', desc: '"R" (मान दाईं ओर) अथवा "L" (मान बाईं ओर)।' },
                { name: 'Text', desc: 'लेबल स्ट्रिंग।' }
            ]
        },
        example: {
            code: '=AVG(B, R, "Avg Sales: $")',
            desc: {
                en: 'Finds average sales per sales rep in Column B.',
                hi: 'कॉलम B में प्रति प्रतिनिधि औसत बिक्री ज्ञात करता है।'
            },
            output: {
                en: 'Avg Sales: $84,500',
                hi: 'Avg Sales: $84,500'
            }
        }
    },
    {
        id: 'formula-max',
        fn: 'MAX',
        signature: '=MAX(ColumnOrRange, Direction, "Text")',
        category: { en: 'Extreme Value', hi: 'उच्चतम मान' },
        shortDesc: {
            en: 'Identifies the highest numerical peak within the targeted column or cell range.',
            hi: 'लक्षित स्तंभ अथवा सेल रेंज में सबसे उच्चतम संख्यात्मक मान को खोजता है।'
        },
        syntax: '=MAX(B, R, "Peak Deal: $")',
        params: {
            en: [
                { name: 'ColumnOrRange', desc: 'Column or cell range to inspect.' },
                { name: 'Direction', desc: '"R" or "L".' },
                { name: 'Text', desc: 'Label prefix or suffix.' }
            ],
            hi: [
                { name: 'ColumnOrRange', desc: 'निरीक्षण हेतु स्तंभ अथवा सेल रेंज।' },
                { name: 'Direction', desc: '"R" अथवा "L"।' },
                { name: 'Text', desc: 'लेबल उपसर्ग अथवा प्रत्यय।' }
            ]
        },
        example: {
            code: '=MAX(B, R, "Top Performer: $")',
            desc: {
                en: 'Displays the largest transaction recorded in Column B.',
                hi: 'कॉलम B में दर्ज सबसे बड़े सौदे का मान प्रदर्शित करता है।'
            },
            output: {
                en: 'Top Performer: $120,000',
                hi: 'Top Performer: $120,000'
            }
        }
    },
    {
        id: 'formula-min',
        fn: 'MIN',
        signature: '=MIN(ColumnOrRange, Direction, "Text")',
        category: { en: 'Extreme Value', hi: 'न्यूनतम मान' },
        shortDesc: {
            en: 'Finds the smallest positive or negative numerical value across the specified column or range.',
            hi: 'निर्दिष्ट स्तंभ अथवा रेंज में सबसे न्यूनतम संख्यात्मक मान खोजता है।'
        },
        syntax: '=MIN(D, R, "Lowest Expense: $")',
        params: {
            en: [
                { name: 'ColumnOrRange', desc: 'Target column or range.' },
                { name: 'Direction', desc: '"R" or "L".' },
                { name: 'Text', desc: 'Label text.' }
            ],
            hi: [
                { name: 'ColumnOrRange', desc: 'लक्षित स्तंभ अथवा रेंज।' },
                { name: 'Direction', desc: '"R" अथवा "L"।' },
                { name: 'Text', desc: 'लेबल टेक्स्ट।' }
            ]
        },
        example: {
            code: '=MIN(D, R, "Min Cost: $")',
            desc: {
                en: 'Locates the lowest departmental expenditure in Column D.',
                hi: 'कॉलम D में न्यूनतम विभागीय खर्च की पहचान करता है।'
            },
            output: {
                en: 'Min Cost: $28,000',
                hi: 'Min Cost: $28,000'
            }
        }
    },
    {
        id: 'formula-count',
        fn: 'COUNT',
        signature: '=COUNT(ColumnOrRange, Direction, "Text")',
        category: { en: 'Record Frequency', hi: 'रिकॉर्ड गणना' },
        shortDesc: {
            en: 'Counts the number of active, non-empty rows within the designated column or range.',
            hi: 'नामित स्तंभ अथवा रेंज में सक्रिय, गैर-रिक्त पंक्तियों की संख्या गिनता है।'
        },
        syntax: '=COUNT(A, R, "Active Accounts: ")',
        params: {
            en: [
                { name: 'ColumnOrRange', desc: 'Column letter or range.' },
                { name: 'Direction', desc: '"R" or "L".' },
                { name: 'Text', desc: 'Label text.' }
            ],
            hi: [
                { name: 'ColumnOrRange', desc: 'स्तंभ अक्षर अथवा रेंज।' },
                { name: 'Direction', desc: '"R" अथवा "L"।' },
                { name: 'Text', desc: 'लेबल टेक्स्ट।' }
            ]
        },
        example: {
            code: '=COUNT(A, R, "Total Regions: ")',
            desc: {
                en: 'Counts total geographic territories present in Column A.',
                hi: 'कॉलम A में मौजूद कुल भौगोलिक क्षेत्रों की गणना करता है।'
            },
            output: {
                en: 'Total Regions: 4',
                hi: 'Total Regions: 4'
            }
        }
    },
    {
        id: 'formula-growth',
        fn: 'GROWTH',
        signature: '=GROWTH(Current, Prev, Direction, "Text")',
        category: { en: 'Variance & Momentum', hi: 'वृद्धि एवं गतिशीलता' },
        shortDesc: {
            en: 'Calculates the percentage change between two values or cells: ((Current - Prev) / Prev) * 100 with dynamic direction arrows (▲ / ▼).',
            hi: 'दो मानों या सेलों के बीच प्रतिशत वृद्धि दर निकालता है: ((Current - Prev) / Prev) * 100 साथ ही गतिशील तीर (▲ / ▼) जोड़ता है।'
        },
        syntax: '=GROWTH(C2, B2, R, "QoQ Growth: ")',
        params: {
            en: [
                { name: 'Current', desc: 'Current period cell or value (e.g. C2).' },
                { name: 'Prev', desc: 'Previous baseline cell or value (e.g. B2).' },
                { name: 'Direction', desc: '"R" or "L".' },
                { name: 'Text', desc: 'Custom prefix label.' }
            ],
            hi: [
                { name: 'Current', desc: 'वर्तमान अवधि का सेल अथवा मान (उदा. C2)।' },
                { name: 'Prev', desc: 'पिछली आधार अवधि का सेल अथवा मान (उदा. B2)।' },
                { name: 'Direction', desc: '"R" अथवा "L"।' },
                { name: 'Text', desc: 'कस्टम उपसर्ग लेबल।' }
            ]
        },
        example: {
            code: '=GROWTH(C2, B2, R, "Growth: ")',
            desc: {
                en: 'Evaluates quarter-over-quarter expansion from $85,000 (B2) to $95,000 (C2).',
                hi: '$85,000 (B2) से $95,000 (C2) के बीच तिमाही वृद्धि दर का आकलन करता है।'
            },
            output: {
                en: 'Growth: +11.8% ▲',
                hi: 'Growth: +11.8% ▲'
            }
        }
    },
    {
        id: 'formula-diff',
        fn: 'DIFF',
        signature: '=DIFF(Target1, Target2, Direction, "Text")',
        category: { en: 'Variance Analysis', hi: 'अंतर विश्लेषण' },
        shortDesc: {
            en: 'Computes the absolute difference (Target1 - Target2) between two metrics, displaying positive or negative delta signs.',
            hi: 'दो मेट्रिक्स के बीच वास्तविक अंतर (Target1 - Target2) की गणना करता है और धनात्मक/ऋणात्मक चिह्न प्रदर्शित करता है।'
        },
        syntax: '=DIFF(C2, D2, R, "Net Margin: $")',
        params: {
            en: [
                { name: 'Target1', desc: 'First cell or number (e.g. C2 Revenue).' },
                { name: 'Target2', desc: 'Second cell or number (e.g. D2 Cost).' },
                { name: 'Direction', desc: '"R" or "L".' },
                { name: 'Text', desc: 'Descriptive prefix.' }
            ],
            hi: [
                { name: 'Target1', desc: 'पहला सेल अथवा संख्या (उदा. C2 आय)।' },
                { name: 'Target2', desc: 'दूसरा सेल अथवा संख्या (उदा. D2 खर्च)।' },
                { name: 'Direction', desc: '"R" अथवा "L"।' },
                { name: 'Text', desc: 'वर्णनात्मक उपसर्ग।' }
            ]
        },
        example: {
            code: '=DIFF(C2, D2, R, "Operating Profit: $")',
            desc: {
                en: 'Subtracts Q2 expenses ($32,000) from Q2 sales ($95,000).',
                hi: 'Q2 बिक्री ($95,000) में से Q2 खर्च ($32,000) घटाकर लाभ निकालता है।'
            },
            output: {
                en: 'Operating Profit: +$63,000',
                hi: 'Operating Profit: +$63,000'
            }
        }
    },
    {
        id: 'formula-percent',
        fn: 'PERCENT',
        signature: '=PERCENT(Actual, Max, Direction, "Text")',
        category: { en: 'Target Achievement', hi: 'लक्ष्य प्राप्ति प्रतिशत' },
        shortDesc: {
            en: 'Calculates the quota fulfillment ratio: (Actual / Max) * 100%, ideal for progress bars and speedometer gauges.',
            hi: 'कोटा पूर्ति अनुपात की गणना करता है: (Actual / Max) * 100%, जो प्रोग्रेस बार और गेज मीटर हेतु सर्वोत्तम है।'
        },
        syntax: '=PERCENT(B2, E2, R, "Target Met: ")',
        params: {
            en: [
                { name: 'Actual', desc: 'Attained performance value or cell.' },
                { name: 'Max', desc: 'Total quota or capacity target.' },
                { name: 'Direction', desc: '"R" or "L".' },
                { name: 'Text', desc: 'Label text.' }
            ],
            hi: [
                { name: 'Actual', desc: 'प्राप्त वास्तविक प्रदर्शन मान अथवा सेल।' },
                { name: 'Max', desc: 'कुल कोटा अथवा क्षमता लक्ष्य।' },
                { name: 'Direction', desc: '"R" अथवा "L"।' },
                { name: 'Text', desc: 'लेबल टेक्स्ट।' }
            ]
        },
        example: {
            code: '=PERCENT(B2, E2, R, "Attainment: ")',
            desc: {
                en: 'Checks progress of $85,000 achieved against a $100,000 annual goal.',
                hi: '$100,000 के लक्ष्य के मुकाबले प्राप्त $85,000 की प्रगति की जांच करता है।'
            },
            output: {
                en: 'Attainment: 85.0%',
                hi: 'Attainment: 85.0%'
            }
        }
    },
    {
        id: 'formula-remaining',
        fn: 'REMAINING',
        signature: '=REMAINING(Goal, Current, Direction, "Text")',
        category: { en: 'Target Deficit', hi: 'लक्ष्य शेष अंतर' },
        shortDesc: {
            en: 'Calculates the remaining delta required to reach a specific quota: Math.max(0, Goal - Current).',
            hi: 'किसी निश्चित लक्ष्य तक पहुंचने के लिए शेष आवश्यक राशि की गणना करता है: Math.max(0, Goal - Current)।'
        },
        syntax: '=REMAINING(E2, B2, R, "Shortfall: $")',
        params: {
            en: [
                { name: 'Goal', desc: 'Target objective cell or number.' },
                { name: 'Current', desc: 'Current progress cell or number.' },
                { name: 'Direction', desc: '"R" or "L".' },
                { name: 'Text', desc: 'Prefix label.' }
            ],
            hi: [
                { name: 'Goal', desc: 'लक्ष्य उद्देश्य सेल अथवा संख्या।' },
                { name: 'Current', desc: 'वर्तमान प्रगति सेल अथवा संख्या।' },
                { name: 'Direction', desc: '"R" अथवा "L"।' },
                { name: 'Text', desc: 'उपसर्ग लेबल।' }
            ]
        },
        example: {
            code: '=REMAINING(E2, B2, R, "Goal Deficit: $")',
            desc: {
                en: 'Computes remaining amount needed when target is $100,000 and current is $85,000.',
                hi: '$100,000 के लक्ष्य और $85,000 की मौजूदा बिक्री के बीच शेष अंतर निकालता है।'
            },
            output: {
                en: 'Goal Deficit: $15,000',
                hi: 'Goal Deficit: $15,000'
            }
        }
    },
    {
        id: 'formula-status',
        fn: 'STATUS',
        signature: '=STATUS(Target, Threshold, "PassText", "FailText")',
        category: { en: 'Conditional Alert', hi: 'शर्त आधारित चेतावनी' },
        shortDesc: {
            en: 'Evaluates whether a value meets or exceeds a defined threshold, returning user-defined status badges or emoji indicators.',
            hi: 'मूल्यांकन करता है कि क्या कोई मान निर्धारित सीमा को पूरा करता है, और कस्टम बैज या इमोजी संकेतक लौटाता है।'
        },
        syntax: '=STATUS(B2, 80000, "On Track ✅", "Needs Attention ⚠️")',
        params: {
            en: [
                { name: 'Target', desc: 'Cell or metric to evaluate.' },
                { name: 'Threshold', desc: 'Numerical cutoff benchmark.' },
                { name: 'PassText', desc: 'String displayed if Target >= Threshold.' },
                { name: 'FailText', desc: 'String displayed if Target < Threshold.' }
            ],
            hi: [
                { name: 'Target', desc: 'मूल्यांकन हेतु सेल अथवा मेट्रिक।' },
                { name: 'Threshold', desc: 'संख्यात्मक बेंचमार्क सीमा।' },
                { name: 'PassText', desc: 'Target >= Threshold होने पर प्रदर्शित होने वाला टेक्स्ट।' },
                { name: 'FailText', desc: 'Target < Threshold होने पर प्रदर्शित होने वाला टेक्स्ट।' }
            ]
        },
        example: {
            code: '=STATUS(B2, 80000, "Qualified ✅", "Disqualified ❌")',
            desc: {
                en: 'Validates if Region North sales ($85,000) exceeded the $80,000 sales hurdle.',
                hi: 'जांचता है कि क्या उत्तरी क्षेत्र की बिक्री ($85,000) $80,000 की सीमा से अधिक है।'
            },
            output: {
                en: 'Qualified ✅',
                hi: 'Qualified ✅'
            }
        }
    },
    {
        id: 'formula-if',
        fn: 'IF',
        signature: '=IF(Condition, "TrueText", "FalseText")',
        category: { en: 'Boolean Branching', hi: 'लॉजिकल शाखाएं' },
        shortDesc: {
            en: 'Executes Excel-style logical evaluations (e.g. B2 > 50000) and returns distinct conditional branches.',
            hi: 'एक्सेल शैली की तार्किक शर्तों (उदा. B2 > 50000) का मूल्यांकन करता है और भिन्न परिणाम लौटाता है।'
        },
        syntax: '=IF(B2>80000, "Bonus Eligible", "Standard Pay")',
        params: {
            en: [
                { name: 'Condition', desc: 'Logical comparison expression (e.g. B2 > 80000).' },
                { name: 'TrueText', desc: 'Returned if condition evaluates to true.' },
                { name: 'FalseText', desc: 'Returned if condition evaluates to false.' }
            ],
            hi: [
                { name: 'Condition', desc: 'तार्किक तुलना अभिव्यक्ति (उदा. B2 > 80000)।' },
                { name: 'TrueText', desc: 'शर्त सत्य होने पर मिलने वाला टेक्स्ट।' },
                { name: 'FalseText', desc: 'शर्त असत्य होने पर मिलने वाला टेक्स्ट।' }
            ]
        },
        example: {
            code: '=IF(B2>80000, "Tier 1 Partner", "Tier 2 Partner")',
            desc: {
                en: 'Classifies regional tiers based on quarterly benchmark performance.',
                hi: 'तिमाही प्रदर्शन बेंचमार्क के आधार पर क्षेत्रीय श्रेणी का निर्धारण करता है।'
            },
            output: {
                en: 'Tier 1 Partner',
                hi: 'Tier 1 Partner'
            }
        }
    },
    {
        id: 'formula-latest',
        fn: 'LATEST',
        signature: '=LATEST(ColumnName, Direction, "Text")',
        category: { en: 'Streaming Row Capture', hi: 'नवीनतम पंक्ति मान' },
        shortDesc: {
            en: 'Retrieves the most recent record (bottom-most row) from the specified column, perfect for live data feeds.',
            hi: 'निर्दिष्ट स्तंभ से सबसे हालिया रिकॉर्ड (अंतिम पंक्ति) प्राप्त करता है, जो लाइव डेटा फीड के लिए उत्तम है।'
        },
        syntax: '=LATEST(B, R, "Latest Inflow: $")',
        params: {
            en: [
                { name: 'ColumnName', desc: 'Column letter or field header.' },
                { name: 'Direction', desc: '"R" or "L".' },
                { name: 'Text', desc: 'Label prefix.' }
            ],
            hi: [
                { name: 'ColumnName', desc: 'स्तंभ अक्षर अथवा हेडर।' },
                { name: 'Direction', desc: '"R" अथवा "L"।' },
                { name: 'Text', desc: 'उपसर्ग लेबल।' }
            ]
        },
        example: {
            code: '=LATEST(B, R, "Most Recent: $")',
            desc: {
                en: 'Extracts the last entry from Column B (e.g., Row 5 = $68,000).',
                hi: 'कॉलम B से अंतिम प्रविष्टि (उदा. पंक्ति 5 = $68,000) निकालता है।'
            },
            output: {
                en: 'Most Recent: $68,000',
                hi: 'Most Recent: $68,000'
            }
        }
    },
    {
        id: 'formula-top',
        fn: 'TOP',
        signature: '=TOP(ColumnName, N, Direction, "Text")',
        category: { en: 'Leaderboard Ranking', hi: 'शीर्ष रैंक मान' },
        shortDesc: {
            en: 'Returns the N-th highest ranked value or associated category label from a designated metric column.',
            hi: 'नामित मेट्रिक स्तंभ में से N-वें उच्चतम रैंक वाले मान अथवा संबंधित श्रेणी लेबल को लौटाता है।'
        },
        syntax: '=TOP(B, 1, R, "Top Performer: $")',
        params: {
            en: [
                { name: 'ColumnName', desc: 'Numerical column to rank.' },
                { name: 'N', desc: 'Rank position (1 for top, 2 for second, etc.).' },
                { name: 'Direction', desc: '"R" or "L".' },
                { name: 'Text', desc: 'Prefix label.' }
            ],
            hi: [
                { name: 'ColumnName', desc: 'रैंकिंग हेतु संख्यात्मक स्तंभ।' },
                { name: 'N', desc: 'रैंक स्थिति (1 शीर्ष, 2 द्वितीय, आदि)।' },
                { name: 'Direction', desc: '"R" अथवा "L"।' },
                { name: 'Text', desc: 'उपसर्ग लेबल।' }
            ]
        },
        example: {
            code: '=TOP(B, 1, R, "Leader Sales: $")',
            desc: {
                en: 'Identifies the highest single sales volume across all regional teams.',
                hi: 'सभी क्षेत्रीय टीमों में सबसे अधिक एकल बिक्री मात्रा की पहचान करता है।'
            },
            output: {
                en: 'Leader Sales: $120,000',
                hi: 'Leader Sales: $120,000'
            }
        }
    },
    {
        id: 'formula-format',
        fn: 'FORMAT',
        signature: '=FORMAT(Target, "Style", Direction, "Text")',
        category: { en: 'Currency & Number Styling', hi: 'मुद्रा एवं संख्या स्वरूपण' },
        shortDesc: {
            en: 'Formats numerical metrics into international standards such as Indian Rupee (INR = ₹4,82,500), US Dollar (USD = $482,500), Euro (EUR), or Percentage.',
            hi: 'संख्याओं को अंतरराष्ट्रीय मानकों जैसे भारतीय रुपया (INR = ₹4,82,500), अमेरिकी डॉलर (USD = $482,500), यूरो (EUR), या प्रतिशत में स्वरूपित करता है।'
        },
        syntax: '=FORMAT(B2, "INR", R, "Net Inflow: ")',
        params: {
            en: [
                { name: 'Target', desc: 'Cell address or raw number.' },
                { name: 'Style', desc: '"INR" (₹ Lakh/Crore), "USD" ($ Millions), "EUR" (€), or "PERCENT".' },
                { name: 'Direction', desc: '"R" or "L".' },
                { name: 'Text', desc: 'Descriptive prefix.' }
            ],
            hi: [
                { name: 'Target', desc: 'सेल का पता अथवा मूल संख्या।' },
                { name: 'Style', desc: '"INR" (₹ लाख/करोड़), "USD" ($), "EUR" (€), या "PERCENT"।' },
                { name: 'Direction', desc: '"R" अथवा "L"।' },
                { name: 'Text', desc: 'वर्णनात्मक उपसर्ग।' }
            ]
        },
        example: {
            code: '=FORMAT(B2, "INR", R, "Total: ")',
            desc: {
                en: 'Converts 85000 to Indian Lakh system representation (₹85,000).',
                hi: '85000 को भारतीय रुपया प्रणाली (₹85,000) में परिवर्तित करता है।'
            },
            output: {
                en: 'Total: ₹85,000',
                hi: 'Total: ₹85,000'
            }
        }
    }
];

/**
 * Client Controller Initializer
 */
export function initHandbookController() {
    let currentLang: HandbookLang = (localStorage.getItem('vedra_learning_lang') as HandbookLang) || 'en';

    function setLanguage(lang: HandbookLang) {
        currentLang = lang;
        localStorage.setItem('vedra_learning_lang', lang);
        document.documentElement.setAttribute('data-lang', lang);

        // Update Toggle Buttons in Header
        const btnEn = document.getElementById('btnLangEn');
        const btnHi = document.getElementById('btnLangHi');
        if (btnEn && btnHi) {
            if (lang === 'en') {
                btnEn.className = 'btn btn-sm btn-primary active fw-bold';
                btnHi.className = 'btn btn-sm btn-outline-secondary';
            } else {
                btnHi.className = 'btn btn-sm btn-primary active fw-bold';
                btnEn.className = 'btn btn-sm btn-outline-secondary';
            }
        }

        // Apply translations to all DOM elements with data-i18n
        const dict = HANDBOOK_I18N[lang];
        document.querySelectorAll<HTMLElement>('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (key && dict[key]) {
                el.textContent = dict[key];
            }
        });

        // Update input placeholders
        const searchInput = document.getElementById('globalGuideSearch') as HTMLInputElement | null;
        if (searchInput) {
            searchInput.placeholder = dict.searchPlaceholder;
        }

        // Render Formula Cards dynamically to guarantee pure language isolation
        renderFormulaCards(lang);

        // Re-evaluate sandbox formula with localized description
        evaluateSandboxFormula();
    }

    // Render Formula Cards
    function renderFormulaCards(lang: HandbookLang) {
        const container = document.getElementById('formulaCardsContainer');
        if (!container) return;

        let html = '';
        FORMULA_CATALOG.forEach((f, idx) => {
            const num = idx + 1;
            const categoryText = f.category[lang];
            const descText = f.shortDesc[lang];
            const paramList = f.params[lang].map(p => `<li><code>${p.name}</code>: ${p.desc}</li>`).join('');
            const exampleDesc = f.example.desc[lang];
            const exampleOutput = f.example.output[lang];
            const paramsHeading = lang === 'en' ? 'Parameters:' : 'पैरामीटर्स:';
            const exampleHeading = lang === 'en' ? 'Realistic Business Example:' : 'व्यावसायिक उदाहरण:';
            const outputLabel = lang === 'en' ? 'Output' : 'परिणाम';
            const copyText = lang === 'en' ? 'Copy Formula' : 'कॉपी करें';

            html += `
            <div class="learn-card formula-card mb-4 guide-topic" id="${f.id}">
                <div class="d-flex align-items-center justify-content-between flex-wrap gap-2">
                    <h4 class="h5 fw-bold text-primary mb-0 font-mono">${num}. ${f.signature}</h4>
                    <span class="formula-badge bg-primary-subtle text-primary border border-primary-subtle">${categoryText}</span>
                </div>
                <p class="mt-2 mb-2 text-main" style="font-size: 0.95rem;">${descText}</p>
                
                <div class="formula-syntax-box position-relative">
                    <button class="copy-formula-btn" onclick="window.copyFormula('${f.example.code}')">
                        <i class="bi bi-clipboard me-1"></i> ${copyText}
                    </button>
                    <code class="text-info">${f.example.code}</code>
                </div>

                <div class="row g-3 small mt-1">
                    <div class="col-md-6">
                        <div class="p-2.5 rounded-3 bg-body-tertiary h-100 border border-light-subtle">
                            <strong class="d-block mb-1 text-primary">${paramsHeading}</strong>
                            <ul class="mb-0 ps-3 text-muted">
                                ${paramList}
                            </ul>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="p-2.5 rounded-3 bg-body-tertiary h-100 border border-light-subtle">
                            <strong class="d-block mb-1 text-success">${exampleHeading}</strong>
                            <div class="text-muted mb-1">${exampleDesc}</div>
                            <div class="badge bg-success-subtle text-success border border-success-subtle font-mono" style="font-size: 0.82rem;">
                                ${outputLabel}: ${exampleOutput}
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
        });

        container.innerHTML = html;
    }

    // Expose language switcher globally
    (window as any).setHandbookLanguage = setLanguage;

    // Expose clipboard helper
    (window as any).copyFormula = (code: string) => {
        navigator.clipboard.writeText(code).then(() => {
            const toast = document.getElementById('copyToast');
            if (toast) {
                toast.classList.add('show');
                setTimeout(() => toast.classList.remove('show'), 2000);
            }
        });
    };

    // Initialize Sandbox Logic
    function evaluateSandboxFormula() {
        const input = document.getElementById('sandboxFormulaInput') as HTMLInputElement | null;
        const resultDisplay = document.getElementById('sandboxResultDisplay');
        const resultDesc = document.getElementById('sandboxResultDesc');
        const table = document.getElementById('sandboxTable');
        if (!input || !resultDisplay || !resultDesc || !table) return;

        const raw = input.value.trim();
        const match = raw.match(/^=([A-Z_]+)\s*\((.*)\)$/i);
        if (!match) {
            resultDisplay.textContent = 'Invalid Syntax';
            resultDesc.textContent = currentLang === 'en' 
                ? 'Formula must begin with "=" followed by function name and arguments in parentheses.' 
                : 'फॉर्मूला "=" से शुरू होना चाहिए, उसके बाद फ़ंक्शन नाम और कोष्ठक में तर्क होने चाहिए।';
            return;
        }

        const fn = match[1].toUpperCase();
        const innerArgs = match[2];
        const parts: string[] = [];
        let cur = '';
        let inQ = false;
        for (let i = 0; i < innerArgs.length; i++) {
            const ch = innerArgs[i];
            if (ch === '"' || ch === "'") inQ = !inQ;
            else if (ch === ',' && !inQ) {
                parts.push(cur.trim().replace(/^['"]|['"]$/g, ''));
                cur = '';
                continue;
            }
            cur += ch;
        }
        if (cur.trim()) parts.push(cur.trim().replace(/^['"]|['"]$/g, ''));

        const p1 = parts[0] || 'B';
        const p2 = parts[1] || 'R';
        const p3 = parts[2] || '';
        const p4 = parts[3] || '';

        function getColNums(colLetter: string): number[] {
            const colIdx = colLetter.toUpperCase().charCodeAt(0) - 65;
            const rows = table?.querySelectorAll('tbody tr') || [];
            const nums: number[] = [];
            rows.forEach(r => {
                const cell = r.children[colIdx];
                if (cell) {
                    const txt = cell.textContent?.replace(/[^0-9.-]/g, '') || '0';
                    const val = parseFloat(txt);
                    if (!isNaN(val)) nums.push(val);
                }
            });
            return nums;
        }

        function getCellVal(ref: string): { num: number; str: string } {
            const m = ref.toUpperCase().match(/^([A-Z]+)(\d+)$/);
            if (!m) {
                const num = parseFloat(ref) || 0;
                return { num, str: ref };
            }
            const colIdx = m[1].charCodeAt(0) - 65;
            const rowIdx = parseInt(m[2], 10) - 2; // Data rows start at index 0 for Row 2
            const rows = table?.querySelectorAll('tbody tr') || [];
            if (rows[rowIdx] && rows[rowIdx].children[colIdx]) {
                const text = rows[rowIdx].children[colIdx].textContent?.trim() || '';
                const num = parseFloat(text.replace(/[^0-9.-]/g, '')) || 0;
                return { num, str: text };
            }
            return { num: 0, str: '' };
        }

        let outputVal = '';
        let outputDesc = '';

        switch (fn) {
            case 'SUM': {
                const nums = getColNums(p1);
                const sum = nums.reduce((a, b) => a + b, 0);
                const dir = (p2.toUpperCase() === 'L') ? 'L' : 'R';
                outputVal = dir === 'L' ? `${sum.toLocaleString()} ${p3}` : `${p3}${sum.toLocaleString()}`;
                outputDesc = currentLang === 'en'
                    ? `Sum of numerical values in Column ${p1} = ${sum.toLocaleString()}`
                    : `कॉलम ${p1} के सभी मानों का कुल योग = ${sum.toLocaleString()}`;
                break;
            }
            case 'AVG': {
                const nums = getColNums(p1);
                const avg = nums.length ? (nums.reduce((a, b) => a + b, 0) / nums.length) : 0;
                const dir = (p2.toUpperCase() === 'L') ? 'L' : 'R';
                outputVal = dir === 'L' ? `${avg.toFixed(1)} ${p3}` : `${p3}${avg.toFixed(1)}`;
                outputDesc = currentLang === 'en'
                    ? `Arithmetic mean across Column ${p1} = ${avg.toFixed(1)}`
                    : `कॉलम ${p1} का अंकगणितीय औसत = ${avg.toFixed(1)}`;
                break;
            }
            case 'MAX': {
                const nums = getColNums(p1);
                const max = nums.length ? Math.max(...nums) : 0;
                const dir = (p2.toUpperCase() === 'L') ? 'L' : 'R';
                outputVal = dir === 'L' ? `${max.toLocaleString()} ${p3}` : `${p3}${max.toLocaleString()}`;
                outputDesc = currentLang === 'en'
                    ? `Highest recorded peak value in Column ${p1} = ${max.toLocaleString()}`
                    : `कॉलम ${p1} का उच्चतम मान = ${max.toLocaleString()}`;
                break;
            }
            case 'MIN': {
                const nums = getColNums(p1);
                const min = nums.length ? Math.min(...nums) : 0;
                const dir = (p2.toUpperCase() === 'L') ? 'L' : 'R';
                outputVal = dir === 'L' ? `${min.toLocaleString()} ${p3}` : `${p3}${min.toLocaleString()}`;
                outputDesc = currentLang === 'en'
                    ? `Lowest recorded value in Column ${p1} = ${min.toLocaleString()}`
                    : `कॉलम ${p1} का न्यूनतम मान = ${min.toLocaleString()}`;
                break;
            }
            case 'COUNT': {
                const nums = getColNums(p1);
                const count = nums.length;
                const dir = (p2.toUpperCase() === 'L') ? 'L' : 'R';
                outputVal = dir === 'L' ? `${count} ${p3}` : `${p3}${count}`;
                outputDesc = currentLang === 'en'
                    ? `Total active rows populated in Column ${p1} = ${count}`
                    : `कॉलम ${p1} में सक्रिय पंक्तियों की संख्या = ${count}`;
                break;
            }
            case 'GROWTH': {
                const vCurr = getCellVal(p1).num;
                const vPrev = getCellVal(p2).num;
                const pct = vPrev !== 0 ? (((vCurr - vPrev) / vPrev) * 100) : 0;
                const sign = pct >= 0 ? '+' : '';
                const arrow = pct >= 0 ? '▲' : '▼';
                outputVal = `${p4 || p3 || (currentLang === 'en' ? 'Growth: ' : 'वृद्धि: ')}${sign}${pct.toFixed(1)}% ${arrow}`;
                outputDesc = `(Current ${vCurr.toLocaleString()} - Prev ${vPrev.toLocaleString()}) / ${vPrev.toLocaleString()} = ${sign}${pct.toFixed(1)}%`;
                break;
            }
            case 'DIFF': {
                const v1 = getCellVal(p1).num;
                const v2 = getCellVal(p2).num;
                const diff = v1 - v2;
                const sign = diff >= 0 ? '+' : '';
                outputVal = `${p4 || p3 || (currentLang === 'en' ? 'Difference: ' : 'अंतर: ')}${sign}${diff.toLocaleString()}`;
                outputDesc = `${v1.toLocaleString()} - ${v2.toLocaleString()} = ${sign}${diff.toLocaleString()}`;
                break;
            }
            case 'PERCENT': {
                const actual = getCellVal(p1).num;
                const max = getCellVal(p2).num;
                const pct = max !== 0 ? ((actual / max) * 100) : 0;
                outputVal = `${p4 || p3 || (currentLang === 'en' ? 'Progress: ' : 'प्रगति: ')}${pct.toFixed(1)}%`;
                outputDesc = `(${actual.toLocaleString()} / ${max.toLocaleString()}) * 100 = ${pct.toFixed(1)}%`;
                break;
            }
            case 'REMAINING': {
                const goal = getCellVal(p1).num || parseFloat(p1) || 0;
                const curVal = getCellVal(p2).num || parseFloat(p2) || 0;
                const rem = Math.max(0, goal - curVal);
                outputVal = `${p4 || p3 || (currentLang === 'en' ? 'Remaining: ' : 'शेष: ')}${rem.toLocaleString()}`;
                outputDesc = `Goal (${goal.toLocaleString()}) - Current (${curVal.toLocaleString()}) = ${rem.toLocaleString()}`;
                break;
            }
            case 'STATUS': {
                const val = getCellVal(p1).num;
                const thresh = parseFloat(p2) || 80000;
                const pass = p3 || (currentLang === 'en' ? 'Passed ✅' : 'उत्तीर्ण ✅');
                const fail = p4 || (currentLang === 'en' ? 'Warning ⚠️' : 'समीक्षाधीन ⚠️');
                outputVal = (val >= thresh) ? pass : fail;
                outputDesc = `${val.toLocaleString()} >= ${thresh.toLocaleString()} ? ${outputVal}`;
                break;
            }
            case 'IF': {
                const v = getCellVal(p1).num;
                const condVal = parseFloat(p2) || 80000;
                const pass = p3 || 'True';
                const fail = p4 || 'False';
                outputVal = (v >= condVal) ? pass : fail;
                outputDesc = `${v.toLocaleString()} >= ${condVal.toLocaleString()} ? ${outputVal}`;
                break;
            }
            case 'FORMAT': {
                const v = getCellVal(p1).num || parseFloat(p1) || 0;
                const style = (p2 || 'INR').toUpperCase();
                let fmt = '';
                if (style === 'INR') fmt = '₹' + v.toLocaleString('en-IN');
                else if (style === 'USD') fmt = '$' + v.toLocaleString('en-US');
                else if (style === 'PERCENT') fmt = v.toFixed(1) + '%';
                else fmt = v.toLocaleString();
                outputVal = `${p4 || p3 || ''}${fmt}`;
                outputDesc = currentLang === 'en' ? `Formatted using ${style} standard` : `${style} मानक में स्वरूपित`;
                break;
            }
            case 'INSERT':
            default: {
                const cell = getCellVal(p1);
                const val = cell.str || cell.num;
                const dir = (p2.toUpperCase() === 'L') ? 'L' : 'R';
                outputVal = dir === 'L' ? `${val} ${p3}` : `${p3}${val}`;
                outputDesc = currentLang === 'en' ? `Extracted value from Cell ${p1}` : `सेल ${p1} से प्राप्त मान`;
                break;
            }
        }

        resultDisplay.textContent = outputVal;
        resultDesc.textContent = outputDesc;
    }

    // Attach sandbox listeners
    const presetSelect = document.getElementById('sandboxPresetSelect') as HTMLSelectElement | null;
    const formulaInput = document.getElementById('sandboxFormulaInput') as HTMLInputElement | null;
    const runBtn = document.getElementById('sandboxRunBtn');

    if (presetSelect && formulaInput) {
        presetSelect.addEventListener('change', () => {
            formulaInput.value = presetSelect.value;
            evaluateSandboxFormula();
        });
    }

    if (runBtn) {
        runBtn.addEventListener('click', evaluateSandboxFormula);
    }

    if (formulaInput) {
        formulaInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') evaluateSandboxFormula();
        });
    }

    // Live table input listeners
    const tableEl = document.getElementById('sandboxTable');
    if (tableEl) {
        tableEl.querySelectorAll('.sandbox-editable-cell').forEach(cell => {
            cell.addEventListener('input', evaluateSandboxFormula);
            cell.addEventListener('blur', evaluateSandboxFormula);
        });
    }

    // Search filter
    const searchInput = document.getElementById('globalGuideSearch') as HTMLInputElement | null;
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            const query = searchInput.value.toLowerCase().trim();
            document.querySelectorAll('.guide-topic').forEach(card => {
                const text = card.textContent?.toLowerCase() || '';
                (card as HTMLElement).style.display = (!query || text.includes(query)) ? 'block' : 'none';
            });
        });

        // Shortcut Ctrl+K
        window.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                searchInput.focus();
                searchInput.select();
            }
        });
    }

    // Set initial language
    setLanguage(currentLang);
}

// Auto-boot when DOM is ready
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initHandbookController);
    } else {
        initHandbookController();
    }
}
