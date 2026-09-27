let cached: boolean | null = null;

/** Le dessin en 2D (Canvas 2D) est-il disponible ? (faux dans les tests, où le canvas ne dessine pas) */
export function hasCanvas2D(): boolean {
  if (cached !== null) return cached;
  try {
    cached = Boolean(document.createElement('canvas').getContext('2d'));
  } catch {
    cached = false;
  }
  return cached;
}
