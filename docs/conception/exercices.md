# Format des exercices

Deux moteurs coexistent : `QuizSession` pour les missions du portail, et le moteur Blocland (`src/blocland/exercises/`) pour les îles. Dans les deux cas, le contenu est **de la donnée** (JSON ou générateur) que l’application affiche selon des règles communes.

## Une mission du portail

Une mission est un composant qui rend `QuizSession` avec une fonction `makeQuestions`, rappelée à chaque séance :

```tsx
import { QuizSession, type Question } from '../../components/QuizSession';

function makeQuestions(): Question[] {
  return [
    {
      id: 'q1',
      prompt: 'Complète : « Ils … partis. »',
      choices: ['sont', 'son'],
      answer: 'sont',
      hint: 'Remplace par « étaient ».',
      explanation: '« Ils étaient partis » : verbe être.',
    },
  ];
}

export default function MonApp() {
  return <QuizSession appId="<id>" makeQuestions={makeQuestions} />;
}
```

Une `Question` porte l’énoncé (`prompt`, et `spokenPrompt` quand il contient des symboles), les choix, la réponse, l’indice du joker (`hint`), une aide visuelle dessinée (`aid`), une figure toujours visible (`figure`) et l’explication. Pour l’ajouter au catalogue, créer `src/apps/<id>/`, puis déclarer la mission dans `src/apps/registry.ts` avec `status: 'disponible'` et `component: lazy(() => import('./<id>/MonApp'))`. Les missions à plusieurs sous-thèmes passent par `QuestMenu`.

## Un exercice Blocland

Un exercice est un objet (`ExerciseDef`, dans `src/blocland/exercises/types.ts`) : un fichier JSON dans `src/blocland/exercises/data/`, ou un objet produit par un générateur (`maths.ts`, `college.ts`).

Les fichiers JSON sont **chargés à la demande**. Le bundle principal n’en garde que l’index (`id`, `biome`, `type`, `level` : le catalogue `CATALOG` de `index.ts`, extrait au build par le plugin `scripts/exerciseMeta.mjs`), qui suffit aux listes de missions, aux étoiles et au choix de la partie. Le contenu (consigne, items, corrections) est chargé par `loadExercise(id)` au lancement d’une partie ou d’un Gardien. Le service worker met tous ces fichiers en cache à l’installation : ils restent disponibles hors ligne. Les exercices écrits en code (générateurs, tri des graines, panneaux) sont toujours là.

```json
{
  "id": "foret-chasse-son-an",
  "biome": "foret",
  "type": "chasse-son",
  "level": 1,
  "target": "[an]",
  "instruction": "Tape les mots où tu entends le son [an], comme dans maman. Puis valide.",
  "items": [
    { "key": "enfant", "word": "enfant", "image": "👧", "correct": true, "heard": "[an]" }
  ],
  "feedback": { "correct": "Bien entendu !", "wrong": "Dans {word}, on entend {heard}." },
  "reward": { "block": "bois", "amount": 4, "xp": 12 },
  "adaptive": { "promoteAt": 0.85, "demoteAt": 0.5 }
}
```

| Champ | Rôle |
| --- | --- |
| `id` | Identifiant stable, préfixé par l’île (`<île>-<mission>-<variante>`). |
| `biome` | L’île (`BiomeId` de `biomes.ts`). |
| `type` | La mission, identique à l’identifiant d’exercice dans `biomes.ts` ; choisit l’écran dans `registry.ts`. |
| `level` | Niveau de difficulté ; le moteur choisit l’exercice au niveau adapté de l’élève, le moins joué à niveau égal. |
| `instruction` | Consigne unique, courte, écrite au-dessus de chaque item et lue à voix haute au démarrage (sauf pour un écran qui lit lui-même son mot en s’ouvrant : `speaksOnOpen` dans `registry.ts`). Au Gardien, chaque manche affiche la consigne de sa mission. |
| `target` | Paramètre de l’exercice (son cible, lettre, mot repère). |
| `lang` | `"en"` pour l’anglais : `prompt`, `spoken`, `word`, `sentence` et `choices` sont affichés en anglais (`lang="en"`, sans syllabes colorées ni typographie française) et lus avec la voix anglaise. `instruction`, `hint`, `explanation` et `aid` restent en français. Un item dont les réponses sont en français porte `choicesLang: "fr"`. |
| `programme` | Facultatif : les compétences du programme officiel que cet exercice travaille en plus de celles de sa mission (identifiants de `src/programme/`), quand les niveaux d’une mission ne travaillent pas la même chose. Vérifié par les tests, affiché sur la page de l’île. |
| `items` | Les items de référence, chacun avec une `key` stable (répétition espacée). Leur forme dépend du type. |
| `generate` | Exercice généré : d’autres items pour une autre graine (une graine tirée au hasard par partie). Toutes les missions de maths, école et collège, en ont un. |
| `perRun` | Nombre d’items joués par partie quand le lot est plus large. |
| `feedback` | Messages de correction ; `{word}`, `{heard}`, `{answer}`, `{explanation}`, `{rule}`… sont remplacés. Un écran de tri (Chasse au son, Rimes-échelle) rédige lui-même une correction qui nomme toutes les erreurs (`detail.summary`, via `sortCards.ts`) ; elle remplace alors `wrong`, au Gardien aussi. |
| `reward` | Bloc, quantité et XP de base (le moteur ajuste selon le score et les étoiles). |
| `adaptive` | Seuils de montée et de descente du niveau (deux parties, ou une seule à 95 %). |

Les formes d’items par type d’écran sont visibles sur la page de chaque île (section « Items ») et dans les JSON existants : `prompt / choices / answer / hint / explanation / aid` pour les QCM et les écrans de règle, `word / image / correct / heard` pour la Chasse au son, `letter / correct / tip` pour le Filon, `word / before / after / answer / choices` pour le Mot troué, `subject / singular / plural / answer / why` pour l’Enclos, `meaning / root / slot / choices / answer / word` pour Familles-craft, `word / sentence / choices / answer / hint` pour les dictées à choix, `text` pour les paragraphes d’Ascension.

**Deuxième essai** (`retryAllowed` dans `registry.ts`) : après une première erreur, le lanceur affiche « Presque ! » (avec le `hint` de l'item s'il en a un) et remonte l'écran ; les écrans à choix reçoivent `ruledOut` (la réponse tentée, barrée). Il est permis pour un écran à choix d'au moins trois réponses et pour un tri (`sorting: true` : Chasse au son, Rimes-échelle, Enclos), jamais au Gardien. Un item juste au deuxième essai compte `attempts: 2` (un demi-point) ; dans un tri refait, un item déjà juste au premier essai garde `attempts: 1`.

**Aides visuelles en données** : un item peut porter `aid: { kind, props }` ; l’écran `CalculScreen` redessine la figure (`dots`, `ten`, `jumps`, `compare-bars`, `dot-groups`, `decimal-table`, `number-line`, `ratio-table`, `bar-list`, `right-triangle`, `thales-figure`, `rule-card`, `scene` ; la liste qui fait foi est `AID_COMPONENTS` dans `maths.ts` ; `bar-list` devient un diagramme en barres quand il porte `labels`, un nom par barre). L’aide est toujours affichée, pas seulement après une erreur. Un item peut aussi porter `figure: { kind, props }`, la figure de l’énoncé, dessinée au-dessus de l’aide (triangle rectangle, Thalès, schéma de la situation).

**Schéma de la situation** (`scene`, `Scene.tsx`) : la figure des problèmes situés dans l’archipel, dessinée à plat. Une cote est un nombre ou `"?"`, et chaque schéma porte un seul `"?"`, la grandeur cherchée, écrite en couleur. Les heures sont en minutes depuis minuit (580 s’affiche « 9 h 40 »), les durées en minutes (75 s’affiche « 1 h 15 min ») ; les nombres s’écrivent à la française (« 50 000 », « 1,5 »).

| `scene` | Propriétés | Ce qui est dessiné |
| --- | --- | --- |
| `pont` | `unit: "m"`, `parts` (une cote par travée), `total` | Deux falaises, le pont en travées, une cote sous chaque travée, l’écart total au-dessus. |
| `quai` | `unit: "m"`, `longueur`, `largeur`, `entree` (facultatif), `perimetre` (facultatif), `ask: "perimetre"` | Un rectangle vu du dessus, sa clôture, les côtés égaux codés ; l’entrée reste sans clôture et porte sa cote ; le tour, s’il est donné, au centre. |
| `traversee` | `depart`, `arrivee`, `duree` | Deux îles, la route en pointillés et le bateau, l’heure de départ, l’heure d’arrivée et la durée. |
| `carte` | `echelle` (`{ reel, unit }` pour « 1 cm pour 500 m », ou `{ fraction }` pour « 1/50 000 »), `carte` (en cm), `reel`, `unitReel` | Une carte avec deux îles, la distance mesurée entre elles, l’échelle dans un cartouche, et « en vrai » dessous. |
| `cargaison` | `unit` (`"caisses"` ou `"kg"`), `ratio` (2 ou 3 nombres), `parts` (une cote par navire), `total` | Une rangée de cases égales par navire (autant que son terme du ratio), sa part au bout, une accolade et « en tout » dessous. Le ratio se lit « 2 pour 3 ». |
| `mat` | `unit: "m"`, `hauteur`, `pied`, `cable` | Un mât vertical, le sol, le câble en hypoténuse et l’angle droit codé au pied du mât. |
| `route` | `distance` (en km), `duree` (en minutes), `vitesse` (en km/h) | Deux îles, la route en pointillés et le bateau, la distance au-dessus, la durée dessous (« 1 h 30 min ») et la vitesse dans un cartouche (« 12 km/h »). Cherchée, la durée se donne en minutes. |
| `ombre` | `unit: "m"`, `baton`, `ombreBaton`, `hauteur`, `ombre` | Un bâton et un mât verticaux, leurs ombres au sol qui finissent au même point, le rayon de soleil en pointillés qui passe par les deux sommets ; l’ombre du bâton cotée sur la première ligne, celle du mât sur la seconde. |

La phrase lue par un lecteur d’écran (`aria-label`) est composée à partir des propriétés ; le « ? » s’y dit « inconnu ».

## Ajouter un exercice à une mission existante

1. Écrire le JSON dans `src/blocland/exercises/data/` en suivant un exercice voisin du même `type`.
2. Ajouter son `id` à `ORDER` dans `src/blocland/exercises/index.ts`, à sa place dans la progression de l’île : cet ordre départage les variantes d’un même niveau et ordonne la page de l’île. Il n’y a rien à importer : le fichier est trouvé par son dossier.
3. Lancer `npm test` : `data.test.ts` vérifie que chaque fichier de `data/` a sa place dans `ORDER`, puis le format et les règles du type.
4. Vérifier la page de l’île dans la documentation (`npm run docs:build`) : l’exercice y apparaît avec sa consigne et ses items.

## Ajouter une mission ou une île

- **Une mission** : ajouter son entrée dans `exercises` de l’île (`biomes.ts`) avec, dans `programme`, au moins une compétence du programme officiel (`src/programme/`, voir [Le référentiel des programmes](programmes.md) ; le compilateur et le test de couverture le vérifient, et une compétence désormais couverte quitte `exclusions.ts`), écrire au moins un exercice, l’ajouter à `ORDER`, et si le geste est nouveau, créer l’écran et le déclarer dans `registry.ts`. L’identifiant d’une mission est unique dans tout le jeu (le niveau adapté est retenu par mission) ; une île porte au plus quatre missions (les bornes sont posées tous les trois blocs dans un cœur de seize).
- **Une île** : une entrée dans `BIOMES` (créature, Gardien, bloc, missions et leur `programme`), un bloc et sa texture si nécessaire (`BLOCKS` dans `biomes.ts`, `world/pixels.ts`, `pixel/tiles.ts` pour un grain, et la classe `.biome-<id>` de `styles/global.css`, qui donne la couleur du liseré de ses cartes, `--biome-color`), sa créature et son Gardien en cubes (`Creatures.tsx`, `Guardians.tsx`), son décor (`world/terrain.ts`), sa place et son relief dans `world/map.ts`, ses ouvrages dans `world/archipelago.ts`, ses trois plans dans `world/plans/`, ses exercices dans `ORDER`. Les tests qui comptent les îles, les ouvrages ou les îles atteignables (`archipelago.test.ts`, `screens.test.tsx`, `terrain.test.ts`, `mesher.test.ts`) sont à mettre à jour. Le [cadrage du contenu](cadrage-contenu.md) et le [cadrage de Blocland](cadrage-blocland.md) donnent les décisions déjà prises.

Dans tous les cas, la documentation du contenu (archipel, page de l’île, ouvrages, barème) se met à jour toute seule au build ; le manuel et le fragment du journal des versions (`docs/_journal/`) s’écrivent à la main. Voir [Contribuer](contribuer.md).

## Règles à respecter dans le contenu

- Consigne unique et courte, lisible à voix haute (pas de symbole non prononçable).
- Réponse toujours présente dans les choix ; distracteurs plausibles (erreurs réelles), jamais absurdes.
- Une correction qui explique (`explanation`, `rule`, `why`, `tip`), jamais un simple « faux ».
- Pas de chronomètre, pas de pénalité ; l’indice est une aide, pas une faute.
- Mots et phrases du quotidien d’un collégien ; pas d’écriture inclusive dans les textes affichés.
- Rien d’emprunté : textes originaux ou du domaine public, images et sons générés par le code.
