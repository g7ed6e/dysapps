# Cadrage — « Blocland, l’appli entière »

Document de travail, **proposé le 27 septembre 2026, à valider**. Rien de ce qui suit n’est encore construit. Il répond au point 15 des propositions « une appli plus classique » (lot 3). Les lots 1 et 2 sont faits : écran de lancement, écran titre, « Continuer », menu principal, onglets, mode concentration, fin de partie qui enchaîne. Les points marqués **À décider** attendent un choix.

## 1. Le besoin en une phrase

Aujourd’hui, l’élève voit **deux applis collées** : un portail de quêtes par matière (Français, Maths, Anglais) et un jeu, Blocland. L’idée est d’en faire **un seul jeu**. On ouvre l’appli, on est dans le village. Chaque chose de l’appli y a sa place : les quêtes du portail dans des **bâtiments**, les succès dans une **salle des trophées**, les réglages dans le **menu pause**.

| Aujourd’hui | Avec « Blocland, l’appli entière » |
| --- | --- |
| Accueil en menu, puis on choisit « Aventure » ou « Quêtes » | L’écran titre mène au village ; « Continuer » ramène à la dernière quête |
| Les quêtes du portail vivent à part, sans blocs | Elles sont dans des bâtiments du village et rapportent des blocs comme les autres |
| Succès dans une page à part | Une salle des trophées sur l’île de départ (la page reste accessible) |
| Deux façons de progresser (XP d’un côté, blocs et étoiles de l’autre) | Une seule boucle : jouer, gagner des blocs, construire, ouvrir des îles |

## 2. Ce qu’on garde absolument

- **Les règles dys** de [Principes](../pedagogie/principes.md) :
  - aucun texte à lire dans la 3D ou la 2D ; les consignes restent en HTML, en police dys, lues à voix haute ;
  - pas de chrono, pas de perte, sessions courtes ;
  - « Réduire les animations » respecté.
- **La vue simple** (« La liste des îles ») reste complète. Tout ce qu’on fait dans le monde se fait aussi en listes, sans WebGL ni Canvas : c’est aussi le chemin des lecteurs d’écran.
- **Un accès direct aux quêtes** pour la classe et l’orthophoniste. Un adulte doit pouvoir ouvrir « Homophones, niveau 2 » en deux touchers, sans traverser le village. Les adresses actuelles (`/app/homophones`, `/matiere/francais`) restent valides.
- **La progression existante** : XP, rangs, succès, étoiles, blocs, bâtiments. Rien n’est remis à zéro ni converti avec perte.

## 3. La proposition

### 3.1 Démarrer

L’écran titre propose **Jouer** (vers le village, sur l’île où se tient le bonhomme) et **Continuer**. Le menu principal actuel (Accueil) devient le **menu pause** du village. On l’ouvre avec le bouton ⏸ ou le bouton retour, et il contient Reprendre, Quêtes, Succès, Réglages, Aide.

**À décider :** garder l’onglet Accueil sur téléphone, ou n’avoir que le village et le menu pause.

### 3.2 Les quêtes du portail dans le village

Sur l’**île de départ de chaque archipel**, l’**école du village** avec trois portes, une par matière. On y entre en touchant le bâtiment ou sa borne, comme une quête d’île. L’intérieur est un panneau HTML, le même que la page matière d’aujourd’hui : Homophones, Lecture, Tables, Fractions, Décimaux, Vocabulaire, Verbes irréguliers, puis les îles de la matière.

- Une quête du portail réussie rapporte **des blocs de l’île de l’école** (même barème que les quêtes d’île, proportionnel au score). Les deux boucles n’en font plus qu’une.
- Les **étoiles** remplacent les records en pourcentage (déjà fait dans les bilans).

**À décider :** les quêtes du portail comptent-elles pour les Gardiens ? Proposition : non. Le Gardien reste lié aux quêtes de son île.

### 3.3 Succès et Réglages

- **Salle des trophées** sur l’île de départ : les succès y sont des objets posés, ce qui donne une raison d’y retourner. La page Succès actuelle s’ouvre en touchant le bâtiment, en panneau.
- **Réglages** : dans le menu pause, partout (déjà en partie : réglages rapides du mode concentration). La page complète reste accessible depuis ce menu.

### 3.4 Navigation

- **Dans le village** : la barre du monde (Carte, Blocs, jour/nuit, aide) plus le bouton ⏸.
- **Dans un bâtiment ou une quête** : le panneau et le bouton retour en pastille ; en partie, le mode concentration.
- **Les onglets** du téléphone disparaissent : le village et le menu pause les remplacent.

**À décider :** avec le 1, les onglets tombent. Sinon, ils deviennent Village, Quêtes, Trophées.

## 4. Ce qui change dans le code (estimation)

| Morceau | Travail |
| --- | --- |
| Routage | `/` ouvre le village. `/menu` remplace l’accueil actuel (pour la vue simple et l’accès direct). Les anciennes adresses restent valides. |
| Monde | Un nouveau type de lieu : le bâtiment-porte (école, trophées), posé par les plans comme les autres bâtiments (`world/plans/`), et touchable (`onPickBuilding`) dans les vues 3D et 2D. |
| Panneaux | `SchoolSheet` (réutilise `SubjectPage`) et `TrophySheet` (réutilise `ProgressPage`), à la place du panneau d’île. |
| Barème | `recordSession` du portail rapporte aussi des blocs (`engine.complete` ou une variante), avec les tests du barème et la page générée « Barème ». |
| Menu pause | Il devient le menu du village. `FocusMode` en a déjà la forme. |
| Documentation | Le manuel est réécrit (Démarrer, Les quêtes, Blocland), ainsi que l’architecture, et les pages générées sont étendues au bâtiment école. |

Taille estimée : **3 à 4 pull requests** de la taille du lot 2.

## 5. Les étapes proposées

1. **L’école du village** (seule, sans rien retirer) : le bâtiment et sa porte, le panneau des matières, les blocs gagnés au portail. L’accueil actuel ne bouge pas. On observe si les élèves y vont.
2. **Le village au démarrage** : « Jouer » ouvre le village, l’accueil devient le menu pause, `/menu` reste pour la vue simple.
3. **La salle des trophées**, puis le retrait des onglets si l’étape 2 est adoptée.
4. **Le nettoyage** : pages en double, textes du manuel, parcours de la vue simple.

Chaque étape est livrable seule et réversible.

## 6. Les risques

- **Charge cognitive** : un élève dys qui cherche « les fractions » doit les trouver sans explorer. Parades :
  - la porte de l’école porte le nom de la matière en HTML sous le monde ;
  - le menu pause donne un accès direct ;
  - « Continuer » ramène à la dernière quête.
- **Appareils modestes** : le village au démarrage charge la 3D d’emblée. La vue 2D (plus légère) et la liste restent proposées ; l’appli choisit la liste si WebGL et Canvas manquent.
- **Usage en classe** : l’accès direct aux quêtes (adresses, menu pause) est indispensable pour un enseignant ou une orthophoniste.

## 7. Questions ouvertes

1. Le village au démarrage pour tous, ou en option dans les Réglages au début ?
2. Les quêtes du portail rapportent-elles des blocs, et lesquels : ceux de l’île de l’école, ou un bloc « livre » propre à l’école ?
3. Garder un onglet ou un bouton « Quêtes » toujours visible, pour les élèves qui ne veulent pas du village ?
