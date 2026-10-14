// Le terrain du monde continu : une carte de hauteurs tirée du plan du 6e (./plan6e.ts), puis des tuiles de facettes
// en aplats (low poly d'Archipéo : une couleur par facette, sable, herbe, roche, haut de falaise). Ce qui est sous
// l'eau n'est pas dessiné : la mer le couvre. Code pur : la vue (three/archipeo/) ne fait que donner ces tableaux à
// Three.js.
import { FacetBuilder, type Facets } from './facets';
import { distance, distanceToPolyline, hash2, signedDistance, smoothstep, type Vec2 } from './geometry';
import { CLIFF, COAST, COLORS_6E, DECK_HEIGHT, ISLET, LAGOON, PASS, RIVER, TERRAIN, UPLAND } from './plan6e';

/** La distance signée à la terre ferme : positive sur la terre, négative dans l'eau (mer, lagon, passe, rivière). */
export function landDistance(p: Vec2): number {
  const ring = Math.min(signedDistance(p, COAST), -signedDistance(p, LAGOON), -signedDistance(p, PASS));
  const land = Math.max(ring, signedDistance(p, ISLET));
  return Math.min(land, distanceToPolyline(p, RIVER.line) - RIVER.halfWidth);
}

/** La hauteur du sol, avant la grille : la plage presque plate, l'herbe qui monte, la falaise nord, le haut pays de l'est. */
export function heightAt(p: Vec2): number {
  const d = landDistance(p);
  if (d < 0) return -0.35 + Math.max(d, -4) * 0.3;
  // La plage : de 0,2 à 0,45 sur une unité et demie, puis l'herbe qui monte doucement vers l'intérieur.
  let h = 0.2 + 0.25 * smoothstep(0, 1.5, d) + 0.18 * Math.max(0, Math.min(d, 9) - 1.5);
  // Des bosses douces, pour que les facettes accrochent la lumière (jamais sur la plage).
  const bumps = Math.sin(p.x * 0.45) * Math.cos(p.z * 0.38) + 0.5 * Math.sin(p.x * 0.9 + p.z * 0.7);
  h += 0.35 * bumps * smoothstep(1.5, 4, d);
  // La falaise du nord : un plateau à 7 au-dessus, aux bords raides.
  h += 7 * smoothstep(0, 1.6, signedDistance(p, CLIFF));
  // Le haut pays de l'est : une colline ronde, que la rivière entaille.
  const u = distance(p, UPLAND.center) / UPLAND.radius;
  h += UPLAND.height * smoothstep(1, 0.25, u) * smoothstep(0, 2.5, d);
  return h;
}

/** La carte de hauteurs : une grille régulière sur l'étendue du terrain. */
export interface HeightField {
  minX: number;
  minZ: number;
  step: number;
  /** Nombre de sommets en x et en z. */
  nx: number;
  nz: number;
  heights: Float32Array;
}

/** Tire la carte de hauteurs du plan (une fois par scène). */
export function buildHeightField(): HeightField {
  const { minX, maxX, minZ, maxZ, step } = TERRAIN;
  const nx = Math.round((maxX - minX) / step) + 1;
  const nz = Math.round((maxZ - minZ) / step) + 1;
  const heights = new Float32Array(nx * nz);
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) heights[j * nx + i] = heightAt({ x: minX + i * step, z: minZ + j * step });
  return { minX, minZ, step, nx, nz, heights };
}

const at = (f: HeightField, i: number, j: number) => f.heights[j * f.nx + i];

/** La diagonale d'une case alterne, en damier : les facettes ne s'alignent pas toutes. */
const flipped = (i: number, j: number) => (i + j) % 2 === 1;

/**
 * La hauteur du sol dessiné en (x, z) : sur le triangle de la case qui contient le point, exactement comme la tuile
 * (les pieds de Kéo s'y posent, jamais dedans ni au-dessus). Hors de la grille, la hauteur du plan.
 */
export function heightOnMesh(f: HeightField, x: number, z: number): number {
  const u = (x - f.minX) / f.step;
  const v = (z - f.minZ) / f.step;
  const i = Math.floor(u);
  const j = Math.floor(v);
  if (i < 0 || j < 0 || i >= f.nx - 1 || j >= f.nz - 1) return heightAt({ x, z });
  const s = u - i;
  const t = v - j;
  const h00 = at(f, i, j);
  const h10 = at(f, i + 1, j);
  const h01 = at(f, i, j + 1);
  const h11 = at(f, i + 1, j + 1);
  if (!flipped(i, j)) {
    // Diagonale de (0,0) à (1,1).
    return s >= t ? h00 + s * (h10 - h00) + t * (h11 - h10) : h00 + t * (h01 - h00) + s * (h11 - h01);
  }
  // Diagonale de (1,0) à (0,1).
  return s + t <= 1 ? h00 + s * (h10 - h00) + t * (h01 - h00) : h11 + (1 - s) * (h01 - h11) + (1 - t) * (h10 - h11);
}

/**
 * La hauteur où l'on se tient : le sol, ou le dessus de la digue et des pontons quand le sol est sous l'eau (Kéo, les
 * chemins, le pied des lieux).
 */
export function standingHeight(ground: number): number {
  return Math.max(ground, DECK_HEIGHT);
}

/** Sous ce niveau, une case est sous l'eau : la mer la cache, elle n'est pas dessinée. */
const HIDDEN_BELOW = -0.12;

/** La couleur d'une facette : la roche si elle est raide, le sable près de l'eau, l'herbe ailleurs (le haut de falaise plus sombre). */
function facetColor(a: [number, number, number], b: [number, number, number], c: [number, number, number], vary: number): number {
  const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
  const vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
  const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
  const up = Math.abs(ny) / Math.hypot(nx, ny, nz);
  const cx = (a[0] + b[0] + c[0]) / 3;
  const cz = (a[2] + b[2] + c[2]) / 3;
  const h = (a[1] + b[1] + c[1]) / 3;
  if (up < 0.62) return COLORS_6E.rock;
  if (h < 0.12) return COLORS_6E.wetSand;
  const d = landDistance({ x: cx, z: cz });
  if (d < 1.3) return COLORS_6E.sand;
  if (signedDistance({ x: cx, z: cz }, CLIFF) > 0.6) return COLORS_6E.cliffTop;
  return vary < 0.5 ? COLORS_6E.grass : 0x66b84a;
}

/** Les tuiles du terrain, en `TERRAIN.tiles` × `TERRAIN.tiles` : chacune un maillage, écarté quand il sort de la vue. */
export function terrainTiles(f: HeightField): Facets[] {
  const n = TERRAIN.tiles;
  const cellsX = f.nx - 1;
  const cellsZ = f.nz - 1;
  const tiles: Facets[] = [];
  for (let tz = 0; tz < n; tz++)
    for (let tx = 0; tx < n; tx++) {
      const b = new FacetBuilder();
      const i0 = Math.floor((tx * cellsX) / n);
      const i1 = Math.floor(((tx + 1) * cellsX) / n);
      const j0 = Math.floor((tz * cellsZ) / n);
      const j1 = Math.floor(((tz + 1) * cellsZ) / n);
      for (let j = j0; j < j1; j++)
        for (let i = i0; i < i1; i++) {
          const p = (di: number, dj: number): [number, number, number] => [f.minX + (i + di) * f.step, at(f, i + di, j + dj), f.minZ + (j + dj) * f.step];
          const p00 = p(0, 0);
          const p10 = p(1, 0);
          const p01 = p(0, 1);
          const p11 = p(1, 1);
          const tris = flipped(i, j)
            ? [[p00, p01, p10], [p11, p10, p01]]
            : [[p00, p11, p10], [p00, p01, p11]];
          for (const [a, bb, c] of tris) {
            if (Math.max(a[1], bb[1], c[1]) < HIDDEN_BELOW) continue;
            b.triangle(a, bb, c, facetColor(a, bb, c, hash2(i, j)));
          }
        }
      tiles.push(b.build());
    }
  return tiles;
}
