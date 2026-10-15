// Maillage du village : seules les faces visibles sont gardées, regroupées par matériau.
// Pur (sans Three.js) : testable, et le composant 3D n'a plus qu'à créer une géométrie par groupe.
import type { VoxelCube } from './cube';

export type FaceSide = 'top' | 'bottom' | 'side';

/** Un groupe de faces partageant le même matériau : `tex:<texture>:<face>` ou `tint:<couleur>`. */
export interface MeshGroup {
  key: string;
  texture?: string;
  face: FaceSide;
  color?: string;
  /** Fantôme de plan : translucide, ne cache rien. */
  ghost?: boolean;
  /** Île verrouillée : matériau délavé. */
  muted?: boolean;
  positions: number[];
  normals: number[];
  uvs: number[];
  indices: number[];
}

/** Six directions : (dx, dy, dz) en coordonnées de grille (z = hauteur). */
const DIRS: { d: [number, number, number]; face: FaceSide }[] = [
  { d: [1, 0, 0], face: 'side' },
  { d: [-1, 0, 0], face: 'side' },
  { d: [0, 0, 1], face: 'top' },
  { d: [0, 0, -1], face: 'bottom' },
  { d: [0, 1, 0], face: 'side' },
  { d: [0, -1, 0], face: 'side' },
];

const key = (x: number, y: number, z: number) => `${x},${y},${z}`;

/** Les quatre coins d'une face, dans le repère Three (X = x, Y = z, Z = y), avec leurs uv (v = 1 en haut). */
function corners(c: VoxelCube, [dx, dy, dz]: [number, number, number]): { p: [number, number, number]; uv: [number, number] }[] {
  const x0 = c.x;
  const x1 = c.x + 1;
  const y0 = c.z;
  const y1 = c.z + 1;
  const z0 = c.y;
  const z1 = c.y + 1;
  if (dz === 1)
    return [
      { p: [x0, y1, z0], uv: [0, 1] },
      { p: [x0, y1, z1], uv: [0, 0] },
      { p: [x1, y1, z1], uv: [1, 0] },
      { p: [x1, y1, z0], uv: [1, 1] },
    ];
  if (dz === -1)
    return [
      { p: [x0, y0, z0], uv: [0, 1] },
      { p: [x1, y0, z0], uv: [1, 1] },
      { p: [x1, y0, z1], uv: [1, 0] },
      { p: [x0, y0, z1], uv: [0, 0] },
    ];
  if (dx === 1)
    return [
      { p: [x1, y1, z0], uv: [0, 1] },
      { p: [x1, y1, z1], uv: [1, 1] },
      { p: [x1, y0, z1], uv: [1, 0] },
      { p: [x1, y0, z0], uv: [0, 0] },
    ];
  if (dx === -1)
    return [
      { p: [x0, y1, z1], uv: [0, 1] },
      { p: [x0, y1, z0], uv: [1, 1] },
      { p: [x0, y0, z0], uv: [1, 0] },
      { p: [x0, y0, z1], uv: [0, 0] },
    ];
  if (dy === 1)
    return [
      { p: [x1, y1, z1], uv: [0, 1] },
      { p: [x0, y1, z1], uv: [1, 1] },
      { p: [x0, y0, z1], uv: [1, 0] },
      { p: [x1, y0, z1], uv: [0, 0] },
    ];
  return [
    { p: [x0, y1, z0], uv: [0, 1] },
    { p: [x1, y1, z0], uv: [1, 1] },
    { p: [x1, y0, z0], uv: [1, 0] },
    { p: [x0, y0, z0], uv: [0, 0] },
  ];
}

/** Normale d'un quadrilatère (p0, p1, p2), pour vérifier que la face regarde vers l'extérieur. */
function normalOf(a: [number, number, number], b: [number, number, number], c: [number, number, number]): [number, number, number] {
  const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
  return [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
}

/** Le verre laisse voir les faces des blocs opaques derrière lui. */
const seeThrough = (c: VoxelCube | undefined) => c?.texture === 'verre';

export interface MeshOptions {
  /**
   * Blocland : le dessous des cubes posés à cette hauteur ou plus bas n'est pas dessiné (`hiddenBottomLevel`,
   * world/sea.ts) ; sans elle, tous les dessous visibles le sont.
   */
  hiddenBottomsUpTo?: number;
}

/**
 * Chaque face visible d'un ensemble de cubes : le cube, sa direction (en grille), et la face telle qu'elle se dessine
 * (le dessus d'un cube `dessusCommeLesCotes` se dessine comme un côté). `sol` : voir `buildMesh`.
 */
export function eachVisibleFace(
  cubes: readonly VoxelCube[],
  sol: readonly VoxelCube[],
  options: MeshOptions,
  f: (c: VoxelCube, d: [number, number, number], dessinee: FaceSide) => void,
): void {
  const { hiddenBottomsUpTo = -Infinity } = options;
  const byPos = new Map<string, VoxelCube>();
  for (const c of cubes) byPos.set(key(c.x, c.y, c.z), c);
  const ground = new Set(sol.map((c) => key(c.x, c.y, c.z)));
  for (const c of cubes) {
    for (const { d, face } of DIRS) {
      const neighbor = byPos.get(key(c.x + d[0], c.y + d[1], c.z + d[2]));
      // Un fantôme ne cache jamais une face, et garde toutes les siennes.
      if (neighbor && !neighbor.ghost && !c.ghost && !(seeThrough(neighbor) && !seeThrough(c))) continue;
      if (face === 'bottom' && !c.ghost && ground.has(key(c.x, c.y, c.z - 1))) continue;
      if (face === 'bottom' && c.sansDessous) continue;
      // Sous l'eau (ou sous le plancher de nuages), un dessous n'est jamais vu : la caméra reste au-dessus.
      if (face === 'bottom' && !c.ghost && c.z <= hiddenBottomsUpTo) continue;
      // Le dessus dessiné comme les côtés (`dessusCommeLesCotes`) : dans leur groupe, sans groupe de plus.
      f(c, d, face === 'top' && c.dessusCommeLesCotes ? 'side' : face);
    }
  }
}

/** Les quatre coins d'une face, tournés vers l'extérieur (X = dx, Y = dz, Z = dy), avec leurs uv. */
export function outwardCorners(c: VoxelCube, d: [number, number, number]): { p: [number, number, number]; uv: [number, number] }[] {
  const quad = corners(c, d);
  const n = normalOf(quad[0].p, quad[1].p, quad[2].p);
  return n[0] * d[0] + n[1] * d[2] + n[2] * d[1] < 0 ? [quad[0], quad[3], quad[2], quad[1]] : quad;
}

/**
 * Construit les groupes de faces visibles d'un ensemble de cubes. `sol` (rendu Archipéo, lot R2) : les cubes du sol,
 * dessinés à part en facettes (./landMesh.ts) ; ils ne sont pas dessinés ici, mais le dessous d'un cube posé sur eux
 * reste caché (la case où quelque chose est posé reste plate, à la hauteur du dessus du cube de sol).
 */
export function buildMesh(cubes: VoxelCube[], sol: VoxelCube[] = [], options: MeshOptions = {}): MeshGroup[] {
  const groups = new Map<string, MeshGroup>();
  eachVisibleFace(cubes, sol, options, (c, d, dessinee) => {
    const gkey = (c.muted ? 'muted:' : '') + (c.ghost ? `ghost:${c.texture ?? c.color}` : c.texture ? `tex:${c.texture}:${dessinee}` : `tint:${c.color}`);
    let g = groups.get(gkey);
    if (!g) {
      g = {
        key: gkey,
        texture: c.texture,
        face: dessinee,
        color: c.texture ? undefined : c.color,
        ghost: c.ghost,
        muted: c.muted,
        positions: [],
        normals: [],
        uvs: [],
        indices: [],
      };
      groups.set(gkey, g);
    }
    const base = g.positions.length / 3;
    for (const { p, uv } of outwardCorners(c, d)) {
      g.positions.push(p[0], p[1], p[2]);
      g.normals.push(d[0], d[2], d[1]);
      g.uvs.push(uv[0], uv[1]);
    }
    g.indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  });
  return [...groups.values()];
}

/** Un groupe de couleur unie (ni texture, ni fantôme) : tous ceux d'un modèle se dessinent ensemble (three/meshes.ts). */
export const isPlainTint = (g: MeshGroup): boolean => !g.texture && !g.ghost;

/**
 * Les appels de dessin d'un modèle dessiné par `meshesOf` (three/meshes.ts) : un par groupe texturé ou fantôme, un
 * seul pour toutes ses couleurs unies.
 */
export function drawCallsOf(groups: MeshGroup[]): number {
  const tints = groups.filter(isPlainTint).length;
  return groups.length - tints + (tints > 0 ? 1 : 0);
}

/** Nombre total de faces d'un maillage (pour les tests et le budget de performance). */
export function faceCount(groups: MeshGroup[]): number {
  return groups.reduce((n, g) => n + g.indices.length / 6, 0);
}
