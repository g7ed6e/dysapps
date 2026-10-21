# Lot 16 : captures v3 (commit e83295fc, remis sur preview après le Gaillard #493)

Prises sur le code commité par `captures16.mjs` (+ `lib.mjs`, groupes g0a, g4a, g4b, g5, gR), Chromium de /opt/pw-browsers, horloge maîtrisée, 1024 × 768. Comparées à `captures-v2/` (commit 2d6acd57).

| Capture | Ce qui change depuis captures-v2 |
| --- | --- |
| 01-cap-de-y-aller-ruine | Neuve en v3 (nouvelle vue d'arrivée, `doorFrame` des Nacelles) : la caméra monte de 1 et recule de 1,6 fois, sans plonger plus ; la ruine, le piton et le moignon sont entiers dans le cadre ; le mur de pierre derrière la halle est maintenant visible. Kéo à sa place. |
| 04-restaure-de-face | Vue fixe de face, la même qu'en v2 : sur la remise sur `preview`, rien ne change dans le lieu (forêt retaillée et chaussées ailleurs ; le sol autour est celui de `preview`). |
| 04-cap-de-y-aller-restaure | Neuve : le mât de 11 sort de ce que montrait la caméra qui suit (haut à 146 pixels au-dessus du cadre) ; avec `doorFrame` il est à 64 pixels du haut avec ses deux câbles, la halle et le piton entiers. |
| 06-scenette-cabliste | Inchangée (la scénette ne lit pas `doorFrame`). |
| 07-retour-de-la-scénette | Neuve : le retour (Pause, Quitter) lit `doorFrame` (`traceViewOf`) : vue plus reculée (20,8 au lieu de 15) et plus haute (12 au lieu de 11), Kéo et la liste inchangés ; on voit la halle entière, au lieu de son seul rez. Le mât n'est pas posé à cette étape (une mission jouée). |

Mesures (tests) : mât 146 px au-dessus du cadre sans vue d'arrivée, 64 px du haut avec (1 024 × 768) ; en portrait 390 × 844 le mât, à 7 à gauche de la porte, sort par la gauche (rognage de côté déjà admis au Gaillard) ; au retour, le Gaillard garde ses cheminées dans le cadre.
