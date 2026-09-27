// Ce que la 2D dessine en plus des faces de cubes (prototype : chaque étape s'allume à part, pour les comparer).
export const STYLE = {
  /** B. Bords entre deux sols (l'herbe qui mord sur le sable), rebords et contours des falaises, écume des rives. */
  edges: true,
  /** C. Tuiles dessinées pour la 2D (touffes d'herbe, sable pointillé, pavés, strates des falaises). */
  designed: true,
  /** D. Le décor en sprites (arbres ronds, sapins, buissons, fleurs…) au lieu de cubes. */
  sprites: true,
  /** E. Ombres : au pied des falaises, à l'est des reliefs, sous le décor. */
  shadows: true,
};
