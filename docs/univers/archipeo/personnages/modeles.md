# Les modèles 3D des personnages d’Archipéo

Chaque personnage passe d’une image de concept (ce dossier, `<nom>.webp`) à un modèle 3D brut, puis à un modèle réduit et peint au budget du jeu. Le dépôt garde le modèle retravaillé ; le brut est gardé dans la Bibliothèque du projet (`archipeo/personnages-3d/bruts/<nom>.glb`, décision du mainteneur, 9 octobre 2026), pour ne jamais avoir à refaire un passage : le brut coûte un passage sur TRELLIS.2, pris sur le quota du compte du mainteneur.

Les modèles du 6e et de la 5e sont dans le jeu, dans l’univers Archipéo : de près dans le défi, les fiches et sur l’île où l’on est, de loin ailleurs dans l’archipel (lus par `src/game/world/characters/imported/`, voir [Les fichiers](../../../architecture/fichiers.md)). Le jeu les tourne face à l’élève (un quart de tour par modèle, relevé dans `models.ts`) : le passage dans Blender n’a pas à les tourner. Un dossier sans ses deux fichiers garde le personnage dessiné en code.

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
| Amphore peinte (Fouille, 6e) | 0,07 | 1 349 | 195 |
| Automate de laiton (Hangar, 6e) | 0,12 | 1 325 | 173 |
| Coucou de bronze (Horloge, 6e) | 0,12 | 1 365 | 164 |
| Alambic de verre (Laboratoire, 6e) | 0,12 | 1 278 | 160 |
| Golem de roche (Mine, 6e) | 0,12 | 1 312 | 174 |
| Castor de glaise (Pointe, 6e) | 0,12 | 1 187 | 165 |
| Brochet d’argent (Rivière, 6e) | 0,12 | 1 131 | 149 |
| Chouette de verre (Tour, 6e) | 0,12 | 1 316 | 168 |
| Cerf des sous-bois (Vallée, 6e) | 0,12 | 1 305 | 164 |
| Dragon de cendre (Volcan, 6e) | 0,12 | 1 226 | 144 |
| Griffon d'émail (Bourg, 5e) | 0,12 | 1 415 | 206 |
| Sphinx des routes (Carrefour, 5e) | 0,12 | 1 465 | 212 |
| Reine du marché (Comptoir, 5e) | 0,12 | 1 284 | 174 |
| Libellule de jade (Delta, 5e) | 0,12 | 1 426 | 200 |
| Mammouth de givre (Glacier, 5e) | 0,12 | 1 340 | 189 |
| Spectre du manoir (Manoir, 5e) | 0,12 | 1 271 | 185 |
| Hydre des marais (Marais, 5e) | 0,12 | 1 347 | 190 |
| Colporteur (Marché, 5e) | 0,12 | 1 419 | 186 |
| Cheval à bascule (Menuiserie, 5e) | 0 (garde ses patins) | 1 512 | 214 |
| Tortue d'ocre (Prairie, 5e) | 0,12 | 1 401 | 199 |
| Diligence de cuivre (Relais, 5e) | 0,12 | 1 475 | 214 |
| Flamant de sel (Saline, 5e) | 0,12 | 1 307 | 172 |
| Hirondelle de nacre (Préau, 6e) | 0,12 | 1 336 | 182 |
| Oie d’opale (Fournil, 5e) | 0,17 | 846 | 128 |
| Phénix d’argile (Grotte, 5e) | 0,11 | 1 335 | 156 |

Les créatures (sans socle, rien à couper). Leurs fichiers sont peints en aplats clairs par `aplats.py` (voir plus bas), d’après les couleurs choisies par le directeur artistique le 10 octobre 2026 dans la colonne « aplats » de `reglages.csv`. Écart connu : Robin n’a pas la gorge orange de son concept (aucune de ses quatre couleurs ne la porte) ; elle attend un lot qui touche la géométrie. Les créatures de la 5e sont peintes de même, d’après les couleurs choisies par le directeur artistique le 10 octobre 2026. Écarts connus : chez Sillon, le chapeau de paille est pris dans la zone sombre de la tête ; chez Rabot, la huppe et le tablier partagent un rouille, et le bec est dans le vert du dos ; chez Humus, le bâton est pris dans la peau ; chez Perle, le manche du râteau est pris dans l’orange du bec ; le laiton de la balance de Bazar passe dans le lin. Rabot, Kroa et Sema, au corps vert, ont été jugés sur l’herbe le 10 octobre 2026 par le directeur artistique : lisibles, aplats gardés.

Les créatures de la 5e ont leur squelette (10 octobre 2026, réglages dans `reglages.csv`). `squelette.py` ne trouve pas de jambes à Vélin, Frimas, Rabot et Kroa (courtes, sous le vêtement ou la queue) : comme Humus, qui n’en a pas, ils respirent et tournent la tête sans marcher. Sillon non plus (`jambes=non`) : le manche de sa faucille suivrait sa patte. Pudding, Bazar et les oiseaux aux longues plumes (Sillon, Lina, Perle) sont pesés par surface (`aire=oui`), pour que la veste de Pudding ne s’étire pas à la marche ; la queue de Bazar suit son corps (`queue=non`).

Les personnages du Préau des délégués (6e), du Fournil des partages et de la Grotte des légendes (5e), îles d’EMC et de latin-grec, suivent la même chaîne (10 octobre 2026). Mie, au corps rond, ne marche pas (`jambes=non`) ; la queue de Lyre traîne au sol (`queue=sol`) ; Voix tient son livre à deux mains, ses bras ne balancent pas (`bras=non`) et `squelette.py` ne lui trouve pas de jambes. Écart connu : la tête de Lyre, jaune taché de brun dans le concept, est prise dans le lin de la tunique (aucune de ses quatre couleurs ne la sépare). L’Oie d’opale tourne de 2,5 quarts, de trois quarts vers l’élève comme dans son concept. La version de loin du Phénix d’argile est refaite par `loin.py` à 160 triangles, pour que les Gardiens de la 5e tiennent leur enveloppe.

| Créature | 1 500 | 200 |
| --- | --- | --- |
| Robin (Baie, 6e) | 1 500 | 200 |
| Rouxel (Carrière, 6e) | 1 500 | 200 |
| Bloquette (Ferme, 6e) | 1 500 | 200 |
| Mousso (Forêt, 6e) | 1 500 | 198 |
| Silex (Fouille, 6e) | 1 500 | 200 |
| Pince (Hangar, 6e) | 1 500 | 230 |
| Tick (Horloge, 6e) | 1 500 | 200 |
| Bulle (Laboratoire, 6e) | 1 498 | 200 |
| Tunel (Mine, 6e) | 1 500 | 200 |
| Coco (Plaine, 6e) | 1 500 | 200 |
| Boussole (Pointe, 6e) | 1 500 | 200 |
| Nénu (Rivière, 6e) | 1 500 | 200 |
| Grimoire (Tour, 6e) | 1 500 | 200 |
| Fougère (Vallée, 6e) | 1 500 | 200 |
| Lavi (Volcan, 6e) | 1 500 | 200 |
| Vélin (Bourg, 5e) | 1 500 | 200 |
| Sema (Carrefour, 5e) | 1 500 | 200 |
| Pudding (Comptoir, 5e) | 1 500 | 200 |
| Sillon (Delta, 5e) | 1 500 | 200 |
| Frimas (Glacier, 5e) | 1 500 | 200 |
| Moustache (Manoir, 5e) | 1 500 | 200 |
| Kroa (Marais, 5e) | 1 500 | 200 |
| Bazar (Marché, 5e) | 1 500 | 198 |
| Rabot (Menuiserie, 5e) | 1 500 | 200 |
| Humus (Prairie, 5e) | 1 500 | 200 |
| Lina (Relais, 5e) | 1 500 | 200 |
| Perle (Saline, 5e) | 1 500 | 200 |
| Voix (Préau, 6e) | 1 500 | 200 |
| Mie (Fournil, 5e) | 1 500 | 200 |
| Lyre (Grotte, 5e) | 1 500 | 200 |

Les versions de loin de la Tortue d’ocre, de l’Hydre des marais, du Colporteur et de la Diligence de cuivre sont tirées de leur version de près (réduite à 200 triangles environ ; pour l’Hydre et la Diligence, remaillée en voxels d’abord), pour garder ce qui les fait reconnaître : la carapace sans éclats, les têtes, le chapeau et la hotte, la caisse et les roues. Le Spectre du manoir se tourne de trois quarts et demi de tour, pour montrer sa lanterne de face. Le Cheval à bascule garde ses patins : ils font partie du personnage, on ne coupe rien.

## Passer du concept au modèle brut

Le Space [microsoft/TRELLIS.2](https://huggingface.co/spaces/microsoft/TRELLIS.2) (licence MIT) tourne sous le compte Hugging Face du mainteneur, avec les réglages du Lion (résolution 512, texture 1024). Il se lance à la main sur le Space, ou par `scripts/rendu/modeles/trellis.py -- <dossier> <concept.webp>…` (avec `gradio_client` : `/start_session`, `/preprocess_image`, `/image_to_3d`, puis `/extract_glb`), le jeton du mainteneur étant posé par l’environnement. Un passage prend environ 40 secondes de calcul sur le quota du compte. Le `.glb` est rangé tel quel dans la Bibliothèque du projet, sous `archipeo/personnages-3d/bruts/<nom>.glb`.

## Passer du brut au modèle retravaillé

Les scripts sont dans [`scripts/rendu/modeles/`](../../../../scripts/rendu/modeles/). `lot.py` enchaîne les quatre autres sur tout un dossier :

1. `aligner.py` pose le socle à plat, le centre et met son grand côté sur l’axe nord-sud (plus un quart de tour si le réglage le demande) ;
2. `lion_lowpoly.py` referme le maillage, retire les débris détachés, le réduit à 1 500 puis à 200 triangles et peint chaque facette : en pierre `#8E8C84` pour un Gardien (le lichen de l’image ne passe pas : c’est le code qui le pose sur le Gardien éteint, décision du mainteneur du 8 octobre 2026), de la plus proche des quatre couleurs principales de sa texture pour une créature (nom en `-creature-`) ;
3. `couper.py` coupe le socle d’un Gardien à la hauteur réglée, puisque le socle octogonal commun vient du code (une créature n’a pas de socle) ;
4. `rendre_controle.py` fait le rendu de contrôle.

On réduit avant de couper : la réduction cale sur un modèle déjà coupé.

La réduction se joue en plusieurs essais. Le premier remaille finement puis réduit ; s’il s’écarte trop du brut, les suivants épaississent d’abord les parois fines (sans quoi la réduction cale ou les troue : Bulle, Grimoire, l’Amphore de loin) et remaillent plus gros. Le script garde l’essai dont la surface reste la plus proche de celle du brut ; c’est ce qui a sauvé le corps du Cheval à bascule, replié en tente au premier essai.

Pour refaire un personnage, copier son brut de la Bibliothèque (`<nom>.glb`) dans un dossier de travail, avec `reglages.csv`, puis :

```sh
blender -b -P scripts/rendu/modeles/lot.py -- <dossier de travail>
```

Sans Blender, le module Python `bpy` suffit (Python 3.11, `pip install bpy numpy`) : `python scripts/rendu/modeles/lot.py -- <dossier de travail>`. Sous Linux, il faut aussi la bibliothèque `libegl1` pour le rendu de contrôle. Le résultat sort dans `<dossier de travail>/prets/<nom>/` avec un `recapitulatif.csv` : y prendre `final-1500.glb`, `final-200.glb` et `controle.png`.

Si le socle n’est pas entièrement parti, ou si les pattes sont coupées, changer la hauteur dans `reglages.csv` et relancer (le Taureau, au socle plus haut, coupe à 0,16).

Une créature passe ensuite par deux étapes, sur son dossier de `modeles/` (numpy seulement, sans Blender) :

5. `squelette.py` pose son squelette dans le modèle de près (réglages dans la colonne « squelette » de `reglages.csv`), relu sur la planche de `apercu_squelette.py` ;
6. `aplats.py` peint ses deux modèles en aplats : chacune de ses quatre couleurs (sombres et bigarrées, puisque l’ombre est peinte dans la texture de TRELLIS) prend la couleur cible de la colonne « aplats » de `reglages.csv` (`source>cible` en hexadécimal), deux couleurs de la même matière se fondent en une zone, le modèle de loin prend la cible de la source la plus proche, et un triangle isolé prend la couleur de ses voisins. Seules les couleurs du fichier changent. Relancé sur un modèle déjà en aplats, il ne change rien ; un modèle refait par `lot.py` a d’autres couleurs sources : refaire sa ligne.

```sh
python3 scripts/rendu/modeles/squelette.py -- docs/univers/archipeo/personnages/modeles/<nom>
python3 scripts/rendu/modeles/aplats.py -- docs/univers/archipeo/personnages/modeles/<nom>
```

Puis refaire `controle.png` avec `rendre_controle.py` (brut, 1 500, 200). Le test `src/game/world/characters/imported/models.test.ts` vérifie que chaque créature de la table est bien peinte avec ses cibles. La chaîne entière, du concept au jeu, est décrite pas à pas dans le skill [`modeles-3d`](../../../../.claude/skills/modeles-3d/SKILL.md).

## À reprendre au modèle 3D

Les retouches propres à chaque personnage (barbe des Sphinx, fils épaissis, yeux repeints…) sont dans la [fiche des concepts](README.md#à-reprendre-au-modèle-3d). Chaque modèle retravaillé passe ensuite par le directeur artistique et le référent dys, sur captures, avant d’entrer dans le jeu.
