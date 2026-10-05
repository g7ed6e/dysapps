// Le Bloc-Navire dans la scène 3D : amarré au quai, il tangue (ou plane, dans le ciel) et son ballon se balance au
// sommet du mât ; en voyage, il s'éloigne ou accoste, le bonhomme à bord, avec l'écume à la poupe ou les flammes des
// réacteurs, sous la coque.
import * as THREE from 'three';
import type { BiomeId } from '../biomes';
import { maillageDeLaConstruction } from '../world/construction';
import { VEHICLE_DECK } from '../world/harbour';
import { MAST_TOP, TUYERES } from '../world/vehicle';
import { buildMesh } from '../world/mesher';
import { boardingWalk, startVoyage, voyageFrame, type VoyageRun } from '../world/scene';
import type { WorldViewProps } from '../world/view';
import { vehiclePath } from '../world/voyage';
import type { Cubes } from './cubes';
import { creerConstruction } from './construction';
import { meshOf } from './maillage';
import type { Derniers, Instant, Monde, PartieDeLaScene } from './partie';
import type { Personnages } from './personnages';

/** Le navire amarré : son origine dans le monde, son port, à flot ou non, et les cases fantômes que l'on peut poser. */
export interface Amarre {
  origin: { x: number; y: number; z: number };
  ghosts: Set<string>;
  afloat: boolean;
  port: BiomeId;
}

export interface Navire extends PartieDeLaScene {
  /** Le navire (on le touche) : la coque, qui tangue, et le ballon. */
  groupe: THREE.Group;
  poser(vehicle: WorldViewProps['vehicle']): void;
  /** Un nouveau temps du voyage : au départ, le bonhomme marche jusqu'au pont ; à l'arrivée, il est à bord et le navire accoste. */
  voyager(voyage: WorldViewProps['voyage']): void;
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
  // Le Bloc-Navire : un groupe à part, amarré au quai, qui tangue ; le ballon pivote au sommet du mât.
  const vehicleGroup = new THREE.Group();
  vehicleGroup.userData = { vehicle: true };
  const hullGroup = new THREE.Group();
  const balloonGroup = new THREE.Group();
  // Les flammes des réacteurs (troisième étape), sous les trois tuyères, visibles seulement en vol : un seul appel de
  // dessin ; elles s'allongent vers le bas depuis le dessous des tuyères.
  const flameMat = new THREE.MeshBasicMaterial({ color: 0xff7a1a, transparent: true, opacity: 0.9 });
  const flame = new THREE.InstancedMesh(new THREE.BoxGeometry(0.8, 1, 0.8).translate(0, -0.5, 0), flameMat, TUYERES.length);
  TUYERES.forEach((c, i) => flame.setMatrixAt(i, new THREE.Matrix4().makeTranslation(c.x + 0.5, 0, c.y + 0.5)));
  flame.position.y = TUYERES[0].z;
  flame.visible = false;
  vehicleGroup.add(hullGroup, balloonGroup, flame);
  // Archipéo (lot R5) : la coque et le ballon en construction taillée, avec les matériaux de la construction du monde.
  const taille = cubes.materiaux ? { coque: creerConstruction(cubes.materiaux), ballon: creerConstruction(cubes.materiaux) } : null;
  if (taille) {
    hullGroup.add(taille.coque.group);
    balloonGroup.add(taille.ballon.group);
  }
  scene.add(vehicleGroup);

  const vider = () => {
    for (const part of [hullGroup, balloonGroup]) {
      for (const child of [...part.children]) {
        if (!(child instanceof THREE.Mesh)) continue;
        part.remove(child);
        child.geometry.dispose();
      }
    }
    taille?.coque.dispose();
    taille?.ballon.dispose();
  };

  return {
    groupe: vehicleGroup,
    // La coque (tout ce qui est sous le mât) et le ballon, qui pivote au sommet du mât.
    poser: (vehicle) => {
      vider();
      if (!vehicle) {
        amarre.current = null;
        vehicleGroup.visible = false;
        return;
      }
      const hull = vehicle.cubes.filter((c) => c.z < MAST_TOP);
      const balloon = vehicle.cubes.filter((c) => c.z >= MAST_TOP).map((c) => ({ ...c, x: c.x - 2, y: c.y - 3, z: c.z - MAST_TOP }));
      if (taille) {
        taille.coque.peindre(maillageDeLaConstruction(archipel, hull, [], { navire: true }));
        taille.ballon.peindre(maillageDeLaConstruction(archipel, balloon, [], { navire: true }));
      } else {
        for (const g of buildMesh(hull)) hullGroup.add(meshOf(g, surface));
        for (const g of buildMesh(balloon)) balloonGroup.add(meshOf(g, surface));
      }
      balloonGroup.position.set(2, MAST_TOP, 3);
      vehicleGroup.position.set(vehicle.origin.x, vehicle.origin.z, vehicle.origin.y);
      vehicleGroup.rotation.set(0, 0, 0);
      vehicleGroup.visible = true;
      amarre.current = {
        origin: vehicle.origin,
        port: vehicle.port,
        afloat: vehicle.afloat,
        ghosts: new Set(vehicle.cubes.filter((c) => c.ghost).map((c) => `${c.x},${c.y},${c.z}`)),
      };
    },
    voyager: (v) => {
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
    deplacer: (t, _dt, reduit) => {
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
        // L'écume à la poupe (à la voile), les flammes qui vacillent (aux réacteurs).
        if (vy.stage === 1 && now - vy.lastFoam > 100) {
          vy.lastFoam = now;
          const mesh = new THREE.Mesh(cubes.formeDEclat, new THREE.MeshBasicMaterial({ color: 0xf4f8fb, transparent: true, opacity: 0.9 }));
          mesh.position.set(vehicleGroup.position.x + 2.5 + (Math.random() - 0.5) * 3, vehicleGroup.position.y + 0.2, vehicleGroup.position.z + 8);
          cubes.eclat(mesh, new THREE.Vector3((Math.random() - 0.5) * 1.5, 1.2, 1.5), now);
        }
        flame.visible = vy.stage === 3;
        if (flame.visible) flame.scale.set(1, 1 + 0.4 * Math.sin(t * 37) + 0.3 * Math.random(), 1);
      } else flame.visible = false;
      if (f.end) derniers.current.onVoyageLegEnd?.();
    },
    // Amarré, il tangue doucement sur l'eau (plane, plus lentement, dans le ciel) ; son ballon se balance.
    animer: (t, _dt, reduit) => {
      if (reduit || !amarre.current || voyage.current) return;
      const v = amarre.current;
      vehicleGroup.position.y = v.origin.z + (v.afloat ? Math.sin(t * 1.8) * 0.08 : 0.3 + Math.sin(t * 0.9) * 0.15);
      vehicleGroup.rotation.z = v.afloat ? Math.sin(t * 1.3) * 0.015 : 0;
      balloonGroup.rotation.z = Math.sin(t * 1.3) * 0.04;
      balloonGroup.rotation.x = Math.sin(t * 0.9) * 0.03;
    },
    dispose: () => {
      vider();
      flame.dispose();
      flame.geometry.dispose();
      flameMat.dispose();
    },
  };
}
