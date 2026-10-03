// L'icône d'un ouvrage (GD-7) : un tablier, deux piles et une arche, sur la grille de 24 des icônes Lucide. La même
// image partout : le titre du pli Ouvrages (Bridges.tsx) et Mes blocs, par `Icon name="ouvrage"`, et la plaque de la
// flèche de la Carte qui désigne un ouvrage (world/labelCanvas.ts, `formeDeLaFlecheDOuvrage`). Dessinée ici, rien
// d'emprunté.

/** Les traits de l'icône : segments (deux points) ou courbes (trois : départ, contrôle, arrivée), en [x, y] sur 24. */
export const TRAITS_DE_L_OUVRAGE: readonly (readonly (readonly [number, number])[])[] = [
  [
    [1, 9],
    [23, 9],
  ],
  [
    [4, 9],
    [4, 21],
  ],
  [
    [20, 9],
    [20, 21],
  ],
  [
    [4, 21],
    [12, 5],
    [20, 21],
  ],
];

/** Les mêmes traits en chemin SVG (`d`). */
export const CHEMIN_DE_L_OUVRAGE = TRAITS_DE_L_OUVRAGE.map(([a, b, c]) => (c ? `M${a[0]} ${a[1]}Q${b[0]} ${b[1]} ${c[0]} ${c[1]}` : `M${a[0]} ${a[1]}L${b[0]} ${b[1]}`)).join('');
