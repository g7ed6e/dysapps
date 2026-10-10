// La lueur des lanternes allumées de Blocland, la nuit (GD-10, le phare du large fini) : la peau et les flaques de
// world/lanternGlow.ts en un maillage, et un halo par lanterne (un sprite face à la caméra), sur le dégradé radial des
// nappes de brume (./meshes.ts, `mistTexture`) teinté de la lueur des fenêtres (`LUEUR`). Sans lumière ni brouillard :
// une source de lumière se voit de loin. De jour, rien n'est dessiné (aucun appel) ; l'opacité suit le degré de nuit à
// chaque changement de lumière (chaque minute au plus, figée avec « Réduire les animations ») : rien ne bouge image par
// image, ni faisceau, ni clignotement, ni pulsation.
import * as THREE from 'three';
import type { VoxelCube } from '../world/cube';
import { LUEUR } from '../world/construction';
import { lueursDesLanternes, OPACITE_DU_HALO } from '../world/lanternGlow';
import type { Lumiere } from './light';
import { mistTexture } from './meshes';

/** Dessinées après la mer, les nappes et les fantômes (transparents eux aussi). */
const ORDRE = 3;

export interface LueursEnTroisD {
  /** Les cubes du terrain : les lueurs de leurs blocs allumés, refaites seulement si ces blocs changent. */
  poser(cubes: readonly VoxelCube[]): void;
  dispose(): void;
}

/** `eau` : la hauteur de l'eau (repère de Three), ou `null` sans mer. */
export function creerLueurs(scene: THREE.Scene, lumiere: Lumiere, eau: number | null): LueursEnTroisD {
  const group = new THREE.Group();
  group.matrixAutoUpdate = false;
  scene.add(group);
  const degrade = mistTexture();
  const lueur = new THREE.Color(LUEUR);
  const mat = new THREE.MeshBasicMaterial({ map: degrade, color: lueur, vertexColors: true, transparent: true, depthWrite: false, fog: false, opacity: 0 });
  // Le halo s'ajoute à ce qu'il y a derrière (une lumière éclaircit, jamais ne voile) : chaud sur la nuit bleue.
  const matHalo = new THREE.SpriteMaterial({ map: degrade, color: lueur, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, opacity: 0 });
  let signature = '';
  let nuit = 0;
  const peindre = () => {
    mat.opacity = nuit;
    matHalo.opacity = nuit * OPACITE_DU_HALO;
    // De jour, rien n'est dessiné.
    group.visible = nuit > 0.01;
  };
  lumiere.suivre((jour) => {
    nuit = Math.min(1, Math.max(0, 1 - jour));
    peindre();
  });
  const vider = () => {
    for (const child of [...group.children]) {
      group.remove(child);
      if (child instanceof THREE.Mesh) child.geometry.dispose();
    }
  };
  return {
    poser(cubes) {
      let s = '';
      for (const c of cubes) if (c.lit && !c.ghost && !c.muted) s += `${c.x},${c.y},${c.z};`;
      if (s === signature) return;
      signature = s;
      vider();
      const l = s ? lueursDesLanternes(cubes, eau) : null;
      if (!l) return;
      if (l.indices.length) {
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(l.positions, 3));
        geo.setAttribute('uv', new THREE.Float32BufferAttribute(l.uvs, 2));
        geo.setAttribute('color', new THREE.Float32BufferAttribute(l.colors, 4));
        geo.setIndex(l.indices);
        geo.computeBoundingSphere();
        const mesh = new THREE.Mesh(geo, mat);
        mesh.renderOrder = ORDRE;
        mesh.matrixAutoUpdate = false;
        // Une lueur ne se touche pas : le toucher va au phare, à la galerie ou à l'eau dessous.
        mesh.raycast = () => {};
        group.add(mesh);
      }
      for (const h of l.halos) {
        const halo = new THREE.Sprite(matHalo);
        halo.position.set(...h.centre);
        halo.scale.set(h.cote, h.cote, 1);
        halo.updateMatrix();
        halo.matrixAutoUpdate = false;
        halo.renderOrder = ORDRE + 1;
        halo.raycast = () => {};
        group.add(halo);
      }
      group.updateMatrixWorld(true);
      peindre();
    },
    dispose() {
      vider();
      scene.remove(group);
      mat.dispose();
      matHalo.dispose();
      degrade?.dispose();
    },
  };
}
