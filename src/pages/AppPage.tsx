import { Suspense } from 'react';
import { Link, useParams } from 'react-router-dom';
import { SUBJECTS, getApp } from '../apps/registry';
import { NotFoundPage } from './NotFoundPage';

export function AppPage() {
  const { appId } = useParams();
  const app = getApp(appId);
  if (!app || app.status !== 'disponible' || !app.component) return <NotFoundPage />;
  const Component = app.component;

  return (
    <>
      <Link to={`/matiere/${app.subject}`} className="back-link">
        ← {SUBJECTS[app.subject].title}
      </Link>
      <h1 className="page-title">
        <span aria-hidden="true">{app.icon} </span>
        {app.title}
      </h1>
      <Suspense fallback={<p className="loading">Chargement…</p>}>
        <Component />
      </Suspense>
    </>
  );
}
