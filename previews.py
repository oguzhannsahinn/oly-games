"""Capture a menu preview for each game: play it a little, freeze a good moment, crop to the island."""
import asyncio, base64, io, os, sys
from playwright.async_api import async_playwright
from PIL import Image

ROOT = os.path.dirname(os.path.abspath(__file__))
SKY = (228, 238, 242)

# each entry: JS run after load (may start an autoplay), JS that must turn true, JS that returns the canvas data URL
SETUP = {
    'three-point': (
        """() => { const U = window.__uclik, G = U.G;
          (function tick(){ if (G.phase==='set') U.press(); else if (G.phase==='charge' && Math.abs(G.power-G.target)<.02) U.letGo(); requestAnimationFrame(tick); })(); }""",
        "() => window.__uclik.G.balls.length >= 2 && window.__uclik.G.balls.some(b => b.z > 4.6 && !b.resolved && b.vz > 0)",
        "() => document.getElementById('c').toDataURL()",
    ),
    'archery': (
        """() => { const A = window.__arrows, G = A.G;
          (function tick(){ const c = A.project(-6.6,0,1.6); G.aim=[c.sx + G.windTarget*1.4 + (Math.random()-.5)*7, c.sy-14 + (Math.random()-.5)*7];
            if (G.phase==='ready') A.press(); else if (G.phase==='draw' && G.draw>=.999) A.letGo(); requestAnimationFrame(tick); })(); }""",
        "() => window.__arrows.G.scores.length >= 4 && window.__arrows.G.phase === 'draw' && window.__arrows.G.draw > .9",
        "() => { const A = window.__arrows, G = A.G; G.popups = []; G.aim = [-50, -50]; A.draw(); return document.getElementById('c').toDataURL(); }",
    ),    'penalty': (
        "() => { const P = window.__penalty; P.kick({ T: [P.GX, -2.9, 1.9], bend: .12, power: .6 }); }",
        "() => { const G = window.__penalty.G; return G.ball.x < -2.2 && G.keeper.state !== 'ready'; }",
        "() => { window.__penalty.G.popups = []; window.__penalty.draw(); return document.getElementById('c').toDataURL(); }",
    ),
    'bowling': (
        "() => { const G = window.__bowling.G; G.lock = { y: .3, ang: -.03, spin: -1 }; G.phase = 'approach'; G.phaseT = 0; }",
        "() => { const G = window.__bowling.G; return G.pins.filter(p => p.down).length >= 4 && G.pins.some(p => p.down && p.tilt < 1.2); }",
        "() => document.getElementById('c').toDataURL()",
    ),
    'minigolf': (
        "() => { const Gf = window.__golf; Gf.startHole(5); Gf.G.time = 1.9; Gf.putt(Math.PI, .62); }",
        "() => { const G = window.__golf.G; return G.ball.x < 2.3; }",
        "() => document.getElementById('c').toDataURL()",
    ),
    'diving': (
        "() => { const D = window.__diving; D.press(); }",
        "() => { const G = window.__diving.G; return G.phase === 'air' && G.D.rot > 2.2; }",
        "() => document.getElementById('c').toDataURL()",
    ),
    'curling': (
        "() => { const C = window.__curl, G = C.G; G.stones.push({x:-4.6,y:.3,vx:0,vy:0,spin:1,team:1,rot:0,out:false},{x:-5.3,y:-.5,vx:0,vy:0,spin:1,team:0,rot:1,out:false},{x:-3.9,y:-.2,vx:0,vy:0,spin:1,team:1,rot:2,out:false}); C.release(Math.PI + .01, 3.5, 1, 0); }",
        "() => window.__curl.G.live && window.__curl.G.live.x < 0.5",
        "() => document.getElementById('c').toDataURL()",
    ),
    'hurdles': (
        "() => { const H = window.__hurdles; H.press(); H.press(); (function t(){ const G = H.G; if (G.phase === 'run') { const h = G.hurdles.find(x => x.state === 'todo'); if (h && h.x - G.A.x < .3 && h.x - G.A.x > .1) H.jumpAt(); } requestAnimationFrame(t); })(); }",
        "() => window.__hurdles.G.jump && window.__hurdles.G.jump.t > .25 && window.__hurdles.G.A.x > 0",
        "() => document.getElementById('c').toDataURL()",
    ),
    'shooting': (
        "() => { const S = window.__shoot, G = S.G; G.started = true; G.running = true; for (let i = 0; i < 4; i++) S.spawnBalloon(); G.balloons.forEach((b, i) => { b.p[1] = -2.2 + i * 1.5; b.p[2] = 1.4 + (i % 2) * .6; }); G.aim = [250, 150]; G.aimed = true; }",
        "() => window.__shoot.G.balloons.length >= 3",
        "() => document.getElementById('c').toDataURL()",
    ),
}


def crop(data, pad=6):
    im = Image.open(io.BytesIO(base64.b64decode(data.split(',')[1]))).convert('RGBA')
    px = im.load(); W, H = im.size
    xs = [x for x in range(W) for y in range(0, H, 2) if px[x, y][3] > 0]
    ys = [y for y in range(H) for x in range(0, W, 2) if px[x, y][3] > 0]
    return im.crop((max(0, min(xs) - pad), max(0, min(ys) - pad), min(W, max(xs) + pad), min(H, max(ys) + pad)))


async def main(ids):
    os.makedirs(os.path.join(ROOT, 'previews'), exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={'width': 1200, 'height': 900})
        for gid in ids:
            setup, ready, grab = SETUP[gid]
            await pg.goto('file://' + os.path.join(ROOT, 'dist', gid + '.html'))
            await pg.wait_for_timeout(500)
            await pg.evaluate(setup)
            await pg.wait_for_function(ready, timeout=40000)
            im = crop(await pg.evaluate(grab))
            # keep the sky out of the card: it gets its own background there
            im.save(os.path.join(ROOT, 'previews', gid + '.png'), optimize=True)
            print(gid, im.size)
        await b.close()

if __name__ == '__main__':
    asyncio.run(main(sys.argv[1:] or list(SETUP)))
