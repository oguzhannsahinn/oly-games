/* ================= the court ================= */
const GRAV = 13, BALL_R = .22, RIM_R = .4, RIM_T = .035;
const BOARD = { x0: -5.52, x1: -5.4, y0: -1.1, y1: 1.1, z0: 3.42, z1: 4.72, bounce: .6, sound: 'board' };
const RIM_X = BOARD.x1 + .13 + RIM_R, RIM_Z = 3.72;
const POLE = { x0: -6.8, x1: -6.52, y0: -.14, y1: .14, z0: 0, z1: 4.5, bounce: .5, sound: 'board' };
const ARM = { x0: -6.52, x1: BOARD.x0, y0: -.09, y1: .09, z0: 3.96, z1: 4.1, bounce: .5, sound: 'board' };
const COLLIDERS = [BOARD, POLE, ARM];
const COURT = { x0: -6, x1: 3.6, y: 6.4 };
const ARC_R = 6.1, CORNER_Y = 5.3, ARC_JOIN = RIM_X + Math.sqrt(ARC_R * ARC_R - CORNER_Y * CORNER_Y);
const KEY_Y = 1.55, FT_X = RIM_X + 3.85, FT_R = 1.55;
const ISLAND = { cx: -1.2, ax: 7.05, ay: 8.9 };
const RACK_H = .6;

const C_IN = [98, 134, 162], C_OUT = [82, 116, 148], C_KEY = [178, 96, 70], C_LINE = [238, 234, 220];
const C_ASPHALT = [100, 98, 104];
const C_POLE = [64, 72, 88], C_PAD = [52, 86, 140], C_BOARD = [236, 236, 230], C_BOARD_LINE = [44, 48, 62];
const C_RIM = [222, 92, 42], C_METAL = [150, 156, 166], C_WOOD = [150, 106, 64], C_WOOD_D = [118, 82, 50];
const C_BAG = [44, 84, 120], C_BOTTLE = [72, 140, 170];
const NET_FRONT = rgb(246, 244, 236), NET_BACK = rgb(176, 174, 186);
const BALL_C = [208, 104, 44], SEAM_C = [64, 40, 34];
const MONEY_C = [[204, 54, 46], [240, 236, 226], [46, 82, 156]];
const SHOOTER = { jersey: [200, 62, 50], shorts: [178, 52, 44], skin: [196, 144, 106], hair: [36, 28, 24], sock: [242, 240, 232], shoe: [48, 46, 58] };
const FAN = { jersey: [74, 124, 96], shorts: [62, 68, 90], shin: [62, 68, 90], sock: [62, 68, 90], sleeve: [74, 124, 96], skin: [224, 176, 138], hair: [124, 86, 54], shoe: [232, 228, 218] };
const FAN_POS = [-.05, -6.95];

function islandEdge(x, y) { return Math.pow(Math.pow(Math.abs(x - ISLAND.cx) / ISLAND.ax, 4) + Math.pow(Math.abs(y) / ISLAND.ay, 4), .25); }
const onIsland = (x, y) => islandEdge(x, y) < .97;

// five racks: corner, wing, top, wing, corner. Each rack runs across the screen beside its shooter,
// at the same depth, so it never hides him and never reads as a tower pointing at the camera
const ACROSS = [1 / R2, -1 / R2];
const SPOTS = [[-82, 5.7, 1], [-45, 6.45, 1], [0, 6.45, 1], [45, 6.45, -1], [82, 5.7, -1]].map(([deg, r, side]) => {
  const a = deg * Math.PI / 180, out = [Math.cos(a), Math.sin(a)];
  const x = RIM_X + out[0] * r, y = out[1] * r;
  const dir = [ACROSS[0] * side, ACROSS[1] * side];
  return { x, y, dir, rack: [x + dir[0] * 1.65, y + dir[1] * 1.65], dist: r };
});
function rackBall(r, k) {
  const s = SPOTS[r], o = (k - 2) * .46;
  return [s.rack[0] + s.dir[0] * o, s.rack[1] + s.dir[1] * o, RACK_H + BALL_R + .01];
}

function courtLine(x, y) {
  const L = .07, ay = Math.abs(y);
  if (Math.abs(x - COURT.x0) < L && ay <= COURT.y + L) return true;
  if (Math.abs(x - COURT.x1) < L && ay <= COURT.y + L) return true;
  if (Math.abs(ay - COURT.y) < L && x >= COURT.x0 - L && x <= COURT.x1 + L) return true;
  if (x >= COURT.x0 && x <= FT_X + L && Math.abs(ay - KEY_Y) < L) return true;
  if (Math.abs(x - FT_X) < L && ay <= KEY_Y) return true;
  const dr = Math.hypot(x - RIM_X, y), df = Math.hypot(x - FT_X, y);
  if (Math.abs(df - FT_R) < L && (x >= FT_X || Math.sin(Math.atan2(y, x - FT_X) * 9) > 0)) return true;
  if (x <= ARC_JOIN && x >= COURT.x0 && Math.abs(ay - CORNER_Y) < L) return true;
  if (x >= ARC_JOIN && Math.abs(dr - ARC_R) < L) return true;
  if (x >= RIM_X && Math.abs(dr - 1.05) < L) return true;
  if (x <= COURT.x1 && Math.abs(Math.hypot(x - COURT.x1, y) - 1.55) < L) return true;
  return false;
}
function pick(tones, v, ix, iy, dither = .6) { return tones[clamp(Math.floor(v * 4 + (bayerAt(ix, iy) - .5) * dither), 0, 3)]; }
function groundColor(x, y, ix, iy, i) {
  const edge = islandEdge(x, y), rough = edge + (noise(x * 1.3, y * 1.3) - .5) * .12;
  if (rough > 1.04) return 0;
  if (rough > .93 && hash(ix, iy) < (rough - .93) / .11) return 0;
  const fine = hash(ix, iy), ay = Math.abs(y);
  const onCourt = x >= COURT.x0 - .07 && x <= COURT.x1 + .07 && ay <= COURT.y + .07;
  if (onCourt) {
    kinds[i] = KIND_COURT;
    if (courtLine(x, y)) return rgb(...C_LINE);
    const inKey = x >= COURT.x0 && x <= FT_X && ay <= KEY_Y;
    const inArc = x < ARC_JOIN ? ay < CORNER_Y : Math.hypot(x - RIM_X, y) < ARC_R;
    const c = inKey ? C_KEY : inArc ? C_IN : C_OUT;
    // sun-bleached patches and scuffs where shooters stand
    let v = .5 + (noise(x * .6, y * .6) - .5) * .45 + (noise(x * 2.4, y * 2.4) - .5) * .1;
    for (const s of SPOTS) { const d = Math.hypot(x - s.x, y - s.y); if (d < 1) v -= (1 - d) * noise(x * 3, y * 3) * .35; }
    return pick(tonesOf(c), v, ix, iy, .35);
  }
  const out = Math.max(COURT.x0 - x, x - COURT.x1, ay - COURT.y);
  if (out < .85 + noise(x * 2.2, y * 2.2) * .7) {
    kinds[i] = KIND_ASPHALT;
    if (fine > .988) return rampOf(C_ASPHALT)[4];
    if (hash(ix - 1, iy - 1) > .988) return rampOf(C_ASPHALT)[1];
    return pick(tonesOf(C_ASPHALT), .5 + (noise(x * 3, y * 3) - .5) * .6, ix, iy, .45);
  }
  kinds[i] = KIND_GRASS;
  const t = noise(x * .9, y * .9) * 1.15 + (fine - .5) * .55 - .08;
  return rgb(...GRASS[clamp(Math.floor(t * 4.2), 0, 3)]);
}
// the light the spheres use, as a world vector, so thin plotted parts match them
const LX = -.246, LY = .532, LZ = .81;
function litLevel(nx, ny, nz) { return clamp(Math.floor(((nx * LX + ny * LY + nz * LZ) * .5 + .5) * 4.3 + .2), 1, 4); }
function drawBoard() {
  const b = BOARD, step = .6 / S, white = rampOf(C_BOARD), line = rampOf(C_BOARD_LINE);
  const paint = (x, y, z, c) => {
    const p = project(x, y, z), ix = p.sx | 0, iy = p.sy | 0;
    if (ix < 0 || iy < 0 || ix >= W || iy >= H) return;
    const i = iy * W + ix;
    if (p.d <= zb[i]) return;
    zb[i] = p.d; pix[i] = c;
  };
  for (let a = b.x0; a <= b.x1; a += step) for (let c = b.y0; c <= b.y1; c += step) paint(a, c, b.z1, line[3]);
  for (let a = b.x0; a <= b.x1; a += step) for (let c = b.z0; c <= b.z1; c += step) paint(a, b.y1, c, line[2]);
  for (let y = b.y0; y <= b.y1; y += step) for (let z = b.z0; z <= b.z1; z += step) {
    const border = Math.abs(y) > b.y1 - .075 || z < b.z0 + .075 || z > b.z1 - .075;
    const sq = Math.abs(y) < .32 && z > RIM_Z + .05 && z < RIM_Z + .5;
    const sqLine = sq && (Math.abs(y) > .32 - .05 || z < RIM_Z + .1 || z > RIM_Z + .5 - .05);
    let c;
    if (border || sqLine) c = line[3];
    else {
      // a faint diagonal sheen across the acrylic
      const sheen = (y * .8 + z * 1.4) % 1.1;
      c = white[sheen > .78 && sheen < .9 ? 4 : 3];
    }
    paint(b.x1, y, z, c);
  }
}
function drawRim() {
  const ramp = rampOf(C_RIM);
  for (let a = 0; a < 6.2832; a += .01) {
    const ca = Math.cos(a), sa = Math.sin(a);
    for (let k = 0; k < 8; k++) {
      const phi = k / 8 * 6.2832, cp = Math.cos(phi), sp = Math.sin(phi);
      const rr = RIM_R + RIM_T * cp;
      plot(RIM_X + ca * rr, sa * rr, RIM_Z + RIM_T * sp, ramp[litLevel(ca * cp, sa * cp, sp)]);
    }
  }
}
// a solid metal ball cart: a shallow tray on a lower body, short legs below
function drawRackFrame(s) {
  const side = [-s.dir[1], s.dir[0]], ramp = rampOf(C_METAL), step = .5 / S;
  const L = 1.15, Wd = .17, top = RACK_H, low = .2;
  const at = (o, w, z) => [s.rack[0] + s.dir[0] * o + side[0] * w, s.rack[1] + s.dir[1] * o + side[1] * w, z];
  const face = (n, fn, ua, ub, va, vb) => {
    const c = ramp[litLevel(n[0], n[1], n[2])];
    for (let u = ua; u <= ub; u += step) for (let v = va; v <= vb; v += step) { const q = fn(u, v); plot(q[0], q[1], q[2], c); }
  };
  for (const sg of [-1, 1]) {
    face([side[0] * sg, side[1] * sg, 0], (u, v) => at(u, Wd * sg, v), -L, L, low, top);
    face([s.dir[0] * sg, s.dir[1] * sg, 0], (u, v) => at(L * sg, u, v), -Wd, Wd, low, top);
  }
  face([0, 0, 1], (u, v) => at(u, v, top), -L, L, -Wd, Wd);
  // a darker groove along the tray where the balls sit
  const groove = ramp[1];
  for (let u = -L + .06; u <= L - .06; u += step) { const q = at(u, 0, top + .002); plot(q[0], q[1], q[2], groove); }
  const metal = () => C_METAL;
  for (const o of [-L + .1, L - .1]) for (const w of [-Wd + .05, Wd - .05]) {
    const q = at(o, w, 0);
    capsule(q, [q[0], q[1], low], .05, .05, metal, 'solid');
  }
  for (let o = -L; o <= L; o += .12) for (const w of [-Wd, 0, Wd]) {
    const q = at(o, w, 0);
    castShadow(q[0], q[1], top, .09, 1, 0);
    castShadow(q[0], q[1], low + .1, .1, 1, 0);
  }
}
function bake() {
  zb.fill(-1e9);
  pix.fill(CLEAR);
  for (let iy = 0; iy < H; iy++) for (let ix = 0; ix < W; ix++) {
    const g = unproject(ix + .5, iy + .5), i = iy * W + ix, c = groundColor(g.x, g.y, ix, iy, i);
    if (!c) continue;
    pix[i] = c; ground[i] = 1;
    zb[i] = (g.x + g.y) / R2 * COS;
  }
  growGrass();
  groundZ.set(zb);

  // the hoop: padded post, arm and brace, backboard, rim
  box(POLE.x0 - .08, POLE.y0 - .08, 0, POLE.x1 + .08, POLE.y1 + .08, 1.3, C_PAD, 3);
  box(POLE.x0, POLE.y0, 1.3, POLE.x1, POLE.y1, POLE.z1, C_POLE, 2);
  box(ARM.x0, ARM.y0, ARM.z0, ARM.x1, ARM.y1, ARM.z1, C_POLE, 5);
  capsule([POLE.x1, 0, 3.25], [BOARD.x0, 0, 3.98], .045, .045, () => C_POLE, 'solid');
  drawBoard();
  box(BOARD.x1, -.07, RIM_Z - .12, RIM_X - RIM_R + .01, .07, RIM_Z - .03, C_RIM, 1);
  drawRim();
  for (let z = .2; z <= POLE.z1; z += .1) castShadow(-6.66, 0, z, .17);
  for (let x = ARM.x0; x <= ARM.x1; x += .1) castShadow(x, 0, 4.03, .1);
  for (let y = BOARD.y0; y <= BOARD.y1; y += .1) for (let z = BOARD.z0; z <= BOARD.z1; z += .1) castShadow(-5.46, y, z, .11);
  for (let a = 0; a < 6.283; a += .15) castShadow(RIM_X + Math.cos(a) * RIM_R, Math.sin(a) * RIM_R, RIM_Z, .05);

  for (const s of SPOTS) drawRackFrame(s);

  // bench, bag and a bottle on the far sideline
  const BX = -1.45;
  box(BX, -7.75, .46, BX + 2, -7.25, .56, C_WOOD, 3);
  box(BX, -7.88, .66, BX + 2, -7.78, 1.12, C_WOOD_D, 4);
  for (const x of [BX + .15, BX + 1.75]) box(x, -7.8, 0, x + .12, -7.3, .46, C_POLE, 5);
  box(BX + .25, -7.6, .56, BX + .95, -7.3, .84, C_BAG, 6);
  for (let x = BX; x <= BX + 2; x += .25) { castShadow(x, -7.5, .5, .3); castShadow(x, -7.83, .9, .12); }
  castShadow(BX + .6, -7.45, .7, .35);
  capsule([BX + 2.35, -6.95, .05], [BX + 2.35, -6.95, .42], .1, .07, () => C_BOTTLE, 'gloss');
  castShadow(BX + 2.35, -6.95, .25, .12);

  growTree(-7.35, 5.3, .86, 440, 0);
  growTree(3.35, -6.95, .66, 300, 99);

  bakeOcclusion();
  staticShadow.set(shadowMask);
  applyShadows(groundZ);
  bakedPix.set(pix);
  bakedZ.set(zb);
}

/* ================= ball ================= */
function drawBall(x, y, z, spin, svx, svy, money) {
  const p = project(x, y, z), rp = BALL_R * S;
  let ax = -svy, ay = svx;
  const al = Math.hypot(ax, ay);
  if (al < 1e-4) { ax = .8; ay = .6; } else { ax /= al; ay /= al; }
  // spin about an axis in the screen plane, square to the motion, so the seams roll the right way
  const c = Math.cos(spin), s = Math.sin(spin), t = 1 - c;
  const m00 = c + ax * ax * t, m01 = ax * ay * t, m02 = ay * s;
  const m10 = ax * ay * t, m11 = c + ay * ay * t, m12 = -ax * s;
  const m20 = -ay * s, m21 = ax * s, m22 = c;
  const ramp = rampOf(BALL_C), seam = rampOf(SEAM_C);
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
    const qx = m00 * dx + m01 * dy + m02 * nz, qy = m10 * dx + m11 * dy + m12 * nz, qz = m20 * dx + m21 * dy + m22 * nz;
    let col;
    if (money) col = rampOf(MONEY_C[qy < -.33 ? 0 : qy > .33 ? 2 : 1])[lvl];
    else col = Math.abs(qx) < .14 || Math.abs(qz) < .14 ? seam[Math.max(1, lvl - 1)] : ramp[lvl];
    zb[i] = d;
    pix[i] = col;
  }
}
const screenVel = (vx, vy, vz) => [(vx - vy) / R2 * S, ((vx + vy) / R2 * SIN - vz * COS) * S];

/* ================= net ================= */
const NET = { ox: 0, oy: 0, oz: 0, fl: 0, vx: 0, vy: 0, vz: 0, vf: 0 };
const NET_LEVELS = [[1, 0], [.86, -.2], [.75, -.4], [.67, -.58]], NET_N = 14;
function stepNet(dt) {
  const k = 120, c = 9;
  for (const [o, v] of [['ox', 'vx'], ['oy', 'vy'], ['oz', 'vz'], ['fl', 'vf']]) {
    NET[v] += (-k * NET[o] - c * NET[v]) * dt;
    NET[o] += NET[v] * dt;
  }
}
function netPoint(j, k) {
  const [rf, dz] = NET_LEVELS[j], f = j / 3, a = (k + j * .5) / NET_N * 6.2832;
  const r = RIM_R * rf * (1 + NET.fl * f * .5) - (j ? 0 : .01);
  return [RIM_X + Math.cos(a) * r + NET.ox * f, Math.sin(a) * r + NET.oy * f, RIM_Z - RIM_T + dz + NET.oz * f];
}
function drawNet() {
  const mid = project(RIM_X, 0, RIM_Z - .3).d;
  const line = (a, b) => {
    const pa = project(a[0], a[1], a[2]), pb = project(b[0], b[1], b[2]);
    const n = Math.ceil(Math.hypot(pb.sx - pa.sx, pb.sy - pa.sy) * 1.5) + 1;
    for (let s = 0; s <= n; s++) {
      const t = s / n, x = lerp(a[0], b[0], t), y = lerp(a[1], b[1], t), z = lerp(a[2], b[2], t);
      plot(x, y, z, project(x, y, z).d > mid ? NET_FRONT : NET_BACK);
    }
  };
  for (let j = 0; j < 3; j++) for (let k = 0; k < NET_N; k++) {
    const a = netPoint(j, k);
    line(a, netPoint(j + 1, k));
    line(a, netPoint(j + 1, (k + NET_N - 1) % NET_N));
  }
}

/* ================= pixel text ================= */
const FONT = {
  '+': ['...', '.X.', 'XXX', '.X.', '...'], '0': ['XXX', 'X.X', 'X.X', 'X.X', 'XXX'], '1': ['.X.', 'XX.', '.X.', '.X.', 'XXX'],
  '2': ['XXX', '..X', 'XXX', 'X..', 'XXX'], '3': ['XXX', '..X', '.XX', '..X', 'XXX'],
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
const DURATION = 50, SHOT_ANGLE = .94, BAND = .06, DEAD = .035, AIM_LONG = .07;
const RELEASE = .12, SHOOT_T = .42, RELOAD_T = .3, BEST_KEY = 'three-point-best';
function loadBest() { try { return +localStorage.getItem(BEST_KEY) || 0; } catch (e) { return 0; } }
function saveBest(v) { try { localStorage.setItem(BEST_KEY, String(v)); } catch (e) { /* storage may be off */ } }
const G = { best: loadBest() };
function reset() {
  Object.assign(G, {
    phase: 'reload', phaseT: 0, time: G.time || 0, clock: DURATION, running: false, timeUp: false, started: false,
    rack: 0, k: 0, taken: [0, 0, 0, 0, 0], results: SPOTS.map(() => [0, 0, 0, 0, 0]),
    score: 0, streak: 0, misses: 0, power: 0, chargeT: 0, target: .6, sweep: .8,
    jitter: SPOTS.map(() => (Math.random() - .5) * .14),
    sx: SPOTS[0].x, sy: SPOTS[0].y, yaw: 0, runPhase: 0, from: null, to: null, moveDur: 1,
    balls: [], popups: [], pressing: false, released: false, shotDelta: 0, cheer: 0, newBest: false, lastTick: 99,
  });
  G.yaw = hoopYaw(G.sx, G.sy);
  for (const k in NET) NET[k] = 0;
  startReload();
  setStatus('hold, let go when the bar hits the green');
  renderHud();
}
const hoopYaw = (x, y) => Math.atan2(-y, RIM_X - x);
function lerpAngle(a, b, t) { let d = b - a; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return a + d * t; }
function setPhase(p) { G.phase = p; G.phaseT = 0; }
function toLocal(w) {
  const fx = Math.cos(G.yaw), fy = Math.sin(G.yaw), dx = w[0] - G.sx, dy = w[1] - G.sy;
  return [dx * fx + dy * fy, -dx * fy + dy * fx, w[2]];
}
function startReload() {
  G.yaw = hoopYaw(G.sx, G.sy);
  G.grab = toLocal(rackBall(G.rack, G.k));
  G.taken[G.rack] = G.k + 1;
  const money = G.k === 4;
  const s = SPOTS[G.rack], D = Math.hypot(s.x - RIM_X, s.y);
  G.target = clamp(.5 + (D - 5.2) * .16 + G.jitter[G.rack] + (money ? .05 : 0), .42, .88);
  // the bar speeds up rack by rack, and a little more for the money ball
  G.sweep = (.8 - G.rack * .03) * (money ? .88 : 1);
  setPhase('reload');
}
function beginCharge() {
  if (G.timeUp) return;
  if (!G.started) { G.started = true; G.running = true; }
  G.chargeT = 0; G.power = 0;
  setPhase('charge');
}
function shoot() {
  G.released = false;
  G.shotDelta = G.power - G.target;
  setPhase('shoot');
  sound('release');
}
function launch() {
  G.released = true;
  const pose = shooterPose(RELEASE);
  const fx = Math.cos(G.yaw), fy = Math.sin(G.yaw);
  const b0 = pose.ball, x = G.sx + fx * b0[0] - fy * b0[1], y = G.sy + fy * b0[0] + fx * b0[1], z = b0[2] + (pose.z || 0);
  // aim a touch past the centre of the rim, as shooters do, so short and long misses are equally likely
  const dx = RIM_X - x, dy = -y, D = Math.hypot(dx, dy) + AIM_LONG, dz = RIM_Z - z;
  const ca = Math.cos(SHOT_ANGLE), ta = Math.tan(SHOT_ANGLE);
  const v = Math.sqrt(GRAV * D * D / (2 * ca * ca * Math.max(.5, D * ta - dz)));
  const delta = G.shotDelta, off = Math.sign(delta) * Math.max(0, Math.abs(delta) - DEAD);
  // the further off, the faster it grows, so a bar held to the top never banks in by habit
  const k = 1 + off * .25 + off * Math.abs(off) * .6 + delta * .02;
  const h = Math.atan2(dy, dx) + (Math.random() - .5) * .01 + (Math.random() - .5) * Math.abs(delta) * .12;
  const money = G.k === 4;
  G.balls.push({
    x, y, z, pz: z, vx: Math.cos(h) * v * ca * k, vy: Math.sin(h) * v * ca * k, vz: v * Math.sin(SHOT_ANGLE) * k,
    spin: 0, money, rack: G.rack, k: G.k, delta, resolved: false, touched: false, age: 0,
  });
}
function afterShot() {
  if (G.timeUp) return setPhase('idle');
  G.k++;
  if (G.k < 5) return startReload();
  G.k = 0; G.rack++;
  if (G.rack >= SPOTS.length) { G.rack = SPOTS.length - 1; G.k = 5; return setPhase('idle'); }
  G.from = [G.sx, G.sy]; G.to = [SPOTS[G.rack].x, SPOTS[G.rack].y];
  G.moveDur = Math.hypot(G.to[0] - G.from[0], G.to[1] - G.from[1]) / 6.5 + .15;
  setPhase('move');
  renderHud();
}
function scored(b) {
  b.resolved = true;
  const pts = b.money ? 2 : 1;
  G.score += pts; G.streak++;
  G.results[b.rack][b.k] = 1;
  G.popups.push({ text: '+' + pts, t: 0, money: b.money });
  NET.vz -= 3.4; NET.vf += 4; NET.vx += b.vx * .3; NET.vy += b.vy * .3;
  if (!b.touched) sound('swish');
  sound(b.money ? 'money' : 'score');
  if (b.money || G.streak >= 3) G.cheer = 1.1;
  if (!G.timeUp) setStatus(b.money ? 'money ball, 2 points' : G.streak >= 3 ? G.streak + ' in a row' : b.touched ? 'rolled in' : 'swish');
  renderHud();
}
function missed(b) {
  b.resolved = true;
  G.results[b.rack][b.k] = -1;
  G.streak = 0; G.misses++;
  if (!G.timeUp) {
    const d = b.delta;
    setStatus(Math.abs(d) <= BAND ? 'in and out' : d < 0 ? (G.misses < 3 ? 'short · let go in the green' : 'short') : (G.misses < 3 ? 'long · let go a little sooner' : 'long'));
  }
  renderHud();
}
function finish() {
  setPhase('over');
  G.newBest = G.score > G.best;
  if (G.newBest) { G.best = G.score; saveBest(G.best); }
  const all = G.results.every(r => r.every(v => v !== 0));
  const head = all && !G.timeUp ? 'all racks done' : 'time';
  setStatus(G.newBest ? 'new best: ' + G.score + ' points · tap to play again' : head + ' · ' + G.score + ' points · best ' + G.best + ' · tap to play again');
  showOver(all && !G.timeUp ? 'All racks!' : "Time's up", G.score + ' points' + (G.newBest ? ' · new best' : ' · best ' + G.best));
  renderHud();
}

/* ================= physics ================= */
function hitRim(b) {
  const rx = b.x - RIM_X, ry = b.y, hd = Math.hypot(rx, ry) || 1e-6;
  let nx = b.x - (RIM_X + rx / hd * RIM_R), ny = b.y - ry / hd * RIM_R, nz = b.z - RIM_Z;
  const d = Math.hypot(nx, ny, nz), min = BALL_R + RIM_T;
  if (d >= min || d < 1e-6) return;
  nx /= d; ny /= d; nz /= d;
  b.x += nx * (min - d); b.y += ny * (min - d); b.z += nz * (min - d);
  const vn = b.vx * nx + b.vy * ny + b.vz * nz;
  if (vn < 0) {
    b.vx -= 1.5 * vn * nx; b.vy -= 1.5 * vn * ny; b.vz -= 1.5 * vn * nz;
    // iron is never quite round: a small random kick keeps rim rolls from repeating
    const kick = -vn * .14;
    b.vx = b.vx * .93 + (Math.random() - .5) * kick; b.vy = b.vy * .93 + (Math.random() - .5) * kick; b.vz *= .93;
    if (-vn > .5) {
      sound('rim', Math.min(1, -vn / 7));
      NET.vx += (Math.random() - .5) * 1.6; NET.vy += (Math.random() - .5) * 1.6;
    }
    b.touched = true;
  }
  // a ball balanced on the iron always falls one way or the other
  if (Math.hypot(b.vx, b.vy, b.vz) < .4) { b.vx += (Math.random() - .5) * .8; b.vy += (Math.random() - .5) * .8; }
}
function hitBox(b, c) {
  const qx = clamp(b.x, c.x0, c.x1), qy = clamp(b.y, c.y0, c.y1), qz = clamp(b.z, c.z0, c.z1);
  let nx = b.x - qx, ny = b.y - qy, nz = b.z - qz;
  const d = Math.hypot(nx, ny, nz);
  if (d >= BALL_R) return;
  if (d < 1e-6) { nx = 1; ny = 0; nz = 0; b.x = c.x1; } else { nx /= d; ny /= d; nz /= d; }
  const push = BALL_R - Math.max(d, 0);
  b.x += nx * push; b.y += ny * push; b.z += nz * push;
  const vn = b.vx * nx + b.vy * ny + b.vz * nz;
  if (vn >= 0) return;
  b.vx -= (1 + c.bounce) * vn * nx; b.vy -= (1 + c.bounce) * vn * ny; b.vz -= (1 + c.bounce) * vn * nz;
  b.vx *= .92; b.vy *= .92; b.vz *= .92;
  if (nz > .9 && Math.hypot(b.vx, b.vy) < .3) b.vx += .5;
  if (-vn > .6) { sound(c.sound, Math.min(1, -vn / 8)); b.touched = true; }
}
function stepBall(b, dt) {
  b.pz = b.z; b.age += dt;
  const land = onIsland(b.x, b.y);
  const resting = land && b.z <= BALL_R + 1e-4 && b.vz <= 0;
  if (!resting) { b.vz -= GRAV * dt; b.z += b.vz * dt; }
  b.x += b.vx * dt; b.y += b.vy * dt;
  const rx = b.x - RIM_X, hd = Math.hypot(rx, b.y);
  // the net funnels and slows a ball dropping through it
  if (hd < RIM_R && b.z < RIM_Z && b.z > RIM_Z - .6) {
    const k = Math.min(1, dt * 5);
    b.vx -= (b.vx + rx * 3) * k; b.vy -= (b.vy + b.y * 3) * k; b.vz *= 1 - dt * 1.6;
  }
  if (!b.resolved && b.pz >= RIM_Z && b.z < RIM_Z && hd < RIM_R) scored(b);
  hitRim(b);
  for (const c of COLLIDERS) hitBox(b, c);
  if (land && b.z < BALL_R && b.pz >= BALL_R - .25) {
    b.z = BALL_R;
    if (b.vz < -1.2) { sound('bounce', Math.min(1, -b.vz / 9)); b.vz = -b.vz * .72; b.vx *= .9; b.vy *= .9; }
    else b.vz = 0;
  }
  if (resting) {
    const sp = Math.hypot(b.vx, b.vy);
    if (sp > 0) {
      const n = Math.max(0, sp - 1.5 * dt);
      if (n < .02) { b.vx = 0; b.vy = 0; } else { b.vx *= n / sp; b.vy *= n / sp; }
    }
    b.spin += sp / BALL_R * dt;
  } else b.spin += dt * 11;
  if (!b.resolved && ((b.z < RIM_Z - .35 && b.vz < 0) || b.age > 7)) missed(b);
}
function collideBalls() {
  const list = G.balls;
  for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
    const a = list[i], b = list[j];
    const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z, dd = Math.hypot(dx, dy, dz);
    if (dd >= BALL_R * 2 || dd === 0) continue;
    const nx = dx / dd, ny = dy / dd, nz = dz / dd, o = (BALL_R * 2 - dd) / 2;
    a.x -= nx * o; a.y -= ny * o; a.z -= nz * o; b.x += nx * o; b.y += ny * o; b.z += nz * o;
    if (a.z < BALL_R) a.z = BALL_R;
    if (b.z < BALL_R) b.z = BALL_R;
    const rel = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny + (b.vz - a.vz) * nz;
    if (rel >= 0) continue;
    const imp = -(1 + .7) * rel / 2;
    a.vx -= imp * nx; a.vy -= imp * ny; a.vz -= imp * nz;
    b.vx += imp * nx; b.vy += imp * ny; b.vz += imp * nz;
  }
}

/* ================= update ================= */
const tri = u => 1 - Math.abs((u % 2) - 1);
function update(dt) {
  G.time += dt; G.phaseT += dt;
  if (G.running) {
    G.clock -= dt;
    const left = Math.ceil(G.clock);
    if (left <= 5 && left < G.lastTick && left > 0) { G.lastTick = left; sound('tick'); }
    if (G.clock <= 0) {
      G.clock = 0; G.running = false; G.timeUp = true;
      sound('buzzer');
      if (G.phase !== 'shoot') setPhase('idle');
      setStatus('time');
    }
  }
  if (G.phase === 'move') {
    const u = clamp(G.phaseT / G.moveDur, 0, 1), k = ease(u);
    G.sx = lerp(G.from[0], G.to[0], k); G.sy = lerp(G.from[1], G.to[1], k);
    G.runPhase += dt * 15;
    const run = Math.atan2(G.to[1] - G.from[1], G.to[0] - G.from[0]);
    G.yaw = u < .25 ? lerpAngle(hoopYaw(...G.from), run, u / .25) : lerpAngle(run, hoopYaw(G.sx, G.sy), clamp((u - .72) / .28, 0, 1));
    if (u >= 1) startReload();
  } else if (G.phase === 'reload') {
    if (G.phaseT >= RELOAD_T) {
      setPhase('set');
      if (G.pressing) beginCharge();
    }
  } else if (G.phase === 'charge') {
    G.chargeT += dt;
    G.power = tri(G.chargeT / G.sweep);
  } else if (G.phase === 'shoot') {
    if (!G.released && G.phaseT >= RELEASE) launch();
    if (G.phaseT >= SHOOT_T) afterShot();
  }
  const N = 8, h = dt / N;
  for (let s = 0; s < N; s++) {
    for (const b of G.balls) stepBall(b, h);
    collideBalls();
    stepNet(h);
  }
  for (let i = G.balls.length - 1; i >= 0; i--) {
    const b = G.balls[i];
    if (b.z < -6) { if (!b.resolved) missed(b); G.balls.splice(i, 1); }
  }
  for (const p of G.popups) p.t += dt;
  G.popups = G.popups.filter(p => p.t < 1.1);
  G.cheer = Math.max(0, G.cheer - dt);
  const shotsDone = G.timeUp || G.rack === SPOTS.length - 1 && G.k >= 5;
  if (G.phase !== 'over' && G.phase !== 'shoot' && shotsDone && G.balls.every(b => b.resolved)) finish();
  renderClock();
}

/* ================= poses ================= */
const chestBall = fr => [fr.shA + .34, 0, fr.shZ - .34];
const setBall = fr => [fr.shA + .14, .12, fr.shZ + .46];
const relBall = fr => [fr.shA + .3, .12, fr.shZ + .86];
const holdHands = B => ({ hR: [B[0] - .02, B[1] + .21, B[2] - .02], hL: [B[0] - .02, B[1] - .21, B[2] - .02] });
const shotHands = B => ({ hR: [B[0] - .17, B[1] + .02, B[2] - .1], hL: [B[0] + .01, B[1] - .2, B[2] - .02] });
const mix3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const STAND = { footR: [.12, 0], footL: [-.06, 0] };
function shooterPose(t = G.phaseT) {
  const ph = G.phase;
  if (ph === 'move') {
    const s = Math.sin(G.runPhase), c = Math.cos(G.runPhase), fr = body(.12, .22);
    return {
      z: Math.abs(c) * .07, crouch: .12, lean: .22,
      footR: [s * .5, Math.max(0, c) * .22], footL: [-s * .5, Math.max(0, -c) * .22],
      hR: [fr.shA - s * .42, .5, fr.shZ - .62 + Math.abs(s) * .1], hL: [fr.shA + s * .42, -.5, fr.shZ - .62 + Math.abs(s) * .1],
    };
  }
  if (ph === 'reload') {
    const u = clamp(t / RELOAD_T, 0, 1), e = ease(u), crouch = .35 * Math.sin(Math.PI * u), lean = .25 * Math.sin(Math.PI * u);
    const fr = body(crouch, lean), B = mix3(G.grab, chestBall(fr), e);
    B[2] += Math.sin(Math.PI * u) * .25;
    return { crouch, lean, ball: B, ...holdHands(B), ...STAND };
  }
  if (ph === 'set') {
    const fr = body(.1, .06), B = chestBall(fr);
    B[2] += Math.sin(G.time * 3) * .015;
    return { crouch: .1, lean: .06, ball: B, ...holdHands(B), ...STAND };
  }
  if (ph === 'charge') {
    const c = ease(clamp(G.chargeT / .16, 0, 1)), crouch = .1 + .32 * c + G.power * .06, lean = .06 + .04 * c;
    const fr = body(crouch, lean), B = mix3(chestBall(fr), setBall(fr), c);
    const a = holdHands(B), b = shotHands(B);
    return { crouch, lean, ball: B, hR: mix3(a.hR, b.hR, c), hL: mix3(a.hL, b.hL, c), ...STAND };
  }
  if (ph === 'shoot') {
    const u = clamp(t / SHOOT_T, 0, 1), z = .5 * Math.sin(Math.PI * u);
    const crouch = (.42 + G.power * .06) * (1 - ease(clamp(t / .1, 0, 1))) + .14 * ease(clamp((t - .3) / .12, 0, 1));
    const fr = body(crouch, .08), lift = Math.sin(Math.PI * u) * .07;
    const feet = { footR: [.12, lift], footL: [-.04, lift * 1.4] };
    if (t <= RELEASE) {
      const B = mix3(setBall(fr), relBall(fr), ease(t / RELEASE));
      return { z, crouch, lean: .08, ball: B, ...shotHands(B), ...feet };
    }
    const rb = relBall(fr);
    return { z, crouch, lean: .08, hR: [rb[0] + .2, rb[1] - .02, rb[2] - .02], hL: [rb[0] - .04, rb[1] - .3, rb[2] - .25], ...feet };
  }
  const fr = body(.04, .03);
  if (ph === 'over' && G.newBest) {
    return { z: Math.max(0, Math.sin(G.time * 8)) * .18, crouch: .04, lean: .03, hR: [fr.shA + .1, .5, fr.shZ + .85], hL: [fr.shA + .1, -.5, fr.shZ + .85] };
  }
  return { crouch: .04, lean: .03, footR: [.1, 0], footL: [-.1, 0] };
}
function fanPose() {
  const fr = body(.03, .02), breathe = Math.sin(G.time * 1.7) * .01;
  if (G.cheer > 0) {
    const hop = Math.max(0, Math.sin(G.cheer * 11)) * .16;
    return { z: hop, crouch: .03, lean: .02, hR: [fr.shA + .05, .5, fr.shZ + .82], hL: [fr.shA + .05, -.5, fr.shZ + .82] };
  }
  return { crouch: .03, lean: .02 + breathe, footR: [.1, 0], footL: [-.1, 0] };
}

/* ================= drawing ================= */
function drawMeter() {
  const ph = G.phase;
  if (!(ph === 'set' || ph === 'charge' || (ph === 'shoot' && G.phaseT < .55) || (ph === 'reload' && G.phaseT > .15))) return;
  const p = project(G.sx, G.sy, 1.3), h = 42, x0 = Math.round(p.sx) + 19, yb = Math.round(p.sy) + 8, yt = yb - h;
  for (let y = yt - 2; y <= yb + 1; y++) for (let x = x0 - 2; x <= x0 + 7; x++) dot(x, y, PAPER);
  for (let y = yt - 1; y <= yb; y++) for (let x = x0 - 1; x <= x0 + 6; x++) dot(x, y, INK);
  const flash = ph === 'shoot' && Math.abs(G.shotDelta) <= BAND && Math.floor(G.phaseT * 16) % 2 === 0;
  for (let row = 0; row < h; row++) {
    const y = yb - 1 - row, level = (row + .5) / h;
    const zone = Math.abs(level - G.target) <= BAND, filled = level <= G.power && ph !== 'reload' && ph !== 'set';
    const c = filled ? (zone ? rgb(86, 168, 80) : SIGNAL) : zone ? rgb(190, 226, 170) : rgb(240, 238, 232);
    for (let x = x0; x <= x0 + 5; x++) dot(x, y, flash ? PAPER : c);
  }
  const ty = yb - 1 - Math.round(G.target * h - .5);
  for (const [dx, dy] of [[8, 0], [9, -1], [9, 0], [9, 1], [10, -2], [10, -1], [10, 0], [10, 1], [10, 2], [11, -3], [11, -2], [11, -1], [11, 0], [11, 1], [11, 2], [11, 3]]) dot(x0 + dx, ty + dy, INK);
}
function drawPopups() {
  const p = project(RIM_X, 0, RIM_Z + 1);
  for (const pop of G.popups) {
    if (pop.t > .8 && Math.floor(pop.t * 14) % 2) continue;
    drawText(pop.text, p.sx, Math.round(p.sy - 12 - pop.t * 16), pop.money ? rgb(255, 176, 40) : SIGNAL);
  }
}
function draw() {
  pix.set(bakedPix);
  zb.set(bakedZ);
  const held = player(G.sx, G.sy, G.yaw, shooterPose(), SHOOTER);
  const fanYaw = Math.atan2(G.sy - FAN_POS[1], G.sx - FAN_POS[0]);
  player(FAN_POS[0], FAN_POS[1], fanYaw, fanPose(), FAN);
  if (held) {
    drawBall(held[0], held[1], held[2], G.k * 1.3 + G.rack, 0, 0, G.k === 4);
    pendingShadows.push(held, BALL_R, held, BALL_R);
  }
  for (let r = 0; r < SPOTS.length; r++) for (let k = G.taken[r]; k < 5; k++) {
    const p = rackBall(r, k);
    drawBall(p[0], p[1], p[2], r * 1.7 + k * .9, 0, 0, k === 4);
    castShadow(p[0], p[1], p[2] - BALL_R, BALL_R * .96, 1, 0);
  }
  for (const b of G.balls) {
    const [svx, svy] = screenVel(b.vx, b.vy, b.vz);
    drawBall(b.x, b.y, b.z, b.spin, svx, svy, b.money);
    if (b.z > -.5) {
      castShadow(b.x, b.y, b.z - BALL_R, BALL_R * .96, 1, 0);
      if (b.z < BALL_R + .1) castShadow(b.x, b.y, 0, BALL_R * .72, 2, 0);
    }
  }
  drawNet();
  const windT = STILL ? 0 : Math.floor(G.time * WIND_FPS) / WIND_FPS;
  drawLeaves(windT);
  drawTufts(windT);
  flushShadows();
  applyShadows(bakedZ);
  shadeEdges();
  drawMeter();
  drawPopups();
  ctx.putImageData(image, 0, 0);
}

/* ================= hud ================= */
const nodes = { pts: document.getElementById('pts'), best: document.getElementById('best'), racks: document.getElementById('racks'), clock: document.getElementById('clock'), status: document.getElementById('status') };
nodes.racks.innerHTML = SPOTS.map(() => '<span class="rack">' + '<i></i><i></i><i></i><i></i><i class="money"></i></span>').join('');
function renderHud() {
  nodes.pts.textContent = G.score;
  nodes.best.textContent = G.best ? 'best ' + G.best : '';
  [...nodes.racks.children].forEach((rack, r) => [...rack.children].forEach((el, k) => {
    const v = G.results[r][k];
    el.classList.toggle('hit', v === 1);
    el.classList.toggle('miss', v === -1);
    el.classList.toggle('now', v === 0 && r === G.rack && k === G.k && !G.timeUp && G.phase !== 'over');
  }));
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
function press() {
  ensureAudio();
  if (G.phase === 'over') { if (G.phaseT > .8) reset(); return; }
  G.pressing = true;
  if (G.phase === 'set') beginCharge();
}
function letGo() {
  if (!G.pressing) return;
  G.pressing = false;
  if (G.phase === 'charge') shoot();
}
stage.addEventListener('pointerdown', e => {
  if (e.button > 0) return;
  try { stage.setPointerCapture(e.pointerId); } catch (err) { /* older browsers */ }
  canvas.focus({ preventScroll: true });
  press();
});
stage.addEventListener('pointerup', letGo);
stage.addEventListener('pointercancel', () => { G.pressing = false; if (G.phase === 'charge') setPhase('set'); });
addEventListener('keydown', e => {
  if (rules.open || (e.key !== ' ' && e.key !== 'Enter')) return;
  if (e.target.tagName === 'BUTTON') return;
  e.preventDefault();
  if (!e.repeat) press();
});
addEventListener('keyup', e => { if (e.key === ' ' || e.key === 'Enter') letGo(); });
addEventListener('blur', () => { G.pressing = false; });
document.getElementById('rules-open').addEventListener('click', () => rules.showModal());
rules.addEventListener('click', e => { if (e.target === rules) rules.close(); });
rules.addEventListener('close', () => canvas.focus({ preventScroll: true }));

/* ================= sound ================= */
function sound(kind, amt = .6) {
  if (!audio || muted) return;
  if (kind === 'bounce') { tone(150, 60, .12, .3 * amt + .02, 'sine'); hiss(.05, 500, .8, .05 * amt); }
  else if (kind === 'rim') { tone(1250, 1060, .18, .06 * amt + .015, 'square'); tone(1900, 1720, .14, .035 * amt + .01, 'triangle'); }
  else if (kind === 'board') { tone(280, 120, .09, .2 * amt + .04, 'triangle'); hiss(.06, 900, .6, .07 * amt); }
  else if (kind === 'swish') hiss(.28, 2600, .6, .2);
  else if (kind === 'release') tone(320, 200, .07, .03, 'triangle');
  else if (kind === 'score') { tone(660, 660, .1, .05, 'triangle'); tone(990, 990, .14, .05, 'triangle', .08); }
  else if (kind === 'money') { tone(784, 784, .1, .06, 'triangle', .1); tone(988, 988, .1, .06, 'triangle', .19); tone(1318, 1318, .22, .06, 'triangle', .28); }
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
window.__uclik = { G, update, draw, press, letGo };
