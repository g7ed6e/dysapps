// Les repères de la scène 3D : ce que montre la flèche de la destination (dessinée en bulle sur la Carte :
// ./labels.ts), le tracé de l'ouvrage qu'elle désigne, les balises du chemin à construire et les étoiles gagnées des
// bornes de mission (une borne à faire porte sa bulle, avec les autres signes des objets touchables : ./affordance.ts).
import * as THREE from 'three';
import { formeDuPilier, type Pilier } from '../world/construction';
import { DELAVE } from '../world/decor/brush';
import type { ArchipelagoId } from '../world/map';
import { sautDuSigne, SIGNE } from '../world/affordance';
import { islandCenter } from '../world/terrain';
import { estUnOuvrage, type EnCasesDuMonde } from '../world/view';
import type { BiomeId } from '../biomes';
import { creerTraceSuggere } from './suggestedTrace';
import type { Instant, Monde, PartieDeLaScene } from './scenePart';

/** Un point du monde de la scène 3D : `x` et `y` sur la grille, `z` la hauteur. */
export interface Pointe {
  x: number;
  y: number;
  z: number;
}

/**
 * Ce que montre la flèche de la destination (la bulle de la Carte), lu par les étiquettes et le cadrage de
 * la Carte : `on`, elle montre quelque chose ; `island`, l'île ;
 * `ouvrage`, l'ouvrage (GD-7), `depuis`, son île de départ et `arrivee`, l'île d'en face ; `pointe`, le point du monde
 * où la flèche de la Carte pose sa pointe ; `pointes`, sur un ouvrage, ses places le long de la liaison (la première
 * est `pointe`), où elle glisse si une étiquette occupe sa place ; `trace`, les cases de sa liaison, de bout en bout,
 * que les étiquettes évitent si elles peuvent (three/labels.ts).
 */
export interface DonneesDeLaFleche {
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

/** Les repères ; la borne à faire porte sa bulle (./affordance.ts) : ici, les étoiles gagnées seules. */
export function creerBornes(monde: Monde, instant: Instant): Bornes {
  const { scene } = monde;
  // L'or des étoiles gagnées et des balises du chemin.
  const markerMat = new THREE.MeshLambertMaterial({ color: 0xffc83c, emissive: 0x7a5a00, emissiveIntensity: 0.4 });
  // Sur la Carte : des balises le long d'un chemin à construire (le bonhomme porte son médaillon : three/labels.ts).
  const trailGroup = new THREE.Group();
  scene.add(trailGroup);
  const questMarksGroup = new THREE.Group();
  scene.add(questMarksGroup);
  // Sur la Carte, le tracé renforcé de l'ouvrage que désigne la flèche (GD-7) : un seul maillage, refait quand il change.
  const leTrace = creerTraceSuggere();
  scene.add(leTrace.mesh);
  const donnees: DonneesDeLaFleche = { on: false, island: null, ouvrage: null, depuis: null, arrivee: null, pointe: null, pointes: null, trace: null };
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
    donneesDeLaFleche: () => donnees,
    missions: questMarksGroup,
    // Ce que montre la flèche de la destination (une île, un ouvrage sur sa liaison, côté île de départ, ou une case du
    // monde : le chantier du navire, que la Carte ne montre pas) et le tracé renforcé de la liaison d'un ouvrage.
    poserLaFleche: (marker) => {
      const ouvrage = estUnOuvrage(marker) ? marker : null;
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
        return;
      }
      const ile = typeof marker === 'string';
      const c = typeof marker === 'string' ? islandCenter(marker) : estUnOuvrage(marker) ? marker.cell : marker;
      const base = ile ? c.z + 8 : ouvrage ? c.z + 2 : c.z;
      // La pointe de la flèche de la Carte : au-dessus du cœur d'une île, juste au-dessus du tablier d'un ouvrage.
      donnees.pointe = ile || ouvrage ? { x: c.x + 0.5, y: c.y + 0.5, z: base } : null;
      donnees.pointes = ouvrage ? ouvrage.places.map((p) => ({ x: p.x + 0.5, y: p.y + 0.5, z: p.z + 2 })) : null;
    },
    // Les repères des bornes de mission : les étoiles gagnées en petits cubes d'or empilés, immobiles (la bulle de la
    // prochaine chose à faire est seule à bouger, affordance-blocland.md §8). Rien sur une île fermée.
    poserLesMissions: (quests, sommets) => {
      vider(questMarksGroup);
      if (!quests?.length) return;
      const gold = markerMat;
      quests.forEach((q) => {
        if (q.state === 'locked' || q.state === 'new' || q.state === 0) return;
        const g = new THREE.Group();
        g.userData = { quest: q.id };
        // Juste au-dessus de l'ardoise de la borne (le socle et l'ardoise : deux cubes sur le sol de sa case).
        const base = (sommets?.get(q.id) ?? q.cell.z + 3) + 0.4;
        g.userData.base = base;
        g.add(new THREE.Mesh(pileDEtoiles(q.state), gold));
        g.position.set(q.cell.x + 0.5, base, q.cell.y + 0.5);
        questMarksGroup.add(g);
      });
    },
    // Le saut au toucher est celui des signes des objets (world/affordance.ts).
    sauterLaPile: (id) => {
      const pile = questMarksGroup.children.find((g) => g.userData.quest === id);
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
      // Le tracé de l'ouvrage désigné : sur la Carte seulement, avec la flèche ; immobile.
      leTrace.mesh.visible = instant.carte && leTrace.pose();
      // Le mouvement réduit, une préférence du téléphone ou de la tablette (core/motion.ts) : les repères de mission et
      // les balises du chemin restent dans leur pose de base, sans saut ni pulsation.
      for (const mk of questMarksGroup.children) {
        // Une pile d'étoiles touchée fait le petit saut du toucher (world/affordance.ts), puis reprend sa place. Elle ne
        // tourne pas : un seul mouvement à l'écran, celui de la bulle mise en avant.
        const debut = mk.userData.saut as number | undefined;
        const ms = debut === undefined ? 0 : instant.now - debut;
        if (debut !== undefined && (reduit || ms >= SIGNE.saut.monteeMs + SIGNE.saut.descenteMs)) delete mk.userData.saut;
        mk.position.y = mk.userData.base + (reduit ? 0 : sautDuSigne(ms));
      }
      if (trailGroup.children.length) {
        const pulse = reduit ? 1 : 0.85 + Math.sin(t * 3) * 0.15;
        trailGroup.scale.setScalar(1);
        for (const m of trailGroup.children) m.scale.setScalar(pulse);
      }
    },
    dispose: () => {
      vider(questMarksGroup);
      vider(trailGroup);
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
