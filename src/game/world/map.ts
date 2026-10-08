// La carte de Blocland : quatre archipels, un par classe, dans un seul repère de coordonnées. Chaque île a un cœur de
// 16 × 16 (bornes de mission, zone des plans, créature, décor) posé sur une terre bien plus large aux côtes irrégulières
// (baies, caps), avec ses collines, ses pics, ses lacs, sa végétation. Les archipels occupent des bandes de y disjointes :
// les Premiers Rivages (6e) au niveau de la mer, les Îles Brumeuses (5e), les Anciens Ateliers (4e) et les Îles du Ciel (3e),
// chacun à son altitude, qui est une ambiance : les Îles du Ciel flottent au-dessus des nuages.
import type { BiomeId } from '../biomes';
import { archipelagoOfIsland, type ArchipelagoId } from './archipelagos';
import { silhouetteDe } from './silhouettes';
import { BOITE_DE_LA_FORME, distanceALaForme, etendueDeLaForme, type FormeDeLIle } from './formes';
import { GD11_GUARDIAN_SQUARES, GUARDIAN_SQUARE_SIDE } from './guardianSquares';
import { layoutCache, unturnCell, chosenPose, type Quarts, turnCell, turnRectangle } from './placement';

export { ARCHIPELAGO_IDS, archipelagoOfIsland, type ArchipelagoId } from './archipelagos';

export type RegionId = 'basses-terres' | 'marais' | 'feu' | 'montagne' | 'hauteurs';
export type Relief = 'plat' | 'collines' | 'montagne' | 'volcan';

/**
 * Le nom qui tire le hasard du dessin d'une île (l'épaisseur des strates de ses falaises, la pose de chaque élément de
 * son décor) : son identifiant d'avant les mots neutres (2 octobre 2026), figé pour que le dessin ne bouge pas quand un
 * identifiant change. Un lieu nouveau n'y est pas : son identifiant tire son hasard.
 */
export const GRAINES_DU_DESSIN: Readonly<Record<string, string>> = {
  'french-6e-phonology': 'foret',
  'french-6e-letter-confusion': 'mine',
  'french-6e-word-spelling': 'carriere',
  'french-6e-grammar-spelling': 'ferme',
  'french-6e-reading': 'tour',
  'maths-6e-calculation': 'plaine',
  'maths-6e-fractions': 'riviere',
  'maths-6e-decimals': 'volcan',
  'maths-5e-signed-numbers': 'glacier',
  'maths-5e-proportionality': 'marche',
  'french-5e-homophones': 'carrefour',
  'french-5e-conjugation': 'marais',
  'maths-4e-powers': 'forge',
  'maths-4e-algebra': 'atelier',
  'french-4e-agreement': 'falaise',
  'french-4e-vocabulary': 'cabinet',
  'maths-3e-geometry': 'belvedere',
  'maths-3e-statistics': 'donnees',
  'maths-3e-functions': 'phare',
  'french-3e-close-reading': 'textes',
  'english-6e-vocabulary': 'baie',
  'english-6e-grammar': 'horloge',
  'english-5e-vocabulary': 'comptoir',
  'english-5e-grammar': 'manoir',
  'english-4e-comprehension': 'theatre',
  'english-4e-grammar': 'gare',
  'english-3e-comprehension': 'studio',
  'english-3e-grammar': 'chateau',
  'lv2-5e-introductions': 'relais',
  'lv2-4e-daily-life': 'jardin',
  'lv2-3e-travel': 'refuge',
};

/**
 * Le nom qui tire le hasard du dessin d'un lieu (`GRAINES_DU_DESSIN`), ou d'un élément `<lieu>/<nom>` de son décor. Un
 * élément nommé par sa case du monde (« genre@x,y ») l'est ici par sa case dans le repère du lieu (GD-9) : déplacé ou
 * tourné, le lieu garde le même hasard.
 */
export function graineDuDessin(nom: string): string {
  const i = nom.indexOf('/');
  const lieu = i < 0 ? nom : nom.slice(0, i);
  if (!Object.hasOwn(GRAINES_DU_DESSIN, lieu)) return nom;
  return GRAINES_DU_DESSIN[lieu] + toLocalInName(lieu as BiomeId, nom.slice(lieu.length));
}

/** La fin d'un nom d'élément de décor (« /genre@x,y »), sa case du monde ramenée dans le repère du lieu ; le reste tel quel. */
function toLocalInName(lieu: BiomeId, fin: string): string {
  const at = fin.lastIndexOf('@');
  if (at < 0 || fin.startsWith('/cœur:')) return fin;
  const [x, y] = fin.slice(at + 1).split(',').map(Number);
  if (!Number.isInteger(x) || !Number.isInteger(y)) return fin;
  const def = islandDef(lieu);
  if (def.core.x === def.repere.x && def.core.y === def.repere.y && !def.quarts) return fin;
  const l = toPlace(def, x, y);
  return `${fin.slice(0, at + 1)}${def.repere.x + l.x},${def.repere.y + l.y}`;
}

export interface IslandDef {
  id: BiomeId;
  region: RegionId;
  /** Origine (x, y) du repère de l'île dans le monde : le coin du cœur d'origine 16 × 16 (ses bornes : `coeurDe`). */
  core: { x: number; y: number };
  /** Altitude du sol : 0 (mer), 3 (collines), 6 (monts), 9 (sommets). */
  altitude: number;
  /** Terre en plus autour du cœur (de ses bornes, `coeurDe`) : à gauche (x plus petit), à droite, devant (y plus petit), derrière. */
  ext: { left: number; right: number; front: number; back: number };
  relief: Relief;
  seed: number;
  /**
   * De combien l'île a été déplacée (en cases), depuis son repère (`repere`), par rapport à la place où sa côte, son
   * relief et son décor ont été tirés : le bruit qui les dessine est lu à cette place (`tirage`), et l'île garde son
   * dessin quand on l'écarte. Les voisines de la Forêt, écartées quand son cœur est passé à 20 (01/10/2026).
   */
  deplacee?: { x: number; y: number };
  /**
   * Le repère du dessin du lieu (GD-9) : la place de son cœur quand son dessin a été figé. Sa côte, son relief et son
   * décor sont lus là (`tirage`), quel que soit l'endroit où le lieu est posé (`core`) : un lieu déplacé ou tourné garde
   * exactement son dessin.
   */
  repere: { x: number; y: number };
  /**
   * La place de son cœur d'où se tire le pivot de la vue de l'île (`viewYaw`, ./terrain/view.ts), quand elle n'est pas
   * sa place de départ : celle d'avant GD-12, que les formes ont fait bouger. La vue de l'île, et tout ce qui se tire
   * pour elle (la place du Gardien, des petites constructions, le décor qui cacherait une borne), reste celle d'avant.
   */
  vueDepuis?: { x: number; y: number };
  /** L'orientation du lieu posé (GD-9), en quarts de tour autour du milieu de son cœur (./placement.ts) ; 0 sur la carte de départ. */
  quarts: Quarts;
}

/**
 * Un lieu tel que la carte de départ l'écrit : son repère est sa place, sauf s'il est donné. Un lieu qui a une forme
 * (GD-12, ./silhouettes/) n'écrit pas sa côte (`ext`) : elle se lit sur sa forme (`etendueDuLieu`).
 */
type MapPlace = Omit<IslandDef, 'repere' | 'quarts' | 'ext'> & { repere?: { x: number; y: number }; ext?: IslandDef['ext'] };

// Le côté du cœur des îles : une règle du jeu (./coreSide.ts), que la sauvegarde lit aussi ; réexporté ici.
export { CORE, COTE_DU_COEUR, DEFAULT_CORE_SIDE } from './coreSide';
import { CORE, COTE_DU_COEUR, DEFAULT_CORE_SIDE } from './coreSide';

/** Des bornes de cases : [x0, x1) × [y0, y1), bornes hautes exclues. */
export interface Bornes {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

const bornesLocales = new Map<BiomeId, Readonly<Bornes>>();

/** Les bornes du cœur d'une île relatives à son origine `def.core` (−3..19 à 22 de côté, −5..21 à 26). */
export function bornesDuCoeur(def: IslandDef): Readonly<Bornes> {
  let b = bornesLocales.get(def.id);
  if (!b) {
    const cote = COTE_DU_COEUR[def.id] ?? DEFAULT_CORE_SIDE;
    const debut = (CORE - cote) / 2;
    b = Object.freeze({ x0: debut, y0: debut, x1: cote + debut, y1: cote + debut });
    bornesLocales.set(def.id, b);
  }
  return b;
}

/** Les bornes du cœur d'une île en cases du monde (bornes hautes exclues). */
export function coeurDe(def: IslandDef): Bornes {
  const b = bornesDuCoeur(def);
  return { x0: def.core.x + b.x0, y0: def.core.y + b.y0, x1: def.core.x + b.x1, y1: def.core.y + b.y1 };
}
/** Altitude par classe (uniforme dans un archipel). */
export const ALTITUDE: Record<ArchipelagoId, number> = { '6e': 0, '5e': 3, '4e': 6, '3e': 9 };
/** Un archipel du ciel : pas de mer, les îles flottent au-dessus d'un plancher de nuages (les Îles du Ciel). */
export const DANS_LE_CIEL: Record<ArchipelagoId, boolean> = { '6e': false, '5e': false, '4e': false, '3e': true };

const e = (left: number, right: number, front: number, back: number) => ({ left, right, front, back });

// ---------- La forme de la terre (GD-12) ----------

/**
 * De combien, au plus, le bruit de la graine déplace le bord d'une forme (en cases) : un bruit lissé sur six cases, qui
 * fait tourner la côte, et un grain à la case près (`dansLaFormeBrute`).
 */
const BRUIT_DE_LA_FORME = { lisse: 0.8, grain: 0 } as const;
const MARGE_DU_BRUIT = BRUIT_DE_LA_FORME.lisse + BRUIT_DE_LA_FORME.grain;

/**
 * Autour du cœur, tant de cases sont toujours de la terre, quelle que soit la forme : la côte mince de GD-11, où passe
 * le bonhomme ; aucun coin du cœur ne touche la mer.
 */
export const TERRE_AUTOUR_DU_COEUR = 2;

/** La terre de la forme d'un lieu, dans son repère (relative à l'origine de son cœur), calculée une fois. */
interface MasqueDeLaForme {
  x0: number;
  y0: number;
  w: number;
  h: number;
  cases: Uint8Array;
}
const masques = new Map<BiomeId, MasqueDeLaForme>();

/**
 * La terre de la forme d'un lieu (GD-12), dans son repère : la forme du catalogue (./formes.ts), orientée, autour du
 * cœur ; son bord cassé par le bruit de la graine, lu là où le dessin du lieu a été tiré (`tirage` : déplacé ou tourné,
 * le lieu garde sa forme) ; toujours `TERRE_AUTOUR_DU_COEUR` cases de terre autour du cœur. Puis la terre d'un seul
 * tenant : un morceau détaché par le bruit retourne à la mer, une mare fermée redevient de la terre.
 */
function masqueDeLaForme(def: IslandDef, f: FormeDeLIle): MasqueDeLaForme {
  const connu = masques.get(def.id);
  if (connu) return connu;
  const b = bornesDuCoeur(def);
  const s = (b.x1 - b.x0) / 2;
  const e = etendueDeLaForme(f, s, MARGE_DU_BRUIT);
  const x0 = b.x0 - e.left - 1;
  const y0 = b.y0 - e.front - 1;
  const w = b.x1 + e.right + 1 - x0;
  const h = b.y1 + e.back + 1 - y0;
  const cases = new Uint8Array(w * h);
  for (let j = 0; j < h; j++)
    for (let i = 0; i < w; i++) if (dansLaFormeBrute(def, f, b, s, x0 + i, y0 + j)) cases[j * w + i] = 1;
  // D'un seul tenant : la terre que l'on gagne depuis le cœur, de proche en proche (sans diagonale).
  const tenant = new Uint8Array(w * h);
  const file: number[] = [(b.y0 - y0) * w + (b.x0 - x0)];
  tenant[file[0]] = 1;
  const voisins = (k: number, f2: (n: number) => void) => {
    const i = k % w;
    if (i > 0) f2(k - 1);
    if (i < w - 1) f2(k + 1);
    if (k >= w) f2(k - w);
    if (k < w * (h - 1)) f2(k + w);
  };
  for (let n = 0; n < file.length; n++)
    voisins(file[n], (k) => {
      if (cases[k] && !tenant[k]) {
        tenant[k] = 1;
        file.push(k);
      }
    });
  // La mer : ce qu'on gagne depuis le bord de la boîte sans passer sur la terre ; le reste (une mare fermée) est de la terre.
  const mer = new Uint8Array(w * h);
  const large: number[] = [];
  for (let k = 0; k < w * h; k++) {
    const i = k % w;
    const j = Math.floor(k / w);
    if ((i === 0 || j === 0 || i === w - 1 || j === h - 1) && !tenant[k]) {
      mer[k] = 1;
      large.push(k);
    }
  }
  for (let n = 0; n < large.length; n++)
    voisins(large[n], (k) => {
      if (!tenant[k] && !mer[k]) {
        mer[k] = 1;
        large.push(k);
      }
    });
  for (let k = 0; k < w * h; k++) cases[k] = mer[k] ? 0 : 1;
  const m = { x0, y0, w, h, cases };
  masques.set(def.id, m);
  return m;
}

/** La case (x, y) du repère d'un lieu est-elle dans sa forme, son bord cassé par le bruit, avant d'être d'un seul tenant ? */
function dansLaFormeBrute(def: IslandDef, f: FormeDeLIle, b: Readonly<Bornes>, s: number, x: number, y: number): boolean {
  const autour = TERRE_AUTOUR_DU_COEUR;
  // Jamais au-delà de la boîte de la forme (./formes.ts) : la terre d'un lieu tient dans le même carré, tourné ou non.
  const boite = BOITE_DE_LA_FORME;
  if (x < b.x0 - boite || x >= b.x1 + boite || y < b.y0 - boite || y >= b.y1 + boite) return false;
  if (x >= b.x0 - autour && x < b.x1 + autour && y >= b.y0 - autour && y < b.y1 + autour) return true;
  // Le carré du Gardien de GD-11, figé (./guardianSquares.ts), et une case autour : toujours de la terre.
  const g = GD11_GUARDIAN_SQUARES[def.id];
  if (g && x >= g.x - 1 && x < g.x + GUARDIAN_SQUARE_SIDE + 1 && y >= g.y - 1 && y < g.y + GUARDIAN_SQUARE_SIDE + 1) return true;
  const u = x + 0.5 - (b.x0 + b.x1) / 2;
  const v = y + 0.5 - (b.y0 + b.y1) / 2;
  const d = distanceALaForme(f, u, v, s);
  if (d > MARGE_DU_BRUIT) return false;
  if (d < -MARGE_DU_BRUIT) return true;
  // Au port, devant le cœur, la rive reste droite sur la largeur du quai et du Bloc-Navire (sans bruit) : la jetée en part.
  if (f.quai && v < -s && u > 4 && u < 16) return d < 0;
  const t = tirage(def, def.core.x + x, def.core.y + y);
  const bruit = (smoothNoise(def.seed + 101, t.x, t.y, 6) - 0.5) * 2 * BRUIT_DE_LA_FORME.lisse + (noise(def.seed + 103, t.x, t.y) - 0.5) * 2 * BRUIT_DE_LA_FORME.grain;
  return d + bruit < 0;
}

/** La case (x, y) du monde (le lieu posé, pas tourné) est-elle dans la forme du lieu ? */
function dansLaForme(def: IslandDef, x: number, y: number): boolean {
  const f = silhouetteDe(def.id).forme;
  if (!f) return false;
  const m = masqueDeLaForme(def, f);
  const i = x - def.core.x - m.x0;
  const j = y - def.core.y - m.y0;
  return i >= 0 && j >= 0 && i < m.w && j < m.h && m.cases[j * m.w + i] === 1;
}

/**
 * Au-delà de tant de cases du cœur, la terre d'une île qui a une forme est de la « terre nouvelle » (GD-12, piste 4 du
 * budget) : à plat, de l'herbe, et de loin en loin un seul élément de décor (`computeLandscape`). La côte d'avant GD-12
 * allait jusque-là ; ce qu'elle portait reste comme avant.
 */
export const COTE_D_AVANT = 4;

/**
 * La part du décor que garde une île qui a une forme (GD-12) : un élément tiré par le bruit n'est posé que si un second
 * bruit passe sous cette part. Sur sa côte, en deçà de `COTE_D_AVANT` : la côte d'avant était surtout un bord, sans
 * décor ; plus large, elle en garderait deux fois trop. Sur la terre nouvelle, au-delà : de loin en loin.
 */
const PART_DU_DECOR_D_UNE_FORME = { cote: 0.4, nouvelle: 0.1 } as const;

/** La case (x, y) du monde (le lieu posé, pas tourné) est-elle de la terre nouvelle d'une île qui a une forme (`COTE_D_AVANT`) ? */
function terreNouvelle(def: IslandDef, x: number, y: number): boolean {
  if (!silhouetteDe(def.id).forme) return false;
  const b = bornesDuCoeur(def);
  const [lx, ly] = [x - def.core.x, y - def.core.y];
  const d = Math.max(b.x0 - lx, lx - (b.x1 - 1), b.y0 - ly, ly - (b.y1 - 1));
  return d > COTE_D_AVANT;
}

/** La côte d'un lieu qui a une forme : de combien sa terre déborde son cœur de chaque côté (`IslandDef.ext`). */
function etendueDuLieu(def: IslandDef): IslandDef['ext'] {
  const f = silhouetteDe(def.id).forme!;
  const m = masqueDeLaForme(def, f);
  const b = bornesDuCoeur(def);
  let [x0, y0, x1, y1] = [Infinity, Infinity, -Infinity, -Infinity];
  for (let j = 0; j < m.h; j++)
    for (let i = 0; i < m.w; i++)
      if (m.cases[j * m.w + i]) {
        x0 = Math.min(x0, m.x0 + i);
        x1 = Math.max(x1, m.x0 + i + 1);
        y0 = Math.min(y0, m.y0 + j);
        y1 = Math.max(y1, m.y0 + j + 1);
      }
  return { left: b.x0 - x0, right: x1 - b.x1, front: b.y0 - y0, back: y1 - b.y1 };
}

/**
 * Les cinquante et une îles, placées à la main. Les Premiers Rivages (6e) : la Forêt et la Plaine au centre. Les trois autres archipels
 * sont des bandes plus au nord (y ≈ 300, 600, 900), jamais visibles depuis la 6e : chaque archipel est sa propre scène.
 * Dans chaque archipel, l'île-port est celle dont le quai (devant, côté −y) accueille le Bloc-Navire.
 *
 * GD-9 (05/10/2026) : la carte se cale sur le pas des places (`STEP`, compté depuis le coin du cadre de la région,
 * footprint.ts) ; chaque lieu y bouge de quelques cases et garde son dessin (`repere` : sa place d'avant). Le second
 * lieu d'une paire réunie par un isthme garde son écart à l'autre, hors du pas. Entre deux emprises, au moins
 * `GAP_BETWEEN_PLACES` cases d'eau, et chaque lieu peut être relié par une liaison droite ou en L (routing.ts).
 *
 * GD-11 (08/10/2026) : les cœurs grandissent (`DEFAULT_CORE_SIDE`, `COTE_DU_COEUR`) et chaque côte s'amincit d'une
 * case ; les lieux que leur terre agrandie approchait à moins de `GAP_BETWEEN_PLACES` cases d'une voisine glissent sur
 * le pas (de 4 cases, rarement 8 ou 12), avec les îlots des monuments (monuments.ts). Les cadres des régions ne bougent
 * pas. Les notes île par île ci-dessous racontent les places d'avant ; les nombres sont ceux d'aujourd'hui.
 */
const STARTING_MAP: MapPlace[] = [
  // Premiers Rivages (6e), au niveau de la mer. Port : la Plaine. La Forêt, île-école, a un cœur de 20 (`COTE_DU_COEUR`)
  // et sa côte autour : sa terre a deux cases de plus de chaque côté. Ses voisines se sont écartées d'autant (01/10/2026)
  // pour garder les bras de mer et la longueur des ouvrages (à deux cases près), chacune avec son dessin (`deplacee`) :
  // la Ferme de 2 vers l'ouest, la Mine de 2 vers l'est, la Plaine de 2 devant ; derrière, la Baie (2 vers l'ouest) et
  // l'Horloge d'une case seulement, pour que la mer semée au large ne s'étende pas d'un rang (l'îlot du Gardien de
  // l'Horloge, retiré depuis GD-11, était à deux cases d'eau de la Forêt). Les îles du bord (la
  // Tour, la Carrière, le Volcan, la Rivière) ne bougent pas : rien de la Forêt ne les approche, et l'archipel garde sa
  // colonne centrale (le cadrage des caméras) et sa largeur (la mer). L'isthme de la Ferme à la Tour, les ponts de la
  // Mine à la Carrière et à la Rivière, et le bac de la Ferme au Volcan y perdent deux cases.
  // GD-12 (08/10/2026, une forme par île) : chaque forme tient dans une boîte de cinq cases au plus autour du cœur
  // (`BOITE_DE_LA_FORME`, formes.ts) et doit pouvoir tourner. Les colonnes de côté passent sur quatre rangs (y −5, 31,
  // 67 et 103 ; x −12 et 24 à l'ouest, 108 et 144 à l'est), la Forêt et la Plaine restent ; les places laissées libres
  // entre elles portent les îlots des monuments et les places où un lieu tourne. Au rang du fond, l'Horloge et la Vallée
  // reculent d'un pas (y 107), en quinconce avec la Baie, la Fouille et la Pointe : sur la tablette, panneau ouvert,
  // leurs noms ne se taisent plus sur la Carte. Chaque lieu garde la vue de sa place de GD-11 (`vueDepuis`).
  { id: 'french-6e-phonology', region: 'basses-terres', core: { x: 68, y: 63 }, repere: { x: 67, y: 59 }, altitude: 0, relief: 'collines', seed: 11 },
  { id: 'french-6e-grammar-spelling', region: 'basses-terres', core: { x: 24, y: 31 }, vueDepuis: { x: 24, y: 59 }, repere: { x: 25, y: 61 }, deplacee: { x: -2, y: 0 }, altitude: 0, relief: 'plat', seed: 12 },
  { id: 'french-6e-letter-confusion', region: 'montagne', core: { x: 108, y: 59 }, vueDepuis: { x: 104, y: 67 }, repere: { x: 98, y: 61 }, deplacee: { x: 2, y: 0 }, altitude: 0, relief: 'montagne', seed: 13 },
  { id: 'french-6e-reading', region: 'basses-terres', core: { x: -12, y: 67 }, vueDepuis: { x: -8, y: 51 }, repere: { x: -3, y: 56 }, altitude: 0, relief: 'plat', seed: 14 },
  { id: 'french-6e-word-spelling', region: 'montagne', core: { x: 144, y: 59 }, vueDepuis: { x: 136, y: 55 }, repere: { x: 136, y: 56 }, altitude: 0, relief: 'collines', seed: 15 },
  { id: 'maths-6e-calculation', region: 'basses-terres', core: { x: 64, y: 19 }, deplacee: { x: 0, y: -2 }, altitude: 0, relief: 'plat', seed: 16 },
  { id: 'maths-6e-fractions', region: 'marais', core: { x: 108, y: 15 }, vueDepuis: { x: 108, y: 19 }, repere: { x: 109, y: 19 }, altitude: 0, relief: 'plat', seed: 17 },
  { id: 'maths-6e-decimals', region: 'feu', core: { x: 24, y: -5 }, vueDepuis: { x: 20, y: 15 }, repere: { x: 21, y: 19 }, altitude: 0, relief: 'volcan', seed: 18 },
  // Îles Brumeuses (5e), sur les collines : deux paires d'isthmes l'une devant l'autre. Port : le Marché. Le Marché,
  // île-école, a un cœur de 20 et sa côte autour (01/10/2026) : le Glacier s'écarte de 2 vers l'ouest (l'isthme garde
  // sa largeur), le Comptoir et le Manoir de 2 vers l'est (le pont du Comptoir au Manoir reste droit), chacun avec son
  // dessin (`deplacee`) ; le grand phare du large recule (monuments.ts). Le Marais, le Carrefour et le Relais ne bougent
  // pas : le pont du Marché au Marais était long (30 cases), celui du Comptoir au Relais y perd deux cases ; écarter
  // aussi le Relais, pour garder la colonne centrale, élargissait la mer semée de 157 triangles de décor, au-delà de son
  // enveloppe : la colonne recule d'une case, et les caméras du 5e tournent de 0,8°.
  { id: 'maths-5e-signed-numbers', region: 'montagne', core: { x: 33, y: 321 }, repere: { x: 38, y: 320 }, deplacee: { x: -2, y: 0 }, altitude: 3, ext: e(3, 3, 2, 5), relief: 'montagne', seed: 21 },
  // Le Marché garde deux rangées de côte devant (GD-11 amincit les autres côtes d'une case) : sinon l'escalier de sa jetée
  // monterait sur la rangée nue devant ses bornes.
  { id: 'maths-5e-proportionality', region: 'marais', core: { x: 69, y: 317 }, altitude: 3, ext: e(2, 3, 2, 2), relief: 'plat', seed: 22 },
  { id: 'french-5e-homophones', region: 'basses-terres', core: { x: 33, y: 373 }, repere: { x: 40, y: 362 }, altitude: 3, ext: e(3, 3, 2, 3), relief: 'collines', seed: 23 },
  { id: 'french-5e-conjugation', region: 'marais', core: { x: 65, y: 373 }, repere: { x: 69, y: 367 }, altitude: 3, ext: e(3, 3, 1, 3), relief: 'plat', seed: 24 },
  // Anciens Ateliers (4e), sur les monts : redessinés en deux rangs dans leur cadre de 160 × 112 (GD-9, 05/10/2026 ;
  // ils étaient en ligne). Port : l'Atelier, au point de départ. Devant, la Forge, l'Atelier, la Falaise et, au bout,
  // l'île de la LV2 ; derrière, la Gare, le Théâtre et le Cabinet. Chacun garde son dessin (`repere`).
  { id: 'maths-4e-powers', region: 'feu', core: { x: 26, y: 620 }, repere: { x: 28, y: 618 }, deplacee: { x: -2, y: 0 }, altitude: 6, ext: e(2, 3, 1, 4), relief: 'montagne', seed: 31 },
  { id: 'maths-4e-algebra', region: 'hauteurs', core: { x: 62, y: 632 }, altitude: 6, ext: e(2, 2, 1, 3), relief: 'collines', seed: 32 },
  { id: 'french-4e-agreement', region: 'montagne', core: { x: 94, y: 616 }, repere: { x: 96, y: 618 }, deplacee: { x: 2, y: 0 }, altitude: 6, ext: e(2, 3, 1, 6), relief: 'montagne', seed: 33 },
  { id: 'french-4e-vocabulary', region: 'hauteurs', core: { x: 126, y: 664 }, repere: { x: 126, y: 632 }, altitude: 6, ext: e(2, 2, 1, 3), relief: 'collines', seed: 34 },
  // Îles du Ciel (3e), sur les sommets : un arc, le Phare devant au centre. Port : le Phare. Le Phare, île-école, a un
  // cœur de 20 et sa côte autour (01/10/2026) : le Belvédère s'écarte de 2 vers l'ouest, l'Observatoire des données de
  // 2 vers l'est (leurs ponts vers le Phare gardent leur longueur, ceux du Studio et du Château y perdent deux cases),
  // chacun avec son dessin (`deplacee`). L'Observatoire des textes avance de 2 vers le Phare : la mer de nuages, qui
  // n'avait plus de marge, garde ses rangs (le devant du Phare l'a agrandie de deux cases, le fond la reprend), et le
  // col n'y perd que deux cases. Les îles du bord (le Studio, le Château, le Refuge) ne bougent pas : la colonne
  // centrale et la largeur restent. Le temple de marbre suit le Belvédère, le grand phare la côte repoussée (decor/3e.ts).
  { id: 'maths-3e-geometry', region: 'montagne', core: { x: 18, y: 932 }, repere: { x: 18, y: 930 }, deplacee: { x: -2, y: 0 }, altitude: 9, ext: e(2, 2, 1, 5), relief: 'montagne', seed: 41 },
  { id: 'maths-3e-functions', region: 'hauteurs', core: { x: 58, y: 912 }, altitude: 9, ext: e(2, 2, 2, 2), relief: 'collines', seed: 42 },
  { id: 'maths-3e-statistics', region: 'hauteurs', core: { x: 94, y: 932 }, repere: { x: 98, y: 930 }, deplacee: { x: 2, y: 0 }, altitude: 9, ext: e(3, 2, 2, 2), relief: 'collines', seed: 43 },
  { id: 'french-3e-close-reading', region: 'hauteurs', core: { x: 58, y: 964 }, repere: { x: 58, y: 958 }, deplacee: { x: 0, y: -2 }, altitude: 9, ext: e(2, 2, 1, 4), relief: 'collines', seed: 44 },
  // Anglais 6e : au rang du fond, à l'ouest (GD-12), la Baie au coin, l'Horloge à côté, un pas plus au fond (leur isthme
  // est retiré, GD-9).
  { id: 'english-6e-vocabulary', region: 'basses-terres', core: { x: -12, y: 103 }, vueDepuis: { x: 32, y: 107 }, repere: { x: 36, y: 102 }, deplacee: { x: -2, y: 1 }, altitude: 0, relief: 'plat', seed: 51 },
  { id: 'english-6e-grammar', region: 'basses-terres', core: { x: 24, y: 107 }, vueDepuis: { x: 64, y: 107 }, repere: { x: 68, y: 102 }, deplacee: { x: 0, y: 1 }, altitude: 0, relief: 'collines', seed: 52 },
  // Histoire-géographie 6e : au rang du fond, à l'est (GD-12), la Fouille des siècles puis la Pointe des
  // paysages, fermées au départ (on les relie). Sur le pas des places, à quatre cases d'eau au moins de leurs voisines.
  // Leur terre est plate, sans relief ni pic : l'archipel le plus chargé du monde, ses îles les plus sobres.
  { id: 'history-6e-antiquity', region: 'basses-terres', core: { x: 108, y: 103 }, vueDepuis: { x: 124, y: 99 }, repere: { x: 124, y: 99 }, altitude: 0, relief: 'plat', seed: 53 },
  { id: 'geography-6e-living', region: 'basses-terres', core: { x: 144, y: 103 }, vueDepuis: { x: 152, y: 99 }, repere: { x: 152, y: 99 }, altitude: 0, relief: 'plat', seed: 54 },
  // Sciences 6e (SC-2) : dans le cadre de la région (192 × 144, pour que la Carte tienne sur la tablette). Depuis
  // GD-12, la Vallée du vivant au rang du fond, entre l'Horloge et la Fouille, derrière la Forêt ; le Laboratoire des
  // éléments au coin de devant, à l'est, après la Rivière ; le Hangar des inventions au coin de devant, à l'ouest, à côté
  // du Volcan (voisin de la Ferme, il passe à l'ardoise, et la Vallée à la terre cuite, roofs.ts). Fermées au départ (on
  // les relie). Sur le pas des places, à quatre cases d'eau au moins de leurs voisines (leur Gardien sur leur île depuis
  // GD-11). Chacune garde le dessin de sa première place, au rang du fond (`repere`). Terre plate, sans relief ni pic,
  // comme l'histoire-géographie.
  { id: 'life-earth-sciences-6e-living-world', region: 'basses-terres', core: { x: 68, y: 107 }, vueDepuis: { x: 96, y: 111 }, repere: { x: 152, y: 139 }, altitude: 0, relief: 'plat', seed: 55 },
  { id: 'physics-chemistry-6e-matter-energy', region: 'basses-terres', core: { x: 144, y: 15 }, vueDepuis: { x: 152, y: 15 }, repere: { x: 124, y: 139 }, altitude: 0, relief: 'plat', seed: 56 },
  { id: 'technology-6e-objects', region: 'basses-terres', core: { x: -12, y: -5 }, vueDepuis: { x: -12, y: 11 }, repere: { x: 96, y: 139 }, altitude: 0, relief: 'plat', seed: 57 },
  // Anglais 5e : une colonne à droite du Marché et du Marais.
  { id: 'english-5e-vocabulary', region: 'basses-terres', core: { x: 105, y: 321 }, repere: { x: 103, y: 320 }, deplacee: { x: 2, y: 0 }, altitude: 3, ext: e(2, 3, 1, 3), relief: 'plat', seed: 61 },
  { id: 'english-5e-grammar', region: 'hauteurs', core: { x: 101, y: 365 }, repere: { x: 103, y: 366 }, deplacee: { x: 2, y: 0 }, altitude: 3, ext: e(2, 3, 1, 3), relief: 'collines', seed: 62 },
  // LV2 5e : à l'est du Comptoir, dans son alignement (le pont reste droit), en bout de chemin : rien n'en dépend.
  { id: 'lv2-5e-introductions', region: 'basses-terres', core: { x: 137, y: 321 }, repere: { x: 133, y: 320 }, altitude: 3, ext: e(1, 2, 1, 3), relief: 'plat', seed: 94 },
  // Anglais 4e : au second rang, la Gare derrière la Forge, le Théâtre à côté du Cabinet.
  { id: 'english-4e-comprehension', region: 'hauteurs', core: { x: 94, y: 660 }, repere: { x: 158, y: 618 }, altitude: 6, ext: e(2, 3, 1, 3), relief: 'collines', seed: 71 },
  // LV2 4e : au bout du premier rang, après la Falaise, en bout de chemin : rien n'en dépend. Sur la Carte au grand
  // texte, quand la flèche désigne l'ouvrage qui l'ouvre, le Jardin sort du bas de la place libre d'une trentaine de
  // pixels (la flèche et son tracé y restent) : un pas vers le fond le ramènerait à vingt, mais le mettrait à deux
  // cases du Cabinet des mots (GD-9, 5 octobre 2026 : question laissée au directeur artistique).
  { id: 'lv2-4e-daily-life', region: 'basses-terres', core: { x: 138, y: 632 }, repere: { x: 190, y: 632 }, altitude: 6, ext: e(1, 2, 1, 3), relief: 'plat', seed: 95 },
  { id: 'english-4e-grammar', region: 'feu', core: { x: 2, y: 664 }, repere: { x: -2, y: 632 }, altitude: 6, ext: e(3, 2, 1, 3), relief: 'collines', seed: 72 },
  // Anglais 3e : de part et d'autre de l'arc, le Studio avant le Belvédère, le Château après l'Observatoire des données.
  { id: 'english-3e-comprehension', region: 'hauteurs', core: { x: -14, y: 912 }, altitude: 9, ext: e(2, 3, 1, 3), relief: 'collines', seed: 81 },
  { id: 'english-3e-grammar', region: 'hauteurs', core: { x: 126, y: 912 }, repere: { x: 130, y: 912 }, altitude: 9, ext: e(3, 2, 1, 3), relief: 'collines', seed: 82 },
  // LV2 3e : à l'est du Château, en bout de chemin : rien n'en dépend. Un refuge d'altitude, bas et arrondi (intention du
  // 3e, §3), son lac d'altitude au fond, sur l'herbe (`LACS`). Avancé de 16 cases, à hauteur du Château (SC-3, consultant
  // UX UI) : un cran derrière, au bord gauche de la Carte, son nom se taisait en OpenDyslexic quand le bonhomme y était
  // et qu'il était la destination (la bulle et le médaillon prennent la place, la Géographie et le Château bordent
  // dessus et dessous) ; son dessin reste celui de sa place d'avant (`repere`).
  { id: 'lv2-3e-travel', region: 'montagne', core: { x: 158, y: 912 }, repere: { x: 158, y: 926 }, altitude: 9, ext: e(1, 1, 1, 8), relief: 'plat', seed: 96 },
  // Histoire-géographie de 5e à 3e (HG-3, DA, 6 octobre 2026) : deux îles par archipel, fermées au départ (on les
  // relie), sur le pas des places, à quatre cases d'eau au moins de leurs voisines ; leur terre est plate, sans relief
  // ni pic, comme au 6e. Aux Îles Brumeuses, le Bourg des chroniques et le Delta des ressources au second rang, au-delà
  // du Manoir (le cadre du 5e s'élargit de 24 cases vers l'est) ; aux Anciens Ateliers, l'Imprimerie des révolutions et
  // l'Escale des échanges derrière la Gare ; aux Îles du Ciel, le Kiosque des témoins derrière le Studio et le Plateau
  // des territoires derrière le Château.
  { id: 'history-5e-middle-ages', region: 'basses-terres', core: { x: 133, y: 365 }, repere: { x: 129, y: 365 }, altitude: 3, ext: e(1, 1, 1, 1), relief: 'plat', seed: 63 },
  { id: 'geography-5e-resources', region: 'basses-terres', core: { x: 161, y: 365 }, repere: { x: 157, y: 365 }, altitude: 3, ext: e(1, 1, 1, 1), relief: 'plat', seed: 64 },
  { id: 'history-4e-revolutions', region: 'basses-terres', core: { x: 34, y: 676 }, repere: { x: 30, y: 676 }, altitude: 6, ext: e(1, 1, 1, 1), relief: 'plat', seed: 73 },
  { id: 'geography-4e-globalization', region: 'basses-terres', core: { x: 62, y: 676 }, repere: { x: 58, y: 676 }, altitude: 6, ext: e(1, 1, 1, 1), relief: 'plat', seed: 74 },
  { id: 'history-3e-twentieth-century', region: 'basses-terres', core: { x: -18, y: 964 }, altitude: 9, ext: e(1, 1, 1, 1), relief: 'plat', seed: 83 },
  { id: 'geography-3e-france', region: 'basses-terres', core: { x: 130, y: 964 }, altitude: 9, ext: e(1, 1, 1, 1), relief: 'plat', seed: 84 },
  // Sciences de 5e à 3e (SC-3, DA, 6 octobre 2026) : trois îles par archipel, fermées au départ (on les relie), sur le
  // pas des places, à quatre cases d'eau au moins de leurs voisines (leur Gardien sur leur île depuis GD-11) ; terre plate,
  // sans relief ni pic, comme l'histoire-géographie. Les cadres des régions n'avaient plus qu'une place libre chacun :
  // ils s'approfondissent vers le fond (footprint.ts). Chaque place est celle, parmi les places libres, où les noms des
  // îles se tiennent le mieux sur la Carte (three/mapLabels.test.ts : la tablette à l'ouverture et panneau ouvert, le
  // portrait, OpenDyslexic, la flèche sur chaque ouvrage). Aux Îles Brumeuses, la Menuiserie des objets au coin de
  // devant, à l'est, après le Relais (sa terre cuite loin du Comptoir et du Delta), la Prairie des climats derrière la
  // Grammaire et la Saline des mélanges derrière le Bourg et le Delta, au rang du fond ; aux Anciens Ateliers, la Source
  // des espèces au coin de devant, à l'ouest, avant la Forge (sa terre cuite loin du Théâtre et de l'Imprimerie), la
  // Vigie des signaux derrière la Gare et le Bassin des maquettes derrière le Théâtre et le Cabinet, au rang du fond ;
  // aux Îles du Ciel, le Verger de la santé à côté du Kiosque (sa terre cuite loin du Belvédère et du Plateau), le
  // Tremplin des forces entre l'Observatoire des textes et le Plateau, la Ruche des réseaux derrière le Refuge.
  { id: 'life-earth-sciences-5e-active-planet', region: 'basses-terres', core: { x: 101, y: 409 }, altitude: 3, ext: e(1, 1, 1, 1), relief: 'plat', seed: 65 },
  { id: 'physics-chemistry-5e-matter-universe', region: 'basses-terres', core: { x: 145, y: 409 }, altitude: 3, ext: e(1, 1, 1, 1), relief: 'plat', seed: 66 },
  { id: 'technology-5e-design', region: 'basses-terres', core: { x: 169, y: 309 }, repere: { x: 165, y: 309 }, altitude: 3, ext: e(1, 1, 1, 1), relief: 'plat', seed: 67 },
  { id: 'life-earth-sciences-4e-cells-evolution', region: 'basses-terres', core: { x: -2, y: 592 }, repere: { x: -2, y: 604 }, altitude: 6, ext: e(1, 1, 1, 1), relief: 'plat', seed: 75 },
  { id: 'physics-chemistry-4e-signals-circuits', region: 'basses-terres', core: { x: -2, y: 704 }, altitude: 6, ext: e(1, 1, 1, 1), relief: 'plat', seed: 76 },
  { id: 'technology-4e-modeling', region: 'basses-terres', core: { x: 110, y: 704 }, altitude: 6, ext: e(1, 1, 1, 1), relief: 'plat', seed: 77 },
  { id: 'life-earth-sciences-3e-human-body', region: 'basses-terres', core: { x: 10, y: 980 }, altitude: 9, ext: e(1, 1, 1, 1), relief: 'plat', seed: 85 },
  { id: 'physics-chemistry-3e-motion-energy', region: 'basses-terres', core: { x: 90, y: 972 }, altitude: 9, ext: e(1, 1, 1, 1), relief: 'plat', seed: 86 },
  { id: 'technology-3e-digital', region: 'basses-terres', core: { x: 158, y: 980 }, altitude: 9, ext: e(1, 1, 1, 1), relief: 'plat', seed: 87 },
];

/**
 * La carte de départ : chaque lieu à sa place, sans rotation, son repère compris. La place d'un lieu dans la partie
 * (`islandDef`) suit la disposition choisie (./placement.ts) ; sans elle, c'est celle-ci.
 */
export const MAP: readonly IslandDef[] = Object.freeze(
  STARTING_MAP.map((d): IslandDef => {
    const def: IslandDef = { ...d, repere: d.repere ?? d.core, quarts: 0 as Quarts, ext: d.ext ?? { left: 0, right: 0, front: 0, back: 0 } };
    if (!d.ext && !silhouetteDe(d.id).forme) throw new Error(`${d.id} n'a ni côte écrite ni forme.`);
    return Object.freeze(silhouetteDe(d.id).forme ? { ...def, ext: etendueDuLieu(def) } : def);
  }),
);

const STARTING_PLACES = new Map(MAP.map((d) => [d.id, d]));

/** Les lieux posés, mémorisés tant que la disposition ne change pas. */
const placedIslands = layoutCache<BiomeId, IslandDef>();

const islandsOfRegions = layoutCache<ArchipelagoId, readonly IslandDef[]>();

/** Les îles d'un archipel à leur place, dans l'ordre de MAP (mémorisées tant que la disposition ne change pas). */
export function mapOf(a: ArchipelagoId): readonly IslandDef[] {
  let lieux = islandsOfRegions.get(a);
  if (!lieux) islandsOfRegions.set(a, (lieux = Object.freeze(MAP.filter((d) => archipelagoOfIsland(d.id) === a).map((d) => islandDef(d.id)))));
  return lieux;
}

/**
 * Les isthmes : deux îles voisines de même niveau, côte à côte, partagent une bande de terre ; l'ouvrage entre elles
 * est un sentier. Aucune paire de la carte de départ n'est plus réunie (GD-9, mainteneur, 5 octobre 2026 : au moins
 * 4 cases d'eau entre deux lieux) : une liaison relie chaque paire d'hier, au même identifiant. Le mécanisme reste
 * pour la réunion que l'élève construira (GD-9, point 10).
 */
export const ISTHMUSES: [BiomeId, BiomeId][] = [];

/** L'île avec laquelle une île partage un isthme, s'il y en a un. */
export function isthmusOf(id: BiomeId): BiomeId | null {
  const pair = ISTHMUSES.find(([a, b]) => a === id || b === id);
  return pair ? (pair[0] === id ? pair[1] : pair[0]) : null;
}

/**
 * Un lieu à sa place dans la partie : sa place sur la carte de départ, ou celle de la disposition choisie
 * (./placement.ts), son orientation comprise. Son repère (`repere`) et son dessin ne changent pas.
 */
export function islandDef(id: BiomeId): IslandDef {
  const connu = placedIslands.get(id);
  if (connu) return connu;
  const depart = STARTING_PLACES.get(id);
  if (!depart) throw new Error(`Île inconnue : ${id}`);
  const pose = chosenPose(id);
  const def: IslandDef =
    pose && (pose.x !== depart.core.x || pose.y !== depart.core.y || pose.quarts !== 0)
      ? Object.freeze({ ...depart, core: Object.freeze({ x: pose.x, y: pose.y }), quarts: pose.quarts })
      : depart;
  placedIslands.set(id, def);
  return def;
}

/** Le lieu sur la carte de départ, quelle que soit la disposition choisie. */
export function startingIsland(id: BiomeId): IslandDef {
  const def = STARTING_PLACES.get(id);
  if (!def) throw new Error(`Île inconnue : ${id}`);
  return def;
}

/**
 * Une case du repère du lieu (relative à l'origine de son cœur, avant rotation) dans le monde, le lieu posé et tourné
 * (`def.core`, `def.quarts`). Le dessin d'un lieu se fait sans rotation : ce qu'on en montre au monde passe par ici.
 */
export function toWorld(def: IslandDef, x: number, y: number): { x: number; y: number } {
  if (!def.quarts) return { x: def.core.x + x, y: def.core.y + y };
  const t = turnCell(x, y, def.quarts);
  return { x: def.core.x + t.x, y: def.core.y + t.y };
}

/** L'inverse de `toWorld` : une case du monde dans le repère du lieu (relative à l'origine de son cœur, avant rotation). */
export function toPlace(def: IslandDef, x: number, y: number): { x: number; y: number } {
  if (!def.quarts) return { x: x - def.core.x, y: y - def.core.y };
  return unturnCell(x - def.core.x, y - def.core.y, def.quarts);
}

/**
 * Une case du monde du dessin d'un lieu (posé, pas tourné : `def.core` + case du repère) ramenée dans le monde, le lieu
 * tourné. Sans rotation, la case elle-même.
 */
export function turnInWorld(def: IslandDef, x: number, y: number): { x: number; y: number } {
  return def.quarts ? toWorld(def, x - def.core.x, y - def.core.y) : { x, y };
}

/**
 * Une case du monde (le lieu posé, pas tourné) ramenée à la place où le dessin de l'île (sa côte, son relief, son décor)
 * a été tiré : dans son repère (`IslandDef.repere`), avant son déplacement (`IslandDef.deplacee`), et autour de son cœur
 * d'origine. Autour d'un cœur agrandi, la terre d'avant est
 * repoussée d'autant de chaque côté : l'île garde sa silhouette, de la vraie terre en plus ; le long du cœur, le dessin
 * d'avant s'étire sur la largeur du cœur agrandi.
 */
export function tirage(def: IslandDef, x: number, y: number): { x: number; y: number } {
  const b = bornesDuCoeur(def);
  const ox = def.repere.x - (def.deplacee?.x ?? 0);
  const oy = def.repere.y - (def.deplacee?.y ?? 0);
  return { x: ox + aLaPlaceDOrigine(x - def.core.x, b.x0, b.x1), y: oy + aLaPlaceDOrigine(y - def.core.y, b.y0, b.y1) };
}

/** Une case du monde (le lieu posé, pas tourné) dans son repère (`IslandDef.repere`) : là où était le lieu quand son dessin a été figé. */
export function toLocalCell(def: IslandDef, x: number, y: number): [number, number] {
  return [x - def.core.x + def.repere.x, y - def.core.y + def.repere.y];
}

/**
 * Une coordonnée relative au cœur d'origine (`rel`), sur un axe où le cœur va de `debut` à `fin` (bornes de
 * `bornesDuCoeur`), ramenée à sa place autour du cœur d'origine [0, `CORE`).
 */
function aLaPlaceDOrigine(rel: number, debut: number, fin: number): number {
  // Avant le cœur : la côte d'avant, repoussée d'autant que le cœur a grandi de ce côté.
  if (rel < debut) return rel - debut;
  // Après le cœur : de même, de l'autre côté.
  if (rel >= fin) return rel - fin + CORE;
  // Dans un cœur d'origine (16 de côté) : la case elle-même.
  if (debut === 0 && fin === CORE) return rel;
  // Dans un cœur agrandi : le dessin d'avant étiré sur sa largeur.
  return Math.floor(((rel - debut) * CORE) / (fin - debut));
}

/** Bruit déterministe dans [0, 1) pour une case. */
export function noise(seed: number, x: number, y: number): number {
  let h = (seed * 374761393 + x * 668265263 + y * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** Bruit lissé (interpolation bilinéaire d'un bruit sur une grille de `cell` cases). */
export function smoothNoise(seed: number, x: number, y: number, cell = 4): number {
  const gx = Math.floor(x / cell);
  const gy = Math.floor(y / cell);
  const fx = (x - gx * cell) / cell;
  const fy = (y - gy * cell) / cell;
  const n00 = noise(seed, gx, gy);
  const n10 = noise(seed, gx + 1, gy);
  const n01 = noise(seed, gx, gy + 1);
  const n11 = noise(seed, gx + 1, gy + 1);
  const s = (t: number) => t * t * (3 - 2 * t);
  const a = n00 + (n10 - n00) * s(fx);
  const b = n01 + (n11 - n01) * s(fx);
  return a + (b - a) * s(fy);
}

/** L'île qui « possède » l'isthme (la première de la paire) et sa voisine, ou null. */
function isthmusPair(def: IslandDef): { owner: IslandDef; other: IslandDef } | null {
  const pair = ISTHMUSES.find(([a]) => a === def.id);
  if (!pair) return null;
  return { owner: def, other: islandDef(pair[1]) };
}

/** Les rangées de l'isthme entre deux îles côte à côte, pour une colonne x : bornes [y0, y1), bords adoucis par un bruit. */
function isthmusRows(owner: IslandDef, other: IslandDef, x: number): { y0: number; y1: number } {
  const a = coeurDe(owner);
  const b = coeurDe(other);
  const y0 = Math.max(a.y0, b.y0) + 1;
  const y1 = Math.min(a.y1, b.y1) - 1;
  const tx = tirage(owner, x, 0).x;
  const n0 = Math.floor(smoothNoise(owner.seed + 17, tx, 0, 3) * 2.5);
  const n1 = Math.floor(smoothNoise(owner.seed + 19, tx, 7, 3) * 2.5);
  return { y0: y0 + n0, y1: y1 - n1 };
}

/** La case (x, y) est-elle sur l'isthme que possède cette île ? (Jamais sur la terre propre de la voisine.) */
export function inIsthmus(def: IslandDef, x: number, y: number): boolean {
  const pair = isthmusPair(def);
  if (!pair) return false;
  const { owner, other } = pair;
  const left = owner.core.x < other.core.x ? owner : other;
  const right = left === owner ? other : owner;
  if (x < coeurDe(left).x1 || x >= coeurDe(right).x0) return false;
  const { y0, y1 } = isthmusRows(owner, other, x);
  if (y < y0 || y >= y1) return false;
  return !isLandProper(other, x, y);
}

/** Boîte englobante de la terre d'une île (bornes hautes exclues), isthme compris, dans le monde (le lieu tourné). */
export function landBox(def: IslandDef): { x0: number; y0: number; x1: number; y1: number } {
  const b = landBoxOf(def);
  if (!def.quarts) return b;
  const r = turnRectangle({ x0: b.x0 - def.core.x, y0: b.y0 - def.core.y, x1: b.x1 - def.core.x, y1: b.y1 - def.core.y }, def.quarts);
  return { x0: def.core.x + r.x0, y0: def.core.y + r.y0, x1: def.core.x + r.x1, y1: def.core.y + r.y1 };
}

/** La boîte de la terre d'un lieu posé, pas tourné : celle où son dessin se fait (`landBox` la tourne avec lui). */
function landBoxOf(def: IslandDef): { x0: number; y0: number; x1: number; y1: number } {
  const c = coeurDe(def);
  const box = { x0: c.x0 - def.ext.left, y0: c.y0 - def.ext.front, x1: c.x1 + def.ext.right, y1: c.y1 + def.ext.back };
  const pair = isthmusPair(def);
  if (pair) {
    const o = coeurDe(pair.other);
    box.x0 = Math.min(box.x0, o.x1);
    box.x1 = Math.max(box.x1, o.x0);
  }
  return box;
}

export function inCore(def: IslandDef, x: number, y: number): boolean {
  const b = bornesDuCoeur(def);
  const lx = x - def.core.x;
  const ly = y - def.core.y;
  return lx >= b.x0 && lx < b.x1 && ly >= b.y0 && ly < b.y1;
}

/** La case (x, y) du monde est-elle dans le cœur d'origine 16 × 16 de l'île (le repère des clés, `IslandDef.core`) ? */
export function inCoeurDOrigine(def: IslandDef, x: number, y: number): boolean {
  const lx = x - def.core.x;
  const ly = y - def.core.y;
  return lx >= 0 && lx < CORE && ly >= 0 && ly < CORE;
}

/**
 * Une liste de cases d'un lieu calculée une fois dans son repère (relative à l'origine de son cœur, le lieu pas tourné)
 * et sa copie à la place où il est posé (`def.core`), refaite quand il change de place : le dessin d'un lieu ne dépend
 * pas de sa place.
 */
class PlaceCells<T extends { x: number; y: number }> {
  private readonly locales = new Map<BiomeId, readonly T[]>();
  private readonly posees = new Map<BiomeId, { x: number; y: number; cases: T[] }>();
  constructor(private readonly calcul: (def: IslandDef) => T[]) {}
  de(def: IslandDef): T[] {
    const posee = this.posees.get(def.id);
    if (posee && posee.x === def.core.x && posee.y === def.core.y) return posee.cases;
    let locales = this.locales.get(def.id);
    if (!locales) {
      locales = this.calcul(def).map((c) => ({ ...c, x: c.x - def.core.x, y: c.y - def.core.y }));
      this.locales.set(def.id, locales);
    }
    const cases = locales.map((c) => ({ ...c, x: c.x + def.core.x, y: c.y + def.core.y }));
    this.posees.set(def.id, { x: def.core.x, y: def.core.y, cases });
    return cases;
  }
}

const marginsCache = new PlaceCells<LandCell>((def) => computeMargins(def));

/**
 * Le seuil du décor : une case de côte porte un élément de décor quand son bruit fin (`noise(seed + 3)`) le passe
 * (`computeLandscape`), et là où il le passe les marges ne reçoivent pas de jalon (`jalonsDesMarges`) ; `pickDecor`
 * choisit l'élément entre ce seuil et 1.
 */
const SEUIL_DU_DECOR = 0.62;

/** Le sol d'une terre à plat de l'île, hors de son bord (la côte de `computeLandscape`, l'isthme, les marges du cœur). */
function solAPlat(def: IslandDef): Ground {
  if (def.id === 'maths-5e-signed-numbers') return 'glace';
  if (def.region === 'feu') return 'basalte';
  if (def.region === 'marais') return 'mousse';
  return 'herbe';
}

/**
 * Les marges du cœur d'une île : l'anneau entre le cœur d'origine et le cœur agrandi (`coeurDe`). Une terre plate
 * (h = 0) et constructible, au sol du cœur. Elle ne porte que ses jalons, sur sa rangée extérieure (GD-11, « Côte
 * amincie » : « jalons gardés dans les marges », sans autre décor, `jalonsDesMarges`) ; le reste est nu : un passage
 * tout autour, où le Gardien trouve sa place, et le décor tient dans son enveloppe. Le rendu y pose les jalons sans
 * jamais cacher une borne (terrain.ts, `cacheUneBorne`). Mémorisé.
 */
export function margesDuCoeur(def: IslandDef): LandCell[] {
  return marginsCache.de(def);
}

function computeMargins(def: IslandDef): LandCell[] {
  const c = coeurDe(def);
  const sol = solAPlat(def);
  const out: LandCell[] = [];
  const jalons = jalonsDesMarges(def, c, sol);
  for (let x = c.x0; x < c.x1; x++)
    for (let y = c.y0; y < c.y1; y++) {
      if (inCoeurDOrigine(def, x, y)) continue;
      out.push({ x, y, h: 0, ground: sol, decor: jalons.get(`${x},${y}`) });
    }
  return out;
}

/**
 * Sur la rangée extérieure des marges, une suite de cases nues de `PAS_DES_JALONS` cases ou plus reçoit un jalon, deux
 * à partir du double, et ainsi de suite, posés à intervalles égaux dans la suite (voir `jalonsDesMarges`).
 */
export const PAS_DES_JALONS = 5;

/** Les jalons des marges par région : une pierre, une touffe, un rondin ; rien que de bas. */
export const JALONS: Readonly<Record<RegionId, readonly Decor[]>> = Object.freeze({
  'basses-terres': ['rocher', 'buisson', 'souche'],
  marais: ['souche', 'rocher'],
  hauteurs: ['rocher', 'souche'],
  montagne: ['rocher'],
  feu: ['rocher'],
});

/**
 * Les jalons de la rangée extérieure des marges d'un cœur agrandi (`c`) : vue de l'archipel, la bande d'herbe nue le
 * long du cœur faisait une longue ligne droite (relecture du consultant Blocland, 01/10/2026). Chaque côté de la rangée
 * est parcouru ; une suite de cases que le bruit du décor laisse nues (`SEUIL_DU_DECOR`, le même bruit que la côte) est
 * cassée de loin en loin (`PAS_DES_JALONS`) par une pierre, une touffe ou un rondin (`JALONS`, selon la région), jamais
 * contre un autre jalon. Depuis GD-11 (« Côte amincie », 8 octobre 2026), les marges ne portent plus que ces jalons :
 * le décor que le bruit y posait est retiré, ses cases restent nues, et les jalons gardent leurs places. Rend les jalons
 * par case.
 */
function jalonsDesMarges(def: IslandDef, c: Bornes, sol: Ground): Map<string, Decor> {
  const out = new Map<string, Decor>();
  const duBruit = (x: number, y: number) => {
    const t = tirage(def, x, y);
    const fine = noise(def.seed + 3, t.x, t.y);
    return fine > SEUIL_DU_DECOR && pickDecor(def, sol, 0, fine) !== undefined;
  };
  const genres = JALONS[def.region];
  const cotes: [number, number][][] = [
    Array.from({ length: c.x1 - c.x0 }, (_, k) => [c.x0 + k, c.y0]),
    Array.from({ length: c.x1 - c.x0 }, (_, k) => [c.x0 + k, c.y1 - 1]),
    Array.from({ length: c.y1 - c.y0 }, (_, k) => [c.x0, c.y0 + k]),
    Array.from({ length: c.y1 - c.y0 }, (_, k) => [c.x1 - 1, c.y0 + k]),
  ];
  for (const rangee of cotes) {
    const plein = rangee.map(([x, y]) => duBruit(x, y) || out.has(`${x},${y}`));
    for (let k = 0; k < rangee.length; ) {
      if (plein[k]) {
        k++;
        continue;
      }
      let fin = k;
      while (fin < rangee.length && !plein[fin]) fin++;
      // La suite nue [k, fin) : ses jalons à intervalles à peu près égaux, ni à ses bouts ni l'un contre l'autre.
      // Chacun glisse d'une case au hasard (bruit fixe) et change de genre d'un jalon au suivant : pas de rangée
      // régulière de rondins identiques (DA, 01/10/2026, sur la rangée de devant des Anciens Ateliers). Les glissements
      // gardent moins de `PAS_DES_JALONS` cases nues à la suite ; sinon, les places égales.
      const long = fin - k;
      const n = Math.floor(long / PAS_DES_JALONS);
      const egales = Array.from({ length: n }, (_, j) => k + Math.floor(((j + 1) * long) / (n + 1)));
      // Les glissements (−1, 0 ou +1 par jalon) sont tirés d'un bruit fixe ; le premier tirage qui tient les écarts est gardé.
      const tient = (ps: number[]) =>
        ps.every((p, j) => {
          const avant = j ? ps[j - 1] : k - 1;
          return p > avant + 1 && p < fin - 1 && p - avant - 1 < PAS_DES_JALONS;
        }) && fin - ps[ps.length - 1] - 1 < PAS_DES_JALONS;
      let finales = egales;
      for (let essai = 0; essai < 4 && n > 0; essai++) {
        const ps = egales.map((p) => p + Math.floor(noise(def.seed + 31 + essai, ...toLocalCell(def, rangee[p][0], rangee[p][1])) * 3) - 1);
        if (ps.some((p, j) => p !== egales[j]) && tient(ps)) {
          finales = ps;
          break;
        }
      }
      let precedent = -1;
      for (const p of finales) {
        const [x, y] = rangee[p];
        let g = Math.floor(noise(def.seed + 29, ...toLocalCell(def, x, y)) * genres.length) % genres.length;
        if (g === precedent && genres.length > 1) g = (g + 1) % genres.length;
        precedent = g;
        out.set(`${x},${y}`, genres[g]);
      }
      k = fin;
    }
  }
  return out;
}

/** Distance normalisée au cœur (0 sur le cœur, 1 au bord de la boîte). */
function coreDistance(def: IslandDef, x: number, y: number): number {
  const b = bornesDuCoeur(def);
  const c = { x0: def.core.x + b.x0, y0: def.core.y + b.y0, x1: def.core.x + b.x1, y1: def.core.y + b.y1 };
  const dx = x < c.x0 ? (c.x0 - x) / (def.ext.left + 0.5) : x >= c.x1 ? (x - (c.x1 - 1)) / (def.ext.right + 0.5) : 0;
  const dy = y < c.y0 ? (c.y0 - y) / (def.ext.front + 0.5) : y >= c.y1 ? (y - (c.y1 - 1)) / (def.ext.back + 0.5) : 0;
  return Math.hypot(dx, dy);
}

/**
 * La terre d'une île, calculée une fois (le monde ne change pas de forme en cours de partie) : sa boîte (`landBox`), une
 * case par octet (1 : terre, isthme compris), et la liste de ses cases. `isLand` et `landCells` la lisent : le dessin
 * d'une île (sol, paysage, décor, cascades, gués) demande la terre des milliers de fois, et chaque bloc posé redessine
 * l'archipel (relecture de l'expert frontend, 01/10/2026 : `cubesDeLIle` 2 à 3 fois plus lent avec les cœurs agrandis).
 */
interface TerreDeLIle {
  x0: number;
  y0: number;
  w: number;
  h: number;
  cases: Uint8Array;
  liste: readonly Readonly<{ x: number; y: number }>[];
}
/** La terre de chaque lieu dans son repère (relative à l'origine de son cœur), puis à sa place (`terreDe`). */
const localLands = new Map<BiomeId, TerreDeLIle>();
const placedLands = new Map<BiomeId, { x: number; y: number; terre: TerreDeLIle }>();

/**
 * La terre d'un lieu à sa place (le lieu posé, pas tourné) : calculée une fois dans son repère (le dessin ne dépend pas
 * de la place), puis décalée là où il est posé.
 */
function terreDe(def: IslandDef): TerreDeLIle {
  const posee = placedLands.get(def.id);
  if (posee && posee.x === def.core.x && posee.y === def.core.y) return posee.terre;
  let locale = localLands.get(def.id);
  if (!locale) {
    const t = computeLand(def);
    locale = { ...t, x0: t.x0 - def.core.x, y0: t.y0 - def.core.y, liste: Object.freeze(t.liste.map((c) => Object.freeze({ x: c.x - def.core.x, y: c.y - def.core.y }))) };
    localLands.set(def.id, locale);
  }
  const terre: TerreDeLIle = {
    ...locale,
    x0: locale.x0 + def.core.x,
    y0: locale.y0 + def.core.y,
    liste: Object.freeze(locale.liste.map((c) => Object.freeze({ x: c.x + def.core.x, y: c.y + def.core.y }))),
  };
  placedLands.set(def.id, { x: def.core.x, y: def.core.y, terre });
  return terre;
}

function computeLand(def: IslandDef): TerreDeLIle {
  const { x0, y0, x1, y1 } = landBoxOf(def);
  const w = x1 - x0;
  const h = y1 - y0;
  const cases = new Uint8Array(w * h);
  const liste: Readonly<{ x: number; y: number }>[] = [];
  // (Dans l'ordre d'avant : colonne par colonne.)
  for (let x = x0; x < x1; x++)
    for (let y = y0; y < y1; y++)
      if (isLandProper(def, x, y) || inIsthmus(def, x, y)) {
        cases[(y - y0) * w + (x - x0)] = 1;
        liste.push(Object.freeze({ x, y }));
      }
  return { x0, y0, w, h, cases, liste: Object.freeze(liste) };
}

/**
 * La case (x, y) du monde fait-elle partie de la terre de l'île ? Le cœur toujours ; autour, une côte
 * irrégulière : baies et caps dessinés par un bruit lissé, plus un léger grain. Lu dans la terre calculée (`terreDe`),
 * sans rien allouer.
 */
export function isLand(def: IslandDef, x: number, y: number): boolean {
  const t = terreDe(def);
  const lx = x - t.x0;
  const ly = y - t.y0;
  return lx >= 0 && ly >= 0 && lx < t.w && ly < t.h && t.cases[ly * t.w + lx] === 1;
}

/**
 * La case (x, y) du monde est-elle de la terre du lieu, le lieu tourné (`def.quarts`) ? `isLand` lit le dessin, le lieu
 * posé mais pas tourné ; ce qui regarde le monde (la marche, les liaisons, le toucher) passe par ici.
 */
export function isLandInWorld(def: IslandDef, x: number, y: number): boolean {
  if (!def.quarts) return isLand(def, x, y);
  const l = toPlace(def, x, y);
  return isLand(def, def.core.x + l.x, def.core.y + l.y);
}

/** La terre propre d'une île (sans l'isthme). */
function isLandProper(def: IslandDef, x: number, y: number): boolean {
  if (inCore(def, x, y)) return true;
  if (silhouetteDe(def.id).forme) return dansLaForme(def, x, y);
  const b = bornesDuCoeur(def);
  const x0 = def.core.x + b.x0 - def.ext.left;
  const y0 = def.core.y + b.y0 - def.ext.front;
  const x1 = def.core.x + b.x1 + def.ext.right;
  const y1 = def.core.y + b.y1 + def.ext.back;
  if (x < x0 || x >= x1 || y < y0 || y >= y1) return false;
  const d = coreDistance(def, x, y);
  const t = tirage(def, x, y);
  const coast = (smoothNoise(def.seed, t.x, t.y, 5) - 0.5) * 0.7 + (noise(def.seed + 1, t.x, t.y) - 0.5) * 0.15;
  return d + coast < 0.92;
}

/** Toutes les cases de terre d'une île, colonne par colonne (calculées une fois, à ne pas modifier). */
export function landCells(def: IslandDef): readonly Readonly<{ x: number; y: number }>[] {
  return terreDe(def).liste;
}

/** Nature du sol d'une case hors du cœur. */
export type Ground = 'herbe' | 'sable' | 'roche' | 'neige' | 'eau' | 'lave' | 'glace' | 'basalte' | 'mousse';

/** Un élément de décor posé sur la terre autour du cœur. */
export type Decor = 'arbre' | 'sapin' | 'buisson' | 'fleur' | 'rocher' | 'roseau' | 'cristal' | 'souche' | 'champignon';

export interface LandCell {
  x: number;
  y: number;
  /** Hauteur du sol au-dessus de l'altitude de l'île (négatif : creux d'un lac ou d'un cratère). */
  h: number;
  ground: Ground;
  decor?: Decor;
}

/**
 * Les pics d'une île, à sa place dans le monde : son relief, écrit en repère d'île autour du cœur d'origine
 * (./silhouettes/), repoussé avec la côte autour du cœur agrandi (comme `tirage`, dans l'autre sens).
 */
function peaks(def: IslandDef): { x: number; y: number; h: number; r: number }[] {
  const b = bornesDuCoeur(def);
  return silhouetteDe(def.id).pics.map((p) => ({ x: def.core.x + autourDuCoeur(p.x, b.x0, b.x1), y: def.core.y + autourDuCoeur(p.y, b.y0, b.y1), h: p.h, r: p.r }));
}

/** Une coordonnée autour du cœur d'origine [0, `CORE`) portée autour du cœur agrandi [`debut`, `fin`) : l'inverse de `aLaPlaceDOrigine`. */
function autourDuCoeur(rel: number, debut: number, fin: number): number {
  if (rel < 0) return rel + debut;
  if (rel >= CORE) return rel - CORE + fin;
  return debut + (rel * (fin - debut)) / CORE;
}

/**
 * Les lacs dessinés à la main (en cases relatives au coin du cœur ; `x`, `y` le coin, `w` × `d`) : le lac d'altitude du
 * Refuge des carnets (DA, LV2-5), sur l'herbe, loin du bord, derrière le cœur, à gauche de la poste dans la vue de
 * l'île, bordé d'une rangée de pierre plate (la roche, au ras du sol : pas de ponton), puis d'une rive d'herbe nue. Sur une île qui a son lac, le hasard n'en creuse pas d'autre.
 * Trois rangées plus au fond depuis que le cœur a grandi de trois cases (GD-11) : il reste derrière le cœur.
 */
export const LACS: Partial<Record<BiomeId, { x: number; y: number; w: number; d: number }>> = {
  'lv2-3e-travel': { x: 6, y: 20, w: 4, d: 2 },
};

/**
 * La place d'une case par rapport au lac dessiné de son île : dedans, sur sa bordure de pierre, sur la rive d'herbe nue
 * qui l'entoure (aucun arbre ne le cache à la caméra de l'île), ou ailleurs.
 */
function auLac(def: IslandDef, x: number, y: number): 'lac' | 'bord' | 'rive' | null {
  const l = LACS[def.id];
  if (!l) return null;
  const [dx, dy] = [x - def.core.x, y - def.core.y];
  const dans = (m: number) => dx >= l.x - m && dx < l.x + l.w + m && dy >= l.y - m && dy < l.y + l.d + m;
  return dans(0) ? 'lac' : dans(1) ? 'bord' : dans(2) ? 'rive' : null;
}

const landscapes = new PlaceCells<LandCell>((def) => computeLandscape(def));

/**
 * Le paysage d'une île : chaque case de terre hors du cœur avec sa hauteur, son sol et son décor (mémorisé dans le
 * repère du lieu ; le lieu posé, pas tourné).
 */
export function landscape(def: IslandDef): LandCell[] {
  return landscapes.de(def);
}

function computeLandscape(def: IslandDef): LandCell[] {
  const cells = landCells(def);
  const forme = silhouetteDe(def.id).forme !== undefined;
  const isLandAt = (x: number, y: number) => isLand(def, x, y);
  const pk = peaks(def);
  const out: LandCell[] = [];
  for (const c of cells) {
    if (inCore(def, c.x, c.y)) continue;
    const t = tirage(def, c.x, c.y);
    const n = smoothNoise(def.seed + 7, t.x, t.y, 4);
    const fine = noise(def.seed + 3, t.x, t.y);
    const edge = !isLandAt(c.x - 1, c.y) || !isLandAt(c.x + 1, c.y) || !isLandAt(c.x, c.y - 1) || !isLandAt(c.x, c.y + 1);
    // Près du cœur : la première rangée de côte autour de lui, quelle que soit la largeur de la côte (amincie par GD-11),
    // et plus loin sur une côte large ; on y monte d'une marche au plus depuis le cœur.
    const nearCore = coreDistance(def, c.x, c.y) < 0.35 || [-1, 0, 1].some((dx) => [-1, 0, 1].some((dy) => inCore(def, c.x + dx, c.y + dy)));
    if (inIsthmus(def, c.x, c.y)) {
      // L'isthme : une bande plate qui relie deux îles, herbe et sable au bord, quelques buissons.
      const sandy = edge && def.altitude === 0 && def.region !== 'feu';
      const ground: Ground = sandy ? 'sable' : solAPlat(def);
      out.push({ x: c.x, y: c.y, h: 0, ground, decor: !edge && fine > 0.8 ? pickDecor(def, ground, 0, fine) : undefined });
      continue;
    }
    // Hauteur : collines douces, puis les pics par-dessus. Une île qui a sa forme (GD-12) a une côte plate (« autour,
    // plus de terre plate ») : ses pics dessinés seuls la soulèvent. (Garder le relief d'avant près du cœur coûte
    // 3 000 triangles de plus au sol d'Archipéo, au-delà de son enveloppe, 8 octobre 2026.)
    const nouvelle = terreNouvelle(def, c.x, c.y);
    let h = forme ? 0 : def.relief === 'plat' ? (n > 0.8 ? 1 : 0) : Math.min(2, Math.floor(n * 3));
    let crater = false;
    for (const p of pk) {
      const d = Math.hypot(c.x - p.x, c.y - p.y) / p.r;
      if (d < 1) {
        const ph = Math.round(p.h * (1 - d * d));
        if (def.relief === 'volcan' && d < 0.3) {
          crater = true;
          h = Math.max(h, p.h - 2);
        } else h = Math.max(h, ph);
      }
    }
    if (edge) h = Math.min(h, 1);
    if (nearCore) h = Math.min(h, 1);
    // Sol.
    let ground: Ground = 'herbe';
    if (def.region === 'feu') ground = 'basalte';
    else if (def.region === 'hauteurs') ground = h > 0 ? 'roche' : 'herbe';
    else if (def.region === 'marais') ground = 'mousse';
    if (def.id === 'maths-5e-signed-numbers') ground = 'glace';
    if (h >= 3) ground = def.region === 'feu' ? 'basalte' : 'roche';
    if (h >= 5 && def.region !== 'feu') ground = 'neige';
    if (def.id === 'maths-5e-signed-numbers' && h >= 2) ground = 'neige';
    if (crater) ground = 'lave';
    if (edge && def.altitude === 0 && h === 0 && def.region !== 'feu') ground = 'sable';
    // Lacs et mares : dans un creux, loin du bord et du cœur ; le lac dessiné d'une île, et sa bordure de pierre.
    let decor: Decor | undefined;
    const lac = auLac(def, c.x, c.y);
    if (lac === 'lac') {
      out.push({ x: c.x, y: c.y, h: 0, ground: 'eau' });
      continue;
    }
    if (lac === 'bord' || lac === 'rive') {
      out.push({ x: c.x, y: c.y, h: 0, ground: lac === 'bord' ? 'roche' : 'herbe' });
      continue;
    }
    if (!LACS[def.id] && !edge && !nearCore && h === 0 && smoothNoise(def.seed + 11, t.x, t.y, 3) > 0.78 && def.relief !== 'volcan') {
      ground = 'eau';
      h = -1;
    } else if (h <= 2 && !edge && fine > SEUIL_DU_DECOR && (!forme || noise(def.seed + 13, t.x, t.y) < PART_DU_DECOR_D_UNE_FORME[nouvelle ? 'nouvelle' : 'cote'])) {
      decor = pickDecor(def, ground, h, fine);
    }
    out.push({ x: c.x, y: c.y, h, ground, decor });
  }
  return out;
}

function pickDecor(def: IslandDef, ground: Ground, h: number, r: number): Decor | undefined {
  if (ground === 'eau' || ground === 'lave' || ground === 'sable') return undefined;
  const t = (r - SEUIL_DU_DECOR) / (1 - SEUIL_DU_DECOR); // 0..1
  switch (def.region) {
    case 'basses-terres':
      return t > 0.8 ? 'arbre' : t > 0.55 ? 'buisson' : t > 0.42 ? 'fleur' : t > 0.34 ? 'champignon' : undefined;
    case 'marais':
      return t > 0.85 ? 'arbre' : t > 0.5 ? 'roseau' : t > 0.3 ? 'champignon' : undefined;
    case 'feu':
      return t > 0.85 ? 'souche' : t > 0.6 ? 'rocher' : undefined;
    case 'montagne':
      if (ground === 'neige' || ground === 'glace') return t > 0.85 ? 'rocher' : undefined;
      return t > 0.75 ? 'sapin' : t > 0.55 ? 'rocher' : t > 0.4 && h === 0 ? 'fleur' : undefined;
    case 'hauteurs':
      return t > 0.8 ? 'cristal' : t > 0.6 ? 'rocher' : t > 0.45 && h === 0 ? 'sapin' : undefined;
  }
}

/** Hauteur du sol hors du cœur (compatibilité : la même que dans `landscape`). */
export function reliefHeight(def: IslandDef, x: number, y: number): number {
  if (inCore(def, x, y)) return 0;
  const cell = landscape(def).find((c) => c.x === x && c.y === y);
  return cell ? Math.max(0, cell.h) : 0;
}

