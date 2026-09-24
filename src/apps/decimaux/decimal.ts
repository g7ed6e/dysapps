// Les décimaux sont manipulés en millièmes entiers : 3,45 → 3450. Aucune erreur d'arrondi.

export const SCALE = 1000;

/** « 3,45 » à partir de 3450 millièmes (zéros inutiles retirés, milliers espacés). */
export function formatDecimal(th: number): string {
  const int = Math.floor(th / SCALE);
  const frac = String(th % SCALE).padStart(3, '0').replace(/0+$/, '');
  return `${int.toLocaleString('fr-FR')}${frac ? `,${frac}` : ''}`;
}

/** Inverse de formatDecimal : « 3,45 » → 3450. */
export function parseDecimal(s: string): number {
  const [int, frac = ''] = s.replace(/[\s  ]/g, '').split(',');
  return Number(int) * SCALE + Number(frac.padEnd(3, '0').slice(0, 3));
}

/** Chiffres d'un décimal : partie entière et partie décimale (sans zéros inutiles). */
export function digitsOf(th: number): { int: string; dec: string } {
  const int = String(Math.floor(th / SCALE));
  const dec = String(th % SCALE).padStart(3, '0').replace(/0+$/, '');
  return { int, dec };
}
