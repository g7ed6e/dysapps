// Le référentiel des programmes officiels (data.gouv.fr, Bulletin officiel, éduscol) : les compétences que les missions
// citent. Rien de ce dossier n'est embarqué dans l'application : il sert aux tests et au générateur de documentation.
import type { Subject } from '../apps/registry';
import type { Classe } from '../game/biomes';

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
 * en vigueur pour une discipline et cité par ses domaines (champ `source`) : les sciences de 6e (2023), la technologie du
 * cycle 4 (2024), le français et les maths de 6e (2025) et de 5e (2026), les langues vivantes du collège (2025, un texte
 * par langue et par classe, de la 6e à la 3e).
 */
export type SourceId =
  | 'c3'
  | 'c4'
  | 'c3-2023'
  | 'c4-te-2024'
  | 'c3-fr-2025'
  | 'c3-ma-2025'
  | 'c4-fr-2026'
  | 'c4-ma-2026'
  | 'lv-en-2025'
  | 'lv-de-2025'
  | 'lv-es-2025';

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
  /** Le texte réglementaire qui fixe le programme, tel qu'il est connu : jamais un numéro ou une date non lus. */
  legal: string;
  /** Les classes de l'application que ce texte régit aujourd'hui (une compétence n'en a jamais d'autres). */
  classes: readonly Classe[];
  /** Date de consultation, AAAA-MM-JJ. */
  consulted: string;
  /**
   * Ce que le texte fixe : des attendus de fin de cycle (les programmes de 2016 à 2024), ou des attendus rangés par
   * classe (2025, 2026), qui n'en ont pas de fin de cycle : leurs titres en tiennent lieu (page Programmes du site).
   */
  targets: 'end-of-cycle' | 'per-class';
}

/** Un domaine du programme (« Étude de la langue », « Thème A – Nombres et calculs », « Écouter et comprendre »). */
export interface ProgrammeDomaine {
  /** Ancre stable, ex. « c3-fr-langue », « c4-es-lire », « c4-fr-5e-grammaire » (c<cycle>-<short>[-<classe>]-<domaine>). */
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

/**
 * Une compétence du programme, au grain d'une mission : ce qu'une mission peut travailler, d'après un texte (sa source),
 * pour les classes où ce texte est en vigueur. Une île travaille les compétences de sa classe ; elle peut consolider
 * celles d'une classe d'avant, jamais celles d'une classe d'après (src/game/curriculum.test.ts).
 */
export interface ProgrammeEntry {
  /**
   * Identifiant stable : c<cycle>.<short>.<domaine>.<compétence> (short : DISCIPLINES) ; pour un texte qui répartit ses
   * compétences par classe (français et maths de 2026, langues vivantes de 2025), la classe vient après la discipline :
   * c4.fr.5e.grammaire.accords.
   */
  id: string;
  cycle: Cycle;
  discipline: Discipline;
  /** Identifiant du domaine (ProgrammeDomaine.id). */
  domaine: string;
  /** Le texte cité (celui du domaine) : la page se lit dans son PDF. */
  source: SourceId;
  /** Les classes où la compétence est au programme : celles de son texte, ou la seule classe que le texte lui donne. */
  classes: readonly Classe[];
  /**
   * Ce que le texte attend : l'attendu de fin de cycle (textes de 2020), ou la compétence du texte qui porte les objectifs
   * (textes de 2025 et 2026, rangés par classe), libellé court fidèle au texte.
   */
  attendu: string;
  /** Connaissance, compétence associée ou objectifs d'apprentissage, libellé court fidèle au texte. */
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
