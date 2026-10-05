import { useEffect, useMemo, useState } from 'react';
import { Icon } from '../components/Icon';
import { SpeakButton } from '../components/SpeakButton';
import { Syllabified } from '../components/Syllabified';
import { frenchTypography } from '../components/math/RichText';
import { useSettings } from '../core/SettingsContext';
import { pagesBaleine, quiParle, titreDuMot } from '../universes/whale';
import { useTextes } from '../universes';
import { loadJSON, saveJSON } from '../core/storage';
import type { GameState } from './engine';
import { hasSeenTutorial, markTutorialSeen } from './Tutorial';
import type { ArchipelagoId } from './world/archipelago';
import { MAP_RESHAPED, mapReshapedMoment, playedBeforeReshape, reachedWhaleMoments, type WhaleMoment } from './world/whale';
import { useHoldCelebrations } from '../components/Celebrations';
import { Creature } from './Creatures';

// Ce que la baleine a déjà dit, par appareil (comme les tutoriels), jamais dans la sauvegarde. L'arrivée dans un
// archipel garde la clé de l'ancienne bulle d'accueil, dans les tutoriels : qui l'a vue ne l'entend pas deux fois.
const STORAGE_KEY = 'guide-messages';

type Said = Record<string, boolean>;

/**
 * L'annonce du changement de forme de la carte (GD-9) : à la première lecture de cette version, notée à dire pour une
 * partie d'avant (`playedBeforeReshape`), déjà dite pour une partie neuve. Ensuite, la clé décide seule.
 */
export function initMapReshaped(state: Pick<GameState, 'world'>): void {
  const said = loadJSON<Said>(STORAGE_KEY, {});
  if (MAP_RESHAPED in said) return;
  said[MAP_RESHAPED] = !playedBeforeReshape(state);
  saveJSON(STORAGE_KEY, said);
}

function isSaid(m: WhaleMoment, said: Said): boolean {
  return m.id.startsWith('archipel-') ? hasSeenTutorial(m.id) : Boolean(said[m.id]);
}

function markSaid(moments: WhaleMoment[]): void {
  const said = loadJSON<Said>(STORAGE_KEY, {});
  for (const m of moments) {
    if (m.id.startsWith('archipel-')) markTutorialSeen(m.id);
    else said[m.id] = true;
  }
  saveJSON(STORAGE_KEY, said);
}

/**
 * Une seule fois par appareil : ce qui était déjà atteint avant la baleine est noté dit sans parler (sauf sa
 * présentation en 6e à un élève qui n'a encore rien joué). L'annonce du changement de forme de la carte aussi : un
 * appareil où la baleine n'a jamais parlé n'a pas connu la carte d'avant.
 */
function initWhaleMemory(state: Pick<GameState, 'progress' | 'world'>): void {
  if (loadJSON<Said | null>(STORAGE_KEY, null) !== null) return;
  const fresh = Object.keys(state.progress).length === 0;
  const all = (['6e', '5e', '4e', '3e'] as ArchipelagoId[]).flatMap((x) => reachedWhaleMoments(state, x));
  saveJSON(STORAGE_KEY, { [MAP_RESHAPED]: true });
  markSaid(all.filter((m) => !m.id.startsWith('archipel-') && !(fresh && m.id === 'baleine-6e-arrivee')));
}

/**
 * Le mot de la baleine à dire maintenant dans cet archipel, ou rien : la plus grande étape atteinte et pas encore dite.
 * Quand plusieurs tombent ensemble, une seule parle ; les autres sont notées dites à la fermeture, sans file d'attente.
 */
export function useWhaleWord(state: Pick<GameState, 'progress' | 'world'>, a: ArchipelagoId, ready = true) {
  const [tick, setTick] = useState(() => {
    initWhaleMemory(state);
    initMapReshaped(state);
    return 0;
  });
  // L'annonce du changement de forme de la carte passe d'abord, une fois, dans l'archipel où l'on revient.
  const moments = useMemo(() => [mapReshapedMoment(a), ...reachedWhaleMoments(state, a)], [state, a]);
  const said = useMemo(() => loadJSON<Said>(STORAGE_KEY, {}), [tick, moments]);
  const word = ready ? (moments.find((m) => !isSaid(m, said)) ?? null) : null;
  const close = () => {
    // L'annonce ne se dit que pour elle : les étapes atteintes en même temps parlent ensuite.
    markSaid(word?.kind === 'carte' ? [word] : moments.filter((m) => !isSaid(m, said)));
    setTick((t) => t + 1);
  };
  return { word, close };
}

/** La baleine, dessinée en code : un corps, une queue et un souffle, à la couleur du texte. */
function WhaleIcon() {
  return (
    <svg className="whale-icon" viewBox="0 0 48 32" aria-hidden="true" focusable="false">
      <path d="M4 18c0-7 8-11 18-11 9 0 15 4 17 9l5-5c1 3 0 7-3 9 2 2 3 5 2 7l-6-4c-3 4-9 6-15 6C11 29 4 25 4 18z" fill="currentColor" />
      <circle cx="13" cy="16" r="1.6" fill="var(--surface)" />
      <path d="M20 5c0-2 1-3 2-4M20 5c-1-2-3-2-4-2" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </svg>
  );
}

interface Props {
  word: WhaleMoment;
  onClose: () => void;
  className?: string;
  /** Le texte continue sous les boutons (la bulle défile, grand texte) : un trait pointillé et un chevron le disent. */
  aSuivre?: boolean;
}

/**
 * Le panneau du mot des grandes étapes : « Le mot de la baleine » dans Archipéo ; dans Blocland, la créature de
 * l'île-école de l'archipel, son nom écrit dans le titre et son portrait en cubes (une illustration, GD-1). Une ou deux
 * pages lues à voix haute, fermé par « J'ai compris », « Passer » (avant la dernière page) ou Échap.
 */
export function WhaleWordPanel({ word, onClose, className = '', aSuivre = false }: Props) {
  const { settings, speak, stop } = useSettings();
  const textes = useTextes();
  // Un bandeau de récompense attend que le mot soit fermé, dans le monde comme en vue simple (DA-9).
  useHoldCelebrations(true);
  const pages = pagesBaleine(word, textes);
  const ecole = quiParle(word, textes);
  const [page, setPage] = useState(0);
  const text = pages[page] ?? pages[0];
  // Dans Blocland, la voix dit d'abord qui parle (« Le mot de Bazar. »), à la première page : le nom est écrit et entendu.
  const lu = ecole && page === 0 ? `${titreDuMot(word, textes)}. ${text}` : text;
  const last = page >= pages.length - 1;
  useEffect(() => setPage(0), [word.id]);
  useEffect(() => {
    if (settings.autoRead) speak(frenchTypography(lu));
    // Relu à chaque page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [word.id, page]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Une touche déjà prise (le menu ouvert par-dessus l'a refermé) ne ferme pas le mot sans qu'on l'ait lu.
      if (e.key === 'Escape' && !e.defaultPrevented) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <section className={`panel whale-word ${className}`} role="dialog" aria-labelledby="mot-baleine" aria-live="polite">
      <h2 id="mot-baleine" className="whale-word-title">
        {ecole ? (
          <span className="whale-portrait" aria-hidden="true">
            <Creature biome={ecole.id} />
          </span>
        ) : (
          <WhaleIcon />
        )}{' '}
        {titreDuMot(word, textes)}
      </h2>
      <p className="whale-word-text">
        <Syllabified text={text} />
      </p>
      <div className={`whale-word-actions${aSuivre ? ' a-suivre' : ''}`}>
        {aSuivre && <Icon name="chevronDown" className="whale-word-suite" />}
        <SpeakButton text={lu} />
        {pages.length > 1 && (
          <span className="whale-word-dots" aria-label={`Page ${page + 1} sur ${pages.length}`}>
            {pages.map((_, i) => (
              <span key={i} className={i === page ? 'on' : undefined} />
            ))}
          </span>
        )}
        {last ? (
          <button type="button" className="button primary" onClick={onClose}>
            J’ai compris
          </button>
        ) : (
          <button type="button" className="button primary" onClick={() => setPage((p) => p + 1)}>
            Suivant
          </button>
        )}
        {!last && (
          <button
            type="button"
            className="button"
            onClick={() => {
              stop();
              onClose();
            }}
          >
            Passer
          </button>
        )}
      </div>
    </section>
  );
}
