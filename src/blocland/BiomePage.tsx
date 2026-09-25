import { Link, useParams } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { NotFoundPage } from '../pages/NotFoundPage';
import { BLOCKS, getBiome, isBiomeUnlocked, previousBiome } from './biomes';
import { useBlocland } from './BloclandContext';
import { levelFor } from './engine';
import { CreatureBubble } from './CreatureBubble';
import { pickExercise } from './exercises';
import { Stars } from './Stars';
import { BlockIcon } from './Voxel';

/** Un biome : sa créature donne la quête, puis la liste des exercices. */
export function BiomePage() {
  const { biomeId } = useParams();
  const { state } = useBlocland();
  const biome = getBiome(biomeId);
  if (!biome) return <NotFoundPage />;
  const block = BLOCKS[biome.block];
  const owned = state.inventory[biome.block] ?? 0;
  const unlocked = isBiomeUnlocked(biome.id, state.progress);
  const previous = previousBiome(biome.id);

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
        text={unlocked || !previous ? biome.creature.greeting : `Pas si vite ! Termine d’abord une quête dans ${previous.name}, puis reviens me voir.`}
      />

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

      <p className="biome-reward">
        <BlockIcon top={block.top} side={block.side} size={32} />
        Chaque quête réussie ici rapporte des blocs de {block.name.toLowerCase()}. Tu en as {owned}.
      </p>
    </>
  );
}
