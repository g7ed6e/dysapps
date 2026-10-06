# Le Lion de pierre : fiche du modèle importé

Le Lion de pierre, Gardien de la Baie des mots (anglais 6e), est le seul personnage d’Archipéo qui ne soit pas dessiné par le code : il est tiré d’un modèle 3D généré à partir de son concept validé. Cette fiche dit d’où il vient, comment il est entré dans le jeu et ce qu’on y a retouché. Le cadre : les assets générés sont permis s’ils ont une fiche (outil, prompt, réglages, licence), tiennent le budget, sont servis hors ligne par l’application, et sont validés par le directeur artistique et le référent dys (décision du mainteneur du 30 septembre 2026). La version redessinée en code a été écartée parce qu’elle dénaturait le concept (consigne du mainteneur : « simplifier mais pas dénaturer »).

## D’où il vient

| Étape | Outil | Réglages | Licence |
| --- | --- | --- | --- |
| Concept 2D (essai 5) | Z-Image Turbo | le prompt ci-dessous | Apache 2.0 |
| Mise en volume | TRELLIS.2 | image de l’essai 5, résolution 512, graine fixe, décimation à 100 000 faces, texture 1 024 | MIT |
| Réduction et peinture | Blender (bpy 5.0), `scripts/rendu/lion-de-pierre/reduire_lion.py` | remaillage en voxels (0,006 de la plus grande dimension), réduction à 700 et à 1 500 triangles, une couleur par facette ramenée à la pierre #8E8C84 ou au lichen #7A8A6A (seuil de vert 12), sans texture ni UV | code du dépôt |
| Conversion pour le jeu | `scripts/rendu/lion-de-pierre/convertir.mjs` (`npm run rendu:lion`) | voir « Dans le jeu » | code du dépôt |

Le modèle brut de TRELLIS.2 (95 000 triangles, 3,4 Mo) n’est pas dans le dépôt ; ses deux réductions, `lion-700.glb` (81 Ko) et `lion-1500.glb` (172 Ko), sont à côté des scripts, dans `scripts/rendu/lion-de-pierre/`. Aucun des deux n’est servi par l’application : elle ne charge que leurs données converties.

### Le prompt du concept (essai 5)

> Low-poly game concept art of a stone lion guardian statue, lying down with its belly on the pedestal, front legs stretched forward, head raised. Seen from its front-left corner: face, chest, both front paws and the long left flank visible, tail curled on the pedestal along the flank. Calm, dignified expression, neutral closed mouth. The mane is exactly eight very large, wide, flat stone plates, clearly separated, swept backward around the face and neck like a stiff collar; no thin blades, no layered strands. Nothing on the head: no headdress, no crown, no ornament, no beard. The head is faceted like the body, with shallow hollow eye sockets in soft shadow, no eyeballs, no eyelids. Clean paws, no extra parts. Few large flat facets, one flat matte color per facet, smooth untextured surfaces, no cracks. Uniform warm neutral grey stone #8E8C84. Two flat dull sage-green lichen facets #7A8A6A on the lion's back, none on the mane. Low regular octagonal slab pedestal. Plain light neutral grey background, soft diffuse light from top left. Mature, serious, not cute, not Egyptian, no text.

L’image a donné une dalle rectangulaire plutôt qu’octogonale ; c’est elle qui sert de quai (plus bas).

## Le format : des données pures, pas un .glb servi

Décision de l’artiste technique 3D. Les deux modèles sont convertis en données TypeScript produites par un script et commitées (`src/game/world/characters/statues/lionData.ts`), plutôt que servis en `.glb` et chargés par un `GLTFLoader` :

- **Le même chemin que les autres Gardiens.** Le Lion devient une statue comme les autres (`statues/lion.ts`) : des triangles peints de pierre, de lichen, d’orbite et de lueur, fondus dans le maillage unique des Gardiens de l’archipel (un appel de dessin), avec le même allumage, la même nuit, le même portrait en polygones sans WebGL et les mêmes tests sous jsdom, sans WebGL ni chargement asynchrone.
- **Hors ligne sans rien de plus.** Les données sont dans le paquet JavaScript que le service worker met déjà en cache ; pas de requête, pas de ressource à ajouter au précache, rien qui puisse manquer au premier lancement sans réseau.
- **Plus léger.** Sommets soudés et arrondis au millième de bloc : 45 Ko de source pour les deux modèles, 19 Ko compressés (gzip), contre 253 Ko pour les deux `.glb` (positions en flottants, normales et couleurs à chaque coin), et sans ajouter le `GLTFLoader` de Three.js au paquet.

Le prix : un nouveau modèle demande de relancer `npm run rendu:lion` (`--check` dit si le fichier produit ne suit plus ses modèles ou ses retouches).

## Dans le jeu

Le script tourne le modèle d’un demi-tour (le museau vers −Z, le visage des sentinelles), le pose les pieds en 0, centré, à **six blocs de haut, dalle comprise** (décision du mainteneur du 1er octobre 2026), soude les sommets, puis applique les retouches du directeur artistique et du référent dys, sans toucher à la forme :

- **La dalle sur l’axe nord-sud**, dans le monde comme au défi (décision du mainteneur du 6 octobre 2026) : le modèle n’est jamais tourné. Le modèle réduit a déjà sa dalle droite (à un demi-degré près, mesuré sur ses sommets du bas), le museau vers le nord du modèle (−Z) ; le tour de 35° qu’il prenait dans le monde est retiré. Au défi, la caméra de trois-quarts le montre comme le concept.
- **Deux modèles** (décision du mainteneur) : **700 triangles dans le monde** (la sentinelle de la Carte et de l’archipel, à l’échelle des sentinelles, environ quatre blocs de haut), **1 500 au gros plan de l’écran du défi**. Dans le monde, il tient dans la place du Gardien en cubes de son îlot (7 × 8 cases).
- **Le lichen en taches.** Le lichen épars de TRELLIS.2 est oublié ; quatre taches au défi (deux sur les mèches de droite vues de la caméra du défi, une en bas à gauche de la crinière, une grande sur l’épaule), la seule tache de l’épaule dans le monde ; jamais à moins de 0,25 bloc d’une veine.
- **La crinière qui se rallume** (deuxième relecture du directeur artistique, 6 octobre 2026). Au défi, quatre veines d’or droites, une par mèche : la tempe et le bas de la joue, de chaque côté ; aucune sur le sommet de la tête ni sur le poitrail. Chacune est un segment droit, indépendant du maillage : le script relève la racine et la pointe de la mèche sur la vue de face, les projette sur la pierre, pose entre elles une bande plate tournée comme la mèche, puis la lève juste assez pour qu’elle ne s’enfonce nulle part sous sa largeur (de 0,06 à 0,12 bloc selon la mèche) ; il refuse une veine qui couvre moins de 60 % de sa mèche (mesurée sur ses facettes tournées du même côté). Dans le jeu, une bande d’or affinée vers la pointe, sur une bande de serti plus large qui la déborde de tous côtés, bouts compris. Les veines sont **légèrement émissives** : 60 % de leur allumage vient de la lueur (`LION_VEIN_GLOW`), le reste garde l’ombre de leur facette ; la flamme brille pleinement. À hauteur des yeux, une veine horizontale près du museau se lirait comme une moustache : celles du bas de la joue descendent vers l’extérieur. Dans le monde, à 700 triangles, pas de veines : la pierre qui se réchauffe suffit.
- **Le serti suit l’allumage** (directeur artistique, 6 octobre 2026). Éteint, il a la couleur de la pierre : pas de trait sombre sur la crinière éteinte. Il s’assombrit avec les lueurs des veines jusqu’à #403D38, plus vite qu’elles : il est sombre dès la première réussite du défi (le premier pas des lueurs, 0,3, `degreDuSerti`), pour que l’or s’y lise dès qu’il paraît. Les rubans pliés sur les crêtes, qui laissaient un pointillé sombre sur le poitrail (le serti à demi enfoncé), ont disparu avec les veines du poitrail.
- **Le contraste de l’or** (référent dys). En niveaux de gris, l’or #FFD866 ne fait que 2,5:1 sur la pierre grise et 1,6:1 sur le Sable de la pierre rallumée ; sur son serti, 7,9:1. Sur les couleurs peintes, facette par facette, chaque bande d’or se lit à 3:1 au moins sur son serti, de la première réussite (lueurs à 0,3) à la victoire, la pierre éteinte puis rallumée (`statues/lion.test.ts`). L’allumage est le fondu commun des sentinelles, sans flash ; le visage ne change pas.
- **Le cadrage du défi.** La caméra du défi ne cadre que le Lion et sa flamme, au-dessus de la dalle (`LION_SLAB_TOP`, `framingPoints` dans `characters/portrait.ts`) : la dalle peut sortir du cadre. Dans la vitrine d’une tablette (140 px), la tête, crinière comprise, fait au moins 50 px de large et de haut (testé).
- **En attente du mot du mainteneur : les veines dérogent à R6.** Le gabarit des sentinelles (lot R6) veut une à trois lueurs qui courent sur la pierre ; quatre veines droites posées au-dessus de la crinière, indépendantes de sa forme, s’en écartent. Proposé par le directeur artistique le 6 octobre 2026, pas encore décidé.
- **Les orbites** sont les deux facettes déjà sombres des yeux du modèle, peintes de la couleur des orbites (#45423D, jamais allumée) : ni creusées davantage, ni gueule ouverte.
- **Le quai : la dalle et la flamme** (décision du mainteneur du 6 octobre 2026). La dalle du concept sert de quai, sans socle octogonal commun ; la coupe et la flamme communes, à 0,8, sont posées sur la dalle, au milieu, entre son bord et le museau (`FLAMME_SUR_LA_DALLE`, `statues/lion.ts`), et s’allument avec les veines ; la dalle reste de pierre, de jour comme de nuit, et la flamme est la même pièce que celle des autres sentinelles (testé). 28 triangles de plus, aux deux modèles. `QUAI_DU_LION = 'socle'` poserait encore le Lion et sa dalle, réduits, sur le socle commun.

## Le budget

| | Triangles | Appels de dessin |
| --- | --- | --- |
| Le Lion dans le monde | 728 : 700, plus 28 pour la coupe et la flamme (183 pour le Lion redessiné) | 0 de plus : fondu avec les neuf autres Gardiens |
| Les dix Gardiens des Premiers Rivages | 2 271 (1 726 avant) ; enveloppe portée de 1 800 à 2 300 | 1 |
| Le Lion au défi | 1 544 : 1 500, plus 16 pour l’or et le serti des quatre veines (deux triangles par bande) et 28 pour la coupe et la flamme (1 720 avec les huit rubans d’avant) | 1 (la scène du défi) |

La somme des enveloppes des Premiers Rivages passe de 58 500 à 59 000, sous les 60 000 des tablettes.
