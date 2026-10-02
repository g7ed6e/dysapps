# Bonnes pratiques UX UI

Cette page rassemble l’état de l’art, en octobre 2026, pour l’ergonomie et l’interface d’un jeu éducatif joué surtout sur tablette par des collégiens, dont des élèves dys, et le met en face de ce que fait l’application. Elle sert de base à l’agent `consultant-ux-ui` (voir [Contribuer](../conception/contribuer.md#les-agents)), qui la tient et relit toute pull request qui change un écran, un composant, la navigation ou un parcours.

Les règles dys de l’application ([Principes](../../www/pedagogie/principes.md)) passent avant tout ce qui suit ; leurs sources sont dans les [bonnes pratiques dys](../conception/bonnes-pratiques-dys.md). Cette page dit **comment faire un écran clair dans ce cadre** et **ce qui reste à surveiller**.

## Les appareils

- **La tablette d’abord** : en paysage, 1024 × 768 (la plus petite, celle des mesures) et 1280 × 800 ; en portrait, 800 × 1280. Un écran se relit dans ces trois formats.
- **Le téléphone ensuite** : l’écran peut défiler, mais jamais de côté ; les zones sûres des écrans à encoche sont respectées.
- **Les réglages extrêmes** : OpenDyslexic en grande taille, interlignage et espacements au maximum. Un écran qui tient aux réglages par défaut et casse aux plus grands n’est pas fini.

## Les pratiques

### Comprendre l’écran d’un coup d’œil

- **Une prochaine action évidente** : un seul bouton principal par écran, nommé par un verbe ou un mot connu (« Suivante », « Jouer »), toujours au même endroit (Nielsen, heuristique 6 « reconnaître plutôt que se souvenir » ; W3C COGA, objectif 3 « aider l’utilisateur à trouver ce qu’il cherche »).
- **Une hiérarchie nette** : la consigne au-dessus du décor ; l’information de jeu, l’information pédagogique et la décoration séparées (`docs/univers/archipeo/source/interface.md`, « Principe »).
- **Peu à la fois** : chaque élément de plus sur un écran rend les autres moins visibles (Nielsen, heuristique 8 « esthétique et design minimaliste »).

### Savoir où l’on est et revenir

- **Des repères stables** : la navigation et les noms des écrans ne changent ni de place ni de mot (WCAG 2.2, critères 3.2.3 « navigation cohérente » et 3.2.4 « identification cohérente »).
- **Toujours une sortie** : un retour visible, un menu Pause qui dit ce qui est gardé ; rien ne fait perdre une partie sans prévenir (Nielsen, heuristique 3 « contrôle et liberté »).
- **Le système dit ce qu’il fait** : un chargement se voit, un toucher répond tout de suite (Nielsen, heuristique 1 « visibilité de l’état du système »).

### Toucher sans se tromper

- **De grandes cibles, bien espacées** : 48 px au moins dans l’application (le minimum de WCAG 2.2, critère 2.5.8, est de 24 px ; Material Design recommande 48 dp, Apple 44 pt). Deux cibles voisines ne se touchent pas par erreur.
- **Le pouce sur tablette** : les actions fréquentes à portée des bords bas et latéraux ; ce qui est rare ou risqué (quitter, effacer) loin de ce qui est fréquent, et confirmé.
- **Un geste simple** : un toucher plutôt qu’un glisser, jamais l’appui long seul (WCAG 2.2, critère 2.5.7 « mouvements de glissement »). Un glisser reste un plus : faire glisser le monde pour l’explorer a son équivalent par simple toucher (toucher une île, bouton « Recentrer »), un petit mouvement compte encore comme un toucher, et rien ne s’ouvre au doigt levé après un glissé.

### Ne rien cacher

- **Rien sous un bord ni sous un panneau** : un contrôle qui a le focus reste visible (WCAG 2.2, critère 2.4.11 « focus non masqué ») ; un bandeau fixe ne cache ni la question ni les réponses.
- **Le texte agrandi ne casse pas l’écran** : pas de défilement de côté (WCAG 2.2, critère 1.4.10 « redistribution »), pas de texte coupé quand les espacements montent (critère 1.4.12 « espacement du texte »).

### Les composants

- **Le même composant pour la même chose** : un bouton de réponse, un panneau, une bulle ont partout la même forme et les mêmes états (Nielsen, heuristique 4 « cohérence et standards »).
- **Tous les états prévus** : normal, touché, choisi, désactivé, vide, en chargement, en erreur ; un état désactivé dit pourquoi, un état vide dit quoi faire.
- **Un état ne passe jamais par la couleur seule** : un mot, une forme ou une icône l’accompagne (WCAG 2.2, critère 1.4.1).

### Les retours à l’élève

- **Au bon moment et au bon endroit** : la réponse d’abord, la célébration ensuite, jamais sur la question ; un message d’erreur dit quoi faire ensuite (Nielsen, heuristique 9 « aider à reconnaître et corriger les erreurs »).
- **Court et toujours pareil** : les mots de résultat de l’application, pas une phrase nouvelle à chaque fois.

### Deux univers, une interface

- **La structure est commune, l’habillage change** : un écran a les mêmes zones, le même ordre et les mêmes boutons dans Blocland et dans Archipéo ; couleurs, polices de titre et textures sont propres à chaque univers ([Plusieurs univers](../univers/univers.md)).

## Ce que fait l’application

| Pratique | Ce que fait le jeu | Où le voir |
| --- | --- | --- |
| Une chose à la fois | Mode concentration pendant une partie : la barre du haut et les onglets disparaissent, il reste un bouton Pause | `src/components/FocusMode.tsx` |
| Toujours une sortie | Le menu Pause dit ce qui est gardé ; le bouton retour du téléphone l’ouvre au lieu de quitter | `src/components/FocusMode.tsx` |
| Repères stables | Menu, Aventure, Missions, Succès, Réglages ; retour en haut à gauche | [Principes](../../www/pedagogie/principes.md#sans-stress), `src/components/Layout.tsx` |
| Rien sous le bandeau | Le bandeau de résultat réserve sa hauteur sous la question ; aux grandes tailles, il suit la question dans la page | `src/components/useSheetClearance.ts` |
| Grandes cibles | 48 px au moins | `src/styles/global.css` |
| Zones sûres | Les marges suivent les encoches de l’écran | `src/styles/global.css` (`safe-area-inset`) |
| Habillage par univers | Le style de Blocland est une couche à part | `src/styles/blocland.css`, [Style](../rendu/style.md#lhabillage-de-blocland) |

### À surveiller

Ces points sont connus ; le consultant UX UI les regarde en priorité.

- **Les écrans qui défilent sur tablette** : en OpenDyslexic grande taille, en 1024 × 768, les écrans avec document défilent (ticket #231) ; l’en-tête commun des écrans de calcul fait défiler d’environ 124 px (Faisceaux, Relevés, Thalès).
- **Le téléphone en grand texte** : le panneau de la Carte et le nom de destination (DA-31), les noms d’îles sous la bulle de la baleine (DA-10).
- **Ce qui se pose sur le monde en 3D** : étiquettes, bulles et boutons sur la scène ne cachent ni une île, ni une borne, ni une consigne.
- **Les écrans qui arrivent avec la migration** (lots 8 à 10 du [cadrage Archipéo](../univers/archipeo/cadrage.md)) : chacun relu dans les trois formats de tablette avant d’être construit.

## Sources

- Jakob Nielsen, [10 Usability Heuristics for User Interface Design](https://www.nngroup.com/articles/ten-usability-heuristics/), Nielsen Norman Group
- W3C, [Règles pour l’accessibilité des contenus web (WCAG) 2.2](https://www.w3.org/Translations/WCAG22-fr/)
- W3C, [Making Content Usable for People with Cognitive and Learning Disabilities](https://www.w3.org/TR/coga-usable/)
- Google, [Material Design 3 : Accessibility, touch targets](https://m3.material.io/foundations/designing/structure)
- Apple, [Human Interface Guidelines : Layout](https://developer.apple.com/design/human-interface-guidelines/layout)
- DINUM, [RGAA](https://accessibilite.numerique.gouv.fr/)
