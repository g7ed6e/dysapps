import { useEffect } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { stopSpeaking } from '../core/speech';
import { useProgress } from '../core/ProgressContext';
import { XpBar } from './XpBar';
import { Celebrations } from './Celebrations';
import { Icon } from './Icon';
import { useImmersive } from '../blocland/useImmersive';

export function Layout() {
  const { progress } = useProgress();
  const { pathname } = useLocation();
  // Carte et îles de Blocland en 3D : le monde prend tout l'écran sous la barre du haut.
  const immersive = useImmersive() && /^\/aventure(\/[a-z-]+)?$/.test(pathname) && !pathname.endsWith('/chantier');

  // Changer de page coupe la lecture vocale en cours.
  useEffect(() => stopSpeaking, [pathname]);

  return (
    <div className={`app-shell${immersive ? ' immersive' : ''}`}>
      <a className="skip-link" href="#contenu">
        Aller au contenu
      </a>
      <header className="topbar">
        <Link to="/" className="brand" aria-label="Menu DysApps">
          <span className="brand-mark" aria-hidden="true">
            D
          </span>
          <span className="brand-name">DysApps</span>
        </Link>
        <Link to="/succes" className="topbar-xp" aria-label="Voir mon rang et mes succès">
          <XpBar xp={progress.xp} />
        </Link>
        <nav className="topbar-nav" aria-label="Navigation principale">
          <NavLink to="/succes" className="nav-button">
            <Icon name="trophy" />
            <span className="nav-label">Succès</span>
          </NavLink>
          <NavLink to="/reglages" className="nav-button">
            <Icon name="settings" />
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
