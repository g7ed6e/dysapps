// La disposition de la sauvegarde (GD-9, L3) : lue et vérifiée, absente ou invalide, c'est la carte de départ, et une
// sauvegarde d'avant se lit sans rien perdre.
import { describe, expect, it } from 'vitest';
import { getBiome } from '../biomes';
import { EMPTY_STATE, sanitizeState } from '../engine';
import { LAYOUT_SIDE_OF } from './appliedLayout';
import { BRIDGES } from './archipelago';
import { archipelagoOfIsland } from './archipelagos';
import { frameOf, fittingPlaces, posesOfLayout } from './footprint';
import { mapOf, startingIsland } from './map';
import { STEP } from './placement';
import { possibleLandings } from './routing';
import { type Layout, LAYOUT_LAST_SPOT, sanitizeLayout } from './savedLayout';
import { ARCHIPELAGO_IDS } from './archipelagos';

const lien6e = BRIDGES.find((b) => archipelagoOfIsland(b.from) === '6e')!.id;
const lien5e = BRIDGES.find((b) => archipelagoOfIsland(b.from) === '5e')!.id;

/**
 * Une disposition du 6e complète et valide : la Ferme déplacée vers un coin du cadre, sans rien toucher (au coin bas-droit
 * jusqu'à HG-2, puis au coin haut-droit jusqu'à SC-2 : les îles d'histoire-géographie, puis le Laboratoire des éléments y
 * sont entrés ; elle passe au coin bas-gauche).
 */
const valide: Layout = {
  '6e': {
    islands: { 'maths-6e-decimals': { x: 2, y: 27, turn: 1 } },
    stations: { 'maths-6e-decimals:ordering': { x: 4, y: 14 } },
    landings: { [lien6e]: { from: { side: 'back', step: 2 }, to: { side: 'front', step: -1 } } },
    joined: [['french-6e-phonology', 'french-6e-letter-confusion']],
    shortcuts: [lien6e],
    relink: [lien6e],
  },
};

describe('la disposition de la sauvegarde', () => {
  it('la dernière place de chaque région est le bout de son cadre, au pas', () => {
    for (const a of ARCHIPELAGO_IDS) {
      const c = frameOf(a);
      expect(LAYOUT_LAST_SPOT[a], a).toEqual({ x: (c.x1 - c.x0) / STEP, y: (c.y1 - c.y0) / STEP });
    }
  });

  it('absente, ou d’une sauvegarde d’avant GD-9 : rien, la carte de départ', () => {
    expect(sanitizeLayout(undefined)).toBeUndefined();
    expect(sanitizeLayout('carte')).toBeUndefined();
    expect(sanitizeLayout({})).toBeUndefined();
    expect(sanitizeState({ ...EMPTY_STATE, world: { parts: {}, log: [], links: [lien6e] } }).world).toEqual({ parts: {}, log: [], links: [lien6e] });
    expect(posesOfLayout(undefined).size).toBe(0);
  });

  it('valide, elle se lit telle quelle et se garde dans la sauvegarde', () => {
    expect(sanitizeLayout(valide)).toEqual(valide);
    const lu = sanitizeState({ ...EMPTY_STATE, world: { parts: {}, log: [], links: [], layout: valide } });
    expect(lu.world.layout).toEqual(valide);
    expect(sanitizeState(JSON.parse(JSON.stringify(lu))).world.layout).toEqual(valide);
  });

  it('des lieux ou des réunions invalides : la région est oubliée seule, les autres restent', () => {
    const casses: unknown[] = [
      { islands: { 'maths-5e-signed-numbers': { x: 1, y: 1, turn: 0 } } }, // un lieu d'une autre région
      { islands: { 'maths-6e-decimals': { x: 1.5, y: 1, turn: 0 } } }, // hors du pas
      { islands: { 'maths-6e-decimals': { x: 1, y: 1, turn: 4 } } }, // une orientation qui n'existe pas
      { islands: { 'maths-6e-decimals': { x: 49, y: 1, turn: 0 } } }, // hors du cadre (48 pas au plus aux Premiers Rivages)
      { islands: { 'maths-6e-decimals': { x: 1, y: 37, turn: 0 } } }, // hors du cadre (36 pas au plus)
      { joined: [['french-6e-phonology', 'french-6e-phonology']] },
      { joined: [['french-6e-phonology', 'french-6e-letter-confusion'], ['french-6e-phonology', 'french-6e-reading']] },
    ];
    for (const r of casses) expect(sanitizeLayout({ '6e': r, '5e': { relink: [lien5e] } }), JSON.stringify(r)).toEqual({ '5e': { relink: [lien5e] } });
    // Le bout du cadre est encore une place.
    expect(sanitizeLayout({ '6e': { islands: { 'maths-6e-decimals': { x: 48, y: 36, turn: 0 } } } })).toEqual({ '6e': { islands: { 'maths-6e-decimals': { x: 48, y: 36, turn: 0 } } } });
  });

  it('une sauvegarde d’avant GD-11 se lit toujours : la place de ses Gardiens (contre leur lieu ou détachés) est ignorée, rien d’autre ne se perd', () => {
    // Chaque Gardien se tient sur son île depuis GD-11 (8 octobre 2026) : `guardians` ne se lit plus, sans faire oublier
    // la région, même invalide.
    const ancienne = {
      '6e': {
        ...valide['6e'],
        guardians: {
          'maths-6e-decimals': { side: 'left', step: 1, turn: 2 },
          'french-6e-reading': { side: 'front', step: 0, spot: { x: 3, y: 30 }, turn: 1 },
          'french-6e-phonology': { side: 'haut', step: 0, turn: 0 },
        },
      },
    };
    expect(sanitizeLayout(ancienne)).toEqual(valide);
    const lu = sanitizeState({ ...EMPTY_STATE, world: { parts: {}, log: [], links: [], layout: ancienne as Layout } });
    expect(lu.world.layout).toEqual(valide);
    expect(fittingPlaces('6e', lu.world.layout!['6e']!.islands!)).toBeTruthy();
    // Une région qui ne gardait que ses Gardiens : rien à poser, la carte de départ.
    expect(sanitizeLayout({ '6e': { guardians: { 'maths-6e-decimals': { side: 'left', step: 1, turn: 2 } } } })).toBeUndefined();
  });

  it('une borne, une arrivée, un raccourci ou une liaison à reposer invalide n’oublie qu’elle-même', () => {
    const casses: [string, unknown][] = [
      ['stations', { 'maths-6e-decimals:compter': { x: 4, y: 14 } }], // une mission qui n'est pas celle du lieu
      ['stations', { 'maths-6e-decimals:ordering:x': { x: 4, y: 14 } }],
      ['stations', { 'maths-6e-decimals:operations': { x: 40, y: 0 } }], // hors du cœur
      ['landings', { inconnue: { from: { side: 'back', step: 0 }, to: { side: 'front', step: 0 } } }],
      ['landings', { [lien5e]: { from: { side: 'back', step: 0 }, to: { side: 'front', step: 0 } } }], // une autre région
      ['shortcuts', ['inconnue']],
      ['relink', [lien5e]],
    ];
    for (const [champ, mauvais] of casses) {
      const r = { ...valide['6e'], [champ]: Array.isArray(mauvais) ? [...(valide['6e']![champ as 'shortcuts']! ?? []), ...mauvais] : { ...(valide['6e']![champ as 'stations'] as object), ...(mauvais as object) } };
      expect(sanitizeLayout({ '6e': r }), `${champ} ${JSON.stringify(mauvais)}`).toEqual(valide);
    }
    // Rien de valide dans un champ : le champ part, la région reste.
    expect(sanitizeLayout({ '6e': { islands: valide['6e']!.islands, relink: 'tout', stations: { 'x:y': { x: 0, y: 0 } } } })).toEqual({ '6e': { islands: valide['6e']!.islands } });
  });

  it('une borne se garde dans le cœur de son lieu, qui suit la taille de son île (GD-11 : 22, et 26 pour les îles-écoles)', () => {
    const borne = (id: string, mission: string, x: number, y: number) => sanitizeLayout({ '6e': { stations: { [`${id}:${mission}`]: { x, y } } } });
    // Un cœur de 22 : de −3 à 18.
    for (const [x, y] of [[-3, 1], [18, 1], [1, -3], [1, 18]]) expect(borne('maths-6e-decimals', 'ordering', x, y), `${x},${y}`).toBeDefined();
    for (const [x, y] of [[-4, 1], [19, 1], [1, -4], [1, 19]]) expect(borne('maths-6e-decimals', 'ordering', x, y), `${x},${y}`).toBeUndefined();
    // Un cœur de 26 (la Forêt) : de −5 à 20.
    const mission = getBiome('french-6e-phonology')!.exercises[0].id;
    for (const [x, y] of [[-5, 1], [20, 1], [-3, 1]]) expect(borne('french-6e-phonology', mission, x, y), `${x},${y}`).toBeDefined();
    for (const [x, y] of [[-6, 1], [21, 1]]) expect(borne('french-6e-phonology', mission, x, y), `${x},${y}`).toBeUndefined();
  });

  it('chaque arrivée possible de chaque lieu, à chaque orientation, se relit telle quelle', () => {
    for (const a of ARCHIPELAGO_IDS) {
      const lien = BRIDGES.find((b) => archipelagoOfIsland(b.from) === a)!.id;
      for (const def of mapOf(a))
        for (const quarts of [0, 1, 2, 3] as const)
          for (const l of possibleLandings({ ...def, quarts })) {
            const arrivee = { side: LAYOUT_SIDE_OF[l.cote], step: l.pas };
            const layout = { [a]: { landings: { [lien]: { from: arrivee, to: arrivee } } } };
            expect(sanitizeLayout(layout), `${def.id} ${quarts} ${l.cote} ${l.pas}`).toEqual(layout);
          }
    }
  });

  it('se pose seulement si elle tient sur la grille : dans le cadre, et ses lieux déplacés à quatre cases d’eau au moins', () => {
    // La Ferme vers un coin du cadre : elle tient.
    const poses = posesOfLayout(valide);
    const c = frameOf('6e');
    expect(poses.get('maths-6e-decimals')).toEqual({ x: c.x0 + 2 * STEP, y: c.y0 + 27 * STEP, quarts: 1 });
    // Posée sur la Forêt, ou hors du cadre : la région reste à sa carte de départ.
    const foret = startingIsland('french-6e-phonology').core;
    const surLaForet = { x: (foret.x - c.x0) / STEP, y: Math.round((foret.y - c.y0) / STEP), turn: 0 as const };
    expect(fittingPlaces('6e', { 'maths-6e-decimals': surLaForet })).toBeNull();
    expect(posesOfLayout({ '6e': { islands: { 'maths-6e-decimals': surLaForet } } }).size).toBe(0);
    expect(posesOfLayout({ '6e': { islands: { 'maths-6e-decimals': { x: 60, y: 0, turn: 0 } } } }).size).toBe(0);
    // Sans rien de déplacé, la carte de départ tient.
    expect(fittingPlaces('6e', {})).not.toBeNull();
  });
});
