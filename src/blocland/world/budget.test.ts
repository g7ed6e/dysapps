import { APPEL_DU_PASSAGE, decorCost, ENVELOPPES, enveloppeDe, fauneCost, merCost, personnagesCost, RENDER_BUDGET, sceneCost, sceneCostArchipeo, solCost, toutConstruit, type Poste } from './budget';
import { ARCHIPELAGO_IDS, type ArchipelagoId } from './map';

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
    const { sol, mer, faune, decor, triangles, drawCalls } = sceneCostArchipeo(a);
    expect(sol.drawCalls, a).toBeLessThanOrEqual(2);
    // Lot R4 : tout le décor (arbres, rochers, repères, cascades, habillage de la mer) en un appel, deux avec ses lueurs,
    // trois avec ses fumées, qui bougent (R4b-6e).
    expect(decor.drawCalls, a).toBeLessThanOrEqual(3);
    expect(decor.triangles, a).toBeLessThanOrEqual(15_000);
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

describe('Les postes du budget d’Archipéo (socle de la piste Rendu, cadrage Archipéo §6)', () => {
  const postes = Object.keys(ENVELOPPES) as Poste[];

  it('la somme des enveloppes tient dans le budget des tablettes, dans chaque archipel, baleine comprise', () => {
    for (const a of ARCHIPELAGO_IDS) {
      const somme = postes.reduce((t, p) => ({ triangles: t.triangles + enveloppeDe(p, a).triangles, drawCalls: t.drawCalls + enveloppeDe(p, a).drawCalls }), { triangles: 0, drawCalls: 0 });
      expect(somme.triangles, a).toBeLessThanOrEqual(RENDER_BUDGET.triangles);
      expect(somme.drawCalls + APPEL_DU_PASSAGE, a).toBeLessThanOrEqual(RENDER_BUDGET.drawCalls);
    }
  });

  it('les enveloppes décidées le 28 septembre 2026 : 57 800 triangles et 25 appels aux Premiers Rivages, 52 300 et 24 ailleurs', () => {
    const total = (a: '6e' | '5e') => postes.reduce((n, p) => n + enveloppeDe(p, a).triangles, 0);
    const appels = (a: '6e' | '5e') => postes.reduce((n, p) => n + enveloppeDe(p, a).drawCalls, 0);
    expect([total('6e'), appels('6e')]).toEqual([57_800, 25]);
    expect([total('5e'), appels('5e')]).toEqual([52_300, 24]);
  });

  // Chaque lot change la ligne de son poste en plafond, mesuré sur le rendu Archipéo de chaque archipel tout construit :
  // triangles ≤ enveloppeDe(poste, a).triangles et appels ≤ enveloppeDe(poste, a).drawCalls.
  // R4b-6e : les quatre postes de R4b aux Premiers Rivages ; les autres archipels suivent avec leur sous-lot.
  const COUTS: Partial<Record<Poste, (a: ArchipelagoId) => { triangles: number; drawCalls: number }>> = { sol: solCost, mer: merCost, faune: fauneCost, decor: decorCost };
  const PERSONNAGES = ['bonhomme', 'creatures', 'gardiens'] as const;
  for (const p of postes) {
    if ((PERSONNAGES as readonly Poste[]).includes(p)) continue;
    const cout = COUTS[p];
    if (ENVELOPPES[p].lot === 'R4b' && cout) {
      it(`R4b-6e : le poste « ${ENVELOPPES[p].nom} » tient dans son enveloppe aux Premiers Rivages`, () => {
        const c = cout('6e');
        expect(c.triangles).toBeLessThanOrEqual(enveloppeDe(p, '6e').triangles);
        expect(c.drawCalls).toBeLessThanOrEqual(enveloppeDe(p, '6e').drawCalls);
      }, 30_000);
      it.todo(`R4b : le poste « ${ENVELOPPES[p].nom} » tient dans son enveloppe dans les trois autres archipels`);
    } else it.todo(`${ENVELOPPES[p].lot} : le poste « ${ENVELOPPES[p].nom} » tient dans son enveloppe, dans chaque archipel`);
  }

  // Lot R6 : mesuré sur les modèles purs que la vue 3D dessinera (world/personnages/fusions.ts), placés sur la grille
  // de l'archipel tout construit : toutes ses créatures en un maillage, tous ses Gardiens en sentinelles en un autre.
  for (const p of PERSONNAGES)
    it(`${ENVELOPPES[p].lot} : le poste « ${ENVELOPPES[p].nom} » tient dans son enveloppe, dans chaque archipel`, () => {
      for (const a of ARCHIPELAGO_IDS) {
        const cout = personnagesCost(a)[p];
        expect(cout.triangles, a).toBeGreaterThan(0);
        expect(cout.triangles, a).toBeLessThanOrEqual(enveloppeDe(p, a).triangles);
        expect(cout.drawCalls, a).toBeLessThanOrEqual(enveloppeDe(p, a).drawCalls);
      }
    });
});
