// L'équipier qui guide une scénette (GD-23, lot 1), dans la vue du monde ouvert : le fichier de Zia ou de Malo, chargé
// quand on approche d'un lieu qu'il guide ou quand sa scénette s'ouvre (../../importedCharacters.ts, `loadEquipier`), son
// image décodée hors du fil principal, un maillage texturé, ombré en facettes, sous la lumière du monde, comme les
// habitants (./habitantModels.ts). Les deux modèles, une fois prêts, restent gardés (deux images de 1024, environ 5 Mo
// chacune dans la carte graphique). Tant que le modèle n'est pas prêt (ou hors ligne, ou illisible), rien : Kéo est seul,
// et le modèle qui arrive pendant la scénette s'y montre aussitôt. Un modèle manqué ne se redemande qu'après `RELANCE_MS`.
import * as THREE from 'three';
import { loadEquipier, RELANCE_MS } from '../../importedCharacters';
import type { ModeleTexture } from '../../world/characters/imported/glb';
import { EQUIPIER_HEIGHT, equipierModelName, type Equipier } from '../../world/continu/equipage';
import { habitantFit } from '../../world/continu/habitants';
import type { Vec3 } from '../../world/continu/geometry';

interface Ready {
  equipier: Equipier;
  scale: number;
  geometry: THREE.BufferGeometry;
  texture: THREE.Texture;
  material: THREE.MeshLambertMaterial;
}

export interface EquipierModels {
  /** Prépare le modèle d'un équipier (sans rien montrer). */
  prefetch(equipier: Equipier): void;
  /** L'équipier posé en `at` (ses pieds), tourné de `yaw` : montré s'il est prêt, sinon dès qu'il l'est. */
  show(equipier: Equipier, at: Vec3, yaw: number): void;
  /** La scénette se ferme : l'équipier s'efface (gardé, prêt pour un retour). */
  hide(): void;
  /** Le maillage de l'équipier (caché quand aucun n'est montré). */
  readonly mesh: THREE.Mesh<THREE.BufferGeometry, THREE.Material>;
  dispose(): void;
}

/** L'image d'un modèle, décodée telle qu'elle est (la convention de glTF : pas de retournement). */
async function decode(image: ModeleTexture['image']): Promise<ImageBitmap> {
  return createImageBitmap(new Blob([image.bytes], { type: image.mimeType }), { imageOrientation: 'none', premultiplyAlpha: 'none', colorSpaceConversion: 'none' });
}

/**
 * Les modèles des équipiers : un seul maillage dans la scène, qui prend la géométrie et le matériau de l'équipier montré ;
 * `prepare` (le rendu) envoie la texture à la carte graphique dès qu'elle est décodée, avant la scénette.
 */
export function createEquipierModels(scene: THREE.Scene, prepare: (t: THREE.Texture) => void): EquipierModels {
  const ready = new Map<Equipier, Ready>();
  const pending = new Set<Equipier>();
  const failed = new Map<Equipier, number>();
  let disposed = false;
  // Ce que la scénette ouverte attend de montrer (l'équipier, ses pieds, son cap), ou rien.
  let wanted: { equipier: Equipier; at: Vec3; yaw: number } | null = null;
  const empty = new THREE.BufferGeometry();
  const none = new THREE.MeshBasicMaterial();
  const mesh = new THREE.Mesh<THREE.BufferGeometry, THREE.Material>(empty, none);
  mesh.visible = false;
  mesh.matrixAutoUpdate = false;
  scene.add(mesh);

  const place = () => {
    const r = wanted ? ready.get(wanted.equipier) : undefined;
    if (!wanted || !r) {
      mesh.visible = false;
      return;
    }
    mesh.geometry = r.geometry;
    mesh.material = r.material;
    mesh.position.set(wanted.at.x, wanted.at.y, wanted.at.z);
    mesh.rotation.set(0, wanted.yaw, 0);
    mesh.scale.setScalar(r.scale);
    mesh.updateMatrix();
    mesh.visible = true;
  };

  const build = (equipier: Equipier, m: ModeleTexture, bitmap: ImageBitmap): Ready => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(m.positions, 3));
    geometry.setAttribute('uv', new THREE.BufferAttribute(m.uvs, 2));
    geometry.setIndex(new THREE.BufferAttribute(m.positions.length / 3 <= 65536 ? Uint16Array.from(m.indices) : m.indices, 1));
    // Les pieds à l'origine, centré sur ses jambes, à la hauteur de Kéo dans la scénette (l'échelle, celle du maillage).
    const fit = habitantFit(m.positions, EQUIPIER_HEIGHT);
    geometry.translate(-fit.center.x, -fit.center.y, -fit.center.z);
    geometry.computeBoundingSphere();
    const texture = new THREE.Texture(bitmap);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.flipY = false;
    texture.needsUpdate = true;
    const material = new THREE.MeshLambertMaterial({ map: texture, flatShading: true });
    return { equipier, scale: fit.scale, geometry, texture, material };
  };

  const prefetch = (equipier: Equipier) => {
    if (disposed || pending.has(equipier) || ready.has(equipier)) return;
    const missed = failed.get(equipier);
    if (missed !== undefined && performance.now() - missed < RELANCE_MS) return;
    failed.delete(equipier);
    pending.add(equipier);
    void (async () => {
      try {
        const m = await loadEquipier(equipierModelName(equipier));
        if (disposed) return;
        if (!m) {
          failed.set(equipier, performance.now());
          return;
        }
        const bitmap = await decode(m.image);
        if (disposed) {
          bitmap.close();
          return;
        }
        const r = build(equipier, m, bitmap);
        prepare(r.texture);
        ready.set(equipier, r);
        // Arrivé pendant sa scénette : il s'y montre (il est immobile, rien ne dépend de lui).
        if (wanted?.equipier === equipier) place();
      } catch {
        failed.set(equipier, performance.now());
      } finally {
        pending.delete(equipier);
      }
    })();
  };

  return {
    mesh,
    prefetch,
    show(equipier, at, yaw) {
      wanted = { equipier, at: { ...at }, yaw };
      place();
      if (!ready.has(equipier)) prefetch(equipier);
    },
    hide() {
      wanted = null;
      mesh.visible = false;
    },
    dispose() {
      disposed = true;
      wanted = null;
      scene.remove(mesh);
      mesh.geometry = empty;
      mesh.material = none;
      for (const r of ready.values()) {
        r.geometry.dispose();
        r.material.dispose();
        r.texture.dispose();
        (r.texture.image as ImageBitmap | undefined)?.close?.();
      }
      ready.clear();
      empty.dispose();
      none.dispose();
    },
  };
}
