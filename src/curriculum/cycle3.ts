// Cycle 3 (CM1, CM2, 6e) : le programme en vigueur à la rentrée 2020 (annexe 2), résumé au grain d'une mission.
// Les libellés sont des résumés fidèles du texte officiel ; le texte fait foi (page du PDF indiquée).
import type { ProgrammeDomaine, ProgrammeEntry } from './types';

export const DOMAINES_C3: readonly ProgrammeDomaine[] = [
  { id: 'c3-fr-oral', cycle: 3, discipline: 'french', title: 'Langage oral', page: 10 },
  { id: 'c3-fr-lecture', cycle: 3, discipline: 'french', title: 'Lecture et compréhension de l’écrit', page: 14 },
  { id: 'c3-fr-ecriture', cycle: 3, discipline: 'french', title: 'Écriture', page: 17 },
  { id: 'c3-fr-langue', cycle: 3, discipline: 'french', title: 'Étude de la langue (grammaire, orthographe, lexique)', page: 21 },
  { id: 'c3-fr-culture', cycle: 3, discipline: 'french', title: 'Culture littéraire et artistique', page: 25 },
  { id: 'c3-ma-nombres', cycle: 3, discipline: 'maths', title: 'Nombres et calculs', page: 91 },
  { id: 'c3-ma-grandeurs', cycle: 3, discipline: 'maths', title: 'Grandeurs et mesures', page: 94 },
  { id: 'c3-ma-espace', cycle: 3, discipline: 'maths', title: 'Espace et géométrie', page: 96 },
  { id: 'c3-en-ecouter', cycle: 3, discipline: 'english', title: 'Langues vivantes : écouter et comprendre', page: 33 },
  { id: 'c3-en-lire', cycle: 3, discipline: 'english', title: 'Langues vivantes : lire et comprendre', page: 34 },
  { id: 'c3-en-parler', cycle: 3, discipline: 'english', title: 'Langues vivantes : parler en continu', page: 35 },
  { id: 'c3-en-ecrire', cycle: 3, discipline: 'english', title: 'Langues vivantes : écrire', page: 36 },
  { id: 'c3-en-dialoguer', cycle: 3, discipline: 'english', title: 'Langues vivantes : réagir et dialoguer', page: 37 },
  { id: 'c3-en-culture', cycle: 3, discipline: 'english', title: 'Langues vivantes : connaissances culturelles', page: 38 },
  { id: 'c3-en-langue', cycle: 3, discipline: 'english', title: 'Langues vivantes : grammaire et phonologie', page: 39 },
  // Histoire et géographie : les pages n'ont pas pu être vérifiées dans le PDF (téléchargement refusé depuis
  // l'environnement de travail, 5 octobre 2026) ; à relire avant la première île. Seule la classe de 6e est
  // résumée : le CM1 et le CM2 ne sont pas dans l'application.
  { id: 'c3-hg-temps', cycle: 3, discipline: 'history-geography', title: 'Histoire et géographie : se repérer dans le temps', page: 73, unverified: true },
  { id: 'c3-hg-espace', cycle: 3, discipline: 'history-geography', title: 'Histoire et géographie : se repérer dans l’espace', page: 73, unverified: true },
  { id: 'c3-hg-demarches', cycle: 3, discipline: 'history-geography', title: 'Histoire et géographie : raisonner, comprendre un document, pratiquer différents langages', page: 73, unverified: true },
  { id: 'c3-hg-histoire', cycle: 3, discipline: 'history-geography', title: 'Histoire, classe de sixième', page: 78, unverified: true },
  { id: 'c3-hg-geographie', cycle: 3, discipline: 'history-geography', title: 'Géographie, classe de sixième', page: 80, unverified: true },
  // Sciences et technologie, découpées en trois disciplines comme au collège (choix C du mainteneur, 5 octobre 2026) :
  // SVT (le vivant, la planète Terre), physique-chimie (matière, mouvement, énergie, signal), technologie (matériaux
  // et objets techniques). Le texte en vigueur en 6e est celui du BO n° 25 du 22 juin 2023, qui a remplacé cette partie
  // du PDF de 2020 ; il n'a pas pu être lu (téléchargement refusé depuis l'environnement de travail, 5 octobre 2026) :
  // libellés et pages sont estimés, à relire avant la première île. Les démarches sont communes au programme : chaque
  // discipline reprend celles qu'elle travaille.
  { id: 'c3-sv-demarches', cycle: 3, discipline: 'life-earth-sciences', title: 'Sciences et technologie : compétences travaillées (SVT)', page: 82, unverified: true },
  { id: 'c3-sv-vivant', cycle: 3, discipline: 'life-earth-sciences', title: 'Le vivant, sa diversité et les fonctions qui le caractérisent', page: 86, unverified: true },
  { id: 'c3-sv-terre', cycle: 3, discipline: 'life-earth-sciences', title: 'La planète Terre. Les êtres vivants dans leur environnement', page: 89, unverified: true },
  { id: 'c3-pc-demarches', cycle: 3, discipline: 'physics-chemistry', title: 'Sciences et technologie : compétences travaillées (physique-chimie)', page: 82, unverified: true },
  { id: 'c3-pc-matiere', cycle: 3, discipline: 'physics-chemistry', title: 'Matière, mouvement, énergie, information', page: 84, unverified: true },
  { id: 'c3-te-demarches', cycle: 3, discipline: 'technology', title: 'Sciences et technologie : compétences travaillées (technologie)', page: 82, unverified: true },
  { id: 'c3-te-objets', cycle: 3, discipline: 'technology', title: 'Matériaux et objets techniques', page: 87, unverified: true },
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

const HG_TEMPS = 'Se repérer dans le temps : construire des repères historiques';
const HG_ESPACE = 'Se repérer dans l’espace : construire des repères géographiques';
const HG_DOC = 'Comprendre un document';
const HG_LANGAGES = 'Pratiquer différents langages en histoire et en géographie';
const HG_RAISONNER = 'Raisonner, justifier une démarche et les choix effectués';
const HG_H1 = 'Thème 1 : la longue histoire de l’humanité et des migrations';
const HG_H2 = 'Thème 2 : récits fondateurs, croyances et citoyenneté dans la Méditerranée antique au Ier millénaire avant J.-C.';
const HG_H3 = 'Thème 3 : l’empire romain dans le monde antique';
const HG_G1 = 'Thème 1 : habiter une métropole';
const HG_G2 = 'Thème 2 : habiter un espace de faible densité';
const HG_G3 = 'Thème 3 : habiter les littoraux';
const HG_G4 = 'Thème 4 : le monde habité';

const ST_DEMARCHE = 'Pratiquer des démarches scientifiques et technologiques';
const ST_OUTILS = 'S’approprier des outils et des méthodes';
const ST_LANGAGES = 'Pratiquer des langages';
const ST_NUMERIQUE = 'Mobiliser des outils numériques';
const ST_RESPONSABLE = 'Adopter un comportement éthique et responsable';
const SV_CLASSER = 'Classer les organismes, exploiter les liens de parenté pour comprendre et expliquer l’évolution des organismes';
const SV_ALIMENTS = 'Expliquer les besoins variables en aliments de l’être humain ; l’origine et les techniques mises en œuvre pour transformer et conserver les aliments';
const SV_DEVELOPPEMENT = 'Décrire comment les êtres vivants se développent et deviennent aptes à se reproduire';
const SV_MATIERE = 'Expliquer l’origine de la matière organique des êtres vivants et son devenir';
const SV_TERRE = 'Situer la Terre dans le système solaire et caractériser les conditions de la vie terrestre';
const SV_ENVIRONNEMENT = 'Identifier des enjeux liés à l’environnement';
const PC_MATIERE = 'Décrire les états et la constitution de la matière à l’échelle macroscopique';
const PC_MOUVEMENT = 'Observer et décrire différents types de mouvements';
const PC_ENERGIE = 'Identifier différentes sources et connaître quelques conversions d’énergie';
const PC_SIGNAL = 'Identifier un signal et une information';
const TE_BESOIN = 'Identifier les principales évolutions du besoin et des objets';
const TE_FONCTIONNEMENT = 'Décrire le fonctionnement d’objets techniques, leurs fonctions et leurs constitutions';
const TE_MATERIAUX = 'Identifier les principales familles de matériaux';
const TE_CONCEVOIR = 'Concevoir et produire tout ou partie d’un objet technique en équipe pour traduire une solution technologique répondant à un besoin';
const TE_INFORMATION = 'Repérer et comprendre la communication et la gestion de l’information';

export const ENTRIES_C3 = [
  // ---------- Français ----------
  { id: 'c3.fr.oral.comprendre-s-exprimer', cycle: 3, discipline: 'french', domaine: 'c3-fr-oral', attendu: 'Écouter pour comprendre un message oral ; parler en prenant en compte son auditoire ; participer à des échanges', competence: 'Langage oral : écouter, dire, débattre, présenter', page: 10 },
  { id: 'c3.fr.lecture.fluidite', cycle: 3, discipline: 'french', domaine: 'c3-fr-lecture', attendu: FR_LIRE, competence: 'Lire avec fluidité : mémoriser la lecture de mots fréquents et irréguliers, automatiser le décodage, respecter les groupes syntaxiques et la ponctuation', page: 15 },
  { id: 'c3.fr.lecture.explicite', cycle: 3, discipline: 'french', domaine: 'c3-fr-lecture', attendu: FR_LIRE, competence: 'Comprendre un texte : repérer les informations explicites, les personnages, les lieux, les actions, les repères temporels', page: 15 },
  { id: 'c3.fr.lecture.implicite', cycle: 3, discipline: 'french', domaine: 'c3-fr-lecture', attendu: FR_LIRE, competence: 'Repérer l’implicite et les liens logiques d’un texte ; justifier son interprétation en s’appuyant sur le texte', page: 15 },
  { id: 'c3.fr.lecture.reprises', cycle: 3, discipline: 'french', domaine: 'c3-fr-lecture', attendu: FR_LIRE, competence: 'Être vigilant aux reprises nominales et pronominales : savoir de qui ou de quoi on parle', page: 16 },
  { id: 'c3.fr.lecture.lexique-contexte', cycle: 3, discipline: 'french', domaine: 'c3-fr-lecture', attendu: FR_LIRE, competence: 'Élucider le sens d’un mot inconnu par le contexte, la morphologie ou le dictionnaire', page: 15 },
  { id: 'c3.fr.lecture.genres', cycle: 3, discipline: 'french', domaine: 'c3-fr-lecture', attendu: FR_LIRE, competence: 'Identifier les principaux genres littéraires (conte, roman, poésie, fable, nouvelle, théâtre) et leurs caractéristiques', page: 15 },
  { id: 'c3.fr.lecture.documents', cycle: 3, discipline: 'french', domaine: 'c3-fr-lecture', attendu: FR_DOCS, competence: 'Comprendre un document composite : mettre en relation texte, image, schéma, tableau ou graphique ; identifier la nature et la source du document', page: 16 },
  { id: 'c3.fr.ecriture.rediger', cycle: 3, discipline: 'french', domaine: 'c3-fr-ecriture', attendu: 'Écrire un texte d’une à deux pages adapté à son destinataire ; après révision, obtenir un texte organisé et cohérent', competence: 'Écriture : rédiger des écrits variés, réviser et améliorer son texte', page: 17 },
  { id: 'c3.fr.langue.phonemes-graphemes', cycle: 3, discipline: 'french', domaine: 'c3-fr-langue', attendu: FR_ORAL_ECRIT, competence: 'Maîtriser l’ensemble des phonèmes du français et des graphèmes associés ; consolider le décodage', page: 21 },
  { id: 'c3.fr.langue.genre-nombre', cycle: 3, discipline: 'french', domaine: 'c3-fr-langue', attendu: FR_ORAL_ECRIT, competence: 'Connaître les marques du genre et du nombre, à l’oral et à l’écrit (noms, déterminants, adjectifs, pronoms, verbes)', page: 21 },
  { id: 'c3.fr.langue.homophonie', cycle: 3, discipline: 'french', domaine: 'c3-fr-langue', attendu: FR_ORAL_ECRIT, competence: 'Prendre conscience des homophones lexicaux et grammaticaux et les distinguer en contexte', page: 22 },
  { id: 'c3.fr.langue.nature-fonction', cycle: 3, discipline: 'french', domaine: 'c3-fr-langue', attendu: FR_PHRASE, competence: 'Comprendre et maîtriser les notions de nature (classe grammaticale) et de fonction', page: 22 },
  { id: 'c3.fr.langue.sujet', cycle: 3, discipline: 'french', domaine: 'c3-fr-langue', attendu: FR_PHRASE, competence: 'Identifier le sujet, y compris composé de plusieurs noms ou inversé', page: 22 },
  { id: 'c3.fr.langue.complements', cycle: 3, discipline: 'french', domaine: 'c3-fr-langue', attendu: FR_PHRASE, competence: 'Différencier les compléments : COD, COI, compléments circonstanciels de temps, de lieu et de cause', page: 22 },
  { id: 'c3.fr.langue.attribut-gn', cycle: 3, discipline: 'french', domaine: 'c3-fr-langue', attendu: FR_PHRASE, competence: 'Identifier l’attribut du sujet ; analyser le groupe nominal : épithète et complément du nom', page: 22 },
  { id: 'c3.fr.langue.classes-de-mots', cycle: 3, discipline: 'french', domaine: 'c3-fr-langue', attendu: FR_PHRASE, competence: 'Différencier les classes de mots : déterminants possessifs et démonstratifs, pronom personnel objet, adverbe, préposition, conjonctions de coordination et de subordination', page: 22 },
  { id: 'c3.fr.langue.types-formes', cycle: 3, discipline: 'french', domaine: 'c3-fr-langue', attendu: FR_PHRASE, competence: 'Connaître les trois types de phrases (déclarative, interrogative, impérative) et les formes négative et exclamative', page: 22 },
  { id: 'c3.fr.langue.phrase-complexe', cycle: 3, discipline: 'french', domaine: 'c3-fr-langue', attendu: FR_PHRASE, competence: 'Différencier phrase simple et phrase complexe ; repérer juxtaposition, coordination et subordination', page: 22 },
  { id: 'c3.fr.langue.accord-gn', cycle: 3, discipline: 'french', domaine: 'c3-fr-langue', attendu: FR_ACCORDS, competence: 'Connaître la notion de groupe nominal et d’accord au sein du groupe nominal (déterminant, nom, adjectif)', page: 23 },
  { id: 'c3.fr.langue.accord-sujet-verbe', cycle: 3, discipline: 'french', domaine: 'c3-fr-langue', attendu: FR_ACCORDS, competence: 'Maîtriser l’accord du verbe avec son sujet, y compris inversé', page: 23 },
  { id: 'c3.fr.langue.attribut-participe-etre', cycle: 3, discipline: 'french', domaine: 'c3-fr-langue', attendu: FR_ACCORDS, competence: 'Maîtriser l’accord de l’attribut avec le sujet et du participe passé avec être (cas les plus usuels)', page: 23 },
  { id: 'c3.fr.langue.reconnaitre-verbe', cycle: 3, discipline: 'french', domaine: 'c3-fr-langue', attendu: FR_ACCORDS, competence: 'Reconnaître le verbe ; connaître les trois groupes ; distinguer temps simples et temps composés ; comprendre la notion de participe passé', page: 23 },
  { id: 'c3.fr.langue.temps-a-memoriser', cycle: 3, discipline: 'french', domaine: 'c3-fr-langue', attendu: FR_ACCORDS, competence: 'Mémoriser le présent, l’imparfait, le futur, le passé simple, le passé composé, le plus-que-parfait, le conditionnel présent et l’impératif présent pour être, avoir, les verbes des 1er et 2e groupes et faire, aller, dire, venir, pouvoir, voir, vouloir, prendre', page: 23 },
  { id: 'c3.fr.langue.finales-en-e', cycle: 3, discipline: 'french', domaine: 'c3-fr-langue', attendu: FR_ACCORDS, competence: 'Distinguer les finales verbales en /E/ (é, er, ez) par la procédure de remplacement', page: 23 },
  { id: 'c3.fr.langue.derivation-composition', cycle: 3, discipline: 'french', domaine: 'c3-fr-langue', attendu: FR_SENS, competence: 'Comprendre la formation des mots complexes par dérivation (préfixe, radical, suffixe) et par composition', page: 24 },
  { id: 'c3.fr.langue.racines', cycle: 3, discipline: 'french', domaine: 'c3-fr-langue', attendu: FR_SENS, competence: 'Connaître le sens des principaux préfixes ; découvrir des racines latines et grecques', page: 24 },
  { id: 'c3.fr.langue.familles-champ-lexical', cycle: 3, discipline: 'french', domaine: 'c3-fr-langue', attendu: FR_SENS, competence: 'Mettre en réseau des mots : familles de mots, champ lexical', page: 24 },
  { id: 'c3.fr.langue.synonymie', cycle: 3, discipline: 'french', domaine: 'c3-fr-langue', attendu: FR_SENS, competence: 'Connaître les notions de synonymie, d’antonymie, d’homonymie et de polysémie', page: 24 },
  { id: 'c3.fr.langue.mots-invariables', cycle: 3, discipline: 'french', domaine: 'c3-fr-langue', attendu: FR_ORTHO_LEX, competence: 'Mémoriser l’orthographe des mots invariables ; utiliser des listes de fréquence pour les mots les plus courants', page: 24 },
  { id: 'c3.fr.langue.regularites-orthographiques', cycle: 3, discipline: 'french', domaine: 'c3-fr-langue', attendu: FR_ORTHO_LEX, competence: 'Mémoriser le lexique appris en s’appuyant sur ses régularités, sa formation et son étymologie', page: 24 },
  { id: 'c3.fr.culture.entrees', cycle: 3, discipline: 'french', domaine: 'c3-fr-culture', attendu: 'Lire des œuvres de littérature de jeunesse et du patrimoine, en classe et en lecture autonome', competence: 'Culture littéraire et artistique : le monstre, les récits d’aventures, les récits de création, résister au plus fort', page: 25 },
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
  { id: 'c3.en.ecouter.consignes', cycle: 3, discipline: 'english', domaine: 'c3-en-ecouter', attendu: EN_ECOUTER, competence: 'Comprendre l’ensemble des consignes utilisées en classe et suivre les instructions données', page: 33 },
  { id: 'c3.en.ecouter.mots-familiers', cycle: 3, discipline: 'english', domaine: 'c3-en-ecouter', attendu: EN_ECOUTER, competence: 'Comprendre des mots familiers et des expressions courantes ; reconstruire le sens à partir d’indices sonores et visuels', page: 33 },
  { id: 'c3.en.ecouter.histoire', cycle: 3, discipline: 'english', domaine: 'c3-en-ecouter', attendu: EN_ECOUTER, competence: 'Suivre le fil d’une histoire simple ; identifier le sujet et l’information essentielle d’un message oral court', page: 33 },
  { id: 'c3.en.lire.mots-isoles', cycle: 3, discipline: 'english', domaine: 'c3-en-lire', attendu: EN_LIRE, competence: 'Reconnaître des mots isolés dans un énoncé ou un texte court ; s’appuyer sur les mots outils et les structures simples', page: 34 },
  { id: 'c3.en.lire.textes-courts', cycle: 3, discipline: 'english', domaine: 'c3-en-lire', attendu: EN_LIRE, competence: 'Comprendre des textes courts et simples (consignes, correspondance, recette, texte informatif, récit) accompagnés d’un visuel ; identifier le type de document', page: 34 },
  { id: 'c3.en.parler.reproduire-presenter', cycle: 3, discipline: 'english', domaine: 'c3-en-parler', attendu: EN_PARLER, competence: 'Reproduire un modèle oral, lire à haute voix un texte bref, se présenter, décrire son environnement, raconter une histoire courte avec des supports visuels', page: 35 },
  { id: 'c3.en.ecrire.dictee', cycle: 3, discipline: 'english', domaine: 'c3-en-ecrire', attendu: EN_ECRIRE, competence: 'Copier des mots isolés et des textes courts ; écrire sous la dictée des expressions connues', page: 36 },
  { id: 'c3.en.ecrire.phrases', cycle: 3, discipline: 'english', domaine: 'c3-en-ecrire', attendu: EN_ECRIRE, competence: 'Renseigner un questionnaire ; produire quelques phrases sur soi, les autres, des objets et des lieux ; rédiger un courrier court d’après un modèle', page: 36 },
  { id: 'c3.en.dialoguer.contact-social', cycle: 3, discipline: 'english', domaine: 'c3-en-dialoguer', attendu: EN_DIALOGUER, competence: 'Établir un contact social : saluer, se présenter, présenter quelqu’un, demander des nouvelles, formules de politesse', page: 37 },
  { id: 'c3.en.dialoguer.renseignements', cycle: 3, discipline: 'english', domaine: 'c3-en-dialoguer', attendu: EN_DIALOGUER, competence: 'Dialoguer pour échanger ou obtenir des renseignements (itinéraire, horaire, prix) et sur des sujets familiers (école, loisirs, maison)', page: 37 },
  { id: 'c3.en.dialoguer.reagir', cycle: 3, discipline: 'english', domaine: 'c3-en-dialoguer', attendu: EN_DIALOGUER, competence: 'Réagir à des propositions (remercier, féliciter, s’excuser, accepter, refuser) ; répondre à des questions simples et en poser', page: 37 },
  { id: 'c3.en.culture.vie-quotidienne', cycle: 3, discipline: 'english', domaine: 'c3-en-culture', attendu: EN_CULTURE, competence: 'Lexique de la personne et de la vie quotidienne : le corps, les vêtements, le portrait, l’habitat, l’environnement, les besoins quotidiens', page: 39 },
  { id: 'c3.en.culture.reperes', cycle: 3, discipline: 'english', domaine: 'c3-en-culture', attendu: EN_CULTURE, competence: 'Repères géographiques, historiques et culturels des pays dont on étudie la langue ; quelques figures et grandes pages d’histoire', page: 39 },
  { id: 'c3.en.culture.imaginaire', cycle: 3, discipline: 'english', domaine: 'c3-en-culture', attendu: EN_CULTURE, competence: 'L’imaginaire : littérature de jeunesse, contes et légendes, héros et personnages de fiction', page: 39 },
  { id: 'c3.en.langue.groupe-verbal', cycle: 3, discipline: 'english', domaine: 'c3-en-langue', attendu: EN_GRAMMAIRE, competence: 'Le verbe et son accord avec le sujet ; l’expression du présent, du passé et du futur ; les auxiliaires', page: 39 },
  { id: 'c3.en.langue.groupe-nominal', cycle: 3, discipline: 'english', domaine: 'c3-en-langue', attendu: EN_GRAMMAIRE, competence: 'Nom et pronom, genre et nombre, articles, possessifs, démonstratifs, quantifieurs, prépositions, place et accord de l’adjectif, génitif', page: 39 },
  { id: 'c3.en.langue.phrase', cycle: 3, discipline: 'english', domaine: 'c3-en-langue', attendu: EN_GRAMMAIRE, competence: 'Types et formes de phrase (déclarative, interrogative, exclamative, impérative, négative) ; ordre des mots ; mots de liaison ; quelques subordonnants', page: 39 },
  { id: 'c3.en.langue.phonologie', cycle: 3, discipline: 'english', domaine: 'c3-en-langue', attendu: EN_PHONO, competence: 'Percevoir et reproduire les phonèmes spécifiques, l’accent tonique, le rythme et les schémas intonatifs', page: 40 },
  { id: 'c3.en.langue.phonie-graphie', cycle: 3, discipline: 'english', domaine: 'c3-en-langue', attendu: EN_PHONO, competence: 'Lien phonie-graphie : percevoir la relation entre graphèmes et phonèmes spécifiques à la langue ; l’alphabet', page: 40 },
  // ---------- Histoire et géographie (6e ; pages à vérifier) ----------
  { id: 'c3.hg.temps.periodes', cycle: 3, discipline: 'history-geography', domaine: 'c3-hg-temps', attendu: HG_TEMPS, competence: 'Situer chronologiquement les grandes périodes historiques ; mémoriser les repères historiques du programme', page: 73, unverified: true },
  { id: 'c3.hg.temps.ordonner', cycle: 3, discipline: 'history-geography', domaine: 'c3-hg-temps', attendu: HG_TEMPS, competence: 'Ordonner des faits les uns par rapport aux autres et les situer dans une époque ou une période donnée', page: 73, unverified: true },
  { id: 'c3.hg.temps.frise', cycle: 3, discipline: 'history-geography', domaine: 'c3-hg-temps', attendu: HG_TEMPS, competence: 'Utiliser des documents qui représentent le temps, dont les frises chronologiques, et le lexique du découpage du temps (siècle, millénaire, avant et après J.-C.)', page: 73, unverified: true },
  { id: 'c3.hg.espace.localiser', cycle: 3, discipline: 'history-geography', domaine: 'c3-hg-espace', attendu: HG_ESPACE, competence: 'Nommer et localiser les grands repères géographiques ; mémoriser les repères géographiques du programme', page: 73, unverified: true },
  { id: 'c3.hg.espace.situer', cycle: 3, discipline: 'history-geography', domaine: 'c3-hg-espace', attendu: HG_ESPACE, competence: 'Nommer, localiser et caractériser un lieu ; situer des lieux et des espaces les uns par rapport aux autres ; la notion d’échelle', page: 73, unverified: true },
  { id: 'c3.hg.demarches.document', cycle: 3, discipline: 'history-geography', domaine: 'c3-hg-demarches', attendu: HG_DOC, competence: 'Comprendre le sens général d’un document ; l’identifier (nature, auteur, date) ; extraire des informations pertinentes pour répondre à une question', page: 74, unverified: true },
  { id: 'c3.hg.demarches.point-de-vue', cycle: 3, discipline: 'history-geography', domaine: 'c3-hg-demarches', attendu: HG_DOC, competence: 'Savoir que le document exprime un point de vue ; identifier et questionner son sens implicite', page: 74, unverified: true },
  { id: 'c3.hg.demarches.lexique', cycle: 3, discipline: 'history-geography', domaine: 'c3-hg-demarches', attendu: HG_LANGAGES, competence: 'S’approprier et utiliser un lexique historique et géographique approprié', page: 74, unverified: true },
  { id: 'c3.hg.demarches.cartes', cycle: 3, discipline: 'history-geography', domaine: 'c3-hg-demarches', attendu: HG_LANGAGES, competence: 'Utiliser des cartes à différentes échelles, des photographies de paysages ou de lieux ; réaliser ou compléter des productions graphiques', page: 74, unverified: true },
  { id: 'c3.hg.demarches.ecrire-dire', cycle: 3, discipline: 'history-geography', domaine: 'c3-hg-demarches', attendu: HG_LANGAGES, competence: 'Écrire pour structurer sa pensée et son savoir ; reconnaître un récit historique ; s’exprimer à l’oral pour raconter, décrire, expliquer', page: 74, unverified: true },
  { id: 'c3.hg.demarches.raisonner', cycle: 3, discipline: 'history-geography', domaine: 'c3-hg-demarches', attendu: HG_RAISONNER, competence: 'Poser et se poser des questions ; formuler des hypothèses ; vérifier ; justifier ; s’informer dans le monde du numérique ; coopérer et mutualiser', page: 73, unverified: true },
  { id: 'c3.hg.histoire.debuts-humanite', cycle: 3, discipline: 'history-geography', domaine: 'c3-hg-histoire', attendu: HG_H1, competence: 'Les débuts de l’humanité : premiers humains, peuplement de la Terre, grandes migrations', page: 78, unverified: true },
  { id: 'c3.hg.histoire.neolithique', cycle: 3, discipline: 'history-geography', domaine: 'c3-hg-histoire', attendu: HG_H1, competence: 'La « révolution » néolithique : agriculture, élevage, sédentarisation', page: 78, unverified: true },
  { id: 'c3.hg.histoire.premiers-etats', cycle: 3, discipline: 'history-geography', domaine: 'c3-hg-histoire', attendu: HG_H1, competence: 'Premiers États, premières écritures', page: 78, unverified: true },
  { id: 'c3.hg.histoire.cites-grecques', cycle: 3, discipline: 'history-geography', domaine: 'c3-hg-histoire', attendu: HG_H2, competence: 'Le monde des cités grecques : cités, mythes, panthéon, Jeux ; la citoyenneté à Athènes', page: 78, unverified: true },
  { id: 'c3.hg.histoire.rome-mythe', cycle: 3, discipline: 'history-geography', domaine: 'c3-hg-histoire', attendu: HG_H2, competence: 'Rome du mythe à l’histoire : la fondation légendaire, la République, la citoyenneté romaine', page: 79, unverified: true },
  { id: 'c3.hg.histoire.monotheisme-juif', cycle: 3, discipline: 'history-geography', domaine: 'c3-hg-histoire', attendu: HG_H2, competence: 'La naissance du monothéisme juif dans un monde polythéiste', page: 79, unverified: true },
  { id: 'c3.hg.histoire.empire-romain', cycle: 3, discipline: 'history-geography', domaine: 'c3-hg-histoire', attendu: HG_H3, competence: 'Conquêtes, paix romaine et romanisation', page: 79, unverified: true },
  { id: 'c3.hg.histoire.chretiens', cycle: 3, discipline: 'history-geography', domaine: 'c3-hg-histoire', attendu: HG_H3, competence: 'Des chrétiens dans l’empire', page: 79, unverified: true },
  { id: 'c3.hg.histoire.route-de-la-soie', cycle: 3, discipline: 'history-geography', domaine: 'c3-hg-histoire', attendu: HG_H3, competence: 'Les relations de l’empire romain avec les autres mondes anciens : l’ancienne route de la soie et la Chine des Han', page: 79, unverified: true },
  { id: 'c3.hg.geographie.metropoles', cycle: 3, discipline: 'history-geography', domaine: 'c3-hg-geographie', attendu: HG_G1, competence: 'Les métropoles et leurs habitants', page: 80, unverified: true },
  { id: 'c3.hg.geographie.ville-de-demain', cycle: 3, discipline: 'history-geography', domaine: 'c3-hg-geographie', attendu: HG_G1, competence: 'La ville de demain', page: 80, unverified: true },
  { id: 'c3.hg.geographie.contraintes', cycle: 3, discipline: 'history-geography', domaine: 'c3-hg-geographie', attendu: HG_G2, competence: 'Habiter un espace à fortes contraintes naturelles ou de grande biodiversité', page: 80, unverified: true },
  { id: 'c3.hg.geographie.agricole', cycle: 3, discipline: 'history-geography', domaine: 'c3-hg-geographie', attendu: HG_G2, competence: 'Habiter un espace de faible densité à vocation agricole', page: 80, unverified: true },
  { id: 'c3.hg.geographie.littoral-portuaire', cycle: 3, discipline: 'history-geography', domaine: 'c3-hg-geographie', attendu: HG_G3, competence: 'Un littoral industrialo-portuaire', page: 81, unverified: true },
  { id: 'c3.hg.geographie.littoral-touristique', cycle: 3, discipline: 'history-geography', domaine: 'c3-hg-geographie', attendu: HG_G3, competence: 'Un littoral touristique', page: 81, unverified: true },
  { id: 'c3.hg.geographie.population-mondiale', cycle: 3, discipline: 'history-geography', domaine: 'c3-hg-geographie', attendu: HG_G4, competence: 'La répartition de la population mondiale et ses dynamiques', page: 81, unverified: true },
  { id: 'c3.hg.geographie.occupation', cycle: 3, discipline: 'history-geography', domaine: 'c3-hg-geographie', attendu: HG_G4, competence: 'La variété des formes d’occupation spatiale dans le monde', page: 81, unverified: true },
  // ---------- SVT (sciences et technologie, 6e ; libellés et pages à vérifier) ----------
  { id: 'c3.sv.demarches.observer', cycle: 3, discipline: 'life-earth-sciences', domaine: 'c3-sv-demarches', attendu: ST_DEMARCHE, competence: 'Formuler une question ou une hypothèse, observer, interpréter un résultat et en tirer une conclusion', page: 82, unverified: true },
  { id: 'c3.sv.demarches.langages', cycle: 3, discipline: 'life-earth-sciences', domaine: 'c3-sv-demarches', attendu: ST_LANGAGES, competence: 'Lire et compléter un schéma, un tableau, un graphique ; utiliser un vocabulaire scientifique précis', page: 83, unverified: true },
  { id: 'c3.sv.demarches.responsable', cycle: 3, discipline: 'life-earth-sciences', domaine: 'c3-sv-demarches', attendu: ST_RESPONSABLE, competence: 'Relier des connaissances acquises à des questions de santé, de sécurité et d’environnement', page: 83, unverified: true },
  { id: 'c3.sv.vivant.classer', cycle: 3, discipline: 'life-earth-sciences', domaine: 'c3-sv-vivant', attendu: SV_CLASSER, competence: 'Classer les organismes selon les attributs qu’ils partagent (groupes emboîtés)', page: 86, unverified: true },
  { id: 'c3.sv.vivant.evolution', cycle: 3, discipline: 'life-earth-sciences', domaine: 'c3-sv-vivant', attendu: SV_CLASSER, competence: 'La biodiversité change au cours du temps : fossiles, espèces apparues et disparues, liens de parenté', page: 86, unverified: true },
  { id: 'c3.sv.vivant.alimentation', cycle: 3, discipline: 'life-earth-sciences', domaine: 'c3-sv-vivant', attendu: SV_ALIMENTS, competence: 'Les aliments, leurs groupes et les besoins de l’organisme ; transformer et conserver les aliments, le rôle des micro-organismes', page: 86, unverified: true },
  { id: 'c3.sv.vivant.developpement', cycle: 3, discipline: 'life-earth-sciences', domaine: 'c3-sv-vivant', attendu: SV_DEVELOPPEMENT, competence: 'Les stades du développement d’un être vivant ; la reproduction sexuée ; les changements de la puberté', page: 87, unverified: true },
  { id: 'c3.sv.vivant.matiere-organique', cycle: 3, discipline: 'life-earth-sciences', domaine: 'c3-sv-vivant', attendu: SV_MATIERE, competence: 'Les besoins des plantes vertes ; les chaînes alimentaires ; le rôle des décomposeurs', page: 87, unverified: true },
  { id: 'c3.sv.terre.systeme-solaire', cycle: 3, discipline: 'life-earth-sciences', domaine: 'c3-sv-terre', attendu: SV_TERRE, competence: 'La Terre dans le système solaire ; ses mouvements : la journée, les saisons', page: 89, unverified: true },
  { id: 'c3.sv.terre.phenomenes', cycle: 3, discipline: 'life-earth-sciences', domaine: 'c3-sv-terre', attendu: SV_TERRE, competence: 'Les phénomènes géologiques (séismes, volcans) et la météorologie et le climat', page: 89, unverified: true },
  { id: 'c3.sv.terre.peuplement', cycle: 3, discipline: 'life-earth-sciences', domaine: 'c3-sv-terre', attendu: SV_ENVIRONNEMENT, competence: 'La répartition des êtres vivants et le peuplement des milieux ; leurs interactions', page: 90, unverified: true },
  { id: 'c3.sv.terre.environnement', cycle: 3, discipline: 'life-earth-sciences', domaine: 'c3-sv-terre', attendu: SV_ENVIRONNEMENT, competence: 'L’impact des activités humaines sur l’environnement ; les ressources et les gestes responsables', page: 90, unverified: true },
  // ---------- Physique-chimie (sciences et technologie, 6e ; libellés et pages à vérifier) ----------
  { id: 'c3.pc.demarches.experimenter', cycle: 3, discipline: 'physics-chemistry', domaine: 'c3-pc-demarches', attendu: ST_DEMARCHE, competence: 'Proposer une expérience pour tester une hypothèse, l’interpréter et conclure', page: 82, unverified: true },
  { id: 'c3.pc.demarches.mesurer', cycle: 3, discipline: 'physics-chemistry', domaine: 'c3-pc-demarches', attendu: ST_OUTILS, competence: 'Utiliser un instrument de mesure, lire une graduation, choisir l’unité qui convient', page: 82, unverified: true },
  { id: 'c3.pc.demarches.langages', cycle: 3, discipline: 'physics-chemistry', domaine: 'c3-pc-demarches', attendu: ST_LANGAGES, competence: 'Lire et compléter un tableau de mesures, un graphique, un schéma légendé', page: 83, unverified: true },
  { id: 'c3.pc.matiere.etats', cycle: 3, discipline: 'physics-chemistry', domaine: 'c3-pc-matiere', attendu: PC_MATIERE, competence: 'Les états de la matière (solide, liquide, gaz) et les changements d’état', page: 84, unverified: true },
  { id: 'c3.pc.matiere.grandeurs', cycle: 3, discipline: 'physics-chemistry', domaine: 'c3-pc-matiere', attendu: PC_MATIERE, competence: 'Caractériser la matière par des grandeurs : masse, volume, température ; la masse se conserve', page: 84, unverified: true },
  { id: 'c3.pc.matiere.melanges', cycle: 3, discipline: 'physics-chemistry', domaine: 'c3-pc-matiere', attendu: PC_MATIERE, competence: 'Mélanges et solutions ; séparer les constituants (décantation, filtration, évaporation)', page: 84, unverified: true },
  { id: 'c3.pc.matiere.mouvements', cycle: 3, discipline: 'physics-chemistry', domaine: 'c3-pc-matiere', attendu: PC_MOUVEMENT, competence: 'Décrire un mouvement : sa trajectoire, sa vitesse (constante, qui augmente, qui diminue)', page: 85, unverified: true },
  { id: 'c3.pc.matiere.energie', cycle: 3, discipline: 'physics-chemistry', domaine: 'c3-pc-matiere', attendu: PC_ENERGIE, competence: 'Les sources d’énergie, renouvelables ou non ; quelques conversions d’énergie', page: 85, unverified: true },
  { id: 'c3.pc.matiere.circuit', cycle: 3, discipline: 'physics-chemistry', domaine: 'c3-pc-matiere', attendu: PC_ENERGIE, competence: 'Le circuit électrique simple ; conducteurs et isolants ; les règles de sécurité', page: 85, unverified: true },
  { id: 'c3.pc.matiere.signal', cycle: 3, discipline: 'physics-chemistry', domaine: 'c3-pc-matiere', attendu: PC_SIGNAL, competence: 'Un signal lumineux, sonore ou électrique transporte une information', page: 85, unverified: true },
  // ---------- Technologie (sciences et technologie, 6e ; libellés et pages à vérifier) ----------
  { id: 'c3.te.demarches.concevoir', cycle: 3, discipline: 'technology', domaine: 'c3-te-demarches', attendu: ST_DEMARCHE, competence: 'Concevoir, réaliser et tester un objet en équipe, en suivant un cahier des charges', page: 82, unverified: true },
  { id: 'c3.te.demarches.representer', cycle: 3, discipline: 'technology', domaine: 'c3-te-demarches', attendu: ST_LANGAGES, competence: 'Lire et compléter un croquis, un schéma, un dessin technique', page: 83, unverified: true },
  { id: 'c3.te.demarches.numerique', cycle: 3, discipline: 'technology', domaine: 'c3-te-demarches', attendu: ST_NUMERIQUE, competence: 'Utiliser des outils numériques pour chercher, organiser et présenter des informations', page: 83, unverified: true },
  { id: 'c3.te.objets.evolution', cycle: 3, discipline: 'technology', domaine: 'c3-te-objets', attendu: TE_BESOIN, competence: 'L’évolution des objets dans le temps, selon les besoins, les techniques et les matériaux', page: 87, unverified: true },
  { id: 'c3.te.objets.fonction', cycle: 3, discipline: 'technology', domaine: 'c3-te-objets', attendu: TE_FONCTIONNEMENT, competence: 'Le besoin, la fonction d’usage d’un objet ; ses éléments et ce qu’ils font', page: 87, unverified: true },
  { id: 'c3.te.objets.fonctionnement', cycle: 3, discipline: 'technology', domaine: 'c3-te-objets', attendu: TE_FONCTIONNEMENT, competence: 'Le fonctionnement d’un objet : l’énergie qui le fait marcher, les mouvements qu’il transmet', page: 87, unverified: true },
  { id: 'c3.te.objets.materiaux', cycle: 3, discipline: 'technology', domaine: 'c3-te-objets', attendu: TE_MATERIAUX, competence: 'Les familles de matériaux (métaux, bois, plastiques, verre, céramiques) et leurs propriétés', page: 88, unverified: true },
  { id: 'c3.te.objets.recyclage', cycle: 3, discipline: 'technology', domaine: 'c3-te-objets', attendu: TE_MATERIAUX, competence: 'L’impact environnemental d’un matériau : origine, recyclage, valorisation', page: 88, unverified: true },
  { id: 'c3.te.objets.realiser', cycle: 3, discipline: 'technology', domaine: 'c3-te-objets', attendu: TE_CONCEVOIR, competence: 'Réaliser tout ou partie d’un objet technique : choisir, découper, assembler, tester', page: 88, unverified: true },
  { id: 'c3.te.objets.information', cycle: 3, discipline: 'technology', domaine: 'c3-te-objets', attendu: TE_INFORMATION, competence: 'Les objets qui communiquent ; stocker et transmettre l’information ; les réseaux', page: 88, unverified: true },
] as const satisfies readonly ProgrammeEntry[];
