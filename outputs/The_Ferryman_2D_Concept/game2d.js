/* The Ferryman: 2D concept of the final game.
   A side-view river scene staged over the unchanged v0.6 rules engine (engine.js, content.js).
   The engine decides everything; this file only shows it: souls walk aboard, the boat sails,
   fog and wraiths take Light, delivered souls walk ashore and rise. */
(() => {
  'use strict';
  const game = globalThis.Ferry, data = game.data, C = data.config;
  const ROOT = '../The_Ferryman_v0.6/';
  const ART = {};
  for (const [k, v] of Object.entries(globalThis.FerryArt)) ART[k] = ROOT + v;
  ART['SOUL-POLONG'] = ROOT + 'assets/art/newpolong.jpg';
  const SOUL = Object.fromEntries(data.souls.map(s => [s.id, s]));
  const DEST = Object.fromEntries(data.destinations.map(d => [d.id, d]));
  const MEM = Object.fromEntries(data.memories.map(m => [m.id, m]));
  const DEST_IDS = data.destinations.map(d => d.id);
  const COLOR = { 'DEST-HAVEN': '#e0ad45', 'DEST-STYX': '#a688cc', 'DEST-ACHERON': '#5fb0bd', 'DEST-ASPHODEL': '#86a8d0', 'DEST-ELYSIUM': '#7cc08d', 'DEST-TARTARUS': '#e0674f' };
  const QUEST = { available: 'Family: Child before Mother', 'child-delivered': 'Family: Child in Haven, now Mother', completed: 'Family quest complete', failed: 'Family quest lost' };
  const SAVE_KEY = 'the-ferryman:2d-concept:save';

  // World geometry, in stage pixels (1600 x 900). Feet positions are where a soul stands.
  const W = 1600, SPEED = 210;
  const LAND_Y = 640, SHORE_X = [70, 150, 230, 310, 390], PIER = { x0: 446, x1: 852, y: 655 };
  const DOCK = { x: 860, y: 500 }, SEAT_X = [150, 235, 320, 405], SEAT_Y = 200;
  const GHOST_SPOTS = [[70, 184], [38, 172], [104, 166], [52, 156], [88, 150], [24, 190]];

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const T = ms => reduce ? Math.min(ms, 30) : ms;
  const wait = ms => new Promise(r => setTimeout(r, T(ms)));
  const $ = s => document.querySelector(s);
  function el(tag, cls, text) { const n = document.createElement(tag); if (cls) n.className = cls; if (text !== undefined && text !== null) n.textContent = text; return n; }
  function btn(text, fn, cls = 'secondary', disabled = false) { const b = el('button', cls, text); b.type = 'button'; b.disabled = disabled; b.addEventListener('click', fn); return b; }
  const typeOf = id => id.startsWith('POLONG-') ? 'SOUL-POLONG' : id;
  const isGhost = id => typeOf(id) === 'SOUL-POLONG';

  const stage = $('#stage'), walkers = $('#walkers'), boatSouls = $('#boat-souls .bob'), fx = $('#fx'), routeLayer = $('#route');
  const hudLight = $('#light'), hudInfo = $('#info'), hudHand = $('#hand'), panel = $('#panel'), tip = $('#tip'), toast = $('#toast'), popup = $('#popup'), title = $('#title');

  let state = null, busy = false, busyTitle = '', shownLight = C.startLight, shownHand = null, routePick = null, scene = 'shore', sceneDest = null, lx = 0, bx = 0;
  let seatOf = {}, slotOf = {};
  const chosen = new Set(), walking = new Set(), sprites = new Map();

  /* ---------- Art: the scene, the boat and the souls (inline SVG) ---------- */
  document.body.insertAdjacentHTML('afterbegin', '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>'
    + '<radialGradient id="soul-aura"><stop offset="0" stop-color="#bfe6ff" stop-opacity=".22"/><stop offset="1" stop-color="#bfe6ff" stop-opacity="0"/></radialGradient>'
    + '<radialGradient id="ghost-aura"><stop offset="0" stop-color="#8dffbf" stop-opacity=".28"/><stop offset="1" stop-color="#8dffbf" stop-opacity="0"/></radialGradient>'
    + '<radialGradient id="lamp-glow"><stop offset="0" stop-color="#fff0c4" stop-opacity=".95"/><stop offset=".3" stop-color="#edc47f" stop-opacity=".45"/><stop offset="1" stop-color="#edc47f" stop-opacity="0"/></radialGradient>'
    + '<linearGradient id="hull" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5d4029"/><stop offset=".45" stop-color="#3a2718"/><stop offset="1" stop-color="#130b05"/></linearGradient>'
    + '<linearGradient id="landg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1f2c23"/><stop offset=".25" stop-color="#121a15"/><stop offset="1" stop-color="#040706"/></linearGradient>'
    + '<linearGradient id="waterg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#14323a" stop-opacity=".25"/><stop offset=".12" stop-color="#0f2a31" stop-opacity=".8"/><stop offset="1" stop-color="#02090c"/></linearGradient>'
    + '<linearGradient id="waterf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0c252c" stop-opacity="0"/><stop offset=".25" stop-color="#0b222a" stop-opacity=".55"/><stop offset="1" stop-color="#02090c" stop-opacity=".92"/></linearGradient>'
    + '<filter id="wave" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency="0.006 0.09" numOctaves="2" seed="3"><animate attributeName="baseFrequency" dur="9s" values="0.006 0.09;0.008 0.13;0.006 0.09" repeatCount="indefinite"/></feTurbulence><feDisplacementMap in="SourceGraphic" scale="16"/></filter>'
    + '</defs></svg>');

  function ripples(y0, rows, color, opacity) {
    let d = '';
    for (let r = 0; r < rows; r++) { const y = y0 + r * 34 + r * r * 4; d += `M${(r % 2) * 40} ${y}`; for (let x = 0; x < 3400; x += 80) d += ` q20 -${3 + r} 40 0 t40 0`; }
    return `<g class="ripples"><path d="${d}" stroke="${color}" stroke-opacity="${opacity}" stroke-width="2" fill="none"/></g>`;
  }
  $('#water').innerHTML = `<svg width="1600" height="900" viewBox="0 0 1600 900"><rect x="0" y="652" width="1600" height="248" fill="url(#waterg)"/>${ripples(676, 6, '#9fc7d0', .16)}</svg>`;
  $('#water-front').innerHTML = `<svg width="1600" height="900" viewBox="0 0 1600 900"><rect x="0" y="704" width="1600" height="196" fill="url(#waterf)"/>${ripples(716, 5, '#b8dbe2', .2)}</svg>`;

  let tufts = ''; for (let x = 10; x < 440; x += 23) tufts += `M${x} ${640 - Math.sin(x) * 6} l4 -${12 + (x % 9)} l3 ${10 + (x % 5)} l5 -${9 + (x % 7)} l2 ${11}`;
  let planks = ''; for (let x = PIER.x0 + 22; x < PIER.x1 + 16; x += 22) planks += `M${x} 652 v13`;
  $('#land').insertAdjacentHTML('afterbegin', `<svg width="1600" height="900" viewBox="0 0 1600 900">
    <path d="M0 634 Q90 622 200 630 Q320 638 404 641 Q456 648 480 704 L490 900 L0 900Z" fill="url(#landg)"/>
    <path class="tint" d="M0 634 Q90 622 200 630 Q320 638 404 641 Q456 648 480 704" stroke="var(--tint)" stroke-opacity=".55" stroke-width="3" fill="none" style="filter:blur(2px)"/>
    <path d="${tufts}" stroke="#2f4232" stroke-width="2" fill="none"/>
    ${[476, 580, 684, 788, 868].map(x => `<rect x="${x - 6}" y="652" width="12" height="${x > 800 ? 108 : 96}" fill="#2a1c12"/>`).join('')}
    <rect x="${PIER.x0}" y="650" width="${PIER.x1 - PIER.x0 + 26}" height="15" rx="2" fill="#4c3524"/>
    <path d="${planks}" stroke="#2a1c12" stroke-width="2"/>
    <rect x="${PIER.x0}" y="650" width="${PIER.x1 - PIER.x0 + 26}" height="3" fill="#7d5a3a"/>
    <rect x="852" y="588" width="13" height="68" fill="#3a2718"/><path d="M858 588 q14 -10 22 2" stroke="#3a2718" stroke-width="5" fill="none"/>
    <circle class="lantern-glow" cx="880" cy="604" r="54" fill="url(#lamp-glow)"/><rect x="874" y="594" width="12" height="17" rx="2" fill="#ffd27a" stroke="#3a2718" stroke-width="2"/>
  </svg>`);

  // Charon at the bow with his pole, a lantern at the stern; souls sit between the two hull layers.
  $('#boat-back').innerHTML = `<svg width="560" height="240" viewBox="0 0 560 240">
    <ellipse class="ward guard" cx="280" cy="140" rx="300" ry="120" fill="none" stroke="#ffe6a0" stroke-width="4" stroke-dasharray="14 10" opacity="0"/>
    <ellipse class="ward shield" cx="280" cy="150" rx="320" ry="100" fill="#bfe6ff" fill-opacity=".08" stroke="#bfe6ff" stroke-width="3" opacity="0"/>
    <ellipse cx="52" cy="246" rx="22" ry="54" fill="url(#lamp-glow)" opacity=".4"/>
    <path d="M14 150 Q280 124 548 140" stroke="#4a3322" stroke-width="7" fill="none"/>
    <path d="M18 152 Q280 128 546 142 L540 162 Q280 184 24 164Z" fill="#160e08"/>
    <g class="charon">
      <line x1="522" y1="2" x2="438" y2="238" stroke="#4a3322" stroke-width="5" stroke-linecap="round"/>
      <path d="M488 26 Q472 34 470 56 Q460 68 458 90 L450 196 L526 196 L518 90 Q516 68 506 56 Q504 34 488 26Z" fill="#0a0c0f"/>
      <path d="M458 120 L450 196 L460 186 L468 198 L476 186 L486 198 L494 186 L502 198 L510 186 L526 196 L518 120Z" fill="#0d1014"/>
      <path d="M488 36 Q477 41 477 56 Q478 67 488 70 Q498 67 499 56 Q498 41 488 36Z" fill="#000"/>
      <circle cx="484" cy="54" r="1.9" fill="#ff9d4d"/><circle cx="493" cy="54" r="1.9" fill="#ff9d4d"/>
      <circle cx="495" cy="83" r="3.6" fill="#8f8775"/><circle cx="483" cy="119" r="3.6" fill="#8f8775"/>
    </g>
    <path d="M34 160 Q20 112 36 72 Q42 60 54 64" stroke="#3a2718" stroke-width="6" fill="none"/><path d="M54 64 v10" stroke="#222" stroke-width="2"/>
    <circle class="lantern-glow" cx="54" cy="86" r="64" fill="url(#lamp-glow)"/>
    <rect x="47" y="74" width="14" height="21" rx="3" fill="#ffd27a" stroke="#2a1c12" stroke-width="2"/>
  </svg>`;
  $('#boat-front').innerHTML = `<svg width="560" height="240" viewBox="0 0 560 240">
    <path d="M10 150 Q280 178 552 144 L540 176 Q470 226 280 228 Q100 226 36 186Z" fill="url(#hull)"/>
    <path d="M16 162 Q280 192 546 158 M24 178 Q280 208 536 174 M34 194 Q280 222 516 192" stroke="#1c120a" stroke-width="2" fill="none" opacity=".85"/>
    <path d="M10 150 Q280 178 552 144" stroke="#8a6440" stroke-width="5" fill="none"/>
    <path d="M546 146 Q574 112 562 62 Q558 52 550 58 Q562 104 534 150Z" fill="#3a2718" stroke="#8a6440" stroke-width="2"/>
    <path d="M16 152 Q-4 128 6 98 Q9 90 16 94 Q8 124 30 152Z" fill="#3a2718" stroke="#8a6440" stroke-width="2"/>
  </svg>`;
  $('#boat-reflect').innerHTML = $('#boat-back').innerHTML + $('#boat-front').innerHTML;

  // Each soul is a small cut-out figure. Rules come from content.json; looks are this concept's placeholders.
  const LOOK = {
    'SOUL-MOTHER': { skin: '#e9d6c2', hair: '#3b2a20', hairStyle: 'long', robe: '#d9ccb0', trim: '#a99b7c', arm: '#2f5f5c', legs: '#4a3d33', over: 'shawl' },
    'SOUL-CHILD': { scale: .7, skin: '#efdcc8', hair: '#5a3b24', hairStyle: 'curly', robe: '#b8a27a', trim: '#8a7552', arm: '#b8a27a', legs: '#5a4a3a', prop: 'flower' },
    'SOUL-MERCHANT': { skin: '#dcc2a4', hair: '#2b211a', hairStyle: 'short', robe: '#6d2a2c', trim: '#c9a24e', arm: '#5a2224', legs: '#2e2420', hat: 'brim', body: 'satchel' },
    'SOUL-SOLDIER': { scale: 1.12, skin: '#d8b896', hair: '#2b211a', hairStyle: 'none', robe: '#7c2a22', trim: '#b08540', arm: '#7c2a22', legs: '#4a3a2c', hat: 'helmet', over: 'cuirass', back: 'spear', prop: 'shield' },
    'SOUL-POET': { skin: '#e6cfb6', hair: '#4a3628', hairStyle: 'curly', robe: '#4c3a6a', trim: '#bfa8e0', arm: '#4c3a6a', legs: '#2e2638', hat: 'laurel', prop: 'scroll' },
    'SOUL-COOK': { skin: '#e0c3a2', hair: '#3a2a1c', hairStyle: 'short', robe: '#6a4a2e', trim: '#d8cdb4', arm: '#6a4a2e', legs: '#3a2c20', hat: 'cap', over: 'apron', prop: 'ladle' },
    'SOUL-MASON': { skin: '#d2b08e', hair: '#2a2420', hairStyle: 'short', robe: '#5b5f61', trim: '#7a5a3a', arm: '#5b5f61', legs: '#33302c', hat: 'band', over: 'leather', prop: 'hammer' },
    'SOUL-KEEPER': { skin: '#cdb9a6', hair: '#1e2830', hairStyle: 'none', robe: '#2c3a45', trim: '#7c8c96', arm: '#2c3a45', legs: '#1e262c', hat: 'hood', body: 'keys', prop: 'lantern' }
  };
  const HAIR = {
    none: () => ['', ''],
    long: c => [`<path d="M38 40 Q37 27 50 28 Q63 28 62 38 L58 44 Q55 35 47 36 Q43 39 43 52 L42 68 Q34 60 38 40Z" fill="${c}"/>`, `<path d="M39 41 Q39 29 51 29 Q61 30 61 37 Q54 33 47 35 Q42 37 41 45Z" fill="${c}"/>`],
    short: c => ['', `<path d="M39 42 Q38 29 50 29 Q61 29 61 37 Q55 33 48 34 Q43 36 42 44Z" fill="${c}"/>`],
    curly: c => ['', `<path d="M39 42 Q38 29 50 29 Q61 29 61 37 Q55 33 48 34 Q43 36 42 44Z" fill="${c}"/><circle cx="41" cy="36" r="4.2" fill="${c}"/><circle cx="46" cy="31" r="4.2" fill="${c}"/><circle cx="53" cy="30" r="4" fill="${c}"/><circle cx="59" cy="33" r="3.4" fill="${c}"/><circle cx="40" cy="43" r="3.4" fill="${c}"/>`]
  };
  const HAT = {
    brim: () => '<path d="M40 34 Q40 20 50 20 Q60 20 60 34Z" fill="#3a2a1e"/><path d="M32 33.5 L68 33.5 Q67 37 60 36 L40 36 Q33 37 32 33.5Z" fill="#2a1e15"/><path d="M40 31 L60 31" stroke="#c9a24e" stroke-width="2"/>',
    helmet: () => '<path d="M38 46 Q37 27 50 26 Q63 27 62 41 L58 41 Q57 34 50 34 Q44 35 43 44 L43 53 L38 51Z" fill="#a8793a" stroke="#6b4a22"/><path d="M41 28 Q46 10 62 19 Q58 23 60 30 Q52 21 41 28Z" fill="#a8302a"/>',
    laurel: () => '<path d="M39 37 Q50 26 61 36" stroke="#7a9a52" stroke-width="3.6" stroke-dasharray="3 2" fill="none"/>',
    cap: () => '<path d="M40 35 Q34 24 42 22 Q45 13 53 18 Q62 15 61 25 Q65 31 60 35Z" fill="#ece6d7"/><path d="M40 35 L60 35" stroke="#c9bfa9" stroke-width="2"/>',
    band: () => '<path d="M39 37 Q50 32.5 61 37" stroke="#8b2f2a" stroke-width="3" fill="none"/>',
    hood: L => `<path d="M35 64 Q31 25 50 23 Q69 25 65 50 L61 52 Q61 32 50 32 Q41 33 41 48 L42 64Z" fill="${L.robe}"/><path d="M41 48 Q42 33 50 32 Q60 32 61 50" fill="none" stroke="#000" stroke-opacity=".35" stroke-width="3"/>`
  };
  const OVER = {
    shawl: '<path d="M35 59 Q50 72 66 59 L69 86 Q52 99 31 86Z" fill="#2f5f5c"/><path d="M31 86 Q52 99 69 86" stroke="#a7c4b9" stroke-width="1.5" fill="none" opacity=".6"/>',
    cuirass: '<path d="M38 61 Q50 57 62 61 L61 93 Q50 97 39 93Z" fill="#a8793a" stroke="#6b4a22"/><path d="M44 70 Q50 73 56 70 M44 81 Q50 84 56 81" stroke="#6b4a22" fill="none"/>',
    apron: '<path d="M41 79 L59 79 L63 127 Q50 130 37 127Z" fill="#e7e1d2"/><path d="M40 82 L60 82" stroke="#cfc6b2" stroke-width="2"/>',
    leather: '<path d="M41 80 L59 80 L62 124 Q50 127 38 124Z" fill="#6b4a30"/>'
  };
  const BODY = {
    satchel: '<path d="M40 60 L62 92" stroke="#4a3220" stroke-width="2.2"/><rect x="57" y="88" width="13" height="12" rx="2" fill="#6b4a2a"/>',
    keys: '<circle cx="59" cy="95" r="3.2" fill="none" stroke="#c9a24e" stroke-width="1.6"/><path d="M59 98 v6 h3" stroke="#c9a24e" stroke-width="1.6" fill="none"/>'
  };
  const BACK = { spear: '<path d="M63 12 L60 152" stroke="#5a3e24" stroke-width="2.6"/><path d="M63 1 L67 14 L59 14Z" fill="#d6cfbc"/>' };
  const PROP = {
    flower: '<path d="M39 99 L44 85" stroke="#4f6b3a" stroke-width="1.6"/><circle cx="44.5" cy="84" r="3.4" fill="#e9b7c4"/>',
    shield: '<circle cx="39" cy="94" r="15" fill="#8a6a3a" stroke="#c9a24e" stroke-width="2.4"/><circle cx="39" cy="94" r="4" fill="#c9a24e"/>',
    scroll: '<rect x="32" y="96" width="14" height="8" rx="3.5" fill="#e8dcbc" stroke="#a8977a"/>',
    ladle: '<path d="M39 100 L35 117" stroke="#8a8a86" stroke-width="2.2"/><circle cx="34.5" cy="119" r="3.6" fill="#8a8a86"/>',
    hammer: '<path d="M39 100 L37 121" stroke="#6b4a2a" stroke-width="3"/><rect x="31" y="117" width="13" height="6" rx="1" fill="#7d8285"/>',
    lantern: '<circle cx="39" cy="114" r="20" fill="url(#lamp-glow)"/><path d="M39 100 v6" stroke="#2a2a2a" stroke-width="1.5"/><rect x="34" y="106" width="10" height="13" rx="2" fill="#ffd27a" stroke="#3a3a3a" stroke-width="1.5"/>'
  };
  // PoLong: a drowned man, floating, with a torn tunic and a broken chain on one wrist.
  const GHOST_SVG = '<svg viewBox="0 0 100 170" aria-hidden="true"><ellipse cx="50" cy="96" rx="42" ry="76" fill="url(#ghost-aura)"/><g>'
    + '<path d="M27 66 Q23 104 23 132 Q31 150 39 136 Q45 158 53 140 Q61 156 67 134 Q75 150 78 128 Q77 100 73 66 Q50 57 27 66Z" fill="#94ab9f" opacity=".82"/>'
    + '<path d="M33 92 Q31 116 30 134 M50 100 Q50 126 49 146 M66 92 Q68 116 70 132" stroke="#e2ece6" stroke-opacity=".4" stroke-width="1.5" fill="none"/>'
    + '<path d="M29 64 Q50 55 71 64 L73 90 Q62 86 58 96 Q50 88 42 97 Q38 86 27 90Z" fill="#5f7a6f"/>'
    + '<path d="M44 62 L50 74 L56 62" stroke="#3f554c" stroke-width="2" fill="none"/>'
    + '<path d="M31 67 Q25 88 28 106" stroke="#5f7a6f" stroke-width="8" stroke-linecap="round" fill="none"/><circle cx="28" cy="108" r="4.2" fill="#cfdcd4"/>'
    + '<path d="M69 67 Q75 88 72 106" stroke="#5f7a6f" stroke-width="8" stroke-linecap="round" fill="none"/><circle cx="72" cy="108" r="4.2" fill="#cfdcd4"/>'
    + '<path d="M68 101 h8" stroke="#55615b" stroke-width="3"/><ellipse cx="74" cy="116" rx="2.6" ry="3.6" fill="none" stroke="#7d8a84" stroke-width="1.6"/><ellipse cx="73" cy="123" rx="2.6" ry="3.6" fill="none" stroke="#7d8a84" stroke-width="1.6"/><ellipse cx="74.5" cy="130" rx="2.6" ry="3.6" fill="none" stroke="#7d8a84" stroke-width="1.6"/>'
    + '<rect x="46" y="51" width="8" height="9" fill="#b9c9c0"/>'
    + '<path d="M40.5 40 Q40 56 50 59 Q60 56 59.5 40 Q59 30 50 30 Q41 30 40.5 40Z" fill="#cfdcd4"/>'
    + '<path d="M42 49 Q43 58 50 59.5 Q57 58 58 49 Q55 54 50 54.5 Q45 54 42 49Z" fill="#2b3530" opacity=".75"/>'
    + '<path d="M39.5 43 Q38 28 50 27.5 Q62 28 60.5 43 Q59 35 54 34 Q49 37 45 34 Q41 36 39.5 43Z" fill="#12171a"/>'
    + '<path d="M43 34 Q41 40 42 47 M57 34 Q59 40 58 47" stroke="#12171a" stroke-width="1.6" fill="none"/>'
    + '<path d="M44.5 41.5 h4.5 M51.5 41.5 h4.5" stroke="#1d2420" stroke-width="1.6"/>'
    + '<circle cx="47" cy="44.5" r="1.7" fill="#9dffc4"/><circle cx="53.5" cy="44.5" r="1.7" fill="#9dffc4"/>'
    + '<path d="M47.5 55 Q50 53.6 52.5 55" stroke="#55615b" stroke-width="1.2" fill="none"/></g></svg>';
  // The PoLong has no painted portrait of the man yet, so cards show his drawn figure.
  function portrait(type) {
    if (type !== 'SOUL-POLONG') { const img = el('img'); img.src = ART[type]; img.alt = ''; return img; }
    const box = el('span', 'drawn-portrait'); box.innerHTML = GHOST_SVG; return box;
  }

  function soulSVG(type) {
    if (type === 'SOUL-POLONG') return GHOST_SVG;
    const L = LOOK[type], s = L.scale || 1, [hairBack, hairFront] = HAIR[L.hairStyle](L.hair);
    return `<svg viewBox="0 0 100 170" aria-hidden="true"><ellipse class="aura" cx="50" cy="96" rx="36" ry="74"/><ellipse class="shadow" cx="50" cy="166" rx="${20 * s}" ry="4"/>
      <g transform="translate(50 165) scale(${s}) translate(-50 -165)">
        <g class="leg leg-b"><path d="M46 112 L45 159" stroke="${L.legs}" stroke-width="7" stroke-linecap="round"/><path d="M41 161 h9" stroke="#1d1611" stroke-width="5" stroke-linecap="round"/></g>
        <g class="arm arm-b">${BACK[L.back] || ''}<path d="M58 63 Q64 81 61 97" stroke="${L.arm}" stroke-width="8" stroke-linecap="round" fill="none" opacity=".8"/><circle cx="61" cy="99" r="3.8" fill="${L.skin}"/></g>
        <g class="leg leg-f"><path d="M54 112 L55 159" stroke="${L.legs}" stroke-width="7" stroke-linecap="round"/><path d="M52 161 h10" stroke="#1d1611" stroke-width="5" stroke-linecap="round"/></g>
        <path d="M38 59 Q50 53 62 59 L69 126 Q50 132 31 126Z" fill="${L.robe}"/>
        <path d="M51 56 Q58 57 62 59 L69 126 Q60 129 52 130Z" fill="#000" opacity=".17"/>
        <path d="M31 126 Q50 132 69 126 M39 88 Q50 92 61 88" stroke="${L.trim}" stroke-width="2.5" fill="none"/>
        ${OVER[L.over] || ''}${BODY[L.body] || ''}
        <rect x="46.5" y="49" width="7" height="10" fill="${L.skin}"/>${hairBack}
        <circle cx="50" cy="41" r="11" fill="${L.skin}"/><circle cx="55" cy="40" r="1.3" fill="#1a1310"/><circle cx="49" cy="40" r="1.2" fill="#1a1310"/>
        ${hairFront}${L.hat ? HAT[L.hat](L) : ''}
        <g class="arm arm-f"><path d="M42 63 Q36 81 39 97" stroke="${L.arm}" stroke-width="8" stroke-linecap="round" fill="none"/><circle cx="39" cy="99" r="3.8" fill="${L.skin}"/>${PROP[L.prop] || ''}</g>
      </g></svg>`;
  }
  const headTop = type => type === 'SOUL-POLONG' ? 22 : Math.round(165 - (LOOK[type].scale || 1) * (LOOK[type].hat === 'helmet' ? 156 : 140));
  const FLAME = '<svg viewBox="0 0 24 32" aria-hidden="true"><path d="M12 1c4 7 8 10 8 17a8 8 0 0 1-16 0c0-4 2-7 4-10 0 3 1 5 3 6 0-5-1-9 1-13z"/></svg>';

  /* ---------- Stage helpers ---------- */
  let cam = 1;
  function fit() { const s = Math.min(innerWidth / W, innerHeight / 900) * cam; stage.style.transform = `translate(-50%,-50%) scale(${s})`; }
  addEventListener('resize', fit); fit();
  function tween(ms, fn, ease = t => t) {
    ms = T(ms);
    return new Promise(res => { const t0 = performance.now(); const step = now => { const t = Math.min(1, (now - t0) / ms); fn(ease(t)); if (t < 1) requestAnimationFrame(step); else res(); }; requestAnimationFrame(step); });
  }
  const easeIn = t => t * t, easeOut = t => 1 - (1 - t) * (1 - t), easeInOut = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  function setLX(v) { lx = v; stage.style.setProperty('--lx', v + 'px'); }
  function setBX(v) { bx = v; stage.style.setProperty('--bx', v + 'px'); }
  let bgFront = $('#bg-a');
  function setBackdrop(src) {
    const cur = bgFront, other = cur.id === 'bg-a' ? $('#bg-b') : $('#bg-a');
    if (!src) { cur.classList.remove('on'); other.classList.remove('on'); return; }
    if (cur.classList.contains('on') && cur.getAttribute('src') === src) return;
    other.src = src; other.classList.add('on'); cur.classList.remove('on'); bgFront = other;
  }
  function setScene(next, dest = null) {
    scene = next; sceneDest = dest; stage.dataset.scene = next;
    stage.style.setProperty('--tint', dest ? COLOR[dest] : '#edc47f');
    $('#sign-name').textContent = next === 'dest' ? DEST[dest].name : 'The Starting Shore';
    $('#sign-fog').textContent = next === 'dest' ? 'Fog ' + DEST[dest].fog : 'Souls wait here';
    setBackdrop(next === 'shore' ? ART['MAT-SHORE'] : next === 'dest' ? ART[dest] : null);
  }
  const sceneOf = s => (s.phase === 'boarding' || !s.destination) ? 'shore' : 'dest';
  function stageToScreen(x, y) { const r = stage.getBoundingClientRect(), s = r.width / W; return { x: r.left + x * s, y: r.top + y * s }; }
  function floatText(at, text, cls = '') { const f = el('div', 'floaty ' + cls, text); f.style.left = at.x + 'px'; f.style.top = at.y + 'px'; fx.append(f); setTimeout(() => f.remove(), T(2100)); }
  function effect(cls, at, ms) { const e = el('div', cls); e.style.left = at.x + 'px'; e.style.top = at.y + 'px'; fx.append(e); setTimeout(() => e.remove(), T(ms)); }
  const boatMid = () => ({ x: DOCK.x + bx + 280, y: DOCK.y + 10 });
  let toastTimer = 0;
  function say(text) { toast.textContent = text; toast.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), 4600); }

  /* ---------- Sound: synthesized in the browser (drone, water, slow melody, effects); no audio files ---------- */
  const Sound = (() => {
    const KEY = 'the-ferryman:2d-concept:sound';
    let ctx = null, master = null, echo = null, noise = null, on = true;
    try { on = localStorage.getItem(KEY) !== 'off'; } catch {}
    const gainNode = (v, to) => { const g = ctx.createGain(); g.gain.value = v; if (to) g.connect(to); return g; };
    function lfo(param, rate, depth) { const o = ctx.createOscillator(), g = gainNode(depth); o.frequency.value = rate; o.connect(g); g.connect(param); o.start(); }
    function start() {
      if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
      const AC = globalThis.AudioContext || globalThis.webkitAudioContext; if (!AC) return;
      try {
        ctx = new AC(); master = gainNode(on ? .85 : 0, ctx.destination);
        echo = ctx.createDelay(1); echo.delayTime.value = .36; const fb = gainNode(.38); echo.connect(fb); fb.connect(echo); echo.connect(gainNode(.45, master));
        const len = ctx.sampleRate * 3, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0); let last = 0;
        for (let i = 0; i < len; i++) { last = (last + .02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.5; }
        noise = buf;
        const bed = gainNode(.5, master), lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 380; lp.connect(bed);
        const drone = gainNode(.05, lp); lfo(drone.gain, .06, .025);
        for (const [f, t] of [[55, 'sine'], [82.4, 'sine'], [110.6, 'triangle'], [164.8, 'sine']]) { const o = ctx.createOscillator(); o.type = t; o.frequency.value = f; o.connect(drone); o.start(); }
        const water = ctx.createBufferSource(), bp = ctx.createBiquadFilter(), wg = gainNode(.07, bed);
        water.buffer = noise; water.loop = true; bp.type = 'bandpass'; bp.frequency.value = 520; bp.Q.value = .6;
        lfo(bp.frequency, .09, 160); lfo(wg.gain, .13, .035); water.connect(bp); bp.connect(wg); water.start();
        setInterval(melody, 2600);
      } catch { ctx = null; }
    }
    // Falls silent while the tab is hidden or minimized, and fades back in on return.
    document.addEventListener('visibilitychange', () => {
      if (!ctx) return;
      const t = ctx.currentTime;
      master.gain.cancelScheduledValues(t); master.gain.setValueAtTime(master.gain.value, t);
      if (document.hidden) { master.gain.linearRampToValueAtTime(0, t + .15); setTimeout(() => { if (document.hidden) ctx.suspend(); }, 200); }
      else ctx.resume().then(() => { const n = ctx.currentTime; master.gain.setValueAtTime(0, n); master.gain.linearRampToValueAtTime(on ? .85 : 0, n + .8); });
    });
    const SCALE = [0, 3, 5, 7, 10, 12, 15, 17];
    function melody() {
      if (!ctx || !on || document.hidden || Math.random() < .35) return;
      const n = SCALE[Math.floor(Math.random() * SCALE.length)];
      tone(220 * Math.pow(2, n / 12), { dur: 3.2, vol: .035, type: 'triangle', attack: .04, wet: true });
      if (Math.random() < .3) tone(110 * Math.pow(2, n / 12), { dur: 4, vol: .03, attack: .3 });
    }
    function tone(freq, { dur = 1, vol = .1, type = 'sine', to = 0, attack = .01, delay = 0, wet = false } = {}) {
      if (!ctx || !on) return;
      const t = ctx.currentTime + delay, o = ctx.createOscillator(), g = gainNode(0, master);
      o.type = type; o.frequency.setValueAtTime(freq, t); if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + attack); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
      if (wet) g.connect(echo); o.connect(g); o.start(t); o.stop(t + dur + .05);
    }
    function hiss(dur, { f = 800, to = 0, q = 1, type = 'bandpass', vol = .1, attack = .01, delay = 0 } = {}) {
      if (!ctx || !on) return;
      const t = ctx.currentTime + delay, s = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), g = gainNode(0, master);
      s.buffer = noise; fl.type = type; fl.Q.value = q; fl.frequency.setValueAtTime(f, t); if (to) fl.frequency.exponentialRampToValueAtTime(to, t + dur);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + attack); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
      s.connect(fl); fl.connect(g); s.start(t, Math.random() * 1.5); s.stop(t + dur + .05);
    }
    const chord = (fs, o) => fs.forEach((f, i) => tone(f, { ...o, delay: i * (o.gap || 0) }));
    const SFX = {
      tick: () => tone(1700, { dur: .06, vol: .02 }),
      step: () => hiss(.07, { f: 700 + Math.random() * 300, q: 1.5, vol: .045 }),
      hop: () => hiss(.35, { f: 400, to: 1400, vol: .05, attack: .1 }),
      thud: () => { tone(90, { dur: .3, vol: .16, to: 45 }); hiss(.4, { f: 500, type: 'lowpass', vol: .1 }); },
      toll: () => { tone(98, { dur: 2.6, vol: .22 }); tone(147, { dur: 2.2, vol: .1 }); tone(49, { dur: 1.8, vol: .16, type: 'triangle' }); },
      chime: () => chord([880, 1108, 1318], { dur: 1.4, vol: .05, gap: .08, wet: true }),
      memory: () => chord([659, 784, 988, 1318], { dur: 1.2, vol: .05, gap: .09, wet: true, type: 'triangle' }),
      ascend: () => chord([523, 659, 784, 1046, 1318], { dur: 1.6, vol: .04, gap: .12, wet: true, attack: .05 }),
      wraith: () => { tone(220, { dur: 1.6, vol: .07, type: 'sawtooth', to: 55 }); tone(233, { dur: 1.5, vol: .05, type: 'square', to: 58 }); hiss(1.3, { f: 300, type: 'lowpass', vol: .14 }); },
      fog: () => hiss(2.6, { f: 180, to: 900, type: 'lowpass', vol: .22, attack: 1 }),
      sail: () => hiss(3.2, { f: 300, to: 700, vol: .12, attack: .6, q: .7 }),
      polong: () => { tone(392, { dur: 2.2, vol: .07, to: 196, wet: true }); tone(415, { dur: 2.2, vol: .05, to: 207 }); },
      gong: () => { tone(98, { dur: 3.5, vol: .14, wet: true }); tone(147, { dur: 3, vol: .07 }); tone(196, { dur: 2.5, vol: .04 }); },
      heart: () => { tone(60, { dur: .22, vol: .3 }); tone(55, { dur: .25, vol: .25, delay: .24 }); },
      end: () => { tone(110, { dur: 5, vol: .2, to: 55 }); tone(116, { dur: 5, vol: .12, to: 58 }); }
    };
    function toggle() { on = !on; try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch {} if (master) { master.gain.cancelScheduledValues(0); master.gain.value = on ? .85 : 0; } if (on) start(); return on; }
    return { start, toggle, play: k => { try { SFX[k](); } catch {} }, get on() { return on; } };
  })();

  /* ---------- Atmosphere: lantern darkness, place particles, ripples, bursts (one canvas over the scene) ---------- */
  const AMBIENT = {
    shore: { rgb: '210,235,140', kind: 'fly' }, river: { rgb: '180,220,240', kind: 'fly' },
    'DEST-HAVEN': { rgb: '255,205,120', kind: 'fly' }, 'DEST-STYX': { rgb: '195,165,255', kind: 'fly' }, 'DEST-ACHERON': { rgb: '120,225,235', kind: 'fly' },
    'DEST-ASPHODEL': { rgb: '205,210,215', kind: 'ash' }, 'DEST-ELYSIUM': { rgb: '255,225,150', kind: 'petal' }, 'DEST-TARTARUS': { rgb: '255,110,60', kind: 'ember' }
  };
  const FLAVOR = {
    'DEST-HAVEN': 'A safe harbor in the dark. No fog, and no healing.', 'DEST-STYX': 'The threshold every soul crosses.',
    'DEST-ACHERON': 'River of woe, the first taste of the underworld.', 'DEST-ASPHODEL': 'The gray middle fields, thick with the fog of forgetting.',
    'DEST-ELYSIUM': 'Paradise for the worthy, the far edge of the good.', 'DEST-TARTARUS': 'The deepest pit, the far edge of the bad.'
  };
  let dipV = 0, px = [0, 0], pxGoal = [0, 0];
  const FX = (() => {
    const cv = $('#particles'), g = cv.getContext('2d'), parts = [], rings = [], motes = [], glows = new Map();
    function glow(rgb) {
      let c = glows.get(rgb); if (c) return c;
      c = document.createElement('canvas'); c.width = c.height = 64;
      const x = c.getContext('2d'), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
      gr.addColorStop(0, `rgba(${rgb},1)`); gr.addColorStop(.25, `rgba(${rgb},.55)`); gr.addColorStop(1, `rgba(${rgb},0)`);
      x.fillStyle = gr; x.fillRect(0, 0, 64, 64); glows.set(rgb, c); return c;
    }
    function newMote(fresh) {
      const a = AMBIENT[scene === 'dest' ? sceneDest : scene] || AMBIENT.shore;
      const m = { kind: a.kind, rgb: a.rgb, x: Math.random() * W, y: 0, vx: 0, vy: 0, t: Math.random() * 6.3, size: 4 + Math.random() * 8, life: 0, max: 300 + Math.random() * 500 };
      if (a.kind === 'fly') { m.y = 140 + Math.random() * 520; m.vx = (Math.random() - .5) * .4; }
      else if (a.kind === 'ember') { m.y = fresh ? Math.random() * 900 : 900; m.vy = -(.6 + Math.random() * 1.4); m.size = 3 + Math.random() * 5; }
      else { m.y = fresh ? Math.random() * 900 : -20; m.vy = .3 + Math.random() * .7; m.vx = (Math.random() - .3) * .5; }
      return m;
    }
    for (let i = 0; i < 60; i++) motes.push(newMote(true));
    function emit(n, o) {
      for (let i = 0; i < n; i++) parts.push({ x: o.x + (Math.random() - .5) * (o.spread || 0), y: o.y + (Math.random() - .5) * (o.spreadY ?? o.spread ?? 0), vx: (o.vx || 0) + (Math.random() - .5) * (o.jx ?? 1), vy: (o.vy || 0) + (Math.random() - .5) * (o.jy ?? 1), grav: o.grav || 0, life: 0, max: o.life * (.6 + Math.random() * .8), size: o.size * (.6 + Math.random() * .8), rgb: o.rgb, smoke: !!o.smoke, drag: o.drag ?? .99 });
    }
    function ring(x, y, max) { rings.push({ x, y, r: 6, max, a: .5 }); }
    const BURST = {
      thud: (x, y) => { ring(x, y, 150); ring(x, y, 90); emit(10, { x, y: y - 10, spread: 40, spreadY: 4, vy: -2, jx: 2, jy: 1, grav: .12, life: 40, size: 5, rgb: '190,225,240' }); },
      splash: (x, y) => { emit(28, { x, y, spread: 60, spreadY: 6, vy: -3.2, jx: 3, jy: 2, grav: .16, life: 50, size: 6, rgb: '190,225,240' }); ring(x, y + 10, 160); ring(x, y + 10, 100); },
      ascend: (x, y) => emit(60, { x, y: y - 40, spread: 50, spreadY: 90, vy: -1.6, jx: .8, jy: 1, life: 110, size: 12, rgb: '255,226,160', drag: .995 }),
      wraith: (x, y) => { emit(30, { x, y: y - 60, spread: 50, spreadY: 80, vy: -1.2, jx: 1.4, jy: .8, life: 90, size: 46, rgb: '25,5,5', smoke: true }); emit(34, { x, y: y - 60, spread: 40, spreadY: 80, vy: -2, jx: 2, jy: 1.5, life: 70, size: 9, rgb: '255,80,50' }); },
      polong: (x, y) => { emit(40, { x, y, spread: 60, spreadY: 10, vy: -1.4, jx: 1.4, jy: 1, life: 90, size: 14, rgb: '120,255,180' }); ring(x, y + 20, 170); },
      memory: (x, y) => emit(30, { x, y, spread: 20, jx: 4, jy: 4, life: 50, size: 10, rgb: '255,230,170', drag: .93 }),
      light: (x, y) => emit(26, { x, y, spread: 10, jx: 3, jy: 3, vy: -1, life: 60, size: 12, rgb: '255,200,110', drag: .95 }),
      calm: (x, y) => emit(32, { x, y: y - 60, spread: 40, spreadY: 80, vy: -.8, jx: 1, jy: 1, life: 80, size: 10, rgb: '170,220,255' }),
      fog: () => emit(40, { x: 900, y: 560, spread: 1500, spreadY: 300, vx: -2, jx: 1, jy: .3, life: 160, size: 130, rgb: '200,215,215', smoke: true, drag: 1 })
    };
    let frame = 0, lastHeart = 0, flick = 0;
    function loop(ts) {
      frame++;
      px[0] += (pxGoal[0] - px[0]) * .05; px[1] += (pxGoal[1] - px[1]) * .05;
      if (frame % 2 === 0) { stage.style.setProperty('--px', px[0].toFixed(3)); stage.style.setProperty('--py', px[1].toFixed(3)); }
      g.clearRect(0, 0, W, 900);
      const L = { x: DOCK.x + bx + 54, y: DOCK.y + 84 + dipV };
      // The night closes in around the boat lantern as Light runs out.
      flick = flick * .9 + (Math.random() - .5) * .08;
      const light = state ? shownLight : C.maxLight, cx = L.x * .55 + 800 * .45, cy = L.y * .5 + 225;
      const r = (300 + light * 150) * (1 + flick * .05), edge = Math.min(.9, .3 + (C.maxLight - light) * .1);
      const dark = g.createRadialGradient(cx, cy, r * .3, cx, cy, r);
      dark.addColorStop(0, 'rgba(2,6,8,0)'); dark.addColorStop(1, `rgba(2,6,8,${edge})`);
      g.fillStyle = dark; g.fillRect(0, 0, W, 900);
      if (state && state.phase !== 'ended' && light <= 2) {
        const p = (Math.sin(ts / 190) + 1) / 2, red = g.createRadialGradient(800, 450, 300, 800, 450, 950);
        red.addColorStop(0, 'rgba(120,0,0,0)'); red.addColorStop(1, `rgba(150,10,10,${.12 + p * .14})`); g.fillStyle = red; g.fillRect(0, 0, W, 900);
        if (light > 0 && ts - lastHeart > 1150 && !document.hidden) { lastHeart = ts; Sound.play('heart'); }
      }
      if (!reduce) {
        if (Math.random() < .08) emit(1, { x: L.x, y: L.y - 6, spread: 6, vy: -.9, jx: .5, jy: .3, life: 70, size: 4, rgb: '255,190,100' });
        if (scene !== 'river' && Math.random() < .04) emit(1, { x: 880 + lx, y: 598, spread: 6, vy: -.8, jx: .4, jy: .3, life: 60, size: 4, rgb: '255,190,100' });
        for (const sp of sprites.values()) {
          if (!sp.el.isConnected) continue;
          const p = visualPos(sp);
          if (sp.el.classList.contains('walking') && Math.random() < .35) emit(1, { x: p.x, y: p.y - 6, spread: 16, vy: -.6, jx: .6, jy: .3, life: 45, size: 8, rgb: '170,215,255' });
          if (sp.type === 'SOUL-POLONG' && Math.random() < .12) emit(1, { x: p.x, y: p.y - 70, spread: 30, spreadY: 50, vy: -.5, jx: .4, jy: .3, life: 70, size: 9, rgb: '120,255,180' });
        }
        if (stage.classList.contains('sailing')) { if (frame % 9 === 0) ring(DOCK.x + bx + 20 + Math.random() * 60, DOCK.y + 202, 240); }
        else if (frame % 110 === 0) ring(DOCK.x + bx + 280, DOCK.y + 205, 330);
      }
      for (let i = rings.length - 1; i >= 0; i--) {
        const o = rings[i]; o.r += (o.max - o.r) * .03 + .4; o.a *= .975;
        if (o.a < .02) { rings.splice(i, 1); continue; }
        g.strokeStyle = `rgba(190,225,235,${o.a})`; g.lineWidth = 1.5; g.beginPath(); g.ellipse(o.x, o.y, o.r, o.r * .16, 0, 0, 6.283); g.stroke();
      }
      for (let i = parts.length - 1; i >= 0; i--) { const p = parts[i]; if (++p.life > p.max) { parts.splice(i, 1); continue; } p.vx *= p.drag; p.vy = p.vy * p.drag + p.grav; p.x += p.vx; p.y += p.vy; }
      for (const p of parts) if (p.smoke) { const k = p.life / p.max, s = p.size * (1 + k); g.globalAlpha = Math.sin(Math.PI * k) * .35; g.drawImage(glow(p.rgb), p.x - s, p.y - s, s * 2, s * 2); }
      g.globalCompositeOperation = 'lighter';
      if (!reduce) for (let i = 0; i < motes.length; i++) {
        const m = motes[i]; m.life++; m.t += .02;
        if (m.kind === 'fly') { m.x += m.vx + Math.sin(m.t * 1.3) * .35; m.y += Math.cos(m.t) * .3; }
        else if (m.kind === 'ember') { m.x += Math.sin(m.t * 3) * .5; m.y += m.vy; }
        else { m.x += m.vx + Math.sin(m.t * 2) * .6; m.y += m.vy; }
        if (m.life > m.max || m.y < -40 || m.y > 940 || m.x < -40 || m.x > W + 40) { motes[i] = newMote(false); continue; }
        const fade = Math.max(0, Math.min(1, m.life / 60, (m.max - m.life) / 60)), tw = m.kind === 'fly' ? .5 + .5 * Math.sin(m.t * 4) : 1, s = m.size * (m.kind === 'fly' ? 1.6 : 1);
        g.globalAlpha = fade * tw * (m.kind === 'ash' ? .45 : .8); g.drawImage(glow(m.rgb), m.x - s, m.y - s, s * 2, s * 2);
      }
      for (const p of parts) if (!p.smoke) { const s = p.size; g.globalAlpha = (1 - p.life / p.max) * .9; g.drawImage(glow(p.rgb), p.x - s, p.y - s, s * 2, s * 2); }
      g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
    return { burst: (k, x, y) => BURST[k](x, y), ring };
  })();
  addEventListener('pointermove', e => { pxGoal = [e.clientX / innerWidth * 2 - 1, e.clientY / innerHeight * 2 - 1]; });
  function dip(a = 7) { return tween(900, t => { dipV = a * Math.exp(-4 * t) * Math.sin(t * 18); stage.style.setProperty('--dip', dipV.toFixed(2) + 'px'); }); }
  function jolt(kind) {
    const f = $('#frame');
    if (kind === 'hurt' && !reduce) { f.classList.remove('shake'); void f.offsetWidth; f.classList.add('shake'); }
    const fl = el('div', 'flash ' + kind); fx.append(fl); setTimeout(() => fl.remove(), T(850));
  }
  function cinema(on) { stage.classList.toggle('cine', on); document.body.classList.toggle('cine', on); }
  async function titleCard(name, sub) {
    const c = $('#dest-card'); c.replaceChildren(el('b', '', name), el('span', '', sub));
    c.classList.remove('show'); void c.offsetWidth; c.classList.add('show'); Sound.play('gong');
    await wait(2000);
  }

  /* ---------- Seats and shore spots ---------- */
  function aboardIds() { return !state ? [] : state.phase === 'boarding' ? state.selected.slice() : state.boat.map(s => s.id); }
  // Keeps each soul on its own bench; slides everyone along only when a two-seat Soldier finds no gap.
  function fitSeats(ids) {
    for (const k of Object.keys(seatOf)) if (!ids.includes(k)) delete seatOf[k];
    const used = Array(C.seats).fill(false);
    const mark = (id, at) => { for (let i = 0; i < SOUL[typeOf(id)].seats; i++) used[at + i] = true; };
    for (const id of ids) if (!isGhost(id) && seatOf[id] != null) mark(id, seatOf[id]);
    for (const id of ids) {
      if (isGhost(id) || seatOf[id] != null) continue;
      const n = SOUL[typeOf(id)].seats; let at = -1;
      for (let s = 0; s + n <= C.seats && at < 0; s++) if (used.slice(s, s + n).every(u => !u)) at = s;
      if (at < 0) { let s = 0; for (const j of ids) if (!isGhost(j)) { seatOf[j] = s; s += SOUL[typeOf(j)].seats; } return true; }
      seatOf[id] = at; mark(id, at);
    }
    return false;
  }
  function seatLocal(id) {
    if (isGhost(id)) { const k = Math.max(0, aboardIds().filter(isGhost).indexOf(id)), p = GHOST_SPOTS[k % GHOST_SPOTS.length]; return { x: p[0], y: p[1] }; }
    const s = seatOf[id] ?? 0, n = SOUL[typeOf(id)].seats; let x = 0;
    for (let i = 0; i < n; i++) x += SEAT_X[Math.min(C.seats - 1, s + i)];
    return { x: x / n, y: SEAT_Y };
  }
  function slotFor(id) {
    if (slotOf[id] == null) { const used = new Set(Object.values(slotOf)); let i = 0; while (used.has(i)) i++; slotOf[id] = i; }
    const i = slotOf[id]; return { x: SHORE_X[i % SHORE_X.length] + Math.floor(i / SHORE_X.length) * 40, y: LAND_Y };
  }
  function pruneSlots() { if (!state) return; const keep = new Set(state.shore.map(s => s.id)); for (const k of Object.keys(slotOf)) if (!keep.has(k)) delete slotOf[k]; }

  /* ---------- Soul sprites ---------- */
  const tr = (x, y) => `translate(${x - 50}px, ${y - 165}px)`;
  function makeSprite(id, anger = 0, limit = C.shoreAngerLimit) {
    dropSprite(id);
    const type = typeOf(id), s = SOUL[type], b = el('button', 'soul' + (isGhost(id) ? ' ghost' : ''));
    b.type = 'button'; b.dataset.id = id; b.style.setProperty('--top', headTop(type) + 'px');
    b.innerHTML = `<span class="lift"><span class="flip"><span class="pose">${soulSVG(type)}</span></span></span><span class="over"><span class="name"><i class="wish" style="background:${COLOR[s.wish]}"></i>${s.name}</span><span class="pips"></span></span>`;
    b.addEventListener('click', () => soulClick(id));
    b.addEventListener('pointerenter', () => showTip(id)); b.addEventListener('pointerleave', hideTip);
    b.addEventListener('focus', () => showTip(id)); b.addEventListener('blur', hideTip);
    const sp = { id, type, el: b, x: 0, y: 0, layer: null, busy: false };
    sprites.set(id, sp); setPips(sp, anger, limit);
    return sp;
  }
  function dropSprite(id) { const sp = sprites.get(id); if (sp) { sp.el.remove(); sprites.delete(id); } }
  function place(sp, layer, x, y) {
    const parent = layer === 'boat' ? boatSouls : walkers;
    if (sp.el.parentNode !== parent) parent.append(sp.el);
    sp.layer = layer; sp.x = x; sp.y = y; sp.el.style.transform = tr(x, y);
  }
  function face(sp, dx) { if (Math.abs(dx) > 1) sp.el.classList.toggle('left', dx < 0); }
  const boatOrigin = () => ({ x: DOCK.x + bx - lx, y: DOCK.y });
  function toWalkers(sp) { if (sp.layer !== 'boat') return; const o = boatOrigin(); place(sp, 'walk', sp.x + o.x, sp.y + o.y); }
  function toBoat(sp) { if (sp.layer === 'boat') return; const o = boatOrigin(); place(sp, 'boat', sp.x - o.x, sp.y - o.y); }
  const visualPos = sp => sp.layer === 'boat' ? { x: DOCK.x + bx + sp.x, y: DOCK.y + sp.y } : { x: sp.x + lx, y: sp.y };
  function setPips(sp, n, limit) {
    if (!sp) return;
    const box = sp.el.querySelector('.pips'); box.replaceChildren();
    for (let i = 0; i < limit; i++) box.append(el('i', i < n ? 'on' : ''));
    box.classList.toggle('near', n >= limit - 1);
  }
  function pulse(sp, cls = 'pulse', ms = 800) { if (!sp) return; sp.el.classList.add(cls); setTimeout(() => sp.el.classList.remove(cls), T(ms)); }

  // Walks a soul along straight steps; a step with `hop` is an arc (onto or off the boat).
  // Returns false when halt() stopped the soul mid-step; it then stands where it was stopped.
  async function move(sp, steps) {
    sp.busy = true; sp.halted = null; sp.el.classList.add('walking');
    try {
      for (const st of steps) {
        const { x, y, hop = 0, speed = SPEED } = st, dx = x - sp.x, dy = y - sp.y, dist = Math.hypot(dx, dy);
        if (dist < 1) continue;
        face(sp, dx);
        const n = hop ? 14 : 1, frames = [];
        for (let i = 0; i <= n; i++) { const t = i / n; frames.push({ transform: tr(sp.x + dx * t, sp.y + dy * t - Math.sin(Math.PI * t) * hop) }); }
        const anim = sp.anim = sp.el.animate(frames, { duration: T(hop ? Math.max(560, dist / speed * 1000) : dist / speed * 1000), easing: 'linear', fill: 'forwards' });
        sp.stopAt = t => ({ x: sp.x + dx * t, y: sp.y + dy * t - Math.sin(Math.PI * t) * hop });
        const steps = hop ? (Sound.play('hop'), 0) : setInterval(() => Sound.play('step'), 280);
        await anim.finished.catch(() => {});
        clearInterval(steps); sp.anim = null;
        if (sp.halted) { const p = sp.halted; sp.x = p.x; sp.y = p.y; sp.el.style.transform = tr(p.x, p.y); return false; }
        sp.x = x; sp.y = y; sp.el.style.transform = tr(x, y); anim.cancel();
      }
      return true;
    } finally { sp.anim = null; sp.el.classList.remove('walking'); sp.busy = false; }
  }
  // Stops a soul mid-walk so a changed boarding choice can turn them around on the spot.
  function halt(sp) {
    if (!sp.anim) return;
    sp.halted = sp.stopAt(sp.anim.effect.getComputedTiming().progress ?? 1); sp.anim.cancel();
  }
  function track(p) { walking.add(p); p.finally(() => walking.delete(p)); return p; }

  async function walkAboard(id) {
    const sp = sprites.get(id); if (!sp) return;
    if (fitSeats(aboardIds())) slideSeats(id);
    const seat = seatLocal(id), o = boatOrigin(), steps = [];
    // Starts from wherever the soul stands, which may be partway along the pier after a change of mind.
    if (sp.x < PIER.x0 + 5) steps.push({ x: PIER.x0 + 6, y: PIER.y });
    if (sp.x < PIER.x1 - 1) steps.push({ x: PIER.x1, y: PIER.y });
    steps.push({ x: seat.x + o.x, y: seat.y + o.y, hop: 70 });
    if (!await move(sp, steps)) return;
    toBoat(sp); sp.el.classList.remove('left');
    const p = visualPos(sp); FX.burst('thud', p.x, DOCK.y + 196); Sound.play('thud'); dip(6);
    const now = seatLocal(id); if (Math.abs(now.x - sp.x) > 1) await move(sp, [{ x: now.x, y: now.y }]);
    sp.el.classList.remove('left'); refreshSprites();
  }
  async function walkAshore(id) {
    const sp = sprites.get(id); if (!sp) return;
    const seated = sp.layer === 'boat', home = slotFor(id), steps = [];
    toWalkers(sp); fitSeats(aboardIds()); if (seated) dip(4);
    if (sp.x > PIER.x1 + 1) steps.push({ x: PIER.x1, y: PIER.y, hop: seated ? 60 : 0 });
    if (steps.length || sp.x > PIER.x0 + 7) steps.push({ x: PIER.x0 + 6, y: PIER.y });
    steps.push({ x: home.x, y: home.y });
    if (!await move(sp, steps)) return;
    sp.el.classList.remove('left'); refreshSprites();
  }
  function slideSeats(except) {
    for (const [id, sp] of sprites) {
      if (id === except || sp.layer !== 'boat' || sp.busy) continue;
      const p = seatLocal(id);
      if (Math.abs(p.x - sp.x) > 1) track(move(sp, [{ x: p.x, y: p.y }]).then(() => sp.el.classList.remove('left')));
    }
  }
  async function ascend(sp) {
    sp.el.classList.add('ascend'); effect('beam', visualPos(sp), 1900);
    const at = visualPos(sp); FX.burst('ascend', at.x, at.y); Sound.play('ascend');
    const a = sp.el.animate([{ transform: tr(sp.x, sp.y), opacity: 1 }, { transform: tr(sp.x, sp.y - 150), opacity: 0 }], { duration: T(1500), easing: 'ease-in', fill: 'forwards' });
    await a.finished.catch(() => {}); dropSprite(sp.id);
  }
  async function disembark(id) {
    const sp = sprites.get(id); if (!sp) return null;
    toWalkers(sp); dip(4);
    await move(sp, [{ x: PIER.x1, y: PIER.y, hop: 60 }, { x: PIER.x0 + 6, y: PIER.y }, { x: 230 + Math.random() * 120, y: LAND_Y }]);
    const pos = visualPos(sp);
    return { pos, up: ascend(sp) };
  }
  async function wraithOut(id, paid) {
    const sp = sprites.get(id); let at = boatMid();
    if (sp) {
      sp.el.classList.add('wraith'); at = visualPos(sp); Sound.play('wraith'); await wait(950);
      effect('smoke', { x: at.x, y: at.y - 80 }, 1500); FX.burst('wraith', at.x, at.y);
      const a = sp.el.animate([{ transform: tr(sp.x, sp.y), opacity: 1 }, { transform: tr(sp.x + 40, sp.y - 190), opacity: 0 }], { duration: T(1100), easing: 'ease-in', fill: 'forwards' });
      await a.finished.catch(() => {}); dropSprite(id);
    }
    if (!paid) floatText({ x: at.x, y: at.y - 120 }, 'Guard holds', 'calm');
    await loseLight(paid, { x: at.x, y: at.y - 120 });
  }
  async function loseLight(n, at) {
    for (let i = 0; i < n; i++) {
      shownLight = Math.max(0, shownLight - 1); renderLight(shownLight); jolt('hurt'); Sound.play('toll');
      if (at) floatText({ x: at.x, y: at.y - i * 40 }, '-1 Light', 'hurt');
      await wait(650);
    }
  }
  async function gainLight(to) {
    if (shownLight < to) { Sound.play('chime'); jolt('heal'); }
    while (shownLight < to) { shownLight++; renderLight(shownLight - 1); FX.burst('light', DOCK.x + bx + 54, DOCK.y + 84); await wait(320); }
  }
  async function orbToHand(from) {
    const a = stageToScreen(from.x, from.y), r = hudHand.getBoundingClientRect(), o = el('i', 'orb'); document.body.append(o);
    const an = o.animate([{ transform: `translate(${a.x}px,${a.y}px) scale(.5)`, opacity: 0 }, { offset: .2, opacity: 1, transform: `translate(${a.x}px,${a.y - 40}px) scale(1.2)` }, { transform: `translate(${r.left + r.width / 2}px,${r.top + r.height / 2}px) scale(.6)`, opacity: .3 }], { duration: T(950), easing: 'ease-in-out' });
    await an.finished.catch(() => {}); o.remove(); Sound.play('memory');
  }
  async function sail(out) {
    stage.classList.add('sailing'); Sound.play('sail');
    const D = W + 120;
    if (out) await Promise.all([tween(1700, t => setLX(-D * t), easeIn), tween(1700, t => setBX(160 * t), easeInOut)]);
    else { setLX(D); await Promise.all([tween(2000, t => setLX(D * (1 - t)), easeOut), tween(2000, t => setBX(160 * (1 - t)), easeInOut)]); stage.classList.remove('sailing'); }
  }
  function leaveLanding() { for (const [id, sp] of [...sprites]) if (sp.layer === 'walk') dropSprite(id); }

  /* ---------- Engine bridge ---------- */
  const rand = n => crypto.getRandomValues(new Uint32Array(1))[0] % n;
  // As in v0.6 online play, the river deals two different destinations per fork.
  function dealRoutes() {
    if (!state || state.phase === 'ended' || state.paused) return;
    const missing = C.foresightForks - state.routes.offers.length; if (missing <= 0) return;
    const offers = []; for (let i = 0; i < missing; i++) { const a = rand(6); let b = rand(5); if (b >= a) b++; offers.push([DEST_IDS[a], DEST_IDS[b]]); }
    state = game.transition(state, { type: 'APPEND_ROUTES', offers });
  }
  function newLines(before, after) {
    const last = before.log[before.log.length - 1];
    let i = last ? after.log.findIndex(e => e.round === last.round && e.cycle === last.cycle && e.text === last.text) : -1;
    if (i < 0) i = Math.max(-1, after.log.length - 7);
    return after.log.slice(i + 1).map(e => e.text);
  }
  // Light actually paid for one logged loss, consuming the line so repeated names (several PoLongs) stay in order.
  function takePaid(lines, label) {
    const i = lines.findIndex(l => l.startsWith(label)); if (i < 0) return 0;
    const m = lines[i].match(/: (\d+) Light lost/); lines.splice(i, 1); return m ? +m[1] : 0;
  }
  function save() { try { if (state) localStorage.setItem(SAVE_KEY, JSON.stringify({ state: JSON.parse(game.exportSave(state)), seatOf, slotOf })); } catch {} }
  function loadSave() {
    try { const raw = JSON.parse(localStorage.getItem(SAVE_KEY)); if (!raw) return null; return { state: game.importSave(JSON.stringify(raw.state)), seatOf: raw.seatOf || {}, slotOf: raw.slotOf || {} }; }
    catch { return null; }
  }

  async function perform(action) {
    if (!state || busy) return false;
    if (action.type !== 'BOARD') { busy = true; await Promise.all([...walking]); busy = false; }
    const before = state; let next;
    try { next = game.transition(state, action); }
    catch (e) { say(e.message); if (action.type === 'BOARD') pulse(sprites.get(action.id), 'refuse', 500); return false; }
    state = next; dealRoutes(); save();
    const lines = newLines(before, state);
    if (action.type === 'BOARD') {
      hideTip(); hud();
      // A soul clicked again mid-walk stops and turns; queued walks read the latest choice when they start.
      const id = action.id, sp = sprites.get(id); if (sp) halt(sp);
      const go = () => state.phase === 'boarding' && (state.selected.includes(id) ? walkAboard(id) : walkAshore(id));
      const p = track(sp ? (sp.queue = (sp.queue || Promise.resolve()).then(go)) : Promise.resolve());
      await p; save(); return true;
    }
    busy = true; busyTitle = ''; hideTip(); closePopup(); hud();
    try { await (SHOW[action.type] || (() => wait(150)))(before, state, action, lines); }
    catch (e) { console.error(e); }
    finally {
      busy = false; shownHand = null; shownLight = state.light; stage.classList.remove('sailing'); cinema(false);
      if (state.phase === 'ended' && before.phase !== 'ended') Sound.play('end');
      if (state.phase !== 'ended') {
        const sc = sceneOf(state);
        if (sc !== scene || (sc === 'dest' && sceneDest !== state.destination)) setScene(sc, state.destination);
        setLX(0); setBX(0);
      }
      sync(); save(); hud();
      if (state.phase === 'trim') openTrim();
      if (state.phase === 'review') perform({ type: 'BACK' });
      if (state.phase === 'ended') setTimeout(showEnd, T(700));
    }
    return true;
  }

  // One staging per engine action. `before`/`after` are engine states; `lines` are the new log lines.
  const SHOW = {
    async DEPART() { pruneSlots(); say('Cast off. The ferryman leans on his pole.'); stage.classList.add('castoff'); await wait(700); stage.classList.remove('castoff'); },
    async CROSS(before, after, action, lines) {
      const dest = action.destination, calc = game.preview(before, dest);
      routePick = null; busyTitle = 'Rowing toward ' + DEST[dest].name; renderPanel();
      cinema(true);
      await sail(true); leaveLanding(); setScene('river'); setLX(W + 120);
      await wait(350);
      for (const s of after.boat) if (!before.boat.some(b => b.id === s.id)) await risePolong(s.id);
      await fogCrossing(calc, takePaid(lines, 'crossing fog'), lines);
      if (after.phase === 'ended') return;
      setScene('dest', dest); await sail(false);
      await titleCard(DEST[dest].name, FLAVOR[dest]);
      cinema(false);
      say('Arrived at ' + DEST[dest].name + '.');
    },
    async DELIVER(before, after, action, lines) {
      const ids = action.ids, fresh = after.hand.filter(m => !before.hand.some(h => h.id === m.id));
      chosen.clear(); shownHand = before.hand.slice(); busyTitle = ids.length ? 'Souls step ashore' : 'The boat waits'; renderPanel(); refreshSprites();
      await Promise.all(ids.map((id, i) => (async () => {
        await wait(i * 480);
        const done = await disembark(id); if (!done) return;
        const type = typeOf(id), mine = fresh.filter(m => m.source === type || (type === 'SOUL-MOTHER' && m.source === 'QUEST-FAMILY'));
        for (const m of mine) { await orbToHand({ x: done.pos.x, y: done.pos.y - 110 }); shownHand.push(m); renderHand(); }
        await done.up;
      })()));
      if (before.quest !== after.quest && after.quest === 'completed') { say('Mother and Child quest complete: you hold the Passage memory.'); await wait(1200); }
      if (before.quest !== after.quest && after.quest === 'failed') { say('The family quest can no longer be completed.'); await wait(1000); }
      const kept = before.boat.filter(s => !ids.includes(s.id));
      if (kept.length) {
        say('Everyone still aboard grows restless: +1 Ship Anger.');
        for (const s of kept) { const sp = sprites.get(s.id); setPips(sp, s.anger + 1, C.shipAngerLimit); pulse(sp); }
        await wait(1000);
      }
      for (const s of kept) {
        if (after.boat.some(b => b.id === s.id)) continue;
        say(SOUL[s.type].name + ' waited too long and becomes a wraith.');
        await wraithOut(s.id, takePaid(lines, SOUL[s.type].name + ' Ship Anger expiry'));
        if (shownLight === 0) return;
      }
      if (after.phase !== 'ended' && !after.boat.length) say('The boat is empty. Time to row home.');
    },
    async RETURN(before, after, action, lines) {
      busyTitle = 'Rowing home'; renderPanel();
      cinema(true);
      await sail(true); leaveLanding(); setScene('river'); setLX(W + 120); await wait(500);
      for (const s of before.shore) { const sp = makeSprite(s.id, s.anger); const p = slotFor(s.id); place(sp, 'walk', p.x, p.y); }
      setScene('shore'); await sail(false);
      await titleCard('The Starting Shore', after.phase === 'ended' ? 'The last return.' : 'Cycle ' + after.cycle + ' begins.');
      cinema(false);
      if (before.shore.length) {
        say('Souls left waiting grow angry: +1 Shore Anger.');
        for (const s of before.shore) { const sp = sprites.get(s.id); setPips(sp, s.anger + 1, C.shoreAngerLimit); pulse(sp); }
        await wait(1000);
      }
      const lost = before.shore.filter(s => lines.some(l => l.startsWith(SOUL[s.type].name + ' Shore Anger expiry')));
      for (const s of lost) {
        say(SOUL[s.type].name + ' gave up waiting and becomes a wraith.');
        await wraithOut(s.id, takePaid(lines, SOUL[s.type].name + ' Shore Anger expiry')); delete slotOf[s.id];
        if (shownLight === 0) return;
      }
      if (after.phase === 'ended') return;
      say('You survived the return. The lantern recovers up to ' + C.returnLight + ' Light.');
      await gainLight(after.light);
      const arrivals = after.shore.filter(s => lost.some(l => l.id === s.id) || !before.shore.some(b => b.id === s.id));
      if (arrivals.length) say(arrivals.length + ' new soul' + (arrivals.length > 1 ? 's arrive' : ' arrives') + ' at the shore.');
      await walkIn(arrivals);
    },
    async PLAY_MEMORY(before, after, action, lines) {
      const held = before.hand.find(h => h.id === action.id), mem = MEM[held.type], fresh = after.hand.filter(m => !before.hand.some(h => h.id === m.id));
      shownHand = before.hand.filter(h => h.id !== action.id); renderHand();
      const burst = el('div', 'cardburst'); burst.innerHTML = `<img src="${ART[held.type]}" alt=""><b>${mem.name}</b>`; fx.append(burst);
      Sound.play('memory'); FX.burst('memory', 800, 380);
      await wait(1050); burst.remove();
      const target = action.target && [...after.shore, ...after.boat].find(s => s.id === action.target), sp = action.target && sprites.get(action.target);
      if (mem.kind === 'light') { say(after.light > before.light ? 'The lantern flares: +1 Light.' : 'The lantern was already full.'); await gainLight(after.light); }
      else if (mem.kind === 'guard') { say('Guard: the next point of Light loss this round is prevented.'); floatText(boatMid(), 'Guarded', 'good'); }
      else if (mem.kind === 'fog') { say('Fog Shield: this crossing costs 1 less fog.'); floatText(boatMid(), 'Fog Shield', 'calm'); }
      else if (mem.kind === 'foresight') say('Foresight: the next forks of the river are revealed.');
      else if (mem.kind === 'calm') {
        say('Calm: ' + SOUL[typeOf(action.target)].name + ' settles. Anger -1.');
        if (sp && target) { pulse(sp, 'calmed', 1300); FX.burst('calm', visualPos(sp).x, visualPos(sp).y); setPips(sp, target.anger, after.boat.some(b => b.id === target.id) ? C.shipAngerLimit : C.shoreAngerLimit); floatText({ x: visualPos(sp).x, y: visualPos(sp).y - 150 }, 'Calm', 'calm'); }
      } else if (mem.kind === 'passage') {
        const name = SOUL[typeOf(action.target)].name;
        say('Passage: ' + name + ' is carried straight to ' + DEST[SOUL[typeOf(action.target)].wish].name + '.');
        if (sp) { const pos = visualPos(sp), up = ascend(sp); for (const m of fresh) { await orbToHand({ x: pos.x, y: pos.y - 110 }); shownHand.push(m); renderHand(); } await up; }
        if (!after.boat.length) say('The boat is empty. Time to row home.');
      }
      await wait(500);
    },
    async DISCARD_MEMORY() { await wait(200); }
  };
  async function risePolong(id) {
    say('A PoLong rises from the black water and climbs aboard. It cannot be refused.');
    const sp = makeSprite(id, 0, C.shipAngerLimit), p = seatLocal(id);
    place(sp, 'boat', p.x - 80, p.y + 130); sp.el.classList.add('rising');
    FX.burst('polong', DOCK.x + bx + p.x - 60, DOCK.y + 205); Sound.play('polong');
    await move(sp, [{ x: p.x, y: p.y, hop: 40, speed: 80 }]);
    sp.el.classList.remove('rising', 'left'); await wait(400);
  }
  async function fogCrossing(calc, paid, lines) {
    const wall = el('div', 'fogwall'); wall.style.setProperty('--d', Math.min(1, .2 + calc.fog * .22)); fx.append(wall);
    requestAnimationFrame(() => wall.classList.add('in'));
    if (calc.fog) { Sound.play('fog'); FX.burst('fog'); }
    await wait(1000);
    const at = { x: DOCK.x + bx + 280, y: DOCK.y - 10 };
    if (calc.shield) { floatText(at, 'Fog Shield: -1 fog', 'calm'); await wait(700); }
    if (!calc.fog) floatText(at, 'Clear water', 'calm');
    else if (lines.some(l => l.startsWith('crossing fog') && l.includes('Guard'))) { floatText(at, 'Guard holds', 'calm'); await wait(600); }
    await loseLight(paid, { x: at.x, y: at.y - 50 });
    await wait(500); wall.classList.remove('in'); setTimeout(() => wall.remove(), T(1200));
  }
  async function walkIn(list) {
    await Promise.all(list.map((s, i) => (async () => {
      await wait(i * 420);
      const sp = makeSprite(s.id, s.anger), home = slotFor(s.id);
      place(sp, 'walk', -70, LAND_Y); await move(sp, [{ x: home.x, y: home.y }]);
    })()));
  }

  // Rebuilds every sprite from the engine state without animation (load, and after each staging).
  function sync() {
    if (!state) return;
    const aboard = aboardIds(); fitSeats(aboard); pruneSlots();
    const ashore = scene === 'shore' ? state.shore.filter(s => !aboard.includes(s.id)) : [];
    const keep = new Set([...aboard, ...ashore.map(s => s.id)]);
    for (const id of [...sprites.keys()]) if (!keep.has(id)) dropSprite(id);
    for (const id of aboard) { const sp = sprites.get(id) || makeSprite(id); const p = seatLocal(id); place(sp, 'boat', p.x, p.y); sp.el.classList.remove('left', 'walking'); }
    for (const s of ashore) { const sp = sprites.get(s.id) || makeSprite(s.id); const p = slotFor(s.id); place(sp, 'walk', p.x, p.y); sp.el.classList.remove('left', 'walking'); }
  }

  /* ---------- Input ---------- */
  function soulClick(id) {
    const sp = sprites.get(id); if (!state || busy || !sp) return;
    if (state.phase === 'boarding') { perform({ type: 'BOARD', id }); return; }
    if (sp.busy) return;
    if (state.phase === 'delivery' && sp.layer === 'boat' && SOUL[sp.type].wish === state.destination) { if (chosen.has(id)) chosen.delete(id); else chosen.add(id); hud(); return; }
    showTip(id);
  }

  /* ---------- HUD ---------- */
  function hud() {
    renderLight(); renderInfo(); renderHand(); renderPanel(); renderRoutes(); refreshSprites();
    stage.classList.toggle('guarded', !!state && state.window.guard > 0);
    stage.classList.toggle('shielded', !!state && state.window.shield > 0);
    $('#corner').hidden = !state;
  }
  function renderLight(flash = -1) {
    hudLight.replaceChildren(el('span', 'label', 'Light'));
    hudLight.setAttribute('aria-label', 'Light ' + shownLight + ' of ' + C.maxLight);
    for (let i = 0; i < C.maxLight; i++) { const f = el('i', 'flame' + (i < shownLight ? '' : ' out') + (i === flash ? ' flash' : '')); f.innerHTML = FLAME; hudLight.append(f); }
    hudLight.hidden = !state;
    hudLight.classList.toggle('low', shownLight <= 2);
  }
  function renderInfo() {
    hudInfo.replaceChildren(); if (!state) return;
    const k = C.spawnInterval - Number(BigInt(state.round) % BigInt(C.spawnInterval));
    const chips = [['Cycle ' + state.cycle], ['Round ' + state.round], [k === 1 ? 'PoLong rises next round' : 'PoLong in ' + k + ' rounds', k === 1 ? 'hot' : ''], [QUEST[state.quest], state.quest === 'completed' ? 'good' : state.quest === 'failed' ? 'hot' : ''], ['Delivered ' + state.deliveries]];
    if (state.window.guard) chips.push(['Guard ready', 'good']);
    if (state.window.shield) chips.push(['Fog Shield ready', 'good']);
    for (const [t, c] of chips) hudInfo.append(el('span', c || '', t));
  }
  // The engine decides whether a held memory can be played right now: null if it can, else the reason.
  function memoryBlock(m, target = null) {
    try { game.transition(state, { type: 'PLAY_MEMORY', id: m.id, target }); return null; } catch (e) { return e.message; }
  }
  const needsTarget = m => ['calm', 'passage'].includes(MEM[m.type].kind);
  const memoryTargets = m => [...state.shore, ...state.boat].filter(t => !memoryBlock(m, t.id));
  const canPlay = m => !!state && !busy && (needsTarget(m) ? memoryTargets(m).length > 0 : !memoryBlock(m));
  function renderHand() {
    hudHand.replaceChildren(); if (!state) return;
    const hand = shownHand || state.hand;
    hudHand.append(el('span', 'label', 'Memories'));
    for (let i = 0; i < Math.max(C.handLimit, hand.length); i++) {
      const m = hand[i];
      if (!m) { hudHand.append(el('span', 'card empty')); continue; }
      const b = el('button', 'card' + (!shownHand && canPlay(m) ? ' playable' : '') + (i >= C.handLimit ? ' over' : '')); b.type = 'button';
      b.innerHTML = `<img src="${ART[m.type]}" alt=""><span>${MEM[m.type].name}</span>`;
      b.title = MEM[m.type].name + ': ' + MEM[m.type].text;
      b.addEventListener('click', () => { if (busy) return; if (state.phase === 'trim') openTrim(); else openMemory(m); });
      hudHand.append(b);
    }
  }
  function para(parent, text, cls = '') { const p = el('p', cls, text); parent.append(p); return p; }
  function renderPanel() {
    panel.replaceChildren();
    if (!state || state.phase === 'ended') { panel.hidden = true; return; }
    panel.hidden = false;
    const h = el('h2'), row = el('div', 'actions'); panel.append(h);
    if (busy) { h.textContent = busyTitle || 'The river moves...'; return; }
    const memHint = state.hand.some(canPlay) ? ' You may also play one memory (top right).' : '';
    if (state.phase === 'boarding') {
      const used = game.seats(state);
      h.textContent = 'Who will you carry?';
      const p = para(panel, `Click a soul to walk them aboard; click again, even mid-walk, to send them back. Seats ${used}/${C.seats}`);
      const bar = el('span', 'seatbar'); for (let i = 0; i < C.seats; i++) bar.append(el('i', i < used ? 'on' : '')); p.append(bar);
      if (state.selected.length) {
        const list = el('div', 'aboard'); list.append(el('span', '', 'Aboard:'));
        for (const id of state.selected) { const b = btn(SOUL[typeOf(id)].name + ' ✕', () => perform({ type: 'BOARD', id }), 'secondary'); b.setAttribute('aria-label', 'Send ' + SOUL[typeOf(id)].name + ' back ashore'); list.append(b); }
        if (state.selected.length > 1) list.append(btn('Clear all', () => { for (const id of state.selected.slice()) perform({ type: 'BOARD', id }); }, 'secondary'));
        panel.append(list);
      }
      if (memHint) para(panel, memHint.trim(), 'small');
      para(panel, `Souls left on the shore gain 1 Shore Anger when you return; at ${C.shoreAngerLimit} they become wraiths.`, 'small');
      row.append(btn(state.selected.length ? 'Cast off' : 'Board at least one soul', () => perform({ type: 'DEPART' }), 'primary', !state.selected.length));
    } else if (state.phase === 'window' && state.window.kind === 'outward') {
      const offers = game.offers(state), offer = offers[0];
      if (routePick && !(offer && offer.includes(routePick))) routePick = null;
      if (!offer) { h.textContent = 'Waiting for the river'; para(panel, 'No fork is ready yet.'); }
      else if (!routePick) {
        h.textContent = 'The river forks';
        para(panel, 'Click one of the two signs ahead. Each crossing costs Light equal to its fog.' + memHint);
      } else {
        const pv = game.preview(state, routePick);
        h.textContent = 'Row to ' + DEST[routePick].name + '?';
        para(panel, `Fog ${pv.base}${pv.tainted ? ' + ' + pv.tainted + ' from PoLong' : ''}${pv.shield ? ' - ' + pv.shield + ' Fog Shield' : ''}${pv.guard && pv.fog ? ', Guard blocks 1' : ''}. Light ${state.light} → ${pv.remaining}.`, pv.lethal ? 'warn' : '');
        if (pv.lethal) para(panel, 'This crossing puts your lantern out.', 'warn');
        row.append(btn('Row there', () => perform({ type: 'CROSS', destination: routePick }), 'primary'), btn('Choose again', () => { routePick = null; hud(); }));
      }
      if (offer && game.preview(state, offer[0]).spawn) para(panel, 'A PoLong will rise from the water and board during this crossing.', 'small');
      if (offers.length > 1) para(panel, 'Foresight: then ' + offers.slice(1).map(o => o.map(d => DEST[d].name).join(' or ')).join(', then ') + '.', 'small');
    } else if (state.phase === 'window') {
      h.textContent = 'The boat is empty';
      para(panel, `Row back to the Starting Shore. Waiting souls gain 1 Shore Anger, then the lantern recovers ${C.returnLight} Light and new souls arrive.` + memHint);
      row.append(btn('Row back to the shore', () => perform({ type: 'RETURN' }), 'primary'));
    } else if (state.phase === 'delivery') {
      const matching = state.boat.filter(s => SOUL[s.type].wish === state.destination);
      h.textContent = 'Arrived at ' + DEST[state.destination].name;
      para(panel, (matching.length ? 'Glowing souls wish to rest here. Click them to let them off; each ordinary soul leaves you a memory.' : 'No one aboard wishes to rest here.') + memHint);
      const doomed = state.boat.filter(s => !chosen.has(s.id) && s.anger + 1 >= C.shipAngerLimit);
      if (doomed.length) para(panel, doomed.map(s => SOUL[s.type].name).join(', ') + (doomed.length > 1 ? ' turn' : ' turns') + ' into a wraith if kept aboard: -1 Light each.', 'warn');
      else para(panel, 'Everyone still aboard then gains 1 Ship Anger.', 'small');
      row.append(btn(chosen.size ? `Let ${chosen.size} soul${chosen.size > 1 ? 's' : ''} off` : 'Keep everyone aboard', () => perform({ type: 'DELIVER', ids: [...chosen] }), 'primary'));
    } else if (state.phase === 'trim') {
      h.textContent = 'Too many memories';
      para(panel, `You can hold ${C.handLimit}. Let one go.`);
      row.append(btn('Choose a memory to let go', openTrim, 'primary'));
    }
    panel.append(row);
  }
  function renderRoutes() {
    routeLayer.replaceChildren();
    if (!state || busy || state.phase !== 'window' || state.window.kind !== 'outward') return;
    const offer = game.offers(state)[0]; if (!offer) return;
    routeLayer.append(el('div', 'fork-label', 'The river forks'));
    offer.forEach((d, i) => {
      const pv = game.preview(state, d), top = i ? 300 : 232, wants = state.boat.filter(s => SOUL[s.type].wish === d).map(s => SOUL[s.type].name);
      const b = el('button', 'sign' + (routePick === d ? ' picked' : '') + (pv.lethal ? ' lethal' : '')); b.type = 'button';
      b.style.left = (i ? 1336 : 1066) + 'px'; b.style.top = top + 'px'; b.style.setProperty('--c', COLOR[d]); b.style.setProperty('--post', (690 - top - 92) + 'px');
      b.style.animationDelay = (i * .12) + 's';
      b.innerHTML = `<span class="post"></span><span class="board"><img src="${ART[d]}" alt=""><span><b>${DEST[d].name}</b><small class="fogv">Fog ${pv.fog}${pv.tainted ? ' (PoLong +' + pv.tainted + ')' : ''}</small><small class="wants">${wants.length ? wants.join(', ') + (wants.length > 1 ? ' rest here' : ' rests here') : 'No one aboard rests here'}</small></span></span>`;
      b.setAttribute('aria-label', `Choose ${DEST[d].name}, fog ${pv.fog}`);
      b.addEventListener('click', () => { if (!busy) { routePick = d; hud(); } });
      routeLayer.append(b);
    });
  }
  function angerLimitFor(id) { return state.boat.some(b => b.id === id) ? C.shipAngerLimit : C.shoreAngerLimit; }
  function refreshSprites() {
    if (!state) return;
    for (const [id, sp] of sprites) {
      const onShip = state.boat.some(s => s.id === id), item = state.boat.find(s => s.id === id) || state.shore.find(s => s.id === id);
      if (item && !busy) setPips(sp, item.anger, angerLimitFor(id));
      const match = !busy && state.phase === 'delivery' && onShip && SOUL[sp.type].wish === state.destination;
      sp.el.classList.toggle('match', match);
      sp.el.classList.toggle('chosen', chosen.has(id));
      sp.el.classList.toggle('clickable', !busy && (state.phase === 'boarding' || match));
      const name = SOUL[sp.type].name;
      sp.el.setAttribute('aria-label', state.phase === 'boarding' ? (state.selected.includes(id) ? 'Send ' + name + ' back ashore' : 'Walk ' + name + ' aboard') : match ? (chosen.has(id) ? 'Keep ' + name + ' aboard' : 'Let ' + name + ' off here') : name);
    }
  }
  function showTip(id) {
    const sp = sprites.get(id); if (!sp || !state || sp.busy) return;
    const s = SOUL[sp.type], item = [...state.shore, ...state.boat].find(x => x.id === id), onShip = state.boat.some(b => b.id === id);
    tip.innerHTML = '';
    tip.append(portrait(sp.type));
    const body = el('div', 'body'); tip.append(body);
    body.append(el('h3', '', s.name));
    para(body, 'Wishes for ' + DEST[s.wish].name + ' (fog ' + DEST[s.wish].fog + ')');
    para(body, (s.seats === 0 ? 'Takes no seat' : 'Takes ' + s.seats + ' seat' + (s.seats > 1 ? 's' : '')) + ' · ' + (s.memory ? 'Leaves a ' + MEM[s.memory].name + ' memory' : 'Leaves no memory'));
    if (item) para(body, (onShip ? 'Ship Anger ' : 'Shore Anger ') + item.anger + ' of ' + (onShip ? C.shipAngerLimit : C.shoreAngerLimit));
    para(body, s.text, 'muted');
    tip.hidden = false;
  }
  function hideTip() { tip.hidden = true; }

  /* ---------- Popups ---------- */
  function openPopup(build, cls = '') { popup.className = 'popup ' + cls; popup.replaceChildren(); build(popup); if (!popup.open) popup.showModal(); }
  function closePopup() { if (popup.open) popup.close(); }
  function openMemory(m) {
    const mem = MEM[m.type], targets = state && needsTarget(m) ? memoryTargets(m) : null, can = canPlay(m);
    openPopup(p => {
      const img = el('img', 'art'); img.src = ART[m.type]; img.alt = ''; p.append(img);
      p.append(el('p', 'eyebrow', 'Memory from ' + (SOUL[m.source] ? SOUL[m.source].name : 'the family quest')), el('h2', '', mem.name));
      para(p, mem.text);
      const row = el('div', 'actions');
      if (!can) para(p, state.window.used ? 'You already played a memory for this round. You get a new one next round.' : targets ? (mem.kind === 'passage' ? 'Passage needs a soul aboard the boat on the river.' : 'No soul can be chosen right now.') : memoryBlock(m), 'small');
      else if (mem.kind === 'calm' || mem.kind === 'passage') {
                para(p, mem.kind === 'calm' ? 'Choose a soul to calm:' : 'Choose a soul aboard to carry home:');
        const grid = el('div', 'targets');
        for (const t of targets) {
          const b = el('button', 'target'); b.type = 'button';
          const onShip = state.boat.some(x => x.id === t.id);
          b.append(portrait(t.type));
          b.insertAdjacentHTML('beforeend', `<span>${SOUL[t.type].name}<small>${onShip ? 'Ship' : 'Shore'} Anger ${t.anger}</small></span>`);
          b.addEventListener('click', () => { closePopup(); perform({ type: 'PLAY_MEMORY', id: m.id, target: t.id }); });
          grid.append(b);
        }
        p.append(grid);
      } else row.append(btn('Play ' + mem.name, () => { closePopup(); perform({ type: 'PLAY_MEMORY', id: m.id, target: null }); }, 'primary'));
      row.append(btn('Keep it', closePopup));
      p.append(row);
    });
  }
  function openTrim() {
    if (!state || state.phase !== 'trim') return;
    openPopup(p => {
      p.append(el('p', 'eyebrow', 'Too many memories'), el('h2', '', 'Let one go'));
      para(p, `You can hold ${C.handLimit} memories. Choose one to release into the river.`);
      const grid = el('div', 'targets');
      for (const m of state.hand) {
        const b = el('button', 'target'); b.type = 'button';
        b.innerHTML = `<img src="${ART[m.type]}" alt=""><span>${MEM[m.type].name}<small>from ${SOUL[m.source] ? SOUL[m.source].name : 'the quest'}</small></span>`;
        b.addEventListener('click', () => { closePopup(); perform({ type: 'DISCARD_MEMORY', id: m.id }); });
        grid.append(b);
      }
      p.append(grid, el('div', 'actions'));
    });
  }
  function openGuide() {
    openPopup(p => {
      p.append(el('p', 'eyebrow', 'How to play'), el('h2', '', 'The Ferryman'));
      const ul = el('ul');
      for (const t of [
        'Click souls on the shore to walk them onto the boat (4 seats; the Soldier takes 2). Cast off when ready.',
        'At each fork, choose one of two destinations. Arriving costs Light equal to its fog.',
        'Souls whose wish matches the destination glow. Click them to let them off; most leave you a memory card.',
        'Everyone still aboard gains 1 Ship Anger each round. At 4 they become wraiths: -1 Light.',
        'When the boat is empty, row home. Souls left on the shore gain 1 Shore Anger; at 2 they become wraiths. You recover 2 Light.',
        'Every 3rd round a PoLong rises and boards. It takes no seat but adds fog at anger 2 or 3. Its wish is Tartarus.',
        'Play one memory each round, at any time: while boarding, at a fork, at a dock or before rowing home. Hold at most 3.',
        'Family quest: deliver the Child to Haven before the Mother to Tartarus to earn Passage.',
        'Survive as long as you can. The night ends when your Light reaches 0.'
      ]) ul.append(el('li', '', t));
      p.append(ul);
      const row = el('div', 'actions'); row.append(btn('Back to the river', closePopup, 'primary')); p.append(row);
    }, 'wide');
  }
  function showEnd() {
    if (!state || state.phase !== 'ended') return;
    openPopup(p => {
      const img = el('img', 'art'); img.src = ART['DEST-TARTARUS']; img.alt = ''; p.append(img);
      p.append(el('p', 'eyebrow', 'The night is over'), el('h2', '', 'The lantern went out'));
      para(p, state.ending);
      para(p, `Cycles survived: ${state.completed} · Souls delivered: ${state.deliveries} · Rounds rowed: ${state.round}`);
      const row = el('div', 'actions'); row.append(btn('Begin a new night', () => { closePopup(); newNight(true); }, 'primary')); p.append(row);
    });
  }

  /* ---------- Start, resume ---------- */
  function clearWorld() { for (const id of [...sprites.keys()]) dropSprite(id); fx.replaceChildren(); seatOf = {}; slotOf = {}; chosen.clear(); routePick = null; setLX(0); setBX(0); }
  async function newNight(force = false) {
    if (busy) return;
    if (!force && state && state.phase !== 'ended') {
      openPopup(p => {
        p.append(el('p', 'eyebrow', 'New night'), el('h2', '', 'Abandon this night?'));
        para(p, 'Starting over replaces the current run and its save.');
        const row = el('div', 'actions'); row.append(btn('Begin a new night', () => { closePopup(); newNight(true); }, 'primary'), btn('Keep rowing', closePopup)); p.append(row);
      });
      return;
    }
    Sound.start();
    closePopup(); title.hidden = true; clearWorld();
    state = game.create(crypto.getRandomValues(new Uint32Array(1))[0]); dealRoutes();
    shownLight = state.light; shownHand = null; setScene('shore'); save();
    busy = true; busyTitle = 'Souls gather at the shore'; hud();
    // Opening shot: film bars, the camera eases back from the water while the title rises.
    cinema(true);
    const shot = tween(3400, t => { cam = 1.22 - .22 * t; fit(); }, easeOut);
    await titleCard('The Ferryman', 'Night falls on the river.');
    await shot; cinema(false);
    say('Souls gather at the shore. Click one to walk them aboard.');
    await walkIn(state.shore);
    busy = false; hud();
  }
  function resume(saved) {
    Sound.start(); title.hidden = true; clearWorld();
    state = saved.state; seatOf = saved.seatOf; slotOf = saved.slotOf; shownLight = state.light;
    const sc = sceneOf(state); setScene(sc, sc === 'dest' ? state.destination : null);
    sync(); hud();
    if (state.phase === 'trim') openTrim();
    if (state.phase === 'review') perform({ type: 'BACK' });
  }
  function showTitle() {
    const saved = loadSave(), actions = $('#title-actions'); actions.replaceChildren();
    if (saved && saved.state.phase !== 'ended') actions.append(btn('Continue the night', () => resume(saved), 'primary'), btn('Begin a new night', () => newNight(true)));
    else actions.append(btn('Begin a new night', () => newNight(true), 'primary'));
    actions.append(btn('How to play', openGuide));
    title.hidden = false; setScene('shore'); hud();
  }
  $('#guide-button').addEventListener('click', openGuide);
  $('#new-button').addEventListener('click', () => newNight());
  const soundButton = $('#sound-button');
  soundButton.textContent = Sound.on ? 'Sound on' : 'Sound off';
  soundButton.addEventListener('click', () => { soundButton.textContent = Sound.toggle() ? 'Sound on' : 'Sound off'; });
  document.addEventListener('click', e => { if (e.target.closest('button')) Sound.play('tick'); }, true);
  addEventListener('pointerdown', () => { if (Sound.on) Sound.start(); });
  popup.addEventListener('close', () => { if (state && state.phase === 'trim' && !busy) setTimeout(openTrim, 50); });
  addEventListener('keydown', e => { if (e.key === 'Escape') hideTip(); });
  globalThis.__ferry2d = { get state() { return state; }, get busy() { return busy; }, perform, sprites };
  showTitle();
})();
