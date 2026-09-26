import { Icon } from '../components/Icon';
import { Syllabified } from '../components/Syllabified';
import { BIOMES, BLOCKS, type BiomeDef, type BlockId } from './biomes';
import { useBlocland } from './BloclandContext';
import { whereToEarn, type PlanBuilder } from './usePlanBuilder';
import { BlockIcon } from './Voxel';
import { getPlan } from './world/plans';

interface Props {
  biome: BiomeDef;
  builder: PlanBuilder;
  /** En 3D, on peut aussi toucher les cases bleues dans le monde. */
  in3d?: boolean;
}

/**
 * Le plan de l'île : avancement, blocs qu'il manque et où les gagner, bouton « Poser le bloc suivant »,
 * l'inventaire en lecture et les bâtiments déjà terminés ici. Même contenu dans le panneau 3D et en vue simple.
 */
export function PlanSection({ biome, builder, in3d = false }: Props) {
  const { state } = useBlocland();
  const { plan, status } = builder;
  const missing = status ? (Object.entries(status.missing) as [BlockId, number][]).filter(([, n]) => n > 0) : [];
  const owned = (Object.keys(BLOCKS) as BlockId[]).filter((b) => (state.inventory[b] ?? 0) > 0);
  const built = state.village.journal.filter((e) => getPlan(e.plan)?.biome === biome.id);
  // Des blocs en poche que ce plan ne demande pas : on dit où ils servent, pour ne pas croire à une panne.
  const elsewhere: [BlockId, string][] = owned
    .filter((b) => !missing.some(([m]) => m === b))
    .map((b) => {
      const home = BIOMES.find((x) => x.block === b);
      return [b, home ? `ils construisent sur ${home.name}` : 'ils servent à un plan suivant (kit de finition)'];
    });
  return (
    <section className="plan-section" aria-labelledby={`plan-${biome.id}`}>
      <h3 id={`plan-${biome.id}`} className="island-sheet-heading">
        <Icon name="map" /> {plan ? `Plan ${builder.index} / ${builder.total} : ${plan.name}` : 'Aucun plan sur cette île'}
      </h3>
      {plan && status && (
        <>
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
              <Icon name="star" /> Terminé ! <Syllabified text={plan.done} />
              {builder.allDone && ' Tous les plans de cette île sont construits.'}
            </p>
          ) : (
            <>
              {missing.length > 0 && (
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
              )}
              {in3d && <p className="view-note">Touche une case bleue du bâtiment dans le monde, ou utilise le bouton.</p>}
              <button type="button" className="button primary" disabled={!builder.canFill} onClick={builder.fillNext}>
                <Icon name="hammer" /> Poser le bloc suivant
              </button>
              {!builder.canFill && elsewhere.length > 0 && (
                <p className="plan-elsewhere">
                  {elsewhere.map(([b, where], i) => (
                    <span key={b}>
                      {i > 0 && ' '}
                      Tes {state.inventory[b]} {BLOCKS[b].name.toLowerCase()} ne se posent pas ici : {where}.
                    </span>
                  ))}
                </p>
              )}
            </>
          )}
        </>
      )}
      <p className="build-status" role="status" aria-live="polite">
        {builder.notice ?? ''}
      </p>
      <p className="island-inventory" aria-label="Mes blocs">
        <Icon name="blocks" /> Mes blocs :{' '}
        {owned.length === 0
          ? 'aucun. Fais une quête pour en gagner.'
          : owned.map((b) => (
              <span key={b} className="island-owned">
                <BlockIcon top={BLOCKS[b].top} side={BLOCKS[b].side} size={22} /> {state.inventory[b]} {BLOCKS[b].name.toLowerCase()}
              </span>
            ))}
      </p>
      {built.length > 0 && (
        <p className="island-journal">
          <Icon name="flag" /> Terminé ici :{' '}
          {built.map((e, i) => (
            <span key={`${e.day}-${e.plan}-${i}`}>
              {i > 0 && ', '}
              {getPlan(e.plan)?.name} ({new Date(e.day + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })})
            </span>
          ))}
          .
        </p>
      )}
    </section>
  );
}
