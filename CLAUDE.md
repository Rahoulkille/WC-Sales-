# Hollywoodbets on Turbo Pickle: lobby preview

A private, sales-led preview showing Hollywoodbets (South Africa) what their casino lobby looks like when it's powered by Turbo Pickle's GameDNA. It's shown **locally by Rahoul at the HB meeting on Thursday 15 October 2026**. It is not sent to the client. GCS is the backup host if a link is ever needed.

Owner: Rahoul. Content and sign-off: Andrew.

## Where this came from

The preview was built as a single self-contained HTML file (all media inlined as base64) in claude.ai, then polished by Claude Design. `reference/checkpoint-8.html` is that file and the starting point for behaviour and look. Once Phase 0 parity passes, **this repo is the source of truth** (see Design round trips). It hit the 16MB artifact cap (12.6MB of it is video), which is why it's moving here.

## The experience (do not change the flow)

1. **TP strip and intro** sit above an HB-branded panel, with a drifting art mosaic.
2. **Taster** opens first and is skippable (skip loads a labelled sample player).
   - Step 1 Style: 6 image cards backed by real games, clip on hover or select.
   - Step 2 Games: 17 round art discs. Each pick pulls in 2 "Plays like X" look-alikes. Picks tray in the footer, max 5.
   - Step 3 React: swipe deck of 6 portrait clips from a pool of 10. Keep, skip, love by drag, buttons or arrow keys.
   - Live taste panel (desktop aside, one-line bar on mobile).
3. **Build animation** (91 tiles re-rank), then the **"Your Slot DNA" reveal** (templated headline, themes, play style, top 3 matches).
4. **Tuned lobby** with new rows highlighted. Mobile and desktop are separate layouts (`body[data-layout]`), switchable from the top bar.
5. **Explore player**: mobile is a vertical feed; desktop is a viewport-sized 9:16 player with a blurred backdrop and a details side panel.
6. **"What's powering this"** toggle shows notes explaining the tech. Taster notes are tagged **Concept**, lobby notes **Live**.

Answers persist in localStorage `hbtp:profile:v2`. "Start the preview over" in the close resets it.

## Locked decisions (don't re-argue these)

- Taster first, skippable. Intro stays above the lobby.
- Slotsfinder ("What's your Slot DNA?") is a Wildcards build, so its components and art can be reused. The FanDuel POC is patterns only, no code or art.
- The HB logo is the real vector from their brand guidelines (currently the `--hwb-logo` CSS variable). Never redraw it.
- Video budget: **max 3 clips playing at once**. Priority: hero, open game page, swipe card.
- 91 games in `DATA`. 36 have tile art. Missing art falls back to initials discs. That's accepted.

## Code map (in checkpoint-8.html)

- `const MEDIA` plus three `Object.assign(MEDIA, {...})` blocks: every image and clip, keyed (`tile_*`, `ex_*` clips, `ex_*_p` posters, `art_*`, `sfp_*`/`sfx_*` Slotsfinder posters and clips).
- `const DATA = {games:[...]}`: per game `n` name, `s` studio, `v` volatility, `m` max win, `t` themes, `f` features, `c` dominant colour.
- Key constants: `STYLES`, `TASTE`, `SAMPLE`, `STORE`, `VCAP` (video cap), `MAXP` (max picks), `SFCLIP`.
- Key functions: `score`, `similar`, `applyProfile`, `heroesRanked`, `dnaHeadline`, `renderRows`, `renderDesk`, `buildLobby`, `renderTaster`, `renderSwipe`, `openExplore`, `togglePw`.
- `<style id="hb-polish">` is Design's presentation layer. The last `<script>` is Design's additive desktop Explore player.

## Phase 0: repo and parity (do this first, nothing else)

1. Vite, vanilla JS (no framework). Split CSS, JS and data into modules. Keep **every ID, data attribute, class name and function name** unchanged, because Claude Design round trips depend on them.
2. Extract every `MEDIA` entry into `assets/` named by key. Then, where possible, replace with higher-quality originals from the Wildcards DB/GCS (query `game_evidence_best`; signed URLs via `mcp__api__assets-getSignedUrl` expire in about an hour, so download, don't hotlink).
3. Two build outputs:
   - `npm run dev` / `npm run build`: lazy-loaded assets. This is what's shown on Thursday.
   - `npm run build:single`: one self-contained HTML (vite-plugin-singlefile) for Claude Design hand-offs. It may exceed 16MB; that's fine, it isn't going to an artifact.
4. **Parity gate**: the build must match checkpoint-8 on both layouts before any feature work. Run `tests/flow_smoke.py` against both, and screenshot each step side by side. Report differences, don't silently "fix" them.

## Phase 1: low-data mode

**Goal: show the lobby still looks amazing without heavy video.** In production this is a backend setting; here it's a demo toggle. Tag its "powering this" note **Concept**.

- Modes: `full` and `low`. Auto-select `low` from `navigator.connection.saveData` or a slow `effectiveType`, with a manual override in the panel, persisted in localStorage `hbtp:prefs:v1`. (iOS Safari doesn't expose the signal, so the toggle matters.)
- In `low`, **no video bytes are fetched**: don't create video sources until tap (`preload="none"`, no `src`), not just paused.
- Replace motion with design, not emptiness: posters, a slow CSS Ken Burns on the hero, tile colour washes from `DATA[].c`, a still mosaic, tap-to-play on game pages and Explore.
- Lighter tile variants (smaller WebP).
- A small "Low data" chip with an estimated data-saved figure (sum of clip bytes not loaded).
- Swipe step in `low`: posters with tap-to-play, so the step still works.

## Phase 2: seasonal themes

**Goal: a temporary seasonal theme that showcases the tech, as deep as possible.** Christmas uses classic imagery (red hats, baubles, trees). Then Black Friday, Easter, St Patrick's Day, all with variant tiles. In production the theme would come from an API call, so **shape the local manifest like that response**. Tag its note **Concept**.

`themes/<id>.json` (sketch, refine as needed):

```json
{
  "id": "xmas",
  "label": "Christmas",
  "tokens": { "--accent": "#c8102e", "--wash": "..." },
  "decor": { "tileBadge": "santa-hat", "overlays": ["baubles-top"], "heroFrame": "garland" },
  "hero": { "game": "...", "clip": "xmas/hero.mp4" },
  "copy": { "rows.picked": "Festive picks for you", "dna.suffix": "..." },
  "rank": { "boostThemes": ["Christmas", "Winter", "Gifts"], "weight": 0.35 },
  "tiles": { "Game of Thrones": "xmas/tiles/got.webp" },
  "clips": { "Sweet Bonanza": "xmas/clips/sweet-bonanza.mp4" }
}
```

- **Re-rank, don't just reskin.** Seasonal rows blend the player's DNA score with seasonal affinity: festive games that fit *this* player. That's the GameDNA story and the point of the feature.
- Theme reaches everything: tokens, tile decorations, hero, row names, CTA and toast copy, taster and DNA headline flavour, build animation, Explore.
- Black Friday is a deal-led theme (badges, countdown styling). Use no real offers or bonus amounts.
- Until Andrew's variant tiles and clips land, use CSS/SVG decoration overlays on existing tiles, so every theme works end to end from day one. Real assets drop into `assets/themes/<id>/` with no code change.
- Themes and low-data must combine (e.g. Christmas in low-data mode).

## Phase 3: expanded "What's powering this" panel

It becomes the demo control surface: **Data mode** (Full / Low), **Season** (Off / Christmas / Black Friday / Easter / St Patrick's), plus the existing Live/Concept notes. Switching is instant, no reload, and keeps the player's profile.

## Design round trips

**This repo is the source of truth.** Claude Design is used for scoped visual passes only. It never owns logic, data, themes or low-data behaviour.

**Who owns what**
- Code owns: JS behaviour, `DATA`, scoring and ranking, the theme engine and manifests, low-data mode, the panel's state, asset loading, the video cap, tests.
- Design owns: presentation. Spacing, type, colour, motion, layout polish, copy tweaks it flags.

**Code to Design**
1. Run `npm run build:single`.
2. Rahoul loads the single HTML into Claude Design with a scoped prompt.

**Design to Code**
1. Rahoul uses Design's "Handoff to Claude Code" and sends it to the **local** agent in this repo (not Claude Code Web, which can't attach a repo to a handoff session).
2. Code reads the bundle and **merges** it into the modules. Never replace the repo with the bundle.
3. Merge rules:
   - Keep every ID, data attribute, class name and function name the JS depends on.
   - Apply presentation changes (CSS, markup structure that doesn't affect JS hooks, copy).
   - Small additive JS from Design (like the desktop Explore player) is allowed if it's self-contained. Move it into its own module.
   - Anything that changes behaviour, data or ranking: don't apply it. List it and ask Rahoul.
4. After merging, run the parity tests on both layouts in every mode (Full/Low, each season) and show before/after screenshots.
5. Commit the merge separately, with a message listing what was applied, what was skipped and why.

**Drift rule:** after a merge, the next Design pass starts from a fresh `build:single`, never from Design's old copy.

## Schedule

- Fri 9 Oct: Phase 0 and parity gate.
- Mon 12: low-data mode, panel.
- Tue 13: theme engine, Christmas in full.
- Wed 14: Black Friday, Easter, St Patrick's; real content drop-in; full regression; Andrew sign-off.
- **Cut order if slipping:** St Patrick's, then Easter, then the data-saved figure. Christmas and low-data mode stay.

## QA conventions

- Playwright, named `.py` files in `tests/` (no heredocs). Screenshots after each build step, desktop 1440x900 and mobile 390x844 at `device_scale_factor=2`. Also run with `reduced_motion='reduce'`.
- Headless Chromium can't play H.264. Check playback in real Chrome (`channel="chrome"`) or by hand.
- Check the video cap holds in every mode.
- Log any deviation from this brief explicitly in the PR or commit message rather than quietly changing course.

## Copy and brand

- Copy is human, punchy and short. No AI-sounding filler, no em dashes.
- Turbo Pickle areas follow `reference/tp-design-system.pdf`; locked terms in `reference/tp-messaging-hierarchy-v1.html`. Hollywoodbets areas follow the HB brand guidelines (gold focus states in HB areas, wasabi only in TP areas).
- Never put a known character or branded figure into decorations. Seasonal art is generic (hats, baubles, trees, shamrocks, eggs).

## Open items

- Game of Thrones studio: the picks disc says Blueprint Gaming, the desktop hero says "Studio being verified". Confirm and make them agree.
- "Check name" games in the DB (GoT, Pirots 2, Zeus vs Hades and others) may exist under other names.
- Andrew sign-off pending: DNA headline patterns, sample-player labels, the Concept tag, earlier copy.
- Demo asset list: `HB_demo_assets_simple.xlsx` (65 must-haves) and `HB_preview_asset_list.xlsx` (full tracker).
