import { readFile, writeFile, mkdir, cp } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(fileURLToPath(import.meta.url));
const source = join(root, 'source');
const dist = join(root, 'dist');
const read = name => readFile(join(source, name), 'utf8');

let [html, css, app, simulator, script, layout] = await Promise.all([
  read('index.html'), read('styles.css'), read('app.js'),
  read('simulator.js'), read('script.json'), read('layout.json')
]);
html = html
  .replace('<link rel="stylesheet" href="styles.css">', () => `<style>\n${css}\n</style>`)
  .replace('  <script src="app.js" defer></script>', '');
const data = [
  ['script-data', script],
  ['layout-data', layout]
].map(([id, json]) =>
  `<script id="${id}" type="application/json">${json.replaceAll('<', '\\u003c')}</script>\n`
).join('');
html = html.replace('</body>', () => `${data}<script>\n${app}\n${simulator}\n</script>\n</body>`);
await mkdir(dist, { recursive: true });
await writeFile(join(dist, 'index.html'), html);
await cp(join(source, 'assets'), join(dist, 'assets'), { recursive: true });
