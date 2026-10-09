// Le cœur agrandi des îles (GD-11, décision du mainteneur du 8 octobre 2026 : « Agrandir les îles », « Tout autour »,
// « Côte amincie ») : trois cases de plus de chaque côté du cœur d'origine, 22 × 22 (26 × 26 sur les îles-écoles, qui
// avaient déjà 20 depuis le 1er octobre 2026) ; la côte s'amincit d'une case de chaque côté, la terre gagne deux cases
// nettes par côté. Les clés de sauvegarde restent relatives à l'origine `core`, qui ne bouge pas.
import type { BiomeId } from '../biomes';
import { linkWholeRegion, VOYAGES } from './archipelago';
import { ARCHIPELAGO_IDS } from './archipelagos';
import { placedLinksOfPlace } from './linkGeometry';
import { dockOrigin, shoreY } from './harbor';
import {
  bornesDuCoeur,
  coeurDe,
  COTE_DU_COEUR,
  CORE,
  DEFAULT_CORE_SIDE,
  inCoeurDOrigine,
  inCore,
  islandDef,
  isLand,
  isthmusOf,
  JALONS,
  landBox,
  landCells,
  landscape,
  margesDuCoeur,
  mapOf,
  MAP,
  PAS_DES_JALONS,
  tirage,
  type ArchipelagoId,
} from './map';
import { ORIGINE_DU_QUAI, PLAN_ZONE, zoneDesPlans } from './plans';
import { bridgePath, creatureSpot, placeSpot, questStations, VILLAGE_PLACES } from './terrain';

/**
 * Les îles-écoles : le repère de leur dessin (leur place d'avant GD-9, qui ne bouge plus), leur côte amincie (GD-11) et
 * leur archipel. Les clés de sauvegarde restent relatives à ce repère.
 */
const ECOLES: Partial<Record<BiomeId, { archipel: ArchipelagoId; core: { x: number; y: number }; ext: { left: number; right: number; front: number; back: number } | null }>> = {
  // La Forêt, le Marché et le Phare ont pris leur forme (GD-12) : leur côte se lit sur elle (`ext : null`).
  'french-6e-phonology': {
    archipel: '6e',
    core: { x: 67, y: 59 },
    ext: null,
  },
  'maths-5e-proportionality': {
    archipel: '5e',
    core: { x: 69, y: 317 },
    // Son croissant garde deux rangées devant, au pied de la jetée (`TERRE_AUTOUR_DU_COEUR`) : l'escalier ne monte pas
    // sur la rangée nue devant les bornes.
    ext: null,
  },
  'maths-4e-algebra': {
    archipel: '4e',
    core: { x: 62, y: 632 },
    ext: { left: 2, right: 2, front: 1, back: 3 },
  },
  'maths-3e-functions': {
    archipel: '3e',
    core: { x: 58, y: 912 },
    ext: null,
  },
};
const IDS = Object.keys(ECOLES) as BiomeId[];

it('les îles-écoles couvrent 26 × 26 cases, de −5 à 21 autour de leur origine ; les autres îles 22 × 22, de −3 à 19', () => {
  expect(COTE_DU_COEUR).toEqual(Object.fromEntries(IDS.map((id) => [id, 26])));
  expect(DEFAULT_CORE_SIDE).toBe(22);
  for (const id of IDS) {
    const def = islandDef(id);
    const e = ECOLES[id]!;
    expect(bornesDuCoeur(def), id).toEqual({ x0: -5, y0: -5, x1: 21, y1: 21 });
    // Le repère du dessin (celui des clés de sauvegarde) ne bouge pas ; la côte s'est amincie d'une case de chaque côté.
    expect(def.repere, id).toEqual(e.core);
    const ext = e.ext ?? def.ext;
    expect(def.ext, id).toEqual(ext);
    const box = landBox(def);
    expect([box.x0, box.y0, box.y1], id).toEqual([def.core.x - 5 - ext.left, def.core.y - 5 - ext.front, def.core.y + 21 + ext.back]);
    const c = coeurDe(def);
    for (let x = c.x0; x < c.x1; x++) for (let y = c.y0; y < c.y1; y++) expect(isLand(def, x, y), `${id} ${x},${y}`).toBe(true);
  }
  for (const d of MAP) {
    if (IDS.includes(d.id)) continue;
    expect(bornesDuCoeur(d), d.id).toEqual({ x0: -3, y0: -3, x1: 19, y1: 19 });
    // Une case de côte au moins de chaque côté.
    expect(Math.min(d.ext.left, d.ext.right, d.ext.front, d.ext.back), d.id).toBeGreaterThanOrEqual(1);
  }
});

it('la côte d’une île est celle d’avant, repoussée autour du cœur agrandi : son dessin se lit autour du cœur d’origine', () => {
  for (const id of IDS) {
    const def = islandDef(id);
    const { x, y } = def.core;
    const r = def.repere;
    // Hors du cœur agrandi, une case se lit cinq cases plus près du cœur, dans le repère du dessin ; le long du cœur,
    // le dessin s'étire.
    expect(tirage(def, x - 6, y - 6), id).toEqual({ x: r.x - 1, y: r.y - 1 });
    expect(tirage(def, x + 21, y + 23), id).toEqual({ x: r.x + 16, y: r.y + 18 });
    expect(tirage(def, x - 5, y + 20), id).toEqual({ x: r.x, y: r.y + 15 });
  }
  // Une île sans déplacement lit son dessin autour de son cœur d'origine : trois cases plus près, hors du cœur.
  const volcan = islandDef('maths-6e-decimals');
  expect(tirage(volcan, volcan.core.x - 4, volcan.core.y + 20)).toEqual({ x: volcan.repere.x - 1, y: volcan.repere.y + 17 });
  // Une île écartée, puis calée sur le pas (GD-9), lit son dessin là où il a été tiré.
  const ferme = islandDef('french-6e-grammar-spelling');
  expect(ferme.deplacee).toEqual({ x: -2, y: 0 });
  expect(tirage(ferme, ferme.core.x - 4, ferme.core.y + 20)).toEqual({ x: ferme.repere.x + 1, y: ferme.repere.y + 17 });
  const glacier = islandDef('maths-5e-signed-numbers');
  expect(glacier.deplacee).toEqual({ x: -2, y: 0 });
  expect(tirage(glacier, glacier.core.x - 4, glacier.core.y + 20)).toEqual({ x: glacier.repere.x + 1, y: glacier.repere.y + 17 });
});

it('les marges du cœur : une terre plate, nue, avec ses seuls jalons sur la rangée extérieure (GD-11, « Côte amincie »)', () => {
  for (const d of MAP) {
    const def = islandDef(d.id);
    const cote = IDS.includes(d.id) ? 26 : 22;
    const marges = margesDuCoeur(def);
    expect(marges, d.id).toHaveLength(cote * cote - CORE * CORE);
    const c = coeurDe(def);
    const exterieure = (m: { x: number; y: number }) => m.x === c.x0 || m.y === c.y0 || m.x === c.x1 - 1 || m.y === c.y1 - 1;
    for (const m of marges) {
      expect(inCore(def, m.x, m.y)).toBe(true);
      expect(inCoeurDOrigine(def, m.x, m.y)).toBe(false);
      expect(m.h).toBe(0);
      // Rien que des jalons de la région, sur la rangée extérieure.
      if (m.decor) {
        expect(exterieure(m), `${d.id} ${m.x},${m.y}`).toBe(true);
        expect(JALONS[def.region], d.id).toContain(m.decor);
      }
    }
    // Le paysage s'arrête au bord du cœur agrandi.
    expect(landscape(def).some((l) => inCore(def, l.x, l.y)), d.id).toBe(false);
  }
});

it('la rangée extérieure des marges est cassée de loin en loin (une pierre, une touffe, un rondin), deux jalons jamais côte à côte', () => {
  // Relecture du consultant Blocland (01/10/2026) : vue de l'archipel, la bande nue le long du cœur faisait une longue
  // ligne droite. Les jalons gardent leurs places (`PAS_DES_JALONS`) depuis que le reste du décor des marges est retiré.
  expect(PAS_DES_JALONS).toBe(5);
  for (const d of MAP) {
    const jalons = margesDuCoeur(islandDef(d.id)).filter((m) => m.decor);
    expect(jalons.length, d.id).toBeGreaterThan(0);
    const ici = new Set(jalons.map((m) => `${m.x},${m.y}`));
    for (const m of jalons) for (const [dx, dy] of [[1, 0], [0, 1]]) expect(ici.has(`${m.x + dx},${m.y + dy}`), `${d.id} ${m.x},${m.y}`).toBe(false);
  }
});

it('dans le cœur d’une île-école, les bornes, la créature, les lieux et la zone des plans gardent leur place', () => {
  for (const id of IDS) {
    const def = islandDef(id);
    // Les bornes au pas de 4, centrées sur la visée (redistribution « Trois bandes », 02/10/2026).
    expect(questStations(id).map((s) => [s.x, s.y]), id).toEqual([
      [4, 1],
      [8, 1],
      [12, 1],
    ]);
    const spot = creatureSpot(id);
    const decorDesMarges = new Set(margesDuCoeur(def).filter((m) => m.decor).map((m) => `${m.x - def.core.x},${m.y - def.core.y}`));
    expect(decorDesMarges.has(`${spot.x},${spot.y}`), id).toBe(false);
    for (const place of ['school', 'trophies'] as const)
      expect(placeSpot(place, id), `${id} ${place}`).toMatchObject({ x: def.core.x + VILLAGE_PLACES[place].at.x, y: def.core.y + VILLAGE_PLACES[place].at.y });
  }
  // Le coin de la zone des plans ne bouge jamais (les clés de sauvegarde en dépendent) ; sur les îles-écoles, elle
  // gagne une rangée vers le fond.
  expect(PLAN_ZONE).toEqual({ x: 8, y: 10, w: 6, h: 5 });
  for (const id of IDS) expect(zoneDesPlans(id), id).toEqual({ x: 8, y: 10, w: 6, h: 6 });
});

it('les liaisons posées abordent la côte d’une île-école, jamais son cœur de 26', () => {
  const links = ARCHIPELAGO_IDS.reduce<string[]>((l, a) => linkWholeRegion(a, l), VOYAGES.map((v) => v.id));
  for (const id of IDS) {
    const def = islandDef(id);
    const c = coeurDe(def);
    for (const b of placedLinksOfPlace(id, links)) {
      const cases = bridgePath(b, links);
      expect(cases.length, b.id).toBeGreaterThan(0);
      for (const bout of [cases[0], cases.at(-1)!]) {
        if (!isLand(def, bout.x, bout.y) && !inCore(def, bout.x, bout.y)) continue;
        // Une case du tracé sur l'île : jamais dans son cœur agrandi (les bornes et les bâtiments y sont).
        expect(bout.x < c.x0 || bout.x >= c.x1 || bout.y < c.y0 || bout.y >= c.y1, `${b.id} (${bout.x}, ${bout.y})`).toBe(true);
      }
    }
  }
});

it('le quai d’une île-école qui est un port suit sa côte repoussée ; les clés de ses étapes ne bougent pas', () => {
  // La côte au pied de la jetée, devant le cœur agrandi, dans la côte dessinée du lieu (ou le bord du cœur, là où la
  // côte amincie ne laisse pas de terre devant) ; le navire la suit, deux cases plus au large depuis GD-11. À
  // l'Atelier, il plane deux cases au-dessus de l'eau (ses réacteurs sont dessous) : la jetée y descend de deux
  // marches de moins, et le navire s'avance d'une case. Les clés des étapes, relatives au repère du dessin, ne bougent pas.
  for (const id of ['maths-5e-proportionality', 'maths-4e-algebra', 'maths-3e-functions'] as const) {
    const def = islandDef(id);
    expect(shoreY(id), id).toBeGreaterThanOrEqual(coeurDe(def).y0 - def.ext.front);
    expect(shoreY(id), id).toBeLessThanOrEqual(coeurDe(def).y0);
  }
  // Au Marché, depuis sa forme (GD-12), la rive droite du croissant garde ses deux rangées de terre sous tout le navire
  // (la côte de GD-11 n'en avait qu'une sous sa proue) : il recule d'une case vers le large.
  expect(dockOrigin('maths-5e-proportionality')).toEqual({ x: islandDef('maths-5e-proportionality').core.x + 17, y: islandDef('maths-5e-proportionality').core.y - 18, z: 0 });
  expect(ORIGINE_DU_QUAI['maths-5e-proportionality']).toEqual({ x: 15, y: -12, z: -4 });
  expect(dockOrigin('maths-4e-algebra')).toEqual({ x: islandDef('maths-4e-algebra').core.x + 17, y: islandDef('maths-4e-algebra').core.y - 17, z: 2 });
  expect(ORIGINE_DU_QUAI['maths-4e-algebra']).toEqual({ x: 15, y: -14, z: -7 });
  // Le Phare, port des Îles du Ciel, sans étape du Bloc-Navire : le navire s'y pose devant sa côte repoussée.
  expect(dockOrigin('maths-3e-functions')).toEqual({ x: islandDef('maths-3e-functions').core.x + 17, y: islandDef('maths-3e-functions').core.y - 18, z: 9 });
  expect(ORIGINE_DU_QUAI['maths-3e-functions']).toBeUndefined();
});

it('les voisines d’une île-école s’écartent : les bras de mer restent ouverts', () => {
  for (const id of IDS) {
    const { archipel } = ECOLES[id]!;
    // Entre deux îles qui ne partagent pas d'isthme, au moins deux cases d'eau.
    const iles = mapOf(archipel);
    const terres: { id: string; ile: BiomeId; cases: readonly { x: number; y: number }[] }[] = iles.map((d) => ({ id: d.id as string, ile: d.id, cases: landCells(d) }));
    for (let i = 0; i < terres.length; i++)
      for (let j = i + 1; j < terres.length; j++) {
        const [a, b] = [terres[i], terres[j]];
        if (a.ile === b.ile || isthmusOf(a.ile) === b.ile) continue;
        let ecart = Infinity;
        for (const p of a.cases) for (const q of b.cases) ecart = Math.min(ecart, Math.max(Math.abs(p.x - q.x), Math.abs(p.y - q.y)) - 1);
        expect(ecart, `${a.id} / ${b.id}`).toBeGreaterThanOrEqual(2);
      }
  }
});
