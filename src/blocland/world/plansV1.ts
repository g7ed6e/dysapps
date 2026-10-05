// Les plans d’avant le nouveau dessin des bâtiments (version 1 des sauvegardes) : leurs cases (clé « x,y,z » relative à
// l’île : bloc) et leur coffre. La migration des sauvegardes s’en sert (engine.ts, sanitizeState) : un plan terminé avec
// l’ancien dessin reste terminé et son coffre est complété ; les blocs posés hors du nouveau dessin reviennent dans
// l’inventaire. Ne pas modifier un dessin écrit ; un plan redessiné y ajoute l’ancien.
import type { BlockId } from '../biomes';
import { BLOC } from '../biomes';

/** « clé:bloc » séparés par des espaces. */
const V1: Record<string, { cells: string; chest: Partial<Record<BlockId, number>> }> = {
  'maths-4e-algebra-1': {
    cells: '9,11,0:calque 9,13,0:calque 10,11,0:calque 10,13,0:calque 11,11,0:calque 11,12,0:calque 11,13,0:calque 9,11,1:calque 9,12,1:calque 9,13,1:calque 10,11,1:calque 10,13,1:calque 11,11,1:calque 11,12,1:calque 11,13,1:calque 12,11,0:calque 13,11,0:calque 13,12,0:calque 13,13,0:calque 12,13,0:calque',
    chest: { [BLOC.panneau]: 3, [BLOC.porte]: 1, [BLOC.toit]: 15, [BLOC.lanterne]: 1 },
  },
  'maths-4e-algebra-3': {
    cells: '9,10,0:barriere 11,10,0:barriere 12,10,0:barriere 13,10,0:barriere 10,10,0:escalier 9,10,1:lanterne 13,10,1:lanterne 8,13,0:calque 8,11,0:calque',
    chest: { [BLOC.or]: 2, [BLOC.cristal]: 2 },
  },
  'maths-4e-algebra-2': {
    cells: '9,12,0:porte 9,11,2:toit 9,12,2:toit 9,13,2:toit 10,11,2:toit 10,12,2:toit 10,13,2:toit 11,11,2:toit 11,12,2:toit 11,13,2:toit 10,12,3:toit 12,11,1:toit 13,11,1:toit 13,12,1:toit 13,13,1:toit 12,13,1:toit 8,12,0:lanterne',
    chest: { [BLOC.barriere]: 4, [BLOC.escalier]: 1, [BLOC.lanterne]: 2 },
  },
  'english-6e-vocabulary-1': {
    cells: '9,11,0:cabine 9,12,0:cabine 9,13,0:cabine 10,13,0:cabine 11,11,0:cabine 11,12,0:cabine 11,13,0:cabine 9,11,1:cabine 9,12,1:cabine 9,13,1:cabine 10,11,1:cabine 10,13,1:cabine 11,11,1:cabine 11,12,1:cabine 11,13,1:cabine',
    chest: { [BLOC.cadran]: 3, [BLOC.porte]: 1, [BLOC.toit]: 10, [BLOC.lanterne]: 1 },
  },
  'english-6e-vocabulary-3': {
    cells: '8,10,0:barriere 9,10,0:barriere 11,10,0:barriere 12,10,0:barriere 10,10,0:escalier 8,10,1:lanterne 12,10,1:lanterne 8,12,0:cabine 12,12,0:cabine',
    chest: { [BLOC.or]: 2, [BLOC.cristal]: 2 },
  },
  'english-6e-vocabulary-2': {
    cells: '10,11,0:porte 9,11,2:cabine 9,12,2:cabine 9,13,2:cabine 10,11,2:cabine 10,13,2:cabine 11,11,2:cabine 11,12,2:cabine 11,13,2:cabine 9,11,3:toit 9,12,3:toit 9,13,3:toit 10,11,3:toit 10,12,3:toit 10,13,3:toit 11,11,3:toit 11,12,3:toit 11,13,3:toit 10,12,4:toit 12,11,0:lanterne',
    chest: { [BLOC.barriere]: 4, [BLOC.escalier]: 1, [BLOC.lanterne]: 2 },
  },
  'maths-3e-geometry-1': {
    cells: '9,11,0:marbre 9,12,0:marbre 9,13,0:marbre 10,11,0:marbre 10,12,0:marbre 10,13,0:marbre 11,11,0:marbre 11,12,0:marbre 11,13,0:marbre 12,11,0:marbre 12,12,0:marbre 12,13,0:marbre 9,13,1:marbre 10,13,1:marbre 11,13,1:marbre 12,13,1:marbre',
    chest: { [BLOC.ardoise]: 3, [BLOC.toit]: 12, [BLOC.lanterne]: 2 },
  },
  'maths-3e-geometry-3': {
    cells: '8,10,0:barriere 9,10,0:barriere 11,10,0:barriere 12,10,0:barriere 13,10,0:barriere 10,10,0:escalier 8,10,1:lanterne 13,10,1:lanterne 13,12,0:marbre',
    chest: { [BLOC.or]: 2, [BLOC.cristal]: 2 },
  },
  'maths-3e-geometry-2': {
    cells: '9,13,2:marbre 10,13,2:marbre 11,13,2:marbre 12,13,2:marbre 9,11,1:marbre 12,11,1:marbre 9,11,2:marbre 12,11,2:marbre 9,11,3:toit 9,12,3:toit 9,13,3:toit 10,11,3:toit 10,12,3:toit 10,13,3:toit 11,11,3:toit 11,12,3:toit 11,13,3:toit 12,11,3:toit 12,12,3:toit 12,13,3:toit 10,11,1:lanterne 11,11,1:lanterne',
    chest: { [BLOC.barriere]: 5, [BLOC.escalier]: 1, [BLOC.lanterne]: 2 },
  },
  'french-4e-vocabulary-1': {
    cells: '9,11,0:parchemin 9,12,0:parchemin 9,13,0:parchemin 10,11,0:parchemin 10,12,0:parchemin 10,13,0:parchemin 11,11,0:parchemin 11,12,0:parchemin 11,13,0:parchemin 12,11,0:parchemin 12,12,0:parchemin 12,13,0:parchemin 9,13,1:parchemin 10,13,1:parchemin 11,13,1:parchemin 12,13,1:parchemin',
    chest: { [BLOC.calque]: 3, [BLOC.toit]: 12, [BLOC.lanterne]: 2 },
  },
  'french-4e-vocabulary-3': {
    cells: '8,10,0:barriere 9,10,0:barriere 11,10,0:barriere 12,10,0:barriere 13,10,0:barriere 10,10,0:escalier 8,10,1:lanterne 13,10,1:lanterne 13,12,0:parchemin',
    chest: { [BLOC.or]: 2, [BLOC.cristal]: 2 },
  },
  'french-4e-vocabulary-2': {
    cells: '9,13,2:parchemin 10,13,2:parchemin 11,13,2:parchemin 12,13,2:parchemin 9,11,1:parchemin 12,11,1:parchemin 9,11,2:parchemin 12,11,2:parchemin 9,11,3:toit 9,12,3:toit 9,13,3:toit 10,11,3:toit 10,12,3:toit 10,13,3:toit 11,11,3:toit 11,12,3:toit 11,13,3:toit 12,11,3:toit 12,12,3:toit 12,13,3:toit 10,11,1:lanterne 11,11,1:lanterne',
    chest: { [BLOC.barriere]: 5, [BLOC.escalier]: 1, [BLOC.lanterne]: 2 },
  },
  'french-5e-homophones-1': {
    cells: '9,11,0:panneau 9,13,0:panneau 10,11,0:panneau 10,13,0:panneau 11,11,0:panneau 11,12,0:panneau 11,13,0:panneau 9,11,1:panneau 9,12,1:panneau 9,13,1:panneau 10,11,1:panneau 10,13,1:panneau 11,11,1:panneau 11,12,1:panneau 11,13,1:panneau 12,11,0:panneau 13,11,0:panneau 13,12,0:panneau 13,13,0:panneau 12,13,0:panneau',
    chest: { [BLOC.glace]: 3, [BLOC.porte]: 1, [BLOC.toit]: 15, [BLOC.lanterne]: 1 },
  },
  'french-5e-homophones-3': {
    cells: '9,10,0:barriere 11,10,0:barriere 12,10,0:barriere 13,10,0:barriere 10,10,0:escalier 9,10,1:lanterne 13,10,1:lanterne 8,13,0:panneau 8,11,0:panneau',
    chest: { [BLOC.or]: 2, [BLOC.cristal]: 2 },
  },
  'french-5e-homophones-2': {
    cells: '9,12,0:porte 9,11,2:toit 9,12,2:toit 9,13,2:toit 10,11,2:toit 10,12,2:toit 10,13,2:toit 11,11,2:toit 11,12,2:toit 11,13,2:toit 10,12,3:toit 12,11,1:toit 13,11,1:toit 13,12,1:toit 13,13,1:toit 12,13,1:toit 8,12,0:lanterne',
    chest: { [BLOC.barriere]: 4, [BLOC.escalier]: 1, [BLOC.lanterne]: 2 },
  },
  'french-6e-word-spelling-2': {
    cells: '9,11,0:bois 9,11,1:bois 12,11,0:bois 12,11,1:bois 9,13,0:bois 9,13,1:bois 12,13,0:bois 12,13,1:bois 9,11,2:toit 9,12,2:toit 9,13,2:toit 12,11,2:toit 12,12,2:toit 12,13,2:toit 10,11,2:toit 11,11,2:toit 10,11,0:lanterne',
    chest: { [BLOC.barriere]: 3, [BLOC.escalier]: 1, [BLOC.lanterne]: 2 },
  },
  'french-6e-word-spelling-3': {
    cells: '9,10,0:barriere 11,10,0:barriere 12,10,0:barriere 10,10,0:escalier 9,10,1:lanterne 12,10,1:lanterne 8,11,0:sable 13,11,0:sable',
    chest: { [BLOC.or]: 2, [BLOC.cristal]: 2 },
  },
  'french-6e-word-spelling-1': {
    cells: '10,12,0:sable 10,13,0:sable 11,12,0:sable 11,13,0:sable 10,12,1:sable 10,13,1:sable 11,12,1:sable 11,13,1:sable 10,12,2:sable 10,13,2:sable 11,12,2:sable 11,13,2:sable 10,12,3:pierre 10,12,4:pierre',
    chest: { [BLOC.terre]: 3, [BLOC.toit]: 8, [BLOC.lanterne]: 1 },
  },
  'english-3e-grammar-3': {
    cells: '8,10,0:barriere 9,10,0:barriere 11,10,0:barriere 12,10,0:barriere 10,10,0:escalier 8,10,1:lanterne 12,10,1:lanterne 8,12,0:taille 12,12,0:taille',
    chest: { [BLOC.or]: 2, [BLOC.cristal]: 2 },
  },
  'english-3e-grammar-2': {
    cells: '10,11,0:porte 9,11,2:taille 9,12,2:taille 9,13,2:taille 10,11,2:taille 10,13,2:taille 11,11,2:taille 11,12,2:taille 11,13,2:taille 9,11,3:toit 9,12,3:toit 9,13,3:toit 10,11,3:toit 10,12,3:toit 10,13,3:toit 11,11,3:toit 11,12,3:toit 11,13,3:toit 10,12,4:toit 12,11,0:lanterne',
    chest: { [BLOC.barriere]: 4, [BLOC.escalier]: 1, [BLOC.lanterne]: 2 },
  },
  'english-3e-grammar-1': {
    cells: '9,11,0:taille 9,12,0:taille 9,13,0:taille 10,13,0:taille 11,11,0:taille 11,12,0:taille 11,13,0:taille 9,11,1:taille 9,12,1:taille 9,13,1:taille 10,11,1:taille 10,13,1:taille 11,11,1:taille 11,12,1:taille 11,13,1:taille',
    chest: { [BLOC.antenne]: 3, [BLOC.porte]: 1, [BLOC.toit]: 10, [BLOC.lanterne]: 1 },
  },
  'english-5e-vocabulary-1': {
    cells: '9,11,0:tuile 9,12,0:tuile 9,13,0:tuile 10,13,0:tuile 11,11,0:tuile 11,12,0:tuile 11,13,0:tuile 9,11,1:tuile 9,12,1:tuile 9,13,1:tuile 10,11,1:tuile 10,13,1:tuile 11,11,1:tuile 11,12,1:tuile 11,13,1:tuile',
    chest: { [BLOC.lambris]: 3, [BLOC.porte]: 1, [BLOC.toit]: 10, [BLOC.lanterne]: 1 },
  },
  'english-5e-vocabulary-3': {
    cells: '8,10,0:barriere 9,10,0:barriere 11,10,0:barriere 12,10,0:barriere 10,10,0:escalier 8,10,1:lanterne 12,10,1:lanterne 8,12,0:tuile 12,12,0:tuile',
    chest: { [BLOC.or]: 2, [BLOC.cristal]: 2 },
  },
  'english-5e-vocabulary-2': {
    cells: '10,11,0:porte 9,11,2:tuile 9,12,2:tuile 9,13,2:tuile 10,11,2:tuile 10,13,2:tuile 11,11,2:tuile 11,12,2:tuile 11,13,2:tuile 9,11,3:toit 9,12,3:toit 9,13,3:toit 10,11,3:toit 10,12,3:toit 10,13,3:toit 11,11,3:toit 11,12,3:toit 11,13,3:toit 10,12,4:toit 12,11,0:lanterne',
    chest: { [BLOC.barriere]: 4, [BLOC.escalier]: 1, [BLOC.lanterne]: 2 },
  },
  'maths-3e-statistics-1': {
    cells: '9,11,0:quartz 9,12,0:quartz 9,13,0:quartz 10,13,0:quartz 11,11,0:quartz 11,12,0:quartz 11,13,0:quartz 9,11,1:quartz 9,12,1:quartz 9,13,1:quartz 10,11,1:quartz 10,13,1:quartz 11,11,1:quartz 11,12,1:quartz 11,13,1:quartz',
    chest: { [BLOC.parchemin]: 3, [BLOC.porte]: 1, [BLOC.lanterne]: 2 },
  },
  'maths-3e-statistics-3': {
    cells: '8,10,0:barriere 9,10,0:barriere 11,10,0:barriere 12,10,0:barriere 10,10,0:escalier 8,10,1:lanterne 12,10,1:lanterne 8,13,0:quartz 12,13,0:quartz',
    chest: { [BLOC.or]: 2, [BLOC.cristal]: 2 },
  },
  'maths-3e-statistics-2': {
    cells: '10,11,0:porte 9,11,2:quartz 9,12,2:quartz 9,13,2:quartz 10,11,2:quartz 10,12,2:quartz 10,13,2:quartz 11,11,2:quartz 11,12,2:quartz 11,13,2:quartz 10,11,3:quartz 9,12,3:quartz 10,12,3:quartz 11,12,3:quartz 10,13,3:quartz 10,12,4:quartz 8,12,0:lanterne 12,12,0:lanterne',
    chest: { [BLOC.barriere]: 4, [BLOC.escalier]: 1, [BLOC.lanterne]: 2 },
  },
  'french-4e-agreement-1': {
    cells: '9,11,0:ardoise 9,12,0:ardoise 9,13,0:ardoise 10,13,0:ardoise 11,11,0:ardoise 11,13,0:ardoise 12,11,0:ardoise 12,12,0:ardoise 12,13,0:ardoise 9,11,1:ardoise 9,12,1:ardoise 9,13,1:ardoise 10,11,1:ardoise 10,13,1:ardoise 11,11,1:ardoise 11,13,1:ardoise 12,11,1:ardoise 12,12,1:ardoise 12,13,1:ardoise',
    chest: { [BLOC.acier]: 3, [BLOC.porte]: 1, [BLOC.toit]: 12, [BLOC.lanterne]: 1 },
  },
  'french-4e-agreement-3': {
    cells: '8,10,0:barriere 9,10,0:barriere 11,10,0:barriere 12,10,0:barriere 13,10,0:barriere 10,10,0:escalier 8,10,1:lanterne 13,10,1:lanterne 8,12,0:ardoise',
    chest: { [BLOC.or]: 2, [BLOC.cristal]: 2 },
  },
  'french-4e-agreement-2': {
    cells: '10,11,0:porte 9,11,2:toit 9,13,2:toit 10,11,2:toit 10,13,2:toit 11,11,2:toit 11,13,2:toit 12,11,2:toit 12,13,2:toit 9,12,3:toit 10,12,3:toit 11,12,3:toit 12,12,3:toit 13,12,0:lanterne',
    chest: { [BLOC.barriere]: 5, [BLOC.escalier]: 1, [BLOC.lanterne]: 2 },
  },
  'french-6e-grammar-spelling-3': {
    cells: '8,10,0:barriere 9,10,0:barriere 11,10,0:barriere 12,10,0:barriere 13,10,0:barriere 10,10,0:escalier 8,10,1:lanterne 13,10,1:lanterne 8,12,0:terre 13,12,0:terre',
    chest: { [BLOC.or]: 2, [BLOC.cristal]: 2 },
  },
  'french-6e-grammar-spelling-1': {
    cells: '9,11,0:terre 9,12,0:terre 9,13,0:terre 10,13,0:terre 11,11,0:terre 11,13,0:terre 12,11,0:terre 12,12,0:terre 12,13,0:terre 9,11,1:bois 12,11,1:bois 9,13,1:bois 12,13,1:bois',
    chest: { [BLOC.verre]: 3, [BLOC.toit]: 12, [BLOC.porte]: 1, [BLOC.lanterne]: 1 },
  },
  'french-6e-grammar-spelling-2': {
    cells: '9,11,2:toit 9,12,2:toit 9,13,2:toit 10,11,2:toit 10,12,2:toit 10,13,2:toit 11,11,2:toit 11,12,2:toit 11,13,2:toit 12,11,2:toit 12,12,2:toit 12,13,2:toit 10,11,0:porte 11,11,1:lanterne 10,11,1:bois 9,12,1:terre 12,12,1:terre',
    chest: { [BLOC.barriere]: 5, [BLOC.escalier]: 1, [BLOC.lanterne]: 2 },
  },
  'french-6e-phonology-1': {
    cells: '9,11,0:bois 9,12,0:bois 9,13,0:bois 10,13,0:bois 11,11,0:bois 11,12,0:bois 11,13,0:bois 9,11,1:bois 9,12,1:bois 9,13,1:bois 10,11,1:bois 10,12,1:bois 10,13,1:bois 11,11,1:bois 11,12,1:bois 11,13,1:bois',
    chest: { [BLOC.pierre]: 3, [BLOC.toit]: 9, [BLOC.porte]: 1, [BLOC.lanterne]: 1 },
  },
  'french-6e-phonology-3': {
    cells: '8,10,0:barriere 9,10,0:barriere 11,10,0:barriere 12,10,0:barriere 10,10,0:escalier 8,10,1:lanterne 12,10,1:lanterne 8,12,0:bois 12,13,0:bois',
    chest: { [BLOC.or]: 2, [BLOC.cristal]: 2 },
  },
  'french-6e-phonology-2': {
    cells: '9,11,2:toit 9,12,2:toit 9,13,2:toit 10,11,2:toit 10,13,2:toit 11,11,2:toit 11,12,2:toit 11,13,2:toit 10,12,3:toit 10,11,0:porte 12,11,0:lanterne 8,11,0:bois 12,12,0:bois',
    chest: { [BLOC.barriere]: 4, [BLOC.escalier]: 1, [BLOC.lanterne]: 2 },
  },
  'maths-4e-powers-1': {
    cells: '9,11,0:acier 9,13,0:acier 10,11,0:acier 10,13,0:acier 11,11,0:acier 11,12,0:acier 11,13,0:acier 9,11,1:acier 9,12,1:acier 9,13,1:acier 10,11,1:acier 10,13,1:acier 11,11,1:acier 11,12,1:acier 11,13,1:acier 12,11,0:acier 13,11,0:acier 13,12,0:acier 13,13,0:acier 12,13,0:acier',
    chest: { [BLOC.tourbe]: 3, [BLOC.porte]: 1, [BLOC.toit]: 15, [BLOC.lanterne]: 1 },
  },
  'maths-4e-powers-3': {
    cells: '9,10,0:barriere 11,10,0:barriere 12,10,0:barriere 13,10,0:barriere 10,10,0:escalier 9,10,1:lanterne 13,10,1:lanterne 8,13,0:acier 8,11,0:acier',
    chest: { [BLOC.or]: 2, [BLOC.cristal]: 2 },
  },
  'maths-4e-powers-2': {
    cells: '9,12,0:porte 9,11,2:toit 9,12,2:toit 9,13,2:toit 10,11,2:toit 10,12,2:toit 10,13,2:toit 11,11,2:toit 11,12,2:toit 11,13,2:toit 10,12,3:toit 12,11,1:toit 13,11,1:toit 13,12,1:toit 13,13,1:toit 12,13,1:toit 8,12,0:lanterne',
    chest: { [BLOC.barriere]: 4, [BLOC.escalier]: 1, [BLOC.lanterne]: 2 },
  },
  'english-4e-grammar-1': {
    cells: '9,11,0:rail 9,12,0:rail 9,13,0:rail 10,13,0:rail 11,11,0:rail 11,12,0:rail 11,13,0:rail 9,11,1:rail 9,12,1:rail 9,13,1:rail 10,11,1:rail 10,13,1:rail 11,11,1:rail 11,12,1:rail 11,13,1:rail',
    chest: { [BLOC.velours]: 3, [BLOC.porte]: 1, [BLOC.toit]: 10, [BLOC.lanterne]: 1 },
  },
  'english-4e-grammar-3': {
    cells: '8,10,0:barriere 9,10,0:barriere 11,10,0:barriere 12,10,0:barriere 10,10,0:escalier 8,10,1:lanterne 12,10,1:lanterne 8,12,0:rail 12,12,0:rail',
    chest: { [BLOC.or]: 2, [BLOC.cristal]: 2 },
  },
  'english-4e-grammar-2': {
    cells: '10,11,0:porte 9,11,2:rail 9,12,2:rail 9,13,2:rail 10,11,2:rail 10,13,2:rail 11,11,2:rail 11,12,2:rail 11,13,2:rail 9,11,3:toit 9,12,3:toit 9,13,3:toit 10,11,3:toit 10,12,3:toit 10,13,3:toit 11,11,3:toit 11,12,3:toit 11,13,3:toit 10,12,4:toit 12,11,0:lanterne',
    chest: { [BLOC.barriere]: 4, [BLOC.escalier]: 1, [BLOC.lanterne]: 2 },
  },
  'maths-5e-signed-numbers-1': {
    cells: '9,11,0:glace 9,12,0:glace 9,13,0:glace 10,13,0:glace 11,11,0:glace 11,12,0:glace 11,13,0:glace 9,11,1:glace 9,12,1:glace 9,13,1:glace 10,11,1:glace 10,13,1:glace 11,11,1:glace 11,12,1:glace 11,13,1:glace',
    chest: { [BLOC.brique]: 3, [BLOC.porte]: 1, [BLOC.lanterne]: 2 },
  },
  'maths-5e-signed-numbers-3': {
    cells: '8,10,0:barriere 9,10,0:barriere 11,10,0:barriere 12,10,0:barriere 10,10,0:escalier 8,10,1:lanterne 12,10,1:lanterne 8,13,0:glace 12,13,0:glace',
    chest: { [BLOC.or]: 2, [BLOC.cristal]: 2 },
  },
  'maths-5e-signed-numbers-2': {
    cells: '10,11,0:porte 9,11,2:glace 9,12,2:glace 9,13,2:glace 10,11,2:glace 10,12,2:glace 10,13,2:glace 11,11,2:glace 11,12,2:glace 11,13,2:glace 10,11,3:glace 9,12,3:glace 10,12,3:glace 11,12,3:glace 10,13,3:glace 10,12,4:glace 8,12,0:lanterne 12,12,0:lanterne',
    chest: { [BLOC.barriere]: 4, [BLOC.escalier]: 1, [BLOC.lanterne]: 2 },
  },
  'english-6e-grammar-3': {
    cells: '8,10,0:barriere 9,10,0:barriere 11,10,0:barriere 12,10,0:barriere 10,10,0:escalier 8,10,1:lanterne 12,10,1:lanterne 8,12,0:cadran 12,12,0:cadran',
    chest: { [BLOC.or]: 2, [BLOC.cristal]: 2 },
  },
  'english-6e-grammar-2': {
    cells: '10,11,0:porte 9,11,2:cadran 9,12,2:cadran 9,13,2:cadran 10,11,2:cadran 10,13,2:cadran 11,11,2:cadran 11,12,2:cadran 11,13,2:cadran 9,11,3:toit 9,12,3:toit 9,13,3:toit 10,11,3:toit 10,12,3:toit 10,13,3:toit 11,11,3:toit 11,12,3:toit 11,13,3:toit 10,12,4:toit 12,11,0:lanterne',
    chest: { [BLOC.barriere]: 4, [BLOC.escalier]: 1, [BLOC.lanterne]: 2 },
  },
  'english-6e-grammar-1': {
    cells: '9,11,0:cadran 9,12,0:cadran 9,13,0:cadran 10,13,0:cadran 11,11,0:cadran 11,12,0:cadran 11,13,0:cadran 9,11,1:cadran 9,12,1:cadran 9,13,1:cadran 10,11,1:cadran 10,13,1:cadran 11,11,1:cadran 11,12,1:cadran 11,13,1:cadran',
    chest: { [BLOC.cabine]: 3, [BLOC.porte]: 1, [BLOC.toit]: 10, [BLOC.lanterne]: 1 },
  },
  'english-5e-grammar-3': {
    cells: '8,10,0:barriere 9,10,0:barriere 11,10,0:barriere 12,10,0:barriere 10,10,0:escalier 8,10,1:lanterne 12,10,1:lanterne 8,12,0:lambris 12,12,0:lambris',
    chest: { [BLOC.or]: 2, [BLOC.cristal]: 2 },
  },
  'english-5e-grammar-1': {
    cells: '9,11,0:lambris 9,12,0:lambris 9,13,0:lambris 10,13,0:lambris 11,11,0:lambris 11,12,0:lambris 11,13,0:lambris 9,11,1:lambris 9,12,1:lambris 9,13,1:lambris 10,11,1:lambris 10,13,1:lambris 11,11,1:lambris 11,12,1:lambris 11,13,1:lambris',
    chest: { [BLOC.tuile]: 3, [BLOC.porte]: 1, [BLOC.toit]: 10, [BLOC.lanterne]: 1 },
  },
  'english-5e-grammar-2': {
    cells: '10,11,0:porte 9,11,2:lambris 9,12,2:lambris 9,13,2:lambris 10,11,2:lambris 10,13,2:lambris 11,11,2:lambris 11,12,2:lambris 11,13,2:lambris 9,11,3:toit 9,12,3:toit 9,13,3:toit 10,11,3:toit 10,12,3:toit 10,13,3:toit 11,11,3:toit 11,12,3:toit 11,13,3:toit 10,12,4:toit 12,11,0:lanterne',
    chest: { [BLOC.barriere]: 4, [BLOC.escalier]: 1, [BLOC.lanterne]: 2 },
  },
  'french-5e-conjugation-1': {
    cells: '9,11,0:tourbe 9,12,0:tourbe 9,13,0:tourbe 10,13,0:tourbe 11,11,0:tourbe 11,13,0:tourbe 12,11,0:tourbe 12,12,0:tourbe 12,13,0:tourbe 9,11,1:tourbe 9,12,1:tourbe 9,13,1:tourbe 10,11,1:tourbe 10,13,1:tourbe 11,11,1:tourbe 11,13,1:tourbe 12,11,1:tourbe 12,12,1:tourbe 12,13,1:tourbe',
    chest: { [BLOC.toile]: 3, [BLOC.porte]: 1, [BLOC.toit]: 12, [BLOC.lanterne]: 1 },
  },
  'french-5e-conjugation-3': {
    cells: '8,10,0:barriere 9,10,0:barriere 11,10,0:barriere 12,10,0:barriere 13,10,0:barriere 10,10,0:escalier 8,10,1:lanterne 13,10,1:lanterne 8,12,0:tourbe',
    chest: { [BLOC.or]: 2, [BLOC.cristal]: 2 },
  },
  'french-5e-conjugation-2': {
    cells: '10,11,0:porte 9,11,2:toit 9,13,2:toit 10,11,2:toit 10,13,2:toit 11,11,2:toit 11,13,2:toit 12,11,2:toit 12,13,2:toit 9,12,3:toit 10,12,3:toit 11,12,3:toit 12,12,3:toit 13,12,0:lanterne',
    chest: { [BLOC.barriere]: 5, [BLOC.escalier]: 1, [BLOC.lanterne]: 2 },
  },
  'maths-5e-proportionality-1': {
    cells: '9,11,0:toile 9,12,0:toile 9,13,0:toile 10,11,0:toile 10,12,0:toile 10,13,0:toile 11,11,0:toile 11,12,0:toile 11,13,0:toile 12,11,0:toile 12,12,0:toile 12,13,0:toile 9,13,1:toile 10,13,1:toile 11,13,1:toile 12,13,1:toile',
    chest: { [BLOC.galet]: 3, [BLOC.toit]: 12, [BLOC.lanterne]: 2 },
  },
  'maths-5e-proportionality-3': {
    cells: '8,10,0:barriere 9,10,0:barriere 11,10,0:barriere 12,10,0:barriere 13,10,0:barriere 10,10,0:escalier 8,10,1:lanterne 13,10,1:lanterne 13,12,0:toile',
    chest: { [BLOC.or]: 2, [BLOC.cristal]: 2 },
  },
  'maths-5e-proportionality-2': {
    cells: '9,13,2:toile 10,13,2:toile 11,13,2:toile 12,13,2:toile 9,11,1:toile 12,11,1:toile 9,11,2:toile 12,11,2:toile 9,11,3:toit 9,12,3:toit 9,13,3:toit 10,11,3:toit 10,12,3:toit 10,13,3:toit 11,11,3:toit 11,12,3:toit 11,13,3:toit 12,11,3:toit 12,12,3:toit 12,13,3:toit 10,11,1:lanterne 11,11,1:lanterne',
    chest: { [BLOC.barriere]: 5, [BLOC.escalier]: 1, [BLOC.lanterne]: 2 },
  },
  'french-6e-letter-confusion-3': {
    cells: '8,10,0:barriere 9,10,0:barriere 11,10,0:barriere 12,10,0:barriere 10,10,0:escalier 8,10,1:lanterne 12,10,1:lanterne 8,12,0:pierre 12,12,0:pierre',
    chest: { [BLOC.or]: 2, [BLOC.cristal]: 2 },
  },
  'french-6e-letter-confusion-1': {
    cells: '9,11,0:pierre 9,12,0:pierre 9,13,0:pierre 10,13,0:pierre 11,11,0:pierre 11,12,0:pierre 11,13,0:pierre 9,11,1:pierre 9,12,1:pierre 9,13,1:pierre 10,11,1:pierre 10,13,1:pierre 11,11,1:pierre 11,12,1:pierre 11,13,1:pierre 9,12,2:bois 10,12,2:bois 11,12,2:bois',
    chest: { [BLOC.sable]: 3, [BLOC.toit]: 15, [BLOC.porte]: 1, [BLOC.lanterne]: 1 },
  },
  'french-6e-letter-confusion-2': {
    cells: '9,11,2:toit 9,13,2:toit 10,11,2:toit 10,13,2:toit 11,11,2:toit 11,13,2:toit 9,11,3:toit 9,12,3:toit 9,13,3:toit 10,11,3:toit 10,12,3:toit 10,13,3:toit 11,11,3:toit 11,12,3:toit 11,13,3:toit 10,11,0:porte 12,11,0:lanterne 8,11,0:pierre',
    chest: { [BLOC.barriere]: 4, [BLOC.escalier]: 1, [BLOC.lanterne]: 2 },
  },
  'maths-3e-functions-3': {
    cells: '8,10,0:barriere 9,10,0:barriere 11,10,0:barriere 12,10,0:barriere 10,10,0:escalier 8,10,1:lanterne 12,10,1:lanterne 8,12,0:prisme 12,12,0:prisme',
    chest: { [BLOC.or]: 2, [BLOC.cristal]: 2 },
  },
  'maths-3e-functions-1': {
    cells: '9,11,0:prisme 9,12,0:prisme 9,13,0:prisme 10,13,0:prisme 11,11,0:prisme 11,12,0:prisme 11,13,0:prisme 9,11,1:prisme 9,12,1:prisme 9,13,1:prisme 10,11,1:prisme 10,13,1:prisme 11,11,1:prisme 11,12,1:prisme 11,13,1:prisme',
    chest: { [BLOC.marbre]: 3, [BLOC.porte]: 1, [BLOC.toit]: 10, [BLOC.lanterne]: 1 },
  },
  'maths-3e-functions-2': {
    cells: '10,11,0:porte 9,11,2:prisme 9,12,2:prisme 9,13,2:prisme 10,11,2:prisme 10,13,2:prisme 11,11,2:prisme 11,12,2:prisme 11,13,2:prisme 9,11,3:toit 9,12,3:toit 9,13,3:toit 10,11,3:toit 10,12,3:toit 10,13,3:toit 11,11,3:toit 11,12,3:toit 11,13,3:toit 10,12,4:toit 12,11,0:lanterne',
    chest: { [BLOC.barriere]: 4, [BLOC.escalier]: 1, [BLOC.lanterne]: 2 },
  },
  'maths-6e-calculation-3': {
    cells: '8,10,0:barriere 9,10,0:barriere 11,10,0:barriere 12,10,0:barriere 10,10,0:escalier 8,10,1:lanterne 12,10,1:lanterne 8,13,0:brique 12,13,0:brique',
    chest: { [BLOC.or]: 2, [BLOC.cristal]: 2 },
  },
  'maths-6e-calculation-1': {
    cells: '9,11,0:brique 9,12,0:brique 9,13,0:brique 10,13,0:brique 11,11,0:brique 11,12,0:brique 11,13,0:brique 9,11,1:brique 9,12,1:brique 9,13,1:brique 10,11,1:brique 10,13,1:brique 11,11,1:brique 11,12,1:brique 11,13,1:brique',
    chest: { [BLOC.bois]: 3, [BLOC.porte]: 1, [BLOC.lanterne]: 2 },
  },
  'maths-6e-calculation-2': {
    cells: '10,11,0:porte 9,11,2:brique 9,12,2:brique 9,13,2:brique 10,11,2:brique 10,12,2:brique 10,13,2:brique 11,11,2:brique 11,12,2:brique 11,13,2:brique 10,11,3:brique 9,12,3:brique 10,12,3:brique 11,12,3:brique 10,13,3:brique 10,12,4:brique 8,12,0:lanterne 12,12,0:lanterne',
    chest: { [BLOC.barriere]: 4, [BLOC.escalier]: 1, [BLOC.lanterne]: 2 },
  },
  'maths-6e-fractions-1': {
    cells: '9,11,0:galet 9,12,0:galet 9,13,0:galet 10,13,0:galet 11,11,0:galet 11,13,0:galet 12,11,0:galet 12,12,0:galet 12,13,0:galet 9,11,1:galet 9,12,1:galet 9,13,1:galet 10,11,1:galet 10,13,1:galet 11,11,1:galet 11,13,1:galet 12,11,1:galet 12,12,1:galet 12,13,1:galet',
    chest: { [BLOC.pierre]: 3, [BLOC.porte]: 1, [BLOC.toit]: 12, [BLOC.lanterne]: 1 },
  },
  'maths-6e-fractions-3': {
    cells: '8,10,0:barriere 9,10,0:barriere 11,10,0:barriere 12,10,0:barriere 13,10,0:barriere 10,10,0:escalier 8,10,1:lanterne 13,10,1:lanterne 8,12,0:galet',
    chest: { [BLOC.or]: 2, [BLOC.cristal]: 2 },
  },
  'maths-6e-fractions-2': {
    cells: '10,11,0:porte 9,11,2:toit 9,13,2:toit 10,11,2:toit 10,13,2:toit 11,11,2:toit 11,13,2:toit 12,11,2:toit 12,13,2:toit 9,12,3:toit 10,12,3:toit 11,12,3:toit 12,12,3:toit 13,12,0:lanterne',
    chest: { [BLOC.barriere]: 5, [BLOC.escalier]: 1, [BLOC.lanterne]: 2 },
  },
  'english-3e-comprehension-1': {
    cells: '9,11,0:antenne 9,12,0:antenne 9,13,0:antenne 10,13,0:antenne 11,11,0:antenne 11,12,0:antenne 11,13,0:antenne 9,11,1:antenne 9,12,1:antenne 9,13,1:antenne 10,11,1:antenne 10,13,1:antenne 11,11,1:antenne 11,12,1:antenne 11,13,1:antenne',
    chest: { [BLOC.taille]: 3, [BLOC.porte]: 1, [BLOC.toit]: 10, [BLOC.lanterne]: 1 },
  },
  'english-3e-comprehension-3': {
    cells: '8,10,0:barriere 9,10,0:barriere 11,10,0:barriere 12,10,0:barriere 10,10,0:escalier 8,10,1:lanterne 12,10,1:lanterne 8,12,0:antenne 12,12,0:antenne',
    chest: { [BLOC.or]: 2, [BLOC.cristal]: 2 },
  },
  'english-3e-comprehension-2': {
    cells: '10,11,0:porte 9,11,2:antenne 9,12,2:antenne 9,13,2:antenne 10,11,2:antenne 10,13,2:antenne 11,11,2:antenne 11,12,2:antenne 11,13,2:antenne 9,11,3:toit 9,12,3:toit 9,13,3:toit 10,11,3:toit 10,12,3:toit 10,13,3:toit 11,11,3:toit 11,12,3:toit 11,13,3:toit 10,12,4:toit 12,11,0:lanterne',
    chest: { [BLOC.barriere]: 4, [BLOC.escalier]: 1, [BLOC.lanterne]: 2 },
  },
  'french-3e-close-reading-3': {
    cells: '8,10,0:barriere 9,10,0:barriere 11,10,0:barriere 12,10,0:barriere 10,10,0:escalier 8,10,1:lanterne 12,10,1:lanterne 8,12,0:lentille 12,12,0:lentille',
    chest: { [BLOC.or]: 2, [BLOC.cristal]: 2 },
  },
  'french-3e-close-reading-1': {
    cells: '9,11,0:lentille 9,12,0:lentille 9,13,0:lentille 10,13,0:lentille 11,11,0:lentille 11,12,0:lentille 11,13,0:lentille 9,11,1:lentille 9,12,1:lentille 9,13,1:lentille 10,11,1:lentille 10,13,1:lentille 11,11,1:lentille 11,12,1:lentille 11,13,1:lentille',
    chest: { [BLOC.quartz]: 3, [BLOC.porte]: 1, [BLOC.toit]: 10, [BLOC.lanterne]: 1 },
  },
  'french-3e-close-reading-2': {
    cells: '10,11,0:porte 9,11,2:lentille 9,12,2:lentille 9,13,2:lentille 10,11,2:lentille 10,13,2:lentille 11,11,2:lentille 11,12,2:lentille 11,13,2:lentille 9,11,3:toit 9,12,3:toit 9,13,3:toit 10,11,3:toit 10,12,3:toit 10,13,3:toit 11,11,3:toit 11,12,3:toit 11,13,3:toit 10,12,4:toit 12,11,0:lanterne',
    chest: { [BLOC.barriere]: 4, [BLOC.escalier]: 1, [BLOC.lanterne]: 2 },
  },
  'english-4e-comprehension-1': {
    cells: '9,11,0:velours 9,12,0:velours 9,13,0:velours 10,13,0:velours 11,11,0:velours 11,12,0:velours 11,13,0:velours 9,11,1:velours 9,12,1:velours 9,13,1:velours 10,11,1:velours 10,13,1:velours 11,11,1:velours 11,12,1:velours 11,13,1:velours',
    chest: { [BLOC.rail]: 3, [BLOC.porte]: 1, [BLOC.toit]: 10, [BLOC.lanterne]: 1 },
  },
  'english-4e-comprehension-3': {
    cells: '8,10,0:barriere 9,10,0:barriere 11,10,0:barriere 12,10,0:barriere 10,10,0:escalier 8,10,1:lanterne 12,10,1:lanterne 8,12,0:velours 12,12,0:velours',
    chest: { [BLOC.or]: 2, [BLOC.cristal]: 2 },
  },
  'english-4e-comprehension-2': {
    cells: '10,11,0:porte 9,11,2:velours 9,12,2:velours 9,13,2:velours 10,11,2:velours 10,13,2:velours 11,11,2:velours 11,12,2:velours 11,13,2:velours 9,11,3:toit 9,12,3:toit 9,13,3:toit 10,11,3:toit 10,12,3:toit 10,13,3:toit 11,11,3:toit 11,12,3:toit 11,13,3:toit 10,12,4:toit 12,11,0:lanterne',
    chest: { [BLOC.barriere]: 4, [BLOC.escalier]: 1, [BLOC.lanterne]: 2 },
  },
  'french-6e-reading-2': {
    cells: '11,11,3:lanterne 10,12,3:lanterne 10,11,4:toit 10,12,4:toit 11,11,4:toit 11,12,4:toit 10,11,5:toit 10,10,0:porte 11,10,0:pierre',
    chest: { [BLOC.barriere]: 4, [BLOC.escalier]: 1, [BLOC.lanterne]: 2 },
  },
  'french-6e-reading-1': {
    cells: '10,11,0:pierre 10,12,0:pierre 11,11,0:pierre 11,12,0:pierre 10,11,1:verre 10,12,1:verre 11,11,1:verre 11,12,1:verre 10,11,2:verre 10,12,2:verre 11,11,2:verre 11,12,2:verre 10,11,3:verre 11,12,3:verre',
    chest: { [BLOC.bois]: 4, [BLOC.lanterne]: 2, [BLOC.toit]: 5, [BLOC.porte]: 1 },
  },
  'french-6e-reading-3': {
    cells: '8,10,0:barriere 9,10,0:barriere 12,10,0:barriere 13,10,0:barriere 8,10,1:lanterne 13,10,1:lanterne 9,11,0:escalier 8,11,0:verre 13,11,0:verre',
    chest: { [BLOC.or]: 3, [BLOC.cristal]: 3 },
  },
  'maths-6e-decimals-1': {
    cells: '9,11,0:obsidienne 9,12,0:obsidienne 9,13,0:obsidienne 10,13,0:obsidienne 11,11,0:obsidienne 11,12,0:obsidienne 11,13,0:obsidienne 9,11,1:obsidienne 9,12,1:obsidienne 9,13,1:obsidienne 10,11,1:obsidienne 10,13,1:obsidienne 11,11,1:obsidienne 11,12,1:obsidienne 11,13,1:obsidienne',
    chest: { [BLOC.terre]: 3, [BLOC.porte]: 1, [BLOC.lanterne]: 2 },
  },
  'maths-6e-decimals-3': {
    cells: '8,10,0:barriere 9,10,0:barriere 11,10,0:barriere 12,10,0:barriere 10,10,0:escalier 8,10,1:lanterne 12,10,1:lanterne 8,13,0:obsidienne 12,13,0:obsidienne',
    chest: { [BLOC.or]: 2, [BLOC.cristal]: 2 },
  },
  'maths-6e-decimals-2': {
    cells: '10,11,0:porte 9,11,2:obsidienne 9,12,2:obsidienne 9,13,2:obsidienne 10,11,2:obsidienne 10,12,2:obsidienne 10,13,2:obsidienne 11,11,2:obsidienne 11,12,2:obsidienne 11,13,2:obsidienne 10,11,3:obsidienne 9,12,3:obsidienne 10,12,3:obsidienne 11,12,3:obsidienne 10,13,3:obsidienne 10,12,4:obsidienne 8,12,0:lanterne 12,12,0:lanterne',
    chest: { [BLOC.barriere]: 4, [BLOC.escalier]: 1, [BLOC.lanterne]: 2 },
  },
  // Le réacteur du Bloc-Navire d’avant le 5 octobre 2026, derrière la poupe (il est passé sous la coque) : clés du quai
  // des Anciens Ateliers (`ORIGINE_DU_QUAI`), coffre inchangé.
  'navire-reacteur': {
    cells: '16,-6,-7:acier 16,-6,-6:acier 16,-6,-5:acier 16,-5,-7:acier 16,-5,-6:acier 16,-5,-5:acier 17,-6,-7:acier 17,-6,-6:acier 17,-6,-5:acier 17,-5,-7:acier 17,-5,-6:acier 17,-5,-5:acier 18,-6,-7:acier 18,-6,-6:acier 18,-6,-5:acier 18,-5,-7:acier 18,-5,-6:acier 18,-5,-5:acier 15,-6,-6:calque 19,-6,-6:calque 15,-5,-5:calque 19,-5,-5:calque 16,-4,-6:ardoise 17,-4,-6:ardoise 18,-4,-6:ardoise',
    chest: { [BLOC.lanterne]: 3 },
  },
};

export interface PlanV1 {
  /** Clé « x,y,z » relative à l’île → bloc. */
  blocks: Map<string, BlockId>;
  chest: Partial<Record<BlockId, number>>;
}

const cache = new Map<string, PlanV1>();
/** L’ancien dessin d’un plan des îles ou du réacteur du Bloc-Navire, ou `undefined` (autres étapes, plans inconnus). */
export function planV1(id: string): PlanV1 | undefined {
  const raw = V1[id];
  if (!raw) return undefined;
  let v = cache.get(id);
  if (!v) {
    // Les cases gardent le mot de Blocland du bloc (`bois`) : `BLOC` le traduit en identifiant neutre.
    const cell = (c: string): [string, BlockId] => {
      const [key, word] = c.split(':');
      return [key, BLOC[word as keyof typeof BLOC]];
    };
    v = { blocks: new Map(raw.cells.split(' ').map(cell)), chest: raw.chest };
    cache.set(id, v);
  }
  return v;
}
