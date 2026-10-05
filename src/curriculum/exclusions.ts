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

// Sciences et technologie : trois îles de 6e prévues (SVT, physique-chimie, technologie), choix C du mainteneur du
// 5 octobre 2026 ; elles entrent au jeu après les îles sur la grille (GD-9). Le cycle 4 viendra ensuite.
const SCIENCES_6E = A_COUVRIR('Prévu avec les trois îles de sciences de 6e (cadrage du contenu, « Les sciences et la technologie »).');
const FABRIQUER = HORS('Fabriquer, mesurer pour de vrai, travailler en équipe : le travail de la classe, que l’application ne remplace pas.');

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
  // ---------- Cycle 3, sciences et technologie (SVT, physique-chimie, technologie) ----------
  'c3.sv.demarches.observer': SCIENCES_6E,
  'c3.sv.demarches.langages': SCIENCES_6E,
  'c3.sv.demarches.responsable': SCIENCES_6E,
  'c3.sv.vivant.classer': SCIENCES_6E,
  'c3.sv.vivant.evolution': SCIENCES_6E,
  'c3.sv.vivant.alimentation': SCIENCES_6E,
  'c3.sv.vivant.developpement': SCIENCES_6E,
  'c3.sv.vivant.matiere-organique': SCIENCES_6E,
  'c3.sv.terre.systeme-solaire': SCIENCES_6E,
  'c3.sv.terre.phenomenes': SCIENCES_6E,
  'c3.sv.terre.peuplement': SCIENCES_6E,
  'c3.sv.terre.environnement': SCIENCES_6E,
  'c3.pc.demarches.experimenter': SCIENCES_6E,
  'c3.pc.demarches.mesurer': SCIENCES_6E,
  'c3.pc.demarches.langages': SCIENCES_6E,
  'c3.pc.matiere.etats': SCIENCES_6E,
  'c3.pc.matiere.grandeurs': SCIENCES_6E,
  'c3.pc.matiere.melanges': SCIENCES_6E,
  'c3.pc.matiere.mouvements': SCIENCES_6E,
  'c3.pc.matiere.energie': SCIENCES_6E,
  'c3.pc.matiere.circuit': SCIENCES_6E,
  'c3.pc.matiere.signal': SCIENCES_6E,
  'c3.te.demarches.concevoir': FABRIQUER,
  'c3.te.demarches.representer': SCIENCES_6E,
  'c3.te.demarches.numerique': SCIENCES_6E,
  'c3.te.objets.evolution': SCIENCES_6E,
  'c3.te.objets.fonction': SCIENCES_6E,
  'c3.te.objets.fonctionnement': SCIENCES_6E,
  'c3.te.objets.materiaux': SCIENCES_6E,
  'c3.te.objets.recyclage': SCIENCES_6E,
  'c3.te.objets.realiser': FABRIQUER,
  'c3.te.objets.information': SCIENCES_6E,
};
