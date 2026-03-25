import { Hono } from 'hono';
import { geminiService } from '../services/gemini';
import { cacheService } from '../services/cache';

const router = new Hono();

router.post('/', async (c) => {
  const { pageContent, pageUrl } = await c.req.json();

  if (!pageContent) {
    return c.json({ error: 'pageContent is required' }, 400);
  }

  const cacheKey = pageUrl ? `analyze:${pageUrl}` : null;

  if (cacheKey) {
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      console.log(`Cache hit for /analyze: ${pageUrl}`);
      return c.json(cached);
    }
  }

  try {
    const analysisData = await geminiService.analyzeLanguage(pageContent);
    
    if (cacheKey) {
      await cacheService.set(cacheKey, analysisData);
    }

    return c.json(analysisData);
  } catch (error: any) {
    console.error('Analysis error:', error);
    return c.json({ error: error.message }, 500);
  }
});

export default router;
