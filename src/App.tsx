import { HashRouter, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { SettingsProvider } from './core/SettingsContext';
import { ProgressProvider } from './core/ProgressContext';
import { HomePage } from './pages/HomePage';
import { SubjectPage } from './pages/SubjectPage';
import { AppPage } from './pages/AppPage';
import { SettingsPage } from './pages/SettingsPage';
import { ProgressPage } from './pages/ProgressPage';
import { NotFoundPage } from './pages/NotFoundPage';

// HashRouter : les URL en « #/… » fonctionnent sur GitHub Pages sans configuration serveur.
export function App() {
  return (
    <SettingsProvider>
      <ProgressProvider>
        <HashRouter>
          <AppRoutes />
        </HashRouter>
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
        <Route path="reglages" element={<SettingsPage />} />
        <Route path="progression" element={<ProgressPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
