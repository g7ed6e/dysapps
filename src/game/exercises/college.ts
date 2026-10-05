// Missions de maths du collège (cycle 4) : générateurs (reproductibles pour une graine, une graine par partie) qui produisent directement des items Blocland,
// avec leurs aides visuelles en données (droite des relatifs, tableau de proportionnalité, rappel de règle). Les
// générateurs sont rangés par notion dans ./college/, que ce fichier réexporte ; il garde les missions elles-mêmes.
import type { ExerciseDef } from './types';
import { defineData } from './college/common';
import { addRelatifs, compareRelatifs, divRelatifs, mulRelatifs, readRelatif, subRelatifs } from './college/signedNumbers';
import { addSubFractions, compareFractionsC4, mulDivFractions } from './college/fractions';
import { fourthCoef, fourthInt, mapScale, percentChange, percentOf, speed } from './college/proportions';
import { powerOfNumber, powerOfTen, powerOfTenReverse, primeDecomposition, primeOrDivisor, productOfPowers, scientific, squareRoot } from './college/powers';
import { developDouble, developSimple, equationOneStep, equationTwoSteps, factorNumber, factorX, productEquation, reduceMixed, reduceSimple, testEquality } from './college/algebra';
import { pythagoreHyp, pythagoreSide, reciprocalPythagore, reciprocalThales, thales, trigo } from './college/geometry';
import { frequencyFraction, frequencyPercent, mean, medianRange, probability, readChart } from './college/statistics';
import { antecedent, graphAntecedent, graphImage, graphLine, imageOf, linearOrAffine } from './college/functions';

export { buildDataItems, choices, defineData, fmt, type ItemGenerator, seededItems } from './college/common';
export { addRelatifs, compareRelatifs, mulRelatifs } from './college/signedNumbers';
export { percentChange } from './college/proportions';
export { pow, primeDecomposition, primeFactors, scientific, TO_FACTOR } from './college/powers';
export { developDouble, equationTwoSteps, factorNumber, factorX, productEquation, testEquality } from './college/algebra';
export { NOT_RIGHT, pythagoreHyp, pythagoreSide, reciprocalPythagore, reciprocalThales, RECIPROQUE_PYTHAGORE_CHOICES, thales, THALES_CASES } from './college/geometry';
export { mean, SURVEYS } from './college/statistics';
export { GRAPH_FRAME, graphAntecedent, graphImage, graphLine, READ_ANTECEDENT_RULES, READ_IMAGE_RULES, READ_LINE_RULES } from './college/functions';

// ---------- Les exercices ----------

const THERMO = 'Compare les deux nombres. Sur la droite, le plus petit est toujours à gauche.';

const THERMO_READ = 'Lis le nombre repéré par le point. À gauche de zéro, il est négatif.';

const BANQUISE = 'Additionne les deux relatifs. Le bond sur la droite te montre le chemin.';

const BANQUISE_SUB = 'Soustraire un nombre, c’est ajouter son opposé. Suis le bond sur la droite.';

const CREVASSES = 'Multiplie. Regarde les signes d’abord, la règle est affichée.';

const CREVASSES_DIV = 'Divise. Même règle des signes que la multiplication.';

const ICEBERGS = 'Compare les deux fractions : mets-les d’abord au même dénominateur.';

const ICEBERGS_SOMME = 'Mets d’abord les deux fractions au même dénominateur. Puis additionne ou soustrais les numérateurs.';

const ICEBERGS_PRODUIT = 'Calcule, puis simplifie le résultat jusqu’au bout. Pour diviser, multiplie par l’inverse de la deuxième fraction.';

const ETALS = 'Complète le tableau de proportionnalité : passe par le prix d’un seul.';

const ETALS_COEF = 'Complète le tableau : trouve le coefficient qui fait passer d’une colonne à l’autre.';

const REMISES = 'Prends le pourcentage du nombre. Le tableau te rappelle que 100 % est le tout.';

const REMISES_CHANGE = 'Calcule le nouveau prix après la hausse ou la baisse, en deux étapes.';

const BALANCES = 'Vitesse constante : trouve la distance en une heure, puis multiplie.';

const BALANCES_SCALE = 'Échelle : chaque centimètre de la carte vaut la même distance réelle.';

const ETINCELLES = 'Écris la puissance de 10 en nombre : un 1 suivi d’autant de zéros que l’exposant.';

const ETINCELLES_SCI = 'Écris le nombre en notation scientifique : un seul chiffre avant la virgule, fois une puissance de 10.';

const ENCLUME = 'Calcule la puissance : le nombre multiplié par lui-même, autant de fois que l’exposant.';

const ENCLUME_PROD = 'Même base : additionne les exposants pour un produit, soustrais-les pour un quotient.';

const TREMPE = 'Trouve la racine carrée : le nombre qui, multiplié par lui-même, donne celui-ci.';

const TREMPE_PRIME = 'Nombres premiers et diviseurs : la règle et les critères sont affichés.';

const TREMPE_FACTEURS = 'Décompose le nombre en produit de facteurs premiers : divise par 2, puis 3, puis 5, puis 7.';

const REDUIRE = 'Réduis l’expression : regroupe les x entre eux, puis les nombres entre eux.';

const REDUIRE_MIXTE = 'Réduis l’expression : les x d’un côté, les nombres de l’autre, attention aux signes.';

const DEVELOPPER = 'Développe : distribue le nombre à chaque terme de la parenthèse.';

const DEVELOPPER_DOUBLE = 'Développe la double distributivité : chaque terme avec chaque terme, puis réduis.';

const FACTORISER = 'Factorise : trouve ce qui est commun aux deux termes et mets-le devant la parenthèse.';

const EQUILIBRE = 'Trouve x : fais la même opération des deux côtés de l’égalité.';

const EQUILIBRE_DEUX = 'Trouve x en deux étapes : d’abord le nombre seul, puis divise.';

const EQUILIBRE_TEST = 'Remplace x par sa valeur de chaque côté, puis compare les deux résultats.';

const EQUILIBRE_PRODUIT = 'Un produit est nul si l’un de ses facteurs est nul : trouve les deux solutions.';

const PYTHAGORE = 'Trouve l’hypoténuse : hypoténuse au carré égale la somme des carrés des deux autres côtés. La figure est codée.';

const PYTHAGORE_COTE = 'Trouve un côté de l’angle droit : hypoténuse au carré moins l’autre côté au carré, puis racine carrée.';

const THALES = 'Les droites sont parallèles : les longueurs du grand triangle sont celles du petit multipliées par le même nombre.';

const PYTHAGORE_RECIPROQUE = 'Le triangle est-il rectangle ? Compare le carré du plus grand côté à la somme des carrés des deux autres.';

const THALES_RECIPROQUE = 'Les droites sont-elles parallèles ? Calcule les deux coefficients, grand triangle divisé par petit, puis compare-les.';

const TRIGO = 'Choisis le bon rapport pour l’angle B : cosinus, sinus ou tangente. Le rappel est affiché.';

const MOYENNE = 'Calcule la moyenne : additionne toutes les valeurs, puis divise par leur nombre.';

const MEDIANE = 'Médiane ou étendue de la série rangée : la valeur du milieu, ou la plus grande moins la plus petite.';

const CHANCES = 'Probabilité : cas favorables sur cas possibles. Compte-les avant de répondre.';

const RELEVES = 'Lis le diagramme : chaque barre donne un effectif, le nombre d’élèves qui ont fait ce choix.';

const RELEVES_FREQUENCE = 'Trouve la fréquence : l’effectif sur l’effectif total. Additionne d’abord tous les effectifs.';

const RELEVES_POURCENTAGE = 'Donne la fréquence en pourcentage : l’effectif divisé par l’effectif total, puis multiplié par 100.';

const IMAGES = 'Calcule l’image : remplace x par le nombre dans la formule. Le tableau de valeurs t’aide.';

const ANTECEDENT = 'Trouve l’antécédent : résous l’équation f(x) égale le nombre donné.';

const DROITES = 'Coefficient directeur, fonction linéaire ou affine : la règle est affichée.';

const FAISCEAUX = 'Lis l’image sur le graphique : pars du nombre écrit en bas, puis lis le nombre en face, à gauche.';

const FAISCEAUX_ANTECEDENT = 'Lis l’antécédent sur le graphique : pars du nombre écrit à gauche, puis lis le nombre tout en bas.';

const FAISCEAUX_DROITE = 'Lis sur la droite : l’ordonnée à l’origine sur l’axe vertical, le coefficient directeur en comptant les carreaux.';

export const COLLEGE_EXERCISES: ExerciseDef[] = [
  defineData({ biome: 'maths-5e-signed-numbers', type: 'thermometer', level: 1, instruction: THERMO, generators: [compareRelatifs], block: 'maths-5e-signed-numbers' }),
  defineData({ biome: 'maths-5e-signed-numbers', type: 'thermometer', level: 2, instruction: THERMO_READ, generators: [readRelatif], block: 'maths-5e-signed-numbers' }),
  defineData({ biome: 'maths-5e-signed-numbers', type: 'adding', level: 1, instruction: BANQUISE, generators: [addRelatifs], block: 'maths-5e-signed-numbers' }),
  defineData({ biome: 'maths-5e-signed-numbers', type: 'adding', level: 2, instruction: BANQUISE_SUB, generators: [subRelatifs], block: 'maths-5e-signed-numbers' }),
  defineData({ biome: 'maths-5e-signed-numbers', type: 'subtracting', level: 1, instruction: CREVASSES, generators: [mulRelatifs], block: 'maths-5e-signed-numbers' }),
  defineData({ biome: 'maths-5e-signed-numbers', type: 'subtracting', level: 2, instruction: CREVASSES_DIV, generators: [divRelatifs], block: 'maths-5e-signed-numbers' }),
  defineData({ biome: 'maths-5e-signed-numbers', type: 'fractions', level: 1, instruction: ICEBERGS, generators: [compareFractionsC4], block: 'maths-5e-signed-numbers' }),
  defineData({ biome: 'maths-5e-signed-numbers', type: 'fractions', level: 2, instruction: ICEBERGS_SOMME, generators: [addSubFractions], block: 'maths-5e-signed-numbers' }),
  defineData({ biome: 'maths-5e-signed-numbers', type: 'fractions', level: 3, instruction: ICEBERGS_PRODUIT, generators: [mulDivFractions], block: 'maths-5e-signed-numbers' }),
  defineData({ biome: 'maths-5e-proportionality', type: 'proportion-tables', level: 1, instruction: ETALS, generators: [fourthInt], block: 'maths-5e-proportionality' }),
  defineData({ biome: 'maths-5e-proportionality', type: 'proportion-tables', level: 2, instruction: ETALS_COEF, generators: [fourthCoef], block: 'maths-5e-proportionality' }),
  defineData({ biome: 'maths-5e-proportionality', type: 'percentages', level: 1, instruction: REMISES, generators: [percentOf], block: 'maths-5e-proportionality' }),
  defineData({ biome: 'maths-5e-proportionality', type: 'percentages', level: 2, instruction: REMISES_CHANGE, generators: [percentChange], block: 'maths-5e-proportionality' }),
  defineData({ biome: 'maths-5e-proportionality', type: 'ratios', level: 1, instruction: BALANCES, generators: [speed], block: 'maths-5e-proportionality' }),
  defineData({ biome: 'maths-5e-proportionality', type: 'ratios', level: 2, instruction: BALANCES_SCALE, generators: [mapScale], block: 'maths-5e-proportionality' }),
  defineData({ biome: 'maths-4e-powers', type: 'powers', level: 1, instruction: ETINCELLES, generators: [powerOfTen, powerOfTenReverse], block: 'maths-4e-powers' }),
  defineData({ biome: 'maths-4e-powers', type: 'powers', level: 2, instruction: ETINCELLES_SCI, generators: [scientific], block: 'maths-4e-powers' }),
  defineData({ biome: 'maths-4e-powers', type: 'square-roots', level: 1, instruction: ENCLUME, generators: [powerOfNumber], block: 'maths-4e-powers' }),
  defineData({ biome: 'maths-4e-powers', type: 'square-roots', level: 2, instruction: ENCLUME_PROD, generators: [productOfPowers], block: 'maths-4e-powers' }),
  defineData({ biome: 'maths-4e-powers', type: 'scientific-notation', level: 1, instruction: TREMPE, generators: [squareRoot], block: 'maths-4e-powers' }),
  defineData({ biome: 'maths-4e-powers', type: 'scientific-notation', level: 2, instruction: TREMPE_PRIME, generators: [primeOrDivisor], block: 'maths-4e-powers' }),
  defineData({ biome: 'maths-4e-powers', type: 'scientific-notation', level: 3, instruction: TREMPE_FACTEURS, generators: [primeDecomposition], block: 'maths-4e-powers' }),
  defineData({ biome: 'maths-4e-algebra', type: 'simplifying', level: 1, instruction: REDUIRE, generators: [reduceSimple], block: 'maths-4e-algebra' }),
  defineData({ biome: 'maths-4e-algebra', type: 'simplifying', level: 2, instruction: REDUIRE_MIXTE, generators: [reduceMixed], block: 'maths-4e-algebra' }),
  defineData({ biome: 'maths-4e-algebra', type: 'expanding', level: 1, instruction: DEVELOPPER, generators: [developSimple], block: 'maths-4e-algebra' }),
  defineData({ biome: 'maths-4e-algebra', type: 'expanding', level: 2, instruction: DEVELOPPER_DOUBLE, generators: [developDouble], block: 'maths-4e-algebra' }),
  defineData({ biome: 'maths-4e-algebra', type: 'expanding', level: 3, instruction: FACTORISER, generators: [factorNumber, factorX], block: 'maths-4e-algebra' }),
  defineData({ biome: 'maths-4e-algebra', type: 'equations', level: 1, instruction: EQUILIBRE, generators: [equationOneStep], block: 'maths-4e-algebra' }),
  defineData({ biome: 'maths-4e-algebra', type: 'equations', level: 2, instruction: EQUILIBRE_DEUX, generators: [equationTwoSteps], block: 'maths-4e-algebra' }),
  defineData({ biome: 'maths-4e-algebra', type: 'equations', level: 3, instruction: EQUILIBRE_TEST, generators: [testEquality], block: 'maths-4e-algebra' }),
  defineData({ biome: 'maths-4e-algebra', type: 'equations', level: 4, instruction: EQUILIBRE_PRODUIT, generators: [productEquation], block: 'maths-4e-algebra' }),
  defineData({ biome: 'maths-3e-geometry', type: 'pythagoras', level: 1, instruction: PYTHAGORE, generators: [pythagoreHyp], block: 'maths-3e-geometry' }),
  defineData({ biome: 'maths-3e-geometry', type: 'pythagoras', level: 2, instruction: PYTHAGORE_COTE, generators: [pythagoreSide], block: 'maths-3e-geometry' }),
  defineData({ biome: 'maths-3e-geometry', type: 'pythagoras', level: 4, instruction: PYTHAGORE_RECIPROQUE, generators: [reciprocalPythagore], block: 'maths-3e-geometry' }),
  defineData({ biome: 'maths-3e-geometry', type: 'thales', level: 1, instruction: THALES, generators: [thales], block: 'maths-3e-geometry' }),
  defineData({ biome: 'maths-3e-geometry', type: 'thales', level: 3, instruction: THALES_RECIPROQUE, generators: [reciprocalThales], block: 'maths-3e-geometry' }),
  defineData({ biome: 'maths-3e-geometry', type: 'trigonometry', level: 1, instruction: TRIGO, generators: [trigo], block: 'maths-3e-geometry' }),
  defineData({ biome: 'maths-3e-statistics', type: 'mean', level: 1, instruction: MOYENNE, generators: [mean], block: 'maths-3e-statistics' }),
  defineData({ biome: 'maths-3e-statistics', type: 'mean', level: 2, instruction: MEDIANE, generators: [medianRange], block: 'maths-3e-statistics' }),
  defineData({ biome: 'maths-3e-statistics', type: 'probability', level: 1, instruction: CHANCES, generators: [probability], block: 'maths-3e-statistics' }),
  defineData({ biome: 'maths-3e-statistics', type: 'data', level: 1, instruction: RELEVES, generators: [readChart], block: 'maths-3e-statistics' }),
  defineData({ biome: 'maths-3e-statistics', type: 'data', level: 2, instruction: RELEVES_FREQUENCE, generators: [frequencyFraction], block: 'maths-3e-statistics' }),
  defineData({ biome: 'maths-3e-statistics', type: 'data', level: 3, instruction: RELEVES_POURCENTAGE, generators: [frequencyPercent], block: 'maths-3e-statistics' }),
  defineData({ biome: 'maths-3e-functions', type: 'images', level: 1, instruction: IMAGES, generators: [imageOf], block: 'maths-3e-functions' }),
  defineData({ biome: 'maths-3e-functions', type: 'images', level: 2, instruction: ANTECEDENT, generators: [antecedent], block: 'maths-3e-functions' }),
  defineData({ biome: 'maths-3e-functions', type: 'linear', level: 1, instruction: DROITES, generators: [linearOrAffine], block: 'maths-3e-functions' }),
  defineData({ biome: 'maths-3e-functions', type: 'graphs', level: 1, instruction: FAISCEAUX, generators: [graphImage], block: 'maths-3e-functions' }),
  defineData({ biome: 'maths-3e-functions', type: 'graphs', level: 2, instruction: FAISCEAUX_ANTECEDENT, generators: [graphAntecedent], block: 'maths-3e-functions' }),
  defineData({ biome: 'maths-3e-functions', type: 'graphs', level: 3, instruction: FAISCEAUX_DROITE, generators: [graphLine], block: 'maths-3e-functions' }),
];
