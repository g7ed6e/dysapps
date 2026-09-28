// Une suite de gestes sur l'écran titre, la même au clavier et au doigt : haut, haut, bas, bas, gauche, droite,
// gauche, droite, puis B et A (au doigt : deux touchers du logo). Un geste de travers remet la suite à zéro, sans rien dire.
export type Geste = 'haut' | 'bas' | 'gauche' | 'droite' | 'b' | 'a' | 'toucher';

const SUITE: readonly (readonly Geste[])[] = [
  ['haut'],
  ['haut'],
  ['bas'],
  ['bas'],
  ['gauche'],
  ['droite'],
  ['gauche'],
  ['droite'],
  ['b', 'toucher'],
  ['a', 'toucher'],
];

export const LONGUEUR_SUITE = SUITE.length;

/** Où en est la suite après ce geste (de 0 à LONGUEUR_SUITE, qui veut dire réussie). */
export function avancer(pos: number, geste: Geste): number {
  if (pos < SUITE.length && SUITE[pos].includes(geste)) return pos + 1;
  // Un « haut » de trop garde les deux premiers ; un « haut » de travers recommence la suite.
  if (geste === 'haut') return pos === 2 ? 2 : 1;
  return 0;
}

const TOUCHES: Record<string, Geste> = { ArrowUp: 'haut', ArrowDown: 'bas', ArrowLeft: 'gauche', ArrowRight: 'droite', b: 'b', B: 'b', a: 'a', A: 'a' };

/** Le geste d'une touche du clavier, s'il en est un. */
export function gesteDeTouche(key: string): Geste | null {
  return TOUCHES[key] ?? null;
}

/** Un glissement plus court que ce seuil (en pixels) compte comme un toucher. */
export const SEUIL_GLISSEMENT = 40;

/** Le geste d'un glissement du doigt, selon son déplacement (y vers le bas), ou `toucher` s'il est trop court. */
export function gesteDeGlissement(dx: number, dy: number): Geste {
  if (Math.max(Math.abs(dx), Math.abs(dy)) < SEUIL_GLISSEMENT) return 'toucher';
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 'droite' : 'gauche';
  return dy > 0 ? 'bas' : 'haut';
}
