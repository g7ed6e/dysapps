// La disposition de la sauvegarde (GD-9, L3) : lue et vérifiée, absente ou invalide, c'est la carte de départ, et une
// sauvegarde d'avant se lit sans rien perdre.
import { describe, expect, it } from 'vitest';
import { EMPTY_STATE, sanitizeState } from '../engine';
import { BRIDGES } from './archipelago';
import { archipelagoOfIsland } from './archipelagos';
import { cadreDe, lieuxTenus, posesDeLaDisposition } from './footprint';
import { lieuDeDepart } from './map';
import { PAS } from './placement';
import { type Layout, sanitizeLayout } from './regionLayout';

const lien6e = BRIDGES.find((b) => archipelagoOfIsland(b.from) === '6e')!.id;
const lien5e = BRIDGES.find((b) => archipelagoOfIsland(b.from) === '5e')!.id;

/** Une disposition du 6e complète et valide : la Ferme déplacée au coin bas-droit du cadre, sans rien toucher. */
const valide: Layout = {
  '6e': {
    islands: { 'maths-6e-decimals': { x: 39, y: 27, turn: 1 } },
    guardians: { 'maths-6e-decimals': { side: 'left', step: 1, turn: 2 } },
    stations: { 'maths-6e-decimals:compter': { x: 4, y: 14 } },
    landings: { [lien6e]: { from: { side: 'back', step: 2 }, to: { side: 'front', step: -1 } } },
    joined: [['french-6e-phonology', 'french-6e-letter-confusion']],
    shortcuts: [lien6e],
    relink: [lien6e],
  },
};

describe('la disposition de la sauvegarde', () => {
  it('absente, ou d’une sauvegarde d’avant GD-9 : rien, la carte de départ', () => {
    expect(sanitizeLayout(undefined)).toBeUndefined();
    expect(sanitizeLayout('carte')).toBeUndefined();
    expect(sanitizeLayout({})).toBeUndefined();
    expect(sanitizeState({ ...EMPTY_STATE, world: { parts: {}, log: [], links: [lien6e] } }).world).toEqual({ parts: {}, log: [], links: [lien6e] });
    expect(posesDeLaDisposition(undefined).size).toBe(0);
  });

  it('valide, elle se lit telle quelle et se garde dans la sauvegarde', () => {
    expect(sanitizeLayout(valide)).toEqual(valide);
    const lu = sanitizeState({ ...EMPTY_STATE, world: { parts: {}, log: [], links: [], layout: valide } });
    expect(lu.world.layout).toEqual(valide);
    expect(sanitizeState(JSON.parse(JSON.stringify(lu))).world.layout).toEqual(valide);
  });

  it('une région invalide est oubliée seule, les autres restent', () => {
    const casses: unknown[] = [
      { islands: { 'maths-5e-signed-numbers': { x: 1, y: 1, turn: 0 } } }, // un lieu d'une autre région
      { islands: { 'maths-6e-decimals': { x: 1.5, y: 1, turn: 0 } } }, // hors du pas
      { islands: { 'maths-6e-decimals': { x: 1, y: 1, turn: 4 } } }, // une orientation qui n'existe pas
      { guardians: { 'maths-6e-decimals': { side: 'haut', step: 0, turn: 0 } } },
      { stations: { 'maths-6e-decimals:compter': { x: 40, y: 0 } } },
      { landings: { inconnue: { from: { side: 'back', step: 0 }, to: { side: 'front', step: 0 } } } },
      { landings: { [lien5e]: { from: { side: 'back', step: 0 }, to: { side: 'front', step: 0 } } } },
      { joined: [['french-6e-phonology', 'french-6e-phonology']] },
      { joined: [['french-6e-phonology', 'french-6e-letter-confusion'], ['french-6e-phonology', 'french-6e-reading']] },
      { shortcuts: ['inconnue'] },
      { relink: 'tout' },
    ];
    for (const r of casses) expect(sanitizeLayout({ '6e': r, '5e': { relink: [lien5e] } }), JSON.stringify(r)).toEqual({ '5e': { relink: [lien5e] } });
  });

  it('se pose seulement si elle tient sur la grille : dans le cadre, et ses lieux déplacés à quatre cases d’eau au moins', () => {
    // La Ferme au coin bas-droit du cadre : elle tient.
    const poses = posesDeLaDisposition(valide);
    const c = cadreDe('6e');
    expect(poses.get('maths-6e-decimals')).toEqual({ x: c.x0 + 39 * PAS, y: c.y0 + 27 * PAS, quarts: 1 });
    // Posée sur la Forêt, ou hors du cadre : la région reste à sa carte de départ.
    const foret = lieuDeDepart('french-6e-phonology').core;
    const surLaForet = { x: (foret.x - c.x0) / PAS, y: Math.round((foret.y - c.y0) / PAS), turn: 0 as const };
    expect(lieuxTenus('6e', { 'maths-6e-decimals': surLaForet })).toBeNull();
    expect(posesDeLaDisposition({ '6e': { islands: { 'maths-6e-decimals': surLaForet } } }).size).toBe(0);
    expect(posesDeLaDisposition({ '6e': { islands: { 'maths-6e-decimals': { x: 60, y: 0, turn: 0 } } } }).size).toBe(0);
    // Sans rien de déplacé, la carte de départ tient.
    expect(lieuxTenus('6e', {})).not.toBeNull();
  });
});
