import cookieParser from 'cookie-parser';
import express, { type NextFunction, type Request, type Response } from 'express';
import { config } from './config.js';
import { runMigrations } from './db/migrate.js';
import { seedDatabase } from './db/seed.js';
import { authRouter } from './routes/auth.js';
import { conversationsRouter, settingsRouter } from './routes/conversations.js';

const app = express();
app.disable('x-powered-by');
// Image attachments are stored inline as base64, so allow larger bodies
app.use(express.json({ limit: '25mb' }));
app.use(cookieParser());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});
app.use('/api/auth', authRouter);
app.use('/api/conversations', conversationsRouter);
app.use('/api/settings', settingsRouter);

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Log without request bodies or headers so nothing user-supplied ends up in logs
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  console.error(`[${req.method} ${req.path}]`, err.message);
  res.status(500).json({ error: 'Internal server error' });
});

const start = async () => {
  await runMigrations();
  if (config.seedOnStart) {
    await seedDatabase();
  }
  app.listen(config.port, () => {
    console.log(`API listening on :${config.port}`);
  });
};

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
