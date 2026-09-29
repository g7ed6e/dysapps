// Les mesures du rendu du monde (lot R0 de la migration vers Archipéo) : pour chaque archipel tout construit, les appels
// de dessin et les triangles de la vue 3D (lus sur `renderer.info` par le compteur `three/meter.ts`), et le poids de
// Three.js dans le paquet de l'application. `npm run rendu:mesures` ; `npm run rendu:mesures -- --sans-poids` saute le
// build. Chromium en rendu logiciel (SwiftShader) : les appels et les triangles ne dépendent pas de la carte graphique,
// les images par seconde si ; elles se mesurent sur la tablette de référence avec `?mesures` dans l'adresse.
// `--captures <dossier>` enregistre en plus les captures déclarées dans `CAPTURES` (ci-dessous), pour comparer un lot de
// rendu à l'état d'avant ; elles ne sont pas versionnées (la branche `captures` en garde un dossier par lot).
// `--familles nuit,chantier` n'en refait que certaines familles (jour, nuit, personnages, chantier, ponts, brumeuses, relais, jardin, jardin-pres, revue, ciel). `--rendu archipeo` mesure le rendu en construction (le drapeau
// `?rendu=archipeo`, et l'univers Archipéo choisi dans les Réglages pour que les textes le suivent), `--style a|b|c` une option de style de surface (lot R1), `--archipel 6e` un seul archipel,
// `--attente 20` le temps laissé à la scène avant la mesure (en secondes, 10 par défaut : en rendu logiciel, une scène
// plus lente à dessiner met plus longtemps à rejoindre son cadrage, la Carte surtout).
// Sur chaque capture de nuit en 3D, la part des pixels de la scène qui sont « de lueur » (fenêtres, lanternes, et plus
// tard le phare : proches de la lueur `#FFD866`, voir `estUneLueur`) : au plus `LUEUR_MAX` à la vue île (décision du
// directeur artistique, lot R5), affichée dans un second tableau.
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { build, createServer } from 'vite';
import { chromium } from 'playwright-core';
import { capturer, figeable } from '../prise-de-vue.mjs';

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
const WAIT = Number(option('--attente') ?? 10) * 1000;
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
 * Un lot ne change pas cette liste : il refait les captures et les montre toutes.
 */
const CAPTURES = [
  { nom: 'ile', vue: 'île', famille: 'jour' },
  { nom: 'archipel', vue: 'archipel', famille: 'jour' },
  { nom: 'carte', vue: 'carte', famille: 'jour' },
  { nom: 'ile-nuit', vue: 'île', famille: 'nuit', nuit: true },
  { nom: 'archipel-nuit', vue: 'archipel', famille: 'nuit', nuit: true },
  { nom: 'carte-nuit', vue: 'carte', famille: 'nuit', nuit: true },
  // Les personnages hors du monde (lot R6) : chaque Gardien au défi, éteint, en 3D (`parIle` : un fichier par île,
  // `<archipel>-defi-<île>.jpg`) et en SVG (la vue « liste », sans la 3D) ; la bulle d'une créature (le défi pas encore ouvert : la partie
  // sans étoiles), en 3D et en SVG.
  { nom: 'defi', vue: 'défi', famille: 'personnages', parIle: true },
  { nom: 'defi-svg', vue: 'défi', famille: 'personnages', view: 'liste' },
  { nom: 'bulle', vue: 'bulle', famille: 'personnages', sansEtoiles: true },
  { nom: 'bulle-svg', vue: 'bulle', famille: 'personnages', view: 'liste', sansEtoiles: true },
  // La construction (lot R5) : un chantier (le dernier plan de chaque île en fantômes), de jour et de nuit ; le phare
  // des Premiers Rivages avant, pendant et après ses plans ; l'atelier du 4e, le phare du 3e. `ile` : la capture ne se fait que dans l'archipel de cette île ; `partie` : la partie tout construite, changée.
  { nom: 'chantier', vue: 'île', famille: 'chantier', partie: 'chantier' },
  { nom: 'chantier-nuit', vue: 'île', famille: 'chantier', partie: 'chantier', nuit: true },
  { nom: 'tour-avant', vue: 'île', famille: 'chantier', ile: 'tour', partie: 'tour-avant' },
  { nom: 'tour-debut', vue: 'île', famille: 'chantier', ile: 'tour', partie: 'tour-debut' },
  { nom: 'tour-mi', vue: 'île', famille: 'chantier', ile: 'tour', partie: 'tour-mi' },
  { nom: 'tour-apres', vue: 'île', famille: 'chantier', ile: 'tour' },
  { nom: 'tour-nuit', vue: 'île', famille: 'chantier', ile: 'tour', nuit: true },
  { nom: 'atelier', vue: 'île', famille: 'chantier', ile: 'atelier' },
  { nom: 'atelier-nuit', vue: 'île', famille: 'chantier', ile: 'atelier', nuit: true },
  { nom: 'phare', vue: 'île', famille: 'chantier', ile: 'phare' },
  { nom: 'phare-avant', vue: 'île', famille: 'chantier', ile: 'phare', partie: 'avant' },
  { nom: 'theatre', vue: 'île', famille: 'chantier', ile: 'theatre' },
  { nom: 'comptoir', vue: 'île', famille: 'chantier', ile: 'comptoir' },
  // Les ponts de pierre et de bois du 5e : construits autour du Manoir ; à restaurer autour du Comptoir (Marché–Comptoir
  // en entier, et Marché–Marais, le plus long, en haut à gauche).
  { nom: 'ponts', vue: 'île', famille: 'ponts', ile: 'manoir' },
  { nom: 'ponts-avant', vue: 'île', famille: 'ponts', ile: 'comptoir', sansPonts: ['marche-comptoir', 'marche-marais'] },
  { nom: 'ponts-apres', vue: 'île', famille: 'ponts', ile: 'comptoir' },
  { nom: 'ponts-nuit', vue: 'île', famille: 'ponts', ile: 'manoir', nuit: true },
  // Les repères des Îles Brumeuses (R4b-5e) : la tour d'archives du Marais, de jour et de nuit, la tour en ruine du
  // Carrefour, les crêtes et la calotte du Glacier.
  { nom: 'marais', vue: 'île', famille: 'brumeuses', ile: 'marais' },
  { nom: 'marais-nuit', vue: 'île', famille: 'brumeuses', ile: 'marais', nuit: true },
  { nom: 'carrefour', vue: 'île', famille: 'brumeuses', ile: 'carrefour' },
  { nom: 'glacier', vue: 'île', famille: 'brumeuses', ile: 'glacier' },
  // Le Relais des voyageurs (LV2, 5e) : l'île et son pont depuis le Comptoir, de jour et de nuit ; son chantier (le
  // dernier plan, la fontaine, en fantômes) ; le pont à construire (le Relais pas encore ouvert).
  { nom: 'relais', vue: 'île', famille: 'relais', ile: 'relais' },
  { nom: 'relais-nuit', vue: 'île', famille: 'relais', ile: 'relais', nuit: true },
  { nom: 'relais-chantier', vue: 'île', famille: 'relais', ile: 'relais', partie: 'chantier' },
  { nom: 'relais-pont-avant', vue: 'île', famille: 'relais', ile: 'comptoir', sansPonts: ['comptoir-relais'] },
  // Le Jardin des heures (LV2, 4e) : l'archipel élargi, avec une LV2 et avec « Pas de LV2 » (le Jardin fermé, sans
  // pont), le bonhomme sur le Théâtre, son voisin, en tablette paysage, en 1280 × 800 et en portrait (`taille`, `lv2`) ;
  // l'île de jour et de nuit ; son Gardien au défi (le Soleil de cuivre).
  { nom: 'jardin-archipel', vue: 'archipel', famille: 'jardin', ile: 'theatre' },
  { nom: 'jardin-archipel-sans-lv2', vue: 'archipel', famille: 'jardin', ile: 'theatre', lv2: 'aucune', sansPonts: ['theatre-jardin'], sansIles: ['jardin'] },
  { nom: 'jardin-archipel-1280x800', vue: 'archipel', famille: 'jardin', ile: 'theatre', taille: { width: 1280, height: 800 } },
  { nom: 'jardin-archipel-sans-lv2-1280x800', vue: 'archipel', famille: 'jardin', ile: 'theatre', lv2: 'aucune', sansPonts: ['theatre-jardin'], sansIles: ['jardin'], taille: { width: 1280, height: 800 } },
  { nom: 'jardin-archipel-800x1280', vue: 'archipel', famille: 'jardin', ile: 'theatre', taille: { width: 800, height: 1280 } },
  { nom: 'jardin-archipel-sans-lv2-800x1280', vue: 'archipel', famille: 'jardin', ile: 'theatre', lv2: 'aucune', sansPonts: ['theatre-jardin'], sansIles: ['jardin'], taille: { width: 800, height: 1280 } },
  // (Depuis le Jardin, le bonhomme sur son île : son étiquette et celle du Théâtre, côte à côte.)
  { nom: 'jardin-archipel-depuis-le-jardin', vue: 'archipel', famille: 'jardin', ile: 'jardin' },
  { nom: 'jardin-archipel-depuis-le-jardin-1280x800', vue: 'archipel', famille: 'jardin', ile: 'jardin', taille: { width: 1280, height: 800 } },
  { nom: 'jardin-archipel-depuis-le-jardin-800x1280', vue: 'archipel', famille: 'jardin', ile: 'jardin', taille: { width: 800, height: 1280 } },
  // (Et avec « Pas de LV2 », le Jardin fermé, sans pont : sa vue d'île, le bonhomme resté sur le Théâtre, `depuis`.)
  { nom: 'jardin-sans-lv2', vue: 'île', famille: 'jardin', ile: 'jardin', depuis: 'theatre', lv2: 'aucune', sansPonts: ['theatre-jardin'], sansIles: ['jardin'] },
  { nom: 'jardin-sans-lv2-1280x800', vue: 'île', famille: 'jardin', ile: 'jardin', depuis: 'theatre', lv2: 'aucune', sansPonts: ['theatre-jardin'], sansIles: ['jardin'], taille: { width: 1280, height: 800 } },
  { nom: 'jardin-sans-lv2-800x1280', vue: 'île', famille: 'jardin', ile: 'jardin', depuis: 'theatre', lv2: 'aucune', sansPonts: ['theatre-jardin'], sansIles: ['jardin'], taille: { width: 800, height: 1280 } },
  { nom: 'jardin', vue: 'île', famille: 'jardin', ile: 'jardin' },
  { nom: 'jardin-nuit', vue: 'île', famille: 'jardin', ile: 'jardin', nuit: true },
  { nom: 'jardin-defi', vue: 'défi', famille: 'jardin', ile: 'jardin' },
  // De près (famille `jardin-pres` ; `recadre` : la vue prise une fois et demie plus fine, ou `finesse` fois, puis recadrée, en pixels CSS) : Muscade dans la vue de son île,
  // et sa bulle (le défi pas encore ouvert) ; le ponton et son échelle, depuis l'archipel vu du Jardin.
  { nom: 'jardin-muscade', vue: 'île', famille: 'jardin-pres', ile: 'jardin', recadre: { x: 190, y: 220, width: 240, height: 180 } },
  // (`fige` : l'appareil demande moins d'animations, la créature de la bulle ne tourne pas : elle se montre de face.)
  { nom: 'jardin-muscade-bulle', vue: 'bulle', famille: 'jardin-pres', ile: 'jardin', sansEtoiles: true, fige: true },
  { nom: 'jardin-ponton', vue: 'archipel', famille: 'jardin-pres', ile: 'jardin', recadre: { x: 150, y: 480, width: 300, height: 225 } },
  // (Le Soleil sur son îlot, au même recadrage que la sentinelle de l'Atelier à côté de sa grue, `sentinelle-grue` :
  // aucune vue ne montre les deux à la fois, sauf la Carte, où ils sont trop petits.)
  // (L'osier de près, pour le moiré : la serre et la bordure du potager, à deux distances, la vue de l'île et celle de
  // l'archipel depuis le Jardin, recadrées sans agrandir (`finesse` 1 : les pixels de l'écran, tels que l'élève les voit).)
  { nom: 'jardin-osier-ile', vue: 'île', famille: 'jardin-pres', ile: 'jardin', recadre: { x: 60, y: 380, width: 320, height: 200 }, finesse: 1 },
  { nom: 'jardin-osier-archipel', vue: 'archipel', famille: 'jardin-pres', ile: 'jardin', recadre: { x: 230, y: 320, width: 260, height: 180 }, finesse: 1 },
  { nom: 'jardin-soleil', vue: 'archipel', famille: 'jardin-pres', ile: 'jardin', recadre: { x: 620, y: 380, width: 360, height: 270 } },
  // La revue d'ensemble du directeur artistique (28/09) : le phare du large du 5e, de jour et de nuit (`lieu` : la vue
  // d'un monument, dans l'archipel `archipel`, le bonhomme sur l'île `ile`) ; une sentinelle de près, à côté du phare de
  // la Tour (6e, la Plaine et l'arbre voisin de son îlot) et de la grue de l'Atelier (4e), de jour et de nuit.
  { nom: 'phare-large', vue: 'île', famille: 'revue', ile: 'glacier', lieu: 'monument-phare-large' },
  { nom: 'phare-large-nuit', vue: 'île', famille: 'revue', ile: 'glacier', lieu: 'monument-phare-large', nuit: true },
  { nom: 'sentinelle', vue: 'île', famille: 'revue', ile: 'plaine' },
  { nom: 'sentinelle-nuit', vue: 'île', famille: 'revue', ile: 'plaine', nuit: true },
  { nom: 'sentinelle-grue', vue: 'île', famille: 'revue', ile: 'atelier' },
  // Les repères des Îles du Ciel (R4b-3e) : le grand phare sur son socle, de jour et de nuit, les gradins de
  // l'Observatoire des textes.
  { nom: 'phare-du-ciel', vue: 'île', famille: 'ciel', ile: 'phare' },
  { nom: 'phare-du-ciel-nuit', vue: 'île', famille: 'ciel', ile: 'phare', nuit: true },
  { nom: 'textes', vue: 'île', famille: 'ciel', ile: 'textes' },
  // La vue de l'archipel depuis l'île du Phare : le phare au centre de l'arc, devant le massif (une vue de l'archipel
  // avec `ile` y place le bonhomme).
  { nom: 'archipel-phare', vue: 'archipel', famille: 'ciel', ile: 'phare' },
  { nom: 'archipel-phare-nuit', vue: 'archipel', famille: 'ciel', ile: 'phare', nuit: true },
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

async function scenes() {
  // Le build a passé le processus en production : le compteur ne s'exposerait pas (import.meta.env.DEV).
  process.env.NODE_ENV = 'development';
  const server = await createServer({ root, logLevel: 'error', server: { port: 5288, strictPort: false, hmr: false } });
  await server.listen();
  const base = server.resolvedUrls.local[0].replace(/\/$/, '');
  const load = (p) => server.ssrLoadModule(p);
  const [{ BIOMES }, { ARCHIPELAGO_IDS }, { toutConstruit }, { plansFor, planCells }] = await Promise.all([
    load('/src/blocland/biomes.ts'),
    load('/src/blocland/world/map.ts'),
    load('/src/blocland/world/budget.ts'),
    load('/src/blocland/world/plans.ts'),
  ]);
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
              depuis: c.depuis,
              fige: c.fige,
              finesse: c.finesse,
              nom: parIle ? `${c.nom}-${parIle}` : c.nom,
            })),
          )
        : []),
    ];
    for (const { vue, go, time = DAY, view = '3d', sansEtoiles, nom, mesure, ile, plans, bridges, lv2, taille, recadre, sansIles, depuis, fige, finesse } of views) {
      const page = await browser.newPage({ viewport: taille ?? TABLET, deviceScaleFactor: finesse ?? (recadre ? 1.5 : 1), ...(fige ? { reducedMotion: 'reduce' } : {}) });
      await page.clock.setFixedTime(time);
      await page.addInitScript(figeable);
      await page.goto(`${base}/icon.svg`);
      await page.evaluate(
        ({ village, progress, view, univers, lv2 }) => {
          localStorage.clear();
          sessionStorage.setItem('dysapps:titre-vu', '1');
          localStorage.setItem('dysapps:settings', JSON.stringify({ worldView: view, ...(univers ? { univers } : {}), ...(lv2 ? { lv2 } : {}) }));
          localStorage.setItem('dysapps:tutos', JSON.stringify({ 'village-immersif': true, 'archipel-5e': true, 'archipel-4e': true, 'archipel-3e': true }));
          localStorage.setItem('dysapps:blocland', JSON.stringify({ inventory: {}, progress, village }));
          localStorage.setItem('dysapps:progress', JSON.stringify({ xp: 20000 }));
        },
        {
          village: { ...built, plans: sansLesIles(plans ?? built.plans, sansIles), ...(bridges ? { bridges } : {}), at: depuis ?? ile ?? at },
          progress: sansEtoiles ? {} : sansLesIles(progress, sansIles),
          view,
          univers: UNIVERS_DES_TEXTES,
          lv2,
        },
      );
      await page.goto(`${base}/${QUERY}#${go}`);
      const file = SHOTS && join(SHOTS, `${a}-${nom}.jpg`);
      if (!mesure) {
        // Les autres captures (nuit, personnages, chantier, ponts) : pas de mesure, seulement l'image.
        await page.waitForTimeout(8000);
        await capturer(page, { path: file, type: 'jpeg', quality: 85, timeout: 90000, ...(recadre ? { clip: recadre } : {}) });
        if (time === NIGHT && view === '3d') {
          // La part de lueur, sur la scène seule (le canvas, sans les panneaux ni les boutons autour).
          const box = await page.locator('.voxel-canvas').boundingBox();
          const png = box && (await capturer(page, { type: 'png', clip: box, timeout: 90000 }));
          if (png) lueurs.push({ archipel: a, nom, vue, part: await partDeLueur(outil, png) });
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
        if (file) await capturer(page, { path: file, type: 'jpeg', quality: 85, timeout: 90000 });
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

/** Les parts de lueur des captures de nuit en 3D. */
const lueurs = [];

// Le build d'abord : le serveur de développement le passerait en mode développement.
const js = process.argv.includes('--sans-poids') ? null : await weights();
const rows = await scenes();
console.log('\n| Archipel | Vue | Appels de dessin | Triangles | Géométries | Textures | Images/s (rendu logiciel) |');
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
process.exit(rows.some((r) => r.erreur) || lueurs.some((l) => l.vue === 'île' && l.part > LUEUR_MAX) ? 1 : 0);
