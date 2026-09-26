# Format des exercices

Deux moteurs coexistent : `QuizSession` pour les quêtes du portail, et le moteur Blocland (`src/blocland/exercises/`) pour les îles. Dans les deux cas, le contenu est **de la donnée** (JSON ou générateur) que l’application affiche selon des règles communes.

## Une quête du portail

Une quête est un composant qui rend `QuizSession` avec une fonction `makeQuestions`, rappelée à chaque séance :

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

Une `Question` porte l’énoncé (`prompt`, et `spokenPrompt` quand il contient des symboles), les choix, la réponse, l’indice du joker (`hint`), une aide visuelle dessinée (`aid`), une figure toujours visible (`figure`) et l’explication. Pour l’ajouter au catalogue, créer `src/apps/<id>/`, puis déclarer la quête dans `src/apps/registry.ts` avec `status: 'disponible'` et `component: lazy(() => import('./<id>/MonApp'))`. Les quêtes à plusieurs sous-thèmes passent par `QuestMenu`.

## Un exercice Blocland

Un exercice est un objet (`ExerciseDef`, dans `src/blocland/exercises/types.ts`) chargé statiquement : un fichier JSON dans `src/blocland/exercises/data/`, ou un objet produit par un générateur (`maths.ts`, `college.ts`).

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
| `id` | Identifiant stable, préfixé par l’île (`<île>-<quête>-<variante>`). |
| `biome` | L’île (`BiomeId` de `biomes.ts`). |
| `type` | La quête, identique à l’identifiant d’exercice dans `biomes.ts` ; choisit l’écran dans `registry.ts`. |
| `level` | Niveau de difficulté ; le moteur choisit l’exercice au niveau adapté de l’élève, le moins joué à niveau égal. |
| `instruction` | Consigne unique, courte, lue à voix haute au démarrage. |
| `target` | Paramètre de l’exercice (son cible, lettre, mot repère). |
| `items` | Les items de référence, chacun avec une `key` stable (répétition espacée). Leur forme dépend du type. |
| `generate` | Exercice généré : d’autres items pour une autre graine (une par partie). |
| `perRun` | Nombre d’items joués par partie quand le lot est plus large. |
| `feedback` | Messages de correction ; `{word}`, `{heard}`, `{answer}`, `{explanation}`, `{rule}`… sont remplacés. |
| `reward` | Bloc, quantité et XP de base (le moteur ajuste selon le score et les étoiles). |
| `adaptive` | Seuils de montée et de descente du niveau (deux parties, ou une seule à 95 %). |

Les formes d’items par type d’écran sont visibles sur la page de chaque île (section « Items ») et dans les JSON existants : `prompt / choices / answer / hint / explanation / aid` pour les QCM et les écrans de règle, `word / image / correct / heard` pour la Chasse au son, `letter / correct / tip` pour le Filon, `word / before / after / answer / choices` pour le Mot troué, `subject / singular / plural / answer / why` pour l’Enclos, `meaning / root / slot / choices / answer / word` pour Familles-craft, `word / sentence / choices / answer / hint` pour les dictées à choix, `text` pour les paragraphes d’Ascension.

**Aides visuelles en données** : un item peut porter `aid: { kind, props }` ; l’écran `CalculScreen` redessine la figure (`dots`, `ten`, `jumps`, `compare-bars`, `dot-groups`, `decimal-table`, `number-line`, `ratio-table`, `bar-list`, `right-triangle`, `thales-figure`, `value-table`, `rule-card`). L’aide est toujours affichée, pas seulement après une erreur.

## Ajouter un exercice à une quête existante

1. Écrire le JSON dans `src/blocland/exercises/data/` en suivant un exercice voisin du même `type`.
2. L’importer et l’ajouter à `EXERCISES` dans `src/blocland/exercises/index.ts`.
3. Lancer `npm test` : `data.test.ts` vérifie le format et les règles du type.
4. Vérifier la page de l’île dans la documentation (`npm run docs:build`) : l’exercice y apparaît avec sa consigne et ses items.

## Ajouter une quête ou une île

- **Une quête** : ajouter son entrée dans `exercises` de l’île (`biomes.ts`), écrire au moins un exercice, et si le geste est nouveau, créer l’écran et le déclarer dans `registry.ts`.
- **Une île** : une entrée dans `BIOMES` (créature, Gardien, bloc, quêtes), un bloc et sa texture si nécessaire, sa place et son relief dans `world/map.ts`, ses ouvrages dans `world/archipelago.ts`, ses trois plans dans `world/plans/`, ses exercices. Les cadrages [du monde](cadrage-monde.md) et [du collège](cadrage-college.md) donnent les décisions déjà prises.

Dans tous les cas, la documentation du contenu (archipel, page de l’île, ouvrages, barème) se met à jour toute seule au build ; le manuel et le journal des versions se mettent à jour à la main. Voir [Contribuer](contribuer.md).

## Règles à respecter dans le contenu

- Consigne unique et courte, lisible à voix haute (pas de symbole non prononçable).
- Réponse toujours présente dans les choix ; distracteurs plausibles (erreurs réelles), jamais absurdes.
- Une correction qui explique (`explanation`, `rule`, `why`, `tip`), jamais un simple « faux ».
- Pas de chronomètre, pas de pénalité ; l’indice est une aide, pas une faute.
- Mots et phrases du quotidien d’un collégien ; pas d’écriture inclusive dans les textes affichés.
- Rien d’emprunté : textes originaux ou du domaine public, images et sons générés par le code.
