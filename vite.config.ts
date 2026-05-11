import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import path from 'node:path';
import fs from 'node:fs';

function copyStaticDataPlugin(): Plugin {
  return {
    name: 'copy-static-data',
    apply: 'build',
    closeBundle() {
      const dataDir = path.resolve(process.cwd(), 'data');
      const outDir = path.resolve(process.cwd(), 'dist');
      const targetDir = path.join(outDir, 'data');

      if (!fs.existsSync(dataDir)) {
        console.warn('[copy-static-data] data directory not found, skipped.');
        return;
      }

      fs.rmSync(targetDir, { recursive: true, force: true });
      fs.cpSync(dataDir, targetDir, {
        recursive: true,
        filter(source) {
          const stat = fs.statSync(source);
          return stat.isDirectory() || path.extname(source).toLowerCase() === '.json';
        },
      });
      fs.writeFileSync(path.join(outDir, '.nojekyll'), '');
      console.log('[copy-static-data] JSON data copied to dist/data.');
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    base: './',
    plugins: [react(), tailwindcss(), copyStaticDataPlugin()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(process.cwd(), '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom', 'react-router-dom'],
            charts: ['echarts', 'echarts-for-react'],
            ui: ['lucide-react', 'motion'],
          },
        },
      },
      chunkSizeWarningLimit: 1800,
    },
  };
});
