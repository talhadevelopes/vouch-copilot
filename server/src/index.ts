import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import { env } from './config/env';

// Routes
import verifyRouter from './routes/verify';
import analyzeRouter from './routes/analyze';
import chatRouter from './routes/chat';

const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Route registration
app.route('/verify', verifyRouter);
app.route('/analyze', analyzeRouter);
app.route('/chat', chatRouter);

console.log(`Vouch server running on port ${env.PORT}`);

export default {
  port: env.PORT,
  fetch: app.fetch,
};