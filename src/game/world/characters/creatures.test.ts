// Les créatures en cubes de Blocland (world/characters/creatures.ts) : ce que leur silhouette doit dire.
import { CREATURE_CUBES } from './creatures';

describe('Voix, le panda roux délégué (DA, relecture des captures emc-2, passe 2)', () => {
  const cubes = CREATURE_CUBES['civics-6e-democratic-society'];
  const oreilles = Math.max(...cubes.filter((c) => c.color === '#f2ebe0').map((c) => c.z));

  it('lève une patte droite au-dessus de la tête, un bloc d’écart avec elle, la paume ouverte au bout', () => {
    const haut = Math.max(...cubes.map((c) => c.z));
    expect(haut).toBeGreaterThanOrEqual(oreilles + 2);
    // La patte : une colonne, la seule chose au-dessus des oreilles ; un bloc vide entre elle et la tête.
    const dessus = cubes.filter((c) => c.z > oreilles);
    const x = Math.max(...cubes.map((c) => c.x));
    expect(dessus.every((c) => c.x === x)).toBe(true);
    const tete = cubes.filter((c) => c.z <= oreilles && c.z >= oreilles - 3 && c.x < x);
    expect(Math.max(...tete.map((c) => c.x))).toBe(x - 2);
    // La paume, fauve, au bout, tournée vers l'élève (y = 0).
    expect(cubes.find((c) => c.z === haut)).toMatchObject({ x, y: 0, color: '#dca468' });
  });

  it('tient son carnet devant sa poitrine : la page devant tout le reste, la couverture de cuir sur le dessus', () => {
    const carnet = cubes.filter((c) => c.top === '#8a5a32');
    expect(carnet.length).toBeGreaterThanOrEqual(2);
    for (const c of carnet) expect(c.y).toBe(0);
    // Rien d'autre que le carnet et la patte qui le tient sur la rangée de devant.
    expect(cubes.filter((c) => c.y === 0 && c.z < oreilles && !c.top).length).toBeLessThanOrEqual(1);
  });
});
