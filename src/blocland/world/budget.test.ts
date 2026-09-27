import { RENDER_BUDGET, sceneCost, sceneCostArchipeo, toutConstruit } from './budget';
import { ARCHIPELAGO_IDS } from './map';

it('prépare une partie vraiment tout construite (Gardiens vaincus, navire, ouvrages)', () => {
  const { progress, village } = toutConstruit();
  expect(progress['foret-gardien'].stars).toBe(3);
  expect(Object.keys(village.plans).length).toBeGreaterThan(40);
  expect(village.bridges).toContain('voyage-5e');
});

it('le monde en blocs ne recule pas : triangles et appels de dessin de chaque archipel tout construit', () => {
  // Mesuré au lot R0 (terrain, créatures, Gardiens, navire, bonhomme) : 77 216 triangles et 234 appels dans les
  // Premiers Rivages, 46 500 à 52 300 triangles et 184 à 193 appels ailleurs. C'est au-dessus du budget d'Archipéo :
  // le monde en blocs ne le tiendra pas ; ces plafonds l'empêchent seulement de grossir jusqu'à son remplacement (lot 6).
  for (const a of ARCHIPELAGO_IDS) {
    const { triangles, drawCalls } = sceneCost(a);
    expect(triangles, a).toBeLessThanOrEqual(80_000);
    expect(drawCalls, a).toBeLessThanOrEqual(240);
  }
  expect(RENDER_BUDGET).toEqual({ triangles: 60_000, drawCalls: 40 });
});

it('le rendu Archipéo : le sol en facettes tient en deux appels de dessin et la moitié du budget des triangles', () => {
  // Lot R2 : le sol et la roche de chaque archipel, tout construit, en un maillage à facettes (world/landMesh.ts) ;
  // 16 100 à 18 100 triangles aujourd'hui (27 500 à 38 900 en cubes), en un appel (deux dans les Premiers Rivages,
  // pour la lave du volcan).
  for (const a of ARCHIPELAGO_IDS) {
    const { sol, triangles, drawCalls } = sceneCostArchipeo(a);
    expect(sol.drawCalls, a).toBeLessThanOrEqual(2);
    expect(sol.triangles, a).toBeLessThanOrEqual(RENDER_BUDGET.triangles / 2);
    // Et la scène entière ne dessine pas plus que le monde en blocs.
    const blocs = sceneCost(a);
    expect(triangles, a).toBeLessThanOrEqual(blocs.triangles);
    expect(drawCalls, a).toBeLessThan(blocs.drawCalls);
  }
});

// Quand le rendu Archipéo dessine aussi la mer, le décor, la construction et les personnages (lots R3 à R6), ce test
// vérifie sur ses modèles, archipel par archipel : triangles ≤ RENDER_BUDGET.triangles et appels ≤ RENDER_BUDGET.drawCalls.
it.todo('le rendu Archipéo tient le budget des tablettes : 60 000 triangles et 40 appels de dessin par archipel');
