# Consignes pour les agents

Les consignes du dépôt (attribution, version, documentation à tenir à jour à chaque pull request) sont dans [CLAUDE.md](CLAUDE.md) et s’appliquent à tout agent ou assistant, quel que soit l’outil. Elles ne sont pas recopiées ici, pour ne pas diverger.

Le dépôt fournit huit agents spécialisés, décrits dans [Contribuer](docs/conception/contribuer.md#les-agents) :

- `.claude/agents/directeur-contenu-pedagogique.md` : le contenu pédagogique (programme officiel, exercices, règles dys) ;
- `.claude/agents/directeur-artistique.md` : le game design et la direction artistique, les univers et la migration vers Archipéo ;
- `.claude/agents/consultant-archipeo.md` et `.claude/agents/consultant-blocland.md` : chacun son univers (noms, récit, intention du monde), sous l’autorité du directeur artistique, consultés avant toute pull request qui touche les noms, le récit ou le rendu de leur univers ;
- `.claude/agents/artiste-technique-3d.md` : le rendu du monde dans le code (géométrie, matériaux, lumière, performances), vers le low-poly peint d’Archipéo. Le directeur artistique, ou le consultant d’un univers sous son autorité, décide quoi, l’artiste technique 3D décide comment ;
- `.claude/agents/referent-dys.md` : l’accessibilité dys, consulté avant toute pull request qui touche ce que l’élève voit, entend ou fait ;
- `.claude/agents/consultant-ux-ui.md` : l’ergonomie et l’interface des écrans, communes aux univers, sous l’autorité du directeur artistique, consulté avant toute pull request qui change un écran, un composant, la navigation ou un parcours ;
- `.claude/agents/expert-frontend.md` : l’état de l’art du code (sécurité, performance, maintenabilité), consulté avant toute pull request qui modifie du code.

## Ranger la documentation (sans dérive)

Le tableau « Où va quoi » de [CLAUDE.md](CLAUDE.md) fait foi, et `scripts/structure.test.mjs` le vérifie en CI. Avant d’écrire ou de déplacer un document, tout agent se pose ces questions, dans l’ordre, et s’arrête à la première qui répond oui :

1. **Un élève, une famille, un enseignant ou un orthophoniste le lira-t-il ?** Alors `www/` (`manuel/` ou `pedagogie/`), et la page entre au sommaire `www/_theme/nav.json`. Sinon, rien dans `www/`.
2. **Est-ce du contenu pédagogique (île, mission, exercice, portail, plans, recettes) ?** Alors `docs/contenu/`.
3. **Est-ce une règle du jeu commune aux univers (boucle, progression, ressources, missions, Gardiens), une fiche GD-n ou une décision de game design ?** Alors `docs/gameplay/` (fiches dans `docs/gameplay/propositions/`, décision dans `docs/gameplay/decisions.md`).
4. **Est-ce propre à un univers (noms, récit, cadrage, fiche, intentions, esquisses, game design propre) ?** Alors `docs/univers/archipeo/` ou `docs/univers/blocland/` ; ce qui vaut pour tous les univers va dans `docs/univers/univers.md`. `docs/univers/archipeo/source/` est le dossier fourni par le mainteneur : on n’y écrit jamais. Archipéo est en pause (décision du mainteneur, 2 octobre 2026) : `docs/univers/archipeo/` est gelé tel quel, on n’y ajoute rien tant qu’il n’est pas repris.
5. **Est-ce l’ergonomie des écrans, commune aux univers ?** Alors `docs/ux-ui/`.
6. **Est-ce le style ou le rendu commun ?** Alors `docs/rendu/` ; le budget de dessin reste dans le code.
7. **Est-ce transverse (architecture, code, règles dys, cadrage du contenu, exercices, programmes, contribuer, déploiement) ?** Alors `docs/conception/`.
8. **Est-ce l’état d’un chantier ?** Alors une ligne dans `docs/pilotage/chantiers.md`, et rien d’autre dans `docs/pilotage/`.
9. **Est-ce un livrable de travail (pistes, captures, maquettes, notes de fil, comparaisons) ?** Alors hors du dépôt : la Bibliothèque du projet, ou la branche `captures`.

Les règles qui empêchent la dérive :

- **Compléter un document existant plutôt qu’en créer un.** Un document nouveau n’est créé que si aucun document de son dossier ne couvre le sujet.
- **Un sujet, un seul endroit.** On ne recopie pas une règle d’un dossier à l’autre : on met un lien. Un document mixte (qui parle de deux métiers) se découpe dans sa propre pull request, sans rien changer d’autre.
- **Aucun dossier ni aucune place nouvelle sans décision.** Si aucune réponse ne convient, on ne range pas « au plus proche » : on propose la place au mainteneur, l’`expert-frontend` en juge, puis elle s’écrit dans le tableau de CLAUDE.md et dans `scripts/structure.test.mjs`, dans la même pull request.
- **Un déplacement se fait avec `git mv`, sans toucher au contenu,** et corrige tous les liens dans la même pull request (aucun ancien chemin ne doit rester, sauf dans `docs/univers/archipeo/source/`).
- **Chaque dossier a son gardien**, qui signale un document mal rangé en relecture : `docs/gameplay/` le directeur artistique, `docs/univers/<univers>/` le consultant de l’univers, `docs/ux-ui/` le consultant UX UI, `docs/rendu/` l’artiste technique 3D (le directeur artistique décide ce que dit le style, l’artiste comment il se fait), `docs/contenu/` le directeur du contenu pédagogique, `docs/conception/` l’expert frontend et le référent dys (règles dys), sauf `cadrage-contenu.md`, `exercices.md` et `programmes.md`, que tient le directeur du contenu pédagogique.
