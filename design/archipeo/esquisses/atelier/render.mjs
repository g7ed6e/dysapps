// Rend les esquisses en PNG (1600 × 1000) dans Chromium, sans serveur de développement.
// Usage, depuis la racine du dépôt : node design/archipeo/esquisses/atelier/render.mjs <dossier> 6e 5e 4e 3e horizon 6e:n …
// (« :n » pour la nuit). CHROMIUM_PATH désigne un Chromium à utiliser à la place de celui de Playwright.
import { createServer } from 'node:http';
import { readFileSync, statSync, mkdirSync } from 'node:fs';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const dir = fileURLToPath(new URL('.', import.meta.url));
const three = fileURLToPath(new URL('../../../../node_modules/three/', import.meta.url));
const [out, ...jobs] = process.argv.slice(2);
if (!out || !jobs.length) {
  console.log('Usage : node render.mjs <dossier> 6e 5e 4e 3e horizon 6e:n …');
  process.exit(1);
}
mkdirSync(out, { recursive: true });
const types = { '.html': 'text/html', '.js': 'text/javascript' };
const srv = createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  const p = url.startsWith('/three/') ? join(three, url.slice('/three/'.length)) : join(dir, url);
  try {
    statSync(p);
    res.writeHead(200, { 'content-type': types[extname(p)] || 'application/octet-stream' });
    res.end(readFileSync(p));
  } catch {
    res.writeHead(404);
    res.end();
  }
}).listen(0);
const port = srv.address().port;
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
for (const j of jobs) {
  const [a, nuit] = j.split(':');
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
  await page.goto(`http://localhost:${port}/index.html?a=${a}&nuit=${nuit ? 1 : 0}`);
  await page.waitForFunction(() => window.PRET || window.ERREUR, null, { timeout: 180000 });
  const err = await page.evaluate(() => window.ERREUR);
  if (err) {
    console.log(a, err);
    continue;
  }
  await page.locator('canvas').screenshot({ path: join(out, `${a}${nuit ? '-nuit' : ''}.png`) });
  console.log('ok', a, nuit || '');
  await page.close();
}
await browser.close();
srv.close();
