"""Stack parity.py's side-by-sides into one image per layout: tests/out/sheet_<target>_<layout>.png
Usage: python tests/contact_sheet.py [build|single]"""
import glob, os, sys
from PIL import Image

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out')
target = sys.argv[1] if len(sys.argv) > 1 else 'build'
for d in sorted(glob.glob(os.path.join(OUT, 'compare', target, '*'))):
    ims = []
    for p in sorted(glob.glob(os.path.join(d, '*.png'))):
        if 'full' in p: continue
        im = Image.open(p).convert('RGB')
        im = im.resize((1200, round(im.height * 1200 / im.width)))
        ims.append(im)
    sheet = Image.new('RGB', (1200, sum(i.height for i in ims) + 16 * len(ims)), (60, 60, 60))
    y = 0
    for im in ims:
        sheet.paste(im, (0, y)); y += im.height + 16
    path = os.path.join(OUT, 'sheet_%s_%s.png' % (target, os.path.basename(d)))
    sheet.save(path, optimize=True)
    print(path, sheet.size)
