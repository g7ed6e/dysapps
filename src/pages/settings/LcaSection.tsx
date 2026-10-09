// La section de l'option latin ou grec des réglages (GD-13, décision du mainteneur du 8 octobre 2026) : Latin, Grec ou
// « Pas d'option », par défaut, indépendante de la LV2.
import { LCA_LABELS } from '../../core/settings';
import { useSettings } from '../../core/SettingsContext';
import { SpeakButton } from '../../components/SpeakButton';
import { Syllabified } from '../../components/Syllabified';
import { OptionRow } from './controls';

const LCA_TEXTE = 'De la 5e à la 3e, si tu suis l’option au collège. Elle ne change rien à ta LV2. Tu peux en changer quand tu veux : ce que tu as construit reste, et chaque option garde ses étoiles.';

export function LcaSection() {
  const { settings, update } = useSettings();
  return (
    <fieldset className="panel">
      <legend>Option latin ou grec</legend>
      <OptionRow name="lca" labels={LCA_LABELS} value={settings.lca} onChange={(lca) => update({ lca })} />
      <p>
        <Syllabified text={LCA_TEXTE} />
      </p>
      <SpeakButton text={LCA_TEXTE} compact />
    </fieldset>
  );
}
