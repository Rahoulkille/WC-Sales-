// Inlines src/styles/*.css into index.html as the checkpoint's two <style> blocks,
// so <style id="hb-polish"> survives into every build (Design round trips rely on it).
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const STYLES = { base: '', 'hb-polish': ' id="hb-polish"' };

export default function hbStyles() {
  const file = (name) => resolve(import.meta.dirname, '../src/styles', name + '.css');
  return {
    name: 'hb-styles',
    configureServer(server) {
      for (const name in STYLES) server.watcher.add(file(name));
      server.watcher.on('change', (p) => {
        if (Object.keys(STYLES).some((n) => file(n) === p)) server.ws.send({ type: 'full-reload' });
      });
    },
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        return html.replace(/<!--hb:style ([\w-]+)-->/g, (m, name) =>
          name in STYLES ? `<style${STYLES[name]}>\n${readFileSync(file(name), 'utf-8')}</style>` : m);
      },
    },
  };
}
