// Les pastilles des habitants (GD-20, point 4, lot L1 « Livrer » ; arbitrages du directeur artistique, point 4, « Les
// signes ») : une pastille ronde de 48 px au-dessus d'un lieu dont l'habitant attend quelque chose, posée à chaque image
// par la scène (sans passer par React), comme les cadenas des ponts ; trois au plus. Un contour clair (Brume, #E5EBE3),
// de jour comme de nuit ; la suggérée pleine (Nuit océan, #142B38), son icône claire, et un anneau plus épais : la
// différence ne tient pas à la seule couleur. Son icône : le bloc demandé pour une commande, l'icône de l'île (la
// notion) pour des révisions ; jamais celle de « Scène ». Son nom est lu (« Commande, pierres, au Phare »). Un toucher y
// fait marcher Kéo, puis le panneau du lieu s'ouvre. Rien sur la Carte dans ce lot.
import type { RefObject } from 'react';
import { Icon } from '../../../components/Icon';
import { BLOCKS, getBiome } from '../../biomes';
import { BlockIcon } from '../../Voxel';
import { keepClear, type Obstacle, type ScreenRect } from '../../world/continu/mission';
import { placeById, type PlaceId } from '../../world/continu/plan6e';
import { entraideIcon, type HabitantSign } from './remiseOf';
import type { SignOnScreen } from './scene';

interface Props {
  signs: readonly HabitantSign[];
  hidden: boolean;
  onPick(place: PlaceId): void;
  root: RefObject<HTMLDivElement | null>;
}

export function HabitantSigns({ signs, hidden, onPick, root }: Props) {
  return (
    <div ref={root} className="open-world-signs" hidden={hidden}>
      {signs.map((s) => {
        // L'objet d'une entraide, pas encore posé : son icône éteinte (la lanterne en verre mat), jamais sa lueur.
        const block = s.block ? (s.kind === 'entraide' ? entraideIcon(s.block) : BLOCKS[s.block]) : null;
        return (
          <button key={s.place} type="button" className={`open-world-sign${s.suggested ? ' suggested' : ''}`} data-lieu={s.place} aria-label={s.label} hidden onClick={() => onPick(s.place)}>
            {block ? <BlockIcon top={block.top} side={block.side} size={28} /> : <Icon name={getBiome(placeById(s.place).island)?.icon ?? 'history'} />}
          </button>
        );
      })}
    </div>
  );
}

/** La dernière place posée de chaque pastille. */
const signTransforms = new WeakMap<HTMLElement, string>();

/**
 * Ce que les pastilles évitent, relu par la page quand elle change de taille (jamais une mise en page par image) : les
 * boutons posés sur la scène et la colonne des accès directs (`obstacles`, ceux de la marque), et la marque elle-même,
 * là où elle vient d'être posée (`mark`).
 */
export interface SignArea {
  width: number;
  height: number;
  obstacles: readonly Obstacle[];
  mark: ScreenRect & { shown: boolean };
}

/** Le diamètre d'une pastille (openWorld.css), et l'écart gardé avec un bouton ou la marque. */
const SIGN_SIZE = 48;
const SIGN_GAP = 8;

const hits = (left: number, top: number, o: ScreenRect) => left < o.left + o.width && o.left < left + SIGN_SIZE && top < o.top + o.height && o.top < top + SIGN_SIZE;

/**
 * Le milieu d'une pastille, s'il doit bouger : à 844 × 390, celle d'un lieu hors champ mordait la marque du même lieu et
 * la colonne des boutons (consultant UX UI, avis sur les lots L2 et L3) ; elle se pose alors à côté, comme la marque
 * (juste sous la marque, puis `keepClear` : hors de la colonne, des boutons et de la marque), à `SIGN_GAP` pixels. `null` : sa place est libre
 * (le cas de chaque image, sans rien allouer).
 */
export function clearSign(x: number, y: number, area: SignArea): { x: number; y: number } | null {
  const [left, top] = [x - SIGN_SIZE / 2, y - SIGN_SIZE / 2];
  const m = area.mark;
  const markHit = m.shown && left < m.left + m.width + SIGN_GAP && m.left - SIGN_GAP < left + SIGN_SIZE && top < m.top + m.height + SIGN_GAP && m.top - SIGN_GAP < top + SIGN_SIZE;
  if (!markHit && !area.obstacles.some((o) => hits(left, top, o))) return null;
  // Sur la marque (celle du même lieu, au bord quand il est hors champ) : d'abord juste sous elle, à son bord gauche
  // (proposition du consultant UX UI) ; puis hors des boutons et de la colonne, comme la marque.
  const from = markHit ? { left: m.left, top: m.top + m.height + SIGN_GAP } : { left, top };
  const obstacles: Obstacle[] = m.shown ? [...area.obstacles, { left: m.left - SIGN_GAP, top: m.top - SIGN_GAP, width: m.width + 2 * SIGN_GAP, height: m.height + 2 * SIGN_GAP - 1 }] : [...area.obstacles];
  const r = keepClear({ ...from, width: SIGN_SIZE, height: SIGN_SIZE }, obstacles, area.width, area.height, SIGN_GAP, SIGN_GAP);
  return { x: r.left + SIGN_SIZE / 2, y: r.top + SIGN_SIZE / 2 };
}

/**
 * Pose les pastilles, image par image, sans passer par React : chacune au-dessus de son lieu quand il se voit, cachée
 * sinon ; à côté d'un bouton ou de la marque qu'elle toucherait (`area`).
 */
export function placeSigns(root: HTMLElement | null, signs: readonly SignOnScreen[], area?: SignArea): void {
  if (!root) return;
  for (const el of root.children) {
    if (!(el instanceof HTMLElement)) continue;
    const s = signs.find((x) => x.place === el.dataset.lieu);
    const shown = Boolean(s?.shown);
    if (el.hidden === shown) el.hidden = !shown;
    if (!s || !shown) continue;
    const moved = area ? clearSign(s.x, s.y, area) : null;
    const transform = `translate(${Math.round(moved?.x ?? s.x)}px, ${Math.round(moved?.y ?? s.y)}px)`;
    if (signTransforms.get(el) === transform) continue;
    signTransforms.set(el, transform);
    el.style.transform = transform;
  }
}
