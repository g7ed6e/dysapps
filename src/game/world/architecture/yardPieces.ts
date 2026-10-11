// Les pièces communes de la cour (le troisième plan des bâtiments), premier essai de la piste 3 « hybride » du directeur
// artistique (choisie par le mainteneur le 11 octobre 2026) : la barrière, la lanterne sur son poteau et la marche de
// pierre, low poly en aplats francs, d'après les concepts de la barrière et de la lanterne sur poteau (la marche sans
// concept : dalle claire dessus, pierre grise sur les côtés). Formes trapues, rien de fin, deux ou trois couleurs par
// pièce (des rôles du kit : ./rooms.ts). La même pièce dans toutes les cours d'un archipel (au 6e) : elle prend la place
// du cube de kit quand sa case est posée ; fantôme et fondu gardent leurs cubes (GD-6).
//
// Chaque pièce reste dans sa case (le toucher prend toute la case), sans dessous (posée), sans les bouts de lisse au bord
// de la case (la lisse voisine les continue, l'assemblage les ôte de toute façon : ./assembly.ts). La barrière suit sa
// forme (./choices.ts) dans l'orientation de référence, que la pose tourne ; la marche se tourne elle-même vers la porte
// du bâtiment (`dansLeMonde`). La tête de la lanterne est dessinée par la construction (world/construction.ts), ses
// vitres dans les fenêtres : elles s'allument la nuit comme les autres lanternes. Code pur, sans Three.js.
import type { VoxelCube } from '../cube';
import type { ArchipelagoId } from '../archipelagos';
import type { TextureKind } from '../pixels';
import { coursDe, batimentsDe } from '../construction/buildings';
import { FORMES, type Forme, type IdDePiece } from './choices';
import { boiteDansLaCase, type DessinDePiece, type Facette, type Role, type V3 } from './rooms';
import { barriereDe, marcheDe } from './lowPieces';
import type { ManiereDuMur } from './paint';

/** Les mesures des pièces de la cour, en part de case. */
const PIECES_DE_COUR = {
  /** Le poteau de la barrière : sa section, sa hauteur, la pointe de son chapeau (une pyramide basse). */
  poteau: { cote: 0.2, haut: 0.8, chapeau: 0.08 },
  /** Les deux lisses : leur hauteur, leur épaisseur, et le milieu de chacune. */
  lisse: { hauteur: 0.1, epaisseur: 0.08, milieux: [0.32, 0.6] },
  /** Le poteau d'une lanterne (une barrière sous elle) : plus épais, de toute la case, sur un pied de pierre. */
  poteauDeLanterne: { cote: 0.24, pied: { cote: 0.44, haut: 0.14 } },
  /**
   * La tête de la lanterne, posée sur son poteau : le plateau de bois, la cage de fer et ses quatre vitres, l'avant-toit
   * et le toit d'ardoise en pyramide, l'épi de fer.
   */
  lanterne: {
    plateau: { cote: 0.36, haut: 0.08 },
    cage: { cote: 0.28, haut: 0.4 },
    /** La vitre : son retrait du bord de la cage, en largeur et en hauteur, et son décollement (elle ne se bat pas avec la cage). */
    vitre: { retrait: 0.045, decolle: 0.004 },
    avantToit: { cote: 0.48, haut: 0.47 },
    toit: { pointe: 0.66 },
    epi: { cote: 0.08, haut: 0.74 },
  },
  /** La marche : deux degrés, le bas devant, le haut contre la porte ; seule (un seuil entre deux barrières), une dalle. */
  marche: { retrait: 0.06, bas: 0.16, haut: 0.32, seuil: 0.14 },
} as const;

/** Une facette d'un rôle du kit. */
const deRole = (f: Facette, role: Role): Facette => ({ ...f, role });

/** Une boîte dans la case, d'un rôle, sans les faces dont la normale est donnée. */
function boite(x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, role: Role, ...sans: V3[]): Facette[] {
  return boiteDansLaCase(x0, x1, y0, y1, z0, z1)
    .facettes.filter((f) => !sans.some((n) => f.normale[0] === n[0] && f.normale[1] === n[1] && f.normale[2] === n[2]))
    .map((f) => deRole(f, role));
}

const DESSOUS: V3 = [0, 0, -1];
const DESSUS: V3 = [0, 0, 1];

/** Une pyramide à base carrée (le chapeau d'un poteau, un toit, l'épi), sans sa base : quatre triangles. */
function pyramide(cx: number, cy: number, demi: number, z0: number, z1: number, role: Role): Facette[] {
  const coins: V3[] = [
    [cx - demi, cy - demi, z0],
    [cx + demi, cy - demi, z0],
    [cx + demi, cy + demi, z0],
    [cx - demi, cy + demi, z0],
  ];
  const sommet: V3 = [cx, cy, z1];
  const out: Facette[] = [];
  for (let i = 0; i < 4; i++) {
    const a = coins[i];
    const b = coins[(i + 1) % 4];
    // La normale : vers le dehors du côté (a, b), relevée par la pente.
    const mx = (a[0] + b[0]) / 2 - cx;
    const my = (a[1] + b[1]) / 2 - cy;
    const up = (demi * demi) / Math.max(z1 - z0, 1e-6);
    const l = Math.hypot(mx, my, up);
    const n: V3 = [mx / l, my / l, up / l];
    out.push({ points: [a, b, sommet], normale: n, face: 'cote', role });
  }
  return out;
}

/** Le poteau de la barrière, au milieu de sa case : bas et coiffé d'une pyramide, ou de toute la case sous ce qui est dessus. */
function poteau(couvert: boolean): Facette[] {
  const { cote, haut, chapeau } = PIECES_DE_COUR.poteau;
  const [a, b] = [0.5 - cote / 2, 0.5 + cote / 2];
  if (couvert) return boite(a, b, a, b, 0, 1, 'yardPost', DESSOUS, DESSUS);
  return [...boite(a, b, a, b, 0, haut, 'yardPost', DESSOUS, DESSUS), ...pyramide(0.5, 0.5, cote / 2, haut, haut + chapeau, 'yardPost')];
}

/** Le poteau d'une lanterne : épais, de toute la case (la tête de la lanterne le couvre), sur son pied de pierre. */
function poteauDeLanterne(): Facette[] {
  const { cote, pied } = PIECES_DE_COUR.poteauDeLanterne;
  const [a, b] = [0.5 - cote / 2, 0.5 + cote / 2];
  const [p, q] = [0.5 - pied.cote / 2, 0.5 + pied.cote / 2];
  return [...boite(p, q, p, q, 0, pied.haut, 'yardStone', DESSOUS), ...boite(a, b, a, b, pied.haut, 1, 'yardPost', DESSOUS, DESSUS)];
}

/** Les deux lisses, de `x0` à 1 le long de x, au milieu de la case en y : dessus et deux côtés (ni dessous ni bouts). */
function lisses(x0: number): Facette[] {
  const { hauteur, epaisseur, milieux } = PIECES_DE_COUR.lisse;
  const [y0, y1] = [0.5 - epaisseur / 2, 0.5 + epaisseur / 2];
  return milieux.flatMap((m) => boite(x0, 1, y0, y1, m - hauteur / 2, m + hauteur / 2, 'yardRail', DESSOUS, [1, 0, 0], [-1, 0, 0]));
}

/** Une facette tournée d'un quart de tour (+x vers +y) autour du milieu de la case, `r` fois. */
function tourner(f: Facette, r: number): Facette {
  let { points, normale } = f;
  for (let i = 0; i < r; i++) {
    points = points.map(([x, y, z]) => [1 - y, x, z] as V3);
    normale = [-normale[1], normale[0], normale[2]];
  }
  return { ...f, points, normale };
}

/**
 * La barrière d'une cour, d'après sa forme : deux lisses épaisses vers chacune de ses voisines (des barrières), et un
 * poteau trapu au milieu de sa case. Au milieu d'une rangée (`droit`), les lisses d'un bout à l'autre et le poteau une
 * case sur deux (`avecPoteau`), comme la barrière d'avant. Sous une lanterne, le poteau de la lanterne ; sous un autre
 * bloc, un poteau de toute la case. De 12 (seule) à 36 triangles (un angle) ; une rangée, 12 ou 24 par case.
 */
export function barriereDeCour(forme: Forme, dessus: 'lanterne' | 'bloc' | null, avecPoteau: boolean): DessinDePiece {
  const cotes = FORMES.find((f) => f.forme === forme)!.cotes;
  const facettes: Facette[] = [];
  if (forme === 'droit') facettes.push(...lisses(0));
  else for (let r = 0; r < 4; r++) if (cotes & (1 << r)) facettes.push(...lisses(0.5).map((f) => tourner(f, r)));
  if (dessus === 'lanterne') facettes.push(...poteauDeLanterne());
  else if (forme !== 'droit' || avecPoteau || dessus) facettes.push(...poteau(dessus !== null));
  return { facettes, couvre: 0 };
}

/**
 * La marche d'une cour, tournée vers la porte du bâtiment (`versLaPorte`, en quarts de tour depuis +y), dans le monde :
 * deux degrés de pierre, le bas devant, le haut contre la porte, dalle claire dessus et pierre grise sur les côtés ;
 * sans porte voisine (un seuil entre deux barrières), une dalle basse. Sous ce qui est posé dessus, toute la case. De 10
 * (le seuil) à 18 triangles (les deux degrés).
 */
export function marcheDeCour(versLaPorte: number | null, couverte: boolean): DessinDePiece {
  const { retrait: r, bas, haut, seuil } = PIECES_DE_COUR.marche;
  const pierre = (f: Facette) => deRole({ ...f, ghostApart: f.normale[2] > 0 ? true : undefined }, f.normale[2] > 0 ? 'yardSlab' : 'yardStone');
  if (couverte) return { ...boiteDansLaCase(0, 1, 0, 1, 0, 1), facettes: boiteDansLaCase(0, 1, 0, 1, 0, 1).facettes.map(pierre), dansLeMonde: true };
  if (versLaPorte === null) return { facettes: boiteDansLaCase(r, 1 - r, r, 1 - r, 0, seuil).facettes.filter((f) => f.normale[2] >= 0).map(pierre), couvre: 0, dansLeMonde: true };
  // Vers +y : le bas devant (y de r à ½), le haut derrière (de ½ au bord de la case, contre la porte).
  const degreBas = boiteDansLaCase(r, 1 - r, r, 0.5, 0, bas).facettes.filter((f) => f.normale[2] >= 0 && f.normale[1] <= 0);
  const degreHaut = boiteDansLaCase(r, 1 - r, 0.5, 1, 0, haut).facettes.filter((f) => f.normale[2] >= 0);
  const facettes = [...degreBas, ...degreHaut].map(pierre).map((f) => tourner(f, ((versLaPorte % 4) + 4) % 4));
  return { facettes, couvre: 0, dansLeMonde: true };
}

/** Une facette de la tête de la lanterne : son rôle, ou une vitre (dans les fenêtres). */
export interface FacetteDeLanterne extends Facette {
  vitre?: boolean;
}

/**
 * La tête de la lanterne de cour, posée dans sa case sur le poteau de dessous : le plateau de bois, la cage de fer et ses
 * quatre vitres (`vitre` : elles vont dans les fenêtres, éteintes le jour, allumées la nuit), l'avant-toit et le toit
 * d'ardoise, l'épi de fer. Dessinée une fois (`LANTERNE_DE_COUR`) : 34 triangles, et 8 de vitres.
 */
function teteDeLanterne(): FacetteDeLanterne[] {
  const { plateau, cage, vitre, avantToit, toit, epi } = PIECES_DE_COUR.lanterne;
  const m = (c: number): [number, number] => [0.5 - c / 2, 0.5 + c / 2];
  const [p0, p1] = m(plateau.cote);
  const [c0, c1] = m(cage.cote);
  const [t0, t1] = m(avantToit.cote);
  const out: FacetteDeLanterne[] = [
    ...boite(p0, p1, p0, p1, 0, plateau.haut, 'yardPost', DESSOUS),
    ...boite(c0, c1, c0, c1, plateau.haut, cage.haut, 'lanternFrame', DESSOUS, DESSUS),
    ...boite(t0, t1, t0, t1, cage.haut, avantToit.haut, 'lanternRoof', DESSOUS, DESSUS),
    ...pyramide(0.5, 0.5, avantToit.cote / 2, avantToit.haut, toit.pointe, 'lanternRoof'),
    ...pyramide(0.5, 0.5, epi.cote / 2, toit.pointe - 0.04, epi.haut, 'lanternFrame'),
  ];
  // Les vitres, une par côté de la cage, un peu en avant d'elle.
  const [v0, v1] = [c0 + vitre.retrait, c1 - vitre.retrait];
  const [z0, z1] = [plateau.haut + vitre.retrait, cage.haut - vitre.retrait];
  const d = vitre.decolle;
  const vitreDe = (points: V3[], normale: V3): FacetteDeLanterne => ({ points, normale, face: 'cote', vitre: true });
  out.push(
    vitreDe([[c1 + d, v0, z0], [c1 + d, v1, z0], [c1 + d, v1, z1], [c1 + d, v0, z1]], [1, 0, 0]),
    vitreDe([[c0 - d, v0, z0], [c0 - d, v1, z0], [c0 - d, v1, z1], [c0 - d, v0, z1]], [-1, 0, 0]),
    vitreDe([[v0, c1 + d, z0], [v1, c1 + d, z0], [v1, c1 + d, z1], [v0, c1 + d, z1]], [0, 1, 0]),
    vitreDe([[v0, c0 - d, z0], [v1, c0 - d, z0], [v1, c0 - d, z1], [v0, c0 - d, z1]], [0, -1, 0]),
  );
  return out;
}

/** La tête de la lanterne de cour, faite une fois. */
export const LANTERNE_DE_COUR: readonly FacetteDeLanterne[] = teteDeLanterne();

const cle = (x: number, y: number, z: number) => `${x},${y},${z}`;
const formeDe = (piece: IdDePiece): Forme | null => (piece.startsWith('mur.') ? (piece.split('.')[1] as Forme) : null);

/** Les quatre voisines de la marche, en quarts de tour depuis +y : +y, −x, −y, +x (le sens de `tourner`). */
const VERS: readonly [number, number][] = [
  [0, 1],
  [-1, 0],
  [0, -1],
  [1, 0],
];

/**
 * Les pièces de la cour d'un archipel : la barrière, la marche et la lanterne de ses cours (le troisième plan des
 * bâtiments, `coursDe`) ; ailleurs (une petite construction, un monument), la finition commune (./lowPieces.ts).
 * `finitions` : la finition du kit, la barrière et la marche des cours en plus ; `lanterne` : la case est-elle une
 * lanterne de cour (dessinée par la construction) ?
 */
export function yardPiecesOf(
  a: ArchipelagoId,
  finitions: Partial<Record<TextureKind, (piece: IdDePiece, c: VoxelCube) => DessinDePiece | ManiereDuMur | undefined>>,
): { finitions: typeof finitions; lanterne: (c: VoxelCube) => boolean } {
  const dansUneCour = (c: VoxelCube) => !c.place && !c.petiteConstruction && !c.decor && coursDe(a).has(cle(c.x, c.y, c.z));
  const barrieres = new Map<string, DessinDePiece>();
  const marches = new Map<string, DessinDePiece>();
  const barriere = (piece: IdDePiece, c: VoxelCube) => {
    const forme = formeDe(piece);
    if (!forme || !dansUneCour(c)) return barriereDe(piece, c);
    const au = coursDe(a).get(cle(c.x, c.y, c.z + 1)) ?? batimentsDe(a).get(cle(c.x, c.y, c.z + 1));
    const dessus = au === 'lanterne' ? 'lanterne' : au ? 'bloc' : null;
    const avecPoteau = (((c.x + c.y) % 2) + 2) % 2 === 0;
    const k = `${forme}|${dessus}|${avecPoteau}`;
    let d = barrieres.get(k);
    if (!d) barrieres.set(k, (d = barriereDeCour(forme, dessus, avecPoteau)));
    return d;
  };
  const marche = (piece: IdDePiece, c: VoxelCube) => {
    if (!formeDe(piece) || !dansUneCour(c)) return marcheDe(piece);
    const couverte = coursDe(a).has(cle(c.x, c.y, c.z + 1));
    const porte = VERS.findIndex(([dx, dy]) => batimentsDe(a).get(cle(c.x + dx, c.y + dy, c.z)) === 'porte');
    const vers = porte < 0 ? null : porte;
    const k = `${vers}|${couverte}`;
    let d = marches.get(k);
    if (!d) marches.set(k, (d = marcheDeCour(vers, couverte)));
    return d;
  };
  return {
    finitions: { ...finitions, barriere, escalier: marche },
    lanterne: (c) => c.texture === 'lanterne' && dansUneCour(c),
  };
}
