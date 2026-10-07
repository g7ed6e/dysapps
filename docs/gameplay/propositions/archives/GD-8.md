# GD-8 : Le gardien attend sur son lieu, et son défi le rallume

**État** : Décidée le 4 octobre 2026 (piste A+, le mot « rallumer ») ; construite le 4 octobre 2026 ; consolidée dans [le jeu](../../index.md), archivée le 4 octobre 2026
**Portée** : Commun (le dessin et les mots du gardien restent propres à chaque univers)

## Le constat

Le mainteneur, le 4 octobre 2026 : « place les gardiens sur les îles », puis « je préfère la sémantique de rallumer le gardien (Archipéo) plutôt que de les vaincre ».

Ce que faisait le jeu :

- **Chaque lieu a son gardien**, sur un îlot devant son lieu, avec une arène et des pas japonais.
- **Dans Blocland, le gardien ne se montrait qu’à la toute fin** : ni îlot ni gardien tant que chaque mission n’avait pas 2 étoiles. L’élève n’en voyait presque jamais. Vaincu, il devenait une statue de pierre grise.
- **Dans Archipéo**, il était déjà là dès l’ouverture du lieu, en sentinelle éteinte, et son défi la rallumait (lot 6) : l’inverse de Blocland.

## La proposition

Trois pistes (directeur artistique, coûts mesurés par l’artiste technique 3D) :

- **A.** Le gardien sur son îlot dès l’ouverture du lieu, éteint, rallumé par son défi.
- **A+.** A, plus le moment du rallumage : pendant le défi, chaque épreuve réussie lui rend une part de ses couleurs ; au retour dans le monde, la caméra glisse vers lui et il se rallume en fondu, avec un mot.
- **B.** Le gardien sur la terre du lieu, sans îlot. Écartée : sur 29 lieux sur 31, dont les quatre îles-écoles, il cachait une borne, l’école ou l’habitant (mesuré tout construit, vue du lieu).

Ce que l’élève voit avec A+ (retenue) :

1. **Le gardien est là dès que le lieu s’ouvre**, sur son îlot, éteint : dans Blocland, une statue de pierre grise ; dans Archipéo, la sentinelle éteinte. Pas de bulle tant que son défi n’est pas ouvert (« rien pour ce qui n’est pas encore possible »).
2. **Son défi s’ouvre** avec 2 étoiles dans chaque mission du lieu, comme avant : il porte alors sa bulle.
3. **Le toucher** ouvre sa fiche par-dessus le monde : avant son défi, ce qu’il attend, en une phrase qui ne rappelle aucun échec ; prêt, « Rallumer » ouvre le défi ; rallumé, il garde ses étoiles et son défi se rejoue.
4. **Le défi le rallume** : chaque épreuve réussie lui rend une part de ses couleurs (dans Blocland, des pieds vers la tête), une épreuve ratée n’éteint rien. Réussi, il reprend toutes ses couleurs.
5. **Au retour dans le monde**, la caméra glisse vers lui et il se rallume en fondu, avec un mot écrit et lu ; une fois par gardien et par appareil, trois au plus à la suite ; d’un coup quand l’appareil demande moins d’animations.
6. **Le mot est « rallumer »** dans les deux univers (le directeur artistique proposait « réveiller » pour Blocland, dont les gardiens n’ont pas de flamme ; le mainteneur garde « rallumer »). Plus de « vaincre », de « revanche » ni d’« arène » à l’écran.

## Ce qui ne bouge pas

- Le défi lui-même (ses manches, ses 70 %, ses étoiles), le seuil de 2 étoiles par mission, l’îlot et sa place, la sauvegarde (le défi réussi reste la seule trace ; le moment vu se garde par appareil, comme le mot de la baleine).
- DP-01 et DP-02 (restaurer, jamais combattre), jusqu’ici propres à Archipéo, valent maintenant pour les deux univers.
- Un gardien ne fait jamais de commande et ne ferme jamais une liaison (GD-7).

## Le coût

Mesures de l’artiste technique 3D (`npm run rendu:budget`, scripts sur `worldCubes` et `guardianPlacements`), 6e :

- **Le pire cas tout construit ne change pas** : 78 640 triangles, tous les gardiens y sont déjà.
- **En partie** : +2 700 triangles et +7 appels au départ ; +14 200 triangles et +47 appels quand tous les lieux sont ouverts (71 300 triangles en tout), sous le pire cas.
- **Travail** : moyen. Le monde de Blocland montre les gardiens en attente et inverse la pierre et les couleurs ; le fondu et les couleurs partielles en cubes ; les textes de Blocland en « rallumer » (31 gardiens, libellés, mot de la grande étape) ; la fiche du gardien ; le manuel.

## Les avis

- Directeur artistique : recommande A, puis A+ si le mainteneur veut le moment ; propose « réveiller » pour Blocland.
- Artiste technique 3D : A tient le budget ; B sans place sur 29 lieux.
- Consultant de Blocland, consultant d’Archipéo, référent dys, consultant UX UI : à la relecture de la pull request qui construit la fiche.

## La décision

4 octobre 2026, mainteneur : « je préfère la sémantique de rallumer le gardien (Archipéo) plutôt que de les vaincre », puis « A+ ».

7 octobre 2026, amendement par [GD-9](../GD-9.md) (choix 4a, 5a et 6a du mainteneur) : le Gardien devient détachable. Son îlot peut se tenir n'importe où dans sa région, à 4 cases d'eau au moins de tout lieu, et ne suit plus son lieu ; sa fiche nomme son lieu, « Rallumer » y ouvre le défi sans trajet du bonhomme. Le Gardien d'un lieu fermé reste caché. Le reste de cette fiche ne change pas.
