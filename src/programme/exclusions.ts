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

// LV2 (allemand, espagnol). Ce qui est prévu, étape par étape (docs/conception/cadrage-contenu.md, « LV2 ») : l’île de 5e
// (le Relais des voyageurs, LV2-2 et LV2-3) et l’île de 4e (le Jardin des heures, LV2-4) sont faites ; reste LV2-5, île
// de 3e. Le passif (`langue.modaux-passif`) reste hors du niveau A2 visé : un manque sans exclusion, les modaux sont faits.
const LV2_5 = (quoi: string) => A_COUVRIR(`À venir avec l’île LV2 de 3e (LV2-5 du cadrage du contenu) : ${quoi}.`);
const LV2_LANGAGES = A_COUVRIR('Médias, chansons et cinéma : rien ne s’emprunte, et aucune étape du cadrage LV2 (LV2-2 à LV2-5) ne les prévoit ; à reprendre après LV2-5.');

export const EXCLUSIONS: Partial<Record<ProgrammeId, Exclusion>> = {
  // ---------- Cycle 3, français ----------
  'c3.fr.oral.comprendre-s-exprimer': HORS(ORAL),
  'c3.fr.ecriture.rediger': HORS(ECRITURE_LIBRE),
  'c3.fr.culture.entrees': HORS('Lecture d’œuvres complètes en classe : la mission Lecture du portail en propose des extraits du domaine public, pas le parcours des entrées.'),
  'c3.fr.lecture.reprises': A_COUVRIR('Pas encore de mission de compréhension en 6e : prévue dans la Tour du lecteur (Étages du sens).'),
  'c3.fr.lecture.documents': A_COUVRIR('Pas de document composite (texte et tableau) dans les missions : prévu avec une mission de données de l’île Grandeurs et l’Observatoire des textes.'),
  'c3.fr.langue.genre-nombre': A_COUVRIR('Les marques de genre et de nombre ne sont travaillées qu’à travers les accords : une mission d’accord dans le groupe nominal en 6e est prévue (Ferme des accords).'),
  'c3.fr.langue.sujet': A_COUVRIR('Le sujet inversé ou composé n’est travaillé qu’en 4e (Sommet du sujet) : une mission de 6e est prévue (Ferme des accords).'),
  'c3.fr.langue.attribut-gn': A_COUVRIR('Attribut, épithète et complément du nom : prévus dans une mission de grammaire de 6e (Tour du lecteur, Vitraux des phrases).'),
  'c3.fr.langue.types-formes': A_COUVRIR('Types et formes de phrases : prévus dans une mission de grammaire de 6e (Tour du lecteur, Vitraux des phrases).'),
  'c3.fr.langue.phrase-complexe': A_COUVRIR('Phrase simple et complexe : prévue dans une mission de grammaire de 6e, puis en 3e (Observatoire des textes).'),
  // ---------- Cycle 3, maths ----------
  'c3.ma.nombres.grands-entiers': A_COUVRIR('Grands nombres entiers : prévus dans une mission du Volcan des décimaux (Nombres géants).'),
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
  'c3.en.ecouter.histoire': A_COUVRIR('Suivre une histoire simple à l’oral : les écoutes de la Baie des mots portent sur des mots, pas sur un récit.'),
  'c3.en.lire.textes-courts': A_COUVRIR('Lire un texte court avec un visuel en 6e : la seule mission de lecture est en 3e (Studio des ondes) ; une mission de la Baie des mots est prévue.'),
  'c3.en.parler.reproduire-presenter': HORS(ORAL),
  'c3.en.ecrire.phrases': HORS(ECRITURE_LIBRE),
  'c3.en.culture.reperes': A_COUVRIR('Repères géographiques, historiques et culturels des pays anglophones : aucune mission ne les aborde.'),
  'c3.en.culture.imaginaire': A_COUVRIR('Contes, légendes et héros des pays anglophones : aucune mission ne les aborde.'),
  // ---------- Cycle 4, français ----------
  'c4.fr.oral.comprendre-s-exprimer': HORS(ORAL),
  'c4.fr.lecture.image': HORS('Analyse d’image : l’application n’affiche pas d’œuvres ni de photographies (rien d’emprunté).'),
  'c4.fr.lecture.documents': A_COUVRIR('Documents composites (texte et tableau) : prévus dans l’Observatoire des textes.'),
  'c4.fr.lecture.genres-epoques': A_COUVRIR('Situer une œuvre dans son époque : la mission Lecture identifie les genres, pas les contextes.'),
  'c4.fr.ecriture.rediger': HORS(ECRITURE_LIBRE),
  'c4.fr.culture.entrees': HORS('Lecture d’œuvres complètes en classe : hors de ce qu’une application d’entraînement propose.'),
  'c4.fr.langue.fonctions-etendues': A_COUVRIR('La phrase impersonnelle est reconnue dans Voix des textes, l’apposition dans Écho des pronominaux (Falaise des accords, niveau 3) ; attribut du COD et expansions du nom : prévus dans un niveau de plus des Rouages (Observatoire des textes).'),
  'c4.fr.langue.types-formes': A_COUVRIR('Les formes passive et impersonnelle sont reconnues dans Voix des textes ; les types de phrase et les formes négative et exclamative ne sont pas encore travaillés en 3e : prévus dans l’Observatoire des textes.'),
  'c4.fr.langue.phrase-complexe': A_COUVRIR('Les subordonnées sont reconnues dans Voix des textes ; phrase simple et complexe, juxtaposition et coordination, compter les propositions : prévus dans l’Observatoire des textes.'),
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
  'c4.en.ecouter.recit': A_COUVRIR('Suivre un récit à l’oral : les écoutes portent sur des phrases et des questions, pas sur un récit.'),
  'c4.en.ecouter.indices': A_COUVRIR('Identifier la situation d’énonciation à l’oral : aucune mission ne l’aborde.'),
  'c4.en.parler.presenter-raconter': HORS(ORAL),
  'c4.en.ecrire.dictee-fiche': A_COUVRIR('Écrire sous la dictée au cycle 4 : le Vocabulaire du portail le fait au niveau A1 seulement.'),
  'c4.en.ecrire.recit': HORS(ECRITURE_LIBRE),
  'c4.en.culture.langages': A_COUVRIR('Médias, réseaux, chansons et cinéma des pays anglophones : aucune mission ne les aborde.'),
  'c4.en.culture.ecole-societe': A_COUVRIR('École et société dans les pays anglophones : aucune mission ne les aborde.'),
  'c4.en.culture.voyages-rencontres': A_COUVRIR('Voyages, migrations, patrimoine des pays anglophones : aucune mission ne les aborde.'),
  'c4.en.langue.phonologie': HORS(ORAL),
  // ---------- Cycle 4, allemand (LV2) ----------
  'c4.de.ecouter.recit': LV2_5('suivre un petit récit entendu'),
  'c4.de.lire.recit': LV2_5('lire un petit texte suivi'),
  'c4.de.parler.presenter-raconter': HORS(ORAL),
  'c4.de.ecrire.recit': HORS(ECRITURE_LIBRE),
  'c4.de.culture.langages': LV2_LANGAGES,
  'c4.de.culture.voyages-rencontres': LV2_5('voyages et villes des pays germanophones'),
  'c4.de.langue.phrase-complexe': LV2_5('subordonnées en weil et dass'),
  'c4.de.langue.phonologie': HORS(ORAL),
  // ---------- Cycle 4, espagnol (LV2) ----------
  'c4.es.ecouter.recit': LV2_5('suivre un petit récit entendu'),
  'c4.es.lire.recit': LV2_5('lire un petit texte suivi'),
  'c4.es.parler.presenter-raconter': HORS(ORAL),
  'c4.es.ecrire.recit': HORS(ECRITURE_LIBRE),
  'c4.es.culture.langages': LV2_LANGAGES,
  'c4.es.culture.voyages-rencontres': LV2_5('voyages et villes des pays hispanophones'),
  'c4.es.langue.phrase-complexe': LV2_5('phrases reliées par porque, cuando, pero'),
  'c4.es.langue.phonologie': HORS(ORAL),
};
