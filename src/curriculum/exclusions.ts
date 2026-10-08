// Les compétences du programme qu'aucune mission ne travaille, avec le motif. Deux natures :
// - « hors-perimetre » : durablement hors de ce que peut faire une application sans micro ni interlocuteur ;
// - « a-couvrir » : la dette de contenu, visible sur la page Programmes officiels ; une pull request qui couvre la
//   compétence retire son exclusion (le test de couverture l'exige).
import type { ProgrammeId } from './index';
import type { Exclusion } from './types';

const HORS = (motif: string): Exclusion => ({ kind: 'hors-perimetre', motif });
const A_COUVRIR = (motif: string): Exclusion => ({ kind: 'a-couvrir', motif });

const ORAL = 'Production orale : hors de ce que peut faire une application sans micro ni interlocuteur.';
const ECRITURE_LIBRE = 'Production écrite libre : l’application propose des réponses à choisir, pas de rédaction.';

// LV2 (allemand, espagnol) : les trois îles sont faites (docs/conception/cadrage-contenu.md, « LV2 ») : le Relais des
// voyageurs (5e, LV2-2 et LV2-3), le Jardin des heures (4e, LV2-4) et le Refuge des carnets (3e, LV2-5). Le passif
// (`langue.modaux-passif`) reste hors du niveau A2 visé : un manque sans exclusion, les modaux sont faits.
const RECIT_ENTENDU = A_COUVRIR(
  'Suivre un récit à l’oral : il faut un écran où le récit s’entend d’abord, puis s’affiche (question écrite, lexique affiché), à cadrer avec le référent dys et l’expert frontend, le même pour l’anglais, l’allemand et l’espagnol. Au Refuge des carnets, le récit s’affiche dès l’ouverture : il se lit, l’écoute n’y est qu’un soutien.',
);
const LV2_LANGAGES = A_COUVRIR(
  'Médias, chansons et cinéma : rien ne s’emprunte ; il faudrait des documents inventés (programme de télévision, affiche de concert, message sur un réseau), comme ceux de c4.en.culture.langages en anglais (Studio des ondes, School and media).',
);

// Sciences et technologie : les trois îles de 6e (la Vallée du vivant, le Laboratoire des éléments, le Hangar des
// inventions, SC-2) couvrent le cycle 3 en vigueur (BO n° 25 du 22 juin 2023), sauf fabriquer et ce que la relecture du
// 7 octobre 2026 a ajouté au référentiel. Les neuf îles de 5e, 4e et 3e (SC-3) couvrent le cycle 4, sauf manipuler,
// fabriquer un prototype et programmer un objet réel (docs/conception/cadrage-contenu.md, « Sciences »).
const FABRIQUER = HORS('Fabriquer, mesurer pour de vrai, travailler en équipe : le travail de la classe, que l’application ne remplace pas.');

// Programmes 2025-2026 (docs/conception/cadrage-contenu.md, « Programmes 2025-2026 ») : la 5e suit les textes de 2026
// (français, maths) et de 2025 (langues vivantes) ; les compétences de 2020 ne valent plus qu'en 4e et en 3e. Celles que
// travaillaient les îles de 5e y restent à couvrir, jusqu'à ce que le nouveau texte entre en vigueur en 4e.
const QUITTE_LA_5E = (en5e: string) =>
  A_COUVRIR(`Travaillée en 5e sur le texte en vigueur (${en5e}) ; en 4e et en 3e, aucune quête ne la reprend encore : à revoir quand le nouveau texte entrera en vigueur en 4e.`);
const FIGURE = A_COUVRIR('Géométrie de 5e : il faut des figures dessinées (angles, triangles, parallélogrammes, symétrie), que les écrans d’exercice n’ont pas encore.');
const ORAL_ECRIT_LIBRE = HORS('Production orale et écrite libre : hors de ce que peut faire une application sans micro ni rédaction.');
const AXES_LV2 = (axe6: string) =>
  A_COUVRIR(`Repères culturels de 5e (cinq axes, dont l’axe 6 : ${axe6}) : le Relais des voyageurs travaille la langue, pas encore ces repères ; il faudrait des documents inventés, rien ne s’emprunte.`);
// Enseignement moral et civique (docs/conception/cadrage-contenu.md, « EMC ») : le référentiel est écrit (EMC-1) ; la
// forme dans le jeu : une île par classe (EMC-2).
const EMC = A_COUVRIR('Enseignement moral et civique : une île par classe (choix du mainteneur, 8 octobre 2026), à construire.');
// Latin et grec ancien, option LCA (docs/conception/cadrage-contenu.md, « LCA ») : le référentiel est écrit (LCA-1) ; la
// forme dans le jeu : une île par classe de la 5e à la 3e, ouverte selon le réglage de l'option, comme la LV2.
const LCA = A_COUVRIR('Latin et grec (option LCA) : une île par classe de la 5e à la 3e, ouverte selon le réglage Latin, Grec ou Pas d’option, comme la LV2 (choix du mainteneur, 8 octobre 2026), à construire.');
const LCA_PRONONCER = A_COUVRIR('Prononciation et alphabet : à travailler sur l’écrit (lettres, règles de lecture, syllabes), dans une île LCA à construire ; une voix sûre pour le latin et le grec sur la tablette reste à vérifier.');
const LCA_LIRE_ORAL = HORS('Lire à voix haute un texte latin ou grec : il faudrait un micro et une écoute de l’élève ; la prononciation se travaille à part, sur l’écrit.');
const LCA_TRADUIRE = HORS('Traduire soi-même et justifier ses choix : de la rédaction, hors de ce que fait un écran à choix ; l’application fait reconnaître le sens d’un mot, d’une forme ou d’une phrase (indices, langue).');
const LCA_COMMENTER = HORS('Interpréter, commenter, comparer des traductions : un travail d’écriture et de débat en classe, hors d’une application d’entraînement.');
const MANIPULER = HORS('Manipuler, mesurer, observer pour de vrai (montage, microscope, terrain) : le travail de la classe, que l’application ne remplace pas.');

export const EXCLUSIONS: Partial<Record<ProgrammeId, Exclusion>> = {
  // ---------- Cycle 3, français ----------
  'c3.fr.oral.comprendre-s-exprimer': HORS(ORAL),
  'c3.fr.ecriture.rediger': HORS(ECRITURE_LIBRE),
  'c3.fr.culture.entrees': HORS('Lecture d’œuvres complètes en classe : la mission Lecture du portail en propose des extraits du domaine public, pas le parcours des entrées.'),
  'c3.fr.lecture.documents': A_COUVRIR('Le document composite (texte et tableau, nature et source) est travaillé en 3e à l’Observatoire des textes (Inférences, niveau 3), pas encore en 6e : prévu avec une mission de données de l’île Grandeurs.'),
  'c3.fr.lecture.voix-haute': HORS(ORAL),
  'c3.fr.ecriture.copier': HORS('Copier à la main, de façon lisible et soignée : le geste d’écriture reste à la classe.'),
  'c3.fr.langue.participe-passe-avoir': A_COUVRIR('Accord du participe passé avec avoir (COD placé avant) : aucune quête de 6e ne le fait encore.'),
  'c3.fr.langue.valeurs-des-temps': A_COUVRIR('Valeurs des temps (discours et récit) : la conjugaison de 6e travaille les formes, pas encore les valeurs.'),
  // ---------- Cycle 3, maths ----------
  'c3.ma.donnees.donnees': A_COUVRIR('Lecture de tableaux et de diagrammes : prévue dans une mission de données de l’île Grandeurs.'),
  'c3.ma.grandeurs.aire': A_COUVRIR('Aires : prévues dans l’île Grandeurs (Clôtures).'),
  'c3.ma.grandeurs.volume': A_COUVRIR('Volumes et contenances : prévus dans l’île Grandeurs.'),
  'c3.ma.espace.angles': A_COUVRIR('Angles : prévus dans l’île Grandeurs (Clôtures).'),
  'c3.ma.grandeurs.unites-conversions': A_COUVRIR('Conversions d’unités : prévues dans l’île Grandeurs (Balances).'),
  'c3.ma.espace.figures-solides': A_COUVRIR('Reconnaître et nommer figures et solides : pas encore de figure dessinée pour cela.'),
  'c3.ma.espace.construction': HORS('Géométrie de construction : demande règle, équerre et compas.'),
  'c3.ma.espace.relations': A_COUVRIR('Perpendicularité, parallélisme, symétrie axiale : pas encore de figure dessinée pour cela.'),
  'c3.ma.nombres.arrondi': A_COUVRIR('Arrondir un décimal à l’unité, au dixième, au centième : aucune quête de 6e ne le fait encore.'),
  'c3.ma.nombres.produit-decimaux': A_COUVRIR('Multiplier deux décimaux et contrôler par un ordre de grandeur : aucune quête de 6e ne le fait encore.'),
  'c3.ma.nombres.fractions-operations': A_COUVRIR('Additionner et soustraire des fractions, multiplier une fraction par un entier : aucune quête de 6e ne le fait encore.'),
  'c3.ma.nombres.algebre': A_COUVRIR('Schémas en barre et motifs évolutifs : il faut une aide visuelle de plus (le schéma en barre), à cadrer.'),
  'c3.ma.espace.triangles': A_COUVRIR('Triangles particuliers et somme des angles : pas encore de figure dessinée pour cela.'),
  'c3.ma.espace.vision-espace': A_COUVRIR('Assemblages de cubes vus sous plusieurs angles : pas encore de figure dessinée pour cela.'),
  'c3.ma.donnees.probabilites': A_COUVRIR('Probabilités en situation d’équiprobabilité : aucune quête de 6e ne les travaille encore.'),
  'c3.ma.informatique.programmation': HORS('Programmer un déplacement ou une construction : demande un éditeur de programme, hors du périmètre de l’application.'),
  // ---------- Cycle 3, anglais ----------
  'c3.en.parler.reproduire-presenter': HORS(ORAL),
  'c3.en.ecrire.phrases': HORS(ECRITURE_LIBRE),
  'c3.en.culture.personnes': A_COUVRIR('Personnes et personnages du monde anglophone : aucune quête de 6e ne les présente encore ; il faudrait des portraits inventés ou du domaine public.'),
  'c3.en.culture.arts': A_COUVRIR('Œuvres et sentiments : l’application n’affiche pas d’œuvres (rien d’emprunté) ; dire ce qu’on ressent devant une image inventée reste à cadrer.'),
  'c3.en.langue.groupe-nominal': A_COUVRIR('Articles, démonstratifs, possessifs, pluriels irréguliers : la grammaire de 6e travaille be, have et le présent simple, pas encore le groupe nominal.'),
  // ---------- Cycle 4, français ----------
  'c4.fr.oral.comprendre-s-exprimer': HORS(ORAL),
  'c4.fr.lecture.image': HORS('Analyse d’image : l’application n’affiche pas d’œuvres ni de photographies (rien d’emprunté).'),
  'c4.fr.lecture.genres-epoques': A_COUVRIR('Situer une œuvre dans son époque : la mission Lecture identifie les genres, pas les contextes.'),
  'c4.fr.ecriture.rediger': HORS(ECRITURE_LIBRE),
  'c4.fr.culture.entrees': HORS('Lecture d’œuvres complètes en classe : hors de ce qu’une application d’entraînement propose.'),
  'c4.fr.langue.ponctuation': A_COUVRIR('Rôle de la ponctuation : aucune mission ne l’aborde.'),
  'c4.fr.langue.valeurs-des-temps': QUITTE_LA_5E('c4.fr.5e.grammaire.temps-modes'),
  // 5e (texte de 2026)
  'c4.fr.5e.lecture.comprendre': A_COUVRIR('Comprendre un texte en 5e : la lecture du portail et l’île de lecture de 6e le font ; aucune quête de 5e encore.'),
  'c4.fr.5e.lecture.voix-haute': HORS(ORAL),
  'c4.fr.5e.lecture.oeuvre': HORS('Lecture d’œuvres complètes en classe : hors de ce qu’une application d’entraînement propose.'),
  'c4.fr.5e.lecture.reperes': A_COUVRIR('Repères dans l’histoire littéraire : aucune quête de 5e ne les aborde.'),
  'c4.fr.5e.culture.entrees': HORS('Lecture d’œuvres complètes en classe : hors de ce qu’une application d’entraînement propose.'),
  'c4.fr.5e.ecriture.rediger': HORS(ECRITURE_LIBRE),
  'c4.fr.5e.oral.communiquer': HORS(ORAL),
  'c4.fr.5e.vocabulaire.sens': A_COUVRIR('Le sens d’un mot en 5e : l’île de vocabulaire est en 4e ; aucune quête de 5e encore.'),
  'c4.fr.5e.vocabulaire.relations': A_COUVRIR('Relations de sens et de forme entre les mots : aucune quête de 5e encore.'),
  'c4.fr.5e.vocabulaire.reemploi': A_COUVRIR('Registres de langue, variations de sens : aucune quête de 5e encore.'),
  'c4.fr.5e.vocabulaire.formation': A_COUVRIR('Préfixes, suffixes, étymologie : aucune quête de 5e encore (la 6e les travaille, Familles-craft).'),
  'c4.fr.5e.grammaire.phrase': A_COUVRIR('Ponctuation, types et formes de phrases, juxtaposition et coordination : aucune quête de 5e encore.'),
  'c4.fr.5e.grammaire.constituants': A_COUVRIR('Sujet, COD, COI, attribut, compléments circonstanciels : aucune quête de 5e encore.'),
  'c4.fr.5e.grammaire.oral-ecrit': A_COUVRIR('Grammaire de l’oral et de l’écrit, registres : aucune quête de 5e encore.'),
  'c4.fr.5e.grammaire.paroles-rapportees': A_COUVRIR('Discours direct et indirect : aucune quête de 5e encore.'),
  // ---------- Cycle 4, maths ----------
  'c4.ma.c.aires-volumes': A_COUVRIR('Aires et volumes du cycle 4 : pas encore de figure dessinée pour cela.'),
  'c4.ma.c.agrandissement': A_COUVRIR('Effet d’un agrandissement sur les aires et les volumes : aucune mission ne l’aborde.'),
  'c4.ma.d.solides': HORS('Représentations de solides (perspective, sections, patrons) : demandent des figures que l’application ne dessine pas.'),
  'c4.ma.d.angles-triangles': A_COUVRIR('Somme des angles, inégalité triangulaire : pas encore de figure dessinée pour cela.'),
  'c4.ma.d.triangles-parallelogramme': A_COUVRIR('Triangles semblables et parallélogramme : pas encore de figure dessinée pour cela.'),
  'c4.ma.d.transformations': A_COUVRIR('Translation, rotation, symétrie centrale, homothétie : pas encore de figure dessinée pour cela.'),
  'c4.ma.e.programmation': HORS('Algorithmique et programmation : hors du périmètre de l’application.'),
  'c4.ma.a.relatifs': QUITTE_LA_5E('c4.ma.5e.nombres.relatifs'),
  'c4.ma.a.fractions': QUITTE_LA_5E('c4.ma.5e.nombres.fractions'),
  'c4.ma.b.proportionnalite': QUITTE_LA_5E('c4.ma.5e.proportionnalite.proportionnalite'),
  'c4.ma.b.pourcentages-echelles': QUITTE_LA_5E('c4.ma.5e.proportionnalite.pourcentages'),
  'c4.ma.c.grandeurs-composees': QUITTE_LA_5E('la vitesse moyenne, c4.ma.5e.proportionnalite.proportionnalite'),
  'c4.ma.c.conversions': A_COUVRIR('Conversions d’unités au cycle 4 : aucune quête ne les travaille encore, ni en 5e (c4.ma.5e.geometrie.conversions) ni en 4e et en 3e.'),
  'c4.ma.d.reperage': QUITTE_LA_5E('c4.ma.5e.geometrie.reperage'),
  // 5e (texte de 2026)
  'c4.ma.5e.nombres.operations': A_COUVRIR('Priorités opératoires, enchaîner des opérations, diviser par un décimal : aucune quête de 5e encore.'),
  'c4.ma.5e.nombres.puissances': A_COUVRIR('Carrés et cubes : l’île des puissances est en 4e ; aucune quête de 5e encore.'),
  'c4.ma.5e.nombres.calcul-litteral': A_COUVRIR('Formules, substitution, développer et réduire : l’île du calcul littéral est en 4e ; aucune quête de 5e encore.'),
  'c4.ma.5e.nombres.equations': A_COUVRIR('Équations ax = c et x + b = c : l’île des équations est en 4e ; aucune quête de 5e encore.'),
  'c4.ma.5e.geometrie.espace': A_COUVRIR('Perspective, patrons, volumes, aire du disque : pas encore de figure dessinée pour cela.'),
  'c4.ma.5e.geometrie.conversions': A_COUVRIR('Conversions d’unités de longueur, d’aire, de volume et de capacité : aucune quête de 5e encore.'),
  'c4.ma.5e.geometrie.symetrie-centrale': FIGURE,
  'c4.ma.5e.geometrie.angles': FIGURE,
  'c4.ma.5e.geometrie.triangles': FIGURE,
  'c4.ma.5e.geometrie.parallelogrammes': FIGURE,
  'c4.ma.5e.donnees.statistiques': A_COUVRIR('Effectifs, fréquences, moyenne, diagrammes : l’île des statistiques est en 3e ; aucune quête de 5e encore.'),
  'c4.ma.5e.donnees.probabilites': A_COUVRIR('Vocabulaire des probabilités, cas d’équiprobabilité : l’île des probabilités est en 3e ; aucune quête de 5e encore.'),
  'c4.ma.5e.proportionnalite.fonctions': A_COUVRIR('Tableau de valeurs, « en fonction de », formule simple : l’île des fonctions est en 3e ; aucune quête de 5e encore.'),
  'c4.ma.5e.informatique.algorithmique': HORS('Algorithmique et programmation par blocs : demande un éditeur de programme, hors du périmètre de l’application.'),
  // ---------- Cycle 4, anglais ----------
  'c4.en.parler.presenter-raconter': HORS(ORAL),
  'c4.en.ecrire.dictee-fiche': A_COUVRIR('Écrire sous la dictée au cycle 4 : le Vocabulaire du portail le fait au niveau A1 seulement.'),
  'c4.en.ecrire.recit': HORS(ECRITURE_LIBRE),
  'c4.en.langue.phonologie': HORS(ORAL),
  'c4.en.lire.consignes-panneaux': QUITTE_LA_5E('c4.en.5e.comprendre.informations-pratiques'),
  'c4.en.dialoguer.echanges-sociaux': QUITTE_LA_5E('c4.en.5e.interagir.echanges'),
  // 5e (programme de 2025)
  'c4.en.5e.culture.portrait': A_COUVRIR('Axe 1, portrait : aucune quête de 5e ne le travaille encore ; il faudrait des portraits inventés.'),
  'c4.en.5e.culture.reel-imaginaire': A_COUVRIR('Axe 3, réel et imaginaire : aucune quête de 5e encore ; il faudrait des récits inventés ou du domaine public.'),
  'c4.en.5e.culture.ecole-loisirs': A_COUVRIR('Axe 4, école et loisirs : aucune quête de 5e ne le travaille encore.'),
  'c4.en.5e.culture.langues-lieux': A_COUVRIR('Axe 5, langues et lieux : aucune quête de 5e ne le travaille encore.'),
  'c4.en.5e.culture.royaume-uni': A_COUVRIR('Axe 6, obligatoire en 5e, le Royaume-Uni : aucune quête de 5e encore ; des repères en mots et en cartes simples, à cadrer.'),
  'c4.en.5e.exprimer.oral-ecrit': ORAL_ECRIT_LIBRE,
  'c4.en.5e.exprimer.dictee': A_COUVRIR('Écrire sous la dictée en 5e : le Vocabulaire du portail le fait au niveau de la 6e seulement.'),
  'c4.en.5e.interagir.mediation': A_COUVRIR('Signaler qu’on ne comprend pas, transmettre l’essentiel d’un message : aucune quête de 5e encore.'),
  'c4.en.5e.langue.phonologie': A_COUVRIR('Intonation, -s et -ed prononcés, voyelles longues et courtes : à reconnaître à l’écoute ; aucune quête de 5e ne le fait encore.'),
  'c4.en.5e.langue.phrase': A_COUVRIR('Adverbes de degré, connecteurs, phrases négatives et interrogatives : aucune quête de 5e ne les travaille encore en tant que tels.'),
  // ---------- Cycle 4, allemand (LV2) ----------
  'c4.de.ecouter.recit': RECIT_ENTENDU,
  'c4.de.parler.presenter-raconter': HORS(ORAL),
  'c4.de.ecrire.recit': HORS(ECRITURE_LIBRE),
  'c4.de.culture.langages': LV2_LANGAGES,
  'c4.de.langue.phonologie': HORS(ORAL),
  'c4.de.lire.consignes-panneaux': QUITTE_LA_5E('c4.de.5e.comprendre.oral-ecrit'),
  'c4.de.dialoguer.reagir': QUITTE_LA_5E('c4.de.5e.interagir.reagir'),
  'c4.de.ecrire.dictee-fiche': QUITTE_LA_5E('c4.de.5e.exprimer.dictee'),
  // 5e (programme de 2025)
  'c4.de.5e.culture.axes': AXES_LV2('« 16 nuances d’Allemagne »'),
  'c4.de.5e.exprimer.oral-ecrit': ORAL_ECRIT_LIBRE,
  'c4.de.5e.langue.phonologie': A_COUVRIR('Sons, accent et intonation propres à la langue : à reconnaître à l’écoute ; le Relais des voyageurs ne le fait pas encore.'),
  'c4.de.5e.langue.phrase': A_COUVRIR('Types de phrase, place du verbe, mots de liaison : le Relais des voyageurs ne les travaille pas encore en tant que tels.'),
  // ---------- Cycle 4, espagnol (LV2) ----------
  'c4.es.ecouter.recit': RECIT_ENTENDU,
  'c4.es.parler.presenter-raconter': HORS(ORAL),
  'c4.es.ecrire.recit': HORS(ECRITURE_LIBRE),
  'c4.es.culture.langages': LV2_LANGAGES,
  'c4.es.langue.phonologie': HORS(ORAL),
  'c4.es.lire.consignes-panneaux': QUITTE_LA_5E('c4.es.5e.comprendre.oral-ecrit'),
  'c4.es.dialoguer.reagir': QUITTE_LA_5E('c4.es.5e.interagir.reagir'),
  'c4.es.ecrire.dictee-fiche': QUITTE_LA_5E('c4.es.5e.exprimer.dictee'),
  // 5e (programme de 2025)
  'c4.es.5e.culture.axes': AXES_LV2('le Mexique'),
  'c4.es.5e.exprimer.oral-ecrit': ORAL_ECRIT_LIBRE,
  'c4.es.5e.langue.phonologie': A_COUVRIR('Sons, accent et intonation propres à la langue : à reconnaître à l’écoute ; le Relais des voyageurs ne le fait pas encore.'),
  'c4.es.5e.langue.phrase': A_COUVRIR('Types de phrase, place du verbe, mots de liaison : le Relais des voyageurs ne les travaille pas encore en tant que tels.'),
  // ---------- Cycle 3, histoire et géographie ----------
  'c3.hg.demarches.point-de-vue': A_COUVRIR('Questionner le point de vue d’un document : aucune question de la Fouille des siècles ni de la Pointe des paysages ne le fait encore ; prévu en niveau de plus.'),
  'c3.hg.demarches.ecrire-dire': HORS('Écrire et dire : l’application propose des réponses à choisir, sans rédaction ni micro.'),
  'c3.hg.demarches.raisonner': HORS('Enquêter, chercher en ligne, travailler en groupe : la démarche de classe, que l’application ne remplace pas.'),
  // ---------- Cycle 4, histoire et géographie ----------
  'c4.hg.demarches.ecrire-dire': HORS('Écrire, dire et réaliser une production audiovisuelle : l’application propose des réponses à choisir, sans rédaction ni micro.'),
  // ---------- Cycle 3, sciences et technologie (SVT, physique-chimie, technologie) : fabriquer reste à la classe ----------
  'c3.te.demarches.concevoir': FABRIQUER,
  'c3.te.objets.realiser': FABRIQUER,
  // Ajoutés le 7 octobre 2026 à la lecture du texte de 2023, pas encore cités par une mission.
  'c3.sv.demarches.situer': A_COUVRIR('Échelles d’espace et de temps : la Vallée du vivant place des fossiles dans les couches d’une falaise (Classer le vivant), sans encore citer cette compétence ; à rattacher après relecture des questions, ou par un item sur l’échelle des temps.'),
  'c3.sv.demarches.esprit-critique': A_COUVRIR('Distinguer une croyance d’un savoir scientifique, juger une source : prévu en niveau de plus à la Vallée du vivant (deux affirmations, laquelle repose sur une preuve).'),
  'c3.sv.vivant.cellule': A_COUVRIR('La cellule, unité du vivant : une cellule décrite en mots sur un document (le microscope reste à la classe), prévue à la Vallée du vivant.'),
  'c3.sv.terre.climat': A_COUVRIR('Le réchauffement climatique récent, argumenté à partir de données : un relevé de températures décrit en mots, prévu à la Vallée du vivant (La Terre et ses milieux).'),
  'c3.pc.matiere.materiaux': A_COUVRIR('Trier des matériaux selon leurs propriétés physiques : la conductivité électrique est déjà travaillée avec le circuit (Laboratoire des éléments, Énergie et circuits) ; l’aimant, la conductivité thermique et la décomposition dans la nature restent à écrire.'),
  'c3.pc.matiere.transformations': A_COUVRIR('Transformation chimique, pictogrammes de danger, composition de l’air : prévus au Laboratoire des éléments, sur des documents (rien ne se manipule).'),
  'c3.pc.matiere.lumiere': A_COUVRIR('Le jour et la nuit, les saisons : le texte de 2023 les range en physique-chimie ; la Vallée du vivant en pose des questions (La Terre et ses milieux) au titre de la SVT. Prévu au Laboratoire des éléments, avec les ombres.'),
  'c3.te.objets.probleme': A_COUVRIR('Comparer des solutions à un problème technique et prendre en compte une contrainte : prévu au Hangar des inventions, sur une fiche décrite en mots.'),
  'c3.te.objets.programmer': A_COUVRIR('Comprendre un programme simple et le dire en mots : prévu au Hangar des inventions, comme à la Ruche des réseaux en 3e ; coder un objet réel reste à la classe.'),
  // ---------- Cycle 4, physique-chimie (SC-3) : manipuler reste à la classe ----------
  'c4.pc.demarches.manipuler': MANIPULER,
  // ---------- Cycle 4, SVT (SC-3) : manipuler reste à la classe ----------
  'c4.sv.demarches.manipuler': MANIPULER,
  // ---------- Cycle 4, technologie (BO n° 9 du 29 février 2024) : fabriquer, réparer et programmer un objet réel restent à la classe ----------
  'c4.te.conception.prototype': FABRIQUER,
  'c4.te.conception.programmer': HORS('Programmer un objet réel : demande un éditeur de programme et un système à commander, hors du périmètre de l’application (comme c4.ma.e.programmation). Comprendre un programme court et le traduire en langage naturel se fait à la Ruche des réseaux (« Lire un programme », c4.te.fonctionnement.programme).'),
  'c4.te.fonctionnement.donnees': A_COUVRIR('Décrire un objet par des données (descripteurs, types), le bit, trier et filtrer un tableau : prévu sur la question sur un document, à la Ruche des réseaux ou au Bassin des maquettes.'),
  'c4.te.fonctionnement.depanner': A_COUVRIR('Repérer une panne et formuler une hypothèse sur un objet décrit en mots (ses symptômes, ses pièces) ; réparer reste au travail de l’atelier.'),
  'c4.te.conception.projet': A_COUVRIR('Lire un diagramme de planification des tâches, les étapes d’un projet, l’écoconception : prévu à la Menuiserie des objets, sur la question sur un document.'),
  // ---------- Enseignement moral et civique, 6e (cycle 3) et 5e à 3e (cycle 4), EMC-1 ----------
  'c3.emc.6e.representer.interet-general': EMC,
  'c3.emc.6e.laicite.ecole': EMC,
  'c3.emc.6e.vie-privee.droit': EMC,
  'c4.emc.5e.egalite.discriminations': EMC,
  'c4.emc.5e.solidarite.echelles': EMC,
  'c4.emc.4e.etat-de-droit.libertes': EMC,
  'c4.emc.4e.defense.securite': EMC,
  'c4.emc.3e.regles.constitution': EMC,
  'c4.emc.3e.opinion.information': EMC,
  'c4.emc.3e.engagement.collectif': EMC,
  // ---------- Latin et grec ancien, option LCA (cycle 4, programme de 2016), LCA-1 ----------
  'c4.la.reperes.chronologie': LCA,
  'c4.la.reperes.heritage': LCA,
  'c4.la.culture.origines-rome': LCA,
  'c4.la.culture.republique': LCA,
  'c4.la.culture.vie-privee': LCA,
  'c4.la.culture.vie-publique': LCA,
  'c4.la.culture.mediterranee': LCA,
  'c4.la.3e.culture.republique-principat': LCA,
  'c4.la.3e.culture.empire': LCA,
  'c4.la.3e.culture.vie-sociale': LCA,
  'c4.la.3e.culture.mediterranee': LCA,
  'c4.la.lecture.indices': LCA,
  'c4.la.lecture.situer': LCA,
  'c4.la.lecture.dictionnaire': LCA,
  'c4.la.lecture.lire-oralement': LCA_LIRE_ORAL,
  'c4.la.lecture.traduire': LCA_TRADUIRE,
  'c4.la.lecture.interpreter': LCA_COMMENTER,
  'c4.la.langue.prononciation': LCA_PRONONCER,
  'c4.la.langue.cas-fonctions': LCA,
  'c4.la.langue.declinaisons': LCA,
  'c4.la.langue.pronoms': LCA,
  'c4.la.langue.verbe': LCA,
  'c4.la.langue.syntaxe': LCA,
  'c4.la.langue.lexique': LCA,
  'c4.la.langue.intercomprehension': LCA,
  'c4.la.3e.langue.nominale': LCA,
  'c4.la.3e.langue.verbe': LCA,
  'c4.la.3e.langue.syntaxe': LCA,
  'c4.la.3e.langue.lexique': LCA,
  'c4.gr.reperes.chronologie': LCA,
  'c4.gr.reperes.heritage': LCA,
  'c4.gr.culture.origines-rome': LCA,
  'c4.gr.culture.republique': LCA,
  'c4.gr.culture.vie-privee': LCA,
  'c4.gr.culture.vie-publique': LCA,
  'c4.gr.culture.mediterranee': LCA,
  'c4.gr.3e.culture.mythe-histoire': LCA,
  'c4.gr.3e.culture.unite-diversite': LCA,
  'c4.gr.3e.culture.vie-sociale': LCA,
  'c4.gr.3e.culture.mediterranee': LCA,
  'c4.gr.lecture.indices': LCA,
  'c4.gr.lecture.situer': LCA,
  'c4.gr.lecture.dictionnaire': LCA,
  'c4.gr.lecture.lire-oralement': LCA_LIRE_ORAL,
  'c4.gr.lecture.traduire': LCA_TRADUIRE,
  'c4.gr.lecture.interpreter': LCA_COMMENTER,
  'c4.gr.langue.alphabet': LCA_PRONONCER,
  'c4.gr.langue.cas-fonctions': LCA,
  'c4.gr.langue.lexique': LCA,
  'c4.gr.langue.intercomprehension': LCA,
  'c4.gr.3e.langue.alphabet': LCA_PRONONCER,
  'c4.gr.3e.langue.nominale': LCA,
  'c4.gr.3e.langue.verbe': LCA,
  'c4.gr.3e.langue.syntaxe': LCA,
  'c4.gr.3e.langue.lexique': LCA,
};
