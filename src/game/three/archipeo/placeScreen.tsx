// Ce que partagent les écrans des lieux du monde ouvert (WorldQuestion.tsx, BellScreen.tsx, SortScreen.tsx) : le contexte de la
// question (la place de la scène, « Vue simple », la consigne, l'item à montrer), la scène d'un item, la place d'une
// réponse posée sur la scène, la règle et la figure d'un item, les icônes d'action d'un écran bas et la voix coupée
// entre deux items.
import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Icon } from '../../../components/Icon';
import { RichText, frenchTypography } from '../../../components/math/RichText';
import { SpeakButton } from '../../../components/SpeakButton';
import { Syllabified } from '../../../components/Syllabified';
import { useSettings } from '../../../core/SettingsContext';
import { langAttr, type Lang } from '../../../core/speech';
import type { ExerciseItem } from '../../exercises/types';
import { Aid } from '../../exercises/Aid';
import type { AidData } from '../../exercises/maths';
import type { AnswerSlot, QuestionLayout, ScreenBox, SortLook } from '../../world/continu/questionScene';
import type { PlaceId } from '../../world/continu/levelPlan';
import type { ScenetteLayout } from '../../world/continu/scenette';
import { isItemScene, type ItemGesture, type ItemScene } from '../../world/continu/questions';

/** Ce que l'écran d'un lieu demande à la scène : l'item à montrer, combien de réponses il a, s'il a une règle. */
export interface ItemShown {
  /** La clé de l'item (la consigne repliée se replie quand elle change). */
  key: string;
  scene: ItemScene;
  answered: boolean;
  right: number[];
  /** Les réponses choisies, pas encore validées (les cloches du Phare). */
  picked: number[];
  count: number;
  aid: boolean;
  /** Le geste « ranger » (lot L4) : les places des paniers, de l'objet tenu, et le panier de chaque objet rangé. */
  sort?: SortLook;
  /** Le geste de l'item (GD-26), quand ce n'est pas toucher : « Valider » a sa place. */
  gesture?: ItemGesture | null;
  /** La consigne de la bulle propre à l'item (son geste), huit mots au plus. */
  short?: string;
  /** Le geste « régler » : les crans réglés et leur nombre au plus, que la scène montre sans nombre (la lueur). */
  dial?: { count: number; max: number };
}

export interface QuestionContextValue {
  /** Le lieu de la question (le geste d'un écran en dépend : les paniers des Filets). */
  place: PlaceId;
  layout: ScenetteLayout;
  /** « Vue simple » dans une scénette : la question en liste, sur fond uni, sans quitter la manche en cours. */
  simple: boolean;
  /** La consigne du lieu : l'icône qui la lit, sur un écran bas. */
  instruction: string;
  show(item: ItemShown | null): void;
  /** Un écran bas (un téléphone couché), même quand la scénette y prend la bulle de la tablette (GD-26). */
  lowScreen: boolean;
}

export const QuestionContext = createContext<QuestionContextValue | null>(null);

// L'écran refait ses items à chaque rendu : la scène se compare par valeur, pour ne pas la refaire pour rien.
export const sameItem = (a: ItemShown, b: ItemShown) =>
  a.key === b.key &&
  JSON.stringify(a.scene) === JSON.stringify(b.scene) &&
  a.answered === b.answered &&
  a.count === b.count &&
  a.aid === b.aid &&
  a.right.length === b.right.length &&
  a.right.every((r, i) => r === b.right[i]) &&
  a.picked.length === b.picked.length &&
  a.picked.every((r, i) => r === b.picked[i]) &&
  JSON.stringify(a.sort ?? null) === JSON.stringify(b.sort ?? null) &&
  (a.gesture ?? null) === (b.gesture ?? null) &&
  a.short === b.short &&
  a.dial?.count === b.dial?.count &&
  a.dial?.max === b.dial?.max;

export function useQuestion(): QuestionContextValue {
  const ctx = useContext(QuestionContext);
  if (!ctx) throw new Error('Un écran de lieu se pose dans une question du monde ouvert.');
  return ctx;
}

/** La scène d'un item posé dans un lieu (`placeItems`), ou `null` si l'item n'en a pas. */
export function placeSceneOf(item: ExerciseItem | undefined): ItemScene | null {
  const scene = item?.placeScene;
  return isItemScene(scene) ? scene : null;
}

/** La cible de toucher d'une réponse (l'étiquette et l'objet), et la place de l'étiquette dedans. */
export function slotStyles(slot: AnswerSlot): { hit: CSSProperties; label: CSSProperties } {
  const { hit, label } = slot;
  return {
    hit: { left: `${Math.round(hit.left)}px`, top: `${Math.round(hit.top)}px`, width: `${Math.round(hit.right - hit.left)}px`, height: `${Math.round(hit.bottom - hit.top)}px` },
    label: { top: `${Math.round(label.top - hit.top)}px`, height: `${Math.round(label.bottom - label.top)}px` },
  };
}

/** Une icône d'action de 48 px, son mot dessous en grand texte (et toujours dit aux lecteurs d'écran). */
export function IconLabel({ children }: { children: string }) {
  return (
    <span className="world-icon-label" aria-hidden="true">
      {children}
    </span>
  );
}

/** L'icône qui lit la consigne, à côté de la phrase, sur un écran bas. */
export function ConsigneIcon() {
  const { instruction, layout, simple } = useQuestion();
  // En « Vue simple », la consigne garde sa ligne et sa voix en tête du panneau.
  if (!layout.low || simple) return null;
  return (
    <span className="world-icon world-consigne">
      <SpeakButton text={frenchTypography(instruction)} label="Lire la consigne" compact />
      <IconLabel>Consigne</IconLabel>
    </span>
  );
}

/** La voix se coupe quand l'écran change (la coupe entre deux items). */
export function useStopOnLeave(): void {
  const { stop } = useSettings();
  useEffect(() => () => stop(), [stop]);
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Une aide décrite en données (une carte de règle, une grille de points, une figure), ou `null`. */
function aidData(aid: unknown): AidData | null {
  if (!isRecord(aid) || typeof aid.kind !== 'string' || !isRecord(aid.props)) return null;
  return { kind: aid.kind, props: aid.props };
}

/** La règle d'un item (la carte de règle, une aide de calcul), comme sur l'écran classique. */
export const aidOf = (item: ExerciseItem | undefined): AidData | null => aidData(item?.aid);

/** La figure d'un item (la figure exacte, le schéma coté), comme sur l'écran classique. */
export const figureOf = (item: ExerciseItem | undefined): AidData | null => aidData(item?.figure);

/**
 * La règle : sous la question dans la colonne, ou à droite sur un écran bas (en « Vue simple », toujours dans la liste,
 * jamais posée sur elle).
 */
export function PlaceAid({ aid, layout, simple, lang }: { aid: AidData; layout: QuestionLayout; simple: boolean; lang?: Lang }) {
  const box = simple ? null : layout.aid;
  const style: CSSProperties | undefined = box
    ? {
        left: `${Math.round(box.left)}px`,
        top: `${Math.round(box.top)}px`,
        width: `${Math.round(box.right - box.left)}px`,
        maxHeight: `${Math.round(box.bottom - box.top)}px`,
      }
    : undefined;
  return (
    <div className={`aid world-question-aid${box ? ' beside' : ''}`} style={style}>
      <Aid aid={aid} lang={lang} />
    </div>
  );
}

/**
 * Le carnet de la bulle (GD-26) : à gauche de la scène, sous la bulle, le document de l'item, sa figure et sa règle,
 * toujours ouverts pendant l'action ; il défile seul s'il est plus haut que sa place.
 */
export function PlaceCarnet({ box, children }: { box: ScreenBox; children: ReactNode }) {
  // Le repère « Suite plus bas » tant que le carnet est plus haut que sa place (relectures de la PR 1 : un rappel qui
  // défile se dit) ; il part quand on a lu jusqu'en bas.
  const ref = useRef<HTMLDivElement>(null);
  const [more, setMore] = useState(false);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => setMore(el.scrollHeight > el.clientHeight + 1 && el.scrollTop + el.clientHeight < el.scrollHeight - 1);
    check();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(check);
    observer?.observe(el);
    el.addEventListener('scroll', check, { passive: true });
    return () => {
      observer?.disconnect();
      el.removeEventListener('scroll', check);
    };
  }, []);
  const style: CSSProperties = {
    left: `${Math.round(box.left)}px`,
    top: `${Math.round(box.top)}px`,
    width: `${Math.round(box.right - box.left)}px`,
    maxHeight: `${Math.round(box.bottom - box.top)}px`,
  };
  return (
    <div ref={ref} className="aid world-question-aid world-carnet beside" style={style} data-suite={more ? '' : undefined}>
      {children}
      {more && (
        // Le repère seul, caché aux lecteurs d'écran (ils lisent tout le carnet), comme celui des panneaux.
        <span className="world-carnet-suite" aria-hidden="true">
          <Icon name="chevronDown" />
        </span>
      )}
    </div>
  );
}

/**
 * Le document d'un item en C (GD-20, point 8, lot L6a, règle du C) : après les réponses, toujours ouvert (on ne répond
 * pas sans le lire), jamais dans une boîte qui défile à part ; « Écouter le document » en tête (48 px, l'icône, son nom
 * dit), puis une ligne par information, en syllabes comme une consigne.
 */
export function PlaceDocument({ text, spoken, lang = 'fr', label }: { text: string; spoken: string; lang?: Lang; label?: string }) {
  return (
    <div className="notice world-document">
      {/* Un nom donné (« Écouter », l'histoire de Story time) s'écrit à côté du haut-parleur ; sinon, l'icône seule. */}
      <SpeakButton text={spoken} label={label ?? 'Écouter le document'} shown={text} compact={!label} lang={lang} />
      <ul className="notice-text" role="list" lang={langAttr(lang)}>
        {text.split('\n').map((line, i) => (
          <li key={i} className="notice-line">
            {/* Un document en langue vivante (le large, lot L9) : jamais de syllabes en couleurs, sa voix dans sa langue. */}
            {lang === 'fr' ? <Syllabified text={frenchTypography(line)} /> : <RichText text={line} lang={lang} />}
          </li>
        ))}
      </ul>
    </div>
  );
}
