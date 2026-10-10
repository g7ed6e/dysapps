// Les Gardiens en cubes de Blocland (world/characters/guardians.ts) : ce que leur silhouette doit dire.
import { GUARDIAN_CUBES } from './guardians';

describe('L’Amphore peinte (DA, HG-2)', () => {
  it('a deux anses détachées du col dans sa silhouette de face : elle ne se lit pas comme un tonneau', () => {
    const cubes = GUARDIAN_CUBES['history-6e-antiquity'];
    // De face (vue le long de y), les colonnes pleines de chaque rang ; un rang troué de part et d'autre du col : les anses.
    const rangs = [...new Set(cubes.map((c) => c.z))].map((z) => [...new Set(cubes.filter((c) => c.z === z).map((c) => c.x))].sort((a, b) => a - b));
    const troues = rangs.filter((xs) => xs.length >= 2 && xs.some((x, i) => i > 0 && x - xs[i - 1] > 1));
    expect(troues.length).toBeGreaterThanOrEqual(2);
    // Un vide de chaque côté du col, symétrique.
    for (const xs of troues) {
      const vides = xs.slice(1).flatMap((x, i) => (x - xs[i] > 1 ? [xs[i] + 1] : []));
      expect(vides).toHaveLength(2);
      expect(vides[0] + vides[1]).toBe(xs[0] + xs[xs.length - 1]);
    }
  });
});

describe('Le Cerf des sous-bois (DA, SC-2)', () => {
  it('porte ses bois au-dessus de la tête, trois pointes de chaque côté', () => {
    const cubes = GUARDIAN_CUBES['life-earth-sciences-6e-living-world'];
    const haut = Math.max(...cubes.map((c) => c.z));
    const pointes = (y: number) => {
      const xs = cubes.filter((c) => c.z === haut && c.y === y).map((c) => c.x).sort((a, b) => a - b);
      return xs.filter((x, i) => i === 0 || x - xs[i - 1] > 1).length;
    };
    const cotes = [...new Set(cubes.filter((c) => c.z === haut).map((c) => c.y))];
    expect(cotes).toHaveLength(2);
    for (const y of cotes) expect(pointes(y), `côté ${y}`).toBe(3);
  });
});

describe('L’Hirondelle de nacre (DA, relecture des captures emc-2, passe 2)', () => {
  const cubes = GUARDIAN_CUBES['civics-6e-democratic-society'];
  const max = (k: 'x' | 'y' | 'z') => Math.max(...cubes.map((c) => c[k]));

  it('de profil, la tête vers les x croissants : un bec d’un bloc qui dépasse devant la tête', () => {
    const bout = cubes.filter((c) => c.x === max('x'));
    expect(bout).toHaveLength(1);
    const tete = cubes.filter((c) => c.x === max('x') - 1);
    expect(tete.every((c) => c.z >= bout[0].z - 1)).toBe(true);
  });

  it('une tête petite, sans rien sur ses côtés : à sa hauteur, rien de plus large qu’elle', () => {
    const haut = max('z');
    const largeur = (z: number) => new Set(cubes.filter((c) => c.z === z).map((c) => c.y)).size;
    expect(largeur(haut)).toBeLessThanOrEqual(3);
    expect(cubes.filter((c) => c.z === haut)).toHaveLength(6);
  });

  it('une queue en V, longue, qui s’ouvre à plat : vue d’en haut, deux brins et l’encoche entre eux', () => {
    const queue = cubes.filter((c) => c.x <= 1);
    const ys = [...new Set(queue.map((c) => c.y))].sort((a, b) => a - b);
    expect(ys[0]).toBe(0);
    expect(ys[ys.length - 1]).toBe(max('y'));
    // L'encoche : au bout de la queue, le milieu est vide.
    expect(queue.some((c) => c.y === max('y') / 2)).toBe(false);
  });

  it('le corps clair : la nacre pâle, le ventre blanc (aucune teinte sombre hors des yeux, du bec, des pattes et de la poutre)', () => {
    const lum = (hex: string) => {
      const n = parseInt(hex.slice(1), 16);
      return ((n >> 16) & 255) * 0.3 + ((n >> 8) & 255) * 0.59 + (n & 255) * 0.11;
    };
    const plumes = cubes.filter((c) => c.z >= 3 && lum(c.color) > 80);
    expect(plumes.length).toBeGreaterThan(cubes.length / 2);
    const tons = plumes.map((c) => lum(c.color));
    expect(tons.reduce((a, b) => a + b, 0) / tons.length).toBeGreaterThan(200);
  });
});

describe('Les Gardiens d’argile et le Lynx d’agate (DA, captures emc-4e-3e-1)', () => {
  const haut = (cubes: { z: number }[]) => Math.max(...cubes.map((c) => c.z));

  it('le Centaure : le torse droit au-dessus du poitrail, une petite tête, un livre ouvert en V aux pages claires', () => {
    const cubes = GUARDIAN_CUBES['lca-3e-ideas'];
    const pages = cubes.filter((c) => c.color === '#f2ead8');
    const dos = cubes.filter((c) => c.color === '#7a4a2a');
    // Les deux pages, de part et d'autre du dos, un rang plus haut : un V vu de profil.
    const xs = [...new Set(pages.map((c) => c.x))].sort((a, b) => a - b);
    expect(xs).toHaveLength(2);
    const xDos = [...new Set(dos.map((c) => c.x))];
    expect(xDos).toHaveLength(1);
    expect(xs[0]).toBeLessThan(xDos[0]);
    expect(xs[1]).toBeGreaterThan(xDos[0]);
    expect(Math.min(...pages.map((c) => c.z))).toBe(Math.max(...dos.map((c) => c.z)) + 1);
    // Le torse : au-dessus du corps du cheval, pas plus long que deux blocs, sur l'avant (le poitrail).
    const corps = cubes.filter((c) => c.z === 3);
    const torse = cubes.filter((c) => c.z === 5);
    expect(Math.max(...torse.map((c) => c.x))).toBe(Math.max(...corps.map((c) => c.x)));
    expect(new Set(torse.map((c) => c.x)).size).toBeLessThanOrEqual(2);
    // La tête : un bloc de long, bien moins que le corps du cheval (cinq).
    const tete = cubes.filter((c) => c.z === haut(cubes) - 1 && c.color !== '#5a3a24');
    expect(new Set(tete.map((c) => c.x)).size).toBe(1);
  });

  it('la Cigale : trapue, deux gros yeux qui saillent, les ailes en toit plus longues que le corps et plus claires', () => {
    const cubes = GUARDIAN_CUBES['lca-4e-cities'];
    const corps = cubes.filter((c) => c.color === '#c4703e');
    const ailes = cubes.filter((c) => c.color === '#efc896' || c.color === '#a8603a');
    const longueur = (cs: { x: number }[]) => Math.max(...cs.map((c) => c.x)) - Math.min(...cs.map((c) => c.x)) + 1;
    expect(longueur(ailes)).toBeGreaterThan(longueur(corps.filter((c) => c.y >= 1 && c.y <= 3)) - 2);
    expect(Math.min(...ailes.map((c) => c.x))).toBeLessThan(Math.min(...corps.map((c) => c.x)));
    // Le toit : plus haut au milieu (y = 2) que sur les bords.
    const z = (y: number) => Math.max(...ailes.filter((c) => c.y === y).map((c) => c.z));
    expect(z(2)).toBeGreaterThan(z(1));
    expect(z(1)).toBeGreaterThan(z(0));
    // Les yeux, hors de la largeur du corps, de chaque côté.
    const yeux = cubes.filter((c) => c.color === '#2a1c16');
    expect(yeux.map((c) => c.y).sort()).toEqual([0, 4]);
  });

  it('le Lynx : des pinceaux noirs de deux blocs aux oreilles, une queue courte au bout noir, des favoris clairs qui débordent', () => {
    const cubes = GUARDIAN_CUBES['civics-4e-rights-freedoms'];
    const h = haut(cubes);
    const pinceaux = cubes.filter((c) => c.z >= h - 1);
    expect(pinceaux.every((c) => c.color === '#2a1e18')).toBe(true);
    expect(pinceaux).toHaveLength(4);
    const queue = cubes.filter((c) => c.x === 0);
    expect(queue.length).toBeGreaterThanOrEqual(2);
    expect(queue.every((c) => c.color === '#2a1e18')).toBe(true);
    // Les favoris : clairs, sur les rangs du bord (y 0 et 4), où rien d'autre n'est à leur hauteur.
    const favoris = cubes.filter((c) => (c.y === 0 || c.y === 4) && c.z >= 4);
    expect(favoris.length).toBeGreaterThanOrEqual(6);
    expect(favoris.every((c) => c.color === '#efd9b4')).toBe(true);
  });
});
