# DysApps

Applications d’entraînement pour les **élèves dys du collège** (dyslexie, dysorthographie, dyscalculie), utilisables en autonomie sur tablette, téléphone ou ordinateur.

Site en ligne : https://g7ed6e.github.io/dysapps/

## Ce que contient le socle

- **Style « monde en blocs »** sur toute l’interface : fond crème `#FBF6EA` à grain pixel très discret, barre du haut en terre et herbe, boutons de pierre (et d’herbe pour l’action principale) à biseau pixel, panneaux à coins carrés et biseau, bandeaux texturés (herbe, planches, pierre, sable, or) en tête des cartes, jauge d’XP segmentée, écusson de rang pixel (contour crénelé, minerai du rang à l’intérieur : cuivre, fer, or, platine, diamant, légende). L’icône de l’appli (écran d’accueil, PWA) est un bloc d’herbe isométrique en pixels sur fond de ciel, générée par un script comme les textures. Les textures (`src/styles/textures/`, PNG 16 × 16 générés par le code, jamais empruntés) ne sont jamais placées derrière du texte : le texte à lire reste sur un fond uni. Les thèmes Clair et Contraste élevé restent plats (sans texture ni biseau). Icônes Lucide. La police « affiche » (Archivo Black) ne sert qu’aux titres courts, la police pixel (Silkscreen) qu’au logo et aux compteurs : le texte à lire reste dans la police dys choisie.
- **Aventure Blocland** : le village est en ruine, l’élève est le bâtisseur. Cinq biomes = cinq modules (Forêt des sons, Mine des lettres, Carrière des mots, Ferme des accords, Tour du lecteur), chacun avec sa créature originale qui donne les quêtes (Mousso le golem de mousse, Tunel la taupe, Rouxel le renard, Bloquette la vache, Grimoire le hibou) et son type de bloc. Univers et créatures sont dessinés en cubes (`src/blocland/Voxel.tsx`).
- **Portail** : accueil par matière (Français, Maths) et catalogue des quêtes.
- **Réglages d’affichage** : police (Luciole, OpenDyslexic, Atkinson Hyperlegible, Arial), taille (jamais moins de 18 px), interlignage (jamais moins de 1,5), espacement des lettres et des mots, thèmes (crème, nuit, clair, contraste élevé), réduction des animations.
- **Syllabes en couleurs alternées** (activable) : découpage écrit par règles (`src/core/syllables.ts`, vérifié sur une quarantaine de mots), appliqué aux textes de lecture, aux consignes et aux messages des créatures.
- **Lecture vocale** : les consignes sont lues à voix haute dès qu’elles apparaissent (désactivable) et relançables avec le bouton 🔊 ; synthèse vocale du navigateur, sans serveur, vitesse réglable.
- **Gamification** : XP, niveaux et rangs (Bronze I → Diamant III, puis Légende), combos, 12 succès, et des messages façon jeu vidéo (« BIEN VU ! », « COMBO x5 », « QUÊTE TERMINÉE »).
- **Pas de stress** : pas de chronomètre, un joker (indice) disponible avant de répondre ou après une erreur, et un point d’effort même quand la réponse est fausse.
- **Moteur d’exercices** `QuizSession`, réutilisable par toutes les activités.
- **Progression enregistrée sur l’appareil** (`localStorage`) : pas de compte, pas de serveur, aucune donnée ne quitte l’appareil.
- **PWA** : l’application s’installe sur l’écran d’accueil et fonctionne hors ligne après la première visite.

## Quêtes disponibles

- **Homophones** (Français) : 13 paires réparties en 3 niveaux — Les bases : a/à, et/est, son/sont, on/ont ; Confirmé : ces/ses, ou/où, ce/se, la/là/l’a ; Expert : leur/leurs, quand/quant/qu’en, peu/peut/peux, -é/-er, c’est/s’est. Quêtes de 10 phrases par niveau ou entraînement ciblé sur une paire. Le joker donne l’astuce de remplacement (« remplace par *avait* »), la correction rappelle la règle. Les phrases sont dans `src/apps/homophones/sets.json` (vérifiées par les tests : un seul trou, jamais en début de phrase, chaque réponse travaillée).

- **Tables & calcul mental** (Maths) : 6 quêtes de 10 calculs générés au hasard — tables faciles (× 2, 3, 4, 5, 10), tables costaudes (× 6 à 9), divisions, compléments à 10 et à 100, doubles et moitiés, × et ÷ par 10, 100, 1 000 — et la révision d’une table complète. 4 réponses rangées dans l’ordre croissant, avec des pièges tirés des erreurs fréquentes (oubli de retenue, table voisine…). Le joker donne une astuce et une aide visuelle : grille de points groupés par 5, boîte de 10, droite par bonds ou tableau de numération. Les consignes sont lues « 7 fois 8 » et non « 7 × 8 ».

- **Fractions** (Maths) : 5 quêtes de 8 questions générées — lire une fraction (barres et disques), comparer (même dénominateur, même numérateur, fractions égales), fractions égales, fraction d’une quantité, repérage sur la droite graduée. Fractions écrites en colonne et lues en toutes lettres (« 3 quarts »). Le joker les dessine : barres alignées, groupes de points.

- **Nombres décimaux** (Maths) : 6 quêtes de 8 questions générées — lire un décimal (chiffre des dixièmes, centièmes…), comparer (piège « 3,45 > 3,5 »), droite graduée au dixième, fractions décimales, × et ÷ par 10, 100, 1 000, compléter à 1. Calculs en millièmes entiers (aucune erreur d’arrondi). Le joker ouvre le tableau de numération avec la virgule marquée et des zéros grisés pour aligner.

- **Lecture** (Français) : 5 textes du domaine public — *Le Corbeau et le Renard*, *La Cigale et la Fourmi*, *Le Loup et l’Agneau* (La Fontaine, texte intégral), *La chèvre de monsieur Seguin* (d’après Daudet) et *Le pari de Phileas Fogg* (d’après Jules Verne), textes adaptés. Une ligne par vers ou par phrase, couleurs alternées, lecture à voix haute qui surligne la ligne lue (ou une seule ligne au toucher), mots difficiles expliqués, puis 5 questions de compréhension. Le joker cite le passage à relire ; le texte reste consultable pendant les questions. Textes et questions dans `src/apps/lecture/texts.json`.

## Moteur d’exercice Blocland

- Un exercice = un fichier JSON dans `src/blocland/exercises/data/` (format du brief : `instruction`, `items`, `feedback` avec `{word}`/`{heard}`/`{answer}`, `reward`, `adaptive`), référencé dans `src/blocland/exercises/index.ts`. Le champ `type` choisit le composant d’item (`src/blocland/exercises/registry.ts`) ; le type générique `qcm` est fourni.
- `ExerciseRunner` : la créature lit la consigne, un item à la fois, feedback immédiat jamais punitif (bonne réponse + explication d’une ligne) dans le bandeau fixe, puis écran de récompense.
- `engine.ts` (logique pure, testée) : score (1 point du premier coup, ½ avec aide ou après erreur), **étoiles** (1 = terminé, 2 = ≥ 70 %, 3 = ≥ 90 %, la meilleure compte), **blocs** proportionnels au score (jamais 0 dès une bonne réponse), **XP** à chaque exercice terminé (+50 % sans aide ni erreur), **répétition espacée** des items ratés à J+1, J+3, J+7, J+15 (sortie après 3 réussites d’affilée), **streak** quotidien qui se fissure après un jour manqué (réparable le lendemain) avec un coffre de 6 blocs tous les 3 jours, **adaptation** du niveau par type d’exercice (monte après 2 sessions ≥ `promoteAt`, descend après 2 sessions ≤ `demoteAt`, jamais affiché comme une baisse).
- Sessions courtes : après 3 exercices (ou 10 minutes), l’app propose d’arrêter.
- Tout est enregistré sur l’appareil (`localStorage`, clé `dysapps:blocland`), et l’XP alimente aussi les rangs et succès communs à toute l’app.

## Exercices des biomes

| Biome | Exercice | Contenu | Adaptation dys |
|---|---|---|---|
| Forêt des sons | **Chasse au son** | 6 sons ([an], [on], [oi] ; [in], [ch]/[j], [s]/[z]), 12 mots avec pictogramme par son, 4 par écran | mots lus à voix haute, correction « dans *bonbon* on entend [on] » |
| Forêt des sons | Abattage syllabique | compter les syllabes (QCM d’attente) | |
| Forêt des sons | **Rimes-échelle** | 3 mots repères (chapeau, ballon, fourchette), 8 mots avec pictogramme chacun, 4 par écran : on tape ceux qui riment | mot repère et mots lus à voix haute, correction « écoute la fin de *souris* : [i] » |
| Mine des lettres | **Filon** | cibles b, d, p, q parmi les lettres miroirs | vitesse selon le niveau, ne monte qu’après 90 % ; « Plus lent » ; avec « réduire les animations », le bloc attend |
| Mine des lettres | **Oreille du mineur** | dictée à choix : on entend le mot dans une phrase, puis on choisit entre deux écritures proches (vin / fin, poule / boule, dent / temps, gâteau / cadeau…) | rien à lire avant d’écouter, lecture automatique, indice « le v vibre dans la gorge, comme dans vélo » |
| Carrière des mots | **Mot troué** | 2 niveaux × 10 mots, 3 blocs dont un piège phonétiquement plausible | mot lu à voix haute, correction lettre par lettre |
| Carrière des mots | **Familles-craft** | assembler un mot à partir d’une racine et d’un préfixe (re-, dé-, im-, mé-, pré-) ou d’un suffixe (-et, -eur, -eux, -able, -age, -nette), à partir de sa définition | définition lue, mot reconstitué affiché après la réponse |
| Carrière des mots | **Coffre à mots** | dictée à choix de mots-outils (toujours, beaucoup, maintenant, plusieurs, quelquefois…) parmi 3 écritures | mot lu, indice mnémotechnique après l’erreur ; les mots entrent dans la répétition espacée |
| Ferme des accords | **Tri des graines** | a/à, et/est, on/ont, son/sont, ce/se (phrases de la quête Homophones) | astuce de substitution après l’erreur |
| Ferme des accords | **Enclos** | 4 sujets par écran, on choisit le verbe au singulier ou au pluriel ; niveau 2 avec pièges (« le chien de mes voisins », « Paul et Léa », « tout le monde ») | sujet et verbe lus ensemble, explication de la marque du nombre |
| Ferme des accords | **Récolte -é / -er / -ez** | phrases à trou, trois terminaisons | règle de substitution (« après *va*, on peut dire *vendre* : -er ») |
| Tour du lecteur | **Ascension** | 3 textes originaux de 70–80 mots en 4 paragraphes | mode manuel, un étage par paragraphe, temps discret comparé aux lectures précédentes |

Les biomes s’ouvrent dans l’ordre : une étoile dans le biome précédent débloque le suivant. À niveau égal, l’exercice le moins joué est proposé.

**Le Gardien** (boss de biome) : chaque biome a un Gardien (le Grand Chêne, le Golem de roche, la Dune vivante, le Taureau de terre, la Chouette de verre). Il accepte le défi quand chaque quête du biome a au moins deux étoiles ; la page du biome dit ce qui manque. Le défi (`src/blocland/boss.ts`) enchaîne deux manches de chaque quête du biome, tirées d’exercices au niveau de l’élève, avec leurs écrans et leurs corrections habituels, sans chrono. Deux étoiles = Gardien vaincu : blocs d’or, XP, succès « Face au Gardien » puis « Maître des cinq îles », et un bloc d’or planté sur l’île. On peut le réaffronter. **L’arène** : le Gardien est une grande créature en cubes (le Grand Chêne aux yeux d’or, le Golem, la Dune, le Taureau, la Chouette de verre) qui respire face à l’élève ; sa **jauge de résistance** baisse à chaque épreuve réussie (jamais de jauge pour l’élève), il s’incline quand on réussit, gronde doucement quand on rate, s’écroule quand il est vaincu, et dit une réplique à chaque épreuve (lue à voix haute). Tambour à l’entrée, fanfare à la victoire, coupés avec les sons du village ; animations neutralisées par « réduire les animations ». **Dans le village en 3D**, dès qu’un Gardien accepte le défi, il apparaît sur un îlot de pierre devant son île (en couleurs, il respire) ; le toucher lance le défi. Vaincu, il devient une statue de pierre avec un bloc d’or à côté.

## Blocland en immersion

- **Le monde en plein écran** : quand « Vues en 3D » est actif (et WebGL disponible), `#/aventure` est le village en 3D sur tout l'écran sous la barre du haut (`src/blocland/WorldPage.tsx`, coquille `.app-shell.immersive`). On tourne, on se déplace, on zoome ; la barre du bas donne Carte, Chantier, jour forcé la nuit, aide.
- **Panneaux glissants** : toucher une île fait voler la caméra et ouvre son panneau (`IslandSheet.tsx`, HTML en police dys) qui glisse depuis le bas (depuis la droite sur grand écran) sans quitter le monde : créature et sa phrase d'accueil (lue à voix haute), quêtes avec étoiles, Gardien (verrouillé tant qu'il manque des étoiles), le plan de l'île avec son avancement, les blocs possédés et le bouton pour poser. L'URL `#/aventure/:ile` garde le panneau ouvert : après un exercice, on revient au même endroit.
- **Vue simple conservée** : sans WebGL ou avec « Vues en 3D » désactivé, `#/aventure` et `#/aventure/:ile` restent les pages en listes (carte des biomes, page du biome).
- **Le continent qui monte** (`src/blocland/world/map.ts`, cadrage dans `docs/cadrage-monde.md`) : les vingt îles sont placées à la main sur une carte, chacune avec un cœur de 12 × 12 (plans, créature, décor) posé sur une terre plus large aux contours irréguliers, un paysage (collines, montagnes enneigées, cratère de lave, lacs, plages, arbres, sapins, fleurs, roseaux, cristaux selon la région) et une altitude qui monte avec la classe (6e au niveau de la mer, 3e sur les sommets). Les îles en altitude flottent sur une roche qui s'amincit ; les ponts deviennent des rampes à marches entre deux altitudes et contournent l'îlot du Gardien. Les îles verrouillées restent visibles, délavées comme dans la brume. Quatre paires d'îles se touchent par un isthme de terre, franchi par un sentier de pierres de gué. Les autres sont reliées par des ouvrages de natures différentes : pont, bac, escalier taillé, tunnel à lanternes, col à garde-fou. Un pont ou un bac coûte des blocs ; un escalier demande aussi le premier plan de l'île terminé, un tunnel ou un col son Gardien vaincu. Chaque île construit son propre bâtiment (dôme, longère, gradins, atelier en L, tour ronde…). Une quête donne plus de blocs avec plus d'étoiles, et un bonus la première fois ; construire un ouvrage fait voler la caméra jusqu'à l'île qui s'ouvre. Un bonhomme, l'avatar de l'élève, se tient sur l'île où l'on est et marche d'île en île le long des ouvrages construits. Le monde vit : un repère par région (grand chêne, champignon géant, volcan qui fume, tour de guet, grand phare), des cascades qui tombent des îles en altitude, des lanternes au bout des ouvrages la nuit, de la brume sous les sommets, des oiseaux, et des baleines qui soufflent au large.
- **Archipel et ponts à construire** (`src/blocland/world/archipelago.ts`) : chaque île a une colonne et une rangée (rangée 0 : le français, la Forêt au centre ; rangée 1, devant : les maths, à venir). Seule la Forêt est ouverte au début ; les autres îles sont grises tant qu'aucun chemin de **ponts construits** n'y mène. Un pont se construit depuis le panneau d'une de ses deux îles (ou la page du biome en vue simple) et coûte quelques blocs (3 depuis la Forêt, 5 ensuite), de **n'importe quel type gagné sur une île** (bois, pierre, sable, terre, verre, or, cristal ; jamais les kits de finition des plans) : les types les plus nombreux sont pris d'abord. Depuis la Forêt, deux directions au choix (Mine ou Ferme) : la progression n'est plus linéaire. La **Plaine des nombres** (maths) est la deuxième île de départ, devant la Forêt, reliée par un pont déjà construit ; la Rivière des fractions et le Volcan des décimaux l'encadrent, atteignables aussi depuis la Mine et la Ferme. Huit îles au total. Dans le monde, un pont constructible est dessiné en fantôme, un pont construit en planches, un pont trop loin n'apparaît pas. Les sauvegardes d'avant les ponts gardent leurs îles ouvertes (les ponts du chemin sont offerts).

## Îles de maths (public dys)

- **Plaine des nombres** (calcul mental, bloc **brique**, créature Coco la coccinelle à dix points, Gardien le Hanneton de bronze, trois plans : le nid, son toit, sa cour). Quêtes : **Champ des tables** (tables 2, 5, 10 → 3, 4 → 6 à 9), **Pont de dix** (compléments à 10, puis à 100), **Doubles et moitiés**.
- **Rivière des fractions** (bloc **galet**, créature Nénu la grenouille des nénuphars, Gardien le Brochet d'argent, plans : la hutte, son toit, son ponton). Placée devant la Mine : on y arrive par la Plaine (3 blocs) ou par la Mine (4 blocs). Quêtes : **Nénuphars** (lire une fraction sur une figure, puis sur la droite graduée), **Deux rives** (comparer, barres sous les yeux), **Partage du gâteau** (fraction d'une quantité avec les points, puis fractions égales).
- **Volcan des décimaux** (bloc **obsidienne**, créature Lavi la salamandre de lave, Gardien le Dragon de cendre, plans : l'abri, son toit, sa terrasse). Placé devant la Ferme : par la Plaine (3 blocs) ou par la Ferme (4 blocs). Quêtes : **Cratère des rangs** (chiffre d'un rang, fraction décimale, × ÷ 10, 100, 1 000 dans le tableau de numération), **Coulée de lave** (comparer deux décimaux, tableau avec zéros ajoutés), **Pente graduée** (décimal sur la droite, puis compléter à 1).
- **Cycle 4** (`docs/cadrage-college.md`, `exercises/college.ts`) : **Glacier des relatifs** (5e, bloc glace, Frimas le pingouin, le Mammouth de givre) : Thermomètre (comparer, lire un point), Banquise (additions et soustractions avec le bond sur la droite), Crevasses (multiplications et divisions, règle des signes affichée). **Marché des proportions** (5e, bloc toile, Bazar le raton, le Colporteur) : Étals (tableau de proportionnalité), Remises (pourcentages, hausse et baisse), Balances (vitesses, échelles). Rangée 2 de l'archipel, devant les îles de maths 6e. Nouvelles aides en données : droite des relatifs, tableau de proportionnalité, rappel de règle.
- **Français du cycle 4** (rangée −1, derrière la Forêt) : **Carrefour des homophones** (5e, bloc panneau, Sema le caméléon, le Sphinx des routes) : Panneaux (les jeux ses/ces, ou/où, la/là/l’a, leur/leurs, quand, peu, c’est/s’est de la quête Homophones, règle affichée), Aiguillage (quel/qu’elle, sans/s’en, dans/d’en, ni/n’y, si/s’y, plus tôt/plutôt, près/prêt), Bifurcation (deux trous, une paire de mots). **Marais des temps** (5e, bloc tourbe, Kroa le triton, l’Hydre des marais) : Rives du passé (imparfait / passé composé, passé simple), Brume du futur (futur / conditionnel, formes du futur), Roseaux du subjonctif (subjonctif présent, reconnaître un temps). Données JSON dans `exercises/data/`, écran de calcul réutilisé avec un rappel de règle toujours visible.
- **Maths 4e** (rangée 2) : **Forge des puissances** (bloc acier, Braise le golem forgeron, le Titan d'acier) : Étincelles (puissances de 10 dans les deux sens, notation scientifique), Enclume (puissance d'un nombre, produits et quotients de puissances), Trempe (racines carrées, diviseurs et nombres premiers). **Atelier du calcul littéral** (bloc calque, Ixe le robot, le Golem des équations) : Réduire, Développer (simple puis double distributivité), Équilibre (équations en une puis deux étapes). Exposants en caractères Unicode, règle affichée sur chaque item.
- **Français 4e** (rangée −1) : **Falaise des accords** (bloc ardoise, Cléa la chèvre, le Bélier de granit) : Corde du participe (être / avoir, puis COD placé avant), Paroi des adjectifs (accord et attribut, puis couleurs et cas particuliers), Sommet du sujet (« qui est-ce qui ? », sujet inversé ou éloigné, « on », « qui », deux sujets). **Cabinet des mots** (bloc parchemin, Plume la pie, le Hibou lexicographe) : Racines (racines gréco-latines, préfixes et suffixes), Sens (propre / figuré), Nuances (synonymes, antonymes, registres). Dix exercices JSON, règle affichée sur chaque item.
- **Maths 3e** (rangée 2 et rangée 3, tout devant) : **Belvédère de Thalès** (bloc marbre, Théo le héron, le Sphinx de marbre) : Pythagore (hypoténuse, puis un côté, figure codée), Thalès (longueur manquante, tableau de proportionnalité), Trigo (cos, sin, tan : le bon rapport). **Observatoire des données** (bloc quartz, Stat la chouette, le Comptable des étoiles) : Moyenne (puis médiane et étendue, série en barres), Chances (probabilités : sac, dé). **Phare des fonctions** (bloc prisme, Fi la lampe, le Dragon de lumière) : Images (image puis antécédent, tableau de valeurs), Droites (coefficient directeur, linéaire ou affine). Nouvelles figures en données : triangle rectangle codé, configuration de Thalès, barres.
- **Français 3e** : **Observatoire des textes** (bloc lentille, Astra la luciole, le Grand Lecteur) : Inférences (ce que la phrase laisse comprendre : lieu, moment, sentiment, cause), Figures (comparaison, métaphore, personnification, hyperbole ; énumération, répétition, antithèse, litote), Rouages (nature des mots, fonctions, connecteurs logiques). Six exercices JSON. L'archipel compte **vingt îles** (dix de français, dix de maths), de la 6e à la 3e. Succès : « Collégien·ne » (dix Gardiens), « Maître de l'archipel » (tous), « Archipel bâti » (tous les plans).
- **Contenu réutilisé** : les items viennent des générateurs des quêtes de maths existantes (`src/apps/tables/generators.tsx`, `src/apps/fractions/generators.tsx`, `src/apps/decimaux/generators.tsx`), tirés de façon reproductible par exercice (`src/blocland/exercises/maths.ts`). Les aides visuelles sont décrites en données (`{ kind, props }`) et redessinées par l'écran `CalculScreen` (grille de points, boîte de dix, droite par bonds…).
- **Règles dys** : une seule opération par écran, énoncé lu à voix haute (« 7 fois 8, combien ? »), **aide visuelle toujours affichée** (pas seulement après une erreur), réponses rangées dans l'ordre croissant, indice sur demande (compte dans le score, jamais pénalisant), correction qui explique, pas de chrono.

## Chantier (construction)

- **Construire, sans page à part** : il n'y a plus de page Chantier. Le plan de l'île est dans son panneau (en 3D) ou sur sa page (vue simple) : avancement, blocs manquants et où les gagner, bouton « Poser le bloc suivant », inventaire en lecture, bâtiments déjà terminés ici. En 3D, toucher une case bleue du bâtiment dans le monde pose le bloc attendu (`usePlanBuilder`, `PlanSection`). La construction est entièrement guidée par les plans.
- **Les plans** (`src/blocland/world/plans/*.json`, cadrage dans `docs/cadrage-village.md`) : chaque île a un bâtiment en ruine à reconstruire (la cabane de Mousso, la forge de Tunel, le four de Rouxel, l'étable de Bloquette, le phare de Grimoire), dessiné en **fantômes bleutés** dans le monde. On touche un fantôme pour y poser le bloc attendu (le type est imposé par le plan, dans n'importe quel ordre), ou le bouton « Poser le bloc suivant » (vue simple comprise). Le panneau du plan montre l'avancement et les blocs qu'il manque avec le biome où les gagner. Plan terminé : phrase de la créature (lue à voix haute), coffre de blocs, XP, succès « Bâtisseur·se », « Architecte » (5) et « Village reconstruit » (15). **Trois plans par île**, enchaînés (le suivant apparaît quand le précédent est fini) : le bâtiment, puis son toit avec porte et lanterne, puis sa cour avec barrières et escalier. Les **blocs de finition** (toit, porte, lanterne, barrière, escalier) ne se gagnent pas dans les biomes : le coffre de chaque plan fournit le kit du suivant, plus quelques blocs de l'île d'après ; le dernier plan d'une île donne de l'or et du cristal (utiles pour les ponts). La lanterne brille (surtout la nuit). Une créature dont la maison est finie en parle quand on la touche. **Journal du village** : chaque bâtiment terminé est daté, rappelé dans le panneau de son île ; le profil compte les bâtiments.
- **Le monde qui vit** : jour et nuit selon l'heure réelle de l'appareil (`world/daylight.ts`, aube à 7 h, crépuscule à 20 h, transitions douces : ciel, brume, lumière et eau changent ; bouton « Forcer le jour » la nuit), nuages qui dérivent, eau à crêtes pixel qui ondule, créatures qui font un pas de temps en temps et se balancent, et disent une phrase quand on les touche (affichée en HTML, lue à voix haute), éclats de la couleur du bloc à la pose. « Réduire les animations » fige tout (ciel fixé au moment de l'entrée).
- **Finitions** : tutoriel d'entrée (trois bulles courtes, lues à voix haute, une seule fois par appareil, bouton « Revoir l'aide ») dans le village et le chantier ; clavier dans la scène (le canvas prend le focus, flèches pour se déplacer, + et − pour zoomer) ; réglage « Sensibilité de la caméra » ; rappel de pause après dix minutes de construction (sans rien bloquer) ; rendu en pause quand le canvas est hors écran ou l'onglet caché, finesse du rendu baissée automatiquement si l'appareil peine ; test du budget de faces du village entièrement construit.
- **Sons** (Web Audio, générés par le code, aucun fichier) : un « toc » à la pose, un « pop » au retrait, un refus doux ; jamais pendant la lecture à voix haute. Réglage « Sons dans le village » et bouton « Couper les sons » dans le chantier. **Ambiance** en option (réglage « Ambiance sonore du village », désactivé par défaut) : vent continu, oiseaux le jour, grillons la nuit.
- **Anciens chantiers** (grille 8 × 8, puis zone libre au tapis jaune des versions précédentes) : à la première ouverture, leurs blocs reviennent dans l'inventaire.
- **Textures pixel** : chaque type de bloc a une texture 16 × 16 générée par le code (herbe sur terre, pierre mouchetée, planches, sable, verre, or, cristal, feuilles, tronc), sans lissage ; ciel bleu et nuages en cubes. Aucune image ni texture empruntée à un jeu existant.

## Police Luciole

Luciole est la police par défaut. Ses fichiers WOFF2 (version 2.001, non modifiés) sont dans `public/fonts/luciole/`. Luciole © Laurent Bourcellier & Jonathan Fabreguettes (Perez), distribuée sous licence [Creative Commons Attribution 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/legalcode.fr) : le texte de la licence et le détail des crédits sont dans `public/fonts/luciole/`, et le crédit est aussi affiché dans l’application (page Réglages). La licence MIT du dépôt ne couvre pas ces fichiers de police.

## Développer

```bash
npm install
npm run dev        # serveur local : http://localhost:5173/
npm test           # tests (Vitest)
npm run build      # vérification TypeScript + build de production dans dist/
```

Le site est déployé à deux endroits : GitHub Pages (https://g7ed6e.github.io/dysapps/, dans un sous-dossier) et Cloudflare Workers (https://dysapps.guillaume-delahaye.workers.dev/, à la racine). Par défaut, le build sert le site à la racine (`/`), ce qui convient à Cloudflare. Pour GitHub Pages, le workflow construit avec `DEPLOY_TARGET=github` (préfixe `/dysapps/`) : en local, `DEPLOY_TARGET=github npm run build`.

## Ajouter une activité

1. Créer un dossier `src/apps/<id>/` avec un composant par défaut, par exemple :

   ```tsx
   import { QuizSession, type Question } from '../../components/QuizSession';

   function makeQuestions(): Question[] {
     return [
       { id: 'q1', prompt: 'Complète : « Ils … partis. »', choices: ['sont', 'son'], answer: 'sont',
         hint: 'Remplace par « étaient ».', explanation: '« Ils étaient partis » : verbe être.' },
     ];
   }

   export default function MonApp() {
     return <QuizSession appId="<id>" makeQuestions={makeQuestions} />;
   }
   ```

2. Dans `src/apps/registry.ts`, passer l’activité à `status: 'disponible'` et ajouter
   `component: lazy(() => import('./<id>/MonApp'))`.

`makeQuestions` est rappelée à chaque nouvelle séance, ce qui permet de générer des questions aléatoires.

## Déploiement

Le workflow `.github/workflows/deploy.yml` lance les tests et le build à chaque push et à chaque pull request, puis publie sur GitHub Pages à chaque push sur `main`.

À faire une seule fois : dans **Settings → Pages** du dépôt, choisir **Source : GitHub Actions**.

## Sécurité

- **Pipeline** : aucune permission par défaut ; seul le job `deploy`, qui n’exécute pas de code du dépôt, peut publier sur Pages. Actions épinglées par SHA (mises à jour par Dependabot), `persist-credentials: false`, pas de cache partagé, `npm ci --ignore-scripts` et vérification des signatures npm (`npm audit signatures`).
- **Site** : Content-Security-Policy stricte injectée au build (aucune ressource externe), `referrer` désactivé, aucune donnée envoyée hors de l’appareil.
- Les scripts d’installation npm sont aussi désactivés en local (`.npmrc`).

## Arborescence

```
src/
  apps/          activités (une par dossier) + registry.ts (catalogue)
  components/    Layout, Mascot, QuizSession, SpeakButton, XpBar…
  core/          réglages, synthèse vocale, progression/gamification, stockage
  pages/         accueil, matière, activité, réglages, progression
  styles/        thèmes et styles globaux
```

## Feuille de route (Blocland)

1. ✅ Coquille : profil d’accessibilité, lecture vocale des consignes, carte des biomes et créatures.
2. ✅ Moteur d’exercice générique (JSON), étoiles, récompenses en blocs, répétition espacée J+1/3/7/15, streak, adaptation, pause après 3 exercices.
3. ✅ Un exercice par biome : Chasse au son, Filon, Mot troué, Tri des graines, Ascension.
4. ✅ Inventaire et grille de construction isométrique.
5. ✅ Tous les types d’exercices annoncés ont du contenu (Rimes-échelle, Oreille du mineur, Familles-craft, Coffre à mots, Enclos, Récolte). Le Gardien (boss de biome) est en place. Reste : journal hebdomadaire.
