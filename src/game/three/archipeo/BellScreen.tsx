// Le Phare (GD-20, point 8, lot L3) : la Chasse au son et les Rimes-échelle aux cloches, marquer puis « Valider ». Tiré
// de WorldQuestion.tsx (relecture de L3, expert frontend). Au plus grand texte sur un écran bas (relecture de L3, référent
// dys, consultant UX UI, contenu) : la cible (« Le son [an] », « Rime avec chapeau ») reste en tête, avant les mots,
// même consigne repliée ; les manches sont de quatre (`bellRounds`, WorldQuestion.tsx) et tiennent au-dessus de la
// bande de « Valider » ; « Valider » ne corrige jamais un mot qui n'a pas été montré : il amène d'abord à l'écran les
// cloches pas encore vues.
import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { Icon } from '../../../components/Icon';
import { frenchTypography } from '../../../components/math/RichText';
import { SpeakButton } from '../../../components/SpeakButton';
import { moinsDAnimations } from '../../../core/motion';
import { useSettings } from '../../../core/SettingsContext';
import { texteGrand } from '../../../core/settings';
import type { ScreenProps } from '../../exercises/registry';
import { CARD_CLASS, cardState, sortSummary } from '../../exercises/sortCards';
import type { ExerciseItem } from '../../exercises/types';
import { missionIs } from '../../world/continu/questions';
import { ConsigneIcon, IconLabel, placeSceneOf, slotStyles, useQuestion, useStopOnLeave } from './placeScreen';

/**
 * Les cloches d'une liste qui défile (« Vue simple ») vues en entier au moins une fois, entre le haut du panneau et la
 * bande de « Valider ». Relu à l'ouverture d'une manche, au défilement et au changement de taille, jamais à chaque image ;
 * les clés d'une manche passée ne gênent pas (chaque mot n'est que dans une manche).
 */
function useSeenBells(list: RefObject<HTMLUListElement | null>, active: boolean, itemsKey: string) {
  const seen = useRef(new Set<string>());
  const look = useCallback(() => {
    const ul = list.current;
    if (!ul) return;
    const panel = ul.closest<HTMLElement>('.quiz');
    const band = panel?.querySelector<HTMLElement>('.world-simple-validate');
    const top = panel ? panel.getBoundingClientRect().top : -Infinity;
    const bottom = band ? band.getBoundingClientRect().top : (panel?.getBoundingClientRect().bottom ?? Infinity);
    for (const card of ul.querySelectorAll<HTMLElement>('[data-cle]')) {
      const r = card.getBoundingClientRect();
      if (r.top >= top - 1 && r.bottom <= bottom + 1) seen.current.add(card.dataset.cle ?? '');
    }
  }, [list]);
  useEffect(() => {
    const ul = list.current;
    const panel = ul?.closest<HTMLElement>('.quiz');
    if (!active || !ul || !panel) return;
    let frame = requestAnimationFrame(look);
    const later = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(look);
    };
    panel.addEventListener('scroll', later, { passive: true });
    const observer = new ResizeObserver(later);
    observer.observe(panel);
    return () => {
      cancelAnimationFrame(frame);
      panel.removeEventListener('scroll', later);
      observer.disconnect();
    };
  }, [list, active, look, itemsKey]);
  /** La première cloche jamais vue en entier, relue à l'instant (aucune quand la liste ne défile pas). */
  const firstUnseen = useCallback((): HTMLElement | null => {
    if (!active) return null;
    look();
    const cards = [...(list.current?.querySelectorAll<HTMLElement>('[data-cle]') ?? [])];
    return cards.find((c) => !seen.current.has(c.dataset.cle ?? '')) ?? null;
  }, [active, list, look]);
  return firstUnseen;
}

/** La cible d'une manche : « Le son [an] » (la Chasse au son), « Rime avec chapeau » (les Rimes-échelle). */
export function BellTarget({ target, rhymes }: { target: string; rhymes: boolean }) {
  return rhymes ? (
    <>
      <span className="cible-mot">Rime avec</span> <strong>{target}</strong>
    </>
  ) : (
    <>
      <span className="cible-mot">Le son</span> <strong>[{target}]</strong>
    </>
  );
}

/** « Écouter les cloches » en icône de 48 px, son mot dessous (un écran bas). */
function BellVoice({ text }: { text: string }) {
  return (
    <span className="world-icon">
      <SpeakButton text={text} label="Écouter les cloches" compact />
      <IconLabel>Cloches</IconLabel>
    </span>
  );
}

/**
 * Le Phare : les mots d'une manche portés par des cloches (six au plus, quatre au plus grand texte sur un écran bas), en carillon au pied de la tour. Toucher une
 * cloche dit son mot et la marque (ou la démarque) ; « Valider » corrige la manche, comme la Chasse au son et les
 * Rimes-échelle (le même geste, GD-20, point 8, lot L3). Les mots sont écrits sans couleur de syllabes : une couleur
 * pourrait désigner le son demandé, ou la fin qui rime.
 */
export function BellScreen({ items, answered, onAnswer, target, exerciseId }: ScreenProps) {
  const { layout, show, simple, lowScreen } = useQuestion();
  const { speak, settings } = useSettings();
  // Au plus grand texte sur un écran bas, en « Vue simple » : la cible est sur la ligne de la consigne repliée
  // (WorldQuestion.tsx), « Écouter les cloches » dans la bande de « Valider » ; la manche tient au-dessus de la bande.
  const compact = simple && lowScreen && texteGrand(settings);
  useStopOnLeave();
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const rhymes = missionIs(exerciseId, 'rhymes');
  const scene = placeSceneOf(items[0]);
  const right = useMemo(() => (answered ? items.flatMap((it, i) => (it.correct ? [i] : [])) : []), [items, answered]);
  const chosen = useMemo(() => items.flatMap((it, i) => (picked.has(it.key) ? [i] : [])), [items, picked]);
  const itemsKey = items.map((it) => it.key).join('|');
  const list = useRef<HTMLUListElement>(null);
  const firstUnseen = useSeenBells(list, simple, itemsKey);
  useEffect(() => {
    if (!scene) return;
    show({ key: itemsKey, scene, answered: Boolean(answered), right, picked: chosen, count: items.length, aid: false });
  }, [show, itemsKey, scene, answered, right, chosen, items.length]);
  if (!scene) return null;

  const toggle = (it: ExerciseItem) => {
    if (answered) return;
    speak(String(it.word));
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(it.key)) next.delete(it.key);
      else next.add(it.key);
      return next;
    });
  };
  const validate = () => {
    // Une cloche pas encore montrée vient d'abord à l'écran : on ne corrige que ce que l'élève a vu.
    const hidden = firstUnseen();
    if (hidden) {
      hidden.scrollIntoView?.({ block: 'nearest', behavior: moinsDAnimations() ? 'auto' : 'smooth' });
      return;
    }
    const results = items.map((it) => ({ key: it.key, correct: picked.has(it.key) === Boolean(it.correct) }));
    const firstWrong = items.find((_, i) => !results[i].correct);
    // La correction de l'écran de la grille, mot pour mot (RhymesScreen, SoundHuntScreen) : toutes les erreurs nommées.
    if (rhymes) {
      const summary = sortSummary(
        items,
        picked,
        {
          missed: (words) => `Tu as oublié ${words} : ça rime aussi avec ${target}.`,
          intruder: (word, ending) => `${word} finit par ${ending} : ça ne rime pas avec ${target}.`,
        },
        (it) => String(it.ending),
      );
      onAnswer({ results, detail: firstWrong ? { word: firstWrong.word, ending: firstWrong.ending, missed: !picked.has(firstWrong.key), summary } : {} });
      return;
    }
    const summary = sortSummary(
      items,
      picked,
      {
        missed: (words) => `Tu as oublié ${words} : on y entend [${target}].`,
        intruder: (word, heard) => `Dans ${word}, on entend ${heard}, pas [${target}].`,
      },
      (it) => String(it.heard),
    );
    onAnswer({ results, detail: firstWrong ? { word: firstWrong.word, heard: firstWrong.heard, missed: !picked.has(firstWrong.key), summary } : {} });
  };
  const words = items.map((it) => String(it.word));
  // Les Rimes-échelle : la voix dit d'abord le mot repère, puis les cloches.
  const heard = frenchTypography(rhymes ? `Rime avec ${target} : ${words.join(', ')}` : words.join(', '));
  // Sa place vient de scenetteLayout (en bas à droite, 3 % du bord) ; la feuille de style la reprend.
  const validateBox = simple ? null : layout.scenette.validate;

  return (
    <div className="question world-place">
      {!compact && (
        <div className="world-question-prompt">
          <div className="world-question-actions">
            <p className="question-prompt sound-target">
              <BellTarget target={String(target ?? '')} rhymes={rhymes} />
            </p>
            <ConsigneIcon />
            {layout.low ? <BellVoice text={heard} /> : <SpeakButton text={heard} label="Écouter les cloches" />}
            {!answered && !validateBox && !simple && (
              <button type="button" className="button primary validate-button" onClick={validate}>
                <Icon name="check" /> Valider
              </button>
            )}
          </div>
        </div>
      )}
      {/* Dans une scénette, sur tablette : « Valider » en bas à droite, sous la rangée des cloches. */}
      {!answered && validateBox && (
        <button type="button" className="button primary validate-button world-validate" onClick={validate}>
          <Icon name="check" /> Valider
        </button>
      )}
      <ul ref={list} className="world-answers" aria-label="Cloches à trier">
        {items.map((it, i) => {
          const slot = layout.slots[i] ?? layout.slots[0];
          // En « Vue simple », les cloches sont une liste qui passe à la ligne : rien n'est posé sur la scène.
          const styles = simple ? { hit: undefined, label: undefined } : slotStyles(slot);
          const on = picked.has(it.key);
          const st = answered ? cardState(it, on) : null;
          return (
            <li key={it.key} data-cle={it.key}>
              <button
                type="button"
                style={styles.hit}
                className={`word-card world-answer${on ? ' picked' : ''}${st ? CARD_CLASS[st] : ''}`}
                aria-pressed={on}
                disabled={Boolean(answered)}
                onClick={() => toggle(it)}
              >
                <span className="world-answer-label" style={styles.label}>
                  {typeof it.image === 'string' && it.image && (
                    <span className="word-picto" aria-hidden="true">
                      {it.image}
                    </span>
                  )}
                  <span className="word-text">{String(it.word)}</span>
                  {st === 'found' && <Icon name="check" className="word-mark" />}
                  {st === 'missed' && <span className="word-note">oublié</span>}
                  {st === 'intruder' && <span className="word-note">{rhymes ? 'ne rime pas' : `pas [${target}]`}</span>}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {/* En « Vue simple » : « Valider » sous la liste, comme sous la rangée dans la scène ; sa bande reste au bas du
          panneau qui défile, toujours atteignable. */}
      {simple && (!answered || compact) && (
        <div className="world-simple-validate">
          {/* L'icône seule, 48 px, son nom toujours dit : la bande garde sa hauteur d'un bouton. */}
          {compact && <SpeakButton text={heard} label="Écouter les cloches" compact />}
          {!answered && (
            <button type="button" className="button primary validate-button" onClick={validate}>
              <Icon name="check" /> Valider
            </button>
          )}
        </div>
      )}
    </div>
  );
}
