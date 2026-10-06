// Ce que le monde montre pendant le choix du mode « Aménager » (GD-9, L5), en cases du monde : le fantôme du choix au
// contour en pointillés, à fleur d'eau ; les places libres autour de lui seulement ; les liaisons retracées en
// pointillés comme elles le seraient après la pose ; celles qui ne tiendraient plus, barrées, avec une croix au-dessus
// (une icône : la couleur n'est jamais seule) ; les places qui colleraient le lieu à un voisin, où la page pose l'icône
// de « Réunir » (6 octobre 2026, choix 2a du mainteneur) ; le lieu choisi, soulevé ; et le point que la vue suit. La 3D le dessine
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
  groupAt,
  guardianOf,
  joinsAround,
  joinsIn,
  moveIsland,
  moveLanding,
  placeIn,
  relinkBetween,
  routesIn,
} from './arrange';
import { type ArrangeChoice, landingInWorld, placeOfChoice, stationInWorld } from './arrangeMode';
import { coutDesPoignees, poigneesDuChoix, type StyleDesPoignees } from './arrangeHandles';
import { footprintOf, guardianIsletRectangle, landRectangle, poseOfSpot } from './footprint';
import { joinShape } from './join';
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

/** Une place libre : un seul carré plat de `l` cases de côté, centré sur une case, à fleur d'eau (deux triangles). */
function place(p: { x: number; y: number }, z: number, l: number, out: ArrangeCell[]): void {
  out.push({ x: p.x, y: p.y, z, genre: 'place', l });
}

/**
 * Ce que coûte le dessin d'un choix (three/arrange.ts) : chaque case est un carré plat de deux triangles, toutes dans
 * un seul maillage instancié (un appel de dessin, seulement pendant un choix) ; et les poignées, dans un autre maillage
 * (un appel, `coutDesPoignees`, comptées dans le style le plus coûteux, en cubes). Vérifié avec le pire cas de chaque
 * région sous le plafond du monde en blocs (budget.test.ts).
 */
export function arrangeViewCost(v: ArrangeView | null, style: StyleDesPoignees = 'blocs'): { triangles: number; drawCalls: number } {
  const n = v?.cases.length ?? 0;
  const p = coutDesPoignees(v?.poignees, style);
  return { triangles: 2 * n + p.triangles, drawCalls: (n ? 1 : 0) + p.drawCalls };
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
function liaisons(avant: World, apres: World | null, relink: readonly string[], lieux: readonly BiomeId[], z: number, seules: readonly string[] | null, out: ArrangeCell[]): void {
  const a = archipelagoOfIsland(lieux[0]);
  if (apres)
    for (const [id, t] of routesIn(apres, a)) {
      const b = getBridge(id);
      if (!t || !b || (seules ? !seules.includes(id) : !lieux.includes(b.from) && !lieux.includes(b.to))) continue;
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

/** Le rectangle qui couvre des rectangles. */
function union(rs: readonly Rectangle[]): Rectangle {
  return { x0: Math.min(...rs.map((r) => r.x0)), y0: Math.min(...rs.map((r) => r.y0)), x1: Math.max(...rs.map((r) => r.x1)), y1: Math.max(...rs.map((r) => r.y1)) };
}

/** Le milieu d'une liste de cases, à une hauteur. */
function milieu(cases: readonly { x: number; y: number }[], z: number): { x: number; y: number; z: number } {
  if (!cases.length) return { x: 0, y: 0, z };
  const xs = cases.map((c) => c.x);
  const ys = cases.map((c) => c.y);
  return { x: (Math.min(...xs) + Math.max(...xs)) / 2, y: (Math.min(...ys) + Math.max(...ys)) / 2, z };
}

/** Sans emprise (une borne, une liaison), la demi-taille du choix autour du point que la vue suit, en cases. */
const DEMI_CHOIX = 1.5;

/**
 * Le dessin du mode pour un choix, dans un monde, avec ses poignées (./arrangeHandles.ts) posées sur l'eau autour de
 * l'emprise du fantôme (ou, sans fantôme, du point suivi).
 */
export function arrangeView(world: World, c: ArrangeChoice): ArrangeView {
  const v = dessinDuChoix(world, c);
  const fantome = v.cases.filter((k) => k.genre === 'fantome');
  const r = v.cadre?.rect ?? (fantome.length ? union(fantome.map((q) => ({ x0: q.x, y0: q.y, x1: q.x + 1, y1: q.y + 1 }))) : { x0: v.suivre.x - DEMI_CHOIX, y0: v.suivre.y - DEMI_CHOIX, x1: v.suivre.x + DEMI_CHOIX, y1: v.suivre.y + DEMI_CHOIX });
  return { ...v, poignees: poigneesDuChoix(world, c, r, placeIn(world, placeOfChoice(c)).altitude) };
}

function dessinDuChoix(world: World, c: ArrangeChoice): ArrangeView {
  const out: ArrangeCell[] = [];
  const lieu = placeOfChoice(c);
  const ici = placeIn(world, lieu);
  const eau = ici.altitude - 1;
  switch (c.genre) {
    case 'lieu': {
      const a = archipelagoOfIsland(c.id);
      // Deux lieux réunis bougent ensemble (GD-9, point 10) : les deux fantômes, et leur réunion entre eux.
      const groupe = groupAt(world, c.id, c.spot);
      for (const g of groupe) {
        contourDeLaTerre(g.def, eau, out);
        contourDuRectangle(guardianIsletRectangle(g.def, guardianOf(world, g.id)), eau, out);
      }
      const forme = groupe.length === 2 ? joinShape(groupe[0].def, groupe[1].def) : null;
      if (forme) contourDuRectangle(forme.zone, eau, out);
      const debut = out.length;
      // Pour chaque voisin auquel il se collerait, la place la plus proche du fantôme : une seule icône par voisin (des
      // places voisines, d'un pas l'une de l'autre, empileraient leurs icônes à l'écran).
      const parVoisin = new Map<BiomeId, { d: number; x: number; y: number }>();
      const reunionsA = joinsAround(world, c.id);
      for (const s of freeSpots(world, c.id, c.spot.turn, { ...c.spot, pas: PAS_AUTOUR })) {
        if (Math.max(Math.abs(s.x - c.spot.x), Math.abs(s.y - c.spot.y)) > PAS_AUTOUR || (s.x === c.spot.x && s.y === c.spot.y)) continue;
        const p = poseOfSpot(a, s);
        place({ x: p.x + 8, y: p.y + 8 }, eau, 3, out);
        // Posé là, le lieu se collerait à un voisin : l'icône de « Réunir » sur la jointure, sur l'eau entre les deux terres,
        // là où irait leur construction (jamais sur la terre du lieu) ; « Réunir » s'allumera dans la barre.
        const d = Math.abs(s.x - c.spot.x) + Math.abs(s.y - c.spot.y);
        for (const j of reunionsA(s)) {
          const q = parVoisin.get(j.id);
          if (!q || d < q.d) parVoisin.set(j.id, { d, x: (j.zone.x0 + j.zone.x1) / 2, y: (j.zone.y0 + j.zone.y1) / 2 });
        }
      }
      const reunions = [...new Map([...parVoisin.values()].map((q) => [`${q.x},${q.y}`, { x: q.x, y: q.y, z: eau + 1 }])).values()];
      const r = moveIsland(world, c.id, c.spot);
      const relink = r.ok ? r.relink : [];
      const lieux = groupe.map((g) => g.id);
      liaisons(world, r.ok ? r.world : null, relink, lieux, ici.altitude, null, out);
      // Soulevés : les deux lieux réunis, et leur réunion.
      const ici2 = lieux.map((id) => landRectangle(placeIn(world, id)));
      const zone = joinsIn(world, a).find((j) => j.pair.includes(c.id))?.shape.zone;
      // La vue garde entier le fantôme : les deux lieux réunis et leur réunion, pas seulement son milieu.
      const fantome = out.slice(0, debut);
      const cadre = fantome.length ? { rect: union(fantome.map((q) => ({ x0: q.x, y0: q.y, x1: q.x + 1, y1: q.y + 1 }))), z: eau, seq: 0 } : undefined;
      return { cases: out, souleve: union(zone ? [...ici2, zone] : ici2), suivre: milieu(fantome, eau), barrees: relink, ...(cadre ? { cadre } : {}), ...(reunions.length ? { reunions } : {}) };
    }
    case 'gardien': {
      const r = guardianIsletRectangle(ici, c.place);
      contourDuRectangle(r, eau, out);
      for (const g of freeGuardianSpots(world, c.id)) {
        if (g.side === c.place.side && g.step === c.place.step) continue;
        const q = guardianIsletRectangle(ici, g);
        place({ x: Math.floor((q.x0 + q.x1) / 2), y: Math.floor((q.y0 + q.y1) / 2) }, eau, 2, out);
      }
      const avant = footprintOf(c.id, ici, guardianOf(world, c.id)).find((p) => p.genre === 'ilot')!;
      return { cases: out, souleve: avant, suivre: { x: (r.x0 + r.x1) / 2, y: (r.y0 + r.y1) / 2, z: eau }, barrees: [] };
    }
    case 'borne': {
      const p = stationInWorld(world, c.key, c.place);
      const z = solDeLaBorne(ici, c.place) + 2;
      for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) if ((dx + dy) % 2 === 0 && (dx || dy)) out.push({ x: p.x + dx, y: p.y + dy, z: z - 3, genre: 'fantome' });
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
      liaisons(world, r.ok ? r.world : null, relink, [lieu], ici.altitude, [c.link], out);
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
