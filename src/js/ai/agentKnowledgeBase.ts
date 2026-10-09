// src/js/ai/agentKnowledgeBase.ts
/**
 * Vedra BI - Formal Agent Knowledge Base Module
 * 
 * Imports and catalogs the 15+ complex formulas, mathematical mechanics,
 * business logic rules, and platform architecture defined in learning.html / learning.ts.
 * Enables the AI agent to access, search, and apply these calculations dynamically
 * during user chat interactions and dashboard orchestration.
 */

import { FORMULA_CATALOG, FormulaDoc, HandbookLang, HANDBOOK_I18N } from '../learning.ts';
import { evaluateFormula, parseFormula, FormulaEvaluationResult, FormulaFunctionType } from '../charts/templateFormulaEngine.ts';
import { applyTemplateFormula, createCustomTemplateCard, editTemplateCard } from '../charts/templateCards.ts';
import { rawData, filteredData, headers } from '../../store/DataHandler.ts';
import { visualizations } from '../charts/charts.ts';
import { showMessage } from '../core/utils.ts';
import { pushUndoSnapshot, appendMessageElement } from './chat.ts';

// -----------------------------------------------------------------------------
// Type Definitions
// -----------------------------------------------------------------------------

export interface KnowledgeFormulaParam {
    name: string;
    type: 'string' | 'number' | 'column' | 'cell_address' | 'direction' | 'expression';
    required: boolean;
    defaultVal?: string;
    desc: { en: string; hi: string };
}

export interface KnowledgeFormulaItem {
    id: string;
    fn: FormulaFunctionType;
    name: string;
    signature: string;
    category: { en: string; hi: string };
    shortDesc: { en: string; hi: string };
    syntax: string;
    supportsDirection: boolean;
    params: {
        en: KnowledgeFormulaParam[];
        hi: KnowledgeFormulaParam[];
    };
    businessLogic: {
        en: string;
        hi: string;
    };
    example: {
        code: string;
        desc: { en: string; hi: string };
        output: { en: string; hi: string };
    };
    bestVisuals: ('kpi' | 'sparkline' | 'gauge' | 'progress' | 'textbox')[];
    tags: string[];
}

export interface KnowledgeBusinessRule {
    id: string;
    title: { en: string; hi: string };
    domain: 'Finance' | 'Sales' | 'Operations' | 'Strategy' | 'Governance';
    objective: { en: string; hi: string };
    primaryFormula: string;
    formulaTemplate: string;
    businessLogicExplanation: { en: string; hi: string };
    sampleQueryTriggers: string[];
    recommendedCardType: 'kpi' | 'sparkline' | 'gauge' | 'progress' | 'textbox';
}

export interface KnowledgePlatformSpec {
    id: string;
    sectionNumber: number;
    title: { en: string; hi: string };
    summary: { en: string; hi: string };
    architectureNotes: string[];
    actionableDirectives: string[];
}

export interface DynamicCalculationResult {
    success: boolean;
    formula: string;
    fnType: string;
    display: string;
    numericValue?: number;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
    stepExplanation: string;
    businessInsight: string;
    recommendedVisual: 'kpi' | 'sparkline' | 'gauge' | 'progress' | 'textbox';
    targetColumnOrCell?: string;
    error?: string;
}

export interface KnowledgeSearchResult {
    query: string;
    matchedFormulas: KnowledgeFormulaItem[];
    matchedRules: KnowledgeBusinessRule[];
    matchedSpecs: KnowledgePlatformSpec[];
    summary: string;
}

// -----------------------------------------------------------------------------
// Formal Catalog: All 15+ Dynamic Formulas from learning.html
// -----------------------------------------------------------------------------

export const AGENT_FORMULA_CATALOG: KnowledgeFormulaItem[] = [
    {
        id: 'formula-insert',
        fn: 'INSERT',
        name: 'Live Cell / Column Coordinate Reference',
        signature: '=INSERT(Target, Direction, "Text")',
        category: { en: 'Basic Cell Reference', hi: 'मूल सेल संदर्भ' },
        shortDesc: {
            en: 'Extracts real-time value from a specific cell coordinate (e.g. A4, B2) or column and attaches it to custom text prefix/suffix.',
            hi: 'किसी विशिष्ट सेल (उदा. A4, B2) अथवा कॉलम से लाइव मान प्राप्त कर कस्टम टेक्स्ट के साथ जोड़ता है।'
        },
        syntax: '=INSERT(Target, Direction, "Text")',
        supportsDirection: true,
        params: {
            en: [
                { name: 'Target', type: 'cell_address', required: true, desc: { en: 'Cell address (e.g. A4, B2) or column header.', hi: 'सेल का पता (उदा. A4) अथवा कॉलम हेडर।' } },
                { name: 'Direction', type: 'direction', required: true, defaultVal: 'R', desc: { en: '"R" puts value on Right, "L" puts value on Left.', hi: '"R" मान दाईं ओर, "L" मान बाईं ओर रखता है।' } },
                { name: 'Text', type: 'string', required: true, desc: { en: 'Custom label prefix or suffix string.', hi: 'कस्टम लेबल उपसर्ग अथवा प्रत्यय।' } }
            ],
            hi: [
                { name: 'Target', type: 'cell_address', required: true, desc: { en: 'Cell coordinate or column.', hi: 'सेल कोऑर्डिनेट अथवा कॉलम।' } },
                { name: 'Direction', type: 'direction', required: true, defaultVal: 'R', desc: { en: '"R" / "L" दिशा।', hi: '"R" / "L" दिशा।' } },
                { name: 'Text', type: 'string', required: true, desc: { en: 'कस्टम टेक्स्ट लेबल।', hi: 'कस्टम टेक्स्ट लेबल।' } }
            ]
        },
        businessLogic: {
            en: 'Crucial for reactive executive callouts where a strategic dimension (e.g. Leader Rep, Top Region, Audit Date) must update instantaneously when grid rows change.',
            hi: 'रणनीतिक रिपोर्टिंग हेतु महत्वपूर्ण, जहाँ ग्रिड में सेल बदलते ही कार्ड पर संबंधित टेक्स्ट स्वतः रियल-टाइम अपडेट होता है।'
        },
        example: {
            code: '=INSERT(A4, R, "Leader Territory: ")',
            desc: {
                en: 'Pulls the regional territory stored in cell A4 with prefix "Leader Territory: ".',
                hi: 'सेल A4 में दर्ज क्षेत्रीय नाम को उपसर्ग के साथ प्रदर्शित करता है।'
            },
            output: {
                en: 'Leader Territory: North America',
                hi: 'Leader Territory: North America'
            }
        },
        bestVisuals: ['textbox', 'kpi'],
        tags: ['cell', 'coordinate', 'reference', 'text', 'dynamic', 'lookup']
    },
    {
        id: 'formula-sum',
        fn: 'SUM',
        name: 'Cumulative Financial & Operational Summation',
        signature: '=SUM(ColumnOrRange, Direction, "Text")',
        category: { en: 'Mathematical Aggregate', hi: 'अंकगणितीय संकलन' },
        shortDesc: {
            en: 'Calculates the cumulative sum of an entire numerical column or bounded cell range, automatically ignoring non-numeric values.',
            hi: 'संपूर्ण संख्यात्मक कॉलम या परिबद्ध सेल रेंज का कुल जोड़ निकालता है। गैर-संख्यात्मक प्रविष्टियां स्वतः छोड़ दी जाती हैं।'
        },
        syntax: '=SUM(B, R, "Total Revenue: $")',
        supportsDirection: true,
        params: {
            en: [
                { name: 'ColumnOrRange', type: 'column', required: true, desc: { en: 'Column letter (e.g. B), field name (Sales), or range (B2:B50).', hi: 'कॉलम अक्षर (B), नाम (Sales), या रेंज।' } },
                { name: 'Direction', type: 'direction', required: true, defaultVal: 'R', desc: { en: '"R" puts total on Right, "L" puts total on Left.', hi: '"R" योग दाईं ओर, "L" बाईं ओर।' } },
                { name: 'Text', type: 'string', required: true, desc: { en: 'Label prefix or currency text.', hi: 'लेबल या मुद्रा टेक्स्ट।' } }
            ],
            hi: [
                { name: 'ColumnOrRange', type: 'column', required: true, desc: { en: 'कॉलम अथवा रेंज।', hi: 'कॉलम अथवा रेंज।' } },
                { name: 'Direction', type: 'direction', required: true, defaultVal: 'R', desc: { en: 'दिशा।', hi: 'दिशा।' } },
                { name: 'Text', type: 'string', required: true, desc: { en: 'लेबल।', hi: 'लेबल।' } }
            ]
        },
        businessLogic: {
            en: 'Primary foundation of executive KPI top cards: computes Gross Inflow, Gross Margin, Cumulative Bookings, or Total Volume across active and filtered records.',
            hi: 'शीर्ष KPI कार्ड्स की रीढ़: कुल राजस्व, कुल बिक्री मात्रा या सकल बुकिंग का योग तुरंत तैयार करता है।'
        },
        example: {
            code: '=SUM(B, R, "Total Sales: $")',
            desc: {
                en: 'Computes total quarterly revenue across all records in Column B.',
                hi: 'कॉलम B के सभी रिकॉर्ड्स की कुल बिक्री का योग निकालता है।'
            },
            output: {
                en: 'Total Sales: $338,000',
                hi: 'Total Sales: $338,000'
            }
        },
        bestVisuals: ['kpi', 'sparkline'],
        tags: ['sum', 'total', 'aggregate', 'revenue', 'addition', 'cumulative']
    },
    {
        id: 'formula-avg',
        fn: 'AVG',
        name: 'Statistical Mean & Baseline Order Value',
        signature: '=AVG(ColumnOrRange, Direction, "Text")',
        category: { en: 'Statistical Mean', hi: 'सांख्यिकीय औसत' },
        shortDesc: {
            en: 'Computes the arithmetic mean (Sum / Count) across valid numerical rows in a column or range.',
            hi: 'कॉलम अथवा रेंज के सभी मान्य संख्यात्मक मानों का अंकगणितीय औसत निकालता है।'
        },
        syntax: '=AVG(B, R, "Average Sales: $")',
        supportsDirection: true,
        params: {
            en: [
                { name: 'ColumnOrRange', type: 'column', required: true, desc: { en: 'Column letter or bounded range.', hi: 'कॉलम अथवा रेंज।' } },
                { name: 'Direction', type: 'direction', required: true, defaultVal: 'R', desc: { en: '"R" or "L".', hi: '"R" अथवा "L"।' } },
                { name: 'Text', type: 'string', required: true, desc: { en: 'Descriptive prefix label.', hi: 'वर्णनात्मक उपसर्ग लेबल।' } }
            ],
            hi: [
                { name: 'ColumnOrRange', type: 'column', required: true, desc: { en: 'कॉलम अथवा रेंज।', hi: 'कॉलम अथवा रेंज।' } },
                { name: 'Direction', type: 'direction', required: true, defaultVal: 'R', desc: { en: 'दिशा।', hi: 'दिशा।' } },
                { name: 'Text', type: 'string', required: true, desc: { en: 'लेबल।', hi: 'लेबल।' } }
            ]
        },
        businessLogic: {
            en: 'Standard benchmarking metric: evaluates Average Order Value (AOV), Mean Deal Size, Average Tenure, or Mean SLA Resolution Time.',
            hi: 'औसत ऑर्डर मूल्य (AOV), प्रतिनिधि औसत लेनदेन, अथवा औसत चक्र समय का सटीक निर्धारण करता है।'
        },
        example: {
            code: '=AVG(B, R, "Average Sales: $")',
            desc: {
                en: 'Computes mean performance across all regional sales accounts.',
                hi: 'सभी क्षेत्रीय बिक्री खातों का औसत प्रदर्शन निकालता है।'
            },
            output: {
                en: 'Average Sales: $84,500',
                hi: 'Average Sales: $84,500'
            }
        },
        bestVisuals: ['kpi', 'sparkline'],
        tags: ['avg', 'average', 'mean', 'benchmark', 'order value', 'aov']
    },
    {
        id: 'formula-max',
        fn: 'MAX',
        name: 'Peak Value & Upper-Bound Outlier Discovery',
        signature: '=MAX(ColumnOrRange, Direction, "Text")',
        category: { en: 'Extreme Value', hi: 'उच्चतम मान' },
        shortDesc: {
            en: 'Identifies the highest numerical peak or outlier transaction within the targeted column or cell range.',
            hi: 'लक्षित कॉलम अथवा सेल रेंज में सबसे उच्चतम संख्यात्मक शिखर या सबसे बड़े सौदे को खोजता है।'
        },
        syntax: '=MAX(B, R, "Peak Deal: $")',
        supportsDirection: true,
        params: {
            en: [
                { name: 'ColumnOrRange', type: 'column', required: true, desc: { en: 'Target numeric column or range.', hi: 'लक्षित संख्यात्मक कॉलम अथवा रेंज।' } },
                { name: 'Direction', type: 'direction', required: true, defaultVal: 'R', desc: { en: '"R" or "L".', hi: '"R" अथवा "L"।' } },
                { name: 'Text', type: 'string', required: true, desc: { en: 'Prefix label.', hi: 'उपसर्ग लेबल।' } }
            ],
            hi: [
                { name: 'ColumnOrRange', type: 'column', required: true, desc: { en: 'कॉलम।', hi: 'कॉलम।' } },
                { name: 'Direction', type: 'direction', required: true, defaultVal: 'R', desc: { en: 'दिशा।', hi: 'दिशा।' } },
                { name: 'Text', type: 'string', required: true, desc: { en: 'लेबल।', hi: 'लेबल।' } }
            ]
        },
        businessLogic: {
            en: 'Pinpoints single largest enterprise transaction, peak monthly traffic spike, or capacity upper boundary for stress testing.',
            hi: 'सबसे बड़े एकल सौदे, शीर्ष मासिक रिकॉर्ड अथवा अधिकतम क्षमता सीमा की त्वरित पहचान।'
        },
        example: {
            code: '=MAX(B, R, "Peak Deal: $")',
            desc: {
                en: 'Finds the single highest transaction value in Column B.',
                hi: 'कॉलम B में सबसे उच्चतम लेनदेन मान खोजता है।'
            },
            output: {
                en: 'Peak Deal: $120,000',
                hi: 'Peak Deal: $120,000'
            }
        },
        bestVisuals: ['kpi'],
        tags: ['max', 'peak', 'highest', 'ceiling', 'upper bound', 'leader']
    },
    {
        id: 'formula-min',
        fn: 'MIN',
        name: 'Lowest Outflow & Cost Floor Analysis',
        signature: '=MIN(ColumnOrRange, Direction, "Text")',
        category: { en: 'Extreme Value', hi: 'न्यूनतम मान' },
        shortDesc: {
            en: 'Finds the smallest positive or negative numerical value across the specified column or range.',
            hi: 'निर्दिष्ट कॉलम अथवा रेंज में सबसे न्यूनतम संख्यात्मक मान या सबसे कम खर्च को खोजता है।'
        },
        syntax: '=MIN(D, R, "Lowest Cost: $")',
        supportsDirection: true,
        params: {
            en: [
                { name: 'ColumnOrRange', type: 'column', required: true, desc: { en: 'Target numeric column or range.', hi: 'लक्षित संख्यात्मक कॉलम अथवा रेंज।' } },
                { name: 'Direction', type: 'direction', required: true, defaultVal: 'R', desc: { en: '"R" or "L".', hi: '"R" अथवा "L"।' } },
                { name: 'Text', type: 'string', required: true, desc: { en: 'Prefix label.', hi: 'उपसर्ग लेबल।' } }
            ],
            hi: [
                { name: 'ColumnOrRange', type: 'column', required: true, desc: { en: 'कॉलम।', hi: 'कॉलम।' } },
                { name: 'Direction', type: 'direction', required: true, defaultVal: 'R', desc: { en: 'दिशा।', hi: 'दिशा।' } },
                { name: 'Text', type: 'string', required: true, desc: { en: 'लेबल।', hi: 'लेबल।' } }
            ]
        },
        businessLogic: {
            en: 'Identifies cost floors, lowest regional overhead, minimum deal sizes, or bottleneck throughput metrics.',
            hi: 'लागत का न्यूनतम स्तर, सबसे कम विभागीय व्यय अथवा न्यूनतम सीमा की पहचान करता है।'
        },
        example: {
            code: '=MIN(D, R, "Lowest Cost: $")',
            desc: {
                en: 'Locates lowest operational expenditure across all departments.',
                hi: 'सभी विभागों में न्यूनतम परिचालन व्यय को ढूंढता है।'
            },
            output: {
                en: 'Lowest Cost: $28,000',
                hi: 'Lowest Cost: $28,000'
            }
        },
        bestVisuals: ['kpi'],
        tags: ['min', 'lowest', 'floor', 'cost', 'minimum', 'smallest']
    },
    {
        id: 'formula-count',
        fn: 'COUNT',
        name: 'Population Cardinality & Active Entity Frequency',
        signature: '=COUNT(ColumnOrRange, Direction, "Text")',
        category: { en: 'Record Frequency', hi: 'रिकॉर्ड गणना' },
        shortDesc: {
            en: 'Counts the number of active, non-empty rows within the designated column or range.',
            hi: 'नामित कॉलम अथवा रेंज में सक्रिय, गैर-रिक्त पंक्तियों की कुल संख्या गिनता है।'
        },
        syntax: '=COUNT(A, R, "Active Regions: ")',
        supportsDirection: true,
        params: {
            en: [
                { name: 'ColumnOrRange', type: 'column', required: true, desc: { en: 'Column letter or range to count.', hi: 'कॉलम अथवा रेंज।' } },
                { name: 'Direction', type: 'direction', required: true, defaultVal: 'R', desc: { en: '"R" or "L".', hi: '"R" अथवा "L"।' } },
                { name: 'Text', type: 'string', required: true, desc: { en: 'Label string.', hi: 'लेबल स्ट्रिंग।' } }
            ],
            hi: [
                { name: 'ColumnOrRange', type: 'column', required: true, desc: { en: 'कॉलम।', hi: 'कॉलम।' } },
                { name: 'Direction', type: 'direction', required: true, defaultVal: 'R', desc: { en: 'दिशा।', hi: 'दिशा।' } },
                { name: 'Text', type: 'string', required: true, desc: { en: 'लेबल।', hi: 'लेबल।' } }
            ]
        },
        businessLogic: {
            en: 'Audits sample sizes, active client counts, open trouble tickets, or geographical market footprint.',
            hi: 'सक्रिय ग्राहकों की कुल संख्या, खुले टिकट्स अथवा बाजारों के विस्तार की सटीक गिनती।'
        },
        example: {
            code: '=COUNT(A, R, "Active Regions: ")',
            desc: {
                en: 'Counts total unique regional operational centers in Column A.',
                hi: 'कॉलम A में मौजूद कुल क्षेत्रीय परिचालन केंद्रों की गणना करता है।'
            },
            output: {
                en: 'Active Regions: 4',
                hi: 'Active Regions: 4'
            }
        },
        bestVisuals: ['kpi'],
        tags: ['count', 'records', 'frequency', 'rows', 'cardinality']
    },
    {
        id: 'formula-growth',
        fn: 'GROWTH',
        name: 'Period-over-Period Variance & Momentum (QoQ / MoM / YoY)',
        signature: '=GROWTH(Current, Prev, Direction, "Text")',
        category: { en: 'Variance & Momentum', hi: 'वृद्धि एवं गतिशीलता' },
        shortDesc: {
            en: 'Calculates percentage change between two values or cells: ((Current - Prev) / Prev) * 100 with dynamic indicator arrows (▲ / ▼).',
            hi: 'दो मानों या सेलों के बीच प्रतिशत वृद्धि दर निकालता है: ((Current - Prev) / Prev) * 100 और गतिशील तीर (▲ / ▼) जोड़ता है।'
        },
        syntax: '=GROWTH(C2, B2, R, "Growth: ")',
        supportsDirection: true,
        params: {
            en: [
                { name: 'Current', type: 'cell_address', required: true, desc: { en: 'Current period cell or value (e.g. C2).', hi: 'वर्तमान अवधि का सेल अथवा मान।' } },
                { name: 'Prev', type: 'cell_address', required: true, desc: { en: 'Prior period baseline cell or value (e.g. B2).', hi: 'पिछली आधार अवधि का सेल अथवा मान।' } },
                { name: 'Direction', type: 'direction', required: true, defaultVal: 'R', desc: { en: '"R" or "L".', hi: '"R" अथवा "L"।' } },
                { name: 'Text', type: 'string', required: true, desc: { en: 'Prefix label.', hi: 'उपसर्ग लेबल।' } }
            ],
            hi: [
                { name: 'Current', type: 'cell_address', required: true, desc: { en: 'वर्तमान अवधि मान।', hi: 'वर्तमान अवधि मान।' } },
                { name: 'Prev', type: 'cell_address', required: true, desc: { en: 'पिछली आधार अवधि।', hi: 'पिछली आधार अवधि।' } },
                { name: 'Direction', type: 'direction', required: true, defaultVal: 'R', desc: { en: 'दिशा।', hi: 'दिशा।' } },
                { name: 'Text', type: 'string', required: true, desc: { en: 'लेबल।', hi: 'लेबल।' } }
            ]
        },
        businessLogic: {
            en: 'Vital for executive boardroom reporting: captures acceleration or deceleration in sales velocity, quarterly growth, or YoY user expansion.',
            hi: 'बोर्डरूम रिपोर्टिंग हेतु अनिवार्य: बिक्री गतिशीलता, तिमाही वृद्धि अथवा वार्षिक उपयोगकर्ता विस्तार का प्रतिशत तीर संकेतक सहित।'
        },
        example: {
            code: '=GROWTH(C2, B2, R, "Growth: ")',
            desc: {
                en: 'Evaluates quarterly expansion from $85,000 (B2) to $95,000 (C2).',
                hi: '$85,000 (B2) से $95,000 (C2) के बीच तिमाही वृद्धि दर मापता है।'
            },
            output: {
                en: 'Growth: +11.8% ▲',
                hi: 'Growth: +11.8% ▲'
            }
        },
        bestVisuals: ['kpi', 'sparkline'],
        tags: ['growth', 'mom', 'qoq', 'yoy', 'variance', 'momentum', 'arrow', 'trend']
    },
    {
        id: 'formula-diff',
        fn: 'DIFF',
        name: 'Absolute Delta & Net Profit Margin',
        signature: '=DIFF(Target1, Target2, Direction, "Text")',
        category: { en: 'Variance Analysis', hi: 'अंतर विश्लेषण' },
        shortDesc: {
            en: 'Computes the absolute difference (Target1 - Target2) between two metrics, automatically formatting positive (+) or negative (-) signs.',
            hi: 'दो मेट्रिक्स के बीच वास्तविक अंतर (Target1 - Target2) की गणना करता है और धनात्मक (+) या ऋणात्मक (-) चिह्न प्रदर्शित करता है।'
        },
        syntax: '=DIFF(C2, D2, R, "Net Margin: $")',
        supportsDirection: true,
        params: {
            en: [
                { name: 'Target1', type: 'cell_address', required: true, desc: { en: 'First cell or column (e.g. C2 Revenue).', hi: 'पहला सेल या कॉलम (आय)।' } },
                { name: 'Target2', type: 'cell_address', required: true, desc: { en: 'Second cell or column (e.g. D2 Cost).', hi: 'दूसरा सेल या कॉलम (लागत)।' } },
                { name: 'Direction', type: 'direction', required: true, defaultVal: 'R', desc: { en: '"R" or "L".', hi: '"R" अथवा "L"।' } },
                { name: 'Text', type: 'string', required: true, desc: { en: 'Label prefix.', hi: 'उपसर्ग लेबल।' } }
            ],
            hi: [
                { name: 'Target1', type: 'cell_address', required: true, desc: { en: 'पहला मान।', hi: 'पहला मान।' } },
                { name: 'Target2', type: 'cell_address', required: true, desc: { en: 'दूसरा मान।', hi: 'दूसरा मान।' } },
                { name: 'Direction', type: 'direction', required: true, defaultVal: 'R', desc: { en: 'दिशा।', hi: 'दिशा।' } },
                { name: 'Text', type: 'string', required: true, desc: { en: 'लेबल।', hi: 'लेबल।' } }
            ]
        },
        businessLogic: {
            en: 'Directly computes Net Profit (Revenue - Expense), Budget Variance (Actual - Plan), or Inventory Surplus/Deficit.',
            hi: 'शुद्ध लाभ (राजस्व - व्यय), बजट विचरण (वास्तविक - अनुमानित), अथवा इन्वेंटरी शेष की सीधी गणना।'
        },
        example: {
            code: '=DIFF(C2, D2, R, "Net Margin: $")',
            desc: {
                en: 'Subtracts Q2 expenses ($32,000) from Q2 sales ($95,000).',
                hi: 'Q2 बिक्री ($95,000) से Q2 खर्च ($32,000) घटाकर लाभ निकालता है।'
            },
            output: {
                en: 'Net Margin: +$63,000',
                hi: 'Net Margin: +$63,000'
            }
        },
        bestVisuals: ['kpi', 'sparkline'],
        tags: ['diff', 'difference', 'delta', 'margin', 'profit', 'variance', 'net']
    },
    {
        id: 'formula-percent',
        fn: 'PERCENT',
        name: 'Target Quota Attainment & Speedometer Ratio',
        signature: '=PERCENT(Actual, Max, Direction, "Text")',
        category: { en: 'Target Achievement', hi: 'लक्ष्य प्राप्ति प्रतिशत' },
        shortDesc: {
            en: 'Calculates the quota fulfillment ratio: (Actual / Max) * 100%, ideal for progress bars and speedometer gauges.',
            hi: 'कोटा पूर्ति अनुपात निकालता है: (Actual / Max) * 100%, जो प्रोग्रेस बार और स्पीडोमीटर गेज हेतु सर्वोत्तम है।'
        },
        syntax: '=PERCENT(B2, E2, R, "Attainment: ")',
        supportsDirection: true,
        params: {
            en: [
                { name: 'Actual', type: 'cell_address', required: true, desc: { en: 'Achieved metric cell or value.', hi: 'प्राप्त वास्तविक प्रदर्शन मान।' } },
                { name: 'Max', type: 'number', required: true, desc: { en: 'Total benchmark target quota or capacity.', hi: 'कुल बेंचमार्क लक्ष्य अथवा क्षमता।' } },
                { name: 'Direction', type: 'direction', required: true, defaultVal: 'R', desc: { en: '"R" or "L".', hi: '"R" अथवा "L"।' } },
                { name: 'Text', type: 'string', required: true, desc: { en: 'Prefix label.', hi: 'उपसर्ग लेबल।' } }
            ],
            hi: [
                { name: 'Actual', type: 'cell_address', required: true, desc: { en: 'वास्तविक मान।', hi: 'वास्तविक मान।' } },
                { name: 'Max', type: 'number', required: true, desc: { en: 'लक्ष्य।', hi: 'लक्ष्य।' } },
                { name: 'Direction', type: 'direction', required: true, defaultVal: 'R', desc: { en: 'दिशा।', hi: 'दिशा।' } },
                { name: 'Text', type: 'string', required: true, desc: { en: 'लेबल।', hi: 'लेबल।' } }
            ]
        },
        businessLogic: {
            en: 'Determines pacing toward quarterly quotas: drives dynamic Gauge and Progress Bar visualizations with 0-100%+ color ranges.',
            hi: 'तिमाही लक्ष्यों की गति मापता है: डायनामिक गेज और प्रोग्रेस बार को 0-100%+ रेंज के साथ नियंत्रित करता है।'
        },
        example: {
            code: '=PERCENT(B2, E2, R, "Attainment: ")',
            desc: {
                en: 'Checks progress of $85,000 achieved against $100,000 target.',
                hi: '$100,000 के लक्ष्य के मुकाबले प्राप्त $85,000 की प्रगति की जांच करता है।'
            },
            output: {
                en: 'Attainment: 85.0%',
                hi: 'Attainment: 85.0%'
            }
        },
        bestVisuals: ['gauge', 'progress', 'kpi'],
        tags: ['percent', 'attainment', 'quota', 'progress', 'gauge', 'ratio']
    },
    {
        id: 'formula-remaining',
        fn: 'REMAINING',
        name: 'Target Deficit & Gap-to-Goal Shortfall',
        signature: '=REMAINING(Goal, Current, Direction, "Text")',
        category: { en: 'Target Deficit', hi: 'लक्ष्य शेष अंतर' },
        shortDesc: {
            en: 'Calculates the remaining delta required to reach a specific quota: Math.max(0, Goal - Current).',
            hi: 'किसी निश्चित लक्ष्य तक पहुंचने के लिए शेष आवश्यक राशि की गणना करता है: Math.max(0, Goal - Current)।'
        },
        syntax: '=REMAINING(E2, B2, R, "Goal Deficit: $")',
        supportsDirection: true,
        params: {
            en: [
                { name: 'Goal', type: 'cell_address', required: true, desc: { en: 'Target goal cell or number.', hi: 'लक्ष्य सेल अथवा संख्या।' } },
                { name: 'Current', type: 'cell_address', required: true, desc: { en: 'Current progress cell or number.', hi: 'वर्तमान प्रगति सेल अथवा संख्या।' } },
                { name: 'Direction', type: 'direction', required: true, defaultVal: 'R', desc: { en: '"R" or "L".', hi: '"R" अथवा "L"।' } },
                { name: 'Text', type: 'string', required: true, desc: { en: 'Prefix label.', hi: 'उपसर्ग लेबल।' } }
            ],
            hi: [
                { name: 'Goal', type: 'cell_address', required: true, desc: { en: 'लक्ष्य।', hi: 'लक्ष्य।' } },
                { name: 'Current', type: 'cell_address', required: true, desc: { en: 'वर्तमान मान।', hi: 'वर्तमान मान।' } },
                { name: 'Direction', type: 'direction', required: true, defaultVal: 'R', desc: { en: 'दिशा।', hi: 'दिशा।' } },
                { name: 'Text', type: 'string', required: true, desc: { en: 'लेबल।', hi: 'लेबल।' } }
            ]
        },
        businessLogic: {
            en: 'Calculates the pipeline gap needed before end-of-period: automatically clamps to 0 once target is exceeded so negative deficits do not alarm stakeholders.',
            hi: 'अवधि समाप्त होने से पूर्व आवश्यक शेष बिक्री की गणना: लक्ष्य पूरा होने पर स्वतः 0 पर रुकता है।'
        },
        example: {
            code: '=REMAINING(E2, B2, R, "Goal Deficit: $")',
            desc: {
                en: 'Computes shortfall when goal is $100,000 and current is $85,000.',
                hi: 'जब लक्ष्य $100,000 और वर्तमान बिक्री $85,000 हो, तो शेष अंतर निकालता है।'
            },
            output: {
                en: 'Goal Deficit: $15,000',
                hi: 'Goal Deficit: $15,000'
            }
        },
        bestVisuals: ['kpi'],
        tags: ['remaining', 'shortfall', 'deficit', 'gap', 'goal', 'quota']
    },
    {
        id: 'formula-status',
        fn: 'STATUS',
        name: 'Automated Threshold Alert & Dynamic Status Badging',
        signature: '=STATUS(Target, Threshold, "PassText", "FailText")',
        category: { en: 'Conditional Alert', hi: 'शर्त आधारित चेतावनी' },
        shortDesc: {
            en: 'Evaluates whether a value meets or exceeds a defined threshold, returning user-defined status badges or emoji indicators.',
            hi: 'मूल्यांकन करता है कि क्या कोई मान निर्धारित बेंचमार्क को पूरा करता है, और कस्टम बैज या इमोजी संकेतक लौटाता है।'
        },
        syntax: '=STATUS(B2, 80000, "Qualified ✅", "Disqualified ❌")',
        supportsDirection: false,
        params: {
            en: [
                { name: 'Target', type: 'cell_address', required: true, desc: { en: 'Cell or metric to benchmark.', hi: 'बेंचमार्क हेतु सेल अथवा मेट्रिक।' } },
                { name: 'Threshold', type: 'number', required: true, desc: { en: 'Cutoff numerical threshold.', hi: 'कटऑफ़ संख्यात्मक सीमा।' } },
                { name: 'PassText', type: 'string', required: true, desc: { en: 'Display string when Target >= Threshold.', hi: 'शर्त पूरी होने पर प्रदर्शित टेक्स्ट।' } },
                { name: 'FailText', type: 'string', required: true, desc: { en: 'Display string when Target < Threshold.', hi: 'शर्त पूरी न होने पर प्रदर्शित टेक्स्ट।' } }
            ],
            hi: [
                { name: 'Target', type: 'cell_address', required: true, desc: { en: 'सेल।', hi: 'सेल।' } },
                { name: 'Threshold', type: 'number', required: true, desc: { en: 'सीमा मान।', hi: 'सीमा मान।' } },
                { name: 'PassText', type: 'string', required: true, desc: { en: 'सफल टेक्स्ट।', hi: 'सफल टेक्स्ट।' } },
                { name: 'FailText', type: 'string', required: true, desc: { en: 'असफल टेक्स्ट।', hi: 'असफल टेक्स्ट।' } }
            ]
        },
        businessLogic: {
            en: 'Operational SLA verification: marks accounts as "Qualified ✅" vs "Disqualified ❌", or "On Track 🟢" vs "At Risk 🔴".',
            hi: 'परिचालन SLA व गुणवत्ता जांच: खातों को "Qualified ✅", "On Track 🟢" या "At Risk 🔴" बैज प्रदान करता है।'
        },
        example: {
            code: '=STATUS(B2, 80000, "Qualified ✅", "Disqualified ❌")',
            desc: {
                en: 'Validates if Region North sales ($85,000) exceeded $80,000 sales hurdle.',
                hi: 'जांचता है कि क्या उत्तरी क्षेत्र की बिक्री ($85,000) $80,000 की सीमा से अधिक है।'
            },
            output: {
                en: 'Qualified ✅',
                hi: 'Qualified ✅'
            }
        },
        bestVisuals: ['kpi', 'textbox'],
        tags: ['status', 'badge', 'threshold', 'sla', 'alert', 'pass', 'fail']
    },
    {
        id: 'formula-if',
        fn: 'IF',
        name: 'Excel-Grade Relational Branching & Classification',
        signature: '=IF(Condition, "TrueText", "FalseText")',
        category: { en: 'Boolean Branching', hi: 'लॉजिकल शाखाएं' },
        shortDesc: {
            en: 'Executes relational comparisons (e.g. B2 > 80000) and returns distinct conditional branches.',
            hi: 'एक्सेल शैली की तार्किक शर्तों (उदा. B2 > 80000) का मूल्यांकन करता है और भिन्न परिणाम लौटाता है।'
        },
        syntax: '=IF(B2>80000, "Tier 1 Partner", "Tier 2 Partner")',
        supportsDirection: false,
        params: {
            en: [
                { name: 'Condition', type: 'expression', required: true, desc: { en: 'Comparison statement (e.g. B2 > 80000).', hi: 'तुलना अभिव्यक्ति (उदा. B2 > 80000)।' } },
                { name: 'TrueText', type: 'string', required: true, desc: { en: 'Value returned if condition is true.', hi: 'शर्त सत्य होने पर मान।' } },
                { name: 'FalseText', type: 'string', required: true, desc: { en: 'Value returned if condition is false.', hi: 'शर्त असत्य होने पर मान।' } }
            ],
            hi: [
                { name: 'Condition', type: 'expression', required: true, desc: { en: 'शर्त।', hi: 'शर्त।' } },
                { name: 'TrueText', type: 'string', required: true, desc: { en: 'सत्य मान।', hi: 'सत्य मान।' } },
                { name: 'FalseText', type: 'string', required: true, desc: { en: 'असत्य मान।', hi: 'असत्य मान।' } }
            ]
        },
        businessLogic: {
            en: 'Segment categorization: assigns accounts to Platinum vs Standard tiers, Commission Bonus vs Base Pay, or High vs Low Risk.',
            hi: 'रणनीतिक वर्गीकरण: खातों को प्लैटिनम या मानक स्तर, बोनस या बेस पे में स्वतः वर्गीकृत करता है।'
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
        },
        bestVisuals: ['kpi', 'textbox'],
        tags: ['if', 'conditional', 'logic', 'tier', 'branch', 'boolean']
    },
    {
        id: 'formula-latest',
        fn: 'LATEST',
        name: 'Streaming Bottom-Record & Real-Time Inflow Capture',
        signature: '=LATEST(ColumnName, Direction, "Text")',
        category: { en: 'Streaming Row Capture', hi: 'नवीनतम पंक्ति मान' },
        shortDesc: {
            en: 'Retrieves the most recent record (bottom-most row) from the specified column, perfect for live data feeds.',
            hi: 'निर्दिष्ट कॉलम से सबसे हालिया रिकॉर्ड (अंतिम पंक्ति) प्राप्त करता है, जो लाइव डेटा फीड के लिए उत्तम है।'
        },
        syntax: '=LATEST(B, R, "Latest Inflow: $")',
        supportsDirection: true,
        params: {
            en: [
                { name: 'ColumnName', type: 'column', required: true, desc: { en: 'Column letter or field header.', hi: 'कॉलम अक्षर अथवा हेडर।' } },
                { name: 'Direction', type: 'direction', required: true, defaultVal: 'R', desc: { en: '"R" or "L".', hi: '"R" अथवा "L"।' } },
                { name: 'Text', type: 'string', required: true, desc: { en: 'Prefix label.', hi: 'उपसर्ग लेबल।' } }
            ],
            hi: [
                { name: 'ColumnName', type: 'column', required: true, desc: { en: 'कॉलम।', hi: 'कॉलम।' } },
                { name: 'Direction', type: 'direction', required: true, defaultVal: 'R', desc: { en: 'दिशा।', hi: 'दिशा।' } },
                { name: 'Text', type: 'string', required: true, desc: { en: 'लेबल।', hi: 'लेबल।' } }
            ]
        },
        businessLogic: {
            en: 'Connects with automated IoT or Google Sheets live polling: continuously surfaces the most recent transaction without needing manual refresh.',
            hi: 'लाइव पोलिंग व IoT स्ट्रीम्स के साथ काम करता है: बिना रीलोड किए अंतिम लेनदेन का मान तुरंत दिखाता है।'
        },
        example: {
            code: '=LATEST(B, R, "Most Recent: $")',
            desc: {
                en: 'Extracts the last entry from Column B (e.g., Row 5 = $68,000).',
                hi: 'कॉलम B से अंतिम प्रविष्टि ($68,000) निकालता है।'
            },
            output: {
                en: 'Most Recent: $68,000',
                hi: 'Most Recent: $68,000'
            }
        },
        bestVisuals: ['kpi'],
        tags: ['latest', 'recent', 'bottom', 'stream', 'live', 'inflow']
    },
    {
        id: 'formula-top',
        fn: 'TOP',
        name: 'Leaderboard Ranking & Rank-N Champion Retrieval',
        signature: '=TOP(ColumnName, N, Direction, "Text")',
        category: { en: 'Leaderboard Ranking', hi: 'शीर्ष रैंक मान' },
        shortDesc: {
            en: 'Returns the N-th highest ranked value or associated category label from a designated metric column.',
            hi: 'नामित मेट्रिक कॉलम में से N-वें उच्चतम रैंक वाले मान अथवा संबंधित श्रेणी लेबल को लौटाता है।'
        },
        syntax: '=TOP(B, 1, R, "Leader Sales: $")',
        supportsDirection: true,
        params: {
            en: [
                { name: 'ColumnName', type: 'column', required: true, desc: { en: 'Numerical column to rank.', hi: 'रैंकिंग हेतु संख्यात्मक कॉलम।' } },
                { name: 'N', type: 'number', required: true, defaultVal: '1', desc: { en: 'Rank position (1 for top, 2 for second, etc.).', hi: 'रैंक स्थान (1 शीर्ष, 2 द्वितीय)।' } },
                { name: 'Direction', type: 'direction', required: true, defaultVal: 'R', desc: { en: '"R" or "L".', hi: '"R" अथवा "L"।' } },
                { name: 'Text', type: 'string', required: true, desc: { en: 'Prefix label.', hi: 'उपसर्ग लेबल।' } }
            ],
            hi: [
                { name: 'ColumnName', type: 'column', required: true, desc: { en: 'कॉलम।', hi: 'कॉलम।' } },
                { name: 'N', type: 'number', required: true, defaultVal: '1', desc: { en: 'रैंक नंबर।', hi: 'रैंक नंबर।' } },
                { name: 'Direction', type: 'direction', required: true, defaultVal: 'R', desc: { en: 'दिशा।', hi: 'दिशा।' } },
                { name: 'Text', type: 'string', required: true, desc: { en: 'लेबल।', hi: 'लेबल।' } }
            ]
        },
        businessLogic: {
            en: 'Drives competitive sales leaderboards: extracts Gold, Silver, and Bronze sales rep numbers or top product lines.',
            hi: 'प्रतियोगी बिक्री लीडरबोर्ड का निर्माण: शीर्ष #1, #2 अथवा #3 प्रदर्शनकारी उत्पाद या प्रतिनिधि का मान निकालता है।'
        },
        example: {
            code: '=TOP(B, 1, R, "Leader Sales: $")',
            desc: {
                en: 'Identifies highest single sales volume across all regional teams ($120,000).',
                hi: 'सभी क्षेत्रीय टीमों में सबसे अधिक एकल बिक्री मात्रा ($120,000) निकालता है।'
            },
            output: {
                en: 'Leader Sales: $120,000',
                hi: 'Leader Sales: $120,000'
            }
        },
        bestVisuals: ['kpi'],
        tags: ['top', 'rank', 'leader', 'champion', 'gold', 'highest', 'order']
    },
    {
        id: 'formula-format',
        fn: 'FORMAT',
        name: 'International Financial Currency & Number Localization',
        signature: '=FORMAT(Target, "Style", Direction, "Text")',
        category: { en: 'Currency & Number Styling', hi: 'मुद्रा एवं संख्या स्वरूपण' },
        shortDesc: {
            en: 'Formats numerical metrics into international standards such as Indian Rupee (INR = ₹4,82,500), US Dollar (USD = $482,500), Euro (EUR), or Percentage.',
            hi: 'संख्याओं को अंतरराष्ट्रीय मानकों जैसे भारतीय रुपया (INR = ₹4,82,500), अमेरिकी डॉलर (USD = $482,500), यूरो (EUR), या प्रतिशत में स्वरूपित करता है।'
        },
        syntax: '=FORMAT(B4, "INR", R, "Net: ")',
        supportsDirection: true,
        params: {
            en: [
                { name: 'Target', type: 'cell_address', required: true, desc: { en: 'Cell address or raw number to format.', hi: 'सेल अथवा संख्या।' } },
                { name: 'Style', type: 'string', required: true, defaultVal: 'INR', desc: { en: '"INR" (₹ Lakh/Crore), "USD" ($), "EUR" (€), or "PERCENT".', hi: '"INR" (₹), "USD" ($), "EUR" (€), या "PERCENT"।' } },
                { name: 'Direction', type: 'direction', required: true, defaultVal: 'R', desc: { en: '"R" or "L".', hi: '"R" अथवा "L"।' } },
                { name: 'Text', type: 'string', required: true, desc: { en: 'Prefix label.', hi: 'उपसर्ग लेबल।' } }
            ],
            hi: [
                { name: 'Target', type: 'cell_address', required: true, desc: { en: 'टारगेट सेल।', hi: 'टारगेट सेल।' } },
                { name: 'Style', type: 'string', required: true, defaultVal: 'INR', desc: { en: 'मुद्रा स्टाइल।', hi: 'मुद्रा स्टाइल।' } },
                { name: 'Direction', type: 'direction', required: true, defaultVal: 'R', desc: { en: 'दिशा।', hi: 'दिशा।' } },
                { name: 'Text', type: 'string', required: true, desc: { en: 'लेबल।', hi: 'लेबल।' } }
            ]
        },
        businessLogic: {
            en: 'Critical for regional compliance: automatically groups thousands in Indian numbering system (Lakhs and Crores) or Western system (Millions).',
            hi: 'क्षेत्रीय मानकों के अनुकूल: भारतीय संख्या प्रणाली (लाख और करोड़) अथवा पश्चिमी प्रणाली में स्वचालित अल्पविराम व मुद्रा प्रतीक।'
        },
        example: {
            code: '=FORMAT(B4, "INR", R, "Net: ")',
            desc: {
                en: 'Converts 120000 into Indian currency notation (Net: ₹1,20,000).',
                hi: '120000 को भारतीय रुपया प्रणाली (Net: ₹1,20,000) में स्वरूपित करता है।'
            },
            output: {
                en: 'Net: ₹1,20,000',
                hi: 'Net: ₹1,20,000'
            }
        },
        bestVisuals: ['kpi', 'textbox'],
        tags: ['format', 'inr', 'usd', 'eur', 'currency', 'lakh', 'crore', 'rupee', 'dollar']
    }
];

// -----------------------------------------------------------------------------
// Formal Catalog: Core Business Logic Rules & KPI Frameworks
// -----------------------------------------------------------------------------

export const AGENT_BUSINESS_RULES: KnowledgeBusinessRule[] = [
    {
        id: 'rule-gross-margin',
        title: { en: 'Gross Margin & Profitability Analysis', hi: 'सकल मार्जिन एवं शुद्ध लाभ विश्लेषण' },
        domain: 'Finance',
        objective: { en: 'Calculate real profit spread between revenue and costs with absolute and percentage margins.', hi: 'राजस्व और लागत के बीच वास्तविक लाभ का अंतर व मार्जिन प्रतिशत निकालना।' },
        primaryFormula: 'DIFF',
        formulaTemplate: '=DIFF({RevenueCol}, {CostCol}, R, "Net Margin: ₹")',
        businessLogicExplanation: {
            en: 'Net Margin = Revenue - Cost. High gross margin indicates strong pricing power and operational efficiency. Negative variance signals cost overruns.',
            hi: 'शुद्ध मार्जिन = राजस्व - प्रत्यक्ष लागत। धनात्मक मार्जिन स्वस्थ व्यावसायिक विकास दर्शाता है, जबकि ऋणात्मक मान परिचालन हानि दर्शाता है।'
        },
        sampleQueryTriggers: ['gross margin', 'profit margin', 'profitability', 'मार्जिन निकालो', 'मुनाफा', 'net profit'],
        recommendedCardType: 'kpi'
    },
    {
        id: 'rule-period-growth',
        title: { en: 'Period-over-Period Growth & Momentum', hi: 'तिमाही एवं मासिक विकास दर (QoQ / MoM Growth)' },
        domain: 'Strategy',
        objective: { en: 'Measure expansion velocity between consecutive quarters or periods with directional vector arrows.', hi: 'लगातार तिमाहियों या अवधियों के बीच विस्तार की गति को दिशा सूचक तीरों के साथ मापना।' },
        primaryFormula: 'GROWTH',
        formulaTemplate: '=GROWTH({CurrentCell}, {PriorCell}, R, "Growth: ")',
        businessLogicExplanation: {
            en: 'Growth % = ((Current - Prior) / Prior) * 100. Over +10% indicates strong momentum (▲); negative indicates business contraction (▼).',
            hi: 'वृद्धि % = ((वर्तमान - पूर्व) / पूर्व) * 100। +10% से अधिक मजबूत गति (▲) दिखाता है, जबकि गिरावट (▼) सुधारात्मक उपाय मांगती है।'
        },
        sampleQueryTriggers: ['growth rate', 'mom', 'qoq', 'वृद्धि दर', 'quarterly growth', 'growth momentum'],
        recommendedCardType: 'sparkline'
    },
    {
        id: 'rule-quota-attainment',
        title: { en: 'Target Quota Attainment & Pacing', hi: 'लक्ष्य कोटा पूर्ति एवं प्राप्ति दर' },
        domain: 'Sales',
        objective: { en: 'Compute ratio of achieved sales vs defined target quota for speedometer progress tracking.', hi: 'स्पीडोमीटर प्रोग्रेस ट्रैकिंग हेतु निर्धारित लक्ष्य के विरुद्ध प्राप्त बिक्री का प्रतिशत निकालना।' },
        primaryFormula: 'PERCENT',
        formulaTemplate: '=PERCENT({ActualCol}, {TargetValue}, R, "Attainment: ")',
        businessLogicExplanation: {
            en: 'Attainment % = (Actual / Target) * 100. Pacing >= 100% signifies goal exceeded (Green); 80-99% on track (Amber); <80% deficit (Red).',
            hi: 'प्राप्ति दर = (वास्तविक / लक्ष्य) * 100। 100%+ लक्ष्य से अधिक (हरा), 80-99% संतोषजनक (पीला), और 80% से कम घाटा (लाल) दर्शाता है।'
        },
        sampleQueryTriggers: ['quota attainment', 'target met', 'attainment rate', 'लक्ष्य कितना पूरा हुआ', 'quota progress', 'speedometer'],
        recommendedCardType: 'gauge'
    },
    {
        id: 'rule-gap-deficit',
        title: { en: 'Gap-to-Target & Shortfall Deficit', hi: 'लक्ष्य शेष अंतर एवं पाइपलाइन गैप' },
        domain: 'Sales',
        objective: { en: 'Calculate the absolute dollar shortfall remaining before quarter close to focus team pipeline.', hi: 'तिमाही समाप्ति से पहले आवश्यक शेष राशि की गणना करना ताकि बिक्री टीम पाइपलाइन पर ध्यान केंद्रित कर सके।' },
        primaryFormula: 'REMAINING',
        formulaTemplate: '=REMAINING({TargetValue}, {ActualCol}, R, "Shortfall: ₹")',
        businessLogicExplanation: {
            en: 'Shortfall = Math.max(0, Target - Actual). Displays exact gap needed; safely grounds to 0 when quota is surpassed.',
            hi: 'शेष कमी = Math.max(0, लक्ष्य - वास्तविक)। आवश्यक शेष अंतर दिखाता है और लक्ष्य पार होने पर शून्य पर स्थिर रहता है।'
        },
        sampleQueryTriggers: ['shortfall', 'deficit', 'gap to target', 'कितना बाकी है', 'remaining to goal', 'quota gap'],
        recommendedCardType: 'kpi'
    },
    {
        id: 'rule-sla-status',
        title: { en: 'Operational SLA & Compliance Benchmarking', hi: 'परिचालन SLA व अनुपालन सत्यापन' },
        domain: 'Operations',
        objective: { en: 'Benchmark accounts or service delivery metrics against compliance cutoffs with instant visual badges.', hi: 'त्वरित विजुअल बैज के साथ अनुपालन सीमा के विरुद्ध खातों या सेवा मेट्रिक्स का मूल्यांकन करना।' },
        primaryFormula: 'STATUS',
        formulaTemplate: '=STATUS({MetricCell}, {Threshold}, "Compliant ✅", "At Risk ⚠️")',
        businessLogicExplanation: {
            en: 'Automated governance: flags units meeting quality hurdle benchmark (>= threshold) with green check, otherwise warns stakeholders.',
            hi: 'स्वचालित सुशासन: गुणवत्ता सीमा (>= थ्रेशोल्ड) को पूरा करने वाले रिकॉर्ड्स को हरी टिक और कमियों पर चेतावनी जारी करता है।'
        },
        sampleQueryTriggers: ['sla status', 'compliance', 'qualification', 'स्थिति बताओ', 'on track or risk', 'audit status'],
        recommendedCardType: 'kpi'
    },
    {
        id: 'rule-partner-tiering',
        title: { en: 'Enterprise Partner Tiering & Incentives', hi: 'साझेदार श्रेणीकरण एवं प्रोत्साहन वर्गीकरण' },
        domain: 'Strategy',
        objective: { en: 'Segment accounts into strategic tiers based on cumulative performance criteria.', hi: 'संचयी प्रदर्शन मानदंडों के आधार पर खातों को रणनीतिक स्तरों में विभाजित करना।' },
        primaryFormula: 'IF',
        formulaTemplate: '=IF({MetricCell} > {Threshold}, "Tier 1 Elite", "Tier 2 Standard")',
        businessLogicExplanation: {
            en: 'Relational segmentation: rewards high-volume enterprise partners with Tier 1 status, granting preferential terms or discounts.',
            hi: 'तार्किक विभाजन: उच्च मात्रा वाले साझेदारों को टियर 1 का दर्जा देकर विशेष लाभ व छूट प्रदान करता है।'
        },
        sampleQueryTriggers: ['tier classification', 'partner tier', 'tiering', 'श्रेणीकरण', 'tier 1 tier 2'],
        recommendedCardType: 'kpi'
    },
    {
        id: 'rule-leaderboard-ranking',
        title: { en: 'Leaderboard Ranking & Top Performer Spotlight', hi: 'लीडरबोर्ड रैंकिंग एवं शीर्ष प्रदर्शनकारी' },
        domain: 'Sales',
        objective: { en: 'Isolate the #1 and #2 revenue-generating assets or sales representatives across territories.', hi: 'सभी क्षेत्रों में #1 और #2 राजस्व उत्पादक संपत्तियों या बिक्री प्रतिनिधियों को अलग करना।' },
        primaryFormula: 'TOP',
        formulaTemplate: '=TOP({MetricCol}, 1, R, "Champion: ₹")',
        businessLogicExplanation: {
            en: 'Competitive recognition: extracts highest ranked metric value for executive highlight callouts.',
            hi: 'प्रतिस्पर्धी सम्मान: शीर्ष रैंकिंग वाले मेट्रिक को सीधे निकालकर मुख्य डिस्प्ले पर प्रस्तुत करता है।'
        },
        sampleQueryTriggers: ['top performer', 'leaderboard', 'rank 1', 'नंबर वन कौन है', 'highest sales', 'champion'],
        recommendedCardType: 'kpi'
    },
    {
        id: 'rule-currency-inr',
        title: { en: 'Indian Financial Standardization (INR Lakh/Crore)', hi: 'भारतीय वित्तीय मानकीकरण (लाख/करोड़ प्रणाली)' },
        domain: 'Governance',
        objective: { en: 'Standardize numeric displays into Indian accounting format (₹4,82,500 / ₹1.25 Cr).', hi: 'संख्यात्मक डिस्प्ले को भारतीय लेखांकन प्रारूप (₹4,82,500 / ₹1.25 करोड़) में मानकीकृत करना।' },
        primaryFormula: 'FORMAT',
        formulaTemplate: '=FORMAT({CellOrCol}, "INR", R, "Total: ")',
        businessLogicExplanation: {
            en: 'Regional compliance: converts Western thousands comma separators into Indian Lakhs (1,00,000) and Crores (1,00,00,000) with ₹ prefix.',
            hi: 'क्षेत्रीय अनुकूलता: पश्चिमी हजारों के सेपरेटर को ₹ चिह्न सहित भारतीय लाख (1,00,000) व करोड़ में बदलता है।'
        },
        sampleQueryTriggers: ['inr format', 'rupee format', 'भारतीय रुपया', 'lakh crore format', 'currency inr'],
        recommendedCardType: 'kpi'
    },
    {
        id: 'rule-realtime-capture',
        title: { en: 'Real-Time Streaming Inflow Monitoring', hi: 'रियल-टाइम लाइव डेटा स्ट्रीम मॉनिटरिंग' },
        domain: 'Operations',
        objective: { en: 'Display the bottom-most incoming record from continuous Google Sheets or webhook data feeds.', hi: 'गूगल शीट्स या वेबहुक डेटा फीड से अंतिम आने वाले रिकॉर्ड को लगातार प्रदर्शित करना।' },
        primaryFormula: 'LATEST',
        formulaTemplate: '=LATEST({MetricCol}, R, "Latest Inflow: ₹")',
        businessLogicExplanation: {
            en: 'Streaming pulse: captures active heartbeat of operations by rendering the freshest logged transaction without full table scans.',
            hi: 'स्ट्रीमिंग पल्स: संपूर्ण टेबल स्कैन के बिना नवीनतम लेनदेन को तुरंत स्क्रीन पर दिखाता है।'
        },
        sampleQueryTriggers: ['latest inflow', 'realtime stream', 'हालिया रिकॉर्ड', 'most recent', 'latest transaction'],
        recommendedCardType: 'kpi'
    },
    {
        id: 'rule-reactive-coordinate',
        title: { en: 'Reactive Grid Coordinate Binding', hi: 'रिएक्टिव ग्रिड कोऑर्डिनेट बाइंडिंग' },
        domain: 'Governance',
        objective: { en: 'Link executive textboxes and titles directly to spreadsheet cells (e.g. A4) for live zero-latency synchronization.', hi: 'लाइव शून्य-विलंबता सिंक्रनाइज़ेशन हेतु टेक्स्टबॉक्स व शीर्षकों को सीधे स्प्रेडशीट सेलों (उदा. A4) से जोड़ना।' },
        primaryFormula: 'INSERT',
        formulaTemplate: '=INSERT({CellAddress}, R, "Focus Account: ")',
        businessLogicExplanation: {
            en: 'Local-first architecture: when analysts double-click and edit cell A4 in edit_data.html, all dependent cards update in milliseconds.',
            hi: 'लोकल-फर्स्ट आर्किटेक्चर: जैसे ही विश्लेषक स्प्रेडशीट में सेल A4 एडिट करता है, सभी निर्भर कार्ड मिलीसेकंड में अपडेट होते हैं।'
        },
        sampleQueryTriggers: ['cell reference', 'insert cell', 'coordinate binding', 'सेल लिंक', 'reactive cell'],
        recommendedCardType: 'textbox'
    }
];

// -----------------------------------------------------------------------------
// Formal Catalog: Technical Platform Architecture & Workflow from learning.html
// -----------------------------------------------------------------------------

export const AGENT_PLATFORM_SPECS: KnowledgePlatformSpec[] = [
    {
        id: 'spec-duckdb-olap',
        sectionNumber: 1,
        title: { en: 'DuckDB Embedded WebAssembly OLAP Engine', hi: 'डकडीबी एम्बेडेड वेबअसेंबली OLAP इंजन' },
        summary: {
            en: 'Client-side analytical query engine processing 500,000+ records in milliseconds with zero server roundtrips.',
            hi: 'क्लाइंट-साइड विश्लेषणात्मक क्वेरी इंजन जो बिना सर्वर राउंडट्रिप के मिलीसेकंड में 5,00,000+ रिकॉर्ड्स प्रोसेस करता है।'
        },
        architectureNotes: [
            'Apache Arrow columnar IPC for zero-copy memory transfers between workers and UI thread.',
            'SIMD-vectorized execution achieving 60 FPS smooth interactions during real-time aggregations.',
            'Local-first privacy: sensitive data never leaves user browser memory.'
        ],
        actionableDirectives: [
            'Rely on instant client-side math rather than requesting external backend calculations.',
            'Remind users that large CSV/Excel files (up to hundreds of megabytes) are computed entirely locally.'
        ]
    },
    {
        id: 'spec-spreadsheet-grid',
        sectionNumber: 6,
        title: { en: 'Spreadsheet Grid & Reactive Editing Engine', hi: 'स्प्रेडशीट ग्रिड एवं रिएक्टिव संपादन इंजन' },
        summary: {
            en: 'In-memory Excel-grade grid (edit_data.html) supporting inline cell edits, sorting, column renaming, and coordinate addressing.',
            hi: 'इन-मेमरी एक्सेल-ग्रेड ग्रिड (edit_data.html) जो इनलाइन सेल संपादन, सॉर्टिंग, कॉलम नामकरण और सेल कोऑर्डिनेट्स का समर्थन करता है।'
        },
        architectureNotes: [
            'Double-click any cell to enter inline edit mode and press Enter.',
            'Cell coordinates follow standard Excel notation: Column letter (A, B, C...) + Row number (1, 2, 3...).',
            'Grid modifications broadcast an event that triggers reactive re-evaluation of all bound template formulas.'
        ],
        actionableDirectives: [
            'When users ask to edit numbers, inform them they can double-click cells in the spreadsheet grid or use AI actions.',
            'Use cell coordinates (e.g. B2, C2, E2) when generating precise formula expressions.'
        ]
    },
    {
        id: 'spec-chart-taxonomy',
        sectionNumber: 7,
        title: { en: '15+ Visual Chart Taxonomy & Configuration Rules', hi: '15+ विजुअल चार्ट वर्गीकरण एवं विन्यास नियम' },
        summary: {
            en: '15 distinct analytical chart engines configured via categorical X-axis dimension, numerical Y-axis metrics, and aggregations.',
            hi: '15 विशिष्ट विश्लेषणात्मक चार्ट इंजन जो X-अक्ष श्रेणी, Y-अक्ष संख्यात्मक मेट्रिक्स और संकलन विधियों द्वारा कॉन्फ़िगर होते हैं।'
        },
        architectureNotes: [
            'Comparative: Bar, Column, Grouped Bar, Stacked Bar.',
            'Chronological Trends: Line, Area, Spline, Rolling Averages.',
            'Distribution & Parts-to-Whole: Pie, Donut, Treemap, Funnel.',
            'Multi-Dimensional & Correlation: Scatter, Bubble, Radar, Heatmap matrix.',
            'Executive Performance: Speedometer Gauge, Radial Progress, KPI Sparklines.'
        ],
        actionableDirectives: [
            'Always match chart archetype to analytical intent: Line for time-series, Bar for categories, Donut for parts-of-whole <= 6 items, Gauge for quotas.',
            'Ensure column names in xAxis and yAxes match dataset headers with exact case sensitivity.'
        ]
    },
    {
        id: 'spec-dashboard-spatial',
        sectionNumber: 9,
        title: { en: 'Executive Dashboard Spatial Architecture & Layout', hi: 'कार्यकारी डैशबोर्ड स्थानिक वास्तुकला एवं लेआउट' },
        summary: {
            en: 'Structured tier-based layout enforcing the 3-Second Executive BI Rule for immediate clarity.',
            hi: '3-सेकंड कार्यकारी बीआई नियम को लागू करने वाला संरचित स्तर-आधारित लेआउट।'
        },
        architectureNotes: [
            'Top Horizon (y: 15px): Strategic Executive Header / Textbox (Width: 100%, Height: 110px).',
            'Top Tier (y: 140px): 3 to 4 uniform KPI cards side-by-side (Revenue, Profit, Volume, Sparkline).',
            'Middle Tier (y: 355px): 2-Column Primary Analytics (Trend Line on left, Comparative Bar on right).',
            'Bottom Tier (y: 775px): Proportional Donut/Pie and Benchmark Radar/Treemap.'
        ],
        actionableDirectives: [
            'Use "arrange-dashboard-professionally" or "design-professional-dashboard" to organize dashboard elements into their ideal zones.'
        ]
    }
];

// -----------------------------------------------------------------------------
// Dynamic Calculation Engine: Real-Time Data Binding & Execution
// -----------------------------------------------------------------------------

/**
 * Dynamically resolves and calculates any of the 15+ formulas or business logic rules
 * against the currently loaded active dataset (filteredData or rawData).
 */
export function executeDynamicKnowledgeFormula(formulaString: string, contextData?: any[]): DynamicCalculationResult {
    const rawFormula = formulaString.trim();
    const data = contextData || (filteredData && filteredData.length > 0 ? filteredData : rawData) || [];
    const cols = headers && headers.length > 0 ? headers : (data.length > 0 ? Object.keys(data[0]) : []);

    // 1. Evaluate using template formula engine
    const evalRes: FormulaEvaluationResult = evaluateFormula(rawFormula);
    const parsed = parseFormula(rawFormula);

    const fnType = parsed.fnType || 'FORMULA';
    const display = evalRes.display || '0';
    const numericVal = evalRes.numericValue;
    const trend = evalRes.trend || 'neutral';

    // 2. Derive business insight & breakdown
    let stepExplanation = evalRes.description || `Evaluated ${fnType} formula expression.`;
    let businessInsight = '';
    let recommendedVisual: 'kpi' | 'sparkline' | 'gauge' | 'progress' | 'textbox' = 'kpi';

    const matchedFormula = AGENT_FORMULA_CATALOG.find(f => f.fn === fnType);
    if (matchedFormula) {
        recommendedVisual = matchedFormula.bestVisuals[0] || 'kpi';
    }

    switch (fnType) {
        case 'SUM':
            businessInsight = `कॉलम ${parsed.target || 'डेटा'} का कुल संचयी योग निकाला गया: ${display}। यह शीर्ष वित्तीय अवलोकन हेतु आदर्श है।`;
            recommendedVisual = 'kpi';
            break;
        case 'AVG':
            businessInsight = `कॉलम ${parsed.target || 'डेटा'} का औसत निकाला गया: ${display}। यह मानक लेनदेन आकार को दर्शाता है।`;
            recommendedVisual = 'kpi';
            break;
        case 'MAX':
            businessInsight = `उच्चतम शिखर लेनदेन मान दर्ज किया गया: ${display}।`;
            recommendedVisual = 'kpi';
            break;
        case 'MIN':
            businessInsight = `न्यूनतम दर्ज मान: ${display}। यह परिचालन लागत का न्यूनतम स्तर है।`;
            recommendedVisual = 'kpi';
            break;
        case 'COUNT':
            businessInsight = `सक्रिय रिकॉर्ड्स एवं श्रेणियों की कुल संख्या: ${display}।`;
            recommendedVisual = 'kpi';
            break;
        case 'GROWTH':
            businessInsight = `अवधि-दर-अवधि विकास दर: ${display}। ${trend === 'up' ? 'सकारात्मक वृद्धि (▲)' : 'गिरावट दर्ज (▼)'}।`;
            recommendedVisual = 'sparkline';
            break;
        case 'DIFF':
            businessInsight = `दो मेट्रिक्स का शुद्ध अंतर/मार्जिन: ${display}।`;
            recommendedVisual = 'kpi';
            break;
        case 'PERCENT':
            businessInsight = `लक्ष्य पूर्ति अनुपात: ${display}। यह स्पीडोमीटर गेज या प्रोग्रेस बार हेतु उपयुक्त है।`;
            recommendedVisual = 'gauge';
            break;
        case 'REMAINING':
            businessInsight = `लक्ष्य तक पहुंचने हेतु शेष आवश्यक अंतर: ${display}।`;
            recommendedVisual = 'kpi';
            break;
        case 'STATUS':
            businessInsight = `थ्रेशोल्ड बेंचमार्क के आधार पर स्थिति मूल्यांकन: ${display}।`;
            recommendedVisual = 'kpi';
            break;
        case 'IF':
            businessInsight = `तार्किक शाखा शर्त का परिणाम: ${display}।`;
            recommendedVisual = 'kpi';
            break;
        case 'LATEST':
            businessInsight = `लाइव डेटा स्ट्रीम की अंतिम/नवीनतम प्रविष्टि: ${display}।`;
            recommendedVisual = 'kpi';
            break;
        case 'TOP':
            businessInsight = `शीर्ष प्रदर्शनकारी रैंकिंग मान: ${display}।`;
            recommendedVisual = 'kpi';
            break;
        case 'FORMAT':
            businessInsight = `अंतरराष्ट्रीय वित्तीय स्वरूपण में मान: ${display}।`;
            recommendedVisual = 'kpi';
            break;
        case 'INSERT':
            businessInsight = `लाइव सेल संदर्भ से प्राप्त मान: ${display}।`;
            recommendedVisual = 'textbox';
            break;
        default:
            businessInsight = `गणना पूर्ण: ${display}`;
            break;
    }

    return {
        success: !evalRes.error,
        formula: rawFormula,
        fnType,
        display,
        numericValue: numericVal,
        trend,
        trendValue: evalRes.trendValue,
        stepExplanation,
        businessInsight,
        recommendedVisual,
        targetColumnOrCell: parsed.target,
        error: evalRes.error
    };
}

/**
 * Applies a calculation from the knowledge base directly onto the dashboard canvas.
 */
export async function applyKnowledgeCalculationToDashboard(opts: {
    formula: string;
    target?: string;
    cardTitle?: string;
    category?: 'kpi' | 'sparkline' | 'gauge' | 'progress' | 'textbox';
    replaceExisting?: boolean;
}): Promise<{ success: boolean; message: string; display: string; cardId: string }> {
    const rawFormula = opts.formula.trim();
    const evalRes = executeDynamicKnowledgeFormula(rawFormula);
    const category = opts.category || evalRes.recommendedVisual;
    const targetQuery = (opts.target || 'kpi').trim();

    pushUndoSnapshot(`Apply Knowledge Formula: ${rawFormula}`);

    const existingCards = visualizations.filter(v => v.type === 'template_card' || v.templateCategory);
    let targetCard = null;

    if (!opts.replaceExisting && existingCards.length > 0) {
        targetCard = existingCards.find(c => {
            if (targetQuery.toLowerCase() === 'all') return true;
            if (c.id === targetQuery || c.id === `container-${targetQuery}`) return true;
            if (c.title && c.title.toLowerCase().includes(targetQuery.toLowerCase())) return true;
            if (c.templateCategory === targetQuery.toLowerCase()) return true;
            return false;
        });
    }

    if (targetCard) {
        await applyTemplateFormula(targetCard.id, rawFormula, 'value');
        showMessage(`Applied Knowledge Base formula ${rawFormula} to "${targetCard.title || 'Card'}"!`, 'success');
        return {
            success: true,
            message: `नॉलेज बेस फॉर्मूला \`${rawFormula}\` मौजूदा कार्ड **"${targetCard.title || 'Card'}"** पर लागू कर दिया गया। मान: **${evalRes.display}**`,
            display: evalRes.display,
            cardId: targetCard.id
        };
    } else {
        const newCard = await createCustomTemplateCard({
            category,
            label: opts.cardTitle || `${evalRes.fnType} Metric`,
            formula: rawFormula,
            formulaField: 'value',
            badge: `ƒ(x) ${evalRes.fnType}`
        });

        showMessage(`Created new ${category.toUpperCase()} card with formula ${rawFormula}!`, 'success');
        return {
            success: true,
            message: `नया **${category.toUpperCase()}** कार्ड **"${newCard.title}"** बनाया गया और फॉर्मूला \`${rawFormula}\` लागू किया गया। लाइव मान: **${evalRes.display}**`,
            display: evalRes.display,
            cardId: newCard.id
        };
    }
}

// -----------------------------------------------------------------------------
// Search & Retrieval Functions for Agent Intelligence
// -----------------------------------------------------------------------------

/**
 * Multi-dimensional search across formulas, business rules, and architecture specs.
 */
export function searchAgentKnowledgeBase(query: string, lang: 'en' | 'hi' = 'hi'): KnowledgeSearchResult {
    const q = query.toLowerCase().trim();
    if (!q) {
        return {
            query: '',
            matchedFormulas: AGENT_FORMULA_CATALOG,
            matchedRules: AGENT_BUSINESS_RULES,
            matchedSpecs: AGENT_PLATFORM_SPECS,
            summary: lang === 'hi' ? 'संपूर्ण 15 फॉर्मूले और बिजनेस लॉजिक नियम।' : 'All 15 formulas and business logic rules cataloged.'
        };
    }

    const matchedFormulas = AGENT_FORMULA_CATALOG.filter(f => {
        return (
            f.fn.toLowerCase().includes(q) ||
            f.name.toLowerCase().includes(q) ||
            f.category.en.toLowerCase().includes(q) ||
            f.category.hi.toLowerCase().includes(q) ||
            f.shortDesc.en.toLowerCase().includes(q) ||
            f.shortDesc.hi.toLowerCase().includes(q) ||
            f.tags.some(t => t.toLowerCase().includes(q))
        );
    });

    const matchedRules = AGENT_BUSINESS_RULES.filter(r => {
        return (
            r.title.en.toLowerCase().includes(q) ||
            r.title.hi.toLowerCase().includes(q) ||
            r.objective.en.toLowerCase().includes(q) ||
            r.objective.hi.toLowerCase().includes(q) ||
            r.sampleQueryTriggers.some(t => t.toLowerCase().includes(q)) ||
            r.primaryFormula.toLowerCase().includes(q)
        );
    });

    const matchedSpecs = AGENT_PLATFORM_SPECS.filter(s => {
        return (
            s.title.en.toLowerCase().includes(q) ||
            s.title.hi.toLowerCase().includes(q) ||
            s.summary.en.toLowerCase().includes(q) ||
            s.architectureNotes.some(n => n.toLowerCase().includes(q))
        );
    });

    const summary = lang === 'hi'
        ? `खोज "${query}": ${matchedFormulas.length} फॉर्मूले, ${matchedRules.length} बिजनेस नियम, और ${matchedSpecs.length} आर्किटेक्चर गाइड मिले।`
        : `Search "${query}": Found ${matchedFormulas.length} formulas, ${matchedRules.length} business rules, and ${matchedSpecs.length} specs.`;

    return {
        query,
        matchedFormulas,
        matchedRules,
        matchedSpecs,
        summary
    };
}

/**
 * Returns formatted prompt context for LLM system instructions,
 * enabling the AI to know and apply all 15 formulas and business rules with full mastery.
 */
export function getAgentKnowledgeBasePromptContext(): string {
    return `
======================================================================
VEDRA BI AGENT KNOWLEDGE BASE (FORMULAS, BUSINESS RULES & ARCHITECTURE)
======================================================================
You possess formal technical mastery over the Vedra BI Knowledge Base imported directly from learning.html / learning.ts.
You can dynamically reference, explain, calculate, or apply all 15 dynamic Excel-grade formulas and 10 executive business logic frameworks!

ALL 15 DYNAMIC FORMULAS SPECIFICATION:
1. =INSERT(Target, Direction, "Text")
   - Usage: Live coordinate or column binding (e.g. A4, B2, Region). Reactive updates when spreadsheet cell edits.
   - Example: =INSERT(A2, R, "Leader Territory: ")
2. =SUM(ColumnOrRange, Direction, "Text")
   - Usage: Cumulative sum of column (Sales) or range (B2:B50). Ignores non-numbers.
   - Example: =SUM(Sales, R, "Total Revenue: ₹") or =SUM(B, R, "Total Sales: $")
3. =AVG(ColumnOrRange, Direction, "Text")
   - Usage: Arithmetic mean (Sum / Count) across valid numbers.
   - Example: =AVG(Sales, R, "Avg Order: ₹") or =AVG(B, R, "Average: $")
4. =MAX(ColumnOrRange, Direction, "Text")
   - Usage: Discovers highest recorded peak transaction or upper bound.
   - Example: =MAX(Sales, R, "Peak Deal: ₹") or =MAX(B, R, "Highest: $")
5. =MIN(ColumnOrRange, Direction, "Text")
   - Usage: Lowest transaction, cost floor, or minimum outflow.
   - Example: =MIN(Expenses, R, "Min Cost: ₹") or =MIN(D, R, "Lowest: $")
6. =COUNT(ColumnOrRange, Direction, "Text")
   - Usage: Cardinality count of active non-empty records.
   - Example: =COUNT(A, R, "Active Records: ") or =COUNT(Region, R, "Territories: ")
7. =GROWTH(Current, Prev, Direction, "Text")
   - Usage: Variance momentum percentage ((Current - Prev) / Prev) * 100 with dynamic vector arrows (▲ / ▼).
   - Example: =GROWTH(C2, B2, R, "QoQ Growth: ") or =GROWTH(120, 100, R, "Expansion: ")
8. =DIFF(Target1, Target2, Direction, "Text")
   - Usage: Absolute difference (Target1 - Target2) with sign notation (+/-), for net profit margins and variances.
   - Example: =DIFF(C2, D2, R, "Net Margin: ₹") or =DIFF(Sales, Cost, R, "Operating Profit: ₹")
9. =PERCENT(Actual, Max, Direction, "Text")
   - Usage: Target quota attainment ratio (Actual / Max) * 100%, drives progress bars and gauges.
   - Example: =PERCENT(B2, 100000, R, "Quota Met: ") or =PERCENT(Sales, 5000000, R, "Attainment: ")
10. =REMAINING(Goal, Current, Direction, "Text")
    - Usage: Target deficit shortfall (Math.max(0, Goal - Current)). Grounded to 0 when surpassed.
    - Example: =REMAINING(100000, B2, R, "Goal Deficit: ₹") or =REMAINING(5000000, Sales, R, "Shortfall: ₹")
11. =STATUS(Target, Threshold, "PassText", "FailText")
    - Usage: Automated threshold SLA benchmark returning custom status badges or emojis.
    - Example: =STATUS(B2, 80000, "Qualified ✅", "Disqualified ❌") or =STATUS(Sales, 500000, "On Track 🟢", "At Risk 🔴")
12. =IF(Condition, "TrueText", "FalseText")
    - Usage: Excel-grade boolean branching (>, <, >=, <=) for tiering and classification.
    - Example: =IF(B2>80000, "Tier 1 Partner", "Tier 2 Partner")
13. =LATEST(ColumnName, Direction, "Text")
    - Usage: Streaming capture of bottom-most row in column for real-time live data feeds.
    - Example: =LATEST(Sales, R, "Latest Inflow: ₹") or =LATEST(B, R, "Latest: $")
14. =TOP(ColumnName, N, Direction, "Text")
    - Usage: N-th highest ranked champion or value (1 for top, 2 for second, etc.).
    - Example: =TOP(Sales, 1, R, "Leader Sales: ₹") or =TOP(B, 2, R, "Runner Up: $")
15. =FORMAT(Target, "Style", Direction, "Text")
    - Usage: International financial formatting into "INR" (₹ Lakh/Crore), "USD" ($), "EUR" (€), or "PERCENT".
    - Example: =FORMAT(B2, "INR", R, "Total: ") or =FORMAT(Sales, "USD", R, "Net: ")

CORE BUSINESS LOGIC DIRECTIVES:
- Direction Parameter: "R" places computed value on the RIGHT ("Revenue: $45,000"); "L" places value on LEFT ("$45,000 Revenue").
- Gross Margin Rule: Use DIFF(Revenue, Cost) or compute net margin delta.
- Growth Momentum Rule: Use GROWTH(C2, B2) for quarterly/monthly trends.
- Attainment & Pacing: Use PERCENT for speedometer gauges and REMAINING for shortfall gap.
- SLA Compliance: Use STATUS with emoji checks.
- When user asks for formula application or calculations on cards, return the "apply-template-formula", "create-template-card", or "apply-knowledge-calculation" action!
`;
}

// -----------------------------------------------------------------------------
// Interactive UI Renderer: Knowledge Base Explorer Deck for Chat
// -----------------------------------------------------------------------------

/**
 * Renders the formal Knowledge Base Explorer card inside the chat stream.
 */
export function renderKnowledgeBaseExplorerCard(initialQuery = '', lang: 'en' | 'hi' = 'hi'): { html: string } {
    const isHi = lang === 'hi';
    const data = filteredData.length > 0 ? filteredData : rawData;
    const cols = headers && headers.length > 0 ? headers : (data && data.length > 0 ? Object.keys(data[0]) : ['Sales', 'Region', 'Profit', 'Cost']);
    const numCol = cols.find(c => /sales|revenue|profit|cost|amount|budget|volume/i.test(c)) || cols[1] || 'Sales';
    const catCol = cols.find(c => /region|city|state|category|department|item/i.test(c)) || cols[0] || 'Region';

    // Build formula items with real live evaluations against active dataset
    let formulasHtml = '';
    AGENT_FORMULA_CATALOG.forEach(f => {
        // Substitute sample column/cell with actual loaded column where applicable
        let liveCode = f.example.code;
        if (liveCode.includes('(Sales,') && numCol !== 'Sales') {
            liveCode = liveCode.replace('Sales', numCol);
        }

        const evalRes = executeDynamicKnowledgeFormula(liveCode);
        const liveVal = evalRes.display || 'Live';

        formulasHtml += `
            <div class="kb-formula-card p-2.5 bg-white rounded-3 border mb-2 shadow-2xs" data-fn="${f.fn}" data-category="${f.category.en.toLowerCase()}">
                <div class="d-flex align-items-center justify-content-between mb-1.5 flex-wrap gap-1">
                    <div class="d-flex align-items-center gap-1.5">
                        <span class="badge bg-indigo-600 text-white font-monospace text-3xs px-2 py-0.5">ƒ(x) ${f.fn}</span>
                        <strong class="text-slate-900 text-xs">${f.name}</strong>
                    </div>
                    <span class="badge bg-emerald-50 text-emerald-800 border border-emerald-200 text-3xs px-2 py-0.5 font-monospace" title="लाइव डेटा से परिकलित मान">
                        <i class="bi bi-cpu-fill text-emerald-600 me-0.5"></i> ${isHi ? 'लाइव मान' : 'Live Value'}: <strong>${escapeHtml(liveVal)}</strong>
                    </span>
                </div>

                <code class="d-block text-xs text-indigo-950 bg-slate-50 p-1.5 rounded border font-monospace mb-1.5 user-select-all" style="word-break: break-all;">
                    ${escapeHtml(liveCode)}
                </code>

                <p class="text-slate-600 text-3xs mb-2" style="line-height: 1.35;">
                    ${isHi ? escapeHtml(f.shortDesc.hi) : escapeHtml(f.shortDesc.en)}
                </p>

                <div class="p-1.5 rounded bg-slate-50 border border-slate-200 mb-2 small text-3xs text-slate-700">
                    <i class="bi bi-briefcase-fill text-indigo-500 me-1"></i>
                    <strong>${isHi ? 'बिजनेस उपयोग' : 'Business Logic'}:</strong> ${isHi ? escapeHtml(f.businessLogic.hi) : escapeHtml(f.businessLogic.en)}
                </div>

                <div class="d-flex align-items-center justify-content-between flex-wrap gap-1.5 pt-1 border-top">
                    <span class="text-3xs text-slate-400 font-monospace">
                        <i class="bi bi-arrow-left-right me-0.5"></i> ${f.supportsDirection ? 'Direction: R / L' : 'Fixed Return'}
                    </span>
                    <div class="d-flex align-items-center gap-1">
                        <button class="btn btn-2xs btn-primary d-inline-flex align-items-center gap-1 btn-kb-apply" data-formula="${escapeHtml(liveCode)}" data-fn="${f.fn}">
                            <i class="bi bi-play-fill"></i> ${isHi ? 'कार्ड पर लगाएं' : 'Apply to Card'}
                        </button>
                        <button class="btn btn-2xs btn-outline-indigo d-inline-flex align-items-center gap-1 btn-kb-create" data-formula="${escapeHtml(liveCode)}" data-fn="${f.fn}" data-visual="${f.bestVisuals[0] || 'kpi'}">
                            <i class="bi bi-plus-circle"></i> ${isHi ? '+ नया कार्ड' : '+ New Card'}
                        </button>
                        <button class="btn btn-2xs btn-outline-secondary d-inline-flex align-items-center gap-1 btn-kb-copy" data-formula="${escapeHtml(liveCode)}" title="Copy Formula">
                            <i class="bi bi-clipboard"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    });

    // Build Business Logic Rules
    let rulesHtml = '';
    AGENT_BUSINESS_RULES.forEach((r, idx) => {
        rulesHtml += `
            <div class="kb-rule-card p-2.5 bg-white rounded-3 border mb-2 shadow-2xs">
                <div class="d-flex align-items-center justify-content-between mb-1">
                    <span class="badge bg-amber-100 text-amber-900 border border-amber-300 text-3xs font-semibold px-2">
                        <i class="bi bi-lightbulb-fill text-amber-600 me-0.5"></i> ${r.domain}
                    </span>
                    <span class="text-3xs text-slate-500 font-monospace">Rule #${idx + 1}</span>
                </div>
                <h6 class="fw-bold text-slate-900 text-xs mb-1">${isHi ? r.title.hi : r.title.en}</h6>
                <p class="text-slate-600 text-3xs mb-1.5" style="line-height: 1.35;">
                    ${isHi ? r.objective.hi : r.objective.en}
                </p>
                <div class="p-1.5 rounded bg-amber-50/50 border border-amber-200 mb-2 small text-3xs text-slate-800 font-monospace">
                    <code>${escapeHtml(r.formulaTemplate.replace('{RevenueCol}', numCol).replace('{CostCol}', 'Cost').replace('{TargetValue}', '500000').replace('{ActualCol}', numCol))}</code>
                </div>
                <div class="d-flex align-items-center justify-content-between pt-1 border-top">
                    <span class="text-3xs text-slate-400">अनुशंसित: <strong>${r.recommendedCardType.toUpperCase()}</strong></span>
                    <button class="btn btn-2xs btn-outline-amber text-amber-900 border-amber-300 d-inline-flex align-items-center gap-1 btn-kb-run-rule" data-rule-id="${r.id}">
                        <i class="bi bi-calculator"></i> ${isHi ? 'यह नियम लागू करें' : 'Execute Rule'}
                    </button>
                </div>
            </div>
        `;
    });

    const html = `
        <div class="agent-knowledge-base-card p-3 rounded-3 border shadow-sm" style="background: #f8fafc; border-color: #cbd5e1 !important; border-left: 4px solid #059669 !important;">
            <!-- Header -->
            <div class="d-flex align-items-center justify-content-between mb-2">
                <div class="d-flex align-items-center gap-2">
                    <span class="badge bg-emerald-600 text-white p-1.5 rounded-2 shadow-xs"><i class="bi bi-journal-bookmark-fill fs-6"></i></span>
                    <div>
                        <strong class="text-slate-900 text-xs d-block">
                            ${isHi ? 'एजेंट नॉलेज बेस (Agent Knowledge Base)' : 'Formal Agent Knowledge Base'}
                        </strong>
                        <span class="text-slate-500 text-3xs">
                            ${isHi ? 'learning.html से आयातित 15+ डायनामिक फॉर्मूले, बिजनेस लॉजिक एवं आर्किटेक्चर' : 'Imported 15+ formulas & business logic from learning.html'}
                        </span>
                    </div>
                </div>
                <span class="badge bg-emerald-100 text-emerald-800 text-3xs border border-emerald-300 font-monospace">15 Formulas • 10 Rules</span>
            </div>

            <!-- Intro text -->
            <p class="text-slate-700 text-2xs mb-2.5" style="line-height: 1.45;">
                ${isHi 
                    ? 'एआई एजेंट के पास Vedra BI के सभी 15 डायनामिक फॉर्मूलों, बिजनेस गणनाओं और डकडीबी आर्किटेक्चर का पूर्ण नॉलेज बेस है। किसी भी फॉर्मूले को तुरंत टेस्ट करें या सीधे अपने डैशबोर्ड कार्ड पर लागू करें:'
                    : 'The AI agent possesses full technical mastery over all 15 dynamic formulas, business logic frameworks, and DuckDB OLAP architecture. Click below to test or apply to your dashboard:'}
            </p>

            <!-- Search and Category Filters -->
            <div class="mb-2.5">
                <div class="input-group input-group-sm mb-2">
                    <span class="input-group-text bg-white border-end-0 text-muted"><i class="bi bi-search"></i></span>
                    <input type="text" class="form-control form-control-sm border-start-0 kb-search-input" placeholder="${isHi ? 'फॉर्मूला या बिजनेस नियम खोजें (उदा. SUM, Growth, Margin)...' : 'Search formula or rule (e.g. SUM, Growth, Margin)...'}" value="${escapeHtml(initialQuery)}">
                    <button class="btn btn-sm btn-outline-secondary kb-search-clear" type="button"><i class="bi bi-x"></i></button>
                </div>
                <div class="d-flex align-items-center gap-1 flex-wrap kb-filter-pills">
                    <button class="btn btn-2xs btn-primary active kb-filter-btn" data-filter="all">All (15+)</button>
                    <button class="btn btn-2xs btn-outline-secondary kb-filter-btn" data-filter="aggregates">अंकगणितीय (Aggregates)</button>
                    <button class="btn btn-2xs btn-outline-secondary kb-filter-btn" data-filter="growth">वृद्धि व मार्जिन (Growth/Diff)</button>
                    <button class="btn btn-2xs btn-outline-secondary kb-filter-btn" data-filter="goals">लक्ष्य व गेज (Goals/Gauges)</button>
                    <button class="btn btn-2xs btn-outline-secondary kb-filter-btn" data-filter="logic">शर्तें व रैंकिंग (Logic/Rank)</button>
                    <button class="btn btn-2xs btn-outline-secondary kb-filter-btn" data-filter="rules">बिजनेस नियम (Rules)</button>
                </div>
            </div>

            <!-- Scrollable Content View -->
            <div class="kb-content-scroll" style="max-height: 420px; overflow-y: auto; padding-right: 4px;">
                <div class="kb-formulas-view">
                    ${formulasHtml}
                </div>
                <div class="kb-rules-view" style="display: none;">
                    ${rulesHtml}
                </div>
            </div>

            <!-- Footer Badge -->
            <div class="pt-2 mt-2 border-top d-flex align-items-center justify-content-between text-3xs text-slate-500">
                <span><i class="bi bi-lightning-charge-fill text-amber-500"></i> रिएक्टिव सिंक: स्प्रेडशीट ग्रिड में मान बदलने पर कार्ड्स स्वतः री-कैलकुलेट होते हैं</span>
                <span class="badge bg-light text-secondary border font-monospace">DuckDB OLAP • 60 FPS</span>
            </div>
        </div>
    `;

    return { html };
}

/**
 * Attaches interactive listeners to the Knowledge Base Explorer card in chat.
 */
export function attachKnowledgeBaseListeners(container: HTMLElement): void {
    // 1. Filter Pills
    const filterBtns = container.querySelectorAll<HTMLButtonElement>('.kb-filter-btn');
    const formulasView = container.querySelector<HTMLElement>('.kb-formulas-view');
    const rulesView = container.querySelector<HTMLElement>('.kb-rules-view');
    const formulaCards = container.querySelectorAll<HTMLElement>('.kb-formula-card');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => {
                b.classList.remove('btn-primary', 'active');
                b.classList.add('btn-outline-secondary');
            });
            btn.classList.add('btn-primary', 'active');
            btn.classList.remove('btn-outline-secondary');

            const filter = btn.getAttribute('data-filter') || 'all';

            if (filter === 'rules') {
                if (formulasView) formulasView.style.display = 'none';
                if (rulesView) rulesView.style.display = 'block';
            } else {
                if (formulasView) formulasView.style.display = 'block';
                if (rulesView) rulesView.style.display = 'none';

                formulaCards.forEach(card => {
                    const cat = card.getAttribute('data-category') || '';
                    const fn = card.getAttribute('data-fn') || '';

                    if (filter === 'all') {
                        card.style.display = 'block';
                    } else if (filter === 'aggregates') {
                        card.style.display = ['SUM', 'AVG', 'MAX', 'MIN', 'COUNT'].includes(fn) ? 'block' : 'none';
                    } else if (filter === 'growth') {
                        card.style.display = ['GROWTH', 'DIFF'].includes(fn) ? 'block' : 'none';
                    } else if (filter === 'goals') {
                        card.style.display = ['PERCENT', 'REMAINING'].includes(fn) ? 'block' : 'none';
                    } else if (filter === 'logic') {
                        card.style.display = ['STATUS', 'IF', 'TOP', 'LATEST', 'INSERT', 'FORMAT'].includes(fn) ? 'block' : 'none';
                    }
                });
            }
        });
    });

    // 2. Search Input Filtering
    const searchInput = container.querySelector<HTMLInputElement>('.kb-search-input');
    const clearBtn = container.querySelector<HTMLButtonElement>('.kb-search-clear');

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            const val = searchInput.value.toLowerCase().trim();
            if (formulasView) formulasView.style.display = 'block';
            if (rulesView) rulesView.style.display = 'block';

            formulaCards.forEach(card => {
                const text = card.textContent?.toLowerCase() || '';
                card.style.display = text.includes(val) ? 'block' : 'none';
            });

            container.querySelectorAll<HTMLElement>('.kb-rule-card').forEach(card => {
                const text = card.textContent?.toLowerCase() || '';
                card.style.display = text.includes(val) ? 'block' : 'none';
            });
        });
    }

    if (clearBtn && searchInput) {
        clearBtn.addEventListener('click', () => {
            searchInput.value = '';
            searchInput.dispatchEvent(new Event('input'));
        });
    }

    // 3. Apply to Existing Card
    container.querySelectorAll<HTMLButtonElement>('.btn-kb-apply').forEach(btn => {
        btn.addEventListener('click', async () => {
            const formula = btn.getAttribute('data-formula');
            if (!formula) return;
            btn.disabled = true;
            btn.innerHTML = `<span class="spinner-border spinner-border-sm" role="status"></span> लागू हो रहा है...`;
            const res = await applyKnowledgeCalculationToDashboard({ formula });
            btn.disabled = false;
            btn.innerHTML = `<i class="bi bi-check-lg text-success"></i> लागू हुआ`;
            appendMessageElement(res.message, 'assistant', false, true);
        });
    });

    // 4. Create New Card
    container.querySelectorAll<HTMLButtonElement>('.btn-kb-create').forEach(btn => {
        btn.addEventListener('click', async () => {
            const formula = btn.getAttribute('data-formula');
            const fn = btn.getAttribute('data-fn') || 'Formula';
            const visual = (btn.getAttribute('data-visual') || 'kpi') as any;
            if (!formula) return;
            btn.disabled = true;
            btn.innerHTML = `<span class="spinner-border spinner-border-sm" role="status"></span> बन रहा है...`;
            const res = await applyKnowledgeCalculationToDashboard({
                formula,
                cardTitle: `${fn} Metric Card`,
                category: visual,
                replaceExisting: false
            });
            btn.disabled = false;
            btn.innerHTML = `<i class="bi bi-check-lg text-success"></i> कार्ड बना`;
            appendMessageElement(res.message, 'assistant', false, true);
        });
    });

    // 5. Copy Formula
    container.querySelectorAll<HTMLButtonElement>('.btn-kb-copy').forEach(btn => {
        btn.addEventListener('click', async () => {
            const formula = btn.getAttribute('data-formula');
            if (!formula) return;
            try {
                await navigator.clipboard.writeText(formula);
                btn.classList.add('text-success');
                btn.innerHTML = `<i class="bi bi-check"></i>`;
                setTimeout(() => {
                    btn.classList.remove('text-success');
                    btn.innerHTML = `<i class="bi bi-clipboard"></i>`;
                }, 1500);
            } catch (e) {
                showMessage(`Formula copied: ${formula}`, 'info');
            }
        });
    });

    // 6. Execute Business Rule
    container.querySelectorAll<HTMLButtonElement>('.btn-kb-run-rule').forEach(btn => {
        btn.addEventListener('click', async () => {
            const ruleId = btn.getAttribute('data-rule-id');
            const rule = AGENT_BUSINESS_RULES.find(r => r.id === ruleId);
            if (!rule) return;

            const data = filteredData.length > 0 ? filteredData : rawData;
            const cols = headers && headers.length > 0 ? headers : (data && data.length > 0 ? Object.keys(data[0]) : []);
            const numCol = cols.find(c => /sales|revenue|profit|amount|cost/i.test(c)) || cols[1] || 'Sales';

            let dynamicFormula = rule.formulaTemplate
                .replace('{RevenueCol}', numCol)
                .replace('{CostCol}', 'Cost')
                .replace('{ActualCol}', numCol)
                .replace('{MetricCol}', numCol)
                .replace('{MetricCell}', 'B2')
                .replace('{CurrentCell}', 'C2')
                .replace('{PriorCell}', 'B2')
                .replace('{TargetValue}', '500000')
                .replace('{Threshold}', '50000')
                .replace('{CellOrCol}', 'B2')
                .replace('{CellAddress}', 'A2');

            btn.disabled = true;
            btn.innerHTML = `<span class="spinner-border spinner-border-sm" role="status"></span> क्रियान्वित...`;
            const res = await applyKnowledgeCalculationToDashboard({
                formula: dynamicFormula,
                cardTitle: rule.title.hi,
                category: rule.recommendedCardType
            });
            btn.disabled = false;
            btn.innerHTML = `<i class="bi bi-check-lg text-success"></i> संपन्न`;
            appendMessageElement(res.message, 'assistant', false, true);
        });
    });
}

function escapeHtml(str: string): string {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
