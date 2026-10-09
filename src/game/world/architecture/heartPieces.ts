// Les pièces du cœur des îles, des liaisons et des lieux (intention du directeur artistique, 9 octobre 2026, lot « eau,
// quai, liaisons, cœur, barrière » au 6e) : des volumes simples, opaques, sans chanfrein, dessinés dans leur case en
// coordonnées de grille (x, y de 0 à 1, z : hauteur de 0 à 1) ; rien ne sort de la case, le toucher prend toute la case.
// Ce qui est fait de main d'homme est une boîte, un tronc de pyramide ou une dalle, au coût d'un cube (10 triangles) ou
// moins ; ce qui pousse (le rocher, le petit arbre, le buisson) reprend les primitives du décor (../decor/brush.ts :
// l'icosaèdre bosselé, le tronc de cône à cinq pans), aux proportions de ses formes communes (../decor/common.ts),
// réduites à la case. Code pur, sans Three.js.
import { hasardDe, icosaedre, Pinceau, tronconique, type Peindre } from '../decor/brush';
import { HEART_MOTIFS, MOTIF } from './paint';
import { frustum, normalOf } from './precious';
import { boiteDansLaCase, type DessinDePiece, type Facette, type V3 } from './rooms';
import { woodenPost } from './lowPieces';

/** Les mesures des pièces du cœur, en part de case. */
export const HEART = {
  /** La caisse (carton, cabines, chaume) : son côté, celui d'une caisse posée sur une autre, sa hauteur seule. */
  crate: { side: 0.85, stacked: 0.75, height: 0.85 },
  /** Les caisses de la cour de la Halle : la recette et le bloc suspendu. */
  hallCrate: 0.8,
  /** Les dalles : le rouage de cadrans, l'éclat de mosaïque. */
  slab: { dial: 0.3, mosaic: 0.2 },
  /** La flèche d'or : sa base et sa hauteur. */
  spire: { base: 0.7, height: 0.9 },
  /** Le pavillon (un toit de petite construction) : sa hauteur. */
  pavilion: { height: 0.5 },
  /** Le tablier : le bas du plancher (son haut est celui de la case). */
  deck: 0.8,
  /**
   * L'eau en nappe : sa hauteur sous une margelle (le puits), celle d'une mare posée au sol, le rayon du nénuphar et sa
   * hauteur au-dessus de la nappe (le liseré est peint : `HEART_PAINT.lisere`).
   */
  water: { level: 0.8, pond: 0.15, lily: 0.22, lilyLift: 0.02 },
  /** Le champ de blé : sa hauteur. */
  wheat: 0.5,
  /** Le chaperon brun de la cabine : sa hauteur. */
  cap: 0.25,
  /** Une perle du boulier : son retrait de chaque côté. */
  bead: 0.08,
  /** Le pain de craie. */
  chalk: { side: 0.8, height: 0.6 },
  /** Le tas de sable de fouille. */
  mound: { base: 1, top: 0.5, height: 0.6 },
  /** La traverse de la potence : sa section, sous le haut de la case. */
  beam: 0.3,
  /** Le rocher : son rayon, son aplatissement (bas pour les galets), ses bosses. */
  rock: { radius: 0.42, flat: 0.68, low: 0.5, bump: 0.16 },
  /** Le petit arbre : le tronc (bas, haut), la couronne ; le buisson. */
  tree: { trunk: [0.15, 0.12], crown: 0.45, bush: 0.42 },
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

/** Les côtés d'une case, dans l'ordre des bits du masque d'une nappe : +x, +y, −x, −y. */
const WATER_SIDES = 4;


/**
 * L'eau en nappe : un dessus plat (le rôle `nappe`) à `level` de la case, un liseré clair peint au bord de la nappe
 * seulement (pas du côté d'une autre case d'eau : `neighbours`, 4 bits +x, +y, −x, −y), ses flancs sombres
 * (`flanc`), sans dessous ni flanc contre une margelle (`walled`). Ni reflet ni mouvement. `lily` : un nénuphar posé
 * dessus (un octogone vert, 6 triangles).
 */
export function waterSheet(level: number, neighbours: number, lily: boolean, walled = 0): DessinDePiece {
  return once(`eau|${level}|${neighbours}|${lily}|${walled}`, () => {
    const has = (i: number) => (neighbours & (1 << i)) !== 0;
    // Le liseré, peint au bord de la nappe (le shader : `HEART_MOTIFS.waterRim`), pas du côté d'une autre case d'eau.
    const rim = HEART_MOTIFS.waterRim | (has(2) ? 0 : MOTIF.montante) | (has(0) ? 0 : MOTIF.descendante) | (has(3) ? 0 : MOTIF.chaperon) | (has(1) ? 0 : MOTIF.sabliereHaute);
    const facettes: Facette[] = [
      {
        points: [
          [0, 0, level],
          [1, 0, level],
          [1, 1, level],
          [0, 1, level],
        ],
        normale: UP,
        face: 'dessus',
        role: 'nappe',
        motif: rim,
      },
    ];
    const box = boiteDansLaCase(0, 1, 0, 1, 0, level);
    // Les flancs, sauf contre une margelle (`walled`, 4 bits comme `neighbours`) : là, jamais vus.
    const sideBit = (n: V3) => (n[0] > 0 ? 0 : n[1] > 0 ? 1 : n[0] < 0 ? 2 : 3);
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

/** Le masque des voisines d'eau d'une case (+x, +y, −x, −y) : `isWater(dx, dy)`. */
export function waterNeighbours(isWater: (dx: number, dy: number) => boolean): number {
  const dirs = [
    [1, 0],
    [0, 1],
    [-1, 0],
    [0, -1],
  ];
  let m = 0;
  for (let i = 0; i < WATER_SIDES; i++) if (isWater(dirs[i][0], dirs[i][1])) m |= 1 << i;
  return m;
}

/**
 * Le champ de blé : une bande basse de toute la case, dans la paille (le rôle `paille`), ses flancs striés comme la tôle,
 * dans un ton plus sombre de la paille (`HEART_MOTIFS.straw`) ; il file le long de y (une rangée d'un tenant).
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
 * sombre de la craie (le chaperon d'un mur plein).
 */
export function chalkLoaf(): DessinDePiece {
  const { side, height } = HEART.chalk;
  const [a, b] = [0.5 - side / 2, 0.5 + side / 2];
  const box = boiteDansLaCase(a, b, a, b, 0, height);
  return { facettes: painted(without(box.facettes, DOWN), 0, MOTIF.plein | MOTIF.pierreEntiere), couvre: 0 };
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
  const { radius: r, flat, bump } = HEART.rock;
  const sy = low ? HEART.rock.low : flat;
  const hasard = hasardDe(seed);
  const rot = hasard() * Math.PI * 2;
  return { facettes: fromBrush((P) => icosaedre(P, [0.5, r * sy, 0.5], r / (1 + bump), sy, bump, hasard, NEUTRE, rot)), couvre: 0 };
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
  const hasard = hasardDe(seed);
  const rot = hasard() * Math.PI * 2;
  const r = bush ? HEART.tree.bush : HEART.tree.crown;
  const sy = bush ? 0.72 : 0.86;
  const bump = 0.12;
  return { facettes: fromBrush((P) => icosaedre(P, [0.5, r * sy * (1 + bump), 0.5], r / (1 + bump), sy, bump, hasard, NEUTRE, rot)), couvre: 0 };
}

/** Une case sans dessin (la feuille d'un nénuphar, que la nappe d'en dessous porte). */
export const EMPTY: DessinDePiece = { facettes: [], couvre: 0 };
