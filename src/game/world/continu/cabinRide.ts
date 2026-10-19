// Le trajet de la cabine de la Montée (GD-22, lot 3 ; intention du directeur artistique du 19 octobre 2026, § 4) : un
// trajet qui passe la cabine (la marche vers un lieu du plateau, ou le bouton « Monter » et « Descendre ») y entre à l'arrêt de
// la caisse, monte ou descend avec elle, en ligne droite le long du rail, puis reprend la marche. La caisse roule à
// vitesse douce, son départ et son arrivée amortis, sans balancement ni secousse (./walk.ts, `RIDE`). Ce fichier coupe
// le trajet en trois et dit où est la caisse ; la vue la pose. Code pur, sans Three.js.
import { CABIN_CAR, bridgeSite, cabinPoint, cabinStops, isCabin, type BridgeSite } from './bridges';
import { distance, type Vec2 } from './geometry';
import { linkedLands, type LinkedLand } from './lands';
import type { LevelPlan } from './levelPlan';

/** La demi-largeur du couloir de la cabine : un trajet qui y passe d'un arrêt à l'autre prend la caisse. */
const CORRIDOR = 2.2;

/** Où Kéo s'arrête en haut, au bout d'un trajet du bouton, après la fin du rail : au-delà de la gare, sur le plateau. */
const ARRIVAL_TOP = 7;

/** La cabine d'un plan, s'il en a une (au 5e, celle des Aiguilles). */
export function cabinOf(plan: LevelPlan): LinkedLand | null {
  return linkedLands(plan).find(isCabin) ?? null;
}

/** La place `d` le long de la ligne de la cabine, et l'écart à son axe, d'un point du sol. */
function along(s: BridgeSite, p: Vec2): { d: number; v: number } {
  const dx = p.x - s.near.x,
    dz = p.z - s.near.z;
  return { d: dx * s.dir.x + dz * s.dir.z, v: -dx * s.dir.z + dz * s.dir.x };
}

/** Le trajet d'une cabine : la route refaite (elle passe par les deux arrêts), et les distances où la caisse part et arrive. */
export interface RideRoute {
  route: Vec2[];
  ride: { from: number; to: number; up: boolean } | null;
}

/**
 * Le trajet `route` refait pour la cabine `land` : s'il passe d'un arrêt à l'autre dans le couloir de la cabine (dans un
 * sens ou dans l'autre), la part entre les deux devient la ligne droite d'un arrêt à l'autre, sur l'axe du rail ; sinon,
 * tel quel, sans trajet de cabine. Les points à moins de `CORRIDOR` de l'axe, entre les deux arrêts, sont ceux de la
 * caisse.
 */
export function routeWithRide(route: readonly Vec2[], land: LinkedLand): RideRoute {
  const s = bridgeSite(land);
  const stops = cabinStops(s);
  // Les franchissements de chaque arrêt, le long du trajet, dans le couloir : l'indice du segment et sa part.
  const crossings: { i: number; t: number; stop: 'bottom' | 'top' }[] = [];
  for (let i = 1; i < route.length; i++) {
    const a = along(s, route[i - 1]);
    const b = along(s, route[i]);
    for (const stop of ['bottom', 'top'] as const) {
      const d = stops[stop];
      if ((a.d - d) * (b.d - d) > 0 || a.d === b.d) continue;
      const t = (d - a.d) / (b.d - a.d);
      const v = a.v + (b.v - a.v) * t;
      if (Math.abs(v) <= CORRIDOR) crossings.push({ i, t, stop });
    }
  }
  crossings.sort((a, c) => a.i - c.i || a.t - c.t);
  // Le premier franchissement d'un arrêt suivi d'un franchissement de l'autre : la caisse.
  const first = crossings[0];
  const second = first ? crossings.find((c) => c.stop !== first.stop && (c.i > first.i || (c.i === first.i && c.t > first.t))) : undefined;
  if (!first || !second) return { route: [...route], ride: null };
  const fromAt = cabinPoint(s, stops[first.stop]);
  const toAt = cabinPoint(s, stops[second.stop]);
  const out: Vec2[] = [...route.slice(0, first.i), fromAt, toAt, ...route.slice(second.i)];
  // La distance le long du trajet jusqu'à l'arrêt de départ (l'indice `first.i`), puis jusqu'à celui d'arrivée.
  let from = 0;
  for (let k = 1; k <= first.i; k++) from += distance(out[k - 1], out[k]);
  const to = from + distance(fromAt, toAt);
  return { route: out, ride: { from, to, up: first.stop === 'bottom' } };
}

/**
 * Le trajet du bouton « Monter » ou « Descendre » : de là où se tient Kéo, à l'arrêt de son côté, l'autre arrêt, puis un pas sur
 * la gare d'arrivée (il ressort de la caisse).
 */
export function cabinButtonRoute(land: LinkedLand, here: Vec2, up: boolean): readonly Vec2[] {
  const s = bridgeSite(land);
  const stops = cabinStops(s);
  const from = cabinPoint(s, up ? stops.bottom : stops.top);
  const to = cabinPoint(s, up ? stops.top : stops.bottom);
  // En haut, Kéo sort de la gare et fait quelques pas sur le plateau, loin du bord : la caméra, tournée vers le nord, garde
  // son pied sur le plateau (camera.ts, `cliffHold`).
  const off = cabinPoint(s, up ? s.abut[1] + ARRIVAL_TOP : s.abut[0] - 2.6);
  return distance(here, from) > 1e-6 ? [here, from, to, off] : [from, to, off];
}

/**
 * Où se tient Kéo par rapport à la cabine (le bouton « Monter » ou « Descendre ») : à la gare du pied ou dans la caisse qui y
 * attend (`bas`), à la gare du haut (`haut`), ou ailleurs (`null`). `reach` : à tant d'unités de l'arrêt, au plus.
 */
export function cabinSide(land: LinkedLand, here: Vec2, reach = 3.2): 'bas' | 'haut' | null {
  const s = bridgeSite(land);
  const stops = cabinStops(s);
  const { d, v } = along(s, here);
  if (Math.abs(v) > reach) return null;
  // La gare du pied : de son bout (4 unités avant le rail) jusqu'à la caisse ; celle du haut, de la caisse au plateau,
  // jusqu'où le trajet du bouton laisse Kéo.
  if (d >= s.abut[0] - 4.2 && d <= stops.bottom + reach * 0.5) return 'bas';
  if (d >= stops.top - reach * 0.5 && d <= s.abut[1] + ARRIVAL_TOP + 1) return 'haut';
  return null;
}

/**
 * Autour de la caisse de la gare du haut, la bande où Kéo compte comme près d'elle : la caméra ordinaire, de l'autre
 * côté, la verrait entre elle et lui (`near`) ; et, plus loin vers le plateau, celle où la caméra retenue au bord la
 * survole en s'approchant de lui (`held`, mesuré : jusqu'à 5,7 unités du milieu de la caisse). L'arrivée du bouton
 * « Monter » (`ARRIVAL_TOP`) reste au-delà : la caisse y garde son toit.
 */
const CAR_ZONE = { near: 2.5, held: 6, side: 3 } as const;

/**
 * La caisse qui attend à la gare du haut s'ouvre-t-elle (sans poteaux ni toit, `bridgeFacets`) ? Seconde relecture du
 * lot 3 (directeur artistique) : jamais de toit ni de poteau de la caisse entre la caméra et Kéo. En haut, la caisse est
 * au bord du plateau : la caméra qui garde son pied sur le plateau (`cliffHold`) s'approche de Kéo et passerait sous
 * son toit, ou le verrait de dessus. Elle s'ouvre donc quand Kéo est dedans ou tout près, ou un peu plus loin sur la
 * gare quand la caméra est retenue au bord (`held`) ; ailleurs, et au pied, elle garde son toit.
 */
export function cabinCarOpen(land: LinkedLand, here: Vec2, held: boolean): boolean {
  const s = bridgeSite(land);
  const { d, v } = along(s, here);
  const dd = d - cabinStops(s).top;
  const w = CABIN_CAR.width / 2;
  if (Math.abs(dd) <= CABIN_CAR.half + CAR_ZONE.near && Math.abs(v) <= w + CAR_ZONE.near) return true;
  return held && dd >= 0 && dd <= CABIN_CAR.half + CAR_ZONE.held && Math.abs(v) <= w + CAR_ZONE.side;
}
