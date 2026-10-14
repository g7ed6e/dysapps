// La fabrique de disposition du monde (prototype du monde ouvert d'Archipéo, piste B, choix du mainteneur du 14 octobre
// 2026) : elle choisit, pour la page du monde en 3D, la disposition en grille d'aujourd'hui (WorldPage, les deux
// univers) ou la disposition continue (le monde ouvert, ./three/archipeo/), chargée à la demande. La disposition
// continue ne vient qu'avec l'adresse `?monde=ouvert` (avant le `#`), dans l'univers Archipéo, au 6e ; sans elle, rien ne
// change, et Blocland ne la voit jamais. C'est le seul fichier qui mène au monde continu (un test le vérifie :
// ./world/continu/isolation.test.ts).
import { lazy, Suspense } from 'react';
import { useParams } from 'react-router-dom';
import { Loading } from '../components/Loading';
import { useBlocland } from './BloclandContext';
import { getBiome } from './biomes';
import { renduDuMonde, type Rendu } from './rendering';
import { WorldPage } from './WorldPage';
import { archipelagoOf, type ArchipelagoId } from './world/archipelago';

/** La disposition du monde : la grille (aujourd'hui, les deux univers) ou continue (le prototype d'Archipéo). */
export type WorldLayout = 'grid' | 'continuous';

/** Le seul archipel du prototype. */
const OPEN_WORLD_ARCHIPELAGO: ArchipelagoId = '6e';

const OpenWorldPage = lazy(() => import('./three/archipeo/OpenWorldPage'));

/** L'adresse demande-t-elle le monde ouvert (`?monde=ouvert`, avant le `#`) ? */
export function openWorldRequested(href: string): boolean {
  return new URL(href, 'http://localhost/').searchParams.get('monde') === 'ouvert';
}

/**
 * La disposition d'une page du monde : continue seulement si l'adresse la demande, dans le rendu d'Archipéo, à
 * l'archipel du prototype, et pour une adresse du monde qui est la sienne (le monde, ou une île de cet archipel) ; la
 * grille dans tous les autres cas (Carte, École, panneaux du village, autre archipel, Blocland).
 */
export function worldLayoutFor(o: { requested: boolean; rendu: Rendu; archipelago: ArchipelagoId; route?: string }): WorldLayout {
  if (!o.requested || o.rendu !== 'archipeo' || o.archipelago !== OPEN_WORLD_ARCHIPELAGO) return 'grid';
  if (o.route !== undefined && getBiome(o.route)?.classe !== OPEN_WORLD_ARCHIPELAGO) return 'grid';
  return 'continuous';
}

/** La page du monde en 3D, dans la disposition choisie. */
export function WorldEntry() {
  const { biomeId } = useParams();
  const { state } = useBlocland();
  const layout = worldLayoutFor({
    requested: typeof window !== 'undefined' && openWorldRequested(window.location.href),
    rendu: renduDuMonde(),
    archipelago: archipelagoOf(state.world.place ?? 'french-6e-phonology').classe,
    route: biomeId,
  });
  if (layout === 'grid') return <WorldPage />;
  return (
    <Suspense fallback={<Loading className="world-loading" text="Chargement du monde…" />}>
      <OpenWorldPage />
    </Suspense>
  );
}
