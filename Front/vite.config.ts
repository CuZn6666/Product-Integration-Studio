import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig(({ mode }) => {
  const apiTarget = loadEnv(mode, '.', '').STUDIO_API_TARGET || 'http://127.0.0.1:8080';
  return {
  plugins: [react()],
  build: { rollupOptions: { output: { manualChunks(id) {
    if (id.includes('node_modules/primereact') || id.includes('node_modules/@prime')) return 'primereact';
    if (id.includes('node_modules/@xyflow') || id.includes('node_modules/d3-')) return 'flow';
    if (id.includes('node_modules')) return 'vendor';
  } } } },
  server: { port: 5173, strictPort: true, proxy: { '/api': apiTarget } },
  preview: { proxy: { '/api': apiTarget } },
  };
});
