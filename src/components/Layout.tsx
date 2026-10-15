import { useEffect, useRef } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { AppUpdateBanner } from '../core/AppUpdateBanner';
import { BuilderBanner } from './BuilderBanner';
import { startAppUpdates } from '../core/appUpdate';
import { stopSpeaking } from '../core/speech';
import { moinsDAnimations } from '../core/motion';
import { Celebrations } from './Celebrations';
import { Icon } from './Icon';
import { ErrorBoundary } from './ErrorBoundary';
import { FocusProvider, useFocusActive } from './FocusMode';
import { useImmersive } from '../game/useImmersive';
import { MENU_PATH } from '../core/paths';
import { RotateDevice, usePortrait } from './RotateDevice';

export function Layout() {
  return (
    <FocusProvider>
      <Shell />
    </FocusProvider>
  );
}

function Shell() {
  const { pathname } = useLocation();
  // Pendant une partie : ni bouton Menu ni onglets, seulement le bouton Pause (mode concentration).
  const focus = useFocusActive();
  // Carte et îles en 3D : le monde prend tout l'écran, avec ses accès directs.
  const monde = useImmersive();
  const immersive = monde && /^\/adventure(\/[a-z0-9-]+)?$/.test(pathname);
  // Tenu en portrait, l'appareil ne montre que « Tourne ton appareil » : l'appli, dessous, ne se touche ni ne se lit.
  const portrait = usePortrait();
  useEffect(() => startAppUpdates(), []);

  // Changer de page coupe la lecture vocale en cours.
  useEffect(() => stopSpeaking, [pathname]);

  // Un nouvel écran glisse doucement en place (pas le monde en 3D, ni quand l’appareil demande moins d’animations).
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
    <>
    {portrait && <RotateDevice />}
    <div className={`app-shell${immersive ? ' immersive' : ''}${focus ? ' focus' : ''}`} inert={portrait}>
      <a className="skip-link" href="#contenu">
        Aller au contenu
      </a>
      {/* Plus de barre du haut, dans les deux univers (mot du mainteneur, 4 octobre 2026 ; « 3a » pour Archipéo) : sur
          les pages hors du monde, un seul bouton en haut à droite. Le monde en 3D n'a plus de Menu (10 octobre 2026) :
          c'est une croix, qui ramène au monde. En vue simple, sans monde, c'est le bouton Menu, vers le menu en page. */}
      {!focus && !immersive && pathname !== MENU_PATH && pathname !== '/' &&
        (monde ? (
          <Link to="/adventure" className="button page-menu" aria-label="Retour au monde">
            <Icon name="close" size="1.5rem" />
          </Link>
        ) : (
          <Link to={MENU_PATH} className="button page-menu" aria-label="Menu">
            <Icon name="menu" size="1.5rem" />
          </Link>
        ))}
      <AppUpdateBanner />
      <BuilderBanner />
      <Celebrations />
      <main id="contenu" className="content" ref={main} tabIndex={-1}>
        {/* Une page qui échoue n'emporte pas le bouton du haut ; changer de page efface l'erreur
            (sans démonter la page : le monde en 3D reste le même d'une île à l'autre). */}
        <ErrorBoundary resetKey={pathname}>
          <Outlet />
        </ErrorBoundary>
      </main>
    </div>
    </>
  );
}
