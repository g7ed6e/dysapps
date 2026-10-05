// La section Univers des réglages, avec sa confirmation (sortie de SettingsPage.tsx, qualité du code, lot 8).
import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useSettings } from '../../core/SettingsContext';
import { Icon } from '../../components/Icon';
import { frenchTypography } from '../../components/math/RichText';
import { SpeakButton } from '../../components/SpeakButton';
import { Syllabified } from '../../components/Syllabified';
import { CONFIRMATION_UNIVERS, UNIVERS, UNIVERS_IDS, type UniversChoice } from '../../core/univers';

export function UniversSection() {
  const { settings, update } = useSettings();
  // Le changement d'univers attend sa confirmation : ce qui change, ce qui reste.
  const [universDemande, setUniversDemande] = useState<UniversChoice | null>(null);
  const universRef = useRef<HTMLFieldSetElement>(null);
  const confirmRef = useRef<HTMLParagraphElement>(null);
  // La confirmation s'ouvre sous les choix : le focus y va, pour qu'elle ne s'ouvre jamais hors de l'écran.
  useEffect(() => {
    if (universDemande) confirmRef.current?.focus();
  }, [universDemande]);
  const state: unknown = useLocation().state;
  const section = typeof state === 'object' && state !== null && 'section' in state ? state.section : null;
  // Venu du message unique (« Voir le réglage ») : la section Univers, sous les yeux, et le focus sur le choix en cours.
  useEffect(() => {
    if (section !== 'univers') return;
    universRef.current?.scrollIntoView({ block: 'start' });
    universRef.current?.querySelector<HTMLInputElement>('input:checked')?.focus();
  }, [section]);
  // La confirmation fermée (changé ou annulé), le focus revient au choix en cours, jamais perdu.
  const fermerConfirmation = () => {
    setUniversDemande(null);
    requestAnimationFrame(() => universRef.current?.querySelector<HTMLInputElement>('input:checked')?.focus());
  };

  return (
    <fieldset className="panel" id="reglage-univers" ref={universRef}>
      <legend>Univers</legend>
      <p>
        <Syllabified text="L’univers change le dessin du monde et l’histoire. Ta progression reste la même." />
      </p>
      <div className="univers-choices">
        {UNIVERS_IDS.map((u) => (
          <div key={u} className={`option univers-choice${settings.univers === u ? ' selected' : ''}`}>
            <label>
              <input type="radio" name="univers" value={u} checked={settings.univers === u} onChange={() => setUniversDemande(u)} />
              <Icon name={UNIVERS[u].icone} size="1.6em" />
              <span className="univers-text">
                <strong>{UNIVERS[u].nom}</strong>
                <Syllabified text={frenchTypography(UNIVERS[u].presentation)} />
              </span>
            </label>
            <SpeakButton text={`${UNIVERS[u].nom}. ${UNIVERS[u].presentation}`} compact />
          </div>
        ))}
      </div>
      {universDemande && universDemande !== settings.univers && (
        <div className="univers-confirm" role="group" aria-labelledby="univers-confirm-titre">
          <p id="univers-confirm-titre" ref={confirmRef} tabIndex={-1}>
            <strong>
              <Syllabified text={frenchTypography(CONFIRMATION_UNIVERS.titre(universDemande))} />
            </strong>
          </p>
          <p>
            <Syllabified text={frenchTypography(CONFIRMATION_UNIVERS.texte)} />
          </p>
          <SpeakButton text={`${CONFIRMATION_UNIVERS.titre(universDemande)} ${CONFIRMATION_UNIVERS.texte}`} />
          <div className="actions">
            <button
              type="button"
              className="button primary"
              onClick={() => {
                update({ univers: universDemande });
                fermerConfirmation();
              }}
            >
              {CONFIRMATION_UNIVERS.changer}
            </button>
            <button type="button" className="button" onClick={fermerConfirmation}>
              {CONFIRMATION_UNIVERS.annuler}
            </button>
          </div>
        </div>
      )}
    </fieldset>
  );
}
