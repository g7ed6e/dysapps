import { useEffect, useEffectEvent, useState } from 'react';
import { useTitreOuvert } from '../components/TitleScreen';
import { Icon } from '../components/Icon';
import { SpeakButton } from '../components/SpeakButton';
import { Syllabified } from '../components/Syllabified';
import { frenchTypography } from '../components/math/RichText';
import { useHoldCelebrations } from '../components/Celebrations';
import { useSettings } from '../core/SettingsContext';
import { loadJSON, saveJSON } from '../core/storage';
import { RENOMMAGE_KEY, renommageADire } from '../core/univers';
import { useTextes } from '../univers';
import type { TextesRenommage } from '../univers/types';

// L'écran des nouveaux noms des archipels (GD-1, U4) : une fois par appareil, dans un univers qui en annonce (Blocland),
// à un élève qui jouait déjà avant (noté au lancement, voir `noterRenommage`). Jamais pendant un exercice : à l'entrée
// dans le monde ou la vue simple, avant le mot des grandes étapes, un seul panneau à la fois.

/**
 * Les nouveaux noms à dire maintenant (`ready` : aucun autre panneau n'attend l'élève), et de quoi les noter dits.
 * Ils attendent que l'écran titre soit fermé, puis `attenteMs` (le même instant que le mot des grandes étapes).
 */
export function useRenommage(ready = true, attenteMs = 0): { ouvert: boolean; fermer: () => void } {
  const textes = useTextes();
  const titre = useTitreOuvert();
  const [aDire, setADire] = useState(() => renommageADire(loadJSON<unknown>(RENOMMAGE_KEY, null)));
  const pret = ready && !titre && aDire && textes.renommage !== null;
  const [attendu, setAttendu] = useState(attenteMs === 0);
  useEffect(() => {
    if (!pret || attenteMs === 0) return;
    const timer = window.setTimeout(() => setAttendu(true), attenteMs);
    return () => {
      window.clearTimeout(timer);
      setAttendu(false);
    };
  }, [pret, attenteMs]);
  const ouvert = pret && attendu;
  const fermer = () => {
    saveJSON(RENOMMAGE_KEY, { dit: true });
    setADire(false);
  };
  return { ouvert, fermer };
}

/** Le texte lu à voix haute : le titre, la phrase d'intro, puis une phrase par archipel. */
export function texteDuRenommage(t: TextesRenommage): string {
  return [`${t.titre}.`, t.intro, ...t.lignes].join(' ');
}

interface Props {
  onClose: () => void;
  className?: string;
  /** Le panneau défile : il reste du texte sous ses boutons (DA-25). */
  aSuivre?: boolean;
}

/** Le panneau opaque des nouveaux noms : lu à l'ouverture, Écouter pour le relire, un seul bouton, Échap ferme. */
export function RenommagePanel({ onClose, className = '', aSuivre = false }: Props) {
  const { settings, speak, stop } = useSettings();
  const textes = useTextes().renommage;
  // Un bandeau de récompense attend que le panneau soit fermé (DA-9).
  useHoldCelebrations(true);
  const lu = textes ? frenchTypography(texteDuRenommage(textes)) : '';
  // Lu une fois, à l'ouverture.
  const lire = useEffectEvent(() => {
    if (lu && settings.autoRead) speak(lu);
  });
  useEffect(() => lire(), []);
  const fermer = () => {
    stop();
    onClose();
  };
  const toucheEchap = useEffectEvent((e: KeyboardEvent) => {
    if (e.key === 'Escape') fermer();
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => toucheEchap(e);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  if (!textes) return null;
  return (
    <section className={`panel whale-word renommage ${className}`} role="dialog" aria-labelledby="renommage-titre" aria-live="polite">
      <h2 id="renommage-titre" className="whale-word-title">
        <Icon name="map" /> {textes.titre}
      </h2>
      <p className="whale-word-text">
        <Syllabified text={frenchTypography(textes.intro)} />
      </p>
      <ul className="renommage-lignes">
        {textes.lignes.map((l) => (
          <li key={l}>
            <Syllabified text={frenchTypography(l)} />
          </li>
        ))}
      </ul>
      <div className={`whale-word-actions${aSuivre ? ' a-suivre' : ''}`}>
        {aSuivre && <Icon name="chevronDown" className="whale-word-suite" />}
        <SpeakButton text={lu} />
        <button type="button" className="button primary" onClick={fermer}>
          {textes.bouton}
        </button>
      </div>
    </section>
  );
}
