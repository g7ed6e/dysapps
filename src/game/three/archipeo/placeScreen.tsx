// Ce que partagent les écrans des lieux du monde ouvert (WorldQuestion.tsx, BellScreen.tsx) : le contexte de la
// question (la place de la scène, « Vue simple », la consigne, l'item à montrer), la scène d'un item, la place d'une
// réponse posée sur la scène, les icônes d'action d'un écran bas et la voix coupée entre deux items.
import { createContext, useContext, useEffect, type CSSProperties } from 'react';
import { frenchTypography } from '../../../components/math/RichText';
import { SpeakButton } from '../../../components/SpeakButton';
import { useSettings } from '../../../core/SettingsContext';
import type { ExerciseItem } from '../../exercises/types';
import type { AnswerSlot } from '../../world/continu/questionScene';
import type { ScenetteLayout } from '../../world/continu/scenette';
import { isItemScene, type ItemScene } from '../../world/continu/questions';

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
}

export interface QuestionContextValue {
  layout: ScenetteLayout;
  /** « Vue simple » dans une scénette : la question en liste, sur fond uni, sans quitter la manche en cours. */
  simple: boolean;
  /** La consigne du lieu : l'icône qui la lit, sur un écran bas. */
  instruction: string;
  show(item: ItemShown | null): void;
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
  a.picked.every((r, i) => r === b.picked[i]);

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
