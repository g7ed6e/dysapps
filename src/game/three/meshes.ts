// Les maillages et matériaux partagés par les parties de la scène 3D : un groupe de faces du mailleur en maillage, le
// matériau d'une face (cache), la texture d'une nappe de brume.
import * as THREE from 'three';
import { isPlainTint, type FaceSide, type MeshGroup } from '../world/mesher';
import { buildBlockMesh, GLOW, type BlockChunk } from '../world/blockMesh';
import { buildMesh } from '../world/mesher';
import type { VoxelCube } from '../world/cube';
import { blockMaterial, blockPassMaterial, tintedMaterial, vertexTintedMaterial, type TextureKind } from './textures';
import type { Surface } from './surface';
import { avecLAmenagement, HAUTEUR_DU_SOULEVEMENT } from './arrange';

/** Une nappe de brume : blanc au centre, qui s'efface vers les bords (dégradé radial peint une fois). */
export function mistTexture(): THREE.Texture | null {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const g = ctx.createRadialGradient(size / 2, size / 2, 4, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(246, 249, 252, 1)');
  g.addColorStop(0.55, 'rgba(246, 249, 252, 0.7)');
  g.addColorStop(1, 'rgba(246, 249, 252, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const ghostCache = new Map<string, THREE.Material>();


/** Matériau d'une face : les blocs texturés partagent les matériaux (cache), le reste est une couleur grainée. */
function materialFor(texture: string | undefined, face: FaceSide, color: string | undefined, ghost = false, muted = false): THREE.Material {
  if (ghost) {
    const k = texture ?? color ?? 'gris';
    let m = ghostCache.get(k);
    if (!m) {
      const base = texture ? blockMaterial(texture as TextureKind) : tintedMaterial(color ?? '#9c9c9c');
      const src = (Array.isArray(base) ? base[0] : base) as THREE.MeshLambertMaterial;
      // Bleuté et translucide : on voit que c'est « à poser », et ce qu'il y a derrière.
      m = new THREE.MeshLambertMaterial({ map: src.map, color: 0xa8d8ff, emissive: 0x2a4a6a, transparent: true, opacity: 0.6, depthWrite: false });
      ghostCache.set(k, m);
    }
    return m;
  }
  if (!texture) return tintedMaterial(color ?? '#9c9c9c');
  const glow = GLOW[texture as TextureKind];
  if (glow && !muted) {
    let m = ghostCache.get(`lit:${texture}`);
    if (!m) {
      const base = blockMaterial(texture as TextureKind);
      const src = (Array.isArray(base) ? base[0] : base) as THREE.MeshLambertMaterial;
      m = new THREE.MeshLambertMaterial({ map: src.map, emissive: glow[0], emissiveIntensity: glow[1] });
      ghostCache.set(`lit:${texture}`, m);
    }
    return m;
  }
  const m = blockMaterial(texture as TextureKind, muted);
  if (!Array.isArray(m)) return m;
  // Ordre d'une BoxGeometry : +x, −x, +y (dessus), −y (dessous), +z, −z.
  return m[face === 'top' ? 2 : face === 'bottom' ? 3 : 0];
}

/** Un groupe de faces en maillage ; `surface` : une option de style du lot R1 (`?rendu=archipeo&style=…`), sinon les textures. */
export function meshOf(g: MeshGroup, surface: Surface | null = null): THREE.Mesh {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(g.positions, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(g.normals, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(g.uvs, 2));
  geo.setIndex(g.indices);
  surface?.geometry(g, geo);
  // Les blocs savent le mode « Aménager » (le lieu choisi soulevé, le geste de la pose : ./arrange.ts).
  const mesh = new THREE.Mesh(geo, surface?.material(g) ?? avecLAmenagement(materialFor(g.texture, g.face, g.color, g.ghost, g.muted)));
  if (g.ghost) mesh.renderOrder = 1;
  return trieParLaVue(mesh);
}

/**
 * Un morceau du maillage des blocs en une seule texture (world/blockMesh.ts) : un appel de dessin, quelles que soient
 * ses textures et ses couleurs.
 */
export function blockMeshOf(g: BlockChunk): THREE.Mesh {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(g.positions, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(g.normals, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(g.uvs, 2));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(g.colors, 3));
  geo.setAttribute('aLayer', new THREE.Float32BufferAttribute(g.layers, 1));
  geo.setAttribute('aGlow', new THREE.Float32BufferAttribute(g.glows, 3));
  geo.setIndex(g.indices);
  const mesh = new THREE.Mesh(geo, avecLAmenagement(blockPassMaterial(g.pass)));
  if (g.pass === 'ghost') mesh.renderOrder = 1;
  return trieParLaVue(mesh);
}

/**
 * Un maillage que Three.js ne dessine pas quand il est hors de l'écran. Un matériau sert souvent une ou deux îles : à la
 * vue d'une île, la plupart des maillages du terrain sont hors champ (6e : 182 → 96 appels, mesuré le 06/10/2026). Sa
 * sphère englobante grandit de la hauteur dont le mode « Aménager » soulève un lieu (./arrange.ts), qui déplace ses
 * sommets dans le shader. Ne pas recalculer cette sphère ensuite (computeBoundingSphere, applyMatrix4) : repasser par
 * trieParLaVue.
 */
function trieParLaVue(mesh: THREE.Mesh): THREE.Mesh {
  mesh.geometry.computeBoundingSphere();
  const sphere = mesh.geometry.boundingSphere;
  if (sphere) sphere.radius += HAUTEUR_DU_SOULEVEMENT;
  mesh.frustumCulled = true;
  return mesh;
}

/**
 * Les groupes de faces d'un modèle (personnages) en maillages : ses couleurs unies ensemble, en un seul maillage aux
 * couleurs dans les sommets (un appel de dessin au lieu d'un par couleur), le reste un maillage par groupe (`meshOf`).
 * La même image : la couleur d'une face est celle de `tintedMaterial`, sur le même grain. Avec `surface` (lot R1),
 * chaque groupe garde le sien.
 */
export function meshesOf(groups: MeshGroup[], surface: Surface | null = null): THREE.Mesh[] {
  const tints = surface ? [] : groups.filter(isPlainTint);
  const meshes = groups.filter((g) => !tints.includes(g)).map((g) => meshOf(g, surface));
  if (tints.length === 0) return meshes;
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  const color = new THREE.Color();
  for (const g of tints) {
    const base = positions.length / 3;
    // En linéaire, comme la couleur d'un matériau : la teinte ne bouge pas.
    color.set(g.color ?? '#9c9c9c');
    positions.push(...g.positions);
    normals.push(...g.normals);
    uvs.push(...g.uvs);
    for (let i = 0; i < g.positions.length / 3; i++) colors.push(color.r, color.g, color.b);
    for (const i of g.indices) indices.push(base + i);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.setIndex(indices);
  meshes.push(trieParLaVue(new THREE.Mesh(geo, avecLAmenagement(vertexTintedMaterial()))));
  return meshes;
}

/**
 * Un modèle en cubes (un personnage, le navire) en maillages : dans Blocland, en une seule texture, ses faces fondues,
 * un appel de dessin par passe (world/blockMesh.ts) ; avec `surface` (lot R1), un groupe par matériau (`meshesOf`).
 */
export function modelMeshes(cubes: VoxelCube[], surface: Surface | null = null): THREE.Mesh[] {
  if (surface) return meshesOf(buildMesh(cubes), surface);
  return buildBlockMesh(cubes, { fondre: true, morceau: Infinity }).map(blockMeshOf);
}
