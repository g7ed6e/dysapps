import { RENDER_BUDGET, sceneCost, toutConstruit } from './budget';
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

// Dès que le rendu Archipéo dessine le monde (lot R2), ce test vérifie sur ses modèles, archipel par archipel :
// triangles ≤ RENDER_BUDGET.triangles et appels de dessin ≤ RENDER_BUDGET.drawCalls.
it.todo('le rendu Archipéo tient le budget des tablettes : 60 000 triangles et 40 appels de dessin par archipel');
