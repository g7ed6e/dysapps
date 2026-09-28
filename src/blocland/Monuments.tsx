// Les monuments : de grands ouvrages classés, deux par archipel, chacun sur son îlot au large (l'observatoire des
// baleines…). Ils emploient les blocs qui s'accumulent une fois les bâtiments finis. Dans le monde (3D, 2D) : un panneau
// par monument et un panneau de la liste ; en vue simple : des pages. Le même contenu.
import { Link } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { SpeakButton } from '../components/SpeakButton';
import { Syllabified } from '../components/Syllabified';
import { BLOCKS, blockName, getBiome, type BlockId } from './biomes';
import { useBlocland } from './BloclandContext';
import { planStatus } from './engine';
import { InventoryLink } from './Inventory';
import { EarnLink } from './PlanSection';
import type { MonumentBuilder } from './useMonumentBuilder';
import { BlockIcon } from './Voxel';
import { ARCHIPELAGOS, archipelagoTitle, getArchipelago, isArchipelagoReached } from './world/archipelago';
import { MONUMENTS, monumentsOf, type MonumentDef } from './world/monuments';

export const MONUMENTS_TITLE = 'Monuments';
/** L'adresse de la liste des monuments (un panneau dans le monde, une page en vue simple). */
export const MONUMENTS_PATH = '/aventure/monuments';

export function monumentPath(m: MonumentDef): string {
  return `/aventure/${m.id}`;
}

/** Le monument est-il ouvert (son archipel atteint) ? */
export function useMonumentOpen(m: MonumentDef): boolean {
  const { state } = useBlocland();
  return isArchipelagoReached(m.archipelago, state.village.bridges);
}

/** Le contenu d'un monument : ce que c'est, son avancement, les blocs qu'il manque et où les gagner, les boutons. */
export function MonumentBody({ builder }: { builder: MonumentBuilder }) {
  const { state } = useBlocland();
  const { monument, status } = builder;
  const open = useMonumentOpen(monument);
  const missing = (Object.entries(status.missing) as [BlockId, number][]).filter(([, n]) => n > 0);
  return (
    <div className="monument">
      <p className="island-sheet-says">
        <Syllabified text={monument.description} />
        <SpeakButton text={monument.description} label="Écouter" compact />
      </p>
      {!open ? (
        <p className="plan-done">
          <Icon name="lock" /> Archipel fermé : rejoins d’abord les {getArchipelago(monument.archipelago).name} avec le Bloc-Navire.
        </p>
      ) : (
        <section className="plan-section" aria-labelledby={`monument-avancement-${monument.id}`}>
          <h3 id={`monument-avancement-${monument.id}`} className="island-sheet-heading">
            <Icon name="castle" /> Le chantier
          </h3>
          <div
            className="plan-track"
            role="progressbar"
            aria-label={`Avancement du monument ${monument.name}`}
            aria-valuemin={0}
            aria-valuemax={status.total}
            aria-valuenow={status.done}
            aria-valuetext={`${status.done} blocs posés sur ${status.total}`}
          >
            <div className="plan-fill" style={{ width: `${Math.round((status.done / status.total) * 100)}%` }} />
          </div>
          <p className="plan-count">
            <strong>{status.done}</strong> / {status.total} blocs posés · +{monument.reward.xp} XP à la fin
          </p>
          {status.complete ? (
            <p className="plan-done">
              <Icon name="star" /> Terminé ! <Syllabified text={monument.done} />
            </p>
          ) : (
            <>
              <ul className="plan-missing" aria-label="Blocs qu’il manque">
                {missing.map(([block, n]) => {
                  const have = state.inventory[block] ?? 0;
                  return (
                    <li key={block}>
                      <BlockIcon top={BLOCKS[block].top} side={BLOCKS[block].side} size={28} />
                      <span>
                        <strong>{n}</strong> {blockName(block, n)}
                        {have >= n ? ' · tu les as' : <> · tu en as {have}, <EarnLink block={block} /></>}
                      </span>
                    </li>
                  );
                })}
              </ul>
              <button type="button" className="button primary" disabled={!builder.canFill} onClick={builder.fillNext}>
                <Icon name="hammer" /> Poser le bloc suivant
              </button>
              <button type="button" className="button" disabled={!builder.canFill} onClick={builder.fillAll}>
                <Icon name="blocks" /> Poser tout ce que j’ai
              </button>
            </>
          )}
        </section>
      )}
      <p className="build-status" role="status" aria-live="polite">
        {builder.notice ?? ''}
      </p>
      <p className="island-inventory-link">
        <InventoryLink /> · <Link to={MONUMENTS_PATH}>Tous les monuments</Link>
      </p>
    </div>
  );
}

function subtitle(m: MonumentDef): string {
  return `Monument des ${getArchipelago(m.archipelago).name}, au large de ${getBiome(m.biome)?.name ?? m.biome}`;
}

/** Le panneau d'un monument, qui glisse depuis le bas du monde (comme celui d'une île). */
export function MonumentSheet({ builder, onClose }: { builder: MonumentBuilder; onClose: () => void }) {
  const m = builder.monument;
  return (
    <section id="panneau-monument" className={`island-sheet monument-sheet biome-${m.biome}`} role="dialog" aria-labelledby="monument-titre" aria-modal="false">
      <div className="island-sheet-head">
        <div className="island-sheet-titles">
          <h2 id="monument-titre" className="island-sheet-title">
            <Icon name="castle" /> {m.name}
          </h2>
          <p className="island-sheet-module">{subtitle(m)}</p>
        </div>
        <button type="button" className="icon-button island-sheet-close" aria-label="Fermer le panneau" onClick={onClose}>
          <Icon name="close" />
        </button>
      </div>
      <MonumentBody builder={builder} />
    </section>
  );
}

/** Un monument en vue simple : une page. */
export function MonumentPage({ builder }: { builder: MonumentBuilder }) {
  const m = builder.monument;
  return (
    <>
      <Link to={MONUMENTS_PATH} className="back-link">
        <Icon name="back" /> {MONUMENTS_TITLE}
      </Link>
      <h1 className="page-title">
        <Icon name="castle" /> {m.name}
      </h1>
      <p className="section-intro">{subtitle(m)}.</p>
      <MonumentBody builder={builder} />
    </>
  );
}

const INTRO =
  'Des blocs en trop ? Construis les monuments : deux par archipel, chacun sur son îlot au large. Ils demandent les blocs de plusieurs îles. Un monument fini rapporte de l’XP, et le premier, le succès Patrimoine.';

/** La liste des monuments, par archipel : leur avancement, ou l'archipel à rejoindre. */
export function MonumentsList() {
  const { state } = useBlocland();
  return (
    <div className="monuments">
      <p className="section-intro">
        <Syllabified text={INTRO} />
      </p>
      {ARCHIPELAGOS.map((a) => {
        const reached = isArchipelagoReached(a.classe, state.village.bridges);
        return (
          <section key={a.classe} aria-labelledby={`monuments-${a.classe}`}>
            <h3 id={`monuments-${a.classe}`} className="island-sheet-heading">
              <Icon name="map" /> {archipelagoTitle(a.classe)}
            </h3>
            <ul className="island-quests">
              {monumentsOf(a.classe).map((m) => {
                const s = planStatus(state, m);
                const state_ = !reached ? 'Archipel fermé' : s.complete ? 'Terminé' : `${s.done} / ${s.total} blocs posés`;
                return (
                  <li key={m.id}>
                    <Link to={monumentPath(m)} className={`island-quest${reached ? '' : ' locked'}`}>
                      <span className="island-quest-icon">
                        <Icon name={!reached ? 'lock' : s.complete ? 'star' : 'castle'} />
                      </span>
                      <span className="island-quest-text">
                        <span className="island-quest-title">{m.name}</span>
                        <span className="island-quest-desc">{state_}</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

export function MonumentsSheet({ onClose }: { onClose: () => void }) {
  return (
    <section id="panneau-monuments" className="island-sheet monuments-sheet" role="dialog" aria-labelledby="monuments-titre" aria-modal="false">
      <div className="island-sheet-head">
        <div className="island-sheet-titles">
          <h2 id="monuments-titre" className="island-sheet-title">
            <Icon name="castle" /> {MONUMENTS_TITLE}
          </h2>
          <p className="island-sheet-module">{MONUMENTS.length} monuments, deux par archipel</p>
        </div>
        <button type="button" className="icon-button island-sheet-close" aria-label="Fermer le panneau" onClick={onClose}>
          <Icon name="close" />
        </button>
      </div>
      <MonumentsList />
    </section>
  );
}

export function MonumentsPage() {
  return (
    <>
      <Link to="/aventure" className="back-link">
        <Icon name="back" /> Archipéo
      </Link>
      <h1 className="page-title">
        <Icon name="castle" /> {MONUMENTS_TITLE}
      </h1>
      <MonumentsList />
    </>
  );
}
