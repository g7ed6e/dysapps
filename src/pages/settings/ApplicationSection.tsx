// La section Application des réglages : la version, la mise à jour, la mesure d'usage, les liens (sortie de
// SettingsPage.tsx, qualité du code, lot 8).
import { Icon } from '../../components/Icon';
import { useSettings } from '../../core/SettingsContext';
import { APP_VERSION, applyUpdate, checkForUpdate, useAppUpdate } from '../../core/appUpdate';

const DOCS_URL = 'https://g7ed6e.github.io/dysapps/';
const REPO_URL = 'https://github.com/g7ed6e/dysapps';

export function ApplicationSection() {
  const appUpdate = useAppUpdate();
  const { settings, update } = useSettings();
  return (
    <fieldset className="panel">
      <legend>Application</legend>
      <p className="settings-version">DysApps, version {APP_VERSION}.</p>
      {appUpdate.ready ? (
        <button type="button" className="button primary" onClick={() => void applyUpdate()}>
          Mettre à jour maintenant
        </button>
      ) : (
        <button type="button" className="button" disabled={appUpdate.checking} onClick={() => void checkForUpdate()}>
          {appUpdate.checking ? 'Recherche…' : 'Vérifier les mises à jour'}
        </button>
      )}
      <p className="settings-note" role="status" aria-live="polite">
        {appUpdate.ready
          ? 'Une nouvelle version est prête : elle s’installe en un clic, puis la page se recharge.'
          : appUpdate.checked === 'aucune'
            ? 'Tu as la dernière version.'
            : appUpdate.checked === 'hors-ligne'
              ? 'Pas de connexion : réessaie plus tard.'
              : 'L’application se met à jour toute seule ; ce bouton sert à ne pas attendre.'}
      </p>
      {/* La mesure d'usage anonyme (core/usage.ts) : ce qu'elle compte, en une phrase. */}
      <label className="toggle">
        <input type="checkbox" checked={settings.usageStats} onChange={(e) => update({ usageStats: e.target.checked })} />
        Aider à améliorer l’appli
      </label>
      <p className="settings-note">
        L’appli compte ses lancements, le temps passé sur chaque écran et sa fluidité, sans savoir qui tu es. Rien n’est écrit
        sur ton appareil.
      </p>
      {/* Ouverts dans un nouvel onglet : l'appli reste où elle était. */}
      <div className="settings-links">
        <a className="button" href={DOCS_URL} target="_blank" rel="noopener noreferrer">
          <Icon name="book" /> La documentation
        </a>
        <a className="button" href={REPO_URL} target="_blank" rel="noopener noreferrer">
          <Icon name="globe" /> Le code sur GitHub
        </a>
      </div>
    </fieldset>
  );
}
