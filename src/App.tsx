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
import { ExercisePage } from './blocland/ExercisePage';
import { ChantierPage } from './blocland/ChantierPage';
import { BloclandProvider } from './blocland/BloclandContext';

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
        <Route path="aventure" element={<BloclandPage />} />
        <Route path="aventure/chantier" element={<ChantierPage />} />
        <Route path="aventure/:biomeId" element={<BiomePage />} />
        <Route path="aventure/:biomeId/:typeId" element={<ExercisePage />} />
        <Route path="reglages" element={<SettingsPage />} />
        <Route path="succes" element={<ProgressPage />} />
        <Route path="progression" element={<Navigate to="/succes" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
