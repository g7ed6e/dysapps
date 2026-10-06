// Étude Babylon.js : lance `banc.html` pour chaque scène, moteur et mode, et écrit le tableau (et une capture de chacun).
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createServer } from 'vite';
import { chromium } from 'playwright-core';

const OUT = process.argv[2] ?? 'scripts/rendu/etude-babylon/sortie';
const W = process.argv[3] ?? 320, H = process.argv[4] ?? 240;
mkdirSync(join(OUT, 'captures'), { recursive: true });
const server = await createServer({ root: process.cwd(), logLevel: 'error', server: { port: 5300, strictPort: false, hmr: false } });
await server.listen();
const base = server.resolvedUrls.local[0].replace(/\/$/, '');
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const rows = [];
const cas = (process.env.CAS ?? 'three:brut,three:optimise,three:fusion,three:classe,babylon:brut,babylon:optimise,babylon:fusion,babylon:classe').split(',');
for (const scene of (process.env.SCENES ?? '6e-ile,6e-carte').split(',')) {
  for (const c of cas) {
    const [moteur, mode] = c.split(':');
    const page = await browser.newPage({ viewport: { width: Number(W), height: Number(H) } });
    page.on('pageerror', (e) => console.error(moteur, mode, e.message));
    await page.goto(`${base}/scripts/rendu/etude-babylon/banc.html?scene=${scene}&moteur=${moteur}&mode=${mode}&w=${W}&h=${H}`);
    await page.waitForFunction(() => window.__resultat, null, { timeout: 300000 });
    const r = await page.evaluate(() => window.__resultat);
    await page.screenshot({ path: join(OUT, 'captures', `${scene}-${moteur}-${mode}-${W}.png`) });
    console.log(JSON.stringify(r));
    rows.push(r);
    await page.close();
  }
}
writeFileSync(join(OUT, `resultats-${W}x${H}.json`), JSON.stringify(rows, null, 1));
await browser.close();
await server.close();
