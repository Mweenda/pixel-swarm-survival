import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('.', import.meta.url)),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    build: {
      rolldownOptions: {
        output: {
          codeSplitting: {
            groups: [
              {
                name: 'react-vendor',
                test: /node_modules[\\/]\.pnpm[\\/](?:react|react-dom|scheduler)@/,
                entriesAware: true,
                priority: 20,
              },
              {
                name: 'firebase-auth',
                test: /node_modules[\\/]\.pnpm[\\/]@firebase\+auth(?:@|-)|node_modules[\\/]\.pnpm[\\/]firebase@[^/]+[\\/]node_modules[\\/]firebase[\\/]auth[\\/]/,
                entriesAware: true,
                priority: 30,
              },
              {
                name: 'firebase-firestore',
                test: /node_modules[\\/]\.pnpm[\\/]@firebase\+firestore(?:@|-)|node_modules[\\/]\.pnpm[\\/]firebase@[^/]+[\\/]node_modules[\\/]firebase[\\/]firestore[\\/]/,
                entriesAware: true,
                maxSize: 450_000,
                priority: 30,
              },
              {
                name: 'firebase-analytics',
                test: /node_modules[\\/]\.pnpm[\\/]@firebase\+analytics(?:@|-)|node_modules[\\/]\.pnpm[\\/]firebase@[^/]+[\\/]node_modules[\\/]firebase[\\/]analytics[\\/]/,
                entriesAware: true,
                priority: 30,
              },
            ],
          },
        },
      },
    },
  };
});
