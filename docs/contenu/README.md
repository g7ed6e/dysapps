# Le contenu en Markdown

Ce dossier est la source du contenu des îles : un fichier par île (`<île>.md`, l’identifiant de l’île). `npm run contenu` en produit les JSON du jeu (`src/blocland/exercises/data/<exercice>.json`), qu’on n’édite plus à la main ; la CI vérifie qu’ils suivent le Markdown (`npm run contenu -- --check`). Les îles pas encore passées ici s’écrivent encore en JSON (plan M1 à M5 : `docs/pilotage/chantiers.md`).

## Le format

```md
---
île : baie
---

# Baie des mots                               ← titre libre

## Hello · `hello`                            ← une mission : son titre, puis son identifiant

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

- **Identifiants** : ceux de la mission, du niveau et de l’item ne changent jamais (les sauvegardes des élèves et la répétition espacée s’y rattachent). La clé d’un item vaut par défaut `<exercice>-<rang depuis 0>` ; quand elle est autre, elle s’écrit en champ (`- clé : cabane`). Un item s’ajoute donc **à la fin** du niveau ; pour en insérer ou en retirer un au milieu, écrire `- clé :` avec l’ancienne clé sur les items qui suivent. `npm run contenu` refuse d’écrire si une clé désignerait un autre item qu’avant.
- **Titres** : le titre de l’île et ceux des missions ne sont pas encore lus par le jeu (ils le seront à l’étape M3) ; aujourd’hui, les noms affichés viennent de `src/blocland/biomes.ts`.
- **Champs d’un niveau** (ou de la mission, s’ils valent pour tous ses niveaux, sans être répétés dans un niveau) : `titre`, `langue`, `cible`, `consigne`, `programme`, `par partie`, `bravo`, `erreur`, `bloc gagné`, `blocs`, `XP`, `monte à`, `descend à`.
- **Champs d’un item** : `clé`, `texte`, `énoncé`, `question`, `phrase`, `mot`, `lettre`, `racine`, `sujet`, `singulier`, `pluriel`, `avant`, `après`, `case`, `terminaison`, `cible`, `image`, `lu`, `entendu`, `choix`, `langue des choix`, `réponse`, `juste` (oui ou non), `sens`, `règle`, `indice`, `astuce`, `explication`, `pourquoi`, et `aide « titre » :` suivie de ses lignes en sous-liste. Ce que chaque champ veut dire, selon le type d’écran : [Le format des exercices](../conception/exercices.md).
- **Pour tous les items** : n’importe quel champ d’item (sauf la clé) ; un item peut le redonner pour lui seul.
- **Listes** : `a · b · c` sur la ligne, ou une sous-liste quand un élément contient « · ».
- **Guillemets** : une valeur vide, avec un saut de ligne, des espaces au bord ou qui commence par « " » s’écrit en chaîne JSON (`"…"`).

Une ligne vide termine un bloc « Pour tous les items ». Le format est strict : un champ inconnu, un item mal numéroté ou un champ écrit deux fois arrête `npm run contenu` avec le fichier et la ligne. Le lecteur et l’écriture sont dans `scripts/contenu/format.mjs` ; un nouveau champ s’y ajoute.

## Passer une île en Markdown

`node scripts/contenu/importer.mjs <île>` écrit `<île>.md` depuis ses JSON actuels, après avoir vérifié que le Markdown redonne exactement les mêmes exercices ; puis `npm run contenu` réécrit ses JSON depuis le Markdown.
