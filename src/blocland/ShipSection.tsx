import { Icon } from '../components/Icon';
import { Syllabified } from '../components/Syllabified';
import { BLOCKS, type BiomeDef, type BlockId } from './biomes';
import { useBlocland } from './BloclandContext';
import { whereToEarn } from './usePlanBuilder';
import type { VehicleBuilder } from './useVehicleBuilder';
import { BlockIcon } from './Voxel';
import { ARCHIPELAGOS, archipelagoOf, getArchipelago, reachedArchipelagos, type ArchipelagoId } from './world/archipelago';
import { VEHICLE_NAME, VEHICLE_STAGES, guardiansText, stageAt } from './world/vehicle';

interface Props {
  biome: BiomeDef;
  builder: VehicleBuilder;
  /** En 3D, on peut aussi toucher les cases bleues du navire au quai. */
  in3d?: boolean;
  /** Embarquer vers un archipel (le suivant, ou un archipel déjà atteint pour y revenir). */
  onBoard: (to: ArchipelagoId, back: boolean) => void;
}

const cap = (text: string) => `${text.charAt(0).toUpperCase()}${text.slice(1)}`;

/**
 * Le Bloc-Navire, sur une île-port : l'étape en chantier (avancement, blocs qu'il manque et où les gagner, Gardiens à
 * vaincre pour le kit, bouton « Poser le bloc suivant »), le bouton « Embarquer » quand tout est prêt, et les boutons
 * pour revenir sur un archipel déjà atteint. Même contenu dans le panneau 3D et en vue simple.
 */
export function ShipSection({ biome, builder, in3d = false, onBoard }: Props) {
  const { state } = useBlocland();
  const here = stageAt(biome.id);
  if (!here) return null;
  const current = archipelagoOf(biome.id);
  const { stage, status, launch } = builder;
  const reached = reachedArchipelagos(state.village.bridges).filter((a) => a.classe !== current.classe);
  const missing = status ? (Object.entries(status.missing) as [BlockId, number][]).filter(([, n]) => n > 0) : [];
  const next = getArchipelago(here.to);
  const ready = Boolean(launch?.ok);
  const waiting = launch && !launch.ok && launch.reason === 'gardiens' ? launch : null;
  const departed = !stage && state.village.bridges.includes(`voyage-${here.to}`);
  const complete = departed && here.stage === VEHICLE_STAGES.length;
  return (
    <section className={`plan-section ship-section${ready ? ' ship-ready' : ''}`} aria-labelledby={`navire-${biome.id}`}>
      <h3 id={`navire-${biome.id}`} className="island-sheet-heading">
        <Icon name="ship" /> {cap(VEHICLE_NAME)} — Étape {here.stage} / {VEHICLE_STAGES.length} : {here.name}
      </h3>
      {stage && status && (
        <>
          <p className="ship-purpose">
            <Syllabified text={`Quand il est prêt, il t’emmène dans les ${next.name}, l’archipel de ${next.classe}.`} />
          </p>
          <div
            className="plan-track"
            role="progressbar"
            aria-label={`Avancement du Bloc-Navire`}
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
            <ul className="plan-missing" aria-label="Blocs qu’il manque au Bloc-Navire">
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
          <p className="ship-guardians">
            <Icon name="shield" /> <Syllabified text={guardiansText(stage, state.progress)} />
          </p>
          {!status.complete && (
            <>
              {in3d && <p className="view-note">Touche une case bleue du Bloc-Navire, au quai, ou utilise le bouton.</p>}
              <button type="button" className="button primary" disabled={!builder.canFill} onClick={builder.fillNext}>
                <Icon name="hammer" /> Poser le bloc suivant
              </button>
            </>
          )}
          {status.complete && waiting && (
            <p className="ship-wait">
              <Syllabified text={`Le Bloc-Navire a tous ses blocs ! Il attend encore ${waiting.missing} Gardien${waiting.missing > 1 ? 's' : ''} vaincu${waiting.missing > 1 ? 's' : ''}.`} />
            </p>
          )}
          {ready && (
            <button type="button" className="button primary ship-board" onClick={() => onBoard(here.to, false)}>
              <Icon name="ship" /> Embarquer vers l’archipel de {next.classe} — Les {next.name}
            </button>
          )}
        </>
      )}
      {departed && (
        <p className="ship-purpose">
          <Syllabified
            text={
              complete
                ? 'Le Bloc-Navire est complet : voile, ballon, réacteur. Il te porte où tu veux.'
                : `Le Bloc-Navire a déjà fait ce voyage. ${here.stage < VEHICLE_STAGES.length ? `Sa prochaine étape se construit au port des ${getArchipelago(here.to).name}.` : ''}`
            }
          />
        </p>
      )}
      <p className="build-status" role="status" aria-live="polite">
        {builder.notice ?? ''}
      </p>
      {reached.length > 0 && (
        <ul className="ship-returns" aria-label="Voyager avec le Bloc-Navire">
          {reached.map((a) => {
            const forward = ARCHIPELAGOS.indexOf(a) > ARCHIPELAGOS.indexOf(current);
            return (
              <li key={a.classe}>
                <button type="button" className="button" onClick={() => onBoard(a.classe, true)}>
                  <Icon name="ship" /> {forward ? 'Repartir vers' : 'Revenir en'} {a.classe} — Les {a.name}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
