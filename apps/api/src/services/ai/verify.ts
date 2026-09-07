
// Verification AI services - extractAndVerifyClaims, verifyClaim, verifyClaimStream.

import { genAI, MODEL_NAME, withRetry, getErrorMessage, extractJsonObject } from './model';
import type { VerificationResult } from '../../types';


export const verifyService = {
  /** Extract AND verify claims in a single Gemini call. Used by Scan. */
  async extractAndVerifyClaims(pageContent: string): Promise<VerificationResult[]> {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const prompt = `You are a fact-checker. Read the article below and find up to 5 key factual claims.
For each claim, verify whether it is supported, contradicted, or unverified based on your knowledge.
Return ONLY a valid JSON array, no other text:
[
  {
    "claim": "the specific claim",
    "verdict": "supported" | "contradicted" | "unverified",
    "explanation": "1-2 sentence explanation",
    "sources": []
  }
]

Article:
${pageContent.substring(0, 4000)}`.trim();

    try {
      const result = await withRetry(() => model.generateContent(prompt));
      const text = result.response.text();
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) return [];
      const parsed = JSON.parse(jsonMatch[0]);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((r: any) => r.claim && r.verdict) as VerificationResult[];
    } catch (err: any) {
      console.error('[Vouch] extractAndVerifyClaims failed:', err);
      return [{ claim: 'Scan failed', verdict: 'unverified', explanation: getErrorMessage(err), sources: [] }];
    }
  },

  //Verify a single claim (non-streaming, JSON response).
  async verifyClaim(claim: string) {
    const prompt = `Verify this claim. Return ONLY valid JSON: {"verdict":"supported"|"contradicted"|"unverified","explanation":"short explanation","sources":["url1"]}

Claim: "${claim}"`.trim();

    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    try {
      const result = await withRetry(() => model.generateContent(prompt));
      const text = result.response.text();
      const json = extractJsonObject(text);

      let verdict: 'supported' | 'contradicted' | 'unverified' = 'unverified';
      let explanation = '';
      let sources: string[] = [];

      if (json) {
        const v = String(json.verdict || '').toLowerCase();
        if (v === 'supported') verdict = 'supported';
        else if (v === 'contradicted') verdict = 'contradicted';
        explanation = typeof json.explanation === 'string' ? json.explanation : '';
        sources = Array.isArray(json.sources)
          ? json.sources.filter((s: any) => typeof s === 'string')
          : [];
      }

      if (!explanation) {
        const match = text.match(/(supported|contradicted|unverified)/i);
        if (match?.[1]) verdict = match[1].toLowerCase() as typeof verdict;
        explanation = text.trim().slice(0, 300);
      }

      return { claim, verdict, explanation, sources };
    } catch (e: any) {
      console.error(`[Vouch] verifyClaim failed for: ${claim}`, e);
      return {
        claim,
        verdict: 'unverified' as const,
        explanation: getErrorMessage(e),
        sources: [],
      };
    }
  },

  // Streaming claim verification with google_search grounding.
  async verifyClaimStream(claim: string, onToken?: (token: string) => void) {
    const model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      tools: [{ // @ts-ignore
        google_search: {}
      }],
    });

    const prompt = `
Verify the following claim using web search. Give a clear, well-formatted analysis.

Claim: "${claim}"

Format your response as:
**Verdict:** [Supported / Contradicted / Unverified]

**Explanation:**
[Your detailed explanation with **bold** key facts and bullet points where helpful]

**Sources:**
[List any source URLs you found, one per line]
`.trim();

    let answer = '';
    try {
      const streamResult = await withRetry(() => model.generateContentStream(prompt));
      for await (const chunk of streamResult.stream) {
        const text = chunk.text();
        if (text) {
          answer += text;
          onToken?.(text);
        }
      }
    } catch (e: any) {
      console.error('[Vouch] verifyClaimStream grounded attempt failed:', e);
      
      // If the grounded stream fails (common in preview models with tools), 
      // we immediately fallback to a clean non-grounded stream.
      if (!answer) {
        console.log('[Vouch] Falling back to non-grounded stream for reliability...');
        const fallbackModel = genAI.getGenerativeModel({ model: MODEL_NAME });
        try {
          const streamResult = await withRetry(() => fallbackModel.generateContentStream(prompt));
          for await (const chunk of streamResult.stream) {
            const text = chunk.text();
            if (text) {
              answer += text;
              onToken?.(text);
            }
          }
        } catch (e2: any) {
          console.error('[Vouch] Fallback stream also failed:', e2);
          const errorMsg = getErrorMessage(e2);
          onToken?.(errorMsg);
          return errorMsg;
        }
      }
    }

    return answer.trim();
  },
};