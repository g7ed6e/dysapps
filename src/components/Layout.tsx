import { useEffect, useRef } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { AppUpdateBanner } from '../core/AppUpdateBanner';
import { startAppUpdates } from '../core/appUpdate';
import { stopSpeaking } from '../core/speech';
import { useProgress } from '../core/ProgressContext';
import { moinsDAnimations } from '../core/mouvement';
import { XpBar } from './XpBar';
import { Celebrations } from './Celebrations';
import { Icon, type AnyIconName } from './Icon';
import { ErrorBoundary } from './ErrorBoundary';
import { FocusProvider, useFocusActive } from './FocusMode';
import { useImmersive } from '../blocland/useImmersive';
import { MENU_PATH } from '../core/paths';

/**
 * Les grands endroits de l'appli, toujours au même endroit et avec les mêmes mots, dans la barre du haut. Sur
 * téléphone, pas d'onglets : la barre du haut garde le Menu et les Réglages (en icônes) ; le village a son menu (⏸).
 */
const PLACES: { to: string; icon: AnyIconName; label: string; end?: boolean; phone: boolean; desktop: boolean }[] = [
  { to: MENU_PATH, icon: 'home', label: 'Menu', end: true, phone: true, desktop: false },
  { to: '/aventure', icon: 'map', label: 'Aventure', phone: false, desktop: true },
  { to: '/quetes', icon: 'dumbbell', label: 'Missions', phone: false, desktop: true },
  { to: '/succes', icon: 'trophy', label: 'Succès', phone: false, desktop: true },
  { to: '/reglages', icon: 'settings', label: 'Réglages', phone: true, desktop: true },
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
  const { pathname } = useLocation();
  // Pendant une partie : ni barre du haut ni onglets, seulement le bouton Pause (mode concentration).
  const focus = useFocusActive();
  // Carte et îles de Blocland en 3D : le monde prend tout l'écran sous la barre du haut.
  const immersive = useImmersive() && /^\/aventure(\/[a-z-]+)?$/.test(pathname);
  useEffect(() => startAppUpdates(), []);

  // Changer de page coupe la lecture vocale en cours.
  useEffect(() => stopSpeaking, [pathname]);

  // Un nouvel écran glisse doucement en place (pas le monde de Blocland, ni quand l’appareil demande moins d’animations).
  const main = useRef<HTMLElement>(null);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const reduce = moinsDAnimations();
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
          <Link to="/" className="brand" aria-label="Accueil Archipéo">
            <span className="brand-mark" aria-hidden="true">
              A
            </span>
            <span className="brand-name">Archipéo</span>
          </Link>
          <Link to="/succes" className="topbar-xp" aria-label="Voir mon rôle et mes succès">
            <XpBar xp={progress.xp} />
          </Link>
          <nav className="topbar-nav" aria-label="Navigation principale">
            {PLACES.map((p) => (
              <NavLink
                key={p.to}
                to={p.to}
                end={p.end}
                // Le menu est aussi l'accueil quand l'appli s'ouvre sur lui (réglage « Au démarrage », vue simple).
                className={({ isActive }) =>
                  `nav-button${p.phone ? '' : ' nav-desktop'}${p.desktop ? '' : ' nav-phone'}${isActive || (p.to === MENU_PATH && pathname === '/') ? ' active' : ''}`
                }
                aria-label={p.label}
              >
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
    </div>
  );
}
