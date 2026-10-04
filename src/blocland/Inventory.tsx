import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { Syllabified } from '../components/Syllabified';
import { BLOCKS, blockName, getBiome } from './biomes';
import { useBlocland } from './BloclandContext';
import { BlockIcon } from './Voxel';
import { KIND_NAME } from './world/archipelago';
import { blocTrophee, inventoryUses, whereToEarn, type Use } from './world/uses';
import { VEHICLE_NAME } from './world/vehicle';
import { useUnivers } from '../core/SettingsContext';
import { UNIVERS } from '../core/univers';

const cap = (text: string) => `${text.charAt(0).toUpperCase()}${text.slice(1)}`;

const useIcon = (use: Use) => (use.kind === 'navire' ? 'ship' : 'castle');
const useKey = (use: Use) => `${use.kind}-${use.to ?? use.island}`;

/** « Tu peux construire » en montre trois ; « Tout voir » montre le reste. */
export const READY_SHOWN = 3;

/**
 * L'ordre des chantiers prêts : ceux de l'île du bonhomme d'abord, dans l'ordre de son prochain objectif (l'ouvrage,
 * le Bloc-Navire), puis les autres.
 */
function readyRank(kind: Use['kind'] | 'ouvrage', here: boolean): number {
  const order = ['ouvrage', 'navire', 'monument'].indexOf(kind);
  return (here ? 0 : 10) + (order < 0 ? 9 : order);
}

/** « Bloc-Navire : encore 6 à gagner », « Bloc-Navire : tu as tout, pose-les », « La tour : tu peux en poser 4 ». */
function useLabel(use: Use, count: number): string {
  // Un monument prend ce qu'on a : on peut en poser dès le premier bloc.
  if (use.kind === 'monument') return `${use.name} : ${use.enough ? 'tu as tout, pose-les' : `tu peux en poser ${Math.min(count, use.need)}`}`;
  return `${cap(VEHICLE_NAME)} : ${use.enough ? 'tu as tout, pose-les' : `encore ${use.need - count} à gagner`}`;
}

/**
 * L'inventaire commenté. D'abord ce qu'on peut construire tout de suite (un lien par chantier), puis chaque type de
 * bloc en poche et ce qu'il construit (les blocs de finition, l'or et le cristal sont des trophées, GD-6), les ouvrages, et les blocs à aller chercher sur les îles ouvertes (celles
 * qu'on ne peut pas encore atteindre sont seulement comptées). Même contenu dans le panneau 3D et en vue simple ;
 * les liens changent d'île (en 3D, la caméra y vole et son panneau s'ouvre).
 */
export function InventoryBody() {
  const { state } = useBlocland();
  const at = state.world.place ?? 'french-6e-phonology';
  const { rows, payable, ouvrages, missing } = inventoryUses(state);
  // Ce qu'on peut faire maintenant : le navire dont on a tous les blocs, les monuments, les ouvrages qu'on peut payer.
  const seen = new Set<string>();
  const readyUses = rows
    .flatMap((row) => row.uses.filter((u) => u.enough || u.kind === 'monument'))
    .filter((u) => (seen.has(useKey(u)) ? false : (seen.add(useKey(u)), true)));
  const readyOuvrages = ouvrages.filter((o) => o.enough);
  // Les trois premiers chantiers prêts, celui du prochain objectif de l'île du bonhomme en tête ; le reste sur demande.
  type Ready = { key: string; rank: number } & ({ genre: 'usage'; use: Use } | { genre: 'ouvrage'; ouvrage: (typeof ouvrages)[number] });
  const ready = [
    ...readyUses.map((use): Ready => ({ genre: 'usage', key: useKey(use), rank: readyRank(use.kind, use.island === at), use })),
    ...readyOuvrages.map((o): Ready => ({ genre: 'ouvrage', key: o.bridge.id, rank: readyRank('ouvrage', o.from === at || o.to === at), ouvrage: o })),
  ]
    .map((item, i) => ({ item, i }))
    .sort((a, b) => a.item.rank - b.item.rank || a.i - b.i)
    .map(({ item }) => item);
  const [all, setAll] = useState(false);
  const list = useRef<HTMLUListElement>(null);
  // « Tout voir » disparaît une fois touché : le focus passe au premier chantier qui vient d'apparaître.
  const showAll = () => {
    setAll(true);
    requestAnimationFrame(() => list.current?.querySelectorAll('a')[READY_SHOWN]?.focus());
  };
  const shown = all ? ready : ready.slice(0, READY_SHOWN);
  // « Dans ta poche » ne redit pas les chantiers que « Tu peux construire » montre déjà.
  const listed = new Set(shown.map((r) => r.key));
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
        {ready.length === 0 ? (
          <p className="inventory-line">
            <Syllabified text="Rien pour l’instant : fais une mission pour gagner des blocs." />{' '}
            <Link to={`/adventure/${at}`} className="tag">
              <Icon name="play" /> Aller sur {getBiome(at)?.name}
            </Link>
          </p>
        ) : (
          <>
            <ul ref={list} className="inventory-uses" aria-labelledby="inventaire-maintenant">
              {shown.map((r) => (
                <li key={r.key}>
                  {r.genre === 'usage' ? (
                    <Link to={r.use.to ?? `/adventure/${r.use.island}`} className="tag tag-ok">
                      <Icon name={useIcon(r.use)} />{' '}
                      {r.use.kind === 'navire' ? cap(VEHICLE_NAME) : r.use.name}
                    </Link>
                  ) : (
                    <Link to={`/adventure/${r.ouvrage.from}?worksite=${encodeURIComponent(r.ouvrage.bridge.id)}`} className="tag tag-ok">
                      <Icon name="ouvrage" /> {KIND_NAME[r.ouvrage.bridge.kind]} vers {getBiome(r.ouvrage.to)?.name}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
            {ready.length > READY_SHOWN && !all && (
              <button type="button" className="button inventory-all" onClick={showAll}>
                <Icon name="chevronDown" /> Tout voir ({ready.length})
              </button>
            )}
          </>
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
          {rows.map((row) => {
            const uses = row.uses.filter((u) => !listed.has(useKey(u)));
            return (
              <li key={row.block} className="inventory-row">
                <span className="inventory-block">
                  <BlockIcon top={BLOCKS[row.block].top} side={BLOCKS[row.block].side} size={28} />
                  <strong>{row.count}</strong> {blockName(row.block, row.count)}
                </span>
                <span className="inventory-uses">
                  {row.uses.length === 0 && blocTrophee(row.block) ? (
                    // Les blocs de finition, l'or et le cristal ne paient plus rien (GD-6) : ils restent, en trophées.
                    <span className="inventory-none inventory-trophy">
                      <Icon name="trophy" /> {row.count > 1 ? 'Des trophées à garder' : 'Un trophée à garder'}
                    </span>
                  ) : row.uses.length === 0 ? (
                    <span className="inventory-none">Rien à construire pour l’instant</span>
                  ) : uses.length === 0 ? (
                    <span className="inventory-none">Pour un chantier plus haut</span>
                  ) : (
                    uses.map((use) => (
                      <Link key={useKey(use)} to={use.to ?? `/adventure/${use.island}`} className={`tag${use.enough || use.kind === 'monument' ? ' tag-ok' : ''}`}>
                        <Icon name={useIcon(use)} /> {useLabel(use, row.count)}
                      </Link>
                    ))
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {laterOuvrages.length > 0 && (
        <section className="inventory-section" aria-labelledby="inventaire-ouvrages">
          <h3 id="inventaire-ouvrages" className="island-sheet-heading">
            <Icon name="ouvrage" /> Prochains ouvrages
          </h3>
          <p className="inventory-line">
            Tu as <strong>{payable}</strong> bloc{payable > 1 ? 's' : ''} pour construire, de n’importe quel type.
          </p>
          <ul className="inventory-uses inventory-ouvrages" aria-label="Ouvrages possibles">
            {laterOuvrages.map((o) => (
              <li key={o.bridge.id}>
                <Link to={`/adventure/${o.from}?worksite=${encodeURIComponent(o.bridge.id)}`} className={`tag${o.enough ? ' tag-ok' : ''}`}>
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
              <Syllabified text="Tu as tout ce qu’il faut pour les chantiers en cours." />
            </p>
          )
        ) : (
          <ul className="inventory-missing" aria-labelledby="inventaire-manque">
            {openMissing.map((m) => (
              <li key={m.block}>
                <BlockIcon top={BLOCKS[m.block].top} side={BLOCKS[m.block].side} size={28} />
                <span>
                  <strong>{m.need}</strong> {blockName(m.block, m.need)} · à gagner dans{' '}
                  {m.island ? (
                    <Link to={`/adventure/${m.island}`}>{getBiome(m.island)?.name}</Link>
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
            {total} bloc{total > 1 ? 's' : ''} en poche.
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
  const univers = useUnivers();
  const { state } = useBlocland();
  const total = inventoryUses(state).total;
  return (
    <>
      <Link to="/adventure" className="back-link">
        <Icon name="back" /> {UNIVERS[univers].carte}
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
  const total = Object.values(state.stock).reduce((n, v) => n + (v ?? 0), 0);
  return (
    <Link to="/adventure/stock" className={className}>
      <Icon name="blocks" /> Mes blocs ({total})
    </Link>
  );
}
