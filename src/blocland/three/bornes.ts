// Les repères de la scène 3D : la flèche « Commence ici », le fanion du bonhomme sur la Carte (« tu es ici »), les
// balises du chemin à construire et les repères des bornes de mission (un losange à faire, ou les étoiles gagnées).
import * as THREE from 'three';
import { islandCenter } from '../world/terrain';
import type { WorldViewProps } from '../world/view';
import type { Instant, Monde, PartieDeLaScene } from './partie';

export interface Bornes extends PartieDeLaScene {
  /** La flèche « Commence ici » : sa place et, dans `userData`, l'île qu'elle montre (la Carte la remplace par sa flèche). */
  fleche: THREE.Group;
  /** Les repères des bornes de mission (on les touche). */
  missions: THREE.Group;
  poserLaFleche(marker: WorldViewProps['marker']): void;
  poserLesMissions(quests: WorldViewProps['quests']): void;
  poserLeChemin(trail: WorldViewProps['trail']): void;
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
    // La flèche « Commence ici » (sur une île, ou sur une case du monde : le chantier du navire).
    poserLaFleche: (marker) => {
      markerGroup.userData.island = typeof marker === 'string' ? marker : null;
      markerGroup.userData.on = Boolean(marker);
      if (!marker) {
        markerGroup.visible = false;
        return;
      }
      const c = typeof marker === 'string' ? islandCenter(marker) : marker;
      const base = typeof marker === 'string' ? c.z + 8 : c.z;
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
        } else {
          for (let k = 0; k < q.state; k++) {
            const m = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.45, 0.45), gold);
            m.position.y = k * 0.6;
            m.rotation.y = Math.PI / 4;
            g.add(m);
          }
        }
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
