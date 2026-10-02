# Le game design

Cette section est le document de game design **vivant** de DysApps : ce qu’est le jeu aujourd’hui, ce qu’on veut en faire, et ce qui reste à décider. C’est là qu’on itère. Le jeu est **commun** aux univers (mêmes règles, même progression, même sauvegarde) ; chaque univers ([Blocland](blocland.md), [Archipéo](archipeo.md)) l’habille de son récit, de ses noms et de son dessin.

Chaque sujet a trois parties : **Construit** (ce que fait l’application en ligne), **Cible** (ce qu’on veut), **Questions ouvertes** (ce qui reste à décider, et qui décide). Le détail et l’histoire restent dans les cadrages, cités à chaque sujet ; l’état des lots est dans [l’état des chantiers](../chantiers.md).

Pour changer le game design : une fiche de proposition (voir [Proposer un changement](propositions/modele.md)), relue par les agents, décidée par le mainteneur, inscrite dans [les décisions](decisions.md).

## La promesse

Un jeu d’entraînement pour les élèves dys du collège, de la 6e à la 3e, en français, maths, anglais et LV2, où **le savoir construit le monde** : chaque réussite rapporte de quoi bâtir, et le monde montre la progression. L’élève est un explorateur et un bâtisseur, pas un élève devant un manuel déguisé.

Ce qui ne se négocie jamais (voir [Principes dys](../../../www/pedagogie/principes.md) et [Cadrage de Blocland](../../conception/cadrage-blocland.md#ce-quon-garde-absolument)) : rien à lire dans le monde ; pas de chrono, de classement ni de perte ; aucun geste de réflexe ; sessions courtes ; la vue simple fait tout ce que fait le monde ; rien d’emprunté ; une tablette d’entrée de gamme suffit.

## La boucle

**Construit.** Jouer une mission sur une île, gagner des étoiles et des blocs, construire (plans du village, ouvrages entre les îles, monuments, Bloc-Navire), ouvrir des îles, passer à l’archipel suivant. Le bilan d’une mission dit à quoi servent les blocs gagnés et « Voir le chantier » cadre ce chantier dans le monde. Un seul prochain objectif est proposé à la fois (menu « Reprendre l’aventure », panneau d’île, Carte).

**Cible.** Une réussite produit, quand c’est pertinent, une conséquence visible dans le monde ; trois échelles d’objectifs : réussir une mission, réparer un bâtiment ou une infrastructure, restaurer le village et construire le Bloc-Navire ([Cadrage Archipéo](../../conception/cadrage-archipeo.md), §3.1).

**Cap** ([GD-4](propositions/GD-4.md), décidé le 2 octobre 2026) : le monde ouvert au centre. D’abord tout se passe dans le monde (créatures utiles, îles à niveaux), puis des chemins au choix, puis des choses à découvrir en explorant.

**Questions ouvertes.**
- La montée en autonomie de la 6e à la 3e (chaînes de missions, missions à plusieurs compétences) : rien n’est posé côté boucle ; à cadrer avec le directeur contenu pédagogique, après le lot 8.
- Les problèmes situés dans l’archipel (une consigne qui dessine une scène du monde) : l’aide `scene` existe ; leur place dans la boucle reste à cadrer ([Cadrage du contenu](../../conception/cadrage-contenu.md)).

## Les systèmes

| Système | Construit | Où c’est décrit |
| --- | --- | --- |
| Étoiles | 1 à 3 par mission, la meilleure gardée | [Barème](https://g7ed6e.github.io/dysapps/pedagogie/bareme.html) |
| Blocs | Proportionnels au score, bonus d’étoiles et de première fois ; un bloc par île, tout bloc d’île paie tout ouvrage | [Barème](https://g7ed6e.github.io/dysapps/pedagogie/bareme.html), [Mes blocs](../../../www/manuel/blocland.md#mes-blocs) |
| Plans et coffres | Trois plans guidés par île (murs, toit, cour) ; le coffre donne les blocs de finition du plan suivant | [Cadrage de Blocland](../../conception/cadrage-blocland.md#le-village-les-plans-et-les-coffres) |
| Ouvrages | Pont, bac, sentier, escalier (premier plan), tunnel et col (Gardien) | [Ouvrages et plans](https://g7ed6e.github.io/dysapps/pedagogie/ouvrages.html) |
| Monuments | Deux par archipel, 60 à 125 blocs, dont 4 à 8 blocs assemblés ; n’ouvrent rien | [Cadrage de Blocland](../../conception/cadrage-blocland.md#les-monuments) |
| Blocs assemblés | Un par archipel, qu’aucune île ne donne : trois blocs de deux îles de l’archipel, assemblés un à un sur l’île de l’école (la Fabrique, la Halle aux matériaux) ; recette fixe, toujours affichée | [GD-2](propositions/GD-2.md), `docs/contenu/assemblage.md` |
| Gardiens | Un par île ; défi ouvert par les étoiles des missions de l’île ; réussi, il le reste | [Personnages et Gardiens](personnages.md) |
| Village en cinq états | Abandonné, réactivation, reconstruction, développement, port ; déduits, jamais enregistrés | [Cadrage Archipéo](../../conception/cadrage-archipeo.md), §5 |
| États des îles | Fermée, À explorer, En chantier, Restaurée (« Bâtie » dans Blocland) | [Cadrage Archipéo](../../conception/cadrage-archipeo.md), §5 |
| Bloc-Navire et voyage | Un véhicule qui s’améliore par étapes ; le kit arrive avec les Gardiens (3, 2, 2) ; embarquer est un acte explicite | [Cadrage de Blocland](../../conception/cadrage-blocland.md#le-bloc-navire-et-le-voyage) |
| XP et rôles | Cinq rôles selon l’XP, sans divisions | [Progression et récompenses](../../../www/manuel/progression.md) |
| Succès | Peu nombreux ; un trophée par succès dans la salle des trophées, jamais sur son toit : la salle s’agrandit d’une travée tous les 6 succès (GD-3, à construire) | [Barème](https://g7ed6e.github.io/dysapps/pedagogie/bareme.html) |
| École du village | Les missions du portail, sur l’île de l’école de chaque archipel ; elles rapportent des blocs, pas d’étoiles d’île | [Cadrage de Blocland](../../conception/cadrage-blocland.md#lappli-entière) |
| Le mot de la baleine | Un mot par grande étape et par archipel, dit une fois par appareil | [Personnages et Gardiens](personnages.md) |

**Questions ouvertes.**
- Le premier voyage : combien de Gardiens exiger (3, 2, 2) et quelle taille pour le premier chantier, selon les retours des élèves (mainteneur).
- Le village au démarrage : combien d’élèves entrent à l’école depuis le monde, combien repassent « Au démarrage » sur le menu (observation en classe).
- La personnalisation (lot 10, « Un village à soi ») : quelles variantes, comment elles se nomment dans chaque univers, sans jamais d’effet sur la difficulté.

## La progression de la 6e à la 3e

**Construit.** Quatre archipels, un par classe, un seul affiché à la fois ; on passe au suivant en construisant et en lançant le Bloc-Navire, et on revient toujours. À l’intérieur d’un archipel, rien n’est imposé. Les îles de LV2 s’ajoutent dès la 5e, en bout de chemin : rien n’en dépend.

**Cible.** La maturité vient de l’autonomie, de la complexité et de la profondeur, jamais d’un ton plus sombre ; un univers qu’un élève de 3e ne trouve pas enfantin.

**Questions ouvertes.**
- Le monde en réseau d’Archipéo (lots 8 et 8b) : que devient « explorer » et le bonhomme quand on ne marche plus d’île en île ? À cadrer avec le directeur artistique avant J6 ([Séparer le jeu du rendu](../../conception/separation-jeu-rendu.md)).
- Le 3e : « L’Horizon » sur la mer au lot 8, au lieu des Îles du Ciel.

## Les univers

**Construit.** Deux univers, choisis dans Réglages › Univers : **Blocland** par défaut, **Archipéo** au choix, pas mis en avant. L’univers change le récit, les noms, le dessin et l’habillage de l’interface ; jamais les règles ni la progression, portable de l’un à l’autre ([Plusieurs univers](../../conception/univers.md), §4).

**Questions ouvertes.**
- Quand et comment Archipéo sort de la discrétion (décision 9 ; aperçus fixes reportés après les lots 8 et 8b).
- Les noms propres à Blocland (Basses Terres, Collines du Large, Monts de Feu) et ses rôles reviennent-ils (U4, proposé par son consultant) ?
- Ce que doit fournir un troisième univers (U6), après les lots 8 et 8b.

## Personnages et Gardiens

La liste complète, île par île, avec ce qui change d’un univers à l’autre, est une page produite depuis le code : [Personnages et Gardiens](personnages.md). Les règles communes : une créature par île, qui habite, donne les missions et parle à l’arrivée ; un Gardien par île, dont le défi ferme l’île ; la baleine parle rarement, aux grandes étapes. Un Gardien se **vainc** dans Blocland (il devient une statue) et se **rallume** dans Archipéo (une sentinelle de pierre éteinte).

**Questions ouvertes.**
- Des créatures utiles (cap de [GD-4](propositions/GD-4.md)) : d’abord la créature qui se souvient et propose les révisions dans le monde ; ensuite celle qui commande un ouvrage ; plus tard, des défis de Gardien variés, de forme propre à chaque univers.
- Qui parle aux grandes étapes dans Blocland, à la place de la baleine, et pour dire quoi ?
- Les répliques des créatures, le mot de la baleine et une partie des espèces, encore communs aux deux univers (reste de R6) ; les répliques des Gardiens sont déjà propres à chaque univers.

## Récompenses et célébrations

**Construit.** Les récompenses servent d’abord le monde (blocs, constructions, îles ouvertes) ; XP, rôles et succès restent peu nombreux. Les célébrations sont sobres : transformation du décor, lumière, son court, jamais de pluie de confettis, et jamais par-dessus un panneau qu’on lit.

**Règles** (dossier Archipéo, communes aux univers) : DP-09 (les récompenses servent le monde), DP-12 (pas de pression inutile), DA-05 (célébrations sobres).

## Les écrans

**Construit.** Un seul bouton principal par écran ; le menu en page (« Reprendre l’aventure », Expéditions, liens) ; la Carte avec l’état de chaque île et la prochaine destination ; tout ce qui se lit est dans un panneau HTML, en police dys, lu à voix haute. Un adulte ouvre toujours une mission en deux touchers. Détail : [le manuel](../../../www/manuel/blocland.md) et [Style](../../conception/style.md).

## Les règles qui filtrent toute proposition

Les douze principes DP-01 à DP-12 et les cinq règles DA-01 à DA-05 du dossier Archipéo (`design/archipeo/design-principles.md`, `direction-artistique.md`), résumés au §3.5 du [Cadrage Archipéo](../../conception/cadrage-archipeo.md). Communes aux deux univers : DP-06, DP-08, DP-09, DP-12, DA-01, DA-02 et « rien d’emprunté » ; DP-01 et DP-02 (restaurer, jamais combattre) ne valent que pour Archipéo.
