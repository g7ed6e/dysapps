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

/** Générateur pseudo-aléatoire reproductible (mulberry32) : la même suite pour la même graine entière. */
export function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** La graine entière d'un texte (un hachage par 31). */
function seedOf(text: string): number {
  let s = 0;
  for (const ch of text) s = (Math.imul(s, 31) + ch.charCodeAt(0)) | 0;
  return s;
}

/** Générateur reproductible à partir d'un texte : la même suite pour le même texte. */
export function seeded(text: string): () => number {
  return mulberry32(seedOf(text));
}

/** Un hasard reproductible par case entière (et par graine), de 0 à 1 : arithmétique entière, le même sur tout moteur. */
export function cellHash(x: number, y: number, seed = 0): number {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(seed | 0, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
