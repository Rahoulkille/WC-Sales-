"""Split reference/checkpoint-8.html into the Vite source tree.

Writes:
  assets/media/<key>.<ext>     every MEDIA entry, named by key
  assets/brand/<name>.<ext>    inline <img> data URIs in the markup (deduped)
  src/styles/base.css          first <style> block
  src/styles/hb-polish.css     <style id="hb-polish"> (Design's layer)
  src/data/data.json           DATA
  src/app/lobby.js             main app IIFE, verbatim, with MEDIA/DATA imports
  src/design/explore-desktop.js  Design's additive desktop Explore script, verbatim
  index.html                   markup with style placeholders and one module entry

Usage: python -I scripts/extract_media.py [reference/checkpoint-8.html]
Re-runnable. It overwrites the files above, so don't run it after hand edits
unless you mean to reset to the checkpoint.
"""
import base64, hashlib, json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'reference', 'checkpoint-8.html')
EXT = {'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/png': 'png', 'video/mp4': 'mp4', 'image/svg+xml': 'svg', 'image/gif': 'gif'}
URI = r'data:([a-z]+/[a-z0-9.+-]+);base64,([A-Za-z0-9+/=]+)'
# Names for the inline <img> data URIs in the markup, in document order.
# Duplicates are written once, under the first name.
BRAND_NAMES = ['tp-logo', 'tp-logo', 'tp-logo', 'mascot', 'mascot']

html = open(SRC, encoding='utf-8').read()


def out(rel, data):
    p = os.path.join(ROOT, rel)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    mode = 'wb' if isinstance(data, bytes) else 'w'
    with open(p, mode, **({} if mode == 'wb' else {'encoding': 'utf-8'})) as f:
        f.write(data)


def blocks(tag):
    for m in re.finditer(r'<%s([^>]*)>' % tag, html):
        end = html.index('</%s>' % tag, m.end())
        yield m.start(), end + len('</%s>' % tag), m.group(1), html[m.end():end]


styles = list(blocks('style'))
scripts = list(blocks('script'))
assert len(styles) == 2 and 'hb-polish' in styles[1][2], 'expected base + hb-polish styles'
assert len(scripts) == 6, 'expected MEDIA, 3x Object.assign, app, design scripts'

# ---- MEDIA ----
media = {}
for _, _, _, body in scripts[:4]:
    for key, mime, b64 in re.findall(r'"([A-Za-z0-9_]+)"\s*:\s*"' + URI + '"', body):
        assert key not in media, key
        media[key] = (mime, base64.b64decode(b64))
for key, (mime, raw) in media.items():
    out('assets/media/%s.%s' % (key, EXT[mime]), raw)

# ---- DATA ----
m = re.search(r'const DATA\s*=\s*(\{.*?\});?\s*$', scripts[0][3], re.S)
data = json.loads(m.group(1))
out('src/data/data.json', json.dumps(data, ensure_ascii=False, indent=1) + '\n')

# ---- styles ----
out('src/styles/base.css', styles[0][3].strip('\n') + '\n')
out('src/styles/hb-polish.css', styles[1][3].strip('\n') + '\n')

# ---- scripts ----
app = scripts[4][3].strip('\n')
out('src/app/lobby.js',
    "// Main app, ported verbatim from reference/checkpoint-8.html.\n"
    "// MEDIA and DATA were globals there; here they're imported.\n"
    "import MEDIA from '../media.js';\n"
    "import DATA from '../data/data.json';\n\n" + app + '\n')
out('src/design/explore-desktop.js', scripts[5][3].strip('\n') + '\n')

# ---- markup ----
head_end = styles[0][0]
page = html[:styles[0][0]] + '<!--hb:style base-->\n<!--hb:style hb-polish-->' + html[styles[1][1]:scripts[0][0]]
page = page.rstrip() + '\n<script type="module" src="/src/main.js"></script>' + html[scripts[5][1]:]

brand, seen, i = {}, {}, 0


def brand_img(mm):
    global i
    mime, raw = mm.group(1), base64.b64decode(mm.group(2))
    h = hashlib.sha1(raw).hexdigest()
    if h not in seen:
        name = 'assets/brand/%s.%s' % (BRAND_NAMES[i] if i < len(BRAND_NAMES) else 'img%d' % i, EXT[mime])
        seen[h] = name
        out(name, raw)
    i += 1
    return '/' + seen[h]


page = re.sub(URI, brand_img, page)
out('index.html', page)

print('media', len(media), 'brand', len(seen), 'of', i, 'games', len(data['games']), 'heroes', len(data.get('heroes', [])))
