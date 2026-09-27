import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { unlockSounds } from '../blocland/sound';
import { lastPlace } from '../core/lastPlace';
import { unlockSpeech } from '../core/speech';
import { Icon } from './Icon';
import { Syllabified } from './Syllabified';

const SESSION_KEY = 'dysapps:titre-vu';

function seenThisSession(): boolean {
  try {
    return sessionStorage.getItem(SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

/**
 * L'écran titre, une fois par lancement : le bloc d'herbe, « Jouer » (le village, derrière, est déjà là), et
 * « Continuer » vers la dernière quête. Il a
 * aussi une raison technique : les navigateurs gardent la voix et les sons muets tant que l'élève n'a pas touché
 * l'écran ; ce premier toucher les débloque pour toute la séance. Rien n'y défile tout seul et rien n'y est chronométré :
 * il attend l'élève.
 */
export function TitleScreen() {
  const [open, setOpen] = useState(() => !seenThisSession());
  const navigate = useNavigate();
  // L'adresse d'ouverture (l'accueil mène ensuite au village : on la garde telle qu'elle était au lancement).
  const [launchedAt] = useState(useLocation().pathname);
  if (!open) return null;
  // « Continuer » seulement quand l'appli s'ouvre sur l'accueil (un lien direct vers une page y mène déjà).
  const resume = launchedAt === '/' ? lastPlace() : null;

  const start = (to?: string) => {
    unlockSpeech();
    unlockSounds();
    try {
      sessionStorage.setItem(SESSION_KEY, '1');
    } catch {
      // Stockage indisponible : l'écran titre reviendra au prochain chargement, sans gêne.
    }
    setOpen(false);
    if (to) navigate(to);
  };

  return (
    <div className="title-screen" role="dialog" aria-modal="true" aria-labelledby="titre-appli">
      <div className="title-card">
        <img className="title-logo" src={`${import.meta.env.BASE_URL}icon.svg`} alt="" width={160} height={160} />
        <h1 id="titre-appli" className="title-name">
          DysApps
        </h1>
        <p className="title-tagline">
          <Syllabified text="Français, maths et anglais, à ton rythme." />
        </p>
        <div className="title-actions">
          {resume && (
            <button type="button" className="button primary title-button" onClick={() => start(resume.path)} autoFocus>
              <Icon name="play" /> Continuer : {resume.label}
            </button>
          )}
          {/* « Jouer » : l'accueil, c'est-à-dire le village (ou le menu, selon le réglage « Au démarrage »). */}
          <button type="button" className={`button title-button${resume ? '' : ' primary'}`} onClick={() => start()} autoFocus={!resume}>
            <Icon name={resume ? 'map' : 'play'} /> Jouer
          </button>
        </div>
      </div>
    </div>
  );
}
