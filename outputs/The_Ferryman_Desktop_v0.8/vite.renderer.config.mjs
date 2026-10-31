import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

// The rules source (content.js + engine.js) lives in the sibling folder outputs/The_Ferryman_v0.7/,
// so the dev server must be allowed to read from the parent (outputs/).
const outputs = fileURLToPath(new URL('..', import.meta.url));

// https://vitejs.dev/config
export default defineConfig({
  server: { fs: { allow: [outputs] } },
  build: { chunkSizeWarningLimit: 2500 },
});
