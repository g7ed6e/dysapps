// Catalogue des missions. Pour en ajouter une : créer son dossier dans src/apps/,
// puis l'ajouter ici avec `status: 'disponible'` et son composant `component`.
import type { ComponentType } from 'react';
import { lazy } from 'react';
import type { AnyIconName } from '../components/Icon';
import type { ProgrammeId } from '../curriculum';
import { LCA_LABELS, LV2_LABELS, type LcaChoice, type Lv2Choice } from '../core/settings';
import { BIOMES } from '../game/biomes';

/**
 * Les matières ; `lv2` est la deuxième langue (espagnol ou allemand), `lca` l'option latin ou grec (langues et cultures
 * de l'Antiquité) : leur titre affiché suit les Réglages (`subjectInfo`).
 */
export type Subject = 'french' | 'maths' | 'english' | 'history-geography' | 'life-earth-sciences' | 'physics-chemistry' | 'technology' | 'civics' | 'lv2' | 'lca';

/** Ce qu'un élève a choisi dans les Réglages et qui change les matières montrées : sa LV2, son option latin ou grec. */
export interface SubjectChoices {
  lv2: Lv2Choice;
  lca: LcaChoice;
}

export interface AppDef {
  id: string;
  subject: Subject;
  /** Compétences du programme officiel que la mission travaille (identifiants de src/curriculum/). */
  programme?: readonly ProgrammeId[];
  title: string;
  description: string;
  icon: AnyIconName;
  status: 'disponible' | 'bientot';
  component?: ComponentType;
  /** Mission du menu, pas d'une matière (le Tutoriel, qui mélange français et maths). */
  onHome?: boolean;
}

/**
 * Chaque matière est une expédition : le français les archives, les maths les mécanismes, l’anglais les routes maritimes,
 * l’histoire-géographie les traces et les paysages, les sciences de la vie et de la Terre le vivant et la planète, la
 * physique-chimie la matière et l’énergie, la technologie les outils et les inventions, la LV2 les escales (de la 6e à la
 * 3e pour les sciences : SC-3), l’EMC les liens et les libertés, le latin et le grec les racines et les légendes
 * (décisions du mainteneur, 8 octobre 2026).
 */
export const SUBJECTS: Record<Subject, { title: string; icon: AnyIconName; description: string; expedition: string }> = {
  french: { title: 'Français', icon: 'book', description: 'Homophones, lecture, compréhension', expedition: 'Archives et récits' },
  maths: { title: 'Maths', icon: 'calculator', description: 'Calcul mental, fractions, décimaux', expedition: 'Mécanismes et énigmes' },
  english: { title: 'Anglais', icon: 'globe', description: 'Vocabulaire, verbes irréguliers, grammaire', expedition: 'Cartes et messages' },
  'history-geography': { title: 'Histoire-géo', icon: 'landmark', description: 'Repères, frises, documents, paysages', expedition: 'Traces et paysages' },
  'life-earth-sciences': { title: 'SVT', icon: 'leaf', description: 'Le vivant, le corps, la Terre', expedition: 'Vivant et planète' },
  'physics-chemistry': { title: 'Physique-chimie', icon: 'flask-conical', description: 'Matière, lumière, forces, énergie', expedition: 'Matière et énergie' },
  technology: { title: 'Technologie', icon: 'wrench', description: 'Objets, réseaux, programmes', expedition: 'Outils et inventions' },
  civics: { title: 'EMC', icon: 'handshake', description: 'Vivre ensemble, droits et libertés, démocratie', expedition: 'Liens et libertés' },
  lv2: { title: 'LV2', icon: 'languages', description: 'Se présenter, compter, parler de sa famille', expedition: 'Escales et rencontres' },
  lca: { title: 'Latin ou grec', icon: 'scroll-text', description: 'Légendes, cités, racines des mots', expedition: 'Racines et légendes' },
};

type SubjectInfo = (typeof SUBJECTS)[Subject];

/**
 * Une matière telle qu'elle s'affiche : la LV2 prend le nom de la langue choisie (« Espagnol », « Allemand »), l'option
 * celui de l'option choisie (« Latin », « Grec »).
 */
export function subjectInfo(subject: Subject, choix: SubjectChoices): SubjectInfo {
  const info = SUBJECTS[subject];
  if (subject === 'lv2' && choix.lv2 !== 'none') return { ...info, title: LV2_LABELS[choix.lv2] };
  if (subject === 'lca' && choix.lca !== 'none') return { ...info, title: LCA_LABELS[choix.lca] };
  return info;
}

let avecDesIles: ReadonlySet<Subject> | undefined;

/**
 * Les matières à montrer : sans LV2 choisie (« Pas de LV2 »), la LV2 n'apparaît nulle part, ni l'option latin ou grec
 * sans option (GD-13) ; une matière sans île ni mission du portail (pas encore au jeu) non plus.
 */
export function visibleSubjects(choix: SubjectChoices): Subject[] {
  avecDesIles ??= new Set(BIOMES.map((b) => b.subject));
  return (Object.keys(SUBJECTS) as Subject[]).filter(
    (s) => (s !== 'lv2' || choix.lv2 !== 'none') && (s !== 'lca' || choix.lca !== 'none') && (avecDesIles?.has(s) || appsBySubject(s).length > 0),
  );
}

export const APPS: AppDef[] = [
  {
    id: 'demo',
    subject: 'french',
    title: 'Tutoriel',
    description: 'Une mission d’entraînement pour prendre les commandes en main.',
    icon: 'compass',
    status: 'disponible',
    onHome: true,
    component: lazy(() => import('./demo/DemoApp')),
  },
  {
    id: 'homophones',
    subject: 'french',
    programme: ['c3.fr.langue.orthographe-grammaticale'],
    title: 'Homophones',
    description: 'a / à, et / est, son / sont, ces / ses… 3 niveaux et 13 paires à maîtriser.',
    icon: 'shuffle',
    status: 'disponible',
    component: lazy(() => import('./homophones/HomophonesApp')),
  },
  {
    id: 'lecture',
    subject: 'french',
    programme: ['c3.fr.lecture.explicite', 'c3.fr.lecture.implicite', 'c3.fr.lecture.lexique-contexte', 'c3.fr.lecture.genres'],
    title: 'Lecture',
    description: 'Fables de La Fontaine, Daudet, Jules Verne : écoute, lis à ton rythme, réponds aux questions.',
    icon: 'library',
    status: 'disponible',
    component: lazy(() => import('./lecture/LectureApp')),
  },
  {
    id: 'tables',
    subject: 'maths',
    programme: ['c3.ma.nombres.faits-numeriques', 'c3.ma.nombres.calcul-mental', 'c3.ma.nombres.calcul-pose'],
    title: 'Tables & calcul mental',
    description: 'Tables, divisions, compléments, doubles, × 10… avec des aides visuelles.',
    icon: 'zap',
    status: 'disponible',
    component: lazy(() => import('./tables/TablesApp')),
  },
  {
    id: 'fractions',
    subject: 'maths',
    programme: ['c3.ma.nombres.fractions-designations', 'c3.ma.nombres.fractions-comparer'],
    title: 'Fractions',
    description: 'Lire, comparer, fractions égales, fraction d’une quantité, droite graduée.',
    icon: 'pizza',
    status: 'disponible',
    component: lazy(() => import('./fractions/FractionsApp')),
  },
  {
    id: 'decimaux',
    subject: 'maths',
    programme: ['c3.ma.nombres.decimaux-ecritures', 'c3.ma.nombres.decimaux-comparer', 'c3.ma.nombres.calcul-mental'],
    title: 'Nombres décimaux',
    description: 'Lire, comparer, droite graduée, fractions décimales, × et ÷ par 10, compléments.',
    icon: 'ruler',
    status: 'disponible',
    component: lazy(() => import('./decimaux/DecimauxApp')),
  },
  {
    id: 'vocabulaire',
    subject: 'english',
    programme: ['c3.en.culture.vie-quotidienne', 'c3.en.ecouter.mots-familiers', 'c3.en.lire.mots-isoles', 'c3.en.ecrire.dictee'],
    title: 'Vocabulaire',
    description: 'Couleurs, famille, école, maison… 12 thèmes : écoute, traduis, écris, avec une voix anglaise.',
    icon: 'languages',
    status: 'disponible',
    component: lazy(() => import('./vocabulaire/VocabulaireApp')),
  },
  {
    id: 'irreguliers',
    subject: 'english',
    programme: ['c4.en.5e.langue.verbe', 'c4.en.langue.temps-verbaux'],
    title: 'Verbes irréguliers',
    description: 'go – went – gone : 60 verbes du collège en 3 niveaux, au prétérit et au participe passé.',
    icon: 'history',
    status: 'disponible',
    component: lazy(() => import('./irreguliers/IrreguliersApp')),
  },
];

export function getApp(id: string | undefined): AppDef | undefined {
  return APPS.find((a) => a.id === id);
}

/** Meilleur score d'une mission, tous modes confondus (« homophones », « homophones:niveau-1 »…). */
export function bestScore(apps: Record<string, { bestScore: number }>, appId: string): number | undefined {
  const scores = Object.entries(apps)
    .filter(([key]) => key === appId || key.startsWith(`${appId}:`))
    .map(([, stats]) => stats.bestScore);
  return scores.length ? Math.max(...scores) : undefined;
}

/** Les missions d'une matière (le Tutoriel est dans le menu, pas dans une matière). */
export function appsBySubject(subject: Subject): AppDef[] {
  return APPS.filter((a) => a.subject === subject && !a.onHome);
}
