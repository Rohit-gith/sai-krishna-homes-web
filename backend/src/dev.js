// Local API server for development. The frontend dev server proxies /api to it (frontend/vite.config.js).
// Run: npm run dev   (reads .env)
import app from './app.js';

const port = Number(process.env.API_PORT || 8787);
app.listen(port, () => console.log(`API ready on http://localhost:${port}/api`));
