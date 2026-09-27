# Cadrage — « Blocland, l’appli entière »

Document de travail, **proposé et validé le 27 septembre 2026**. Les **étapes 1 (l’école du village), 2 (le village au démarrage) et 3 (la salle des trophées) sont construites** : voir [§ 8](#8-etape-1-ce-qui-est-construit), [§ 9](#9-etape-2-ce-qui-est-construit) et [§ 10](#10-etape-3-ce-qui-est-construit) , ainsi que le nettoyage de l’étape 4 ([§ 11](#11-etape-4-le-nettoyage)) ; seul le retrait des onglets reste à décider. Il répond au point 15 des propositions « une appli plus classique » (lot 3). Les lots 1 et 2 sont faits : écran de lancement, écran titre, « Continuer », menu principal, onglets, mode concentration, fin de partie qui enchaîne. Les points encore marqués **À décider** concernent les étapes 2 et 3.

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

**Décidé (étape 2) :** l’onglet Accueil devient l’onglet **Menu** (le menu en page) ; son retrait éventuel est pour l’étape 3, avec celui des onglets.

### 3.2 Les quêtes du portail dans le village

Sur l’**île de départ de chaque archipel**, l’**école du village** avec trois portes, une par matière. On y entre en touchant le bâtiment ou sa borne, comme une quête d’île. L’intérieur est un panneau HTML, le même que la page matière d’aujourd’hui : Homophones, Lecture, Tables, Fractions, Décimaux, Vocabulaire, Verbes irréguliers, puis les îles de la matière.

- Une quête du portail réussie rapporte **des blocs de l’île de l’école** (même barème que les quêtes d’île, proportionnel au score). Les deux boucles n’en font plus qu’une.
- Les **étoiles** remplacent les records en pourcentage (déjà fait dans les bilans).

**Décidé (étape 1) :** les quêtes du portail ne comptent pas pour les Gardiens ni pour les étoiles des îles. Le Gardien reste lié aux quêtes de son île.

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

## 8. Étape 1 : ce qui est construit

Livrée le 27 septembre 2026. L’accueil, les onglets et les adresses ne changent pas.

- **Une école par archipel**, sur son **île de l’école** (`school` de chaque archipel dans `world/archipelago.ts`) : la Forêt des sons en 6e (des deux îles de départ, celle du français, où l’on commence), le Marché des proportions en 5e, l’Atelier du calcul littéral en 4e, le Phare des fonctions en 3e (l’île de départ de chacun).
- **Le bâtiment** est posé par le terrain, pas par un plan : l’élève ne le construit pas, il est là dès le début. La terre autour du cœur est trop étroite pour lui (trois à six cases) ; il tient dans le cœur, devant à droite (5 × 4 cases, coin en `SCHOOL_AT`), entre les bornes de quête et le bord, hors de la zone des plans. La rangée de devant reste libre : le bonhomme y passe pour aller au port. Murs de brique, coins de pierre de taille, porte entre deux fenêtres, toit rouge, clocheton à cloche d’or.
- **On y entre** en le touchant (3D et 2D : cubes marqués `place: 'ecole'`, geste `onPickPlace` du contrat des vues ; en marche libre, le bouton « Entrer »), par le bouton **École** de la barre du monde (accès direct, sans explorer), par une ligne du panneau de l’île, ou en vue simple par un bouton de la carte des îles et une carte de la page de l’île. Le bonhomme marche jusqu’à la porte.
- **Le panneau** (`School.tsx`) : l’accueil de la créature de l’île, lu à voix haute, puis les **trois portes** (Français, Maths, Anglais) ; derrière chacune, les cartes des quêtes du portail de la matière (les mêmes que la page matière) et un lien vers les îles de la matière. La porte est dans l’adresse (`#/aventure/ecole?porte=maths`) : le lien de retour d’une quête (« École ») y ramène.
- **Les blocs** (question ouverte 2) : une quête du portail finie, lancée de l’école ou d’ailleurs, rapporte des **blocs de l’île de l’école de l’archipel où se tient le bonhomme**, au barème des quêtes d’île (`PORTAL_BLOCKS` × le score, bonus d’étoiles et de première fois) ; elle compte pour la série de régularité et ses coffres. Pas de bloc « livre » propre à l’école : le bloc de l’île sert tout de suite aux plans et aux ouvrages.
- **Sur téléphone**, la barre du monde passe aux icônes seules (six boutons avec l’école) ; elle défile si la place manque.

À observer avant l’étape 2 : combien d’élèves entrent à l’école depuis le monde plutôt que par l’onglet Quêtes.

## 9. Étape 2 : ce qui est construit

Livrée le 27 septembre 2026. Les deux choix ouverts n’ayant pas été tranchés, l’étape suit les propositions du cadrage, en réversible :

- **Le village au démarrage, en option** (question ouverte 1) : un réglage **« Au démarrage »**, « Le village de Blocland » par défaut, ou « Le menu ». L’accueil (`/`) mène au village (`/aventure`, sur l’île où se tient le bonhomme) ; sans dessin du monde (vue simple, ni WebGL ni Canvas), il reste le menu.
- **Le menu garde son adresse** : `#/menu` (l’ancien accueil, `pages/HomePage.tsx`), pour la vue simple et l’accès direct. Les liens « Menu » (retour du Tutoriel, de la carte des îles, bouton du bilan d’une quête du portail) y mènent. Les autres adresses ne changent pas.
- **L’écran titre** propose toujours **Jouer** (le village, déjà chargé derrière lui) et, s’il y a une quête en cours, **Continuer** d’abord. Il retient l’adresse d’ouverture : l’accueil qui mène au village ne fait pas perdre « Continuer ».
- **Le menu pause du village** (`MenuSheet.tsx`, `#/aventure/menu`) : un bouton ⏸ en haut à droite du monde ouvre un panneau, le monde reste chargé derrière. On y trouve Reprendre, Continuer, À revoir aujourd’hui, École du village, Quêtes, Succès, Réglages, Revoir l’aide du village, Tutoriel, et le menu en page.
- **Les onglets** (téléphone) : l’onglet Accueil devient **Menu**. Dans le monde, ils restent masqués comme avant ; le menu du village les remplace.
- **Pas encore fait** : le bouton retour du téléphone n’ouvre pas le menu du village (il revient à l’île précédente, comme avant). À reprendre à l’étape 3 si l’on retire les onglets.

À observer : combien d’élèves repassent le réglage sur « Le menu ».

## 10. Étape 3 : ce qui est construit

Livrée le 27 septembre 2026 : la salle des trophées. Le retrait des onglets, prévu ensuite « si l’étape 2 est adoptée », n’est pas fait : l’étape 2 vient d’être livrée, il faut d’abord voir si elle est adoptée.

- **Le bâtiment** : un lieu du village de plus (`trophees`, à côté de `ecole` dans `VILLAGE_PLACES`), sur la même île de l’école de chaque archipel, au milieu du cœur (4 × 3 cases, coin en `TROPHY_AT`), derrière les bornes et devant la zone des plans. L’arrière gauche, d’abord choisi, était caché par la créature dans la vue 3D. Un pavillon ouvert devant : colonnes de marbre, fond de velours, socles de marbre, toit de pierre de taille au faîte d’or.
- **Les succès sont des objets posés** : un trophée par succès gagné (`trophies.ts`), dans l’ordre des succès, à des places fixes (`TROPHY_SLOTS` : socles, faîte, second rang, bord du toit ; une place par succès, un test le vérifie). Le bloc dit la famille : or (exploits), cristal (rangs), quartz (Gardiens), lentille (voyages). Le monde se redessine quand un succès tombe.
- **Le panneau** (`TrophySheet.tsx`) : une phrase lue à voix haute, puis le profil de la page Succès (`ProgressBody`, partagé). La ligne « Succès » du menu du village y mène ; la page Succès reste là (onglet, barre du haut, `#/succes`). En vue simple, `#/aventure/trophees` mène à la page Succès.
- **On y entre** en touchant le pavillon ou un trophée (3D, 2D, « Entrer » en marche libre), ou par une ligne du panneau de l’île. Le bonhomme marche jusqu’à la salle.

## 11. Étape 4 : le nettoyage

Livrée le 27 septembre 2026.

- **Le bouton retour** du téléphone (ou du navigateur) ouvre le menu du village quand aucun panneau n’est ouvert (`useBackOpensMenu.ts` : une entrée d’historique de plus à la même adresse, remplacée par le menu au retour). Depuis le menu, un second retour quitte l’appli ou revient à la page d’avant : le retour n’enferme jamais l’élève.
- **Le tutoriel du village** passe de six à huit bulles : l’école et la salle des trophées (le bouton École entouré), puis le menu (le bouton ⏸ entouré, et le bouton retour).
- **La vue simple** : la page de l’île de l’école a les deux lieux (l’école, et la salle des trophées qui y est la page Succès) ; `#/aventure/trophees` mène à la page Succès.
- **Les mots** : « l’accueil » désignait l’ancien menu ; le manuel, les principes (« toujours au même endroit, avec les mêmes mots ») et les commentaires du code disent maintenant « le menu » (en page ou dans le village). L’accueil est l’adresse `/`, qui mène au village ou au menu selon le réglage.
- **Pages en double** : il n’en reste pas. La page matière et les portes de l’école partagent `SubjectApps`, la page Succès et la salle des trophées partagent `ProgressBody`. Le menu en page et le menu du village restent deux vues, l’une en page, l’autre en panneau sur le monde, avec les mêmes entrées.

**Reste à décider** : le retrait des onglets du téléphone (§ 3.4). Proposition : l’observer d’abord ; le menu du village et le bouton retour couvrent déjà ce que les onglets offraient dans le monde, où ils étaient masqués.

