import { BADGES } from '../../core/progress';
import { trophyBlock } from '../trophies';
import { chargerLesModelesDuDisque } from './characters/imported/fromDisk.testing';
import { APPEL_DU_PASSAGE, bornesCost, linkCubes, worstCaseOfRegion, commandesCost, constructionCost, decorCost, ENVELOPPES, enveloppeDe, fauneCost, merCost, navireCost, personnagesCost, PLAFOND_DU_MONDE_EN_BLOCS, RENDER_BUDGET, RENDER_BUDGET_6E, RENDER_BUDGET_AUTRES, renderBudgetOf, sceneCost, sceneCostArchipeo, signesCost, solCost, toutConstruit, toutConstruitAvecLesCommandes, type Poste } from './budget';
import { ARCHIPELAGO_IDS, type ArchipelagoId, mapOf } from './map';
import { chooseIsland, choiceMiddle, dragChoice } from './arrangeMode';
import { placeTurns } from './arrange';
import { arrangeView, arrangeViewCost } from './arrangeView';
import { BUDGET_DES_POIGNEES, coutDesPoignees } from './arrangeHandles';
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
  expect(RENDER_BUDGET_6E).toEqual({ triangles: 76_500, drawCalls: 40 });
  // GD-12 : 78 700 ailleurs (mainteneur, 9 octobre 2026, carte « Relever ») ; relevé à 86 000 par le mainteneur le
  // 9 octobre 2026 pour le Fournil des partages et la Grotte des légendes (5e).
  expect(RENDER_BUDGET_AUTRES).toEqual({ triangles: 86_000, drawCalls: 40 });
});

it('les petites constructions des commandes (GD-7, PR 3) se fondent dans le terrain : un appel de plus au plus, sous le plafond', () => {
  const [tout, avecLesCommandes] = [toutConstruit(), toutConstruitAvecLesCommandes()];
  for (const a of ARCHIPELAGO_IDS) {
    const sans = sceneCost(a, false, true, tout);
    const avec = sceneCost(a, true, true, avecLesCommandes);
    // Dans les morceaux du terrain (world/blockMesh.ts) : une petite construction n'en ouvre un que s'il n'y avait rien.
    expect(avec.drawCalls, a).toBeLessThanOrEqual(sans.drawCalls + 1);
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
    // Son enveloppe : 17 400 aux Îles Brumeuses depuis une forme par île (GD-12, mainteneur, 9 octobre 2026).
    expect(decor.triangles, a).toBeLessThanOrEqual(enveloppeDe('decor', a).triangles);
    // La moitié du budget relevé de chaque archipel : aux Premiers Rivages depuis SC-2 (32 724 mesurés, mainteneur,
    // 6 octobre 2026), ailleurs depuis SC-3 (37 194 aux Anciens Ateliers, sous 37 450).
    expect(sol.triangles, a).toBeLessThanOrEqual(renderBudgetOf(a).triangles / 2);
    // Et les modèles de la scène (sans la mer ni la faune, que le monde en blocs ne compte pas) ne dessinent pas plus
    // que le monde en blocs cube par cube, comme avant la piste 2 du budget (Blocland en une texture dessine moins).
    const blocs = sceneCost(a, false, false);
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
    // tiennent dans le même cadre. Depuis une forme par île (GD-12), les cadres approfondis : 6 400 aux Îles Brumeuses
    // et aux Anciens Ateliers, 6 900 aux Îles du Ciel (mainteneur, 9 octobre 2026, carte « Relever »).
    expect(mer.triangles, a).toBeLessThanOrEqual(enveloppeDe('mer', a).triangles);
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
      const budget = renderBudgetOf(a);
      expect(somme.triangles, a).toBeLessThanOrEqual(budget.triangles);
      expect(somme.drawCalls + APPEL_DU_PASSAGE, a).toBeLessThanOrEqual(budget.drawCalls);
    }
  });

  // Ailleurs, 52 300 jusqu'au cœur agrandi de l'Atelier (01/10/2026) : son sol en demande 660 de plus (world/budget.ts),
  // enveloppe validée par le mainteneur le 01/10/2026 ; 53 040 avec la Halle aux matériaux (GD-2, validé par le mainteneur le 01/10/2026, world/budget.ts), 53 060 avec la salle des trophées (GD-3, même jour).
  // HG-2 (mainteneur, 6 octobre 2026) : les Premiers Rivages passent de 59 500 à 63 370 avec les deux îles d'histoire-géographie,
  // puis à 72 770 avec les trois îles de sciences (SC-2, même mot : « Budget on augmente pour l'instant »).
  // HG-3 (même mot) : les autres archipels passent de 55 790 à 62 875 avec leurs six îles d'histoire-géographie, puis à
  // 74 805 avec leurs neuf îles de sciences (SC-3), puis à 74 865 avec les programmes 2025-2026 (deux bornes de plus au
  // 4e, la petite construction de la Forge déplacée), puis à 74 877 avec les commandes relevées à 392 (mainteneur,
  // 8 octobre 2026 : le pied de la machine d'Ixe et le perchoir de Cléa, au 4e), puis à 74 985 avec les quêtes de la 5e
  // (GD-10). GD-12, une forme par île (mainteneur, 9 octobre 2026, carte « Relever ») : aux Îles Brumeuses, le décor à
  // 17 400 et la mer à 6 400, le sol ramené à 36 500 (78 635) ; la mer à 6 400 aux Anciens Ateliers (75 535), à 6 900
  // aux Îles du Ciel (76 035). EMC-2 (mainteneur, 9 octobre 2026) : le Préau des délégués, avec les personnages
  // importés, porte les Premiers Rivages à 76 290, sous `RENDER_BUDGET_6E` relevé à 76 500. Le Fournil des partages et
  // la Grotte des légendes (5e), avec la cinquième mission (GD-14) : les Îles Brumeuses à 85 945, aux mesures
  // (world/budget.ts), sous `RENDER_BUDGET_AUTRES` relevé à 86 000 (mainteneur, 9 octobre 2026).
  it('les enveloppes décidées le 28 septembre 2026, relevées depuis (GD-9, puis HG-2, SC-2, HG-3, SC-3, GD-10, GD-12, les personnages importés du 6e, EMC-2, EMC et LCA de 5e) : 76 290 triangles et 25 appels aux Premiers Rivages, 85 945, 75 535 et 76 035 et 24 appels ailleurs', () => {
    const total = (a: ArchipelagoId) => postes.reduce((n, p) => n + enveloppeDe(p, a).triangles, 0);
    const appels = (a: ArchipelagoId) => postes.reduce((n, p) => n + enveloppeDe(p, a).drawCalls, 0);
    expect([total('6e'), appels('6e')]).toEqual([76_290, 25]);
    expect([total('5e'), appels('5e')]).toEqual([85_945, 24]);
    expect([total('4e'), appels('4e')]).toEqual([75_535, 24]);
    expect([total('3e'), appels('3e')]).toEqual([76_035, 24]);
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

  // Les personnages importés du 6e, lus sur le disque comme la vue les charge : au pire, de près sur l'île qui coûte le
  // plus, de loin ailleurs. (En dernier : une fois chargés, ils remplacent les dessinés en code dans ce fichier.)
  it('R6 : avec les personnages importés du 6e, créatures et Gardiens tiennent leur enveloppe aux Premiers Rivages', () => {
    chargerLesModelesDuDisque();
    for (const p of ['creatures', 'gardiens'] as const) {
      const cout = personnagesCost('6e')[p];
      expect(cout.triangles, p).toBeLessThanOrEqual(enveloppeDe(p, '6e').triangles);
      expect(cout.drawCalls, p).toBe(1);
    }
  }, 60_000);
});

it('GD-9, HG-2 puis SC-2 : le plafond du monde en blocs passe à 88 000 triangles, puis à 100 000 triangles et 256 appels, puis 180 appels après le lot qui fond les couleurs (SC-2, #372 ; mainteneur, 6 octobre 2026), puis 120 avec une seule texture pour les blocs (piste 2, 7 octobre 2026), puis 102 000 triangles pour les grands projets du 4e (GD-10, 8 octobre 2026)', () => {
  expect(PLAFOND_DU_MONDE_EN_BLOCS).toEqual({ triangles: 102_000, drawCalls: 120 });
});

/**
 * Les appels qu'une liaison au plus long ajoute à une région, par sorte (« <région> <sorte> ») : au 3e, les galets d'un
 * sentier venaient avec le gué de l'îlot des Gardiens ; l'îlot parti (GD-11, 8 octobre 2026), ils sont trois appels de
 * plus (dessus, côté, dessous). Les autres régions ont des galets ailleurs (décor, petites constructions).
 */
const APPELS_EN_PLUS_D_UNE_LIAISON: Readonly<Record<string, number>> = { '3e sentier': 3 };

it('GD-9 : au pire (autant de liaisons qu’un graphe planaire en a, au plus long, et toutes les réunions), chaque région tient sous le plafond, avec les appels qu’une liaison ajoute', () => {
  for (const a of ARCHIPELAGO_IDS) {
    const pire = worstCaseOfRegion(a);
    expect(pire.triangles, a).toBeLessThanOrEqual(PLAFOND_DU_MONDE_EN_BLOCS.triangles);
    expect(pire.drawCalls, a).toBeLessThanOrEqual(PLAFOND_DU_MONDE_EN_BLOCS.drawCalls);
    // Une liaison qui prend un matériau nouveau (le sentier au 3e) y tient aussi : vérifié ici, où le pire cas est déjà
    // compté, plutôt que de le recompter (1,5 s au 3e) dans le test des liaisons.
    for (const [cle, plus] of Object.entries(APPELS_EN_PLUS_D_UNE_LIAISON))
      if (cle.startsWith(`${a} `)) expect(pire.drawCalls + plus, cle).toBeLessThanOrEqual(PLAFOND_DU_MONDE_EN_BLOCS.drawCalls);
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
      const choix = [chooseIsland(world, id)].filter((c) => c !== null);
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

it('GD-9, choix 1b : pendant le glissé, la grille et l’empreinte (un seul appel, à la place des places libres et des poignées) tiennent sous le plafond', () => {
  const { world } = toutConstruit();
  for (const a of ARCHIPELAGO_IDS) {
    const pire = worstCaseOfRegion(a);
    let sol = 0;
    let plus = { triangles: 0, drawCalls: 0 };
    for (const id of mapOf(a).map((d) => d.id))
      for (const c of [chooseIsland(world, id)].filter((c) => c !== null)) {
        const m = choiceMiddle(c)!;
        // Sur sa place, sur une place voisine, et vers un voisin (une place prise, ses cases barrées).
        for (const [dx, dy] of [[0, 0], [12, 0], [0, -12], [-20, 8], [30, 0]]) {
          const v = arrangeView(world, dragChoice(world, c, { x: m.x + dx, y: m.y + dy }), true);
          sol = Math.max(sol, 2 * v.cases.filter((k) => k.genre === 'grille' || k.genre === 'empreinte' || k.genre === 'socle' || k.genre === 'conflit' || k.genre === 'barre').length);
          const cout = arrangeViewCost(v);
          if (cout.triangles > plus.triangles) plus = cout;
        }
      }
    // Mesuré le 7 octobre 2026, après les relectures : 370 à 382 triangles au pire selon la région (la grille sur l'eau
    // seulement, l'empreinte sur son socle, ses croix) ; 406 au 3e une fois ses îles de sciences et d'histoire-géographie
    // arrivées (#371, #378), d'où 420 : le directeur artistique visait « 300 à 400 », sous la marge d'environ 1 000.
    // 422 au 6e avec les formes des îles (GD-12, trait à sept cases) : plafond relevé à 430 (mainteneur, 9 octobre 2026).
    // 458 au 5e avec le fer du Comptoir et le moulinet du Carrefour (GD-12, formes plus marquées) : plafond relevé à 480
    // pour les formes larges des trois archipels (mainteneur, 9 octobre 2026, « Relever à 480 »).
    expect(sol, a).toBeLessThanOrEqual(480);
    expect(plus.drawCalls, a).toBe(1);
    expect(pire.triangles + plus.triangles, a).toBeLessThanOrEqual(PLAFOND_DU_MONDE_EN_BLOCS.triangles);
  }
}, 30_000);

it('GD-9 : les poignées du mode « Modifier le plan » (les flèches et « Tourner ») : un appel, 400 triangles au plus, seulement pendant un choix', () => {
  const { world } = toutConstruit();
  expect(BUDGET_DES_POIGNEES).toEqual({ triangles: 400, drawCalls: 1 });
  for (const a of ARCHIPELAGO_IDS)
    for (const id of mapOf(a).map((d) => d.id))
      for (const c of [chooseIsland(world, id)].filter((c) => c !== null)) {
        const v = arrangeView(world, c);
        for (const style of ['blocs', 'peint'] as const) {
          const p = coutDesPoignees(v.poignees, style);
          expect(p.triangles, `${id} ${style}`).toBeLessThanOrEqual(BUDGET_DES_POIGNEES.triangles);
          // Un lieu qui ne tourne pas n'a pas de « Tourner » : aucune poignée, aucun appel (directeur artistique).
          expect(p.drawCalls, `${id} ${style}`).toBe(placeTurns(id) ? 1 : 0);
        }
        // Dans le coût du dessin du choix : un appel pour les cases, un pour les poignées.
        expect(arrangeViewCost(v).triangles).toBe(2 * v.cases.length + coutDesPoignees(v.poignees, 'blocs').triangles);
      }
  // Hors d'un choix, rien.
  expect(arrangeViewCost(null)).toEqual({ triangles: 0, drawCalls: 0 });
}, 20_000);

// Un archipel par test : chacun refait cinq fois le maillage de tout son terrain, plus grand depuis les îlots des grands
// projets de la 4e et de la 3e (GD-10).
it.each(ARCHIPELAGO_IDS)('GD-9, %s : une liaison au plus long, de chaque sorte, ne prend aucun matériau nouveau (aucun appel de plus), sauf le sentier au 3e, sous le plafond', (a) => {
  // Les appels de plus (le sentier au 3e) tiennent sous le plafond au pire de la région : vérifié dans le test du pire cas.
  const { progress, world } = toutConstruit();
  const terrain = worldCubes(a, progress, world, false);
  const avant = buildMesh(terrain).length;
  for (const [kind, n] of [['bac', LONG_LENGTH], ['pont', LONG_LENGTH], ['pont', SHORT_LENGTH], ['sentier', SHORT_LENGTH]] as const) {
    const plus = APPELS_EN_PLUS_D_UNE_LIAISON[`${a} ${kind}`] ?? 0;
    expect(buildMesh([...terrain, ...linkCubes(a, kind, n)]).length, `${a} ${kind}`).toBe(avant + plus);
  }
});
