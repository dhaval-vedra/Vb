import { describe, it, expect } from 'vitest';
import type { AiAction, ChatHistoryEntry } from '../../src/js/ai/chat.ts';

describe('AI Chat & Action Protocols', () => {
  it('should construct valid AI create-chart action payload', () => {
    const action: AiAction = {
      action: 'create-chart',
      xAxis: 'Region',
      yAxes: ['Sales (₹)'],
      type: 'bar',
      title: 'Regional Revenue',
    };

    expect(action.action).toBe('create-chart');
    expect(action.xAxis).toBe('Region');
    expect(action.yAxes).toHaveLength(1);
    expect(action.type).toBe('bar');
  });

  it('should parse json-actions markdown codeblock format correctly', () => {
    const aiResponse = `Here is your updated dashboard analysis.
\`\`\`json-actions
[
  {
    "action": "create-chart",
    "xAxis": "Category",
    "yAxes": ["Units Sold"],
    "type": "pie",
    "title": "Category Breakdown"
  },
  {
    "action": "change-theme",
    "themeId": "ocean-gradient",
    "target": "all"
  }
]
\`\`\`
Let me know if you need more changes!`;

    const actionsRegex = /```json-actions\s*([\s\S]*?)\s*```/;
    const match = aiResponse.match(actionsRegex);
    
    expect(match).not.toBeNull();
    if (match && match[1]) {
      const actions: AiAction[] = JSON.parse(match[1]);
      expect(Array.isArray(actions)).toBe(true);
      expect(actions).toHaveLength(2);
      expect(actions[0].action).toBe('create-chart');
      expect(actions[1].action).toBe('change-theme');
      expect(actions[1].themeId).toBe('ocean-gradient');
    }
  });

  it('should support chat history structure with user and assistant roles', () => {
    const history: ChatHistoryEntry[] = [
      { type: 'user', message: 'Show me sales by region' },
      { type: 'assistant', message: 'Here is the bar chart for sales by region.' },
    ];

    expect(history).toHaveLength(2);
    expect(history[0].type).toBe('user');
    expect(history[1].type).toBe('assistant');
  });
});
