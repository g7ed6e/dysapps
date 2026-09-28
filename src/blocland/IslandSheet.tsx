import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { SpeakButton } from '../components/SpeakButton';
import { Syllabified } from '../components/Syllabified';
import { frenchTypography } from '../components/math/RichText';
import { useSettings } from '../core/SettingsContext';
import { guardianTitle, missionsJouables, type BiomeDef } from './biomes';
import { Bridges } from './Bridges';
import { isBiomeUnlocked } from './world/archipelago';
import { PlanSection } from './PlanSection';
import { ShipSection } from './ShipSection';
import type { PlanBuilder } from './usePlanBuilder';
import type { VehicleBuilder } from './useVehicleBuilder';
import { getArchipelago, type ArchipelagoId } from './world/archipelago';
import { useBlocland } from './BloclandContext';
import { STARS_TO_UNLOCK, isBossBeaten, isBossUnlocked, missingForBoss } from './boss';
import { levelFor } from './engine';
import { pickExercise, questProgress } from './exercises';
import { Creature } from './Creatures';
import { Stars } from './Stars';
import { lockedHint, nextGoalInfo } from './world/goals';
import { GoalLine } from './GoalLine';
import { VillageStageLine } from './VillageStageLine';
import { SchoolLink } from './School';
import { TROPHIES_PATH, TROPHIES_TITLE } from './trophies';
import { archipelagoOf } from './world/archipelago';
import { useTextes } from '../univers';

interface Props {
  biome: BiomeDef;
  builder: PlanBuilder;
  in3d?: boolean;
  onClose: () => void;
  /** Un ouvrage vient d'être construit depuis cette île : l'île d'en face s'ouvre. */
  onBuilt?: (to: BiomeDef['id']) => void;
  /** L'ouvrage touché dans le monde : sa proposition est mise en avant. */
  highlight?: string | null;
  /** Le chantier du Bloc-Navire (sur une île-port). */
  ship?: VehicleBuilder;
  /** Embarquer sur le Bloc-Navire vers un archipel. */
  onBoard?: (to: ArchipelagoId, back: boolean) => void;
}

/**
 * Le panneau d'une île, qui glisse depuis le bas du monde : la créature, ses missions, le Gardien, puis le plan en cours,
 * le Bloc-Navire (sur un port) et les ouvrages, repliés quand il n'y a rien à y faire. Tout est en HTML (police dys),
 * on ne quitte pas le monde.
 */
export function IslandSheet({ biome, builder, in3d = false, onClose, onBuilt, highlight = null, ship, onBoard }: Props) {
  const { state } = useBlocland();
  const { settings, speak } = useSettings();
  const textes = useTextes();
  const unlocked = isBiomeUnlocked(biome.id, state.village.bridges);
  const greeting = unlocked ? biome.creature.greeting : lockedHint(state, biome.id);
  const bossReady = unlocked && isBossUnlocked(biome, state.progress);
  const bossBeaten = isBossBeaten(biome.id, state.progress);
  const goal = unlocked ? nextGoalInfo(state, biome.id) : null;
  const [bossSaid, setBossSaid] = useState<string | null>(null);
  // En 3D, le plan, le navire et les ouvrages se replient quand il n'y a rien à y faire : le panneau reste court.
  // Le choix de l'élève (ouvrir, fermer) est oublié quand l'île change ou qu'un ouvrage est mis en avant.
  const fold = in3d ? `${biome.id}:${highlight ?? ''}` : undefined;
  // Le Gardien n'accepte pas encore : on le dit (et on le lit), au lieu d'un bouton qui ne répond pas.
  const explainBoss = () => {
    const missing = missingForBoss(biome, state.progress);
    const text = unlocked
      ? `Pas tout de suite ! ${biome.guardian} veut ${STARS_TO_UNLOCK} étoiles dans ${missing.length ? missing.join(', ') : 'chaque mission'}. Fais ces missions, puis reviens le défier.`
      : `Pas tout de suite ! Il faut d’abord un chemin jusqu’à cette île.`;
    setBossSaid(text);
    if (settings.autoRead) speak(frenchTypography(text));
  };

  // La créature accueille à voix haute quand le panneau s'ouvre.
  useEffect(() => {
    setBossSaid(null);
    if (settings.autoRead) speak(frenchTypography(greeting));
    // Une lecture par île.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [biome.id]);

  return (
    <section id={`panneau-${biome.id}`} className={`island-sheet biome-${biome.id}`} role="dialog" aria-labelledby={`ile-${biome.id}`} aria-modal="false">
      <div className="island-sheet-head">
        <Creature biome={biome.id} className="creature-small" />
        <div className="island-sheet-titles">
          <h2 id={`ile-${biome.id}`} className="island-sheet-title">
            <Icon name={biome.icon} /> {biome.name}
          </h2>
          <p className="island-sheet-module">
            {biome.module} · Niveau {biome.classe} · Les {getArchipelago(biome.classe).name}
          </p>
        </div>
        <button type="button" className="icon-button island-sheet-close" aria-label="Fermer le panneau" onClick={onClose}>
          <Icon name="close" />
        </button>
      </div>
      <p className="island-sheet-says" role="status" aria-live="polite">
        <strong>{biome.creature.name} :</strong> <Syllabified text={greeting} />
        <SpeakButton text={greeting} label="Réécouter" compact />
      </p>

      {goal && <GoalLine goal={goal} />}
      {/* Sur l'île-port : l'état du village de l'archipel, qui se voit aussi au port en cubes. */}
      {unlocked && archipelagoOf(biome.id).port === biome.id && <VillageStageLine village={state.village} archipelago={biome.classe} />}
      {!unlocked && <Bridges island={biome.id} onBuilt={onBuilt} highlight={highlight} />}

      <h3 className="island-sheet-heading">
        <Icon name="hammer" /> Missions
      </h3>
      <ul className="island-quests" aria-label="Missions de l’île">
        {missionsJouables(biome).map((exercise) => {
          const def = pickExercise(biome.id, exercise.id, levelFor(state, exercise.id), state.progress);
          const progress = def ? questProgress(biome.id, exercise.id, state.progress) : undefined;
          const playable = Boolean(def && unlocked);
          const inner = (
            <>
              <span className="island-quest-icon">
                <Icon name={playable ? 'play' : 'lock'} />
              </span>
              <span className="island-quest-text">
                <span className="island-quest-title">{exercise.title}</span>
                <span className="island-quest-desc">{exercise.description}</span>
              </span>
              {progress ? (
                <Stars count={progress.stars} label={`${progress.stars} étoile${progress.stars > 1 ? 's' : ''} sur 3`} />
              ) : (
                <span className="tag tag-new">{playable ? 'Nouveau' : 'Verrouillé'}</span>
              )}
            </>
          );
          return (
            <li key={exercise.id}>
              {playable ? (
                <Link to={`/aventure/${biome.id}/${exercise.id}`} className="island-quest">
                  {inner}
                </Link>
              ) : (
                <div className="island-quest locked" aria-disabled="true">
                  {inner}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <ul className="island-actions" aria-label="Sur cette île">
        {unlocked && archipelagoOf(biome.id).school === biome.id && (
          <>
            <li>
              <SchoolLink />
            </li>
            <li>
              <Link to={TROPHIES_PATH} className="island-quest">
                <span className="island-quest-icon">
                  <Icon name="trophy" />
                </span>
                <span className="island-quest-text">
                  <span className="island-quest-title">{TROPHIES_TITLE}</span>
                  <span className="island-quest-desc">Un trophée par succès gagné.</span>
                </span>
              </Link>
            </li>
          </>
        )}
        <li>
          {bossReady ? (
            <Link to={`/aventure/${biome.id}/gardien`} className="island-quest island-boss">
              <span className="island-quest-icon boss-icon">
                <Icon name="shield" />
              </span>
              <span className="island-quest-text">
                <span className="island-quest-title">{guardianTitle(biome)}</span>
                <span className="island-quest-desc">{bossBeaten ? textes.libelles.dejaFait : textes.libelles.defiPret}</span>
              </span>
              {bossBeaten && <Stars count={state.progress[`${biome.id}-gardien`]?.stars ?? 0} label={textes.libelles.etoiles} />}
            </Link>
          ) : (
            <button type="button" className="island-quest locked island-boss-locked" onClick={explainBoss} aria-describedby={`gardien-${biome.id}`}>
              <span className="island-quest-icon">
                <Icon name="lock" />
              </span>
              <span className="island-quest-text">
                <span className="island-quest-title">{guardianTitle(biome)}</span>
                <span className="island-quest-desc">
                  {STARS_TO_UNLOCK} étoiles dans : {missingForBoss(biome, state.progress).join(', ') || 'chaque mission'}
                </span>
              </span>
            </button>
          )}
        </li>
      </ul>
      <p id={`gardien-${biome.id}`} className="bridges-said" role="status" aria-live="polite">
        {bossSaid ? <Syllabified text={bossSaid} /> : ''}
      </p>

      {unlocked && <PlanSection biome={biome} builder={builder} in3d={in3d} fold={fold} highlight={highlight === 'plan'} />}

      {unlocked && ship && onBoard && <ShipSection biome={biome} builder={ship} in3d={in3d} onBoard={onBoard} highlight={highlight === 'navire'} fold={fold} />}

      {unlocked && <Bridges island={biome.id} onBuilt={onBuilt} highlight={highlight} fold={fold} />}
    </section>
  );
}
