// Cycle 3 (CM1, CM2, 6e) : le programme en vigueur à la rentrée 2020 (annexe 2), résumé au grain d'une mission.
// Les libellés sont des résumés fidèles du texte officiel ; le texte fait foi (page du PDF indiquée).
import type { ProgrammeDomaine, ProgrammeEntry } from './types';

export const DOMAINES_C3: readonly ProgrammeDomaine[] = [
  { id: 'c3-fr-oral', cycle: 3, discipline: 'francais', title: 'Langage oral', page: 10 },
  { id: 'c3-fr-lecture', cycle: 3, discipline: 'francais', title: 'Lecture et compréhension de l’écrit', page: 14 },
  { id: 'c3-fr-ecriture', cycle: 3, discipline: 'francais', title: 'Écriture', page: 17 },
  { id: 'c3-fr-langue', cycle: 3, discipline: 'francais', title: 'Étude de la langue (grammaire, orthographe, lexique)', page: 21 },
  { id: 'c3-fr-culture', cycle: 3, discipline: 'francais', title: 'Culture littéraire et artistique', page: 25 },
  { id: 'c3-ma-nombres', cycle: 3, discipline: 'maths', title: 'Nombres et calculs', page: 91 },
  { id: 'c3-ma-grandeurs', cycle: 3, discipline: 'maths', title: 'Grandeurs et mesures', page: 94 },
  { id: 'c3-ma-espace', cycle: 3, discipline: 'maths', title: 'Espace et géométrie', page: 96 },
  { id: 'c3-en-ecouter', cycle: 3, discipline: 'anglais', title: 'Langues vivantes : écouter et comprendre', page: 33 },
  { id: 'c3-en-lire', cycle: 3, discipline: 'anglais', title: 'Langues vivantes : lire et comprendre', page: 34 },
  { id: 'c3-en-parler', cycle: 3, discipline: 'anglais', title: 'Langues vivantes : parler en continu', page: 35 },
  { id: 'c3-en-ecrire', cycle: 3, discipline: 'anglais', title: 'Langues vivantes : écrire', page: 36 },
  { id: 'c3-en-dialoguer', cycle: 3, discipline: 'anglais', title: 'Langues vivantes : réagir et dialoguer', page: 37 },
  { id: 'c3-en-culture', cycle: 3, discipline: 'anglais', title: 'Langues vivantes : connaissances culturelles', page: 38 },
  { id: 'c3-en-langue', cycle: 3, discipline: 'anglais', title: 'Langues vivantes : grammaire et phonologie', page: 39 },
];

// Attendus de fin de cycle, cités (raccourcis) une fois pour ne pas les répéter à chaque entrée.
const FR_LIRE = 'Lire, comprendre et interpréter un texte littéraire adapté à son âge et réagir à sa lecture';
const FR_DOCS = 'Lire et comprendre des textes et des documents (textes, tableaux, graphiques, schémas, diagrammes, images) pour apprendre dans les différentes disciplines';
const FR_ORAL_ECRIT = 'Maîtriser les relations entre l’oral et l’écrit';
const FR_ACCORDS = 'Maîtriser les accords dans le groupe nominal, entre le verbe et son sujet dans les cas simples, et l’accord de l’attribut';
const FR_SENS = 'Raisonner pour analyser le sens des mots en contexte et en prenant appui sur la morphologie';
const FR_PHRASE = 'Être capable de repérer les principaux constituants d’une phrase simple et complexe';
const FR_ORTHO_LEX = 'Acquérir l’orthographe lexicale';
const MA_N1 = 'Utiliser et représenter les grands nombres entiers, des fractions simples, les nombres décimaux';
const MA_N2 = 'Calculer avec des nombres entiers et des nombres décimaux';
const MA_N3 = 'Résoudre des problèmes en utilisant des fractions simples, les nombres décimaux et le calcul';
const MA_G1 = 'Comparer, estimer, mesurer des grandeurs géométriques avec des nombres entiers et des nombres décimaux : longueur (périmètre), aire, volume, angle';
const MA_G2 = 'Utiliser le lexique, les unités, les instruments de mesures spécifiques de ces grandeurs';
const MA_G3 = 'Résoudre des problèmes impliquant des grandeurs (géométriques, physiques, économiques) en utilisant des nombres entiers et des nombres décimaux';
const MA_E1 = '(Se) repérer et (se) déplacer dans l’espace en utilisant ou en élaborant des représentations';
const MA_E2 = 'Reconnaître, nommer, décrire, reproduire, représenter, construire des figures et solides usuels';
const MA_E3 = 'Reconnaître et utiliser quelques relations géométriques (alignement, perpendicularité, parallélisme, égalité de longueurs, symétrie, agrandissement et réduction)';
const EN_ECOUTER = 'A1 : comprendre des mots familiers et des expressions très courantes sur soi, sa famille et son environnement immédiat ; A2 : comprendre une intervention brève si elle est claire et simple';
const EN_LIRE = 'A1 : comprendre des mots familiers et des phrases très simples ; A2 : comprendre des textes courts et simples';
const EN_PARLER = 'A1 : utiliser des expressions et des phrases simples pour parler de soi et de son environnement immédiat ; A2 : produire en termes simples des énoncés sur les gens et les choses';
const EN_ECRIRE = 'A1 : copier un modèle écrit, écrire un court message et renseigner un questionnaire simple ; A2 : produire des énoncés simples et brefs';
const EN_DIALOGUER = 'A1 : communiquer de façon simple si l’interlocuteur répète ou reformule ; A2 : interagir de façon simple et reformuler son propos pour s’adapter à l’interlocuteur';
const EN_CULTURE = 'Identifier quelques grands repères culturels de l’environnement quotidien des élèves du même âge dans les pays ou régions étudiés';
const EN_GRAMMAIRE = 'Avoir un contrôle limité de quelques structures et formes grammaticales simples appartenant à un répertoire mémorisé';
const EN_PHONO = 'Reconnaître et reproduire de manière intelligible les sons, l’accentuation, les rythmes et les courbes intonatives propres à la langue';

export const ENTRIES_C3 = [
  // ---------- Français ----------
  { id: 'c3.fr.oral.comprendre-s-exprimer', cycle: 3, discipline: 'francais', domaine: 'c3-fr-oral', attendu: 'Écouter pour comprendre un message oral ; parler en prenant en compte son auditoire ; participer à des échanges', competence: 'Langage oral : écouter, dire, débattre, présenter', page: 10 },
  { id: 'c3.fr.lecture.fluidite', cycle: 3, discipline: 'francais', domaine: 'c3-fr-lecture', attendu: FR_LIRE, competence: 'Lire avec fluidité : mémoriser la lecture de mots fréquents et irréguliers, automatiser le décodage, respecter les groupes syntaxiques et la ponctuation', page: 15 },
  { id: 'c3.fr.lecture.explicite', cycle: 3, discipline: 'francais', domaine: 'c3-fr-lecture', attendu: FR_LIRE, competence: 'Comprendre un texte : repérer les informations explicites, les personnages, les lieux, les actions, les repères temporels', page: 15 },
  { id: 'c3.fr.lecture.implicite', cycle: 3, discipline: 'francais', domaine: 'c3-fr-lecture', attendu: FR_LIRE, competence: 'Repérer l’implicite et les liens logiques d’un texte ; justifier son interprétation en s’appuyant sur le texte', page: 15 },
  { id: 'c3.fr.lecture.reprises', cycle: 3, discipline: 'francais', domaine: 'c3-fr-lecture', attendu: FR_LIRE, competence: 'Être vigilant aux reprises nominales et pronominales : savoir de qui ou de quoi on parle', page: 16 },
  { id: 'c3.fr.lecture.lexique-contexte', cycle: 3, discipline: 'francais', domaine: 'c3-fr-lecture', attendu: FR_LIRE, competence: 'Élucider le sens d’un mot inconnu par le contexte, la morphologie ou le dictionnaire', page: 15 },
  { id: 'c3.fr.lecture.genres', cycle: 3, discipline: 'francais', domaine: 'c3-fr-lecture', attendu: FR_LIRE, competence: 'Identifier les principaux genres littéraires (conte, roman, poésie, fable, nouvelle, théâtre) et leurs caractéristiques', page: 15 },
  { id: 'c3.fr.lecture.documents', cycle: 3, discipline: 'francais', domaine: 'c3-fr-lecture', attendu: FR_DOCS, competence: 'Comprendre un document composite : mettre en relation texte, image, schéma, tableau ou graphique ; identifier la nature et la source du document', page: 16 },
  { id: 'c3.fr.ecriture.rediger', cycle: 3, discipline: 'francais', domaine: 'c3-fr-ecriture', attendu: 'Écrire un texte d’une à deux pages adapté à son destinataire ; après révision, obtenir un texte organisé et cohérent', competence: 'Écriture : rédiger des écrits variés, réviser et améliorer son texte', page: 17 },
  { id: 'c3.fr.langue.phonemes-graphemes', cycle: 3, discipline: 'francais', domaine: 'c3-fr-langue', attendu: FR_ORAL_ECRIT, competence: 'Maîtriser l’ensemble des phonèmes du français et des graphèmes associés ; consolider le décodage', page: 21 },
  { id: 'c3.fr.langue.genre-nombre', cycle: 3, discipline: 'francais', domaine: 'c3-fr-langue', attendu: FR_ORAL_ECRIT, competence: 'Connaître les marques du genre et du nombre, à l’oral et à l’écrit (noms, déterminants, adjectifs, pronoms, verbes)', page: 21 },
  { id: 'c3.fr.langue.homophonie', cycle: 3, discipline: 'francais', domaine: 'c3-fr-langue', attendu: FR_ORAL_ECRIT, competence: 'Prendre conscience des homophones lexicaux et grammaticaux et les distinguer en contexte', page: 22 },
  { id: 'c3.fr.langue.nature-fonction', cycle: 3, discipline: 'francais', domaine: 'c3-fr-langue', attendu: FR_PHRASE, competence: 'Comprendre et maîtriser les notions de nature (classe grammaticale) et de fonction', page: 22 },
  { id: 'c3.fr.langue.sujet', cycle: 3, discipline: 'francais', domaine: 'c3-fr-langue', attendu: FR_PHRASE, competence: 'Identifier le sujet, y compris composé de plusieurs noms ou inversé', page: 22 },
  { id: 'c3.fr.langue.complements', cycle: 3, discipline: 'francais', domaine: 'c3-fr-langue', attendu: FR_PHRASE, competence: 'Différencier les compléments : COD, COI, compléments circonstanciels de temps, de lieu et de cause', page: 22 },
  { id: 'c3.fr.langue.attribut-gn', cycle: 3, discipline: 'francais', domaine: 'c3-fr-langue', attendu: FR_PHRASE, competence: 'Identifier l’attribut du sujet ; analyser le groupe nominal : épithète et complément du nom', page: 22 },
  { id: 'c3.fr.langue.classes-de-mots', cycle: 3, discipline: 'francais', domaine: 'c3-fr-langue', attendu: FR_PHRASE, competence: 'Différencier les classes de mots : déterminants possessifs et démonstratifs, pronom personnel objet, adverbe, préposition, conjonctions de coordination et de subordination', page: 22 },
  { id: 'c3.fr.langue.types-formes', cycle: 3, discipline: 'francais', domaine: 'c3-fr-langue', attendu: FR_PHRASE, competence: 'Connaître les trois types de phrases (déclarative, interrogative, impérative) et les formes négative et exclamative', page: 22 },
  { id: 'c3.fr.langue.phrase-complexe', cycle: 3, discipline: 'francais', domaine: 'c3-fr-langue', attendu: FR_PHRASE, competence: 'Différencier phrase simple et phrase complexe ; repérer juxtaposition, coordination et subordination', page: 22 },
  { id: 'c3.fr.langue.accord-gn', cycle: 3, discipline: 'francais', domaine: 'c3-fr-langue', attendu: FR_ACCORDS, competence: 'Connaître la notion de groupe nominal et d’accord au sein du groupe nominal (déterminant, nom, adjectif)', page: 23 },
  { id: 'c3.fr.langue.accord-sujet-verbe', cycle: 3, discipline: 'francais', domaine: 'c3-fr-langue', attendu: FR_ACCORDS, competence: 'Maîtriser l’accord du verbe avec son sujet, y compris inversé', page: 23 },
  { id: 'c3.fr.langue.attribut-participe-etre', cycle: 3, discipline: 'francais', domaine: 'c3-fr-langue', attendu: FR_ACCORDS, competence: 'Maîtriser l’accord de l’attribut avec le sujet et du participe passé avec être (cas les plus usuels)', page: 23 },
  { id: 'c3.fr.langue.reconnaitre-verbe', cycle: 3, discipline: 'francais', domaine: 'c3-fr-langue', attendu: FR_ACCORDS, competence: 'Reconnaître le verbe ; connaître les trois groupes ; distinguer temps simples et temps composés ; comprendre la notion de participe passé', page: 23 },
  { id: 'c3.fr.langue.temps-a-memoriser', cycle: 3, discipline: 'francais', domaine: 'c3-fr-langue', attendu: FR_ACCORDS, competence: 'Mémoriser le présent, l’imparfait, le futur, le passé simple, le passé composé, le plus-que-parfait, le conditionnel présent et l’impératif présent pour être, avoir, les verbes des 1er et 2e groupes et faire, aller, dire, venir, pouvoir, voir, vouloir, prendre', page: 23 },
  { id: 'c3.fr.langue.finales-en-e', cycle: 3, discipline: 'francais', domaine: 'c3-fr-langue', attendu: FR_ACCORDS, competence: 'Distinguer les finales verbales en /E/ (é, er, ez) par la procédure de remplacement', page: 23 },
  { id: 'c3.fr.langue.derivation-composition', cycle: 3, discipline: 'francais', domaine: 'c3-fr-langue', attendu: FR_SENS, competence: 'Comprendre la formation des mots complexes par dérivation (préfixe, radical, suffixe) et par composition', page: 24 },
  { id: 'c3.fr.langue.racines', cycle: 3, discipline: 'francais', domaine: 'c3-fr-langue', attendu: FR_SENS, competence: 'Connaître le sens des principaux préfixes ; découvrir des racines latines et grecques', page: 24 },
  { id: 'c3.fr.langue.familles-champ-lexical', cycle: 3, discipline: 'francais', domaine: 'c3-fr-langue', attendu: FR_SENS, competence: 'Mettre en réseau des mots : familles de mots, champ lexical', page: 24 },
  { id: 'c3.fr.langue.synonymie', cycle: 3, discipline: 'francais', domaine: 'c3-fr-langue', attendu: FR_SENS, competence: 'Connaître les notions de synonymie, d’antonymie, d’homonymie et de polysémie', page: 24 },
  { id: 'c3.fr.langue.mots-invariables', cycle: 3, discipline: 'francais', domaine: 'c3-fr-langue', attendu: FR_ORTHO_LEX, competence: 'Mémoriser l’orthographe des mots invariables ; utiliser des listes de fréquence pour les mots les plus courants', page: 24 },
  { id: 'c3.fr.langue.regularites-orthographiques', cycle: 3, discipline: 'francais', domaine: 'c3-fr-langue', attendu: FR_ORTHO_LEX, competence: 'Mémoriser le lexique appris en s’appuyant sur ses régularités, sa formation et son étymologie', page: 24 },
  { id: 'c3.fr.culture.entrees', cycle: 3, discipline: 'francais', domaine: 'c3-fr-culture', attendu: 'Lire des œuvres de littérature de jeunesse et du patrimoine, en classe et en lecture autonome', competence: 'Culture littéraire et artistique : le monstre, les récits d’aventures, les récits de création, résister au plus fort', page: 25 },
  // ---------- Mathématiques ----------
  { id: 'c3.ma.nombres.grands-entiers', cycle: 3, discipline: 'maths', domaine: 'c3-ma-nombres', attendu: MA_N1, competence: 'Connaître les unités de numération jusqu’aux milliards ; composer, décomposer, comparer, encadrer et placer les grands nombres entiers', page: 92 },
  { id: 'c3.ma.nombres.fractions-designations', cycle: 3, discipline: 'maths', domaine: 'c3-ma-nombres', attendu: MA_N1, competence: 'Connaître diverses désignations des fractions ; utiliser une fraction comme opérateur de partage ; placer une fraction sur une demi-droite graduée', page: 92 },
  { id: 'c3.ma.nombres.fractions-comparer', cycle: 3, discipline: 'maths', domaine: 'c3-ma-nombres', attendu: MA_N1, competence: 'Encadrer une fraction par deux entiers, comparer des fractions de même dénominateur, écrire une fraction comme somme d’un entier et d’une fraction, connaître des égalités usuelles', page: 92 },
  { id: 'c3.ma.nombres.decimaux-ecritures', cycle: 3, discipline: 'maths', domaine: 'c3-ma-nombres', attendu: MA_N1, competence: 'Connaître les unités de numération décimale (dixièmes, centièmes, millièmes), la valeur des chiffres, les écritures fractionnaire, à virgule et décomposées d’un décimal', page: 92 },
  { id: 'c3.ma.nombres.decimaux-comparer', cycle: 3, discipline: 'maths', domaine: 'c3-ma-nombres', attendu: MA_N1, competence: 'Placer un décimal sur une demi-droite graduée ; comparer, ranger, encadrer, intercaler des décimaux', page: 92 },
  { id: 'c3.ma.nombres.faits-numeriques', cycle: 3, discipline: 'maths', domaine: 'c3-ma-nombres', attendu: MA_N2, competence: 'Mobiliser les faits numériques mémorisés : tables de multiplication, multiples de 25 et de 50, diviseurs de 100', page: 93 },
  { id: 'c3.ma.nombres.calcul-mental', cycle: 3, discipline: 'maths', domaine: 'c3-ma-nombres', attendu: MA_N2, competence: 'Calcul mental et en ligne : multiplier ou diviser par 10, 100, 1000 ; complément à l’entier supérieur ; multiplier par 5, 25, 50, 0,1, 0,5 ; propriétés des opérations ; ordre de grandeur', page: 93 },
  { id: 'c3.ma.nombres.divisibilite', cycle: 3, discipline: 'maths', domaine: 'c3-ma-nombres', attendu: MA_N2, competence: 'Connaître les critères de divisibilité par 2, 3, 5, 9 et 10', page: 93 },
  { id: 'c3.ma.nombres.calcul-pose', cycle: 3, discipline: 'maths', domaine: 'c3-ma-nombres', attendu: MA_N2, competence: 'Calcul posé : addition, soustraction et multiplication d’entiers ou de décimaux ; division euclidienne ; division d’un décimal par un entier', page: 93 },
  { id: 'c3.ma.nombres.problemes', cycle: 3, discipline: 'maths', domaine: 'c3-ma-nombres', attendu: MA_N3, competence: 'Résoudre des problèmes mettant en jeu les quatre opérations, à une ou plusieurs étapes', page: 93 },
  { id: 'c3.ma.nombres.donnees', cycle: 3, discipline: 'maths', domaine: 'c3-ma-nombres', attendu: MA_N3, competence: 'Lire ou construire des tableaux (à double entrée), des diagrammes en bâtons ou circulaires, des graphiques cartésiens', page: 93 },
  { id: 'c3.ma.nombres.proportionnalite', cycle: 3, discipline: 'maths', domaine: 'c3-ma-nombres', attendu: MA_N3, competence: 'Reconnaître et résoudre des problèmes de proportionnalité (linéarité, passage à l’unité, coefficient) ; appliquer un pourcentage', page: 94 },
  { id: 'c3.ma.grandeurs.perimetre', cycle: 3, discipline: 'maths', domaine: 'c3-ma-grandeurs', attendu: MA_G1, competence: 'Calculer le périmètre d’un polygone, d’un carré, d’un rectangle ; la longueur d’un cercle', page: 94 },
  { id: 'c3.ma.grandeurs.aire', cycle: 3, discipline: 'maths', domaine: 'c3-ma-grandeurs', attendu: MA_G1, competence: 'Différencier périmètre et aire ; déterminer une aire par pavage ou par formule (carré, rectangle, triangle, disque) ; unités d’aire', page: 95 },
  { id: 'c3.ma.grandeurs.volume', cycle: 3, discipline: 'maths', domaine: 'c3-ma-grandeurs', attendu: MA_G1, competence: 'Relier volume et contenance ; volume du cube et du pavé droit ; unités de volume et de contenance', page: 95 },
  { id: 'c3.ma.grandeurs.angles', cycle: 3, discipline: 'maths', domaine: 'c3-ma-grandeurs', attendu: MA_G1, competence: 'Comparer des angles ; estimer qu’un angle est droit, aigu ou obtus ; mesurer en degrés avec le rapporteur', page: 95 },
  { id: 'c3.ma.grandeurs.unites-conversions', cycle: 3, discipline: 'maths', domaine: 'c3-ma-grandeurs', attendu: MA_G2, competence: 'Connaître les unités de longueur, de masse et de contenance, leurs relations avec les unités de numération ; convertir', page: 94 },
  { id: 'c3.ma.grandeurs.durees', cycle: 3, discipline: 'maths', domaine: 'c3-ma-grandeurs', attendu: MA_G3, competence: 'Calculer une durée entre deux instants, un instant à partir d’une durée ; unités de durée ; horaires de transport ou de cinéma', page: 95 },
  { id: 'c3.ma.espace.reperage', cycle: 3, discipline: 'maths', domaine: 'c3-ma-espace', attendu: MA_E1, competence: 'Se repérer et décrire des déplacements sur un plan ou une carte ; programmer les déplacements d’un personnage', page: 97 },
  { id: 'c3.ma.espace.figures-solides', cycle: 3, discipline: 'maths', domaine: 'c3-ma-espace', attendu: MA_E2, competence: 'Reconnaître, nommer, décrire les triangles particuliers, les quadrilatères particuliers, le cercle et les solides usuels, avec leur vocabulaire', page: 97 },
  { id: 'c3.ma.espace.construction', cycle: 3, discipline: 'maths', domaine: 'c3-ma-espace', attendu: MA_E2, competence: 'Reproduire et construire des figures et des solides ; rédiger un programme de construction', page: 97 },
  { id: 'c3.ma.espace.relations', cycle: 3, discipline: 'maths', domaine: 'c3-ma-espace', attendu: MA_E3, competence: 'Perpendicularité, parallélisme, alignement, distance ; symétrie axiale et médiatrice', page: 97 },
  { id: 'c3.ma.espace.echelle', cycle: 3, discipline: 'maths', domaine: 'c3-ma-espace', attendu: MA_E3, competence: 'Reproduire une figure à une échelle donnée : agrandissement, réduction', page: 98 },
  // ---------- Anglais (langues vivantes) ----------
  { id: 'c3.en.ecouter.consignes', cycle: 3, discipline: 'anglais', domaine: 'c3-en-ecouter', attendu: EN_ECOUTER, competence: 'Comprendre l’ensemble des consignes utilisées en classe et suivre les instructions données', page: 33 },
  { id: 'c3.en.ecouter.mots-familiers', cycle: 3, discipline: 'anglais', domaine: 'c3-en-ecouter', attendu: EN_ECOUTER, competence: 'Comprendre des mots familiers et des expressions courantes ; reconstruire le sens à partir d’indices sonores et visuels', page: 33 },
  { id: 'c3.en.ecouter.histoire', cycle: 3, discipline: 'anglais', domaine: 'c3-en-ecouter', attendu: EN_ECOUTER, competence: 'Suivre le fil d’une histoire simple ; identifier le sujet et l’information essentielle d’un message oral court', page: 33 },
  { id: 'c3.en.lire.mots-isoles', cycle: 3, discipline: 'anglais', domaine: 'c3-en-lire', attendu: EN_LIRE, competence: 'Reconnaître des mots isolés dans un énoncé ou un texte court ; s’appuyer sur les mots outils et les structures simples', page: 34 },
  { id: 'c3.en.lire.textes-courts', cycle: 3, discipline: 'anglais', domaine: 'c3-en-lire', attendu: EN_LIRE, competence: 'Comprendre des textes courts et simples (consignes, correspondance, recette, texte informatif, récit) accompagnés d’un visuel ; identifier le type de document', page: 34 },
  { id: 'c3.en.parler.reproduire-presenter', cycle: 3, discipline: 'anglais', domaine: 'c3-en-parler', attendu: EN_PARLER, competence: 'Reproduire un modèle oral, lire à haute voix un texte bref, se présenter, décrire son environnement, raconter une histoire courte avec des supports visuels', page: 35 },
  { id: 'c3.en.ecrire.dictee', cycle: 3, discipline: 'anglais', domaine: 'c3-en-ecrire', attendu: EN_ECRIRE, competence: 'Copier des mots isolés et des textes courts ; écrire sous la dictée des expressions connues', page: 36 },
  { id: 'c3.en.ecrire.phrases', cycle: 3, discipline: 'anglais', domaine: 'c3-en-ecrire', attendu: EN_ECRIRE, competence: 'Renseigner un questionnaire ; produire quelques phrases sur soi, les autres, des objets et des lieux ; rédiger un courrier court d’après un modèle', page: 36 },
  { id: 'c3.en.dialoguer.contact-social', cycle: 3, discipline: 'anglais', domaine: 'c3-en-dialoguer', attendu: EN_DIALOGUER, competence: 'Établir un contact social : saluer, se présenter, présenter quelqu’un, demander des nouvelles, formules de politesse', page: 37 },
  { id: 'c3.en.dialoguer.renseignements', cycle: 3, discipline: 'anglais', domaine: 'c3-en-dialoguer', attendu: EN_DIALOGUER, competence: 'Dialoguer pour échanger ou obtenir des renseignements (itinéraire, horaire, prix) et sur des sujets familiers (école, loisirs, maison)', page: 37 },
  { id: 'c3.en.dialoguer.reagir', cycle: 3, discipline: 'anglais', domaine: 'c3-en-dialoguer', attendu: EN_DIALOGUER, competence: 'Réagir à des propositions (remercier, féliciter, s’excuser, accepter, refuser) ; répondre à des questions simples et en poser', page: 37 },
  { id: 'c3.en.culture.vie-quotidienne', cycle: 3, discipline: 'anglais', domaine: 'c3-en-culture', attendu: EN_CULTURE, competence: 'Lexique de la personne et de la vie quotidienne : le corps, les vêtements, le portrait, l’habitat, l’environnement, les besoins quotidiens', page: 39 },
  { id: 'c3.en.culture.reperes', cycle: 3, discipline: 'anglais', domaine: 'c3-en-culture', attendu: EN_CULTURE, competence: 'Repères géographiques, historiques et culturels des pays dont on étudie la langue ; quelques figures et grandes pages d’histoire', page: 39 },
  { id: 'c3.en.culture.imaginaire', cycle: 3, discipline: 'anglais', domaine: 'c3-en-culture', attendu: EN_CULTURE, competence: 'L’imaginaire : littérature de jeunesse, contes et légendes, héros et personnages de fiction', page: 39 },
  { id: 'c3.en.langue.groupe-verbal', cycle: 3, discipline: 'anglais', domaine: 'c3-en-langue', attendu: EN_GRAMMAIRE, competence: 'Le verbe et son accord avec le sujet ; l’expression du présent, du passé et du futur ; les auxiliaires', page: 39 },
  { id: 'c3.en.langue.groupe-nominal', cycle: 3, discipline: 'anglais', domaine: 'c3-en-langue', attendu: EN_GRAMMAIRE, competence: 'Nom et pronom, genre et nombre, articles, possessifs, démonstratifs, quantifieurs, prépositions, place et accord de l’adjectif, génitif', page: 39 },
  { id: 'c3.en.langue.phrase', cycle: 3, discipline: 'anglais', domaine: 'c3-en-langue', attendu: EN_GRAMMAIRE, competence: 'Types et formes de phrase (déclarative, interrogative, exclamative, impérative, négative) ; ordre des mots ; mots de liaison ; quelques subordonnants', page: 39 },
  { id: 'c3.en.langue.phonologie', cycle: 3, discipline: 'anglais', domaine: 'c3-en-langue', attendu: EN_PHONO, competence: 'Percevoir et reproduire les phonèmes spécifiques, l’accent tonique, le rythme et les schémas intonatifs', page: 40 },
  { id: 'c3.en.langue.phonie-graphie', cycle: 3, discipline: 'anglais', domaine: 'c3-en-langue', attendu: EN_PHONO, competence: 'Lien phonie-graphie : percevoir la relation entre graphèmes et phonèmes spécifiques à la langue ; l’alphabet', page: 40 },
] as const satisfies readonly ProgrammeEntry[];
