import { Suspense } from 'react';
import { Link, useParams } from 'react-router-dom';
import { SUBJECTS, getApp } from '../apps/registry';
import { Icon } from '../components/Icon';
import { NotFoundPage } from './NotFoundPage';
import { useRememberPlace } from '../core/lastPlace';
import { Loading } from '../components/Loading';

export function AppPage() {
  const { appId } = useParams();
  const app = getApp(appId);
  // « Continuer » (écran titre, accueil) ramène à la dernière quête du portail (pas au Tutoriel).
  useRememberPlace(app && !app.onHome && app.status === 'disponible' ? { path: `/app/${app.id}`, label: app.title } : null);
  if (!app || app.status !== 'disponible' || !app.component) return <NotFoundPage />;
  const Component = app.component;

  return (
    <>
      {/* Le Tutoriel est une quête de l'accueil : on y revient. */}
      <Link to={app.onHome ? '/' : `/matiere/${app.subject}`} className="back-link">
        <Icon name="back" /> {app.onHome ? 'Menu' : SUBJECTS[app.subject].title}
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
