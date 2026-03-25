import { GoogleGenerativeAI, DynamicRetrievalMode } from '@google/generative-ai';
import { env } from '../config/env';

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

type ChatMessage = { sender: "user" | "vouch"; text: string };

// No retry loops: if Gemini rate-limits (429), we fail fast and rely on endpoint fallbacks.
async function with429Retry<T>(fn: () => Promise<T>): Promise<T> {
  return await fn();
}

function formatChatHistory(messages: ChatMessage[]) {
  return messages
    .filter((m) => typeof m?.text === "string" && m.text.trim().length > 0)
    .map((m) => (m.sender === "user" ? `User: ${m.text}` : `Assistant: ${m.text}`))
    .join("\n");
}

function extractJsonObject(text: string) {
  const normalized = text.trim();
  // Best-effort extraction: pick the first {...} block.
  const match = normalized.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

export const geminiService = {
  async extractClaims(pageContent: string): Promise<string[]> {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const extractPrompt = `
      Extract 4-5 specific, verifiable factual claims from the following webpage content.
      Return ONLY a JSON array of strings. Do not include any other text.
      
      Content: ${pageContent.substring(0, 10000)}
    `;

    try {
      const result = await with429Retry(() => model.generateContent(extractPrompt));
      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/\[.*\]/s);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(text);
    } catch (err: any) {
      const status = err?.status ?? err?.response?.status;
      const is429 = status === 429 || String(err?.message || err || '').includes('429');
      console.warn('[Vouch] extractClaims failed (likely rate-limited). Returning empty claims.', err);
      return is429 ? [] : [];
    }
  },

  async verifyClaim(claim: string) {
    const verifyPrompt = `
Verify the following claim using web search.

Claim: "${claim}"

Return ONLY a valid JSON object with these keys:
{
  "verdict": "supported" | "contradicted" | "unverified",
  "explanation": string,
  "sources": string[]
}
`.trim();

    const normalizeVerdict = (v: any): "supported" | "contradicted" | "unverified" => {
      const s = String(v || '').toLowerCase();
      if (s === 'supported') return 'supported';
      if (s === 'contradicted') return 'contradicted';
      return 'unverified';
    };

    const extractUrlsFromText = (t: string) => {
      const matches = t.match(/https?:\/\/[^\s"')\]]+/g) || [];
      // De-dupe while preserving order.
      const seen = new Set<string>();
      const out: string[] = [];
      for (const m of matches) {
        if (seen.has(m)) continue;
        seen.add(m);
        out.push(m);
      }
      return out;
    };

    const extractSourcesFromResponse = (resp: any): string[] => {
      const candidate = resp?.candidates?.[0];
      const citationUris: string[] = (candidate?.citationMetadata?.citationSources || [])
        .map((cs: any) => cs?.uri)
        .filter((u: any) => typeof u === 'string' && u.trim().length > 0);

      if (citationUris.length > 0) return citationUris;

      // Fallback: grounding metadata sometimes contains chunk URIs.
      const grounding = candidate?.groundingMetadata || resp?.groundingMetadata;
      const chunkUris: string[] = (grounding?.groundingChunks || [])
        .map((gc: any) => gc?.web?.uri)
        .filter((u: any) => typeof u === 'string' && u.trim().length > 0);

      return chunkUris;
    };

    const parseVerifyOutput = (text: string, resp: any) => {
      const json = extractJsonObject(text);
      const parsed =
        json && typeof json === 'object'
          ? (json as any)
          : null;

      let verdictRaw = parsed?.verdict;
      let explanation = typeof parsed?.explanation === 'string' ? parsed.explanation : '';
      let sources =
        Array.isArray(parsed?.sources) ? parsed.sources.filter((s: any) => typeof s === 'string') : null;

      let verdict = verdictRaw ? normalizeVerdict(verdictRaw) : null;
      if (!verdict) {
        const verdictMatch =
          text.match(/"verdict"\s*:\s*"(supported|contradicted|unverified)"/i) ||
          text.match(/(supported|contradicted|unverified)/i);
        if (verdictMatch && verdictMatch[1]) {
          verdict = normalizeVerdict(verdictMatch[1]);
        }
      }

      if (!sources || sources.length === 0) {
        sources = extractSourcesFromResponse(resp);
      }

      if (!sources || sources.length === 0) {
        sources = extractUrlsFromText(text);
      }

      if (!explanation) {
        // Last-resort explanation: trim the whole model output.
        explanation = text.trim().slice(0, 400);
      }

      return {
        verdict,
        explanation,
        sources: Array.isArray(sources) ? sources : [],
      };
    };

    const attempt = async (model: any) => {
      const result: any = await with429Retry(() => model.generateContent(verifyPrompt));
      const response = await result.response;
      const text = response.text();

      const parsed = parseVerifyOutput(text, response);
      const verdict = parsed.verdict || 'unverified';

      return {
        claim,
        verdict,
        explanation: parsed.explanation || 'No explanation returned.',
        sources: parsed.sources || [],
      };
    };

    try {
      const modelWithGrounding = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        tools: [
          {
            // @ts-ignore - the SDK typings are permissive but we keep runtime structure.
            googleSearchRetrieval: {
              dynamicRetrievalConfig: { mode: DynamicRetrievalMode.MODE_DYNAMIC },
            },
          },
        ],
      });
      return await attempt(modelWithGrounding);
    } catch (e) {
      console.warn(`[Vouch] verifyClaim grounding attempt failed for claim: ${claim}`, e);
      const status = (e as any)?.status ?? (e as any)?.response?.status;
      const is429 = status === 429 || String((e as any)?.message || e || '').includes('429');
      if (is429) {
        return {
          claim,
          verdict: 'unverified',
          explanation: 'Verification unavailable due to temporary rate limiting. Please try again shortly.',
          sources: [],
        };
      }
      const modelNoGrounding = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      try {
        return await attempt(modelNoGrounding);
      } catch (e2) {
        console.error(`[Vouch] verifyClaim fallback attempt failed for claim: ${claim}`, e2);
        return {
          claim,
          verdict: 'unverified',
          explanation:
            'Verification unavailable due to temporary rate limiting. Please try again shortly.',
          sources: [],
        };
      }
    }
  },

  async analyzeLanguage(pageContent: string) {
    // Avoid wasting an API call on non-article pages.
    const words = pageContent.trim().split(/\s+/).filter(Boolean).length;
    if (words < 300) {
      return {
        biasDirection: 'unknown',
        biasScore: 0,
        manipulativeLanguage: [],
        opinionAsFact: [],
        overallTone: 'Analysis not available for this page type.',
      };
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const analyzePrompt = `
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
      
      Content: ${pageContent.substring(0, 10000)}
    `;

    try {
      const result = await with429Retry(() => model.generateContent(analyzePrompt));
      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/\{.*\}/s);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(text);
    } catch (err: any) {
      console.warn('[Vouch] analyzeLanguage failed; returning analysis not available.', err);
      return {
        biasDirection: 'unknown',
        biasScore: 0,
        manipulativeLanguage: [],
        opinionAsFact: [],
        overallTone: 'Analysis not available for this page type.',
      };
    }
  },

  async chat(messages: ChatMessage[], pageContent: string) {
    // Non-streaming fallback (also useful for debugging).
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const answerPrompt = `
You are Vouch, a helpful assistant.
The user is reading a webpage.
Answer their question using the provided page content as your primary source.
Be conversational and helpful.
Use the conversation history to keep context.
Only say the information is unrelated if the question is completely unrelated to the page content.

Page Content:
${pageContent.substring(0, 15000)}

Chat History:
${formatChatHistory(messages)}

Return ONLY a JSON object:
{
  "answer": string,
  "sourceSentence": string | null
}
`.trim();

    const result = await model.generateContent(answerPrompt);
    const response = await result.response;
    const text = response.text();
    const json = extractJsonObject(text);
    const answer = typeof json?.answer === 'string' ? json.answer : text;
    const sourceSentence =
      typeof json?.sourceSentence === 'string' ? json.sourceSentence : null;

    return {
      answer,
      sourceSentence:
        sourceSentence || (answer ? await this.findSourceSentence(answer, pageContent) : null),
    };
  },

  async chatStream(
    messages: ChatMessage[],
    pageContent: string,
    onToken?: (token: string) => void,
    computeSourceSentence: boolean = true,
  ) {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const answerPrompt = `
You are Vouch, a helpful assistant.
The user is reading a webpage.
Answer their question using the provided page content as your primary source.
Be conversational and helpful.
Use the conversation history to keep context.
Only say the information is unrelated if the question is completely unrelated to the page content.

Page Content:
${pageContent.substring(0, 15000)}

Chat History:
${formatChatHistory(messages)}

Return ONLY a JSON object:
{
  "answer": string,
  "sourceSentence": string | null
}
`.trim();

    let streamResult: any;
    try {
      streamResult = await with429Retry(() => model.generateContentStream(answerPrompt));
    } catch (err: any) {
      console.warn('[Vouch] chatStream failed; returning rate-limit fallback.', err);
      const fallbackAnswer =
        'Rate limit reached. Please try again in a moment.';
      // Stream fallback to keep UX consistent.
      const parts = fallbackAnswer.match(/\S+\s*/g) || [];
      for (const part of parts) onToken?.(part);
      return { answer: fallbackAnswer, sourceSentence: null };
    }

    // Wait for the full model output, then parse JSON and stream answer words.
    let answer = "";
    let sourceSentence: string | null = null;
    try {
      const aggregated = await streamResult.response;
      const text = aggregated.text();
      const json = extractJsonObject(text);
      answer = typeof json?.answer === 'string' ? json.answer : text;
      sourceSentence =
        typeof json?.sourceSentence === 'string' ? json.sourceSentence : null;
    } catch (e) {
      console.error("[Vouch] chatStream failed to get aggregated response:", e);
      answer = "";
      sourceSentence = null;
    }

    if (computeSourceSentence && !sourceSentence && answer) {
      try {
        sourceSentence = await this.findSourceSentence(answer, pageContent);
      } catch (e) {
        console.warn("[Vouch] Failed to compute sourceSentence:", e);
        sourceSentence = null;
      }
    }

    const parts = (answer || "").match(/\S+\s*/g) || [];
    for (const part of parts) {
      onToken?.(part);
    }

    return { answer: answer || "", sourceSentence };
  },

  async findSourceSentence(answer: string, pageContent: string): Promise<string | null> {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const sourcePrompt = `
Given the Page Content and the assistant Answer, find the SINGLE sentence from the Page Content
that best supports the key information in the Answer.

If no sentence in the Page Content supports it, return null.

Return ONLY JSON with this exact schema:
{ "sourceSentence": string | null }

Page Content:
${pageContent.substring(0, 20000)}

Answer:
${answer}
`.trim();

    const result = await model.generateContent(sourcePrompt);
    const response = await result.response;
    const text = response.text();

    const json = extractJsonObject(text);
    if (!json || !("sourceSentence" in json)) return null;
    const sourceSentence = (json as any).sourceSentence;
    return typeof sourceSentence === "string" ? sourceSentence : null;
  },
};
