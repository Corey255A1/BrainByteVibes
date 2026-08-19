import { GoogleGenAI } from '@google/genai';
import { buildTopicPrompt, buildWildcardPrompt, buildArticlePrompt } from './prompts';
import type { GamePayload } from '../types';

export interface GeminiModelInfo {
  id: string;
  name: string;
  costTier: string;
  costDescription: string;
  description: string;
}

export const FALLBACK_MODELS: GeminiModelInfo[] = [
  {
    id: 'gemini-1.5-flash-8b',
    name: 'Gemini 1.5 Flash 8B',
    costTier: '💲',
    costDescription: 'Cheapest / Ultra Fast',
    description: 'Fastest and lowest cost model for high volume tasks.'
  },
  {
    id: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    costTier: '💲💲',
    costDescription: 'Balanced / Low Cost',
    description: 'Recommended default. Fast, accurate, and budget friendly.'
  },
  {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    costTier: '💲💲💲',
    costDescription: 'Higher Cost / Complex Reasoning',
    description: 'Advanced reasoning and deep context analysis.'
  }
];

function determineCostTier(modelId: string): { costTier: string; costDescription: string } {
  const mid = modelId.toLowerCase();
  if (mid.includes('8b') || mid.includes('nano') || mid.includes('lite')) {
    return { costTier: '💲', costDescription: 'Cheapest / Ultra Fast' };
  } else if (mid.includes('flash')) {
    return { costTier: '💲💲', costDescription: 'Balanced / Low Cost' };
  } else if (mid.includes('pro') || mid.includes('ultra')) {
    return { costTier: '💲💲💲', costDescription: 'Higher Cost / High Performance' };
  }
  return { costTier: '💲💲', costDescription: 'Standard' };
}

export class GeminiService {
  private getApiKey(): string | null {
    return localStorage.getItem('antiscroll_gemini_api_key') || null;
  }

  public setApiKey(key: string): void {
    localStorage.setItem('antiscroll_gemini_api_key', key);
  }

  private getClient(keyOverride?: string): GoogleGenAI {
    const key = keyOverride || this.getApiKey();
    if (!key) {
      throw new Error('Gemini API Key missing. Please set your API key in Settings.');
    }
    return new GoogleGenAI({ apiKey: key });
  }

  public async listModels(backendUrl?: string): Promise<GeminiModelInfo[]> {
    // Attempt backend NAS endpoint if reachable first
    if (backendUrl) {
      try {
        const res = await fetch(`${backendUrl}/ai/models`, {
          headers: this.getApiKey() ? { 'X-Gemini-Key': this.getApiKey()! } : {}
        });
        if (res.ok) {
          const data = await res.json();
          if (data.models && data.models.length > 0) {
            return data.models;
          }
        }
      } catch (e) {
        console.warn('Failed to fetch models from backend, falling back to direct SDK/fallback:', e);
      }
    }

    // Direct SDK call client side
    try {
      const ai = this.getClient();
      const response = await ai.models.list();
      const modelsList: GeminiModelInfo[] = [];

      for await (const m of response) {
        const rawName = m.name || '';
        const id = rawName.replace('models/', '');
        if (id.includes('gemini')) {
          const { costTier, costDescription } = determineCostTier(id);
          modelsList.push({
            id,
            name: m.displayName || id,
            costTier,
            costDescription,
            description: m.description || ''
          });
        }
      }

      if (modelsList.length > 0) {
        modelsList.sort((a, b) => a.costTier.localeCompare(b.costTier) || a.id.localeCompare(b.id));
        return modelsList;
      }
    } catch (e) {
      console.warn('Failed to query models via client SDK:', e);
    }

    return FALLBACK_MODELS;
  }

  public async fetchTopics(
    categories: string[],
    readHistory: string[] = [],
    model: string = 'gemini-1.5-flash'
  ): Promise<{ title: string; subtitle: string; category: string }[]> {
    const prompt = buildTopicPrompt(categories, readHistory);
    const ai = this.getClient();
    const response = await ai.models.generateContent({
      model: model || 'gemini-1.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });
    const text = response.text || '[]';
    return JSON.parse(text);
  }

  public async fetchWildcard(
    categories: string[],
    model: string = 'gemini-1.5-flash'
  ): Promise<{ title: string; subtitle: string; category: string }> {
    const prompt = buildWildcardPrompt(categories);
    const ai = this.getClient();
    const response = await ai.models.generateContent({
      model: model || 'gemini-1.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });
    const text = response.text || '{}';
    return JSON.parse(text);
  }

  public async generateArticle(
    topic: string,
    category: string,
    readMinutes: number = 5,
    model: string = 'gemini-1.5-flash',
    onChunk?: (text: string) => void
  ): Promise<{ markdown: string; gamePayload: GamePayload | null }> {
    const prompt = buildArticlePrompt(topic, category, readMinutes);
    const ai = this.getClient();

    let fullText = '';
    const responseStream = await ai.models.generateContentStream({
      model: model || 'gemini-1.5-flash',
      contents: prompt
    });

    for await (const chunk of responseStream) {
      if (chunk.text) {
        fullText += chunk.text;
        if (onChunk) onChunk(fullText);
      }
    }

    // Extract game JSON payload if present
    let gamePayload: GamePayload | null = null;
    let markdown = fullText;

    const gameMatch = fullText.match(/```game-json\s*([\s\S]*?)\s*```/);
    if (gameMatch) {
      try {
        gamePayload = JSON.parse(gameMatch[1]);
        markdown = fullText.replace(/```game-json\s*[\s\S]*?\s*```/, '').trim();
      } catch (e) {
        console.warn('Failed to parse game JSON payload:', e);
      }
    }

    return { markdown, gamePayload };
  }
}

export const geminiService = new GeminiService();
