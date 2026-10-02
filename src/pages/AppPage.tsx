import { Suspense } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { SUBJECTS, getApp } from '../apps/registry';
import { Icon } from '../components/Icon';
import { NotFoundPage } from './NotFoundPage';
import { useRememberPlace } from '../core/lastPlace';
import { Loading } from '../components/Loading';
import { MENU_PATH } from '../core/paths';

export function AppPage() {
  const { appId } = useParams();
  const app = getApp(appId);
  // Venu de l'école du village : le retour ramène à sa porte.
  const from = (useLocation().state as { from?: string } | null)?.from;
  const fromSchool = typeof from === 'string' && from.startsWith('/adventure/school') ? from : null;
  // « Continuer » (écran titre, menus) ramène à la dernière mission du portail (pas au Tutoriel).
  useRememberPlace(app && !app.onHome && app.status === 'disponible' ? { path: `/app/${app.id}`, label: app.title } : null);
  if (!app || app.status !== 'disponible' || !app.component) return <NotFoundPage />;
  const Component = app.component;

  return (
    <>
      {/* Le Tutoriel est une mission du menu : on y revient. */}
      <Link to={fromSchool ?? (app.onHome ? MENU_PATH : `/matiere/${app.subject}`)} className="back-link">
        <Icon name="back" /> {fromSchool ? 'École' : app.onHome ? 'Menu' : SUBJECTS[app.subject].title}
      </Link>
      <h1 className={`page-title title-${app.subject}`}>
        <Icon name={app.icon} /> {app.title}
      </h1>
      <Suspense fallback={<Loading />}>
        <Component />
      </Suspense>
    </>
  );
}
