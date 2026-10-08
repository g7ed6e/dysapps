// Le référentiel des programmes officiels : les compétences des cycles 3 et 4 (français, maths, anglais, histoire et
// géographie ; SVT, physique-chimie et technologie ; enseignement moral et civique ; allemand et espagnol en LV2, cycle 4
// seulement) que les missions citent (champ `programme` de biomes.ts et de apps/registry.ts), chacune avec son texte et
// ses classes.
// Provenance : data.gouv.fr, Licence Ouverte ; les programmes plus récents, du Bulletin officiel et d'éduscol (sources.ts).
// Ce module n'entre pas dans le bundle de l'application : les missions n'en importent que des types.
import type { Classe } from '../game/biomes';
import { DOMAINES_C3, ENTRIES_C3 } from './cycle3';
import { DOMAINES_C4, ENTRIES_C4 } from './cycle4';
import { SOURCES } from './sources';
import type { Cycle, Discipline, ProgrammeDomaine, ProgrammeEntry, ProgrammeSource } from './types';

export type { Cycle, Discipline, Exclusion, ExclusionKind, ProgrammeDomaine, ProgrammeEntry, ProgrammeSource, SourceId } from './types';
export { SOURCES, LICENCE_OUVERTE, INFORMATIONS_PUBLIQUES } from './sources';

/** Les disciplines, dans l'ordre du portail, avec le libellé et l'abréviation des identifiants (c3.fr.…). */
export const DISCIPLINES: Record<Discipline, { label: string; short: string }> = {
  french: { label: 'Français', short: 'fr' },
  maths: { label: 'Mathématiques', short: 'ma' },
  english: { label: 'Anglais (langues vivantes)', short: 'en' },
  german: { label: 'Allemand (LV2)', short: 'de' },
  spanish: { label: 'Espagnol (LV2)', short: 'es' },
  'history-geography': { label: 'Histoire et géographie', short: 'hg' },
  // Au cycle 3, les trois forment un seul enseignement, sciences et technologie, que le référentiel découpe comme au
  // collège ; au cycle 4, ce sont trois enseignements. Les libellés valent pour les deux cycles.
  'life-earth-sciences': { label: 'Sciences de la vie et de la Terre (SVT)', short: 'sv' },
  'physics-chemistry': { label: 'Physique-chimie', short: 'pc' },
  technology: { label: 'Technologie', short: 'te' },
  // De la 6e à la 3e, sur le programme du CP à la terminale (2024), rangé par classe ; pas encore de forme dans le jeu.
  civics: { label: 'Enseignement moral et civique (EMC)', short: 'emc' },
};

export const DOMAINES: readonly ProgrammeDomaine[] = [...DOMAINES_C3, ...DOMAINES_C4];
export const PROGRAMME = [...ENTRIES_C3, ...ENTRIES_C4] as const;

/** Un identifiant du référentiel : le compilateur refuse un identifiant inconnu dans une mission. */
export type ProgrammeId = (typeof PROGRAMME)[number]['id'];

/** Le cycle d'une classe : la 6e termine le cycle 3, la 5e, la 4e et la 3e sont le cycle 4. */
export const CYCLE_OF: Record<Classe, Cycle> = { '6e': 3, '5e': 4, '4e': 4, '3e': 4 };

/** Les classes de l'application, dans l'ordre de la scolarité. */
export const CLASSES: readonly Classe[] = ['6e', '5e', '4e', '3e'];

/**
 * Ce qu'une île d'une classe peut citer : une compétence de sa classe (« classe »), ou d'une classe d'avant seulement,
 * pour la consolider (« consolidation ») ; jamais une compétence d'une classe d'après (false).
 */
export function citable(entry: ProgrammeEntry, classe: Classe): 'classe' | 'consolidation' | false {
  if (entry.classes.includes(classe)) return 'classe';
  const rang = CLASSES.indexOf(classe);
  return entry.classes.every((c) => CLASSES.indexOf(c) < rang) ? 'consolidation' : false;
}

const BY_ID = new Map<string, ProgrammeEntry>(PROGRAMME.map((e) => [e.id, e]));

export function byId(id: string): ProgrammeEntry | undefined {
  return BY_ID.get(id);
}

export function domaineOf(entry: ProgrammeEntry): ProgrammeDomaine | undefined {
  return DOMAINES.find((d) => d.id === entry.domaine);
}

/** Le texte où lire une compétence ou un domaine : le sien, sinon l'annexe de 2020 de son cycle. */
export function sourceOf(d: ProgrammeDomaine): ProgrammeSource {
  return SOURCES[d.source ?? `c${d.cycle}`];
}

export function entriesOf(cycle: Cycle, discipline: Discipline): ProgrammeEntry[] {
  return PROGRAMME.filter((e) => e.cycle === cycle && e.discipline === discipline);
}
