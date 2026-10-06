// Le référentiel des programmes officiels : les compétences des cycles 3 et 4 (français, maths, anglais, histoire et
// géographie ; SVT, physique-chimie et technologie, 6e seulement pour l'instant ; allemand et espagnol en LV2, cycle 4
// seulement) que les missions citent (champ `programme` de biomes.ts et de apps/registry.ts).
// Provenance : data.gouv.fr, Licence Ouverte.
// Ce module n'entre pas dans le bundle de l'application : les missions n'en importent que des types.
import type { Classe } from '../game/biomes';
import { DOMAINES_C3, ENTRIES_C3 } from './cycle3';
import { DOMAINES_C4, ENTRIES_C4 } from './cycle4';
import type { Cycle, Discipline, ProgrammeDomaine, ProgrammeEntry } from './types';

export type { Cycle, Discipline, Exclusion, ExclusionKind, ProgrammeDomaine, ProgrammeEntry, ProgrammeSource, SourceId } from './types';
export { SOURCES, LICENCE_OUVERTE } from './sources';

/** Les disciplines, dans l'ordre du portail, avec le libellé et l'abréviation des identifiants (c3.fr.…). */
export const DISCIPLINES: Record<Discipline, { label: string; short: string }> = {
  french: { label: 'Français', short: 'fr' },
  maths: { label: 'Mathématiques', short: 'ma' },
  english: { label: 'Anglais (langues vivantes)', short: 'en' },
  german: { label: 'Allemand (LV2)', short: 'de' },
  spanish: { label: 'Espagnol (LV2)', short: 'es' },
  'history-geography': { label: 'Histoire et géographie', short: 'hg' },
  'life-earth-sciences': { label: 'SVT (sciences et technologie)', short: 'sv' },
  'physics-chemistry': { label: 'Physique-chimie (sciences et technologie)', short: 'pc' },
  technology: { label: 'Technologie (sciences et technologie)', short: 'te' },
};

export const DOMAINES: readonly ProgrammeDomaine[] = [...DOMAINES_C3, ...DOMAINES_C4];
export const PROGRAMME = [...ENTRIES_C3, ...ENTRIES_C4] as const;

/** Un identifiant du référentiel : le compilateur refuse un identifiant inconnu dans une mission. */
export type ProgrammeId = (typeof PROGRAMME)[number]['id'];

/** Le cycle d'une classe : la 6e termine le cycle 3, la 5e, la 4e et la 3e sont le cycle 4. */
export const CYCLE_OF: Record<Classe, Cycle> = { '6e': 3, '5e': 4, '4e': 4, '3e': 4 };

const BY_ID = new Map<string, ProgrammeEntry>(PROGRAMME.map((e) => [e.id, e]));

export function byId(id: string): ProgrammeEntry | undefined {
  return BY_ID.get(id);
}

export function domaineOf(entry: ProgrammeEntry): ProgrammeDomaine | undefined {
  return DOMAINES.find((d) => d.id === entry.domaine);
}

export function entriesOf(cycle: Cycle, discipline: Discipline): ProgrammeEntry[] {
  return PROGRAMME.filter((e) => e.cycle === cycle && e.discipline === discipline);
}
