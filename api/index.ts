import express, { Request, Response } from 'express';
import { apiV1Router } from '../src/server/routes/api.router.ts';
import { connectMongo, getPersistenceMode } from '../src/server/db/mongodb.ts';
import { loadAndValidateConfig } from '../src/server/config.ts';

// Serverless Express handler for Vercel deployment
const app = express();

// Parse JSON bodies
app.use(express.json());

// Enable CORS for client requests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-role, x-user-name');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Middleware to ensure warm database connection in serverless runtime
app.use(async (_req, _res, next) => {
  try {
    const config = loadAndValidateConfig();
    if (config.mongoUri) {
      await connectMongo();
    }
  } catch (err) {
    console.warn('[Vercel Serverless] MongoDB warm connection warning:', err);
  }
  next();
});

// Mount API router on both /api/v1 and /api
app.use('/api/v1', apiV1Router);
app.use('/api', apiV1Router);

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    runtime: 'vercel-serverless',
    timestamp: new Date().toISOString(),
    persistence: getPersistenceMode()
  });
});

export default app;
