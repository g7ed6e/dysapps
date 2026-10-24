// Le geste « ranger » (GD-20, point 8, lot L4 : trois gestes, toucher, marquer puis valider, ranger) : toucher l'objet,
// puis le panier, aucun glissement (glisser est reporté). Aux Filets, l'Enclos : quatre sujets à ranger, chacun dans le
// panier de son nombre (Singulier, Pluriel), puis « Valider » ; la correction est celle de l'écran de la grille
// (EnclosureScreen), mot pour mot. L'état de la manche est pur (../../world/continu/rangement.ts) ; la scène reçoit
// l'objet tenu et le panier de chaque objet rangé, et ne décide rien (avis d'architecture de l'expert frontend).
import { useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from '../../../components/Icon';
import { frenchTypography } from '../../../components/math/RichText';
import { SpeakButton } from '../../../components/SpeakButton';
import { useSettings } from '../../../core/SettingsContext';
import { texteGrand } from '../../../core/settings';
import type { ScreenProps } from '../../exercises/registry';
import type { ExerciseItem } from '../../exercises/types';
import { EMPTY_RANGEMENT, binOf, cancel, complete, drop, rangementResults, sortSlots, take, type Rangement } from '../../world/continu/rangement';
import { agreedSentence, agreedVerb, placeRuleLine, rangeGesture, type RangeBin } from '../../world/continu/questions';
import { ConsigneIcon, IconLabel, PlaceAid, aidOf, placeSceneOf, slotStyles, useQuestion, useStopOnLeave } from './placeScreen';

/** Le sujet d'un objet à ranger (« Le chien »). */
const subjectOf = (it: ExerciseItem): string => String(it.subject ?? it.key);

/** La correction de l'écran de la grille (EnclosureScreen) : les résultats, et le premier sujet mal rangé. */
export function sortAnswer(items: readonly ExerciseItem[], s: Rangement) {
  const results = rangementResults(s, items.map((it) => ({ key: it.key, answer: it.answer })));
  const firstWrong = items.find((_, i) => !results[i].correct);
  return {
    results,
    detail: firstWrong ? { subject: firstWrong.subject, why: firstWrong.why, verb: firstWrong.answer === 'pluriel' ? firstWrong.plural : firstWrong.singular } : {},
  };
}

/**
 * L'écran du geste « ranger » : les objets d'une manche sur le ponton, un panier à chaque bout. Toucher un objet le
 * prend (il se soulève, son étiquette prend une bordure épaisse et une main, « tenu » ; les paniers s'ouvrent) ; le
 * toucher de nouveau, ou Échap, le repose ; toucher un panier y range l'objet tenu. Un objet rangé se reprend jusqu'à
 * « Valider », qui attend que tout soit rangé.
 */
export function SortScreen({ items, answered, onAnswer, exerciseId, level }: ScreenProps) {
  const { layout, show, simple, place, lowScreen } = useQuestion();
  const { speak, settings } = useSettings();
  // Au plus grand texte sur un écran bas, en « Vue simple » : « Écouter les sujets » passe dans la bande de « Valider »,
  // comme les cloches du Phare ; la règle va sous la liste.
  const compact = simple && lowScreen && texteGrand(settings);
  useStopOnLeave();
  const bins: readonly RangeBin[] = useMemo(() => rangeGesture(place, exerciseId) ?? [], [place, exerciseId]);
  const [state, setState] = useState<Rangement>(EMPTY_RANGEMENT);
  // Ce que dit la région d'état (lue par les lecteurs d'écran, jamais affichée) : « Tu tiens : … », « … rangé dans … ».
  const [status, setStatus] = useState('');
  const scene = placeSceneOf(items[0]);
  // La règle du niveau (la même pour tous les sujets) : à droite sur tablette ; sur un écran bas, la rangée des six
  // étiquettes prend toute la largeur, et la règle reste dans « Vue simple » (comme les barres de Deux rives).
  const aid = simple || !layout.low ? aidOf(items[0]) : null;
  // Sur un écran bas, la ligne de la règle qui décide (« Plusieurs : pluriel, le verbe finit par -nt ») reste affichée
  // dans la scène, en haut à droite (relecture de L4 : contenu et référent dys) ; au plus grand texte, en « Vue simple »,
  // où la carte entière passe sous la liste, sur la ligne de la consigne repliée, avec un sujet par manche.
  // Au plus grand texte (`compact`), elle est sur la ligne de la consigne repliée (WorldQuestion).
  const ruleLine = layout.low && !simple ? placeRuleLine(place, exerciseId, level) : null;
  const keys = useMemo(() => items.map((it) => it.key), [items]);
  const itemsKey = keys.join('|');
  const slots = useMemo(() => sortSlots(items.length, bins.length), [items.length, bins.length]);
  const done = complete(state, keys);
  // La scène, en places de la rangée : l'objet tenu, et le panier de chaque objet rangé (les paniers, `null`).
  const heldSlot = state.held === null ? null : (slots.objects[keys.indexOf(state.held)] ?? null);
  const placedKey = keys.map((k) => binOf(state, k) ?? '').join('|');
  const sort = useMemo(() => {
    const placed: (number | null)[] = Array.from({ length: slots.count }, () => null);
    placedKey.split('|').forEach((bin, i) => {
      const j = bins.findIndex((b) => b.id === bin);
      if (j >= 0) placed[slots.objects[i]] = slots.bins[j];
    });
    return { bins: slots.bins, held: heldSlot, placed, low: layout.low };
  }, [slots, bins, heldSlot, placedKey, layout.low]);
  useEffect(() => {
    if (!scene) return;
    show({ key: itemsKey, scene, answered: Boolean(answered), right: [], picked: [], count: slots.count, aid: Boolean(aid), sort });
  }, [show, itemsKey, scene, answered, slots.count, aid, sort]);

  // Le focus après un dépôt : le prochain objet pas encore rangé, ou « Valider » (posé après le rendu).
  const root = useRef<HTMLDivElement>(null);
  const focusNext = useRef(false);
  useEffect(() => {
    if (!focusNext.current) return;
    focusNext.current = false;
    const next =
      root.current?.querySelector<HTMLElement>('.world-sort-prise:not(.placed):not(:disabled)') ??
      root.current?.querySelector<HTMLElement>('.validate-button:not(:disabled)');
    next?.focus();
  }, [state]);

  // Échap repose l'objet tenu, sans fermer le panneau (useOpenPanel écoute aussi Échap, sur `window`) : entendu en
  // premier, à la capture, il s'arrête là quand un objet est tenu.
  const holding = state.held !== null;
  // Le sujet tenu, pour « Reposé : … » quand Échap le repose.
  const heldSubject = state.held === null ? '' : subjectOf(items.find((it) => it.key === state.held) ?? { key: state.held });
  useEffect(() => {
    if (!holding || answered) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      e.stopImmediatePropagation();
      setState((s) => cancel(s));
      setStatus(`Reposé : ${heldSubject}.`);
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [holding, answered, heldSubject]);

  if (!scene) return null;
  const binLabel = (id: string | null) => bins.find((b) => b.id === id)?.label ?? '';
  const held = state.held === null ? undefined : items.find((it) => it.key === state.held);

  const touchPrise = (it: ExerciseItem) => {
    if (answered) return;
    const next = take(state, it.key);
    setState(next);
    if (next.held === it.key) {
      speak(subjectOf(it));
      setStatus(`Tu tiens : ${subjectOf(it)}.`);
    } else setStatus(`Reposé : ${subjectOf(it)}.`);
  };
  const touchBin = (bin: RangeBin) => {
    if (answered) return;
    if (!held) {
      setStatus('Touche d’abord un sujet, puis son panier.');
      return;
    }
    setState(drop(state, bin.id));
    setStatus(`${subjectOf(held)} : rangé dans ${bin.label}.`);
    focusNext.current = true;
  };
  const validate = () => {
    if (!done || answered) return;
    onAnswer(sortAnswer(items, state));
  };
  // Après « Valider », la voix dit chaque sujet avec son verbe accordé (« Les chiens mangent »).
  const heard = frenchTypography(items.map(answered ? agreedSentence : subjectOf).join(', '));
  // Sa place vient de scenetteLayout (en bas à droite) ; la feuille de style la reprend.
  const validateBox = simple ? null : layout.scenette.validate;
  const at = (slot: number) => (simple ? { hit: undefined, label: undefined } : slotStyles(layout.slots[slot] ?? layout.slots[0]));

  // Dans la scène, la règle se pose à droite de la colonne, en haut (comme « Presque ! ») : la colonne garde sa hauteur,
  // la rangée et ses objets restent dégagés.
  const rule = ruleLine && (
    <p className={`world-sort-regle${simple ? '' : ' a-cote'}`}>
      {frenchTypography(ruleLine)}
    </p>
  );
  const subjectList = (
    <ul className="world-answers" aria-label="Sujets à ranger">
      {items.map((it, i) => {
        const bin = binOf(state, it.key);
        const isHeld = state.held === it.key;
        const verdict = answered ? (bin === it.answer ? 'right' : 'wrong') : '';
        const styles = at(slots.objects[i]);
        return (
          <li key={it.key}>
            <button
              type="button"
              style={styles.hit}
              className={`word-card world-answer world-sort-prise${isHeld ? ' held' : ''}${bin ? ' placed' : ''}${verdict ? ` ${verdict}` : ''}`}
              aria-pressed={isHeld}
              disabled={Boolean(answered)}
              onClick={() => touchPrise(it)}
            >
              <span className="world-answer-label" style={styles.label}>
                {/* Le sujet en texte simple, sans syllabes colorées : leur couleur marquerait le -s final (relecture de
                    L4, référent dys). Après « Valider », son verbe accordé dessous (« Les chiens / mangent »). */}
                <span className="word-text">{subjectOf(it)}</span>
                {answered && agreedVerb(it) && <span className="world-sort-verbe">{agreedVerb(it)}</span>}
                {/* La main et « tenu » au-dessus de l'étiquette : le mot garde toute sa largeur. */}
                {isHeld && (
                  <span className="word-note world-sort-tenu">
                    <Icon name="main" className="world-sort-main" /> tenu
                  </span>
                )}
                {!isHeld && bin && !verdict && <span className="word-note">{simple ? `dans ${binLabel(bin)}` : binLabel(bin)}</span>}
                {verdict === 'right' && (
                  <span className="word-note world-sort-tenu">
                    <Icon name="check" /> {binLabel(bin)}
                  </span>
                )}
                {verdict === 'wrong' && <span className="word-note">va dans {binLabel(String(it.answer))}</span>}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
  const binList = (
    <ul className="world-answers world-sort-bins" aria-label="Paniers">
      {bins.map((b, j) => {
        const styles = at(slots.bins[j]);
        const inside = items.filter((it) => binOf(state, it.key) === b.id).length;
        return (
          <li key={b.id}>
            <button
              type="button"
              style={styles.hit}
              className={`choice world-answer world-sort-bin${holding ? ' open' : ''}`}
              aria-label={held ? `Panier ${b.label} : y ranger ${subjectOf(held)}` : `Panier ${b.label}, ${inside} rangé${inside > 1 ? 's' : ''}`}
              disabled={Boolean(answered)}
              onClick={() => touchBin(b)}
            >
              <span className="world-answer-label" style={styles.label}>
                <span className="word-text">{b.label}</span>
                {/* L'icône de panier au-dessus de l'étiquette, comme « tenu » : le mot garde toute sa largeur. */}
                <span className="word-note world-sort-tenu" aria-hidden="true">
                  <Icon name="panier" className="world-sort-panier" />
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );

  return (
    <div ref={root} className={`question world-place world-sort${holding ? ' tenu' : ''}`}>
      {!compact && (
        <div className="world-question-prompt">
          <div className="world-question-actions">
            <ConsigneIcon />
            {layout.low ? (
              <span className="world-icon">
                <SpeakButton text={heard} label="Écouter les sujets" compact />
                <IconLabel>Sujets</IconLabel>
              </span>
            ) : (
              <SpeakButton text={heard} label="Écouter les sujets" />
            )}
            {!answered && !validateBox && !simple && (
              <button type="button" className="button primary validate-button" disabled={!done} onClick={validate}>
                <Icon name="check" /> Valider
              </button>
            )}
          </div>
          {simple && rule}
          {aid && <PlaceAid aid={aid} layout={layout} simple={simple} />}
        </div>
      )}
      {!simple && rule}
      {!answered && validateBox && (
        <button type="button" className="button primary validate-button world-validate" disabled={!done} onClick={validate}>
          <Icon name="check" /> Valider
        </button>
      )}
      {/* En « Vue simple », les paniers d'abord, sous la consigne : on les voit dès l'ouverture, même quand le dernier sujet
          est plus bas (au plus grand texte sur un téléphone) ; dans la scène, ils sont aux deux bouts de la rangée. */}
      {simple ? (
        <>
          {binList}
          {subjectList}
        </>
      ) : (
        <>
          {subjectList}
          {binList}
        </>
      )}
      {compact && aid && <PlaceAid aid={aid} layout={layout} simple={simple} />}
      <p className="visually-hidden" role="status">
        {status}
      </p>
      {simple && (!answered || compact) && (
        <div className="world-simple-validate">
          {/* L'icône seule, 48 px, son nom toujours dit : la bande garde la hauteur d'un bouton. */}
          {compact && <SpeakButton text={heard} label="Écouter les sujets" compact />}
          {!answered && (
            <button type="button" className="button primary validate-button" disabled={!done} onClick={validate}>
              <Icon name="check" /> Valider
            </button>
          )}
        </div>
      )}
    </div>
  );
}
