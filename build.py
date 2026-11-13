"""Assemble every game into a standalone page (dist/<id>.html) and the arcade menu (dist/index.html)."""
import base64, html, os, sys
from games import GAMES


def cloud(seed, w):
    import random
    r = random.Random(seed); cells = set()
    for b in range(5):
        cx, cy, rad = r.randint(3, w - 4), r.randint(4, 7), r.randint(2, 4)
        for x in range(cx - rad, cx + rad + 1):
            for y in range(cy - rad, 10):
                if (x - cx) ** 2 + (y - cy) ** 2 * 1.6 <= rad * rad and 0 <= x < w: cells.add((x, y))
    shade = ''.join(f'<rect x="{x}" y="{y}" width="1" height="1"/>' for x, y in cells if (x, y + 1) not in cells)
    body = ''.join(f'<rect x="{x}" y="{y}" width="1" height="1"/>' for x, y in cells)
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} 11" shape-rendering="crispEdges"><g fill="#fff">{body}</g><g fill="#c9dbec">{shade}</g></svg>'
def isle(seed):
    import random
    r = random.Random(seed); out = []
    for x in range(18):
        top = 4 + r.randint(0, 1); depth = int(4 + 4 * (1 - abs(x - 8.5) / 9) ** .7)
        out.append(f'<rect x="{x}" y="{top}" width="1" height="1" fill="#9fc4a8"/><rect x="{x}" y="{top+1}" width="1" height="{depth}" fill="#b9cfdc"/>')
    for t in range(r.randint(1, 3)):
        x = r.randint(3, 13); out.append(f'<rect x="{x}" y="1" width="2" height="3" fill="#8db59a"/>')
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 14" shape-rendering="crispEdges">{"".join(out)}</svg>'
def sky_layer():
    from urllib.parse import quote
    u = lambda s: "url('data:image/svg+xml," + quote(s) + "')"
    items = []
    for k, (top, w, size, dur, delay, op) in enumerate([(6, 22, 260, 150, 0, 1), (20, 18, 190, 120, -45, .9), (38, 26, 320, 180, -95, .95), (58, 16, 160, 100, -25, .8), (76, 20, 230, 160, -125, .85), (12, 18, 150, 130, -70, .7)]):
        items.append(f'<i class="cloud" style="top:{top}%;width:{size}px;height:{size*11//w}px;background-image:{u(cloud(k*7+3, w))};animation-duration:{dur}s;animation-delay:{delay}s;opacity:{op}"></i>')
    for k, (l, t, s) in enumerate([(5, 68, 90), (84, 60, 70), (88, 20, 52), (10, 28, 46)]):
        items.append(f'<i class="isle" style="left:{l}%;top:{t}%;width:{s}px;height:{s*14//18}px;background-image:{u(isle(k+11))};animation-delay:{-k*1.7}s"></i>')
    return '<div id="sky" aria-hidden="true">' + ''.join(items) + '</div>'
SKY_CSS = """  html { background: #6f9fd8; }
  body { background: radial-gradient(circle at 82% 78%, rgba(255, 214, 150, .85) 0, rgba(255, 190, 140, .35) 18%, transparent 42%) fixed, linear-gradient(180deg, #4f86cf 0%, #7eaee0 30%, #b9d3ea 55%, #f0cfb0 80%, #f2a982 100%) fixed; }
  #sky::after { content: ""; position: absolute; left: 76%; top: 70%; width: 120px; height: 120px; background: #ffe2a8; box-shadow: 0 0 0 10px rgba(255, 226, 168, .45), 0 0 0 22px rgba(255, 226, 168, .2); clip-path: polygon(30% 0, 70% 0, 70% 10%, 90% 10%, 90% 30%, 100% 30%, 100% 70%, 90% 70%, 90% 90%, 70% 90%, 70% 100%, 30% 100%, 30% 90%, 10% 90%, 10% 70%, 0 70%, 0 30%, 10% 30%, 10% 10%, 30% 10%); opacity: .9; }
  #sky { position: fixed; inset: 0; overflow: hidden; pointer-events: none; z-index: 0; }
  #sky i { position: absolute; display: block; background-size: 100% 100%; image-rendering: pixelated; }
  #sky .cloud { left: -220px; animation: drift linear infinite; }
  #sky .isle { opacity: .85; animation: bob 6s ease-in-out infinite; }
  @keyframes drift { to { transform: translateX(calc(100vw + 440px)); } }
  @keyframes bob { 50% { transform: translateY(-6px); } }
  @media (prefers-reduced-motion: reduce) { #sky i { animation: none; } #sky .cloud { left: auto; } }
"""


# ---- the menu's own background, tried here before it reaches the games ----
def menu_sky_layer():
    from urllib.parse import quote
    import random
    u = lambda svg: "url('data:image/svg+xml," + quote(svg) + "')"
    def islet(seed, tree):
        r = random.Random(seed); out = []
        W = 24
        for x in range(W):
            edge = abs(x - (W - 1) / 2) / (W / 2)
            top = 6 + (1 if edge > .8 else 0) + r.randint(0, 1) * (edge > .6)
            depth = int(2 + 9 * (1 - edge) ** 1.4 + r.randint(0, 1))
            out.append(f'<rect x="{x}" y="{top}" width="1" height="2" fill="{"#86bd5c" if r.random() > .3 else "#6aa646"}"/>')
            out.append(f'<rect x="{x}" y="{top + 2}" width="1" height="{depth}" fill="{"#9a7050" if x % 3 else "#7d573c"}"/>')
            out.append(f'<rect x="{x}" y="{top + 2 + depth}" width="1" height="1" fill="#6b4a32"/>')
        if tree:
            x = r.randint(5, 15)
            out.append(f'<rect x="{x + 1}" y="3" width="1" height="3" fill="#6b4a32"/><rect x="{x}" y="0" width="3" height="3" fill="#4f8a3a"/><rect x="{x - 1}" y="1" width="5" height="2" fill="#5f9a3c"/>')
        return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 20" shape-rendering="crispEdges">{"".join(out)}</svg>'
    P = lambda rows, pal: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d" shape-rendering="crispEdges">' % (len(rows[0]), len(rows)) + ''.join(f'<rect x="{x}" y="{y}" width="1" height="1" fill="{pal[c]}"/>' for y, row in enumerate(rows) for x, c in enumerate(row) if c != '.') + '</svg>'
    ball = P(['..kkkk..', '.kwwbwk.', 'kwbbbwwk', 'kwwbwwbk', 'kbwwwbbk', 'kwwbwwwk', '.kwbbwk.', '..kkkk..'], {'k': '#1e2a45', 'w': '#ffffff', 'b': '#1e2a45'})
    hoop = P(['..kkkk..', '.koookk.', 'kookooook'[:8], 'kkkkkkkk', 'kooookok', 'koookook', '.kookok.', '..kkkk..'], {'k': '#5a2a14', 'o': '#ef7a2e'})
    balloon = P(['..rrr..', '.rwrrr.', 'rwrrrrr', 'rrrrrrr', 'rrrrrrr', '.rrrrr.', '..rrr..', '...d...', '...k...', '..k....', '...k...', '....k..'], {'r': '#e2453c', 'w': '#ffb3a8', 'd': '#9e2a24', 'k': '#5f6a80'})
    flag = P(['kooooo', 'kooooy', 'koooyy', 'kooo..', 'koo...', 'k.....', 'k.....', 'k.....', 'k.....'], {'k': '#5f6a80', 'o': '#ff6a3d', 'y': '#f2be30'})
    tennis = P(['.gggg.', 'gwgggg', 'ggwggg', 'gggwgg', 'ggggwg', '.gggg.'], {'g': '#cfe05a', 'w': '#ffffff'})
    items = []
    for k, (top, w, size, dur, delay, op) in enumerate([(8, 22, 220, 160, 0, .85), (26, 18, 160, 130, -60, .7), (16, 26, 260, 190, -110, .8)]):
        items.append(f'<i class="cloud" style="top:{top}%;width:{size}px;height:{size*11//w}px;background-image:{u(cloud(k*7+3, w))};animation-duration:{dur}s;animation-delay:{delay}s;opacity:{op}"></i>')
    rnd = random.Random(5)
    return '<div id="sky" aria-hidden="true">' + ''.join(items) + '</div>'
MENU_SKY_CSS = """  html { background: #a9d8ef; }
  body { background: linear-gradient(180deg, #8fcbed 0%, #b6def2 35%, #d8eff3 65%, #f3eedb 100%) fixed; }
  #sky { position: fixed; inset: 0; overflow: hidden; pointer-events: none; z-index: 0; }
  #sky i { position: absolute; display: block; background-size: 100% 100%; image-rendering: pixelated; }
  #sky .cloud { left: -220px; animation: drift linear infinite; }
  @keyframes drift { to { transform: translateX(calc(100vw + 440px)); } }
  #sky .islet { animation: bob ease-in-out infinite; }
  #sky .islet.far { opacity: .28; filter: saturate(.4) brightness(1.3) blur(.5px); }
  #sky .islet.mid { opacity: .45; filter: saturate(.6) brightness(1.18); }
  #sky .islet.near { opacity: .6; filter: saturate(.8) brightness(1.08); }
  @media (max-width: 640px) { #sky .islet.near, #sky .islet.mid:nth-of-type(2n) { display: none; } #sky .islet { width: 44px !important; height: 37px !important; } #sky .thing { transform: scale(.8); } }
  @keyframes bob { 50% { transform: translateY(-9px); } }
  @media (prefers-reduced-motion: reduce) { #sky i { animation: none !important; } }
"""
ROOT = os.path.dirname(os.path.abspath(__file__))
read = lambda *p: open(os.path.join(ROOT, *p), encoding='utf-8').read()

LICENSE = '''  Rendering core (orthographic camera, depth buffer, hue-shifted ramps, cast shadows, depth edges,
  grass tufts and swaying leaves) adapted from Pixel Plays by Amir Mushich:
  https://github.com/amirmushichge/pixel-plays

  MIT License — Copyright (c) 2026 Amir Mushich
  Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
  associated documentation files (the "Software"), to deal in the Software without restriction,
  including without limitation the rights to use, copy, modify, merge, publish, distribute,
  sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions: The above copyright notice and this
  permission notice shall be included in all copies or substantial portions of the Software.
  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT
  NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
  NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
  DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT
  OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
'''
FONTS = '''<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Jersey+10&family=Chakra+Petch:wght@500;600;700&family=Pixelify+Sans:wght@500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">'''
CREDIT = '<p>Rendering core adapted from <a href="https://github.com/amirmushichge/pixel-plays" target="_blank" rel="noopener noreferrer">Pixel Plays</a> (MIT).</p>'

OVER_CSS = """  .over { position: fixed; left: 50%; top: 50%; transform: translate(-50%, -50%); z-index: 4; width: min(330px, calc(100vw - 32px)); display: grid; justify-items: center; gap: 10px; padding: 0 22px 20px; border: 3px solid var(--ink); background: var(--ink); color: var(--paper); box-shadow: 6px 6px 0 var(--accent); text-align: center; pointer-events: none; animation: drop .35s steps(6) both; }
  @keyframes drop { from { transform: translate(-50%, -80%); opacity: 0; } to { transform: translate(-50%, -50%); opacity: 1; } }
  .over::before { content: "FULL TIME"; display: block; justify-self: stretch; margin: 0 -22px 8px; padding: 14px 0 7px; background: linear-gradient(var(--ink) 0 0) bottom / 100% 0 no-repeat, var(--stripe) top / 100% 7px no-repeat, var(--accent); color: var(--ink); font: 700 11px/1 var(--sans); letter-spacing: .32em; border-bottom: 3px solid var(--ink); }
  .over[hidden] { display: none; }
  .over h2 { margin: 0; font: 400 58px/.8 var(--pixel); color: var(--gold); text-transform: uppercase; text-shadow: 3px 3px 0 var(--accent); }
  .over p { margin: 0; color: var(--paper); font: 600 15px/1.3 var(--sans); text-transform: uppercase; letter-spacing: .06em; }
  .over small { color: #a9b3c6; font-size: 11px; text-transform: uppercase; letter-spacing: .08em; }
  .over .over-again { pointer-events: auto; background: var(--gold); color: var(--ink); border-color: var(--paper); box-shadow: 3px 3px 0 var(--accent); margin-top: 6px; padding: 11px 18px 10px; }
  .over .over-again:hover, .over .over-again:focus-visible { background: var(--accent); }"""

# when a game runs inside the arcade, Menu and Escape hand control back to it
BACK = '''<script>
(() => {
  if (window.parent === window) return;
  const back = document.getElementById('menu-back');
  back.hidden = false;
  const leave = () => window.parent.postMessage({ type: 'pixel-sports-menu' }, '*');
  back.addEventListener('click', leave);
  addEventListener('keydown', e => { if (e.key === 'Escape' && !document.querySelector('dialog[open]')) leave(); });
})();
</script>'''


def page(g):
    s = g['scene']
    scene = f"const SCENE = {{ W: {s['W']}, H: {s['H']}, S: {s['S']}, ox: {s['ox']}, oy: {s['oy']} }};"
    css = read('shared', 'theme.css') + MENU_SKY_CSS + OVER_CSS + g.get('css', '')
    css += '\n  #stage { z-index: 1; }'
    if g.get('cursor'):
        css += f"\n  #stage {{ cursor: {g['cursor']}; }}"
    return f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{g['title']}</title>
<!--
  {g['title']} · Olygames

{LICENSE}-->
{FONTS}
<style>
{css}
</style>
</head>
<body>
{menu_sky_layer()}
<div id="stage"><canvas id="c" tabindex="0" aria-label="{html.escape(g['aria'])}"></canvas></div>
{g['hud']}
<div class="nav">
  <button id="menu-back" class="pill" type="button" hidden>Menu</button>
  <button id="rules-open" class="pill" type="button">Rules</button>
</div>
<dialog id="rules" aria-labelledby="rules-title">
  <h2 id="rules-title">{g['title']}</h2>
  {g['rules']}
  {CREDIT}
  <form method="dialog"><button class="pill">Close</button></form>
</dialog>
<div class="hud" id="bottom">
  <div class="ticker"><span class="tag">LIVE</span><div id="status" role="status" aria-live="polite"></div></div>
  <button id="mute" class="pill" type="button" aria-pressed="false">sound on</button>
</div>
<div id="over" class="over" role="status" hidden>
  <h2 id="over-title"></h2>
  <p id="over-text"></p>
  <button id="again" class="pill over-again" type="button">Play again</button>
  <small>or tap the field, or press space</small>
</div>
<script>
'use strict';
{scene}
{read('shared', 'engine.js')}
/* ================= figures ================= */
{read('shared', 'figures.js')}
/* ================= audio ================= */
{read('shared', 'audio.js')}
/* ================= game over ================= */
{read('shared', 'over.js')}
{read('games', g['id'] + '.js')}
</script>
{BACK}
</body>
</html>
'''


def img(path):
    return 'data:image/png;base64,' + base64.b64encode(open(path, 'rb').read()).decode()


def arcade(pages):
    cards, sources, bests = [], [], []
    for n, g in enumerate(GAMES):
        prev = os.path.join(ROOT, 'previews', g['id'] + '.png')
        pic = f'<img src="{img(prev)}" alt="{html.escape(g["alt"])}">' if os.path.exists(prev) else ''
        cards.append(f'''    <button class="game" type="button" data-game="{g['id']}" style="--n:{n}">
      <span class="pic">{pic}</span>
      <span class="body">
        <span class="name"><b>{g['title']}</b><span class="best" data-best="{g['id']}"></span></span>
        <span class="what">{g['card']}</span>
        <span class="play">Play</span>
      </span>
    </button>''')
        sources.append(f'<script type="text/plain" id="src-{g["id"]}">{base64.b64encode(pages[g["id"]].encode()).decode()}</script>')
        bests.append(f"'{g['id']}': {[list(b) for b in g['best']]}")
    ids = [g['id'] for g in GAMES]
    titles = {g['id']: g['title'] for g in GAMES}
    return f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Olygames</title>
<!--
  Olygames: small sports games on floating pixel islands.

{LICENSE}-->
{FONTS}
<style>
  :root {{
    --sky: #e4eef2; --ink: #1e2a45; --muted: #66738a; --card: #fff; --accent: #ff6a3d; --gold: #d0920e;
    --shadow: inset 0 1px 0 rgba(255, 255, 255, .8), 0 14px 34px -14px rgba(20, 34, 70, .55);
    --pixel: "Pixelify Sans", ui-monospace, Menlo, monospace; --sans: "Space Grotesk", system-ui, -apple-system, "Segoe UI", sans-serif;
  }}
  * {{ box-sizing: border-box; }}
  html, body {{ min-height: 100%; margin: 0; background: var(--sky); color: var(--ink); }}
  body {{ font: 500 15px/1.45 var(--sans); }}
  #menu {{ max-width: 1180px; margin: 0 auto; padding: max(28px, env(safe-area-inset-top)) max(20px, env(safe-area-inset-right)) max(24px, env(safe-area-inset-bottom)) max(20px, env(safe-area-inset-left)); }}
  header {{ display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; flex-wrap: wrap; margin-bottom: 26px; }}
  h1 {{ margin: 0; font: 700 clamp(40px, 7vw, 64px)/.9 var(--pixel); letter-spacing: .01em; }}
  h1 span {{ color: var(--accent); }}
  header p {{ margin: 0; color: var(--muted); font-weight: 600; max-width: 34ch; }}
  .games {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 330px), 1fr)); gap: 18px; }}
  .game {{ display: grid; grid-template-rows: auto 1fr; padding: 0; border: 1.5px solid rgba(255, 255, 255, .7); border-radius: 22px; overflow: hidden; background: rgba(255, 255, 255, .26); -webkit-backdrop-filter: blur(14px) saturate(1.5); backdrop-filter: blur(14px) saturate(1.5); color: inherit; font: inherit; text-align: left; cursor: pointer; box-shadow: var(--shadow); transition: transform .18s ease, box-shadow .18s ease; }}
  .game:hover, .game:focus-visible {{ transform: translateY(-4px); background: rgba(255, 255, 255, .4); box-shadow: inset 0 1px 0 rgba(255, 255, 255, .9), 0 22px 40px -14px rgba(20, 34, 70, .6); outline: none; }}
  .game:focus-visible {{ box-shadow: 0 0 0 3px var(--accent), var(--shadow); }}
  .pic {{ position: relative; display: block; aspect-ratio: 16 / 10; background: linear-gradient(#d6e6ec, var(--sky)); overflow: hidden; }}
  .pic img {{ position: absolute; left: 16px; right: 16px; top: 14px; bottom: 8px; width: calc(100% - 32px); height: calc(100% - 22px); object-fit: contain; object-position: center bottom; image-rendering: pixelated; }}
  .body {{ display: grid; align-content: start; gap: 8px; padding: 16px 18px 18px; }}
  .name {{ display: flex; justify-content: space-between; align-items: baseline; gap: 10px; }}
  .name b {{ font: 400 34px/.8 "Jersey 10", var(--pixel); text-transform: uppercase; letter-spacing: .01em; }}
  .best {{ color: var(--gold); font-weight: 700; font-size: 12px; text-align: right; }}
  .what {{ color: var(--muted); }}
  .play {{ justify-self: start; margin-top: 6px; padding: 9px 16px; border-radius: 999px; background: var(--ink); color: #fff; font-weight: 700; font-size: 13px; }}
  .game:hover .play, .game:focus-visible .play {{ background: var(--accent); }}
  footer {{ margin-top: 28px; color: var(--muted); font-size: 13px; display: flex; justify-content: space-between; gap: 16px; flex-wrap: wrap; }}
  footer a {{ color: inherit; text-underline-offset: 2px; }}
  #frame {{ position: fixed; inset: 0; width: 100%; height: 100%; border: 0; display: none; background: var(--sky); }}
  body.playing {{ overflow: hidden; }}
  #menu {{ position: relative; z-index: 1; }}
  #frame {{ z-index: 2; }}
  .pic {{ background: linear-gradient(rgba(255, 255, 255, .18), rgba(255, 255, 255, 0)) !important; border-bottom: 1px solid rgba(255, 255, 255, .5); }}
  .what {{ color: #2e3b58 !important; }}
  .body {{ background: rgba(255, 255, 255, .22); }}
  .best {{ color: #8a5a00 !important; }}
  .logo {{ display: flex; align-items: center; gap: clamp(10px, 1.6vw, 18px); margin: 0; }}
  .logo {{ align-items: flex-end !important; gap: 4px !important; }}
  .logo .podium {{ --w: clamp(150px, 15vw, 200px); position: relative; display: block; width: var(--w); animation: hover 5s ease-in-out infinite; }}
  .logo .podium img {{ display: block; width: 100%; height: auto; image-rendering: pixelated; filter: drop-shadow(0 16px 10px rgba(20, 34, 70, .28)); }}
  @keyframes hover {{ 50% {{ transform: translateY(-6px); }} }}
  .logo .step {{ position: absolute; transform: translate(-50%, 6%); font: 400 calc(var(--w) * .19)/.72 "Jersey 10", var(--pixel); text-transform: uppercase; color: #f2be30; }}
  .logo .step, .logo .word {{ text-shadow: 3px 3px 0 #1e2a45, -2px -2px 0 #1e2a45, 2px -2px 0 #1e2a45, -2px 2px 0 #1e2a45, 0 3px 0 #1e2a45, 3px 0 0 #1e2a45; }}
  .logo .ground-word {{ position: absolute; transform: translate(-50%, -50%) matrix(1, -.5, 1, .5, 0, 0); font: 400 calc(var(--w) * .15)/.8 "Jersey 10", var(--pixel); text-transform: uppercase; letter-spacing: .06em; color: #fdf8ec; text-shadow: 1px 1px 0 #1e2a45, -1px -1px 0 #1e2a45, 1px -1px 0 #1e2a45, -1px 1px 0 #1e2a45, 0 2px 0 #1e2a45; white-space: nowrap; }}
  .logo .s0 {{ color: #e8edf3; }} .logo .s1 {{ color: #f2be30; }} .logo .s2 {{ color: #e59a5e; }}
  .logo .word {{ font: 400 clamp(52px, 7.6vw, 92px)/.72 "Jersey 10", var(--pixel); text-transform: uppercase; letter-spacing: .01em; color: #fff; margin-bottom: clamp(16px, 2vw, 26px); margin-left: clamp(-18px, -1.2vw, -8px); }}
  .tagline {{ list-style: none; margin: 0; padding: 0; display: grid; justify-items: end; gap: 6px; }}
  .tagline li {{ display: flex; align-items: center; gap: 8px; font: 700 12px/1 "Chakra Petch", var(--sans); text-transform: uppercase; letter-spacing: .16em; color: #1e2a45; }}
  .tagline li::before {{ content: ""; width: 7px; height: 7px; background: #ff6a3d; box-shadow: 1px 1px 0 #1e2a45; }}
  .tagline b {{ font: 400 22px/.7 "Jersey 10", var(--pixel); letter-spacing: 0; margin-right: -2px; }}
  @media (max-width: 640px) {{ .tagline {{ justify-items: start; }} }}
  @media (prefers-reduced-motion: reduce) {{ .logo .mark {{ animation: none; }} }}
  footer {{ color: #5f6a80 !important; }}
  footer a {{ color: #3d4862; }}
  .play {{ box-shadow: 0 6px 14px -8px rgba(20, 34, 70, .7); }}
{MENU_SKY_CSS}
  /* no cards: each game is its island floating in the sky, with its name below */
  .games {{ gap: 6px 26px !important; }}
  .game {{ background: none !important; border: 0 !important; box-shadow: none !important; -webkit-backdrop-filter: none !important; backdrop-filter: none !important; border-radius: 0 !important; overflow: visible !important; grid-template-rows: auto auto !important; justify-items: center; text-align: center !important; transition: transform .25s ease !important; }}
  .game .pic {{ background: none !important; border: 0 !important; overflow: visible !important; width: 100%; animation: float 5s ease-in-out infinite; animation-delay: calc(var(--n) * -.7s); }}
  .game .pic img {{ filter: drop-shadow(0 22px 14px rgba(20, 34, 70, .3)); transition: transform .25s ease, filter .25s ease; }}
  @keyframes float {{ 50% {{ transform: translateY(-8px); }} }}
  .game .body {{ background: none !important; justify-items: center; gap: 4px !important; padding: 0 10px 22px !important; }}
  .game .name {{ flex-direction: column; align-items: center !important; gap: 2px !important; }}
  .game .name b {{ font-size: 40px !important; color: #fff; text-shadow: 3px 3px 0 #1e2a45, -1px -1px 0 #1e2a45, 1px -1px 0 #1e2a45, -1px 1px 0 #1e2a45, 0 3px 0 #1e2a45; }}
  .game .best {{ order: 2; color: #1e2a45 !important; background: #f2be30; border: 2px solid #1e2a45; padding: 2px 7px 1px; font-size: 10px !important; text-transform: uppercase; letter-spacing: .1em; }}
  .game .best:empty {{ display: none; }}
  .game .what, .game .play {{ display: none !important; }}
  .game:hover, .game:focus-visible {{ transform: none !important; background: none !important; box-shadow: none !important; outline: none; }}
  .game:hover .pic img, .game:focus-visible .pic img {{ transform: translateY(-10px) scale(1.04); filter: drop-shadow(0 30px 16px rgba(20, 34, 70, .35)); }}
  .game:hover .name b, .game:focus-visible .name b {{ color: #f2be30; }}
  .game:active .pic img {{ transform: translateY(-4px) scale(1.01); }}
  @media (max-width: 640px) {{
    .games {{ grid-template-columns: repeat(2, minmax(0, 1fr)) !important; gap: 0 12px !important; }}
    .game .name b {{ font-size: 26px !important; text-shadow: 2px 2px 0 #1e2a45, -1px -1px 0 #1e2a45, 1px -1px 0 #1e2a45, -1px 1px 0 #1e2a45; }}
    .game .pic img {{ left: 2px; right: 2px; width: calc(100% - 4px); }}
    .game .body {{ padding: 0 2px 14px !important; }}
  }}
  @media (prefers-reduced-motion: reduce) {{ .game .pic {{ animation: none; }} }}
  body.playing #frame {{ display: block; }}
  body.playing #menu {{ display: none; }}
</style>
</head>
<body>
{menu_sky_layer()}
<main id="menu">
  <header>
    <h1 class="logo" aria-label="Olygames"><span class="podium" aria-hidden="true"><img src="{img(os.path.join(ROOT, 'previews', 'logo.png'))}" alt=""><span class="step s0" style="left:26.4%;bottom:62.7%">O</span><span class="step s1" style="left:42.9%;bottom:83.5%">L</span><span class="ground-word" style="left:59.3%;top:60.7%">games</span><span class="step s2" style="left:59.3%;bottom:82.4%">Y</span></span></h1>
    <ul class="tagline"><li><b>9</b> sports</li><li>one move each</li><li>easy to learn · hard to master</li></ul>
  </header>
  <div class="games">
{chr(10).join(cards)}
  </div>
  <footer>
    <span>Menu or Esc in any game brings you back here.</span>
    <span>Rendering core adapted from <a href="https://github.com/amirmushichge/pixel-plays" target="_blank" rel="noopener noreferrer">Pixel Plays</a> (MIT).</span>
  </footer>
</main>
<iframe id="frame" title="Game" allow="autoplay"></iframe>
{chr(10).join(sources)}
<script>
'use strict';
const GAMES = {ids}, TITLES = {titles}, BESTS = {{ {', '.join(bests)} }};
const frame = document.getElementById('frame');
const read = k => {{ try {{ return +localStorage.getItem(k) || 0; }} catch (e) {{ return 0; }} }};
function showBests() {{
  for (const id of GAMES) {{
    const parts = BESTS[id].map(([key, label]) => [read(key), label]).filter(([v]) => v).map(([v, label]) => (label ? label + ' ' : '') + v);
    document.querySelector('[data-best="' + id + '"]').textContent = parts.length ? 'best ' + parts.join(' · ') : '';
  }}
}}
let lastGame = null;
function open(id, push) {{
  const src = document.getElementById('src-' + id);
  if (!src) return menu(false);
  lastGame = id;
  const bytes = Uint8Array.from(atob(src.textContent.trim()), c => c.charCodeAt(0));
  frame.srcdoc = new TextDecoder().decode(bytes);
  document.body.classList.add('playing');
  document.title = TITLES[id] + ' · Olygames';
  if (push && location.hash !== '#' + id) location.hash = id;
  frame.addEventListener('load', () => {{ try {{ frame.contentWindow.focus(); }} catch (e) {{ /* ignore */ }} }}, {{ once: true }});
}}
function menu(push) {{
  document.body.classList.remove('playing');
  frame.removeAttribute('srcdoc');
  frame.src = 'about:blank';
  document.title = 'Olygames';
  if (push && location.hash) history.replaceState(null, '', location.pathname + location.search);
  showBests();
  const btn = lastGame && document.querySelector('[data-game="' + lastGame + '"]');
  if (btn) btn.focus({{ preventScroll: true }});
}}
document.querySelectorAll('.game').forEach(b => b.addEventListener('click', () => open(b.dataset.game, true)));
addEventListener('message', e => {{ if (e.source === frame.contentWindow && e.data && e.data.type === 'pixel-sports-menu') menu(true); }});
addEventListener('hashchange', () => {{ const h = location.hash.slice(1); if (GAMES.includes(h)) open(h, false); else menu(false); }});
showBests();
if (GAMES.includes(location.hash.slice(1))) open(location.hash.slice(1), false);
</script>
</body>
</html>
'''


if __name__ == '__main__':
    os.makedirs(os.path.join(ROOT, 'dist'), exist_ok=True)
    pages = {}
    for g in GAMES:
        pages[g['id']] = page(g)
        open(os.path.join(ROOT, 'dist', g['id'] + '.html'), 'w', encoding='utf-8').write(pages[g['id']])
    if '--no-arcade' not in sys.argv:
        out = arcade(pages)
        open(os.path.join(ROOT, 'dist', 'index.html'), 'w', encoding='utf-8').write(out)
        print('arcade', len(out) // 1024, 'KB')
    for g in GAMES:
        print(g['id'], len(pages[g['id']]) // 1024, 'KB')
