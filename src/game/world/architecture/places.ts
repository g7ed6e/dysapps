// Les lieux du village dans l'architecture modulaire (lot 7b d'Archipéo, décision du directeur artistique du
// 30 septembre 2026) : l'école, la salle des trophées et le lieu où l'on assemble (GD-2) prennent le kit de leur
// archipel, comme les maisons qui les entourent. Elles ne sont pas des plans : elles sont là dès le début, sans chantier ni fantôme, posées par
// world/terrain.ts. Leur plan se lit donc sur les blocs du monde, et la famille de chaque bloc sur sa place dans le
// modèle du lieu (le kit, `lieux`), pas sur sa seule texture : une même pierre de taille fait un mur à l'école et un toit
// à la salle des trophées. Code pur, sans Three.js.
import type { PlaceId, VoxelCube, VillagePlaceId } from '../cube';
import type { TextureKind } from '../pixels';
import type { CaseDuLieu, Famille, Kit } from './kits';
import { classeDe, type Classe, type IndexDuPlan } from './neighbourhood';

/** Le lieu d'un cube est-il un lieu du village (l'école, la salle des trophées, le lieu où l'on assemble), et non un monument ? */
export const estUnLieuDuVillage = (place: PlaceId | undefined): place is VillagePlaceId => place === 'school' || place === 'trophies' || place === 'assembly';

/** Un bloc d'un lieu que le kit reprend : sa famille et sa classe dans le plan du lieu, et s'il se passe de décharge. */
interface BlocDuLieu {
  famille: Famille;
  classe: Classe;
  sansDecharge: boolean;
}

export interface LieuxDuKit {
  /** Le plan des lieux (clé `x,y,z`) : chaque bloc de leur modèle et chaque trophée posé, et sa classe. */
  index: IndexDuPlan;
  /** Le même, sans les toits cachés sous un autre toit : celui où se lisent les pentes. */
  indexDesToits: IndexDuPlan;
  /** Les blocs qui deviennent pièces ou murs peints. */
  blocs: Map<string, BlocDuLieu>;
  /** Les blocs (pièces ou non) qui prennent la couverture de leur île au lieu de leur matière. */
  couverts: Set<string>;
  /** Les blocs qui prennent la couleur d'une autre matière (la souche du clocheton, en pierre de taille). */
  matieres: Map<string, TextureKind>;
}

const cle = (x: number, y: number, z: number) => `${x},${y},${z}`;

/**
 * Les lieux du village d'un monde, tels que le kit les reprend. `caseDuLieu` : la case d'un bloc dans le modèle de son
 * lieu, ou `null` hors du modèle (le soubassement qui rattrape une marche du sol reste un bloc, sous le colombage).
 * Un toit sous un autre toit (le rang que couvrent le haut du toit de l'école ou le faîte de la salle) est caché : il
 * reste un bloc, et les pentes de ses voisins se lisent sans lui (`indexDesToits`).
 */
export function lieuxDuKit(kit: Kit, cubes: readonly VoxelCube[], caseDuLieu: (c: VoxelCube) => CaseDuLieu | null): LieuxDuKit {
  const out: LieuxDuKit = { index: new Map(), indexDesToits: new Map(), blocs: new Map(), couverts: new Set(), matieres: new Map() };
  const lieux = kit.lieux;
  if (!lieux) return out;
  for (const c of cubes) {
    const lieu = estUnLieuDuVillage(c.place) && !c.ghost ? lieux[c.place] : undefined;
    if (!lieu) continue;
    const m = caseDuLieu(c);
    if (!m) continue;
    const r = lieu(m);
    const classe: Classe | null = r?.famille ? (r.famille === 'toit' ? 'toit' : 'mur') : classeDe(c.texture);
    if (!classe) continue;
    const k = cle(c.x, c.y, c.z);
    out.index.set(k, classe);
    if (r?.famille) out.blocs.set(k, { famille: r.famille, classe, sansDecharge: Boolean(r.sansDecharge) });
    if (r?.couverture) out.couverts.add(k);
    if (r?.matiere) out.matieres.set(k, r.matiere);
  }
  // Les murs lisent le plan entier (un mur sous un toit caché porte sa sablière haute, pas un chaperon) ; les toits, le
  // plan sans les toits cachés.
  for (const [k, classe] of out.index) {
    const [x, y, z] = k.split(',').map(Number);
    if (classe === 'toit' && out.index.get(cle(x, y, z + 1)) === 'toit') out.blocs.delete(k);
    else out.indexDesToits.set(k, classe);
  }
  return out;
}
