// La fabrique de disposition du monde (prototype du monde ouvert d'Archipéo, piste B, choix du mainteneur du 14 octobre
// 2026) : elle choisit, pour la page du monde en 3D, la disposition en grille d'aujourd'hui (WorldPage, les deux
// univers) ou la disposition continue (le monde ouvert, ./three/archipeo/), chargée à la demande. La disposition
// continue ne vient qu'avec l'adresse `?monde=ouvert` (avant le `#`), dans l'univers Archipéo, à un archipel qui a son
// monde ouvert (le 6e, le 5e et le 4e), dont elle passe le niveau à la page (GD-22, le plan par niveau) ; sans elle, rien ne
// change, et Blocland ne la voit jamais. C'est le seul fichier qui mène au monde continu (un test le vérifie :
// ./world/continu/isolation.test.ts).
import { lazy, Suspense } from 'react';
import { useParams } from 'react-router-dom';
import { BuilderBar } from '../components/BuilderBar';
import { Loading } from '../components/Loading';
import { useBlocland } from './BloclandContext';
import { getBiome } from './biomes';
import { openWorldRequested, renduDuMonde, type Rendu } from './rendering';
import { WorldPage } from './WorldPage';
import { archipelagoOf, type ArchipelagoId } from './world/archipelago';

/** La disposition du monde : la grille (aujourd'hui, les deux univers) ou continue (le prototype d'Archipéo). */
export type WorldLayout = 'grid' | 'continuous';

/**
 * Les archipels qui ont leur monde ouvert : ceux des plans du monde continu (./world/continu/levelPlan.ts,
 * `OPEN_WORLD_LEVELS`, que ce fichier ne lit pas ; un test vérifie que les deux listes sont les mêmes).
 */
export const OPEN_WORLD_ARCHIPELAGOS = ['6e', '5e', '4e'] as const satisfies readonly ArchipelagoId[];

/** Un archipel qui a son monde ouvert. */
type OpenWorldArchipelago = (typeof OPEN_WORLD_ARCHIPELAGOS)[number];

const hasOpenWorld = (a: ArchipelagoId): a is OpenWorldArchipelago => (OPEN_WORLD_ARCHIPELAGOS as readonly ArchipelagoId[]).includes(a);

const OpenWorldPage = lazy(() => import('./three/archipeo/OpenWorldPage'));

/**
 * La disposition d'une page du monde : continue seulement si l'adresse la demande, dans le rendu d'Archipéo, à
 * un archipel qui a son monde ouvert, et pour une adresse du monde qui est la sienne (le monde, ou une île de cet archipel) ; la
 * grille dans tous les autres cas (Carte, École, panneaux du village, autre archipel, Blocland).
 */
export function worldLayoutFor(o: { requested: boolean; rendu: Rendu; archipelago: ArchipelagoId; route?: string }): WorldLayout {
  if (!o.requested || o.rendu !== 'archipeo' || !hasOpenWorld(o.archipelago)) return 'grid';
  if (o.route !== undefined && getBiome(o.route)?.classe !== o.archipelago) return 'grid';
  return 'continuous';
}

/** La page du monde en 3D, dans la disposition choisie. */
export function WorldEntry() {
  const { biomeId } = useParams();
  const { state } = useBlocland();
  const archipelago = archipelagoOf(state.world.place ?? 'french-6e-phonology').classe;
  const layout = worldLayoutFor({
    requested: typeof window !== 'undefined' && openWorldRequested(window.location.href),
    rendu: renduDuMonde(),
    archipelago,
    route: biomeId,
  });
  // Le mode bâtisseur change de niveau d'un toucher (./components/BuilderBar.tsx) : le monde ouvert d'un autre niveau
  // repart de zéro (`key`).
  const monde =
    layout === 'grid' || !hasOpenWorld(archipelago) ? (
      <WorldPage />
    ) : (
      <Suspense fallback={<Loading className="world-loading" text="Chargement du monde…" />}>
        <OpenWorldPage key={archipelago} level={archipelago} />
      </Suspense>
    );
  return (
    <>
      {monde}
      <BuilderBar levels={layout === 'continuous'} />
    </>
  );
}
