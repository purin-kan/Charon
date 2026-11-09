// Copies the files the game needs to build and run into a submission folder:
//   node tools/make-submission.mjs [output folder]
// Default output: <repo>/temp/submission/The_Ferryman_v1.1.1_Source (ignored by git).
// Only files tracked by git are copied, so local clutter never reaches the submission. Tests, test
// receipts, the status log and the raw source art are left out; tools/submission/README.md becomes
// the folder's README.md, and package.json loses the scripts that need the left-out tools.
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(process.argv[2] ?? join(ROOT, '../../temp/submission/The_Ferryman_v1.1.1_Source'));

const TOP_FILES = new Set([
  'index.html',
  'package.json',
  'package-lock.json',
  'forge.config.mjs',
  'vite.main.config.mjs',
  'vite.preload.config.mjs',
  'vite.renderer.config.mjs',
  'CREDITS.md',
]);
const DIRS = ['src/', 'assets/', 'rules/'];
const EXCLUDED = ['assets/source-art/', 'rules/tests/', 'rules/verification/'];
const SCRIPTS_DROPPED = ['check', 'fixtures'];

function wanted(path) {
  if (path.endsWith('/.gitkeep')) return false;
  if (EXCLUDED.some((dir) => path.startsWith(dir))) return false;
  return TOP_FILES.has(path) || DIRS.some((dir) => path.startsWith(dir));
}

if (existsSync(OUT)) {
  console.error(`${OUT} already exists. Delete it first, or pass another folder.`);
  process.exit(1);
}

const git = (...args) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' });
const files = git('ls-files', '-z', '--', '.').split('\0').filter(Boolean).filter(wanted);

const changed = git('status', '--porcelain', '--', ...DIRS, ...TOP_FILES)
  .split('\n')
  .filter(Boolean);
if (changed.length) {
  console.warn(`Warning: ${changed.length} copied path(s) differ from the last commit:\n${changed.join('\n')}`);
}

for (const path of files) {
  const target = join(OUT, path);
  mkdirSync(dirname(target), { recursive: true });
  if (path === 'package.json') {
    const pkg = JSON.parse(readFileSync(join(ROOT, path), 'utf8'));
    for (const name of SCRIPTS_DROPPED) delete pkg.scripts[name];
    writeFileSync(target, JSON.stringify(pkg, null, 2) + '\n');
  } else {
    copyFileSync(join(ROOT, path), target);
  }
}
copyFileSync(join(ROOT, 'tools/submission/README.md'), join(OUT, 'README.md'));

console.log(`Copied ${files.length + 1} files to ${OUT}`);
