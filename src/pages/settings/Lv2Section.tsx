// La section de la deuxième langue des réglages (sortie de SettingsPage.tsx, qualité du code, lot 8).
import { LV2_LABELS, type Lv2Choice } from '../../core/settings';
import { useSettings } from '../../core/SettingsContext';
import { isSpeechAvailable } from '../../core/speech';
import { useVoixDisponible } from '../../core/useVoice';
import { Icon } from '../../components/Icon';
import { SpeakButton } from '../../components/SpeakButton';
import { Syllabified } from '../../components/Syllabified';
import { OptionRow } from './controls';

const LV2_TEXTE = 'À partir de la 5e. Tu peux en changer quand tu veux : ce que tu as construit reste, et chaque langue garde ses étoiles.';
const sansVoixLv2 = (voix: string) =>
  `Cet appareil n’a pas de voix ${voix} : les mots seraient lus avec un accent français. Ajoute une voix ${voix} dans les réglages de l’appareil, rubrique Langue ou Synthèse vocale.`;
/** Une phrase de 5e dans chaque LV2, pour tester sa voix. */
const SAMPLE_LV2: Record<Exclude<Lv2Choice, 'none'>, { text: string; voix: string }> = {
  es: { text: '¡Hola! Me llamo Robin. Tengo tres bloques azules.', voix: 'espagnole' },
  de: { text: 'Hallo! Ich heiße Robin. Ich habe drei blaue Blöcke.', voix: 'allemande' },
};

export function Lv2Section() {
  const { settings, update, speak } = useSettings();
  const lv2 = settings.lv2 === 'none' ? null : settings.lv2;
  const voixLv2 = useVoixDisponible(lv2);
  return (
    <fieldset className="panel">
      <legend>Deuxième langue (LV2)</legend>
      <OptionRow name="lv2" labels={LV2_LABELS} value={settings.lv2} onChange={(lv2) => update({ lv2 })} />
      <p>
        <Syllabified text={LV2_TEXTE} />
      </p>
      <SpeakButton text={LV2_TEXTE} compact />
      {lv2 && isSpeechAvailable() && (
        <>
          <button type="button" className="button" onClick={() => speak(SAMPLE_LV2[lv2].text, undefined, lv2)}>
            <Icon name="speaker" /> Tester la voix {SAMPLE_LV2[lv2].voix}
          </button>
          {voixLv2 === false && (
            <>
              <p className="settings-note">
                <Syllabified text={sansVoixLv2(SAMPLE_LV2[lv2].voix)} />
              </p>
              <SpeakButton text={sansVoixLv2(SAMPLE_LV2[lv2].voix)} compact />
            </>
          )}
        </>
      )}
    </fieldset>
  );
}
