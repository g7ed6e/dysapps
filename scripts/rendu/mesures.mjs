// Les mesures du rendu du monde (lot R0 de la migration vers Archipéo) : pour chaque archipel tout construit, les appels
// de dessin et les triangles de la vue 3D (lus sur `renderer.info` par le compteur `three/meter.ts`), et le poids de
// Three.js dans le paquet de l'application. `npm run rendu:mesures` ; `npm run rendu:mesures -- --sans-poids` saute le
// build. Chromium en rendu logiciel (SwiftShader) : les appels et les triangles ne dépendent pas de la carte graphique,
// les images par seconde si ; elles se mesurent sur la tablette de référence avec `?mesures` dans l'adresse.
// `--captures <dossier>` enregistre en plus les captures déclarées dans `CAPTURES` (ci-dessous), pour comparer un lot de
// rendu à l'état d'avant ; elles ne sont pas versionnées (la branche `captures` en garde un dossier par lot).
// `--familles nuit,2d` n'en refait que certaines familles (jour, nuit, 2d, contraste, reduit, personnages). `--rendu archipeo` mesure le rendu en construction (le drapeau
// `?rendu=archipeo`), `--style a|b|c` une option de style de surface (lot R1), `--archipel 6e` un seul archipel,
// `--attente 20` le temps laissé à la scène avant la mesure (en secondes, 10 par défaut : en rendu logiciel, une scène
// plus lente à dessiner met plus longtemps à rejoindre son cadrage, la Carte surtout).
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { build, createServer } from 'vite';
import { chromium } from 'playwright-core';

const root = process.cwd();
const TABLET = { width: 1024, height: 768 };
const kilo = (n) => `${Math.round(n / 1024)} Ko`;
const arg = process.argv.indexOf('--captures');
const SHOTS = arg >= 0 ? process.argv[arg + 1] : null;
const option = (name) => {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : null;
};
/** Le drapeau de rendu et l'option de style, avant le `#` de l'adresse. */
const QUERY = (() => {
  const q = new URLSearchParams();
  if (option('--rendu')) q.set('rendu', option('--rendu'));
  if (option('--style')) q.set('style', option('--style'));
  const s = q.toString();
  return s ? `?${s}` : '';
})();
const ONLY = option('--archipel');
const WAIT = Number(option('--attente') ?? 10) * 1000;
/** Une heure de jour et une de nuit, pour que le ciel et la lumière soient les mêmes à chaque fois. */
const DAY = new Date('2026-09-28T10:30:00');
const NIGHT = new Date('2026-09-28T22:30:00');

/**
 * Les captures déclarées d'avance (le socle de la piste Rendu, docs/conception/cadrage-archipeo.md §6) : pour chaque
 * archipel tout construit, tout ce que montrent les lots de rendu et la revue d'ensemble du directeur artistique, de près
 * et de loin (une île, l'archipel, la Carte), de jour et de nuit, en 3D et en 2D, en Contraste élevé et avec « Réduire
 * les animations ». Le fichier : `<archipel>-<nom>.jpg`. Les captures de jour en 3D sont aussi celles des mesures.
 * Un lot ne change pas cette liste : il refait les captures et les montre toutes.
 */
const CAPTURES = [
  { nom: 'ile', vue: 'île', famille: 'jour' },
  { nom: 'archipel', vue: 'archipel', famille: 'jour' },
  { nom: 'carte', vue: 'carte', famille: 'jour' },
  { nom: 'ile-nuit', vue: 'île', famille: 'nuit', nuit: true },
  { nom: 'archipel-nuit', vue: 'archipel', famille: 'nuit', nuit: true },
  { nom: 'carte-nuit', vue: 'carte', famille: 'nuit', nuit: true },
  { nom: 'ile-2d', vue: 'île', famille: '2d', view: '2d' },
  { nom: 'archipel-2d', vue: 'archipel', famille: '2d', view: '2d' },
  { nom: 'carte-2d', vue: 'carte', famille: '2d', view: '2d' },
  { nom: 'ile-2d-nuit', vue: 'île', famille: '2d', view: '2d', nuit: true },
  { nom: 'archipel-2d-nuit', vue: 'archipel', famille: '2d', view: '2d', nuit: true },
  { nom: 'carte-2d-nuit', vue: 'carte', famille: '2d', view: '2d', nuit: true },
  { nom: 'ile-contraste', vue: 'île', famille: 'contraste', theme: 'contraste' },
  { nom: 'archipel-contraste', vue: 'archipel', famille: 'contraste', theme: 'contraste' },
  { nom: 'carte-contraste', vue: 'carte', famille: 'contraste', theme: 'contraste' },
  { nom: 'ile-contraste-nuit', vue: 'île', famille: 'contraste', theme: 'contraste', nuit: true },
  { nom: 'archipel-contraste-nuit', vue: 'archipel', famille: 'contraste', theme: 'contraste', nuit: true },
  // « Réduire les animations » : deux captures à quelques secondes d'écart, qui doivent être identiques (rien ne bouge).
  { nom: 'ile-reduit', vue: 'île', famille: 'reduit', reduceMotion: true, encore: 'ile-reduit-bis' },
  { nom: 'archipel-reduit', vue: 'archipel', famille: 'reduit', reduceMotion: true, encore: 'archipel-reduit-bis' },
  // Les personnages hors du monde (lot R6) : chaque Gardien au défi, éteint, en 3D (`parIle` : un fichier par île,
  // `<archipel>-defi-<île>.jpg`) et en SVG (sans la 3D) ; la bulle d'une créature (le défi pas encore ouvert : la partie
  // sans étoiles), en 3D et en SVG.
  { nom: 'defi', vue: 'défi', famille: 'personnages', parIle: true },
  { nom: 'defi-svg', vue: 'défi', famille: 'personnages', view: '2d' },
  { nom: 'bulle', vue: 'bulle', famille: 'personnages', sansEtoiles: true },
  { nom: 'bulle-svg', vue: 'bulle', famille: 'personnages', view: '2d', sansEtoiles: true },
];
/** L'écart entre une capture et sa seconde (`encore`). */
const ECART = 4000;
const FAMILLES = option('--familles')?.split(',') ?? null;

// ---------- Le poids de Three.js dans le paquet ----------

async function weights() {
  const out = mkdtempSync(join(tmpdir(), 'dysapps-mesures-'));
  try {
    await build({ root, logLevel: 'error', build: { outDir: out, emptyOutDir: true } });
    const dir = join(out, 'assets');
    const js = readdirSync(dir).filter((f) => f.endsWith('.js'));
    const size = (f) => {
      const buf = readFileSync(join(dir, f));
      return { file: f, raw: statSync(join(dir, f)).size, gzip: gzipSync(buf).length, three: /REVISION\s*=\s*"\d+"|WebGLRenderer/.test(buf.toString()) };
    };
    return js.map(size).sort((a, b) => b.raw - a.raw);
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
}

// ---------- Les appels de dessin et les triangles ----------

async function scenes() {
  // Le build a passé le processus en production : le compteur ne s'exposerait pas (import.meta.env.DEV).
  process.env.NODE_ENV = 'development';
  const server = await createServer({ root, logLevel: 'error', server: { port: 5288, strictPort: false, hmr: false } });
  await server.listen();
  const base = server.resolvedUrls.local[0].replace(/\/$/, '');
  const load = (p) => server.ssrLoadModule(p);
  const [{ BIOMES }, { ARCHIPELAGO_IDS }, { toutConstruit }] = await Promise.all([
    load('/src/blocland/biomes.ts'),
    load('/src/blocland/world/map.ts'),
    load('/src/blocland/world/budget.ts'),
  ]);
  // La même partie tout construite que le test du budget (world/budget.test.ts).
  const { progress, village: built } = toutConstruit();

  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || undefined,
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
  });
  if (SHOTS) mkdirSync(SHOTS, { recursive: true });
  const rows = [];
  for (const a of ARCHIPELAGO_IDS.filter((id) => !ONLY || id === ONLY)) {
    const at = BIOMES.find((b) => b.classe === a).id;
    const routes = { île: `/aventure/${at}`, archipel: '/aventure', carte: '/aventure/carte', défi: `/aventure/${at}/gardien`, bulle: `/aventure/${at}/gardien` };
    const iles = BIOMES.filter((b) => b.classe === a).map((b) => b.id);
    // Les mesures : les trois vues de jour en 3D. Avec `--captures`, toutes les captures déclarées (voir `CAPTURES`).
    const views = [
      ...['île', 'archipel', 'carte'].map((vue) => ({ vue, go: routes[vue], mesure: true, nom: CAPTURES.find((c) => c.vue === vue && c.famille === 'jour').nom })),
      ...(SHOTS
        ? CAPTURES.filter((c) => c.famille !== 'jour' && (!FAMILLES || FAMILLES.includes(c.famille))).flatMap((c) =>
            (c.parIle ? iles : [null]).map((ile) => ({
              vue: c.vue,
              go: ile ? `/aventure/${ile}/gardien` : routes[c.vue],
              time: c.nuit ? NIGHT : DAY,
              view: c.view,
              theme: c.theme,
              reduceMotion: c.reduceMotion,
              sansEtoiles: c.sansEtoiles,
              nom: ile ? `${c.nom}-${ile}` : c.nom,
              encore: c.encore,
            })),
          )
        : []),
    ];
    for (const { vue, go, time = DAY, view = '3d', theme, reduceMotion, sansEtoiles, nom, encore, mesure } of views) {
      const page = await browser.newPage({ viewport: TABLET, deviceScaleFactor: 1 });
      await page.clock.setFixedTime(time);
      await page.goto(`${base}/icon.svg`);
      await page.evaluate(
        ({ village, progress, view, theme, reduceMotion }) => {
          localStorage.clear();
          sessionStorage.setItem('dysapps:titre-vu', '1');
          localStorage.setItem('dysapps:settings', JSON.stringify({ worldView: view, ...(theme ? { theme } : {}), ...(reduceMotion ? { reduceMotion } : {}) }));
          localStorage.setItem('dysapps:tutos', JSON.stringify({ 'village-immersif': true, 'archipel-5e': true, 'archipel-4e': true, 'archipel-3e': true }));
          localStorage.setItem('dysapps:blocland', JSON.stringify({ inventory: {}, progress, village }));
          localStorage.setItem('dysapps:progress', JSON.stringify({ xp: 20000 }));
        },
        { village: { ...built, at }, progress: sansEtoiles ? {} : progress, view, theme, reduceMotion },
      );
      await page.goto(`${base}/${QUERY}#${go}`);
      const file = SHOTS && join(SHOTS, `${a}-${nom}.jpg`);
      if (!mesure) {
        // Les autres captures (nuit, 2D, Contraste élevé, animations réduites) : pas de mesure, seulement l'image.
        await page.waitForTimeout(8000);
        await page.screenshot({ path: file, type: 'jpeg', quality: 85, timeout: 90000 });
        if (encore) {
          // L'heure est figée (`setFixedTime`), mais les animations tournent : sans le réglage, l'image aurait bougé.
          await page.waitForTimeout(ECART);
          await page.screenshot({ path: join(SHOTS, `${a}-${encore}.jpg`), type: 'jpeg', quality: 85, timeout: 90000 });
        }
        await page.close();
        continue;
      }
      try {
        // Le monde se construit en quelques secondes (rendu logiciel), puis la caméra rejoint son cadrage en douceur.
        // (Pas de waitForFunction : l'horloge figée de la page l'empêche de sonder.)
        await page.waitForTimeout(WAIT);
        const s = await page.evaluate(() => ({ ...window.__dysappsRendu }));
        if (!s.calls) throw new Error('aucune image dessinée');
        rows.push({ archipel: a, vue, ...s });
        if (file) await page.screenshot({ path: file, type: 'jpeg', quality: 85, timeout: 90000 });
      } catch (e) {
        rows.push({ archipel: a, vue, erreur: e.message.split('\n')[0] });
      }
      await page.close();
    }
  }
  await browser.close();
  await server.close();
  return rows;
}

// Le build d'abord : le serveur de développement le passerait en mode développement.
const js = process.argv.includes('--sans-poids') ? null : await weights();
const rows = await scenes();
console.log('\n| Archipel | Vue | Appels de dessin | Triangles | Géométries | Textures | Images/s (rendu logiciel) |');
console.log('| --- | --- | ---: | ---: | ---: | ---: | ---: |');
for (const r of rows) {
  if (r.erreur) console.log(`| ${r.archipel} | ${r.vue} | ${r.erreur} | | | | |`);
  else console.log(`| ${r.archipel} | ${r.vue} | ${r.calls} | ${r.triangles.toLocaleString('fr-FR')} | ${r.geometries} | ${r.textures} | ${r.fps} |`);
}
if (js) {
  console.log('\n| Fichier | Poids | Compressé (gzip) | Three.js |');
  console.log('| --- | ---: | ---: | --- |');
  for (const f of js.slice(0, 6)) console.log(`| ${f.file} | ${kilo(f.raw)} | ${kilo(f.gzip)} | ${f.three ? 'oui' : ''} |`);
}
process.exit(rows.some((r) => r.erreur) ? 1 : 0);
