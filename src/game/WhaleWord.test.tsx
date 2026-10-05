import { act, renderHook } from '@testing-library/react';
import { sanitizeState } from './engine';
import { useWhaleWord } from './WhaleWord';
import { CARTE_CHANGEE, pagesBaleine } from '../universes/whale';
import { textesDe } from '../universes';
import { MAP_RESHAPED, playedBeforeReshape } from './world/whale';

const lu = () => JSON.parse(localStorage.getItem('dysapps:guide-messages') ?? 'null') as Record<string, boolean> | null;

describe('l’annonce du changement de forme de la carte (GD-9) : une fois par appareil, pour une partie d’avant', () => {
  beforeEach(() => localStorage.clear());

  it('une partie d’avant (une liaison payée, ou un lieu ouvert en plus du départ)', () => {
    expect(playedBeforeReshape(sanitizeState({}))).toBe(false);
    expect(playedBeforeReshape(sanitizeState({ world: { links: ['french-6e-phonology-french-6e-letter-confusion'] } }))).toBe(true);
    expect(playedBeforeReshape(sanitizeState({ world: { links: ['passage-5e'] } }))).toBe(true);
  });

  it('une partie d’avant l’entend d’abord, une seule fois, aux mêmes mots dans les deux univers ; les étapes en attente parlent ensuite', () => {
    // Un appareil où la baleine a déjà parlé, sans la clé de l'annonce : la première lecture de cette version.
    localStorage.setItem('dysapps:guide-messages', JSON.stringify({ 'baleine-6e-arrivee': true }));
    const state = sanitizeState({ world: { links: ['french-6e-phonology-french-6e-letter-confusion'] } });
    const { result, rerender } = renderHook(() => useWhaleWord(state, '6e'));
    expect(lu()![MAP_RESHAPED]).toBe(false);
    expect(result.current.word?.id).toBe(MAP_RESHAPED);
    expect(result.current.word?.kind).toBe('carte');
    for (const u of ['blocland', 'archipeo'] as const) expect(pagesBaleine(result.current.word!, textesDe(u))).toEqual([CARTE_CHANGEE]);
    expect(CARTE_CHANGEE).toBe('L’archipel a changé de forme. Tes îles et tes ouvrages sont gardés.');
    act(() => result.current.close());
    rerender();
    expect(lu()![MAP_RESHAPED]).toBe(true);
    // Le premier ouvrage payé, atteint en même temps, n'a pas été noté dit avec l'annonce : il parle ensuite.
    expect(result.current.word?.id).toBe('baleine-6e-ouvrage');
    // Revenu plus tard : l'annonce ne revient pas.
    const encore = renderHook(() => useWhaleWord(state, '6e'));
    expect(encore.result.current.word?.id).not.toBe(MAP_RESHAPED);
  });

  it('une partie neuve ne l’entend jamais, même une fois des ouvrages posés', () => {
    const neuve = sanitizeState({});
    renderHook(() => useWhaleWord(neuve, '6e'));
    expect(lu()![MAP_RESHAPED]).toBe(true);
    const plusTard = sanitizeState({ world: { links: ['french-6e-phonology-french-6e-letter-confusion'] } });
    const { result } = renderHook(() => useWhaleWord(plusTard, '6e'));
    expect(result.current.word?.id).not.toBe(MAP_RESHAPED);
  });
});
