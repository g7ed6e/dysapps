// La liste officielle des mots-outils (fin de CP) et des mots invariables les plus fréquents (fin de CE1),
// publiée sur data.gouv.fr sous Licence Ouverte. Le Coffre à mots de la Carrière des mots dicte des mots de cette
// liste ; le programme du cycle 3 renvoie explicitement à « l'orthographe des mots invariables » et aux « listes
// de fréquence ». La liste est citée telle quelle (groupes, locutions, « ne… pas ») : c'est une citation, pas une
// réécriture ; la forme dictable est calculée.
import { LICENCE_OUVERTE } from './sources';

export const MOTS_OUTILS_SOURCE = {
  dataset: 'Mots outils CE1',
  datasetUrl: 'https://www.data.gouv.fr/datasets/mots-outils-ce1/',
  pdfUrl: 'https://static.data.gouv.fr/resources/Liste_mots_outils-BO.pdf',
  title: 'Liste des mots dite « des mots-outils » à connaître à la fin du CP et des mots invariables les plus fréquents à connaître à la fin du CE1',
  legal: 'Liste indicative rappelée dans le projet de programme de 2008, Bulletin officiel n° 0 du 20 février 2008, pages 25 et 26',
  licence: LICENCE_OUVERTE,
  consulted: '2026-09-27',
};

/** Liste indicative CP, dans l'ordre du document. */
export const MOTS_OUTILS_CP: readonly string[] = [
  'le', 'la', 'l’', 'un', 'une', 'ma', 'ta', 'sa', 'mon', 'ton', 'son', 'ce',
  'les', 'des', 'mes', 'tes', 'ses', 'ces',
  'du', 'au',
  'quel', 'quelle',
  'je', 'tu', 'il', 'elle', 'nous', 'vous', 'ils', 'elles', 'en', 'y',
  'tout', 'on',
  'qui', 'que', 'quoi', 'dont',
  'oui', 'non',
  'et', 'car', 'mais', 'ou',
  'alors', 'puis', 'ensuite',
  'de', 'à', 'dans', 'sur', 'sous', 'chez', 'entre', 'avant', 'après', 'avec', 'sans', 'par', 'pour', 'comme',
  'où', 'quand', 'comment',
  'ici', 'près', 'tard', 'tôt', 'toujours', 'encore', 'bien', 'trop', 'très', 'si', 'plus', 'moins',
  'ne… pas', 'ne… jamais', 'ne… plus',
];

/** Liste indicative CE1, dans l'ordre du document. */
export const MOTS_OUTILS_CE1: readonly string[] = [
  'plusieurs',
  'd’accord', 'hélas', 'peut-être',
  'donc', 'pourtant',
  'autour', 'derrière', 'dessous', 'dessus', 'devant', 'parmi', 'vers', 'durant', 'pendant', 'depuis', 'afin', 'malgré', 'sauf',
  'dès que', 'lorsque', 'parce que', 'pendant que', 'pourquoi',
  'ailleurs', 'dedans', 'dehors', 'côte à côte', 'loin', 'partout',
  'aujourd’hui', 'aussitôt', 'autrefois', 'avant-hier', 'bientôt', 'd’abord', 'déjà', 'demain', 'en ce moment', 'hier',
  'de temps en temps', 'en avance', 'en retard', 'enfin', 'longtemps', 'maintenant', 'quelquefois', 'soudain', 'souvent', 'tout à coup',
  'assez', 'aussi', 'autant', 'beaucoup', 'davantage', 'presque',
  'debout', 'ensemble', 'mieux', 'sinon',
  'brusquement', 'exactement', 'doucement', 'facilement', 'heureusement', 'lentement', 'sagement', 'seulement', 'tranquillement',
  'ne… guère',
];

/** Un mot tel qu'on le dicte : « ne… jamais » → « jamais », minuscules, forme normalisée. */
export function motDictable(entree: string): string {
  return entree.replace(/^ne… /, '').normalize('NFC').toLowerCase();
}

/** Tous les mots de la liste officielle, sous leur forme dictable. */
export function motsOutilsDictables(): Set<string> {
  return new Set([...MOTS_OUTILS_CP, ...MOTS_OUTILS_CE1].map(motDictable));
}

/** Mots du Coffre à mots absents de la liste officielle, avec la raison de les garder. */
export const COFFRE_HORS_LISTE: Record<string, string> = {
  parfois: 'Mot invariable fréquent au collège, de la même famille que « quelquefois » et « autrefois » de la liste.',
  surtout: 'Mot invariable fréquent au collège, construit sur « tout », qui est dans la liste.',
};
