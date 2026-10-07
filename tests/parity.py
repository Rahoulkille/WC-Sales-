"""Parity gate: run the same flow on reference/checkpoint-8.html and the Vite builds,
screenshot every step on both layouts, and report differences.

Usage: python tests/parity.py [--no-build] [--rm] [--noise] [--only desk|mob]
  --no-build  reuse dist/ and dist-single/ as they are
  --rm        also run with reduced_motion='reduce'
  --noise     also run the checkpoint a second time, to show the run-to-run noise floor
  --only      one layout

Writes tests/out/<target>/<layout>/<step>.png, side-by-sides in tests/out/compare/,
and tests/out/report.md. Math.random is seeded identically on every target and CSS
animations are frozen for screenshots, so remaining pixel diffs are real.
Headless Chromium can't play H.264, so this checks flow and layout, not playback.
"""
import asyncio, functools, http.server, json, os, subprocess, sys, threading
import numpy as np
from PIL import Image, ImageDraw
from playwright.async_api import async_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'tests', 'out')
LAYOUTS = {'desk': {'width': 1440, 'height': 900}, 'mob': {'width': 390, 'height': 844}}
SEED = """(()=>{let a=1234567;Math.random=function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);
t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}})();"""
PROBE = """()=>{const q=s=>document.querySelector(s),n=s=>document.querySelectorAll(s).length,
vis=e=>!!e&&e.getClientRects().length>0&&getComputedStyle(e).visibility!=='hidden';
return {layout:document.body.dataset.layout,picks:n('[data-pick]'),tray:n('#tzTray > *'),
styles:n('[data-style]'),swipeBtns:n('[data-sw]'),tiles:n('#rows .tile'),rows:n('#rows > *'),
taster:vis(q('#taster'))&&getComputedStyle(q('#taster')).display!=='none',
explore:!!q('#exploreSheet')&&q('#exploreSheet').classList.contains('open'),
videosWithSrc:[...document.querySelectorAll('video')].filter(v=>v.currentSrc||v.getAttribute('src')).length,
tzBody:(q('#tzBody')||{}).innerText?.trim().replace(/\\s+/g,' ').slice(0,240)||'',
heroName:(q('#heroName')||{}).textContent||'',
profile:localStorage.getItem('hbtp:profile:v2')}}"""


def serve(directory):
    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a): pass
    h = functools.partial(Quiet, directory=directory)
    srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), h)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return 'http://127.0.0.1:%d/index.html' % srv.server_address[1]


async def run(p, url, target, layout, rm):
    tag = layout + ('-rm' if rm else '')
    d = os.path.join(OUT, target, tag)
    os.makedirs(d, exist_ok=True)
    # PW_CHROMIUM lets a container point at a preinstalled Chromium.
    b = await p.chromium.launch(executable_path=os.environ.get('PW_CHROMIUM') or None)
    ctx = await b.new_context(viewport=LAYOUTS[layout], device_scale_factor=2,
                              reduced_motion='reduce' if rm else 'no-preference')
    await ctx.add_init_script(SEED)
    pg = await ctx.new_page()
    errs, steps = [], {}
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.on('console', lambda m: m.type == 'error' and 'favicon' not in (m.location or {}).get('url', '') and errs.append('console: ' + m.text[:200]))
    pg.on('response', lambda r: r.status >= 400 and not r.url.endswith('favicon.ico') and errs.append('%d %s' % (r.status, r.url[-80:])))

    async def shot(name, wait=600):
        await pg.wait_for_timeout(wait)
        await pg.screenshot(path=os.path.join(d, name + '.png'), animations='disabled')
        steps[name] = await pg.evaluate(PROBE)

    async def click(sel, i=0):
        el = pg.locator(sel).nth(i)
        await el.scroll_into_view_if_needed()
        await el.click()
        await pg.wait_for_timeout(600)

    await pg.goto(url, wait_until='load', timeout=90000)
    await shot('01_open', 1500)
    await click('[data-style]', 0); await click('[data-style]', 2)
    await shot('02_style')
    await click('[data-tz=next]')
    for i in (0, 3, 6): await click('[data-pick]', i)
    await shot('03_games')
    await click('[data-tz=next]')
    await shot('04_react')
    for a in ['keep', 'love', 'skip', 'keep', 'skip', 'love']:
        if await pg.locator('[data-sw=%s]' % a).first.is_visible(): await click('[data-sw=%s]' % a)
    await shot('05_after_swipe')
    await pg.wait_for_timeout(1500)
    nx = pg.locator('[data-tz=next]')
    try:
        if await nx.is_visible(): await nx.click(timeout=3000)
    except Exception: pass
    await shot('06_reveal', 6000)
    if await pg.locator('[data-reveal=lobby]').first.is_visible():
        await click('[data-reveal=lobby]')
    await shot('07_lobby', 2000)
    await pg.screenshot(path=os.path.join(d, '07b_lobby_full.png'), full_page=True, animations='disabled')
    # flow_smoke only tries [data-explore], which isn't visible on mobile; fall back to the bar button.
    for sel in ('[data-explore]', '[data-open=explore]'):
        ex = pg.locator(sel + ':visible').first
        if await ex.count() and await ex.is_visible():
            await ex.click()
            await shot('08_explore', 1500)
            break
    await b.close()
    return {'errors': errs, 'steps': steps}


def compare(a, b, out):
    ia, ib = Image.open(a).convert('RGB'), Image.open(b).convert('RGB')
    w, h = max(ia.width, ib.width), max(ia.height, ib.height)
    pa, pb = Image.new('RGB', (w, h)), Image.new('RGB', (w, h))
    pa.paste(ia); pb.paste(ib)
    diff = np.abs(np.asarray(pa, dtype=np.int16) - np.asarray(pb, dtype=np.int16)).max(axis=2) > 24
    pct = 100.0 * diff.mean()
    gap = 24
    sbs = Image.new('RGB', (w * 2 + gap, h + 60), (20, 20, 20))
    sbs.paste(pa, (0, 60)); sbs.paste(pb, (w + gap, 60))
    dr = ImageDraw.Draw(sbs)
    dr.text((12, 20), 'checkpoint-8', fill=(255, 255, 255))
    dr.text((w + gap + 12, 20), 'build  (diff %.2f%%)' % pct, fill=(255, 255, 255))
    os.makedirs(os.path.dirname(out), exist_ok=True)
    sbs.thumbnail((1800, 4000))
    sbs.save(out)
    return pct


async def main():
    if '--no-build' not in sys.argv:
        for cmd in (['npm', 'run', 'build'], ['npm', 'run', 'build:single']):
            subprocess.run(cmd, cwd=ROOT, check=True, stdout=subprocess.DEVNULL)
    targets = {
        'checkpoint': 'file://' + os.path.join(ROOT, 'reference', 'checkpoint-8.html'),
        'build': serve(os.path.join(ROOT, 'dist')),
        'single': 'file://' + os.path.join(ROOT, 'dist-single', 'index.html'),
    }
    if '--noise' in sys.argv:
        targets['checkpoint_again'] = targets['checkpoint']
    if '--only' in sys.argv:
        for k in [k for k in LAYOUTS if k != sys.argv[sys.argv.index('--only') + 1]]: del LAYOUTS[k]
    modes = [False, True] if '--rm' in sys.argv else [False]
    res = {}
    async with async_playwright() as p:
        for layout in LAYOUTS:
            for rm in modes:
                tag = layout + ('-rm' if rm else '')
                for t, url in targets.items():
                    res[(t, tag)] = await run(p, url, t, layout, rm)
    lines = ['# Parity report', '']
    for layout in LAYOUTS:
        for rm in modes:
            tag = layout + ('-rm' if rm else '')
            ref = res[('checkpoint', tag)]
            for t in [t for t in targets if t != 'checkpoint']:
                cur = res[(t, tag)]
                lines += ['## %s vs checkpoint, %s' % (t, tag), '',
                          '- errors: checkpoint %s / %s %s' % (ref['errors'] or 'none', t, cur['errors'] or 'none'), '',
                          '| step | pixel diff | DOM differences |', '|---|---|---|']
                for step in ref['steps']:
                    a = os.path.join(OUT, 'checkpoint', tag, step + '.png')
                    bpath = os.path.join(OUT, t, tag, step + '.png')
                    if not os.path.exists(bpath):
                        lines.append('| %s | missing | step not reached |' % step); continue
                    pct = compare(a, bpath, os.path.join(OUT, 'compare', t, tag, step + '.png'))
                    sa, sb = ref['steps'][step], cur['steps'].get(step, {})
                    dd = ['%s: %r vs %r' % (k, sa[k], sb.get(k)) for k in sa
                          if k != 'profile' and sa[k] != sb.get(k)]
                    if (sa['profile'] is None) != (sb.get('profile') is None): dd.append('profile saved differs')
                    lines.append('| %s | %.2f%% | %s |' % (step, pct, '; '.join(dd) or 'same'))
                full = '07b_lobby_full'
                fa, fb = (os.path.join(OUT, x, tag, full + '.png') for x in ('checkpoint', t))
                if os.path.exists(fa) and os.path.exists(fb):
                    lines.append('| %s | %.2f%% | |' % (full, compare(fa, fb, os.path.join(OUT, 'compare', t, tag, full + '.png'))))
                lines.append('')
    open(os.path.join(OUT, 'report.md'), 'w').write('\n'.join(lines) + '\n')
    print('\n'.join(lines))


asyncio.run(main())
