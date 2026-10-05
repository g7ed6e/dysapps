import { Pinceau } from '../world/decor/brush';
import { Fumees, bouffees } from '../world/decor/smoke';
import type { MaillageDuDecor } from '../world/decorMesh';
import type { VoxelCube } from '../world/cube';
import * as THREE from 'three';
import { dessinerLointain } from '../world/decor/distant';
import { creerDecor } from './decor';

/** Un décor minimal : un triangle de décor, un triangle de lueur qui a sa couleur de nuit, une petite fumée. */
function decor(): MaillageDuDecor {
  const P = new Pinceau();
  const L = new Pinceau();
  const F = new Fumees();
  const peint = () => [0.5, 0.5, 0.5] as [number, number, number];
  P.triangle([0, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1], peint);
  L.deNuit = () => [1, 0.8, 0.2];
  L.triangle([0, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1], () => [0.6, 0.8, 0.9]);
  L.deNuit = null;
  const cubes = [0, 1, 2].map((k) => ({ x: k, y: 0, z: 3 + k, color: '#a9a4a0' }) as VoxelCube);
  let h = 0.3;
  bouffees(F, cubes, () => (h = (h * 7.1) % 1), 0, [200, 210, 220]);
  return { decor: P.fin(), lueurs: L.fin(), fumees: F.fin('6e'), elements: [], debutDuLointain: 1, debutDesFumeesAuLoin: Infinity };
}

it('la lanterne passe de ses couleurs de jour à celles de nuit sans toucher au maillage ; la fumée bouge, sauf si on réduit', () => {
  const d = creerDecor();
  const m = decor();
  const jour = Float32Array.from(m.lueurs.colors);
  d.peindre(m);
  const [, lueurs, fumee] = d.group.children as import('three').Mesh[];
  const couleur = () => Array.from(lueurs.geometry.getAttribute('color').array as Float32Array);
  d.jour(0);
  expect(couleur().slice(0, 3).map((v) => +v.toFixed(3))).toEqual([1, 0.8, 0.2]);
  expect(Array.from(m.lueurs.colors)).toEqual(Array.from(jour));
  d.jour(1);
  expect(couleur()).toEqual(Array.from(jour));
  const pos = () => Array.from(fumee.geometry.getAttribute('position').array as Float32Array);
  d.animer(1, 0.016, false);
  const a = pos();
  d.animer(2, 0.016, false);
  expect(pos()).not.toEqual(a);
  d.animer(3, 0.016, true);
  expect(pos()).toEqual(Array.from(m.fumees.facettes.positions));
  // La fumée ne se touche pas.
  expect(fumee.raycast.length).toBe(0);
  d.dispose();
  expect(d.group.children.length).toBe(0);
});

it('le lointain se cache sur la Carte et ne se touche jamais ; le décor devant lui, si', () => {
  const P = new Pinceau();
  // Un triangle de décor face à la caméra, en z = 0 ; le lointain loin derrière.
  P.element = 0;
  P.quad([-1, 0, 0], [1, 0, 0], [1, 2, 0], [-1, 2, 0], [0, 1, 1], () => [0.5, 0.5, 0.5]);
  const debut = P.triangles;
  dessinerLointain(P, { minX: -10, maxX: 10, minY: -10, maxY: 0 }, { graine: 't', pieces: [{ genre: 'gradins', u: 0.5, recul: 60, haut: 20, rayon: 6, marche: 2.5, retrait: 0.6, pans: 7, couleur: 0x6895ad, sommet: 0x6f8f6a }] });
  const m: MaillageDuDecor = { decor: P.fin(), lueurs: new Pinceau().fin(), fumees: new Fumees().fin('5e'), elements: [], debutDuLointain: debut, debutDesFumeesAuLoin: Infinity };
  const instant = { carte: false };
  const d = creerDecor(instant);
  d.peindre(m);
  const [mesh] = d.group.children as THREE.Mesh[];
  const lancer = (x: number, y: number) => new THREE.Raycaster(new THREE.Vector3(x, y, -5), new THREE.Vector3(0, 0, 1)).intersectObject(mesh);
  // Le décor se touche ; le lointain, jamais.
  expect(lancer(-0.5, 1.5).map((h) => h.faceIndex)).toEqual([1]);
  expect(lancer(0, 10)).toEqual([]);
  // Sans le filtre, le rayon l'aurait bien rencontré.
  expect(new THREE.Raycaster(new THREE.Vector3(0, 10, -5), new THREE.Vector3(0, 0, 1)).intersectObject(new THREE.Mesh(mesh.geometry, mesh.material)).length).toBeGreaterThan(0);
  d.animer(0, 0.016, false);
  expect(mesh.geometry.drawRange.count).toBe(Infinity);
  instant.carte = true;
  d.animer(0, 0.016, false);
  expect(mesh.geometry.drawRange.count).toBe(debut * 3);
  instant.carte = false;
  d.animer(0, 0.016, true);
  expect(mesh.geometry.drawRange.count).toBe(Infinity);
  d.dispose();
});

it('le décor hors de la grille ne se touche pas, le décor voisin si ; les fumées au loin se cachent sur la Carte', () => {
  const P = new Pinceau();
  const peint = () => [0.5, 0.5, 0.5] as [number, number, number];
  // L'élément 0 (posé) à gauche, l'élément 1 (hors de la grille : la grue du 4e) à droite, face à la caméra.
  P.element = 0;
  P.quad([-3, 0, 0], [-1, 0, 0], [-1, 2, 0], [-3, 2, 0], [-2, 1, 1], peint);
  P.element = 1;
  P.quad([1, 0, 0], [3, 0, 0], [3, 2, 0], [1, 2, 0], [2, 1, 1], peint);
  const F = new Fumees();
  const cubes = (x: number) => [0, 1].map((k) => ({ x, y: 0, z: 3 + k, color: '#a9a4a0' }) as VoxelCube);
  bouffees(F, cubes(0), () => 0.5, 0, [200, 210, 220]);
  const debut = F.P.triangles;
  bouffees(F, cubes(50), () => 0.5, 0, [200, 210, 220]);
  const pose = { cubes: [], x: 0, y: 0, z: 0, emprise: 1, muted: false };
  const m: MaillageDuDecor = {
    decor: P.fin(),
    lueurs: new Pinceau().fin(),
    fumees: F.fin('4e'),
    elements: [
      { ...pose, id: 'a', genre: 'rocher' },
      { ...pose, id: 'hors-grille/grue@1,0', genre: 'grue', horsGrille: true },
    ],
    debutDuLointain: 4,
    debutDesFumeesAuLoin: debut,
  };
  const instant = { carte: false };
  const d = creerDecor(instant);
  d.peindre(m);
  const [mesh, fumee] = d.group.children as THREE.Mesh[];
  const lancer = (x: number) => new THREE.Raycaster(new THREE.Vector3(x, 1.6, -5), new THREE.Vector3(0, 0, 1)).intersectObject(mesh);
  expect(lancer(-2.5)).toHaveLength(1);
  expect(lancer(2.5)).toEqual([]);
  expect(new THREE.Raycaster(new THREE.Vector3(2.5, 1.6, -5), new THREE.Vector3(0, 0, 1)).intersectObject(new THREE.Mesh(mesh.geometry, mesh.material)).length).toBe(1);
  instant.carte = true;
  d.animer(0, 0.016, false);
  expect(fumee.geometry.drawRange.count).toBe(debut * 3);
  instant.carte = false;
  d.animer(0, 0.016, false);
  expect(fumee.geometry.drawRange.count).toBe(Infinity);
  d.dispose();
});
