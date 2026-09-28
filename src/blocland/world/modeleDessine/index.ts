// Le modelé dessiné d'Archipéo (étape U2, docs/conception/univers.md §5), un fichier par archipel (./6e.ts…), écrit en
// repère d'île (./types.ts). `modelerLeSol` l'applique aux cubes du sol avant le sol à facettes ; sans modelé, le sol
// est rendu tel quel (le même tableau).
import type { ArchipelagoId } from '../archipels';
import type { VoxelCube } from '../cube';
import { origineDe } from '../terrain';
import type { BiomeId } from '../../biomes';
import { MODELES_6E } from './6e';
import { MODELES_5E } from './5e';
import { MODELES_4E } from './4e';
import { MODELES_3E } from './3e';
import type { Modele } from './types';

export type { Modele } from './types';

/** Le modelé de chaque archipel, île par île. */
export const MODELES: Record<ArchipelagoId, Partial<Record<BiomeId, Modele>>> = { '6e': MODELES_6E, '5e': MODELES_5E, '4e': MODELES_4E, '3e': MODELES_3E };

/** La clé d'une case (comme ../landMesh.ts : les coordonnées tiennent largement dans ± 16 000). */
const cle = (x: number, y: number) => (x + 16384) * 32768 + (y + 16384);

/**
 * Les cubes du sol d'un archipel (`c.sol`), modelés : chaque colonne libre d'une île qui a un modelé monte ou descend à
 * sa hauteur dessinée. Monter ajoute sous le dessus des cubes de la matière d'en dessous ; descendre en retire ; le
 * cube du dessus garde sa matière. Une colonne sous un cube de `autres` (ce qui est posé sur le sol), l'eau et la lave
 * ne bougent pas. Le décor en primitives suit le sol à facettes ; les cubes de `autres`, posés sur des colonnes qui ne
 * bougent pas, aussi.
 */
export function modelerLeSol(
  a: ArchipelagoId,
  sol: VoxelCube[],
  autres: VoxelCube[] = [],
  modeles: Partial<Record<BiomeId, Modele>> = MODELES[a],
): VoxelCube[] {
  if (!Object.keys(modeles).length) return sol;
  const colonnes = new Map<number, VoxelCube[]>();
  for (const c of sol) {
    const k = cle(c.x, c.y);
    const list = colonnes.get(k);
    if (list) list.push(c);
    else colonnes.set(k, [c]);
  }
  const posees = new Set(autres.map((c) => cle(c.x, c.y)));
  const out: VoxelCube[] = [];
  for (const [k, list] of colonnes) {
    const top = list.reduce((p, q) => (q.z > p.z ? q : p));
    const m = top.tag && Object.hasOwn(modeles, top.tag) ? modeles[top.tag as BiomeId] : undefined;
    if (!m || posees.has(k) || top.texture === 'eau' || top.texture === 'lave') {
      out.push(...list);
      continue;
    }
    const o = origineDe(top.tag as BiomeId);
    const h = top.z - o.z;
    const bas = Math.min(...list.map((c) => c.z));
    const x = top.x - o.x;
    const y = top.y - o.y;
    const voulue = m.hauteur(x, y, h);
    // Jamais sous le fond de la colonne : son cube du dessus reste au-dessus de son cube le plus bas.
    const d = Number.isFinite(voulue) ? Math.max(Math.round(voulue) - h, bas - top.z + (list.length > 1 ? 1 : 0)) : 0;
    const matiere = m.dessus?.(x, y, h + d, top.texture) ?? top.texture;
    if (d === 0 && matiere === top.texture) {
      out.push(...list);
      continue;
    }
    const nouveauDessus = top.z + d;
    for (const c of list) if (c !== top && c.z < nouveauDessus) out.push(c);
    if (d > 0) {
      const dessous = list.filter((c) => c !== top).reduce<VoxelCube | undefined>((p, q) => (!p || q.z > p.z ? q : p), undefined) ?? top;
      const flanc = m.flanc ? { ...dessous, texture: m.flanc } : dessous;
      for (let z = top.z; z < nouveauDessus; z++) out.push({ ...flanc, z });
    }
    out.push(matiere === top.texture ? { ...top, z: nouveauDessus } : { ...top, z: nouveauDessus, texture: matiere });
  }
  return out;
}
