# One entry per game: how its page is assembled and how it appears in the arcade menu.
GAMES = [
    {
        'id': 'three-point',
        'title': 'Three-Point',
        'scene': dict(W=440, H=300, S=20, ox=19, oy=14),
        'aria': 'Basketball court. Hold and release to shoot, or use the space bar.',
        'hud': '''<div id="score" class="chip">
  <div class="line"><b id="pts">0</b><span>pts</span></div>
  <div id="racks"></div>
  <span id="best"></span>
</div>
<div class="hud-top"><div id="clock" class="chip">50</div></div>''',
        'css': '''  #racks { display: flex; gap: 6px; }
  .rack { display: flex; gap: 2px; }
  .rack i { width: 8px; height: 8px; border-radius: 2px; border: 1.5px solid var(--ink); opacity: .2; }
  .rack i.money { border-color: var(--gold); }
  .rack i.now { opacity: 1; }
  .rack i.hit { background: var(--ink); opacity: 1; }
  .rack i.money.hit { background: var(--gold); }
  .rack i.miss { background: var(--muted); border-color: var(--muted); opacity: .35; }''',
        'rules': '''<ol>
    <li>Five racks, five balls each. You have 50 seconds, and the clock starts with your first shot.</li>
    <li>Hold to fill the power bar; it rises and falls. Let go while it is in the green zone. Use a finger, the mouse or space.</li>
    <li>Let go too early and the shot falls short; too late and it clangs off the back rim.</li>
    <li>Each basket is 1 point. The last, striped ball on each rack is the money ball, worth 2. The maximum is 30.</li>
  </ol>''',
        'card': 'Five racks, fifty seconds. Hold, and let go when the power bar hits the green.',
        'alt': 'A street basketball court with a hoop, ball racks and a shooter mid jump shot.',
        'tag': 'court',
        'color': '#3f6aa8',
        'medals': (10, 16, 22, 'high', ''),
        'best': [('three-point-best', '')],
    },
    {
        'id': 'archery',
        'title': 'Archery',
        'scene': dict(W=440, H=300, S=19, ox=8, oy=22),
        'cursor': 'crosshair',
        'aria': 'Archery range. Aim with the mouse or by dragging, hold to draw the bow, let go to shoot. Arrow keys and space also work.',
        'hud': '''<div id="score" class="chip">
  <div class="line"><b id="pts">0</b><span>pts</span></div>
  <div id="sub"></div>
  <span id="wind"></span>
  <span id="best"></span>
</div>''',
        'css': '''  #sub { display: flex; gap: 4px; color: var(--muted); font: 600 15px/1 var(--pixel); font-variant-numeric: tabular-nums; }
  #sub:empty { display: none; }
  #sub i { font-style: normal; min-width: 1.4ch; text-align: center; opacity: .4; }
  #sub i.hit { color: var(--ink); opacity: 1; }
  #sub i.ten { color: var(--gold); opacity: 1; }
  #sub i.miss { opacity: .6; }
  #sub i.now { color: var(--accent); opacity: 1; }
  #wind { color: var(--muted); font-weight: 600; font-size: 12px; }''',
        'rules': '''<ul>
    <li>Ten arrows at one target. Aim with the mouse, or drag on a touch screen. Hold to draw the bow, let go to shoot. Arrow keys and space work too.</li>
    <li>A full draw takes about half a second. Shoot too soon and the arrow is slow and drops; hold too long and your arm starts to shake.</li>
    <li>The rings score 10 at the centre down to 1 at the edge, so the most is 100.</li>
    <li>Arrows fall on their way, so aim a little high, and the wind pushes them sideways: watch the windsocks. It changes every arrow.</li>
  </ul>''',
        'card': 'Ten arrows at a straw target. Watch the windsocks, aim a little high, let go.',
        'alt': 'An archery lane with a straw target, windsocks and an archer drawing a bow.',
        'tag': 'range',
        'color': '#3f8a4a',
        'medals': (60, 75, 88, 'high', ''),
        'best': [('arrows-best-target', '')],
    },
    {
        'id': 'curling',
        'title': 'Curling',
        'scene': dict(W=440, H=300, S=19, ox=0, oy=6),
        'aria': 'Curling against the computer. Drag back and let go to throw; tap quickly while your stone slides to sweep. S switches the spin.',
        'hud': '''<div id="score" class="chip">
  <div class="line"><b id="pts">0</b><span>you</span><b id="cpu" class="cpu">0</b><span>cpu</span></div>
  <div id="ends"></div>
  <span id="best"></span>
</div>
<div class="hud-top"><button id="spin" class="pill" type="button">spin ⟲</button></div>''',
        'css': '''  #score b.cpu { color: #40a0b0; margin-left: 10px; }
  #score b#pts { color: var(--accent); }
  #ends { display: flex; gap: 4px; align-items: center; font: 600 13px/1 var(--pixel); }
  #ends span { display: grid; padding: 3px 6px; border-radius: 0; background: var(--sky); color: var(--accent); text-align: center; }
  #ends span i { font-style: normal; color: #40a0b0; }
  #ends span.now { box-shadow: inset 0 0 0 2px var(--ink); }
  #ends em { font-style: normal; color: var(--accent); margin-left: 6px; letter-spacing: 2px; }''',
        'rules': '''<ol>
    <li>Three ends against the computer, four stones each. Drag back from anywhere and let go to throw: direction and weight come from the drag. The dotted line shows where it would stop unswept.</li>
    <li>The stone curls the way it spins. Switch the spin with the button at the top, or S.</li>
    <li>While your stone slides, tap fast to sweep: it travels further and curls less.</li>
    <li>A stone must pass the red hog line. After each end, the side with the stone closest to the centre scores one for every stone nearer than the other side's best.</li>
  </ol>''',
        'card': 'Three ends against the computer. Throw, curl, and tap fast to sweep.',
        'alt': 'A curling sheet with a painted house and coral and teal stones.',
        'tag': 'ice',
        'color': '#4a7fc4',
        'medals': (1, 3, 5, 'high', ' wins'),
        'best': [('curling-wins', 'wins')],
    },
    {
        'id': 'penalty',
        'title': 'Penalty',
        'scene': dict(W=440, H=300, S=18, ox=6, oy=18),
        'aria': 'Penalty kick. Flick towards the goal to shoot; bend the flick to curl the ball. Arrow keys and space also work.',
        'hud': '''<div id="score" class="chip">
  <div class="line"><b id="pts">0</b><span>goals</span></div>
  <div id="kicks"></div>
  <span id="best"></span>
</div>''',
        'css': '''  #kicks { display: flex; gap: 4px; }
  #kicks i { width: 10px; height: 10px; border-radius: 50%; border: 2px solid var(--ink); opacity: .18; }
  #kicks i.now { opacity: 1; }
  #kicks i.goal { background: var(--ink); opacity: 1; }
  #kicks i.saved { background: var(--accent); border-color: var(--accent); opacity: 1; }
  #kicks i.miss { border-color: var(--muted); opacity: .5; }''',
        'rules': '''<ol>
    <li>Ten penalties. Flick from anywhere towards the goal: the direction and length of the flick pick the spot, shown by the ring on the goal.</li>
    <li>Flick faster to hit it harder. Hard shots are harder to save but stray more, so tight corners get risky.</li>
    <li>Bend the flick to curl the ball. The keeper reads the ball's first line, so a curl can send him the wrong way.</li>
    <li>Sometimes he guesses a side early. Every goal makes him a little quicker.</li>
    <li>On a keyboard: arrow keys move the target, hold space for power and let go.</li>
  </ol>''',
        'card': 'Ten spot kicks against a keeper who learns. Flick to shoot, bend the flick to curl it.',
        'alt': 'A goal with a diving keeper, a penalty spot and a kicker on a floating pitch.',
        'tag': 'pitch',
        'color': '#2f7d43',
        'medals': (5, 7, 9, 'high', '/10'),
        'best': [('penalty-best', '')],
    },
    {
        'id': 'bowling',
        'title': 'Bowling',
        'scene': dict(W=440, H=300, S=26, ox=4, oy=4),
        'aria': 'Bowling lane. Tap three times: to stop the bowler where you want to stand, to lock the aim, and to lock the spin. Space also works.',
        'hud': '''<div id="score" class="chip">
  <div class="line"><b id="pts">0</b><span>score</span></div>
  <span id="best"></span>
</div>
<div class="hud-top"><div id="card" class="chip"></div></div>''',
        'css': '''  #card { display: grid; grid-template-columns: repeat(9, 26px) 38px; gap: 2px; padding: 6px; pointer-events: none; }
  .fr { display: grid; grid-template-rows: auto 18px; border-radius: 0; background: var(--sky); overflow: hidden; }
  .fr.now { box-shadow: inset 0 0 0 2px var(--accent); }
  .fr span { display: flex; justify-content: flex-end; }
  .fr s { text-decoration: none; width: 12px; height: 13px; font: 600 11px/13px var(--pixel); text-align: center; color: var(--ink); }
  .fr s:last-child { background: var(--card); border-radius: 0 0 0 4px; }
  .fr b { font: 600 13px/18px var(--pixel); text-align: center; font-variant-numeric: tabular-nums; }''',
        'rules': '''<ol>
    <li>Three taps per ball. First, tap to stop the bowler where you want to stand. Then tap to lock the aim as the arrow sweeps. Then tap to lock the spin as the hook swings left and right.</li>
    <li>The dotted line shows where the ball will go. Spin bends it late, near the pins. Yellow dots mean the gutter.</li>
    <li>The best way in is the pocket: just beside the head pin, coming in at an angle.</li>
    <li>Ten frames. A strike scores 10 plus your next two balls; a spare, 10 plus your next ball. A perfect game is 300.</li>
  </ol>''',
        'card': 'Ten frames of tap, tap, tap: where to stand, which way to roll, how much hook.',
        'alt': 'A bowling lane with ten pins, a coral ball and a bowler at the foul line.',
        'tag': 'lane',
        'color': '#b0763a',
        'medals': (100, 150, 190, 'high', ''),
        'best': [('bowling-best', '')],
    },
    {
        'id': 'minigolf',
        'title': 'Mini Golf',
        'scene': dict(W=440, H=300, S=24, ox=0, oy=8),
        'aria': 'Mini golf. Drag back from anywhere and let go to putt; the longer the drag, the harder the putt. Arrow keys turn, space holds for power.',
        'hud': '''<div id="score" class="chip">
  <div class="line"><b id="pts">0</b><span>strokes</span><em id="par"></em></div>
  <span id="best"></span>
</div>
<div class="hud-top"><div id="card" class="chip"></div></div>''',
        'css': '''  #par { font: 600 15px/1 var(--pixel); font-style: normal; color: var(--accent); margin-left: 4px; }
  #card { display: grid; grid-template-columns: repeat(6, 34px); gap: 3px; padding: 6px; pointer-events: none; }
  .h { display: grid; justify-items: center; border-radius: 0; background: var(--sky); padding: 3px 0 4px; }
  .h.now { box-shadow: inset 0 0 0 2px var(--accent); }
  .h span { font-size: 10px; font-weight: 700; color: var(--muted); }
  .h b { font: 600 17px/1.1 var(--pixel); min-height: 19px; }
  .h i { font-size: 10px; font-style: normal; color: var(--muted); }
  .h.under b { color: var(--good); }
  .h.over b { color: var(--hot); }''',
        'rules': '''<ol>
    <li>Six holes, each on its own island. Drag back from anywhere and let go to putt: the ball goes the opposite way to your drag, harder the longer you pull.</li>
    <li>The dotted line shows the first stretch of the roll, bounces off the rails included.</li>
    <li>Sand slows the ball, the chevrons on a slope push it downhill, and water costs a stroke. On the last hole, time your putt between the windmill's sails.</li>
    <li>Roll in gently: a ball moving too fast lips out. After seven strokes you pick up and score eight.</li>
    <li>On a keyboard: left and right arrows aim, hold space for power and let go.</li>
  </ol>''',
        'card': 'Six little holes, each on its own island. Drag back, let go, mind the windmill.',
        'alt': 'A mini golf hole with wooden rails, a flag and a windmill on a floating island.',
        'tag': 'green',
        'color': '#5a9a3c',
        'medals': (24, 20, 17, 'low', ' shots'),
        'best': [('minigolf-best', '')],
    },
    {
        'id': 'diving',
        'title': 'Diving',
        'scene': dict(W=440, H=300, S=25, ox=-10, oy=26),
        'aria': 'Diving. Press to leap off the 10 metre platform, hold to tuck and spin, let go to open up before you reach the water. Space also works.',
        'hud': '''<div id="score" class="chip">
  <div class="line"><b id="pts">0.0</b><span>pts</span></div>
  <div id="runs"></div>
  <span id="best"></span>
</div>''',
        'css': '''  #runs { display: flex; gap: 6px; font: 600 14px/1 var(--pixel); color: var(--muted); }
  #runs span { padding: 4px 7px; border-radius: 0; background: var(--sky); }
  #runs .now { box-shadow: inset 0 0 0 2px var(--accent); color: var(--ink); }
  #runs .done { color: var(--ink); }''',
        'rules': '''<ol>
    <li>Three dives from the 10 metre platform; your points add up.</li>
    <li>Press to leap. Keep holding to tuck and spin fast, let go to open up and slow the spin.</li>
    <li>Open up so you hit the water straight, head first or feet first. The straighter the entry, the smaller the splash and the higher the score.</li>
    <li>More somersaults multiply your points, but still tucked at the water means a big splash.</li>
  </ol>''',
        'card': 'Leap, tuck, spin, open up in time. Rip it with no splash.',
        'alt': 'A swimming pool with a 10 metre diving tower, a diver mid somersault, a judges table and trees.',
        'tag': 'pool',
        'color': '#2f86c0',
        'medals': (20, 32, 44, 'high', ' pts'),
        'best': [('diving-best', '')],
    },
    {
        'id': 'shooting',
        'title': 'Rifle Range',
        'scene': dict(W=440, H=300, S=19, ox=8, oy=22),
        'cursor': 'crosshair',
        'aria': 'Rifle range. Balloons drift across the field. Hold to steady your breath, let go to fire. Arrow keys aim, and space also works.',
        'hud': '''<div id="score" class="chip">
  <div class="line"><b id="pts">0</b><span>pts</span></div>
  <div id="sub"></div>
  <span id="wind"></span>
  <span id="best"></span>
</div>
<div class="hud-top"><div id="clock" class="chip"></div></div>''',
        'css': '''  #sub { color: var(--muted); font: 600 14px/1 var(--sans); font-variant-numeric: tabular-nums; }
  #sub:empty { display: none; }
  #wind { color: var(--muted); font-weight: 600; font-size: 12px; }
  #clock { font: 600 30px/1 var(--pixel); font-variant-numeric: tabular-nums; pointer-events: none; padding: 8px 14px; }
  #clock:empty { display: none; }
  #clock.low { color: var(--hot); }''',
        'rules': '''<ol>
    <li>Forty seconds. Balloons drift up across the range; each one you pop is a point, and the small gold ones are worth 3.</li>
    <li>Press and hold to steady your breath. The sight settles over the first half second. The bar under it fills: let go in the green, before it turns red.</li>
    <li>Hold too long and your arm starts to shake, so the sight swings about.</li>
    <li>Let go to fire. There is a short reload after each shot, and the wind pushes the balloons sideways, so watch the windsocks.</li>
    <li>On a keyboard: arrow keys aim, hold space to steady, and let go to fire.</li>
  </ol>''',
        'card': 'Balloons on the range. Hold your breath to steady the sight, let go to fire.',
        'alt': 'A rifle range with a hay backstop, a shooter with a rifle and drifting balloons.',
        'tag': 'range',
        'color': '#6b7a3a',
        'medals': (6, 10, 14, 'high', ''),
        'best': [('shooting-best', '')],
    },
    {
        'id': 'hurdles',
        'title': 'Hurdles',
        'scene': dict(W=440, H=300, S=17, ox=-10, oy=30),
        'aria': 'Hurdles. Tap or press space to start running, then tap or press space to jump each hurdle when the marker over it turns green.',
        'hud': '''<div id="score" class="chip">
  <div class="line"><b id="pts">0.00</b><span>s</span></div>
  <div id="runs"></div>
  <span id="best"></span>
</div>''',
        'css': '''  #runs { display: flex; gap: 6px; font: 600 14px/1 var(--pixel); color: var(--muted); }
  #runs span { padding: 4px 7px; border-radius: 0; background: var(--sky); }
  #runs .now { box-shadow: inset 0 0 0 2px var(--accent); color: var(--ink); }
  #runs .done { color: var(--ink); }''',
        'rules': '''<ol>
    <li>Three races over six hurdles; your fastest time counts.</li>
    <li>Tap the screen, or press space, to start. The runner speeds up by itself.</li>
    <li>Tap again to jump. A marker hangs over the next hurdle: tap when it turns green and TAP flashes.</li>
    <li>A jump timed so you are at the top of it over the hurdle gives a burst of speed. Knock a hurdle and you slow right down.</li>
    <li>The clock stops at the finish line.</li>
  </ol>''',
        'card': 'Run, tap when the marker turns green, clear six hurdles.',
        'alt': 'A running track with ten hurdles, an athlete mid-jump, a stand and trees.',
        'tag': 'track',
        'color': '#c4603f',
        'medals': (6.4, 6.0, 5.6, 'low', ' s'),
        'best': [('hurdles-best', '')],
    },
]
