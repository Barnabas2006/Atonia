import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { apiV1Router } from './src/server/routes/api.router.ts';
import { connectMongo, closeMongo, getPersistenceMode } from './src/server/db/mongodb.ts';
import { loadAndValidateConfig } from './src/server/config.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  // Validate environment configuration at server startup
  const config = loadAndValidateConfig();

  const app = express();
  const PORT = config.port;

  // JSON Body Parser
  app.use(express.json());

  // Connect to MongoDB Atlas if configured
  if (config.mongoUri) {
    try {
      await connectMongo();
      console.log(`[ATONIA AGENT] Persistence Mode: ${getPersistenceMode()}`);
    } catch (err) {
      console.warn('[ATONIA AGENT] Initial MongoDB connection notice:', err);
    }
  } else {
    console.log(`[ATONIA AGENT] Persistence Mode: ${getPersistenceMode()}`);
  }

  // Mount versioned REST API
  app.use('/api/v1', apiV1Router);

  // Mount Vite or static assets
  if (config.nodeEnv === 'production') {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    // Dynamic import of Vite in dev mode
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: PORT,
        hmr: false
      },
      appType: 'spa'
    });

    // Mount Vite dev middlewares
    app.use(vite.middlewares);

    // SPA fallback: render index.html through Vite transform
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[ATONIA AGENT] Production Foundation running on http://0.0.0.0:${PORT}`);
    console.log(`  ➜  Local:   http://localhost:${PORT}/`);
    console.log(`  ➜  Network: http://0.0.0.0:${PORT}/`);
    console.log(`  ➜  Persistence: ${getPersistenceMode()}`);
  });

  // Graceful shutdown handling
  const shutdown = async (signal: string) => {
    console.log(`\n[ATONIA AGENT] Received ${signal}. Gracefully terminating server...`);
    server.close(async () => {
      await closeMongo();
      console.log('[ATONIA AGENT] Server terminated cleanly.');
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

startServer().catch((err) => {
  console.error('\x1b[31m%s\x1b[0m', 'Fatal error starting Atonia Agent server:', err);
  process.exit(1);
});
