# Consignes pour les agents

Les consignes du dépôt (attribution, version, documentation à tenir à jour à chaque pull request) sont dans [CLAUDE.md](CLAUDE.md) et s'appliquent à tout agent ou assistant, quel que soit l'outil.

En résumé, chaque pull request :

1. monte la version mineure (`npm run version:minor`) ;
2. ajoute une entrée pour cette version en tête de `docs/journal.md` ;
3. met à jour le manuel (`docs/manuel/`), les principes ou la conception (`docs/pedagogie/principes.md`, `docs/conception/`) quand ce qu'ils décrivent change ;
4. laisse les pages générées du contenu pédagogique au générateur (`scripts/docs/generate.mjs`), à compléter seulement pour un nouveau type de donnée ;
5. passe `npm test`, `npm run build`, `npm run docs:check` et `npm run docs:build` ;
6. ne porte aucune signature d'outil ni mention d'assistant.
