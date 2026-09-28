import { fauneCost, merCost, RENDER_BUDGET, sceneCost, sceneCostArchipeo, toutConstruit } from './budget';
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
  // 18 200 à 25 200 triangles depuis le lot R3 (27 500 à 38 900 en cubes), en un appel (deux dans les Premiers Rivages,
  // pour la lave du volcan).
  for (const a of ARCHIPELAGO_IDS) {
    const { sol, mer, faune, triangles, drawCalls } = sceneCostArchipeo(a);
    expect(sol.drawCalls, a).toBeLessThanOrEqual(2);
    expect(sol.triangles, a).toBeLessThanOrEqual(RENDER_BUDGET.triangles / 2);
    // Et les modèles de la scène (sans la mer ni la faune, que le monde en blocs ne compte pas) ne dessinent pas plus
    // que le monde en blocs.
    const blocs = sceneCost(a);
    expect(triangles - mer.triangles - faune.triangles, a).toBeLessThanOrEqual(blocs.triangles);
    expect(drawCalls - mer.drawCalls - faune.drawCalls, a).toBeLessThan(blocs.drawCalls);
  }
}, 30_000);

it('le rendu Archipéo : la mer en un appel de dessin, la faune et le ciel en trois, en quelques milliers de triangles', () => {
  // Lot R3. Avant : une mer texturée (un appel), et une soixantaine de modèles en cubes pour les nuages, les oiseaux et
  // les baleines, jusqu'à 180 appels quand tout est dans la vue (un nuage en cubes texturés : six appels par cube).
  for (const a of ARCHIPELAGO_IDS) {
    const mer = merCost(a);
    const faune = fauneCost(a);
    expect(mer, a).toEqual(sceneCostArchipeo(a).mer);
    expect(mer.drawCalls, a).toBe(1);
    expect(mer.triangles, a).toBeLessThanOrEqual(6000);
    // Baleines, oiseaux, nuages : une instanciation par famille (pas de baleine aux Îles du Ciel).
    expect(faune.drawCalls, a).toBeLessThanOrEqual(3);
    expect(faune.triangles, a).toBeLessThanOrEqual(1500);
  }
}, 30_000);

// Quand le rendu Archipéo dessine aussi la mer, le décor, la construction et les personnages (lots R3 à R6), ce test
// vérifie sur ses modèles, archipel par archipel : triangles ≤ RENDER_BUDGET.triangles et appels ≤ RENDER_BUDGET.drawCalls.
it.todo('le rendu Archipéo tient le budget des tablettes : 60 000 triangles et 40 appels de dessin par archipel');
