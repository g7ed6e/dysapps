// Les personnages de la scène 3D : le bonhomme (qui marche le long de son itinéraire, d'un petit pas sautillant, et se
// tourne vers là où il va) et les créatures et Gardiens (un petit balancement, un pas de temps en temps). Leur dessin,
// leurs « habits », est en cubes ; dans l’univers Archipéo (voir rendu.ts), ce sont les personnages d'Archipéo en facettes
// (./personnagesPeints.ts), chargés à la demande : sans le drapeau, leurs modèles ne pèsent pas sur la 3D.
import * as THREE from 'three';
import type { BiomeId } from '../biomes';
import { AVATAR_PARTS, AVATAR_SCALE } from '../Avatar';
import { piedsSur, type ChampDuSol } from '../world/landMesh';
import { buildMesh } from '../world/mesher';
import { avatarWalk, startStrolls, strollAt, walkPose, type Stroll, type Walk } from '../world/scene';
import { hauteurDuSigne } from '../world/signe';
import type { EnCasesDuMonde, WorldViewProps } from '../world/view';
import type { Lumiere } from './lumiere';
import { meshOf } from './maillage';
import type { Instant, Monde, PartieDeLaScene } from './partie';

export interface Personnages extends PartieDeLaScene {
  /** Le bonhomme : posé au centre de sa case, sous ses pieds ; il tourne sur lui-même. */
  avatar: THREE.Group;
  /** Les créatures et les Gardiens (on les touche). */
  creatures: THREE.Group;
  /** La marche en cours du bonhomme (un tap dans le vide la fait finir ; le navire le fait embarquer et débarquer). */
  marche: Walk | null;
  /** Le dernier itinéraire demandé par la vue (`marcher`), gardé après l'arrivée : le rond au sol le lit (./rond.ts). */
  trajet: Walk | null;
  /** Son cap, autour de la verticale : il s'y tourne en douceur. */
  cap: number;
  montrerLeBonhomme(visible: boolean): void;
  /** Un nouvel itinéraire du bonhomme. */
  marcher(avatar: NonNullable<EnCasesDuMonde['avatar']>): void;
  poserLesCreatures(creatures: NonNullable<WorldViewProps['creatures']>): void;
  /** Le moment du rallumage (lot 6) : la sentinelle de ce Gardien se rallume en fondu ; `null` : plus de moment. */
  rallumer(id: BiomeId | null, dureeMs: number): void;
  /** Le geste de la créature qui se souvient (GD-4, étape 1) : un saut lent, qui commence à `debut` (`performance.now`). */
  faireSigne(id: BiomeId, debut: number): void;
  /**
   * Le haut de la tête de la créature de cette île (pas d'un Gardien), au repos, dans `out` ; `false` si elle n'est pas
   * (encore) dans la scène.
   */
  teteDe(id: BiomeId, out: THREE.Vector3): boolean;
}

/** Le dessin des personnages, dans les groupes du bonhomme et des créatures : en cubes, ou ceux d'Archipéo. */
export interface Habits {
  /** Les bras et les jambes du bonhomme, et le sens de leur balancement quand il marche. */
  membres: { os: THREE.Object3D; sens: number }[];
  poserLesCreatures(creatures: NonNullable<WorldViewProps['creatures']>): void;
  /** Les créatures bougent (rien avec « Réduire les animations »). */
  animer(t: number, reduit: boolean): void;
  /**
   * Rallume la sentinelle d'un Gardien en fondu (lot 6), en `dureeMs` millisecondes (0 : d'un coup), quel que soit son
   * placement ; `null` rend à chaque Gardien le degré de son placement. Les personnages en cubes n'en font rien.
   */
  rallumer?(id: BiomeId | null, dureeMs: number): void;
  /** Le geste du signe (GD-4, étape 1) ; les personnages d'Archipéo n'en font rien (ils ont déjà leur geste du bras). */
  faireSigne?(id: BiomeId, debut: number): void;
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
  /** Le début du geste de chaque créature qui fait signe, gardé quand les créatures sont reposées. */
  const signes = new Map<BiomeId, number>();

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
        // Le signe : un saut lent, une fois, par-dessus le balancement.
        const debut = signes.get(group.userData.creature as BiomeId);
        const saut = debut === undefined || group.userData.kind !== 'creature' ? 0 : hauteurDuSigne(instant.now - debut);
        group.position.set(x, piedsSur(champ(), x + centre.x, y + centre.y, stroll.origin.z) + bob + saut, y);
      }
    },
    faireSigne: (id, debut) => {
      signes.set(id, debut);
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
 * Les personnages ; `champ` rend le sol à facettes d'Archipéo (ou `null`), sur lequel ils posent les pieds. Dans
 * l’univers Archipéo, ceux d'Archipéo, dont les lueurs suivent le degré de nuit de `lumiere` : le temps de les
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
  /** La boîte d'une créature, pour mesurer sa tête une fois (`teteDe`). */
  const boite = new THREE.Box3();
  /**
   * La tête de chaque créature, mesurée une seule fois : son objet et l'écart entre le haut de sa tête et sa position.
   * Image après image, on ne lit plus que la position (pas de boîte recalculée sur tous ses cubes).
   */
  const tetes = new Map<BiomeId, { objet: THREE.Object3D; ecart: THREE.Vector3 }>();
  let places: NonNullable<WorldViewProps['creatures']> | null = null;
  // Le rallumage demandé avant que les personnages d'Archipéo soient chargés.
  let rallumage: { id: BiomeId | null; dureeMs: number } | null = null;
  let fini = false;
  const vetir = (h: Habits) => {
    habits = h;
    if (rallumage) h.rallumer?.(rallumage.id, rallumage.dureeMs);
    if (places) h.poserLesCreatures(places);
  };
  if (monde.habillage.personnages === 'modeles')
    import('./personnagesPeints')
      .then(({ habiller }) => {
        if (!fini) vetir(habiller(monde, champ, instant, lumiere, avatarGroup, creaturesGroup));
      })
      // Le morceau ne se charge pas (réseau coupé, nouvelle version publiée) : les personnages en cubes, plutôt que rien.
      .catch(() => {
        if (!fini && !habits) vetir(habitsEnCubes(monde, champ, instant, avatarGroup, creaturesGroup));
      });
  else habits = habitsEnCubes(monde, champ, instant, avatarGroup, creaturesGroup);

  const p: Personnages = {
    avatar: avatarGroup,
    creatures: creaturesGroup,
    marche: null,
    trajet: null,
    // Face à la caméra tant qu'il n'a pas marché.
    cap: 0,
    montrerLeBonhomme: (visible) => {
      avatarGroup.visible = visible;
    },
    marcher: (avatar) => {
      // Six cases par seconde, mais jamais plus de six secondes de marche (un tap dans le vide fait arriver tout de suite).
      p.marche = p.trajet = avatarWalk(avatar, performance.now(), monde.archipel);
    },
    poserLesCreatures: (creatures) => {
      places = creatures;
      habits?.poserLesCreatures(creatures);
    },
    rallumer: (id, dureeMs) => {
      rallumage = { id, dureeMs };
      habits?.rallumer?.(id, dureeMs);
    },
    faireSigne: (id, debut) => habits?.faireSigne?.(id, debut),
    teteDe: (id, out) => {
      let tete = tetes.get(id);
      // Remesurée seulement si la créature a été reposée ou rhabillée (son objet n'est plus dans la scène).
      if (!tete || tete.objet.parent !== creaturesGroup) {
        // L'objet touchable de la créature (son groupe en cubes, ou sa boîte chez les personnages d'Archipéo).
        const o = creaturesGroup.children.find((c) => c.userData.creature === id && c.userData.kind !== 'guardian');
        if (!o) return false;
        boite.setFromObject(o);
        if (boite.isEmpty()) return false;
        boite.getCenter(out);
        out.y = boite.max.y;
        tete = { objet: o, ecart: out.clone().sub(o.getWorldPosition(new THREE.Vector3())) };
        tetes.set(id, tete);
      }
      tete.objet.getWorldPosition(out).add(tete.ecart);
      return true;
    },
    // Le bonhomme marche le long de son itinéraire (à vitesse constante, un petit pas sautillant), puis attend.
    deplacer: (t, _dt, reduit) => {
      instant.marche = false;
      instant.traversee = null;
      if (!p.marche) return;
      const pose = walkPose(p.marche, instant.now, reduit);
      const swing = pose.moving ? Math.sin(t * 11) * 0.8 : 0;
      for (const m of habits?.membres ?? []) m.os.rotation.x = m.sens * swing;
      // Sur le sol à facettes, posé sur la pente (jamais dedans) ; sur un pont ou dans le monde en blocs, à sa hauteur.
      avatarGroup.position.set(pose.x + 0.5, piedsSur(champ(), pose.x + 0.5, pose.y + 0.5, pose.z), pose.y + 0.5);
      // Il regarde là où il va. Le visage est vers -Z : pour regarder vers (dx, dy) (Y du plan = Z de la scène), on
      // tourne de atan2(-dx, -dy).
      if (pose.facing) p.cap = Math.atan2(-pose.facing.dx, -pose.facing.dy);
      // Une flânerie sur son île (vers une case touchée) n'est pas une marche pour la caméra : elle garde son cadrage.
      if (!pose.moving) p.marche = null;
      else if (!p.marche.flanerie) {
        instant.marche = true;
        instant.traversee = p.marche.cadre ?? null;
      }
    },
    animer: (t, dt, reduit) => {
      // Il se tourne vers son cap en douceur, par le plus court.
      const turn = Math.atan2(Math.sin(p.cap - avatarGroup.rotation.y), Math.cos(p.cap - avatarGroup.rotation.y));
      avatarGroup.rotation.y += reduit ? turn : turn * Math.min(1, dt * 12);
      habits?.animer(t, reduit);
    },
    dispose: () => {
      fini = true;
      tetes.clear();
      habits?.dispose();
      habits = null;
      scene.remove(avatarGroup, creaturesGroup);
    },
  };
  return p;
}
