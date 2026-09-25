import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { Syllabified } from '../components/Syllabified';
import { useProgress } from '../core/ProgressContext';
import { NotFoundPage } from '../pages/NotFoundPage';
import { getBiome, isBiomeUnlocked } from './biomes';
import { useBlocland } from './BloclandContext';
import { STARS_TO_BEAT, bossDef, isBossBeaten, isBossUnlocked, missingForBoss } from './boss';
import { CreatureBubble } from './CreatureBubble';
import { ExerciseRunner } from './ExerciseRunner';

/** Le Gardien d'un biome : le défi de fin de biome, une manche de chaque quête. */
export function BossPage() {
  const { biomeId } = useParams();
  const { state } = useBlocland();
  const { beatBoss } = useProgress();
  const [run, setRun] = useState(0);
  const biome = getBiome(biomeId);
  const unlocked = Boolean(biome && isBiomeUnlocked(biome.id, state.progress) && isBossUnlocked(biome, state.progress));
  const alreadyBeaten = biome ? isBossBeaten(biome.id, state.progress) : false;
  // Le défi est tiré au lancement (et à chaque « Rejouer »), pas à chaque changement de progression.
  const def = useMemo(
    () => (biome && unlocked ? bossDef(biome, state) : undefined),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [biome?.id, unlocked, run],
  );
  if (!biome) return <NotFoundPage />;

  return (
    <>
      <Link to={`/aventure/${biome.id}`} className="back-link">
        <Icon name="back" /> {biome.name}
      </Link>
      <h1 className={`page-title biome-title biome-${biome.id}`}>
        <Icon name="shield" /> {biome.guardian}
      </h1>
      {!unlocked || !def ? (
        <>
          <CreatureBubble
            biome={biome}
            text={`${biome.guardian} n’accepte que les bâtisseurs entraînés. Obtiens ${STARS_TO_BEAT} étoiles dans chaque quête, puis reviens.`}
          />
          <p className="intro">
            <Syllabified text={`Il te manque encore des étoiles dans : ${missingForBoss(biome, state.progress).join(', ')}.`} />
          </p>
          <Link to={`/aventure/${biome.id}`} className="button primary">
            <Icon name="back" /> Voir les quêtes
          </Link>
        </>
      ) : (
        <>
          <CreatureBubble
            biome={biome}
            text={alreadyBeaten ? `${biome.guardian} est déjà vaincu, mais il aime les revanches. ${biome.creature.name} te regarde faire.` : biome.challenge}
          />
          <ExerciseRunner
            key={`${def.id}-${run}`}
            biome={biome}
            def={def}
            onReplay={() => setRun((r) => r + 1)}
            onComplete={(c) => {
              if (c.stars >= STARS_TO_BEAT && !alreadyBeaten) beatBoss();
            }}
          />
        </>
      )}
    </>
  );
}
