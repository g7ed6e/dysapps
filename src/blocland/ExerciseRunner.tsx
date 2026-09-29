import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Feedback } from '../components/Feedback';
import { Icon } from '../components/Icon';
import { frenchTypography, RichText } from '../components/math/RichText';
import { SpeakButton } from '../components/SpeakButton';
import { Syllabified } from '../components/Syllabified';
import { useSheetClearance } from '../components/useSheetClearance';
import { useAnswerKeys } from '../components/useAnswerKeys';
import { useFocusMode } from '../components/FocusMode';
import { useHoldCelebrations } from '../components/Celebrations';
import { useProgress } from '../core/ProgressContext';
import { useSettings } from '../core/SettingsContext';
import { useHaptics } from '../core/haptics';
import { BLOCKS, getBiome, ofBlock, type BiomeDef } from './biomes';
import { planStatus } from './engine';
import { archipelagoOf } from './world/archipelago';
import { stageAt } from './world/vehicle';
import { worksiteFor } from './world/worksite';
import { voyageId } from './world/archipelago';
import { useBlocland } from './BloclandContext';
import type { Completion } from './engine';
import { levelFor } from './engine';
import { reviewKeys } from './review';
import { SCREEN_TYPES, retryAllowed, type ScreenAnswer } from './exercises/registry';
import { autoReadText, dicteeAutoText } from './exercises/lecture';
import { runItems, runSeed } from './exercises/run';
import { fillTemplate, type ExerciseDef, type ExerciseItem, type ItemResult } from './exercises/types';
import { Stars } from './Stars';
import { BlockIcon } from './Voxel';

interface Props {
  biome: BiomeDef;
  def: ExerciseDef;
  onReplay: () => void;
  /** Appelé une fois l'exercice terminé (le Gardien s'en sert pour les succès). */
  onComplete?: (completion: Completion) => void;
  /** Appelé à chaque écran répondu (le Gardien réagit). */
  onRound?: (round: { index: number; total: number; correct: boolean }) => void;
  /** La barre des écrans ne dit que où l'on en est, jamais une réussite (le défi d'une sentinelle, lot 6). */
  etapesNeutres?: boolean;
}

/** Découpe les items en écrans selon le type d'exercice. */
export function screensOf(def: ExerciseDef, seed = def.id, review: string[] = []): ExerciseItem[][] {
  const batch = SCREEN_TYPES[def.type]?.batch ?? 1;
  const items = runItems(def, seed, review);
  if (batch === 'all') return [items];
  const out: ExerciseItem[][] = [];
  for (let i = 0; i < items.length; i += batch) out.push(items.slice(i, i + batch));
  return out;
}

/**
 * Lanceur d'exercice générique : la consigne reste écrite au-dessus de l'item (et lue à voix haute au début),
 * les écrans défilent un par un, feedback immédiat jamais punitif, puis récompense.
 */
export function ExerciseRunner({ biome, def, onReplay, onComplete, onRound, etapesNeutres = false }: Props) {
  const { state, complete, pauseAfterNext, continueSession } = useBlocland();
  const { answer, completeSession } = useProgress();
  const [index, setIndex] = useState(0);
  const [answered, setAnswered] = useState<ScreenAnswer | null>(null);
  // Premier essai raté d'un écran qui permet de réessayer : on le garde pour le score et pour barrer la réponse.
  const [firstTry, setFirstTry] = useState<ScreenAnswer | null>(null);
  const [helpUsed, setHelpUsed] = useState(false);
  const [results, setResults] = useState<ItemResult[]>([]);
  const [done, setDone] = useState<Completion | null>(null);
  const [paused, setPaused] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const { settings, speak } = useSettings();
  const haptics = useHaptics();

  const type = SCREEN_TYPES[def.type];
  // La graine est tirée au hasard au démarrage de la partie, puis fixée : les items ne changent pas en cours de partie.
  const [seed] = useState(() => runSeed(def));
  // Les items à revoir aujourd'hui (répétition espacée) passent en tête ; fixés au démarrage de la partie.
  const [review] = useState(() => reviewKeys(state.spaced, def.id));
  const screens = screensOf(def, seed, review);
  const items = screens[index];

  // Chaque écran suivant (et l'écran de fin) s'affiche en haut ; pas de saut au premier.
  useEffect(() => {
    if (index > 0 || done) sectionRef.current?.scrollIntoView?.({ block: 'start' });
  }, [index, done]);

  // La consigne est lue au début de la partie, sauf si l'écran lit déjà son mot (dictée) : les deux se couperaient.
  // Le Gardien a son propre texte d'accueil, et chaque manche affiche sa consigne.
  const ownConsigne = def.type !== 'boss';
  // Un document à lire (Notices) : sa question en français est dite avec la consigne au premier écran, puis seule à
  // chaque écran suivant ; le document anglais n'est lu qu'à la demande.
  const autoRead = ownConsigne && settings.autoRead && !type?.speaksOnOpen;
  // Une dictée à choix en langue vivante (LV2) : son mot est dit dans la voix de la langue, après la consigne au premier
  // écran, puis seul à chaque écran suivant.
  // La consigne finie, le mot suit, sauf si l'élève a quitté le premier écran ou lancé une autre lecture entre-temps (une
  // lecture coupée finit aussi, en erreur).
  const premierEcran = useRef(true);
  useEffect(() => {
    premierEcran.current = index === 0 && !done;
  }, [index, done]);
  useEffect(() => () => void (premierEcran.current = false), []);
  useEffect(() => {
    if (!autoRead) return;
    const dictee = dicteeAutoText(screens[0], def.lang);
    const ensuite = () => {
      const synthese = window.speechSynthesis;
      if (premierEcran.current && !synthese.speaking && !synthese.pending) speak(dictee, undefined, def.lang);
    };
    speak(autoReadText(def.instruction, screens[0]), dictee ? ensuite : undefined);
    // Une lecture par partie.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [def.id]);
  useEffect(() => {
    if (!autoRead || index === 0) return;
    // Seule une question ou un mot de dictée se lit à chaque écran : un texte vide couperait une lecture en cours.
    const dictee = dicteeAutoText(items, def.lang);
    if (dictee) return speak(dictee, undefined, def.lang);
    const text = autoReadText(null, items);
    if (text) speak(text);
    // Une lecture par écran.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  // Le bandeau de résultat ne cache pas la réponse.
  useSheetClearance(sectionRef, Boolean(answered) && !done);
  // Les succès gagnés en route s'affichent sur l'écran de récompense, pas sur la question.
  useHoldCelebrations(!done);
  // Touches 1 à 9 pour répondre ou cocher une carte, Entrée pour valider un tri puis passer à la suite.
  useAnswerKeys(sectionRef);
  // Mode concentration pendant la partie ; « Quitter » ramène au panneau de l'île.
  const navigate = useNavigate();
  useFocusMode(!done, () => navigate(`/aventure/${biome.id}`), 'L’XP des réponses déjà données est gardée ; les blocs se gagnent en finissant la partie.');

  if (!type) {
    return <p className="intro">Ce type d’exercice ({def.type}) n’est pas encore disponible.</p>;
  }
  const Screen = type.component;

  const onAnswer = (a: ScreenAnswer) => {
    if (answered) return;
    const correct = a.results.every((r) => r.correct);
    // Une erreur au premier essai : un indice, et on réessaie (comme dans les missions du portail).
    if (!correct && !firstTry && retryAllowed(def.type, items)) {
      setFirstTry(a);
      return;
    }
    setAnswered(a);
    if (correct) haptics.success();
    onRound?.({ index, total: screens.length, correct });
    answer(correct, helpUsed || firstTry ? 2 : 1);
  };

  const next = () => {
    if (!answered) return;
    // Un item juste dès le premier essai garde son point entier, même si l'écran a été refait.
    const firstOk = new Set(firstTry?.results.filter((r) => r.correct).map((r) => r.key));
    const all = [
      ...results,
      ...answered.results.map((r) => ({ key: r.key, correct: r.correct, attempts: firstTry && !firstOk.has(r.key) ? 2 : 1, usedHelp: helpUsed })),
    ];
    setResults(all);
    setAnswered(null);
    setFirstTry(null);
    setHelpUsed(false);
    if (index + 1 < screens.length) {
      setIndex(index + 1);
      return;
    }
    const completion = complete(def, all);
    completeSession(`blocland:${def.id}`, Math.round(completion.score * 100));
    setDone(completion);
    onComplete?.(completion);
    setPaused(pauseAfterNext);
  };

  if (done) {
    const block = BLOCKS[done.block];
    // Avec les blocs gagnés, l'étape du Bloc-Navire de cet archipel a tout ce qu'il lui faut : on le dit.
    const port = archipelagoOf(biome.id).port;
    const stage = stageAt(port);
    const shipReady =
      stage && !done.state.village.bridges.includes(voyageId(stage.to)) && (stage.stage === 1 || done.state.village.bridges.includes(voyageId(stage.from)))
        ? (() => {
            const status = planStatus(done.state, stage);
            const missing = Object.entries(status.missing).filter(([, n]) => (n ?? 0) > 0);
            return !status.complete && missing.every(([b, n]) => (done.state.inventory[b as keyof typeof BLOCKS] ?? 0) >= (n ?? 0)) ? stage : null;
          })()
        : null;
    // À quoi servent les blocs gagnés : le chantier qu'ils font avancer, et « Voir le chantier » qui y mène.
    const site = worksiteFor(done.state, biome.id, done.block);
    return (
      <section className="quiz" ref={sectionRef} aria-labelledby="fin-titre">
        <div className="panel summary reward-panel">
          <h2 id="fin-titre">{done.perfect ? 'Sans faute !' : done.stars === 3 ? 'Superbe !' : done.stars === 2 ? 'Bien joué !' : 'Terminé !'}</h2>
          <Stars count={done.stars} size="2.4rem" />
          {done.newBest && done.state.progress[def.id].attempts > 1 && <p className="reward-best">Ton meilleur résultat !</p>}
          <ul className="reward-list">
            <li>
              <BlockIcon top={block.top} side={block.side} size={44} />
              <strong>+{done.blocks}</strong> bloc{done.blocks > 1 ? 's' : ''} {ofBlock(done.block)}
              {(done.bonus.first > 0 || done.bonus.stars > 0) && (
                <span className="reward-bonus">
                  {[done.bonus.first > 0 && `+${done.bonus.first} première fois`, done.bonus.stars > 0 && `+${done.bonus.stars} pour ${done.stars} étoiles`]
                    .filter(Boolean)
                    .join(', ')}
                </span>
              )}
            </li>
            <li>
              <Icon name="zap" size="1.6rem" />
              <strong>+{done.xp}</strong> XP{done.perfect ? ' (bonus sans aide)' : ''}
            </li>
            {done.chestBlock && (
              <li className="reward-chest">
                <BlockIcon top={BLOCKS[done.chestBlock].top} side={BLOCKS[done.chestBlock].side} size={44} />
                Coffre de régularité : <strong>+6</strong> blocs {ofBlock(done.chestBlock)} !
              </li>
            )}
            <li className="reward-site">
              <Icon name="hammer" size="1.6rem" />
              <span>
                <strong>À quoi servent tes blocs.</strong> <Syllabified text={site.text} />
                {site.need > 1 && !site.ready && (
                  <span className="goal-gauge" role="img" aria-label={`${site.have} sur ${site.need}`}>
                    <span className="goal-gauge-fill" style={{ width: `${(100 * site.have) / site.need}%` }} />
                    <span className="goal-gauge-count" aria-hidden="true">
                      {site.have} / {site.need}
                    </span>
                  </span>
                )}
              </span>
            </li>
            {shipReady && site.kind !== 'navire' && (
              <li className="reward-ship">
                <Icon name="ship" size="1.6rem" />
                <span>
                  <strong>Le Bloc-Navire a tous ses blocs !</strong> Va les poser au port, sur {getBiome(shipReady.biome)?.name}.
                </span>
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
              {site.kind === 'aucun' || site.kind === 'garder' ? (
                <Link to={`/aventure/${biome.id}`} className="button primary">
                  <Icon name="map" /> Revenir sur {biome.name}
                </Link>
              ) : (
                <Link to={site.to} className="button primary">
                  <Icon name="hammer" /> Voir le chantier
                </Link>
              )}
              <button type="button" className="button" onClick={onReplay}>
                <Icon name="replay" /> Rejouer
              </button>
            </div>
          )}
        </div>
      </section>
    );
  }

  const allCorrect = answered ? answered.results.every((r) => r.correct) : false;
  // Variables du message : les champs de l'item fautif (ou du premier), puis les détails de l'écran.
  const firstWrong = answered
    ? items[
        Math.max(
          0,
          answered.results.findIndex((r) => !r.correct),
        )
      ]
    : items[0];
  const message = answered
    ? allCorrect
      ? def.feedback.correct
      : typeof answered.detail?.summary === 'string' && answered.detail.summary
        ? answered.detail.summary
        : fillTemplate(def.feedback.wrong, { target: def.target, ...firstWrong, ...answered.detail })
    : null;

  return (
    <section className={`quiz${answered ? ' has-sheet' : ''}`} ref={sectionRef} aria-labelledby="consigne">
      {ownConsigne ? (
        <div className="consigne">
          <h2 id="consigne" className="consigne-text">
            <Syllabified text={frenchTypography(def.instruction)} />
          </h2>
          <SpeakButton text={frenchTypography(def.instruction)} label="Consigne" compact />
        </div>
      ) : (
        <h2 id="consigne" className="visually-hidden">
          {def.instruction}
        </h2>
      )}
      <ol className={`quiz-steps${etapesNeutres ? ' quiz-steps-neutres' : ''}`} aria-label={`Écran ${index + 1} sur ${screens.length}`}>
        {screens.map((s, i) => (
          <li key={s[0].key} className={i < index ? 'done' : i === index ? 'current' : ''} aria-hidden="true" />
        ))}
      </ol>

      {firstTry && !answered && (
        <Feedback shout="Presque !" message={retryMessage(def.type, items)} tone="rate" speakKey={`${index}-essai`} />
      )}

      <Screen
        key={`${items[0].key}${firstTry ? '-2' : ''}`}
        items={items}
        answered={answered}
        onAnswer={onAnswer}
        onHelp={() => setHelpUsed(true)}
        level={levelFor(state, def.type)}
        target={def.target}
        exerciseId={def.id}
        lang={def.lang}
        ruledOut={firstTry && typeof firstTry.detail?.chosen === 'string' ? [firstTry.detail.chosen] : undefined}
      />

      {answered && message && (
        <div className={`result-sheet result-${allCorrect ? 'bien' : 'rate'}`} role="region" aria-label="Résultat">
          <div className="result-sheet-inner">
            <div className="result-sheet-body">
              <Feedback
                shout={allCorrect ? 'Bravo !' : 'Pas tout à fait'}
                message=""
                tone={allCorrect ? 'bien' : 'rate'}
                compact
                speakKey={index}
                autoSpeak={false}
              />
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

/** Le message du deuxième essai : l'indice de l'item s'il en a un, sinon ce qu'il faut refaire. */
function retryMessage(type: string, items: ExerciseItem[]): string {
  const hint = items.length === 1 && typeof items[0].hint === 'string' ? items[0].hint : '';
  if (hint) return `Indice : ${hint} Réessaie.`;
  if (SCREEN_TYPES[type]?.sorting) return 'Il y a au moins une erreur. Regarde et écoute encore chaque carte, puis valide.';
  return 'Ce n’est pas cette réponse. Regarde encore, puis choisis-en une autre.';
}
