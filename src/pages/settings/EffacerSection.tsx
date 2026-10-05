// Effacer sa progression, loin des autres boutons (sortie de SettingsPage.tsx, qualité du code, lot 8).
import { useState } from 'react';
import { useProgress } from '../../core/ProgressContext';

export function EffacerSection() {
  const { resetProgress } = useProgress();
  const [confirmReset, setConfirmReset] = useState(false);
  const [typed, setTyped] = useState('');
  // Loin des autres boutons, et il faut écrire un mot : un doigt qui glisse n'efface rien.
  return (
    <fieldset className="panel danger-zone">
      <legend>Effacer ma progression</legend>
      <p>XP, succès, étoiles, blocs et bâtiments seront perdus. Les réglages restent.</p>
      {confirmReset ? (
        <>
          <label className="confirm-word">
            Pour confirmer, écris <strong>effacer</strong> :
            <input type="text" autoComplete="off" autoCapitalize="none" spellCheck={false} value={typed} onChange={(e) => setTyped(e.target.value)} />
          </label>
          <div className="actions">
            <button
              type="button"
              className="button danger"
              disabled={typed.trim().toLowerCase() !== 'effacer'}
              onClick={() => {
                resetProgress();
                setConfirmReset(false);
                setTyped('');
              }}
            >
              Tout effacer
            </button>
            <button
              type="button"
              className="button"
              onClick={() => {
                setConfirmReset(false);
                setTyped('');
              }}
            >
              Annuler
            </button>
          </div>
        </>
      ) : (
        <button type="button" className="button danger" onClick={() => setConfirmReset(true)}>
          Effacer ma progression…
        </button>
      )}
    </fieldset>
  );
}
