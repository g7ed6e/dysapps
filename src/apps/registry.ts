// Catalogue des quêtes. Pour en ajouter une : créer son dossier dans src/apps/,
// puis l'ajouter ici avec `status: 'disponible'` et son composant `component`.
import type { ComponentType } from 'react';
import { lazy } from 'react';
import type { AnyIconName } from '../components/Icon';

export type Subject = 'francais' | 'maths';

export interface AppDef {
  id: string;
  subject: Subject;
  title: string;
  description: string;
  icon: AnyIconName;
  status: 'disponible' | 'bientot';
  component?: ComponentType;
}

export const SUBJECTS: Record<Subject, { title: string; icon: AnyIconName; description: string }> = {
  francais: { title: 'Français', icon: 'book', description: 'Homophones, lecture, compréhension' },
  maths: { title: 'Maths', icon: 'calculator', description: 'Calcul mental, fractions, décimaux' },
};

export const APPS: AppDef[] = [
  {
    id: 'demo',
    subject: 'francais',
    title: 'Tutoriel',
    description: 'Une quête d’entraînement pour prendre les commandes en main.',
    icon: 'compass',
    status: 'disponible',
    component: lazy(() => import('./demo/DemoApp')),
  },
  {
    id: 'homophones',
    subject: 'francais',
    title: 'Homophones',
    description: 'a / à, et / est, son / sont, ces / ses… 3 niveaux et 13 paires à maîtriser.',
    icon: 'shuffle',
    status: 'disponible',
    component: lazy(() => import('./homophones/HomophonesApp')),
  },
  { id: 'lecture', subject: 'francais', title: 'Lecture', description: 'Des textes classiques lus à voix haute, avec des questions.', icon: 'library', status: 'bientot' },
  { id: 'tables', subject: 'maths', title: 'Tables & calcul mental', description: 'Multiplications et compléments, avec aides visuelles.', icon: 'zap', status: 'bientot' },
  { id: 'fractions', subject: 'maths', title: 'Fractions', description: 'Parts et barres pour comprendre les fractions.', icon: 'pizza', status: 'bientot' },
  { id: 'decimaux', subject: 'maths', title: 'Nombres décimaux', description: 'Tableau de numération et droite graduée.', icon: 'ruler', status: 'bientot' },
];

export function getApp(id: string | undefined): AppDef | undefined {
  return APPS.find((a) => a.id === id);
}

/** Meilleur score d'une quête, tous modes confondus (« homophones », « homophones:niveau-1 »…). */
export function bestScore(apps: Record<string, { bestScore: number }>, appId: string): number | undefined {
  const scores = Object.entries(apps)
    .filter(([key]) => key === appId || key.startsWith(`${appId}:`))
    .map(([, stats]) => stats.bestScore);
  return scores.length ? Math.max(...scores) : undefined;
}

export function appsBySubject(subject: Subject): AppDef[] {
  return APPS.filter((a) => a.subject === subject);
}
