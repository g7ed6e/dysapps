// Les facettes du monde continu : des triangles en aplats (une couleur et une normale par facette, le low poly peint
// d'Archipéo), rangés dans des tableaux que la vue donne tels quels à Three.js. Quelques volumes simples (pavé,
// prisme, toit à deux pans) pour les maquettes des lieux (./places.ts). Code pur.
import { linearRgb } from './geometry';

/** Un maillage à plat : trois sommets par triangle, sans index. */
export interface Facets {
  positions: Float32Array;
  normals: Float32Array;
  /** Rouge, vert, bleu linéaires, par sommet. */
  colors: Float32Array;
  triangles: number;
}

type P3 = readonly [number, number, number];

/** Où l'on pose un volume : sa place, et sa rotation autour de la verticale puis autour de l'axe est-ouest. */
export interface Placement {
  x: number;
  y: number;
  z: number;
  yaw?: number;
  /** Bascule autour de x (une roue debout), avant le quart de tour. */
  pitch?: number;
}

export class FacetBuilder {
  private readonly pos: number[] = [];
  private readonly nor: number[] = [];
  private readonly col: number[] = [];
  private readonly cache = new Map<number, [number, number, number]>();

  /** Un triangle, dans le sens inverse des aiguilles d'une montre vu de sa face. */
  triangle(a: P3, b: P3, c: P3, color: number): void {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
    const vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const l = Math.hypot(nx, ny, nz) || 1;
    nx /= l;
    ny /= l;
    nz /= l;
    let rgb = this.cache.get(color);
    if (!rgb) {
      rgb = linearRgb(color);
      this.cache.set(color, rgb);
    }
    for (const p of [a, b, c]) {
      this.pos.push(p[0], p[1], p[2]);
      this.nor.push(nx, ny, nz);
      this.col.push(rgb[0], rgb[1], rgb[2]);
    }
  }

  /** Un quadrilatère (a, b, c, d dans l'ordre du tour, vu de sa face). */
  quad(a: P3, b: P3, c: P3, d: P3, color: number): void {
    this.triangle(a, b, c, color);
    this.triangle(a, c, d, color);
  }

  /** Un pavé : `size` en x, y, z, posé sur sa face du bas (y = 0 du repère), centré en x et z. `top` : la couleur du dessus. */
  box(at: Placement, size: P3, color: number, top = color): void {
    const [sx, sy, sz] = size;
    const x0 = -sx / 2, x1 = sx / 2, z0 = -sz / 2, z1 = sz / 2;
    const t = transform(at);
    const v = (x: number, y: number, z: number) => t([x, y, z]);
    this.quad(v(x0, sy, z0), v(x0, sy, z1), v(x1, sy, z1), v(x1, sy, z0), top);
    this.quad(v(x0, 0, z1), v(x1, 0, z1), v(x1, sy, z1), v(x0, sy, z1), color);
    this.quad(v(x1, 0, z0), v(x0, 0, z0), v(x0, sy, z0), v(x1, sy, z0), color);
    this.quad(v(x1, 0, z1), v(x1, 0, z0), v(x1, sy, z0), v(x1, sy, z1), color);
    this.quad(v(x0, 0, z0), v(x0, 0, z1), v(x0, sy, z1), v(x0, sy, z0), color);
  }

  /**
   * Un prisme (ou un tronc de cône) à `sides` côtés, de rayon `r0` en bas et `r1` en haut, de hauteur `h` ; le dessus
   * fermé (sauf si `r1` est nul : une pointe), le dessous jamais (il est posé).
   */
  prism(at: Placement, r0: number, r1: number, h: number, sides: number, color: number, top = color): void {
    const t = transform(at);
    const ring = (r: number, y: number) => Array.from({ length: sides }, (_, k) => t([r * Math.cos((2 * Math.PI * k) / sides), y, r * Math.sin((2 * Math.PI * k) / sides)]));
    const lo = ring(r0, 0);
    const hi = ring(r1, h);
    for (let k = 0; k < sides; k++) {
      const n = (k + 1) % sides;
      if (r1 > 0) this.quad(lo[n], lo[k], hi[k], hi[n], color);
      else this.triangle(lo[n], lo[k], hi[k], color);
    }
    if (r1 > 0) {
      const c = t([0, h, 0]);
      for (let k = 0; k < sides; k++) this.triangle(c, hi[(k + 1) % sides], hi[k], top);
    }
  }

  /**
   * Un tambour : un prisme fermé des deux côtés (une roue debout, dont les deux faces se voient), de rayon `r`, de
   * largeur `h` ; `face` : la couleur des deux faces.
   */
  drum(at: Placement, r: number, h: number, sides: number, rim: number, face = rim): void {
    this.prism(at, r, r, h, sides, rim, face);
    const t = transform(at);
    const c = t([0, 0, 0]);
    const lo = Array.from({ length: sides }, (_, k) => t([r * Math.cos((2 * Math.PI * k) / sides), 0, r * Math.sin((2 * Math.PI * k) / sides)]));
    for (let k = 0; k < sides; k++) this.triangle(c, lo[k], lo[(k + 1) % sides], face);
  }

  /** Un pavé tendu entre deux points (un bras, une corde, une potence), de section carrée `t`. */
  beam(a: { x: number; y: number; z: number }, c: { x: number; y: number; z: number }, t: number, color: number): void {
    const dx = c.x - a.x, dy = c.y - a.y, dz = c.z - a.z;
    const len = Math.hypot(dx, dy, dz) || 1e-6;
    const d = [dx / len, dy / len, dz / len];
    // Deux axes perpendiculaires au pavé, de la demi-section.
    const ref = Math.abs(d[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
    const u0 = [d[1] * ref[2] - d[2] * ref[1], d[2] * ref[0] - d[0] * ref[2], d[0] * ref[1] - d[1] * ref[0]];
    const ul = Math.hypot(u0[0], u0[1], u0[2]);
    const u = u0.map((v) => (v / ul) * (t / 2));
    const v = [d[1] * u[2] - d[2] * u[1], d[2] * u[0] - d[0] * u[2], d[0] * u[1] - d[1] * u[0]];
    const signs = [
      [1, 1],
      [-1, 1],
      [-1, -1],
      [1, -1],
    ];
    const ends = [a, c].map((p) => signs.map(([su, sv]) => [p.x + su * u[0] + sv * v[0], p.y + su * u[1] + sv * v[1], p.z + su * u[2] + sv * v[2]] as const));
    const [A, B] = ends;
    for (let k = 0; k < 4; k++) {
      const n = (k + 1) % 4;
      this.quad(A[k], A[n], B[n], B[k], color);
    }
    this.quad(B[0], B[1], B[2], B[3], color);
    this.quad(A[3], A[2], A[1], A[0], color);
  }

  /** Un toit à deux pans : `sx` le long du faîtage, `sz` en travers, `h` la hauteur du faîtage au-dessus de la base. */
  gableRoof(at: Placement, sx: number, sz: number, h: number, color: number, gable = color): void {
    const t = transform(at);
    const x0 = -sx / 2, x1 = sx / 2, z0 = -sz / 2, z1 = sz / 2;
    const a = t([x0, 0, z1]), b = t([x1, 0, z1]), c = t([x1, h, 0]), d = t([x0, h, 0]);
    const e = t([x1, 0, z0]), f = t([x0, 0, z0]);
    this.quad(a, b, c, d, color);
    this.quad(e, f, d, c, color);
    this.triangle(b, e, c, gable);
    this.triangle(f, a, d, gable);
  }

  /** Ajoute les facettes d'un autre maillage. */
  append(f: Facets): void {
    for (const v of f.positions) this.pos.push(v);
    for (const v of f.normals) this.nor.push(v);
    for (const v of f.colors) this.col.push(v);
  }

  build(): Facets {
    return { positions: new Float32Array(this.pos), normals: new Float32Array(this.nor), colors: new Float32Array(this.col), triangles: this.pos.length / 9 };
  }
}

/** La transformation d'un placement : bascule en x, quart de tour en y, puis déplacement. */
function transform({ x, y, z, yaw = 0, pitch = 0 }: Placement): (p: P3) => [number, number, number] {
  const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
  return ([px, py, pz]) => {
    const y1 = py * cp - pz * sp;
    const z1 = py * sp + pz * cp;
    return [x + px * cy + z1 * sy, y + y1, z - px * sy + z1 * cy];
  };
}

/** La boîte englobante de facettes : min puis max, en x, y, z. */
export function boundsOf(f: Facets): { min: [number, number, number]; max: [number, number, number] } {
  const min: [number, number, number] = [Infinity, Infinity, Infinity];
  const max: [number, number, number] = [-Infinity, -Infinity, -Infinity];
  for (let k = 0; k < f.positions.length; k++) {
    const v = f.positions[k];
    if (v < min[k % 3]) min[k % 3] = v;
    if (v > max[k % 3]) max[k % 3] = v;
  }
  return { min, max };
}

/**
 * Des facettes posées dans le monde : tournées autour de la verticale (`yaw`) puis déplacées, normales comprises. Pour
 * réunir plusieurs maquettes dans un seul maillage (un appel de dessin).
 */
export function placeFacets(f: Facets, at: { x: number; y: number; z: number; yaw?: number }): Facets {
  const c = Math.cos(at.yaw ?? 0),
    s = Math.sin(at.yaw ?? 0);
  const positions = new Float32Array(f.positions.length);
  const normals = new Float32Array(f.normals.length);
  for (let k = 0; k < f.positions.length; k += 3) {
    const px = f.positions[k], py = f.positions[k + 1], pz = f.positions[k + 2];
    positions[k] = at.x + px * c + pz * s;
    positions[k + 1] = at.y + py;
    positions[k + 2] = at.z - px * s + pz * c;
    const nx = f.normals[k], nz = f.normals[k + 2];
    normals[k] = nx * c + nz * s;
    normals[k + 1] = f.normals[k + 1];
    normals[k + 2] = -nx * s + nz * c;
  }
  return { positions, normals, colors: f.colors, triangles: f.triangles };
}

/** Plusieurs maillages réunis en un seul, leurs tableaux faits une fois. */
export function mergeFacets(list: readonly Facets[]): Facets {
  let length = 0;
  for (const f of list) length += f.positions.length;
  const positions = new Float32Array(length);
  const normals = new Float32Array(length);
  const colors = new Float32Array(length);
  let offset = 0;
  for (const f of list) {
    positions.set(f.positions, offset);
    normals.set(f.normals, offset);
    colors.set(f.colors, offset);
    offset += f.positions.length;
  }
  return { positions, normals, colors, triangles: length / 9 };
}
