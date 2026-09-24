import { Link, NavLink, Outlet } from 'react-router-dom';
import { useProgress } from '../core/ProgressContext';
import { XpBar } from './XpBar';
import { Celebrations } from './Celebrations';

export function Layout() {
  const { progress } = useProgress();
  return (
    <div className="app-shell">
      <a className="skip-link" href="#contenu">
        Aller au contenu
      </a>
      <header className="topbar">
        <Link to="/" className="brand" aria-label="Accueil DysApps">
          <img src={`${import.meta.env.BASE_URL}icon.svg`} alt="" width="40" height="40" />
          <span>DysApps</span>
        </Link>
        <Link to="/progression" className="topbar-xp" aria-label="Voir ma progression">
          <XpBar xp={progress.xp} />
        </Link>
        <nav className="topbar-nav" aria-label="Navigation principale">
          <NavLink to="/progression" className="nav-button">
            <span aria-hidden="true">🏆</span>
            <span className="nav-label">Badges</span>
          </NavLink>
          <NavLink to="/reglages" className="nav-button">
            <span aria-hidden="true">⚙️</span>
            <span className="nav-label">Réglages</span>
          </NavLink>
        </nav>
      </header>
      <Celebrations />
      <main id="contenu" className="content">
        <Outlet />
      </main>
    </div>
  );
}
