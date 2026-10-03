// La flèche d'un ouvrage sur la Carte (GD-7) : une autre forme que celle d'une île, dans la même boîte.
import { formeDeLaFlecheDOuvrage } from './labelCanvas';
import { tracesDeLIcone } from '../../components/iconeTracee';
import { CHEMIN_DE_L_OUVRAGE, TRAITS_DE_L_OUVRAGE } from '../../components/iconeOuvrage';

it('la flèche d’un ouvrage tient dans la boîte de la flèche d’une île, pointe en bas, l’icône dans sa plaque', () => {
  const h = 48;
  const { plaque, pointe, pont } = formeDeLaFlecheDOuvrage(100, 200, h);
  const points = [...pointe, { x: plaque.x, y: plaque.y }, { x: plaque.x + plaque.w, y: plaque.y + plaque.h }];
  // La boîte que le placement des étiquettes et le cadrage réservent : `h` de haut au-dessus de la pointe, 0,8 `h` de large.
  for (const p of points) {
    expect(p.y).toBeGreaterThanOrEqual(200 - h);
    expect(p.y).toBeLessThanOrEqual(200);
    expect(Math.abs(p.x - 100)).toBeLessThanOrEqual(0.4 * h);
  }
  // La pointe sur (cx, tipY), la plaque carrée posée sur sa base.
  expect(pointe[2]).toEqual({ x: 100, y: 200 });
  expect(plaque.w).toBe(plaque.h);
  expect(plaque.y + plaque.h).toBeCloseTo(pointe[0].y, 5);
  // Une icône assez grande pour se lire (au moins 20 px sur 48), dans la plaque.
  for (const trait of pont)
    for (const p of trait) {
      expect(p.x).toBeGreaterThan(plaque.x);
      expect(p.x).toBeLessThan(plaque.x + plaque.w);
      expect(p.y).toBeGreaterThan(plaque.y);
      expect(p.y).toBeLessThan(plaque.y + plaque.h);
    }
  expect(plaque.w).toBeGreaterThanOrEqual(0.5 * h);
});

it('l’icône de la plaque est celle des ouvrages de l’application (le pli Ouvrages, Mes blocs) : la même image partout', () => {
  // L'icône `ouvrage` de Icon.tsx, telle que l'application la dessine, en chemin SVG.
  expect(tracesDeLIcone('ouvrage')).toEqual([CHEMIN_DE_L_OUVRAGE]);
  // La plaque reprend ses traits, à l'échelle : mêmes rapports entre les points.
  const { pont } = formeDeLaFlecheDOuvrage(0, 0, 100);
  const u = (pont[0][1].x - pont[0][0].x) / (TRAITS_DE_L_OUVRAGE[0][1][0] - TRAITS_DE_L_OUVRAGE[0][0][0]);
  pont.forEach((trait, i) =>
    trait.forEach((p, k) => {
      expect(p.x - pont[0][0].x).toBeCloseTo((TRAITS_DE_L_OUVRAGE[i][k][0] - TRAITS_DE_L_OUVRAGE[0][0][0]) * u, 6);
      expect(p.y - pont[0][0].y).toBeCloseTo((TRAITS_DE_L_OUVRAGE[i][k][1] - TRAITS_DE_L_OUVRAGE[0][0][1]) * u, 6);
    }),
  );
});
