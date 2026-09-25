import { Link, useParams } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { NotFoundPage } from '../pages/NotFoundPage';
import { BLOCKS, getBiome, ofBlock } from './biomes';
import { Bridges } from './Bridges';
import { isBiomeUnlocked } from './world/archipelago';
import { useBlocland } from './BloclandContext';
import { levelFor } from './engine';
import { CreatureBubble } from './CreatureBubble';
import { pickExercise } from './exercises';
import { Stars } from './Stars';
import { STARS_TO_UNLOCK, isBossBeaten, isBossUnlocked, missingForBoss } from './boss';
import { BlockIcon } from './Voxel';
import { PlanSection } from './PlanSection';
import { usePlanBuilder } from './usePlanBuilder';

/** Un biome : sa créature donne la quête, puis la liste des exercices. */
export function BiomePage() {
  const { biomeId } = useParams();
  const { state } = useBlocland();
  const biome = getBiome(biomeId);
  const builder = usePlanBuilder(biome?.id ?? 'foret');
  if (!biome) return <NotFoundPage />;
  const block = BLOCKS[biome.block];
  const owned = state.inventory[biome.block] ?? 0;
  const unlocked = isBiomeUnlocked(biome.id, state.village.bridges);

  return (
    <>
      <Link to="/aventure" className="back-link">
        <Icon name="back" /> Carte de Blocland
      </Link>
      <h1 className={`page-title biome-title biome-${biome.id}`}>
        <Icon name={biome.icon} /> {biome.name}
      </h1>

      <CreatureBubble
        biome={biome}
        text={unlocked ? biome.creature.greeting : `Pas si vite ! Construis d’abord un pont jusqu’à mon île, puis reviens me voir.`}
      />

      <Bridges island={biome.id} />

      <h2 className="section-title">
        <Icon name="hammer" /> Quêtes
      </h2>
      <ul className="grid apps">
        {biome.exercises.map((exercise) => {
          const def = pickExercise(biome.id, exercise.id, levelFor(state, exercise.id), state.progress);
          const progress = def ? state.progress[def.id] : undefined;
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

      <h2 className="section-title">
        <Icon name="shield" /> Le Gardien
      </h2>
      {(() => {
        const ready = unlocked && isBossUnlocked(biome, state.progress);
        const beaten = isBossBeaten(biome.id, state.progress);
        const boss = state.progress[`${biome.id}-gardien`];
        const content = (
          <>
            <span className="app-icon boss-icon">
              <Icon name={ready ? 'shield' : 'lock'} size="1.8rem" />
            </span>
            <span className="app-title">{biome.guardian}</span>
            <span className="app-desc">Une épreuve de chaque quête, à ton niveau. Sans chrono. Récompense : des blocs d’or.</span>
            {beaten && boss ? (
              <Stars count={boss.stars} label={`Gardien vaincu : ${boss.stars} étoiles sur 3`} />
            ) : ready ? (
              <span className="tag tag-new">Prêt à t’affronter</span>
            ) : (
              <span className="tag">
                <Icon name="lock" /> {STARS_TO_UNLOCK} étoiles dans : {missingForBoss(biome, state.progress).join(', ') || 'chaque quête'}
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
            <PlanSection biome={biome} builder={builder} />
          </div>
        </>
      )}

      <p className="biome-reward">
        <BlockIcon top={block.top} side={block.side} size={32} />
        Chaque quête réussie ici rapporte des blocs {ofBlock(biome.block)}. Tu en as {owned}.
      </p>
    </>
  );
}
