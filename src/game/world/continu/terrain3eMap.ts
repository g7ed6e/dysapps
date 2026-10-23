// Ce que la Carte du 3e ajoute au monde (découpé de ./terrain3e.ts, qui le réexporte) : les hachures du haut du cône et
// des arêtes, la bande de la langue de glace, le liseré d'ardoise des rives. Code pur.
import { FacetBuilder, mergeFacets, type Facets } from './facets';
import { distance, insidePolygon, type Vec2 } from './geometry';
import { ARETE_EST_3E, ARETE_OUEST_3E, COLORS_3E, LANGUE_3E, LANGUE_LOOK_3E, MOUNTAIN_3E, PEAK_3E, PRAIRIES_3E } from './plan3e';
import { heightOnFar, heightOnMesh, type P3 } from './terrain';
import { resampleLoop } from './terrain3eEdges';
import { areteClearance, buildHeightField3e, heightAt3e, landDistance3e } from './terrain3eHeight';

// ---------- Le haut du cône et les coupures sur la Carte ----------

/**
 * Les hachures sur la Carte (fiche, § 5 bis : « le pic et les deux arêtes sont hachurés, du pic aux nuages ») : des
 * bandes en biais, tous les `gap` unités, larges de `width`, posées `lift` au-dessus du sol, par pas de `step` le long
 * d'elles, sur le haut du cône et les deux arêtes. Un gris-bleu clair, espacées (comme au 4e : des rayures serrées et
 * très contrastées gênent certains lecteurs). Sur la Carte seulement, dans le maillage des lieux.
 */
const HATCH_3E = { gap: 8, width: 0.9, lift: 0.6, step: 2, color: 0xa9b3c6 } as const;

/** Ce point est-il hachuré sur la Carte (le haut du cône, une arête, sur la terre) ? */
const hatched = (p: Vec2): boolean => landDistance3e(p) > 0.5 && (distance(p, PEAK_3E.at) < PEAK_3E.blocked || areteClearance(p) < 0);

function peakMapHatch(): Facets {
  const b = new FacetBuilder();
  const { gap, width, lift, step, color } = HATCH_3E;
  const pts = [...ARETE_OUEST_3E, ...ARETE_EST_3E];
  const minX = Math.min(...pts.map((p) => p.x)) - 10,
    maxX = Math.max(...pts.map((p) => p.x)) + 10;
  const minZ = Math.min(...pts.map((p) => p.z), PEAK_3E.at.z - PEAK_3E.blocked) - 10,
    maxZ = Math.max(...pts.map((p) => p.z), PEAK_3E.at.z + PEAK_3E.blocked) + 10;
  const u = { x: Math.SQRT1_2, z: Math.SQRT1_2 };
  const v = { x: Math.SQRT1_2, z: -Math.SQRT1_2 };
  const span = Math.hypot(maxX - minX, maxZ - minZ);
  const mid = { x: (minX + maxX) / 2, z: (minZ + maxZ) / 2 };
  const w = width / 2;
  for (let c = -span / 2; c <= span / 2; c += gap)
    for (let t = -span / 2; t < span / 2; t += step) {
      const at = (s: number) => ({ x: mid.x + v.x * c + u.x * s, z: mid.z + v.z * c + u.z * s });
      const p = at(t),
        q = at(t + step);
      if (!hatched(p) || !hatched(q)) continue;
      // Au-dessus du pic dessiné (sa pyramide) comme du sol.
      const y = Math.max(heightAt3e(p), heightAt3e(q), peakSurface(p), peakSurface(q)) + lift;
      // Vue d'en haut, dans le sens inverse des aiguilles d'une montre : la face regarde le ciel.
      b.quad([p.x - v.x * w, y, p.z - v.z * w], [q.x - v.x * w, y, q.z - v.z * w], [q.x + v.x * w, y, q.z + v.z * w], [p.x + v.x * w, y, p.z + v.z * w], color);
    }
  return b.build();
}

/** La hauteur de la pyramide du pic au-dessus d'un point (sa base au-delà de son pied). */
function peakSurface(p: Vec2): number {
  const { at, radius, height, base, sides, yaw } = PEAK_3E;
  const dx = p.x - at.x,
    dz = p.z - at.z;
  // La distance « en pyramide » : la plus grande projection sur la normale de chaque face, rapportée à l'apothème.
  const apothem = radius * Math.cos(Math.PI / sides);
  let r = 0;
  for (let k = 0; k < sides; k++) {
    const a = yaw + (2 * Math.PI * (k + 0.5)) / sides;
    r = Math.max(r, dx * Math.cos(a) + dz * Math.sin(a));
  }
  return r >= apothem ? 0 : base + height * (1 - r / apothem);
}

/**
 * La langue de glace sur la Carte (fiche, § 5 bis : « une bande pâle bordée d'ardoise, du pic aux nuages ») : sa bande
 * de glace, une bordure d'ardoise de chaque côté, levée au-dessus du sol de près et de loin (`lift`). `step` : son pas.
 */
const LANGUE_MAP_3E = { step: 2.5, edge: 0.7, lift: 1 } as const;

function langueMapBand(): Facets {
  const b = new FacetBuilder();
  const field = buildHeightField3e();
  const line = LANGUE_3E.filter((p, i) => i === LANGUE_3E.length - 1 || distance(p, PEAK_3E.at) > PEAK_3E.blocked * 0.6);
  const pts: Vec2[] = [line[0]];
  for (let i = 1; i < line.length; i++) {
    const a = line[i - 1],
      c = line[i];
    const n = Math.max(1, Math.ceil(distance(a, c) / LANGUE_MAP_3E.step));
    for (let k = 1; k <= n; k++) pts.push({ x: a.x + ((c.x - a.x) * k) / n, z: a.z + ((c.z - a.z) * k) / n });
  }
  const y = (p: Vec2) => Math.max(heightAt3e(p), heightOnMesh(field, p.x, p.z), heightOnFar(field, p.x, p.z), 0) + LANGUE_MAP_3E.lift;
  const normal = (i: number): Vec2 => {
    const a = pts[Math.max(0, i - 1)],
      c = pts[Math.min(pts.length - 1, i + 1)];
    const l = Math.hypot(c.x - a.x, c.z - a.z) || 1;
    return { x: (c.z - a.z) / l, z: -(c.x - a.x) / l };
  };
  const at = (i: number, v: number): P3 => {
    const n = normal(i);
    const q = { x: pts[i].x + n.x * v, z: pts[i].z + n.z * v };
    return [q.x, y(q), q.z];
  };
  const up = (a: P3, c: P3, d: P3, e: P3, color: number) => {
    const ny = (c[2] - a[2]) * (d[0] - a[0]) - (c[0] - a[0]) * (d[2] - a[2]);
    if (ny >= 0) b.quad(a, c, d, e, color);
    else b.quad(e, d, c, a, color);
  };
  const half = LANGUE_LOOK_3E.halfWidth;
  for (let i = 1; i < pts.length; i++) {
    const strip = (v0: number, v1: number, color: number) => up(at(i - 1, v0), at(i, v0), at(i, v1), at(i - 1, v1), color);
    strip(-half, half, COLORS_3E.ice);
    strip(half, half + LANGUE_MAP_3E.edge, COLORS_3E.slate);
    strip(-half - LANGUE_MAP_3E.edge, -half, COLORS_3E.slate);
  }
  return b.build();
}

/**
 * Le liseré d'ardoise des rives sur la Carte (retouche 1 du lot 1, directeur artistique : sur la Carte, le bourrelet du
 * monde, large de 0,9 unité, ne laissait qu'un halo pâle ; fiche, § 5 bis : « chaque terre a son liseré d'ardoise ») : un
 * trait plein d'ardoise, continu, autour de la montagne et de chaque Prairie, à cheval sur la rive (`out` unités sur les
 * nuages, `in` sur la terre), assez large pour se lire au téléphone ; levé au-dessus du sol de près et de loin (`lift`),
 * à plat. `step` : son pas le long de la rive.
 */
const SHORE_MAP_3E = { out: 1.2, in: 2.4, lift: 0.8, step: 3 } as const;

function shoreMapLine(): Facets {
  const b = new FacetBuilder();
  const field = buildHeightField3e();
  const y = (p: Vec2) => Math.max(heightAt3e(p), heightOnMesh(field, p.x, p.z), heightOnFar(field, p.x, p.z), 0) + SHORE_MAP_3E.lift;
  for (const loop of [MOUNTAIN_3E, PRAIRIES_3E.grande, PRAIRIES_3E.deuxieme, PRAIRIES_3E.petite]) {
    const pts = resampleLoop(loop, SHORE_MAP_3E.step);
    const n = pts.length;
    // Le côté de la terre, pour chaque point : la normale qui entre dans la rive.
    const ring = pts.map((p, i) => {
      const a = pts[(i - 1 + n) % n],
        c = pts[(i + 1) % n];
      const l = Math.hypot(c.x - a.x, c.z - a.z) || 1;
      let m = { x: (c.z - a.z) / l, z: -(c.x - a.x) / l };
      if (!insidePolygon({ x: p.x + m.x * 0.5, z: p.z + m.z * 0.5 }, loop)) m = { x: -m.x, z: -m.z };
      const o = { x: p.x - m.x * SHORE_MAP_3E.out, z: p.z - m.z * SHORE_MAP_3E.out };
      const e = { x: p.x + m.x * SHORE_MAP_3E.in, z: p.z + m.z * SHORE_MAP_3E.in };
      const h = Math.max(y(o), y(e));
      return { o: [o.x, h, o.z] as P3, e: [e.x, h, e.z] as P3 };
    });
    for (let i = 0; i < n; i++) {
      const p = ring[i],
        q = ring[(i + 1) % n];
      // Vu d'en haut : la face regarde le ciel, quel que soit le sens de la rive.
      const ny = (q.o[2] - p.o[2]) * (q.e[0] - p.o[0]) - (q.o[0] - p.o[0]) * (q.e[2] - p.o[2]);
      if (ny >= 0) b.quad(p.o, q.o, q.e, p.e, COLORS_3E.slate);
      else b.quad(p.e, q.e, q.o, p.o, COLORS_3E.slate);
    }
  }
  return b.build();
}

/**
 * Ce que la Carte du 3e ajoute au monde : les hachures du haut du cône et des arêtes, la bande de la langue de glace, le
 * liseré d'ardoise des rives.
 */
export const mapOverlay3e = (): Facets => mergeFacets([peakMapHatch(), langueMapBand(), shoreMapLine()]);
