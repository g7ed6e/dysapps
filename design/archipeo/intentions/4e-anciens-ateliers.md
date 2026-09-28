# Les Anciens Ateliers (4e) : l’intention du sous-lot R4b-4e

Voir d’abord `commun.md`. Îles : Forge des puissances, Atelier du calcul littéral (le port), Falaise des accords, Cabinet des mots, Théâtre, Gare.

## 1. L’intention

La maîtrise : un grand atelier ancien qu’on remet en marche, dans une lumière de fin de journée. En arrivant, l’élève comprend qu’ici on construit du lourd : une grue au-dessus du chantier, un fourneau qui rougeoie, et au loin un petit volcan qui fume tranquillement. C’est chaleureux et actif, jamais une ruine sinistre.

## 2. Les repères signatures

- **L’atelier-forteresse en chantier et ses échafaudages** (R5), le héros de l’archipel, sur l’île de l’Atelier (le port).
- **La grue de bois** (R4b, île de l’Atelier, hors de la grille, de 120 à 150 triangles, sans appel de plus).
  - Sur une case où l’on ne marche pas, sur le flanc droit du cœur, un peu en avant de la mi-profondeur (à 7 cases du bord avant : au milieu, le mât passait sous le bouton de l’archipel dans la vue de l’île ; écart validé par le directeur artistique le 28 septembre 2026), hors du quai et de la route du navire.
  - Mât en treillis `#884D40`, 9 cases de haut et 1 case de section.
  - Flèche `#9C7C4B` de 6 cases, à 0,7 de la hauteur, tournée vers le coin avant de la zone des plans ; contre-flèche de 2 cases avec un contrepoids de pierre.
  - Décidé par le directeur artistique le 28 septembre 2026, sur les captures de R4b-4e : au fond, à 11 cases et 0,85, la flèche était à la hauteur des noms (posés à 12 cases au-dessus du cœur) et passait derrière celui de l’Atelier.
  - Câble et crochet immobiles. C’est la seule verticale fine de l’archipel.
- **Le fourneau de la Forge** (R4b, dans l’emprise de 2 × 2 du haut-fourneau de Blocland).
  - Maçonnerie tronconique de pierre `#6F473D`, 5 cases de haut, de 1,7 à 1,2 case de section, deux cerclages de métal rouillé `#AF6C55`.
  - Une gueule voûtée en bas, de 0,8 × 1 case, sur la face vue par la caméra, qui rougeoie dans les lueurs `#E8662C`, sans pulser, sans scintiller, sans varier par à-coups avec le degré de nuit. Sur une île fermée, elle reste éteinte et délavée, comme la lanterne du phare : elle rougeoie une fois l’île ouverte, et la remise en marche garde son avant et son après. Elle compte dans les lueurs sous 5 % de l’image.
  - Trois volutes minces au sommet. Plus bas que la tour de l’atelier de R5.
- **Le volcan lointain** (R4b, par `lointain.ts`, environ 150 triangles).
  - Cône tronqué à 9 pans, roche `#6A5048`, de 15 à 18 blocs, de 80 à 120 cases derrière le bout droit de la crête.
  - Panache de 5 volutes, dans l’appel des fumées. Pas de lueur au cratère.
  - Dans la vue de l’archipel, il paraît plus petit que la grue. Il se distingue du volcan du 6e (proche, une fumée mince sortie du flanc).
- **Deux rangs de crêtes lointaines chaudes** (`#8A6E78`, puis `#C89A88`), pâlis par la brume.

## 3. Le relief

- **Partie 1** : aucun changement. La silhouette vient du bâti, de la grue, de l’horizon et du volcan.
- **Partie 2, facultative, après U2** : le pic de la Forge devient une butte à sommet plat (hauteur 5, rayon 5), pour ne plus être le jumeau de celui de la Mine (6e). La Falaise garde ses deux pics : ils deviennent propres au 4e quand le 5e et le 3e quittent ce modèle.
- **En gris**, la silhouette tient à une crête basse et découpée, une masse bâtie (R5), une verticale fine en Γ (la grue) et un petit cône qui fume au fond.
- **Sans U2** : rien, la partie 1 suffit.

## 4. Le décor à retirer ou à redessiner (Archipéo seulement, partie 1)

- **Le haut-fourneau** (basalte, lave au sommet) devient le fourneau de maçonnerie. Il se lisait comme un second volcan, et sa fumée frôlait le nom « Forge des puissances ».
- **Les aiguilles d’ardoise en mer** deviennent des écueils bas, une case au plus au-dessus de l’eau, de `#57504C` à `#3E3636`, avec de l’écume. Le semis sur la Carte est moins dense (reporté de R4 ; toujours à faire après R4b-4e, qui ne change que la forme des écueils).
- **Les rochers de la Forge** passent en pierre chaude (point 5, reporté de R4).
- **Le commentaire de `palette.ts`** qui dit que le volcan du 4e « fume et rougeoie » se corrige : aucune lueur au cratère.
- **La neige des pics de la Falaise** se peint en roche chaude claire (point 5) : pas de sommets blancs comme au 3e.

## 5. L’ambiance (`ambianceDe('4e')`)

- Le ciel de R1 reste : zénith `#355F98`, horizon `#D8B088`, lueur `#F2B878`, soleil `#FFD8A6` à 2,4, ambiance de force 1,0. Le couchant se fait par l’horizon ambré, jamais par le contre-jour ; on ne le pousse pas plus loin (l’orange est la couleur de l’anglais).
- Brume de profondeur 90 / 300 et voile `#C48C5C` à 0,10 (inchangés).
- Sols : herbe `#6F8A3A` / `#6A5040` ; roche `#7A7068` / `#57504C` ; neige `#CCBFB0` / `#9A8E84` (R4b-4e : `#9A8E84` passe aux côtés, pour qu’un mur de marbre se détache de la roche claire par son contour en 2D, 3:1 ; décidé par le directeur artistique le 28 septembre 2026 : ce beige chaud et clair ne se lit pas comme une neige blanche).
- Mer `#21606E` (inchangée). Ardoise `#3E3636`.

## 6. La fumée

- La règle unique vaut pour le fourneau et pour le volcan.
- Le haut des volutes du fourneau reste sous le bas du nom « Forge des puissances », dans la vue d’une île et dans la vue de l’archipel. Sinon, le fourneau passe à deux volutes.
- La teinte commune de la fumée, peut-être un peu plus grise, se règle à la revue d’ensemble : c’est une règle commune.
- Pas de bancs de brume.

## 7. Ce qui est interdit

- L’orange comme seul code du 4e ; un horizon plus orange que celui de R1 ; un ciel rouge.
- La lave ; une lueur au cratère ; un volcan proche ou plus haut que la grue.
- Des sommets enneigés.
- Le phare ; les bancs de brume ; des pitons dressés dans la mer.
- Un autre repère vertical qui ferait concurrence à la grue.

## 8. Les captures et les critères d’acceptation

- **Captures** : les 21 déclarées (l’île montrée est la Forge), l’arrivée en voyage, et l’Atelier de jour et de nuit.
- **Critères** :
  - La flèche de la grue et les fumées (fourneau et panache du volcan, qui dérive derrière les îles du fond) ne chevauchent aucune étiquette, ni la flèche, ni le bonhomme, dans la vue de l’archipel comme sur la Carte.
  - Le volcan paraît plus petit que la grue dans la vue de l’archipel.
  - Aucune case de sol n’est blanche.
  - Les lueurs (la gueule, plus les fenêtres de R5 à la revue d’ensemble) couvrent moins de 5 % des captures de nuit.
  - Les deux captures « Réduire les animations » sont identiques.
  - Le test en gris est réussi, d’abord sans R5, puis à la revue d’ensemble.
  - Le budget est tenu, par poste.

## 9. L’enveloppe du décor (9 000 triangles, 3 appels)

- Décor actuel, fourneau compris : 3 450 ; grue : 150 ; volcan : 150 ; fumées (8 volutes) : 250 ; crêtes lointaines : 1 400 ; marge : 3 600.
- Appels : le décor, la grue et le lointain ; les lueurs ; les fumées. Tous sont pris : rien ne s’ajoute hors de ces trois maillages.
- Mesuré avant le sous-lot (tout construit) : sol 20 258 / 1, mer 3 294 / 1, faune 1 176 / 3, décor 3 451 / 3. Le sol n’a que 2 742 triangles de marge : pas de gros relief.

## 10. Pour le mainteneur

Rien. U2, avancé par le mainteneur (voir `commun.md`), ne sert ici qu’à la butte facultative de la Forge.

## Pour R5

- **L’atelier-forteresse** est sur l’île de l’Atelier, pas sur la Forge.
- **Les échafaudages** suivent la restauration (ils disent qu’un plan est en chantier).
- **Les lueurs de forge** aux fenêtres s’allument progressivement, jamais d’un coup.
- **Aucune grue ni grand échafaudage dans les autres archipels** : un chantier ailleurs se lit par des caisses et des planches au sol.
- **Propositions du consultant d’Archipéo, validées** : des archives taillées dans la Falaise, niches et portes de bois reliées par des galeries accrochées à la paroi ; des rails de wagonnets qui descendent vers le quai à la Gare.

## Pour Blocland

Rien ne change. Le haut-fourneau, les aiguilles d’ardoise, les pics et l’ambiance restent. La grue et le volcan sont du décor d’Archipéo, hors de la grille.
