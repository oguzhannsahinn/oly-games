# Olygames

Nine small sports games on floating pixel islands. One move each, easy to learn, hard to master. Everything runs in the browser from a single HTML file.

| # | Game | How it plays |
|---|------|--------------|
| 1 | Three-Point | Five racks in fifty seconds; hold and let go when the power bar hits the green |
| 2 | Archery | Ten arrows at a straw target; watch the windsocks and aim a little high |
| 3 | Curling | Three ends against the computer; throw, curl and tap fast to sweep |
| 4 | Penalty | Ten spot kicks against a keeper who learns; flick to shoot, bend the flick to curl it |
| 5 | Bowling | Ten frames: pick where to stand, which way to roll and how much hook |
| 6 | Mini Golf | Six holes, each on its own island; drag back, let go, mind the windmill |
| 7 | Diving | Three dives; hold to tuck and spin, let go to open up and enter without a splash |
| 8 | Rifle Range | Balloons on the range; hold to steady the sight, let go to fire |
| 9 | Hurdles | Three races; tap when the marker turns green to clear each hurdle |

Each game has bronze, silver and gold targets. Best scores are kept in the browser's local storage.

## Play

Open `index.html` in a browser, or deploy the repository as a static site (Netlify, GitHub Pages, Vercel). No server code is needed.

## Project layout

```
build.py        builds every game page and the menu into dist/
games.py        game list: titles, scene framing, HUD, rules, medal targets
previews.py     renders the menu preview images with headless Chromium
games/          one script per game
shared/         rendering engine, figures, audio, game-over card, theme
previews/       menu preview images and the logo
dist/           built output: index.html (menu with every game inside) and one page per game
index.html      copy of dist/index.html for static hosting from the repo root
```

## Build

Requires Python 3.

```
python3 build.py              # builds dist/ (game pages and the menu)
python3 build.py --no-arcade  # game pages only, faster while testing
cp dist/index.html index.html
```

Regenerating the menu previews needs Playwright:

```
pip install playwright && playwright install chromium
python3 previews.py
```

## Credits

The rendering core (orthographic camera, depth buffer, colour ramps, cast shadows, grass and leaves) is adapted from [Pixel Plays](https://github.com/amirmushichge/pixel-plays) by Amir Mushich, MIT License. See `LICENSE`.
