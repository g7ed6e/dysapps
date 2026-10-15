import type { VoxelCube } from './cube';
import { metamorphosisFlights, metamorphosisPose } from './metamorphosis';

const cube = (x: number, y: number, z: number, color: string): VoxelCube => ({ x, y, z, color });

it('la mue : chaque cube gardé vole vers la case la plus proche de même apparence, les autres rapetissent ou grandissent', () => {
  const avant = [cube(0, 0, 0, 'bois'), cube(5, 0, 0, 'bois'), cube(0, 1, 0, 'voile')];
  const apres = [cube(4, 0, 2, 'bois'), cube(1, 1, 1, 'verre')];
  const vols = metamorphosisFlights(avant, apres);
  expect(vols).toHaveLength(4);
  const bois = vols.find((f) => f.to?.x === 4)!;
  expect(bois.from).toEqual({ x: 5, y: 0, z: 0 });
  expect(vols.find((f) => f.cube.color === 'verre')!.from).toBeNull();
  expect(vols.filter((f) => f.to === null).map((f) => f.cube.color).sort()).toEqual(['bois', 'voile']);
  // Au départ, tout est à sa place d'avant ; à la fin, à sa place d'après ; ce qui part a disparu, le neuf est entier.
  expect(metamorphosisPose(bois, 0)).toEqual({ x: 5, y: 0, z: 0, scale: 1 });
  expect(metamorphosisPose(bois, 1)).toEqual({ x: 4, y: 0, z: 2, scale: 1 });
  for (const f of vols) {
    expect(metamorphosisPose(f, f.to ? 1 : 0).scale).toBe(f.to || f.from ? 1 : 0);
    if (!f.to) expect(metamorphosisPose(f, 1).scale).toBe(0);
    if (!f.from) expect(metamorphosisPose(f, 0).scale).toBe(0);
  }
});
