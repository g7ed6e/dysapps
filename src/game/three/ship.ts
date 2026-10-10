// La Nef dans la scène 3D (GD-15) : amarrée au quai, elle tangue (ou plane, dans le ciel) ; en voyage, elle s'éloigne ou
// accoste, le bonhomme à bord, avec l'écume à la poupe du voilier. Quand elle change de forme sur son port (la dernière
// pièce posée et les Gardiens rallumés), elle mue sous les yeux de l'élève : dans Blocland, chaque cube vole vers sa
// nouvelle case, ceux qu'elle ne garde pas rapetissent, les neufs grandissent (`world/metamorphosis.ts`).
import * as THREE from 'three';
import type { BiomeId } from '../biomes';
import { maillageDeLaConstruction } from '../world/construction';
import type { VoxelCube } from '../world/cube';
import { VEHICLE_DECK } from '../world/harbor';
import { METAMORPHOSIS_MS, metamorphosisFlights, metamorphosisPose, type Flight } from '../world/metamorphosis';
import { boardingWalk, startVoyage, voyageFrame, type VoyageRun } from '../world/scene';
import type { WorldViewProps } from '../world/view';
import { vehiclePath } from '../world/voyage';
import type { Cubes } from './cubes';
import { creerConstruction } from './construction';
import { addMeshes, modelMeshes } from './meshes';
import type { Derniers, Instant, Monde, PartieDeLaScene } from './scenePart';
import type { Personnages } from './characters';

/** Le navire amarré : son origine dans le monde, son port, à flot ou non, et les cases fantômes que l'on peut poser. */
export interface Amarre {
  origin: { x: number; y: number; z: number };
  ghosts: Set<string>;
  afloat: boolean;
  port: BiomeId;
  /** La forme montrée (0 à 3) et ses cubes posés : de quoi muer quand la forme suivante arrive sur le même port. */
  form: number;
  solid: VoxelCube[];
}

export interface Navire extends PartieDeLaScene {
  /** La Nef (on la touche). */
  groupe: THREE.Group;
  poser(vehicle: WorldViewProps['vehicle']): void;
  /** Un nouveau temps du voyage : au départ, le bonhomme marche jusqu'au pont ; à l'arrivée, il est à bord et le navire accoste. */
  voyager(voyage: WorldViewProps['voyage']): void;
  /** Un toucher pendant la mue la termine : vrai s'il y en avait une. */
  finirLaMue(): boolean;
}

/** La mue en cours : une instance par cube, regroupés par apparence (un appel de dessin par apparence, 3 s au plus). */
interface Mue {
  debut: number;
  vols: { flight: Flight; mesh: THREE.InstancedMesh; i: number }[];
  meshes: THREE.InstancedMesh[];
}

/**
 * Le navire ; `amarre` et `voyage` sont gardés par la vue (ils survivent à la scène, refaite quand l'archipel change,
 * derrière l'écran du voyage).
 */
export function creerNavire(
  monde: Monde,
  personnages: Personnages,
  cubes: Cubes,
  derniers: { readonly current: Derniers },
  instant: Instant,
  amarre: { current: Amarre | null },
  voyage: { current: VoyageRun | null },
): Navire {
  const { scene, surface, archipel } = monde;
  const vehicleGroup = new THREE.Group();
  vehicleGroup.userData = { vehicle: true };
  const hullGroup = new THREE.Group();
  vehicleGroup.add(hullGroup);
  // Archipéo (lot R5) : la Nef en construction taillée, avec les matériaux de la construction du monde.
  const taille = cubes.materiaux ? creerConstruction(cubes.materiaux) : null;
  if (taille) hullGroup.add(taille.group);
  scene.add(vehicleGroup);
  let mue: Mue | null = null;
  const matrice = new THREE.Matrix4();
  const quaternion = new THREE.Quaternion();
  const position = new THREE.Vector3();
  const echelle = new THREE.Vector3();

  const vider = () => {
    for (const child of [...hullGroup.children]) {
      if (!(child instanceof THREE.Mesh)) continue;
      hullGroup.remove(child);
      child.geometry.dispose();
    }
    taille?.dispose();
  };

  const finir = () => {
    if (!mue) return false;
    for (const m of mue.meshes) {
      vehicleGroup.remove(m);
      m.geometry.dispose();
      m.dispose();
    }
    mue = null;
    hullGroup.visible = true;
    return true;
  };

  /** Lance la mue de `avant` vers `apres` (cubes locaux posés) : la nouvelle forme est cachée le temps du vol. */
  const muer = (avant: VoxelCube[], apres: VoxelCube[]) => {
    const flights = metamorphosisFlights(avant, apres);
    const groupes = new Map<string, Flight[]>();
    for (const f of flights) {
      const k = `${f.cube.texture ?? ''}|${f.cube.color}|${f.cube.top ?? ''}`;
      groupes.set(k, [...(groupes.get(k) ?? []), f]);
    }
    const vols: Mue['vols'] = [];
    const meshes: THREE.InstancedMesh[] = [];
    for (const liste of groupes.values()) {
      // Un cube seul à l'origine, dessiné comme ceux de la Nef, répété en instances.
      for (const modele of modelMeshes([{ ...liste[0].cube, x: 0, y: 0, z: 0, ghost: undefined }], surface)) {
        const mesh = new THREE.InstancedMesh(modele.geometry, modele.material, liste.length);
        mesh.frustumCulled = false;
        liste.forEach((flight, i) => vols.push({ flight, mesh, i }));
        meshes.push(mesh);
        vehicleGroup.add(mesh);
      }
    }
    mue = { debut: instant.now, vols, meshes };
    hullGroup.visible = false;
    poserLesVols(0);
  };

  const poserLesVols = (k: number) => {
    if (!mue) return;
    for (const { flight, mesh, i } of mue.vols) {
      const p = metamorphosisPose(flight, k);
      // Le cube grandit ou rapetisse autour de son centre (une case : de 0 à 1 sur chaque axe).
      position.set(p.x + 0.5 - p.scale / 2, p.z + 0.5 - p.scale / 2, p.y + 0.5 - p.scale / 2);
      echelle.setScalar(Math.max(p.scale, 1e-4));
      matrice.compose(position, quaternion, echelle);
      mesh.setMatrixAt(i, matrice);
    }
    for (const m of mue.meshes) m.instanceMatrix.needsUpdate = true;
  };

  return {
    groupe: vehicleGroup,
    poser: (vehicle) => {
      const avant = amarre.current;
      finir();
      vider();
      if (!vehicle) {
        amarre.current = null;
        vehicleGroup.visible = false;
        return;
      }
      const solid = vehicle.cubes.filter((c) => !c.ghost);
      if (taille) taille.peindre(maillageDeLaConstruction(archipel, vehicle.cubes, [], { navire: true }));
      else addMeshes(hullGroup, modelMeshes(vehicle.cubes, surface));
      vehicleGroup.position.set(vehicle.origin.x, vehicle.origin.z, vehicle.origin.y);
      vehicleGroup.rotation.set(0, 0, 0);
      vehicleGroup.visible = true;
      amarre.current = {
        origin: vehicle.origin,
        port: vehicle.port,
        afloat: vehicle.afloat,
        ghosts: new Set(vehicle.cubes.filter((c) => c.ghost).map((c) => `${c.x},${c.y},${c.z}`)),
        form: vehicle.form,
        solid,
      };
      // La forme suivante, sur le même port, sous les yeux de l'élève : la mue (Blocland ; Archipéo change d'un coup
      // jusqu'à son lot, GD-15 « Blocland d'abord »).
      if (!taille && avant && avant.port === vehicle.port && avant.form >= 1 && vehicle.form === avant.form + 1) muer(avant.solid, solid);
    },
    finirLaMue: finir,
    voyager: (v) => {
      finir();
      if (!v || v.seq === 0 || !amarre.current) {
        voyage.current = null;
        if (amarre.current) {
          const o = amarre.current.origin;
          vehicleGroup.position.set(o.x, o.z, o.y);
          vehicleGroup.rotation.set(0, 0, 0);
        }
        return;
      }
      const now = performance.now();
      voyage.current = startVoyage(v, now);
      personnages.marche = boardingWalk(amarre.current.port, voyage.current, now);
    },
    // Le voyage : le navire s'éloigne (départ) ou accoste (arrivée), le bonhomme à bord entre les deux marches.
    deplacer: (_t, _dt, reduit) => {
      instant.navigue = null;
      const vy = voyage.current;
      const v = amarre.current;
      if (!vy || !v) return;
      const now = instant.now;
      const f = voyageFrame(vy, v.port, now);
      // Accosté : le bonhomme débarque (le chemin d'embarquement à rebours).
      if (f.disembark) personnages.marche = f.disembark;
      const p = vehiclePath(vy.stage, f.k);
      vehicleGroup.position.set(v.origin.x + p.dx, v.origin.z + p.dz, v.origin.y + p.dy);
      vehicleGroup.rotation.x = -p.pitch;
      vehicleGroup.rotation.z = 0;
      if (f.aboard) {
        personnages.avatar.position.set(vehicleGroup.position.x + VEHICLE_DECK.x + 0.5, vehicleGroup.position.y + 1, vehicleGroup.position.z + VEHICLE_DECK.y + 0.5);
        personnages.cap = 0;
      }
      if (f.underway && !reduit) {
        instant.navigue = { at: vehicleGroup.position.clone(), k: f.progress, stage: vy.stage };
        // L'écume à la poupe du voilier.
        if (vy.stage === 1 && now - vy.lastFoam > 100) {
          vy.lastFoam = now;
          const mesh = new THREE.Mesh(cubes.formeDEclat, new THREE.MeshBasicMaterial({ color: 0xf4f8fb, transparent: true, opacity: 0.9 }));
          mesh.position.set(vehicleGroup.position.x + 2.5 + (Math.random() - 0.5) * 3, vehicleGroup.position.y + 0.2, vehicleGroup.position.z + 8);
          cubes.eclat(mesh, new THREE.Vector3((Math.random() - 0.5) * 1.5, 1.2, 1.5), now);
        }
      }
      if (f.end) derniers.current.onVoyageLegEnd?.();
    },
    // Amarrée, elle tangue doucement sur l'eau (plane, plus lentement, dans le ciel). La mue avance ici ; quand
    // l'appareil demande moins d'animations, elle est déjà finie (la nouvelle forme d'un coup).
    animer: (t, _dt, reduit) => {
      if (mue) {
        const k = reduit ? 1 : (instant.now - mue.debut) / METAMORPHOSIS_MS;
        if (k >= 1) finir();
        else poserLesVols(k);
      }
      if (reduit || !amarre.current || voyage.current) return;
      const v = amarre.current;
      vehicleGroup.position.y = v.origin.z + (v.afloat ? Math.sin(t * 1.8) * 0.08 : 0.3 + Math.sin(t * 0.9) * 0.15);
      vehicleGroup.rotation.z = v.afloat ? Math.sin(t * 1.3) * 0.015 : 0;
    },
    dispose: () => {
      finir();
      vider();
    },
  };
}
