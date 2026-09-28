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

- **Une île = un thème du programme**, avec une classe indicative (6e à 3e). En général trois missions par île ; la Plaine des nombres en a quatre, la Mine des lettres deux, la Tour du lecteur une, l’Observatoire des données et le Phare des fonctions deux chacun.
- **Deux ou trois niveaux par mission** (deux en anglais ; quatre au plus sur une île de l’école, où ce qui s’ajoute passe par un niveau de plus, comme aux Balances), **huit items par exercice** (dix pour une dictée, avec `perRun`).
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

Soit 28 îles et 80 missions, plus 7 missions au portail.

### L’anglais

Ce qui s’ajoute aux principes dys :

- **Niveaux visés** : A1 en fin de 6e (cycle 3), A2 en fin de 3e (cycle 4), au programme de langues vivantes.
- **Au portail**, deux missions. Vocabulaire : douze thèmes de huit mots (couleurs, nombres, famille, école, animaux, corps, vêtements, maison, nourriture, météo, jours et mois, loisirs), en trois niveaux (J’écoute, Je traduis, J’écris) plus « Un thème » pour réviser un seul thème. Verbes irréguliers : soixante verbes du collège, vingt par niveau, prétérit ou participe passé, correction « go – went – gone : aller ».
- **Les écrans** : les phrases à trou et les nombres passent par l’écran à règle (`CalculScreen`, `rule-card` toujours affiché) ; l’écoute (Ears, Listening) par la dictée, qui lit le mot dès l’affichage, avec des réponses en français (`choicesLang: "fr"`).
- **Les réponses** : les heures et les dates se répondent en écriture française (« 3 h 30 », « 3 mai ») ; les Faux amis se répondent en français ; les Dialogues du Théâtre sont une écoute dont la réponse est une réplique en anglais (sans `choicesLang`).
- **Lire en anglais** : Comprendre et Faux amis (Studio des ondes) se lisent en entier en anglais, texte et question, sans trou.
- **Les pièges** sont de vraies erreurs d’élève francophone (« goed », « he have », « dogg »).
- **Hors périmètre** : parler en continu et l’écriture libre.

### Les problèmes situés dans l’archipel

- **Un problème court, dans le monde d’Archipéo** : un pont entre deux falaises, un quai à clôturer, une traversée en bateau. La mission « Carnet du passeur » (Plaine des nombres, `plaine-passeur-1` à `3`) les ouvre en 6e : une étape (longueur d’un pont, durée sans passer l’heure), puis le tour d’un quai et la durée qui passe l’heure pile, puis deux étapes (ce qui reste à poser, la largeur d’un quai à partir de son tour, l’heure d’arrivée).
- **Au collège, les mêmes règles, en niveaux de plus de missions existantes** (le Marché est l’île de l’école des Îles Brumeuses : pas de quatrième borne). Aux Étals, `marche-etals-3` partage une cargaison entre deux ou trois navires selon un ratio (le total connu, ou la part d’un autre navire). Aux Balances, `marche-balances-3` met l’échelle en situation sur la carte de l’archipel : en mots, de la carte au vrai et du vrai à la carte, puis en fraction avec la conversion en kilomètres. Les deux premiers niveaux gardent le calcul nu avec le tableau ; le niveau 3 passe au schéma. Au Belvédère, le niveau 3 de Pythagore (`belvedere-pythagore-3`) place le triangle rectangle dans un mât tenu par un câble. Aux Balances, le niveau 4 (`marche-balances-4`, « Traversée ») cherche la distance, la vitesse ou la durée d’une traversée à vitesse constante : les minutes se changent d’abord en heures (15, 30, 45 min, 1 h 30 min), et la durée cherchée se donne en minutes. Au Belvédère, le niveau 2 de Thalès (`belvedere-thales-2`) mesure un mât par son ombre : un bâton et son ombre, l’ombre du mât ou sa hauteur, et le coefficient entre les deux triangles.
- **Une quantité ni donnée ni cherchée n’est pas écrite** : dans un partage, si la part de l’autre navire ou le total étaient affichés, une soustraction donnerait la réponse sans passer par le ratio. Le schéma les laisse vides (`null`).
- **L’aide `scene`** : le schéma de la situation (pont, quai, traversée, carte, cargaison, mât), dessiné à plat par le code, déclaré en `figure: { kind: 'scene', props }` (voir le [format des exercices](exercices.md)). Il porte un seul « ? », sur la grandeur cherchée ; l’aide (`aid`) est une `rule-card` qui rappelle la méthode.
- **Les garde-fous**, vérifiés par `problemes.test.ts` : un énoncé d’une ou deux phrases qui dit ce que montre le schéma, sans donnée parasite ; `spoken` écrit les unités et les heures en toutes lettres, sans symbole ; la réponse se calcule depuis les cotes ; aucune cote affichée n’est proposée comme réponse, et le tirage évite qu’une cote soit la réponse ; la correction refait le calcul ; les réponses sont rangées.
- **Des pièges tirés d’erreurs réelles** : la retenue oubliée, le demi-tour ou l’aire à la place du périmètre, une heure comptée comme 100 minutes, une seule des deux étapes faite, l’heure qui ne change pas ; au collège, l’addition à la place de la multiplication sur une échelle, la conversion ratée d’un rang, le partage en moitiés égales, l’écart ajouté au lieu du rapport (« 3 : 4, A a 30, donc B a 31 »), la racine carrée oubliée.

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

Deux missions des anciens cadrages n’ont jamais été livrées : « mais / mes / met » à l’Aiguillage, et les missions **Lecture** (lire un diagramme, lire un graphique) de l’Observatoire des données et du Phare. L’aide `value-table` (tableau de valeurs) n’existe pas : le Phare utilise `ratio-table`.

1. **Île « Grandeurs » (maths 6e, Premiers Rivages)** : durées et horaires au-delà d’une heure et tableaux d’horaires (Horloges), conversions (Balances), aires et angles, périmètre du carré et du cercle (Clôtures), tableaux et diagrammes (Relevés), volumes et contenances, problèmes à étapes avec des prix. Les Premiers Rivages passent à quatre îles de maths. Le « Carnet du passeur » (Plaine) couvre déjà les premiers périmètres, les durées de moins d’une heure et les problèmes à deux étapes. Exclusions : `c3.ma.grandeurs.aire`, `volume`, `angles`, `unites-conversions`, `c3.ma.nombres.donnees`, en partie `c3.fr.lecture.documents`. Reste aussi la correspondance entre volume et contenance de `c4.ma.c.conversions`, compétence citée par les Balances (un manque sans exclusion). Les conversions de l’île ne reprennent pas le type `balances` : le niveau adapté est retenu par type, il serait partagé avec le Marché.
2. **Maths 6e, automatismes** : division et opérations posées (Rivière, quatrième mission, sur le partage : la Plaine a pris le « Carnet du passeur »), grands nombres (Volcan, quatrième mission « Nombres géants »), encadrer une fraction, ranger et intercaler des décimaux. Exclusion : `c3.ma.nombres.grands-entiers`.
3. **Français 6e** : les mots-outils manquants de la liste officielle (Coffre à mots) ; l’accord dans le groupe nominal et le sujet inversé (Ferme) ; la compréhension (Tour, « Étages du sens ») et la grammaire de base, attribut, épithète, complément du nom, types et formes de phrases, phrase simple et complexe (Tour, « Vitraux des phrases ») ; synonymes et polysémie (Carrière). Exclusions : `c3.fr.langue.genre-nombre`, `sujet`, `attribut-gn`, `types-formes`, `phrase-complexe`, `c3.fr.lecture.reprises`.
4. **Français 5e-4e** : présent, impératif et plus-que-parfait (Marais, quatrième mission), futur antérieur et valeurs des temps, « mais / mes / met » et autres homophones, verbes pronominaux et apposition (Falaise), champ lexical et niveaux de langue (Cabinet). Partie Cabinet livrée : un niveau 2 aux missions Sens (`cabinet-sens-2`, le champ lexical) et Nuances (`cabinet-nuances-2`, le degré d’intensité : trouver le mot le plus fort, ranger du plus faible au plus fort), qui citent `c4.fr.langue.reseaux-de-mots` ; l’exclusion est levée, les niveaux de langue restent au niveau 1 des Nuances. La famille de mots est travaillée par les Racines ; le degré de généralité (terme générique, terme spécifique) reste à faire.
5. **Maths 5e-3e** : divisibilité et facteurs premiers (Forge), fractions du cycle 4 (Glacier, quatrième mission « Icebergs des fractions »), priorités et tester une égalité (Atelier), factoriser et équations produits (le ratio est livré aux Étals, niveau 3 ; les conversions de durée aux Balances, niveau 4), effectifs, fréquences et lecture de diagramme (Données, « Relevés »), lecture graphique d’une fonction (Phare, nouvelle aide `graph`), réciproques de Pythagore et de Thalès (Belvédère). Exclusions : `c4.ma.a.fractions`, `c4.ma.a.calcul-fractions`, `c4.ma.b.lire-donnees`, `c4.ma.b.effectifs-frequences`.
6. **Français 3e** : subordonnées et pronom relatif, passif et forme impersonnelle, attribut du COD et apposition, énonciation et discours rapporté (Observatoire des textes, quatrième mission « Voix des textes »), document composite. Exclusions : `c4.fr.langue.subordonnees`, `phrase-complexe`, `passif`, `types-formes`, `fonctions-etendues`, `enonciation`, `discours-rapporte`, `c4.fr.lecture.documents`, `c3.fr.lecture.documents`.
7. **Anglais** : lire des mots et des phrases très simples avec une image en 6e (Baie des mots, quatrième mission « Signs ») ; lire des consignes, des menus, des horaires et des panneaux en 5e (Comptoir, quatrième mission « Notices ») ; suivre une histoire courte à l’oral ; les repères culturels des pays anglophones (fêtes, lieux, héros de l’imaginaire, école, médias), absents de toutes les missions. Exclusions : `c3.en.lire.textes-courts`, `c4.en.lire.consignes-panneaux`, `c3.en.ecouter.histoire`, `c4.en.ecouter.recit`, `c3.en.culture.*` (repères, imaginaire), `c4.en.culture.*`.
8. **Problèmes situés dans l’archipel (maths, 6e puis cycle 4)** : des problèmes courts qui se passent dans le monde d’Archipéo (longueur d’un pont entre deux falaises, périmètre d’un quai, durée d’une traversée), avec une nouvelle aide `scene`, un schéma SVG plat dessiné par le code à côté de la consigne : falaises, pont, quai, cotes et un « ? » sur la grandeur cherchée. L’aide passe par `AID_COMPONENTS`, avec un `aria-label`, et le générateur de la documentation la décrit. Premier lot livré : le « Carnet du passeur » (Plaine des nombres, 6e), avec le pont, le quai et la traversée (voir les décisions en vigueur). Deuxième lot livré : les niveaux 3 des Étals (le ratio, avec la cargaison) et des Balances (l’échelle, avec la carte) au Marché des proportions, et le niveau 3 de Pythagore au Belvédère (le mât). Troisième lot livré : la traversée à vitesse constante aux Balances (niveau 4, la route) et Thalès en situation au Belvédère (niveau 2, l’ombre du mât). La suite : les scènes de l’île « Grandeurs » (lot 1 : conversions, aires, horaires). Le français et l’anglais ne sont pas concernés. Garde-fous dys : un énoncé d’une ou deux phrases, contexte compris, lu à voix haute (`spoken` sans symbole) ; un schéma plat sur fond uni, avec peu d’éléments et des cotes en police dys d’au moins 18 px ; une seule donnée utile par cote, sans donnée parasite en 6e ; une correction qui refait le calcul ; le même contenu en vue simple. Les tests vérifient que la réponse se calcule depuis les cotes, et qu’aucune cote affichée n’est proposée comme choix sauf si c’est la réponse. Taille M à L. Ajouté le 27 septembre 2026 à la demande du mainteneur, en réponse à la planche d’Archipéo ([cadrage Archipéo](cadrage-archipeo.md)).

Sans lot prévu à ce jour : la géométrie qui demande des figures que l’application ne dessine pas encore (figures et solides, parallélisme et symétrie en 6e ; aires et volumes, agrandissement, angles et triangles, triangles semblables, transformations au cycle 4), la ponctuation et le contexte des œuvres en français de cycle 4, l’énonciation à l’oral et la dictée de cycle 4 en anglais.

**Trois contraintes pour chaque lot.** Une île porte au plus quatre missions (une borne tous les trois blocs dans un cœur de seize) : à la Ferme et à la Falaise, qui en ont déjà trois, les ajouts d’un lot tiennent dans une seule mission. Une île de l’école (la Forêt, le Marché, l’Atelier, le Phare) porte au plus trois missions : l’école occupe la place de la quatrième borne ; ce qui s’y ajoute passe par un niveau de plus dans une mission existante. L’identifiant d’une mission reste unique dans tout le jeu : le niveau adapté est retenu par mission.
