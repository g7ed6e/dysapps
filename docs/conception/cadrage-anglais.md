# Cadrage — l’anglais, de la 6e à la 3e

Document de travail (26 septembre 2026). Objectif : ajouter l’anglais comme troisième matière, sur le portail et dans Blocland, pour les quatre classes du collège (de la fin du cycle 3 à la fin du cycle 4, niveaux A1 à A2 du cadre européen), en gardant les règles dys du brief.

## 1. Principes

- **Une matière comme les autres** : une carte « Anglais » sur l’accueil, une page Anglais (quêtes du portail, puis îles de Blocland de la 6e à la 3e), un panneau dans la progression. Tant qu’aucune île d’anglais n’existe, la page et le panneau ne montrent que les quêtes du portail.
- **Deux voix** : la consigne, le joker, l’indice, l’aide et la correction sont en français, lus avec la voix française. Les mots et les phrases à travailler sont en anglais, lus avec une voix **anglaise britannique** (en-GB, l’accent de référence des manuels du collège). Si l’appareil n’a pas de voix britannique, une autre voix anglaise ; jamais la voix française pour de l’anglais.
- **Pas de syllabes colorées sur l’anglais** : le découpage suit les règles du français et induirait en erreur. Le texte anglais est marqué `lang="en"` (lecteurs d’écran, césure) et échappe à la typographie française (pas d’espace avant « ? ! : ; »).
- **Le contenu monte, les règles ne changent pas** : un item par écran, consigne unique lue à voix haute, rappel de règle toujours visible dans les îles, réponses à des places tirées au hasard, joker jamais pénalisant, pas de chrono, correction qui explique en français. Les pièges sont de vraies erreurs d’élève francophone (« goed », « he have », « dogg »).
- **L’écoute d’abord** : pour un élève dys, entendre le mot avant de l’écrire. Chaque énoncé anglais a son bouton Écouter ; les quêtes d’écoute lisent le mot dès l’affichage.

## 2. Les quêtes du portail

| Quête | Contenu | Niveaux |
| --- | --- | --- |
| **Vocabulaire** | 12 thèmes de 8 mots (couleurs, nombres, famille, école, animaux, corps, vêtements, maison, nourriture, météo, jours et mois, loisirs) | 1 J’écoute (mot anglais → sens) ; 2 Je traduis (sens → mot anglais) ; 3 J’écris (on entend le mot, on choisit la bonne écriture parmi trois) ; plus « Un thème » pour réviser un seul thème |
| **Verbes irréguliers** | 60 verbes du collège, 20 par niveau | 1 Les indispensables (be, have, go…) ; 2 Les fréquents (begin, bring, put…) ; 3 Pour aller plus loin (catch, ride, wear…). Prétérit ou participe passé, correction « go – went – gone : aller » |

## 3. Les îles, deux par archipel

Chaque île : un thème du programme, trois quêtes, deux niveaux par quête, huit items par exercice, en données JSON (`lang: "en"`), avec un rappel de règle (`rule-card`) toujours affiché. Créature, bloc, décor, trois plans et un Gardien par île, comme les autres. Une île de vocabulaire et d’écoute, une île de grammaire par classe.

| Classe | Île, bloc, créature, Gardien | Quêtes |
| --- | --- | --- |
| 6e | Baie des mots : cabine (la cabine téléphonique rouge), Robin le rouge-gorge, le Lion de pierre | **Hello** (saluer, se présenter, consignes de classe) ; **Numbers** (nombres, dates, heure) ; **Ears** (écouter un mot, trouver son sens) |
| 6e | Horloge des verbes : cadran, Tick le hérisson, le Coucou de bronze | **To be** (am / is / are) ; **Have got** ; **Présent simple** (-s, do / does) |
| 5e | Comptoir : tuile, Pudding le bouledogue, la Reine du marché | **Shopping** (nourriture, quantités, prix) ; **Routine** (heures, fréquence) ; **Listening** (phrases courtes) |
| 5e | Manoir du passé : lambris, Moustache le chat, le Spectre du manoir | **-ing** (be + V-ing ou présent simple) ; **Prétérit** (was / were, -ed) ; **Comparatifs** |
| 4e | Théâtre des voix : velours, Puck le lutin, le Masque | **Dialogues** (qui, où, quand) ; **Quantités** (some / any, much / many) ; **Prétérit irrégulier** |
| 4e | Gare du futur : rail, Vapeur le blaireau, la Locomotive de fer | **Futur** (will / going to) ; **Modaux** (can, must, should, have to) ; **Present perfect** (ever, already, yet) |
| 3e | Studio des ondes : antenne, Écho la chauve-souris, la Grande Antenne | **Comprendre** (texte court et question) ; **Connecteurs** (because, although, however) ; **Faux amis** |
| 3e | Château des hypothèses : pierre de taille (bloc `taille`), Knight le petit chevalier, le Dragon gallois | **For / since** (present perfect ou prétérit) ; **If** (conditionnels 0, 1, 2) ; **Passif** |

Noms, créatures et Gardiens sont une proposition, à ajuster à la relecture de chaque pull request.

**Placement.** 6e : derrière la Ferme et la Forêt, les deux îles en isthme (un sentier entre elles), un pont depuis la Ferme vers la Baie, un pont depuis la Forêt vers l’Horloge. 5e : une colonne à droite du Marché et du Marais ; l’îlot du Gardien du Manoir est entre les deux îles, elles ne se touchent donc pas : trois ponts (Marché → Comptoir, Marais → Manoir, Comptoir → Manoir). 4e : aux deux bouts de la crête des Monts de Feu, la Gare avant la Forge (pont depuis la Forge), le Théâtre après le Cabinet (pont depuis le Cabinet). Les Dialogues du Théâtre sont une écoute dont la réponse est une réplique en anglais (pas de `choicesLang`). 3e : aux deux bouts de l’arc, le Studio avant le Belvédère (pont depuis le Belvédère), le Château après l’Observatoire des données (pont depuis l’Observatoire). Comprendre et Faux amis se lisent en entier en anglais (texte et question), sans trou ; les Faux amis se répondent en français. Aucune île n’est imposée : les ouvrages restent le seul verrou, et les étapes du Bloc-Navire (Gardiens vaincus : 3, 2, 2) ne changent pas. L’anglais donne plus de choix, pas plus d’obstacles.

## 4. Format des exercices

- `lang: "en"` sur l’exercice : `prompt`, `spoken`, `word`, `sentence` et `choices` sont en anglais (affichés `lang="en"`, lus en voix anglaise). `instruction`, `hint`, `explanation` et `aid` restent en français.
- `choicesLang: "fr"` sur un item dont les réponses sont en français (traduire un mot anglais).
- Écrans existants : `CalculScreen` (énoncé, rappel de règle, indice), `QcmItem` (un mot, des sens), `DicteeItem` (écoute d’abord). Les identifiants de quête sont nouveaux et uniques : le niveau adapté est retenu par type de quête.

**Décidé en 6e.** Dans une phrase anglaise, le trou « … » se lit « blank » (la voix anglaise ne dit pas « mot manquant »). Les quêtes à phrase à trou et les nombres utilisent l’écran à règle (`CalculScreen`, un rappel `rule-card` toujours affiché) ; l’écoute (Ears) utilise la dictée (`DicteeItem`), qui lit le mot dès l’affichage, avec des réponses en français (`choicesLang: "fr"`). Les heures et les dates se répondent en écriture française (« 3 h 30 », « 3 mai »).

## 5. Découpage en pull requests

1. ✅ Socle : ce cadrage, la matière Anglais (accueil, page, progression), la voix anglaise, le texte anglais à l’écran, les quêtes Vocabulaire et Verbes irréguliers.
2. ✅ Îles de 6e : Baie des mots, Horloge des verbes.
3. ✅ Îles de 5e : Comptoir, Manoir du passé.
4. ✅ Îles de 4e : Théâtre des voix, Gare du futur.
5. ✅ Îles de 3e : Studio des ondes, Château des hypothèses.

## 6. Après les programmes officiels (27 septembre 2026)

Les vingt-quatre quêtes d’anglais et les deux du portail citent désormais le programme de langues vivantes ([programmes officiels](programmes.md) : niveau A1 en fin de cycle 3, A2 en fin de cycle 4). Ce qui reste à couvrir, une pull request par lot : lire des mots isolés et des phrases très simples avec une image en 6e (Baie des mots, quatrième quête « Signs ») ; lire des consignes, des menus, des horaires et des panneaux en 5e (Comptoir, quatrième quête « Notices ») ; suivre une histoire courte à l’oral ; les repères culturels des pays anglophones (fêtes, lieux, héros de l’imaginaire), absents de toutes les quêtes. Parler en continu et l’écriture libre restent hors périmètre.
