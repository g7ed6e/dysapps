// Ce que le monde montre pendant le choix du mode « Aménager » (GD-9, L5), en cases du monde : le fantôme du choix au
// contour en pointillés, à fleur d'eau ; les places libres autour de lui seulement ; les liaisons retracées en
// pointillés comme elles le seraient après la pose ; celles qui ne tiendraient plus, barrées, avec une croix au-dessus
// (une icône : la couleur n'est jamais seule) ; le lieu choisi, soulevé ; et le point que la vue suit. La 3D le dessine
// en un seul maillage (three/arrange.ts). Code pur, sans Three.js.
import type { BiomeId } from '../biomes';
import { BIOMES } from '../biomes';
import type { World } from '../engine/state';
import { getBridge } from './archipelago';
import {
  freeGuardianSpots,
  freeLandings,
  freeSpots,
  freeStationSpots,
  guardianOf,
  moveIsland,
  moveLanding,
  placeIn,
  relinkBetween,
  routesIn,
} from './arrange';
import { type ArrangeChoice, landingInWorld, placeOfChoice, stationInWorld } from './arrangeMode';
import { footprintOf, guardianIsletRectangle, landRectangle, placedIsland, poseOfSpot } from './footprint';
import { archipelagoOfIsland, type IslandDef, isLandInWorld } from './map';
import type { Rectangle } from './placement';
import type { ArrangeCell, ArrangeView } from './view';
import { groundHeight } from './terrain/base';

/** Combien de pas autour du fantôme les places libres se montrent. */
const PAS_AUTOUR = 3;

/** Un rectangle en pointillés : une case sur deux de son pourtour. */
function contourDuRectangle(r: Rectangle, z: number, out: ArrangeCell[]): void {
  for (let x = r.x0; x < r.x1; x++)
    for (let y = r.y0; y < r.y1; y++) {
      const bord = x === r.x0 || y === r.y0 || x === r.x1 - 1 || y === r.y1 - 1;
      if (bord && (x + y) % 2 === 0) out.push({ x, y, z, genre: 'fantome' });
    }
}

/** La côte d'un lieu posé, en pointillés : une case de terre sur deux dont une voisine est dans l'eau. */
function contourDeLaTerre(def: IslandDef, z: number, out: ArrangeCell[]): void {
  const r = landRectangle(def);
  for (let x = r.x0; x < r.x1; x++)
    for (let y = r.y0; y < r.y1; y++) {
      if ((x + y) % 2 !== 0 || !isLandInWorld(def, x, y)) continue;
      if (!isLandInWorld(def, x + 1, y) || !isLandInWorld(def, x - 1, y) || !isLandInWorld(def, x, y + 1) || !isLandInWorld(def, x, y - 1)) out.push({ x, y, z, genre: 'fantome' });
    }
}

/** Une place libre : quatre plots en losange autour d'une case, bien visibles sur l'eau. */
function place(p: { x: number; y: number }, z: number, out: ArrangeCell[]): void {
  for (const [dx, dy] of [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ])
    out.push({ x: p.x + dx, y: p.y + dy, z, genre: 'place' });
}

/** Une croix de cinq cubes, au-dessus d'une case : l'icône d'une liaison qui ne tiendrait plus. */
function croix(p: { x: number; y: number }, z: number, out: ArrangeCell[]): void {
  for (const [dx, dy] of [
    [0, 0],
    [-1, -1],
    [1, 1],
    [-1, 1],
    [1, -1],
  ])
    out.push({ x: p.x + dx, y: p.y + dy, z, genre: 'croix' });
}

/** Les liaisons d'un lieu retracées dans le monde d'après (en pointillés), et celles qui ne tiendraient plus (barrées). */
function liaisons(avant: World, apres: World | null, relink: readonly string[], lieu: BiomeId, z: number, seules: readonly string[] | null, out: ArrangeCell[]): void {
  const a = archipelagoOfIsland(lieu);
  if (apres)
    for (const [id, t] of routesIn(apres, a)) {
      const b = getBridge(id);
      if (!t || !b || (seules ? !seules.includes(id) : b.from !== lieu && b.to !== lieu)) continue;
      t.cases.forEach((c, i) => i % 2 === 0 && out.push({ x: c.x, y: c.y, z, genre: 'liaison' }));
    }
  const traces = routesIn(avant, a);
  for (const id of relink) {
    const t = traces.get(id);
    if (!t) continue;
    t.cases.forEach((c, i) => i % 2 === 0 && out.push({ x: c.x, y: c.y, z, genre: 'barree' }));
    croix(t.cases[Math.floor(t.cases.length / 2)], z + 2, out);
  }
}

/** Le dessus du sol d'une case du repère d'un lieu (où se tient une borne), en cases du monde. */
function solDeLaBorne(def: IslandDef, p: { x: number; y: number }): number {
  return def.altitude + groundHeight(BIOMES.findIndex((b) => b.id === def.id), p.x, p.y) + 1;
}

/** Le milieu d'une liste de cases, à une hauteur. */
function milieu(cases: readonly { x: number; y: number }[], z: number): { x: number; y: number; z: number } {
  if (!cases.length) return { x: 0, y: 0, z };
  const xs = cases.map((c) => c.x);
  const ys = cases.map((c) => c.y);
  return { x: (Math.min(...xs) + Math.max(...xs)) / 2, y: (Math.min(...ys) + Math.max(...ys)) / 2, z };
}

/** Le dessin du mode pour un choix, dans un monde. */
export function arrangeView(world: World, c: ArrangeChoice): ArrangeView {
  const out: ArrangeCell[] = [];
  const lieu = placeOfChoice(c);
  const ici = placeIn(world, lieu);
  const eau = ici.altitude - 1;
  switch (c.genre) {
    case 'lieu': {
      const a = archipelagoOfIsland(c.id);
      const def = placedIsland(c.id, poseOfSpot(a, c.spot));
      contourDeLaTerre(def, eau, out);
      const g = guardianOf(world, c.id);
      contourDuRectangle(guardianIsletRectangle(def, g), eau, out);
      const debut = out.length;
      for (const s of freeSpots(world, c.id, c.spot.turn)) {
        if (Math.max(Math.abs(s.x - c.spot.x), Math.abs(s.y - c.spot.y)) > PAS_AUTOUR || (s.x === c.spot.x && s.y === c.spot.y)) continue;
        const p = poseOfSpot(a, s);
        place({ x: p.x + 8, y: p.y + 8 }, eau, out);
      }
      const r = moveIsland(world, c.id, c.spot);
      const relink = r.ok ? r.relink : [];
      liaisons(world, r.ok ? r.world : null, relink, c.id, ici.altitude, null, out);
      return { cases: out, souleve: landRectangle(ici), suivre: milieu(out.slice(0, debut), eau), barrees: relink };
    }
    case 'gardien': {
      const r = guardianIsletRectangle(ici, c.place);
      contourDuRectangle(r, eau, out);
      for (const g of freeGuardianSpots(world, c.id)) {
        if (g.side === c.place.side && g.step === c.place.step) continue;
        const q = guardianIsletRectangle(ici, g);
        place({ x: Math.floor((q.x0 + q.x1) / 2), y: Math.floor((q.y0 + q.y1) / 2) }, eau, out);
      }
      const avant = footprintOf(c.id, ici, guardianOf(world, c.id)).find((p) => p.genre === 'ilot')!;
      return { cases: out, souleve: avant, suivre: { x: (r.x0 + r.x1) / 2, y: (r.y0 + r.y1) / 2, z: eau }, barrees: [] };
    }
    case 'borne': {
      const p = stationInWorld(world, c.key, c.place);
      const z = solDeLaBorne(ici, c.place) + 2;
      for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) if ((dx + dy) % 2 === 0 && (dx || dy)) out.push({ x: p.x + dx, y: p.y + dy, z: z - 2, genre: 'fantome' });
      out.push({ x: p.x, y: p.y, z: z + 1, genre: 'fantome' });
      for (const q of freeStationSpots(world, c.key)) {
        if (q.x === c.place.x && q.y === c.place.y) continue;
        const w = stationInWorld(world, c.key, q);
        out.push({ x: w.x, y: w.y, z: solDeLaBorne(ici, q) - 1, genre: 'place' });
      }
      return { cases: out, souleve: null, suivre: { x: p.x, y: p.y, z }, barrees: [] };
    }
    case 'arrivee': {
      const p = landingInWorld(world, lieu, c.landing);
      // Le ponton de deux cubes, de la côte vers le large.
      const vers = { x: Math.sign(p.x - (ici.core.x + 8)), y: Math.sign(p.y - (ici.core.y + 8)) };
      const large = Math.abs(p.x - (ici.core.x + 8)) > Math.abs(p.y - (ici.core.y + 8)) ? { x: vers.x, y: 0 } : { x: 0, y: vers.y };
      out.push({ x: p.x, y: p.y, z: ici.altitude, genre: 'fantome' }, { x: p.x + large.x, y: p.y + large.y, z: ici.altitude, genre: 'fantome' });
      for (const l of freeLandings(world, c.link, c.end)) {
        if (l.side === c.landing.side && l.step === c.landing.step) continue;
        const q = landingInWorld(world, lieu, l);
        out.push({ x: q.x, y: q.y, z: ici.altitude, genre: 'place' });
      }
      const r = moveLanding(world, c.link, c.end, c.landing);
      const relink = r.ok ? r.relink : [];
      liaisons(world, r.ok ? r.world : null, relink, lieu, ici.altitude, [c.link], out);
      return { cases: out, souleve: null, suivre: { x: p.x, y: p.y, z: ici.altitude }, barrees: relink };
    }
    case 'liaison': {
      const r = c.to ? relinkBetween(world, c.link, c.to) : null;
      if (r?.ok && c.to) {
        const t = routesIn(r.world, archipelagoOfIsland(lieu)).get(c.to);
        t?.cases.forEach((q, i) => i % 2 === 0 && out.push({ x: q.x, y: q.y, z: ici.altitude, genre: 'liaison' }));
        return { cases: out, souleve: null, suivre: milieu(t?.cases ?? [], ici.altitude), barrees: [] };
      }
      return { cases: out, souleve: null, suivre: { x: ici.core.x + 8, y: ici.core.y + 8, z: ici.altitude }, barrees: [] };
    }
  }
}
