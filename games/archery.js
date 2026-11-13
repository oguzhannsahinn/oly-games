/* ================= the range ================= */
const GRAV = 9, ARROW_LEN = .9;
const X_T = -6.6, T_Z = 1.6, T_R = 1.2, BOSS_D = .34;
const ARCHER = [6.25, .45];
const LINE_X = 5.45, LANE_Y = 2.6;
const ISLAND = { cx: -.4, ax: 9.5, ay: 6.1 };
const BACKSTOP = { x0: X_T - 1.75, x1: X_T - .95, y0: -3.15, y1: 3.15, z0: 0, z1: 1.46 };
const SOCKS = [[-3.3, -3.7, 3.1], [1.9, 3.8, 2.6]];
const ARROWS_PER_ROUND = 10, NOCK_T = .45, FULL_DRAW = .6;
const KIND_LAWN = 4;

const LAWN_A = [94, 130, 62], LAWN_B = [108, 144, 70], CHALK = [242, 240, 228];
const PLANK = [150, 108, 70], STRAW = [206, 168, 90], WOOD = [118, 82, 52], C_POLE = [70, 74, 86];
const RING = [[238, 234, 224], [46, 46, 54], [62, 136, 198], [210, 60, 50], [242, 196, 58]];
const BOW_C = [96, 62, 40], QUIVER = [116, 72, 44], BUCKET = [58, 92, 72];
const SHAFT = rgb(222, 196, 148), TIP = rgb(70, 72, 80), FLETCH = [rgb(214, 62, 52), rgb(244, 240, 230)];
const STRING = rgb(236, 232, 220);
const SOCK_C = [[226, 84, 52], [244, 240, 230]];
const ARCHER_PAL = { jersey: [54, 84, 128], shorts: [74, 68, 62], shin: [74, 68, 62], sock: [74, 68, 62], sleeve: [54, 84, 128], skin: [214, 164, 124], hair: [70, 48, 34], shoe: [46, 44, 52] };

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
    // mowing stripes run across the lane, one per stride
    const stripe = Math.floor((LINE_X - x) / 1.25) & 1;
    return pick(tonesOf(stripe ? LAWN_A : LAWN_B), .5 + (noise(x * .7, y * .7) - .5) * .4, ix, iy, .35);
  }
  kinds[i] = KIND_GRASS;
  const t = noise(x * .9, y * .9) * 1.15 + (fine - .5) * .55 - .08;
  return rgb(...GRASS[clamp(Math.floor(t * 4.2), 0, 3)]);
}
function ringOf(d) { return d > 1 ? -1 : Math.min(9, Math.floor(d * 10)); }
function ringColor(d) {
  const ring = ringOf(d);
  if (ring < 0) return rampOf(STRAW)[3];
  const band = 4 - (ring >> 1), c = rampOf(RING[band]);
  return d * 10 - Math.floor(d * 10) > .84 ? (band === 1 ? c[4] : c[1]) : c[3];
}
const ringScore = d => d > 1.03 ? 0 : 10 - Math.min(9, Math.floor(Math.min(d, .999) * 10));
function bales(b, rows) {
  const len = 1.02;
  for (let r = 0; r < rows; r++) {
    const z0 = r * .72, shift = r % 2 ? len / 2 : 0;
    for (let y = b.y0 - shift; y < b.y1 - .2; y += len) {
      const y0 = Math.max(b.y0, y) + .05, y1 = Math.min(b.y1, y + len - .07);
      if (y1 - y0 < .3) continue;
      box(b.x0, y0, z0, b.x1, y1, z0 + .7, STRAW, y * 3 + r);
      // two bands of twine round each bale
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
function drawTarget() {
  const step = .5 / S, wood = () => WOOD;
  for (const sg of [-1, 1]) capsule([X_T - .12, sg * .85, 0], [X_T - .26, sg * .6, T_Z + .95], .06, .05, wood, 'solid');
  capsule([X_T - 1.05, 0, 0], [X_T - .32, 0, T_Z + .95], .06, .05, wood, 'solid');
  const straw = rampOf(STRAW);
  for (let a = 0; a < 6.2832; a += .01) {
    const ca = Math.cos(a), sa = Math.sin(a), c = straw[litLevel(0, ca, sa)];
    for (let x = X_T - BOSS_D; x <= X_T; x += step) plot(x, ca * (T_R + .04), T_Z + sa * (T_R + .04), c);
  }
  for (let y = -T_R - .04; y <= T_R + .04; y += step) for (let z = -T_R - .04; z <= T_R + .04; z += step) {
    const d = Math.hypot(y, z);
    if (d <= T_R + .04) plot(X_T, y, T_Z + z, ringColor(d / T_R));
  }
  for (let y = -T_R; y <= T_R; y += .15) for (let z = -T_R; z <= T_R; z += .15) if (Math.hypot(y, z) < T_R) castShadow(X_T - .17, y, T_Z + z, .14);
  for (let z = 0; z <= T_Z + .9; z += .15) { castShadow(X_T - .2, .75, z, .06); castShadow(X_T - .2, -.75, z, .06); }
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
  // the shooting mat
  box(5.7, -.35, 0, 6.85, 1.3, .07, PLANK, 2);
  bales(BACKSTOP, 2);
  drawTarget();
  for (const [x, y, h] of SOCKS) {
    capsule([x, y, 0], [x, y, h], .05, .045, () => C_POLE, 'solid');
    for (let z = 0; z <= h; z += .12) castShadow(x, y, z, .06);
  }
  // a bucket of spare arrows beside the mat
  capsule([7.05, 1.95, 0], [7.05, 1.95, .42], .2, .22, () => BUCKET, 'solid');
  castShadow(7.05, 1.95, .2, .24);
  for (let k = 0; k < 5; k++) {
    const a = k * 1.26, top = [7.05 + Math.cos(a) * .1, 1.95 + Math.sin(a) * .1, 1.05 + (k % 2) * .06];
    drawShaft([7.05 + Math.cos(a) * .05, 1.95 + Math.sin(a) * .05, .3], norm3([top[0] - 7.05, top[1] - 1.95, top[2] - .3]).map(v => -v), true, top);
  }
  growTree(-8.65, 3.55, .9, 440, 0);
  growTree(.9, -5.05, .74, 320, 77);
  growTree(7.45, -4.15, .6, 260, 150);
  bakeOcclusion();
  staticShadow.set(shadowMask);
  applyShadows(groundZ);
  bakedPix.set(pix);
  bakedZ.set(zb);
}

/* ================= arrows ================= */
// tip first; dir points along flight, so the shaft trails back from the tip
function drawShaft(tip, dir, still, tail) {
  const back = tail ? norm3([tail[0] - tip[0], tail[1] - tip[1], tail[2] - tip[2]]) : [-dir[0], -dir[1], -dir[2]];
  const n = Math.ceil(ARROW_LEN * S * 1.6);
  const side = norm3([-back[1], back[0], 0]);
  for (let k = 0; k <= n; k++) {
    const t = k / n, x = tip[0] + back[0] * ARROW_LEN * t, y = tip[1] + back[1] * ARROW_LEN * t, z = tip[2] + back[2] * ARROW_LEN * t;
    if (t > .8) {
      const c = FLETCH[(k >> 1) & 1];
      for (const w of [-.05, 0, .05]) plot(x + side[0] * w, y + side[1] * w, z + .03, c);
      plot(x, y, z - .02, c);
      continue;
    }
    const c = t < .07 ? TIP : SHAFT;
    plot(x, y, z, c);
    plot(x, y, z - .03, c);
  }
  if (!still) for (const t of [.2, .5, .8]) castShadow(tip[0] + back[0] * t * ARROW_LEN, tip[1] + back[1] * t * ARROW_LEN, tip[2] + back[2] * t * ARROW_LEN, .05, 1, 0);
}
function stick(a, hit, ring) {
  a.state = 'stuck';
  a.p = [hit[0] + a.dir[0] * .16, hit[1] + a.dir[1] * .16, hit[2] + a.dir[2] * .16];
  sound(ring != null ? 'thunk' : 'ground');
  resolveArrow(a, ring);
}
function stepArrow(a, dt) {
  const prev = a.p;
  a.v[1] += G.wind * dt;
  a.v[2] -= GRAV * dt;
  a.p = [prev[0] + a.v[0] * dt, prev[1] + a.v[1] * dt, prev[2] + a.v[2] * dt];
  a.dir = norm3(a.v);
  a.age += dt;
  {
    if (prev[0] > X_T && a.p[0] <= X_T) {
      const t = (prev[0] - X_T) / (prev[0] - a.p[0]), hy = lerp(prev[1], a.p[1], t), hz = lerp(prev[2], a.p[2], t);
      const d = Math.hypot(hy, hz - T_Z) / T_R;
      if (d <= 1.03) { a.hit = [hy, hz - T_Z]; return stick(a, [X_T, hy, hz], ringScore(d)); }
    }
    if (inBox(a.p, BACKSTOP)) return stick(a, a.p, null);
  }
  if (a.p[2] <= 0 && prev[2] > 0 && onIsland(a.p[0], a.p[1])) {
    const t = prev[2] / (prev[2] - a.p[2]);
    return stick(a, [lerp(prev[0], a.p[0], t), lerp(prev[1], a.p[1], t), 0], null);
  }
  if (a.p[2] < -6 || a.age > 6) {
    a.state = 'gone';
    resolveArrow(a, null);
  }
}

/* ================= windsocks ================= */
function drawSock([x, y, h]) {
  const w = G.wind, sg = w >= 0 ? 1 : -1, lift = Math.min(1, Math.abs(w) / 4.5);
  for (let k = 0; k < 8; k++) {
    const t = k / 7, flap = Math.sin(G.time * 9 - k * .9) * .04 * (.3 + lift);
    const p = [x + flap, y + sg * (.1 + t * .95) * (.35 + .65 * lift), h - .1 - t * t * .55 * (1 - lift) - t * .08 + flap];
    sphere(p[0], p[1], p[2], .15 - t * .06, SOCK_C[(k >> 1) & 1], 'solid');
    if (k % 2 === 0) castShadow(p[0], p[1], p[2], .12, 1, 0);
  }
}

/* ================= the archer ================= */
function planePoint(sx, sy) {
  const u = (sx - OX) / S, y = X_T - u * R2, v = (X_T + y) / R2;
  return [X_T, y, (v * SIN - (sy - OY) / S) / COS];
}
const aimPoint = () => planePoint(G.aim[0] + G.sway[0], G.aim[1] + G.sway[1]);
function archerFrame() {
  const A = aimPoint(), px = ARCHER[0], py = ARCHER[1];
  const aimYaw = Math.atan2(A[1] - py, A[0] - px), yaw = aimYaw - 1.3;
  const fx = Math.cos(yaw), fy = Math.sin(yaw), sx = -fy, sy = fx, fr = body(0, .02);
  const shoulder = [px + fx * fr.shA + sx * .35, py + fy * fr.shA + sy * .35, fr.shZ - .04];
  const dir = norm3([A[0] - shoulder[0], A[1] - shoulder[1], A[2] - shoulder[2]]);
  const up = norm3([-dir[0] * dir[2], -dir[1] * dir[2], 1 - dir[2] * dir[2]]);
  const ph = G.phase;
  const raise = ph === 'nock' ? ease(clamp(G.phaseT / NOCK_T, 0, 1)) : ph === 'over' || ph === 'idle' ? 0 : 1;
  const draw = ph === 'draw' ? G.draw : 0;
  const high = [shoulder[0] + dir[0] * .8, shoulder[1] + dir[1] * .8, shoulder[2] + dir[2] * .8];
  const low = [shoulder[0] + dir[0] * .35, shoulder[1] + dir[1] * .35, shoulder[2] - .7];
  const bowHand = [lerp(low[0], high[0], raise), lerp(low[1], high[1], raise), lerp(low[2], high[2], raise)];
  const pull = .3 + .5 * draw, snap = ph === 'release' ? Math.max(0, 1 - G.phaseT / .08) * G.lastDraw : 0;
  const nock = [bowHand[0] - dir[0] * (pull + snap * .5), bowHand[1] - dir[1] * (pull + snap * .5), bowHand[2] - dir[2] * (pull + snap * .5) + .05 * draw];
  return { px, py, yaw, fx, fy, A, dir, up, bowHand, nock, draw, raise };
}
function drawArcher() {
  const f = archerFrame(), { px, py, fx, fy } = f;
  const local = w => [(w[0] - px) * fx + (w[1] - py) * fy, -(w[0] - px) * fy + (w[1] - py) * fx, w[2]];
  // after the shot the drawing hand flies back past the ear
  const follow = G.phase === 'release' ? Math.min(1, G.phaseT / .12) * (1 - Math.max(0, (G.phaseT - .2) / .3)) : 0;
  const hand = [f.nock[0] - f.dir[0] * .18 * follow, f.nock[1] - f.dir[1] * .18 * follow, f.nock[2] + .02 * follow];
  player(px, py, f.yaw, { crouch: .02, lean: .02, hR: local(f.bowHand), hL: local(hand), footR: [.28, 0], footL: [-.3, 0] }, ARCHER_PAL);
  // quiver on the back, fletchings peeking out
  const sx = -fy, sy = fx, Q = (a, b, c) => [px + fx * a + sx * b, py + fy * a + sy * b, c];
  capsule(Q(-.27, .06, 1.3), Q(-.36, -.12, 2.3), .11, .12, () => QUIVER, 'solid');
  pendingShadows.push(Q(-.27, .06, 1.3), .11, Q(-.36, -.12, 2.3), .12);
  for (let k = 0; k < 3; k++) sphere(...Q(-.37 + k * .03, -.08 - k * .05, 2.42), .05, k === 1 ? [244, 240, 230] : [214, 62, 52], 'solid');
  // the bow: two limbs curling back from the grip, bending further as it is drawn
  const bow = rampOf(BOW_C), { bowHand: g, dir: d, up: u } = f;
  const limb = t => {
    const bend = (.06 + .13 * f.draw) * t * t;
    return [g[0] + u[0] * t * .62 - d[0] * bend, g[1] + u[1] * t * .62 - d[1] * bend, g[2] + u[2] * t * .62 - d[2] * bend];
  };
  for (let t = -1; t <= 1.0001; t += .015) {
    const p = limb(t), c = bow[Math.abs(t) < .15 ? 1 : t > 0 ? 3 : 2];
    plot(p[0], p[1], p[2], c);
    plot(p[0] - d[0] * .03, p[1] - d[1] * .03, p[2] - d[2] * .03, c);
  }
  const top = limb(1), bot = limb(-1), nocked = G.phase === 'ready' || G.phase === 'draw' || (G.phase === 'nock' && G.phaseT > NOCK_T * .5);
  const string = (a, b) => { for (let s = 0; s <= 1; s += .03) plot(lerp(a[0], b[0], s), lerp(a[1], b[1], s), lerp(a[2], b[2], s), STRING); };
  if (nocked || G.phase === 'release') { string(top, f.nock); string(f.nock, bot); } else string(top, bot);
  if (nocked) drawShaft([f.nock[0] + d[0] * ARROW_LEN, f.nock[1] + d[1] * ARROW_LEN, f.nock[2] + d[2] * ARROW_LEN], d, true);
  return f;
}

/* ================= pixel text and overlays ================= */
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
function drawReticle() {
  if (G.phase === 'over') return;
  const x = Math.round(G.aim[0] + G.sway[0]), y = Math.round(G.aim[1] + G.sway[1]);
  const arms = [];
  for (let k = 3; k <= 7; k++) arms.push([x + k, y], [x - k, y], [x, y + k], [x, y - k]);
  for (const [a, b] of arms) for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) dot(a + ox, b + oy, PAPER);
  const full = G.phase === 'draw' && G.draw >= .999;
  for (const [a, b] of arms) dot(a, b, INK);
  if (full) { for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) dot(x + ox, y + oy, INK); dot(x, y, SIGNAL); }
  // draw strength, as a short bar under the sight
  if (G.phase === 'draw') {
    const w = 15, x0 = x - 7, yb = y + 11;
    for (let yy = yb - 1; yy <= yb + 3; yy++) for (let xx = x0 - 2; xx <= x0 + w + 1; xx++) dot(xx, yy, PAPER);
    for (let yy = yb; yy <= yb + 2; yy++) for (let xx = x0 - 1; xx <= x0 + w; xx++) dot(xx, yy, INK);
    const fill = Math.round(G.draw * w);
    for (let xx = x0; xx < x0 + w; xx++) dot(xx, yb + 1, xx - x0 < fill ? (full ? SIGNAL : rgb(240, 236, 226)) : rgb(110, 106, 104));
  }
}
function drawInset() {
  const R = 34, cx = R + 10, cy = H - R - 10;
  for (let iy = -R - 2; iy <= R + 2; iy++) for (let ix = -R - 2; ix <= R + 2; ix++) {
    const d = Math.hypot(ix + .5, iy + .5) / R;
    if (d > 1 + 2.5 / R) continue;
    dot(cx + ix, cy + iy, d > 1 + 1.2 / R ? PAPER : d > 1 ? INK : ringColor(d));
  }
  // as the camera sees the face: +y lies to the left
  G.hits.forEach((h, k) => {
    const x = Math.round(cx - h[0] / T_R * R), y = Math.round(cy - h[1] / T_R * R), last = k === G.hits.length - 1;
    for (let oy = -2; oy <= 2; oy++) for (let ox = -2; ox <= 2; ox++) if (Math.abs(ox) + Math.abs(oy) <= 3) dot(x + ox, y + oy, PAPER);
    for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) dot(x + ox, y + oy, INK);
    if (last) dot(x, y, SIGNAL);
  });
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
const BEST_KEY = 'arrows-best-target';
function loadBest() { try { return +localStorage.getItem(BEST_KEY) || 0; } catch (e) { return 0; } }
function saveBest(v) { try { localStorage.setItem(BEST_KEY, String(v)); } catch (e) { /* storage may be off */ } }
const G = { time: 0, aim: [0, 0], sway: [0, 0], wind: 0 };
const targetScreen = () => { const p = project(X_T, 0, T_Z + .55); return [p.sx, p.sy]; };
function reset() {
  Object.assign(G, {
    phase: 'nock', phaseT: 0, score: 0, shots: 0, scores: [], hits: [], arrows: [], particles: [], popups: [],
    draw: 0, drawT: 0, lastDraw: 0, pressing: false, misses: 0, best: loadBest(), newBest: false, windT: 8,
  });
  if (!G.aimed) G.aim = targetScreen();
  newWind(true);
  setStatus('aim, hold to draw, let go to shoot');
  renderHud();
}
function newWind(now) {
  const v = Math.round((Math.random() * 2 - 1) * 45) / 10;
  G.windTarget = Math.abs(v) < .4 ? 0 : v;
  if (now) G.wind = G.windTarget;
}
function setPhase(p) { G.phase = p; G.phaseT = 0; }
function startNock() {
  newWind(false);
  setPhase('nock');
}
function beginDraw() {
  G.drawT = 0; G.draw = 0;
  setPhase('draw');
  sound('draw');
}
const shotSpeed = d => 8 + 19 * d;
function release() {
  if (G.draw < .12) { setPhase('ready'); return; }
  const f = archerFrame(), tip = [f.nock[0] + f.dir[0] * ARROW_LEN, f.nock[1] + f.dir[1] * ARROW_LEN, f.nock[2] + f.dir[2] * ARROW_LEN];
  // a little natural scatter: no two arrows leave the bow quite alike
  const A = [f.A[0], f.A[1] + (Math.random() - .5) * .07, f.A[2] + (Math.random() - .5) * .07];
  const speed = shotSpeed(G.draw) * (1 + (Math.random() - .5) * .012);
  const dir = norm3([A[0] - tip[0], A[1] - tip[1], A[2] - tip[2]]);
  G.arrows.push({ p: tip, v: dir.map(c => c * speed), dir, state: 'fly', age: 0, resolved: false });
  if (G.arrows.length > 36) G.arrows.splice(G.arrows.findIndex(a => a.state !== 'fly'), 1);
  G.lastDraw = G.draw; G.draw = 0;
  G.shots++;
  setPhase('release');
  sound('twang');
  renderHud();
}
function resolveArrow(a, ring) {
  if (a.resolved) return;
  a.resolved = true;
  const pts = ring || 0;
  G.scores.push(pts);
  G.score += pts;
  if (a.hit) G.hits.push(a.hit);
  const p = project(X_T, 0, T_Z + T_R + .3);
  G.popups.push({ text: String(pts), x: p.sx, y: p.sy - 8, t: 0, gold: pts === 10 });
  if (pts === 10) sound('ten'); else if (pts >= 8) sound('score');
  if (!pts) {
    G.misses++;
    setStatus(G.misses < 3 ? 'missed · arrows drop on the way, aim a little higher' : 'missed');
  } else {
    const [dy, dz] = a.hit, d = Math.hypot(dy, dz) / T_R;
    let where = '';
    if (d > .2) where = Math.abs(dz) >= Math.abs(dy) ? (dz < 0 ? ' · low' : ' · high') : (dy > 0 ? ' · left' : ' · right');
    setStatus(pts === 10 ? '10 · dead centre' : pts + where);
  }
  renderHud();
}
function finish() {
  setPhase('over');
  G.newBest = G.score > G.best;
  if (G.newBest) { G.best = G.score; saveBest(G.score); }
  setStatus(G.newBest ? 'new best: ' + G.score + ' · tap to play again' : 'final ' + G.score + ' · best ' + G.best + ' · tap to play again');
  showOver('Round over', G.score + ' of 100' + (G.newBest ? ' · new best' : ' · best ' + G.best));
  renderHud();
}

/* ================= update ================= */
function update(dt) {
  G.time += dt; G.phaseT += dt;
  G.wind += (G.windTarget - G.wind) * Math.min(1, dt * 4);
  const ph = G.phase;
  if (ph === 'nock' && G.phaseT >= NOCK_T) {
    setPhase('ready');
    if (G.pressing) beginDraw();
    renderHud();
  } else if (ph === 'draw') {
    G.drawT += dt;
    G.draw = ease(Math.min(1, G.drawT / FULL_DRAW));
  } else if (ph === 'release' && G.phaseT >= .3) {
    if (G.arrows.every(a => a.resolved) && G.phaseT >= .75) {
      if (G.shots >= ARROWS_PER_ROUND) setPhase('idle'); else startNock();
    }
  }
  // the bow arm sways with breath, and shakes once it has been held at full draw too long
  const amp = G.phase === 'draw' ? .6 + Math.min(7, Math.max(0, G.drawT - 1.8) * 3) : 0;
  const tx = (Math.sin(G.time * 1.3) + .4 * Math.sin(G.time * 3.7)) * amp, ty = (Math.cos(G.time * 1.1) * .8 + .3 * Math.sin(G.time * 4.3)) * amp;
  G.sway[0] += (tx - G.sway[0]) * Math.min(1, dt * 8);
  G.sway[1] += (ty - G.sway[1]) * Math.min(1, dt * 8);
  if (G.keys) {
    const k = G.keys, sp = 70 * dt;
    G.aim[0] = clamp(G.aim[0] + ((k.ArrowRight ? 1 : 0) - (k.ArrowLeft ? 1 : 0)) * sp, 0, W - 1);
    G.aim[1] = clamp(G.aim[1] + ((k.ArrowDown ? 1 : 0) - (k.ArrowUp ? 1 : 0)) * sp, 0, H - 1);
  }
  const N = 8, h = dt / N;
  for (let s = 0; s < N; s++) for (const a of G.arrows) if (a.state === 'fly') stepArrow(a, h);
  G.arrows = G.arrows.filter(a => a.state !== 'gone');
  for (const p of G.particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 120 * dt; p.life -= dt; }
  G.particles = G.particles.filter(p => p.life > 0);
  for (const p of G.popups) p.t += dt;
  G.popups = G.popups.filter(p => p.t < 1.1);
  const flying = G.arrows.some(a => a.state === 'fly');
  if (G.phase === 'idle' && !flying && G.phaseT > .5) finish();
}
function draw() {
  pix.set(bakedPix);
  zb.set(bakedZ);
  drawArcher();
  for (const a of G.arrows) drawShaft(a.p, a.dir, a.state !== 'fly');
  for (const s of SOCKS) drawSock(s);
  const windT = STILL ? 0 : Math.floor(G.time * WIND_FPS) / WIND_FPS;
  drawLeaves(windT);
  drawTufts(windT);
  flushShadows();
  applyShadows(bakedZ);
  shadeEdges();
  drawParticles();
  drawInset();
  drawPopups();
  drawReticle();
  ctx.putImageData(image, 0, 0);
}

/* ================= hud ================= */
const nodes = {
  pts: document.getElementById('pts'), sub: document.getElementById('sub'), best: document.getElementById('best'),
  wind: document.getElementById('wind'), status: document.getElementById('status'),
};
function renderHud() {
  nodes.pts.textContent = G.score;
  const cells = [];
  for (let k = 0; k < ARROWS_PER_ROUND; k++) {
    const v = G.scores[k], now = k === G.scores.length && G.phase !== 'over';
    cells.push('<i class="' + (v === undefined ? (now ? 'now' : '') : v === 10 ? 'ten' : v === 0 ? 'miss' : 'hit') + '">' + (v === undefined ? '·' : v) + '</i>');
  }
  nodes.sub.innerHTML = cells.join('');
  nodes.best.textContent = G.best ? 'best ' + G.best : '';
  const w = G.windTarget;
  nodes.wind.textContent = !w ? 'wind calm' : 'wind ' + (w > 0 ? '←' : '→') + ' ' + Math.abs(w).toFixed(1);
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
  G.pressing = true;
  if (G.phase === 'ready') beginDraw();
}
function letGo() {
  if (!G.pressing) return;
  G.pressing = false;
  if (G.phase === 'draw') release();
}
let touch = null;
stage.addEventListener('pointerdown', e => {
  if (e.button > 0) return;
  try { stage.setPointerCapture(e.pointerId); } catch (err) { /* older browsers */ }
  canvas.focus({ preventScroll: true });
  if (e.pointerType === 'mouse') { G.aim = toCanvas(e); G.aimed = true; }
  // on touch the sight moves with the drag, so a finger never hides it
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
// a synthetic move at the page corner on load would yank the sight off the target
addEventListener('pointermove', e => { if (e.pointerType === 'mouse' && e.target !== stage && !rules.open && (e.clientX || e.clientY)) { G.aim = toCanvas(e); G.aimed = true; } });
stage.addEventListener('pointerup', () => { touch = null; letGo(); });
stage.addEventListener('pointercancel', () => { touch = null; G.pressing = false; if (G.phase === 'draw') setPhase('ready'); });
G.keys = {};
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
addEventListener('blur', () => { G.pressing = false; G.keys = {}; });
document.getElementById('rules-open').addEventListener('click', () => rules.showModal());
rules.addEventListener('click', e => { if (e.target === rules) rules.close(); });
rules.addEventListener('close', () => canvas.focus({ preventScroll: true }));

/* ================= sound ================= */
function sound(kind, amt = .6) {
  if (!audio || muted) return;
  if (kind === 'draw') tone(150, 210, .5, .025, 'triangle');
  else if (kind === 'twang') { tone(190, 85, .16, .12, 'triangle'); hiss(.12, 1800, .7, .07); }
  else if (kind === 'thunk') { tone(120, 55, .12, .28, 'sine'); hiss(.06, 600, .8, .1); }
  else if (kind === 'ground') { tone(90, 50, .08, .14, 'sine'); hiss(.05, 400, .8, .05); }
  else if (kind === 'pop') { hiss(.07, 2200, .6, .3); tone(900, 260, .06, .05, 'square'); }
  else if (kind === 'score') { tone(660, 660, .1, .05, 'triangle'); tone(990, 990, .14, .05, 'triangle', .08); }
  else if (kind === 'ten') { tone(784, 784, .1, .06, 'triangle'); tone(988, 988, .1, .06, 'triangle', .09); tone(1318, 1318, .22, .06, 'triangle', .18); }
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
window.__arrows = { G, update, draw, press, letGo, planePoint, project };

