# Les modèles 3D des personnages d’Archipéo

Chaque personnage passe d’une image de concept (ce dossier, `<nom>.webp`) à un modèle 3D brut, puis à un modèle réduit et peint au budget du jeu. Le dépôt garde le modèle retravaillé ; le brut est gardé dans la Bibliothèque du projet (`archipeo/personnages-3d/bruts/<nom>.glb`, décision du mainteneur, 9 octobre 2026), pour ne jamais avoir à refaire un passage : le brut coûte un passage sur TRELLIS.2, pris sur le quota du compte du mainteneur.

Les modèles du 6e sont dans le jeu, dans l’univers Archipéo : de près dans le défi, les fiches et sur l’île où l’on est, de loin ailleurs dans l’archipel (lus par `src/game/world/characters/imported/`, voir [Les fichiers](../../../architecture/fichiers.md)). Le jeu les tourne face à l’élève (un quart de tour par modèle, relevé dans `models.ts`) : le passage dans Blender n’a pas à les tourner. Un dossier sans ses deux fichiers garde le personnage dessiné en code.

## Où sont les fichiers

Un dossier par personnage, `modeles/<nom>/`, du même nom que son image de concept :

| Fichier | Ce que c’est |
| --- | --- |
| `final-1500.glb` | Le modèle retravaillé à environ 1 500 triangles : la version vue de près. Un Gardien est sans socle, chaque facette peinte en pierre `#8E8C84` ; une créature garde ses couleurs, ramenées à quatre. |
| `final-200.glb` | Le même à environ 200 triangles : la version vue de loin. |
| `controle.png` | Le rendu de contrôle : le brut aligné, la version 1 500 et la version 200, côte à côte. |

[`modeles/reglages.csv`](modeles/reglages.csv) donne, pour chaque personnage, la hauteur où couper le socle et le quart de tour éventuel.

Les Gardiens (coupe du socle en part de la hauteur, triangles des deux versions) :

| Gardien | Coupe | 1 500 | 200 |
| --- | --- | --- | --- |
| Lion de pierre (Baie, 6e) | 0,12 | 1 397 | 193 |
| Taureau de terre (Ferme, 6e) | 0,16 | 1 219 | 164 |
| Hanneton de bronze (Plaine, 6e) | 0,12 | 1 304 | 267 |
| Dune vivante (Carrière, 6e) | 0,12 | 1 229 | 159 |
| Grand chêne (Forêt, 6e) | 0,12 | 1 334 | 197 |
| Amphore peinte (Fouille, 6e) | 0,07 | 1 355 | 288 |
| Automate de laiton (Hangar, 6e) | 0,12 | 1 325 | 173 |
| Coucou de bronze (Horloge, 6e) | 0,12 | 1 365 | 164 |
| Alambic de verre (Laboratoire, 6e) | 0,12 | 1 278 | 160 |
| Golem de roche (Mine, 6e) | 0,12 | 1 312 | 174 |
| Castor de glaise (Pointe, 6e) | 0,12 | 1 187 | 165 |
| Brochet d’argent (Rivière, 6e) | 0,12 | 1 131 | 149 |
| Chouette de verre (Tour, 6e) | 0,12 | 1 316 | 168 |
| Cerf des sous-bois (Vallée, 6e) | 0,12 | 1 305 | 164 |
| Dragon de cendre (Volcan, 6e) | 0,12 | 1 226 | 144 |

Les créatures (sans socle, rien à couper) :

| Créature | 1 500 | 200 |
| --- | --- | --- |
| Robin (Baie, 6e) | 1 500 | 200 |
| Rouxel (Carrière, 6e) | 1 500 | 200 |
| Bloquette (Ferme, 6e) | 1 500 | 200 |
| Mousso (Forêt, 6e) | 1 500 | 198 |
| Silex (Fouille, 6e) | 1 500 | 200 |
| Pince (Hangar, 6e) | 1 500 | 230 |
| Tick (Horloge, 6e) | 1 500 | 200 |
| Bulle (Laboratoire, 6e) | 1 666 | 400 |
| Tunel (Mine, 6e) | 1 500 | 200 |
| Coco (Plaine, 6e) | 1 500 | 200 |
| Boussole (Pointe, 6e) | 1 500 | 200 |
| Nénu (Rivière, 6e) | 1 500 | 200 |
| Grimoire (Tour, 6e) | 1 500 | 208 |
| Fougère (Vallée, 6e) | 1 500 | 200 |
| Lavi (Volcan, 6e) | 1 500 | 200 |

À reprendre : la version 200 de l’Amphore peinte est trouée ; Bulle (des débris flottent au-dessus de la tête) et Grimoire (débris sous la carapace) ; Coco est tournée de côté, l’alignement sur le socle ne sert pas aux créatures.

## Passer du concept au modèle brut

Le Space [microsoft/TRELLIS.2](https://huggingface.co/spaces/microsoft/TRELLIS.2) (licence MIT) tourne sous le compte Hugging Face du mainteneur, avec les réglages du Lion (résolution 512, texture 1024). Il se lance à la main sur le Space, ou depuis un script avec `gradio_client` (`/start_session`, `/preprocess_image`, `/image_to_3d`, puis `/extract_glb`), le jeton du mainteneur étant posé par l’environnement. Un passage prend environ 40 secondes de calcul sur le quota du compte. Le `.glb` est rangé tel quel dans la Bibliothèque du projet, sous `archipeo/personnages-3d/bruts/<nom>.glb`.

## Passer du brut au modèle retravaillé

Les scripts sont dans [`scripts/rendu/modeles/`](../../../../scripts/rendu/modeles/). `lot.py` enchaîne les quatre autres sur tout un dossier :

1. `aligner.py` pose le socle à plat, le centre et met son grand côté sur l’axe nord-sud (plus un quart de tour si le réglage le demande) ;
2. `lion_lowpoly.py` referme le maillage, le réduit à 1 500 puis à 200 triangles (s’il cale loin de la cible, sur un feuillage ou des pièces fines, il remaille plus gros et recommence) et peint chaque facette : en pierre `#8E8C84` pour un Gardien (le lichen de l’image ne passe pas : c’est le code qui le pose sur le Gardien éteint, décision du mainteneur du 8 octobre 2026), de la plus proche des quatre couleurs principales de sa texture pour une créature (nom en `-creature-`) ;
3. `couper.py` coupe le socle d’un Gardien à la hauteur réglée, puisque le socle octogonal commun vient du code (une créature n’a pas de socle) ;
4. `rendre_controle.py` fait le rendu de contrôle.

On réduit avant de couper : la réduction cale sur un modèle déjà coupé.

Pour refaire un personnage, copier son brut de la Bibliothèque (`<nom>.glb`) dans un dossier de travail, avec `reglages.csv`, puis :

```sh
blender -b -P scripts/rendu/modeles/lot.py -- <dossier de travail>
```

Sans Blender, le module Python `bpy` suffit (Python 3.11, `pip install bpy numpy`) : `python scripts/rendu/modeles/lot.py -- <dossier de travail>`. Sous Linux, il faut aussi la bibliothèque `libegl1` pour le rendu de contrôle. Le résultat sort dans `<dossier de travail>/prets/<nom>/` avec un `recapitulatif.csv` : y prendre `final-1500.glb`, `final-200.glb` et `controle.png`.

Si le socle n’est pas entièrement parti, ou si les pattes sont coupées, changer la hauteur dans `reglages.csv` et relancer (le Taureau, au socle plus haut, coupe à 0,16).

## À reprendre au modèle 3D

Les retouches propres à chaque personnage (barbe des Sphinx, fils épaissis, yeux repeints…) sont dans la [fiche des concepts](README.md#à-reprendre-au-modèle-3d). Chaque modèle retravaillé passe ensuite par le directeur artistique et le référent dys, sur captures, avant d’entrer dans le jeu.
