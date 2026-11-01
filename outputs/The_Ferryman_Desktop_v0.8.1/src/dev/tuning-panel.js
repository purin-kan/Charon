// Developer tuning panel (T-13). Dev server only (`npm start`): press F2 or click "Tuning".
// Adjusts the values registered in src/tuning.js while the game runs and saves them to
// assets/tuning.json through a small endpoint in vite.renderer.config.mjs. A packaged .exe cannot
// write into its own files, so tuning needs the repo and Node set up.
import { EASES, tuningSpecs, tune, setTune, resetTune, savedTune, tuningData, markSaved, onTune } from '../tuning.js';

const SAVE_URL = '/__ferry/tuning';
const GAME_W = 1280;
const GAME_H = 720;

const CSS = `
#tuning-toggle { position: fixed; right: 4px; bottom: 4px; z-index: 20; font: 12px system-ui, sans-serif; }
#tuning { position: fixed; right: 4px; top: 30px; z-index: 20; width: 320px; max-height: calc(100vh - 70px); overflow: auto;
  background: #0d1a22ee; color: #d8e3ea; border: 1px solid #3d5566; border-radius: 6px; font: 12px system-ui, sans-serif; padding: 8px; }
#tuning[hidden] { display: none; }
#tuning .bar { display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 6px; }
#tuning .status { color: #9fb6c6; min-height: 16px; margin-bottom: 4px; }
#tuning .status.bad { color: #ff9f8a; }
#tuning details { border-top: 1px solid #24323f; padding: 4px 0; }
#tuning summary { cursor: pointer; font-weight: 600; text-transform: capitalize; }
#tuning .row { display: grid; grid-template-columns: 1fr auto; gap: 2px 6px; align-items: center; margin: 6px 0; }
#tuning .row label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
#tuning .row label.changed::after { content: ' *'; color: #edc47f; }
#tuning .row .help { grid-column: 1 / -1; color: #6f8796; font-size: 11px; }
#tuning .row .ctl { grid-column: 1 / -1; display: flex; gap: 4px; align-items: center; }
#tuning input[type=range] { flex: 1; }
#tuning input[type=number] { width: 72px; }
#tuning .pts { grid-column: 1 / -1; font-family: monospace; font-size: 11px; color: #9fb6c6; }
#tuning button { font-size: 12px; }
#tuning-path { position: fixed; z-index: 15; pointer-events: none; }
#tuning-path.editing { pointer-events: auto; cursor: crosshair; }
`;

export function mountTuningPanel(game) {
  if (!import.meta.env.DEV || document.getElementById('tuning')) return;
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.append(style);

  const toggle = button('Tuning (F2)', () => setOpen(panel.hidden));
  toggle.id = 'tuning-toggle';
  const panel = document.createElement('div');
  panel.id = 'tuning';
  panel.hidden = true;
  document.body.append(toggle, panel);
  const path = new PathEditor(game);

  const status = document.createElement('div');
  status.className = 'status';
  const say = (text, bad = false) => { status.textContent = text; status.classList.toggle('bad', bad); };
  const bar = document.createElement('div');
  bar.className = 'bar';
  bar.append(
    button('Save to tuning.json', () => save(say, rows)),
    button('Copy JSON', async () => {
      await navigator.clipboard.writeText(JSON.stringify(tuningData(), null, 2));
      say('Copied all values.');
    }),
    button('Reset all', () => { for (const s of tuningSpecs()) resetTune(s.key); say('All values back to their defaults (not saved yet).'); }),
  );
  panel.append(bar, status);

  const rows = new Map(); // key -> { refresh() }
  const groups = new Map();
  for (const spec of tuningSpecs()) {
    if (!groups.has(spec.group)) {
      const d = document.createElement('details');
      d.open = true;
      d.innerHTML = `<summary>${spec.group}</summary>`;
      groups.set(spec.group, d);
      panel.append(d);
    }
    const row = makeRow(spec, path, say);
    groups.get(spec.group).append(row.el);
    rows.set(spec.key, row);
  }
  onTune((key) => rows.get(key)?.refresh());

  const setOpen = (open) => {
    panel.hidden = !open;
    if (!open) path.stop();
  };
  window.addEventListener('keydown', (e) => {
    if (e.key === 'F2') { e.preventDefault(); setOpen(panel.hidden); }
  });
  say('Changes apply at once. Save writes assets/tuning.json; commit it when done (one tuner at a time).');
}

async function save(say, rows) {
  const data = tuningData();
  try {
    const res = await fetch(SAVE_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (!res.ok) throw new Error(await res.text());
    markSaved(data);
    for (const r of rows.values()) r.refresh();
    say(`Saved ${Object.keys(data).length} values to assets/tuning.json.`);
  } catch (err) {
    say(`Save failed: ${err.message}. Saving works only in npm start.`, true);
  }
}

function button(text, onClick) {
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = text;
  b.addEventListener('click', onClick);
  return b;
}

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function makeRow(spec, path, say) {
  const el = document.createElement('div');
  el.className = 'row';
  const label = document.createElement('label');
  label.textContent = spec.label;
  label.title = spec.key;
  const reset = button('Reset', () => resetTune(spec.key));
  el.append(label, reset);
  if (spec.help) {
    const help = document.createElement('div');
    help.className = 'help';
    help.textContent = spec.help;
    el.append(help);
  }
  const ctl = document.createElement('div');
  ctl.className = 'ctl';
  el.append(ctl);
  let refreshControl = () => {};

  if (spec.type === 'number') {
    const range = Object.assign(document.createElement('input'), { type: 'range', min: spec.min ?? 0, max: spec.max ?? 1000, step: spec.step ?? 1 });
    const num = Object.assign(document.createElement('input'), { type: 'number', step: spec.step ?? 1 });
    const apply = (v) => { if (v !== '' && Number.isFinite(+v)) setTune(spec.key, +v); };
    range.addEventListener('input', () => apply(range.value));
    num.addEventListener('change', () => apply(num.value));
    ctl.append(range, num);
    refreshControl = () => { range.value = tune(spec.key); num.value = tune(spec.key); };
  } else if (spec.type === 'ease') {
    const sel = document.createElement('select');
    for (const name of new Set([...EASES, spec.default])) sel.append(new Option(name, name));
    sel.addEventListener('change', () => setTune(spec.key, sel.value));
    ctl.append(sel);
    refreshControl = () => { sel.value = tune(spec.key); };
  } else if (spec.type === 'bool') {
    const box = Object.assign(document.createElement('input'), { type: 'checkbox' });
    box.addEventListener('change', () => setTune(spec.key, box.checked));
    ctl.append(box);
    refreshControl = () => { box.checked = tune(spec.key); };
  } else if (spec.type === 'points') {
    const edit = button('Edit on screen', () => {
      const on = path.toggle(spec.key);
      edit.textContent = on ? 'Done editing' : 'Edit on screen';
      if (on) say('Drag the gold points. Click empty space to add a point at the end; right-click a point to remove it.');
    });
    const add = button('+ point', () => {
      const pts = tune(spec.key);
      const [a, b] = pts.slice(-2);
      pts.push([Math.min(GAME_W, b[0] + (b[0] - a[0])), b[1]]);
      setTune(spec.key, pts);
    });
    const remove = button('- point', () => { const pts = tune(spec.key); if (pts.length > 2) setTune(spec.key, pts.slice(0, -1)); });
    ctl.append(edit, add, remove);
    const list = document.createElement('div');
    list.className = 'pts';
    el.append(list);
    path.onStop(spec.key, () => { edit.textContent = 'Edit on screen'; });
    refreshControl = () => { list.textContent = tune(spec.key).map(([x, y]) => `(${Math.round(x)}, ${Math.round(y)})`).join(' '); path.redraw(); };
  }

  const refresh = () => {
    refreshControl();
    label.classList.toggle('changed', !same(tune(spec.key), savedTune(spec.key)));
  };
  refresh();
  return { el, refresh };
}

/** Draws a points value over the game canvas and lets the tuner drag, add and remove points. */
class PathEditor {
  constructor(game) {
    this.game = game;
    this.key = null;
    this.stopHandlers = new Map();
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'tuning-path';
    document.body.append(this.canvas);
    this.drag = -1;
    this.canvas.addEventListener('pointerdown', (e) => this.down(e));
    this.canvas.addEventListener('pointermove', (e) => this.move(e));
    window.addEventListener('pointerup', () => { this.drag = -1; });
    this.canvas.addEventListener('contextmenu', (e) => { e.preventDefault(); this.removeAt(e); });
    window.addEventListener('resize', () => this.redraw());
  }

  onStop(key, fn) { this.stopHandlers.set(key, fn); }

  toggle(key) {
    if (this.key === key) { this.stop(); return false; }
    this.stop();
    this.key = key;
    this.canvas.classList.add('editing');
    this.redraw();
    return true;
  }

  stop() {
    const was = this.key;
    this.key = null;
    this.canvas.classList.remove('editing');
    this.redraw();
    if (was) this.stopHandlers.get(was)?.();
  }

  /** Lines the overlay up with the game canvas and returns game-to-page scale. */
  fit() {
    const r = this.game.canvas.getBoundingClientRect();
    Object.assign(this.canvas.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' });
    this.canvas.width = r.width;
    this.canvas.height = r.height;
    return { sx: r.width / GAME_W, sy: r.height / GAME_H, r };
  }

  toGame(e) {
    const { r } = this.fit();
    return [Math.round(((e.clientX - r.left) * GAME_W) / r.width), Math.round(((e.clientY - r.top) * GAME_H) / r.height)];
  }

  nearest(e) {
    const [x, y] = this.toGame(e);
    const pts = tune(this.key);
    let best = -1;
    let bestD = 18 * 18;
    pts.forEach(([px, py], i) => { const d = (px - x) ** 2 + (py - y) ** 2; if (d < bestD) { best = i; bestD = d; } });
    return best;
  }

  down(e) {
    if (!this.key || e.button !== 0) return;
    this.drag = this.nearest(e);
    if (this.drag < 0) setTune(this.key, [...tune(this.key), this.toGame(e)]);
  }

  move(e) {
    if (!this.key || this.drag < 0) return;
    const pts = tune(this.key);
    pts[this.drag] = this.toGame(e).map((v, i) => Math.max(0, Math.min(i ? GAME_H : GAME_W, v)));
    setTune(this.key, pts);
  }

  removeAt(e) {
    if (!this.key) return;
    const i = this.nearest(e);
    const pts = tune(this.key);
    if (i >= 0 && pts.length > 2) { pts.splice(i, 1); setTune(this.key, pts); }
  }

  redraw() {
    const { sx, sy } = this.fit();
    const ctx = this.canvas.getContext('2d');
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    if (!this.key) return;
    const pts = tune(this.key).map(([x, y]) => [x * sx, y * sy]);
    ctx.strokeStyle = '#edc47f';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.stroke();
    ctx.setLineDash([]);
    pts.forEach(([x, y], i) => {
      ctx.fillStyle = i === 0 ? '#7fd8a0' : i === pts.length - 1 ? '#ff9f8a' : '#edc47f';
      ctx.beginPath();
      ctx.arc(x, y, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0b1117';
      ctx.font = '10px sans-serif';
      ctx.fillText(String(i + 1), x - 3, y + 3);
    });
  }
}
