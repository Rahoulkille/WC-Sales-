"""Smoke test: Style -> Games -> React -> reveal -> lobby -> Explore, desktop and mobile.
Headless Chromium cannot play H.264, so this checks flow and layout, not playback."""
import asyncio
from playwright.async_api import async_playwright
import os, sys
# Usage: python tests/flow_smoke.py [path-or-url]  (defaults to reference/checkpoint-8.html)
T=sys.argv[1] if len(sys.argv)>1 else 'reference/checkpoint-8.html'
F=T if T.startswith('http') else 'file://'+os.path.abspath(T)
async def run(vp,name):
    async with async_playwright() as p:
        b=await p.chromium.launch()
        pg=await b.new_page(viewport=vp)
        errs=[]
        pg.on('pageerror',lambda e:errs.append(str(e)))
        await pg.goto(F,wait_until='load',timeout=90000); await pg.wait_for_timeout(1500)
        async def click(sel,i=0):
            el=pg.locator(sel).nth(i); await el.scroll_into_view_if_needed(); await el.click(); await pg.wait_for_timeout(600)
        log=[]
        await click('[data-style]',0); await click('[data-style]',2); log.append('styles ok')
        await click('[data-tz=next]'); 
        n=await pg.locator('[data-pick]').count(); log.append(f'picks {n}')
        for i in (0,3,6): await click('[data-pick]',i)
        tray=await pg.locator('#tzTray > *').count(); log.append(f'tray {tray}')
        await pg.screenshot(path=f'{name}_games.png')
        await click('[data-tz=next]')
        for a in ['keep','love','skip','keep','skip','love']:
            if await pg.locator(f'[data-sw={a}]').first.is_visible(): await click(f'[data-sw={a}]')
        log.append('swiped')
        await pg.screenshot(path=f'{name}_after_swipe.png')
        nx=pg.locator('[data-tz=next]')
        await pg.wait_for_timeout(1500)
        try:
            if await nx.is_visible(): await nx.click(timeout=3000)
        except Exception: log.append('next auto-advanced')
        await pg.wait_for_timeout(6000)
        await pg.screenshot(path=f'{name}_reveal.png')
        if await pg.locator('[data-reveal=lobby]').first.is_visible():
            await click('[data-reveal=lobby]'); await pg.wait_for_timeout(2000); log.append('to lobby')
        await pg.screenshot(path=f'{name}_lobby.png')
        prof=await pg.evaluate("localStorage.getItem('hbtp:profile:v2')")
        log.append('profile saved' if prof else 'NO PROFILE')
        # explore
        ex=pg.locator('[data-explore]').first
        if await ex.count() and await ex.is_visible():
            await ex.click(); await pg.wait_for_timeout(1500)
            log.append('explore open' if await pg.evaluate("document.querySelector('#exploreSheet').classList.contains('open')") else 'explore NOT open')
            await pg.screenshot(path=f'{name}_explore.png')
        print(name,log,'errors:',errs[:5])
        await b.close()
async def main():
    await run({'width':1440,'height':900},'desk'); await run({'width':390,'height':844},'mob')
asyncio.run(main())
