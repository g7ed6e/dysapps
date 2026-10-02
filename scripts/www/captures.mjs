// Captures d'écran de la documentation : lance l'application (serveur Vite de développement), la joue dans Chromium
// (Playwright) avec des parties préparées, et enregistre les images dans www/_captures/ (copiées par prepare.mjs
// dans le site). À relancer quand un écran change : `npm run www:captures` (ou `npm run www:captures -- menu carte`
// pour quelques-unes). Chromium : celui de Playwright (PLAYWRIGHT_BROWSERS_PATH), ou CHROMIUM_PATH.
// Les images ne sont pas dans le dépôt (www/_captures/ est ignoré) : la CI les refait dans un job à part (captures)
// avant de construire la documentation, qui ne lance pas le jeu elle-même.
import { mkdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { createServer } from 'vite';
import { chromium } from 'playwright-core';
import { attendreLaScene, capturer, figeable, hasardFixe } from '../prise-de-vue.mjs';

const root = process.cwd();
const OUT = join(root, 'www', '_captures');
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
const guardians = (islands) => Object.fromEntries(islands.map((id) => [`${id}-challenge`, { stars: 2, attempts: 1, best: 0.8 }]));
const badges = (n) => Object.fromEntries(BADGES.slice(0, n).map((b, i) => [b.id, new Date(2026, 8, 1 + i).toISOString()]));

/** Le début : deux missions jouées dans la Forêt, la cabane commencée. */
const EARLY = {
  game: {
    stock: { 'french-6e-phonology': 9, 'maths-6e-calculation': 4 },
    progress: stars(['french-6e-phonology'], 2),
    world: { parts: { [plansFor('french-6e-phonology')[0].id]: keys(plansFor('french-6e-phonology')[0], 12) }, links: ['french-6e-phonology-maths-6e-calculation'], place: 'french-6e-phonology' },
  },
  progress: { xp: 180, totalAnswers: 40, correctAnswers: 31, sessionsCompleted: 4, badges: badges(3) },
};
/** Au milieu des Premiers Rivages : des îles ouvertes, des bâtiments finis, la coque du navire commencée. */
const six = islandsOf('6e');
const MID = {
  game: {
    stock: { 'french-6e-phonology': 14, 'maths-6e-calculation': 22, 'french-6e-letter-confusion': 9, 'french-6e-grammar-spelling': 6, 'french-6e-word-spelling': 5, 'maths-6e-fractions': 4, 'french-6e-reading': 3, 'trophy-gold': 2 },
    progress: { ...stars(['french-6e-phonology', 'maths-6e-calculation', 'french-6e-letter-confusion', 'french-6e-grammar-spelling', 'maths-6e-fractions'], 2), ...stars(['french-6e-phonology'], 3), ...guardians(['french-6e-phonology', 'maths-6e-calculation']) },
    world: {
      parts: {
        ...Object.fromEntries(['french-6e-phonology', 'maths-6e-calculation'].flatMap((id) => plansFor(id).slice(0, 2).map((p) => [p.id, keys(p)]))),
        ...Object.fromEntries(['french-6e-letter-confusion', 'french-6e-grammar-spelling'].map((id) => [plansFor(id)[0].id, keys(plansFor(id)[0])])),
        [plansFor('maths-6e-fractions')[0].id]: keys(plansFor('maths-6e-fractions')[0], 10),
        [VEHICLE_STAGES[0].id]: keys(VEHICLE_STAGES[0], 24),
        [MONUMENTS[0].id]: keys(MONUMENTS[0], 50),
      },
      log: [{ day: '2026-09-20', part: plansFor('french-6e-phonology')[0].id }],
      links: ['french-6e-phonology-maths-6e-calculation', 'french-6e-phonology-french-6e-letter-confusion', 'french-6e-phonology-french-6e-grammar-spelling', 'maths-6e-calculation-maths-6e-fractions', 'french-6e-letter-confusion-french-6e-word-spelling'],
      place: 'french-6e-phonology',
    },
  },
  progress: { xp: 1450, totalAnswers: 310, correctAnswers: 250, sessionsCompleted: 28, structuresCompleted: 6, challengesWon: 2, bestStreak: 9, badges: badges(9) },
};
/** Les Premiers Rivages reconstruits : tout est ouvert et bâti, le navire a pris la mer. */
const DONE6 = {
  game: {
    stock: { 'french-6e-phonology': 30, 'maths-6e-calculation': 25, 'maths-5e-proportionality': 8 },
    progress: { ...stars(six, 3), ...guardians(six) },
    world: {
      parts: {
        ...Object.fromEntries(six.flatMap((id) => plansFor(id).map((p) => [p.id, keys(p)]))),
        [VEHICLE_STAGES[0].id]: keys(VEHICLE_STAGES[0]),
        ...Object.fromEntries(MONUMENTS.filter((m) => m.archipelago === '6e').map((m) => [m.id, keys(m)])),
      },
      log: [],
      links: [...bridgesOf('6e'), 'passage-5e'],
      place: 'french-6e-phonology',
    },
  },
  progress: { xp: 5200, totalAnswers: 1200, correctAnswers: 1010, sessionsCompleted: 90, structuresCompleted: 33, challengesWon: 11, passages: 1, landmarksCompleted: 2, badges: badges(17) },
};
/** Arrivé dans les Îles Brumeuses. */
const COLLINES = { ...DONE6, game: { ...DONE6.game, world: { ...DONE6.game.world, place: 'maths-5e-proportionality' } } };

// ---------- Les captures ----------

const FOREST_QUEST = BIOMES.find((b) => b.id === 'french-6e-phonology').exercises[0].id;

/**
 * name: fichier ; state: partie préparée ; view: vue du monde ; go: adresse ; act: gestes avant la capture ; whale: ce
 * que la baleine a déjà dit ; renommage: l'écran des nouveaux noms des archipels reste à dire (noté dit sinon).
 */
const SHOTS = [
  { name: 'titre', state: EARLY, title: true, go: '/' },
  { name: 'menu', state: MID, go: '/menu' },
  { name: 'telephone-menu', state: MID, go: '/menu', size: PHONE },
  { name: 'menu-village', state: MID, go: '/adventure/menu' },
  { name: 'village-premiere-visite', go: '/adventure', tutorial: true },
  { name: 'panneau-ile', state: EARLY, go: '/adventure/french-6e-phonology' },
  { name: 'plan-en-cours', state: EARLY, go: '/adventure/french-6e-phonology', act: closeSheet },
  { name: 'quete-ile', state: EARLY, go: `/adventure/french-6e-phonology/${FOREST_QUEST}`, wait: 2500 },
  // Le bandeau de correction monte du bas de l'écran : il faut l'attendre en entier.
  { name: 'quete-correction', go: '/app/demo', act: wrongAnswer, wait: 1500, after: 1500 },
  { name: 'quete-fin', go: '/app/demo', act: playWell, wait: 1500 },
  { name: 'mes-blocs', state: MID, go: '/adventure/stock' },
  { name: 'carte', state: MID, go: '/adventure/map' },
  { name: 'archipels', state: MID, go: '/adventure/world' },
  // Le mot des grandes étapes : sa présentation déjà dite, reste le premier ouvrage (le sentier vers la Mine).
  { name: 'baleine', state: MID, go: '/adventure', whale: { 'baleine-6e-arrivee': true }, wait: 9000 },
  // Les nouveaux noms des archipels (GD-1), dits une fois à un élève qui jouait déjà.
  { name: 'renommage', state: MID, go: '/adventure', whale: { 'baleine-6e-arrivee': true }, renommage: true, wait: 9000 },
  { name: 'ouvrages', state: MID, go: '/adventure/french-6e-grammar-spelling', act: openFold('ouvrages') },
  { name: 'navire-chantier', state: MID, go: '/adventure/maths-6e-calculation', act: openFold('navire') },
  { name: 'gardien', state: MID, go: '/adventure/french-6e-letter-confusion/challenge', wait: 2500 },
  { name: 'ecole', state: MID, go: '/adventure/school' },
  { name: 'trophees', state: MID, go: '/adventure/trophies' },
  { name: 'monument', state: MID, go: '/adventure/landmark-6e-1' },
  { name: 'village-reconstruit', state: DONE6, go: '/adventure' },
  { name: 'collines-du-large', state: COLLINES, go: '/adventure/maths-5e-proportionality', act: closeSheet },
  { name: 'vue-simple', state: MID, view: 'list', go: '/adventure' },
  { name: 'telephone-village', state: MID, go: '/adventure/french-6e-phonology', size: PHONE },
  { name: 'telephone-quete', state: EARLY, go: `/adventure/french-6e-phonology/${FOREST_QUEST}`, size: PHONE, wait: 2500 },
  { name: 'quetes', state: MID, go: '/quetes' },
  { name: 'succes', state: MID, go: '/succes' },
  { name: 'reglages', state: MID, go: '/reglages' },
  { name: 'reglages-univers', state: MID, go: '/reglages', act: showUnivers },
];

/**
 * Les réglages extrêmes (rendez-vous 4 du lot 6, référent dys) : OpenDyslexic en 32 px, interlignage et espacements
 * au plus grand, sans voix, et l'appareil qui demande de réduire les animations. Ces captures ne vont pas au manuel :
 * elles ne se prennent que nommées (`npm run www:captures -- extreme-carte-nuit`), pour une relecture.
 */
// Les bornes de sanitizeSettings (src/core/settings.ts) : une valeur au-delà serait ramenée sans erreur.
const EXTREMES = { font: 'opendyslexic', fontSize: 32, lineHeight: 2.4, letterSpacing: 0.2, wordSpacing: 0.5, autoRead: false };
const deBase = (n) => SHOTS.find((s) => s.name === n) ?? (() => { throw new Error(`capture inconnue : ${n}`); })();
// Le nom de la capture garde le mot affiché du thème ; le réglage, sa valeur neutre.
const THEMES = { creme: 'cream', nuit: 'night', clair: 'light' };
const extreme = (name, theme) => ({ ...deBase(name), name: `extreme-${name}-${theme}`, settings: { ...EXTREMES, theme: THEMES[theme] }, reduit: true, surDemande: true });
SHOTS.push(
  extreme('quete-correction', 'creme'),
  extreme('telephone-quete', 'creme'),
  extreme('carte', 'nuit'),
  extreme('telephone-village', 'nuit'),
  extreme('gardien', 'clair'),
  extreme('quete-fin', 'clair'),
  extreme('vue-simple', 'creme'),
);

/**
 * Archipéo, choisi dans les Réglages (lot 6 C) : la section « Les sentinelles d'Archipéo » du manuel. La même partie
 * que la capture de Blocland, pour que les deux se comparent.
 */
// Le nom écrit en entier : prepare.mjs lit les `name: '…'` pour savoir quelles captures le manuel peut citer.
const archipeo = ({ base, name }) => ({ ...deBase(base), name, settings: { univers: 'archipeo' } });
SHOTS.push(
  archipeo({ base: 'gardien', name: 'archipeo-gardien' }),
  archipeo({ base: 'collines-du-large', name: 'archipeo-collines-du-large' }),
);
// Les réglages extrêmes dans Archipéo (rendez-vous 4 du lot 6, référent dys) : sur demande seulement, comme ceux de Blocland.
const extremeArchipeo = (base, theme) => ({ ...extreme(base, theme), name: `extreme-archipeo-${base}-${theme}`, settings: { ...EXTREMES, theme: THEMES[theme], univers: 'archipeo' } });
SHOTS.push(
  extremeArchipeo('gardien', 'clair'),
  extremeArchipeo('carte', 'nuit'),
  extremeArchipeo('telephone-village', 'nuit'),
  extremeArchipeo('collines-du-large', 'creme'),
);

/** La section Univers des Réglages : Blocland, coché, puis Archipéo. */
async function showUnivers(page) {
  // Sous la barre du haut, qui reste en place.
  await page.getByRole('group', { name: 'Univers' }).evaluate((el) => window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 110));
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
for (const shot of SHOTS.filter((s) => (only.length === 0 && !s.surDemande) || only.includes(s.name))) {
  // Sur une machine lente (la CI, sans carte graphique), une capture du monde 3D peut dépasser le délai : on la
  // reprend une fois avant de la compter en échec.
  let error = null;
  for (let attempt = 1; attempt <= 2; attempt++) {
    error = await take(shot);
    if (!error) break;
    console.error(`  ${shot.name} : essai ${attempt} manqué (${error})`);
  }
  if (error) {
    failed += 1;
    console.error(`✗ ${shot.name} : ${error}`);
  }
}

/** Prend une capture ; rend le message d'erreur, ou null si elle est prise. */
async function take(shot) {
  const page = await browser.newPage({ viewport: shot.size ?? TABLET, deviceScaleFactor: 1, reducedMotion: shot.reduit ? 'reduce' : 'no-preference' });
  await page.clock.setFixedTime(DAY);
  // Un hasard à graine fixe : mêmes questions, mêmes phrases, à chaque capture (et d'un chargement à l'autre).
  await page.addInitScript(hasardFixe);
  await page.addInitScript(figeable);
  if (process.env.CAPTURES_DEBUG) page.on('pageerror', (e) => console.error(`  (page) ${e.message}`));
  try {
    // La partie s'écrit depuis une page statique du même site : l'appli, pas encore lancée, ne peut pas l'écraser.
    await page.goto(`${base}/icon.svg`);
    await page.evaluate(
      ({ state, view, settings, title, tutorial, whale, renommage }) => {
        localStorage.clear();
        sessionStorage.clear();
        if (!title) sessionStorage.setItem('dysapps:title-seen', '1');
        // Les réglages par défaut (la page Réglages les montre tels quels), sauf la vue du monde et les réglages extrêmes.
        localStorage.setItem('dysapps:settings', JSON.stringify({ ...settings, worldView: view }));
        if (!tutorial) localStorage.setItem('dysapps:tutorials', JSON.stringify({ 'village-immersif': true, 'archipel-5e': true, 'archipel-4e': true, 'archipel-3e': true }));
        if (state?.game) localStorage.setItem('dysapps:game', JSON.stringify({ version: 3, ...state.game }));
        if (state?.progress) localStorage.setItem('dysapps:progress', JSON.stringify(state.progress));
        // Ce que la baleine a déjà dit : sans cette clé, les étapes déjà passées sont notées dites, sans parler.
        if (whale) localStorage.setItem('dysapps:guide-messages', JSON.stringify(whale));
        // Les nouveaux noms des archipels : déjà dits, sauf sur leur capture (une partie préparée les ferait dire).
        localStorage.setItem('dysapps:region-names', JSON.stringify({ said: !renommage }));
      },
      {
        state: shot.state ?? null,
        view: shot.view ?? '3d',
        settings: shot.settings ?? {},
        title: Boolean(shot.title),
        tutorial: Boolean(shot.tutorial),
        whale: shot.whale ?? null,
        renommage: Boolean(shot.renommage),
      },
    );
    await page.goto(`${base}/#${shot.go}`);
    // Le monde 3D met quelques secondes à se construire (rendu logiciel, sans carte graphique).
    await page.waitForTimeout(shot.wait ?? 6000);
    if (shot.act) await shot.act(page);
    if (shot.after) await page.waitForTimeout(shot.after);
    // Un écran avec le monde 3D : la caméra, bridée, n'a pas forcément fini de rejoindre son cadrage (après un geste qui
    // change d'île ou ouvre la Carte) ; elle s'y pose d'un coup.
    if (await page.evaluate(() => Boolean(window.__dysappsCamera))) await attendreLaScene(page, 15_000);
    const file = join(OUT, `${shot.name}.jpg`);
    // Le rendu logiciel de la 3D peut prendre plus de 30 s par image sur la CI.
    await capturer(page, { path: file, type: 'jpeg', quality: 82, timeout: 120_000 });
    console.log(`✓ ${shot.name} (${Math.round(statSync(file).size / 1024)} Ko)`);
    return null;
  } catch (e) {
    if (process.env.CAPTURES_DEBUG) await page.screenshot({ path: join(process.env.CAPTURES_DEBUG, `${shot.name}.png`) }).catch(() => {});
    return e.message.split('\n')[0];
  } finally {
    await page.close();
  }
}

await browser.close();
await server.close();
process.exit(failed ? 1 : 0);
