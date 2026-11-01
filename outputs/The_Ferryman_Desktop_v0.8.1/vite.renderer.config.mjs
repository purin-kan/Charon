import { defineConfig } from 'vite';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// The rules source (rules/content.js + rules/engine.js) lives inside this folder,
// so the dev server needs no access outside the project root.

const TUNING_FILE = fileURLToPath(new URL('./assets/tuning.json', import.meta.url));

// Dev server only (T-13): the tuning panel POSTs its values here and they are written to
// assets/tuning.json. A packaged build has no dev server, so it cannot change the file.
function tuningSave() {
  return {
    name: 'ferry-tuning-save',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__ferry/tuning', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end('POST only');
          return;
        }
        let body = '';
        req.on('data', (chunk) => {
          body += chunk;
          if (body.length > 1_000_000) req.destroy();
        });
        req.on('end', () => {
          try {
            const data = JSON.parse(body);
            if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('expected a JSON object');
            writeFileSync(TUNING_FILE, JSON.stringify(data, null, 2) + '\n');
            res.end('saved');
          } catch (err) {
            res.statusCode = 400;
            res.end(err.message);
          }
        });
      });
    },
  };
}

// https://vitejs.dev/config
export default defineConfig({
  plugins: [tuningSave()],
  build: { chunkSizeWarningLimit: 2500 },
});
