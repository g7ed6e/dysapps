// Textures pixel 16 × 16 générées par le code (aucune image empruntée) : herbe, terre, pierre, planches…
import * as THREE from 'three';

export type TextureKind = 'herbe' | 'terre' | 'pierre' | 'planches' | 'sable' | 'verre' | 'or' | 'cristal' | 'feuilles' | 'tronc' | 'nuage';

const SIZE = 16;

/** Générateur pseudo-aléatoire reproductible : la même texture à chaque chargement. */
function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hex(h: string): [number, number, number] {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

type Painter = (x: number, y: number, r: () => number) => [number, number, number];

/** Mélange entre deux couleurs, avec un grain aléatoire. */
const grain =
  (a: string, b: string): Painter =>
  (_x, _y, r) => {
    const t = r();
    const [ar, ag, ab] = hex(a);
    const [br, bg, bb] = hex(b);
    return [ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t];
  };

const PAINTERS: Record<TextureKind, { top: Painter; side: Painter; bottom?: Painter }> = {
  herbe: {
    top: grain('#5fa233', '#7cc24a'),
    // Terre, avec une frange d'herbe qui descend de façon irrégulière.
    side: (x, y, r) => (y < 3 || (y === 3 && r() < 0.5) ? grain('#5fa233', '#7cc24a')(x, y, r) : grain('#7a5637', '#94694a')(x, y, r)),
    bottom: grain('#7a5637', '#94694a'),
  },
  terre: { top: grain('#7a5637', '#94694a'), side: grain('#7a5637', '#94694a') },
  pierre: {
    top: (x, y, r) => (r() < 0.12 ? grain('#6f6f6f', '#7a7a7a')(x, y, r) : grain('#858585', '#9c9c9c')(x, y, r)),
    side: (x, y, r) => (r() < 0.12 ? grain('#6f6f6f', '#7a7a7a')(x, y, r) : grain('#858585', '#9c9c9c')(x, y, r)),
  },
  planches: {
    top: (x, y, r) => (y % 4 === 3 || (y % 4 === 1 && x === (y * 5) % 16) ? [138, 103, 56] : grain('#a67f46', '#c29a5f')(x, y, r)),
    side: (x, y, r) => (y % 4 === 3 ? [138, 103, 56] : grain('#a67f46', '#c29a5f')(x, y, r)),
  },
  sable: { top: grain('#d9cf9c', '#e8e0b4'), side: grain('#d2c894', '#e3dbad') },
  verre: {
    top: (x, y) => (x === 0 || y === 0 || x === SIZE - 1 || y === SIZE - 1 ? [230, 250, 255] : x === y || x === y + 1 ? [240, 252, 255] : [190, 232, 242]),
    side: (x, y) => (x === 0 || y === 0 || x === SIZE - 1 || y === SIZE - 1 ? [230, 250, 255] : x === y || x === y + 1 ? [240, 252, 255] : [190, 232, 242]),
  },
  or: {
    top: (x, y, r) => (r() < 0.1 ? [255, 240, 150] : grain('#e0b52a', '#f2c944')(x, y, r)),
    side: (x, y, r) => (r() < 0.1 ? [255, 240, 150] : grain('#d4a820', '#eac03c')(x, y, r)),
  },
  cristal: {
    top: (x, y, r) => (r() < 0.12 ? [235, 255, 253] : grain('#5cd0c8', '#78e8de')(x, y, r)),
    side: (x, y, r) => (r() < 0.12 ? [235, 255, 253] : grain('#4fc3bb', '#6fdcd3')(x, y, r)),
  },
  feuilles: {
    top: (x, y, r) => (r() < 0.15 ? [46, 92, 30] : grain('#3f7a2b', '#55a13a')(x, y, r)),
    side: (x, y, r) => (r() < 0.15 ? [46, 92, 30] : grain('#3f7a2b', '#55a13a')(x, y, r)),
  },
  tronc: {
    top: (x, y) => (Math.hypot(x - 7.5, y - 7.5) < 3 ? [190, 160, 110] : [160, 128, 84]),
    side: (x, y, r) => (x % 4 === 0 ? [80, 55, 30] : grain('#5f4128', '#7a5636')(x, y, r)),
  },
  nuage: { top: () => [255, 255, 255], side: () => [236, 244, 250] },
};

function canvasFor(painter: Painter, seed: number): HTMLCanvasElement | null {
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const image = ctx.createImageData(SIZE, SIZE);
  const r = rng(seed);
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const [cr, cg, cb] = painter(x, y, r);
      const i = (y * SIZE + x) * 4;
      image.data[i] = cr;
      image.data[i + 1] = cg;
      image.data[i + 2] = cb;
      image.data[i + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  return canvas;
}

function textureOf(painter: Painter, seed: number): THREE.Texture | null {
  const canvas = canvasFor(painter, seed);
  if (!canvas) return null;
  const tex = new THREE.CanvasTexture(canvas);
  // Pas de lissage : chaque pixel reste un carré net.
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const cache = new Map<string, THREE.Material | THREE.Material[]>();

/** Matériau (6 faces) d'un bloc texturé, partagé entre tous les cubes du même type. */
export function blockMaterial(kind: TextureKind): THREE.Material | THREE.Material[] {
  const key = `kind:${kind}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const p = PAINTERS[kind];
  const side = textureOf(p.side, 11);
  const top = textureOf(p.top, 23);
  const bottom = textureOf(p.bottom ?? p.top, 37);
  let material: THREE.Material | THREE.Material[];
  if (!side || !top || !bottom) material = new THREE.MeshLambertMaterial({ color: 0x9c9c9c });
  else {
    const mk = (map: THREE.Texture) => new THREE.MeshLambertMaterial({ map, transparent: kind === 'verre', opacity: kind === 'verre' ? 0.85 : 1 });
    // Ordre des faces d'une BoxGeometry : +x, -x, +y (dessus), -y (dessous), +z, -z.
    material = [mk(side), mk(side), mk(top), mk(bottom), mk(side), mk(side)];
  }
  cache.set(key, material);
  return material;
}

/** Matériau d'une couleur unie avec un léger grain pixel (créatures). */
export function tintedMaterial(color: string): THREE.Material {
  const key = `tint:${color}`;
  const cached = cache.get(key);
  if (cached) return cached as THREE.Material;
  let grainMap = cache.get('grainmap') as unknown as THREE.Texture | undefined;
  if (!grainMap) {
    grainMap = textureOf(grain('#d8d8d8', '#ffffff'), 5) ?? undefined;
    if (grainMap) cache.set('grainmap', grainMap as unknown as THREE.Material);
  }
  const material = new THREE.MeshLambertMaterial({ color: new THREE.Color(color), map: grainMap ?? null });
  cache.set(key, material);
  return material;
}
