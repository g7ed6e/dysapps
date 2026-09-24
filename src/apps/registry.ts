// Catalogue des applications. Pour ajouter une app : créer son dossier dans src/apps/,
// puis l'ajouter ici avec `status: 'disponible'` et son composant `component`.
import type { ComponentType } from 'react';
import { lazy } from 'react';

export type Subject = 'francais' | 'maths';

export interface AppDef {
  id: string;
  subject: Subject;
  title: string;
  description: string;
  icon: string;
  status: 'disponible' | 'bientot';
  component?: ComponentType;
}

export const SUBJECTS: Record<Subject, { title: string; icon: string; description: string }> = {
  francais: { title: 'Français', icon: '📖', description: 'Homophones, lecture et compréhension' },
  maths: { title: 'Maths', icon: '🔢', description: 'Calcul mental, fractions, nombres décimaux' },
};

export const APPS: AppDef[] = [
  {
    id: 'demo',
    subject: 'francais',
    title: 'Séance découverte',
    description: 'Un petit essai pour découvrir comment fonctionnent les exercices.',
    icon: '🧭',
    status: 'disponible',
    component: lazy(() => import('./demo/DemoApp')),
  },
  { id: 'homophones', subject: 'francais', title: 'Homophones', description: 'a / à, et / est, son / sont, ces / ses, on / ont…', icon: '🔀', status: 'bientot' },
  { id: 'lecture', subject: 'francais', title: 'Lecture & compréhension', description: 'Des textes classiques lus à voix haute, avec des questions.', icon: '📚', status: 'bientot' },
  { id: 'tables', subject: 'maths', title: 'Tables & calcul mental', description: 'Multiplications et compléments avec aides visuelles.', icon: '✖️', status: 'bientot' },
  { id: 'fractions', subject: 'maths', title: 'Fractions', description: 'Parts de disques et barres pour comprendre les fractions.', icon: '🍕', status: 'bientot' },
  { id: 'decimaux', subject: 'maths', title: 'Nombres décimaux', description: 'Tableau de numération et droite graduée.', icon: '📏', status: 'bientot' },
];

export function getApp(id: string | undefined): AppDef | undefined {
  return APPS.find((a) => a.id === id);
}

export function appsBySubject(subject: Subject): AppDef[] {
  return APPS.filter((a) => a.subject === subject);
}
