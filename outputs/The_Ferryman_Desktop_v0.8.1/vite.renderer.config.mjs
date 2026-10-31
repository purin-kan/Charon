import { defineConfig } from 'vite';

// The rules source (rules/content.js + rules/engine.js) lives inside this folder,
// so the dev server needs no access outside the project root.

// https://vitejs.dev/config
export default defineConfig({
  build: { chunkSizeWarningLimit: 2500 },
});
