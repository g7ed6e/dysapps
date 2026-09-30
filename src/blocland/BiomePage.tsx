import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { NotFoundPage } from '../pages/NotFoundPage';
import { BLOCKS, SANS_LV2, estIleLv2, getBiome, guardianTitle, missionsJouables, ofBlock } from './biomes';
import { useSettings } from '../core/SettingsContext';
import { SchoolLink } from './School';
import { AssemblageLink } from './Assemblage';
import { TROPHIES_TITLE } from './trophies';
import { Bridges } from './Bridges';
import { lockedHint, nextGoalInfo } from './world/goals';
import { GoalLine } from './GoalLine';
import { VillageStageLine } from './VillageStageLine';
import { archipelagoOf, archipelagoTitle, isBiomeUnlocked } from './world/archipelago';
import { useBlocland } from './BloclandContext';
import { levelFor } from './engine';
import { CreatureBubble } from './CreatureBubble';
import { InventoryLink } from './Inventory';
import { pickExercise, questProgress } from './exercises';
import { Stars } from './Stars';
import { STARS_TO_UNLOCK, isBossBeaten, isBossOpen, missingForBoss } from './boss';
import { BlockIcon } from './Voxel';
import { PlanSection } from './PlanSection';
import { ShipSection } from './ShipSection';
import { usePlanBuilder } from './usePlanBuilder';
import { useVehicleBuilder } from './useVehicleBuilder';
import { stageAt } from './world/vehicle';
import { WhaleWordPanel, useWhaleWord } from './WhaleWord';
import { useTextes } from '../univers';
import { useUnivers } from '../core/SettingsContext';
import { UNIVERS } from '../core/univers';

/** Un biome : sa créature donne la mission, puis la liste des exercices. */
export function BiomePage() {
  const { biomeId } = useParams();
  // « Voir le chantier » (bilan d'une mission) : la section à mettre en avant, comme dans le panneau d'île.
  const chantier = useSearchParams()[0].get('chantier');
  const navigate = useNavigate();
  const { state } = useBlocland();
  const { settings } = useSettings();
  const textes = useTextes();
  const univers = useUnivers();
  const biome = getBiome(biomeId);
  const builder = usePlanBuilder(biome?.id ?? 'foret');
  const whale = useWhaleWord(state, archipelagoOf(state.village.at ?? 'foret').classe);
  const ship = useVehicleBuilder(biome?.id ?? 'foret');
  if (!biome) return <NotFoundPage />;
  const block = BLOCKS[biome.block];
  const owned = state.inventory[biome.block] ?? 0;
  const unlocked = isBiomeUnlocked(biome.id, state.village.bridges);
  const port = archipelagoOf(biome.id).port === biome.id;
  const sansLv2 = estIleLv2(biome) && settings.lv2 === 'aucune';
  const goal = unlocked && !sansLv2 ? nextGoalInfo(state, biome.id) : null;

  return (
    <>
      <Link to="/aventure" className="back-link">
        <Icon name="back" /> {UNIVERS[univers].carte}
      </Link>
      <h1 className={`page-title biome-title biome-${biome.id}`}>
        <Icon name={biome.icon} /> {biome.name}
      </h1>
      <p className="biome-archipel">
        {archipelagoTitle(biome.classe)}
        {port && ' · Port'}
      </p>

      {/* Le mot de la baleine, aux grandes étapes de l'archipel où l'on se tient, en tête de la page. */}
      {whale.word && <WhaleWordPanel word={whale.word} onClose={whale.close} />}

      <CreatureBubble biome={biome} text={sansLv2 ? SANS_LV2 : unlocked ? textes.creatures[biome.id].greeting : lockedHint(state, biome.id)} />

      {goal && <GoalLine goal={goal} className="panel" />}
      {port && unlocked && <VillageStageLine village={state.village} archipelago={biome.classe} className="panel" />}

      {/* Un ouvrage construit ouvre l'île d'en face : on y va, sa créature accueille (comme en 3D). */}
      {sansLv2 ? (
        <p>
          <Link to="/reglages" className="button">
            <Icon name="settings" /> Choisir une LV2
          </Link>
        </p>
      ) : (
        <Bridges island={biome.id} highlight={chantier} onBuilt={(to) => window.setTimeout(() => navigate(`/aventure/${to}`), 900)} />
      )}

      {/* « Pas de LV2 » : ni missions ni Gardien sur l'île de la LV2. */}
      {!sansLv2 && (
        <>
      <h2 className="section-title">
        <Icon name="hammer" /> Missions
      </h2>
      <ul className="grid apps">
        {missionsJouables(biome, settings.lv2).map((exercise) => {
          const def = pickExercise(biome.id, exercise.id, levelFor(state, exercise.id), state.progress);
          const progress = def ? questProgress(biome.id, exercise.id, state.progress) : undefined;
          const content = (
            <>
              <span className="app-icon">
                <Icon name={def && unlocked ? 'play' : 'lock'} size="1.8rem" />
              </span>
              <span className="app-title">{exercise.title}</span>
              <span className="app-desc">{exercise.description}</span>
              {!def ? (
                <span className="tag">Bientôt</span>
              ) : !unlocked ? (
                <span className="tag">Verrouillé</span>
              ) : progress ? (
                <Stars
                  count={progress.stars}
                  label={`${progress.stars} étoile${progress.stars > 1 ? 's' : ''} sur 3, meilleur score ${Math.round(progress.best * 100)} %`}
                />
              ) : (
                <span className="tag tag-new">Nouveau</span>
              )}
            </>
          );
          return (
            <li key={exercise.id}>
              {def && unlocked ? (
                <Link to={`/aventure/${biome.id}/${exercise.id}`} className={`panel app-card biome-${biome.id}`}>
                  {content}
                </Link>
              ) : (
                <div className="panel app-card locked" aria-disabled="true">
                  {content}
                </div>
              )}
            </li>
          );
        })}
      </ul>
        </>
      )}

      {unlocked && archipelagoOf(biome.id).school === biome.id && (
        <>
          <h2 className="section-title">
            <Icon name="school" /> Les lieux du village
          </h2>
          <ul className="grid apps">
            <li>
              <SchoolLink variant="card" />
            </li>
            <li>
              <AssemblageLink variant="card" />
            </li>
            <li>
              {/* En vue simple, la salle des trophées est la page Succès. */}
              <Link to="/succes" className={`panel app-card biome-${biome.id}`}>
                <span className="app-icon">
                  <Icon name="trophy" size="1.8rem" />
                </span>
                <span className="app-title">{TROPHIES_TITLE}</span>
                <span className="app-desc">Ton rôle, tes succès, ce qui est à retravailler.</span>
              </Link>
            </li>
          </ul>
        </>
      )}

      {!sansLv2 && (
        <h2 className="section-title">
          <Icon name="shield" /> Le Gardien
        </h2>
      )}
      {!sansLv2 && (() => {
        const ready = unlocked && isBossOpen(biome, state.progress);
        const beaten = isBossBeaten(biome.id, state.progress);
        const boss = state.progress[`${biome.id}-gardien`];
        const content = (
          <>
            <span className="app-icon boss-icon">
              <Icon name={ready ? 'shield' : 'lock'} size="1.8rem" />
            </span>
            <span className="app-title">{guardianTitle(biome)}</span>
            <span className="app-desc">Une épreuve de chaque mission, à ton niveau. Sans chrono. Récompense : des blocs d’or.</span>
            {beaten && boss ? (
              <Stars count={boss.stars} label={textes.libelles.etoilesSur3(boss.stars)} />
            ) : ready ? (
              <span className="tag tag-new">{textes.libelles.defiPretCourt}</span>
            ) : (
              <span className="tag">
                <Icon name="lock" /> {STARS_TO_UNLOCK} étoiles dans : {missingForBoss(biome, state.progress).join(', ') || 'chaque mission'}
              </span>
            )}
          </>
        );
        return ready ? (
          <Link to={`/aventure/${biome.id}/gardien`} className={`panel app-card boss-card biome-${biome.id}`}>
            {content}
          </Link>
        ) : (
          <div className="panel app-card boss-card locked" aria-disabled="true">
            {content}
          </div>
        );
      })()}

      {unlocked && (
        <>
          <h2 className="section-title">
            <Icon name="map" /> Le plan
          </h2>
          <div className="panel plan-panel">
            <PlanSection biome={biome} builder={builder} highlight={chantier === 'plan'} />
          </div>
        </>
      )}

      {unlocked && stageAt(biome.id) && (
        <>
          <h2 className="section-title">
            <Icon name="ship" /> Le Bloc-Navire
          </h2>
          <div className="panel plan-panel">
            <ShipSection biome={biome} builder={ship} highlight={chantier === 'navire'} onBoard={(to) => navigate(`/aventure/voyage/${to}`)} />
          </div>
        </>
      )}

      <p className="biome-reward">
        <BlockIcon top={block.top} side={block.side} size={32} />
        Chaque mission réussie ici rapporte des blocs {ofBlock(biome.block)}. Tu en as {owned}. <InventoryLink />
      </p>
    </>
  );
}
