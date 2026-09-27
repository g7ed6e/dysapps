// Captures d'écran de la documentation : lance l'application (serveur Vite de développement), la joue dans Chromium
// (Playwright) avec des parties préparées, et enregistre les images dans docs/_captures/ (copiées par prepare.mjs
// dans le site). À relancer quand un écran change : `npm run docs:captures` (ou `npm run docs:captures -- menu carte`
// pour quelques-unes). Chromium : celui de Playwright (PLAYWRIGHT_BROWSERS_PATH), ou CHROMIUM_PATH.
// Les images sont commitées : le build de la documentation ne lance pas le jeu.
import { mkdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { createServer } from 'vite';
import { chromium } from 'playwright-core';

const root = process.cwd();
const OUT = join(root, 'docs', '_captures');
/** Une heure de jour, pour que le ciel et la lumière soient les mêmes à chaque capture. */
const DAY = new Date('2026-09-28T10:30:00');
const TABLET = { width: 1024, height: 768 };
const PHONE = { width: 390, height: 844 };

const server = await createServer({ root, logLevel: 'error', server: { port: 5287, strictPort: false, hmr: false } });
await server.listen();
const base = server.resolvedUrls.local[0].replace(/\/$/, '');
const load = (p) => server.ssrLoadModule(p);
const [{ BIOMES }, { plansFor, planCells }, { VEHICLE_STAGES }, { MONUMENTS }, { BADGES }, { BRIDGES }, { CATALOG }] = await Promise.all([
  load('/src/blocland/biomes.ts'),
  load('/src/blocland/world/plans.ts'),
  load('/src/blocland/world/vehicle.ts'),
  load('/src/blocland/world/monuments.ts'),
  load('/src/core/progress.ts'),
  load('/src/blocland/world/archipelago.ts'),
  load('/src/blocland/exercises/index.ts'),
]);

// ---------- Des parties préparées ----------

const keys = (plan, n = Infinity) => planCells(plan).slice(0, n).map((c) => c.key);
const islandsOf = (classe) => BIOMES.filter((b) => b.classe === classe).map((b) => b.id);
const bridgesOf = (classe) => BRIDGES.filter((b) => islandsOf(classe).includes(b.from)).map((b) => b.id);
/** Des étoiles sur les missions des îles (le premier exercice de chaque type). */
function stars(islands, n = 2) {
  const out = {};
  for (const id of islands) {
    for (const ex of BIOMES.find((b) => b.id === id).exercises) {
      const first = CATALOG.filter((e) => e.biome === id && e.type === ex.id).sort((a, b) => a.level - b.level)[0];
      if (first) out[first.id] = { stars: n, attempts: 1, best: n === 3 ? 1 : 0.8 };
    }
  }
  return out;
}
const guardians = (islands) => Object.fromEntries(islands.map((id) => [`${id}-gardien`, { stars: 2, attempts: 1, best: 0.8 }]));
const badges = (n) => Object.fromEntries(BADGES.slice(0, n).map((b, i) => [b.id, new Date(2026, 8, 1 + i).toISOString()]));

/** Le début : deux missions jouées dans la Forêt, la cabane commencée. */
const EARLY = {
  blocland: {
    inventory: { bois: 9, brique: 4 },
    progress: stars(['foret'], 2),
    village: { plans: { [plansFor('foret')[0].id]: keys(plansFor('foret')[0], 12) }, bridges: ['foret-plaine'], at: 'foret' },
  },
  progress: { xp: 180, totalAnswers: 40, correctAnswers: 31, sessionsCompleted: 4, badges: badges(3) },
};
/** Assez de bois pour finir la cabane de Mousso. */
const CABANE_READY = { ...EARLY, blocland: { ...EARLY.blocland, inventory: { bois: planCells(plansFor('foret')[0]).length } } };
/** Au milieu des Premiers Rivages : des îles ouvertes, des bâtiments finis, la coque du navire commencée. */
const six = islandsOf('6e');
const MID = {
  blocland: {
    inventory: { bois: 14, brique: 22, pierre: 9, terre: 6, sable: 5, galet: 4, verre: 3, or: 2 },
    progress: { ...stars(['foret', 'plaine', 'mine', 'ferme', 'riviere'], 2), ...stars(['foret'], 3), ...guardians(['foret', 'plaine']) },
    village: {
      plans: {
        ...Object.fromEntries(['foret', 'plaine'].flatMap((id) => plansFor(id).slice(0, 2).map((p) => [p.id, keys(p)]))),
        ...Object.fromEntries(['mine', 'ferme'].map((id) => [plansFor(id)[0].id, keys(plansFor(id)[0])])),
        [plansFor('riviere')[0].id]: keys(plansFor('riviere')[0], 10),
        [VEHICLE_STAGES[0].id]: keys(VEHICLE_STAGES[0], 24),
        [MONUMENTS[0].id]: keys(MONUMENTS[0], 50),
      },
      journal: [{ day: '2026-09-20', plan: plansFor('foret')[0].id }],
      bridges: ['foret-plaine', 'foret-mine', 'foret-ferme', 'plaine-riviere', 'mine-carriere'],
      at: 'foret',
    },
  },
  progress: { xp: 1450, totalAnswers: 310, correctAnswers: 250, sessionsCompleted: 28, plansCompleted: 6, bossesBeaten: 2, bestStreak: 9, badges: badges(9) },
};
/** Les Premiers Rivages reconstruits : tout est ouvert et bâti, le navire a pris la mer. */
const DONE6 = {
  blocland: {
    inventory: { bois: 30, brique: 25, toile: 8 },
    progress: { ...stars(six, 3), ...guardians(six) },
    village: {
      plans: {
        ...Object.fromEntries(six.flatMap((id) => plansFor(id).map((p) => [p.id, keys(p)]))),
        [VEHICLE_STAGES[0].id]: keys(VEHICLE_STAGES[0]),
        ...Object.fromEntries(MONUMENTS.filter((m) => m.archipelago === '6e').map((m) => [m.id, keys(m)])),
      },
      journal: [],
      bridges: [...bridgesOf('6e'), 'voyage-5e'],
      at: 'foret',
    },
  },
  progress: { xp: 5200, totalAnswers: 1200, correctAnswers: 1010, sessionsCompleted: 90, plansCompleted: 33, bossesBeaten: 11, voyages: 1, monumentsCompleted: 2, badges: badges(17) },
};
/** Arrivé dans les Îles Brumeuses. */
const COLLINES = { ...DONE6, blocland: { ...DONE6.blocland, village: { ...DONE6.blocland.village, at: 'marche' } } };

// ---------- Les captures ----------

const FOREST_QUEST = BIOMES.find((b) => b.id === 'foret').exercises[0].id;

/** name: fichier ; state: partie préparée ; view: vue du monde ; go: adresse ; act: gestes avant la capture. */
const SHOTS = [
  { name: 'titre', state: EARLY, title: true, go: '/' },
  { name: 'menu', state: MID, go: '/menu' },
  { name: 'menu-village', state: MID, go: '/aventure/menu' },
  { name: 'village-premiere-visite', go: '/aventure', tutorial: true },
  { name: 'panneau-ile', state: EARLY, go: '/aventure/foret' },
  { name: 'plan-en-cours', state: EARLY, go: '/aventure/foret', act: closeSheet },
  { name: 'plan-termine', state: CABANE_READY, go: '/aventure/foret', act: placeAll },
  { name: 'quete-ile', state: EARLY, go: `/aventure/foret/${FOREST_QUEST}`, wait: 2500 },
  { name: 'quete-correction', go: '/app/demo', act: wrongAnswer, wait: 1500 },
  { name: 'quete-fin', go: '/app/demo', act: playWell, wait: 1500 },
  { name: 'mes-blocs', state: MID, go: '/aventure/blocs' },
  { name: 'carte', state: MID, go: '/aventure/carte' },
  { name: 'ouvrages', state: MID, go: '/aventure/ferme', act: openFold('ouvrages') },
  { name: 'navire-chantier', state: MID, go: '/aventure/plaine', act: openFold('navire') },
  { name: 'gardien', state: MID, go: '/aventure/mine/gardien', wait: 2500 },
  { name: 'ecole', state: MID, go: '/aventure/ecole' },
  { name: 'trophees', state: MID, go: '/aventure/trophees' },
  { name: 'monument', state: MID, go: '/aventure/monument-observatoire' },
  { name: 'village-reconstruit', state: DONE6, go: '/aventure' },
  { name: 'collines-du-large', state: COLLINES, go: '/aventure/marche', act: closeSheet },
  { name: 'vue-2d', state: MID, view: '2d', go: '/aventure/foret', act: closeSheet },
  { name: 'vue-simple', state: MID, view: 'liste', go: '/aventure' },
  { name: 'telephone-village', state: MID, go: '/aventure/foret', size: PHONE },
  { name: 'telephone-quete', state: EARLY, go: `/aventure/foret/${FOREST_QUEST}`, size: PHONE, wait: 2500 },
  { name: 'quetes', state: MID, go: '/quetes' },
  { name: 'succes', state: MID, go: '/succes' },
  { name: 'reglages', state: MID, go: '/reglages' },
];

/** « Poser tout ce que j'ai » dans le panneau de l'île. */
async function placeAll(page) {
  await page.getByRole('button', { name: /Poser tout ce que j’ai/ }).first().click();
  await page.waitForTimeout(2500);
  // La phrase de la créature, le coffre et l'XP : sous les boutons du panneau.
  await page.locator('.build-status').first().evaluate((el) => el.scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(300);
}
async function closeSheet(page) {
  const close = page.getByRole('button', { name: 'Fermer le panneau' });
  if (!(await close.count())) return;
  await close.first().click();
  await page.waitForTimeout(2500);
}
function openFold(name) {
  return async (page) => {
    const fold = page.locator(`.island-fold-${name}`);
    if (!(await fold.evaluate((el) => el.open))) await fold.locator('summary').click();
    await fold.evaluate((el) => el.scrollIntoView({ block: 'start' }));
    await page.waitForTimeout(500);
  };
}
const CHOICES = 'main button:not([aria-label]):not([disabled])';
const norm = (t) => t.replace(/\s+/g, ' ').trim();
/** Les réponses possibles de la question affichée (sans Écouter, le joker ni Suivante). */
async function choices(page) {
  const all = page.locator(CHOICES);
  const texts = (await all.allInnerTexts()).map(norm);
  return texts.map((text, i) => ({ text, at: all.nth(i) })).filter((c) => c.text && !/Écouter|joker|Suivante|Voir le résultat/.test(c.text));
}
/** Le tutoriel du portail : une mauvaise réponse, pour montrer la correction. */
async function wrongAnswer(page) {
  const answers = await learnDemo(page);
  const wrong = (await choices(page)).find((c) => c.text !== answers[0]);
  await wrong.at.click();
}
/** Le tutoriel du portail joué sans faute, jusqu'à l'écran de fin. */
async function playWell(page) {
  const answers = await learnDemo(page);
  for (const answer of answers) {
    const list = await choices(page);
    await (list.find((c) => c.text === answer) ?? list[0]).at.click();
    await page.waitForTimeout(400);
    await page.getByRole('button', { name: /Suivante|Voir le résultat/ }).click();
    await page.waitForTimeout(400);
  }
  await page.waitForTimeout(2500);
}
/** Joue le tutoriel une fois pour apprendre ses réponses (la case juste est cochée après la réponse), puis le relance. */
async function learnDemo(page) {
  const answers = [];
  for (let i = 0; i < 10; i++) {
    const list = await choices(page);
    if (!list.length) break;
    await list[0].at.click();
    await page.waitForTimeout(300);
    // La bonne réponse, marquée juste (coche verte) une fois la question résolue.
    const right = await page.locator('main button[disabled]').evaluateAll((bs) => {
      const b = bs.find((x) => /correct|right|juste|ok/.test(x.className));
      return b ? b.innerText : null;
    });
    answers.push(norm(right ?? list[0].text));
    const next = page.getByRole('button', { name: /Suivante|Voir le résultat/ });
    if (!(await next.count())) break;
    const last = /Voir le résultat/.test(await next.innerText());
    await next.click();
    await page.waitForTimeout(300);
    if (last) break;
  }
  await page.goto(`${base}/icon.svg`);
  await page.goto(`${base}/#/app/demo`);
  await page.waitForTimeout(1200);
  return answers;
}

// ---------- La prise de vue ----------

const only = process.argv.slice(2);
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
mkdirSync(OUT, { recursive: true });
let failed = 0;
for (const shot of SHOTS.filter((s) => only.length === 0 || only.includes(s.name))) {
  const page = await browser.newPage({ viewport: shot.size ?? TABLET, deviceScaleFactor: 1 });
  await page.clock.setFixedTime(DAY);
  // Un hasard à graine fixe : mêmes questions, mêmes phrases, à chaque capture (et d'un chargement à l'autre).
  await page.addInitScript(() => {
    let seed = 20260928;
    Math.random = () => {
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  });
  if (process.env.CAPTURES_DEBUG) page.on('pageerror', (e) => console.error(`  (page) ${e.message}`));
  try {
    // La partie s'écrit depuis une page statique du même site : l'appli, pas encore lancée, ne peut pas l'écraser.
    await page.goto(`${base}/icon.svg`);
    await page.evaluate(
      ({ state, view, title, tutorial }) => {
        localStorage.clear();
        sessionStorage.clear();
        if (!title) sessionStorage.setItem('dysapps:titre-vu', '1');
        // Les réglages par défaut (la page Réglages les montre tels quels), sauf la vue du monde.
        localStorage.setItem('dysapps:settings', JSON.stringify({ worldView: view }));
        if (!tutorial) localStorage.setItem('dysapps:tutos', JSON.stringify({ 'village-immersif': true, 'archipel-5e': true, 'archipel-4e': true, 'archipel-3e': true }));
        if (state?.blocland) localStorage.setItem('dysapps:blocland', JSON.stringify(state.blocland));
        if (state?.progress) localStorage.setItem('dysapps:progress', JSON.stringify(state.progress));
      },
      { state: shot.state ?? null, view: shot.view ?? '3d', title: Boolean(shot.title), tutorial: Boolean(shot.tutorial) },
    );
    await page.goto(`${base}/#${shot.go}`);
    // Le monde 3D met quelques secondes à se construire (rendu logiciel, sans carte graphique).
    await page.waitForTimeout(shot.wait ?? 6000);
    if (shot.act) await shot.act(page);
    const file = join(OUT, `${shot.name}.jpg`);
    await page.screenshot({ path: file, type: 'jpeg', quality: 82 });
    console.log(`✓ ${shot.name} (${Math.round(statSync(file).size / 1024)} Ko)`);
  } catch (e) {
    failed += 1;
    console.error(`✗ ${shot.name} : ${e.message.split('\n')[0]}`);
    if (process.env.CAPTURES_DEBUG) await page.screenshot({ path: join(process.env.CAPTURES_DEBUG, `${shot.name}.png`) });
  } finally {
    await page.close();
  }
}
await browser.close();
await server.close();
process.exit(failed ? 1 : 0);
