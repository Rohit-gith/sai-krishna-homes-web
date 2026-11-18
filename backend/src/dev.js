// Local API server for development. The frontend dev server proxies /api to it (frontend/vite.config.js).
// Run: npm run dev   (reads .env)
import app from './app.js';

const port = Number(process.env.API_PORT || 8787);
const dbName = process.env.MONGODB_DB || 'saikrishnahomes';
const LIVE_DB = process.env.LIVE_MONGODB_DB || 'saikrishnahomes';

app.listen(port, () => {
  console.log(`API ready on http://localhost:${port}/api`);
  if (dbName === LIVE_DB) {
    console.log('\n  !!! WARNING: using the LIVE database "' + dbName + '" (the client\'s real data).');
    console.log('  !!! Anything you test now goes into the real admin panel.');
    console.log('  !!! For testing set MONGODB_DB=saikrishnahomes_dev in backend/.env\n');
  } else {
    console.log(`Database: ${dbName}  (TESTING: nothing here reaches the live site)`);
  }
});
