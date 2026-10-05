let cached: boolean | null = null;

/** WebGL est-il disponible ? (faux dans les tests, sur certains navigateurs anciens ou bridés) */
export function hasWebGL(): boolean {
  if (cached !== null) return cached;
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
    cached = Boolean(gl);
  } catch {
    cached = false;
  }
  return cached;
}
