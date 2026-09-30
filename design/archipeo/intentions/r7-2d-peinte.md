# Lot R7, la 2D peinte : intention du directeur artistique (27/09/2026)

Principe : même île, même lumière qu'en 3D Archipéo (style (b)). Toutes les couleurs viennent de world/palette.ts (couleurDuSol, couleurDeMatiere, cielDe, par archipel, jour et nuit). Plus de grain à l'échelle du pixel ; bords nets (peint ≠ flou). Ambiance : design/archipeo/pack-visuel/world/village-reconstruction.png.

P1 sol, eau, nuit
- Dessus : aplat de la couleur de dessus ; nuance de quelques % en grandes taches (±6 % sur ~9 blocs, comme R1) ; sous la hauteur 2, tire vers l'ambiance. Plus de touffes, sable pointillé, pavés en pixels ; au plus un motif large très peu contrasté.
- Falaises : couleur de côté en dégradé vertical, claire sous la lèvre, plus sombre et bleutée au pied ; 2 ou 3 strates larges, jamais de lignes d'un pixel ; lèvre claire au sommet.
- Eau : `mer` de cielDe ; plus clair près des rives, plus profond au large ; quelques reflets horizontaux longs et rares. Îles du Ciel : plancher de nuages de leur palette.
- Nuit : retirer le voile uniforme rgba(16,24,64) ; la 2D prend les couleurs de nuit de la palette (light=0 et entre-deux), bleu de crépuscule, jamais noir. Étiquettes, repères, flèche, fantômes restent vifs.

P2 bords, ombres, états
- Franges entre sols : bord ondulé doux, 2 à 4 festons par tuile, couleur du sol qui mord ; pas de liseré noir.
- Rebords de plateau : garder trait sombre dehors + reflet clair dedans ; trait en Nuit océan #142B38, même force.
- Écume : bande continue Brume #E5EBE3 à bord ondulé, une épaisseur ; figée avec « Réduire les animations ».
- Ombres : mêmes places ; bleutées (ambiance du ciel), bord adouci, opacité ≤ actuelle ; soleil en haut à gauche.
- Île verrouillée : délavé vers la Brume, pas vers le gris ; nom et cadenas restent.
- Fantômes : bleuté + pointillé blanc gardés ; lisibles sur sable, neige, pierre claire, jour et nuit.

P3 décor en sprites : mêmes formes ; 2 ou 3 aplats de couleurDeMatiere (clair en haut à gauche, ombre bleutée en bas à droite) ; contour en teinte sombre de la matière, pas noir. Personnages hors R7 (lot R6).

Ne bouge pas : projection, taille des cases, gestes et zones de clic ; lecture des hauteurs ; étiquettes, repères et contraste ; sans ?rendu=archipeo la 2D pixel est identique pixel pour pixel ; « Réduire les animations » ; contraste élevé.

Critères sur les captures « après » : 1) même île en 2D et 3D ; 2) aucun pixel isolé ni bruit, bords nets ; 3) chaque marche et falaise se lit, chemin distinct du sol ; 4) nuit bleue et lisible, repères aussi contrastés que le jour ; 5) en gris, île verrouillée distincte, fantôme visible sur chaque sol ; 6) étiquettes et panneau au contraste d'aujourd'hui ; 7) sans drapeau, identique à « avant ».
