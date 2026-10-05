# Bonnes pratiques dys

Cette page rassemble ce qui fait référence en France, en septembre 2026, pour qu’une application d’apprentissage convienne à des élèves dys (dyslexie, dysorthographie, dyspraxie, dyscalculie, dysphasie), et le met en face de ce que fait Archipéo. Elle sert de base à l’agent `referent-dys` (voir [Contribuer](contribuer.md#les-agents)), qui relit tout lot touchant l’interface, le contenu ou le rendu.

Les règles de l’application sont dans [Principes dys](../../www/pedagogie/principes.md) : elles s’imposent. Cette page dit **d’où elles viennent** et **ce qui reste à surveiller**. Une pratique qui devient une règle de l’application s’écrit dans les principes, pas ici.

## Le cadre en France

- **Loi du 11 février 2005** et **école inclusive** : l’élève dys a droit à des aménagements, dans un plan d’accompagnement personnalisé (PAP) ou un projet personnalisé de scolarisation (PPS), suivis dans le livret de parcours inclusif (LPI). Les aménagements courants au collège : consignes lues ou reformulées, documents en version numérique ou audio, polices adaptées, ordinateur, allègement de l’écrit, temps supplémentaire.
- **Eduscol, « Aménagements raisonnables »** : des fiches par trouble (dyslexie, dysorthographie, dyspraxie, dysphasie, dyscalculie…) qui disent les besoins, les aménagements conseillés et **déconseillés**, et des outils par discipline. C’est la référence des enseignants.
- **Stratégie nationale pour les troubles du neurodéveloppement 2023-2027** (81 mesures, bilan 2025-2026 publié) : repérage précoce des troubles dys, scolarisation adaptée, formation des professionnels.
- **Haute Autorité de santé** (guide de 2017 sur les troubles spécifiques du langage et des apprentissages) : un parcours de soins gradué ; la rééducation revient aux orthophonistes et autres soignants. Une application **entraîne et compense**, elle ne soigne pas et ne diagnostique pas.
- **Accessibilité numérique** : le RGAA 4.1.2 (critères tirés des WCAG 2.1 niveau AA) est la version en vigueur ; le **RGAA 5**, annoncé par la DINUM le 2 mars 2026 pour la fin de 2026, intègre les nouveaux critères des **WCAG 2.2**, couvre explicitement les **applications mobiles** et s’aligne sur la norme EN 301 549. Depuis le **28 juin 2025**, l’acte européen sur l’accessibilité (transposé par la loi n° 2023-171 du 9 mars 2023) impose l’accessibilité de nombreux services numériques ; les micro-entreprises en sont exemptées, mais ces référentiels sont la mesure commune.

## Ce que dit la recherche

- **La dyslexie est d’abord un trouble phonologique.** Le Conseil scientifique de l’éducation nationale l’a rappelé en 2021 en déconseillant les lampes et lunettes « anti-dyslexie », faute de preuve. Conséquence pour le jeu : le son (consigne lue, syllabes entendues, voix anglaise) compte autant que la forme des lettres, et aucun effet visuel n’est présenté comme un traitement.
- **Les polices « dys » n’ont pas d’effet démontré par leur forme** (OpenDyslexic comparé à Arial ou Times : pas de gain de vitesse ni de précision). **L’espacement, lui, aide** : un espacement large des lettres et des mots réduit les erreurs de lecture (Zorzi et coll., 2012, enfants dyslexiques italiens et français). D’où des réglages d’espacement et une police lisible par défaut (Luciole), les polices dys restant un choix de confort.
- **Adapter la forme ne suffit pas pour la dyspraxie** (Cartable fantastique, projet mené avec des chercheurs) : il faut aussi réduire la quantité d’écrit et de gestes fins, sinon l’exercice reste faisable « à un coût exorbitant ».
- **Dyscalculie** : représentations visuelles des quantités (droites numériques, tableaux de numération, boîtes de dix), code couleur des unités, dizaines et centaines, manipulation, énoncés lus.

## Les bonnes pratiques, par besoin

### Lire

- Police sans empattement, régulière ; taille confortable et réglable ; interlignage d’au moins 1,5 ; espacement des lettres et des mots réglable ; texte aligné à gauche, jamais justifié ; lignes courtes (autour de 70 caractères au plus) ; ni capitales, ni italique, ni soulignement pour un texte à lire (guide de style de la British Dyslexia Association, 2023 ; Game Accessibility Guidelines).
- Fond uni, crème ou pastel plutôt que blanc pur, et bon contraste ; rien derrière un texte à lire.
- Tout texte peut être entendu ; la voix lit à un débit réglable.

### Comprendre

- Mots courants, phrases courtes, une idée par phrase, la même chose toujours nommée du même mot (règles européennes du Facile à lire et à comprendre, FALC ; objectif 3 du W3C « Making Content Usable »).
- Des éléments familiers : icônes et gestes connus, toujours au même endroit (objectif 1 du W3C ; critère « aide cohérente » des WCAG 2.2).

### Se concentrer et se souvenir

- Une tâche à la fois, sans distraction autour ; animations décoratives, clignotements et sons coupables (objectif 5 du W3C ; Game Accessibility Guidelines).
- Ne rien demander de retenir : la consigne, la règle et l’aide restent visibles (objectif 6 du W3C).
- Lire et répondre à son rythme, sans limite de temps, avec une pause toujours possible.

### Se tromper sans danger

- Prévenir l’erreur, dire clairement ce qui est faux et comment corriger (objectif 4 du W3C) ; une aide qui explique la méthode ; aucune perte.

### Agir (dyspraxie)

- Cibles larges (au moins 24 × 24 px selon les WCAG 2.2, 44 × 44 px au niveau renforcé) ; un geste simple par action ; tout glisser a une alternative par simple toucher (WCAG 2.2, critère 2.5.7) ; le clavier marche aussi ; peu ou pas d’écriture à la main ou au clavier.

### Jouer

- Mouvements de caméra doux et désactivables, pas de secousse ni de flou de mouvement, pas de flash (risque de crise photosensible et de surcharge sensorielle) ; le texte n’est jamais dans la scène 3D.
- Le confort est pour tous : un mode « moins d’animations » n’est pas présenté comme un mode « pour dys » (objectif 8 du W3C : adaptation et personnalisation).

## Ce que fait l’application

Le tableau vaut pour les deux univers : Blocland, l’univers construit et par défaut, et Archipéo, en pause depuis le 2 octobre 2026 (décision du mainteneur).

| Pratique | Ce que fait le jeu | Où le voir |
| --- | --- | --- |
| Police, taille, interlignage, espacement | Luciole par défaut, OpenDyslexic, Atkinson Hyperlegible, Arial ; 18 px au moins, interlignage 1,5 au moins, espacement des lettres et des mots réglable, en mots | `src/core/settings.ts`, [Principes](../../www/pedagogie/principes.md#lire-moins-mieux-ou-autrement) |
| Fond uni et doux | Thème Crème par défaut, panneaux opaques, thème Clair plat (Contraste élevé retiré le 28 septembre 2026, à refaire pour tous les univers : [état des chantiers](../pilotage/chantiers.md#laccessibilité-dans-lappli)) | `src/styles/`, [Style](../rendu/style.md) |
| Tout s’entend | Consigne lue dès qu’elle apparaît et relançable, symboles dits en mots, voix anglaise pour l’anglais | [Principes](../../www/pedagogie/principes.md) |
| Une chose à la fois | Un item par écran, mode concentration, succès affichés à la fin | [Principes](../../www/pedagogie/principes.md#une-chose-à-la-fois) |
| Ne rien retenir | Consigne toujours écrite, aide visuelle et rappel de règle toujours affichés | [Principes](../../www/pedagogie/principes.md#aider-sans-pénaliser) |
| Pas de temps limité, pas de perte | Pas de chronomètre, deuxième essai, joker jamais pénalisant, pas de classement | [Principes](../../www/pedagogie/principes.md#sans-stress) |
| Gestes | Cibles de 48 px au moins, touches 1 à 9 et Entrée | [Principes](../../www/pedagogie/principes.md#une-chose-à-la-fois) |
| Animations | La préférence de l’appareil « Réduire les animations » (`prefers-reduced-motion`) ; le réglage de l’appli du même nom, retiré le 28 septembre 2026, est à refaire pour tous les univers ([état des chantiers](../pilotage/chantiers.md#laccessibilité-dans-lappli)) | `src/core/motion.ts`, `src/styles/global.css` |
| Pas de texte dans la 3D | Tout texte est dans un panneau HTML | [Principes](../../www/pedagogie/principes.md) |

### À surveiller

Ces points ne sont pas des défauts constatés : ce sont les endroits où le jeu, dans Blocland comme dans Archipéo s’il reprend, peut s’éloigner des bonnes pratiques, et que le référent dys regarde en priorité.

- **Le monde en 3D** : trajets de caméra (voyage entre îles, arrivée sur une île), célébrations, eau et lumière qui bougent. Ils respectent « Réduire les animations », sans flash ni secousse.
- **La couleur seule** : nouvelles couleurs des matières et des archipels, états d’île ; chaque information passe aussi par un mot, une forme ou une icône.
- **Les titres en Montserrat grasse** (Archipéo) **et en Archivo Black** (Blocland) : réservés aux titres courts, jamais en capitales, jamais pour une consigne.
- **L’appui qui enfonce un bloc** (Blocland : 3 px, instantané, sans décaler la page) : un retour d’appui, pas une animation ; il reste avec « Réduire les animations ». À vérifier sur appareil : faire défiler une liste de cartes ne doit pas donner l’impression d’appuyer.
- **Les gestes dans le monde** : poser un bloc, se déplacer, glisser un sujet vers un verbe ; chacun a une façon de faire par simple toucher.
- **Les nouveaux mots de l’univers** (Expéditions, rôles, états d’île) : peu nombreux, stables, lus à voix haute, expliqués la première fois.
- **La barre du bas en icônes seules** (Blocland, P2, PR 2, choix du mainteneur le 4 octobre 2026 ; Archipéo aussi, choix « 4a » du même jour) ; **le mot revient sous l’icône en grand texte** (même jour, « ok 2a », à la réévaluation après la PR 2), plafonné à 24 px, sous la taille choisie quand elle est plus grande (à 32 px, la barre prenait la moitié d’un téléphone) ; test en classe : l’élève réglé en 32 px lit-il « Carte » et « Blocs » à bout de bras sur la tablette ? : W3C COGA ([Making Content Usable](https://www.w3.org/TR/coga-usable/), objectif 3) recommande d’accompagner une icône d’un texte ; le grand texte est le réglage de l’élève qui lit difficilement. Ce qui atténue : la place fixe des quatre boutons, leur nom lu, le titre de l’écran qui s’ouvre, le bouton ouvert enfoncé (en or dans Blocland, sur le sable dans Archipéo). Le bouton de l’île change d’icône d’une île à l’autre : c’est le moins sûr. Test en classe : « va à Mes blocs, puis à la Carte, puis ouvre le panneau de ton île », sans aide. Voir aussi les [bonnes pratiques UX UI](../ux-ui/bonnes-pratiques.md#à-surveiller).
- **La Carte sans encart** (mot du mainteneur, 4 octobre 2026) : la prochaine destination n’y est plus dite en mots ni à voix haute, seulement montrée par la bulle bordée d’or (dans les deux univers depuis le 4 octobre 2026, en hexagone dans Archipéo, avec l’image de ce qu’on y fait, seule marque qui bouge ; l’élève est un médaillon immobile à son visage, distinct par la forme, piste B du 4 octobre 2026) ; la phrase reste au menu (« Reprendre l’aventure ») et dans le panneau de l’île. La liste « Les îles et leur état », la Carte en mots, n’y est plus (la vue simple la garde ; au clavier, les flèches mènent d’île en île). Si des élèves ne comprennent pas où aller, pistes : un mot ou une icône sur l’étiquette de l’île visée.
- **Recentrer sans mot** (Blocland, mot du mainteneur du 4 octobre 2026 : « un bouton tête du personnage » ; Archipéo aussi, choix « 1a » du même jour) : un rond au visage du bonhomme (peint dans Archipéo), sans texte ; W3C COGA (objectif 3) recommande un texte avec l’icône. Ce qui atténue : il n’apparaît qu’après un glissé de l’élève, son nom est lu. Il ressemble au médaillon « toi » de la Carte, qu’on ne touche pas ; test en classe : « Rapproche la Carte, puis reviens à toi », sans aide. Le mainteneur a écarté le mot en grand texte (4 octobre 2026 : « 1 non ») ; si l’élève touche le médaillon ou ne trouve pas le bouton, piste : une petite flèche de retour sur le rond.
- **Les Réglages tout en bas du menu** (mot du mainteneur, 4 octobre 2026) : en grand texte sur téléphone, le menu défile et les Réglages (taille du texte, police) arrivent après le Tutoriel, sous le pli ; avant, ils étaient visibles dès l’ouverture. Test en classe : « Agrandis le texte », sans aide. Piste s’il se perd : les garder visibles en bas de l’écran pendant que la liste défile (pas en grand texte, où ils couvriraient des lignes).
- **Le RGAA 5 et l’application installée** : quand il paraîtra, relire ses nouveaux critères, surtout ceux des applications mobiles.

## Sources

Consultées en septembre 2026. Plusieurs pages officielles n’étaient lisibles qu’en résumé : un point décisif se revérifie à la source.

- DINUM, [Nouvelle version du RGAA](https://www.numerique.gouv.fr/actualites/nouvelle-version-rgaa-2026/) (2 mars 2026) et [RGAA](https://accessibilite.numerique.gouv.fr/)
- W3C, [Règles pour l’accessibilité des contenus web (WCAG) 2.2](https://www.w3.org/Translations/WCAG22-fr/)
- W3C, [Making Content Usable for People with Cognitive and Learning Disabilities](https://www.w3.org/TR/coga-usable/)
- Ministère chargé des personnes handicapées, [28 juin 2025 : l’accessibilité des produits et des services en Europe](https://handicap.gouv.fr/28-juin-2025-une-avancee-decisive-pour-laccessibilite-des-produits-et-des-services-en-europe)
- [Stratégie nationale 2023-2027 pour les troubles du neurodéveloppement](https://www.info.gouv.fr/actualite/81-mesures-pour-les-troubles-du-neurodeveloppement) et son [bilan 2025-2026](https://handicap.gouv.fr/bilan-2025-2026-de-la-strategie-nationale-2023-2027-pour-les-troubles-du-neurodeveloppement-tnd)
- Eduscol, [« Aménagements raisonnables »](https://primabord.eduscol.education.fr/amenagements-raisonnables-des-fiches-outils-au-service-de-l-inclusion-a) ; Mon Parcours Handicap, [Troubles dys : quels aménagements pour la scolarité](https://www.monparcourshandicap.gouv.fr/actualite/troubles-dys-quels-amenagements-pour-la-scolarite)
- Haute Autorité de santé, [Comment améliorer le parcours de santé d’un enfant avec troubles spécifiques du langage et des apprentissages](https://www.has-sante.fr/jcms/c_2822893/fr/comment-ameliorer-le-parcours-de-sante-d-un-enfant-avec-troubles-specifiques-du-langage-et-des-apprentissages) (2017)
- Conseil scientifique de l’éducation nationale, [note sur les dispositifs lumineux pour la dyslexie](https://www.reseau-canope.fr/fileadmin/user_upload/Projets/conseil_scientifique_education_nationale/Note_CSEN_2021_01.pdf) (2021)
- Zorzi et coll., « Extra-large letter spacing improves reading in dyslexia », PNAS, 2012 ([résumé en français](https://sferorthoptie.com/actualite/lespacement-extra-large-des-lettres-ameliore-la-lecture-dans-la-dyslexie/)) ; sur les polices dys, [Parler & Lire](https://parleretlire.com/blog/opendyslexic-dyslexie-font-et-autres-polices-pour-dyslexiques-est-ce-que-ca-marche-vraiment/)
- Cartable fantastique, [16 principes pour adapter](https://www.cartablefantastique.fr/outils-pour-adapter/16-principes-pour-adapter/) et [Adapter pour les élèves dyspraxiques](https://www.cartablefantastique.fr/outils-pour-adapter/adapter-ses-ressources/)
- Unapei, [Les règles du FALC](https://falc.unapei.org/quest-ce-que-le-falc/les-regles-du-falc/)
- British Dyslexia Association, [Dyslexia Style Guide 2023](https://cdn.bdadyslexia.org.uk/uploads/documents/Advice/style-guide/BDA-Style-Guide-2023.pdf)
- [Game Accessibility Guidelines](https://gameaccessibilityguidelines.com/full-list/)
