import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { unlockSounds } from '../blocland/sound';
import { lastPlace } from '../core/lastPlace';
import { useSettings, useUnivers } from '../core/SettingsContext';
import { unlockSpeech } from '../core/speech';
import { loadJSON, saveJSON } from '../core/storage';
import { MESSAGE_UNIVERS, MESSAGE_UNIVERS_KEY, UNIVERS, UNIVERS_OUVERT } from '../core/univers';
import { Icon } from './Icon';
import { SpeakButton } from './SpeakButton';
import { Syllabified } from './Syllabified';

const SESSION_KEY = 'dysapps:titre-vu';

function seenThisSession(): boolean {
  try {
    return sessionStorage.getItem(SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

/** Le message unique qui présente Archipéo reste-t-il à dire sur cet appareil ? */
function messageADire(): boolean {
  return UNIVERS_OUVERT && loadJSON<{ dit?: boolean }>(MESSAGE_UNIVERS_KEY, {}).dit === false;
}

const MESSAGE_LU = `${MESSAGE_UNIVERS.titre}. ${MESSAGE_UNIVERS.texte}`;

/**
 * L'écran titre, une fois par lancement : le nom de l'univers et sa phrase sous l'icône de l'application, « Jouer » (le
 * village, derrière, est déjà là), et « Continuer » vers la dernière mission. Il a
 * aussi une raison technique : les navigateurs gardent la voix et les sons muets tant que l'élève n'a pas touché
 * l'écran ; ce premier toucher les débloque pour toute la séance. Rien n'y défile tout seul et rien n'y est chronométré :
 * il attend l'élève.
 *
 * Sur un appareil resté dans Blocland au lot 6, ce premier toucher montre ensuite, une seule fois, le message qui
 * présente Archipéo, lu à voix haute (la voix vient d'être débloquée) : « Rester dans Blocland » va où l'élève allait,
 * « Voir le réglage » ouvre la section Univers des Réglages.
 */
export function TitleScreen() {
  const [open, setOpen] = useState(() => !seenThisSession());
  const navigate = useNavigate();
  const { settings, speak } = useSettings();
  const univers = UNIVERS[useUnivers()];
  // L'adresse d'ouverture (l'accueil mène ensuite au village : on la garde telle qu'elle était au lancement).
  const [launchedAt] = useState(useLocation().pathname);
  // Le message unique, une fois montré : la page où l'élève allait (`to` absent : l'accueil).
  const [message, setMessage] = useState<{ to?: string } | null>(null);
  if (!open) return null;
  // « Continuer » seulement quand l'appli s'ouvre sur l'accueil (un lien direct vers une page y mène déjà).
  const resume = launchedAt === '/' ? lastPlace() : null;

  const close = (to?: string, section?: string) => {
    try {
      sessionStorage.setItem(SESSION_KEY, '1');
    } catch {
      // Stockage indisponible : l'écran titre reviendra au prochain chargement, sans gêne.
    }
    setOpen(false);
    if (to) navigate(to, section ? { state: { section } } : undefined);
  };

  const start = (to?: string) => {
    unlockSpeech();
    unlockSounds();
    if (messageADire()) {
      setMessage({ to });
      if (settings.autoRead) speak(MESSAGE_LU);
      return;
    }
    close(to);
  };

  // Noté dit au toucher de l'un ou l'autre bouton : il ne revient plus, sur cet appareil.
  const answer = (to?: string, section?: string) => {
    saveJSON(MESSAGE_UNIVERS_KEY, { dit: true });
    close(to, section);
  };

  if (message) {
    return (
      <div className="title-screen" role="dialog" aria-modal="true" aria-labelledby="titre-message-univers">
        {/* Sans l'icône qui retombe : le message tient à l'écran, même en grands caractères. */}
        <div className="title-card">
          <h1 id="titre-message-univers" className="title-message-heading">
            <Syllabified text={MESSAGE_UNIVERS.titre} />
          </h1>
          <p className="title-message">
            <Syllabified text={MESSAGE_UNIVERS.texte} />
          </p>
          <SpeakButton text={MESSAGE_LU} />
          <div className="title-actions">
            <button type="button" className="button primary title-button" onClick={() => answer(message.to)} autoFocus>
              <Icon name="check" /> {MESSAGE_UNIVERS.rester}
            </button>
            <button type="button" className="button title-button" onClick={() => answer('/reglages', 'univers')}>
              <Icon name="settings" /> {MESSAGE_UNIVERS.voir}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="title-screen" role="dialog" aria-modal="true" aria-labelledby="titre-appli">
      <div className="title-card">
        <img className="title-logo" src={`${import.meta.env.BASE_URL}icon.svg`} alt="" width={160} height={160} />
        <h1 id="titre-appli" className="title-name">
          {univers.nom}
        </h1>
        <p className="title-tagline">
          <Syllabified text={univers.phrase} />
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
