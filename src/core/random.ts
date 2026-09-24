/** Mélange un tableau (Fisher-Yates) sans modifier l'original. */
export function shuffle<T>(items: readonly T[], rng: () => number = Math.random): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Entier aléatoire entre min et max inclus. */
export function randomInt(min: number, max: number, rng: () => number = Math.random): number {
  return min + Math.floor(rng() * (max - min + 1));
}
