# Le contenu en Markdown

Ce dossier est la source des îles : un fichier par île (`<île>.md`, l’identifiant de l’île), avec ce que l’île est (nom, module, Gardien, créature…), ses missions et leurs exercices, les plans de ses bâtiments, et `archipel.md`, l’ordre des îles. `npm run contenu` en produit les JSON du jeu (`src/blocland/iles.ts`, `src/blocland/exercises/data/<exercice>.json` et `src/blocland/world/plans/<plan>.json`), qu’on n’édite jamais à la main ; la CI vérifie qu’ils suivent le Markdown (`npm run contenu -- --check`). `portail/` tient le contenu de quatre missions du portail (plus bas).

## Le format

```md
---
île : baie                                    ← l’en-tête : l’identifiant de l’île, puis ce qu’elle est
module : Vocabulaire et écoute
matière : anglais
classe : 6e
description : Se présenter, compter, dire l’heure, …
bloc : cabine
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

### Niveau 1 · `baie-hello-1`                 ← un niveau : son numéro, puis l’identifiant de l’exercice

Pour tous les items :                         ← champs communs à tous les items du niveau (ou, placé avant le
- aide « Se présenter » :                        premier niveau, à tous les items de la mission)
  - Hello / Hi = bonjour. Goodbye / Bye = au revoir.

1. énoncé : …, my name is Tom.                ← un item par numéro, son premier champ sur la même ligne
   - lu : blank, my name is Tom.
   - choix : Hello · Goodbye · Thank you
   - réponse : Hello
```

- **Identifiants** : ceux de la mission, du niveau et de l’item ne changent jamais (les sauvegardes des élèves et la répétition espacée s’y rattachent). La clé d’un item vaut par défaut `<exercice>-<rang depuis 0>`, ou ce que dit `clé des items` (plus bas) ; quand elle est autre, elle s’écrit en champ (`- clé : cabane`) ou dans la colonne `clé`. Avec la clé par défaut, un item s’ajoute donc **à la fin** du niveau ; pour en insérer ou en retirer un au milieu, écrire `- clé :` avec l’ancienne clé sur les items qui suivent, et une clé nouvelle sur l’item ajouté (deux items ne partagent jamais une clé). `npm run contenu` refuse d’écrire si un item existant changerait de clé ; corriger le texte d’un item à sa place reste permis.
- **L’île** : l’en-tête donne `module`, `matière` (`francais`, `maths`, `anglais` ou `lv2`), `classe` (`6e` à `3e`, qui est aussi l’archipel), `description`, `bloc` (un bloc de `BLOCKS`, `src/blocland/biomes.ts`), `gardien` (avec son article : « le Grand Chêne »), `icône` et `créature` (son nom) ; le titre `# …` est son nom. Ce qu’ils disent et leur espèce sont des textes d’univers, dans `src/univers/`. Les tests (`src/blocland/biomes.test.ts`) vérifient la matière, la classe, le bloc, l’icône et les compétences.
- **Une mission** : son titre et son identifiant dans `## …`, puis `description`, `compétences` (au moins une, identifiants de `src/programme/` ; une île de 6e ne cite que le cycle 3, une île de 5e à 3e au moins une compétence du cycle 4) et, sur l’île de la LV2, `lv2` (qui va avec la `langue` de ses niveaux : `es` ou `de`). L’identifiant d’une mission est unique dans tout le jeu, et une île porte au plus quatre missions jouables (l’île de la LV2 en a quatre par langue) ; `biomes.test.ts` le vérifie. Une mission sans niveau a ses exercices produits par le code (les maths : `maths.ts`, `college.ts`, `problemes.ts` ; le Tri des graines, les panneaux) : une note « > » le rappelle sous son titre.
- **Champs d’un niveau** (ou de la mission, s’ils valent pour tous ses niveaux, sans être répétés dans un niveau) : `titre`, `langue`, `cible`, `consigne`, `programme`, `par partie`, `bravo`, `erreur`, `bloc gagné`, `blocs`, `XP`, `monte à`, `descend à`. Le barème (`blocs`, `XP`, `monte à`, `descend à`) reste écrit ici, niveau par niveau.
- **Champs d’un item** : `clé`, `texte`, `énoncé`, `question`, `phrase`, `mot`, `lettre`, `racine`, `sujet`, `singulier`, `pluriel`, `avant`, `après`, `case`, `terminaison`, `cible`, `image`, `lu`, `entendu`, `choix`, `langue des choix`, `réponse`, `juste` (oui ou non), `sens`, `règle`, `indice`, `astuce`, `explication`, `pourquoi`, `mot troué`, et `aide « titre » :` suivie de ses lignes en sous-liste. Ce que chaque champ veut dire, selon le type d’écran : [Le format des exercices](../conception/exercices.md).
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
| Question à trou, la plus courante (hello, rives, figures, es-hola…) | énoncé avec « … », choix, réponse, indice, explication ; `trou lu` et l’aide pour tous | `baie.md`, `marais.md` |
| Question sur un document (notices, es-horario, de-geschichte…) | énoncé, question, choix, réponse, `langue des choix`, indice, explication | `comptoir.md`, `refuge.md` |
| Écoute (ears, listening) | mot (lu à voix haute), choix, `langue des choix`, réponse, indice, explication ; les nombres (numbers) : énoncé et lu à la place du mot | `baie.md` |
| Syllabes (abattage) | énoncé, mot, entendu (syllabes), choix, réponse ; en tableau | `foret.md` |
| Chasse au son, rimes | mot, image, entendu ou terminaison, juste (oui ou non) ; en tableau | `foret.md` |
| Filon (lettres b, d, p, q) | lettre, juste, astuce, parfois cible | `mine.md` |
| Oreille du mineur | phrase, mot, choix, réponse, indice | `mine.md` |
| Mot troué | mot troué, choix ; `clé des items : mot` | `carriere.md` |
| Familles, coffre à mots | mot, racine, case (`prefix` ou `suffix`), choix, réponse, sens (familles) ; mot, choix, réponse, indice (coffre) | `carriere.md` |
| Enclos (accord sujet-verbe) | sujet, singulier, pluriel, réponse, pourquoi | `ferme.md` |
| Récolte (-é, -er, -ez) | énoncé, choix, réponse, règle ; `trou lu : (terminaison)` pour tous | `ferme.md` |
| Dialogues | mot, choix, réponse, indice, explication | `theatre.md` |
| Ascension (lecture à voix haute) | texte, un paragraphe par item ; `clé des items : paragraphe` ; `monte à : 2` et `descend à : -1` coupent l’adaptation | `tour.md` |

Plusieurs exercices d’une mission peuvent porter le même numéro de niveau (les textes de la Tour, les lettres du Filon) : ce sont des variantes, que distingue leur identifiant.

**Le message d’erreur** (`erreur`) peut citer un champ de l’item entre accolades, par son nom dans le JSON (`{explanation}`, `{word}`, `{answer}`, `{meaning}`, `{heard}`, `{letter}`, `{tip}`, `{subject}`, `{why}`, `{rule}`), ou ce que l’écran fournit (`{chosen}` : le choix de l’élève ; `{target}`, `{verb}`, `{mined}`, `{missed}`). Les tests refusent un nom que tous les items n’ont pas.

**Une clé écrite à la main** s’invente en minuscules avec des tirets, depuis le mot ou le sujet de l’item (`le-chien`, `va-manger`), et ne change plus ensuite, même si elle garde une ancienne graphie (`aujourd'hui`, avec l’apostrophe droite, dans la Carrière) : la corriger ferait oublier l’item à la répétition espacée.

**Hors du Markdown** : un niveau nouveau se déclare aussi dans `ORDER` (`src/blocland/exercises/index.ts`). Une mission nouvelle (un nouveau `type`) a aussi besoin de son écran dans `SCREEN_TYPES` (`src/blocland/exercises/registry.ts`). Les tests le rappellent si l’un manque.

## Les plans des bâtiments

Le fichier d’une île finit par ses plans, un tableau sous le titre `## Les plans`, une rangée par plan dans l’ordre où l’élève les débloque :

```md
## Les plans

| plan | nom | XP | coffre | quand c’est bâti |
| --- | --- | --- | --- | --- |
| `mine-forge` | La forge de Tunel | 50 | sable × 3 | Une vraie forge ! Avec la poutre en bois, elle tiendra cent ans. Tu as l’œil, bâtisseur. |
| `mine-toit` | Le toit de la forge | 60 | | Le toit est posé, la porte aussi. Dedans, il fait chaud comme au fond de la mine. |
```

- **plan** : l’identifiant, qui ne change jamais (les sauvegardes y rattachent les blocs posés).
- **coffre** : les blocs gagnés, `bloc × nombre` séparés par « · », ou une case vide. Le jeu y ajoute de lui-même les blocs de finition du plan suivant.
- **quand c’est bâti** : ce que dit la créature quand le plan est fini.

Changer un nom, une récompense ou une réplique se fait ici seulement. La forme du bâtiment est dessinée par le code (`src/blocland/world/architect.ts`) ; ajouter, retirer ou déplacer un plan demande aussi `src/blocland/world/plans.ts`, dont l’ordre doit rester celui du tableau (un test le vérifie). Les noms et les répliques sont ceux de l’univers Blocland ; où vivront ceux d’Archipéo reste à décider quand ses constructions seront renommées. Les récompenses (XP, coffre) règlent l’équilibre du jeu et sont communes aux univers : les changer passe par le directeur artistique, avec une fiche `GD-<n>` (`docs/pilotage/game-design/`). Un nom ou une réplique appartient à l’univers Blocland : le changer passe par le consultant de Blocland et par le référent dys.

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

## Ajouter une île

Écrire `<île>.md` (en-tête, nom, missions), ajouter l’île à sa place dans `archipel.md` et son identifiant dans `BIOME_IDS` (`src/blocland/biomes.ts`), puis lancer `npm run contenu`. Le monde (terrain, constructions, textes d’univers) se prépare à part : voir [Le format des exercices](../conception/exercices.md).
