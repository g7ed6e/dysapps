import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/atkinson-hyperlegible/400.css';
import '@fontsource/atkinson-hyperlegible/700.css';
import '@fontsource/opendyslexic/400.css';
import '@fontsource/opendyslexic/700.css';
import '@fontsource/montserrat/700.css';
import '@fontsource/archivo-black/latin-400.css';
import './styles/global.css';
import './styles/roles.css';
// Après global.css : ses sélecteurs ont la même spécificité que ceux des thèmes, l'ordre les départage.
import './styles/blocland.css';
import { App } from './App';
import { migrateStorage } from './core/migration';

// Une sauvegarde d'avant les mots neutres est traduite avant que l'appli ne la lise.
migrateStorage();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
