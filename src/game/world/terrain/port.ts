// Le port de l'île de départ : les barques, fanions, caisses et le foyer du quai, et la place du navire.
import { DARK, PUFFS, SMOKE, TRUNK } from '../decor';
import { type BiomeId, BIOMES, BLOC, BLOCKS } from '../../biomes';
import type { VoxelCube } from '../cube';
import { type ArchipelagoId, archipelagoOfIsland, DANS_LE_CIEL, inCore, isLand, islandDef, landscape, margesDuCoeur } from '../map';
import { DOCK_DX, dockCells, dockOrigin, dockPosts, shoreY, vehicleAfloat, vehicleRestZ } from '../harbour';
import { planCells, zoneDesPlans } from '../plans';
import { commandeDeLIle } from '../requests';
import { casesDeLaPetiteConstruction } from '../fixtures';
import { BRIDGES, getArchipelago } from '../archipelago';
import type { World } from '../../engine';
import { villageStage } from '../villageStage';
import { kitReady, launchedStages, stageBuildingAt } from '../vehicle';
import { cacheUneBorne, questStations, rangeeDevantLesBornes } from './markers';
import { AVATAR_HOME, fade, groundHeight, isSchoolIsland } from './base';
import { versLaCamera } from './view';
import { casesDuVillage, PLACE_IDS, VILLAGE_PLACES } from './village';
import { placeDeLaPetiteConstruction } from './fixture';
import { creatureDuMonde, creatureSpot } from './creatures';
import { boardingRoute, bridgePath } from './links';
import { bossIsletCells, bossIsletSteps } from './guardians';

/** Les cubes d'un objet haut du quai au-dessus de son sol (le mât et la toile d'un fanion, la fumée d'un foyer). */
const HAUTEURS_D_UN_OBJET_HAUT = [0, 1, 2, 3] as const;

/** La fumée d'un foyer du quai : les cinq premières volutes, et les cases qu'elles surplombent. */
const HEARTH_PUFFS = PUFFS.slice(0, 5);

const SMOKE_DRIFT: [number, number][] = HEARTH_PUFFS.map(([dx, dy]) => [dx, dy]);

/** La longueur d'une barque (sa largeur est de 2). */
const BOAT_LENGTH = 4;

/** Une barque en cubes : un fond de 4 × 2 (la coque), la proue et la poupe relevées d'un bloc, le long de x ou de y. */
function boatCells(along: 'x' | 'y', overturned = false): { dx: number; dy: number; dz: number; end: boolean }[] {
  const out: { dx: number; dy: number; dz: number; end: boolean }[] = [];
  for (let i = 0; i < BOAT_LENGTH; i++)
    for (let j = 0; j < 2; j++) {
      const [dx, dy] = along === 'x' ? [i, j] : [j, i];
      const end = i === 0 || i === BOAT_LENGTH - 1;
      // Retournée (échouée), la coque est en haut et la proue et la poupe posent sur le sable.
      out.push({ dx, dy, dz: overturned ? 1 : 0, end: false });
      if (end) out.push({ dx, dy, dz: overturned ? 0 : 1, end: true });
    }
  return out;
}

/** Les objets du quai posés sur la terre de l'île-port : leur coin et leurs cases au sol. */
interface QuaySpot {
  x: number;
  y: number;
  /** Le niveau où poser l'objet (le dessus du sol + 1). */
  z: number;
  cells: [number, number][];
}

/**
 * Les places des objets du quai sur la terre de l'île-port (la barque tirée sur la grève, les fanions, les caisses, le
 * foyer), au plus près du pied de la jetée. Une place est de la terre plate et nue (le sol de l'île, rien dessus), jamais sur le
 * chemin du bonhomme vers le navire, ni sur la zone des plans, une borne, un lieu, la créature ou sa place à lui ;
 * les objets ne se touchent pas. Les places ne dépendent pas de l'état du village : un objet ne change pas de place.
 */
function quaySpots(port: BiomeId, cubes: VoxelCube[]): { boat: QuaySpot | null; flags: (QuaySpot | null)[]; crates: QuaySpot | null; hearth: QuaySpot | null } {
  const def = islandDef(port);
  const X = def.core.x + DOCK_DX;
  const S = shoreY(port);
  const top = new Map<string, VoxelCube>();
  for (const c of cubes) {
    // Une petite construction posée (GD-7, PR 3) ne compte pas : sa place est réservée plus bas, posée ou non, et les
    // objets du quai ne bougent pas quand elle se pose (le test le vérifie).
    if (c.petiteConstruction) continue;
    const k = `${c.x},${c.y}`;
    const t = top.get(k);
    if (!t || c.z > t.z) top.set(k, c);
  }
  const banned = new Set<string>();
  const ban = (x: number, y: number) => banned.add(`${x},${y}`);
  const core = (x: number, y: number) => ban(def.core.x + x, def.core.y + y);
  // Devant les bornes (voir `cacheUneBorne`) : ni mât de fanion ni fumée de foyer, qui cacheraient leur pied.
  const index = BIOMES.findIndex((b) => b.id === port);
  const bornes = questStations(port).map((st) => ({ x: def.core.x + st.x, y: def.core.y + st.y, base: def.altitude + groundHeight(index, st.x, st.y) }));
  const vers = versLaCamera(port);
  const zone = zoneDesPlans(port);
  for (let x = zone.x; x < zone.x + zone.w; x++) for (let y = zone.y; y < zone.y + zone.h; y++) core(x, y);
  for (const st of questStations(port)) for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) core(st.x + dx, st.y + dy);
  for (const [x, y] of casesDuVillage(port)) core(x, y);
  // Devant la porte d'un lieu du village et une case autour : rien (les caisses du quai s'empilaient devant la porte de
  // l'école du Marché, à côté de la dernière borne ; relecture du consultant de Blocland, 02/10/2026).
  if (isSchoolIsland(port))
    for (const place of PLACE_IDS) {
      const { at, door } = VILLAGE_PLACES[place];
      for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) core(at.x + door + dx, at.y - 1 + dy);
    }
  for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) core(AVATAR_HOME.x + dx, AVATAR_HOME.y + dy);
  // La petite construction de la commande de l'île (GD-7, PR 3), à sa place écrite, qu'elle soit posée ou non : les
  // objets du quai ne bougent jamais quand elle se pose. Sans case de marge : avec elle, la barque de la grève de la
  // Plaine, dont la boutique de Coco prend la place, n'en trouvait plus.
  const commande = commandeDeLIle(port);
  const place = commande ? placeDeLaPetiteConstruction(port, commande.fixture) : null;
  if (commande && place)
    for (const c of casesDeLaPetiteConstruction(commande.fixture) ?? [])
      core(place.x + c.x, place.y + c.y);
  // Les marges d'un cœur agrandi (le Marché, 01/10/2026) : le passage devant les bornes, où l'on marche et construit ; les
  // objets du quai restent sur la grève, devant elles, comme avant.
  for (const m of margesDuCoeur(def)) ban(m.x, m.y);
  // La rangée de côte devant les bornes d'une île-école reste nue (`rangeeDevantLesBornes`, DA, 01/10/2026).
  for (const k of rangeeDevantLesBornes(port)) banned.add(k);
  const spot = creatureSpot(port);
  for (const [sx, sy] of [[0, 0], ...spot.steps]) for (const c of creatureDuMonde(port)) core(spot.x + sx + c.x, spot.y + sy + c.y);
  // Le chemin du bonhomme vers le navire (en ligne droite, d'un point au suivant), jusqu'à la jetée.
  const route = boardingRoute(port);
  for (let i = 1; i < route.length; i++) {
    const [p, q] = [route[i - 1], route[i]];
    const n = Math.max(Math.abs(q.x - p.x), Math.abs(q.y - p.y), 1);
    for (let t = 0; t <= n; t++) ban(Math.round(p.x + ((q.x - p.x) * t) / n), Math.round(p.y + ((q.y - p.y) * t) / n));
  }
  // La cale, sur la côte devant la barque amarrée (à l'ouest de la jetée) : rien ne s'y pose, la barque reste lisible.
  for (let x = X - 4; x < X; x++) for (let y = S; y <= S + 1; y++) ban(x, y);
  // Les ouvrages qui partent de l'île-port, et une case autour.
  for (const b of BRIDGES.filter((d) => d.from === port || d.to === port))
    for (const c of bridgePath(b)) for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) ban(c.x + dx, c.y + dy);
  // Le niveau du sol de chaque case : le cœur (et son plateau), ou la terre autour.
  const land = new Map(landscape(def).map((c) => [`${c.x},${c.y}`, c]));
  const ground = (x: number, y: number): number | null => {
    if (inCore(def, x, y)) return def.altitude + groundHeight(index, x - def.core.x, y - def.core.y);
    const c = land.get(`${x},${y}`);
    return c && c.h >= 0 && !c.decor && c.ground !== 'eau' && c.ground !== 'lave' ? def.altitude + c.h : null;
  };
  /** Le dessus du sol nu d'une case libre, `null` si quelque chose y est posé ou si ce n'est pas de la terre. */
  const free = (x: number, y: number): number | null => {
    if (banned.has(`${x},${y}`) || y < S) return null;
    const t = top.get(`${x},${y}`);
    const z = ground(x, y);
    if (z === null || !t || t.z !== z || t.ghost || t.decor || t.quest || t.place || t.bridge || t.texture === 'eau' || t.texture === 'lave') return null;
    return z;
  };
  /** `air` : les cases que l'objet surplombe (la fumée), jamais au-dessus du chemin du bonhomme. */
  const find = (wantX: number, wantY: number, cells: [number, number][], air: [number, number][] = [], haut = false): QuaySpot | null => {
    let best: QuaySpot | null = null;
    let bestD = Infinity;
    // Un objet haut (le mât et la toile d'un fanion, la fumée d'un foyer : trois cubes au plus) ne cache pas une borne.
    const hauts = haut ? [...cells, ...air] : [];
    for (let x = X - 12; x <= X + 10; x++)
      for (let y = S; y <= def.core.y + 8; y++) {
        const zs = cells.map(([dx, dy]) => free(x + dx, y + dy));
        if (zs.some((z) => z === null || z !== zs[0])) continue;
        if (hauts.some(([dx, dy]) => HAUTEURS_D_UN_OBJET_HAUT.some((dz) => cacheUneBorne(bornes, vers, x + dx, y + dy, zs[0]! + dz)))) continue;
        // Au-dessus des cases surplombées, rien de plus haut qu'un bloc (pas d'arbre dans la fumée).
        if (air.some(([dx, dy]) => banned.has(`${x + dx},${y + dy}`) || y + dy < S || (top.get(`${x + dx},${y + dy}`)?.z ?? -Infinity) > zs[0]! + 1)) continue;
        // Au plus près de la côte d'abord, puis du pied de la jetée.
        const d = Math.abs(x - wantX) + 3 * Math.abs(y - wantY);
        if (d < bestD) {
          bestD = d;
          best = { x, y, z: zs[0]! + 1, cells };
        }
      }
    // Une case de marge : les objets ne se touchent pas.
    if (best) for (const [dx, dy] of cells) for (let ex = -1; ex <= 1; ex++) for (let ey = -1; ey <= 1; ey++) ban(best.x + dx + ex, best.y + dy + ey);
    return best;
  };
  const rect = (w: number, d: number): [number, number][] => Array.from({ length: w * d }, (_, i) => [i % w, Math.floor(i / w)]);
  const sea = archipelagoOfIsland(port) !== '3e';
  const boat = sea ? find(X - 5, S, rect(BOAT_LENGTH, 2)) : null;
  const crates = find(X - 2, S, rect(2, 1));
  // Un fanion de chaque côté du pied de la jetée, sa toile (une case à côté du mât) au-dessus du sol nu.
  const flags = [find(X - 2, S, [[0, 0], [-1, 0]], [], true), find(X + 2, S, [[0, 0], [1, 0]], [], true)];
  const hearth = find(X + 3, S + 1, [[0, 0]], SMOKE_DRIFT, true);
  return { boat, flags, crates, hearth };
}

/**
 * Le port de l'archipel : la jetée de planches qui descend de la côte vers le large, ses poteaux et ses lanternes, et ce
 * que montre l'état du village (`villageStage`), chaque état gardant ce qu'apportent les précédents : 1, lanternes
 * éteintes et une barque grise retournée sur la grève ; 2, lanternes allumées, la barque redressée ; 3, la barque amarrée
 * contre la jetée, un foyer qui fume ; 4, une seconde barque sur la grève, des caisses, deux fanions ; 5, une lanterne
 * sur chaque poteau et un feu de port au bout de la jetée. Rien sur la jetée ni à la place du navire ; pas de barque
 * dans les Îles du Ciel. Le Bloc-Navire amarré à côté n'est pas dans le terrain : il tangue, c'est un objet à part
 * (`vehiclePlacement`).
 */
export function harbour(a: ArchipelagoId, village: Pick<World, 'parts' | 'links'>, cubes: VoxelCube[]): void {
  const port = getArchipelago(a).port;
  const rank = villageStage(village, a).rank;
  const def = islandDef(port);
  const rest = vehicleRestZ(a);
  const X = def.core.x + DOCK_DX;
  const S = shoreY(port);
  const spots = quaySpots(port, cubes);
  const lantern = (x: number, y: number, z: number) =>
    cubes.push({ x, y, z, color: BLOCKS[BLOC.lanterne].side, top: BLOCKS[BLOC.lanterne].top, texture: 'lanterne', tag: port });
  const cells = dockCells(port);
  for (const c of cells)
    cubes.push({ x: c.x, y: c.y, z: c.z, color: BLOCKS[BLOC.bois].side, top: c.step ? BLOCKS[BLOC.escalier].top : undefined, texture: c.step ? 'escalier' : 'planches', tag: port });
  for (const p of dockPosts(port)) {
    // Là où la jetée court à plat au-dessus de l'eau (aux Anciens Ateliers, où le navire plane), le poteau descend jusqu'à l'eau.
    const pied = !DANS_LE_CIEL[a] && p.z === rest ? 0 : p.z;
    for (let z = pied; z <= p.z; z++) cubes.push({ x: p.x, y: p.y, z, color: TRUNK, texture: 'tronc', tag: port });
    // Éteintes, les lanternes du bout de la jetée ne sont qu'un bouchon de bois (pas de lueur la nuit).
    if (rank >= 5 || (p.lantern && rank >= 2)) lantern(p.x, p.y, p.z + 1);
    else if (p.lantern) cubes.push({ x: p.x, y: p.y, z: p.z + 1, color: BLOCKS[BLOC.bois].side, top: BLOCKS[BLOC.bois].top, texture: 'planches', tag: port });
  }
  // Le feu de port, au large du bout de la jetée (à l'ouest de la proue du navire) : un pilier de pierre et sa lanterne,
  // posé sur l'eau (sur le quai dans le ciel), la lanterne au-dessus du quai.
  if (rank >= 5) {
    const end = cells[cells.length - 1];
    for (let z = DANS_LE_CIEL[a] ? rest : 0; z < rest + 3; z++) cubes.push({ x: end.x, y: end.y - 1, z, color: BLOCKS[BLOC.pierre].side, top: BLOCKS[BLOC.pierre].top, texture: 'pierre', tag: port });
    lantern(end.x, end.y - 1, rest + 3);
  }
  const prop = (kind: string, at: QuaySpot) => `${port}/${kind}@${at.x},${at.y}`;
  const boatAt = (x: number, y: number, z: number, along: 'x' | 'y', decor: string, overturned = false, faded = false) => {
    for (const c of boatCells(along, overturned)) {
      // La coque goudronnée, d'une couleur unie sombre (elle ne se confond pas avec les planches de la jetée, et n'ajoute
      // pas de matériau : la mine a déjà ce brun), la proue et la poupe en bois clair.
      const b = c.end ? BLOCKS[BLOC.bois] : { side: DARK, top: DARK, texture: undefined };
      cubes.push({ x: x + c.dx, y: y + c.dy, z: z + c.dz, color: faded ? fade(b.side) : b.side, top: faded ? fade(b.top) : b.top, texture: b.texture, tag: port, decor, muted: faded || undefined });
    }
  };
  // La barque de la grève : grise et retournée (1), redressée (2) ; elle part à l'eau (3) ; une seconde la remplace (4).
  if (spots.boat && rank !== 3) boatAt(spots.boat.x, spots.boat.y, spots.boat.z, 'x', prop('barque', spots.boat), rank === 1, rank === 1);
  // Amarrée à l'ouest de la jetée, entre les poteaux et l'îlot du Gardien (une case d'eau autour), au plus près de la côte.
  if (a !== '3e' && rank >= 3) {
    const bx = X - 3;
    const islet = new Set([...bossIsletCells(port), ...bossIsletSteps(port)].flatMap((c) => [-1, 0, 1].flatMap((ex) => [-1, 0, 1].map((ey) => `${c.x + ex},${c.y + ey}`))));
    const clear = (by: number) => [0, 1].every((dx) => Array.from({ length: BOAT_LENGTH }, (_, dy) => [bx + dx, by + dy]).every(([x, y]) => !isLand(def, x, y) && !islet.has(`${x},${y}`)));
    for (let by = S - BOAT_LENGTH; by > cells[cells.length - 1].y; by--)
      if (clear(by)) {
        boatAt(bx, by, 0, 'y', `${port}/barque@${bx},${by}`);
        break;
      }
  }
  if (rank >= 3 && spots.hearth) {
    // Le foyer : une pierre, et sa fumée qui monte au vent.
    const { x, y, z: base } = spots.hearth;
    const decor = prop('foyer', spots.hearth);
    cubes.push({ x, y, z: base, color: BLOCKS[BLOC.pierre].side, top: DARK, texture: 'pierre', tag: port, decor });
    for (const [dx, dy, dz] of HEARTH_PUFFS) cubes.push({ x: x + dx, y: y + dy, z: base + dz - 1, color: SMOKE, tag: port, decor });
  }
  if (rank >= 4) {
    if (spots.crates) {
      const { x, y, z: base } = spots.crates;
      const decor = prop('caisse', spots.crates);
      for (const [dx, dz] of [
        [0, 0],
        [1, 0],
        [0, 1],
      ])
        cubes.push({ x: x + dx, y, z: base + dz, color: BLOCKS[BLOC.bois].side, top: BLOCKS[BLOC.bois].top, texture: 'planches', tag: port, decor });
    }
    spots.flags.forEach((f) => {
      if (!f) return;
      const decor = prop('fanion', f);
      const base = f.z;
      for (let z = 0; z < 3; z++) cubes.push({ x: f.x, y: f.y, z: base + z, color: TRUNK, texture: 'tronc', tag: port, decor });
      // La toile flotte du côté opposé à la jetée.
      cubes.push({ x: f.x + f.cells[1][0], y: f.y, z: base + 2, color: BLOCKS[BLOC.toile].side, top: BLOCKS[BLOC.toile].top, texture: 'toile', tag: port, decor });
    });
  }
}

export interface VehiclePlacement {
  /** L'île-port où le navire est amarré. */
  port: BiomeId;
  /** Le coin local (0, 0, 0) du navire dans le monde. */
  origin: { x: number; y: number; z: number };
  /** Les cubes du navire, en coordonnées locales ; en fantôme, les cases encore à poser (ou le kit qui n'est pas arrivé). */
  cubes: VoxelCube[];
  /** Le navire flotte sur l'eau (il tangue) ou plane : au-dessus de l'eau aux Anciens Ateliers, à quai dans les Îles du Ciel. */
  afloat: boolean;
  /** L'étape en chantier sur ce port, s'il y en a une. */
  building: string | null;
}

/**
 * Le Bloc-Navire au quai du port de l'archipel. Les étapes déjà parties sont dessinées entières (le navire les porte
 * partout où il accoste) ; celle qui se construit ici montre ses cases posées en dur et les autres en fantôme ; son kit
 * (voile, ballon, feux) arrive avec les Gardiens.
 */
export function vehiclePlacement(a: ArchipelagoId, progress: Record<string, { stars: number }>, village: World): VehiclePlacement {
  const port = getArchipelago(a).port;
  const origin = dockOrigin(port);
  const cubes: VoxelCube[] = [];
  const put = (c: { x: number; y: number; z: number; block: keyof typeof BLOCKS }, ghost: boolean) => {
    const bd = BLOCKS[c.block];
    cubes.push({ x: c.x, y: c.y, z: c.z, color: bd.side, top: bd.top, texture: bd.texture, tag: port, ghost: ghost || undefined });
  };
  const bridges = village.links;
  for (const stage of launchedStages(bridges)) for (const c of [...stage.cells, ...stage.kit]) put(c, false);
  // Le chantier de ce port : l'étape qui s'y construit, si l'étape d'avant est partie.
  const building = stageBuildingAt(port, bridges);
  if (building) {
    const done = new Set(village.parts[building.id] ?? []);
    const placed = planCells(building);
    building.cells.forEach((c, i) => put(c, !done.has(placed[i].key)));
    const kit = kitReady(building, progress);
    for (const c of building.kit) put(c, !kit);
  }
  return { port, origin, cubes, afloat: vehicleAfloat(a), building: building?.id ?? null };
}
