// Les mesures du rendu du monde (lot R0 de la migration vers Archipéo) : pour chaque archipel tout construit, les appels
// de dessin et les triangles de la vue 3D (lus sur `renderer.info` par le compteur `three/meter.ts`), et le poids de
// Three.js dans le paquet de l'application. `npm run rendu:mesures` ; `npm run rendu:mesures -- --sans-poids` saute le
// build. Chromium en rendu logiciel (SwiftShader) : les appels et les triangles ne dépendent pas de la carte graphique,
// les images par seconde si ; elles se mesurent sur la tablette de référence avec `?mesures` dans l'adresse.
// `--captures <dossier>` enregistre en plus les captures déclarées dans `CAPTURES` (ci-dessous), pour comparer un lot de
// rendu à l'état d'avant ; elles ne sont pas versionnées (la branche `captures` en garde un dossier par lot).
// `--familles nuit,ciel` n'en refait que certaines familles (jour, nuit, personnages, lisibilite, ciel, cadrage, lieux, lieux-pres, lieux-salle, salle, ecoles, trois-bandes, etoile, commandes, commandes-iles, bulles, fiches, menu-tete ; celles d'un lot fusionné sont retirées). `--rendu archipeo` mesure le rendu en construction (le drapeau
// `?rendu=archipeo`, et l'univers Archipéo choisi dans les Réglages pour que les textes le suivent), `--style a|b|c` une option de style de surface (lot R1), `--archipel 6e` un seul archipel,
// `--attente 20` le plus long temps réel laissé au monde pour se construire (en secondes, 10 par défaut). L'horloge de la
// page est pilotée (`preparerLaScene`, scripts/prise-de-vue.mjs) : deux prises du même état donnent la même image, les
// animations au même instant ; les images par seconde du tableau sont donc celles de l'horloge pilotée (8), pas une mesure.
// Sur chaque capture de nuit en 3D, la part des pixels de la scène qui sont « de lueur » (fenêtres, lanternes, et plus
// tard le phare : proches de la lueur `#FFD866`, voir `estUneLueur`) : au plus `LUEUR_MAX` à la vue île (décision du
// directeur artistique, lot R5), affichée dans un second tableau.
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { build, createServer } from 'vite';
import { chromium } from 'playwright-core';
import { capturer, figeable, hasardFixe, piloterLHorloge, preparerLaScene } from '../prise-de-vue.mjs';
import { comparer } from './comparer.mjs';

const root = process.cwd();
const TABLET = { width: 1024, height: 768 };
const kilo = (n) => `${Math.round(n / 1024)} Ko`;
const arg = process.argv.indexOf('--captures');
const SHOTS = arg >= 0 ? process.argv[arg + 1] : null;
const option = (name) => {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : null;
};
/** Avec `--rendu archipeo`, l'univers d'Archipéo est aussi choisi dans les Réglages : sans lui, les textes (défi, bulle, panneaux) restent ceux de Blocland, l'univers par défaut. */
const UNIVERS_DES_TEXTES = option('--rendu') === 'archipeo' ? 'archipeo' : undefined;

/** Le drapeau de rendu et l'option de style, avant le `#` de l'adresse. */
const QUERY = (() => {
  const q = new URLSearchParams();
  if (option('--rendu')) q.set('rendu', option('--rendu'));
  if (option('--style')) q.set('style', option('--style'));
  const s = q.toString();
  return s ? `?${s}` : '';
})();
const ONLY = option('--archipel');
/** Avec `--comparer <dossier>` : les captures de main (mêmes noms), à comparer à celles-ci (scripts/rendu/comparer.mjs). */
const REFERENCES = option('--comparer');
const WAIT = Number(option('--attente') ?? 10) * 1000;
/** Les vues sans monde 3D (le défi, la bulle d'une créature) : rien à attendre avant la prise. */
const VUES_SANS_MONDE = new Set(['défi', 'bulle', 'page']);
/** Une heure de jour et une de nuit, pour que le ciel et la lumière soient les mêmes à chaque fois. */
const DAY = new Date('2026-09-28T10:30:00');
const NIGHT = new Date('2026-09-28T22:30:00');

/**
 * Les captures déclarées d'avance (le socle de la piste Rendu, docs/univers/archipeo/cadrage.md §6) : pour chaque
 * archipel tout construit, tout ce que montrent les lots de rendu et la revue d'ensemble du directeur artistique, de près
 * et de loin (une île, l'archipel, la Carte), de jour et de nuit. Ni Contraste élevé ni « Réduire les animations » : ces
 * deux réglages sont retirés et inscrits au plan pour un lot ultérieur (décision du mainteneur, 28/09/2026).
 * Pas de capture en 2D : ni Archipéo ni Blocland n'ont de vue en 2D au choix (décision du mainteneur, 28/09/2026) ; elles
 * reviendront avec un univers dessiné en 2D. Le fichier : `<archipel>-<nom>.jpg`. Les captures de jour sont aussi celles
 * des mesures.
 * Le socle (familles `jour` et `nuit`) est refait par la CI à chaque publication sur main, pour servir de référence
 * (`--comparer`). Un lot y ajoute sa famille s'il lui en faut une, et la retire une fois fusionné (décision du
 * mainteneur, 01/10/2026, sur l'avis du directeur artistique) : la liste ne garde que le socle, les familles communes
 * (personnages, lisibilite) et celles des lots en cours.
 */
const CAPTURES = [
  { nom: 'ile', vue: 'île', famille: 'jour' },
  { nom: 'archipel', vue: 'archipel', famille: 'jour' },
  { nom: 'carte', vue: 'carte', famille: 'jour' },
  { nom: 'ile-nuit', vue: 'île', famille: 'nuit', nuit: true },
  { nom: 'archipel-nuit', vue: 'archipel', famille: 'nuit', nuit: true },
  { nom: 'carte-nuit', vue: 'carte', famille: 'nuit', nuit: true },
  // La lisibilité (famille `lisibilite`), à reprendre par tout lot qui touche l'interface ou une créature : le texte le
  // plus grand (OpenDyslexic, 32 px, `reglages`) sur la vue de l'archipel du 3e depuis le Refuge, en tablette et en
  // portrait ; le test en gris des créatures, chacune dans son archipel (l'Écho du 3e ; le Soleil et Muscade du 4e ; le
  // Hanneton et Moustache du 6e), pris en couleur : la mise en gris se fait à la relecture.
  { nom: 'grand-texte-archipel', vue: 'archipel', famille: 'lisibilite', ile: 'lv2-3e-travel', reglages: { font: 'opendyslexic', fontSize: 32 } },
  { nom: 'grand-texte-archipel-800x1280', vue: 'archipel', famille: 'lisibilite', ile: 'lv2-3e-travel', reglages: { font: 'opendyslexic', fontSize: 32 }, taille: { width: 800, height: 1280 } },
  { nom: 'gris-echo', vue: 'défi', famille: 'lisibilite', ile: 'english-3e-comprehension' },
  { nom: 'gris-soleil', vue: 'défi', famille: 'lisibilite', ile: 'lv2-4e-daily-life' },
  { nom: 'gris-muscade', vue: 'île', famille: 'lisibilite', ile: 'lv2-4e-daily-life' },
  { nom: 'gris-hanneton', vue: 'défi', famille: 'lisibilite', ile: 'maths-6e-calculation' },
  { nom: 'gris-moustache', vue: 'île', famille: 'lisibilite', ile: 'english-5e-grammar' },
  // Les bulles de ce qu'on peut faire (proposition P2, famille `bulles`), à retirer une fois le lot
  // fusionné :
  // - une partie neuve (`depart`) sur l'île de l'école : les bornes à faire, trois bulles, la première bordée d'or ; sur
  //   téléphone en portrait, en paysage, de nuit, figée (`fige` : le mouvement réduit de l'appareil), et en tablette ;
  // - un chantier en fantôme : une partie neuve où la Forêt et la Plaine sont jouées, avec 4 blocs de bois (`inventaire`)
  //   qui paient le pont vers l'Horloge des verbes (sa bulle au marteau) ; de nuit ;
  // - la Mine avec sa première mission faite (`missions` : 1) : ses bornes à faire, de près ; et le Gardien de la Mine
  //   prêt (sa fiche ouverte), sa bulle au bouclier ;
  // - le village tout construit : plus rien à faire, aucune bulle d'objet.
  ...[
    { suffixe: '', taille: { width: 390, height: 844 } },
    { suffixe: '-paysage', taille: { width: 844, height: 390 } },
    { suffixe: '-nuit', nuit: true, taille: { width: 390, height: 844 } },
    { suffixe: '-fige', fige: true, taille: { width: 390, height: 844 } },
    { suffixe: '-tablette' },
  ].map(({ suffixe, ...autres }) => ({ nom: `bulles-depart${suffixe}`, vue: 'île', famille: 'bulles', ile: 'french-6e-phonology', depart: true, ...autres })),
  ...[{ suffixe: '' }, { suffixe: '-nuit', nuit: true }].map(({ suffixe, ...autres }) => ({
    nom: `bulles-chantier${suffixe}`,
    vue: 'île',
    famille: 'bulles',
    ile: 'french-6e-phonology',
    depart: true,
    jouees: ['french-6e-phonology', 'maths-6e-calculation'],
    inventaire: { 'french-6e-phonology': 4 },
    ...autres,
  })),
  { nom: 'bulles-mine', vue: 'île', famille: 'bulles', ile: 'french-6e-letter-confusion', missions: 1, finesse: 2 },
  {
    nom: 'bulles-gardien-pret',
    vue: 'île',
    famille: 'bulles',
    ile: 'french-6e-letter-confusion',
    debout: 'french-6e-letter-confusion',
    fiche: { genre: 'gardien', id: 'french-6e-letter-confusion' },
  },
  { nom: 'bulles-tout-construit', vue: 'île', famille: 'bulles', ile: 'french-6e-phonology', taille: { width: 390, height: 844 } },
  // Les fiches du monde (Toucher le monde, lot 2, famille `fiches`), à retirer une fois le lot fusionné : la fiche ouverte
  // comme d'un toucher (`fiche` : l'objet, voir `window.__dysappsFiche`), la caméra recadrée hors d'elle. La borne des
  // syllabes de la Forêt, le Gardien de la Mine debout, le Bloc-Navire prêt (sans les voyages ni les autres classes,
  // `sansIles` : « autres-classes »), Tunel avec sa commande prête ; chacune sur téléphone en portrait et en paysage, puis
  // en tablette (1024 × 768) et en 800 × 1280 en OpenDyslexic 32 px. Puis la rangée de classes avec deux classes atteintes (sans les voyages vers la 4e et la 3e).
  ...[
    { nom: 'borne', ile: 'french-6e-phonology', fiche: { genre: 'borne', id: 'french-6e-phonology:syllables' } },
    { nom: 'gardien', ile: 'french-6e-letter-confusion', debout: 'french-6e-letter-confusion', fiche: { genre: 'gardien', id: 'french-6e-letter-confusion' } },
    {
      nom: 'navire',
      ile: 'maths-6e-calculation',
      // Sans les îles des autres classes (leurs missions jouées ouvriraient les voyages) : le navire prêt à partir.
      sansIles: 'autres-classes',
      sansPonts: ['passage-5e', 'passage-4e', 'passage-3e'],
      fiche: { genre: 'navire', port: 'maths-6e-calculation' },
    },
    {
      nom: 'creature',
      ile: 'french-6e-letter-confusion',
      commandes: ['french-6e-letter-confusion-request-1'],
      inventaire: { 'maths-6e-calculation': 4 },
      fiche: { genre: 'creature', id: 'french-6e-letter-confusion' },
    },
  ].flatMap(({ nom, ...c }) =>
    [
      { suffixe: '', taille: { width: 390, height: 844 } },
      { suffixe: '-paysage', taille: { width: 844, height: 390 } },
      { suffixe: '-grand-texte', taille: { width: 1024, height: 768 }, reglages: { font: 'opendyslexic', fontSize: 32 } },
      { suffixe: '-grand-texte-800x1280', taille: { width: 800, height: 1280 }, reglages: { font: 'opendyslexic', fontSize: 32 } },
    ].map(({ suffixe, ...format }) => ({ nom: `fiches-${nom}${suffixe}`, vue: 'île', famille: 'fiches', ...c, ...format })),
  ),
  // Le médaillon (P2, PR 2) : la fiche de Tunel et celle du Gardien de la Mine sur téléphone en grand texte (le médaillon
  // s'efface, la barre et sa pastille restent), en paysage en grand texte, et en OpenDyslexic aux espacements les plus larges.
  ...[
    { nom: 'creature', ile: 'french-6e-letter-confusion', commandes: ['french-6e-letter-confusion-request-1'], inventaire: { 'maths-6e-calculation': 4 }, fiche: { genre: 'creature', id: 'french-6e-letter-confusion' } },
    { nom: 'gardien', ile: 'french-6e-letter-confusion', debout: 'french-6e-letter-confusion', fiche: { genre: 'gardien', id: 'french-6e-letter-confusion' } },
    // La fiche d'une borne à la taille de ce qu'elle dit (piste A, 4 octobre 2026) : aussi sur téléphone en grand texte.
    { nom: 'borne', ile: 'french-6e-phonology', fiche: { genre: 'borne', id: 'french-6e-phonology:syllables' } },
  ].flatMap(({ nom, ...c }) =>
    [
      { suffixe: '-telephone-grand-texte', taille: { width: 390, height: 844 }, reglages: { font: 'opendyslexic', fontSize: 32 } },
      { suffixe: '-paysage-grand-texte', taille: { width: 844, height: 390 }, reglages: { font: 'opendyslexic', fontSize: 32 } },
      { suffixe: '-espacements', taille: { width: 1024, height: 768 }, reglages: { font: 'opendyslexic', fontSize: 24, lineHeight: 2.4, letterSpacing: 0.2, wordSpacing: 0.5 } },
    ].map(({ suffixe, ...format }) => ({ nom: `fiches-${nom}${suffixe}`, vue: 'île', famille: 'fiches', ...c, ...format })),
  ),
  // Le Bloc-Navire en chantier (une partie neuve, 4 blocs de bois en poche : « Poser le bloc suivant ») ; prêt, c'est
  // `fiches-navire` (« Embarquer »). Sur téléphone et en tablette en OpenDyslexic 32 px (le titre sur sa ligne).
  ...[
    { suffixe: '', taille: { width: 390, height: 844 } },
    { suffixe: '-grand-texte', taille: { width: 1024, height: 768 }, reglages: { font: 'opendyslexic', fontSize: 32 } },
  ].map(({ suffixe, ...format }) => ({
    nom: `fiches-navire-chantier${suffixe}`,
    vue: 'île',
    famille: 'fiches',
    ile: 'french-6e-phonology',
    depart: true,
    jouees: ['french-6e-phonology'],
    inventaire: { 'french-6e-phonology': 4 },
    fiche: { genre: 'navire', port: 'maths-6e-calculation' },
    ...format,
  })),
  // Une île pâle touchée la première fois : l'indice et la découverte des ouvrages dans la fiche, rien en haut.
  {
    nom: 'fiches-ile-pale',
    vue: 'île',
    famille: 'fiches',
    ile: 'french-6e-phonology',
    depart: true,
    fiche: { genre: 'ile', id: 'french-6e-letter-confusion' },
    taille: { width: 390, height: 844 },
  },
  ...[
    { suffixe: '', taille: { width: 390, height: 844 } },
    { suffixe: '-paysage', taille: { width: 844, height: 390 } },
    { suffixe: '-grand-texte', taille: { width: 390, height: 844 }, reglages: { font: 'opendyslexic', fontSize: 32 } },
    { suffixe: '-tablette' },
  ].map(({ suffixe, ...format }) => ({
    nom: `fiches-classes${suffixe}`,
    vue: 'archipel',
    famille: 'fiches',
    ile: 'maths-5e-proportionality',
    sansPonts: ['passage-4e', 'passage-3e'],
    ...format,
  })),
  // Les personnages hors du monde (lot R6) : chaque Gardien au défi, éteint, en 3D (`parIle` : un fichier par île,
  // `<archipel>-defi-<île>.jpg`) et en SVG (la vue « liste », sans la 3D) ; la bulle d'une créature (le défi pas encore ouvert : la partie
  // sans étoiles), en 3D et en SVG.
  { nom: 'defi', vue: 'défi', famille: 'personnages', parIle: true },
  { nom: 'defi-svg', vue: 'défi', famille: 'personnages', view: 'list' },
  { nom: 'bulle', vue: 'bulle', famille: 'personnages', sansEtoiles: true },
  { nom: 'bulle-svg', vue: 'bulle', famille: 'personnages', view: 'list', sansEtoiles: true },
  // Les repères des Îles du Ciel (R4b-3e) : le grand phare sur son socle, de jour et de nuit, les gradins de
  // l'Observatoire des textes.
  { nom: 'phare-du-ciel', vue: 'île', famille: 'ciel', ile: 'maths-3e-functions' },
  { nom: 'phare-du-ciel-nuit', vue: 'île', famille: 'ciel', ile: 'maths-3e-functions', nuit: true },
  { nom: 'textes', vue: 'île', famille: 'ciel', ile: 'french-3e-close-reading' },
  // La vue de l'archipel depuis l'île du Phare : le phare au centre de l'arc, devant le massif (une vue de l'archipel
  // avec `ile` y place le bonhomme).
  { nom: 'archipel-phare', vue: 'archipel', famille: 'ciel', ile: 'maths-3e-functions' },
  { nom: 'archipel-phare-nuit', vue: 'archipel', famille: 'ciel', ile: 'maths-3e-functions', nuit: true },
  // La vue de l'archipel depuis les deux Observatoires, voisins du Phare : le cadrage qui garde le grand phare en vue
  // (DA-17) vaut aussi pour elles.
  { nom: 'archipel-donnees', vue: 'archipel', famille: 'cadrage', ile: 'maths-3e-statistics' },
  { nom: 'archipel-donnees-nuit', vue: 'archipel', famille: 'cadrage', ile: 'maths-3e-statistics', nuit: true },
  { nom: 'archipel-textes', vue: 'archipel', famille: 'cadrage', ile: 'french-3e-close-reading' },
  { nom: 'archipel-textes-nuit', vue: 'archipel', famille: 'cadrage', ile: 'french-3e-close-reading', nuit: true },
  // L'assemblage des blocs (GD-2) : le lieu où l'on assemble, sur l'île de l'école (la Fabrique ou la Halle aux
  // matériaux, selon le rendu), et les blocs assemblés sur les monuments de chaque archipel, de près (`finesse` 2).
  { nom: 'assemblage-ile', vue: 'île', famille: 'assemblage', ile: 'french-6e-phonology', finesse: 2 },
  { nom: 'assemblage-observatoire', vue: 'île', famille: 'assemblage', ile: 'french-6e-phonology', lieu: 'landmark-6e-1', finesse: 2 },
  { nom: 'assemblage-moulin', vue: 'île', famille: 'assemblage', ile: 'french-6e-phonology', lieu: 'landmark-6e-2', finesse: 2 },
  // Le lieu de près (recadré sur la halle, derrière la salle des trophées), et son panneau ouvert, aux réglages par
  // défaut puis en OpenDyslexic 32 px, avec des blocs en poche (`inventaire`) : la poutre s'assemble, le vitrail non.
  { nom: 'assemblage-lieu', vue: 'île', famille: 'assemblage', ile: 'french-6e-phonology', recadre: { x: 110, y: 150, width: 340, height: 250 }, finesse: 2 },
  { nom: 'assemblage-lieu-nuit', vue: 'île', famille: 'assemblage', ile: 'french-6e-phonology', nuit: true, recadre: { x: 110, y: 150, width: 340, height: 250 }, finesse: 2 },
  { nom: 'assemblage-panneau', vue: 'île', famille: 'assemblage', ile: 'french-6e-phonology', lieu: 'assembly', inventaire: { 'french-6e-phonology': 5, 'french-6e-letter-confusion': 3, 'maths-5e-signed-numbers': 2 } },
  {
    nom: 'assemblage-panneau-od32',
    vue: 'île',
    famille: 'assemblage',
    ile: 'french-6e-phonology',
    lieu: 'assembly',
    inventaire: { 'french-6e-phonology': 5, 'french-6e-letter-confusion': 3, 'maths-5e-signed-numbers': 2 },
    reglages: { font: 'opendyslexic', fontSize: 32 },
  },
  // Les mêmes, en hauteur, pour voir les deux cartes (« Assembler » actif, puis grisé) sans faire défiler.
  { nom: 'assemblage-panneau-haut', vue: 'île', famille: 'assemblage-panneau', ile: 'french-6e-phonology', lieu: 'assembly', inventaire: { 'french-6e-phonology': 5, 'french-6e-letter-confusion': 3, 'maths-5e-signed-numbers': 2 }, taille: { width: 1024, height: 1700 } },
  {
    nom: 'assemblage-panneau-od32-haut',
    vue: 'île',
    famille: 'assemblage-panneau',
    ile: 'french-6e-phonology',
    lieu: 'assembly',
    inventaire: { 'french-6e-phonology': 5, 'french-6e-letter-confusion': 3, 'maths-5e-signed-numbers': 2 },
    reglages: { font: 'opendyslexic', fontSize: 32 },
    taille: { width: 1024, height: 3000 },
  },
  { nom: 'assemblage-ile', vue: 'île', famille: 'assemblage', ile: 'maths-5e-proportionality', finesse: 2 },
  { nom: 'assemblage-kiosque', vue: 'île', famille: 'assemblage', ile: 'maths-5e-proportionality', lieu: 'landmark-5e-2', finesse: 2 },
  { nom: 'assemblage-phare-large', vue: 'île', famille: 'assemblage', ile: 'maths-5e-signed-numbers', lieu: 'landmark-5e-1', finesse: 2 },
  { nom: 'assemblage-amphitheatre', vue: 'île', famille: 'assemblage', ile: 'maths-4e-algebra', lieu: 'landmark-4e-2', finesse: 2 },
  { nom: 'assemblage-ile', vue: 'île', famille: 'assemblage', ile: 'maths-4e-algebra', finesse: 2 },
  { nom: 'assemblage-viaduc', vue: 'île', famille: 'assemblage', ile: 'maths-4e-algebra', lieu: 'landmark-4e-1', finesse: 2 },
  { nom: 'assemblage-ile', vue: 'île', famille: 'assemblage', ile: 'maths-3e-functions', finesse: 2 },
  { nom: 'assemblage-etoiles', vue: 'île', famille: 'assemblage', ile: 'maths-3e-functions', lieu: 'landmark-3e-1', finesse: 2 },
  // La pose d'une partie en vague (GD-6, Blocland, famille `pose`) : la cabane de Mousso, première partie du bâtiment de
  // la Forêt des sons, après « Voir le bâtiment » (`pose` : les missions de l'île terminées, la pose retenue pour la
  // visite) ; en cours (les pas d'après le monde construit), puis finie (`pasEnPlus`, 5 s plus tard), la phrase seule dans le panneau, avant le bandeau de succès.
  { nom: 'pose-en-cours', vue: 'île', famille: 'pose', ile: 'french-6e-phonology', partie: 'un-plan', pose: 1 },
  { nom: 'pose-finie', vue: 'île', famille: 'pose', ile: 'french-6e-phonology', partie: 'un-plan', pose: 1, pasEnPlus: 40 },
  // La même pose tenue à un moment (`poseA` : une part de sa durée, `window.__dysappsPoseA`, lu au lancement de la pose) : avant le premier
  // cube (0, dans Archipéo la ruine, la partie en pierre #7D8A86), à mi-chemin (0,5), puis menée à sa fin (1 : restaurée,
  // la construction dessinée telle qu'elle est), de jour et de nuit ; sur la Forêt des sons, la roche du 5e (l'échoppe de
  // Bazar) et le marbre des Îles du Ciel (la lanterne de Fi), pour juger la pierre sur chacune (fondu de la pose, choix
  // « 2c » du mainteneur, 4 octobre 2026).
  ...['french-6e-phonology', 'maths-5e-proportionality', 'maths-3e-functions'].flatMap((ile) =>
    [
      ['ruine', 0],
      ['mi', 0.5],
      ['restauree', 1],
    ].flatMap(([moment, poseA]) =>
      [{ suffixe: '' }, { suffixe: '-nuit', nuit: true }].map(({ suffixe, ...autres }) => ({
        nom: `pose-${moment}-${ile}${suffixe}`,
        vue: 'île',
        famille: 'pose',
        ile,
        partie: 'un-plan',
        pose: 1,
        poseA,
        ...autres,
      })),
    ),
  ),
  // La créature qui se souvient (GD-4, étape 1, famille `revisions`) : à la Ferme des accords, chaque mission a des
  // questions à revoir (`revisions`) ; la créature a fait son geste à l'arrivée (`pasEnPlus` : 3 s de plus), l'icône de la
  // notion est au-dessus d'elle et le panneau de l'île propose « Reprendre » ou « Plus tard », de jour et de nuit, puis
  // en téléphone et en grand texte, le panneau défilé jusqu'à la proposition (`voir`) ; de loin, la vue de l'archipel ;
  // en vue simple, la carte de l'île et sa plaque dans la Carte en liste (défilée jusqu'à elle, pas l'en-tête de la page).
  { nom: 'revisions-ile', vue: 'île', famille: 'revisions', ile: 'french-6e-grammar-spelling', revisions: true, pasEnPlus: 24 },
  { nom: 'revisions-ile-nuit', vue: 'île', famille: 'revisions', ile: 'french-6e-grammar-spelling', revisions: true, pasEnPlus: 24, nuit: true },
  {
    nom: 'revisions-ile-390x844-od32',
    vue: 'île',
    famille: 'revisions',
    ile: 'french-6e-grammar-spelling',
    revisions: true,
    pasEnPlus: 24,
    reglages: { font: 'opendyslexic', fontSize: 32 },
    taille: { width: 390, height: 844 },
    voir: '.creature-rappel',
  },
  { nom: 'revisions-archipel', vue: 'archipel', famille: 'revisions', ile: 'french-6e-grammar-spelling', revisions: true, pasEnPlus: 24 },
  { nom: 'revisions-vue-simple', vue: 'archipel', famille: 'revisions', ile: 'french-6e-grammar-spelling', revisions: true, view: 'list', voir: 'a.biome-french-6e-grammar-spelling' },
  // L'école et la salle des trophées des Premiers Rivages (lot 7b, les lieux du village) : la vue de la Forêt, sans
  // trophée et avec tous (`succes` : le nombre de succès gagnés, `tous` pour tous, un trophée chacun), de jour et de
  // nuit ; de près, recadrées (`finesse` 3 : le colombage net) ; de loin, la vue de l'archipel.
  { nom: 'lieux', vue: 'île', famille: 'lieux', ile: 'french-6e-phonology', succes: 'tous' },
  { nom: 'lieux-nuit', vue: 'île', famille: 'lieux', ile: 'french-6e-phonology', succes: 'tous', nuit: true },
  { nom: 'lieux-sans-trophee', vue: 'île', famille: 'lieux', ile: 'french-6e-phonology' },
  { nom: 'lieux-archipel', vue: 'archipel', famille: 'lieux', ile: 'french-6e-phonology', succes: 'tous' },
  { nom: 'lieux-archipel-nuit', vue: 'archipel', famille: 'lieux', ile: 'french-6e-phonology', succes: 'tous', nuit: true },
  // De près (famille `lieux-pres`) : l'école, puis la salle des trophées avec six trophées (les socles) et avec tous (la
  // salle et ses deux travées, GD-3 : le cadre s'élargit), de jour et de nuit.
  // L'école à sa place des « Trois bandes », de (12, 3) à (16, 6) (02/10/2026) : le cadre suit, la dernière borne à droite.
  { nom: 'lieux-ecole-pres', vue: 'île', famille: 'lieux-pres', ile: 'french-6e-phonology', recadre: { x: 90, y: 340, width: 240, height: 210 }, finesse: 3 },
  { nom: 'lieux-ecole-pres-nuit', vue: 'île', famille: 'lieux-pres', ile: 'french-6e-phonology', nuit: true, recadre: { x: 90, y: 340, width: 240, height: 210 }, finesse: 3 },
  { nom: 'lieux-trophees-six', vue: 'île', famille: 'lieux-pres', ile: 'french-6e-phonology', succes: 6, recadre: { x: 140, y: 170, width: 320, height: 250 }, finesse: 3 },
  { nom: 'lieux-trophees-six-nuit', vue: 'île', famille: 'lieux-pres', ile: 'french-6e-phonology', succes: 6, nuit: true, recadre: { x: 140, y: 170, width: 320, height: 250 }, finesse: 3 },
  { nom: 'lieux-trophees-tous', vue: 'île', famille: 'lieux-pres', ile: 'french-6e-phonology', succes: 'tous', recadre: { x: 140, y: 170, width: 320, height: 250 }, finesse: 3 },
  { nom: 'lieux-trophees-tous-nuit', vue: 'île', famille: 'lieux-pres', ile: 'french-6e-phonology', succes: 'tous', nuit: true, recadre: { x: 140, y: 170, width: 320, height: 250 }, finesse: 3 },
  // La salle de près (famille `lieux-salle`) : sans trophée (l'ouverture devant, le fond de velours), avec huit (le
  // second rang), avec dix-huit (une travée, GD-3), de jour et de nuit ; le fond de velours au plus près, par l'ouverture (la
  // caméra de l'île ne se tourne pas : on le voit de biais), avec deux trophées.
  { nom: 'lieux-trophees-vide', vue: 'île', famille: 'lieux-salle', ile: 'french-6e-phonology', recadre: { x: 140, y: 170, width: 320, height: 250 }, finesse: 3 },
  { nom: 'lieux-trophees-vide-nuit', vue: 'île', famille: 'lieux-salle', ile: 'french-6e-phonology', nuit: true, recadre: { x: 140, y: 170, width: 320, height: 250 }, finesse: 3 },
  { nom: 'lieux-trophees-huit', vue: 'île', famille: 'lieux-salle', ile: 'french-6e-phonology', succes: 8, recadre: { x: 140, y: 170, width: 320, height: 250 }, finesse: 3 },
  { nom: 'lieux-trophees-dix-huit', vue: 'île', famille: 'lieux-salle', ile: 'french-6e-phonology', succes: 18, recadre: { x: 140, y: 170, width: 320, height: 250 }, finesse: 3 },
  { nom: 'lieux-trophees-dix-huit-nuit', vue: 'île', famille: 'lieux-salle', ile: 'french-6e-phonology', succes: 18, nuit: true, recadre: { x: 140, y: 170, width: 320, height: 250 }, finesse: 3 },
  { nom: 'lieux-velours', vue: 'île', famille: 'lieux-salle', ile: 'french-6e-phonology', succes: 2, recadre: { x: 225, y: 285, width: 130, height: 110 }, finesse: 4 },
  { nom: 'lieux-velours-nuit', vue: 'île', famille: 'lieux-salle', ile: 'french-6e-phonology', succes: 2, nuit: true, recadre: { x: 225, y: 285, width: 130, height: 110 }, finesse: 4 },
  // La salle des trophées qui s'agrandit (GD-3, famille `salle`) : à la Forêt des sons, avec 0, 6, 12, 13, 18 et 24
  // succès (une travée au 13e, une autre au 19e), de jour et de nuit, de près (recadrée) et de loin (la vue de
  // l'archipel) ; la vue de l'île entière avec les 24 ; en téléphone, en grand texte, la salle et son panneau ouvert
  // (`lieu`), avec 13 et 24 succès ; puis la vue de chaque autre île-école avec les 24 (la salle de 8 × 3 et ce qui
  // l'entoure, la créature hors de sa vue) et le Marché de près, de jour, pour le profil de Bazar derrière la salle (le
  // cadre est estimé : à reprendre sur la première capture).
  ...[0, 6, 12, 13, 18, 24].flatMap((succes) => [
    { nom: `salle-${succes}`, vue: 'île', famille: 'salle', ile: 'french-6e-phonology', succes, recadre: { x: 140, y: 170, width: 320, height: 250 }, finesse: 2 },
    { nom: `salle-${succes}-nuit`, vue: 'île', famille: 'salle', ile: 'french-6e-phonology', succes, nuit: true, recadre: { x: 140, y: 170, width: 320, height: 250 }, finesse: 2 },
    { nom: `salle-${succes}-loin`, vue: 'archipel', famille: 'salle', ile: 'french-6e-phonology', succes },
    { nom: `salle-${succes}-loin-nuit`, vue: 'archipel', famille: 'salle', ile: 'french-6e-phonology', succes, nuit: true },
  ]),
  { nom: 'salle-24-ile', vue: 'île', famille: 'salle', ile: 'french-6e-phonology', succes: 24 },
  ...[13, 24].map((succes) => ({
    nom: `salle-${succes}-390x844-od32`,
    vue: 'île',
    famille: 'salle',
    ile: 'french-6e-phonology',
    lieu: 'trophies',
    succes,
    reglages: { font: 'opendyslexic', fontSize: 32 },
    taille: { width: 390, height: 844 },
  })),
  ...[['marche', 'maths-5e-proportionality'], ['atelier', 'maths-4e-algebra'], ['phare', 'maths-3e-functions']].flatMap(([court, ile]) => [
    { nom: `salle-24-${court}`, vue: 'île', famille: 'salle', ile, succes: 24 },
    { nom: `salle-24-${court}-nuit`, vue: 'île', famille: 'salle', ile, succes: 24, nuit: true },
  ]),
  { nom: 'salle-0-marche', vue: 'île', famille: 'salle', ile: 'maths-5e-proportionality' },
  { nom: 'salle-24-marche-pres', vue: 'île', famille: 'salle', ile: 'maths-5e-proportionality', succes: 24, recadre: { x: 140, y: 40, width: 380, height: 330 }, finesse: 2 },
  // Les îles-écoles au cœur de 20 × 20 (famille `ecoles`) : la vue de l'île de chacune, de jour, en tablette, puis en
  // téléphone portrait (390 × 844), pour juger le cadrage, les marges et l'îlot du Gardien (relectures du 01/10/2026).
  ...[['marche', 'maths-5e-proportionality'], ['atelier', 'maths-4e-algebra'], ['phare', 'maths-3e-functions'], ['foret', 'french-6e-phonology']].flatMap(([court, ile]) => [
    { nom: `ecole-${court}`, vue: 'île', famille: 'ecoles', ile },
    { nom: `ecole-${court}-390x844`, vue: 'île', famille: 'ecoles', ile, taille: { width: 390, height: 844 } },
  ]),
  // Les îles-écoles en trois bandes (famille `trois-bandes`, lot en cours, 02/10/2026) : au Marché et à l'Atelier, la zone
  // des plans avec le troisième plan à moitié posé (`cour-mi` : sa première rangée, au fond de la zone depuis ce lot) ; à
  // la Forêt, le lieu où l'on assemble (la Fabrique, ou la Halle aux matériaux dans Archipéo) près d'un plan posé
  // (`un-plan`), de jour et de nuit. La vue de l'île entière : le cadre serré se fixera sur ces premières captures.
  ...[['marche', 'maths-5e-proportionality'], ['atelier', 'maths-4e-algebra']].map(([court, ile]) => ({ nom: `trois-bandes-plans-${court}`, vue: 'île', famille: 'trois-bandes', ile, partie: 'cour-mi', finesse: 2 })),
  { nom: 'trois-bandes-assemblage', vue: 'île', famille: 'trois-bandes', ile: 'french-6e-phonology', partie: 'un-plan', finesse: 2 },
  { nom: 'trois-bandes-assemblage-nuit', vue: 'île', famille: 'trois-bandes', ile: 'french-6e-phonology', partie: 'un-plan', nuit: true, finesse: 2 },
  // Le port en étoile (GD-7, famille `etoile`, lot en cours) : une longue traversée en cours, de la Plaine à la Carrière
  // par le long bac du port (`allerA` : l'île touchée une fois la scène prête, `pasEnPlus` : le bonhomme au milieu du bac ;
  // le pont de la Mine retiré, sinon le plus court passe par lui), le panneau de la Carrière fermé (il attend l'arrivée,
  // le cadre fixe prend toute la vue), en tablette, en portrait, en téléphone (où la caméra suit le bonhomme : le cadre fixe y
  // serait trop petit, `ECHELLE_MIN_DE_LA_TRAVERSEE`) et en téléphone au grand texte ; une longue traversée
  // sur le pont du Phare au Château des hypothèses (3e), en tablette ; la vue de l'archipel au départ (`depart` : une partie neuve, les liaisons
  // du port à construire, la Carte : la vue d'ensemble) ; le panneau de la Plaine au départ avec 4 blocs (quatre ouvrages
  // constructibles, un seul « Construire » principal), en téléphone au grand texte, défilé jusqu'au bouton principal, puis
  // en hauteur pour voir toute la liste ; les deux ponts du Phare (3e) de près, de jour et de nuit.
  ...[
    { suffixe: '' },
    { suffixe: '-800x1280', taille: { width: 800, height: 1280 } },
    { suffixe: '-390x844', taille: { width: 390, height: 844 } },
    { suffixe: '-390x844-od32', taille: { width: 390, height: 844 }, reglages: { font: 'opendyslexic', fontSize: 32 } },
  ].map(({ suffixe, ...autres }) => ({
    nom: `etoile-traversee${suffixe}`,
    vue: 'île',
    famille: 'etoile',
    ile: 'maths-6e-calculation',
    allerA: 'french-6e-word-spelling',
    sansPonts: ['french-6e-letter-confusion-french-6e-word-spelling'],
    pasEnPlus: 24,
    ...autres,
  })),
  { nom: 'etoile-traversee-3e', vue: 'île', famille: 'etoile', ile: 'maths-3e-functions', allerA: 'english-3e-grammar', pasEnPlus: 24 },
  { nom: 'etoile-depart', vue: 'carte', famille: 'etoile', ile: 'maths-6e-calculation', depart: true },
  ...[
    { suffixe: '', taille: { width: 390, height: 844 }, voir: '.bridges-list .button.primary' },
    { suffixe: '-haut', taille: { width: 390, height: 3200 } },
  ].map(({ suffixe, ...autres }) => ({
    nom: `etoile-plaine-390x844-od32${suffixe}`,
    vue: 'île',
    famille: 'etoile',
    ile: 'maths-6e-calculation',
    depart: true,
    inventaire: { 'french-6e-phonology': 4 },
    reglages: { font: 'opendyslexic', fontSize: 32 },
    ...autres,
  })),
  // La Carte qui désigne un ouvrage (GD-7, PR 2) : une partie neuve (`depart`) où la Forêt et la Plaine ont toutes leurs
  // missions jouées (`jouees` : sinon l'île où se tient le bonhomme reste la destination), aucune autre île ouverte, et 4
  // blocs de bois (`inventaire`) qui paient un ouvrage. Depuis la Forêt (`ile`, où se tient le bonhomme), la flèche se
  // pose au-dessus du pont vers l'Horloge des verbes (il ouvre une île d'anglais), en tablette, en téléphone et en
  // téléphone au grand texte ; depuis la Plaine, au-dessus du long bac vers la Tour du lecteur (une île de français) ;
  // un ouvrage court sous l'étiquette de son île de départ (la règle du directeur artistique, PR 2) : le pont de la
  // Forêt vers la Ferme des accords, quand l'Horloge et la Mine sont ouvertes (`liens`) et jouées (`xp` : au début du
  // niveau 40, pour que les parties posées au chargement n'annoncent pas un niveau par-dessus le panneau).
  // Pas de vue en 2D : le réglage n'existe plus (`2d` se lit `3d`, core/settings.ts).
  ...[
    { suffixe: '' },
    { suffixe: '-390x844', taille: { width: 390, height: 844 } },
    { suffixe: '-390x844-od32', taille: { width: 390, height: 844 }, reglages: { font: 'opendyslexic', fontSize: 32 } },
    { suffixe: '-plaine', ile: 'maths-6e-calculation' },
    {
      suffixe: '-ferme',
      liens: ['french-6e-phonology-english-6e-grammar', 'french-6e-phonology-french-6e-letter-confusion'],
      jouees: ['french-6e-phonology', 'maths-6e-calculation', 'english-6e-grammar', 'french-6e-letter-confusion'],
      xp: 20475,
    },
  ].map(({ suffixe, ...autres }) => ({
    nom: `etoile-carte-ouvrage${suffixe}`,
    vue: 'carte',
    famille: 'etoile',
    ile: 'french-6e-phonology',
    depart: true,
    jouees: ['french-6e-phonology', 'maths-6e-calculation'],
    inventaire: { 'french-6e-phonology': 4 },
    ...autres,
  })),
  // Plus de barre du haut, le menu en trois traits, Recentrer à la tête du bonhomme (famille `menu-tete`, mot du
  // mainteneur du 4 octobre 2026), à retirer une fois le lot fusionné : une page hors du monde (`page` : son adresse
  // `chemin`), les Réglages, les Missions, le français (un lien retour), Succès et le menu du village (plein écran, Réglages en bas), sur téléphone (aussi en grand texte) et en tablette ; le monde au départ,
  // son bouton Menu ; la Carte zoomée, Recentrer en rond à visage.
  ...[
    { suffixe: '', taille: { width: 390, height: 844 } },
    { suffixe: '-grand-texte', taille: { width: 390, height: 844 }, reglages: { font: 'opendyslexic', fontSize: 32 } },
    { suffixe: '-tablette' },
  ].flatMap(({ suffixe, ...autres }) => [
    { nom: `menu-tete-reglages${suffixe}`, vue: 'page', chemin: '/reglages', famille: 'menu-tete', ...autres },
    { nom: `menu-tete-missions${suffixe}`, vue: 'page', chemin: '/quetes', famille: 'menu-tete', ...autres },
    { nom: `menu-tete-matiere${suffixe}`, vue: 'page', chemin: '/matiere/french', famille: 'menu-tete', ...autres },
    { nom: `menu-tete-succes${suffixe}`, vue: 'page', chemin: '/succes', famille: 'menu-tete', ...autres },
    { nom: `menu-tete-menu${suffixe}`, vue: 'page', chemin: '/adventure/menu', famille: 'menu-tete', ...autres },
    { nom: `menu-tete-ile${suffixe}`, vue: 'île', famille: 'menu-tete', ile: 'french-6e-phonology', depart: true, ...autres },
    { nom: `menu-tete-carte-zoomee${suffixe}`, vue: 'carte', famille: 'menu-tete', zoomer: 2, ...autres },
  ]),
  { nom: 'etoile-phare-ponts', vue: 'archipel', famille: 'etoile', ile: 'maths-3e-functions', finesse: 2 },
  { nom: 'etoile-phare-ponts-nuit', vue: 'archipel', famille: 'etoile', ile: 'maths-3e-functions', finesse: 2, nuit: true },
  // Les commandes des habitants (GD-7, PR 3, famille `commandes`, lot en cours) : à la Mine des lettres, la commande de
  // Tunel (4 briques) prête et suggérée (`commandes` : les commandes arrivées, `inventaire` : les briques), la plaque
  // avec la brique au-dessus de lui, de jour et de nuit ; le puits posé (`posees`), de jour et de nuit ; la vague de la
  // pose, « Livrer » touché (`cliquer`), à mi-chemin ; la Tour du lecteur de nuit, la lanterne de Grimoire posée ; le
  // panneau de l'île avec ses trois commandes (tablette, téléphone au grand texte), le menu, la vue de l'archipel ; puis
  // chaque archipel avec toutes ses petites constructions posées, de près, et (famille `commandes-iles`) chaque île
  // qui en porte une.
  ...[
    { suffixe: '' },
    { suffixe: '-nuit', nuit: true },
  ].flatMap(({ suffixe, ...autres }) => [
    { nom: `commandes-plaque${suffixe}`, vue: 'île', ile: 'french-6e-letter-confusion', commandes: ['french-6e-letter-confusion-request-1'], pasEnPlus: 24, ...autres },
    { nom: `commandes-puits${suffixe}`, vue: 'île', ile: 'french-6e-letter-confusion', posees: ['french-6e-letter-confusion-fixture-1'], ...autres },
  ]).map((c) => ({ famille: 'commandes', inventaire: c.commandes ? { 'maths-6e-calculation': 4 } : undefined, finesse: 2, ...c })),
  {
    nom: 'commandes-pose-en-cours',
    vue: 'île',
    famille: 'commandes',
    ile: 'french-6e-letter-confusion',
    commandes: ['french-6e-letter-confusion-request-1'],
    inventaire: { 'maths-6e-calculation': 4 },
    cliquer: '.commandes-list .button.primary',
    pasEnPlus: 13,
    finesse: 2,
  },
  { nom: 'commandes-tour-nuit', vue: 'île', famille: 'commandes', ile: 'french-6e-reading', posees: ['french-6e-reading-fixture-1'], nuit: true, finesse: 2 },
  ...[
    { suffixe: '' },
    { suffixe: '-390x844-od32', taille: { width: 390, height: 844 }, reglages: { font: 'opendyslexic', fontSize: 32 } },
  ].map(({ suffixe, ...autres }) => ({
    nom: `commandes-panneau${suffixe}`,
    vue: 'île',
    famille: 'commandes',
    ile: 'french-6e-letter-confusion',
    commandes: ['french-6e-phonology-request-1', 'french-6e-letter-confusion-request-1', 'maths-6e-calculation-request-1'],
    inventaire: { 'maths-6e-calculation': 4, 'french-6e-grammar-spelling': 1 },
    voir: '.commandes-list',
    ...autres,
  })),
  {
    nom: 'commandes-menu',
    vue: 'île',
    famille: 'commandes',
    ile: 'french-6e-letter-confusion',
    lieu: 'menu',
    commandes: ['french-6e-phonology-request-1', 'french-6e-letter-confusion-request-1', 'maths-6e-calculation-request-1'],
    inventaire: { 'maths-6e-calculation': 4, 'french-6e-grammar-spelling': 1 },
    voir: '.commandes-list',
  },
  {
    nom: 'commandes-archipel',
    vue: 'archipel',
    famille: 'commandes',
    ile: 'french-6e-letter-confusion',
    commandes: ['french-6e-phonology-request-1', 'french-6e-letter-confusion-request-1', 'maths-6e-calculation-request-1'],
    inventaire: { 'maths-6e-calculation': 4, 'french-6e-grammar-spelling': 1 },
  },
  ...[
    ['6e', 'french-6e-letter-confusion'],
    ['5e', 'maths-5e-proportionality'],
    ['4e', 'maths-4e-algebra'],
    ['3e', 'maths-3e-functions'],
  ].map(([a, ile]) => ({ nom: `commandes-toutes-${a}`, vue: 'archipel', famille: 'commandes', ile, posees: 'toutes', finesse: 2 })),
  ...[
    'french-6e-phonology', 'french-6e-letter-confusion', 'french-6e-word-spelling', 'french-6e-grammar-spelling', 'french-6e-reading', 'maths-6e-calculation',
    'maths-6e-fractions', 'maths-6e-decimals', 'english-6e-vocabulary', 'english-6e-grammar', 'maths-5e-signed-numbers', 'maths-5e-proportionality',
    'french-5e-homophones', 'french-5e-conjugation', 'english-5e-vocabulary', 'english-5e-grammar', 'maths-4e-powers', 'maths-4e-algebra',
    'french-4e-agreement', 'french-4e-vocabulary', 'english-4e-comprehension', 'english-4e-grammar', 'maths-3e-geometry', 'maths-3e-statistics',
    'maths-3e-functions', 'french-3e-close-reading', 'english-3e-comprehension', 'english-3e-grammar',
  ].map((ile) => ({ nom: `commandes-ile-${ile}`, vue: 'île', famille: 'commandes-iles', ile, posees: 'toutes' })),
];
/** La lueur la nuit, à la vue île : au plus 3 % de la scène. */
const LUEUR_MAX = 0.03;
/**
 * Un pixel de lueur : un jaune chaud et clair, proche de `#FFD866` (world/construction.ts, `LUEUR`), que la brume peut
 * un peu voiler. Le compte se fait dans une page vide, sur la capture de la scène seule (sans les panneaux).
 */
const estUneLueur = '(r, g, b) => r >= 220 && g >= 170 && b <= 170 && r - b >= 90';
async function partDeLueur(outil, png) {
  return outil.evaluate(
    async ({ b64, test }) => {
      const img = new Image();
      img.src = `data:image/png;base64,${b64}`;
      await img.decode();
      const c = document.createElement('canvas');
      c.width = img.width;
      c.height = img.height;
      const g = c.getContext('2d');
      g.drawImage(img, 0, 0);
      const d = g.getImageData(0, 0, c.width, c.height).data;
      const lueur = new Function(`return ${test}`)();
      let n = 0;
      for (let i = 0; i < d.length; i += 4) if (lueur(d[i], d[i + 1], d[i + 2])) n++;
      return n / (c.width * c.height);
    },
    { b64: png.toString('base64'), test: estUneLueur },
  );
}

const FAMILLES = option('--familles')?.split(',') ?? null;

// ---------- Le poids de Three.js dans le paquet ----------

async function weights() {
  const out = mkdtempSync(join(tmpdir(), 'dysapps-mesures-'));
  try {
    await build({ root, logLevel: 'error', build: { outDir: out, emptyOutDir: true } });
    const dir = join(out, 'assets');
    const js = readdirSync(dir).filter((f) => f.endsWith('.js'));
    const size = (f) => {
      const buf = readFileSync(join(dir, f));
      return { file: f, raw: statSync(join(dir, f)).size, gzip: gzipSync(buf).length, three: /REVISION\s*=\s*"\d+"|WebGLRenderer/.test(buf.toString()) };
    };
    return js.map(size).sort((a, b) => b.raw - a.raw);
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
}

// ---------- Les appels de dessin et les triangles ----------

/**
 * Une partie sans les îles `iles` : ni leurs étoiles, ni leurs plans (clés « <île>-… »). Sans elles, le jeu ne rouvre pas
 * l'île au chargement (`sansPonts` peut alors retirer le pont qui y mène : une île où l'on a joué reste ouverte).
 */
function sansLesIles(parCle, iles) {
  if (!iles?.length) return parCle;
  return Object.fromEntries(Object.entries(parCle).filter(([k]) => !iles.some((i) => k.startsWith(`${i}-`))));
}

/** Le panneau de l'île ouvert par son bouton (il ne s'ouvre jamais tout seul), quand `selecteur` n'est pas déjà à l'écran. */
async function ouvrirLePanneauPour(page, selecteur) {
  if (await page.locator(selecteur).count()) return;
  const bouton = page.getByRole('button', { name: /^Ouvrir le panneau de / });
  if (!(await bouton.count())) return;
  await bouton.first().click();
  await page.clock.runFor(125);
  await page.waitForTimeout(100);
}

/**
 * L'adresse d'une capture déclarée : le défi de chaque île (`parIle`), la vue d'un monument (`lieu`), une île ou le défi
 * de son Gardien (`ile`), sinon la route de la vue, le bonhomme là où la partie le pose (`routes`).
 */
function routeDe(c, parIle, routes) {
  if (parIle) return `/adventure/${parIle}/challenge`;
  if (c.vue === 'page') return c.chemin;
  if (c.pose) return `/adventure/${c.ile}?worksite=part`;
  if (c.lieu) return `/adventure/${c.lieu}`;
  if (c.ile && c.vue === 'île') return `/adventure/${c.ile}`;
  if (c.ile && (c.vue === 'défi' || c.vue === 'bulle')) return `/adventure/${c.ile}/challenge`;
  return routes[c.vue];
}

/**
 * Les questions à revoir aujourd'hui (GD-4, étape 1) : une par exercice joué de l'île `ile`, dues depuis longtemps, quel
 * que soit le jour de l'horloge pilotée. La clé de la question n'a pas à exister : la créature ne lit que l'exercice.
 */
function revisionsDues(progress, ile) {
  return Object.keys(progress)
    .filter((id) => id.startsWith(`${ile}-`) && !id.endsWith('-challenge'))
    .map((id) => ({ itemId: `${id}:revision`, due: '2000-01-01', stage: 0, streak: 0 }));
}

/** Une partie où le Gardien de l'île `ile` n'est pas encore vaincu (sa clé « <lieu>-challenge » retirée) : il est debout. */
function sansLeGardien(parCle, ile) {
  if (!ile) return parCle;
  return Object.fromEntries(Object.entries(parCle).filter(([k]) => k !== `${ile}-challenge`));
}

async function scenes() {
  // Le build a passé le processus en production : le compteur ne s'exposerait pas (import.meta.env.DEV).
  process.env.NODE_ENV = 'development';
  const server = await createServer({ root, logLevel: 'error', server: { port: 5288, strictPort: false, hmr: false } });
  await server.listen();
  const base = server.resolvedUrls.local[0].replace(/\/$/, '');
  const load = (p) => server.ssrLoadModule(p);
  const [{ BIOMES, missionsJouables }, { ARCHIPELAGO_IDS }, { toutConstruit }, { plansFor, planCells }, { BADGES, sanitizeProgress }, { exercisesOf }] = await Promise.all([
    load('/src/blocland/biomes.ts'),
    load('/src/blocland/world/map.ts'),
    load('/src/blocland/world/budget.ts'),
    load('/src/blocland/world/plans.ts'),
    load('/src/core/progress.ts'),
    load('/src/blocland/exercises/index.ts'),
  ]);
  const { PETITES_CONSTRUCTIONS, casesDeLaPetiteConstruction } = await load('/src/blocland/world/petitesConstructions.ts');
  /** Une partie où les îles `iles` ont chacune toutes leurs missions jouées une fois (`jouees`), le premier exercice de chacune. */
  const missionsJouees = (iles) =>
    Object.fromEntries(
      iles.flatMap((ile) => missionsJouables(BIOMES.find((b) => b.id === ile)).map((m) => [exercisesOf(ile, m.id)[0].id, { stars: 2, attempts: 1, best: 0.8 }])),
    );
  /**
   * Une partie où l'île `ile` n'a que ses `n` premières missions terminées (la pose d'une partie, `pose` ; des bornes
   * encore à faire, `missions`) : ses autres exercices et son défi sont retirés, sans quoi l'ouverture poserait aussitôt
   * les parties suivantes.
   */
  const premieresMissions = (parCle, ile, n) => {
    if (!ile) return parCle;
    const types = BIOMES.find((b) => b.id === ile).exercises.slice(0, n).map((x) => `${ile}-${x.id}-`);
    return Object.fromEntries(Object.entries(parCle).filter(([k]) => !k.startsWith(`${ile}-`) || types.some((t) => k.startsWith(t))));
  };
  /**
   * Les succès déjà gagnés d'une partie où les îles `iles` ont leurs missions jouées (`jouees`) : ceux des 20 000 points
   * et de leurs bâtiments, que le jeu pose au chargement (une partie par mission), sans quoi leur bandeau « Succès
   * débloqué » couvrirait la vue.
   */
  const succesMerites = (iles) => {
    const p = sanitizeProgress({ xp: 20000, structuresCompleted: iles.reduce((n, ile) => n + plansFor(ile).length, 0) });
    return Object.fromEntries(BADGES.filter((b) => b.earned(p)).map((b) => [b.id, '2026-09-28T10:00:00.000Z']));
  };
  /** Les succès gagnés d'une capture (`succes` : leur nombre, ou `tous`), un trophée chacun dans la salle des trophées. */
  const succesDe = (n) => Object.fromEntries(BADGES.slice(0, n === 'tous' ? BADGES.length : (n ?? 0)).map((b) => [b.id, '2026-09-28T10:00:00.000Z']));
  // La même partie tout construite que le test du budget (world/budget.test.ts).
  const { progress, world: built } = toutConstruit();
  /** Les cases des petites constructions posées (GD-7, PR 3) : `posees`, leurs identifiants, ou `toutes`. */
  const petitesConstructions = (posees) =>
    Object.fromEntries(
      (posees === 'toutes' ? PETITES_CONSTRUCTIONS : (posees ?? [])).map((id) => [id, casesDeLaPetiteConstruction(id).map((k) => k.key)]),
    );
  /** Les plans d'une partie changée (voir `CAPTURES`, `partie`). */
  const plansDe = (partie, ile) => {
    const plans = { ...built.parts };
    // Avant : aucun plan de l'île posé.
    if (partie === 'avant') for (const p of plansFor(ile)) delete plans[p.id];
    if (partie === 'chantier')
      for (const b of BIOMES) {
        const l = plansFor(b.id);
        if (l.length) delete plans[l[l.length - 1].id];
      }
    // Sur chaque île : le premier plan posé, rien après.
    if (partie === 'un-plan')
      for (const b of BIOMES) plansFor(b.id).forEach((p, i) => i > 0 && delete plans[p.id]);
    // Sur chaque île : les plans d'avant posés, la moitié de celui-ci (0 : les murs, 1 : le toit, 2 : la cour), rien après.
    const moitie = { 'murs-mi': 0, 'toit-mi': 1, 'cour-mi': 2 }[partie];
    if (moitie !== undefined)
      for (const b of BIOMES) {
        const l = plansFor(b.id);
        if (l.length <= moitie) continue;
        l.forEach((p, i) => {
          if (i >= moitie) delete plans[p.id];
        });
        const cells = planCells(l[moitie]).map((c) => c.key);
        plans[l[moitie].id] = cells.filter((_, i) => i % 2 === 0);
      }
    if (partie === 'tour-avant' || partie === 'tour-debut' || partie === 'tour-mi') {
      const l = plansFor('french-6e-reading');
      // Avant : aucun plan posé ; au début : la moitié du premier (les murs) ; pendant : le premier posé, la moitié du
      // deuxième (le toit).
      const faits = partie === 'tour-mi' ? 1 : 0;
      l.forEach((p, i) => {
        if (i >= faits) delete plans[p.id];
      });
      if (faits < l.length && partie !== 'tour-avant') {
        const cells = planCells(l[faits]).map((c) => c.key);
        plans[l[faits].id] = cells.slice(0, Math.floor(cells.length / 2));
      }
    }
    return plans;
  };

  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || undefined,
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
  });
  if (SHOTS) mkdirSync(SHOTS, { recursive: true });
  // Une page vide, pour compter les pixels de lueur des captures de nuit.
  const outil = await browser.newPage();
  const rows = [];
  for (const a of ARCHIPELAGO_IDS.filter((id) => !ONLY || id === ONLY)) {
    const at = BIOMES.find((b) => b.classe === a).id;
    const routes = { île: `/adventure/${at}`, archipel: '/adventure', carte: '/adventure/map', défi: `/adventure/${at}/challenge`, bulle: `/adventure/${at}/challenge` };
    const iles = BIOMES.filter((b) => b.classe === a).map((b) => b.id);
    const classe = (id) => BIOMES.find((b) => b.id === id).classe;
    // Les mesures : les trois vues de jour en 3D. Avec `--captures`, toutes les captures déclarées (voir `CAPTURES`).
    const views = [
      ...['île', 'archipel', 'carte'].map((vue) => ({ vue, go: routes[vue], mesure: true, nom: CAPTURES.find((c) => c.vue === vue && c.famille === 'jour').nom })),
      ...(SHOTS
        ? CAPTURES.filter((c) => c.famille !== 'jour' && (!FAMILLES || FAMILLES.includes(c.famille)) && (!c.ile || classe(c.ile) === a)).flatMap((c) =>
            (c.parIle ? iles : [null]).map((parIle) => ({
              vue: c.vue,
              go: routeDe(c, parIle, routes),
              ile: c.ile,
              plans: c.partie ? plansDe(c.partie, c.ile) : null,
              bridges: c.sansPonts ? built.links.filter((id) => !c.sansPonts.includes(id)) : null,
              time: c.nuit ? NIGHT : DAY,
              view: c.view,
              sansEtoiles: c.sansEtoiles,
              lv2: c.lv2,
              taille: c.taille,
              recadre: c.recadre,
              sansIles: c.sansIles === 'autres-classes' ? BIOMES.filter((b) => b.classe !== classe(c.ile)).map((b) => b.id) : c.sansIles,
              debout: c.debout,
              reglages: c.reglages,
              inventaire: c.inventaire,
              depuis: c.depuis,
              fige: c.fige,
              succes: c.succes,
              finesse: c.finesse,
              pose: c.pose,
              missions: c.missions,
              pasEnPlus: c.pasEnPlus,
              poseA: c.poseA,
              revisions: c.revisions,
              voir: c.voir,
              allerA: c.allerA,
              depart: c.depart,
              jouees: c.jouees,
              liens: c.liens,
              xp: c.xp,
              commandes: c.commandes,
              posees: c.posees,
              cliquer: c.cliquer,
              fiche: c.fiche,
              zoomer: c.zoomer,
              nom: parIle ? `${c.nom}-${parIle}` : c.nom,
            })),
          )
        : []),
    ];
    for (const { vue, go, time = DAY, view = '3d', sansEtoiles, nom, mesure, ile, plans, bridges, lv2, taille, recadre, sansIles, depuis, fige, finesse, debout, reglages, succes, inventaire, pose, poseA, missions, pasEnPlus, revisions, voir, allerA, depart, jouees, liens, xp, commandes, posees, cliquer, fiche, zoomer } of views) {
      const page = await browser.newPage({ viewport: taille ?? TABLET, deviceScaleFactor: finesse ?? (recadre ? 1.5 : 1), ...(fige ? { reducedMotion: 'reduce' } : {}) });
      await piloterLHorloge(page, time);
      await page.addInitScript(hasardFixe);
      // La pose d'une partie tenue à un moment (`poseA`), lue par la scène au lancement de la pose (three/WorldCanvas.tsx).
      if (poseA !== undefined) await page.addInitScript((part) => (window.__dysappsPoseA = part), poseA);
      await page.addInitScript(figeable);
      await page.goto(`${base}/icon.svg`);
      await page.evaluate(
        ({ world, progress, view, univers, lv2, reglages, badges, inventaire, pose, spaced, depart, jouees, xp }) => {
          localStorage.clear();
          sessionStorage.removeItem('dysapps:poses-montrees');
          sessionStorage.removeItem('dysapps:revisions-plus-tard');
          // La pose à montrer (GD-6), comme la retient « Voir le bâtiment » (src/blocland/poseAMontrer.ts).
          if (pose) sessionStorage.setItem('dysapps:pose', JSON.stringify(pose));
          else sessionStorage.removeItem('dysapps:pose');
          sessionStorage.setItem('dysapps:title-seen', '1');
          localStorage.setItem('dysapps:settings', JSON.stringify({ worldView: view, ...(univers ? { univers } : {}), ...(lv2 ? { lv2 } : {}), ...(reglages ?? {}) }));
          localStorage.setItem('dysapps:tutorials', JSON.stringify({ 'village-immersif': true, 'archipel-5e': true, 'archipel-4e': true, 'archipel-3e': true }));
          localStorage.setItem('dysapps:region-names', JSON.stringify({ said: true }));
          // Au départ, le mot d'arrivée de la créature est déjà dit : il couvrirait la vue. Avec des missions jouées
          // (`jouees`), rien n'est posé : le jeu tient alors pour dits tous les mots déjà mérités (« Chantier fini »…).
          if (depart && !jouees) localStorage.setItem('dysapps:guide-messages', JSON.stringify({ 'baleine-6e-arrivee': true }));
          localStorage.setItem('dysapps:game', JSON.stringify({ version: 3, stock: inventaire ?? {}, progress, world, spaced }));
          localStorage.setItem('dysapps:progress', JSON.stringify({ xp: xp ?? 20000, badges }));
        },
        {
          // Au départ (`depart`) : une partie neuve, rien de construit ni de joué (sauf les missions des îles `jouees` et
          // les ouvrages `liens`).
          world: depart
            ? { parts: {}, log: [], links: liens ?? [], place: ile ?? at }
            : {
                ...built,
                parts: { ...sansLesIles(plans ?? built.parts, sansIles), ...petitesConstructions(posees) },
                ...(bridges ? { links: bridges } : {}),
                ...(commandes ? { requests: commandes } : {}),
                place: depuis ?? ile ?? at,
              },
          progress: jouees ? missionsJouees(jouees) : sansEtoiles || depart ? {} : premieresMissions(sansLeGardien(sansLesIles(progress, sansIles), debout), pose || missions !== undefined ? ile : null, pose ?? missions),
          pose: pose ? { biome: ile, rangs: Array.from({ length: pose }, (_, i) => i + 1) } : null,
          view,
          univers: UNIVERS_DES_TEXTES,
          lv2,
          reglages,
          inventaire,
          badges: jouees ? succesMerites(jouees) : succesDe(succes),
          spaced: revisions ? revisionsDues(progress, ile) : [],
          depart,
          jouees,
          xp,
        },
      );
      await page.goto(`${base}/${QUERY}#${go}`);
      const file = SHOTS && join(SHOTS, `${a}-${nom}.jpg`);
      if (!mesure) {
        // Les autres captures (nuit, personnages, chantier, ponts) : pas de mesure, seulement l'image.
        await preparerLaScene(page, VUES_SANS_MONDE.has(vue) || view === 'list' ? 0 : WAIT);
        // Une île touchée une fois la scène prête (`allerA`) : le bonhomme part, la caméra prend le trajet.
        if (allerA) await page.evaluate((id) => (location.hash = `#/adventure/${id}`), allerA);
        // Un bouton touché une fois la scène prête (`cliquer` : « Livrer », GD-7), qui lance une vague de pose ; dans le
        // panneau de l'île, qui ne s'ouvre que par son bouton.
        if (cliquer) {
          await ouvrirLePanneauPour(page, cliquer);
          await page.locator(cliquer).first().click();
        }
        // La fiche d'un objet ouverte une fois la scène prête (`fiche`, Toucher le monde, lot 2), comme d'un toucher :
        // le temps que la caméra glisse pour la laisser voir (16 pas, deux secondes de la scène).
        if (fiche) await page.evaluate((objet) => window.__dysappsFiche?.(objet), fiche);
        // La Carte zoomée (`zoomer`) : la touche +, le monde ayant le focus, autour du centre de la place libre.
        if (zoomer) {
          await page.locator('.voxel-canvas').first().focus();
          for (let i = 0; i < zoomer; i++) await page.keyboard.press('+');
        }
        // Plus loin dans le temps de la scène (la pose finie, par exemple), du même pas que la préparation.
        for (let i = 0; i < (pasEnPlus ?? (fiche || zoomer ? 16 : 0)); i++) {
          await page.clock.runFor(125);
          await page.waitForTimeout(30);
        }
        // Après un trajet lancé (`allerA`) ou une fiche ouverte (`fiche`, la caméra recadrée hors d'elle) : la caméra posée
        // d'un coup à son cadrage, comme à la préparation (un pas de plus entre les deux, pour que les étiquettes suivent,
        // calculées pour ce cadrage : sans quoi une étiquette passe encore sous la fiche pendant le glissement).
        if (allerA || fiche)
          for (let i = 0; i < 2; i++) {
            await page.evaluate(() => window.__dysappsCamera?.poser());
            await page.clock.runFor(125);
            await page.waitForTimeout(30);
          }
        // Un élément du panneau de l'île (`voir`) : le panneau ne s'ouvre que par son bouton, dans la barre du bas.
        if (voir) await ouvrirLePanneauPour(page, voir);
        // Un élément à montrer plus bas (dans la page ou dans un panneau qui défile) : on y fait défiler, sans animation.
        if (voir) await page.locator(voir).first().evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
        await capturer(page, { path: file, type: 'jpeg', quality: 85, timeout: 90000, ...(recadre ? { clip: recadre } : {}) });
        if (time === NIGHT && view === '3d') {
          // La part de lueur, sur la scène seule (le canvas, sans les panneaux ni les boutons autour) : les boutons posés
          // sur la scène (le lieu choisi, jaune) sont masqués le temps de la prise, sinon ils compteraient comme lueur.
          // Depuis ce masquage, la part de lueur des archipels déjà mesurés baisse un peu : le bouton n'y compte plus.
          await page.addStyleTag({ content: 'body * { visibility: hidden !important } .voxel-canvas canvas { visibility: visible !important }' });
          const box = await page.locator('.voxel-canvas').boundingBox();
          const png = box && (await capturer(page, { type: 'png', clip: box, timeout: 90000 }));
          if (png) lueurs.push({ archipel: a, nom, vue, part: await partDeLueur(outil, png) });
        }
        await page.close();
        continue;
      }
      try {
        // Le monde se construit en quelques secondes (rendu logiciel) ; l'horloge pilotée le fait avancer pas à pas.
        if (!(await preparerLaScene(page, WAIT))) throw new Error(`aucun monde 3D en ${WAIT / 1000} s`);
        const s = await page.evaluate(() => ({ ...window.__dysappsRendu }));
        if (!s.calls) throw new Error('aucune image dessinée');
        rows.push({ archipel: a, vue, ...s });
        if (file) await capturer(page, { path: file, type: 'jpeg', quality: 85, timeout: 90000 });
      } catch (e) {
        rows.push({ archipel: a, vue, erreur: e.message.split('\n')[0] });
      }
      await page.close();
    }
  }
  if (SHOTS && REFERENCES) {
    const { changees, inchangees, sansAvant } = await comparer(outil, REFERENCES, SHOTS);
    console.log(`\nComparaison avec ${REFERENCES} : ${changees.length} changées (planches dans ${join(SHOTS, 'planches')}), ${inchangees.length} inchangées, ${sansAvant.length} sans référence ; détail dans ${join(SHOTS, 'comparaison.md')}.`);
  }
  await browser.close();
  await server.close();
  return rows;
}

/** Les parts de lueur des captures de nuit en 3D. */
const lueurs = [];

// Le build d'abord : le serveur de développement le passerait en mode développement.
const js = process.argv.includes('--sans-poids') ? null : await weights();
const rows = await scenes();
console.log('\n| Archipel | Vue | Appels de dessin | Triangles | Géométries | Textures | Images/s (horloge pilotée, non mesuré) |');
console.log('| --- | --- | ---: | ---: | ---: | ---: | ---: |');
for (const r of rows) {
  if (r.erreur) console.log(`| ${r.archipel} | ${r.vue} | ${r.erreur} | | | | |`);
  else console.log(`| ${r.archipel} | ${r.vue} | ${r.calls} | ${r.triangles.toLocaleString('fr-FR')} | ${r.geometries} | ${r.textures} | ${r.fps} |`);
}
if (lueurs.length) {
  console.log(`\n| Archipel | Capture de nuit | Part de lueur | Vue île : au plus ${LUEUR_MAX * 100} % |`);
  console.log('| --- | --- | ---: | --- |');
  for (const l of lueurs)
    console.log(`| ${l.archipel} | ${l.nom} | ${(l.part * 100).toFixed(2).replace('.', ',')} % | ${l.vue === 'île' ? (l.part <= LUEUR_MAX ? 'oui' : 'NON') : ''} |`);
}
if (js) {
  console.log('\n| Fichier | Poids | Compressé (gzip) | Three.js |');
  console.log('| --- | ---: | ---: | --- |');
  for (const f of js.slice(0, 6)) console.log(`| ${f.file} | ${kilo(f.raw)} | ${kilo(f.gzip)} | ${f.three ? 'oui' : ''} |`);
}
// 1 : une vue en erreur ; 2 : seulement une lueur de nuit au-dessus du plafond (la CI des références garde alors ses captures).
process.exit(rows.some((r) => r.erreur) ? 1 : lueurs.some((l) => l.vue === 'île' && l.part > LUEUR_MAX) ? 2 : 0);
