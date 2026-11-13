/* ================= the pitch ================= */
const GRAV = 13, BALL_R = .22, KICKS = 10;
const GX = -5.5, GW = 3.8, GH = 2.9, NET_D = 1.5, NET_LOW = 1.9;
const SPOT = [4.4, 0], KX = GX + .5;
const BOX_X = GX + 11.4, SIX_X = GX + 2.2;
const ISLAND = { cx: -.4, ax: 8.7, ay: 6.7 };
const KIND_LAWN = 4;
const STRIPE_A = [84, 140, 64], STRIPE_B = [98, 154, 72], LINE_C = [238, 240, 230];
const POST_C = [246, 246, 242], BOARD_C = [[255, 106, 61], [30, 42, 69], [64, 160, 176], [242, 190, 48]];
const NET_FRONT = rgb(246, 246, 240), NET_BACK = rgb(186, 194, 200);
const BALL_WHITE = [240, 240, 236], BALL_DARK = [40, 44, 56];
const KEEPER_PAL = { jersey: [242, 196, 40], shorts: [36, 40, 52], skin: [206, 150, 112], hair: [40, 30, 26], sock: [242, 196, 40], shoe: [30, 30, 36], glove: [246, 246, 240] };
const KICKER_PAL = { jersey: [204, 44, 54], shorts: [244, 242, 236], skin: [222, 172, 132], hair: [92, 60, 36], sock: [204, 44, 54], shoe: [30, 30, 36] };

const LX = -.246, LY = .532, LZ = .81;
function litLevel(nx, ny, nz) { return clamp(Math.floor(((nx * LX + ny * LY + nz * LZ) * .5 + .5) * 4.3 + .2), 1, 4); }
function pick(tones, v, ix, iy, dither = .6) { return tones[clamp(Math.floor(v * 4 + (bayerAt(ix, iy) - .5) * dither), 0, 3)]; }
function islandEdge(x, y) { return Math.pow(Math.pow(Math.abs(x - ISLAND.cx) / ISLAND.ax, 4) + Math.pow(Math.abs(y) / ISLAND.ay, 4), .25); }
const onIsland = (x, y) => islandEdge(x, y) < .97;
const norm3 = v => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };

function pitchLine(x, y) {
  const L = .07, ay = Math.abs(y);
  if (Math.abs(x - GX) < L && ay < 6.3) return true;
  if (Math.abs(ay - (GW + 1.4)) < L && x >= GX && x <= SIX_X) return true;
  if (Math.abs(x - SIX_X) < L && ay <= GW + 1.4) return true;
  if (Math.abs(ay - 6.3) < L && x >= GX && x <= BOX_X) return true;
  if (Math.abs(x - BOX_X) < L && ay <= 6.3) return true;
  if (Math.hypot(x - SPOT[0], y - SPOT[1]) < .15) return true;
  if (x > BOX_X && Math.abs(Math.hypot(x - SPOT[0], y) - 3.1) < L) return true;
  return false;
}
function groundColor(x, y, ix, iy, i) {
  const edge = islandEdge(x, y), rough = edge + (noise(x * 1.3, y * 1.3) - .5) * .12;
  if (rough > 1.04) return 0;
  if (rough > .93 && hash(ix, iy) < (rough - .93) / .11) return 0;
  const ay = Math.abs(y);
  if (x > GX - 2.1 && ay < 6.6) {
    kinds[i] = KIND_LAWN;
    if (pitchLine(x, y)) return rgb(...LINE_C);
    const stripe = Math.floor((x - GX) / 1.45) & 1;
    // the goalmouth is worn to dirt where keepers have dived all season
    const worn = Math.max(0, 1 - Math.hypot((x - GX - .5) / 1.1, y / 3.2)) + Math.max(0, 1 - Math.hypot((x - SPOT[0]) / .8, y / .8)) * .8;
    if (worn > .35 && noise(x * 3, y * 3) < worn) return pick(tonesOf([150, 128, 88]), .5 + (noise(x * 4, y * 4) - .5) * .7, ix, iy, .5);
    return pick(tonesOf(stripe ? STRIPE_A : STRIPE_B), .5 + (noise(x * .7, y * .7) - .5) * .35, ix, iy, .35);
  }
  kinds[i] = KIND_GRASS;
  const t = noise(x * .9, y * .9) * 1.15 + (hash(ix, iy) - .5) * .55 - .08;
  return rgb(...GRASS[clamp(Math.floor(t * 4.2), 0, 3)]);
}
function bake() {
  zb.fill(-1e9); pix.fill(CLEAR);
  for (let iy = 0; iy < H; iy++) for (let ix = 0; ix < W; ix++) {
    const g = unproject(ix + .5, iy + .5), i = iy * W + ix, c = groundColor(g.x, g.y, ix, iy, i);
    if (!c) continue;
    pix[i] = c; ground[i] = 1;
    zb[i] = (g.x + g.y) / R2 * COS;
  }
  growGrass();
  groundZ.set(zb);
  // the frame: posts and bar, with a shallow box of net behind
  const post = () => POST_C;
  for (const sg of [-1, 1]) {
    capsule([GX, sg * GW, 0], [GX, sg * GW, GH], .08, .08, post, 'solid');
    capsule([GX - NET_D, sg * GW, 0], [GX - NET_D, sg * GW, NET_LOW], .04, .04, post, 'solid');
    capsule([GX, sg * GW, GH], [GX - NET_D, sg * GW, NET_LOW], .035, .035, post, 'solid');
    for (let z = 0; z <= GH; z += .1) castShadow(GX, sg * GW, z, .09);
  }
  capsule([GX, -GW, GH], [GX, GW, GH], .08, .08, post, 'solid');
  capsule([GX - NET_D, -GW, NET_LOW], [GX - NET_D, GW, NET_LOW], .035, .035, post, 'solid');
  for (let y = -GW; y <= GW; y += .1) { castShadow(GX, y, GH, .09); castShadow(GX - NET_D, y, NET_LOW, .05); for (let z = 0; z < NET_LOW; z += .35) castShadow(GX - NET_D, y, z, .03); }
  // advertising boards behind the goal
  for (let k = 0; k < 6; k++) {
    const y0 = -5.4 + k * 1.82;
    box(GX - 2.5, y0, 0, GX - 2.3, y0 + 1.76, .62, BOARD_C[k % 4], k * 7);
    for (let y = y0; y < y0 + 1.76; y += .2) castShadow(GX - 2.4, y, .5, .14);
  }
  growTree(-7.7, 5.7, .8, 380, 0);
  growTree(-7.4, -5.9, .72, 340, 61);
  growTree(7.2, -5.3, .62, 280, 133);
  bakeOcclusion();
  staticShadow.set(shadowMask);
  applyShadows(groundZ);
  bakedPix.set(pix);
  bakedZ.set(zb);
}

/* ================= net ================= */
const NET = { y: 0, z: 1, amt: 0, v: 0 };
function bulge(y, z) { return NET.amt * Math.exp(-((y - NET.y) ** 2 + (z - NET.z) ** 2) / .7); }
function drawNet() {
  const mid = project(GX - NET_D * .5, 0, 1).d;
  const put = (x, y, z) => plot(x, y, z, project(x, y, z).d > mid ? NET_FRONT : NET_BACK);
  const roofZ = t => lerp(GH, NET_LOW, t);
  // back panel
  for (let y = -GW; y <= GW + .001; y += .32) for (let z = 0; z <= NET_LOW; z += .03) put(GX - NET_D - bulge(y, z), y, z);
  for (let z = 0; z <= NET_LOW + .001; z += .3) for (let y = -GW; y <= GW; y += .03) put(GX - NET_D - bulge(y, z), y, z);
  // roof, sloping from the bar down to the back
  for (let y = -GW; y <= GW + .001; y += .32) for (let t = 0; t <= 1; t += .03) put(GX - NET_D * t - bulge(y, roofZ(t)) * t, y, roofZ(t) + bulge(y, 2.6) * t * .2);
  for (let t = 0; t <= 1.001; t += .25) for (let y = -GW; y <= GW; y += .03) put(GX - NET_D * t - bulge(y, roofZ(t)) * t, y, roofZ(t));
  // sides
  for (const sg of [-1, 1]) for (let t = 0; t <= 1.001; t += .2) for (let z = 0; z <= roofZ(t); z += .03) put(GX - NET_D * t, sg * GW, z);
}

/* ================= the ball ================= */
// twelve patch centres of a football (icosahedron vertices), unit length
const PATCHES = (() => {
  const g = (1 + Math.sqrt(5)) / 2, v = [];
  for (const a of [-1, 1]) for (const b of [-g, g]) v.push([0, a, b], [a, b, 0], [b, 0, a]);
  return v.map(norm3);
})();
function drawBall(x, y, z, spin, svx, svy) {
  const p = project(x, y, z), rp = BALL_R * S;
  let ax = -svy, ay = svx;
  const al = Math.hypot(ax, ay);
  if (al < 1e-4) { ax = .8; ay = .6; } else { ax /= al; ay /= al; }
  const c = Math.cos(spin), s = Math.sin(spin), t = 1 - c;
  const m = [c + ax * ax * t, ax * ay * t, ay * s, ax * ay * t, c + ay * ay * t, -ax * s, -ay * s, ax * s, c];
  const white = rampOf(BALL_WHITE), dark = rampOf(BALL_DARK);
  const y0 = Math.max(0, Math.floor(p.sy - rp)), y1 = Math.min(H - 1, Math.ceil(p.sy + rp));
  const x0 = Math.max(0, Math.floor(p.sx - rp)), x1 = Math.min(W - 1, Math.ceil(p.sx + rp));
  for (let iy = y0; iy <= y1; iy++) for (let ix = x0; ix <= x1; ix++) {
    const dx = (ix + .5 - p.sx) / rp, dy = (iy + .5 - p.sy) / rp, nn = dx * dx + dy * dy;
    if (nn > 1) continue;
    const nz = Math.sqrt(1 - nn), d = p.d + BALL_R * nz, i = iy * W + ix;
    if (d <= zb[i]) continue;
    let l = clamp(-.55 * dx - .6 * dy + .58 * nz, 0, 1);
    if (dy > .35) l = Math.max(l, .12 + dy * .24);
    const lvl = clamp(Math.floor(l * 4.4 + .2), 1, 4);
    const q = [m[0] * dx + m[1] * dy + m[2] * nz, m[3] * dx + m[4] * dy + m[5] * nz, m[6] * dx + m[7] * dy + m[8] * nz];
    let patch = false;
    for (const v of PATCHES) if (q[0] * v[0] + q[1] * v[1] + q[2] * v[2] > .9) { patch = true; break; }
    zb[i] = d;
    pix[i] = patch ? dark[Math.max(1, lvl - 1)] : white[lvl];
  }
}
const screenVel = (vx, vy, vz) => [(vx - vy) / R2 * S, ((vx + vy) / R2 * SIN - vz * COS) * S];

/* ================= the keeper ================= */
// built by hand, not with player(): a dive tips the whole body sideways
function keeperFrame(k) {
  const th = k.th, a = [0, Math.sin(th), Math.cos(th)], side = [0, Math.cos(th), -Math.sin(th)];
  const hip = [KX + k.x, k.y, k.hz];
  const at = (al, sd, fw = 0) => [hip[0] + fw + a[0] * al + side[0] * sd, hip[1] + a[1] * al + side[1] * sd, hip[2] + a[2] * al + side[2] * sd];
  return { hip, a, side, at };
}
function drawKeeper(k) {
  const f = keeperFrame(k), P = KEEPER_PAL;
  const add = (p, q, r0, r1, col) => { capsule(p, q, r0, r1, () => col, 'solid'); pendingShadows.push(p, r0, q, r1); };
  const spread = k.state === 'ready' ? .34 : .2, crouch = k.state === 'ready' ? .22 : 0;
  for (const sg of [-1, 1]) {
    const knee = f.at(-.55, sg * (spread + .02), .12 + crouch * .5), foot = f.at(-1.1 + crouch, sg * (spread + .08 + crouch * .3), 0);
    if (k.state === 'ready') foot[2] = Math.max(.1, foot[2]);
    add(f.at(0, sg * .16), knee, .17, .14, P.shorts);
    add(knee, foot, .12, .1, P.sock);
    add(foot, [foot[0] + .17, foot[1], foot[2] - .02], .1, .09, P.shoe);
  }
  add(f.at(-.05, 0), f.at(.92, 0), .3, .33, P.jersey);
  const head = f.at(1.25, 0, .02);
  add(f.at(.95, 0), head, .11, .12, P.skin);
  add(head, head, .24, .24, P.skin);
  const hair = [head[0] - .06, head[1] - f.a[1] * .02, head[2] + f.a[2] * .08];
  add(hair, hair, .2, .2, P.hair);
  // arms: wide and low when waiting, stretched past the head in a dive
  for (const sg of [-1, 1]) {
    const sh = f.at(.88, sg * .36);
    const hand = k.state === 'ready' ? f.at(.25 + Math.sin(G.time * 5) * .03, sg * 1.0, .35) : f.at(1.9, sg * .2, .1);
    const el = [(sh[0] + hand[0]) / 2 + .1, (sh[1] + hand[1]) / 2, (sh[2] + hand[2]) / 2];
    add(sh, el, .1, .09, P.jersey);
    add(el, hand, .09, .08, P.jersey);
    add(hand, hand, .14, .14, P.glove);
  }
}
// the ball is stopped by a capsule from the knees through outstretched gloves
function keeperHits(k, b) {
  const f = keeperFrame(k);
  const p0 = f.at(-.6, 0), p1 = k.state === 'ready' ? f.at(1.4, 0) : f.at(2.0, 0);
  const d = [p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]], w = [b.x - p0[0], b.y - p0[1], b.z - p0[2]];
  const t = clamp((w[0] * d[0] + w[1] * d[1] + w[2] * d[2]) / (d[0] * d[0] + d[1] * d[1] + d[2] * d[2]), 0, 1);
  const q = [p0[0] + d[0] * t, p0[1] + d[1] * t, p0[2] + d[2] * t];
  const n = [b.x - q[0], b.y - q[1], b.z - q[2]], dist = Math.hypot(...n);
  const reach = k.state === 'ready' ? .46 : .34 + .14 * t;
  return dist < reach + BALL_R ? { n: norm3(n), q } : null;
}

/* ================= pixel text ================= */
const FONT = {
  '+': ['...', '.X.', 'XXX', '.X.', '...'], '0': ['XXX', 'X.X', 'X.X', 'X.X', 'XXX'], '1': ['.X.', 'XX.', '.X.', '.X.', 'XXX'],
  '2': ['XXX', '..X', 'XXX', 'X..', 'XXX'], '3': ['XXX', '..X', '.XX', '..X', 'XXX'], '4': ['X.X', 'X.X', 'XXX', '..X', '..X'],
  '5': ['XXX', 'X..', 'XXX', '..X', 'XXX'], '6': ['XXX', 'X..', 'XXX', 'X.X', 'XXX'], '7': ['XXX', '..X', '.X.', '.X.', '.X.'],
  '8': ['XXX', 'X.X', 'XXX', 'X.X', 'XXX'], '9': ['XXX', 'X.X', 'XXX', '..X', 'XXX'],
  'G': ['XXX', 'X..', 'X.X', 'X.X', 'XXX'], 'O': ['XXX', 'X.X', 'X.X', 'X.X', 'XXX'], 'A': ['XXX', 'X.X', 'XXX', 'X.X', 'X.X'],
  'L': ['X..', 'X..', 'X..', 'X..', 'XXX'], '!': ['.X.', '.X.', '.X.', '...', '.X.'],
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

/* ================= game state ================= */
const BEST_KEY = 'penalty-best';
function loadBest() { try { return +localStorage.getItem(BEST_KEY) || 0; } catch (e) { return 0; } }
function saveBest(v) { try { localStorage.setItem(BEST_KEY, String(v)); } catch (e) { /* storage may be off */ } }
const G = { time: 0, best: loadBest() };
function newKeeper() { return { x: 0, y: 0, hz: 1.05, th: 0, vy: 0, state: 'ready', t: 0, ty: 0, tz: 1, guess: 0, reacted: false }; }
function reset() {
  Object.assign(G, {
    kick: 0, results: [], goals: 0, phase: 'ready', phaseT: 0, swipe: null, plan: null, ball: null, keeper: newKeeper(),
    popups: [], newBest: false, misses: 0,
  });
  placeBall();
  setStatus('flick towards the goal · bend the flick to curl it');
  renderHud();
}
function placeBall() {
  G.ball = { x: SPOT[0], y: SPOT[1], z: BALL_R, vx: 0, vy: 0, vz: 0, spin: 0, curl: [0, 0], touched: false, crossed: false, live: false, age: 0 };
  G.keeper = newKeeper();
  G.kicker = { x: SPOT[0] + 1.25, y: .75, t: 0 };
  NET.amt = 0; NET.v = 0;
}
function setPhase(p) { G.phase = p; G.phaseT = 0; }

/* ================= aiming ================= */
// the flick drawn on screen is laid onto the goal: its far end, scaled up, picks the spot
function planePoint(sx, sy) {
  const u = (sx - OX) / S, y = GX - u * R2, v = (GX + y) / R2;
  return [GX, y, (v * SIN - (sy - OY) / S) / COS];
}
function planFromSwipe(sw, final) {
  const pts = sw.pts, a = pts[0], b = pts[pts.length - 1];
  const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy);
  if (len < 24) return null;
  // the flick's angle against the line from ball to goal picks left or right; its length picks the height
  const bs = project(SPOT[0], SPOT[1], BALL_R), gc = project(GX, 0, GH / 2), post = project(GX, GW, GH / 2);
  const ang = (x, y) => Math.atan2(x * (gc.sy - bs.sy) * -1 + y * (gc.sx - bs.sx), x * (gc.sx - bs.sx) + y * (gc.sy - bs.sy));
  const phi = ang(dx, dy), phiPost = ang(post.sx - bs.sx, post.sy - bs.sy);
  if (Math.abs(phi) > 1.4) return null;
  const T = [GX, GW * phi / phiPost, clamp(.25 + (len - 70) / 150 * 2.4, BALL_R, GH + 1.4)];
  // bend: how far the middle of the flick bows off its chord, as a share of its length
  let bow = 0;
  for (const p of pts) {
    const cross = ((p[0] - a[0]) * dy - (p[1] - a[1]) * dx) / len;
    if (Math.abs(cross) > Math.abs(bow)) bow = cross;
  }
  const bend = clamp(bow / len, -.4, .4);
  let power = .55;
  if (final) {
    // power from the flick's speed over its last moments
    const tEnd = b[2];
    let k = pts.length - 1;
    while (k > 0 && tEnd - pts[k][2] < 90) k--;
    const q = pts[k], dt = Math.max(16, tEnd - q[2]);
    const speed = Math.hypot(b[0] - q[0], b[1] - q[1]) / dt * 1000;
    power = clamp((speed - 250) / 1500, 0, 1);
  }
  return { T, bend, power };
}
const kickSpeed = p => 15 + 15 * p;
// constant sideways pull for a curled shot, square to its path on the ground
function curlVec(T, bend) {
  const dx = T[0] - SPOT[0], dy = T[1] - SPOT[1], l = Math.hypot(dx, dy) || 1;
  const k = -bend * 48;
  return [-dy / l * k, dx / l * k];
}
function ghost(start, v, curl) {
  let p = start.slice(), w = v.slice();
  const pts = [], dt = 1 / 240;
  for (let i = 0; i < 480; i++) {
    w[0] += curl[0] * dt; w[1] += curl[1] * dt; w[2] -= GRAV * dt;
    const q = [p[0] + w[0] * dt, p[1] + w[1] * dt, p[2] + w[2] * dt];
    if (i % 5 === 4) pts.push(q);
    if (q[0] <= GX) { const t = (p[0] - GX) / (p[0] - q[0]); return { hit: [GX, lerp(p[1], q[1], t), lerp(p[2], q[2], t)], pts }; }
    if (q[2] < BALL_R && w[2] < 0) { q[2] = BALL_R; w[2] = -w[2] * .55; }
    p = q;
  }
  return { hit: null, pts };
}
// launch velocity that arrives at T, given speed and curl; aimed a little upwards so it carries
function solveKick(T, speed, curl) {
  const start = [SPOT[0], SPOT[1], BALL_R];
  const aim = [T[0], T[1], T[2]];
  let v = [0, 0, 0];
  for (let k = 0; k < 6; k++) {
    const dx = aim[0] - start[0], dy = aim[1] - start[1], dz = aim[2] - start[2];
    const flat = Math.hypot(dx, dy), t = flat / speed;
    v = [dx / t, dy / t, dz / t + GRAV * t / 2];
    const r = ghost(start, v, curl);
    if (!r.hit) break;
    aim[1] += T[1] - r.hit[1]; aim[2] += T[2] - r.hit[2];
  }
  return v;
}

/* ================= kicking ================= */
function kick(plan) {
  G.plan = plan;
  G.kicker.t = 0;
  setPhase('runup');
  setStatus('');
}
function strike() {
  const p = G.plan, b = G.ball;
  // harder shots go where they are aimed less faithfully
  const err = .05 + .72 * p.power * p.power;
  const T = [p.T[0], p.T[1] + (Math.random() - .5) * 2 * err, Math.max(.3, p.T[2] + (Math.random() - .5) * err)];
  const curl = curlVec(p.T, p.bend), speed = kickSpeed(p.power);
  const v = solveKick(T, speed, curl);
  Object.assign(b, { vx: v[0], vy: v[1], vz: v[2], curl, live: true, age: 0 });
  sound('kick', .4 + p.power * .6);
  // the keeper: sometimes he guesses a side before he can see anything
  const k = G.keeper, lvl = G.kick / (KICKS - 1);
  k.reaction = lerp(.27, .17, lvl) * (1.2 - Math.random() * .4);
  k.speed = lerp(7, 8.6, lvl);
  if (Math.random() < lerp(.28, .42, lvl)) { k.guess = Math.random() < .5 ? -1 : 1; dive(k, k.guess * (1.5 + Math.random() * 1.8), .6 + Math.random() * 1.6); }
  setPhase('flight');
}
function dive(k, ty, tz) {
  k.state = 'dive'; k.t = 0; k.ty = clamp(ty, -GW - .2, GW + .2); k.tz = tz;
  const sg = Math.sign(ty) || 1, far = Math.abs(ty) > 1.1;
  // a high dive cannot get as far across as a low one
  k.thTarget = far ? sg * (tz > 1.7 ? 1.0 : 1.3) : sg * .25;
  k.hzTarget = far ? (tz > 1.7 ? 1.05 : .75) : 1.2 + Math.max(0, tz - 2) * .5;
}
function stepKeeper(k, b, dt) {
  k.t += dt;
  if (k.state === 'ready') { k.y = Math.sin(G.time * 2.2) * .25; k.hz = 1.05 + Math.abs(Math.sin(G.time * 4.4)) * .04; }
  if (G.phase === 'flight' && b.live && !k.reacted && G.phaseT >= k.reaction) {
    k.reacted = true;
    // read the shot from its line now; curl is what fools him
    const t = (b.x - (KX + .1)) / Math.max(1, -b.vx);
    const py = b.y + b.vy * t, pz = Math.max(.3, b.z + b.vz * t - GRAV * t * t / 2);
    // a shot already going wide or over is left alone
    const onFrame = Math.abs(py) < GW + .25 && pz < GH + .3;
    if (onFrame && (k.state === 'ready' || Math.sign(py) === Math.sign(k.ty))) dive(k, py, pz);
    else if (!onFrame && k.state === 'ready') k.watch = Math.sign(py);
  }
  if (k.state === 'dive') {
    const sg = Math.sign(k.ty - k.y);
    const ext = (Math.abs(k.thTarget) > .5 ? (k.tz > 1.7 ? .9 : 1.25) : .3) * Math.sign(k.thTarget);
    const goal = k.ty - ext;
    const step = k.speed * dt;
    k.y = Math.abs(goal - k.y) < step ? goal : k.y + Math.sign(goal - k.y) * step;
    k.th += (k.thTarget - k.th) * Math.min(1, dt * 9);
    k.hz += (k.hzTarget - k.hz) * Math.min(1, dt * 8);
    if (k.t > .55) { k.hzTarget = Math.max(.32, k.hzTarget - dt * 2); k.state = k.t > .9 ? 'down' : 'dive'; }
    if (sg === 0) k.state = 'dive';
  } else if (k.state === 'down') {
    k.hz += (.32 - k.hz) * Math.min(1, dt * 6);
  }
}

/* ================= ball physics ================= */
function hitBar(b, a, c, r) {
  const d = [c[0] - a[0], c[1] - a[1], c[2] - a[2]], w = [b.x - a[0], b.y - a[1], b.z - a[2]];
  const t = clamp((w[0] * d[0] + w[1] * d[1] + w[2] * d[2]) / (d[0] * d[0] + d[1] * d[1] + d[2] * d[2]), 0, 1);
  const n = [b.x - a[0] - d[0] * t, b.y - a[1] - d[1] * t, b.z - a[2] - d[2] * t], dist = Math.hypot(...n);
  if (dist >= r + BALL_R || dist < 1e-6) return false;
  const u = n.map(v => v / dist), push = r + BALL_R - dist;
  b.x += u[0] * push; b.y += u[1] * push; b.z += u[2] * push;
  const vn = b.vx * u[0] + b.vy * u[1] + b.vz * u[2];
  if (vn < 0) { b.vx -= 1.7 * vn * u[0]; b.vy -= 1.7 * vn * u[1]; b.vz -= 1.7 * vn * u[2]; return -vn; }
  return false;
}
function stepBall(b, dt) {
  if (!b.live) return;
  b.age += dt;
  const px = b.x;
  if (!b.bounced) { b.vx += b.curl[0] * dt; b.vy += b.curl[1] * dt; }
  b.vz -= GRAV * dt;
  b.x += b.vx * dt; b.y += b.vy * dt; b.z += b.vz * dt;
  b.spin += dt * 14;
  // posts and bar
  for (const [a, c] of [[[GX, -GW, 0], [GX, -GW, GH]], [[GX, GW, 0], [GX, GW, GH]], [[GX, -GW, GH], [GX, GW, GH]]]) {
    const hit = hitBar(b, a, c, .08);
    if (hit && hit > .5) { sound('post', Math.min(1, hit / 12)); b.bounced = true; b.post = true; }
  }
  // the keeper
  const k = G.keeper, kh = !b.saved && keeperHits(k, b);
  if (kh) {
    const vn = b.vx * kh.n[0] + b.vy * kh.n[1] + b.vz * kh.n[2];
    if (vn < 0) {
      b.vx -= 1.45 * vn * kh.n[0]; b.vy -= 1.45 * vn * kh.n[1]; b.vz -= 1.45 * vn * kh.n[2];
      b.vx = Math.max(b.vx, 1.5);
      b.saved = true; b.bounced = true;
      sound('save');
    }
  }
  // the goal line
  if (!b.crossed && px > GX && b.x <= GX) {
    b.crossed = true;
    const inside = Math.abs(b.y) < GW - BALL_R * .6 && b.z < GH - BALL_R * .6;
    if (inside) resolve('goal'); else if (!G.result) resolve(b.z >= GH ? 'over' : 'wide');
  }
  // inside the goal: the net catches it
  if (b.crossed && Math.abs(b.y) < GW && b.x < GX) {
    const t = clamp((GX - b.x) / NET_D, 0, 1), roof = lerp(GH, NET_LOW, t) - BALL_R;
    if (b.z > roof && b.vz > 0) { b.z = roof; b.vz *= -.2; }
    if (b.x < GX - NET_D + BALL_R + bulge(b.y, b.z) * .2) {
      if (b.vx < 0) {
        NET.y = b.y; NET.z = b.z; NET.v += -b.vx * .14;
        b.x = GX - NET_D + BALL_R; b.vx *= -.12; b.vy *= .3; b.vz *= .3;
        sound('net');
      }
    }
    if (Math.abs(b.y) > GW - BALL_R) { b.y = Math.sign(b.y) * (GW - BALL_R); b.vy *= -.3; }
  }
  // the ground
  if (b.z < BALL_R && onIsland(b.x, b.y)) {
    b.z = BALL_R;
    if (b.vz < -1.5) { b.vz = -b.vz * .55; sound('bounce', Math.min(1, -b.vz / 8)); } else b.vz = 0;
    b.vx *= .97; b.vy *= .97;
    if (b.vz === 0) { const sp = Math.hypot(b.vx, b.vy), n = Math.max(0, sp - 3 * dt); if (sp > 0) { b.vx *= n / sp; b.vy *= n / sp; } }
  }
}
function stepNet(dt) {
  NET.v += (-90 * NET.amt - 7 * NET.v) * dt;
  NET.amt += NET.v * dt;
}
function resolve(kind) {
  if (G.result) return;
  G.result = kind;
  const goal = kind === 'goal';
  G.results.push(goal ? 1 : kind === 'saved' ? -1 : 0);
  if (goal) {
    G.goals++;
    G.popups.push({ text: 'GOAL!', t: 0 });
    sound('cheer');
    setStatus(G.ball.saved ? 'in off the keeper!' : G.ball.post ? 'in off the post!' : G.plan.power > .75 ? 'rocket · no chance' : Math.abs(G.plan.bend) > .12 ? 'curled in' : 'goal');
  } else {
    G.misses++;
    sound('groan');
    setStatus(kind === 'saved' ? (G.keeper.guess ? 'saved · he guessed right' : 'saved') : kind === 'over' ? 'over the bar' : G.ball.post ? 'off the post' : 'wide');
  }
  renderHud();
}

/* ================= update ================= */
function update(dt) {
  G.time += dt; G.phaseT += dt;
  const b = G.ball, k = G.keeper;
  if (G.phase === 'runup') {
    G.kicker.t += dt;
    if (G.kicker.t >= .36) strike();
  } else if (G.phase === 'flight') {
    if (!G.result) {
      if (b.saved && b.age > 1.6) resolve('saved');
      else if (G.phaseT > 2.8 || !b.live) resolve(b.saved ? 'saved' : 'wide');
    }
    if (G.result && G.phaseT > 0) { G.resultT = (G.resultT || 0) + dt; if (G.resultT > 1.7) nextKick(); }
  }
  const N = 8, h = dt / N;
  for (let s = 0; s < N; s++) { stepBall(b, h); stepKeeper(k, b, h); stepNet(h); }
  if (b.live && b.z < -6) b.live = false;
  for (const p of G.popups) p.t += dt;
  G.popups = G.popups.filter(p => p.t < 1.3);
}
function nextKick() {
  G.resultT = 0; G.result = null;
  G.kick++;
  if (G.kick >= KICKS) return finish();
  placeBall();
  setPhase('ready');
  sound('whistle');
  renderHud();
}
function finish() {
  setPhase('over');
  G.newBest = G.goals > G.best;
  if (G.newBest) { G.best = G.goals; saveBest(G.goals); }
  setStatus((G.newBest ? 'new best: ' : 'full time · ') + G.goals + ' of ' + KICKS + (G.newBest ? '' : ' · best ' + G.best) + ' · tap to play again');
  showOver('Full time', G.goals + ' of ' + KICKS + ' goals' + (G.newBest ? ' · new best' : ' · best ' + G.best));
  renderHud();
}

/* ================= drawing ================= */
function kickerPose() {
  const kk = G.kicker, ph = G.phase;
  if (ph === 'runup') {
    const u = clamp(kk.t / .36, 0, 1), s = Math.sin(u * Math.PI * 2.2);
    return { z: Math.abs(s) * .05, crouch: .12, lean: .2, footR: [-.2 - u * .5, Math.max(0, s) * .2], footL: [s * .4, Math.max(0, -s) * .15], hR: null, hL: null };
  }
  if (ph === 'flight' && G.phaseT < .5) {
    const u = clamp(G.phaseT / .25, 0, 1);
    return { crouch: .08, lean: -.12, footR: [lerp(-.6, .9, ease(u)), .15 + u * .35], footL: [-.1, 0] };
  }
  return { crouch: .06, lean: .06, footR: [-.25, 0], footL: [.15, 0] };
}
function drawAim() {
  if (G.phase !== 'ready' || !(G.swipe || G.keyPlan)) return;
  const plan = G.swipe ? planFromSwipe(G.swipe, false) : G.keyPlan;
  if (!plan) return;
  const curl = curlVec(plan.T, plan.bend), v = solveKick(plan.T, kickSpeed(.55), curl);
  const r = ghost([SPOT[0], SPOT[1], BALL_R], v, curl);
  const onTarget = Math.abs(plan.T[1]) < GW && plan.T[2] < GH;
  r.pts.forEach((q, i) => {
    if (i === 0) return;
    const p = project(q[0], q[1], q[2]), x = Math.round(p.sx), y = Math.round(p.sy);
    for (const [ox, oy] of [[-1, 0], [2, 0], [-1, 1], [2, 1], [0, -1], [1, -1], [0, 2], [1, 2]]) dot(x + ox, y + oy, INK);
    for (const [ox, oy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) dot(x + ox, y + oy, PAPER);
  });
  // target ring on the goal face
  const t = project(plan.T[0], plan.T[1], plan.T[2]), cx = Math.round(t.sx), cy = Math.round(t.sy);
  const col = onTarget ? SIGNAL : rgb(150, 156, 170);
  for (let a = 0; a < 6.283; a += .12) {
    const x = Math.round(cx + Math.cos(a) * 6), y = Math.round(cy + Math.sin(a) * 6);
    for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) dot(x + ox, y + oy, INK);
  }
  for (let a = 0; a < 6.283; a += .1) dot(Math.round(cx + Math.cos(a) * 6), Math.round(cy + Math.sin(a) * 6), col);
}
function draw() {
  pix.set(bakedPix);
  zb.set(bakedZ);
  const kk = G.kicker, run = G.phase === 'runup' ? clamp(kk.t / .36, 0, 1) : G.phase === 'ready' ? 0 : 1;
  const kx = lerp(kk.x, SPOT[0] + .55, ease(run)), ky = lerp(kk.y, .32, ease(run));
  player(kx, ky, Math.atan2(-ky, GX - kx) + .15, kickerPose(), KICKER_PAL);
  drawKeeper(G.keeper);
  const b = G.ball;
  if (b.z > -3) {
    const [svx, svy] = screenVel(b.vx, b.vy, b.vz);
    drawBall(b.x, b.y, b.z, b.spin, svx, svy);
    castShadow(b.x, b.y, b.z - BALL_R, BALL_R * .95, 1, 0);
    if (b.z < BALL_R + .1) castShadow(b.x, b.y, 0, BALL_R * .7, 2, 0);
  }
  drawNet();
  const windT = STILL ? 0 : Math.floor(G.time * WIND_FPS) / WIND_FPS;
  drawLeaves(windT);
  drawTufts(windT);
  flushShadows();
  applyShadows(bakedZ);
  shadeEdges();
  drawAim();
  const top = project(GX, 0, GH + .9);
  for (const p of G.popups) if (!(p.t > 1 && Math.floor(p.t * 14) % 2)) drawText(p.text, top.sx, Math.round(top.sy - 10 - p.t * 10), SIGNAL, 3);
  ctx.putImageData(image, 0, 0);
}

/* ================= hud ================= */
const nodes = { pts: document.getElementById('pts'), kicks: document.getElementById('kicks'), best: document.getElementById('best'), status: document.getElementById('status') };
function renderHud() {
  nodes.pts.textContent = G.goals;
  let h = '';
  for (let i = 0; i < KICKS; i++) {
    const v = G.results[i];
    h += '<i class="' + (v === 1 ? 'goal' : v === -1 ? 'saved' : v === 0 ? 'miss' : i === G.kick && G.phase !== 'over' ? 'now' : '') + '"></i>';
  }
  nodes.kicks.innerHTML = h;
  nodes.best.textContent = G.best ? 'best ' + G.best : '';
}
let statusText = '';
function setStatus(text) { if (text !== statusText) { statusText = text; nodes.status.textContent = text; } }

/* ================= input ================= */
const stage = document.getElementById('stage'), rules = document.getElementById('rules');
const toPoint = e => [e.clientX, e.clientY, performance.now()];
stage.addEventListener('pointerdown', e => {
  if (e.button > 0) return;
  ensureAudio();
  try { stage.setPointerCapture(e.pointerId); } catch (err) { /* older browsers */ }
  canvas.focus({ preventScroll: true });
  if (G.phase === 'over') { if (G.phaseT > .6) reset(); return; }
  if (G.phase !== 'ready') return;
  G.keyPlan = null;
  G.swipe = { pts: [toPoint(e)] };
});
stage.addEventListener('pointermove', e => {
  if (!G.swipe) return;
  const p = toPoint(e), last = G.swipe.pts[G.swipe.pts.length - 1];
  if (Math.hypot(p[0] - last[0], p[1] - last[1]) > 1.5) G.swipe.pts.push(p);
});
function endSwipe(e) {
  if (!G.swipe) return;
  if (e) { const p = toPoint(e), last = G.swipe.pts[G.swipe.pts.length - 1]; if (Math.hypot(p[0] - last[0], p[1] - last[1]) > 1.5) G.swipe.pts.push(p); }
  const plan = planFromSwipe(G.swipe, true);
  G.swipe = null;
  if (!plan || G.phase !== 'ready') { setStatus('flick towards the goal · a longer flick aims further'); return; }
  kick(plan);
}
stage.addEventListener('pointerup', endSwipe);
stage.addEventListener('pointercancel', () => { G.swipe = null; });
// keyboard: arrow keys place the target, space holds for power
const keyAim = { y: 0, z: 1.2, holding: 0 };
addEventListener('keydown', e => {
  if (rules.open || e.target.tagName === 'BUTTON') return;
  if (e.key.startsWith('Arrow')) {
    e.preventDefault();
    if (G.phase !== 'ready') return;
    keyAim.y = clamp(keyAim.y + (e.key === 'ArrowLeft' ? .3 : e.key === 'ArrowRight' ? -.3 : 0), -GW - .5, GW + .5);
    keyAim.z = clamp(keyAim.z + (e.key === 'ArrowUp' ? .2 : e.key === 'ArrowDown' ? -.2 : 0), .2, GH + .5);
    G.keyPlan = { T: [GX, keyAim.y, keyAim.z], bend: 0, power: .55 };
    return;
  }
  if (e.key !== ' ' && e.key !== 'Enter') return;
  e.preventDefault();
  ensureAudio();
  if (e.repeat) return;
  if (G.phase === 'over') { if (G.phaseT > .6) reset(); return; }
  if (G.phase === 'ready') keyAim.holding = performance.now();
});
addEventListener('keyup', e => {
  if ((e.key !== ' ' && e.key !== 'Enter') || !keyAim.holding || G.phase !== 'ready') return;
  const held = (performance.now() - keyAim.holding) / 1000;
  keyAim.holding = 0;
  G.keyPlan = null;
  kick({ T: [GX, keyAim.y, keyAim.z], bend: 0, power: clamp(held / .8, 0, 1) });
});
document.getElementById('rules-open').addEventListener('click', () => rules.showModal());
rules.addEventListener('click', e => { if (e.target === rules) rules.close(); });
rules.addEventListener('close', () => canvas.focus({ preventScroll: true }));

/* ================= sound ================= */
function sound(kind, amt = .6) {
  if (!audio || muted) return;
  if (kind === 'kick') { tone(140, 60, .12, .35 * amt + .05, 'sine'); hiss(.05, 800, .8, .1 * amt); }
  else if (kind === 'bounce') tone(120, 60, .09, .2 * amt + .02, 'sine');
  else if (kind === 'post') { tone(1500, 1380, .5, .07 * amt + .03, 'triangle'); tone(2250, 2100, .4, .04 * amt + .02, 'sine'); }
  else if (kind === 'save') { tone(170, 80, .1, .25, 'sine'); hiss(.08, 700, .7, .12); }
  else if (kind === 'net') hiss(.3, 1400, .5, .16);
  else if (kind === 'cheer') { hiss(1.2, 1100, .3, .12); hiss(1, 2400, .4, .06, .1); tone(523, 523, .14, .04, 'triangle', .05); tone(784, 784, .22, .04, 'triangle', .16); }
  else if (kind === 'groan') hiss(.8, 500, .4, .08);
  else if (kind === 'whistle') { tone(2300, 2350, .12, .05, 'sine'); tone(2300, 2320, .3, .05, 'sine', .16); }
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
window.__penalty = { G, update, draw, kick, planFromSwipe, project, planePoint, SPOT, GX, GW, GH, BALL_R };
