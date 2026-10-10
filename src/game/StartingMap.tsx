// « Carte de départ » (GD-9) : la région du bonhomme revient à sa carte de départ, après confirmation ; aucun ouvrage (le
// mot de l'univers pour une liaison) n'est perdu, ceux à reposer redeviennent posés. Elle était une ligne du Menu ; sans
// Menu, c'est un bouton de la barre sur la Carte, juste après « Modifier le plan » (mot du mainteneur, 10 octobre 2026,
// « 2ok »). La confirmation s'ouvre au-dessus de la barre, avec la même phrase qu'avant (6 octobre 2026, choix 2a).
import { useEffect, useMemo, useState } from 'react';
import { Icon, IconButton } from '../components/Icon';
import { SpeakButton } from '../components/SpeakButton';
import { useTextes } from '../universes';
import { useBlocland } from './BloclandContext';
import { WorldButton } from './WorldButton';
import { archipelagoOf } from './world/archipelago';
import { backToStartingMap, startingMapState } from './world/arrange';
import { linkPhrases } from './world/linkWord';

const STARTING_MAP = 'Carte de départ';

export function StartingMapButton() {
  const { state, arrange } = useBlocland();
  const [confirmer, setConfirmer] = useState(false);
  const [revenue, setRevenue] = useState(false);
  const region = archipelagoOf(state.world.place ?? 'french-6e-phonology').classe;
  // Ce que donnerait le retour, avant de le proposer : le bouton n'agit que s'il change vraiment la carte ; si des lieux
  // réunis l'empêchent (GD-9, ils ne se séparent plus), son toucher le dit.
  const retour = useMemo(() => startingMapState(state.world, region), [state.world, region]);
  const { liaisons } = useTextes();
  const mot = linkPhrases(liaisons);
  const phrase = `Tes ${mot.pluriel} restent.`;
  useEffect(() => {
    if (retour !== 'possible') setConfirmer(false);
  }, [retour]);
  const revenir = () => {
    const apres = backToStartingMap(state.world, region);
    if (apres) arrange(apres);
    setConfirmer(false);
    setRevenue(Boolean(apres));
  };
  const vide =
    retour === 'bloquee' ? 'des lieux réunis bloquent le retour' : retour === 'pareille' ? (revenue ? 'c’est fait' : 'les lieux sont à leur place de départ') : undefined;
  return (
    <>
      <WorldButton icon="defaire" name={STARTING_MAP} className="world-bar-depart" empty={vide} pressed={confirmer} controls={confirmer ? 'confirmer-depart' : undefined} onClick={() => setConfirmer(!confirmer)}>
        <Icon name="map" size={16} className="world-bar-depart-carte" />
      </WorldButton>
      {confirmer && retour === 'possible' && (
        <div id="confirmer-depart" className="world-confirm" role="group" aria-label="Revenir à la carte de départ ?">
          <p>
            <span className="signe" aria-hidden="true">
              <Icon name="ouvrage" />
              <Icon name="check" />
            </span>{' '}
            {phrase} <SpeakButton text={phrase} compact />
          </p>
          <div className="world-confirm-buttons">
            <button type="button" className="button primary" aria-label="Revenir à la carte de départ" onClick={revenir}>
              <Icon name="defaire" /> Revenir
            </button>
            <IconButton icone="close" nom="Non, garder ma carte" mot="Non" onClick={() => setConfirmer(false)} />
          </div>
        </div>
      )}
    </>
  );
}
