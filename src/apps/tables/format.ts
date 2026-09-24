/** Nombre à la française, avec espace fine insécable pour les milliers (« 4 500 »). */
export function formatNumber(n: number): string {
  return n.toLocaleString('fr-FR');
}
