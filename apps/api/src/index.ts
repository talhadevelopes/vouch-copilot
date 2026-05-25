import express, { type Express } from 'express';
import cors from 'cors';
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

const allowedOrigins = [
  env.CLIENT_URL,
  /^chrome-extension:\/\/[a-z]+$/
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const isAllowed = allowedOrigins.some(pattern => {
      if (typeof pattern === 'string') return pattern === origin;
      return pattern.test(origin);
    });
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
}));

// Middleware
app.use(express.json());

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

app.get('/health', (req, res) => {
  ApiResponse.success(res, 'Service healthy', {
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

app.use('/verify', verifyRouter);
app.use('/analyze', analyzeRouter);
app.use('/chat', chatRouter);
app.use('/scan', scanRouter);
app.use('/auth', authRouter);
app.use('/dashboard', dashboardRouter);
app.use('/public', publicRouter);

app.use((err: any, req: any, res: any, next: any) => {
  console.error('[API Error]', err);
  ApiResponse.error(res, 'Internal server error', 'INTERNAL_SERVER_ERROR', 500);
});

const PORT = env.PORT;

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Vouch server running on port ${PORT}`);
  });
}

export default app;