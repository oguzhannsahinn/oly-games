/* ================= the diving pool ================= */
// a 10 m tower on the left, the pool in front of it; the diver leaps towards +x
const TOWER_X = -4.3, EDGE_X = -2.6, PLAT_Z = 3.6, DIVES = 3;
const POOL = { x0: -1.9, x1: 4.3, y0: -1.7, y1: 1.7 };
const GRAV = 6.2, LEAP_VZ = 2.4, LEAP_VX = 1.55, TUCK_SPIN = 7.4, OPEN_SPIN = 1.1;
const ISLAND = { cx: .3, ax: 7.4, ay: 3.9 };
const KIND_WATER = 4, KIND_DECK = 5;
const WATER = [64, 160, 214], DECK = [238, 228, 206], CONCRETE = [222, 220, 212], BOARD = [70, 150, 200];
const HIP = .92;
const SUIT = [255, 106, 61], SKIN = [222, 172, 132], HAIR = [36, 28, 24];

function pick(tones, v, ix, iy, dither = .6) { return tones[clamp(Math.floor(v * 4 + (bayerAt(ix, iy) - .5) * dither), 0, 3)]; }
function islandEdge(x, y) { return Math.pow(Math.pow(Math.abs(x - ISLAND.cx) / ISLAND.ax, 4) + Math.pow(Math.abs(y) / ISLAND.ay, 4), .25); }
const inPool = (x, y, m = 0) => x > POOL.x0 - m && x < POOL.x1 + m && y > POOL.y0 - m && y < POOL.y1 + m;
function groundColor(x, y, ix, iy, i) {
  const edge = islandEdge(x, y), rough = edge + (noise(x * 1.3, y * 1.3) - .5) * .12;
  if (edge > 1) return 0;
  if (inPool(x, y)) {
    kinds[i] = KIND_WATER;
    // lane ropes and a darker band near the walls
    if (Math.abs(y) < .03 || Math.abs(Math.abs(y) - .85) < .03) return rgb(244, 244, 240);
    const wall = Math.min(x - POOL.x0, POOL.x1 - x, y - POOL.y0, POOL.y1 - y);
    const ripple = Math.sin(x * 5 + noise(x, y) * 4) * .5 + .5;
    return pick(tonesOf(WATER), .45 + (wall < .18 ? -.25 : 0) + ripple * .25 + (noise(x * 2, y * 2) - .5) * .2, ix, iy, .5);
  }
  kinds[i] = KIND_DECK;
  if (edge > .965) return pick(tonesOf([196, 184, 160]), .4 + (noise(x * 3, y * 3) - .5) * .3, ix, iy, .3);
  if (inPool(x, y, .45)) return pick(tonesOf([248, 242, 226]), .55, ix, iy, .2);
  const tile = ((Math.floor(x * 2.2) + Math.floor(y * 2.2)) & 1) ? .62 : .5;
  return pick(tonesOf(DECK), tile + (noise(x * 4, y * 4) - .5) * .08, ix, iy, .3);
}
function bake() {
  zb.fill(-1e9); pix.fill(CLEAR); ground.fill(0); kinds.fill(0); shadowMask.fill(0);
  tufts.length = 0; leaves.length = 0;
  for (let iy = 0; iy < H; iy++) for (let ix = 0; ix < W; ix++) {
    const g = unproject(ix + .5, iy + .5), i = iy * W + ix, c = groundColor(g.x, g.y, ix, iy, i);
    if (!c) continue;
    pix[i] = c; ground[i] = 1;
    zb[i] = (g.x + g.y) / R2 * COS;
  }
  groundZ.set(zb);
  // the tower: a concrete column, the platform reaching out over the water, a rail at the back
  box(TOWER_X - .6, -.75, 0, TOWER_X + .5, .75, PLAT_Z - .12, CONCRETE, 3);
  box(TOWER_X - .6, -.8, PLAT_Z - .12, EDGE_X, .8, PLAT_Z, BOARD, 5);
  for (const y of [-.75, .75]) capsule([TOWER_X - .55, y, PLAT_Z], [TOWER_X - .55, y, PLAT_Z + .7], .04, .04, () => [96, 104, 122], 'solid');
  capsule([TOWER_X - .55, -.75, PLAT_Z + .7], [TOWER_X - .55, .75, PLAT_Z + .7], .04, .04, () => [96, 104, 122], 'solid');
  for (const y of [-.8, .8]) capsule([TOWER_X - .2, y, PLAT_Z], [EDGE_X + .2, y, PLAT_Z], .03, .03, () => [96, 104, 122], 'solid');
  // ladder rungs up the front of the column
  for (let z = .3; z < PLAT_Z - .2; z += .32) capsule([TOWER_X + .52, -.25, z], [TOWER_X + .52, .25, z], .03, .03, () => [96, 104, 122], 'solid');
  for (let z = .2; z < PLAT_Z; z += .3) castShadow(TOWER_X, 0, z, .7);
  castShadow((TOWER_X + EDGE_X) / 2, 0, PLAT_Z, .9);
  // judges' table along the far side
  box(.4, -2.75, 0, 3.4, -2.3, .45, [236, 206, 140], 11);
  // sun loungers and a parasol along the near side
  for (const x of [-.4, 1.0, 2.4]) {
    box(x, 2.75, .18, x + .95, 3.25, .26, [244, 244, 240], 13);
    box(x + .7, 2.75, .26, x + .95, 3.25, .62, [255, 106, 61], 17);
    for (const xx of [x + .05, x + .85]) capsule([xx, 2.8, 0], [xx, 2.8, .18], .03, .03, () => [96, 104, 122], 'solid'), capsule([xx, 3.2, 0], [xx, 3.2, .18], .03, .03, () => [96, 104, 122], 'solid');
    castShadow(x + .5, 3.0, .25, .5);
  }
  // a starting block at the far end of each lane
  for (const y of [-1.27, -.42, .42, 1.27]) box(POOL.x1 + .1, y - .22, 0, POOL.x1 + .45, y + .22, .32, [244, 244, 240], 19);
  bakeOcclusion();
  staticShadow.set(shadowMask);
  applyShadows(groundZ);
  bakedPix.set(pix);
  bakedZ.set(zb);
}

/* ================= the diver ================= */
// poses in the body frame: [forward, up] around the hips, blended by tuck and stance
const POSE = {
  stand: { head: [0, .92], sh: [0, .62], hand: [.05, .05], knee: [0, -.42], foot: [0, -.88] },
  stream: { head: [0, .9], sh: [0, .62], hand: [0, 1.3], knee: [0, -.44], foot: [0, -.9] },
  tuck: { head: [.22, .62], sh: [.12, .42], hand: [.42, .02], knee: [.42, .2], foot: [.14, -.22] },
};
function mix(a, b, t) { const o = {}; for (const k in a) o[k] = [a[k][0] + (b[k][0] - a[k][0]) * t, a[k][1] + (b[k][1] - a[k][1]) * t]; return o; }
function drawDiver() {
  const D = G.D;
  const base = D.stance < 1 ? mix(POSE.stand, POSE.stream, D.stance) : POSE.stream;
  const p = mix(base, POSE.tuck, D.tuck);
  // rotate the frame: rot 0 is upright, positive tips the head towards +x
  const c = Math.cos(D.rot), s = Math.sin(D.rot);
  const at = ([f, u], y = 0) => [D.x + f * c + u * s, y, D.z + u * c - f * s];
  const suit = () => SUIT, skin = () => SKIN;
  const hip = at([0, 0]);
  capsule(hip, at(p.sh), .17, .16, suit, 'solid');
  for (const sy of [-.11, .11]) {
    capsule(at([0, 0], sy), at(p.knee, sy), .08, .07, skin, 'solid');
    capsule(at(p.knee, sy), at(p.foot, sy), .07, .06, skin, 'solid');
    capsule(at(p.sh, sy * 1.6), at(p.hand, sy * 1.2), .055, .05, skin, 'solid');
  }
  const h = at(p.head);
  sphere(h[0], 0, h[2], .15, SKIN, 'solid');
  const back = at([p.head[0] - .06, p.head[1] + .04]);
  sphere(back[0], 0, back[2], .1, HAIR, 'solid');
  castShadow(D.x, 0, Math.max(.05, D.z - HIP), .3, .6);
}

/* ================= game state ================= */
const BEST_KEY = 'diving-best';
function load() { try { return +localStorage.getItem(BEST_KEY) || 0; } catch (e) { return 0; } }
function save(v) { try { localStorage.setItem(BEST_KEY, String(v)); } catch (e) { /* storage may be off */ } }
const G = { time: 0, best: load(), holding: false, drops: [], rings: [] };
function reset() {
  Object.assign(G, { dive: 0, scores: [], popups: [], newBest: false });
  startDive();
}
function startDive() {
  G.D = { x: EDGE_X - .35, z: PLAT_Z + HIP, vx: 0, vz: 0, rot: 0, tuck: 0, stance: 0 };
  G.holding = false;
  setPhase('ready');
  setStatus('dive ' + (G.dive + 1) + ' of ' + DIVES + ' · hold to tuck and spin, let go to open up');
  renderHud();
}
function setPhase(p) { G.phase = p; G.phaseT = 0; }
const total = () => G.scores.reduce((a, b) => a + b, 0);

/* ================= physics ================= */
function leap() {
  const D = G.D;
  D.vx = LEAP_VX; D.vz = LEAP_VZ;
  setPhase('air');
  sound('leap');
}
function enter() {
  const D = G.D;
  // the nearest clean entry: feet first (even half turns) or head first (odd)
  const halves = Math.max(0, Math.round(D.rot / Math.PI));
  let err = Math.abs(D.rot - halves * Math.PI);
  if (D.tuck > .45) err += .9;
  const quality = Math.round(clamp(10 - err * 8.5, 0, 10) * 2) / 2;
  const points = Math.round(quality * (1 + .4 * halves) * 10) / 10;
  G.scores.push(points);
  G.dive++;
  D.z = 0;
  splash(D.x, err);
  G.popups.push({ text: points.toFixed(1), t: 0, x: D.x });
  const names = ['straight jump', 'half turn', 'one somersault', 'one and a half', 'two somersaults', 'two and a half', 'three somersaults', 'three and a half'];
  const how = err < .25 ? 'rip entry' : err < .6 ? 'clean entry' : err < 1.1 ? 'a bit of a splash' : 'belly flop';
  setStatus((names[halves] || halves / 2 + ' somersaults') + ' · ' + how + ' · ' + points.toFixed(1) + ' points');
  setPhase('done');
  sound(err < .6 ? 'rip' : 'splash');
  renderHud();
}
function splash(x, err) {
  const n = Math.round(4 + Math.min(err, 2) * 22);
  for (let k = 0; k < n; k++) {
    const a = Math.random() * Math.PI * 2, sp = .4 + Math.random() * (0.6 + err * 1.2);
    G.drops.push({ x, y: 0, z: .05, vx: Math.cos(a) * sp * .5, vy: Math.sin(a) * sp * .5, vz: 1.5 + Math.random() * (1.2 + err * 2.2), r: .05 + Math.random() * .05 });
  }
  G.rings.push({ x, t: 0 });
}
function update(dt) {
  G.time += dt; G.phaseT += dt;
  const D = G.D;
  if (G.phase === 'ready') {
    D.stance = G.holding ? Math.min(1, D.stance + dt * 8) : 0;
  } else if (G.phase === 'air') {
    D.tuck += ((G.holding ? 1 : 0) - D.tuck) * Math.min(1, dt * 14);
    D.stance = 1;
    if (D.tuck > .2) D.spun = true;
    D.rot += ((D.spun ? OPEN_SPIN : 0) + (TUCK_SPIN - OPEN_SPIN) * D.tuck) * dt;
    D.vz -= GRAV * dt;
    D.x += D.vx * dt; D.z += D.vz * dt;
    if (D.z <= .25) enter();
  } else if (G.phase === 'done' && G.phaseT > 2.2) {
    if (G.dive >= DIVES) finishAll(); else startDive();
  }
  for (const d of G.drops) { d.vz -= 9 * dt; d.x += d.vx * dt; d.y += d.vy * dt; d.z += d.vz * dt; }
  G.drops = G.drops.filter(d => d.z > 0);
  for (const r of G.rings) r.t += dt;
  G.rings = G.rings.filter(r => r.t < 1.4);
  for (const p of G.popups) p.t += dt;
  G.popups = G.popups.filter(p => p.t < 1.6);
}
function finishAll() {
  setPhase('over');
  const t = Math.round(total() * 10) / 10;
  G.newBest = t > G.best;
  if (G.newBest) { G.best = t; save(t); }
  setStatus((G.newBest ? 'new best: ' : 'total: ') + t.toFixed(1) + ' points · tap to dive again');
  showOver('Final', t.toFixed(1) + ' points' + (G.newBest ? ' · new best' : ' · best ' + G.best.toFixed(1)));
  renderHud();
}

/* ================= drawing ================= */
function draw() {
  pix.set(bakedPix);
  zb.set(bakedZ);
  if (G.phase !== 'done' && G.phase !== 'over') drawDiver();
  for (const d of G.drops) sphere(d.x, d.y, d.z, d.r, [236, 248, 252], 'solid');
  const windT = STILL ? 0 : Math.floor(G.time * WIND_FPS) / WIND_FPS;
  drawLeaves(windT);
  drawTufts(windT);
  flushShadows();
  applyShadows(bakedZ);
  shadeEdges();
  // rings spreading on the water
  for (const r of G.rings) {
    const rad = .2 + r.t * 1.1;
    if (r.t > 1 && Math.floor(r.t * 12) % 2) continue;
    for (let a = 0; a < Math.PI * 2; a += .12) {
      const x = r.x + Math.cos(a) * rad, y = Math.sin(a) * rad;
      if (!inPool(x, y)) continue;
      const q = project(x, y, 0);
      dot(Math.round(q.sx), Math.round(q.sy), rgb(232, 246, 252));
    }
  }
  // glints on the water
  for (let k = 0; k < 14; k++) {
    if (((Math.floor(G.time * 3) + k * 7) % 5) !== 0) continue;
    const x = POOL.x0 + .3 + hash(k, 3) * (POOL.x1 - POOL.x0 - .6), y = POOL.y0 + .3 + hash(k, 9) * (POOL.y1 - POOL.y0 - .6);
    const q = project(x, y, 0);
    dot(Math.round(q.sx), Math.round(q.sy), rgb(250, 254, 255)); dot(Math.round(q.sx) + 1, Math.round(q.sy), rgb(250, 254, 255));
  }
  for (const p of G.popups) {
    if (p.t > 1.3 && Math.floor(p.t * 14) % 2) continue;
    const q = project(p.x, 0, 1.6);
    drawText(p.text, q.sx, Math.round(q.sy - p.t * 12), SIGNAL, 3);
  }
  ctx.putImageData(image, 0, 0);
}

/* ================= pixel text ================= */
const FONT = {
  '0': ['XXX', 'X.X', 'X.X', 'X.X', 'XXX'], '1': ['.X.', 'XX.', '.X.', '.X.', 'XXX'], '2': ['XXX', '..X', 'XXX', 'X..', 'XXX'],
  '3': ['XXX', '..X', '.XX', '..X', 'XXX'], '4': ['X.X', 'X.X', 'XXX', '..X', '..X'], '5': ['XXX', 'X..', 'XXX', '..X', 'XXX'],
  '6': ['XXX', 'X..', 'XXX', 'X.X', 'XXX'], '7': ['XXX', '..X', '.X.', '.X.', '.X.'], '8': ['XXX', 'X.X', 'XXX', 'X.X', 'XXX'],
  '9': ['XXX', 'X.X', 'XXX', '..X', 'XXX'], '.': ['...', '...', '...', '...', '.X.'],
};
function drawText(text, cx, top, fill, k = 2) {
  const cells = [];
  let x = Math.round(cx - (text.length * 4 - 1) * k / 2);
  for (const ch of text) {
    const g = FONT[ch];
    if (g) g.forEach((row, yy) => [...row].forEach((v, xx) => { if (v === 'X') for (let a = 0; a < k; a++) for (let b = 0; b < k; b++) cells.push([x + xx * k + a, top + yy * k + b]); }));
    x += 4 * k;
  }
  for (const [px, py] of cells) for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) dot(px + ox, py + oy, INK);
  for (const [px, py] of cells) dot(px, py, fill);
}

/* ================= hud ================= */
const nodes = { pts: document.getElementById('pts'), runs: document.getElementById('runs'), best: document.getElementById('best'), status: document.getElementById('status') };
function renderHud() {
  nodes.pts.textContent = total().toFixed(1);
  let h = '';
  for (let k = 0; k < DIVES; k++) {
    const v = G.scores[k];
    h += '<span class="' + (v !== undefined ? 'done' : k === G.dive && G.phase !== 'over' ? 'now' : '') + '">' + (v !== undefined ? v.toFixed(1) : '—') + '</span>';
  }
  nodes.runs.innerHTML = h;
  nodes.best.textContent = G.best ? 'best ' + G.best.toFixed(1) : '';
}
let statusText = '';
function setStatus(text) { if (text !== statusText) { statusText = text; nodes.status.textContent = text; } }

/* ================= input ================= */
const stage = document.getElementById('stage'), rules = document.getElementById('rules');
function press() {
  ensureAudio();
  if (G.phase === 'over') { if (G.phaseT > .6) reset(); return; }
  G.holding = true;
  if (G.phase === 'ready') leap();
}
function letGo() { G.holding = false; }
stage.addEventListener('pointerdown', e => { if (e.button > 0) return; try { stage.setPointerCapture(e.pointerId); } catch (err) { /* older browsers */ } canvas.focus({ preventScroll: true }); press(); });
stage.addEventListener('pointerup', letGo);
stage.addEventListener('pointercancel', letGo);
addEventListener('keydown', e => {
  if (rules.open || (e.key !== ' ' && e.key !== 'Enter' && e.key !== 'ArrowUp')) return;
  e.preventDefault();
  if (!e.repeat) press();
});
addEventListener('keyup', e => { if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowUp') letGo(); });
document.getElementById('rules-open').addEventListener('click', () => rules.showModal());
rules.addEventListener('click', e => { if (e.target === rules) rules.close(); });
rules.addEventListener('close', () => canvas.focus({ preventScroll: true }));

/* ================= sound ================= */
function sound(kind) {
  if (!audio || muted) return;
  if (kind === 'leap') { tone(300, 520, .12, .06, 'triangle'); }
  else if (kind === 'rip') { hiss(.18, 2600, .9, .1); tone(900, 1300, .1, .03, 'sine', .05); }
  else if (kind === 'splash') { hiss(.5, 700, .5, .16); tone(160, 80, .3, .08, 'triangle'); }
}
const muteButton = document.getElementById('mute');
muteButton.addEventListener('click', () => { muteButton.blur(); muted = !muted; muteButton.textContent = muted ? 'sound off' : 'sound on'; muteButton.setAttribute('aria-pressed', String(muted)); });

/* ================= boot ================= */
addEventListener('resize', fit);
fit();
bake();
reset();
try { canvas.focus({ preventScroll: true }); } catch (e) { /* not focusable yet */ }
let last = performance.now();
function frame(now) { update(Math.min(.04, (now - last) / 1000)); last = now; draw(); requestAnimationFrame(frame); }
requestAnimationFrame(frame);
window.__diving = { G, update, draw, press, letGo };
