// La mise à jour de l'application (PWA) : on la contrôle au lieu de la subir. Quand une nouvelle version est prête,
// un bouton « Mettre à jour » l'installe et recharge ; dans les réglages, on peut aussi la chercher soi-même.
import { useEffect, useState } from 'react';

interface Store {
  /** Une nouvelle version est téléchargée et attend. */
  ready: boolean;
  /** Recherche en cours (bouton des réglages). */
  checking: boolean;
  /** Dernier résultat d'une recherche manuelle. */
  checked: 'aucune' | 'trouvee' | 'hors-ligne' | null;
}

let store: Store = { ready: false, checking: false, checked: null };
const listeners = new Set<() => void>();
let registration: ServiceWorkerRegistration | undefined;
let updateSW: ((reload?: boolean) => Promise<void>) | undefined;
let started = false;

function set(patch: Partial<Store>) {
  store = { ...store, ...patch };
  for (const l of listeners) l();
}

/** Enregistre le service worker (une fois). Sans service worker (tests, navigateur ancien), ne fait rien. */
export function startAppUpdates(): void {
  if (started || typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
  started = true;
  import('virtual:pwa-register')
    .then(({ registerSW }) => {
      updateSW = registerSW({
        immediate: true,
        onNeedRefresh: () => set({ ready: true, checking: false, checked: 'trouvee' }),
        onRegisteredSW: (_url, reg) => {
          registration = reg;
        },
      });
    })
    .catch(() => {
      /* pas de service worker : pas de mise à jour à proposer */
    });
}

/** Cherche une nouvelle version maintenant. */
export async function checkForUpdate(): Promise<void> {
  if (store.ready) return;
  if (typeof navigator !== 'undefined' && 'onLine' in navigator && !navigator.onLine) {
    set({ checked: 'hors-ligne' });
    return;
  }
  set({ checking: true, checked: null });
  try {
    await registration?.update();
  } catch {
    /* réseau indisponible */
  }
  // Si une version attend, onNeedRefresh a déjà répondu ; sinon, on est à jour.
  window.setTimeout(() => {
    if (!store.ready) set({ checking: false, checked: 'aucune' });
  }, 1500);
}

/** Installe la version qui attend et recharge la page (recharge de toute façon au bout de trois secondes). */
export async function applyUpdate(): Promise<void> {
  const reload = () => window.location.reload();
  const fallback = window.setTimeout(reload, 3000);
  try {
    const reg = registration ?? (await navigator.serviceWorker.getRegistration());
    if (reg?.waiting) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.clearTimeout(fallback);
        reload();
      });
      reg.waiting.postMessage({ type: 'SKIP_WAITING' });
      return;
    }
    if (updateSW) await updateSW(true);
  } catch {
    /* on recharge quand même */
  }
}

export function useAppUpdate(): Store {
  const [, tick] = useState(0);
  useEffect(() => {
    const l = () => tick((n) => n + 1);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return store;
}

/** Version de l'application (package.json), injectée à la construction. */
export const APP_VERSION: string = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : 'dev';
