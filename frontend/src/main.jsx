import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/app/App';
import '@/styles/index.css';

// A preloaded file from an older build is gone (new deploy): reload once to get the fresh build.
window.addEventListener('vite:preloadError', (e) => {
  try {
    if (sessionStorage.getItem('skh_chunk_reload') === '1') return;
    sessionStorage.setItem('skh_chunk_reload', '1');
  } catch {
    return;
  }
  e.preventDefault();
  window.location.reload();
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
