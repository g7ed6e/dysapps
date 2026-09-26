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

/** « Plan de Forêt des sons : encore 6 à gagner », « Bloc-Navire : tu as tout, pose-les », « À garder pour … ». */
function useLabel(use: Use, count: number): string {
  const island = getBiome(use.island)?.name ?? use.island;
  if (use.kind === 'garder') return `À garder pour les plans suivants de ${island}`;
  const what = use.kind === 'navire' ? cap(VEHICLE_NAME) : `Plan de ${island}`;
  return `${what} : ${use.enough ? 'tu as tout, pose-les' : `encore ${use.need - count} à gagner`}`;
}

/**
 * L'inventaire commenté : chaque type de bloc en poche et ce qu'il construit maintenant (un lien par île), les ouvrages
 * que les blocs peuvent payer, et les blocs à aller chercher, avec l'île où les gagner. Même contenu dans le panneau
 * 3D et en vue simple ; les liens changent d'île (en 3D, la caméra y vole et son panneau s'ouvre).
 */
export function InventoryBody() {
  const { state } = useBlocland();
  const at = state.village.at ?? 'foret';
  const { rows, payable, ouvrages, missing } = inventoryUses(state);
  return (
    <div className="inventory">
      <h3 id="inventaire-blocs" className="island-sheet-heading">
        <Icon name="blocks" /> Mes blocs
      </h3>
      {rows.length === 0 ? (
        <p className="inventory-empty">
          <Syllabified text="Aucun bloc pour l’instant. Fais une quête pour en gagner." />{' '}
          <Link to={`/aventure/${at}`} className="tag">
            <Icon name="play" /> Aller sur {getBiome(at)?.name}
          </Link>
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
                    <Link key={`${use.kind}-${use.island}`} to={`/aventure/${use.island}`} className={`tag${use.enough ? ' tag-ok' : ''}`}>
                      <Icon name={use.kind === 'navire' ? 'ship' : use.kind === 'garder' ? 'flag' : 'hammer'} /> {useLabel(use, row.count)}
                    </Link>
                  ))
                )}
              </span>
            </li>
          ))}
        </ul>
      )}

      {ouvrages.length > 0 && (
        <section className="inventory-section" aria-labelledby="inventaire-ouvrages">
          <h3 id="inventaire-ouvrages" className="island-sheet-heading">
            <Icon name="map" /> Pour les ouvrages
          </h3>
          <p className="inventory-line">
            Tu as <strong>{payable}</strong> bloc{payable > 1 ? 's' : ''} pour construire, de n’importe quel type.
          </p>
          <ul className="inventory-uses inventory-ouvrages" aria-label="Ouvrages possibles">
            {ouvrages.map((o) => (
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
        {missing.length === 0 ? (
          <p className="inventory-line">
            <Syllabified text="Tu as tout ce qu’il faut pour les plans en cours." />
          </p>
        ) : (
          <ul className="inventory-missing" aria-labelledby="inventaire-manque">
            {missing.map((m) => (
              <li key={m.block}>
                <BlockIcon top={BLOCKS[m.block].top} side={BLOCKS[m.block].side} size={28} />
                <span>
                  <strong>{m.need}</strong> {name(m.block)} · à gagner dans{' '}
                  {m.island ? (
                    <>
                      <Link to={`/aventure/${m.island}`}>{getBiome(m.island)?.name}</Link>
                      {m.closed && ' (île fermée)'}
                    </>
                  ) : (
                    whereToEarn(m.block)
                  )}
                </span>
              </li>
            ))}
          </ul>
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
        <Icon name="back" /> Carte de Blocland
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
