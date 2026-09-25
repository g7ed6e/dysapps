import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { SpeakButton } from '../components/SpeakButton';
import { Syllabified } from '../components/Syllabified';
import { frenchTypography } from '../components/math/RichText';
import { useSettings } from '../core/SettingsContext';
import { BLOCKS, ofBlock, type BiomeDef } from './biomes';
import { Bridges } from './Bridges';
import { isBiomeUnlocked } from './world/archipelago';
import { useBlocland } from './BloclandContext';
import { STARS_TO_UNLOCK, isBossBeaten, isBossUnlocked, missingForBoss } from './boss';
import { currentPlan, levelFor, planStatus } from './engine';
import { pickExercise } from './exercises';
import { Creature } from './Creatures';
import { Stars } from './Stars';
import { BlockIcon } from './Voxel';

interface Props {
  biome: BiomeDef;
  onClose: () => void;
}

/**
 * Le panneau d'une île, qui glisse depuis le bas du monde : la créature, ses quêtes, le plan en cours,
 * le Gardien et le chantier. Tout est en HTML (police dys), on ne quitte pas le monde.
 */
export function IslandSheet({ biome, onClose }: Props) {
  const { state } = useBlocland();
  const { settings, speak } = useSettings();
  const unlocked = isBiomeUnlocked(biome.id, state.village.bridges);
  const greeting = unlocked ? biome.creature.greeting : `Pas si vite ! Construis d’abord un pont jusqu’à mon île, puis reviens me voir.`;
  const owned = state.inventory[biome.block] ?? 0;
  const plan = currentPlan(state, biome.id);
  const status = plan ? planStatus(state, plan.plan) : null;
  const bossReady = unlocked && isBossUnlocked(biome, state.progress);
  const bossBeaten = isBossBeaten(biome.id, state.progress);

  // La créature accueille à voix haute quand le panneau s'ouvre.
  useEffect(() => {
    if (settings.autoRead) speak(frenchTypography(greeting));
    // Une lecture par île.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [biome.id]);

  return (
    <section className={`island-sheet biome-${biome.id}`} role="dialog" aria-labelledby={`ile-${biome.id}`} aria-modal="false">
      <div className="island-sheet-head">
        <Creature biome={biome.id} className="creature-small" />
        <div className="island-sheet-titles">
          <h2 id={`ile-${biome.id}`} className="island-sheet-title">
            <Icon name={biome.icon} /> {biome.name}
          </h2>
          <p className="island-sheet-module">
            {biome.module} · Niveau {biome.classe}
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

      <Bridges island={biome.id} />

      <h3 className="island-sheet-heading">
        <Icon name="hammer" /> Quêtes
      </h3>
      <ul className="island-quests" aria-label="Quêtes de l’île">
        {biome.exercises.map((exercise) => {
          const def = pickExercise(biome.id, exercise.id, levelFor(state, exercise.id), state.progress);
          const progress = def ? state.progress[def.id] : undefined;
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
        <li>
          {bossReady ? (
            <Link to={`/aventure/${biome.id}/gardien`} className="island-quest island-boss">
              <span className="island-quest-icon boss-icon">
                <Icon name="shield" />
              </span>
              <span className="island-quest-text">
                <span className="island-quest-title">{biome.guardian}</span>
                <span className="island-quest-desc">{bossBeaten ? 'Déjà vaincu. Une revanche ?' : 'Le Gardien accepte ton défi !'}</span>
              </span>
              {bossBeaten && <Stars count={state.progress[`${biome.id}-gardien`]?.stars ?? 0} label="Gardien vaincu" />}
            </Link>
          ) : (
            <div className="island-quest locked" aria-disabled="true">
              <span className="island-quest-icon">
                <Icon name="lock" />
              </span>
              <span className="island-quest-text">
                <span className="island-quest-title">{biome.guardian}</span>
                <span className="island-quest-desc">
                  {STARS_TO_UNLOCK} étoiles dans : {missingForBoss(biome, state.progress).join(', ') || 'chaque quête'}
                </span>
              </span>
            </div>
          )}
        </li>
        <li>
          <Link to={`/aventure/chantier?ile=${biome.id}`} className="island-quest island-build">
            <span className="island-quest-icon">
              <Icon name="blocks" />
            </span>
            <span className="island-quest-text">
              <span className="island-quest-title">Construire ici</span>
              <span className="island-quest-desc">
                {plan && status
                  ? status.complete && plan.allDone
                    ? 'Tous les plans sont construits.'
                    : `${plan.plan.name} : ${status.done} / ${status.total} blocs`
                  : 'Zone libre'}
              </span>
            </span>
            <span className="island-owned">
              <BlockIcon top={BLOCKS[biome.block].top} side={BLOCKS[biome.block].side} size={26} /> {owned} {ofBlock(biome.block)}
            </span>
          </Link>
        </li>
      </ul>
    </section>
  );
}
