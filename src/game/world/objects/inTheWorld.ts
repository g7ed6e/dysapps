// Les objets dessinés d'Archipéo hors des petites constructions (lot 1 du 6e de la piste 3 « hybride ») : le bloc d'or
// devant chaque Gardien rallumé (world/terrain/guardians.ts, `guardianTrophy` : une case de pierre, une case d'or) et les
// objets du quai de l'île-port (world/terrain/port.ts : la barque, les caisses, les fanions, le foyer). Leurs cubes
// restent ceux du monde (Blocland les dessine, la vue simple ne les voit pas) ; la construction d'Archipéo les remplace
// par le dessin des pièces communes (./pieces.ts), comme un modèle importé (le toucher retrouve leurs cases). La fumée du
// foyer reste la sienne. Seulement aux Premiers Rivages pour l'instant (`ARCHIPELS`, et le kit qui les demande :
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
import { Atelier } from './atelier';
import { barque, caisseDuQuai, fanion, foyer, peintureDe, trophee } from './pieces';

/** Les archipels dont ces objets sont dessinés (le lot 1 : les Premiers Rivages ; ailleurs, les cubes du kit). */
const ARCHIPELS: ReadonlySet<ArchipelagoId> = new Set(['6e']);

/** Les objets du quai que la construction dessine, par genre de décor (world/terrain/port.ts). */
const DU_QUAI = new Set(['barque', 'caisse', 'fanion', 'foyer']);

const cle = (x: number, y: number, z: number) => `${x},${y},${z}`;

/** Un objet dessiné, posé dans le monde à partir de son coin (x0, y0, z0) : ses cases, et son dessin. */
function objet(id: string, cubes: readonly VoxelCube[], x0: number, y0: number, z0: number, dessiner: (at: Atelier) => void): ImportedMonument {
  const at = new Atelier(new Pinceau(), null, (x, y, z) => [x0 + x, z0 + z, y0 + y]);
  dessiner(at);
  return {
    id,
    stage: 1,
    opaque: at.opaque.fin(),
    fire: new Pinceau().fin(),
    halo: null,
    cellules: cubes.map((c) => ({ x: c.x, y: c.y, z: c.z })),
    replaced: new Set(cubes.map((c) => cle(c.x, c.y, c.z))),
  };
}

/**
 * Les blocs d'or des Gardiens rallumés de ce monde : à la case de `trophySpot`, tournée avec l'île (GD-9), la pierre et
 * l'or posés l'un sur l'autre ; dessinés en trophée (le socle de pierre taillé, le lingot d'or facetté).
 */
export function tropheesDessines(a: ArchipelagoId, cubes: readonly VoxelCube[]): ImportedMonument[] {
  if (!ARCHIPELS.has(a)) return [];
  const parCase = new Map<string, VoxelCube>();
  for (const c of cubes) if (!c.ghost && (c.texture === 'or' || c.texture === 'pierre')) parCase.set(cle(c.x, c.y, c.z), c);
  const out: ImportedMonument[] = [];
  for (const b of BIOMES) {
    if (b.classe !== a) continue;
    const { ox, oy, oz } = islandOrigin(BIOMES.indexOf(b));
    const s = trophySpot(b.id);
    const t = turnCell(s.x, s.y, islandDef(b.id).quarts);
    const [x, y, z] = [ox + t.x, oy + t.y, oz + 1];
    const pierre = parCase.get(cle(x, y, z));
    const or = parCase.get(cle(x, y, z + 1));
    if (pierre?.texture !== 'pierre' || or?.texture !== 'or' || pierre.tag !== b.id || or.tag !== b.id || pierre.place || or.place) continue;
    const pe = peintureDe(a, b.id, Boolean(pierre.muted || or.muted));
    out.push(objet(`trophee:${b.id}`, [pierre, or], x, y, z, (at) => trophee(at, pe)));
  }
  return out;
}

/**
 * Les objets du quai de ce monde (world/terrain/port.ts) : la barque (tirée sur la grève, retournée tant que le village
 * commence, ou amarrée), les caisses, les fanions et le foyer, chacun par son nom de décor ; dessinés en pièces communes.
 */
export function objetsDuQuaiDessines(a: ArchipelagoId, cubes: readonly VoxelCube[]): ImportedMonument[] {
  if (!ARCHIPELS.has(a)) return [];
  const groupes = new Map<string, VoxelCube[]>();
  for (const c of cubes) {
    if (!c.decor || c.ghost || !DU_QUAI.has(kindOf(c.decor)) || c.color === SMOKE) continue;
    const l = groupes.get(c.decor);
    if (l) l.push(c);
    else groupes.set(c.decor, [c]);
  }
  const out: ImportedMonument[] = [];
  for (const [id, l] of groupes) {
    const xs = l.map((c) => c.x);
    const ys = l.map((c) => c.y);
    const zs = l.map((c) => c.z);
    const [x0, y0, z0] = [Math.min(...xs), Math.min(...ys), Math.min(...zs)];
    const pe = peintureDe(a, l[0].tag, l.some((c) => c.muted));
    const genre = kindOf(id);
    if (genre === 'barque') {
      const long = Math.max(Math.max(...xs) - x0, Math.max(...ys) - y0) + 1;
      const axe = Math.max(...xs) - x0 + 1 === long ? 'x' : 'y';
      // Retournée : la proue et la poupe (les planches) posent sur la grève, sous la coque.
      const bouts = l.filter((c) => c.texture === 'planches').map((c) => c.z);
      const coque = l.filter((c) => c.texture !== 'planches').map((c) => c.z);
      const retournee = bouts.length > 0 && coque.length > 0 && Math.min(...bouts) < Math.min(...coque);
      out.push(objet(id, l, x0, y0, z0, (at) => barque(at, pe, axe, long, retournee)));
    } else if (genre === 'caisse') out.push(objet(id, l, x0, y0, z0, (at) => l.forEach((c) => caisseDuQuai(at, pe, c.x - x0, c.y - y0, c.z - z0))));
    else if (genre === 'fanion') {
      const mat = l.filter((c) => c.texture === 'tronc');
      const toile = l.find((c) => c.texture === 'toile');
      if (!mat.length || !toile) continue;
      const vers = toile.x > mat[0].x ? 1 : -1;
      out.push(objet(id, l, x0, y0, z0, (at) => fanion(at, pe, mat[0].x - x0, mat[0].y - y0, 0, vers)));
    } else out.push(objet(id, l, x0, y0, z0, (at) => l.forEach((c) => foyer(at, pe, c.x - x0, c.y - y0, c.z - z0))));
  }
  return out;
}
