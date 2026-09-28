# Les Îles Brumeuses (5e) : l’intention du sous-lot R4b-5e

Voir d’abord `commun.md`. Îles : Glacier des relatifs, Marché des proportions (le port), Carrefour des homophones, Marais des temps, Comptoir, Manoir.

## 1. L’intention

L’exploration : on devine plus qu’on ne voit. En arrivant par la mer, l’élève voit des crêtes de roche en gradins sortir d’une brume claire, des tours de pierre sur les hauteurs, et au loin d’autres masses à peine dessinées. Il a envie d’aller voir derrière. Rien n’est inquiétant : la brume est claire, jamais sombre.

## 2. Les repères signatures

Aucun n’est partagé avec un autre archipel.

- **Les bancs de brume en couches** (R4b, en mer libre).
  - Deux ou trois couches étagées, de `#E5EBE3` en haut à `#C5D9EB` en bas, dans un maillage translucide d’un appel de dessin.
  - Seulement là où le filtre de `seaDecor` laisse la mer libre : jamais sur une île, un ouvrage, le quai, la route du navire ou les places de la baleine.
  - Toujours sous le sol des îles. Sur la Carte, à la moitié de leur opacité.
- **Les masses lointaines** (R4b, `lointain.ts`, hors de la grille).
  - Trois ou quatre masses en gradins, dans la mer, de 60 à 120 cases derrière l’archipel, de 18 à 28 blocs de haut.
  - Au moins 1,6 fois plus hautes que larges à la base, en gradins de 2 à 3 blocs, avec un sommet plat et moussu. Jamais de pointe en obus.
  - Roche lointaine `#6895AD`, puis une chaîne de cimes très pâles, `#A9C4D4`, aux sommets `#E6EEF2`.
- **Les tours et les ruines de pierre** `#7D8A86`, sans aucune lueur (R4b, de 60 à 110 triangles chacune).
  - **Carrefour** : une tour carrée en ruine, 3 cases, toit d’ardoise `#224C5F` effondré.
  - **Marais** : une tour d’archives trapue, carrée, penchée d’environ 8°, 3,5 cases de haut, le pied dans les roseaux et dans des éboulis qui couvrent toute l’emprise du champignon de Blocland.
  - **Masse lointaine centrale** : une tour carrée de 5 cases au toit d’ardoise, comme sur la planche, sans chemin, sans quai et sans lueur, pâlie par la brume comme sa masse.
- **La calotte de sérac du Glacier** (R4b) : un bloc de glace pâle `#E5EBE3`, facetté, sur le sommet du plus haut pic seulement, sur moins d’un quart de sa hauteur, au-dessus de la brume. Le nom de l’île reste vrai.
- **Les ponts de pierre et de bois** (R5, décidé par le mainteneur) : voir « Pour R5 ».

## 3. Le relief (partie 2, après U2)

- **Crêtes en gradins sur l’anneau du fond** : Glacier 11 et 8 (il garde deux sommets), Carrefour 8, Manoir 9, Comptoir 7.
- **Le Marché** (le port) et **le Marais** restent bas : ils font le creux de la ligne et gardent le quai lisible.
- **Forme** : des gradins de 2 à 3 blocs, en retrait de 0,5 à 1 case. Le sol coûte environ 1 300 triangles de plus (environ 19 100 au total).
- **En gris**, la silhouette tient à des verticales massives et irrégulières, une bande claire en bas (la brume) et des crêtes pâles au fond.
- **Sans U2** : les pics actuels du Glacier restent. La silhouette passe par les masses lointaines, la calotte et la couleur de la neige.

## 4. Le décor à retirer ou à redessiner (Archipéo seulement, partie 1)

- **Le champignon géant du Marais** devient la tour d’archives penchée.
- **L’aiguille de glace du Glacier** devient un bloc d’éboulis de pierre de 2 × 2 cases, 2,5 cases de haut au plus.
- **Les plaques de glace en mer** deviennent des roches moussues : 0,3 case au-dessus de l’eau, écume autour, dessus `#5A7E50`.
- **La neige du sol** se peint en roche claire et froide (point 5) : au Glacier, le sol devient neige dès 2 blocs, et partout dès 5 blocs (`map.ts`) ; sans cela, les gradins mettraient de la neige au premier plan. La seule glace blanche est la calotte.

## 5. L’ambiance (`ambianceDe('5e')`)

- Ciel de jour : zénith `#6F9FC2`, horizon `#C5D9EB`, lueur `#E5EBE3`.
- Soleil `#F4F2EA`, force 2,0. Ambiance du ciel `#D2E2EE`, du sol `#64848E`, force 1,2 : une lumière diffuse de matin froid.
- Brume de profondeur 70 / 260 (inchangée). Voile `#A9C2CC`, force 0,11.
- Sols : herbe `#5A7E50` / `#6A6A5A` ; roche `#8C9894` / `#6A7F86` ; neige `#B9C4C4` / `#93A2A4` (une roche claire) ; glace `#C9D8DC` / `#9FB4BA`.
- Mer `#23789C` (inchangée). Ardoise `#224C5F`.

## 6. La brume et la fumée

- Les bancs suivent `respirationDeLaBrume`, avec l’opacité de la couche du bas à 0,6 au plus.
- « Réduire les animations » les fige d’un coup.
- Aucune fumée au 5e dans R4b.

## 7. Ce qui est interdit

- Des pitons lisses en obus ; une brume plate, sombre, ou qui monte sur une île.
- Du blanc de neige sous le sommet du Glacier.
- Un volcan ; le phare du modèle.
- Une bannière ou une lanterne au sommet d’une tour (c’est la tour de guet de la Mine, au 6e) ; une tour fine et ronde.
- Des terrasses régulières (celles du 3e) ; une passerelle suspendue ; un pont qu’on ne peut pas prendre.

## 8. Les captures et les critères d’acceptation

- **Captures** : les 21 déclarées (l’île montrée est le Glacier), l’arrivée en voyage, et le Marais de jour et de nuit.
- **Critères** :
  - La brume couvre au moins 50 % de la mer visible dans la vue de l’archipel, et aucune case de terre. Elle ne couvre jamais la route du navire pendant le voyage : le navire reste entier et visible. Sur la Carte, aucun banc ne passe sous une étiquette ni sous la flèche.
  - Au moins trois masses lointaines se lisent dans le haut de la vue de l’archipel ; sinon l’artiste technique 3D le signale et le directeur artistique tranche.
  - Aucune case de sol n’est blanche sous la calotte du Glacier.
  - Aucune tour ni masse ne cache une borne, un nom ou un cœur d’île.
  - Les deux captures « Réduire les animations » sont identiques.
  - Les lueurs couvrent moins de 5 % des captures de nuit.
  - Le test en gris est réussi.
  - Le budget est tenu : sol ≤ 23 000 / 1, mer ≤ 5 000 / 1, faune ≤ 1 500 / 3, décor ≤ 9 000 / 3, vérifiés par `budget.test.ts`.

## 9. L’enveloppe du décor (9 000 triangles, 3 appels)

- Décor actuel (arbres, rochers, écueils, roches moussues) : 5 100 ; lointain : 1 600 ; bancs de brume : 1 000 ; tours, ruine, calotte et éboulis : 500 ; marge : 800.
- Appels : le décor et le lointain ; la brume ; un appel libre.
- Mesuré avant le sous-lot (tout construit) : sol 17 826 / 1, mer 2 592 / 1, faune 912 / 3, décor 5 096 / 1.

## 10. Pour le mainteneur

Les deux questions sont tranchées par le mainteneur le 28 septembre 2026, sur la recommandation du directeur artistique :

- U2 est avancé (voir `commun.md`).
- **Le pont du 5e passe de R4b à R5.** Les ponts du 5e existent déjà comme ouvrages à construire. Un pont décoratif qu’on ne peut pas prendre serait une fausse promesse ; un pont restauré sert le monde (DP-09). La décision du mainteneur (un pont court et rigide, de pierre et de bois) est tenue, mais par les vrais ponts. C’est un écart à la frontière R4b / R5 du plan accepté.

## Pour R5

- **Les ponts à construire du 5e** (Marché–Marais, Marché–Comptoir, Marais–Manoir, Comptoir–Manoir) : un tablier droit et rigide de planches `#9C7C4B`, un garde-corps `#6E5234`, des culées de pierre `#7D8A86`. Les états avant et après la restauration se voient. L’état « à restaurer » se lit par la forme (tablier incomplet, planches absentes), pas par la seule couleur ; il ne ressemble jamais à un passage qu’on peut prendre, et le pont reste nommé comme les autres ouvrages dans l’interface. Le référent dys relit.
- **« Le phare du large »** : une tour ronde à feu ouvert, de pierre, sans bandes ni toit conique.
- **Propositions du consultant d’Archipéo, validées** : une échelle de marée de pierre et de bois, graduée sans chiffres, au Glacier ; un entrepôt de quai à mât de charge au Comptoir ; un manoir de pierre grise et d’ardoise aux volets clos, qui se rouvrent à la restauration.

## Pour Blocland

Rien ne change en partie 1. En partie 2, rien non plus si U2 passe avant. Le champignon, l’aiguille, les plaques de glace, les nappes en plans et l’ambiance restent ceux de Blocland.
