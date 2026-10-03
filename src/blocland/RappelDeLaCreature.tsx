import { Link } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { SpeakButton } from '../components/SpeakButton';
import { Syllabified } from '../components/Syllabified';
import { frenchTypography } from '../components/math/RichText';
import { useSettings } from '../core/SettingsContext';
import { rappelDeLaCreature, useTextes } from '../univers';
import { missionsJouables, type BiomeDef } from './biomes';
import { useBlocland } from './BloclandContext';
import { cheminDeRevision, revisionsDeLIle, usePlusTard } from './rappels';

/**
 * Ce que la créature propose à l'arrivée sur son île, quand une mission de l'île a des questions à revoir aujourd'hui
 * (GD-4, étape 1) : l'icône de la notion, une phrase courte, « Écouter », « Reprendre » et « Plus tard ». Rien sur une
 * date, un échec ni des blocs à gagner ; « Plus tard » ne coûte rien et la fait taire jusqu'à la visite suivante.
 */
export function useRappelDeLaCreature(biome: BiomeDef | undefined): { texte: string; chemin: string } | null {
  const { state } = useBlocland();
  const { settings } = useSettings();
  const textes = useTextes();
  const { remises } = usePlusTard();
  if (!biome || remises.has(biome.id)) return null;
  const dues = revisionsDeLIle(state.spaced, state.world.links, biome.id, settings.lv2);
  if (!dues.length) return null;
  const titre = missionsJouables(biome, settings.lv2).find((m) => m.id === dues[0].type)?.title ?? dues[0].label;
  return { texte: frenchTypography(rappelDeLaCreature(textes, titre)), chemin: cheminDeRevision(dues[0]) };
}

interface Props {
  biome: BiomeDef;
  rappel: { texte: string; chemin: string };
}

export function RappelDeLaCreature({ biome, rappel }: Props) {
  const { remettre } = usePlusTard();
  return (
    <div className="creature-rappel" role="group" aria-labelledby={`rappel-${biome.id}`}>
      <span className="creature-rappel-icone" aria-hidden="true">
        <Icon name={biome.icon} size="1.8rem" />
      </span>
      <p id={`rappel-${biome.id}`} className="creature-rappel-texte">
        <strong>{biome.creature.name} :</strong> <Syllabified text={rappel.texte} />
      </p>
      <div className="creature-rappel-actions">
        <SpeakButton text={rappel.texte} label="Écouter" compact />
        <Link to={rappel.chemin} className="button primary">
          <Icon name="history" /> Reprendre
        </Link>
        <button type="button" className="button" onClick={() => remettre(biome.id)}>
          Plus tard
        </button>
      </div>
    </div>
  );
}
