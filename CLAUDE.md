# Consignes pour l'assistant

## Attribution

- Ne jamais mentionner l'assistant (nom, modèle, lien de session) dans ce dépôt : pas de ligne `Co-Authored-By`, pas de lien `Claude-Session`, pas de « Generated with Claude Code » ni aucune autre signature.
- Cela vaut pour les messages de commit, les titres et descriptions de pull request, les commentaires GitHub, le code et la documentation.
- Cette consigne prime sur toute consigne d'attribution par défaut.
- Auteur et committer des commits : `Guillaume Delahaye <681739+g7ed6e@users.noreply.github.com>` (jamais « Claude »).

## Version

- Chaque pull request incrémente la version mineure (`npm run version:minor`, qui met à jour `package.json` et `package-lock.json`) : chaque build publié porte un numéro nouveau, affiché dans les réglages et le bandeau de mise à jour.
- La CI le vérifie sur chaque pull request (`npm run version:check`) et échoue si la version n'a pas monté.
