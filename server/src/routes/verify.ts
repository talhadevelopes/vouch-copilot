import { Hono } from 'hono';
import { stream } from 'hono/streaming';
import { geminiService } from '../services/gemini';
import { cacheService } from '../services/cache';

const router = new Hono();

router.post('/', async (c) => {
  const { pageContent, pageUrl, claim } = await c.req.json();

  // Support verifying a single claim (used by "Vouch this").
  if (typeof claim === 'string' && claim.trim().length > 0) {
    const result = await geminiService.verifyClaim(claim.trim());
    return stream(c, async (s) => {
      await s.write(JSON.stringify(result) + '\n');
    });
  }

  if (!pageContent) {
    return c.json({ error: 'pageContent is required' }, 400);
  }

  const cacheKey = pageUrl ? `verify:${pageUrl}` : null;

  if (cacheKey) {
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      console.log(`Cache hit for /verify: ${pageUrl}`);
      return stream(c, async (s) => {
        const results = Array.isArray(cached) ? cached : [cached];
        for (const res of results) {
          await s.write(JSON.stringify(res) + '\n');
        }
      });
    }
  }

  return stream(c, async (s) => {
    try {
      const claims = await geminiService.extractClaims(pageContent);
      const allResults: any[] = [];
      
      const verificationPromises = claims.map(async (claim) => {
        const result = await geminiService.verifyClaim(claim);
        allResults.push(result);
        await s.write(JSON.stringify(result) + '\n');
        return result;
      });

      await Promise.all(verificationPromises);

      if (cacheKey && allResults.length > 0) {
        await cacheService.set(cacheKey, allResults);
      }
    } catch (error: any) {
      console.error('Verification error:', error);
      await s.write(JSON.stringify({ error: error.message }) + '\n');
    }
  });
});

export default router;
