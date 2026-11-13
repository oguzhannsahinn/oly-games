/* ================= the course ================= */
const BR = .14, CUP_R = .22, RAIL_R = .1, MAX_SPEED = 9.5, MAX_STROKES = 7;
const KIND_GREEN = 4;
const GREEN_A = [98, 172, 90], GREEN_B = [90, 162, 84], TEE_C = [62, 118, 70], SAND_C = [232, 206, 150], WATER_C = [74, 150, 206];
const WOOD = [150, 104, 66], BUMPER_C = [255, 106, 61], FLAG_C = [255, 106, 61], CUP_C = [34, 40, 58];
const MILL_C = [236, 230, 214], MILL_ROOF = [200, 70, 58], SAIL_C = [244, 240, 228];
const GOLFER = { jersey: [242, 190, 48], shorts: [36, 44, 66], skin: [222, 172, 132], hair: [130, 82, 46], sock: [244, 242, 236], shoe: [244, 242, 236] };
const rect = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
const oct = (cx, cy, r) => Array.from({ length: 10 }, (_, k) => [cx + Math.cos(k / 10 * 6.283) * r, cy + Math.sin(k / 10 * 6.283) * r]);
const HOLES = [
  { name: 'Warm-up', par: 2, green: rect(-5, -1.2, 5, 1.2), tee: [4, 0], cup: [-4, 0] },
  { name: 'Dogleg', par: 3, green: [[5.5, -1.2], [5.5, 1.2], [-1.2, 1.2], [-1.2, -4.8], [1.2, -4.8], [1.2, -1.2]], tee: [4.5, 0], cup: [0, -4] },
  { name: 'Bumpers', par: 3, green: rect(-5.5, -2, 5.5, 2), tee: [4.6, 0], cup: [-4.6, 0], bumpers: [[1.5, .75, .35], [1.5, -.85, .35], [-1.4, 0, .45], [-3.2, 1.15, .3], [-3.2, -1.15, .3]] },
  { name: 'The bridge', par: 3, green: rect(-5.5, -2.4, 5.5, 2.4), tee: [4.5, -1.2], cup: [-4.3, 1.4], water: [rect(-1.5, -2.4, 1.5, -.45), rect(-1.5, .45, 1.5, 2.4)] },
  { name: 'The slope', par: 3, green: rect(-5.5, -2.2, 5.5, 2.2), tee: [4.6, .8], cup: [-4.5, -.9], slope: { poly: rect(-2, -2.2, 2, 2.2), ax: 0, ay: 2.4 }, sand: [oct(-3, .95, .8)] },
  { name: 'Windmill', par: 3, green: rect(-5.8, -1.6, 5.8, 1.6), tee: [4.8, 0], cup: [-4.6, 0], walls: [[0, -1.6, 0, -.55], [0, .55, 0, 1.6]], mill: { x: 0, y: 0 } },
];
const PAR_TOTAL = HOLES.reduce((a, h) => a + h.par, 0);

const LX = -.246, LY = .532, LZ = .81;
function litLevel(nx, ny, nz) { return clamp(Math.floor(((nx * LX + ny * LY + nz * LZ) * .5 + .5) * 4.3 + .2), 1, 4); }
function pick(tones, v, ix, iy, dither = .6) { return tones[clamp(Math.floor(v * 4 + (bayerAt(ix, iy) - .5) * dither), 0, 3)]; }
function inPoly(x, y, poly) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c;
  }
  return c;
}
let HOLE = HOLES[0], ISLAND = { cx: 0, cy: 0, ax: 7, ay: 3 };
function islandEdge(x, y) { return Math.pow(Math.pow(Math.abs(x - ISLAND.cx) / ISLAND.ax, 4) + Math.pow(Math.abs(y - ISLAND.cy) / ISLAND.ay, 4), .25); }
// every straight rail: the green's outline plus any walls inside it
function rails(h) {
  const out = [];
  h.green.forEach((p, i) => { const q = h.green[(i + 1) % h.green.length]; out.push([p[0], p[1], q[0], q[1]]); });
  for (const w of h.walls || []) out.push(w);
  return out;
}

function groundColor(x, y, ix, iy, i) {
  const edge = islandEdge(x, y), rough = edge + (noise(x * 1.3, y * 1.3) - .5) * .12;
  if (rough > 1.04) return 0;
  if (rough > .93 && hash(ix, iy) < (rough - .93) / .11) return 0;
  const h = HOLE;
  if (inPoly(x, y, h.green)) {
    kinds[i] = KIND_GREEN;
    if (Math.hypot(x - h.cup[0], y - h.cup[1]) < CUP_R) return rgb(...CUP_C);
    if (Math.hypot(x - h.cup[0], y - h.cup[1]) < CUP_R + .06) return rampOf(GREEN_A)[4];
    for (const w of h.water || []) if (inPoly(x, y, w)) {
      const ripple = Math.sin(x * 5 + Math.sin(y * 3) * 1.5) > .82;
      return ripple ? rampOf(WATER_C)[4] : pick(tonesOf(WATER_C), .5 + (noise(x * 2, y * 2) - .5) * .5, ix, iy, .4);
    }
    for (const sd of h.sand || []) if (inPoly(x, y, sd)) return pick(tonesOf(SAND_C), .5 + (noise(x * 5, y * 5) - .5) * .9, ix, iy, .6);
    if (Math.abs(x - h.tee[0]) < .45 && Math.abs(y - h.tee[1]) < .45) return pick(tonesOf(TEE_C), .5, ix, iy, .3);
    // chevrons on the slope, pointing the way it falls
    if (h.slope && inPoly(x, y, h.slope.poly)) {
      const along = (x * h.slope.ax + y * h.slope.ay) / Math.hypot(h.slope.ax, h.slope.ay), across = (-x * h.slope.ay + y * h.slope.ax) / Math.hypot(h.slope.ax, h.slope.ay);
      const ch = ((along - Math.abs((across % 1.2 + 1.2) % 1.2 - .6) * .6) % .9 + .9) % .9;
      if (ch < .14) return rampOf(GREEN_A)[2];
    }
    const check = (Math.floor(x / .9) + Math.floor(y / .9)) & 1;
    return pick(tonesOf(check ? GREEN_A : GREEN_B), .5 + (noise(x * .8, y * .8) - .5) * .3, ix, iy, .3);
  }
  kinds[i] = KIND_GRASS;
  const t = noise(x * .9, y * .9) * 1.15 + (hash(ix, iy) - .5) * .55 - .08;
  return rgb(...GRASS[clamp(Math.floor(t * 4.2), 0, 3)]);
}
function bake() {
  const h = HOLE;
  const xs = h.green.map(p => p[0]), ys = h.green.map(p => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  ISLAND = { cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, ax: (x1 - x0) / 2 + 1.9, ay: (y1 - y0) / 2 + 1.9 };
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
  const wood = () => WOOD;
  for (const [ax, ay, bx, by] of rails(h)) {
    capsule([ax, ay, RAIL_R], [bx, by, RAIL_R], RAIL_R, RAIL_R, wood, 'solid');
    const n = Math.ceil(Math.hypot(bx - ax, by - ay) / .2);
    for (let k = 0; k <= n; k++) castShadow(lerp(ax, bx, k / n), lerp(ay, by, k / n), RAIL_R, .12, 1, 0);
  }
  for (const [x, y, r] of h.bumpers || []) {
    for (let z = 0; z <= .3; z += .06) sphere(x, y, z + .02, r, BUMPER_C, 'solid');
    sphere(x, y, .3, r * .7, [255, 160, 120], 'solid');
    castShadow(x, y, .2, r);
  }
  if (h.mill) drawMillBody(h.mill);
  // trees on the corners of the island, clear of the course
  const corners = [[x0 - 1.3, y1 + 1.2], [x1 + 1.1, y0 - 1.3], [x0 - 1.2, y0 - 1.1]];
  corners.forEach(([x, y], k) => { if (islandEdge(x, y) < .95 && !inPoly(x, y, h.green)) growTree(x, y, .5 - k * .06, 200, k * 37 + HOLES.indexOf(h) * 11); });
  bakeOcclusion();
  staticShadow.set(shadowMask);
  applyShadows(groundZ);
  bakedPix.set(pix);
  bakedZ.set(zb);
}
// the windmill: a tower astride the gap, with a tunnel underneath for the ball
function drawMillBody(m) {
  box(m.x - 1.3, m.y - 1.0, .5, m.x - .1, m.y + 1.0, 1.9, MILL_C, 3);
  box(m.x - 1.3, m.y - 1.0, 0, m.x - .1, m.y - .55, .5, MILL_C, 4);
  box(m.x - 1.3, m.y + .55, 0, m.x - .1, m.y + 1.0, .5, MILL_C, 5);
  for (let z = 1.9; z < 2.6; z += .05) { const k = (z - 1.9) / .7; box(m.x - 1.3 + k * .5, m.y - 1.0 + k * .9, z, m.x - .1 - k * .5, m.y + 1.0 - k * .9, z + .05, MILL_ROOF, 7); }
  for (let x = m.x - 1.3; x <= m.x - .1; x += .2) for (let y = m.y - 1; y <= m.y + 1; y += .2) castShadow(x, y, 1.5, .2);
}
const MILL_SPEED = 1.15, HUB_Z = 1.55, SAIL = 1.42;
function millAngle() { return G.time * MILL_SPEED; }
// the gap is shut while any sail hangs within this angle of straight down
function millBlocked() {
  const a = millAngle();
  for (let k = 0; k < 4; k++) {
    const ang = ((a + k * Math.PI / 2) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
    if (Math.abs(ang - Math.PI) < .3) return true;
  }
  return false;
}
function drawSails(m) {
  const a = millAngle(), hub = [m.x + .05, m.y, HUB_Z];
  for (let k = 0; k < 4; k++) {
    const ang = a + k * Math.PI / 2, dy = Math.sin(ang), dz = Math.cos(ang);
    const tip = [hub[0], hub[1] + dy * SAIL, hub[2] + dz * SAIL];
    capsule(hub, tip, .05, .04, () => [120, 84, 52], 'solid');
    // the sail cloth beside each spar
    for (let t = .25; t <= 1; t += .08) {
      const c = [hub[0] + .02, hub[1] + dy * SAIL * t + dz * .16, hub[2] + dz * SAIL * t - dy * .16];
      sphere(c[0], c[1], c[2], .11, SAIL_C, 'solid');
    }
  }
  sphere(hub[0] + .04, hub[1], hub[2], .1, [120, 84, 52], 'solid');
}

/* ================= the ball ================= */
function drawBall(x, y, z) {
  sphere(x, y, z, BR, [248, 248, 244], 'gloss');
}
function drawFlag(h, t) {
  const [x, y] = h.cup, top = 1.5;
  capsule([x, y, 0], [x, y, top], .025, .025, () => [236, 236, 230], 'solid');
  for (let k = 0; k < 6; k++) for (let j = 0; j < 4; j++) {
    const u = k / 5, wave = Math.sin(t * 6 - u * 3) * .06 * u;
    plot(x + wave, y + u * .55, top - .05 - j * .07 - u * .04, rampOf(FLAG_C)[j === 0 ? 4 : 3]);
    plot(x + wave, y + u * .55 + .045, top - .05 - j * .07 - u * .04, rampOf(FLAG_C)[3]);
  }
  castShadow(x, y, .7, .04, 1, 0);
}

/* ================= pixel text ================= */
const FONT = {
  A: ['XXX', 'X.X', 'XXX', 'X.X', 'X.X'], B: ['XX.', 'X.X', 'XX.', 'X.X', 'XX.'], C: ['XXX', 'X..', 'X..', 'X..', 'XXX'], D: ['XX.', 'X.X', 'X.X', 'X.X', 'XX.'],
  E: ['XXX', 'X..', 'XX.', 'X..', 'XXX'], G: ['XXX', 'X..', 'X.X', 'X.X', 'XXX'], I: ['XXX', '.X.', '.X.', '.X.', 'XXX'], L: ['X..', 'X..', 'X..', 'X..', 'XXX'],
  N: ['X.X', 'XXX', 'XXX', 'X.X', 'X.X'], O: ['XXX', 'X.X', 'X.X', 'X.X', 'XXX'], P: ['XXX', 'X.X', 'XXX', 'X..', 'X..'], R: ['XX.', 'X.X', 'XX.', 'X.X', 'X.X'],
  S: ['XXX', 'X..', 'XXX', '..X', 'XXX'], T: ['XXX', '.X.', '.X.', '.X.', '.X.'], U: ['X.X', 'X.X', 'X.X', 'X.X', 'XXX'], Y: ['X.X', 'X.X', '.X.', '.X.', '.X.'],
  K: ['X.X', 'X.X', 'XX.', 'X.X', 'X.X'], '!': ['.X.', '.X.', '.X.', '...', '.X.'], '+': ['...', '.X.', 'XXX', '.X.', '...'], ' ': ['...', '...', '...', '...', '...'],
  '1': ['.X.', 'XX.', '.X.', '.X.', 'XXX'], '2': ['XXX', '..X', 'XXX', 'X..', 'XXX'], '3': ['XXX', '..X', '.XX', '..X', 'XXX'],
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
const BEST_KEY = 'minigolf-best';
function loadBest() { try { return +localStorage.getItem(BEST_KEY) || 0; } catch (e) { return 0; } }
function saveBest(v) { try { localStorage.setItem(BEST_KEY, String(v)); } catch (e) { /* storage may be off */ } }
const G = { time: 0, best: loadBest() };
function reset() {
  Object.assign(G, { hole: 0, cards: HOLES.map(() => null), popups: [], splash: [], newBest: false });
  startHole(0);
}
function startHole(n) {
  G.hole = n; HOLE = HOLES[n];
  bake();
  G.strokes = 0;
  G.ball = { x: HOLE.tee[0], y: HOLE.tee[1], z: BR, vx: 0, vy: 0, sinking: 0 };
  G.lie = [HOLE.tee[0], HOLE.tee[1]];
  G.aimDir = Math.atan2(HOLE.cup[1] - HOLE.tee[1], HOLE.cup[0] - HOLE.tee[0]);
  setPhase('aim');
  setStatus('hole ' + (n + 1) + ' · ' + HOLE.name + ' · par ' + HOLE.par + ' · drag back and let go');
  renderHud();
}
function setPhase(p) { G.phase = p; G.phaseT = 0; }

/* ================= aiming ================= */
// a drag on the screen, turned into a direction on the ground; the ball goes the other way
function dragToShot(dx, dy) {
  const du = dx / S, dv = dy / (S * SIN);
  const wx = (du + dv) / R2, wy = (dv - du) / R2;
  return { dir: Math.atan2(-wy, -wx), power: clamp(Math.hypot(dx, dy) / 46, 0, 1) };
}
function putt(dir, power) {
  if (power < .04) return;
  const sp = power * MAX_SPEED;
  G.ball.vx = Math.cos(dir) * sp; G.ball.vy = Math.sin(dir) * sp;
  G.lie = [G.ball.x, G.ball.y];
  G.strokes++;
  G.swing = 0;
  setPhase('roll');
  sound('putt', power);
  renderHud();
}

/* ================= physics ================= */
function collideSeg(b, ax, ay, bx, by, r, e) {
  const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy;
  const t = clamp(((b.x - ax) * dx + (b.y - ay) * dy) / l2, 0, 1);
  const qx = ax + dx * t, qy = ay + dy * t, nx0 = b.x - qx, ny0 = b.y - qy, d = Math.hypot(nx0, ny0);
  if (d >= r + BR || d < 1e-6) return 0;
  const nx = nx0 / d, ny = ny0 / d;
  b.x = qx + nx * (r + BR); b.y = qy + ny * (r + BR);
  const vn = b.vx * nx + b.vy * ny;
  if (vn >= 0) return 0;
  b.vx -= (1 + e) * vn * nx; b.vy -= (1 + e) * vn * ny;
  return -vn;
}
function stepBall(b, dt) {
  const h = HOLE;
  if (b.sinking) { b.sinking += dt; b.z = BR - Math.min(.4, b.sinking * 1.4); return; }
  if (b.splash) return;
  let fric = 1.15;
  for (const sd of h.sand || []) if (inPoly(b.x, b.y, sd)) fric = 6;
  if (h.slope && inPoly(b.x, b.y, h.slope.poly)) { b.vx += h.slope.ax * dt; b.vy += h.slope.ay * dt; }
  const sp = Math.hypot(b.vx, b.vy);
  if (sp > 0) { const n = Math.max(0, sp - fric * dt); b.vx *= n / sp; b.vy *= n / sp; }
  b.x += b.vx * dt; b.y += b.vy * dt;
  for (const [ax, ay, bx, by] of rails(h)) { const hit = collideSeg(b, ax, ay, bx, by, RAIL_R, .72); if (hit > .6) sound('rail', Math.min(1, hit / 7)); }
  for (const [x, y, r] of h.bumpers || []) { const hit = collideSeg(b, x, y, x, y + 1e-4, r, .95); if (hit > .3) sound('bump', Math.min(1, hit / 6)); }
  if (h.mill) {
    // the tower's sides, and the sail when it hangs across the tunnel
    const m = h.mill;
    for (const s of [[m.x - .1, m.y - .55, m.x - 1.3, m.y - .55], [m.x - .1, m.y + .55, m.x - 1.3, m.y + .55]]) collideSeg(b, ...s, .02, .6);
    if (millBlocked()) { const hit = collideSeg(b, m.x + .05, m.y - .55, m.x + .05, m.y + .55, .06, .5); if (hit > .3) sound('bump', .5); }
  }
  for (const w of h.water || []) if (inPoly(b.x, b.y, w)) { splash(b); return; }
  // the cup: slow enough and it drops; too quick and it lips out
  const cd = Math.hypot(b.x - h.cup[0], b.y - h.cup[1]), v = Math.hypot(b.vx, b.vy);
  if (cd < CUP_R) {
    if (v < 4.2) { b.sinking = .001; b.vx = b.vy = 0; b.x = lerp(b.x, h.cup[0], .5); b.y = lerp(b.y, h.cup[1], .5); sound('cup'); holed(); return; }
    if (!b.lipped) { b.lipped = true; const a = (Math.random() - .5) * .8, c = Math.cos(a), s = Math.sin(a); [b.vx, b.vy] = [(b.vx * c - b.vy * s) * .75, (b.vx * s + b.vy * c) * .75]; sound('lip'); }
  } else b.lipped = false;
  // a ball dying near the cup is drawn in by the slope of the lip
  if (cd < CUP_R + .25 && v < 1.2) { b.vx += (h.cup[0] - b.x) * 2.5 * dt; b.vy += (h.cup[1] - b.y) * 2.5 * dt; }
}
function splash(b) {
  b.splash = true;
  const p = project(b.x, b.y, 0);
  for (let k = 0; k < 12; k++) { const a = Math.random() * 6.283, s = 20 + Math.random() * 30; G.splash.push({ x: p.sx, y: p.sy, vx: Math.cos(a) * s, vy: Math.sin(a) * s * .5 - 30, life: .5 }); }
  sound('splash');
  G.strokes++;
  setStatus('in the water · one stroke penalty');
  G.splashT = 0;
  renderHud();
}
function holed() {
  setPhase('holed');
  const d = G.strokes - HOLE.par;
  const word = G.strokes === 1 ? 'ACE!' : d <= -2 ? 'EAGLE!' : d === -1 ? 'BIRDIE!' : d === 0 ? 'PAR' : d === 1 ? 'BOGEY' : 'DOUBLE+';
  G.popups.push({ text: word, t: 0 });
  G.cards[G.hole] = G.strokes;
  setStatus(G.strokes === 1 ? 'hole in one!' : word.toLowerCase().replace('!', '') + ' · ' + G.strokes + (G.strokes === 1 ? ' stroke' : ' strokes'));
  if (d <= -1) sound('cheer');
  renderHud();
}
function pickUp() {
  G.cards[G.hole] = MAX_STROKES + 1;
  setStatus('picked up · ' + (MAX_STROKES + 1) + ' on this hole');
  setPhase('holed');
  renderHud();
}

/* ================= update ================= */
function update(dt) {
  G.time += dt; G.phaseT += dt;
  const b = G.ball;
  const N = 8, h = dt / N;
  if (G.phase === 'roll') {
    for (let s = 0; s < N; s++) stepBall(b, h);
    if (b.splash) {
      G.splashT += dt;
      if (G.splashT > .9) { Object.assign(b, { x: G.lie[0], y: G.lie[1], vx: 0, vy: 0, splash: false, z: BR }); if (G.strokes >= MAX_STROKES) pickUp(); else setPhase('aim'); }
    } else if (G.phase === 'roll' && Math.hypot(b.vx, b.vy) < .03 && !b.sinking) {
      b.vx = b.vy = 0;
      if (G.strokes >= MAX_STROKES) pickUp();
      else { setPhase('aim'); G.aimDir = Math.atan2(HOLE.cup[1] - b.y, HOLE.cup[0] - b.x); setStatus('stroke ' + (G.strokes + 1) + ' · par ' + HOLE.par); }
    }
  } else if (G.phase === 'holed') {
    for (let s = 0; s < N; s++) stepBall(b, h);
    if (G.phaseT > 1.8) { if (G.hole + 1 < HOLES.length) startHole(G.hole + 1); else finish(); }
  }
  if (G.phase === 'aim' && G.keyPower !== undefined) G.keyPower = Math.min(1, G.keyPower + dt / 1.2);
  if (G.keyTurn) G.aimDir += G.keyTurn * dt * 1.4;
  for (const p of G.splash) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 140 * dt; p.life -= dt; }
  G.splash = G.splash.filter(p => p.life > 0);
  for (const p of G.popups) p.t += dt;
  G.popups = G.popups.filter(p => p.t < 1.6);
}
function total() { return G.cards.reduce((a, v) => a + (v || 0), 0); }
function finish() {
  setPhase('over');
  const t = total(), d = t - PAR_TOTAL;
  G.newBest = !G.best || t < G.best;
  if (G.newBest) { G.best = t; saveBest(t); }
  const rel = d === 0 ? 'level par' : d > 0 ? d + ' over par' : -d + ' under par';
  setStatus((G.newBest ? 'new best: ' : 'round over · ') + t + ' strokes, ' + rel + (G.newBest ? '' : ' · best ' + G.best) + ' · tap to play again');
  showOver('Round over', t + ' strokes · ' + rel);
  renderHud();
}

/* ================= drawing ================= */
function currentShot() {
  if (G.drag) return dragToShot(G.drag.dx, G.drag.dy);
  if (G.keyPower !== undefined) return { dir: G.aimDir, power: G.keyPower };
  return null;
}
// the golfer stands side-on, on the far side of the ball from the camera so it is never hidden
function drawGolfer(shot, dir) {
  const bx = G.phase === 'roll' ? G.lie[0] : G.ball.x, by = G.phase === 'roll' ? G.lie[1] : G.ball.y;
  const d = [Math.cos(dir), Math.sin(dir)];
  let o = [d[1], -d[0]];
  if (o[0] + o[1] > 0) o = [-o[0], -o[1]];
  const gx = bx + o[0] * .62, gy = by + o[1] * .62, yaw = Math.atan2(-o[1], -o[0]);
  const back = shot ? shot.power : 0;
  const follow = G.phase === 'roll' ? Math.sin(Math.min(1, G.phaseT / .2) * Math.PI / 2) : 0;
  const swing = -back * .55 + follow * .4;
  const fr = body(.18, .32);
  const hands = [gx - o[0] * .4 + d[0] * swing * .35, gy - o[1] * .4 + d[1] * swing * .35, fr.shZ - .95 + Math.abs(swing) * .15];
  const fx = Math.cos(yaw), fy = Math.sin(yaw);
  const local = w => [(w[0] - gx) * fx + (w[1] - gy) * fy, -(w[0] - gx) * fy + (w[1] - gy) * fx, w[2]];
  const hl = local(hands);
  player(gx, gy, yaw, { crouch: .18, lean: .32, hR: hl, hL: [hl[0], hl[1] + .07, hl[2] + .1], footR: [.12, 0], footL: [-.12, 0] }, GOLFER);
  // the putter: shaft from the hands to a head that swings back along the line
  const head = [bx - d[0] * (.12 - swing * .9) - o[0] * .02, by - d[1] * (.12 - swing * .9) - o[1] * .02, .07];
  capsule(hands, head, .03, .03, () => [70, 74, 86], 'solid');
  capsule([head[0] - o[0] * .02, head[1] - o[1] * .02, .06], [head[0] + o[0] * .16, head[1] + o[1] * .16, .06], .05, .05, () => [180, 186, 196], 'solid');
}
function draw() {
  pix.set(bakedPix);
  zb.set(bakedZ);
  const b = G.ball, shot = G.phase === 'aim' ? currentShot() : null;
  const dir = shot ? shot.dir : G.aimDir;
  if (G.phase === 'aim' || (G.phase === 'roll' && G.phaseT < .45)) drawGolfer(shot, dir);
  if (!b.splash) {
    drawBall(b.x, b.y, b.z);
    if (!b.sinking) castShadow(b.x, b.y, b.z - BR, BR * .95, 1, 0);
  }
  drawFlag(HOLE, G.time);
  if (HOLE.mill) drawSails(HOLE.mill);
  const windT = STILL ? 0 : Math.floor(G.time * WIND_FPS) / WIND_FPS;
  drawLeaves(windT);
  drawTufts(windT);
  flushShadows();
  applyShadows(bakedZ);
  shadeEdges();
  if (shot && shot.power > .04) drawAim(shot);
  for (const p of G.splash) { dot(Math.round(p.x), Math.round(p.y), rgb(200, 230, 250)); dot(Math.round(p.x) + 1, Math.round(p.y), rgb(150, 200, 236)); }
  const top = project(HOLE.cup[0], HOLE.cup[1], 1.9);
  for (const p of G.popups) if (!(p.t > 1.3 && Math.floor(p.t * 14) % 2)) drawText(p.text, top.sx, Math.round(top.sy - 12 - p.t * 8), SIGNAL, 3);
  ctx.putImageData(image, 0, 0);
}
// the first stretch of the roll, bounces included, so the line off a rail is readable
function drawAim(shot) {
  const sim = { x: G.ball.x, y: G.ball.y, vx: Math.cos(shot.dir) * shot.power * MAX_SPEED, vy: Math.sin(shot.dir) * shot.power * MAX_SPEED, z: BR };
  const dt = 1 / 120, pts = [];
  let travelled = 0, px = sim.x, py = sim.y;
  const reach = .6 + shot.power * 3.4;
  for (let i = 0; i < 900 && travelled < reach; i++) {
    const sp = Math.hypot(sim.vx, sim.vy);
    if (sp < .05) break;
    const n = Math.max(0, sp - 1.15 * dt); sim.vx *= n / sp; sim.vy *= n / sp;
    sim.x += sim.vx * dt; sim.y += sim.vy * dt;
    for (const [ax, ay, bx, by] of rails(HOLE)) collideSeg(sim, ax, ay, bx, by, RAIL_R, .72);
    for (const [x, y, r] of HOLE.bumpers || []) collideSeg(sim, x, y, x, y + 1e-4, r, .95);
    travelled += Math.hypot(sim.x - px, sim.y - py); px = sim.x; py = sim.y;
    if (i % 5 === 4) pts.push([sim.x, sim.y]);
  }
  pts.forEach(([x, y], k) => {
    const p = project(x, y, .03), sx = Math.round(p.sx), sy = Math.round(p.sy), fade = k / pts.length;
    for (const [ox, oy] of [[-1, 0], [2, 0], [-1, 1], [2, 1], [0, -1], [1, -1], [0, 2], [1, 2]]) dot(sx + ox, sy + oy, INK);
    for (const [ox, oy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) dot(sx + ox, sy + oy, fade > .75 ? rgb(190, 214, 196) : PAPER);
  });
  // power, as a short bar beside the ball
  const bp = project(G.ball.x, G.ball.y, 0), x0 = Math.round(bp.sx) + 10, y0 = Math.round(bp.sy) + 8, w = 22;
  for (let y = y0 - 1; y <= y0 + 4; y++) for (let x = x0 - 2; x <= x0 + w + 1; x++) dot(x, y, PAPER);
  for (let y = y0; y <= y0 + 3; y++) for (let x = x0 - 1; x <= x0 + w; x++) dot(x, y, INK);
  const f = Math.round(shot.power * w);
  for (let y = y0 + 1; y <= y0 + 2; y++) for (let x = x0; x < x0 + w; x++) dot(x, y, x - x0 < f ? SIGNAL : rgb(110, 116, 130));
}

/* ================= hud ================= */
const nodes = { pts: document.getElementById('pts'), card: document.getElementById('card'), best: document.getElementById('best'), status: document.getElementById('status'), par: document.getElementById('par') };
function renderHud() {
  const done = G.cards.filter(v => v !== null);
  const parSoFar = HOLES.slice(0, done.length).reduce((a, h) => a + h.par, 0), d = total() - parSoFar;
  nodes.pts.textContent = total() + (G.phase !== 'over' && G.cards[G.hole] === null ? G.strokes : 0);
  nodes.par.textContent = done.length ? (d === 0 ? 'E' : d > 0 ? '+' + d : String(d)) : 'par ' + PAR_TOTAL;
  nodes.card.innerHTML = HOLES.map((h, n) => {
    const v = G.cards[n], now = n === G.hole && G.phase !== 'over';
    const cls = v === null ? (now ? 'now' : '') : v < h.par ? 'under' : v > h.par ? 'over' : 'even';
    return '<div class="h ' + cls + '"><span>' + (n + 1) + '</span><b>' + (v ?? (now ? G.strokes || '·' : '')) + '</b><i>' + h.par + '</i></div>';
  }).join('');
  nodes.best.textContent = G.best ? 'best ' + G.best : '';
}
let statusText = '';
function setStatus(text) { if (text !== statusText) { statusText = text; nodes.status.textContent = text; } }

/* ================= input ================= */
const stage = document.getElementById('stage'), rules = document.getElementById('rules');
function scale() { const r = canvas.getBoundingClientRect(); return W / r.width; }
stage.addEventListener('pointerdown', e => {
  if (e.button > 0) return;
  ensureAudio();
  try { stage.setPointerCapture(e.pointerId); } catch (err) { /* older browsers */ }
  canvas.focus({ preventScroll: true });
  if (G.phase === 'over') { if (G.phaseT > .6) reset(); return; }
  if (G.phase !== 'aim') return;
  G.drag = { x: e.clientX, y: e.clientY, dx: 0, dy: 0 };
});
stage.addEventListener('pointermove', e => {
  if (!G.drag) return;
  const k = scale();
  G.drag.dx = (e.clientX - G.drag.x) * k; G.drag.dy = (e.clientY - G.drag.y) * k;
});
stage.addEventListener('pointerup', () => {
  if (!G.drag) return;
  const shot = dragToShot(G.drag.dx, G.drag.dy);
  G.drag = null;
  if (G.phase === 'aim') putt(shot.dir, shot.power);
});
stage.addEventListener('pointercancel', () => { G.drag = null; });
addEventListener('keydown', e => {
  if (rules.open || e.target.tagName === 'BUTTON') return;
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); G.keyTurn = e.key === 'ArrowLeft' ? 1 : -1; if (G.keyPower === undefined && G.phase === 'aim') G.keyPower = 0; return; }
  if (e.key !== ' ' && e.key !== 'Enter') return;
  e.preventDefault();
  ensureAudio();
  if (e.repeat) return;
  if (G.phase === 'over') { if (G.phaseT > .6) reset(); return; }
  if (G.phase === 'aim') { G.keyPower = 0; G.keyHold = true; }
});
addEventListener('keyup', e => {
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { G.keyTurn = 0; if (!G.keyHold) G.keyPower = undefined; return; }
  if ((e.key === ' ' || e.key === 'Enter') && G.keyHold) {
    G.keyHold = false;
    const p = G.keyPower; G.keyPower = undefined;
    if (G.phase === 'aim') putt(G.aimDir, p);
  }
});
document.getElementById('rules-open').addEventListener('click', () => rules.showModal());
rules.addEventListener('click', e => { if (e.target === rules) rules.close(); });
rules.addEventListener('close', () => canvas.focus({ preventScroll: true }));

/* ================= sound ================= */
function sound(kind, amt = .6) {
  if (!audio || muted) return;
  if (kind === 'putt') { tone(900, 700, .05, .08 + amt * .1, 'triangle'); hiss(.03, 3000, 1, .05); }
  else if (kind === 'rail') tone(260, 180, .07, .05 + amt * .12, 'triangle');
  else if (kind === 'bump') { tone(420, 840, .12, .06 + amt * .08, 'sine'); }
  else if (kind === 'cup') { tone(600, 300, .1, .1, 'triangle'); tone(300, 200, .12, .08, 'triangle', .08); }
  else if (kind === 'lip') tone(500, 400, .06, .06, 'triangle');
  else if (kind === 'splash') hiss(.4, 900, .5, .2);
  else if (kind === 'cheer') { tone(523, 523, .1, .05, 'triangle'); tone(659, 659, .1, .05, 'triangle', .09); tone(1046, 1046, .25, .05, 'triangle', .18); }
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
reset();
let last = performance.now();
function frame(now) {
  update(Math.min(.04, (now - last) / 1000));
  last = now;
  draw();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
window.__golf = { G, update, draw, putt, startHole, HOLES, dragToShot, project };
