import { useEffect, useRef } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { AppUpdateBanner } from '../core/AppUpdateBanner';
import { startAppUpdates } from '../core/appUpdate';
import { stopSpeaking } from '../core/speech';
import { useProgress } from '../core/ProgressContext';
import { useSettings } from '../core/SettingsContext';
import { XpBar } from './XpBar';
import { Celebrations } from './Celebrations';
import { Icon, type AnyIconName } from './Icon';
import { ErrorBoundary } from './ErrorBoundary';
import { FocusProvider, useFocusActive } from './FocusMode';
import { useImmersive } from '../blocland/useImmersive';
import { MENU_PATH } from '../core/paths';

/**
 * Les grands endroits de l'appli, toujours au même endroit et avec les mêmes mots : en haut sur tablette et
 * ordinateur ; sur téléphone, les quatre premiers en onglets en bas (Réglages reste en haut, en roue dentée).
 */
const PLACES: { to: string; icon: AnyIconName; label: string; end?: boolean; tab: boolean }[] = [
  { to: MENU_PATH, icon: 'home', label: 'Menu', end: true, tab: true },
  { to: '/aventure', icon: 'map', label: 'Aventure', tab: true },
  { to: '/quetes', icon: 'dumbbell', label: 'Quêtes', tab: true },
  { to: '/succes', icon: 'trophy', label: 'Succès', tab: true },
  { to: '/reglages', icon: 'settings', label: 'Réglages', tab: false },
];

export function Layout() {
  return (
    <FocusProvider>
      <Shell />
    </FocusProvider>
  );
}

function Shell() {
  const { progress } = useProgress();
  const { settings } = useSettings();
  const { pathname } = useLocation();
  // Pendant une partie : ni barre du haut ni onglets, seulement le bouton Pause (mode concentration).
  const focus = useFocusActive();
  // Carte et îles de Blocland en 3D : le monde prend tout l'écran sous la barre du haut.
  const immersive = useImmersive() && /^\/aventure(\/[a-z-]+)?$/.test(pathname);
  useEffect(() => startAppUpdates(), []);

  // Changer de page coupe la lecture vocale en cours.
  useEffect(() => stopSpeaking, [pathname]);

  // Un nouvel écran glisse doucement en place (pas le monde de Blocland, ni avec « Réduire les animations »).
  const main = useRef<HTMLElement>(null);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const reduce = settings.reduceMotion || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (immersive || reduce || !main.current?.animate) return;
    main.current.animate(
      [
        { opacity: 0, transform: 'translateY(0.6rem)' },
        { opacity: 1, transform: 'none' },
      ],
      { duration: 180, easing: 'ease-out' },
    );
    // Seulement au changement d'écran.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <div className={`app-shell${immersive ? ' immersive' : ''}${focus ? ' focus' : ''}`}>
      <a className="skip-link" href="#contenu">
        Aller au contenu
      </a>
      {!focus && (
        <header className="topbar">
          <Link to="/" className="brand" aria-label="Accueil DysApps">
            <span className="brand-mark" aria-hidden="true">
              D
            </span>
            <span className="brand-name">DysApps</span>
          </Link>
          <Link to="/succes" className="topbar-xp" aria-label="Voir mon rang et mes succès">
            <XpBar xp={progress.xp} />
          </Link>
          <nav className="topbar-nav" aria-label="Navigation principale">
            {PLACES.slice(1).map((p) => (
              <NavLink key={p.to} to={p.to} end={p.end} className={`nav-button${p.tab ? ' nav-tabbed' : ''}`}>
                <Icon name={p.icon} />
                <span className="nav-label">{p.label}</span>
              </NavLink>
            ))}
          </nav>
        </header>
      )}
      <AppUpdateBanner />
      <Celebrations />
      <main id="contenu" className="content" ref={main}>
        {/* Une page qui échoue n'emporte pas la barre du haut ; changer de page efface l'erreur
            (sans démonter la page : le monde en 3D reste le même d'une île à l'autre). */}
        <ErrorBoundary resetKey={pathname}>
          <Outlet />
        </ErrorBoundary>
      </main>
      {/* Sur téléphone : les onglets en bas, comme dans une appli (pas dans le monde, qui a sa propre barre). */}
      {!focus && !immersive && (
        <nav className="tabbar" aria-label="Onglets">
          {PLACES.filter((p) => p.tab).map((p) => (
            // Le menu est aussi l'accueil quand l'appli s'ouvre sur lui (réglage « Au démarrage », vue simple).
            <NavLink key={p.to} to={p.to} end={p.end} className={({ isActive }) => `tab${isActive || (p.to === MENU_PATH && pathname === '/') ? ' active' : ''}`}>
              <Icon name={p.icon} size="1.5rem" />
              <span>{p.label}</span>
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  );
}
