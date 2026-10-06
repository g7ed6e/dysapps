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
/** Une heure de nuit (`nuit: true`), pour relire ce que la nuit fait au monde. */
const NIGHT = new Date('2026-09-28T22:30:00');
const TABLET = { width: 1024, height: 768 };
const PHONE = { width: 390, height: 844 };

const server = await createServer({ root, logLevel: 'error', server: { port: 5287, strictPort: false, hmr: false } });
await server.listen();
const base = server.resolvedUrls.local[0].replace(/\/$/, '');
const load = (p) => server.ssrLoadModule(p);
const [{ BIOMES }, { plansFor, planCells }, { VEHICLE_STAGES }, { MONUMENTS }, { BADGES }, { BRIDGES }, { CATALOG }] = await Promise.all([
  load('/src/game/biomes.ts'),
  load('/src/game/world/plans.ts'),
  load('/src/game/world/vehicle.ts'),
  load('/src/game/world/monuments.ts'),
  load('/src/core/progress.ts'),
  load('/src/game/world/archipelago.ts'),
  load('/src/game/exercises/index.ts'),
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
/** Le début, la Mine reliée : la Rivière a deux départs (« Autre départ », GD-9). */
const EARLY_MINE = { ...EARLY, game: { ...EARLY.game, world: { ...EARLY.game.world, links: [...EARLY.game.world.links, 'french-6e-phonology-french-6e-letter-confusion'] } } };
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
/** Les Premiers Rivages reconstruits, avec de quoi poser toute la digue entre la Tour et la Ferme (91 cases, une marche). */
const REUNIR = {
  ...DONE6,
  game: { ...DONE6.game, stock: { ...DONE6.game.stock, 'french-6e-reading': 100, 'french-6e-grammar-spelling': 100 }, world: { ...DONE6.game.world, place: 'french-6e-reading' } },
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
  // Le menu en page n'existe plus qu'en vue simple : dans le village, `/menu` ouvre le menu du village.
  { name: 'menu', state: MID, view: 'list', go: '/menu' },
  { name: 'telephone-menu', state: MID, view: 'list', go: '/menu', size: PHONE },
  { name: 'menu-village', state: MID, go: '/adventure/menu' },
  { name: 'village-premiere-visite', go: '/adventure', tutorial: true },
  { name: 'panneau-ile', state: EARLY, go: '/adventure/french-6e-phonology', act: openSheet },
  { name: 'plan-en-cours', state: EARLY, go: '/adventure/french-6e-phonology' },
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
  // La fiche d'une borne (Toucher le monde, lot 2), ouverte comme d'un toucher.
  { name: 'fiche-borne', state: EARLY, go: '/adventure/french-6e-phonology', act: ouvrirLaFiche({ genre: 'borne', id: 'french-6e-phonology:syllables' }) },
  // Relier une île pâle (GD-9) : la fiche de l'ouvrage proposé, puis le départ suivant.
  { name: 'fiche-relier', state: EARLY_MINE, go: '/adventure/french-6e-phonology', act: relierDepuisUneAutreIle('maths-6e-fractions') },
  // Aménager sa région (GD-9) : sur la Carte, le mode ouvert, un lieu choisi et son fantôme calé sur une place libre.
  { name: 'amenager', state: MID, go: '/adventure/map', act: amenager('maths-6e-fractions', { x: 150, y: 100 }) },
  // Réunir deux lieux (GD-9, point 10) : la Tour du lecteur choisie, « Réunir » touché, la question, « Réunir avec la
  // Ferme des accords », « Valider » ; la digue finie depuis son panneau, puis regardée de près sur la Carte (l'herbe
  // sur la pierre, la marche).
  { name: 'reunir', state: REUNIR, go: '/adventure/map', act: reunir('french-6e-reading', 'french-6e-grammar-spelling') },
  // Pour les relectures, sur demande : le mode au téléphone, la question de « Réunir », et le geste tenu au milieu du
  // démontage (on ne doit voir aucun creux dans la couche qui reste).
  { name: 'telephone-amenager', state: MID, go: '/adventure/map', size: PHONE, act: amenager('maths-6e-fractions', { x: 150, y: 100 }), surDemande: true },
  // Au téléphone en grand texte, « Modifier le plan » propose d'abord la liste : la liste ouverte dans son panneau.
  { name: 'telephone-amenager-liste', state: MID, go: '/adventure/map', size: PHONE, settings: { fontSize: 28 }, act: amenagerEnListe, surDemande: true },
  { name: 'reunir-question', state: REUNIR, go: '/adventure/map', act: reunirQuestion('french-6e-reading'), surDemande: true },
  { name: 'amenager-geste', state: MID, go: '/adventure/map', act: amenagerGeste('maths-6e-fractions', { x: 150, y: 100 }, 300), surDemande: true },
  // Le port de la 6e à la carte de départ, de près : la baleine y est-elle cachée ? (question du directeur artistique)
  { name: 'port-6e-baleine', state: MID, go: '/adventure/maths-6e-calculation', act: fermerLesBandeaux, surDemande: true },
  // Le bandeau « Succès débloqué » au téléphone : relu aux réglages extrêmes (texte sous l'icône, Fermer dans l'écran).
  { name: 'telephone-succes', state: MID, go: '/adventure/map', size: PHONE, act: attendre(1500), surDemande: true },
  { name: 'gardien', state: MID, go: '/adventure/french-6e-letter-confusion/challenge', wait: 2500 },
  { name: 'ecole', state: MID, go: '/adventure/school' },
  { name: 'trophees', state: MID, go: '/adventure/trophies' },
  { name: 'monument', state: MID, go: '/adventure/landmark-6e-1' },
  { name: 'village-reconstruit', state: DONE6, go: '/adventure' },
  { name: 'collines-du-large', state: COLLINES, go: '/adventure/maths-5e-proportionality' },
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
  extreme('amenager', 'creme'),
  extreme('telephone-amenager', 'nuit'),
  extreme('quete-correction', 'creme'),
  extreme('telephone-quete', 'creme'),
  extreme('carte', 'nuit'),
  extreme('telephone-village', 'nuit'),
  extreme('gardien', 'clair'),
  extreme('quete-fin', 'clair'),
  extreme('vue-simple', 'creme'),
  extreme('telephone-succes', 'nuit'),
  extreme('telephone-amenager-liste', 'nuit'),
);

/**
 * Archipéo, choisi dans les Réglages (lot 6 C) : la section « Les sentinelles d'Archipéo » du manuel. La même partie
 * que la capture de Blocland, pour que les deux se comparent.
 */
// Le nom écrit en entier : prepare.mjs lit les `name: '…'` pour savoir quelles captures le manuel peut citer.
const archipeo = ({ base, name }) => ({ ...deBase(base), name, settings: { univers: 'archipeo' } });
/**
 * La première bulle du tutoriel au téléphone, dans les deux univers et en grand texte : sur demande seulement, pour
 * relire sa place au-dessus de la barre du bas.
 */
const tutoTelephone = { go: '/adventure', tutorial: true, size: PHONE, surDemande: true };
SHOTS.push(
  { ...tutoTelephone, name: 'telephone-tutoriel' },
  { ...tutoTelephone, name: 'telephone-tutoriel-archipeo', settings: { univers: 'archipeo' } },
  { ...tutoTelephone, name: 'telephone-tutoriel-grand-texte', settings: { fontSize: 28 } },
);
// Archipéo, sur demande : le voile de brume tenu à mi-démontage (plein, serré sur le lieu, dont le contour se devine
// dessous), la nuit aux trois quarts (étiré vers la nouvelle place), et la jetée finie, ses dalles plus claires.
SHOTS.push(
  { ...archipeo({ base: 'amenager-geste', name: 'archipeo-amenager-geste' }), act: amenagerGesteFleche('french-6e-letter-confusion', 'Nord', 300), surDemande: true },
  { ...archipeo({ base: 'reunir', name: 'archipeo-reunir' }), surDemande: true },
  { ...archipeo({ base: 'amenager-geste', name: 'archipeo-amenager-geste-nuit' }), act: amenagerGeste('maths-6e-fractions', { x: 150, y: 100 }, 450), settings: { univers: 'archipeo' }, nuit: true, surDemande: true },
);
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

/** Le panneau de l'île, en plein écran : il ne s'ouvre que par son bouton, dans la barre du bas. */
async function openSheet(page) {
  await page.getByRole('button', { name: /^Ouvrir le panneau de / }).first().click();
  await page.waitForTimeout(800);
}
/** La fiche d'un objet du monde, ouverte comme d'un toucher (`window.__dysappsFiche`, en développement), le temps que la caméra glisse. */
function ouvrirLaFiche(objet) {
  return async (page) => {
    await page.waitForFunction(() => Boolean(window.__dysappsFiche));
    await page.evaluate((o) => window.__dysappsFiche(o), objet);
    await page.waitForTimeout(2500);
  };
}
/** Ouvre la fiche d'une île pâle, touche « Relier », puis le chevron « Autre départ » (l'état préparé a deux départs). */
function relierDepuisUneAutreIle(ile) {
  return async (page) => {
    await ouvrirLaFiche({ genre: 'ile', id: ile })(page);
    await page.getByRole('button', { name: 'Relier' }).click();
    await page.waitForTimeout(1500);
    const autre = page.getByRole('button', { name: /^Autre départ/ });
    await autre.click();
    // Le bandeau d'un succès gagné par l'état préparé cacherait le cadrage de la liaison.
    const bandeau = page.locator('.celebration button[aria-label="Fermer"]');
    while (await bandeau.count()) await bandeau.first().click();
    await page.waitForTimeout(2500);
  };
}
/** Ouvre le mode « Aménager » sur la Carte, choisit un lieu et touche la mer en `point` (en cases du monde). */
function amenager(ile, point) {
  return async (page) => {
    // Le bandeau d'un succès gagné par l'état préparé cacherait la scène (et, en grand texte au téléphone, le bouton).
    await fermerLesBandeaux(page);
    await page.getByRole('button', { name: /^Modifier le plan/ }).click();
    await page.waitForTimeout(500);
    await fermerLesBandeaux(page);
    // Au téléphone en grand texte, la Carte propose d'abord la liste : on reste sur la Carte.
    const rester = page.getByRole('button', { name: /Rester sur la Carte/ });
    if (await rester.count()) await rester.click();
    // Deux touchers, l'un après l'autre : le second lit le choix fait par le premier.
    await page.evaluate((ile) => window.__dysappsAmenager?.({ genre: 'ile', id: ile }), ile);
    await page.waitForTimeout(800);
    await page.evaluate((point) => window.__dysappsAmenager?.({ genre: 'mer', point }), point);
    await page.waitForTimeout(2500);
  };
}
/** Touche « Modifier le plan », puis « En liste » (au téléphone en grand texte), et choisit la Rivière des fractions. */
async function amenagerEnListe(page) {
  await fermerLesBandeaux(page);
  await page.getByRole('button', { name: /^Modifier le plan/ }).click();
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: 'En liste', exact: true }).click();
  await page.waitForTimeout(800);
  await page.getByRole('button', { name: 'Déplacer Rivière des fractions' }).click();
  await page.waitForTimeout(800);
}
/**
 * Ferme les bandeaux des succès gagnés par l'état préparé, seulement pour qu'ils ne couvrent pas la scène : un vrai
 * toucher, puisque Fermer reste toujours dans l'écran (`telephone-succes` le montre, réglages extrêmes compris).
 */
async function fermerLesBandeaux(page) {
  const bandeau = page.locator('.celebration button[aria-label="Fermer"]');
  while (await bandeau.count()) await bandeau.first().click();
}
/** Attend `ms`, sans autre geste. */
function attendre(ms) {
  return (page) => page.waitForTimeout(ms);
}
/** Le geste de la pose tenu à `ms` de son démontage (`window.__dysappsGesteA`), après le choix d'un lieu et de sa place. */
function amenagerGeste(ile, point, ms) {
  const choisir = amenager(ile, point);
  return async (page) => {
    await choisir(page);
    await page.evaluate((ms) => (window.__dysappsGesteA = ms), ms);
    await page.getByRole('button', { name: 'Poser', exact: true }).click();
    await page.waitForTimeout(2500);
  };
}
/**
 * Comme `amenagerGeste`, mais le fantôme part d'une flèche (`fleche` : « Ouest », « Nord »…) : l'ancienne place reste
 * dans la vue, sous le voile.
 */
function amenagerGesteFleche(ile, fleche, ms) {
  return async (page) => {
    await fermerLesBandeaux(page);
    await page.getByRole('button', { name: /^Modifier le plan/ }).click();
    await page.waitForTimeout(500);
    await fermerLesBandeaux(page);
    await page.evaluate((ile) => window.__dysappsAmenager?.({ genre: 'ile', id: ile }), ile);
    await page.waitForTimeout(800);
    await page.getByRole('button', { name: fleche, exact: true }).click();
    await page.waitForTimeout(2500);
    await page.evaluate((ms) => (window.__dysappsGesteA = ms), ms);
    await page.getByRole('button', { name: 'Poser', exact: true }).click();
    await page.waitForTimeout(2500);
  };
}
/** Ouvre le mode « Aménager », choisit `ile` et touche « Réunir » : la question s'ouvre. */
function reunirQuestion(ile) {
  return async (page) => {
    await fermerLesBandeaux(page);
    await page.getByRole('button', { name: /^Modifier le plan/ }).click();
    await page.waitForTimeout(500);
    await fermerLesBandeaux(page);
    await page.evaluate((ile) => window.__dysappsAmenager?.({ genre: 'ile', id: ile }), ile);
    await page.waitForTimeout(800);
    await page.getByRole('button', { name: 'Réunir', exact: true }).click();
    await page.waitForTimeout(800);
  };
}
/** Réunit `ile` à `autre` (la question, puis « Réunir »), ferme le mode, ouvre leur digue, la pose entière et referme son panneau. */
function reunir(ile, autre) {
  const question = reunirQuestion(ile);
  return async (page) => {
    await question(page);
    await page.getByRole('button', { name: /^Réunir avec / }).first().click();
    await page.waitForTimeout(800);
    await page.getByRole('button', { name: 'Valider', exact: true }).click();
    await page.evaluate((id) => (location.hash = `#/adventure/join.${id}`), `${ile}.${autre}`);
    await page.waitForTimeout(1500);
    await page.getByRole('button', { name: /Poser tout ce que j’ai/ }).click();
    await page.waitForTimeout(800);
    // Le panneau fermé : la digue finie, sans le bandeau d'un succès gagné en chemin ; puis la Carte, zoomée sur elle.
    await page.locator('#panneau-reunion .island-sheet-close').click();
    await page.waitForTimeout(800);
    await fermerLesBandeaux(page);
    await page.evaluate(() => (location.hash = '#/adventure/map'));
    await page.waitForTimeout(2500);
    await fermerLesBandeaux(page);
    await zoomerSurLaReunion(page, ile);
  };
}
/** Sur la Carte, zoome à la molette sur la construction qui réunit `ile` à son voisin (calculée depuis la partie). */
async function zoomerSurLaReunion(page, ile) {
  const world = await page.evaluate(() => JSON.parse(localStorage.getItem('dysapps:game')).world);
  const { joinsIn, placeIn } = await load('/src/game/world/arrange.ts');
  const { archipelagoOfIsland } = await load('/src/game/world/archipelagos.ts');
  const j = joinsIn(world, archipelagoOfIsland(ile)).find((x) => x.pair.includes(ile));
  if (!j) throw new Error('aucune réunion à regarder');
  const z = j.shape.zone;
  const centre = { x: (z.x0 + z.x1) / 2, y: (z.y0 + z.y1) / 2, z: Math.max(...j.pair.map((id) => placeIn(world, id).altitude)) };
  await page.evaluate(() => window.__dysappsCamera?.poser());
  for (let i = 0; i < 6; i++) {
    const p = await page.evaluate((c) => window.__dysappsCamera?.ecran(c), centre);
    if (!p) break;
    await page.mouse.move(p.x, p.y);
    await page.mouse.wheel(0, -400);
    await page.waitForTimeout(400);
    await page.evaluate(() => window.__dysappsCamera?.poser());
  }
  await page.waitForTimeout(1500);
}
function openFold(name) {
  return async (page) => {
    await openSheet(page);
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
  await page.clock.setFixedTime(shot.nuit ? NIGHT : DAY);
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
