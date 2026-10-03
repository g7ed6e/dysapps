// Les repères de la scène 3D : la flèche « Commence ici », le fanion du bonhomme sur la Carte (« tu es ici »), les
// balises du chemin à construire et les repères des bornes de mission (un losange à faire, ou les étoiles gagnées).
import * as THREE from 'three';
import { formeDuPilier, type Pilier } from '../world/construction';
import { DELAVE } from '../world/decor/pinceau';
import type { ArchipelagoId } from '../world/map';
import { islandCenter } from '../world/terrain';
import { estUnOuvrage, type EnCasesDuMonde } from '../world/view';
import type { Instant, Monde, PartieDeLaScene } from './partie';

export interface Bornes extends PartieDeLaScene {
  /**
   * La flèche « Commence ici » : sa place et, dans `userData`, ce qu'elle montre (la Carte la remplace par sa flèche) :
   * `island`, l'île ; `ouvrage`, l'ouvrage (GD-7) ; `pointe`, la case du monde où la flèche de la Carte pose sa pointe.
   */
  fleche: THREE.Group;
  /** Les repères des bornes de mission (on les touche). */
  missions: THREE.Group;
  poserLaFleche(marker: EnCasesDuMonde['marker']): void;
  poserLesMissions(quests: EnCasesDuMonde['quests']): void;
  poserLeChemin(trail: EnCasesDuMonde['trail']): void;
}

/**
 * Les étoiles gagnées d'une borne : `n` petits cubes d'or empilés, tournés d'un huitième de tour, en une seule géométrie
 * (un appel de dessin par borne, pas un par étoile : quatre bornes de trois étoiles coûtaient douze appels).
 */
export function pileDEtoiles(n: number): THREE.BufferGeometry {
  // Un cube sans indices (36 sommets), recopié `n` fois, monté de 0,6 à chaque étoile (sans l'utilitaire de fusion de
  // Three.js, qui pèserait 4 Ko dans le paquet pour ce seul usage).
  const cube = new THREE.BoxGeometry(0.45, 0.45, 0.45).rotateY(Math.PI / 4).toNonIndexed();
  const p = cube.getAttribute('position').array as Float32Array;
  const nrm = cube.getAttribute('normal').array as Float32Array;
  const positions = new Float32Array(p.length * n);
  const normals = new Float32Array(nrm.length * n);
  for (let k = 0; k < n; k++) {
    for (let i = 0; i < p.length; i += 3) {
      positions[k * p.length + i] = p[i];
      positions[k * p.length + i + 1] = p[i + 1] + k * 0.6;
      positions[k * p.length + i + 2] = p[i + 2];
    }
    normals.set(nrm, k * nrm.length);
  }
  cube.dispose();
  const pile = new THREE.BufferGeometry();
  pile.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  pile.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  return pile;
}

/**
 * Les repères ; `bonhomme` rend le bonhomme, que le fanion surmonte (il est créé après les repères ; la fonction n'est
 * appelée qu'à l'animation).
 */
export function creerBornes(monde: Monde, bonhomme: () => THREE.Object3D, instant: Instant): Bornes {
  const { scene } = monde;
  // La flèche « Commence ici » : un chevron jaune qui flotte et pointe vers le bas.
  const markerMat = new THREE.MeshLambertMaterial({ color: 0xffc83c, emissive: 0x7a5a00, emissiveIntensity: 0.4 });
  const markerGroup = new THREE.Group();
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.9, 1.6, 4), markerMat);
  tip.rotation.x = Math.PI;
  tip.rotation.y = Math.PI / 4;
  markerGroup.add(tip);
  const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.4, 0.6), markerMat);
  shaft.position.y = 1.4;
  markerGroup.add(shaft);
  markerGroup.visible = false;
  scene.add(markerGroup);
  // Sur la Carte : un grand fanion au-dessus du bonhomme (« tu es ici »), et des balises le long d'un chemin à construire.
  const beaconGroup = new THREE.Group();
  const beaconTip = new THREE.Mesh(new THREE.ConeGeometry(4, 7, 4), markerMat);
  beaconTip.rotation.x = Math.PI;
  beaconTip.rotation.y = Math.PI / 4;
  beaconGroup.add(beaconTip);
  const beaconShaft = new THREE.Mesh(new THREE.BoxGeometry(2.2, 6, 2.2), markerMat);
  beaconShaft.position.y = 6.2;
  beaconGroup.add(beaconShaft);
  beaconGroup.visible = false;
  scene.add(beaconGroup);
  const trailGroup = new THREE.Group();
  scene.add(trailGroup);
  const questMarksGroup = new THREE.Group();
  scene.add(questMarksGroup);

  const vider = (g: THREE.Group) => {
    for (const child of [...g.children]) {
      g.remove(child);
      child.traverse((o) => {
        if (o instanceof THREE.Mesh) o.geometry.dispose();
      });
    }
  };

  return {
    fleche: markerGroup,
    missions: questMarksGroup,
    // La flèche « Commence ici » (sur une île, ou sur une case du monde : le chantier du navire), ou sur la Carte celle
    // d'un ouvrage (le milieu de sa liaison).
    poserLaFleche: (marker) => {
      const ouvrage = estUnOuvrage(marker) ? marker : null;
      markerGroup.userData.island = typeof marker === 'string' ? marker : null;
      markerGroup.userData.ouvrage = ouvrage?.ouvrage ?? null;
      markerGroup.userData.on = Boolean(marker);
      if (!marker) {
        markerGroup.userData.pointe = null;
        markerGroup.visible = false;
        return;
      }
      const ile = typeof marker === 'string';
      const c = typeof marker === 'string' ? islandCenter(marker) : estUnOuvrage(marker) ? marker.cell : marker;
      const base = ile ? c.z + 8 : ouvrage ? c.z + 2 : c.z;
      // La pointe de la flèche de la Carte : au-dessus du cœur d'une île, juste au-dessus du tablier d'un ouvrage.
      markerGroup.userData.pointe = ile || ouvrage ? { x: c.x + 0.5, y: c.y + 0.5, z: base } : null;
      markerGroup.userData.base = base;
      markerGroup.position.set(c.x, base + 0.5, c.y);
      markerGroup.visible = true;
      markerGroup.userData.on = true;
    },
    // Les repères des bornes de mission : un losange jaune qui flotte (à faire), ou les étoiles gagnées en petits cubes
    // d'or empilés. Rien sur une île fermée.
    poserLesMissions: (quests) => {
      vider(questMarksGroup);
      if (!quests?.length) return;
      const gold = markerMat;
      quests.forEach((q, i) => {
        if (q.state === 'locked' || q.state === 0) return;
        const g = new THREE.Group();
        g.userData = { quest: q.id, phase: i * 0.7 };
        const base = q.cell.z + 3.4;
        if (q.state === 'new') {
          const m = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.7), gold);
          m.rotation.x = Math.PI / 4;
          m.rotation.z = Math.PI / 4;
          g.add(m);
          g.userData.bob = true;
          g.userData.base = base;
        } else g.add(new THREE.Mesh(pileDEtoiles(q.state), gold));
        g.position.set(q.cell.x + 0.5, base, q.cell.y + 0.5);
        questMarksGroup.add(g);
      });
    },
    // Le chemin à construire (sur la Carte) : une balise toutes les trois cases, au-dessus du sol.
    poserLeChemin: (trail) => {
      vider(trailGroup);
      if (!trail?.length) return;
      trail.forEach((c, i) => {
        if (i % 3) return;
        const m = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.2, 2.2), markerMat);
        m.position.set(c.x + 0.5, c.z + 3.5, c.y + 0.5);
        m.rotation.y = Math.PI / 4;
        trailGroup.add(m);
      });
    },
    animer: (t, _dt, reduit) => {
      const avatar = bonhomme();
      beaconGroup.visible = instant.carte && avatar.visible;
      // « Réduire les animations » : le fanion, les repères de mission et les balises du chemin restent dans leur pose de
      // base, sans rotation, rebond ni pulsation, comme la flèche « Commence ici ».
      if (beaconGroup.visible) {
        beaconGroup.position.set(avatar.position.x, avatar.position.y + 8 + (reduit ? 0 : Math.abs(Math.sin(t * 2.2)) * 1.5), avatar.position.z);
        beaconGroup.rotation.y = reduit ? 0 : t * 0.8;
      }
      for (const mk of questMarksGroup.children) {
        if (mk.userData.bob) {
          mk.position.y = mk.userData.base + (reduit ? 0 : Math.abs(Math.sin(t * 2.4 + mk.userData.phase)) * 0.5);
          mk.rotation.y = reduit ? 0 : t * 1.2;
        } else mk.rotation.y = reduit ? 0 : t * 0.4;
      }
      if (trailGroup.children.length) {
        const pulse = reduit ? 1 : 0.85 + Math.sin(t * 3) * 0.15;
        trailGroup.scale.setScalar(1);
        for (const m of trailGroup.children) m.scale.setScalar(pulse);
      }
      if (markerGroup.visible) {
        markerGroup.position.y = markerGroup.userData.base + 0.5 + (reduit ? 0 : Math.abs(Math.sin(t * 2.2)) * 0.8);
        markerGroup.rotation.y = reduit ? 0 : t * 0.8;
      }
    },
    dispose: () => {
      vider(questMarksGroup);
      vider(trailGroup);
      for (const g of [markerGroup, beaconGroup]) vider(g);
      markerMat.dispose();
    },
  };
}

// ---------- Les piliers des bornes (lot R5, Archipéo) ----------

/** Les piliers des bornes de mission : une forme de pierre taillée, instanciée une fois par borne, en un appel. */
export interface Piliers {
  /** Le maillage instancié (on le touche : sa géométrie reste dans les deux cases de la borne). */
  group: THREE.Group;
  /** Pose les piliers des bornes d'un monde (les cubes `quest`). */
  poser(piliers: Pilier[]): void;
  /** Triangles dessinés (pour les mesures). */
  triangles(): number;
  dispose(): void;
}

export function creerPiliers(archipel: ArchipelagoId): Piliers {
  const group = new THREE.Group();
  const forme = formeDuPilier(archipel);
  const attributs = {
    position: new THREE.BufferAttribute(forme.positions, 3),
    normal: new THREE.BufferAttribute(forme.normals, 3),
    color: new THREE.BufferAttribute(forme.colors, 3),
  };
  const index = new THREE.BufferAttribute(Uint16Array.from(forme.indices), 1);
  // Une île fermée : la borne délavée vers le gris clair, comme le reste de l'île.
  const delave = new THREE.Color(DELAVE[0]);
  const mat = new THREE.MeshLambertMaterial({ vertexColors: true });
  mat.onBeforeCompile = (s) => {
    s.uniforms.uDelave = { value: delave };
    s.vertexShader = s.vertexShader
      .replace('#include <common>', `#include <common>\nattribute float delave;\nuniform vec3 uDelave;`)
      .replace('#include <color_vertex>', `#include <color_vertex>\nvColor.rgb = mix(vColor.rgb, uDelave, delave * ${DELAVE[1].toFixed(2)});`);
  };
  mat.customProgramCacheKey = () => 'piliers';
  let mesh: THREE.InstancedMesh | null = null;
  const vider = () => {
    if (!mesh) return;
    group.remove(mesh);
    mesh.geometry.dispose();
    mesh.dispose();
    mesh = null;
  };
  return {
    group,
    poser(piliers) {
      vider();
      if (!piliers.length) return;
      // Une géométrie par pose (la forme est partagée) : son attribut par borne, l'île fermée.
      const geo = new THREE.BufferGeometry();
      for (const [nom, a] of Object.entries(attributs)) geo.setAttribute(nom, a);
      geo.setIndex(index);
      geo.setAttribute('delave', new THREE.InstancedBufferAttribute(Float32Array.from(piliers.map((p) => (p.muted ? 1 : 0))), 1));
      const im = new THREE.InstancedMesh(geo, mat, piliers.length);
      const m = new THREE.Matrix4();
      piliers.forEach((p, i) => im.setMatrixAt(i, m.makeTranslation(p.x, p.z, p.y)));
      im.computeBoundingSphere();
      im.frustumCulled = false;
      im.userData = { borne: true };
      group.add(im);
      mesh = im;
    },
    triangles: () => (mesh ? mesh.count * (forme.indices.length / 3) : 0),
    dispose() {
      vider();
      mat.dispose();
    },
  };
}
