// Les formes des îles (GD-12, « Une forme par île », décision du mainteneur du 8 octobre 2026) : un petit catalogue de
// sept formes de nature (le galet, le croissant, le haricot, la presqu'île, la goutte, le trèfle, la cacahuète), que
// chaque île prend à la main (./silhouettes/), orientée (vers le devant, le fond, la gauche ou la droite, et en miroir).
// La forme se pose autour du cœur, qui ne bouge pas : c'est la terre autour qui change. Chaque forme est une distance
// signée (en cases) à son bord, faite de quelques volumes simples (disques, gélules, rectangles arrondis), lue dans le
// repère du cœur : `u` vers la droite, `v` vers le fond, depuis le milieu du cœur, `s` son demi-côté (11 pour un cœur de
// 22, 13 pour un cœur de 26). Le bruit de la graine de l'île casse ensuite le contour à la case près (./map.ts).
// Code pur, sans Three.js.

/** Les sept formes du catalogue (docs/gameplay/propositions/GD-12.md, §1). */
export type FormeId = 'galet' | 'croissant' | 'haricot' | 'presquile' | 'goutte' | 'trefle' | 'cacahuete';

export const FORMES: readonly FormeId[] = ['galet', 'croissant', 'haricot', 'presquile', 'goutte', 'trefle', 'cacahuete'];

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
export const FEATURE_BOX = 7;

/**
 * Le bord le plus lointain que dessine une forme, depuis le bord du cœur : un peu au-delà de sa boîte (`FAR_REACH`), ou de
 * celle de son trait (`FEATURE_REACH`), de ce que le bruit de la côte peut le ramener (./map.ts) ; la boîte coupe la terre, et
 * le trait d'une forme va toujours jusqu'à son bord (directeur artistique, 8 octobre 2026).
 */
const FAR_REACH = BOITE_DE_LA_FORME + 0.8;
const FEATURE_REACH = FEATURE_BOX + 0.8;

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
};

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
