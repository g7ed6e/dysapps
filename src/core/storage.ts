// Petit utilitaire de persistance locale : tout reste sur l'appareil de l'élève.
export const STORAGE_PREFIX = 'dysapps:';
const PREFIX = STORAGE_PREFIX;

// Sauvegarde gelée : plus rien ne s'écrit sur l'appareil jusqu'au prochain chargement de la page (le mode bâtisseur
// joue sur une copie en mémoire, la vraie partie reste telle qu'elle était). Le gel vaut pour tout : un réglage changé
// pendant ce temps est perdu au rechargement, comme le reste.
let gelee = false;

export function gelerSauvegarde(): void {
  gelee = true;
}

/** Pour les tests : la page n'est pas rechargée entre deux cas. */
export function degelerSauvegarde(): void {
  gelee = false;
}

export function sauvegardeGelee(): boolean {
  return gelee;
}

export function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw === null) return fallback;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return fallback;
    return { ...fallback, ...parsed } as T;
  } catch {
    return fallback;
  }
}

export function saveJSON<T>(key: string, value: T): void {
  if (gelee) return;
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Stockage indisponible (navigation privée, quota) : l'app continue sans sauvegarde.
  }
}

export function removeKey(key: string): void {
  if (gelee) return;
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {
    // ignoré
  }
}
