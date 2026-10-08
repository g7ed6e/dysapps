import { lazy, Suspense } from 'react';
import { HashRouter, Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom';
import { Layout } from './components/Layout';
import { TitleScreen } from './components/TitleScreen';
import { AppBadge } from './components/AppBadge';
import { SettingsProvider } from './core/SettingsContext';
import { ProgressProvider } from './core/ProgressContext';
import { HomePage } from './pages/HomePage';
import { SubjectPage } from './pages/SubjectPage';
import { QuestsPage } from './pages/QuestsPage';
import { AppPage } from './pages/AppPage';
import { SettingsPage } from './pages/SettingsPage';
import { ProgressPage } from './pages/ProgressPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { BloclandPage } from './game/BloclandPage';
import { BiomePage } from './game/BiomePage';
import { InventoryPage } from './game/Inventory';
import { VoyagePage } from './game/VoyagePage';
import { BossPage } from './game/BossPage';
import { ExercisePage } from './game/ExercisePage';
import { BloclandProvider } from './game/BloclandContext';
import { WorldPage } from './game/WorldPage';
import { SchoolPage } from './game/School';
import { AssemblyPage } from './game/Assembly';
import { AssemblyQuestionPage } from './game/AssemblyQuestion';
import { MonumentPage, MonumentsPage } from './game/Monuments';
import { useJoinBuilder, useMonumentBuilder } from './game/useMonumentBuilder';
import { JoinPage } from './game/Joins';
import { type AppliedJoin, getJoin } from './game/world/join';
import { getMonument, type MonumentDef } from './game/world/monuments';
import { MENU_PATH } from './core/paths';
import { translatePath } from './core/legacyIds';
import { movedPath } from './core/movedIds';
import { useImmersive } from './game/useImmersive';
import { mesuresAutomatiques } from './game/rendering';

/** La mesure automatique (`?mesures=auto`), chargée à part : aucun élève ne la télécharge. */
const AutoMeasure = lazy(() => import('./game/AutoMeasure'));

// HashRouter : les URL en « #/… » fonctionnent sur GitHub Pages sans configuration serveur.
export function App() {
  return (
    <SettingsProvider>
      <ProgressProvider>
        <BloclandProvider>
          <HashRouter>
            <AppRoutes />
            <TitleScreen />
            <AppBadge />
            {mesuresAutomatiques() && (
              <Suspense fallback={null}>
                <AutoMeasure />
              </Suspense>
            )}
          </HashRouter>
        </BloclandProvider>
      </ProgressProvider>
    </SettingsProvider>
  );
}

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<StartEntry />} />
        <Route path="menu" element={<MenuEntry />} />
        <Route path="quetes" element={<QuestsPage />} />
        <Route path="matiere/:subject" element={<SubjectPage />} />
        <Route path="app/:appId" element={<AppPage />} />
        <Route path="adventure" element={<AventureEntry />} />
        <Route path="adventure/:biomeId" element={<IslandEntry />} />
        <Route path="adventure/passage/:vers" element={<VoyageEntry />} />
        {/* La question d'un bloc assemblé (GD-2), en plein écran comme une mission, en 3D comme en vue simple. */}
        <Route path="adventure/assembly/:bloc" element={<AssemblyQuestionPage />} />
        <Route path="adventure/:biomeId/challenge" element={<BossPage />} />
        <Route path="adventure/:biomeId/:typeId" element={<MissionEntry />} />
        {/* Les anciennes adresses (/aventure/…, noms français) mènent à leur page sous les noms neutres. */}
        <Route path="aventure/*" element={<LegacyAdventure />} />
        <Route path="reglages" element={<SettingsPage />} />
        <Route path="succes" element={<ProgressPage />} />
        <Route path="progression" element={<Navigate to="/succes" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

// Une ancienne adresse (favori, lien partagé) : la même page sous son adresse neutre.
function LegacyAdventure() {
  const { pathname, search } = useLocation();
  return <Navigate to={translatePath(pathname + search)} replace />;
}

// Une mission déplacée par les programmes de 2025-2026 (core/movedIds.ts) : son ancienne adresse (favori, lien
// d'enseignant) ouvre la mission à sa nouvelle place.
function MissionEntry() {
  const { pathname, search } = useLocation();
  const to = movedPath(pathname + search);
  return to === pathname + search ? <ExercisePage /> : <Navigate to={to} replace />;
}

// L'appli s'ouvre sur le village. La page Accueil (le menu en page) n'existe plus dans le monde en 3D (mot du mainteneur,
// 4 octobre 2026) : son adresse ouvre le menu du village. Elle ne reste que pour la vue simple, sans monde.
function StartEntry() {
  return useImmersive() ? <Navigate to="/adventure" replace /> : <HomePage />;
}
function MenuEntry() {
  return useImmersive() ? <Navigate to="/adventure/menu" replace /> : <HomePage />;
}

// En 3D, la carte et les îles sont le monde en plein écran ; sinon, les pages simples (listes accessibles).
function AventureEntry() {
  return useImmersive() ? <WorldPage /> : <BloclandPage />;
}
function IslandEntry() {
  const { biomeId } = useParams();
  const immersive = useImmersive();
  if (immersive) return <WorldPage />;
  // La Carte et la page des quatre archipels n'existent qu'en 3D : en vue simple, c'est la liste des îles (déjà par archipel).
  if (biomeId === 'map' || biomeId === 'world') return <Navigate to="/adventure" replace />;
  // Le menu du village : en vue simple, c'est le menu en page.
  if (biomeId === 'menu') return <Navigate to={MENU_PATH} replace />;
  // La salle des trophées : en vue simple, c'est la page Succès.
  if (biomeId === 'trophies') return <Navigate to="/succes" replace />;
  // L'école du village : un panneau dans le monde, une page en vue simple.
  if (biomeId === 'school') return <SchoolPage />;
  // Le lieu où l'on assemble les blocs (GD-2) : un panneau dans le monde, une page en vue simple.
  if (biomeId === 'assembly') return <AssemblyPage />;
  // Les monuments : des panneaux dans le monde, des pages en vue simple.
  if (biomeId === 'landmarks') return <MonumentsPage />;
  const monument = biomeId ? getMonument(biomeId) : undefined;
  if (monument) return <MonumentEntry monument={monument} />;
  // La construction qui réunit deux lieux (GD-9) : une page en vue simple.
  const join = biomeId ? getJoin(biomeId) : undefined;
  if (join) return <JoinEntry join={join} />;
  // « Mes blocs » : une page en vue simple, un panneau dans le monde en 3D.
  return biomeId === 'stock' ? <InventoryPage /> : <BiomePage />;
}
function MonumentEntry({ monument }: { monument: MonumentDef }) {
  return <MonumentPage builder={useMonumentBuilder(monument)} />;
}
function JoinEntry({ join }: { join: AppliedJoin }) {
  return <JoinPage builder={useJoinBuilder(join.plan, join.shape)} />;
}
// Le voyage en Bloc-Navire : un écran HTML en vue simple ; en 3D, le monde le joue depuis le panneau du port.
function VoyageEntry() {
  const { vers } = useParams();
  return useImmersive() ? (
    <Navigate
      to={`/adventure/${vers === '6e' ? 'maths-6e-calculation' : vers === '5e' ? 'maths-5e-proportionality' : vers === '4e' ? 'maths-4e-algebra' : 'maths-3e-functions'}`}
      replace
    />
  ) : (
    <VoyagePage />
  );
}
