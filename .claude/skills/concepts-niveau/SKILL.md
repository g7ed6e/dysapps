---
name: concepts-niveau
description: Concevoir les concepts 2D d'un niveau d'Archipéo (fiche, plan des lieux, prompts, vue globale guidée par le plan, vues de près) sur le Mac du mainteneur avec Z-Image Turbo. À lire avant de générer les concepts d'un niveau ou d'un lieu.
---

# Les concepts d'un niveau

La méthode a été mise au point sur le 6e, du 12 au 13 octobre 2026, dans le fil « Challenger l'univers d'Archipéo » ([GD-19](../../../docs/gameplay/propositions/GD-19.md)). C'est de l'idéation : on ne touche pas au code. Pas de TRELLIS ni de maquette Blender sans un mot écrit du mainteneur, et rien ne se supprime sur son Mac sans son accord.

On conçoit un niveau à la fois, et chaque étape se valide avant la suivante. Le premier niveau sert de modèle aux autres.

## 1. La fiche du niveau

Une page, rangée dans `docs/univers/archipeo/intentions/` (celle du 6e, Les Premiers Rivages, sert de modèle), qui donne :
- l'idée en une phrase et trois couleurs ;
- le grand lieu, qu'on voit dès l'arrivée ;
- chaque lieu, avec sa raison d'être, ce qu'on y fait, son habitant (son métier), sa pièce maîtresse (le cœur du lieu, que les Ferrailleurs ont récupérée) et sa ruine de départ ;
- l'équipier qui embarque et ce que font les Ferrailleurs.

Le directeur artistique et le consultant Archipéo l'écrivent ; le directeur du contenu rattache toutes les missions de `docs/contenu/` aux lieux ; le référent dys la relit. Les règles :
- deux lieux n'ont jamais la même initiale ;
- aucun homophone gênant, aucune ligature ;
- rien à lire dans la 3D.

## 2. Le plan des lieux

Un dessin en aplats, sans recherche de beauté : la forme de l'île, qui est relié à qui, ce qui est au-dessus de quoi, ce qu'on aperçoit avant d'y aller. Le niveau est une grande île continue, que l'équipage peut parcourir à pied, et non des îlots sur une grille. Le plan validé par le mainteneur est la référence : on ne s'en écarte plus.

## 3. Le socle de prompt

- Un socle commun à toutes les images du niveau (style low poly en aplats, caméra, lumière, matières), puis un paragraphe par lieu qui nomme l'objet qui le fait reconnaître.
- Des mots positifs seulement : Z-Image n'a pas de prompt négatif.
- Aucune statue ni figure gardienne : les Veilleurs sont abandonnés (15 octobre 2026) et les moaï écartés. Le lieu se reconnaît à son mécanisme (une lentille, des vannes, une presse), tombé ou manquant, puis remis en place.
- Un lieu demandé seul se pose sur son propre îlot : il faut le placer « sur un bout de rivage », ou mieux, partir de la vue globale (étape 5).
- Pour les Ferrailleurs : pas d'uniforme (graphite et prune dépareillés, un liseré clair, du bronze récupéré), un remorqueur diesel sans voile ni mât, le Rafiot. « Mast » ou « sail » dans le prompt fait revenir le mât : décrire « a wide flat diesel tugboat with a crane and a tall exhaust pipe ».

## 4. La vue globale, guidée par le plan

Sur le Mac (16 Go), avec Z-Image Turbo et mflux 0.20.0, environ 3 minutes par image :

1. **Le guide** : nettoyer le plan (étiquettes, pastilles et routes retirées ; chaque couleur ramenée à la plus proche des couleurs connues), dessiner chaque lieu en forme simple, puis incliner le tout en perspective. Exemple : `guide3.py`, dans la Bibliothèque du projet, sous `archipeo/univers-challenge/niveaux/zimage-6e/v3/`.
2. **La génération à partir du guide** :
   ```sh
   ~/.local/bin/mflux-generate-z-image-turbo --base-model z-image-turbo \
     --model deepsweet/Z-Image-Turbo-6B-MLX-Q4 --low-ram \
     --width 1024 --height 1024 --steps 9 --seed <graine> \
     --image <guide.png> 0.3 --output <sortie.png> --prompt "$(cat prompt.txt)"
   ```
   Le dosage va de 0 (aucune influence) à 1. À 0,3, l'image suit le plan en vraie 3D. 0,25 donne la même image que 0,3 (le dosage est arrondi par paliers). Dès 0,45, l'image recopie les aplats du plan.
3. **Le montage** : une image tient 13 ou 14 lieux sur 16. On fait donc plusieurs prompts et graines (42, 2026, 7, 11), on monte les meilleures zones avec un masque flou, puis on repasse le montage à 0,7 pour fondre les raccords. Si un lieu manque encore, on le colle depuis une autre image.
4. **La planche** : le plan et la vue globale côte à côte, pour que le mainteneur vérifie que chaque lieu est là.

Qwen-Image-Edit a été essayé puis abandonné : 30 Go de mémoire au pic, soit 1 h à 1 h 30 par image sur le Mac, et des îles déformées. Ses poids ont été supprimés du Mac.

## 5. Les vues de près et les autres vues

- **Un lieu** : le découper dans la vue globale, l'agrandir, puis le repasser à environ 0,4-0,5 avec le prompt du lieu. Il garde ainsi les bâtiments, les couleurs et la lumière du monde.
- **D'autres vues globales** : incliner le guide sous un autre angle ; varier jour et nuit, état éteint et état rallumé.
- **Pour TRELLIS, plus tard et seulement sur un mot du mainteneur** : une image par objet, isolé sur un fond uni, vu de trois quarts, en aplats francs, sans partie fine ni décor qui déborde (voir le skill `modeles-3d`).

## 6. Les fichiers et le Mac

- Les images ne vont jamais dans le dépôt. Elles vont dans la Bibliothèque du projet, sous `archipeo/univers-challenge/niveaux/<niveau>/`, avec leurs prompts et une planche JPEG.
- Sur le Mac, on travaille dans `~/generation/<sujet>/`, par Remote Control depuis `/Users/guillaumedelahaye/src/dysapps`. Le fil « Copier les concepts d'Archipéo » copie entre le Mac et la Bibliothèque, dans les deux sens.
- Les PNG sont convertis en WebP de qualité 90 (`~/generation/webp.py`).
