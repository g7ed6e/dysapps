import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useSettings } from '../core/SettingsContext';
import { MIN_FONT_SIZE } from '../core/settings';
import { Icon } from './Icon';

/**
 * Le mode concentration : pendant une partie (quête du portail, quête ou défi de Blocland), la barre du haut et les
 * onglets disparaissent ; il ne reste qu'un bouton Pause. Le menu pause propose de reprendre, trois réglages rapides
 * (taille du texte, syllabes en couleurs, lecture automatique) et de quitter la partie. Le bouton retour du téléphone
 * (ou du navigateur) ouvre le menu pause au lieu de quitter sans prévenir.
 */
interface Session {
  /** Où mène « Quitter la partie ». */
  onQuit: () => void;
  /** Ce qui est gardé en quittant, dit dans le menu. */
  quitNote: string;
}

interface FocusValue {
  session: Session | null;
  setSession: (s: Session | null) => void;
}

const FocusContext = createContext<FocusValue | null>(null);

/** Vrai quand une partie est en cours (Layout masque alors la barre du haut et les onglets). */
export function useFocusActive(): boolean {
  return Boolean(useContext(FocusContext)?.session);
}

/**
 * Une partie en cours : `active` tant qu'on joue (pas sur le bilan). Sans FocusProvider (tests d'un écran seul), ne
 * fait rien.
 */
export function useFocusMode(active: boolean, onQuit: () => void, quitNote: string) {
  const ctx = useContext(FocusContext);
  const quitRef = useRef(onQuit);
  quitRef.current = onQuit;
  const setSession = ctx?.setSession;
  useEffect(() => {
    if (!setSession || !active) return;
    setSession({ onQuit: () => quitRef.current(), quitNote });
    return () => setSession(null);
  }, [setSession, active, quitNote]);
}

const MARK = 'dysapps-pause';
const markedTop = () => (window.history.state as Record<string, unknown> | null)?.[MARK] === true;
// Nos propres retours en arrière (retirer l'entrée ajoutée) : le « popstate » qu'ils provoquent n'est pas un geste
// de l'élève et ne doit pas ouvrir la pause.
let ownBacks = 0;
let lastPopOwn = false;
function goBackQuietly() {
  ownBacks += 1;
  window.history.back();
}
// Écouté en premier (phase de capture) : dit aux autres écouteurs si ce retour est le nôtre.
if (typeof window !== 'undefined') {
  window.addEventListener(
    'popstate',
    () => {
      lastPopOwn = ownBacks > 0;
      if (lastPopOwn) ownBacks -= 1;
    },
    true,
  );
}

export function FocusProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [paused, setPaused] = useState(false);
  const active = Boolean(session);

  // Le bouton retour : une entrée d'historique de plus, à la même adresse ; revenir dessus ouvre la pause.
  useEffect(() => {
    if (!active) {
      setPaused(false);
      return;
    }
    const push = () => window.history.pushState({ ...(window.history.state ?? {}), [MARK]: true }, '', window.location.href);
    push();
    const onPop = () => {
      if (lastPopOwn) return;
      setPaused(true);
      push();
    };
    window.addEventListener('popstate', onPop);
    return () => {
      window.removeEventListener('popstate', onPop);
      // La partie finie (bilan) : on retire l'entrée ajoutée, sans changer d'adresse.
      if (markedTop()) goBackQuietly();
    };
  }, [active]);

  return (
    <FocusContext.Provider value={{ session, setSession }}>
      {children}
      {session && !paused && (
        <button type="button" className="button focus-pause" onClick={() => setPaused(true)} aria-label="Pause">
          <Icon name="pause" size="1.5rem" />
        </button>
      )}
      {session && paused && (
        <PauseMenu
          note={session.quitNote}
          onResume={() => setPaused(false)}
          onQuit={() => {
            const quit = session.onQuit;
            setPaused(false);
            // On retire d'abord l'entrée ajoutée pour le bouton retour, puis on quitte.
            // En fermant la partie, l'effet retire l'entrée ajoutée (retour silencieux) ; on quitte une fois revenu.
            if (markedTop()) {
              const once = () => {
                window.removeEventListener('popstate', once);
                quit();
              };
              window.addEventListener('popstate', once);
              setSession(null);
            } else {
              setSession(null);
              quit();
            }
          }}
        />
      )}
    </FocusContext.Provider>
  );
}

function PauseMenu({ note, onResume, onQuit }: { note: string; onResume: () => void; onQuit: () => void }) {
  const { settings, update } = useSettings();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onResume();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onResume]);
  return (
    <div className="pause-screen" role="dialog" aria-modal="true" aria-labelledby="pause-titre">
      <div className="panel pause-card">
        <h2 id="pause-titre">Pause</h2>
        <button type="button" className="button primary pause-resume" onClick={onResume} autoFocus>
          <Icon name="play" /> Reprendre
        </button>

        <fieldset className="pause-settings">
          <legend>Réglages rapides</legend>
          <div className="pause-size" role="group" aria-label="Taille du texte">
            <span>Taille du texte</span>
            <button
              type="button"
              className="button"
              aria-label="Texte plus petit"
              disabled={settings.fontSize <= MIN_FONT_SIZE}
              onClick={() => update({ fontSize: Math.max(MIN_FONT_SIZE, settings.fontSize - 2) })}
            >
              A−
            </button>
            <button type="button" className="button" aria-label="Texte plus grand" disabled={settings.fontSize >= 32} onClick={() => update({ fontSize: Math.min(32, settings.fontSize + 2) })}>
              A+
            </button>
          </div>
          <label className="toggle">
            <input type="checkbox" checked={settings.syllables} onChange={(e) => update({ syllables: e.target.checked })} />
            Syllabes en couleurs
          </label>
          <label className="toggle">
            <input type="checkbox" checked={settings.autoRead} onChange={(e) => update({ autoRead: e.target.checked })} />
            Lire les consignes à voix haute
          </label>
        </fieldset>

        <button type="button" className="button pause-quit" onClick={onQuit}>
          <Icon name="back" /> Quitter la partie
        </button>
        <p className="pause-note">{note}</p>
      </div>
    </div>
  );
}
