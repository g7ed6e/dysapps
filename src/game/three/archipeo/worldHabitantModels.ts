// Les habitants près de leur porte, hors de leur scénette (choix du mainteneur, 23 octobre 2026 : en modèle 3D, aux quatre
// niveaux ; ../../world/continu/worldHabitants.ts), dans la vue du monde ouvert : la version de loin de chaque habitant du
// niveau (`habitant-loin.glb`, 1 500 triangles, une image de 256), chargée à l'ouverture du monde ; leurs images réunies
// sur une seule texture (quatre sur quatre, 1 024 de côté, environ 5 Mo dans la carte graphique), leurs sommets dans un
// seul maillage : un appel pour tous. Le maillage se refait quand ceux qu'on montre changent (une scénette ouverte, une
// terre fermée, la Carte, un lieu sorti de la ruine) ; tant que les fichiers ne sont pas lus (hors ligne, un niveau
// jamais ouvert), personne. Le corps qui travaille (GD-27, lot 5, piste B ; ../../world/continu/corps.ts) : dans la
// ruine, l'habitant est assis (ses sommets déformés une fois, au maillage) ; au geste, le buste et le bras droit de
// l'habitant actif sont écrits sommet par sommet dans le tampon des positions (`work`), comme la pièce mobile de son outil.
import * as THREE from 'three';
import { loadHabitantFar } from '../../importedCharacters';
import type { ModeleTexture } from '../../world/characters/imported/glb';
import { bodyWeights, seatedBody, workBody, type BodyFrame, type BodyWeights } from '../../world/continu/corps';
import { habitantModelName } from '../../world/continu/habitants';
import type { PlaceId, ScenePlaceId } from '../../world/continu/levelPlan';
import { WORLD_HABITANTS_PER_LEVEL_MAX, hasWorldHabitant, placeWorldHabitant, worldHabitantAt, worldHabitantHeight, worldHabitantYaw } from '../../world/continu/worldHabitants';

/** La texture commune : tant de cases de côté, de tant de pixels. */
const ATLAS = { cells: Math.sqrt(WORLD_HABITANTS_PER_LEVEL_MAX), cell: 256 } as const;
/** La marge gardée au bord de chaque case (en part de la case, un pixel) : de loin, les petites images de la texture ne mêlent pas deux habitants voisins. */
const INSET = 1 / ATLAS.cell;

interface Placed {
  place: ScenePlaceId;
  /** Ses sommets mis en place dans le monde, debout (trois nombres chacun), ses coordonnées dans la texture commune, ses triangles. */
  positions: Float32Array;
  uvs: Float32Array;
  indices: Uint32Array;
  /** Son repère dans le monde, les poids de son corps (lus une fois) et ses sommets assis (faits une fois). */
  frame: BodyFrame;
  weights?: BodyWeights;
  seated?: Float32Array;
}

export interface WorldHabitantModels {
  /** Montre les habitants de ces lieux, et eux seuls, assis ceux dont `seated` dit vrai (la ruine) ; rien ne se refait si rien n'a changé. */
  show(places: readonly PlaceId[], seated?: (place: PlaceId) => boolean): void;
  /** Le corps de l'habitant de `place` à la part `phase` de son geste (0 : au repos), s'il est montré debout. */
  work(place: ScenePlaceId, phase: number): void;
  readonly mesh: THREE.Mesh;
  dispose(): void;
}

/** L'image d'un modèle, décodée telle qu'elle est (la convention de glTF : pas de retournement). */
const decode = (image: ModeleTexture['image']) => createImageBitmap(new Blob([image.bytes], { type: image.mimeType }), { imageOrientation: 'none', premultiplyAlpha: 'none', colorSpaceConversion: 'none' });

/** Une coordonnée de texture du modèle (de 0 à 1) ramenée dans sa case, sans le bord. */
const inset = (t: number) => INSET + Math.min(1, Math.max(0, t)) * (1 - 2 * INSET);

/** Un modèle à sa place près de sa porte (../../world/continu/worldHabitants.ts), dans sa case `cell` de la texture commune. */
function placeModel(place: PlaceId, m: ModeleTexture, cell: number, ground: (x: number, z: number) => number): Placed | null {
  const positions = placeWorldHabitant(place, m.positions, ground);
  const at = worldHabitantAt(place, ground);
  if (!positions || !at || !hasWorldHabitant(place)) return null;
  // Sa case dans la texture commune (la convention de glTF : v vers le bas de l'image, comme les lignes du canevas), sans
  // son bord d'un pixel.
  const [u0, v0] = [cell % ATLAS.cells, Math.floor(cell / ATLAS.cells)];
  const uvs = new Float32Array(m.uvs.length);
  for (let i = 0; i < uvs.length; i += 2) {
    uvs[i] = (u0 + inset(m.uvs[i])) / ATLAS.cells;
    uvs[i + 1] = (v0 + inset(m.uvs[i + 1])) / ATLAS.cells;
  }
  return { place, positions, uvs, indices: m.indices, frame: { at, yaw: worldHabitantYaw(place), height: worldHabitantHeight(place) } };
}

/**
 * Les habitants d'un niveau près de leur porte : `places`, les lieux du niveau ; `prepare` (le rendu) envoie la texture
 * commune à la carte graphique dès qu'elle est faite.
 */
export function createWorldHabitantModels(scene: THREE.Scene, places: readonly PlaceId[], ground: (x: number, z: number) => number, prepare: (t: THREE.Texture) => void): WorldHabitantModels {
  const shown = places.filter(hasWorldHabitant).slice(0, WORLD_HABITANTS_PER_LEVEL_MAX);
  const placed = new Map<PlaceId, Placed>();
  let disposed = false;
  let texture: THREE.Texture | null = null;
  let wanted: readonly PlaceId[] = [];
  let seatedOf: (place: PlaceId) => boolean = () => false;
  /** Les sommets de chaque habitant montré debout dans le maillage : son premier sommet et leur nombre. */
  const ranges = new Map<ScenePlaceId, { start: number; count: number }>();
  let key: string | null = null;
  const material = new THREE.MeshLambertMaterial({ flatShading: true });
  const mesh = new THREE.Mesh(new THREE.BufferGeometry(), material);
  mesh.visible = false;
  mesh.matrixAutoUpdate = false;
  scene.add(mesh);

  const rebuild = () => {
    const list = wanted.map((p) => placed.get(p)).filter((p): p is Placed => Boolean(p));
    const k = list.map((p) => `${p.place}${seatedOf(p.place) ? '-' : ''}`).join(',');
    if (k === key) return;
    key = k;
    ranges.clear();
    mesh.geometry.dispose();
    const geometry = new THREE.BufferGeometry();
    mesh.geometry = geometry;
    mesh.visible = list.length > 0 && texture !== null;
    if (!mesh.visible) return;
    const vertices = list.reduce((s, p) => s + p.positions.length / 3, 0);
    const positions = new Float32Array(vertices * 3);
    const uvs = new Float32Array(vertices * 2);
    const indices = new (vertices <= 65536 ? Uint16Array : Uint32Array)(list.reduce((s, p) => s + p.indices.length, 0));
    let v = 0;
    let n = 0;
    for (const p of list) {
      if (seatedOf(p.place)) positions.set((p.seated ??= seatedBody(p.positions, p.frame)), v * 3);
      else {
        positions.set(p.positions, v * 3);
        ranges.set(p.place, { start: v, count: p.positions.length / 3 });
      }
      uvs.set(p.uvs, v * 2);
      for (const i of p.indices) indices[n++] = i + v;
      v += p.positions.length / 3;
    }
    // Le buste et le bras de l'habitant actif sont réécrits à chaque image.
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
    geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    geometry.computeBoundingSphere();
  };

  void (async () => {
    const loaded = await Promise.all(shown.map((p) => loadHabitantFar(habitantModelName(p))));
    if (disposed) return;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = ATLAS.cells * ATLAS.cell;
    const g = canvas.getContext('2d');
    if (!g) return;
    for (const [i, m] of loaded.entries()) {
      if (!m) continue;
      try {
        const bitmap = await decode(m.image);
        if (disposed) {
          bitmap.close();
          return;
        }
        g.drawImage(bitmap, (i % ATLAS.cells) * ATLAS.cell, Math.floor(i / ATLAS.cells) * ATLAS.cell, ATLAS.cell, ATLAS.cell);
        bitmap.close();
        const p = placeModel(shown[i], m, i, ground);
        if (p) placed.set(shown[i], p);
      } catch {
        // Une image qui ne se décode pas : cet habitant n'est pas montré près de sa porte.
      }
    }
    if (disposed || !placed.size) return;
    texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.flipY = false;
    material.map = texture;
    material.needsUpdate = true;
    prepare(texture);
    key = null;
    rebuild();
  })();

  return {
    mesh,
    show(list, seated = () => false) {
      wanted = list;
      seatedOf = seated;
      rebuild();
    },
    work(place, phase) {
      const p = placed.get(place);
      const range = ranges.get(place);
      if (!p || !range || !mesh.visible) return;
      const attr = mesh.geometry.getAttribute('position') as THREE.BufferAttribute;
      workBody(p.positions, attr.array as Float32Array, range.start * 3, p.frame, (p.weights ??= bodyWeights(p.positions, p.frame)), phase);
      attr.addUpdateRange(range.start * 3, range.count * 3);
      attr.needsUpdate = true;
    },
    dispose() {
      disposed = true;
      scene.remove(mesh);
      mesh.geometry.dispose();
      material.dispose();
      texture?.dispose();
    },
  };
}
