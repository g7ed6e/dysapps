// Le genre de chaque bloc (bloc, vitre, lanterne, fantôme) et le décalage d'allumage des vitres et des lanternes.
import type { VoxelCube } from '../../Voxel';
import { DECALAGE_MAX, FENETRES_ALLUMEES, LANTERNES_ALLUMEES } from './reglages';
import { hasardDeCase } from './shader';

/** Le genre d'un bloc dans la construction. */
export type Genre = 'bloc' | 'vitre' | 'lanterne' | 'fantome';

export const cle = (x: number, y: number, z: number) => `${x},${y},${z}`;

const TOITURES = new Set(['toit', 'tuile']);

const LUMIERES = new Set(['lanterne', 'verre']);

/**
 * Le genre de chaque bloc : une vitre est une lanterne ou un verre pris dans un mur (deux blocs pleins de part et
 * d'autre sur une rangée, un bloc de la construction dessous, pas de toit dessus : les fenêtres de world/architect.ts,
 * celles de l'école) ; les autres lanternes (cours, comptoirs, sommets, la lanterne d'un phare sous son toit) restent
 * des lanternes ; le reste est un bloc.
 */
export function genresDesBlocs(cubes: VoxelCube[]): Map<VoxelCube, Genre> {
  const plein = new Map<string, VoxelCube>();
  for (const c of cubes) if (!c.ghost) plein.set(cle(c.x, c.y, c.z), c);
  const mur = (x: number, y: number, z: number) => {
    const n = plein.get(cle(x, y, z));
    return n !== undefined && !LUMIERES.has(n.texture ?? '');
  };
  const out = new Map<VoxelCube, Genre>();
  for (const c of cubes) {
    if (c.ghost) {
      out.set(c, 'fantome');
      continue;
    }
    if (!LUMIERES.has(c.texture ?? '')) {
      out.set(c, 'bloc');
      continue;
    }
    const dessus = plein.get(cle(c.x, c.y, c.z + 1));
    const pris =
      ((mur(c.x - 1, c.y, c.z) && mur(c.x + 1, c.y, c.z)) || (mur(c.x, c.y - 1, c.z) && mur(c.x, c.y + 1, c.z))) &&
      mur(c.x, c.y, c.z - 1) &&
      !(dessus && TOITURES.has(dessus.texture ?? ''));
    out.set(c, pris ? 'vitre' : c.texture === 'lanterne' ? 'lanterne' : 'bloc');
  }
  return out;
}

/** Le bâtiment d'un bloc, pour compter ses vitres allumées : son île et son lieu. */
const batimentDe = (c: VoxelCube) => `${c.tag ?? ''}|${c.place ?? ''}`;

/**
 * Les décalages d'allumage des vitres et des lanternes : `FENETRES_ALLUMEES` vitres par bâtiment, `LANTERNES_ALLUMEES`
 * lanternes par cour (une île et un lieu), rien sur une île fermée.
 */
export function decalagesDe(genres: Map<VoxelCube, Genre>): Map<VoxelCube, number> {
  const out = new Map<VoxelCube, number>();
  const parBatiment = new Map<string, VoxelCube[]>();
  for (const [c, g] of genres) {
    if (g !== 'vitre' && g !== 'lanterne') continue;
    const d = c.muted ? -1 : DECALAGE_MAX * hasardDeCase(c.x + 17, c.y + 5, c.z + 11);
    out.set(c, d);
    if (c.muted) continue;
    const b = `${g}|${batimentDe(c)}`;
    const list = parBatiment.get(b);
    if (list) list.push(c);
    else parBatiment.set(b, [c]);
  }
  for (const [b, list] of parBatiment) {
    const rang = list.map((c) => ({ c, h: hasardDeCase(c.x, c.y + 31, c.z + 7) })).sort((p, q) => p.h - q.h);
    for (const { c } of rang.slice(b.startsWith('vitre') ? FENETRES_ALLUMEES : LANTERNES_ALLUMEES)) out.set(c, -1);
  }
  return out;
}
