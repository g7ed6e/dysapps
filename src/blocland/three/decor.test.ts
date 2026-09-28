import { Pinceau } from '../world/decor/pinceau';
import { Fumees, bouffees } from '../world/decor/fumee';
import type { MaillageDuDecor } from '../world/decorMesh';
import type { VoxelCube } from '../Voxel';
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
  return { decor: P.fin(), lueurs: L.fin(), fumees: F.fin('6e'), elements: [] };
}

it('la lanterne passe de ses couleurs de jour à celles de nuit sans toucher au maillage ; la fumée bouge, sauf si on réduit', () => {
  const d = creerDecor();
  const m = decor();
  const jour = Float32Array.from(m.lueurs.colors);
  d.peindre(m);
  const [, lueurs, fumee] = d.group.children as import('three').Mesh[];
  const couleur = () => Array.from(lueurs.geometry.getAttribute('color').array as Float32Array);
  d.animer(0, 0, false);
  expect(couleur().slice(0, 3).map((v) => +v.toFixed(3))).toEqual([1, 0.8, 0.2]);
  expect(Array.from(m.lueurs.colors)).toEqual(Array.from(jour));
  d.animer(0, 1, false);
  expect(couleur()).toEqual(Array.from(jour));
  const pos = () => Array.from(fumee.geometry.getAttribute('position').array as Float32Array);
  d.animer(1, 1, false);
  const a = pos();
  d.animer(2, 1, false);
  expect(pos()).not.toEqual(a);
  d.animer(3, 1, true);
  expect(pos()).toEqual(Array.from(m.fumees.facettes.positions));
  // La fumée ne se touche pas.
  expect(fumee.raycast.length).toBe(0);
  d.dispose();
  expect(d.group.children.length).toBe(0);
});
