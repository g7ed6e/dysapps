import { useEffect, useRef } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { AppUpdateBanner } from '../core/AppUpdateBanner';
import { BandeauBatisseur } from './BandeauBatisseur';
import { startAppUpdates } from '../core/appUpdate';
import { stopSpeaking } from '../core/speech';
import { useProgress } from '../core/ProgressContext';
import { useUnivers } from '../core/SettingsContext';
import { UNIVERS } from '../core/univers';
import { moinsDAnimations } from '../core/mouvement';
import { XpBar } from './XpBar';
import { Celebrations } from './Celebrations';
import { Icon, type AnyIconName } from './Icon';
import { ErrorBoundary } from './ErrorBoundary';
import { FocusProvider, useFocusActive } from './FocusMode';
import { useImmersive } from '../blocland/useImmersive';
import { MENU_PATH } from '../core/paths';

/**
 * Archipéo (en pause) : les grands endroits de l'appli, toujours au même endroit et avec les mêmes mots, dans la barre
 * du haut ; sur téléphone, pas d'onglets : la barre garde le Menu et les Réglages (en icônes). Blocland n'a pas de barre
 * du haut : son menu (trois traits) donne le rôle, les grands endroits et l'accueil.
 */
const PLACES: { to: string; icon: AnyIconName; label: string; end?: boolean; phone: boolean; desktop: boolean }[] = [
  { to: MENU_PATH, icon: 'home', label: 'Menu', end: true, phone: true, desktop: false },
  { to: '/adventure', icon: 'map', label: 'Aventure', phone: false, desktop: true },
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
  const universId = useUnivers();
  const univers = UNIVERS[universId];
  const { pathname } = useLocation();
  // Pendant une partie : ni barre du haut ni onglets, seulement le bouton Pause (mode concentration).
  const focus = useFocusActive();
  // Carte et îles de Blocland en 3D : le monde prend tout l'écran, sans barre du haut (son menu, trois traits, la remplace).
  const immersive = useImmersive() && /^\/adventure(\/[a-z0-9-]+)?$/.test(pathname);
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
      {/* Blocland : plus de barre du haut (mot du mainteneur, 4 octobre 2026) ; sur les pages hors du monde, seul le bouton
          Menu reste, en haut à droite, à la place et avec l'icône de celui du monde. */}
      {!focus && !immersive && universId === 'blocland' && pathname !== MENU_PATH && pathname !== '/' && (
        <Link to={MENU_PATH} className="button page-menu" aria-label="Menu">
          <Icon name="menu" size="1.5rem" />
        </Link>
      )}
      {!focus && !immersive && universId !== 'blocland' && (
        <header className="topbar">
          <Link to="/" className="brand" aria-label={`Accueil ${univers.nom}`}>
            {/* Archipéo garde son initiale sur le sable ; Blocland a son logo, l'île en blocs. */}
            {universId === 'archipeo' ? (
              <span className="brand-mark" aria-hidden="true">
                A
              </span>
            ) : (
              <img className="brand-logo" src={`${import.meta.env.BASE_URL}${univers.logo}`} alt="" width={37} height={37} />
            )}
            <span className="brand-name">{univers.nom}</span>
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
                // Le menu est aussi l'accueil quand l'appli s'ouvre sur lui (vue simple).
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
      <BandeauBatisseur />
      <Celebrations />
      <main id="contenu" className="content" ref={main} tabIndex={-1}>
        {/* Une page qui échoue n'emporte pas la barre du haut ; changer de page efface l'erreur
            (sans démonter la page : le monde en 3D reste le même d'une île à l'autre). */}
        <ErrorBoundary resetKey={pathname}>
          <Outlet />
        </ErrorBoundary>
      </main>
    </div>
  );
}
