// Les formes des îles (GD-12, « Une forme par île », décision du mainteneur du 8 octobre 2026) : un petit catalogue de
// onze formes, sept de nature (le galet, le croissant, le haricot, la presqu'île, la goutte, le trèfle, la cacahuète) et
// quatre plus marquées (le fer à cheval, le crochet, le lagon, le moulinet, 9 octobre 2026), que
// chaque île prend à la main (./silhouettes/), orientée (vers le devant, le fond, la gauche ou la droite, et en miroir).
// La forme se pose autour du cœur, qui ne bouge pas : c'est la terre autour qui change. Chaque forme est une distance
// signée (en cases) à son bord, faite de quelques volumes simples (disques, gélules, rectangles arrondis), lue dans le
// repère du cœur : `u` vers la droite, `v` vers le fond, depuis le milieu du cœur, `s` son demi-côté (11 pour un cœur de
// 22, 13 pour un cœur de 26). Le bruit de la graine de l'île casse ensuite le contour à la case près (./map.ts).
// Code pur, sans Three.js.

/** Les onze formes du catalogue (docs/gameplay/propositions/GD-12.md, §1 et « Les quatre »). */
export type FormeId = 'galet' | 'croissant' | 'haricot' | 'presquile' | 'goutte' | 'trefle' | 'cacahuete' | 'fer' | 'crochet' | 'lagon' | 'moulinet';

/**
 * Le catalogue : les sept formes du 8 octobre 2026, puis les quatre formes plus marquées que le mainteneur a ajoutées le
 * 9 octobre 2026 (« Les quatre ») : le fer, le crochet, le lagon et le moulinet (au plus deux par archipel, aux Monts
 * de Feu une seule longue, un seul moulinet par archipel).
 */
export const FORMES: readonly FormeId[] = ['galet', 'croissant', 'haricot', 'presquile', 'goutte', 'trefle', 'cacahuete', 'fer', 'crochet', 'lagon', 'moulinet'];

/** Les quatre formes plus marquées du 9 octobre 2026 (voir `FORMES`). */
export const FORMES_MARQUEES: readonly FormeId[] = ['fer', 'crochet', 'lagon', 'moulinet'];

/** Le côté vers lequel une forme tourne ce qui la distingue (l'ouverture du croissant, la pointe de la goutte, le bras…). */
type Vers = 'devant' | 'fond' | 'gauche' | 'droite';

/**
 * La forme d'une île : la forme du catalogue, le côté vers lequel elle se tourne (dans le repère de l'île, avant qu'on la
 * tourne : le devant est côté caméra, côté quai) et, s'il le faut, son miroir (gauche et droite échangées, vue depuis
 * ce côté). `quai` : l'île-port, dont la baie garde l'eau du quai et du Bloc-Navire, et une rive droite devant la jetée.
 */
export interface FormeDeLIle {
  forme: FormeId;
  vers: Vers;
  miroir?: boolean;
  quai?: boolean;
  /**
   * Le trait s'arrête à la boîte de la forme (`BOITE_DE_LA_FORME`), et non à celle du trait : au bord du cadre de sa
   * région, il en sortirait.
   */
  short?: boolean;
}

// ---------- Les volumes simples, en distance signée (négative dedans) ----------

const longueur = (x: number, y: number) => Math.hypot(x, y);

/** Un disque de centre (cx, cy) et de rayon r. */
function disque(u: number, v: number, cx: number, cy: number, r: number): number {
  return longueur(u - cx, v - cy) - r;
}

/** Une gélule : le segment de (ax, ay) à (bx, by), épaissi de r. */
function gelule(u: number, v: number, ax: number, ay: number, bx: number, by: number, r: number): number {
  const px = u - ax;
  const py = v - ay;
  const dx = bx - ax;
  const dy = by - ay;
  const t = Math.max(0, Math.min(1, (px * dx + py * dy) / (dx * dx + dy * dy)));
  return longueur(px - dx * t, py - dy * t) - r;
}

/** Une gélule qui s'effile : de rayon `ra` en (ax, ay) à `rb` en (bx, by) (un cône arrondi). */
function goutteDe(u: number, v: number, ax: number, ay: number, ra: number, bx: number, by: number, rb: number): number {
  const px = u - ax;
  const py = v - ay;
  const dx = bx - ax;
  const dy = by - ay;
  const l2 = dx * dx + dy * dy;
  const t = Math.max(0, Math.min(1, (px * dx + py * dy) / l2));
  return longueur(px - dx * t, py - dy * t) - (ra + (rb - ra) * t);
}

/** Un rectangle de centre (cx, cy), de demi-côtés (hx, hy), aux coins arrondis de rayon r. */
function rectangleArrondi(u: number, v: number, cx: number, cy: number, hx: number, hy: number, r: number): number {
  const qx = Math.abs(u - cx) - (hx - r);
  const qy = Math.abs(v - cy) - (hy - r);
  return longueur(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
}

/** L'union adoucie de deux volumes (un congé de rayon k là où ils se rejoignent : ni pointe ni entaille étroite). */
function unionDouce(a: number, b: number, k: number): number {
  const h = Math.max(0, Math.min(1, 0.5 + (0.5 * (b - a)) / k));
  return b + (a - b) * h - k * h * (1 - h);
}

// ---------- Le catalogue, chaque forme tournée vers le devant (−v) ----------

/**
 * La boîte de chaque forme (piste 1 du directeur artistique, « formes contenues », 8 octobre 2026) : sa terre ne dépasse
 * jamais le cœur de plus de `BOITE_DE_LA_FORME` cases, sauf du côté de son trait (`FEATURE_BOX`). Une forme se lit
 * par des volumes larges plutôt que longs : un bras plus large que long, une baie qui mord la terre autour du cœur
 * (jamais le cœur).
 */
export const BOITE_DE_LA_FORME = 5;

/**
 * Du côté de son trait, et là seulement, la terre d'une forme va jusqu'à tant de cases du cœur (mainteneur, 8 octobre
 * 2026 : « On peut faire sauter le point dogmatique du DA si c'est trop moche » ; dans la boîte de cinq, les îles se
 * lisaient encore comme des carrés aux coins arrondis sur la Carte). La boîte d'une forme n'est donc plus carrée : un
 * lieu tourné ne tient plus forcément à sa place, et le glissé ne propose que les places où il tient (./arrange.ts).
 */
const FEATURE_BOX = 7;

/**
 * Le bord le plus lointain que dessine une forme, depuis le bord du cœur : un peu au-delà de sa boîte (`FAR_REACH`), ou de
 * celle de son trait (`FEATURE_REACH`), de ce que le bruit de la côte peut le ramener (./map.ts) ; la boîte coupe la terre, et
 * le trait d'une forme va toujours jusqu'à son bord (directeur artistique, 8 octobre 2026).
 */
const FAR_REACH = BOITE_DE_LA_FORME + 0.8;
const FEATURE_REACH = FEATURE_BOX + 0.8;

/**
 * Le trait des formes plus marquées (mainteneur, 9 octobre 2026, cadrage du directeur artistique) : le fer jusqu'à dix
 * cases, le crochet et le lagon jusqu'à douze ; le moulinet à sept, mais sur ses quatre côtés.
 */
const TRAIT_DU_FER = 10;
const TRAIT_LONG = 12;
const FER_REACH = TRAIT_DU_FER + 0.8;
const REACH_LONG = TRAIT_LONG + 0.8;

/** Le plus long trait du catalogue, en cases depuis le bord du cœur (la boîte la plus profonde d'une forme). */
export const TRAIT_MAX = TRAIT_LONG;

/**
 * Le bord d'une forme là où elle ne s'avance pas (son côté opposé, les creux de ses flancs, le fond de ses baies), depuis
 * le bord du cœur : une case et demie, si bien que la terre s'y tient aux deux cases qui entourent toujours le cœur
 * (`TERRE_AUTOUR_DU_COEUR`, ./map.ts), une troisième de loin en loin, quand le bruit de la côte la pousse.
 */
const BODY_MARGIN = 1.5;

/**
 * Le rayon des coins du corps de chaque forme : celui des coins de plage du cœur (`BEACH_RADIUS`, ./map.ts) et de
 * ses deux cases de terre. Là où la mer entre, la côte tourne autour du coin du cœur sans le montrer.
 */
const BODY_RADIUS = 6 + BODY_MARGIN;

/**
 * Ce que devient chaque coin du cœur d'une forme (GD-12, point 4, construit le 8 octobre 2026) : `plage`, la mer entre
 * et le coin s'abaisse en plage (du sable, au niveau de la côte), le sol du lieu s'arrête avec lui, arrondi ; `terre`,
 * un lobe ou une corne de la forme le couvre, le sol du lieu s'arrête aussi, arrondi, sur la terre de la côte ; `trait`,
 * le trait de la forme (un bras) part de lui, le sol du lieu le suit. Un coin où quelque chose est posé (le carré du
 * Gardien, ./map.ts) reste carré.
 */
export type ShapeCorner = 'plage' | 'terre' | 'trait';

/** Les coins d'une forme dans son repère propre, dans l'ordre : devant à gauche, devant à droite, fond à gauche, fond à droite. */
type ShapeCorners = readonly [ShapeCorner, ShapeCorner, ShapeCorner, ShapeCorner];

/** Le corps (`body`) de chaque forme : le cœur et ses deux cases de terre, aux coins arrondis (`BODY_RADIUS`). */
function body(u: number, v: number, s: number): number {
  return rectangleArrondi(u, v, 0, 0, s + BODY_MARGIN, s + BODY_MARGIN, BODY_RADIUS);
}

/**
 * Chaque forme est le corps (le cœur et ses deux cases de terre) et ce qui la distingue : son trait, d'un seul côté
 * (`side` : devant, −1, ou au fond, 1, dans son repère propre), jusqu'au bord de la boîte du trait (`FEATURE_REACH`) ; le reste
 * jusqu'à la boîte (`FAR_REACH`) au plus ; le côté opposé et les flancs restent aux deux cases du corps (`BODY_MARGIN`), si bien
 * qu'elle se lit franchement asymétrique (directeur artistique, 8 octobre 2026, relecture des planches). `feature` : où le
 * sol du lieu suit la forme (dans son repère propre) ; `corners` : ce que devient chaque coin du cœur.
 */
interface ShapeDrawing {
  side: -1 | 1;
  /** Jusqu'où va son trait, en cases depuis le bord du cœur : `FEATURE_BOX` sans autre mot. */
  trait?: number;
  /** Le trait sur ses quatre côtés (le moulinet) : sa boîte est la même à chaque quart de tour. */
  partout?: true;
  /** Là où le bruit de la côte ne touche jamais la forme (le lagon et sa passe), dans son repère propre. */
  calme?: (u: number, v: number, s: number) => boolean;
  distance: (u: number, v: number, s: number, quai: boolean) => number;
  feature: (u: number, v: number, s: number, quai: boolean) => boolean;
  corners: (quai: boolean) => ShapeCorners;
}

const ALL_BEACH: ShapeCorners = ['plage', 'plage', 'plage', 'plage'];

const SHAPE_CATALOGUE: Readonly<Record<FormeId, ShapeDrawing>> = {
  // Un ovale doux, sans bras ni creux, plus long vers le fond : le galet s'y avance jusqu'au bord de la boîte du trait,
  // ses flancs à trois cases, son devant aux deux cases du corps ; ses quatre coins en plage.
  galet: {
    side: 1,
    distance: (u, v, s) => unionDouce(body(u, v, s), rectangleArrondi(u, v, 0, (FEATURE_REACH - BODY_MARGIN) / 2, s + 3, s + (FEATURE_REACH + BODY_MARGIN) / 2, 10), 2),
    feature: () => false,
    corners: () => ALL_BEACH,
  },
  // Deux cornes qui embrassent une baie : elles s'avancent devant jusqu'au bord de la boîte du trait, tournées l'une vers
  // l'autre ; entre elles, la baie descend jusqu'aux deux cases du corps. Le fond et les flancs restent au corps.
  // L'île-port n'a qu'une corne, à gauche, accrochée à son flanc : la seconde serait sous le Bloc-Navire. Entre elle et
  // la jetée (colonne 16 du cœur, u = 8,5), la rade ; le coin de devant à gauche en plage la prolonge (relecture du
  // directeur artistique, 8 octobre 2026), celui de devant à droite reste carré, la rive droite du quai.
  croissant: {
    side: -1,
    distance: (u, v, s, quai) => {
      if (quai) return unionDouce(body(u, v, s), gelule(u, v, -(s + FAR_REACH - 2.5), -(s - 3), -(s + 1), -(s + FEATURE_REACH - 2.5), 2.5), 1.5);
      const gauche = gelule(u, v, -(s - 1), -(s - 2), -(s - 4), -(s + FEATURE_REACH - 2.5), 2.5);
      const droite = gelule(u, v, s - 1, -(s - 2), s - 4, -(s + FEATURE_REACH - 2.5), 2.5);
      return unionDouce(unionDouce(body(u, v, s), gauche, 2), droite, 2);
    },
    feature: (u, v, s, quai) => !quai && v < -s && Math.abs(u) > s - 7,
    corners: (quai) => (quai ? ['plage', 'trait', 'plage', 'plage'] : ['trait', 'trait', 'plage', 'plage']),
  },
  // Un ventre rond d'un côté, un creux de l'autre : le ventre s'avance au fond jusqu'au bord de la boîte du trait ;
  // devant, deux pointes courtes encadrent le creux, qui descend jusqu'aux deux cases du corps. Le sol du lieu va
  // jusqu'au bord du creux (le sable du front de taille de la Carrière).
  haricot: {
    side: 1,
    distance: (u, v, s) => {
      const ventre = rectangleArrondi(u, v, 0, s + FEATURE_REACH - 8.5, s + 1, 8.5, 8.5);
      const pointes = Math.min(disque(u, v, -(s - 1.5), -(s - 1), 4.5), disque(u, v, s - 1.5, -(s - 1), 4.5));
      return unionDouce(unionDouce(body(u, v, s), ventre, 2), pointes, 1.5);
    },
    feature: (u, v, s) => v < -s && Math.abs(u) < s - 4,
    corners: () => ['terre', 'terre', 'plage', 'plage'],
  },
  // Un corps et un bras large qui s'avance devant, du côté droit, jusqu'au bord de la boîte du trait, plus large que
  // long ; il se lit par les plages de part et d'autre. Le sol du lieu le suit.
  presquile: {
    side: -1,
    distance: (u, v, s) => unionDouce(body(u, v, s), gelule(u, v, s - 5, -(s - 1), s - 3, -(s + FEATURE_REACH - 3), 3), 2),
    feature: (u, v, s) => v < -s + 2 && u > s - 9,
    corners: () => ['plage', 'trait', 'plage', 'plage'],
  },
  // Un rond qui s'effile : la pointe, au milieu du devant, jusqu'au bord de la boîte du trait, entre deux coins en plage.
  // Le sol du lieu va jusqu'à la pointe (la pierre de la Mine, la roche sombre du Volcan).
  goutte: {
    side: -1,
    distance: (u, v, s) => unionDouce(body(u, v, s), goutteDe(u, v, 0, -(s - 3), 9, 0, -(s + FEATURE_REACH - 2), 2), 2),
    feature: (u, v, s) => v < -s && Math.abs(u) < 6,
    corners: () => ALL_BEACH,
  },
  // Trois lobes, deux aux coins de devant, jusqu'au bord de la boîte du trait, l'un au fond, jusqu'à la boîte ; entre
  // eux, les criques descendent jusqu'aux deux cases du corps, et les coins du fond, en plage, les prolongent.
  trefle: {
    side: -1,
    distance: (u, v, s) => {
      const devant = (x: number) => gelule(u, v, x, -(s - 2), x, -(s + FEATURE_REACH - 3.5), 3.5);
      const lobes = Math.min(disque(u, v, 0, s + FAR_REACH - 5, 5), devant(-(s - 0.5)), devant(s - 0.5));
      return unionDouce(body(u, v, s), lobes, 1.5);
    },
    feature: () => false,
    corners: () => ['terre', 'terre', 'plage', 'plage'],
  },
  // Deux lobes, devant jusqu'au bord de la boîte du trait, au fond jusqu'à la boîte, réunis par une taille : les flancs
  // restent aux deux cases du corps, ses quatre coins en plage.
  cacahuete: {
    side: -1,
    distance: (u, v, s) => {
      const lobes = Math.min(rectangleArrondi(u, v, 0, -(s + FEATURE_REACH - 7.5), s - 3, 7.5, 7.5), rectangleArrondi(u, v, 0, s + FAR_REACH - 6, s - 4, 6, 6));
      return unionDouce(body(u, v, s), lobes, 2);
    },
    feature: () => false,
    corners: () => ALL_BEACH,
  },
  // Le fer à cheval : deux cornes de six cases de large s'avancent devant jusqu'à dix cases, autour d'une baie de
  // quatorze cases de large, et se referment au bout sur une passe de huit (le croissant, lui, s'ouvre en grand ; avec
  // une passe de dix, les pointes ne rentraient que d'une case, on les confondait). La
  // baie descend jusqu'aux deux cases du corps. Les coins de devant sous les cornes, ceux du fond en plage.
  fer: {
    side: -1,
    trait: TRAIT_DU_FER,
    distance: (u, v, s) => {
      const dehors = rectangleArrondi(u, v, 0, -(s + FER_REACH / 2), s + 2, FER_REACH / 2, 5);
      return unionDouce(body(u, v, s), Math.max(dehors, -eauDuFer(u, v, s)), 2);
    },
    feature: (u, v, s) => v < -s && Math.abs(u) > 7,
    corners: () => ['terre', 'terre', 'plage', 'plage'],
    // Le bruit de la côte ne touche ni la baie ni la passe : les deux pointes se referment pareil.
    calme: (u, v, s) => eauDuFer(u, v, s) < 2,
  },
  // Le crochet : un bras de huit cases part du coin de devant à droite, s'avance jusqu'à douze cases, puis revient sous le
  // cœur en une barre de quatre cases ; entre la barre et le corps, une anse d'environ huit cases de fond, ouverte à
  // gauche. Deux îles voisines ne se distinguent jamais par le seul miroir du crochet.
  crochet: {
    side: -1,
    trait: TRAIT_LONG,
    distance: (u, v, s) => {
      const bras = rectangleArrondi(u, v, s - 0.5, -(s + REACH_LONG / 2 - 0.5), 4.5, REACH_LONG / 2 + 0.5, 2.5);
      const barre = rectangleArrondi(u, v, s / 2 - 2, -(s + REACH_LONG - 2), s / 2 + 3, 2, 2);
      return unionDouce(body(u, v, s), Math.min(bras, barre), 2);
    },
    feature: (u, v, s) => v < -s && (u > s - 5 || v < -(s + REACH_LONG - 4.5)),
    corners: () => ['plage', 'trait', 'plage', 'plage'],
  },
  // Le lagon : devant, un anneau de terre (sept cases de large sur les flancs, trois au large) entoure un lagon de
  // quatorze cases sur sept, qui s'ouvre sur la mer par une passe de cinq cases, à gauche. L'eau du lagon est la mer
  // elle-même ; le bruit de la côte n'y touche jamais (`calme`), si bien que ni la passe ne se ferme ni une mare ne s'ouvre.
  lagon: {
    side: -1,
    trait: TRAIT_LONG,
    distance: (u, v, s) => {
      const dehors = rectangleArrondi(u, v, 0, -(s + REACH_LONG / 2), s + 3, REACH_LONG / 2, 5);
      return unionDouce(body(u, v, s), Math.max(dehors, -eauDuLagon(u, v, s)), 2);
    },
    feature: () => false,
    corners: () => ['terre', 'terre', 'plage', 'plage'],
    calme: (u, v, s) => eauDuLagon(u, v, s) < 3,
  },
  // Le moulinet : quatre bras de huit cases de large, un par coin, tournés dans le même sens, qui s'avancent de sept
  // cases sur chacun des quatre côtés : sa boîte est la même à chaque quart de tour. Un lobe couvre chaque coin. Entre
  // deux bras, l'échancrure descend jusqu'aux deux cases de terre autour du cœur, sans bruit de côte ni congé qui la
  // comble (mainteneur, carte « Creuser », 9 octobre 2026) : sur la Carte, on voit quatre bras, et non un carré.
  moulinet: {
    side: -1,
    partout: true,
    distance: (u, v, s) => unionDouce(body(u, v, s), brasDuMoulinet(u, v, s), 1),
    feature: () => false,
    corners: () => ['terre', 'terre', 'terre', 'terre'],
    calme: (u, v, s) => brasDuMoulinet(u, v, s) > 2,
  },
};

/** Les quatre bras du moulinet (distance signée) : celui de devant part du coin de gauche, les trois autres sont le même, tourné d'un, deux, trois quarts de tour. */
function brasDuMoulinet(u: number, v: number, s: number): number {
  const bras = (a: number, b: number) => rectangleArrondi(a, b, -(s - 4), -(s + FEATURE_REACH / 2 - 1), 4, FEATURE_REACH / 2 + 1, 3);
  return Math.min(bras(u, v), bras(-v, u), bras(-u, -v), bras(v, -u));
}

/** L'eau de la baie du fer et de sa passe (distance signée, négative dans l'eau), dans le repère propre de la forme. */
function eauDuFer(u: number, v: number, s: number): number {
  return Math.min(rectangleArrondi(u, v, 0, -(s + 3.5), 7, 2.5, 2), rectangleArrondi(u, v, 0, -(s + FER_REACH), 4, 4, 1));
}

/** Le milieu du lagon, en cases devant le bord du cœur (dans le repère propre de la forme, en −v). */
export const LAGOON_MIDDLE = 5.5;

/** L'eau du lagon et de sa passe (distance signée, négative dans l'eau), dans le repère propre de la forme. */
function eauDuLagon(u: number, v: number, s: number): number {
  const lagon = rectangleArrondi(u, v, 0, -(s + LAGOON_MIDDLE), 7, 3.5, 2);
  const passe = rectangleArrondi(u, v, -4.5, -(s + REACH_LONG - 1), 2.5, 4, 1);
  return Math.min(lagon, passe);
}

/**
 * La distance signée au bord d'une forme du catalogue, dans son repère propre : ce qui la distingue tourné vers le
 * devant (−v), `s` le demi-côté du cœur. Chaque forme tient dans sa boîte (`BOITE_DE_LA_FORME`) ; ./map.ts lui ajoute
 * les deux cases de terre autour du cœur et le bruit de la côte, et formes.test.ts vérifie sur la terre finale que ses
 * bras, ses lobes et ses baies ont trois cases de large au moins.
 */
function distanceCanonique(f: FormeDeLIle, u: number, v: number, s: number): number {
  return SHAPE_CATALOGUE[f.forme].distance(u, v, s, f.quai === true);
}

/** Un point du repère du cœur dans le repère propre d'une forme tournée vers `vers` (voir `distanceALaForme`). */
function toShapeFrame(f: FormeDeLIle, u: number, v: number, sortie: [number, number]): [number, number] {
  let a = u;
  let b = v;
  if (f.vers === 'fond') {
    a = -u;
    b = -v;
  } else if (f.vers === 'gauche') {
    // Le devant de la forme regarde vers la gauche (−u) : sa droite est devant l'île (−v).
    a = -v;
    b = u;
  } else if (f.vers === 'droite') {
    a = v;
    b = -u;
  }
  sortie[0] = f.miroir ? -a : a;
  sortie[1] = b;
  return sortie;
}

/** Un point de travail pour `toShapeFrame` : la terre de chaque lieu la lit des milliers de fois, sans rien allouer. */
const SCRATCH_POINT: [number, number] = [0, 0];

/**
 * La distance signée (en cases, négative dedans) d'un point au bord de la forme d'une île, dans le repère du cœur : `u`
 * vers la droite et `v` vers le fond depuis le milieu du cœur, `s` son demi-côté.
 */
export function distanceALaForme(f: FormeDeLIle, u: number, v: number, s: number): number {
  const [a, b] = toShapeFrame(f, u, v, SCRATCH_POINT);
  return distanceCanonique(f, a, b, s);
}

/**
 * Le point (`u`, `v`, repère du cœur) est-il là où le sol du lieu suit la forme vers son trait (GD-12, précision du
 * directeur artistique du 8 octobre 2026 : la pierre de la Mine dans sa pointe, le sable de la Carrière au bord de
 * son creux) ? Hors du cœur seulement ; mêmes matières, rien de neuf.
 */
export function inShapeFeature(f: FormeDeLIle, u: number, v: number, s: number): boolean {
  const [a, b] = toShapeFrame(f, u, v, SCRATCH_POINT);
  return SHAPE_CATALOGUE[f.forme].feature(a, b, s, f.quai === true);
}

/**
 * Ce que devient le coin du cœur du côté (`su`, `sv`) (−1 ou 1 : à gauche ou à droite, devant ou au fond, dans le
 * repère du cœur), selon sa forme tournée (`ShapeCorner`).
 */
export function shapeCorner(f: FormeDeLIle, su: -1 | 1, sv: -1 | 1): ShapeCorner {
  const [a, b] = toShapeFrame(f, su, sv, SCRATCH_POINT);
  return SHAPE_CATALOGUE[f.forme].corners(f.quai === true)[(b < 0 ? 0 : 2) + (a < 0 ? 0 : 1)];
}

/**
 * Jusqu'où va le trait d'une forme, en cases depuis le bord du cœur (`short` : la boîte, `BOITE_DE_LA_FORME`), et s'il
 * s'avance sur ses quatre côtés (le moulinet).
 */
export function traitDeLaForme(f: FormeDeLIle): { cases: number; partout: boolean } {
  const d = SHAPE_CATALOGUE[f.forme];
  return { cases: f.short ? BOITE_DE_LA_FORME : (d.trait ?? FEATURE_BOX), partout: d.partout === true };
}

/** Le point (`u`, `v`, repère du cœur) est-il là où le bruit de la côte ne touche pas la forme (le lagon) ? */
export function calmeDeLaForme(f: FormeDeLIle, u: number, v: number, s: number): boolean {
  const c = SHAPE_CATALOGUE[f.forme].calme;
  if (!c) return false;
  const [a, b] = toShapeFrame(f, u, v, SCRATCH_POINT);
  return c(a, b, s);
}

/** La forme a-t-elle un lagon (la forme `lagon`, GD-12) ? Sans forme, non. */
export function hasLagoon(f: FormeDeLIle | null | undefined): f is FormeDeLIle {
  return f?.forme === 'lagon';
}

/**
 * Le point (`u`, `v`, repère du cœur) est-il dans l'eau du lagon ou de sa passe (la forme `lagon`) ? Hors du lagon,
 * toujours non. La mer d'Archipéo y peint ses hauts-fonds (./sea.ts).
 */
export function inLagoon(f: FormeDeLIle, u: number, v: number, s: number): boolean {
  if (!hasLagoon(f)) return false;
  const [a, b] = toShapeFrame(f, u, v, SCRATCH_POINT);
  return eauDuLagon(a, b, s) < 0;
}

/** Le côté du cœur vers lequel s'avance le trait d'une forme tournée, dans le repère du cœur (−1 ou 1 sur `u` ou `v`). */
export function featureSide(f: FormeDeLIle): { u: number; v: number } {
  const c = SHAPE_CATALOGUE[f.forme].side;
  // Le point (0, c) du repère propre, ramené dans le repère du cœur : l'inverse de `toShapeFrame`.
  switch (f.vers) {
    case 'devant':
      return { u: 0, v: c };
    case 'fond':
      return { u: 0, v: -c };
    case 'gauche':
      return { u: c, v: 0 };
    case 'droite':
      return { u: -c, v: 0 };
  }
}
