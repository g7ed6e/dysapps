import { Link } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { Syllabified } from '../components/Syllabified';
import { BLOCKS, getBiome } from './biomes';
import { useBlocland } from './BloclandContext';
import { BlockIcon } from './Voxel';
import { KIND_NAME } from './world/archipelago';
import { inventoryUses, whereToEarn, type Use } from './world/uses';
import { VEHICLE_NAME } from './world/vehicle';

const cap = (text: string) => `${text.charAt(0).toUpperCase()}${text.slice(1)}`;
const name = (block: keyof typeof BLOCKS) => BLOCKS[block].name.toLowerCase();

const useIcon = (use: Use) => (use.kind === 'navire' ? 'ship' : use.kind === 'garder' ? 'flag' : use.kind === 'monument' ? 'castle' : 'hammer');
const useKey = (use: Use) => `${use.kind}-${use.to ?? use.island}`;

/** « Plan de Forêt des sons : encore 6 à gagner », « Bloc-Navire : tu as tout, pose-les », « À garder pour … ». */
function useLabel(use: Use, count: number): string {
  const island = getBiome(use.island)?.name ?? use.island;
  if (use.kind === 'garder') return `À garder pour les plans suivants de ${island}`;
  // Un monument prend ce qu'on a : on peut en poser dès le premier bloc.
  if (use.kind === 'monument') return `${use.name} : ${use.enough ? 'tu as tout, pose-les' : `tu peux en poser ${Math.min(count, use.need)}`}`;
  const what = use.kind === 'navire' ? cap(VEHICLE_NAME) : `Plan de ${island}`;
  return `${what} : ${use.enough ? 'tu as tout, pose-les' : `encore ${use.need - count} à gagner`}`;
}

/**
 * L'inventaire commenté. D'abord ce qu'on peut construire tout de suite (un lien par chantier), puis chaque type de
 * bloc en poche et ce qu'il construit, les ouvrages, et les blocs à aller chercher sur les îles ouvertes (celles
 * qu'on ne peut pas encore atteindre sont seulement comptées). Même contenu dans le panneau 3D et en vue simple ;
 * les liens changent d'île (en 3D, la caméra y vole et son panneau s'ouvre).
 */
export function InventoryBody() {
  const { state } = useBlocland();
  const at = state.village.at ?? 'foret';
  const { rows, payable, ouvrages, missing } = inventoryUses(state);
  // Ce qu'on peut faire maintenant : les plans et le navire dont on a tous les blocs, les ouvrages qu'on peut payer.
  const seen = new Set<string>();
  const readyUses = rows
    .flatMap((row) => row.uses.filter((u) => (u.enough || u.kind === 'monument') && u.kind !== 'garder'))
    .filter((u) => (seen.has(useKey(u)) ? false : (seen.add(useKey(u)), true)));
  const readyOuvrages = ouvrages.filter((o) => o.enough);
  // Les ouvrages pas encore payables : les trois moins chers suffisent, une longue liste de coûts noierait l'essentiel.
  const laterOuvrages = ouvrages
    .filter((o) => !o.enough)
    .sort((x, y) => x.bridge.cost - y.bridge.cost)
    .slice(0, 3);
  const openMissing = missing.filter((m) => !m.closed);
  const closedMissing = missing.length - openMissing.length;
  return (
    <div className="inventory">
      <section className="inventory-section inventory-now" aria-labelledby="inventaire-maintenant">
        <h3 id="inventaire-maintenant" className="island-sheet-heading">
          <Icon name="hammer" /> Tu peux construire
        </h3>
        {readyUses.length + readyOuvrages.length === 0 ? (
          <p className="inventory-line">
            <Syllabified text="Rien pour l’instant : fais une mission pour gagner des blocs." />{' '}
            <Link to={`/aventure/${at}`} className="tag">
              <Icon name="play" /> Aller sur {getBiome(at)?.name}
            </Link>
          </p>
        ) : (
          <ul className="inventory-uses" aria-labelledby="inventaire-maintenant">
            {readyUses.map((use) => (
              <li key={useKey(use)}>
                <Link to={use.to ?? `/aventure/${use.island}`} className="tag tag-ok">
                  <Icon name={useIcon(use)} />{' '}
                  {use.kind === 'navire' ? cap(VEHICLE_NAME) : use.kind === 'monument' ? use.name : `Plan de ${getBiome(use.island)?.name ?? use.island}`}
                </Link>
              </li>
            ))}
            {readyOuvrages.map((o) => (
              <li key={o.bridge.id}>
                <Link to={`/aventure/${o.from}`} className="tag tag-ok">
                  <Icon name="map" /> {KIND_NAME[o.bridge.kind]} vers {getBiome(o.to)?.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <h3 id="inventaire-blocs" className="island-sheet-heading">
        <Icon name="blocks" /> Dans ta poche
      </h3>
      {rows.length === 0 ? (
        <p className="inventory-empty">
          <Syllabified text="Aucun bloc pour l’instant." />
        </p>
      ) : (
        <ul className="inventory-list" aria-labelledby="inventaire-blocs">
          {rows.map((row) => (
            <li key={row.block} className="inventory-row">
              <span className="inventory-block">
                <BlockIcon top={BLOCKS[row.block].top} side={BLOCKS[row.block].side} size={28} />
                <strong>{row.count}</strong> {name(row.block)}
              </span>
              <span className="inventory-uses">
                {row.uses.length === 0 ? (
                  <span className="inventory-none">Rien à construire pour l’instant</span>
                ) : (
                  row.uses.map((use) => (
                    <Link key={useKey(use)} to={use.to ?? `/aventure/${use.island}`} className={`tag${use.enough || use.kind === 'monument' ? ' tag-ok' : ''}`}>
                      <Icon name={useIcon(use)} /> {useLabel(use, row.count)}
                    </Link>
                  ))
                )}
              </span>
            </li>
          ))}
        </ul>
      )}

      {laterOuvrages.length > 0 && (
        <section className="inventory-section" aria-labelledby="inventaire-ouvrages">
          <h3 id="inventaire-ouvrages" className="island-sheet-heading">
            <Icon name="map" /> Prochains ouvrages
          </h3>
          <p className="inventory-line">
            Tu as <strong>{payable}</strong> bloc{payable > 1 ? 's' : ''} pour construire, de n’importe quel type.
          </p>
          <ul className="inventory-uses inventory-ouvrages" aria-label="Ouvrages possibles">
            {laterOuvrages.map((o) => (
              <li key={o.bridge.id}>
                <Link to={`/aventure/${o.from}`} className={`tag${o.enough ? ' tag-ok' : ''}`}>
                  <Icon name="hammer" /> {KIND_NAME[o.bridge.kind]} vers {getBiome(o.to)?.name} : {o.bridge.cost} blocs
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="inventory-section" aria-labelledby="inventaire-manque">
        <h3 id="inventaire-manque" className="island-sheet-heading">
          <Icon name="flag" /> À aller chercher
        </h3>
        {openMissing.length === 0 ? (
          closedMissing === 0 && (
            <p className="inventory-line">
              <Syllabified text="Tu as tout ce qu’il faut pour les plans en cours." />
            </p>
          )
        ) : (
          <ul className="inventory-missing" aria-labelledby="inventaire-manque">
            {openMissing.map((m) => (
              <li key={m.block}>
                <BlockIcon top={BLOCKS[m.block].top} side={BLOCKS[m.block].side} size={28} />
                <span>
                  <strong>{m.need}</strong> {name(m.block)} · à gagner dans{' '}
                  {m.island ? (
                    <Link to={`/aventure/${m.island}`}>{getBiome(m.island)?.name}</Link>
                  ) : (
                    whereToEarn(m.block)
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
        {closedMissing > 0 && (
          <p className="inventory-line inventory-later">
            <Syllabified
              text={`Et ${closedMissing} autre${closedMissing > 1 ? 's' : ''} sorte${closedMissing > 1 ? 's' : ''} de blocs, sur des îles que tu ouvriras plus tard.`}
            />
          </p>
        )}
      </section>
    </div>
  );
}

interface SheetProps {
  onClose: () => void;
}

/** Le panneau « Mes blocs » du monde en 3D, à la place du panneau d'une île. */
export function InventorySheet({ onClose }: SheetProps) {
  const { state } = useBlocland();
  const total = inventoryUses(state).total;
  return (
    <section id="panneau-blocs" className="island-sheet inventory-sheet" role="dialog" aria-labelledby="blocs-titre" aria-modal="false">
      <div className="island-sheet-head">
        <div className="island-sheet-titles">
          <h2 id="blocs-titre" className="island-sheet-title">
            <Icon name="blocks" /> Mes blocs
          </h2>
          <p className="island-sheet-module">
            {total} bloc{total > 1 ? 's' : ''} en poche. Touche une île pour y aller.
          </p>
        </div>
        <button type="button" className="icon-button island-sheet-close" aria-label="Fermer le panneau" onClick={onClose}>
          <Icon name="close" />
        </button>
      </div>
      <InventoryBody />
    </section>
  );
}

/** La page « Mes blocs » en vue simple. */
export function InventoryPage() {
  const { state } = useBlocland();
  const total = inventoryUses(state).total;
  return (
    <>
      <Link to="/aventure" className="back-link">
        <Icon name="back" /> Carte d’Archipéo
      </Link>
      <h1 className="page-title">
        <Icon name="blocks" /> Mes blocs
      </h1>
      <p className="biome-archipel">
        {total} bloc{total > 1 ? 's' : ''} en poche.
      </p>
      <div className="panel plan-panel">
        <InventoryBody />
      </div>
    </>
  );
}

/** Le lien « Mes blocs (N) », pour les pages et le panneau d'île. */
export function InventoryLink({ className = 'tag' }: { className?: string }) {
  const { state } = useBlocland();
  const total = Object.values(state.inventory).reduce((n, v) => n + (v ?? 0), 0);
  return (
    <Link to="/aventure/blocs" className={className}>
      <Icon name="blocks" /> Mes blocs ({total})
    </Link>
  );
}
