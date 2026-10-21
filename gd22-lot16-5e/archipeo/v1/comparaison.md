# GD-22, lot 16 du 5e : les Nacelles et le Détour du Perchoir

Captures en 1024 × 768 (JPEG) sauf mention, sur le commit 4113310e (branche `claude/project-thread-ookljw`). Méthode : `vite` en local, rendu logiciel, horloge pilotée et hasard fixe (`scripts/prise-de-vue.mjs`), Archipéo, `?monde=ouvert&rendu=archipeo`. Script : `captures16.mjs` et `lib.mjs` (même dossier). État de sauvegarde préparé : tout le 5e construit et relié (`toutConstruit`), sauf les Nacelles (île `technology-5e-design`) qui ont 0, 1, 2, 3 ou 4 missions jouées (parties posées par `poserLesParties`, une trace par mission jouée) ; le Perchoir pas encore trouvé. Kéo est posé par `standAt` près de la caméra (le sol ne se dessine qu'autour de lui), puis la caméra est posée à la main par `view` (face : depuis le sud, un peu en hauteur ; de dos : depuis l'ouest de la cour, regard à l'est le long de la halle, comme la planche ; trois-quarts : au-delà du coin nord-est du quai, regard au sud-ouest). La caméra de marche ne change pas. Pas de nuit (le monde ouvert du 5e n'en a pas).

Interprétation à noter : « de dos » est pris comme sur la planche (vue le long de la façade, la halle à droite), le piton fermant le nord ; le « trois-quarts » regarde au sud-ouest et non plein sud, pour garder la halle et le mât dans l'image.

## La planche validée
- 00-planche-validee.jpg : copie de `concepts/selection-nacelles-v1.jpg` (ruine de face et de dos en haut, restauré de face et de dos en bas). Vues plongeantes, lieu sur un éperon ; le jeu est à hauteur de Kéo, sur le plateau.

## Le cap de « Y aller » et la ruine
- 01-cap-de-y-aller-ruine.jpg : après « Y aller » (fiche fermée), Kéo sur la chaussée devant la cour, la halle au milieu. On voit le portique et ses poulies de travers, le mât couché (pas de mât debout), un rouage debout à gauche, la nacelle couchée à droite et le panneau de toit tombé à plat sur le quai, la perche de la lanterne de la câbliste (une seule lanterne ocre). Écarts : le trou rond aux goujons est à peine lisible (un point sombre sous le toit) ; la lanterne éteinte de la halle est aussi visible sous la poutre.
- 01-ruine-de-face.jpg : même chose, un peu plus haut et plus large, Kéo devant la porte : cour de dalles chaudes fendues et affaissées à droite, un rouage fendu à gauche. Écart : le piton est beige chaud et plat, nettement plus pâle et moins gris que sur la planche ; les ombres de la cour sont très larges et sombres.

## Les parties
- 02-apres-le-corps-1-sur-2.jpg : cour remise à plat (dalles à joints nets), quai refait, deux rouages entiers, la caisse à outils fermée au pied. La poutre de façade est posée avec une fine ligne verte (le motif de racines, presque invisible), mais les lames hautes, les poulies et la nacelle manquent encore (le portique reste de travers).
- 02-apres-le-corps-2-sur-2.jpg : les trois poulies pendues, la première nacelle (panier) dans son portique côté est, le touret de câble (trace) ; toit encore ruiné (panneau plat). Pas de câble ni de mât.
- 03-apres-le-haut.jpg : toit de bardeaux, mât debout à gauche, deux câbles qui partent vers le haut (sortent du cadre), lanterne de la halle allumée près du trou rond ; le pot de grès au pied du mât est minuscule. Deux lanternes allumées (halle et perche) ; pas de nacelle sur un câble.
- 04-restaure-de-face.jpg : abords posés : la seconde nacelle dans son portique à l'est, la barrière basse, le sac de chevilles et le maillet à droite, la lanterne de la perche. Un message « Aucune mission à faire ici pour l'instant. » couvre le bas de l'écran (interface). Écarts avec la planche : la bande de racines en vert-de-gris est un simple trait mince, pas la large bande de la planche ; la rampe de dalles vers le quai n'est pas visible de face ; le piton pâle ; la caisse est sans engrenage (voulu).

## De dos, de trois-quarts
- 05-ruine-de-dos.jpg : depuis l'ouest : le piton à gauche, la halle ouverte, le mât couché en deux tronçons sur le quai, un rouage, la perche allumée, le panneau de toit à plat ; l'aiguille de décor au fond à droite. Le pan de toit tient encore sur son côté ouest. Rien d'étrange sur les câbles.
- 05-restaure-de-dos.jpg : le mât debout au premier plan, le quai neuf, la nacelle dans son portique, la barrière et les deux lanternes au fond à droite. La bande de racines est très mince ; la façade ouest de la halle est un grand aplat orange.
- 05-ruine-trois-quarts.jpg : en ruine, la scène vue de près : le mât couché, planches et panneau de toit. Une longue ligne sombre part du haut du mât vers le haut à droite (hors du lieu) : à vérifier, la ruine ne doit rien envoyer hors du lieu (voir 05-ruine-de-haut.jpg). Image encombrée par le premier plan.
- 05-ruine-de-haut.jpg (vue en plus) : de haut, le plan entier : halle, mât et rouages à gauche, nacelle couchée et panneau de toit à droite ; une seule lanterne ocre. Aucune ligne qui sort du lieu n'y apparaît.
- 05-restaure-trois-quarts.jpg : le premier plan est pris par une nacelle et son portique, la façade ouest de la halle en aplat brun à droite ; le mât avec ses deux câbles (un à gauche, un à droite) en haut ; Kéo au fond sur la chaussée. Encombrée, mais tout est de la même cohérence.

## La scénette
- 06-scenette-cabliste.jpg : la câbliste (modèle fixe, à droite) et Kéo (à gauche) sur la cour, la halle, les rouages et les poulies derrière ; le panneau de l'item à gauche (« Ici, on tend les câbles. »). Pas de silhouette humaine ni de lettre dans la 3D. À noter : la scène est prise par l'application tantôt en « Vue simple » (le panneau couvre tout), tantôt en vue de scène ; cette prise est en vue de scène (le script clique « Scène » au besoin).
- 06-scenette-390x844-opendyslexic-32.jpg : 390 × 844, OpenDyslexic 32 : le panneau couvre toute la scène (« Lis … », l'item en grand, trois réponses en boutons, « Un indice »), le bouton « Scène » en haut. Texte coupé en bas (le bandeau grisé « Fonction… »). Écart général, pas propre au lot : le titre « La câbliste » est dans une petite étiquette serrée au-dessus du texte.
- 06-scenette-390x844-opendyslexic-32-scene.jpg : après « Scène » : le récit de la câbliste (« Ici, on tend les câbles. ») en grand, qui couvre encore presque toute la scène ; « Lis la phrase ou le » est coupé en bas.

## Le Détour du Perchoir
- 07-perchoir-arrivee.jpg : Kéo arrive sur la dalle (quatre tuiles aux joints sombres), vue plongeante du Détour, sente de planches sombres à gauche, la chaussée en haut, l'aiguille en gros plan à gauche ; « Le Perchoir » écrit en haut ; l'étiquette « Les Nacelles » reste à gauche. Écart : le muret est presque invisible (une ligne grise derrière Kéo) ; seule la lanterne d'ocre au coin est lisible ; le mur de nuages n'est pas visible.
- 07-perchoir-vu-du-chemin.jpg : la sente, Kéo de dos au pied de l'aiguille, les trois blocs du muret (nord, bas) et la lanterne d'ocre sur son coin, les pierres plates dehors, la terre des Aiguilles qui s'étend à gauche vers l'horizon ; « Le Perchoir » écrit en haut. Rien ne dit « Détour » avant d'y arriver, le nom étant déjà écrit parce que Kéo y est arrivé (le Détour est trouvé en y marchant).

## La Carte
- 08-carte-ruine.jpg : « Les Nacelles ▲ » est le lieu suggéré (liseré), sans ✓ ; Kéo (« Toi ») juste au sud ; les autres lieux ont leur ✓ (l'étiquette couvre le lieu).
- 08-carte-restaure.jpg : « Les Nacelles ▲ ✓ ».

## Les câbles
- 09-cables-de-loin.jpg : restauré, depuis la chaussée au sud, vu large (champ 80) : le mât de la halle et ses deux câbles, l'un vers l'aiguille de gauche, l'autre vers celle de droite, tendus et courbes, au-dessus de la plaine ; aucune nacelle ne glisse sur un câble ; ils passent haut au-dessus du chemin sans le croiser à hauteur de marche. Écart : l'ancrage de gauche se perd derrière un nuage de roche, et celui de droite sort du cadre.

## Ce qui ne va pas, ou reste à juger
1. La bande de racines en vert-de-gris de la poutre de façade est un trait fin, bien moins lisible que la grande bande de la planche (02 à 05).
2. Le piton est beige chaud et plat, loin du gris à pans de la planche ; ses ombres de dalles sont très larges (01 à 04).
3. Le trou rond du signe de l'absence se lit à peine de face (un point sombre) ; ses goujons ne se voient pas.
4. Le muret du Perchoir se lit mal à l'arrivée (07) ; le mur de nuages n'apparaît pas.
5. 05-ruine-trois-quarts : une longue ligne sombre part du haut vers la droite, hors du lieu ; à vérifier contre l'intention (rien ne sort du lieu en ruine).
6. Le message « Aucune mission à faire ici pour l'instant. » et le bouton « Y aller » couvrent le bas des vues de la restauration (interface habituelle).
7. En 390 × 844, OpenDyslexic 32, le panneau couvre toute la scène (déjà noté aux lots précédents).
