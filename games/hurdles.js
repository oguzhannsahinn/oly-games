/* ================= the hurdles ================= */
// the athlete runs towards +x; a tap takes off just before each hurdle
const START_X = -9.2, FIN_X = 15.4, HURDLE_X0 = -4, HURDLE_DX = 3.6, HURDLES = 6, RUNS = 3;
const ACC = 1.6, VMAX = 6.4, VTOP = 7.4, JUMP_DUR = .45, JUMP_H = 1.15, CLEAR_H = .7, PERFECT_H = 1.05;
const ISLAND = { cx: 3.2, ax: 13.4, ay: 4.8 };
const KIND_TRACK = 4;
const TRACK = [196, 96, 70], CHALK = [244, 244, 240], STAND = [236, 206, 140];
const HURDLE_C = [246, 246, 240], HURDLE_RED = [214, 58, 62], POST = [70, 74, 86];
const ATH = { jersey: [255, 106, 61], shorts: [30, 42, 69], skin: [196, 144, 106], hair: [36, 28, 24], sock: [244, 242, 236], shoe: [30, 42, 69] };

function pick(tones, v, ix, iy, dither = .6) { return tones[clamp(Math.floor(v * 4 + (bayerAt(ix, iy) - .5) * dither), 0, 3)]; }
function islandEdge(x, y) { return Math.pow(Math.pow(Math.abs(x - ISLAND.cx) / ISLAND.ax, 4) + Math.pow(Math.abs(y) / ISLAND.ay, 4), .25); }
function groundColor(x, y, ix, iy, i) {
  const edge = islandEdge(x, y), rough = edge + (noise(x * 1.3, y * 1.3) - .5) * .12;
  if (rough > 1.04) return 0;
  if (rough > .93 && hash(ix, iy) < (rough - .93) / .11) return 0;
  const ay = Math.abs(y);
  if (x > START_X - .4 && x < FIN_X + .6 && ay < .95) {
    kinds[i] = KIND_TRACK;
    if (ay > .9) return rgb(...CHALK);
    if (Math.abs(ay - .45) < .035) return rgb(...CHALK);
    if (Math.abs(x - START_X) < .06 || Math.abs(x - FIN_X) < .09) return rgb(...CHALK);
    return pick(tonesOf(TRACK), .5 + (noise(x * 3, y * 3) - .5) * .4, ix, iy, .4);
  }
  kinds[i] = KIND_GRASS;
  const t = noise(x * .9, y * .9) * 1.15 + (hash(ix, iy) - .5) * .55 - .08;
  return rgb(...GRASS[clamp(Math.floor(t * 4.2), 0, 3)]);
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
  growGrass();
  groundZ.set(zb);
  // the stands along the far side
  for (let x = -6; x < 10; x += 1.6) box(x, -1.8, 0, x + 1.5, -1.2, .7 + (x > 4 ? .3 : 0), STAND, Math.round(x * 4));
  growTree(-8.4, 3.6, .75, 300, 3);
  growTree(-2.2, -4.4, .6, 230, 71);
  growTree(13.6, -3.3, .66, 240, 31);
  bakeOcclusion();
  staticShadow.set(shadowMask);
  applyShadows(groundZ);
  bakedPix.set(pix);
  bakedZ.set(zb);
}

/* ================= hurdles and the athlete ================= */
function drawHurdle(h) {
  // a knocked hurdle drops towards the track
  const z = Math.max(.12, .95 - h.fall * .8), off = h.fall * .35;
  capsule([h.x + off, -.9, z], [h.x + off, .9, z], .045, .045, () => h.state === 'clip' ? HURDLE_RED : HURDLE_C, 'solid');
  for (const y of [-.9, .9]) capsule([h.x, y, 0], [h.x, y, .95], .035, .035, () => POST, 'solid');
  castShadow(h.x + off, 0, z, .07);
}
function drawAthlete() {
  const A = G.A;
  const airborne = G.jump !== null;
  if (!airborne) {
    const s = Math.sin(A.phase), c = Math.cos(A.phase), running = G.phase === 'run' && A.v > .3;
    player(A.x, 0, 0, { z: running ? Math.abs(c) * .06 : 0, crouch: .14, lean: running ? .24 : .05, hR: [.1 - s * .3, .3, 1.5], hL: [.1 + s * .3, -.3, 1.5], footR: running ? [s * .5, Math.max(0, c) * .2] : [.1, 0], footL: running ? [-s * .5, Math.max(0, -c) * .2] : [-.1, 0] }, ATH);
    return;
  }
  const tuck = Math.sin(Math.PI * clamp(G.jump.t / JUMP_DUR, 0, 1));
  player(A.x, 0, 0, { z: lift(), crouch: .2, lean: .4, hR: [.5, .3, 2.1], hL: [.5, -.3, 2.1], footR: [.7 * tuck, .55 * tuck], footL: [-.2, .9 * tuck] }, ATH);
}

/* ================= game state ================= */
const BEST_KEY = 'hurdles-best';
function load() { try { return +localStorage.getItem(BEST_KEY) || 0; } catch (e) { return 0; } }
function save(v) { try { localStorage.setItem(BEST_KEY, String(v)); } catch (e) { /* storage may be off */ } }
const G = { time: 0, best: load(), holding: false };
function reset() {
  Object.assign(G, { run: 0, times: [], popups: [], newBest: false });
  startRun();
}
function startRun() {
  G.A = { x: START_X, v: 0, phase: 0 };
  G.hurdles = Array.from({ length: HURDLES }, (_, k) => ({ x: HURDLE_X0 + k * HURDLE_DX, state: 'todo', fall: 0 }));
  G.t = 0; G.pen = 0; G.jump = null; G.land = 0;
  setPhase('ready');
  setStatus('race ' + (G.run + 1) + ' of ' + RUNS + ' · tap or press space to start');
  renderHud();
}
function setPhase(p) { G.phase = p; G.phaseT = 0; }
const runTime = () => G.t + G.pen;

/* ================= physics ================= */
function clip(h) {
  h.state = 'clip';
  G.A.v *= .55;
  G.popups.push({ text: 'X', t: 0, x: h.x });
  sound('clip');
  setStatus('knocked it · tap a little earlier');
}
const lift = () => G.jump ? Math.sin(Math.PI * clamp(G.jump.t / JUMP_DUR, 0, 1)) * JUMP_H : 0;
function jumpAt() {
  if (G.jump || G.land > 0) return;
  G.jump = { t: 0 };
  sound('jump');
}
// where to tap for the next hurdle: true while a jump started now would clear it
function nextHurdle() { return G.hurdles.find(h => h.state === 'todo'); }
function inWindow() {
  const h = nextHurdle(), A = G.A;
  if (!h || G.jump) return false;
  const span = A.v * JUMP_DUR, dx = h.x - A.x;
  return dx > span * .28 && dx < span * .72;
}
function update(dt) {
  G.time += dt; G.phaseT += dt;
  const ph = G.phase;
  if (ph === 'run') {
    G.t += dt;
    const A = G.A;
    if (A.v < VMAX) A.v = Math.min(VMAX, A.v + ACC * dt);
    A.x += A.v * dt;
    A.phase += A.v * dt * 2.4;
    G.land = Math.max(0, G.land - dt);
    for (const h of G.hurdles) if (h.state === 'todo' && A.x >= h.x) {
      const l = lift();
      if (l < CLEAR_H) clip(h);
      else {
        h.state = 'ok';
        if (l >= PERFECT_H) { A.v = Math.min(VTOP, A.v + .45); G.popups.push({ text: '+', t: 0, x: h.x }); setStatus('perfect · speed up'); sound('perfect'); }
        else setStatus('clean');
      }
    }
    if (G.jump) { G.jump.t += dt; if (G.jump.t >= JUMP_DUR) { G.jump = null; G.land = .06; } }
    if (A.x >= FIN_X) finishRun();
  } else if (ph === 'done' && G.phaseT > 2.2) {
    if (G.run >= RUNS) finishAll(); else startRun();
  }
  for (const h of G.hurdles) if (h.state === 'clip') h.fall = Math.min(1, h.fall + dt * 4);
  for (const p of G.popups) p.t += dt;
  G.popups = G.popups.filter(p => p.t < 1.2);
  if (ph === 'run') renderHud();
}
function finishRun() {
  const t = runTime();
  G.times.push(t);
  G.run++;
  setPhase('done');
  sound('finish');
  setStatus('run ' + G.run + ' · ' + t.toFixed(2) + ' s');
  renderHud();
}
function finishAll() {
  setPhase('over');
  const best = Math.min(...G.times);
  G.newBest = !G.best || best < G.best;
  if (G.newBest) { G.best = best; save(best); }
  setStatus((G.newBest ? 'new best: ' : 'best run: ') + best.toFixed(2) + ' s · tap to run again');
  showOver('Finished', best.toFixed(2) + ' s' + (G.newBest ? ' · new best' : ' · best ' + G.best.toFixed(2)));
  renderHud();
}

/* ================= drawing ================= */
function draw() {
  pix.set(bakedPix);
  zb.set(bakedZ);
  for (const h of G.hurdles) drawHurdle(h);
  drawAthlete();
  const windT = STILL ? 0 : Math.floor(G.time * WIND_FPS) / WIND_FPS;
  drawLeaves(windT);
  drawTufts(windT);
  flushShadows();
  applyShadows(bakedZ);
  shadeEdges();
  drawCues();
  for (const p of G.popups) {
    if (p.t > .9 && Math.floor(p.t * 14) % 2) continue;
    const q = project(p.x, 0, 2.4);
    drawText(p.text, q.sx, Math.round(q.sy - p.t * 10), SIGNAL, 3);
  }
  ctx.putImageData(image, 0, 0);
}

function drawCues() {
  const A = G.A, blink = Math.floor(G.time * 4) % 2;
  if (G.phase === 'ready') {
    const q = project(A.x, 0, 2.6);
    if (blink) drawText('TAP', q.sx, q.sy - 14, SIGNAL, 3);
    return;
  }
  if (G.phase !== 'run') return;
  const h = nextHurdle();
  if (!h) return;
  // a marker over the next hurdle: coral while waiting, green when it is time to tap
  const now = inWindow(), q = project(h.x, 0, 1.6), c = now ? rgb(84, 190, 110) : SIGNAL;
  const bob = Math.round(Math.sin(G.time * 8) * 2);
  for (let r = -1; r < 9; r++) for (let k = -8 + r; k <= 8 - r; k++) dot(Math.round(q.sx) + k, Math.round(q.sy) + r - 14 + bob, r < 0 || k === -8 + r || k === 8 - r ? INK : c);
  if (now) { const p = project(A.x, 0, 2.6); drawText('TAP', p.sx, p.sy - 14, rgb(84, 190, 110), 3); }
}

/* ================= pixel text ================= */
const FONT = {
  '0': ['XXX', 'X.X', 'X.X', 'X.X', 'XXX'], '1': ['.X.', 'XX.', '.X.', '.X.', 'XXX'], '2': ['XXX', '..X', 'XXX', 'X..', 'XXX'],
  '3': ['XXX', '..X', '.XX', '..X', 'XXX'], '4': ['X.X', 'X.X', 'XXX', '..X', '..X'], '5': ['XXX', 'X..', 'XXX', '..X', 'XXX'],
  '6': ['XXX', 'X..', 'XXX', 'X.X', 'XXX'], '7': ['XXX', '..X', '.X.', '.X.', '.X.'], '8': ['XXX', 'X.X', 'XXX', 'X.X', 'XXX'],
  '9': ['XXX', 'X.X', 'XXX', '..X', 'XXX'], '.': ['...', '...', '...', '...', '.X.'], '+': ['...', '.X.', 'XXX', '.X.', '...'],
  'X': ['X.X', 'X.X', '.X.', 'X.X', 'X.X'], 'T': ['XXX', '.X.', '.X.', '.X.', '.X.'], 'A': ['XXX', 'X.X', 'XXX', 'X.X', 'X.X'],
  'P': ['XXX', 'X.X', 'XXX', 'X..', 'X..'],
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
  nodes.pts.textContent = runTime().toFixed(2);
  let h = '';
  for (let k = 0; k < RUNS; k++) {
    const t = G.times[k];
    h += '<span class="' + (t !== undefined ? 'done' : k === G.run && G.phase !== 'over' ? 'now' : '') + '">' + (t !== undefined ? t.toFixed(2) : '—') + '</span>';
  }
  nodes.runs.innerHTML = h;
  nodes.best.textContent = G.best ? 'best ' + G.best.toFixed(2) + ' s' : '';
}
let statusText = '';
function setStatus(text) { if (text !== statusText) { statusText = text; nodes.status.textContent = text; } }

/* ================= input ================= */
const stage = document.getElementById('stage'), rules = document.getElementById('rules');
function press() {
  ensureAudio();
  if (G.phase === 'over') { if (G.phaseT > .6) reset(); return; }
  if (G.phase === 'ready') { setPhase('run'); G.jump = null; setStatus('tap when the marker turns green'); return; }
  if (G.phase === 'run') jumpAt();
}
stage.addEventListener('pointerdown', e => { if (e.button > 0) return; try { stage.setPointerCapture(e.pointerId); } catch (err) { /* older browsers */ } canvas.focus({ preventScroll: true }); press(); });
addEventListener('keydown', e => {
  if (rules.open || (e.key !== ' ' && e.key !== 'Enter' && e.key !== 'ArrowUp')) return;
  e.preventDefault();
  if (!e.repeat) press();
});
document.getElementById('rules-open').addEventListener('click', () => rules.showModal());
rules.addEventListener('click', e => { if (e.target === rules) rules.close(); });
rules.addEventListener('close', () => canvas.focus({ preventScroll: true }));

/* ================= sound ================= */
function sound(kind) {
  if (!audio || muted) return;
  if (kind === 'jump') { tone(260, 520, .16, .1, 'triangle'); hiss(.12, 1800, .6, .06); }
  else if (kind === 'perfect') { tone(660, 990, .14, .07, 'triangle'); }
  else if (kind === 'clip') { tone(300, 120, .18, .12, 'square'); hiss(.12, 900, .7, .1); }
  else if (kind === 'finish') { tone(523, 523, .1, .05, 'triangle'); tone(784, 784, .2, .05, 'triangle', .1); }
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
window.__hurdles = { G, update, draw, press, jumpAt, inWindow };
