import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { SettingsProvider } from './core/SettingsContext';
import { ProgressProvider } from './core/ProgressContext';
import { HomePage } from './pages/HomePage';
import { SubjectPage } from './pages/SubjectPage';
import { AppPage } from './pages/AppPage';
import { SettingsPage } from './pages/SettingsPage';
import { ProgressPage } from './pages/ProgressPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { BloclandPage } from './blocland/BloclandPage';
import { BiomePage } from './blocland/BiomePage';
import { BossPage } from './blocland/BossPage';
import { ExercisePage } from './blocland/ExercisePage';
import { BloclandProvider } from './blocland/BloclandContext';
import { WorldPage } from './blocland/WorldPage';
import { useImmersive } from './blocland/useImmersive';

// HashRouter : les URL en « #/… » fonctionnent sur GitHub Pages sans configuration serveur.
export function App() {
  return (
    <SettingsProvider>
      <ProgressProvider>
        <BloclandProvider>
          <HashRouter>
            <AppRoutes />
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
        <Route index element={<HomePage />} />
        <Route path="matiere/:subject" element={<SubjectPage />} />
        <Route path="app/:appId" element={<AppPage />} />
        <Route path="aventure" element={<AventureEntry />} />
        <Route path="aventure/:biomeId" element={<IslandEntry />} />
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

// En 3D, la carte et les îles sont le monde en plein écran ; sinon, les pages simples (listes accessibles).
function AventureEntry() {
  return useImmersive() ? <WorldPage /> : <BloclandPage />;
}
function IslandEntry() {
  return useImmersive() ? <WorldPage /> : <BiomePage />;
}
