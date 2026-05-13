import { genAI, MODEL_NAME, withRetry } from './model';
import type { AnalysisResult } from '../../types';

const EMPTY_ANALYSIS: AnalysisResult = {
  biasDirection: 'unknown',
  biasScore: 0,
  manipulativeLanguage: [],
  opinionAsFact: [],
  overallTone: 'Analysis not available for this page type.',
};

export const analyzeService = {
  // Analyze page content for bias and manipulative language.
  async analyzeLanguage(pageContent: string): Promise<AnalysisResult> {
    const words = pageContent.trim().split(/\s+/).filter(Boolean).length;
    if (words < 300) return EMPTY_ANALYSIS;

    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const prompt = `
      Analyze the language of the following news article content for bias and emotional manipulation.
      
      Return ONLY a JSON object with this exact structure:
      {
        "biasDirection": "left" | "right" | "center" | "unknown",
        "biasScore": number (0-100),
        "manipulativeLanguage": [
          { "sentence": "...", "reason": "..." }
        ],
        "opinionAsFact": [
          { "sentence": "...", "reason": "..." }
        ],
        "overallTone": "string"
      }
      
      Content: ${pageContent.substring(0, 4000)}
    `.trim();

    try {
      const result = await withRetry(() => model.generateContent(prompt));
      const text = result.response.text();
      const jsonMatch = text.match(/\{.*\}/s);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(text);
    } catch (err: any) {
      console.warn('[Vouch] analyzeLanguage failed:', err);
      return EMPTY_ANALYSIS;
    }
  },
};