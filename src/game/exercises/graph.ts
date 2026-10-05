// Le cadre des graphiques, sans React : le générateur (college/fonctions.ts) et le dessin (Aids.tsx) le lisent ici.

/** Le cadre d'un graphique : de xMin à xMax sur l'axe horizontal, de yMin à yMax sur l'axe vertical, entiers. */
export interface GraphFrame {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

/** Le cadre des graphiques du Phare : x et f(x) de −4 à 4, une graduation par unité (défini ici seulement). */
export const GRAPH_FRAME: GraphFrame = { xMin: -4, xMax: 4, yMin: -4, yMax: 4 };
