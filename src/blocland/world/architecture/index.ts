// L'architecture modulaire d'Archipéo (lot 7, docs/conception/cadrage-archipeo.md) : les blocs posés des plans
// deviennent des pièces d'architecture (murs, colombages, toits, pilotis), choisies selon leurs voisines dans le plan.
// Code pur, sans Three.js : `architectureDe` lit les cubes d'un monde (ou d'une île) et rend les cases remplacées, les
// facettes des pièces (en coordonnées de grille, à peindre dans le groupe opaque de world/construction.ts) avec la case
// de chacune (la table triangle → case du toucher), et les faces de case que les pièces ferment.
//
// Les règles du socle (7a), décisions du directeur artistique :
// - la règle lit le plan entier, fantômes compris (./voisinage.ts) ;
// - un fantôme reste un cube Brume : seul un bloc posé devient pièce ;
// - la matière reste lisible par famille : la table « bloc vers matière » du kit de l'archipel (./kits/) ;
// - un bloc que le kit ne dessine pas reste un bloc taillé : un kit vide ne remplace rien (aucun changement d'image) ;
// - le verre et les lanternes restent ce qu'ils sont (la vue 2D les allume de même) ; Blocland n'a pas de kit.
import type { VoxelCube } from '../cube';
import type { ArchipelagoId } from '../archipels';
import type { TextureKind } from '../pixels';
import { pieceDe, type IdDePiece, type Rotation } from './choix';
import { KITS, type Famille, type Kit } from './kits';
import { facettesPosees, tournerCouvre, type Facette } from './pieces';
import { estDuPlan, indexDuPlan, voisinageDe } from './voisinage';

export { pieceDe, FORMES, type Forme, type IdDePiece, type Rotation } from './choix';
export { boiteDansLaCase, FACES, facettesPosees, TOUTES_LES_FACES, trianglesDe, type DessinDePiece, type Facette } from './pieces';
export { classeDe, COTES, estDuPlan, indexDuPlan, tournerVoisinage, voisinageDe, type Classe, type Voisinage } from './voisinage';
export { KITS, kitVide, type Famille, type Kit } from './kits';

/** Une case, en coordonnées de grille (z : hauteur). */
export interface CaseDuPlan {
  x: number;
  y: number;
  z: number;
}

/** Une pièce posée : le bloc qu'elle remplace (sa couleur, son île, son lieu), sa pièce, et ses facettes dans le monde. */
export interface PiecePosee {
  cube: VoxelCube;
  famille: Famille;
  piece: IdDePiece;
  rotation: Rotation;
  facettes: Facette[];
}

export interface Architecture {
  /** Les cases remplacées (clés `x,y,z`). */
  remplacees: Set<string>;
  /** Les pièces posées, dans l'ordre des cubes. */
  pieces: PiecePosee[];
  /** Les faces de case que chaque pièce ferme (clé `x,y,z`, bits de `FACES`, déjà tournés). */
  couvre: Map<string, number>;
  /** Le nombre de triangles des pièces. */
  triangles: number;
}

const cle = (x: number, y: number, z: number) => `${x},${y},${z}`;
/** Ce qui s'allume ou éclaire : jamais remplacé (la 2D les allume de même). */
const LUMIERES = new Set(['lanterne', 'verre']);

export interface OptionsDeLArchitecture {
  /** Un bloc à laisser tel quel (déjà remplacé par un modèle : le phare, un pont). */
  exclure?: (c: VoxelCube) => boolean;
  /** Le kit (par défaut, celui de l'archipel). */
  kit?: Kit;
}

/**
 * Les pièces d'architecture d'un monde : chaque bloc posé d'un plan dont le kit de l'archipel dessine la pièce laisse sa
 * case à cette pièce. `cubes` : tout le plan (fantômes compris), car le voisinage se lit sur le plan entier.
 */
export function architectureDe(a: ArchipelagoId, cubes: readonly VoxelCube[], options: OptionsDeLArchitecture = {}): Architecture {
  const kit = options.kit ?? KITS[a];
  const out: Architecture = { remplacees: new Set(), pieces: [], couvre: new Map(), triangles: 0 };
  // Un kit sans pièce ne remplace rien : pas même l'index du plan à faire.
  if (!Object.values(kit.pieces).some((p) => p && Object.keys(p).length)) return out;
  const index = indexDuPlan(cubes);
  for (const c of cubes) {
    if (c.ghost || !estDuPlan(c) || LUMIERES.has(c.texture ?? '') || options.exclure?.(c)) continue;
    if (!Number.isInteger(c.x) || !Number.isInteger(c.y) || !Number.isInteger(c.z)) continue;
    const famille = kit.matieres[c.texture as TextureKind];
    if (!famille) continue;
    const v = voisinageDe(c, index);
    if (!v) continue;
    const { piece, rotation } = pieceDe(v);
    const dessin = kit.pieces[famille]?.[piece];
    if (!dessin) continue;
    const k = cle(c.x, c.y, c.z);
    const facettes = facettesPosees(dessin, rotation, c.x, c.y, c.z);
    out.remplacees.add(k);
    out.couvre.set(k, tournerCouvre(dessin.couvre, rotation));
    out.pieces.push({ cube: c, famille, piece, rotation, facettes });
    out.triangles += facettes.reduce((n, f) => n + f.points.length - 2, 0);
  }
  return out;
}
