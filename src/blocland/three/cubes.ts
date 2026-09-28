// Les cubes de la scène 3D : le monde en blocs (une géométrie par matériau, faces visibles seulement) ; dans Archipéo,
// le sol et la roche en facettes (lot R2) et le décor en primitives (lot R4), le reste en cubes. Aussi la case visée en
// chantier, et les éclats (la poussière d'un bloc posé, l'écume du navire).
import * as THREE from 'three';
import type { VoxelCube } from '../Voxel';
import { caseDuDecor, maillageDuDecor, rangerLeDecor, signatureDuDecor } from '../world/decorMesh';
import { champDuSol, landMesh, pickCell, poseDuDecor, signatureDuChamp, type ChampDuSol } from '../world/landMesh';
import { buildMesh } from '../world/mesher';
import type { EnCasesDuMonde } from '../world/view';
import { styleDuMonde } from '../rendu';
import { creerDecor } from './decor';
import type { Large } from './large';
import type { Lumiere } from './lumiere';
import { meshOf } from './maillage';
import type { Instant, Monde, PartieDeLaScene } from './partie';
import { creerSol } from './sol';

type Case = { x: number; y: number; z: number };

export interface Cubes extends PartieDeLaScene {
  /** Le sol à facettes d'Archipéo, pour le toucher et la marche (`null` dans le monde en blocs, ou avant les cubes). */
  champ(): ChampDuSol | null;
  /** Ce qu'on peut toucher : les cubes, le sol à facettes et le décor. */
  cibles(): THREE.Object3D[];
  /** Le bloc touché et la case voisine devant la face, en coordonnées de grille (x, y, z = hauteur). */
  casesTouchees(hit: THREE.Intersection): { cell: Case; next: Case };
  poser(cubes: VoxelCube[]): void;
  /** La case visée en chantier (son contour), ou aucune. */
  viser(next: Case | null): void;
  /** À la pose d'un bloc : trois poussières claires qui montent doucement, sans partir en tous sens. */
  eclater(burst: NonNullable<EnCasesDuMonde['burst']>): void;
  /** Un éclat de plus (petit cube qui retombe et disparaît) ; `material` lui appartient. */
  eclat(mesh: THREE.Mesh, velocity: THREE.Vector3, born: number): void;
  /** La forme d'un éclat, partagée. */
  formeDEclat: THREE.BufferGeometry;
}

interface Spark {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  born: number;
}

export function creerCubes(monde: Monde, large: Large, lumiere: Lumiere, instant: Instant): Cubes {
  const { scene, archipel, archipeo, surface } = monde;
  const terrain = new THREE.Group();
  scene.add(terrain);
  // Archipéo (lot R2) : le sol et la roche en facettes, à part des cubes (construction) ; le décor en primitives (R4).
  const sol = archipeo ? { en3D: creerSol(), champ: null as ChampDuSol | null, signature: '', decor: creerDecor(instant), decorSignature: '' } : null;
  if (sol) scene.add(sol.en3D.group, sol.decor.group);
  // La lanterne du phare et la couleur des fumées suivent le moment du jour (R4b-6e).
  if (sol) lumiere.suivre((jour) => sol.decor.jour(jour));
  // Le contour de la case visée (mode chantier).
  const hover = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1.02, 1.02, 1.02)), new THREE.LineBasicMaterial({ color: 0x1e6fd9 }));
  hover.visible = false;
  scene.add(hover);
  const sparkGeo = new THREE.BoxGeometry(0.18, 0.18, 0.18);
  const sparks: Spark[] = [];

  const viderLeTerrain = () => {
    for (const child of [...terrain.children]) {
      terrain.remove(child);
      (child as THREE.Mesh).geometry.dispose();
    }
  };

  return {
    champ: () => sol?.champ ?? null,
    cibles: () => (sol ? [...terrain.children, ...sol.en3D.group.children, ...sol.decor.group.children] : terrain.children),
    casesTouchees: (hit) => {
      const n = hit.face?.normal ?? new THREE.Vector3(0, 1, 0);
      // Le sol à facettes (lot R2) : le point touché et la normale de la facette redonnent la case (world/landMesh.ts).
      const champ = sol?.champ;
      if (hit.object.userData.sol && champ) {
        const picked = pickCell(champ, hit.point, n);
        if (picked) return picked;
      }
      // Le décor en primitives (lot R4) : la case où pousse l'élément touché.
      const decor = sol?.decor.maillage;
      if (hit.object.userData.decor && champ && decor && hit.faceIndex != null) {
        const picked = caseDuDecor(champ, decor, Boolean(hit.object.userData.lueur), hit.faceIndex);
        if (picked) return picked;
      }
      const inside = hit.point.clone().addScaledVector(n, -0.5);
      const outside = hit.point.clone().addScaledVector(n, 0.5);
      const cell = { x: Math.floor(inside.x), y: Math.floor(inside.z), z: Math.floor(inside.y) };
      const next = { x: Math.floor(outside.x), y: Math.floor(outside.z), z: Math.floor(outside.y) };
      return { cell, next };
    },
    poser: (cubes) => {
      viderLeTerrain();
      if (!sol) {
        for (const g of buildMesh(cubes)) terrain.add(meshOf(g, surface));
        return;
      }
      // Archipéo : le sol et la roche en facettes, le reste en cubes. Le maillage du sol n'est refait que s'il change
      // (poser un bloc sur un plan ne le change pas : la case est déjà figée par le fantôme).
      const auSol: VoxelCube[] = [];
      const autres: VoxelCube[] = [];
      for (const c of cubes) (c.sol ? auSol : autres).push(c);
      // Le décor en primitives (lot R4) : sorti des cubes, il ne fige plus sa case ; le sol à facettes passe dessous.
      const { elements, reste } = rangerLeDecor(autres);
      const champ = champDuSol(archipel, auSol, reste);
      // Le décor resté en cubes (les objets du quai) d'une case descendue au bas de sa pente descend avec elle.
      for (const g of buildMesh(poseDuDecor(champ, reste), auSol)) terrain.add(meshOf(g, surface));
      const signature = signatureDuChamp(champ);
      const style = styleDuMonde() === 'a' ? 'a' : 'b';
      if (signature !== sol.signature) sol.en3D.peindre(landMesh(champ, { style }));
      const decorSignature = signatureDuDecor(elements);
      if (signature !== sol.signature || decorSignature !== sol.decorSignature) {
        sol.decor.peindre(maillageDuDecor(archipel, champ, elements, { style }));
        sol.decorSignature = decorSignature;
      }
      sol.signature = signature;
      sol.champ = champ;
      large.rivage(champ, autres);
    },
    viser: (next) => {
      hover.visible = next !== null;
      if (next) hover.position.set(next.x + 0.5, next.z + 0.5, next.y + 0.5);
    },
    eclater: (burst) => {
      const color = new THREE.Color(burst.color).lerp(new THREE.Color('#ffffff'), 0.6);
      for (let i = 0; i < 3; i++) {
        const mesh = new THREE.Mesh(sparkGeo, new THREE.MeshBasicMaterial({ color }));
        mesh.position.set(burst.cell.x + 0.3 + i * 0.2, burst.cell.z + 0.8, burst.cell.y + 0.5);
        const velocity = new THREE.Vector3(0, 3.6 + i * 0.3, 0);
        scene.add(mesh);
        sparks.push({ mesh, velocity, born: performance.now() });
      }
    },
    eclat: (mesh, velocity, born) => {
      scene.add(mesh);
      sparks.push({ mesh, velocity, born });
    },
    formeDEclat: sparkGeo,
    animer: (t, dt, reduit) => {
      // Les fumées bougent, ou prennent leur pose immobile avec « Réduire les animations » (R4b-6e).
      sol?.decor.animer(t, dt, reduit);
      if (reduit) return;
      // Éclats : petits cubes qui retombent et disparaissent.
      for (const s of [...sparks]) {
        const age = (instant.now - s.born) / 1000;
        s.velocity.y -= 9 * 0.016;
        s.mesh.position.addScaledVector(s.velocity, 0.016);
        s.mesh.rotation.x += 0.2;
        s.mesh.rotation.z += 0.15;
        if (age > 0.7) {
          scene.remove(s.mesh);
          (s.mesh.material as THREE.Material).dispose();
          sparks.splice(sparks.indexOf(s), 1);
        }
      }
    },
    dispose: () => {
      hover.geometry.dispose();
      (hover.material as THREE.Material).dispose();
      viderLeTerrain();
      sol?.en3D.dispose();
      sol?.decor.dispose();
      for (const s of sparks) (s.mesh.material as THREE.Material).dispose();
      sparkGeo.dispose();
    },
  };
}
