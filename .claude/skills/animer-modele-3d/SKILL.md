---
name: animer-modele-3d
description: Animer un modèle 3D d'Archipéo une fois terminé (créature, Kéo ou ado en pose A) : choisir le squelette, poser os et poids, écrire les gestes, contrôler en planche et en vidéo avec et sans texture. À lire avant de poser un squelette ou de juger une animation.
---

# Animer un modèle 3D terminé

À suivre une fois le modèle validé par le mainteneur (forme et texture ou aplats). La chaîne qui produit le modèle est dans le skill [`modeles-3d`](../modeles-3d/SKILL.md). Rien n'entre dans le jeu, ni budget ni pull request, sans le mot écrit du mainteneur. Les bruts TRELLIS et les fichiers de travail restent dans la Bibliothèque du projet, jamais dans le dépôt.

## 1. Choisir le squelette

| | `squelette.py` (9 os) | `squelette_humain.py` (17 os) |
| --- | --- | --- |
| Pour | les créatures et Kéo, bras qui pendent | un personnage en pose A qui doit courir, sauter, attraper, lancer (les ados de l'équipage) |
| Os | hanches, dos, tête, cuisse et tibia de chaque côté, un os par bras, une queue s'il y en a une | bassin, dos, tête ; épaule-bras, avant-bras, main ; cuisse, tibia, pied |
| Modèle | 1 500 triangles en aplats (`lot.py`, `aplats.py`) | brut TRELLIS allégé à environ 20 000 triangles, texture gardée (`alleger_brut.py`) |
| Animé par | le jeu (`src/game/three/paintedCharacters.ts`) | des poses d'essai dans Blender ; le jeu ne sait pas encore animer ces os |

Un personnage en pose A ne passe pas par `squelette.py` : le pivot de chaque bras y est posé à la largeur médiane du bras (`find_arms`), donc vers le coude quand le bras s'écarte. L'épaule se décolle alors du buste à chaque balancement. Les mains, qui descendent au niveau de l'entrejambe, restent en plus aux cuisses et se déchirent du bras. Le seul os du bras ne plie pas : ni attraper ni lancer. Pour faire entrer un ado dans le jeu, il faut donc soit des bras le long du corps (concept ou réglage `bras=`), soit étendre le jeu aux 17 os : une décision du mainteneur, avec le budget (un ado allégé pèse 7 000 à 10 000 triangles).

## 2. Le concept, déjà pensé pour l'animation

Le concept 2D décide de ce qui s'animera bien : pose A de face (bras écartés d'environ 30°, mains vides, jambes un peu séparées), accessoires plaqués au corps ou dans le dos, rien qui flotte. Avec Z-Image (pas de prompt négatif), le décrire en mots positifs : « standing in A-pose, arms slightly away from the body, empty open hands, feet apart, full body, front view ».

## 3. Créature ou Kéo : `squelette.py`

Les réglages, la planche (`apercu_squelette.py`) et l'ordre (`lot.py`, `squelette.py`, `aplats.py`, `yeux.py`) sont dans [`modeles-3d`](../modeles-3d/SKILL.md) (« Le squelette d'une créature »). Les gestes sont dans `paintedCharacters.ts` : `GESTES` (souffle, regard, queue, cycles de 4 s ou plus), `poseDeMarche` et `ALLURES` (l'allure propre d'une créature), `MARCHE_DE_KEO` et `poseDeKeo` (la marche de Kéo, à l'allure d'un enfant). `scripts/rendu/modeles/marche.py` les recopie pour les aperçus : changer les deux ensemble. Règles dys : rien ne bouge pendant une consigne, et « Réduire les animations » laisse une pose fixe.

## 4. Ado en pose A : `squelette_humain.py`

```
python3.11 scripts/rendu/modeles/alleger_brut.py -- <brut.glb> <allégé.glb> 20000 2048
python3.11 scripts/rendu/modeles/squelette_humain.py -- <allégé.glb> <sortie.glb> <planche.png> [réglage=valeur …] [video=<dossier>]
```

Le module `bpy` (Python 3.11) suffit, sans écran ; les messages « EGL Error » sont sans gravité. La vidéo demande `ffmpeg`.

- **Garder le brut.** Ne pas repeindre, ne pas réduire fort : 20 000 triangles gardent un ado fidèle, 8 000 passent, 3 000 cassent la forme. Le brut regarde déjà −Y : ne pas le tourner, le script l'exporte devant −X comme les modèles du jeu.
- **La doublure.** TRELLIS double les vêtements d'une peau intérieure qui perce au moindre geste. Le script retire chaque face dont aucun rayon ne sort du modèle. Il reste 7 000 à 10 000 triangles.
- **Les réglages** se lisent sur la planche, en hauteurs du modèle. Ceux de l'équipage (16 octobre 2026) :

| Ado | Réglages |
| --- | --- |
| Kéo | `sh_z=0.735 sh_x=0.1 hip_z=0.46` |
| Zia | `sh_z=0.72 sh_x=0.085 buste=0.095 tt_lib=0.15` |
| Malo (manteau long) | `menton=0.8 sh_z=0.73 sh_x=0.09 buste=0.1 tt_lib=0.15 epaule_r=0.13 jupe=0.045` |
| La radio | `sh_x=0.095` |
| Le naturaliste | (défauts) |

- **Les pièges des poids**, tous vus sur l'équipage :
  - avant-bras qui part seul quand le bras se lève : la peau du haut du bras est restée au buste ou au bassin. Abaisser `buste` et `sh_x`, mettre `tt_lib=0.15` ;
  - manche qui se déchire bras levé : le fondu buste → bras de l'épaule (`epaule_r`), plus large pour un manteau ;
  - manteau long qui se déchire entre les jambes : `jupe`, le pan suit à moitié le bassin, à moitié la cuisse ;
  - toiles entre jambe et jambe ou entre bras et buste : le script les coupe en gardant les sommets (`FACES_ONLY`), sur lesquels les poids sont posés.
- **Les poses s'écrivent en axes du monde**, jamais sur les axes locaux des os, inversés d'un os à l'autre : c'est ce qui faisait rentrer les bras dans le buste. Devant −Y, gauche +X :
  - bras ou jambe en avant `("X", -a)`, en arrière `("X", +a)` ; coude plié `("X", -a)` ; genou plié `("X", +a)` ;
  - bras écarté : gauche `("Y", -a)`, droite `("Y", +a)` ; buste penché en avant `("X", +a)` ; épaule droite qui recule `("Z", -a)` ;
  - l'autre côté : échanger `.L` et `.R`, changer le signe de Y et de Z (`miroir`) ;
  - lancer : écarter le bras à l'horizontale, puis lever l'avant-bras sur le même axe Y ;
  - accroupi : baisser le corps d'environ 0,17 et compenser le pied, qui reste à plat.

## 5. Contrôler : toujours avec ET sans texture

Le mainteneur juge chaque étape sur deux rangées : la texture (ou les aplats), puis un gris uni qui montre la forme seule (Workbench, `color_type` SINGLE). `squelette_humain.py` rend la planche des six poses (repos, marche, course, saut, attraper, lancer) en `<planche>.png` et `<planche>-gris.png`. Avec `video=<dossier>`, il rend aussi `<nom>.mp4` : 9 s, texture à gauche, gris à droite.

Regarder les images une à une avant d'envoyer, surtout en gris : bras qui rentre dans le buste ou qui tourne à l'envers, membre détaché, manche ou manteau déchiré, pieds qui flottent. Corriger, relancer, puis seulement livrer.

## 6. Livrer

Les .glb animés, les planches et les vidéos vont dans le dossier du lot dans la Bibliothèque. Dans le fil : une réponse courte, avec les fichiers joints, les nombres de triangles et les défauts qui restent.
