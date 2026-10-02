import { useEffect } from 'react';
import { Icon } from '../components/Icon';
import { SpeakButton } from '../components/SpeakButton';
import { Syllabified } from '../components/Syllabified';
import { frenchTypography } from '../components/math/RichText';
import { useSettings } from '../core/SettingsContext';
import { useBlocland } from './BloclandContext';
import { VoxelScene } from './Voxel';
import { ARCHIPELAGOS, archipelagoOf, launchedCount, type ArchipelagoId, type NomsArchipels } from './world/archipelago';
import { VEHICLE_NAME, vehicleModel } from './world/vehicle';
import { useTextes } from '../univers';

interface Props {
  /** L'archipel de destination. */
  to: ArchipelagoId;
  /** Un retour (ou un nouveau départ) vers un archipel déjà atteint, pas un premier voyage. */
  back: boolean;
  onArrive: () => void;
}

/**
 * La phrase du voyage, lue à voix haute. Vers un archipel déjà atteint : « Retour vers… » si l'on revient en arrière
 * (depuis `from`), « Cap sur… » si l'on repart vers un archipel plus loin. `noms` : ceux de l'univers affiché.
 */
export function voyageSentence(to: ArchipelagoId, back: boolean, noms: NomsArchipels, from?: ArchipelagoId): string {
  const a = { name: noms[to] };
  const forward = from !== undefined && ARCHIPELAGOS.findIndex((x) => x.classe === to) > ARCHIPELAGOS.findIndex((x) => x.classe === from);
  if (back && forward) return `Tu embarques sur ${VEHICLE_NAME}. Cap sur les ${a.name}.`;
  if (back) return `Tu embarques sur ${VEHICLE_NAME}. Retour vers les ${a.name}.`;
  if (to === '5e') return `Tu embarques sur ${VEHICLE_NAME}. Cap sur les ${a.name} !`;
  if (to === '4e') return `Le ballon se gonfle. ${VEHICLE_NAME.charAt(0).toUpperCase()}${VEHICLE_NAME.slice(1)} s’envole vers les ${a.name} !`;
  return `Le réacteur s’allume. ${VEHICLE_NAME.charAt(0).toUpperCase()}${VEHICLE_NAME.slice(1)} monte vers les ${a.name} !`;
}

/**
 * L'écran du voyage, en HTML : le navire dessiné, la phrase du voyage (lue), et un seul bouton « Arriver ». C'est la
 * vue simple, et le repli de la 3D quand les animations sont réduites (ou tant que la cinématique n'existe pas).
 */
export function VoyagePanel({ to, back, onArrive }: Props) {
  const { settings, speak } = useSettings();
  const { state } = useBlocland();
  const textes = useTextes();
  const text = voyageSentence(to, back, textes.archipels, archipelagoOf(state.world.place ?? 'foret').classe);
  useEffect(() => {
    if (settings.autoRead) speak(frenchTypography(text));
    // Une lecture par voyage.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);
  const level = Math.max(launchedCount(state.world.links), ARCHIPELAGOS.findIndex((a) => a.classe === to));
  return (
    <section className="panel voyage-panel" role="dialog" aria-labelledby="voyage-title" aria-modal="false">
      <h2 id="voyage-title" className="voyage-title">
        <Icon name="ship" /> Le voyage
      </h2>
      <VoxelScene cubes={vehicleModel(level)} s={9} pad={6} className="voyage-ship" label="Le Bloc-Navire" />
      <p className="voyage-text" role="status" aria-live="polite">
        <Syllabified text={text} />
        <SpeakButton text={text} label="Réécouter" compact />
      </p>
      <button type="button" className="button primary voyage-arrive" onClick={onArrive} autoFocus>
        <Icon name="flag" /> Arriver
      </button>
    </section>
  );
}
