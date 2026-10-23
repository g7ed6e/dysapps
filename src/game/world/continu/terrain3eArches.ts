// Les petites arches des Prairies du 3e (découpées de ./terrain3e.ts, qui les réexporte) : leur chaussée de granit au
// ras des nuages, ses arches basses, son parapet, et le sol qu'on y marche. Code pur.
import { FacetBuilder, mergeFacets, type Facets } from './facets';
import { distance, smoothstep, type Vec2 } from './geometry';
import { COLORS_3E, PATH_NODES_3E, SMALL_ARCHES_3E } from './plan3e';
import { quadOut, triOut } from './place4eKit';
import type { P3 } from './terrain';
import { heightAt3e, landDistance3e } from './terrain3eHeight';

// ---------- Les petites arches des Prairies ----------

/**
 * Les petites arches (fiche, § 5) et les arches basses : une chaussée de granit large comme une route, au ras des nuages,
 * parapet plein et haut des deux côtés ; dessous, une rangée d'arches basses dont les ouvertures sont à demi enfoncées
 * dans le blanc (aucune pile ne se voit plonger). `deck` : le dessus de la chaussée (celui d'un pont) ; `half` : sa
 * demi-largeur ; `ramp` : la longueur de ses rampes sur chaque rive ; `parapet` : la hauteur, l'épaisseur du parapet, et
 * l'épaisseur de son chaperon d'ardoise (lot des Prairies : à hauteur de poitrine de Kéo, sélection des Prairies,
 * « parapets plus hauts que ceux de l'image ») ; `arch` : l'écart des arches, leur rayon (le haut de leur ouverture
 * au-dessus des nuages), la largeur de l'anneau de leurs claveaux, un cran plus clair ; `path` : le chemin de pierre
 * claire au milieu du dessus, sa demi-largeur et son liseré d'ardoise ; `foot` : le bas de ses murs, sous les nuages.
 */
const CAUSEWAY_3E = {
  deck: 1.9,
  half: 2.6,
  ramp: 4,
  parapet: { height: 1.1, thick: 0.45, cap: 0.12 },
  arch: { gap: 4.4, radius: 1.25, ring: 0.3 },
  path: { half: 1.25, edge: 0.14 },
  foot: -1,
} as const;

/** Une chaussée : son bout `a`, son sens, la part au-dessus des nuages (`water`, depuis `a`), la hauteur de ses rives. */
export interface Causeway {
  a: Vec2;
  dir: Vec2;
  length: number;
  water: readonly [number, number];
  base: readonly [number, number];
}

/** La chaussée de la liaison `a`–`c` : ce qu'elle franchit des nuages, et le sol de ses deux rives. */
function causewayOf(a: Vec2, c: Vec2): Causeway {
  const length = distance(a, c);
  const dir = { x: (c.x - a.x) / length, z: (c.z - a.z) / length };
  let w0 = length,
    w1 = 0;
  for (let d = 0; d <= length; d += 0.1) {
    if (landDistance3e({ x: a.x + dir.x * d, z: a.z + dir.z * d }) >= 0) continue;
    w0 = Math.min(w0, d);
    w1 = Math.max(w1, d);
  }
  const at = (d: number) => ({ x: a.x + dir.x * d, z: a.z + dir.z * d });
  const base = [heightAt3e(at(w0 - CAUSEWAY_3E.ramp - 1)), heightAt3e(at(w1 + CAUSEWAY_3E.ramp + 1))] as const;
  return { a, dir, length, water: [w0, w1], base };
}

const SMALL_CAUSEWAYS: readonly Causeway[] = SMALL_ARCHES_3E.map(([u, v]) => {
  const at = (id: string) => PATH_NODES_3E.find((n) => n.id === id)!.at;
  return causewayOf(at(u), at(v));
});

/** Le dessus d'une chaussée à `d` unités de son bout `a` : sa rampe d'une rive, le plein au-dessus des nuages, l'autre rampe. */
function causewayTop(s: Causeway, d: number): number {
  const { deck, ramp } = CAUSEWAY_3E;
  const [w0, w1] = s.water;
  if (d < w0 - 1) return s.base[0] + (deck - s.base[0]) * smoothstep(w0 - 1 - ramp, w0 - 1, d);
  if (d > w1 + 1) return s.base[1] + (deck - s.base[1]) * (1 - smoothstep(w1 + 1, w1 + 1 + ramp, d));
  return deck;
}

/**
 * Le dessus des petites arches sous un point du monde (`x`, `z`), entre leurs parapets, ou rien hors d'elles : Kéo s'y
 * tient (toujours ouvertes). Lue à chaque image : rien n'y est créé.
 */
export function smallArchFloor(x: number, z: number): number | null {
  for (const s of SMALL_CAUSEWAYS) {
    const dx = x - s.a.x,
      dz = z - s.a.z;
    const d = dx * s.dir.x + dz * s.dir.z;
    if (d < s.water[0] - 1 - CAUSEWAY_3E.ramp || d > s.water[1] + 1 + CAUSEWAY_3E.ramp) continue;
    if (Math.abs(-dx * s.dir.z + dz * s.dir.x) > CAUSEWAY_3E.half - CAUSEWAY_3E.parapet.thick) continue;
    return causewayTop(s, d);
  }
  return null;
}

/** Les morceaux d'une chaussée de `d0` à `d1` unités de son bout : ses murs et ses arches (par travée), son dessus, son parapet. */
export interface CausewayParts {
  bays: Facets[];
  deck: Facets;
  parapets: Facets;
}

/**
 * Les coupes du dessus d'une chaussée de `d0` à `d1` : un pas fin (`STATION_STEP`) sur les rampes, un seul pan là où le
 * dessus est droit (le plein au-dessus des nuages), pour que le dessus et les parapets ne coûtent que ce qui se voit.
 */
const STATION_STEP = 1.5;
function stations(d0: number, d1: number, surface: (d: number) => number): number[] {
  const n = Math.max(2, Math.ceil((d1 - d0) / STATION_STEP));
  const fine = Array.from({ length: n + 1 }, (_, k) => d0 + ((d1 - d0) * k) / n);
  const out = [d0];
  let from = 0;
  for (let k = 1; k < n; k++) {
    // Le point `k` se saute si tout ce qu'il y a de `from` à `k + 1` est sur la droite qui les joint.
    const a = fine[from],
      c = fine[k + 1];
    const straight = fine.slice(from + 1, k + 1).every((u) => Math.abs(surface(u) - (surface(a) + ((surface(c) - surface(a)) * (u - a)) / (c - a))) < 0.005);
    if (!straight) {
      out.push(fine[k]);
      from = k;
    }
  }
  out.push(d1);
  return out;
}

/**
 * Une chaussée dessinée de `d0` à `d1` le long de `s` : par travée, ses deux murs pleins jusque sous les nuages, une
 * ouverture d'arche à demi enfoncée sur chacun (une voûte d'ardoise, son haut à `arch.radius` au-dessus des nuages, et
 * l'anneau de ses claveaux) ; son dessus de granit, qui suit les rampes, et le chemin de pierre claire au milieu ; les
 * deux parapets pleins et leur chaperon. Chaque face regarde le dehors (lot des Prairies : les murs et les voûtes de la
 * chaussée du lot 1 regardaient la chaussée, si bien que, vue de côté, on lisait le dedans du mur d'en face et aucune
 * arche). `granite` : la pierre ; `surface` : le dessus à `d` unités de `a` (celui des petites arches, ou celui d'un
 * pont, que lit la marche : ./bridges.ts).
 */
export function causewayParts(s: Causeway, d0: number, d1: number, granite: { side: number; top: number }, surface: (d: number) => number = (d) => causewayTop(s, d)): CausewayParts {
  const { half, parapet, arch, path, foot } = CAUSEWAY_3E;
  const at = (d: number, v: number) => ({ x: s.a.x + s.dir.x * d - s.dir.z * v, z: s.a.z + s.dir.z * d + s.dir.x * v });
  const p3 = (d: number, v: number, y: number): P3 => {
    const q = at(d, v);
    return [q.x, y, q.z];
  };
  // Le dehors de chaque côté (`side`, +1 ou −1, le signe de `v`), le long de la chaussée, et le haut.
  const across = (side: number): P3 => [-s.dir.z * side, 0, s.dir.x * side];
  const along = (sign: number): P3 => [s.dir.x * sign, 0, s.dir.z * sign];
  const UP: P3 = [0, 1, 0];
  const bays: Facets[] = [];
  const n = Math.max(1, Math.round((d1 - d0) / arch.gap));
  const len = (d1 - d0) / n;
  for (let k = 0; k < n; k++) {
    const b = new FacetBuilder();
    const u0 = d0 + k * len,
      u1 = u0 + len;
    const t0 = surface(u0) - 0.02,
      t1 = surface(u1) - 0.02;
    // Les deux murs, tournés vers le dehors ; les deux bouts de la chaussée fermés.
    for (const side of [1, -1]) quadOut(b, p3(u0, side * half, foot), p3(u1, side * half, foot), p3(u1, side * half, t1), p3(u0, side * half, t0), across(side), granite.side);
    if (k === 0) quadOut(b, p3(u0, half, foot), p3(u0, -half, foot), p3(u0, -half, t0), p3(u0, half, t0), along(-1), granite.side);
    if (k === n - 1) quadOut(b, p3(u1, -half, foot), p3(u1, half, foot), p3(u1, half, t1), p3(u1, -half, t1), along(1), granite.side);
    // L'ouverture d'arche, à demi enfoncée dans les nuages, sur chaque mur (seulement là où le mur est haut) : la voûte
    // d'ardoise, et autour d'elle l'anneau de ses claveaux, un cran plus clair que le mur : elle se lit de loin comme une
    // arche, jamais comme une tache.
    const mid = (u0 + u1) / 2;
    if (surface(mid) > arch.radius + arch.ring + 0.2)
      for (const side of [1, -1]) {
        const steps = 5;
        const v = side * (half + 0.03);
        const w = side * (half + 0.05);
        const ring = (r: number, i: number, off: number) => p3(mid + Math.cos((Math.PI * i) / steps) * r * 1.2, off, Math.sin((Math.PI * i) / steps) * r);
        for (let i = 0; i < steps; i++) {
          triOut(b, p3(mid, v, 0), ring(arch.radius, i, v), ring(arch.radius, i + 1, v), across(side), COLORS_3E.slate);
          quadOut(b, ring(arch.radius, i, w), ring(arch.radius, i + 1, w), ring(arch.radius + arch.ring, i + 1, w), ring(arch.radius + arch.ring, i, w), across(side), granite.top);
        }
      }
    bays.push(b.build());
  }
  // Le dessus, par pans qui suivent les rampes : le granit au pied des parapets, et au milieu le chemin de pierre claire
  // bordé de son liseré d'ardoise, comme les chemins de la terre (relecture des lieux, correction 22).
  const deck = new FacetBuilder();
  const cuts = stations(d0, d1, surface);
  const strips: readonly (readonly [number, number, number])[] = [
    [-half, -path.half - path.edge, granite.top],
    [-path.half - path.edge, -path.half, COLORS_3E.slate],
    [-path.half, path.half, COLORS_3E.parvis],
    [path.half, path.half + path.edge, COLORS_3E.slate],
    [path.half + path.edge, half, granite.top],
  ];
  for (let k = 1; k < cuts.length; k++) {
    const u0 = cuts[k - 1],
      u1 = cuts[k];
    const [y0, y1] = [surface(u0), surface(u1)];
    for (const [v0, v1, color] of strips) {
      const lift = color === granite.top ? 0 : 0.015;
      quadOut(deck, p3(u0, v1, y0 + lift), p3(u1, v1, y1 + lift), p3(u1, v0, y1 + lift), p3(u0, v0, y0 + lift), UP, color);
    }
  }
  // Les deux parapets pleins, d'un bout à l'autre, qui suivent le dessus, coiffés de leur chaperon d'ardoise un peu plus
  // large : la face du dehors (le mur continue sous elle), celle du dedans, tournée vers le chemin ; le dessus et les
  // deux flancs du chaperon ; les deux bouts, fermés.
  const rails = new FacetBuilder();
  const top = (u: number) => surface(u) + parapet.height;
  const capTop = (u: number) => top(u) + parapet.cap;
  for (const side of [1, -1]) {
    const vo = side * half,
      vi = side * (half - parapet.thick);
    const co = side * (half + 0.06),
      ci = side * (half - parapet.thick - 0.06);
    const out = across(side),
      inward = across(-side);
    for (let k = 1; k < cuts.length; k++) {
      const u0 = cuts[k - 1],
        u1 = cuts[k];
      quadOut(rails, p3(u0, vo, surface(u0)), p3(u1, vo, surface(u1)), p3(u1, vo, top(u1)), p3(u0, vo, top(u0)), out, granite.side);
      quadOut(rails, p3(u0, vi, surface(u0)), p3(u1, vi, surface(u1)), p3(u1, vi, top(u1)), p3(u0, vi, top(u0)), inward, granite.side);
      quadOut(rails, p3(u0, ci, capTop(u0)), p3(u1, ci, capTop(u1)), p3(u1, co, capTop(u1)), p3(u0, co, capTop(u0)), UP, COLORS_3E.slateTop);
      quadOut(rails, p3(u0, co, top(u0)), p3(u1, co, top(u1)), p3(u1, co, capTop(u1)), p3(u0, co, capTop(u0)), out, COLORS_3E.slate);
      quadOut(rails, p3(u0, ci, top(u0)), p3(u1, ci, top(u1)), p3(u1, ci, capTop(u1)), p3(u0, ci, capTop(u0)), inward, COLORS_3E.slate);
    }
    for (const [u, sign] of [
      [d0, -1],
      [d1, 1],
    ] as const)
      quadOut(rails, p3(u, vi, surface(u)), p3(u, vo, surface(u)), p3(u, vo, capTop(u)), p3(u, vi, capTop(u)), along(sign), granite.side);
  }
  return { bays, deck: deck.build(), parapets: rails.build() };
}

/** Les deux petites arches des Prairies, entières (toujours ouvertes), dans le maillage des chemins. */
export function smallArchFacets(): Facets {
  return mergeFacets(
    SMALL_CAUSEWAYS.flatMap((s) => {
      const parts = causewayParts(s, s.water[0] - 1 - CAUSEWAY_3E.ramp, s.water[1] + 1 + CAUSEWAY_3E.ramp, { side: COLORS_3E.granite, top: COLORS_3E.graniteSun });
      return [...parts.bays, parts.deck, parts.parapets];
    }),
  );
}
