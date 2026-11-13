function ik(a, c, l1, l2, bend) {
  let dx = c[0] - a[0], dy = c[1] - a[1], dz = c[2] - a[2];
  let d = Math.hypot(dx, dy, dz) || 1e-6;
  const reach = (l1 + l2) * .995;
  if (d > reach) { const k = reach / d; dx *= k; dy *= k; dz *= k; d = reach; }
  const ux = dx / d, uy = dy / d, uz = dz / d;
  const x = (l1 * l1 - l2 * l2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, l1 * l1 - x * x));
  let bx = bend[0], by = bend[1], bz = bend[2];
  const dt = bx * ux + by * uy + bz * uz;
  bx -= dt * ux; by -= dt * uy; bz -= dt * uz;
  const bl = Math.hypot(bx, by, bz) || 1;
  return {
    m: [a[0] + ux * x + bx / bl * h, a[1] + uy * x + by / bl * h, a[2] + uz * x + bz / bl * h],
    e: [a[0] + dx, a[1] + dy, a[2] + dz],
  };
}
function body(crouch, lean) {
  const hipZ = 1.28 - crouch * .42, hipA = -crouch * .16;
  return { hipZ, hipA, shA: hipA + Math.sin(lean) * .95, shZ: hipZ + Math.cos(lean) * .95 };
}
// flat bands with no dither and a dark silhouette, so figures stay sharp on the textured court
function player(px, py, yaw, pose, pal) {
  const fx = Math.cos(yaw), fy = Math.sin(yaw), sx = -fy, sy = fx, base = pose.z || 0;
  const P = (a, b, c) => [px + fx * a + sx * b, py + fy * a + sy * b, c + base];
  const add = (a, b, r0, r1, col) => {
    capsule(a, b, r0, r1, typeof col === 'function' ? col : () => col, 'solid');
    pendingShadows.push(a, r0, b, r1);
  };
  const lean = pose.lean || 0, fr = body(pose.crouch || 0, lean), fwd = [fx, fy, 0];
  for (const [side, foot] of [[.15, pose.footR || [.1, 0]], [-.15, pose.footL || [-.08, 0]]]) {
    const [fa, lift] = foot, hip = P(fr.hipA, side, fr.hipZ);
    const leg = ik(hip, P(fa, side * 1.3, .11 + lift), .62, .6, fwd);
    add(hip, leg.m, .18, .15, pal.shorts);
    add(leg.m, leg.e, .12, .1, z => z - base - lift < .36 ? pal.sock : pal.shin || pal.skin);
    add(leg.e, [leg.e[0] + fx * .17, leg.e[1] + fy * .17, leg.e[2] - .03], .1, .09, pal.shoe);
  }
  const waist = P(fr.hipA, 0, fr.hipZ - .04), neck = P(fr.shA, 0, fr.shZ + .06), hz = base + fr.hipZ + .12;
  add(waist, neck, .29, .32, z => z < hz ? pal.shorts : pal.jersey);
  const head = P(fr.shA + Math.sin(lean) * .3, 0, fr.shZ + .36);
  add(neck, head, .11, .12, pal.skin);
  add(head, head, .24, .24, pal.skin);
  const hair = [head[0] - fx * .06, head[1] - fy * .06, head[2] + .08];
  add(hair, hair, .205, .205, pal.hair);
  for (const [side, hand] of [[.35, pose.hR], [-.35, pose.hL]]) {
    const sg = Math.sign(side), sh = P(fr.shA, side, fr.shZ - .04);
    const target = hand ? P(hand[0], hand[1], hand[2]) : P(fr.shA + .04, side * 1.2, fr.shZ - .9);
    const arm = ik(sh, target, .46, .47, [sx * sg * .7 - fx * .2, sy * sg * .7 - fy * .2, -.7]);
    add(sh, sh, .14, .14, pal.jersey);
    add(sh, arm.m, .1, .085, pal.sleeve || pal.skin);
    add(arm.m, arm.e, .085, .075, pal.skin);
  }
  return pose.ball ? P(pose.ball[0], pose.ball[1], pose.ball[2]) : null;
}

