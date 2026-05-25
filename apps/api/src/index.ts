import express, { type Express } from 'express';
import { env } from './utils/env';

// Routes
import verifyRouter from './routes/verify';
import analyzeRouter from './routes/analyze';
import chatRouter from './routes/chat';
import scanRouter from './routes/scan';
import authRouter from './routes/auth';
import dashboardRouter from './routes/dashboard';
import publicRouter from './routes/public';
import { ApiResponse } from './utils/api-response';

const app: Express = express();

// Middleware
app.use(express.json());
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

app.use((req, res, next) => {
  const origin = req.get('origin');
  
  // Use CLIENT_URL from env, but allow fallback for development
  const allowedOrigin = (() => {
    if (!origin) return env.CLIENT_URL;
    
    // Check if the origin matches CLIENT_URL or is a chrome extension
    if (origin === env.CLIENT_URL) return origin;
    if (origin.startsWith('chrome-extension://')) return origin;
    
    // In production, if we have a CLIENT_URL, we should trust it
    if (process.env.NODE_ENV === 'production') {
      return env.CLIENT_URL;
    }
    
    return origin; // Fallback for dev
  })();

  res.header('Access-Control-Allow-Origin', allowedOrigin);
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
});

// Health check
app.get('/health', (req, res) => {
  ApiResponse.success(res, 'Service healthy', {
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// Route registration
app.use('/verify', verifyRouter);
app.use('/analyze', analyzeRouter);
app.use('/chat', chatRouter);
app.use('/scan', scanRouter);
app.use('/auth', authRouter);
app.use('/dashboard', dashboardRouter);
app.use('/public', publicRouter);

// Error handling
app.use((err: any, req: any, res: any, next: any) => {
  console.error('[API Error]', err);
  ApiResponse.error(res, 'Internal server error', 'INTERNAL_SERVER_ERROR', 500);
});

const PORT = env.PORT;

// Only start the server if we're not running in a serverless environment (like Vercel)
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Vouch server running on port ${PORT}`);
  });
}

export default app;