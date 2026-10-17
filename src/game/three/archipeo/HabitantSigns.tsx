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
import { placeById, type PlaceId } from '../../world/continu/plan6e';
import type { HabitantSign } from './remiseOf';
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
        const block = s.block ? BLOCKS[s.block] : null;
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

/** Pose les pastilles, image par image, sans passer par React : chacune au-dessus de son lieu quand il se voit, cachée sinon. */
export function placeSigns(root: HTMLElement | null, signs: readonly SignOnScreen[]): void {
  if (!root) return;
  for (const el of root.children) {
    if (!(el instanceof HTMLElement)) continue;
    const s = signs.find((x) => x.place === el.dataset.lieu);
    const shown = Boolean(s?.shown);
    if (el.hidden === shown) el.hidden = !shown;
    if (!s || !shown) continue;
    const transform = `translate(${Math.round(s.x)}px, ${Math.round(s.y)}px)`;
    if (signTransforms.get(el) === transform) continue;
    signTransforms.set(el, transform);
    el.style.transform = transform;
  }
}
