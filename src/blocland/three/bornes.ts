// Les repères de la scène 3D : la flèche « Commence ici », le fanion du bonhomme sur la Carte (« tu es ici »), les
// balises du chemin à construire et les repères des bornes de mission : les étoiles gagnées et, dans Archipéo, le
// losange à faire (dans Blocland, le losange est l'un des signes des objets touchables : ./affordance.ts).
import * as THREE from 'three';
import { formeDuPilier, type Pilier } from '../world/construction';
import { DELAVE } from '../world/decor/pinceau';
import type { ArchipelagoId } from '../world/map';
import { sautDuSigne, SIGNE } from '../world/affordance';
import { islandCenter } from '../world/terrain';
import { estUnOuvrage, type EnCasesDuMonde } from '../world/view';
import type { BiomeId } from '../biomes';
import { creerTraceSuggere } from './traceSuggere';
import type { Instant, Monde, PartieDeLaScene } from './partie';

/** Un point du monde de la scène 3D : `x` et `y` sur la grille, `z` la hauteur. */
export interface Pointe {
  x: number;
  y: number;
  z: number;
}

/**
 * Ce que montre la flèche « Commence ici » (la Carte la remplace par sa flèche), lu par les étiquettes et le cadrage de
 * la Carte : `posee`, elle a été posée au moins une fois ; `on`, elle montre quelque chose ; `island`, l'île ;
 * `ouvrage`, l'ouvrage (GD-7), `depuis`, son île de départ et `arrivee`, l'île d'en face ; `pointe`, le point du monde
 * où la flèche de la Carte pose sa pointe ; `pointes`, sur un ouvrage, ses places le long de la liaison (la première
 * est `pointe`), où elle glisse si une étiquette occupe sa place ; `trace`, les cases de sa liaison, de bout en bout,
 * que les étiquettes évitent si elles peuvent (three/etiquettes.ts).
 */
export interface DonneesDeLaFleche {
  posee: boolean;
  on: boolean;
  island: BiomeId | null;
  ouvrage: string | null;
  depuis: BiomeId | null;
  arrivee: BiomeId | null;
  pointe: Pointe | null;
  pointes: Pointe[] | null;
  trace: Pointe[] | null;
}

export interface Bornes extends PartieDeLaScene {
  /** La flèche « Commence ici » : sa place ; ce qu'elle montre : `donneesDeLaFleche`. */
  fleche: THREE.Group;
  /** Ce que montre la flèche (à lire, pas à modifier : `poserLaFleche` le tient). */
  donneesDeLaFleche(): Readonly<DonneesDeLaFleche>;
  /** Les repères des bornes de mission (on les touche). */
  missions: THREE.Group;
  poserLaFleche(marker: EnCasesDuMonde['marker']): void;
  /**
   * Les repères des bornes, posés au-dessus du sommet de chacune (`sommets`, par « île:mission » : world/affordance.ts,
   * `sommetsDesBornes` ; sans lui, trois cubes au-dessus de sa case).
   */
  poserLesMissions(quests: EnCasesDuMonde['quests'], sommets?: ReadonlyMap<string, number>): void;
  /** La pile d'étoiles d'une borne réussie fait le petit saut du toucher ; `false` si cette borne n'en a pas. */
  sauterLaPile(id: string): boolean;
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
  // Dans Blocland, le losange à faire est dessiné avec les autres signes (./affordance.ts) : ici, les étoiles seules.
  const losanges = monde.habillage.signesDesObjets === 'losanges';
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
  // Sur la Carte : un grand fanion au-dessus du bonhomme (« tu es ici », Archipéo ; Blocland a son médaillon), et des
  // balises le long d'un chemin à construire.
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
  // Sur la Carte, le tracé renforcé de l'ouvrage que désigne la flèche (GD-7) : un seul maillage, refait quand il change.
  const leTrace = creerTraceSuggere();
  scene.add(leTrace.mesh);
  const donnees: DonneesDeLaFleche = { posee: false, on: false, island: null, ouvrage: null, depuis: null, arrivee: null, pointe: null, pointes: null, trace: null };
  /** La hauteur de base de la flèche « Commence ici », d'où elle rebondit. */
  let baseDeLaFleche = 0;
  let traceSource: readonly { x: number; y: number; z: number }[] | null = null;

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
    donneesDeLaFleche: () => donnees,
    missions: questMarksGroup,
    // La flèche « Commence ici » (sur une île, ou sur une case du monde : le chantier du navire), ou sur la Carte celle
    // d'un ouvrage (sur sa liaison, côté île de départ) et le tracé renforcé de cette liaison.
    poserLaFleche: (marker) => {
      const ouvrage = estUnOuvrage(marker) ? marker : null;
      donnees.posee = true;
      donnees.island = typeof marker === 'string' ? marker : null;
      donnees.ouvrage = ouvrage?.ouvrage ?? null;
      // L'île d'où il part : la prochaine destination, dont le nom pèse sur la Carte comme celui d'une île désignée ; et
      // l'île d'en face, dont le nom pèse autant, pour se poser au bout du tracé.
      donnees.depuis = ouvrage ? (ouvrage.depuis ?? null) : null;
      donnees.arrivee = ouvrage ? (ouvrage.arrivee ?? null) : null;
      donnees.on = Boolean(marker);
      leTrace.poser(ouvrage?.tirets ?? null);
      // Refaite seulement quand la liaison change (la vue garde la même liste tant qu'elle ne change pas).
      if (traceSource !== (ouvrage?.trace ?? null)) {
        traceSource = ouvrage?.trace ?? null;
        donnees.trace = traceSource ? traceSource.map((p) => ({ x: p.x + 0.5, y: p.y + 0.5, z: p.z + 1 })) : null;
      }
      if (!marker) {
        donnees.pointe = null;
        donnees.pointes = null;
        markerGroup.visible = false;
        return;
      }
      const ile = typeof marker === 'string';
      const c = typeof marker === 'string' ? islandCenter(marker) : estUnOuvrage(marker) ? marker.cell : marker;
      const base = ile ? c.z + 8 : ouvrage ? c.z + 2 : c.z;
      // La pointe de la flèche de la Carte : au-dessus du cœur d'une île, juste au-dessus du tablier d'un ouvrage.
      donnees.pointe = ile || ouvrage ? { x: c.x + 0.5, y: c.y + 0.5, z: base } : null;
      donnees.pointes = ouvrage ? ouvrage.places.map((p) => ({ x: p.x + 0.5, y: p.y + 0.5, z: p.z + 2 })) : null;
      baseDeLaFleche = base;
      markerGroup.position.set(c.x, base + 0.5, c.y);
      markerGroup.visible = true;
    },
    // Les repères des bornes de mission : les étoiles gagnées en petits cubes d'or empilés, immobiles dans Blocland (le
    // losange d'or est seul à bouger, affordance-blocland.md §8), qui tournent lentement dans Archipéo, où un losange
    // jaune rebondit aussi (à faire). Rien sur une île fermée.
    poserLesMissions: (quests, sommets) => {
      vider(questMarksGroup);
      if (!quests?.length) return;
      const gold = markerMat;
      quests.forEach((q, i) => {
        if (q.state === 'locked' || q.state === 0 || (q.state === 'new' && !losanges)) return;
        const g = new THREE.Group();
        g.userData = { quest: q.id, phase: i * 0.7 };
        // Juste au-dessus de l'ardoise de la borne (le socle et l'ardoise : deux cubes sur le sol de sa case).
        const base = (sommets?.get(q.id) ?? q.cell.z + 3) + 0.4;
        g.userData.base = base;
        if (q.state === 'new') {
          const m = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.7), gold);
          m.rotation.x = Math.PI / 4;
          m.rotation.z = Math.PI / 4;
          g.add(m);
          g.userData.bob = true;
        } else g.add(new THREE.Mesh(pileDEtoiles(q.state), gold));
        g.position.set(q.cell.x + 0.5, base, q.cell.y + 0.5);
        questMarksGroup.add(g);
      });
    },
    // Le saut au toucher est celui des signes de Blocland : Archipéo, en pause, garde son dessin.
    sauterLaPile: (id) => {
      if (losanges) return false;
      const pile = questMarksGroup.children.find((g) => g.userData.quest === id && !g.userData.bob);
      if (!pile) return false;
      pile.userData.saut = instant.now;
      return true;
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
      // Blocland : le médaillon « toi » remplace le fanion (three/etiquettes.ts) ; Archipéo garde le fanion.
      beaconGroup.visible = instant.carte && avatar.visible && losanges;
      // Le tracé de l'ouvrage désigné : sur la Carte seulement, avec la flèche ; immobile.
      leTrace.mesh.visible = instant.carte && leTrace.pose();
      // Le mouvement réduit, une préférence du téléphone ou de la tablette (core/mouvement.ts) : le fanion, les repères de
      // mission et les balises du chemin restent dans leur pose de base, sans rotation, rebond, pulsation ni saut, comme
      // la flèche « Commence ici ».
      if (beaconGroup.visible) {
        beaconGroup.position.set(avatar.position.x, avatar.position.y + 8 + (reduit ? 0 : Math.abs(Math.sin(t * 2.2)) * 1.5), avatar.position.z);
        beaconGroup.rotation.y = reduit ? 0 : t * 0.8;
      }
      for (const mk of questMarksGroup.children) {
        if (mk.userData.bob) {
          mk.position.y = mk.userData.base + (reduit ? 0 : Math.abs(Math.sin(t * 2.4 + mk.userData.phase)) * 0.5);
          mk.rotation.y = reduit ? 0 : t * 1.2;
        } else {
          // Une pile d'étoiles touchée fait le petit saut du toucher (world/affordance.ts), puis reprend sa place. Dans
          // Blocland, elle ne tourne pas : un seul mouvement à l'écran, celui du losange d'or.
          const debut = mk.userData.saut as number | undefined;
          const ms = debut === undefined ? 0 : instant.now - debut;
          if (debut !== undefined && (reduit || ms >= SIGNE.saut.monteeMs + SIGNE.saut.descenteMs)) delete mk.userData.saut;
          mk.position.y = mk.userData.base + (reduit ? 0 : sautDuSigne(ms));
          mk.rotation.y = reduit || !losanges ? 0 : t * 0.4;
        }
      }
      if (trailGroup.children.length) {
        const pulse = reduit ? 1 : 0.85 + Math.sin(t * 3) * 0.15;
        trailGroup.scale.setScalar(1);
        for (const m of trailGroup.children) m.scale.setScalar(pulse);
      }
      if (markerGroup.visible) {
        markerGroup.position.y = baseDeLaFleche + 0.5 + (reduit ? 0 : Math.abs(Math.sin(t * 2.2)) * 0.8);
        markerGroup.rotation.y = reduit ? 0 : t * 0.8;
      }
    },
    dispose: () => {
      vider(questMarksGroup);
      vider(trailGroup);
      for (const g of [markerGroup, beaconGroup]) vider(g);
      markerMat.dispose();
      scene.remove(leTrace.mesh);
      leTrace.dispose();
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
