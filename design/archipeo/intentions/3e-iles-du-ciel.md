# Les Îles du Ciel (3e) : l’intention du sous-lot R4b-3e

Voir d’abord `commun.md`. Îles : Belvédère de Thalès, Phare (le port), Observatoire des données, Observatoire des textes, Studio, Château. L’archipel garde le nom « Îles du Ciel » et son plancher de nuages jusqu’au lot 8 : R4b-3e n’anticipe pas L’Horizon (ni mer, ni quais maritimes, ni baleine).

## 1. L’intention

L’accomplissement : on voit loin. En arrivant, l’élève voit au centre de l’arc le grand phare, le plus haut du jeu, sur son socle de salles, au-dessus d’une mer de nuages, devant un massif enneigé. Il reconnaît le phare de ses débuts, en plus grand : le chemin parcouru se lit dans le décor.

## 2. Les repères signatures

- **Le grand phare** (R4b, île du Phare), le seul élément partagé, avec le 6e.
  - Le modèle de `world/decor/phare.ts`, entrée `PHARES['3e']` : H = 11, r = 1,2. Le fût est vérifié contre les valeurs mesurées au 6e (environ `#DDCCAE` au soleil, `#B0AA9A` à l’ombre).
  - **Le site actuel est gardé** : le coin arrière droit de l’île, au centre de l’arc. « Au sommet de l’île en gradins » n’est pas possible sans changer la grille. C’est un écart à la règle 1 de la fiche de famille, pris par le directeur artistique ; la revue d’ensemble le confirme.
- **Le socle de salles**, en pierre de taille `#DBDADD`, ombres `#5A7BA5`. Autre écart à la règle 1 : **3 × 3 cases au lieu de 4 × 4**, parce qu’un socle de 4 × 4 couvrirait une case du cœur.
  - Deux étages en gradins : des salles de 3 × 3 cases sur 2 de haut, puis une salle de 2 × 2 sur 1 de haut, soit 3 cases de haut. Des baies cintrées sombres, de la neige sur les terrasses.
  - Il couvre les deux cases bloquées aujourd’hui, et sinon seulement des cases où l’on ne marche pas. Jamais une case du cœur : un test le vérifie.
- **Le massif enneigé continu** (R4b, par `lointain.ts`, de 800 à 1 500 triangles).
  - Une crête irrégulière, au moins 1,2 fois plus large que l’arc des îles, de 80 à 150 cases derrière, de 14 à 30 blocs de haut. Construit : deux rangs, 14 blocs à 80 cases et 18 blocs à 110 cases, cols hauts (0,55 à 0,75 de la hauteur) pour que la neige fasse une bande continue.
  - Roche `#7E8AA8`, ombres `#47598C`, neige `#E5EBE3` au-dessus de 55 % de la hauteur.
  - Dans la vue de l’archipel, la lanterne se détache sur la bande claire de l’horizon (plancher et ciel), jamais sur la roche du massif. Toute la crête tient dans le cadre, sous la barre du haut, avec du ciel au-dessus. En hauteur du monde, la lanterne est le point le plus haut des îles ; le massif est un fond. (Décision du directeur artistique du 28 septembre 2026, à la relecture de R4b-3e : « sa crête reste sous la galerie » n’est pas tenable avec la caméra du jeu, qui regarde vers le bas : tout objet lointain se projette au-dessus de la lanterne.)
- **Le plancher de nuages** `#DDE3E8` (aujourd’hui `#E0E6F2`), un blanc bleuté, jamais sable.
- **L’oiseau planeur** (R4b, dans `world/faune.ts`, un appel de dessin, 150 triangles au plus).
  - Un seul oiseau, de 3 cases d’envergure, ailes fixes, aux couleurs des oiseaux communs, qui tourne au-dessus du massif, derrière l’arc des îles, à hauteur de la galerie du phare, plus haut que tous les autres oiseaux, en 24 s au moins par tour, à vitesse constante, sans à-coups ni battement d’ailes.
  - Sa ronde reste tout entière au-dessus du massif : jamais devant la lanterne, jamais sur une île. Il vole seul.
  - Il ne tourne pas au-dessus d’une île : le lot 9 prévoit des oiseaux qui signalent la zone active, et un oiseau qui tourne toujours au-dessus de la même île serait pris pour ce signal.
  - Figé avec « Réduire les animations », dans une pose hors des étiquettes. Il ne passe jamais devant ni derrière une étiquette, la flèche ou le bonhomme.
- **Pas de baleine** jusqu’au lot 8.

## 3. Le relief (partie 2, après U2)

- **L’île du Phare** : aucun gradin possible (son anneau ne fait que 3 cases). Ses gradins sont le socle.
- **L’Observatoire des textes** (juste derrière) reçoit trois gradins réguliers sur l’anneau du fond : 2 blocs chacun, en retrait de 1,5 case, neige sur celui du haut. Ils sont derrière son cœur et ne cachent jamais ses quatre bornes, leurs étiquettes ni son nom. Aucune borne n’est au pied d’un gradin.
- **Le Belvédère** perd ses deux pics, jumeaux de ceux du Glacier et de la Falaise, pour un dôme bas en gradins de 6 blocs.
- **Les autres îles** restent basses et arrondies.
- **En gris**, la silhouette tient à une pyramide régulière coiffée d’une verticale fine, une bande blanche continue au fond et un bas clair.
- **Sans U2** : le socle en gradins et le massif portent la silhouette seuls ; les pics du Belvédère restent.

## 4. Le décor à retirer ou à redessiner (Archipéo seulement, partie 1)

- **L’actuel grand phare** (pierre à bandes de neige, toit de prisme) est remplacé par le modèle sur son socle.
- **Les nappes des sommets** sont refaites en un seul maillage translucide d’un appel de dessin, environ 300 triangles, au lieu de six plans qui coûtent six appels non comptés. Une seule couche plate qui se fond dans le plancher, jamais des couches étagées comme au 5e. Blocland garde ses six plans.

## 5. L’ambiance (`ambianceDe('3e')`)

Un bleu franc : plus de lavande.

- Ciel de jour : zénith `#3A86CC`, horizon `#B4D2EC`, lueur `#EEF3F4`.
- Soleil `#FFF4E2`, force 2,3. Ambiance du ciel `#D4E4F6`, du sol `#8C9CBE`, force 1,05.
- Brume de profondeur 110 / 350. Voile `#DCE8F2`, force 0,05.
- Sols : neige `#E6ECEF` / `#C4D0DE` ; roche `#A3A7AD` / `#6E7896` ; herbe `#74A064` / `#6C6250`.
- Plancher de nuages (mer de jour et teinte de la mer) : `#DDE3E8`. Ardoise des rives `#2E505E`, dessus enneigé `#E5EBE3`.

## 6. La brume

Les nappes suivent `respirationDeLaBrume` et se figent d’un coup avec « Réduire les animations ». Aucune fumée au 3e.

## 7. Ce qui est interdit

- Un deuxième phare du modèle ou une lanterne à bandes dans l’archipel.
- Le village à colombages ; le lagon ; la mer (jusqu’au lot 8).
- Des couches de brume étagées ; un horizon ou un voile lavande.
- Une baleine ; le massif qui passe derrière la lanterne.
- Au Refuge des carnets (LV2-5) : papillon de décor, pigeon, lettre ou carnet à lire, chalet en bardeau à balcon, toit en bardeau, lanterne allumée de plus, lagon turquoise ; rien de vertical qui fasse concurrence au phare.

## 8. Les captures et les critères d’acceptation

- **Captures** : les 21 déclarées (l’île montrée est le Belvédère), l’arrivée en voyage, l’île du Phare de jour et de nuit, et les deux phares au même cadrage.
- **Critères** :
  - La teinte de l’horizon et du voile est entre 195° et 215°.
  - Dans la vue de l’archipel, la lanterne se détache sur la bande claire de l’horizon, jamais sur la roche du massif ; toute la crête tient dans le cadre (voir §2).
  - Le fût se lit en gris contre la neige et le plancher : un contraste d’au moins 1,3:1 avec son fond direct, sinon ce sont les bandes qui portent la silhouette.
  - Proportions et couleurs identiques au 6e.
  - Aucune case du cœur sous le socle.
  - Les nappes coûtent un seul appel.
  - Avec « Réduire les animations » (la préférence de l’appareil), rien ne bouge, oiseau compris. Plus de capture dédiée depuis le 28 septembre 2026 : la vidéo sur tablette le montre.
  - Les lueurs couvrent moins de 5 % des captures de nuit.
  - Le test en gris est réussi. Le budget est tenu, par poste.
  - Avec le Refuge des carnets (LV2-5) : vue de l’archipel avec une LV2 et avec « Pas de LV2 » (Refuge fermé, sans pont, cadrage du Château d’avant), en 1024 × 768, 1280 × 800 et 800 × 1280 ; le phare reste au plus à 60 % de la vue, la ronde de l’oiseau reste au-dessus du massif, jamais au-dessus du Refuge, et la règle du massif (au moins 1,2 fois plus large que l’arc) se mesure avec lui ; le Papillon en gris depuis la caméra du jeu ne se lit ni en croix ni en trèfle.

## 9. L’enveloppe du décor (9 000 triangles, 3 appels)

- Décor actuel : 2 500 ; phare et socle : 350 ; massif : 1 500 ; nappes : 300 ; marge : 4 350.
- Appels : le décor et le massif ; les lueurs ; les nappes.
- Dans le poste faune, l’oiseau planeur ajoute 150 triangles et 1 appel (le 3e n’a pas de baleine).
- Mesuré avant le sous-lot (tout construit) : sol 19 288 / 1, mer 4 104 / 1, faune 1 252 / 2, décor 2 500 / 2.

## 10. Pour le mainteneur

Rien de propre au 3e. Les deux écarts à la règle 1 (le site, le socle de 3 × 3) sont du ressort du directeur artistique ; le mainteneur peut les rouvrir.

## Pour R5

- **Retirer le phare du décor du cœur** de l’île du Phare (`world/decor.ts`, entrée `phare`), dans Archipéo seulement : le 3e n’a qu’un phare. Blocland le garde ; le consultant de Blocland relit.
- **Les plans des îles du Phare et de l’Observatoire des textes** se dessinent en tours de pierre de taille, sans le modèle du phare : lanterne sans bandes, toit d’ardoise enneigé, pas de cône en terre cuite.
- **Les toits** sont enneigés (règle 2 de la fiche de famille).
- **Propositions du consultant d’Archipéo, validées** : une coupole d’astronomie de pierre claire à l’Observatoire des données ; une salle des archives à verrière à l’Observatoire des textes ; un mât de télégraphie en bois haubané au Studio ; une bannière en terre cuite et des créneaux discrets au Château.

## Pour Blocland

Rien ne change. Le grand phare de Blocland, les nappes en plans, l’ambiance lavande et les pics du Belvédère restent. Les gradins de l’Observatoire des textes et du Belvédère attendent U2.
