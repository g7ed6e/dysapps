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

// Sciences et technologie : les trois îles de 6e (la Vallée du vivant, le Laboratoire des éléments, le Hangar des
// inventions, SC-2) couvrent le cycle 3 en vigueur (BO n° 25 du 22 juin 2023), sauf fabriquer et ce que la relecture du
// 7 octobre 2026 a ajouté au référentiel. Les neuf îles de 5e, 4e et 3e (SC-3) couvrent le cycle 4, sauf manipuler,
// fabriquer un prototype et programmer un objet réel (docs/conception/cadrage-contenu.md, « Sciences »).
const FABRIQUER = HORS('Fabriquer, mesurer pour de vrai, travailler en équipe : le travail de la classe, que l’application ne remplace pas.');

const FIGURE = A_COUVRIR('Géométrie de 5e : il faut des figures dessinées (parallélogrammes, symétrie centrale), que les écrans d’exercice n’ont pas encore.');
const ORAL_ECRIT_LIBRE = HORS('Production orale et écrite libre : hors de ce que peut faire une application sans micro ni rédaction.');
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
  'c3.fr.lecture.documents': A_COUVRIR('Le document composite (texte et tableau, nature et source) est travaillé en 3e à l’Observatoire des textes (Inférences, niveau 3), pas encore en 6e : il faudrait un écran qui montre un texte et un tableau ensemble.'),
  'c3.fr.lecture.voix-haute': HORS(ORAL),
  'c3.fr.ecriture.copier': HORS('Copier à la main, de façon lisible et soignée : le geste d’écriture reste à la classe.'),
  // ---------- Cycle 3, maths ----------
  'c3.ma.espace.construction': HORS('Géométrie de construction : demande règle, équerre et compas.'),
  'c3.ma.espace.vision-espace': A_COUVRIR('Assemblages de cubes vus sous plusieurs angles : pas encore de figure dessinée pour cela.'),
  'c3.ma.informatique.programmation': HORS('Programmer un déplacement ou une construction : demande un éditeur de programme, hors du périmètre de l’application.'),
  // ---------- Cycle 3, anglais ----------
  'c3.en.parler.reproduire-presenter': HORS(ORAL),
  'c3.en.ecrire.phrases': HORS(ECRITURE_LIBRE),
  // ---------- Cycle 4, français ----------
  'c4.fr.oral.comprendre-s-exprimer': HORS(ORAL),
  'c4.fr.lecture.image': HORS('Analyse d’image : l’application n’affiche pas d’œuvres ni de photographies (rien d’emprunté).'),
  'c4.fr.ecriture.rediger': HORS(ECRITURE_LIBRE),
  'c4.fr.culture.entrees': HORS('Lecture d’œuvres complètes en classe : hors de ce qu’une application d’entraînement propose.'),
  // 5e (texte de 2026)
  'c4.fr.5e.lecture.comprendre': A_COUVRIR('Comprendre un texte en 5e : la lecture du portail et l’île de lecture de 6e le font ; aucune quête de 5e encore.'),
  'c4.fr.5e.lecture.voix-haute': HORS(ORAL),
  'c4.fr.5e.lecture.oeuvre': HORS('Lecture d’œuvres complètes en classe : hors de ce qu’une application d’entraînement propose.'),
  'c4.fr.5e.lecture.reperes': A_COUVRIR('Repères dans l’histoire littéraire : aucune quête de 5e ne les aborde.'),
  'c4.fr.5e.culture.entrees': HORS('Lecture d’œuvres complètes en classe : hors de ce qu’une application d’entraînement propose.'),
  'c4.fr.5e.ecriture.rediger': HORS(ECRITURE_LIBRE),
  'c4.fr.5e.oral.communiquer': HORS(ORAL),
  // ---------- Cycle 4, maths ----------
  'c4.ma.d.solides': HORS('Représentations de solides (perspective, sections, patrons) : demandent des figures que l’application ne dessine pas.'),
  'c4.ma.e.programmation': HORS('Algorithmique et programmation : hors du périmètre de l’application.'),
  // 5e (texte de 2026)
  'c4.ma.5e.geometrie.symetrie-centrale': FIGURE,
  'c4.ma.5e.geometrie.parallelogrammes': FIGURE,
  'c4.ma.5e.informatique.algorithmique': HORS('Algorithmique et programmation par blocs : demande un éditeur de programme, hors du périmètre de l’application.'),
  // ---------- Cycle 4, anglais ----------
  'c4.en.parler.presenter-raconter': HORS(ORAL),
  'c4.en.ecrire.recit': HORS(ECRITURE_LIBRE),
  'c4.en.langue.phonologie': HORS(ORAL),
  // 5e (programme de 2025)
  'c4.en.5e.exprimer.oral-ecrit': ORAL_ECRIT_LIBRE,
  'c4.en.5e.exprimer.dictee': A_COUVRIR('Écrire sous la dictée en 5e : le Vocabulaire du portail le fait au niveau de la 6e seulement.'),
  'c4.en.5e.langue.phonologie': A_COUVRIR('Intonation, -s et -ed prononcés, voyelles longues et courtes : à reconnaître à l’écoute ; aucune quête de 5e ne le fait encore.'),
  // ---------- Cycle 4, allemand (LV2) ----------
  'c4.de.ecouter.recit': RECIT_ENTENDU,
  'c4.de.parler.presenter-raconter': HORS(ORAL),
  'c4.de.ecrire.recit': HORS(ECRITURE_LIBRE),
  'c4.de.langue.phonologie': HORS(ORAL),
  // 5e (programme de 2025)
  'c4.de.5e.exprimer.oral-ecrit': ORAL_ECRIT_LIBRE,
  'c4.de.5e.langue.phonologie': A_COUVRIR('Sons, accent et intonation propres à la langue : à reconnaître à l’écoute ; le Relais des voyageurs ne le fait pas encore.'),
  // ---------- Cycle 4, espagnol (LV2) ----------
  'c4.es.ecouter.recit': RECIT_ENTENDU,
  'c4.es.parler.presenter-raconter': HORS(ORAL),
  'c4.es.ecrire.recit': HORS(ECRITURE_LIBRE),
  'c4.es.langue.phonologie': HORS(ORAL),
  // 5e (programme de 2025)
  'c4.es.5e.exprimer.oral-ecrit': ORAL_ECRIT_LIBRE,
  'c4.es.5e.langue.phonologie': A_COUVRIR('Sons, accent et intonation propres à la langue : à reconnaître à l’écoute ; le Relais des voyageurs ne le fait pas encore.'),
  // ---------- Cycle 3, histoire et géographie ----------
  'c3.hg.demarches.ecrire-dire': HORS('Écrire et dire : l’application propose des réponses à choisir, sans rédaction ni micro.'),
  'c3.hg.demarches.raisonner': HORS('Enquêter, chercher en ligne, travailler en groupe : la démarche de classe, que l’application ne remplace pas.'),
  // ---------- Cycle 4, histoire et géographie ----------
  'c4.hg.demarches.ecrire-dire': HORS('Écrire, dire et réaliser une production audiovisuelle : l’application propose des réponses à choisir, sans rédaction ni micro.'),
  // ---------- Cycle 3, sciences et technologie (SVT, physique-chimie, technologie) : fabriquer reste à la classe ----------
  'c3.te.demarches.concevoir': FABRIQUER,
  'c3.te.objets.realiser': FABRIQUER,
  // Ajoutés le 7 octobre 2026 à la lecture du texte de 2023, pas encore cités par une mission.
  // ---------- Cycle 4, physique-chimie (SC-3) : manipuler reste à la classe ----------
  'c4.pc.demarches.manipuler': MANIPULER,
  // ---------- Cycle 4, SVT (SC-3) : manipuler reste à la classe ----------
  'c4.sv.demarches.manipuler': MANIPULER,
  // ---------- Cycle 4, technologie (BO n° 9 du 29 février 2024) : fabriquer, réparer et programmer un objet réel restent à la classe ----------
  'c4.te.conception.prototype': FABRIQUER,
  'c4.te.conception.programmer': HORS('Programmer un objet réel : demande un éditeur de programme et un système à commander, hors du périmètre de l’application (comme c4.ma.e.programmation). Comprendre un programme court et le traduire en langage naturel se fait à la Ruche des réseaux (« Lire un programme », c4.te.fonctionnement.programme).'),
  // ---------- Enseignement moral et civique, 4e et 3e (cycle 4), EMC-1 ; la 6e est couverte au Préau des délégués, la 5e au Fournil des partages (EMC-2) ----------
  'c4.emc.4e.etat-de-droit.libertes': EMC,
  'c4.emc.4e.defense.securite': EMC,
  'c4.emc.3e.regles.constitution': EMC,
  'c4.emc.3e.opinion.information': EMC,
  'c4.emc.3e.engagement.collectif': EMC,
  // ---------- Latin et grec ancien, option LCA (cycle 4, programme de 2016), LCA-1 ; ce que travaille la Grotte des légendes (5e, LCA-2) en est sorti ----------
  'c4.la.culture.republique': LCA,
  'c4.la.culture.vie-privee': LCA,
  'c4.la.culture.mediterranee': LCA,
  'c4.la.3e.culture.republique-principat': LCA,
  'c4.la.3e.culture.empire': LCA,
  'c4.la.3e.culture.vie-sociale': LCA,
  'c4.la.3e.culture.mediterranee': LCA,
  'c4.la.lecture.indices': LCA,
  'c4.la.lecture.dictionnaire': LCA,
  'c4.la.lecture.lire-oralement': LCA_LIRE_ORAL,
  'c4.la.lecture.traduire': LCA_TRADUIRE,
  'c4.la.lecture.interpreter': LCA_COMMENTER,
  'c4.la.langue.prononciation': LCA_PRONONCER,
  'c4.la.langue.pronoms': LCA,
  'c4.la.langue.verbe': LCA,
  'c4.la.langue.syntaxe': LCA,
  'c4.la.3e.langue.nominale': LCA,
  'c4.la.3e.langue.verbe': LCA,
  'c4.la.3e.langue.syntaxe': LCA,
  'c4.la.3e.langue.lexique': LCA,
  'c4.gr.culture.republique': LCA,
  'c4.gr.culture.vie-privee': LCA,
  'c4.gr.culture.mediterranee': LCA,
  'c4.gr.3e.culture.mythe-histoire': LCA,
  'c4.gr.3e.culture.unite-diversite': LCA,
  'c4.gr.3e.culture.vie-sociale': LCA,
  'c4.gr.3e.culture.mediterranee': LCA,
  'c4.gr.lecture.indices': LCA,
  'c4.gr.lecture.dictionnaire': LCA,
  'c4.gr.lecture.lire-oralement': LCA_LIRE_ORAL,
  'c4.gr.lecture.traduire': LCA_TRADUIRE,
  'c4.gr.lecture.interpreter': LCA_COMMENTER,
  'c4.gr.langue.cas-fonctions': LCA,
  'c4.gr.3e.langue.alphabet': LCA_PRONONCER,
  'c4.gr.3e.langue.nominale': LCA,
  'c4.gr.3e.langue.verbe': LCA,
  'c4.gr.3e.langue.syntaxe': LCA,
  'c4.gr.3e.langue.lexique': LCA,
};
