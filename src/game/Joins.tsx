// La construction qui réunit deux lieux (GD-9, point 10) : un panneau dans le monde en 3D, une page en vue simple, comme
// un monument ; et sa ligne dans le panneau de chacun des deux lieux, d'où elle se pose. Son nom vient de l'univers
// (« La digue », « La jetée ») ; les mots des gestes sont communs.
import { thePlace } from './world/placeArticle';
import { Link } from 'react-router-dom';
import { Icon, IconButton } from '../components/Icon';
import { SpeakButton } from '../components/SpeakButton';
import { Syllabified } from '../components/Syllabified';
import { BLOCKS, blockName, getBiome, type BiomeId, type BlockId } from './biomes';
import { useBlocland } from './BloclandContext';
import { planStatus } from './engine';
import { InventoryLink } from './Inventory';
import { lackingLine } from './Monuments';
import { EarnLink } from './PlanSection';
import { BlockIcon } from './Voxel';
import { Sheet } from './Sheet';
import type { BigBuilder } from './useMonumentBuilder';
import { joinOf, type JoinDef } from './world/join';
import { useTextes } from '../universes';

const nomDuLieu = (id: BiomeId) => getBiome(id)?.name ?? id;

/** L'adresse de la construction qui réunit (un panneau dans le monde, une page en vue simple). */
function joinPath(j: JoinDef): string {
  return `/adventure/${j.id}`;
}

/** Les mots de la construction dans l'univers : son nom, ce qu'elle est. */
function useMots(j: JoinDef): { nom: string; description: string } {
  const r = useTextes().reunion;
  return { nom: r?.nom ?? j.name, description: r?.description ?? 'Une construction entre les deux lieux : on passe de l’un à l’autre à pied.' };
}

/** « A ⋈ B » : les deux lieux réunis, en signes (GD-9, piste A) ; « Entre A et B » pour les lecteurs d'écran. */
function SousTitre({ j }: { j: JoinDef }) {
  return (
    <>
      <span className="visually-hidden">{`Entre ${thePlace(nomDuLieu(j.pair[0]))} et ${thePlace(nomDuLieu(j.pair[1]))}`}</span>
      <span aria-hidden="true">
        {nomDuLieu(j.pair[0])}{' '}
        <span className="signe">
          <Icon name="reunir" />
        </span>{' '}
        {nomDuLieu(j.pair[1])}
      </span>
    </>
  );
}

/** Ce qu'elle est, son avancement, les blocs qu'il manque et où les gagner, les deux boutons. */
function JoinBody({ builder }: { builder: BigBuilder<JoinDef> }) {
  const { state } = useBlocland();
  const { plan, status } = builder;
  const { description } = useMots(plan);
  const missing = (Object.entries(status.missing) as [BlockId, number][]).filter(([, n]) => n > 0);
  return (
    <div className="monument">
      <p className="island-sheet-says">
        <Syllabified text={description} />
        <SpeakButton text={description} label="Écouter" compact />
      </p>
      <section className="plan-section" aria-labelledby={`reunion-avancement-${plan.id}`}>
        <h3 id={`reunion-avancement-${plan.id}`} className="island-sheet-heading">
          <Icon name="reunir" /> Le chantier
        </h3>
        <div
          className="plan-track"
          role="progressbar"
          aria-label="Avancement"
          aria-valuemin={0}
          aria-valuemax={status.total}
          aria-valuenow={status.done}
          aria-valuetext={`${status.done} blocs posés sur ${status.total}`}
        >
          <div className="plan-fill" style={{ width: `${Math.round((status.done / status.total) * 100)}%` }} />
        </div>
        <p className="plan-count">
          <strong>{status.done}</strong>/{status.total} · +{plan.reward.xp} XP
        </p>
        {status.complete ? (
          <p className="plan-done">
            <Icon name="star" /> Terminé !
          </p>
        ) : (
          <>
            {!builder.canFill && (
              <p className="monument-lacking">
                <Icon name="blocks" /> <Syllabified text={lackingLine(missing, state.stock)} />
              </p>
            )}
            <details className="sheet-more monument-blocks">
              <summary>Les blocs qu’il faut</summary>
              <ul className="plan-missing" aria-label="Blocs qu’il manque">
                {missing.map(([block, n]) => {
                  const have = state.stock[block] ?? 0;
                  return (
                    <li key={block}>
                      <BlockIcon top={BLOCKS[block].top} side={BLOCKS[block].side} size={28} />
                      <span>
                        <strong>{n}</strong> {blockName(block, n)}{' '}
                        {have >= n ? (
                          <span className="signe">
                            <Icon name="check" />
                            <span className="visually-hidden">tu les as</span>
                          </span>
                        ) : (
                          <>
                            <span className="visually-hidden">tu en as </span>
                            {have}/{n} <EarnLink block={block} />
                          </>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </details>
            {/* Un seul bouton nommé, « Poser » (le bloc suivant) ; « Poser tout ce que j'ai » en icône. */}
            <button type="button" className="button primary" aria-label="Poser le bloc suivant" disabled={!builder.canFill} onClick={builder.fillNext}>
              <Icon name="hammer" /> Poser
            </button>
            <IconButton icone="blocks" nom="Poser tout ce que j’ai" mot="Tout poser" disabled={!builder.canFill} onClick={builder.fillAll} />
          </>
        )}
      </section>
      <p className="build-status" role="status" aria-live="polite">
        {builder.notice ?? ''}
      </p>
      <p className="island-inventory-link">
        <InventoryLink />
      </p>
    </div>
  );
}

/** Le panneau de la construction qui réunit, qui glisse depuis le bas du monde. */
export function JoinSheet({ builder, onClose }: { builder: BigBuilder<JoinDef>; onClose: () => void }) {
  const j = builder.plan;
  const { nom } = useMots(j);
  return (
    <Sheet id="panneau-reunion" className={`monument-sheet biome-${j.biome}`} titleId="reunion-titre" icon="reunir" title={nom} subtitle={<SousTitre j={j} />} onClose={onClose}>
      <JoinBody builder={builder} />
    </Sheet>
  );
}

/** La construction qui réunit, en vue simple : une page. */
export function JoinPage({ builder }: { builder: BigBuilder<JoinDef> }) {
  const j = builder.plan;
  const { nom } = useMots(j);
  return (
    <>
      <Link to={`/adventure/${j.pair[0]}`} className="back-link">
        <Icon name="back" /> {nomDuLieu(j.pair[0])}
      </Link>
      <h1 className="page-title">
        <Icon name="reunir" /> {nom}
      </h1>
      <p className="section-intro">
        <SousTitre j={j} />
      </p>
      <JoinBody builder={builder} />
    </>
  );
}

/** Dans le panneau d'un lieu réuni : la ligne de la construction qui le réunit à l'autre, et son avancement. */
export function JoinLine({ island }: { island: BiomeId }) {
  const { state } = useBlocland();
  const j = joinOf(island);
  const textes = useTextes();
  if (!j) return null;
  const s = planStatus(state, j.plan);
  const autre = j.pair[0] === island ? j.pair[1] : j.pair[0];
  return (
    <ul className="island-quests island-reunion" aria-label="Réunion">
      <li>
        <Link to={joinPath(j.plan)} className="island-quest">
          <span className="island-quest-icon">
            <Icon name={s.complete ? 'star' : 'reunir'} />
          </span>
          <span className="island-quest-text">
            <span className="island-quest-title">
              {textes.reunion?.nom ?? j.plan.name} avec {nomDuLieu(autre)}
            </span>
            {/* Fini : l'étoile suffit ; sinon l'avancement en chiffres. */}
            {!s.complete && (
              <span className="island-quest-desc">
                {s.done}/{s.total}
                <span className="visually-hidden"> blocs posés</span>
              </span>
            )}
          </span>
        </Link>
      </li>
    </ul>
  );
}
