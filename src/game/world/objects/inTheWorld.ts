// Les objets dessinés d'Archipéo hors des petites constructions (piste 3 « hybride », au 6e, au 5e, puis au 4e et au
// 3e) : le bloc d'or devant chaque Gardien rallumé (world/terrain/guardians.ts, `guardianTrophy` : une case de pierre,
// une case d'or), les objets du quai de l'île-port (world/terrain/port.ts : la barque, les caisses, les fanions, le
// foyer) et le décor du cœur des îles (./heartDecor.ts au 6e, ./heartDecor5e.ts au 5e, ./heartDecor4e.ts et
// ./heartDecor3e.ts au 4e et au 3e). Leurs cubes restent ceux du monde (Blocland les dessine, la vue simple ne les voit
// pas) ; la construction d'Archipéo les remplace par leur dessin, comme un modèle importé (le toucher retrouve leurs
// cases). La fumée du foyer reste la sienne. Seulement dans les archipels dont le kit les demande (`Kit.objetsDessines` :
// les quatre archipels d'Archipéo). Code pur, sans Three.js.
import type { VoxelCube } from '../cube';
import { type BiomeId, BIOMES } from '../../biomes';
import { type ArchipelagoId, islandDef } from '../map';
import type { ImportedMonument } from '../monumentModels';
import { turnCell, turnPoint } from '../placement';
import { trophySpot } from '../terrain/guardians';
import { islandOrigin, LAYOUT_PAD, origineDe } from '../terrain/base';
import { DECOR, kindOf, SMOKE } from '../decor';
import { Pinceau, type V3 } from '../decor/brush';
import { KITS } from '../architecture';
import { batimentsDe, coursDe } from '../construction/buildings';
import { TEXTURE_KINDS, type TextureKind } from '../pixels';
import { Workshop } from './workshop';
import { rowboat, quayCrate, pennant, campfire, paintFor, trophy } from './pieces';
import { HEART_DECOR_6E, type HeartDecor, type HeartGroup } from './heartDecor';
import { HEART_DECOR_5E } from './heartDecor5e';
import { HEART_DECOR_4E } from './heartDecor4e';
import { HEART_DECOR_3E } from './heartDecor3e';

/** Le kit de l'archipel dessine-t-il ses objets (`Kit.objetsDessines`) ? Ailleurs, les cubes du kit. */
const drawsObjects = (a: ArchipelagoId): boolean => KITS[a].objetsDessines === true;

/** Le décor du cœur dessiné, île par île, dans chaque archipel qui le dessine. */
const HEART_DECORS: Partial<Record<ArchipelagoId, Readonly<Partial<Record<BiomeId, readonly HeartDecor[]>>>>> = {
  '6e': HEART_DECOR_6E,
  '5e': HEART_DECOR_5E,
  '4e': HEART_DECOR_4E,
  '3e': HEART_DECOR_3E,
};

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
  if (!drawsObjects(a)) return [];
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
  if (!drawsObjects(a)) return [];
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

// ---------- Le décor du cœur ----------

/** Le nombre de cubes que le décor d'une île pose dans chaque colonne de sa grille (sans les arbres, nommés). */
const decorCountsCache = new Map<BiomeId, Map<string, number>>();
function decorCountsFor(id: BiomeId): Map<string, number> {
  let out = decorCountsCache.get(id);
  if (out) return out;
  out = new Map();
  const m = out;
  DECOR[id](
    (x, y, _z, _color, decor) => {
      if (decor) return;
      const k = `${x},${y}`;
      m.set(k, (m.get(k) ?? 0) + 1);
    },
    () => 0,
  );
  decorCountsCache.set(id, out);
  return out;
}

const TEXTURES = new Set<string>(TEXTURE_KINDS);
const isTextureKind = (t: string | undefined): t is TextureKind => t !== undefined && TEXTURES.has(t);

/** Le cube compte-t-il parmi le décor du cœur de son île (ni sol, ni décor du paysage, ni borne, lieu, liaison, petite construction) ? */
const isHeartCube = (c: VoxelCube) => !c.ghost && !c.sol && !c.decor && !c.quest && !c.place && !c.bridge && !c.petiteConstruction;

/**
 * Les ensembles du décor du cœur de ce monde que le kit d'Archipéo dessine (`Kit.objetsDessines`, du 6e au 3e) :
 * chacun comme un modèle importé qui remplace ses cubes (le toucher retrouve ses cases). Aucun sans table ou sans le kit.
 */
export function drawnHeartDecor(a: ArchipelagoId, cubes: readonly VoxelCube[]): ImportedMonument[] {
  const out: ImportedMonument[] = [];
  const table = drawsObjects(a) ? HEART_DECORS[a] : undefined;
  if (!table) return out;
  const islands = BIOMES.filter((b) => b.classe === a && table[b.id]);
  if (!islands.length) return out;
  const ids = new Set<string>(islands.map((b) => b.id));
  const byColumn = new Map<string, VoxelCube[]>();
  const buildings = batimentsDe(a);
  const yards = coursDe(a);
  for (const c of cubes) {
    if (!c.tag || !ids.has(c.tag) || !isHeartCube(c)) continue;
    const k = cellKey(c.x, c.y, c.z);
    if (buildings.has(k) || yards.has(k)) continue;
    const kc = `${c.tag}|${c.x},${c.y}`;
    const l = byColumn.get(kc);
    if (l) l.push(c);
    else byColumn.set(kc, [c]);
  }
  for (const b of islands) {
    const o = origineDe(b.id);
    const q = islandDef(b.id).quarts;
    const counts = decorCountsFor(b.id);
    for (const entry of table[b.id] ?? []) {
      const ax = Math.min(...entry.columns.map(([x]) => x));
      const ay = Math.min(...entry.columns.map(([, y]) => y));
      const members: { x: number; y: number; cubes: VoxelCube[] }[] = [];
      let complete = true;
      for (const [x, y] of entry.columns) {
        const t = turnCell(LAYOUT_PAD.x + x, LAYOUT_PAD.y + y, q);
        const l = byColumn.get(`${b.id}|${o.x + t.x},${o.y + t.y}`) ?? [];
        if (l.length !== (counts.get(`${x},${y}`) ?? 0) || !l.length) complete = false;
        members.push({ x: x - ax, y: y - ay, cubes: l });
      }
      if (!complete) continue;
      const all = members.flatMap((s) => s.cubes);
      const base = Math.min(...all.map((c) => c.z));
      const grounds = new Map(members.map((s) => [`${s.x},${s.y}`, Math.min(...s.cubes.map((c) => c.z)) - base]));
      const group: HeartGroup = {
        cells: members.flatMap((s) => s.cubes.map((c) => ({ x: s.x, y: s.y, z: c.z - base, texture: isTextureKind(c.texture) ? c.texture : null }))),
        ground: (x, y) => grounds.get(`${x},${y}`) ?? 0,
      };
      const toWorld = (x: number, y: number, z: number): V3 => {
        const p = turnPoint(LAYOUT_PAD.x + ax + x, LAYOUT_PAD.y + ay + y, q);
        return [o.x + p.x, base + z, o.y + p.y];
      };
      // Rien ne s'allume au cœur : le feu est dans l'opaque.
      const at = new Workshop(new Pinceau(), null, toWorld);
      entry.drawing(at, paintFor(a, b.id, all.some((c) => c.muted)), group);
      out.push({
        id: `coeur:${b.id}:${entry.name}`,
        stage: 1,
        opaque: at.opaque.fin(),
        fire: new Pinceau().fin(),
        halo: null,
        cellules: all.map((c) => ({ x: c.x, y: c.y, z: c.z })),
        replaced: new Set(all.map((c) => cellKey(c.x, c.y, c.z))),
      });
    }
  }
  return out;
}
