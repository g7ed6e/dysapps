// Les personnages de la scène 3D : le bonhomme (qui marche le long de son itinéraire, d'un petit pas sautillant, et se
// tourne vers là où il va) et les créatures et Gardiens (un petit balancement, un pas de temps en temps). Leur dessin,
// leurs « habits », est en cubes ; derrière `?rendu=archipeo`, ce sont les personnages d'Archipéo en facettes
// (./personnagesPeints.ts), chargés à la demande : sans le drapeau, leurs modèles ne pèsent pas sur la 3D.
import * as THREE from 'three';
import { AVATAR_PARTS, AVATAR_SCALE } from '../Avatar';
import { piedsSur, type ChampDuSol } from '../world/landMesh';
import { buildMesh } from '../world/mesher';
import { avatarWalk, startStrolls, strollAt, walkPose, type Stroll, type Walk } from '../world/scene';
import type { EnCasesDuMonde, WorldViewProps } from '../world/view';
import type { Lumiere } from './lumiere';
import { meshOf } from './maillage';
import type { Instant, Monde, PartieDeLaScene } from './partie';

export interface Personnages extends PartieDeLaScene {
  /** Le bonhomme : posé au centre de sa case, sous ses pieds ; il tourne sur lui-même. */
  avatar: THREE.Group;
  /** Les créatures et les Gardiens (on les touche). */
  creatures: THREE.Group;
  /** La marche en cours du bonhomme (un tap la fait finir ; le navire le fait embarquer et débarquer). */
  marche: Walk | null;
  /** Son cap, autour de la verticale : il s'y tourne en douceur. */
  cap: number;
  montrerLeBonhomme(visible: boolean): void;
  /** Un nouvel itinéraire du bonhomme. */
  marcher(avatar: NonNullable<EnCasesDuMonde['avatar']>): void;
  poserLesCreatures(creatures: NonNullable<WorldViewProps['creatures']>): void;
}

/** Le dessin des personnages, dans les groupes du bonhomme et des créatures : en cubes, ou ceux d'Archipéo. */
export interface Habits {
  /** Les bras et les jambes du bonhomme, et le sens de leur balancement quand il marche. */
  membres: { os: THREE.Object3D; sens: number }[];
  poserLesCreatures(creatures: NonNullable<WorldViewProps['creatures']>): void;
  /** Les créatures bougent (rien avec « Réduire les animations »). */
  animer(t: number, reduit: boolean): void;
  dispose(): void;
}

/** Une créature en cubes : son groupe dans la scène et sa promenade (world/scene.ts). */
interface Walker {
  group: THREE.Group;
  stroll: Stroll;
  /** Le milieu de son emprise, par rapport à sa place (pour la poser sur le sol en pente). */
  centre: { x: number; y: number };
}

/** Les personnages en cubes (le monde en blocs). */
function habitsEnCubes(monde: Monde, champ: () => ChampDuSol | null, instant: Instant, avatarGroup: THREE.Group, creaturesGroup: THREE.Group): Habits {
  const { surface } = monde;
  // Le corps, recentré dans le groupe du bonhomme, regarde vers -Z (la caméra) sans rotation.
  const avatarBody = new THREE.Group();
  // Ses pièces sont en seizièmes de bloc : deux blocs de haut, comme une porte et un bloc. Chaque membre pivote.
  avatarBody.scale.setScalar(AVATAR_SCALE);
  avatarBody.position.set(-8 * AVATAR_SCALE, 0, -4 * AVATAR_SCALE);
  avatarGroup.add(avatarBody);
  const membres: Habits['membres'] = [];
  const arms: THREE.Group[] = [];
  const legs: THREE.Group[] = [];
  for (const part of AVATAR_PARTS) {
    const pivot = new THREE.Group();
    pivot.position.set(part.pivot.x, part.pivot.z, part.pivot.y);
    const inner = new THREE.Group();
    inner.position.set(-part.pivot.x, -part.pivot.z, -part.pivot.y);
    for (const g of buildMesh(part.cubes)) inner.add(meshOf(g, surface));
    pivot.add(inner);
    avatarBody.add(pivot);
    if (part.name.startsWith('bras')) arms.push(pivot);
    if (part.name.startsWith('jambe')) legs.push(pivot);
  }
  membres.push({ os: arms[0], sens: 1 }, { os: arms[1], sens: -1 }, { os: legs[0], sens: -1 }, { os: legs[1], sens: 1 });
  let walkers: Walker[] = [];

  const viderLesCreatures = () => {
    for (const child of [...creaturesGroup.children]) {
      creaturesGroup.remove(child);
      child.traverse((o) => {
        if (o instanceof THREE.Mesh) o.geometry.dispose();
      });
    }
  };

  return {
    membres,
    poserLesCreatures: (creatures) => {
      viderLesCreatures();
      const strolls = startStrolls(creatures, performance.now());
      walkers = creatures.map((c, i) => {
        const group = new THREE.Group();
        group.userData = { creature: c.id, kind: c.kind ?? 'creature' };
        for (const g of buildMesh(c.cubes)) group.add(meshOf(g, surface));
        // Le milieu de son emprise au sol : c'est là qu'on lit la hauteur du sol à facettes.
        const pieds = c.cubes.filter((q) => q.z === Math.min(...c.cubes.map((k) => k.z)));
        const centre = pieds.length
          ? { x: (Math.min(...pieds.map((q) => q.x)) + Math.max(...pieds.map((q) => q.x)) + 1) / 2, y: (Math.min(...pieds.map((q) => q.y)) + Math.max(...pieds.map((q) => q.y)) + 1) / 2 }
          : { x: 0.5, y: 0.5 };
        group.position.set(c.origin.x, piedsSur(champ(), c.origin.x + centre.x, c.origin.y + centre.y, c.origin.z), c.origin.y);
        creaturesGroup.add(group);
        return { group, stroll: strolls[i], centre };
      });
    },
    animer: (t, reduit) => {
      if (reduit) return;
      // Créatures : petit balancement, et un pas de temps en temps.
      for (const { group, stroll, centre } of walkers) {
        const { dx, dy, bob } = strollAt(stroll, instant.now, t);
        const x = stroll.origin.x + dx;
        const y = stroll.origin.y + dy;
        group.position.set(x, piedsSur(champ(), x + centre.x, y + centre.y, stroll.origin.z) + bob, y);
      }
    },
    dispose: () => {
      viderLesCreatures();
      avatarBody.traverse((o) => {
        if (o instanceof THREE.Mesh) o.geometry.dispose();
      });
    },
  };
}

/**
 * Les personnages ; `champ` rend le sol à facettes d'Archipéo (ou `null`), sur lequel ils posent les pieds. Sous le
 * drapeau `?rendu=archipeo`, ceux d'Archipéo, dont les lueurs suivent le degré de nuit de `lumiere` : le temps de les
 * charger, le bonhomme marche déjà (sans corps) et les créatures attendent.
 */
export function creerPersonnages(monde: Monde, champ: () => ChampDuSol | null, instant: Instant, lumiere: Pick<Lumiere, 'nuit'> | null = null): Personnages {
  const { scene } = monde;
  // Le groupe extérieur du bonhomme est posé au centre de sa case, sous ses pieds, et tourne sur lui-même.
  const avatarGroup = new THREE.Group();
  avatarGroup.visible = false;
  scene.add(avatarGroup);
  const creaturesGroup = new THREE.Group();
  scene.add(creaturesGroup);

  let habits: Habits | null = null;
  let places: NonNullable<WorldViewProps['creatures']> | null = null;
  let fini = false;
  if (monde.archipeo)
    void import('./personnagesPeints').then(({ habiller }) => {
      if (fini) return;
      habits = habiller(monde, champ, instant, lumiere, avatarGroup, creaturesGroup);
      if (places) habits.poserLesCreatures(places);
    });
  else habits = habitsEnCubes(monde, champ, instant, avatarGroup, creaturesGroup);

  const p: Personnages = {
    avatar: avatarGroup,
    creatures: creaturesGroup,
    marche: null,
    // Face à la caméra tant qu'il n'a pas marché.
    cap: 0,
    montrerLeBonhomme: (visible) => {
      avatarGroup.visible = visible;
    },
    marcher: (avatar) => {
      // Six cases par seconde, mais jamais plus de six secondes de marche (un tap fait arriver tout de suite).
      p.marche = avatarWalk(avatar, performance.now());
    },
    poserLesCreatures: (creatures) => {
      places = creatures;
      habits?.poserLesCreatures(creatures);
    },
    // Le bonhomme marche le long de son itinéraire (à vitesse constante, un petit pas sautillant), puis attend.
    deplacer: (t, _dt, reduit) => {
      instant.marche = false;
      if (!p.marche) return;
      const pose = walkPose(p.marche, instant.now, reduit);
      const swing = pose.moving ? Math.sin(t * 11) * 0.8 : 0;
      for (const m of habits?.membres ?? []) m.os.rotation.x = m.sens * swing;
      // Sur le sol à facettes, posé sur la pente (jamais dedans) ; sur un pont ou dans le monde en blocs, à sa hauteur.
      avatarGroup.position.set(pose.x + 0.5, piedsSur(champ(), pose.x + 0.5, pose.y + 0.5, pose.z), pose.y + 0.5);
      // Il regarde là où il va. Le visage est vers -Z : pour regarder vers (dx, dy) (Y du plan = Z de la scène), on
      // tourne de atan2(-dx, -dy).
      if (pose.facing) p.cap = Math.atan2(-pose.facing.dx, -pose.facing.dy);
      if (!pose.moving) p.marche = null;
      else instant.marche = true;
    },
    animer: (t, dt, reduit) => {
      // Il se tourne vers son cap en douceur, par le plus court.
      const turn = Math.atan2(Math.sin(p.cap - avatarGroup.rotation.y), Math.cos(p.cap - avatarGroup.rotation.y));
      avatarGroup.rotation.y += reduit ? turn : turn * Math.min(1, dt * 12);
      habits?.animer(t, reduit);
    },
    dispose: () => {
      fini = true;
      habits?.dispose();
      habits = null;
      scene.remove(avatarGroup, creaturesGroup);
    },
  };
  return p;
}
