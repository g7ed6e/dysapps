// Le plan des parures de l'aéronef du 3e (GD-25) : ses cases et leur prix, l'ordre de la pose, l'arrivée des feux, et
// sa sauvegarde, qui se relit sans rien perdre.
import { describe, expect, it } from 'vitest';
import { GAME_VERSION } from '../../core/migration';
import { fillPlanCell } from '../engine';
import { sanitizeState } from '../engine/sanitize';
import { EMPTY_STATE, type GameState } from '../engine/state';
import { islandsOf } from './archipelago';
import { NEF_PARURES_ID, NEF_PARURES_PLAN, PARURES_GUARDIANS, getParures, paruresFeux, paruresLook, paruresOpenCells } from './nefParures';
import { planCells } from './plans';
import { bossId, isBossBeaten } from '../bossCore';

const keys = planCells(NEF_PARURES_PLAN).map((c) => c.key);
const proue = keys.slice(0, 6);
const pavois = keys.slice(6);

/** Une progression où les `n` premiers Gardiens du 3e sont rallumés. */
function guardians3e(n: number): Record<string, { stars: number }> {
  const progress = Object.fromEntries(islandsOf('3e').slice(0, n).map((b) => [bossId(b.id), { stars: 3 }]));
  expect(islandsOf('3e').filter((b) => isBossBeaten(b.id, progress))).toHaveLength(n);
  return progress;
}

describe('le plan des parures (GD-25)', () => {
  it('coûte 6 marbres pour la figure de proue, en bas, puis 10 quartz pour le pavois ; ni XP ni coffre', () => {
    expect(NEF_PARURES_PLAN.id).toBe('nef-parures');
    expect(NEF_PARURES_PLAN.biome).toBe('maths-3e-functions');
    const bas = NEF_PARURES_PLAN.cells.filter((c) => c.z === 0);
    const haut = NEF_PARURES_PLAN.cells.filter((c) => c.z === 1);
    expect(bas).toHaveLength(6);
    expect(bas.every((c) => c.block === 'maths-3e-geometry')).toBe(true);
    expect(haut).toHaveLength(10);
    expect(haut.every((c) => c.block === 'maths-3e-statistics')).toBe(true);
    expect(NEF_PARURES_PLAN.reward).toEqual({ xp: 0, chest: {} });
    expect(NEF_PARURES_PLAN.done).toBe('La Nef est complète.');
    expect(new Set(keys).size).toBe(16);
    expect(getParures('nef-parures')).toBe(NEF_PARURES_PLAN);
    expect(getParures('navire-reacteur')).toBeUndefined();
  });

  it('se lit en trois temps, jamais les feux avant le pavois', () => {
    expect(paruresLook({}, {}, 5)).toBe(0);
    expect(paruresLook({ [NEF_PARURES_ID]: proue.slice(0, 5) }, {}, 5)).toBe(0);
    expect(paruresLook({ [NEF_PARURES_ID]: proue }, {}, 0)).toBe(1);
    // Assez de lieux restaurés, mais le pavois pas posé : pas de feux.
    expect(paruresLook({ [NEF_PARURES_ID]: [...proue, ...pavois.slice(1)] }, {}, 5)).toBe(1);
    expect(paruresLook({ [NEF_PARURES_ID]: keys }, {}, PARURES_GUARDIANS - 1)).toBe(2);
    expect(paruresLook({ [NEF_PARURES_ID]: keys }, {}, PARURES_GUARDIANS)).toBe(3);
    // Le pavois posé sans la tête (une sauvegarde abîmée) : rien ne se montre à l'envers des pastilles.
    expect(paruresLook({ [NEF_PARURES_ID]: pavois }, {}, 5)).toBe(0);
  });

  it('les feux arrivent avec deux lieux restaurés, ou deux Gardiens du 3e rallumés dans la grille', () => {
    expect(paruresFeux({}, 0)).toEqual({ kit: false, missing: 2 });
    expect(paruresFeux({}, 1)).toEqual({ kit: false, missing: 1 });
    expect(paruresFeux({}, 2)).toEqual({ kit: true, missing: 0 });
    const progress = guardians3e(2);
    expect(paruresFeux(progress, 0).kit).toBe(true);
    expect(paruresLook({ [NEF_PARURES_ID]: keys }, progress, 0)).toBe(3);
  });

  it('se pose dans l’ordre : le pavois ne s’ouvre qu’une fois la figure de proue posée', () => {
    expect(paruresOpenCells({}).every((c) => c.z === 0)).toBe(true);
    expect(paruresOpenCells({ [NEF_PARURES_ID]: proue.slice(0, 4) })).toHaveLength(2);
    expect(paruresOpenCells({ [NEF_PARURES_ID]: proue }).every((c) => c.z === 1)).toBe(true);
    expect(paruresOpenCells({ [NEF_PARURES_ID]: keys })).toHaveLength(0);
  });

  it('se pose comme un plan, et sa dernière case ne donne rien', () => {
    let state: GameState = { ...EMPTY_STATE, stock: { 'maths-3e-geometry': 6, 'maths-3e-statistics': 10 } };
    for (const c of planCells(NEF_PARURES_PLAN)) {
      const r = fillPlanCell(state, NEF_PARURES_PLAN, c.x, c.y, c.z);
      expect(r.ok).toBe(true);
      state = r.state;
    }
    expect(state.world.parts[NEF_PARURES_ID]).toEqual(keys);
    expect(state.stock).toEqual({ 'maths-3e-geometry': 0, 'maths-3e-statistics': 0 });
    expect(state.world.log.at(-1)?.part).toBe(NEF_PARURES_ID);
  });
});

describe('la sauvegarde des parures (GD-25)', () => {
  it('une partie avec des cases posées se relit à l’identique, son journal compris', () => {
    const saved = { version: GAME_VERSION, world: { parts: { [NEF_PARURES_ID]: [...proue, pavois[0]] }, log: [{ day: '2026-10-23', part: NEF_PARURES_ID }], links: [] } };
    const read = sanitizeState(JSON.parse(JSON.stringify(saved)));
    expect(read.world.parts[NEF_PARURES_ID]).toEqual([...proue, pavois[0]]);
    expect(read.world.log).toEqual([{ day: '2026-10-23', part: NEF_PARURES_ID }]);
    // Relue une deuxième fois, elle ne bouge plus.
    expect(sanitizeState(JSON.parse(JSON.stringify(read))).world.parts[NEF_PARURES_ID]).toEqual([...proue, pavois[0]]);
  });

  it('une case hors du plan est jetée, comme ailleurs', () => {
    const read = sanitizeState({ version: GAME_VERSION, world: { parts: { [NEF_PARURES_ID]: [proue[0], '9,9,9', 42] }, links: [] } });
    expect(read.world.parts[NEF_PARURES_ID]).toEqual([proue[0]]);
  });

  it('une partie d’avant les parures se lit sans rien changer : pas de clé, les parures à zéro, le même format', () => {
    const read = sanitizeState({ version: 5, world: { parts: {}, links: [] } });
    expect(read.version).toBe(5);
    expect(read.world.parts[NEF_PARURES_ID]).toBeUndefined();
    expect(paruresLook(read.world.parts, read.progress, 0)).toBe(0);
  });
});
