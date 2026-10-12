import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { apiV1Router } from './src/server/routes/api.router.ts';
import { connectMongo } from './src/server/db/mongodb.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();

  // Port 3000 & iFrame: Dev server must run on port 3000.
  // In AI Studio container, process.env.PORT is 8080 (bound by Nginx).
  // Therefore default to 3000 unless explicit --port argument is provided.
  let PORT = 3000;
  const portArgIndex = process.argv.indexOf('--port');
  if (portArgIndex !== -1 && process.argv[portArgIndex + 1]) {
    const parsed = parseInt(process.argv[portArgIndex + 1], 10);
    if (!isNaN(parsed) && parsed > 0) {
      PORT = parsed;
    }
  } else if (process.env.APP_PORT) {
    PORT = parseInt(process.env.APP_PORT, 10);
  }

  // JSON Body Parser
  app.use(express.json());

  // Non-blocking MongoDB connection
  connectMongo().catch((err) => {
    console.warn('MongoDB connection fallback notice:', err);
  });

  // Mount versioned REST API
  app.use('/api/v1', apiV1Router);

  // Mount Vite or static assets
  if (process.env.NODE_ENV === 'production') {
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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[ATONIA AGENT] Production Foundation running on http://0.0.0.0:${PORT}`);
    console.log(`  ➜  Local:   http://localhost:${PORT}/`);
    console.log(`  ➜  Network: http://0.0.0.0:${PORT}/`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting Atonia Agent server:', err);
  process.exit(1);
});
