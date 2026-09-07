import { genAI, MODEL_NAME, withRetry, getErrorMessage } from './model';
import type { ChatMessage } from '../../types';

function formatChatHistory(messages: ChatMessage[]): string {
  return messages
    .filter((m) => typeof m?.text === 'string' && m.text.trim().length > 0)
    .map((m) => (m.sender === 'user' ? `User: ${m.text}` : `Assistant: ${m.text}`))
    .join('\n');
}

function buildChatPrompt(messages: ChatMessage[], pageContent: string): string {
  return `
You are Vouch, a helpful assistant embedded in a browser extension.
The user is reading a webpage. Answer their question based on the page content below.
Be conversational, concise, and helpful. Use conversation history for context.
Format your response nicely: use **bold** for key terms, use bullet points where helpful, and keep paragraphs short.

Page Content:
${pageContent.substring(0, 4000)}

Conversation:
${formatChatHistory(messages)}

Respond with a helpful, well-formatted answer. Do NOT wrap in JSON or code blocks.
`.trim();
}

export const chatService = {
  // Non-streaming chat (returns full response).
  async chat(messages: ChatMessage[], pageContent: string) {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const prompt = buildChatPrompt(messages, pageContent);
    const result = await withRetry(() => model.generateContent(prompt));
    const answer = result.response.text().trim();
    return { answer, sourceSentence: null };
  },

  // Streaming chat
  async chatStream(
    messages: ChatMessage[],
    pageContent: string,
    onToken?: (token: string) => void,
    computeSourceSentence = true,
  ) {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const prompt = buildChatPrompt(messages, pageContent);

    let streamResult: any;
    try {
      streamResult = await withRetry(() => model.generateContentStream(prompt));
    } catch (err: any) {
      console.error('[Vouch] chatStream failed:', err);
      const errorMsg = getErrorMessage(err);
      onToken?.(errorMsg);
      return { answer: errorMsg, sourceSentence: null };
    }

    let answer = '';
    try {
      for await (const chunk of streamResult.stream) {
        const text = chunk.text();
        if (text) {
          answer += text;
          onToken?.(text);
        }
      }
    } catch (e: any) {
      console.error('[Vouch] chatStream chunk error:', e);
      if (!answer) {
        const errorMsg = getErrorMessage(e);
        onToken?.(errorMsg);
        return { answer: errorMsg, sourceSentence: null };
      }
    }

    return { answer: answer.trim(), sourceSentence: null };
  },

  async findSourceSentence(answer: string, pageContent: string): Promise<string | null> {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const { extractJsonObject } = await import('./model');

    const prompt = `
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

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const json = extractJsonObject(text);
    if (!json || !('sourceSentence' in json)) return null;
    return typeof json.sourceSentence === 'string' ? json.sourceSentence : null;
  },
};