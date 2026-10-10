import { useEffect, useRef } from 'react';
import { Icon } from '../components/Icon';
import { Syllabified } from '../components/Syllabified';
import { BLOCKS, blockCount, blockName, type BiomeDef, type BlockId } from './biomes';
import { useBlocland } from './BloclandContext';
import { Foldable } from './IslandFold';
import { EarnLink } from './PlanSection';
import type { VehicleBuilder } from './useVehicleBuilder';
import { BlockIcon } from './Voxel';
import { ARCHIPELAGOS, archipelagoOf, getArchipelago, reachedArchipelagos, type ArchipelagoId } from './world/archipelago';
import { VEHICLE_NAME, VEHICLE_STAGES, beatenGuardians, stageAt } from './world/vehicle';
import { useTextes, type TextesUnivers } from '../universes';

interface Props {
  biome: BiomeDef;
  builder: VehicleBuilder;
  /** En 3D, on peut aussi toucher les cases transparentes du navire au quai. */
  in3d?: boolean;
  /** Embarquer vers un archipel (le suivant, ou un archipel déjà atteint pour y revenir). */
  onBoard: (to: ArchipelagoId, back: boolean) => void;
  /** Le navire vient d'être touché dans le monde : la section vient sous les yeux. */
  highlight?: boolean;
  /** Dans le panneau 3D : la section se replie quand il n'y a rien à faire (la clé change avec l'île). */
  fold?: string;
}

const cap = (text: string) => `${text.charAt(0).toUpperCase()}${text.slice(1)}`;

/** L'état du chantier en une ligne, pour le pli replié. */
export function shipSummary(builder: VehicleBuilder, inventory: Partial<Record<BlockId, number>>, textes: TextesUnivers): string {
  const { stage, status, launch } = builder;
  if (!stage || !status) return 'Voyage déjà fait';
  if (launch?.ok) return 'Prêt : embarque !';
  const posed = `${status.done} / ${status.total} posés`;
  if (launch && !launch.ok && launch.reason === 'gardiens') return `${posed} · ${textes.libelles.encoreAFaire(launch.missing)}`;
  const missing = (Object.entries(status.missing) as [BlockId, number][]).filter(([, n]) => n > 0);
  const lacking = missing.filter(([b, n]) => (inventory[b] ?? 0) < n);
  if (lacking.length === 0) return `${posed} · tu as tout : pose-les`;
  const [block, n] = lacking[0];
  return `${posed} · il manque ${blockCount(block, n - (inventory[block] ?? 0))}`;
}

/**
 * La Nef, sur une île-port : l'étape en chantier (avancement, blocs qu'il manque et où les gagner, Gardiens à
 * vaincre pour le kit, bouton « Poser le bloc suivant »), le bouton « Embarquer » quand tout est prêt, et les boutons
 * pour revenir sur un archipel déjà atteint. Même contenu dans le panneau 3D et en vue simple.
 */
export function ShipSection({ biome, builder, in3d = false, onBoard, highlight = false, fold }: Props) {
  const { state } = useBlocland();
  const textes = useTextes();
  const section = useRef<HTMLElement>(null);
  useEffect(() => {
    if (highlight) section.current?.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
  }, [highlight, biome.id]);
  const here = stageAt(biome.id);
  if (!here) return null;
  const current = archipelagoOf(biome.id);
  const { stage, status, launch } = builder;
  const reached = reachedArchipelagos(state.world.links).filter((a) => a.classe !== current.classe);
  const missing = status ? (Object.entries(status.missing) as [BlockId, number][]).filter(([, n]) => n > 0) : [];
  const next = getArchipelago(here.to);
  const ready = Boolean(launch?.ok);
  const waiting = launch && !launch.ok && launch.reason === 'gardiens' ? launch : null;
  const departed = !stage && state.world.links.includes(`passage-${here.to}`);
  const complete = departed && here.stage === VEHICLE_STAGES.length;
  const heading = (
    <h3 id={`navire-${biome.id}`} className="island-sheet-heading">
      <Icon name="ship" /> {cap(VEHICLE_NAME)} — Étape {here.stage} / {VEHICLE_STAGES.length} : {here.name}
    </h3>
  );
  // Ouvert quand on peut poser, embarquer, ou que le navire vient d'être touché dans le monde ; replié sinon.
  const defaultOpen = builder.canFill || ready || highlight || builder.notice !== null;
  return (
    <Foldable fold={fold} name="navire" heading={heading} status={shipSummary(builder, state.stock, textes)} defaultOpen={defaultOpen}>
      <section
        ref={section}
        className={`plan-section ship-section${ready ? ' ship-ready' : ''}${highlight ? ' bridge-highlight' : ''}`}
        aria-labelledby={`navire-${biome.id}`}
      >
        {stage && status && (
          <>
            <p className="ship-purpose">
              <Syllabified text={`Quand elle est prête, elle t’emmène dans les ${textes.archipels[next.classe]}, l’archipel de ${next.classe}.`} />
            </p>
            <div
              className="plan-track"
              role="progressbar"
              aria-label={`Avancement de la Nef`}
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
            {missing.length > 0 && (
              <ul className="plan-missing" aria-label="Blocs qu’il manque à la Nef">
                {missing.map(([block, n]) => (
                  <li key={block}>
                    <BlockIcon top={BLOCKS[block].top} side={BLOCKS[block].side} size={28} />
                    <span>
                      <strong>{n}</strong> {blockName(block, n)} · <EarnLink block={block} here={biome.id} />
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <p className="ship-guardians">
              <Icon name="flame" /> <Syllabified text={textes.libelles.navireGardiens(beatenGuardians(stage.from, state.progress), stage.guardians, textes.archipels[stage.from], stage.short)} />
            </p>
            {!status.complete && (
              <>
                {in3d && <p className="view-note">Touche une case transparente de la Nef, au quai, ou utilise le bouton.</p>}
                <button type="button" className="button primary" disabled={!builder.canFill} onClick={builder.fillNext}>
                  <Icon name="hammer" /> Poser le bloc suivant
                </button>
                <button type="button" className="button" disabled={!builder.canFill} onClick={builder.fillAll}>
                  <Icon name="blocks" /> Poser tout ce que j’ai
                </button>
              </>
            )}
            {status.complete && waiting && (
              <p className="ship-wait">
                <Syllabified
                  text={textes.libelles.navireAttend(waiting.missing)}
                />
              </p>
            )}
            {ready && (
              <button type="button" className="button primary ship-board" onClick={() => onBoard(here.to, false)}>
                <Icon name="ship" /> Embarquer vers l’archipel de {next.classe} — Les {textes.archipels[next.classe]}
              </button>
            )}
          </>
        )}
        {departed && (
          <p className="ship-purpose">
            <Syllabified
              text={
                complete
                  ? 'La Nef a pris ses trois formes : voilier, dirigeable, fusée. Elle te porte où tu veux.'
                  : `La Nef a déjà fait ce voyage. ${here.stage < VEHICLE_STAGES.length ? `Sa prochaine étape se construit au port des ${textes.archipels[here.to]}.` : ''}`
              }
            />
          </p>
        )}
        <p className="build-status" role="status" aria-live="polite">
          {builder.notice ?? ''}
        </p>
        {reached.length > 0 && (
          <ul className="ship-returns" aria-label="Voyager avec la Nef">
            {reached.map((a) => {
              const forward = ARCHIPELAGOS.indexOf(a) > ARCHIPELAGOS.indexOf(current);
              return (
                <li key={a.classe}>
                  <button type="button" className="button" onClick={() => onBoard(a.classe, true)}>
                    <Icon name="ship" /> {forward ? 'Repartir vers' : 'Revenir en'} {a.classe} — Les {textes.archipels[a.classe]}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </Foldable>
  );
}
