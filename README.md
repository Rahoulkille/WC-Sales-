# Hollywoodbets on Turbo Pickle: lobby preview

Private, sales-led preview of the Hollywoodbets lobby powered by Turbo Pickle GameDNA. See `CLAUDE.md` for the brief.

## Run it

```sh
npm install
npm run dev            # local dev server
npm run build          # dist/: what's shown on Thursday (npm run preview to serve it)
npm run build:single   # dist-single/index.html: one self-contained file for Claude Design
```

Everything, fonts included, is local, so the demo works offline.

## Test it

```sh
pip install playwright pillow numpy
python tests/flow_smoke.py http://localhost:4173/index.html   # against npm run preview
python tests/parity.py --rm --noise                           # parity gate, writes tests/out/
```

Headless Chromium can't play H.264, so check video playback by hand in Chrome.
