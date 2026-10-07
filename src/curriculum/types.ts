// Le référentiel des programmes officiels (data.gouv.fr) : les compétences que les missions citent.
// Rien de ce dossier n'est embarqué dans l'application : il sert aux tests et au générateur de documentation.
import type { Subject } from '../apps/registry';

/** Cycle 3 : CM1, CM2, 6e. Cycle 4 : 5e, 4e, 3e. */
export type Cycle = 3 | 4;

/**
 * Les disciplines du référentiel : les matières de l'application, et les deux LV2 (allemand, espagnol, de la 5e à la 3e,
 * cycle 4 seulement). Les LV2 deviennent des matières de l'application avec leur première île (LV2-2 du cadrage du contenu).
 * La SVT, la physique-chimie et la technologie (cycles 3 et 4) le deviennent de même, avec leurs îles.
 */
export type Discipline =
  | Exclude<Subject, 'lv2'>
  | 'german'
  | 'spanish'
  | 'life-earth-sciences'
  | 'physics-chemistry'
  | 'technology';

/**
 * c3, c4 : les annexes de 2020 (data.gouv.fr), source par défaut de chaque cycle. Les autres : un programme plus récent,
 * en vigueur pour une discipline et cité par ses domaines (champ `source`).
 */
export type SourceId = 'c3' | 'c4' | 'c3-2023' | 'c4-te-2024';

/** D'où vient le texte : le jeu de données data.gouv.fr, son PDF, sa licence. */
export interface ProgrammeSource {
  id: SourceId;
  /** Titre du jeu de données sur data.gouv.fr. */
  dataset: string;
  datasetUrl: string;
  /** Le PDF de l'annexe (une par cycle). */
  title: string;
  pdfUrl: string;
  pages: number;
  licence: { name: string; url: string };
  /** Le texte réglementaire qui fixe le programme. */
  legal: string;
  /** Date de consultation, AAAA-MM-JJ. */
  consulted: string;
}

/** Un domaine du programme (« Étude de la langue », « Thème A – Nombres et calculs », « Écouter et comprendre »). */
export interface ProgrammeDomaine {
  /** Ancre stable, ex. « c3-fr-langue », « c4-es-lire » (c<cycle>-<short>-<domaine>, short : DISCIPLINES). */
  id: string;
  cycle: Cycle;
  discipline: Discipline;
  /** Intitulé officiel. */
  title: string;
  /** Page du PDF où le domaine commence. */
  page: number;
  /** Le texte cité, quand ce n'est pas l'annexe de 2020 du cycle (c3, c4) : ses pages et celles de ses compétences. */
  source?: SourceId;
  /** Page estimée, pas encore lue dans le texte en vigueur : le site l'affiche « à vérifier ». */
  unverified?: true;
}

/** Une compétence du programme, au grain d'une mission : ce qu'une mission peut travailler. */
export interface ProgrammeEntry {
  /** Identifiant stable : c<cycle>.<short>.<domaine>.<compétence> (short : DISCIPLINES). */
  id: string;
  cycle: Cycle;
  discipline: Discipline;
  /** Identifiant du domaine (ProgrammeDomaine.id). */
  domaine: string;
  /** Attendu de fin de cycle, libellé court fidèle au texte. */
  attendu: string;
  /** Connaissance ou compétence associée, libellé court fidèle au texte. */
  competence: string;
  /** Page du PDF source. */
  page: number;
  /** Libellé et page estimés, pas encore lus dans le texte en vigueur : le site l'affiche « à vérifier ». */
  unverified?: true;
}

export type ExclusionKind = 'hors-perimetre' | 'a-couvrir';

/** Pourquoi une compétence n'a pas de mission : durablement hors de portée, ou pas encore couverte. */
export interface Exclusion {
  kind: ExclusionKind;
  motif: string;
}
