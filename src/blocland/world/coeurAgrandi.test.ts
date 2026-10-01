// Le cœur agrandi des îles-écoles (décision du mainteneur, 01/10/2026 : « vraie terre en plus »). La Forêt d'abord, puis
// le Marché, l'Atelier et le Phare : un cœur de 20 × 20 avec sa côte d'avant tout autour, la terre gagne deux cases de chaque côté, ses
// voisines s'écartent d'autant dans MAP. Les clés de sauvegarde restent relatives à l'origine `core`, qui ne bouge pas.
import type { BiomeId } from '../biomes';
import { BRIDGES } from './archipelago';
import { dockBox, dockOrigin, shoreY } from './harbour';
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
import { bossIsletCells, bossIsletSteps, bridgePath, creatureSpot, ILOT_DE_COTE, ISLET_H, ISLET_W, origineDeLIlot, placeSpot, questStations, VILLAGE_PLACES } from './terrain';

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
  atelier: {
    archipel: '4e',
    core: { x: 62, y: 632 },
    ext: { left: 3, right: 3, front: 2, back: 4 },
    ouvrages: {
      'atelier-forge': 9,
      'atelier-falaise': 10,
      'falaise-cabinet': 12,
      'forge-gare': 11,
      'cabinet-theatre': 10,
      'theatre-jardin': 10,
    },
  },
  phare: {
    archipel: '3e',
    core: { x: 58, y: 912 },
    ext: { left: 3, right: 3, front: 3, back: 3 },
    ouvrages: {
      'phare-belvedere': 17,
      'phare-donnees': 16,
      'phare-textes': 28,
      'belvedere-studio': 13,
      'donnees-chateau': 11,
      'chateau-refuge': 7,
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
    // Pas un terrain vide : du décor sur la rangée extérieure ; au rythme de la côte quand l'enveloppe du décor de
    // l'archipel le permet (de 14 % des cases à l'Atelier, où le sapin ne pousse qu'à plat, au quart à la Forêt), allégé
    // sinon (`DECOR_DES_MARGES`).
    const exterieur = marges.filter((m) => !bord(m));
    const part = exterieur.filter((m) => m.decor).length / exterieur.length;
    const allege = DECOR_DES_MARGES[id];
    expect(part, id).toBeGreaterThan(allege ? 0.08 : 0.12);
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

it('les ouvrages partent du cœur de 20', () => {
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
  // L'Atelier. Vers la Forge et vers la Falaise, depuis sa côte repoussée de part et d'autre.
  expect(depart('atelier-forge').x).toBe(62 - 2 - 3 - 1);
  expect(depart('atelier-falaise').x).toBe(62 + 18 + 3);
  // Le Phare. Vers le Belvédère et l'Observatoire des données, depuis sa côte repoussée ; le col des textes, depuis
  // l'arrière de sa terre.
  expect(depart('phare-belvedere').x).toBe(58 - 2 - 3);
  expect(depart('phare-donnees').x).toBe(58 + 18 + 3);
  expect(depart('phare-textes').y).toBe(912 + 18 + 3 - 1);
});

it('l’îlot du Gardien d’une île-école glisse sur le côté : de l’eau franche avec sa terre, hors de l’axe du cœur, pas plus près de la caméra', () => {
  // Relecture du DA (01/10/2026) : sur la Forêt agrandie, les liserés d'écume de l'îlot et de la côte se touchaient, et la
  // statue se dressait dans l'axe de la caméra vers la créature, l'école et la salle des trophées.
  expect(ILOT_DE_COTE).toBe(9);
  for (const id of IDS) {
    const def = islandDef(id);
    const c = coeurDe(def);
    // Sa rangée, devant la côte repoussée (pas plus près de la caméra) ; sur le côté, à gauche (à droite, le navire).
    expect(origineDeLIlot(def), id).toEqual({ x: def.core.x - 2 - 9, y: def.core.y - 2 - def.ext.front - ISLET_H - 3, z: def.altitude });
    const ilot = bossIsletCells(id);
    expect(ilot.every((p) => !isLand(def, p.x, p.y)), id).toBe(true);
    // Au moins trois cases d'eau entre l'îlot et la terre de son île : deux d'eau franche entre les liserés, plus qu'il
    // n'en faut (deux) ; quatre à la Forêt.
    let eau = Infinity;
    for (const p of ilot) for (const q of landCells(def)) eau = Math.min(eau, Math.max(Math.abs(p.x - q.x), Math.abs(p.y - q.y)) - 1);
    expect(eau, id).toBeGreaterThanOrEqual(id === 'foret' ? 4 : 3);
    // Le Gardien quitte l'axe du cœur : le milieu de l'îlot est à gauche de son bord.
    const o = origineDeLIlot(def);
    expect(o.x + ISLET_W / 2, id).toBeLessThan(c.x0);
    // Les pas japonais vont toujours de l'îlot à la côte, droit derrière.
    const pas = bossIsletSteps(id);
    expect(pas.length, id).toBeGreaterThan(0);
    const dernier = pas.at(-1)!;
    expect(isLand(def, dernier.x, dernier.y + 1) || isLand(def, dernier.x - 1, dernier.y + 1), id).toBe(true);
    // Au port, loin de la jetée et du navire.
    if (id === 'marche' || id === 'atelier') {
      const d = dockBox(id);
      expect(ilot.every((p) => p.x < d.x0 - 2 || p.x > d.x1 + 2 || p.y < d.y0 - 2 || p.y > d.y1 + 2), id).toBe(true);
    }
  }
});

it('le quai d’une île-école qui est un port suit sa côte repoussée ; les clés de ses étapes ne bougent pas', () => {
  // La côte au pied de la jetée, deux cases plus bas qu'avant (316 au Marché, 630 à l'Atelier) ; le navire recule
  // d'autant (305 et 618 avant).
  expect(shoreY('marche')).toBe(314);
  expect(dockOrigin('marche')).toEqual({ x: 69 + 15, y: 303, z: 0 });
  expect(ORIGINE_DU_QUAI.marche).toEqual({ x: 15, y: -12, z: -4 });
  expect(shoreY('atelier')).toBe(628);
  expect(dockOrigin('atelier')).toEqual({ x: 62 + 15, y: 616, z: 0 });
  expect(ORIGINE_DU_QUAI.atelier).toEqual({ x: 15, y: -14, z: -7 });
  // Le Phare, port des Îles du Ciel, sans étape du Bloc-Navire : le navire s'y pose devant sa côte repoussée.
  expect(shoreY('phare')).toBe(912 - 2 - 3 + 1);
  expect(dockOrigin('phare')).toEqual({ x: 58 + 15, y: 896, z: 9 });
  expect(ORIGINE_DU_QUAI.phare).toBeUndefined();
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
