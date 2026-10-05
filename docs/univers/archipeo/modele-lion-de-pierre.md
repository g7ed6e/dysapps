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

- **De trois-quarts, la tête vers l’élève**, comme sur le concept (vu de l’avant gauche, le corps qui file à droite) : au défi, la caméra est déjà de trois-quarts, il y reste droit ; dans le monde, où la caméra regarde l’îlot de face, il se tourne de 35° (`tour`, comme la Diligence).
- **Deux modèles** (décision du mainteneur) : **700 triangles dans le monde** (la sentinelle de la Carte et de l’archipel, à l’échelle des sentinelles, environ quatre blocs de haut), **1 500 au gros plan de l’écran du défi**. Dans le monde, il tient dans la place du Gardien en cubes de son îlot (7 × 8 cases).
- **Le lichen en taches.** Le lichen épars de TRELLIS.2 est oublié ; quatre taches au défi (deux sur les mèches de droite vues de la caméra du défi, une en bas à gauche de la crinière, une grande sur l’épaule), la seule tache de l’épaule dans le monde ; jamais à moins de 0,25 bloc d’une veine.
- **La crinière qui se rallume.** Au défi, huit veines d’or sur la crête des huit mèches de devant (deux au sommet de la tête, deux par joue : la tempe et le bas de la joue, deux sur le poitrail), de la racine vers la pointe. Elles suivent les arêtes saillantes du maillage ; le jeu y plie un ruban d’or à cheval sur la crête, posé sur un serti sombre plus large (#403D38, qui ne s’allume jamais). À hauteur des yeux, une veine horizontale près du museau se lisait comme une moustache : les mèches de la joue choisies sont celles de la tempe et du bas de la joue. Dans le monde, à 700 triangles, pas de veines : la pierre qui se réchauffe suffit.
- **Le contraste de l’or** (référent dys). En niveaux de gris, l’or #FFD866 ne fait que 2,5:1 sur la pierre grise et 1,6:1 sur le Sable de la pierre rallumée ; sur son serti, 7,9:1. Le serti déborde de l’or des deux côtés : l’or se lit à plus de 3:1, éteint, en cours de défi ou rallumé (`statues/lion.test.ts`). L’allumage est le fondu commun des sentinelles, sans flash.
- **Les orbites** sont les deux facettes déjà sombres des yeux du modèle, peintes de la couleur des orbites (#45423D, jamais allumée) : ni creusées davantage, ni gueule ouverte.
- **Le quai.** Par défaut, la dalle du concept sert de quai : pas de socle octogonal commun, pas de flamme (proposition du directeur artistique, que le mainteneur tranchera). `QUAI_DU_LION = 'socle'` (`statues/lion.ts`) pose à la place le Lion et sa dalle, réduits, sur le socle commun, la flamme devant ses pattes.

## Le budget

| | Triangles | Appels de dessin |
| --- | --- | --- |
| Le Lion dans le monde | 700 (183 pour le Lion redessiné) | 0 de plus : fondu avec les neuf autres Gardiens |
| Les dix Gardiens des Premiers Rivages | 2 243 (1 726 avant) ; enveloppe portée de 1 800 à 2 300 | 1 |
| Le Lion au défi | 1 692 : 1 500, plus 192 pour l’or et le serti des huit veines (24 arêtes de crête) | 1 (la scène du défi) |

La somme des enveloppes des Premiers Rivages passe de 58 500 à 59 000, sous les 60 000 des tablettes.
