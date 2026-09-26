import { useEffect, useMemo, useState, type DependencyList } from 'react';

/**
 * Le résultat d'un chargement asynchrone, relancé quand `deps` change : `undefined` tant qu'il n'est pas arrivé
 * (jamais l'ancien résultat). Un échec est relancé au rendu : la limite d'erreur de la page (`ErrorBoundary`) l'affiche.
 */
export function useLoaded<T>(load: () => Promise<T>, deps: DependencyList): T | undefined {
  // Une clé neuve à chaque changement des dépendances : un résultat arrivé pour d'anciennes dépendances est ignoré.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const key = useMemo(() => ({}), deps);
  const [result, setResult] = useState<{ key: object; value?: T; error?: unknown; failed?: boolean }>();
  useEffect(() => {
    let live = true;
    load().then(
      (value) => live && setResult({ key, value }),
      (error: unknown) => live && setResult({ key, error, failed: true }),
    );
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  if (result?.key !== key) return undefined;
  if (result.failed) throw result.error;
  return result.value;
}
