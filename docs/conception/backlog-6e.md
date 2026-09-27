# Backlog : l’application vue par un élève de 6e dys

Ce backlog vient d’une séance de test menée **dans la peau d’un élève de 6e dyslexique** (11 ans, lecture lente, fatigable, souvent sur tablette, parfois sans le son en classe). Parcours joué : accueil, Réglages, Succès, Tutoriel, Homophones, Tables, Fractions, Lecture, puis Blocland (tutoriel, Forêt des sons, ses trois quêtes, Mes blocs, Gardien), sur tablette (1024 × 768) et sur téléphone (390 × 740).

Chaque entrée dit **ce que vit l’élève**, **ce qu’il faudrait changer** et **où**. Priorités :

- **P0** : bloque l’élève ou lui apprend quelque chose de faux ;
- **P1** : gêne réelle à chaque séance ;
- **P2** : confort, finition.

Les cinq **P0 sont faits** ; ce qui a été retenu est décrit sous chacun d’eux.

## P0 — À corriger d’abord

### 1. Abattage syllabique : « écoute » mais compte les syllabes écrites

- **Vécu** : la consigne dit « Écoute le mot, puis tape le nombre de syllabes ». La voix dit « ca-bane », « lan-terne », « vi-llage » : j’entends 2 syllabes, je tape 2, on me répond « Pas tout à fait : lan-ter-ne, 3 syllabes ». Je ne comprends plus ce qu’est une syllabe.
- **Changer** : choisir un seul critère. Soit syllabes **orales** (réponse 2 pour cabane, lanterne, village), soit consigne « **Lis** le mot et compte les syllabes **écrites** » avec le e muet signalé (grisé). Revoir toutes les données `foret-echauffement-*.json` et les autres données d’abattage.
- **Où** : `src/blocland/exercises/data/foret-echauffement-*.json`, `docs/pedagogie/principes.md`.
- **Fait** : on compte les syllabes **entendues**. Cabane, village, lanterne valent 2 (« ca-bane », « vil-lage », « lan-terne »), la consigne dit « que tu entends », la correction montre le découpage oral. Un test de données interdit une syllabe faite d’un e muet seul.

### 2. Abattage : les syllabes en couleurs donnent la réponse

- **Vécu** : « lan**ter**ne » s’affiche avec « ter » en bleu. Je compte les couleurs, pas les sons : l’exercice ne m’entraîne à rien.
- **Changer** : ne jamais colorer le mot-cible d’un exercice qui porte sur le découpage (abattage, et tout item où la réponse est un découpage). Colorer seulement dans la correction.
- **Où** : `src/blocland/exercises/QcmItem.tsx` (ou un drapeau `noSyllables` dans le format d’item), `docs/conception/exercices.md`.
- **Fait** : le mot de l’Abattage s’affiche sans couleurs (écran `AbattageItem`), dans la quête comme au Gardien ; le découpage n’apparaît que dans la correction.

### 3. Blocland : la consigne n’est pas écrite à l’écran

- **Vécu** : dans les quêtes de Blocland, je vois « Le son [an] » et quatre images, ou juste « lanterne » et trois nombres. La consigne n’est que lue à voix haute. En classe sans casque, ou si j’ai coupé la voix, je ne sais pas quoi faire, ni qu’il faut « Valider ».
- **Changer** : afficher la consigne (courte, syllabée) au-dessus de l’item, avec le bouton Écouter, comme dans les quêtes du portail.
- **Où** : `src/blocland/ExerciseRunner.tsx` (le `<h2 id="consigne" className="visually-hidden">`).
- **Fait** : la consigne est écrite au-dessus de l’item, syllabée, avec un bouton 🔊 « Consigne », et lue au début de la partie (sauf dictées, qui lisent déjà leur mot). Au Gardien, chaque manche affiche la consigne de sa quête.

### 4. La correction cache la question

- **Vécu** : quand je réponds, le panneau du bas (« Bien vu ! », « Pas cette fois ») recouvre les réponses du bas et l’aide visuelle du joker (grille de points, barres de fractions). Sur téléphone il recouvre presque tout : je ne vois plus ce que j’ai choisi ni la bonne réponse.
- **Changer** : réserver la place du panneau (padding bas de la zone de question égal à sa hauteur) ou faire défiler automatiquement pour garder visibles la bonne réponse et l’aide ; sur petit écran, panneau repliable.
- **Où** : `src/components/Feedback.tsx`, `src/components/QuizSession.tsx`, `src/blocland/ExerciseRunner.tsx`, styles `.has-sheet`.
- **Fait** : quand le bandeau s’ouvre, sa hauteur est réservée sous la question et l’écran défile juste ce qu’il faut pour garder au-dessus la consigne et la question, ou au moins l’énoncé, la réponse touchée et la bonne réponse (`useSheetClearance`, portail et Blocland). Sur téléphone, le bandeau prend au plus la moitié de l’écran et son titre est plus petit.

### 5. Clic sur une île : il ne se passe (presque) rien

- **Vécu** : la flèche jaune me montre la Forêt. Je touche l’île : Mousso parle dans une bulle, mais le panneau de l’île ne s’ouvre pas. Je ne sais pas qu’il faut toucher encore.
- **Changer** : au premier toucher, ouvrir directement le panneau de l’île (la bulle peut s’y afficher), ou ajouter dans la bulle un bouton « Entrer dans l’île ».
- **Où** : `src/blocland/WorldPage.tsx`, `src/blocland/CreatureBubble.tsx`.
- **Fait** : toucher une créature ouvre le panneau de son île (elle y accueille) ; une fois dans ce panneau, la toucher la fait parler.

## P1 — Gêne à chaque séance

### 6. Un contenu trop « petit » pour un 6e

- **Vécu** : « Rime avec chapeau, comme dans la chanson », gâteau, bateau, emojis de bonbon : j’ai 11 ans, j’ai l’impression d’être en CP. La première île est la seule ouverte : c’est la première chose que je vois.
- **Changer** : garder la conscience phonologique (utile aux dys) mais avec un habillage et un vocabulaire de collège (mots plus longs, rimes riches, sons complexes : [ɛ̃]/[ɑ̃], [ʒ]/[ʃ], sons proches), ou permettre de **commencer par une autre île** de 6e après un court test de positionnement.
- **Où** : données `foret-*`, `docs/conception/cadrage-archipels.md`.

### 7. Correction incomplète dans la Chasse au son

- **Vécu** : j’oublie « vent » et « éléphant » ; la correction ne parle que de « gant ». Je ne sais pas que j’en ai raté d’autres.
- **Changer** : montrer sur les cartes tous les bons mots (contour vert) et tous les pièges cochés à tort (contour rouge), et que la phrase de correction liste tous les mots manqués.
- **Où** : `src/blocland/exercises/ChasseSonScreen.tsx`, `RimesScreen.tsx`, `ExerciseRunner.tsx` (`firstWrong`).

### 8. Pas de deuxième essai ni de joker dans Blocland

- **Vécu** : dans le portail, après une erreur, le joker s’ouvre et je peux réessayer. Dans Blocland, une erreur et c’est fini. Les deux modes ne suivent pas la même règle, je ne comprends pas pourquoi.
- **Changer** : aligner Blocland sur le portail (une erreur = aide + deuxième essai, étoile un peu moins bonne), ou dire clairement la règle au début de la quête.
- **Où** : `src/blocland/ExerciseRunner.tsx`, `docs/manuel/blocland.md`, barème.

### 9. Mots de feedback durs ou flous

- **Vécu** : « RATÉ… » en rouge et en capitales me décourage. « PROPRE ! », « CARTON ! », « IMPARABLE ! » changent à chaque fois : je dois relire un mot nouveau à chaque réponse.
- **Changer** : remplacer « Raté… » par « Presque ! Regarde l’indice » ; limiter les félicitations à 2 ou 3 mots courts et connus (« Bravo ! », « Juste ! ») ; éviter les capitales pour les phrases (mots en capitales plus durs à lire pour un dys).
- **Où** : `src/components/Feedback.tsx` et les listes de messages.

### 10. Police pixel pour les étiquettes

- **Vécu** : « NOUVELLE PARTIE », « AVENTURE », « NIVEAU 6E », « MOUSSO », « 4/6 », le logo « DYSAPPS » : lettres pixel, capitales espacées, petites. Je ne les lis pas.
- **Changer** : garder Silkscreen seulement pour du décor sans information ; toute étiquette qui porte un sens passe dans la police choisie en Réglages, en casse normale, 18 px mini.
- **Où** : `src/styles/`, `docs/conception/style.md`.

### 11. Les notifications de succès couvrent le titre

- **Vécu** : « Succès débloqué — Échauffement » reste 5 secondes par-dessus le titre de la quête et le lien retour ; sur téléphone il pousse la question. Sur la Lecture il recouvre « Tous les textes ».
- **Changer** : afficher les succès **à la fin** de la quête (écran de résultat), ou en bas, petit, sans recouvrir la question.
- **Où** : `src/components/Celebrations.tsx`.

### 12. Lecture sur téléphone : le bouton « J’ai lu » chevauche les réglages

- **Vécu** : le gros bouton vert « J’ai lu : aux questions » flotte par-dessus les cases « Lignes en couleurs » et « Syllabes en couleurs ». Les mots difficiles (alléché, ramage) sont tout en bas, après le texte : je les découvre trop tard.
- **Changer** : bouton en bas du texte (ou barre fixe en bas d’écran qui ne recouvre rien) ; mots difficiles **avant** le texte, ou soulignés dans le texte avec leur sens au toucher.
- **Où** : `src/apps/lecture/`.

### 13. Deux monnaies qui se mélangent : « bois » et « blocs »

- **Vécu** : « Encore 16 bois pour La cabane de Mousso, ou 3 blocs pour le sentier vers Mine des lettres ». Mes blocs : « 36 bois, 1 pierre, 18 sable, 15 brique, 6 galet », puis « 3 blocs de n’importe quel type ». Trop de nombres, je ne sais pas quoi faire en premier.
- **Changer** : **un seul** prochain objectif, avec une image et une jauge (« Cabane : ▰▰▱▱ encore 16 bois ») ; le panneau Mes blocs commence par « Tu peux construire : … » et masque les îles fermées.
- **Où** : `src/blocland/IslandSheet.tsx`, `src/blocland/Inventory.tsx`.

### 14. Fractions : question piège

- **Vécu** : « Quelle fraction est la plus grande : 1/2 ou 2/4 ? » La question dit qu’il y en a une plus grande ; la réponse était « Elles sont égales ». Je me sens piégé.
- **Changer** : « Compare 1/2 et 2/4 : laquelle est la plus grande, ou sont-elles égales ? ».
- **Où** : `src/apps/fractions/generators.tsx` (`compare`).

### 15. Tables : la bonne astuce pour la bonne table

- **Vécu** : pour 4 × 10, le joker dit « fais le double de 10, puis encore le double ». L’astuce du × 10 est plus simple et c’est celle que je connais.
- **Changer** : quand un des facteurs est 10 (ou 1, ou 2), donner l’astuce de ce facteur-là.
- **Où** : `src/apps/tables/`.

## P2 — Confort et finition

### 16. Réglages : des nombres sans sens pour un enfant

- « Espace entre les lettres 0.03 », « Espace entre les mots 0.12 », « Vitesse × 0.9 » : unités inconnues et point anglais. Afficher « Normal / Plus large / Très large » ou une échelle 1 à 5, avec la virgule française.
- Le bouton rouge « Effacer ma progression » est collé à « Affichage par défaut » : un doigt qui glisse et tout est perdu. L’éloigner, et demander de taper un mot ou de maintenir le bouton.
- **Où** : `src/pages/SettingsPage.tsx`.

### 17. « Le Grand Chêne » sans majuscule

- Titre « le Grand Chêne » et phrase qui commence par « le Grand Chêne n’accepte… ». Mettre la majuscule en début de titre et de phrase pour tous les Gardiens.
- **Où** : `src/blocland/biomes.ts` (`guardian`), `BossPage.tsx`.

### 18. Page Français : trop d’îles d’un coup

- Les îles de 5e, 4e, 3e sont toutes listées pour un élève de 6e, et le titre « Archipel de 5e » touche le bas des cartes. Replier les archipels pas encore atteints (« Plus tard : 3 archipels ») et corriger l’espacement.
- **Où** : `src/pages/SubjectPage.tsx`.

### 19. Le Tutoriel est rangé en Français mais parle aussi de maths

- Il pose 2 × 2 et une fraction. Le mettre sur l’accueil (« Commencer ici ») plutôt que dans Français.
- **Où** : `src/apps/registry.ts`, `src/pages/HomePage.tsx`.

### 20. Tutoriel de Blocland : la bulle cache ce qu’elle montre

- La bulle de 6 étapes est posée sur la flèche jaune et l’île dont elle parle. La placer en bas, et faire clignoter ou zoomer sur l’élément expliqué à chaque étape.
- **Où** : `src/blocland/Tutorial.tsx`.

### 21. Des îles sans nom sur la carte

- Vue 3D : aucune île n’a d’étiquette. Afficher le nom (et une icône de matière) au-dessus des îles ouvertes.
- **Où** : `src/blocland/three/`, `WorldPage.tsx`.

### 22. Résultat en pourcentage

- « Résultat 88 % » est abstrait en 6e. Afficher « 7 sur 8 du premier coup » et des étoiles, comme dans Blocland.
- **Où** : `src/components/QuizSession.tsx`.

### 23. Emojis ambigus

- 😁 pour « dent », 🎤 pour « chanter », 💨 pour « vent » : je dois deviner. Le mot écrit est là, mais l’image doit aider, pas faire douter. Revoir les emojis des items de sons et de rimes.
- **Où** : données `foret-chasse-son-*.json`, `foret-rimes-*.json`.

### 24. Répondre au clavier

- Sur ordinateur, pas de touches 1, 2, 3, 4 pour répondre ni Entrée pour « Suivante ». Utile pour les élèves avec une dyspraxie associée.
- **Où** : `src/components/QuizSession.tsx`, `src/blocland/ExerciseRunner.tsx`.

## Ce qui marche bien (à garder)

- Pas de chrono, un item par écran, bouton Écouter partout, séances courtes (6 à 10 items).
- Luciole, 20 px, interlignage large, syllabes en couleurs par défaut ; aperçu en direct dans les Réglages.
- Correction qui explique la règle (« on peut dire *avait* »), +1 XP pour l’effort.
- Fractions écrites en colonne, aides visuelles (grille de points, barres).
- Lecture : lignes numérotées, lignes en couleurs alternées, lexique des mots difficiles.
- L’univers Blocland donne vraiment envie d’entrer.
