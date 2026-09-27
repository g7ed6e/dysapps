# Cadrage — Le contenu pédagogique

Ce cadrage rassemble les décisions de contenu en vigueur : le collège de la 6e à la 3e en français et en maths, l’anglais, et les leçons du test mené dans la peau d’un élève de 6e dys. Il remplace les anciens cadrages du collège et de l’anglais, et le backlog de 6e. Il dit aussi la suite à couvrir, lot par lot.

Ce qui ne se répète pas ici :

- les règles dys, anglais compris (deux voix, pas de syllabes colorées, le trou lu « blank », entendre avant d’écrire) : [Principes dys](../pedagogie/principes.md) ;
- le format des exercices (`lang`, `choicesLang`, aides, `ORDER`, écrans) et les règles de rédaction : [Format des exercices](exercices.md) ;
- le référentiel du programme officiel et les exclusions : [Le référentiel des programmes](programmes.md) ;
- le game design (îles, ponts, ouvrages, Gardiens, Bloc-Navire) : [cadrage de Blocland](cadrage-blocland.md) et [cadrage d’Archipéo](cadrage-archipeo.md).

Le contenu livré, île par île, est décrit par les pages générées (archipel, îles, programmes officiels) : ce cadrage ne les recopie pas.

## Les décisions en vigueur

### Une île, un thème

- **Une île = un thème du programme**, avec une classe indicative (6e à 3e). En général trois missions par île ; la Mine des lettres en a deux, la Tour du lecteur une, l’Observatoire des données et le Phare des fonctions deux chacun.
- **Deux ou trois niveaux par mission** (deux en anglais), **huit items par exercice** (dix pour une dictée, avec `perRun`).
- **Le contenu monte, les règles ne changent pas** : de la 6e à la 3e, les mêmes principes dys ; en 4e et 3e, l’énoncé peut s’allonger mais reste découpé.
- **Chaque mission cite le programme** (`programme` dans `src/blocland/biomes.ts` et `src/apps/registry.ts`). Une île de 6e ne cite que le cycle 3 ; une île de 5e à 3e cite au moins une compétence du cycle 4 et peut consolider le cycle 3.

### Maths générées, français et anglais écrits à la main

- **Maths** : chaque mission est un générateur reproductible (`exercises/maths.ts`, `exercises/college.ts`), avec une aide en données toujours affichée. La liste des aides qui fait foi est `AID_COMPONENTS` dans `maths.ts`.
- **Français et anglais** : fichiers JSON écrits à la main (`src/blocland/exercises/data/`), sur les écrans existants (QCM, dictée à choix, écran à règle `CalculScreen` avec un rappel `rule-card` pour les accords, la conjugaison et la grammaire anglaise). Un nouvel écran est une décision de cadrage.

### La classe affichée

- La classe s’affiche sur les cartes et les panneaux (« Niveau 5e »). Les pages Français, Maths et Anglais listent les îles de leur matière, de la 6e à la 3e ; les archipels pas encore atteints y sont repliés.
- Aucune île n’est imposée : un élève de 3e peut commencer par la Forêt. L’anglais donne plus de choix, pas plus d’obstacles : il ne change pas les étapes du Bloc-Navire.

### Les îles par archipel et par matière

Un archipel par classe. En français et en maths, une île par grand thème ; en anglais, deux îles par classe : une de vocabulaire et d’écoute, une de grammaire.

| Archipel | Français | Maths | Anglais |
| --- | --- | --- | --- |
| 6e, Premiers Rivages | Forêt des sons, Mine des lettres, Carrière des mots, Ferme des accords, Tour du lecteur | Plaine des nombres, Rivière des fractions, Volcan des décimaux | Baie des mots, Horloge des verbes |
| 5e, Îles Brumeuses | Carrefour des homophones, Marais des temps | Glacier des relatifs, Marché des proportions | Comptoir, Manoir du passé |
| 4e, Anciens Ateliers | Falaise des accords, Cabinet des mots | Forge des puissances, Atelier du calcul littéral | Théâtre des voix, Gare du futur |
| 3e, Îles du Ciel | Observatoire des textes | Belvédère de Thalès, Observatoire des données, Phare des fonctions | Studio des ondes, Château des hypothèses |

Soit 28 îles et 79 missions, plus 7 missions au portail.

### L’anglais

Ce qui s’ajoute aux principes dys :

- **Niveaux visés** : A1 en fin de 6e (cycle 3), A2 en fin de 3e (cycle 4), au programme de langues vivantes.
- **Au portail**, deux missions. Vocabulaire : douze thèmes de huit mots (couleurs, nombres, famille, école, animaux, corps, vêtements, maison, nourriture, météo, jours et mois, loisirs), en trois niveaux (J’écoute, Je traduis, J’écris) plus « Un thème » pour réviser un seul thème. Verbes irréguliers : soixante verbes du collège, vingt par niveau, prétérit ou participe passé, correction « go – went – gone : aller ».
- **Les écrans** : les phrases à trou et les nombres passent par l’écran à règle (`CalculScreen`, `rule-card` toujours affiché) ; l’écoute (Ears, Listening) par la dictée, qui lit le mot dès l’affichage, avec des réponses en français (`choicesLang: "fr"`).
- **Les réponses** : les heures et les dates se répondent en écriture française (« 3 h 30 », « 3 mai ») ; les Faux amis se répondent en français ; les Dialogues du Théâtre sont une écoute dont la réponse est une réplique en anglais (sans `choicesLang`).
- **Lire en anglais** : Comprendre et Faux amis (Studio des ondes) se lisent en entier en anglais, texte et question, sans trou.
- **Les pièges** sont de vraies erreurs d’élève francophone (« goed », « he have », « dogg »).
- **Hors périmètre** : parler en continu et l’écriture libre.

### Les leçons du test élève de 6e

Le test, joué comme un élève de 6e dyslexique (11 ans, lecture lente, souvent sur tablette, parfois sans le son), a fixé la plupart des règles des principes dys : syllabes entendues, pas de couleurs sur le mot à découper, consigne toujours écrite, correction complète, mots de résultat courts, pas de question piège, astuce du facteur le plus simple. S’y ajoutent, pour écrire un item :

- **Un seul critère par exercice** : une consigne ne dit pas « écoute » pour corriger ensuite sur l’écrit. Un test de données interdit une syllabe faite d’un e muet seul.
- **Un habillage de collège** : un élève de 11 ans ne doit pas se sentir en CP. On garde la conscience phonologique, mais avec des mots plus longs, des rimes riches, des sons proches ou des lettres qui trompent ; pas de « comme dans la chanson ». Un élève à l’aise atteint vite le niveau 3 « collège » de la Forêt.
- **Une image qui aide, jamais qui fait douter** : un emoji montre le mot lui-même (🦷 dent, pas 😁), sinon on change d’emoji ou de mot.
- **Le feedback n’est jamais dur** : pas de « Raté », pas de capitales, pas d’argot, les mêmes mots d’une réponse à l’autre.
- **Les mots difficiles avant le texte** : un texte de lecture donne son lexique avant qu’on le lise, pas après.

Le test a aussi confirmé ce qu’il faut garder : les séances courtes, la correction qui explique la règle, le point d’effort, les fractions en colonne, les lignes numérotées et colorées de la lecture, et un univers qui donne envie d’entrer.

## La suite à couvrir

Le rattachement des missions aux [programmes officiels](programmes.md) a mis en face du contenu ce qui manque. Une pull request par lot ; chacune retire de `src/programme/exclusions.ts` les exclusions « à couvrir » qu’elle couvre. Certains manques n’ont pas d’exclusion : la compétence est déjà citée par une mission, mais une partie n’est pas travaillée.

Trois missions des anciens cadrages n’ont jamais été livrées : les conversions des Balances (la mission ne fait que vitesses et échelles), « mais / mes / met » à l’Aiguillage, et les missions **Lecture** (lire un diagramme, lire un graphique) de l’Observatoire des données et du Phare. L’aide `value-table` (tableau de valeurs) n’existe pas : le Phare utilise `ratio-table`.

1. **Île « Grandeurs » (maths 6e, Premiers Rivages)** : durées et horaires (Horloges), conversions (Balances), périmètres, aires et angles (Clôtures), tableaux et diagrammes (Relevés), volumes et contenances, problèmes à étapes. Les Premiers Rivages passent à quatre îles de maths. Exclusions : `c3.ma.grandeurs.*`, `c3.ma.nombres.donnees`, `c3.ma.nombres.problemes`, en partie `c3.fr.lecture.documents` et `c4.ma.c.conversions`.
2. **Maths 6e, automatismes** : division et opérations posées (Plaine, quatrième mission), grands nombres (Volcan, quatrième mission « Nombres géants »), encadrer une fraction, ranger et intercaler des décimaux. Exclusion : `c3.ma.nombres.grands-entiers`.
3. **Français 6e** : les mots-outils manquants de la liste officielle (Coffre à mots) ; l’accord dans le groupe nominal et le sujet inversé (Ferme) ; la compréhension (Tour, « Étages du sens ») et la grammaire de base, attribut, épithète, complément du nom, types et formes de phrases, phrase simple et complexe (Tour, « Vitraux des phrases ») ; synonymes et polysémie (Carrière). Exclusions : `c3.fr.langue.genre-nombre`, `sujet`, `attribut-gn`, `types-formes`, `phrase-complexe`, `c3.fr.lecture.reprises`.
4. **Français 5e-4e** : présent, impératif et plus-que-parfait (Marais, quatrième mission), futur antérieur et valeurs des temps, « mais / mes / met » et autres homophones, verbes pronominaux et apposition (Falaise), champ lexical et niveaux de langue (Cabinet). Exclusion : `c4.fr.langue.reseaux-de-mots`.
5. **Maths 5e-3e** : divisibilité et facteurs premiers (Forge), fractions du cycle 4 (Glacier, quatrième mission « Icebergs des fractions »), priorités et tester une égalité (Atelier), factoriser et équations produits, ratio et conversions (Marché), effectifs, fréquences et lecture de diagramme (Données, « Relevés »), lecture graphique d’une fonction (Phare, nouvelle aide `graph`), réciproques de Pythagore et de Thalès (Belvédère). Exclusions : `c4.ma.a.fractions`, `c4.ma.a.calcul-fractions`, `c4.ma.b.ratio`, `c4.ma.b.lire-donnees`, `c4.ma.b.effectifs-frequences`, `c4.ma.c.conversions`.
6. **Français 3e** : subordonnées et pronom relatif, passif et forme impersonnelle, attribut du COD et apposition, énonciation et discours rapporté (Observatoire des textes, quatrième mission « Voix des textes »), document composite. Exclusions : `c4.fr.langue.subordonnees`, `phrase-complexe`, `passif`, `types-formes`, `fonctions-etendues`, `enonciation`, `discours-rapporte`, `c4.fr.lecture.documents`, `c3.fr.lecture.documents`.
7. **Anglais** : lire des mots et des phrases très simples avec une image en 6e (Baie des mots, quatrième mission « Signs ») ; lire des consignes, des menus, des horaires et des panneaux en 5e (Comptoir, quatrième mission « Notices ») ; suivre une histoire courte à l’oral ; les repères culturels des pays anglophones (fêtes, lieux, héros de l’imaginaire, école, médias), absents de toutes les missions. Exclusions : `c3.en.lire.textes-courts`, `c4.en.lire.consignes-panneaux`, `c3.en.ecouter.histoire`, `c4.en.ecouter.recit`, `c3.en.culture.*` (repères, imaginaire), `c4.en.culture.*`.
8. **Problèmes situés dans l’archipel (maths, 6e puis cycle 4)** : des problèmes courts qui se passent dans le monde d’Archipéo (longueur d’un pont entre deux falaises, périmètre d’un quai, durée d’une traversée), avec une nouvelle aide `scene`, un schéma SVG plat dessiné par le code à côté de la consigne : falaises, pont, quai, cotes et un « ? » sur la grandeur cherchée. L’aide passe par `AID_COMPONENTS`, avec un `aria-label`, et le générateur de la documentation la décrit. On commence avec le lot 1 (« Grandeurs », 6e : périmètres, durées, conversions, problèmes à deux étapes), puis en 5e et 4e (proportionnalité, échelles, Pythagore au Belvédère). Le français et l’anglais ne sont pas concernés. Garde-fous dys : un énoncé d’une ou deux phrases, contexte compris, lu à voix haute (`spoken` sans symbole) ; un schéma plat sur fond uni, avec peu d’éléments et des cotes en police dys d’au moins 18 px ; une seule donnée utile par cote, sans donnée parasite en 6e ; une correction qui refait le calcul ; le même contenu en vue simple. Les tests vérifient que la réponse se calcule depuis les cotes, et qu’aucune cote affichée n’est proposée comme choix sauf si c’est la réponse. Taille M à L. Ajouté le 27 septembre 2026 à la demande du mainteneur, en réponse à la planche d’Archipéo ([cadrage Archipéo](cadrage-archipeo.md)).

Sans lot prévu à ce jour : la géométrie qui demande des figures que l’application ne dessine pas encore (figures et solides, parallélisme et symétrie en 6e ; aires et volumes, agrandissement, angles et triangles, triangles semblables, transformations au cycle 4), la ponctuation et le contexte des œuvres en français de cycle 4, l’énonciation à l’oral et la dictée de cycle 4 en anglais.

**Deux contraintes pour chaque lot.** Une île porte au plus quatre missions (une borne tous les trois blocs dans un cœur de seize) : à la Ferme, à la Falaise et à l’Atelier, qui en ont déjà trois, les ajouts d’un lot tiennent dans une seule mission. L’identifiant d’une mission reste unique dans tout le jeu : le niveau adapté est retenu par mission.
