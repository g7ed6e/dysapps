# Consignes pour les agents

Les consignes du dépôt (attribution, version, documentation à tenir à jour à chaque pull request) sont dans [CLAUDE.md](CLAUDE.md) et s’appliquent à tout agent ou assistant, quel que soit l’outil. Elles ne sont pas recopiées ici, pour ne pas diverger.

Le dépôt fournit cinq agents spécialisés, décrits dans [Contribuer](docs/conception/contribuer.md#les-agents) :

- `.claude/agents/directeur-contenu-pedagogique.md` : le contenu pédagogique (programme officiel, exercices, règles dys) ;
- `.claude/agents/directeur-artistique.md` : le game design et la direction artistique, et la migration de Blocland vers Archipéo ;
- `.claude/agents/artiste-technique-3d.md` : le rendu du monde dans le code (géométrie, matériaux, lumière, performances), vers le low-poly peint d’Archipéo. Le directeur artistique décide quoi, l’artiste technique 3D décide comment ;
- `.claude/agents/referent-dys.md` : l’accessibilité dys, consulté avant toute pull request qui touche ce que l’élève voit, entend ou fait ;
- `.claude/agents/expert-frontend.md` : l’état de l’art du code (sécurité, performance, maintenabilité), consulté avant toute pull request qui modifie du code.
