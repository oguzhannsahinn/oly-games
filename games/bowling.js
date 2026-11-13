/* ================= the lane ================= */
const FOUL = 4.9, HX = -4.6, DECK_X = -6.3, PIT_X = -6.35, LW = .95, GUT = .27;
const BR = .2, PR = .11, PH = .7, SP = .5, SPEED = 8.6, HOOK = 4.2;
const ISLAND = { cx: .2, ax: 8.2, ay: 3.2 };
const KIND_LANE = 5;
const WOOD_A = [214, 168, 112], WOOD_B = [204, 158, 104], WOOD_DECK = [222, 182, 128], APPROACH = [196, 150, 98];
const ARROW_C = [120, 70, 44], GUTTER_C = [132, 138, 150], PIT_C = [34, 40, 58];
const PIN_C = [246, 244, 238], STRIPE_C = [214, 52, 52], BALL_C = [255, 106, 61], BALL_SWIRL = [255, 160, 110], HOLE_C = [40, 26, 26];
const CURTAIN = [30, 42, 69], RETURN_C = [58, 70, 98];
const BOWLER = { jersey: [64, 160, 176], shorts: [36, 44, 66], skin: [210, 158, 120], hair: [52, 36, 30], sock: [244, 242, 236], shoe: [214, 56, 52] };

const LX = -.246, LY = .532, LZ = .81;
function litLevel(nx, ny, nz) { return clamp(Math.floor(((nx * LX + ny * LY + nz * LZ) * .5 + .5) * 4.3 + .2), 1, 4); }
function pick(tones, v, ix, iy, dither = .6) { return tones[clamp(Math.floor(v * 4 + (bayerAt(ix, iy) - .5) * dither), 0, 3)]; }
function islandEdge(x, y) { return Math.pow(Math.pow(Math.abs(x - ISLAND.cx) / ISLAND.ax, 4) + Math.pow(Math.abs(y) / ISLAND.ay, 4), .25); }
const SPOTS = (() => {
  const s = [];
  for (let row = 0; row < 4; row++) for (let j = 0; j <= row; j++) s.push([HX - row * SP * .866, (j - row / 2) * SP]);
  return s;
})();

function groundColor(x, y, ix, iy, i) {
  const edge = islandEdge(x, y), rough = edge + (noise(x * 1.3, y * 1.3) - .5) * .12;
  if (rough > 1.04) return 0;
  if (rough > .93 && hash(ix, iy) < (rough - .93) / .11) return 0;
  const ay = Math.abs(y);
  if (x > -7.5 && x < 7.7 && ay < LW + GUT + .12) {
    kinds[i] = KIND_LANE;
    if (ay > LW + GUT) return rgb(70, 78, 96);
    if (ay > LW) {
      if (x < PIT_X) return rgb(...PIT_C);
      const t = (ay - LW) / GUT;
      return rampOf(GUTTER_C)[t < .2 || t > .8 ? 3 : 2];
    }
    if (x < PIT_X) return x < -7.2 ? rgb(...PIT_C) : rgb(...PIT_C.map(c => c * 1.25));
    if (Math.abs(x - FOUL) < .04) return rgb(40, 34, 30);
    const board = Math.floor((y + LW) / .1);
    // the arrows that bowlers aim at, and the dots near the foul line
    const ax = FOUL - 3.1, ay2 = Math.round(y / .5) * .5;
    if (Math.abs(ay2) < .9 && x < ax + .32 - Math.abs(y - ay2) * 2.4 && x > ax - .05 && Math.abs(y - ay2) < .1) return rgb(...ARROW_C);
    if (Math.abs(x - (FOUL - 1.3)) < .04 && Math.abs(y - Math.round(y / .4) * .4) < .04) return rgb(...ARROW_C);
    for (const s of SPOTS) if (Math.hypot(x - s[0], y - s[1]) < .06) return rgb(170, 128, 86);
    const c = x > FOUL ? APPROACH : x < HX + .45 ? WOOD_DECK : board & 1 ? WOOD_A : WOOD_B;
    // a soft sheen down the middle, where the oil is
    return pick(tonesOf(c), .55 + (noise(x * .4, y * 6) - .5) * .25 + (1 - ay / LW) * .12, ix, iy, .3);
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
  // the curtain behind the pins, with a coral band
  box(-7.55, -1.5, 0, -7.35, 1.5, 1.25, CURTAIN, 4);
  box(-7.55, -1.5, 1.25, -7.35, 1.5, 1.45, [255, 106, 61], 9);
  for (let y = -1.5; y <= 1.5; y += .15) for (let z = 0; z <= 1.45; z += .2) castShadow(-7.45, y, z, .12);
  // the ball return beside the approach
  box(5.4, -2.25, 0, 7.3, -1.75, .42, RETURN_C, 2);
  box(5.6, -2.2, .42, 6.0, -1.8, .78, RETURN_C, 6);
  for (let x = 5.4; x <= 7.3; x += .15) castShadow(x, -2.0, .35, .25);
  for (const [x, c] of [[6.35, [64, 160, 176]], [6.85, [242, 190, 48]]]) { sphere(x, -2.0, .62, .2, c, 'gloss'); castShadow(x, -2.0, .55, .18); }
  growTree(-6.4, 2.6, .55, 260, 5);
  growTree(1.2, -2.75, .5, 220, 41);
  bakeOcclusion();
  staticShadow.set(shadowMask);
  applyShadows(groundZ);
  bakedPix.set(pix);
  bakedZ.set(zb);
}

/* ================= pins and ball ================= */
// radius of a pin at height s along its axis: foot, belly, neck, head
function pinRadius(s) {
  if (s < .22) return lerp(.075, .115, Math.sin(s / .22 * Math.PI / 2));
  if (s < .45) return lerp(.115, .052, ease((s - .22) / .23));
  if (s < .6) return lerp(.052, .07, Math.sin((s - .45) / .15 * Math.PI / 2));
  return .07 * Math.sqrt(Math.max(0, 1 - ((s - .6) / .1) ** 2));
}
function pinAxis(p) { const st = Math.sin(p.tilt); return [p.dx * st, p.dy * st, Math.cos(p.tilt)]; }
function drawPin(p) {
  if (p.gone) return;
  const a = pinAxis(p);
  for (let s = .03; s <= PH - .02; s += .035) {
    const r = pinRadius(s);
    if (r < .02) continue;
    const c = (s > .42 && s < .465) || (s > .49 && s < .525) ? STRIPE_C : PIN_C;
    sphere(p.x + a[0] * s, p.y + a[1] * s, p.z + a[2] * s + (p.tilt > .5 ? r * .4 : 0), r, c, 'solid');
  }
  for (const s of [.1, .3, .55]) castShadow(p.x + a[0] * s, p.y + a[1] * s, p.z + a[2] * s, .1, 1, 0);
}
// where a pin's body sits for collisions: low on its axis when standing, its middle when lying
function pinCentre(p) { const a = pinAxis(p), s = p.tilt > .4 ? PH * .42 : .12; return [p.x + a[0] * s, p.y + a[1] * s]; }
const HOLES = [[0, -.32, .95], [.18, -.12, .98], [-.18, -.12, .98]].map(v => { const l = Math.hypot(...v); return v.map(c => c / l); });
function drawBall(x, y, z, spin, svx, svy) {
  const p = project(x, y, z), rp = BR * S;
  let ax = -svy, ay = svx;
  const al = Math.hypot(ax, ay);
  if (al < 1e-4) { ax = .8; ay = .6; } else { ax /= al; ay /= al; }
  const c = Math.cos(spin), s = Math.sin(spin), t = 1 - c;
  const m = [c + ax * ax * t, ax * ay * t, ay * s, ax * ay * t, c + ay * ay * t, -ax * s, -ay * s, ax * s, c];
  const base = rampOf(BALL_C), swirl = rampOf(BALL_SWIRL);
  const y0 = Math.max(0, Math.floor(p.sy - rp)), y1 = Math.min(H - 1, Math.ceil(p.sy + rp));
  const x0 = Math.max(0, Math.floor(p.sx - rp)), x1 = Math.min(W - 1, Math.ceil(p.sx + rp));
  for (let iy = y0; iy <= y1; iy++) for (let ix = x0; ix <= x1; ix++) {
    const dx = (ix + .5 - p.sx) / rp, dy = (iy + .5 - p.sy) / rp, nn = dx * dx + dy * dy;
    if (nn > 1) continue;
    const nz = Math.sqrt(1 - nn), d = p.d + BR * nz, i = iy * W + ix;
    if (d <= zb[i]) continue;
    let l = clamp(-.55 * dx - .6 * dy + .58 * nz, 0, 1);
    if (dy > .35) l = Math.max(l, .12 + dy * .24);
    const lvl = clamp(Math.floor(l * 4.4 + .2), 1, 4);
    const q = [m[0] * dx + m[1] * dy + m[2] * nz, m[3] * dx + m[4] * dy + m[5] * nz, m[6] * dx + m[7] * dy + m[8] * nz];
    let col = Math.sin(q[0] * 5 + q[2] * 3 + Math.sin(q[1] * 4) * 1.5) > .55 ? swirl[lvl] : base[lvl];
    for (const h of HOLES) if (q[0] * h[0] + q[1] * h[1] + q[2] * h[2] > .975) col = rgb(...HOLE_C);
    if (l > .93) col = rgb(255, 246, 232);
    zb[i] = d;
    pix[i] = col;
  }
}
const screenVel = (vx, vy, vz) => [(vx - vy) / R2 * S, ((vx + vy) / R2 * SIN - vz * COS) * S];

/* ================= pixel text ================= */
const FONT = {
  '0': ['XXX', 'X.X', 'X.X', 'X.X', 'XXX'], '1': ['.X.', 'XX.', '.X.', '.X.', 'XXX'], '2': ['XXX', '..X', 'XXX', 'X..', 'XXX'],
  '3': ['XXX', '..X', '.XX', '..X', 'XXX'], '4': ['X.X', 'X.X', 'XXX', '..X', '..X'], '5': ['XXX', 'X..', 'XXX', '..X', 'XXX'],
  '6': ['XXX', 'X..', 'XXX', 'X.X', 'XXX'], '7': ['XXX', '..X', '.X.', '.X.', '.X.'], '8': ['XXX', 'X.X', 'XXX', 'X.X', 'XXX'],
  '9': ['XXX', 'X.X', 'XXX', '..X', 'XXX'], 'S': ['XXX', 'X..', 'XXX', '..X', 'XXX'], 'T': ['XXX', '.X.', '.X.', '.X.', '.X.'],
  'R': ['XX.', 'X.X', 'XX.', 'X.X', 'X.X'], 'I': ['XXX', '.X.', '.X.', '.X.', 'XXX'], 'K': ['X.X', 'X.X', 'XX.', 'X.X', 'X.X'],
  'E': ['XXX', 'X..', 'XX.', 'X..', 'XXX'], '!': ['.X.', '.X.', '.X.', '...', '.X.'], 'P': ['XXX', 'X.X', 'XXX', 'X..', 'X..'],
  'A': ['XXX', 'X.X', 'XXX', 'X.X', 'X.X'], 'G': ['XXX', 'X..', 'X.X', 'X.X', 'XXX'], 'U': ['X.X', 'X.X', 'X.X', 'X.X', 'XXX'],
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
const BEST_KEY = 'bowling-best';
function loadBest() { try { return +localStorage.getItem(BEST_KEY) || 0; } catch (e) { return 0; } }
function saveBest(v) { try { localStorage.setItem(BEST_KEY, String(v)); } catch (e) { /* storage may be off */ } }
const G = { time: 0, best: loadBest() };
function rackPins() { G.pins = SPOTS.map(([x, y], n) => ({ n, x, y, z: 0, vx: 0, vy: 0, tilt: 0, vt: 0, dx: -1, dy: 0, down: false, gone: false, sx: x, sy: y })); }
function reset() {
  Object.assign(G, { frames: Array.from({ length: 10 }, () => []), frame: 0, roll: 0, popups: [], newBest: false, ball: null, lock: {} });
  rackPins();
  startLocks();
  setStatus('tap to stop the bowler, then the aim, then the spin');
  renderHud();
}
function setPhase(p) { G.phase = p; G.phaseT = 0; }
function startLocks() { G.lock = {}; G.oscT = 0; setPhase('pos'); }
// three sweeps, each stopped with a tap: where to stand, which way to roll, how much hook
const osc = period => Math.sin(G.oscT * Math.PI * 2 / period);
const current = () => ({
  y: G.lock.y ?? osc(2.3) * .72,
  ang: G.lock.ang ?? (G.phase === 'aim' ? osc(1.7) * .07 : 0),
  spin: G.lock.spin ?? (G.phase === 'spin' ? osc(1.5) : 0),
});
function tap() {
  if (G.phase === 'pos') { G.lock.y = current().y; G.oscT = .43; setPhase('aim'); sound('tick'); }
  else if (G.phase === 'aim') { G.lock.ang = current().ang; G.oscT = 0; setPhase('spin'); sound('tick'); }
  else if (G.phase === 'spin') { G.lock.spin = current().spin; setPhase('approach'); sound('tick'); }
}

/* ================= physics ================= */
function launch() {
  const { y, ang, spin } = G.lock;
  G.ball = { x: FOUL - .15, y, z: BR, vx: -Math.cos(ang) * SPEED, vy: Math.sin(ang) * SPEED * -1, spin, rot: 0, gutter: false, done: false, path: [] };
  setPhase('rolling');
  sound('release');
  rumble(true);
}
function hookAt(x) { const prog = clamp((FOUL - x) / (FOUL - HX), 0, 1); return prog * prog * (3 - 2 * prog); }
function stepBall(b, dt) {
  if (b.done) return;
  if (!b.gutter) {
    b.vy += b.spin * HOOK * hookAt(b.x) * dt;
    // the hook bends the path without speeding the ball up
    const sp = Math.hypot(b.vx, b.vy), want = Math.max(4, Math.hypot(b.vx, b.vy) - .25 * dt);
    b.vx *= want / sp; b.vy *= want / sp;
  }
  b.x += b.vx * dt; b.y += b.vy * dt;
  b.rot += Math.hypot(b.vx, b.vy) / BR * dt;
  if (!b.gutter && Math.abs(b.y) > LW - .03) {
    b.gutter = true; b.vy = 0; b.y = Math.sign(b.y) * (LW + GUT / 2); b.z = BR - .1;
    if (!b.hitAny) { G.popups.push({ text: 'GUTTER', t: 0 }); sound('gutter'); }
  }
  if (b.x < PIT_X) { b.z -= dt * 3; if (b.x < -7.3) { b.done = true; rumble(false); sound('pit'); } }
}
function knock(p, vx, vy, strength) {
  p.vx += vx; p.vy += vy;
  if (!p.down && strength > .55) {
    p.down = true;
    const l = Math.hypot(p.vx, p.vy) || 1;
    p.dx = p.vx / l; p.dy = p.vy / l;
    p.vt = 5 + Math.min(6, strength * 2);
  }
}
function collide(dt) {
  const b = G.ball, pins = G.pins.filter(p => !p.gone);
  if (b && !b.done && !b.gutter) for (const p of pins) {
    if (p.inGutter) continue;
    const c = pinCentre(p), dx = c[0] - b.x, dy = c[1] - b.y, d = Math.hypot(dx, dy), min = BR + PR + (p.tilt > .4 ? .03 : 0);
    if (d >= min || d < 1e-6) continue;
    const nx = dx / d, ny = dy / d, rel = (b.vx - p.vx) * nx + (b.vy - p.vy) * ny;
    p.x += nx * (min - d); p.y += ny * (min - d);
    if (rel <= 0) continue;
    // a heavy ball and light pins: the ball barely notices
    const mb = 1, mp = .32, j = (1 + .55) * rel / (1 / mb + 1 / mp);
    b.vx -= j / mb * nx * .55; b.vy -= j / mb * ny * .55;
    knock(p, j / mp * nx, j / mp * ny, j / mp);
    if (!b.hitAny) b.hitAny = true;
    sound('pin', Math.min(1, rel / 8));
  }
  for (let i = 0; i < pins.length; i++) for (let k = i + 1; k < pins.length; k++) {
    const a = pins[i], c = pins[k];
    if (a.inGutter !== c.inGutter) continue;
    const pa = pinCentre(a), pc = pinCentre(c), dx = pc[0] - pa[0], dy = pc[1] - pa[1], d = Math.hypot(dx, dy);
    const min = PR * 2 + (a.tilt > .4 ? .03 : 0) + (c.tilt > .4 ? .03 : 0);
    if (d >= min || d < 1e-6) continue;
    const nx = dx / d, ny = dy / d, o = (min - d) / 2;
    a.x -= nx * o; a.y -= ny * o; c.x += nx * o; c.y += ny * o;
    const rel = (a.vx - c.vx) * nx + (a.vy - c.vy) * ny;
    // a falling pin swings its head into its neighbours
    const swing = (a.vt > 0 && a.tilt < 1.4 ? .9 : 0) + (c.vt > 0 && c.tilt < 1.4 ? .9 : 0);
    if (rel <= 0 && !swing) continue;
    const j = Math.max(0, (1 + .5) * rel / 2) + swing * .4;
    knock(a, -j * nx, -j * ny, j * (c.down ? 1.2 : 1));
    knock(c, j * nx, j * ny, j * (a.down ? 1.2 : 1));
    if (j > .4) sound('pin', Math.min(1, j / 4));
  }
}
function stepPins(dt) {
  for (const p of G.pins) {
    if (p.gone) continue;
    if (p.down && p.tilt < 1.45) { p.tilt = Math.min(1.45, p.tilt + p.vt * dt); p.vt += 14 * dt; }
    p.x += p.vx * dt; p.y += p.vy * dt;
    const sp = Math.hypot(p.vx, p.vy), dec = (p.down ? 2.6 : 4) * dt;
    if (sp > 0) { const n = Math.max(0, sp - dec); p.vx *= n / sp; p.vy *= n / sp; }
    if (!p.inGutter && Math.abs(p.y) > LW + .02) { p.inGutter = true; p.down = true; p.z = -.08; p.vy *= .2; if (p.tilt < .4) { p.dx = p.vx || -1; p.dy = 0; p.vt = 6; } }
    if (p.inGutter) p.y = clamp(p.y, -(LW + GUT - .1), LW + GUT - .1) * 0 + Math.sign(p.y) * Math.min(Math.abs(p.y), LW + GUT - .1);
    if (p.x < PIT_X) { p.z -= dt * 4; p.down = true; if (p.z < -1) p.gone = true; }
    if (p.x > FOUL || Math.abs(p.y) > 2.5) p.gone = true;
  }
}
function settled() {
  const b = G.ball;
  if (!b.done && b.x > PIT_X - .5) return false;
  for (const p of G.pins) if (!p.gone && (Math.hypot(p.vx, p.vy) > .05 || (p.down && p.tilt < 1.44))) return false;
  return true;
}

/* ================= scoring ================= */
function frameScores() {
  const out = [];
  let total = 0;
  const r = [];
  G.frames.forEach(f => r.push(...f));
  let i = 0;
  for (let f = 0; f < 10; f++) {
    const fr = G.frames[f];
    if (!fr.length) { out.push(null); continue; }
    let val = null;
    if (f < 9) {
      if (fr[0] === 10) { if (r.length > i + 2) val = 10 + r[i + 1] + r[i + 2]; i += 1; }
      else if (fr.length === 2) { if (fr[0] + fr[1] === 10) { if (r.length > i + 2) val = 10 + r[i + 2]; } else val = fr[0] + fr[1]; i += 2; }
      else i += 1;
    } else {
      const done = fr.length === 3 || (fr.length === 2 && fr[0] + fr[1] < 10);
      if (done) val = fr.reduce((a, b) => a + b, 0);
    }
    if (val === null) { out.push(null); for (let g = f + 1; g < 10; g++) out.push(null); return out.map((v, k) => v === null ? null : v); }
    total += val;
    out.push(total);
  }
  return out;
}
// how many pins stood before each roll of a frame
function befores(f) {
  const fr = G.frames[f], out = [];
  let standing = 10;
  fr.forEach(v => { out.push(standing); standing -= v; if (standing === 0 && f === 9) standing = 10; });
  return out;
}
function marks(f) {
  const fr = G.frames[f], bf = befores(f);
  return fr.map((v, k) => v === 10 && bf[k] === 10 ? 'X' : v === bf[k] && bf[k] < 10 ? '/' : v === 0 ? '–' : v);
}
function totalScore() { const s = frameScores().filter(v => v !== null); return s.length ? s[s.length - 1] : 0; }
// the big number: settled frames, plus the pins of frames still waiting on a bonus
function liveScore() {
  const sc = frameScores();
  let last = -1;
  sc.forEach((v, f) => { if (v !== null) last = f; });
  let total = last >= 0 ? sc[last] : 0;
  for (let f = last + 1; f < 10; f++) total += G.frames[f].reduce((a, b) => a + b, 0);
  return total;
}
function finishRoll() {
  const standing = G.pins.filter(p => !p.gone && !p.down).length;
  const before = G.standingBefore, knocked = before - standing;
  const fr = G.frames[G.frame];
  fr.push(knocked);
  const strike = before === 10 && knocked === 10, spare = before < 10 && standing === 0;
  if (strike) { G.popups.push({ text: 'STRIKE!', t: 0 }); sound('strike'); setStatus('strike'); }
  else if (spare) { G.popups.push({ text: 'SPARE!', t: 0 }); sound('spare'); setStatus('spare'); }
  else setStatus(knocked === 0 ? (G.ball.gutter ? 'gutter ball' : 'missed them all') : knocked + (knocked === 1 ? ' pin' : ' pins') + (standing ? ' · ' + standing + ' left standing' : ''));
  let frameDone, rerack;
  if (G.frame < 9) { frameDone = strike || fr.length === 2; rerack = frameDone; }
  else { frameDone = fr.length === 3 || (fr.length === 2 && fr[0] + fr[1] < 10); rerack = standing === 0; }
  G.next = { rerack, frameDone };
  renderHud();
}
function advance() {
  const { rerack, frameDone } = G.next;
  if (frameDone) {
    G.frame++; G.roll = 0;
    if (G.frame >= 10) return finish();
    rackPins();
  } else {
    G.roll++;
    if (rerack) rackPins();
    else { G.pins = G.pins.filter(p => !p.gone && !p.down); for (const p of G.pins) { p.vx = p.vy = 0; } }
  }
  G.ball = null;
  startLocks();
  renderHud();
}
function finish() {
  setPhase('over');
  const total = totalScore();
  G.newBest = total > G.best;
  if (G.newBest) { G.best = total; saveBest(total); }
  setStatus((G.newBest ? 'new best: ' : 'game over · ') + total + (G.newBest ? '' : ' · best ' + G.best) + ' · tap to play again');
  showOver('Game over', total + ' points' + (G.newBest ? ' · new best' : ' · best ' + G.best));
  renderHud();
}

/* ================= update ================= */
function update(dt) {
  G.time += dt; G.phaseT += dt;
  if (G.phase === 'pos' || G.phase === 'aim' || G.phase === 'spin') G.oscT += dt;
  if (G.phase === 'approach' && G.phaseT >= .82) { G.standingBefore = G.pins.filter(p => !p.gone && !p.down).length; launch(); }
  const N = 8, h = dt / N;
  for (let s = 0; s < N; s++) {
    if (G.ball) stepBall(G.ball, h);
    stepPins(h);
    collide(h);
  }
  if (G.phase === 'rolling' && (G.phaseT > 6 || (G.phaseT > 1 && settled()))) { rumble(false); setPhase('result'); finishRoll(); }
  if (G.phase === 'result' && G.phaseT > 1.5) advance();
  for (const p of G.popups) p.t += dt;
  G.popups = G.popups.filter(p => p.t < 1.4);
}

/* ================= drawing ================= */
function bowlerPose(t) {
  const u = clamp(t / .82, 0, 1);
  if (G.phase !== 'approach' && G.phase !== 'rolling') {
    const fr = body(.06, .05), B = [fr.shA + .34, .05, fr.shZ - .38];
    return { pose: { crouch: .06, lean: .05, hR: [B[0] - .02, B[1] + .2, B[2]], hL: [B[0] - .02, B[1] - .2, B[2]], footR: [.1, 0], footL: [-.05, 0] }, ball: B, x: 0 };
  }
  if (G.phase === 'rolling') {
    const fr = body(.42, .45);
    return { pose: { crouch: .42, lean: .45, hR: [fr.shA + .75, .38, .9], hL: [fr.shA - .1, -.75, fr.shZ - .3], footR: [-.9, .25], footL: [.55, 0] }, ball: null, x: 1.6 };
  }
  // four steps, the ball swinging back and through
  const step = Math.sin(u * Math.PI * 4), crouch = .1 + u * .3, lean = .1 + u * .3, fr = body(crouch, lean);
  const sw = Math.sin(u * Math.PI * 1.5 - Math.PI * .5);
  const B = [fr.shA + sw * .75, .4, fr.shZ - .7 - Math.cos(u * Math.PI * 1.5) * .15];
  return {
    pose: { crouch, lean, hR: [B[0], B[1] - .02, B[2] + .1], hL: [fr.shA - .1 - sw * .3, -.6, fr.shZ - .45], footR: [step * .35 - u * .3, Math.max(0, step) * .12], footL: [-step * .35 + u * .4, Math.max(0, -step) * .12] },
    ball: B, x: u * 1.6,
  };
}
function drawPath() {
  if (!(G.phase === 'pos' || G.phase === 'aim' || G.phase === 'spin')) return;
  const c = current(), dots = [];
  if (G.phase === 'pos') {
    // a chevron on the foul line marks where the bowler stands
    const p = project(FOUL + .25, c.y, 0), x = Math.round(p.sx), y = Math.round(p.sy);
    for (let k = 0; k < 5; k++) for (let j = -k; j <= k; j++) { dot(x + j, y + 6 - k, INK); }
    for (let k = 1; k < 4; k++) for (let j = -k + 1; j <= k - 1; j++) dot(x + j, y + 6 - k, SIGNAL);
    return;
  }
  const b = { x: FOUL - .15, y: c.y, vx: -Math.cos(c.ang) * SPEED, vy: -Math.sin(c.ang) * SPEED, spin: c.spin };
  const dt = 1 / 60;
  for (let i = 0; i < 160 && b.x > HX - .2; i++) {
    b.vy += b.spin * HOOK * hookAt(b.x) * dt;
    const sp = Math.hypot(b.vx, b.vy), want = Math.max(4, sp - .25 * dt);
    b.vx *= want / sp; b.vy *= want / sp;
    b.x += b.vx * dt; b.y += b.vy * dt;
    if (i % 4 === 3) dots.push([b.x, b.y]);
    if (Math.abs(b.y) > LW - .03) { dots.push([b.x, Math.sign(b.y) * LW]); break; }
  }
  const len = G.phase === 'aim' ? 7 : dots.length;
  dots.slice(0, len).forEach(([x, y], k) => {
    const p = project(x, y, .02), px = Math.round(p.sx), py = Math.round(p.sy), gut = Math.abs(y) >= LW - .01;
    for (const [ox, oy] of [[-1, 0], [2, 0], [-1, 1], [2, 1], [0, -1], [1, -1], [0, 2], [1, 2]]) dot(px + ox, py + oy, INK);
    for (const [ox, oy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) dot(px + ox, py + oy, gut ? SIGNAL : PAPER);
  });
}
function drawMeter() {
  if (G.phase !== 'spin') return;
  // a small dial under the path: left hook, straight, right hook
  const s = current().spin, cx = 70, cy = H - 26, w = 44;
  for (let y = cy - 6; y <= cy + 6; y++) for (let x = cx - w - 3; x <= cx + w + 3; x++) dot(x, y, PAPER);
  for (let x = cx - w; x <= cx + w; x++) { dot(x, cy, INK); }
  for (const x of [cx - w, cx, cx + w]) for (let y = cy - 3; y <= cy + 3; y++) dot(x, y, INK);
  const mx = Math.round(cx - s * w);
  for (let y = cy - 5; y <= cy + 5; y++) for (let x = mx - 1; x <= mx + 1; x++) dot(x, y, Math.abs(x - mx) === 1 || Math.abs(y - cy) === 5 ? INK : SIGNAL);
}
function draw() {
  pix.set(bakedPix);
  zb.set(bakedZ);
  const c = current(), bp = bowlerPose(G.phaseT);
  // the ball hangs on the bowler's right, so he stands a little to the left of his line
  const bx = FOUL + 1.85 - bp.x, by = (G.lock.y ?? c.y) + .36;
  const yaw = Math.PI;
  const held = player(bx, by, yaw, { ...bp.pose, ball: bp.ball }, BOWLER);
  if (held) { drawBall(held[0], held[1], held[2], 0, 0, 0); pendingShadows.push(held, BR, held, BR); }
  for (const p of G.pins) drawPin(p);
  const b = G.ball;
  if (b && b.z > -.5) {
    const [svx, svy] = screenVel(b.vx, b.vy, 0);
    drawBall(b.x, b.y, b.z, b.rot, svx, svy);
    castShadow(b.x, b.y, b.z - BR, BR * .95, 1, 0);
  }
  const windT = STILL ? 0 : Math.floor(G.time * WIND_FPS) / WIND_FPS;
  drawLeaves(windT);
  drawTufts(windT);
  flushShadows();
  applyShadows(bakedZ);
  shadeEdges();
  drawPath();
  drawMeter();
  const top = project(HX - .8, 0, 1.6);
  for (const p of G.popups) if (!(p.t > 1.1 && Math.floor(p.t * 14) % 2)) drawText(p.text, top.sx, Math.round(top.sy - 14 - p.t * 8), SIGNAL, 3);
  ctx.putImageData(image, 0, 0);
}

/* ================= hud ================= */
const nodes = { pts: document.getElementById('pts'), card: document.getElementById('card'), best: document.getElementById('best'), status: document.getElementById('status') };
function renderHud() {
  const sc = frameScores();
  nodes.pts.textContent = liveScore();
  let h = '';
  for (let f = 0; f < 10; f++) {
    const m = marks(f), slots = f === 9 ? 3 : 2;
    let cells = '';
    for (let k = 0; k < slots; k++) cells += '<s>' + (m[k] ?? '') + '</s>';
    h += '<div class="fr' + (f === G.frame && G.phase !== 'over' ? ' now' : '') + '"><span>' + cells + '</span><b>' + (sc[f] ?? '') + '</b></div>';
  }
  nodes.card.innerHTML = h;
  nodes.best.textContent = G.best ? 'best ' + G.best : '';
}
let statusText = '';
function setStatus(text) { if (text !== statusText) { statusText = text; nodes.status.textContent = text; } }

/* ================= input ================= */
const stage = document.getElementById('stage'), rules = document.getElementById('rules');
function press() {
  ensureAudio();
  if (G.phase === 'over') { if (G.phaseT > .6) reset(); return; }
  tap();
}
stage.addEventListener('pointerdown', e => {
  if (e.button > 0) return;
  canvas.focus({ preventScroll: true });
  press();
});
addEventListener('keydown', e => {
  if (rules.open || (e.key !== ' ' && e.key !== 'Enter') || e.target.tagName === 'BUTTON') return;
  e.preventDefault();
  if (!e.repeat) press();
});
document.getElementById('rules-open').addEventListener('click', () => rules.showModal());
rules.addEventListener('click', e => { if (e.target === rules) rules.close(); });
rules.addEventListener('close', () => canvas.focus({ preventScroll: true }));

/* ================= sound ================= */
let rumbleNode = null;
function rumble(on) {
  if (!audio || muted) { if (!on && rumbleNode) { try { rumbleNode.src.stop(); } catch (e) { /* already stopped */ } rumbleNode = null; } return; }
  if (on && !rumbleNode) {
    const src = audio.createBufferSource(), f = audio.createBiquadFilter(), g = audio.createGain();
    src.buffer = noiseBuf; src.loop = true; f.type = 'lowpass'; f.frequency.value = 180;
    g.gain.setValueAtTime(.0001, audio.currentTime); g.gain.linearRampToValueAtTime(.22, audio.currentTime + .3);
    src.connect(f).connect(g).connect(audio.destination); src.start();
    rumbleNode = { src, g };
  } else if (!on && rumbleNode) {
    const { src, g } = rumbleNode, now = audio.currentTime;
    g.gain.cancelScheduledValues(now); g.gain.setValueAtTime(g.gain.value, now); g.gain.linearRampToValueAtTime(.0001, now + .25);
    src.stop(now + .3);
    rumbleNode = null;
  }
}
let lastPin = 0;
function sound(kind, amt = .6) {
  if (!audio || muted) return;
  if (kind === 'tick') tone(900, 900, .05, .04, 'square');
  else if (kind === 'release') tone(110, 60, .15, .2, 'sine');
  else if (kind === 'pin') {
    const now = audio.currentTime;
    if (now - lastPin < .025) return;
    lastPin = now;
    tone(700 + Math.random() * 700, 400 + Math.random() * 300, .07, .05 + amt * .1, 'triangle');
    hiss(.05, 2500 + Math.random() * 1500, 1, .04 + amt * .08);
  }
  else if (kind === 'gutter') tone(180, 140, .25, .06, 'sawtooth');
  else if (kind === 'pit') hiss(.2, 300, .6, .08);
  else if (kind === 'strike') { hiss(1, 1200, .3, .1); tone(523, 523, .1, .05, 'triangle'); tone(659, 659, .1, .05, 'triangle', .09); tone(1046, 1046, .25, .05, 'triangle', .18); }
  else if (kind === 'spare') { tone(659, 659, .1, .05, 'triangle'); tone(880, 880, .2, .05, 'triangle', .09); }
}
const muteButton = document.getElementById('mute');
muteButton.addEventListener('click', () => {
  muteButton.blur();
  muted = !muted;
  if (muted) rumble(false);
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
window.__bowling = { G, update, draw, tap, current, frameScores, marks, totalScore, project };
