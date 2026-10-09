// src/js/charts/chart_actions.ts

import { getAiChartAdvice } from '../ai/ai_advice.ts';
import { showMessage } from '../core/utils.ts';

// चार्ट को डिलीट करने का फ़ंक्शन
export function handleDeleteChart(chartElement: HTMLElement): void {
    if (confirm("क्या आप वाकई इस चार्ट को डिलीट करना चाहते हैं?")) {
        chartElement.remove();
        showMessage('चार्ट सफलतापूर्वक डिलीट हो गया है।', 'success');
    }
}

// AI सलाह को ट्रिगर करने का फ़ंक्शन
export function handleAiAdvice(chartCanvas: HTMLElement | HTMLCanvasElement, chartTitle: string): void {
    if (chartCanvas) {
        getAiChartAdvice(chartCanvas, chartTitle);
    } else {
        showMessage('AI सलाह के लिए चार्ट कैनवास नहीं मिला।', 'warning');
        console.warn("AI सलाह के लिए चार्ट कैनवास नहीं मिला।");
    }
}

// सभी चार्ट पर इवेंट लिसनर्स अटैच करने का फ़ंक्शन
export function attachChartActionListeners(): void {
    document.querySelectorAll('.chart-delete-btn').forEach(button => {
        button.addEventListener('click', (event: Event) => {
            event.preventDefault();
            const target = event.target as HTMLElement;
            const chartItem = target.closest('.chart-item') as HTMLElement | null;
            if (chartItem) {
                handleDeleteChart(chartItem);
            }
        });
    });

    document.querySelectorAll('.chart-ai-advice-btn').forEach(button => {
        button.addEventListener('click', (event: Event) => {
            event.preventDefault();
            const target = event.target as HTMLElement;
            const chartItem = target.closest('.chart-item') as HTMLElement | null;
            if (!chartItem) return;
            const chartCanvas = chartItem.querySelector('.chart-canvas') as HTMLElement | HTMLCanvasElement | null;
            const chartTitleElement = chartItem.querySelector('.chart-title');
            const chartTitle = chartTitleElement?.textContent || "यह चार्ट";

            if (chartCanvas) {
                handleAiAdvice(chartCanvas, chartTitle);
            }
        });
    });
}
