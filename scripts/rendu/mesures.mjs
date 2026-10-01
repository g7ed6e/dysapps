// Les mesures du rendu du monde (lot R0 de la migration vers Archipéo) : pour chaque archipel tout construit, les appels
// de dessin et les triangles de la vue 3D (lus sur `renderer.info` par le compteur `three/meter.ts`), et le poids de
// Three.js dans le paquet de l'application. `npm run rendu:mesures` ; `npm run rendu:mesures -- --sans-poids` saute le
// build. Chromium en rendu logiciel (SwiftShader) : les appels et les triangles ne dépendent pas de la carte graphique,
// les images par seconde si ; elles se mesurent sur la tablette de référence avec `?mesures` dans l'adresse.
// `--captures <dossier>` enregistre en plus les captures déclarées dans `CAPTURES` (ci-dessous), pour comparer un lot de
// rendu à l'état d'avant ; elles ne sont pas versionnées (la branche `captures` en garde un dossier par lot).
// `--familles nuit,ciel` n'en refait que certaines familles (jour, nuit, personnages, lisibilite, ciel, cadrage, lieux, lieux-pres, lieux-salle, ecoles ; celles d'un lot fusionné sont retirées). `--rendu archipeo` mesure le rendu en construction (le drapeau
// `?rendu=archipeo`, et l'univers Archipéo choisi dans les Réglages pour que les textes le suivent), `--style a|b|c` une option de style de surface (lot R1), `--archipel 6e` un seul archipel,
// `--attente 20` le plus long temps réel laissé au monde pour se construire (en secondes, 10 par défaut). L'horloge de la
// page est pilotée (`preparerLaScene`, scripts/prise-de-vue.mjs) : deux prises du même état donnent la même image, les
// animations au même instant ; les images par seconde du tableau sont donc celles de l'horloge pilotée (8), pas une mesure.
// Sur chaque capture de nuit en 3D, la part des pixels de la scène qui sont « de lueur » (fenêtres, lanternes, et plus
// tard le phare : proches de la lueur `#FFD866`, voir `estUneLueur`) : au plus `LUEUR_MAX` à la vue île (décision du
// directeur artistique, lot R5), affichée dans un second tableau.
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { build, createServer } from 'vite';
import { chromium } from 'playwright-core';
import { capturer, figeable, hasardFixe, piloterLHorloge, preparerLaScene } from '../prise-de-vue.mjs';
import { comparer } from './comparer.mjs';

const root = process.cwd();
const TABLET = { width: 1024, height: 768 };
const kilo = (n) => `${Math.round(n / 1024)} Ko`;
const arg = process.argv.indexOf('--captures');
const SHOTS = arg >= 0 ? process.argv[arg + 1] : null;
const option = (name) => {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : null;
};
/** Avec `--rendu archipeo`, l'univers d'Archipéo est aussi choisi dans les Réglages : sans lui, les textes (défi, bulle, panneaux) restent ceux de Blocland, l'univers par défaut. */
const UNIVERS_DES_TEXTES = option('--rendu') === 'archipeo' ? 'archipeo' : undefined;

/** Le drapeau de rendu et l'option de style, avant le `#` de l'adresse. */
const QUERY = (() => {
  const q = new URLSearchParams();
  if (option('--rendu')) q.set('rendu', option('--rendu'));
  if (option('--style')) q.set('style', option('--style'));
  const s = q.toString();
  return s ? `?${s}` : '';
})();
const ONLY = option('--archipel');
/** Avec `--comparer <dossier>` : les captures de main (mêmes noms), à comparer à celles-ci (scripts/rendu/comparer.mjs). */
const REFERENCES = option('--comparer');
const WAIT = Number(option('--attente') ?? 10) * 1000;
/** Les vues sans monde 3D (le défi, la bulle d'une créature) : rien à attendre avant la prise. */
const VUES_SANS_MONDE = new Set(['défi', 'bulle']);
/** Une heure de jour et une de nuit, pour que le ciel et la lumière soient les mêmes à chaque fois. */
const DAY = new Date('2026-09-28T10:30:00');
const NIGHT = new Date('2026-09-28T22:30:00');

/**
 * Les captures déclarées d'avance (le socle de la piste Rendu, docs/conception/cadrage-archipeo.md §6) : pour chaque
 * archipel tout construit, tout ce que montrent les lots de rendu et la revue d'ensemble du directeur artistique, de près
 * et de loin (une île, l'archipel, la Carte), de jour et de nuit. Ni Contraste élevé ni « Réduire les animations » : ces
 * deux réglages sont retirés et inscrits au plan pour un lot ultérieur (décision du mainteneur, 28/09/2026).
 * Pas de capture en 2D : ni Archipéo ni Blocland n'ont de vue en 2D au choix (décision du mainteneur, 28/09/2026) ; elles
 * reviendront avec un univers dessiné en 2D. Le fichier : `<archipel>-<nom>.jpg`. Les captures de jour sont aussi celles
 * des mesures.
 * Le socle (familles `jour` et `nuit`) est refait par la CI à chaque publication sur main, pour servir de référence
 * (`--comparer`). Un lot y ajoute sa famille s'il lui en faut une, et la retire une fois fusionné (décision du
 * mainteneur, 01/10/2026, sur l'avis du directeur artistique) : la liste ne garde que le socle, les familles communes
 * (personnages, lisibilite) et celles des lots en cours.
 */
const CAPTURES = [
  { nom: 'ile', vue: 'île', famille: 'jour' },
  { nom: 'archipel', vue: 'archipel', famille: 'jour' },
  { nom: 'carte', vue: 'carte', famille: 'jour' },
  { nom: 'ile-nuit', vue: 'île', famille: 'nuit', nuit: true },
  { nom: 'archipel-nuit', vue: 'archipel', famille: 'nuit', nuit: true },
  { nom: 'carte-nuit', vue: 'carte', famille: 'nuit', nuit: true },
  // La lisibilité (famille `lisibilite`), à reprendre par tout lot qui touche l'interface ou une créature : le texte le
  // plus grand (OpenDyslexic, 32 px, `reglages`) sur la vue de l'archipel du 3e depuis le Refuge, en tablette et en
  // portrait ; le test en gris des créatures, chacune dans son archipel (l'Écho du 3e ; le Soleil et Muscade du 4e ; le
  // Hanneton et Moustache du 6e), pris en couleur : la mise en gris se fait à la relecture.
  { nom: 'grand-texte-archipel', vue: 'archipel', famille: 'lisibilite', ile: 'refuge', reglages: { font: 'opendyslexic', fontSize: 32 } },
  { nom: 'grand-texte-archipel-800x1280', vue: 'archipel', famille: 'lisibilite', ile: 'refuge', reglages: { font: 'opendyslexic', fontSize: 32 }, taille: { width: 800, height: 1280 } },
  { nom: 'gris-echo', vue: 'défi', famille: 'lisibilite', ile: 'studio' },
  { nom: 'gris-soleil', vue: 'défi', famille: 'lisibilite', ile: 'jardin' },
  { nom: 'gris-muscade', vue: 'île', famille: 'lisibilite', ile: 'jardin' },
  { nom: 'gris-hanneton', vue: 'défi', famille: 'lisibilite', ile: 'plaine' },
  { nom: 'gris-moustache', vue: 'île', famille: 'lisibilite', ile: 'manoir' },
  // Les personnages hors du monde (lot R6) : chaque Gardien au défi, éteint, en 3D (`parIle` : un fichier par île,
  // `<archipel>-defi-<île>.jpg`) et en SVG (la vue « liste », sans la 3D) ; la bulle d'une créature (le défi pas encore ouvert : la partie
  // sans étoiles), en 3D et en SVG.
  { nom: 'defi', vue: 'défi', famille: 'personnages', parIle: true },
  { nom: 'defi-svg', vue: 'défi', famille: 'personnages', view: 'liste' },
  { nom: 'bulle', vue: 'bulle', famille: 'personnages', sansEtoiles: true },
  { nom: 'bulle-svg', vue: 'bulle', famille: 'personnages', view: 'liste', sansEtoiles: true },
  // Les repères des Îles du Ciel (R4b-3e) : le grand phare sur son socle, de jour et de nuit, les gradins de
  // l'Observatoire des textes.
  { nom: 'phare-du-ciel', vue: 'île', famille: 'ciel', ile: 'phare' },
  { nom: 'phare-du-ciel-nuit', vue: 'île', famille: 'ciel', ile: 'phare', nuit: true },
  { nom: 'textes', vue: 'île', famille: 'ciel', ile: 'textes' },
  // La vue de l'archipel depuis l'île du Phare : le phare au centre de l'arc, devant le massif (une vue de l'archipel
  // avec `ile` y place le bonhomme).
  { nom: 'archipel-phare', vue: 'archipel', famille: 'ciel', ile: 'phare' },
  { nom: 'archipel-phare-nuit', vue: 'archipel', famille: 'ciel', ile: 'phare', nuit: true },
  // La vue de l'archipel depuis les deux Observatoires, voisins du Phare : le cadrage qui garde le grand phare en vue
  // (DA-17) vaut aussi pour elles.
  { nom: 'archipel-donnees', vue: 'archipel', famille: 'cadrage', ile: 'donnees' },
  { nom: 'archipel-donnees-nuit', vue: 'archipel', famille: 'cadrage', ile: 'donnees', nuit: true },
  { nom: 'archipel-textes', vue: 'archipel', famille: 'cadrage', ile: 'textes' },
  { nom: 'archipel-textes-nuit', vue: 'archipel', famille: 'cadrage', ile: 'textes', nuit: true },
  // L'assemblage des blocs (GD-2) : le lieu où l'on assemble, sur l'île de l'école (la Fabrique ou la Halle aux
  // matériaux, selon le rendu), et les blocs assemblés sur les monuments de chaque archipel, de près (`finesse` 2).
  { nom: 'assemblage-ile', vue: 'île', famille: 'assemblage', ile: 'foret', finesse: 2 },
  { nom: 'assemblage-observatoire', vue: 'île', famille: 'assemblage', ile: 'foret', lieu: 'monument-observatoire', finesse: 2 },
  { nom: 'assemblage-moulin', vue: 'île', famille: 'assemblage', ile: 'foret', lieu: 'monument-moulin', finesse: 2 },
  // Le lieu de près (recadré sur la halle, derrière la salle des trophées), et son panneau ouvert, aux réglages par
  // défaut puis en OpenDyslexic 32 px, avec des blocs en poche (`inventaire`) : la poutre s'assemble, le vitrail non.
  { nom: 'assemblage-lieu', vue: 'île', famille: 'assemblage', ile: 'foret', recadre: { x: 110, y: 150, width: 340, height: 250 }, finesse: 2 },
  { nom: 'assemblage-lieu-nuit', vue: 'île', famille: 'assemblage', ile: 'foret', nuit: true, recadre: { x: 110, y: 150, width: 340, height: 250 }, finesse: 2 },
  { nom: 'assemblage-panneau', vue: 'île', famille: 'assemblage', ile: 'foret', lieu: 'assemblage', inventaire: { bois: 5, pierre: 3, glace: 2 } },
  {
    nom: 'assemblage-panneau-od32',
    vue: 'île',
    famille: 'assemblage',
    ile: 'foret',
    lieu: 'assemblage',
    inventaire: { bois: 5, pierre: 3, glace: 2 },
    reglages: { font: 'opendyslexic', fontSize: 32 },
  },
  // Les mêmes, en hauteur, pour voir les deux cartes (« Assembler » actif, puis grisé) sans faire défiler.
  { nom: 'assemblage-panneau-haut', vue: 'île', famille: 'assemblage-panneau', ile: 'foret', lieu: 'assemblage', inventaire: { bois: 5, pierre: 3, glace: 2 }, taille: { width: 1024, height: 1700 } },
  {
    nom: 'assemblage-panneau-od32-haut',
    vue: 'île',
    famille: 'assemblage-panneau',
    ile: 'foret',
    lieu: 'assemblage',
    inventaire: { bois: 5, pierre: 3, glace: 2 },
    reglages: { font: 'opendyslexic', fontSize: 32 },
    taille: { width: 1024, height: 3000 },
  },
  { nom: 'assemblage-ile', vue: 'île', famille: 'assemblage', ile: 'marche', finesse: 2 },
  { nom: 'assemblage-kiosque', vue: 'île', famille: 'assemblage', ile: 'marche', lieu: 'monument-kiosque', finesse: 2 },
  { nom: 'assemblage-phare-large', vue: 'île', famille: 'assemblage', ile: 'glacier', lieu: 'monument-phare-large', finesse: 2 },
  { nom: 'assemblage-amphitheatre', vue: 'île', famille: 'assemblage', ile: 'atelier', lieu: 'monument-amphitheatre', finesse: 2 },
  { nom: 'assemblage-ile', vue: 'île', famille: 'assemblage', ile: 'atelier', finesse: 2 },
  { nom: 'assemblage-viaduc', vue: 'île', famille: 'assemblage', ile: 'atelier', lieu: 'monument-viaduc', finesse: 2 },
  { nom: 'assemblage-ile', vue: 'île', famille: 'assemblage', ile: 'phare', finesse: 2 },
  { nom: 'assemblage-etoiles', vue: 'île', famille: 'assemblage', ile: 'phare', lieu: 'monument-etoiles', finesse: 2 },
  // L'école et la salle des trophées des Premiers Rivages (lot 7b, les lieux du village) : la vue de la Forêt, sans
  // trophée et avec tous (`succes` : le nombre de succès gagnés, `tous` pour tous, un trophée chacun), de jour et de
  // nuit ; de près, recadrées (`finesse` 3 : le colombage net) ; de loin, la vue de l'archipel.
  { nom: 'lieux', vue: 'île', famille: 'lieux', ile: 'foret', succes: 'tous' },
  { nom: 'lieux-nuit', vue: 'île', famille: 'lieux', ile: 'foret', succes: 'tous', nuit: true },
  { nom: 'lieux-sans-trophee', vue: 'île', famille: 'lieux', ile: 'foret' },
  { nom: 'lieux-archipel', vue: 'archipel', famille: 'lieux', ile: 'foret', succes: 'tous' },
  { nom: 'lieux-archipel-nuit', vue: 'archipel', famille: 'lieux', ile: 'foret', succes: 'tous', nuit: true },
  // De près (famille `lieux-pres`) : l'école, puis la salle des trophées avec six trophées (les socles) et avec tous (les
  // socles, le faîte et le bord du toit), de jour et de nuit.
  { nom: 'lieux-ecole-pres', vue: 'île', famille: 'lieux-pres', ile: 'foret', recadre: { x: 130, y: 390, width: 240, height: 210 }, finesse: 3 },
  { nom: 'lieux-ecole-pres-nuit', vue: 'île', famille: 'lieux-pres', ile: 'foret', nuit: true, recadre: { x: 130, y: 390, width: 240, height: 210 }, finesse: 3 },
  { nom: 'lieux-trophees-six', vue: 'île', famille: 'lieux-pres', ile: 'foret', succes: 6, recadre: { x: 170, y: 250, width: 200, height: 175 }, finesse: 3 },
  { nom: 'lieux-trophees-six-nuit', vue: 'île', famille: 'lieux-pres', ile: 'foret', succes: 6, nuit: true, recadre: { x: 170, y: 250, width: 200, height: 175 }, finesse: 3 },
  { nom: 'lieux-trophees-tous', vue: 'île', famille: 'lieux-pres', ile: 'foret', succes: 'tous', recadre: { x: 170, y: 250, width: 200, height: 175 }, finesse: 3 },
  { nom: 'lieux-trophees-tous-nuit', vue: 'île', famille: 'lieux-pres', ile: 'foret', succes: 'tous', nuit: true, recadre: { x: 170, y: 250, width: 200, height: 175 }, finesse: 3 },
  // La salle de près (famille `lieux-salle`) : sans trophée (l'ouverture devant, le fond de velours), avec huit (le
  // faîte), avec dix-huit (le bord du toit), de jour et de nuit ; le fond de velours au plus près, par l'ouverture (la
  // caméra de l'île ne se tourne pas : on le voit de biais), avec deux trophées.
  { nom: 'lieux-trophees-vide', vue: 'île', famille: 'lieux-salle', ile: 'foret', recadre: { x: 170, y: 250, width: 200, height: 175 }, finesse: 3 },
  { nom: 'lieux-trophees-vide-nuit', vue: 'île', famille: 'lieux-salle', ile: 'foret', nuit: true, recadre: { x: 170, y: 250, width: 200, height: 175 }, finesse: 3 },
  { nom: 'lieux-trophees-huit', vue: 'île', famille: 'lieux-salle', ile: 'foret', succes: 8, recadre: { x: 170, y: 250, width: 200, height: 175 }, finesse: 3 },
  { nom: 'lieux-trophees-dix-huit', vue: 'île', famille: 'lieux-salle', ile: 'foret', succes: 18, recadre: { x: 170, y: 250, width: 200, height: 175 }, finesse: 3 },
  { nom: 'lieux-trophees-dix-huit-nuit', vue: 'île', famille: 'lieux-salle', ile: 'foret', succes: 18, nuit: true, recadre: { x: 170, y: 250, width: 200, height: 175 }, finesse: 3 },
  { nom: 'lieux-velours', vue: 'île', famille: 'lieux-salle', ile: 'foret', succes: 2, recadre: { x: 225, y: 285, width: 130, height: 110 }, finesse: 4 },
  { nom: 'lieux-velours-nuit', vue: 'île', famille: 'lieux-salle', ile: 'foret', succes: 2, nuit: true, recadre: { x: 225, y: 285, width: 130, height: 110 }, finesse: 4 },
  // Les îles-écoles au cœur de 20 × 20 (famille `ecoles`) : la vue de l'île de chacune, de jour, en tablette, puis en
  // téléphone portrait (390 × 844), pour juger le cadrage, les marges et l'îlot du Gardien (relectures du 01/10/2026).
  ...['marche', 'atelier', 'phare', 'foret'].flatMap((ile) => [
    { nom: `ecole-${ile}`, vue: 'île', famille: 'ecoles', ile },
    { nom: `ecole-${ile}-390x844`, vue: 'île', famille: 'ecoles', ile, taille: { width: 390, height: 844 } },
  ]),
];
/** La lueur la nuit, à la vue île : au plus 3 % de la scène. */
const LUEUR_MAX = 0.03;
/**
 * Un pixel de lueur : un jaune chaud et clair, proche de `#FFD866` (world/construction.ts, `LUEUR`), que la brume peut
 * un peu voiler. Le compte se fait dans une page vide, sur la capture de la scène seule (sans les panneaux).
 */
const estUneLueur = '(r, g, b) => r >= 220 && g >= 170 && b <= 170 && r - b >= 90';
async function partDeLueur(outil, png) {
  return outil.evaluate(
    async ({ b64, test }) => {
      const img = new Image();
      img.src = `data:image/png;base64,${b64}`;
      await img.decode();
      const c = document.createElement('canvas');
      c.width = img.width;
      c.height = img.height;
      const g = c.getContext('2d');
      g.drawImage(img, 0, 0);
      const d = g.getImageData(0, 0, c.width, c.height).data;
      const lueur = new Function(`return ${test}`)();
      let n = 0;
      for (let i = 0; i < d.length; i += 4) if (lueur(d[i], d[i + 1], d[i + 2])) n++;
      return n / (c.width * c.height);
    },
    { b64: png.toString('base64'), test: estUneLueur },
  );
}

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

/**
 * Une partie sans les îles `iles` : ni leurs étoiles, ni leurs plans (clés « <île>-… »). Sans elles, le jeu ne rouvre pas
 * l'île au chargement (`sansPonts` peut alors retirer le pont qui y mène : une île où l'on a joué reste ouverte).
 */
function sansLesIles(parCle, iles) {
  if (!iles?.length) return parCle;
  return Object.fromEntries(Object.entries(parCle).filter(([k]) => !iles.some((i) => k.startsWith(`${i}-`))));
}

/**
 * L'adresse d'une capture déclarée : le défi de chaque île (`parIle`), la vue d'un monument (`lieu`), une île ou le défi
 * de son Gardien (`ile`), sinon la route de la vue, le bonhomme là où la partie le pose (`routes`).
 */
function routeDe(c, parIle, routes) {
  if (parIle) return `/aventure/${parIle}/gardien`;
  if (c.lieu) return `/aventure/${c.lieu}`;
  if (c.ile && c.vue === 'île') return `/aventure/${c.ile}`;
  if (c.ile && (c.vue === 'défi' || c.vue === 'bulle')) return `/aventure/${c.ile}/gardien`;
  return routes[c.vue];
}

/** Une partie où le Gardien de l'île `ile` n'est pas encore vaincu (sa clé « <île>-gardien » retirée) : il est debout. */
function sansLeGardien(parCle, ile) {
  if (!ile) return parCle;
  return Object.fromEntries(Object.entries(parCle).filter(([k]) => k !== `${ile}-gardien`));
}

async function scenes() {
  // Le build a passé le processus en production : le compteur ne s'exposerait pas (import.meta.env.DEV).
  process.env.NODE_ENV = 'development';
  const server = await createServer({ root, logLevel: 'error', server: { port: 5288, strictPort: false, hmr: false } });
  await server.listen();
  const base = server.resolvedUrls.local[0].replace(/\/$/, '');
  const load = (p) => server.ssrLoadModule(p);
  const [{ BIOMES }, { ARCHIPELAGO_IDS }, { toutConstruit }, { plansFor, planCells }, { BADGES }] = await Promise.all([
    load('/src/blocland/biomes.ts'),
    load('/src/blocland/world/map.ts'),
    load('/src/blocland/world/budget.ts'),
    load('/src/blocland/world/plans.ts'),
    load('/src/core/progress.ts'),
  ]);
  /** Les succès gagnés d'une capture (`succes` : leur nombre, ou `tous`), un trophée chacun dans la salle des trophées. */
  const succesDe = (n) => Object.fromEntries(BADGES.slice(0, n === 'tous' ? BADGES.length : (n ?? 0)).map((b) => [b.id, '2026-09-28T10:00:00.000Z']));
  // La même partie tout construite que le test du budget (world/budget.test.ts).
  const { progress, village: built } = toutConstruit();
  /** Les plans d'une partie changée (voir `CAPTURES`, `partie`). */
  const plansDe = (partie, ile) => {
    const plans = { ...built.plans };
    // Avant : aucun plan de l'île posé.
    if (partie === 'avant') for (const p of plansFor(ile)) delete plans[p.id];
    if (partie === 'chantier')
      for (const b of BIOMES) {
        const l = plansFor(b.id);
        if (l.length) delete plans[l[l.length - 1].id];
      }
    // Sur chaque île : les plans d'avant posés, la moitié de celui-ci (0 : les murs, 1 : le toit), rien après.
    const moitie = { 'murs-mi': 0, 'toit-mi': 1 }[partie];
    if (moitie !== undefined)
      for (const b of BIOMES) {
        const l = plansFor(b.id);
        if (l.length <= moitie) continue;
        l.forEach((p, i) => {
          if (i >= moitie) delete plans[p.id];
        });
        const cells = planCells(l[moitie]).map((c) => c.key);
        plans[l[moitie].id] = cells.filter((_, i) => i % 2 === 0);
      }
    if (partie === 'tour-avant' || partie === 'tour-debut' || partie === 'tour-mi') {
      const l = plansFor('tour');
      // Avant : aucun plan posé ; au début : la moitié du premier (les murs) ; pendant : le premier posé, la moitié du
      // deuxième (le toit).
      const faits = partie === 'tour-mi' ? 1 : 0;
      l.forEach((p, i) => {
        if (i >= faits) delete plans[p.id];
      });
      if (faits < l.length && partie !== 'tour-avant') {
        const cells = planCells(l[faits]).map((c) => c.key);
        plans[l[faits].id] = cells.slice(0, Math.floor(cells.length / 2));
      }
    }
    return plans;
  };

  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || undefined,
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
  });
  if (SHOTS) mkdirSync(SHOTS, { recursive: true });
  // Une page vide, pour compter les pixels de lueur des captures de nuit.
  const outil = await browser.newPage();
  const rows = [];
  for (const a of ARCHIPELAGO_IDS.filter((id) => !ONLY || id === ONLY)) {
    const at = BIOMES.find((b) => b.classe === a).id;
    const routes = { île: `/aventure/${at}`, archipel: '/aventure', carte: '/aventure/carte', défi: `/aventure/${at}/gardien`, bulle: `/aventure/${at}/gardien` };
    const iles = BIOMES.filter((b) => b.classe === a).map((b) => b.id);
    const classe = (id) => BIOMES.find((b) => b.id === id).classe;
    // Les mesures : les trois vues de jour en 3D. Avec `--captures`, toutes les captures déclarées (voir `CAPTURES`).
    const views = [
      ...['île', 'archipel', 'carte'].map((vue) => ({ vue, go: routes[vue], mesure: true, nom: CAPTURES.find((c) => c.vue === vue && c.famille === 'jour').nom })),
      ...(SHOTS
        ? CAPTURES.filter((c) => c.famille !== 'jour' && (!FAMILLES || FAMILLES.includes(c.famille)) && (!c.ile || classe(c.ile) === a)).flatMap((c) =>
            (c.parIle ? iles : [null]).map((parIle) => ({
              vue: c.vue,
              go: routeDe(c, parIle, routes),
              ile: c.ile,
              plans: c.partie ? plansDe(c.partie, c.ile) : null,
              bridges: c.sansPonts ? built.bridges.filter((id) => !c.sansPonts.includes(id)) : null,
              time: c.nuit ? NIGHT : DAY,
              view: c.view,
              sansEtoiles: c.sansEtoiles,
              lv2: c.lv2,
              taille: c.taille,
              recadre: c.recadre,
              sansIles: c.sansIles,
              debout: c.debout,
              reglages: c.reglages,
              inventaire: c.inventaire,
              depuis: c.depuis,
              fige: c.fige,
              succes: c.succes,
              finesse: c.finesse,
              nom: parIle ? `${c.nom}-${parIle}` : c.nom,
            })),
          )
        : []),
    ];
    for (const { vue, go, time = DAY, view = '3d', sansEtoiles, nom, mesure, ile, plans, bridges, lv2, taille, recadre, sansIles, depuis, fige, finesse, debout, reglages, succes, inventaire } of views) {
      const page = await browser.newPage({ viewport: taille ?? TABLET, deviceScaleFactor: finesse ?? (recadre ? 1.5 : 1), ...(fige ? { reducedMotion: 'reduce' } : {}) });
      await piloterLHorloge(page, time);
      await page.addInitScript(hasardFixe);
      await page.addInitScript(figeable);
      await page.goto(`${base}/icon.svg`);
      await page.evaluate(
        ({ village, progress, view, univers, lv2, reglages, badges, inventaire }) => {
          localStorage.clear();
          sessionStorage.setItem('dysapps:titre-vu', '1');
          localStorage.setItem('dysapps:settings', JSON.stringify({ worldView: view, ...(univers ? { univers } : {}), ...(lv2 ? { lv2 } : {}), ...(reglages ?? {}) }));
          localStorage.setItem('dysapps:tutos', JSON.stringify({ 'village-immersif': true, 'archipel-5e': true, 'archipel-4e': true, 'archipel-3e': true }));
          localStorage.setItem('dysapps:noms-archipels', JSON.stringify({ dit: true }));
          localStorage.setItem('dysapps:blocland', JSON.stringify({ inventory: inventaire ?? {}, progress, village }));
          localStorage.setItem('dysapps:progress', JSON.stringify({ xp: 20000, badges }));
        },
        {
          village: { ...built, plans: sansLesIles(plans ?? built.plans, sansIles), ...(bridges ? { bridges } : {}), at: depuis ?? ile ?? at },
          progress: sansEtoiles ? {} : sansLeGardien(sansLesIles(progress, sansIles), debout),
          view,
          univers: UNIVERS_DES_TEXTES,
          lv2,
          reglages,
          inventaire,
          badges: succesDe(succes),
        },
      );
      await page.goto(`${base}/${QUERY}#${go}`);
      const file = SHOTS && join(SHOTS, `${a}-${nom}.jpg`);
      if (!mesure) {
        // Les autres captures (nuit, personnages, chantier, ponts) : pas de mesure, seulement l'image.
        await preparerLaScene(page, VUES_SANS_MONDE.has(vue) ? 0 : WAIT);
        await capturer(page, { path: file, type: 'jpeg', quality: 85, timeout: 90000, ...(recadre ? { clip: recadre } : {}) });
        if (time === NIGHT && view === '3d') {
          // La part de lueur, sur la scène seule (le canvas, sans les panneaux ni les boutons autour) : les boutons posés
          // sur la scène (le lieu choisi, jaune) sont masqués le temps de la prise, sinon ils compteraient comme lueur.
          // Depuis ce masquage, la part de lueur des archipels déjà mesurés baisse un peu : le bouton n'y compte plus.
          await page.addStyleTag({ content: 'body * { visibility: hidden !important } .voxel-canvas canvas { visibility: visible !important }' });
          const box = await page.locator('.voxel-canvas').boundingBox();
          const png = box && (await capturer(page, { type: 'png', clip: box, timeout: 90000 }));
          if (png) lueurs.push({ archipel: a, nom, vue, part: await partDeLueur(outil, png) });
        }
        await page.close();
        continue;
      }
      try {
        // Le monde se construit en quelques secondes (rendu logiciel) ; l'horloge pilotée le fait avancer pas à pas.
        if (!(await preparerLaScene(page, WAIT))) throw new Error(`aucun monde 3D en ${WAIT / 1000} s`);
        const s = await page.evaluate(() => ({ ...window.__dysappsRendu }));
        if (!s.calls) throw new Error('aucune image dessinée');
        rows.push({ archipel: a, vue, ...s });
        if (file) await capturer(page, { path: file, type: 'jpeg', quality: 85, timeout: 90000 });
      } catch (e) {
        rows.push({ archipel: a, vue, erreur: e.message.split('\n')[0] });
      }
      await page.close();
    }
  }
  if (SHOTS && REFERENCES) {
    const { changees, inchangees, sansAvant } = await comparer(outil, REFERENCES, SHOTS);
    console.log(`\nComparaison avec ${REFERENCES} : ${changees.length} changées (planches dans ${join(SHOTS, 'planches')}), ${inchangees.length} inchangées, ${sansAvant.length} sans référence ; détail dans ${join(SHOTS, 'comparaison.md')}.`);
  }
  await browser.close();
  await server.close();
  return rows;
}

/** Les parts de lueur des captures de nuit en 3D. */
const lueurs = [];

// Le build d'abord : le serveur de développement le passerait en mode développement.
const js = process.argv.includes('--sans-poids') ? null : await weights();
const rows = await scenes();
console.log('\n| Archipel | Vue | Appels de dessin | Triangles | Géométries | Textures | Images/s (horloge pilotée, non mesuré) |');
console.log('| --- | --- | ---: | ---: | ---: | ---: | ---: |');
for (const r of rows) {
  if (r.erreur) console.log(`| ${r.archipel} | ${r.vue} | ${r.erreur} | | | | |`);
  else console.log(`| ${r.archipel} | ${r.vue} | ${r.calls} | ${r.triangles.toLocaleString('fr-FR')} | ${r.geometries} | ${r.textures} | ${r.fps} |`);
}
if (lueurs.length) {
  console.log(`\n| Archipel | Capture de nuit | Part de lueur | Vue île : au plus ${LUEUR_MAX * 100} % |`);
  console.log('| --- | --- | ---: | --- |');
  for (const l of lueurs)
    console.log(`| ${l.archipel} | ${l.nom} | ${(l.part * 100).toFixed(2).replace('.', ',')} % | ${l.vue === 'île' ? (l.part <= LUEUR_MAX ? 'oui' : 'NON') : ''} |`);
}
if (js) {
  console.log('\n| Fichier | Poids | Compressé (gzip) | Three.js |');
  console.log('| --- | ---: | ---: | --- |');
  for (const f of js.slice(0, 6)) console.log(`| ${f.file} | ${kilo(f.raw)} | ${kilo(f.gzip)} | ${f.three ? 'oui' : ''} |`);
}
// 1 : une vue en erreur ; 2 : seulement une lueur de nuit au-dessus du plafond (la CI des références garde alors ses captures).
process.exit(rows.some((r) => r.erreur) ? 1 : lueurs.some((l) => l.vue === 'île' && l.part > LUEUR_MAX) ? 2 : 0);
