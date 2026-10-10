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

Regarder le contrôle : socle pas entièrement parti ou pattes coupées, changer la hauteur et relancer ; modèle de loin réduit à un bloc, le refaire depuis sa version de près : `python3.11 scripts/rendu/modeles/loin.py -- final-1500.glb final-200.glb <triangles> [voxel]` (essayer voxel 0, puis 0.02 et 0.03, sans dépasser le nombre de triangles d'avant), puis refaire le contrôle ; sinon, le noter dans `modeles.md` (« À reprendre »).

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

- `src/game/world/characters/imported/models.ts` : la ligne de l'île (lieu, Gardien, créature, quarts de chacun, relevés en regardant le modèle des quatre côtés ; un demi-quart, comme 3.5, quand le modèle regarde en biais, celui du Spectre du manoir). Le jeu prend les couleurs du fichier telles quelles (de loin, il éclaircit seulement) : aucune couleur ne s'écrit dans le code.
- `src/game/importedCharacters.ts` : l'adresse des fichiers (`import.meta.glob`) couvre la classe.
- Les tests de `src/game/world/characters/imported/` vérifient que chaque créature de `reglages.csv` est peinte avec ses cibles et que son corps se détache de l'herbe : `npx vitest run src/game/world/characters/imported`.
- Budget : compter le pire cas en triangles de l'archipel (plafonds dans `src/game/world/budget.ts`, `npm run rendu:budget`) ; un dépassement est une décision du mainteneur.

## Les monuments

Un monument d'Archipéo (`src/game/world/monuments.ts`) suit les étapes 1 et 2 (concept dans la Bibliothèque, `generation/monuments/`, choix dans `monuments/pistes.md`), puis sa propre chaîne, sans squelette : low poly en aplats francs (choix du mainteneur, 10 octobre 2026), quatre à six couleurs par monument, jamais de texture.

1. `python3.11 scripts/rendu/modeles/aligner.py -- <brut.glb> <dossier>/1-aligne.glb 0` pose le socle à plat.
2. `python3.11 scripts/rendu/modeles/monument_lowpoly.py -- <dossier>/1-aligne.glb <dossier>/low.glb <nom>` (`pip install bpy numpy fast-simplification`) remaille le brut en voxels (0,008 de sa plus grande dimension ; le phare du large 0,004), puis le réduit à 3 000 triangles par le Decimate de Blender (fast-simplification en secours quand il cale) : sans remaillage, la réduction laisse éclats, trous et ailes déchirées. Chaque facette prend une seule couleur, lue dans la texture du brut sans ses faces internes noires, puis ramenée à l'une des couleurs cibles du monument dans `docs/univers/archipeo/monuments/modeles/reglages.csv` (une ligne par monument ; une grappe bleutée prend l'ardoise ; un triangle isolé prend la couleur qui l'entoure). Le script affiche chaque grappe et sa cible : changer une cible, c'est changer la table et relancer.
3. `python3.11 scripts/rendu/modeles/monument_etapes.py -- <dossier>/final-3000.glb <dossier> 0.33 0.66` coupe les étapes de chantier (une part de la hauteur par étape ; le phare du large en cinq pièces : `0.2 0.4 0.6 0.8` ; le grand moulin coupé à `0.33 0.58`, sous la bande sombre du toit) : la coupe est refermée et peinte de la couleur claire voisine, une paroi intérieure sombre mise à nu prend la même, un petit morceau en l'air (une pale coupée de son moyeu) part (sauf un prisme de huit sommets, un cadre de fenêtre posé par les retouches), les piles posées au sol restent.
3 bis. Retouches après relecture : `python3.11 scripts/rendu/modeles/monument_retouches.py -- <nom> <entrée.glb> <sortie.glb>` repeint par zones, retire une pièce mal sortie de TRELLIS, ajoute une forme simple ou étire une tour, monument par monument (demandes du directeur artistique et du consultant Archipéo, 10 octobre 2026 : toit rayé et piliers sombres du kiosque, coupole et tambour contrastés de l'observatoire des étoiles, toit et faîte du temple, longue-vue en laiton et dalle nette de l'observatoire des baleines, flamme pleine et tour étirée du phare, gradins pleins de l'amphithéâtre, deux arches et locomotive grossie du viaduc ; `moulin` pose des fenêtres rectangulaires nettes, cadre de bois et fond d'ardoise, à la place des creux qui se lisaient comme des chiffres ; `moulin-etape` ôte les bouts d'aile d'une étape du moulin). Sur le modèle réduit (`low.glb`), dont il fait `final-3000.glb` , avant de recouper les étapes ; une réduction qui garde les couleurs (`simplifier`) tient le viaduc dans 3 000 triangles.
4. Contrôle : `rendre_controle.py -- etape-1.glb etape-2.glb final-3000.glb etapes.png`. Les fichiers vont dans `docs/univers/archipeo/monuments/modeles/<nom>/` (`final-3000.glb`, `etape-<n>.glb`, `controle.png`).
5. Dans le jeu : `src/game/importedMonuments.ts` les charge pour Archipéo seulement ; l'étape affichée suit l'avancée du plan, cases et fantômes inchangés.

`retirer_avant.py` (ôter une partie devant un plan vertical et au-dessus d'une hauteur, coupe refermée) et `reduire_uni.py` (réduire un modèle d'une seule couleur de pierre) ont servi au Centaure d'argile, que le modèle d'images ne savait pas dessiner : un brut à deux têtes dont on a retiré la tête de cheval.

## Les bâtiments

Le bâtiment des plans de chaque île d'Archipéo (les deux premiers plans, `<lieu>-1` les murs et `<lieu>-2` le toit ; la cour, `<lieu>-3`, reste en pièces du code) suit la chaîne des monuments (décision du mainteneur, 10 octobre 2026 : « low poly avec aplats », sans texture) : concept, brut TRELLIS (jamais dans le dépôt), puis **une seule commande** :

`python3.11 scripts/rendu/modeles/batiments.py -- <dossier des bruts> [<nom> …]`

Le brut est `<dossier>/<nom>-42.glb` ; sans nom, toutes les lignes de `docs/univers/archipeo/batiments/modeles/reglages.csv` dont le brut est là. Une ligne par bâtiment : `batiment;cibles;voxel;avant-toit;quarts`. Les cibles viennent des concepts (`cibles-57.csv`), **la première est toujours la couleur des murs** ; `a8a39a` est la pierre du socle. Les colonnes `avant-toit` et `quarts` vides sont lues sur le modèle et inscrites par le script : relancer donne le même résultat, une valeur corrigée à la main l'emporte. Le script enchaîne :

1. `aligner.py` (le socle à plat, son grand côté nord-sud), avec les `quarts` de la ligne. Vides : `monument_lowpoly.py` lit la façade (le côté où le sombre de la texture couvre le plus le mur extérieur, une porte, une ouverture ; le sud l'emporte sauf écart net) et le script refait l'alignement d'autant de quarts, pour mettre la façade au sud (-Y de Blender, +Z du .glb).
2. `monument_lowpoly.py` : 3 000 triangles, douze grappes de couleur. Pour un bâtiment (nom trouvé dans la table des bâtiments), chaque grappe prend la cible la plus proche en **chromaticité** (r, g, b divisés par leur somme, en linéaire : l'ombre peinte par TRELLIS ne la change pas), la luminance comptée moins ; puis la géométrie tient les rôles : la pierre du socle ne va qu'au socle, un toit (au-dessus de l'avant-toit, tourné vers le haut) n'est ni le fond sombre ni les murs, et la grappe qui couvre le plus les murs prend la cible des murs. Les monuments gardent leur règle (Lab, luminance remontée, grappe bleutée).
3. `couper.py … socle` : la dalle part au ras de son dessus, son plus grand palier horizontal du bas (`batiment_mesures.py`), même quand elle est serrée autour des murs.
4. `monument_etapes.py … <avant-toit> couleur=<murs> plein` : l'étape 1, coupée à l'avant-toit, fermée d'un seul couvercle de la couleur des murs. L'avant-toit lu (`batiment_mesures.avant_toit`) : le plus grand élargissement du modèle en montant, entre 25 et 95 % de sa hauteur (le toit déborde des murs, la galerie du phare de la tour, le dôme du nid et le chaume de la hutte de leur tambour) ; la coupe passe juste dessous, la poutre ou le bandeau restent à l'étape 1. Deux toits à deux hauteurs (le quartier de Boussole) : le plus grand l'emporte, corriger la colonne pour couper au premier.
5. `batiment_loin.py` : la version de loin, **200 triangles au plus**, qui suit la silhouette du modèle de près : cent coupes horizontales, chacune résumée en un octogone d'appuis (un rectangle reste un rectangle, un cercle devient un octogone, le haut d'un toit à deux pans une bande étroite), reliées en colonnes (le corps, et ce qui s'en détache en haut : cheminée, lanterne, la tour du plus haut des deux logis) ; on retire les hauteurs dont l'absence se voit le moins, l'avant-toit gardé. Chaque face prend la couleur du modèle de près à sa hauteur, de son côté ; les objets posés contre les murs (borne, botte, amphore) ne font pas déborder le pied, ceux posés à côté partent ; l'ouverture sombre se pose sur la façade. `loin-etape-1.glb` : un seul prisme droit du sol à l'avant-toit (22 triangles, l'ouverture en plus), qui enveloppe les appuis médians des colonnes nées sous l'avant-toit, fermé de la couleur des murs : de loin, l'étape 1 porte le deuxième plan en cubes ou en fantômes, compté avec elle dans le budget. La réduction automatique à 200 triangles (Decimate, fast-simplification, voxels) fait une bouillie : ne pas y revenir.
6. `rendre_controle.py echelle …` : le contrôle, à la même échelle, de près l'étape 1 et le bâtiment, de loin les deux.

Les fichiers vont dans `docs/univers/archipeo/batiments/modeles/<classe>-batiment-<nom>/` (`final-3000.glb`, `etape-1.glb`, `loin.glb`, `loin-etape-1.glb`, `controle.png`) ; le bâtiment entre dans `BUILDING_MODELS` (`src/game/world/buildingModels.ts`) sous l'île du plan `<île>-1.json` qui porte son nom (`src/game/world/plans/`). Dans le jeu : `src/game/importedBuildings.ts` les charge pour Archipéo seulement. L'étape 1 se montre quand toutes les cases du premier plan sont posées, le bâtiment entier quand celles du deuxième le sont aussi ; les cases et les fantômes ne changent pas. De près (l'île où se trouve l'élève, ou que la caméra regarde) le modèle de 3 000 triangles, de loin sa version en volumes ; il suit l'île posée et tournée. Hors ligne ou pas chargé : le kit en blocs. Il se pose aussi haut que ses deux plans, sans déborder leur emprise de plus d'une demi-case (`fitOf`) : une tour haute et étroite tient sa hauteur, elle est alors un peu plus étroite que le chantier en cubes.

Relire chaque planche de contrôle (une rangée par bâtiment) : la dalle partie, la façade au sud, les couleurs des murs et du toit, la coupe de l'étape 1 sous l'avant-toit, la silhouette de loin.

Le prompt des suivants (avis du directeur artistique, 10 octobre 2026) : le bâtiment seul sur un socle bas et serré, sans rien de posé devant (la cour vient du code), murs lisses et toit de deux grands pans sans motif, une ligne horizontale franche sous l'avant-toit (là où se coupe l'étape 1), une grande ouverture sombre sans lueur peinte, une signature épaisse (cheminée, four, lanterne, dôme).

## Relire et livrer

- Captures : skill `captures` (une famille dans `CAPTURES` de `scripts/rendu/mesures.mjs`, `--rendu archipeo`, la fiche de chaque créature ouverte, de près, de jour et de nuit, et l'archipel en recul), retirée une fois la pull request fusionnée.
- Relectures sur un commit figé : `directeur-artistique` (couleurs, silhouettes), `referent-dys` (lisible de jour, de nuit et de loin), `consultant-archipeo`, `expert-frontend` (scripts, code).
- Documentation dans la même pull request : le tableau du modèle dans `modeles.md`, sa ligne dans `docs/pilotage/chantiers.md`, `docs/architecture/fichiers.md` si le code change.
