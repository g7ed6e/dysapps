// Les créatures en cubes de Blocland (world/characters/creatures.ts) : ce que leur silhouette doit dire.
import { CREATURE_CUBES } from './creatures';

describe('Voix, le panda roux délégué (DA, relecture des captures emc-2, passes 2 et 3)', () => {
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

  it('tient son carnet devant sa poitrine : une plaque bleu nuit de 2 × 3, la tranche blanc cassé dessus, hors du sol (passe 3)', () => {
    const carnet = cubes.filter((c) => c.color === '#142b38');
    expect(carnet).toHaveLength(6);
    for (const c of carnet) expect(c.y).toBe(0);
    expect(new Set(carnet.map((c) => c.x)).size).toBe(2);
    expect(Math.min(...carnet.map((c) => c.z))).toBe(1);
    expect(Math.max(...carnet.map((c) => c.z))).toBe(3);
    // La tranche des pages : le dessus de la rangée du haut, et elle seule.
    expect(carnet.filter((c) => c.top === '#e5ebe3').map((c) => c.z)).toEqual([3, 3]);
    // La patte qui le tient, sombre, au bord, à hauteur de poitrine ; rien d'autre sur la rangée de devant.
    const devant = cubes.filter((c) => c.y === 0 && c.z < oreilles && c.color !== '#142b38');
    expect(devant).toEqual([expect.objectContaining({ color: '#3a2622', z: 2 })]);
    // La truffe reste visible : rien devant elle.
    const truffe = cubes.find((c) => c.y === 1 && c.z === 3 && c.color === '#3a2622');
    expect(truffe).toBeDefined();
    expect(cubes.some((c) => c.y === 0 && c.x === truffe!.x && c.z === truffe!.z)).toBe(false);
  });
});
