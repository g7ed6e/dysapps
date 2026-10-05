import { describe, expect, it, vi } from 'vitest';
import type { RappelsDeLaVue } from '../world/view';
import { objetDuToucher, ouvrirLObjet } from './gestes';

describe('les touchers sur le monde', () => {
  it('une borne, un lieu ou un ouvrage touché est un objet ; une face ou le sol ne le sont pas', () => {
    expect(objetDuToucher({ kind: 'quest', biome: 'french-6e-phonology', typeId: 'sons' })).toEqual({ genre: 'borne', id: 'french-6e-phonology:sons' });
    expect(objetDuToucher({ kind: 'place', place: 'school', island: 'french-6e-phonology' })).toEqual({ genre: 'lieu', id: 'school', ile: 'french-6e-phonology' });
    expect(objetDuToucher({ kind: 'bridge', id: 'pont-1' })).toEqual({ genre: 'ouvrage', id: 'pont-1' });
    const cell = { x: 1, y: 2, z: 3 };
    expect(objetDuToucher({ kind: 'face', cell, next: cell })).toBeNull();
    expect(objetDuToucher({ kind: 'island', id: 'french-6e-phonology', cell })).toBeNull();
  });

  it('chaque genre d’objet ouvre la fiche de son rappel', () => {
    const r = { onPickQuest: vi.fn(), onPickCreature: vi.fn(), onPickVehicle: vi.fn(), onPickBridge: vi.fn(), onPickPlace: vi.fn() } satisfies RappelsDeLaVue;
    ouvrirLObjet({ genre: 'borne', id: 'french-6e-phonology:sons' }, r);
    expect(r.onPickQuest).toHaveBeenCalledWith('french-6e-phonology', 'sons');
    ouvrirLObjet({ genre: 'gardien', id: 'french-6e-phonology' }, r);
    expect(r.onPickCreature).toHaveBeenCalledWith('french-6e-phonology', 'guardian');
    ouvrirLObjet({ genre: 'navire', port: 'french-6e-phonology' }, r);
    expect(r.onPickVehicle).toHaveBeenCalledWith('french-6e-phonology');
    ouvrirLObjet({ genre: 'ouvrage', id: 'pont-1' }, r);
    expect(r.onPickBridge).toHaveBeenCalledWith('pont-1');
    ouvrirLObjet({ genre: 'lieu', id: 'school', ile: 'french-6e-phonology' }, r);
    expect(r.onPickPlace).toHaveBeenCalledWith('school', 'french-6e-phonology');
    // Une borne dont l'île n'en est pas une n'ouvre rien.
    ouvrirLObjet({ genre: 'borne', id: 'nulle-part:x' }, r);
    expect(r.onPickQuest).toHaveBeenCalledTimes(1);
  });
});
