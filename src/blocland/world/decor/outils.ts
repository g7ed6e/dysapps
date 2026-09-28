// Ce qu'une forme du décor reçoit pour se dessiner (le socle de la piste Rendu, docs/conception/cadrage-archipeo.md §6) :
// l'élément, sa place sur le sol, son hasard, ses couleurs et les deux pinceaux. Une forme est une fonction pure,
// rangée dans le registre `FORMES` (./formes.ts) sous son genre ; chaque sous-lot écrit les siennes dans son fichier.
import type { VoxelCube } from '../cube';
import type { ElementDeDecor } from '../decorMesh';
import type { ChampDuSol } from '../landMesh';
import type { ArchipelagoId } from '../map';
import type { Faces } from '../palette';
import type { TextureKind } from '../pixels';
import { SMOKE } from '../decor';
import { bouffees, type Fumees, type OptionsDeFumee } from './fumee';
import { boite, peintre, type Pinceau, type RGB } from './pinceau';

/** Ce que reçoit toute forme du décor. */
export interface OutilsDeForme {
  /** Le pinceau du décor (un appel de dessin) et celui de ce qui brille (lanternes, lave). */
  P: Pinceau;
  L: Pinceau;
  /** Les fumées, dans leur maillage à elles (elles bougent) : voir ./fumee.ts. */
  F: Fumees;
  e: ElementDeDecor;
  a: ArchipelagoId;
  champ: ChampDuSol;
  style: 'a' | 'b';
  /** Le milieu de sa case et la hauteur du sol en ce point. */
  cx: number;
  cz: number;
  base: number;
  /** Le hasard de l'élément (tiré de son nom), sa rotation, et une variation de teinte (1 en style a). */
  hasard: () => number;
  rot: number;
  vari: () => number;
  /** Les couleurs d'un cube (sa matière dans la palette, délavée si l'île est fermée), d'une matière. */
  du: (c: VoxelCube) => Faces;
  matiere: (m: TextureKind, muted: boolean) => Faces;
  /** La hauteur du sol en un point, sinon `repli` ; le plus bas du sol sur une emprise carrée. */
  sol: (x: number, y: number, repli: number) => number;
  plusBas: (x0: number, y0: number, w: number, repli: number) => number;
  /** Le haut des cubes de l'élément qui vérifient `pred` ; le premier d'entre eux. */
  hautDe: (pred: (c: VoxelCube) => boolean) => number;
  premier: (pred: (c: VoxelCube) => boolean) => VoxelCube | undefined;
  /** Un des deux verts du feuillage (tire un hasard). */
  vertDe: (hasard: () => number, muted: boolean) => RGB;
  /** L'horizon de jour : les dernières volutes d'une fumée s'y fondent. */
  horizon: RGB;
}

/** Une forme du décor : elle peint son élément avec les pinceaux. */
export type Forme = (o: OutilsDeForme) => void;

/**
 * Ce que reçoit un ornement : un décor d'Archipéo sans cube dans le monde en blocs (une tour, une calotte de glace),
 * posé hors de la grille (design/archipeo/intentions/commun.md, règle 2). Ses triangles n'ont pas d'élément : le
 * toucher les traverse. Il ne change ni la marche, ni les empreintes du monde, ni Blocland.
 */
export interface OutilsDOrnement {
  P: Pinceau;
  a: ArchipelagoId;
  champ: ChampDuSol;
  /** Les éléments du décor déjà posés : un ornement ne se pose pas sur leurs cases. */
  elements: readonly ElementDeDecor[];
  /** La hauteur du sol en un point, sinon `repli`. */
  sol: (x: number, y: number, repli: number) => number;
  style: 'a' | 'b';
}

/** Les ornements d'un archipel : ils se dessinent après les éléments du décor, dans le même appel de dessin. */
export type Ornement = (o: OutilsDOrnement) => void;

/** Ce que reçoit un repère, en plus : il est posé au plus bas de son emprise (il s'y enfonce, jamais ne flotte). */
export interface OutilsDuRepere extends OutilsDeForme {
  /** Le côté de son emprise, son centre, le bas de son pied et le niveau du sol dans le monde en blocs. */
  w: number;
  pied: number;
  Z: number;
  /** Le vert du feuillage (le chêne géant). */
  vert: RGB;
  /** Les couleurs d'une matière de l'élément (celles de son cube s'il en a un). */
  deMatiere: (texture: TextureKind) => Faces;
  /** Les cubes de fumée de l'élément, et comment les dessiner (./fumee.ts). */
  fumee: VoxelCube[];
  bouffees: (list: VoxelCube[], options?: OptionsDeFumee) => void;
}

/**
 * Une forme de repère : un grand ouvrage par région, centré sur son emprise, posé au plus bas de celle-ci. Le vert du
 * feuillage est tiré avant la forme, pour tous les repères (le hasard de chaque élément ne change pas).
 */
export function enRepere(forme: (o: OutilsDuRepere) => void): Forme {
  return (o) => {
    const vert = o.vertDe(o.hasard, o.e.muted);
    const { e } = o;
    const w = e.emprise;
    const fumee = e.cubes.filter((c) => c.color === SMOKE);
    forme({
      ...o,
      vert,
      w,
      cx: e.x + w / 2,
      cz: e.y + w / 2,
      pied: o.plusBas(e.x, e.y, w, e.z) - 0.3,
      Z: e.z,
      fumee,
      bouffees: (list, options) => bouffees(o.F, list, o.hasard, o.rot, o.horizon, options),
      deMatiere: (texture) => {
        const c = e.cubes.find((q) => q.texture === texture);
        return c ? o.du(c) : o.matiere(texture, e.muted);
      },
    });
  };
}

/** Un décor bâti sans forme propre : ses cubes, en boîtes. */
export const enBoites: Forme = enRepere((o) => {
  for (const c of o.e.cubes) boite(o.P, c.x, c.z, c.y, c.x + 1, c.z + 1, c.y + 1, peintre(o.du(c), c.z, 1));
});

