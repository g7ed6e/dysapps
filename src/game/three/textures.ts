// Matériaux Three.js des blocs, faits des textures pixel de world/pixels.ts.
import * as THREE from 'three';
import { canvasFor, faceCanvas, grain, type TextureFace, type TextureKind } from '../world/pixels';

export type { TextureKind };

function textureOf(canvas: HTMLCanvasElement | null): THREE.Texture | null {
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
export function blockMaterial(kind: TextureKind, muted = false): THREE.Material | THREE.Material[] {
  const key = muted ? `muted:${kind}` : `kind:${kind}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const face = (f: TextureFace) => textureOf(faceCanvas(kind, f, muted));
  const side = face('side');
  const top = face('top');
  const bottom = face('bottom');
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
    grainMap = textureOf(canvasFor(grain('#d8d8d8', '#ffffff'), 5)) ?? undefined;
    if (grainMap) cache.set('grainmap', grainMap as unknown as THREE.Material);
  }
  const material = new THREE.MeshLambertMaterial({ color: new THREE.Color(color), map: grainMap ?? null });
  cache.set(key, material);
  return material;
}
