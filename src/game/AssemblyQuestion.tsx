// La question d'un bloc assemblé (GD-2, décision du mainteneur du 1er octobre 2026) : « Assembler 1 poutre » ouvre, en
// plein écran comme une mission, une question sur les deux matières de la recette (docs/contenu/assemblage.md). L'écran
// est celui des documents à lire (CalculationScreen) : énoncé, question, trois choix, Écouter, rappel toujours affiché,
// indice. Juste du premier coup ou au second essai : le bloc est assemblé. Deux erreurs : rien n'est perdu,
// l'explication s'affiche, la question reviendra, et une autre question est proposée. Ni XP, ni étoiles, ni niveau.
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { Feedback } from '../components/Feedback';
import { Icon } from '../components/Icon';
import { Loading } from '../components/Loading';
import { frenchTypography } from '../components/math/RichText';
import { SpeakButton } from '../components/SpeakButton';
import { Syllabified } from '../components/Syllabified';
import { useAnswerKeys } from '../components/useAnswerKeys';
import { useFocusMode } from '../components/FocusMode';
import { moinsDAnimations } from '../core/motion';
import { useSettings } from '../core/SettingsContext';
import { useHaptics } from '../core/haptics';
import { useLoaded } from '../core/useLoaded';
import { NotFoundPage } from '../pages/NotFoundPage';
import { useTextes } from '../universes';
import { blockName, type BlockId } from './biomes';
import { useBlocland } from './BloclandContext';
import { SessionPause } from './SessionPause';
import { tirageDe, type GameState, type ReponseDonnee } from './engine';
import { loadAssemblage } from './exercises';
import { autoReadText } from './exercises/reading';
import { SCREEN_TYPES, retryAllowed, type ScreenAnswer } from './exercises/registry';
import { placerChoixAssemblage } from './exercises/shuffle';
import { fillTemplate, type AssemblageDef } from './exercises/types';
import { ASSEMBLAGE_PATH, assemblables, prochaineQuestion, recetteDe, type LieuDAssemblage, type Recette } from './world/assembly';

/** L'adresse de la question d'un bloc assemblé. */
export function questionPath(bloc: BlockId): string {
  return `${ASSEMBLAGE_PATH}/${bloc}`;
}

/** Ce que le lieu dit d'un bloc assemblé : « Tu as assemblé 1 poutre. Tu en as 5. » */
export function messageAssemble(bloc: BlockId, enPoche: number): string {
  return `Tu as assemblé 1 ${blockName(bloc, 1)}. Tu en as ${enPoche.toString()}.`;
}

/** Une graine au hasard pour le premier tirage d'un élève sur un bloc : l'ordre de ses questions. */
function graineAuHasard(): string {
  const c = globalThis.crypto;
  if (c?.getRandomValues) return Array.from(c.getRandomValues(new Uint32Array(2)), (n) => n.toString(36)).join('');
  return Math.floor(Math.random() * 2 ** 52).toString(36);
}

/** La page de la question : le lien de retour au lieu, le titre, puis la question (une autre à la demande). */
export function AssemblyQuestionPage() {
  const { bloc } = useParams();
  const recette = bloc ? recetteDe(bloc as BlockId) : undefined;
  const { assemblage } = useTextes();
  const [autre, setAutre] = useState(0);
  const loaded = useLoaded(async () => (recette ? ((await loadAssemblage(recette.bloc)) ?? null) : null), [recette?.bloc]);
  if (!recette || loaded === null) return <NotFoundPage />;
  const retour = `${ASSEMBLAGE_PATH}?bloc=${recette.bloc}`;
  return (
    <>
      <Link to={retour} className="back-link">
        <Icon name="back" /> {assemblage.titre}
      </Link>
      <h1 className="page-title">
        <Icon name="hammer" /> Assembler 1 {blockName(recette.bloc, 1)}
      </h1>
      {loaded ? (
        <QuestionDAssemblage key={autre} def={loaded} recette={recette} retour={retour} lieu={assemblage} onAutre={() => setAutre((n) => n + 1)} />
      ) : (
        <Loading />
      )}
    </>
  );
}

/** La question d'un bloc assemblé : la question mêlée, qui assemble le bloc à la bonne réponse. */
function QuestionDAssemblage({ def, recette, retour, lieu, onAutre }: { def: AssemblageDef; recette: Recette; retour: string; lieu: LieuDAssemblage; onAutre: () => void }) {
  const { repondreAssemblage } = useBlocland();
  const un = blockName(recette.bloc, 1);
  return (
    <MixedQuestion
      def={def}
      drawKey={recette.bloc}
      canDo={(stock) => assemblables(stock, recette) > 0}
      retour={retour}
      retourText={`Revenir ${lieu.a}`}
      aLieu={lieu.a}
      againText={`Assembler 1 autre ${un}`}
      onAutre={onAutre}
      commit={(reponse) => {
        const r = repondreAssemblage(recette.bloc, reponse);
        if (r.assemble)
          return { done: true, text: messageAssemble(recette.bloc, r.state.stock[recette.bloc] ?? 0), again: assemblables(r.state.stock, recette) > 0, backState: { assemble: recette.bloc } };
        return { done: false, lacking: reponse.juste ? `C’est juste, mais il te manque des blocs pour 1 ${un} : rien n’est pris.` : undefined };
      }}
    />
  );
}

/** Ce que fait la bonne réponse : la chose est faite (son message, et si l'on peut en refaire une), ou il manquait des blocs. */
export type MixedQuestionCommit = { done: true; text: string; again?: boolean; backState?: unknown } | { done: false; lacking?: string };

interface Fin {
  juste: boolean;
  /** La chose est faite (le bloc assemblé, la pièce posée) : le lieu le redira au retour. */
  assemble: boolean;
  /** Ce que le retour passe au lieu (le bloc assemblé, pour sa carte). */
  backState?: unknown;
  /** Ce qui s'affiche sous le cri : le bloc assemblé, ou l'explication. */
  texte: string;
}

/**
 * Une question qui mêle deux matières (GD-2, GD-10) : celle d'un bloc assemblé, ou d'une pièce de projet. Le tirage de
 * l'élève (`drawKey` : le bloc ou la banque), deux essais, rien de perdu ; à la bonne réponse, `commit` fait la chose.
 */
export function MixedQuestion({
  def,
  drawKey,
  canDo,
  commit,
  retour,
  retourText,
  aLieu,
  againText,
  onAutre,
}: {
  def: AssemblageDef;
  drawKey: string;
  /** Le stock permet-il de faire la chose ? Lu une fois, à l'ouverture. */
  canDo: (stock: GameState['stock']) => boolean;
  /** Note la réponse finale et, juste, fait la chose. */
  commit: (reponse: ReponseDonnee) => MixedQuestionCommit;
  retour: string;
  /** Le bouton de retour : « Revenir à la Fabrique ». */
  retourText: string;
  /** Où l'on revient, après « Tu reviens » : « à la Fabrique ». */
  aLieu: string;
  /** Le bouton pour en refaire une, quand c'est possible. */
  againText?: string;
  onAutre: () => void;
}) {
  const { state, pauseAfterNext, continueSession } = useBlocland();
  const { settings, speak } = useSettings();
  const haptics = useHaptics();
  const navigate = useNavigate();
  const sectionRef = useRef<HTMLElement>(null);
  const cles = useMemo(() => def.items.map((it) => it.key), [def]);
  // Fixés à l'ouverture : le tirage de l'élève (un neuf la première fois), la question tirée, ses choix placés (la même
  // place pour une question tout au long d'un tour), et ce qu'il peut assembler.
  const [tirage] = useState(() => tirageDe(state, drawKey, graineAuHasard()));
  const [possible] = useState(() => canDo(state.stock));
  const [item] = useState(() => {
    const cle = prochaineQuestion(cles, tirage);
    return placerChoixAssemblage(def, `${tirage.graine}:${tirage.tour}`).find((it) => it.key === cle);
  });
  const [firstTry, setFirstTry] = useState<ScreenAnswer | null>(null);
  const [answered, setAnswered] = useState<ScreenAnswer | null>(null);
  const [fin, setFin] = useState<Fin | null>(null);
  const [encore, setEncore] = useState(false);
  // L'horloge de séance (trois exercices ou dix minutes, questions d'assemblage comprises) : la pause s'affiche à la
  // place des boutons, comme au bilan d'une mission.
  const [pause, setPause] = useState(false);
  // Les essais déjà comptés, lus sans attendre un rendu : un double toucher ne compte jamais deux erreurs, ni
  // n'assemble deux blocs.
  const essais = useRef<'aucun' | 'premier' | 'fini'>('aucun');

  const resultatRef = useRef<HTMLDivElement>(null);
  const principalRef = useRef<HTMLAnchorElement & HTMLButtonElement>(null);
  // Le mode concentration reste jusqu'à ce que l'élève quitte l'écran, résultat compris : la barre du haut ne revient
  // pas sous ses yeux. Quitter ne prend rien ; une fois le bloc assemblé, il est dans la poche. Retour au lieu sans
  // garder la question dans l'historique : le geste retour du téléphone ne la rouvre pas.
  const notePause = `${fin?.assemble ? fin.texte : 'Tes blocs restent dans ta poche : rien n’est pris.'} Tu reviens ${aLieu}.`;
  useFocusMode(possible, () => navigate(retour, { replace: true }), notePause);
  useAnswerKeys(sectionRef);
  // Le résultat s'affiche sous les réponses, en entier, avec ses boutons : la page y défile, le focus va au bouton
  // principal (relecture UX UI : le bandeau fixe passait sous la question ou hors de l'écran). Plus haut que l'écran
  // (grands réglages, longue explication), il s'ouvre sur son début : on lit le message avant les boutons.
  useEffect(() => {
    const resultat = resultatRef.current;
    if (!fin || !resultat) return;
    // La place sous le bouton Pause : l'écran, moins les marges de défilement du résultat.
    const style = getComputedStyle(resultat);
    const place = window.innerHeight - (parseFloat(style.scrollMarginTop) || 0) - (parseFloat(style.scrollMarginBottom) || 0);
    const block = resultat.getBoundingClientRect().height > place ? 'start' : 'end';
    resultat.scrollIntoView?.({ block, behavior: moinsDAnimations() ? 'auto' : 'smooth' });
    principalRef.current?.focus({ preventScroll: true });
  }, [fin, pause]);
  // La consigne et la question sont lues en ouvrant, comme au début d'une mission ; le document, à la demande.
  useEffect(() => {
    if (settings.autoRead && item && possible) speak(autoReadText(def.instruction, [item]));
    // Une lecture par question.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sans assez de blocs (une adresse tapée, un autre onglet), aucune question : retour au lieu, où il manque quelque chose.
  if (!possible) return <Navigate to={retour} replace />;
  if (!item) return <NotFoundPage />;
  const Screen = SCREEN_TYPES[def.type].component;

  const onAnswer = (a: ScreenAnswer) => {
    if (answered || essais.current === 'fini') return;
    const juste = a.results.every((r) => r.correct);
    // Une erreur au premier essai : l'indice, la réponse tentée barrée, un second essai.
    if (!juste && essais.current === 'aucun' && retryAllowed(def.type, [item])) {
      essais.current = 'premier';
      setFirstTry(a);
      return;
    }
    essais.current = 'fini';
    setAnswered(a);
    const reponse: ReponseDonnee = { cles, cle: item.key, juste, tirage };
    const r = commit(reponse);
    setPause(pauseAfterNext);
    if (r.done) {
      haptics.success();
      setFin({ juste: true, assemble: true, texte: r.text, backState: r.backState });
      setEncore(Boolean(r.again));
      return;
    }
    // Juste, mais les blocs ont été pris ailleurs entre-temps : rien n'est fait ni perdu.
    if (juste) {
      setFin({ juste: true, assemble: false, texte: r.lacking ?? 'C’est juste, mais il te manque des blocs : rien n’est pris.' });
      return;
    }
    const explication = fillTemplate(def.feedback.wrong, { ...item, ...a.detail });
    setFin({ juste: false, assemble: false, texte: `${explication} Tes blocs sont toujours dans ta poche.` });
    setEncore(true);
  };

  return (
    <section className="quiz assemblage-question" ref={sectionRef} aria-labelledby="consigne">
      <div className="consigne">
        <h2 id="consigne" className="consigne-text">
          <Syllabified text={frenchTypography(def.instruction)} />
        </h2>
        <SpeakButton text={frenchTypography(def.instruction)} label="Consigne" compact />
      </div>

      {firstTry && !answered && (
        <Feedback
          shout="Presque !"
          message={item.hint ? `Indice : ${String(item.hint)} Réessaie.` : 'Ce n’est pas cette réponse. Regarde encore, puis choisis-en une autre.'}
          tone="rate"
          speakKey="essai"
        />
      )}

      <Screen
        key={`${item.key}${firstTry ? '-2' : ''}`}
        items={[item]}
        answered={answered}
        onAnswer={onAnswer}
        onHelp={() => {}}
        level={1}
        exerciseId={def.id}
        lang={def.lang}
        ruledOut={firstTry && typeof firstTry.detail?.chosen === 'string' ? [firstTry.detail.chosen] : undefined}
      />

      {answered && fin && (
        <div ref={resultatRef} className={`panel assemblage-resultat result-${fin.juste ? 'bien' : 'rate'}`} role="region" aria-label="Résultat">
          {/* Un seul bouton Écouter : il lit le cri, puis le bloc assemblé ou l'explication. */}
          <Feedback
            shout={fin.juste ? def.feedback.correct : 'Pas tout à fait'}
            message={fin.texte}
            tone={fin.juste ? 'bien' : 'rate'}
            compact
            speakKey="fin"
            autoSpeak={false}
          />
          {pause ? (
            <SessionPause
              suite={`Tu pourras revenir ${aLieu} plus tard.`}
              onContinuer={() => {
                continueSession();
                setPause(false);
              }}
            />
          ) : (
            <div className="assemblage-question-actions">
              {fin.juste ? (
                <>
                  <Link ref={principalRef} to={retour} replace state={fin.assemble ? fin.backState : undefined} className="button primary next-button">
                    <Icon name="back" /> {retourText}
                  </Link>
                  {encore && againText && (
                    <button type="button" className="button" onClick={onAutre}>
                      <Icon name="hammer" /> {againText}
                    </button>
                  )}
                </>
              ) : (
                <>
                  <button ref={principalRef} type="button" className="button primary next-button" onClick={onAutre}>
                    <Icon name="replay" /> Une autre question
                  </button>
                  <Link to={retour} replace className="button">
                    <Icon name="back" /> {retourText}
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
