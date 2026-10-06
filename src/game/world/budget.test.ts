import { BADGES } from '../../core/progress';
import { trophyBlock } from '../trophies';
import { APPEL_DU_PASSAGE, bornesCost, linkCubes, worstCaseOfRegion, commandesCost, constructionCost, decorCost, ENVELOPPES, enveloppeDe, fauneCost, merCost, navireCost, personnagesCost, PLAFOND_DU_MONDE_EN_BLOCS, RENDER_BUDGET, RENDER_BUDGET_6E, sceneCost, sceneCostArchipeo, signesCost, solCost, toutConstruit, type Poste } from './budget';
import { ARCHIPELAGO_IDS, type ArchipelagoId, mapOf } from './map';
import { chooseGuardian, chooseIsland } from './arrangeMode';
import { arrangeView, arrangeViewCost } from './arrangeView';
import { BUDGET_DES_BOUTS, BUDGET_DES_POIGNEES, coutDesBouts, coutDesPoignees, linkEndHandles } from './arrangeHandles';
import { buildMesh } from './mesher';
import { worldCubes } from './terrain';
import { SHORT_LENGTH, LONG_LENGTH } from './routing';

it('prépare une partie vraiment tout construite (Gardiens vaincus, navire, ouvrages)', () => {
  const { progress, world: village } = toutConstruit();
  expect(progress['french-6e-phonology-challenge'].stars).toBe(3);
  expect(Object.keys(village.parts).length).toBeGreaterThan(40);
  expect(village.links).toContain('passage-5e');
});

it('le monde en blocs ne recule pas : triangles et appels de dessin de chaque archipel tout construit', () => {
  // Mesuré au lot R0 (terrain, créatures, Gardiens, navire, bonhomme) : 77 216 triangles et 234 appels dans les
  // Premiers Rivages, 46 500 à 52 300 triangles et 184 à 193 appels ailleurs. C'est au-dessus du budget d'Archipéo :
  // le monde en blocs ne le tiendra pas ; ces plafonds l'empêchent seulement de grossir jusqu'à son remplacement (lot 6).
  for (const a of ARCHIPELAGO_IDS) {
    const { triangles, drawCalls } = sceneCost(a);
    expect(triangles, a).toBeLessThanOrEqual(PLAFOND_DU_MONDE_EN_BLOCS.triangles);
    expect(drawCalls, a).toBeLessThanOrEqual(PLAFOND_DU_MONDE_EN_BLOCS.drawCalls);
  }
  expect(RENDER_BUDGET).toEqual({ triangles: 60_000, drawCalls: 40 });
  expect(RENDER_BUDGET_6E).toEqual({ triangles: 72_800, drawCalls: 40 });
});

it('les petites constructions des commandes (GD-7, PR 3) se fondent dans le terrain : aucun appel de plus, sous le plafond', () => {
  for (const a of ARCHIPELAGO_IDS) {
    const sans = sceneCost(a);
    const avec = sceneCost(a, true);
    expect(avec.drawCalls, a).toBe(sans.drawCalls);
    expect(avec.triangles, a).toBeGreaterThan(sans.triangles);
    expect(avec.triangles, a).toBeLessThanOrEqual(PLAFOND_DU_MONDE_EN_BLOCS.triangles);
  }
});

it('les bulles des objets touchables (proposition P2) : trois quadrilatères en un appel, et le monde en blocs reste sous son plafond', () => {
  for (const a of ARCHIPELAGO_IDS) {
    const signes = signesCost();
    // Trois bulles au plus à la fois, dans le maillage des plaques des créatures, quel que soit l'état du jeu.
    expect(signes, a).toEqual({ triangles: 6, drawCalls: 1 });
    // Avec les petites constructions des commandes, sous le plafond.
    const blocs = sceneCost(a, true);
    expect(blocs.triangles + signes.triangles, a).toBeLessThanOrEqual(PLAFOND_DU_MONDE_EN_BLOCS.triangles);
    expect(blocs.drawCalls + signes.drawCalls, a).toBeLessThanOrEqual(PLAFOND_DU_MONDE_EN_BLOCS.drawCalls);
  }
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
    // Aux Premiers Rivages, la moitié de leur budget relevé (SC-2 : 32 724 mesurés, mainteneur, 6 octobre 2026).
    expect(sol.triangles, a).toBeLessThanOrEqual((a === '6e' ? RENDER_BUDGET_6E : RENDER_BUDGET).triangles / 2);
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
    // 6 200 aux Premiers Rivages depuis que la mer couvre tout le cadre de la région (GD-9) ; les îles de sciences (SC-2)
    // tiennent dans le même cadre.
    expect(mer.triangles, a).toBeLessThanOrEqual(6300);
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
      const budget = a === '6e' ? RENDER_BUDGET_6E : RENDER_BUDGET;
      expect(somme.triangles, a).toBeLessThanOrEqual(budget.triangles);
      expect(somme.drawCalls + APPEL_DU_PASSAGE, a).toBeLessThanOrEqual(budget.drawCalls);
    }
  });

  // Ailleurs, 52 300 jusqu'au cœur agrandi de l'Atelier (01/10/2026) : son sol en demande 660 de plus (world/budget.ts),
  // enveloppe validée par le mainteneur le 01/10/2026 ; 53 040 avec la Halle aux matériaux (GD-2, validé par le mainteneur le 01/10/2026, world/budget.ts), 53 060 avec la salle des trophées (GD-3, même jour).
  // HG-2 (mainteneur, 6 octobre 2026) : les Premiers Rivages passent de 59 500 à 63 370 avec les deux îles d'histoire-géographie,
  // puis à 72 770 avec les trois îles de sciences (SC-2, même mot : « Budget on augmente pour l'instant »).
  it('les enveloppes décidées le 28 septembre 2026, relevées depuis (GD-9, puis HG-2 et SC-2 : les îles d’histoire-géographie et de sciences) : 72 770 triangles et 25 appels aux Premiers Rivages, 55 790 et 24 ailleurs', () => {
    const total = (a: '6e' | '5e') => postes.reduce((n, p) => n + enveloppeDe(p, a).triangles, 0);
    const appels = (a: '6e' | '5e') => postes.reduce((n, p) => n + enveloppeDe(p, a).drawCalls, 0);
    expect([total('6e'), appels('6e')]).toEqual([72_770, 25]);
    expect([total('5e'), appels('5e')]).toEqual([55_790, 24]);
  });

  // GD-3 : la salle des trophées change avec les succès (une travée au 13e et au 19e, les trophées sous le toit) ; la
  // construction tient son enveloppe à chaque palier : sans succès, la salle de départ pleine (12), chaque travée à son
  // arrivée (13, 19) et pleine (18, 24). Entre deux paliers, un succès de plus n'ajoute qu'un trophée : le plus haut
  // compte d'un palier est à sa fin.
  it('R5 et GD-3 : la construction tient son enveloppe à chaque palier de la salle (0, 12, 13, 18, 19, 24 succès), dans chaque archipel', () => {
    const blocs = BADGES.map((b) => trophyBlock(b.id));
    for (const a of ARCHIPELAGO_IDS)
      for (const n of [0, 12, 13, 18, 19, blocs.length]) {
        const m = constructionCost(a, blocs.slice(0, n));
        expect(m.triangles, `${a}, ${n} succès`).toBeLessThanOrEqual(enveloppeDe('construction', a).triangles);
        expect(m.drawCalls, `${a}, ${n} succès`).toBeLessThanOrEqual(enveloppeDe('construction', a).drawCalls);
      }
  }, 60_000);

  // Chaque lot change la ligne de son poste en plafond, mesuré sur le rendu Archipéo de chaque archipel tout construit :
  // triangles ≤ enveloppeDe(poste, a).triangles et appels ≤ enveloppeDe(poste, a).drawCalls.
  // R5 : ses trois postes dans les quatre archipels.
  const R5: Partial<Record<Poste, (a: ArchipelagoId) => { triangles: number; drawCalls: number }>> = { construction: constructionCost, bornes: bornesCost, navire: navireCost };
  // R4b-6e : les quatre postes de R4b aux Premiers Rivages ; les autres archipels suivent avec leur sous-lot.
  const COUTS: Partial<Record<Poste, (a: ArchipelagoId) => { triangles: number; drawCalls: number }>> = { sol: solCost, mer: merCost, faune: fauneCost, decor: decorCost };
  const PERSONNAGES = ['bonhomme', 'creatures', 'gardiens'] as const;
  // GD-7 dans Archipéo (4 octobre 2026) : les petites constructions de toutes les commandes livrées, dans le sol et la
  // construction taillée, tiennent leur poste, sans appel de dessin de plus.
  it('GD-7 : le poste « Commandes » tient dans son enveloppe, sans appel de plus, dans chaque archipel', () => {
    for (const a of ARCHIPELAGO_IDS) {
      const m = commandesCost(a);
      expect(m.triangles, a).toBeGreaterThan(0);
      expect(m.triangles, a).toBeLessThanOrEqual(enveloppeDe('commandes', a).triangles);
      expect(m.drawCalls, a).toBe(0);
    }
  }, 60_000);
  for (const p of postes) {
    if ((PERSONNAGES as readonly Poste[]).includes(p) || p === 'commandes') continue;
    const cout = COUTS[p];
    const r5 = R5[p];
    if (r5) {
      it(`R5 : le poste « ${ENVELOPPES[p].nom} » tient dans son enveloppe, dans chaque archipel`, () => {
        for (const a of ARCHIPELAGO_IDS) {
          const m = r5(a);
          expect(m.triangles, `${p} ${a}`).toBeLessThanOrEqual(enveloppeDe(p, a).triangles);
          expect(m.drawCalls, `${p} ${a}`).toBeLessThanOrEqual(enveloppeDe(p, a).drawCalls);
        }
      }, 30_000);
    } else if (ENVELOPPES[p].lot === 'R4b' && cout) {
      it(`R4b-6e : le poste « ${ENVELOPPES[p].nom} » tient dans son enveloppe aux Premiers Rivages`, () => {
        const c = cout('6e');
        expect(c.triangles).toBeLessThanOrEqual(enveloppeDe(p, '6e').triangles);
        expect(c.drawCalls).toBeLessThanOrEqual(enveloppeDe(p, '6e').drawCalls);
      }, 30_000);
      it(`R4b-5e : le poste « ${ENVELOPPES[p].nom} » tient dans son enveloppe aux Îles Brumeuses`, () => {
        const c = cout('5e');
        expect(c.triangles).toBeLessThanOrEqual(enveloppeDe(p, '5e').triangles);
        expect(c.drawCalls).toBeLessThanOrEqual(enveloppeDe(p, '5e').drawCalls);
      }, 30_000);
      it(`R4b-3e : le poste « ${ENVELOPPES[p].nom} » tient dans son enveloppe aux Îles du Ciel`, () => {
        const c = cout('3e');
        expect(c.triangles).toBeLessThanOrEqual(enveloppeDe(p, '3e').triangles);
        expect(c.drawCalls).toBeLessThanOrEqual(enveloppeDe(p, '3e').drawCalls);
      }, 30_000);
    } else it.todo(`${ENVELOPPES[p].lot} : le poste « ${ENVELOPPES[p].nom} » tient dans son enveloppe, dans chaque archipel`);
  }
  // R4b-4e : les quatre postes de R4b aux Anciens Ateliers (grue, fourneau, lointain et fumées compris).
  for (const p of postes) {
    const cout = COUTS[p];
    if (ENVELOPPES[p].lot === 'R4b' && cout)
      it(`R4b-4e : le poste « ${ENVELOPPES[p].nom} » tient dans son enveloppe aux Anciens Ateliers`, () => {
        const c = cout('4e');
        expect(c.triangles).toBeLessThanOrEqual(enveloppeDe(p, '4e').triangles);
        expect(c.drawCalls).toBeLessThanOrEqual(enveloppeDe(p, '4e').drawCalls);
      }, 30_000);
  }

  // Lot R6 : mesuré sur les modèles purs que la vue 3D dessinera (world/characters/merges.ts), placés sur la grille
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

it('GD-9, HG-2 puis SC-2 : le plafond du monde en blocs passe à 88 000 triangles, puis à 100 000 triangles et 256 appels, puis 180 appels après le lot qui fond les couleurs (SC-2, #372 ; mainteneur, 6 octobre 2026)', () => {
  expect(PLAFOND_DU_MONDE_EN_BLOCS).toEqual({ triangles: 100_000, drawCalls: 180 });
});

it('GD-9 : au pire (autant de liaisons qu’un graphe planaire en a, au plus long, et toutes les réunions), chaque région tient sous le plafond', () => {
  for (const a of ARCHIPELAGO_IDS) {
    const pire = worstCaseOfRegion(a);
    expect(pire.triangles, a).toBeLessThanOrEqual(PLAFOND_DU_MONDE_EN_BLOCS.triangles);
    expect(pire.drawCalls, a).toBeLessThanOrEqual(PLAFOND_DU_MONDE_EN_BLOCS.drawCalls);
    // Le pire cas compte plus que le monde d'aujourd'hui.
    expect(pire.triangles, a).toBeGreaterThan(sceneCost(a, true).triangles);
  }
  // Le pire cas du 6e compte 105 liaisons possibles depuis les sciences (SC-2) : plus de 3 s seul, plus de 5 s avec la suite.
}, 20_000);

// Ces deux tests construisent le dessin de chaque choix possible de chaque région (plusieurs secondes sur la CI) : un délai
// à leur mesure plutôt que les 5 s par défaut.
it('GD-9 : au pire de chaque région, le dessin d’un choix du mode « Aménager » (au plus grand nombre de places) tient aussi sous le plafond', () => {
  const { world } = toutConstruit();
  for (const a of ARCHIPELAGO_IDS) {
    const pire = worstCaseOfRegion(a);
    let plus = { triangles: 0, drawCalls: 0, places: 0 };
    for (const id of mapOf(a).map((d) => d.id)) {
      const choix = [chooseIsland(world, id), chooseGuardian(world, id)].filter((c) => c !== null);
      for (const c of choix) {
        const v = arrangeView(world, c);
        const cout = arrangeViewCost(v);
        if (cout.triangles > plus.triangles) plus = { ...cout, places: v.cases.filter((k) => k.genre === 'place').length };
      }
    }
    // Les places libres autour du fantôme : sept sur sept au plus, la sienne non comprise.
    expect(plus.places, a).toBeLessThanOrEqual(48);
    expect(pire.triangles + plus.triangles, a).toBeLessThanOrEqual(PLAFOND_DU_MONDE_EN_BLOCS.triangles);
    // Deux appels de plus, pendant un choix seulement (mainteneur, 5 octobre 2026 : quelques appels passagers acceptés) :
    // les cases du choix, et les poignées dessinées autour de lui (directeur artistique, 6 octobre 2026).
    expect(plus.drawCalls, a).toBeLessThanOrEqual(2);
  }
}, 20_000);

it('GD-9 : les poignées du mode « Modifier le plan » (les flèches et « Tourner ») : un appel, 400 triangles au plus, seulement pendant un choix', () => {
  const { world } = toutConstruit();
  expect(BUDGET_DES_POIGNEES).toEqual({ triangles: 400, drawCalls: 1 });
  for (const a of ARCHIPELAGO_IDS)
    for (const id of mapOf(a).map((d) => d.id))
      for (const c of [chooseIsland(world, id), chooseGuardian(world, id)].filter((c) => c !== null)) {
        const v = arrangeView(world, c);
        for (const style of ['blocs', 'peint'] as const) {
          const p = coutDesPoignees(v.poignees, style);
          expect(p.triangles, `${id} ${style}`).toBeLessThanOrEqual(BUDGET_DES_POIGNEES.triangles);
          expect(p.drawCalls, `${id} ${style}`).toBe(1);
        }
        // Dans le coût du dessin du choix : un appel pour les cases, un pour les poignées.
        expect(arrangeViewCost(v).triangles).toBe(2 * v.cases.length + coutDesPoignees(v.poignees, 'blocs').triangles);
      }
  // Hors d'un choix, rien.
  expect(arrangeViewCost(null)).toEqual({ triangles: 0, drawCalls: 0 });
}, 20_000);

it('GD-9, choix 1a : les poignées des bouts de liaison, sans choix, un appel et 480 triangles au plus, même au pire (autant de liaisons qu’un graphe planaire en a)', () => {
  const { world } = toutConstruit();
  for (const a of ARCHIPELAGO_IDS) {
    const c = coutDesBouts(linkEndHandles(world, a).length);
    expect(c.triangles, a).toBeLessThanOrEqual(BUDGET_DES_BOUTS.triangles);
    expect(c.drawCalls, a).toBe(1);
    // Au pire : 3 n − 6 liaisons entre n lieux, deux bouts chacune.
    const n = mapOf(a).length;
    expect(coutDesBouts(2 * (3 * n - 6)).triangles, a).toBeLessThanOrEqual(BUDGET_DES_BOUTS.triangles);
  }
});

it('GD-9 : une liaison au plus long, de chaque sorte, ne prend aucun matériau nouveau (aucun appel de plus)', () => {
  const { progress, world } = toutConstruit();
  for (const a of ARCHIPELAGO_IDS) {
    const terrain = worldCubes(a, progress, world, false);
    const avant = buildMesh(terrain).length;
    for (const [kind, n] of [['bac', LONG_LENGTH], ['pont', LONG_LENGTH], ['pont', SHORT_LENGTH], ['sentier', SHORT_LENGTH]] as const)
      expect(buildMesh([...terrain, ...linkCubes(a, kind, n)]).length, `${a} ${kind}`).toBe(avant);
  }
});
