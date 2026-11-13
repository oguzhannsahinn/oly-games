/* ================= the sheet ================= */
const HACK_X = 8.4, TEE_X = -6.2, BACK_X = -8.6, HOG_X = -2.6, SW = 1.65, SR = .15, HOUSE = 1.25;
const MU = .5, MU_SWEEP = .32, CURL = .55, ENDS = 3, STONES = 4;
const ISLAND = { cx: 0, ax: 11.2, ay: 5.4 };
const PINE = [44, 92, 70], PINE_LIGHT = [70, 124, 88], SNOW_W = [236, 242, 248], WOOD = [150, 112, 76], STEEL = [96, 104, 122];
const FANS = [[64, 160, 176], [242, 190, 48], [150, 94, 196], [214, 58, 62], [84, 166, 90], [255, 106, 61], [64, 160, 176], [242, 190, 48]];
const KIND_ICE = 4;
const ICE_C = [232, 240, 246], RING_BLUE = [64, 120, 200], RING_RED = [214, 58, 62], GRANITE = [128, 132, 142];
const YOU = [255, 106, 61], CPU = [64, 160, 176];
const THROWER = { jersey: YOU, shorts: [36, 44, 66], shin: [36, 44, 66], sock: [36, 44, 66], skin: [222, 172, 132], hair: [92, 60, 36], shoe: [36, 44, 66], sleeve: YOU };
const CPU_PAL = { jersey: CPU, shorts: [36, 44, 66], shin: [36, 44, 66], sock: [36, 44, 66], skin: [196, 144, 106], hair: [36, 28, 24], shoe: [36, 44, 66], sleeve: CPU };

function pick(tones, v, ix, iy, dither = .6) { return tones[clamp(Math.floor(v * 4 + (bayerAt(ix, iy) - .5) * dither), 0, 3)]; }
function islandEdge(x, y) { return Math.pow(Math.pow(Math.abs(x - ISLAND.cx) / ISLAND.ax, 4) + Math.pow(Math.abs(y) / ISLAND.ay, 4), .25); }
function groundColor(x, y, ix, iy, i) {
  const edge = islandEdge(x, y), rough = edge + (noise(x * 1.3, y * 1.3) - .5) * .12;
  if (rough > 1.04) return 0;
  if (rough > .93 && hash(ix, iy) < (rough - .93) / .11) return 0;
  const ay = Math.abs(y);
  if (x > BACK_X - .05 && x < HACK_X + .9 && ay < SW + .2) {
    kinds[i] = KIND_ICE;
    if (ay > SW) return rgb(150, 112, 76);
    const d = Math.hypot(x - TEE_X, y);
    if (Math.abs(x - TEE_X) < .03 || (Math.abs(y) < .03 && x < HACK_X)) return rgb(60, 70, 96);
    if (Math.abs(x - HOG_X) < .06 || Math.abs(x - BACK_X) < .03) return rgb(214, 58, 62);
    if (d < HOUSE) {
      if (d > HOUSE * .67) return pick(tonesOf(RING_BLUE), .55, ix, iy, .3);
      if (d > HOUSE * .45) return pick(tonesOf(ICE_C), .6, ix, iy, .3);
      if (d > HOUSE * .18) return pick(tonesOf(RING_RED), .55, ix, iy, .3);
    }
    if (Math.abs(x - HACK_X) < .12 && Math.abs(y) < .2) return rgb(40, 44, 56);
    return pick(tonesOf(ICE_C), .55 + (noise(x * 3, y * 3) - .5) * .3 + (hash(ix, iy) > .97 ? .4 : 0), ix, iy, .35);
  }
  kinds[i] = KIND_GRASS;
  const t = noise(x * .9, y * .9) * 1.15 + (hash(ix, iy) - .5) * .55 - .08;
  return rgb(...[[206, 220, 236], [222, 232, 244], [236, 242, 248], [244, 248, 252]][clamp(Math.floor(t * 4.2), 0, 3)]);
}
function bake() {
  zb.fill(-1e9); pix.fill(CLEAR);
  for (let iy = 0; iy < H; iy++) for (let ix = 0; ix < W; ix++) {
    const g = unproject(ix + .5, iy + .5), i = iy * W + ix, c = groundColor(g.x, g.y, ix, iy, i);
    if (!c) continue;
    pix[i] = c; ground[i] = 1;
    zb[i] = (g.x + g.y) / R2 * COS;
  }
  groundZ.set(zb);
  // low boards along both sides and the back
  for (const sg of [-1, 1]) box(BACK_X - .05, sg > 0 ? SW : -SW - .12, 0, HACK_X + .9, sg > 0 ? SW + .12 : -SW, .18, [150, 112, 76], sg + 3);
  box(BACK_X - .17, -SW - .12, 0, BACK_X - .05, SW + .12, .18, [150, 112, 76], 5);
  for (let x = BACK_X - .05; x < HACK_X + .9; x += .2) castShadow(x, -SW - .06, .12, .1);
  scenery();
  bakeOcclusion();
  staticShadow.set(shadowMask);
  applyShadows(groundZ);
  bakedPix.set(pix);
  bakedZ.set(zb);
}
function pine(x, y, s) {
  capsule([x, y, 0], [x, y, .6 * s], .1 * s, .08 * s, () => [92, 70, 54], 'rough');
  for (let k = 0; k < 5; k++) {
    const z = (.5 + k * .55) * s, r = (1.05 - k * .19) * s;
    for (let a = 0; a < 6.283; a += .6 / (k + 1.5)) {
      const rr = r * (.55 + hash(k * 7 + a, x) * .45);
      sphere(x + Math.cos(a) * rr * .6, y + Math.sin(a) * rr * .6, z, .26 * s, hash(a, k) > .62 ? SNOW_W : k % 2 ? PINE : PINE_LIGHT, 'rough');
    }
    sphere(x, y, z + .18 * s, .3 * s, k === 4 ? SNOW_W : PINE, 'rough');
    castShadow(x, y, z, r * .6);
  }
}
function lamp(x, y) {
  capsule([x, y, 0], [x, y, 2.1], .05, .05, () => STEEL, 'solid');
  capsule([x, y, 2.1], [x + .25, y, 2.2], .04, .04, () => STEEL, 'solid');
  sphere(x + .3, y, 2.15, .12, [255, 232, 160], 'solid');
  for (let z = 0; z < 2.1; z += .2) castShadow(x, y, z, .06);
}
function flag(x, y, c) {
  capsule([x, y, 0], [x, y, 1.9], .035, .035, () => [230, 230, 226], 'solid');
  for (let a = 0; a < .7; a += .06) for (let b = 0; b < .4; b += .06) plot(x - a, y, 1.85 - b - Math.sin(a * 5) * .04, rgb(...(b < .2 ? c : [244, 244, 240])));
  for (let z = 0; z < 1.9; z += .25) castShadow(x, y, z, .05);
}
function snowman(x, y) {
  sphere(x, y, .3, .32, SNOW_W, 'rough'); sphere(x, y, .78, .23, SNOW_W, 'rough'); sphere(x, y, 1.12, .16, SNOW_W, 'rough');
  capsule([x + .1, y + .1, 1.13], [x + .3, y + .2, 1.1], .03, .01, () => [255, 106, 61], 'solid');
  capsule([x, y, 1.25], [x, y, 1.42], .12, .1, () => [30, 42, 69], 'solid');
  capsule([x, y - .2, .82], [x, y - .55, 1.05], .025, .02, () => [92, 70, 54], 'solid');
  castShadow(x, y, .6, .35);
}
function scenery() {
  // the stand along the far side, two steps of benches
  box(-6, -4.0, 0, 3, -3.5, .3, [196, 160, 112], 21);
  box(-6, -4.6, 0, 3, -4.0, .6, [196, 160, 112], 22);
  box(-6, -4.75, 0, 3, -4.6, 1.15, [170, 132, 92], 23);
  // the scoreboard behind the house
  capsule([-9.2, -2.6, 0], [-9.2, -2.6, 1.6], .07, .07, () => STEEL, 'solid');
  capsule([-9.2, -1.2, 0], [-9.2, -1.2, 1.6], .07, .07, () => STEEL, 'solid');
  box(-9.35, -2.8, 1.5, -9.15, -1.0, 2.5, [30, 42, 69], 31);
  for (let k = 0; k < 6; k++) for (const [row, c] of [[2.25, YOU], [1.85, CPU]]) box(-9.16, -2.6 + k * .27, row - .12, -9.12, -2.42 + k * .27, row + .1, k < 3 ? c : [70, 84, 110], k);
  // a rack of spare stones by the hack
  box(9.6, -2.9, 0, 10.6, -2.1, .12, WOOD, 41);
  for (let k = 0; k < 4; k++) for (const t of [0, 1]) {
    const x = 9.8 + k * .23, y = -2.7 + t * .4;
    sphere(x, y, .2, SR, GRANITE, 'solid'); sphere(x, y, .3, SR * .7, t ? CPU : YOU, 'solid');
  }
  for (const [x, y] of [[-7.6, 2.5], [-1.2, 2.5], [5.2, 2.5], [-1.2, -2.6], [6.2, -2.6]]) lamp(x, y);
  flag(9.4, 2.6, YOU); flag(9.9, 2.2, CPU); flag(-8.8, 2.9, [242, 190, 48]);
  snowman(2.2, 3.4);
  for (const [x, y, s] of [[-10.2, 3.4, .75], [-4.4, 4.1, .62], [-2.9, 3.7, .5], [7.2, 3.9, .7], [10.4, -4.0, .65], [5.6, -4.2, .55], [-9.8, -3.9, .6], [9.2, 4.2, .5], [0, 4.5, .45]]) pine(x, y, s);
}
function drawFans() {
  // the crowd stands up and cheers when you score
  const cheer = G.popups.some(p => !p.team && p.t < 2);
  FANS.forEach((c, k) => {
    const row = k % 2, x = -5.4 + k * 1.15 + row * .2, y = row ? -4.3 : -3.75, seat = row ? .6 : .3;
    const up = cheer && Math.sin(G.time * 9 + k) > -.3;
    const fr = body(up ? .05 : .95, up ? .02 : .1);
    const arms = up ? { hR: [fr.shA + .05, .5, fr.shZ + .8], hL: [fr.shA + .05, -.5, fr.shZ + .8] } : { hR: [.45, .3, .75], hL: [.45, -.3, .75] };
    const pose = up ? { z: seat - .05, crouch: .05, lean: .02, ...arms } : { z: seat - .45, crouch: .95, lean: .1, footR: [.55, .05], footL: [.55, .05], ...arms };
    player(x, y, Math.PI / 2 + .1, pose, { jersey: c, shorts: [36, 44, 66], shin: [36, 44, 66], sock: [36, 44, 66], skin: k % 3 ? [222, 172, 132] : [176, 124, 92], hair: [70, 48, 34], shoe: [36, 44, 66], sleeve: c });
  });
}
function drawStone(s) {
  if (s.out) return;
  for (let z = .02; z <= .12; z += .025) sphere(s.x, s.y, z, SR * (z > .1 ? .85 : 1), GRANITE, 'solid');
  sphere(s.x, s.y, .14, SR * .75, s.team ? CPU : YOU, 'solid');
  const a = s.rot;
  capsule([s.x - Math.cos(a) * .05, s.y - Math.sin(a) * .05, .2], [s.x + Math.cos(a) * .07, s.y + Math.sin(a) * .07, .2], .03, .03, () => s.team ? CPU : YOU, 'solid');
  castShadow(s.x, s.y, .06, SR, 1, 0);
}

/* ================= pixel text ================= */
const FONT = {
  '0': ['XXX', 'X.X', 'X.X', 'X.X', 'XXX'], '1': ['.X.', 'XX.', '.X.', '.X.', 'XXX'], '2': ['XXX', '..X', 'XXX', 'X..', 'XXX'],
  '3': ['XXX', '..X', '.XX', '..X', 'XXX'], '4': ['X.X', 'X.X', 'XXX', '..X', '..X'], '+': ['...', '.X.', 'XXX', '.X.', '...'],
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

/* ================= game state ================= */
const BEST_KEY = 'curling-wins';
function load() { try { return +localStorage.getItem(BEST_KEY) || 0; } catch (e) { return 0; } }
function save(v) { try { localStorage.setItem(BEST_KEY, String(v)); } catch (e) { /* storage may be off */ } }
const G = { time: 0, wins: load(), spin: 1 };
function reset() {
  Object.assign(G, { end: 0, scores: [[], []], popups: [], hammer: 1 });
  startEnd();
}
function startEnd() {
  G.stones = []; G.thrown = 0;
  // the side without the hammer throws first
  G.turn = 1 - G.hammer;
  nextThrow();
  renderHud();
}
function setPhase(p) { G.phase = p; G.phaseT = 0; }
function nextThrow() {
  if (G.thrown >= STONES * 2) return scoreEnd();
  G.turn = (G.thrown % 2 === 0) ? 1 - G.hammer : G.hammer;
  G.live = null;
  setPhase(G.turn === 0 ? 'aim' : 'cpu');
  setStatus(G.turn === 0 ? 'your stone · drag back and let go · tap fast to sweep' : 'the computer is throwing');
  renderHud();
}

/* ================= physics ================= */
function stepStone(s, dt, sweep) {
  const v = Math.hypot(s.vx, s.vy);
  if (v < .005) { s.vx = s.vy = 0; return; }
  const mu = sweep ? MU_SWEEP : MU, n = Math.max(0, v - mu * dt);
  // curl: the stone drifts the way it spins, more as it slows
  const curl = s.spin * CURL * (sweep ? .5 : 1) / Math.max(.6, v) * .35;
  s.vx *= n / v; s.vy *= n / v;
  const ux = s.vx / (n || 1), uy = s.vy / (n || 1);
  s.vx += -uy * curl * dt; s.vy += ux * curl * dt;
  s.x += s.vx * dt; s.y += s.vy * dt;
  s.rot += s.spin * dt * 1.5;
  if (Math.abs(s.y) > SW - SR || s.x < BACK_X - SR) { s.out = true; s.vx = s.vy = 0; }
}
function collideStones() {
  const a = G.stones.filter(s => !s.out);
  for (let i = 0; i < a.length; i++) for (let k = i + 1; k < a.length; k++) {
    const p = a[i], q = a[k], dx = q.x - p.x, dy = q.y - p.y, d = Math.hypot(dx, dy);
    if (d >= SR * 2 || d < 1e-6) continue;
    const nx = dx / d, ny = dy / d, o = (SR * 2 - d) / 2;
    p.x -= nx * o; p.y -= ny * o; q.x += nx * o; q.y += ny * o;
    const rel = (p.vx - q.vx) * nx + (p.vy - q.vy) * ny;
    if (rel <= 0) continue;
    const j = rel * .95;
    p.vx -= j * nx; p.vy -= j * ny; q.vx += j * nx; q.vy += j * ny;
    sound('clack', Math.min(1, rel / 2));
  }
}
function release(dir, speed, spin, team) {
  const s = { x: HACK_X - .4, y: 0, vx: Math.cos(dir) * speed, vy: Math.sin(dir) * speed, spin, team, rot: 0, out: false };
  G.stones.push(s); G.live = s; G.thrown++;
  setPhase('slide');
  sound('slide');
}
// a ghost run of one stone alone, to find where a throw would stop
function ghost(dir, speed, spin) {
  const s = { x: HACK_X - .4, y: 0, vx: Math.cos(dir) * speed, vy: Math.sin(dir) * speed, spin, rot: 0 };
  for (let i = 0; i < 3000 && Math.hypot(s.vx, s.vy) > .005 && !s.out; i++) stepStone(s, 1 / 60, false);
  return s;
}
function cpuThrow() {
  // aim for the button, or knock out the player's best stone if it sits closest
  const mine = G.stones.filter(s => !s.out && s.team === 0 && Math.hypot(s.x - TEE_X, s.y) < HOUSE);
  const best = mine.sort((a, b) => Math.hypot(a.x - TEE_X, a.y) - Math.hypot(b.x - TEE_X, b.y))[0];
  const theirs = G.stones.filter(s => !s.out && s.team === 1).map(s => Math.hypot(s.x - TEE_X, s.y));
  const takeout = best && (!theirs.length || Math.hypot(best.x - TEE_X, best.y) < Math.min(...theirs));
  const target = takeout ? [best.x, best.y] : [TEE_X + (Math.random() - .5) * .3, (Math.random() - .5) * .3];
  const spin = Math.random() < .5 ? 1 : -1;
  let bestDir = Math.PI, bestSpeed = 3, bestErr = 1e9;
  const dist = HACK_X - .4 - target[0];
  const base = Math.sqrt(2 * MU * dist);
  for (let a = -.08; a <= .08; a += .004) {
    const dir = Math.PI + a;
    const sp = takeout ? base * 1.45 : base;
    const g = ghost(dir, sp, spin);
    const err = takeout ? Math.abs(lineY(dir, sp, spin, target[0]) - target[1]) : Math.hypot(g.x - target[0], g.y - target[1]);
    if (err < bestErr) { bestErr = err; bestDir = dir; bestSpeed = sp; }
  }
  // even the computer is not perfect
  release(bestDir + (Math.random() - .5) * .016, bestSpeed * (1 + (Math.random() - .5) * .07), spin, 1);
}
function lineY(dir, speed, spin, x) {
  const s = { x: HACK_X - .4, y: 0, vx: Math.cos(dir) * speed, vy: Math.sin(dir) * speed, spin, rot: 0 };
  for (let i = 0; i < 3000 && s.x > x && Math.hypot(s.vx, s.vy) > .005 && !s.out; i++) stepStone(s, 1 / 60, false);
  return s.y;
}

/* ================= scoring ================= */
function scoreEnd() {
  const live = G.stones.filter(s => !s.out).map(s => ({ team: s.team, d: Math.hypot(s.x - TEE_X, s.y) })).filter(s => s.d < HOUSE + SR).sort((a, b) => a.d - b.d);
  let team = -1, pts = 0;
  if (live.length) { team = live[0].team; for (const s of live) { if (s.team !== team) break; pts++; } }
  G.scores[0].push(team === 0 ? pts : 0); G.scores[1].push(team === 1 ? pts : 0);
  if (team >= 0) G.popups.push({ text: '+' + pts, t: 0, team });
  // the side that scores gives the hammer away
  if (team >= 0) G.hammer = 1 - team;
  setStatus(team < 0 ? 'blank end · nobody in the house' : (team === 0 ? 'you score ' : 'the computer scores ') + pts);
  sound(team === 0 ? 'cheer' : 'end');
  setPhase('endover');
  renderHud();
}
const totals = () => [G.scores[0].reduce((a, b) => a + b, 0), G.scores[1].reduce((a, b) => a + b, 0)];
function finish() {
  setPhase('over');
  const [a, b] = totals();
  if (a > b) { G.wins++; save(G.wins); }
  setStatus((a > b ? 'you win ' : a < b ? 'the computer wins ' : 'a draw · ') + a + '–' + b + ' · tap to play again');
  showOver(a > b ? 'You win!' : a < b ? 'Computer wins' : 'Draw', 'you ' + a + ' · computer ' + b + (a > b ? ' · wins ' + G.wins : ''));
  renderHud();
}

/* ================= update ================= */
function update(dt) {
  G.time += dt; G.phaseT += dt;
  if (G.phase === 'cpu' && G.phaseT > 1.1) cpuThrow();
  G.sweepHeat = Math.max(0, (G.sweepHeat || 0) - dt * 2.2);
  const sweeping = G.live && G.live.team === 0 && G.sweepHeat > .4;
  const N = 6, h = dt / N;
  for (let s = 0; s < N; s++) {
    for (const st of G.stones) if (!st.out) stepStone(st, h, st === G.live && sweeping);
    collideStones();
  }
  if (G.phase === 'slide') {
    const moving = G.stones.some(s => !s.out && Math.hypot(s.vx, s.vy) > .01);
    if (G.live && !G.live.out && G.live.x > HOG_X && !moving) { G.live.out = true; setStatus('did not reach the hog line · stone removed'); }
    if (!moving && G.phaseT > .5) { setPhase('rest'); }
  }
  if (G.phase === 'rest' && G.phaseT > .7) nextThrow();
  if (G.phase === 'endover' && G.phaseT > 2.4) { G.end++; if (G.end >= ENDS) finish(); else startEnd(); }
  for (const p of G.popups) p.t += dt;
  G.popups = G.popups.filter(p => p.t < 2);
}

/* ================= drawing ================= */
function draw() {
  pix.set(bakedPix);
  zb.set(bakedZ);
  // the one figure on the ice: the thrower at the hack
  const thrower = G.turn === 0 ? THROWER : CPU_PAL;
  const lunge = G.phase === 'slide' && G.phaseT < 1;
  player(HACK_X + .2, .35, Math.PI, { crouch: lunge ? .55 : .3, lean: lunge ? .7 : .3, footR: [lunge ? .5 : .1, 0], footL: [lunge ? -.6 : -.1, 0] }, thrower);
  // while sweeping, the ice in front of the stone shows the brush marks
  const sw = G.live;
  if (sw && !sw.out && sw.team === 0 && G.phase === 'slide' && G.sweepHeat > .4) {
    for (let k = 0; k < 14; k++) {
      const ahead = .5 + (k % 7) * .18, side = Math.sin(G.time * 26 + k * 1.7) * .3;
      const q = project(sw.x + ahead, sw.y + side, .02);
      dot(Math.round(q.sx), Math.round(q.sy), k & 1 ? PAPER : rgb(200, 216, 230));
    }
  }
  drawFans();
  for (const st of G.stones) drawStone(st);
  if (G.phase === 'aim' && !G.drag) drawStone({ x: HACK_X - .4, y: 0, team: 0, rot: 0 });
  flushShadows();
  applyShadows(bakedZ);
  shadeEdges();
  if (G.phase === 'aim' && G.drag) drawAim();
  const top = project(TEE_X, 0, 1.6);
  for (const p of G.popups) if (!(p.t > 1.6 && Math.floor(p.t * 14) % 2)) drawText(p.text, top.sx, Math.round(top.sy - p.t * 8), p.team ? rgb(...CPU) : SIGNAL, 3);
  ctx.putImageData(image, 0, 0);
}
function dragShot() {
  const d = G.drag, du = d.dx / S, dv = d.dy / (S * SIN);
  const wx = (du + dv) / R2, wy = (dv - du) / R2;
  const dir = clamp(Math.atan2(-wy, -wx), Math.PI - .12, Math.PI + .12) * (Math.atan2(-wy, -wx) < 0 ? 1 : 1);
  const a = Math.atan2(-wy, -wx), dirC = a > 0 ? clamp(a, Math.PI - .12, Math.PI) : clamp(a + Math.PI * 2, Math.PI, Math.PI + .12);
  return { dir: dirC, speed: clamp(Math.hypot(d.dx, d.dy) / 50, 0, 1) * 4.6 };
}
function drawAim() {
  const sh = dragShot(), g = { x: HACK_X - .4, y: 0, vx: Math.cos(sh.dir) * sh.speed, vy: Math.sin(sh.dir) * sh.speed, spin: G.spin, rot: 0 };
  // the path the stone would take unswept, to where it would stop
  let k = 0;
  while (k++ < 4000 && Math.hypot(g.vx, g.vy) > .005 && !g.out) {
    stepStone(g, 1 / 60, false);
    if (k % 14 === 0) {
      const p = project(g.x, g.y, .02), x = Math.round(p.sx), y = Math.round(p.sy);
      for (const [ox, oy] of [[-1, 0], [2, 0], [-1, 1], [2, 1], [0, -1], [1, -1], [0, 2], [1, 2]]) dot(x + ox, y + oy, INK);
      for (const [ox, oy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) dot(x + ox, y + oy, PAPER);
    }
  }
  const p = project(g.x, g.y, .02), cx = Math.round(p.sx), cy = Math.round(p.sy);
  for (let a = 0; a < 6.283; a += .15) for (let o = -1; o <= 1; o++) dot(Math.round(cx + Math.cos(a) * 5) + o, Math.round(cy + Math.sin(a) * 3), g.out ? rgb(150, 156, 170) : SIGNAL);
}

/* ================= hud ================= */
const nodes = { you: document.getElementById('pts'), cpu: document.getElementById('cpu'), ends: document.getElementById('ends'), spin: document.getElementById('spin'), best: document.getElementById('best'), status: document.getElementById('status') };
function renderHud() {
  const [a, b] = totals();
  nodes.you.textContent = a; nodes.cpu.textContent = b;
  let h = '';
  for (let e = 0; e < ENDS; e++) h += '<span class="' + (e === G.end && G.phase !== 'over' ? 'now' : '') + '">' + (G.scores[0][e] ?? '·') + '<i>' + (G.scores[1][e] ?? '·') + '</i></span>';
  const left = STONES - Math.ceil(G.stones.filter(s => s.team === 0).length);
  nodes.ends.innerHTML = h + '<em>' + '●'.repeat(Math.max(0, left)) + '</em>';
  nodes.spin.textContent = G.spin > 0 ? 'spin ⟲' : 'spin ⟳';
  nodes.best.textContent = G.wins ? 'wins ' + G.wins : '';
}
let statusText = '';
function setStatus(text) { if (text !== statusText) { statusText = text; nodes.status.textContent = text; } }

/* ================= input ================= */
const stage = document.getElementById('stage'), rules = document.getElementById('rules');
function scale() { const r = canvas.getBoundingClientRect(); return W / r.width; }
function sweepTap() { if (G.phase === 'slide' && G.live && G.live.team === 0) { G.sweepHeat = Math.min(1.4, (G.sweepHeat || 0) + .35); sound('sweep'); } }
stage.addEventListener('pointerdown', e => {
  if (e.button > 0) return;
  ensureAudio();
  try { stage.setPointerCapture(e.pointerId); } catch (err) { /* older browsers */ }
  canvas.focus({ preventScroll: true });
  if (G.phase === 'over') { if (G.phaseT > .6) reset(); return; }
  if (G.phase === 'aim') G.drag = { x: e.clientX, y: e.clientY, dx: 0, dy: 0 };
  else sweepTap();
});
stage.addEventListener('pointermove', e => { if (G.drag) { const k = scale(); G.drag.dx = (e.clientX - G.drag.x) * k; G.drag.dy = (e.clientY - G.drag.y) * k; } });
stage.addEventListener('pointerup', () => {
  if (!G.drag) return;
  const sh = dragShot(); G.drag = null;
  if (G.phase === 'aim' && sh.speed > .5) release(sh.dir, sh.speed, G.spin, 0);
});
stage.addEventListener('pointercancel', () => { G.drag = null; });
nodes.spin.addEventListener('click', e => { e.stopPropagation(); G.spin = -G.spin; nodes.spin.blur(); renderHud(); });
addEventListener('keydown', e => {
  if (rules.open || e.target.tagName === 'BUTTON') return;
  if (e.key === 's' || e.key === 'S') { G.spin = -G.spin; renderHud(); return; }
  if (e.key !== ' ' && e.key !== 'Enter') return;
  e.preventDefault(); ensureAudio();
  if (G.phase === 'over') { if (G.phaseT > .6) reset(); return; }
  sweepTap();
});
document.getElementById('rules-open').addEventListener('click', () => rules.showModal());
rules.addEventListener('click', e => { if (e.target === rules) rules.close(); });
rules.addEventListener('close', () => canvas.focus({ preventScroll: true }));

/* ================= sound ================= */
function sound(kind, amt = .6) {
  if (!audio || muted) return;
  if (kind === 'slide') hiss(2.4, 500, .5, .07);
  else if (kind === 'clack') { tone(1400, 900, .08, .1 + amt * .15, 'triangle'); hiss(.04, 3000, 1, .1); }
  else if (kind === 'sweep') hiss(.08, 3500, .8, .05);
  else if (kind === 'cheer') { tone(523, 523, .1, .05, 'triangle'); tone(784, 784, .2, .05, 'triangle', .1); }
  else if (kind === 'end') tone(330, 260, .3, .05, 'triangle');
}
const muteButton = document.getElementById('mute');
muteButton.addEventListener('click', () => { muteButton.blur(); muted = !muted; muteButton.textContent = muted ? 'sound off' : 'sound on'; muteButton.setAttribute('aria-pressed', String(muted)); });

/* ================= boot ================= */
addEventListener('resize', fit);
fit();
bake();
reset();
let last = performance.now();
function frame(now) { update(Math.min(.04, (now - last) / 1000)); last = now; draw(); requestAnimationFrame(frame); }
requestAnimationFrame(frame);
window.__curl = { G, update, draw, release, ghost, cpuThrow, TEE_X, HACK_X };
