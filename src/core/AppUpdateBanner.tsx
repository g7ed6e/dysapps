import { Icon } from '../components/Icon';
import { applyUpdate, useAppUpdate } from './appUpdate';

/** Une nouvelle version attend : une bande sous l'en-tête, un seul bouton. */
export function AppUpdateBanner() {
  const { ready } = useAppUpdate();
  if (!ready) return null;
  return (
    <div className="update-banner" role="status" aria-live="polite">
      <span>Une nouvelle version de DysApps est prête.</span>
      <button type="button" className="button primary" onClick={() => void applyUpdate()}>
        <Icon name="zap" /> Mettre à jour
      </button>
    </div>
  );
}
