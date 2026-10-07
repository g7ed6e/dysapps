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
const MANIPULER = HORS('Manipuler, mesurer, observer pour de vrai (montage, microscope, terrain) : le travail de la classe, que l’application ne remplace pas.');

export const EXCLUSIONS: Partial<Record<ProgrammeId, Exclusion>> = {
  // ---------- Cycle 3, français ----------
  'c3.fr.oral.comprendre-s-exprimer': HORS(ORAL),
  'c3.fr.ecriture.rediger': HORS(ECRITURE_LIBRE),
  'c3.fr.culture.entrees': HORS('Lecture d’œuvres complètes en classe : la mission Lecture du portail en propose des extraits du domaine public, pas le parcours des entrées.'),
  'c3.fr.lecture.documents': A_COUVRIR('Le document composite (texte et tableau, nature et source) est travaillé en 3e à l’Observatoire des textes (Inférences, niveau 3), pas encore en 6e : prévu avec une mission de données de l’île Grandeurs.'),
  // ---------- Cycle 3, maths ----------
  'c3.ma.nombres.donnees': A_COUVRIR('Lecture de tableaux et de diagrammes : prévue dans une mission de données de l’île Grandeurs.'),
  'c3.ma.grandeurs.aire': A_COUVRIR('Aires : prévues dans l’île Grandeurs (Clôtures).'),
  'c3.ma.grandeurs.volume': A_COUVRIR('Volumes et contenances : prévus dans l’île Grandeurs.'),
  'c3.ma.grandeurs.angles': A_COUVRIR('Angles : prévus dans l’île Grandeurs (Clôtures).'),
  'c3.ma.grandeurs.unites-conversions': A_COUVRIR('Conversions d’unités : prévues dans l’île Grandeurs (Balances).'),
  'c3.ma.espace.reperage': HORS('Déplacements sur un plan et programmation : demandent un support de manipulation que les écrans d’exercice n’ont pas.'),
  'c3.ma.espace.figures-solides': A_COUVRIR('Reconnaître et nommer figures et solides : pas encore de figure dessinée pour cela.'),
  'c3.ma.espace.construction': HORS('Géométrie de construction : demande règle, équerre et compas.'),
  'c3.ma.espace.relations': A_COUVRIR('Perpendicularité, parallélisme, symétrie axiale : pas encore de figure dessinée pour cela.'),
  // ---------- Cycle 3, anglais ----------
  'c3.en.parler.reproduire-presenter': HORS(ORAL),
  'c3.en.ecrire.phrases': HORS(ECRITURE_LIBRE),
  // ---------- Cycle 4, français ----------
  'c4.fr.oral.comprendre-s-exprimer': HORS(ORAL),
  'c4.fr.lecture.image': HORS('Analyse d’image : l’application n’affiche pas d’œuvres ni de photographies (rien d’emprunté).'),
  'c4.fr.lecture.genres-epoques': A_COUVRIR('Situer une œuvre dans son époque : la mission Lecture identifie les genres, pas les contextes.'),
  'c4.fr.ecriture.rediger': HORS(ECRITURE_LIBRE),
  'c4.fr.culture.entrees': HORS('Lecture d’œuvres complètes en classe : hors de ce qu’une application d’entraînement propose.'),
  'c4.fr.langue.ponctuation': A_COUVRIR('Rôle de la ponctuation : aucune mission ne l’aborde.'),
  // ---------- Cycle 4, maths ----------
  'c4.ma.c.aires-volumes': A_COUVRIR('Aires et volumes du cycle 4 : pas encore de figure dessinée pour cela.'),
  'c4.ma.c.agrandissement': A_COUVRIR('Effet d’un agrandissement sur les aires et les volumes : aucune mission ne l’aborde.'),
  'c4.ma.d.solides': HORS('Représentations de solides (perspective, sections, patrons) : demandent des figures que l’application ne dessine pas.'),
  'c4.ma.d.angles-triangles': A_COUVRIR('Somme des angles, inégalité triangulaire : pas encore de figure dessinée pour cela.'),
  'c4.ma.d.triangles-parallelogramme': A_COUVRIR('Triangles semblables et parallélogramme : pas encore de figure dessinée pour cela.'),
  'c4.ma.d.transformations': A_COUVRIR('Translation, rotation, symétrie centrale, homothétie : pas encore de figure dessinée pour cela.'),
  'c4.ma.e.programmation': HORS('Algorithmique et programmation : hors du périmètre de l’application.'),
  // ---------- Cycle 4, anglais ----------
  'c4.en.parler.presenter-raconter': HORS(ORAL),
  'c4.en.ecrire.dictee-fiche': A_COUVRIR('Écrire sous la dictée au cycle 4 : le Vocabulaire du portail le fait au niveau A1 seulement.'),
  'c4.en.ecrire.recit': HORS(ECRITURE_LIBRE),
  'c4.en.langue.phonologie': HORS(ORAL),
  // ---------- Cycle 4, allemand (LV2) ----------
  'c4.de.ecouter.recit': RECIT_ENTENDU,
  'c4.de.parler.presenter-raconter': HORS(ORAL),
  'c4.de.ecrire.recit': HORS(ECRITURE_LIBRE),
  'c4.de.culture.langages': LV2_LANGAGES,
  'c4.de.langue.phonologie': HORS(ORAL),
  // ---------- Cycle 4, espagnol (LV2) ----------
  'c4.es.ecouter.recit': RECIT_ENTENDU,
  'c4.es.parler.presenter-raconter': HORS(ORAL),
  'c4.es.ecrire.recit': HORS(ECRITURE_LIBRE),
  'c4.es.culture.langages': LV2_LANGAGES,
  'c4.es.langue.phonologie': HORS(ORAL),
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
};
