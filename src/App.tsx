import { HashRouter, Navigate, Route, Routes, useParams } from 'react-router-dom';
import { Layout } from './components/Layout';
import { TitleScreen } from './components/TitleScreen';
import { AppBadge } from './components/AppBadge';
import { SettingsProvider, useSettings } from './core/SettingsContext';
import { ProgressProvider } from './core/ProgressContext';
import { HomePage } from './pages/HomePage';
import { SubjectPage } from './pages/SubjectPage';
import { QuestsPage } from './pages/QuestsPage';
import { AppPage } from './pages/AppPage';
import { SettingsPage } from './pages/SettingsPage';
import { ProgressPage } from './pages/ProgressPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { BloclandPage } from './blocland/BloclandPage';
import { BiomePage } from './blocland/BiomePage';
import { InventoryPage } from './blocland/Inventory';
import { VoyagePage } from './blocland/VoyagePage';
import { BossPage } from './blocland/BossPage';
import { ExercisePage } from './blocland/ExercisePage';
import { BloclandProvider } from './blocland/BloclandContext';
import { WorldPage } from './blocland/WorldPage';
import { SchoolPage } from './blocland/School';
import { MENU_PATH } from './core/paths';
import { useImmersive } from './blocland/useImmersive';

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
        <Route path="menu" element={<HomePage />} />
        <Route path="quetes" element={<QuestsPage />} />
        <Route path="matiere/:subject" element={<SubjectPage />} />
        <Route path="app/:appId" element={<AppPage />} />
        <Route path="aventure" element={<AventureEntry />} />
        <Route path="aventure/:biomeId" element={<IslandEntry />} />
        <Route path="aventure/voyage/:vers" element={<VoyageEntry />} />
        <Route path="aventure/:biomeId/gardien" element={<BossPage />} />
        <Route path="aventure/:biomeId/:typeId" element={<ExercisePage />} />
        <Route path="reglages" element={<SettingsPage />} />
        <Route path="succes" element={<ProgressPage />} />
        <Route path="progression" element={<Navigate to="/succes" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

// L'accueil : le village (en 3D ou en 2D), sur l'île où se tient le bonhomme ; le menu si le réglage « Au démarrage »
// le demande, ou si l'appareil ne sait pas dessiner le monde (la vue simple commence par le menu).
function StartEntry() {
  const { settings } = useSettings();
  const immersive = useImmersive();
  return settings.startIn === 'village' && immersive ? <Navigate to="/aventure" replace /> : <HomePage />;
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
  if (biomeId === 'carte' || biomeId === 'monde') return <Navigate to="/aventure" replace />;
  // Le menu du village : en vue simple, c'est le menu en page.
  if (biomeId === 'menu') return <Navigate to={MENU_PATH} replace />;
  // La salle des trophées : en vue simple, c'est la page Succès.
  if (biomeId === 'trophees') return <Navigate to="/succes" replace />;
  // L'école du village : un panneau dans le monde, une page en vue simple.
  if (biomeId === 'ecole') return <SchoolPage />;
  // « Mes blocs » : une page en vue simple, un panneau dans le monde en 3D.
  return biomeId === 'blocs' ? <InventoryPage /> : <BiomePage />;
}
// Le voyage en Bloc-Navire : un écran HTML en vue simple ; en 3D, le monde le joue depuis le panneau du port.
function VoyageEntry() {
  const { vers } = useParams();
  return useImmersive() ? <Navigate to={`/aventure/${vers === '6e' ? 'plaine' : vers === '5e' ? 'marche' : vers === '4e' ? 'atelier' : 'phare'}`} replace /> : <VoyagePage />;
}
