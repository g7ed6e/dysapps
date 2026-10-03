# Le contenu en Markdown

Ce dossier est la source des îles : un fichier par île (`<lieu>.md`, l’identifiant du lieu, par exemple `english-6e-vocabulary.md`), avec ce que l’île est (nom, module, Gardien, créature…), ses missions et leurs exercices, les plans de son bâtiment (que ses missions posent), la commande de son habitant, et `archipel.md`, l’ordre des îles. `npm run contenu` en produit les JSON du jeu (`src/blocland/iles.ts`, `src/blocland/exercises/data/<exercice>.json`, `src/blocland/world/plans/<plan>.json` et `src/blocland/world/requests.json`), qu’on n’édite jamais à la main ; la CI vérifie qu’ils suivent le Markdown (`npm run contenu -- --check`). `portail/` tient le contenu de quatre missions du portail (plus bas).

## Le format

```md
---
lieu : english-6e-vocabulary                 ← l’en-tête : l’identifiant du lieu, puis ce qu’est l’île
module : Vocabulaire et écoute
matière : english
classe : 6e
description : Se présenter, compter, dire l’heure, …
gardien : le Lion de pierre
icône : languages
créature : Robin
---

# Baie des mots                               ← le nom de l’île

> Une note pour qui écrit, que le jeu ne lit pas.

## Hello · `hello`                            ← une mission : son titre, puis son identifiant

- description : Saluer, se présenter, …        ← la mission : ce qu’elle fait faire, les compétences du programme
- compétences : c3.en.dialoguer.contact-social   qu’elle travaille (et `lv2 : es` ou `de` sur l’île de la LV2)
- langue : en                                 ← champs communs à tous les niveaux de la mission
- consigne : Choisis le mot qui complète la phrase en anglais.

### Niveau 1 · `english-6e-vocabulary-hello-1` ← un niveau : son numéro, puis l’identifiant de l’exercice

Pour tous les items :                         ← champs communs à tous les items du niveau (ou, placé avant le
- aide « Se présenter » :                        premier niveau, à tous les items de la mission)
  - Hello / Hi = bonjour. Goodbye / Bye = au revoir.

1. énoncé : …, my name is Tom.                ← un item par numéro, son premier champ sur la même ligne
   - lu : blank, my name is Tom.
   - choix : Hello · Goodbye · Thank you
   - réponse : Hello
```

- **Identifiants** : des mots neutres, en anglais, sans mot d’univers : le lieu `<matière>-<classe>-<thème>` (`french-6e-phonology`), la mission sa notion (`syllables`), l’exercice `<lieu>-<mission>-<suffixe>` (`english-6e-vocabulary-hello-1`). Ceux de la mission, du niveau et de l’item ne changent jamais (les sauvegardes des élèves et la répétition espacée s’y rattachent). La clé d’un item vaut par défaut `<exercice>-<rang depuis 0>`, ou ce que dit `clé des items` (plus bas) ; quand elle est autre, elle s’écrit en champ (`- clé : cabane`) ou dans la colonne `clé`. Avec la clé par défaut, un item s’ajoute donc **à la fin** du niveau ; pour en insérer ou en retirer un au milieu, écrire `- clé :` avec l’ancienne clé sur les items qui suivent, et une clé nouvelle sur l’item ajouté (deux items ne partagent jamais une clé). `npm run contenu` refuse d’écrire si un item existant changerait de clé ; corriger le texte d’un item à sa place reste permis.
- **L’île** : l’en-tête donne `lieu` (l’identifiant, qui est aussi le nom du fichier), `module`, `matière` (`french`, `maths`, `english` ou `lv2`), `classe` (`6e` à `3e`, qui est aussi l’archipel), `description`, `gardien` (avec son article : « le Grand Chêne »), `icône` et `créature` (son nom) ; le titre `# …` est son nom. Le bloc de l’île ne s’écrit pas : il porte l’identifiant du lieu (`bloc gagné : english-6e-vocabulary`). Ce qu’ils disent et leur espèce sont des textes d’univers, dans `src/univers/`. Les tests (`src/blocland/biomes.test.ts`) vérifient la matière, la classe, l’icône et les compétences.
- **Une mission** : son titre et son identifiant dans `## …`, puis `description`, `compétences` (au moins une, identifiants de `src/programme/` ; une île de 6e ne cite que le cycle 3, une île de 5e à 3e au moins une compétence du cycle 4) et, sur l’île de la LV2, `lv2` (qui va avec la `langue` de ses niveaux : `es` ou `de`). L’identifiant d’une mission est unique dans tout le jeu, et une île porte au plus quatre missions jouables (l’île de la LV2 en a quatre par langue) ; `biomes.test.ts` le vérifie. Une mission sans niveau a ses exercices produits par le code (les maths : `maths.ts`, `college.ts`, `problemes.ts` ; le Tri des graines, les panneaux) : une note « > » le rappelle sous son titre.
- **Champs d’un niveau** (ou de la mission, s’ils valent pour tous ses niveaux, sans être répétés dans un niveau) : `titre`, `langue`, `cible`, `consigne`, `programme`, `par partie`, `bravo`, `erreur`, `bloc gagné`, `blocs`, `XP`, `monte à`, `descend à`. Le barème (`blocs`, `XP`, `monte à`, `descend à`) reste écrit ici, niveau par niveau.
- **Champs d’un item** : `clé`, `texte`, `énoncé`, `question`, `phrase`, `mot`, `lettre`, `racine`, `racine lue`, `sujet`, `singulier`, `pluriel`, `avant`, `après`, `case`, `terminaison`, `cible`, `image`, `lu`, `entendu`, `choix`, `langue des choix`, `réponse`, `juste` (oui ou non), `sens`, `règle`, `indice`, `astuce`, `explication`, `pourquoi`, `mot troué`, et `aide « titre » :` suivie de ses lignes en sous-liste (en anglais, une ligne de lexique s’écrit `mot anglais = sens`, plusieurs paires séparées par « , » ou « ; » : le bouton Écouter de la ligne lit les mots de gauche en voix anglaise ; un mot français à gauche, accentué ou avec un petit mot comme « une », n’est pas lu. Jamais `mot (sens)`, `mot : sens` ni `sens = mot` : le bouton ne lirait rien, ou lirait du français. Une phrase de méthode peut précéder la première paire, suivie de « : » (« Lis d’abord la question : who = qui, when = quand »), et une précision entre parenthèses n’est pas lue. Le mot anglais commence par une minuscule, sauf un nom propre et « I » ; le sens ne recopie jamais la réponse d’un item de la mission, et l’exemple d’une ligne n’est jamais celui d’un item). Ce que chaque champ veut dire, selon le type d’écran : [Le format des exercices](../conception/exercices.md).
- **Pour tous les items** : n’importe quel champ d’item (sauf la clé) ; un item peut le redonner pour lui seul. S’y écrivent aussi les deux règles qui évitent de recopier :
  - `trou lu : blank` : la voix lit l’énoncé en remplaçant le « … » par ce texte (`blank` en anglais, `(mot manquant)` en français). Un item dont la lecture est autre garde son champ `lu`. Seul un énoncé à un seul « … » est concerné : un énoncé dont le « … » n’est pas un trou (des points de suspension dans un récit) donne son `lu` lui-même.
  - `clé des items : mot` (ou `lettre`) : la clé de chaque item est son mot, ce qui permet d’insérer un item n’importe où ; mais corriger une faute dans le mot change sa clé (l’item repart de zéro pour l’élève) : garder alors l’ancienne avec `- clé :` (`npm run contenu` signale une clé remplacée) ; `clé des items : paragraphe` : les clés sont p1, p2… (textes à lire).
- **Mot troué** : `mot troué : en[f]ant` donne à la fois le mot (`enfant`), ce qui vient avant et après le trou, et la réponse (`f`).
- **Tableau** : les items courts d’un niveau peuvent s’écrire en tableau Markdown, une colonne par champ, une ligne par item dans l’ordre ; une case vide = champ absent. Une case ne contient pas « | ». Un niveau a soit un tableau, soit des items numérotés.
- **Listes** : `a · b · c` sur la ligne, ou une sous-liste quand un élément contient « · ».
- **Guillemets** : une valeur vide, avec un saut de ligne, des espaces au bord ou qui commence par « " » s’écrit en chaîne JSON (`"…"`).

Une ligne vide termine un bloc « Pour tous les items » : sans elle, un champ écrit ensuite (par exemple `cible`, qui existe pour le niveau comme pour l’item) compterait pour tous les items. Le format est strict : un champ inconnu, un item mal numéroté ou un champ écrit deux fois arrête `npm run contenu` avec le fichier et la ligne. Le lecteur et l’écriture sont dans `scripts/contenu/format.mjs` ; un nouveau champ s’y ajoute.

## Les modèles, par écran

Un nouvel exercice part du modèle de son écran : copier un niveau d’une île qui a le même type de mission. Les champs de chaque écran :

| Écran (missions) | Champs d’un item | Exemple dans |
| --- | --- | --- |
| Question à trou, la plus courante (hello, past-tenses, figures-of-speech, es-greetings…) | énoncé avec « … », choix, réponse, indice, explication ; `trou lu` et l’aide pour tous | `english-6e-vocabulary.md`, `french-5e-conjugation.md` |
| Question sur un document (notices, signs, es-timetable, de-stories…) | énoncé, question, choix, réponse, `langue des choix`, indice, explication ; `image` (un emoji) aux Signs | `english-5e-vocabulary.md`, `lv2-3e-travel.md` |
| Histoire à écouter (story, stories) | énoncé (l’histoire, une phrase par ligne), lu, question, choix, réponse, `langue des choix`, indice, explication | `english-6e-grammar.md`, `english-4e-comprehension.md` |
| Écoute (first-listening, listening) | mot (lu à voix haute), choix, `langue des choix`, réponse, indice, explication ; les nombres (numbers) : énoncé et lu à la place du mot | `english-6e-vocabulary.md` |
| Syllabes (syllables) | énoncé, mot, entendu (syllabes), choix, réponse ; en tableau | `french-6e-phonology.md` |
| Chasse au son, rimes (sound-hunt, rhymes) | mot, image, entendu ou terminaison, juste (oui ou non) ; en tableau | `french-6e-phonology.md` |
| Filon, lettres b, d, p, q (letter-pairs) | lettre, juste, astuce, parfois cible | `french-6e-letter-confusion.md` |
| Oreille du mineur (sound-discrimination) | phrase, mot, choix, réponse, indice | `french-6e-letter-confusion.md` |
| Mot troué (missing-letters) | mot troué, choix ; `clé des items : mot` | `french-6e-word-spelling.md` |
| Familles, coffre à mots (word-families, sight-words) | mot, racine (le morceau écrit), racine lue (le mot de la famille, quand le morceau ne se lit pas seul), case (`prefix` ou `suffix`), choix, réponse, sens (familles) ; mot, choix, réponse, indice (coffre) | `french-6e-word-spelling.md` |
| Enclos, accord sujet-verbe (word-classes) | sujet, singulier, pluriel, réponse, pourquoi | `french-6e-grammar-spelling.md` |
| Récolte, -é, -er, -ez (e-er-ez) | énoncé, choix, réponse, règle ; `trou lu : (terminaison)` pour tous | `french-6e-grammar-spelling.md` |
| Dialogues | mot, choix, réponse, indice, explication | `english-4e-comprehension.md` |
| Ascension, lecture à voix haute (fluency) | texte, un paragraphe par item ; `clé des items : paragraphe` ; `monte à : 2` et `descend à : -1` coupent l’adaptation | `french-6e-reading.md` |

Plusieurs exercices d’une mission peuvent porter le même numéro de niveau (les textes de la Tour, les lettres du Filon) : ce sont des variantes, que distingue leur identifiant.

**Le message d’erreur** (`erreur`) peut citer un champ de l’item entre accolades, par son nom dans le JSON (`{explanation}`, `{word}`, `{answer}`, `{meaning}`, `{heard}`, `{letter}`, `{tip}`, `{subject}`, `{why}`, `{rule}`), ou ce que l’écran fournit (`{chosen}` : le choix de l’élève ; `{target}`, `{verb}`, `{mined}`, `{missed}`). Les tests refusent un nom que tous les items n’ont pas.

**Une clé écrite à la main** s’invente en minuscules avec des tirets, depuis le mot ou le sujet de l’item (`le-chien`, `va-manger`), et ne change plus ensuite, même si elle garde une ancienne graphie (`aujourd'hui`, avec l’apostrophe droite, dans la Carrière) : la corriger ferait oublier l’item à la répétition espacée.

**Hors du Markdown** : un niveau nouveau se déclare aussi dans `ORDER` (`src/blocland/exercises/index.ts`). Une mission nouvelle (un nouveau `type`) a aussi besoin de son écran dans `SCREEN_TYPES` (`src/blocland/exercises/registry.ts`). Les tests le rappellent si l’un manque.

## Les plans des bâtiments

Le fichier d’une île finit par ses plans, un tableau sous le titre `## Les plans`, une rangée par plan dans l’ordre du dessin (les murs, le toit, la cour) :

```md
## Les plans

| plan | nom | XP | quand c’est bâti |
| --- | --- | --- | --- |
| `french-6e-letter-confusion-1` | La forge de Tunel | 50 | Une vraie forge ! Avec la poutre en bois, elle tiendra cent ans. Tu as l’œil, bâtisseur. |
| `french-6e-letter-confusion-2` | Le toit de la forge | 60 | Le toit est posé, la porte aussi. Dedans, il fait chaud comme au fond de la mine. |
```

- **plan** : l’identifiant, `<lieu>-<rang>`, qui ne change jamais (les sauvegardes y rattachent les blocs posés).
- **nom** : le nom du plan, d’où viennent les noms des parties (plus bas).
- **XP** : ce que rapporte le plan quand il est fini.
- **quand c’est bâti** : ce que dit la créature quand le plan est fini.

**Les missions posent les plans** ([GD-6](../gameplay/propositions/GD-6.md)). Le bâtiment d’une île a une partie par mission. La première fois que l’élève termine une mission de l’île, quels que soient le niveau, les étoiles et les jokers, une partie se pose toute seule, sans prendre de blocs, dans l’ordre du dessin. Les parties sont faites des cases des trois plans, et leurs noms viennent des noms des plans :

- **3 missions** : une partie par plan, du même nom ;
- **2 missions** : le premier plan, puis les deux autres ensemble (« <plan 2> et <plan 3> », le complément commun dit une fois : « Le toit et la cour de la forge ») ;
- **4 missions** (la plupart des îles, et le lieu de la LV2, qui en a quatre par langue) : le premier plan coupé en deux par la hauteur (« Le bas du four de Rouxel », puis « Le haut du four de Rouxel », l’article du nom du plan contracté), puis les deux autres.

Un plan n’a pas de coffre : ses blocs de finition (toit, porte, lanterne, barrière, escalier) se posent avec sa partie. Le découpage est fait par le code (`src/blocland/world/parties.ts`) : rien à écrire ici de plus que les plans. Les parties de chaque île sont listées dans les pages générées du site (« Le bâtiment »).

Changer un nom, une XP ou une réplique se fait ici seulement. La forme du bâtiment est dessinée par le code (`src/blocland/world/architect.ts`) ; ajouter, retirer ou déplacer un plan demande aussi `src/blocland/world/plans.ts`, dont l’ordre doit rester celui du tableau (un test le vérifie). Les noms et les répliques sont ceux de l’univers Blocland ; où vivront ceux d’Archipéo reste à décider quand ses constructions seront renommées. L’XP règle l’équilibre du jeu et est commune aux univers : la changer passe par le directeur artistique, avec une fiche `GD-<n>` (`docs/gameplay/`). Un nom ou une réplique appartient à l’univers Blocland : le changer passe par le consultant de Blocland et par le référent dys.

## Les demandes

Après ses plans, le fichier d’une île de français, de maths ou d’anglais finit par la commande de son habitant ([GD-7](../gameplay/propositions/GD-7.md), points 4 et 5), sous le titre `## Les demandes` (les îles de LV2 n’en ont pas). Livrée, la commande pose une petite construction chez la créature. `npm run contenu` les écrit toutes dans `src/blocland/world/requests.json`, dans l’ordre de `archipel.md` :

```md
## Les demandes

### `french-6e-letter-confusion-request-1`

- habitant : Tunel
- bloc : `maths-6e-calculation`
- combien : 4
- petite construction : le puits
- demande : Il me faut {objet} pour mon puits. Joue une mission de la Plaine des nombres.
- prête : Tu as les {blocs} ! Livre-les à Tunel.
- posée : Puits posé chez Tunel !

> Forme, pour l’artiste technique 3D (dessinée dans le code, comme les plans) : l’anneau `ring()` de 3 × 3 au sol…
```

- **identifiant** : `<lieu>-request-<n>`, à partir de 1, qui ne change jamais ; la petite construction qu’elle pose s’appelle `<lieu>-fixture-<n>` (il ne s’écrit pas).
- **habitant** : la créature de l’île (son nom dans l’en-tête), jamais un Gardien.
- **bloc** : le bloc d’une autre île du même archipel, ou le bloc assemblé de l’archipel quand sa recette ne prend pas le bloc de l’île ; jamais l’or, le cristal, un bloc de finition ni le bloc d’une île de LV2. Dans un archipel, un bloc n’est demandé qu’une fois.
- **combien** : de 2 à 4. La forme pose un cube du bloc livré pour chaque bloc demandé.
- **petite construction** : son nom avec l’article (« le puits », « l’abri »), le même dans la liste, la demande et la réplique (« le puits de Tunel »).
- **demande** : deux phrases, le besoin puis le lieu et le geste : « Joue une mission de la (du, de l’) <île qui donne le bloc>. », ou « Assemble-les {à}. » pour un bloc assemblé ; jamais une notion ni une note.
- **prête** : « Tu as les {blocs} ! Livre-les à <créature>. »
- **posée** : « <Petite construction> posé(e) chez <créature> ! »
- **après le plan** (facultatif) : la commande n’arrive qu’une fois ce plan de l’île bâti (Grimoire, après « La lanterne du phare »).

Le nombre et le nom du bloc ne s’écrivent pas : le jeu met à la place de `{objet}` le nombre de blocs avec les mots de Mes blocs (« 4 briques », « 3 blocs de terre »), à la place de `{blocs}` le même nom sans nombre (« briques »), et à la place de `{à}` le lieu où l’on assemble (« à la Fabrique », `assemblage.md`) : l’objet porte ainsi le même nom partout. La phrase de la première fois (« Une commande, c’est une créature qui te demande des blocs pour une petite construction. Rien ne presse. ») est commune à toutes les îles : elle va avec les textes de l’univers, pas ici.

Les phrases sont celles de Blocland (une « commande », une « petite construction ») ; Archipéo, en pause, n’affiche pas les commandes et n’a pas de phrases ici (dans le JSON, elles sont rangées sous `blocland`, pour qu’un autre univers ait les siennes à côté). La forme de chaque petite construction est dessinée par le code (`src/blocland/world/petitesConstructions.ts`, testée) ; la note « > Forme » la décrit pour l’artiste technique 3D, et le jeu ne la lit pas. `scripts/contenu/demandes.mjs` lit la section et vérifie ces règles (avec les apostrophes typographiques, sans « … », deux phrases courtes au plus) ; `demandes.test.mjs` les teste. Changer un bloc, un nombre ou une petite construction passe par le directeur artistique ; une phrase, par le consultant de Blocland et le référent dys.

## Les missions du portail

`portail/` tient le contenu de quatre missions du portail, un fichier par mission ; `npm run contenu` en produit les JSON de `src/apps/` :

| Fichier | Produit | Forme |
| --- | --- | --- |
| `homophones.md` | `src/apps/homophones/sets.json` | une section `## a / à · \`a\`` par série : `niveau`, `choix`, `indice`, une `règle « mot »` par choix, puis le tableau `phrase` / `réponse` (le trou s’écrit « … ») |
| `verbes-irreguliers.md` | `src/apps/irreguliers/verbs.json` | un tableau : `base`, `prétérit`, `participe`, `français`, `niveau`, `pièges` (`a · b`), `piège régularisé` (`non` pour ne pas proposer la fausse forme en -ed, comme *beed* pour *be* ; vide sinon) |
| `lecture.md` | `src/apps/lecture/texts.json` | une section par texte : `auteur`, `source`, `forme` (`vers` ou `prose`), puis `### Texte` (une ligne par vers ou par phrase, une ligne vide entre deux paragraphes), `### Glossaire` (tableau `mot` / `définition`) et `### Questions` (numérotées : `question`, `choix`, `réponse`, `lignes`, `explication`) ; `lignes` donne le passage où se trouve la réponse : `6` pour une seule phrase, `5 · 13` pour un passage, en comptant les vers ou les phrases du texte depuis 1, sans recommencer à chaque paragraphe ni compter les lignes vides (une phrase ajoutée décale donc les questions qui suivent) |
| `vocabulaire.md` | `src/apps/vocabulaire/themes.json` | une section par thème, puis le tableau `anglais` / `français` / `pièges` |

L’identifiant entre accents graves (`` `a` ``, `` `corbeau` ``, `` `couleurs` ``) ne change jamais : les progrès s’y rattachent. Une case de tableau ne contient ni « | » ni « · » ; une ligne de texte ne commence ni par « # », « - », « > », « | » ni par un numéro suivi d’un point. Le lecteur et l’écriture sont dans `scripts/contenu/portail.mjs`.

Les tests de chaque mission (`src/apps/<mission>/data.test.*`, lancés par `npm test`) vérifient en plus :

- **homophones** : au moins 8 phrases par série, un seul « … » par phrase et jamais en tête, chaque mot de `choix` réponse d’au moins une phrase, des apostrophes typographiques (’) ;
- **lecture** : au moins 10 vers ou phrases par texte, 5 questions par texte, 3 choix différents dont la réponse, la bonne réponse pas toujours à la même place, un passage `lignes` qui tient dans le texte ;
- **vocabulaire** : au moins 8 mots par thème, sans doublon, et deux pièges par mot.

## L’assemblage des blocs

`assemblage.md` n’est pas une île : il tient ce qu’on assemble sur l’île de l’école ([GD-2](../gameplay/propositions/archives/GD-2.md)). `npm run contenu` en produit `src/blocland/world/recettes.ts`, et les questions de chaque bloc dans `src/blocland/exercises/data/assembly-<bloc>.json`. Deux tableaux, puis les questions :

- **« ## Le lieu »** : une rangée par univers (`` `blocland` ``, `` `archipeo` ``), avec le nom du lieu (le titre de sa page), où il est (« à la Fabrique ») et la phrase lue sous le titre.
- **« ## Les blocs assemblés »** : une rangée par archipel, avec l’identifiant du bloc (entre accents graves, déclaré dans `src/blocland/biomes.ts`, qui tient aussi son dessin), l’archipel, la recette (`french-6e-phonology × 2 · maths-6e-calculation × 1`) et le nom du bloc dans chaque univers ; un pluriel qui ne s’écrit pas avec un « s » se met entre parenthèses (`Vitrail (vitraux)`).

Les cases des monuments qui demandent ces blocs restent dans le code (`src/blocland/world/monuments.ts`).

### Les questions

**« ## Les questions »**, à la fin du fichier, donne la question posée à chaque bloc assemblé (décision du mainteneur du 1er octobre 2026) : un **« ### Nom · `bloc` »** par bloc du tableau, écrit comme une mission d’île à un seul niveau (mêmes champs, même lecteur, `scripts/contenu/format.mjs`), sur l’écran des documents à lire (type `assembly`, qui reprend `CalculScreen`) :

```md
### La poutre · `compound-6e`

- compétences : c3.fr.langue.genre-nombre · c3.ma.nombres.problemes
- consigne : Lis, calcule, puis choisis la bonne réponse. Le rappel est affiché.
- bravo : Bien assemblé !
- erreur : {explanation}

1. énoncé : "Léa a 5 billes.\nElle en donne 4 à Tom."
   - question : Quelle phrase est juste ?
   - lu : Léa a 5 billes. Elle en donne 4 à Tom.
   - choix : Il lui reste 1 bille. · Il lui reste 1 billes. · Il lui reste 9 billes.
   - réponse : Il lui reste 1 bille.
   - indice : Combien en reste-t-il ? Puis : une seule, ou plusieurs ?
   - explication : 5 − 4 = 1. Avec 1, le nom reste au singulier : 1 bille, sans s.
   - aide « Un ou plusieurs ? » :
     - Donner, c’est enlever.
     - 1 : pas de s (1 bille). À partir de 2 : un s (2 billes).
```

- **Les champs du bloc**, avant la première question : `compétences` (pour tout le bloc, jamais par question), `consigne`, `bravo`, `erreur`, et `langue : en` quand l’énoncé est en anglais (l’engrenage). Un bloc « Pour tous les items : » peut suivre, après une ligne vide (`langue des choix : fr` pour des réponses lues en français). Ni `description`, ni `blocs`, ni `XP`, ni `monte à` : une question d’assemblage ne rapporte que le bloc et n’adapte aucun niveau ; le générateur les refuse.
- **Une question** : `énoncé` (le document, une ligne par `\n`), `question` (courte, lue à part par l’écran), `lu` (le document seul, sans la question, sans « … », les nombres et les symboles écrits comme on les dit : « moins 3 degrés »), trois `choix` dont la `réponse`, `indice`, `explication` et une `aide` (le rappel des deux matières, toujours affiché).
- **Les clés** : `<bloc>-<rang>` par défaut (`compound-6e-0`, `compound-6e-1`…), ou `- clé :` pour garder celle d’une question déplacée, comme dans une île. Elles servent au tirage de l’élève : une question s’ajoute à la fin.
- **Les choix** : des nombres (même unité, milliers avec une espace insécable, ou « 8 × 10⁹ ») sont toujours affichés du plus petit au plus grand ; des phrases sont mélangées avec la graine de l’élève, la bonne réponse autant de fois à chaque place sur les questions du bloc. Un piège de chaque matière, écrit dans le fichier : aucun n’est calculé.
- **Vérifié par `src/blocland/exercises/assemblage.test.ts`** : chaque bloc a au moins 8 questions ; ses compétences existent dans `src/programme/`, couvrent les deux matières des îles de sa recette, sont déjà travaillées par une île ou le portail, et sont du cycle 3 seul en 6e, avec au moins une du cycle 4 de la 5e à la 3e ; trois choix différents dont la réponse ; une aide sur chaque question ; ni « … » ni la question dans `lu` ; des apostrophes typographiques.

## Ajouter une île

Écrire `<lieu>.md` (en-tête, nom, missions), ajouter l’île à sa place dans `archipel.md` et son identifiant dans `BIOME_IDS` (`src/blocland/biomes.ts`), puis lancer `npm run contenu`. Le monde (terrain, constructions, textes d’univers) se prépare à part : voir [Le format des exercices](../conception/exercices.md).
