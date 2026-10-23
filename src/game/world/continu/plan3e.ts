// Le plan du 3e en données (lot 1 du monde ouvert du 3e, « les Îles du Ciel en grandes masses » ; fiche du niveau
// décidée le 21 octobre 2026, noms validés par le mainteneur le 22 octobre 2026) : une montagne seule qui perce une mer
// de nuages, son pic de neige au centre, et à son flanc est trois îles plates posées sur les nuages, les Prairies. On
// marche sur quatre sols à la même hauteur, juste au-dessus des nuages : au sud, le Versant (le départ, avec le Parvis) ;
// à l'ouest, au-delà de la langue de glace, les Alpages ; à l'est, au-delà des nuages, les Prairies, reliées par les
// arches basses ; au nord, au-delà de l'arête est, le Cirque, le creux sous le pic où se tient le Fanal. Relevé sur le
// plan des lieux (archipeo/univers-challenge/niveaux/3e/plan-3e.png, et plan/lieux3e.py pour les coordonnées, dans la
// Bibliothèque du projet) et la fiche du niveau (fiche-3e.md, § 4 et § 5) : les seize lieux, les quatre terres et leurs
// passages, le réseau des chemins, le Parvis, les places réservées des Détours et des grands projets, le zeppelin des
// Ferrailleurs. Les points sont écrits en pixels du plan (2 200 × 1 500), pour se relire contre l'image, et convertis en
// unités du monde (`fromPlan3e`). Code pur.
import { closestOnSegment, distance, type Vec2 } from './geometry';
import type { Land } from './lands';
import type { PathNode } from './network';
import { portNode, type OpenPlace } from './plan6e';

/** Pixels du plan par unité du monde, comme au 4e : la montagne fait environ 370 unités d'est en ouest. */
const PLAN_SCALE = 3.6;
/** Le point du plan qui est l'origine du monde : entre la montagne et les Prairies, au nord-est du Belvédère. */
const PLAN_ORIGIN = { x: 1100, y: 640 };

/** Un point du plan du 3e (en pixels de l'image) en unités du monde. */
const fromPlan3e = ([px, py]: readonly [number, number]): Vec2 => ({ x: (px - PLAN_ORIGIN.x) / PLAN_SCALE, z: (py - PLAN_ORIGIN.y) / PLAN_SCALE });

const poly = (points: readonly (readonly [number, number])[]): Vec2[] => points.map(fromPlan3e);

/**
 * Les couleurs du 3e (fiche, § 2) : un monde froid et clair, le blanc des nuages, le granit bleuté, l'ardoise des rives,
 * l'herbe rase pâle, une seule couleur vive (l'émail cobalt) ; jamais de lavande, jamais de presque-noir. La mer de
 * nuages est teintée contre l'éblouissement (`cloud`, #E4EAF1, choisie par le directeur artistique à la relecture du lot
 * 1, plutôt que le blanc franc ; un cran plus bleu-gris, #DDE5EF, aux restes du 3e, sur l'avis du référent dys) ; la neige du pic et des toits n'est jamais plus blanche qu'elle.
 */
export const COLORS_3E = {
  /** La mer de nuages, le sol du ciel : teintée (avis dys, point 3). */
  cloud: 0xdde5ef,
  /** L'ombre des nuages au pied des rives. */
  cloudShade: 0xbccbde,
  /** Le granit des Passeurs (arches, murets, socles, le haut du cône), au soleil et à l'ombre. */
  granite: 0x7a859c,
  graniteSun: 0x8a95ab,
  graniteShade: 0x6b7690,
  /** L'ardoise : le liseré des rives, les contours, les toits. */
  slate: 0x34496b,
  slateTop: 0x435a7e,
  /** L'herbe rase, froide et pâle, au soleil et à l'ombre. */
  grass: 0x8ba862,
  grassSun: 0x97b46c,
  grassShade: 0x7c9856,
  /** L'herbe du Cirque, plus grise : le creux sous le pic, entre les éboulis. */
  cirque: 0x93a283,
  cirqueSun: 0x9dac8c,
  /** La neige du pic et des toits, au soleil et à l'ombre : au soleil, le ton des nuages, jamais plus blanc. */
  snow: 0xdde5ef,
  snowShade: 0xbfcde0,
  /** La langue de glace : mate, pâle, sans reflet. */
  ice: 0xd2e0ec,
  iceShade: 0xbccddd,
  /** La pierre claire du Parvis. */
  parvis: 0xd9d4c7,
  /** L'émail cobalt, la seule couleur vive (coupoles, pavois). */
  cobalt: 0x2e5fae,
  /** Le bois gris des Passeurs, et son ombre. */
  wood: 0x9a8a78,
  woodShade: 0x7e705f,
  /** Le bronze des ferrures. */
  bronze: 0xa77b3f,
  /** Les pins des pentes, et leur ombre. */
  pine: 0x5f7a5a,
  pineShade: 0x52694e,
  /**
   * Le graphite et la prune des Ferrailleurs (le zeppelin) ; un cran plus clairs qu'au lot 1 (#4A4D55, #5A5E68, #6E4A63) :
   * de profil, le flanc à l'ombre se lisait presque noir (lot des Prairies).
   */
  graphite: 0x666a74,
  graphiteSun: 0x777c87,
  prune: 0x7a5470,
  /** La lanterne fixe, or blanc. */
  lantern: 0xffe6a6,
} as const;

/** Le bord de la montagne, l'unique île où l'on marche à pied (plan, `MOUNTAIN`), dans le sens des aiguilles d'une montre. */
export const MOUNTAIN_3E = poly([
  [130, 430], [180, 260], [300, 130], [470, 60], [720, 30], [1000, 30], [1220, 80], [1360, 160], [1450, 260],
  // La rive du départ des arches basses (lot des Prairies ; directeur artistique, lot 1, point 11) : une seule courbe
  // douce, sans l'anse au nord de la chaussée dont les liserés s'empilaient en gradins vus des arches.
  [1442, 420], [1422, 560], [1404, 660], [1404, 712], [1406, 766], [1385, 820], [1320, 855], [1240, 905], [1170, 1020], [1030, 1100],
  // L'anse de nuages à l'est du Parvis (lot du Versant, directeur artistique, point 8, et consultant, point 2 : « rapprocher
  // le bord est du Parvis de sa rive sud-est ») : le Parvis devient un promontoire, et la mer de nuages entre dans le
  // quart droit de l'arrivée.
  [975, 1090], [900, 1050], [800, 1000], [715, 990], [688, 1010], [668, 1062], [650, 1135], [520, 1115], [440, 1045], [440, 955],
  [400, 885], [300, 810], [190, 710], [120, 570],
]);

/** Les écarts du bord d'une table de roche, autour de son ellipse (plan, `blob`) : aucune pointe étroite. */
const BLOB_JITTER = [1.0, 0.93, 1.04, 0.96, 1.02, 0.95, 1.05, 0.97, 1.0, 0.94, 1.03] as const;

/** Une table de roche aux bords arrondis (plan, `blob`) : son centre et ses demi-axes en pixels, onze côtés. */
function blob(c: readonly [number, number], r: readonly [number, number]): Vec2[] {
  const n = BLOB_JITTER.length;
  return poly(
    Array.from({ length: n }, (_, i) => {
      const a = (2 * Math.PI * i) / n + 0.2;
      return [c[0] + r[0] * BLOB_JITTER[i] * Math.cos(a), c[1] + r[1] * BLOB_JITTER[i] * Math.sin(a)] as const;
    }),
  );
}

/**
 * Les trois Prairies (fiche, § 5 : « trois tables vertes et plates, immobiles sur les nuages ») : la plus grande (le
 * Palais), la deuxième (la Coupole, la Lutherie), la plus petite (les Ondes, le Cèdre). Leurs racines de pierre ne se
 * voient jamais : les nuages montent contre leur liseré (choix des images, 22 octobre 2026).
 */
export const PRAIRIES_3E = {
  grande: blob([1700, 640], [175, 135]),
  deuxieme: blob([1930, 960], [165, 110]),
  petite: blob([1580, 1030], [120, 85]),
} as const;

/** Le bord de toutes les terres, pour la Carte : la montagne et les Prairies. */
export const COAST_3E: readonly Vec2[] = [...MOUNTAIN_3E, ...PRAIRIES_3E.grande, ...PRAIRIES_3E.deuxieme, ...PRAIRIES_3E.petite];

/**
 * Le pic, qu'on ne visite pas (fiche, § 5) : une pyramide de neige à `sides` faces, au centre de la montagne. `at` : son
 * sommet au sol ; `radius` : le rayon de sa base (jusqu'à ses arêtes) ; `height` : son sommet ; `base` : sa base,
 * enfoncée dans le haut du cône ; `yaw` : le cap de sa première arête. Le haut du cône, en granit, va jusqu'à `granite`
 * unités de lui, à peine au-delà du pied du pic : l'herbe monte haut sur le cône, le granit nu reste au pied du pic et
 * aux arêtes (lot 1, retouche 1, « Reporté » ; le Cirque, 46 auparavant) ; on ne marche pas à moins de `blocked`. Le flanc monte doucement de `flank.outer` à `flank.inner`.
 */
export const PEAK_3E = {
  at: fromPlan3e([900, 380]),
  radius: 30,
  height: 62,
  base: 3.5,
  sides: 4,
  yaw: 0.3,
  granite: 35,
  blocked: 42,
  flank: { height: 7, inner: 30, outer: 62 },
} as const;

/**
 * Les trois coupures vraies, chacune du pic à la mer de nuages (fiche, § 5) : l'arête ouest (les Alpages / le Cirque),
 * l'arête est (le Versant / le Cirque), la langue de glace (les Alpages / le Versant).
 */
export const ARETE_OUEST_3E = poly([[900, 380], [800, 330], [700, 280], [600, 230], [480, 160], [380, 60], [330, 0]]);
export const ARETE_EST_3E = poly([[900, 380], [960, 370], [1090, 350], [1230, 310], [1460, 255], [1560, 230]]);
export const LANGUE_3E = poly([[900, 380], [870, 430], [780, 510], [670, 600], [560, 700], [470, 790], [395, 875], [330, 935]]);

/**
 * Les arêtes (artiste technique 3D) : leur demi-largeur au sol ; leur crête au bord des nuages (`low`) et au pied du pic
 * (`high`), et en combien d'unités elle tombe de l'un à l'autre (`fall`). Au col de l'arête est, la galerie : la crête y
 * descend au sol (`col` : nulle à moins de `col[0]` unités de la galerie, pleine au-delà de `col[1]`), côté pic ; côté
 * nuages, elle remonte contre le mur plein de la galerie (`colEast`), qui se lit creusée dans l'arête (proposition du
 * Cirque, § 2 ; sélection du Cirque, « l'arête la traverse »), ses arcades ouvertes côté pic.
 */
export const ARETES_3E = { halfWidth: 5, low: 3.2, high: 16, fall: 22, col: [7, 15] as const, colEast: [3.4, 6.5] as const } as const;

/** La langue de glace : sa demi-largeur ; elle est à plat, au niveau des prairies, un rien plus bas (`sink`). */
export const LANGUE_LOOK_3E = { halfWidth: 4.6, sink: 0.15 } as const;

/** Le col de l'arête est, où passe la galerie (plan, `GALLERY`). */
export const COL_3E = fromPlan3e([1090, 350]);

/**
 * Le Cirque, en plan (plan, `CIRQUE`) : au nord des deux arêtes. Son herbe est plus grise ; une levée douce longe sa rive
 * nord, si bien qu'il se lit en creux sous le pic (choix des images : « un creux sous le pic, pas un piton à falaises »).
 */
export const CIRQUE_AREA_3E = poly([[330, 0], [380, 60], [480, 160], [600, 230], [700, 280], [800, 330], [900, 380], [960, 370], [1090, 350], [1230, 310], [1460, 255], [1560, 230], [1560, 0]]);

/** La distance d’un point à une ligne brisée, et sa place le long d'elle (en unités depuis son premier point). */
export function alongPolyline(p: Vec2, line: readonly Vec2[]): { d: number; s: number } {
  let best = { d: Infinity, s: 0 };
  let run = 0;
  for (let i = 1; i < line.length; i++) {
    const a = line[i - 1],
      b = line[i];
    const c = closestOnSegment(p, a, b);
    const d = distance(p, c.point);
    const len = distance(a, b);
    if (d < best.d) best = { d, s: run + c.t * len };
    run += len;
  }
  return best;
}

/** Les coupures qu'on relie, par leur nom : la langue de glace, le col de l'arête est, la mer de nuages. */
export type Cut3e = 'glace' | 'col' | 'nuages';

/** Les lieux du 3e : leurs identifiants restent neutres, sans accent (ceux des modèles `3e-habitant-<id>`). */
export type PlaceId3e =
  | 'belvedere'
  | 'grenier'
  | 'abri'
  | 'jardin'
  | 'fanal'
  | 'rampe'
  | 'standard'
  | 'kiosque'
  | 'maquette'
  | 'tribune'
  | 'douane'
  | 'ermitage'
  | 'coupole'
  | 'lutherie'
  | 'ondes'
  | 'palais';

/** Un lieu : son centre sur le plan (en pixels), et sa porte depuis lui (en unités). */
interface PlaceSpec extends Omit<OpenPlace<PlaceId3e>, 'center' | 'door' | 'scenes' | 'yaw' | 'touchRadius' | 'mapSide'> {
  plan: [number, number];
  door: Vec2;
}

/**
 * Les seize lieux (fiche, § 4, noms validés le 22 octobre 2026), à leur place sur le plan. Le Grenier et la Lutherie
 * sont nouveaux, lieux du monde ouvert seulement (GD-24) : leurs missions sont écrites (`docs/contenu/maths-3e-numbers.md`,
 * `french-3e-language.md`). Seuls les lieux construits (`BUILT_PLACES_3E`) ont leur scénette ; les missions des autres
 * passent par l'écran habituel.
 */
const PLACE_SPECS: readonly PlaceSpec[] = [
  { id: 'belvedere', name: 'Le Belvédère', at: 'au Belvédère', agree: 'ms', island: 'maths-3e-geometry', plan: [1290, 760], door: { x: 8.8, z: 5.9 } },
  { id: 'grenier', name: 'Le Grenier', at: 'au Grenier', agree: 'ms', island: 'maths-3e-numbers', plan: [1150, 830], door: { x: -6.3, z: 6.8 } },
  { id: 'abri', name: 'L’Abri', at: 'à l’Abri', agree: 'ms', island: 'maths-3e-statistics', plan: [900, 620], door: { x: -0.3, z: 10.1 } },
  { id: 'jardin', name: 'Le Jardin', at: 'au Jardin', agree: 'ms', island: 'life-earth-sciences-3e-human-body', plan: [1010, 960], door: { x: -3, z: 9.3 } },
  { id: 'fanal', name: 'Le Fanal', at: 'au Fanal', agree: 'ms', island: 'maths-3e-functions', plan: [985, 175], door: { x: 0, z: 9 } },
  { id: 'rampe', name: 'La Rampe', at: 'à la Rampe', agree: 'fs', island: 'physics-chemistry-3e-motion-energy', plan: [1065, 225], door: { x: 1, z: 0 } },
  { id: 'standard', name: 'Le Standard', at: 'au Standard', agree: 'ms', island: 'technology-3e-digital', plan: [790, 190], door: { x: 8, z: 4 } },
  { id: 'kiosque', name: 'Le Kiosque', at: 'au Kiosque', agree: 'ms', island: 'history-3e-twentieth-century', plan: [430, 480], door: { x: 7, z: 10 } },
  { id: 'maquette', name: 'La Maquette', at: 'à la Maquette', agree: 'fs', island: 'geography-3e-france', plan: [350, 650], door: { x: 6.5, z: -10 } },
  { id: 'tribune', name: 'La Tribune', at: 'à la Tribune', agree: 'fs', island: 'civics-3e-democratic-life', plan: [580, 400], door: { x: -10, z: 8.4 } },
  { id: 'douane', name: 'La Douane', at: 'à la Douane', agree: 'fs', island: 'lv2-3e-travel', plan: [200, 400], door: { x: 5.3, z: 9.6 } },
  { id: 'ermitage', name: 'L’Ermitage', at: 'à l’Ermitage', agree: 'ms', island: 'lca-3e-ideas', plan: [215, 580], door: { x: 8.8, z: -4.7 } },
  { id: 'coupole', name: 'La Coupole', at: 'à la Coupole', agree: 'fs', island: 'french-3e-close-reading', plan: [1870, 945], door: { x: 6.5, z: 9 } },
  { id: 'lutherie', name: 'La Lutherie', at: 'à la Lutherie', agree: 'fs', island: 'french-3e-language', plan: [2000, 1000], door: { x: 8.5, z: -1.5 } },
  { id: 'ondes', name: 'Les Ondes', at: 'aux Ondes', agree: 'fp', island: 'english-3e-comprehension', plan: [1535, 1045], door: { x: 7.5, z: -5.2 } },
  { id: 'palais', name: 'Le Palais', at: 'au Palais', agree: 'ms', island: 'english-3e-grammar', plan: [1680, 605], door: { x: 1.7, z: 11 } },
];

/** Le rayon de toucher d'un lieu du 3e : large, rien de précis à viser. */
const TOUCH_RADIUS = 7;

/**
 * Sur la Carte, le côté où le nom de chaque lieu se pose d'abord, comme sur le plan des lieux : à droite le plus souvent ;
 * à gauche pour le Standard et la Douane, à l'ouest du plan, et les Ondes ; dessous pour la Coupole et la Lutherie, au
 * bord est, et pour le Fanal, sous le bord nord.
 */
const MAP_SIDES_3E: Readonly<Record<PlaceId3e, 'below' | 'left' | 'right'>> = {
  belvedere: 'below',
  grenier: 'left',
  abri: 'right',
  jardin: 'right',
  fanal: 'below',
  rampe: 'right',
  standard: 'left',
  kiosque: 'right',
  maquette: 'below',
  tribune: 'right',
  douane: 'below',
  ermitage: 'below',
  coupole: 'below',
  lutherie: 'below',
  ondes: 'below',
  palais: 'below',
};

/**
 * Les lieux du 3e déjà construits, et les missions de chacun qui se jouent en scénette, dans l'ordre de leur île : la
 * seule liste, comme `BUILT_PLACES_4E` (./plan4e.ts), que lisent la scénette (./levelPlan.ts, `hasScenette`) et les
 * missions des lieux (`PLACES_3E`). Le Versant (GD-25, lot 2) : le Belvédère, le Grenier, l'Abri, le Jardin ; les Alpages (lot 3) : le Kiosque, la Maquette, la Tribune, la Douane, l'Ermitage ; les Prairies (lot 4) : le Palais, la Coupole, la Lutherie, les Ondes ; le Cirque : le Fanal, la Rampe, le Standard. Chaque habitant du 3e a son modèle
 * 3D (./habitants.ts, `hasHabitantModel`), montré dans sa scénette à la place de son pion. Un lieu construit s'ajoute ici, et seulement ici.
 */
export const BUILT_PLACES_3E = {
  belvedere: ['pythagoras', 'thales', 'trigonometry', 'scaling', 'transformations'],
  grenier: ['power-rules', 'square-equations', 'prime-factors', 'identities', 'zero-product'],
  abri: ['mean', 'probability', 'data', 'ratio-sharing'],
  jardin: ['effort-brain', 'digestion-microbes', 'puberty-reproduction'],
  kiosque: ['total-wars', 'world-since-1945', 'republic'],
  maquette: ['territories', 'planning', 'france-eu'],
  tribune: ['constitution', 'information', 'civic-engagement'],
  ermitage: ['la-empire', 'la-provinces', 'la-heritage', 'gr-myth-history', 'gr-greek-world', 'gr-heritage'],
  douane: ['es-past', 'es-stories', 'es-countries', 'es-connectives', 'es-media', 'de-past', 'de-stories', 'de-on-the-road', 'de-connectives', 'de-media'],
  palais: ['for-since', 'if', 'passive', 'messages'],
  coupole: ['inference', 'figures-of-speech', 'text-connectives', 'voices', 'literary-eras'],
  lutherie: ['verb-moods', 'complex-agreements', 'connotation', 'emphasis-punctuation', 'verb-stems'],
  ondes: ['understanding', 'linking-words', 'false-friends', 'media'],
  fanal: ['images', 'linear', 'graphs', 'proportions', 'coordinates'],
  rampe: ['motion-forces', 'energy-power', 'acids-bases'],
  standard: ['computer-networks', 'connected-objects', 'algorithms', 'data-tables'],
} as const satisfies Partial<Record<PlaceId3e, readonly string[]>>;

/** Un lieu du 3e déjà construit. */
export type BuiltPlace3e = keyof typeof BUILT_PLACES_3E;

/** Ce lieu du 3e est-il construit ? */
export const isBuiltPlace3e = (id: string): id is BuiltPlace3e => Object.hasOwn(BUILT_PLACES_3E, id);

const SCENES_3E: Partial<Record<PlaceId3e, readonly string[]>> = BUILT_PLACES_3E;

export const PLACES_3E: readonly OpenPlace<PlaceId3e>[] = PLACE_SPECS.map((s) => ({
  id: s.id,
  name: s.name,
  at: s.at,
  agree: s.agree,
  island: s.island,
  scenes: SCENES_3E[s.id] ?? [],
  center: fromPlan3e(s.plan),
  yaw: 0,
  door: s.id,
  touchRadius: TOUCH_RADIUS,
  mapSide: MAP_SIDES_3E[s.id],
}));

/**
 * Les lieux en option, hors du prix de leur terre (fiche, § 5 : « les lieux en option hors du prix, comme la Veillée et la
 * Basilique au 4e ») : la Douane et l'Ermitage, au bord des Alpages.
 */
export const UNPRICED_PLACES_3E: readonly PlaceId3e[] = ['douane', 'ermitage'];

/** La hauteur de la pierre du Parvis : la place et le bout où l'on arrive, au même niveau, juste au-dessus du sol. */
export const PARVIS_LEVEL = 1.9;

/** Un repère à plat : son origine, son cap ; `toWorld` et `toLocal` passent de l'un à l'autre (comme `PORT`). */
export interface Frame3e {
  readonly origin: Vec2;
  readonly yaw: number;
  toWorld(lx: number, lz: number): Vec2;
  toLocal(p: Vec2): Vec2;
}

/** Le repère tourné de `yaw` d'origine `origin`. */
function frameOf(origin: Vec2, yaw: number): Frame3e {
  const c = Math.cos(yaw),
    s = Math.sin(yaw);
  return {
    origin,
    yaw,
    toWorld: (lx, lz) => ({ x: origin.x + lx * c + lz * s, z: origin.z - lx * s + lz * c }),
    toLocal: (p) => {
      const dx = p.x - origin.x,
        dz = p.z - origin.z;
      return { x: dx * c - dz * s, z: dx * s + dz * c };
    },
  };
}

/**
 * Le Parvis, le débarcadère (fiche, § 5) : un promontoire large de pierre claire, au sud-ouest, posé au sol, sans
 * pilotis (choix des images). Son repère est celui de l'Escale (plan6e.ts, `PORT`) : la Maison des Savoirs, la Galerie
 * des Merveilles et l'Entrepôt en rangée au nord de la place, leurs façades tournées vers le sud (`x` le long de la
 * rangée, `z` de leur dos vers la place). L'aire de la Nef, un disque de pierre cerclé de métal, au milieu de la place ;
 * Kéo arrive à côté d'elle (`PARVIS_QUAY_SPOT`), et la caméra regarde le nord-est : le Belvédère et le pic. Le lieu
 * entier vient avec son lot (lot 3).
 */
export const PARVIS = frameOf(fromPlan3e([487, 961]), 0);

/** Où Kéo se tient à l'arrivée, dans le repère du Parvis : à l'est de l'aire de la Nef. */
export const PARVIS_QUAY_SPOT: readonly [number, number] = [12, 27];

/**
 * La place ronde du Parvis (lot du Versant ; directeur artistique, lot 1, point 8, et relecture des lieux, point 21) : une
 * table de pierre claire presque ronde, à `sides` pans, dans son repère (son milieu, ses demi-axes). Un muret plein la
 * borde du côté des rives (`wall` : les pans, comptés depuis l'est dans le sens des aiguilles d'une montre vu d'en haut,
 * du sud-est au nord-ouest, jusqu'aux bâtiments), à hauteur de poitrine de Kéo, son chaperon d'ardoise ; il ne s'ouvre
 * nulle part. Côté montagne (au nord-est et à l'est) et face à l'anse (au sud-est, où l'herbe et une grève séparent la place
 * des nuages : la caméra d'arrivée y voit la bande de nuages sans regarder par-dessus le muret, point 21), la place rejoint
 * l'herbe par une bordure d'ardoise basse, sans marche.
 */
export const PARVIS_ROUND = { center: { x: 18, z: 18.5 }, rx: 26, rz: 13.5, sides: 12, wall: { from: 2, to: 8 } } as const;

/** Les coins de la place ronde, dans son repère, depuis l'est, dans le sens des aiguilles d'une montre vu d'en haut. */
export const PARVIS_CORNERS: readonly Vec2[] = Array.from({ length: PARVIS_ROUND.sides }, (_, k) => {
  const a = (2 * Math.PI * k) / PARVIS_ROUND.sides;
  return { x: PARVIS_ROUND.center.x + PARVIS_ROUND.rx * Math.cos(a), z: PARVIS_ROUND.center.z + PARVIS_ROUND.rz * Math.sin(a) };
});

/**
 * Le pavage du Parvis, dans son repère : le bout où l'on arrive, à côté de l'aire, et la boîte de la place ronde
 * (`PARVIS_ROUND`, que lisent la flore et le toucher du lieu de départ).
 */
export const PARVIS_PAVING = {
  quay: { x0: PARVIS_QUAY_SPOT[0] - 3, x1: PARVIS_QUAY_SPOT[0] + 3, z0: PARVIS_QUAY_SPOT[1] - 2, z1: PARVIS_QUAY_SPOT[1] + 2 },
  square: { x0: PARVIS_ROUND.center.x - PARVIS_ROUND.rx, x1: PARVIS_ROUND.center.x + PARVIS_ROUND.rx, z0: PARVIS_ROUND.center.z - PARVIS_ROUND.rz, z1: PARVIS_ROUND.center.z + PARVIS_ROUND.rz },
} as const;

/** Les bâtiments du Parvis dans son repère : la marche libre les contourne. */
export const PARVIS_BUILDINGS = { x0: 3.6, x1: 38.4, z0: 1.1, z1: 6.4 } as const;

/**
 * L'aire de la Nef, dans le repère du Parvis : son centre, son rayon, la hauteur de sa pierre (posée sur la place) ; à
 * près de huit unités du muret (proposition du Versant, § 2) et des façades ; à l'ouest du milieu de la place, pour que la
 * caméra d'arrivée, au téléphone en paysage, ne coupe pas l'aéronef (relecture des lieux, point 21).
 */
export const PARVIS_PAD = { center: { x: 10, z: 18.8 }, radius: 4.5, deck: PARVIS_LEVEL + 0.08 } as const;

const PARVIS_COS = Math.cos(PARVIS.yaw);
const PARVIS_SIN = Math.sin(PARVIS.yaw);

/**
 * La pierre du Parvis sous un point du monde (`x`, `z`), ou rien hors de son pavage : Kéo s'y tient, au-dessus du sol.
 * Lue à chaque image : rien n'y est créé.
 */
export function parvisFloor(x: number, z: number): number | null {
  const dx = x - PARVIS.origin.x,
    dz = z - PARVIS.origin.z;
  const lx = dx * PARVIS_COS - dz * PARVIS_SIN;
  const lz = dx * PARVIS_SIN + dz * PARVIS_COS;
  const { quay: q } = PARVIS_PAVING;
  const inside = (lx >= q.x0 && lx <= q.x1 && lz >= q.z0 && lz <= q.z1) || insideParvisRound(lx, lz);
  return inside ? PARVIS_LEVEL : null;
}

/** Un point du repère du Parvis est-il sur la place ronde (le polygone convexe de ses coins) ? Sans rien allouer. */
function insideParvisRound(lx: number, lz: number): boolean {
  const n = PARVIS_CORNERS.length;
  for (let k = 0; k < n; k++) {
    const a = PARVIS_CORNERS[k],
      c = PARVIS_CORNERS[(k + 1) % n];
    // Les coins tournent dans le sens des aiguilles d'une montre vu d'en haut (x à l'est, z au sud) : le dedans est à droite.
    if ((c.x - a.x) * (lz - a.z) - (c.z - a.z) * (lx - a.x) < 0) return false;
  }
  return true;
}

/** Le lieu de départ du 3e : à côté de l'aire du Parvis (le nœud a le nom du quai de l'Escale, que la page connaît). */
export const DEPARTURE_3E = { node: portNode('quai'), at: PARVIS.toWorld(PARVIS_QUAY_SPOT[0], PARVIS_QUAY_SPOT[1]) } as const;

/** Les nœuds du Parvis, dans son repère : le milieu de la place, devant chaque façade, puis la sortie est, vers le Versant. */
const PARVIS_NODES: readonly { id: string; at: readonly [number, number] }[] = [
  { id: 'port-place', at: [27, 13] },
  { id: portNode('succes'), at: [13, 9.5] },
  { id: portNode('french'), at: [19.3, 9.5] },
  { id: portNode('maths'), at: [22.5, 9.5] },
  { id: portNode('english'), at: [25.7, 9.5] },
  { id: portNode('chantier'), at: [34, 9.5] },
  { id: 'par-1', at: [44, 11] },
];

const node = (id: string, p: [number, number]): PathNode => ({ id, at: fromPlan3e(p) });

/** La porte d'un lieu : à son décalage de son centre, en unités. */
const doorNode = (s: PlaceSpec): PathNode => {
  const c = fromPlan3e(s.plan);
  return { id: s.id, at: { x: c.x + s.door.x, z: c.z + s.door.z } };
};

/**
 * Les nœuds : les portes des lieux, puis les coudes des chemins, terre par terre. Le Versant : du Parvis au Jardin, au
 * Grenier, au Belvédère et à l'Abri, puis aux trois passages. Les Alpages, au-delà du pont du glacier ; le Cirque, au-delà
 * de la galerie du col ; les Prairies, au-delà des arches basses, et leurs deux petites arches toujours ouvertes.
 */
export const PATH_NODES_3E: readonly PathNode[] = [
  ...PLACE_SPECS.map(doorNode),
  { id: DEPARTURE_3E.node, at: DEPARTURE_3E.at },
  ...PARVIS_NODES.map(({ id, at }) => ({ id, at: PARVIS.toWorld(at[0], at[1]) })),
  // Le Versant.
  // Un peu au nord de l'anse de nuages (lot du Versant).
  node('ve-1', [760, 925]),
  node('ve-2', [900, 905]),
  node('ve-3', [1075, 870]),
  node('ve-4', [1225, 860]),
  node('ve-5', [985, 760]),
  node('ve-6', [1060, 560]),
  // Le coude du Jardin, au sud-ouest de ses carrés : le chemin arrive à sa porte par le sud (relecture des lieux, correction 1),
  // en deux angles ouverts, à plus de deux unités du muret (relecture du Versant par le directeur artistique, (a) 8).
  node('ve-7', [965.7, 983.4]),
  node('ve-8', [984.8, 993.5]),
  node('gla-v', [565, 790]),
  node('col-v', [1105, 425]),
  node('arc-v', [1372, 766]),
  // Les Alpages.
  node('gla-a', [470, 700]),
  node('al-1', [425, 615]),
  node('al-2', [505, 500]),
  node('al-3', [300, 560]),
  node('al-4', [300, 460]),
  // Le Cirque.
  node('col-c', [1080, 285]),
  node('ci-1', [1010, 225]),
  node('ci-2', [880, 205]),
  // Les Prairies.
  node('arc-p', [1567, 690]),
  node('pr-1', [1660, 715]),
  node('sa1-a', [1790, 728]),
  node('sa1-b', [1872, 885]),
  node('pr-2', [1935, 905]),
  // Le coude de la Lutherie, au nord-est de l'atelier : le chemin arrive à sa porte, à l'est (relecture des lieux,
  // correction 3), en un angle ouvert, loin du coin de la galerie (relecture du Versant, (b) 10).
  node('pr-3', [2022, 971]),
  node('sa2-a', [1645, 748]),
  node('sa2-b', [1596, 972]),
];

/** Les deux petites arches des Prairies, toujours ouvertes (fiche, § 5) : leurs deux nœuds, d'une île à l'autre. */
export const SMALL_ARCHES_3E: readonly (readonly [string, string])[] = [
  ['sa1-a', 'sa1-b'],
  ['sa2-a', 'sa2-b'],
];

/** Les liaisons : sentiers, les deux petites arches, et le passage de chaque terre. */
export const PATH_EDGES_3E: readonly (readonly [string, string])[] = [
  // Le Versant : le Parvis, de l'arrivée à la place, le long des façades, puis la sortie est.
  [DEPARTURE_3E.node, 'port-place'],
  ['port-place', portNode('english')],
  [portNode('english'), portNode('maths')],
  [portNode('maths'), portNode('french')],
  [portNode('french'), portNode('succes')],
  ['port-place', portNode('chantier')],
  [portNode('chantier'), 'par-1'],
  ['par-1', 've-1'],
  ['ve-1', 've-2'],
  ['ve-2', 've-7'],
  ['ve-7', 've-8'],
  ['ve-8', 'jardin'],
  ['ve-2', 've-3'],
  ['ve-3', 'grenier'],
  ['grenier', 've-4'],
  ['ve-4', 'belvedere'],
  ['belvedere', 'arc-v'],
  ['ve-3', 've-5'],
  ['ve-5', 'abri'],
  ['ve-5', 've-6'],
  ['ve-6', 'col-v'],
  ['ve-1', 'gla-v'],
  // Le pont du glacier, puis les Alpages.
  ['gla-v', 'gla-a'],
  ['gla-a', 'al-1'],
  ['al-1', 'maquette'],
  ['al-1', 'kiosque'],
  ['kiosque', 'al-2'],
  ['al-2', 'tribune'],
  ['al-1', 'al-3'],
  ['al-3', 'ermitage'],
  ['al-3', 'al-4'],
  ['al-4', 'douane'],
  // La galerie du col, puis le Cirque.
  ['col-v', 'col-c'],
  ['col-c', 'rampe'],
  ['col-c', 'ci-1'],
  ['ci-1', 'fanal'],
  ['ci-1', 'ci-2'],
  ['ci-2', 'standard'],
  // Les arches basses, puis les Prairies et leurs deux petites arches.
  ['arc-v', 'arc-p'],
  ['arc-p', 'palais'],
  ['arc-p', 'pr-1'],
  ['pr-1', 'sa1-a'],
  ['sa1-a', 'sa1-b'],
  // La Coupole par l'est, depuis `pr-2` : sa porte au sud-est de la salle (relecture des lieux, correction 2, et du Versant,
  // (b) 1), le chemin ne passe jamais devant la vue d'arrivée.
  ['pr-2', 'coupole'],
  ['sa1-b', 'pr-2'],
  ['pr-2', 'pr-3'],
  ['pr-3', 'lutherie'],
  ['pr-1', 'sa2-a'],
  ['sa2-a', 'sa2-b'],
  ['sa2-b', 'ondes'],
];

/** Le passage de chaque terre qu'on relie : la liaison du réseau qui le franchit, de la terre d'avant à elle, et sa coupure. */
export const LINKS_3E = {
  alpages: { bridge: ['gla-v', 'gla-a'], cut: 'glace' },
  prairies: { bridge: ['arc-v', 'arc-p'], cut: 'nuages' },
  cirque: { bridge: ['col-v', 'col-c'], cut: 'col' },
} as const satisfies Record<string, { bridge: readonly [string, string]; cut: Cut3e }>;

/**
 * Les quatre terres du 3e (fiche, § 5), dans l'ordre où le jeu les suggère : le Versant, le départ, puis les Alpages, les
 * Prairies, et le Cirque en dernier (question 10, a), sans l'imposer : chacune se relie depuis le Versant ; la fin du
 * niveau est la dernière terre reliée. Prix : 15, 20, 15 (5 par lieu, la Douane et l'Ermitage hors du prix).
 */
export const LANDS_3E: readonly Land[] = [
  { id: 'versant', name: 'Le Versant', places: ['belvedere', 'grenier', 'abri', 'jardin'], after: null, bridgeName: null },
  { id: 'alpages', name: 'Les Alpages', places: ['kiosque', 'maquette', 'tribune', 'douane', 'ermitage'], after: 'versant', bridgeName: 'Le pont du glacier' },
  { id: 'prairies', name: 'Les Prairies', places: ['coupole', 'lutherie', 'ondes', 'palais'], after: 'versant', bridgeName: 'Les arches basses' },
  { id: 'cirque', name: 'Le Cirque', places: ['fanal', 'rampe', 'standard'], after: 'versant', bridgeName: 'La galerie du col' },
];

/**
 * La place des Détours du 3e (fiche, § 5), réservée dès le plan : le Cadran (Versant), la Bergerie (Alpages), le Lac
 * (Cirque), le Cèdre (Prairies). Ils se construisent avec leur lot.
 */
export const DETOUR_SPOTS_3E = {
  cadran: fromPlan3e([1060, 760]),
  bergerie: fromPlan3e([330, 270]),
  // Le Lac : 13 unités au sud de sa place du plan ([720, 105], sur la pente de la levée nord, où l'eau ne tiendrait
  // pas à plat), sur le replat du creux (le lot du Cirque).
  lac: fromPlan3e([698, 148]),
  cedre: fromPlan3e([1640, 1000]),
} as const;

/** La place réservée des trois grands projets (GD-10) : la fusée, le château d'eau, la colonne des solides (plan, en pointillé). */
export const RESERVED_3E = {
  fusee: { center: fromPlan3e([1255, 190]), half: { x: 6, z: 6 } },
  chateau: { center: fromPlan3e([770, 700]), half: { x: 6, z: 6 } },
  colonne: { center: fromPlan3e([1770, 680]), half: { x: 4, z: 4 } },
} as const;

/**
 * Le zeppelin des Ferrailleurs (fiche, § 6 et § 9, décision du 22 octobre 2026) : amarré par le nez à un mât de ferraille
 * sur un rocher à part, au nord-est de la plus grande des Prairies, loin de toute rive ; son enveloppe part du mât vers
 * le nord-nord-ouest (cap 330° environ ; proposition des Prairies, § 7, correction 20 du directeur artistique : au lot 1,
 * vers le nord-est, dans la ligne du regard du Versant et des arches, on le voyait par le bout). Immobile tout le
 * niveau. `rock` : le rocher et son rayon ; `tail` : le bout de l'enveloppe.
 */
export const ZEPPELIN_3E = { rock: fromPlan3e([1990, 330]), rockRadius: 5, tail: fromPlan3e([1935, 235]) } as const;

/**
 * Le terrain : l'étendue de la carte de hauteurs (le plan de 100 à 2 140 pixels d'ouest en est, de 0 à 1 180 du nord au
 * sud), le pas de sa grille et ses tuiles, comme au 4e.
 */
export const TERRAIN_3E = (() => {
  const step = 1.75;
  const tileCells = 18;
  const tile = step * tileCells;
  const min = fromPlan3e([100, 0]);
  const max = fromPlan3e([2140, 1180]);
  const tilesX = Math.ceil((max.x - min.x) / tile);
  const tilesZ = Math.ceil((max.z - min.z) / tile);
  return { minX: min.x, minZ: min.z, step, tileCells, coarse: 3, tilesX, tilesZ } as const;
})();
