import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { NotFoundPage } from '../pages/NotFoundPage';
import { getBiome } from './biomes';
import { useBlocland } from './BloclandContext';
import { levelFor } from './engine';
import { ExerciseRunner } from './ExerciseRunner';
import { loadExercise, pickExercise } from './exercises';
import { useLoaded } from '../core/useLoaded';
import { exercisesToReview } from './review';
import { useRememberPlace } from '../core/lastPlace';
import { Loading } from '../components/Loading';

/** Lance l'exercice d'un type dans un biome, au niveau adapté à l'élève. */
export function ExercisePage() {
  const { biomeId, typeId } = useParams();
  const { state } = useBlocland();
  const [run, setRun] = useState(0);
  const biome = getBiome(biomeId);
  const type = biome?.exercises.find((e) => e.id === typeId);
  // « Continuer » (écran titre, menus) ramène ici.
  useRememberPlace(biome && type ? { path: `/aventure/${biome.id}/${type.id}`, label: `${type.title} · ${biome.name}` } : null);
  // L'exercice est choisi au lancement (et à chaque « Rejouer »), pas à chaque changement de progression :
  // sinon la fin de partie relancerait un autre exercice au lieu d'afficher la récompense.
  const picked = useMemo(
    () => (biome && typeId ? pickExercise(biome.id, typeId, levelFor(state, typeId), state.progress, exercisesToReview(state.spaced)) : undefined),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [biome?.id, typeId, run],
  );
  // Le contenu de l'exercice est chargé à la demande (déjà en cache hors ligne : c'est immédiat).
  const loaded = useLoaded(async () => (picked ? ((await loadExercise(picked.id)) ?? null) : null), [picked]);
  if (!biome || !type || !picked || loaded === null) return <NotFoundPage />;

  return (
    <>
      <Link to={`/aventure/${biome.id}`} className="back-link">
        <Icon name="back" /> {biome.name}
      </Link>
      <h1 className={`page-title biome-title biome-${biome.id}`}>
        <Icon name={biome.icon} /> {type.title}
      </h1>
      {loaded ? (
        <ExerciseRunner key={`${loaded.id}-${run}`} biome={biome} def={loaded} onReplay={() => setRun((r) => r + 1)} />
      ) : (
        <Loading />
      )}
    </>
  );
}
