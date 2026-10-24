// Le pic et les liserés d'ardoise des rives du 3e (découpés de ./terrain3e.ts, qui les réexporte) : la pyramide de neige
// à facettes, dessinée avec les lieux, et le bourrelet d'ardoise de la montagne et de chaque Prairie. Code pur.
import { FacetBuilder, type Facets } from './facets';
import { distance, insidePolygon, type Vec2 } from './geometry';
import { COLORS_3E, MOUNTAIN_3E, PEAK_3E, PRAIRIES_3E } from './plan3e';
import { SHADOW_DIR_3E } from './sky';
import type { P3 } from './terrain';
import { heightAt3e } from './terrain3eHeight';

// ---------- Le pic ----------

/**
 * Le pic (fiche, § 1 : « une pyramide de neige ») : une pyramide à facettes, dessinée avec les lieux pour se voir de toute
 * la montagne (le sol des tuiles s'arrête au brouillard). Chaque face, coupée en deux pans le long de sa ligne de plus
 * grande pente, à son ton de neige selon le soleil ; son pied, en granit, où le cône l'enveloppe. Le sol des tuiles, plus
 * bas sous elle, y reste caché. Aucun reflet, aucune pointe de glace.
 */
export function peakFacets(): Facets {
  const b = new FacetBuilder();
  const { at, radius, height, base, sides, yaw } = PEAK_3E;
  const corner = (k: number, r: number, y: number): P3 => {
    const a = yaw + (2 * Math.PI * k) / sides;
    return [at.x + r * Math.cos(a), y, at.z + r * Math.sin(a)];
  };
  const top: P3 = [at.x, base + height, at.z];
  // Le pied en granit jusqu'au quart de la hauteur, la neige au-dessus.
  const snowFrom = 0.26;
  const ring = (k: number): P3 => corner(k, radius * (1 - snowFrom), base + height * snowFrom);
  const lit = (a: P3, c: P3, d: P3) => {
    const ux = c[0] - a[0], uz = c[2] - a[2], vx = d[0] - a[0], vz = d[2] - a[2];
    const uy = c[1] - a[1], vy = d[1] - a[1];
    const nx = uy * vz - uz * vy, nz = ux * vy - uy * vx;
    return nx * -SHADOW_DIR_3E.x + nz * -SHADOW_DIR_3E.z > 0;
  };
  for (let k = 0; k < sides; k++) {
    const n = k + 1;
    const a0 = corner(k, radius, base);
    const a1 = corner(n, radius, base);
    const r0 = ring(k);
    const r1 = ring(n);
    // Le milieu de la face, sur sa ligne de plus grande pente : chaque face en deux pans, l'un plus clair que l'autre.
    const midBase: P3 = [(a0[0] + a1[0]) / 2, base, (a0[2] + a1[2]) / 2];
    const midRing: P3 = [(r0[0] + r1[0]) / 2, r0[1], (r0[2] + r1[2]) / 2];
    // Vue de dehors, dans le sens inverse des aiguilles d'une montre : du coin `k + 1` au coin `k`.
    const sunny = lit(a1, a0, top);
    b.quad(a1, midBase, midRing, r1, sunny ? COLORS_3E.graniteSun : COLORS_3E.granite);
    b.quad(midBase, a0, r0, midRing, sunny ? COLORS_3E.granite : COLORS_3E.graniteShade);
    b.triangle(r1, midRing, top, sunny ? COLORS_3E.snow : COLORS_3E.snowShade);
    b.triangle(midRing, r0, top, sunny ? COLORS_3E.snowShade : COLORS_3E.snowShade);
  }
  return b.build();
}

// ---------- Le liseré d'ardoise des rives ----------

/**
 * Le liseré d'ardoise (fiche, § 5, « La limite de ce qu'on marche » ; avis dys, point 1) : à chaque rive, celle de la
 * montagne comme celle de chaque Prairie, un bourrelet de pierre continu, qui se lit par sa forme autant que par sa
 * couleur. `inset` : sa place, en deçà de la rive (la montagne, en pente douce ; les Prairies, au bord) ; `width`,
 * `height` : sa largeur et sa hauteur au-dessus du sol ; `foot` : jusqu'où ses flancs descendent ; `step` : le pas de son
 * tracé le long de la rive.
 */
export const RIM_3E = { inset: { mountain: 2.2, prairie: 1.1 }, width: 0.9, height: 0.28, foot: 0.6, step: 4.5 } as const;

/**
 * Le liseré d'une Prairie (relecture du Cirque, correction 9 : vu de loin, il se lisait comme un haut mur bleu marine,
 * l'île comme une plaque posée sur la nappe) : plus bas que celui de la montagne (`height`), son flanc du dehors gardé
 * d'ardoise sur une bande mince (`band`), puis la nappe qui monte contre lui, de la teinte des nuages, de `out` au-delà
 * de son pied jusqu'à `y` sous leur plan.
 */
const PRAIRIE_RIM_3E = { height: 0.16, band: 0.14, cloud: { out: 1.6, y: -0.05 } } as const;

/** Une rive repassée à un pas régulier, fermée. */
export function resampleLoop(loop: readonly Vec2[], step: number): Vec2[] {
  const out: Vec2[] = [];
  for (let i = 0; i < loop.length; i++) {
    const a = loop[i],
      c = loop[(i + 1) % loop.length];
    const n = Math.max(1, Math.ceil(distance(a, c) / step));
    for (let k = 0; k < n; k++) out.push({ x: a.x + ((c.x - a.x) * k) / n, z: a.z + ((c.z - a.z) * k) / n });
  }
  return out;
}

/**
 * Le liseré d'une rive : chaque point repassé, poussé vers la terre de `inset` (la normale qui entre dans le polygone),
 * posé sur le sol ; un dessus et deux flancs par tronçon.
 */
function rimOf(b: FacetBuilder, loop: readonly Vec2[], inset: number, dip = false): void {
  const height = dip ? PRAIRIE_RIM_3E.height : RIM_3E.height;
  const pts = resampleLoop(loop, RIM_3E.step);
  const n = pts.length;
  const inward = (i: number): Vec2 => {
    const a = pts[(i - 1 + n) % n],
      c = pts[(i + 1) % n];
    const l = Math.hypot(c.x - a.x, c.z - a.z) || 1;
    const nrm = { x: (c.z - a.z) / l, z: -(c.x - a.x) / l };
    return insidePolygon({ x: pts[i].x + nrm.x * 0.5, z: pts[i].z + nrm.z * 0.5 }, loop) ? nrm : { x: -nrm.x, z: -nrm.z };
  };
  const w = RIM_3E.width / 2;
  const ring = pts.map((p, i) => {
    const m = inward(i);
    const c = { x: p.x + m.x * inset, z: p.z + m.z * inset };
    const y = Math.max(heightAt3e(c), heightAt3e({ x: c.x + m.x * w, z: c.z + m.z * w }), 0.05);
    return { out: { x: c.x - m.x * w, z: c.z - m.z * w }, in: { x: c.x + m.x * w, z: c.z + m.z * w }, y };
  });
  const up = (a: P3, c: P3, d: P3, e: P3, color: number, want: P3) => {
    const ux = c[0] - a[0], uy = c[1] - a[1], uz = c[2] - a[2];
    const vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    if (nx * want[0] + ny * want[1] + nz * want[2] >= 0) b.quad(a, c, d, e, color);
    else b.quad(e, d, c, a, color);
  };
  for (let i = 0; i < n; i++) {
    const p = ring[i],
      q = ring[(i + 1) % n];
    const tp = p.y + height,
      tq = q.y + height;
    const m = inward(i);
    up([p.out.x, tp, p.out.z], [q.out.x, tq, q.out.z], [q.in.x, tq, q.in.z], [p.in.x, tp, p.in.z], COLORS_3E.slateTop, [0, 1, 0]);
    if (dip) {
      // Le flanc du dehors d'une Prairie : une bande mince d'ardoise, puis la nappe qui monte contre elle, de la teinte des
      // nuages, sans rien laisser voir dessous.
      const P = PRAIRIE_RIM_3E;
      const o = P.cloud.out;
      const mq = inward((i + 1) % n);
      const bp = tp - P.band,
        bq = tq - P.band;
      up([p.out.x, bp, p.out.z], [q.out.x, bq, q.out.z], [q.out.x, tq, q.out.z], [p.out.x, tp, p.out.z], COLORS_3E.slate, [-m.x, 0, -m.z]);
      up([p.out.x - m.x * o, P.cloud.y, p.out.z - m.z * o], [q.out.x - mq.x * o, P.cloud.y, q.out.z - mq.z * o], [q.out.x, bq, q.out.z], [p.out.x, bp, p.out.z], COLORS_3E.cloud, [-m.x, 0.6, -m.z]);
    } else up([p.out.x, p.y - RIM_3E.foot, p.out.z], [q.out.x, q.y - RIM_3E.foot, q.out.z], [q.out.x, tq, q.out.z], [p.out.x, tp, p.out.z], COLORS_3E.slate, [-m.x, 0, -m.z]);
    up([p.in.x, p.y - RIM_3E.foot, p.in.z], [q.in.x, q.y - RIM_3E.foot, q.in.z], [q.in.x, tq, q.in.z], [p.in.x, tp, p.in.z], COLORS_3E.slate, [m.x, 0, m.z]);
  }
}

/** Les liserés d'ardoise des quatre rives : la montagne et les trois Prairies. */
export function shoreRimFacets(): Facets {
  const b = new FacetBuilder();
  rimOf(b, MOUNTAIN_3E, RIM_3E.inset.mountain);
  for (const loop of [PRAIRIES_3E.grande, PRAIRIES_3E.deuxieme, PRAIRIES_3E.petite]) rimOf(b, loop, RIM_3E.inset.prairie, true);
  return b.build();
}
