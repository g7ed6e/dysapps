import { Icon } from '../components/Icon';
import { SpeakButton } from '../components/SpeakButton';
import { Syllabified } from '../components/Syllabified';
import { getBiome, type BiomeId } from './biomes';
import { useBlocland } from './BloclandContext';
import { canLaunch, planStatus } from './engine';
import { VoxelScene } from './Voxel';
import { ARCHIPELAGOS, archipelagoOf, archipelagoTitle, isArchipelagoReached, islandsOf, launchedCount, reachableIslands, remainingVoyages } from './world/archipelago';
import { VEHICLE_NAME, beatenGuardians, stageTo, vehicleModel } from './world/vehicle';

interface Props {
  onClose: () => void;
  /** Aller sur une île (le port d'un archipel atteint, ou le chantier du navire). */
  onGo: (island: BiomeId) => void;
}

/**
 * Les quatre archipels, en HTML : où l'on est, ce qui est ouvert, ce qu'il faut pour aller plus loin. Le navire tel
 * qu'il est aujourd'hui est dessiné sur l'archipel où l'on se trouve.
 */
export function ArchipelsSheet({ onClose, onGo }: Props) {
  const { state } = useBlocland();
  const bridges = state.village.bridges;
  const here = archipelagoOf(state.village.at ?? 'foret').classe;
  const open = reachableIslands(bridges);
  const level = launchedCount(bridges);
  return (
    <section id="panneau-monde" className="island-sheet archipels-sheet" role="dialog" aria-labelledby="monde-titre" aria-modal="false">
      <div className="island-sheet-head">
        <div className="island-sheet-titles">
          <h2 id="monde-titre" className="island-sheet-title">
            <Icon name="map" /> Les quatre archipels
          </h2>
          <p className="island-sheet-module">Un archipel par classe, reliés par {VEHICLE_NAME}.</p>
        </div>
        <button type="button" className="icon-button island-sheet-close" aria-label="Fermer le panneau" onClick={onClose}>
          <Icon name="close" />
        </button>
      </div>
      <ol className="archipels-list">
        {ARCHIPELAGOS.map((a) => {
          const reached = isArchipelagoReached(a.classe, bridges);
          const islands = islandsOf(a.classe);
          const opened = islands.filter((b) => open.has(b.id)).length;
          const guardians = beatenGuardians(a.classe, state.progress);
          // Ce qu'il faut pour y aller : le prochain voyage à faire, et l'état de son chantier.
          const left = reached ? [] : remainingVoyages(a.port, bridges);
          const next = left[0] ? stageTo(left[0].toClasse) : undefined;
          const status = next ? planStatus(state, next) : null;
          const launch = next ? canLaunch(state, next) : null;
          let need = '';
          if (next && status) {
            const shipyard = getBiome(next.biome)?.name ?? next.biome;
            if (left.length > 1) need = `Il faut d’abord ${VEHICLE_NAME} avec ${left.map((v) => stageTo(v.toClasse)?.short).join(', puis ')}. Commence au port, sur ${shipyard}.`;
            else if (launch?.ok) need = `${VEHICLE_NAME.charAt(0).toUpperCase()}${VEHICLE_NAME.slice(1)} est prêt sur ${shipyard} : embarque !`;
            else if (launch && !launch.ok && launch.reason === 'gardiens')
              need = `${VEHICLE_NAME.charAt(0).toUpperCase()}${VEHICLE_NAME.slice(1)} a tous ses blocs sur ${shipyard} : encore ${launch.missing} Gardien${launch.missing > 1 ? 's' : ''} à vaincre.`;
            else need = `${VEHICLE_NAME.charAt(0).toUpperCase()}${VEHICLE_NAME.slice(1)} se construit sur ${shipyard} : ${status.done} blocs posés sur ${status.total}.`;
          }
          const state3 = a.classe === here ? 'Tu es ici' : reached ? 'Ouvert' : 'Fermé';
          return (
            <li key={a.classe} className={`panel archipel-card${reached ? '' : ' locked'}${a.classe === here ? ' archipel-here' : ''}`}>
              <div className="archipel-card-head">
                <h3 className="island-sheet-heading">{archipelagoTitle(a.classe)}</h3>
                <span className={`tag${a.classe === here ? ' tag-new' : reached ? ' tag-ok' : ''}`}>{state3}</span>
              </div>
              <p className="archipel-card-line">
                {islands.length} îles · {opened} ouverte{opened > 1 ? 's' : ''} · {guardians} Gardien{guardians > 1 ? 's' : ''} vaincu{guardians > 1 ? 's' : ''} sur {islands.length}
              </p>
              {a.classe === here && <VoxelScene cubes={vehicleModel(level)} s={5} pad={4} className="archipel-ship" label={`${VEHICLE_NAME}, amarré ici`} />}
              {need && (
                <p className="archipel-card-need">
                  <Syllabified text={need} />
                  <SpeakButton text={need} label="Écouter" compact />
                </p>
              )}
              {reached ? (
                <button type="button" className="button" onClick={() => onGo(a.port)}>
                  <Icon name="ship" /> Aller au port : {getBiome(a.port)?.name}
                </button>
              ) : next ? (
                <button type="button" className="button" onClick={() => onGo(next.biome)}>
                  <Icon name="hammer" /> Voir le chantier
                </button>
              ) : null}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
