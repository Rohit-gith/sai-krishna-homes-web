import express from 'express';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.js';
import enquiryRoutes from './routes/enquiries.js';
import leadRoutes from './routes/leads.js';
import activityRoutes from './routes/activity.js';
import { sameOrigin } from './security.js';

/** The whole API. Runs on Vercel as one serverless function (api/index.js) and locally via server/dev.js. */
const app = express();
app.disable('x-powered-by');
app.set('trust proxy', true);

app.use(express.json({ limit: '5mb' })); // Excel imports can be a few hundred rows
app.use(cookieParser());
app.use((_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  res.set('X-Content-Type-Options', 'nosniff');
  next();
});
app.use('/api', sameOrigin);

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/enquiries', enquiryRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/activity', activityRoutes);

app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found.' }));

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  if (err?.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON.' });
  if (err?.type === 'entity.too.large') return res.status(413).json({ error: 'Too much data in one request.' });
  console.error(err);
  return res.status(500).json({ error: 'Something went wrong. Please try again.' });
});

export default app;
