// Le cœur agrandi des îles-écoles (décision du mainteneur, 01/10/2026 : « vraie terre en plus »). La Forêt d'abord, puis
// le Marché : un cœur de 20 × 20 avec sa côte d'avant tout autour, la terre gagne deux cases de chaque côté, ses
// voisines s'écartent d'autant dans MAP. Les clés de sauvegarde restent relatives à l'origine `core`, qui ne bouge pas.
import type { BiomeId } from '../biomes';
import { BRIDGES } from './archipelago';
import { dockOrigin, shoreY } from './harbour';
import {
  bornesDuCoeur,
  coeurDe,
  COTE_DU_COEUR,
  CORE,
  DECOR_DES_MARGES,
  inCoeurDOrigine,
  inCore,
  islandDef,
  isLand,
  isthmusOf,
  landBox,
  landCells,
  landscape,
  margesDuCoeur,
  mapOf,
  MAP,
  tirage,
  type ArchipelagoId,
} from './map';
import { ORIGINE_DU_QUAI, PLAN_ZONE } from './plans';
import { bossIsletCells, bridgePath, creatureSpot, origineDeLIlot, placeSpot, questStations, VILLAGE_PLACES } from './terrain';

/**
 * Les îles-écoles agrandies : leur origine et leur côte (qui ne bougent pas), leur archipel, et la longueur d'avant (cœur
 * de 16) des ouvrages de cet archipel, qui ne change pas de plus de deux cases.
 */
const ECOLES: Partial<Record<BiomeId, { archipel: ArchipelagoId; core: { x: number; y: number }; ext: { left: number; right: number; front: number; back: number }; ouvrages: Record<string, number> }>> = {
  foret: {
    archipel: '6e',
    core: { x: 67, y: 59 },
    ext: { left: 6, right: 5, front: 3, back: 6 },
    ouvrages: {
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
    },
  },
  marche: {
    archipel: '5e',
    core: { x: 69, y: 317 },
    ext: { left: 3, right: 4, front: 2, back: 3 },
    ouvrages: {
      'glacier-marche': 13,
      'marche-marais': 30,
      'carrefour-marais': 13,
      'marche-comptoir': 10,
      'marais-manoir': 11,
      'comptoir-manoir': 24,
      'comptoir-relais': 10,
    },
  },
};
const IDS = Object.keys(ECOLES) as BiomeId[];

it('les îles-écoles agrandies couvrent 20 × 20 cases, de −2 à 18 autour de leur origine ; les autres îles gardent 16', () => {
  expect(COTE_DU_COEUR).toEqual(Object.fromEntries(IDS.map((id) => [id, 20])));
  for (const id of IDS) {
    const def = islandDef(id);
    const e = ECOLES[id]!;
    expect(bornesDuCoeur(def), id).toEqual({ x0: -2, y0: -2, x1: 18, y1: 18 });
    // L'origine (le repère des clés de sauvegarde) et la côte ne bougent pas : la terre a deux cases de plus de chaque côté.
    expect(def.core, id).toEqual(e.core);
    expect(def.ext, id).toEqual(e.ext);
    const box = landBox(def);
    expect([box.x0, box.y0, box.y1], id).toEqual([e.core.x - 2 - e.ext.left, e.core.y - 2 - e.ext.front, e.core.y + 18 + e.ext.back]);
    const c = coeurDe(def);
    for (let x = c.x0; x < c.x1; x++) for (let y = c.y0; y < c.y1; y++) expect(isLand(def, x, y), `${id} ${x},${y}`).toBe(true);
  }
  for (const d of MAP) if (!IDS.includes(d.id)) expect(bornesDuCoeur(d), d.id).toEqual({ x0: 0, y0: 0, x1: CORE, y1: CORE });
});

it('la côte d’une île-école est celle d’avant, repoussée de deux cases : son dessin se lit autour du cœur d’origine', () => {
  for (const id of IDS) {
    const { x, y } = ECOLES[id]!.core;
    const def = islandDef(id);
    // Hors du cœur agrandi, une case se lit deux cases plus près du cœur ; le long du cœur, le dessin s'étire.
    expect(tirage(def, x - 3, y - 3), id).toEqual({ x: x - 1, y: y - 1 });
    expect(tirage(def, x + 18, y + 20), id).toEqual({ x: x + 16, y: y + 18 });
    expect(tirage(def, x - 2, y + 17), id).toEqual({ x, y: y + 15 });
  }
  // Une île sans cœur agrandi ni déplacement lit son dessin à sa place.
  expect(tirage(islandDef('volcan'), 10, 20)).toEqual({ x: 10, y: 20 });
  // Une île écartée le lit là où elle était.
  const ferme = islandDef('ferme');
  expect(ferme.deplacee).toEqual({ x: -2, y: 0 });
  expect(tirage(ferme, 20, 70)).toEqual({ x: 22, y: 70 });
  const glacier = islandDef('glacier');
  expect(glacier.deplacee).toEqual({ x: -2, y: 0 });
  expect(tirage(glacier, 30, 330)).toEqual({ x: 32, y: 330 });
});

it('les marges du cœur : une terre plate, au décor de la côte sur leur rangée extérieure, nue le long du cœur d’origine', () => {
  for (const id of IDS) {
    const def = islandDef(id);
    const marges = margesDuCoeur(def);
    expect(marges, id).toHaveLength(20 * 20 - CORE * CORE);
    for (const m of marges) {
      expect(inCore(def, m.x, m.y)).toBe(true);
      expect(inCoeurDOrigine(def, m.x, m.y)).toBe(false);
      expect(m.h).toBe(0);
    }
    const bord = (m: { x: number; y: number }) => [-1, 0, 1].some((dx) => [-1, 0, 1].some((dy) => inCoeurDOrigine(def, m.x + dx, m.y + dy)));
    expect(marges.filter((m) => bord(m) && m.decor), id).toEqual([]);
    // Pas un terrain vide : du décor sur la rangée extérieure ; au rythme de la côte (un quart des cases environ) quand
    // l'enveloppe du décor de l'archipel le permet, allégé sinon (`DECOR_DES_MARGES`).
    const exterieur = marges.filter((m) => !bord(m));
    const part = exterieur.filter((m) => m.decor).length / exterieur.length;
    const allege = DECOR_DES_MARGES[id];
    expect(part, id).toBeGreaterThan(allege ? 0.08 : 0.15);
    if (allege?.genre) expect(new Set(marges.filter((m) => m.decor).map((m) => m.decor)), id).toEqual(new Set([allege.genre]));
    if (allege?.derriere) expect(marges.filter((m) => m.decor && m.y < def.core.y), id).toEqual([]);
    // Le paysage s'arrête au bord du cœur agrandi.
    expect(landscape(def).some((l) => inCore(def, l.x, l.y)), id).toBe(false);
  }
  // Les autres îles n'ont pas de marges.
  for (const d of MAP) if (!IDS.includes(d.id)) expect(margesDuCoeur(d), d.id).toEqual([]);
  // Le Marché, le port des Îles Brumeuses, reste bas (intention du 5e, §3) : des roseaux, une case sur deux, sur les côtés et derrière.
  expect(DECOR_DES_MARGES).toEqual({ marche: { genre: 'roseau', unSurDeux: true, derriere: true } });
});

it('dans le cœur d’une île-école, les bornes, la créature, les lieux et la zone des plans gardent leur place', () => {
  for (const id of IDS) {
    const def = islandDef(id);
    expect(questStations(id).map((s) => [s.x, s.y]), id).toEqual(questStations(id).map((_, i) => [3 + 3 * i, 1]));
    const spot = creatureSpot(id);
    const decorDesMarges = new Set(margesDuCoeur(def).filter((m) => m.decor).map((m) => `${m.x - def.core.x},${m.y - def.core.y}`));
    expect(decorDesMarges.has(`${spot.x},${spot.y}`), id).toBe(false);
    for (const place of ['ecole', 'trophees'] as const)
      expect(placeSpot(place, id), `${id} ${place}`).toMatchObject({ x: def.core.x + VILLAGE_PLACES[place].at.x, y: def.core.y + VILLAGE_PLACES[place].at.y });
  }
  expect(PLAN_ZONE).toEqual({ x: 8, y: 10, w: 6, h: 5 });
});

it('les ouvrages partent du cœur de 20 et l’îlot du Gardien suit la côte repoussée', () => {
  const depart = (id: string) => bridgePath(BRIDGES.find((b) => b.id === id)!)[0];
  const arrivee = (id: string) => bridgePath(BRIDGES.find((b) => b.id === id)!).at(-1)!;
  // La Forêt. Vers la Plaine et vers l'Horloge : depuis le bord droit du cœur agrandi (x = 67 + 17).
  expect(depart('foret-plaine').x).toBe(84);
  expect(depart('foret-horloge').x).toBe(84);
  // Le sentier de la Mine part du bord du cœur agrandi.
  expect(depart('foret-mine').x).toBe(85);
  // Le Marché. Vers le Comptoir, depuis sa côte droite repoussée ; le sentier du Glacier arrive au bord gauche de sa terre.
  expect(depart('marche-comptoir').x).toBe(69 + 18 + 4);
  expect(arrivee('glacier-marche').x).toBe(69 - 2 - 1);
  // L'îlot, au droit du bord gauche du cœur, à trois cases d'eau de la côte, comme avant.
  for (const id of IDS) {
    const def = islandDef(id);
    expect(origineDeLIlot(def), id).toEqual({ x: def.core.x - 2, y: def.core.y - 2 - def.ext.front - 12 - 3, z: def.altitude });
    expect(bossIsletCells(id).every((c) => !isLand(def, c.x, c.y)), id).toBe(true);
  }
});

it('le quai du Marché suit sa côte repoussée ; les clés de ses étapes ne bougent pas', () => {
  // La côte au pied de la jetée, deux cases plus bas qu'avant (316) ; le navire recule d'autant (305 avant).
  expect(shoreY('marche')).toBe(314);
  expect(dockOrigin('marche')).toEqual({ x: 69 + 15, y: 303, z: 0 });
  expect(ORIGINE_DU_QUAI.marche).toEqual({ x: 15, y: -12, z: -4 });
});

it('les voisines d’une île-école s’écartent : les ouvrages de son archipel gardent leur longueur à deux cases près, les bras de mer restent ouverts', () => {
  for (const id of IDS) {
    const { archipel, ouvrages } = ECOLES[id]!;
    for (const b of BRIDGES.filter((d) => d.id in ouvrages)) expect(Math.abs(bridgePath(b).length - ouvrages[b.id]), b.id).toBeLessThanOrEqual(2);
    expect(BRIDGES.filter((b) => mapOf(archipel).some((d) => d.id === b.from)).every((b) => b.id in ouvrages), archipel).toBe(true);
    // Entre deux terres (îles et îlots des Gardiens) qui ne partagent pas d'isthme, au moins deux cases d'eau.
    const iles = mapOf(archipel);
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
  }
});
