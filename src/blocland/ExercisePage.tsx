import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { NotFoundPage } from '../pages/NotFoundPage';
import { getBiome } from './biomes';
import { useBlocland } from './BloclandContext';
import { levelFor } from './engine';
import { ExerciseRunner } from './ExerciseRunner';
import { pickExercise } from './exercises';

/** Lance l'exercice d'un type dans un biome, au niveau adapté à l'élève. */
export function ExercisePage() {
  const { biomeId, typeId } = useParams();
  const { state } = useBlocland();
  const [run, setRun] = useState(0);
  const biome = getBiome(biomeId);
  const type = biome?.exercises.find((e) => e.id === typeId);
  const def = biome && typeId ? pickExercise(biome.id, typeId, levelFor(state, typeId)) : undefined;
  if (!biome || !type || !def) return <NotFoundPage />;

  return (
    <>
      <Link to={`/aventure/${biome.id}`} className="back-link">
        <Icon name="back" /> {biome.name}
      </Link>
      <h1 className={`page-title biome-title biome-${biome.id}`}>
        <Icon name={biome.icon} /> {type.title}
      </h1>
      <ExerciseRunner key={`${def.id}-${run}`} biome={biome} def={def} onReplay={() => setRun((r) => r + 1)} />
    </>
  );
}
