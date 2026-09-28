# Plusieurs univers, un même objectif

Ce document est une **feuille de route**, écrite le 28 septembre 2026 à la demande du mainteneur, avant toute ligne de code. Il dit ce que serait un jeu à plusieurs univers, ce qu’il faut ajouter au plan de [séparation du jeu et du rendu](separation-jeu-rendu.md) pour le permettre, et quand le faire sans freiner la migration vers Archipéo ([cadrage Archipéo](cadrage-archipeo.md), §6). Ses questions ouvertes sont au §7.

La demande : permettre à l’application d’avoir plusieurs thèmes, chacun avec son récit, son habillage pédagogique (des problèmes de maths ou des références littéraires en lien avec le thème) et son rendu (3D Archipéo, 3D en blocs, 2D), pour que l’élève choisisse selon ses affinités, **toujours avec le même objectif pédagogique**.

Les cinq agents du dépôt ont été consultés (voir [Contribuer](contribuer.md#les-agents)) : le directeur artistique pour l’univers et le récit, le directeur contenu pédagogique pour l’objectif commun, l’artiste technique 3D pour le rendu, l’expert frontend pour l’architecture, le référent dys pour l’élève. Leurs avis sont résumés à chaque section. Le directeur artistique et le référent dys acceptent l’idée **à une condition** : un univers reste un habillage du même jeu, qui ne rouvre pas le monde en blocs, ne change ni les mots du jeu ni l’exercice, et garde les repères de l’élève (§4, §6.1).

## 1. Le mot

« Thème » est déjà pris : les Réglages appellent ainsi les couleurs de l’interface (Crème, Nuit, Clair, Contraste élevé ; `ThemeChoice` dans `src/core/settings.ts`). La fonctionnalité s’appelle **l’univers**, à l’écran (« Univers : Archipéo ») comme dans le code. « Monde » (« Vue du monde ») et « aventure » (« Reprendre l’aventure ») sont pris aussi.

Le jeu garde son nom : **Archipéo** reste le jeu et sa promesse, « Le savoir construit ton monde. » ; les autres univers en sont des variantes, pas d’autres jeux.

## 2. Deux axes : l’univers et la vue

La demande mêle deux choix que le code tient déjà séparés :

| Axe | Ce qu’il choisit | Où il vit |
| --- | --- | --- |
| **L’univers** | Le récit, les noms affichés, les personnages, l’habillage du monde (palette, silhouettes, décor) et l’habillage des énoncés | Nouveau : une donnée par univers |
| **La vue** | La façon de dessiner : 3D, 2D, réseau (J6), liste des îles | Existe : le réglage « Vue du monde » (`worldView`) |

**Chaque univers existe dans toutes les vues** : sinon, passer de la 3D à la 2D changerait de jeu, ce que la décision « Vue 2D » du cadrage Archipéo interdit déjà (DA-03). Le coût d’un univers se multiplie donc par le nombre de rendus : c’est la raison principale de ne pas en multiplier les styles (§3).

## 3. Le monde en blocs

La demande cite « la 3D style minecraft » comme style possible. Le cadrage Archipéo prévoit au contraire, au **lot 6**, de retirer le monde en blocs et ses textures quand le rendu Archipéo devient celui de tous. Les quatre agents consultés sur ce point recommandent de **le retirer comme prévu** :

- **Le budget** : le monde en blocs ne tient pas celui d’Archipéo sur tablette (mesuré après R4 : 66 672 triangles et 220 appels de dessin aux Premiers Rivages, pour un plafond de 60 000 et 40 ; `budget.test.ts` le borne à 80 000 et 240).
- **La maintenance** : `rendu === 'archipeo'` est testé dans une quinzaine de modules de `three/` et dans la 2D ; garder deux familles de rendu ferait faire chaque lot deux fois, ou gèlerait les blocs.
- **Les tests et captures** : empreintes du rendu et captures se multiplient par style × archipel × jour et nuit × vue.
- **« Rien d’emprunté »** : un style qui imite l’apparence d’une licence connue va contre l’esprit de la règle.

Ce qui reste possible plus tard : un univers qui dessine **ses** blocs, en arêtes vives et aplats sur le **même maillage** que le rendu Archipéo, sans le pipeline de textures actuel. C’est un habillage d’univers (§5), pas un troisième rendu. La décision revient au mainteneur (§7, question 1).

## 4. Ce qu’un univers change, et ce qu’il ne change jamais

### Ce qui ne change jamais (le jeu)

- **Les identifiants et la sauvegarde** : îles, missions, exercices, items (`key`), plans et leurs cases, ouvrages, succès, adresses. La progression ne connaît pas l’univers : étoiles, blocs, plans, niveau adapté et répétition espacée (`exerciceId:key`, `review.ts`) restent les mêmes quand l’élève change d’univers.
- **La boucle et ses systèmes** : quatre régions, une par classe ; le village en cinq états ; les étapes du véhicule ; le Gardien qu’on **restaure**, jamais qu’on combat (DP-01, DP-02) ; les célébrations sobres (DA-05).
- **Les mots du jeu**, repères de l’élève, du manuel et de l’enseignant : bloc, plan, ouvrage, mission, étoile, XP, rang, Expéditions, Menu, Réglages. Pour un élève dys, changer de mot, c’est réapprendre.
- **L’objectif pédagogique** : la mission, ses compétences (`programme`), ses niveaux, le nombre d’items, pour chaque item la réponse, les choix et leur ordre, la règle, la correction (`explanation`, `rule`, `why`, `tip`), l’aide visuelle, le barème. Aucun univers ne donne plus facile, ni plus de blocs ou d’étoiles.
- **L’interface et les règles dys** : panneaux, sons de réussite et d’erreur, rien à lire dans la 3D.

### Ce qu’un univers change (l’habillage)

| Domaine | Ce qui change | Qui décide |
| --- | --- | --- |
| **Récit** | Le récit d’ensemble, les noms affichés des régions et des îles, la figure qui guide (l’équivalent de la baleine, qui parle aussi rarement), les créatures et leurs répliques, l’apparence des Gardiens, du véhicule et du village | Directeur artistique |
| **Monde** | La palette et l’ambiance, les silhouettes dessinées, les formes de décor, les repères qui ne sont pas des plans, les personnages ; jamais le relief qui porte la marche, jamais les cases d’un plan | Directeur artistique (quoi), artiste technique 3D (comment) |
| **Énoncés** | La phrase de situation des problèmes situés et les objets de leur schéma (`scene`), quelques textes de lecture, des repères culturels en anglais | Directeur contenu pédagogique |

### L’habillage pédagogique, mission par mission

L’avis du directeur contenu pédagogique fixe trois familles :

- **S’habille facilement** : les problèmes situés, écrits par des générateurs (`problemes.ts` : `plaine-passeur-1` à `3`, `marche-etals-3`, `marche-balances-3`, `belvedere-pythagore-3`). Mêmes cotes, même calcul, même « ? » unique ; seul le gabarit de phrase change (« un viaduc entre deux versants » au lieu d’« un pont entre deux falaises »), et le schéma dessine l’objet de l’univers.
- **S’habille difficilement** : les phrases d’accord, de conjugaison et de compréhension. Réécrire la phrase oblige à revérifier chaque piège ; à ne pas faire au premier univers.
- **Ne varie jamais** : les sons, les homophones, les dictées, les familles de mots, les mots-outils, les verbes irréguliers et les faux amis en anglais, le calcul nu et les aides de maths (boîte de dix, droite graduée, fractions en colonne). Le mot ou le nombre **est** ce qu’on apprend.

Soit, sur 109 fichiers d’exercices et environ 950 items écrits à la main, 60 % environ qui ne bougent jamais, et 300 à 400 items qu’un univers pourrait habiller s’il allait au bout ; le premier univers n’en habille aucun en français (§6).

**Les références littéraires** : domaine public seulement (auteur mort depuis plus de soixante-dix ans) ou texte original, jamais un personnage sous licence. Les entrées culturelles du programme de français (`c3.fr.culture.entrees`, `c4.fr.culture.entrees`) sont hors du périmètre du référentiel : un extrait lié à un univers est un bonus de lecture, qui cite les compétences de compréhension comme la mission Lecture aujourd’hui, avec les mêmes règles (texte court, adapté si besoin comme Daudet et Verne, mots difficiles avant le texte, lignes numérotées, écoute). La meilleure piste est l’**anglais** : les repères culturels (`c3.en.culture.imaginaire`, `c4.en.culture.voyages-rencontres`) sont « à couvrir » (lot 7 du [cadrage du contenu](cadrage-contenu.md#la-suite-a-couvrir)).

**Les garde-fous d’un énoncé habillé**, vérifiés par des tests (§5) : le même nombre de mots au plus que l’énoncé de référence, **aucun nom propre** dans un énoncé (un nom inconnu est un mot de plus à décoder), une image qui aide et ne fait jamais douter, et la même phrase-clé et la même règle, pour qu’un item revu en répétition espacée se reconnaisse d’un univers à l’autre.

## 5. Ce qu’il faut ajouter au plan de séparation

Le plan [Séparer le jeu du rendu](separation-jeu-rendu.md) fait déjà l’essentiel : un jeu sans coordonnées, des dispositions, des rendus sur un même contrat. Un univers est **un paramètre de plus d’une vue**, jamais une entrée des règles. Quatre ajouts, sans rien refaire :

| Où | Ajout | Taille |
| --- | --- | --- |
| **J5** (en cours) | Le repère d’île porte séparément **le relief de disposition** (celui qui porte la marche, les trajets et les empreintes de J0, commun à tous les univers) et **le modelé dessiné** (propre au rendu, donc à l’univers). Aujourd’hui `silhouetteDe` est lue par `map.ts` : un univers qui changerait le relief changerait la grille de marche. Une note, ou une séparation sans changement d’image si J5 le permet. | S |
| **J6** | La vue reçoit `{ modèle, disposition, vue, univers, moment }`. Le booléen `archipeo` des parties de la scène devient un objet `Habillage` passé une fois à la construction de chaque partie. | M |
| **J7** | Rangement de `world/habillage/<univers>/` (palette, formes, silhouettes dessinées, fiche de famille) ; le test des couches (`couches.test.ts`) gagne une couche `univers` : le jeu et la disposition n’importent aucun habillage ni aucun univers. | S |
| **J8. L’habillage** (nouvelle étape) | Les textes d’univers sortent de `biomes.ts`, des états d’île, des répliques des créatures et du mot de la baleine vers `src/univers/archipeo/`, en **déplacement pur** : empreintes, captures et pages générées identiques. C’est le même mouvement que les noms d’icônes que J1 a laissés au rangement. | M |

### L’architecture d’un univers (avis de l’expert frontend)

- **Sécurité** : un univers est un **module TypeScript du dépôt**, relu en pull request (référent dys, contenu, directeur artistique), jamais un fichier chargé à l’exécution ni fourni par un tiers ou par l’élève. Du texte brut seulement, affiché par React : ni HTML, ni Markdown interprété, ni adresse. Couleurs `#rrggbb` validées par un test, contraste AA compris ; pas de style en ligne, les variables CSS existantes.
- **Rangement** : `src/univers/<id>/index.ts`, typé `Univers` avec `satisfies`. Ses clés sont **dérivées** des identifiants stables (`Record<BiomeId, { nom, recit }>`, missions, ouvrages, Gardiens) : il les habille sans les remplacer. Aucune règle ne l’importe.
- **Le choix** est une **préférence d’appareil**, dans `Settings` à côté de `worldView` ; absent, il vaut Archipéo : aucune migration. `sanitizeSettings` remplace un univers inconnu par Archipéo sans planter. Un test relit une même sauvegarde sous deux univers et obtient le même état.
- **Performance** : un `import()` par univers, Archipéo restant dans le paquet principal (pas d’attente au démarrage). Le service worker met déjà tous les morceaux en cache : acceptable tant qu’un paquet de textes reste léger ; au-delà de 50 ko environ, seul l’univers choisi est mis en cache, avec Archipéo en repli hors ligne. À mesurer avec `npm run build`.
- **Les tests de parité** : chaque univers couvre toutes les clés (le type le garantit en grande partie), sans chaîne vide, avec des longueurs bornées ; pour chaque énoncé habillé, la même mission, le même `programme`, les mêmes niveaux, le même ensemble de `key`, et pour chaque clé la même réponse, les mêmes choix dans le même ordre et la même règle ; pour un générateur, à graine égale, les mêmes cotes, la même réponse et les mêmes pièges quel que soit l’univers.
- **La documentation** : `scripts/docs/generate.mjs` produit une page par univers (noms, récit, énoncés habillés) depuis les modules, jamais à la main.

### Dans le rendu (avis de l’artiste technique 3D)

Les registres du socle deviennent à clé composée **(univers, archipel)**, avec un repli sur le commun : `ambianceDe(univers, archipel)`, `FORMES[genre]` résolues par univers, une fiche de famille par univers. Jamais dans les règles, jamais dans les cases d’un plan : un univers change la matière et le dessin d’un bloc, pas `architect.ts`. Chaque univers tient le budget d’Archipéo (60 000 triangles, 40 appels de dessin par archipel) et ses captures se limitent à un archipel de référence, jour et nuit, pour ne pas multiplier les tests. Un univers complet (quatre régions, 3D et 2D, personnages) coûte en art autant que R4b et R6 réunis.

## 6. Les étapes, et quand

**Aucun travail d’univers n’entre dans les lots R ni dans les fichiers qu’ils possèdent** (`palette.ts` à R4b, `VoxelCanvas` à R5, `WorldCanvas2D` à R6, la grille, la scène et `WorldPage.tsx` au fil de la séparation). La migration passe d’abord.

| Étape | Contenu | Quand | Taille |
| --- | --- | --- | --- |
| **U0. Cette feuille de route** | Ce document ; les réponses du mainteneur au §7. | Maintenant | S |
| **U1. La note dans J5** | Relief de disposition et modelé dessiné séparés dans le repère d’île (§5). | Avec J5, par le fil de la séparation | S |
| **U2. L’habillage, sans changement d’image** | J8 (les textes d’Archipéo dans `src/univers/archipeo/`) et l’objet `Habillage` (J6) à la place du booléen ; la couche `univers` du test des couches ; le type `Univers` et les tests de parité, avec un seul univers. Empreintes, captures et pages générées identiques. | Avec J7, après le lot 6 (les lots R fusionnés) | M |
| **U3. Les problèmes situés habillables** | Les gabarits de phrase et les objets de `scene` des générateurs de `problemes.ts` passent par l’univers, avec les tests d’équivalence ; Archipéo seul, sans changement. | Avec U2, par le directeur contenu pédagogique | S-M |
| **U4. L’univers de preuve** | Un second univers derrière un drapeau `?univers=`, invisible des élèves : sa fiche (directeur artistique), son récit et ses noms, sa palette, ses silhouettes et ses personnages en 3D et en 2D, ses problèmes situés habillés, un ou deux textes de lecture et, en anglais, des repères culturels. Revue d’ensemble du directeur artistique et du référent dys, comme pour Archipéo. | Après les lots 8 et 8b : le lot 8 fixe le véhicule maritime et le 3e ; avant, on dessinerait sur une structure qui bouge | L |
| **U5. Le choix de l’élève** | « Univers » dans les Réglages et à l’arrivée (§6.1), l’aperçu, le manuel, la page générée de chaque univers. | Avec le lot 10 « Un village à soi », qui est déjà la personnalisation | M |

### 6.1 Le choix, côté élève

Le risque principal pour un élève dys est que **la même chose ne porte plus le même nom** (principes dys, « toujours au même endroit, avec les mêmes mots » ; critère « aide cohérente » des WCAG 2.2) : l’élève perd ses repères, et ne parle plus de la même île que l’adulte ou le manuel. Les conditions du référent dys :

- **Un seul écran de choix**, une fois, après l’écran titre et le tutoriel ; un univers y est déjà coché et l’écran dit « Tu pourras changer plus tard ». Ensuite, une section « Univers » des **Réglages**, qu’un adulte ouvre aussi en deux touchers.
- **Jamais pendant une mission** : le changement prend effet au retour au village.
- **Trois univers au plus**, chacun avec une icône, un libellé court, une phrase lue à voix haute et un aperçu fixe, sans animation ; rien ne se choisit à la couleur seule.
- **Réversible et sans perte** : une confirmation dit ce qui change (les mots du récit, le dessin) et ce qui ne change pas (étoiles, blocs, plans) ; après un changement, un écran de passage dit « L’île X s’appelle maintenant Y ».
- **Des repères stables sous chaque nom d’île** : le nom de la mission et la notion travaillée (« Les sons »), la place, l’icône, la couleur de matière et l’ordre des îles ne changent jamais.
- **Un lexique court par univers**, une dizaine de mots au plus, chacun expliqué et lu à voix haute la première fois.
- **Aucun texte ne présente un univers comme une aide « pour les dys »** : c’est une affinité, pas une adaptation.
- Chaque univers est relu par le référent dys sur captures, avec les réglages extrêmes (32 px, OpenDyslexic, Contraste élevé, voix coupée, « Réduire les animations ») et en vue simple ; les invariants du §4 entrent dans les [principes dys](../pedagogie/principes.md) quand U2 les vérifie par des tests.

Aucune règle dys n’impose de garder le monde en blocs : le calme et les appareils lents ont la 2D, la liste des îles et « Réduire les animations ». Un point à vérifier sur tablette avec un élève dyspraxique : une grille en cubes montre mieux la case touchée que des facettes en pente (risque déjà noté au cadrage Archipéo pour R2).

### 6.2 Les univers proposés

Le directeur artistique propose trois pistes originales, sans licence :

- **Les Voies d’altitude** : un réseau de trains de montagne à rétablir ; les ouvrages deviennent des viaducs, le village une gare, le véhicule une locomotive, le guide un grand cerf. Son graphe de liaisons colle à la disposition en réseau, il est assez différent pour prouver que l’axe tient, et il reste sobre à dessiner. **Recommandé comme univers de preuve.**
- **Les Stations de l’orbite** : des modules à raccorder par passerelles, un vaisseau, une comète pour guide ; attirant en 4e et 3e, mais le plus coûteux en silhouettes.
- **Les Terres de caravane** : des oasis reliées par des pistes.

## 7. Les questions au mainteneur

| Question | Options | Recommandation |
| --- | --- | --- |
| **1. Le monde en blocs** | (a) le retirer au lot 6, comme prévu ; (b) le garder comme vue au choix de l’élève | **(a)**, avis des quatre agents consultés : hors budget, maintenance doublée, lot 6 bloqué. Un univers « en blocs » reste possible plus tard, en habillage du même maillage. |
| **2. Jusqu’où va l’habillage pédagogique** | (a) les problèmes situés, quelques textes de lecture et les repères culturels en anglais ; (b) aussi les phrases de français (accords, conjugaison, compréhension) | **(a)** : c’est là que l’univers aide sans toucher l’objectif ; (b) coûte 300 à 400 items relus par univers. |
| **3. Le calendrier** | (a) comme au §6 : préparation dans J5 et J7, preuve après les lots 8 et 8b, ouverture avec le lot 10 ; (b) la preuve dès le lot 6 | **(a)** : rien n’entre dans les lots R, et l’univers de preuve ne se dessine pas sur un véhicule et un 3e qui vont changer. |
| **4. L’univers de preuve** | Voies d’altitude ; Stations de l’orbite ; Terres de caravane | **Les Voies d’altitude**. |
