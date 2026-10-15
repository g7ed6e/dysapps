// Les pièces du cœur des îles, des liaisons et des lieux (intention du directeur artistique, 9 octobre 2026, lot « eau,
// quai, liaisons, cœur, barrière » au 6e) : des volumes simples, opaques, sans chanfrein, dessinés dans leur case en
// coordonnées de grille (x, y de 0 à 1, z : hauteur de 0 à 1) ; rien ne sort de la case, le toucher prend toute la case.
// Ce qui est fait de main d'homme est une boîte, un tronc de pyramide ou une dalle, au coût d'un cube (10 triangles) ou
// moins ; ce qui pousse (le rocher, le petit arbre, le buisson) reprend les primitives du décor (../decor/brush.ts :
// l'icosaèdre bosselé, le tronc de cône à cinq pans), aux proportions de ses formes communes (../decor/common.ts),
// réduites à la case. Code pur, sans Three.js.
import { hasardDe, icosaedre, Pinceau, rgb, tronconique, type Peindre } from '../decor/brush';
import { mixColor } from '../daylight';
import { BRUME, type Couleur } from '../palette';
import { HEART_MOTIFS, HEART_PAINT, MOTIF } from './paint';
import { frustum, normalOf } from './precious';
import { boiteDansLaCase, FACES, type DessinDePiece, type Facette, type V3 } from './rooms';
import { PIECES_BASSES, woodenPost } from './lowPieces';
import { SIDES } from './neighborhood';

/** Les mesures des pièces du cœur, en part de case. */
export const HEART = {
  /** La caisse (carton, cabines, chaume) : son côté, celui d'une caisse posée sur une autre, sa hauteur seule. */
  crate: { side: 0.85, stacked: 0.75, height: 0.85 },
  /** Les caisses de la cour de la Halle : la recette et le bloc suspendu. */
  hallCrate: 0.8,
  /**
   * Les dalles : le rouage de cadrans, l'éclat de mosaïque ; au 5e, le montoir de dalles, le plateau d'enluminure ; au 4e
   * et au 3e, la voie ferrée, une feuille (calque, reliure), le siège du banc d'acajou, la bordure d'osier du potager.
   */
  slab: { dial: 0.3, mosaic: 0.2, mounting: 0.5, desk: 0.2, rail: 0.15, sheet: 0.3, seat: 0.5, border: 0.3 },
  /** L'auvent du cœur (au 5e, la toile du Marché, la tuile du Comptoir) : une nappe mince en haut de sa case. */
  awning: 0.25,
  /** La planche du panneau indicateur (au 5e) : son épaisseur, son bas et son haut dans la case. */
  signBoard: { thick: 0.15, bottom: 0.3, top: 0.8 },
  /**
   * L'épi d'un roseau du Marais (au 5e, l'or posé sur un poteau de bois ; aussi le haut du thermomètre du Glacier) : son
   * côté et sa hauteur, plus petits que sa case.
   */
  reedHead: { side: 0.45, height: 0.7 },
  /** Le tube de verre du thermomètre du Glacier (au 5e) : son côté ; aussi celui de la lunette et de la longue-vue (4e, 3e). */
  thermometerTube: 0.5,
  /** La planche debout (au 4e, le mur de liège de la maquette) : son épaisseur. */
  standingBoard: 0.15,
  /** La verrière basse d'un faîte (au 3e, le faîte de miroirs du temple) : sa largeur et sa hauteur. */
  lowGlazing: { width: 0.6, height: 0.5 },
  /** La plate-bande de rizière (au 5e) : sa hauteur. */
  paddy: 0.3,
  /** La flèche d'or : sa base et sa hauteur. */
  spire: { base: 0.7, height: 0.9 },
  /** Le pavillon (un toit de petite construction) : sa hauteur. */
  pavilion: { height: 0.5 },
  /** Le tablier : le bas du plancher (son haut est celui de la case). */
  deck: 0.8,
  /**
   * L'eau en nappe : sa hauteur sous une margelle (le puits), celle d'une mare posée au sol (0,05 : l'eau se lit dans le
   * sol, pas sur une table), le rayon du nénuphar et sa hauteur au-dessus de la nappe (le liseré : `HEART_PAINT.lisere`).
   */
  water: { level: 0.8, pond: 0.05, lily: 0.22, lilyLift: 0.02 },
  /** Le champ de blé : sa hauteur. */
  wheat: 0.5,
  /** Le chaperon brun de la cabine : sa hauteur. */
  cap: 0.25,
  /** Une perle du boulier : son retrait de chaque côté. */
  bead: 0.08,
  /** Le pain de craie ; l'écart RVB minimal de sa teinte avec le fantôme Brume (référent dys). */
  chalk: { side: 0.8, height: 0.6, ghostGap: 70 },
  /** Le tas de sable de fouille. */
  mound: { base: 1, top: 0.5, height: 0.6 },
  /** La traverse de la potence : sa section, sous le haut de la case. */
  beam: 0.3,
  /** Le rocher : son rayon, son aplatissement (bas pour les galets), ses bosses. */
  rock: { radius: 0.42, flat: 0.68, low: 0.5, bump: 0.16 },
  /** Le petit arbre : le tronc (bas, haut), la couronne ; le buisson. */
  tree: { trunk: [0.15, 0.12], crown: 0.45, bush: 0.42 },
  /**
   * Le cône des Décimaux : la jupe de sa première rangée descend de 1 (contre le cœur) à 0 (au bord) ; au-dessus, sa
   * cheminée se resserre de la case entière à `top` au sommet, dont la case de braise monte de `ember`.
   */
  cone: { top: 0.5, ember: 0.6 },
} as const;

/** Les dessins déjà faits (une rangée de pièces qui filent ne se réunit que sur un même dessin, ./assembly.ts). */
const memo = new Map<string, DessinDePiece>();
const once = (k: string, make: () => DessinDePiece): DessinDePiece => {
  let d = memo.get(k);
  if (!d) {
    d = make();
    memo.set(k, d);
  }
  return d;
};

/** Les facettes d'un dessin, sauf celles dont la normale est donnée. */
const without = (facettes: readonly Facette[], ...normals: V3[]): Facette[] =>
  facettes.filter((f) => !normals.some((n) => f.normale[0] === n[0] && f.normale[1] === n[1] && f.normale[2] === n[2]));

const DOWN: V3 = [0, 0, -1];
const UP: V3 = [0, 0, 1];
const isSide = (f: Facette) => f.normale[2] === 0;

/** Un motif sur les flancs, un autre sur le dessus. */
const painted = (facettes: readonly Facette[], side: number, top: number): Facette[] => facettes.map((f) => ({ ...f, motif: isSide(f) ? side : f.normale[2] > 0 ? top : 0 }));

/**
 * Une caisse (le carton, la caisse de cabines, les bottes de chaume ; la recette de la Halle) : une boîte en retrait au
 * milieu de sa case, sans dessous (posée), ses flancs peints de `motif` (le bardage dans sa teinte). Une caisse portée
 * monte jusqu'au haut de sa case (`carries`) ; une caisse posée sur une autre est plus étroite (`onCrate`) : on voit
 * deux caisses, jamais une colonne.
 */
export function crate(motif: number, carries: boolean, onCrate: boolean, side: number = HEART.crate.side): DessinDePiece {
  const w = onCrate ? Math.min(side, HEART.crate.stacked) : side;
  const [a, b] = [0.5 - w / 2, 0.5 + w / 2];
  const box = boiteDansLaCase(a, b, a, b, 0, carries ? 1 : HEART.crate.height);
  return { facettes: painted(without(box.facettes, DOWN), motif, 0), couvre: 0 };
}

/**
 * Le bloc suspendu de la Halle : une caisse en retrait de tous côtés, ses six faces (on la voit d'en bas), au motif de
 * son bloc assemblé (`ownMotif`, world/construction.ts).
 */
export function hangingCrate(): DessinDePiece {
  const e = (1 - HEART.hallCrate) / 2;
  const box = boiteDansLaCase(e, 1 - e, e, 1 - e, e, 1 - e);
  return { facettes: box.facettes.map((f) => ({ ...f, ownMotif: true })), couvre: 0 };
}

/** Une dalle basse de toute la case (le rouage, la mosaïque), sans dessous ; `top` : le motif de son dessus. */
export function slab(height: number, top = 0): DessinDePiece {
  const box = boiteDansLaCase(0, 1, 0, 1, 0, height);
  return { facettes: painted(without(box.facettes, DOWN), 0, top), couvre: 0 };
}

/** Le rouage de cadrans : une dalle de 0,3 case, le disque du cadran peint sur son dessus. */
export const dialSlab = (): DessinDePiece => slab(HEART.slab.dial, MOTIF.cadran);

/** Une pyramide à quatre pans centrée dans la case (sa base, sa hauteur), ses pans tournés vers le haut : 4 triangles. */
function pyramid(base: number, height: number, role?: 'galon'): Facette[] {
  const b = (sx: number, sy: number): V3 => [0.5 + (sx * base) / 2, 0.5 + (sy * base) / 2, 0];
  const s: V3 = [0.5, 0.5, height];
  return [
    [b(-1, -1), b(1, -1), s],
    [b(1, -1), b(1, 1), s],
    [b(1, 1), b(-1, 1), s],
    [b(-1, 1), b(-1, -1), s],
  ].map((points): Facette => ({ points, normale: normalOf(points), face: 'dessus', motif: 0, ...(role ? { role } : {}) }));
}

/** La flèche d'or : une pyramide à quatre pans, dans l'or mat (le rôle `galon`), 4 triangles. */
export function spire(): DessinDePiece {
  return { facettes: pyramid(HEART.spire.base, HEART.spire.height, 'galon'), couvre: 0 };
}

/**
 * Le pavillon : un petit toit à quatre pans de toute la case, dans la couverture de l'île (ses pans prennent le dessus
 * du toit). L'intention le voulait en tronc de pyramide au dessus de 0,1 (10 triangles) : en pointe, il en coûte 4, et
 * le poste des commandes tient son enveloppe (800) sans la relever ; à 0,1 case près, la silhouette est la même.
 */
export function pavilion(): DessinDePiece {
  return once('pavillon', () => ({ facettes: pyramid(1, HEART.pavilion.height), couvre: 0 }));
}

/**
 * Le tablier (les liaisons, la jetée) : un plancher mince en haut de la case, des lames dans le brun du bardage, des
 * joints peints en travers de la marche (`HEART_MOTIFS.planksAlong*`), la tranche et le dessous dans le brun des pilotis.
 * Il file le long de la marche (une rangée d'un tenant, ./assembly.ts) : dans son orientation de référence le long de y,
 * posé d'un quart de tour le long de x. Le coût d'une boîte.
 */
export function deck(alongX: boolean): DessinDePiece {
  return once(`tablier|${alongX}`, () => deckOf(alongX));
}

function deckOf(alongX: boolean): DessinDePiece {
  const box = boiteDansLaCase(0, 1, 0, 1, HEART.deck, 1);
  const top = alongX ? HEART_MOTIFS.planksAlongX : HEART_MOTIFS.planksAlongY;
  const facettes = box.facettes.map((f): Facette => (f.normale[2] > 0 ? { ...f, role: 'bardage', motif: top } : { ...f, role: 'pilotis', motif: 0 }));
  return { facettes, couvre: box.couvre, filant: true };
}

/**
 * L'eau en nappe : un dessus plat (le rôle `nappe`) à `level` de la case, cerné d'un liseré clair (le rôle `lisere`, des
 * bandes de `HEART_PAINT.lisere`) au bord de la nappe seulement, pas du côté d'une autre case d'eau (`neighbours`, 4 bits
 * +x, +y, −x, −y) : une mare de plusieurs cases se lit d'une seule nappe. Ses flancs sombres (`flanc`), sans dessous ni
 * flanc contre une margelle (`walled`). Ni reflet ni mouvement. `lily` : un nénuphar posé dessus (un octogone vert,
 * 6 triangles). Le liseré est en géométrie, pas peint : 2 triangles par bord.
 */
export function waterSheet(level: number, neighbours: number, lily: boolean, walled = 0): DessinDePiece {
  return once(`eau|${level}|${neighbours}|${lily}|${walled}`, () => {
    const rim = (i: number) => (neighbours & (1 << i) ? 0 : HEART_PAINT.lisere);
    const [e, n, w, s] = [rim(0), rim(1), rim(2), rim(3)];
    const flat = (x0: number, x1: number, y0: number, y1: number, role: 'nappe' | 'lisere'): Facette => ({
      points: [
        [x0, y0, level],
        [x1, y0, level],
        [x1, y1, level],
        [x0, y1, level],
      ],
      normale: UP,
      face: 'dessus',
      role,
      motif: 0,
    });
    const facettes: Facette[] = [flat(w, 1 - e, s, 1 - n, 'nappe')];
    // Les bandes du liseré : celles de −y et +y de bout en bout, celles de −x et +x entre elles.
    if (s) facettes.push(flat(0, 1, 0, s, 'lisere'));
    if (n) facettes.push(flat(0, 1, 1 - n, 1, 'lisere'));
    if (w) facettes.push(flat(0, w, s, 1 - n, 'lisere'));
    if (e) facettes.push(flat(1 - e, 1, s, 1 - n, 'lisere'));
    const box = boiteDansLaCase(0, 1, 0, 1, 0, level);
    // Les flancs, sauf contre une margelle (`walled`, 4 bits comme `neighbours`) : là, jamais vus.
    const sideBit = (v: V3) => (v[0] > 0 ? 0 : v[1] > 0 ? 1 : v[0] < 0 ? 2 : 3);
    facettes.push(...box.facettes.filter((f) => isSide(f) && !(walled & (1 << sideBit(f.normale)))).map((f): Facette => ({ ...f, role: 'flanc', motif: 0 })));
    if (lily) {
      const r = HEART.water.lily;
      const z = level + HEART.water.lilyLift;
      const p = Array.from({ length: 8 }, (_, i): V3 => [0.5 + r * Math.cos((i * Math.PI) / 4 + Math.PI / 8), 0.5 + r * Math.sin((i * Math.PI) / 4 + Math.PI / 8), z]);
      for (let i = 1; i < 7; i++) facettes.push({ points: [p[0], p[i], p[i + 1]], normale: UP, face: 'dessus', role: 'feuille', motif: 0 });
    }
    return { facettes, couvre: 0 };
  });
}

/** Le masque des voisines d'eau d'une case (+x, +y, −x, −y, l'ordre de `SIDES`) : `isWater(dx, dy)`. */
export function waterNeighbours(isWater: (dx: number, dy: number) => boolean): number {
  let m = 0;
  SIDES.forEach(([dx, dy], i) => {
    if (isWater(dx, dy)) m |= 1 << i;
  });
  return m;
}

/**
 * Le champ de blé : une bande basse de toute la case, dans la paille (le rôle `paille`), ses flancs striés comme la tôle,
 * dans un ton plus sombre de la paille (`HEART_MOTIFS.straw`) ; il file le long de y (une rangée d'un tenant). Son dessus
 * n'a aucun motif : `straw` y serait lu comme les joints d'un tablier (`HEART_MOTIFS.planksAlongY`, le même nombre).
 */
export function wheat(): DessinDePiece {
  return once('ble', () => {
    const box = boiteDansLaCase(0, 1, 0, 1, 0, HEART.wheat);
    return { facettes: painted(without(box.facettes, DOWN), HEART_MOTIFS.straw, 0).map((f) => ({ ...f, role: 'paille' as const })), couvre: 0, filant: true };
  });
}

/** Le chaperon brun de la cabine : une dalle mince de toute la case, posée sur elle, dans sa couleur. */
export function cap(): DessinDePiece {
  const box = boiteDansLaCase(0, 1, 0, 1, 0, HEART.cap);
  return { facettes: without(box.facettes, DOWN), couvre: box.couvre };
}

/** Une perle du boulier : une boîte en retrait de 0,08 de chaque côté, séparée de ses voisines (10 triangles). */
export function bead(): DessinDePiece {
  const e = HEART.bead;
  const box = boiteDansLaCase(e, 1 - e, e, 1 - e, 0, 1 - e);
  return { facettes: without(box.facettes, DOWN), couvre: 0 };
}

/**
 * Le pain de craie : une boîte en retrait (0,8 × 0,8, 0,6 de haut), son dessus d'un seul tenant, dans une teinte plus
 * sombre de la craie (le chaperon d'un mur plein). Ses faces gardent leur écart avec le fantôme (`ghostApart`,
 * world/construction.ts : `apartFromGhost`) : une craie claire ne se confond jamais avec une case à poser.
 */
export function chalkLoaf(): DessinDePiece {
  return once('craie', () => {
    const { side, height } = HEART.chalk;
    const [a, b] = [0.5 - side / 2, 0.5 + side / 2];
    const box = boiteDansLaCase(a, b, a, b, 0, height);
    return { facettes: painted(without(box.facettes, DOWN), 0, MOTIF.plein | MOTIF.pierreEntiere).map((f) => ({ ...f, ghostApart: true })), couvre: 0 };
  });
}

/** L'écart entre deux couleurs, en RVB (la distance euclidienne de 0 à 441). */
export function rgbGap(a: Couleur, b: Couleur): number {
  const [p, q] = [rgb(a), rgb(b)];
  return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
}

/** La marge de l'écart au fantôme : l'arrondi de l'aller et retour en couleur linéaire (world/construction.ts). */
const GHOST_MARGIN = 1;

/** Le gris neutre vers lequel une teinte trop proche du fantôme s'assombrit (celui du soubassement du kit du 6e). */
const NEUTRAL_GREY = 0x8a8f84;

/**
 * Une teinte tenue à `HEART.chalk.ghostGap` du fantôme Brume au moins (le référent dys) : telle quelle si elle en est
 * assez loin, sinon menée vers un gris neutre, par pas de 5 %, jusqu'à l'écart plus un point (`GHOST_MARGIN`) : l'aller
 * et retour en couleur linéaire du maillage arrondit d'un point au plus, et l'écart reste de 70 au moins à l'écran.
 */
export function apartFromGhost(c: Couleur): Couleur {
  let out = c;
  for (let i = 1; rgbGap(out, BRUME) < HEART.chalk.ghostGap + GHOST_MARGIN && i <= 20; i++) out = mixColor(c, NEUTRAL_GREY, i / 20);
  return out;
}

/** Le tas de sable de fouille : un tronc de pyramide bas (comme le précieux, ./precious.ts), 10 triangles. */
export function mound(): DessinDePiece {
  const { base, top, height } = HEART.mound;
  return { facettes: frustum(base, base, top, top, 0, height), couvre: 0 };
}

/** La traverse de la potence : une poutre carrée sous le haut de la case, le long de x ou de y, de bout en bout. */
export function beam(alongX: boolean): DessinDePiece {
  const s = HEART.beam;
  const [a, b] = [0.5 - s / 2, 0.5 + s / 2];
  const box = alongX ? boiteDansLaCase(0, 1, a, b, 1 - s, 1) : boiteDansLaCase(a, b, 0, 1, 1 - s, 1);
  return { facettes: box.facettes.map((f) => ({ ...f, role: 'pilotis' as const })), couvre: 0 };
}

/** Le poteau sombre du réverbère : la forme du poteau de bois (./lowPieces.ts), dans la couleur de son bloc. */
export function darkPost(top: boolean): DessinDePiece {
  const p = woodenPost(top);
  return { facettes: p.facettes.map(({ role: _role, ...f }) => f), couvre: p.couvre };
}

// ---------- Ce qui pousse : les primitives du décor, dans la case ----------

/** La couleur des sommets n'est pas lue (une facette prend le dessus ou le côté de sa matière) : un peintre neutre. */
const NEUTRE: Peindre = () => [0, 0, 0];

/**
 * Les facettes tracées par un pinceau du décor (repère Three : X = x, Y = hauteur, Z = y), ramenées en coordonnées de
 * grille : une facette tournée vers le haut prend le dessus de sa matière, les autres son côté.
 */
function fromBrush(draw: (P: Pinceau) => void): Facette[] {
  const P = new Pinceau();
  draw(P);
  const f = P.fin();
  const out: Facette[] = [];
  for (let i = 0; i < f.positions.length / 9; i++) {
    const p = (k: number): V3 => [f.positions[9 * i + 3 * k], f.positions[9 * i + 3 * k + 2], f.positions[9 * i + 3 * k + 1]];
    const normale: V3 = [f.normals[9 * i], f.normals[9 * i + 2], f.normals[9 * i + 1]];
    out.push({ points: [p(0), p(1), p(2)], normale, face: normale[2] > 0.5 ? 'dessus' : 'cote', motif: 0 });
  }
  return out;
}

/**
 * Le rocher : l'icosaèdre bosselé du rocher commun (../decor/common.ts), réduit à la case, dans la teinte de sa matière
 * (pierre, galet, obsidienne) ; un galet est plus bas (`low`). 20 triangles ; le hasard, tiré de la case, ne change pas.
 */
export function rock(seed: string, low: boolean): DessinDePiece {
  return once(`rocher|${seed}|${low}`, () => {
    const { radius: r, flat, bump } = HEART.rock;
    const sy = low ? HEART.rock.low : flat;
    return bumpy(seed, [0.5, r * sy, 0.5], r / (1 + bump), sy, bump);
  });
}

/**
 * Un icosaèdre bosselé du décor (le rocher, la couronne, le buisson), son hasard et sa rotation tirés de `seed` : le même
 * dessin d'une construction à l'autre.
 */
function bumpy(seed: string, centre: [number, number, number], r: number, sy: number, bump: number): DessinDePiece {
  const hasard = hasardDe(seed);
  const rot = hasard() * Math.PI * 2;
  return { facettes: fromBrush((P) => icosaedre(P, centre, r, sy, bump, hasard, NEUTRE, rot)), couvre: 0 };
}

/**
 * Un tronc du petit arbre : le tronc de cône à cinq pans de l'arbre commun, sur toute la hauteur de sa case, sans
 * chapeau (la couronne, ou le tronc du dessus, le couvre). 10 triangles.
 */
export function trunk(): DessinDePiece {
  const [r0, r1] = HEART.tree.trunk;
  return once('tronc', () => ({ facettes: fromBrush((P) => tronconique(P, 0.5, 0.5, 0, 1, r0, r1, 5, 0, NEUTRE, false)), couvre: 0 }));
}

/** La couronne du petit arbre, ou un buisson (`bush`) : l'icosaèdre du feuillage, plus bas pour le buisson. 20 triangles. */
export function foliage(seed: string, bush: boolean): DessinDePiece {
  return once(`feuillage|${seed}|${bush}`, () => {
    const r = bush ? HEART.tree.bush : HEART.tree.crown;
    const sy = bush ? 0.72 : 0.86;
    const bump = 0.12;
    return bumpy(seed, [0.5, r * sy * (1 + bump), 0.5], r / (1 + bump), sy, bump);
  });
}

// ---------- Le cône des Décimaux ----------

/** Une facette du cône : ses points, sa normale calculée, le dessus de sa matière si elle regarde vers le haut. */
const coneFacet = (points: V3[]): Facette => {
  const normale = normalOf(points);
  return { points, normale, face: normale[2] > 0.5 ? 'dessus' : 'cote', motif: 0 };
};

/**
 * Un pan de la jupe du cône, au milieu d'un bord de sa première rangée : un prisme couché, haut de 1 contre le cœur (−x
 * dans l'orientation de référence), à 0 au bord (+x). Posé d'un quart de tour par bord : vers +x, +y, −x, −y. Ses deux
 * bouts sont ceux des coins voisins (l'assemblage les retire) : on en voit 2 triangles.
 */
export function coneSide(): DessinDePiece {
  return once('cone|pan', () => ({
    facettes: [
      coneFacet([[1, 0, 0], [1, 1, 0], [0, 1, 1], [0, 0, 1]]),
      coneFacet([[0, 0, 0], [1, 0, 0], [0, 0, 1]]),
      coneFacet([[0, 1, 0], [0, 1, 1], [1, 1, 0]]),
      coneFacet([[0, 0, 0], [0, 0, 1], [0, 1, 1], [0, 1, 0]]),
    ],
    couvre: FACES.ouest,
  }));
}

/**
 * Un coin de la jupe : la croupe d'un toit en pavillon, haute de 1 au coin du cœur (0, 0 dans l'orientation de
 * référence, le coin +x +y), à 0 aux deux bords libres. Posé d'un quart de tour par coin. 2 triangles vus.
 */
export function coneCorner(): DessinDePiece {
  return once('cone|coin', () => ({
    facettes: [
      coneFacet([[0, 0, 1], [1, 0, 0], [1, 1, 0]]),
      coneFacet([[0, 0, 1], [1, 1, 0], [0, 1, 0]]),
      coneFacet([[0, 0, 0], [1, 0, 0], [0, 0, 1]]),
      coneFacet([[0, 0, 0], [0, 0, 1], [0, 1, 0]]),
    ],
    couvre: 0,
  }));
}

/**
 * Une case de la cheminée du cône : un tronc de pyramide de la largeur `from` (en bas) à `to` (en haut), sur la hauteur
 * `height`. Sans dessus quand une autre case le coiffe ; la case du sommet (`ember`) : son dessus seul en braise mate
 * (le rôle `braise`), ses flancs dans la pierre du cône (`colourBelow` : la couleur du bloc de dessous).
 */
export function coneStep(from: number, to: number, height: number, ember: boolean): DessinDePiece {
  return once(`cone|${from}|${to}|${height}|${ember}`, () => {
    const [top, ...sides] = frustum(from, from, to, to, 0, height);
    const facettes: Facette[] = ember ? [{ ...top, role: 'braise' }, ...sides.map((f) => ({ ...f, colourBelow: true }))] : sides;
    return { facettes, couvre: from >= 1 ? FACES.bas : 0 };
  });
}

// ---------- Le 5e : l'auvent, la planche du panneau, la plate-bande, la congère ----------

/**
 * L'auvent du cœur (au 5e : la toile du Marché, la tuile du Comptoir) : une nappe mince de toute la case, en haut de sa
 * case, sans dessous (aucune caméra ne passe sous un auvent) ; deux auvents voisins se touchent (l'assemblage retire
 * leurs flancs communs) et une rangée le long de y se dessine d'un seul tenant. 10 triangles, ceux d'un cube.
 */
export function awning(): DessinDePiece {
  return once('auvent', () => {
    const box = boiteDansLaCase(0, 1, 0, 1, 1 - HEART.awning, 1);
    return { facettes: without(box.facettes, DOWN), couvre: 0, filant: true };
  });
}

/**
 * Le couvercle d'une petite construction (au 5e, la tuile posée sur la glace de la glacière de Pudding) : une nappe mince,
 * de l'épaisseur de l'auvent, posée au bas de sa case sur ce qu'elle couvre (en haut de sa case, elle flotterait au-dessus
 * de la glace), d'un seul tenant le long d'une rangée ; elle cache le dessus qu'elle couvre. 10 triangles.
 */
export function lid(): DessinDePiece {
  return once('couvercle', () => {
    const box = boiteDansLaCase(0, 1, 0, 1, 0, HEART.awning);
    return { facettes: without(box.facettes, DOWN), couvre: FACES.bas, filant: true };
  });
}

/**
 * La planche d'un panneau indicateur (au 5e) : une planche mince, à mi-hauteur, de toute la longueur de sa case, qui se
 * prolonge jusqu'à la face du poteau qui la porte (`post` : le côté du poteau, le long de x ou de y), sans jour entre eux
 * (retouches du 9 octobre 2026) ; sans flèche ni rien qui ressemble à une lettre, sans dessous. 10 triangles.
 */
export function signBoard(post: readonly [number, number]): DessinDePiece {
  const [dx, dy] = post;
  return once(`panneau|${dx}|${dy}`, () => {
    const { thick, bottom, top } = HEART.signBoard;
    const [a, b] = [0.5 - thick / 2, 0.5 + thick / 2];
    // Jusqu'à la face du poteau carré (../lowPieces.ts), dans la case voisine.
    const reach = 0.5 - PIECES_BASSES.woodenPost / 2;
    const along = (d: number): [number, number] => [d < 0 ? -reach : 0, d > 0 ? 1 + reach : 1];
    const box = dx !== 0 ? boiteDansLaCase(...along(dx), a, b, bottom, top) : boiteDansLaCase(a, b, ...along(dy), bottom, top);
    return { facettes: without(box.facettes, DOWN), couvre: 0 };
  });
}

/**
 * L'épi d'un roseau (au 5e, le Marais des temps : l'or posé en haut d'un poteau de bois) : une boîte plus petite que sa
 * case, posée sur le poteau, dans la couleur de sa matière ; sans dessous. 10 triangles.
 */
export function reedHead(): DessinDePiece {
  return once('epi', () => {
    const { side, height } = HEART.reedHead;
    const [a, b] = [0.5 - side / 2, 0.5 + side / 2];
    return { facettes: without(boiteDansLaCase(a, b, a, b, 0, height).facettes, DOWN), couvre: 0 };
  });
}

/**
 * Le tube du thermomètre (au 5e, le verre posé sur la glace au Glacier ; retouches du 9 octobre 2026, troisième tour : il
 * se lisait comme une caisse à croisillons sous un cube d'or) : un tube de verre uni, plus étroit que sa case, de toute
 * sa hauteur, sans croisillons ni dessous, sa teinte tenue loin du fantôme Brume (`ghostApart`). 10 triangles.
 */
export function thermometerTube(): DessinDePiece {
  return once('thermometre', () => {
    const [a, b] = [0.5 - HEART.thermometerTube / 2, 0.5 + HEART.thermometerTube / 2];
    return { facettes: without(boiteDansLaCase(a, b, a, b, 0, 1).facettes, DOWN).map((f) => ({ ...f, ghostApart: true })), couvre: 0 };
  });
}

/**
 * La plate-bande de rizière (au 5e) : une bande basse de toute la case, son dessus dans le vert de la rizière, ses flancs
 * dans son eau (les couleurs de sa matière), peinte à plat ; une rangée le long de y d'un seul tenant. Les stries que
 * l'intention prévoyait (comme le blé) sautent : le shader les peindrait dans un ton plus sombre de la matière, pas en
 * vert (voir docs/univers/archipeo/cadrage.md). 10 triangles.
 */
export function paddyBed(): DessinDePiece {
  return once('riziere', () => {
    const box = boiteDansLaCase(0, 1, 0, 1, 0, HEART.paddy);
    return { facettes: without(box.facettes, DOWN), couvre: 0, filant: true };
  });
}

/**
 * La congère (au 5e, le nuage posé au Glacier) : le tas bas (`mound`), dans la neige du kit (le rôle `snow`), sa teinte
 * tenue loin du fantôme Brume (`ghostApart`). 10 triangles.
 */
export function snowDrift(): DessinDePiece {
  return once('congere', () => ({ facettes: mound().facettes.map((f) => ({ ...f, role: 'snow' as const, ghostApart: true })), couvre: 0 }));
}

// ---------- Le 4e et le 3e : le tube couché, la planche debout, la verrière basse ----------

/**
 * Un tube couché (au 4e, la longue-vue de cuivre sur son trépied ; au 3e, la lentille au bout de la lunette) : de toute la
 * longueur de sa case le long de x (`alongX`) ou de y, du côté du tube de verre du thermomètre, à mi-hauteur, sans
 * dessous ni bouts (deux tubes voisins se touchent, l'assemblage retire leurs bouts communs ; un bout libre se devine,
 * creux, de très près seulement) ; sa teinte tenue loin du fantôme Brume (`ghostApart`). 6 triangles.
 */
export function lyingTube(alongX: boolean): DessinDePiece {
  return once(`tube|${alongX}`, () => {
    const [a, b] = [0.5 - HEART.thermometerTube / 2, 0.5 + HEART.thermometerTube / 2];
    const box = alongX ? boiteDansLaCase(0, 1, a, b, a, b) : boiteDansLaCase(a, b, 0, 1, a, b);
    const bouts: V3[] = alongX ? [[1, 0, 0], [-1, 0, 0]] : [[0, 1, 0], [0, -1, 0]];
    return { facettes: without(box.facettes, DOWN, ...bouts).map((f) => ({ ...f, ghostApart: true })), couvre: 0 };
  });
}

/**
 * Une planche debout (au 4e, le mur de liège de la maquette de Liège, posée sur sa caisse) : une planche de 0,15 au milieu
 * de sa case, de toute sa largeur (le long de x) et de toute sa hauteur, sans dessous. 10 triangles.
 */
export function standingBoard(): DessinDePiece {
  return once('planche-debout', () => {
    const [a, b] = [0.5 - HEART.standingBoard / 2, 0.5 + HEART.standingBoard / 2];
    return { facettes: without(boiteDansLaCase(0, 1, a, b, 0, 1).facettes, DOWN), couvre: 0 };
  });
}

/**
 * La verrière basse d'un faîte (au 3e, le faîte de miroirs du temple) : une boîte basse, plus étroite que sa case, de
 * toute sa longueur le long de y (une rangée d'un seul tenant, ./assembly.ts ; posée d'un quart de tour le long de x),
 * ses flancs peints de petits bois (`HEART_MOTIFS.glazing`), son dessus uni ; sans dessous. 10 triangles.
 */
export function lowGlazing(): DessinDePiece {
  return once('verriere-basse', () => {
    const { width, height } = HEART.lowGlazing;
    const [a, b] = [0.5 - width / 2, 0.5 + width / 2];
    return { facettes: painted(without(boiteDansLaCase(a, b, 0, 1, 0, height).facettes, DOWN), HEART_MOTIFS.glazing, 0), couvre: 0, filant: true };
  });
}

/** Une case sans dessin (la feuille d'un nénuphar, que la nappe d'en dessous porte). */
export const EMPTY: DessinDePiece = { facettes: [], couvre: 0 };
