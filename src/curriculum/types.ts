// Le référentiel des programmes officiels (data.gouv.fr) : les compétences que les missions citent.
// Rien de ce dossier n'est embarqué dans l'application : il sert aux tests et au générateur de documentation.
import type { Subject } from '../apps/registry';

/** Cycle 3 : CM1, CM2, 6e. Cycle 4 : 5e, 4e, 3e. */
export type Cycle = 3 | 4;

/**
 * Les disciplines du référentiel : les matières de l'application, et les deux LV2 (allemand, espagnol, de la 5e à la 3e,
 * cycle 4 seulement). Les LV2 deviennent des matières de l'application avec leur première île (LV2-2 du cadrage du contenu).
 * La SVT, la physique-chimie et la technologie (6e seulement pour l'instant) le deviendront de même, avec leur
 * première île.
 */
export type Discipline =
  | Exclude<Subject, 'lv2'>
  | 'german'
  | 'spanish'
  | 'life-earth-sciences'
  | 'physics-chemistry'
  | 'technology';

export type SourceId = 'c3' | 'c4';

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
  /** Ancre stable, ex. « c3-fr-langue », « c4-es-lire » (c<cycle>-<fr|ma|en|de|es|hg|sv|pc|te>-<domaine>). */
  id: string;
  cycle: Cycle;
  discipline: Discipline;
  /** Intitulé officiel. */
  title: string;
  /** Page du PDF où le domaine commence. */
  page: number;
}

/** Une compétence du programme, au grain d'une mission : ce qu'une mission peut travailler. */
export interface ProgrammeEntry {
  /** Identifiant stable : c<cycle>.<fr|ma|en|de|es|hg|sv|pc|te>.<domaine>.<compétence>. */
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
}

export type ExclusionKind = 'hors-perimetre' | 'a-couvrir';

/** Pourquoi une compétence n'a pas de mission : durablement hors de portée, ou pas encore couverte. */
export interface Exclusion {
  kind: ExclusionKind;
  motif: string;
}
