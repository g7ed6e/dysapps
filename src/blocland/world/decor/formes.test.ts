import { archipelagoOfIsland, ARCHIPELAGO_IDS, type ArchipelagoId } from '../archipels';
import { DECOR_BATI, LANDMARK_OF, REPERES } from '../decor';
import { PROP_KINDS } from '../props';
import type { BiomeId } from '../../biomes';
import { FORMES } from './formes';
import { FORMES_COMMUNES } from './communes';
import { FORMES_6E } from './6e';
import { FORMES_5E } from './5e';
import { FORMES_4E } from './4e';
import { FORMES_3E } from './3e';

const PAR_ARCHIPEL: Record<ArchipelagoId, Record<string, unknown>> = { '6e': FORMES_6E, '5e': FORMES_5E, '4e': FORMES_4E, '3e': FORMES_3E };

it('chaque genre du décor dessiné en primitives a sa forme dans le registre', () => {
  for (const genre of [...PROP_KINDS, ...DECOR_BATI]) expect(FORMES[genre], genre).toBeTypeOf('function');
});

it('aucun genre n’a deux formes : chaque fichier ajoute les siennes sans en remplacer', () => {
  const genres = [FORMES_COMMUNES, ...Object.values(PAR_ARCHIPEL)].flatMap((f) => Object.keys(f));
  expect(new Set(genres).size).toBe(genres.length);
  expect(Object.keys(FORMES).sort()).toEqual([...genres].sort());
});

it('les repères d’un archipel sont dans son fichier, et seulement là', () => {
  for (const [ile, repere] of Object.entries(LANDMARK_OF)) {
    const a = archipelagoOfIsland(ile as BiomeId);
    expect(Object.keys(PAR_ARCHIPEL[a]), `${repere} (${ile})`).toContain(repere);
  }
  for (const a of ARCHIPELAGO_IDS) for (const genre of Object.keys(PAR_ARCHIPEL[a])) expect(REPERES as readonly string[], genre).toContain(genre);
});
