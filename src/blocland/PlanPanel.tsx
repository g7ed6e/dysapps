import { Icon } from '../components/Icon';
import { BIOMES, BLOCKS, type BlockId } from './biomes';
import type { PlanStatus } from './engine';
import { BlockIcon } from './Voxel';
import type { PlanDef } from './world/plans';

interface Props {
  plan: PlanDef;
  status: PlanStatus;
  /** Tous les plans de l'île sont terminés. */
  allDone?: boolean;
  /** Numéro du plan sur l'île et nombre total. */
  index: number;
  total: number;
  /** Peut-on poser un bloc maintenant (inventaire) ? */
  canFill: boolean;
  onFillNext: () => void;
}

/** Où gagner un type de bloc : le biome dont c'est la ressource. */
export function whereToEarn(block: BlockId): string {
  const biome = BIOMES.find((b) => b.block === block);
  return biome ? biome.name : 'le coffre du plan précédent (ou un coffre de régularité)';
}

/** Le plan en cours d'une île : nom, avancement, blocs qu'il manque et où les gagner. */
export function PlanPanel({ plan, status, allDone = false, index, total, canFill, onFillNext }: Props) {
  const missing = (Object.entries(status.missing) as [BlockId, number][]).filter(([, n]) => n > 0);
  return (
    <section className="panel plan-panel" aria-labelledby={`plan-${plan.id}`}>
      <h2 id={`plan-${plan.id}`} className="section-title plan-title">
        <Icon name="map" /> Plan {index} / {total} : {plan.name}
      </h2>
      <div
        className="plan-track"
        role="progressbar"
        aria-label={`Avancement du plan ${plan.name}`}
        aria-valuemin={0}
        aria-valuemax={status.total}
        aria-valuenow={status.done}
        aria-valuetext={`${status.done} blocs posés sur ${status.total}`}
      >
        <div className="plan-fill" style={{ width: `${Math.round((status.done / status.total) * 100)}%` }} />
      </div>
      <p className="plan-count">
        <strong>{status.done}</strong> / {status.total} blocs posés
      </p>
      {status.complete ? (
        <p className="plan-done">
          <Icon name="star" /> Terminé ! {plan.done}
          {allDone && ' Tous les plans de cette île sont construits.'}
        </p>
      ) : (
        <>
          <ul className="plan-missing" aria-label="Blocs qu’il manque">
            {missing.map(([block, n]) => (
              <li key={block}>
                <BlockIcon top={BLOCKS[block].top} side={BLOCKS[block].side} size={28} />
                <span>
                  <strong>{n}</strong> {BLOCKS[block].name.toLowerCase()} · à gagner dans {whereToEarn(block)}
                </span>
              </li>
            ))}
          </ul>
          <p className="view-note">Touche une case transparente du plan pour y poser le bon bloc, ou utilise le bouton.</p>
          <button type="button" className="button primary" disabled={!canFill} onClick={onFillNext}>
            <Icon name="hammer" /> Poser le bloc suivant
          </button>
        </>
      )}
    </section>
  );
}
