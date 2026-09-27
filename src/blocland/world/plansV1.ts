// Les plans d’avant le nouveau dessin des bâtiments (version 1 des sauvegardes) : leurs cases (clé « x,y,z » relative à
// l’île : bloc) et leur coffre. La migration des sauvegardes s’en sert (engine.ts, sanitizeState) : un plan terminé avec
// l’ancien dessin reste terminé et son coffre est complété ; les blocs posés hors du nouveau dessin reviennent dans
// l’inventaire. Ne pas modifier.
import type { BlockId } from '../biomes';

/** « clé:bloc » séparés par des espaces. */
const V1: Record<string, { cells: string; chest: Partial<Record<BlockId, number>> }> = {
  'atelier-bureau': {
    cells: '9,11,0:calque 9,13,0:calque 10,11,0:calque 10,13,0:calque 11,11,0:calque 11,12,0:calque 11,13,0:calque 9,11,1:calque 9,12,1:calque 9,13,1:calque 10,11,1:calque 10,13,1:calque 11,11,1:calque 11,12,1:calque 11,13,1:calque 12,11,0:calque 13,11,0:calque 13,12,0:calque 13,13,0:calque 12,13,0:calque',
    chest: { panneau: 3, porte: 1, toit: 15, lanterne: 1 },
  },
  'atelier-terrasse': {
    cells: '9,10,0:barriere 11,10,0:barriere 12,10,0:barriere 13,10,0:barriere 10,10,0:escalier 9,10,1:lanterne 13,10,1:lanterne 8,13,0:calque 8,11,0:calque',
    chest: { or: 2, cristal: 2 },
  },
  'atelier-toit': {
    cells: '9,12,0:porte 9,11,2:toit 9,12,2:toit 9,13,2:toit 10,11,2:toit 10,12,2:toit 10,13,2:toit 11,11,2:toit 11,12,2:toit 11,13,2:toit 10,12,3:toit 12,11,1:toit 13,11,1:toit 13,12,1:toit 13,13,1:toit 12,13,1:toit 8,12,0:lanterne',
    chest: { barriere: 4, escalier: 1, lanterne: 2 },
  },
  'baie-cabine': {
    cells: '9,11,0:cabine 9,12,0:cabine 9,13,0:cabine 10,13,0:cabine 11,11,0:cabine 11,12,0:cabine 11,13,0:cabine 9,11,1:cabine 9,12,1:cabine 9,13,1:cabine 10,11,1:cabine 10,13,1:cabine 11,11,1:cabine 11,12,1:cabine 11,13,1:cabine',
    chest: { cadran: 3, porte: 1, toit: 10, lanterne: 1 },
  },
  'baie-quai': {
    cells: '8,10,0:barriere 9,10,0:barriere 11,10,0:barriere 12,10,0:barriere 10,10,0:escalier 8,10,1:lanterne 12,10,1:lanterne 8,12,0:cabine 12,12,0:cabine',
    chest: { or: 2, cristal: 2 },
  },
  'baie-toit': {
    cells: '10,11,0:porte 9,11,2:cabine 9,12,2:cabine 9,13,2:cabine 10,11,2:cabine 10,13,2:cabine 11,11,2:cabine 11,12,2:cabine 11,13,2:cabine 9,11,3:toit 9,12,3:toit 9,13,3:toit 10,11,3:toit 10,12,3:toit 10,13,3:toit 11,11,3:toit 11,12,3:toit 11,13,3:toit 10,12,4:toit 12,11,0:lanterne',
    chest: { barriere: 4, escalier: 1, lanterne: 2 },
  },
  'belvedere-kiosque': {
    cells: '9,11,0:marbre 9,12,0:marbre 9,13,0:marbre 10,11,0:marbre 10,12,0:marbre 10,13,0:marbre 11,11,0:marbre 11,12,0:marbre 11,13,0:marbre 12,11,0:marbre 12,12,0:marbre 12,13,0:marbre 9,13,1:marbre 10,13,1:marbre 11,13,1:marbre 12,13,1:marbre',
    chest: { ardoise: 3, toit: 12, lanterne: 2 },
  },
  'belvedere-terrasse': {
    cells: '8,10,0:barriere 9,10,0:barriere 11,10,0:barriere 12,10,0:barriere 13,10,0:barriere 10,10,0:escalier 8,10,1:lanterne 13,10,1:lanterne 13,12,0:marbre',
    chest: { or: 2, cristal: 2 },
  },
  'belvedere-toit': {
    cells: '9,13,2:marbre 10,13,2:marbre 11,13,2:marbre 12,13,2:marbre 9,11,1:marbre 12,11,1:marbre 9,11,2:marbre 12,11,2:marbre 9,11,3:toit 9,12,3:toit 9,13,3:toit 10,11,3:toit 10,12,3:toit 10,13,3:toit 11,11,3:toit 11,12,3:toit 11,13,3:toit 12,11,3:toit 12,12,3:toit 12,13,3:toit 10,11,1:lanterne 11,11,1:lanterne',
    chest: { barriere: 5, escalier: 1, lanterne: 2 },
  },
  'cabinet-nid': {
    cells: '9,11,0:parchemin 9,12,0:parchemin 9,13,0:parchemin 10,11,0:parchemin 10,12,0:parchemin 10,13,0:parchemin 11,11,0:parchemin 11,12,0:parchemin 11,13,0:parchemin 12,11,0:parchemin 12,12,0:parchemin 12,13,0:parchemin 9,13,1:parchemin 10,13,1:parchemin 11,13,1:parchemin 12,13,1:parchemin',
    chest: { calque: 3, toit: 12, lanterne: 2 },
  },
  'cabinet-perchoir': {
    cells: '8,10,0:barriere 9,10,0:barriere 11,10,0:barriere 12,10,0:barriere 13,10,0:barriere 10,10,0:escalier 8,10,1:lanterne 13,10,1:lanterne 13,12,0:parchemin',
    chest: { or: 2, cristal: 2 },
  },
  'cabinet-toit': {
    cells: '9,13,2:parchemin 10,13,2:parchemin 11,13,2:parchemin 12,13,2:parchemin 9,11,1:parchemin 12,11,1:parchemin 9,11,2:parchemin 12,11,2:parchemin 9,11,3:toit 9,12,3:toit 9,13,3:toit 10,11,3:toit 10,12,3:toit 10,13,3:toit 11,11,3:toit 11,12,3:toit 11,13,3:toit 12,11,3:toit 12,12,3:toit 12,13,3:toit 10,11,1:lanterne 11,11,1:lanterne',
    chest: { barriere: 5, escalier: 1, lanterne: 2 },
  },
  'carrefour-cabane': {
    cells: '9,11,0:panneau 9,13,0:panneau 10,11,0:panneau 10,13,0:panneau 11,11,0:panneau 11,12,0:panneau 11,13,0:panneau 9,11,1:panneau 9,12,1:panneau 9,13,1:panneau 10,11,1:panneau 10,13,1:panneau 11,11,1:panneau 11,12,1:panneau 11,13,1:panneau 12,11,0:panneau 13,11,0:panneau 13,12,0:panneau 13,13,0:panneau 12,13,0:panneau',
    chest: { glace: 3, porte: 1, toit: 15, lanterne: 1 },
  },
  'carrefour-rondpoint': {
    cells: '9,10,0:barriere 11,10,0:barriere 12,10,0:barriere 13,10,0:barriere 10,10,0:escalier 9,10,1:lanterne 13,10,1:lanterne 8,13,0:panneau 8,11,0:panneau',
    chest: { or: 2, cristal: 2 },
  },
  'carrefour-toit': {
    cells: '9,12,0:porte 9,11,2:toit 9,12,2:toit 9,13,2:toit 10,11,2:toit 10,12,2:toit 10,13,2:toit 11,11,2:toit 11,12,2:toit 11,13,2:toit 10,12,3:toit 12,11,1:toit 13,11,1:toit 13,12,1:toit 13,13,1:toit 12,13,1:toit 8,12,0:lanterne',
    chest: { barriere: 4, escalier: 1, lanterne: 2 },
  },
  'carriere-abri': {
    cells: '9,11,0:bois 9,11,1:bois 12,11,0:bois 12,11,1:bois 9,13,0:bois 9,13,1:bois 12,13,0:bois 12,13,1:bois 9,11,2:toit 9,12,2:toit 9,13,2:toit 12,11,2:toit 12,12,2:toit 12,13,2:toit 10,11,2:toit 11,11,2:toit 10,11,0:lanterne',
    chest: { barriere: 3, escalier: 1, lanterne: 2 },
  },
  'carriere-cour': {
    cells: '9,10,0:barriere 11,10,0:barriere 12,10,0:barriere 10,10,0:escalier 9,10,1:lanterne 12,10,1:lanterne 8,11,0:sable 13,11,0:sable',
    chest: { or: 2, cristal: 2 },
  },
  'carriere-four': {
    cells: '10,12,0:sable 10,13,0:sable 11,12,0:sable 11,13,0:sable 10,12,1:sable 10,13,1:sable 11,12,1:sable 11,13,1:sable 10,12,2:sable 10,13,2:sable 11,12,2:sable 11,13,2:sable 10,12,3:pierre 10,12,4:pierre',
    chest: { terre: 3, toit: 8, lanterne: 1 },
  },
  'chateau-rempart': {
    cells: '8,10,0:barriere 9,10,0:barriere 11,10,0:barriere 12,10,0:barriere 10,10,0:escalier 8,10,1:lanterne 12,10,1:lanterne 8,12,0:taille 12,12,0:taille',
    chest: { or: 2, cristal: 2 },
  },
  'chateau-toit': {
    cells: '10,11,0:porte 9,11,2:taille 9,12,2:taille 9,13,2:taille 10,11,2:taille 10,13,2:taille 11,11,2:taille 11,12,2:taille 11,13,2:taille 9,11,3:toit 9,12,3:toit 9,13,3:toit 10,11,3:toit 10,12,3:toit 10,13,3:toit 11,11,3:toit 11,12,3:toit 11,13,3:toit 10,12,4:toit 12,11,0:lanterne',
    chest: { barriere: 4, escalier: 1, lanterne: 2 },
  },
  'chateau-tour': {
    cells: '9,11,0:taille 9,12,0:taille 9,13,0:taille 10,13,0:taille 11,11,0:taille 11,12,0:taille 11,13,0:taille 9,11,1:taille 9,12,1:taille 9,13,1:taille 10,11,1:taille 10,13,1:taille 11,11,1:taille 11,12,1:taille 11,13,1:taille',
    chest: { antenne: 3, porte: 1, toit: 10, lanterne: 1 },
  },
  'comptoir-boutique': {
    cells: '9,11,0:tuile 9,12,0:tuile 9,13,0:tuile 10,13,0:tuile 11,11,0:tuile 11,12,0:tuile 11,13,0:tuile 9,11,1:tuile 9,12,1:tuile 9,13,1:tuile 10,11,1:tuile 10,13,1:tuile 11,11,1:tuile 11,12,1:tuile 11,13,1:tuile',
    chest: { lambris: 3, porte: 1, toit: 10, lanterne: 1 },
  },
  'comptoir-terrasse': {
    cells: '8,10,0:barriere 9,10,0:barriere 11,10,0:barriere 12,10,0:barriere 10,10,0:escalier 8,10,1:lanterne 12,10,1:lanterne 8,12,0:tuile 12,12,0:tuile',
    chest: { or: 2, cristal: 2 },
  },
  'comptoir-toit': {
    cells: '10,11,0:porte 9,11,2:tuile 9,12,2:tuile 9,13,2:tuile 10,11,2:tuile 10,13,2:tuile 11,11,2:tuile 11,12,2:tuile 11,13,2:tuile 9,11,3:toit 9,12,3:toit 9,13,3:toit 10,11,3:toit 10,12,3:toit 10,13,3:toit 11,11,3:toit 11,12,3:toit 11,13,3:toit 10,12,4:toit 12,11,0:lanterne',
    chest: { barriere: 4, escalier: 1, lanterne: 2 },
  },
  'donnees-dome': {
    cells: '9,11,0:quartz 9,12,0:quartz 9,13,0:quartz 10,13,0:quartz 11,11,0:quartz 11,12,0:quartz 11,13,0:quartz 9,11,1:quartz 9,12,1:quartz 9,13,1:quartz 10,11,1:quartz 10,13,1:quartz 11,11,1:quartz 11,12,1:quartz 11,13,1:quartz',
    chest: { parchemin: 3, porte: 1, lanterne: 2 },
  },
  'donnees-terrasse': {
    cells: '8,10,0:barriere 9,10,0:barriere 11,10,0:barriere 12,10,0:barriere 10,10,0:escalier 8,10,1:lanterne 12,10,1:lanterne 8,13,0:quartz 12,13,0:quartz',
    chest: { or: 2, cristal: 2 },
  },
  'donnees-toit': {
    cells: '10,11,0:porte 9,11,2:quartz 9,12,2:quartz 9,13,2:quartz 10,11,2:quartz 10,12,2:quartz 10,13,2:quartz 11,11,2:quartz 11,12,2:quartz 11,13,2:quartz 10,11,3:quartz 9,12,3:quartz 10,12,3:quartz 11,12,3:quartz 10,13,3:quartz 10,12,4:quartz 8,12,0:lanterne 12,12,0:lanterne',
    chest: { barriere: 4, escalier: 1, lanterne: 2 },
  },
  'falaise-bergerie': {
    cells: '9,11,0:ardoise 9,12,0:ardoise 9,13,0:ardoise 10,13,0:ardoise 11,11,0:ardoise 11,13,0:ardoise 12,11,0:ardoise 12,12,0:ardoise 12,13,0:ardoise 9,11,1:ardoise 9,12,1:ardoise 9,13,1:ardoise 10,11,1:ardoise 10,13,1:ardoise 11,11,1:ardoise 11,13,1:ardoise 12,11,1:ardoise 12,12,1:ardoise 12,13,1:ardoise',
    chest: { acier: 3, porte: 1, toit: 12, lanterne: 1 },
  },
  'falaise-enclos': {
    cells: '8,10,0:barriere 9,10,0:barriere 11,10,0:barriere 12,10,0:barriere 13,10,0:barriere 10,10,0:escalier 8,10,1:lanterne 13,10,1:lanterne 8,12,0:ardoise',
    chest: { or: 2, cristal: 2 },
  },
  'falaise-toit': {
    cells: '10,11,0:porte 9,11,2:toit 9,13,2:toit 10,11,2:toit 10,13,2:toit 11,11,2:toit 11,13,2:toit 12,11,2:toit 12,13,2:toit 9,12,3:toit 10,12,3:toit 11,12,3:toit 12,12,3:toit 13,12,0:lanterne',
    chest: { barriere: 5, escalier: 1, lanterne: 2 },
  },
  'ferme-enclos': {
    cells: '8,10,0:barriere 9,10,0:barriere 11,10,0:barriere 12,10,0:barriere 13,10,0:barriere 10,10,0:escalier 8,10,1:lanterne 13,10,1:lanterne 8,12,0:terre 13,12,0:terre',
    chest: { or: 2, cristal: 2 },
  },
  'ferme-etable': {
    cells: '9,11,0:terre 9,12,0:terre 9,13,0:terre 10,13,0:terre 11,11,0:terre 11,13,0:terre 12,11,0:terre 12,12,0:terre 12,13,0:terre 9,11,1:bois 12,11,1:bois 9,13,1:bois 12,13,1:bois',
    chest: { verre: 3, toit: 12, porte: 1, lanterne: 1 },
  },
  'ferme-toit': {
    cells: '9,11,2:toit 9,12,2:toit 9,13,2:toit 10,11,2:toit 10,12,2:toit 10,13,2:toit 11,11,2:toit 11,12,2:toit 11,13,2:toit 12,11,2:toit 12,12,2:toit 12,13,2:toit 10,11,0:porte 11,11,1:lanterne 10,11,1:bois 9,12,1:terre 12,12,1:terre',
    chest: { barriere: 5, escalier: 1, lanterne: 2 },
  },
  'foret-cabane': {
    cells: '9,11,0:bois 9,12,0:bois 9,13,0:bois 10,13,0:bois 11,11,0:bois 11,12,0:bois 11,13,0:bois 9,11,1:bois 9,12,1:bois 9,13,1:bois 10,11,1:bois 10,12,1:bois 10,13,1:bois 11,11,1:bois 11,12,1:bois 11,13,1:bois',
    chest: { pierre: 3, toit: 9, porte: 1, lanterne: 1 },
  },
  'foret-cour': {
    cells: '8,10,0:barriere 9,10,0:barriere 11,10,0:barriere 12,10,0:barriere 10,10,0:escalier 8,10,1:lanterne 12,10,1:lanterne 8,12,0:bois 12,13,0:bois',
    chest: { or: 2, cristal: 2 },
  },
  'foret-toit': {
    cells: '9,11,2:toit 9,12,2:toit 9,13,2:toit 10,11,2:toit 10,13,2:toit 11,11,2:toit 11,12,2:toit 11,13,2:toit 10,12,3:toit 10,11,0:porte 12,11,0:lanterne 8,11,0:bois 12,12,0:bois',
    chest: { barriere: 4, escalier: 1, lanterne: 2 },
  },
  'forge-atelier': {
    cells: '9,11,0:acier 9,13,0:acier 10,11,0:acier 10,13,0:acier 11,11,0:acier 11,12,0:acier 11,13,0:acier 9,11,1:acier 9,12,1:acier 9,13,1:acier 10,11,1:acier 10,13,1:acier 11,11,1:acier 11,12,1:acier 11,13,1:acier 12,11,0:acier 13,11,0:acier 13,12,0:acier 13,13,0:acier 12,13,0:acier',
    chest: { tourbe: 3, porte: 1, toit: 15, lanterne: 1 },
  },
  'forge-cour': {
    cells: '9,10,0:barriere 11,10,0:barriere 12,10,0:barriere 13,10,0:barriere 10,10,0:escalier 9,10,1:lanterne 13,10,1:lanterne 8,13,0:acier 8,11,0:acier',
    chest: { or: 2, cristal: 2 },
  },
  'forge-toit': {
    cells: '9,12,0:porte 9,11,2:toit 9,12,2:toit 9,13,2:toit 10,11,2:toit 10,12,2:toit 10,13,2:toit 11,11,2:toit 11,12,2:toit 11,13,2:toit 10,12,3:toit 12,11,1:toit 13,11,1:toit 13,12,1:toit 13,13,1:toit 12,13,1:toit 8,12,0:lanterne',
    chest: { barriere: 4, escalier: 1, lanterne: 2 },
  },
  'gare-abri': {
    cells: '9,11,0:rail 9,12,0:rail 9,13,0:rail 10,13,0:rail 11,11,0:rail 11,12,0:rail 11,13,0:rail 9,11,1:rail 9,12,1:rail 9,13,1:rail 10,11,1:rail 10,13,1:rail 11,11,1:rail 11,12,1:rail 11,13,1:rail',
    chest: { velours: 3, porte: 1, toit: 10, lanterne: 1 },
  },
  'gare-quai': {
    cells: '8,10,0:barriere 9,10,0:barriere 11,10,0:barriere 12,10,0:barriere 10,10,0:escalier 8,10,1:lanterne 12,10,1:lanterne 8,12,0:rail 12,12,0:rail',
    chest: { or: 2, cristal: 2 },
  },
  'gare-toit': {
    cells: '10,11,0:porte 9,11,2:rail 9,12,2:rail 9,13,2:rail 10,11,2:rail 10,13,2:rail 11,11,2:rail 11,12,2:rail 11,13,2:rail 9,11,3:toit 9,12,3:toit 9,13,3:toit 10,11,3:toit 10,12,3:toit 10,13,3:toit 11,11,3:toit 11,12,3:toit 11,13,3:toit 10,12,4:toit 12,11,0:lanterne',
    chest: { barriere: 4, escalier: 1, lanterne: 2 },
  },
  'glacier-igloo': {
    cells: '9,11,0:glace 9,12,0:glace 9,13,0:glace 10,13,0:glace 11,11,0:glace 11,12,0:glace 11,13,0:glace 9,11,1:glace 9,12,1:glace 9,13,1:glace 10,11,1:glace 10,13,1:glace 11,11,1:glace 11,12,1:glace 11,13,1:glace',
    chest: { brique: 3, porte: 1, lanterne: 2 },
  },
  'glacier-patinoire': {
    cells: '8,10,0:barriere 9,10,0:barriere 11,10,0:barriere 12,10,0:barriere 10,10,0:escalier 8,10,1:lanterne 12,10,1:lanterne 8,13,0:glace 12,13,0:glace',
    chest: { or: 2, cristal: 2 },
  },
  'glacier-toit': {
    cells: '10,11,0:porte 9,11,2:glace 9,12,2:glace 9,13,2:glace 10,11,2:glace 10,12,2:glace 10,13,2:glace 11,11,2:glace 11,12,2:glace 11,13,2:glace 10,11,3:glace 9,12,3:glace 10,12,3:glace 11,12,3:glace 10,13,3:glace 10,12,4:glace 8,12,0:lanterne 12,12,0:lanterne',
    chest: { barriere: 4, escalier: 1, lanterne: 2 },
  },
  'horloge-cour': {
    cells: '8,10,0:barriere 9,10,0:barriere 11,10,0:barriere 12,10,0:barriere 10,10,0:escalier 8,10,1:lanterne 12,10,1:lanterne 8,12,0:cadran 12,12,0:cadran',
    chest: { or: 2, cristal: 2 },
  },
  'horloge-toit': {
    cells: '10,11,0:porte 9,11,2:cadran 9,12,2:cadran 9,13,2:cadran 10,11,2:cadran 10,13,2:cadran 11,11,2:cadran 11,12,2:cadran 11,13,2:cadran 9,11,3:toit 9,12,3:toit 9,13,3:toit 10,11,3:toit 10,12,3:toit 10,13,3:toit 11,11,3:toit 11,12,3:toit 11,13,3:toit 10,12,4:toit 12,11,0:lanterne',
    chest: { barriere: 4, escalier: 1, lanterne: 2 },
  },
  'horloge-tour': {
    cells: '9,11,0:cadran 9,12,0:cadran 9,13,0:cadran 10,13,0:cadran 11,11,0:cadran 11,12,0:cadran 11,13,0:cadran 9,11,1:cadran 9,12,1:cadran 9,13,1:cadran 10,11,1:cadran 10,13,1:cadran 11,11,1:cadran 11,12,1:cadran 11,13,1:cadran',
    chest: { cabine: 3, porte: 1, toit: 10, lanterne: 1 },
  },
  'manoir-jardin': {
    cells: '8,10,0:barriere 9,10,0:barriere 11,10,0:barriere 12,10,0:barriere 10,10,0:escalier 8,10,1:lanterne 12,10,1:lanterne 8,12,0:lambris 12,12,0:lambris',
    chest: { or: 2, cristal: 2 },
  },
  'manoir-salon': {
    cells: '9,11,0:lambris 9,12,0:lambris 9,13,0:lambris 10,13,0:lambris 11,11,0:lambris 11,12,0:lambris 11,13,0:lambris 9,11,1:lambris 9,12,1:lambris 9,13,1:lambris 10,11,1:lambris 10,13,1:lambris 11,11,1:lambris 11,12,1:lambris 11,13,1:lambris',
    chest: { tuile: 3, porte: 1, toit: 10, lanterne: 1 },
  },
  'manoir-toit': {
    cells: '10,11,0:porte 9,11,2:lambris 9,12,2:lambris 9,13,2:lambris 10,11,2:lambris 10,13,2:lambris 11,11,2:lambris 11,12,2:lambris 11,13,2:lambris 9,11,3:toit 9,12,3:toit 9,13,3:toit 10,11,3:toit 10,12,3:toit 10,13,3:toit 11,11,3:toit 11,12,3:toit 11,13,3:toit 10,12,4:toit 12,11,0:lanterne',
    chest: { barriere: 4, escalier: 1, lanterne: 2 },
  },
  'marais-hutte': {
    cells: '9,11,0:tourbe 9,12,0:tourbe 9,13,0:tourbe 10,13,0:tourbe 11,11,0:tourbe 11,13,0:tourbe 12,11,0:tourbe 12,12,0:tourbe 12,13,0:tourbe 9,11,1:tourbe 9,12,1:tourbe 9,13,1:tourbe 10,11,1:tourbe 10,13,1:tourbe 11,11,1:tourbe 11,13,1:tourbe 12,11,1:tourbe 12,12,1:tourbe 12,13,1:tourbe',
    chest: { toile: 3, porte: 1, toit: 12, lanterne: 1 },
  },
  'marais-ponton': {
    cells: '8,10,0:barriere 9,10,0:barriere 11,10,0:barriere 12,10,0:barriere 13,10,0:barriere 10,10,0:escalier 8,10,1:lanterne 13,10,1:lanterne 8,12,0:tourbe',
    chest: { or: 2, cristal: 2 },
  },
  'marais-toit': {
    cells: '10,11,0:porte 9,11,2:toit 9,13,2:toit 10,11,2:toit 10,13,2:toit 11,11,2:toit 11,13,2:toit 12,11,2:toit 12,13,2:toit 9,12,3:toit 10,12,3:toit 11,12,3:toit 12,12,3:toit 13,12,0:lanterne',
    chest: { barriere: 5, escalier: 1, lanterne: 2 },
  },
  'marche-echoppe': {
    cells: '9,11,0:toile 9,12,0:toile 9,13,0:toile 10,11,0:toile 10,12,0:toile 10,13,0:toile 11,11,0:toile 11,12,0:toile 11,13,0:toile 12,11,0:toile 12,12,0:toile 12,13,0:toile 9,13,1:toile 10,13,1:toile 11,13,1:toile 12,13,1:toile',
    chest: { galet: 3, toit: 12, lanterne: 2 },
  },
  'marche-etal': {
    cells: '8,10,0:barriere 9,10,0:barriere 11,10,0:barriere 12,10,0:barriere 13,10,0:barriere 10,10,0:escalier 8,10,1:lanterne 13,10,1:lanterne 13,12,0:toile',
    chest: { or: 2, cristal: 2 },
  },
  'marche-toit': {
    cells: '9,13,2:toile 10,13,2:toile 11,13,2:toile 12,13,2:toile 9,11,1:toile 12,11,1:toile 9,11,2:toile 12,11,2:toile 9,11,3:toit 9,12,3:toit 9,13,3:toit 10,11,3:toit 10,12,3:toit 10,13,3:toit 11,11,3:toit 11,12,3:toit 11,13,3:toit 12,11,3:toit 12,12,3:toit 12,13,3:toit 10,11,1:lanterne 11,11,1:lanterne',
    chest: { barriere: 5, escalier: 1, lanterne: 2 },
  },
  'mine-cour': {
    cells: '8,10,0:barriere 9,10,0:barriere 11,10,0:barriere 12,10,0:barriere 10,10,0:escalier 8,10,1:lanterne 12,10,1:lanterne 8,12,0:pierre 12,12,0:pierre',
    chest: { or: 2, cristal: 2 },
  },
  'mine-forge': {
    cells: '9,11,0:pierre 9,12,0:pierre 9,13,0:pierre 10,13,0:pierre 11,11,0:pierre 11,12,0:pierre 11,13,0:pierre 9,11,1:pierre 9,12,1:pierre 9,13,1:pierre 10,11,1:pierre 10,13,1:pierre 11,11,1:pierre 11,12,1:pierre 11,13,1:pierre 9,12,2:bois 10,12,2:bois 11,12,2:bois',
    chest: { sable: 3, toit: 15, porte: 1, lanterne: 1 },
  },
  'mine-toit': {
    cells: '9,11,2:toit 9,13,2:toit 10,11,2:toit 10,13,2:toit 11,11,2:toit 11,13,2:toit 9,11,3:toit 9,12,3:toit 9,13,3:toit 10,11,3:toit 10,12,3:toit 10,13,3:toit 11,11,3:toit 11,12,3:toit 11,13,3:toit 10,11,0:porte 12,11,0:lanterne 8,11,0:pierre',
    chest: { barriere: 4, escalier: 1, lanterne: 2 },
  },
  'phare-jetee': {
    cells: '8,10,0:barriere 9,10,0:barriere 11,10,0:barriere 12,10,0:barriere 10,10,0:escalier 8,10,1:lanterne 12,10,1:lanterne 8,12,0:prisme 12,12,0:prisme',
    chest: { or: 2, cristal: 2 },
  },
  'phare-lanterne': {
    cells: '9,11,0:prisme 9,12,0:prisme 9,13,0:prisme 10,13,0:prisme 11,11,0:prisme 11,12,0:prisme 11,13,0:prisme 9,11,1:prisme 9,12,1:prisme 9,13,1:prisme 10,11,1:prisme 10,13,1:prisme 11,11,1:prisme 11,12,1:prisme 11,13,1:prisme',
    chest: { marbre: 3, porte: 1, toit: 10, lanterne: 1 },
  },
  'phare-toit': {
    cells: '10,11,0:porte 9,11,2:prisme 9,12,2:prisme 9,13,2:prisme 10,11,2:prisme 10,13,2:prisme 11,11,2:prisme 11,12,2:prisme 11,13,2:prisme 9,11,3:toit 9,12,3:toit 9,13,3:toit 10,11,3:toit 10,12,3:toit 10,13,3:toit 11,11,3:toit 11,12,3:toit 11,13,3:toit 10,12,4:toit 12,11,0:lanterne',
    chest: { barriere: 4, escalier: 1, lanterne: 2 },
  },
  'plaine-cour': {
    cells: '8,10,0:barriere 9,10,0:barriere 11,10,0:barriere 12,10,0:barriere 10,10,0:escalier 8,10,1:lanterne 12,10,1:lanterne 8,13,0:brique 12,13,0:brique',
    chest: { or: 2, cristal: 2 },
  },
  'plaine-nid': {
    cells: '9,11,0:brique 9,12,0:brique 9,13,0:brique 10,13,0:brique 11,11,0:brique 11,12,0:brique 11,13,0:brique 9,11,1:brique 9,12,1:brique 9,13,1:brique 10,11,1:brique 10,13,1:brique 11,11,1:brique 11,12,1:brique 11,13,1:brique',
    chest: { bois: 3, porte: 1, lanterne: 2 },
  },
  'plaine-toit': {
    cells: '10,11,0:porte 9,11,2:brique 9,12,2:brique 9,13,2:brique 10,11,2:brique 10,12,2:brique 10,13,2:brique 11,11,2:brique 11,12,2:brique 11,13,2:brique 10,11,3:brique 9,12,3:brique 10,12,3:brique 11,12,3:brique 10,13,3:brique 10,12,4:brique 8,12,0:lanterne 12,12,0:lanterne',
    chest: { barriere: 4, escalier: 1, lanterne: 2 },
  },
  'riviere-hutte': {
    cells: '9,11,0:galet 9,12,0:galet 9,13,0:galet 10,13,0:galet 11,11,0:galet 11,13,0:galet 12,11,0:galet 12,12,0:galet 12,13,0:galet 9,11,1:galet 9,12,1:galet 9,13,1:galet 10,11,1:galet 10,13,1:galet 11,11,1:galet 11,13,1:galet 12,11,1:galet 12,12,1:galet 12,13,1:galet',
    chest: { pierre: 3, porte: 1, toit: 12, lanterne: 1 },
  },
  'riviere-ponton': {
    cells: '8,10,0:barriere 9,10,0:barriere 11,10,0:barriere 12,10,0:barriere 13,10,0:barriere 10,10,0:escalier 8,10,1:lanterne 13,10,1:lanterne 8,12,0:galet',
    chest: { or: 2, cristal: 2 },
  },
  'riviere-toit': {
    cells: '10,11,0:porte 9,11,2:toit 9,13,2:toit 10,11,2:toit 10,13,2:toit 11,11,2:toit 11,13,2:toit 12,11,2:toit 12,13,2:toit 9,12,3:toit 10,12,3:toit 11,12,3:toit 12,12,3:toit 13,12,0:lanterne',
    chest: { barriere: 5, escalier: 1, lanterne: 2 },
  },
  'studio-regie': {
    cells: '9,11,0:antenne 9,12,0:antenne 9,13,0:antenne 10,13,0:antenne 11,11,0:antenne 11,12,0:antenne 11,13,0:antenne 9,11,1:antenne 9,12,1:antenne 9,13,1:antenne 10,11,1:antenne 10,13,1:antenne 11,11,1:antenne 11,12,1:antenne 11,13,1:antenne',
    chest: { taille: 3, porte: 1, toit: 10, lanterne: 1 },
  },
  'studio-terrasse': {
    cells: '8,10,0:barriere 9,10,0:barriere 11,10,0:barriere 12,10,0:barriere 10,10,0:escalier 8,10,1:lanterne 12,10,1:lanterne 8,12,0:antenne 12,12,0:antenne',
    chest: { or: 2, cristal: 2 },
  },
  'studio-toit': {
    cells: '10,11,0:porte 9,11,2:antenne 9,12,2:antenne 9,13,2:antenne 10,11,2:antenne 10,13,2:antenne 11,11,2:antenne 11,12,2:antenne 11,13,2:antenne 9,11,3:toit 9,12,3:toit 9,13,3:toit 10,11,3:toit 10,12,3:toit 10,13,3:toit 11,11,3:toit 11,12,3:toit 11,13,3:toit 10,12,4:toit 12,11,0:lanterne',
    chest: { barriere: 4, escalier: 1, lanterne: 2 },
  },
  'textes-coupole': {
    cells: '8,10,0:barriere 9,10,0:barriere 11,10,0:barriere 12,10,0:barriere 10,10,0:escalier 8,10,1:lanterne 12,10,1:lanterne 8,12,0:lentille 12,12,0:lentille',
    chest: { or: 2, cristal: 2 },
  },
  'textes-lanterne': {
    cells: '9,11,0:lentille 9,12,0:lentille 9,13,0:lentille 10,13,0:lentille 11,11,0:lentille 11,12,0:lentille 11,13,0:lentille 9,11,1:lentille 9,12,1:lentille 9,13,1:lentille 10,11,1:lentille 10,13,1:lentille 11,11,1:lentille 11,12,1:lentille 11,13,1:lentille',
    chest: { quartz: 3, porte: 1, toit: 10, lanterne: 1 },
  },
  'textes-toit': {
    cells: '10,11,0:porte 9,11,2:lentille 9,12,2:lentille 9,13,2:lentille 10,11,2:lentille 10,13,2:lentille 11,11,2:lentille 11,12,2:lentille 11,13,2:lentille 9,11,3:toit 9,12,3:toit 9,13,3:toit 10,11,3:toit 10,12,3:toit 10,13,3:toit 11,11,3:toit 11,12,3:toit 11,13,3:toit 10,12,4:toit 12,11,0:lanterne',
    chest: { barriere: 4, escalier: 1, lanterne: 2 },
  },
  'theatre-loge': {
    cells: '9,11,0:velours 9,12,0:velours 9,13,0:velours 10,13,0:velours 11,11,0:velours 11,12,0:velours 11,13,0:velours 9,11,1:velours 9,12,1:velours 9,13,1:velours 10,11,1:velours 10,13,1:velours 11,11,1:velours 11,12,1:velours 11,13,1:velours',
    chest: { rail: 3, porte: 1, toit: 10, lanterne: 1 },
  },
  'theatre-scene': {
    cells: '8,10,0:barriere 9,10,0:barriere 11,10,0:barriere 12,10,0:barriere 10,10,0:escalier 8,10,1:lanterne 12,10,1:lanterne 8,12,0:velours 12,12,0:velours',
    chest: { or: 2, cristal: 2 },
  },
  'theatre-toit': {
    cells: '10,11,0:porte 9,11,2:velours 9,12,2:velours 9,13,2:velours 10,11,2:velours 10,13,2:velours 11,11,2:velours 11,12,2:velours 11,13,2:velours 9,11,3:toit 9,12,3:toit 9,13,3:toit 10,11,3:toit 10,12,3:toit 10,13,3:toit 11,11,3:toit 11,12,3:toit 11,13,3:toit 10,12,4:toit 12,11,0:lanterne',
    chest: { barriere: 4, escalier: 1, lanterne: 2 },
  },
  'tour-lanterne': {
    cells: '11,11,3:lanterne 10,12,3:lanterne 10,11,4:toit 10,12,4:toit 11,11,4:toit 11,12,4:toit 10,11,5:toit 10,10,0:porte 11,10,0:pierre',
    chest: { barriere: 4, escalier: 1, lanterne: 2 },
  },
  'tour-phare': {
    cells: '10,11,0:pierre 10,12,0:pierre 11,11,0:pierre 11,12,0:pierre 10,11,1:verre 10,12,1:verre 11,11,1:verre 11,12,1:verre 10,11,2:verre 10,12,2:verre 11,11,2:verre 11,12,2:verre 10,11,3:verre 11,12,3:verre',
    chest: { bois: 4, lanterne: 2, toit: 5, porte: 1 },
  },
  'tour-quai': {
    cells: '8,10,0:barriere 9,10,0:barriere 12,10,0:barriere 13,10,0:barriere 8,10,1:lanterne 13,10,1:lanterne 9,11,0:escalier 8,11,0:verre 13,11,0:verre',
    chest: { or: 3, cristal: 3 },
  },
  'volcan-abri': {
    cells: '9,11,0:obsidienne 9,12,0:obsidienne 9,13,0:obsidienne 10,13,0:obsidienne 11,11,0:obsidienne 11,12,0:obsidienne 11,13,0:obsidienne 9,11,1:obsidienne 9,12,1:obsidienne 9,13,1:obsidienne 10,11,1:obsidienne 10,13,1:obsidienne 11,11,1:obsidienne 11,12,1:obsidienne 11,13,1:obsidienne',
    chest: { terre: 3, porte: 1, lanterne: 2 },
  },
  'volcan-terrasse': {
    cells: '8,10,0:barriere 9,10,0:barriere 11,10,0:barriere 12,10,0:barriere 10,10,0:escalier 8,10,1:lanterne 12,10,1:lanterne 8,13,0:obsidienne 12,13,0:obsidienne',
    chest: { or: 2, cristal: 2 },
  },
  'volcan-toit': {
    cells: '10,11,0:porte 9,11,2:obsidienne 9,12,2:obsidienne 9,13,2:obsidienne 10,11,2:obsidienne 10,12,2:obsidienne 10,13,2:obsidienne 11,11,2:obsidienne 11,12,2:obsidienne 11,13,2:obsidienne 10,11,3:obsidienne 9,12,3:obsidienne 10,12,3:obsidienne 11,12,3:obsidienne 10,13,3:obsidienne 10,12,4:obsidienne 8,12,0:lanterne 12,12,0:lanterne',
    chest: { barriere: 4, escalier: 1, lanterne: 2 },
  },
};

export interface PlanV1 {
  /** Clé « x,y,z » relative à l’île → bloc. */
  blocks: Map<string, BlockId>;
  chest: Partial<Record<BlockId, number>>;
}

const cache = new Map<string, PlanV1>();
/** L’ancien dessin d’un plan des îles, ou `undefined` (plans du Bloc-Navire, plans inconnus). */
export function planV1(id: string): PlanV1 | undefined {
  const raw = V1[id];
  if (!raw) return undefined;
  let v = cache.get(id);
  if (!v) {
    v = { blocks: new Map(raw.cells.split(' ').map((c) => c.split(':') as [string, BlockId])), chest: raw.chest };
    cache.set(id, v);
  }
  return v;
}
