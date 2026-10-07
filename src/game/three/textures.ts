// Matériaux Three.js des blocs, faits des textures pixel de world/pixels.ts.
import * as THREE from 'three';
import { canvasFor, faceCanvas, facePixels, GRAIN_DES_TEINTES, pixelsFor, SIZE, type TextureFace, type TextureKind } from '../world/pixels';
import { LAYER_COUNT, layerContent, type BlockPass } from '../world/blockMesh';

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

/** La texture du grain pixel des couleurs unies, peinte une fois. */
function grainTexture(): THREE.Texture | null {
  let grainMap = cache.get('grainmap') as unknown as THREE.Texture | undefined;
  if (!grainMap) {
    grainMap = textureOf(canvasFor(GRAIN_DES_TEINTES.peintre, GRAIN_DES_TEINTES.graine)) ?? undefined;
    if (grainMap) cache.set('grainmap', grainMap as unknown as THREE.Material);
  }
  return grainMap ?? null;
}

/** Matériau d'une couleur unie avec un léger grain pixel (créatures). */
export function tintedMaterial(color: string): THREE.Material {
  const key = `tint:${color}`;
  const cached = cache.get(key);
  if (cached) return cached as THREE.Material;
  const material = new THREE.MeshLambertMaterial({ color: new THREE.Color(color), map: grainTexture() });
  cache.set(key, material);
  return material;
}

/**
 * Le matériau de toutes les couleurs unies d'un modèle à la fois (personnages) : la couleur de chaque face est dans ses
 * sommets, le grain le même que `tintedMaterial`. Une seule couleur par appel de dessin coûtait un appel par couleur.
 */
export function vertexTintedMaterial(): THREE.Material {
  const cached = cache.get('vertex-tint');
  if (cached) return cached as THREE.Material;
  const material = new THREE.MeshLambertMaterial({ vertexColors: true, map: grainTexture() });
  cache.set('vertex-tint', material);
  return material;
}

/**
 * La texture des blocs (piste 2 du budget de rendu) : toutes les faces de toutes les sortes, normales et délavées, et le
 * grain des couleurs unies, en couches d'un seul tableau de textures (world/blockMesh.ts `layerOf`). Peinte une fois.
 * Elle se répète case par case sur une face fondue.
 */
function blockArrayTexture(): THREE.DataArrayTexture {
  let t = cache.get('block-array') as unknown as THREE.DataArrayTexture | undefined;
  if (t) return t;
  const couche = SIZE * SIZE * 4;
  const data = new Uint8Array(couche * LAYER_COUNT);
  for (let l = 0; l < LAYER_COUNT; l++) {
    const c = layerContent(l);
    const px = c ? facePixels(c.kind, c.face, c.muted) : pixelsFor(GRAIN_DES_TEINTES.peintre, GRAIN_DES_TEINTES.graine);
    // Retournée ligne à ligne, comme un canvas en texture (`flipY`, que le tableau de textures ne connaît pas) : v = 1 en haut.
    for (let y = 0; y < SIZE; y++) data.set(px.subarray(y * SIZE * 4, (y + 1) * SIZE * 4), l * couche + (SIZE - 1 - y) * SIZE * 4);
  }
  t = new THREE.DataArrayTexture(data, SIZE, SIZE, LAYER_COUNT);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.needsUpdate = true;
  cache.set('block-array', t as unknown as THREE.Material);
  return t;
}

/**
 * Lit la couche de chaque sommet dans la texture des blocs, à la place de `map`, et ajoute sa lueur (`aGlow`). Le même
 * programme pour tous les matériaux d'une passe.
 */
function lireLaTextureDesBlocs(shader: THREE.WebGLProgramParametersWithUniforms): void {
  shader.uniforms.uBlocs = { value: blockArrayTexture() };
  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', '#include <common>\nattribute float aLayer;\nattribute vec3 aGlow;\nvarying vec3 vBloc;\nvarying vec3 vGlow;')
    .replace('#include <begin_vertex>', '#include <begin_vertex>\nvBloc = vec3(uv, aLayer);\nvGlow = aGlow;');
  shader.fragmentShader = shader.fragmentShader
    .replace('#include <common>', '#include <common>\nuniform highp sampler2DArray uBlocs;\nvarying vec3 vBloc;\nvarying vec3 vGlow;')
    .replace('#include <map_fragment>', '#include <map_fragment>\ndiffuseColor *= texture(uBlocs, vBloc);')
    .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += vGlow;');
}

/**
 * Le matériau d'une passe des blocs (world/blockMesh.ts) : opaque, le verre (translucide) ou les fantômes des plans
 * (bleutés et translucides : on voit que c'est « à poser », et ce qu'il y a derrière). Les mêmes valeurs que les matériaux
 * d'une texture (`blockMaterial`, `tintedMaterial`) ; la couleur et la lueur de chaque face sont dans ses sommets.
 */
export function blockPassMaterial(pass: BlockPass): THREE.Material {
  const key = `block-pass:${pass}`;
  const cached = cache.get(key);
  if (cached) return cached as THREE.Material;
  const material =
    pass === 'ghost'
      ? new THREE.MeshLambertMaterial({ color: 0xa8d8ff, emissive: 0x2a4a6a, transparent: true, opacity: 0.6, depthWrite: false })
      : new THREE.MeshLambertMaterial({ vertexColors: true, transparent: pass === 'glass', opacity: pass === 'glass' ? 0.85 : 1 });
  material.onBeforeCompile = lireLaTextureDesBlocs;
  material.customProgramCacheKey = () => 'blocs';
  cache.set(key, material);
  return material;
}
