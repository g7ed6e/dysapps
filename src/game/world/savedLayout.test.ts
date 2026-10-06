// La disposition de la sauvegarde (GD-9, L3) : lue et vérifiée, absente ou invalide, c'est la carte de départ, et une
// sauvegarde d'avant se lit sans rien perdre.
import { describe, expect, it } from 'vitest';
import { EMPTY_STATE, sanitizeState } from '../engine';
import { BRIDGES } from './archipelago';
import { archipelagoOfIsland } from './archipelagos';
import { frameOf, fittingPlaces, posesOfLayout } from './footprint';
import { startingIsland } from './map';
import { STEP } from './placement';
import { type Layout, LAYOUT_LAST_SPOT, sanitizeLayout } from './savedLayout';
import { ARCHIPELAGO_IDS } from './archipelagos';

const lien6e = BRIDGES.find((b) => archipelagoOfIsland(b.from) === '6e')!.id;
const lien5e = BRIDGES.find((b) => archipelagoOfIsland(b.from) === '5e')!.id;

/**
 * Une disposition du 6e complète et valide : la Ferme déplacée vers un coin du cadre, sans rien toucher (au coin bas-droit
 * jusqu'à HG-2 : les îles d'histoire-géographie y sont entrées).
 */
const valide: Layout = {
  '6e': {
    islands: { 'maths-6e-decimals': { x: 42, y: 3, turn: 1 } },
    guardians: { 'maths-6e-decimals': { side: 'left', step: 1, turn: 2 } },
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

  it('des lieux, des réunions ou des Gardiens invalides : la région est oubliée seule, les autres restent', () => {
    const casses: unknown[] = [
      { islands: { 'maths-5e-signed-numbers': { x: 1, y: 1, turn: 0 } } }, // un lieu d'une autre région
      { islands: { 'maths-6e-decimals': { x: 1.5, y: 1, turn: 0 } } }, // hors du pas
      { islands: { 'maths-6e-decimals': { x: 1, y: 1, turn: 4 } } }, // une orientation qui n'existe pas
      { islands: { 'maths-6e-decimals': { x: 49, y: 1, turn: 0 } } }, // hors du cadre (48 pas au plus aux Premiers Rivages)
      { islands: { 'maths-6e-decimals': { x: 1, y: 37, turn: 0 } } }, // hors du cadre (36 pas au plus)
      { guardians: { 'maths-6e-decimals': { side: 'haut', step: 0, turn: 0 } } },
      { joined: [['french-6e-phonology', 'french-6e-phonology']] },
      { joined: [['french-6e-phonology', 'french-6e-letter-confusion'], ['french-6e-phonology', 'french-6e-reading']] },
    ];
    for (const r of casses) expect(sanitizeLayout({ '6e': r, '5e': { relink: [lien5e] } }), JSON.stringify(r)).toEqual({ '5e': { relink: [lien5e] } });
    // Le bout du cadre est encore une place.
    expect(sanitizeLayout({ '6e': { islands: { 'maths-6e-decimals': { x: 48, y: 36, turn: 0 } } } })).toEqual({ '6e': { islands: { 'maths-6e-decimals': { x: 48, y: 36, turn: 0 } } } });
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

  it('se pose seulement si elle tient sur la grille : dans le cadre, et ses lieux déplacés à quatre cases d’eau au moins', () => {
    // La Ferme vers un coin du cadre : elle tient.
    const poses = posesOfLayout(valide);
    const c = frameOf('6e');
    expect(poses.get('maths-6e-decimals')).toEqual({ x: c.x0 + 42 * STEP, y: c.y0 + 3 * STEP, quarts: 1 });
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
