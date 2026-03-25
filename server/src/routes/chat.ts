import { Hono } from 'hono';
import { geminiService } from '../services/gemini';

const router = new Hono();

router.post('/', async (c) => {
  const { message, pageContent, messages, computeSourceSentence } = await c.req.json();

  if (!pageContent) {
    return c.json({ error: 'pageContent is required' }, 400);
  }

  const chatMessages =
    Array.isArray(messages) && messages.length > 0
      ? messages
      : typeof message === 'string' && message.trim().length > 0
        ? [{ sender: 'user', text: message }]
        : [];

  if (chatMessages.length === 0) {
    return c.json({ error: 'message or messages are required' }, 400);
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (payload: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      };

      (async () => {
        try {
          const result = await geminiService.chatStream(
            chatMessages,
            pageContent,
            (token) => send({ type: 'token', text: token }),
            computeSourceSentence !== false,
          );

          send({
            type: 'final',
            answer: result.answer,
            sourceSentence: result.sourceSentence,
          });
        } catch (error: any) {
          console.error('Chat stream error:', error);
          send({
            type: 'final',
            answer: 'Sorry, I encountered an error while processing your request.',
            sourceSentence: null,
          });
        } finally {
          controller.close();
        }
      })();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
});

export default router;
