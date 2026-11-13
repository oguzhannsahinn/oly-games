/* ================= the rifle range ================= */
const X_T = -6.6, BALLOON_TIME = 40, RELOAD = .4, STEADY_T = .6, SHAKE_T = 1.5;
const BACKSTOP = { x0: X_T - 1.75, x1: X_T - .95, y0: -3.15, y1: 3.15, z0: 0, z1: 1.46 };
const SOCKS = [[-3.3, -3.7, 3.1], [1.9, 3.8, 2.6]];
const ARCHER = [6.25, .45];
const LINE_X = 5.45, LANE_Y = 2.6;
const ISLAND = { cx: -.4, ax: 9.5, ay: 6.1 };
const KIND_LAWN = 4;
const LAWN_A = [94, 130, 62], LAWN_B = [108, 144, 70], CHALK = [242, 240, 228];
const PLANK = [150, 108, 70], STRAW = [206, 168, 90], WOOD = [118, 82, 52], C_POLE = [70, 74, 86];
const STOCK = [92, 62, 40], METAL = [58, 62, 72], SIGHT = [40, 42, 50];
const BALLOON_C = [[216, 58, 62], [64, 118, 206], [84, 166, 90], [150, 94, 196]], GOLD = [242, 190, 48];
const SHOOTER_PAL = { jersey: [54, 84, 128], shorts: [74, 68, 62], shin: [74, 68, 62], sock: [74, 68, 62], sleeve: [54, 84, 128], skin: [214, 164, 124], hair: [70, 48, 34], shoe: [46, 44, 52] };

const LX = -.246, LY = .532, LZ = .81;
function litLevel(nx, ny, nz) { return clamp(Math.floor(((nx * LX + ny * LY + nz * LZ) * .5 + .5) * 4.3 + .2), 1, 4); }
function pick(tones, v, ix, iy, dither = .6) { return tones[clamp(Math.floor(v * 4 + (bayerAt(ix, iy) - .5) * dither), 0, 3)]; }
function islandEdge(x, y) { return Math.pow(Math.pow(Math.abs(x - ISLAND.cx) / ISLAND.ax, 4) + Math.pow(Math.abs(y) / ISLAND.ay, 4), .25); }
const onIsland = (x, y) => islandEdge(x, y) < .97;
const inBox = (p, b) => p[0] >= b.x0 && p[0] <= b.x1 && p[1] >= b.y0 && p[1] <= b.y1 && p[2] >= b.z0 && p[2] <= b.z1;
const norm3 = v => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };

function groundColor(x, y, ix, iy, i) {
  const edge = islandEdge(x, y), rough = edge + (noise(x * 1.3, y * 1.3) - .5) * .12;
  if (rough > 1.04) return 0;
  if (rough > .93 && hash(ix, iy) < (rough - .93) / .11) return 0;
  const fine = hash(ix, iy), ay = Math.abs(y);
  if (ay < LANE_Y && x > X_T - 2.3 && x < LINE_X + 1.7) {
    kinds[i] = KIND_LAWN;
    if (Math.abs(x - LINE_X) < .07) return rgb(...CHALK);
    const stripe = Math.floor((LINE_X - x) / 1.25) & 1;
    return pick(tonesOf(stripe ? LAWN_A : LAWN_B), .5 + (noise(x * .7, y * .7) - .5) * .4, ix, iy, .35);
  }
  kinds[i] = KIND_GRASS;
  const t = noise(x * .9, y * .9) * 1.15 + (fine - .5) * .55 - .08;
  return rgb(...GRASS[clamp(Math.floor(t * 4.2), 0, 3)]);
}
function bales(b, rows) {
  const len = 1.02;
  for (let r = 0; r < rows; r++) {
    const z0 = r * .72, shift = r % 2 ? len / 2 : 0;
    for (let y = b.y0 - shift; y < b.y1 - .2; y += len) {
      const y0 = Math.max(b.y0, y) + .05, y1 = Math.min(b.y1, y + len - .07);
      if (y1 - y0 < .3) continue;
      box(b.x0, y0, z0, b.x1, y1, z0 + .7, STRAW, y * 3 + r);
      const twine = rampOf(STRAW)[1];
      for (const f of [.28, .72]) {
        const yt = lerp(y0, y1, f);
        for (let x = b.x0; x <= b.x1; x += .02) plot(x, yt, z0 + .705, twine);
        for (let z = z0; z <= z0 + .7; z += .02) plot(b.x1 + .005, yt, z, twine);
      }
      for (let yy = y0; yy <= y1; yy += .2) for (let x = b.x0; x <= b.x1; x += .25) castShadow(x, yy, z0 + .6, .2);
    }
  }
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
  box(5.7, -.35, 0, 6.85, 1.3, .07, PLANK, 2);
  bales(BACKSTOP, 2);
  for (const [x, y, h] of SOCKS) {
    capsule([x, y, 0], [x, y, h], .05, .045, () => C_POLE, 'solid');
    for (let z = 0; z <= h; z += .12) castShadow(x, y, z, .06);
  }
  // a crate of spare ammunition beside the mat
  box(6.9, 1.6, 0, 7.5, 2.2, .5, WOOD, 9);
  castShadow(7.2, 1.9, .3, .5);
  growTree(-8.65, 3.55, .9, 440, 0);
  growTree(.9, -5.05, .74, 320, 77);
  growTree(7.45, -4.15, .6, 260, 150);
  bakeOcclusion();
  staticShadow.set(shadowMask);
  applyShadows(groundZ);
  bakedPix.set(pix);
  bakedZ.set(zb);
}

function drawSock([x, y, h]) {
  const w = G.wind, sg = w >= 0 ? 1 : -1, lift = Math.min(1, Math.abs(w) / 4.5);
  for (let k = 0; k < 8; k++) {
    const t = k / 7, flap = Math.sin(G.time * 9 - k * .9) * .04 * (.3 + lift);
    const p = [x + flap, y + sg * (.1 + t * .95) * (.35 + .65 * lift), h - .1 - t * t * .55 * (1 - lift) - t * .08 + flap];
    sphere(p[0], p[1], p[2], .15 - t * .06, [[226, 84, 52], [244, 240, 230]][(k >> 1) & 1], 'solid');
    if (k % 2 === 0) castShadow(p[0], p[1], p[2], .12, 1, 0);
  }
}

/* ================= balloons ================= */
function spawnBalloon() {
  const gold = Math.random() < .13;
  G.balloons.push({
    p: [X_T, (Math.random() * 2 - 1) * 3.7, .15], r: gold ? .3 : .42, gold,
    c: gold ? GOLD : BALLOON_C[Math.random() * BALLOON_C.length | 0],
    vz: gold ? 1.25 + Math.random() * .35 : .6 + Math.random() * .5, ph: Math.random() * 6.28, t: 0, popped: false,
  });
}
function stepBalloons(dt) {
  if (!G.timeUp && G.running) {
    G.spawnT -= dt;
    if (G.spawnT <= 0) { spawnBalloon(); G.spawnT = .55 + Math.random() * .5; }
  }
  for (const b of G.balloons) {
    b.t += dt;
    b.p[2] += b.vz * dt;
    b.p[1] = clamp(b.p[1] + (Math.sin(b.t * 1.7 + b.ph) * .35 + G.wind * .12) * dt, -4.6, 4.6);
  }
  G.balloons = G.balloons.filter(b => !b.popped && b.p[2] < 6);
}
function drawBalloon(b) {
  sphere(b.p[0], b.p[1], b.p[2], b.r, b.c, 'gloss');
  sphere(b.p[0], b.p[1], b.p[2] - b.r - .03, .06, b.c, 'solid');
  const str = rgb(84, 82, 92);
  for (let s = 0; s <= 1; s += .04) plot(b.p[0], b.p[1] + Math.sin(b.t * 3 + s * 5 + b.ph) * .05 * s, b.p[2] - b.r - .06 - s * .75, str);
  castShadow(b.p[0], b.p[1], b.p[2], b.r * .9, 1, 0);
}
// a balloon is hit when the sight lies on it as the camera shows it
function hitBalloon() {
  const s = [G.aim[0] + G.sway[0], G.aim[1] + G.sway[1]];
  let best = null, bd = 1e9;
  for (const b of G.balloons) {
    if (b.popped) continue;
    const p = project(b.p[0], b.p[1], b.p[2]), d = Math.hypot(p.sx - s[0], p.sy - s[1]), reach = b.r * S * 1.15 + 3;
    if (d < reach && d < bd) { best = b; bd = d; }
  }
  return best;
}
function popBalloon(b) {
  b.popped = true;
  const pts = b.gold ? 3 : 1;
  G.score += pts; G.hitsN++;
  const p = project(b.p[0], b.p[1], b.p[2]);
  for (let k = 0; k < 14; k++) {
    const a = k / 14 * 6.283 + Math.random() * .3, sp = 30 + Math.random() * 40;
    G.particles.push({ x: p.sx, y: p.sy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 20, life: .45, c: rampOf(b.c)[3 + (k & 1)] });
  }
  G.popups.push({ text: '+' + pts, x: p.sx, y: p.sy - 14, t: 0, gold: b.gold });
  sound('pop');
  if (b.gold) sound('score');
  setStatus(b.gold ? 'gold balloon, 3 points' : G.hitsN % 10 === 0 ? G.hitsN + ' popped' : G.hitsN + ' popped · hold to steady, let go to fire');
  renderHud();
}

/* ================= the shooter and the rifle ================= */
// the rifle follows the sight; the body turns to face it
function shooterFrame() {
  const A = aimPoint(), px = ARCHER[0], py = ARCHER[1];
  const yaw = Math.atan2(A[1] - py, A[0] - px), fx = Math.cos(yaw), fy = Math.sin(yaw);
  const fr = body(.05, .03);
  const sh = [px + fx * fr.shA - fy * .3, py + fy * fr.shA + fx * .3, fr.shZ - .04];
  const dir = norm3([A[0] - sh[0], A[1] - sh[1], A[2] - sh[2]]);
  return { px, py, yaw, fx, fy, sh, dir, A };
}
function drawShooter() {
  const f = shooterFrame(), { px, py, fx, fy, sh, dir } = f;
  const local = w => [(w[0] - px) * fx + (w[1] - py) * fy, -(w[0] - px) * fy + (w[1] - py) * fx, w[2]];
  const grip = [sh[0] + dir[0] * .08, sh[1] + dir[1] * .08, sh[2] + dir[2] * .08 - .05];
  const fore = [sh[0] + dir[0] * .62, sh[1] + dir[1] * .62, sh[2] + dir[2] * .62 - .12];
  // the kick of the last shot
  const kick = G.phase === 'reload' ? Math.max(0, 1 - G.phaseT / .18) * .05 : 0;
  player(px, py, f.yaw, { crouch: .05, lean: .03, hR: local([grip[0], grip[1], grip[2] + kick]), hL: local(fore), footR: [.28, 0], footL: [-.3, 0] }, SHOOTER_PAL);
  const muzzle = [sh[0] + dir[0] * 1.1, sh[1] + dir[1] * 1.1, sh[2] + dir[2] * 1.1 - kick];
  capsule([sh[0] - dir[0] * .32, sh[1] - dir[1] * .32, sh[2] - dir[2] * .32 + .04], [sh[0] + dir[0] * .1, sh[1] + dir[1] * .1, sh[2] + dir[2] * .1], .08, .06, () => STOCK, 'solid');
  capsule([sh[0] + dir[0] * .1, sh[1] + dir[1] * .1, sh[2] + dir[2] * .1 - kick], muzzle, .04, .03, () => METAL, 'solid');
  capsule([sh[0] + dir[0] * .3, sh[1] + dir[1] * .3, sh[2] + dir[2] * .3 - kick + .07], [sh[0] + dir[0] * .6, sh[1] + dir[1] * .6, sh[2] + dir[2] * .6 - kick + .07], .035, .035, () => SIGHT, 'solid');
  G.muzzle = muzzle;
}

/* ================= arrows-of-light and overlays ================= */
const FONT = {
  '+': ['...', '.X.', 'XXX', '.X.', '...'], '0': ['XXX', 'X.X', 'X.X', 'X.X', 'XXX'], '1': ['.X.', 'XX.', '.X.', '.X.', 'XXX'],
  '2': ['XXX', '..X', 'XXX', 'X..', 'XXX'], '3': ['XXX', '..X', '.XX', '..X', 'XXX'], '4': ['X.X', 'X.X', 'XXX', '..X', '..X'],
  '5': ['XXX', 'X..', 'XXX', '..X', 'XXX'], '6': ['XXX', 'X..', 'XXX', 'X.X', 'XXX'], '7': ['XXX', '..X', '.X.', '.X.', '.X.'],
  '8': ['XXX', 'X.X', 'XXX', 'X.X', 'XXX'], '9': ['XXX', 'X.X', 'XXX', '..X', 'XXX'],
};
function drawText(text, cx, top, fill, k = 2) {
  const cells = [];
  let x = Math.round(cx - (text.length * 4 - 1) * k / 2);
  for (const ch of text) {
    const g = FONT[ch];
    if (g) g.forEach((row, yy) => [...row].forEach((v, xx) => {
      if (v === 'X') for (let a = 0; a < k; a++) for (let b = 0; b < k; b++) cells.push([x + xx * k + a, top + yy * k + b]);
    }));
    x += 4 * k;
  }
  for (const [px, py] of cells) for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) dot(px + ox, py + oy, INK);
  for (const [px, py] of cells) dot(px, py, fill);
}
// the sight: a crosshair that moves with the breath, and a bar for how long the breath has been held
function drawReticle() {
  if (G.phase === 'over') return;
  const x = Math.round(G.aim[0] + G.sway[0]), y = Math.round(G.aim[1] + G.sway[1]);
  const arms = [];
  for (let k = 3; k <= 7; k++) arms.push([x + k, y], [x - k, y], [x, y + k], [x, y - k]);
  for (const [a, b] of arms) for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) dot(a + ox, b + oy, PAPER);
  const steady = G.pressing && G.holdT >= STEADY_T && G.holdT < SHAKE_T;
  for (const [a, b] of arms) dot(a, b, steady ? SIGNAL : INK);
  dot(x, y, steady ? SIGNAL : INK);
  if (G.pressing) {
    const w = 21, x0 = x - 10, yb = y + 11, v = clamp(G.holdT / SHAKE_T, 0, 1);
    for (let yy = yb - 1; yy <= yb + 3; yy++) for (let xx = x0 - 2; xx <= x0 + w + 1; xx++) dot(xx, yy, PAPER);
    for (let yy = yb; yy <= yb + 2; yy++) for (let xx = x0 - 1; xx <= x0 + w; xx++) dot(xx, yy, INK);
    const fill = Math.round(v * w);
    for (let xx = x0; xx < x0 + w; xx++) {
      const u = (xx - x0) / w, c = u < STEADY_T / SHAKE_T ? rgb(150, 150, 160) : u < 1 ? rgb(86, 178, 96) : rgb(230, 120, 100);
      dot(xx, yb + 1, xx - x0 < fill ? c : rgb(110, 106, 104));
    }
  }
}
function drawTracer() {
  if (!G.tracer || G.tracer.t > .12 || !G.muzzleS) return;
  const a = G.muzzleS, b = G.tracer.to;
  for (let k = 0; k <= 24; k++) {
    const t = k / 24, x = Math.round(lerp(a[0], b[0], t)), y = Math.round(lerp(a[1], b[1], t));
    dot(x, y, k % 3 ? PAPER : SIGNAL);
  }
}
function drawParticles() {
  for (const p of G.particles) {
    const x = Math.round(p.x), y = Math.round(p.y);
    dot(x, y, p.c); dot(x + 1, y, p.c);
  }
}
function drawPopups() {
  for (const p of G.popups) {
    if (p.t > .8 && Math.floor(p.t * 14) % 2) continue;
    drawText(p.text, p.x, Math.round(p.y - p.t * 16), p.gold ? rgb(255, 176, 40) : SIGNAL);
  }
}

/* ================= game state ================= */
const BEST_KEY = 'shooting-best';
function loadBest() { try { return +localStorage.getItem(BEST_KEY) || 0; } catch (e) { return 0; } }
function saveBest(v) { try { localStorage.setItem(BEST_KEY, String(v)); } catch (e) { /* storage may be off */ } }
const G = { time: 0, aim: [0, 0], sway: [0, 0], wind: 0, keys: {} };
const targetScreen = () => { const p = project(X_T, 0, 1.6); return [p.sx, p.sy]; };
const aimPoint = () => planePoint(G.aim[0] + G.sway[0], G.aim[1] + G.sway[1]);
function planePoint(sx, sy) {
  const u = (sx - OX) / S, y = X_T - u * R2, v = (X_T + y) / R2;
  return [X_T, y, (v * SIN - (sy - OY) / S) / COS];
}
function reset() {
  Object.assign(G, {
    phase: 'ready', phaseT: 0, score: 0, shots: 0, hitsN: 0, balloons: [], particles: [], popups: [], tracer: null,
    clock: BALLOON_TIME, running: false, timeUp: false, started: false, spawnT: .2, windT: 8, lastTick: 99,
    pressing: false, holdT: 0, cool: 0, best: loadBest(), newBest: false,
  });
  if (!G.aimed) G.aim = targetScreen();
  newWind(true);
  setStatus('press and hold to steady your breath, let go to fire');
  hideOver();
  renderHud();
}
function newWind(now) {
  const v = Math.round((Math.random() * 2 - 1) * 45) / 10;
  G.windTarget = Math.abs(v) < .4 ? 0 : v;
  if (now) G.wind = G.windTarget;
}

/* ================= update ================= */
function fire() {
  G.shots++;
  const hit = hitBalloon();
  G.tracer = { t: 0, to: G.muzzle ? [clamp(G.aim[0] + G.sway[0], 0, W - 1), clamp(G.aim[1] + G.sway[1], 0, H - 1)] : [0, 0] };
  G.muzzleS = G.muzzle ? (() => { const p = project(G.muzzle[0], G.muzzle[1], G.muzzle[2]); return [p.sx, p.sy]; })() : null;
  sound('shot');
  G.cool = RELOAD;
  setPhase('reload');
  if (hit) popBalloon(hit);
  else { G.misses = (G.misses || 0) + 1; setStatus(G.holdT < STEADY_T ? 'snap shot, missed · hold longer to steady' : 'missed'); }
  G.lastShotHolding = G.holdT;
  renderHud();
}
function setPhase(p) { G.phase = p; G.phaseT = 0; }
function update(dt) {
  G.time += dt; G.phaseT += dt;
  G.wind += (G.windTarget - G.wind) * Math.min(1, dt * 4);
  G.windT -= dt;
  if (G.windT <= 0) { newWind(false); G.windT = 8; renderHud(); }
  if (G.running) {
    G.clock -= dt;
    const left = Math.ceil(G.clock);
    if (left <= 5 && left < G.lastTick && left > 0) { G.lastTick = left; sound('tick'); }
    if (G.clock <= 0) { G.clock = 0; G.running = false; G.timeUp = true; sound('buzzer'); finish(); }
  }
  if (G.pressing) G.holdT += dt;
  G.cool = Math.max(0, G.cool - dt);
  if (G.phase === 'reload' && G.cool <= 0) setPhase('ready');
  // breath: held steady for a moment, then the arm starts to shake
  const t = G.time;
  const amp = G.pressing ? (G.holdT < STEADY_T ? lerp(2.2, .35, G.holdT / STEADY_T) : .35 + Math.max(0, G.holdT - SHAKE_T) * 3.4) : 2.2;
  const tx = (Math.sin(t * 1.3) + .4 * Math.sin(t * 3.7)) * amp, ty = (Math.cos(t * 1.1) * .8 + .3 * Math.sin(t * 4.3)) * amp;
  G.sway[0] += (tx - G.sway[0]) * Math.min(1, dt * 8);
  G.sway[1] += (ty - G.sway[1]) * Math.min(1, dt * 8);
  const k = G.keys, sp = 70 * dt;
  G.aim[0] = clamp(G.aim[0] + ((k.ArrowRight ? 1 : 0) - (k.ArrowLeft ? 1 : 0)) * sp, 0, W - 1);
  G.aim[1] = clamp(G.aim[1] + ((k.ArrowDown ? 1 : 0) - (k.ArrowUp ? 1 : 0)) * sp, 0, H - 1);
  stepBalloons(dt);
  if (G.tracer) G.tracer.t += dt;
  for (const p of G.particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 120 * dt; p.life -= dt; }
  G.particles = G.particles.filter(p => p.life > 0);
  for (const p of G.popups) p.t += dt;
  G.popups = G.popups.filter(p => p.t < 1.1);
  renderClock();
}
function finish() {
  setPhase('over');
  G.newBest = G.score > G.best;
  if (G.newBest) { G.best = G.score; saveBest(G.score); }
  setStatus(G.newBest ? 'new best: ' + G.score + ' · tap to play again' : 'time · ' + G.score + ' points · best ' + G.best + ' · tap to play again');
  showOver('Time!', G.score + ' points' + (G.newBest ? ' · new best' : ' · best ' + G.best));
  renderHud();
}

/* ================= draw ================= */
function draw() {
  pix.set(bakedPix);
  zb.set(bakedZ);
  drawShooter();
  for (const b of G.balloons) drawBalloon(b);
  for (const s of SOCKS) drawSock(s);
  const windT = STILL ? 0 : Math.floor(G.time * WIND_FPS) / WIND_FPS;
  drawLeaves(windT);
  drawTufts(windT);
  flushShadows();
  applyShadows(bakedZ);
  shadeEdges();
  drawParticles();
  drawTracer();
  drawPopups();
  drawReticle();
  ctx.putImageData(image, 0, 0);
}

/* ================= hud ================= */
const nodes = {
  pts: document.getElementById('pts'), sub: document.getElementById('sub'), best: document.getElementById('best'),
  wind: document.getElementById('wind'), clock: document.getElementById('clock'), status: document.getElementById('status'),
};
function renderHud() {
  nodes.pts.textContent = G.score;
  nodes.sub.textContent = G.hitsN + ' of ' + G.shots + ' hit';
  nodes.best.textContent = G.best ? 'best ' + G.best : '';
  const w = G.windTarget;
  nodes.wind.textContent = !w ? 'wind calm' : 'wind ' + (w > 0 ? '←' : '→') + ' ' + Math.abs(w).toFixed(1);
}
let shownClock = '';
function renderClock() {
  const c = G.clock, text = c >= 10 ? String(Math.ceil(c)) : c.toFixed(1);
  if (text !== shownClock) { shownClock = text; nodes.clock.textContent = text; }
  nodes.clock.classList.toggle('low', c < 10 && G.started);
}
let statusText = '';
function setStatus(text) { if (text !== statusText) { statusText = text; nodes.status.textContent = text; } }

/* ================= input ================= */
const stage = document.getElementById('stage'), rules = document.getElementById('rules');
function toCanvas(e) {
  const r = canvas.getBoundingClientRect();
  return [clamp((e.clientX - r.left) * W / r.width, 0, W - 1), clamp((e.clientY - r.top) * H / r.height, 0, H - 1)];
}
function press() {
  ensureAudio();
  if (G.phase === 'over') { if (G.phaseT > .6) reset(); return; }
  if (G.timeUp) return;
  if (!G.started) { G.started = true; G.running = true; setStatus('hold to steady your breath, let go to fire'); }
  if (G.pressing) return;
  G.pressing = true;
  G.holdT = 0;
}
function letGo() {
  if (!G.pressing) return;
  G.pressing = false;
  if (G.cool > 0 || G.timeUp) { G.holdT = 0; return; }
  fire();
  G.holdT = 0;
}
let touch = null;
stage.addEventListener('pointerdown', e => {
  if (e.button > 0) return;
  try { stage.setPointerCapture(e.pointerId); } catch (err) { /* older browsers */ }
  canvas.focus({ preventScroll: true });
  if (e.pointerType === 'mouse') { G.aim = toCanvas(e); G.aimed = true; }
  else touch = { x: e.clientX, y: e.clientY, aim: G.aim.slice() };
  press();
});
stage.addEventListener('pointermove', e => {
  if (e.pointerType === 'mouse') { if (e.clientX || e.clientY) { G.aim = toCanvas(e); G.aimed = true; } return; }
  if (!touch) return;
  const r = canvas.getBoundingClientRect(), k = W / r.width * 1.1;
  G.aim = [clamp(touch.aim[0] + (e.clientX - touch.x) * k, 0, W - 1), clamp(touch.aim[1] + (e.clientY - touch.y) * k, 0, H - 1)];
  G.aimed = true;
});
// a synthetic move at the page corner on load would yank the sight away
addEventListener('pointermove', e => { if (e.pointerType === 'mouse' && e.target !== stage && !rules.open && (e.clientX || e.clientY)) { G.aim = toCanvas(e); G.aimed = true; } });
stage.addEventListener('pointerup', () => { touch = null; letGo(); });
stage.addEventListener('pointercancel', () => { touch = null; G.pressing = false; G.holdT = 0; });
addEventListener('keydown', e => {
  if (rules.open) return;
  if (e.key.startsWith('Arrow')) { G.keys[e.key] = true; G.aimed = true; e.preventDefault(); return; }
  if (e.key !== ' ' && e.key !== 'Enter') return;
  if (e.target.tagName === 'BUTTON') return;
  e.preventDefault();
  if (!e.repeat) press();
});
addEventListener('keyup', e => {
  if (e.key.startsWith('Arrow')) G.keys[e.key] = false;
  if (e.key === ' ' || e.key === 'Enter') letGo();
});
addEventListener('blur', () => { G.pressing = false; G.holdT = 0; G.keys = {}; });
document.getElementById('rules-open').addEventListener('click', () => rules.showModal());
rules.addEventListener('click', e => { if (e.target === rules) rules.close(); });
rules.addEventListener('close', () => canvas.focus({ preventScroll: true }));

/* ================= sound ================= */
function sound(kind) {
  if (!audio || muted) return;
  if (kind === 'shot') { hiss(.3, 1500, .6, .22); tone(190, 55, .2, .3, 'sawtooth'); }
  else if (kind === 'pop') { hiss(.07, 2200, .6, .3); tone(900, 260, .06, .05, 'square'); }
  else if (kind === 'score') { tone(660, 660, .1, .05, 'triangle'); tone(990, 990, .14, .05, 'triangle', .08); }
  else if (kind === 'tick') tone(1100, 1100, .05, .04, 'square');
  else if (kind === 'buzzer') { tone(170, 165, .8, .09, 'sawtooth'); tone(173, 168, .8, .07, 'square'); }
}
const muteButton = document.getElementById('mute');
muteButton.addEventListener('click', () => {
  muteButton.blur();
  muted = !muted;
  muteButton.textContent = muted ? 'sound off' : 'sound on';
  muteButton.setAttribute('aria-pressed', String(muted));
});

/* ================= boot ================= */
addEventListener('resize', fit);
fit();
bake();
reset();
let last = performance.now();
function frame(now) {
  update(Math.min(.04, (now - last) / 1000));
  last = now;
  draw();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
window.__shoot = { G, update, draw, press, letGo, fire, planePoint, project, hitBalloon, spawnBalloon };
