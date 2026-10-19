// Les habitants des scénettes en modèles 3D (choix du mainteneur, 18 octobre 2026), dans la vue du monde ouvert : le
// fichier de l'habitant d'un lieu, chargé quand on approche du lieu (son panneau s'ouvre) ou quand sa scénette s'ouvre,
// jamais les seize d'un coup (../../importedCharacters.ts, `loadHabitant`) ; son image décodée hors du fil principal
// (`createImageBitmap`, sans adresse blob:, que la politique de sécurité refuse) ; un maillage texturé, ombré en facettes,
// sous la lumière du monde. Au plus deux modèles gardés (le lieu approché et celui de la scénette) : une texture de 2048
// pèse environ 22 Mo dans la carte graphique, le plus ancien est libéré avant d'en faire un troisième. Un lieu dont le
// modèle a manqué (fichier absent, image indécodable) ne se redemande qu'après `RELANCE_MS`. Tant que le modèle d'un lieu n'est pas prêt à
// l'entrée de sa scénette (ou hors ligne, ou illisible), le pion dessiné en code reste ; le modèle qui arrive pendant la
// scénette est dit à la vue (`onReady`), qui le montre là où rien ne dépend encore du pion (une remise).
import * as THREE from 'three';
import { loadHabitant, RELANCE_MS } from '../../importedCharacters';
import type { ModeleTexture } from '../../world/characters/imported/glb';
import { forgetHabitant, habitantFit, habitantModelName, registerHabitant, type HabitantFit } from '../../world/continu/habitants';
import type { PlaceId } from '../../world/continu/levelPlan';

/** Combien de modèles prêts la vue garde (le lieu approché, et celui de la scénette ouverte). */
const KEPT = 2;

interface Ready {
  place: PlaceId;
  /** Les sommets du fichier, pour le registre du décor de près (../../world/continu/habitants.ts). */
  positions: Float32Array;
  fit: HabitantFit;
  geometry: THREE.BufferGeometry;
  texture: THREE.Texture;
  material: THREE.MeshLambertMaterial;
}

export interface HabitantModels {
  /** Prépare le modèle d'un lieu (sans rien montrer) : son fichier, son image décodée, son maillage. */
  prefetch(place: PlaceId): void;
  /**
   * À l'entrée de la scénette d'un lieu, l'habitant posé en `at` (ses pieds) : son modèle s'il est prêt (le décor de près
   * se fait alors sans le pion), sinon rien (le pion reste) ; à appeler avant de faire le décor.
   */
  show(place: PlaceId, at: { x: number; y: number; z: number }): boolean;
  /** La scénette se ferme : le modèle s'efface (gardé, prêt pour un retour). */
  hide(): void;
  /** Le maillage de l'habitant (caché quand aucun modèle n'est montré). */
  readonly mesh: THREE.Mesh<THREE.BufferGeometry, THREE.Material>;
  dispose(): void;
}

/** L'image d'un modèle, décodée telle qu'elle est (la convention de glTF : pas de retournement). */
async function decode(image: ModeleTexture['image']): Promise<ImageBitmap> {
  return createImageBitmap(new Blob([image.bytes], { type: image.mimeType }), { imageOrientation: 'none', premultiplyAlpha: 'none', colorSpaceConversion: 'none' });
}

/**
 * Les modèles des habitants : un seul maillage dans la scène, qui prend la géométrie et le matériau du lieu montré ;
 * `prepare` (le rendu) envoie la texture à la carte graphique dès qu'elle est décodée, avant la scénette.
 */
export function createHabitantModels(scene: THREE.Scene, prepare: (t: THREE.Texture) => void, onReady?: (place: PlaceId) => void): HabitantModels {
  const ready: Ready[] = [];
  const pending = new Set<PlaceId>();
  let disposed = false;
  let current: PlaceId | null = null;
  // Le maillage, vide tant qu'aucun modèle n'est montré (sa géométrie et son matériau d'attente, libérés à la fin).
  const empty = new THREE.BufferGeometry();
  const none = new THREE.MeshBasicMaterial();
  const mesh = new THREE.Mesh<THREE.BufferGeometry, THREE.Material>(empty, none);
  mesh.visible = false;
  mesh.matrixAutoUpdate = false;
  scene.add(mesh);

  const release = (r: Ready) => {
    r.geometry.dispose();
    r.material.dispose();
    r.texture.dispose();
    (r.texture.image as ImageBitmap | undefined)?.close?.();
  };

  const build = (place: PlaceId, m: ModeleTexture, bitmap: ImageBitmap): Ready => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(m.positions, 3));
    geometry.setAttribute('uv', new THREE.BufferAttribute(m.uvs, 2));
    geometry.setIndex(new THREE.BufferAttribute(m.positions.length / 3 <= 65536 ? Uint16Array.from(m.indices) : m.indices, 1));
    const fit = habitantFit(m.positions);
    // Les pieds à l'origine, centré sur ses jambes : la mise en place du registre, sans l'échelle ni le cap (ceux du maillage).
    geometry.translate(-fit.center.x, -fit.center.y, -fit.center.z);
    geometry.computeBoundingSphere();
    const texture = new THREE.Texture(bitmap);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.flipY = false;
    texture.needsUpdate = true;
    // À facettes plates (le fichier n'a pas de normales), sous la lumière du monde, dans sa brume.
    const material = new THREE.MeshLambertMaterial({ map: texture, flatShading: true });
    return { place, positions: m.positions, fit, geometry, texture, material };
  };

  /** La place d'un modèle de plus : les plus anciens libérés tant qu'il y en a `KEPT`, jamais celui de la scénette ouverte. */
  const makeRoom = () => {
    while (ready.length >= KEPT) {
      const i = ready.findIndex((x) => x.place !== current);
      if (i < 0) return;
      release(ready.splice(i, 1)[0]);
    }
  };
  /** Quand le modèle d'un lieu a manqué (le lieu, l'instant) : il n'est redemandé qu'après `RELANCE_MS`. */
  const failed = new Map<PlaceId, number>();

  const prefetch = (place: PlaceId) => {
    if (disposed || pending.has(place) || ready.some((r) => r.place === place)) return;
    const missed = failed.get(place);
    if (missed !== undefined && performance.now() - missed < RELANCE_MS) return;
    failed.delete(place);
    pending.add(place);
    void (async () => {
      try {
        const m = await loadHabitant(habitantModelName(place));
        if (disposed) return;
        if (!m) {
          failed.set(place, performance.now());
          return;
        }
        const bitmap = await decode(m.image);
        if (disposed) {
          bitmap.close();
          return;
        }
        // La place d'abord, puis le modèle : jamais trois textures à la fois.
        makeRoom();
        const r = build(place, m, bitmap);
        prepare(r.texture);
        ready.push(r);
        // Arrivé après l'entrée de la scénette de son lieu (le pion montré) : la vue décide de le montrer.
        if (current === place && !mesh.visible) onReady?.(place);
      } catch {
        // Une image qui ne se décode pas (navigateur trop ancien) : le pion reste, et le fichier n'est pas relu à chaque
        // ouverture du panneau du lieu.
        failed.set(place, performance.now());
      } finally {
        pending.delete(place);
      }
    })();
  };

  return {
    mesh,
    prefetch,
    show(place, at) {
      current = place;
      const r = ready.find((x) => x.place === place);
      if (!r) {
        forgetHabitant(place);
        mesh.visible = false;
        prefetch(place);
        return false;
      }
      registerHabitant(place, r.positions);
      mesh.geometry = r.geometry;
      mesh.material = r.material;
      mesh.position.set(at.x, at.y, at.z);
      mesh.rotation.set(0, r.fit.yaw, 0);
      mesh.scale.setScalar(r.fit.scale);
      mesh.updateMatrix();
      mesh.visible = true;
      return true;
    },
    hide() {
      if (current) forgetHabitant(current);
      current = null;
      mesh.visible = false;
    },
    dispose() {
      disposed = true;
      if (current) forgetHabitant(current);
      current = null;
      scene.remove(mesh);
      mesh.geometry = empty;
      mesh.material = none;
      for (const r of ready.splice(0)) release(r);
      empty.dispose();
      none.dispose();
    },
  };
}
