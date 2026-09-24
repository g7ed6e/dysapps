// Fractions en toutes lettres, pour la lecture vocale (« 3 cinquièmes » plutôt que « 3 barre 5 »).

const NAMES: Record<number, string> = {
  2: 'demi',
  3: 'tiers',
  4: 'quart',
  5: 'cinquième',
  6: 'sixième',
  7: 'septième',
  8: 'huitième',
  9: 'neuvième',
  10: 'dixième',
  11: 'onzième',
  12: 'douzième',
  14: 'quatorzième',
  15: 'quinzième',
  16: 'seizième',
  18: 'dix-huitième',
  20: 'vingtième',
  24: 'vingt-quatrième',
  30: 'trentième',
  40: 'quarantième',
  100: 'centième',
  1000: 'millième',
};

export function fractionWords(n: number, d: number): string {
  const name = NAMES[d] ?? `${d}ième`;
  if (n === 1) return `un ${name}`;
  return `${n} ${name.endsWith('s') ? name : `${name}s`}`;
}

/** Remplace les « n/d » d'un texte par leur lecture. */
export function speakFractions(text: string): string {
  return text.replace(/(\d+)\/(\d+)/g, (_, n, d) => fractionWords(Number(n), Number(d)));
}
