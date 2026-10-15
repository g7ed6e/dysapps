// Les monuments : de grands ouvrages classés, deux par archipel, chacun sur son îlot au large (l'observatoire des
// baleines…). Ils emploient les blocs qui s'accumulent une fois les bâtiments finis. Dans le monde en 3D : un panneau
// par monument et un panneau de la liste ; en vue simple : des pages. Le même contenu.
import { ofPlace } from './world/placeArticle';
import { Link } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { SpeakButton } from '../components/SpeakButton';
import { Syllabified } from '../components/Syllabified';
import { frenchTypography } from '../core/typography';
import { BLOCKS, blockCount, blockName, getBiome, type BlockId } from './biomes';
import { useBlocland } from './BloclandContext';
import { planStatus } from './engine';
import { InventoryLink } from './Inventory';
import { EarnLink } from './PlanSection';
import { ASSEMBLAGE_PATH } from './world/assembly';
import { firstSentences } from './firstSentences';
import type { MonumentBuilder } from './useMonumentBuilder';
import { BlockIcon } from './Voxel';
import { ARCHIPELAGOS, archipelagoTitle, isArchipelagoReached, type NomsArchipels } from './world/archipelago';
import { MONUMENTS, monumentsOf, type MonumentDef } from './world/monuments';
import { useUnivers } from '../core/SettingsContext';
import { UNIVERS } from '../core/universe';
import { texteDuMonument, useTextes } from '../universes';
import { Sheet } from './Sheet';
import { ProjectPanel } from './ProjectPanel';
import { piecesBuilt, projectOf } from './world/projects';

export const MONUMENTS_TITLE = 'Monuments';
/** L'adresse de la liste des monuments (un panneau dans le monde, une page en vue simple). */
export const MONUMENTS_PATH = '/adventure/landmarks';

function monumentPath(m: MonumentDef): string {
  return `/adventure/${m.id}`;
}

/** Le monument est-il ouvert (son archipel atteint) ? */
function useMonumentOpen(m: MonumentDef): boolean {
  const { state } = useBlocland();
  return isArchipelagoReached(m.archipelago, state.world.links);
}

/** Le contenu d'un monument : ce que c'est, son avancement, les blocs qu'il manque et où les gagner, les boutons. */
function MonumentBody({ builder }: { builder: MonumentBuilder }) {
  const { state } = useBlocland();
  const { monument, status } = builder;
  const open = useMonumentOpen(monument);
  // Les blocs assemblés d'abord : ce sont eux qu'il faut aller faire à la Fabrique (relecture UX UI).
  const missing = (Object.entries(status.missing) as [BlockId, number][])
    .filter(([, n]) => n > 0)
    .sort(([a], [b]) => Number(Boolean(BLOCKS[b].assemble)) - Number(Boolean(BLOCKS[a].assemble)));
  // Plus rien à poser, et seules des cases de blocs assemblés attendent : la ligne dit d'aller les assembler.
  const manquants = missing.filter(([b]) => (state.stock[b] ?? 0) < 1);
  const aAssembler = !builder.canFill && manquants.length > 0 && manquants.every(([b]) => BLOCKS[b].assemble) ? manquants[0] : undefined;
  const textes = useTextes();
  const lieu = textes.assemblage;
  const texte = texteDuMonument(textes, monument);
  const said = firstSentences(texte.description);
  // Un grand projet (GD-10) se construit pièce par pièce, pas case par case.
  const project = projectOf(monument.id);
  return (
    <div className="monument">
      <p className="island-sheet-says">
        <Syllabified text={said.first} />
        <SpeakButton text={texte.description} label="Écouter" compact />
      </p>
      {said.rest && (
        // Une phrase visible ; une description plus longue (celle d'un univers) garde sa suite écrite, dans un pli.
        <details key={monument.id} className="sheet-more">
          <summary>La suite</summary>
          <p>
            <Syllabified text={said.rest} />
          </p>
        </details>
      )}
      {!open ? (
        <p className="plan-done">
          <Icon name="lock" /> Archipel fermé : rejoins d’abord les {textes.archipels[monument.archipelago]} avec la Nef.
        </p>
      ) : (
        <section className="plan-section" aria-labelledby={`monument-avancement-${monument.id}`}>
          <h3 id={`monument-avancement-${monument.id}`} className="island-sheet-heading">
            <Icon name="castle" /> Le chantier
          </h3>
          {project ? (
            <ProjectPanel project={project} monument={monument} done={texte.done} />
          ) : (
            <>
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
                  <Icon name="star" /> <span className="plan-done-word">Terminé !</span> <span className="plan-done-text"><Syllabified text={frenchTypography(texte.done)} /></span>
                </p>
              ) : (
                <>
                  {aAssembler ? (
                    // Plus rien à poser mais des cases attendent un bloc assemblé : la ligne dit où aller (relecture UX UI).
                    <p className="monument-lacking plan-pourquoi">
                      <Icon name="hammer" /> Il te reste {blockCount(aAssembler[0], aAssembler[1])} à poser : va{' '}
                      <Link to={`${ASSEMBLAGE_PATH}?bloc=${aAssembler[0]}`}>{lieu.a}</Link> pour {aAssembler[1] > 1 ? 'les assembler' : 'l’assembler'}.
                    </p>
                  ) : (
                    !builder.canFill && (
                      // « Poser » ne peut rien : ce qui manque se lit tout de suite, sans ouvrir la liste.
                      <p className="monument-lacking">
                        <Icon name="blocks" /> <Syllabified text={lackingLine(missing, state.stock)} />
                      </p>
                    )
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
                              <strong>{n}</strong> {blockName(block, n)}
                              {have >= n ? ' · tu les as' : <> · tu en as {have}, <EarnLink block={block} /></>}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </details>
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
        </section>
      )}
      {!project && (
        // Un grand projet a sa propre ligne, dans son panneau.
        <p className="build-status" role="status" aria-live="polite">
          {builder.notice ?? ''}
        </p>
      )}
      <p className="island-inventory-link">
        <InventoryLink /> · <Link to={MONUMENTS_PATH} className="island-inventory-more">Tous les monuments</Link>
      </p>
    </div>
  );
}

/**
 * Ce qui manque pour poser, en une ligne : « Il manque 30 briques et 12 blocs de bois. » (les deux plus gros manques ;
 * « et d’autres blocs » s'il y en a encore).
 */
export function lackingLine(missing: [BlockId, number][], inventory: Partial<Record<BlockId, number>>): string {
  const left = missing
    .map(([b, n]) => [b, n - Math.min(n, inventory[b] ?? 0)] as const)
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1]);
  const words = left.slice(0, 2).map(([b, n]) => blockCount(b, n));
  if (left.length > 2) words.push('d’autres blocs');
  if (!words.length) return '';
  const list = words.length > 1 ? `${words.slice(0, -1).join(', ')} et ${words[words.length - 1]}` : words[0];
  return `Il manque ${list}.`;
}

function subtitle(m: MonumentDef, noms: NomsArchipels): string {
  return `Monument des ${noms[m.archipelago]}, au large ${ofPlace(getBiome(m.biome)?.name ?? m.biome)}`;
}

/** Le panneau d'un monument, qui glisse depuis le bas du monde (comme celui d'une île). */
export function MonumentSheet({ builder, onClose }: { builder: MonumentBuilder; onClose: () => void }) {
  const m = builder.monument;
  const textes = useTextes();
  return (
    <Sheet id="panneau-monument" className={`monument-sheet biome-${m.biome}`} titleId="monument-titre" icon="castle" title={m.name} subtitle={subtitle(m, textes.archipels)} onClose={onClose}>
      <MonumentBody builder={builder} />
    </Sheet>
  );
}

/** Un monument en vue simple : une page. */
export function MonumentPage({ builder }: { builder: MonumentBuilder }) {
  const m = builder.monument;
  const textes = useTextes();
  return (
    <>
      <Link to={MONUMENTS_PATH} className="back-link">
        <Icon name="back" /> {MONUMENTS_TITLE}
      </Link>
      <h1 className="page-title">
        <Icon name="castle" /> {m.name}
      </h1>
      <p className="section-intro">{subtitle(m, textes.archipels)}.</p>
      <MonumentBody builder={builder} />
    </>
  );
}

const INTRO =
  'Des blocs en trop ? Construis les monuments : deux par archipel, chacun sur son îlot au large. Ils demandent les blocs de plusieurs îles. Un monument fini rapporte de l’XP, et le premier, le succès Patrimoine.';

/** La liste des monuments, par archipel : leur avancement, ou l'archipel à rejoindre. */
export function MonumentsList() {
  const { state } = useBlocland();
  const textes = useTextes();
  return (
    <div className="monuments">
      <p className="section-intro">
        <Syllabified text={INTRO} />
      </p>
      {ARCHIPELAGOS.map((a) => {
        const reached = isArchipelagoReached(a.classe, state.world.links);
        return (
          <section key={a.classe} aria-labelledby={`monuments-${a.classe}`}>
            <h3 id={`monuments-${a.classe}`} className="island-sheet-heading">
              <Icon name="map" /> {archipelagoTitle(a.classe, textes.archipels)}
            </h3>
            <ul className="island-quests">
              {monumentsOf(a.classe).map((m) => {
                const s = planStatus(state, m);
                const project = projectOf(m.id);
                const avancement = project ? `${piecesBuilt(state, project)} / ${project.pieces.length} pièces posées` : `${s.done} / ${s.total} blocs posés`;
                const state_ = !reached ? 'Archipel fermé' : s.complete ? 'Terminé' : avancement;
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
    <Sheet id="panneau-monuments" className="monuments-sheet" titleId="monuments-titre" icon="castle" title={MONUMENTS_TITLE} subtitle={<>{MONUMENTS.length} monuments, deux par archipel</>} onClose={onClose}>
      <MonumentsList />
    </Sheet>
  );
}

export function MonumentsPage() {
  const univers = useUnivers();
  return (
    <>
      <Link to="/adventure" className="back-link">
        <Icon name="back" /> {UNIVERS[univers].nom}
      </Link>
      <h1 className="page-title">
        <Icon name="castle" /> {MONUMENTS_TITLE}
      </h1>
      <MonumentsList />
    </>
  );
}
