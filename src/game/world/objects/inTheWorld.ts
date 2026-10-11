// Les objets dessinés d'Archipéo hors des petites constructions (lot 1 du 6e de la piste 3 « hybride ») : le bloc d'or
// devant chaque Gardien rallumé (world/terrain/guardians.ts, `guardianTrophy` : une case de pierre, une case d'or) et les
// objets du quai de l'île-port (world/terrain/port.ts : la barque, les caisses, les fanions, le foyer). Leurs cubes
// restent ceux du monde (Blocland les dessine, la vue simple ne les voit pas) ; la construction d'Archipéo les remplace
// par le dessin des pièces communes (./pieces.ts), comme un modèle importé (le toucher retrouve leurs cases). La fumée du
// foyer reste la sienne. Seulement aux Premiers Rivages pour l'instant (`ARCHIPELAGOS`, et le kit qui les demande :
// `Kit.objetsDessines`). Code pur, sans Three.js.
import type { VoxelCube } from '../cube';
import { BIOMES } from '../../biomes';
import { type ArchipelagoId, islandDef } from '../map';
import type { ImportedMonument } from '../monumentModels';
import { turnCell } from '../placement';
import { trophySpot } from '../terrain/guardians';
import { islandOrigin } from '../terrain/base';
import { kindOf, SMOKE } from '../decor';
import { Pinceau } from '../decor/brush';
import { Workshop } from './workshop';
import { rowboat, quayCrate, pennant, campfire, paintFor, trophy } from './pieces';

/** Les archipels dont ces objets sont dessinés (le lot 1 : les Premiers Rivages ; ailleurs, les cubes du kit). */
const ARCHIPELAGOS: ReadonlySet<ArchipelagoId> = new Set(['6e']);

/** Les objets du quai que la construction dessine, par genre de décor (world/terrain/port.ts). */
const QUAY_KINDS = new Set(['barque', 'caisse', 'fanion', 'foyer']);

const cellKey = (x: number, y: number, z: number) => `${x},${y},${z}`;

/** Un objet dessiné, posé dans le monde à partir de son coin (x0, y0, z0) : ses cases, et son dessin. */
function drawnObject(id: string, cubes: readonly VoxelCube[], x0: number, y0: number, z0: number, draw: (at: Workshop) => void): ImportedMonument {
  const at = new Workshop(new Pinceau(), null, (x, y, z) => [x0 + x, z0 + z, y0 + y]);
  draw(at);
  return {
    id,
    stage: 1,
    opaque: at.opaque.fin(),
    fire: new Pinceau().fin(),
    halo: null,
    cellules: cubes.map((c) => ({ x: c.x, y: c.y, z: c.z })),
    replaced: new Set(cubes.map((c) => cellKey(c.x, c.y, c.z))),
  };
}

/**
 * Les blocs d'or des Gardiens rallumés de ce monde : à la case de `trophySpot`, tournée avec l'île (GD-9), la pierre et
 * l'or posés l'un sur l'autre ; dessinés en trophée (le socle de pierre taillé, le lingot d'or facetté).
 */
export function drawnTrophies(a: ArchipelagoId, cubes: readonly VoxelCube[]): ImportedMonument[] {
  if (!ARCHIPELAGOS.has(a)) return [];
  const byCell = new Map<string, VoxelCube>();
  for (const c of cubes) if (!c.ghost && (c.texture === 'or' || c.texture === 'pierre')) byCell.set(cellKey(c.x, c.y, c.z), c);
  const out: ImportedMonument[] = [];
  for (const b of BIOMES) {
    if (b.classe !== a) continue;
    const { ox, oy, oz } = islandOrigin(BIOMES.indexOf(b));
    const s = trophySpot(b.id);
    const t = turnCell(s.x, s.y, islandDef(b.id).quarts);
    const [x, y, z] = [ox + t.x, oy + t.y, oz + 1];
    const stone = byCell.get(cellKey(x, y, z));
    const gold = byCell.get(cellKey(x, y, z + 1));
    if (stone?.texture !== 'pierre' || gold?.texture !== 'or' || stone.tag !== b.id || gold.tag !== b.id || stone.place || gold.place) continue;
    const pe = paintFor(a, b.id, Boolean(stone.muted || gold.muted));
    out.push(drawnObject(`trophee:${b.id}`, [stone, gold], x, y, z, (at) => trophy(at, pe)));
  }
  return out;
}

/**
 * Les objets du quai de ce monde (world/terrain/port.ts) : la barque (tirée sur la grève, retournée tant que le village
 * commence, ou amarrée), les caisses, les fanions et le foyer, chacun par son nom de décor ; dessinés en pièces communes.
 */
export function drawnQuayObjects(a: ArchipelagoId, cubes: readonly VoxelCube[]): ImportedMonument[] {
  if (!ARCHIPELAGOS.has(a)) return [];
  const groups = new Map<string, VoxelCube[]>();
  for (const c of cubes) {
    if (!c.decor || c.ghost || !QUAY_KINDS.has(kindOf(c.decor)) || c.color === SMOKE) continue;
    const l = groups.get(c.decor);
    if (l) l.push(c);
    else groups.set(c.decor, [c]);
  }
  const out: ImportedMonument[] = [];
  for (const [id, l] of groups) {
    const xs = l.map((c) => c.x);
    const ys = l.map((c) => c.y);
    const zs = l.map((c) => c.z);
    const [x0, y0, z0] = [Math.min(...xs), Math.min(...ys), Math.min(...zs)];
    const pe = paintFor(a, l[0].tag, l.some((c) => c.muted));
    const kind = kindOf(id);
    if (kind === 'barque') {
      const span = Math.max(Math.max(...xs) - x0, Math.max(...ys) - y0) + 1;
      const axis = Math.max(...xs) - x0 + 1 === span ? 'x' : 'y';
      // Retournée : la proue et la poupe (les planches) posent sur la grève, sous la coque.
      const ends = l.filter((c) => c.texture === 'planches').map((c) => c.z);
      const hull = l.filter((c) => c.texture !== 'planches').map((c) => c.z);
      const capsized = ends.length > 0 && hull.length > 0 && Math.min(...ends) < Math.min(...hull);
      out.push(drawnObject(id, l, x0, y0, z0, (at) => rowboat(at, pe, axis, span, capsized)));
    } else if (kind === 'caisse') out.push(drawnObject(id, l, x0, y0, z0, (at) => l.forEach((c) => quayCrate(at, pe, c.x - x0, c.y - y0, c.z - z0))));
    else if (kind === 'fanion') {
      const mast = l.filter((c) => c.texture === 'tronc');
      const canvas = l.find((c) => c.texture === 'toile');
      if (!mast.length || !canvas) continue;
      const toward = canvas.x > mast[0].x ? 1 : -1;
      out.push(drawnObject(id, l, x0, y0, z0, (at) => pennant(at, pe, mast[0].x - x0, mast[0].y - y0, 0, toward)));
    } else out.push(drawnObject(id, l, x0, y0, z0, (at) => l.forEach((c) => campfire(at, pe, c.x - x0, c.y - y0, c.z - z0))));
  }
  return out;
}
