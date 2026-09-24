import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Feedback } from '../components/Feedback';
import { Icon } from '../components/Icon';
import { RichText } from '../components/math/RichText';
import { useProgress } from '../core/ProgressContext';
import { BLOCKS, type BiomeDef } from './biomes';
import { useBlocland } from './BloclandContext';
import type { Completion } from './engine';
import { levelFor } from './engine';
import { SCREEN_TYPES, type ScreenAnswer } from './exercises/registry';
import { fillTemplate, type ExerciseDef, type ExerciseItem, type ItemResult } from './exercises/types';
import { Stars } from './Stars';
import { BlockIcon } from './Voxel';

interface Props {
  biome: BiomeDef;
  def: ExerciseDef;
  onReplay: () => void;
}

/** Découpe les items en écrans selon le type d'exercice. */
export function screensOf(def: ExerciseDef): ExerciseItem[][] {
  const batch = SCREEN_TYPES[def.type]?.batch ?? 1;
  if (batch === 'all') return [def.items];
  const out: ExerciseItem[][] = [];
  for (let i = 0; i < def.items.length; i += batch) out.push(def.items.slice(i, i + batch));
  return out;
}

/**
 * Lanceur d'exercice générique : la créature a donné la consigne (lue à voix haute),
 * les écrans défilent un par un, feedback immédiat jamais punitif, puis récompense.
 */
export function ExerciseRunner({ biome, def, onReplay }: Props) {
  const { state, complete, pauseAfterNext, continueSession } = useBlocland();
  const { answer, completeSession } = useProgress();
  const [index, setIndex] = useState(0);
  const [answered, setAnswered] = useState<ScreenAnswer | null>(null);
  const [helpUsed, setHelpUsed] = useState(false);
  const [results, setResults] = useState<ItemResult[]>([]);
  const [done, setDone] = useState<Completion | null>(null);
  const [paused, setPaused] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  const type = SCREEN_TYPES[def.type];
  const screens = screensOf(def);
  const items = screens[index];

  // Chaque écran suivant (et l'écran de fin) s'affiche en haut ; pas de saut au premier.
  useEffect(() => {
    if (index > 0 || done) sectionRef.current?.scrollIntoView?.({ block: 'start' });
  }, [index, done]);

  if (!type) {
    return <p className="intro">Ce type d’exercice ({def.type}) n’est pas encore disponible.</p>;
  }
  const Screen = type.component;

  const onAnswer = (a: ScreenAnswer) => {
    if (answered) return;
    setAnswered(a);
    answer(
      a.results.every((r) => r.correct),
      helpUsed ? 2 : 1,
    );
  };

  const next = () => {
    if (!answered) return;
    const all = [...results, ...answered.results.map((r) => ({ key: r.key, correct: r.correct, attempts: 1, usedHelp: helpUsed }))];
    setResults(all);
    setAnswered(null);
    setHelpUsed(false);
    if (index + 1 < screens.length) {
      setIndex(index + 1);
      return;
    }
    const completion = complete(def, all);
    completeSession(`blocland:${def.id}`, Math.round(completion.score * 100));
    setDone(completion);
    setPaused(pauseAfterNext);
  };

  if (done) {
    const block = BLOCKS[done.block];
    return (
      <section className="quiz" ref={sectionRef} aria-labelledby="fin-titre">
        <div className="panel summary reward-panel">
          <h2 id="fin-titre">{done.perfect ? 'Sans faute !' : done.stars === 3 ? 'Superbe !' : done.stars === 2 ? 'Bien joué !' : 'Terminé !'}</h2>
          <Stars count={done.stars} size="2.4rem" />
          {done.newBest && done.state.progress[def.id].attempts > 1 && <p className="reward-best">Ton meilleur résultat !</p>}
          <ul className="reward-list">
            <li>
              <BlockIcon top={block.top} side={block.side} size={44} />
              <strong>+{done.blocks}</strong> bloc{done.blocks > 1 ? 's' : ''} de {block.name.toLowerCase()}
            </li>
            <li>
              <Icon name="zap" size="1.6rem" />
              <strong>+{done.xp}</strong> XP{done.perfect ? ' (bonus sans aide)' : ''}
            </li>
            {done.chestBlock && (
              <li className="reward-chest">
                <BlockIcon top={BLOCKS[done.chestBlock].top} side={BLOCKS[done.chestBlock].side} size={44} />
                Coffre de régularité : <strong>+6</strong> blocs de {BLOCKS[done.chestBlock].name.toLowerCase()} !
              </li>
            )}
          </ul>
          {done.streak.extended && (
            <p className="reward-streak">
              <Icon name="flame" /> {done.streak.streak.current} jour{done.streak.streak.current > 1 ? 's' : ''} d’affilée
              {done.streak.streak.cracked ? ' (un jour manqué : joue demain pour réparer)' : ''}
            </p>
          )}

          {paused ? (
            <div className="pause-panel">
              <p>
                <strong>Belle séance !</strong> Trois exercices, c’est déjà bien. Ton cerveau retient mieux avec des pauses.
              </p>
              <div className="actions">
                <Link to="/aventure" className="button primary">
                  <Icon name="check" /> J’arrête pour aujourd’hui
                </Link>
                <button
                  type="button"
                  className="button"
                  onClick={() => {
                    continueSession();
                    setPaused(false);
                  }}
                >
                  Encore un peu
                </button>
              </div>
            </div>
          ) : (
            <div className="actions">
              <Link to="/aventure/chantier" className="button primary">
                <Icon name="hammer" /> Construire
              </Link>
              <button type="button" className="button" onClick={onReplay}>
                <Icon name="replay" /> Rejouer
              </button>
              <Link to={`/aventure/${biome.id}`} className="button">
                <Icon name="back" /> {biome.name}
              </Link>
            </div>
          )}
        </div>
      </section>
    );
  }

  const allCorrect = answered ? answered.results.every((r) => r.correct) : false;
  // Variables du message : les champs de l'item fautif (ou du premier), puis les détails de l'écran.
  const firstWrong = answered ? items[Math.max(0, answered.results.findIndex((r) => !r.correct))] : items[0];
  const message = answered ? (allCorrect ? def.feedback.correct : fillTemplate(def.feedback.wrong, { target: def.target, ...firstWrong, ...answered.detail })) : null;

  return (
    <section className={`quiz${answered ? ' has-sheet' : ''}`} ref={sectionRef} aria-labelledby="consigne">
      <h2 id="consigne" className="visually-hidden">
        {def.instruction}
      </h2>
      <ol className="quiz-steps" aria-label={`Écran ${index + 1} sur ${screens.length}`}>
        {screens.map((s, i) => (
          <li key={s[0].key} className={i < index ? 'done' : i === index ? 'current' : ''} aria-hidden="true" />
        ))}
      </ol>

      <Screen
        key={items[0].key}
        items={items}
        answered={answered}
        onAnswer={onAnswer}
        onHelp={() => setHelpUsed(true)}
        level={levelFor(state, def.type)}
        target={def.target}
        exerciseId={def.id}
      />

      {answered && message && (
        <div className={`result-sheet result-${allCorrect ? 'bien' : 'rate'}`} role="region" aria-label="Résultat">
          <div className="result-sheet-inner">
            <div className="result-sheet-body">
              <Feedback shout={allCorrect ? 'BIEN VU !' : 'PAS TOUT À FAIT'} message="" tone={allCorrect ? 'bien' : 'rate'} compact speakKey={index} autoSpeak={false} />
              <p className="explanation">
                <Icon name="lightbulb" />{' '}
                <span>
                  <RichText text={message} />
                </span>
              </p>
            </div>
            <button type="button" className="button primary next-button" onClick={next} autoFocus>
              {index + 1 < screens.length ? (
                <>
                  Suivant <Icon name="play" />
                </>
              ) : (
                <>
                  Voir mes blocs <Icon name="blocks" />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
