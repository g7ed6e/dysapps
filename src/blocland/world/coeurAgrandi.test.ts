// Le cœur agrandi des îles-écoles (décision du mainteneur, 01/10/2026 : « vraie terre en plus »). La Forêt d'abord : un
// cœur de 20 × 20 avec sa côte d'avant tout autour, la terre gagne deux cases de chaque côté, ses voisines s'écartent
// d'autant dans MAP. Les clés de sauvegarde restent relatives à l'origine `core`, qui ne bouge pas.
import { BRIDGES } from './archipelago';
import { bornesDuCoeur, coeurDe, COTE_DU_COEUR, CORE, inCoeurDOrigine, inCore, islandDef, isLand, isthmusOf, landBox, landCells, landscape, margesDuCoeur, mapOf, MAP, tirage } from './map';
import { PLAN_ZONE } from './plans';
import { bossIsletCells, bridgePath, creatureSpot, origineDeLIlot, placeSpot, questStations, VILLAGE_PLACES } from './terrain';

const foret = islandDef('foret');

it('le cœur de la Forêt couvre 20 × 20 cases, de −2 à 18 autour de son origine ; les autres îles gardent 16', () => {
  expect(COTE_DU_COEUR).toEqual({ foret: 20 });
  expect(bornesDuCoeur(foret)).toEqual({ x0: -2, y0: -2, x1: 18, y1: 18 });
  for (const d of MAP) if (d.id !== 'foret') expect(bornesDuCoeur(d), d.id).toEqual({ x0: 0, y0: 0, x1: CORE, y1: CORE });
  // L'origine (le repère des clés de sauvegarde) et la côte ne bougent pas : la terre a deux cases de plus de chaque côté.
  expect(foret.core).toEqual({ x: 67, y: 59 });
  expect(foret.ext).toEqual({ left: 6, right: 5, front: 3, back: 6 });
  const box = landBox(foret);
  expect([box.x0, box.y0, box.y1]).toEqual([67 - 2 - 6, 59 - 2 - 3, 59 + 18 + 6]);
  for (let x = coeurDe(foret).x0; x < coeurDe(foret).x1; x++) for (let y = coeurDe(foret).y0; y < coeurDe(foret).y1; y++) expect(isLand(foret, x, y)).toBe(true);
});

it('la côte de la Forêt est celle d’avant, repoussée de deux cases : son dessin se lit autour du cœur d’origine', () => {
  // Hors du cœur agrandi, une case se lit deux cases plus près du cœur ; le long du cœur, le dessin s'étire.
  expect(tirage(foret, 67 - 3, 59 - 3)).toEqual({ x: 67 - 1, y: 59 - 1 });
  expect(tirage(foret, 67 + 18, 59 + 20)).toEqual({ x: 67 + 16, y: 59 + 18 });
  expect(tirage(foret, 67 - 2, 59 + 17)).toEqual({ x: 67, y: 59 + 15 });
  // Une île sans cœur agrandi ni déplacement lit son dessin à sa place.
  expect(tirage(islandDef('volcan'), 10, 20)).toEqual({ x: 10, y: 20 });
  // Une île écartée le lit là où elle était.
  const ferme = islandDef('ferme');
  expect(ferme.deplacee).toEqual({ x: -2, y: 0 });
  expect(tirage(ferme, 20, 70)).toEqual({ x: 22, y: 70 });
});

it('les marges du cœur : une terre plate, au décor de la côte sur leur rangée extérieure, nue le long du cœur d’origine', () => {
  const marges = margesDuCoeur(foret);
  expect(marges).toHaveLength(20 * 20 - CORE * CORE);
  for (const m of marges) {
    expect(inCore(foret, m.x, m.y)).toBe(true);
    expect(inCoeurDOrigine(foret, m.x, m.y)).toBe(false);
    expect(m.h).toBe(0);
  }
  const bord = (m: { x: number; y: number }) => [-1, 0, 1].some((dx) => [-1, 0, 1].some((dy) => inCoeurDOrigine(foret, m.x + dx, m.y + dy)));
  expect(marges.filter((m) => bord(m) && m.decor)).toEqual([]);
  // Pas un terrain vide : sur la rangée extérieure, autant de décor qu'au rythme de la côte (un quart des cases environ).
  const exterieur = marges.filter((m) => !bord(m));
  expect(exterieur.filter((m) => m.decor).length / exterieur.length).toBeGreaterThan(0.15);
  // Le paysage s'arrête au bord du cœur agrandi ; les autres îles n'ont pas de marges.
  expect(landscape(foret).some((l) => inCore(foret, l.x, l.y))).toBe(false);
  for (const d of MAP) if (d.id !== 'foret') expect(margesDuCoeur(d), d.id).toEqual([]);
});

it('dans le cœur de la Forêt, les bornes, la créature, les lieux et la zone des plans gardent leur place', () => {
  expect(questStations('foret').map((s) => [s.x, s.y])).toEqual(questStations('foret').map((_, i) => [3 + 3 * i, 1]));
  const spot = creatureSpot('foret');
  const decorDesMarges = new Set(margesDuCoeur(foret).filter((m) => m.decor).map((m) => `${m.x - foret.core.x},${m.y - foret.core.y}`));
  expect(decorDesMarges.has(`${spot.x},${spot.y}`)).toBe(false);
  for (const place of ['ecole', 'trophees'] as const)
    expect(placeSpot(place, 'foret')).toMatchObject({ x: foret.core.x + VILLAGE_PLACES[place].at.x, y: foret.core.y + VILLAGE_PLACES[place].at.y });
  expect(PLAN_ZONE).toEqual({ x: 8, y: 10, w: 6, h: 5 });
});

it('les ouvrages partent du cœur de 20 et l’îlot du Gardien suit la côte repoussée', () => {
  const depart = (id: string) => bridgePath(BRIDGES.find((b) => b.id === id)!)[0];
  // Vers la Plaine et vers l'Horloge : depuis le bord droit du cœur agrandi (x = 67 + 17).
  expect(depart('foret-plaine').x).toBe(84);
  expect(depart('foret-horloge').x).toBe(84);
  // Le sentier de la Mine part du bord du cœur agrandi.
  expect(depart('foret-mine').x).toBe(85);
  // L'îlot, au droit du bord gauche du cœur, à trois cases d'eau de la côte, comme avant.
  expect(origineDeLIlot(foret)).toEqual({ x: 65, y: 59 - 2 - 3 - 12 - 3, z: 0 });
  expect(bossIsletCells('foret').every((c) => !isLand(foret, c.x, c.y))).toBe(true);
});

it('les voisines de la Forêt s’écartent : les ouvrages des Premiers Rivages gardent leur longueur à deux cases près, les bras de mer restent ouverts', () => {
  // Les longueurs d'avant (cœur de 16).
  const avant: Record<string, number> = {
    'foret-mine': 13,
    'foret-ferme': 16,
    'mine-carriere': 18,
    'ferme-tour': 14,
    'foret-plaine': 20,
    'plaine-riviere': 21,
    'mine-riviere': 34,
    'plaine-volcan': 19,
    'ferme-volcan': 25,
    'ferme-baie': 29,
    'foret-horloge': 21,
    'baie-horloge': 14,
  };
  for (const b of BRIDGES.filter((d) => d.id in avant)) expect(Math.abs(bridgePath(b).length - avant[b.id]), b.id).toBeLessThanOrEqual(2);
  // Entre deux terres (îles et îlots des Gardiens) qui ne partagent pas d'isthme, au moins deux cases d'eau.
  const iles = mapOf('6e');
  const terres = [
    ...iles.map((d) => ({ id: d.id as string, ile: d.id as string, cases: landCells(d) })),
    ...iles.map((d) => ({ id: `ilot-${d.id}`, ile: d.id as string, cases: bossIsletCells(d.id) })),
  ];
  for (let i = 0; i < terres.length; i++)
    for (let j = i + 1; j < terres.length; j++) {
      const [a, b] = [terres[i], terres[j]];
      if (a.ile === b.ile || isthmusOf(a.id as never) === b.id) continue;
      let ecart = Infinity;
      for (const p of a.cases) for (const q of b.cases) ecart = Math.min(ecart, Math.max(Math.abs(p.x - q.x), Math.abs(p.y - q.y)) - 1);
      expect(ecart, `${a.id} / ${b.id}`).toBeGreaterThanOrEqual(2);
    }
});
