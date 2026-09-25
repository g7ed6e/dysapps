// Petit moteur de dessin en cubes (projection isométrique 2D) pour les blocs et les créatures.

export interface VoxelCube {
  x: number;
  y: number;
  z: number;
  /** Couleur de base ; les faces du dessus et de droite sont dérivées automatiquement. */
  color: string;
  /** Couleur explicite du dessus (ex. bloc avec une face « herbe »). */
  top?: string;
  /** Étiquette de sélection en 3D (ex. l'identifiant d'un biome). */
  tag?: string;
  /** Bloc posé par l'élève (on peut le retirer). */
  placed?: boolean;
  /** Texture pixel en 3D ; sans texture, une couleur unie légèrement grainée. */
  texture?: string;
}

/** Motif de grain pixel à déclarer une fois par SVG (<defs>). */
export function PixelGrainDefs() {
  return (
    <defs>
      <pattern id="voxel-grain" width="4" height="4" patternUnits="userSpaceOnUse">
        <rect x="0" y="0" width="2" height="2" fill="#000" opacity="0.06" />
        <rect x="2" y="2" width="1" height="1" fill="#fff" opacity="0.12" />
        <rect x="1" y="3" width="1" height="1" fill="#000" opacity="0.08" />
      </pattern>
    </defs>
  );
}

/** Éclaircit ou assombrit une couleur hexadécimale. */
export function shade(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v: number) => Math.max(0, Math.min(255, Math.round(v + 255 * amount)));
  const r = ch((n >> 16) & 255);
  const g = ch((n >> 8) & 255);
  const b = ch(n & 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

const COS = Math.cos(Math.PI / 6);
const SIN = Math.sin(Math.PI / 6);

/** Position écran d'un sommet de la grille isométrique. */
export function project(x: number, y: number, z: number, s: number): [number, number] {
  return [(x - y) * s * COS, (x + y) * s * SIN - z * s];
}

const pts = (list: [number, number][]) => list.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');

/** Un cube dessiné en trois faces : dessus, gauche, droite. */
export function Cube({ x, y, z, color, top, s = 16 }: VoxelCube & { s?: number }) {
  const p = (dx: number, dy: number, dz: number) => project(x + dx, y + dy, z + dz, s);
  return (
    <g className="cube">
      <polygon points={pts([p(0, 0, 1), p(1, 0, 1), p(1, 1, 1), p(0, 1, 1)])} fill={top ?? shade(color, 0.16)} />
      <polygon points={pts([p(0, 1, 1), p(1, 1, 1), p(1, 1, 0), p(0, 1, 0)])} fill={color} />
      <polygon points={pts([p(1, 0, 1), p(1, 1, 1), p(1, 1, 0), p(1, 0, 0)])} fill={shade(color, -0.18)} />
      <polygon points={pts([p(0, 0, 1), p(1, 0, 1), p(1, 1, 1), p(0, 1, 1)])} fill="url(#voxel-grain)" />
      <polygon points={pts([p(0, 1, 1), p(1, 1, 1), p(1, 1, 0), p(0, 1, 0)])} fill="url(#voxel-grain)" />
      <polygon points={pts([p(1, 0, 1), p(1, 1, 1), p(1, 1, 0), p(1, 0, 0)])} fill="url(#voxel-grain)" />
    </g>
  );
}

/** Ordre de dessin : de l'arrière vers l'avant, puis du bas vers le haut. */
export function sortCubes<T extends VoxelCube>(cubes: T[]): T[] {
  return [...cubes].sort((a, b) => a.x + a.y - (b.x + b.y) || a.z - b.z);
}

interface SceneProps {
  cubes: VoxelCube[];
  /** Taille d'un cube en unités SVG. */
  s?: number;
  /** Marge autour de la scène. */
  pad?: number;
  className?: string;
  label?: string;
}

/** Scène SVG ajustée automatiquement autour de ses cubes. */
export function VoxelScene({ cubes, s = 16, pad = 4, className, label }: SceneProps) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const c of cubes) {
    for (const [dx, dy, dz] of [
      [0, 0, 0],
      [1, 0, 0],
      [0, 1, 0],
      [1, 1, 0],
      [0, 0, 1],
      [1, 0, 1],
      [0, 1, 1],
      [1, 1, 1],
    ] as const) {
      const [px, py] = project(c.x + dx, c.y + dy, c.z + dz, s);
      minX = Math.min(minX, px);
      maxX = Math.max(maxX, px);
      minY = Math.min(minY, py);
      maxY = Math.max(maxY, py);
    }
  }
  const viewBox = `${(minX - pad).toFixed(1)} ${(minY - pad).toFixed(1)} ${(maxX - minX + 2 * pad).toFixed(1)} ${(maxY - minY + 2 * pad).toFixed(1)}`;
  return (
    <svg className={className} viewBox={viewBox} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true} focusable="false">
      <PixelGrainDefs />
      {sortCubes(cubes).map((c, i) => (
        <Cube key={i} {...c} s={s} />
      ))}
    </svg>
  );
}

/** Un bloc seul (inventaire, récompense). */
export function BlockIcon({ top, side, size = 40, label }: { top: string; side: string; size?: number; label?: string }) {
  return <VoxelScene cubes={[{ x: 0, y: 0, z: 0, color: side, top }]} s={size / 2.3} pad={2} className="block-icon" label={label} />;
}
