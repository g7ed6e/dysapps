---
name: modeles-3d
description: Faire entrer un personnage ou un monument d'Archipéo en 3D dans le jeu, du concept au modèle peint (TRELLIS.2, lot.py, squelette.py, aplats.py, monument_lowpoly.py, monument_etapes.py, contrôle, models.ts, relectures). À lire avant de générer, retravailler ou repeindre un modèle importé.
---

# La chaîne des modèles 3D d'Archipéo

Un Gardien ou une créature d'Archipéo passe du concept 2D au jeu en six étapes. Les scripts sont dans `scripts/rendu/modeles/`, les réglages de chaque modèle dans une ligne de `docs/univers/archipeo/personnages/modeles/reglages.csv`, le détail dans `docs/univers/archipeo/personnages/modeles.md`. Les créatures du 6e (lot 1 de la refonte des finitions, 10 octobre 2026) sont l'exemple à suivre.

## 1. Le concept

Le concept est l'image WebP de `docs/univers/archipeo/personnages/<nom>.webp`, avec sa fiche (`README.md`, « À reprendre au modèle 3D »). Le nom suit la forme `<classe>-<lieu>-gardien-<nom>` ou `<classe>-<lieu>-creature-<nom>` : `lion_lowpoly.py` peint en pierre tout ce qui n'a pas `-creature-` dans son nom.

## 2. Le brut (TRELLIS.2)

- `python3 scripts/rendu/modeles/trellis.py -- <dossier> <concept.webp>…` (`pip install gradio_client`) passe chaque concept par le Space `microsoft/TRELLIS.2` sous le compte Hugging Face du mainteneur, réglages du Lion (résolution 512, texture 1024), et écrit `<dossier>/<nom>.glb`. Le jeton est posé par l'environnement (secret réseau) : ne jamais l'écrire.
- Quota partagé (environ 25 minutes de calcul par jour, 40 secondes par modèle) : prévenir les autres fils qui génèrent avant un gros lot.
- Le `.glb` brut va tel quel dans la Bibliothèque du projet, `archipeo/personnages-3d/bruts/<nom>.glb`, jamais dans le dépôt ni dans son historique.

## 3. Réduire et peindre (`lot.py`, Blender ou `bpy`)

Copier les bruts et `reglages.csv` dans un dossier de travail, puis `python3.11 scripts/rendu/modeles/lot.py -- <dossier>` (Python 3.11, `pip install bpy numpy` ; sous Linux, `apt-get install libegl1` pour le rendu de contrôle). Il enchaîne `aligner.py` (socle à plat, centré), `lion_lowpoly.py` (réduit à 1 500 et 200 triangles, peint (pierre pour un Gardien, les quatre couleurs principales de la texture pour une créature), `couper.py` (le socle d'un Gardien, à la hauteur de la colonne 2) et `rendre_controle.py` (`controle.png`). Prendre `final-1500.glb`, `final-200.glb` et `controle.png` dans `<dossier>/prets/<nom>/`, les poser dans `docs/univers/archipeo/personnages/modeles/<nom>/`.

Regarder le contrôle : socle pas entièrement parti ou pattes coupées, changer la hauteur et relancer ; modèle de loin réduit à un bloc, le noter dans `modeles.md` (« À reprendre »).

## 4. Le squelette d'une créature (`squelette.py`)

`python3 scripts/rendu/modeles/squelette.py -- <dossier du modèle> <quarts> [réglages]`, avec les quarts et réglages de la colonne 4 de sa ligne (`cou=`, `queue=non|sol`, `jambes=non`, `bras=…`, `leve=…`, `teinte=…`) ; relire la planche de `apercu_squelette.py` (`-- <dossier> <quarts> <image.png>`), qui montre les poses de repos et de marche ; `marche.py` y recopie le cycle de marche de `paintedCharacters.ts` : le changer des deux côtés à la fois. Le jeu anime les os par le code (`src/game/three/paintedCharacters.ts`).

## 5. Les aplats d'une créature (`aplats.py`)

Les quatre couleurs tirées de la texture sont sombres et bigarrées (l'ombre est peinte dans la texture) : elles dénotent à côté du décor. On les remplace par des aplats clairs.

1. `python3 scripts/rendu/modeles/aplats.py -- <dossier du modèle>` sur un modèle sans ligne donne ses quatre couleurs, de la plus étendue à la moins étendue, et s'arrête.
2. Le `directeur-artistique` choisit une cible par couleur, d'après le concept et la palette d'Archipéo : deux couleurs de la même matière prennent la même cible (elles ne font plus qu'une zone) ; le corps (la couleur la plus étendue) doit se détacher de l'herbe. L'aider d'une planche où chaque zone est montrée seule.
3. Écrire la colonne 5 (`source>cible …`, hexadécimal sRVB sans `#`) et la colonne 6 (ce que fait chaque zone, sans point-virgule) de la ligne du modèle.
4. Relancer `aplats.py` : il peint `final-1500.glb` et `final-200.glb` (le modèle de loin prend la cible de la source la plus proche, un triangle isolé prend la couleur de ses voisins). Seules les couleurs changent ; relancé, il ne change rien. Un modèle refait par `lot.py` a d'autres couleurs sources : refaire sa ligne.
5. Refaire le contrôle : `python3.11 scripts/rendu/modeles/rendre_controle.py -- <brut> <dossier>/final-1500.glb <dossier>/final-200.glb <chemin absolu>/controle.png`.

Toujours dans cet ordre : `lot.py`, puis `squelette.py`, puis `aplats.py` en dernier (il garde les os et les poids octet pour octet).

## 6. Dans le jeu

- `src/game/world/characters/imported/models.ts` : la ligne de l'île (lieu, Gardien, créature, quarts de chacun, relevés en regardant le modèle des quatre côtés). Le jeu prend les couleurs du fichier telles quelles (de loin, il éclaircit seulement) : aucune couleur ne s'écrit dans le code.
- `src/game/importedCharacters.ts` : l'adresse des fichiers (`import.meta.glob`) couvre la classe.
- Les tests de `src/game/world/characters/imported/` vérifient que chaque créature de `reglages.csv` est peinte avec ses cibles et que son corps se détache de l'herbe : `npx vitest run src/game/world/characters/imported`.
- Budget : compter le pire cas en triangles de l'archipel (plafonds dans `src/game/world/budget.ts`, `npm run rendu:budget`) ; un dépassement est une décision du mainteneur.

## Les monuments

Un monument d'Archipéo (`src/game/world/monuments.ts`) suit les étapes 1 et 2 (concept dans la Bibliothèque, `generation/monuments/`, choix dans `monuments/pistes.md`), puis sa propre chaîne, sans squelette ni aplats : il garde les couleurs de sa texture.

1. `python3.11 scripts/rendu/modeles/aligner.py -- <brut.glb> <dossier>/1-aligne.glb 0` pose le socle à plat.
2. `python3.11 scripts/rendu/modeles/monument_lowpoly.py -- <dossier>/1-aligne.glb <dossier>/final-3000.glb 3000` (`pip install bpy numpy fast-simplification`) réduit à 3 000 triangles (budget du mainteneur, 9 octobre 2026) sans remaillage, qui casse les pièces fines (ailes du moulin), et peint chaque facette de sa couleur d'origine, ramenée à une palette de huit couleurs. Le Decimate de Blender cale vers 7 000 triangles sur un brut de TRELLIS : la réduction passe par `fast-simplification` (licence MIT).
3. `python3.11 scripts/rendu/modeles/monument_etapes.py -- <dossier>/final-3000.glb <dossier> 0.33 0.66` coupe les étapes de chantier (une part de la hauteur par étape ; le phare du large en cinq pièces : `0.2 0.4 0.6 0.8` ; le grand moulin coupé à `0.33 0.58`, sous la bande sombre du toit) : la coupe est refermée et peinte de la couleur claire voisine, une paroi intérieure sombre mise à nu prend la même, un petit morceau en l'air (une pale coupée de son moyeu) part, les piles posées au sol restent.
4. Contrôle : `rendre_controle.py -- etape-1.glb etape-2.glb final-3000.glb etapes.png`. Les fichiers vont dans `docs/univers/archipeo/monuments/modeles/<nom>/` (`final-3000.glb`, `etape-<n>.glb`, `controle.png`).
5. Dans le jeu : `src/game/importedMonuments.ts` les charge pour Archipéo seulement ; l'étape affichée suit l'avancée du plan, cases et fantômes inchangés.

`retirer_avant.py` (ôter une partie devant un plan vertical et au-dessus d'une hauteur, coupe refermée) et `reduire_uni.py` (réduire un modèle d'une seule couleur de pierre) ont servi au Centaure d'argile, que le modèle d'images ne savait pas dessiner : un brut à deux têtes dont on a retiré la tête de cheval.

## Relire et livrer

- Captures : skill `captures` (une famille dans `CAPTURES` de `scripts/rendu/mesures.mjs`, `--rendu archipeo`, la fiche de chaque créature ouverte, de près, de jour et de nuit, et l'archipel en recul), retirée une fois la pull request fusionnée.
- Relectures sur un commit figé : `directeur-artistique` (couleurs, silhouettes), `referent-dys` (lisible de jour, de nuit et de loin), `consultant-archipeo`, `expert-frontend` (scripts, code).
- Documentation dans la même pull request : le tableau du modèle dans `modeles.md`, sa ligne dans `docs/pilotage/chantiers.md`, `docs/architecture/fichiers.md` si le code change.
