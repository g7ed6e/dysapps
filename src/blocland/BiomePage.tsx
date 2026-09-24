import { Link, useParams } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { NotFoundPage } from '../pages/NotFoundPage';
import { BLOCKS, getBiome } from './biomes';
import { CreatureBubble } from './CreatureBubble';
import { BlockIcon } from './Voxel';

/** Un biome : sa créature donne la quête, puis la liste des exercices. */
export function BiomePage() {
  const { biomeId } = useParams();
  const biome = getBiome(biomeId);
  if (!biome) return <NotFoundPage />;
  const block = BLOCKS[biome.block];

  return (
    <>
      <Link to="/aventure" className="back-link">
        <Icon name="back" /> Carte de Blocland
      </Link>
      <h1 className={`page-title biome-title biome-${biome.id}`}>
        <Icon name={biome.icon} /> {biome.name}
      </h1>

      <CreatureBubble biome={biome} text={biome.creature.greeting} />

      <h2 className="section-title">
        <Icon name="hammer" /> Quêtes
      </h2>
      <ul className="grid apps">
        {biome.exercises.map((exercise) => (
          <li key={exercise.id}>
            <div className="panel app-card locked" aria-disabled="true">
              <span className="app-icon">
                <Icon name="lock" size="1.8rem" />
              </span>
              <span className="app-title">{exercise.title}</span>
              <span className="app-desc">{exercise.description}</span>
              <span className="tag">Bientôt</span>
            </div>
          </li>
        ))}
      </ul>

      <p className="biome-reward">
        <BlockIcon top={block.top} side={block.side} size={32} />
        Chaque quête réussie ici rapporte des blocs de {block.name.toLowerCase()}.
      </p>
    </>
  );
}
