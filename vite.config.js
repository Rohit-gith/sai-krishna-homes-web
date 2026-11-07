import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

/**
 * Restart the dev server when tailwind.config.cjs changes.
 * A running server otherwise keeps the old Tailwind config, so new colours, fonts and
 * animations silently don't appear (or `@apply` fails with "class does not exist").
 */
function restartOnTailwindConfigChange() {
  return {
    name: 'restart-on-tailwind-config-change',
    configureServer(server) {
      const file = path.resolve(__dirname, 'tailwind.config.cjs');
      server.watcher.add(file);
      server.watcher.on('change', (changed) => {
        if (path.resolve(changed) === file) {
          server.config.logger.info('tailwind.config.cjs changed, restarting dev server…', { timestamp: true });
          server.restart();
        }
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), restartOnTailwindConfigChange()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Pre-bundle libraries that are only reached through lazy admin pages, so the dev server doesn't
  // re-optimize mid-session (which breaks the open tab with "Outdated Optimize Dep").
  optimizeDeps: {
    include: ['read-excel-file'],
  },
  server: {
    // Fixed port for this project. 5173 is used by another local project (Oasis_furnihome),
    // so we pin 5174 and fail loudly instead of silently jumping to a random port.
    port: 5174,
    strictPort: true,
    open: true,
  },
});
