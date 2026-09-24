import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Feedback } from '../components/Feedback';
import { Icon } from '../components/Icon';
import { RichText } from '../components/math/RichText';
import { useProgress } from '../core/ProgressContext';
import { BLOCKS, type BiomeDef } from './biomes';
import { useBlocland } from './BloclandContext';
import { CreatureBubble } from './CreatureBubble';
import type { Completion } from './engine';
import { ITEM_COMPONENTS, type Answered } from './exercises/registry';
import { fillTemplate, type ExerciseDef, type ItemResult } from './exercises/types';
import { Stars } from './Stars';
import { BlockIcon } from './Voxel';

interface Props {
  biome: BiomeDef;
  def: ExerciseDef;
  onReplay: () => void;
}

/**
 * Lanceur d'exercice générique : la créature donne la consigne (lue à voix haute),
 * les items défilent un par un, feedback immédiat jamais punitif, puis récompense.
 */
export function ExerciseRunner({ biome, def, onReplay }: Props) {
  const { complete, pauseAfterNext, continueSession } = useBlocland();
  const { answer, completeSession } = useProgress();
  const [index, setIndex] = useState(0);
  const [answered, setAnswered] = useState<Answered | null>(null);
  const [helpUsed, setHelpUsed] = useState(false);
  const [results, setResults] = useState<ItemResult[]>([]);
  const [done, setDone] = useState<Completion | null>(null);
  const [paused, setPaused] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  const Item = ITEM_COMPONENTS[def.type];
  const item = def.items[index];

  // Chaque item suivant (et l'écran de fin) s'affiche en haut de l'écran ; pas de saut au premier item.
  useEffect(() => {
    if (index > 0 || done) sectionRef.current?.scrollIntoView?.({ block: 'start' });
  }, [index, done]);

  if (!Item) {
    return <p className="intro">Ce type d’exercice ({def.type}) n’est pas encore disponible.</p>;
  }

  const onAnswer = (correct: boolean, detail?: Omit<Answered, 'correct'>) => {
    if (answered) return;
    setAnswered({ correct, ...detail });
    answer(correct, helpUsed ? 2 : 1);
  };

  const next = () => {
    if (!answered) return;
    const result: ItemResult = { key: item.key, correct: answered.correct, attempts: 1, usedHelp: helpUsed };
    const all = [...results, result];
    setResults(all);
    setAnswered(null);
    setHelpUsed(false);
    if (index + 1 < def.items.length) {
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
              <button type="button" className="button primary" onClick={onReplay}>
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

  const message = answered
    ? answered.correct
      ? def.feedback.correct
      : fillTemplate(def.feedback.wrong, { word: answered.word ?? item.word, heard: answered.heard ?? item.heard, answer: answered.answer ?? item.answer })
    : null;

  return (
    <section className={`quiz${answered ? ' has-sheet' : ''}`} ref={sectionRef} aria-labelledby="consigne">
      <CreatureBubble biome={biome} text={def.instruction} />
      <ol className="quiz-steps" aria-label={`Item ${index + 1} sur ${def.items.length}`}>
        {def.items.map((it, i) => (
          <li key={it.key} className={i < index ? 'done' : i === index ? 'current' : ''} aria-hidden="true" />
        ))}
      </ol>
      <h2 id="consigne" className="visually-hidden">
        {def.instruction}
      </h2>

      <Item key={item.key} item={item} answered={answered} onAnswer={onAnswer} onHelp={() => setHelpUsed(true)} />

      {answered && message && (
        <div className={`result-sheet result-${answered.correct ? 'bien' : 'rate'}`} role="region" aria-label="Résultat">
          <div className="result-sheet-inner">
            <div className="result-sheet-body">
              <Feedback shout={answered.correct ? 'BIEN VU !' : 'PAS TOUT À FAIT'} message="" tone={answered.correct ? 'bien' : 'rate'} compact speakKey={index} autoSpeak={false} />
              <p className="explanation">
                <Icon name="lightbulb" />{' '}
                <span>
                  <RichText text={message} />
                </span>
              </p>
            </div>
            <button type="button" className="button primary next-button" onClick={next} autoFocus>
              {index + 1 < def.items.length ? (
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
