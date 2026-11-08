// L'équipage dans le monde ouvert du 6e (GD-27, lot 5, piste B « ils restent là où ils ont aidé » ; GD-23, lot 4 ;
// ../../world/continu/equipageMonde.ts) : la version de loin de Zia et de Malo (`equipier-loin.glb`, 1 500 triangles,
// une image de 256), chargée à l'ouverture du monde du 6e seulement ; leurs deux images sur une seule texture (deux cases
// de 256 côte à côte), leurs sommets dans un seul maillage : un appel pour les deux. Le maillage se refait quand ceux
// qu'on montre, ou leur lieu, changent ; tant que les fichiers ne sont pas lus (hors ligne), personne. Au geste, le buste
// et le bras droit de l'équipier actif sont écrits sommet par sommet (`work`), comme ceux d'un habitant
// (./worldHabitantModels.ts, ../../world/continu/corps.ts) ; à tour de rôle avec lui, jamais ensemble.
import * as THREE from 'three';
import { loadEquipierFar } from '../../importedCharacters';
import type { ModeleTexture } from '../../world/characters/imported/glb';
import { bodyWeights, workBody, type BodyFrame, type BodyWeights } from '../../world/continu/corps';
import { equipierModelName, type Equipier } from '../../world/continu/equipage';
import { EQUIPIERS, equipierFrame, placeEquipier, type EquipierInWorld } from '../../world/continu/equipageMonde';
import type { PlaceId } from '../../world/continu/levelPlan';

/** La texture commune : une case de 256 par équipier, côte à côte. */
const CELL = 256;
/** La marge gardée au bord de chaque case (en part de la case, un pixel) : de loin, les deux images ne se mêlent pas. */
const INSET = 1 / CELL;

interface Loaded {
  equipier: Equipier;
  /** Ses sommets dans le repère du fichier, ses coordonnées dans la texture commune, ses triangles. */
  model: Float32Array;
  uvs: Float32Array;
  indices: Uint32Array;
}

interface Placed {
  equipier: Equipier;
  place: PlaceId;
  /** Ses sommets mis en place dans le monde, debout, son repère, les poids de son corps (lus une fois). */
  positions: Float32Array;
  frame: BodyFrame;
  weights?: BodyWeights;
  /** Son premier sommet dans le maillage. */
  start: number;
}

export interface WorldEquipageModels {
  /** Montre ces équipiers à leur lieu, et eux seuls ; rien ne se refait si rien n'a changé. */
  show(list: readonly EquipierInWorld[]): void;
  /** Les équipiers réellement montrés (leur modèle lu, leur lieu avec un habitant) : ceux dont la scène pose l'outil et le toucher. */
  shown(): readonly EquipierInWorld[];
  /** Le corps de l'équipier à la part `phase` de son geste (0 : au repos), s'il est montré ; celui travaillé avant revient au repos. `null` remet au repos. */
  work(equipier: Equipier | null, phase: number): void;
  /** Le repère de l'équipier montré, pour le toucher ; rien s'il n'est pas montré. */
  frameOf(equipier: Equipier): BodyFrame | null;
  readonly mesh: THREE.Mesh;
  dispose(): void;
}

/** L'image d'un modèle, décodée telle qu'elle est (la convention de glTF : pas de retournement). */
const decode = (image: ModeleTexture['image']) => createImageBitmap(new Blob([image.bytes], { type: image.mimeType }), { imageOrientation: 'none', premultiplyAlpha: 'none', colorSpaceConversion: 'none' });

/** Une coordonnée de texture du modèle (de 0 à 1) ramenée dans sa case, sans le bord. */
const inset = (t: number) => INSET + Math.min(1, Math.max(0, t)) * (1 - 2 * INSET);

/**
 * L'équipage du 6e dans le monde : `enabled`, le niveau est le 6e (ailleurs, rien n'est chargé, le maillage reste vide) ;
 * `prepare` (le rendu) envoie la texture commune à la carte graphique dès qu'elle est faite ; `ready` est appelé alors,
 * pour que la scène repose les outils et le toucher avec les équipiers enfin montrés.
 */
export function createWorldEquipageModels(scene: THREE.Scene, ground: (x: number, z: number) => number, prepare: (t: THREE.Texture) => void, enabled: boolean, ready: () => void): WorldEquipageModels {
  const loaded = new Map<Equipier, Loaded>();
  const placed = new Map<Equipier, Placed>();
  let disposed = false;
  let texture: THREE.Texture | null = null;
  let wanted: readonly EquipierInWorld[] = [];
  let shownNow: readonly EquipierInWorld[] = [];
  let key: string | null = null;
  /** L'équipier dont le corps est écrit au geste : remis au repos avant qu'un autre bouge ; aucun après `rebuild`. */
  let worked: Equipier | null = null;
  const material = new THREE.MeshLambertMaterial({ flatShading: true });
  const mesh = new THREE.Mesh(new THREE.BufferGeometry(), material);
  mesh.visible = false;
  mesh.matrixAutoUpdate = false;
  scene.add(mesh);

  const rebuild = () => {
    const list = wanted.filter((e) => loaded.has(e.equipier));
    const k = list.map((e) => `${e.equipier}@${e.place}`).join(',');
    if (k === key) return;
    key = k;
    placed.clear();
    worked = null;
    mesh.geometry.dispose();
    const geometry = new THREE.BufferGeometry();
    mesh.geometry = geometry;
    const frames: { e: EquipierInWorld; m: Loaded; frame: BodyFrame }[] = [];
    for (const e of list) {
      const m = loaded.get(e.equipier);
      const frame = m && equipierFrame(e.place, ground);
      if (m && frame) frames.push({ e, m, frame });
    }
    shownNow = texture ? frames.map((x) => x.e) : [];
    mesh.visible = shownNow.length > 0;
    if (!mesh.visible) return;
    const vertices = frames.reduce((s, x) => s + x.m.model.length / 3, 0);
    const positions = new Float32Array(vertices * 3);
    const uvs = new Float32Array(vertices * 2);
    const indices = new (vertices <= 65536 ? Uint16Array : Uint32Array)(frames.reduce((s, x) => s + x.m.indices.length, 0));
    let v = 0;
    let n = 0;
    for (const { e, m, frame } of frames) {
      const at = placeEquipier(m.model, frame);
      positions.set(at, v * 3);
      uvs.set(m.uvs, v * 2);
      for (const i of m.indices) indices[n++] = i + v;
      placed.set(e.equipier, { equipier: e.equipier, place: e.place, positions: at, frame, start: v });
      v += m.model.length / 3;
    }
    // Le buste et le bras de l'équipier actif sont réécrits à chaque image.
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
    geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    geometry.computeBoundingSphere();
  };

  if (enabled)
    void (async () => {
      const models = await Promise.all(EQUIPIERS.map((e) => loadEquipierFar(equipierModelName(e))));
      if (disposed) return;
      const canvas = document.createElement('canvas');
      canvas.width = EQUIPIERS.length * CELL;
      canvas.height = CELL;
      const g = canvas.getContext('2d');
      if (!g) return;
      for (const [i, m] of models.entries()) {
        if (!m) continue;
        try {
          const bitmap = await decode(m.image);
          if (disposed) {
            bitmap.close();
            return;
          }
          g.drawImage(bitmap, i * CELL, 0, CELL, CELL);
          bitmap.close();
          // Sa case dans la texture commune (la convention de glTF : v vers le bas de l'image, comme les lignes du canevas).
          const uvs = new Float32Array(m.uvs.length);
          for (let k = 0; k < uvs.length; k += 2) {
            uvs[k] = (i + inset(m.uvs[k])) / EQUIPIERS.length;
            uvs[k + 1] = inset(m.uvs[k + 1]);
          }
          loaded.set(EQUIPIERS[i], { equipier: EQUIPIERS[i], model: m.positions, uvs, indices: m.indices });
        } catch {
          // Une image qui ne se décode pas : cet équipier n'est pas montré dans le monde.
        }
      }
      if (disposed || !loaded.size) return;
      texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.flipY = false;
      material.map = texture;
      material.needsUpdate = true;
      prepare(texture);
      key = null;
      rebuild();
      ready();
    })();

  /** Le corps d'un équipier montré, écrit à la part `at` de son geste dans le tampon des positions. */
  const write = (p: Placed, at: number) => {
    const attr = mesh.geometry.getAttribute('position') as THREE.BufferAttribute;
    workBody(p.positions, attr.array as Float32Array, p.start * 3, p.frame, (p.weights ??= bodyWeights(p.positions, p.frame)), at);
    attr.addUpdateRange(p.start * 3, p.positions.length);
    attr.needsUpdate = true;
  };

  return {
    mesh,
    show(list) {
      wanted = list;
      rebuild();
    },
    shown: () => shownNow,
    work(equipier, phase) {
      // Un maillage caché est refait du repos à son prochain `rebuild` : rien à remettre.
      if (!mesh.visible) return;
      if (worked && worked !== equipier) {
        const q = placed.get(worked);
        if (q) write(q, 0);
        worked = null;
      }
      if (!equipier) return;
      const p = placed.get(equipier);
      if (!p) return;
      write(p, phase);
      worked = phase > 0 ? equipier : null;
    },
    frameOf: (equipier) => placed.get(equipier)?.frame ?? null,
    dispose() {
      disposed = true;
      scene.remove(mesh);
      mesh.geometry.dispose();
      material.dispose();
      texture?.dispose();
    },
  };
}
