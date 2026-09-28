// Le décor d'Archipéo (lot R4 de la piste Rendu, docs/conception/cadrage-archipeo.md) : les arbres, les rochers, les
// repères, les cascades et l'habillage de la mer, en primitives basse résolution (troncs à cinq pans, feuillages en
// icosaèdres, cônes de sapin, rochers bosselés), peintes par sommet avec la palette de l'archipel, et fusionnées en un
// seul maillage pour tout le décor (un second pour ce qui brille : lanternes, lave). Code pur, sans Three.js : il lit
// les cubes du décor rangés par nom (./props.ts, ./decor.ts) et le champ du sol (./landMesh.ts), et rend des tableaux
// typés que la vue 3D dessine en un ou deux appels de dessin.
//
// - Chaque genre a sa forme, rangée dans le registre `FORMES` (./decor/formes.ts) : les formes communes aux quatre
//   archipels (./decor/communes.ts), celles propres à chacun (./decor/6e.ts…), dessinées avec ./decor/pinceau.ts.
// - Chaque élément est posé au milieu de sa case, sur la pente (`hauteurDuSol`) : plus de socle plat sous le décor, le
//   sol à facettes passe dessous (`rangerLeDecor` le sort des cubes qui figent une case). Un repère de plusieurs cases
//   s'enfonce jusqu'au plus bas de son emprise, sur un pied élargi : il ne flotte jamais au bord d'une pente.
// - Les cascades collent à la falaise de la case du bord, de la pente jusqu'à l'eau ; les écueils et les bancs
//   affleurent à la surface de la mer.
// - Seules les fumées bougent (./decor/fumee.ts, un maillage à part) ; « Réduire les animations » les fige dans la pose
//   du lot R4. La nuit vient de la lumière de la scène, comme pour le sol ; ce qui brille (lanternes, lave) est à part,
//   sans ombre ni lumière ; la lanterne du phare a en plus ses couleurs de nuit (claire de jour, elle brille la nuit).
import type { VoxelCube } from '../Voxel';
import { mixColor } from './daylight';
import { DECOR_BATI, REPERES, type Repere } from './decor';
import { formeDe } from './decor/formes';
import { Fumees, type FumeeDuDecor } from './decor/fumee';
import { clamp, DELAVE, FAMILLES, hasardDe, hex, Pinceau, rgb, valeur, type FacettesDuDecor, type RGB } from './decor/pinceau';
import { colonneEn, hauteurDuSol, type ChampDuSol } from './landMesh';
import type { ArchipelagoId } from './map';
import { cielDe, couleurDeMatiere, couleurDuSol, MATIERES, type Faces } from './palette';
import type { TextureKind } from './pixels';
import { kindOf, PROP_KINDS } from './props';
import type { Cell } from './view';

export { ELAN, FAMILLES, FEUILLAGE, PIED, TAILLES, valeur, type FacettesDuDecor } from './decor/pinceau';
export { ENFONCE } from './decor/communes';
export { FUMEE, poserLesFumees, type FumeeDuDecor } from './decor/fumee';
export { FORMES } from './decor/formes';

/** Un élément du décor : ses cubes dans le monde en blocs, et où il pousse. */
export interface ElementDeDecor {
  id: string;
  /** Son genre (« arbre », « grand-phare », « ecueil »…). */
  genre: string;
  cubes: VoxelCube[];
  /** La case du pied : le tronc, la première case d'un repère, la case du bord d'une cascade, le centre d'un écueil. */
  x: number;
  y: number;
  /** Le niveau du sol sous lui dans le monde en blocs (le bas de son cube le plus bas). */
  z: number;
  /** Le côté de son emprise au sol, en cases (2 pour un repère de 2 × 2). */
  emprise: number;
  /** Île fermée : couleurs délavées. */
  muted: boolean;
}

/** Les genres dessinés en primitives : le décor rangé de la 2D (arbres, buissons, rochers…) et le décor bâti. */
const EN_PRIMITIVES: ReadonlySet<string> = new Set<string>([...PROP_KINDS, ...DECOR_BATI]);

/** Les genres dont le nom porte la case du monde (« genre@x,y ») ; le décor du cœur porte une case du cœur. */
const NOM_DU_MONDE: ReadonlySet<string> = DECOR_BATI;

/** Un cube d'un élément de décor dessiné en primitives. */
export function enPrimitives(c: VoxelCube): boolean {
  return Boolean(c.decor) && !c.ghost && EN_PRIMITIVES.has(kindOf(c.decor!));
}

/**
 * Sépare le décor dessiné en primitives des autres cubes. Le reste (le sol, la construction, le décor du cœur, les
 * objets du quai) va au champ du sol et aux cubes : une case où seul un élément du décor était posé n'est plus figée.
 */
export function rangerLeDecor(cubes: VoxelCube[]): { elements: ElementDeDecor[]; reste: VoxelCube[] } {
  const groupes = new Map<string, VoxelCube[]>();
  const reste: VoxelCube[] = [];
  for (const c of cubes) {
    if (!enPrimitives(c)) {
      reste.push(c);
      continue;
    }
    const list = groupes.get(c.decor!);
    if (list) list.push(c);
    else groupes.set(c.decor!, [c]);
  }
  const elements: ElementDeDecor[] = [];
  for (const [id, list] of groupes) {
    const genre = kindOf(id);
    const z = Math.min(...list.map((c) => c.z));
    let x: number;
    let y: number;
    const bas = list.filter((c) => c.z === z);
    if (NOM_DU_MONDE.has(genre)) {
      const [px, py] = id
        .slice(id.lastIndexOf('@') + 1)
        .split(',')
        .map(Number);
      x = px;
      y = py;
    } else {
      // Comme la 2D (./props.ts) : le pied du tronc s'il y en a un ; sinon la case que nomme le décor du paysage (un
      // sapin dont le tronc tomberait sur le cœur n'y a que son feuillage) ; sinon le cube le plus bas.
      const tronc = list.filter((c) => c.texture === 'tronc');
      const pied = (tronc.length ? tronc : list).reduce((p, q) => (q.z < p.z || (q.z === p.z && (q.x < p.x || (q.x === p.x && q.y < p.y))) ? q : p));
      const nom = id.slice(id.lastIndexOf('/') + 1);
      const [px, py] = nom.slice(nom.indexOf('@') + 1).split(',').map(Number);
      const duPaysage = !tronc.length && !nom.startsWith('cœur:') && Number.isInteger(px) && Number.isInteger(py);
      x = duPaysage ? px : pied.x;
      y = duPaysage ? py : pied.y;
    }
    const xs = bas.map((c) => c.x);
    // Un repère peut couvrir plusieurs cases (sa fumée ne touche pas le sol) ; le reste du décor pousse sur une case.
    const emprise = REPERES.includes(genre as Repere) && genre !== 'fumee' ? Math.max(1, Math.max(...xs) - Math.min(...xs) + 1) : 1;
    elements.push({ id, genre, cubes: list, x, y, z, emprise, muted: list.some((c) => c.muted) });
  }
  return { elements, reste };
}

// ---------- Le décor ----------

export interface MaillageDuDecor {
  /** Tout le décor, en un seul appel de dessin. */
  decor: FacettesDuDecor;
  /** Ce qui brille (lanternes, lave), sans lumière : un second appel, seulement s'il y en a. */
  lueurs: FacettesDuDecor;
  /** Les fumées, qui bougent : un troisième appel, seulement s'il y en a (./decor/fumee.ts). */
  fumees: FumeeDuDecor;
  /** Les éléments dessinés, dans l'ordre de `elements`. */
  elements: ElementDeDecor[];
}

/** Les options du décor : le style de surface (`a` : aplats, sans nuance ni variation ; `b` : la nuance retenue). */
export interface OptionsDuDecor {
  style?: 'a' | 'b';
}

/**
 * Le décor d'un archipel en primitives, posé sur le champ du sol : un maillage pour tout le décor, un pour ce qui
 * brille. Les couleurs de la palette de l'archipel, de jour : la nuit vient de la lumière de la scène.
 */
export function maillageDuDecor(a: ArchipelagoId, champ: ChampDuSol, elements: ElementDeDecor[], options: OptionsDuDecor = {}): MaillageDuDecor {
  const style = options.style ?? 'b';
  const P = new Pinceau();
  const L = new Pinceau();
  const F = new Fumees();
  const vues = new Map<string, Faces>();
  /** Les couleurs d'un cube : sa matière dans la palette, sinon sa couleur (déjà délavée si l'île est fermée). */
  const facesDe = (texture: string | undefined, couleur: string, dessus: string | undefined, muted: boolean): Faces => {
    const k = `${texture ?? ''}|${couleur}|${dessus ?? ''}|${muted ? 1 : 0}`;
    let f = vues.get(k);
    if (!f) {
      if (texture && texture in MATIERES) {
        f = couleurDeMatiere(a, texture as TextureKind);
        if (muted) f = { dessus: mixColor(f.dessus, DELAVE[0], DELAVE[1]), cote: mixColor(f.cote, DELAVE[0], DELAVE[1]) };
      } else {
        const c = hex(couleur);
        f = { dessus: dessus ? hex(dessus) : mixColor(c, 0xffffff, 0.12), cote: c };
      }
      vues.set(k, f);
    }
    return f;
  };
  const matiere = (m: TextureKind, muted: boolean) => facesDe(m, '#000000', undefined, muted);
  // Les verts du feuillage : la teinte de la famille, un peu de celle de l'archipel, à la valeur voulue de son herbe.
  const herbe = valeur(couleurDuSol(a, 'herbe').dessus);
  const feuilles = couleurDeMatiere(a, 'feuilles').dessus;
  const verts = FAMILLES.map((f) => {
    const t = rgb(mixColor(feuilles, f.teinte, 0.7));
    const k = (herbe * f.valeur) / valeur(t);
    const c = t.map((v) => clamp(v * k, 0, 255)) as RGB;
    return { ouvert: c, ferme: rgb(mixColor((c[0] << 16) | (c[1] << 8) | c[2], DELAVE[0], DELAVE[1])) };
  });
  const vertDe = (hasard: () => number, muted: boolean) => {
    const v = verts[hasard() < FAMILLES[0].part ? 0 : 1];
    return muted ? v.ferme : v.ouvert;
  };
  const horizon = rgb(cielDe(a, 1).horizon);
  const du = (c: VoxelCube) => facesDe(c.texture, c.color, c.top, Boolean(c.muted));
  /** La hauteur du sol en un point, sinon `repli` (au-dessus de l'eau). */
  const sol = (x: number, y: number, repli: number) => hauteurDuSol(champ, x, y) ?? repli;
  /** Le plus bas du sol sur une emprise carrée (le pied d'un repère s'y enfonce). */
  const plusBas = (x0: number, y0: number, w: number, repli: number) => {
    let m = Infinity;
    for (const u of [0.1, 0.5, 0.9]) for (const v of [0.1, 0.5, 0.9]) m = Math.min(m, sol(x0 + u * w, y0 + v * w, repli));
    return m;
  };

  elements.forEach((e, i) => {
    P.element = i;
    L.element = i;
    const hasard = hasardDe(e.id);
    const vari = style === 'a' ? () => 1 : () => 0.94 + 0.12 * hasard();
    const cx = e.x + 0.5;
    const cz = e.y + 0.5;
    const base = sol(cx, cz, e.z);
    const hautDe = (pred: (c: VoxelCube) => boolean) => Math.max(...e.cubes.filter(pred).map((c) => c.z + 1), e.z);
    const premier = (pred: (c: VoxelCube) => boolean) => e.cubes.find(pred);
    const rot = hasard() * Math.PI * 2;
    formeDe(e.genre)({ P, L, F, e, a, champ, style, cx, cz, base, hasard, rot, vari, du, matiere, sol, plusBas, hautDe, premier, vertDe, horizon });
  });
  return { decor: P.fin(), lueurs: L.fin(), fumees: F.fin(a), elements };
}

/** Triangles et appels de dessin d'un maillage du décor. */
export function coutDuDecor(m: MaillageDuDecor): { triangles: number; drawCalls: number } {
  const f = m.fumees.facettes.elements.length;
  const t = m.decor.elements.length + m.lueurs.elements.length + f;
  return { triangles: t, drawCalls: (m.decor.elements.length ? 1 : 0) + (m.lueurs.elements.length ? 1 : 0) + (f ? 1 : 0) };
}

/**
 * La case touchée sur le décor : celle où pousse l'élément du triangle touché (le haut de sa colonne de sol), et la
 * case au-dessus. Au large (un écueil, un banc), la case de l'eau.
 */
export function caseDuDecor(champ: ChampDuSol, m: MaillageDuDecor, lueur: boolean, triangle: number): { cell: Cell; next: Cell } | null {
  const f = lueur ? m.lueurs : m.decor;
  const i = f.elements[triangle];
  const e = i === undefined ? undefined : m.elements[i];
  if (!e) return null;
  const col = colonneEn(champ, e.x, e.y);
  const z = col ? col.haut : e.z - 1;
  return { cell: { x: e.x, y: e.y, z }, next: { x: e.x, y: e.y, z: z + 1 } };
}

/** La signature d'un décor : la même tant que ses éléments ne changent pas (les couleurs d'une île qu'on ouvre, oui). */
export function signatureDuDecor(elements: ElementDeDecor[]): string {
  return elements.map((e) => `${e.id}${e.muted ? '~' : ''}:${e.cubes.length}`).join('|');
}
