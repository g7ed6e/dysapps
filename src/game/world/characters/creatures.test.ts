// Les créatures en cubes de Blocland (world/characters/creatures.ts) : ce que leur silhouette doit dire.
import { CREATURE_CUBES } from './creatures';

describe('Voix, le panda roux délégué (DA, relecture des captures emc-2, passes 2 à 4)', () => {
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
    // La paume, fauve, au bout, tournée vers l'élève : une rangée devant le visage.
    const visage = Math.min(...cubes.filter((c) => c.color === '#f2ebe0').map((c) => c.y));
    expect(cubes.find((c) => c.z === haut)).toMatchObject({ x, y: visage - 1, color: '#dca468' });
  });

  it('tient son carnet à plat devant sa poitrine : 2 × 3 × 1, la couverture bleu nuit dessus, les pages claires sur les tranches (passe 4)', () => {
    const carnet = cubes.filter((c) => c.top === '#142b38');
    expect(carnet).toHaveLength(6);
    for (const c of carnet) expect(c.color).toBe('#e5ebe3');
    // Une plaque à plat : un seul niveau, deux de large, trois de profondeur.
    expect(new Set(carnet.map((c) => c.z))).toEqual(new Set([2]));
    expect(new Set(carnet.map((c) => c.x)).size).toBe(2);
    expect(new Set(carnet.map((c) => c.y))).toEqual(new Set([0, 1, 2]));
    // Jamais au sol : rien sous lui.
    for (const c of carnet) expect(cubes.some((o) => o.x === c.x && o.y === c.y && o.z < c.z)).toBe(false);
    // La couverture se voit d'en haut : rien au-dessus de la plaque.
    for (const c of carnet) expect(cubes.some((o) => o.x === c.x && o.y === c.y && o.z > c.z)).toBe(false);
    // Contre la poitrine rousse, juste sous le masque blanc, sans patte sombre à côté.
    const corps = Math.min(...cubes.filter((c) => c.top !== '#142b38' && c.z < oreilles).map((c) => c.y));
    expect(corps).toBe(3);
    for (const c of carnet.filter((k) => k.y === 2)) {
      expect(cubes.find((o) => o.x === c.x && o.y === 3 && o.z === 2)).toMatchObject({ color: '#b8532c' });
    }
    const voisins = cubes.filter(
      (o) => o.top !== '#142b38' && carnet.some((c) => Math.abs(o.x - c.x) + Math.abs(o.y - c.y) + Math.abs(o.z - c.z) === 1),
    );
    expect(voisins.every((o) => o.color !== '#3a2622')).toBe(true);
    // Rien d'autre devant le corps que le carnet, la patte levée et sa paume.
    const x = Math.max(...cubes.map((c) => c.x));
    expect(cubes.filter((c) => c.y < corps && c.top !== '#142b38').every((c) => c.x === x)).toBe(true);
    // La truffe reste visible : rien devant elle.
    const truffe = cubes.find((c) => c.y === corps && c.z === 3 && c.color === '#3a2622');
    expect(truffe).toBeDefined();
    expect(cubes.some((c) => c.y < corps && c.x === truffe!.x && c.z === truffe!.z)).toBe(false);
  });
});
