import { Link } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { Syllabified } from '../components/Syllabified';
import { BLOCKS, type BiomeDef, type BiomeId, type BlockId } from './biomes';
import { useBlocland } from './BloclandContext';
import { InventoryLink } from './Inventory';
import { Foldable } from './IslandFold';
import type { PlanBuilder } from './usePlanBuilder';
import { BlockIcon } from './Voxel';
import { getPlan } from './world/plans';
import { earnIsland, whereToEarn } from './world/uses';

interface Props {
  biome: BiomeDef;
  builder: PlanBuilder;
  /** En 3D, on peut aussi toucher les cases bleues dans le monde. */
  in3d?: boolean;
  /** Dans le panneau 3D : la section se replie quand il n'y a rien à poser (la clé change avec l'île). */
  fold?: string;
}

/** « à gagner dans Forêt des sons » (un lien vers l'île), « ici, dans les quêtes », ou le coffre d'un plan. */
export function EarnLink({ block, here }: { block: BlockId; here?: BiomeId }) {
  const island = earnIsland(block);
  if (!island) return <>à gagner dans {whereToEarn(block)}</>;
  if (island.id === here) return <>à gagner ici, dans les quêtes</>;
  return (
    <>
      à gagner dans <Link to={`/aventure/${island.id}`}>{island.name}</Link>
    </>
  );
}

/** L'état du plan en une ligne, pour le pli replié. */
export function planSummary(builder: PlanBuilder, inventory: Partial<Record<BlockId, number>>): string {
  const { plan, status } = builder;
  if (!plan || !status) return '';
  if (status.complete) return builder.allDone ? 'Tous les plans sont construits' : 'Terminé';
  const missing = (Object.entries(status.missing) as [BlockId, number][]).filter(([, n]) => n > 0);
  const lacking = missing.filter(([b, n]) => (inventory[b] ?? 0) < n);
  const posed = `${status.done} / ${status.total} posés`;
  if (lacking.length === 0) return `${posed} · tu as tout : pose-les`;
  const [block, n] = lacking[0];
  return `${posed} · il manque ${n - (inventory[block] ?? 0)} ${BLOCKS[block].name.toLowerCase()}`;
}

/**
 * Le plan de l'île : avancement, blocs qu'il manque et où les gagner (un lien vers l'île), bouton « Poser le bloc
 * suivant », le lien vers « Mes blocs » et les bâtiments déjà terminés ici. Même contenu dans le panneau 3D et en vue simple.
 */
export function PlanSection({ biome, builder, in3d = false, fold }: Props) {
  const { state } = useBlocland();
  const { plan, status } = builder;
  const missing = status ? (Object.entries(status.missing) as [BlockId, number][]).filter(([, n]) => n > 0) : [];
  const built = state.village.journal.filter((e) => getPlan(e.plan)?.biome === biome.id);
  const heading = (
    <h3 id={`plan-${biome.id}`} className="island-sheet-heading">
      <Icon name="map" /> {plan ? `Plan ${builder.index} / ${builder.total} : ${plan.name}` : 'Aucun plan sur cette île'}
    </h3>
  );
  // Ouvert quand on peut poser un bloc, ou qu'un plan vient d'être fini (sa phrase et son coffre) ; replié sinon.
  const defaultOpen = builder.canFill || Boolean(status?.complete && !builder.allDone) || builder.notice !== null;
  return (
    <Foldable fold={fold} name="plan" heading={heading} status={planSummary(builder, state.inventory)} defaultOpen={defaultOpen}>
      <section className="plan-section" aria-labelledby={`plan-${biome.id}`}>
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
                          <strong>{n}</strong> {BLOCKS[block].name.toLowerCase()} · <EarnLink block={block} here={biome.id} />
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                {in3d && <p className="view-note">Touche une case bleue du bâtiment dans le monde, ou utilise le bouton.</p>}
                <button type="button" className="button primary" disabled={!builder.canFill} onClick={builder.fillNext}>
                  <Icon name="hammer" /> Poser le bloc suivant
                </button>
                <button type="button" className="button" disabled={!builder.canFill} onClick={builder.fillAll}>
                  <Icon name="blocks" /> Poser tout ce que j’ai
                </button>
              </>
            )}
          </>
        )}
        <p className="build-status" role="status" aria-live="polite">
          {builder.notice ?? ''}
        </p>
        <p className="island-inventory-link">
          <InventoryLink />
        </p>
        {built.length > 0 && (
          <p className="island-journal">
            <Icon name="flag" />
            {/* Un seul bloc de texte : le paragraphe est en flex, le point ne doit pas se détacher de la liste. */}
            <span>
              Terminé ici :{' '}
              {built
                .map((e) => `${getPlan(e.plan)?.name} (${new Date(e.day + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })})`)
                .join(', ')}
              .
            </span>
          </p>
        )}
      </section>
    </Foldable>
  );
}
